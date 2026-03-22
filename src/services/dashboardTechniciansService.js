// src/services/dashboardTechniciansService.js
import { httpGet } from "./http";

// GET /api/dashboard/technicians/efficiency-monthly?month=YYYY-MM
export function getTechniciansEfficiencyMonthly({ month } = {}) {
  const qs = new URLSearchParams();
  if (month) qs.set("month", month);
  const q = qs.toString();
  return httpGet(`/dashboard/technicians/efficiency-monthly${q ? `?${q}` : ""}`);
}