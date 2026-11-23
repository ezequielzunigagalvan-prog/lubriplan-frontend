// src/utils/analysis.js

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export const monthLabel = (ym) => {
  const [y, m] = String(ym || "").split("-").map(Number);
  return m ? `${MONTHS[m - 1]} ${String(y).slice(2)}` : ym;
};

export const fmtNum = (n, digits = 1) => {
  if (n == null || !Number.isFinite(Number(n))) return "—";
  return Number(n).toLocaleString("es-MX", { maximumFractionDigits: digits });
};

export const fmtPct = (n) => (n == null ? "—" : `${fmtNum(n, 1)}%`);

export const fmtMoney = (n) =>
  n == null || !Number.isFinite(Number(n))
    ? "—"
    : Number(n).toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });

export const fmtDay = (ymd) => {
  if (!ymd) return "—";
  const d = new Date(`${ymd}T12:00:00`);
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
};

export const fmtDateTime = (v) => {
  const d = new Date(v);
  if (!v || Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-MX", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
};

/**
 * Cambio contra el periodo anterior.
 * higherIsBetter define el color: subir cumplimiento es bueno; subir vencidas es malo.
 * kind "pts" para porcentajes (diferencia en puntos), "pct" para cantidades (variación %).
 */
export function delta(cur, prev, { higherIsBetter = true, kind = "pct" } = {}) {
  if (cur == null || prev == null) return null;
  const c = Number(cur);
  const p = Number(prev);
  if (!Number.isFinite(c) || !Number.isFinite(p)) return null;
  let value;
  if (kind === "pts") value = c - p;
  else if (p === 0) return c === 0 ? { text: "sin cambio", tone: "flat" } : null;
  else value = ((c - p) / Math.abs(p)) * 100;
  if (Math.abs(value) < 0.05) return { text: "sin cambio", tone: "flat" };
  const up = value > 0;
  const good = up === higherIsBetter;
  const text = `${up ? "▲" : "▼"} ${fmtNum(Math.abs(value), 1)}${kind === "pts" ? " pts" : "%"}`;
  return { text, tone: good ? "good" : "bad" };
}

export const PRESETS = [
  { key: "30", label: "30 días", days: 30 },
  { key: "90", label: "90 días", days: 90 },
  { key: "180", label: "6 meses", days: 180 },
  { key: "365", label: "12 meses", days: 365 },
  { key: "year", label: "Este año" },
];

export function presetParams(key, now = new Date()) {
  if (key === "year") {
    const y = now.getFullYear();
    const pad = (n) => String(n).padStart(2, "0");
    return { from: `${y}-01-01`, to: `${y}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` };
  }
  const p = PRESETS.find((x) => x.key === key);
  return { days: p?.days || 90 };
}

export const CATEGORY_LABEL = {
  FUGA: "Fuga",
  RUIDO: "Ruido",
  VIBRACION: "Vibración",
  TEMPERATURA: "Temperatura",
  CONTAMINACION: "Contaminación",
  OTRO: "Otro",
};

export const critText = (c) => {
  const k = String(c || "").toUpperCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  return { CRITICA: "Crítica", ALTA: "Alta", MEDIA: "Media", BAJA: "Baja" }[k] || "—";
};
