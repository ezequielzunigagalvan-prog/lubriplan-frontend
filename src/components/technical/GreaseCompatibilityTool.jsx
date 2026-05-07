import { useMemo, useState } from "react";
import { greaseTypes, getCompatibility } from "../../data/greaseCompatibility";

const labels = {
  COMPATIBLE: {
    title: "Compatible",
    color: "#166534",
    bg: "#dcfce7",
    text: "La mezcla suele considerarse compatible como referencia general.",
    action: "Aun asi, valida con la ficha tecnica del fabricante en aplicaciones criticas.",
  },
  PARTIAL: {
    title: "Compatibilidad parcial",
    color: "#92400e",
    bg: "#fef3c7",
    text: "Puede existir riesgo de cambio de consistencia, separacion de aceite o reduccion de desempeno.",
    action: "Se recomienda purga gradual, monitoreo de temperatura y seguimiento visual.",
  },
  INCOMPATIBLE: {
    title: "No compatible",
    color: "#991b1b",
    bg: "#fee2e2",
    text: "No se recomienda mezclar estas grasas. Puede provocar endurecimiento, ablandamiento o perdida de lubricacion.",
    action: "Realiza limpieza o purga completa antes de cambiar de grasa.",
  },
  UNKNOWN: {
    title: "Sin referencia",
    color: "#334155",
    bg: "#f1f5f9",
    text: "No hay referencia suficiente para esta combinacion.",
    action: "Consulta al fabricante o realiza una prueba de compatibilidad.",
  },
};

export default function GreaseCompatibilityTool() {
  const [current, setCurrent] = useState("LITHIUM");
  const [next, setNext] = useState("LITHIUM_COMPLEX");

  const result = useMemo(() => getCompatibility(current, next), [current, next]);
  const info = labels[result] || labels.UNKNOWN;

  return (
    <div style={card}>
      <div style={header}>
        <div style={eyebrow}>COMPATIBILIDAD</div>
        <div style={title}>Compatibilidad de grasas</div>
        <div style={subtitle}>
          Referencia general entre espesantes. Util para cambios de grasa en rodamientos, guias y sistemas centralizados.
        </div>
      </div>

      <div style={grid}>
        <label style={label}>
          Grasa actual
          <select value={current} onChange={(e) => setCurrent(e.target.value)} style={input}>
            {greaseTypes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label style={label}>
          Nueva grasa
          <select value={next} onChange={(e) => setNext(e.target.value)} style={input}>
            {greaseTypes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div style={{ ...resultBox, background: info.bg, color: info.color }}>
        <div style={resultTitle}>{info.title}</div>
        <div style={resultText}>{info.text}</div>
        <div style={resultAction}>
          <b>Recomendacion:</b> {info.action}
        </div>
      </div>

      <div style={note}>
        Nota tecnica: esta tabla es una referencia general. La compatibilidad real puede variar por aceite base, aditivos,
        fabricante y condiciones de operacion.
      </div>
    </div>
  );
}

const card = {
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 22,
  padding: 18,
  background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
  boxShadow: "0 18px 34px rgba(15,23,42,0.08)",
};

const header = { marginBottom: 14 };
const eyebrow = { fontSize: 11, fontWeight: 950, color: "#64748b", letterSpacing: 1.2 };
const title = { fontSize: 21, fontWeight: 1000, color: "#0f172a", marginTop: 4 };
const subtitle = { fontSize: 13, fontWeight: 800, color: "#64748b", marginTop: 6, lineHeight: 1.45 };

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 12,
};

const label = {
  display: "grid",
  gap: 6,
  fontSize: 12,
  fontWeight: 950,
  color: "#475569",
};

const input = {
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 12,
  padding: "10px 12px",
  fontWeight: 900,
  color: "#0f172a",
  background: "#fff",
};

const resultBox = {
  marginTop: 14,
  borderRadius: 16,
  padding: 14,
  border: "1px solid rgba(0,0,0,0.08)",
};

const resultTitle = { fontSize: 18, fontWeight: 1000 };
const resultText = { marginTop: 8, fontSize: 13, fontWeight: 850, lineHeight: 1.45 };
const resultAction = { marginTop: 10, fontSize: 13, fontWeight: 850, lineHeight: 1.45 };

const note = {
  marginTop: 12,
  fontSize: 12,
  fontWeight: 800,
  color: "#64748b",
  lineHeight: 1.4,
};
