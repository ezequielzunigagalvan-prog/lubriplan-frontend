// src/components/dashboard/PlantStatusBanner.jsx
// Estado de la planta actual (mismas definiciones que el dashboard multiplanta),
// con contadores que llevan directo a la lista filtrada.
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { httpGet } from "../../services/http";
import { usePlant } from "../../context/PlantContext";
import { Icon } from "../ui/lpIcons";
import { Ring, Spark } from "./PlantGauges";

const LEVEL = {
  critical: { label: "Crítica", icon: "alert", cls: "is-critical" },
  warning: { label: "Atención", icon: "warn", cls: "is-warning" },
  ok: { label: "En orden", icon: "check", cls: "is-ok" },
};

export default function PlantStatusBanner({ month, showBack = true }) {
  const navigate = useNavigate();
  const { currentPlantId } = usePlant();
  const [p, setP] = useState(null);

  useEffect(() => {
    if (!currentPlantId) return undefined;
    let alive = true;
    const qs = new URLSearchParams({ plantId: String(currentPlantId) });
    if (month) qs.set("month", month);
    httpGet(`/dashboard/plants-overview?${qs}`)
      .then((r) => alive && setP(r?.items?.[0] || null))
      .catch(() => alive && setP(null));
    return () => {
      alive = false;
    };
  }, [currentPlantId, month]);

  if (!p) return null;
  const lv = LEVEL[p.health?.level] || LEVEL.ok;
  const m = month ? `month=${encodeURIComponent(month)}&` : "";
  const tiles = [
    { v: p.overdue, l: "Atrasadas", tone: "t-red", to: `/activities?${m}filter=overdue` },
    { v: p.today, l: "Para hoy", tone: "t-amber", to: `/activities?${m}status=PENDING` },
    { v: p.unassigned, l: "Sin técnico", tone: "t-amber", to: `/activities?${m}filter=unassigned` },
    { v: p.criticalReports, l: "Reportes críticos", tone: "t-red", to: "/activities?filter=admin-priority" },
    { v: p.lowStock, l: "Lubricantes en mínimo", tone: "t-amber", to: "/inventory" },
    { v: p.next7, l: "Próximos 7 días", tone: "", to: `/activities?${m}status=PENDING` },
  ];

  return (
    <section className={`psb ${lv.cls}`} aria-label="Estado de la planta">
      <div className="psb-head">
        {showBack ? (
          <button type="button" className="psb-back" onClick={() => navigate("/dashboard")}>
            <Icon name="arrowLeft" size="sm" /> Todas las plantas
          </button>
        ) : null}
        <div className="psb-title">
          <span className="psb-kicker">ESTADO DE LA PLANTA</span>
          <b>{p.name}</b>
        </div>
        <span className={`po-badge ${lv.cls}`}>
          <Icon name={lv.icon} size="sm" /> {lv.label}
        </span>
      </div>
      <div className="psb-body">
        <Ring value={p.compliance} size={96} />
        <div className="psb-tiles">
          {tiles.map((t) => (
            <button key={t.l} type="button" className={`po-stat ${t.v > 0 ? t.tone : ""}`} onClick={() => navigate(t.to)}>
              <span className="po-stat-v">{t.v ?? "—"}</span>
              <span className="po-stat-l">{t.l}</span>
            </button>
          ))}
        </div>
        <div className="psb-trend">
          <div className="po-card-trend-head">
            <span>Completadas · 14 días</span>
            <b>
              {p.doneThisMonth}/{p.dueThisMonth} del mes
            </b>
          </div>
          <Spark data={p.trend} />
          <div className="psb-reasons">{p.health?.reasons?.length ? p.health.reasons.join(" · ") : "Sin pendientes críticos"}</div>
        </div>
      </div>
    </section>
  );
}
