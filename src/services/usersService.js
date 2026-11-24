// src/services/usersService.js
import { httpGet, httpPost, httpPatch, httpPut } from "./http";

/** scope: "plant" (planta actual) | "all" (todas mis plantas) */
export async function getUsers(scope = "plant") {
  const data = await httpGet(`/users${scope === "all" ? "?scope=all" : ""}`);
  return Array.isArray(data?.items) ? data.items : [];
}

/** Plantas activas y técnicos sin cuenta (por planta) para el formulario. */
export async function getUserOptions(userId = null) {
  const data = await httpGet(`/users/options${userId ? `?userId=${userId}` : ""}`);
  return { plants: data?.plants || [], technicians: data?.technicians || [] };
}

/** payload: { name, email, role, password?, sendInvite?, plants:[{plantId,isDefault}], technicians:{[plantId]:{technicianId?|code?}} } */
export function createUser(payload) {
  return httpPost("/users", payload);
}

export function updateUser(userId, payload) {
  return httpPatch(`/users/${userId}`, payload);
}

export function updateUserAccess(userId, payload) {
  return httpPut(`/users/${userId}/access`, payload);
}

export function setUserActive(userId, active) {
  return httpPatch(`/users/${userId}/status`, { active: Boolean(active) });
}

export function setUserPassword(userId, password) {
  return httpPost(`/users/${userId}/password`, { password });
}

export function sendPasswordLink(userId) {
  return httpPost(`/users/${userId}/password-link`, {});
}
