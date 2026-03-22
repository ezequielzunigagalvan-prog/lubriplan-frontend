// src/services/equipmentAreasService.js
import { httpGet, httpPost, httpPut, httpDelete } from "./http";

// ⏱️ Timeouts (ms)
const TIMEOUT_READ = 30000;
const TIMEOUT_WRITE = 60000;

// GET (normalizado)
export async function getEquipmentAreas() {
  const data = await httpGet("/equipment-areas", TIMEOUT_READ);

  // backend actual: { ok:true, result:[...] }
  if (Array.isArray(data?.result)) return data.result;

  // compat: array directo
  if (Array.isArray(data)) return data;

  return [];
}

// CREATE
export async function createEquipmentArea(payload) {
  const data = await httpPost("/equipment-areas", payload, TIMEOUT_WRITE);

  // backend actual: { ok:true, area }
  if (data?.area) return data.area;

  // compat: {result: ...} o objeto directo
  if (data?.result) return data.result;

  return data;
}

// UPDATE
export async function updateEquipmentArea(id, payload) {
  const data = await httpPut(`/equipment-areas/${id}`, payload, TIMEOUT_WRITE);

  if (data?.area) return data.area;
  if (data?.result) return data.result;

  return data;
}

// DELETE
export async function deleteEquipmentArea(id) {
  // backend actual: { ok:true }
  return httpDelete(`/equipment-areas/${id}`, TIMEOUT_WRITE);
}