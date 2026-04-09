// src/components/analytics/TechniciansPerformance.jsx
import { useEffect, useMemo, useState } from "react";
import { getTechniciansPerformance } from "../../services/analyticsService";

const toNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

function calcScore({ onTime, late, overdue }, lateWeight = 0.6, overdueWeight = 0.2) {
  const ot = toNum(onTime);
  const lt = toNum(late);
  const od = toNum(overdue);

  const total = ot + lt + od;
  if (total <= 0) return 0;

  const weighted = ot * 1.0 + lt * lateWeight + od * overdueWeight;
  return clamp((weighted / total) * 100, 0, 100);
}

function scoreTone(score) {
  if (score >= 85) return "green";
  if (score >= 70) return "amber";
  return "red";
}

function ToneTag({ score }) {
  const tone = scoreTone(score);

  const bg =
    tone === "green"
      ? "rgba(220,252,231,0.92)"
      : tone === "amber"
      ? "rgba(254,243,199,0.92)"
      : "rgba(254,226,226,0.92)";

  const fg =
    tone === "green"
      ? "#166534"
      : tone === "amber"
      ? "#92400e"
      : "#991b1b";

  const txt = tone === "green" ? "Alto" : tone === "amber" ? "Medio" : "Bajo";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "6px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 950,
        background: bg,
        color: fg,
        border: "1px solid rgba(226,232,240,0.9)",
        lineHeight: 1,
        whiteSpace: "nowrap",
      }}
    >
      {txt}
    </span>
  );
}

export default function TechniciansPerformance({ days = 180 }) {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [rows, setRows] = useState([]);

  const load = async () => {
    try {
      setErr("");
      setLoading(true);
      const json = await getTechniciansPerformance({ days });
      setRows(Array.isArray(json?.result) ? json.result : []);
    } catch (e) {
      console.error(e);
      setErr(e?.message || "Error cargando desempeño");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  const computed = useMemo(() => {
    const list = rows.map((r) => {
      const completed = toNum(r?.completed ?? r?.completedCount);
      const onTime = toNum(r?.onTime);
      const late = toNum(r?.late ?? r?.badCount);
      const overdue = toNum(r?.overdue ?? r?.criticalCount);
      const score = calcScore({ onTime, late, overdue });
      const t = r?.technician || {};
      const name = t?.name || `Tecnico #${r?.technicianId}`;

      return {
        technicianId: String(r?.technicianId ?? t?.id ?? ""),
        name,
        completed,
        onTime,
        late,
        overdue,
        score,
      };
    });

    list.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.completed !== a.completed) return b.completed - a.completed;
      return String(a.name).localeCompare(String(b.name));
    });

    return list;
  }, [rows]);

  const summary = useMemo(() => {
    if (!computed.length) {
      return {
        avgScore: 0,
        bestName: "-",
        bestScore: 0,
        totalCompleted: 0,
      };
    }

    const avgScore = computed.reduce((acc, x) => acc + toNum(x.score), 0) / computed.length;
    const best = computed[0];
    const totalCompleted = computed.reduce((acc, x) => acc + toNum(x.completed), 0);

    return {
      avgScore: Math.round(avgScore),
      bestName: best?.name || "-",
      bestScore: Math.round(best?.score || 0),
      totalCompleted,
    };
  }, [computed]);

  return (
    <div className="lpCard" style={panel}>
      <div style={accentBarOrange} />

      <div style={topRow}>
        <div>
          <div style={panelTitle}>Desempeno por tecnico</div>
          <div style={sub}>
            Ultimos {days} dias. El score premia ejecuciones sanas y penaliza condiciones malas o criticas.
          </div>
        </div>

        <button onClick={load} style={btnGhost} disabled={loading} type="button">
          {loading ? "Actualizando..." : "Actualizar"}
        </button>
      </div>

      {err ? <div style={errorBox}>{err}</div> : null}

      {loading ? (
        <p style={{ marginTop: 10, color: "#64748b", fontWeight: 900 }}>Cargando...</p>
      ) : computed.length === 0 ? (
        <p style={{ marginTop: 10, color: "#64748b", fontWeight: 900 }}>
          Sin datos de tecnicos para este periodo.
        </p>
      ) : (
        <>
          <div style={summaryGrid}>
            <div className="lpCard" style={summaryCard}>
              <div style={summaryLbl}>Score promedio</div>
              <div style={summaryVal}>{summary.avgScore}%</div>
              <div style={summarySub}>Vista general del equipo tecnico</div>
            </div>

            <div className="lpCard" style={summaryCard}>
              <div style={summaryLbl}>Mejor desempeno</div>
              <div style={summaryValSm}>{summary.bestName}</div>
              <div style={summarySub}>Score: {summary.bestScore}%</div>
            </div>

            <div className="lpCard" style={summaryCard}>
              <div style={summaryLbl}>Completadas</div>
              <div style={summaryVal}>{summary.totalCompleted}</div>
              <div style={summarySub}>Total ejecutado por tecnicos</div>
            </div>
          </div>

          <div style={hint}>
            Formula: sanas = 100%, malas = 60%, criticas = 20% (ponderado sobre completadas).
          </div>

          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
            {computed.map((r, idx) => {
              const pct = Math.round(r.score);

              return (
                <div key={r.technicianId} className="lpCard" style={row}>
                  <div style={rankCol}>{idx + 1}</div>

                  <div style={left}>
                    <div style={nameRow}>
                      <div style={nameSt}>{r.name}</div>
                      <ToneTag score={pct} />
                    </div>

                    <div style={meta}>
                      Completadas: <b>{r.completed}</b>  Sanas: <b>{r.onTime}</b>  Malas: <b>{r.late}</b>  Criticas: <b>{r.overdue}</b>
                    </div>
                  </div>

                  <div style={barWrap}>
                    <div style={barBg}>
                      <div
                        style={{
                          ...barFill,
                          width: `${pct}%`,
                          ...(pct >= 85
                            ? { background: "#16a34a" }
                            : pct >= 70
                            ? { background: "#f59e0b" }
                            : { background: "#dc2626" }),
                        }}
                      />
                    </div>
                    <div style={pctTxt}>{pct}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

const panel = {
  position: "relative",
  border: "1px solid rgba(148,163,184,0.55)",
  borderRadius: 14,
  padding: 14,
  background: "rgba(255,255,255,0.96)",
  boxShadow: "0 10px 26px rgba(2,6,23,0.08)",
  outline: "1px solid rgba(255,255,255,0.9)",
  outlineOffset: -2,
  overflow: "hidden",
};

const accentBarOrange = {
  position: "absolute",
  left: 0,
  right: 0,
  top: 0,
  height: 8,
  background: "#f97316",
};

const topRow = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "flex-start",
  flexWrap: "wrap",
  marginTop: 6,
};

const panelTitle = { fontWeight: 980, color: "#0f172a" };
const sub = { marginTop: 6, fontSize: 12, color: "#64748b", fontWeight: 850 };

const hint = {
  marginTop: 12,
  fontSize: 12,
  color: "#64748b",
  fontWeight: 850,
};

const btnGhost = {
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.9)",
  borderRadius: 12,
  padding: "10px 12px",
  cursor: "pointer",
  fontWeight: 950,
  color: "#0f172a",
  boxShadow: "0 8px 18px rgba(2,6,23,0.04)",
};

const errorBox = {
  marginTop: 10,
  background: "rgba(254,226,226,0.92)",
  border: "1px solid rgba(254,202,202,0.95)",
  padding: 12,
  borderRadius: 12,
  color: "#991b1b",
  fontWeight: 900,
};

const summaryGrid = {
  marginTop: 12,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 12,
};

const summaryCard = {
  border: "1px solid rgba(148,163,184,0.55)",
  borderRadius: 14,
  padding: 14,
  background: "rgba(255,255,255,0.98)",
  boxShadow: "0 8px 18px rgba(2,6,23,0.06)",
};

const summaryLbl = { fontSize: 12, color: "#64748b", fontWeight: 950 };
const summaryVal = { marginTop: 6, fontSize: 22, fontWeight: 980, color: "#0f172a" };
const summaryValSm = {
  marginTop: 6,
  fontSize: 16,
  fontWeight: 980,
  color: "#0f172a",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};
const summarySub = { marginTop: 6, fontSize: 12, color: "#475569", fontWeight: 850 };

const row = {
  display: "grid",
  gridTemplateColumns: "44px minmax(0, 1fr) 280px",
  gap: 12,
  alignItems: "center",
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 12,
  padding: 12,
  background: "rgba(248,250,252,0.92)",
};

const rankCol = {
  width: 44,
  height: 44,
  borderRadius: 12,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(15,23,42,0.06)",
  border: "1px solid rgba(226,232,240,0.95)",
  color: "#0f172a",
  fontWeight: 980,
  flexShrink: 0,
};

const left = { minWidth: 0 };

const nameRow = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap",
};

const nameSt = {
  fontWeight: 950,
  color: "#0f172a",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const meta = { marginTop: 6, fontSize: 12, color: "#64748b", fontWeight: 850 };

const barWrap = { display: "flex", alignItems: "center", gap: 10 };
const barBg = {
  height: 12,
  background: "#e2e8f0",
  borderRadius: 999,
  overflow: "hidden",
  flex: 1,
  border: "1px solid rgba(148,163,184,0.35)",
};
const barFill = {
  height: "100%",
  borderRadius: 999,
  transition: "width 280ms ease",
};
const pctTxt = {
  width: 46,
  textAlign: "right",
  fontWeight: 950,
  color: "#334155",
  fontSize: 12,
};
