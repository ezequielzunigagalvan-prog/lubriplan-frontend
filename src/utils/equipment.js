import { routeFrequency } from "./routeFrequency";
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

/** Frecuencia legible de una ruta (misma regla que la tarjeta de rutas). */
export function frequencyLabel(route) {
  const f = routeFrequency(route);
  return f.detail && f.label !== "Diario" ? `${f.label} · ${f.detail}` : f.label;
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
