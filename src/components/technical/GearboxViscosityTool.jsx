import { useMemo, useState } from "react";
import { Icon } from "../ui/lpIcons";

const ACCENT = "#d97706";
const viscositySteps = [68, 100, 150, 220, 320, 460, 680];

function nearestStep(value) {
  return viscositySteps.reduce((prev, current) =>
    Math.abs(current - value) < Math.abs(prev - value) ? current : prev
  );
}

export default function GearboxViscosityTool() {
  const [speedBand, setSpeedBand] = useState("MEDIUM");
  const [loadLevel, setLoadLevel] = useState("NORMAL");
  const [oilTemp, setOilTemp] = useState(70);
  const [shockLoad, setShockLoad] = useState("NO");

  const result = useMemo(() => {
    let base = 220;
    if (speedBand === "FAST") base = 150;
    if (speedBand === "SLOW") base = 320;

    if (loadLevel === "LIGHT") base -= 50;
    if (loadLevel === "HEAVY") base += 100;

    if (Number(oilTemp) >= 90) base += 100;
    else if (Number(oilTemp) <= 40) base -= 30;

    if (shockLoad === "YES") base += 100;

    const suggested = nearestStep(Math.max(68, base));
    return { suggested };
  }, [speedBand, loadLevel, oilTemp, shockLoad]);

  return (
    <div className="lpCard" style={card}>
      <div style={header}>
        <div style={{ ...iconBox, background: `${ACCENT}18`, border: `1px solid ${ACCENT}30`, color: ACCENT }}>
          <Icon name="equipment" size="md" />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={eyebrow}>REDUCTORES</div>
          <div style={title}>Viscosidad para cajas y reductores</div>
        </div>
      </div>

      <div style={subtitle}>
        Sugerencia inicial de ISO VG según velocidad, carga, temperatura y choque operativo.
      </div>

      <div style={grid}>
        <Field label="Velocidad relativa">
          <select className="lp-select" value={speedBand} onChange={(e) => setSpeedBand(e.target.value)} style={input}>
            <option value="FAST">Alta</option>
            <option value="MEDIUM">Media</option>
            <option value="SLOW">Baja</option>
          </select>
        </Field>
        <Field label="Nivel de carga">
          <select className="lp-select" value={loadLevel} onChange={(e) => setLoadLevel(e.target.value)} style={input}>
            <option value="LIGHT">Ligera</option>
            <option value="NORMAL">Normal</option>
            <option value="HEAVY">Alta</option>
          </select>
        </Field>
        <Field label="Temperatura del aceite (°C)">
          <input className="lp-input" type="number" value={oilTemp} onChange={(e) => setOilTemp(e.target.value)} style={input} />
        </Field>
        <Field label="Choque o impacto">
          <select className="lp-select" value={shockLoad} onChange={(e) => setShockLoad(e.target.value)} style={input}>
            <option value="NO">No</option>
            <option value="YES">Sí</option>
          </select>
        </Field>
      </div>

      <div style={highlightBox}>
        <div style={highlightLabel}>ISO VG sugerido</div>
        <div style={highlightValue}>{result.suggested}</div>

        {/* ISO VG scale */}
        <div style={scaleRow}>
          {viscositySteps.map((step) => (
            <span
              key={step}
              style={{
                ...scalePill,
                background: step === result.suggested ? ACCENT : "rgba(255,255,255,0.08)",
                color: step === result.suggested ? "#0f172a" : "rgba(255,255,255,0.40)",
                fontWeight: step === result.suggested ? 950 : 700,
                transform: step === result.suggested ? "scale(1.14)" : "scale(1)",
                boxShadow: step === result.suggested ? `0 4px 12px ${ACCENT}55` : "none",
              }}
            >
              {step}
            </span>
          ))}
        </div>

        <div style={highlightText}>
          Referencia inicial para aceites de engranes industriales en servicio general.
        </div>
      </div>

      <div style={note}>
        Nota técnica: confirma viscosidad final con OEM, AGMA, tipo de engrane, temperatura estable de operación y sistema de lubricación.
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
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
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

const highlightBox = {
  borderRadius: 18,
  padding: "18px 20px 16px",
  background: "linear-gradient(135deg, #0f172a 0%, #1c2d4a 100%)",
  boxShadow: `0 16px 32px ${ACCENT}22`,
  display: "grid",
  gap: 12,
};

const highlightLabel = {
  fontSize: 11,
  fontWeight: 950,
  textTransform: "uppercase",
  letterSpacing: 1,
  color: ACCENT,
};

const highlightValue = {
  fontSize: 48,
  fontWeight: 900,
  color: "#f8fafc",
  lineHeight: 1,
  letterSpacing: "-0.03em",
};

const scaleRow = {
  display: "flex",
  gap: 6,
  flexWrap: "wrap",
};

const scalePill = {
  padding: "5px 10px",
  borderRadius: 8,
  fontSize: 12,
  fontWeight: 700,
  transition: "all 200ms ease",
  letterSpacing: 0.3,
};

const highlightText = {
  fontSize: 12,
  fontWeight: 800,
  color: "#94a3b8",
  lineHeight: 1.45,
};

const note = {
  fontSize: 11,
  fontWeight: 800,
  color: "#94a3b8",
  lineHeight: 1.45,
  borderTop: "1px solid rgba(226,232,240,0.7)",
  paddingTop: 12,
};
