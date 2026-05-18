// src/components/ui/TechnicianCard.jsx
import { useMemo, useState } from "react";
import { Icon } from "../ui/lpIcons";

export default function TechnicianCard({ technician, onEdit, onDelete, canDelete = false }) {
  const [hover, setHover] = useState(false);

  const statusRaw = String(technician?.status || "").toUpperCase().trim();
  const isActive  = statusRaw === "ACTIVO" || statusRaw === "ACTIVE";
  const statusLabel = isActive ? "Activo" : statusRaw ? "Inactivo" : "—";

  const specialty = String(technician?.specialty || "").trim();
  const code      = technician?.code || "";

  const realLastActivity = useMemo(() => {
    const raw =
      technician?.lastActivityAt ||
      technician?.lastExecutionAt ||
      technician?.lastCompletedAt ||
      technician?.lastCompletedExecutionAt ||
      null;
    if (!raw) return null;
    const dt = raw instanceof Date ? raw : new Date(raw);
    return Number.isFinite(dt.getTime()) ? dt : null;
  }, [
    technician?.lastActivityAt,
    technician?.lastExecutionAt,
    technician?.lastCompletedAt,
    technician?.lastCompletedExecutionAt,
  ]);

  const lastText  = formatRelative(realLastActivity);
  const actTone   = activityTone(realLastActivity);
  const initials  = getInitials(technician?.name);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...card,
        borderLeft: isActive
          ? "4px solid rgba(249,115,22,0.55)"
          : "4px solid rgba(148,163,184,0.40)",
        transform: hover ? "translateY(-3px)" : "translateY(0)",
        boxShadow: hover
          ? "0 20px 44px rgba(2,6,23,0.13), 0 4px 12px rgba(2,6,23,0.07)"
          : "0 10px 24px rgba(2,6,23,0.07)",
      }}
    >
      {/* ── HEADER: avatar + nombre + acciones ── */}
      <div style={header}>
        <div style={avatarWrap} aria-hidden>
          <div style={avatarRing} />
          <div style={avatarCore}>{initials}</div>
        </div>

        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={nameRow}>
            <span style={nameText} title={technician?.name || ""}>
              {technician?.name || "—"}
            </span>

            <div style={actionGroup} onClick={(e) => e.stopPropagation()}>
              {typeof onEdit === "function" ? (
                <button
                  type="button"
                  style={iconBtn}
                  onClick={() => onEdit?.(technician)}
                  title="Editar"
                  aria-label="Editar técnico"
                >
                  <Icon name="edit" size="sm" />
                </button>
              ) : null}
              {canDelete && typeof onDelete === "function" ? (
                <button
                  type="button"
                  style={iconBtnDanger}
                  onClick={() => onDelete?.(technician.id)}
                  title="Eliminar"
                  aria-label="Eliminar técnico"
                >
                  <Icon name="trash" size="sm" />
                </button>
              ) : null}
            </div>
          </div>

          {specialty ? (
            <div style={specialtyLabel}>{specialty}</div>
          ) : null}
        </div>
      </div>

      {/* ── META: código + estado ── */}
      <div style={metaRow}>
        {code ? (
          <span style={codePill} title="Código de técnico">
            <Icon name="tag" size="sm" />
            {code}
          </span>
        ) : null}

        <span style={statusPill(isActive)}>
          <span style={statusDot(isActive)} />
          {statusLabel}
        </span>
      </div>

      {/* ── FOOTER: última actividad ── */}
      <div style={{ ...activityBar, ...actTone }}>
        <span style={activityIcon}>
          <Icon name="clock" size="sm" />
        </span>
        <div style={activityContent}>
          <span style={activityLabel}>
            {realLastActivity ? "Última actividad" : "Sin actividad registrada"}
          </span>
          <span style={activityValue}>{lastText}</span>
        </div>
      </div>
    </div>
  );
}

/* ── Helpers ── */

function getInitials(name) {
  if (!name) return "—";
  const parts = String(name).trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase();
}

function formatRelative(date) {
  if (!date || !Number.isFinite(date.getTime())) return "Sin actividad";
  const min = Math.floor(Math.max(0, Date.now() - date.getTime()) / 60000);
  if (min < 1)  return "Hace unos segundos";
  if (min < 60) return `Hace ${min} min`;
  const hr = Math.floor(min / 60);
  if (hr < 24)  return `Hace ${hr} h`;
  const day = Math.floor(hr / 24);
  return `Hace ${day} día${day === 1 ? "" : "s"}`;
}

function activityTone(date) {
  if (!date || !Number.isFinite(date.getTime())) {
    return { background: "rgba(148,163,184,0.10)", borderTop: "1px solid rgba(148,163,184,0.20)", color: "#64748b" };
  }
  const hrs = Math.max(0, Date.now() - date.getTime()) / 36e5;
  if (hrs < 24) return { background: "rgba(34,197,94,0.08)",  borderTop: "1px solid rgba(34,197,94,0.18)",  color: "#166534" };
  if (hrs < 72) return { background: "rgba(245,158,11,0.10)", borderTop: "1px solid rgba(245,158,11,0.22)", color: "#92400e" };
  return           { background: "rgba(148,163,184,0.10)", borderTop: "1px solid rgba(148,163,184,0.20)", color: "#475569" };
}

/* ── Styles ── */

const card = {
  background: "linear-gradient(180deg, rgba(255,255,255,0.97) 0%, rgba(248,250,252,0.92) 100%)",
  border: "1px solid rgba(226,232,240,0.95)",
  borderTop: "3px solid #0f172a",
  borderRadius: 18,
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  gap: 0,
  transition: "transform 200ms cubic-bezier(0.22,1,0.36,1), box-shadow 200ms ease",
  boxShadow: "0 10px 24px rgba(2,6,23,0.07)",
};

const header = {
  display: "flex",
  gap: 12,
  alignItems: "flex-start",
  padding: "14px 14px 0",
};

const avatarWrap = {
  width: 46,
  height: 46,
  position: "relative",
  flexShrink: 0,
};

const avatarRing = {
  position: "absolute",
  inset: 0,
  borderRadius: 999,
  background: "linear-gradient(135deg, rgba(249,115,22,0.30), rgba(15,23,42,0.20))",
  border: "1px solid rgba(249,115,22,0.25)",
};

const avatarCore = {
  position: "absolute",
  inset: 3,
  borderRadius: 999,
  background: "linear-gradient(135deg, #1e293b, #0f172a)",
  display: "grid",
  placeItems: "center",
  fontWeight: 900,
  fontSize: 14,
  color: "#f97316",
  letterSpacing: 1,
  boxShadow: "inset 0 1px 0 rgba(249,115,22,0.15)",
};

const nameRow = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 8,
};

const nameText = {
  fontSize: 15,
  fontWeight: 900,
  color: "#0f172a",
  lineHeight: 1.2,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  minWidth: 0,
};

const specialtyLabel = {
  marginTop: 4,
  fontSize: 11,
  fontWeight: 900,
  color: "#64748b",
  letterSpacing: 0.4,
  textTransform: "uppercase",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const actionGroup = {
  display: "flex",
  gap: 6,
  flexShrink: 0,
};

const iconBtn = {
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.90)",
  borderRadius: 10,
  padding: "7px 9px",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#334155",
};

const iconBtnDanger = {
  ...iconBtn,
  border: "1px solid rgba(254,202,202,0.90)",
  background: "rgba(255,241,242,0.80)",
  color: "#b91c1c",
};

const metaRow = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  alignItems: "center",
  padding: "10px 14px",
};

const codePill = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "5px 10px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 950,
  color: "#0f172a",
  background: "rgba(15,23,42,0.05)",
  border: "1px solid rgba(226,232,240,0.95)",
  whiteSpace: "nowrap",
};

const statusPill = (active) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "5px 10px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 950,
  background: active ? "rgba(34,197,94,0.10)" : "rgba(148,163,184,0.12)",
  color:      active ? "#14532d"              : "#475569",
  border:     active ? "1px solid rgba(34,197,94,0.25)" : "1px solid rgba(148,163,184,0.25)",
  whiteSpace: "nowrap",
});

const statusDot = (active) => ({
  width: 7,
  height: 7,
  borderRadius: 999,
  background: active ? "#22c55e" : "#94a3b8",
  flexShrink: 0,
});

const activityBar = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "10px 14px",
  marginTop: "auto",
};

const activityIcon = {
  display: "inline-flex",
  width: 30,
  height: 30,
  borderRadius: 10,
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(255,255,255,0.50)",
  border: "1px solid rgba(255,255,255,0.70)",
  flexShrink: 0,
};

const activityContent = {
  display: "flex",
  flexDirection: "column",
  gap: 1,
  minWidth: 0,
};

const activityLabel = {
  fontSize: 10,
  fontWeight: 900,
  letterSpacing: 0.4,
  textTransform: "uppercase",
  opacity: 0.75,
};

const activityValue = {
  fontSize: 13,
  fontWeight: 900,
  lineHeight: 1.2,
};
