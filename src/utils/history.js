// src/utils/history.js

export const toYMD = (d) => {
  const dt = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
};

/** Rangos rápidos de fecha (en hora local del navegador). */
export function presetRange(key, now = new Date()) {
  const y = now.getFullYear();
  const m = now.getMonth();
  const today = toYMD(now);
  switch (key) {
    case "today":
      return { from: today, to: today };
    case "7d": {
      const a = new Date(now);
      a.setDate(a.getDate() - 6);
      return { from: toYMD(a), to: today };
    }
    case "30d": {
      const a = new Date(now);
      a.setDate(a.getDate() - 29);
      return { from: toYMD(a), to: today };
    }
    case "month":
      return { from: toYMD(new Date(y, m, 1)), to: toYMD(new Date(y, m + 1, 0)) };
    case "prev":
      return { from: toYMD(new Date(y, m - 1, 1)), to: toYMD(new Date(y, m, 0)) };
    case "year":
      return { from: toYMD(new Date(y, 0, 1)), to: today };
    default:
      return null;
  }
}

export function monthRange(ym) {
  const r = /^(\d{4})-(\d{2})$/.exec(String(ym || ""));
  if (!r) return null;
  const y = Number(r[1]);
  const mo = Number(r[2]) - 1;
  if (mo < 0 || mo > 11) return null;
  return { from: toYMD(new Date(y, mo, 1)), to: toYMD(new Date(y, mo + 1, 0)) };
}

const CONDITION = {
  BUENO: { label: "Buena", cls: "c-baja" },
  REGULAR: { label: "Regular", cls: "c-media" },
  MALO: { label: "Mala", cls: "c-alta" },
  CRITICO: { label: "Crítica", cls: "c-critica" },
};
export const conditionInfo = (c) => CONDITION[String(c || "").toUpperCase()] || { label: "Sin condición", cls: "c-none" };

export const KIND_LABEL = {
  ROUTE: "Ruta de lubricación",
  INSPECTION: "Inspección",
  EMERGENCY: "Emergencia",
  OLP: "Orden preventiva",
  MANUAL: "Actividad manual",
  DELETED_ROUTE: "Ruta eliminada",
};

export const MOVE = {
  IN: { label: "Entrada", sign: "+", cls: "k-in" },
  OUT: { label: "Salida", sign: "−", cls: "k-out" },
  ADJUST: { label: "Ajuste", sign: "±", cls: "k-adj" },
};
export const moveInfo = (t) => {
  const v = String(t || "").toUpperCase();
  const key = v === "ENTRADA" ? "IN" : v === "SALIDA" ? "OUT" : v === "AJUSTE" ? "ADJUST" : v;
  return MOVE[key] || { label: v || "—", sign: "·", cls: "k-adj" };
};

export const fmtQty = (n) => {
  const v = Number(n);
  if (n == null || !Number.isFinite(v)) return "—";
  return Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/\.?0+$/, "");
};

export function fmtDateTime(v, withTime = true) {
  const d = new Date(v);
  if (!v || Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

export function rangeLabel(from, to) {
  const f = (s) => (s ? fmtDateTime(`${s}T12:00:00`, false) : "");
  if (from && to) return from === to ? f(from) : `${f(from)} – ${f(to)}`;
  if (from) return `Desde ${f(from)}`;
  if (to) return `Hasta ${f(to)}`;
  return "Todo el historial";
}

/** Texto de cumplimiento de una actividad (ejecutada vs programada). */
export function delayInfo(days) {
  if (days == null) return null;
  if (days <= 0) return { label: days < 0 ? "Adelantada" : "A tiempo", cls: "is-ok" };
  return { label: `${days} día${days === 1 ? "" : "s"} de retraso`, cls: "is-late" };
}
