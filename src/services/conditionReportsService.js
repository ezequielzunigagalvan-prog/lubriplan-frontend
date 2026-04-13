// src/services/conditionReportsService.js
import { httpGet, httpPatch, httpForm, httpPost } from "./http";
import { getRole, getUser } from "../auth/auth";
import {
  getActivitiesForScope,
  putQueueItem,
  putAttachment,
  setMetaValue,
} from "../offline/offlineDb";

const OFFLINE_ENABLED_ROLE = "TECHNICIAN";
const OFFLINE_SYNC_EVENT = "lubriplan:offline-sync-changed";

const unwrap = (res) => res?.data ?? res;

function emitOfflineChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(OFFLINE_SYNC_EVENT));
  }
}

function getCurrentPlantId() {
  if (typeof localStorage === "undefined") return "";
  return String(localStorage.getItem("lp_currentPlantId") || "").trim();
}

function getOfflineContext() {
  const role = String(getRole() || "").toUpperCase();
  const user = getUser();
  const plantId = getCurrentPlantId();
  const technicianId = user?.technicianId != null ? Number(user.technicianId) : null;
  const userId = user?.id != null ? Number(user.id) : null;

  if (
    role !== OFFLINE_ENABLED_ROLE ||
    !plantId ||
    !Number.isFinite(userId) ||
    !Number.isFinite(technicianId)
  ) {
    return null;
  }

  return {
    role,
    plantId,
    userId,
    technicianId,
    scopeKey: `plant:${plantId}:user:${userId}:tech:${technicianId}`,
  };
}

function isBrowserOnline() {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine !== false;
}

function isNetworkError(error) {
  const msg = String(error?.message || "").toLowerCase();
  return (
    error?.name === "TypeError" ||
    msg.includes("failed to fetch") ||
    msg.includes("networkerror") ||
    msg.includes("network request failed")
  );
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("No se pudo leer la imagen"));
    reader.readAsDataURL(file);
  });
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("No se pudo procesar la imagen"));
    };
    image.src = objectUrl;
  });
}

async function compressImageToDataUrl(file) {
  if (!file || typeof document === "undefined") {
    return readFileAsDataUrl(file);
  }

  try {
    const image = await loadImageFromFile(file);
    const maxSide = 1600;
    let width = image.naturalWidth || image.width;
    let height = image.naturalHeight || image.height;

    if (!width || !height) {
      return readFileAsDataUrl(file);
    }

    const scale = Math.min(1, maxSide / Math.max(width, height));
    width = Math.max(1, Math.round(width * scale));
    height = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return readFileAsDataUrl(file);

    ctx.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", 0.82);
  } catch {
    return readFileAsDataUrl(file);
  }
}

function buildConditionReportQueueItem(scopeKey, payload) {
  const createdAt = new Date().toISOString();
  return {
    clientActionId: `condition-report-${payload.equipmentId}-${Date.now()}`,
    scopeKey,
    type: "condition-report.create",
    payload,
    status: "pending",
    createdAt,
    updatedAt: createdAt,
    errorMessage: "",
  };
}

function formDataToPayload(formData) {
  const equipmentId = Number(formData.get("equipmentId"));
  const detectedAt = String(formData.get("detectedAt") || "").trim();
  const condition = String(formData.get("condition") || "REGULAR").trim().toUpperCase();
  const categoryRaw = String(formData.get("category") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const evidence = formData.get("evidence");

  return {
    equipmentId,
    detectedAt,
    condition,
    category: categoryRaw ? categoryRaw.toUpperCase() : null,
    description,
    evidenceFile: evidence instanceof File ? evidence : null,
  };
}

async function queueConditionReport(formData) {
  const context = getOfflineContext();
  if (!context) {
    throw new Error("No se pudo guardar el reporte sin conexi?n.");
  }

  const payload = formDataToPayload(formData);

  if (!payload.equipmentId) throw new Error("Falta: Equipo");
  if (!payload.detectedAt) throw new Error("Falta: Fecha de detecci?n");
  if (!payload.description) throw new Error("Falta: Descripci?n");

  const queueItem = buildConditionReportQueueItem(context.scopeKey, {
    equipmentId: payload.equipmentId,
    detectedAt: payload.detectedAt,
    condition: payload.condition,
    category: payload.category,
    description: payload.description,
  });

  if (payload.evidenceFile) {
    const attachmentId = `${queueItem.clientActionId}:evidence`;
    const dataUrl = await compressImageToDataUrl(payload.evidenceFile);
    await putAttachment({
      id: attachmentId,
      scopeKey: context.scopeKey,
      type: "conditionEvidence",
      dataUrl,
      fileName: payload.evidenceFile.name || "evidencia.jpg",
      mimeType: payload.evidenceFile.type || "image/jpeg",
      createdAt: queueItem.createdAt,
    });
    queueItem.attachmentId = attachmentId;
  }

  await putQueueItem(queueItem);
  await setMetaValue(`offline:lastQueueAt:${context.scopeKey}`, queueItem.createdAt);
  emitOfflineChange();

  return {
    ok: true,
    offlineQueued: true,
    clientActionId: queueItem.clientActionId,
    message: "Reporte guardado localmente. Se sincronizar? al volver la conexi?n.",
  };
}

export async function getOfflineConditionEquipments() {
  const context = getOfflineContext();
  if (!context) return [];

  const activities = await getActivitiesForScope(context.scopeKey);
  const map = new Map();

  for (const item of Array.isArray(activities) ? activities : []) {
    const equipmentId = Number(item?.equipmentId ?? item?.equipment?.id);
    if (!Number.isFinite(equipmentId)) continue;
    if (map.has(equipmentId)) continue;

    map.set(equipmentId, {
      id: equipmentId,
      name: item?.equipment?.name || item?.equipmentName || "Equipo",
      code: item?.equipment?.code || item?.equipmentCode || item?.equipmentTag || "",
      location: item?.equipment?.location || item?.equipmentLocation || "",
    });
  }

  return Array.from(map.values()).sort((a, b) =>
    String(a?.name || "").localeCompare(String(b?.name || ""), "es-MX")
  );
}

export function getConditionReports({ status, from, to } = {}) {
  const p = new URLSearchParams();
  if (status) p.set("status", status);
  if (from) p.set("from", from);
  if (to) p.set("to", to);

  const qs = p.toString();
  return httpGet(`/condition-reports${qs ? `?${qs}` : ""}`).then(unwrap);
}

export async function createConditionReport(formData) {
  const context = getOfflineContext();
  if (!context) {
    const res = await httpForm("/condition-reports", formData);
    return unwrap(res);
  }

  if (isBrowserOnline()) {
    try {
      const res = await httpForm("/condition-reports", formData);
      return unwrap(res);
    } catch (error) {
      if (!isNetworkError(error)) throw error;
    }
  }

  return queueConditionReport(formData);
}

export async function updateConditionReportStatus(id, status) {
  const res = await httpPatch(`/condition-reports/${id}/status`, { status });
  return unwrap(res);
}

export async function dismissConditionReport(id) {
  const res = await httpPost(`/condition-reports/${id}/dismiss`, {});
  return unwrap(res);
}

export async function createCorrectiveExecution(reportId, payload) {
  const res = await httpPost(`/condition-reports/${reportId}/corrective-execution`, payload);
  return unwrap(res);
}
