import { useNavigate } from "react-router-dom";
import { useTheme } from "../../../context/ThemeContext";
import { Icon } from "../../../components/ui/lpIcons";

export default function AccessDenied() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div style={container(isDark)}>
      <div style={card(isDark)}>
        <div style={iconBox}>
          <Icon name="lock" size="xl" />
        </div>

        <h1 style={title(isDark)}>Mantenimiento no habilitado</h1>

        <p style={message(isDark)}>
          Mantenimiento no está habilitado para esta planta. Contacta a tu administrador para habilitar este módulo.
        </p>

        <button onClick={() => navigate("/maintenance")} style={button}>
          Volver al inicio
        </button>
      </div>
    </div>
  );
}

const container = (isDark) => ({
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 16,
  background: isDark ? "linear-gradient(180deg, #0f172a 0%, #0b1120 100%)" : "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)",
});

const card = (isDark) => ({
  textAlign: "center",
  maxWidth: 420,
  padding: 48,
  borderRadius: 20,
  border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(226,232,240,0.95)",
  background: isDark ? "#111827" : "#fff",
  boxShadow: isDark ? "0 30px 80px rgba(0,0,0,0.4)" : "0 30px 80px rgba(15,23,42,0.1)",
});

const iconBox = {
  width: 80,
  height: 80,
  borderRadius: 20,
  background: "linear-gradient(135deg, rgba(239,68,68,0.1) 0%, rgba(239,68,68,0.05) 100%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  margin: "0 auto 24px",
  color: "#ef4444",
  fontSize: 40,
};

const title = (isDark) => ({
  fontSize: 24,
  fontWeight: 950,
  color: isDark ? "#f1f5f9" : "#0f172a",
  marginBottom: 12,
  lineHeight: 1.2,
});

const message = (isDark) => ({
  fontSize: 14,
  fontWeight: 800,
  color: isDark ? "#cbd5e1" : "#475569",
  lineHeight: 1.6,
  marginBottom: 28,
});

const button = {
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
  transition: "all 140ms ease",
  minHeight: 48,
};
