// src/components/actionPlan/actionPlanUi.js
// Etiquetas, colores y fechas del Plan de acción.

export const CATEGORY = {
  LUBRICATION: { label: "Lubricación", icon: "drop", color: "#f97316" },
  SAFETY: { label: "Seguridad", icon: "shield", color: "#dc2626" },
  PREDICTIVE: { label: "Predictivos", icon: "trendUp", color: "#2563eb" },
  AUDIT: { label: "Auditoría", icon: "doc", color: "#7c3aed" },
};
export const CATEGORY_ORDER = ["LUBRICATION", "SAFETY", "PREDICTIVE", "AUDIT"];

export const PRIORITY = {
  LOW: { label: "Baja", cls: "is-low" },
  MEDIUM: { label: "Media", cls: "is-med" },
  HIGH: { label: "Alta", cls: "is-high" },
  CRITICAL: { label: "Crítica", cls: "is-crit" },
};

export const STATUS = {
  OPEN: "Abierto",
  IN_PROGRESS: "En proceso",
  DONE: "Cerrado",
  CANCELLED: "Cancelado",
};

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/** Fechas de ejecución se guardan a las 12:00 UTC del día: el día es la parte YYYY-MM-DD. */
export function ymdOf(value) {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

export function fmtDay(value) {
  const s = ymdOf(value);
  if (!s) return "—";
  const [y, m, d] = s.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

export function todayYmd() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function daysLeft(value) {
  const s = ymdOf(value);
  if (!s) return 0;
  return Math.round((Date.parse(`${s}T00:00:00Z`) - Date.parse(`${todayYmd()}T00:00:00Z`)) / 86400000);
}

export function fmtDateTime(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("es-MX", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

/** Fecha local de un instante real (p. ej. cuándo se cerró). */
export function fmtLocalDay(value) {
  const d = new Date(value);
  if (!value || Number.isNaN(d.getTime())) return "—";
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
