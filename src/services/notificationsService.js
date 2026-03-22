// src/services/notificationsService.js
import { httpGet, httpPatch } from "./http";

// ✅ GET /notifications?unread=1&limit=10&cursor=123
export function getNotifications({ unread = false, limit = 10, cursor = null, token } = {}) {
  const q = new URLSearchParams();
  if (unread) q.set("unread", "1");
  q.set("limit", String(limit));
  if (cursor != null && cursor !== "") q.set("cursor", String(cursor));

  // token es opcional; si no lo pasas, http.js usa getToken()
  return httpGet(`/notifications?${q.toString()}`, token ? { token } : undefined);
}

// ✅ PATCH /notifications/:id/read
export function markNotificationRead({ id, token } = {}) {
  if (id == null) throw new Error("id requerido");
  return httpPatch(`/notifications/${id}/read`, {}, token ? { token } : undefined);
}

// ✅ PATCH /notifications/read-all
export function markAllNotificationsRead({ token } = {}) {
  return httpPatch("/notifications/read-all", {}, token ? { token } : undefined);
}