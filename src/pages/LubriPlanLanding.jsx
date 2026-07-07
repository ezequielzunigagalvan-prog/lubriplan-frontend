import React, { useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Icon } from "../components/ui/lpIcons";
import lubriPlanLogo from "../assets/lubriplan-logo.png.png";
import landingDashboardCover from "../assets/landing-dashboard-cover.png";
import landingAlerts from "../assets/landing-alerts.png";
import landingAiSummary from "../assets/landing-ai-summary.png";
import LandingChatWidget from "../components/chat/LandingChatWidget";

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
        text: "KPIs, alertas y reportes para supervisar pendientes, vencidos y riesgos antes de que escalen.",
      },
      {
        icon: "drop",
        title: "Inventario conectado",
        text: "El consumo de lubricantes se registra con cada actividad y anticipa riesgo de desabasto.",
      },
    ],
    []
  );

  const capabilities = useMemo(
    () => [
      "Roles diferenciados: administrador, supervisor y técnico",
      "Historial completo por equipo, técnico y condición",
      "Inventario con consumo real y alertas de existencia",
      "Lectura ejecutiva y alertas predictivas con IA",
      "Multiplanta sin mezcla de datos entre operaciones",
      "Modo offline para ejecución en campo sin red",
    ],
    []
  );

  const commercialWins = useMemo(
    () => [
      {
        title: "Menos atraso operativo",
        text: "Visibilidad inmediata de actividades vencidas y pendientes. El equipo prioriza con datos, no con suposiciones.",
      },
      {
        title: "Campo ejecuta con contexto",
        text: "El técnico recibe instrucciones claras, captura evidencia y registra consumo real en una sola pantalla.",
      },
      {
        title: "Jefatura decide con información",
        text: "Supervisión y gerencia reciben alertas, resumen ejecutivo e historial útil para actuar con prioridad.",
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
      "Exportar PDF",
      "Multiplanta",
      "Modo offline",
      "Importar y exportar",
    ],
    []
  );

  const audiences = useMemo(
    () => [
      "Jefes de mantenimiento",
      "Supervisores de lubricación",
      "Responsables de confiabilidad",
      "Técnicos de campo",
    ],
    []
  );

  const technicalTools = useMemo(
    () => [
      {
        title: "Compatibilidad de grasas",
        text: "Valida cambios de grasa entre espesantes y reduce el riesgo de mezcla inadecuada en rodamientos, guías y sistemas centralizados.",
      },
      {
        title: "Reengrase de rodamientos",
        text: "Calcula una referencia inicial de cantidad y frecuencia para decisiones rápidas de mantenimiento en campo.",
      },
      {
        title: "Viscosidad para reductores",
        text: "Sugiere un ISO VG inicial según velocidad, carga, temperatura y choque operativo para cajas y reductores.",
      },
      {
        title: "Conversor técnico",
        text: "Conversiones de distancia, volumen, presión, temperatura y viscosidad, incluyendo pulgadas en fracción.",
      },
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
        "Estandarizas la operación",
        "Configuras equipos, rutas, frecuencias, cantidades y criterios operativos en una base única y compartida.",
      ],
      [
        "02",
        "LubriPlan ordena las prioridades",
        "Genera actividades automáticamente, separa lo vencido de lo pendiente y mantiene visibles los riesgos activos.",
      ],
      [
        "03",
        "El técnico ejecuta con contexto",
        "Instrucciones claras, captura de evidencia y registro del consumo real, todo desde su dispositivo en planta.",
      ],
      [
        "04",
        "La jefatura decide con datos",
        "Indicadores, alertas y resumen ejecutivo para priorizar, corregir y demostrar control operativo.",
      ],
    ],
    []
  );

  const pains = useMemo(
    () => [
      "Actividades vencidas que nadie detecta a tiempo",
      "Control en Excel, papel o mensajes de WhatsApp",
      "Ejecución inconsistente entre técnicos",
      "Inventario desconectado del consumo real",
      "Sin trazabilidad por equipo, técnico ni condición",
      "Decisiones reactivas por falta de visibilidad",
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
            <Link to="/card" style={navBtnCard}>LubriPlan Card</Link>
            <Link to="/login" style={navBtn}>Entrar</Link>
          </div>
        </header>

        <div style={heroGrid}>
          <div>
            <div style={eyebrow}>GESTIÓN DE LUBRICACIÓN INDUSTRIAL</div>
            <h1 style={heroTitle}>
              Control real sobre la lubricación de tu planta
            </h1>
            <p style={heroText}>
              LubriPlan reemplaza el seguimiento en Excel, papel o mensajes con una plataforma
              que conecta planeación, ejecución, condición, consumo e inventario en un solo lugar.
            </p>
            <div style={heroRoleLine}>
              Para jefes de mantenimiento, supervisores y técnicos de lubricación industrial.
            </div>
            <div style={actions}>
              <a href={DEMO_URL} target="_blank" rel="noreferrer" style={btnPrimary}>Solicitar demo</a>
              <a href="#como-funciona" style={btnGhost}>Cómo funciona</a>
              <Link to="/login" style={btnGhostSoft}>Entrar a la plataforma</Link>
            </div>
            <div style={statsRow}>
              <Tag icon="checkCircle" text="Trazabilidad por actividad" />
              <Tag icon="alert" text="Alertas de riesgo operativo" />
              <Tag icon="trendUp" text="Indicadores para supervisión" />
            </div>
          </div>

          <div style={panel}>
            <div style={panelHead}>
              <div>
                <div style={panelKicker}>Dashboard operativo</div>
                <div style={panelTitle}>Visibilidad en tiempo real para mantenimiento y dirección</div>
              </div>
              <span style={liveBadge}>Producto real</span>
            </div>

            <div style={heroImageShell}>
              <img src={landingDashboardCover} alt="Panel de control de LubriPlan" style={heroImage} />
            </div>

            <div style={heroImageFooter}>
              <div style={heroImagePoint}>
                <span style={heroImageDot} />
                KPIs operativos en tiempo real
              </div>
              <div style={heroImagePoint}>
                <span style={heroImageDot} />
                Prioridades diferenciadas por rol
              </div>
              <div style={heroImagePoint}>
                <span style={heroImageDot} />
                Alertas accionables desde el dashboard
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -- Belt de se�ales de valor -- */}
      <section style={sectionTight}>
        <div style={signalGrid}>{signals.map((item) => <SignalCard key={item.title} {...item} />)}</div>
      </section>

      {/* -- El problema -- */}
      <section style={sectionAlt}>
        <div style={twoCol}>
          <div style={glassBlock}>
            <div style={sectionKicker}><span style={{ display:"block", width:20, height:2, background:"#f97316", borderRadius:999, flexShrink:0 }} />EL PROBLEMA</div>
            <h2 style={sectionTitle}>La lubricación se vuelve riesgosa sin un sistema</h2>
            <p style={sectionText}>
              Cuando el control vive en papel, Excel o mensajes de WhatsApp, los pendientes se
              acumulan, las prioridades no son claras y el inventario deja de reflejar lo que
              pasa realmente en planta.
            </p>
          </div>
          <div style={board}>
            <ProblemLine icon="warn" text="Actividades vencidas que nadie detecta a tiempo" />
            <ProblemLine icon="xCircle" text="Sobrelubricación o deficiencia por ejecución inconsistente" />
            <ProblemLine icon="search" text="Sin trazabilidad por equipo, técnico ni condición" />
            <ProblemLine icon="drop" text="Inventario desconectado del consumo real" />
            <ProblemLine icon="trendDown" text="Decisiones reactivas por falta de visibilidad operativa" />
          </div>
        </div>
      </section>

      {/* -- Lo que LubriPlan aporta -- */}
      <section style={section}>
        <div style={sectionHead}>
          <div style={sectionKicker}><span style={{ display:"block", width:20, height:2, background:"#f97316", borderRadius:999, flexShrink:0 }} />LA DIFERENCIA</div>
          <h2 style={sectionTitle}>Control operativo desde el primer día</h2>
          <p style={sectionText}>
            No es solo digitalizar formatos. Es darle a cada rol la información que necesita
            para ejecutar mejor, priorizar sin adivinar y demostrar control operativo con datos reales.
          </p>
        </div>
        <div style={winGrid}>
          {commercialWins.map((item) => (
            <WinCard key={item.title} {...item} />
          ))}
        </div>
      </section>

      {/* -- Cómo funciona -- */}
      <section id="como-funciona" style={sectionAlt}>
        <div style={sectionHead}>
          <div style={sectionKicker}><span style={{ display:"block", width:20, height:2, background:"#f97316", borderRadius:999, flexShrink:0 }} />C�MO FUNCIONA</div>
          <h2 style={sectionTitle}>De la planeación al control ejecutivo en cuatro pasos</h2>
        </div>
        <div style={journeyGrid}>{journey.map(([n, title, text]) => <JourneyCard key={n} n={n} title={title} text={text} />)}</div>
      </section>

      {/* -- Video demo -- */}
      <section style={videoSection}>
        <div style={sectionHead}>
          <div style={sectionKicker}>
            <span style={{ display:"block", width:20, height:2, background:"#f97316", borderRadius:999, flexShrink:0 }} />
            VE EL PRODUCTO
          </div>
          <h2 style={sectionTitle}>Mira LubriPlan en acción</h2>
          <p style={sectionText}>
            Así se ve LubriPlan configurado con datos de ejemplo, rutas, condición, consumo e inventario, todo en una sola plataforma.
          </p>
        </div>

        <div style={videoOuterWrap}>
          <div style={videoGlowRing} />
          <div style={videoWrap}>
            <video
              src="/lubriplan-demo.mp4?v=2"
              playsInline
              controls
              style={videoEl}
            />
          </div>
          <div style={videoBadgeRow}>
            <span style={videoBadge}>
              <span style={videoDot} />
              Demo con datos de ejemplo
            </span>
            <span style={videoBadge}>
              <Icon name="drop" style={{ width: 12, height: 12 }} />
              Gestión completa de lubricación industrial
            </span>
          </div>
        </div>
      </section>

      {/* -- Capacidades -- */}
      <section id="capacidades" style={section}>
        <div style={sectionHead}>
          <div style={sectionKicker}><span style={{ display:"block", width:20, height:2, background:"#f97316", borderRadius:999, flexShrink:0 }} />CAPACIDADES</div>
          <h2 style={sectionTitle}>Una plataforma para planear, ejecutar, alertar y decidir</h2>
          <p style={sectionText}>
            LubriPlan conecta control operativo, monitoreo de condición, inventario y lectura
            ejecutiva en un solo sistema, sin módulos separados ni hojas paralelas.
          </p>
        </div>
        <div style={featureGrid}>{capabilities.map((item) => <FeatureLine key={item} text={item} />)}</div>
      </section>

      {/* -- Screenshots -- */}
      <section style={sectionAlt}>
        <div style={sectionHeadWide}>
          <div style={sectionKicker}><span style={{ display:"block", width:20, height:2, background:"#f97316", borderRadius:999, flexShrink:0 }} />EL PRODUCTO EN USO</div>
          <h2 style={sectionTitle}>Alertas y lectura ejecutiva para operar con anticipación</h2>
          <p style={sectionText}>
            LubriPlan muestra lo que importa en el momento que importa: alertas accionables y
            un resumen inteligente que ayuda a priorizar sin necesidad de revisar cada registro.
          </p>
        </div>

        <div style={screenshotGrid}>
          <ScreenshotCard
            image={landingAlerts}
            alt="Alertas operativas de LubriPlan"
            kicker="Centro de alertas"
            title="Riesgos operativos visibles antes de que escalen"
            text="Atrasadas, sin técnico, riesgo de reincidencia y sobrecarga operativa, todo clasificado y accionable desde una sola vista."
          />
          <ScreenshotCard
            image={landingAiSummary}
            alt="Resumen ejecutivo inteligente de LubriPlan"
            kicker="Lectura ejecutiva con IA"
            title="Diagnóstico automático con prioridades accionables"
            text="La IA analiza la operación del mes, detecta patrones, identifica riesgos y entrega recomendaciones con contexto real de planta."
          />
        </div>
      </section>

      {/* -- Asistente t�cnico -- */}
      <section style={section}>
        <div style={twoCol}>
          <div style={glassBlock}>
            <div style={sectionKicker}><span style={{ display:"block", width:20, height:2, background:"#f97316", borderRadius:999, flexShrink:0 }} />ASISTENTE T�CNICO</div>
            <h2 style={sectionTitle}>Herramientas técnicas integradas en la plataforma</h2>
            <p style={sectionText}>
              LubriPlan incluye un asistente técnico con utilidades prácticas para tomar decisiones
              de lubricación, validar compatibilidad y resolver conversiones, sin salir del sistema.
            </p>
            <div style={assistantNoteBox}>
              <div style={assistantNoteTitle}>Criterio técnico más consistente</div>
              <div style={assistantNoteText}>
                Reduce consultas dispersas, acelera definiciones en campo y alinea el criterio
                técnico entre supervisión y ejecución.
              </div>
            </div>
          </div>

          <div style={assistantGrid}>
            {technicalTools.map((item) => (
              <TechnicalToolCard key={item.title} {...item} />
            ))}
          </div>
        </div>
      </section>

      {/* -- LubriPlan Card -- */}
      <section style={section}>
        <div style={twoCol}>
          <div style={cardProductBlock}>
            <div style={sectionKicker}>
              <span style={{ display:"block", width:20, height:2, background:"#f97316", borderRadius:999, flexShrink:0 }} />
              LUBRIPLAN CARD
            </div>
            <h2 style={sectionTitle}>La carta de lubricación en el bolsillo del técnico</h2>
            <p style={sectionText}>
              LubriPlan Card lleva los puntos de lubricación de cada equipo directo al campo.
              El técnico escanea el código QR del equipo y accede en segundos a la imagen con
              los puntos marcados, lubricante, cantidad, frecuencia y método, sin login, sin instalación.
            </p>

            <div style={cardFeatureList}>
              {[
                "Acceso por QR, escanea y listo, sin credenciales",
                "Imagen del equipo con puntos numerados y coloreados por frecuencia",
                "Lubricante, cantidad, unidad y método por punto",
                "Diseñado para pantallas con guantes en planta industrial",
                "El administrador gestiona las cartas desde el panel web",
              ].map((f) => (
                <div key={f} style={cardFeatureLine}>
                  <span style={cardFeatureDot} />
                  <span>{f}</span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 28, display: "flex", gap: 12, flexWrap: "wrap" }}>
              <a
                href="https://card.lubriplan.com"
                target="_blank"
                rel="noreferrer"
                style={btnPrimary}
              >
                Abrir LubriPlan Card
              </a>
              <a href="#contacto" style={btnGhost}>Solicitar acceso</a>
            </div>
          </div>

          <InteractiveCardMock />
        </div>
      </section>

      {/* -- Para qui�n / industrias / m�dulos (combinado) -- */}
      <section style={sectionAlt}>
        <div style={sectionHead}>
          <div style={sectionKicker}><span style={{ display:"block", width:20, height:2, background:"#f97316", borderRadius:999, flexShrink:0 }} />ALCANCE Y AUDIENCIA</div>
          <h2 style={sectionTitle}>Para quién es y qué incluye</h2>
        </div>

        <div style={pillSectionGrid}>
          <div>
            <div style={pillGroupLabel}>Roles</div>
            <div style={industryWrap}>
              {audiences.map((item) => (
                <span key={item} style={industryPill}>{item}</span>
              ))}
            </div>
          </div>
          <div>
            <div style={pillGroupLabel}>Industrias</div>
            <div style={industryWrap}>
              {industries.map((item) => (
                <span key={item} style={industryPill}>{item}</span>
              ))}
            </div>
          </div>
          <div>
            <div style={pillGroupLabel}>Módulos incluidos</div>
            <div style={industryWrap}>
              {modules.map((item) => (
                <span key={item} style={industryPill}>{item}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* -- CTA -- */}
      <section id="contacto" style={ctaSection}>
        <div style={ctaBox}>
          <div style={sectionKicker}><span style={{ display:"block", width:20, height:2, background:"#f97316", borderRadius:999, flexShrink:0 }} />SIGUIENTE PASO</div>
          <h2 style={ctaTitle}>Tu planta sigue controlando la lubricación con Excel o papel?</h2>
          <p style={ctaText}>
            LubriPlan es la base operativa para ejecutar con orden, anticipar riesgos y demostrar
            control con datos reales. Solicita una demo y evalúalo en tu operación.
          </p>
          <div style={actions}>
            <a href={DEMO_URL} target="_blank" rel="noreferrer" style={btnPrimary}>Solicitar demo</a>
            <span style={contactMailText}>
              Contacto: <span style={contactMailStrong}>{CONTACT_EMAIL}</span>
            </span>
          </div>
        </div>
      </section>

      <LandingChatWidget />
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
      {/* Large ghost number in background */}
      <div style={{
        position: "absolute", top: -6, right: 10,
        fontSize: 80, fontWeight: 900, lineHeight: 1,
        color: "rgba(249,115,22,0.07)",
        pointerEvents: "none", userSelect: "none",
        letterSpacing: -4,
      }}>{n}</div>
      <div style={journeyNumber}>
        <span style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 26, height: 26, borderRadius: 8,
          background: "rgba(249,115,22,0.14)",
          border: "1px solid rgba(249,115,22,0.28)",
          fontSize: 11, fontWeight: 900, color: "#f97316",
          letterSpacing: 0, flexShrink: 0,
        }}>{n}</span>
        Paso {n}
      </div>
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


function TechnicalToolCard({ title, text }) {
  return (
    <div style={assistantCard}>
      <div style={assistantCardIcon}><Icon name="tool" /></div>
      <div style={assistantCardTitle}>{title}</div>
      <div style={assistantCardText}>{text}</div>
    </div>
  );
}
function ScreenshotCard({ image, alt, kicker, title, text }) {
  return (
    <div style={screenshotCard}>
      <div style={screenshotFrame}>
        <img src={image} alt={alt} style={screenshotImage} />
      </div>
      <div style={screenshotMeta}>
        <div style={screenshotKicker}>{kicker}</div>
        <div style={screenshotTitle}>{title}</div>
        <div style={screenshotText}>{text}</div>
      </div>
    </div>
  );
}

const CARD_PUNTOS = [
  {
    n: 1, color: "#ef4444", bg: "rgba(239,68,68,0.12)", x: "22%", y: "38%",
    nombre: "Cojinete delantero rotor", lubricante: "Shell Omala S2 G 220",
    cantidad: "15 ml", frecuencia: "Diaria", metodo: "Aceitera",
  },
  {
    n: 2, color: "#f97316", bg: "rgba(249,115,22,0.12)", x: "62%", y: "38%",
    nombre: "Cojinete trasero rotor", lubricante: "Mobil SHC 220",
    cantidad: "15 ml", frecuencia: "Semanal", metodo: "Aceitera",
  },
  {
    n: 3, color: "#eab308", bg: "rgba(234,179,8,0.12)", x: "48%", y: "65%",
    nombre: "Caja de engranajes", lubricante: "Castrol Tribol 1100/220",
    cantidad: "250 ml", frecuencia: "Mensual", metodo: "Manual",
  },
  {
    n: 4, color: "#22c55e", bg: "rgba(34,197,94,0.12)", x: "78%", y: "52%",
    nombre: "Sistema de válvulas", lubricante: "Aeroshell Grease 7",
    cantidad: "5 g", frecuencia: "Trimestral", metodo: "Pistola de engrase",
  },
]

function InteractiveCardMock() {
  const [hovered, setHovered] = useState(null)

  return (
    <div style={cardVisualBlock}>
      {/* Header */}
      <div style={cardMockHeader}>
        <div style={cardMockLogo}>
          <svg viewBox="0 0 64 64" fill="none" style={{ width: 28, height: 28 }}>
            <rect width="64" height="64" rx="10" fill="#f97316" />
            <path d="M16 48V20h10c4 0 7 1 9 3s3 5 3 9c0 4-1 7-3 9s-5 3-9 3H16z" fill="#080e1a" />
            <path d="M22 42V26h4c2 0 3 .5 4 1.5S31 30 31 32c0 3-.5 5-1.5 6.5S27 40 25 40h-1v2h-2z" fill="#f97316" />
            <rect x="38" y="20" width="6" height="28" fill="#080e1a" />
          </svg>
        </div>
        <div>
          <div style={cardMockTitle}>LubriPlan Card</div>
          <div style={cardMockSub}>Cartas de lubricación</div>
        </div>
        <span style={cardMockBadge}>Campo</span>
      </div>

      {/* Equipment */}
      <div style={cardMockEquipo}>
        <div style={cardMockEquipoCode}>CMP-001</div>
        <div style={cardMockEquipoName}>Compresor de tornillo KAESER SK-19</div>
        <div style={cardMockEquipoArea}>Sala de compresores</div>
      </div>

      {/* Interactive image area � overflow visible so tooltips can escape */}
      <div style={{ ...cardMockImageArea, overflow: "visible" }}>
        {/* Inner visual layer with overflow hidden for rounded corners */}
        <div style={{
          position: "absolute", inset: 0, borderRadius: 16, overflow: "hidden",
          background: "rgba(8,14,26,0.80)", border: "1px solid rgba(255,255,255,0.08)",
          display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column",
        }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(249,115,22,0.4)" strokeWidth="1.5">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
          </svg>
          <span style={{ color: "rgba(148,163,184,0.5)", fontSize: 11, marginTop: 8 }}>
            Pasá el mouse sobre los puntos
          </span>
        </div>

        {/* Interactive dots */}
        {CARD_PUNTOS.map((p) => {
          const isActive = hovered === p.n
          const yNum = parseFloat(p.y)
          const xNum = parseFloat(p.x)
          const showAbove = yNum > 45
          const tipLeft = xNum < 28 ? "0" : xNum > 72 ? "auto" : "50%"
          const tipRight = xNum > 72 ? "0" : "auto"
          const tipTransform = xNum >= 28 && xNum <= 72 ? "translateX(-50%)" : "none"

          return (
            <div
              key={p.n}
              onMouseEnter={() => setHovered(p.n)}
              onMouseLeave={() => setHovered(null)}
              style={{
                position: "absolute",
                left: p.x, top: p.y,
                transform: `translate(-50%, -50%) scale(${isActive ? 1.35 : 1})`,
                width: 26, height: 26, borderRadius: "50%",
                background: p.color,
                border: isActive ? "2px solid rgba(255,255,255,0.85)" : "2px solid rgba(0,0,0,0.4)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 900, color: "#080e1a",
                boxShadow: isActive
                  ? `0 0 0 6px ${p.color}25, 0 0 18px ${p.color}`
                  : `0 0 10px ${p.color}80`,
                zIndex: isActive ? 30 : 10,
                cursor: "pointer",
                transition: "transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease",
              }}
            >
              {p.n}

              {/* Tooltip */}
              {isActive && (
                <div style={{
                  position: "absolute",
                  ...(showAbove ? { bottom: "calc(100% + 12px)" } : { top: "calc(100% + 12px)" }),
                  left: tipLeft, right: tipRight,
                  transform: tipTransform,
                  width: 216,
                  background: "linear-gradient(160deg, rgba(17,24,39,0.99), rgba(8,14,26,0.99))",
                  border: `1px solid ${p.color}35`,
                  borderTop: showAbove ? `2px solid ${p.color}` : "1px solid rgba(255,255,255,0.06)",
                  borderBottom: showAbove ? "1px solid rgba(255,255,255,0.06)" : `2px solid ${p.color}`,
                  borderRadius: 12,
                  padding: "11px 13px",
                  zIndex: 50,
                  pointerEvents: "none",
                  boxShadow: `0 20px 48px rgba(2,6,23,0.85), 0 0 0 1px rgba(255,255,255,0.03)`,
                }}>
                  <div style={{ color: p.color, fontSize: 9, fontWeight: 900, letterSpacing: "0.14em", textTransform: "uppercase" }}>
                    Punto {p.n}
                  </div>
                  <div style={{ color: "#f8fafc", fontSize: 13, fontWeight: 800, marginTop: 3, lineHeight: 1.3 }}>
                    {p.nombre}
                  </div>
                  <div style={{ marginTop: 9, display: "flex", flexDirection: "column", gap: 5, borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 9 }}>
                    {[
                      { label: "Lubricante", val: p.lubricante },
                      { label: "Cantidad", val: p.cantidad },
                      { label: "Método", val: p.metodo },
                    ].map(({ label, val }) => (
                      <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 10, color: "#64748b", fontWeight: 700, flexShrink: 0 }}>{label}</span>
                        <span style={{ fontSize: 11, color: "#cbd5e1", fontWeight: 800, textAlign: "right" }}>{val}</span>
                      </div>
                    ))}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 10, color: "#64748b", fontWeight: 700 }}>Frecuencia</span>
                      <span style={{ fontSize: 10, fontWeight: 900, padding: "2px 8px", borderRadius: 5, background: p.bg, color: p.color }}>
                        {p.frecuencia}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Points list � hover synced with dots */}
      <div style={cardMockPoints}>
        {CARD_PUNTOS.slice(0, 3).map((p) => {
          const isActive = hovered === p.n
          return (
            <div
              key={p.n}
              style={{
                ...cardMockPoint,
                background: isActive ? p.bg : "rgba(8,14,26,0.55)",
                border: isActive ? `1px solid ${p.color}35` : "1px solid rgba(255,255,255,0.06)",
                transition: "background 0.18s, border-color 0.18s",
                cursor: "default",
              }}
              onMouseEnter={() => setHovered(p.n)}
              onMouseLeave={() => setHovered(null)}
            >
              <div style={{
                ...cardMockPointNum,
                background: p.color,
                transform: isActive ? "scale(1.18)" : "scale(1)",
                transition: "transform 0.18s",
              }}>
                {p.n}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={cardMockPointName}>{p.nombre}</div>
                {isActive && (
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 1, fontWeight: 600 }}>
                    {p.lubricante}  {p.cantidad}
                  </div>
                )}
              </div>
              <span style={{ ...cardMockPointFrec, color: p.color, background: p.bg }}>{p.frecuencia}</span>
            </div>
          )
        })}
      </div>

      {/* QR row */}
      <div style={cardMockQRRow}>
        <div style={cardMockQRBox}>
          <svg viewBox="0 0 21 21" width="48" height="48" fill="none">
            <rect x="1" y="1" width="8" height="8" rx="1" fill="#f97316"/>
            <rect x="3" y="3" width="4" height="4" fill="#080e1a"/>
            <rect x="12" y="1" width="8" height="8" rx="1" fill="#f97316"/>
            <rect x="14" y="3" width="4" height="4" fill="#080e1a"/>
            <rect x="1" y="12" width="8" height="8" rx="1" fill="#f97316"/>
            <rect x="3" y="14" width="4" height="4" fill="#080e1a"/>
            <rect x="12" y="12" width="2" height="2" fill="#f97316"/>
            <rect x="15" y="12" width="2" height="2" fill="#f97316"/>
            <rect x="18" y="12" width="2" height="2" fill="#f97316"/>
            <rect x="12" y="15" width="2" height="2" fill="#f97316"/>
            <rect x="15" y="15" width="5" height="5" rx="0.5" fill="#f97316"/>
          </svg>
        </div>
        <div>
          <div style={cardMockQRLabel}>Escanear para acceder</div>
          <div style={cardMockQRSub}>card.lubriplan.com?equipo=CMP-001</div>
        </div>
      </div>
    </div>
  )
}

/* -----------------------------------------------
   INDUSTRIAL DESIGN SYSTEM � LubriPlan Landing
   Dark navy + orange accent + dot-grid texture
----------------------------------------------- */

const page = {
  background: [
    "radial-gradient(circle at 12% 10%, rgba(249,115,22,0.20), transparent 26%)",
    "radial-gradient(circle at 86% 16%, rgba(234,88,12,0.13), transparent 24%)",
    "radial-gradient(rgba(255,255,255,0.028) 1px, transparent 1px)",
    "linear-gradient(180deg, #080e1a 0%, #0f172a 44%, #0b1220 100%)",
  ].join(", "),
  backgroundSize: "auto, auto, 28px 28px, auto",
  color: "#fff",
  fontFamily: FONT,
  overflowX: "hidden",
};

/* -- Hero section -- */
const hero = { position: "relative", maxWidth: 1320, margin: "0 auto", padding: "0 24px 44px" };
const glowA = { position: "absolute", width: 500, height: 500, borderRadius: 999, background: "radial-gradient(circle, rgba(249,115,22,0.16), transparent 68%)", top: -160, right: -140, pointerEvents: "none" };
const glowB = { position: "absolute", width: 400, height: 400, borderRadius: 999, background: "radial-gradient(circle, rgba(56,189,248,0.07), transparent 70%)", bottom: -180, left: -140, pointerEvents: "none" };

/* -- Sticky navbar -- */
const topBar = {
  position: "sticky", top: 0, zIndex: 20,
  display: "flex", alignItems: "center", justifyContent: "space-between",
  gap: 18, padding: "14px 0 16px", flexWrap: "wrap",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  borderBottom: "1px solid rgba(249,115,22,0.12)",
  marginBottom: 28,
};
const brand = { display: "flex", alignItems: "center", gap: 14 };
const brandBox = { width: 72, height: 72, borderRadius: 0, background: "transparent", border: "none", display: "grid", placeItems: "center", flexShrink: 0 };
const brandLogo = { width: 72, height: 72, objectFit: "contain", display: "block", filter: "drop-shadow(0 6px 14px rgba(249,115,22,0.22))" };
const brandTitle = { fontSize: 26, lineHeight: 1, fontWeight: 900, letterSpacing: -0.9 };
const brandSub = { marginTop: 5, color: "rgba(226,232,240,0.65)", fontSize: 12, fontWeight: 800, letterSpacing: 0.5 };
const nav = { display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" };
const navLink = { color: "rgba(226,232,240,0.80)", textDecoration: "none", fontSize: 13, fontWeight: 800, padding: "10px 0", letterSpacing: "0.02em" };
const navBtn = {
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  textDecoration: "none",
  background: "linear-gradient(135deg, rgba(249,115,22,0.90) 0%, rgba(234,88,12,0.92) 100%)",
  color: "#0b1220",
  padding: "10px 18px", borderRadius: 10,
  border: "1px solid rgba(251,146,60,0.60)",
  fontWeight: 900, fontSize: 13,
  boxShadow: "0 8px 20px rgba(249,115,22,0.22)",
};

const navBtnCard = {
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  textDecoration: "none",
  background: "rgba(99,102,241,0.12)",
  color: "#a5b4fc",
  padding: "10px 18px", borderRadius: 10,
  border: "1px solid rgba(99,102,241,0.30)",
  fontWeight: 900, fontSize: 13,
};

/* -- Hero content -- */
const heroGrid = { position: "relative", zIndex: 2, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 360px), 1fr))", gap: 28, alignItems: "center" };
const eyebrow = {
  display: "inline-flex", alignItems: "center", gap: 10,
  padding: "8px 14px 8px 10px",
  borderRadius: 6,
  background: "rgba(249,115,22,0.11)",
  border: "1px solid rgba(249,115,22,0.22)",
  borderLeft: "4px solid #f97316",
  fontSize: 11, fontWeight: 900, letterSpacing: "0.13em",
  color: "#fdba74", marginBottom: 18, textTransform: "uppercase",
};
const heroTitle = { margin: 0, fontSize: "clamp(2.6rem, 5.6vw, 4.8rem)", lineHeight: 0.96, letterSpacing: -1.8, maxWidth: 880 };
const heroText = { marginTop: 20, maxWidth: 760, fontSize: 17, lineHeight: 1.72, color: "rgba(226,232,240,0.86)", fontWeight: 600 };
const heroRoleLine = { marginTop: 14, color: "#fdba74", fontSize: 13, lineHeight: 1.55, fontWeight: 900, letterSpacing: "0.01em" };
const actions = { marginTop: 28, display: "flex", gap: 12, flexWrap: "wrap" };
const btnPrimary = {
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  textDecoration: "none",
  background: "linear-gradient(135deg, #fb923c 0%, #f97316 100%)",
  color: "#0b1220", padding: "15px 24px", borderRadius: 12,
  fontWeight: 900, border: "none",
  borderBottom: "3px solid rgba(194,65,12,0.45)",
  boxShadow: "0 18px 36px rgba(249,115,22,0.26)",
};
const btnGhost = {
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  textDecoration: "none",
  background: "rgba(255,255,255,0.05)", color: "#fff",
  padding: "15px 22px", borderRadius: 12,
  fontWeight: 900, border: "1px solid rgba(255,255,255,0.14)",
};
const btnGhostSoft = {
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  textDecoration: "none",
  background: "transparent", color: "rgba(226,232,240,0.70)",
  padding: "15px 22px", borderRadius: 12,
  fontWeight: 800, border: "1px solid rgba(255,255,255,0.08)",
  fontSize: 14,
};
const statsRow = { marginTop: 24, display: "flex", gap: 10, flexWrap: "wrap" };
const tag = {
  display: "inline-flex", alignItems: "center", gap: 8,
  padding: "9px 12px", borderRadius: 8,
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderLeft: "2px solid rgba(249,115,22,0.50)",
  color: "#e2e8f0", fontSize: 12, fontWeight: 900,
};
const tagIcon = { display: "grid", placeItems: "center", color: "#fb923c" };

/* -- Hero product panel -- */
const panel = {
  borderRadius: 24, padding: 20,
  background: "linear-gradient(165deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 100%)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderTop: "2px solid rgba(249,115,22,0.35)",
  boxShadow: "0 30px 80px rgba(2,6,23,0.40), inset 0 1px 0 rgba(255,255,255,0.07)",
  backdropFilter: "blur(12px)",
};
const panelHead = { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 16, flexWrap: "wrap" };
const panelKicker = { fontSize: 11, fontWeight: 900, letterSpacing: "0.14em", color: "#fdba74", textTransform: "uppercase" };
const panelTitle = { marginTop: 6, fontSize: 20, lineHeight: 1.2, fontWeight: 900, maxWidth: 380 };
const liveBadge = {
  display: "inline-flex", alignItems: "center", gap: 6,
  padding: "7px 12px", borderRadius: 999,
  background: "rgba(34,197,94,0.14)", color: "#bbf7d0",
  border: "1px solid rgba(34,197,94,0.24)",
  fontSize: 11, fontWeight: 900,
};
const metrics = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 };
const heroImageShell = {
  borderRadius: 18, overflow: "hidden",
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(8,14,26,0.80)",
  boxShadow: "0 28px 56px rgba(2,6,23,0.36)",
};
const heroImage = { width: "100%", display: "block", objectFit: "cover" };
const heroImageFooter = { marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8 };
const heroImagePoint = {
  display: "flex", alignItems: "center", gap: 10,
  padding: "10px 13px", borderRadius: 12,
  background: "rgba(8,14,26,0.65)",
  border: "1px solid rgba(255,255,255,0.07)",
  color: "#e2e8f0", fontSize: 12, fontWeight: 800, lineHeight: 1.4,
};
const heroImageDot = {
  width: 8, height: 8, borderRadius: 999,
  background: "#f97316", flexShrink: 0,
  boxShadow: "0 0 0 4px rgba(249,115,22,0.16)",
};
const metricCard = { borderRadius: 16, padding: 14, background: "rgba(8,14,26,0.80)", border: "1px solid rgba(255,255,255,0.08)" };
const metricValue = { fontSize: 28, fontWeight: 900, lineHeight: 1 };
const metricLabel = { marginTop: 6, fontSize: 11, fontWeight: 900, letterSpacing: "0.10em", textTransform: "uppercase", color: "#94a3b8" };
const priorityCard = { marginTop: 14, padding: 14, borderRadius: 18, background: "rgba(8,14,26,0.78)", border: "1px solid rgba(255,255,255,0.08)" };
const miniGrid = { marginTop: 10, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 };
const miniCard = { padding: 14, borderRadius: 16, background: "rgba(8,14,26,0.68)", border: "1px solid rgba(255,255,255,0.07)" };
const cardTopRow = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" };
const miniTitle = { fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.10em", color: "#94a3b8" };
const priorityTitle = { marginTop: 10, fontSize: 17, lineHeight: 1.42, fontWeight: 900 };
const priorityText = { marginTop: 8, fontSize: 13, lineHeight: 1.55, color: "#cbd5e1", fontWeight: 700 };
const miniText = { marginTop: 8, color: "#cbd5e1", fontSize: 13, lineHeight: 1.55, fontWeight: 700 };
const chipRed = { padding: "5px 10px", borderRadius: 999, background: "rgba(239,68,68,0.14)", color: "#fecaca", border: "1px solid rgba(239,68,68,0.24)", fontSize: 11, fontWeight: 900 };
const chipAmber = { padding: "5px 10px", borderRadius: 999, background: "rgba(245,158,11,0.14)", color: "#fde68a", border: "1px solid rgba(245,158,11,0.24)", fontSize: 11, fontWeight: 900 };
const chipBlue = { padding: "5px 10px", borderRadius: 999, background: "rgba(59,130,246,0.14)", color: "#bfdbfe", border: "1px solid rgba(59,130,246,0.24)", fontSize: 11, fontWeight: 900 };

/* -- Section structure -- */
const sectionTight = { maxWidth: 1320, margin: "0 auto", padding: "0 24px 22px" };
const section = {
  maxWidth: 1320, margin: "0 auto", padding: "48px 24px",
  borderTop: "1px solid rgba(255,255,255,0.05)",
};
const sectionAlt = {
  maxWidth: 1320, margin: "0 auto", padding: "48px 24px",
  borderTop: "1px solid rgba(255,255,255,0.05)",
};
const sectionHead = { maxWidth: 860, marginBottom: 28 };
const sectionHeadWide = { maxWidth: 980, marginBottom: 28 };
const sectionKicker = {
  display: "inline-flex", alignItems: "center", gap: 8,
  fontSize: 11, fontWeight: 900, letterSpacing: "0.15em",
  color: "#fb923c", textTransform: "uppercase", marginBottom: 12,
};
const sectionTitle = { margin: 0, fontSize: "clamp(2rem, 4.2vw, 3.2rem)", lineHeight: 1, letterSpacing: -1.2 };
const sectionText = { marginTop: 16, color: "#94a3b8", fontSize: 16, lineHeight: 1.70, fontWeight: 600 };

/* -- Signal cards (top belt) -- */
const signalGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 };
const signalCard = {
  display: "flex", gap: 14, alignItems: "flex-start",
  padding: 18, borderRadius: 18,
  background: "rgba(255,255,255,0.045)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderLeft: "3px solid rgba(249,115,22,0.55)",
  boxShadow: "0 16px 36px rgba(2,6,23,0.14)",
};
const signalIcon = {
  width: 44, height: 44, borderRadius: 14,
  background: "rgba(249,115,22,0.12)", color: "#fb923c",
  display: "grid", placeItems: "center", flexShrink: 0,
};
const signalTitle = { fontSize: 15, fontWeight: 900, letterSpacing: "-0.01em" };
const signalText = { marginTop: 6, color: "#94a3b8", fontSize: 13, lineHeight: 1.58, fontWeight: 700 };

/* -- Pain cards -- */
const painGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 };
const painCard = {
  display: "flex", alignItems: "flex-start", gap: 12,
  padding: "16px 18px", borderRadius: 14,
  background: "rgba(239,68,68,0.05)",
  border: "1px solid rgba(239,68,68,0.14)",
  borderLeft: "4px solid rgba(239,68,68,0.55)",
};
const painIcon = {
  width: 38, height: 38, borderRadius: 12,
  background: "rgba(239,68,68,0.14)", color: "#f87171",
  display: "grid", placeItems: "center", flexShrink: 0,
};
const painText = { fontWeight: 900, lineHeight: 1.5, color: "#f1f5f9", fontSize: 14 };

/* -- Two-col sections -- */
const twoCol = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))", gap: 20, alignItems: "stretch" };
const glassBlock = {
  padding: 28, borderRadius: 24,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.09)",
  borderTop: "2px solid rgba(249,115,22,0.28)",
};
const board = {
  padding: 22, borderRadius: 24,
  background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
  border: "1px solid rgba(255,255,255,0.08)",
  display: "grid", gap: 10,
};
const problemLine = {
  display: "flex", gap: 12, alignItems: "center",
  padding: "13px 14px", borderRadius: 14,
  background: "rgba(8,14,26,0.55)",
  border: "1px solid rgba(255,255,255,0.06)",
  borderLeft: "3px solid rgba(239,68,68,0.40)",
};
const problemIcon = {
  width: 38, height: 38, borderRadius: 12,
  background: "rgba(239,68,68,0.12)", color: "#f87171",
  display: "grid", placeItems: "center", flexShrink: 0,
};
const problemText = { fontWeight: 900, lineHeight: 1.45, fontSize: 14 };

/* -- Feature lines (capabilities) -- */
const featureGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 };
const featureLine = {
  display: "flex", gap: 12, alignItems: "flex-start",
  padding: "16px 18px", borderRadius: 16,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderLeft: "3px solid rgba(249,115,22,0.45)",
  color: "#e2e8f0", fontWeight: 800, lineHeight: 1.5, fontSize: 14,
};
const featureLineIcon = {
  width: 32, height: 32, borderRadius: 10,
  background: "rgba(249,115,22,0.14)", color: "#fb923c",
  display: "grid", placeItems: "center", flexShrink: 0,
};

/* -- Win cards -- */
const winGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 };
const winCard = {
  padding: 22, borderRadius: 20,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderTop: "3px solid rgba(249,115,22,0.40)",
};
const winIcon = {
  width: 44, height: 44, borderRadius: 14,
  background: "rgba(249,115,22,0.13)", color: "#fb923c",
  display: "grid", placeItems: "center", marginBottom: 14,
};
const winTitle = { fontSize: 18, fontWeight: 900 };
const winText = { marginTop: 8, color: "#94a3b8", fontSize: 14, lineHeight: 1.62, fontWeight: 700 };

/* -- Journey cards (how it works steps) -- */
const journeyGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 };
const journeyCard = {
  padding: 22, borderRadius: 20,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  position: "relative", overflow: "hidden",
};
const journeyNumber = {
  fontSize: 11, fontWeight: 900, letterSpacing: "0.14em", color: "#f97316",
  textTransform: "uppercase", marginBottom: 10,
  display: "flex", alignItems: "center", gap: 8,
};
const journeyTitle = { marginTop: 0, fontSize: 19, lineHeight: 1.2, fontWeight: 900 };
const journeyText = { marginTop: 10, color: "#94a3b8", fontSize: 14, lineHeight: 1.62, fontWeight: 700 };

/* -- Industry / modules pills -- */
const pillSectionGrid = { display: "grid", gap: 28 };
const pillGroupLabel = {
  fontSize: 11, fontWeight: 900, letterSpacing: "0.13em",
  textTransform: "uppercase", color: "#fb923c",
  marginBottom: 12,
};
const industryWrap = { display: "flex", gap: 10, flexWrap: "wrap" };
const industryPill = {
  padding: "10px 16px", borderRadius: 8,
  background: "rgba(255,255,255,0.045)",
  border: "1px solid rgba(255,255,255,0.09)",
  borderLeft: "2px solid rgba(249,115,22,0.40)",
  color: "#cbd5e1", fontSize: 13, fontWeight: 900,
};

/* -- Technical assistant section -- */
const assistantGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 };
const assistantCard = {
  padding: 20, borderRadius: 20,
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.09)",
  borderTop: "2px solid rgba(249,115,22,0.35)",
  boxShadow: "0 16px 32px rgba(2,6,23,0.14)",
};
const assistantCardIcon = {
  width: 44, height: 44, borderRadius: 14,
  background: "rgba(249,115,22,0.13)", color: "#fb923c",
  display: "grid", placeItems: "center", marginBottom: 14,
};
const assistantCardTitle = { fontSize: 17, fontWeight: 900, color: "#f8fafc", lineHeight: 1.2 };
const assistantCardText = { marginTop: 8, color: "#94a3b8", fontSize: 14, lineHeight: 1.62, fontWeight: 700 };
const assistantNoteBox = {
  marginTop: 18, padding: 16, borderRadius: 16,
  background: "rgba(8,14,26,0.60)",
  border: "1px solid rgba(249,115,22,0.18)",
  borderLeft: "4px solid rgba(249,115,22,0.55)",
};
const assistantNoteTitle = { fontSize: 12, fontWeight: 900, letterSpacing: "0.10em", textTransform: "uppercase", color: "#fdba74" };
const assistantNoteText = { marginTop: 8, color: "#e2e8f0", fontSize: 14, lineHeight: 1.62, fontWeight: 700 };

/* -- Screenshot cards -- */
const screenshotGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))", gap: 20, alignItems: "start" };
const screenshotCard = {
  display: "grid", gap: 14, padding: 18, borderRadius: 24,
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.09)",
  borderTop: "2px solid rgba(249,115,22,0.35)",
  boxShadow: "0 24px 52px rgba(2,6,23,0.20)",
};
const screenshotFrame = { borderRadius: 18, overflow: "hidden", border: "1px solid rgba(255,255,255,0.09)", background: "rgba(8,14,26,0.80)" };
const screenshotImage = { width: "100%", display: "block", objectFit: "cover" };
const screenshotMeta = { display: "grid", gap: 8, padding: "4px 0" };
const screenshotKicker = { fontSize: 11, fontWeight: 900, letterSpacing: "0.14em", color: "#fb923c", textTransform: "uppercase" };
const screenshotTitle = { fontSize: 21, lineHeight: 1.1, fontWeight: 900, color: "#f8fafc" };
const screenshotText = { color: "#94a3b8", fontSize: 14, lineHeight: 1.65, fontWeight: 700 };

/* -- CTA section -- */
const ctaSection = { maxWidth: 1320, margin: "0 auto", padding: "20px 24px 80px" };
const ctaBox = {
  position: "relative", overflow: "hidden",
  padding: "48px 36px", borderRadius: 28,
  background: "linear-gradient(135deg, rgba(249,115,22,0.16) 0%, rgba(8,14,26,0.82) 40%, rgba(8,14,26,0.96) 100%)",
  border: "1px solid rgba(249,115,22,0.24)",
  borderTop: "3px solid rgba(249,115,22,0.70)",
  boxShadow: "0 30px 90px rgba(2,6,23,0.40)",
};
const ctaTitle = { position: "relative", zIndex: 1, margin: 0, fontSize: "clamp(2rem, 4.2vw, 3.3rem)", lineHeight: 1, letterSpacing: -1.2 };
const ctaText = { position: "relative", zIndex: 1, marginTop: 14, maxWidth: 760, color: "#94a3b8", fontSize: 16, lineHeight: 1.70, fontWeight: 600 };
const contactNote = { position: "relative", zIndex: 1, marginTop: 14, color: "#cbd5e1", fontSize: 14, fontWeight: 700 };
const contactMailText = {
  display: "inline-flex", alignItems: "center",
  padding: "14px 20px", borderRadius: 12,
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#e2e8f0", fontWeight: 800,
};
const contactMailStrong = { color: "#fdba74", fontWeight: 900 };
const contactMailLink = { color: "#fdba74", textDecoration: "none", fontWeight: 900 };

/* -- LubriPlan Card section -- */
const cardProductBlock = {
  padding: 28, borderRadius: 24,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.09)",
  borderTop: "2px solid rgba(249,115,22,0.28)",
  display: "flex", flexDirection: "column", justifyContent: "center",
};
const cardFeatureList = { marginTop: 22, display: "flex", flexDirection: "column", gap: 10 };
const cardFeatureLine = {
  display: "flex", alignItems: "flex-start", gap: 12,
  color: "#cbd5e1", fontSize: 14, fontWeight: 700, lineHeight: 1.5,
};
const cardFeatureDot = {
  width: 8, height: 8, borderRadius: "50%",
  background: "#f97316", flexShrink: 0, marginTop: 6,
  boxShadow: "0 0 0 3px rgba(249,115,22,0.18)",
};
const cardVisualBlock = {
  borderRadius: 24, padding: 20,
  background: "linear-gradient(165deg, rgba(249,115,22,0.07) 0%, rgba(8,14,26,0.90) 100%)",
  border: "1px solid rgba(249,115,22,0.20)",
  borderTop: "2px solid rgba(249,115,22,0.45)",
  boxShadow: "0 30px 80px rgba(2,6,23,0.40)",
  display: "flex", flexDirection: "column", gap: 14,
};
const cardMockHeader = {
  display: "flex", alignItems: "center", gap: 12,
  paddingBottom: 14, borderBottom: "1px solid rgba(255,255,255,0.07)",
};
const cardMockLogo = {
  width: 44, height: 44, borderRadius: 12,
  background: "rgba(249,115,22,0.12)",
  display: "grid", placeItems: "center", flexShrink: 0,
};
const cardMockTitle = { fontSize: 15, fontWeight: 900, color: "#f8fafc" };
const cardMockSub = { fontSize: 11, color: "#94a3b8", marginTop: 2, fontWeight: 700, letterSpacing: "0.05em" };
const cardMockBadge = {
  marginLeft: "auto",
  padding: "5px 12px", borderRadius: 999,
  background: "rgba(249,115,22,0.14)", color: "#fdba74",
  border: "1px solid rgba(249,115,22,0.28)",
  fontSize: 11, fontWeight: 900,
};
const cardMockEquipo = {
  padding: "12px 14px", borderRadius: 14,
  background: "rgba(8,14,26,0.60)",
  border: "1px solid rgba(255,255,255,0.07)",
};
const cardMockEquipoCode = {
  fontFamily: "monospace", fontSize: 13, fontWeight: 900,
  color: "#f97316", letterSpacing: 2, marginBottom: 4,
};
const cardMockEquipoName = { fontSize: 14, fontWeight: 900, color: "#f8fafc", lineHeight: 1.3 };
const cardMockEquipoArea = { fontSize: 12, color: "#64748b", marginTop: 3, fontWeight: 700 };
const cardMockImageArea = {
  position: "relative", borderRadius: 16, overflow: "hidden",
  background: "rgba(8,14,26,0.80)", border: "1px solid rgba(255,255,255,0.08)",
  height: 140, display: "flex", alignItems: "center", justifyContent: "center",
  flexDirection: "column",
};
const cardMockImagePlaceholder = {
  display: "flex", flexDirection: "column", alignItems: "center",
  justifyContent: "center",
};
const cardMockPoints = { display: "flex", flexDirection: "column", gap: 8 };
const cardMockPoint = {
  display: "flex", alignItems: "center", gap: 10,
  padding: "10px 12px", borderRadius: 12,
  background: "rgba(8,14,26,0.55)", border: "1px solid rgba(255,255,255,0.06)",
};
const cardMockPointNum = {
  width: 24, height: 24, borderRadius: "50%",
  display: "flex", alignItems: "center", justifyContent: "center",
  fontSize: 11, fontWeight: 900, color: "#080e1a", flexShrink: 0,
};
const cardMockPointName = { fontSize: 13, fontWeight: 800, color: "#e2e8f0" };
const cardMockPointFrec = {
  padding: "3px 9px", borderRadius: 6,
  fontSize: 11, fontWeight: 900, flexShrink: 0,
};
const cardMockQRRow = {
  display: "flex", alignItems: "center", gap: 14,
  padding: "12px 14px", borderRadius: 14,
  background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.18)",
};
const cardMockQRBox = {
  width: 64, height: 64, borderRadius: 10,
  background: "rgba(8,14,26,0.80)", border: "1px solid rgba(249,115,22,0.25)",
  display: "grid", placeItems: "center", flexShrink: 0,
};
const cardMockQRLabel = { fontSize: 12, fontWeight: 900, color: "#fdba74" };
const cardMockQRSub = { fontSize: 10, color: "#64748b", marginTop: 4, wordBreak: "break-all", fontFamily: "monospace" };

/* -- Video demo section -- */
const videoSection = {
  maxWidth: 1320, margin: "0 auto", padding: "48px 24px",
  borderTop: "1px solid rgba(255,255,255,0.05)",
};

const videoOuterWrap = {
  position: "relative",
  marginTop: 28,
  maxWidth: 780,
};

const videoGlowRing = {
  position: "absolute",
  inset: -2,
  borderRadius: 28,
  background: "radial-gradient(ellipse at 50% 0%, rgba(249,115,22,0.18) 0%, transparent 65%)",
  pointerEvents: "none",
  zIndex: 0,
};

const videoWrap = {
  position: "relative",
  zIndex: 1,
  borderRadius: 18,
  overflow: "hidden",
  borderTop: "3px solid rgba(249,115,22,0.65)",
  borderRight: "1px solid rgba(249,115,22,0.20)",
  borderBottom: "1px solid rgba(249,115,22,0.20)",
  borderLeft: "1px solid rgba(249,115,22,0.20)",
  boxShadow: "0 28px 70px rgba(2,6,23,0.50), 0 0 0 1px rgba(255,255,255,0.04)",
  background: "#080e1a",
};

const videoEl = {
  width: "100%",
  display: "block",
  maxHeight: "60vh",
  objectFit: "contain",
  background: "#080e1a",
};

const videoBadgeRow = {
  marginTop: 16,
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
};

const videoBadge = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 14px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#94a3b8",
  fontSize: 12,
  fontWeight: 800,
};

const videoDot = {
  width: 7,
  height: 7,
  borderRadius: "50%",
  background: "#22c55e",
  boxShadow: "0 0 0 3px rgba(34,197,94,0.22)",
  flexShrink: 0,
};



















