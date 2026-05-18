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
    .replace(/â€"/g, "-")
    .replace(/â€¢/g, "·")
    .replace(/Ã¡/g, "á")
    .replace(/Ã©/g, "é")
    .replace(/Ã­/g, "í")
    .replace(/Ã³/g, "ó")
    .replace(/Ãº/g, "ú")
    .replace(/Ã/g, "Á")
    .replace(/Ã‰/g, "É")
    .replace(/Ã/g, "Í")
    .replace(/Ã"/g, "Ó")
    .replace(/Ãš/g, "Ú")
    .replace(/Ã±/g, "ñ")
    .replace(/Ã'/g, "Ñ")
    .replace(/sesi�n/g, "sesión")
    .replace(/Sesi�n/g, "Sesión")
    .replace(/operaci�n/g, "operación")
    .replace(/Operaci�n/g, "Operación")
    .replace(/contrase�a/g, "contraseña")
    .replace(/Contrase�a/g, "Contraseña")
    .replace(/cr�ticas/g, "críticas")
    .replace(/Cr�ticas/g, "Críticas")
    .replace(/mant�n/g, "mantén")
    .replace(/est�s/g, "estás")
    .replace(/acci�n/g, "acción")
    .replace(/Acci�n/g, "Acción")
    .replace(/[<27>]/g, "")
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
    borderRadius: 10,
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

  const features = [
    cleanLoginText("Dashboard por rol con foco operativo inmediato."),
    cleanLoginText("Contexto multi-planta con continuidad de sesión."),
    cleanLoginText("Alertas, actividades y reportes conectados en el mismo flujo."),
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "20px",
        fontFamily: EXEC_TEXT_FONT,
        background: [
          "radial-gradient(circle at 18% 50%, rgba(249,115,22,0.20), transparent 38%)",
          "radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)",
          "linear-gradient(135deg, #080e1a 0%, #0f172a 55%, #101c2e 100%)",
        ].join(", "),
        backgroundSize: "auto, 26px 26px, auto",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 1020,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
          borderRadius: 20,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 50px 130px rgba(2,6,23,0.60), 0 0 0 1px rgba(249,115,22,0.08)",
        }}
      >
        {/* ═══ LEFT: Industrial dark panel ═══ */}
        <section
          style={{
            padding: "40px 38px 36px",
            background: "linear-gradient(165deg, #0f172a 0%, #111827 55%, #1a2640 100%)",
            color: "#fff",
            display: "grid",
            alignContent: "space-between",
            gap: 32,
            borderRight: "1px solid rgba(249,115,22,0.14)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Diagonal hatching texture */}
          <div
            style={{
              position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.035,
              backgroundImage: "repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)",
              backgroundSize: "20px 20px",
            }}
          />
          {/* Orange bottom accent line */}
          <div
            style={{
              position: "absolute", bottom: 0, left: 0, right: 0, height: 3,
              background: "linear-gradient(90deg, #f97316 0%, rgba(249,115,22,0.30) 60%, transparent 100%)",
            }}
          />

          <div style={{ position: "relative" }}>
            {/* System status badge */}
            <div
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "6px 12px 6px 10px",
                borderRadius: 6,
                background: "rgba(249,115,22,0.10)",
                border: "1px solid rgba(249,115,22,0.22)",
                borderLeft: "3px solid #f97316",
                fontSize: 10, fontWeight: 900, letterSpacing: "0.14em",
                color: "#fdba74", textTransform: "uppercase",
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: 999, background: "#22c55e", flexShrink: 0, boxShadow: "0 0 0 3px rgba(34,197,94,0.20)" }} />
              Sistema activo
            </div>

            {/* Logo */}
            <div style={{ marginTop: 24 }}>
              <img
                src={lubriPlanMark}
                alt="LubriPlan"
                style={{ width: 76, height: 76, objectFit: "contain", display: "block", filter: "drop-shadow(0 8px 20px rgba(249,115,22,0.25))" }}
              />
            </div>

            {/* Brand title */}
            <div
              style={{
                marginTop: 14,
                fontFamily: EXEC_DISPLAY_FONT,
                fontSize: "clamp(2.4rem, 5vw, 3.6rem)",
                lineHeight: 0.92,
                fontWeight: 900,
                letterSpacing: -1.8,
              }}
            >
              LubriPlan
            </div>

            {/* Orange underline */}
            <div style={{ marginTop: 10, width: 52, height: 3, background: "linear-gradient(90deg, #f97316 0%, rgba(249,115,22,0.40) 100%)", borderRadius: 999 }} />

            {/* Descriptor */}
            <div
              style={{
                marginTop: 18,
                maxWidth: 440,
                fontSize: 15,
                lineHeight: 1.65,
                color: "rgba(226,232,240,0.78)",
                fontWeight: 600,
              }}
            >
              {cleanLoginText("Plataforma de control operativo para lubricación industrial. Revisa alertas críticas, coordina actividades y mantén la planta bajo control desde un solo lugar.")}
            </div>
          </div>

          {/* Feature items — numbered industrial style */}
          <div style={{ display: "grid", gap: 10, position: "relative" }}>
            <div
              style={{
                fontSize: 10, fontWeight: 900, letterSpacing: "0.16em",
                color: "rgba(226,232,240,0.40)", textTransform: "uppercase",
                marginBottom: 4,
              }}
            >
              Capacidades del sistema
            </div>
            {features.map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex", gap: 12, alignItems: "flex-start",
                  padding: "12px 14px",
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderLeft: "3px solid rgba(249,115,22,0.50)",
                }}
              >
                <span
                  style={{
                    fontSize: 10, fontWeight: 900, color: "#f97316",
                    letterSpacing: "0.06em", lineHeight: 2, flexShrink: 0,
                    fontFamily: "monospace",
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span style={{ fontSize: 13, lineHeight: 1.6, color: "#e2e8f0", fontWeight: 700 }}>
                  {item}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ RIGHT: Form panel ═══ */}
        <section
          style={{
            padding: "40px 36px",
            display: "grid",
            alignContent: "center",
            background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
          }}
        >
          <div style={{ maxWidth: 370, width: "100%", margin: "0 auto" }}>

            {/* Kicker with orange line */}
            <div
              style={{
                display: "flex", alignItems: "center", gap: 8,
                fontSize: 11, fontWeight: 900, letterSpacing: "0.14em",
                textTransform: "uppercase", color: "#f97316",
              }}
            >
              <span style={{ display: "block", width: 22, height: 2, background: "#f97316", borderRadius: 999, flexShrink: 0 }} />
              Acceso seguro
            </div>

            <h1
              style={{
                margin: "12px 0 0",
                fontFamily: EXEC_DISPLAY_FONT,
                fontSize: 34,
                lineHeight: 1,
                letterSpacing: -0.8,
                fontWeight: 900,
                color: "#0f172a",
              }}
            >
              {cleanLoginText("Iniciar sesión")}
            </h1>

            <div
              style={{
                marginTop: 8, fontSize: 14, lineHeight: 1.65,
                color: "#64748b", fontWeight: 700,
              }}
            >
              {cleanLoginText("Usa tu correo corporativo para entrar y continuar exactamente donde te quedaste.")}
            </div>

            <form onSubmit={onSubmit} style={{ display: "grid", gap: 16, marginTop: 26 }}>

              {/* Email */}
              <div style={{ display: "grid", gap: 6 }}>
                <label
                  htmlFor="email"
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    fontSize: 11, fontWeight: 900, color: "#334155",
                    textTransform: "uppercase", letterSpacing: "0.10em",
                  }}
                >
                  <span style={{ width: 5, height: 5, borderRadius: 999, background: "#f97316", flexShrink: 0 }} />
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

              {/* Password */}
              <div style={{ display: "grid", gap: 6 }}>
                <label
                  htmlFor="password"
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    fontSize: 11, fontWeight: 900, color: "#334155",
                    textTransform: "uppercase", letterSpacing: "0.10em",
                  }}
                >
                  <span style={{ width: 5, height: 5, borderRadius: 999, background: "#f97316", flexShrink: 0 }} />
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
                      position: "absolute", right: 8, top: 8, bottom: 8,
                      borderRadius: 8,
                      border: "1px solid #dbe4ee",
                      background: "#f1f5f9",
                      color: "#334155",
                      fontWeight: 900, fontSize: 11,
                      padding: "0 12px",
                      cursor: loading ? "not-allowed" : "pointer",
                      fontFamily: EXEC_TEXT_FONT,
                      letterSpacing: "0.04em",
                    }}
                  >
                    {cleanLoginText(showPassword ? "Ocultar" : "Mostrar")}
                  </button>
                </div>
              </div>

              {/* Error */}
              {err ? (
                <div
                  style={{
                    borderRadius: 10,
                    borderLeft: "4px solid #be123c",
                    background: "#fff1f2",
                    border: "1px solid #fecdd3",
                    color: "#be123c",
                    fontWeight: 800,
                    fontSize: 13,
                    lineHeight: 1.5,
                    padding: "10px 13px",
                  }}
                >
                  {cleanLoginText(err)}
                </div>
              ) : null}

              {/* Submit */}
              <button
                disabled={loading}
                type="submit"
                style={{
                  height: 52,
                  borderRadius: 12,
                  border: "none",
                  borderBottom: "3px solid rgba(194,65,12,0.55)",
                  background: loading
                    ? "#fdba74"
                    : "linear-gradient(180deg, #fb923c 0%, #f97316 100%)",
                  color: "#0b1220",
                  fontWeight: 900,
                  fontSize: 15,
                  letterSpacing: "0.02em",
                  cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: loading ? "none" : "0 18px 36px rgba(249,115,22,0.28)",
                  fontFamily: EXEC_TEXT_FONT,
                }}
              >
                {cleanLoginText(loading ? "Entrando..." : "Entrar a LubriPlan")}
              </button>
            </form>

            {/* Bottom note */}
            <div
              style={{
                marginTop: 20,
                paddingTop: 16,
                borderTop: "1px solid #e2e8f0",
                fontSize: 12,
                lineHeight: 1.65,
                color: "#94a3b8",
                fontWeight: 700,
              }}
            >
              {cleanLoginText("Si tu acceso falla, valida que tu usuario siga activo y que estés entrando con el correo correcto.")}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
