import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import AuthShell, { EyeIcon } from "../components/auth/AuthShell";
import { Icon } from "../components/ui/lpIcons";
import { checkResetToken, resetPassword } from "../services/passwordResetService";

// El token llega en el fragmento (#token=...) para que no quede en logs de servidores.
function readToken(location) {
  const fromHash = new URLSearchParams(String(location.hash || "").replace(/^#/, "")).get("token");
  const fromQuery = new URLSearchParams(location.search).get("token");
  return fromHash || fromQuery || "";
}

export default function ResetPasswordPage() {
  const location = useLocation();
  const token = useMemo(() => readToken(location), [location]);

  const [check, setCheck] = useState(token ? "checking" : "invalid"); // checking | valid | invalid
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | saving | done
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!token) return undefined;
    let alive = true;
    checkResetToken(token)
      .then((r) => {
        if (!alive) return;
        setEmail(r?.email || "");
        setCheck("valid");
      })
      .catch(() => alive && setCheck("invalid"));
    return () => {
      alive = false;
    };
  }, [token]);

  async function onSubmit(e) {
    e.preventDefault();
    if (password.length < 8) {
      setErr("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setErr("Las contraseñas no coinciden.");
      return;
    }
    setErr("");
    setStatus("saving");
    try {
      await resetPassword(token, password);
      setStatus("done");
    } catch (ex) {
      setStatus("idle");
      setErr(ex?.message || "No se pudo restablecer la contraseña.");
    }
  }

  const lengthOk = password.length >= 8;
  const matchOk = confirm.length > 0 && password === confirm;

  return (
    <AuthShell>
      <div className="lpg-label">Nueva contraseña</div>

      {check === "checking" && (
        <>
          <h2 className="lpg-title">Verificando enlace…</h2>
          <div className="lpg-form">
            <span className="lpg-spinner lpg-spinner-light" aria-label="Cargando" />
          </div>
        </>
      )}

      {check === "invalid" && (
        <>
          <h2 className="lpg-title">El enlace ya no es válido</h2>
          <p className="lpg-sub">
            Puede haber vencido (dura 30 minutos) o ya se usó. Solicita uno nuevo para continuar.
          </p>
          <div className="lpg-form">
            <Link to="/forgot-password" className="lpg-submit" style={{ textDecoration: "none" }}>
              Solicitar un enlace nuevo
            </Link>
          </div>
          <div className="lpg-help">
            <Link to="/login" className="lpg-link">
              <Icon name="arrowLeft" size="sm" /> Volver a iniciar sesión
            </Link>
          </div>
        </>
      )}

      {check === "valid" && status === "done" && (
        <>
          <h2 className="lpg-title">Contraseña actualizada</h2>
          <p className="lpg-sub">Ya puedes entrar a LubriPlan con tu nueva contraseña.</p>
          <div className="lpg-form">
            <Link to="/login" className="lpg-submit" style={{ textDecoration: "none" }}>
              Iniciar sesión <Icon name="arrowRight" size="sm" />
            </Link>
          </div>
        </>
      )}

      {check === "valid" && status !== "done" && (
        <>
          <h2 className="lpg-title">Crea una nueva contraseña</h2>
          <p className="lpg-sub">
            {email ? (
              <>Para la cuenta <strong style={{ color: "var(--text)" }}>{email}</strong>.</>
            ) : (
              "Elige una contraseña que no uses en otros sitios."
            )}
          </p>

          <form className="lpg-form" onSubmit={onSubmit} noValidate>
            {/* Campo oculto para que el gestor de contraseñas asocie la cuenta */}
            <input type="email" value={email} autoComplete="username" readOnly hidden />

            <div className="lpg-field">
              <label htmlFor="new-password">Nueva contraseña</label>
              <div className="lpg-input-wrap">
                <input
                  id="new-password"
                  className="lpg-input lpg-input-pass"
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  autoFocus
                  disabled={status === "saving"}
                />
                <button
                  type="button"
                  className="lpg-eye"
                  onClick={() => setShow((v) => !v)}
                  aria-label={show ? "Ocultar contraseñas" : "Mostrar contraseñas"}
                  aria-pressed={show}
                >
                  <EyeIcon off={show} />
                </button>
              </div>
            </div>

            <div className="lpg-field">
              <label htmlFor="confirm-password">Confirma la contraseña</label>
              <input
                id="confirm-password"
                className="lpg-input"
                type={show ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                disabled={status === "saving"}
              />
            </div>

            <ul className="lpg-rules" aria-label="Requisitos">
              <li className={lengthOk ? "ok" : ""}>
                <Icon name={lengthOk ? "checkCircle" : "dot"} size="sm" /> Al menos 8 caracteres
              </li>
              <li className={matchOk ? "ok" : ""}>
                <Icon name={matchOk ? "checkCircle" : "dot"} size="sm" /> Ambas contraseñas coinciden
              </li>
            </ul>

            {err && (
              <div className="lpg-alert lpg-alert-error" role="alert">
                <Icon name="alert" size="sm" />
                <span>{err}</span>
              </div>
            )}

            <button className="lpg-submit" type="submit" disabled={status === "saving"}>
              {status === "saving" ? (
                <>
                  <span className="lpg-spinner" aria-hidden="true" /> Guardando…
                </>
              ) : (
                "Guardar contraseña"
              )}
            </button>
          </form>
        </>
      )}
    </AuthShell>
  );
}
