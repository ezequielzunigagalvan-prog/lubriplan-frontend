// src/services/conditionReportsService.js
import { httpGet, httpPatch, httpForm, httpPost } from "./http";

// Normaliza retorno (por si tu http* regresa { data } o regresa directo)
const unwrap = (res) => res?.data ?? res;

export function getConditionReports({ status, from, to } = {}) {
  const p = new URLSearchParams();
  if (status) p.set("status", status);
  if (from) p.set("from", from);
  if (to) p.set("to", to);

  const qs = p.toString();
  // ? OJO: SIN /api aqu? (API_URL ya lo trae)
  return httpGet(`/condition-reports${qs ? `?${qs}` : ""}`).then(unwrap);
}

// ? TECH: crear reporte (multipart)
export async function createConditionReport(formData) {
  // ? httpForm YA hace POST y el 3er par?metro debe ser opts (objeto), no "POST"
  const res = await httpForm("/condition-reports", formData);
  return unwrap(res);
}

// ? cambiar status (ADMIN/SUP)
export async function updateConditionReportStatus(id, status) {
  const res = await httpPatch(`/condition-reports/${id}/status`, { status });
  return unwrap(res);
}

export async function dismissConditionReport(id) {
  const res = await httpPost(`/condition-reports/${id}/dismiss`, {});
  return unwrap(res);
}

// ? crear acción correctiva (Execution) desde el reporte (ADMIN/SUP)
export async function createCorrectiveExecution(reportId, payload) {
  const res = await httpPost(
    `/condition-reports/${reportId}/corrective-execution`,
    payload
  );
  return unwrap(res);
}
