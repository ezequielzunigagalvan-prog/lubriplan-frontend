// src/services/landingChatService.js
// Servicio público para el chatbot del landing — sin headers de autenticación.
import { API_URL } from "../config.js";

export async function sendLandingChatMessage(messages) {
  const res = await fetch(`${API_URL}/landing/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.error || `Error ${res.status}`);
  }

  return data;
}
