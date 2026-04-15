import React, { useMemo } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Icon } from "../components/ui/lpIcons";
import lubriPlanLogo from "../assets/lubriplan-logo.png.png";

const FONT = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const DEMO_URL = "https://www.hidrolub.com/lubriplan";
const CONTACT_EMAIL = "lubriplan@hidrolub.com";

export default function LubriPlanLanding() {
  const { isAuthenticated } = useAuth();

  const signals = useMemo(
    () => [
      {
        icon: "route",
        title: "Rutas bajo control",
        text: "Organiza frecuencias, puntos, método y responsables sin depender de hojas sueltas o seguimiento informal.",
      },
      {
        icon: "checkCircle",
        title: "Ejecución trazable",
        text: "Cada actividad queda respaldada con técnico, condición, evidencia y consumo real aplicado.",
      },
      {
        icon: "trendUp",
        title: "Visibilidad ejecutiva",
        text: "Dashboards, alertas y reportes para supervisar pendientes, vencidos y riesgos operativos reales.",
      },
      {
        icon: "drop",
        title: "Inventario conectado",
        text: "El consumo de lubricantes se conecta con la operación y ayuda a anticipar riesgo de desabasto.",
      },
    ],
    []
  );

  const capabilities = useMemo(
    () => [
      "Trabajo por rol para administrador, supervisor y técnico",
      "Historial completo por equipo, técnico y condición",
      "Inventario conectado con consumo real y alertas",
      "Base preparada para IA, lectura ejecutiva y alertas predictivas",
      "Control por planta sin mezclar datos entre operaciones",
      "Soporte para ejecución, evidencia y seguimiento operativo",
    ],
    []
  );

  const commercialWins = useMemo(
    () => [
      {
        title: "Menos atraso operativo",
        text: "Reduce actividades vencidas, evita acumulación y mejora el seguimiento diario de la lubricación.",
      },
      {
        title: "Más control en campo",
        text: "El técnico ejecuta con instrucciones, evidencia y captura de consumo en una sola experiencia.",
      },
      {
        title: "Decisión con contexto",
        text: "Supervisión y jefatura reciben alertas, lectura ejecutiva e historial útil para priorizar mejor.",
      },
    ],
    []
  );

  const modules = useMemo(
    () => [
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
      "Reportes IA",
      "PDF",
      "Multiplanta",
      "Modo offline",
      "Importar y exportar",
    ],
    []
  );

  const audiences = useMemo(
    () => [
      "Jefes de mantenimiento",
      "Supervisores",
      "Responsables de lubricación",
      "Técnicos de campo",
      "Manufactura",
      "Automotriz",
      "Metalmecánica",
      "Plantas industriales",
    ],
    []
  );

  const industries = useMemo(
    () => [
      "Manufactura",
      "Automotriz",
      "Metalmecánica",
      "Alimentos y bebidas",
      "Servicios auxiliares",
      "Plantas industriales",
    ],
    []
  );

  const journey = useMemo(
    () => [
      [
        "01",
        "Estandarizas la lubricación",
        "Configuras equipos, rutas, frecuencias, cantidades y criterios operativos sobre una base única.",
      ],
      [
        "02",
        "La operación se ordena",
        "LubriPlan genera actividades, separa prioridades y mantiene visible lo vencido, lo pendiente y lo crítico.",
      ],
      [
        "03",
        "Campo ejecuta con contexto",
        "El técnico trabaja con instrucciones claras, evidencia y captura del consumo real aplicado.",
      ],
      [
        "04",
        "Mantenimiento decide mejor",
        "La jefatura recibe indicadores, alertas y reportes para priorizar y corregir a tiempo.",
      ],
    ],
    []
  );

  const pains = useMemo(
    () => [
      "Actividades vencidas que nadie ve a tiempo",
      "Seguimiento en Excel, papel o WhatsApp",
      "Ejecución inconsistente entre técnicos",
      "Inventario separado del consumo real",
      "Poca trazabilidad por equipo, técnico y condición",
      "Dificultad para priorizar mantenimiento con datos claros",
    ],
    []
  );

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return (
    <div style={page}>
      <section style={hero}>
        <div style={glowA} />
        <div style={glowB} />

        <header style={topBar}>
          <div style={brand}>
            <div style={brandBox}>
              <img src={lubriPlanLogo} alt="LubriPlan" style={brandLogo} />
            </div>
            <div>
              <div style={brandTitle}>LubriPlan</div>
              <div style={brandSub}>Software de gestión de lubricación industrial</div>
            </div>
          </div>

          <div style={nav}>
            <a href="#como-funciona" style={navLink}>Cómo funciona</a>
            <a href="#capacidades" style={navLink}>Capacidades</a>
            <a href="#contacto" style={navLink}>Contacto</a>
            <Link to="/login" style={navBtn}>Entrar</Link>
          </div>
        </header>

        <div style={heroGrid}>
          <div>
            <div style={eyebrow}>CONTROL OPERATIVO PARA LUBRICACIÓN INDUSTRIAL</div>
            <h1 style={heroTitle}>
              Convierte la lubricación en un proceso visible, controlado y defendible
            </h1>
            <p style={heroText}>
              LubriPlan ayuda a mantenimiento a dejar atrás el seguimiento disperso y operar con una
              base única para rutas, ejecución, condición, consumo e inventario. El resultado es una
              operación más ordenada, más visible y más confiable para planta.
            </p>
            <div style={heroRoleLine}>
              Diseñado para jefes de mantenimiento, supervisores y responsables de lubricación en planta.
            </div>
            <div style={actions}>
              <a href={DEMO_URL} target="_blank" rel="noreferrer" style={btnPrimary}>Solicitar demo</a>
              <a href="#como-funciona" style={btnGhost}>Ver cómo funciona</a>
              <Link to="/login" style={btnGhostSoft}>Entrar a plataforma</Link>
            </div>
            <div style={statsRow}>
              <Tag icon="checkCircle" text="Trazabilidad por actividad" />
              <Tag icon="alert" text="Prioridad operativa inmediata" />
              <Tag icon="trendUp" text="Indicadores para supervisión" />
            </div>
          </div>

          <div style={panel}>
            <div style={panelHead}>
              <div>
                <div style={panelKicker}>Vista operativa</div>
                <div style={panelTitle}>Lo primero que mantenimiento necesita ver para actuar</div>
              </div>
              <span style={liveBadge}>Tiempo real</span>
            </div>

            <div style={metrics}>
              <MetricCard value="12" label="Actividades vencidas" tone="red" />
              <MetricCard value="7" label="Pendientes críticas" tone="amber" />
              <MetricCard value="3" label="Equipos con riesgo" tone="red" />
              <MetricCard value="24" label="Rutas activas" tone="blue" />
              <MetricCard value="92%" label="Cumplimiento" tone="green" />
            </div>

            <div style={priorityCard}>
              <div style={cardTopRow}>
                <div style={miniTitle}>Prioridad de hoy</div>
                <span style={chipRed}>Crítica</span>
              </div>
              <div style={priorityTitle}>Equipo principal con actividad vencida y condición crítica abierta</div>
              <div style={priorityText}>Acción sugerida: ejecutar, validar condición, capturar evidencia y confirmar consumo real.</div>
            </div>

            <div style={miniGrid}>
              <MiniCard title="Inventario" chip="Riesgo" chipStyle={chipAmber} text="Lubricante crítico con cobertura limitada para los próximos días." />
              <MiniCard title="Lectura ejecutiva" chip="IA lista" chipStyle={chipBlue} text="La base ya está preparada para resúmenes, prioridades y señales predictivas para decisión ejecutiva." />
            </div>
          </div>
        </div>
      </section>

      <section style={sectionTight}>
        <div style={signalGrid}>{signals.map((item) => <SignalCard key={item.title} {...item} />)}</div>
      </section>

      <section style={section}>
        <div style={sectionHead}>
          <div style={sectionKicker}>VALOR PARA EL CLIENTE INDUSTRIAL</div>
          <h2 style={sectionTitle}>Lo que LubriPlan aporta a la operación desde las primeras semanas</h2>
          <p style={sectionText}>
            No se trata solo de digitalizar formatos. Se trata de ordenar la ejecución, recuperar
            visibilidad y darle a mantenimiento una base confiable para actuar con prioridad.
          </p>
        </div>
        <div style={winGrid}>
          {commercialWins.map((item) => (
            <WinCard key={item.title} {...item} />
          ))}
        </div>
      </section>

      <section style={section}>
        <div style={sectionHead}>
          <div style={sectionKicker}>QUÉ RESUELVE LUBRIPLAN</div>
          <h2 style={sectionTitle}>Reduce desorden operativo y mejora el control real de la lubricación</h2>
          <p style={sectionText}>
            LubriPlan funciona como sistema digital para la gestión y control de actividades de lubricación,
            ayudando a ordenar la ejecución diaria, mejorar la trazabilidad y dar visibilidad a lo que pone
            en riesgo la operación.
          </p>
        </div>
        <div style={painGrid}>{pains.map((item) => <PainCard key={item} text={item} />)}</div>
      </section>

      <section style={sectionAlt}>
        <div style={twoCol}>
          <div style={glassBlock}>
            <div style={sectionKicker}>EL PROBLEMA OPERATIVO</div>
            <h2 style={sectionTitle}>La lubricación se vuelve riesgosa cuando depende de seguimiento informal</h2>
            <p style={sectionText}>
              Cuando la gestión de lubricación vive entre papel, Excel, mensajes o memoria operativa,
              los pendientes se mezclan, las prioridades no son claras y el inventario deja de representar
              lo que realmente pasa en planta.
            </p>
          </div>
          <div style={board}>
            <ProblemLine icon="warn" text="Actividades vencidas que nadie ve a tiempo" />
            <ProblemLine icon="xCircle" text="Sobrelubricación o falta de lubricación por ejecución inconsistente" />
            <ProblemLine icon="search" text="Sin trazabilidad clara por equipo, técnico y condición" />
            <ProblemLine icon="drop" text="Inventario que no conversa con el consumo real" />
            <ProblemLine icon="trendDown" text="Decisiones reactivas y poca visibilidad ejecutiva" />
          </div>
        </div>
      </section>

      <section id="capacidades" style={sectionAlt}>
        <div style={sectionHead}>
          <div style={sectionKicker}>CAPACIDADES CLAVE</div>
          <h2 style={sectionTitle}>Una sola plataforma para planear, ejecutar, alertar y dirigir</h2>
          <p style={sectionText}>
            LubriPlan no es solo una bitácora: es una plataforma para mantenimiento de lubricación industrial
            que conecta control operativo, monitoreo de condición, inventario y lectura ejecutiva.
          </p>
        </div>
        <div style={featureGrid}>{capabilities.map((item) => <FeatureLine key={item} text={item} />)}</div>
      </section>

      <section style={section}>
        <div style={sectionHead}>
          <div style={sectionKicker}>DÓNDE ENCAJA MEJOR</div>
          <h2 style={sectionTitle}>Pensado para operaciones industriales que necesitan más control y menos improvisación</h2>
        </div>
        <div style={industryWrap}>
          {industries.map((item) => (
            <span key={item} style={industryPill}>
              {item}
            </span>
          ))}
        </div>
      </section>

      <section id="como-funciona" style={section}>
        <div style={sectionHead}>
          <div style={sectionKicker}>CÓMO FUNCIONA</div>
          <h2 style={sectionTitle}>De la planeación a la visibilidad ejecutiva, sin perder continuidad</h2>
        </div>
        <div style={journeyGrid}>{journey.map(([n, title, text]) => <JourneyCard key={n} n={n} title={title} text={text} />)}</div>
      </section>

      <section style={section}>
        <div style={sectionHead}>
          <div style={sectionKicker}>ALCANCE ACTUAL</div>
          <h2 style={sectionTitle}>Módulos y capacidades ya integradas en LubriPlan</h2>
        </div>
        <div style={industryWrap}>
          {modules.map((item) => (
            <span key={item} style={industryPill}>
              {item}
            </span>
          ))}
        </div>
      </section>

      <section style={sectionAlt}>
        <div style={sectionHead}>
          <div style={sectionKicker}>PARA QUIÉN ES</div>
          <h2 style={sectionTitle}>Pensado para equipos que necesitan orden, visibilidad y trazabilidad</h2>
        </div>
        <div style={industryWrap}>
          {audiences.map((item) => (
            <span key={item} style={industryPill}>
              {item}
            </span>
          ))}
        </div>
      </section>

      <section id="contacto" style={ctaSection}>
        <div style={ctaBox}>
          <div style={sectionKicker}>LISTO PARA DEMOSTRARSE EN PLANTA</div>
          <h2 style={ctaTitle}>Solicita una demo de LubriPlan y evalúa cómo ordenar tu operación de lubricación</h2>
          <p style={ctaText}>
            Si hoy tu planta depende de Excel, papel o seguimiento informal para controlar actividades de lubricación,
            LubriPlan puede convertirse en la base operativa para ejecutar mejor, ver antes los riesgos y tomar decisiones con contexto real.
          </p>
          <div style={actions}>
            <a href={DEMO_URL} target="_blank" rel="noreferrer" style={btnPrimary}>Solicitar demo</a>
            <a href={`mailto:${CONTACT_EMAIL}`} style={btnGhost}>Contactar por correo</a>
          </div>
        </div>
      </section>
    </div>
  );
}

function Tag({ icon, text }) {
  return (
    <span style={tag}>
      <span style={tagIcon}><Icon name={icon} size="sm" /></span>
      {text}
    </span>
  );
}

function MetricCard({ value, label, tone = "blue" }) {
  const color = tone === "red" ? "#ef4444" : tone === "amber" ? "#f59e0b" : tone === "green" ? "#22c55e" : "#60a5fa";
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

function MiniCard({ title, chip, chipStyle, text }) {
  return (
    <div style={miniCard}>
      <div style={cardTopRow}>
        <div style={miniTitle}>{title}</div>
        <span style={chipStyle}>{chip}</span>
      </div>
      <div style={miniText}>{text}</div>
    </div>
  );
}

function ProblemLine({ icon, text }) {
  return (
    <div style={problemLine}>
      <div style={problemIcon}><Icon name={icon} /></div>
      <div style={problemText}>{text}</div>
    </div>
  );
}

function FeatureLine({ text }) {
  return (
    <div style={featureLine}>
      <span style={featureLineIcon}><Icon name="spark" size="sm" /></span>
      <span>{text}</span>
    </div>
  );
}

function WinCard({ title, text }) {
  return (
    <div style={winCard}>
      <div style={winIcon}>
        <Icon name="trendUp" />
      </div>
      <div style={winTitle}>{title}</div>
      <div style={winText}>{text}</div>
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

function PainCard({ text }) {
  return (
    <div style={painCard}>
      <div style={painIcon}><Icon name="warn" /></div>
      <div style={painText}>{text}</div>
    </div>
  );
}

const page = {
  background: "radial-gradient(circle at 14% 12%, rgba(249,115,22,0.18), transparent 24%), radial-gradient(circle at 84% 18%, rgba(234,88,12,0.14), transparent 22%), linear-gradient(180deg, #0b1220 0%, #111827 46%, #0f172a 100%)",
  color: "#fff",
  fontFamily: FONT,
  overflow: "hidden",
};
const hero = { position: "relative", maxWidth: 1320, margin: "0 auto", padding: "26px 24px 40px" };
const glowA = { position: "absolute", width: 420, height: 420, borderRadius: 999, background: "radial-gradient(circle, rgba(249,115,22,0.14), transparent 70%)", top: -140, right: -120, pointerEvents: "none" };
const glowB = { position: "absolute", width: 360, height: 360, borderRadius: 999, background: "radial-gradient(circle, rgba(56,189,248,0.08), transparent 70%)", bottom: -160, left: -120, pointerEvents: "none" };
const topBar = { position: "relative", zIndex: 2, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18, padding: "10px 0 22px", flexWrap: "wrap" };
const brand = { display: "flex", alignItems: "center", gap: 14 };
const brandBox = { width: 88, height: 88, borderRadius: 0, background: "transparent", border: "none", display: "grid", placeItems: "center", boxShadow: "none", flexShrink: 0 };
const brandLogo = { width: 88, height: 88, objectFit: "contain", display: "block" };
const brandTitle = { fontSize: 28, lineHeight: 1, fontWeight: 700, letterSpacing: -0.8 };
const brandSub = { marginTop: 6, color: "rgba(226,232,240,0.78)", fontSize: 13, fontWeight: 800, letterSpacing: 0.4 };
const nav = { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" };
const navLink = { color: "#e2e8f0", textDecoration: "none", fontSize: 14, fontWeight: 800, padding: "10px 0" };
const navBtn = { display: "inline-flex", alignItems: "center", justifyContent: "center", textDecoration: "none", background: "rgba(255,255,255,0.08)", color: "#fff", padding: "12px 16px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.14)", fontWeight: 900 };
const heroGrid = { position: "relative", zIndex: 2, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 360px), 1fr))", gap: 26, alignItems: "center" };
const eyebrow = { display: "inline-block", padding: "9px 14px", borderRadius: 999, background: "rgba(249,115,22,0.14)", border: "1px solid rgba(249,115,22,0.22)", fontSize: 12, fontWeight: 900, letterSpacing: 1.1, color: "#fdba74", marginBottom: 18 };
const heroTitle = { margin: 0, fontSize: "clamp(2.5rem, 5.4vw, 4.6rem)", lineHeight: 0.98, letterSpacing: -1.6, maxWidth: 860 };
const heroText = { marginTop: 18, maxWidth: 760, fontSize: 17, lineHeight: 1.72, color: "rgba(226,232,240,0.90)", fontWeight: 600 };
const heroRoleLine = { marginTop: 14, color: "#fdba74", fontSize: 14, lineHeight: 1.55, fontWeight: 900 };
const actions = { marginTop: 28, display: "flex", gap: 12, flexWrap: "wrap" };
const btnPrimary = { display: "inline-flex", alignItems: "center", justifyContent: "center", textDecoration: "none", background: "linear-gradient(135deg, #fb923c 0%, #f97316 100%)", color: "#0f172a", padding: "15px 20px", borderRadius: 16, fontWeight: 950, border: "1px solid rgba(251,146,60,0.9)", boxShadow: "0 18px 34px rgba(249,115,22,0.24)" };
const btnGhost = { display: "inline-flex", alignItems: "center", justifyContent: "center", textDecoration: "none", background: "rgba(255,255,255,0.05)", color: "#fff", padding: "15px 20px", borderRadius: 16, fontWeight: 900, border: "1px solid rgba(255,255,255,0.12)" };
const btnGhostSoft = { display: "inline-flex", alignItems: "center", justifyContent: "center", textDecoration: "none", background: "rgba(255,255,255,0.03)", color: "#e2e8f0", padding: "15px 20px", borderRadius: 16, fontWeight: 900, border: "1px solid rgba(255,255,255,0.08)" };
const statsRow = { marginTop: 22, display: "flex", gap: 10, flexWrap: "wrap" };
const tag = { display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 999, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", color: "#e2e8f0", fontSize: 12, fontWeight: 900 };
const tagIcon = { display: "grid", placeItems: "center", color: "#fb923c" };
const panel = { borderRadius: 28, padding: 20, background: "linear-gradient(180deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.04) 100%)", border: "1px solid rgba(255,255,255,0.10)", boxShadow: "0 24px 60px rgba(2,6,23,0.32)", backdropFilter: "blur(10px)" };
const panelHead = { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 16, flexWrap: "wrap" };
const panelKicker = { fontSize: 12, fontWeight: 900, letterSpacing: 0.9, color: "#fdba74", textTransform: "uppercase" };
const panelTitle = { marginTop: 6, fontSize: 22, lineHeight: 1.18, fontWeight: 900, maxWidth: 380 };
const liveBadge = { display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "8px 12px", borderRadius: 999, background: "rgba(34,197,94,0.14)", color: "#bbf7d0", border: "1px solid rgba(34,197,94,0.24)", fontSize: 11, fontWeight: 950 };
const metrics = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 };
const metricCard = { borderRadius: 18, padding: 16, background: "rgba(15,23,42,0.78)", border: "1px solid rgba(255,255,255,0.08)" };
const metricValue = { fontSize: 30, fontWeight: 1000, lineHeight: 1 };
const metricLabel = { marginTop: 7, fontSize: 12, fontWeight: 900, letterSpacing: 0.8, textTransform: "uppercase", color: "#94a3b8" };
const priorityCard = { marginTop: 14, padding: 16, borderRadius: 20, background: "linear-gradient(180deg, rgba(15,23,42,0.84), rgba(15,23,42,0.72))", border: "1px solid rgba(255,255,255,0.08)" };
const miniGrid = { marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 };
const miniCard = { padding: 14, borderRadius: 18, background: "rgba(15,23,42,0.62)", border: "1px solid rgba(255,255,255,0.08)" };
const cardTopRow = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" };
const miniTitle = { fontSize: 12, fontWeight: 900, textTransform: "uppercase", letterSpacing: 0.8, color: "#cbd5e1" };
const priorityTitle = { marginTop: 10, fontSize: 17, lineHeight: 1.42, fontWeight: 900 };
const priorityText = { marginTop: 8, fontSize: 13, lineHeight: 1.55, color: "#cbd5e1", fontWeight: 700 };
const miniText = { marginTop: 8, color: "#cbd5e1", fontSize: 13, lineHeight: 1.55, fontWeight: 700 };
const chipRed = { padding: "6px 10px", borderRadius: 999, background: "rgba(239,68,68,0.14)", color: "#fecaca", border: "1px solid rgba(239,68,68,0.24)", fontSize: 11, fontWeight: 950 };
const chipAmber = { padding: "6px 10px", borderRadius: 999, background: "rgba(245,158,11,0.14)", color: "#fde68a", border: "1px solid rgba(245,158,11,0.24)", fontSize: 11, fontWeight: 950 };
const chipBlue = { padding: "6px 10px", borderRadius: 999, background: "rgba(59,130,246,0.14)", color: "#bfdbfe", border: "1px solid rgba(59,130,246,0.24)", fontSize: 11, fontWeight: 950 };
const sectionTight = { maxWidth: 1320, margin: "0 auto", padding: "0 24px 18px" };
const section = { maxWidth: 1320, margin: "0 auto", padding: "34px 24px" };
const sectionAlt = { maxWidth: 1320, margin: "0 auto", padding: "34px 24px" };
const sectionHead = { maxWidth: 860, marginBottom: 24 };
const sectionKicker = { fontSize: 12, fontWeight: 950, letterSpacing: 1.05, color: "#fb923c", textTransform: "uppercase", marginBottom: 10 };
const sectionTitle = { margin: 0, fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1, letterSpacing: -1.1 };
const sectionText = { marginTop: 14, color: "#cbd5e1", fontSize: 16, lineHeight: 1.65, fontWeight: 600 };
const signalGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 };
const signalCard = { display: "flex", gap: 14, alignItems: "flex-start", padding: 18, borderRadius: 22, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 18px 40px rgba(2,6,23,0.12)" };
const signalIcon = { width: 46, height: 46, borderRadius: 16, background: "rgba(249,115,22,0.14)", color: "#fb923c", display: "grid", placeItems: "center", flexShrink: 0 };
const signalTitle = { fontSize: 16, fontWeight: 950 };
const signalText = { marginTop: 6, color: "#cbd5e1", fontSize: 13, lineHeight: 1.55, fontWeight: 700 };
const painGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 };
const painCard = { display: "flex", alignItems: "flex-start", gap: 12, padding: 18, borderRadius: 22, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" };
const painIcon = { width: 42, height: 42, borderRadius: 14, background: "rgba(239,68,68,0.14)", color: "#fca5a5", display: "grid", placeItems: "center", flexShrink: 0 };
const painText = { fontWeight: 900, lineHeight: 1.45, color: "#f8fafc" };
const twoCol = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))", gap: 18, alignItems: "stretch" };
const glassBlock = { padding: 24, borderRadius: 28, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" };
const board = { padding: 20, borderRadius: 28, background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.04))", border: "1px solid rgba(255,255,255,0.08)", display: "grid", gap: 12 };
const problemLine = { display: "flex", gap: 12, alignItems: "center", padding: "14px 14px", borderRadius: 18, background: "rgba(15,23,42,0.56)", border: "1px solid rgba(255,255,255,0.06)" };
const problemIcon = { width: 42, height: 42, borderRadius: 14, background: "rgba(239,68,68,0.14)", color: "#fca5a5", display: "grid", placeItems: "center", flexShrink: 0 };
const problemText = { fontWeight: 900, lineHeight: 1.45 };
const featureGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 };
const featureLine = { display: "flex", gap: 12, alignItems: "flex-start", padding: 18, borderRadius: 20, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#f8fafc", fontWeight: 800, lineHeight: 1.5 };
const featureLineIcon = { width: 34, height: 34, borderRadius: 12, background: "rgba(249,115,22,0.15)", color: "#fb923c", display: "grid", placeItems: "center", flexShrink: 0 };
const winGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 };
const winCard = { padding: 20, borderRadius: 22, background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.04))", border: "1px solid rgba(255,255,255,0.08)" };
const winIcon = { width: 46, height: 46, borderRadius: 16, background: "rgba(249,115,22,0.15)", color: "#fb923c", display: "grid", placeItems: "center", marginBottom: 14 };
const winTitle = { fontSize: 18, fontWeight: 950 };
const winText = { marginTop: 8, color: "#cbd5e1", fontSize: 14, lineHeight: 1.6, fontWeight: 700 };
const journeyGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 };
const journeyCard = { padding: 20, borderRadius: 24, background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.04))", border: "1px solid rgba(255,255,255,0.08)" };
const journeyNumber = { fontSize: 34, lineHeight: 1, fontWeight: 1000, color: "#fb923c" };
const journeyTitle = { marginTop: 12, fontSize: 19, lineHeight: 1.2, fontWeight: 950 };
const journeyText = { marginTop: 8, color: "#cbd5e1", fontSize: 14, lineHeight: 1.6, fontWeight: 700 };
const industryWrap = { display: "flex", gap: 10, flexWrap: "wrap" };
const industryPill = { padding: "12px 16px", borderRadius: 999, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", color: "#e2e8f0", fontSize: 13, fontWeight: 900 };
const ctaSection = { maxWidth: 1320, margin: "0 auto", padding: "20px 24px 72px" };
const ctaBox = { position: "relative", overflow: "hidden", padding: "30px 24px", borderRadius: 30, background: "linear-gradient(135deg, rgba(249,115,22,0.18) 0%, rgba(15,23,42,0.80) 45%, rgba(15,23,42,0.92) 100%)", border: "1px solid rgba(249,115,22,0.22)", boxShadow: "0 24px 70px rgba(2,6,23,0.28)" };
const ctaTitle = { position: "relative", zIndex: 1, margin: 0, fontSize: "clamp(2rem, 4vw, 3.1rem)", lineHeight: 1, letterSpacing: -1.1 };
const ctaText = { position: "relative", zIndex: 1, marginTop: 12, maxWidth: 760, color: "#e2e8f0", fontSize: 16, lineHeight: 1.65, fontWeight: 600 };
const contactNote = { position: "relative", zIndex: 1, marginTop: 14, color: "#cbd5e1", fontSize: 14, fontWeight: 700 };
const contactMailLink = { color: "#fdba74", textDecoration: "none", fontWeight: 900 };











