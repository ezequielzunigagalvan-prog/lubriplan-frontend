import { useState } from "react";
import { Icon } from "./lpIcons";

const toLocalYMD = (value) => {
  if (!value) return "";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "";
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const STATUS_TONES = {
  Atrasada:   { bg: "rgba(254,226,226,0.55)", border: "rgba(239,68,68,0.18)",  top: "#dc2626", badgeBg: "#fee2e2", badgeColor: "#b91c1c" },
  Pendiente:  { bg: "rgba(255,251,235,0.55)", border: "rgba(245,158,11,0.18)", top: "#0f172a", badgeBg: "#fef3c7", badgeColor: "#92400e" },
  Completada: { bg: "rgba(240,253,244,0.55)", border: "rgba(34,197,94,0.18)",  top: "#15803d", badgeBg: "#dcfce7", badgeColor: "#166534" },
};

const KIND_ICON = { INSPECTION: "search", LUBRICATION: "drop", DEFAULT: "tool" };
const KIND_TONE = {
  INSPECTION: { bg: "rgba(59,130,246,0.12)", color: "#1d4ed8" },
  LUBRICATION: { bg: "rgba(249,115,22,0.12)", color: "#c2410c" },
  DEFAULT: { bg: "rgba(15,23,42,0.08)", color: "#334155" },
};

function getKind(routeKind) {
  const k = String(routeKind || "").trim().toUpperCase();
  if (k === "INSPECTION") return "INSPECTION";
  if (k === "LUBRICATION") return "LUBRICATION";
  return "DEFAULT";
}

function InfoChip({ label, value }) {
  if (!value || value === "—") return null;
  return (
    <span style={infoChip}>
      <span style={infoChipLabel}>{label}</span>
      <span style={infoChipValue}>{value}</span>
    </span>
  );
}

export default function ActivityCard({ activity, onOpen }) {
  const [hover, setHover] = useState(false);
  const today = toLocalYMD(new Date());

  const status = activity?.status || activity?.computedStatus || "Pendiente";
  const isCompleted = status === "Completada" || activity?.statusRaw === "COMPLETED";

  const dateStr = toLocalYMD(activity?.date || activity?.scheduledAt || activity?.dateLabel || "");
  const isFuture = !isCompleted && dateStr && dateStr > today;
  const clickable = !isCompleted && !isFuture;

  const routeKind = activity?.route?.routeKind || activity?.routeKind || "";
  const kind = getKind(routeKind);
  const kindIcon = KIND_ICON[kind];
  const kindTone = KIND_TONE[kind];

  const displayRouteName = formatRouteDisplayName(
    activity?.routeName || activity?.route?.name || activity?.activityName,
    routeKind,
    "Ruta"
  );

  const eqObj =
    activity?.equipment && typeof activity.equipment === "object"
      ? activity.equipment
      : activity?.route?.equipment && typeof activity.route.equipment === "object"
      ? activity.route.equipment
      : null;

  const equipmentName =
    eqObj?.name ||
    activity?.equipmentName ||
    (typeof activity?.equipment === "string" ? activity.equipment : "") ||
    "—";
  const equipmentCode = eqObj?.code || activity?.equipmentCode || "";
  const equipmentLocation = eqObj?.location || activity?.equipmentLocation || "";

  const lubObj = activity?.lubricant && typeof activity.lubricant === "object" ? activity.lubricant : null;
  const lubricantName = lubObj?.name || (typeof activity?.lubricant === "string" ? activity.lubricant : "") || null;
  const commercialName = activity?.commercialName || null;
  const quantity = (activity?.quantityLabel ?? activity?.quantity) ? String(activity?.quantityLabel ?? activity?.quantity) : null;
  const method = activity?.method || null;

  const techName =
    activity?.technicianName ||
    activity?.technician?.name ||
    activity?.assignedTechnicianName ||
    null;

  const conditionRaw = String(
    activity?.condition ?? activity?.executionCondition ?? activity?.route?.condition ?? ""
  ).trim().toUpperCase();
  const isBadCondition = conditionRaw === "MALO" || conditionRaw === "CRITICO" || conditionRaw === "CRÍTICO";

  const critRaw = String(
    eqObj?.criticality ?? activity?.equipmentCriticality ?? activity?.route?.equipment?.criticality ?? ""
  ).trim().toUpperCase();
  const isHighCriticality = critRaw === "ALTA" || critRaw === "CRITICA" || critRaw === "CRÍTICA";

  const isOverdue = status === "Atrasada";

  const leftAccentColor = isOverdue || isBadCondition
    ? "rgba(239,68,68,0.65)"
    : isHighCriticality
    ? "rgba(245,158,11,0.65)"
    : "rgba(15,23,42,0.08)";
  const leftAccentWidth = (isOverdue || isBadCondition || isHighCriticality) ? 5 : 4;

  const tone = STATUS_TONES[isCompleted ? "Completada" : isOverdue ? "Atrasada" : "Pendiente"];

  const hasAnyInfo = lubricantName || commercialName || quantity || method;

  return (
    <div
      style={{
        ...card,
        background: `linear-gradient(160deg, ${tone.bg} 0%, rgba(248,250,252,0.92) 100%)`,
        borderTop: `4px solid ${tone.top}`,
        borderRight: `1px solid ${tone.border}`,
        borderBottom: `1px solid ${tone.border}`,
        borderLeft: `${leftAccentWidth}px solid ${leftAccentColor}`,
        cursor: clickable ? "pointer" : "default",
        opacity: isCompleted ? 0.72 : 1,
        transform: hover ? "translateY(-3px)" : "translateY(0)",
        boxShadow: hover
          ? "0 20px 48px rgba(2,6,23,0.13), 0 4px 12px rgba(2,6,23,0.07)"
          : "0 10px 22px rgba(2,6,23,0.06)",
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => { if (clickable && onOpen) onOpen(activity); }}
      title={isFuture ? `Programada para ${dateStr}` : ""}
    >
      {/* ── Header ─────────────────────────────────── */}
      <div style={headerRow}>
        <div style={{ ...kindIconBox, background: kindTone.bg }}>
          <Icon name={kindIcon} size="sm" style={{ color: kindTone.color }} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={routeTitle}>{displayRouteName}</div>
          <div style={eqMeta}>
            <span style={eqNameBold}>{equipmentName}</span>
            {equipmentCode ? <span style={eqPill}>{equipmentCode}</span> : null}
            {equipmentLocation ? <span style={eqPill}>{equipmentLocation}</span> : null}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "flex-start", gap: 6, flexShrink: 0 }}>
          {activity?.hasEvidence && (
            <button
              type="button"
              title="Ver evidencia"
              onClick={(e) => { e.stopPropagation(); if (onOpen) onOpen(activity); }}
              style={cameraBtn}
            >
              <Icon name="camera" size="sm" />
            </button>
          )}
        </div>
      </div>

      {/* ── Alert chips ─────────────────────────────── */}
      {(isOverdue || isBadCondition || isHighCriticality) && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {isOverdue && <span style={alertPill("#dc2626", "rgba(220,38,38,0.10)")}>ATRASADA</span>}
          {isBadCondition && <span style={alertPill("#dc2626", "rgba(220,38,38,0.10)")}>EQUIPO {conditionRaw}</span>}
          {isHighCriticality && !isBadCondition && <span style={alertPill("#b45309", "rgba(245,158,11,0.12)")}>CRITICIDAD {critRaw}</span>}
        </div>
      )}

      {/* ── Info chips ──────────────────────────────── */}
      {hasAnyInfo && (
        <div style={infoChipsRow}>
          <InfoChip label="Lubricante" value={lubricantName} />
          <InfoChip label="Comercial" value={commercialName} />
          <InfoChip label="Cantidad" value={quantity} />
          <InfoChip label="Método" value={method} />
        </div>
      )}

      {/* ── Footer ──────────────────────────────────── */}
      <div style={footer}>
        <span style={dateChip}>
          <Icon name="calendar" size="sm" />
          {dateStr || "—"}
        </span>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {techName && (
            <span style={techChip}>
              <Icon name="user" size="sm" />
              {techName}
            </span>
          )}
          <span style={statusBadge(tone.badgeBg, tone.badgeColor)}>{status}</span>
        </div>
      </div>

      {isFuture && (
        <div style={futureNote}>
          Programada para: <strong>{dateStr}</strong>
        </div>
      )}
    </div>
  );
}

/* ── Styles ─────────────────────────────────────────── */

const card = {
  borderRadius: 16,
  padding: "14px 16px",
  display: "flex",
  flexDirection: "column",
  gap: 10,
  transition: "transform 200ms cubic-bezier(0.22,1,0.36,1), box-shadow 200ms ease",
  position: "relative",
  overflow: "hidden",
};

const headerRow = {
  display: "flex",
  alignItems: "flex-start",
  gap: 10,
};

const kindIconBox = {
  width: 38,
  height: 38,
  borderRadius: 10,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const routeTitle = {
  fontWeight: 800,
  fontSize: 14,
  color: "#0f172a",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  lineHeight: 1.3,
};

const eqMeta = {
  display: "flex",
  alignItems: "center",
  gap: 5,
  marginTop: 4,
  flexWrap: "wrap",
};

const eqNameBold = {
  fontSize: 12,
  fontWeight: 800,
  color: "#334155",
};

const eqPill = {
  fontSize: 11,
  fontWeight: 700,
  color: "#64748b",
  background: "rgba(15,23,42,0.06)",
  borderRadius: 6,
  padding: "2px 7px",
  border: "1px solid rgba(226,232,240,0.8)",
};

const alertPill = (color, bg) => ({
  display: "inline-flex",
  alignItems: "center",
  padding: "3px 9px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 900,
  color,
  background: bg,
  border: `1px solid ${color}33`,
  letterSpacing: "0.5px",
  whiteSpace: "nowrap",
});

const infoChipsRow = {
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
};

const infoChip = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  background: "rgba(15,23,42,0.04)",
  border: "1px solid rgba(226,232,240,0.85)",
  borderRadius: 8,
  padding: "4px 9px",
  fontSize: 12,
};

const infoChipLabel = {
  color: "#94a3b8",
  fontWeight: 700,
  fontSize: 11,
};

const infoChipValue = {
  color: "#1e293b",
  fontWeight: 800,
  fontSize: 12,
};

const footer = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 8,
  marginTop: 2,
  flexWrap: "wrap",
};

const dateChip = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  fontSize: 12,
  fontWeight: 700,
  color: "#64748b",
};

const techChip = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  fontSize: 11,
  fontWeight: 800,
  color: "#0f766e",
  background: "rgba(13,148,136,0.10)",
  border: "1px solid rgba(13,148,136,0.20)",
  borderRadius: 999,
  padding: "3px 10px",
};

const statusBadge = (bg, color) => ({
  padding: "4px 11px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 800,
  background: bg,
  color,
});

const futureNote = {
  fontSize: 12,
  color: "#64748b",
  marginTop: 2,
};

const cameraBtn = {
  border: "1px solid rgba(226,232,240,0.9)",
  background: "rgba(255,255,255,0.85)",
  borderRadius: 9,
  padding: "6px 9px",
  cursor: "pointer",
  height: 32,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#475569",
};

function getRouteKindPrefix(routeKind) {
  return String(routeKind || "").trim().toUpperCase() === "INSPECTION"
    ? "Inspección de"
    : "Lubricación de";
}

function stripRouteKindPrefix(value) {
  return String(value || "")
    .trim()
    .replace(/^(inspecci[oó]n|lubricaci[oó]n)\s+de\s+/i, "")
    .trim();
}

function formatRouteDisplayName(name, routeKind, fallback = "") {
  const rawName = String(name || "").trim();
  const normalizedKind = String(routeKind || "").trim().toUpperCase();
  if (!rawName) return fallback;
  if (normalizedKind !== "INSPECTION" && normalizedKind !== "LUBRICATION") return rawName;
  const baseName = stripRouteKindPrefix(rawName);
  if (!baseName) return fallback;
  return `${getRouteKindPrefix(normalizedKind)} ${baseName}`.trim();
}
