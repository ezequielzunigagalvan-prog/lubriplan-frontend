// src/components/routes/RouteCard.jsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "../ui/lpIcons";
import { formatRouteDisplayName } from "../../utils/routeNames";
import {
  routeFrequency,
  routeDueStatus,
  routeEquipmentList,
  openExecutionOf,
} from "../../utils/routeFrequency";
import "./RouteCard.css";

const fmtQty = (n) => (Number.isFinite(n) ? String(Math.round(n * 100) / 100) : "—");

function doseInfo(route, equipmentsCount) {
  const isInspection = String(route?.routeKind || "").toUpperCase() === "INSPECTION";
  const qty = route?.quantity != null ? Number(route.quantity) : null;
  if (qty == null || !Number.isFinite(qty)) {
    return { main: isInspection ? "Opcional" : "Sin cantidad", sub: isInspection ? "solo si se aplica" : "", warn: !isInspection };
  }
  const isStrokes = String(route?.unit || "").toUpperCase() === "BOMBAZOS";
  const unit = isStrokes ? (qty === 1 ? "bombazo" : "bombazos") : route?.unit || "";
  const points = Number(route?.points) > 0 ? Number(route.points) : 1;
  const total = qty * points * Math.max(1, equipmentsCount);
  const parts = [];
  if (points > 1) parts.push(`${points} puntos`);
  if (equipmentsCount > 1) parts.push(`${equipmentsCount} equipos`);
  const sub = parts.length ? `${parts.join(" × ")} = ${fmtQty(total)} ${isStrokes ? "bombazos" : unit}` : "por actividad";
  return {
    main: `${fmtQty(qty)} ${unit}`,
    sub: isStrokes && route?.pumpStrokeValue ? `${sub} · 1 = ${route.pumpStrokeValue} ${route.pumpStrokeUnit || ""}` : sub,
    warn: qty <= 0 && !isInspection,
  };
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
  const [showTech, setShowTech] = useState(false);
  const [savingTech, setSavingTech] = useState(false);

  const canEdit = typeof onEdit === "function" || typeof onDelete === "function";
  const isReadOnly = Boolean(readOnly) || !canEdit;
  const canOpenDetails = !disableDetails;
  const isInspection = String(route?.routeKind || "").toUpperCase() === "INSPECTION";

  const name = useMemo(() => formatRouteDisplayName(route?.name, route?.routeKind, "—"), [route?.name, route?.routeKind]);
  const equipments = useMemo(() => routeEquipmentList(route), [route]);
  const primary = equipments[0] || route?.equipment || null;
  const freq = useMemo(() => routeFrequency(route), [route]);
  const due = useMemo(() => routeDueStatus(route?.nextDate), [route?.nextDate]);
  const dose = useMemo(() => doseInfo(route, equipments.length), [route, equipments.length]);
  const open = openExecutionOf(route);
  const evidenceEq = open?.evidenceEquipment?.name || null;

  const lubeType = route?.lubricantType || (isInspection ? "Inspección" : "—");
  const lubeName = route?.lubricant?.name || route?.lubricantName || "";
  const tech = route?.technician || route?.nextExecutionTechnician || null;
  const techValue = route?.technicianId ?? tech?.id ?? "";

  const goDetail = () => {
    if (canOpenDetails && routeId != null) navigate(`/routes/${routeId}`);
  };
  const stop = (e) => e.stopPropagation();

  const changeTech = async (e) => {
    e.stopPropagation();
    if (!onAssignTechnician) return;
    const v = e.target.value;
    setSavingTech(true);
    try {
      await onAssignTechnician(route, v ? Number(v) : null);
      setShowTech(false);
    } finally {
      setSavingTech(false);
    }
  };

  return (
    <article
      className={`rc rc--${due.tone} ${isInspection ? "rc--insp" : ""} ${canOpenDetails ? "rc--link" : ""}`}
      onClick={canOpenDetails ? goDetail : undefined}
      role={canOpenDetails ? "button" : undefined}
      tabIndex={canOpenDetails ? 0 : -1}
      onKeyDown={canOpenDetails ? (e) => e.key === "Enter" && goDetail() : undefined}
    >
      <div className="rc-top">
        <span className={`rc-kind ${isInspection ? "is-insp" : ""}`}>
          <Icon name={isInspection ? "eye" : "drop"} size="sm" />
          {isInspection ? "Inspección" : "Lubricación"}
        </span>
        <span className={`rc-due rc-due--${due.tone}`} title="Próxima actividad">
          <Icon name={due.tone === "danger" ? "alert" : "calendar"} size="sm" />
          {due.label}
          {due.date ? <b>{due.date}</b> : null}
        </span>
      </div>

      <div className="rc-head">
        <h3 className="rc-name" title={route?.name || ""}>{name}</h3>
        {!isReadOnly ? (
          <div className="rc-actions" onClick={stop}>
            {typeof onAssignTechnician === "function" ? (
              <button type="button" className="rc-icon" title="Asignar técnico" aria-label="Asignar técnico" onClick={() => setShowTech((v) => !v)}>
                <Icon name="user" size="sm" />
              </button>
            ) : null}
            <button type="button" className="rc-icon" title="Editar" aria-label="Editar ruta" onClick={() => onEdit?.(route)}>
              <Icon name="edit" size="sm" />
            </button>
            {typeof onDelete === "function" ? (
              <button type="button" className="rc-icon rc-icon--danger" title="Eliminar" aria-label="Eliminar ruta" onClick={() => onDelete?.(routeId)}>
                <Icon name="trash" size="sm" />
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="rc-eq">
        <Icon name="equipment" size="sm" />
        <span className="rc-eq-name" title={primary?.name || ""}>{primary?.name || `Equipo #${route?.equipmentId ?? "—"}`}</span>
        {primary?.code ? <span className="rc-tag">{primary.code}</span> : null}
        {equipments.length > 1 ? (
          <span className="rc-multi" title={equipments.map((e) => e.name).join(", ")}>+{equipments.length - 1} equipo{equipments.length - 1 === 1 ? "" : "s"}</span>
        ) : null}
      </div>

      {showTech && typeof onAssignTechnician === "function" ? (
        <div className="rc-assign" onClick={stop}>
          <select value={techValue} onChange={changeTech} disabled={savingTech} aria-label="Técnico de la ruta">
            <option value="">Sin técnico</option>
            {(technicians || []).map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
                {t.code ? ` · ${t.code}` : ""}
              </option>
            ))}
          </select>
          {savingTech ? <span className="rc-muted">Guardando…</span> : null}
        </div>
      ) : null}

      <div className="rc-grid">
        <div className="rc-cell">
          <span className="rc-label">Lubricante</span>
          <span className="rc-value" title={lubeType}>{lubeType}</span>
          <span className="rc-sub" title={lubeName}>{lubeName || (isInspection ? "opcional" : "sin producto de inventario")}</span>
        </div>
        <div className={`rc-cell ${dose.warn ? "is-warn" : ""}`}>
          <span className="rc-label">Dosis por punto</span>
          <span className="rc-value">{dose.main}</span>
          <span className="rc-sub" title={dose.sub}>{dose.sub}</span>
        </div>
        <div className="rc-cell">
          <span className="rc-label">Frecuencia</span>
          <span className="rc-value">{freq.label}</span>
          <span className="rc-sub">{freq.detail || "programada"}</span>
        </div>
      </div>

      <div className="rc-chips">
        <span className={`rc-chip ${tech ? "" : "is-warn"}`}>
          <Icon name="user" size="sm" />
          {tech ? `${tech.name}${tech.code ? ` · ${tech.code}` : ""}` : "Sin técnico"}
        </span>
        {route?.method ? (
          <span className="rc-chip">
            <Icon name="tool" size="sm" />
            {route.method.charAt(0).toUpperCase() + route.method.slice(1)}
          </span>
        ) : null}
        {route?.evidenceRequired ? (
          <span className="rc-chip is-evidence" title={evidenceEq ? `Próxima foto: ${evidenceEq}` : "Foto obligatoria al completar"}>
            <Icon name="camera" size="sm" />
            {equipments.length > 1 && evidenceEq ? `Foto: ${evidenceEq}` : "Foto obligatoria"}
          </span>
        ) : null}
      </div>

      <div className="rc-foot" onClick={stop}>
        <button type="button" className="rc-btn" onClick={() => routeId != null && navigate(`/routes/${routeId}/activities`)}>
          <Icon name="list" size="sm" />
          Actividades
        </button>
        {canOpenDetails ? (
          <button type="button" className="rc-btn rc-btn--primary" onClick={goDetail}>
            Ver detalle
          </button>
        ) : null}
      </div>
    </article>
  );
}
