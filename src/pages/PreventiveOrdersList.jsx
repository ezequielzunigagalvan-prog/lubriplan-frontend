// src/pages/PreventiveOrdersList.jsx
// Órdenes de Lubricación Preventiva (OLP): las rutas de un equipo que se ejecutan junto con
// el preventivo de mantenimiento. Supervisor/admin crean y liberan; el técnico ve las suyas.
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { useAuth } from "../context/AuthContext";
import { usePlant } from "../context/PlantContext";
import { Icon } from "../components/ui/lpIcons";
import { preventiveOrdersService } from "../services/preventiveOrdersService";
import OlpOrderForm from "../components/olp/OlpOrderForm";
import { ORDER_STATUS, daysFromToday, fmtDay, pct } from "../components/olp/olpUi";
import "./TechniciansPage.css";
import "../components/olp/Olp.css";

const TABS = [
  { k: "ACTIVE", label: "Activas", status: "DRAFT,OPEN,IN_PROGRESS" },
  { k: "DRAFT", label: "Borradores", status: "DRAFT" },
  { k: "OPEN", label: "Liberadas", status: "OPEN" },
  { k: "IN_PROGRESS", label: "En proceso", status: "IN_PROGRESS" },
  { k: "COMPLETED", label: "Completadas", status: "COMPLETED" },
  { k: "CANCELLED", label: "Canceladas", status: "CANCELLED" },
  { k: "ALL", label: "Todas", status: "" },
];
const LIMIT = 24;

export default function PreventiveOrdersList() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { user } = useAuth();
  const { currentPlant, currentPlantId } = usePlant();
  const role = String(user?.role || "").toUpperCase();
  const canManage = role === "ADMIN" || role === "SUPERVISOR";
  const isTech = role === "TECHNICIAN";

  const [tab, setTab] = useState(params.get("tab") || "ACTIVE");
  const [q, setQ] = useState("");
  const [qDebounced, setQDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ data: [], total: 0, totalPages: 1, counts: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(params.get("new") === "1");

  useEffect(() => {
    const t = setTimeout(() => setQDebounced(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const st = TABS.find((t) => t.k === tab)?.status || "";
      const r = await preventiveOrdersService.list({ status: st, q: qDebounced, page, limit: LIMIT });
      setData({ data: r?.data || [], total: r?.total || 0, totalPages: r?.totalPages || 1, counts: r?.counts || {} });
    } catch (e) {
      setError(e?.message || "No se pudieron cargar las órdenes");
    } finally {
      setLoading(false);
    }
  }, [tab, qDebounced, page]);

  useEffect(() => {
    load();
  }, [load, currentPlantId]);

  useEffect(() => setPage(1), [tab, qDebounced]);

  const counts = data.counts || {};
  const kpis = [
    { k: "DRAFT", icon: "edit", v: counts.DRAFT || 0, l: "Borradores", tone: "", hide: isTech },
    { k: "OPEN", icon: "userCheck", v: counts.OPEN || 0, l: "Liberadas", tone: counts.OPEN ? "is-orange" : "" },
    { k: "IN_PROGRESS", icon: "tool", v: counts.IN_PROGRESS || 0, l: "En proceso", tone: counts.IN_PROGRESS ? "is-orange" : "" },
    { k: "COMPLETED", icon: "checkCircle", v: counts.COMPLETED || 0, l: "Completadas", tone: "is-green" },
  ].filter((x) => !x.hide);

  const changeTab = (k) => {
    setTab(k);
    const next = new URLSearchParams(params);
    next.set("tab", k);
    next.delete("new");
    setParams(next, { replace: true });
  };

  return (
    <MainLayout>
      <div className="tch lp-fade-in">
        <header className="tch-head">
          <div>
            <div className="tch-kicker">Órdenes preventivas (OLP){currentPlant?.name ? ` · ${currentPlant.name}` : ""}</div>
            <h1 className="tch-title">{isTech ? "Mis órdenes preventivas" : "Órdenes de lubricación preventiva"}</h1>
            <div className="tch-sub">
              {isTech
                ? "Rutas que se ejecutan junto con el preventivo de mantenimiento del equipo."
                : "Agrupa las rutas de un equipo para ejecutarlas en el paro del preventivo de mantenimiento."}
            </div>
          </div>
          <div className="tch-head-actions">
            <button type="button" className="tch-btn tch-btn-ghost" onClick={load} disabled={loading}>
              <Icon name="refresh" size="sm" /> {loading ? "Actualizando…" : "Actualizar"}
            </button>
            {canManage ? (
              <button type="button" className="tch-btn tch-btn-primary" onClick={() => setShowForm(true)}>
                <Icon name="plus" size="sm" /> Nueva orden
              </button>
            ) : null}
          </div>
        </header>

        <section className={`tch-kpis olp-kpis`} style={isTech ? { gridTemplateColumns: "repeat(3, minmax(0, 1fr))" } : undefined} aria-label="Resumen">
          {kpis.map((x) => (
            <button key={x.k} type="button" className={`tch-kpi olp-kpi ${tab === x.k ? "is-on" : ""}`} onClick={() => changeTab(tab === x.k ? "ACTIVE" : x.k)}>
              <div className={`tch-kpi-icon ${x.tone}`}>
                <Icon name={x.icon} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div className="tch-kpi-value">{x.v}</div>
                <div className="tch-kpi-label">{x.l}</div>
              </div>
            </button>
          ))}
        </section>

        {canManage && !loading && !data.total && tab === "ACTIVE" && !qDebounced ? (
          <div className="olp-intro">
            <Icon name="info" />
            <div>
              <b>¿Cuándo usar una OLP?</b> Cuando el equipo se detiene para su preventivo de mantenimiento y se aprovecha el paro
              para lubricar. Elige las rutas (o todas), asigna al técnico y al ejecutarlas se cierran sus actividades, se descuenta
              el inventario y se programa la siguiente fecha de cada ruta.
            </div>
          </div>
        ) : null}

        <div className="olp-toolbar">
          <div className="tch-tabs" role="group" aria-label="Estado" style={{ flexWrap: "wrap" }}>
            {TABS.filter((t) => !(isTech && t.k === "DRAFT")).map((t) => (
              <button key={t.k} type="button" className="tch-tab" aria-pressed={tab === t.k} onClick={() => changeTab(t.k)}>
                {t.label}
              </button>
            ))}
          </div>
          <label className="tch-search olp-search">
            <Icon name="search" size="sm" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por equipo, código o título…" />
            {q ? (
              <button type="button" className="olp-clear" onClick={() => setQ("")} aria-label="Limpiar">
                <Icon name="close" size="sm" />
              </button>
            ) : null}
          </label>
        </div>

        {error ? <div className="olp-error">{error}</div> : null}

        {loading && !data.data.length ? (
          <div className="olp-empty">Cargando órdenes…</div>
        ) : !data.data.length ? (
          <div className="olp-empty">
            <Icon name="doc" />
            <b>{qDebounced ? "Sin resultados" : "No hay órdenes en esta vista"}</b>
            {canManage && !qDebounced ? (
              <button type="button" className="tch-btn tch-btn-primary" onClick={() => setShowForm(true)}>
                <Icon name="plus" size="sm" /> Crear orden preventiva
              </button>
            ) : null}
          </div>
        ) : (
          <div className="olp-grid">
            {data.data.map((o) => (
              <OrderCard key={o.id} o={o} onOpen={() => navigate(`/preventive-orders/${o.id}`)} />
            ))}
          </div>
        )}

        {data.totalPages > 1 ? (
          <div className="olp-pager">
            <button type="button" className="tch-btn tch-btn-ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <Icon name="chevLeft" size="sm" /> Anterior
            </button>
            <span>
              Página <b>{page}</b> de {data.totalPages} · {data.total} órdenes
            </span>
            <button type="button" className="tch-btn tch-btn-ghost" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>
              Siguiente <Icon name="chevRight" size="sm" />
            </button>
          </div>
        ) : null}
      </div>

      <OlpOrderForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSaved={(o) => {
          setShowForm(false);
          navigate(`/preventive-orders/${o.id}`);
        }}
      />
    </MainLayout>
  );
}

function OrderCard({ o, onOpen }) {
  const st = ORDER_STATUS[o.status] || ORDER_STATUS.DRAFT;
  const total = o.progress?.total || o._count?.items || 0;
  const done = o.progress?.completed || 0;
  const skipped = o.progress?.skipped || 0;
  const active = ["DRAFT", "OPEN", "IN_PROGRESS"].includes(o.status);
  const left = daysFromToday(o.scheduledDate);
  const late = active && left != null && left < 0;
  const when =
    o.status === "COMPLETED"
      ? `Cerrada ${fmtDay(o.completedAt)}`
      : left == null
      ? "Sin fecha"
      : left === 0
      ? "Hoy"
      : left < 0
      ? `Atrasada ${Math.abs(left)} día${Math.abs(left) === 1 ? "" : "s"}`
      : `En ${left} día${left === 1 ? "" : "s"}`;

  return (
    <button type="button" className={`olp-card ${st.cls} ${late ? "is-late" : ""}`} onClick={onOpen}>
      <div className="olp-card-top">
        <div style={{ minWidth: 0 }}>
          <div className="olp-card-id">OLP #{o.id}</div>
          <div className="olp-card-title">{o.title}</div>
        </div>
        <span className={`olp-badge ${st.cls}`}>
          <Icon name={st.icon} size="sm" /> {st.label}
        </span>
      </div>
      <div className="olp-card-eq">
        <Icon name="equipment" size="sm" /> <b style={{ color: "var(--tch-text)" }}>{o.equipment?.name || "Equipo"}</b>
        {o.equipment?.code ? <span className="olp-code">{o.equipment.code}</span> : null}
      </div>
      <div className="olp-card-meta">
        <span>
          <Icon name="calendar" size="sm" /> {fmtDay(o.scheduledDate)}
        </span>
        <span className={late ? "is-red" : left === 0 && active ? "is-amber" : ""}>
          <Icon name="clock" size="sm" /> {when}
        </span>
        <span>
          <Icon name="user" size="sm" /> {o.assignedToUser?.name || "Sin técnico"}
        </span>
      </div>
      <div className="olp-progress">
        <div className="olp-bar" aria-hidden="true">
          <span style={{ width: `${pct(done, total)}%` }} />
          <span className="is-skip" style={{ width: `${pct(skipped, total)}%` }} />
        </div>
        <b>
          {done + skipped}/{total} rutas
        </b>
      </div>
    </button>
  );
}
