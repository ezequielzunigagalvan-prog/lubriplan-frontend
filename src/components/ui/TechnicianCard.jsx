 // src/components/ui/TechnicianCard.jsx
import { useMemo, useState } from "react";
import { Icon } from "../ui/lpIcons";

export default function TechnicianCard({
  technician,
  onEdit,
  onDelete,
  canDelete = false,
}) {
  const statusRaw = String(technician?.status || "");
  const status = statusRaw.toUpperCase().trim();

  const specialtyRaw = String(technician?.specialty || "—");
  const specialty = specialtyRaw.toUpperCase().trim();

  const code = technician?.code || "—";

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

  const lastText = formatRelative(realLastActivity);
  const tone = activityTone(realLastActivity);
  const hasRealActivity = Boolean(realLastActivity);

  const isActive = status === "ACTIVO" || status === "ACTIVE";
  const [hover, setHover] = useState(false);

  const initials = getInitials(technician?.name);

  return (
    <div
      style={{ ...card, ...(hover ? cardHover : null) }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div style={topAccent} />

      <div style={header}>
        <div style={avatarWrap} aria-hidden>
          <div style={avatarRing} />
          <div style={avatarCore}>{initials}</div>
        </div>

        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={nameRow}>
            <h3 style={name} title={technician?.name || ""}>
              {String(technician?.name || "—").toUpperCase()}
            </h3>

            <div style={actions}>
              {typeof onEdit === "function" ? (
                <button
                  type="button"
                  style={{ ...iconBtn, ...(hover ? iconBtnHover : null) }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.(technician);
                  }}
                  title="Editar"
                  aria-label="Editar técnico"
                >
                  <Icon name="edit" />
                </button>
              ) : null}

              {canDelete && typeof onDelete === "function" ? (
                <button
                  type="button"
                  style={{
                    ...iconBtn,
                    ...iconBtnDanger,
                    ...(hover ? iconBtnDangerHover : null),
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.(technician.id);
                  }}
                  title="Eliminar"
                  aria-label="Eliminar técnico"
                >
                  <Icon name="trash" />
                </button>
              ) : null}
            </div>
          </div>

          <div style={subRow}>
            <span style={codeBadge} title="Código">
              <span style={badgeIcon}>
                <Icon name="tag" />
              </span>
              <span style={{ fontWeight: 1000, letterSpacing: 0.2 }}>{code}</span>
            </span>

            <span style={specChip} title="Especialidad">
              <span style={specTop}>ESPECIALIDAD</span>
              <span style={specVal}>{specialty || "—"}</span>
            </span>
          </div>
        </div>
      </div>

      <div style={body}>
        <span style={statusPill(isActive)} title="Estatus">
          <span style={dot(isActive)} />
          {status || "—"}
        </span>

        <div
          style={{ ...activityBox, ...tone }}
          title={realLastActivity ? realLastActivity.toLocaleString() : "Sin actividad"}
        >
          <div style={activityTop}>
            <span style={activityIcon}>
              <Icon name="clock" />
            </span>
            <span style={activityLbl}>
              {hasRealActivity ? "Última actividad" : "Sin actividad registrada"}
            </span>
          </div>
          <div style={activityVal}>{lastText}</div>
        </div>
      </div>
    </div>
  );
}

/* ======= helpers ======= */

function getInitials(name) {
  if (!name) return "—";
  const parts = String(name).trim().split(/\s+/);
  const first = parts[0]?.[0] || "";
  const second = parts[1]?.[0] || "";
  return (first + second).toUpperCase();
}

function formatRelative(date) {
  if (!date || !Number.isFinite(date.getTime())) return "Sin actividad";

  const diffMs = Math.max(0, Date.now() - date.getTime());
  const min = Math.floor(diffMs / 60000);

  if (min < 1) return "Hace unos segundos";
  if (min < 60) return `Hace ${min} min`;

  const hr = Math.floor(min / 60);
  if (hr < 24) return `Hace ${hr} h`;

  const day = Math.floor(hr / 24);
  return `Hace ${day} d`;
}

function activityTone(date) {
  if (!date || !Number.isFinite(date.getTime())) {
    return {
      background: "rgba(148,163,184,0.18)",
      border: "1px solid rgba(100,116,139,0.45)",
      color: "#334155",
    };
  }

  const hrs = Math.max(0, Date.now() - date.getTime()) / 36e5;

  if (hrs < 24) {
    return {
      background: "rgba(34,197,94,0.20)",
      border: "1px solid rgba(22,163,74,0.50)",
      color: "#14532d",
    };
  }

  if (hrs < 72) {
    return {
      background: "rgba(245,158,11,0.22)",
      border: "1px solid rgba(217,119,6,0.55)",
      color: "#7c2d12",
    };
  }

  return {
    background: "rgba(148,163,184,0.18)",
    border: "1px solid rgba(100,116,139,0.45)",
    color: "#334155",
  };
}

/* ======= styles ======= */

const card = {
  position: "relative",
  background: "rgba(255,255,255,0.74)",
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 18,
  padding: 14,
  transition: "transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease",
  boxShadow: "0 10px 22px rgba(15,23,42,0.06)",
  overflow: "hidden",
};

const cardHover = {
  transform: "translateY(-2px)",
  border: "1px solid rgba(148,163,184,0.70)",
  boxShadow: "0 18px 34px rgba(15,23,42,0.10)",
};

const topAccent = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: 6,
  borderTopLeftRadius: 18,
  borderTopRightRadius: 18,
  background: "#f97316",
};

const header = {
  display: "flex",
  gap: 12,
  alignItems: "flex-start",
  marginTop: 6,
};

const avatarWrap = {
  width: 44,
  height: 44,
  position: "relative",
  flexShrink: 0,
};

const avatarRing = {
  position: "absolute",
  inset: 0,
  borderRadius: 999,
  background: "linear-gradient(180deg, rgba(15,23,42,0.18), rgba(15,23,42,0.08))",
  border: "1px solid rgba(15,23,42,0.35)",
};

const avatarCore = {
  position: "absolute",
  inset: 3,
  borderRadius: 999,
  background: "linear-gradient(135deg, #334155, #1e293b)",
  display: "grid",
  placeItems: "center",
  fontWeight: 1000,
  fontSize: 14,
  color: "#ffffff",
  letterSpacing: 0.8,
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15)",
};

const nameRow = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  justifyContent: "space-between",
};

const name = {
  margin: 0,
  fontSize: 15,
  fontWeight: 1000,
  color: "#020617",
  letterSpacing: 0.6,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  whiteSpace: "normal",
  lineHeight: 1.15,
};

const actions = {
  display: "flex",
  gap: 8,
  flexShrink: 0,
  width: 104,
  justifyContent: "flex-end",
};

const iconBtn = {
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.92)",
  borderRadius: 12,
  padding: "10px 12px",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#0f172a",
  transition: "transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease",
};

const iconBtnHover = {
  border: "1px solid rgba(148,163,184,0.75)",
  boxShadow: "0 10px 18px rgba(2,6,23,0.06)",
};

const iconBtnDanger = {
  border: "1px solid rgba(254,202,202,0.95)",
  background: "rgba(255,241,242,0.85)",
};

const iconBtnDangerHover = {
  boxShadow: "0 10px 18px rgba(153,27,27,0.08)",
};

const subRow = {
  marginTop: 10,
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  alignItems: "stretch",
};

const codeBadge = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 10px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 950,
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(248,250,252,0.90)",
  color: "#0f172a",
};

const badgeIcon = {
  display: "inline-flex",
  width: 26,
  height: 26,
  borderRadius: 999,
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(15,23,42,0.06)",
  border: "1px solid rgba(226,232,240,0.95)",
};

const specChip = {
  display: "inline-flex",
  flexDirection: "column",
  justifyContent: "center",
  gap: 2,
  padding: "8px 12px",
  borderRadius: 14,
  background: "rgba(15,23,42,0.04)",
  border: "1px solid rgba(226,232,240,0.80)",
  minWidth: 160,
};

const specTop = {
  fontSize: 10,
  fontWeight: 1000,
  letterSpacing: 0.9,
  color: "#475569",
};

const specVal = {
  fontSize: 11,
  fontWeight: 1000,
  color: "#0f172a",
  letterSpacing: 0.4,
};

const body = {
  marginTop: 12,
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  flexWrap: "wrap",
  alignItems: "center",
};

const statusPill = (active) => ({
  padding: "8px 12px",
  borderRadius: 999,
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  fontSize: 11,
  fontWeight: 1000,
  letterSpacing: 0.3,
  background: active ? "rgba(34,197,94,0.10)" : "rgba(245,158,11,0.12)",
  border: active ? "1px solid rgba(34,197,94,0.22)" : "1px solid rgba(245,158,11,0.22)",
  color: active ? "#14532d" : "#78350f",
});

const dot = (active) => ({
  width: 9,
  height: 9,
  borderRadius: 999,
  background: active ? "#22c55e" : "#f59e0b",
  boxShadow: "0 0 0 3px rgba(15,23,42,0.05)",
});

const activityBox = {
  minWidth: 210,
  padding: "10px 12px",
  borderRadius: 14,
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const activityTop = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  opacity: 0.95,
};

const activityIcon = {
  display: "inline-flex",
  width: 26,
  height: 26,
  borderRadius: 10,
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(255,255,255,0.55)",
  border: "1px solid rgba(226,232,240,0.75)",
};

const activityLbl = {
  fontSize: 11,
  fontWeight: 1000,
  letterSpacing: 0.2,
};

const activityVal = {
  fontSize: 13,
  fontWeight: 1000,
  color: "currentColor",
};