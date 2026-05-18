// src/services/auditLogService.js
import { httpGet } from "./http";

export function getAuditLog({ model, action, userId, dateFrom, dateTo, page = 1, limit = 25 } = {}) {
  const qs = new URLSearchParams();
  qs.set("page", String(page));
  qs.set("limit", String(limit));
  if (model) qs.set("model", model);
  if (action) qs.set("action", action);
  if (userId) qs.set("userId", String(userId));
  if (dateFrom) qs.set("dateFrom", dateFrom);
  if (dateTo) qs.set("dateTo", dateTo);
  return httpGet(`/audit-log?${qs.toString()}`);
}
