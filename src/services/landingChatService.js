// src/services/landingChatService.js
import { API_URL } from "../config.js";

async function post(endpoint, messages, sessionId) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, sessionId }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `Error ${res.status}`);
  return data;
}

export async function sendLandingChatMessage(messages, sessionId) {
  return post("/landing/chat", messages, sessionId);
}

export async function sendCardChatMessage(messages, sessionId) {
  return post("/landing/card/chat", messages, sessionId);
}
