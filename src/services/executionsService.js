// src/services/executionsService.js
import { httpGet, httpPut, httpPost, httpPatch } from "./http";

/* =========================================================
   EXECUTIONS SERVICE
========================================================= */

// ✅ asignar técnico
export function assignExecutionTechnician(executionId, technicianId) {
  return httpPatch(`/executions/${executionId}/assign`, { technicianId });
}

// ✅ getExecutions(params)
export async function getExecutions(params = {}) {
  const qs = new URLSearchParams();

  if (params.futureDays != null) qs.set("futureDays", String(params.futureDays));
  if (params.completedRange) qs.set("completedRange", String(params.completedRange));

  if (params.month) qs.set("month", String(params.month));
  if (params.futureWindow) qs.set("futureWindow", String(params.futureWindow));

  if (!params.month && params.days != null) qs.set("days", String(params.days));

  if (params.filter) qs.set("filter", String(params.filter));
  if (params.status) qs.set("status", String(params.status));

  if (params.technicianId != null && params.technicianId !== "") {
    qs.set("technicianId", String(params.technicianId));
  }

  if (params.page) qs.set("page", String(params.page));
  if (params.pageSize) qs.set("pageSize", String(params.pageSize));
  if (params.limit) qs.set("limit", String(params.limit));

  const url = `/executions${qs.toString() ? `?${qs.toString()}` : ""}`;
  return httpGet(url);
}

// ✅ historial por ruta
export async function getExecutionsByRoute(routeId) {
  return httpGet(`/routes/${routeId}/executions`);
}

// ✅ marcar overdue
export async function checkOverdue() {
  return httpPut("/executions/check-overdue", {});
}

// ✅ completar ejecución
export async function completeExecution(id, payload) {
  return httpPatch(`/executions/${id}/complete`, payload ?? {});
}

// ✅ detalle
export function getExecutionById(id) {
  return httpGet(`/executions/${id}`);
}

// ✅ crear actividad manual
export async function createManualExecution(payload) {
  return httpPost("/executions", payload ?? {});
}




