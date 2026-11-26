// src/components/dashboard/TechnicianHome.jsx
// Inicio del técnico: lo que toca hoy, atrasadas y próximas, su avance del mes y atajos grandes.
import { useMemo } from "react";
import { Icon } from "../ui/lpIcons";
import { ActivityLane, QuickTiles, LaneItem } from "./DashboardBlocks";
import { Ring } from "./PlantGauges";
import "./PlantDashboard.css";
import "./TechnicianHome.css";

const pad = (n) => String(n).padStart(2, "0");
const todayYmd = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const addDays = (ymd, n) => {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(y, m - 1, d + n);
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
};
const DAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

export default function TechnicianHome({
  userName,
  userId,
  month,
  activities = [],
  loading,
  donutTotals,
  openExecutionModal,
  navigate,
  onOpenEmergencyActivity,
  onOpenReportCondition,
  offlineInfo,
  onSyncNow,
  onPrepareOffline,
  syncing,
  preparing,
}) {
  const today = todayYmd();
  const in7 = addDays(today, 7);

  const mine = useMemo(
    () =>
      (activities || []).filter((a) => {
        const tid = a?.technicianId ?? a?.technician?.id;
        return tid == null || tid === "" || String(tid) === String(userId || "");
      }),
    [activities, userId]
  );

  const lanes = useMemo(() => {
    const open = mine.filter((a) => a.computedStatus !== "Completada");
    const byDate = (x, y) => String(x.dateLabel).localeCompare(String(y.dateLabel));
    return {
      overdue: open.filter((a) => a.computedStatus === "Atrasada").sort(byDate),
      today: open.filter((a) => a.computedStatus !== "Atrasada" && a.dateLabel === today),
      upcoming: open.filter((a) => a.dateLabel > today && a.dateLabel <= in7).sort(byDate),
    };
  }, [mine, today, in7]);

  const next = lanes.overdue[0] || lanes.today[0] || null;
  const totals = donutTotals || { pending: 0, overdue: 0, completed: 0 };
  const totalMonth = Number(totals.pending || 0) + Number(totals.overdue || 0) + Number(totals.completed || 0);
  const pct = totalMonth ? Math.round((Number(totals.completed || 0) / totalMonth) * 100) : null;

  const open = (a) => {
    if (a.computedStatus === "Atrasada" || a.dateLabel <= today) openExecutionModal?.(a.id);
    else navigate(`/activities?month=${encodeURIComponent(month)}&executionId=${a.id}`);
  };
  const item = (tone) => (a) => {
    const late = a.computedStatus === "Atrasada";
    const dateText = late ? `Atrasada ${a.overdueDays || ""} d` : a.dateLabel === today ? "Hoy" : a.dateLabel;
    return <LaneItem key={a.id} activity={{ ...a, dateText }} tone={tone} onClick={() => open(a)} />;
  };

  const d = new Date();
  const online = offlineInfo ? offlineInfo.isOnline !== false : typeof navigator === "undefined" || navigator.onLine !== false;
  const pendingSync = Number(offlineInfo?.pendingCount || 0) + Number(offlineInfo?.failedCount || 0);
  const firstName = String(userName || "").split(" ")[0];

  return (
    <div className="th">
      <section className="th-hero">
        <div className="th-hero-main">
          <div className="th-kicker">
            {DAYS[d.getDay()]} {d.getDate()} de {MONTHS[d.getMonth()]}
          </div>
          <h2>{firstName ? `Hola, ${firstName}` : "Tu jornada"}</h2>
          <div className="th-today">
            <div className={lanes.today.length ? "is-amber" : ""}>
              <b>{loading ? "…" : lanes.today.length}</b>
              <span>Para hoy</span>
            </div>
            <div className={lanes.overdue.length ? "is-red" : ""}>
              <b>{loading ? "…" : lanes.overdue.length}</b>
              <span>Atrasadas</span>
            </div>
            <div>
              <b>{loading ? "…" : lanes.upcoming.length}</b>
              <span>Próximos 7 días</span>
            </div>
          </div>
        </div>
        <div className="th-hero-side">
          {next ? (
            <button type="button" className="th-cta" onClick={() => openExecutionModal?.(next.id)}>
              <span className="th-cta-icon">
                <Icon name="check" />
              </span>
              <span style={{ minWidth: 0 }}>
                <b>Ejecutar siguiente</b>
                <small>
                  {[next.activityName || next.routeName, next.equipmentName].filter(Boolean).join(" · ")}
                </small>
              </span>
            </button>
          ) : (
            <div className="th-done">
              <Icon name="checkCircle" />
              <span>{loading ? "Cargando tu jornada…" : "Sin pendientes para hoy"}</span>
            </div>
          )}
          <div className={`th-sync ${online ? "" : "is-off"} ${pendingSync ? "is-pending" : ""}`}>
            <span className="th-sync-dot" />
            {online ? "En línea" : "Sin conexión"}
            {pendingSync ? ` · ${pendingSync} por sincronizar` : ""}
            {pendingSync && online ? (
              <button type="button" onClick={onSyncNow} disabled={syncing}>
                {syncing ? "Sincronizando…" : "Sincronizar"}
              </button>
            ) : online ? (
              <button type="button" onClick={onPrepareOffline} disabled={preparing} title="Guarda tus actividades para trabajar sin señal">
                {preparing ? "Preparando…" : "Preparar sin conexión"}
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <div className="pd-lanes">
        <ActivityLane tone="red" icon="clock" title="Atrasadas" subtitle="Atiéndelas primero" count={lanes.overdue.length} loading={loading} items={lanes.overdue} renderItem={item("red")} emptyText="Sin atrasadas" max={4} onMore={() => navigate(`/activities?status=OVERDUE&month=${encodeURIComponent(month)}`)} />
        <ActivityLane tone="amber" icon="alert" title="Para hoy" subtitle="Tu trabajo del día" count={lanes.today.length} loading={loading} items={lanes.today} renderItem={item("amber")} emptyText="Nada pendiente hoy" max={4} onMore={() => navigate(`/activities?month=${encodeURIComponent(month)}`)} />
        <ActivityLane tone="green" icon="calendar" title="Próximas" subtitle="Siguientes 7 días" count={lanes.upcoming.length} loading={loading} items={lanes.upcoming} renderItem={item("green")} emptyText="Sin actividades próximas" max={4} onMore={() => navigate(`/activities?month=${encodeURIComponent(month)}`)} />
      </div>

      <div className="pd-row2">
        <section className="th-card">
          <div className="th-card-head">
            <b>Mi avance del mes</b>
            <span>{month}</span>
          </div>
          <div className="th-progress">
            <Ring value={pct} size={118} label="completado" />
            <div className="th-progress-stats">
              <button type="button" className="is-green" onClick={() => navigate(`/activities?status=COMPLETED&month=${encodeURIComponent(month)}`)}>
                <b>{totals.completed || 0}</b>
                <span>Completadas</span>
              </button>
              <button type="button" className="is-amber" onClick={() => navigate(`/activities?status=PENDING&month=${encodeURIComponent(month)}`)}>
                <b>{totals.pending || 0}</b>
                <span>Pendientes</span>
              </button>
              <button type="button" className="is-red" onClick={() => navigate(`/activities?status=OVERDUE&month=${encodeURIComponent(month)}`)}>
                <b>{totals.overdue || 0}</b>
                <span>Atrasadas</span>
              </button>
            </div>
          </div>
        </section>

        <section className="th-card">
          <div className="th-card-head">
            <b>Acciones rápidas</b>
            <span>Campo</span>
          </div>
          <QuickTiles
            row
            tiles={[
              { label: "Mis actividades", sub: "Lista completa", icon: "list", primary: true, onClick: () => navigate(`/activities?month=${encodeURIComponent(month)}`) },
              { label: "Reportar condición", sub: "Fuga, ruido, temperatura", icon: "warn", onClick: () => onOpenReportCondition?.() },
              { label: "Emergente", sub: "Trabajo no programado", icon: "bolt", onClick: () => onOpenEmergencyActivity?.() },
              { label: "Asistente técnico", sub: "Pregunta en campo", icon: "spark", onClick: () => navigate("/technical-assistant") },
              { label: "Historial", sub: "Lo que ya hice", icon: "history", onClick: () => navigate(`/history?month=${encodeURIComponent(month)}`) },
            ]}
          />
        </section>
      </div>
    </div>
  );
}
