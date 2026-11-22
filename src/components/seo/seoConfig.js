export const SITE_URL = "https://www.lubriplan.com";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/logo.png`;

export const DEFAULT_SEO = {
  title: "LubriPlan | Gestión de Lubricación Industrial",
  description:
    "Software especializado en gestión de lubricación industrial. Control de actividades, rutas, cartas digitales, alertas, inventario y análisis técnico.",
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
    title: "LubriPlan | Gestión de Lubricación Industrial",
    description:
      "Software especializado en gestión de lubricación industrial para control de actividades, rutas, cartas digitales, alertas, inventario y análisis técnico.",
  },
  "/login": {
    title: "Acceso a LubriPlan | Plataforma de lubricación industrial",
    description:
      "Ingresa a LubriPlan para administrar actividades, rutas, alertas, inventario y análisis técnico de lubricación industrial.",
  },
  "/card": {
    title: "LubriPlan Card | Cartas digitales de lubricación con QR",
    description:
      "Cartas digitales de lubricación con QR para equipos industriales, puntos de lubricación, frecuencias, imágenes y acceso técnico rápido.",
  },
  "/contacto": {
    title: "Contacto LubriPlan | Solicita una demo",
    description:
      "Solicita una demo de LubriPlan y conoce cómo ordenar la gestión de lubricación industrial con rutas, alertas, inventario e IA.",
  },
  "/que-es-lubriplan": {
    title: "Qué es LubriPlan | Plataforma para lubricación industrial",
    description:
      "Conoce qué es LubriPlan, para quién fue creado y cómo ayuda a controlar actividades, rutas, cartas digitales, alertas e inventario.",
  },
  "/software-lubricacion-industrial": {
    title: "Software de lubricación industrial | LubriPlan",
    description:
      "LubriPlan es un software de lubricación industrial para planear, ejecutar, registrar evidencia, controlar inventario y supervisar cumplimiento.",
  },
  "/cartas-digitales-lubricacion": {
    title: "Cartas digitales de lubricación | LubriPlan",
    description:
      "Cartas digitales de lubricación con QR, puntos visibles, frecuencias, cantidades y trazabilidad para campo y supervisión.",
  },
  "/rutas-de-lubricacion": {
    title: "Rutas de lubricación | LubriPlan",
    description:
      "Organiza rutas de lubricación por equipo, frecuencia, técnico y condición para evitar atraso operativo y pérdida de control.",
  },
  "/gestion-de-lubricantes": {
    title: "Gestión de lubricantes | LubriPlan",
    description:
      "Controla el inventario de lubricantes, consumo real, movimientos, niveles mínimos y riesgo de desabasto desde una sola plataforma.",
  },
  "/analisis-de-lubricacion": {
    title: "Análisis de lubricación | LubriPlan",
    description:
      "Analiza cumplimiento, condición, alertas y lectura ejecutiva de lubricación industrial con indicadores y apoyo de IA.",
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
        "Software especializado en gestión de lubricación industrial para control de actividades, rutas, cartas digitales, alertas, inventario y análisis técnico.",
      featureList: [
        "Gestión de actividades de lubricación",
        "Rutas de lubricación",
        "Cartas digitales de lubricación",
        "Alertas operativas",
        "Inventario de lubricantes",
        "Indicadores de mantenimiento",
        "Análisis asistido por IA",
        "Compatibilidad de grasas",
        "Cálculo de frecuencia de lubricación",
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "LubriPlan",
      url: `${SITE_URL}/`,
      logo: `${SITE_URL}/logo.png`,
      description: "Plataforma especializada en gestión de lubricación industrial.",
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "LubriPlan",
      url: `${SITE_URL}/`,
    },
  ];
}
