import { useMemo, useState } from "react";

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
  const map = {
    bearing: 30,
    chain: 7,
    guide: 14,
    gearbox: 90,
    hydraulic: 60,
    general: 30,
  };

  return map[type] || 30;
}

function multiplierByCriticality(v) {
  const map = {
    low: 1.3,
    medium: 1,
    high: 0.7,
    critical: 0.5,
  };

  return map[v] || 1;
}

function multiplierByEnvironment(v) {
  const map = {
    clean: 1.25,
    normal: 1,
    dust: 0.75,
    water: 0.65,
    severe: 0.5,
  };

  return map[v] || 1;
}

function multiplierByLoad(v) {
  const map = {
    light: 1.2,
    normal: 1,
    heavy: 0.75,
    shock: 0.6,
  };

  return map[v] || 1;
}

function multiplierByTemperature(v) {
  const map = {
    low: 1.15,
    normal: 1,
    high: 0.7,
    very_high: 0.5,
  };

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
  if (days <= 7) {
    return {
      label: "Alta",
      bg: "#fee2e2",
      color: "#991b1b",
    };
  }

  if (days <= 30) {
    return {
      label: "Media",
      bg: "#fef3c7",
      color: "#92400e",
    };
  }

  return {
    label: "Normal",
    bg: "#dcfce7",
    color: "#166534",
  };
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
      recommendations: buildRecommendation({
        type,
        criticality,
        environment,
        load,
        temperature,
        days: roundedDays,
      }),
    };
  }, [type, criticality, environment, load, temperature, hoursPerDay]);

  return (
    <div style={card}>
      <div style={kicker}>FRECUENCIA</div>
      <div style={title}>Frecuencia recomendada</div>
      <div style={subtitle}>
        Sugerencia inicial de intervalo de lubricación según tipo de punto, criticidad y condiciones de operación.
      </div>

      <div style={formGrid}>
        <label style={label}>
          Tipo de punto/equipo
          <select value={type} onChange={(e) => setType(e.target.value)} style={input}>
            {equipmentTypes.map((x) => (
              <option key={x.id} value={x.id}>
                {x.label}
              </option>
            ))}
          </select>
        </label>

        <label style={label}>
          Criticidad
          <select value={criticality} onChange={(e) => setCriticality(e.target.value)} style={input}>
            {criticalities.map((x) => (
              <option key={x.id} value={x.id}>
                {x.label}
              </option>
            ))}
          </select>
        </label>

        <label style={label}>
          Ambiente
          <select value={environment} onChange={(e) => setEnvironment(e.target.value)} style={input}>
            {environments.map((x) => (
              <option key={x.id} value={x.id}>
                {x.label}
              </option>
            ))}
          </select>
        </label>

        <label style={label}>
          Carga / vibración
          <select value={load} onChange={(e) => setLoad(e.target.value)} style={input}>
            {loads.map((x) => (
              <option key={x.id} value={x.id}>
                {x.label}
              </option>
            ))}
          </select>
        </label>

        <label style={label}>
          Temperatura
          <select value={temperature} onChange={(e) => setTemperature(e.target.value)} style={input}>
            {temperatures.map((x) => (
              <option key={x.id} value={x.id}>
                {x.label}
              </option>
            ))}
          </select>
        </label>

        <label style={label}>
          Horas de operación por día
          <input
            value={hoursPerDay}
            onChange={(e) => setHoursPerDay(e.target.value)}
            type="number"
            min="1"
            max="24"
            step="1"
            style={input}
          />
        </label>
      </div>

      <div style={resultBox}>
        <div style={resultTop}>
          <div>
            <div style={resultLabel}>Frecuencia sugerida</div>
            <div style={resultValue}>{result.label}</div>
            <div style={resultSub}>Cada {result.days} día{result.days === 1 ? "" : "s"}</div>
          </div>

          <div
            style={{
              ...priorityBadge,
              background: result.priority.bg,
              color: result.priority.color,
            }}
          >
            Prioridad {result.priority.label}
          </div>
        </div>

        <div style={detailGrid}>
          <div style={detailBox}>
            <div style={detailLabel}>Base técnica</div>
            <div style={detailValue}>{result.base} días</div>
          </div>

          <div style={detailBox}>
            <div style={detailLabel}>Cálculo ajustado</div>
            <div style={detailValue}>{Math.max(1, Math.round(result.rawDays))} días</div>
          </div>

          <div style={detailBox}>
            <div style={detailLabel}>Intervalo aplicable</div>
            <div style={detailValue}>{result.days} días</div>
          </div>
        </div>

        <div style={recommendBox}>
          <div style={recommendTitle}>Recomendación técnica</div>
          <ul style={recommendList}>
            {result.recommendations.map((x, idx) => (
              <li key={idx}>{x}</li>
            ))}
          </ul>
        </div>
      </div>

      <div style={note}>
        Nota: esta herramienta entrega una frecuencia inicial de referencia. La frecuencia final debe ajustarse con historial, condición real, OEM, tipo de lubricante y criticidad del proceso.
      </div>
    </div>
  );
}

const card = {
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 18,
  padding: 16,
  background: "#fff",
  boxShadow: "0 12px 28px rgba(2,6,23,0.06)",
};

const kicker = {
  fontSize: 11,
  fontWeight: 950,
  color: "#64748b",
  letterSpacing: 1,
};

const title = {
  marginTop: 4,
  fontSize: 20,
  fontWeight: 1000,
  color: "#0f172a",
};

const subtitle = {
  marginTop: 6,
  fontSize: 13,
  fontWeight: 800,
  color: "#64748b",
  lineHeight: 1.4,
};

const formGrid = {
  marginTop: 14,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
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
  background: "#fff",
  color: "#0f172a",
};

const resultBox = {
  marginTop: 14,
  borderRadius: 16,
  padding: 14,
  background: "rgba(248,250,252,0.95)",
  border: "1px solid rgba(226,232,240,0.95)",
};

const resultTop = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "flex-start",
  flexWrap: "wrap",
};

const resultLabel = {
  fontSize: 12,
  fontWeight: 950,
  color: "#64748b",
  textTransform: "uppercase",
};

const resultValue = {
  marginTop: 6,
  fontSize: 26,
  fontWeight: 1000,
  color: "#0f172a",
  lineHeight: 1.1,
};

const resultSub = {
  marginTop: 6,
  fontSize: 13,
  fontWeight: 900,
  color: "#475569",
};

const priorityBadge = {
  borderRadius: 999,
  padding: "8px 12px",
  fontSize: 12,
  fontWeight: 1000,
  border: "1px solid rgba(0,0,0,0.08)",
};

const detailGrid = {
  marginTop: 12,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
  gap: 10,
};

const detailBox = {
  borderRadius: 14,
  padding: 10,
  background: "#fff",
  border: "1px solid rgba(226,232,240,0.95)",
};

const detailLabel = {
  fontSize: 11,
  fontWeight: 950,
  color: "#64748b",
  textTransform: "uppercase",
};

const detailValue = {
  marginTop: 6,
  fontSize: 15,
  fontWeight: 1000,
  color: "#0f172a",
};

const recommendBox = {
  marginTop: 12,
  borderRadius: 14,
  padding: 12,
  background: "#fff7ed",
  border: "1px solid rgba(251,146,60,0.28)",
};

const recommendTitle = {
  fontSize: 13,
  fontWeight: 1000,
  color: "#9a3412",
};

const recommendList = {
  margin: "8px 0 0",
  paddingLeft: 18,
  display: "grid",
  gap: 6,
  fontSize: 13,
  fontWeight: 850,
  color: "#7c2d12",
  lineHeight: 1.4,
};

const note = {
  marginTop: 12,
  fontSize: 12,
  fontWeight: 800,
  color: "#64748b",
  lineHeight: 1.4,
};

