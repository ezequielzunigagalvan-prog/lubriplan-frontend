import { Icon } from "../ui/lpIcons";
import { btnGhost, btnPrimary } from "../ui/styles";

const FREQ_COLOR = {
  DAILY:     "#dc2626",
  WEEKLY:    "#f97316",
  MONTHLY:   "#d97706",
  QUARTERLY: "#16a34a",
  ANNUAL:    "#2563eb",
};

const FREQ_LABEL = {
  DAILY: "Diaria", WEEKLY: "Semanal", MONTHLY: "Mensual",
  QUARTERLY: "Trimestral", ANNUAL: "Anual",
};

const METHOD_ICON = {
  MANUAL: "wrench", AUTO: "bolt", GREASE_GUN: "tool", OIL_CAN: "drop",
};

const METHOD_LABEL = {
  MANUAL: "Manual", AUTO: "Automático", GREASE_GUN: "Pistola de grasa", OIL_CAN: "Aceitera",
};

export default function PointDetailPanel({ point, index, isEditing, onEdit, onDelete, onDuplicate, onClose }) {
  if (!point) return null;

  const color = FREQ_COLOR[point.frequency] ?? "#64748b";

  const overlay = {
    position: "fixed", inset: 0, zIndex: 200,
    background: "rgba(15,23,42,0.35)",
    backdropFilter: "blur(2px)",
  };

  const panel = {
    position: "fixed", top: 0, right: 0, bottom: 0,
    width: "min(380px, 95vw)",
    background: "#fff",
    boxShadow: "-4px 0 32px rgba(15,23,42,0.18)",
    display: "flex", flexDirection: "column",
    zIndex: 201,
    animation: "lp-slide-in 0.22s ease",
  };

  const header = {
    padding: "20px 20px 16px",
    borderBottom: "1px solid #e2e8f0",
    display: "flex", alignItems: "flex-start", justifyContent: "space-between",
    gap: 12,
  };

  const row = { display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 0", borderBottom: "1px solid #f1f5f9" };
  const rowLabel = { fontSize: 11, color: "#64748b", fontWeight: 850, minWidth: 90, paddingTop: 2 };
  const rowValue = { fontSize: 13, color: "#0f172a", fontWeight: 800, flex: 1 };

  return (
    <div style={overlay} onClick={onClose}>
      <div style={panel} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={header}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 850, marginBottom: 4 }}>
              PUNTO #{index + 1}
            </div>
            <div style={{ fontSize: 17, fontWeight: 950, color: "#0f172a", lineHeight: 1.3 }}>
              {point.label}
            </div>
            <span style={{
              display: "inline-block", marginTop: 6,
              background: `${color}18`, color, border: `1px solid ${color}44`,
              borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 900,
            }}>
              {FREQ_LABEL[point.frequency]}
            </span>
          </div>
          <button type="button" onClick={onClose} style={{ ...btnGhost, padding: "6px 10px", borderRadius: 8 }}>
            <Icon name="close" />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 20px" }}>

          <div style={row}>
            <span style={rowLabel}>Método</span>
            <span style={{ ...rowValue, display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name={METHOD_ICON[point.method] ?? "wrench"} size="sm" />
              {METHOD_LABEL[point.method]}
            </span>
          </div>

          {point.lubricant && (
            <div style={row}>
              <span style={rowLabel}>Lubricante</span>
              <span style={rowValue}>{point.lubricant}</span>
            </div>
          )}

          {point.quantity != null && (
            <div style={row}>
              <span style={rowLabel}>Cantidad</span>
              <span style={rowValue}>{point.quantity} {point.unit}</span>
            </div>
          )}

          <div style={row}>
            <span style={rowLabel}>Posición</span>
            <span style={{ ...rowValue, fontFamily: "monospace", fontSize: 12 }}>
              x: {point.x.toFixed(1)}%  y: {point.y.toFixed(1)}%
            </span>
          </div>

          {point.notes && (
            <div style={{ ...row, flexDirection: "column", gap: 4 }}>
              <span style={rowLabel}>Notas</span>
              <span style={{ ...rowValue, fontWeight: 800, lineHeight: 1.5, color: "#334155" }}>
                {point.notes}
              </span>
            </div>
          )}
        </div>

        {/* Footer actions */}
        {isEditing && (
          <div style={{ padding: "16px 20px", borderTop: "1px solid #e2e8f0", display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" style={{ ...btnGhost, flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, minWidth: 80 }}
              onClick={() => onEdit?.(point)}>
              <Icon name="edit" size="sm" /> Editar
            </button>
            <button type="button" style={{ ...btnGhost, flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, minWidth: 80, color: "#0369a1", borderColor: "#bae6fd" }}
              onClick={() => onDuplicate?.(point)}>
              <Icon name="copy" size="sm" /> Duplicar
            </button>
            <button type="button"
              style={{ ...btnGhost, flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, minWidth: 80, color: "#dc2626", borderColor: "#fca5a5" }}
              onClick={() => onDelete?.(point.id)}>
              <Icon name="trash" size="sm" /> Eliminar
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes lp-slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}
