import { Link } from "react-router-dom";

export default function EmptyState({
  icon,
  title = "Sin resultados",
  description = "No hay elementos para mostrar aquí.",
  actionLabel,
  actionTo,
  onAction,
}) {
  return (
    <div style={wrap}>
      <div style={iconWrap}>
        {icon ?? <DefaultIcon />}
      </div>

      <h3 style={titleStyle}>{title}</h3>
      <p style={descStyle}>{description}</p>

      {actionLabel && actionTo && (
        <Link to={actionTo} className="lp-btn lp-btn-primary" style={{ marginTop: 20 }}>
          {actionLabel}
        </Link>
      )}

      {actionLabel && onAction && !actionTo && (
        <button type="button" onClick={onAction} className="lp-btn lp-btn-primary" style={{ marginTop: 20 }}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function DefaultIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ opacity: 0.35 }}>
      <rect x="6" y="8" width="36" height="32" rx="6" stroke="currentColor" strokeWidth="2.5" />
      <path d="M14 18h20M14 24h14M14 30h10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

const wrap = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "48px 32px",
  borderRadius: 20,
  background: "var(--lp-surface)",
  border: "1px dashed var(--lp-border-hover)",
  textAlign: "center",
  marginTop: 8,
  animation: "fadeIn 280ms ease both",
};

const iconWrap = {
  width: 80,
  height: 80,
  borderRadius: "50%",
  background: "var(--lp-surface-2)",
  border: "1px solid var(--lp-border)",
  display: "grid",
  placeItems: "center",
  marginBottom: 20,
  color: "var(--lp-text-muted)",
};

const titleStyle = {
  margin: 0,
  fontSize: 18,
  fontWeight: 800,
  color: "var(--lp-text)",
  letterSpacing: -0.2,
};

const descStyle = {
  margin: "8px 0 0",
  fontSize: 14,
  color: "var(--lp-text-muted)",
  fontWeight: 600,
  maxWidth: 340,
  lineHeight: 1.6,
};
