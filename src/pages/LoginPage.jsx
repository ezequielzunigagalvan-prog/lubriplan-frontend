import React, { useMemo, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Icon } from "../components/ui/lpIcons";
import AuthShell, { EyeIcon } from "../components/auth/AuthShell";

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
    <AuthShell>
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
          <div className="lpg-label-row">
            <label htmlFor="password">Contraseña</label>
            <Link to="/forgot-password" className="lpg-link">¿Olvidaste tu contraseña?</Link>
          </div>
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
        correo correcto. Si el correo de recuperación no te llega, un administrador puede restablecer
        tu contraseña desde Usuarios.
      </div>
    </AuthShell>
  );
}
