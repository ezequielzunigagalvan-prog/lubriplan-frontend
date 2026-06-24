import React from "react";
import MarketingPageLayout from "../../components/seo/MarketingPageLayout";

export default function CartasDigitalesLubricacionPage() {
  return (
    <MarketingPageLayout
      eyebrow="Cartas digitales"
      title="Cartas digitales de lubricacion"
      intro="Las cartas digitales de lubricacion de LubriPlan concentran puntos, cantidades, frecuencias, metodos, imagenes y acceso rapido por QR para que el campo ejecute con mas consistencia."
      highlights={[
        "QR por equipo o punto",
        "Puntos de lubricacion visibles",
        "Frecuencia y cantidad por punto",
        "Menos dependencia de formatos impresos",
      ]}
      gallery={[
        { image: "/lubriplan-card-logo.jpeg", alt: "Identidad de LubriPlan Card", caption: "Soporte para cartas digitales y acceso rapido por QR en planta." },
      ]}
      sections={[
        { title: "Estandarizacion en campo", text: "La carta digital reduce variacion entre tecnicos al mostrar el criterio tecnico de lubricacion de forma clara, legible y disponible desde el dispositivo en planta." },
        { title: "Acceso rapido y trazable", text: "Con el apoyo de QR, el tecnico entra al equipo correcto, consulta instrucciones y registra la actividad sin depender de listas impresas ni consultas externas." },
        { title: "Mejor soporte a supervision", text: "La supervision puede revisar si el criterio tecnico esta completo, si la frecuencia es coherente y si los puntos criticos del equipo estan documentados." },
      ]}
    />
  );
}
