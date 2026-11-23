// src/utils/technicalCalc.js
// Cálculos del Asistente técnico. Funciones puras (sin React) para poder verificarlas.

const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
const num = (v) => {
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
};

/* ───────────── Reengrase de rodamientos ─────────────
 * Cantidad (SKF):            G [g] = 0.005 × D × B   (D = diámetro exterior mm, B = ancho mm)
 * Intervalo (Noria / Schlitz): T [h] = K × [ 14 000 000 / (n × √d) − 4 × d ]
 *   d = diámetro interior (mm), n = rpm, K = Ft × Fc × Fm × Fv × Fp × Fd
 */
export const REGREASE_FACTORS = {
  temperature: [
    { id: "t1", label: "Menos de 65 °C", f: 1 },
    { id: "t2", label: "65 a 80 °C", f: 0.5 },
    { id: "t3", label: "80 a 93 °C", f: 0.2 },
    { id: "t4", label: "Más de 93 °C", f: 0.1 },
  ],
  contamination: [
    { id: "c1", label: "Limpio o polvo ligero no abrasivo", f: 1 },
    { id: "c2", label: "Mucho polvo no abrasivo", f: 0.7 },
    { id: "c3", label: "Polvo abrasivo ligero", f: 0.4 },
    { id: "c4", label: "Polvo abrasivo abundante", f: 0.2 },
  ],
  moisture: [
    { id: "m1", label: "Humedad menor a 80 %", f: 1 },
    { id: "m2", label: "Humedad 80 a 90 %", f: 0.7 },
    { id: "m3", label: "Condensación ocasional", f: 0.4 },
    { id: "m4", label: "Agua presente / lavado", f: 0.1 },
  ],
  vibration: [
    { id: "v1", label: "Baja (menos de 5 mm/s)", f: 1 },
    { id: "v2", label: "Media (5 a 10 mm/s)", f: 0.6 },
    { id: "v3", label: "Alta (más de 10 mm/s)", f: 0.3 },
  ],
  position: [
    { id: "p1", label: "Eje horizontal", f: 1 },
    { id: "p2", label: "Eje a 45°", f: 0.5 },
    { id: "p3", label: "Eje vertical", f: 0.3 },
  ],
  design: [
    { id: "d1", label: "Bolas", f: 10 },
    { id: "d2", label: "Rodillos cilíndricos o agujas", f: 5 },
    { id: "d3", label: "Rodillos cónicos o esféricos", f: 1 },
  ],
};

const factor = (group, id) => REGREASE_FACTORS[group].find((x) => x.id === id)?.f ?? 1;

/** Frecuencias que maneja LubriPlan en rutas. */
export const ROUTE_FREQUENCIES = [
  { days: 1, label: "Diaria" },
  { days: 7, label: "Semanal" },
  { days: 15, label: "Quincenal" },
  { days: 30, label: "Mensual" },
  { days: 60, label: "Bimestral" },
  { days: 90, label: "Trimestral" },
  { days: 120, label: "Cuatrimestral" },
  { days: 180, label: "Semestral" },
  { days: 365, label: "Anual" },
];

/**
 * Frecuencia de ruta igual o menor al intervalo (nunca más larga de lo calculado).
 * Si la frecuencia con nombre queda muy por debajo (más de 25 %), propone "Cada N días".
 */
export function routeFrequencyFor(days) {
  if (!Number.isFinite(days) || days <= 0) return null;
  if (days >= 365) return ROUTE_FREQUENCIES[ROUTE_FREQUENCIES.length - 1];
  let pick = ROUTE_FREQUENCIES[0];
  for (const f of ROUTE_FREQUENCIES) if (f.days <= days) pick = f;
  if (days - pick.days > days * 0.25 && days >= 2) {
    const n = Math.floor(days);
    return { days: n, label: `Cada ${n} días` };
  }
  return pick;
}

export function bearingRegrease({ bore, outside, width, rpm, hoursPerDay = 24, factors = {} }) {
  const d = num(bore);
  const D = num(outside);
  const B = num(width);
  const n = num(rpm);
  const hpd = clamp(num(hoursPerDay) || 24, 1, 24);
  const errors = [];
  if (!(d > 0)) errors.push("Indica el diámetro interior.");
  if (!(D > 0)) errors.push("Indica el diámetro exterior.");
  if (!(B > 0)) errors.push("Indica el ancho.");
  if (!(n > 0)) errors.push("Indica las rpm.");
  if (d > 0 && D > 0 && D <= d) errors.push("El diámetro exterior debe ser mayor que el interior.");
  if (errors.length) return { ok: false, errors };

  const grams = 0.005 * D * B;
  const K =
    factor("temperature", factors.temperature) *
    factor("contamination", factors.contamination) *
    factor("moisture", factors.moisture) *
    factor("vibration", factors.vibration) *
    factor("position", factors.position) *
    factor("design", factors.design);
  const base = 14_000_000 / (n * Math.sqrt(d)) - 4 * d;
  const hours = K * base;
  const ndm = n * ((d + D) / 2); // factor de velocidad n·dm
  const warnings = [];
  if (base <= 0 || hours < 1) {
    warnings.push("Con esta velocidad y tamaño la fórmula no da un intervalo válido: el rodamiento probablemente requiere lubricación con aceite o reengrase continuo. Consulta al fabricante.");
  }
  if (ndm > 500_000) warnings.push(`Factor de velocidad n·dm = ${Math.round(ndm).toLocaleString("es-MX")}: muy alto para grasa estándar; valida con el fabricante.`);
  if (factor("temperature", factors.temperature) <= 0.2) warnings.push("Temperatura alta: usa grasa de alta temperatura y revisa la causa del calentamiento.");
  if (factor("moisture", factors.moisture) <= 0.4) warnings.push("Presencia de agua: prefiere grasa resistente al agua (p. ej. sulfonato de calcio o complejo de aluminio).");

  const validHours = hours >= 1 ? hours : null;
  const days = validHours ? validHours / hpd : null;
  if (days && days > 365) {
    warnings.push("El cálculo da más de un año. La grasa también envejece: no conviene pasar de 12 meses sin reengrasar.");
  }
  return {
    ok: true,
    grams: Math.round(grams * 10) / 10,
    hours: validHours ? Math.round(validHours) : null,
    days: days ? Math.round(days * 10) / 10 : null,
    K: Math.round(K * 1000) / 1000,
    ndm: Math.round(ndm),
    route: days ? routeFrequencyFor(days) : null,
    warnings,
  };
}

/* ───────────── Compatibilidad de grasas ─────────────
 * Tabla de compatibilidad de espesantes de uso común en la industria (NLGI / Machinery Lubrication).
 * C = compatible, B = en el límite, I = incompatible.
 */
export const GREASE_TYPES = [
  { id: "AL_X", label: "Complejo de aluminio" },
  { id: "BA", label: "Bario" },
  { id: "CA", label: "Calcio (convencional)" },
  { id: "CA_12", label: "Calcio 12-hidroxi" },
  { id: "CA_X", label: "Complejo de calcio" },
  { id: "CA_S", label: "Sulfonato de calcio" },
  { id: "CLAY", label: "Arcilla / bentonita" },
  { id: "LI", label: "Litio" },
  { id: "LI_12", label: "Litio 12-hidroxi" },
  { id: "LI_X", label: "Complejo de litio" },
  { id: "PU", label: "Poliurea" },
];

const ORDER = GREASE_TYPES.map((g) => g.id);
// Filas/columnas en el orden de GREASE_TYPES.
const MATRIX = [
  /* AL_X  */ ["C", "I", "I", "C", "I", "C", "I", "I", "I", "C", "I"],
  /* BA    */ ["I", "C", "I", "C", "I", "C", "I", "I", "I", "I", "I"],
  /* CA    */ ["I", "I", "C", "C", "I", "C", "C", "C", "B", "C", "I"],
  /* CA_12 */ ["C", "C", "C", "C", "B", "C", "C", "C", "C", "C", "I"],
  /* CA_X  */ ["I", "I", "I", "B", "C", "C", "I", "I", "I", "C", "C"],
  /* CA_S  */ ["C", "C", "C", "C", "C", "C", "I", "C", "C", "C", "C"],
  /* CLAY  */ ["I", "I", "C", "C", "I", "I", "C", "I", "I", "I", "I"],
  /* LI    */ ["I", "I", "C", "C", "I", "C", "I", "C", "C", "C", "I"],
  /* LI_12 */ ["I", "I", "B", "C", "I", "C", "I", "C", "C", "C", "I"],
  /* LI_X  */ ["C", "I", "C", "C", "C", "C", "I", "C", "C", "C", "I"],
  /* PU    */ ["I", "I", "I", "I", "C", "C", "I", "I", "I", "I", "C"],
];

export function greaseCompatibility(a, b) {
  const i = ORDER.indexOf(a);
  const j = ORDER.indexOf(b);
  if (i < 0 || j < 0) return "UNKNOWN";
  return { C: "COMPATIBLE", B: "BORDERLINE", I: "INCOMPATIBLE" }[MATRIX[i][j]];
}

/* ───────────── Viscosidad de reductores ─────────────
 * Base: velocidad de línea de paso del engrane de baja (criterio AGMA 9005 simplificado,
 * engranes cerrados helicoidales, rectos o cónicos, temperatura ambiente 10–35 °C).
 *   V [m/s] = π × d [mm] × n [rpm] / 60 000
 */
export const ISO_VG = [32, 46, 68, 100, 150, 220, 320, 460, 680, 1000];

export function pitchLineVelocity(diameterMm, rpm) {
  const d = num(diameterMm);
  const n = num(rpm);
  if (!(d > 0) || !(n > 0)) return null;
  return (Math.PI * d * n) / 60000;
}

export function gearboxViscosity({ gearType = "HELICAL", velocity = null, speedBand = "MEDIUM", ambient = "NORMAL", oilTemp, load = "NORMAL" }) {
  const steps = [];
  let idx;
  if (gearType === "WORM") {
    idx = ISO_VG.indexOf(460);
    steps.push("Sinfín-corona: se parte de ISO VG 460 (normalmente aceite compuesto o sintético PAG/PAO).");
  } else if (velocity != null) {
    const v = velocity;
    const base = v < 5 ? 320 : v < 15 ? 220 : v < 25 ? 150 : 100;
    idx = ISO_VG.indexOf(base);
    steps.push(`Velocidad de línea de paso ${v.toFixed(1)} m/s → ISO VG ${base}.`);
  } else {
    const base = speedBand === "SLOW" ? 320 : speedBand === "FAST" ? 150 : 220;
    idx = ISO_VG.indexOf(base);
    steps.push(`Velocidad ${speedBand === "SLOW" ? "baja" : speedBand === "FAST" ? "alta" : "media"} (estimada) → ISO VG ${base}.`);
  }
  if (ambient === "COLD") {
    idx -= 1;
    steps.push("Ambiente frío (menos de 10 °C): un grado menos.");
  } else if (ambient === "HOT") {
    idx += 1;
    steps.push("Ambiente caluroso (más de 35 °C): un grado más.");
  }
  const t = num(oilTemp);
  if (t > 80) {
    idx += 1;
    steps.push(`Aceite a ${t} °C: un grado más (y revisar la causa; arriba de 80 °C se acelera la oxidación).`);
  }
  if (load === "SHOCK") {
    idx += 1;
    steps.push("Cargas de impacto o arranques frecuentes: un grado más y aditivo EP.");
  }
  idx = clamp(idx, 0, ISO_VG.length - 1);
  return { vg: ISO_VG[idx], range: [ISO_VG[Math.max(0, idx - 1)], ISO_VG[Math.min(ISO_VG.length - 1, idx + 1)]], steps };
}

/* ───────────── Bombazos (pistola de grasa) ───────────── */
export function strokesFor({ grams, gramsPerStroke }) {
  const g = num(grams);
  const s = num(gramsPerStroke);
  if (!(g > 0) || !(s > 0)) return null;
  return { strokes: Math.ceil(g / s), exact: Math.round((g / s) * 10) / 10 };
}

export function gramsPerStrokeFromCalibration({ strokes, grams }) {
  const n = num(strokes);
  const g = num(grams);
  if (!(n > 0) || !(g > 0)) return null;
  return Math.round((g / n) * 100) / 100;
}

/* ───────────── Conversor ───────────── */
export const CONVERSIONS = {
  length: {
    label: "Longitud",
    units: { mm: ["mm", 1], cm: ["cm", 10], m: ["m", 1000], in: ["pulgadas", 25.4], ft: ["pies", 304.8] },
  },
  volume: {
    label: "Volumen",
    units: { ml: ["ml", 1], l: ["L", 1000], gal: ["galones US", 3785.411784], qt: ["cuartos US", 946.352946], oz: ["onzas líq. US", 29.5735295625] },
  },
  mass: {
    label: "Masa",
    units: { g: ["g", 1], kg: ["kg", 1000], lb: ["libras", 453.59237], oz: ["onzas", 28.349523125] },
  },
  pressure: {
    label: "Presión",
    units: { bar: ["bar", 1], psi: ["psi", 1 / 14.5037738], kpa: ["kPa", 0.01], mpa: ["MPa", 10] },
  },
  temperature: { label: "Temperatura", units: { c: ["°C"], f: ["°F"], k: ["K"] } },
  viscosity: {
    label: "Viscosidad cinemática",
    units: { cst: ["cSt (mm²/s)", 1], st: ["St", 100], m2s: ["m²/s", 1_000_000] },
  },
};

export function convert(category, value, from, to) {
  const v = num(value);
  if (!Number.isFinite(v)) return null;
  if (category === "temperature") {
    const c = from === "c" ? v : from === "f" ? ((v - 32) * 5) / 9 : v - 273.15;
    return to === "c" ? c : to === "f" ? (c * 9) / 5 + 32 : c + 273.15;
  }
  const units = CONVERSIONS[category]?.units;
  if (!units?.[from] || !units?.[to]) return null;
  return (v * units[from][1]) / units[to][1];
}

/* ───────────── Guía de condición ───────────── */
/** Sugiere la condición (misma escala que al completar una actividad) a partir de lo observado. */
export function suggestCondition(signs) {
  const s = new Set(signs || []);
  const critical = ["smoke", "seized", "noLube", "hotTouch", "metal"].filter((k) => s.has(k));
  const bad = ["noise", "leak", "water", "darkOil", "hardGrease", "vibration"].filter((k) => s.has(k));
  const regular = ["dirty", "lowLevel", "oldGrease", "looseGuard"].filter((k) => s.has(k));
  if (critical.length) return "CRITICO";
  if (bad.length >= 2) return "CRITICO";
  if (bad.length) return "MALO";
  if (regular.length) return "REGULAR";
  return "BUENO";
}

export const CONDITION_SIGNS = [
  { id: "smoke", label: "Humo u olor a quemado", level: "CRITICO" },
  { id: "seized", label: "Se traba o no gira libre", level: "CRITICO" },
  { id: "noLube", label: "Punto seco, sin lubricante", level: "CRITICO" },
  { id: "hotTouch", label: "No se puede tocar por calor", level: "CRITICO" },
  { id: "metal", label: "Partículas metálicas visibles", level: "CRITICO" },
  { id: "noise", label: "Ruido anormal", level: "MALO" },
  { id: "vibration", label: "Vibración notoria", level: "MALO" },
  { id: "leak", label: "Fuga de aceite o grasa", level: "MALO" },
  { id: "water", label: "Agua o aceite lechoso", level: "MALO" },
  { id: "darkOil", label: "Aceite oscuro u oxidado", level: "MALO" },
  { id: "hardGrease", label: "Grasa endurecida o separada", level: "MALO" },
  { id: "dirty", label: "Punto sucio o grasera tapada", level: "REGULAR" },
  { id: "lowLevel", label: "Nivel de aceite bajo", level: "REGULAR" },
  { id: "oldGrease", label: "Grasa vieja purgando", level: "REGULAR" },
  { id: "looseGuard", label: "Guarda o tapón flojo", level: "REGULAR" },
];

/* ───────────── Rodamientos comunes (d × D × B en mm) ───────────── */
export const BEARINGS = [
  ["6201", 12, 32, 10, "d1"], ["6202", 15, 35, 11, "d1"], ["6203", 17, 40, 12, "d1"], ["6204", 20, 47, 14, "d1"],
  ["6205", 25, 52, 15, "d1"], ["6206", 30, 62, 16, "d1"], ["6207", 35, 72, 17, "d1"], ["6208", 40, 80, 18, "d1"],
  ["6209", 45, 85, 19, "d1"], ["6210", 50, 90, 20, "d1"], ["6212", 60, 110, 22, "d1"], ["6215", 75, 130, 25, "d1"],
  ["6305", 25, 62, 17, "d1"], ["6306", 30, 72, 19, "d1"], ["6307", 35, 80, 21, "d1"], ["6308", 40, 90, 23, "d1"],
  ["6309", 45, 100, 25, "d1"], ["6310", 50, 110, 27, "d1"], ["6312", 60, 130, 31, "d1"], ["6315", 75, 160, 37, "d1"],
  ["NU210", 50, 90, 20, "d2"], ["NU212", 60, 110, 22, "d2"], ["NU310", 50, 110, 27, "d2"],
  ["30210", 50, 90, 21.75, "d3"], ["30310", 50, 110, 29.25, "d3"],
  ["22210", 50, 90, 23, "d3"], ["22212", 60, 110, 28, "d3"], ["22216", 80, 140, 33, "d3"],
  ["22220", 100, 180, 46, "d3"], ["22310", 50, 110, 40, "d3"], ["22316", 80, 170, 58, "d3"],
].map(([code, d, D, B, design]) => ({ code, d, D, B, design }));

/* ───────────── Frecuencia sugerida (puntos que no son rodamientos) ─────────────
 * Referencia de planeación: intervalo base por tipo de punto ajustado por condiciones.
 * Para rodamientos usa el cálculo de reengrase, que considera tamaño y velocidad.
 */
export const POINT_TYPES = [
  { id: "chain", label: "Cadena", base: 7 },
  { id: "guide", label: "Guía o carro lineal", base: 15 },
  { id: "gear_open", label: "Engrane abierto", base: 7 },
  { id: "gearbox", label: "Reductor (revisión de nivel)", base: 30 },
  { id: "hydraulic", label: "Hidráulico (revisión de nivel)", base: 30 },
  { id: "bushing", label: "Buje o articulación", base: 15 },
  { id: "coupling", label: "Cople engrasable", base: 90 },
];

export const POINT_CONDITIONS = {
  environment: [
    { id: "clean", label: "Limpio", f: 1.25 },
    { id: "normal", label: "Normal", f: 1 },
    { id: "dust", label: "Polvo", f: 0.7 },
    { id: "water", label: "Agua o lavado", f: 0.6 },
  ],
  load: [
    { id: "light", label: "Ligera", f: 1.2 },
    { id: "normal", label: "Normal", f: 1 },
    { id: "heavy", label: "Alta", f: 0.75 },
    { id: "shock", label: "Impacto", f: 0.6 },
  ],
  temperature: [
    { id: "normal", label: "Menos de 70 °C", f: 1 },
    { id: "high", label: "70 a 90 °C", f: 0.7 },
    { id: "very_high", label: "Más de 90 °C", f: 0.5 },
  ],
  shifts: [
    { id: "1", label: "1 turno", f: 1.5 },
    { id: "2", label: "2 turnos", f: 1 },
    { id: "3", label: "3 turnos / continuo", f: 0.75 },
  ],
};

export function pointFrequency({ type, environment = "normal", load = "normal", temperature = "normal", shifts = "2" }) {
  const pt = POINT_TYPES.find((x) => x.id === type);
  if (!pt) return null;
  const f = (g, id) => POINT_CONDITIONS[g].find((x) => x.id === id)?.f ?? 1;
  const days = pt.base * f("environment", environment) * f("load", load) * f("temperature", temperature) * f("shifts", shifts);
  return { days: Math.round(days * 10) / 10, route: routeFrequencyFor(days), base: pt.base };
}
