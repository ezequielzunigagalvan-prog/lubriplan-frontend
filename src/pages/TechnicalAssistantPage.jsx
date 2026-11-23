// src/pages/TechnicalAssistantPage.jsx
// Asistente técnico: herramientas de campo para técnicos. Una herramienta a la vez, resultados al momento.
import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import MainLayout from "../layouts/MainLayout";
import { Icon } from "../components/ui/lpIcons";
import {
  REGREASE_FACTORS,
  bearingRegrease,
  BEARINGS,
  GREASE_TYPES,
  greaseCompatibility,
  ISO_VG,
  pitchLineVelocity,
  gearboxViscosity,
  strokesFor,
  gramsPerStrokeFromCalibration,
  CONVERSIONS,
  convert,
  CONDITION_SIGNS,
  suggestCondition,
  POINT_TYPES,
  POINT_CONDITIONS,
  pointFrequency,
} from "../utils/technicalCalc";
import "./TechniciansPage.css";
import "./TechnicalAssistantPage.css";

const TOOLS = [
  { id: "regrease", icon: "drop", title: "Reengrase de rodamiento", question: "¿Cuánta grasa y cada cuándo?", tone: "t-blue" },
  { id: "strokes", icon: "tool", title: "Bombazos de grasa", question: "¿Cuántos bombazos doy?", tone: "t-orange" },
  { id: "condition", icon: "eye", title: "Guía de condición", question: "¿Qué condición reporto?", tone: "t-red" },
  { id: "compat", icon: "copy", title: "Compatibilidad de grasas", question: "¿Puedo mezclar estas grasas?", tone: "t-violet" },
  { id: "viscosity", icon: "equipment", title: "Aceite para reductor", question: "¿Qué ISO VG le pongo?", tone: "t-amber" },
  { id: "frequency", icon: "calendar", title: "Frecuencia sugerida", question: "¿Cada cuándo lubrico este punto?", tone: "t-green" },
  { id: "convert", icon: "refresh", title: "Conversor de unidades", question: "psi, °F, galones, pulgadas…", tone: "t-cyan" },
];

const GUN_KEY = "lp_grease_gun_g_per_stroke";
const RECENT_KEY = "lp_tech_assistant_recent";

const readGun = () => {
  const v = Number(localStorage.getItem(GUN_KEY));
  return Number.isFinite(v) && v > 0 ? v : null;
};

const fmt = (n, d = 1) => (n == null || !Number.isFinite(Number(n)) ? "—" : Number(n).toLocaleString("es-MX", { maximumFractionDigits: d }));

function copy(text) {
  navigator.clipboard?.writeText(text).then(
    () => toast.success("Resultado copiado"),
    () => toast.error("No se pudo copiar")
  );
}

export default function TechnicalAssistantPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const toolId = params.get("tool");
  const tool = TOOLS.find((t) => t.id === toolId) || null;
  const [recent, setRecent] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]").filter((id) => TOOLS.some((t) => t.id === id));
    } catch {
      return [];
    }
  });

  const open = (id) => {
    setParams({ tool: id });
    setRecent((prev) => {
      const next = [id, ...prev.filter((x) => x !== id)].slice(0, 3);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      return next;
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <MainLayout>
      <div className="tch ta lp-fade-in">
        {!tool ? (
          <>
            <header className="tch-head">
              <div>
                <div className="tch-kicker">Asistente técnico</div>
                <h1 className="tch-title">¿Qué necesitas resolver?</h1>
                <div className="tch-sub">Herramientas rápidas para el trabajo en campo. Elige una y obtén el resultado al momento.</div>
              </div>
            </header>

            {recent.length ? (
              <div className="ta-recent">
                <span>Usadas recientemente:</span>
                {recent.map((id) => {
                  const t = TOOLS.find((x) => x.id === id);
                  return (
                    <button key={id} type="button" className="tch-chip ta-recent-chip" onClick={() => open(id)}>
                      <Icon name={t.icon} size="sm" /> {t.title}
                    </button>
                  );
                })}
              </div>
            ) : null}

            <div className="ta-grid">
              {TOOLS.map((t) => (
                <button key={t.id} type="button" className={`ta-tile ${t.tone}`} onClick={() => open(t.id)}>
                  <span className="ta-tile-icon"><Icon name={t.icon} size="lg" /></span>
                  <span className="ta-tile-q">{t.question}</span>
                  <span className="ta-tile-title">{t.title}</span>
                  <Icon name="chevronRight" size="sm" />
                </button>
              ))}
            </div>

            <p className="ta-disclaimer">
              <Icon name="info" size="sm" /> Son referencias técnicas para apoyar la decisión. En equipos críticos valida con el fabricante y con el historial del equipo.
            </p>
          </>
        ) : (
          <>
            <div className="ta-toolbar">
              <button type="button" className="tch-btn tch-btn-ghost" onClick={() => (window.history.length > 1 ? navigate(-1) : setParams({}))}>
                <Icon name="arrowLeft" size="sm" /> Herramientas
              </button>
              <div className="ta-switch" role="tablist" aria-label="Cambiar herramienta">
                {TOOLS.map((t) => (
                  <button key={t.id} type="button" role="tab" aria-selected={t.id === tool.id} className={`ta-switch-btn ${t.tone}`} title={t.title} onClick={() => open(t.id)}>
                    <Icon name={t.icon} size="sm" />
                  </button>
                ))}
              </div>
            </div>
            <section className={`ta-tool ${tool.tone}`}>
              <div className="ta-tool-head">
                <span className="ta-tile-icon"><Icon name={tool.icon} size="lg" /></span>
                <div>
                  <div className="tch-kicker">{tool.question}</div>
                  <h1 className="ta-tool-title">{tool.title}</h1>
                </div>
              </div>
              {tool.id === "regrease" ? <RegreaseTool /> : null}
              {tool.id === "strokes" ? <StrokesTool /> : null}
              {tool.id === "condition" ? <ConditionTool /> : null}
              {tool.id === "compat" ? <CompatTool /> : null}
              {tool.id === "viscosity" ? <ViscosityTool /> : null}
              {tool.id === "frequency" ? <FrequencyTool openTool={open} /> : null}
              {tool.id === "convert" ? <ConvertTool /> : null}
            </section>
          </>
        )}
      </div>
    </MainLayout>
  );
}

/* ================= Piezas comunes ================= */

function NumField({ label, value, onChange, unit, hint, step = "any" }) {
  return (
    <label className="ta-field">
      <span className="ta-label">{label}</span>
      <span className="ta-input-wrap">
        <input className="tch-input ta-input" type="number" inputMode="decimal" step={step} value={value} onChange={(e) => onChange(e.target.value)} />
        {unit ? <span className="ta-unit">{unit}</span> : null}
      </span>
      {hint ? <span className="tch-hint">{hint}</span> : null}
    </label>
  );
}

function Choice({ label, options, value, onChange }) {
  return (
    <div className="ta-field">
      <span className="ta-label">{label}</span>
      <div className="ta-choices" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button key={o.id} type="button" role="radio" aria-checked={value === o.id} className="ta-choice" onClick={() => onChange(o.id)}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Result({ children, tone = "" }) {
  return <div className={`ta-result ${tone}`} aria-live="polite">{children}</div>;
}

function Big({ label, value, unit, sub }) {
  return (
    <div className="ta-big">
      <span className="ta-label">{label}</span>
      <span className="ta-big-value">
        {value}
        {unit ? <small> {unit}</small> : null}
      </span>
      {sub ? <span className="ta-big-sub">{sub}</span> : null}
    </div>
  );
}

function Warnings({ items }) {
  if (!items?.length) return null;
  return (
    <ul className="ta-warn">
      {items.map((w) => (
        <li key={w}><Icon name="warn" size="sm" /> {w}</li>
      ))}
    </ul>
  );
}

function HowTo({ children }) {
  return (
    <details className="ta-how">
      <summary><Icon name="info" size="sm" /> Cómo se calcula</summary>
      <div>{children}</div>
    </details>
  );
}

/* ================= Herramientas ================= */

function RegreaseTool() {
  const [code, setCode] = useState("6205");
  const [dims, setDims] = useState({ d: "25", D: "52", B: "15" });
  const [rpm, setRpm] = useState("1800");
  const [hours, setHours] = useState("24");
  const [f, setF] = useState({ temperature: "t1", contamination: "c1", moisture: "m1", vibration: "v1", position: "p1", design: "d1" });
  const gun = readGun();

  const pickBearing = (c) => {
    setCode(c);
    const b = BEARINGS.find((x) => x.code === c);
    if (b) {
      setDims({ d: String(b.d), D: String(b.D), B: String(b.B) });
      setF((p) => ({ ...p, design: b.design }));
    }
  };
  const setDim = (k) => (v) => {
    setCode("");
    setDims((p) => ({ ...p, [k]: v }));
  };

  const r = useMemo(() => bearingRegrease({ bore: dims.d, outside: dims.D, width: dims.B, rpm, hoursPerDay: hours, factors: f }), [dims, rpm, hours, f]);
  const strokes = r.ok && gun ? strokesFor({ grams: r.grams, gramsPerStroke: gun }) : null;

  return (
    <div className="ta-body">
      <div className="ta-row">
        <label className="ta-field">
          <span className="ta-label">Número de rodamiento</span>
          <select className="tch-input ta-input" value={code} onChange={(e) => pickBearing(e.target.value)}>
            <option value="">Otro (captura medidas)</option>
            {BEARINGS.map((b) => (
              <option key={b.code} value={b.code}>{b.code} · {b.d}×{b.D}×{b.B} mm</option>
            ))}
          </select>
        </label>
        <NumField label="Velocidad" unit="rpm" value={rpm} onChange={setRpm} />
      </div>
      <div className="ta-row ta-row-3">
        <NumField label="Diámetro interior" unit="mm" value={dims.d} onChange={setDim("d")} />
        <NumField label="Diámetro exterior" unit="mm" value={dims.D} onChange={setDim("D")} />
        <NumField label="Ancho (B)" unit="mm" value={dims.B} onChange={setDim("B")} />
      </div>
      {!r.ok ? (
        <Result tone="is-muted"><Warnings items={r.errors} /></Result>
      ) : (
        <Result>
          <div className="ta-bigs">
            <Big
              label="Grasa por reengrase"
              value={fmt(r.grams)}
              unit="g"
              sub={strokes ? `≈ ${strokes.strokes} bombazos con tu pistola (${fmt(readGun(), 2)} g c/u)` : "Calibra tu pistola en «Bombazos» para ver los bombazos"}
            />
            <Big label="Intervalo" value={r.hours ? fmt(r.hours, 0) : "—"} unit="h" sub={r.days ? `≈ ${fmt(r.days)} días operando ${hours} h/día` : null} />
            <Big label="Frecuencia para la ruta" value={r.route?.label || "—"} sub="Igual o más corta que el intervalo calculado" />
          </div>
          <Warnings items={r.warnings} />
          <button
            type="button"
            className="tch-btn tch-btn-ghost ta-copy"
            onClick={() => copy(`Rodamiento ${code || `${dims.d}x${dims.D}x${dims.B} mm`} a ${rpm} rpm: ${fmt(r.grams)} g por reengrase${strokes ? ` (${strokes.strokes} bombazos)` : ""}, intervalo ${r.hours ? fmt(r.hours, 0) + " h" : "—"} (${r.route?.label || "—"}).`)}
          >
            <Icon name="copy" size="sm" /> Copiar resultado
          </button>
        </Result>
      )}
      <div className="ta-section-title">Condiciones de operación <span>· ajustan el intervalo</span></div>
      <Choice label="Tipo de rodamiento" options={REGREASE_FACTORS.design} value={f.design} onChange={(v) => setF((p) => ({ ...p, design: v }))} />
      <Choice label="Temperatura de operación" options={REGREASE_FACTORS.temperature} value={f.temperature} onChange={(v) => setF((p) => ({ ...p, temperature: v }))} />
      <Choice label="Contaminación" options={REGREASE_FACTORS.contamination} value={f.contamination} onChange={(v) => setF((p) => ({ ...p, contamination: v }))} />
      <Choice label="Humedad" options={REGREASE_FACTORS.moisture} value={f.moisture} onChange={(v) => setF((p) => ({ ...p, moisture: v }))} />
      <div className="ta-row">
        <Choice label="Vibración" options={REGREASE_FACTORS.vibration} value={f.vibration} onChange={(v) => setF((p) => ({ ...p, vibration: v }))} />
        <Choice label="Posición del eje" options={REGREASE_FACTORS.position} value={f.position} onChange={(v) => setF((p) => ({ ...p, position: v }))} />
      </div>
      <NumField label="Horas de operación al día" unit="h" value={hours} onChange={setHours} hint="Para pasar el intervalo en horas a días de calendario." />

      <HowTo>
        <p><strong>Cantidad:</strong> G = 0.005 × D × B (gramos), fórmula de SKF para reengrase por el lateral.</p>
        <p><strong>Intervalo:</strong> T = K × [14,000,000 ÷ (n × √d) − 4 × d] horas, con K = producto de los factores de temperatura, contaminación, humedad, vibración, posición y tipo de rodamiento (método de Noria).</p>
        <p>Factor de K actual: {r.ok ? r.K : "—"} · n·dm: {r.ok ? fmt(r.ndm, 0) : "—"}</p>
      </HowTo>
    </div>
  );
}

function StrokesTool() {
  const [gun, setGun] = useState(() => (readGun() ? String(readGun()) : ""));
  const [calStrokes, setCalStrokes] = useState("10");
  const [calGrams, setCalGrams] = useState("");
  const [grams, setGrams] = useState("5");
  const [strokesIn, setStrokesIn] = useState("4");

  const calibrated = gramsPerStrokeFromCalibration({ strokes: calStrokes, grams: calGrams });
  const g = Number(gun);
  const toStrokes = strokesFor({ grams, gramsPerStroke: gun });
  const toGrams = g > 0 && Number(strokesIn) > 0 ? Number(strokesIn) * g : null;

  const saveGun = (v) => {
    setGun(v);
    const n = Number(v);
    if (n > 0) localStorage.setItem(GUN_KEY, String(n));
  };

  return (
    <div className="ta-body">
      <div className="ta-card">
        <div className="ta-card-title">1 · Calibra tu pistola (una sola vez)</div>
        <p className="tch-hint">Da varios bombazos sobre una bolsa, pésala en una báscula y anota cuántos fueron y cuánto pesó. Cada pistola es distinta: el valor típico va de 0.9 a 1.8 g.</p>
        <div className="ta-row">
          <NumField label="Bombazos que diste" value={calStrokes} onChange={setCalStrokes} step="1" />
          <NumField label="Peso total de la grasa" unit="g" value={calGrams} onChange={setCalGrams} />
        </div>
        {calibrated ? (
          <button type="button" className="tch-btn tch-btn-primary" onClick={() => { saveGun(String(calibrated)); toast.success(`Pistola guardada: ${calibrated} g por bombazo`); }}>
            <Icon name="check" size="sm" /> Usar {calibrated} g por bombazo
          </button>
        ) : null}
        <NumField label="Gramos por bombazo de tu pistola" unit="g" value={gun} onChange={saveGun} hint={readGun() ? "Guardado en este dispositivo." : "Si no la has calibrado, usa 1.2 g como referencia."} />
      </div>

      <div className="ta-row">
        <div className="ta-card">
          <div className="ta-card-title">Gramos → bombazos</div>
          <NumField label="Grasa a aplicar" unit="g" value={grams} onChange={setGrams} />
          <Result>
            <Big label="Bombazos" value={toStrokes ? toStrokes.strokes : "—"} sub={toStrokes ? `Exacto: ${fmt(toStrokes.exact)}; se redondea hacia arriba` : "Indica los gramos por bombazo"} />
          </Result>
        </div>
        <div className="ta-card">
          <div className="ta-card-title">Bombazos → gramos</div>
          <NumField label="Bombazos" value={strokesIn} onChange={setStrokesIn} step="1" />
          <Result>
            <Big label="Grasa aplicada" value={toGrams != null ? fmt(toGrams, 2) : "—"} unit="g" />
          </Result>
        </div>
      </div>
    </div>
  );
}

const COND_INFO = {
  BUENO: { label: "Buena", cls: "is-good", icon: "checkCircle", text: "Sin señales anormales. Lubrica según la ruta y registra la actividad.", do: [] },
  REGULAR: { label: "Regular", cls: "is-reg", icon: "dot", text: "Detalles menores que conviene corregir pronto.", do: ["Limpia el punto y la grasera antes de lubricar.", "Anota el detalle en observaciones."] },
  MALO: { label: "Mala", cls: "is-warn", icon: "warn", text: "Hay una falla en desarrollo que requiere seguimiento.", do: ["Registra la actividad con condición Mala y describe lo que viste.", "Toma una foto de evidencia.", "Avisa a tu supervisor en el turno."] },
  CRITICO: { label: "Crítica", cls: "is-bad", icon: "alert", text: "Riesgo de falla inminente o de seguridad.", do: ["Si es seguro, detén o aísla el equipo según el procedimiento de la planta.", "Avisa de inmediato a tu supervisor.", "Registra la actividad con condición Crítica y foto: se notifica a supervisión."] },
};

function ConditionTool() {
  const [signs, setSigns] = useState([]);
  const toggle = (id) => setSigns((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const cond = suggestCondition(signs);
  const info = COND_INFO[cond];
  const groups = [
    ["CRITICO", "Señales graves"],
    ["MALO", "Señales de falla"],
    ["REGULAR", "Detalles menores"],
  ];
  return (
    <div className="ta-body">
      <p className="tch-hint">Marca lo que observas en el punto. La guía sugiere la condición a registrar al completar la actividad.</p>
      {groups.map(([level, title]) => (
        <div key={level} className="ta-field">
          <span className="ta-label">{title}</span>
          <div className="ta-signs">
            {CONDITION_SIGNS.filter((s) => s.level === level).map((s) => (
              <button key={s.id} type="button" className={`ta-sign lvl-${level}`} aria-pressed={signs.includes(s.id)} onClick={() => toggle(s.id)}>
                {signs.includes(s.id) ? <Icon name="check" size="sm" /> : null} {s.label}
              </button>
            ))}
          </div>
        </div>
      ))}
      <Result tone={info.cls}>
        <div className="ta-cond">
          <span className={`ta-cond-icon ${info.cls}`}><Icon name={info.icon} size="lg" /></span>
          <div>
            <span className="ta-label">Condición sugerida</span>
            <div className="ta-big-value">{info.label}</div>
            <div className="ta-big-sub">{info.text}</div>
          </div>
        </div>
        {info.do.length ? (
          <ol className="ta-steps">
            {info.do.map((d) => <li key={d}>{d}</li>)}
          </ol>
        ) : null}
        {signs.length ? (
          <button type="button" className="tch-btn tch-btn-ghost ta-copy" onClick={() => setSigns([])}>
            <Icon name="close" size="sm" /> Limpiar
          </button>
        ) : null}
      </Result>
    </div>
  );
}

const COMPAT_INFO = {
  COMPATIBLE: { label: "Compatibles", cls: "is-good", icon: "checkCircle", text: "La mezcla de estos espesantes suele ser compatible.", do: ["Aun así, confirma que el aceite base y la viscosidad sean similares.", "Purga la grasa vieja en los primeros reengrases."] },
  BORDERLINE: { label: "En el límite", cls: "is-warn", icon: "warn", text: "Pueden mezclarse con precaución: hay riesgo de que la grasa se ablande o separe aceite.", do: ["Purga a fondo la grasa vieja antes del cambio.", "Reengrasa más seguido las primeras semanas y vigila temperatura y fugas."] },
  INCOMPATIBLE: { label: "No compatibles", cls: "is-bad", icon: "xCircle", text: "No las mezcles: la grasa puede ablandarse, escurrir o endurecerse y dejar el punto sin lubricación.", do: ["Desarma y limpia, o purga por completo hasta ver salir grasa nueva.", "Etiqueta el punto con la nueva grasa para que no se vuelva a mezclar."] },
  SAME: { label: "Misma grasa", cls: "is-good", icon: "checkCircle", text: "Es el mismo tipo de espesante.", do: [] },
};

function CompatTool() {
  const [a, setA] = useState("LI");
  const [b, setB] = useState("PU");
  const res = a === b ? "SAME" : greaseCompatibility(a, b);
  const info = COMPAT_INFO[res] || COMPAT_INFO.BORDERLINE;
  return (
    <div className="ta-body">
      <div className="ta-row ta-row-swap">
        <label className="ta-field">
          <span className="ta-label">Grasa que tiene el equipo</span>
          <select className="tch-input ta-input" value={a} onChange={(e) => setA(e.target.value)}>
            {GREASE_TYPES.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
          </select>
        </label>
        <button type="button" className="tch-icon-btn ta-swap" aria-label="Intercambiar" title="Intercambiar" onClick={() => { setA(b); setB(a); }}>
          <Icon name="refresh" size="sm" />
        </button>
        <label className="ta-field">
          <span className="ta-label">Grasa nueva</span>
          <select className="tch-input ta-input" value={b} onChange={(e) => setB(e.target.value)}>
            {GREASE_TYPES.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
          </select>
        </label>
      </div>
      <p className="tch-hint">El espesante viene en la ficha técnica o en la etiqueta (p. ej. «complejo de litio», «poliurea»).</p>
      <Result tone={info.cls}>
        <div className="ta-cond">
          <span className={`ta-cond-icon ${info.cls}`}><Icon name={info.icon} size="lg" /></span>
          <div>
            <div className="ta-big-value">{info.label}</div>
            <div className="ta-big-sub">{info.text}</div>
          </div>
        </div>
        {info.do.length ? <ol className="ta-steps">{info.do.map((d) => <li key={d}>{d}</li>)}</ol> : null}
      </Result>
      <HowTo>
        <p>Tabla de compatibilidad de espesantes de uso común en la industria (NLGI / Machinery Lubrication). Considera solo el espesante; el aceite base y los aditivos también influyen. Ante duda, el fabricante puede hacer una prueba de compatibilidad (ASTM D6185).</p>
      </HowTo>
    </div>
  );
}

function ViscosityTool() {
  const [gearType, setGearType] = useState("HELICAL");
  const [mode, setMode] = useState("estimate");
  const [diameter, setDiameter] = useState("300");
  const [rpm, setRpm] = useState("60");
  const [speedBand, setSpeedBand] = useState("MEDIUM");
  const [ambient, setAmbient] = useState("NORMAL");
  const [oilTemp, setOilTemp] = useState("60");
  const [load, setLoad] = useState("NORMAL");

  const v = mode === "measure" ? pitchLineVelocity(diameter, rpm) : null;
  const r = gearboxViscosity({ gearType, velocity: v, speedBand, ambient, oilTemp, load });

  return (
    <div className="ta-body">
      <Choice label="Tipo de engranes" options={[{ id: "HELICAL", label: "Helicoidales, rectos o cónicos" }, { id: "WORM", label: "Sinfín-corona" }]} value={gearType} onChange={setGearType} />
      {gearType !== "WORM" ? (
        <>
          <Choice label="¿Conoces el engrane de salida?" options={[{ id: "estimate", label: "No, estimar" }, { id: "measure", label: "Sí, tengo medidas" }]} value={mode} onChange={setMode} />
          {mode === "measure" ? (
            <div className="ta-row">
              <NumField label="Diámetro del engrane de baja" unit="mm" value={diameter} onChange={setDiameter} />
              <NumField label="Velocidad de la flecha de salida" unit="rpm" value={rpm} onChange={setRpm} />
            </div>
          ) : (
            <Choice
              label="Velocidad de la salida"
              options={[{ id: "SLOW", label: "Lenta (menos de 100 rpm)" }, { id: "MEDIUM", label: "Media" }, { id: "FAST", label: "Rápida (más de 500 rpm)" }]}
              value={speedBand}
              onChange={setSpeedBand}
            />
          )}
        </>
      ) : null}
      <Choice label="Temperatura ambiente" options={[{ id: "COLD", label: "Menos de 10 °C" }, { id: "NORMAL", label: "10 a 35 °C" }, { id: "HOT", label: "Más de 35 °C" }]} value={ambient} onChange={setAmbient} />
      <div className="ta-row">
        <NumField label="Temperatura del aceite (si la mides)" unit="°C" value={oilTemp} onChange={setOilTemp} />
        <Choice label="Tipo de carga" options={[{ id: "NORMAL", label: "Uniforme" }, { id: "SHOCK", label: "Impactos o arranques frecuentes" }]} value={load} onChange={setLoad} />
      </div>
      <Result>
        <div className="ta-bigs">
          <Big label="ISO VG sugerido" value={r.vg} sub={`Rango aceptable: ${r.range[0]} a ${r.range[1]}`} />
          {v != null ? <Big label="Velocidad de línea de paso" value={fmt(v, 2)} unit="m/s" /> : null}
        </div>
        <div className="ta-scale" aria-hidden="true">
          {ISO_VG.map((x) => (
            <span key={x} className={x === r.vg ? "is-on" : x >= r.range[0] && x <= r.range[1] ? "is-near" : ""}>{x}</span>
          ))}
        </div>
        <ol className="ta-steps">{r.steps.map((s) => <li key={s}>{s}</li>)}</ol>
      </Result>
      <HowTo>
        <p>Criterio AGMA 9005 simplificado para engranes cerrados: la viscosidad depende de la velocidad de línea de paso del engrane de baja, V = π × d × n ÷ 60,000 (m/s). Se ajusta un grado por ambiente, temperatura del aceite y cargas de impacto.</p>
        <p>Si el fabricante del reductor indica un ISO VG en la placa o el manual, ese manda.</p>
      </HowTo>
    </div>
  );
}

function FrequencyTool({ openTool }) {
  const [type, setType] = useState("chain");
  const [c, setC] = useState({ environment: "normal", load: "normal", temperature: "normal", shifts: "2" });
  const r = pointFrequency({ type, ...c });
  return (
    <div className="ta-body">
      <div className="ta-hintbox">
        <Icon name="info" size="sm" /> ¿Es un rodamiento o chumacera? Usa
        <button type="button" className="ta-inline-link" onClick={() => openTool("regrease")}>Reengrase de rodamiento</button>
        : considera su tamaño y velocidad.
      </div>
      <Choice label="Tipo de punto" options={POINT_TYPES} value={type} onChange={setType} />
      <Choice label="Ambiente" options={POINT_CONDITIONS.environment} value={c.environment} onChange={(v) => setC((p) => ({ ...p, environment: v }))} />
      <Choice label="Carga" options={POINT_CONDITIONS.load} value={c.load} onChange={(v) => setC((p) => ({ ...p, load: v }))} />
      <Choice label="Temperatura" options={POINT_CONDITIONS.temperature} value={c.temperature} onChange={(v) => setC((p) => ({ ...p, temperature: v }))} />
      <Choice label="Operación" options={POINT_CONDITIONS.shifts} value={c.shifts} onChange={(v) => setC((p) => ({ ...p, shifts: v }))} />
      {r ? (
        <Result>
          <div className="ta-bigs">
            <Big label="Frecuencia para la ruta" value={r.route?.label || "—"} sub={`Cálculo: cada ${fmt(r.days)} días`} />
          </div>
        </Result>
      ) : null}
      <HowTo>
        <p>Referencia de planeación: intervalo base por tipo de punto ({r ? `${r.base} días` : "—"} para este) ajustado por ambiente, carga, temperatura y turnos. Ajústalo con lo que veas en campo: si el punto llega seco o sucio, acorta la frecuencia.</p>
      </HowTo>
    </div>
  );
}

function ConvertTool() {
  const [cat, setCat] = useState("pressure");
  const units = Object.keys(CONVERSIONS[cat].units);
  const [from, setFrom] = useState("psi");
  const [to, setTo] = useState("bar");
  const [value, setValue] = useState("100");

  const changeCat = (c) => {
    const u = Object.keys(CONVERSIONS[c].units);
    setCat(c);
    setFrom(u[0]);
    setTo(u[1] || u[0]);
  };

  const res = convert(cat, value, from, to);
  const unitLabel = (k) => CONVERSIONS[cat].units[k]?.[0] || k;
  const inches = cat === "length" && res != null ? convert("length", value, from, "in") : null;

  return (
    <div className="ta-body">
      <Choice label="Tipo" options={Object.entries(CONVERSIONS).map(([id, c]) => ({ id, label: c.label }))} value={cat} onChange={changeCat} />
      <div className="ta-row ta-row-swap">
        <label className="ta-field">
          <span className="ta-label">Valor</span>
          <span className="ta-input-wrap">
            <input className="tch-input ta-input" type="number" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} />
            <select className="ta-unit-select" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="Unidad de origen">
              {units.map((u) => <option key={u} value={u}>{unitLabel(u)}</option>)}
            </select>
          </span>
        </label>
        <button type="button" className="tch-icon-btn ta-swap" aria-label="Intercambiar unidades" onClick={() => { setFrom(to); setTo(from); }}>
          <Icon name="refresh" size="sm" />
        </button>
        <label className="ta-field">
          <span className="ta-label">Convertir a</span>
          <select className="tch-input ta-input" value={to} onChange={(e) => setTo(e.target.value)}>
            {units.map((u) => <option key={u} value={u}>{unitLabel(u)}</option>)}
          </select>
        </label>
      </div>
      <Result>
        <Big label="Resultado" value={res == null ? "—" : fmt(res, 4)} unit={unitLabel(to)} sub={inches != null && to !== "in" ? `= ${fmt(inches, 3)} pulgadas` : null} />
        {res != null ? (
          <button type="button" className="tch-btn tch-btn-ghost ta-copy" onClick={() => copy(`${value} ${unitLabel(from)} = ${fmt(res, 4)} ${unitLabel(to)}`)}>
            <Icon name="copy" size="sm" /> Copiar
          </button>
        ) : null}
      </Result>
    </div>
  );
}
