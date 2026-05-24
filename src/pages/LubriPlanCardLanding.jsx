// src/pages/LubriPlanCardLanding.jsx
import { Link } from "react-router-dom";
import CardChatWidget from "../components/chat/CardChatWidget";
import cardPreview from "../assets/landing-card-preview.png";

const FONT = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

const FEATURES = [
  {
    icon: "📇",
    title: "Tarjeta digital por equipo",
    text: "Cada equipo tiene su propia tarjeta con lubricante, cantidad exacta, frecuencia, método y puntos de aplicación claramente definidos.",
  },
  {
    icon: "🔍",
    title: "Acceso por QR sin cuenta",
    text: "El técnico escanea el código QR del equipo y accede a su tarjeta desde cualquier celular. Sin app, sin instalación, sin contraseña.",
  },
  {
    icon: "📋",
    title: "Historial de cada lubricación",
    text: "Cada intervención queda registrada con fecha, técnico, cantidad aplicada y condición observada. Trazabilidad completa sin papel.",
  },
  {
    icon: "⚠️",
    title: "Alertas de vencimiento",
    text: "El sistema avisa cuando un equipo está próximo a su fecha de lubricación o ya la superó, para que nadie se quede sin atender.",
  },
  {
    icon: "📍",
    title: "Múltiples puntos por equipo",
    text: "Un mismo equipo puede tener varios puntos de lubricación, cada uno con su propio lubricante, cantidad y frecuencia específica.",
  },
  {
    icon: "🖥️",
    title: "Panel de administración",
    text: "Desde el panel del administrador puedes ver, editar y dar seguimiento a todas las tarjetas de tu planta desde un solo lugar.",
  },
];

const PLANS = [
  {
    name: "Card Básica",
    price: "$890",
    period: "/mes MXN",
    desc: "Para operaciones que quieren digitalizar sus tarjetas de lubricación sin sistema de gestión completo.",
    features: [
      "Hasta 30 equipos con tarjeta QR",
      "Historial de lubricaciones ilimitado",
      "Acceso por QR sin login",
      "Múltiples puntos por equipo",
      "Panel de administración",
      "Exportar historial a PDF",
    ],
    cta: "Solicitar demo",
    highlight: false,
  },
  {
    name: "Card Pro",
    price: "$1,690",
    period: "/mes MXN",
    desc: "Para plantas con más equipos que necesitan alertas automáticas, evidencia fotográfica y reportes.",
    features: [
      "Equipos ilimitados con tarjeta QR",
      "Evidencia fotográfica por lubricación",
      "Alertas de vencimiento automáticas",
      "Reportes y análisis por equipo",
      "Multiusuario y multitécnico",
      "Soporte prioritario",
    ],
    cta: "Solicitar demo",
    highlight: true,
  },
  {
    name: "LubriPlan + Card",
    price: "$3,990",
    period: "/mes MXN",
    desc: "Sistema completo de gestión de lubricación: tarjetas, rutas, actividades, inventario e IA, todo integrado.",
    features: [
      "Todo lo de Card Pro incluido",
      "Rutas y actividades automáticas",
      "Inventario conectado al consumo real",
      "Reportes ejecutivos con IA",
      "Multiplanta sin mezcla de datos",
      "Asistente técnico IA incluido",
    ],
    cta: "Solicitar demo",
    highlight: false,
    tag: "Suite completa",
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
        .lp-card-plan-hover {
          transition: transform 200ms ease, box-shadow 200ms ease;
        }
        .lp-card-plan-hover:hover {
          transform: translateY(-4px);
          box-shadow: 0 24px 64px rgba(99,102,241,0.25) !important;
        }
        .lp-card-feat-hover {
          transition: border-color 150ms ease, background 150ms ease;
        }
        .lp-card-feat-hover:hover {
          border-color: rgba(99,102,241,0.35) !important;
          background: rgba(99,102,241,0.08) !important;
        }
        .lp-card-nav-link {
          transition: color 150ms ease;
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
            La tarjeta de lubricación del equipo, en el bolsillo del técnico
          </h1>
          <p style={heroText}>
            LubriPlan Card convierte la tarjeta física de cada equipo en una tarjeta digital
            con acceso QR. El técnico escanea, consulta instrucciones, registra la lubricación
            y el historial queda guardado — sin papel, sin apps, sin cuenta.
          </p>
          <div style={heroTags}>
            <span style={heroTag}>📱 Sin app ni cuenta</span>
            <span style={heroTag}>📍 Puntos por equipo</span>
            <span style={heroTag}>📋 Historial trazable</span>
          </div>
          <div style={heroActions}>
            <a href="#planes" style={btnPrimary}>Ver planes</a>
            <a href="#como-funciona" style={btnGhost}>¿Cómo funciona?</a>
          </div>
        </div>

        {/* Imagen real */}
        <div style={heroImageWrap}>
          <div style={heroImageShell}>
            <img
              src={cardPreview}
              alt="LubriPlan Card — puntos de lubricación en equipo industrial"
              style={heroImage}
            />
            <div style={heroImageOverlay}>
              <div style={heroImageBadge}>
                <span style={badgeDot} />
                Vista real del sistema
              </div>
            </div>
          </div>
          <div style={heroImageCaption}>
            Cada punto naranja es un punto de lubricación. Al tocarlo se despliega la ficha con lubricante, cantidad, frecuencia y método.
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
              ["01", "Cargas tus equipos", "Desde el panel defines cada equipo con sus puntos de lubricación, lubricante recomendado, cantidad exacta, frecuencia y método de aplicación."],
              ["02", "Imprimes y pegas el QR", "El sistema genera un código QR único para cada equipo. Lo imprimes y lo pegas directamente en la máquina o en su ficha de mantenimiento."],
              ["03", "El técnico escanea en planta", "Con su celular el técnico escanea el QR, consulta las instrucciones específicas y registra la lubricación del día. Sin crear cuenta."],
              ["04", "El administrador supervisa", "Todos los registros se actualizan en tiempo real. Puedes ver el estado de cada equipo, quién lubricó, cuándo y con qué producto."],
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
      <section style={sectionAlt}>
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
          <p style={sectionSubtitle}>
            Los primeros dos planes son exclusivamente para tarjetas de lubricación. El tercero incluye la integración completa con LubriPlan.
          </p>
          <div style={plansGrid}>
            {PLANS.map(({ name, price, period, desc, features, cta, highlight, tag }) => (
              <div
                key={name}
                className="lp-card-plan-hover"
                style={{
                  ...planCard,
                  ...(highlight ? planCardHighlight : {}),
                }}
              >
                {highlight && <div style={planPopular}>MÁS POPULAR</div>}
                {tag && !highlight && <div style={planTag}>{tag}</div>}
                <div style={planName}>{name}</div>
                <div style={planPriceRow}>
                  <span style={{ ...planPrice, ...(highlight ? { color: "#a5b4fc" } : { color: "#c7d2fe" }) }}>{price}</span>
                  <span style={planPeriod}>{period}</span>
                </div>
                <div style={planDesc}>{desc}</div>
                <ul style={planList}>
                  {features.map((f) => (
                    <li key={f} style={planItem}>
                      <span style={{ ...planCheck, ...(tag ? { color: "#f97316" } : {}) }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => document.getElementById("lp-card-fab")?.click()}
                  style={highlight ? planCtaHighlight : (tag ? planCtaTag : planCta)}
                >
                  {cta}
                </button>
              </div>
            ))}
          </div>
          <div style={plansNote}>
            Todos los planes incluyen onboarding asistido · Sin permanencia mínima · Precios + IVA
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={footer}>
        <div style={footerInner}>
          <div style={footerBrand}>LubriPlan Card</div>
          <div style={footerSub}>Parte del ecosistema LubriPlan · lubriplan@hidrolub.com</div>
          <Link to="/" style={footerLink}>← Volver al landing principal de LubriPlan</Link>
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
  fontSize: 13, fontWeight: 700, color: "#64748b", textDecoration: "none",
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
  padding: "72px 32px 64px",
  display: "flex", alignItems: "center", gap: 56,
  maxWidth: 1200, margin: "0 auto",
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
  background: "rgba(129,140,248,0.10)", filter: "blur(60px)",
  pointerEvents: "none",
};

const heroContent = { flex: "1 1 360px", position: "relative", zIndex: 1, minWidth: 0 };

const eyebrow = {
  fontSize: 10, fontWeight: 900, color: "#818cf8",
  letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 16,
};

const heroTitle = {
  margin: "0 0 18px", fontSize: "clamp(26px, 3.5vw, 42px)",
  fontWeight: 900, color: "#f1f5f9", lineHeight: 1.15,
  letterSpacing: "-0.03em",
};

const heroText = {
  margin: "0 0 22px", fontSize: 15, fontWeight: 600,
  color: "#94a3b8", lineHeight: 1.75, maxWidth: 460,
};

const heroTags = { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 28 };

const heroTag = {
  fontSize: 12, fontWeight: 800, color: "#a5b4fc",
  background: "rgba(99,102,241,0.10)", border: "1px solid rgba(99,102,241,0.22)",
  borderRadius: 999, padding: "5px 13px",
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

const heroImageWrap = {
  flex: "1 1 380px", position: "relative", zIndex: 1,
  display: "flex", flexDirection: "column", gap: 12,
};

const heroImageShell = {
  position: "relative", borderRadius: 20, overflow: "hidden",
  border: "1px solid rgba(99,102,241,0.25)",
  boxShadow: "0 32px 80px rgba(99,102,241,0.20), 0 0 0 1px rgba(99,102,241,0.08)",
};

const heroImage = {
  width: "100%", display: "block",
  borderRadius: 20,
};

const heroImageOverlay = {
  position: "absolute", bottom: 12, left: 12,
};

const heroImageBadge = {
  display: "flex", alignItems: "center", gap: 7,
  background: "rgba(12,10,30,0.85)", backdropFilter: "blur(8px)",
  border: "1px solid rgba(99,102,241,0.30)",
  borderRadius: 999, padding: "6px 14px",
  fontSize: 11, fontWeight: 800, color: "#a5b4fc",
};

const badgeDot = {
  width: 7, height: 7, borderRadius: 999,
  background: "#22c55e", flexShrink: 0,
  boxShadow: "0 0 0 3px rgba(34,197,94,0.20)",
};

const heroImageCaption = {
  fontSize: 11, fontWeight: 700, color: "#475569",
  lineHeight: 1.6, textAlign: "center", maxWidth: 420, margin: "0 auto",
};

const section = { padding: "72px 32px" };

const sectionAlt = {
  padding: "72px 32px",
  background: "rgba(99,102,241,0.04)",
  borderTop: "1px solid rgba(99,102,241,0.10)",
  borderBottom: "1px solid rgba(99,102,241,0.10)",
};

const sectionInner = { maxWidth: 1100, margin: "0 auto" };

const sectionKicker = {
  fontSize: 10, fontWeight: 900, color: "#818cf8",
  letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 12,
};

const sectionTitle = {
  margin: "0 0 12px", fontSize: "clamp(22px, 3vw, 34px)",
  fontWeight: 900, color: "#f1f5f9", letterSpacing: "-0.02em",
};

const sectionSubtitle = {
  margin: "0 0 40px", fontSize: 14, fontWeight: 600,
  color: "#64748b", lineHeight: 1.65, maxWidth: 560,
};

const stepsGrid = {
  display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 24, marginTop: 40,
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
  gap: 16, marginTop: 40,
};

const featCard = {
  padding: "20px", borderRadius: 16,
  border: "1px solid rgba(99,102,241,0.12)",
  background: "rgba(99,102,241,0.03)",
};

const featIcon = { fontSize: 24, marginBottom: 10 };

const featTitle = { fontSize: 14, fontWeight: 900, color: "#f1f5f9", marginBottom: 6 };

const featText = { fontSize: 13, fontWeight: 600, color: "#64748b", lineHeight: 1.65 };

const plansGrid = {
  display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))",
  gap: 20, marginBottom: 20,
};

const planCard = {
  padding: "28px 24px", borderRadius: 20,
  border: "1px solid rgba(99,102,241,0.18)",
  background: "rgba(99,102,241,0.04)",
  display: "flex", flexDirection: "column",
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

const planTag = {
  position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
  background: "linear-gradient(135deg,#f97316,#fb923c)",
  color: "#0b1220", fontSize: 10, fontWeight: 900,
  padding: "4px 14px", borderRadius: 999, letterSpacing: "0.08em",
  whiteSpace: "nowrap",
};

const planName = { fontSize: 15, fontWeight: 900, color: "#f1f5f9", marginBottom: 12 };

const planPriceRow = { display: "flex", alignItems: "flex-end", gap: 4, marginBottom: 10 };

const planPrice = { fontSize: 36, fontWeight: 900, lineHeight: 1 };

const planPeriod = { fontSize: 12, fontWeight: 700, color: "#475569", paddingBottom: 5 };

const planDesc = { fontSize: 12, fontWeight: 600, color: "#64748b", lineHeight: 1.6, marginBottom: 20 };

const planList = { listStyle: "none", margin: "0 0 24px", padding: 0, display: "flex", flexDirection: "column", gap: 9, flex: 1 };

const planItem = { fontSize: 13, fontWeight: 700, color: "#94a3b8", display: "flex", gap: 8, alignItems: "flex-start", lineHeight: 1.45 };

const planCheck = { fontWeight: 900, flexShrink: 0, color: "#818cf8" };

const planCta = {
  padding: "11px", borderRadius: 12,
  border: "1px solid rgba(99,102,241,0.30)",
  color: "#a5b4fc", fontWeight: 900, fontSize: 13,
  cursor: "pointer", background: "rgba(99,102,241,0.06)",
  fontFamily: FONT,
};

const planCtaHighlight = {
  padding: "11px", borderRadius: 12, border: "none",
  background: "linear-gradient(135deg,#6366f1,#818cf8)",
  color: "#fff", fontWeight: 900, fontSize: 13,
  cursor: "pointer", fontFamily: FONT,
  boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
};

const planCtaTag = {
  padding: "11px", borderRadius: 12, border: "none",
  background: "linear-gradient(135deg,#f97316,#fb923c)",
  color: "#0b1220", fontWeight: 900, fontSize: 13,
  cursor: "pointer", fontFamily: FONT,
  boxShadow: "0 4px 14px rgba(249,115,22,0.30)",
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
