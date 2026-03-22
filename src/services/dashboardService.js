// src/services/dashboardService.js
import { httpGet, httpPatch } from "./http";

// ✅ Resumen Dashboard (usa token automático)
export function getDashboardSummary({ month } = {}) {
  const qs = month ? `?month=${encodeURIComponent(month)}` : "";
  return httpGet(`/dashboard/summary${qs}`);
}

// ✅ Dona mensual (ADMIN/SUP)
export function getDashboardMonthlyActivities({ month } = {}) {
  const qs = month ? `?month=${encodeURIComponent(month)}` : "";
  return httpGet(`/dashboard/activities/monthly${qs}`);
}

// ✅ Dona mensual (TECH)
export function getDashboardMonthlyActivitiesMe({ month } = {}) {
  const qs = month ? `?month=${encodeURIComponent(month)}` : "";
  return httpGet(`/dashboard/activities/monthly/me${qs}`);
}

// ✅ Alertas del mes (ADMIN/SUP)
export function getDashboardAlerts({ month } = {}) {
  const qs = month ? `?month=${encodeURIComponent(month)}` : "";
  return httpGet(`/dashboard/alerts${qs}`);
}

// ✅ Predictivas (SOLO ADMIN según tu backend)
export function getDashboardPredictiveAlerts({ month } = {}) {
  const qs = month ? `?month=${encodeURIComponent(month)}` : "";
  return httpGet(`/dashboard/alerts/predictive${qs}`);
}

// ✅ KPI GLOBAL (solo ADMIN): total rutas / total equipos
export function getDashboardAdminCounts() {
  return httpGet(`/dashboard/admin/counts`);
}

// ✅ Asignar técnico a ejecución (usa la ruta REAL de tu backend)
export function assignExecutionTechnician(executionId, technicianId) {
  return httpPatch(`/executions/${encodeURIComponent(executionId)}/assign`, {
    technicianId,
  });
}
export function getDashboardPriorityQueue({ month } = {}) {
  const qs = month ? `?month=${encodeURIComponent(month)}` : "";
  return httpGet(`/dashboard/priority-queue${qs}`);
}
// ✅ Eficiencia por técnico del mes (ADMIN/SUP)
export function getDashboardTechnicianEfficiencyMonthly({ month } = {}) {
  const qs = month ? `?month=${encodeURIComponent(month)}` : "";
  return httpGet(`/dashboard/technicians/efficiency-monthly${qs}`);
}


