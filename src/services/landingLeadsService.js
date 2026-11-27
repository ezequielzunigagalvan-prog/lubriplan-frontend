// src/services/landingLeadsService.js
import { API_URL } from "../config.js";

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
