import { useMemo } from "react";
import { Icon } from "../ui/lpIcons";

const toNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

function toneFromScore(score) {
  if (score >= 85) return { chipBg: "#dcfce7", chipBd: "#bbf7d0", chipFg: "#166534" }; // green
  if (score >= 70) return { chipBg: "#fef3c7", chipBd: "#fde68a", chipFg: "#92400e" }; // amber
  return { chipBg: "#fee2e2", chipBd: "#fecaca", chipFg: "#991b1b" }; // red
}

export default function TechniciansEfficiencyCard({
  month,
  items = [],
  loading = false,
  error = "",
  onRefresh,
  onOpenTechnician, // (technicianId)=>void
}) {
  const top = useMemo(() => (Array.isArray(items) ? items.slice(0, 6) : []), [items]);

  return (
    <div style={card}>
      <div style={head}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={iconBox}>
            <Icon name="user" size="md" />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={title}>Desempeño por técnico</div>
            <div style={sub}>
              Ranking del mes · score (A tiempo 100% Â· Tarde 60% Â· Vencidas 20%){" "}
              <span style={monthPill}>
                <Icon name="calendar" size="sm" /> {month || "Mes actual"}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {onRefresh ? (
            <button type="button" style={btnMini} onClick={onRefresh} disabled={loading} title="Actualizar">
              {loading ? "..." : <Icon name="refresh" size="sm" />}
            </button>
          ) : null}
        </div>
      </div>

      {error ? <div style={errBox}>{error}</div> : null}

      {loading ? (
        <div style={muted}>Cargando...</div>
      ) : top.length === 0 ? (
        <div style={muted}>Sin datos para este mes.</div>
      ) : (
        <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
          {top.map((x) => {
            const t = x?.technician || {};
            const score = toNum(x?.scorePct);
            const total = toNum(x?.totalProgramadas);
            const done = toNum(x?.completadas);
            const overdue = toNum(x?.vencidas);
            const late = toNum(x?.tarde);
            const onTime = toNum(x?.aTiempo);
            const pending = toNum(x?.pendientes);

            const tone = toneFromScore(score);

            return (
              <button
                key={t?.id ?? `${t?.name}-${score}`}
                type="button"
                onClick={() => onOpenTechnician?.(t?.id)}
                style={{
                  ...rowBtn,
                  cursor: onOpenTechnician ? "pointer" : "default",
                }}
                title={onOpenTechnician ? "Ver actividades del técnico" : undefined}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={rowTop}>
                    <div style={{ minWidth: 0 }}>
                      <div style={nameLine}>
                        <span style={nameTxt}>{t?.name || "técnico"}</span>
                        {t?.code ? <span style={tag}>#{t.code}</span> : null}
                        {t?.specialty ? <span style={tagSoft}>{t.specialty}</span> : null}
                      </div>

                      <div style={metaLine}>
                        <span style={metaItem}>
                          <Icon name="route" size="sm" /> Programadas: <b>{total}</b>
                        </span>
                        <span style={metaItem}>
                          <Icon name="check" size="sm" /> Completadas: <b>{done}</b>
                        </span>
                        <span style={metaItem}>
                          <Icon name="clock" size="sm" /> Vencidas: <b>{overdue}</b>
                        </span>
                      </div>
                    </div>

                    <span
                      style={{
                        ...scoreChip,
                        background: tone.chipBg,
                        border: `1px solid ${tone.chipBd}`,
                        color: tone.chipFg,
                      }}
                    >
                      <Icon name="check" size="sm" /> {score}%
                    </span>
                  </div>

                  {/* Barra de score */}
                  <div style={barTrack}>
                    <div style={{ ...barFill, width: `${Math.min(100, Math.max(0, score))}%` }} />
                  </div>

                  {/* Breakdown mini */}
                  <div style={breakLine}>
                    <span style={breakItem}>
                      <span style={dot("#22c55e")} /> A tiempo: <b>{onTime}</b>
                    </span>
                    <span style={breakItem}>
                      <span style={dot("#f59e0b")} /> Tarde: <b>{late}</b>
                    </span>
                    <span style={breakItem}>
                      <span style={dot("#ef4444")} /> Vencidas: <b>{overdue}</b>
                    </span>
                    <span style={breakItem}>
                      <span style={dot("#94a3b8")} /> Pendientes: <b>{pending}</b>
                    </span>
                  </div>
                </div>

                <div style={chev}>
                  <Icon name="chevRight" size="sm" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div style={hint}>
        Tip: toca un técnico para filtrar sus actividades del mes (si habilitas la navegaciÃ³n).
      </div>
    </div>
  );
}

/* ============ styles ============ */

const card = {
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 18,
  overflow: "hidden",
  background: "linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)",
  boxShadow: "0 12px 28px rgba(2,6,23,0.06)",
};

const head = {
  background: "#0f172a",
  padding: 12,
  color: "#fff",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
  flexWrap: "wrap",
};

const iconBox = {
  width: 38,
  height: 38,
  borderRadius: 14,
  display: "grid",
  placeItems: "center",
  background: "rgba(249,115,22,0.18)",
  border: "1px solid rgba(249,115,22,0.24)",
  color: "#fff",
};

const title = { fontWeight: 1000 };
const sub = { marginTop: 4, fontSize: 12, fontWeight: 800, color: "rgba(226,232,240,0.92)" };

const monthPill = {
  marginLeft: 8,
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "4px 10px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.10)",
  border: "1px solid rgba(226,232,240,0.25)",
  color: "#e2e8f0",
  fontWeight: 900,
};

const btnMini = {
  border: "1px solid rgba(226,232,240,0.25)",
  background: "rgba(255,255,255,0.10)",
  borderRadius: 12,
  padding: "8px 10px",
  cursor: "pointer",
  fontWeight: 950,
  color: "#fff",
};

const errBox = {
  margin: 12,
  background: "#fff1f2",
  border: "1px solid #fecaca",
  borderRadius: 12,
  padding: 10,
  color: "#991b1b",
  fontWeight: 900,
};

const muted = { padding: 14, color: "#64748b", fontWeight: 850 };

const rowBtn = {
  margin: "0 12px",
  borderRadius: 16,
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.9)",
  padding: 12,
  display: "grid",
  gridTemplateColumns: "1fr 30px",
  gap: 10,
  alignItems: "center",
  textAlign: "left",
};

const rowTop = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 10,
  flexWrap: "wrap",
};

const nameLine = { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" };
const nameTxt = { fontWeight: 1000, color: "#0f172a" };

const tag = {
  fontSize: 12,
  fontWeight: 950,
  color: "#0f172a",
  padding: "2px 8px",
  borderRadius: 999,
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(248,250,252,0.9)",
};

const tagSoft = {
  fontSize: 12,
  fontWeight: 900,
  color: "#475569",
  padding: "2px 8px",
  borderRadius: 999,
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(241,245,249,0.9)",
};

const metaLine = {
  marginTop: 6,
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  color: "#64748b",
  fontWeight: 850,
  fontSize: 12,
};

const metaItem = { display: "inline-flex", alignItems: "center", gap: 6 };

const scoreChip = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "6px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 1000,
  whiteSpace: "nowrap",
};

const barTrack = {
  marginTop: 10,
  height: 10,
  borderRadius: 999,
  background: "#e5e7eb",
  overflow: "hidden",
  border: "1px solid rgba(0,0,0,0.05)",
};

const barFill = {
  height: "100%",
  background: "#f97316",
  borderRadius: 999,
};

const breakLine = {
  marginTop: 10,
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  color: "#475569",
  fontWeight: 850,
  fontSize: 12,
};

const breakItem = { display: "inline-flex", alignItems: "center", gap: 8 };
const dot = (bg) => ({ width: 8, height: 8, borderRadius: 999, background: bg, display: "inline-block" });

const chev = {
  width: 30,
  height: 30,
  borderRadius: 12,
  display: "grid",
  placeItems: "center",
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(248,250,252,0.9)",
  color: "#0f172a",
};

const hint = {
  padding: "10px 14px 14px",
  fontSize: 12,
  fontWeight: 800,
  color: "#64748b",
};