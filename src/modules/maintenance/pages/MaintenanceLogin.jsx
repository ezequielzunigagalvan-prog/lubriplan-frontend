import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useTheme } from "../../../context/ThemeContext";
import { Icon } from "../../../components/ui/lpIcons";

export default function MaintenanceLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const demoAccounts = import.meta.env.VITE_MAINTENANCE_DEMO_ACCOUNTS
    ? JSON.parse(import.meta.env.VITE_MAINTENANCE_DEMO_ACCOUNTS)
    : [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      const from = location.state?.from || "/maintenance/app";
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err.message || "Error inesperado";
      if (msg.includes("Credenciales")) setError("Email o contraseña incorrecta");
      else if (msg.includes("inactivo")) setError("Usuario inactivo, contacta al administrador");
      else if (msg.includes("conexión")) setError("Error de conexión, intenta de nuevo");
      else setError("Error inesperado, intenta de nuevo");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (cred) => {
    setEmail(cred.email);
    setPassword(cred.password);
    setError("");
  };

  return (
    <div style={container(isDark)}>
      <div style={card(isDark)}>
        {/* Header */}
        <div style={header}>
          <div style={logo}>LubriPlan Maintenance</div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={form}>
          {/* Email */}
          <div style={fieldGroup}>
            <label style={label}>Correo</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              required
              style={input(isDark, error)}
            />
          </div>

          {/* Password */}
          <div style={fieldGroup}>
            <label style={label}>Contraseña</label>
            <div style={passwordField}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={passwordInput(isDark, error)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={showBtn}
                title={showPassword ? "Ocultar" : "Mostrar"}
              >
                <Icon name={showPassword ? "eyeOff" : "eye"} size="sm" />
              </button>
            </div>
          </div>

          {/* Error */}
          {error && <div style={errorBox(isDark)}>{error}</div>}

          {/* Submit */}
          <button type="submit" disabled={loading} style={submitBtn(loading)}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        {/* Demo Accounts (dev only) */}
        {import.meta.env.DEV && demoAccounts.length > 0 && (
          <div style={demoBox(isDark)}>
            <div style={demoTitle}>Cuentas de demostración</div>
            <div style={demoButtons}>
              {demoAccounts.map((acc, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => fillDemo(acc)}
                  style={demoBtn(isDark)}
                >
                  {acc.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Links */}
        <div style={links}>
          <button
            type="button"
            onClick={() => navigate("/maintenance")}
            style={linkBtn}
          >
            ← Volver al inicio
          </button>
          <button
            type="button"
            onClick={() => navigate("/")}
            style={linkBtn}
          >
            Ir a LubriPlan
          </button>
        </div>
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
  width: "100%",
  maxWidth: 420,
  background: isDark ? "#111827" : "#fff",
  borderRadius: 20,
  border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(226,232,240,0.95)",
  padding: 32,
  boxShadow: isDark ? "0 30px 80px rgba(0,0,0,0.4)" : "0 30px 80px rgba(15,23,42,0.1)",
});

const header = {
  textAlign: "center",
  marginBottom: 28,
};

const logo = {
  fontSize: 18,
  fontWeight: 950,
  color: "#38bdf8",
  letterSpacing: "-0.02em",
};

const form = {
  display: "flex",
  flexDirection: "column",
  gap: 16,
  marginBottom: 24,
};

const fieldGroup = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const label = {
  fontSize: 12,
  fontWeight: 950,
  color: "#0f172a",
  textTransform: "uppercase",
  letterSpacing: ".04em",
};

const input = (isDark, error) => ({
  padding: "12px 14px",
  borderRadius: 10,
  border: error ? "1px solid #ef4444" : isDark ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(226,232,240,0.95)",
  background: isDark ? "#1f2937" : "#f8fafc",
  color: isDark ? "#f1f5f9" : "#0f172a",
  fontSize: 14,
  fontWeight: 800,
  outline: "none",
  transition: "all 140ms ease",
});

const passwordField = {
  display: "flex",
  alignItems: "center",
  position: "relative",
};

const passwordInput = (isDark, error) => ({
  ...input(isDark, error),
  flex: 1,
  paddingRight: 40,
});

const showBtn = {
  position: "absolute",
  right: 12,
  background: "none",
  border: "none",
  cursor: "pointer",
  color: "#64748b",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
};

const errorBox = (isDark) => ({
  padding: 12,
  borderRadius: 10,
  background: isDark ? "rgba(127,29,29,0.2)" : "#fee2e2",
  border: isDark ? "1px solid rgba(239,68,68,0.3)" : "1px solid #fecaca",
  color: isDark ? "#fca5a5" : "#991b1b",
  fontSize: 13,
  fontWeight: 850,
});

const submitBtn = (loading) => ({
  padding: "12px 16px",
  borderRadius: 10,
  border: "none",
  background: loading ? "#94a3b8" : "#38bdf8",
  color: "#fff",
  fontWeight: 950,
  fontSize: 14,
  cursor: loading ? "not-allowed" : "pointer",
  transition: "all 140ms ease",
  minHeight: 48,
});

const demoBox = (isDark) => ({
  padding: 16,
  marginBottom: 16,
  borderRadius: 10,
  border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px dashed rgba(226,232,240,0.95)",
  background: isDark ? "rgba(255,255,255,0.02)" : "rgba(248,250,252,0.5)",
});

const demoTitle = {
  fontSize: 11,
  fontWeight: 950,
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: ".04em",
  marginBottom: 8,
};

const demoButtons = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const demoBtn = (isDark) => ({
  padding: "8px 12px",
  borderRadius: 8,
  border: isDark ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(226,232,240,0.95)",
  background: isDark ? "rgba(255,255,255,0.05)" : "rgba(248,250,252,0.8)",
  color: isDark ? "#e2e8f0" : "#0f172a",
  fontSize: 12,
  fontWeight: 850,
  cursor: "pointer",
  transition: "all 140ms ease",
});

const links = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  textAlign: "center",
  paddingTop: 12,
  borderTop: "1px solid rgba(226,232,240,0.95)",
};

const linkBtn = {
  background: "none",
  border: "none",
  color: "#38bdf8",
  fontSize: 12,
  fontWeight: 900,
  cursor: "pointer",
  textDecoration: "none",
  transition: "all 140ms ease",
};
