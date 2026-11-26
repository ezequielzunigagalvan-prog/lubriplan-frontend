// src/components/activities/ActivityRow.jsx
// Renglón de actividad (lista de Actividades): todo lo importante de un vistazo.
//  - Técnico: botón grande "Ejecutar" cuando ya toca.
//  - Supervisor/Admin: asignar técnico (incluye otras plantas) y reprogramar en línea.
import { Icon } from "../ui/lpIcons";
import TechnicianSelect from "./TechnicianSelect";
import "./ActivityRow.css";

const COND = { BUENO: "Buena", REGULAR: "Regular", MALO: "Mala", CRITICO: "Crítica" };
const condTone = (c) => (c === "CRITICO" ? "is-red" : c === "MALO" ? "is-orange" : c === "REGULAR" ? "is-amber" : "is-green");
const clean = (v) => String(v ?? "").replace(/�/g, "").trim();

function sourceOf(a) {
  const title = String(a?.activityName || "").toUpperCase();
  if (a?.isManual && title.startsWith("EMERGENTE")) return { label: "Emergente", cls: "is-red" };
  if (a?.reportId || a?.conditionReportId) return { label: "Por reporte de condición", cls: "is-orange" };
  if (a?.isManual) return { label: "Programada", cls: "is-blue" };
  return { label: "Ruta", cls: "" };
}

export default function ActivityRow({
  activity: a,
  todayYMD,
  isTech,
  canAssignTech,
  techs = [],
  onAssignTech,
  assigningId,
  onOpen,
  onReschedule,
  onTechBorrowed,
  highlighted = false,
  evidenceUrl = "",
}) {
  const done = a.computedStatus === "Completada";
  const late = a.computedStatus === "Atrasada";
  const today = !done && a.dateLabel === todayYMD;
  const future = !done && a.dateLabel > todayYMD;
  const canExecute = isTech && !done && !future;
  const tone = done ? "done" : late ? "late" : today ? "today" : "pending";
  const status = done ? "Completada" : late ? `Atrasada · ${a.overdueDays || 0} d` : today ? "Hoy" : "Pendiente";
  const src = sourceOf(a);
  const eqCount = Number(a.equipmentsCount || 1);

  return (
    <article className={`ar ar--${tone} ${highlighted ? "is-highlight" : ""}`}>
      <div className="ar-main" onClick={canExecute || done ? onOpen : undefined} role={canExecute || done ? "button" : undefined} tabIndex={canExecute || done ? 0 : undefined} onKeyDown={(e) => (canExecute || done) && e.key === "Enter" && onOpen?.()}>
        <div className="ar-top">
          <span className={`ar-status ar-status--${tone}`}>
            <Icon name={done ? "check" : late ? "alert" : "calendar"} size="sm" /> {status}
          </span>
          <span className="ar-date">{a.dateLabel || "—"}</span>
          {src.label !== "Ruta" ? <span className={`ar-tag ${src.cls}`}>{src.label}</span> : null}
          {String(a.equipmentCriticality || "").toUpperCase().match(/ALTA|CRIT/) ? <span className="ar-tag is-red">Equipo crítico</span> : null}
          {a.evidenceRequired && !done ? <span className="ar-tag is-orange"><Icon name="camera" size="sm" /> Foto obligatoria</span> : null}
          {a.localSyncStatus === "pending" ? <span className="ar-tag is-amber"><Icon name="refresh" size="sm" /> Por sincronizar</span> : null}
          {a.localSyncStatus === "failed" ? <span className="ar-tag is-red"><Icon name="warn" size="sm" /> Error al sincronizar</span> : null}
        </div>
        <div className="ar-title">{clean(a.activityName) || "Actividad"}</div>
        <div className="ar-eq">
          <Icon name="equipment" size="sm" />
          <b>{clean(a.equipmentName) || "—"}</b>
          {a.equipmentCode ? <span className="ar-code">{a.equipmentCode}</span> : null}
          {eqCount > 1 ? <span className="ar-code">+{eqCount - 1} equipos</span> : null}
          {a.equipmentLocation ? <span className="ar-loc">{clean(a.equipmentLocation)}</span> : null}
        </div>
        <div className="ar-facts">
          {a.plannedLubricantLabel && a.plannedLubricantLabel !== "—" && a.plannedLubricantLabel !== "-" ? (
            <span><Icon name="drop" size="sm" /> {clean(a.plannedLubricantLabel)}</span>
          ) : null}
          {a.quantityLabel && a.quantityLabel !== "—" ? (
            <span>
              <Icon name="quantity" size="sm" /> {clean(a.quantityLabel)}
              {Number(a.pointsCount) > 1 ? ` · ${a.pointsCount} puntos` : ""}
            </span>
          ) : null}
          {a.method && a.method !== "—" ? <span><Icon name="tool" size="sm" /> {clean(a.method)}</span> : null}
          {!canAssignTech || done ? (
            <span className={a.technicianName ? "" : "is-warn"}>
              <Icon name="user" size="sm" /> {clean(a.technicianName) || "Sin técnico"}
            </span>
          ) : null}
          {done && a.condition ? <span className={`ar-cond ${condTone(a.condition)}`}>Condición {COND[a.condition] || a.condition}</span> : null}
          {done && a.outOfRange ? <span className="is-warn"><Icon name="alert" size="sm" /> Consumo fuera de rango</span> : null}
        </div>
      </div>

      <div className="ar-side">
        {done && evidenceUrl ? (
          <a className="ar-thumb" href={evidenceUrl} target="_blank" rel="noreferrer" title="Ver evidencia">
            <img src={evidenceUrl} alt="Evidencia" loading="lazy" onError={(e) => (e.currentTarget.style.display = "none")} />
          </a>
        ) : null}

        {canExecute ? (
          <button type="button" className="ar-exec" onClick={onOpen}>
            <Icon name="check" /> Ejecutar
          </button>
        ) : null}
        {isTech && future ? <span className="ar-wait"><Icon name="clock" size="sm" /> Disponible el {a.dateLabel}</span> : null}

        {canAssignTech && !done ? (
          <div className="ar-manage" onClick={(e) => e.stopPropagation()}>
            <TechnicianSelect
              value={a.technicianId ?? ""}
              onChange={(v) => onAssignTech?.(a.id, v)}
              techs={techs}
              allowOtherPlants
              onBorrowed={onTechBorrowed}
              disabled={assigningId === a.id}
              className="ar-select"
              title="Técnico asignado"
            />
            {typeof onReschedule === "function" ? (
              <button type="button" className="ar-btn" onClick={() => onReschedule(a)} title="Cambiar la fecha">
                <Icon name="calendar" size="sm" /> Reprogramar
              </button>
            ) : null}
            {assigningId === a.id ? <span className="ar-wait">Asignando…</span> : null}
          </div>
        ) : null}

        {done ? (
          <button type="button" className="ar-btn" onClick={onOpen}>
            <Icon name="eye" size="sm" /> Ver registro
          </button>
        ) : null}
      </div>
    </article>
  );
}
