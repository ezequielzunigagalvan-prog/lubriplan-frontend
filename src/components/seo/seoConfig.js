export const SITE_URL = "https://www.lubriplan.com";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/logo.png`;

export const DEFAULT_SEO = {
  title: "LubriPlan | Gestion de Lubricacion Industrial",
  description:
    "Software especializado en gestion de lubricacion industrial. Control de actividades, rutas, cartas digitales, alertas, inventario y analisis tecnico.",
  keywords: [
    "lubricacion industrial",
    "software lubricacion",
    "gestion de lubricacion",
    "mantenimiento industrial",
    "rutas de lubricacion",
    "cartas de lubricacion",
    "confiabilidad industrial",
    "lubricantes industriales",
  ],
};

export const PUBLIC_ROUTE_SEO = {
  "/": {
    title: "LubriPlan | Gestion de Lubricacion Industrial",
    description:
      "Software especializado en gestion de lubricacion industrial para control de actividades, rutas, cartas digitales, alertas, inventario y analisis tecnico.",
  },
  "/login": {
    title: "Acceso a LubriPlan | Plataforma de lubricacion industrial",
    description:
      "Ingresa a LubriPlan para administrar actividades, rutas, alertas, inventario y analisis tecnico de lubricacion industrial.",
  },
  "/card": {
    title: "LubriPlan Card | Cartas digitales de lubricacion con QR",
    description:
      "Cartas digitales de lubricacion con QR para equipos industriales, puntos de lubricacion, frecuencias, imagenes y acceso tecnico rapido.",
  },
  "/contacto": {
    title: "Contacto LubriPlan | Solicita una demo",
    description:
      "Solicita una demo de LubriPlan y conoce como ordenar la gestion de lubricacion industrial con rutas, alertas, inventario e IA.",
  },
  "/que-es-lubriplan": {
    title: "Que es LubriPlan | Plataforma para lubricacion industrial",
    description:
      "Conoce que es LubriPlan, para quien fue creado y como ayuda a controlar actividades, rutas, cartas digitales, alertas e inventario.",
  },
  "/software-lubricacion-industrial": {
    title: "Software de lubricacion industrial | LubriPlan",
    description:
      "LubriPlan es un software de lubricacion industrial para planear, ejecutar, registrar evidencia, controlar inventario y supervisar cumplimiento.",
  },
  "/cartas-digitales-lubricacion": {
    title: "Cartas digitales de lubricacion | LubriPlan",
    description:
      "Cartas digitales de lubricacion con QR, puntos visibles, frecuencias, cantidades y trazabilidad para campo y supervision.",
  },
  "/rutas-de-lubricacion": {
    title: "Rutas de lubricacion | LubriPlan",
    description:
      "Organiza rutas de lubricacion por equipo, frecuencia, tecnico y condicion para evitar atraso operativo y perdida de control.",
  },
  "/gestion-de-lubricantes": {
    title: "Gestion de lubricantes | LubriPlan",
    description:
      "Controla inventario de lubricantes, consumo real, movimientos, niveles minimos y riesgo de desabasto desde una sola plataforma.",
  },
  "/analisis-de-lubricacion": {
    title: "Analisis de lubricacion | LubriPlan",
    description:
      "Analiza cumplimiento, condicion, alertas y lectura ejecutiva de lubricacion industrial con indicadores y apoyo de IA.",
  },
};

export function buildCanonical(pathname = "/") {
  const cleanPath = pathname === "/" ? "" : pathname;
  return `${SITE_URL}${cleanPath}`;
}

export function buildCoreSchemas() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "LubriPlan",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web Browser",
      url: `${SITE_URL}/`,
      description:
        "Software especializado en gestion de lubricacion industrial para control de actividades, rutas, cartas digitales, alertas, inventario y analisis tecnico.",
      featureList: [
        "Gestion de actividades de lubricacion",
        "Rutas de lubricacion",
        "Cartas digitales de lubricacion",
        "Alertas operativas",
        "Inventario de lubricantes",
        "Indicadores de mantenimiento",
        "Analisis asistido por IA",
        "Compatibilidad de grasas",
        "Calculo de frecuencia de lubricacion",
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "LubriPlan",
      url: `${SITE_URL}/`,
      logo: `${SITE_URL}/logo.png`,
      description: "Plataforma especializada en gestion de lubricacion industrial.",
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "LubriPlan",
      url: `${SITE_URL}/`,
    },
  ];
}
