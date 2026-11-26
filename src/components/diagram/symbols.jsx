// src/components/diagram/symbols.jsx
// Símbolos de sistemas de lubricación automática (estilo ISO simplificado).
// Cada símbolo se dibuja con su esquina superior izquierda en (0,0) y tamaño w×h.

const INK = "#0f172a";
const ORANGE = "#f97316";
const BLUE = "#2563eb";
const FILL = "#ffffff";

export const SYSTEM_TYPES = {
  PROGRESSIVE: "Grasa · progresivo",
  OIL_METERING: "Aceite · con dosificadores",
  SINGLE_LINE: "Línea simple",
  DUAL_LINE: "Doble línea",
  OTHER: "Otro",
};

export const EDGE_KINDS = {
  MAIN: { label: "Línea principal", stroke: INK, width: 3.5, dash: "" },
  SECONDARY: { label: "Línea secundaria", stroke: "#334155", width: 2, dash: "" },
  RETURN: { label: "Retorno a depósito", stroke: BLUE, width: 2, dash: "8 5" },
  SIGNAL: { label: "Señal eléctrica", stroke: "#d97706", width: 1.5, dash: "10 4 2 4" },
};

const txt = (x, y, s, size = 11, weight = 800, anchor = "middle", fill = INK) => (
  <text x={x} y={y} fontSize={size} fontWeight={weight} textAnchor={anchor} fill={fill} fontFamily="Segoe UI, system-ui, sans-serif">
    {s}
  </text>
);

function wrap(text, max, lines) {
  const words = String(text).split(/s+/);
  const out = [""];
  for (const w of words) {
    const cur = out[out.length - 1];
    if ((cur + " " + w).trim().length > max && cur) out.push(w);
    else out[out.length - 1] = (cur + " " + w).trim();
  }
  if (out.length > lines) return [...out.slice(0, lines - 1), out[lines - 1].slice(0, max - 1) + "…"];
  return out;
}

const dividerHeight = (n) => 24 + Math.ceil(Math.max(2, n) / 2) * 20;
const manifoldWidth = (n) => 30 + Math.max(1, n) * 34;

export const SYMBOLS = {
  // ── Grasa / generales ────────────────────────────────────────────────────
  PUMP_GREASE: {
    label: "Bomba de grasa",
    group: "Grasa",
    size: () => ({ w: 90, h: 112 }),
    defaults: { label: "Bomba", capacity: "4 L" },
    draw: (n) => (
      <g>
        <rect x={10} y={2} width={70} height={52} rx={8} fill="#fff7ed" stroke={INK} strokeWidth={2} />
        <line x1={10} y1={20} x2={80} y2={20} stroke={ORANGE} strokeWidth={2} strokeDasharray="4 3" />
        {txt(45, 42, n.capacity || "Depósito", 10, 800, "middle", "#9a3412")}
        <line x1={45} y1={54} x2={45} y2={64} stroke={INK} strokeWidth={2} />
        <circle cx={45} cy={86} r={22} fill={FILL} stroke={INK} strokeWidth={2.2} />
        <path d="M45 70 L56 90 L34 90 Z" fill={INK} />
        <path d="M30 104 L22 110 M60 104 L68 110" stroke={INK} strokeWidth={2} />
      </g>
    ),
  },
  CONTROLLER: {
    label: "Controlador / temporizador",
    group: "Grasa",
    size: () => ({ w: 92, h: 56 }),
    defaults: { label: "Controlador", setting: "Pausa 30 min" },
    draw: (n) => (
      <g>
        <rect x={1} y={1} width={90} height={54} rx={8} fill="#0f172a" stroke={INK} strokeWidth={2} />
        <circle cx={20} cy={28} r={11} fill="none" stroke={ORANGE} strokeWidth={2} />
        <path d="M20 21 V28 L25 31" stroke={ORANGE} strokeWidth={2} fill="none" />
        {txt(58, 25, "CTRL", 11, 900, "middle", "#ffffff")}
        {txt(58, 41, n.setting || "", 8, 700, "middle", "#fdba74")}
      </g>
    ),
  },
  DIVIDER: {
    label: "Distribuidor progresivo",
    group: "Grasa",
    size: (n) => ({ w: 74, h: dividerHeight(Number(n.outlets) || 6) }),
    defaults: { label: "Distribuidor", outlets: 6 },
    draw: (n) => {
      const outlets = Math.max(2, Math.min(24, Number(n.outlets) || 6));
      const h = dividerHeight(outlets);
      const rows = Math.ceil(outlets / 2);
      const els = [];
      for (let i = 0; i < rows; i++) {
        const y = 22 + i * 20;
        els.push(<line key={`s${i}`} x1={12} y1={y - 8} x2={62} y2={y - 8} stroke="#94a3b8" strokeWidth={1} />);
        const left = i * 2 + 1;
        const right = i * 2 + 2;
        els.push(<line key={`l${i}`} x1={0} y1={y + 2} x2={12} y2={y + 2} stroke={INK} strokeWidth={2} />);
        els.push(<g key={`lt${i}`}>{txt(19, y + 6, String(left), 9, 900)}</g>);
        if (right <= outlets) {
          els.push(<line key={`r${i}`} x1={62} y1={y + 2} x2={74} y2={y + 2} stroke={INK} strokeWidth={2} />);
          els.push(<g key={`rt${i}`}>{txt(55, y + 6, String(right), 9, 900)}</g>);
        }
      }
      return (
        <g>
          <rect x={12} y={2} width={50} height={h - 4} rx={4} fill="#e2e8f0" stroke={INK} strokeWidth={2.2} />
          <line x1={37} y1={0} x2={37} y2={2} stroke={INK} strokeWidth={2} />
          {els}
        </g>
      );
    },
  },
  CYCLE_SWITCH: {
    label: "Interruptor de ciclo",
    group: "Grasa",
    size: () => ({ w: 44, h: 34 }),
    defaults: { label: "Control de ciclo" },
    draw: () => (
      <g>
        <rect x={2} y={8} width={40} height={24} rx={4} fill="#fffbeb" stroke={INK} strokeWidth={2} />
        <line x1={22} y1={8} x2={22} y2={0} stroke={INK} strokeWidth={2} />
        <path d="M10 26 L20 16 L24 22 L34 14" stroke="#d97706" strokeWidth={2} fill="none" />
      </g>
    ),
  },
  RELIEF: {
    label: "Válvula de alivio",
    group: "General",
    size: () => ({ w: 52, h: 52 }),
    defaults: { label: "Alivio", pressure: "300 bar" },
    draw: () => (
      <g>
        <rect x={6} y={6} width={40} height={40} fill={FILL} stroke={INK} strokeWidth={2} />
        <path d="M14 38 L38 14" stroke={INK} strokeWidth={2} />
        <path d="M38 14 L31 15 L37 21 Z" fill={INK} />
        <path d="M46 20 L50 23 L46 26 L50 29 L46 32" stroke={INK} strokeWidth={1.6} fill="none" />
      </g>
    ),
  },
  GAUGE: {
    label: "Manómetro",
    group: "General",
    size: () => ({ w: 46, h: 46 }),
    defaults: { label: "Manómetro", pressure: "0–400 bar" },
    draw: () => (
      <g>
        <circle cx={23} cy={23} r={20} fill={FILL} stroke={INK} strokeWidth={2} />
        <path d="M23 23 L34 12" stroke={ORANGE} strokeWidth={2.4} />
        <circle cx={23} cy={23} r={2.5} fill={INK} />
      </g>
    ),
  },
  FILTER: {
    label: "Filtro",
    group: "General",
    size: () => ({ w: 48, h: 48 }),
    defaults: { label: "Filtro", micron: "25 µm" },
    draw: () => (
      <g>
        <path d="M24 2 L46 24 L24 46 L2 24 Z" fill={FILL} stroke={INK} strokeWidth={2} />
        <line x1={24} y1={8} x2={24} y2={40} stroke={INK} strokeWidth={1.5} strokeDasharray="3 3" />
      </g>
    ),
  },
  POINT: {
    label: "Punto de lubricación",
    group: "General",
    size: () => ({ w: 36, h: 36 }),
    defaults: { label: "Punto" },
    draw: () => (
      <g>
        <circle cx={18} cy={18} r={16} fill={FILL} stroke={INK} strokeWidth={2} />
        <circle cx={18} cy={18} r={8} fill={ORANGE} stroke={INK} strokeWidth={1.5} />
        <path d="M18 0 V6 M18 30 V36 M0 18 H6 M30 18 H36" stroke={INK} strokeWidth={1.5} />
      </g>
    ),
  },
  // ── Aceite ───────────────────────────────────────────────────────────────
  TANK: {
    label: "Depósito de aceite",
    group: "Aceite",
    size: () => ({ w: 96, h: 62 }),
    defaults: { label: "Depósito", capacity: "20 L" },
    draw: (n) => (
      <g>
        <path d="M2 2 V60 H94 V2" fill="#eff6ff" stroke={INK} strokeWidth={2.2} />
        <line x1={2} y1={20} x2={94} y2={20} stroke={BLUE} strokeWidth={2} strokeDasharray="5 3" />
        {txt(48, 46, n.capacity || "", 11, 900, "middle", "#1e3a8a")}
      </g>
    ),
  },
  PUMP_OIL: {
    label: "Bomba de aceite",
    group: "Aceite",
    size: () => ({ w: 56, h: 56 }),
    defaults: { label: "Bomba", flow: "" },
    draw: () => (
      <g>
        <circle cx={28} cy={28} r={25} fill={FILL} stroke={INK} strokeWidth={2.2} />
        <path d="M28 8 L40 30 L16 30 Z" fill={BLUE} stroke={INK} strokeWidth={1} />
        <path d="M8 50 L2 55 M48 50 L54 55" stroke={INK} strokeWidth={2} />
      </g>
    ),
  },
  PRESSURE_SWITCH: {
    label: "Presostato",
    group: "Aceite",
    size: () => ({ w: 50, h: 44 }),
    defaults: { label: "Presostato", pressure: "" },
    draw: () => (
      <g>
        <rect x={2} y={2} width={46} height={40} rx={4} fill="#eff6ff" stroke={INK} strokeWidth={2} />
        {txt(16, 28, "P", 14, 900, "middle", BLUE)}
        <path d="M28 30 L40 14 M40 14 V30" stroke={INK} strokeWidth={1.8} fill="none" />
      </g>
    ),
  },
  MANIFOLD: {
    label: "Bloque / manifold",
    group: "Aceite",
    size: (n) => ({ w: manifoldWidth(Number(n.ports) || 4), h: 32 }),
    defaults: { label: "Bloque", ports: 4 },
    draw: (n) => {
      const ports = Math.max(1, Math.min(16, Number(n.ports) || 4));
      const w = manifoldWidth(ports);
      return (
        <g>
          <rect x={2} y={4} width={w - 4} height={24} rx={3} fill="#e2e8f0" stroke={INK} strokeWidth={2.2} />
          {Array.from({ length: ports }, (_, i) => (
            <g key={i}>
              <line x1={30 + i * 34} y1={28} x2={30 + i * 34} y2={34} stroke={INK} strokeWidth={2} />
              {txt(30 + i * 34, 21, String(i + 1), 9, 900)}
            </g>
          ))}
        </g>
      );
    },
  },
  METERING: {
    label: "Dosificador",
    group: "Aceite",
    size: () => ({ w: 48, h: 40 }),
    defaults: { label: "", volume: "0.10 cc" },
    draw: (n) => (
      <g>
        <rect x={4} y={2} width={40} height={26} rx={4} fill="#dbeafe" stroke={INK} strokeWidth={2} />
        {txt(24, 19, n.volume || "", 9, 900, "middle", "#1e3a8a")}
        <path d="M18 28 L24 38 L30 28 Z" fill={INK} />
      </g>
    ),
  },
  NOTE: {
    label: "Nota",
    group: "General",
    size: () => ({ w: 150, h: 54 }),
    defaults: { label: "Nota" },
    draw: (n) => (
      <g>
        <path d="M1 1 H138 L149 12 V53 H1 Z" fill="#fefce8" stroke="#ca8a04" strokeWidth={1.5} />
        {wrap(n.text || "Escribe la nota en propiedades", 26, 3).map((line, i) => (
          <g key={i}>{txt(8, 17 + i * 13, line, 10, 700, "start", "#713f12")}</g>
        ))}
      </g>
    ),
  },
};

export const PALETTE = [
  { group: "Grasa · progresivo", types: ["PUMP_GREASE", "CONTROLLER", "DIVIDER", "CYCLE_SWITCH"] },
  { group: "Aceite · dosificadores", types: ["TANK", "PUMP_OIL", "FILTER", "PRESSURE_SWITCH", "MANIFOLD", "METERING"] },
  { group: "General", types: ["POINT", "RELIEF", "GAUGE", "NOTE"] },
];

/** Propiedades editables por tipo (además de la etiqueta). */
export const PROPS = {
  PUMP_GREASE: [{ key: "capacity", label: "Depósito", placeholder: "4 L" }, { key: "model", label: "Marca / modelo" }],
  CONTROLLER: [{ key: "setting", label: "Ajuste", placeholder: "Pausa 30 min · trabajo 4 min" }],
  DIVIDER: [{ key: "outlets", label: "Salidas", type: "number", min: 2, max: 24, step: 1 }, { key: "model", label: "Modelo", placeholder: "SSV 6" }],
  CYCLE_SWITCH: [],
  RELIEF: [{ key: "pressure", label: "Presión de apertura", placeholder: "300 bar" }],
  GAUGE: [{ key: "pressure", label: "Rango", placeholder: "0–400 bar" }],
  FILTER: [{ key: "micron", label: "Filtración", placeholder: "25 µm" }],
  POINT: [{ key: "dose", label: "Dosis / ciclo", placeholder: "0.2 cc" }, { key: "lubricant", label: "Lubricante" }],
  TANK: [{ key: "capacity", label: "Capacidad", placeholder: "20 L" }, { key: "lubricant", label: "Aceite" }],
  PUMP_OIL: [{ key: "flow", label: "Caudal", placeholder: "0.5 L/min" }],
  PRESSURE_SWITCH: [{ key: "pressure", label: "Ajuste", placeholder: "8 bar" }],
  MANIFOLD: [{ key: "ports", label: "Puertos", type: "number", min: 1, max: 16, step: 1 }],
  METERING: [{ key: "volume", label: "Volumen", placeholder: "0.10 cc" }],
  NOTE: [{ key: "text", label: "Texto", type: "textarea" }],
};

export const sizeOf = (n) => (SYMBOLS[n.type]?.size(n) || { w: 40, h: 40 });

/** Texto bajo el símbolo (etiqueta + dato principal). */
export function captionOf(n) {
  const extra =
    n.type === "DIVIDER" ? `${n.outlets || 6} salidas${n.model ? ` · ${n.model}` : ""}`
      : n.type === "POINT" ? [n.dose, n.lubricant].filter(Boolean).join(" · ")
      : n.type === "RELIEF" || n.type === "GAUGE" || n.type === "PRESSURE_SWITCH" ? n.pressure
      : n.type === "FILTER" ? n.micron
      : n.type === "PUMP_OIL" ? n.flow
      : n.type === "TANK" ? n.lubricant
      : n.type === "PUMP_GREASE" ? n.model
      : "";
  return { title: n.type === "NOTE" ? "" : n.label || "", extra: extra || "" };
}
