// src/services/techniciansService.js
import { httpGet, httpPost, httpPut, httpDelete } from "./http";

const normText = (v) => String(v ?? "").trim();

function normalizeStatus(s) {
  const v = normText(s).toUpperCase();
  if (!v) return "ACTIVO";
  if (v === "ACTIVO" || v === "ACTIVE") return "ACTIVO";
  if (v === "INACTIVO" || v === "INACTIVE") return "INACTIVO";
  return v;
}

function normalizeSpecialty(s) {
  const v = normText(s);
  return v || "LUBRICACIÓN";
}

function normalizeTechnician(t) {
  if (!t) return t;

  return {
    ...t,
    name: normText(t.name),
    code: normText(t.code),
    specialty: normalizeSpecialty(t.specialty),
    status: normalizeStatus(t.status),
    lastActivityAt: t.lastActivityAt ?? t.lastActivityDate ?? null,
  };
}

/* GET ALL */
export async function getTechnicians() {
  const data = await httpGet(`/technicians?_t=${Date.now()}`);
  const arr = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
  return arr.map(normalizeTechnician);
}

/* CREATE */
export async function createTechnician(payload) {
  const data = await httpPost("/technicians", payload);
  return normalizeTechnician(data?.item ?? data);
}

/* UPDATE */
export async function updateTechnician(id, payload) {
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) throw new Error("ID de técnico inválido");

  const data = await httpPut(`/technicians/${numericId}`, payload);
  return normalizeTechnician(data?.item ?? data);
}

/* DELETE */
export async function deleteTechnician(id) {
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) throw new Error("ID de técnico inválido");
  return httpDelete(`/technicians/${numericId}`);
}



