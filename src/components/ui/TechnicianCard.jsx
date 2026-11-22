// src/components/ui/TechnicianCard.jsx
import { Icon } from "../ui/lpIcons";
import { prettySpecialty } from "../../utils/technicians";

export default function TechnicianCard({ technician, onEdit, onDelete, canDelete = false }) {
  const t = technician || {};
  const isActive = ["ACTIVO", "ACTIVE"].includes(String(t.status || "").toUpperCase().trim());
  const specialty = String(t.specialty || "").trim();
  const stats = t.stats || null;
  const certs = Array.isArray(t.certifications) ? t.certifications.filter(Boolean) : [];

  const last = toDate(t.lastActivityAt || t.lastExecutionAt || t.lastCompletedAt || t.lastCompletedExecutionAt);
  const activityClass = activityClassOf(last);

  return (
    <article className={`tch-card ${isActive ? "" : "is-inactive"}`}>
      <div className="tch-card-head">
        <div className="tch-avatar" aria-hidden="true">{getInitials(t.name)}</div>
        <div style={{ minWidth: 0 }}>
          <div className="tch-name">{t.name || "—"}</div>
          {specialty ? <div className="tch-specialty">{prettySpecialty(specialty)}</div> : null}
        </div>
        <div className="tch-card-actions">
          {typeof onEdit === "function" ? (
            <button type="button" className="tch-icon-btn" onClick={() => onEdit(t)} title="Editar" aria-label={`Editar a ${t.name}`}>
              <Icon name="edit" size="sm" />
            </button>
          ) : null}
          {canDelete && typeof onDelete === "function" ? (
            <button type="button" className="tch-icon-btn is-danger" onClick={() => onDelete(t)} title="Eliminar" aria-label={`Eliminar a ${t.name}`}>
              <Icon name="trash" size="sm" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="tch-chips">
        {t.code ? <span className="tch-chip is-code" title="Código de técnico">{t.code}</span> : null}
        <span className={`tch-chip ${isActive ? "is-active" : "is-inactive"}`}>
          <span className="tch-dot" />
          {isActive ? "Activo" : "Inactivo"}
        </span>
        {t.hasAppAccess ? (
          <span className="tch-chip is-app" title="Tiene usuario para entrar a LubriPlan">
            <Icon name="userCheck" size="sm" /> Acceso a la app
          </span>
        ) : null}
      </div>

      {t.email || t.phone ? (
        <div className="tch-contact">
          {t.email ? (
            <a href={`mailto:${t.email}`} title={t.email}>
              <MailIcon /> {t.email}
            </a>
          ) : null}
          {t.phone ? (
            <a href={`tel:${String(t.phone).replace(/[^\d+]/g, "")}`}>
              <PhoneIcon /> {t.phone}
            </a>
          ) : null}
        </div>
      ) : null}

      {certs.length ? (
        <div className="tch-certs">
          <b>Certificaciones</b>
          {certs.join(" · ")}
        </div>
      ) : null}

      {stats ? (
        <div className="tch-stats" aria-label="Carga de trabajo">
          <Stat value={stats.routes} label="Rutas" />
          <Stat value={stats.pending} label="Pendientes" />
          <Stat value={stats.overdue} label="Vencidas" danger={stats.overdue > 0} />
          <Stat value={stats.completed30d} label="Hechas 30d" />
        </div>
      ) : null}

      <div className={`tch-activity ${activityClass}`}>
        <Icon name="clock" size="sm" />
        {last ? (
          <span>
            Última actividad: <strong>{formatRelative(last)}</strong>
          </span>
        ) : (
          <span>Sin actividad registrada</span>
        )}
      </div>
    </article>
  );
}

function Stat({ value, label, danger = false }) {
  return (
    <div className="tch-stat">
      <div className={`tch-stat-value ${danger ? "is-danger" : ""}`}>{Number(value) || 0}</div>
      <div className="tch-stat-label">{label}</div>
    </div>
  );
}

function MailIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />
    </svg>
  );
}

/* ── Helpers ── */

function toDate(v) {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isFinite(d.getTime()) ? d : null;
}

function getInitials(name) {
  if (!name) return "—";
  const parts = String(name).trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase();
}

function activityClassOf(date) {
  if (!date) return "";
  const hours = (Date.now() - date.getTime()) / 36e5;
  if (hours < 24) return "is-recent";
  return hours > 24 * 7 ? "is-stale" : "";
}

function formatRelative(date) {
  const min = Math.floor(Math.max(0, Date.now() - date.getTime()) / 60000);
  if (min < 1) return "hace unos segundos";
  if (min < 60) return `hace ${min} min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `hace ${hr} h`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `hace ${day} día${day === 1 ? "" : "s"}`;
  const months = Math.floor(day / 30);
  if (months < 12) return `hace ${months} mes${months === 1 ? "" : "es"}`;
  const years = Math.floor(months / 12);
  return `hace ${years} año${years === 1 ? "" : "s"}`;
}
