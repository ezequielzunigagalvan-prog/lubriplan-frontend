import { useMemo, useState } from "react";
import { Icon } from "../ui/lpIcons";

const ACCENT = "#2563eb";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function formatInterval(hours) {
  if (!Number.isFinite(hours) || hours <= 0) return "Sin referencia";
  if (hours < 24) return `${Math.round(hours)} h`;
  const days = hours / 24;
  if (days < 30) return `${Math.round(days)} días`;
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
    <div className="lpCard" style={card}>
      <div style={header}>
        <div style={{ ...iconBox, background: `${ACCENT}18`, border: `1px solid ${ACCENT}30`, color: ACCENT }}>
          <Icon name="tool" size="md" />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={eyebrow}>RODAMIENTOS</div>
          <div style={title}>Reengrase de rodamientos</div>
        </div>
      </div>

      <div style={subtitle}>Estimación inicial de cantidad y frecuencia para apoyo técnico en campo.</div>

      <div style={grid}>
        <Field label="Diámetro exterior (mm)">
          <input className="lp-input" type="number" value={outsideDiameter} onChange={(e) => setOutsideDiameter(e.target.value)} style={input} />
        </Field>
        <Field label="Ancho del rodamiento (mm)">
          <input className="lp-input" type="number" value={bearingWidth} onChange={(e) => setBearingWidth(e.target.value)} style={input} />
        </Field>
        <Field label="Velocidad (rpm)">
          <input className="lp-input" type="number" value={rpm} onChange={(e) => setRpm(e.target.value)} style={input} />
        </Field>
        <Field label="Severidad">
          <select className="lp-select" value={severity} onChange={(e) => setSeverity(e.target.value)} style={input}>
            <option value="LOW">Baja</option>
            <option value="NORMAL">Normal</option>
            <option value="HIGH">Alta</option>
          </select>
        </Field>
        <Field label="Ambiente">
          <select className="lp-select" value={environment} onChange={(e) => setEnvironment(e.target.value)} style={input}>
            <option value="CLEAN">Limpio</option>
            <option value="DIRTY">Polvo o suciedad</option>
            <option value="WET">Humedad o lavado</option>
          </select>
        </Field>
      </div>

      <div style={resultGrid}>
        <div style={{ ...metricCard, borderTop: `4px solid ${ACCENT}` }}>
          <div style={metricLabel}>
            <span style={{ color: ACCENT }}><Icon name="drop" size="sm" /></span>
            Cantidad sugerida
          </div>
          <div style={{ ...metricValue, color: ACCENT }}>
            {result.quantity}
            <span style={{ fontSize: 16, fontWeight: 800, marginLeft: 4 }}>g</span>
          </div>
          <div style={metricHelp}>Por punto o rodamiento</div>
        </div>

        <div style={{ ...metricCard, borderTop: "4px solid #16a34a" }}>
          <div style={metricLabel}>
            <span style={{ color: "#16a34a" }}><Icon name="calendar" size="sm" /></span>
            Intervalo sugerido
          </div>
          <div style={{ ...metricValue, color: "#16a34a" }}>{result.intervalLabel}</div>
          <div style={metricHelp}>{Math.round(result.suggestedHours)} horas estimadas</div>
        </div>
      </div>

      <div style={note}>
        Nota técnica: valida el ajuste final con OEM, factor DN, tipo de sello, grasa utilizada y condiciones reales de contaminación.
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
const eyebrow = { fontSize: 10, fontWeight: 950, color: ACCENT, letterSpacing: 1.4, textTransform: "uppercase" };
const title = { fontSize: 18, fontWeight: 900, color: "#0f172a", marginTop: 3 };
const subtitle = { fontSize: 13, fontWeight: 800, color: "#64748b", lineHeight: 1.45 };

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
  gap: 12,
};

const field = { display: "grid", gap: 6 };

const input = {
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 12,
  padding: "10px 12px",
  fontWeight: 900,
  color: "#0f172a",
  background: "#fff",
  width: "100%",
};

const resultGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
  gap: 12,
};

const metricCard = {
  borderRadius: 16,
  padding: "16px 16px 14px",
  background: "#fff",
  borderRight: "1px solid rgba(226,232,240,0.95)",
  borderBottom: "1px solid rgba(226,232,240,0.95)",
  borderLeft: "1px solid rgba(226,232,240,0.95)",
  boxShadow: "0 8px 20px rgba(15,23,42,0.06)",
  display: "grid",
  gap: 6,
};

const metricLabel = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  fontSize: 11,
  fontWeight: 950,
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: 0.7,
};

const metricValue = {
  fontSize: 30,
  fontWeight: 900,
  lineHeight: 1,
  marginTop: 4,
};

const metricHelp = { fontSize: 12, fontWeight: 800, color: "#94a3b8" };

const note = {
  fontSize: 11,
  fontWeight: 800,
  color: "#94a3b8",
  lineHeight: 1.45,
  borderTop: "1px solid rgba(226,232,240,0.7)",
  paddingTop: 12,
};
