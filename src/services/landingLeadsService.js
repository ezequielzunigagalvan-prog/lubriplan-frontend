// src/services/landingLeadsService.js
import { API_URL } from "../config.js";
import { apiFetch } from "./api.js";

// origin: "form" (botón «Solicitar demo») | "chat" (formulario del chatbot)
// website: campo trampa invisible para bots; las personas lo dejan vacío.
export async function submitLandingLead({ nombre, email, telefono, empresa, source, sessionId, origin = "form", website = "" }) {
  const res = await fetch(`${API_URL}/landing/lead`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre, email, telefono, empresa, source, sessionId, origin, website }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `Error ${res.status}`);
  return data;
}

export async function getLandingLeads({ source, status, page = 1, limit = 50 } = {}) {
  const params = new URLSearchParams({ page, limit });
  if (source) params.set("source", source);
  if (status) params.set("status", status);
  return apiFetch(`/admin/landing-leads?${params}`);
}

export async function updateLandingLead(id, { status }) {
  return apiFetch(`/admin/landing-leads/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}
