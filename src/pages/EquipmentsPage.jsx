// src/pages/EquipmentsPage.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import MainLayout from "../layouts/MainLayout";
import { getEquipment, deleteEquipment, createEquipment, getRepeatedFailures } from "../services/equipmentService";
import {
  getEquipmentAreas,
  createEquipmentArea,
  updateEquipmentArea,
  deleteEquipmentArea,
} from "../services/equipmentAreasService";
import { useAuth } from "../context/AuthContext";
import { usePlant } from "../context/PlantContext";
import { useConfirm } from "../components/ui/ConfirmDialog";
import { CardSkeleton } from "../components/ui/CardSkeleton";
import { Icon } from "../components/ui/lpIcons";
import NewRouteModal from "../components/routes/NewRouteModal";
import EquipmentFields from "../components/equipment/EquipmentFields";
import { CRITICALITIES, critClass, critLabel, isActiveEquipment, normalizeCode } from "../utils/equipment";
import "./TechniciansPage.css";
import "./EquipmentsPage.css";

const PAGE = 12;
const NO_AREA = "_no_area";

const norm = (v) =>
  String(v ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();

const EMPTY_EQ = {
  name: "",
  code: "",
  areaId: "",
  location: "",
  criticality: "MEDIA",
  status: "ACTIVO",
  brand: "",
  model: "",
  description: "",
};

export default function EquipmentsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const confirm = useConfirm();
  const { user } = useAuth();
  const { currentPlantId, currentPlant } = usePlant();
  const role = String(user?.role || "TECHNICIAN").toUpperCase();
  const canManage = role === "ADMIN" || role === "SUPERVISOR";
  const canDelete = role === "ADMIN";

  // Filtros que llegan por URL desde el panel (sin rutas, sin actividad, fallas repetidas).
  const query = useMemo(() => {
    const p = new URLSearchParams(location.search || "");
    const days = Number(p.get("days") || 30);
    return {
      filter: String(p.get("filter") || ""),
      days: Number.isFinite(days) ? Math.min(Math.max(days, 1), 3650) : 30,
      month: /^\d{4}-\d{2}$/.test(p.get("month") || "") ? p.get("month") : "",
      lookbackDays: Number(p.get("lookbackDays") || 90),
      minEvents: Number(p.get("minEvents") || 2),
    };
  }, [location.search]);
  const isRepeated = query.filter === "repeated-failures";

  const [areas, setAreas] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [repeated, setRepeated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [areaFilter, setAreaFilter] = useState("");
  const [critFilter, setCritFilter] = useState("");
  const [visible, setVisible] = useState({});

  const [areaModal, setAreaModal] = useState(null); // null | { id?, name, description }
  const [eqModal, setEqModal] = useState(false);
  const [routeFor, setRouteFor] = useState(null);

  const load = useCallback(async () => {
    if (!currentPlantId) return;
    try {
      setLoading(true);
      setLoadError("");
      if (isRepeated) {
        const data = await getRepeatedFailures({
          month: query.month || new Date().toISOString().slice(0, 7),
          lookbackDays: query.lookbackDays,
          minEvents: query.minEvents,
        });
        setRepeated(Array.isArray(data?.items) ? data.items : []);
        setEquipments([]);
        setAreas([]);
        return;
      }
      const [areasRes, eqRes] = await Promise.all([
        getEquipmentAreas(),
        getEquipment({ filter: query.filter || "", days: query.days }),
      ]);
      setAreas(Array.isArray(areasRes?.result) ? areasRes.result : Array.isArray(areasRes) ? areasRes : []);
      setEquipments(Array.isArray(eqRes) ? eqRes : []);
      setRepeated([]);
    } catch (e) {
      setLoadError(e?.message || "No se pudieron cargar los equipos.");
    } finally {
      setLoading(false);
    }
  }, [currentPlantId, isRepeated, query.filter, query.days, query.month, query.lookbackDays, query.minEvents]);

  useEffect(() => {
    setSearch("");
    setAreaFilter("");
    setCritFilter("");
    setStatusFilter("all");
    setVisible({});
    load();
  }, [load]);

  /* ===== Filtro ===== */
  const filtered = useMemo(() => {
    const q = norm(search);
    return equipments.filter((eq) => {
      if (statusFilter === "active" && !isActiveEquipment(eq)) return false;
      if (statusFilter === "inactive" && isActiveEquipment(eq)) return false;
      if (critFilter && String(eq.criticality || "").toUpperCase() !== critFilter) return false;
      const areaId = eq.areaId ?? eq.area?.id ?? null;
      if (areaFilter === NO_AREA && areaId != null) return false;
      if (areaFilter && areaFilter !== NO_AREA && Number(areaId) !== Number(areaFilter)) return false;
      if (!q) return true;
      return [eq.name, eq.code, eq.location, eq.brand, eq.model, eq.area?.name, eq.assignedTechnician?.name].some((v) =>
        norm(v).includes(q)
      );
    });
  }, [equipments, search, statusFilter, critFilter, areaFilter]);

  const stats = useMemo(() => {
    const active = equipments.filter(isActiveEquipment).length;
    const critical = equipments.filter((e) => String(e.criticality || "").toUpperCase() === "CRITICA").length;
    const noRoutes = equipments.filter((e) => !Number(e.routesCount || 0)).length;
    const noActivity = equipments.filter((e) => e.noActivitiesInRange).length;
    return { total: equipments.length, active, inactive: equipments.length - active, critical, noRoutes, noActivity };
  }, [equipments]);

  // Agrupa por área (ordenadas A→Z) y deja "Sin área" al final.
  const groups = useMemo(() => {
    const collator = new Intl.Collator("es", { numeric: true, sensitivity: "base" });
    const byArea = new Map();
    for (const eq of filtered) {
      const key = eq.areaId ?? eq.area?.id ?? NO_AREA;
      if (!byArea.has(key)) byArea.set(key, []);
      byArea.get(key).push(eq);
    }
    for (const list of byArea.values()) list.sort((a, b) => collator.compare(a.name || "", b.name || ""));

    const sortedAreas = [...areas].sort((a, b) => collator.compare(a.name || "", b.name || ""));
    const out = [];
    const showEmptyAreas = canManage && !search && !critFilter && statusFilter === "all" && !query.filter && !areaFilter;
    for (const a of sortedAreas) {
      const list = byArea.get(a.id) || [];
      if (list.length || showEmptyAreas) out.push({ key: a.id, area: a, list });
    }
    if (byArea.get(NO_AREA)?.length) out.push({ key: NO_AREA, area: null, list: byArea.get(NO_AREA) });
    return out;
  }, [filtered, areas, canManage, search, critFilter, statusFilter, query.filter, areaFilter]);

  /* ===== Acciones ===== */
  const handleDeleteEquipment = async (eq) => {
    const ok = await confirm(`¿Eliminar el equipo "${eq.name}"?`, {
      title: "Eliminar equipo",
      confirmLabel: "Eliminar",
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteEquipment(eq.id);
      toast.success("Equipo eliminado");
      await load();
    } catch (e) {
      // 409: tiene historial; el servidor sugiere marcarlo INACTIVO.
      toast.error(e?.message || "No se pudo eliminar el equipo", { duration: 8000 });
    }
  };

  const handleDeleteArea = async (area) => {
    const ok = await confirm(`¿Eliminar el área "${area.name}"?`, {
      title: "Eliminar área",
      confirmLabel: "Eliminar",
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteEquipmentArea(area.id);
      toast.success("Área eliminada");
      await load();
    } catch (e) {
      toast.error(e?.message || "No se pudo eliminar el área");
    }
  };

  const saveArea = async ({ id, name, description }) => {
    if (id) await updateEquipmentArea(id, { name, description });
    else await createEquipmentArea({ name, description });
    toast.success(id ? "Área actualizada" : "Área creada");
    setAreaModal(null);
    await load();
  };

  const saveEquipment = async (payload) => {
    await createEquipment(payload);
    toast.success("Equipo creado");
    setEqModal(false);
    await load();
  };

  const clearUrlFilter = () => navigate("/equipments");

  const urlFilterLabel =
    query.filter === "without-routes"
      ? "Mostrando equipos sin rutas de lubricación"
      : query.filter === "no-activities"
      ? `Mostrando equipos con rutas pero sin actividad en los últimos ${query.days} días`
      : query.filter === "with-routes"
      ? "Mostrando equipos con rutas"
      : isRepeated
      ? `Equipos con condición MALA o CRÍTICA repetida (últimos ${query.lookbackDays} días)`
      : "";

  return (
    <MainLayout>
      <div className="tch lp-fade-in">
        <header className="tch-head">
          <div>
            <div className="tch-kicker">Equipos{currentPlant?.name ? ` · ${currentPlant.name}` : ""}</div>
            <h1 className="tch-title">Equipos</h1>
            <div className="tch-sub">Equipos de planta por área, sus rutas, técnico asignado y actividad reciente.</div>
          </div>
          <div className="tch-head-actions">
            {!isRepeated ? (
              <label className="tch-search">
                <Icon name="search" size="sm" />
                <input
                  placeholder="Buscar por nombre, código, ubicación…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label="Buscar equipo"
                />
                {search ? (
                  <button type="button" className="tch-icon-btn" style={{ width: 26, height: 26, border: 0 }} onClick={() => setSearch("")} aria-label="Limpiar búsqueda">
                    <Icon name="close" size="sm" />
                  </button>
                ) : null}
              </label>
            ) : null}
            {canManage && !isRepeated ? (
              <>
                <button type="button" className="tch-btn tch-btn-ghost" onClick={() => setAreaModal({ name: "", description: "" })}>
                  <Icon name="pin" size="sm" /> Nueva área
                </button>
                <button type="button" className="tch-btn tch-btn-primary" onClick={() => setEqModal(true)}>
                  <Icon name="plus" size="sm" /> Nuevo equipo
                </button>
              </>
            ) : null}
          </div>
        </header>

        {urlFilterLabel ? (
          <div className="eq-banner" role="status">
            <span>
              <Icon name="filter" size="sm" /> {urlFilterLabel}
            </span>
            <button type="button" className="tch-btn tch-btn-ghost" style={{ height: 32 }} onClick={clearUrlFilter}>
              Ver todos los equipos
            </button>
          </div>
        ) : null}

        {loading ? (
          <CardSkeleton count={6} columns="repeat(auto-fill, minmax(290px, 1fr))" gap={12} />
        ) : loadError ? (
          <div className="tch-empty" role="alert">
            <div className="tch-empty-icon"><Icon name="alert" /></div>
            <h3>No se pudieron cargar los equipos</h3>
            <p>{loadError}</p>
            <button type="button" className="tch-btn tch-btn-ghost" onClick={load}>
              <Icon name="refresh" size="sm" /> Reintentar
            </button>
          </div>
        ) : isRepeated ? (
          <RepeatedFailures items={repeated} canManage={canManage} navigate={navigate} />
        ) : (
          <>
            <section className="tch-kpis" aria-label="Resumen de equipos">
              <Kpi icon="equipment" tone="is-green" value={stats.active} total={stats.total} label="Equipos activos" />
              <Kpi icon="alert" tone={stats.critical ? "is-red" : ""} value={stats.critical} label="Críticos" />
              <Kpi
                icon="route"
                tone={stats.noRoutes ? "is-orange" : ""}
                value={stats.noRoutes}
                label="Sin rutas"
                onClick={stats.noRoutes && query.filter !== "without-routes" ? () => navigate("/equipments?filter=without-routes") : undefined}
              />
              <Kpi
                icon="clock"
                tone={stats.noActivity ? "is-orange" : ""}
                value={stats.noActivity}
                label={`Sin actividad ${query.days} días`}
                onClick={stats.noActivity && query.filter !== "no-activities" ? () => navigate(`/equipments?filter=no-activities&days=${query.days}`) : undefined}
              />
            </section>

            {equipments.length ? (
              <div className="tch-toolbar">
                <div className="tch-tabs" role="group" aria-label="Filtrar por estado">
                  {[
                    ["all", "Todos", stats.total],
                    ["active", "Activos", stats.active],
                    ["inactive", "Inactivos", stats.inactive],
                  ].map(([key, label, n]) => (
                    <button key={key} type="button" className="tch-tab" aria-pressed={statusFilter === key} onClick={() => setStatusFilter(key)}>
                      {label} <span className="tch-tab-count">{n}</span>
                    </button>
                  ))}
                </div>
                <div className="eq-filters">
                  <select className="eq-select" value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)} aria-label="Filtrar por área">
                    <option value="">Todas las áreas</option>
                    {areas.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                    <option value={NO_AREA}>Sin área</option>
                  </select>
                  <select className="eq-select" value={critFilter} onChange={(e) => setCritFilter(e.target.value)} aria-label="Filtrar por criticidad">
                    <option value="">Toda criticidad</option>
                    {CRITICALITIES.map((c) => (
                      <option key={c} value={c}>{critLabel(c)}</option>
                    ))}
                  </select>
                </div>
              </div>
            ) : null}

            {groups.length ? (
              groups.map(({ key, area, list }) => {
                const limit = visible[key] ?? PAGE;
                return (
                  <section key={key} className="eq-area" aria-label={area ? `Área ${area.name}` : "Sin área"}>
                    <div className="eq-area-head">
                      <div>
                        <div className="eq-area-title">
                          {area ? area.name : "Sin área"}
                          <span className="eq-area-count">{list.length}</span>
                        </div>
                        {area?.description ? <div className="eq-area-desc">{area.description}</div> : null}
                      </div>
                      {area && canManage ? (
                        <div style={{ display: "flex", gap: 6 }}>
                          <button type="button" className="tch-icon-btn" onClick={() => setAreaModal({ id: area.id, name: area.name, description: area.description || "" })} title="Editar área" aria-label={`Editar área ${area.name}`}>
                            <Icon name="edit" size="sm" />
                          </button>
                          {canDelete ? (
                            <button type="button" className="tch-icon-btn is-danger" onClick={() => handleDeleteArea(area)} title="Eliminar área" aria-label={`Eliminar área ${area.name}`}>
                              <Icon name="trash" size="sm" />
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </div>

                    {list.length ? (
                      <div className="eq-grid">
                        {list.slice(0, limit).map((eq) => (
                          <EquipmentCard
                            key={eq.id}
                            eq={eq}
                            days={query.days}
                            canManage={canManage}
                            canDelete={canDelete}
                            onOpen={() => navigate(`/equipments/${eq.id}`)}
                            onEdit={() => navigate(`/equipments/${eq.id}/edit`)}
                            onNewRoute={() => setRouteFor(eq)}
                            onDelete={() => handleDeleteEquipment(eq)}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="tch-hint">Esta área aún no tiene equipos.</div>
                    )}

                    {list.length > limit ? (
                      <button type="button" className="tch-btn tch-btn-ghost eq-more" onClick={() => setVisible((v) => ({ ...v, [key]: limit + PAGE }))}>
                        Ver {Math.min(PAGE, list.length - limit)} más de {list.length - limit}
                      </button>
                    ) : null}
                  </section>
                );
              })
            ) : (
              <div className="tch-empty">
                <div className="tch-empty-icon"><Icon name="equipment" /></div>
                <h3>{equipments.length ? "Sin resultados" : query.filter ? "Nada por aquí" : "Sin equipos"}</h3>
                <p>
                  {equipments.length
                    ? "Ningún equipo coincide con la búsqueda o los filtros."
                    : query.filter
                    ? "Ningún equipo cumple esta condición. ¡Bien!"
                    : "Registra las áreas y equipos de la planta para crear sus rutas de lubricación."}
                </p>
                {equipments.length ? (
                  <button
                    type="button"
                    className="tch-btn tch-btn-ghost"
                    onClick={() => {
                      setSearch("");
                      setAreaFilter("");
                      setCritFilter("");
                      setStatusFilter("all");
                    }}
                  >
                    Limpiar filtros
                  </button>
                ) : canManage && !query.filter ? (
                  <button type="button" className="tch-btn tch-btn-primary" onClick={() => setEqModal(true)}>
                    <Icon name="plus" size="sm" /> Agregar equipo
                  </button>
                ) : null}
              </div>
            )}
          </>
        )}
      </div>

      {areaModal ? <AreaModal initial={areaModal} onClose={() => setAreaModal(null)} onSave={saveArea} /> : null}
      {eqModal ? <EquipmentModal areas={areas} onClose={() => setEqModal(false)} onSave={saveEquipment} /> : null}

      {canManage && routeFor ? (
        <NewRouteModal
          open
          onClose={() => setRouteFor(null)}
          onSave={async () => {
            setRouteFor(null);
            toast.success("Ruta creada");
            await load();
          }}
          initialData={{
            equipmentId: routeFor.id,
            equipmentName: routeFor.name || "",
            equipmentCode: routeFor.code || "",
            equipmentLocation: routeFor.location || "",
            technicianId: routeFor.assignedTechnician?.id ?? routeFor.technicianId ?? "",
            lockEquipment: true,
          }}
        />
      ) : null}
    </MainLayout>
  );
}

/* ================= Componentes ================= */

function Kpi({ icon, tone = "", value, total, label, onClick }) {
  const clickable = typeof onClick === "function";
  return (
    <div
      className="tch-kpi"
      style={clickable ? { cursor: "pointer" } : undefined}
      onClick={onClick}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? (e) => e.key === "Enter" && onClick() : undefined}
      title={clickable ? "Ver estos equipos" : undefined}
    >
      <div className={`tch-kpi-icon ${tone}`}><Icon name={icon} /></div>
      <div>
        <div className="tch-kpi-value">
          {value}
          {total != null ? <small> / {total}</small> : null}
        </div>
        <div className="tch-kpi-label">{label}</div>
      </div>
    </div>
  );
}

const CRIT_COLORS = { critica: "#ef4444", alta: "#f97316", media: "#eab308", baja: "#22c55e" };

function EquipmentCard({ eq, days, canManage, canDelete, onOpen, onEdit, onNewRoute, onDelete }) {
  const active = isActiveEquipment(eq);
  const cls = critClass(eq.criticality);
  const routes = Number(eq.routesCount || 0);
  const tech = eq.assignedTechnician || eq.technician || null;
  const stop = (fn) => (e) => {
    e.stopPropagation();
    fn();
  };

  return (
    <article
      className={`eq-card ${active ? "" : "is-inactive"}`}
      style={{ "--eq-crit": CRIT_COLORS[cls] || "#94a3b8" }}
      onClick={onOpen}
      onKeyDown={(e) => e.key === "Enter" && e.target === e.currentTarget && onOpen()}
      tabIndex={0}
      aria-label={`Abrir ${eq.name}`}
    >
      <div className="eq-card-head">
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="eq-name">{eq.name}</div>
          {eq.location ? (
            <div className="eq-loc">
              <Icon name="pin" size="sm" /> {eq.location}
            </div>
          ) : null}
        </div>
      </div>

      <div className="eq-chips">
        {eq.code ? <span className="tch-chip is-code">{eq.code}</span> : null}
        {eq.criticality ? <span className={`eq-crit c-${cls}`}>{critLabel(eq.criticality)}</span> : null}
        {!active ? (
          <span className="tch-chip is-inactive">
            <span className="tch-dot" /> Inactivo
          </span>
        ) : null}
        {eq.brand || eq.model ? <span className="tch-chip">{[eq.brand, eq.model].filter(Boolean).join(" · ")}</span> : null}
      </div>

      <div className="eq-info">
        <div>
          <div className="eq-info-label">Rutas</div>
          <div className={`eq-info-value ${routes ? "" : "is-warn"}`}>{routes ? `${routes} ruta${routes === 1 ? "" : "s"}` : "Sin rutas"}</div>
        </div>
        <div>
          <div className="eq-info-label">Técnico</div>
          <div className={`eq-info-value ${tech ? "" : "is-muted"}`} title={tech?.name || ""}>{tech?.name || "Sin asignar"}</div>
        </div>
      </div>

      {eq.noActivitiesInRange ? (
        <div className="eq-alert">
          <Icon name="warn" size="sm" /> Sin actividad en {days} días
        </div>
      ) : null}

      {canManage ? (
        <div className="eq-actions">
          <button type="button" className="tch-btn tch-btn-primary grow" onClick={stop(onNewRoute)}>
            <Icon name="plus" size="sm" /> Nueva ruta
          </button>
          <button type="button" className="tch-icon-btn" onClick={stop(onEdit)} title="Editar" aria-label={`Editar ${eq.name}`}>
            <Icon name="edit" size="sm" />
          </button>
          {canDelete ? (
            <button type="button" className="tch-icon-btn is-danger" onClick={stop(onDelete)} title="Eliminar" aria-label={`Eliminar ${eq.name}`}>
              <Icon name="trash" size="sm" />
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function RepeatedFailures({ items, canManage, navigate }) {
  if (!items.length) {
    return (
      <div className="tch-empty">
        <div className="tch-empty-icon"><Icon name="checkCircle" /></div>
        <h3>Sin fallas repetidas</h3>
        <p>Ningún equipo acumula condiciones MALA o CRÍTICA repetidas en el periodo.</p>
      </div>
    );
  }
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {items.map((it) => (
        <article key={it.equipment?.id} className="eq-rf">
          <div className="eq-rf-head">
            <div>
              <div className="eq-name">
                {it.equipment?.name} {it.equipment?.code ? <span className="tch-chip is-code" style={{ marginLeft: 6 }}>{it.equipment.code}</span> : null}
              </div>
              <div className="eq-loc">
                {it.equipment?.location ? (
                  <>
                    <Icon name="pin" size="sm" /> {it.equipment.location} ·{" "}
                  </>
                ) : null}
                {it.badCount} evento{it.badCount === 1 ? "" : "s"} malos · {it.criticalCount || 0} crítico{it.criticalCount === 1 ? "" : "s"}
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button type="button" className="tch-btn tch-btn-ghost" style={{ height: 34 }} onClick={() => navigate(`/equipments/${it.equipment?.id}`)}>
                Ver equipo
              </button>
              {canManage ? (
                <button type="button" className="tch-btn tch-btn-ghost" style={{ height: 34 }} onClick={() => navigate(`/equipments/${it.equipment?.id}/edit`)}>
                  Editar
                </button>
              ) : null}
            </div>
          </div>
          {(it.samples || []).length ? (
            <div className="eq-rf-samples">
              {it.samples.map((s) => (
                <div key={s.executionId} className="eq-rf-sample">
                  <strong>{s.condition === "CRITICO" ? "Crítico" : "Malo"}</strong>
                  <span>{new Date(s.executedAt).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}</span>
                  <span>{s.routeName}</span>
                  {s.notes ? <span>· {s.notes}</span> : null}
                </div>
              ))}
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}

function useEscape(onClose, disabled) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !disabled && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, disabled]);
}

function AreaModal({ initial, onClose, onSave }) {
  const [name, setName] = useState(initial.name || "");
  const [description, setDescription] = useState(initial.description || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEscape(onClose, saving);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setError("Escribe el nombre del área.");
    setSaving(true);
    setError("");
    try {
      await onSave({ id: initial.id, name: name.trim(), description: description.trim() || null });
    } catch (ex) {
      setError(ex?.message || "No se pudo guardar el área.");
      setSaving(false);
    }
  };

  return (
    <div className="tch-overlay" onMouseDown={(e) => e.target === e.currentTarget && !saving && onClose()}>
      <div className="tch-modal" style={{ maxWidth: 480 }} role="dialog" aria-modal="true" aria-labelledby="area-title">
        <div className="tch-modal-head">
          <div>
            <div className="tch-kicker">Equipos · área</div>
            <h2 id="area-title" className="tch-modal-title">{initial.id ? "Editar área" : "Nueva área"}</h2>
          </div>
          <button type="button" className="tch-icon-btn" onClick={onClose} aria-label="Cerrar" disabled={saving}>
            <Icon name="close" size="sm" />
          </button>
        </div>
        <form onSubmit={submit} noValidate>
          <div className="tch-form">
            <div className="tch-field">
              <label htmlFor="area-name">Nombre *</label>
              <input id="area-name" className="tch-input" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="Ej. Molienda" autoFocus />
            </div>
            <div className="tch-field">
              <label htmlFor="area-desc">Descripción <span>(opcional)</span></label>
              <input id="area-desc" className="tch-input" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={200} placeholder="Ej. Nave 2, línea de molinos" />
            </div>
            {error ? <div className="tch-error" role="alert">{error}</div> : null}
          </div>
          <div className="tch-modal-foot">
            <button type="button" className="tch-btn tch-btn-ghost" onClick={onClose} disabled={saving}>Cancelar</button>
            <button type="submit" className="tch-btn tch-btn-primary" disabled={saving}>{saving ? "Guardando…" : "Guardar área"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EquipmentModal({ areas, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY_EQ);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEscape(onClose, saving);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.location.trim()) return setError("Nombre y ubicación son obligatorios.");
    setSaving(true);
    setError("");
    try {
      await onSave({
        name: form.name.trim(),
        code: normalizeCode(form.code) || null,
        areaId: form.areaId ? Number(form.areaId) : null,
        location: form.location.trim(),
        criticality: form.criticality,
        status: form.status,
        brand: form.brand.trim() || null,
        model: form.model.trim() || null,
        description: form.description.trim() || null,
      });
    } catch (ex) {
      setError(ex?.message || "No se pudo crear el equipo.");
      setSaving(false);
    }
  };

  return (
    <div className="tch-overlay" onMouseDown={(e) => e.target === e.currentTarget && !saving && onClose()}>
      <div className="tch-modal" style={{ maxWidth: 640 }} role="dialog" aria-modal="true" aria-labelledby="eq-title">
        <div className="tch-modal-head">
          <div>
            <div className="tch-kicker">Equipos</div>
            <h2 id="eq-title" className="tch-modal-title">Nuevo equipo</h2>
          </div>
          <button type="button" className="tch-icon-btn" onClick={onClose} aria-label="Cerrar" disabled={saving}>
            <Icon name="close" size="sm" />
          </button>
        </div>
        <form onSubmit={submit} noValidate>
          <EquipmentFields form={form} set={set} areas={areas} />
          {error ? <div className="tch-error" role="alert" style={{ margin: "0 22px 16px" }}>{error}</div> : null}
          <div className="tch-modal-foot">
            <button type="button" className="tch-btn tch-btn-ghost" onClick={onClose} disabled={saving}>Cancelar</button>
            <button type="submit" className="tch-btn tch-btn-primary" disabled={saving}>{saving ? "Guardando…" : "Crear equipo"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
