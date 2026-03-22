// src/services/analyticsService.js
import { httpGet } from "./http";

/* =========================
   helpers
========================= */
const qsAddIf = (qs, key, val) => {
  if (val == null) return;
  const s = String(val).trim();
  if (s !== "") qs.set(key, s);
};

const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const normalizeExecutionMonthlyItem = (item = {}) => {
  const scheduled = toNum(item.scheduled ?? item.totalScheduled);
  const completed = toNum(item.completed ?? item.onTime);
  const overdue = toNum(item.overdue);
  const pendingDue = Math.max(scheduled - completed - overdue, 0);

  return {
    month: item.month,
    totalScheduled: scheduled,
    completed,
    onTime: completed,
    late: 0,
    pendingDue,
    overdue,
  };
};

const normalizeExecutionSummary = (json = {}) => {
  if (json && typeof json.totalScheduled !== "undefined") return json;

  const summary = json?.summary || {};
  const pendingDue = toNum(summary.pending);
  const overdue = toNum(summary.overdue);
  const completed = toNum(summary.completedMonth);
  const completed30d = toNum(summary.completed30d);
  const totalScheduled = pendingDue + overdue + completed;
  const completionRate = totalScheduled > 0 ? (completed / totalScheduled) * 100 : 0;

  return {
    totalScheduled,
    completed,
    completed30d,
    onTime: completed,
    late: 0,
    pendingDue,
    overdue,
    completionRate,
    onTimeRate: completionRate,
  };
};

const normalizeTechnicianPerformanceRow = (row = {}) => {
  if (typeof row.completed !== "undefined") return row;

  const technician = row.technician || {};
  const completed = toNum(row.completedCount);
  const bad = toNum(row.badCount);
  const critical = toNum(row.criticalCount);
  const onTime = Math.max(completed - bad - critical, 0);

  return {
    technicianId: row.technicianId ?? technician.id,
    technician,
    completed,
    onTime,
    late: bad,
    overdue: critical,
    completedCount: completed,
    badCount: bad,
    criticalCount: critical,
    lastExecutionAt: row.lastExecutionAt || null,
  };
};

/* =========================
   ANALISIS (consumo)
========================= */

export function getAnalyticsSummary({ days = 180, kind = "ALL", lubricantId } = {}) {
  const qs = new URLSearchParams();
  qs.set("days", String(Number(days) || 180));
  qs.set("kind", String(kind || "ALL"));
  qsAddIf(qs, "lubricantId", lubricantId);

  return httpGet(`/analytics/summary?${qs.toString()}`);
}

export function getTopEquipment({ take = 10, days = 180, kind = "ALL", lubricantId } = {}) {
  const qs = new URLSearchParams();
  qs.set("take", String(Number(take) || 10));
  qs.set("days", String(Number(days) || 180));
  qs.set("kind", String(kind || "ALL"));
  qsAddIf(qs, "lubricantId", lubricantId);

  return httpGet(`/analytics/top-equipment?${qs.toString()}`);
}

export function getMonthlyTotal(days = 365, kind = "ALL", lubricantId) {
  const qs = new URLSearchParams();
  qs.set("days", String(Number(days) || 365));
  qs.set("kind", String(kind || "ALL"));
  qsAddIf(qs, "lubricantId", lubricantId);

  return httpGet(`/analytics/monthly-total?${qs.toString()}`);
}

export function getLubricants({ days = 3650, kind = "ALL" } = {}) {
  const qs = new URLSearchParams();
  qs.set("days", String(Number(days) || 3650));
  qs.set("kind", String(kind || "ALL"));

  return httpGet(`/analytics/lubricants?${qs.toString()}`);
}

/* =========================
   FALLAS
========================= */

export function getFailuresByEquipment(paramsOrDays = 365, severity = "ALL") {
  let days = 365;
  let sev = "ALL";

  if (typeof paramsOrDays === "object" && paramsOrDays !== null) {
    days = Number(paramsOrDays.days ?? 365);
    sev = String(paramsOrDays.severity ?? "ALL").toUpperCase();
  } else {
    days = Number(paramsOrDays ?? 365);
    sev = String(severity ?? "ALL").toUpperCase();
  }

  if (!Number.isFinite(days) || days <= 0) days = 365;
  if (!["ALL", "CRITICO", "MALO"].includes(sev)) sev = "ALL";

  const qs = new URLSearchParams();
  qs.set("days", String(days));
  qs.set("severity", sev);

  return httpGet(`/analytics/failures-by-equipment?${qs.toString()}`);
}

/* =========================
   TECNICOS
========================= */

export async function getTechniciansPerformance(params = {}) {
  let days = 180;

  if (typeof params === "number") {
    days = params;
  } else {
    days = Number(params.days ?? 180);
  }

  if (!Number.isFinite(days) || days <= 0) days = 180;

  const qs = new URLSearchParams();
  qs.set("days", String(days));

  const json = await httpGet(`/analytics/technicians/performance?${qs.toString()}`);
  const result = Array.isArray(json?.result)
    ? json.result.map(normalizeTechnicianPerformanceRow)
    : Array.isArray(json?.items)
    ? json.items.map(normalizeTechnicianPerformanceRow)
    : [];

  return { ...json, result };
}

/* =========================
   ACTIVIDADES (ejecuciones)
========================= */

export async function getExecutionsMonthly({ year, techId } = {}) {
  const qs = new URLSearchParams();
  qsAddIf(qs, "year", year);
  qsAddIf(qs, "techId", techId);

  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  const json = await httpGet(`/analytics/executions/monthly${suffix}`);
  const series = Array.isArray(json?.series)
    ? json.series
    : Array.isArray(json?.items)
    ? json.items.map(normalizeExecutionMonthlyItem)
    : [];

  return { ...json, series };
}

export async function getExecutionsSummary({ days = 180, techId } = {}) {
  const qs = new URLSearchParams();
  qs.set("days", String(Number(days) || 180));
  qsAddIf(qs, "techId", techId);

  const json = await httpGet(`/analytics/executions/summary?${qs.toString()}`);
  return normalizeExecutionSummary(json);
}

export function getConditionReportsAnalytics(params = {}) {
  const qs = new URLSearchParams();

  if (params.range) qs.set("range", String(params.range));
  if (params.from) qs.set("from", String(params.from));
  if (params.to) qs.set("to", String(params.to));

  return httpGet(`/analytics/condition-reports${qs.toString() ? `?${qs.toString()}` : ""}`);
}
