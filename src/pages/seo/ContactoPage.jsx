import React from "react";
import MarketingPageLayout from "../../components/seo/MarketingPageLayout";

export default function ContactoPage() {
  return (
    <MarketingPageLayout
      eyebrow="Contacto"
      title="Solicita una demo de LubriPlan"
      intro="Si buscas ordenar la lubricación industrial con rutas, actividades, inventario y lectura ejecutiva, LubriPlan puede ayudarte a llevar el control operativo a un solo sistema."
      highlights={[
        "Demo enfocada en mantenimiento industrial",
        "Casos de uso para supervisión y campo",
        "Revisión de rutas, cartas y alertas",
        "Contacto directo con el equipo de LubriPlan",
      ]}
      sections={[
        { title: "Qué puedes revisar en la demo", text: "Panel de control, actividades, cartas digitales, rutas de lubricación, inventario, alertas, análisis e IA aplicada a la operación de lubricación." },
        { title: "Para quién conviene", text: "Jefes de mantenimiento, supervisores, responsables de confiabilidad y técnicos que hoy dependen de Excel, papel o seguimiento informal." },
        { title: "Siguiente paso recomendado", text: "Presiona «Solicitar demo», déjanos tus datos y te contactamos para revisar tu operación actual y el alcance técnico que necesitas." },
      ]}
      ctaTitle="Agenda una conversación técnica"
      ctaText="Muestra a tu equipo cómo se verían sus rutas, actividades, inventario y alertas dentro de LubriPlan."
    />
  );
}
