// src/utils/notifications.js

const META = {
  EXEC_CONDITION_CRITICAL: { icon: "alert", tone: "is-red", label: "Crítica" },
  EMERGENCY_CREATED: { icon: "bolt", tone: "is-red", label: "Emergencia" },
  CONDITION_REPORTED: { icon: "warn", tone: "is-orange", label: "Condición" },
  CONDITION_RESOLVED: { icon: "checkCircle", tone: "is-green", label: "Resuelto" },
  CONDITION_DISMISSED: { icon: "xCircle", tone: "", label: "Descartado" },
  EXEC_ASSIGNED: { icon: "userCheck", tone: "is-blue", label: "Asignación" },
  EXEC_OVERDUE: { icon: "clock", tone: "is-orange", label: "Vencidas" },
  LOW_STOCK: { icon: "drop", tone: "is-orange", label: "Inventario" },
  MONTHLY_TECH_SUMMARY: { icon: "trendUp", tone: "is-green", label: "Resumen" },
  ACTION_ASSIGNED: { icon: "list", tone: "is-blue", label: "Plan de acción" },
  ACTION_UPDATED: { icon: "trendUp", tone: "is-green", label: "Plan de acción" },
};

export const notifMeta = (type) => META[String(type || "").toUpperCase()] || { icon: "bell", tone: "", label: "Aviso" };

/** Filtros de la bandeja según el perfil (cada perfil solo recibe ciertos tipos). */
export function notifCategories(role) {
  const r = String(role || "").toUpperCase();
  if (r === "TECHNICIAN") {
    return [
      { key: "assigned", label: "Asignaciones", types: ["EXEC_ASSIGNED"] },
      { key: "overdue", label: "Vencidas", types: ["EXEC_OVERDUE"] },
      { key: "reports", label: "Mis reportes", types: ["CONDITION_REPORTED", "CONDITION_RESOLVED", "CONDITION_DISMISSED"] },
      { key: "summary", label: "Resumen mensual", types: ["MONTHLY_TECH_SUMMARY"] },
    ];
  }
  return [
    { key: "critical", label: "Críticas", types: ["EXEC_CONDITION_CRITICAL", "EMERGENCY_CREATED"] },
    { key: "condition", label: "Condición", types: ["CONDITION_REPORTED", "CONDITION_RESOLVED", "CONDITION_DISMISSED"] },
    { key: "overdue", label: "Vencidas", types: ["EXEC_OVERDUE"] },
    { key: "inventory", label: "Inventario", types: ["LOW_STOCK"] },
    { key: "assigned", label: "Asignaciones", types: ["EXEC_ASSIGNED"] },
    { key: "actions", label: "Plan de acción", types: ["ACTION_ASSIGNED", "ACTION_UPDATED"] },
  ];
}

export function relativeTime(iso, now = Date.now()) {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "";
  const diff = now - t;
  if (diff < 0) return new Date(iso).toLocaleDateString("es-MX");
  if (diff < 60000) return "ahora";
  if (diff < 3600000) return `hace ${Math.floor(diff / 60000)} min`;
  if (diff < 86400000) return `hace ${Math.floor(diff / 3600000)} h`;
  if (diff < 7 * 86400000) {
    const d = Math.floor(diff / 86400000);
    return d === 1 ? "ayer" : `hace ${d} días`;
  }
  return new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

/** Agrupa por Hoy / Ayer / Esta semana / Anteriores. */
export function groupByDay(items, now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const day = 86400000;
  const buckets = [
    { key: "today", label: "Hoy", items: [] },
    { key: "yesterday", label: "Ayer", items: [] },
    { key: "week", label: "Esta semana", items: [] },
    { key: "older", label: "Anteriores", items: [] },
  ];
  for (const n of items) {
    const t = new Date(n.createdAt).getTime();
    const b = t >= start ? 0 : t >= start - day ? 1 : t >= start - 6 * day ? 2 : 3;
    buckets[b].items.push(n);
  }
  return buckets.filter((b) => b.items.length);
}

/** Quita emojis que algunos avisos antiguos traían en el texto. */
export const cleanText = (v) =>
  String(v || "")
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]|\u{FE0F}|\u{200D}/gu, "")
    .replace(/\s{2,}/g, " ")
    .trim();
