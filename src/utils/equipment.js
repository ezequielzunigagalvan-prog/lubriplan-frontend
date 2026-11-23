// src/utils/equipment.js

export const CRITICALITIES = ["CRITICA", "ALTA", "MEDIA", "BAJA"];

const LABELS = { CRITICA: "Crítica", ALTA: "Alta", MEDIA: "Media", BAJA: "Baja" };

const key = (c) =>
  String(c || "")
    .toUpperCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();

export const critLabel = (c) => LABELS[key(c)] || (c ? String(c) : "—");
export const critClass = (c) => key(c).toLowerCase() || "media";

export const isActiveEquipment = (eq) => ["ACTIVO", "ACTIVE"].includes(String(eq?.status || "").toUpperCase().trim());

export const normalizeCode = (v) =>
  String(v || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "-");

const WEEKDAYS = { 1: "Lun", 2: "Mar", 3: "Mié", 4: "Jue", 5: "Vie", 6: "Sáb", 7: "Dom" };
const NAMED_FREQ = { 1: "Diaria", 7: "Semanal", 15: "Quincenal", 30: "Mensual", 60: "Bimestral", 90: "Trimestral", 120: "Cuatrimestral", 180: "Semestral", 365: "Anual" };

/** Frecuencia legible de una ruta (misma regla que la tarjeta de rutas). */
export function frequencyLabel(route) {
  const type = String(route?.frequencyType || "").toUpperCase();
  const weekly = Array.isArray(route?.weeklyDays) ? route.weeklyDays : [];
  if (type === "WEEKLY" && weekly.length) {
    return weekly.map((d) => WEEKDAYS[Number(d)]).filter(Boolean).join(" · ");
  }
  const days = Number(route?.frequencyDays || 0);
  return NAMED_FREQ[days] || (days > 0 ? `Cada ${days} días` : "—");
}

const EXEC_STATUS = { COMPLETED: "Completada", PENDING: "Pendiente", OVERDUE: "Vencida", IN_PROGRESS: "En proceso", CANCELLED: "Cancelada" };
export const execStatusLabel = (s) => EXEC_STATUS[String(s || "").toUpperCase()] || s || "—";

const CONDITION = { BUENO: "Buena", REGULAR: "Regular", MALO: "Mala", CRITICO: "Crítica", NORMAL: "Normal" };
export const conditionLabel = (c) => CONDITION[String(c || "").toUpperCase()] || c || "—";
export const conditionClass = (c) => {
  const v = String(c || "").toUpperCase();
  return v === "CRITICO" ? "c-critica" : v === "MALO" ? "c-alta" : v === "REGULAR" ? "c-media" : "c-baja";
};

export function fmtDate(v, withTime = false) {
  const d = new Date(v);
  if (!v || !Number.isFinite(d.getTime())) return "—";
  return d.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}
