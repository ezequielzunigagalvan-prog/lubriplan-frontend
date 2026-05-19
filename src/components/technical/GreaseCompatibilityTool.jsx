import { useMemo, useState } from "react";
import { Icon } from "../ui/lpIcons";
import { greaseTypes, getCompatibility } from "../../data/greaseCompatibility";

const ACCENT = "#7c3aed";

const labels = {
  COMPATIBLE: {
    title: "Compatible",
    color: "#166534",
    bg: "linear-gradient(135deg, rgba(220,252,231,0.75) 0%, rgba(255,255,255,0.97) 100%)",
    border: "rgba(34,197,94,0.30)",
    accent: "#16a34a",
    icon: "checkCircle",
    text: "La mezcla suele considerarse compatible como referencia general.",
    action: "Aun así, valida con la ficha técnica del fabricante en aplicaciones críticas.",
  },
  PARTIAL: {
    title: "Compatibilidad parcial",
    color: "#92400e",
    bg: "linear-gradient(135deg, rgba(254,243,199,0.75) 0%, rgba(255,255,255,0.97) 100%)",
    border: "rgba(245,158,11,0.30)",
    accent: "#d97706",
    icon: "warn",
    text: "Puede existir riesgo de cambio de consistencia, separación de aceite o reducción de desempeño.",
    action: "Se recomienda purga gradual, monitoreo de temperatura y seguimiento visual.",
  },
  INCOMPATIBLE: {
    title: "No compatible",
    color: "#991b1b",
    bg: "linear-gradient(135deg, rgba(254,226,226,0.75) 0%, rgba(255,255,255,0.97) 100%)",
    border: "rgba(239,68,68,0.30)",
    accent: "#dc2626",
    icon: "xCircle",
    text: "No se recomienda mezclar estas grasas. Puede provocar endurecimiento, ablandamiento o pérdida de lubricación.",
    action: "Realiza limpieza o purga completa antes de cambiar de grasa.",
  },
  UNKNOWN: {
    title: "Sin referencia",
    color: "#334155",
    bg: "linear-gradient(135deg, rgba(241,245,249,0.75) 0%, rgba(255,255,255,0.97) 100%)",
    border: "rgba(100,116,139,0.22)",
    accent: "#64748b",
    icon: "info",
    text: "No hay referencia suficiente para esta combinación.",
    action: "Consulta al fabricante o realiza una prueba de compatibilidad.",
  },
};

export default function GreaseCompatibilityTool() {
  const [current, setCurrent] = useState("LITHIUM");
  const [next, setNext] = useState("LITHIUM_COMPLEX");

  const result = useMemo(() => getCompatibility(current, next), [current, next]);
  const info = labels[result] || labels.UNKNOWN;

  return (
    <div className="lpCard" style={card}>
      <div style={header}>
        <div style={{ ...iconBox, background: `${ACCENT}18`, border: `1px solid ${ACCENT}30`, color: ACCENT }}>
          <Icon name="drop" size="md" />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={eyebrow}>COMPATIBILIDAD</div>
          <div style={title}>Compatibilidad de grasas</div>
        </div>
      </div>

      <div style={subtitle}>
        Referencia general entre espesantes. Útil para cambios de grasa en rodamientos, guías y sistemas centralizados.
      </div>

      <div style={formGrid}>
        <label style={label}>
          Grasa actual
          <select className="lp-select" value={current} onChange={(e) => setCurrent(e.target.value)} style={input}>
            {greaseTypes.map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </select>
        </label>

        <label style={label}>
          Nueva grasa
          <select className="lp-select" value={next} onChange={(e) => setNext(e.target.value)} style={input}>
            {greaseTypes.map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </select>
        </label>
      </div>

      <div
        style={{
          ...resultBox,
          background: info.bg,
          borderRight: `1px solid ${info.border}`,
          borderBottom: `1px solid ${info.border}`,
          borderTop: `1px solid ${info.border}`,
          borderLeft: `5px solid ${info.accent}`,
        }}
      >
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <span style={{ color: info.accent, flexShrink: 0, marginTop: 1 }}>
            <Icon name={info.icon} size="lg" />
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={{ ...resultTitle, color: info.color }}>{info.title}</div>
            <div style={{ ...resultText, color: info.color }}>{info.text}</div>
            <div
              style={{
                ...resultAction,
                background: `${info.accent}14`,
                border: `1px solid ${info.accent}28`,
                color: info.color,
              }}
            >
              <b>Recomendación:</b> {info.action}
            </div>
          </div>
        </div>
      </div>

      <div style={note}>
        Nota técnica: esta tabla es una referencia general. La compatibilidad real puede variar por aceite base, aditivos,
        fabricante y condiciones de operación.
      </div>
    </div>
  );
}

const card = {
  borderRadius: 22,
  borderTop: `4px solid ${ACCENT}`,
  borderRight: "1px solid rgba(226,232,240,0.95)",
  borderBottom: "1px solid rgba(226,232,240,0.95)",
  borderLeft: "1px solid rgba(226,232,240,0.95)",
  padding: "18px 18px 16px",
  background: `linear-gradient(160deg, ${ACCENT}07 0%, rgba(248,250,252,0.97) 100%)`,
  boxShadow: "0 18px 34px rgba(15,23,42,0.08)",
  display: "grid",
  gap: 14,
};

const header = { display: "flex", gap: 12, alignItems: "flex-start" };
const iconBox = {
  width: 42,
  height: 42,
  borderRadius: 13,
  display: "grid",
  placeItems: "center",
  flexShrink: 0,
};
const eyebrow = {
  fontSize: 10,
  fontWeight: 950,
  color: ACCENT,
  letterSpacing: 1.4,
  textTransform: "uppercase",
};
const title = { fontSize: 18, fontWeight: 900, color: "#0f172a", marginTop: 3 };
const subtitle = { fontSize: 13, fontWeight: 800, color: "#64748b", lineHeight: 1.45 };

const formGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 12,
};

const label = {
  display: "grid",
  gap: 6,
  fontSize: 11,
  fontWeight: 950,
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: 0.5,
};

const input = {
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 12,
  padding: "10px 12px",
  fontWeight: 900,
  color: "#0f172a",
  background: "#fff",
  width: "100%",
};

const resultBox = {
  borderRadius: 16,
  padding: "14px 16px",
};

const resultTitle = { fontSize: 17, fontWeight: 900, lineHeight: 1.2 };
const resultText = { marginTop: 6, fontSize: 13, fontWeight: 850, lineHeight: 1.45 };
const resultAction = {
  marginTop: 10,
  fontSize: 13,
  fontWeight: 850,
  lineHeight: 1.45,
  borderRadius: 10,
  padding: "8px 12px",
};

const note = {
  fontSize: 11,
  fontWeight: 800,
  color: "#94a3b8",
  lineHeight: 1.4,
  borderTop: "1px solid rgba(226,232,240,0.7)",
  paddingTop: 12,
};
