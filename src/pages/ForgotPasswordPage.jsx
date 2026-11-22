import { useState } from "react";
import { Link } from "react-router-dom";
import AuthShell from "../components/auth/AuthShell";
import { Icon } from "../components/ui/lpIcons";
import { requestPasswordReset } from "../services/passwordResetService";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | sent
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      setErr("Ingresa un correo válido.");
      return;
    }
    setErr("");
    setStatus("sending");
    try {
      await requestPasswordReset(clean);
      setStatus("sent");
    } catch (ex) {
      setStatus("idle");
      setErr(ex?.message || "No pudimos procesar la solicitud. Intenta de nuevo.");
    }
  }

  return (
    <AuthShell>
      <div className="lpg-label">Recuperar acceso</div>

      {status === "sent" ? (
        <>
          <h2 className="lpg-title">Revisa tu correo</h2>
          <p className="lpg-sub">
            Si <strong style={{ color: "var(--text)" }}>{email.trim().toLowerCase()}</strong> está
            registrado, te enviamos un enlace para crear una nueva contraseña. Vence en 30 minutos.
          </p>
          <div className="lpg-alert lpg-alert-info" style={{ marginTop: 24 }} role="status">
            <Icon name="info" size="sm" />
            <span>¿No llega? Revisa la carpeta de spam o pide a un administrador que restablezca tu contraseña.</span>
          </div>
          <div className="lpg-form">
            <Link to="/login" className="lpg-submit" style={{ textDecoration: "none" }}>
              <Icon name="arrowLeft" size="sm" /> Volver a iniciar sesión
            </Link>
          </div>
        </>
      ) : (
        <>
          <h2 className="lpg-title">¿Olvidaste tu contraseña?</h2>
          <p className="lpg-sub">Escribe el correo de tu cuenta y te enviaremos un enlace para crear una nueva.</p>

          <form className="lpg-form" onSubmit={onSubmit} noValidate>
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
                disabled={status === "sending"}
              />
            </div>

            {err && (
              <div className="lpg-alert lpg-alert-error" role="alert">
                <Icon name="alert" size="sm" />
                <span>{err}</span>
              </div>
            )}

            <button className="lpg-submit" type="submit" disabled={status === "sending"}>
              {status === "sending" ? (
                <>
                  <span className="lpg-spinner" aria-hidden="true" /> Enviando…
                </>
              ) : (
                "Enviar enlace"
              )}
            </button>
          </form>

          <div className="lpg-help">
            <Link to="/login" className="lpg-link">
              <Icon name="arrowLeft" size="sm" /> Volver a iniciar sesión
            </Link>
          </div>
        </>
      )}
    </AuthShell>
  );
}
