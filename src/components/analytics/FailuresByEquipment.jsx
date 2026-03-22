import { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  Legend,
} from "recharts";
import { getFailuresByEquipment } from "../../services/analyticsService";

const toNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

function daysBetween(a, b) {
  try {
    const da = new Date(a);
    const db = new Date(b);
    if (Number.isNaN(da.getTime()) || Number.isNaN(db.getTime())) return null;
    const diff = Math.abs(db.getTime() - da.getTime());
    return Math.round(diff / 86400000);
  } catch {
    return null;
  }
}

function fmtDateTime(d) {
  if (!d) return "—";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "—";
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  const hh = String(dt.getHours()).padStart(2, "0");
  const mi = String(dt.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy}, ${hh}:${mi}`;
}

function useElementWidth() {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      const next = Math.floor(el.getBoundingClientRect().width || 0);
      setWidth(next);
    };

    update();

    const ro = new ResizeObserver(() => {
      update();
    });

    ro.observe(el);
    window.addEventListener("resize", update);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  return { ref, width };
}

function Tag({ children, tone = "gray" }) {
  const bg =
    tone === "red"
      ? "#fee2e2"
      : tone === "amber"
      ? "#fef3c7"
      : tone === "green"
      ? "#dcfce7"
      : tone === "blue"
      ? "#dbeafe"
      : tone === "steel"
      ? "#e2e8f0"
      : "#f1f5f9";

  const fg =
    tone === "red"
      ? "#991b1b"
      : tone === "amber"
      ? "#92400e"
      : tone === "green"
      ? "#166534"
      : tone === "blue"
      ? "#1d4ed8"
      : "#334155";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 900,
        background: bg,
        color: fg,
        borderWidth: 1,
        borderStyle: "solid",
        borderColor: "rgba(0,0,0,0.06)",
        lineHeight: 1,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function PillBtn({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...pillBtn,
        background: active ? "#0f172a" : "#fff",
        color: active ? "#fff" : "#0f172a",
        borderWidth: 1,
        borderStyle: "solid",
        borderColor: active ? "#0f172a" : "#e5e7eb",
      }}
      type="button"
    >
      {children}
    </button>
  );
}

function calcRiskScore(row) {
  const total = toNum(row.total);
  const crit = toNum(row.critico);
  const malo = toNum(row.malo);

  const sev = crit * 3 + malo * 1;

  const last = row.lastFailureAt;
  const d = last ? daysBetween(last, new Date()) : null;
  const recencyBoost = d == null ? 0 : d <= 7 ? 25 : d <= 30 ? 15 : d <= 90 ? 8 : 0;

  const delta = toNum(row.deltaTotal || 0);
  const trendBoost = delta > 0 ? 12 : 0;

  const raw = sev * 8 + total * 4 + recencyBoost + trendBoost;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

function riskLabel(score) {
  if (score >= 75) return { txt: "ALTO", tone: "red" };
  if (score >= 45) return { txt: "MEDIO", tone: "amber" };
  return { txt: "OK", tone: "green" };
}

function backendRiskToUi(risk) {
  if (risk === "DUE") return { txt: "ALTO", tone: "red" };
  if (risk === "WATCH") return { txt: "MEDIO", tone: "amber" };
  if (risk === "OK") return { txt: "OK", tone: "green" };
  return null;
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  const row = payload[0]?.payload || {};

  return (
    <div
      style={{
        background: "#fff",
        borderWidth: 1,
        borderStyle: "solid",
        borderColor: "rgba(226,232,240,0.95)",
        borderRadius: 14,
        padding: 12,
        boxShadow: "0 18px 34px rgba(2,6,23,0.14)",
        minWidth: 220,
      }}
    >
      <div style={{ fontWeight: 950, color: "#0f172a" }}>{label || row.name}</div>

      <div
        style={{
          marginTop: 8,
          display: "grid",
          gap: 6,
          fontSize: 12,
          fontWeight: 850,
          color: "#334155",
        }}
      >
        {row.code ? (
          <div>
            Código: <b style={{ color: "#0f172a" }}>{row.code}</b>
          </div>
        ) : null}
        <div>
          Total: <b style={{ color: "#0f172a" }}>{toNum(row.total)}</b>
        </div>
        <div>
          Crítico: <b style={{ color: "#991b1b" }}>{toNum(row.critico)}</b>
        </div>
        <div>
          Malo: <b style={{ color: "#92400e" }}>{toNum(row.malo)}</b>
        </div>
        <div>
          Última falla: <b style={{ color: "#0f172a" }}>{fmtDateTime(row.lastFailureAt)}</b>
        </div>
        <div>
          Riesgo: <b style={{ color: "#0f172a" }}>{row?.risk?.txt || "—"}</b>
        </div>
      </div>
    </div>
  );
}

export default function FailuresByEquipment() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [days, setDays] = useState(30);
  const [severity, setSeverity] = useState("ALL");
  const [q, setQ] = useState("");

  const [data, setData] = useState({ items: [], meta: null });

  const { ref: chartRef, width: chartWidth } = useElementWidth();
  const safeChartWidth = Math.max(chartWidth, 520);
  const chartHeight = 330;

  const load = async () => {
    try {
      setErr("");
      setLoading(true);

      const json = await getFailuresByEquipment({ days, severity, q });

      setData({
        items: Array.isArray(json?.result)
          ? json.result
          : Array.isArray(json?.items)
          ? json.items
          : [],
        meta: json?.meta || null,
      });
    } catch (e) {
      console.error(e);
      setErr(e?.message || "Error cargando fallas por equipo");
      setData({ items: [], meta: null });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days, severity]);

  const filtered = useMemo(() => {
    const s = String(q || "").trim().toLowerCase();
    if (!s) return data.items;

    return (data.items || []).filter((r) => {
      const name = String(r?.equipment?.name || r?.name || "").toLowerCase();
      const loc = String(r?.equipment?.location || r?.location || "").toLowerCase();
      const code = String(r?.equipment?.code || r?.code || "").toLowerCase();
      return name.includes(s) || loc.includes(s) || code.includes(s);
    });
  }, [data.items, q]);

  const rows = useMemo(() => {
    return (filtered || []).map((r) => {
      const equipment = r?.equipment || {
        id: r.id,
        name: r.name,
        code: r.code,
        location: r.location,
      };

      const row = {
        equipmentId: equipment?.id ?? r.equipmentId ?? r.id,
        name: equipment?.name || "—",
        code: equipment?.code || "",
        location: equipment?.location || "—",
        total: toNum(r.total),
        critico: toNum(r.critico),
        malo: toNum(r.malo),
        lastFailureAt: r.lastFailureAt || null,
        nextDueAt: r?.prediction?.predictedNextAt || null,
        deltaTotal: r.deltaTotal ?? null,
        prediction: r?.prediction || null,
      };

      const backendUi = backendRiskToUi(row?.prediction?.risk);
      const fallback = riskLabel(calcRiskScore(row));

      return {
        ...row,
        risk: backendUi || fallback,
      };
    });
  }, [filtered]);

  const kpis = useMemo(() => {
    const equipos = rows.length;
    const total = rows.reduce((a, r) => a + toNum(r.total), 0);
    const crit = rows.reduce((a, r) => a + toNum(r.critico), 0);
    const malo = rows.reduce((a, r) => a + toNum(r.malo), 0);
    const critPct = total > 0 ? Math.round((crit / total) * 100) : 0;
    const maloPct = total > 0 ? Math.round((malo / total) * 100) : 0;
    const highRisk = rows.filter((r) => r.risk?.txt === "ALTO").length;
    return { equipos, total, crit, malo, critPct, maloPct, highRisk };
  }, [rows]);

  const top4 = useMemo(() => {
    return [...rows].sort((a, b) => toNum(b.total) - toNum(a.total)).slice(0, 4);
  }, [rows]);

  const ranking = useMemo(() => {
    return [...rows].sort((a, b) => toNum(b.total) - toNum(a.total)).slice(0, 6);
  }, [rows]);

  const chartData = useMemo(() => {
    return [...rows]
      .sort((a, b) => toNum(b.total) - toNum(a.total))
      .slice(0, 8)
      .map((r) => ({
        ...r,
        shortName: r.name?.length > 14 ? `${r.name.slice(0, 14)}…` : r.name,
      }));
  }, [rows]);

  const trend = useMemo(() => {
    const prev = data?.meta?.prevTotals;
    if (!prev) return null;

    const totalNow = kpis.total;
    const critNow = kpis.crit;
    const maloNow = kpis.malo;

    const totalPrev = toNum(prev.total);
    const critPrev = toNum(prev.critico);
    const maloPrev = toNum(prev.malo);

    return {
      totalNow,
      totalPrev,
      totalDelta: totalNow - totalPrev,
      critNow,
      critPrev,
      critDelta: critNow - critPrev,
      maloNow,
      maloPrev,
      maloDelta: maloNow - maloPrev,
    };
  }, [data?.meta, kpis]);

  return (
    <div style={wrap}>
      <div style={headerRow}>
        <div>
          <div style={title}>Fallas por equipo</div>
          <div style={subTitle}>
            Basado en ejecuciones con condición <b>CRITICO</b> / <b>MALO</b> · últimos {days} días
          </div>
          {data?.meta?.updatedAt ? (
            <div style={hint}>Última actualización: {fmtDateTime(data.meta.updatedAt)}</div>
          ) : null}
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <button onClick={load} style={btnGhost} disabled={loading} type="button">
            {loading ? "Actualizando..." : "↻ Actualizar"}
          </button>
        </div>
      </div>

      <div style={filtersRow}>
        <div style={filtersGroup}>
          <div style={miniLbl}>Severidad</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <PillBtn active={severity === "ALL"} onClick={() => setSeverity("ALL")}>
              Todo
            </PillBtn>
            <PillBtn active={severity === "MALO"} onClick={() => setSeverity("MALO")}>
              Malo
            </PillBtn>
            <PillBtn active={severity === "CRITICO"} onClick={() => setSeverity("CRITICO")}>
              Crítico
            </PillBtn>
          </div>
        </div>

        <div style={filtersGroup}>
          <div style={miniLbl}>Rango</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[30, 90, 180, 365].map((d) => (
              <PillBtn key={d} active={days === d} onClick={() => setDays(d)}>
                {d}d
              </PillBtn>
            ))}
          </div>
        </div>

        <div style={{ flex: 1 }} />

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar equipo, código o ubicación..."
          style={search}
        />
      </div>

      {err ? <div style={errorBox}>{err}</div> : null}

      <div style={kpiRow}>
        <div style={kpiCard}>
          <div style={kpiLbl}>Equipos</div>
          <div style={kpiVal}>{kpis.equipos}</div>
        </div>
        <div style={kpiCard}>
          <div style={kpiLbl}>Fallas</div>
          <div style={kpiVal}>{kpis.total}</div>
        </div>
        <div style={kpiCard}>
          <div style={kpiLbl}>Crítico</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <div style={{ ...kpiVal, color: "#991b1b" }}>{kpis.crit}</div>
            <div style={kpiSub}>{kpis.critPct}%</div>
          </div>
        </div>
        <div style={kpiCard}>
          <div style={kpiLbl}>Malo</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <div style={{ ...kpiVal, color: "#92400e" }}>{kpis.malo}</div>
            <div style={kpiSub}>{kpis.maloPct}%</div>
          </div>
        </div>
        <div style={kpiCard}>
          <div style={kpiLbl}>Riesgo alto</div>
          <div style={{ ...kpiVal, color: "#dc2626" }}>{kpis.highRisk}</div>
        </div>
      </div>

      <div style={{ ...grid2, marginTop: 12 }}>
        <div style={panel}>
          <div style={panelTitle}>Tendencia vs periodo anterior</div>

          {trend ? (
            <div
              style={{
                marginTop: 10,
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 10,
              }}
            >
              <div style={trendCard}>
                <div style={trendLbl}>Fallas</div>
                <div style={trendVal}>
                  {trend.totalNow} <span style={trendVs}>vs {trend.totalPrev}</span>
                </div>
                <Tag tone={trend.totalDelta > 0 ? "red" : "green"}>
                  {trend.totalDelta >= 0 ? `Δ +${trend.totalDelta}` : `Δ ${trend.totalDelta}`}
                </Tag>
                <div style={trendHint}>(comparación aproximada)</div>
              </div>

              <div
                style={{
                  ...trendCard,
                  borderWidth: 1,
                  borderStyle: "solid",
                  borderColor: "rgba(239,68,68,0.25)",
                  background: "rgba(254,226,226,0.35)",
                }}
              >
                <div style={trendLbl}>Crítico</div>
                <div style={trendVal}>
                  {trend.critNow} <span style={trendVs}>vs {trend.critPrev}</span>
                </div>
                <Tag tone={trend.critDelta > 0 ? "red" : "green"}>
                  {trend.critDelta >= 0 ? `Δ +${trend.critDelta}` : `Δ ${trend.critDelta}`}
                </Tag>
                <div style={trendHint}>(comparación aproximada)</div>
              </div>

              <div
                style={{
                  ...trendCard,
                  borderWidth: 1,
                  borderStyle: "solid",
                  borderColor: "rgba(245,158,11,0.25)",
                  background: "rgba(254,243,199,0.45)",
                }}
              >
                <div style={trendLbl}>Malo</div>
                <div style={trendVal}>
                  {trend.maloNow} <span style={trendVs}>vs {trend.maloPrev}</span>
                </div>
                <Tag tone={trend.maloDelta > 0 ? "amber" : "green"}>
                  {trend.maloDelta >= 0 ? `Δ +${trend.maloDelta}` : `Δ ${trend.maloDelta}`}
                </Tag>
                <div style={trendHint}>(comparación aproximada)</div>
              </div>
            </div>
          ) : (
            <div style={{ marginTop: 10, color: "#64748b", fontWeight: 800 }}>
              No hay comparación disponible.
            </div>
          )}
        </div>

        <div style={panel}>
          <div style={panelTitle}>Ranking por total de fallas</div>

          {loading ? (
            <div style={{ marginTop: 10, color: "#64748b", fontWeight: 800 }}>Cargando…</div>
          ) : ranking.length === 0 ? (
            <div style={{ marginTop: 10, color: "#64748b", fontWeight: 800 }}>Sin datos.</div>
          ) : (
            <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
              {ranking.map((r) => (
                <div key={r.equipmentId} style={rankRow}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <div style={rankName}>{r.name}</div>
                      {r.code ? <Tag tone="steel">{r.code}</Tag> : null}
                    </div>
                    <div style={rankSub}>{r.location}</div>
                  </div>

                  <div style={rankBarWrap}>
                    <div
                      style={{
                        ...rankBar,
                        width: `${Math.min(100, (r.total / Math.max(1, ranking[0]?.total || 1)) * 100)}%`,
                      }}
                    />
                  </div>

                  <div style={rankNum}>{r.total}</div>
                </div>
              ))}
              <div style={note}>Tip: útil para detectar rápido qué equipo requiere atención.</div>
            </div>
          )}
        </div>
      </div>

      <div style={{ ...grid2, marginTop: 12 }}>
        <div style={panel}>
          <div style={panelTitle}>Top equipos (Crítico vs Malo)</div>

          {chartData.length === 0 ? (
            <div style={{ marginTop: 10, color: "#64748b", fontWeight: 800 }}>Sin datos.</div>
          ) : (
            <>
              <div style={{ marginTop: 10, display: "flex", gap: 14, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 999, background: "#ef4444" }} />
                  <span style={miniLegend}>Crítico</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 999, background: "#f97316" }} />
                  <span style={miniLegend}>Malo</span>
                </div>
              </div>

              <div style={chartOuter} ref={chartRef}>
  <div style={chartInner}>
    <BarChart
      width={safeChartWidth}
      height={chartHeight}
      data={chartData}
      margin={{ top: 10, right: 12, left: 0, bottom: 10 }}
      barCategoryGap={18}
    >
      <CartesianGrid strokeDasharray="3 3" stroke="rgba(226,232,240,0.9)" />
      <XAxis
        dataKey="shortName"
        tick={{ fontSize: 12, fill: "#64748b", fontWeight: 800 }}
        axisLine={{ stroke: "rgba(226,232,240,0.95)" }}
        tickLine={false}
      />
      <YAxis
        allowDecimals={false}
        tick={{ fontSize: 12, fill: "#64748b", fontWeight: 800 }}
        axisLine={false}
        tickLine={false}
      />
      <Tooltip content={<CustomTooltip />} />
      <Legend />
      <Bar dataKey="malo" stackId="a" name="Malo" radius={[0, 0, 8, 8]}>
        {chartData.map((_, idx) => (
          <Cell key={`malo-${idx}`} fill="#f97316" />
        ))}
      </Bar>
      <Bar dataKey="critico" stackId="a" name="Crítico" radius={[8, 8, 0, 0]}>
        {chartData.map((_, idx) => (
          <Cell key={`crit-${idx}`} fill="#ef4444" />
        ))}
      </Bar>
    </BarChart>
  </div>
</div>

              <div style={note}>
                Las barras apiladas muestran la mezcla entre fallas críticas y malas por equipo.
              </div>
            </>
          )}
        </div>

        <div style={panel}>
          <div style={panelTitle}>Top 4 visual</div>

          {top4.length === 0 ? (
            <div style={{ marginTop: 10, color: "#64748b", fontWeight: 800 }}>Sin datos.</div>
          ) : (
            <>
              <div style={topBarsWrap}>
                {top4.map((r) => {
                  const max = Math.max(1, top4[0]?.total || 1);
                  const pct = (r.total / max) * 100;

                  return (
                    <div
                      key={r.equipmentId}
                      style={topCol}
                      title={`${r.name}\n${r.code ? `Código: ${r.code}\n` : ""}Crítico: ${r.critico}\nMalo: ${r.malo}\nTotal: ${r.total}`}
                    >
                      <div style={topBarBg}>
                        <div
                          style={{
                            width: "100%",
                            height: `${(r.malo / Math.max(1, r.total)) * pct}%`,
                            background: "#f97316",
                          }}
                        />
                        <div
                          style={{
                            width: "100%",
                            height: `${(r.critico / Math.max(1, r.total)) * pct}%`,
                            background: "#ef4444",
                          }}
                        />
                      </div>
                      <div style={topLabel}>
                        {r.name.length > 10 ? `${r.name.slice(0, 10)}…` : r.name}
                      </div>
                      {r.code ? <div style={topCode}>{r.code}</div> : <div style={topCode}>—</div>}
                      <div style={topNum}>{r.total}</div>
                      <Tag tone={r.risk?.tone || "gray"}>{r.risk?.txt || "—"}</Tag>
                    </div>
                  );
                })}
              </div>

              <div style={note}>Resumen visual rápido para ver concentración de riesgo.</div>
            </>
          )}
        </div>
      </div>

      <div style={{ ...panel, marginTop: 12 }}>
        <div style={panelTitle}>Detalle por equipo</div>

        {loading ? (
          <div style={{ marginTop: 10, color: "#64748b", fontWeight: 800 }}>Cargando…</div>
        ) : rows.length === 0 ? (
          <div style={{ marginTop: 10, color: "#64748b", fontWeight: 800 }}>Sin datos.</div>
        ) : (
          <div style={tableWrap}>
            <table style={table}>
              <thead>
                <tr>
                  <th style={th}>Equipo</th>
                  <th style={th}>Ubicación</th>
                  <th style={th}>Fallas</th>
                  <th style={th}>Crítico</th>
                  <th style={th}>Malo</th>
                  <th style={th}>Última falla</th>
                  <th style={th}>Riesgo</th>
                  <th style={th}>Próxima</th>
                </tr>
              </thead>
              <tbody>
                {rows
                  .slice()
                  .sort((a, b) => toNum(b.total) - toNum(a.total))
                  .slice(0, 12)
                  .map((r) => (
                    <tr key={r.equipmentId}>
                      <td style={td}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontWeight: 900, color: "#0f172a" }}>{r.name}</span>
                          {r.code ? <Tag tone="steel">{r.code}</Tag> : null}
                        </div>
                      </td>
                      <td style={td}>{r.location}</td>
                      <td style={td}>
                        <Tag tone="gray">{r.total}</Tag>
                      </td>
                      <td style={td}>
                        <Tag tone="red">{r.critico}</Tag>
                      </td>
                      <td style={td}>
                        <Tag tone="amber">{r.malo}</Tag>
                      </td>
                      <td style={td}>{fmtDateTime(r.lastFailureAt)}</td>
                      <td style={td}>
                        <Tag tone={r.risk.tone}>{r.risk.txt}</Tag>
                      </td>
                      <td style={td}>{r.nextDueAt ? fmtDateTime(r.nextDueAt) : "—"}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* styles */
const wrap = { marginTop: 14 };

const headerRow = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
  alignItems: "flex-start",
};

const title = { fontWeight: 900, color: "#0f172a" };
const subTitle = { marginTop: 4, color: "#64748b", fontWeight: 800, fontSize: 12 };
const hint = { marginTop: 4, color: "#94a3b8", fontWeight: 800, fontSize: 12 };

const filtersRow = {
  marginTop: 12,
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  alignItems: "flex-end",
};

const filtersGroup = { display: "grid", gap: 8 };
const miniLbl = { fontSize: 12, fontWeight: 900, color: "#64748b" };

const search = {
  minWidth: 280,
  flex: "0 0 320px",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#e5e7eb",
  borderRadius: 12,
  padding: "10px 12px",
  fontWeight: 800,
  outline: "none",
};

const btnGhost = {
  background: "transparent",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#e5e7eb",
  borderRadius: 10,
  padding: "10px 12px",
  cursor: "pointer",
  fontWeight: 900,
};

const pillBtn = {
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#e5e7eb",
  borderRadius: 999,
  padding: "8px 12px",
  cursor: "pointer",
  fontWeight: 900,
};

const errorBox = {
  marginTop: 12,
  background: "#fee2e2",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#fecaca",
  padding: 12,
  borderRadius: 12,
  color: "#991b1b",
  fontWeight: 800,
};

const kpiRow = {
  marginTop: 12,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 12,
};

const kpiCard = {
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#e5e7eb",
  borderRadius: 14,
  padding: 14,
  background: "#fff",
};

const kpiLbl = { fontSize: 12, color: "#6b7280", fontWeight: 900 };
const kpiVal = { marginTop: 6, fontSize: 20, fontWeight: 900, color: "#0f172a" };
const kpiSub = { fontSize: 12, color: "#64748b", fontWeight: 900 };

const grid2 = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
  gap: 12,
};

const panel = {
  minWidth: 0,
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#e5e7eb",
  borderRadius: 14,
  padding: 14,
  background: "#fff",
  overflow: "hidden",
};

const chartOuter = {
  marginTop: 14,
  width: "100%",
  minWidth: 0,
  overflowX: "auto",
};

const chartInner = {
  minWidth: 640,
  height: 330,
};

const chartSkeleton = {
  height: 330,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#64748b",
  fontWeight: 850,
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#e5e7eb",
  borderRadius: 12,
  background: "#f8fafc",
};

const panelTitle = { fontWeight: 900, color: "#0f172a" };

const trendCard = {
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#e5e7eb",
  borderRadius: 14,
  padding: 12,
  background: "#fff",
};

const trendLbl = { fontSize: 12, color: "#64748b", fontWeight: 900 };
const trendVal = { marginTop: 6, fontSize: 18, fontWeight: 900, color: "#0f172a" };
const trendVs = { fontSize: 12, color: "#94a3b8", fontWeight: 900, marginLeft: 6 };
const trendHint = { marginTop: 8, fontSize: 11, color: "#94a3b8", fontWeight: 800 };

const rankRow = {
  display: "grid",
  gridTemplateColumns: "1fr 160px 34px",
  gap: 10,
  alignItems: "center",
};

const rankName = { fontWeight: 900, color: "#0f172a", fontSize: 13 };
const rankSub = { marginTop: 2, color: "#94a3b8", fontWeight: 900, fontSize: 11 };
const rankBarWrap = { height: 8, background: "#e5e7eb", borderRadius: 999, overflow: "hidden" };
const rankBar = { height: "100%", background: "#0f172a", borderRadius: 999 };
const rankNum = { textAlign: "right", fontWeight: 900, color: "#0f172a" };

const miniLegend = { fontSize: 12, color: "#64748b", fontWeight: 900 };

const topBarsWrap = {
  marginTop: 12,
  display: "flex",
  gap: 12,
  alignItems: "flex-end",
  overflowX: "auto",
  paddingBottom: 6,
};

const topCol = {
  minWidth: 86,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 6,
};

const topBarBg = {
  width: 26,
  height: 170,
  background: "#f1f5f9",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#e5e7eb",
  borderRadius: 999,
  overflow: "hidden",
  display: "flex",
  flexDirection: "column-reverse",
};

const topLabel = { fontSize: 11, fontWeight: 900, color: "#334155", textAlign: "center" };
const topCode = { fontSize: 11, fontWeight: 900, color: "#64748b" };
const topNum = { fontSize: 11, fontWeight: 900, color: "#0f172a" };

const tableWrap = { overflowX: "auto", marginTop: 10 };
const table = { width: "100%", borderCollapse: "collapse" };
const th = {
  textAlign: "left",
  fontSize: 12,
  color: "#6b7280",
  padding: "8px 6px",
  whiteSpace: "nowrap",
};
const td = {
  padding: "10px 6px",
  borderTop: "1px solid #eef2f7",
  fontSize: 13,
  verticalAlign: "top",
};

const note = { marginTop: 10, fontSize: 12, color: "#64748b", fontWeight: 800 };