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

export default function ActivityCard({ activity, onOpen }) {
  const today = toLocalYMD(new Date());

  const status = activity?.status || activity?.computedStatus || "Pendiente";
  const isCompleted = status === "Completada" || activity?.statusRaw === "COMPLETED";

  const dateStr = toLocalYMD(activity?.date || activity?.scheduledAt || activity?.dateLabel || "");

  const isFuture = !isCompleted && dateStr && dateStr > today;
  const clickable = !isCompleted && !isFuture;
  const displayRouteName = formatRouteDisplayName(
    activity?.routeName || activity?.route?.name || activity?.activityName,
    activity?.route?.routeKind || activity?.routeKind,
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
  const lubricantName =
    lubObj?.name || (typeof activity?.lubricant === "string" ? activity.lubricant : "") || "—";

  const conditionRaw = String(
    activity?.condition ?? activity?.executionCondition ?? activity?.route?.condition ?? ""
  )
    .trim()
    .toUpperCase();

  const isBadCondition =
    conditionRaw === "MALO" || conditionRaw === "CRITICO" || conditionRaw === "CRÍTICO";

  const critRaw = String(
    eqObj?.criticality ?? activity?.equipmentCriticality ?? activity?.route?.equipment?.criticality ?? ""
  )
    .trim()
    .toUpperCase();

  const isHighCriticality = critRaw === "ALTA" || critRaw === "CRITICA" || critRaw === "CRÍTICA";

  const isOverdue = status === "Atrasada";

  const leftAccent = isOverdue ? "#ef4444" : isBadCondition ? "#ef4444" : isHighCriticality ? "#f59e0b" : "#e5e7eb";

  const borderStyle =
    isOverdue || isBadCondition || isHighCriticality
      ? { border: `1px solid rgba(148,163,184,0.35)`, borderLeft: `6px solid ${leftAccent}` }
      : { border: "1px solid #e5e7eb" };

  const showAlertChip = isOverdue || isBadCondition || isHighCriticality;

  return (
    <div
      style={{
        ...card,
        ...borderStyle,
        cursor: clickable ? "pointer" : "default",
        opacity: isCompleted ? 0.6 : 1,
      }}
      onClick={() => {
        if (clickable && onOpen) onOpen(activity);
      }}
      title={isFuture ? `Esta actividad está programada para ${dateStr}` : ""}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ minWidth: 0 }}>
          <strong
            style={{
              display: "block",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {displayRouteName}
          </strong>

          <div style={muted}>
            <span style={{ fontWeight: 800, color: "#334155" }}>{equipmentName}</span>
            {equipmentCode ? <span> · {equipmentCode}</span> : null}
            {equipmentLocation ? <span> · {equipmentLocation}</span> : null}
          </div>
        </div>

        {showAlertChip ? (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
            {isOverdue && <span style={pill("#fee2e2", "#991b1b")}>ATRASADA</span>}
            {isBadCondition && <span style={pill("#fee2e2", "#991b1b")}>EQUIPO {conditionRaw}</span>}
            {isHighCriticality && !isBadCondition && <span style={pill("#fef3c7", "#92400e")}>CRITICIDAD {critRaw}</span>}
          </div>
        ) : null}

        {activity?.hasEvidence && (
          <button
            type="button"
            title="Ver evidencia"
            onClick={(e) => {
              e.stopPropagation();
              if (onOpen) onOpen(activity);
            }}
            style={cameraBtn}
          >
            <Icon name="camera" size="md" />
          </button>
        )}
      </div>

      <div style={row}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <Icon name="calendar" size="sm" />
          {dateStr || "—"}
        </span>
        <span style={badge(status)}>{status}</span>
      </div>

      <div style={details}>
        <div>
          <strong>Lubricante:</strong> {lubricantName}
        </div>
        <div>
          <strong>Comercial:</strong> {activity?.commercialName || "—"}
        </div>
        <div>
          <strong>Cantidad:</strong> {(activity?.quantityLabel ?? activity?.quantity) ?? "—"}
        </div>
        <div>
          <strong>Método:</strong> {activity?.method || "—"}
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

const card = {
  background: "#fff",
  borderRadius: 14,
  padding: 16,
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const row = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const details = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 8,
  fontSize: 14,
};

const muted = {
  fontSize: 12,
  color: "#6b7280",
};

const badge = (status) => ({
  padding: "4px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 700,
  background: status === "Atrasada" ? "#fee2e2" : status === "Pendiente" ? "#fef3c7" : "#dcfce7",
  color: status === "Atrasada" ? "#b91c1c" : status === "Pendiente" ? "#92400e" : "#166534",
});

const pill = (bg, color) => ({
  background: bg,
  color,
  borderRadius: 999,
  padding: "4px 10px",
  fontSize: 11,
  fontWeight: 900,
  border: "1px solid rgba(226,232,240,0.9)",
  whiteSpace: "nowrap",
});

const futureNote = {
  marginTop: 6,
  fontSize: 12,
  color: "#64748b",
};

const cameraBtn = {
  border: "1px solid #e5e7eb",
  background: "#fff",
  borderRadius: 10,
  padding: "6px 10px",
  cursor: "pointer",
  fontWeight: 900,
  height: 34,
  alignSelf: "flex-start",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
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

  if (normalizedKind !== "INSPECTION" && normalizedKind !== "LUBRICATION") {
    return rawName;
  }

  const baseName = stripRouteKindPrefix(rawName);
  if (!baseName) return fallback;

  return `${getRouteKindPrefix(normalizedKind)} ${baseName}`.trim();
}
