// src/utils/inventory.js

/** "out" sin stock · "low" en o bajo el mínimo · "ok" en nivel */
export function stockState(it) {
  const stock = Number(it?.stock ?? 0);
  if (!Number.isFinite(stock) || stock <= 0) return "out";
  const min = it?.minStock;
  if (min != null && min !== "" && Number.isFinite(Number(min)) && stock <= Number(min)) return "low";
  return "ok";
}

/** Cantidades con hasta 2 decimales, formato de México. */
export function formatQty(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return "—";
  return v.toLocaleString("es-MX", { maximumFractionDigits: 2 });
}

export function formatCurrency(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return "—";
  return v.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });
}

const REASON_LABELS = {
  EXECUTION: "Consumo por actividad",
  EMERGENCY: "Actividad de emergencia",
};

/** Texto legible para el motivo guardado (antes se veía "EXECUTION"). */
export function reasonLabel(reason) {
  const r = String(reason || "").trim();
  return REASON_LABELS[r.toUpperCase()] || r;
}

export function formatDateTime(value) {
  const d = new Date(value);
  if (!Number.isFinite(d.getTime())) return "—";
  return d.toLocaleString("es-MX", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
