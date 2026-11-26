// src/pages/ActionPlanPage.jsx
// Plan de acción: pendientes de supervisores y administradores en 4 grupos.
//  - ADMIN: "Todos" (de la planta, con filtro por responsable) y "Mis pendientes".
//  - SUPERVISOR: solo "Mis pendientes".
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { useAuth } from "../context/AuthContext";
import { usePlant } from "../context/PlantContext";
import { Icon } from "../components/ui/lpIcons";
import { getActionPlan, getActionAssignees } from "../services/actionPlanService";
import ActionItemForm from "../components/actionPlan/ActionItemForm";
import ActionItemDrawer from "../components/actionPlan/ActionItemDrawer";
import { CATEGORY, CATEGORY_ORDER, PRIORITY, fmtDay, daysLeft, fmtLocalDay } from "../components/actionPlan/actionPlanUi";
import "../components/actionPlan/ActionPlan.css";

function ProgressBar({ value, tone }) {
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className="ap-bar" role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100}>
      <span style={{ width: `${v}%`, background: v >= 100 ? "#16a34a" : tone }} />
    </div>
  );
}

function ItemCard({ item, onOpen, showOwner }) {
  const cat = CATEGORY[item.category];
  const pr = PRIORITY[item.priority] || PRIORITY.MEDIUM;
  const left = daysLeft(item.dueDate);
  const done = item.status === "DONE";
  const due = done
    ? `Cerrado ${fmtLocalDay(item.closedAt)}`
    : item.overdue
    ? `Vencido hace ${Math.abs(left)} día${Math.abs(left) === 1 ? "" : "s"}`
    : left === 0
    ? "Vence hoy"
    : `Vence en ${left} día${left === 1 ? "" : "s"}`;
  return (
    <button type="button" className={`ap-item ${item.overdue ? "is-overdue" : ""} ${done ? "is-done" : ""}`} onClick={() => onOpen(item.id)}>
      <div className="ap-item-top">
        <span className={`ap-prio ${pr.cls}`}>{pr.label}</span>
        <span className={`ap-due ${item.overdue ? "is-red" : left <= 2 && !done ? "is-amber" : ""}`}>
          <Icon name={done ? "check" : "calendar"} size="sm" /> {due}
        </span>
      </div>
      <div className="ap-item-title">{item.title}</div>
      {item.equipment ? (
        <div className="ap-item-eq">
          <Icon name="equipment" size="sm" /> {item.equipment.name}
        </div>
      ) : null}
      <div className="ap-item-prog">
        <ProgressBar value={item.progress} tone={cat.color} />
        <b>{item.progress}%</b>
      </div>
      <div className="ap-item-foot">
        {showOwner ? (
          <span className="ap-owner">
            <span className="ap-avatar">{String(item.owner?.name || "?").slice(0, 1).toUpperCase()}</span>
            {item.owner?.name}
          </span>
        ) : (
          <span className="ap-owner">Ejecutar: {fmtDay(item.dueDate)}</span>
        )}
        <span className="ap-counts">
          <span title="Comentarios">
            <Icon name="doc" size="sm" /> {item._count?.comments || 0}
          </span>
          <span title="Evidencias">
            <Icon name="camera" size="sm" /> {item._count?.evidence || 0}
          </span>
        </span>
      </div>
    </button>
  );
}

export default function ActionPlanPage() {
  const { user } = useAuth();
  const { currentPlantId, currentPlant } = usePlant();
  const location = useLocation();
  const navigate = useNavigate();
  const admin = String(user?.role || "").toUpperCase() === "ADMIN";

  const [scope, setScope] = useState(admin ? "all" : "mine");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [showClosed, setShowClosed] = useState(false);
  const [onlyOverdue, setOnlyOverdue] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [assignees, setAssignees] = useState([]);
  const [formCategory, setFormCategory] = useState(null);
  const [pickedId, setOpenId] = useState(null);
  // Abrir desde notificación (?item=) o desde la tarjeta
  const urlItem = Number(new URLSearchParams(location.search).get("item")) || null;
  const openId = pickedId || urlItem;

  const load = useCallback(async () => {
    if (!currentPlantId) return;
    try {
      const r = await getActionPlan({ scope: admin ? scope : "mine", includeClosed: showClosed, ownerUserId: scope === "all" ? ownerFilter : "" });
      setData(r);
      setError("");
    } catch (e) {
      setError(e?.message || "No se pudo cargar el plan de acción");
    }
  }, [currentPlantId, admin, scope, ownerFilter, showClosed]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!admin || !currentPlantId) return;
    getActionAssignees()
      .then((r) => setAssignees(Array.isArray(r?.items) ? r.items : []))
      .catch(() => setAssignees([]));
  }, [admin, currentPlantId]);

  const closeDrawer = () => {
    setOpenId(null);
    if (location.search.includes("item=")) navigate("/action-plan", { replace: true });
  };

  const items = useMemo(() => {
    const list = data?.items || [];
    return onlyOverdue ? list.filter((i) => i.overdue) : list;
  }, [data, onlyOverdue]);

  const totals = useMemo(() => {
    const list = (data?.items || []).filter((i) => i.status !== "CANCELLED");
    const open = list.filter((i) => i.status !== "DONE");
    return {
      open: open.length,
      overdue: list.filter((i) => i.overdue).length,
      dueWeek: open.filter((i) => !i.overdue && daysLeft(i.dueDate) <= 7).length,
      done: list.length - open.length,
      avg: list.length ? Math.round(list.reduce((n, i) => n + i.progress, 0) / list.length) : 0,
    };
  }, [data]);

  return (
    <MainLayout>
      <div className="ap-page">
        <header className="ap-hero">
          <div>
            <div className="ap-kicker">PLAN DE ACCIÓN{currentPlant?.name ? ` · ${currentPlant.name.toUpperCase()}` : ""}</div>
            <h1>{admin && scope === "all" ? "Pendientes de la planta" : "Mis pendientes"}</h1>
            <p>Lubricación, seguridad, predictivos y auditoría: cada pendiente con responsable, fecha de ejecución, avance y evidencia.</p>
          </div>
          {admin ? (
            <div className="ap-tabs" role="tablist">
              <button type="button" role="tab" aria-selected={scope === "all"} className={scope === "all" ? "is-on" : ""} onClick={() => setScope("all")}>
                <Icon name="users" size="sm" /> Todos
              </button>
              <button type="button" role="tab" aria-selected={scope === "mine"} className={scope === "mine" ? "is-on" : ""} onClick={() => setScope("mine")}>
                <Icon name="user" size="sm" /> Mis pendientes
              </button>
            </div>
          ) : null}
        </header>

        <section className="ap-kpis">
          <div className="ap-kpi">
            <b>{totals.open}</b>
            <span>Abiertos</span>
          </div>
          <button type="button" className={`ap-kpi ${totals.overdue ? "is-red" : ""} ${onlyOverdue ? "is-on" : ""}`} onClick={() => setOnlyOverdue((v) => !v)} title="Ver solo vencidos">
            <b>{totals.overdue}</b>
            <span>Vencidos {onlyOverdue ? "· filtrando" : ""}</span>
          </button>
          <div className={`ap-kpi ${totals.dueWeek ? "is-amber" : ""}`}>
            <b>{totals.dueWeek}</b>
            <span>Vencen en 7 días</span>
          </div>
          <div className="ap-kpi is-green">
            <b>{totals.done}</b>
            <span>Cerrados</span>
          </div>
          <div className="ap-kpi is-wide">
            <span>Avance promedio</span>
            <div className="ap-item-prog">
              <ProgressBar value={totals.avg} tone="#f97316" />
              <b>{totals.avg}%</b>
            </div>
          </div>
        </section>

        <div className="ap-tools">
          {admin && scope === "all" ? (
            <select value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)} aria-label="Responsable">
              <option value="">Todos los responsables</option>
              {assignees.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          ) : null}
          <label className="ap-check">
            <input type="checkbox" checked={showClosed} onChange={(e) => setShowClosed(e.target.checked)} />
            Mostrar cancelados
          </label>
          <button type="button" className="ap-btn" onClick={load}>
            <Icon name="refresh" size="sm" /> Actualizar
          </button>
        </div>

        {error ? <div className="ap-error">{error}</div> : null}
        {!data && !error ? <div className="ap-muted">Cargando pendientes…</div> : null}

        <div className="ap-board">
          {CATEGORY_ORDER.map((key) => {
            const cat = CATEGORY[key];
            const list = items.filter((i) => i.category === key);
            const s = data?.summary?.[key];
            return (
              <section key={key} className="ap-col" style={{ "--cat": cat.color }}>
                <div className="ap-col-head">
                  <span className="ap-col-icon">
                    <Icon name={cat.icon} />
                  </span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="ap-col-title">{cat.label}</div>
                    <div className="ap-col-sub">
                      {s ? `${s.open} abierto${s.open === 1 ? "" : "s"} · ${s.done} cerrado${s.done === 1 ? "" : "s"}` : "—"}
                      {s?.overdue ? <em> · {s.overdue} vencido{s.overdue === 1 ? "" : "s"}</em> : null}
                    </div>
                  </div>
                  <button type="button" className="ap-add" onClick={() => setFormCategory(key)} title={`Agregar pendiente de ${cat.label}`}>
                    <Icon name="plus" size="sm" /> Agregar
                  </button>
                </div>
                <div className="ap-col-prog">
                  <ProgressBar value={s?.avgProgress ?? 0} tone={cat.color} />
                  <b>{s?.avgProgress != null ? `${s.avgProgress}%` : "—"}</b>
                </div>
                <div className="ap-col-list">
                  {list.length ? (
                    list.map((i) => <ItemCard key={i.id} item={i} onOpen={setOpenId} showOwner={admin && scope === "all"} />)
                  ) : (
                    <button type="button" className="ap-empty" onClick={() => setFormCategory(key)}>
                      <Icon name="plus" size="sm" /> Sin pendientes · agregar uno
                    </button>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      {formCategory ? (
        <ActionItemForm
          category={formCategory}
          admin={admin}
          assignees={assignees}
          currentUser={user}
          onClose={() => setFormCategory(null)}
          onSaved={(item) => {
            setFormCategory(null);
            load();
            if (item?.id) setOpenId(item.id);
          }}
        />
      ) : null}

      {openId ? (
        <ActionItemDrawer id={openId} admin={admin} currentUser={user} assignees={assignees} onClose={closeDrawer} onChanged={load} />
      ) : null}
    </MainLayout>
  );
}
