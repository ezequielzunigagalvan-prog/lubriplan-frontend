// src/components/inventory/InventoryCard.jsx
import { Pencil, Trash2, Tag, MapPin, Droplets } from "lucide-react";

export default function InventoryCard({
  item,
  canDelete = true,

  // acciones
  onEdit,
  onDelete,
  onOpenMove,
  onOpenHistory,

  // helpers (para mantener tu lógica centralizada)
  getStock,
  getMin,
  itemValue,
  formatCurrency,

  // barra relativa
  getBaseline,
}) {
  if (!item) return null;

  const stock = getStock ? getStock(item) : Number(item?.stock ?? 0) || 0;
  const min = getMin ? getMin(item) : (item?.minStock == null ? null : Number(item.minStock));

  const out = stock <= 0;
  const low = !out && min != null && stock <= min;

  const eqCode =
    item?.equipmentCode ||
    item?.equipment?.code ||
    item?.route?.equipment?.code ||
    null;

  const propRaw = String(item?.viscosity ?? "").trim();
  const propText = propRaw ? propRaw : null;

  // barra relativa (baseline=100)
  const baseline = getBaseline ? getBaseline(item.id, stock) : Math.max(1, stock);
  const pct = Math.max(0, Math.min(100, Math.round((stock / baseline) * 100)));

  const barStyle = {
    ...barFill,
    width: `${pct}%`,
    background: out ? "#ef4444" : low ? "#f59e0b" : "#22c55e",
  };

  const value = itemValue ? itemValue(item) : 0;
  const hasCost = item?.unitCost != null && item?.unitCost !== "";

  return (
    <div
      style={{
        ...card,
        borderColor: out
          ? "rgba(239,68,68,0.35)"
          : low
          ? "rgba(245,158,11,0.35)"
          : "rgba(226,232,240,0.95)",
        background: out
          ? "rgba(255,241,242,0.70)"
          : low
          ? "rgba(255,251,235,0.78)"
          : "rgba(255,255,255,0.70)",
      }}
    >
      <div style={cardTop}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={titleRow}>
            <h3 style={title} title={item?.name || ""}>
              {item?.name || "—"}
            </h3>

            {out ? (
              <span style={pill("#fee2e2", "#991b1b")}>⛔ Sin stock</span>
            ) : low ? (
              <span style={pill("#ffedd5", "#9a3412")}>⚠ Bajo mínimo</span>
            ) : (
              <span style={pill("#dcfce7", "#166534")}>OK</span>
            )}
          </div>

          <div style={chipsRow}>
            {item?.code ? (
              <span style={metaPill}>
                <Tag size={14} strokeWidth={2.2} /> {item.code}
              </span>
            ) : null}

            {item?.type ? (
              <span style={metaPill}>
                <Droplets size={14} strokeWidth={2.2} /> {item.type}
              </span>
            ) : null}

            {propText ? (
              <span style={metaPill}>
                <strong>Propiedades:</strong>&nbsp;{propText}
              </span>
            ) : null}

            {eqCode ? (
              <span style={{ ...metaPill, background: "rgba(224,242,254,0.7)" }}>
                <strong>Eq:</strong>&nbsp;{eqCode}
              </span>
            ) : null}

            {item?.location ? (
              <span style={metaPill}>
                <MapPin size={14} strokeWidth={2.2} /> {item.location}
              </span>
            ) : null}
          </div>

          <div style={sub}>
            {item?.brand ? (
              <span>
                <strong>Marca:</strong> {item.brand}
              </span>
            ) : null}
            {item?.supplier ? (
              <span>
                <strong>Proveedor:</strong> {item.supplier}
              </span>
            ) : null}
            {hasCost ? (
              <span>
                <strong>Costo:</strong>{" "}
                {formatCurrency ? formatCurrency(Number(item.unitCost)) : Number(item.unitCost)} / {item.unit || ""}
              </span>
            ) : null}
          </div>
        </div>

        <div style={actionsCol}>
          <button type="button" style={btnSmall} onClick={() => onOpenMove?.(item)}>
            Movimiento
          </button>

          <button type="button" style={btnSmall} onClick={() => onOpenHistory?.(item)}>
            Historial
          </button>

          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button type="button" style={iconBtn} title="Editar" onClick={() => onEdit?.(item)}>
              <Pencil size={16} strokeWidth={2.2} />
            </button>

            {canDelete ? (
              <button type="button" style={iconBtnDanger} title="Eliminar" onClick={() => onDelete?.(item)}>
                <Trash2 size={16} strokeWidth={2.2} />
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div style={stockRow}>
        <div>
          <div style={stockLabel}>Stock</div>
          <div style={stockValue}>
            {stock} {item.unit || ""}
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={stockLabel}>Mínimo</div>
          <div style={stockValue}>{min == null ? "—" : `${min} ${item.unit || ""}`}</div>
        </div>
      </div>

      <div style={barWrap}>
        <div style={barStyle} />
      </div>

      {hasCost ? (
        <div style={valueRow}>
          <span style={{ color: "#64748b", fontWeight: 900, fontSize: 12 }}>Valor estimado</span>
          <strong style={{ color: "#0f172a" }}>
            {formatCurrency ? formatCurrency(value) : value}
          </strong>
        </div>
      ) : null}

      {item?.notes ? (
        <div style={notes}>
          <strong>Notas:</strong> {item.notes}
        </div>
      ) : null}
    </div>
  );
}

/* ===== styles unificados ===== */

function pill(bg, color) {
  return {
    background: bg,
    color,
    borderRadius: 999,
    padding: "4px 10px",
    fontSize: 12,
    fontWeight: 950,
    border: "1px solid rgba(226,232,240,0.9)",
  };
}

const card = {
  borderRadius: 16,
  padding: 14,
  border: "1px solid rgba(226,232,240,0.95)",
  boxShadow: "0 10px 22px rgba(15,23,42,0.06)",
};

const cardTop = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
};

const titleRow = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap",
};

const title = {
  margin: 0,
  fontSize: 15,
  fontWeight: 1000,
  color: "#020617",
  letterSpacing: 0.3,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  maxWidth: 520,
};

const chipsRow = {
  marginTop: 10,
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
};

const metaPill = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "6px 10px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 950,
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(248,250,252,0.85)",
  color: "#0f172a",
};

const sub = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  fontSize: 12,
  color: "#475569",
  marginTop: 10,
  fontWeight: 800,
};

const actionsCol = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  alignItems: "flex-end",
  minWidth: 130,
};

const btnSmall = {
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.9)",
  borderRadius: 12,
  padding: "9px 10px",
  cursor: "pointer",
  fontWeight: 950,
  boxShadow: "0 8px 18px rgba(2,6,23,0.04)",
  width: 120,
};

const iconBtn = {
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.92)",
  borderRadius: 12,
  width: 40,
  height: 36,
  cursor: "pointer",
  fontWeight: 950,
  display: "grid",
  placeItems: "center",
  boxShadow: "0 8px 18px rgba(2,6,23,0.04)",
};

const iconBtnDanger = {
  ...iconBtn,
  border: "1px solid rgba(254,202,202,0.95)",
  color: "#b91c1c",
  boxShadow: "0 8px 18px rgba(239,68,68,0.08)",
};

const stockRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: 14,
};

const stockLabel = { fontSize: 12, color: "#6b7280", fontWeight: 900 };
const stockValue = { fontSize: 16, fontWeight: 950, color: "#111827" };

const barWrap = {
  marginTop: 10,
  height: 18,
  borderRadius: 999,
  background: "rgba(241,245,249,0.9)",
  overflow: "hidden",
};

const barFill = {
  height: "100%",
  borderRadius: 999,
  transition: "width 220ms ease",
};

const valueRow = {
  marginTop: 10,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const notes = {
  marginTop: 12,
  fontSize: 12,
  color: "#0f172a",
  background: "rgba(241,245,249,0.7)",
  border: "1px solid rgba(226,232,240,0.95)",
  padding: "10px 12px",
  borderRadius: 12,
  fontWeight: 850,
};