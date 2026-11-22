import React, { useCallback, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Icon } from "../components/ui/lpIcons";
import lubriPlanLogo from "../assets/lubriplan-logo.png.png";
import landingDashboardCover from "../assets/landing-dashboard-cover.png";
import landingAlerts from "../assets/landing-alerts.png";
import landingAiSummary from "../assets/landing-ai-summary.png";
import LandingChatWidget from "../components/chat/LandingChatWidget";
import DemoRequestModal from "../components/landing/DemoRequestModal";
import "./LubriPlanLanding.css";


/* =========================
   Contenido
   ========================= */

const SIGNALS = [
  {
    icon: "route",
    title: "Rutas bajo control",
    text: "Frecuencias, puntos, métodos y responsables en una sola base. Sin hojas sueltas ni seguimiento informal.",
  },
  {
    icon: "checkCircle",
    title: "Ejecución trazable",
    text: "Cada actividad queda respaldada con técnico, condición, evidencia y consumo real aplicado.",
  },
  {
    icon: "trendUp",
    title: "Visibilidad ejecutiva",
    text: "Indicadores, alertas y reportes para supervisar pendientes, vencidos y riesgos antes de que escalen.",
  },
  {
    icon: "drop",
    title: "Inventario conectado",
    text: "El consumo de lubricantes se registra con cada actividad y anticipa el riesgo de desabasto.",
  },
];

const PROBLEMS = [
  { icon: "warn", text: "Actividades vencidas que nadie detecta a tiempo" },
  { icon: "xCircle", text: "Sobrelubricación o falta de lubricación por ejecución inconsistente" },
  { icon: "search", text: "Sin trazabilidad por equipo, técnico ni condición" },
  { icon: "drop", text: "Inventario desconectado del consumo real" },
  { icon: "trendDown", text: "Decisiones reactivas por falta de visibilidad operativa" },
];

const WINS = [
  {
    title: "Menos atraso operativo",
    text: "Visibilidad inmediata de actividades vencidas y pendientes. El equipo prioriza con datos, no con suposiciones.",
  },
  {
    title: "El técnico ejecuta con contexto",
    text: "Recibe instrucciones claras, captura evidencia y registra el consumo real en una sola pantalla.",
  },
  {
    title: "La jefatura decide con información",
    text: "Supervisión y gerencia reciben alertas, resumen ejecutivo e historial útil para actuar con prioridad.",
  },
];

const JOURNEY = [
  {
    n: "01",
    title: "Estandarizas la operación",
    text: "Configuras equipos, rutas, frecuencias, cantidades y criterios operativos en una base única y compartida.",
  },
  {
    n: "02",
    title: "LubriPlan ordena las prioridades",
    text: "Genera actividades automáticamente, separa lo vencido de lo pendiente y mantiene visibles los riesgos activos.",
  },
  {
    n: "03",
    title: "El técnico ejecuta con contexto",
    text: "Instrucciones claras, captura de evidencia y registro del consumo real, todo desde su dispositivo en planta.",
  },
  {
    n: "04",
    title: "La jefatura decide con datos",
    text: "Indicadores, alertas y resumen ejecutivo para priorizar, corregir y demostrar control operativo.",
  },
];

const CAPABILITIES = [
  "Roles diferenciados: administrador, supervisor y técnico",
  "Historial completo por equipo, técnico y condición",
  "Inventario con consumo real y alertas de existencias",
  "Lectura ejecutiva y alertas predictivas con IA",
  "Multiplanta sin mezcla de datos entre operaciones",
  "Modo sin conexión para ejecutar en campo sin red",
];

const TECHNICAL_TOOLS = [
  {
    title: "Compatibilidad de grasas",
    text: "Valida cambios de grasa entre espesantes y reduce el riesgo de mezclas inadecuadas en rodamientos, guías y sistemas centralizados.",
  },
  {
    title: "Reengrase de rodamientos",
    text: "Calcula una referencia inicial de cantidad y frecuencia para decisiones rápidas de mantenimiento en campo.",
  },
  {
    title: "Viscosidad para reductores",
    text: "Sugiere un ISO VG inicial según velocidad, carga, temperatura y choques de operación para cajas y reductores.",
  },
  {
    title: "Conversor técnico",
    text: "Conversiones de distancia, volumen, presión, temperatura y viscosidad, incluidas pulgadas en fracción.",
  },
];

const CARD_FEATURES = [
  "Acceso por QR: escanea y listo, sin credenciales",
  "Imagen del equipo con puntos numerados y coloreados por frecuencia",
  "Lubricante, cantidad, unidad y método por punto",
  "Diseñado para usarse con guantes en planta",
  "El administrador gestiona las cartas desde el panel web",
];

const AUDIENCES = [
  "Jefes de mantenimiento",
  "Supervisores de lubricación",
  "Responsables de confiabilidad",
  "Técnicos de campo",
];

const INDUSTRIES = [
  "Manufactura",
  "Automotriz",
  "Metalmecánica",
  "Alimentos y bebidas",
  "Servicios auxiliares",
  "Plantas industriales",
];

const MODULES = [
  "Equipos",
  "Técnicos",
  "Inventario",
  "Rutas",
  "Actividades automáticas",
  "Actividades manuales",
  "Actividades emergentes",
  "Condición anormal",
  "Historial",
  "Análisis",
  "Alertas",
  "Reportes con IA",
  "Exportar a PDF",
  "Multiplanta",
  "Modo sin conexión",
  "Importar y exportar",
];

/* =========================
   Página
   ========================= */

export default function LubriPlanLanding() {
  const { isAuthenticated } = useAuth();
  const [demoOpen, setDemoOpen] = useState(false);
  const openDemo = () => setDemoOpen(true);
  const closeDemo = useCallback(() => setDemoOpen(false), []);
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const year = new Date().getFullYear();

  return (
    <div className="lpl">
      <div className="lpl-hazard" />
      <div className="lpl-blueprint" aria-hidden="true" />

      {/* Navegación */}
      <header className="lpl-nav">
        <div className="lpl-container lpl-nav-inner">
          <a href="#inicio" className="lpl-brand" aria-label="LubriPlan, inicio">
            <img src={lubriPlanLogo} alt="" />
            <div>
              <div className="lpl-brand-name">LubriPlan</div>
              <div className="lpl-brand-sub lpl-hide-sm">Lubricación industrial</div>
            </div>
          </a>

          <nav className="lpl-nav-links" aria-label="Secciones">
            <a href="#como-funciona">Cómo funciona</a>
            <a href="#video">Video</a>
            <a href="#capacidades">Capacidades</a>
            <a href="#contacto">Contacto</a>
          </nav>

          <div className="lpl-nav-actions">
            <Link to="/card" className="lpl-btn lpl-btn-outline lpl-btn-sm lpl-hide-sm">LubriPlan Card</Link>
            <Link to="/login" className="lpl-btn lpl-btn-primary lpl-btn-sm">Entrar</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section id="inicio" className="lpl-hero">
        <div className="lpl-container lpl-hero-grid">
          <div>
            <span className="lpl-pill"><span className="lpl-pulse" />Gestión de lubricación industrial</span>
            <h1 className="lpl-h1">
              Control real sobre la <em>lubricación</em> de tu planta
            </h1>
            <p className="lpl-lead">
              LubriPlan reemplaza el seguimiento en Excel, papel o mensajes con una plataforma que
              conecta planeación, ejecución, condición, consumo e inventario en un solo lugar.
            </p>
            <p className="lpl-audience">
              Para <strong>jefes de mantenimiento, supervisores y técnicos</strong> de lubricación industrial.
            </p>

            <div className="lpl-actions">
              <button type="button" onClick={openDemo} className="lpl-btn lpl-btn-primary">
                Solicitar demo <Icon name="arrowRight" size="sm" />
              </button>
              <a href="#como-funciona" className="lpl-btn lpl-btn-outline">Cómo funciona</a>
              <Link to="/login" className="lpl-btn lpl-btn-ghost">Entrar a la plataforma</Link>
            </div>

            <div className="lpl-specs">
              <Spec icon="checkCircle" text="Trazabilidad por actividad" />
              <Spec icon="alert" text="Alertas de riesgo operativo" />
              <Spec icon="trendUp" text="Indicadores para supervisión" />
            </div>
          </div>

          <div className="lpl-corners">
            <div className="lpl-console">
              <div className="lpl-console-bar">
                <div className="lpl-console-dots"><span /><span /><span /></div>
                <span className="lpl-console-path">lubriplan / panel-operativo</span>
                <span className="lpl-console-tag">Captura del sistema</span>
              </div>
              <div className="lpl-console-body">
                <img src={landingDashboardCover} alt="Panel operativo de LubriPlan" />
              </div>
              <div className="lpl-console-foot">
                <div><b>01</b>Indicadores operativos en tiempo real</div>
                <div><b>02</b>Prioridades diferenciadas por rol</div>
                <div><b>03</b>Alertas accionables desde el panel</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Banda de valor */}
      <section className="lpl-band">
        <div className="lpl-container lpl-band-grid">
          {SIGNALS.map((s) => (
            <div key={s.title} className="lpl-band-item">
              <div className="lpl-icon-box"><Icon name={s.icon} /></div>
              <div className="lpl-band-title">{s.title}</div>
              <div className="lpl-band-text">{s.text}</div>
            </div>
          ))}
        </div>
      </section>

      {/* El problema */}
      <section className="lpl-section">
        <div className="lpl-container lpl-two">
          <div>
            <SectionLabel index="01" text="El problema" />
            <h2 className="lpl-h2">Sin un sistema, la lubricación se vuelve un riesgo</h2>
            <p className="lpl-text">
              Cuando el control vive en papel, Excel o mensajes de WhatsApp, los pendientes se
              acumulan, las prioridades no son claras y el inventario deja de reflejar lo que
              realmente pasa en planta.
            </p>
          </div>

          <div className="lpl-issues">
            <div className="lpl-issues-head">
              <span>Diagnóstico típico</span>
              <span>Control manual</span>
            </div>
            {PROBLEMS.map((p) => (
              <div key={p.text} className="lpl-issue">
                <span className="lpl-issue-icon"><Icon name={p.icon} size="sm" /></span>
                <span>{p.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* La diferencia */}
      <section className="lpl-section lpl-section-alt">
        <div className="lpl-container">
          <div className="lpl-head">
            <SectionLabel index="02" text="La diferencia" />
            <h2 className="lpl-h2">Control operativo desde el primer día</h2>
            <p className="lpl-text">
              No se trata solo de digitalizar formatos: cada rol recibe la información que necesita
              para ejecutar mejor, priorizar sin adivinar y demostrar control con datos reales.
            </p>
          </div>
          <div className="lpl-grid-3">
            {WINS.map((w, i) => (
              <div key={w.title} className="lpl-card">
                <div className="lpl-card-top">
                  <div className="lpl-icon-box"><Icon name="trendUp" /></div>
                  <span className="lpl-card-num">{String(i + 1).padStart(2, "0")}</span>
                </div>
                <div className="lpl-card-title">{w.title}</div>
                <div className="lpl-card-text">{w.text}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="como-funciona" className="lpl-section">
        <div className="lpl-container">
          <div className="lpl-head">
            <SectionLabel index="03" text="Cómo funciona" />
            <h2 className="lpl-h2">De la planeación al control ejecutivo en cuatro pasos</h2>
          </div>
          <div className="lpl-steps">
            {JOURNEY.map((step) => (
              <div key={step.n}>
                <div className="lpl-step-num">{step.n}</div>
                <div className="lpl-step-title">{step.title}</div>
                <div className="lpl-step-text">{step.text}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Video demostrativo */}
      <section id="video" className="lpl-section lpl-section-alt">
        <div className="lpl-container">
          <div className="lpl-head lpl-head-center">
            <SectionLabel index="04" text="Video demostrativo" />
            <h2 className="lpl-h2">Conoce LubriPlan en 40 segundos</h2>
            <p className="lpl-text">
              Un recorrido animado que resume el problema de controlar la lubricación con papel y
              cómo LubriPlan organiza rutas, actividades, alertas e inventario en una sola plataforma.
            </p>
          </div>

          <div className="lpl-video-wrap">
            <div className="lpl-corners">
              <div className="lpl-video-frame">
                <video
                  src="/lubriplan-demo.mp4?v=2#t=0.5"
                  controls
                  playsInline
                  preload="metadata"
                  aria-label="Video demostrativo animado de LubriPlan"
                />
              </div>
            </div>
            <div className="lpl-video-meta">
              <p className="lpl-video-note">
                <strong>Video ilustrativo.</strong> Las escenas y los datos que aparecen son una animación
                creada para explicar el concepto; no muestran una planta ni una operación real.
              </p>
              <span className="lpl-chip"><Icon name="info" size="sm" />Animación demostrativa</span>
            </div>
          </div>
        </div>
      </section>

      {/* Capacidades */}
      <section id="capacidades" className="lpl-section">
        <div className="lpl-container">
          <div className="lpl-head">
            <SectionLabel index="05" text="Capacidades" />
            <h2 className="lpl-h2">Una plataforma para planear, ejecutar, alertar y decidir</h2>
            <p className="lpl-text">
              LubriPlan conecta control operativo, monitoreo de condición, inventario y lectura
              ejecutiva en un solo sistema, sin módulos separados ni hojas paralelas.
            </p>
          </div>
          <div className="lpl-checks">
            {CAPABILITIES.map((c) => (
              <div key={c} className="lpl-check">
                <span className="lpl-check-icon"><Icon name="check" size="sm" weight="bold" /></span>
                <span>{c}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Capturas */}
      <section className="lpl-section lpl-section-alt">
        <div className="lpl-container">
          <div className="lpl-head">
            <SectionLabel index="06" text="El producto en uso" />
            <h2 className="lpl-h2">Alertas y lectura ejecutiva para operar con anticipación</h2>
            <p className="lpl-text">
              LubriPlan muestra lo que importa en el momento en que importa: alertas accionables y
              un resumen inteligente que ayuda a priorizar sin revisar cada registro.
            </p>
          </div>
          <div className="lpl-grid-2">
            <Shot
              image={landingAlerts}
              alt="Centro de alertas de LubriPlan"
              kicker="Centro de alertas"
              title="Riesgos operativos visibles antes de que escalen"
              text="Actividades atrasadas, sin técnico asignado, con riesgo de reincidencia o con sobrecarga operativa, clasificadas y accionables desde una sola vista."
            />
            <Shot
              image={landingAiSummary}
              alt="Resumen ejecutivo inteligente de LubriPlan"
              kicker="Lectura ejecutiva con IA"
              title="Diagnóstico automático con prioridades accionables"
              text="La IA analiza la operación del mes, detecta patrones, identifica riesgos y entrega recomendaciones con el contexto de la planta."
            />
          </div>
        </div>
      </section>

      {/* Asistente técnico */}
      <section className="lpl-section">
        <div className="lpl-container lpl-two lpl-two-top">
          <div>
            <SectionLabel index="07" text="Asistente técnico" />
            <h2 className="lpl-h2">Herramientas técnicas integradas en la plataforma</h2>
            <p className="lpl-text">
              LubriPlan incluye un asistente técnico con utilidades prácticas para tomar decisiones
              de lubricación, validar compatibilidades y resolver conversiones sin salir del sistema.
            </p>
            <div className="lpl-note">
              <div className="lpl-note-title">Criterio técnico más consistente</div>
              <div className="lpl-note-text">
                Reduce consultas dispersas, agiliza las definiciones en campo y alinea el criterio
                técnico entre supervisión y ejecución.
              </div>
            </div>
          </div>
          <div className="lpl-grid-2">
            {TECHNICAL_TOOLS.map((t) => (
              <div key={t.title} className="lpl-card">
                <div className="lpl-icon-box"><Icon name="tool" /></div>
                <div className="lpl-card-title">{t.title}</div>
                <div className="lpl-card-text">{t.text}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LubriPlan Card */}
      <section className="lpl-section lpl-section-alt">
        <div className="lpl-container lpl-two">
          <div>
            <SectionLabel index="08" text="LubriPlan Card" />
            <h2 className="lpl-h2">La carta de lubricación en el bolsillo del técnico</h2>
            <p className="lpl-text">
              LubriPlan Card lleva los puntos de lubricación de cada equipo directo al campo. El
              técnico escanea el código QR del equipo y en segundos ve la imagen con los puntos
              marcados, el lubricante, la cantidad, la frecuencia y el método, sin iniciar sesión
              ni instalar nada.
            </p>
            <ul className="lpl-list">
              {CARD_FEATURES.map((f) => <li key={f}>{f}</li>)}
            </ul>
            <div className="lpl-actions">
              <a href="https://card.lubriplan.com" target="_blank" rel="noreferrer" className="lpl-btn lpl-btn-primary">
                Abrir LubriPlan Card
              </a>
              <button type="button" onClick={openDemo} className="lpl-btn lpl-btn-outline">Solicitar acceso</button>
            </div>
          </div>
          <InteractiveCardMock />
        </div>
      </section>

      {/* Alcance */}
      <section className="lpl-section">
        <div className="lpl-container">
          <div className="lpl-head">
            <SectionLabel index="09" text="Alcance" />
            <h2 className="lpl-h2">Para quién es y qué incluye</h2>
          </div>
          <div className="lpl-scope">
            <div className="lpl-scope-col">
              <div className="lpl-scope-title">Roles</div>
              <ul className="lpl-list">{AUDIENCES.map((a) => <li key={a}>{a}</li>)}</ul>
            </div>
            <div className="lpl-scope-col">
              <div className="lpl-scope-title">Industrias</div>
              <ul className="lpl-list">{INDUSTRIES.map((a) => <li key={a}>{a}</li>)}</ul>
            </div>
            <div className="lpl-scope-col">
              <div className="lpl-scope-title">Módulos incluidos</div>
              <div className="lpl-tags">{MODULES.map((m) => <span key={m} className="lpl-tag">{m}</span>)}</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="contacto" className="lpl-cta">
        <div className="lpl-container">
          <div className="lpl-cta-box">
            <div className="lpl-hazard" />
            <div className="lpl-cta-inner">
              <div>
                <SectionLabel index="10" text="Siguiente paso" />
                <h2 className="lpl-h2">¿Tu planta sigue controlando la lubricación con Excel o papel?</h2>
                <p className="lpl-text">
                  LubriPlan es la base operativa para ejecutar con orden, anticipar riesgos y demostrar
                  control con datos reales. Solicita una demo y evalúalo en tu operación.
                </p>
              </div>
              <div className="lpl-cta-side">
                <button type="button" onClick={openDemo} className="lpl-btn lpl-btn-primary">
                  Solicitar demo <Icon name="arrowRight" size="sm" />
                </button>
                <span className="lpl-mail">Te respondemos a la brevedad para agendar tu demo.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="lpl-footer">
        <div className="lpl-container lpl-footer-inner">
          <span>© {year} LubriPlan · Software de gestión de lubricación industrial</span>
          <div className="lpl-footer-links">
            <a href="#como-funciona">Cómo funciona</a>
            <Link to="/card">LubriPlan Card</Link>
            <Link to="/login">Entrar</Link>
          </div>
        </div>
      </footer>

      <LandingChatWidget />
      <DemoRequestModal open={demoOpen} onClose={closeDemo} source="landing" />
    </div>
  );
}

/* =========================
   Componentes
   ========================= */

function SectionLabel({ index, text }) {
  return (
    <div className="lpl-label">
      <span className="lpl-label-index">{index}</span>
      <span className="lpl-label-bar" />
      {text}
    </div>
  );
}

function Spec({ icon, text }) {
  return (
    <span className="lpl-spec">
      <span className="lpl-spec-icon"><Icon name={icon} size="sm" /></span>
      {text}
    </span>
  );
}

function Shot({ image, alt, kicker, title, text }) {
  return (
    <div className="lpl-shot">
      <div className="lpl-shot-img">
        <img src={image} alt={alt} loading="lazy" />
      </div>
      <div className="lpl-shot-meta">
        <div className="lpl-label">{kicker}</div>
        <div className="lpl-card-title">{title}</div>
        <div className="lpl-card-text">{text}</div>
      </div>
    </div>
  );
}

const CARD_POINTS = [
  {
    n: 1, color: "#ef4444", bg: "rgba(239,68,68,0.12)", x: 22, y: 38,
    nombre: "Cojinete delantero del rotor", lubricante: "Shell Omala S2 G 220",
    cantidad: "15 ml", frecuencia: "Diaria", metodo: "Aceitera",
  },
  {
    n: 2, color: "#f97316", bg: "rgba(249,115,22,0.12)", x: 62, y: 38,
    nombre: "Cojinete trasero del rotor", lubricante: "Mobil SHC 220",
    cantidad: "15 ml", frecuencia: "Semanal", metodo: "Aceitera",
  },
  {
    n: 3, color: "#eab308", bg: "rgba(234,179,8,0.12)", x: 48, y: 66,
    nombre: "Caja de engranes", lubricante: "Castrol Tribol 1100/220",
    cantidad: "250 ml", frecuencia: "Mensual", metodo: "Manual",
  },
  {
    n: 4, color: "#22c55e", bg: "rgba(34,197,94,0.12)", x: 80, y: 54,
    nombre: "Sistema de válvulas", lubricante: "AeroShell Grease 7",
    cantidad: "5 g", frecuencia: "Trimestral", metodo: "Pistola de engrase",
  },
];

function InteractiveCardMock() {
  const [active, setActive] = useState(null);
  const toggle = (n) => setActive((cur) => (cur === n ? null : n));

  return (
    <div className="lpl-corners">
      <div className="lpl-mock" aria-label="Ejemplo de carta de lubricación">
        <div className="lpl-mock-head">
          <div className="lpl-icon-box"><Icon name="doc" /></div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>LubriPlan Card</div>
            <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 2 }}>Carta de lubricación · ejemplo</div>
          </div>
          <span className="lpl-chip" style={{ marginLeft: "auto" }}>Campo</span>
        </div>

        <div className="lpl-mock-equip">
          <div className="lpl-mock-code">CMP-001</div>
          <div style={{ fontSize: 15, fontWeight: 700, marginTop: 4 }}>Compresor de tornillo KAESER SK-19</div>
          <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 3 }}>Sala de compresores</div>
        </div>

        <div className="lpl-mock-image">
          <span className="lpl-mock-hint">Toca o pasa el cursor sobre los puntos</span>
          {CARD_POINTS.map((p) => {
            const isActive = active === p.n;
            const showAbove = p.y > 45;
            const align = p.x < 30 ? "left" : p.x > 70 ? "right" : "center";
            return (
              <button
                type="button"
                key={p.n}
                className="lpl-mock-dot"
                aria-label={`Punto ${p.n}: ${p.nombre}`}
                onMouseEnter={() => setActive(p.n)}
                onMouseLeave={() => setActive(null)}
                onClick={() => toggle(p.n)}
                style={{
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  background: p.color,
                  borderColor: isActive ? "rgba(255,255,255,0.85)" : undefined,
                  boxShadow: isActive ? `0 0 0 6px ${p.color}40, 0 0 18px ${p.color}` : `0 0 10px ${p.color}80`,
                  zIndex: isActive ? 30 : 10,
                }}
              >
                {p.n}
                {isActive && (
                  <span
                    className="lpl-mock-tip"
                    style={{
                      ...(showAbove ? { bottom: "calc(100% + 12px)" } : { top: "calc(100% + 12px)" }),
                      ...(align === "left" ? { left: 0 } : align === "right" ? { right: 0 } : { left: "50%", transform: "translateX(-50%)" }),
                      borderTop: `2px solid ${p.color}`,
                    }}
                  >
                    <span style={{ display: "block", color: p.color, fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.12em" }}>
                      PUNTO {p.n}
                    </span>
                    <span style={{ display: "block", color: "var(--text)", fontSize: 13, fontWeight: 700, marginTop: 3 }}>
                      {p.nombre}
                    </span>
                    {[["Lubricante", p.lubricante], ["Cantidad", p.cantidad], ["Método", p.metodo], ["Frecuencia", p.frecuencia]].map(([k, v]) => (
                      <span key={k} style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 6, fontSize: 11 }}>
                        <span style={{ color: "var(--dim)" }}>{k}</span>
                        <span style={{ color: "#cbd5e1", fontWeight: 700, textAlign: "right" }}>{v}</span>
                      </span>
                    ))}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          {CARD_POINTS.slice(0, 3).map((p) => {
            const isActive = active === p.n;
            return (
              <div
                key={p.n}
                className="lpl-mock-row"
                onMouseEnter={() => setActive(p.n)}
                onMouseLeave={() => setActive(null)}
                style={isActive ? { background: p.bg, borderColor: `${p.color}55` } : undefined}
              >
                <span style={{ display: "grid", placeItems: "center", width: 24, height: 24, borderRadius: "50%", background: p.color, color: "#0a0c0f", fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
                  {p.n}
                </span>
                <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600 }}>
                  {p.nombre}
                  {isActive && (
                    <span style={{ display: "block", fontSize: 11, color: "var(--dim)", marginTop: 2 }}>
                      {p.lubricante} · {p.cantidad}
                    </span>
                  )}
                </span>
                <span style={{ padding: "3px 9px", borderRadius: 4, fontSize: 11, fontWeight: 700, color: p.color, background: p.bg }}>
                  {p.frecuencia}
                </span>
              </div>
            );
          })}
        </div>

        <div className="lpl-mock-qr">
          <svg viewBox="0 0 21 21" width="44" height="44" fill="none" aria-hidden="true">
            <rect x="1" y="1" width="8" height="8" rx="1" fill="#f97316" />
            <rect x="3" y="3" width="4" height="4" fill="#0a0c0f" />
            <rect x="12" y="1" width="8" height="8" rx="1" fill="#f97316" />
            <rect x="14" y="3" width="4" height="4" fill="#0a0c0f" />
            <rect x="1" y="12" width="8" height="8" rx="1" fill="#f97316" />
            <rect x="3" y="14" width="4" height="4" fill="#0a0c0f" />
            <rect x="12" y="12" width="2" height="2" fill="#f97316" />
            <rect x="15" y="12" width="2" height="2" fill="#f97316" />
            <rect x="18" y="12" width="2" height="2" fill="#f97316" />
            <rect x="12" y="15" width="2" height="2" fill="#f97316" />
            <rect x="15" y="15" width="5" height="5" rx="0.5" fill="#f97316" />
          </svg>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#fdba74" }}>Escanea para acceder</div>
            <div style={{ fontSize: 11, color: "var(--dim)", marginTop: 3, fontFamily: "var(--mono)", wordBreak: "break-all" }}>
              card.lubriplan.com?equipo=CMP-001
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
