import React, { useMemo, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Icon } from "../components/ui/lpIcons";
import lubriPlanLogo from "../assets/lubriplan-logo.png.png";
import "./LoginPage.css";

const FEATURES = [
  "Panel por rol con foco operativo inmediato",
  "Varias plantas con una sola sesión",
  "Alertas, actividades y reportes en el mismo flujo",
];

function EyeIcon({ off = false }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
      {off && <path d="M3 3l18 18" />}
    </svg>
  );
}

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const nav = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // ?reason=expired: la sesión venció; se avisa sin tratarlo como error.
  const sessionExpired = new URLSearchParams(location.search).get("reason") === "expired";

  const from = useMemo(() => {
    const raw = location.state?.from;
    if (typeof raw === "string" && raw.startsWith("/")) return raw;
    if (typeof raw?.pathname === "string" && raw.pathname.startsWith("/")) {
      return `${raw.pathname}${raw.search || ""}`;
    }
    return "/dashboard";
  }, [location.state]);

  async function onSubmit(e) {
    e.preventDefault();
    if (loading) return;

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = String(password || "");

    if (!cleanEmail || !cleanPassword) {
      setErr("Ingresa tu correo y contraseña.");
      return;
    }

    setErr("");
    setLoading(true);

    try {
      await login(cleanEmail, cleanPassword);
      nav(from, { replace: true });
    } catch (ex) {
      setErr(ex?.message || "No se pudo iniciar sesión.");
    } finally {
      setLoading(false);
    }
  }

  const checkCaps = (e) => {
    if (typeof e.getModifierState === "function") setCapsLock(e.getModifierState("CapsLock"));
  };

  if (isAuthenticated) {
    return <Navigate to={from || "/dashboard"} replace />;
  }

  return (
    <div className="lpg">
      <div className="lpg-hazard" />

      {/* Panel de marca */}
      <aside className="lpg-brand">
        <div className="lpg-logo-row">
          <Link to="/" className="lpg-logo" aria-label="Ir al inicio de LubriPlan">
            <img src={lubriPlanLogo} alt="" />
            <div>
              <div className="lpg-logo-name">LubriPlan</div>
              <div className="lpg-logo-sub">Lubricación industrial</div>
            </div>
          </Link>
          <Link to="/" className="lpg-back">
            <Icon name="arrowLeft" size="sm" /> Volver al sitio
          </Link>
        </div>

        <div className="lpg-hide-md">
          <span className="lpg-pill"><span className="lpg-pulse" />Plataforma operativa</span>
          <h1 className="lpg-headline">
            La <em>lubricación</em> de tu planta, bajo control
          </h1>
          <p className="lpg-lead">
            Revisa alertas críticas, coordina actividades y mantén cada equipo lubricado a tiempo
            desde un solo lugar.
          </p>
        </div>

        <div className="lpg-features lpg-hide-md">
          {FEATURES.map((f, i) => (
            <div key={f} className="lpg-feature">
              <b>{String(i + 1).padStart(2, "0")}</b>
              {f}
            </div>
          ))}
        </div>

        <div className="lpg-brand-foot lpg-hide-md">© {new Date().getFullYear()} LubriPlan</div>
      </aside>

      {/* Formulario */}
      <main className="lpg-form-side">
        <div className="lpg-card">
          <div className="lpg-label">Acceso seguro</div>
          <h2 className="lpg-title">Iniciar sesión</h2>
          <p className="lpg-sub">Entra con tu correo y continúa donde te quedaste.</p>

          <form className="lpg-form" onSubmit={onSubmit} noValidate>
            {sessionExpired && !err && (
              <div className="lpg-alert lpg-alert-info" role="status">
                <Icon name="clock" size="sm" />
                <span>Tu sesión expiró por inactividad. Vuelve a iniciar sesión.</span>
              </div>
            )}

            <div className="lpg-field">
              <label htmlFor="email">Correo electrónico</label>
              <input
                id="email"
                className="lpg-input"
                type="email"
                inputMode="email"
                placeholder="tu@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                autoFocus
                disabled={loading}
              />
            </div>

            <div className="lpg-field">
              <label htmlFor="password">Contraseña</label>
              <div className="lpg-input-wrap">
                <input
                  id="password"
                  className="lpg-input lpg-input-pass"
                  type={showPassword ? "text" : "password"}
                  placeholder="Ingresa tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyUp={checkCaps}
                  onKeyDown={checkCaps}
                  onBlur={() => setCapsLock(false)}
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="lpg-eye"
                  onClick={() => setShowPassword((v) => !v)}
                  disabled={loading}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  aria-pressed={showPassword}
                >
                  <EyeIcon off={showPassword} />
                </button>
              </div>
              {capsLock && (
                <div className="lpg-hint" role="status">
                  <Icon name="warn" size="sm" /> Bloq Mayús está activado
                </div>
              )}
            </div>

            {err && (
              <div className="lpg-alert lpg-alert-error" role="alert">
                <Icon name="alert" size="sm" />
                <span>{err}</span>
              </div>
            )}

            <button className="lpg-submit" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="lpg-spinner" aria-hidden="true" /> Entrando…
                </>
              ) : (
                <>
                  Entrar a LubriPlan <Icon name="arrowRight" size="sm" />
                </>
              )}
            </button>
          </form>

          <div className="lpg-help">
            <strong>¿No puedes entrar?</strong> Verifica que tu usuario siga activo y que uses el
            correo correcto. Si olvidaste tu contraseña, pide a un administrador que la restablezca.
          </div>
        </div>
      </main>
    </div>
  );
}
