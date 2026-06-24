import React from "react";
import MarketingPageLayout from "../../components/seo/MarketingPageLayout";
import landingAlerts from "../../assets/landing-alerts.png";

export default function GestionDeLubricantesPage() {
  return (
    <MarketingPageLayout
      eyebrow="Inventario y consumo"
      title="Gestion de lubricantes"
      intro="LubriPlan conecta el inventario de lubricantes con el consumo real de la operacion para que el nivel de existencia deje de ser una cifra aislada y pase a ser una decision operativa."
      highlights={[
        "Consumo ligado a cada actividad",
        "Movimientos con trazabilidad",
        "Minimos operativos visibles",
        "Riesgo de desabasto con anticipacion",
      ]}
      gallery={[
        { image: landingAlerts, alt: "Alertas de inventario y riesgo operativo", caption: "El inventario forma parte del control operativo, no de un registro aislado." },
      ]}
      sections={[
        { title: "Consumo real por trabajo ejecutado", text: "Cada actividad puede registrar el lubricante utilizado y la cantidad real aplicada. Eso mejora el control de inventario y la lectura tecnica del programa." },
        { title: "Riesgo antes del desabasto", text: "Las alertas permiten detectar referencias por debajo del minimo, cobertura restringida y necesidad de reposicion antes de comprometer una ruta critica." },
        { title: "Mejor coordinacion con compras y almacen", text: "La supervision puede explicar que referencia esta presionada, en que equipo impacta y por que conviene reponer antes del siguiente frente operativo." },
      ]}
    />
  );
}
