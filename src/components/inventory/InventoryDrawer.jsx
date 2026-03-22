// src/components/inventory/InventoryDrawer.jsx
import { useEffect, useMemo, useState } from "react";
import {
  createLubricantMovement,
  getLubricantMovements,
} from "../../services/lubricantsService";

import { History, ArrowUpCircle, ArrowDownCircle, SlidersHorizontal, RefreshCcw } from "lucide-react";

const normalizeType = (raw) => {
  const t = String(raw || "").trim().toUpperCase();
  if (t === "ENTRADA") return "IN";
  if (t === "SALIDA") return "OUT";
  if (t === "AJUSTE") return "ADJUST";
  return t; // IN | OUT | ADJUST
};

function toneForKind(kind) {
  if (kind === "IN") {
    return {
      bg: "rgba(34,197,94,0.12)",
      border: "1px solid rgba(34,197,94,0.25)",
      color: "#166534",
    };
  }
  if (kind === "OUT") {
    return {
      bg: "rgba(239,68,68,0.10)",
      border: "1px solid rgba(239,68,68,0.22)",
      color: "#991b1b",
    };
  }
  return {
    bg: "rgba(245,158,11,0.12)",
    border: "1px solid rgba(245,158,11,0.24)",
    color: "#92400e",
  };
}

export default function InventoryDrawer({
  open,
  item,
  initialTab = "move", // "move" | "history"
  onClose,
  onUpdated, // (updatedLubricant) => void
  onToast,
}) {
  const [tab, setTab] = useState(initialTab);

  // movimiento
  const [kind, setKind] = useState("IN"); // IN | OUT | ADJUST
  const [qty, setQty] = useState("");
  const [notes, setNotes] = useState("");

  // foco (subrayado del renglón)
  const [activeField, setActiveField] = useState("");

  // historial
  const [loadingH, setLoadingH] = useState(false);
  const [errH, setErrH] = useState("");
  const [moves, setMoves] = useState([]);
  const [take] = useState(80);

  useEffect(() => {
    if (!open) return;
    setTab(initialTab);

    // reset movimiento al abrir
    setKind("IN");
    setQty("");
    setNotes("");
    setActiveField("");

    // reset historial
    setErrH("");
    setMoves([]);
  }, [open, initialTab, item?.id]);

  // ESC para cerrar
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Scroll lock
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const canSubmit = useMemo(() => {
    const n = Number(qty);
    return item?.id && Number.isFinite(n) && n > 0;
  }, [qty, item?.id]);

  // ===== Historial últimos 30 días (front) =====
  const cutoff30 = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d;
  }, []);

  const loadHistory = async () => {
    if (!item?.id) return;
    try {
      setErrH("");
      setLoadingH(true);

      // ✅ tu backend actual: GET /lubricants/:id/movements?take=80
      const resp = await getLubricantMovements(item.id, take);

      // resp debe ser { ok, lubricant, movements }
      const all = Array.isArray(resp?.movements) ? resp.movements : [];

      // ✅ filtrar últimos 30 días aquí (si luego lo metemos al backend, lo quitamos)
      const last30 = all.filter((m) => {
        const dt = new Date(m.createdAt);
        return Number.isFinite(dt.getTime()) && dt >= cutoff30;
      });

      setMoves(last30);
    } catch (e) {
      setErrH(e?.message || "Error cargando historial");
      setMoves([]);
    } finally {
      setLoadingH(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    if (tab === "history") loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, open, item?.id]);

  const submitMove = async () => {
    if (!canSubmit) return;

    const payload = {
      movementType: kind, // IN | OUT | ADJUST
      quantity: Number(qty),
      reason: notes?.trim() ? notes.trim() : null,
      reference: null,
    };

    const res = await createLubricantMovement(item.id, payload);

    if (res?.updated?.id) onUpdated?.(res.updated);

    if (tab === "history") await loadHistory();

      // ✅ CONFIRMACIÓN
    onToast?.({
      tone: "success",
      title: "Movimiento guardado",
      message:
        kind === "IN"
          ? "Entrada registrada"
          : kind === "OUT"
          ? "Salida registrada"
          : "Ajuste registrado",
    });

    setQty("");
    setNotes("");
    setActiveField("");
  };

  if (!open) return null;

  const unit = item?.unit || "";
  const kindTone = toneForKind(kind);

  return (
    <div style={overlay} onMouseDown={onClose}>
      <div style={drawer} onMouseDown={(e) => e.stopPropagation()}>
        {/* TOP */}
        <div style={topBar}>
          <div style={{ minWidth: 0 }}>
            <div style={drawerTitle}>Inventario</div>
            <div style={drawerSub} title={item?.name || ""}>
              <strong style={{ color: "#0f172a" }}>{item?.name || "—"}</strong>
              {item?.code ? ` · ${item.code}` : ""}
            </div>
          </div>

          <button onClick={onClose} style={btnX} title="Cerrar (ESC)">
            ✕
          </button>
        </div>

        {/* TABS */}
        <div style={tabs}>
          <button
            type="button"
            onClick={() => setTab("move")}
            style={{ ...tabBtn, ...(tab === "move" ? tabBtnOn : {}) }}
          >
            <SlidersHorizontal size={16} strokeWidth={2.2} />
            Movimiento
          </button>

          <button
            type="button"
            onClick={() => setTab("history")}
            style={{ ...tabBtn, ...(tab === "history" ? tabBtnOn : {}) }}
          >
            <History size={16} strokeWidth={2.2} />
            Historial (30 días)
          </button>
        </div>

        {/* CONTENT */}
        {tab === "move" ? (
          <div style={content}>
            <div style={sectionCard}>
              <div style={sectionHeader}>
                <div style={sectionTitle}>Registrar movimiento</div>
                <div style={{ ...kindChip, ...kindTone }}>
                  {kind === "IN" ? (
                    <>
                      <ArrowUpCircle size={16} strokeWidth={2.2} />
                      Entrada
                    </>
                  ) : kind === "OUT" ? (
                    <>
                      <ArrowDownCircle size={16} strokeWidth={2.2} />
                      Salida
                    </>
                  ) : (
                    <>
                      <SlidersHorizontal size={16} strokeWidth={2.2} />
                      Ajuste
                    </>
                  )}
                </div>
              </div>

              <div style={formGrid}>
                <div style={fieldWrap(activeField === "kind")}>
                  <label style={label}>Tipo de movimiento</label>
                  <select
                    value={kind}
                    onChange={(e) => setKind(e.target.value)}
                    style={input}
                    onFocus={() => setActiveField("kind")}
                    onBlur={() => setActiveField("")}
                  >
                    <option value="IN">Entrada</option>
                    <option value="OUT">Salida</option>
                    <option value="ADJUST">Ajuste</option>
                  </select>
                </div>

                <div style={fieldWrap(activeField === "qty")}>
                  <label style={label}>Cantidad</label>
                  <input
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    placeholder={`Ej: 5 ${unit ? `(${unit})` : ""}`}
                    style={input}
                    inputMode="decimal"
                    onFocus={() => setActiveField("qty")}
                    onBlur={() => setActiveField("")}
                  />
                </div>

                <div style={fieldWrap(activeField === "notes")}>
                  <label style={label}>Motivo / Notas (opcional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    style={{ ...input, resize: "vertical" }}
                    onFocus={() => setActiveField("notes")}
                    onBlur={() => setActiveField("")}
                  />
                </div>
              </div>

              <button
                type="button"
                style={{
                  ...btnPrimary,
                  opacity: canSubmit ? 1 : 0.6,
                  cursor: canSubmit ? "pointer" : "not-allowed",
                }}
                disabled={!canSubmit}
                onClick={async () => {
                  try {
                    await submitMove();
                  } catch (e) {
                    alert(e?.message || "Error registrando movimiento");
                  }
                }}
              >
                Guardar movimiento
              </button>

              <div style={tip}>
                Tip: <strong>Entrada</strong> suma, <strong>Salida</strong> resta,{" "}
                <strong>Ajuste</strong> establece el stock final.
              </div>
            </div>
          </div>
        ) : (
          <div style={content}>
            {errH && <div style={errorBox}>{errH}</div>}

            <div style={historyTop}>
              <button type="button" style={btnRefresh} disabled={loadingH} onClick={loadHistory}>
                <RefreshCcw size={16} strokeWidth={2.2} />
                {loadingH ? "Actualizando..." : "Actualizar"}
              </button>
            </div>

            {loadingH && (
              <div style={panel}>
                <p style={{ margin: 0, fontWeight: 900, color: "#0f172a" }}>Cargando historial…</p>
              </div>
            )}

            {!loadingH && moves.length === 0 && <div style={emptyBox}>Sin movimientos.</div>}

            <div style={list}>
              {moves.map((m) => {
                const t = normalizeType(m.type || m.movementType);

                const title =
                  t === "IN" ? "Entrada" : t === "OUT" ? "Salida" : "Ajuste";

                const badgeTone = toneForKind(t);

                return (
                  <div key={m.id} style={moveRow}>
                    <div style={moveTop}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ ...moveBadge, ...badgeTone }}>
                          {t === "IN" ? "⬆" : t === "OUT" ? "⬇" : "✳"} {title}
                        </span>

                        <div style={moveDate}>
                          {m.createdAt ? new Date(m.createdAt).toLocaleString() : "—"}
                        </div>
                      </div>

                      <div style={moveQty}>
                        {m.quantity} {unit}
                      </div>
                    </div>

                    {m.reason ? (
                      <div style={moveReason}>{m.reason}</div>
                    ) : null}

                    {m.note ? (
                      <div style={moveNote}>{m.note}</div>
                    ) : null}

                    {(m.stockBefore != null || m.stockAfter != null) ? (
                      <div style={moveStock}>
                        Stock: {m.stockBefore ?? "—"} → {m.stockAfter ?? "—"}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ===== styles (unificado) ===== */

const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(2,6,23,0.45)",
  backdropFilter: "blur(2px)",
  zIndex: 80,
  display: "flex",
  justifyContent: "flex-end",
};

const drawer = {
  width: "min(560px, 92vw)",
  height: "100%",
  background: "linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)",
  borderLeft: "1px solid rgba(226,232,240,0.95)",
  boxShadow: "0 20px 60px rgba(2,6,23,0.35)",
  padding: 14,
  display: "flex",
  flexDirection: "column",
};

const topBar = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 10,
};

const drawerTitle = { fontSize: 16, fontWeight: 950, color: "#0f172a" };
const drawerSub = {
  marginTop: 4,
  fontSize: 12,
  color: "#64748b",
  fontWeight: 850,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  maxWidth: 420,
};

const btnX = {
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.9)",
  borderRadius: 12,
  padding: "8px 10px",
  cursor: "pointer",
  fontWeight: 950,
};

const tabs = { display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" };

const tabBtn = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.9)",
  borderRadius: 999,
  padding: "8px 12px",
  cursor: "pointer",
  fontWeight: 950,
};

const tabBtnOn = {
  background: "rgba(249,115,22,0.14)",
  border: "1px solid rgba(249,115,22,0.35)",
};

const content = { marginTop: 14, overflow: "auto", paddingRight: 4 };

const sectionCard = {
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 16,
  padding: 14,
  background: "rgba(255,255,255,0.82)",
  boxShadow: "0 10px 22px rgba(2,6,23,0.06)",
};

const sectionHeader = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  flexWrap: "wrap",
  marginBottom: 10,
};

const sectionTitle = { fontWeight: 950, color: "#0f172a" };

const kindChip = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "6px 10px",
  borderRadius: 999,
  fontWeight: 950,
  fontSize: 12,
};

const formGrid = {
  display: "grid",
  gap: 12,
};

const fieldWrap = (active) => ({
  display: "flex",
  flexDirection: "column",
  gap: 6,
  paddingBottom: 10,
  borderBottom: active ? "2px solid rgba(249,115,22,0.65)" : "2px solid rgba(226,232,240,0.6)",
  transition: "border-color 140ms ease",
});

const label = { fontSize: 12, color: "#64748b", fontWeight: 900 };

const input = {
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 12,
  padding: "10px 12px",
  fontWeight: 900,
  background: "rgba(255,255,255,0.92)",
  boxShadow: "0 8px 18px rgba(2,6,23,0.04)",
  outline: "none",
};

const btnPrimary = {
  marginTop: 12,
  background: "#f97316",
  color: "#0b1220",
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #fb923c",
  fontWeight: 950,
  boxShadow: "0 10px 22px rgba(249,115,22,0.18)",
};

const tip = {
  marginTop: 10,
  color: "#64748b",
  fontWeight: 800,
  fontSize: 12,
};

const historyTop = {
  display: "flex",
  justifyContent: "flex-end",
};

const btnRefresh = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.85)",
  borderRadius: 12,
  padding: "8px 10px",
  cursor: "pointer",
  fontWeight: 950,
  boxShadow: "0 10px 22px rgba(2,6,23,0.06)",
};

const panel = {
  marginTop: 12,
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  padding: 14,
};

const list = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
  marginTop: 12,
};

const moveRow = {
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 16,
  padding: 12,
  background: "rgba(255,255,255,0.85)",
  boxShadow: "0 8px 18px rgba(2,6,23,0.04)",
};

const moveTop = {
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  alignItems: "center",
  flexWrap: "wrap",
};

const moveBadge = {
  padding: "6px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 950,
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
};

const moveDate = {
  color: "#64748b",
  fontWeight: 850,
  fontSize: 12,
};

const moveQty = {
  fontWeight: 950,
  color: "#0f172a",
};

const moveReason = {
  marginTop: 8,
  color: "#0f172a",
  fontWeight: 850,
};

const moveNote = {
  marginTop: 6,
  color: "#334155",
  fontWeight: 850,
};

const moveStock = {
  marginTop: 8,
  color: "#64748b",
  fontWeight: 850,
  fontSize: 12,
};

const emptyBox = {
  marginTop: 12,
  padding: 12,
  borderRadius: 12,
  border: "1px dashed #cbd5e1",
  color: "#64748b",
  fontWeight: 800,
  fontSize: 13,
  background: "rgba(248,250,252,0.85)",
};

const errorBox = {
  marginTop: 10,
  background: "#fee2e2",
  border: "1px solid #fecaca",
  padding: 12,
  borderRadius: 12,
  color: "#991b1b",
  fontWeight: 900,
};