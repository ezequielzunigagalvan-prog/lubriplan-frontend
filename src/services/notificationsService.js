// src/services/notificationsService.js
import { httpGet, httpPatch, httpDelete } from "./http";

// GET /notifications?unread=1&type=A,B&limit=10&cursor=123
export function getNotifications({ unread = false, limit = 10, cursor = null, types = null, token } = {}) {
  const q = new URLSearchParams();
  if (unread) q.set("unread", "1");
  q.set("limit", String(limit));
  if (cursor != null && cursor !== "") q.set("cursor", String(cursor));
  if (Array.isArray(types) && types.length) q.set("type", types.join(","));
  return httpGet(`/notifications?${q.toString()}`, token ? { token } : undefined);
}

export function markNotificationRead({ id, token } = {}) {
  if (id == null) throw new Error("id requerido");
  return httpPatch(`/notifications/${id}/read`, {}, token ? { token } : undefined);
}

export function markAllNotificationsRead({ types = null, token } = {}) {
  const qs = Array.isArray(types) && types.length ? `?type=${types.join(",")}` : "";
  return httpPatch(`/notifications/read-all${qs}`, {}, token ? { token } : undefined);
}

export function deleteNotification(id) {
  if (id == null) throw new Error("id requerido");
  return httpDelete(`/notifications/${id}`);
}

export function deleteReadNotifications() {
  return httpDelete("/notifications/read");
}
