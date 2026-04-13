import { httpGet, httpPut, httpPost, httpPatch, httpForm } from "./http";
import { getRole, getUser } from "../auth/auth";
import {
  getActivitiesForScope,
  getActivityForScope,
  upsertActivitiesForScope,
  putActivityForScope,
  getQueueItemsForScope,
  putQueueItem,
  updateQueueItem,
  deleteQueueItem,
  putAttachment,
  getAttachment,
  deleteAttachment,
  setMetaValue,
  getMetaValue,
} from "../offline/offlineDb";

const OFFLINE_ENABLED_ROLE = "TECHNICIAN";
export const OFFLINE_SYNC_EVENT = "lubriplan:offline-sync-changed";

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

function buildExecutionsQuery(params = {}) {
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

  return `/executions${qs.toString() ? `?${qs.toString()}` : ""}`;
}

function parseLocalDateSafe(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  const raw = String(value).trim();
  if (!raw) return null;

  const ymd = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymd) {
    const [, y, m, d] = ymd;
    return new Date(Number(y), Number(m) - 1, Number(d), 12, 0, 0, 0);
  }

  const isoLike = raw.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (isoLike) {
    const [, y, m, d, hh, mm, ss = "0"] = isoLike;
    return new Date(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm), Number(ss), 0);
  }

  const dt = new Date(raw);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function toLocalYmd(value) {
  const dt = parseLocalDateSafe(value);
  if (!dt) return "";
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function monthRange(monthValue) {
  const [year, month] = String(monthValue || "").split("-").map(Number);
  if (!Number.isFinite(year) || !Number.isFinite(month)) {
    const now = new Date();
    return {
      from: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0),
      to: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
    };
  }

  return {
    from: new Date(year, month - 1, 1, 0, 0, 0, 0),
    to: new Date(year, month, 0, 23, 59, 59, 999),
  };
}

function completedRangeWindow(rangeValue, monthValue) {
  const now = new Date();
  const range = String(rangeValue || "MONTH").trim().toUpperCase();
  if (range === "90D") {
    return {
      from: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 90, 0, 0, 0, 0),
      to: now,
    };
  }
  if (range === "30D") {
    return {
      from: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30, 0, 0, 0, 0),
      to: now,
    };
  }
  return monthRange(monthValue);
}

function computeExecutionStatus(execution) {
  const rawStatus = String(execution?.status || "").trim().toUpperCase();
  if (rawStatus === "COMPLETED" && execution?.executedAt) return "COMPLETED";

  const scheduled = parseLocalDateSafe(execution?.scheduledAt);
  if (!scheduled) return rawStatus || "PENDING";

  const scheduledDay = new Date(scheduled.getFullYear(), scheduled.getMonth(), scheduled.getDate()).getTime();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  return scheduledDay < today ? "OVERDUE" : "PENDING";
}

function applyComputedStatus(execution) {
  if (!execution) return null;
  return {
    ...execution,
    status: computeExecutionStatus(execution),
  };
}

function applyQueueState(execution, queueItem) {
  if (!execution || !queueItem) return execution;
  const payload = queueItem.payload || {};

  return applyComputedStatus({
    ...execution,
    status: "COMPLETED",
    executedAt: payload.executedAt || new Date().toISOString(),
    technicianId:
      payload.technicianId != null && payload.technicianId !== ""
        ? Number(payload.technicianId)
        : execution.technicianId,
    condition: payload.condition ?? execution.condition ?? null,
    observations: payload.observations ?? execution.observations ?? null,
    evidenceImage: payload.evidenceImage ?? execution.evidenceImage ?? null,
    evidenceNote: payload.evidenceNote ?? execution.evidenceNote ?? null,
    usedQuantity: payload.usedQuantity ?? execution.usedQuantity ?? null,
    usedInputQuantity: payload.usedQuantity ?? execution.usedInputQuantity ?? null,
    usedInputUnit: payload.usedUnit ?? execution.usedInputUnit ?? null,
    localSyncStatus: queueItem.status === "failed" ? "failed" : "pending",
    localSyncError: queueItem.errorMessage || "",
    localClientActionId: queueItem.clientActionId,
  });
}

async function mergeQueuedState(scopeKey, items) {
  const queueItems = await getQueueItemsForScope(scopeKey);
  if (!queueItems.length) {
    return items.map((item) => ({
      ...applyComputedStatus(item),
      localSyncStatus: item?.localSyncStatus || "synced",
      localSyncError: item?.localSyncError || "",
    }));
  }

  const attachmentPairs = await Promise.all(
    queueItems.map(async (item) => [item.clientActionId, item.attachmentId ? await getAttachment(item.attachmentId) : null])
  );
  const attachmentMap = new Map(attachmentPairs);
  const queueMap = new Map(queueItems.map((item) => [Number(item.executionId), item]));
  return items.map((item) => {
    const queueItem = queueMap.get(Number(item?.id));
    const attachment = queueItem ? attachmentMap.get(queueItem.clientActionId) : null;
    return queueItem
      ? applyQueueState(item, {
          ...queueItem,
          payload: {
            ...(queueItem.payload || {}),
            evidenceImage:
              attachment?.dataUrl ??
              queueItem?.payload?.evidenceImage ??
              item?.evidenceImage ??
              null,
          },
        })
      : {
          ...applyComputedStatus(item),
          localSyncStatus: item?.localSyncStatus || "synced",
          localSyncError: item?.localSyncError || "",
        };
  });
}

function filterCachedExecutions(items, params = {}) {
  const monthWindow = monthRange(params.month);
  const completedWindow = completedRangeWindow(params.completedRange, params.month);
  const statusFilter = String(params.status || "").trim().toUpperCase();
  const limitRaw = Number(params.limit ?? params.pageSize ?? 50);
  const pageSize = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 200) : 50;
  const pageRaw = Number(params.page ?? 1);
  const page = Number.isFinite(pageRaw) ? Math.max(pageRaw, 1) : 1;

  let filtered = [...items].filter((execution) => {
    const status = String(execution?.status || "").toUpperCase();
    const scheduledAt = parseLocalDateSafe(execution?.scheduledAt);
    const executedAt = parseLocalDateSafe(execution?.executedAt);

    const scheduledInMonth =
      scheduledAt && scheduledAt.getTime() >= monthWindow.from.getTime() && scheduledAt.getTime() <= monthWindow.to.getTime();
    const executedInRange =
      executedAt && executedAt.getTime() >= completedWindow.from.getTime() && executedAt.getTime() <= completedWindow.to.getTime();

    return scheduledInMonth || executedInRange || status !== "COMPLETED";
  });

  if (["PENDING", "OVERDUE", "COMPLETED"].includes(statusFilter)) {
    filtered = filtered.filter((execution) => String(execution?.status || "").toUpperCase() === statusFilter);
  }

  filtered.sort((a, b) => {
    const aStatus = String(a?.status || "").toUpperCase();
    const bStatus = String(b?.status || "").toUpperCase();

    if (aStatus === "COMPLETED" && bStatus === "COMPLETED") {
      return new Date(b?.executedAt || 0).getTime() - new Date(a?.executedAt || 0).getTime();
    }

    if (aStatus === "COMPLETED") return 1;
    if (bStatus === "COMPLETED") return -1;

    return new Date(a?.scheduledAt || 0).getTime() - new Date(b?.scheduledAt || 0).getTime();
  });

  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;

  return {
    items: filtered.slice(start, start + pageSize),
    meta: { page, pageSize, total, pages },
  };
}

async function updateCachedExecution(scopeKey, item) {
  if (!scopeKey || !item) return;
  await putActivityForScope(scopeKey, {
    ...item,
    localSyncStatus: item?.localSyncStatus || "synced",
    localSyncError: item?.localSyncError || "",
  });
}

async function getCachedExecutionsResult(scopeKey, params = {}) {
  const items = await getActivitiesForScope(scopeKey);
  const filtered = filterCachedExecutions(await mergeQueuedState(scopeKey, items), params);
  const sync = await getExecutionOfflineStatus();

  return {
    ok: true,
    offline: true,
    items: filtered.items,
    meta: filtered.meta,
    sync,
  };
}

async function fetchExecutionsOnline(params = {}) {
  const url = buildExecutionsQuery(params);
  return httpGet(url);
}

async function fetchExecutionDetailOnline(id) {
  return httpGet(`/executions/${id}`);
}

async function completeExecutionOnline(id, payload) {
  return httpPatch(`/executions/${id}/complete`, payload ?? {});
}

async function cacheOnlineExecutions(scopeKey, items) {
  if (!scopeKey) return;
  await upsertActivitiesForScope(scopeKey, items);
  await setMetaValue(`offline:lastSyncAt:${scopeKey}`, new Date().toISOString());
  emitOfflineChange();
}

function buildOfflineQueueItem(scopeKey, executionId, payload) {
  const createdAt = new Date().toISOString();
  return {
    clientActionId: `exec-${executionId}-complete-${Date.now()}`,
    scopeKey,
    type: "execution.complete",
    executionId: Number(executionId),
    payload: { ...payload },
    status: "pending",
    createdAt,
    updatedAt: createdAt,
    errorMessage: "",
  };
}

function normalizeQueuePayload(payload = {}) {
  return {
    ...payload,
    observations: payload.observations ?? "",
    condition: payload.condition ?? "BUENO",
    evidenceImage: payload.evidenceImage ?? null,
    evidenceNote: payload.evidenceNote ?? null,
  };
}


function dataUrlToBlob(dataUrl) {
  const parts = String(dataUrl || "").split(",");
  if (parts.length < 2) return null;
  const mimeMatch = parts[0].match(/data:(.*?);base64/);
  const mimeType = mimeMatch?.[1] || "image/jpeg";
  const binary = atob(parts[1]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

async function createConditionReportOnline(payload, attachment) {
  const formData = new FormData();
  formData.append("equipmentId", String(payload?.equipmentId || ""));
  formData.append("detectedAt", String(payload?.detectedAt || ""));
  formData.append("condition", String(payload?.condition || "REGULAR"));
  if (payload?.category) formData.append("category", String(payload.category));
  formData.append("description", String(payload?.description || ""));
  if (attachment?.dataUrl) {
    const blob = dataUrlToBlob(attachment.dataUrl);
    if (blob) {
      formData.append("evidence", blob, attachment.fileName || "evidencia.jpg");
    }
  }
  return httpForm("/condition-reports", formData);
}

function detectSyncConflict(serverItem, queueItem) {
  if (!serverItem || !queueItem?.baseline) return "";

  const baseline = queueItem.baseline || {};
  const currentStatus = String(serverItem?.status || "").toUpperCase();
  if (currentStatus === "COMPLETED") {
    return "";
  }

  const currentScheduledAt = String(serverItem?.scheduledAt || "");
  if (baseline.scheduledAt && currentScheduledAt && currentScheduledAt !== baseline.scheduledAt) {
    return "La fecha programada cambió en servidor. Revisa la actividad antes de sincronizar.";
  }

  const currentTechnicianId = serverItem?.technicianId ?? serverItem?.technician?.id ?? null;
  if (
    baseline.technicianId != null &&
    currentTechnicianId != null &&
    Number(currentTechnicianId) !== Number(baseline.technicianId) &&
    Number(currentTechnicianId) !== Number(queueItem?.payload?.technicianId)
  ) {
    return "La actividad cambió de técnico en servidor. Revisa antes de sincronizar.";
  }

  return "";
}

async function queueExecutionCompletion(scopeKey, id, payload) {
  const execution = await getActivityForScope(scopeKey, Number(id));
  if (!execution) {
    throw new Error("Esta actividad no esta disponible sin conexion. Actualiza tus actividades antes de salir a campo.");
  }

  const normalizedPayload = normalizeQueuePayload(payload);
  const queueItem = buildOfflineQueueItem(scopeKey, id, normalizedPayload);
  queueItem.baseline = {
    status: String(execution?.status || "").toUpperCase(),
    scheduledAt: execution?.scheduledAt || "",
    technicianId: execution?.technicianId ?? execution?.technician?.id ?? null,
  };

  if (normalizedPayload.evidenceImage) {
    const attachmentId = `${queueItem.clientActionId}:evidence`;
    await putAttachment({
      id: attachmentId,
      scopeKey,
      executionId: Number(id),
      type: "evidenceImage",
      dataUrl: normalizedPayload.evidenceImage,
      createdAt: queueItem.createdAt,
    });
    queueItem.attachmentId = attachmentId;
    queueItem.payload = {
      ...normalizedPayload,
      evidenceImage: null,
    };
  }

  const queuedExecution = applyQueueState(execution, {
    ...queueItem,
    payload: {
      ...(queueItem.payload || {}),
      evidenceImage: normalizedPayload.evidenceImage ?? null,
    },
  });

  await putQueueItem(queueItem);
  await putActivityForScope(scopeKey, queuedExecution);
  await setMetaValue(`offline:lastQueueAt:${scopeKey}`, queueItem.createdAt);
  emitOfflineChange();

  return {
    ok: true,
    offlineQueued: true,
    item: queuedExecution,
  };
}

export async function getExecutionOfflineStatus() {
  const context = getOfflineContext();
  if (!context) {
    return {
      enabled: false,
      isOnline: isBrowserOnline(),
      pendingCount: 0,
      failedCount: 0,
      syncingCount: 0,
      lastSyncAt: null,
    };
  }

  const queueItems = await getQueueItemsForScope(context.scopeKey);
  const lastSyncAt = await getMetaValue(`offline:lastSyncAt:${context.scopeKey}`);

  return {
    enabled: true,
    isOnline: isBrowserOnline(),
    pendingCount: queueItems.filter((item) => item.status === "pending").length,
    failedCount: queueItems.filter((item) => item.status === "failed").length,
    syncingCount: queueItems.filter((item) => item.status === "syncing").length,
    lastSyncAt: lastSyncAt || null,
  };
}

export async function syncOfflineExecutionQueue() {
  const context = getOfflineContext();
  if (!context) {
    return { ok: true, synced: 0, failed: 0, skipped: true };
  }

  if (!isBrowserOnline()) {
    return { ok: true, synced: 0, failed: 0, skipped: true };
  }

  const queueItems = (await getQueueItemsForScope(context.scopeKey)).filter((item) =>
    ["pending", "failed"].includes(String(item?.status || "").toLowerCase())
  );

  let synced = 0;
  let failed = 0;

  for (const item of queueItems) {
    await updateQueueItem(item.clientActionId, {
      status: "syncing",
      updatedAt: new Date().toISOString(),
      errorMessage: "",
    });
    emitOfflineChange();

    try {
      if (item.type === "execution.complete") {
        const serverBefore = await fetchExecutionDetailOnline(item.executionId);
        const conflictMessage = detectSyncConflict(serverBefore, item);
        if (conflictMessage) {
          throw new Error(conflictMessage);
        }

        const attachment = item.attachmentId ? await getAttachment(item.attachmentId) : null;
        const response = await completeExecutionOnline(item.executionId, {
          ...item.payload,
          clientActionId: item.clientActionId,
          evidenceImage: attachment?.dataUrl ?? item?.payload?.evidenceImage ?? null,
        });

        const serverItem = response?.item || (await fetchExecutionDetailOnline(item.executionId));
        await updateCachedExecution(context.scopeKey, {
          ...applyComputedStatus(serverItem),
          localSyncStatus: "synced",
          localSyncError: "",
        });
        await deleteQueueItem(item.clientActionId);
        if (item.attachmentId) {
          await deleteAttachment(item.attachmentId);
        }
        synced += 1;
      } else if (item.type === "condition-report.create") {
        const attachment = item.attachmentId ? await getAttachment(item.attachmentId) : null;
        await createConditionReportOnline(item.payload || {}, attachment);
        await deleteQueueItem(item.clientActionId);
        if (item.attachmentId) {
          await deleteAttachment(item.attachmentId);
        }
        synced += 1;
      } else {
        throw new Error("Tipo de sincronizaci?n no soportado");
      }
    } catch (error) {
      const message = String(error?.message || "");
      const alreadyCompleted = error?.status === 400 && /ya fue completada/i.test(message);

      if (alreadyCompleted) {
        try {
          const serverItem = await fetchExecutionDetailOnline(item.executionId);
          await updateCachedExecution(context.scopeKey, {
            ...applyComputedStatus(serverItem),
            localSyncStatus: "synced",
            localSyncError: "",
          });
          await deleteQueueItem(item.clientActionId);
          if (item.attachmentId) {
            await deleteAttachment(item.attachmentId);
          }
          synced += 1;
          continue;
        } catch {
          // Si no puede refrescar, se marca como fallida para no perderla.
        }
      }

      await updateQueueItem(item.clientActionId, {
        status: "failed",
        updatedAt: new Date().toISOString(),
        errorMessage: message || "Error sincronizando",
      });

      const cached = await getActivityForScope(context.scopeKey, item.executionId);
      if (cached) {
        await putActivityForScope(context.scopeKey, {
          ...cached,
          localSyncStatus: "failed",
          localSyncError: message || "Error sincronizando",
        });
      }
      failed += 1;
    }

    emitOfflineChange();
  }

  if (synced > 0) {
    await setMetaValue(`offline:lastSyncAt:${context.scopeKey}`, new Date().toISOString());
  }
  emitOfflineChange();

  return { ok: failed === 0, synced, failed, skipped: false };
}

export function isTechnicianOfflineEnabled() {
  return Boolean(getOfflineContext());
}

export function assignExecutionTechnician(executionId, technicianId) {
  return httpPatch(`/executions/${executionId}/assign`, { technicianId });
}

export async function getExecutions(params = {}) {
  const context = getOfflineContext();
  if (!context) {
    return fetchExecutionsOnline(params);
  }

  if (isBrowserOnline()) {
    await syncOfflineExecutionQueue().catch(() => null);
    try {
      const data = await fetchExecutionsOnline(params);
      const onlineItems = Array.isArray(data?.items) ? data.items : [];
      const mergedItems = await mergeQueuedState(context.scopeKey, onlineItems);
      await cacheOnlineExecutions(context.scopeKey, mergedItems);
      return {
        ...data,
        offline: false,
        items: mergedItems,
        sync: await getExecutionOfflineStatus(),
      };
    } catch (error) {
      if (!isNetworkError(error)) throw error;
    }
  }

  return getCachedExecutionsResult(context.scopeKey, params);
}

export async function getExecutionsByRoute(routeId) {
  return httpGet(`/routes/${routeId}/executions`);
}

export async function checkOverdue() {
  return httpPut("/executions/check-overdue", {});
}

export async function completeExecution(id, payload) {
  const context = getOfflineContext();
  if (!context) {
    return completeExecutionOnline(id, payload);
  }

  if (isBrowserOnline()) {
    try {
      const response = await completeExecutionOnline(id, payload);
      const serverItem = response?.item || (await fetchExecutionDetailOnline(id));
      await updateCachedExecution(context.scopeKey, {
        ...applyComputedStatus(serverItem),
        localSyncStatus: "synced",
        localSyncError: "",
      });
      emitOfflineChange();
      return response;
    } catch (error) {
      if (!isNetworkError(error)) throw error;
    }
  }

  return queueExecutionCompletion(context.scopeKey, id, payload);
}

export async function getExecutionById(id) {
  const context = getOfflineContext();
  if (!context) {
    return fetchExecutionDetailOnline(id);
  }

  if (isBrowserOnline()) {
    try {
      const onlineItem = await fetchExecutionDetailOnline(id);
      const mergedItems = await mergeQueuedState(context.scopeKey, [onlineItem]);
      const finalItem = mergedItems[0] || applyComputedStatus(onlineItem);
      await updateCachedExecution(context.scopeKey, finalItem);
      emitOfflineChange();
      return finalItem;
    } catch (error) {
      if (!isNetworkError(error)) throw error;
    }
  }

  const cached = await getActivityForScope(context.scopeKey, Number(id));
  if (!cached) {
    throw new Error("La actividad no esta disponible sin conexion.");
  }
  return cached;
}

export async function createManualExecution(payload) {
  return httpPost("/executions", payload ?? {});
}

