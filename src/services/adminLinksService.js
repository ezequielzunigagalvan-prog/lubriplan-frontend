// src/services/adminLinksService.js
import { httpGet, httpPatch } from "./http";

// GET /admin/links/technicians
export function getTechLinks() {
  return httpGet("/admin/links/technicians");
}

// PATCH /admin/users/:userId/link-technician
export function linkUserTechnician(userId, technicianId, syncName = false) {
  if (userId == null) throw new Error("userId requerido");
  return httpPatch(`/admin/users/${userId}/link-technician`, {
    technicianId,
    syncName,
  });
}