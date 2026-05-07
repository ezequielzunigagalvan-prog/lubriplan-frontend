import { useMemo, useState } from "react";

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
    <div style={card}>
      <div style={eyebrow}>REDUCTORES</div>
      <div style={title}>Viscosidad para cajas y reductores</div>
      <div style={subtitle}>Sugerencia inicial de ISO VG segun velocidad, carga, temperatura y choque operativo.</div>

      <div style={grid}>
        <Field label="Velocidad relativa">
          <select value={speedBand} onChange={(e) => setSpeedBand(e.target.value)} style={input}>
            <option value="FAST">Alta</option>
            <option value="MEDIUM">Media</option>
            <option value="SLOW">Baja</option>
          </select>
        </Field>
        <Field label="Nivel de carga">
          <select value={loadLevel} onChange={(e) => setLoadLevel(e.target.value)} style={input}>
            <option value="LIGHT">Ligera</option>
            <option value="NORMAL">Normal</option>
            <option value="HEAVY">Alta</option>
          </select>
        </Field>
        <Field label="Temperatura del aceite (C)">
          <input type="number" value={oilTemp} onChange={(e) => setOilTemp(e.target.value)} style={input} />
        </Field>
        <Field label="Choque o impacto">
          <select value={shockLoad} onChange={(e) => setShockLoad(e.target.value)} style={input}>
            <option value="NO">No</option>
            <option value="YES">Si</option>
          </select>
        </Field>
      </div>

      <div style={highlightBox}>
        <div style={highlightLabel}>ISO VG sugerido</div>
        <div style={highlightValue}>{result.suggested}</div>
        <div style={highlightText}>Referencia inicial para aceites de engranes industriales en servicio general.</div>
      </div>

      <div style={note}>
        Nota tecnica: confirma viscosidad final con OEM, AGMA, tipo de engrane, temperatura estable de operacion y sistema de lubricacion.
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
const highlightBox = { marginTop: 14, borderRadius: 16, padding: 16, background: "linear-gradient(135deg, #0f172a 0%, #172554 100%)", color: "#fff" };
const highlightLabel = { fontSize: 12, fontWeight: 950, textTransform: "uppercase", letterSpacing: 0.8, color: "#93c5fd" };
const highlightValue = { fontSize: 34, fontWeight: 1000, marginTop: 8 };
const highlightText = { fontSize: 12, fontWeight: 800, color: "#dbeafe", marginTop: 6, lineHeight: 1.45 };
const note = { marginTop: 12, fontSize: 12, fontWeight: 800, color: "#64748b", lineHeight: 1.45 };
