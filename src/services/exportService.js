// src/services/exportService.js
// Descargas (Excel/PDF/plantillas) e importación desde Excel.
import { API_URL } from "./api";
import { getToken, clearAuth } from "../auth/auth.js";

const API_BASE = API_URL.replace(/\/+$/, "").endsWith("/api") ? API_URL.replace(/\/+$/, "") : `${API_URL.replace(/\/+$/, "")}/api`;

function qs(params = {}) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    q.set(k, Array.isArray(v) ? v.join(",") : String(v));
  });
  const s = q.toString();
  return s ? `?${s}` : "";
}

async function request(path, { method = "GET", plantId, body, timeoutMs = 120000 } = {}) {
  if (!plantId) throw new Error("Selecciona una planta.");
  const token = getToken();
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), "x-plant-id": String(plantId) },
      body,
      signal: controller.signal,
      cache: "no-store",
    });
    if (res.status === 401) {
      clearAuth();
      window.location.href = "/login";
      throw new Error("Tu sesión expiró");
    }
    return res;
  } catch (e) {
    if (e?.name === "AbortError") throw new Error("La operación tardó demasiado. Intenta con un periodo más corto.");
    throw e;
  } finally {
    clearTimeout(t);
  }
}

async function errorFrom(res, fallback) {
  const data = await res.json().catch(() => null);
  const err = new Error(data?.error || fallback);
  err.data = data;
  return err;
}

async function saveBlob(res, fallbackName) {
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
  return a.download;
}

/** Exporta uno o varios recursos. format: "xlsx" | "pdf". Devuelve el nombre del archivo. */
export async function downloadExport(format, resources, params, plantId) {
  const res = await request(`/export/${format === "pdf" ? "pdf" : "xlsx"}${qs({ ...params, resources })}`, { plantId });
  if (!res.ok) throw await errorFrom(res, "No se pudo generar la exportación");
  return saveBlob(res, `lubriplan_export.${format === "pdf" ? "pdf" : "xlsx"}`);
}

/** Catálogo de la planta en formato de importación (respaldo / copiar a otra planta). */
export async function downloadCatalog(plantId) {
  const res = await request("/export/catalog", { plantId });
  if (!res.ok) throw await errorFrom(res, "No se pudo generar el catálogo");
  return saveBlob(res, "lubriplan_catalogo.xlsx");
}

export async function downloadImportTemplate(plantId) {
  const res = await request("/import/template", { plantId });
  if (!res.ok) throw await errorFrom(res, "No se pudo descargar la plantilla");
  return saveBlob(res, "lubriplan_plantilla_importacion.xlsx");
}

function fileForm(file) {
  if (!file) throw new Error("Selecciona un archivo.");
  const form = new FormData();
  form.append("file", file);
  return form;
}

/** Valida el archivo sin guardar nada. */
export async function previewImport(file, plantId) {
  const res = await request("/import/preview", { method: "POST", plantId, body: fileForm(file) });
  if (!res.ok) throw await errorFrom(res, "No se pudo validar el archivo");
  return res.json();
}

/** Importa: el servidor vuelve a validar el mismo archivo antes de guardar. */
export async function commitImport(file, plantId) {
  const res = await request("/import/commit", { method: "POST", plantId, body: fileForm(file), timeoutMs: 180000 });
  if (!res.ok) throw await errorFrom(res, "No se pudo importar");
  return res.json();
}
