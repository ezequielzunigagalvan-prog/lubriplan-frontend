import { useEffect, useState } from "react";
import { toast } from "sonner";

// ✅ Backend espera: IN | OUT | ADJUST
const TYPES = [
  { value: "IN", label: "Entrada (+)" },
  { value: "OUT", label: "Salida (-)" },
  { value: "ADJUST", label: "Ajuste (set stock)" },
];

function Field({ label, children, hint }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <div style={{ fontWeight: 900, fontSize: 13 }}>{label}</div>
        {hint ? (
          <span title={hint} style={{ opacity: 0.7 }}>
            ℹ️
          </span>
        ) : null}
      </div>
      {children}
      {hint ? (
        <div style={{ fontSize: 12, color: "#6b7280" }}>{hint}</div>
      ) : null}
    </div>
  );
}

export default function NewMovementModal({ open, item, onClose, onSave }) {
  const initialState = {
    movementType: "IN", // ✅ IN por default
    quantity: "",
    reason: "", // ✅ opcional
    reference: "", // opcional
  };

  const [form, setForm] = useState(initialState);

  useEffect(() => {
    if (open) setForm(initialState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item?.id]);

  if (!open) return null;

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    const qty = Number(form.quantity);
    if (!Number.isFinite(qty) || qty <= 0) { toast.error("Cantidad inválida (debe ser > 0)."); return; }

    // ✅ manda exactamente lo que backend valida
    await onSave({
      movementType: form.movementType, // IN | OUT | ADJUST
      quantity: qty,
      reason: form.reason?.trim() || null, // ✅ opcional
      reference: form.reference?.trim() || null,
    });
  };

  const isAdjust = form.movementType === "ADJUST";

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <div style={modalHeader}>
          <div>
            <div style={mKicker}>INVENTARIO · MOVIMIENTO</div>
            <h2 style={{ margin: "6px 0 0", fontWeight: 950, color: "#fff", fontSize: 18 }}>Movimiento</h2>
            {item ? (
              <div style={{ color: "rgba(255,255,255,0.65)", marginTop: 6, fontSize: 13, fontWeight: 850 }}>
                <strong style={{ color: "rgba(255,255,255,0.90)" }}>{item.name}</strong> · Stock actual:{" "}
                <strong style={{ color: "rgba(255,255,255,0.90)" }}>
                  {Number(item.stock ?? 0)} {item.unit || ""}
                </strong>
              </div>
            ) : null}
          </div>
          <button onClick={onClose} style={btnGhostHead}>✕</button>
        </div>

        <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
          <Field
            label="Tipo *"
            hint="Entrada suma, Salida resta, Ajuste establece el stock final."
          >
            <select
              name="movementType"
              value={form.movementType}
              onChange={handleChange}
              style={input}
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label={isAdjust ? "Nuevo stock *" : "Cantidad *"}
            hint={
              isAdjust
                ? "En ajuste, la cantidad que pongas será el STOCK FINAL."
                : "Cantidad en la unidad base del producto."
            }
          >
            <input
              type="number"
              name="quantity"
              value={form.quantity}
              onChange={handleChange}
              style={input}
              min="0"
              step="0.01"
              placeholder={isAdjust ? "Ej: 20" : "Ej: 5"}
            />
          </Field>

          <Field
            label="Motivo (opcional)"
            hint="Opcional. Ej: compra, consumo, derrame, corrección, etc."
          >
            <input
              name="reason"
              value={form.reason}
              onChange={handleChange}
              style={input}
              placeholder="Ej: Consumo por mantenimiento"
            />
          </Field>

          <Field
            label="Referencia (opcional)"
            hint="Ej: factura, folio, actividad #, etc."
          >
            <input
              name="reference"
              value={form.reference}
              onChange={handleChange}
              style={input}
              placeholder="Ej: Actividad #42"
            />
          </Field>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            marginTop: 16,
          }}
        >
          <button onClick={onClose} style={btnGhost}>
            Cancelar
          </button>
          <button onClick={handleSubmit} style={primaryBtn}>
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

/* styles */
const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
  padding: 14,
};

const modal = {
  width: 520,
  maxWidth: "96vw",
  background: "#fff",
  borderRadius: 16,
  padding: 16,
  borderTop: "4px solid #f97316",
  overflow: "hidden",
};

const modalHeader = {
  background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
  margin: "-16px -16px 14px",
  padding: "14px 16px",
  borderRadius: "14px 14px 0 0",
  borderLeft: "3px solid rgba(249,115,22,0.55)",
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  flexWrap: "wrap",
  alignItems: "flex-start",
};

const mKicker = {
  fontSize: 11,
  fontWeight: 950,
  color: "rgba(249,115,22,0.90)",
  letterSpacing: 1.2,
};

const btnGhostHead = {
  border: "1px solid rgba(255,255,255,0.20)",
  background: "rgba(255,255,255,0.10)",
  borderRadius: 10,
  padding: "8px 12px",
  cursor: "pointer",
  fontWeight: 900,
  color: "#fff",
};

const input = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  outline: "none",
};

const btnGhost = {
  border: "1px solid #e5e7eb",
  background: "#fff",
  borderRadius: 10,
  padding: "8px 12px",
  cursor: "pointer",
  fontWeight: 900,
};

const primaryBtn = {
  background: "#ff7a00",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  padding: "8px 12px",
  cursor: "pointer",
  fontWeight: 900,
};