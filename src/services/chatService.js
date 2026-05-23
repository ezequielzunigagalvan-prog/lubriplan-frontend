// src/services/chatService.js
// apiFetch inyecta automáticamente Authorization: Bearer <token> y x-plant-id
import { httpPost } from "./http.js";

export async function sendChatMessage(messages) {
  return httpPost("/ai/chat", { messages });
}
