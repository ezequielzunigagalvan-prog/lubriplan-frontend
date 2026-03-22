import React, { useMemo } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Icon } from "../components/ui/lpIcons";
import lubriPlanLogo from "../assets/lubriplan-logo.png.png";

const EXEC_DISPLAY_FONT = '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif';
const EXEC_TEXT_FONT = '"Aptos", "Segoe UI", "Helvetica Neue", Arial, sans-serif';

export default function LubriPlanLanding() {
  const { isAuthenticated } = useAuth();

  const signals = useMemo(
    () => [
      {
        icon: "route",
        title: "Rutas bajo control",
        text: "Estructura frecuencias, puntos, método y responsables sin depender de hojas dispersas.",
      },
      {
        icon: "checkCircle",
        title: "Ejecución trazable",
        text: "Cada actividad queda respaldada con técnico, condición, evidencia y consumo real.",
      },
      {
        icon: "trendUp",
        title: "Visibilidad ejecutiva",
        text: "Dashboards, alertas y reportes conectados para decidir con contexto operativo real.",
      },
      {
        icon: "drop",
        title: "Inventario conectado",
        text: "El consumo de lubricantes conversa con la operación y anticipa riesgo de desabasto.",
      },
    ],
    []
  );

  const pillars = useMemo(
    () => [
      {
        icon: "building",
        title: "Diseñado para planta",
        text: "Pensado para mantenimiento, supervisión y ejecución en campo, no para un flujo genérico de oficina.",
      },
      {
        icon: "alert",
        title: "Prioridad operativa inmediata",
        text: "El sistema responde qué está mal, qué sigue y qué requiere atención antes de entrar al análisis.",
      },
      {
        icon: "doc",
        title: "Historial defendible",
        text: "Cada acción deja trazabilidad útil para auditoría, seguimiento interno y toma de decisiones.",
      },
      {
        icon: "spark",
        title: "Base lista para IA",
        text: "Toda la estructura ya esta preparada para resúmenes ejecutivos, alertas predictivas y recomendaciones.",
      },
      {
        icon: "users",
        title: "Trabajo por rol",
        text: "Administrador, supervisor y técnico ven lo que necesitan para actuar, no una misma pantalla para todos.",
      },
      {
        icon: "shield",
        title: "Control multi-planta",
        text: "Cada planta conserva su contexto, sus datos y sus alertas sin mezclar operación entre sitios.",
      },
    ],
    []
  );

  const journey = useMemo(
    () => [
      {
        n: "01",
        title: "Estandarizas la lubricación",
        text: "Configuras equipos, rutas, frecuencias, cantidades y criterios operativos sobre una sola base.",
      },
      {
        n: "02",
        title: "La operación se ordena sola",
        text: "LubriPlan genera actividades, separa prioridades y mantiene visible lo vencido y lo crítico.",
      },
      {
        n: "03",
        title: "Campo registra con contexto",
        text: "El técnico ejecuta con instrucciones claras, evidencia y captura del consumo real aplicado.",
      },
      {
        n: "04",
        title: "Mantenimiento toma mejores decisiones",
        text: "La jefatura recibe indicadores, alertas y reportes listos para priorizar y corregir a tiempo.",
      },
    ],
    []
  );

  const audiences = useMemo(
    () => ["Manufactura", "Automotriz", "Metalmecánica", "Alimentos", "Energía", "Plantas industriales"],
    []
  );

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div style={page}>
      <section style={heroSection}>
        <div style={heroBackdropA} />
        <div style={heroBackdropB} />

        <header style={topBar}>
          <div style={brandWrap}>
            <div style={brandMarkWrap}>
              <img src={lubriPlanLogo} alt="LubriPlan" style={brandMark} />
            </div>
            <div>
              <div style={brandTitle}>LubriPlan</div>
              <div style={brandSub}>Gestión industrial de lubricación</div>
            </div>
          </div>

          <div style={topActions}>
            <a href="#arquitectura" style={topLink}>Cómo funciona</a>
            <a href="#capacidad" style={topLink}>Capacidades</a>
            <Link to="/login" style={topButton}>Entrar</Link>
          </div>
        </header>

        <div style={heroGrid}>
          <div style={{ minWidth: 0, position: "relative", zIndex: 2 }}>
            <div style={eyebrow}>OPERACIÓN INDUSTRIAL CON TRAZABILIDAD REAL</div>
            <h1 style={heroTitle}>
              La plataforma que convierte la lubricación en una operación controlada, visible y defendible
            </h1>
            <p style={heroText}>
              LubriPlan conecta rutas, ejecución en campo, inventario, alertas y análisis ejecutivo para que mantenimiento deje de perseguir pendientes y empiece a operar con control real.
            </p>

            <div style={heroActions}>
              <Link to="/login" style={btnPrimary}>
                Entrar a LubriPlan
              </Link>
              <a href="#arquitectura" style={btnGhost}>
                Ver recorrido
              </a>
            </div>

            <div style={heroStatsRow}>
              <MicroStat icon="checkCircle" label="Trazabilidad por actividad" />
              <MicroStat icon="alert" label="Prioridad operativa inmediata" />
              <MicroStat icon="trendUp" label="Indicadores para supervisi�n" />
            </div>
          </div>

          <div style={heroPanel}>
            <div style={heroPanelHead}>
              <div>
                <div style={heroPanelKicker}>Vista operativa</div>
                <div style={heroPanelTitle}>Lo que un jefe de mantenimiento necesita ver primero</div>
              </div>
              <span style={panelBadge}>Tiempo real</span>
            </div>

            <div style={heroMetricGrid}>
              <MetricCard value="98%" label="Cumplimiento" tone="green" />
              <MetricCard value="12" label="Pendientes hoy" tone="amber" />
              <MetricCard value="3" label="Equipos críticos" tone="red" />
              <MetricCard value="24" label="Rutas activas" tone="blue" />
            </div>

            <div style={feedCardStrong}>
              <div style={feedTopRow}>
                <div style={feedLabel}>Prioridad de hoy</div>
                <span style={feedChipRed}>Crítica</span>
              </div>
              <div style={feedTitle}>Prensa principal con actividad vencida y condición crítica abierta</div>
              <div style={feedMeta}>Acción sugerida: ejecutar, validar condición y confirmar consumo real.</div>
            </div>

            <div style={feedSplitGrid}>
              <div style={feedCardSoft}>
                <div style={feedTopRow}>
                  <div style={feedLabel}>Inventario</div>
                  <span style={feedChipAmber}>Riesgo</span>
                </div>
                <div style={feedMiniText}>Grasa alta temperatura con cobertura limitada para los próximos días.</div>
              </div>
              <div style={feedCardSoft}>
                <div style={feedTopRow}>
                  <div style={feedLabel}>Seguimiento</div>
                  <span style={feedChipBlue}>IA lista</span>
                </div>
                <div style={feedMiniText}>El sistema ya prepara resúmenes, prioridades y señales predictivas para decisión ejecutiva.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={stripSection}>
        <div style={stripGrid}>
          {signals.map((item) => (
            <SignalCard key={item.title} {...item} />
          ))}
        </div>
      </section>

      <section style={section}>
        <div style={splitSectionGrid}>
          <div style={sectionIntroBlock}>
            <div style={sectionKicker}>EL PROBLEMA OPERATIVO</div>
            <h2 style={sectionTitle}>La lubricación se vuelve riesgosa cuando depende de seguimiento informal</h2>
            <p style={sectionText}>
              Cuando la ejecución vive entre papel, mensajes, Excel o memoria operativa, los pendientes se mezclan, las prioridades no son claras y el inventario deja de representar lo que realmente pasa en planta.
            </p>
          </div>

          <div style={problemBoard}>
            <ProblemLine icon="warn" text="Actividades vencidas que nadie ve a tiempo" />
            <ProblemLine icon="xCircle" text="Sobrelubricación o falta de lubricación por ejecución inconsistente" />
            <ProblemLine icon="search" text="Sin trazabilidad clara por equipo, técnico y condición" />
            <ProblemLine icon="drop" text="Inventario que no conversa con el consumo real" />
            <ProblemLine icon="trendDown" text="Decisiones reactivas y poca visibilidad ejecutiva" />
          </div>
        </div>
      </section>

      <section id="capacidad" style={sectionAlt}>
        <div style={sectionHeadWide}>
          <div style={sectionKicker}>CAPACIDADES CLAVE</div>
          <h2 style={sectionTitle}>Una sola plataforma para planear, ejecutar, alertar y dirigir</h2>
          <p style={sectionText}>
            LubriPlan no es solo una bitácora bonita: es una capa de control para la lubricación industrial, pensada para sostener operación diaria y lectura ejecutiva al mismo tiempo.
          </p>
        </div>

        <div style={pillarsGrid}>
          {pillars.map((item) => (
            <FeatureCard key={item.title} {...item} />
          ))}
        </div>
      </section>

      <section id="arquitectura" style={section}>
        <div style={sectionHeadWide}>
          <div style={sectionKicker}>RECORRIDO OPERATIVO</div>
          <h2 style={sectionTitle}>De la planeación a la visibilidad ejecutiva, sin perder continuidad</h2>
        </div>

        <div style={journeyGrid}>
          {journey.map((item) => (
            <JourneyCard key={item.n} {...item} />
          ))}
        </div>
      </section>

      <section style={sectionAlt}>
        <div style={compareShell}>
          <div style={compareColumnBad}>
            <div style={compareHeadBad}>Operación sin sistema</div>
            <CompareRow bad text="Excel, papel o seguimiento por mensajes" />
            <CompareRow bad text="Prioridades poco visibles para supervisión" />
            <CompareRow bad text="Historial incompleto o difícil de defender" />
            <CompareRow bad text="Inventario separado de la ejecución real" />
          </div>

          <div style={compareColumnGood}>
            <div style={compareHeadGood}>Operación con LubriPlan</div>
            <CompareRow good text="Rutas, actividades y evidencia centralizadas" />
            <CompareRow good text="Dashboards por rol con foco operativo inmediato" />
            <CompareRow good text="Historial completo por equipo, técnico y condición" />
            <CompareRow good text="Inventario conectado con consumo y alertas" />
          </div>
        </div>
      </section>

      <section style={section}>
        <div style={sectionHeadWide}>
          <div style={sectionKicker}>ENFOQUE INDUSTRIAL</div>
          <h2 style={sectionTitle}>Pensado para plantas que necesitan orden operativo, no solo visualización</h2>
        </div>
        <div style={audienceWrap}>
          {audiences.map((item) => (
            <span key={item} style={audiencePill}>{item}</span>
          ))}
        </div>
      </section>

      <section style={ctaSection}>
        <div style={ctaBox}>
          <div style={ctaGlow} />
          <div style={sectionKicker}>LISTO PARA ENTRAR</div>
          <h2 style={ctaTitle}>Empieza a operar con una base seria para la lubricación industrial</h2>
          <p style={ctaText}>
            Si tu equipo ya trabaja dentro de LubriPlan, entra ahora. Si estás evaluando la solución, esta misma estructura está diseñada para convertirse en el centro operativo de la lubricación dentro de tu planta.
          </p>
          <div style={heroActions}>
            <Link to="/login" style={btnPrimary}>Ir a Login</Link>
            <a href="#arquitectura" style={btnGhostDark}>Ver capacidades</a>
          </div>
        </div>
      </section>
    </div>
  );
}

function MicroStat({ icon, label }) {
  return (
    <span style={microStat}>
      <span style={microIcon}><Icon name={icon} size="sm" /></span>
      {label}
    </span>
  );
}

function MetricCard({ value, label, tone = "blue" }) {
  const color =
    tone === "green"
      ? "#22c55e"
      : tone === "red"
      ? "#ef4444"
      : tone === "amber"
      ? "#f59e0b"
      : "#60a5fa";

  return (
    <div style={metricCard}>
      <div style={{ ...metricValue, color }}>{value}</div>
      <div style={metricLabel}>{label}</div>
    </div>
  );
}

function SignalCard({ icon, title, text }) {
  return (
    <div style={signalCard}>
      <div style={signalIcon}><Icon name={icon} /></div>
      <div>
        <div style={signalTitle}>{title}</div>
        <div style={signalText}>{text}</div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, text }) {
  return (
    <div style={featureCard}>
      <div style={featureIcon}><Icon name={icon} /></div>
      <div style={featureTitle}>{title}</div>
      <div style={featureText}>{text}</div>
    </div>
  );
}

function JourneyCard({ n, title, text }) {
  return (
    <div style={journeyCard}>
      <div style={journeyNumber}>{n}</div>
      <div style={journeyTitle}>{title}</div>
      <div style={journeyText}>{text}</div>
    </div>
  );
}

function ProblemLine({ icon, text }) {
  return (
    <div style={problemLine}>
      <div style={problemLineIcon}><Icon name={icon} /></div>
      <div style={problemLineText}>{text}</div>
    </div>
  );
}

function CompareRow({ text, bad = false, good = false }) {
  return (
    <div style={compareRow}>
      <span
        style={{
          ...compareDot,
          background: bad ? "#ef4444" : good ? "#22c55e" : "#94a3b8",
          boxShadow: bad
            ? "0 0 0 6px rgba(239,68,68,0.12)"
            : good
            ? "0 0 0 6px rgba(34,197,94,0.12)"
            : "0 0 0 6px rgba(148,163,184,0.12)",
        }}
      />
      <span>{text}</span>
    </div>
  );
}

const page = {
  background: "radial-gradient(circle at 14% 12%, rgba(249,115,22,0.18), transparent 24%), radial-gradient(circle at 84% 18%, rgba(234,88,12,0.14), transparent 22%), linear-gradient(180deg, #0b1220 0%, #111827 46%, #0f172a 100%)",
  color: "#fff",
  fontFamily: EXEC_TEXT_FONT,
  overflow: "hidden",
};

const heroSection = {
  position: "relative",
  maxWidth: 1320,
  margin: "0 auto",
  padding: "26px 24px 54px",
};

const heroBackdropA = {
  position: "absolute",
  width: 420,
  height: 420,
  borderRadius: 999,
  background: "radial-gradient(circle, rgba(249,115,22,0.14), transparent 70%)",
  top: -140,
  right: -120,
  pointerEvents: "none",
};

const heroBackdropB = {
  position: "absolute",
  width: 360,
  height: 360,
  borderRadius: 999,
  background: "radial-gradient(circle, rgba(56,189,248,0.08), transparent 70%)",
  bottom: -160,
  left: -120,
  pointerEvents: "none",
};

const topBar = {
  position: "relative",
  zIndex: 2,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 18,
  padding: "10px 0 22px",
  flexWrap: "wrap",
};

const brandWrap = {
  display: "flex",
  alignItems: "center",
  gap: 14,
};

const brandMarkWrap = {
  width: 72,
  height: 72,
  borderRadius: 24,
  background: "linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.05))",
  border: "1px solid rgba(255,255,255,0.10)",
  display: "grid",
  placeItems: "center",
  boxShadow: "0 24px 40px rgba(2,6,23,0.25)",
  flexShrink: 0,
};

const brandMark = {
  width: 54,
  height: 54,
  objectFit: "contain",
  display: "block",
};

const brandTitle = {
  fontFamily: EXEC_DISPLAY_FONT,
  fontSize: 28,
  lineHeight: 1,
  fontWeight: 700,
  letterSpacing: -0.8,
};

const brandSub = {
  marginTop: 6,
  color: "rgba(226,232,240,0.78)",
  fontSize: 13,
  fontWeight: 800,
  letterSpacing: 0.4,
};

const topActions = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
};

const topLink = {
  color: "#e2e8f0",
  textDecoration: "none",
  fontSize: 14,
  fontWeight: 800,
  padding: "10px 0",
};

const topButton = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
  background: "rgba(255,255,255,0.08)",
  color: "#fff",
  padding: "12px 16px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.14)",
  fontWeight: 900,
};

const heroGrid = {
  position: "relative",
  zIndex: 2,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 360px), 1fr))",
  gap: 26,
  alignItems: "center",
};

const eyebrow = {
  display: "inline-block",
  padding: "9px 14px",
  borderRadius: 999,
  background: "rgba(249,115,22,0.14)",
  border: "1px solid rgba(249,115,22,0.22)",
  fontSize: 12,
  fontWeight: 900,
  letterSpacing: 1.1,
  color: "#fdba74",
  marginBottom: 18,
};

const heroTitle = {
  margin: 0,
  fontFamily: EXEC_DISPLAY_FONT,
  fontSize: "clamp(2.8rem, 6vw, 5rem)",
  lineHeight: 0.95,
  letterSpacing: -1.8,
  maxWidth: 760,
};

const heroText = {
  marginTop: 18,
  maxWidth: 720,
  fontSize: 17,
  lineHeight: 1.72,
  color: "rgba(226,232,240,0.90)",
  fontWeight: 600,
};

const heroActions = {
  marginTop: 28,
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
};

const btnPrimary = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
  background: "linear-gradient(135deg, #fb923c 0%, #f97316 100%)",
  color: "#0f172a",
  padding: "15px 20px",
  borderRadius: 16,
  fontWeight: 950,
  border: "1px solid rgba(251,146,60,0.9)",
  boxShadow: "0 18px 34px rgba(249,115,22,0.24)",
};

const btnGhost = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
  background: "rgba(255,255,255,0.05)",
  color: "#fff",
  padding: "15px 20px",
  borderRadius: 16,
  fontWeight: 900,
  border: "1px solid rgba(255,255,255,0.12)",
};

const btnGhostDark = {
  ...btnGhost,
  background: "rgba(255,255,255,0.08)",
};

const heroStatsRow = {
  marginTop: 22,
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
};

const microStat = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 12px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#e2e8f0",
  fontSize: 12,
  fontWeight: 900,
};

const microIcon = {
  display: "grid",
  placeItems: "center",
  color: "#fb923c",
};

const heroPanel = {
  borderRadius: 28,
  padding: 20,
  background: "linear-gradient(180deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.04) 100%)",
  border: "1px solid rgba(255,255,255,0.10)",
  boxShadow: "0 24px 60px rgba(2,6,23,0.32)",
  backdropFilter: "blur(10px)",
};

const heroPanelHead = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 16,
  marginBottom: 16,
  flexWrap: "wrap",
};

const heroPanelKicker = {
  fontSize: 12,
  fontWeight: 900,
  letterSpacing: 0.9,
  color: "#fdba74",
  textTransform: "uppercase",
};

const heroPanelTitle = {
  marginTop: 6,
  fontSize: 22,
  lineHeight: 1.18,
  fontWeight: 900,
  maxWidth: 360,
};

const panelBadge = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "8px 12px",
  borderRadius: 999,
  background: "rgba(34,197,94,0.14)",
  color: "#bbf7d0",
  border: "1px solid rgba(34,197,94,0.24)",
  fontSize: 11,
  fontWeight: 950,
};

const heroMetricGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 12,
};

const metricCard = {
  borderRadius: 18,
  padding: 16,
  background: "rgba(15,23,42,0.78)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const metricValue = {
  fontSize: 30,
  fontWeight: 1000,
  lineHeight: 1,
};

const metricLabel = {
  marginTop: 7,
  fontSize: 12,
  fontWeight: 900,
  letterSpacing: 0.8,
  textTransform: "uppercase",
  color: "#94a3b8",
};

const feedCardStrong = {
  marginTop: 14,
  padding: 16,
  borderRadius: 20,
  background: "linear-gradient(180deg, rgba(15,23,42,0.84), rgba(15,23,42,0.72))",
  border: "1px solid rgba(255,255,255,0.08)",
};

const feedSplitGrid = {
  marginTop: 12,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 12,
};

const feedCardSoft = {
  padding: 14,
  borderRadius: 18,
  background: "rgba(15,23,42,0.62)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const feedTopRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap",
};

const feedLabel = {
  fontSize: 12,
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: 0.8,
  color: "#cbd5e1",
};

const feedTitle = {
  marginTop: 10,
  fontSize: 17,
  lineHeight: 1.42,
  fontWeight: 900,
};

const feedMeta = {
  marginTop: 8,
  fontSize: 13,
  lineHeight: 1.55,
  color: "#cbd5e1",
  fontWeight: 700,
};

const feedMiniText = {
  marginTop: 8,
  color: "#cbd5e1",
  fontSize: 13,
  lineHeight: 1.55,
  fontWeight: 700,
};

const feedChipRed = {
  padding: "6px 10px",
  borderRadius: 999,
  background: "rgba(239,68,68,0.14)",
  color: "#fecaca",
  border: "1px solid rgba(239,68,68,0.24)",
  fontSize: 11,
  fontWeight: 950,
};

const feedChipAmber = {
  padding: "6px 10px",
  borderRadius: 999,
  background: "rgba(245,158,11,0.14)",
  color: "#fde68a",
  border: "1px solid rgba(245,158,11,0.24)",
  fontSize: 11,
  fontWeight: 950,
};

const feedChipBlue = {
  padding: "6px 10px",
  borderRadius: 999,
  background: "rgba(59,130,246,0.14)",
  color: "#bfdbfe",
  border: "1px solid rgba(59,130,246,0.24)",
  fontSize: 11,
  fontWeight: 950,
};

const stripSection = {
  maxWidth: 1320,
  margin: "0 auto",
  padding: "0 24px 18px",
};

const stripGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 14,
};

const signalCard = {
  display: "flex",
  gap: 14,
  alignItems: "flex-start",
  padding: 18,
  borderRadius: 22,
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 18px 40px rgba(2,6,23,0.12)",
};

const signalIcon = {
  width: 46,
  height: 46,
  borderRadius: 16,
  background: "rgba(249,115,22,0.14)",
  color: "#fb923c",
  display: "grid",
  placeItems: "center",
  flexShrink: 0,
};

const signalTitle = {
  fontSize: 16,
  fontWeight: 950,
};

const signalText = {
  marginTop: 6,
  color: "#cbd5e1",
  fontSize: 13,
  lineHeight: 1.55,
  fontWeight: 700,
};

const section = {
  maxWidth: 1320,
  margin: "0 auto",
  padding: "34px 24px",
};

const sectionAlt = {
  maxWidth: 1320,
  margin: "0 auto",
  padding: "34px 24px",
};

const splitSectionGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
  gap: 18,
  alignItems: "stretch",
};

const sectionIntroBlock = {
  padding: 24,
  borderRadius: 28,
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const sectionHeadWide = {
  maxWidth: 860,
  marginBottom: 24,
};

const sectionKicker = {
  fontSize: 12,
  fontWeight: 950,
  letterSpacing: 1.05,
  color: "#fb923c",
  textTransform: "uppercase",
  marginBottom: 10,
};

const sectionTitle = {
  margin: 0,
  fontFamily: EXEC_DISPLAY_FONT,
  fontSize: "clamp(2rem, 4vw, 3rem)",
  lineHeight: 1,
  letterSpacing: -1.1,
};

const sectionText = {
  marginTop: 14,
  color: "#cbd5e1",
  fontSize: 16,
  lineHeight: 1.65,
  fontWeight: 600,
};

const problemBoard = {
  padding: 20,
  borderRadius: 28,
  background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.04))",
  border: "1px solid rgba(255,255,255,0.08)",
  display: "grid",
  gap: 12,
};

const problemLine = {
  display: "flex",
  gap: 12,
  alignItems: "center",
  padding: "14px 14px",
  borderRadius: 18,
  background: "rgba(15,23,42,0.56)",
  border: "1px solid rgba(255,255,255,0.06)",
};

const problemLineIcon = {
  width: 42,
  height: 42,
  borderRadius: 14,
  background: "rgba(239,68,68,0.14)",
  color: "#fca5a5",
  display: "grid",
  placeItems: "center",
  flexShrink: 0,
};

const problemLineText = {
  fontWeight: 900,
  lineHeight: 1.45,
};

const pillarsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 14,
};

const featureCard = {
  padding: 20,
  borderRadius: 22,
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const featureIcon = {
  width: 50,
  height: 50,
  borderRadius: 16,
  display: "grid",
  placeItems: "center",
  background: "rgba(249,115,22,0.15)",
  color: "#fb923c",
  marginBottom: 14,
};

const featureTitle = {
  fontSize: 18,
  fontWeight: 950,
};

const featureText = {
  marginTop: 8,
  color: "#cbd5e1",
  fontSize: 14,
  lineHeight: 1.6,
  fontWeight: 700,
};

const journeyGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 14,
};

const journeyCard = {
  padding: 20,
  borderRadius: 24,
  background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.04))",
  border: "1px solid rgba(255,255,255,0.08)",
};

const journeyNumber = {
  fontSize: 34,
  lineHeight: 1,
  fontWeight: 1000,
  color: "#fb923c",
};

const journeyTitle = {
  marginTop: 12,
  fontSize: 19,
  lineHeight: 1.2,
  fontWeight: 950,
};

const journeyText = {
  marginTop: 8,
  color: "#cbd5e1",
  fontSize: 14,
  lineHeight: 1.6,
  fontWeight: 700,
};

const compareShell = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 14,
};

const compareColumnBad = {
  padding: 22,
  borderRadius: 24,
  background: "rgba(127,29,29,0.14)",
  border: "1px solid rgba(248,113,113,0.18)",
};

const compareColumnGood = {
  padding: 22,
  borderRadius: 24,
  background: "rgba(20,83,45,0.16)",
  border: "1px solid rgba(74,222,128,0.18)",
};

const compareHeadBad = {
  fontSize: 20,
  fontWeight: 950,
  color: "#fca5a5",
  marginBottom: 14,
};

const compareHeadGood = {
  fontSize: 20,
  fontWeight: 950,
  color: "#86efac",
  marginBottom: 14,
};

const compareRow = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "12px 0",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  color: "#f8fafc",
  fontWeight: 800,
  lineHeight: 1.4,
};

const compareDot = {
  width: 10,
  height: 10,
  borderRadius: 999,
  flexShrink: 0,
};

const audienceWrap = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
};

const audiencePill = {
  padding: "11px 15px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#e2e8f0",
  fontSize: 13,
  fontWeight: 900,
};

const ctaSection = {
  maxWidth: 1320,
  margin: "0 auto",
  padding: "20px 24px 72px",
};

const ctaBox = {
  position: "relative",
  overflow: "hidden",
  padding: "30px 24px",
  borderRadius: 30,
  background: "linear-gradient(135deg, rgba(249,115,22,0.18) 0%, rgba(15,23,42,0.80) 45%, rgba(15,23,42,0.92) 100%)",
  border: "1px solid rgba(249,115,22,0.22)",
  boxShadow: "0 24px 70px rgba(2,6,23,0.28)",
};

const ctaGlow = {
  position: "absolute",
  width: 340,
  height: 340,
  borderRadius: 999,
  top: -140,
  right: -120,
  background: "radial-gradient(circle, rgba(251,146,60,0.22), transparent 70%)",
  pointerEvents: "none",
};

const ctaTitle = {
  position: "relative",
  zIndex: 1,
  margin: 0,
  fontFamily: EXEC_DISPLAY_FONT,
  fontSize: "clamp(2rem, 4vw, 3.1rem)",
  lineHeight: 1,
  letterSpacing: -1.1,
};

const ctaText = {
  position: "relative",
  zIndex: 1,
  marginTop: 12,
  maxWidth: 760,
  color: "#e2e8f0",
  fontSize: 16,
  lineHeight: 1.65,
  fontWeight: 600,
};

