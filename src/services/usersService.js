// src/services/usersService.js
import { httpGet, httpPost, httpPatch, httpPut } from "./http";

export function getUserPlants(userId) {
  return httpGet(`/users/${userId}/plants`);
}

export function updateUserPlants(userId, data) {
  return httpPut(`/users/${userId}/plants`, data);
}

/**
 * GET /users
 * Backend: { ok:true, items:[...] }
 * Front: UsersPage espera { items: [...] }
 */
export async function getUsers() {
  const data = await httpGet("/users");
  return { items: Array.isArray(data?.items) ? data.items : [] };
}

/**
 * POST /users
 * body: { name, email, role, technicianId? }
 * Backend: { ok:true, user:{...} }
 */
export function createUser(payload) {
  return httpPost("/users", payload);
}

/**
 * PATCH /users/:id/status
 * body: { active: boolean }
 */
export function setUserActive(userId, active) {
  return httpPatch(`/users/${userId}/status`, { active: Boolean(active) });
}

/**
 * PATCH /users/:id
 * body: { name?, email?, role?, technicianId? }
 */
export function updateUser(userId, payload) {
  return httpPatch(`/users/${userId}`, payload);
}

/**
 * ✅ GET /users/technicians/available
 * Backend sugerido: { ok:true, items:[{id,name,code,status}] }
 */
export async function getAvailableTechnicians() {
  const data = await httpGet("/users/technicians/available");
  return { items: Array.isArray(data?.items) ? data.items : [] };
}

export async function getAvailableUserPlants() {
  const data = await httpGet("/users/plants/available");
  return { items: Array.isArray(data?.items) ? data.items : [] };
}
