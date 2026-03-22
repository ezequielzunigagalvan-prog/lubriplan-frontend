// src/services/settingsService.js
import { httpGet, httpPatch } from "./http";

// GET /api/settings
export async function getSettings() {
  return httpGet("/settings");
}

// PATCH /api/settings (ADMIN)
export async function updateSettings(payload) {
  return httpPatch("/settings", payload);
}