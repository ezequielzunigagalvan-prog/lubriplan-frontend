// src/services/aiService.js
import { httpGet, httpPost } from "./http";

// GET /api/ai/summary?plantId=&period=YYYY-MM&lang=
export async function getAiSummary({ period, plantId = "no-plant", lang = "es" }) {
  const q = new URLSearchParams();
  q.set("plantId", plantId || "no-plant");
  q.set("period", period); // YYYY-MM
  q.set("lang", lang || "es");

  // OJO: tu http.js ya agrega /api si hace falta, por eso aquí NO ponemos /api
  return httpGet(`/ai/summary?${q.toString()}`);
}

// POST /api/ai/summary/refresh (ADMIN)
export async function refreshAiSummary({ period, plantId }) {
  return httpPost(`/ai/summary/refresh`, { period, plantId });
}