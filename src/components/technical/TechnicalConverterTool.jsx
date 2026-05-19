import { useMemo, useState } from "react";
import { Icon } from "../ui/lpIcons";

const ACCENT = "#0891b2";

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

  if (numerator === denominator) return `${sign}${whole + 1}"`;
  if (numerator === 0) return `${sign}${whole}"`;

  const div = gcd(numerator, denominator);
  numerator = numerator / div;
  const den = denominator / div;

  if (whole === 0) return `${sign}${numerator}/${den}"`;
  return `${sign}${whole} ${numerator}/${den}"`;
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
    <div className="lpCard" style={card}>
      <div style={header}>
        <div style={{ ...iconBox, background: `${ACCENT}18`, border: `1px solid ${ACCENT}30`, color: ACCENT }}>
          <Icon name="refresh" size="md" />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={kicker}>CONVERSOR</div>
          <div style={title}>Conversor técnico</div>
        </div>
      </div>

      <div style={subtitle}>
        Conversiones rápidas para campo: distancia, volumen, presión, temperatura y viscosidad.
      </div>

      <div style={formGrid}>
        <label style={label}>
          Categoría
          <select className="lp-select" value={category} onChange={(e) => changeCategory(e.target.value)} style={input}>
            {Object.entries(categories).map(([key, item]) => (
              <option key={key} value={key}>{item.label}</option>
            ))}
          </select>
        </label>

        <label style={label}>
          Valor
          <input
            className="lp-input"
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
          <select className="lp-select" value={from} onChange={(e) => setFrom(e.target.value)} style={input}>
            {Object.entries(config.units).map(([key, item]) => (
              <option key={key} value={key}>{item.label}</option>
            ))}
          </select>
        </label>

        <label style={label}>
          A
          <select className="lp-select" value={to} onChange={(e) => setTo(e.target.value)} style={input}>
            {Object.entries(config.units).map(([key, item]) => (
              <option key={key} value={key}>{item.label}</option>
            ))}
          </select>
        </label>
      </div>

      <div style={resultBox}>
        <div style={resultLabel}>Resultado</div>
        <div style={resultValue}>
          {result == null ? "—" : formatNumber(result)}{" "}
          <span style={{ fontSize: 16, fontWeight: 800, color: `${ACCENT}CC` }}>
            {config.units[to]?.label || ""}
          </span>
        </div>

        {fractionalInches ? (
          <div style={fractionBox}>
            <span style={{ color: "#fde68a", flexShrink: 0 }}><Icon name="info" size="sm" /></span>
            <span><b>Fracción equivalente:</b> {fractionalInches}</span>
          </div>
        ) : null}
      </div>

      <div style={note}>
        Nota: las conversiones son de referencia operativa. Para especificaciones críticas, valida con ficha técnica o norma aplicable.
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
const kicker = { fontSize: 10, fontWeight: 950, color: ACCENT, letterSpacing: 1.4, textTransform: "uppercase" };
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
  background: "#fff",
  color: "#0f172a",
  width: "100%",
};

const resultBox = {
  borderRadius: 16,
  padding: "18px 20px",
  background: "linear-gradient(135deg, #0f172a 0%, #0c1a35 100%)",
  boxShadow: `0 16px 32px ${ACCENT}22`,
  display: "grid",
  gap: 8,
};

const resultLabel = {
  fontSize: 11,
  fontWeight: 950,
  textTransform: "uppercase",
  letterSpacing: 1,
  color: ACCENT,
};

const resultValue = {
  fontSize: 28,
  fontWeight: 900,
  color: "#f8fafc",
  lineHeight: 1.1,
  wordBreak: "break-all",
};

const fractionBox = {
  display: "flex",
  gap: 8,
  alignItems: "center",
  marginTop: 4,
  padding: "8px 12px",
  borderRadius: 10,
  background: "rgba(245,158,11,0.14)",
  color: "#fde68a",
  fontSize: 13,
  fontWeight: 850,
};

const note = {
  fontSize: 11,
  fontWeight: 800,
  color: "#94a3b8",
  lineHeight: 1.45,
  borderTop: "1px solid rgba(226,232,240,0.7)",
  paddingTop: 12,
};
