// src/services/analysisService.js
import { httpGet } from "./http";

/** Indicadores del módulo de Análisis. params: { days } o { from, to } (YYYY-MM-DD). */
export function getAnalysisOverview(params = {}) {
  const qs = new URLSearchParams();
  if (params.from && params.to) {
    qs.set("from", params.from);
    qs.set("to", params.to);
  } else {
    qs.set("days", String(params.days || 90));
  }
  return httpGet(`/analysis/overview?${qs.toString()}`);
}

/** Reporte mensual (mes calendario, comparado contra el mes anterior). */
export function getMonthlyReport(month) {
  return httpGet(`/analysis/monthly-report?month=${encodeURIComponent(month)}`);
}
