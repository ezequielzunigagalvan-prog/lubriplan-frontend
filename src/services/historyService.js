// src/services/historyService.js
import { httpGet } from "./http";
import { API_URL } from "./api";
import { getToken, clearAuth } from "../auth/auth.js";

const buildQuery = (params = {}) => {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === null || v === undefined || v === "" || v === false) return;
    qs.set(k, v === true ? "1" : String(v));
  });
  const s = qs.toString();
  return s ? `?${s}` : "";
};

export function getHistoryExecutions(params = {}) {
  return httpGet(`/history/executions${buildQuery(params)}`);
}

export function getExecutionById(id) {
  if (!id) throw new Error("Missing execution id");
  return httpGet(`/executions/${id}`);
}

export function getHistoryLubricantMovements(params = {}) {
  return httpGet(`/history/lubricant-movements${buildQuery(params)}`);
}

const API_BASE = API_URL.replace(/\/+$/, "").endsWith("/api")
  ? API_URL.replace(/\/+$/, "")
  : `${API_URL.replace(/\/+$/, "")}/api`;

/** Descarga el CSV de auditoría con los mismos filtros de la pantalla. */
async function downloadCsv(path, params, plantId, fallbackName) {
  if (!plantId) throw new Error("No hay planta seleccionada.");
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}${buildQuery(params)}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "x-plant-id": String(plantId),
    },
    cache: "no-store",
  });
  if (res.status === 401) {
    clearAuth();
    window.location.href = "/login";
    throw new Error("No autorizado");
  }
  if (!res.ok) {
    const j = await res.json().catch(() => null);
    throw new Error(j?.error || `No se pudo exportar (HTTP ${res.status})`);
  }
  const blob = await res.blob();
  const match = (res.headers.get("content-disposition") || "").match(/filename="([^"]+)"/i);
  const a = document.createElement("a");
  const href = URL.createObjectURL(blob);
  a.href = href;
  a.download = match?.[1] || fallbackName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}

export const exportHistoryExecutions = (params, plantId) =>
  downloadCsv("/history/executions/export", params, plantId, "historial-actividades.csv");

export const exportHistoryMovements = (params, plantId) =>
  downloadCsv("/history/lubricant-movements/export", params, plantId, "historial-movimientos.csv");
