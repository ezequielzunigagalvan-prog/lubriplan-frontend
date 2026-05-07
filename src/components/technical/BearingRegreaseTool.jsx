import { useMemo, useState } from "react";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function formatInterval(hours) {
  if (!Number.isFinite(hours) || hours <= 0) return "Sin referencia";
  if (hours < 24) return `${Math.round(hours)} h`;
  const days = hours / 24;
  if (days < 30) return `${Math.round(days)} dias`;
  return `${Math.round(days / 30)} meses`;
}

export default function BearingRegreaseTool() {
  const [outsideDiameter, setOutsideDiameter] = useState(120);
  const [bearingWidth, setBearingWidth] = useState(30);
  const [rpm, setRpm] = useState(900);
  const [severity, setSeverity] = useState("NORMAL");
  const [environment, setEnvironment] = useState("CLEAN");

  const result = useMemo(() => {
    const quantity = clamp(0.005 * Number(outsideDiameter || 0) * Number(bearingWidth || 0), 1, 5000);

    let baseHours = 4000;
    if (rpm >= 1800) baseHours = 1500;
    else if (rpm >= 900) baseHours = 2500;
    else if (rpm >= 300) baseHours = 4000;
    else baseHours = 6000;

    const severityFactor = severity === "HIGH" ? 0.55 : severity === "LOW" ? 1.2 : 1;
    const environmentFactor = environment === "WET" ? 0.55 : environment === "DIRTY" ? 0.7 : 1;
    const suggestedHours = clamp(baseHours * severityFactor * environmentFactor, 24, 12000);

    return {
      quantity: Math.round(quantity * 10) / 10,
      suggestedHours,
      intervalLabel: formatInterval(suggestedHours),
    };
  }, [outsideDiameter, bearingWidth, rpm, severity, environment]);

  return (
    <div style={card}>
      <div style={eyebrow}>RODAMIENTOS</div>
      <div style={title}>Reengrase de rodamientos</div>
      <div style={subtitle}>Estimacion inicial de cantidad y frecuencia para apoyo tecnico en campo.</div>

      <div style={grid}>
        <Field label="Diametro exterior (mm)">
          <input type="number" value={outsideDiameter} onChange={(e) => setOutsideDiameter(e.target.value)} style={input} />
        </Field>
        <Field label="Ancho del rodamiento (mm)">
          <input type="number" value={bearingWidth} onChange={(e) => setBearingWidth(e.target.value)} style={input} />
        </Field>
        <Field label="Velocidad (rpm)">
          <input type="number" value={rpm} onChange={(e) => setRpm(e.target.value)} style={input} />
        </Field>
        <Field label="Severidad">
          <select value={severity} onChange={(e) => setSeverity(e.target.value)} style={input}>
            <option value="LOW">Baja</option>
            <option value="NORMAL">Normal</option>
            <option value="HIGH">Alta</option>
          </select>
        </Field>
        <Field label="Ambiente">
          <select value={environment} onChange={(e) => setEnvironment(e.target.value)} style={input}>
            <option value="CLEAN">Limpio</option>
            <option value="DIRTY">Polvo o suciedad</option>
            <option value="WET">Humedad o lavado</option>
          </select>
        </Field>
      </div>

      <div style={resultGrid}>
        <div style={metricCard}>
          <div style={metricLabel}>Cantidad sugerida</div>
          <div style={metricValue}>{result.quantity} g</div>
          <div style={metricHelp}>Referencia por punto o rodamiento</div>
        </div>
        <div style={metricCard}>
          <div style={metricLabel}>Intervalo sugerido</div>
          <div style={metricValue}>{result.intervalLabel}</div>
          <div style={metricHelp}>{Math.round(result.suggestedHours)} horas estimadas</div>
        </div>
      </div>

      <div style={note}>
        Nota tecnica: valida el ajuste final con OEM, factor DN, tipo de sello, grasa utilizada y condiciones reales de contaminacion.
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label style={field}>
      {label}
      {children}
    </label>
  );
}

const card = {
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 22,
  padding: 18,
  background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
  boxShadow: "0 18px 34px rgba(15,23,42,0.08)",
};
const eyebrow = { fontSize: 11, fontWeight: 950, color: "#64748b", letterSpacing: 1.2 };
const title = { fontSize: 21, fontWeight: 1000, color: "#0f172a", marginTop: 4 };
const subtitle = { fontSize: 13, fontWeight: 800, color: "#64748b", marginTop: 6, lineHeight: 1.45, marginBottom: 14 };
const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 };
const field = { display: "grid", gap: 6, fontSize: 12, fontWeight: 950, color: "#475569" };
const input = { border: "1px solid rgba(226,232,240,0.95)", borderRadius: 12, padding: "10px 12px", fontWeight: 900, color: "#0f172a", background: "#fff" };
const resultGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginTop: 14 };
const metricCard = { border: "1px solid rgba(226,232,240,0.95)", borderRadius: 16, padding: 14, background: "#fff" };
const metricLabel = { fontSize: 12, fontWeight: 950, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.8 };
const metricValue = { fontSize: 28, fontWeight: 1000, color: "#0f172a", marginTop: 8 };
const metricHelp = { fontSize: 12, fontWeight: 800, color: "#64748b", marginTop: 6 };
const note = { marginTop: 12, fontSize: 12, fontWeight: 800, color: "#64748b", lineHeight: 1.45 };
