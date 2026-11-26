// src/pages/EquipmentDetailPage.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import MainLayout from "../layouts/MainLayout";
import { getEquipmentById } from "../services/equipmentService";
import { useAuth } from "../context/AuthContext";
import { usePlant } from "../context/PlantContext";
import { formatRouteDisplayName } from "../utils/routeNames";
import { Icon } from "../components/ui/lpIcons";
import NewRouteModal from "../components/routes/NewRouteModal";
import EquipmentTechPanel from "../components/equipmentTech/EquipmentTechPanel";
import {
  critClass,
  critLabel,
  isActiveEquipment,
  frequencyLabel,
  execStatusLabel,
  conditionLabel,
  conditionClass,
  fmtDate,
} from "../utils/equipment";
import "./TechniciansPage.css";
import "./InventoryPage.css";
import "./EquipmentsPage.css";

const SHOW = 5;

export default function EquipmentDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const equipmentId = useMemo(() => Number(id), [id]);
  const { user } = useAuth();
  const { currentPlantId, currentPlant } = usePlant();
  const role = String(user?.role || "TECHNICIAN").toUpperCase();
  const canManage = role === "ADMIN" || role === "SUPERVISOR";

  const [eq, setEq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState({});
  const [routeOpen, setRouteOpen] = useState(false);

  const load = useCallback(async () => {
    if (!currentPlantId) return;
    try {
      setLoading(true);
      setError("");
      if (!Number.isFinite(equipmentId) || equipmentId <= 0) throw new Error("ID de equipo inválido.");
      const raw = await getEquipmentById(equipmentId);
      const data = raw?.item ?? raw?.equipment ?? raw;
      if (!data?.id) throw new Error("No se encontró el equipo.");
      setEq(data);
    } catch (e) {
      setEq(null);
      setError(e?.message || "No se pudo cargar el equipo.");
    } finally {
      setLoading(false);
    }
  }, [equipmentId, currentPlantId]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = (k) => setExpanded((x) => ({ ...x, [k]: !x[k] }));
  const take = (list, k) => (expanded[k] ? list : list.slice(0, SHOW));

  if (loading || !eq) {
    return (
      <MainLayout>
        <div className="tch">
          <button type="button" className="tch-btn tch-btn-ghost" style={{ height: 32, justifySelf: "start" }} onClick={() => navigate("/equipments")}>
            <Icon name="arrowLeft" size="sm" /> Volver a equipos
          </button>
          {loading ? (
            <div className="tch-empty"><p>Cargando equipo…</p></div>
          ) : (
            <div className="tch-empty" role="alert">
              <div className="tch-empty-icon"><Icon name="alert" /></div>
              <h3>No se pudo cargar el equipo</h3>
              <p>{error}</p>
              <button type="button" className="tch-btn tch-btn-ghost" onClick={load}>
                <Icon name="refresh" size="sm" /> Reintentar
              </button>
            </div>
          )}
        </div>
      </MainLayout>
    );
  }

  const active = isActiveEquipment(eq);
  // Rutas propias + rutas de varios equipos en las que participa este equipo.
  const routes = [
    ...(Array.isArray(eq.routes) ? eq.routes : []),
    ...(Array.isArray(eq.linkedRoutes) ? eq.linkedRoutes : []).map((r) => ({ ...r, linked: true })),
  ];
  const history = Array.isArray(eq.history) ? eq.history : [];
  const upcoming = Array.isArray(eq.upcoming) ? eq.upcoming : [];
  const reports = Array.isArray(eq.conditionReports) ? eq.conditionReports : [];
  const tech = eq.assignedTechnician || null;
  const overdue = upcoming.filter((x) => String(x.status).toUpperCase() === "OVERDUE" || new Date(x.scheduledAt) < new Date(new Date().toDateString())).length;
  const lastDone = history[0] || null;

  return (
    <MainLayout>
      <div className="tch lp-fade-in">
        <header className="tch-head">
          <div style={{ minWidth: 0 }}>
            <button type="button" className="tch-btn tch-btn-ghost" style={{ height: 32, marginBottom: 10 }} onClick={() => navigate("/equipments")}>
              <Icon name="arrowLeft" size="sm" /> Equipos
            </button>
            <div className="tch-kicker">
              {eq.area?.name || "Sin área"}
              {currentPlant?.name ? ` · ${currentPlant.name}` : ""}
            </div>
            <h1 className="tch-title">{eq.name}</h1>
            <div className="eq-chips" style={{ padding: "10px 0 0" }}>
              {eq.code ? <span className="tch-chip is-code">{eq.code}</span> : null}
              {eq.criticality ? <span className={`eq-crit c-${critClass(eq.criticality)}`}>Criticidad {critLabel(eq.criticality).toLowerCase()}</span> : null}
              <span className={`tch-chip ${active ? "is-active" : "is-inactive"}`}>
                <span className="tch-dot" /> {active ? "Activo" : "Inactivo"}
              </span>
              {eq.location ? (
                <span className="tch-chip">
                  <Icon name="pin" size="sm" /> {eq.location}
                </span>
              ) : null}
            </div>
          </div>
          <div className="tch-head-actions">
            <button type="button" className="tch-btn tch-btn-ghost" onClick={() => navigate(`/equipments/${eq.id}/lubrication-card`)}>
              <Icon name="doc" size="sm" /> Carta de lubricación
            </button>
            {canManage ? (
              <>
                <button type="button" className="tch-btn tch-btn-ghost" onClick={() => navigate(`/equipments/${eq.id}/edit`)}>
                  <Icon name="edit" size="sm" /> Editar
                </button>
                <button type="button" className="tch-btn tch-btn-primary" onClick={() => setRouteOpen(true)}>
                  <Icon name="plus" size="sm" /> Nueva ruta
                </button>
              </>
            ) : null}
          </div>
        </header>

        <section className="tch-kpis" aria-label="Resumen del equipo">
          <Kpi icon="route" value={routes.length} label="Rutas" tone={routes.length ? "" : "is-orange"} />
          <Kpi icon="clock" value={upcoming.length} label="Pendientes" tone={overdue ? "is-red" : ""} sub={overdue ? `${overdue} vencida${overdue === 1 ? "" : "s"}` : null} />
          <Kpi icon="checkCircle" value={eq.executionsCount ?? history.length} label="Actividades registradas" tone="is-green" sub={lastDone ? `Última: ${fmtDate(lastDone.executedAt)}` : null} />
          <Kpi icon="alert" value={eq.conditionReportsCount ?? reports.length} label="Reportes de condición" tone={reports.some((r) => r.status === "OPEN") ? "is-orange" : ""} />
        </section>

        <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 360px), 1fr))", alignItems: "start" }}>
          <Panel title="Datos del equipo">
            <dl className="eq-dl">
              <Row k="Código / TAG" v={eq.code || "—"} />
              <Row k="Área" v={eq.area?.name || "Sin área"} />
              <Row k="Ubicación" v={eq.location || "—"} />
              <Row k="Marca" v={eq.brand || "—"} />
              <Row k="Modelo" v={eq.model || "—"} />
              <Row k="Criticidad" v={critLabel(eq.criticality)} />
            </dl>
            {eq.description ? <p className="tch-sub" style={{ marginTop: 12 }}>{eq.description}</p> : null}
          </Panel>

          <Panel
            title="Técnico"
            action={canManage ? (
              <button type="button" className="tch-btn tch-btn-ghost" style={{ height: 32 }} onClick={() => navigate(`/equipments/${eq.id}/edit#assign`)}>
                Cambiar
              </button>
            ) : null}
          >
            <dl className="eq-dl">
              <Row k="Asignado a las rutas" v={tech?.name || "Sin asignar"} />
              <Row
                k="Más frecuente en el historial"
                v={eq.mostUsedTechnician?.technician?.name ? `${eq.mostUsedTechnician.technician.name} · ${eq.mostUsedTechnician.count} actividad${eq.mostUsedTechnician.count === 1 ? "" : "es"}` : "Sin historial"}
              />
            </dl>
          </Panel>
        </div>

        <EquipmentTechPanel equipmentId={eq.id} canManage={canManage} />

        <Panel title={`Rutas de lubricación (${routes.length})`} action={routes.length > SHOW ? <MoreBtn open={expanded.routes} onClick={() => toggle("routes")} /> : null}>
          {routes.length ? (
            <div className="inv-moves">
              {take(routes, "routes").map((r) => (
                <div key={r.id} className="inv-move" style={{ cursor: "pointer" }} onClick={() => navigate(`/routes/${r.id}`)} role="link" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && navigate(`/routes/${r.id}`)}>
                  <div className="inv-move-icon k-in" aria-hidden="true"><Icon name="drop" size="sm" /></div>
                  <div className="inv-move-title">{formatRouteDisplayName(r.name, r.routeKind, r.name || "Ruta")}</div>
                  <div className="inv-move-qty" style={{ fontFamily: "inherit", fontWeight: 600, fontSize: 13 }}>{fmtDate(r.nextDate)}</div>
                  <div className="inv-move-detail">
                    {[r.lubricant?.name || r.lubricantName || r.lubricantType, r.quantity ? `${r.quantity} ${r.unit || ""}`.trim() : null, frequencyLabel(r), r.technician?.name, r.linked ? `Ruta de ${r.equipmentsCount || r._count?.equipments || "varios"} equipos` : null, r.evidenceRequired ? "Foto obligatoria" : null].filter(Boolean).join(" · ")}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyLine text="Este equipo aún no tiene rutas." action={canManage ? { label: "Crear ruta", onClick: () => setRouteOpen(true) } : null} />
          )}
        </Panel>

        <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))", alignItems: "start" }}>
          <Panel title={`Próximas actividades (${upcoming.length})`} action={upcoming.length > SHOW ? <MoreBtn open={expanded.up} onClick={() => toggle("up")} /> : null}>
            {upcoming.length ? (
              <div className="inv-moves">
                {take(upcoming, "up").map((ex) => <ExecRow key={ex.id} ex={ex} date={ex.scheduledAt} />)}
              </div>
            ) : (
              <EmptyLine text="Sin actividades pendientes." />
            )}
          </Panel>

          <Panel title="Historial de actividades" action={history.length > SHOW ? <MoreBtn open={expanded.hist} onClick={() => toggle("hist")} /> : null}>
            {history.length ? (
              <div className="inv-moves">
                {take(history, "hist").map((ex) => <ExecRow key={ex.id} ex={ex} date={ex.executedAt} done />)}
              </div>
            ) : (
              <EmptyLine text="Aún no hay actividades completadas." />
            )}
          </Panel>
        </div>

        <Panel title={`Reportes de condición (${reports.length})`} action={reports.length > SHOW ? <MoreBtn open={expanded.rep} onClick={() => toggle("rep")} /> : null}>
          {reports.length ? (
            <div className="inv-moves">
              {take(reports, "rep").map((c) => (
                <div key={c.id} className="inv-move">
                  <span className={`eq-crit ${conditionClass(c.condition)}`} style={{ gridRow: "span 2" }}>{conditionLabel(c.condition)}</span>
                  <div className="inv-move-title">{c.category || "Reporte"} · {c.status === "OPEN" ? "Abierto" : c.status === "RESOLVED" ? "Resuelto" : c.status === "DISMISSED" ? "Descartado" : c.status}</div>
                  <div className="inv-move-qty" style={{ fontFamily: "inherit", fontWeight: 600, fontSize: 13 }}>{fmtDate(c.detectedAt || c.createdAt)}</div>
                  <div className="inv-move-detail">
                    {c.description}
                    {c.reportedBy?.name ? ` · ${c.reportedBy.name}` : ""}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyLine text="Sin reportes de condición." />
          )}
        </Panel>
      </div>

      {canManage && routeOpen ? (
        <NewRouteModal
          open
          onClose={() => setRouteOpen(false)}
          onSave={async () => {
            setRouteOpen(false);
            toast.success("Ruta creada");
            await load();
          }}
          initialData={{
            equipmentId: eq.id,
            equipmentName: eq.name || "",
            equipmentCode: eq.code || "",
            equipmentLocation: eq.location || "",
            technicianId: tech?.id ?? "",
            lockEquipment: true,
          }}
        />
      ) : null}
    </MainLayout>
  );
}

function Panel({ title, action, children }) {
  return (
    <section className="tch-modal" style={{ maxWidth: "none", maxHeight: "none", overflow: "visible", boxShadow: "var(--shadow-sm)" }}>
      <div className="tch-modal-head" style={{ alignItems: "center", paddingBottom: 12 }}>
        <h2 className="tch-modal-title" style={{ margin: 0, fontSize: 16 }}>{title}</h2>
        {action}
      </div>
      <div style={{ padding: "14px 18px 18px" }}>{children}</div>
    </section>
  );
}

function Row({ k, v }) {
  return (
    <>
      <dt>{k}</dt>
      <dd>{v}</dd>
    </>
  );
}

function Kpi({ icon, value, label, tone = "", sub }) {
  return (
    <div className="tch-kpi">
      <div className={`tch-kpi-icon ${tone}`}><Icon name={icon} /></div>
      <div style={{ minWidth: 0 }}>
        <div className="tch-kpi-value">{value}</div>
        <div className="tch-kpi-label">{label}</div>
        {sub ? <div className="tch-hint" style={{ marginTop: 2 }}>{sub}</div> : null}
      </div>
    </div>
  );
}

function MoreBtn({ open, onClick }) {
  return (
    <button type="button" className="tch-btn tch-btn-ghost" style={{ height: 30, fontSize: 12 }} onClick={onClick}>
      {open ? "Ver menos" : "Ver todo"}
    </button>
  );
}

function EmptyLine({ text, action }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
      <span className="tch-sub" style={{ margin: 0 }}>{text}</span>
      {action ? (
        <button type="button" className="tch-btn tch-btn-ghost" style={{ height: 32 }} onClick={action.onClick}>
          <Icon name="plus" size="sm" /> {action.label}
        </button>
      ) : null}
    </div>
  );
}

function ExecRow({ ex, date, done = false }) {
  const status = String(ex.status || "").toUpperCase();
  const late = !done && (status === "OVERDUE" || new Date(ex.scheduledAt) < new Date(new Date().toDateString()));
  const cls = done ? "k-in" : late ? "k-out" : "k-adj";
  const title = ex.route?.name || ex.manualTitle || "Actividad";
  const qty = done && ex.usedConvertedQuantity ? `${Number(ex.usedConvertedQuantity).toLocaleString("es-MX", { maximumFractionDigits: 2 })} ${ex.usedConvertedUnit || ""}` : null;
  return (
    <div className="inv-move">
      <div className={`inv-move-icon ${cls}`} aria-hidden="true">
        <Icon name={done ? "check" : late ? "warn" : "clock"} size="sm" />
      </div>
      <div className="inv-move-title">{title}</div>
      <div className="inv-move-qty" style={{ fontFamily: "inherit", fontWeight: 600, fontSize: 13 }}>{fmtDate(date)}</div>
      <div className="inv-move-detail">
        {[late ? "Vencida" : execStatusLabel(ex.status), ex.technician?.name || "Sin técnico", done && ex.condition ? `Condición ${conditionLabel(ex.condition).toLowerCase()}` : null, qty, ex.origin === "MANUAL" && !ex.route ? "Manual / emergencia" : null]
          .filter(Boolean)
          .join(" · ")}
        {done && ex.observations ? <div>{ex.observations}</div> : null}
      </div>
    </div>
  );
}
