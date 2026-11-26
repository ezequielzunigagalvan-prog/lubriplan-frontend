// Utilidades de presentación para las Órdenes de Lubricación Preventiva (OLP).

export const ORDER_STATUS = {
  DRAFT: { label: "Borrador", cls: "is-draft", icon: "edit" },
  OPEN: { label: "Liberada", cls: "is-open", icon: "userCheck" },
  IN_PROGRESS: { label: "En proceso", cls: "is-progress", icon: "tool" },
  COMPLETED: { label: "Completada", cls: "is-done", icon: "checkCircle" },
  CANCELLED: { label: "Cancelada", cls: "is-cancel", icon: "xCircle" },
};

export const ITEM_STATUS = {
  PENDING: { label: "Pendiente", cls: "is-pending" },
  COMPLETED: { label: "Ejecutada", cls: "is-done" },
  SKIPPED: { label: "Omitida", cls: "is-skip" },
};

export const CONDITIONS = [
  { v: "BUENO", label: "Bueno", cls: "is-good" },
  { v: "REGULAR", label: "Regular", cls: "is-reg" },
  { v: "MALO", label: "Malo", cls: "is-bad" },
  { v: "CRITICO", label: "Crítico", cls: "is-crit" },
];

export const DUE_STATE = {
  OVERDUE: { label: "Vencida", cls: "is-red" },
  TODAY: { label: "Toca hoy", cls: "is-amber" },
  UPCOMING: { label: "Próxima", cls: "" },
  NONE: { label: "Sin fecha", cls: "" },
};

/** Fecha guardada (mediodía UTC) o "YYYY-MM-DD" → "YYYY-MM-DD". */
export function ymdOf(v) {
  if (!v) return "";
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

/** Día de calendario legible: 03 dic 2026. */
export function fmtDay(v, opts = {}) {
  const ymd = ymdOf(v);
  if (!ymd) return "—";
  const d = new Date(`${ymd}T12:00:00`);
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short", ...(opts.noYear ? {} : { year: "numeric" }) });
}

/** Fecha y hora local: 03 dic 2026, 10:42. */
export function fmtDateTime(v) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-MX", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function todayYmdLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Días entre hoy (local) y un día de calendario. */
export function daysFromToday(v) {
  const ymd = ymdOf(v);
  if (!ymd) return null;
  const a = new Date(`${todayYmdLocal()}T12:00:00`);
  const b = new Date(`${ymd}T12:00:00`);
  return Math.round((b - a) / 86400000);
}

export function qtyText(quantity, unit) {
  if (quantity == null || quantity === "") return "—";
  const n = Number(quantity);
  return `${Number.isFinite(n) ? Math.round(n * 100) / 100 : quantity} ${unit || ""}`.trim();
}

export function pct(done, total) {
  return total ? Math.round((done / total) * 100) : 0;
}

/** Imagen a JPEG comprimido (máx 1600 px) para la evidencia. */
export function compressImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("No se pudo preparar la imagen"));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo procesar la imagen"));
    };
    img.src = url;
  });
}
