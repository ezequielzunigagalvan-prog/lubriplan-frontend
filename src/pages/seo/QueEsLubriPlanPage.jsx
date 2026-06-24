import React from "react";
import MarketingPageLayout from "../../components/seo/MarketingPageLayout";
import landingDashboardCover from "../../assets/landing-dashboard-cover.png";
import landingAlerts from "../../assets/landing-alerts.png";
import landingAiSummary from "../../assets/landing-ai-summary.png";

export default function QueEsLubriPlanPage() {
  return (
    <MarketingPageLayout
      eyebrow="Plataforma industrial"
      title="Que es LubriPlan"
      intro="LubriPlan es una plataforma para controlar la lubricacion industrial desde la planeacion hasta la lectura ejecutiva. Une rutas, actividades, cartas digitales, alertas, inventario y analisis en una sola operacion visible."
      highlights={[
        "Planeacion y ejecucion en una misma base",
        "Trazabilidad por equipo, tecnico y condicion",
        "Inventario conectado al consumo real",
        "Lectura ejecutiva con alertas e IA",
      ]}
      gallery={[
        { image: landingDashboardCover, alt: "Dashboard operativo de LubriPlan", caption: "Panel operativo con KPIs, prioridades y control mensual." },
        { image: landingAlerts, alt: "Alertas operativas y predictivas de LubriPlan", caption: "Alertas operativas y predictivas para reaccionar antes de perder control." },
        { image: landingAiSummary, alt: "Resumen inteligente de LubriPlan", caption: "Resumen inteligente para priorizar acciones y explicar riesgos." },
      ]}
      sections={[
        { title: "Para quien esta disenado", text: "LubriPlan fue creado para jefes de mantenimiento, supervisores de lubricacion, confiabilidad y tecnicos que necesitan ejecutar con disciplina y demostrar control operativo con datos confiables." },
        { title: "Beneficios operativos", text: "Reduce atraso, ordena prioridades, mejora consistencia de ejecucion, conecta inventario con consumo y entrega trazabilidad real por equipo, ruta y tecnico." },
        { title: "Cartas digitales y rutas", text: "Las cartas digitales de lubricacion y las rutas estructuradas permiten que el tecnico llegue al punto con instrucciones, frecuencia, cantidad, metodo y evidencia esperada." },
        { title: "Alertas e inteligencia", text: "La plataforma identifica vencidos, riesgo de atraso, reincidencia, carga operativa y lectura ejecutiva para que la supervision atienda primero lo que mas impacta a la operacion." },
      ]}
    />
  );
}
