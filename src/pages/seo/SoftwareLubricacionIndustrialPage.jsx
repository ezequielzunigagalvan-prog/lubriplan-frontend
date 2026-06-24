import React from "react";
import MarketingPageLayout from "../../components/seo/MarketingPageLayout";
import landingDashboardCover from "../../assets/landing-dashboard-cover.png";

export default function SoftwareLubricacionIndustrialPage() {
  return (
    <MarketingPageLayout
      eyebrow="Software industrial"
      title="Software de lubricacion industrial"
      intro="LubriPlan ayuda a estructurar la gestion de lubricacion industrial con control sobre rutas, actividades, backlog, evidencia, consumo e indicadores de mantenimiento."
      highlights={[
        "Cumplimiento visible por rol",
        "Backlog controlado por prioridad",
        "Evidencia y condicion en campo",
        "Indicadores operativos listos para supervision",
      ]}
      gallery={[
        { image: landingDashboardCover, alt: "Software de lubricacion industrial LubriPlan", caption: "Vista de control para mantenimiento y supervision." },
      ]}
      sections={[
        { title: "Planeacion estructurada", text: "Define equipos, rutas, frecuencias, tecnicos, cantidades y metodo para pasar de un control informal a una operacion repetible y defendible." },
        { title: "Operacion trazable", text: "Cada actividad registra fecha, tecnico, consumo, evidencia y condicion. Eso permite saber que se hizo, donde, con que lubricante y bajo que contexto operativo." },
        { title: "Control ejecutivo", text: "Los tableros muestran vencidos, pendientes, cumplimiento, alertas y lectura ejecutiva para priorizar sin revisar decenas de registros manuales." },
      ]}
    />
  );
}
