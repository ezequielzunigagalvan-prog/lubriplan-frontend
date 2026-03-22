// src/services/lubricantsService.js
import { httpGet, httpPost, httpPut, httpDelete } from "./http";

const buildQuery = (params = {}) => {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === null || v === undefined || v === "") return;
    qs.set(k, String(v));
  });
  const s = qs.toString();
  return s ? `?${s}` : "";
};

/* =========================
   MOVIMIENTOS
========================= */

export async function createLubricantMovement(lubricantId, data) {
  const id = Number(lubricantId);
  if (!Number.isFinite(id)) throw new Error("ID de lubricante invalido");

  return httpPost(`/lubricants/${id}/movements`, data);
}

export async function getLubricantMovements(lubricantId, takeOrParams = 80) {
  const id = Number(lubricantId);
  if (!Number.isFinite(id)) throw new Error("ID de lubricante invalido");

  const params =
    typeof takeOrParams === "number"
      ? { take: takeOrParams }
      : { ...(takeOrParams || {}) };

  if (params.take == null) params.take = 80;

  const res = await httpGet(`/lubricants/${id}/movements${buildQuery(params)}`);
  return res ?? { ok: true, lubricant: null, movements: [] };
}

/* =========================
   LUBRICANTES
========================= */

export async function getExecutionLubricants() {
  return httpGet("/lubricants/available-for-execution");
}

export async function getLubricants() {
  return httpGet("/lubricants");
}

export async function createLubricant(data) {
  return httpPost("/lubricants", data);
}

export async function updateLubricant(id, data) {
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) throw new Error("ID de lubricante invalido");

  return httpPut(`/lubricants/${numericId}`, data);
}

export async function deleteLubricant(id) {
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) throw new Error("ID de lubricante invalido");

  return httpDelete(`/lubricants/${numericId}`);
}

export default {
  getLubricants,
  getExecutionLubricants,
  createLubricant,
  updateLubricant,
  deleteLubricant,
  createLubricantMovement,
  getLubricantMovements,
};
