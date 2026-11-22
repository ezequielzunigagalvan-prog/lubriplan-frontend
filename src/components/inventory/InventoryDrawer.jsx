// src/components/inventory/InventoryDrawer.jsx
// Panel lateral: registrar entrada/salida/ajuste y ver el historial de 30 días.
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { createLubricantMovement, getLubricantMovements } from "../../services/lubricantsService";
import { Icon } from "../ui/lpIcons";
import { formatQty, formatDateTime, reasonLabel } from "../../utils/inventory";
import "../../pages/TechniciansPage.css";
import "../../pages/InventoryPage.css";

const KINDS = {
  IN: { label: "Entrada", hint: "Suma al stock", cls: "k-in", sign: "+" },
  OUT: { label: "Salida", hint: "Resta del stock", cls: "k-out", sign: "−" },
  ADJUST: { label: "Ajuste", hint: "Fija el conteo", cls: "k-adj", sign: "=" },
};

const normalizeType = (raw) => {
  const t = String(raw || "").trim().toUpperCase();
  if (t === "ENTRADA") return "IN";
  if (t === "SALIDA") return "OUT";
  if (t === "AJUSTE") return "ADJUST";
  return KINDS[t] ? t : "ADJUST";
};

const DAYS = 30;

export default function InventoryDrawer({ open, item, initialTab = "move", onClose, onUpdated }) {
  const [tab, setTab] = useState(initialTab);
  const [kind, setKind] = useState("IN");
  const [qty, setQty] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const [loadingH, setLoadingH] = useState(false);
  const [errH, setErrH] = useState("");
  const [moves, setMoves] = useState([]);

  // Reinicia el formulario al abrir otro lubricante.
  useEffect(() => {
    if (!open) return;
    setTab(initialTab);
    setKind("IN");
    setQty("");
    setNotes("");
    setErrH("");
    setMoves([]);
  }, [open, initialTab, item?.id]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && !saving && onClose?.();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose, saving]);

  const loadHistory = useCallback(async () => {
    if (!item?.id) return;
    try {
      setErrH("");
      setLoadingH(true);
      const resp = await getLubricantMovements(item.id, 120);
      const all = Array.isArray(resp?.movements) ? resp.movements : [];
      const cutoff = Date.now() - DAYS * 24 * 60 * 60 * 1000;
      setMoves(all.filter((m) => new Date(m.createdAt).getTime() >= cutoff));
    } catch (e) {
      setErrH(e?.message || "No se pudo cargar el historial.");
      setMoves([]);
    } finally {
      setLoadingH(false);
    }
  }, [item?.id]);

  useEffect(() => {
    if (open && tab === "history") loadHistory();
  }, [open, tab, loadHistory]);

  const stock = Number(item?.stock || 0);
  const unit = item?.unit || "";
  const qtyNum = qty === "" ? NaN : Number(String(qty).replace(",", "."));

  // Vista previa del stock resultante antes de guardar.
  const preview = useMemo(() => {
    if (!Number.isFinite(qtyNum) || qtyNum < 0) return null;
    if (kind === "IN") return stock + qtyNum;
    if (kind === "OUT") return stock - qtyNum;
    return qtyNum;
  }, [kind, qtyNum, stock]);

  // El ajuste puede ser 0 (para dejar en cero un lubricante que ya no se usa).
  const canSubmit = !!item?.id && Number.isFinite(qtyNum) && (kind === "ADJUST" ? qtyNum >= 0 : qtyNum > 0) && !saving;

  const submitMove = async () => {
    if (!canSubmit) return;
    setSaving(true);
    try {
      const res = await createLubricantMovement(item.id, {
        movementType: kind,
        quantity: qtyNum,
        reason: notes.trim() || null,
        reference: null,
      });
      if (res?.updated?.id) onUpdated?.(res.updated);
      toast.success(
        `${KINDS[kind].label} registrada · stock: ${formatQty(res?.movement?.stockAfter ?? preview)} ${unit}`
      );
      setQty("");
      setNotes("");
      if (tab === "history") loadHistory();
    } catch (e) {
      toast.error(e?.message || "No se pudo registrar el movimiento");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="inv-drawer-overlay tch-overlay" style={{ display: "flex", placeItems: "initial", padding: 0 }} onMouseDown={(e) => e.target === e.currentTarget && !saving && onClose?.()}>
      <aside className="inv-drawer" role="dialog" aria-modal="true" aria-labelledby="inv-drawer-title">
        <div className="inv-drawer-head">
          <div style={{ minWidth: 0 }}>
            <div className="tch-kicker">Inventario</div>
            <h2 id="inv-drawer-title" className="tch-modal-title" style={{ wordBreak: "break-word" }}>{item?.name || "—"}</h2>
            <div className="tch-sub">
              Stock actual: <strong style={{ color: "var(--tch-text)" }}>{formatQty(stock)} {unit}</strong>
              {item?.code ? ` · ${item.code}` : ""}
            </div>
          </div>
          <button type="button" className="tch-icon-btn" onClick={onClose} aria-label="Cerrar" disabled={saving}>
            <Icon name="close" size="sm" />
          </button>
        </div>

        <div className="inv-drawer-body">
          <div className="tch-tabs" role="group" aria-label="Sección" style={{ width: "100%" }}>
            <button type="button" className="tch-tab" style={{ flex: 1, justifyContent: "center" }} aria-pressed={tab === "move"} onClick={() => setTab("move")}>
              Registrar movimiento
            </button>
            <button type="button" className="tch-tab" style={{ flex: 1, justifyContent: "center" }} aria-pressed={tab === "history"} onClick={() => setTab("history")}>
              Historial ({DAYS} días)
            </button>
          </div>

          {tab === "move" ? (
            <>
              <div className="inv-kinds" role="group" aria-label="Tipo de movimiento">
                {Object.entries(KINDS).map(([key, k]) => (
                  <button key={key} type="button" className={`inv-kind ${k.cls}`} aria-pressed={kind === key} onClick={() => setKind(key)}>
                    {k.label}
                    <small>{k.hint}</small>
                  </button>
                ))}
              </div>

              <div className="tch-field">
                <label htmlFor="inv-qty">
                  {kind === "ADJUST" ? "Stock contado" : "Cantidad"} <span>({unit || "unidad del lubricante"})</span>
                </label>
                <input
                  id="inv-qty"
                  className="tch-input"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  inputMode="decimal"
                  placeholder={kind === "ADJUST" ? "Ej. 18.5" : "Ej. 20"}
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && submitMove()}
                />
              </div>

              <div className="tch-field">
                <label htmlFor="inv-notes">
                  Motivo <span>(opcional)</span>
                </label>
                <input
                  id="inv-notes"
                  className="tch-input"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={200}
                  placeholder={kind === "IN" ? "Ej. Compra OC-1234" : kind === "OUT" ? "Ej. Préstamo a mantenimiento" : "Ej. Conteo físico mensual"}
                />
              </div>

              {preview != null ? (
                <div className={`inv-preview ${preview < 0 ? "is-bad" : ""}`}>
                  <span>
                    {formatQty(stock)} {unit} {KINDS[kind].sign === "=" ? "→" : `${KINDS[kind].sign} ${formatQty(qtyNum)} →`}
                  </span>
                  <strong>
                    {formatQty(preview)} {unit}
                  </strong>
                </div>
              ) : null}

              <button type="button" className="tch-btn tch-btn-primary" disabled={!canSubmit} onClick={submitMove}>
                {saving ? "Guardando…" : `Guardar ${KINDS[kind].label.toLowerCase()}`}
              </button>

              <p className="tch-hint" style={{ margin: 0 }}>
                El consumo de las actividades completadas se descuenta automáticamente; aquí solo registra compras, salidas
                fuera de una actividad y conteos físicos.
              </p>
            </>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="tch-sub" style={{ margin: 0 }}>
                  {loadingH ? "Cargando…" : `${moves.length} movimiento${moves.length === 1 ? "" : "s"}`}
                </span>
                <button type="button" className="tch-btn tch-btn-ghost" style={{ height: 34 }} onClick={loadHistory} disabled={loadingH}>
                  <Icon name="refresh" size="sm" /> Actualizar
                </button>
              </div>

              {errH ? <div className="tch-error">{errH}</div> : null}

              {!loadingH && !errH && !moves.length ? (
                <div className="tch-empty" style={{ padding: 28 }}>
                  <div className="tch-empty-icon"><Icon name="history" /></div>
                  <h3>Sin movimientos</h3>
                  <p>No hay movimientos en los últimos {DAYS} días.</p>
                </div>
              ) : null}

              <div className="inv-moves">
                {moves.map((m) => {
                  const t = normalizeType(m.type || m.movementType);
                  const k = KINDS[t];
                  const qtyText = t === "ADJUST" ? `= ${formatQty(m.stockAfter ?? m.quantity)}` : `${k.sign}${formatQty(m.quantity)}`;
                  const reason = reasonLabel(m.reason);
                  return (
                    <div key={m.id} className="inv-move">
                      <div className={`inv-move-icon ${k.cls}`} aria-hidden="true">{k.sign}</div>
                      <div>
                        <div className="inv-move-title">
                          {reason || k.label}
                          {m.executionId ? <span className="tch-chip" style={{ marginLeft: 8, height: 20 }}>Actividad #{m.executionId}</span> : null}
                        </div>
                      </div>
                      <div className="inv-move-qty">
                        {qtyText} {unit}
                      </div>
                      <div className="inv-move-detail">
                        {formatDateTime(m.createdAt)}
                        {m.note ? <> · {m.note}</> : null}
                        {m.stockBefore != null && m.stockAfter != null ? (
                          <div className="inv-move-stock">
                            Stock {formatQty(m.stockBefore)} → {formatQty(m.stockAfter)} {unit}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
