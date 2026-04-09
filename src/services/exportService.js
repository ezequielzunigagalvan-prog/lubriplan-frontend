import { API_URL } from "./api";
import { getToken, clearAuth } from "../auth/auth.js";

const EXPORT_API_URL = API_URL.replace(/\/+$/, "").endsWith("/api")
  ? API_URL.replace(/\/+$/, "")
  : `${API_URL.replace(/\/+$/, "")}/api`;

function normalizeResources(resourceOrResources = "executions") {
  return Array.isArray(resourceOrResources)
    ? resourceOrResources
    : String(resourceOrResources || "executions")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
}

function resourceLabel(resourceOrResources = "executions") {
  const resources = normalizeResources(resourceOrResources).map((x) => String(x).toLowerCase());
  if (resources.length > 1) return "reporte-consolidado";
  const labels = {
    executions: "actividades",
    movements: "movimientos-inventario",
    routes: "rutas",
    failures: "fallas",
    emergents: "actividades-emergentes",
    condition_reports: "reportes-condicion",
  };
  return labels[resources[0]] || "datos";
}

function fallbackFilename(resourceOrResources, extension) {
  const date = new Date().toISOString().slice(0, 10);
  return `lubriplan_${resourceLabel(resourceOrResources)}_${date}.${extension}`;
}

function buildQuery(resourceOrResources, params = {}) {
  const qs = new URLSearchParams();

  const resources = normalizeResources(resourceOrResources)
    .map((r) => String(r || "").trim().toLowerCase())
    .filter(Boolean);

  qs.set("resources", resources.join(",") || "executions");

  Object.entries(params || {}).forEach(([k, v]) => {
    if (k === "plantId") return;
    if (v === undefined || v === null || v === "") return;

    if ((k === "from" || k === "to") && v instanceof Date) {
      const t = v.getTime();
      if (!Number.isFinite(t)) return;
      const y = v.getFullYear();
      const m = String(v.getMonth() + 1).padStart(2, "0");
      const d = String(v.getDate()).padStart(2, "0");
      qs.set(k, `${y}-${m}-${d}`);
      return;
    }

    qs.set(k, String(v));
  });

  return qs;
}

async function downloadFile(endpoint, defaultFilename, resourceOrResources, params = {}, options = {}, timeoutMs = 60000) {
  const qs = buildQuery(resourceOrResources, params);
  const plantId = params?.plantId ?? null;
  const token = getToken();

  if (!plantId) {
    throw new Error("No hay planta seleccionada para exportar.");
  }

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  let res;
  try {
    res = await fetch(`${EXPORT_API_URL}${endpoint}?${qs.toString()}`, {
      method: "GET",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(plantId ? { "X-Plant-Id": String(plantId) } : {}),
      },
      signal: controller.signal,
      cache: "no-store",
    });
  } catch (err) {
    if (err?.name === "AbortError") {
      throw new Error("Tiempo de espera agotado (timeout).");
    }
    throw err;
  } finally {
    clearTimeout(t);
  }

  if (res.status === 401) {
    clearAuth();
    window.location.href = "/login";
    throw new Error("No autorizado");
  }

  if (!res.ok) {
    let msg = `Error exportando (HTTP ${res.status})`;
    const text = await res.text().catch(() => "");
    if (text) {
      try {
        const j = JSON.parse(text);
        msg = j?.error || j?.message || msg;
      } catch {
        msg = text || msg;
      }
    }
    throw new Error(msg);
  }

  const blob = await res.blob();

  const dispo = res.headers.get("content-disposition") || "";
  const match = dispo.match(/filename="([^"]+)"/i);
  const filename = match?.[1] || defaultFilename;

  const a = document.createElement("a");
  const href = URL.createObjectURL(blob);
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  setTimeout(() => URL.revokeObjectURL(href), 1000);

  return true;
}

export async function downloadExportXlsx(
  resourceOrResources = "executions",
  params = {},
  options = {},
  timeoutMs = 60000
) {
  return downloadFile(
    "/export/xlsx",
    fallbackFilename(resourceOrResources, "xlsx"),
    resourceOrResources,
    params,
    options,
    timeoutMs
  );
}

export async function downloadExportPdf(
  resourceOrResources = "executions",
  params = {},
  options = {},
  timeoutMs = 60000
) {
  return downloadFile(
    "/export/pdf",
    fallbackFilename(resourceOrResources, "pdf"),
    resourceOrResources,
    params,
    options,
    timeoutMs
  );
}

export async function downloadImportTemplate(params = {}, timeoutMs = 60000) {
  const plantId = params?.plantId ?? null;
  if (!plantId) {
    throw new Error("No hay planta seleccionada.");
  }

  const token = getToken();
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  let res;
  try {
    res = await fetch(`${EXPORT_API_URL}/import/template`, {
      method: "GET",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        "X-Plant-Id": String(plantId),
      },
      signal: controller.signal,
      cache: "no-store",
    });
  } finally {
    clearTimeout(t);
  }

  if (res.status === 401) {
    clearAuth();
    window.location.href = "/login";
    throw new Error("No autorizado");
  }

  if (!res.ok) {
    throw new Error("No se pudo descargar la plantilla.");
  }

  const blob = await res.blob();
  const a = document.createElement("a");
  const href = URL.createObjectURL(blob);
  a.href = href;
  a.download = "lubriplan_plantilla_importacion.xlsx";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
  return true;
}

async function readJsonResponse(res, fallbackMessage) {
  const text = await res.text().catch(() => "");
  if (!text) return { error: fallbackMessage };
  try {
    return JSON.parse(text);
  } catch {
    return { error: text || fallbackMessage };
  }
}

export async function previewImportFile(file, params = {}, timeoutMs = 90000) {
  const plantId = params?.plantId ?? null;
  if (!plantId) throw new Error("No hay planta seleccionada.");
  if (!file) throw new Error("Selecciona un archivo.");

  const token = getToken();
  const form = new FormData();
  form.append("file", file);

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  let res;
  try {
    res = await fetch(`${EXPORT_API_URL}/import/preview`, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        "X-Plant-Id": String(plantId),
      },
      body: form,
      signal: controller.signal,
      cache: "no-store",
    });
  } finally {
    clearTimeout(t);
  }

  if (res.status === 401) {
    clearAuth();
    window.location.href = "/login";
    throw new Error("No autorizado");
  }

  const data = await readJsonResponse(res, "Error validando archivo.");
  if (!res.ok) throw new Error(data?.error || "Error validando archivo.");
  return data;
}

export async function commitImportPreview(preview, params = {}, timeoutMs = 90000) {
  const plantId = params?.plantId ?? null;
  if (!plantId) throw new Error("No hay planta seleccionada.");
  if (!preview?.sheets) throw new Error("Primero valida el archivo.");

  const token = getToken();
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  let res;
  try {
    res = await fetch(`${EXPORT_API_URL}/import/commit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        "X-Plant-Id": String(plantId),
      },
      body: JSON.stringify({ sheets: preview.sheets }),
      signal: controller.signal,
      cache: "no-store",
    });
  } finally {
    clearTimeout(t);
  }

  if (res.status === 401) {
    clearAuth();
    window.location.href = "/login";
    throw new Error("No autorizado");
  }

  const data = await readJsonResponse(res, "Error importando archivo.");
  if (!res.ok) throw new Error(data?.error || "Error importando archivo.");
  return data;
}

