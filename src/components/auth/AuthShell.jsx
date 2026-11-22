// Marco común de las pantallas de acceso (login, recuperar y restablecer contraseña).
import { Link } from "react-router-dom";
import { Icon } from "../ui/lpIcons";
import lubriPlanLogo from "../../assets/lubriplan-logo.png.png";
import "../../pages/LoginPage.css";

const FEATURES = [
  "Panel por rol con foco operativo inmediato",
  "Varias plantas con una sola sesión",
  "Alertas, actividades y reportes en el mismo flujo",
];

export default function AuthShell({ children }) {
  return (
    <div className="lpg">
      <div className="lpg-hazard" />

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

      <main className="lpg-form-side">
        <div className="lpg-card">{children}</div>
      </main>
    </div>
  );
}

export function EyeIcon({ off = false }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
      {off && <path d="M3 3l18 18" />}
    </svg>
  );
}
