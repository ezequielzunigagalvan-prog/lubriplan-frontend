import { useNavigate } from "react-router-dom";
import { useTheme } from "../../../context/ThemeContext";
import { Icon } from "../../../components/ui/lpIcons";

export default function MaintenanceLanding() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const scrollToFeatures = () => {
    const elem = document.getElementById("features");
    elem?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div style={{ minHeight: "100vh", background: isDark ? "linear-gradient(180deg, #0f172a 0%, #0b1120 100%)" : "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)" }}>
      {/* Hero */}
      <section style={heroSection}>
        <div style={heroContent}>
          <h1 style={heroTitle(isDark)}>Mantenimiento industrial, de la solicitud al historial.</h1>
          <p style={heroSubtitle(isDark)}>Reporta fallas, asigna técnicos, ejecuta en campo y valida sin dejar rastro.</p>

          <div style={heroButtons}>
            <button onClick={() => navigate("/maintenance/login")} style={btnPrimary}>
              <Icon name="arrowRight" size="sm" />
              Ingresar
            </button>
            <button onClick={scrollToFeatures} style={btnSecondary(isDark)}>
              Ver cómo funciona
            </button>
          </div>

          <div style={heroSvg}>
            <svg viewBox="0 0 200 120" width="200" height="120">
              <rect x="20" y="20" width="160" height="80" fill="none" stroke={isDark ? "#38bdf8" : "#38bdf8"} strokeWidth="2" rx="8" />
              <circle cx="60" cy="45" r="8" fill={isDark ? "#38bdf8" : "#38bdf8"} />
              <line x1="70" y1="45" x2="140" y2="45" stroke={isDark ? "#38bdf8" : "#38bdf8"} strokeWidth="1" />
              <circle cx="60" cy="65" r="6" fill="none" stroke={isDark ? "#94a3b8" : "#94a3b8"} strokeWidth="1" />
              <line x1="70" y1="65" x2="140" y2="65" stroke={isDark ? "#94a3b8" : "#94a3b8"} strokeWidth="1" />
              <circle cx="60" cy="85" r="6" fill="none" stroke={isDark ? "#94a3b8" : "#94a3b8"} strokeWidth="1" />
              <line x1="70" y1="85" x2="140" y2="85" stroke={isDark ? "#94a3b8" : "#94a3b8"} strokeWidth="1" />
            </svg>
          </div>
        </div>
      </section>

      {/* 5-Step Workflow */}
      <section id="features" style={workflowSection(isDark)}>
        <h2 style={sectionTitle(isDark)}>Flujo en 5 pasos</h2>
        <div style={stepsGrid}>
          {[
            { icon: "alertCircle", label: "Reportar falla", desc: "Solicitud rápida desde campo" },
            { icon: "checkCircle", label: "Aprobar y asignar", desc: "Supervisor valida y asigna técnico" },
            { icon: "wrench", label: "Ejecutar en campo", desc: "Técnico completa con fotos" },
            { icon: "validatedCircle", label: "Validar", desc: "Supervisor cierra orden" },
            { icon: "history", label: "Historial", desc: "Registro inmutable del activo" },
          ].map((step, i) => (
            <div key={i} style={stepCard(isDark)}>
              <div style={stepIcon}>
                <Icon name={step.icon} size="lg" />
              </div>
              <div style={stepLabel}>{step.label}</div>
              <div style={stepDesc}>{step.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* What's Included */}
      <section style={featureSection}>
        <h2 style={sectionTitle(isDark)}>Qué incluye hoy</h2>
        <div style={featuresGrid}>
          {[
            { icon: "package", title: "Activos", desc: "Jerarquía de equipos", status: "Disponible" },
            { icon: "clipboard", title: "Órdenes correctivas", desc: "Reportar y asignar", status: "Disponible" },
            { icon: "mobile", title: "Ejecución móvil", desc: "Fotos y notas en campo", status: "Disponible" },
            { icon: "history", title: "Historial inmutable", desc: "Trazabilidad completa", status: "Disponible" },
            { icon: "gauge", title: "Tablero de seguimiento", desc: "KPIs y métricas", status: "Disponible" },
          ].map((feature, i) => (
            <div key={i} style={featureCard(isDark)}>
              <div style={{ ...featureIcon, color: "#38bdf8" }}>
                <Icon name={feature.icon} size="lg" />
              </div>
              <h3 style={featureTitle(isDark)}>{feature.title}</h3>
              <p style={featureDesc}>{feature.desc}</p>
              <div style={statusChip}>{feature.status}</div>
            </div>
          ))}
        </div>
      </section>

      {/* En Desarrollo */}
      <section style={devSection(isDark)}>
        <h2 style={sectionTitle(isDark)}>En desarrollo</h2>
        <div style={devGrid}>
          {[
            { title: "Planes preventivos", desc: "Automáticos por tiempo o contador" },
            { title: "Calendario", desc: "Visualiza la carga de trabajo" },
            { title: "Checklists", desc: "Validación de tareas en ejecución" },
            { title: "Contadores", desc: "Lecturas de medidores de máquinas" },
            { title: "Cumplimiento PM", desc: "Métricas y SLA" },
            { title: "Refacciones", desc: "Gestión de repuestos y costos" },
          ].map((item, i) => (
            <div key={i} style={devCard(isDark)}>
              <div style={devTag}>En desarrollo</div>
              <h3 style={devTitle(isDark)}>{item.title}</h3>
              <p style={devDesc}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Roles */}
      <section style={rolesSection}>
        <h2 style={sectionTitle(isDark)}>Roles</h2>
        <div style={rolesGrid}>
          {[
            { role: "Operador", desc: "Reporta fallas desde campo" },
            { role: "Técnico", desc: "Ejecuta y completa órdenes" },
            { role: "Supervisor", desc: "Aprueba, asigna y valida" },
            { role: "Administrador", desc: "Gestiona sistema y permisos" },
          ].map((r, i) => (
            <div key={i} style={roleCard(isDark)}>
              <h3 style={roleTitle(isDark)}>{r.role}</h3>
              <p style={roleDesc}>{r.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Ecosystem Banner */}
      <section style={ecosystemSection(isDark)}>
        <p style={ecosystemText}>
          Parte del ecosistema{" "}
          <a href="/" style={ecosystemLink}>
            LubriPlan
          </a>
        </p>
      </section>

      {/* Footer */}
      <footer style={footer(isDark)}>
        <p style={footerText}>Desarrollado por Hidrolub</p>
      </footer>
    </div>
  );
}

const heroSection = {
  padding: "60px 16px",
  textAlign: "center",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "70vh",
};

const heroContent = {
  maxWidth: 600,
};

const heroTitle = (isDark) => ({
  fontSize: 32,
  fontWeight: 950,
  color: isDark ? "#f1f5f9" : "#0f172a",
  marginBottom: 16,
  lineHeight: 1.2,
});

const heroSubtitle = (isDark) => ({
  fontSize: 16,
  fontWeight: 800,
  color: isDark ? "#cbd5e1" : "#475569",
  marginBottom: 32,
  lineHeight: 1.6,
});

const heroButtons = {
  display: "flex",
  gap: 12,
  justifyContent: "center",
  flexWrap: "wrap",
  marginBottom: 48,
};

const btnPrimary = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "12px 24px",
  background: "#38bdf8",
  color: "#fff",
  border: "none",
  borderRadius: 12,
  fontWeight: 950,
  cursor: "pointer",
  minHeight: 48,
  transition: "all 140ms ease",
};

const btnSecondary = (isDark) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "12px 24px",
  background: isDark ? "rgba(255,255,255,0.08)" : "rgba(248,250,252,0.8)",
  color: isDark ? "#e2e8f0" : "#0f172a",
  border: isDark ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(226,232,240,0.95)",
  borderRadius: 12,
  fontWeight: 950,
  cursor: "pointer",
  minHeight: 48,
  transition: "all 140ms ease",
});

const heroSvg = {
  marginTop: 48,
  opacity: 0.6,
};

const workflowSection = (isDark) => ({
  padding: "60px 16px",
  background: isDark ? "rgba(255,255,255,0.02)" : "rgba(248,250,252,0.5)",
});

const sectionTitle = (isDark) => ({
  fontSize: 24,
  fontWeight: 950,
  color: isDark ? "#f1f5f9" : "#0f172a",
  textAlign: "center",
  marginBottom: 40,
});

const stepsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: 16,
  maxWidth: 900,
  margin: "0 auto",
};

const stepCard = (isDark) => ({
  textAlign: "center",
  padding: 16,
  borderRadius: 12,
  border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(226,232,240,0.95)",
  background: isDark ? "rgba(255,255,255,0.02)" : "#fff",
});

const stepIcon = {
  color: "#38bdf8",
  marginBottom: 12,
};

const stepLabel = {
  fontWeight: 950,
  fontSize: 14,
  color: "#0f172a",
  marginBottom: 4,
};

const stepDesc = {
  fontSize: 12,
  color: "#64748b",
  fontWeight: 800,
};

const featureSection = {
  padding: "60px 16px",
};

const featuresGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: 16,
  maxWidth: 1000,
  margin: "0 auto",
};

const featureCard = (isDark) => ({
  padding: 20,
  borderRadius: 14,
  border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(226,232,240,0.95)",
  background: isDark ? "rgba(255,255,255,0.02)" : "#fff",
});

const featureIcon = {
  marginBottom: 12,
};

const featureTitle = (isDark) => ({
  fontSize: 14,
  fontWeight: 950,
  color: isDark ? "#f1f5f9" : "#0f172a",
  marginBottom: 4,
});

const featureDesc = {
  fontSize: 12,
  color: "#64748b",
  fontWeight: 800,
  marginBottom: 8,
};

const statusChip = {
  display: "inline-block",
  padding: "4px 8px",
  background: "#dcfce7",
  color: "#166534",
  borderRadius: 6,
  fontSize: 11,
  fontWeight: 950,
};

const devSection = (isDark) => ({
  padding: "60px 16px",
  background: isDark ? "rgba(255,255,255,0.02)" : "rgba(248,250,252,0.5)",
});

const devGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: 16,
  maxWidth: 1000,
  margin: "0 auto",
};

const devCard = (isDark) => ({
  padding: 16,
  borderRadius: 12,
  border: isDark ? "1px dashed rgba(255,255,255,0.12)" : "1px dashed rgba(226,232,240,0.8)",
  background: isDark ? "rgba(255,255,255,0.03)" : "rgba(248,250,252,0.8)",
  opacity: 0.7,
});

const devTag = {
  fontSize: 10,
  fontWeight: 950,
  color: "#f59e0b",
  textTransform: "uppercase",
  marginBottom: 8,
};

const devTitle = (isDark) => ({
  fontSize: 13,
  fontWeight: 850,
  color: isDark ? "#cbd5e1" : "#475569",
  marginBottom: 4,
});

const devDesc = {
  fontSize: 11,
  color: "#94a3b8",
  fontWeight: 800,
};

const rolesSection = {
  padding: "60px 16px",
};

const rolesGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
  gap: 16,
  maxWidth: 800,
  margin: "0 auto",
};

const roleCard = (isDark) => ({
  padding: 16,
  borderRadius: 12,
  border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(226,232,240,0.95)",
  background: isDark ? "rgba(255,255,255,0.02)" : "#fff",
});

const roleTitle = (isDark) => ({
  fontSize: 13,
  fontWeight: 950,
  color: isDark ? "#f1f5f9" : "#0f172a",
  marginBottom: 4,
});

const roleDesc = {
  fontSize: 11,
  color: "#64748b",
  fontWeight: 800,
};

const ecosystemSection = (isDark) => ({
  padding: "40px 16px",
  textAlign: "center",
  borderTop: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(226,232,240,0.95)",
});

const ecosystemText = {
  fontSize: 12,
  fontWeight: 800,
  color: "#64748b",
};

const ecosystemLink = {
  color: "#38bdf8",
  textDecoration: "none",
  fontWeight: 950,
};

const footer = (isDark) => ({
  padding: "20px 16px",
  textAlign: "center",
  borderTop: isDark ? "1px solid rgba(255,255,255,0.04)" : "1px solid rgba(226,232,240,0.7)",
});

const footerText = {
  fontSize: 11,
  color: "#94a3b8",
  fontWeight: 800,
};
