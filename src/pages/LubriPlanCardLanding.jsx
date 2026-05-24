// src/pages/LubriPlanCardLanding.jsx
import { Link } from "react-router-dom";
import CardChatWidget from "../components/chat/CardChatWidget";

const FONT = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

const FEATURES = [
  {
    icon: "📇",
    title: "Tarjeta digital de lubricación",
    text: "Cada equipo tiene su tarjeta con historial completo de lubricaciones, lubricantes, cantidades, frecuencias y técnicos responsables.",
  },
  {
    icon: "🔍",
    title: "Acceso por QR sin login",
    text: "El técnico escanea el código QR del equipo y accede a su tarjeta desde cualquier dispositivo, sin necesidad de crear una cuenta.",
  },
  {
    icon: "📋",
    title: "Historial trazable",
    text: "Cada intervención queda registrada con fecha, técnico, condición y lubricante aplicado. Sin papel, sin Excel, sin pérdida de información.",
  },
  {
    icon: "🔒",
    title: "Seguro y controlado",
    text: "Los enlaces QR son únicos por equipo. El administrador controla qué se puede ver y editar desde el panel de LubriPlan.",
  },
  {
    icon: "⚡",
    title: "Sin fricción para el técnico",
    text: "No requiere instalación ni cuenta. El técnico solo necesita su teléfono y el código QR del equipo para registrar una lubricación.",
  },
  {
    icon: "📊",
    title: "Conectado a LubriPlan",
    text: "Los registros de la tarjeta se sincronizan con el sistema completo. La jefatura ve todo desde su panel sin depender del papel.",
  },
];

const PLANS = [
  {
    name: "Card Básica",
    price: "$79",
    period: "/mes",
    desc: "Para equipos que quieren digitalizar sus tarjetas de lubricación sin necesidad del sistema completo.",
    features: [
      "Hasta 50 equipos con tarjeta QR",
      "Historial de lubricaciones ilimitado",
      "Acceso por QR sin login",
      "Panel de administración básico",
      "Exportar historial a PDF",
    ],
    cta: "Solicitar demo",
    highlight: false,
  },
  {
    name: "Card Pro",
    price: "$149",
    period: "/mes",
    desc: "Para operaciones que necesitan más equipos, alertas automáticas y control avanzado.",
    features: [
      "Equipos ilimitados con tarjeta QR",
      "Historial ilimitado con evidencia fotográfica",
      "Alertas de vencimiento por equipo",
      "Reportes y análisis por equipo",
      "Soporte prioritario",
    ],
    cta: "Solicitar demo",
    highlight: true,
  },
  {
    name: "LubriPlan Professional",
    price: "$499",
    period: "/mes",
    desc: "Acceso completo: planeación, ejecución, condición, inventario, IA y LubriPlan Card incluida.",
    features: [
      "Todo lo de Card Pro incluido",
      "Rutas y actividades automáticas",
      "Inventario conectado al consumo",
      "Reportes IA y resumen ejecutivo",
      "Multiplanta sin mezcla de datos",
    ],
    cta: "Solicitar demo",
    highlight: false,
  },
];

export default function LubriPlanCardLanding() {
  return (
    <div style={page}>
      <style>{`
        @keyframes cardGlowPulse {
          0%,100% { opacity: 0.5; }
          50% { opacity: 0.9; }
        }
        .lp-card-plan-hover:hover {
          transform: translateY(-4px);
          box-shadow: 0 24px 64px rgba(99,102,241,0.25) !important;
        }
        .lp-card-feat-hover:hover {
          border-color: rgba(99,102,241,0.35) !important;
          background: rgba(99,102,241,0.08) !important;
        }
        .lp-card-nav-link:hover {
          color: #a5b4fc !important;
        }
      `}</style>

      {/* Nav */}
      <header style={topBar}>
        <div style={brand}>
          <div style={brandBox}>
            <svg viewBox="0 0 32 32" fill="none" style={{ width: 22, height: 22 }}>
              <rect width="32" height="32" rx="8" fill="#6366f1" />
              <rect x="4" y="10" width="24" height="14" rx="3" fill="#fff" fillOpacity="0.15" />
              <rect x="4" y="10" width="24" height="5" rx="2" fill="#fff" fillOpacity="0.30" />
              <rect x="6" y="18" width="8" height="2" rx="1" fill="#fff" fillOpacity="0.60" />
              <circle cx="24" cy="19" r="2" fill="#818cf8" />
            </svg>
          </div>
          <div>
            <div style={brandTitle}>LubriPlan Card</div>
            <div style={brandSub}>Tarjeta digital de lubricación por QR</div>
          </div>
        </div>
        <div style={navRight}>
          <Link to="/" className="lp-card-nav-link" style={navLink}>← LubriPlan</Link>
          <Link to="/login" style={navBtn}>Entrar</Link>
        </div>
      </header>

      {/* Hero */}
      <section style={hero}>
        <div style={heroGlowA} />
        <div style={heroGlowB} />
        <div style={heroContent}>
          <div style={eyebrow}>TARJETA DIGITAL DE LUBRICACIÓN</div>
          <h1 style={heroTitle}>
            El historial del equipo en el bolsillo del técnico
          </h1>
          <p style={heroText}>
            LubriPlan Card digitaliza la tarjeta de lubricación de cada equipo. El técnico escanea
            el QR y accede a instrucciones, historial y registro — sin descargar apps, sin crear cuenta.
          </p>
          <div style={heroActions}>
            <a href="#planes" style={btnPrimary}>Ver planes</a>
            <a href="#como-funciona" style={btnGhost}>¿Cómo funciona?</a>
          </div>
        </div>

        {/* Card visual */}
        <div style={cardVisual}>
          <div style={cardMock}>
            <div style={cardMockHeader}>
              <div style={cardMockChip}>
                <svg viewBox="0 0 32 32" fill="none" style={{ width: 16, height: 16 }}>
                  <rect width="32" height="32" rx="8" fill="#6366f1" />
                  <rect x="4" y="10" width="24" height="14" rx="3" fill="#fff" fillOpacity="0.2" />
                  <rect x="4" y="10" width="24" height="5" rx="2" fill="#fff" fillOpacity="0.35" />
                  <rect x="6" y="18" width="8" height="2" rx="1" fill="#fff" fillOpacity="0.6" />
                  <circle cx="24" cy="19" r="2" fill="#a5b4fc" />
                </svg>
                <span style={{ fontSize: 11, fontWeight: 900, color: "#a5b4fc" }}>LubriPlan Card</span>
              </div>
              <div style={qrBox}>
                <svg viewBox="0 0 21 21" fill="none" style={{ width: 48, height: 48 }}>
                  <rect x="0" y="0" width="9" height="9" rx="1.5" fill="#818cf8" />
                  <rect x="1.5" y="1.5" width="6" height="6" rx="0.8" fill="#0c0a1e" />
                  <rect x="3" y="3" width="3" height="3" fill="#818cf8" />
                  <rect x="12" y="0" width="9" height="9" rx="1.5" fill="#818cf8" />
                  <rect x="13.5" y="1.5" width="6" height="6" rx="0.8" fill="#0c0a1e" />
                  <rect x="15" y="3" width="3" height="3" fill="#818cf8" />
                  <rect x="0" y="12" width="9" height="9" rx="1.5" fill="#818cf8" />
                  <rect x="1.5" y="13.5" width="6" height="6" rx="0.8" fill="#0c0a1e" />
                  <rect x="3" y="15" width="3" height="3" fill="#818cf8" />
                  <rect x="12" y="12" width="2" height="2" fill="#818cf8" />
                  <rect x="15" y="12" width="2" height="2" fill="#818cf8" />
                  <rect x="18" y="12" width="3" height="2" fill="#818cf8" />
                  <rect x="12" y="15" width="5" height="2" fill="#818cf8" />
                  <rect x="18" y="15" width="3" height="2" fill="#818cf8" />
                  <rect x="12" y="18" width="2" height="3" fill="#818cf8" />
                  <rect x="15" y="18" width="6" height="3" fill="#818cf8" />
                </svg>
              </div>
            </div>
            <div style={cardMockEquip}>Bomba hidráulica #BH-042</div>
            <div style={cardMockRows}>
              {[
                ["Lubricante", "Shell Omala 220"],
                ["Cantidad", "120 ml / punto"],
                ["Frecuencia", "Cada 30 días"],
                ["Último técnico", "M. Hernández"],
                ["Última fecha", "12 may 2026"],
                ["Condición", "Normal ✓"],
              ].map(([k, v]) => (
                <div key={k} style={cardMockRow}>
                  <span style={cardMockKey}>{k}</span>
                  <span style={cardMockVal}>{v}</span>
                </div>
              ))}
            </div>
            <div style={cardMockFooter}>
              <span style={cardMockBadge}>Escanea para registrar</span>
            </div>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="como-funciona" style={section}>
        <div style={sectionInner}>
          <div style={sectionKicker}>CÓMO FUNCIONA</div>
          <h2 style={sectionTitle}>Tan simple como escanear un código</h2>
          <div style={stepsGrid}>
            {[
              ["01", "Configuras tus equipos", "Desde el panel de LubriPlan cargas los equipos y defines lubricantes, cantidades y frecuencias."],
              ["02", "Imprimes el QR", "Cada equipo genera su código QR único. Lo pegas en la máquina o en su ficha de planta."],
              ["03", "El técnico escanea", "Con su teléfono, el técnico accede a la tarjeta, consulta el historial y registra la lubricación del día."],
              ["04", "La jefatura supervisa", "Todos los registros se sincronizan en tiempo real. Supervisión y administración ven el estado de cada equipo."],
            ].map(([num, title, text]) => (
              <div key={num} style={step}>
                <div style={stepNum}>{num}</div>
                <div style={stepTitle}>{title}</div>
                <div style={stepText}>{text}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Funcionalidades */}
      <section style={{ ...section, background: "rgba(99,102,241,0.04)", borderTop: "1px solid rgba(99,102,241,0.10)", borderBottom: "1px solid rgba(99,102,241,0.10)" }}>
        <div style={sectionInner}>
          <div style={sectionKicker}>FUNCIONALIDADES</div>
          <h2 style={sectionTitle}>Todo lo que incluye LubriPlan Card</h2>
          <div style={featGrid}>
            {FEATURES.map(({ icon, title, text }) => (
              <div key={title} className="lp-card-feat-hover" style={featCard}>
                <div style={featIcon}>{icon}</div>
                <div style={featTitle}>{title}</div>
                <div style={featText}>{text}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Planes */}
      <section id="planes" style={section}>
        <div style={sectionInner}>
          <div style={sectionKicker}>PLANES</div>
          <h2 style={sectionTitle}>Elige el plan que va con tu operación</h2>
          <div style={plansGrid}>
            {PLANS.map(({ name, price, period, desc, features, cta, highlight }) => (
              <div
                key={name}
                className="lp-card-plan-hover"
                style={{
                  ...planCard,
                  ...(highlight ? planCardHighlight : {}),
                }}
              >
                {highlight && <div style={planPopular}>MÁS POPULAR</div>}
                <div style={planName}>{name}</div>
                <div style={planPriceRow}>
                  <span style={planPrice}>{price}</span>
                  <span style={planPeriod}>{period}</span>
                </div>
                <div style={planDesc}>{desc}</div>
                <ul style={planList}>
                  {features.map((f) => (
                    <li key={f} style={planItem}>
                      <span style={planCheck}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => document.getElementById("lp-card-fab")?.click()}
                  style={highlight ? planCtaHighlight : planCta}
                >
                  {cta}
                </button>
              </div>
            ))}
          </div>
          <div style={plansNote}>
            Todos los planes incluyen onboarding asistido. Sin permanencia mínima.
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={footer}>
        <div style={footerInner}>
          <div style={footerBrand}>LubriPlan Card</div>
          <div style={footerSub}>Parte del ecosistema LubriPlan · lubriplan@hidrolub.com</div>
          <Link to="/" style={footerLink}>← Volver al landing principal</Link>
        </div>
      </footer>

      <CardChatWidget />
    </div>
  );
}

// ── Estilos ──────────────────────────────────────────────────────────────────

const page = { fontFamily: FONT, background: "#0c0a1e", color: "#e2e8f0", minHeight: "100vh" };

const topBar = {
  display: "flex", alignItems: "center", justifyContent: "space-between",
  padding: "16px 32px", borderBottom: "1px solid rgba(99,102,241,0.12)",
  background: "rgba(12,10,30,0.95)", position: "sticky", top: 0, zIndex: 100,
};

const brand = { display: "flex", alignItems: "center", gap: 12 };

const brandBox = {
  width: 38, height: 38, borderRadius: 10,
  background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.30)",
  display: "grid", placeItems: "center",
};

const brandTitle = { fontWeight: 900, fontSize: 15, color: "#f1f5f9", letterSpacing: "-0.02em" };
const brandSub = { fontSize: 10, fontWeight: 700, color: "#475569", marginTop: 1 };

const navRight = { display: "flex", alignItems: "center", gap: 12 };

const navLink = {
  fontSize: 13, fontWeight: 700, color: "#64748b",
  textDecoration: "none", transition: "color 150ms ease",
};

const navBtn = {
  padding: "8px 18px", borderRadius: 10,
  background: "linear-gradient(135deg,#6366f1,#4f46e5)",
  color: "#fff", fontWeight: 900, fontSize: 13,
  textDecoration: "none", border: "none",
  boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
};

const hero = {
  position: "relative", overflow: "hidden",
  padding: "80px 32px 64px",
  display: "flex", alignItems: "center", gap: 48,
  maxWidth: 1100, margin: "0 auto",
  flexWrap: "wrap",
};

const heroGlowA = {
  position: "absolute", top: -80, left: -80,
  width: 400, height: 400, borderRadius: 999,
  background: "rgba(99,102,241,0.18)", filter: "blur(80px)",
  pointerEvents: "none", animation: "cardGlowPulse 4s ease-in-out infinite",
};

const heroGlowB = {
  position: "absolute", bottom: -60, right: -60,
  width: 300, height: 300, borderRadius: 999,
  background: "rgba(129,140,248,0.12)", filter: "blur(60px)",
  pointerEvents: "none",
};

const heroContent = { flex: "1 1 380px", position: "relative", zIndex: 1 };

const eyebrow = {
  fontSize: 10, fontWeight: 900, color: "#818cf8",
  letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 16,
};

const heroTitle = {
  margin: "0 0 20px", fontSize: "clamp(28px, 4vw, 44px)",
  fontWeight: 900, color: "#f1f5f9", lineHeight: 1.15,
  letterSpacing: "-0.03em",
};

const heroText = {
  margin: "0 0 28px", fontSize: 16, fontWeight: 600,
  color: "#94a3b8", lineHeight: 1.7, maxWidth: 460,
};

const heroActions = { display: "flex", gap: 12, flexWrap: "wrap" };

const btnPrimary = {
  padding: "13px 28px", borderRadius: 13,
  background: "linear-gradient(135deg,#6366f1,#4f46e5)",
  color: "#fff", fontWeight: 900, fontSize: 14,
  textDecoration: "none", boxShadow: "0 8px 24px rgba(99,102,241,0.40)",
  display: "inline-block",
};

const btnGhost = {
  padding: "13px 24px", borderRadius: 13,
  border: "1px solid rgba(99,102,241,0.30)",
  color: "#a5b4fc", fontWeight: 800, fontSize: 14,
  textDecoration: "none", background: "rgba(99,102,241,0.06)",
  display: "inline-block",
};

const cardVisual = { flex: "0 0 auto", display: "flex", justifyContent: "center", position: "relative", zIndex: 1 };

const cardMock = {
  width: 260, background: "rgba(15,12,40,0.95)",
  border: "1px solid rgba(99,102,241,0.30)",
  borderRadius: 20, padding: "18px 16px",
  boxShadow: "0 32px 80px rgba(99,102,241,0.20), 0 0 0 1px rgba(99,102,241,0.10)",
};

const cardMockHeader = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 };

const cardMockChip = { display: "flex", alignItems: "center", gap: 6 };

const qrBox = {
  background: "#0c0a1e", border: "1px solid rgba(99,102,241,0.20)",
  borderRadius: 8, padding: 4,
};

const cardMockEquip = { fontWeight: 900, fontSize: 13, color: "#f1f5f9", marginBottom: 12 };

const cardMockRows = { display: "flex", flexDirection: "column", gap: 7, marginBottom: 14 };

const cardMockRow = { display: "flex", justifyContent: "space-between", gap: 8 };

const cardMockKey = { fontSize: 11, fontWeight: 700, color: "#475569" };

const cardMockVal = { fontSize: 11, fontWeight: 800, color: "#c7d2fe", textAlign: "right" };

const cardMockFooter = { borderTop: "1px solid rgba(99,102,241,0.15)", paddingTop: 12, textAlign: "center" };

const cardMockBadge = {
  fontSize: 11, fontWeight: 900, color: "#818cf8",
  background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)",
  borderRadius: 999, padding: "4px 12px",
};

const section = { padding: "72px 32px" };

const sectionInner = { maxWidth: 1100, margin: "0 auto" };

const sectionKicker = {
  fontSize: 10, fontWeight: 900, color: "#818cf8",
  letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 12,
};

const sectionTitle = {
  margin: "0 0 48px", fontSize: "clamp(22px, 3vw, 34px)",
  fontWeight: 900, color: "#f1f5f9", letterSpacing: "-0.02em",
};

const stepsGrid = {
  display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 24,
};

const step = {
  padding: "20px", borderRadius: 16,
  border: "1px solid rgba(99,102,241,0.14)",
  background: "rgba(99,102,241,0.04)",
};

const stepNum = {
  fontSize: 28, fontWeight: 900, color: "rgba(129,140,248,0.35)",
  marginBottom: 10, lineHeight: 1,
};

const stepTitle = { fontSize: 15, fontWeight: 900, color: "#f1f5f9", marginBottom: 8 };

const stepText = { fontSize: 13, fontWeight: 600, color: "#64748b", lineHeight: 1.65 };

const featGrid = {
  display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 16,
};

const featCard = {
  padding: "20px", borderRadius: 16,
  border: "1px solid rgba(99,102,241,0.12)",
  background: "rgba(99,102,241,0.03)",
  transition: "border-color 150ms ease, background 150ms ease",
};

const featIcon = { fontSize: 24, marginBottom: 10 };

const featTitle = { fontSize: 14, fontWeight: 900, color: "#f1f5f9", marginBottom: 6 };

const featText = { fontSize: 13, fontWeight: 600, color: "#64748b", lineHeight: 1.65 };

const plansGrid = {
  display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 20, marginBottom: 20,
};

const planCard = {
  padding: "24px 22px", borderRadius: 20,
  border: "1px solid rgba(99,102,241,0.18)",
  background: "rgba(99,102,241,0.04)",
  display: "flex", flexDirection: "column", gap: 0,
  transition: "transform 200ms ease, box-shadow 200ms ease",
  position: "relative",
};

const planCardHighlight = {
  border: "1.5px solid rgba(99,102,241,0.50)",
  background: "rgba(99,102,241,0.08)",
  boxShadow: "0 8px 32px rgba(99,102,241,0.18)",
};

const planPopular = {
  position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
  background: "linear-gradient(135deg,#6366f1,#818cf8)",
  color: "#fff", fontSize: 10, fontWeight: 900,
  padding: "4px 14px", borderRadius: 999, letterSpacing: "0.08em",
  whiteSpace: "nowrap",
};

const planName = { fontSize: 15, fontWeight: 900, color: "#f1f5f9", marginBottom: 12 };

const planPriceRow = { display: "flex", alignItems: "flex-end", gap: 2, marginBottom: 10 };

const planPrice = { fontSize: 36, fontWeight: 900, color: "#a5b4fc", lineHeight: 1 };

const planPeriod = { fontSize: 13, fontWeight: 700, color: "#475569", paddingBottom: 4 };

const planDesc = { fontSize: 12, fontWeight: 600, color: "#64748b", lineHeight: 1.6, marginBottom: 18 };

const planList = { listStyle: "none", margin: "0 0 22px", padding: 0, display: "flex", flexDirection: "column", gap: 8 };

const planItem = { fontSize: 13, fontWeight: 700, color: "#94a3b8", display: "flex", gap: 8, alignItems: "flex-start" };

const planCheck = { color: "#818cf8", fontWeight: 900, flexShrink: 0 };

const planCta = {
  padding: "11px", borderRadius: 12,
  border: "1px solid rgba(99,102,241,0.30)",
  color: "#a5b4fc", fontWeight: 900, fontSize: 13,
  cursor: "pointer", background: "rgba(99,102,241,0.06)",
  fontFamily: FONT, marginTop: "auto",
};

const planCtaHighlight = {
  padding: "11px", borderRadius: 12, border: "none",
  background: "linear-gradient(135deg,#6366f1,#818cf8)",
  color: "#fff", fontWeight: 900, fontSize: 13,
  cursor: "pointer", fontFamily: FONT,
  boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
  marginTop: "auto",
};

const plansNote = {
  textAlign: "center", fontSize: 12, fontWeight: 700, color: "#475569",
};

const footer = {
  padding: "40px 32px", borderTop: "1px solid rgba(99,102,241,0.12)",
  background: "rgba(8,6,20,0.90)",
};

const footerInner = {
  maxWidth: 1100, margin: "0 auto",
  display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
};

const footerBrand = { fontSize: 16, fontWeight: 900, color: "#f1f5f9" };

const footerSub = { fontSize: 12, fontWeight: 700, color: "#475569" };

const footerLink = { fontSize: 13, fontWeight: 800, color: "#818cf8", textDecoration: "none" };
