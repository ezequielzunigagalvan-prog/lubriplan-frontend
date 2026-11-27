// src/pages/PlantsOverviewPage.jsx
// Dashboard multiplanta (ADMIN: todas las plantas · SUPERVISOR: sus plantas).
// Cada tarjeta resume cómo va la planta; al elegirla se abre su dashboard.
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { useAuth } from "../context/AuthContext";
import { usePlant } from "../context/PlantContext";
import { httpGet, httpPost } from "../services/http";
import { Icon } from "../components/ui/lpIcons";
import { Ring, Spark } from "../components/dashboard/PlantGauges";
import MyPendingCard from "../components/dashboard/MyPendingCard";
import "./PlantsOverviewPage.css";

const LEVEL = {
  critical: { label: "Crítica", icon: "alert", cls: "is-critical" },
  warning: { label: "Atención", icon: "warn", cls: "is-warning" },
  ok: { label: "En orden", icon: "check", cls: "is-ok" },
};
const LEVEL_ORDER = { critical: 0, warning: 1, ok: 2 };

const thisMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};
const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const monthName = (ym) => {
  const [y, m] = String(ym).split("-").map(Number);
  return m ? `${MONTHS[m - 1]} ${y}` : ym;
};
const ago = (iso) => {
  if (!iso) return "sin actividades";
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `hace ${Math.max(1, mins)} min`;
  const h = Math.round(mins / 60);
  if (h < 48) return `hace ${h} h`;
  return `hace ${Math.round(h / 24)} días`;
};

function Stat({ value, label, tone = "", icon }) {
  return (
    <div className={`po-stat ${value > 0 ? tone : ""}`}>
      <span className="po-stat-v">
        {icon ? <Icon name={icon} size="sm" /> : null}
        {value ?? "—"}
      </span>
      <span className="po-stat-l">{label}</span>
    </div>
  );
}

function PlantCard({ p, current, onOpen }) {
  const lv = LEVEL[p.health?.level] || LEVEL.ok;
  return (
    <button type="button" className={`po-card ${lv.cls} ${current ? "is-current" : ""}`} onClick={() => onOpen(p)}>
      <div className="po-card-top">
        <div style={{ minWidth: 0 }}>
          <div className="po-card-name">{p.name}</div>
          <div className="po-card-sub">
            {p.equipments} equipo{p.equipments === 1 ? "" : "s"} · {p.routes} ruta{p.routes === 1 ? "" : "s"} · {p.technicians} técnico{p.technicians === 1 ? "" : "s"}
          </div>
        </div>
        <span className={`po-badge ${lv.cls}`}>
          <Icon name={lv.icon} size="sm" /> {lv.label}
        </span>
      </div>

      <div className="po-card-mid">
        <Ring value={p.compliance} />
        <div className="po-stats">
          <Stat value={p.overdue} label="Atrasadas" tone="t-red" />
          <Stat value={p.today} label="Para hoy" tone="t-amber" />
          <Stat value={p.unassigned} label="Sin técnico" tone="t-amber" />
          <Stat value={p.criticalReports} label="Reportes críticos" tone="t-red" />
        </div>
      </div>

      <div className="po-card-trend">
        <div className="po-card-trend-head">
          <span>Completadas · últimos 14 días</span>
          <b>
            {p.doneThisMonth}/{p.dueThisMonth} del mes
          </b>
        </div>
        <Spark data={p.trend} />
      </div>

      <div className="po-card-foot">
        <span className="po-reasons">
          {p.health?.reasons?.length ? p.health.reasons.slice(0, 3).join(" · ") : "Sin pendientes críticos"}
        </span>
        <span className="po-open">
          {current ? "Planta actual · " : ""}Abrir <Icon name="arrowRight" size="sm" />
        </span>
      </div>
      <div className="po-card-meta">
        Última actividad {ago(p.lastActivityAt)}
        {p.lowStock ? ` · ${p.lowStock} lubricante${p.lowStock === 1 ? "" : "s"} en mínimo` : ""}
        {p.next7 ? ` · ${p.next7} en los próximos 7 días` : ""}
      </div>
    </button>
  );
}

export default function PlantsOverviewPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentPlantId, setPlant, refreshPlants } = usePlant();
  const role = String(user?.role || "").toUpperCase();
  const [month, setMonth] = useState(thisMonth());
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("priority");
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await httpGet(`/dashboard/plants-overview?month=${encodeURIComponent(month)}`));
    } catch (e) {
      setError(e?.message || "No se pudo cargar el resumen de plantas");
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    load();
  }, [load]);

  const items = useMemo(() => {
    const s = q.trim().toLowerCase();
    const list = (data?.items || []).filter((p) => !s || p.name.toLowerCase().includes(s));
    const by = {
      priority: (a, b) => LEVEL_ORDER[a.health.level] - LEVEL_ORDER[b.health.level] || a.health.score - b.health.score,
      name: (a, b) => a.name.localeCompare(b.name),
      compliance: (a, b) => (a.compliance ?? 101) - (b.compliance ?? 101),
      overdue: (a, b) => b.overdue - a.overdue,
    };
    return [...list].sort(by[sort] || by.priority);
  }, [data, sort, q]);

  const t = data?.totals;

  const openPlant = async (p) => {
    try {
      // Admin sin alta en esa planta: se le da acceso para poder trabajar en ella.
      if (!p.hasAccess && role === "ADMIN") {
        await httpPost(`/dashboard/plants/${p.id}/enter`, {});
        await refreshPlants?.();
      }
      if (String(p.id) !== String(currentPlantId)) await setPlant(p.id);
      navigate("/dashboard/planta");
    } catch (e) {
      setError(e?.message || "No se pudo abrir la planta");
    }
  };

  return (
    <MainLayout>
      <div className="po-page">
        <header className="po-hero">
          <div className="po-hero-main">
            <div className="po-kicker">{role === "ADMIN" ? "PANEL MULTIPLANTA · TODAS LAS PLANTAS" : "PANEL MULTIPLANTA · MIS PLANTAS"}</div>
            <h1>¿Cómo van las plantas?</h1>
            <p>
              {t ? `${t.plants} planta${t.plants === 1 ? "" : "s"} · ${t.attention} requiere${t.attention === 1 ? "" : "n"} atención` : "Cargando…"}
              {data?.generatedAt ? ` · actualizado ${new Date(data.generatedAt).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}` : ""}
            </p>
          </div>
          <div className="po-hero-tools">
            <label className="po-month">
              <Icon name="calendar" size="sm" />
              <input type="month" value={month} max={thisMonth()} onChange={(e) => e.target.value && setMonth(e.target.value)} aria-label="Mes" />
            </label>
            <button type="button" className="po-btn" onClick={load} disabled={loading}>
              <Icon name="refresh" size="sm" /> {loading ? "Actualizando…" : "Actualizar"}
            </button>
          </div>
        </header>

        {t ? (
          <section className="po-totals" aria-label="Resumen de todas las plantas">
            <div className="po-total is-ring">
              <Ring value={t.compliance} size={78} label="global" />
              <div>
                <b>Cumplimiento de {monthName(data.month)}</b>
                <span>
                  {t.doneThisMonth} de {t.dueThisMonth} actividades programadas a la fecha
                </span>
              </div>
            </div>
            <div className={`po-total ${t.overdue ? "t-red" : ""}`}>
              <b>{t.overdue}</b>
              <span>Atrasadas</span>
            </div>
            <div className={`po-total ${t.today ? "t-amber" : ""}`}>
              <b>{t.today}</b>
              <span>Para hoy</span>
            </div>
            <div className={`po-total ${t.unassigned ? "t-amber" : ""}`}>
              <b>{t.unassigned}</b>
              <span>Sin técnico</span>
            </div>
            <div className={`po-total ${t.criticalReports ? "t-red" : ""}`}>
              <b>{t.criticalReports}</b>
              <span>Reportes críticos</span>
            </div>
            <div className={`po-total ${t.lowStock ? "t-amber" : ""}`}>
              <b>{t.lowStock}</b>
              <span>Lubricantes en mínimo</span>
            </div>
          </section>
        ) : null}

        <MyPendingCard />

        <div className="po-tools">
          <div className="po-search">
            <Icon name="search" size="sm" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar planta" />
          </div>
          <div className="po-sort" role="group" aria-label="Ordenar">
            {[
              ["priority", "Prioridad"],
              ["overdue", "Atrasadas"],
              ["compliance", "Cumplimiento"],
              ["name", "Nombre"],
            ].map(([k, l]) => (
              <button key={k} type="button" className={sort === k ? "is-on" : ""} onClick={() => setSort(k)}>
                {l}
              </button>
            ))}
          </div>
          <div className="po-legend">
            <span className="po-badge is-critical"><Icon name="alert" size="sm" /> Crítica</span>
            <span className="po-badge is-warning"><Icon name="warn" size="sm" /> Atención</span>
            <span className="po-badge is-ok"><Icon name="check" size="sm" /> En orden</span>
          </div>
        </div>

        {error ? <div className="po-error">{error}</div> : null}
        {loading && !data ? (
          <div className="po-grid">
            {[0, 1, 2].map((i) => (
              <div key={i} className="po-card is-skeleton" />
            ))}
          </div>
        ) : null}
        {data && !items.length ? (
          <div className="po-empty">
            <Icon name="building" size="xl" />
            <b>{data.items.length ? "Ninguna planta coincide con la búsqueda" : "No tienes plantas asignadas"}</b>
            {!data.items.length ? <span>Pide a un administrador que te asigne a una o más plantas.</span> : null}
          </div>
        ) : null}

        <div className="po-grid">
          {items.map((p) => (
            <PlantCard key={p.id} p={p} current={String(p.id) === String(currentPlantId)} onOpen={openPlant} />
          ))}
        </div>

        <p className="po-foot">
          Cumplimiento: actividades programadas del mes hasta hoy que ya están completadas. Atrasadas: abiertas con fecha anterior a hoy (hora de cada planta).
        </p>
      </div>
    </MainLayout>
  );
}
