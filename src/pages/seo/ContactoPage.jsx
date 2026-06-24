import React from "react";
import MarketingPageLayout from "../../components/seo/MarketingPageLayout";

export default function ContactoPage() {
  return (
    <MarketingPageLayout
      eyebrow="Contacto"
      title="Solicita una demo de LubriPlan"
      intro="Si buscas ordenar la lubricacion industrial con rutas, actividades, inventario y lectura ejecutiva, LubriPlan puede ayudarte a llevar el control operativo a un solo sistema."
      highlights={[
        "Demo enfocada en mantenimiento industrial",
        "Casos de uso para supervision y campo",
        "Revision de rutas, cartas y alertas",
        "Contacto directo con el equipo de LubriPlan",
      ]}
      sections={[
        { title: "Que puedes revisar en la demo", text: "Dashboard, actividades, cartas digitales, rutas de lubricacion, inventario, alertas, analisis e IA aplicada a la operacion de lubricacion." },
        { title: "Para quien conviene", text: "Jefes de mantenimiento, supervisores, responsables de confiabilidad y tecnicos que hoy dependen de Excel, papel o seguimiento informal." },
        { title: "Siguiente paso recomendado", text: "Solicita una demo en https://www.hidrolub.com/lubriplan o escribe a lubriplan@hidrolub.com para revisar tu operacion actual y el alcance tecnico que necesitas." },
      ]}
      ctaTitle="Agenda una conversacion tecnica"
      ctaText="Muestra a tu equipo como se verian sus rutas, actividades, inventario y alertas dentro de LubriPlan."
    />
  );
}
