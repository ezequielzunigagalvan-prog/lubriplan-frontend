import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import lubriPlanMark from "../assets/lubriplan-app-icon.png";

const EXEC_TEXT_FONT = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const EXEC_DISPLAY_FONT = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

function cleanLoginText(value) {
  let text = String(value ?? "");
  if (!text) return "";

  if (/[ÃÂâï]/.test(text)) {
    try {
      text = decodeURIComponent(escape(text));
    } catch {
      // Mantener texto original si no puede decodificarse.
    }
  }

  return text
    .replace(/ï¿½S&/g, "")
    .replace(/Â·/g, "·")
    .replace(/â€¦/g, "...")
    .replace(/â€”/g, "-")
    .replace(/â€¢/g, "·")
    .replace(/Ã¡/g, "á")
    .replace(/Ã©/g, "é")
    .replace(/Ã­/g, "í")
    .replace(/Ã³/g, "ó")
    .replace(/Ãº/g, "ú")
    .replace(/Ã/g, "Á")
    .replace(/Ã‰/g, "É")
    .replace(/Ã/g, "Í")
    .replace(/Ã“/g, "Ó")
    .replace(/Ãš/g, "Ú")
    .replace(/Ã±/g, "ñ")
    .replace(/Ã‘/g, "Ñ")
    .replace(/sesi\uFFFDn/g, "sesión")
    .replace(/Sesi\uFFFDn/g, "Sesión")
    .replace(/operaci\uFFFDn/g, "operación")
    .replace(/Operaci\uFFFDn/g, "Operación")
    .replace(/contrase\uFFFDa/g, "contraseña")
    .replace(/Contrase\uFFFDa/g, "Contraseña")
    .replace(/cr\uFFFDticas/g, "críticas")
    .replace(/Cr\uFFFDticas/g, "Críticas")
    .replace(/mant\uFFFDn/g, "mantén")
    .replace(/est\uFFFDs/g, "estás")
    .replace(/acci\uFFFDn/g, "acción")
    .replace(/Acci\uFFFDn/g, "Acción")
    .replace(/[�]/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

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
      setErr(cleanLoginText("Tu sesión expiró por inactividad. Vuelve a iniciar sesión."));
    }
  }, [reason]);

  async function onSubmit(e) {
    e.preventDefault();
    if (loading) return;

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = String(password || "");

    if (!cleanEmail || !cleanPassword) {
      setErr(cleanLoginText("Ingresa tu correo y contraseña."));
      return;
    }

    setErr("");
    setLoading(true);

    try {
      await login(cleanEmail, cleanPassword);
      nav(from, { replace: true });
    } catch (e) {
      setErr(cleanLoginText(e?.message || "No se pudo iniciar sesión."));
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
              {cleanLoginText("Operación segura")}
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
              {cleanLoginText("Entra a tu operación diaria, revisa alertas críticas, coordina actividades y mantén la planta bajo control desde un solo lugar.")}
            </div>
          </div>

          <div style={{ display: "grid", gap: 14 }}>
            {[
              cleanLoginText("Dashboard por rol con foco operativo inmediato."),
              cleanLoginText("Contexto multi-planta con continuidad de sesión."),
              cleanLoginText("Alertas, actividades y reportes conectados en el mismo flujo."),
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
              {cleanLoginText("Acceso seguro")}
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
              {cleanLoginText("Iniciar sesión")}
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
              {cleanLoginText("Usa tu correo corporativo para entrar y continuar exactamente donde te quedaste.")}
            </div>

            <form onSubmit={onSubmit} style={{ display: "grid", gap: 14, marginTop: 24 }}>
              <div style={{ display: "grid", gap: 7 }}>
                <label htmlFor="email" style={{ fontSize: 13, fontWeight: 900, color: "#334155" }}>
                  {cleanLoginText("Correo")}
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
                  {cleanLoginText("Contraseña")}
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    id="password"
                    placeholder={cleanLoginText("Ingresa tu contraseña")}
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
                    {cleanLoginText(showPassword ? "Ocultar" : "Mostrar")}
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
                  {cleanLoginText(err)}
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
                {cleanLoginText(loading ? "Entrando..." : "Entrar a LubriPlan")}
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
              {cleanLoginText("Si tu acceso falla, valida primero que tu usuario siga activo y que estés entrando con el correo correcto.")}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}







