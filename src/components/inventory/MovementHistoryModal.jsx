// src/components/modals/MovementHistoryModal.jsx
import { useEffect, useMemo, useState } from "react";
import { getLubricantMovements } from "../../services/lubricantMovementsService";

/**
 * Soporta:
 * - Nuevo: IN | OUT | ADJUST
 * - Legacy: ENTRADA | SALIDA | AJUSTE
 */
const normalizeType = (raw) => {
  const t = String(raw || "").trim().toUpperCase();
  if (t === "ENTRADA") return "IN";
  if (t === "SALIDA") return "OUT";
  if (t === "AJUSTE") return "ADJUST";
  return t; // IN | OUT | ADJUST | lo-que-sea
};

const TYPE_LABEL = {
  IN: "Entrada",
  OUT: "Salida",
  ADJUST: "Ajuste",
  ENTRADA: "Entrada",
  SALIDA: "Salida",
  AJUSTE: "Ajuste",
};

function fmtDate(v) {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function fmtQty(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  return x % 1 === 0 ? String(x) : x.toFixed(2);
}

const typePill = (type) => {
  const t = normalizeType(type);
  const map = {
    IN: { bg: "rgba(187,247,208,0.75)", fg: "#166534", br: "rgba(187,247,208,0.95)", icon: "⬆" },
    OUT: { bg: "rgba(254,202,202,0.75)", fg: "#991b1b", br: "rgba(254,202,202,0.95)", icon: "⬇" },
    ADJUST: { bg: "rgba(224,231,255,0.80)", fg: "#3730a3", br: "rgba(224,231,255,0.95)", icon: "✳" },
  };
  const v = map[t] || { bg: "rgba(241,245,249,0.9)", fg: "#0f172a", br: "rgba(226,232,240,0.95)", icon: "•" };

  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "5px 10px",
    borderRadius: 999,
    fontWeight: 950,
    fontSize: 12,
    background: v.bg,
    color: v.fg,
    border: `1px solid ${v.br}`,
    whiteSpace: "nowrap",
  };
};

export default function MovementHistoryModal({ open, item, onClose }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [data, setData] = useState({ lubricant: null, movements: [] });

  // lock scroll + ESC
  useEffect(() => {
    if (!open) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !item?.id) return;

    let alive = true;

    (async () => {
      try {
        setErr("");
        setLoading(true);
        const res = await getLubricantMovements(item.id, 80);
        if (!alive) return;
        setData(res || { lubricant: null, movements: [] });
      } catch (e) {
        if (!alive) return;
        console.error(e);
        setErr(e?.message || "Error cargando historial");
        setData({ lubricant: null, movements: [] });
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [open, item?.id]);

  const total = useMemo(() => (data?.movements || []).length, [data]);

  const unit = useMemo(() => {
    // prioridad: item.unit, luego lubricant.unit
    return item?.unit || data?.lubricant?.unit || "";
  }, [item?.unit, data?.lubricant?.unit]);

  const titleName = useMemo(() => {
    return item?.name || data?.lubricant?.name || "—";
  }, [item?.name, data?.lubricant?.name]);

  if (!open) return null;

  return (
    <div style={overlay} onClick={onClose}>
      {/* Animación + estilo consistente */}
      <div className="lpModal" style={modal} onClick={(e) => e.stopPropagation()}>
        <style>{`
          .lpModal {
            animation: lpIn 160ms ease-out;
            transform-origin: 80% 20%;
          }
          @keyframes lpIn {
            from { transform: translateY(8px) scale(0.985); opacity: 0; }
            to   { transform: translateY(0px) scale(1); opacity: 1; }
          }
        `}</style>

        <div style={modalHeader}>
          <div style={{ minWidth: 0 }}>
            <div style={hKicker}>MOVIMIENTOS · HISTORIAL</div>
            <div style={hTitle}>Historial de movimientos</div>
            <div style={sub}>
              <strong style={{ color: "rgba(255,255,255,0.90)" }}>{titleName}</strong>
              {" "}· Stock actual:{" "}
              <strong style={{ color: "rgba(255,255,255,0.90)" }}>
                {fmtQty(item?.stock ?? 0)} {unit}
              </strong>
              {" "}· Registros: <strong style={{ color: "rgba(255,255,255,0.90)" }}>{total}</strong>
            </div>
          </div>

          <button onClick={onClose} style={btnGhostHead} title="Cerrar">✕</button>
        </div>

        {err && <div style={errorBox}>{err}</div>}

        {loading ? (
          <p style={{ marginTop: 12, color: "#64748b", fontWeight: 900 }}>Cargando…</p>
        ) : (
          <div style={tableWrap}>
            <table style={table}>
              <thead>
                <tr>
                  <th style={th}>Fecha</th>
                  <th style={th}>Tipo</th>
                  <th style={thRight}>Cantidad</th>
                  <th style={th}>Motivo</th>
                  <th style={th}>Referencia / Nota</th>
                </tr>
              </thead>

              <tbody>
                {(data?.movements || []).length === 0 ? (
                  <tr>
                    <td style={tdMuted} colSpan={5}>
                      Sin movimientos todavía.
                    </td>
                  </tr>
                ) : (
                  data.movements.map((m) => {
                    const tNorm = normalizeType(m.type || m.movementType);

                    const sign =
                      tNorm === "IN" ? "+" :
                      tNorm === "OUT" ? "−" :
                      "";

                    const execId = m.executionId || m?.execution?.id || null;

                    // prioridad: referencia explícita > nota > ejecución > —
                    const refOrNote =
                      m.reference ||
                      m.note ||
                      (execId ? `Ejecución #${execId}` : "") ||
                      "—";

                    const label = TYPE_LABEL[tNorm] || TYPE_LABEL[m.type] || m.type || "—";
                    const icon = tNorm === "IN" ? "⬆" : tNorm === "OUT" ? "⬇" : tNorm === "ADJUST" ? "✳" : "•";

                    return (
                      <tr key={m.id}>
                        <td style={td}>{fmtDate(m.createdAt)}</td>

                        <td style={td}>
                          <span style={typePill(tNorm)}>
                            <span style={{ opacity: 0.9 }}>{icon}</span>
                            {label}
                          </span>
                        </td>

                        <td style={tdRight}>
                          <strong style={{ color: "#0f172a" }}>
                            {sign}{fmtQty(m.quantity)} {unit}
                          </strong>
                        </td>

                        <td style={td}>{m.reason || "—"}</td>
                        <td style={td}>{refOrNote}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        <div style={footer}>
          <button onClick={onClose} style={btnGhost}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

/* =========================
   styles (consistentes con LubriPlan)
========================= */

const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(15,23,42,0.35)",
  backdropFilter: "blur(3px)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
  padding: 14,
};

const modal = {
  width: 920,
  maxWidth: "96vw",
  background: "linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)",
  border: "1px solid rgba(226,232,240,0.95)",
  borderTop: "4px solid #f97316",
  borderRadius: 16,
  padding: 16,
  boxShadow: "0 18px 44px rgba(2,6,23,0.18)",
  overflow: "hidden",
};

const modalHeader = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "flex-start",
  background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
  margin: "-16px -16px 12px",
  padding: "14px 16px",
  borderRadius: "14px 14px 0 0",
  borderLeft: "3px solid rgba(249,115,22,0.55)",
};

const hKicker = {
  fontSize: 11,
  letterSpacing: "0.12em",
  fontWeight: 900,
  color: "rgba(249,115,22,0.90)",
  marginBottom: 4,
};

const hTitle = {
  margin: 0,
  fontWeight: 980,
  fontSize: 18,
  color: "#fff",
};

const sub = {
  marginTop: 6,
  color: "rgba(255,255,255,0.65)",
  fontSize: 13,
  fontWeight: 850,
  lineHeight: 1.35,
};

const tableWrap = {
  marginTop: 12,
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 14,
  overflow: "auto",
  maxHeight: "60vh",
  background: "rgba(255,255,255,0.9)",
  boxShadow: "0 10px 22px rgba(2,6,23,0.06)",
};

const table = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 13,
};

const th = {
  textAlign: "left",
  padding: "10px 12px",
  background: "rgba(248,250,252,0.95)",
  borderBottom: "1px solid rgba(226,232,240,0.95)",
  position: "sticky",
  top: 0,
  zIndex: 1,
  color: "#64748b",
  fontWeight: 950,
  fontSize: 12,
};

const thRight = { ...th, textAlign: "right" };

const td = {
  padding: "10px 12px",
  borderBottom: "1px solid rgba(241,245,249,0.95)",
  color: "#0f172a",
  verticalAlign: "top",
  fontWeight: 850,
};

const tdRight = { ...td, textAlign: "right", whiteSpace: "nowrap" };

const tdMuted = {
  padding: 16,
  color: "#64748b",
  textAlign: "center",
  fontWeight: 900,
};

const btnGhost = {
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.9)",
  borderRadius: 12,
  padding: "8px 12px",
  cursor: "pointer",
  fontWeight: 950,
  color: "#0f172a",
  boxShadow: "0 8px 18px rgba(2,6,23,0.06)",
};

const btnGhostHead = {
  border: "1px solid rgba(255,255,255,0.20)",
  background: "rgba(255,255,255,0.10)",
  borderRadius: 12,
  padding: "8px 12px",
  cursor: "pointer",
  fontWeight: 950,
  color: "#fff",
};

const footer = {
  marginTop: 14,
  display: "flex",
  justifyContent: "flex-end",
};

const errorBox = {
  marginTop: 12,
  background: "rgba(254,226,226,0.92)",
  border: "1px solid rgba(254,202,202,0.95)",
  padding: 12,
  borderRadius: 12,
  color: "#991b1b",
  fontSize: 13,
  fontWeight: 900,
};