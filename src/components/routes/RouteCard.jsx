// src/components/routes/RouteCard.jsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "../ui/lpIcons";

/* =========================
   COLOR MAP (solo texto)
========================= */
const LUBE_TEXT = {
  "Aceite hidráulico": { color: "#1d4ed8", softBg: "rgba(59,130,246,0.10)", border: "rgba(59,130,246,0.25)" },
  "Aceite para engranes": { color: "#4338ca", softBg: "rgba(99,102,241,0.10)", border: "rgba(99,102,241,0.25)" },
  "Aceite para compresor": { color: "#0369a1", softBg: "rgba(14,165,233,0.10)", border: "rgba(14,165,233,0.25)" },
  "Aceite de circulación": { color: "#0e7490", softBg: "rgba(6,182,212,0.10)", border: "rgba(6,182,212,0.25)" },
  "Aceite para cadenas": { color: "#0284c7", softBg: "rgba(56,189,248,0.10)", border: "rgba(56,189,248,0.25)" },
  "Aceite para unidades neumáticas": { color: "#047857", softBg: "rgba(16,185,129,0.10)", border: "rgba(16,185,129,0.25)" },

  "Grasa EP": { color: "#b45309", softBg: "rgba(245,158,11,0.14)", border: "rgba(245,158,11,0.30)" },
  "Grasa alta temperatura": { color: "#b91c1c", softBg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.30)" },
  "Grasa grado alimenticio": { color: "#15803d", softBg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.30)" },
  "Grasa multipropósito": { color: "#7e22ce", softBg: "rgba(168,85,247,0.12)", border: "rgba(168,85,247,0.30)" },
  "Grasa para motores eléctricos": { color: "#0f766e", softBg: "rgba(20,184,166,0.12)", border: "rgba(20,184,166,0.30)" },
  "Grasa para altas velocidades": { color: "#be185d", softBg: "rgba(244,114,182,0.12)", border: "rgba(244,114,182,0.30)" },

  Otro: { color: "#334155", softBg: "rgba(148,163,184,0.14)", border: "rgba(148,163,184,0.30)" },
};

const getLubeTheme = (lubricantType) => {
  const key = String(lubricantType || "").trim();
  return LUBE_TEXT[key] || LUBE_TEXT.Otro;
};

const pickMethodLabel = (route) =>
  route?.method ||
  route?.lubricationMethod ||
  route?.applyMethod ||
  route?.methodName ||
  "â€”";

const pickNextAtRaw = (route) =>
  route?.nextActivityAt ||
  route?.nextExecutionAt ||
  route?.nextDueAt ||
  route?.nextDueDate ||
  route?.nextDate ||
  null;

function formatLocalYMD(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function buildNextInfo(nextAtRaw) {
  if (!nextAtRaw) return { label: "Sin próxima", tone: "muted" };

  const d = new Date(nextAtRaw);
  if (Number.isNaN(d.getTime())) return { label: "Sin próxima", tone: "muted" };

  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((target - start) / (1000 * 60 * 60 * 24));

    const ymd = [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");

  if (diffDays < 0) return { label: `Atrasada · ${ymd}`, tone: "danger" };
  if (diffDays === 0) return { label: `Hoy · ${ymd}`, tone: "warn" };
  if (diffDays === 1) return { label: `Mañana · ${ymd}`, tone: "ok" };
  return { label: `Próxima· ${ymd}`, tone: "ok" };
}

function buildFrequencyLabel(route) {
  const frequencyType = String(route?.frequencyType || "").trim().toUpperCase();
  const frequencyDays = Number(route?.frequencyDays || 0);
  const weeklyDays = Array.isArray(route?.weeklyDays) ? route.weeklyDays : [];

  if (frequencyType === "WEEKLY" && weeklyDays.length > 0) {
    return "Varias veces por semana";
  }

  if (frequencyDays === 1) return "Diario";
  if (frequencyDays === 7) return "Semanal";
  if (frequencyDays === 15) return "Quincenal";
  if (frequencyDays === 30) return "Mensual";
  if (frequencyDays === 60) return "Bimestral";
  if (frequencyDays === 120) return "Cuatrimestral";
  if (frequencyDays === 180) return "Semestral";
  if (frequencyDays === 365) return "Anual";
  if (frequencyDays > 0) return `Cada ${frequencyDays} días`;

  return "â€”";
}

function buildWeeklyDaysLabel(route) {
  const weeklyDays = Array.isArray(route?.weeklyDays) ? route.weeklyDays : [];

  const map = {
    1: "Lun",
    2: "Mar",
    3: "Mié",
    4: "Jue",
    5: "Vie",
    6: "Sáb",
    7: "Dom",
  };

  return weeklyDays
    .map((d) => map[Number(d)])
    .filter(Boolean)
    .join(" · ");
}

export default function RouteCard({
  route,
  onEdit,
  onDelete,
  onAssignTechnician,
  technicians = [],
  readOnly,
  disableDetails = false,
}) {
  const navigate = useNavigate();
  const routeId = route?.id;
  const [showTechnicianSelect, setShowTechnicianSelect] = useState(false);

  const canEdit = typeof onEdit === "function" || typeof onDelete === "function";
  const isReadOnly = Boolean(readOnly) || !canEdit;
  const canOpenDetails = !disableDetails;

  const equipmentLabel = route?.equipment?.name || `Equipo #${route?.equipmentId ?? "N/A"}`;
  const equipmentCode =
    route?.equipment?.code ||
    route?.equipment?.tag ||
    route?.equipmentCode ||
    route?.equipmentTag ||
    null;

  const unitRaw = String(route?.unit || "").trim();
  const unitNorm = unitRaw.toUpperCase();
  const isBombazos = unitNorm === "BOMBAZOS";

  const pumpStrokeValue = route?.pumpStrokeValue != null ? Number(route.pumpStrokeValue) : null;
  const pumpStrokeUnit = String(route?.pumpStrokeUnit || "").trim();

  const qtyLabel = useMemo(() => {
    if (route?.quantity == null) return "â€”";
    if (isBombazos) {
      return `${route.quantity} bombazo${Number(route.quantity) === 1 ? "" : "s"}`;
    }
    return `${route.quantity}${route.unit ? ` ${route.unit}` : ""}`;
  }, [route?.quantity, route?.unit, isBombazos]);

  const qtySubLabel = useMemo(() => {
    if (isBombazos) {
      if (Number.isFinite(pumpStrokeValue) && pumpStrokeValue > 0 && pumpStrokeUnit) {
        return `1 bombazo = ${pumpStrokeValue} ${pumpStrokeUnit}`;
      }
      return "Equivalencia pendiente";
    }

    const pts = Number(route?.points ?? 0);
    if (Number.isFinite(pts) && pts > 0) {
      return "por punto";
    }
    return "dosificación";
  }, [isBombazos, pumpStrokeValue, pumpStrokeUnit, route?.points]);

  
  const lubeTheme = useMemo(() => getLubeTheme(route?.lubricantType), [route?.lubricantType]);
const methodLabel = useMemo(() => pickMethodLabel(route), [route]);
const freqLabel = useMemo(() => buildFrequencyLabel(route), [route]);
const weeklyDaysLabel = useMemo(() => buildWeeklyDaysLabel(route), [route]);
const nextAtRaw = useMemo(() => pickNextAtRaw(route), [route]);
const nextInfo = useMemo(() => buildNextInfo(nextAtRaw), [nextAtRaw]);

  const lubeName = route?.lubricant?.name || route?.lubricantName || route?.lubricant?.code || "";
  const technicianName =
    route?.technician?.name ||
    route?.nextExecutionTechnician?.name ||
    "Sin técnico";
  const technicianCode =
    route?.technician?.code ||
    route?.nextExecutionTechnician?.code ||
    "";

  const goDetail = () => {
    if (!canOpenDetails) return;
    if (routeId == null) return;
    navigate(`/routes/${routeId}`);
  };

  const goActivities = (e) => {
    e?.stopPropagation?.();
    if (routeId == null) return;
    navigate(`/routes/${routeId}/activities`);
  };

  const handleTechnicianChange = async (e) => {
    e.stopPropagation();
    if (!onAssignTechnician) return;

    const value = e.target.value;
    await onAssignTechnician(route, value ? Number(value) : null);
    setShowTechnicianSelect(false);
  };

  return (
    <div
      style={{
        ...card,
        cursor: canOpenDetails ? "pointer" : "default",
        opacity: isReadOnly ? 0.985 : 1,
      }}
      onClick={canOpenDetails ? goDetail : undefined}
      role={canOpenDetails ? "button" : undefined}
      tabIndex={canOpenDetails ? 0 : -1}
      onKeyDown={
        canOpenDetails
          ? (e) => {
              if (e.key === "Enter") goDetail();
            }
          : undefined
      }
      onMouseEnter={(e) => {
        if (!canOpenDetails) return;
        if (window.matchMedia && window.matchMedia("(hover: none)").matches) return;
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 18px 44px rgba(2,6,23,0.14)";
        e.currentTarget.style.borderColor = "rgba(15,23,42,0.20)";
      }}
      onMouseLeave={(e) => {
        if (!canOpenDetails) return;
        if (window.matchMedia && window.matchMedia("(hover: none)").matches) return;
        e.currentTarget.style.transform = "translateY(0px)";
        e.currentTarget.style.boxShadow = "0 12px 32px rgba(2,6,23,0.08)";
        e.currentTarget.style.borderColor = "rgba(226,232,240,0.95)";
      }}
    >
      {/* HEADER */}
      <div style={head}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={routeName} title={route?.name || ""}>
            {route?.name || "â€”"}
          </div>

          <div style={eqRow}>
            <span style={eqItem}>
              <Icon name="equipment" size="lg" weight="bold" />
              <span style={eqName} title={equipmentLabel}>
                {equipmentLabel}
              </span>

              {equipmentCode ? (
                <span style={tagInlinePill} title="Código / TAG">
                  <Icon name="tag" style={miniIconSm} /> {equipmentCode}
                </span>
              ) : (
                <span style={tagInlinePillMuted} title="Sin código/tag">
                  <Icon name="tag" style={miniIconSm} /> SIN TAG
                </span>
              )}
            </span>

            {isReadOnly ? <span style={readOnlyPill}>Solo lectura</span> : null}
          </div>
        </div>

        {!isReadOnly ? (
          <div style={actions} onClick={(e) => e.stopPropagation()}>
            {typeof onAssignTechnician === "function" ? (
              <button
                style={iconBtnTech}
                onClick={() => setShowTechnicianSelect((v) => !v)}
                title="Asignar técnico"
                aria-label="Asignar técnico"
                type="button"
              >
                <Icon name="user" style={icon18} />
              </button>
            ) : null}

            <button
              style={iconBtn}
              onClick={() => onEdit?.(route)}
              title="Editar"
              aria-label="Editar ruta"
              type="button"
            >
              <Icon name="edit" style={icon18} />
            </button>

            {typeof onDelete === "function" ? (
              <button
                style={iconBtnDanger}
                onClick={() => onDelete?.(routeId)}
                title="Eliminar"
                aria-label="Eliminar ruta"
                type="button"
              >
                <Icon name="trash" style={icon18} />
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* SELECT TéCNICO DESPLEGABLE */}
      {showTechnicianSelect && typeof onAssignTechnician === "function" ? (
        <div style={assignWrap} onClick={(e) => e.stopPropagation()}>
          <select
            value={route?.technicianId ?? route?.technician?.id ?? route?.nextExecutionTechnicianId ?? route?.nextExecutionTechnician?.id ?? ""}
            onChange={handleTechnicianChange}
            style={assignSelect}
            title="Asignar técnico"
          >
            <option value="">Sin técnico</option>
            {(technicians || []).map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
                {t.code ? ` â€” (${t.code})` : ""}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {/* MINI CARDS */}
      <div style={miniGrid}>
        <div style={{ ...miniCard, borderColor: lubeTheme.border }}>
          <div style={miniLabelRow}>
            <span
              style={{
                ...miniChip,
                background: lubeTheme.softBg,
                borderColor: lubeTheme.border,
                color: lubeTheme.color,
              }}
            >
              TIPO
            </span>
          </div>

          <div style={{ ...miniValue, color: lubeTheme.color }} title={route?.lubricantType || ""}>
            {route?.lubricantType || "â€”"}
          </div>

          <div style={miniSub} title={lubeName || ""}>
            {lubeName ? (
              <>
                <span style={{ color: "#64748b", fontWeight: 850 }}>Nombre: </span>
                <span style={{ color: "#0f172a", fontWeight: 900 }}>{lubeName}</span>
              </>
            ) : (
              <span style={{ color: "#94a3b8", fontWeight: 850 }}>â€”</span>
            )}
          </div>
        </div>

        <div style={miniCard}>
          <div style={miniLabelRow}>
            <span style={miniChipMuted}>CANTIDAD</span>
          </div>

          <div style={miniValue} title={qtyLabel}>
            {qtyLabel}
          </div>

          <div style={isBombazos ? miniSubBombazos : miniSubMuted} title={qtySubLabel}>
            {qtySubLabel}
          </div>
        </div>

        <div style={miniCard}>
          <div style={miniLabelRow}>
            <span style={miniChipMuted}>FRECUENCIA</span>
          </div>

          <div style={miniValue} title={freqLabel}>
            {freqLabel}
          </div>

          <div style={miniSubMuted} title={weeklyDaysLabel || "programada"}>
  <span style={miniInline}>
    <Icon name="calendar" style={miniIcon} />
    {freqLabel === "Varias veces por semana" && weeklyDaysLabel
      ? weeklyDaysLabel
      : "programada"}
  </span>
</div>
        </div>
      </div>

      {/* MINI CARD TÉCNICO PEQUEÑA */}
      <div style={techMiniCard}>
        <div style={techMiniTop}>
          <span style={techMiniChip}>
            <Icon name="user" style={techMiniIcon} />
            TÉCNICO
          </span>
        </div>

        <div style={techMiniTextRow}>
          <span style={techMiniName} title={technicianName}>
            {technicianName}
          </span>

          <span style={techMiniCode} title={technicianCode || "Sin código"}>
            {technicianCode || "Sin código"}
          </span>
        </div>
      </div>

      {/* FILA COMPACTA ABAJO */}
      <div style={belowRow} onClick={(e) => e.stopPropagation()}>
        <span style={methodPill} title={`Método: ${methodLabel}`}>
          <Icon name="tool" style={miniIcon} />
          <span style={{ fontWeight: 950 }}>Método:</span> {methodLabel}
        </span>

        <span style={nextBadgeSmall(nextInfo.tone)} title="Próxima actividad">
          <Icon name="calendar" style={miniIcon} />
          {nextInfo.label}
        </span>
      </div>

      {/* FOOTER */}
      <div style={foot}>
        <button style={ghostBtn} onClick={goActivities} type="button" title="Ver actividades de esta ruta">
          <Icon name="list" style={miniIcon} />
          Actividades
        </button>

        {canOpenDetails ? (
          <button
            style={linkBtn}
            onClick={(e) => {
              e.stopPropagation();
              goDetail();
            }}
            type="button"
          >
            Ver detalles 
          </button>
        ) : null}
      </div>
    </div>
  );
}

/* =========================
   STYLES
========================= */

const card = {
  border: "2.6px solid rgba(226,232,240,0.98)",
  borderRadius: 18,
  background: "rgba(255,255,255,0.90)",
  padding: 14,
  position: "relative",
  overflow: "hidden",
  boxShadow: "0 12px 32px rgba(2,6,23,0.08)",
  transform: "translateY(0px)",
  transition: "transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease",
  outline: "2px solid rgba(2,6,23,0.07)",
  outlineOffset: -2,
};

const head = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
};

const routeName = {
  fontSize: 18,
  fontWeight: 990,
  color: "#0f172a",
  letterSpacing: 0.2,
  lineHeight: 1.15,
  whiteSpace: "normal",
  wordBreak: "break-word",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
};

const eqRow = {
  marginTop: 8,
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  alignItems: "center",
};

const eqItem = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  minWidth: 0,
  maxWidth: "100%",
  flexWrap: "nowrap",
};

const eqName = {
  fontSize: 13,
  color: "#475569",
  fontWeight: 850,
  minWidth: 0,
  flex: 1,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const actions = {
  display: "flex",
  gap: 8,
  alignItems: "center",
  flexShrink: 0,
};

const iconBtn = {
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.70)",
  cursor: "pointer",
  borderRadius: 12,
  padding: "8px 10px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 8px 18px rgba(2,6,23,0.04)",
};

const iconBtnTech = {
  ...iconBtn,
  border: "1px solid rgba(59,130,246,0.22)",
  background: "rgba(239,246,255,0.90)",
  color: "#1d4ed8",
};

const iconBtnDanger = {
  ...iconBtn,
  border: "1px solid rgba(252,165,165,0.60)",
  background: "rgba(254,242,242,0.70)",
  color: "#b91c1c",
};

const assignWrap = {
  marginTop: 12,
};

const assignSelect = {
  width: "100%",
  background: "rgba(255,255,255,0.96)",
  border: "1.6px solid rgba(226,232,240,0.98)",
  borderRadius: 12,
  padding: "10px 12px",
  cursor: "pointer",
  fontWeight: 900,
  color: "#0f172a",
  boxShadow: "0 8px 18px rgba(2,6,23,0.04)",
  outline: "none",
};

const miniGrid = {
  marginTop: 12,
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 10,
};

const miniCard = {
  background: "linear-gradient(180deg, rgba(248,250,252,0.92), rgba(248,250,252,0.74))",
  border: "1.4px solid rgba(226,232,240,0.95)",
  borderRadius: 14,
  padding: 12,
  display: "grid",
  gap: 8,
  minWidth: 0,
  minHeight: 118,
  boxShadow: "0 10px 20px rgba(2,6,23,0.04)",
};

const miniLabelRow = { display: "flex", justifyContent: "flex-start" };

const miniChip = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "5px 10px",
  borderRadius: 999,
  border: "1px solid rgba(226,232,240,0.95)",
  fontSize: 11,
  fontWeight: 950,
  letterSpacing: 0.7,
};

const miniChipMuted = {
  ...miniChip,
  background: "rgba(15,23,42,0.05)",
  border: "1px solid rgba(15,23,42,0.10)",
  color: "#475569",
};

const miniValue = {
  fontSize: 16,
  fontWeight: 990,
  color: "#0f172a",
  lineHeight: 1.12,
  whiteSpace: "normal",
  wordBreak: "break-word",
};

const miniSub = {
  fontSize: 12,
  fontWeight: 850,
  color: "#64748b",
  lineHeight: 1.25,
  whiteSpace: "normal",
  wordBreak: "break-word",
};

const miniSubMuted = {
  fontSize: 12,
  fontWeight: 850,
  color: "#64748b",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const miniSubBombazos = {
  fontSize: 12,
  fontWeight: 900,
  color: "#9a3412",
  lineHeight: 1.25,
  whiteSpace: "normal",
  wordBreak: "break-word",
};

/* MINI CARD TÃ‰CNICO */
const techMiniCard = {
  marginTop: 10,
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 12,
  background: "rgba(248,250,252,0.72)",
  padding: "8px 10px",
  display: "grid",
  gap: 6,
};

const techMiniTop = {
  display: "flex",
  justifyContent: "flex-start",
};

const techMiniChip = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "4px 8px",
  borderRadius: 999,
  fontSize: 10.5,
  fontWeight: 950,
  letterSpacing: 0.5,
  background: "rgba(15,23,42,0.05)",
  border: "1px solid rgba(15,23,42,0.10)",
  color: "#475569",
};

const techMiniTextRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap",
};

const techMiniName = {
  fontSize: 13,
  fontWeight: 900,
  color: "#0f172a",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  maxWidth: "65%",
};

const techMiniCode = {
  fontSize: 11,
  fontWeight: 850,
  color: "#64748b",
  whiteSpace: "nowrap",
};

const belowRow = {
  marginTop: 10,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap",
};

const methodPill = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "7px 10px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 900,
  letterSpacing: 0.2,
  whiteSpace: "nowrap",
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(15,23,42,0.06)",
  color: "#0f172a",
  boxShadow: "0 8px 18px rgba(2,6,23,0.04)",
};

const tagInlinePill = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "5px 8px",
  borderRadius: 999,
  fontSize: 10.5,
  fontWeight: 950,
  letterSpacing: 0.35,
  whiteSpace: "nowrap",
  border: "1px solid rgba(15,23,42,0.12)",
  background: "rgba(15,23,42,0.06)",
  color: "#0f172a",
};

const tagInlinePillMuted = {
  ...tagInlinePill,
  border: "1px solid rgba(148,163,184,0.22)",
  background: "rgba(148,163,184,0.12)",
  color: "#64748b",
};

const foot = {
  marginTop: 12,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap",
};

const ghostBtn = {
  background: "rgba(255,255,255,0.70)",
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 12,
  padding: "8px 10px",
  cursor: "pointer",
  fontWeight: 950,
  color: "#0f172a",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  boxShadow: "0 8px 18px rgba(2,6,23,0.04)",
};

const linkBtn = {
  background: "transparent",
  border: "none",
  color: "#2563eb",
  fontWeight: 950,
  cursor: "pointer",
};

const readOnlyPill = {
  fontSize: 11,
  fontWeight: 950,
  padding: "6px 10px",
  borderRadius: 999,
  background: "rgba(15,23,42,0.06)",
  border: "1px solid rgba(15,23,42,0.10)",
  color: "#475569",
  letterSpacing: 0.4,
  whiteSpace: "nowrap",
};

const miniInline = { display: "inline-flex", gap: 6, alignItems: "center" };
const miniIcon = { width: 16, height: 16, opacity: 0.9 };
const miniIconSm = { width: 14, height: 14, opacity: 0.9 };
const techMiniIcon = { width: 13, height: 13, opacity: 0.9 };
const icon18 = { width: 18, height: 18 };

const nextBadgeSmall = (tone) => {
  const base = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 950,
    letterSpacing: 0.2,
    whiteSpace: "nowrap",
    border: "1px solid rgba(226,232,240,0.95)",
    background: "rgba(255,255,255,0.70)",
    color: "#0f172a",
    boxShadow: "0 8px 18px rgba(2,6,23,0.04)",
  };

  if (tone === "danger") {
    return {
      ...base,
      background: "rgba(254,242,242,0.75)",
      border: "1px solid rgba(252,165,165,0.60)",
      color: "#991b1b",
    };
  }
  if (tone === "warn") {
    return {
      ...base,
      background: "rgba(255,237,213,0.75)",
      border: "1px solid rgba(251,191,36,0.45)",
      color: "#9a3412",
    };
  }
  if (tone === "ok") {
    return {
      ...base,
      background: "rgba(220,252,231,0.75)",
      border: "1px solid rgba(34,197,94,0.30)",
      color: "#166534",
    };
  }
  return {
    ...base,
    background: "rgba(148,163,184,0.12)",
    border: "1px solid rgba(148,163,184,0.22)",
    color: "#475569",
  };
};

