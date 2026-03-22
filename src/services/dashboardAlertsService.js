// src/services/dashboardAlertsService.js
import { httpGet, httpPatch } from "./http";

// =========================
// NOTIFICATIONS
// =========================

export function getNotifications({ unread = false, limit = 10 } = {}) {
  const q = new URLSearchParams();
  if (unread) q.set("unread", "1");
  q.set("limit", String(limit));
  return httpGet(`/notifications?${q.toString()}`);
}

export function markNotificationRead(id) {
  return httpPatch(`/notifications/${encodeURIComponent(id)}/read`, {});
}

export function markAllNotificationsRead() {
  return httpPatch(`/notifications/read-all`, {});
}