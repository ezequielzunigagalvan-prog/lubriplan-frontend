import { useMemo, useState } from "react";

const categories = {
  length: {
    label: "Distancia",
    units: {
      mm: { label: "Milimetros (mm)", toBase: (v) => v, fromBase: (v) => v },
      cm: { label: "Centimetros (cm)", toBase: (v) => v * 10, fromBase: (v) => v / 10 },
      m: { label: "Metros (m)", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      in: { label: "Pulgadas (in)", toBase: (v) => v * 25.4, fromBase: (v) => v / 25.4 },
      ft: { label: "Pies (ft)", toBase: (v) => v * 304.8, fromBase: (v) => v / 304.8 },
    },
  },
  volume: {
    label: "Volumen",
    units: {
      ml: { label: "Mililitros (ml)", toBase: (v) => v, fromBase: (v) => v },
      l: { label: "Litros (L)", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      gal: { label: "Galones US", toBase: (v) => v * 3785.411784, fromBase: (v) => v / 3785.411784 },
      oz: { label: "Onzas liquidas US", toBase: (v) => v * 29.5735295625, fromBase: (v) => v / 29.5735295625 },
    },
  },
  pressure: {
    label: "Presion",
    units: {
      bar: { label: "bar", toBase: (v) => v, fromBase: (v) => v },
      psi: { label: "psi", toBase: (v) => v / 14.5037738, fromBase: (v) => v * 14.5037738 },
      kpa: { label: "kPa", toBase: (v) => v / 100, fromBase: (v) => v * 100 },
      mpa: { label: "MPa", toBase: (v) => v * 10, fromBase: (v) => v / 10 },
    },
  },
  temperature: {
    label: "Temperatura",
    units: {
      c: { label: "C", toBase: (v) => v, fromBase: (v) => v },
      f: { label: "F", toBase: (v) => (v - 32) * (5 / 9), fromBase: (v) => v * (9 / 5) + 32 },
      k: { label: "K", toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 },
    },
  },
  viscosity: {
    label: "Viscosidad",
    units: {
      cst: { label: "cSt", toBase: (v) => v, fromBase: (v) => v },
      st: { label: "St", toBase: (v) => v * 100, fromBase: (v) => v / 100 },
      m2s: { label: "m2/s", toBase: (v) => v * 1000000, fromBase: (v) => v / 1000000 },
    },
  },
};

function gcd(a, b) {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

function inchFraction(decimalInches, denominator = 64) {
  if (!Number.isFinite(decimalInches)) return "-";

  const sign = decimalInches < 0 ? "-" : "";
  const abs = Math.abs(decimalInches);
  const whole = Math.floor(abs);
  const frac = abs - whole;

  let numerator = Math.round(frac * denominator);

  if (numerator === denominator) return `${sign}${whole + 1}\"`;
  if (numerator === 0) return `${sign}${whole}\"`;

  const div = gcd(numerator, denominator);
  numerator = numerator / div;
  const den = denominator / div;

  if (whole === 0) return `${sign}${numerator}/${den}\"`;
  return `${sign}${whole} ${numerator}/${den}\"`;
}

function formatNumber(n) {
  if (!Number.isFinite(n)) return "-";
  if (Math.abs(n) >= 1000) return n.toLocaleString("es-MX", { maximumFractionDigits: 3 });
  return Number(n.toFixed(6)).toString();
}

export default function TechnicalConverterTool() {
  const [category, setCategory] = useState("length");
  const [value, setValue] = useState("25.4");
  const [from, setFrom] = useState("mm");
  const [to, setTo] = useState("in");

  const config = categories[category];

  const result = useMemo(() => {
    const n = Number(value);
    if (!Number.isFinite(n)) return null;

    const fromUnit = config.units[from];
    const toUnit = config.units[to];
    if (!fromUnit || !toUnit) return null;

    const base = fromUnit.toBase(n);
    return toUnit.fromBase(base);
  }, [value, from, to, config]);

  const fractionalInches = useMemo(() => {
    if (category !== "length") return null;

    const n = Number(value);
    if (!Number.isFinite(n)) return null;

    const fromUnit = config.units[from];
    if (!fromUnit) return null;

    const mm = fromUnit.toBase(n);
    const inches = mm / 25.4;
    return inchFraction(inches, 64);
  }, [category, value, from, config]);

  function changeCategory(next) {
    setCategory(next);
    const firstUnits = Object.keys(categories[next].units);
    setFrom(firstUnits[0]);
    setTo(firstUnits[1] || firstUnits[0]);
  }

  return (
    <div style={card}>
      <div style={kicker}>CONVERSOR</div>
      <div style={title}>Conversor tecnico</div>
      <div style={subtitle}>
        Conversiones rapidas para campo: distancia, volumen, presion, temperatura y viscosidad.
      </div>

      <div style={formGrid}>
        <label style={label}>
          Categoria
          <select value={category} onChange={(e) => changeCategory(e.target.value)} style={input}>
            {Object.entries(categories).map(([key, item]) => (
              <option key={key} value={key}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label style={label}>
          Valor
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            type="number"
            step="any"
            style={input}
            placeholder="Ingresa valor"
          />
        </label>

        <label style={label}>
          De
          <select value={from} onChange={(e) => setFrom(e.target.value)} style={input}>
            {Object.entries(config.units).map(([key, item]) => (
              <option key={key} value={key}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label style={label}>
          A
          <select value={to} onChange={(e) => setTo(e.target.value)} style={input}>
            {Object.entries(config.units).map(([key, item]) => (
              <option key={key} value={key}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div style={resultBox}>
        <div style={resultLabel}>Resultado</div>
        <div style={resultValue}>
          {result == null ? "-" : formatNumber(result)} {config.units[to]?.label || ""}
        </div>

        {fractionalInches ? (
          <div style={fractionBox}>
            <b>Equivalente en fraccion:</b> {fractionalInches}
          </div>
        ) : null}
      </div>

      <div style={note}>
        Nota: las conversiones son de referencia operativa. Para especificaciones criticas, valida con ficha tecnica o norma aplicable.
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
const kicker = { fontSize: 11, fontWeight: 950, color: "#64748b", letterSpacing: 1.2 };
const title = { marginTop: 4, fontSize: 21, fontWeight: 1000, color: "#0f172a" };
const subtitle = { marginTop: 6, fontSize: 13, fontWeight: 800, color: "#64748b", lineHeight: 1.45 };
const formGrid = { marginTop: 14, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12 };
const label = { display: "grid", gap: 6, fontSize: 12, fontWeight: 950, color: "#475569" };
const input = { border: "1px solid rgba(226,232,240,0.95)", borderRadius: 12, padding: "10px 12px", fontWeight: 900, background: "#fff", color: "#0f172a" };
const resultBox = { marginTop: 14, borderRadius: 16, padding: 14, background: "rgba(248,250,252,0.95)", border: "1px solid rgba(226,232,240,0.95)" };
const resultLabel = { fontSize: 12, fontWeight: 950, color: "#64748b", textTransform: "uppercase" };
const resultValue = { marginTop: 6, fontSize: 24, fontWeight: 1000, color: "#0f172a", lineHeight: 1.1 };
const fractionBox = { marginTop: 10, padding: "10px 12px", borderRadius: 12, background: "#fef3c7", color: "#92400e", fontSize: 13, fontWeight: 850 };
const note = { marginTop: 12, fontSize: 12, fontWeight: 800, color: "#64748b", lineHeight: 1.45 };
