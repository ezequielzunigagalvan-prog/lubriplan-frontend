import { useMemo, useState } from "react";
import { Icon } from "../ui/lpIcons";

const ACCENT = "#16a34a";

const equipmentTypes = [
  { id: "bearing", label: "Rodamiento / chumacera" },
  { id: "chain", label: "Cadena" },
  { id: "guide", label: "Guía / carro lineal" },
  { id: "gearbox", label: "Reductor / engranes" },
  { id: "hydraulic", label: "Sistema hidráulico" },
  { id: "general", label: "Punto general" },
];

const criticalities = [
  { id: "low", label: "Baja" },
  { id: "medium", label: "Media" },
  { id: "high", label: "Alta" },
  { id: "critical", label: "Crítica" },
];

const environments = [
  { id: "clean", label: "Limpio" },
  { id: "normal", label: "Normal industrial" },
  { id: "dust", label: "Polvo / contaminación" },
  { id: "water", label: "Humedad / lavado" },
  { id: "severe", label: "Severo" },
];

const loads = [
  { id: "light", label: "Ligera" },
  { id: "normal", label: "Normal" },
  { id: "heavy", label: "Alta" },
  { id: "shock", label: "Impacto / vibración" },
];

const temperatures = [
  { id: "low", label: "Baja < 40 °C" },
  { id: "normal", label: "Normal 40–70 °C" },
  { id: "high", label: "Alta 70–90 °C" },
  { id: "very_high", label: "Muy alta > 90 °C" },
];

function baseDaysByType(type) {
  const map = { bearing: 30, chain: 7, guide: 14, gearbox: 90, hydraulic: 60, general: 30 };
  return map[type] || 30;
}

function multiplierByCriticality(v) {
  const map = { low: 1.3, medium: 1, high: 0.7, critical: 0.5 };
  return map[v] || 1;
}

function multiplierByEnvironment(v) {
  const map = { clean: 1.25, normal: 1, dust: 0.75, water: 0.65, severe: 0.5 };
  return map[v] || 1;
}

function multiplierByLoad(v) {
  const map = { light: 1.2, normal: 1, heavy: 0.75, shock: 0.6 };
  return map[v] || 1;
}

function multiplierByTemperature(v) {
  const map = { low: 1.15, normal: 1, high: 0.7, very_high: 0.5 };
  return map[v] || 1;
}

function multiplierByHours(hours) {
  const h = Number(hours || 0);
  if (h <= 8) return 1.15;
  if (h <= 16) return 1;
  if (h <= 24) return 0.75;
  return 1;
}

function roundFrequencyDays(days) {
  if (days <= 1) return 1;
  if (days <= 3) return 3;
  if (days <= 7) return 7;
  if (days <= 14) return 14;
  if (days <= 30) return 30;
  if (days <= 60) return 60;
  if (days <= 90) return 90;
  return 120;
}

function frequencyLabel(days) {
  if (days <= 1) return "Diaria";
  if (days <= 3) return "Cada 3 días";
  if (days <= 7) return "Semanal";
  if (days <= 14) return "Quincenal";
  if (days <= 30) return "Mensual";
  if (days <= 60) return "Bimestral";
  if (days <= 90) return "Trimestral";
  return "Cada 4 meses";
}

function priorityFromDays(days) {
  if (days <= 7) return { label: "Alta", bg: "rgba(239,68,68,0.14)", color: "#991b1b", border: "rgba(239,68,68,0.28)", accent: "#dc2626" };
  if (days <= 30) return { label: "Media", bg: "rgba(245,158,11,0.14)", color: "#92400e", border: "rgba(245,158,11,0.28)", accent: "#d97706" };
  return { label: "Normal", bg: "rgba(34,197,94,0.14)", color: "#166534", border: "rgba(34,197,94,0.26)", accent: ACCENT };
}

function buildRecommendation({ type, criticality, environment, load, temperature, days }) {
  const notes = [];

  if (criticality === "critical" || criticality === "high") {
    notes.push("Por criticidad del activo, conviene mantener inspección visual frecuente.");
  }
  if (environment === "dust") {
    notes.push("Ambiente contaminado: revisar sellos, respiradores y limpieza del punto.");
  }
  if (environment === "water") {
    notes.push("Presencia de humedad/lavado: validar grasa resistente al agua y purga adecuada.");
  }
  if (environment === "severe") {
    notes.push("Ambiente severo: considerar reducción de intervalo y monitoreo de condición.");
  }
  if (load === "shock") {
    notes.push("Carga con impacto/vibración: revisar temperatura, ruido y condición del rodamiento.");
  }
  if (temperature === "high" || temperature === "very_high") {
    notes.push("Temperatura elevada: validar estabilidad de la grasa/aceite y posible oxidación acelerada.");
  }
  if (type === "gearbox") {
    notes.push("En reductores, complementar con inspección de nivel, fugas, temperatura y condición del aceite.");
  }
  if (type === "hydraulic") {
    notes.push("En hidráulicos, la frecuencia debe complementarse con limpieza ISO 4406, agua y condición de filtros.");
  }
  if (!notes.length) {
    notes.push("Condición estándar: usar esta frecuencia como punto de partida y ajustar con historial real.");
  }
  if (days <= 7) {
    notes.push("La frecuencia resultante es corta; revisar si existe condición severa que pueda corregirse.");
  }

  return notes;
}

export default function LubricationFrequencyTool() {
  const [type, setType] = useState("bearing");
  const [criticality, setCriticality] = useState("medium");
  const [environment, setEnvironment] = useState("normal");
  const [load, setLoad] = useState("normal");
  const [temperature, setTemperature] = useState("normal");
  const [hoursPerDay, setHoursPerDay] = useState("16");

  const result = useMemo(() => {
    const base = baseDaysByType(type);

    const rawDays =
      base *
      multiplierByCriticality(criticality) *
      multiplierByEnvironment(environment) *
      multiplierByLoad(load) *
      multiplierByTemperature(temperature) *
      multiplierByHours(hoursPerDay);

    const roundedDays = roundFrequencyDays(rawDays);
    const priority = priorityFromDays(roundedDays);

    return {
      base,
      rawDays,
      days: roundedDays,
      label: frequencyLabel(roundedDays),
      priority,
      recommendations: buildRecommendation({ type, criticality, environment, load, temperature, days: roundedDays }),
    };
  }, [type, criticality, environment, load, temperature, hoursPerDay]);

  return (
    <div className="lpCard" style={card}>
      <div style={header}>
        <div style={{ ...iconBox, background: `${ACCENT}18`, border: `1px solid ${ACCENT}30`, color: ACCENT }}>
          <Icon name="calendar" size="md" />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={kicker}>FRECUENCIA</div>
          <div style={title}>Frecuencia de lubricación recomendada</div>
        </div>
      </div>

      <div style={subtitle}>
        Sugerencia inicial de intervalo de lubricación según tipo de punto, criticidad y condiciones de operación.
      </div>

      <div style={formGrid}>
        <Field label="Tipo de punto / equipo">
          <select className="lp-select" value={type} onChange={(e) => setType(e.target.value)} style={input}>
            {equipmentTypes.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
          </select>
        </Field>
        <Field label="Criticidad">
          <select className="lp-select" value={criticality} onChange={(e) => setCriticality(e.target.value)} style={input}>
            {criticalities.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
          </select>
        </Field>
        <Field label="Ambiente">
          <select className="lp-select" value={environment} onChange={(e) => setEnvironment(e.target.value)} style={input}>
            {environments.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
          </select>
        </Field>
        <Field label="Carga / vibración">
          <select className="lp-select" value={load} onChange={(e) => setLoad(e.target.value)} style={input}>
            {loads.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
          </select>
        </Field>
        <Field label="Temperatura">
          <select className="lp-select" value={temperature} onChange={(e) => setTemperature(e.target.value)} style={input}>
            {temperatures.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
          </select>
        </Field>
        <Field label="Horas de operación / día">
          <input
            className="lp-input"
            value={hoursPerDay}
            onChange={(e) => setHoursPerDay(e.target.value)}
            type="number"
            min="1"
            max="24"
            step="1"
            style={input}
          />
        </Field>
      </div>

      {/* Result */}
      <div style={resultBox}>
        <div style={resultTop}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 18,
                display: "grid",
                placeItems: "center",
                background: `${ACCENT}18`,
                border: `1px solid ${ACCENT}30`,
                color: ACCENT,
                flexShrink: 0,
              }}
            >
              <Icon name="calendar" size="xl" />
            </div>
            <div>
              <div style={resultLabel}>Frecuencia sugerida</div>
              <div style={resultValue}>{result.label}</div>
              <div style={resultSub}>Cada {result.days} día{result.days === 1 ? "" : "s"}</div>
            </div>
          </div>

          <span
            style={{
              ...priorityBadge,
              background: result.priority.bg,
              color: result.priority.color,
              border: `1px solid ${result.priority.border}`,
            }}
          >
            Prioridad {result.priority.label}
          </span>
        </div>

        <div style={detailGrid}>
          <div style={{ ...detailBox, borderTop: `3px solid #64748b` }}>
            <div style={detailLabel}>Base técnica</div>
            <div style={detailValue}>{result.base} días</div>
          </div>
          <div style={{ ...detailBox, borderTop: "3px solid #d97706" }}>
            <div style={detailLabel}>Cálculo ajustado</div>
            <div style={detailValue}>{Math.max(1, Math.round(result.rawDays))} días</div>
          </div>
          <div style={{ ...detailBox, borderTop: `3px solid ${ACCENT}` }}>
            <div style={detailLabel}>Intervalo aplicable</div>
            <div style={{ ...detailValue, color: ACCENT }}>{result.days} días</div>
          </div>
        </div>

        <div style={recommendBox}>
          <div style={recommendHeader}>
            <span style={{ color: "#d97706" }}><Icon name="spark" size="sm" /></span>
            <div style={recommendTitle}>Recomendación técnica</div>
          </div>
          <ul style={recommendList}>
            {result.recommendations.map((x, idx) => (
              <li key={idx}>{x}</li>
            ))}
          </ul>
        </div>
      </div>

      <div style={note}>
        Nota: esta herramienta entrega una frecuencia inicial de referencia. La frecuencia final debe ajustarse con historial,
        condición real, OEM, tipo de lubricante y criticidad del proceso.
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label style={field}>
      <span style={{ fontSize: 11, fontWeight: 950, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</span>
      {children}
    </label>
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
const kicker = { fontSize: 10, fontWeight: 950, color: ACCENT, letterSpacing: 1.4, textTransform: "uppercase" };
const title = { fontSize: 18, fontWeight: 900, color: "#0f172a", marginTop: 3 };
const subtitle = { fontSize: 13, fontWeight: 800, color: "#64748b", lineHeight: 1.45 };

const formGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 12,
};

const field = { display: "grid", gap: 6 };

const input = {
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 12,
  padding: "10px 12px",
  fontWeight: 900,
  background: "#fff",
  color: "#0f172a",
  width: "100%",
};

const resultBox = {
  borderRadius: 18,
  padding: "18px 18px 16px",
  background: "linear-gradient(160deg, rgba(240,253,244,0.85) 0%, rgba(255,255,255,0.98) 100%)",
  borderTop: `1px solid ${ACCENT}28`,
  borderRight: `1px solid ${ACCENT}18`,
  borderBottom: `1px solid ${ACCENT}18`,
  borderLeft: `5px solid ${ACCENT}`,
  boxShadow: `0 12px 28px ${ACCENT}12`,
  display: "grid",
  gap: 14,
};

const resultTop = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "flex-start",
  flexWrap: "wrap",
};

const resultLabel = {
  fontSize: 11,
  fontWeight: 950,
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: 0.8,
};

const resultValue = {
  fontSize: 28,
  fontWeight: 900,
  color: "#0f172a",
  lineHeight: 1.1,
  marginTop: 4,
};

const resultSub = {
  marginTop: 4,
  fontSize: 13,
  fontWeight: 900,
  color: "#64748b",
};

const priorityBadge = {
  borderRadius: 999,
  padding: "8px 14px",
  fontSize: 12,
  fontWeight: 900,
  whiteSpace: "nowrap",
  alignSelf: "flex-start",
};

const detailGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
  gap: 10,
};

const detailBox = {
  borderRadius: 14,
  padding: "10px 12px",
  background: "#fff",
  borderRight: "1px solid rgba(226,232,240,0.95)",
  borderBottom: "1px solid rgba(226,232,240,0.95)",
  borderLeft: "1px solid rgba(226,232,240,0.95)",
  boxShadow: "0 4px 10px rgba(15,23,42,0.05)",
};

const detailLabel = {
  fontSize: 10,
  fontWeight: 950,
  color: "#94a3b8",
  textTransform: "uppercase",
  letterSpacing: 0.6,
};

const detailValue = {
  marginTop: 6,
  fontSize: 16,
  fontWeight: 900,
  color: "#0f172a",
};

const recommendBox = {
  borderRadius: 14,
  padding: "12px 14px",
  background: "#fff7ed",
  border: "1px solid rgba(251,146,60,0.26)",
  display: "grid",
  gap: 8,
};

const recommendHeader = {
  display: "flex",
  gap: 8,
  alignItems: "center",
};

const recommendTitle = {
  fontSize: 13,
  fontWeight: 900,
  color: "#9a3412",
};

const recommendList = {
  margin: 0,
  paddingLeft: 18,
  display: "grid",
  gap: 6,
  fontSize: 13,
  fontWeight: 850,
  color: "#7c2d12",
  lineHeight: 1.4,
};

const note = {
  fontSize: 11,
  fontWeight: 800,
  color: "#94a3b8",
  lineHeight: 1.4,
  borderTop: "1px solid rgba(226,232,240,0.7)",
  paddingTop: 12,
};
