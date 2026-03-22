// src/services/emergencyActivitiesService.js
import { httpPost } from "./http";

export function createEmergencyActivity(payload) {
  return httpPost("/emergency-activities", payload);
  // backend devuelve: { route, execution }
}