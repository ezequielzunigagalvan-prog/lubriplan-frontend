import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import lubriPlanMark from "../assets/lubriplan-app-icon.png";

const EXEC_TEXT_FONT = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const EXEC_DISPLAY_FONT = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const nav = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const reason = new URLSearchParams(location.search).get("reason");

  const from = useMemo(() => {
    const raw = location.state?.from;
    if (typeof raw === "string" && raw.startsWith("/")) return raw;
    if (typeof raw?.pathname === "string" && raw.pathname.startsWith("/")) {
      return `${raw.pathname}${raw.search || ""}`;
    }
    return "/dashboard";
  }, [location.state]);

  useEffect(() => {
    if (reason === "expired") {
      setErr("Tu sesiÃ³n expirÃ³ por inactividad. Vuelve a iniciar sesiÃ³n.");
    }
  }, [reason]);

  async function onSubmit(e) {
    e.preventDefault();
    if (loading) return;

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = String(password || "");

    if (!cleanEmail || !cleanPassword) {
      setErr("Ingresa tu correo y contraseÃ±a.");
      return;
    }

    setErr("");
    setLoading(true);

    try {
      await login(cleanEmail, cleanPassword);
      nav(from, { replace: true });
    } catch (e) {
      setErr(e?.message || "No se pudo iniciar sesiÃ³n.");
    } finally {
      setLoading(false);
    }
  }

  if (isAuthenticated) {
    return <Navigate to={from || "/dashboard"} replace />;
  }

  const inputStyle = {
    height: 50,
    borderRadius: 14,
    border: "1px solid #d6dde8",
    padding: "0 14px",
    outline: "none",
    fontSize: 15,
    fontWeight: 700,
    color: "#0f172a",
    background: "#fff",
    width: "100%",
    boxSizing: "border-box",
    fontFamily: EXEC_TEXT_FONT,
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 20,
        background:
          "radial-gradient(circle at top left, rgba(249,115,22,0.20), transparent 28%), linear-gradient(135deg, #0f172a 0%, #101827 52%, #182233 100%)",
        fontFamily: EXEC_TEXT_FONT,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 980,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
          borderRadius: 28,
          overflow: "hidden",
          background: "rgba(255,255,255,0.97)",
          border: "1px solid rgba(226,232,240,0.95)",
          boxShadow: "0 34px 100px rgba(2, 6, 23, 0.38)",
        }}
      >
        <section
          style={{
            padding: "42px 42px 36px",
            background:
              "linear-gradient(160deg, rgba(15,23,42,0.96) 0%, rgba(15,23,42,0.92) 62%, rgba(30,41,59,0.95) 100%)",
            color: "#fff",
            display: "grid",
            alignContent: "space-between",
            gap: 24,
          }}
        >
          <div>
            <div
              style={{
                width: 88,
                height: 88,
                borderRadius: 0,
                display: "grid",
                placeItems: "center",
                background: "transparent",
                border: "none",
                boxShadow: "none",
              }}
            >
              <img src={lubriPlanMark} alt="LubriPlan" style={{ width: 88, height: 88, objectFit: "contain", display: "block" }} />
            </div>

            <div
              style={{
                marginTop: 20,
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.08)",
                border: "none",
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: 0.8,
                textTransform: "uppercase",
                color: "#e2e8f0",
              }}
            >
              OperaciÃ³n segura
            </div>

            <div
              style={{
                marginTop: 24,
                fontFamily: EXEC_DISPLAY_FONT,
                fontSize: "clamp(2.2rem, 5vw, 3.4rem)",
                lineHeight: 0.96,
                fontWeight: 700,
                letterSpacing: -1.4,
              }}
            >
              LubriPlan
            </div>

            <div
              style={{
                marginTop: 18,
                maxWidth: 520,
                fontSize: 18,
                lineHeight: 1.55,
                color: "rgba(226,232,240,0.92)",
                fontWeight: 600,
              }}
            >
              Entra a tu operaciÃ³n diaria, revisa alertas crÃ­ticas, coordina actividades y mantÃ©n la planta bajo control desde un solo lugar.
            </div>
          </div>

          <div style={{ display: "grid", gap: 14 }}>
            {[
              "Dashboard por rol con foco operativo inmediato.",
              "Contexto multi-planta con continuidad de sesiÃ³n.",
              "Alertas, actividades y reportes conectados en el mismo flujo.",
            ].map((item) => (
              <div
                key={item}
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                  padding: "14px 16px",
                  borderRadius: 18,
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    marginTop: 8,
                    background: "#f97316",
                    boxShadow: "0 0 0 6px rgba(249,115,22,0.12)",
                    flex: "0 0 auto",
                  }}
                />
                <div style={{ fontSize: 14, lineHeight: 1.55, color: "#e2e8f0", fontWeight: 700 }}>
                  {item}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section
          style={{
            padding: "34px 32px",
            display: "grid",
            alignContent: "center",
            background: "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,1) 100%)",
          }}
        >
          <div style={{ maxWidth: 380, width: "100%", margin: "0 auto" }}>
            <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", color: "#f97316" }}>
              Acceso seguro
            </div>

            <h1
              style={{
                margin: "10px 0 0",
                fontFamily: EXEC_DISPLAY_FONT,
                fontSize: 36,
                lineHeight: 1.02,
                letterSpacing: -0.8,
                color: "#0f172a",
              }}
            >
              Iniciar sesiÃ³n
            </h1>

            <div
              style={{
                marginTop: 10,
                fontSize: 14,
                lineHeight: 1.6,
                color: "#64748b",
                fontWeight: 700,
              }}
            >
              Usa tu correo corporativo para entrar y continuar exactamente donde te quedaste.
            </div>

            <form onSubmit={onSubmit} style={{ display: "grid", gap: 14, marginTop: 24 }}>
              <div style={{ display: "grid", gap: 7 }}>
                <label htmlFor="email" style={{ fontSize: 13, fontWeight: 900, color: "#334155" }}>
                  Correo
                </label>
                <input
                  id="email"
                  placeholder="tu@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  disabled={loading}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: "grid", gap: 7 }}>
                <label htmlFor="password" style={{ fontSize: 13, fontWeight: 900, color: "#334155" }}>
                  ContraseÃ±a
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    id="password"
                    placeholder="Ingresa tu contraseÃ±a"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    disabled={loading}
                    style={{ ...inputStyle, paddingRight: 110 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    disabled={loading}
                    style={{
                      position: "absolute",
                      right: 8,
                      top: 8,
                      bottom: 8,
                      borderRadius: 10,
                      border: "1px solid #dbe4ee",
                      background: "#f8fafc",
                      color: "#0f172a",
                      fontWeight: 900,
                      fontSize: 12,
                      padding: "0 12px",
                      cursor: loading ? "not-allowed" : "pointer",
                      fontFamily: EXEC_TEXT_FONT,
                    }}
                  >
                    {showPassword ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
              </div>

              {err ? (
                <div
                  style={{
                    borderRadius: 14,
                    background: "#fff1f2",
                    border: "1px solid #fecdd3",
                    color: "#be123c",
                    fontWeight: 800,
                    fontSize: 13,
                    lineHeight: 1.5,
                    padding: "11px 13px",
                  }}
                >
                  {err}
                </div>
              ) : null}

              <button
                disabled={loading}
                type="submit"
                style={{
                  height: 52,
                  borderRadius: 14,
                  border: "1px solid rgba(249,115,22,0.5)",
                  background: loading ? "#fdba74" : "linear-gradient(180deg, #fb923c 0%, #f97316 100%)",
                  color: "#111827",
                  fontWeight: 900,
                  fontSize: 15,
                  cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: loading ? "none" : "0 16px 28px rgba(249,115,22,0.22)",
                  fontFamily: EXEC_TEXT_FONT,
                }}
              >
                {loading ? "Entrando..." : "Entrar a LubriPlan"}
              </button>
            </form>

            <div
              style={{
                marginTop: 18,
                paddingTop: 16,
                borderTop: "1px solid #e2e8f0",
                fontSize: 12,
                lineHeight: 1.6,
                color: "#64748b",
                fontWeight: 700,
              }}
            >
              Si tu acceso falla, valida primero que tu usuario siga activo y que estÃ©s entrando con el correo correcto.
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}



