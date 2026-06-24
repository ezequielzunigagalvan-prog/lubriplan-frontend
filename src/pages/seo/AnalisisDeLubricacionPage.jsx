import React from "react";
import MarketingPageLayout from "../../components/seo/MarketingPageLayout";
import landingAiSummary from "../../assets/landing-ai-summary.png";

export default function AnalisisDeLubricacionPage() {
  return (
    <MarketingPageLayout
      eyebrow="Analisis y decision"
      title="Analisis de lubricacion"
      intro="LubriPlan combina indicadores operativos, alertas y lectura asistida por IA para convertir datos de lubricacion en decisiones claras para mantenimiento y supervision."
      highlights={[
        "Cumplimiento y backlog en una sola vista",
        "Alertas operativas y predictivas",
        "Resumen inteligente con prioridades",
        "Trazabilidad por equipo, tecnico y condicion",
      ]}
      gallery={[
        { image: landingAiSummary, alt: "Analisis de lubricacion con IA en LubriPlan", caption: "Resumen inteligente y lectura ejecutiva de la operacion mensual." },
      ]}
      sections={[
        { title: "Indicadores utiles para planta", text: "El analisis muestra cumplimiento, atrasos, carga operativa, condiciones abiertas, reincidencia y otras senales que ayudan a explicar el estado real del programa." },
        { title: "IA enfocada en prioridad", text: "La lectura asistida por IA resume lo mas importante del periodo y entrega acciones recomendadas sin mezclar datos de otras plantas ni exponer informacion sensible." },
        { title: "Soporte para decisiones tecnicas y ejecutivas", text: "Supervision y direccion pueden usar el analisis para priorizar recursos, explicar riesgos y sostener disciplina de ejecucion con evidencia concreta." },
      ]}
    />
  );
}
