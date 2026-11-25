// src/components/activities/RescheduleModal.jsx
// Reprogramar una actividad (supervisor / admin): nueva fecha + motivo, con historial.
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Icon } from "../ui/lpIcons";
import { rescheduleExecution, getExecutionReschedules } from "../../services/executionsService";
import "./RescheduleModal.css";

const pad = (n) => String(n).padStart(2, "0");
const ymdOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (ymd, n) => {
  const [y, m, d] = ymd.split("-").map(Number);
  return ymdOf(new Date(y, m - 1, d + n));
};
const nextWeekday = (ymd, jsDay) => {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const delta = ((jsDay - dt.getDay() + 7) % 7) || 7;
  return addDays(ymd, delta);
};
const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const DAYS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const pretty = (ymd) => {
  if (!ymd) return "—";
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return `${DAYS[dt.getDay()]} ${d} ${MONTHS[m - 1]} ${y}`;
};

const REASONS = [
  "Equipo en operación / sin paro",
  "Paro programado de línea",
  "Falta de lubricante o material",
  "Falta de personal",
  "Prioridad de otra actividad",
];

export default function RescheduleModal({ open, activity, todayYMD, onClose, onDone }) {
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);

  const currentYmd = activity?.dateLabel || "";
  const today = todayYMD || ymdOf(new Date());

  useEffect(() => {
    if (!open || !activity?.id) return;
    setDate("");
    setReason("");
    setError("");
    setHistory([]);
    let alive = true;
    getExecutionReschedules(activity.id)
      .then((r) => alive && setHistory(Array.isArray(r?.items) ? r.items : []))
      .catch(() => alive && setHistory([]));
    return () => {
      alive = false;
    };
  }, [open, activity?.id]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && !saving && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, saving, onClose]);

  const quick = useMemo(() => {
    const base = currentYmd && currentYmd > today ? currentYmd : today;
    return [
      { label: "Hoy", value: today },
      { label: "Mañana", value: addDays(today, 1) },
      { label: "+2 días", value: addDays(base, 2) },
      { label: "Próximo lunes", value: nextWeekday(today, 1) },
      { label: "+1 semana", value: addDays(base, 7) },
    ].filter((o) => o.value !== currentYmd);
  }, [today, currentYmd]);

  if (!open || !activity) return null;

  const valid = date && date >= today && date !== currentYmd && reason.trim().length >= 3;

  const save = async () => {
    if (!valid || saving) return;
    setSaving(true);
    setError("");
    try {
      const r = await rescheduleExecution(activity.id, { scheduledAt: date, reason: reason.trim() });
      toast.success(`Actividad reprogramada al ${pretty(date)}`);
      onDone?.(r?.item || null);
      onClose?.();
    } catch (e) {
      setError(e?.message || "No se pudo reprogramar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rs-overlay" onMouseDown={() => !saving && onClose?.()}>
      <div className="rs-modal" role="dialog" aria-modal="true" aria-label="Reprogramar actividad" onMouseDown={(e) => e.stopPropagation()}>
        <div className="rs-head">
          <div>
            <div className="rs-kicker">REPROGRAMAR ACTIVIDAD</div>
            <div className="rs-title">{activity.activityName}</div>
            <div className="rs-sub">
              {activity.equipmentName}
              {activity.equipmentCode ? ` · ${activity.equipmentCode}` : ""}
              {activity.technicianName ? ` · ${activity.technicianName}` : " · Sin técnico"}
            </div>
          </div>
          <button type="button" className="rs-x" onClick={onClose} disabled={saving} aria-label="Cerrar">
            <Icon name="close" />
          </button>
        </div>

        <div className="rs-body">
          <div className="rs-dates">
            <div className="rs-date is-from">
              <span>Programada</span>
              <b>{pretty(currentYmd)}</b>
              {activity.computedStatus === "Atrasada" ? <em>Atrasada {activity.overdueDays || ""} d</em> : null}
            </div>
            <Icon name="route" />
            <div className={`rs-date ${date ? "is-to" : ""}`}>
              <span>Nueva fecha</span>
              <b>{date ? pretty(date) : "Elige una fecha"}</b>
            </div>
          </div>

          <div className="rs-label">Fecha</div>
          <div className="rs-chips">
            {quick.map((o) => (
              <button key={o.label} type="button" className={`rs-chip ${date === o.value ? "is-on" : ""}`} onClick={() => setDate(o.value)}>
                {o.label}
              </button>
            ))}
          </div>
          <input type="date" className="rs-input" value={date} min={today} onChange={(e) => setDate(e.target.value)} />

          <div className="rs-label">Motivo *</div>
          <div className="rs-chips">
            {REASONS.map((r) => (
              <button key={r} type="button" className={`rs-chip ${reason === r ? "is-on" : ""}`} onClick={() => setReason(r)}>
                {r}
              </button>
            ))}
          </div>
          <textarea
            className="rs-input"
            rows={2}
            maxLength={300}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Escribe o elige un motivo"
          />

          {activity.route ? (
            <div className="rs-note">
              <Icon name="info" size="sm" />
              Es una actividad de ruta: después de completarla, la siguiente vuelve a programarse según la frecuencia de la ruta.
            </div>
          ) : null}
          {activity.technicianId ? (
            <div className="rs-note">
              <Icon name="bell" size="sm" />
              Se avisará al técnico asignado del cambio y el motivo.
            </div>
          ) : null}

          {history.length ? (
            <div className="rs-history">
              <div className="rs-label">Reprogramaciones anteriores</div>
              {history.map((h) => (
                <div key={h.id} className="rs-hrow">
                  <b>
                    {pretty(h.from)} → {pretty(h.to)}
                  </b>
                  <span>
                    {h.reason} · {h.by}
                  </span>
                </div>
              ))}
            </div>
          ) : null}

          {error ? <div className="rs-error">{error}</div> : null}
        </div>

        <div className="rs-foot">
          <button type="button" className="rs-btn" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="button" className="rs-btn is-primary" onClick={save} disabled={!valid || saving}>
            <Icon name="calendar" size="sm" />
            {saving ? "Guardando…" : "Reprogramar"}
          </button>
        </div>
      </div>
    </div>
  );
}
