// src/utils/routeFrequency.js
// Etiquetas de frecuencia y fechas de rutas. Las fechas de ruta/actividad se guardan a las 12:00 UTC
// del día programado, así que el día calendario es la parte YYYY-MM-DD del ISO.

const WEEKDAY = { 1: "Lun", 2: "Mar", 3: "Mié", 4: "Jue", 5: "Vie", 6: "Sáb", 7: "Dom" };
const MONTHS = { MONTHLY: 1, BIMONTHLY: 2, QUARTERLY: 3, FOURMONTHLY: 4, SEMIANNUAL: 6, ANNUAL: 12 };
const TYPE_LABEL = {
  DAILY: "Diario",
  WEEKLY: "Semanal",
  MONTHLY: "Mensual",
  BIMONTHLY: "Bimestral",
  QUARTERLY: "Trimestral",
  FOURMONTHLY: "Cuatrimestral",
  SEMIANNUAL: "Semestral",
  ANNUAL: "Anual",
};

export function routeYmd(value) {
  if (!value) return "";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    // ISO con hora: usa la fecha UTC (12:00Z → mismo día en cualquier zona de América).
    const d = new Date(value);
    if (value.length > 10 && !Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    return value.slice(0, 10);
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

export function todayYmd() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const MONTH_SHORT = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
export function formatRouteDate(value, withYear = true) {
  const ymd = routeYmd(value);
  if (!ymd) return "—";
  const [y, m, d] = ymd.split("-").map(Number);
  return `${d} ${MONTH_SHORT[m - 1]}${withYear ? ` ${y}` : ""}`;
}

export function daysFromToday(value) {
  const ymd = routeYmd(value);
  if (!ymd) return null;
  const a = Date.parse(`${todayYmd()}T00:00:00Z`);
  const b = Date.parse(`${ymd}T00:00:00Z`);
  return Math.round((b - a) / 86400000);
}

/** { label, detail } p. ej. { label: "Mensual", detail: "día 15" } */
export function routeFrequency(route) {
  const type = String(route?.frequencyType || "").toUpperCase();
  const days = Number(route?.frequencyDays || 0);
  const weekly = Array.isArray(route?.weeklyDays) ? route.weeklyDays : [];
  if (type === "WEEKLY" && weekly.length) {
    return { label: weekly.length === 1 ? "Semanal" : `${weekly.length} veces por semana`, detail: weekly.map((d) => WEEKDAY[Number(d)]).filter(Boolean).join(" · ") };
  }
  if (MONTHS[type]) {
    const anchor = Number(route?.monthlyAnchorDay) || Number(routeYmd(route?.nextDate).slice(8, 10)) || null;
    return { label: TYPE_LABEL[type], detail: anchor ? `día ${anchor}` : "" };
  }
  if (type === "DAILY" || days === 1) return { label: "Diario", detail: "todos los días" };
  if (days === 7) return { label: "Semanal", detail: "cada 7 días" };
  if (days === 15) return { label: "Quincenal", detail: "cada 15 días" };
  if (days > 0) return { label: `Cada ${days} días`, detail: "" };
  return { label: "Sin frecuencia", detail: "" };
}

/** Estado de la próxima actividad: { tone: danger|warn|ok|muted, label, date } */
export function routeDueStatus(nextDate) {
  const diff = daysFromToday(nextDate);
  const date = formatRouteDate(nextDate);
  if (diff == null) return { tone: "muted", label: "Sin programar", date: "" };
  if (diff < 0) return { tone: "danger", label: `Atrasada ${Math.abs(diff)} día${diff === -1 ? "" : "s"}`, date };
  if (diff === 0) return { tone: "warn", label: "Hoy", date };
  if (diff === 1) return { tone: "ok", label: "Mañana", date };
  return { tone: "ok", label: `En ${diff} días`, date };
}

export function routeEquipmentList(route) {
  const links = Array.isArray(route?.equipments) ? route.equipments : [];
  if (links.length > 1) {
    return links
      .slice()
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .map((l) => l.equipment || { id: l.equipmentId, name: `Equipo #${l.equipmentId}` });
  }
  return route?.equipment ? [route.equipment] : [];
}

export function openExecutionOf(route) {
  const list = Array.isArray(route?.executions) ? route.executions : [];
  return list.find((e) => ["PENDING", "OVERDUE"].includes(String(e?.status || "").toUpperCase())) || null;
}
