// src/services/historyService.js
import { httpGet } from "./http";

const buildQuery = (params = {}) => {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === null || v === undefined || v === "") return;
    qs.set(k, String(v));
  });
  const s = qs.toString();
  return s ? `?${s}` : "";
};

// ✅ ESTE NOMBRE SE RESPETA
export function getHistoryExecutions(params = {}) {
  return httpGet(`/history/executions${buildQuery(params)}`);
}

// ✅ Detalle de ejecución (usado por HistoryPage drawer)
export function getExecutionById(id) {
  if (!id) throw new Error("Missing execution id");
  return httpGet(`/executions/${id}`);
}

// (si ya la tienes en tu backend)
export function getHistoryLubricantMovements(params = {}) {
  return httpGet(`/history/lubricant-movements${buildQuery(params)}`);
}