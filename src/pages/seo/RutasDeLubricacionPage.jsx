import React from "react";
import MarketingPageLayout from "../../components/seo/MarketingPageLayout";
import landingDashboardCover from "../../assets/landing-dashboard-cover.png";

export default function RutasDeLubricacionPage() {
  return (
    <MarketingPageLayout
      eyebrow="Rutas y programacion"
      title="Rutas de lubricacion"
      intro="LubriPlan organiza las rutas de lubricacion por equipo, tecnico, frecuencia y prioridad para que la operacion se mantenga visible y no dependa de memoria ni seguimiento informal."
      highlights={[
        "Rutas automaticas y manuales",
        "Separacion entre lubricacion e inspeccion",
        "Prioridad por criticidad y atraso",
        "Control por responsable y fecha",
      ]}
      gallery={[
        { image: landingDashboardCover, alt: "Rutas de lubricacion en LubriPlan", caption: "Actividades y distribucion del mes conectadas a la planeacion de rutas." },
      ]}
      sections={[
        { title: "Orden operativo", text: "Las rutas estructuran frecuencia, metodo, cantidad, tecnico y condicion esperada para que el campo tenga una ruta clara y la supervision un backlog real." },
        { title: "Menos atraso y mejor foco", text: "Al separar lo atrasado, lo de hoy y lo proximo, LubriPlan facilita la atencion de activos criticos y evita que el retraso se acumule sin visibilidad." },
        { title: "Escala sin perder control", text: "Cuando la base de equipos crece, las rutas y actividades mantienen una estructura operativa que sigue siendo util para planta, supervision y direccion." },
      ]}
    />
  );
}
