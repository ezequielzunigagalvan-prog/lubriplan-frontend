import { useEffect, useMemo, useState } from "react";
import { getMonthlyTotal } from "../../services/analyticsService";

/**
 * MonthlyTotalChart
 * - Consume /analytics/monthly-total?days=...&kind=...
 * - kind: ALL | ACEITE | GRASA
 *
 * ✅ MODOS:
 * 1) CONTROLADO (desde padre):
 *    <MonthlyTotalChart days={365} kind={kind} showControls={false} />
 *
 * 2) AUTÓNOMO (con controles internos):
 *    <MonthlyTotalChart initialDays={365} initialKind="ALL" />
 */
export default function MonthlyTotalChart({
  // modo autónomo (fallback)
  initialDays = 365,
  initialKind = "ALL",

  // modo controlado (si vienen, ganan)
  days: daysProp,
  kind: kindProp,

  // si padre controla, normalmente conviene ocultar chips internos
  showControls = kindProp == null && daysProp == null,
}) {
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // state interno (sirve para modo autónomo)
  const [kindState, setKindState] = useState(initialKind);
  const [daysState, setDaysState] = useState(initialDays);

  // ✅ fuente real de filtros (controlado > interno)
  const kind = (kindProp ?? kindState ?? "ALL").toUpperCase();
  const days = Number(daysProp ?? daysState ?? initialDays);

  // tooltip
  const [hover, setHover] = useState(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setErr("");
        setLoading(true);

        const json = await getMonthlyTotal(days, kind);
        if (!mounted) return;

        const raw = Array.isArray(json?.series) ? json.series : [];
        setSeries(raw);
      } catch (e) {
        if (!mounted) return;
        setErr(e?.message || "Error cargando consumo mensual");
        setSeries([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [days, kind]);

  // helpers
  const format = (n) => {
    const num = Number(n || 0);
    return num % 1 === 0 ? num.toFixed(0) : num.toFixed(2);
  };

  const nowKey = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  // rellena meses faltantes con 0
  const normalized = useMemo(() => {
    const arr = (series || [])
      .map((x) => ({
        month: String(x.month || ""),
        total: Number(x.total || 0),
      }))
      .filter((x) => /^\d{4}-\d{2}$/.test(x.month))
      .sort((a, b) => a.month.localeCompare(b.month));

    if (!arr.length) return [];

    const map = new Map(arr.map((x) => [x.month, x.total]));

    const [y1, m1] = arr[0].month.split("-").map(Number);
    const [y2, m2] = arr[arr.length - 1].month.split("-").map(Number);

    const out = [];
    let y = y1;
    let m = m1;

    while (y < y2 || (y === y2 && m <= m2)) {
      const key = `${y}-${String(m).padStart(2, "0")}`;
      out.push({ month: key, total: Number(map.get(key) || 0) });

      m++;
      if (m === 13) {
        m = 1;
        y++;
      }
    }

    return out;
  }, [series]);

  // stats + TOP
  const stats = useMemo(() => {
    const vals = normalized.map((x) => Number(x.total || 0));
    const total = vals.reduce((a, b) => a + b, 0);
    const max = vals.length ? Math.max(...vals) : 0;
    const avg = vals.length ? total / vals.length : 0;

    let topMonth = null;
    let topVal = -1;
    for (const x of normalized) {
      if (x.total > topVal) {
        topVal = x.total;
        topMonth = x.month;
      }
    }

    return { total, max, avg, topMonth, topVal };
  }, [normalized]);

  // comparación últimos 2 meses disponibles
  const compare = useMemo(() => {
    if (!normalized.length) return null;
    const last = normalized[normalized.length - 1];
    const prev = normalized[normalized.length - 2] || { month: "—", total: 0 };

    const delta = Number(last.total || 0) - Number(prev.total || 0);
    const pct = Number(prev.total || 0) > 0 ? (delta / prev.total) * 100 : null;

    return {
      lastMonth: last.month,
      prevMonth: prev.month,
      lastTotal: Number(last.total || 0),
      prevTotal: Number(prev.total || 0),
      delta,
      pct,
    };
  }, [normalized]);

  if (loading) return <p style={{ marginTop: 10 }}>Cargando consumo mensual…</p>;
  if (err) return <div style={errorBox}>{err}</div>;
  if (!normalized.length) return <p style={{ marginTop: 10 }}>No hay consumos en el rango.</p>;

  const maxVal = Math.max(stats.max, 1);

  const deltaSign = compare?.delta >= 0 ? "+" : "";
  const deltaLabel =
    compare?.pct == null
      ? `${deltaSign}${format(compare?.delta)} (sin mes previo)`
      : `${deltaSign}${format(compare?.delta)} (${deltaSign}${compare.pct.toFixed(1)}%)`;

  const deltaTone =
    (compare?.pct ?? 0) > 0 ? "up" : (compare?.pct ?? 0) < 0 ? "down" : "flat";

  return (
    <div style={card}>
      {/* HEADER */}
      <div style={headerRow}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "baseline", flexWrap: "wrap" }}>
            <h3 style={{ margin: 0, color: "#0f172a" }}>Consumo mensual total</h3>
            <span style={subtitle}>
              Movimientos <strong>SALIDA</strong> · últimos {days} días · tipo{" "}
              <strong>{kind}</strong>
            </span>
          </div>
        </div>

        <div style={kpiRow}>
          <KpiPill label="Total" value={format(stats.total)} />
          <KpiPill label="Promedio" value={format(stats.avg)} />
          <KpiPill label="Máx" value={format(stats.max)} />
        </div>
      </div>

      {/* CONTROLES (solo si showControls=true) */}
      {showControls && (
        <div style={controlsRow}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <div style={controlsLabel}>Tipo</div>
            <div style={chipGroup}>
              <Chip active={kindState === "ALL"} onClick={() => setKindState("ALL")}>
                Todo
              </Chip>
              <Chip active={kindState === "ACEITE"} onClick={() => setKindState("ACEITE")}>
                Aceite
              </Chip>
              <Chip active={kindState === "GRASA"} onClick={() => setKindState("GRASA")}>
                Grasa
              </Chip>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <div style={controlsLabel}>Rango</div>
            <div style={chipGroup}>
              <Chip active={daysState === 30} onClick={() => setDaysState(30)}>
                30d
              </Chip>
              <Chip active={daysState === 90} onClick={() => setDaysState(90)}>
                90d
              </Chip>
              <Chip active={daysState === 180} onClick={() => setDaysState(180)}>
                180d
              </Chip>
              <Chip active={daysState === 365} onClick={() => setDaysState(365)}>
                365d
              </Chip>
            </div>
          </div>
        </div>
      )}

      {/* COMPARACIÓN */}
      {compare && (
        <div style={compareRow}>
          <div style={compareLeft}>
            <div style={compareTitle}>Comparación mes anterior</div>
            <div style={compareSub}>
              {compare.prevMonth} → {compare.lastMonth}
            </div>
          </div>

          <div style={compareRight}>
            <div style={comparePill}>
              <div style={comparePillLabel}>Mes anterior</div>
              <div style={comparePillVal}>{format(compare.prevTotal)}</div>
            </div>

            <div style={comparePill}>
              <div style={comparePillLabel}>Mes actual</div>
              <div style={comparePillVal}>{format(compare.lastTotal)}</div>
            </div>

            <div style={deltaPill(deltaTone)}>
              <div style={comparePillLabel}>Δ</div>
              <div style={comparePillVal}>{deltaLabel}</div>
            </div>
          </div>
        </div>
      )}

      {/* CHART */}
      <div style={chartArea}>
        <div style={yAxis}>
          <div style={yTick}>{format(maxVal)}</div>
          <div style={yTick}>{format(maxVal * 0.75)}</div>
          <div style={yTick}>{format(maxVal * 0.5)}</div>
          <div style={yTick}>{format(maxVal * 0.25)}</div>
          <div style={yTick}>{format(0)}</div>
        </div>

        <div style={chartWrap}>
          <div style={gridLines}>
            <div style={gridLine} />
            <div style={gridLine} />
            <div style={gridLine} />
            <div style={gridLine} />
            <div style={gridLine} />
          </div>

          <div
            style={{
              ...avgLine,
              bottom: `${Math.round((stats.avg / maxVal) * 100)}%`,
            }}
            title={`Promedio: ${format(stats.avg)}`}
          >
            <div style={avgLabel}>PROM {format(stats.avg)}</div>
          </div>

          <div style={barsRow}>
            {normalized.map((x) => {
              const total = Number(x.total || 0);
              const pct = Math.max(0, Math.min(100, (total / maxVal) * 100));
              const isCurrent = x.month === nowKey;
              const isTop = x.month === stats.topMonth;

              return (
                <div
                  key={x.month}
                  style={barCol}
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setHover({
                      month: x.month,
                      total,
                      x: rect.left + rect.width / 2,
                      y: rect.top,
                    });
                  }}
                  onMouseMove={(e) =>
                    setHover((p) => (p ? { ...p, x: e.clientX, y: e.clientY } : p))
                  }
                  onMouseLeave={() => setHover(null)}
                >
                  <div style={barBg(isCurrent, isTop)}>
                    <div style={{ ...barFill(isCurrent, isTop), height: `${pct}%` }} />
                  </div>

                  {isTop && total > 0 ? <div style={topBadge}>TOP</div> : <div style={{ height: 20 }} />}

                  <div style={monthLabel(isCurrent)}>{x.month}</div>
                  <div style={valueLabel}>{format(total)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {hover && (
        <div style={{ ...tooltip, left: hover.x, top: hover.y }}>
          <div style={{ fontWeight: 900, color: "#0f172a" }}>{hover.month}</div>
          <div style={{ marginTop: 4, fontSize: 12, color: "#475569", fontWeight: 800 }}>
            Total: <span style={{ color: "#0f172a" }}>{format(hover.total)}</span>
          </div>
        </div>
      )}

      <div style={footerNote}>Tip: el mes actual se resalta. “TOP” marca el mes con mayor consumo.</div>
    </div>
  );
}

function KpiPill({ label, value }) {
  return (
    <div style={pill}>
      <div style={{ fontSize: 11, color: "#64748b", fontWeight: 900 }}>{label}</div>
      <div style={{ fontSize: 13, color: "#0f172a", fontWeight: 900 }}>{value}</div>
    </div>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button type="button" onClick={onClick} style={chip(active)}>
      {children}
    </button>
  );
}

/* ===== STYLES ===== */

const card = {
  position: "relative",
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  padding: 16,
  overflow: "hidden",
};

const headerRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
  flexWrap: "wrap",
};

const subtitle = { fontSize: 12, color: "#6b7280", fontWeight: 800 };

const kpiRow = {
  display: "flex",
  gap: 10,
  alignItems: "center",
  flexWrap: "wrap",
  justifyContent: "flex-end",
};

const pill = {
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: "8px 10px",
  background: "#f8fafc",
  minWidth: 92,
  display: "flex",
  flexDirection: "column",
  gap: 2,
};

const controlsRow = {
  marginTop: 12,
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
  alignItems: "center",
};

const controlsLabel = { fontSize: 12, fontWeight: 900, color: "#64748b" };

const chipGroup = { display: "flex", gap: 8, flexWrap: "wrap" };

const chip = (active) => ({
  border: "1px solid " + (active ? "#fb923c" : "#e5e7eb"),
  background: active ? "#fff7ed" : "#fff",
  color: active ? "#9a3412" : "#0f172a",
  borderRadius: 999,
  padding: "7px 10px",
  fontSize: 12,
  fontWeight: 900,
  cursor: "pointer",
});

/* comparación */
const compareRow = {
  marginTop: 12,
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "center",
  flexWrap: "wrap",
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  padding: 12,
  background: "#f8fafc",
};

const compareLeft = { display: "flex", flexDirection: "column", gap: 4 };

const compareTitle = { fontSize: 12, fontWeight: 900, color: "#0f172a" };
const compareSub = { fontSize: 12, fontWeight: 800, color: "#64748b" };

const compareRight = { display: "flex", gap: 10, flexWrap: "wrap" };

const comparePill = {
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: "8px 10px",
  background: "#fff",
  minWidth: 120,
};

const comparePillLabel = { fontSize: 11, color: "#64748b", fontWeight: 900 };
const comparePillVal = { fontSize: 13, color: "#0f172a", fontWeight: 900 };

const deltaPill = (tone) => ({
  ...comparePill,
  borderColor: tone === "up" ? "#86efac" : tone === "down" ? "#fecaca" : "#e5e7eb",
  background: tone === "up" ? "#f0fdf4" : tone === "down" ? "#fff1f2" : "#fff",
});

const chartArea = { marginTop: 14, display: "flex", gap: 12 };

const yAxis = {
  width: 70,
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  paddingTop: 6,
  paddingBottom: 54,
};

const yTick = { fontSize: 11, color: "#94a3b8", fontWeight: 900 };

const chartWrap = {
  position: "relative",
  flex: 1,
  overflowX: "auto",
  paddingBottom: 6,
  paddingTop: 6,
};

const gridLines = {
  position: "absolute",
  inset: 0,
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  pointerEvents: "none",
};

const gridLine = { height: 1, background: "#f1f5f9" };

const barsRow = {
  position: "relative",
  display: "flex",
  gap: 14,
  alignItems: "flex-end",
  paddingBottom: 6,
  paddingRight: 6,
};

const barCol = {
  minWidth: 70,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 6,
};

const barBg = (isCurrent, isTop) => ({
  width: 26,
  height: 190,
  background: isCurrent ? "#fff7ed" : "#f1f5f9",
  borderRadius: 999,
  overflow: "hidden",
  display: "flex",
  alignItems: "flex-end",
  border: isTop ? "1px solid #fb923c" : isCurrent ? "1px solid #fed7aa" : "1px solid transparent",
});

const barFill = (isCurrent, isTop) => ({
  width: "100%",
  background: isTop ? "#ea580c" : isCurrent ? "#fb923c" : "#ff7a00",
  borderRadius: 999,
  transition: "height 280ms ease",
});

const topBadge = {
  height: 20,
  fontSize: 10,
  fontWeight: 900,
  color: "#9a3412",
  background: "#fff7ed",
  border: "1px solid #fed7aa",
  borderRadius: 999,
  padding: "2px 8px",
  lineHeight: "16px",
};

const monthLabel = (isCurrent) => ({
  fontSize: 11,
  color: isCurrent ? "#9a3412" : "#334155",
  fontWeight: 900,
});

const valueLabel = { fontSize: 11, color: "#6b7280", fontWeight: 900 };

const avgLine = {
  position: "absolute",
  left: 0,
  right: 0,
  height: 0,
  borderTop: "2px dashed #cbd5e1",
  pointerEvents: "none",
};

const avgLabel = {
  position: "absolute",
  right: 6,
  top: -18,
  fontSize: 10,
  color: "#64748b",
  fontWeight: 900,
  background: "rgba(248, 250, 252, 0.92)",
  border: "1px solid #e5e7eb",
  borderRadius: 999,
  padding: "2px 8px",
};

const tooltip = {
  position: "fixed",
  transform: "translate(-50%, -115%)",
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
  borderRadius: 12,
  padding: "10px 12px",
  zIndex: 9999,
  pointerEvents: "none",
  minWidth: 150,
};

const footerNote = { marginTop: 12, fontSize: 12, color: "#64748b", fontWeight: 800 };

const errorBox = {
  marginTop: 12,
  background: "#fee2e2",
  border: "1px solid #fecaca",
  padding: 12,
  borderRadius: 12,
  color: "#991b1b",
};