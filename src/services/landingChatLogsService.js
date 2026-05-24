// src/services/landingChatLogsService.js
import { apiFetch } from "./api.js";

export async function getLandingChatLogs({ hotOnly = false, page = 1, limit = 50 } = {}) {
  const params = new URLSearchParams({ page, limit, ...(hotOnly ? { hotOnly: "true" } : {}) });
  return apiFetch(`/admin/landing-chat-logs?${params}`);
}

export async function deleteLandingChatLog(id) {
  return apiFetch(`/admin/landing-chat-logs/${id}`, { method: "DELETE" });
}
