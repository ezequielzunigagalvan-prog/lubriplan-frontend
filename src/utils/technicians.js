// src/utils/technicians.js

// Valores antiguos guardados en inglés o mayúsculas.
const SPECIALTY_LABELS = {
  MECHANIC: "Mecánico",
  ELECTRIC: "Eléctrico",
  ELECTRICIAN: "Eléctrico",
  LUBRICATION: "Lubricación",
  "LUBRICACIÓN": "Lubricación",
  LUBRICACION: "Lubricación",
};

export function prettySpecialty(value) {
  const v = String(value || "").trim();
  return SPECIALTY_LABELS[v.toUpperCase()] || v;
}
