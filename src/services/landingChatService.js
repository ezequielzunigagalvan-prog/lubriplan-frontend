// src/services/landingChatService.js
import { API_URL } from "../config.js";

export async function sendLandingChatMessage(messages, sessionId) {
  const res = await fetch(`${API_URL}/landing/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, sessionId }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `Error ${res.status}`);
  return data;
}
