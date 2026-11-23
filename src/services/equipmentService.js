// src/services/equipmentService.js
import { httpGet, httpPost, httpPut, httpDelete, httpPatch } from "./http";

// ⏱️ Timeouts (ms)
const TIMEOUT_READ = 30000;
const TIMEOUT_WRITE = 60000;

// =========================
// EQUIPMENT
// =========================

// GET EQUIPMENT LIST (con filtros)
export function getEquipment(params = {}) {
  const qs = new URLSearchParams();

  if (params.filter) qs.set("filter", String(params.filter));
  if (params.days != null) qs.set("days", String(params.days));
  if (params.month) qs.set("month", String(params.month));

  const q = qs.toString();
  return httpGet(`/equipment${q ? `?${q}` : ""}`, {
    timeoutMs: TIMEOUT_READ,
  });
}

// GET EQUIPMENT DETAIL BY ID
export function getEquipmentById(id) {
  return httpGet(`/equipment/${id}/detail`, {
    timeoutMs: TIMEOUT_READ,
  });
}

// CREATE EQUIPMENT
export function createEquipment(data) {
  return httpPost(`/equipment`, data, {
    timeoutMs: TIMEOUT_WRITE,
  });
}

// UPDATE EQUIPMENT
export function updateEquipment(id, data) {
  return httpPut(`/equipment/${id}`, data, {
    timeoutMs: TIMEOUT_WRITE,
  });
}

// DELETE EQUIPMENT
export function deleteEquipment(id) {
  return httpDelete(`/equipment/${id}`, {
    timeoutMs: TIMEOUT_WRITE,
  });
}

// =========================
// EQUIPMENT RELATED
// =========================

// Rutas del equipo
export function getEquipmentRoutes(id) {
  return httpGet(`/equipments/${id}/routes`, {
    timeoutMs: TIMEOUT_READ,
  });
}

// Asignar técnico masivo a actividades del equipo
export function assignEquipmentTechnician(
  equipmentId,
  technicianId,
  { from, force } = {}
) {
  const qs = new URLSearchParams();

  if (from) qs.set("from", String(from));
  if (force) qs.set("force", "1");

  const q = qs.toString();

  return httpPatch(
    `/equipments/${equipmentId}/assign-technician${q ? `?${q}` : ""}`,
    { technicianId },
    { timeoutMs: TIMEOUT_WRITE }
  );
}

// Alias
export function assignTechnicianToEquipmentRoutes(
  equipmentId,
  technicianId,
  opts = {}
) {
  return assignEquipmentTechnician(equipmentId, technicianId, opts);
}

// =========================
// ALERTS / ANALYTICS
// =========================

// Alerts: overload
export function getTechnicianOverload({
  windowDays = 7,
  overdueLookbackDays = 30,
  capacityPerDay = 6,
  warnRatio = 1.1,
  criticalRatio = 1.4,
} = {}) {
  const qs = new URLSearchParams();
  qs.set("windowDays", String(windowDays));
  qs.set("overdueLookbackDays", String(overdueLookbackDays));
  qs.set("capacityPerDay", String(capacityPerDay));
  qs.set("warnRatio", String(warnRatio));
  qs.set("criticalRatio", String(criticalRatio));

  return httpGet(`/alerts/technician-overload?${qs.toString()}`, {
    timeoutMs: TIMEOUT_READ,
  });
}

// Fallas repetidas: { items: [{ equipment, badCount, criticalCount, samples, ... }] }
// Antes llamaba a /equipment?filter=repeated-failures, que responde otro formato
// (lista de equipos), y la vista de reincidencia siempre salía vacía.
export function getRepeatedFailures({ month, lookbackDays, minEvents } = {}) {
  const qs = new URLSearchParams();
  if (month) qs.set("month", String(month));
  if (lookbackDays) qs.set("lookbackDays", String(lookbackDays));
  if (minEvents) qs.set("minEvents", String(minEvents));

  const q = qs.toString();

  return httpGet(`/alerts/repeated-failures${q ? `?${q}` : ""}`, {
    timeoutMs: TIMEOUT_READ,
  });
}

// =========================
// ALIASES
// =========================
export const getEquipments = getEquipment;
export const fetchEquipments = getEquipment;
export const listEquipments = getEquipment;