// src/pages/TechniciansPage.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import MainLayout from "../layouts/MainLayout";
import TechnicianCard from "../components/ui/TechnicianCard";
import NewTechnicianModal from "../components/modals/NewTechnicianModal";
import { getTechnicians, createTechnician, updateTechnician, deleteTechnician } from "../services/techniciansService";
import { useAuth } from "../context/AuthContext";
import { Icon } from "../components/ui/lpIcons";
import { usePlant } from "../context/PlantContext";
import { useConfirm } from "../components/ui/ConfirmDialog";
import { CardSkeleton } from "../components/ui/CardSkeleton";
import "./TechniciansPage.css";

const isActiveTech = (t) => ["ACTIVO", "ACTIVE"].includes(String(t?.status || "").toUpperCase().trim());

const toDate = (v) => {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isFinite(d.getTime()) ? d : null;
};

const activityDateOf = (t) =>
  toDate(t?.lastActivityAt) || toDate(t?.lastExecutionAt) || toDate(t?.lastCompletedAt) || toDate(t?.lastCompletedExecutionAt);

const norm = (v) =>
  String(v ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();

const SORTS = {
  activity: "Actividad reciente",
  name: "Nombre",
  overdue: "Más vencidas",
  workload: "Más pendientes",
};

export default function TechniciansPage() {
  const [technicians, setTechnicians] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTech, setEditingTech] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("activity");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const { user } = useAuth();
  const { currentPlantId, currentPlant } = usePlant();
  const role = String(user?.role || "TECHNICIAN").toUpperCase();
  const confirm = useConfirm();
  const canEdit = role === "ADMIN" || role === "SUPERVISOR";
  const canDelete = role === "ADMIN"; // el supervisor no elimina

  /* ================= CARGA ================= */
  const loadTechnicians = useCallback(async () => {
    if (!currentPlantId) {
      setTechnicians([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setLoadError("");
      setTechnicians(await getTechnicians());
    } catch (error) {
      setTechnicians([]);
      setLoadError(error?.message || "No se pudieron cargar los técnicos.");
    } finally {
      setLoading(false);
    }
  }, [currentPlantId]);

  useEffect(() => {
    // Al cambiar de planta se limpia todo y se recarga.
    setSearch("");
    setStatusFilter("all");
    setEditingTech(null);
    setShowModal(false);
    loadTechnicians();
  }, [loadTechnicians]);

  /* ================= CRUD ================= */
  // Los errores se relanzan para que el formulario los muestre y no se cierre.
  const handleCreate = async (newTech) => {
    const created = await createTechnician(newTech);
    await loadTechnicians();
    setShowModal(false);
    setEditingTech(null);
    toast.success(`Técnico creado${created?.code ? ` · ${created.code}` : ""}`);
  };

  const handleUpdate = async (updatedTech) => {
    await updateTechnician(updatedTech.id, updatedTech);
    await loadTechnicians();
    setShowModal(false);
    setEditingTech(null);
    toast.success("Cambios guardados");
  };

  const handleEdit = (tech) => {
    if (!canEdit) return;
    setEditingTech(tech);
    setShowModal(true);
  };

  const handleDelete = async (tech) => {
    if (!canDelete || !tech) return;
    const s = tech.stats || {};
    const assigned = [
      s.routes ? `${s.routes} ruta${s.routes === 1 ? "" : "s"}` : null,
      s.pending ? `${s.pending} actividad${s.pending === 1 ? "" : "es"} pendiente${s.pending === 1 ? "" : "s"}` : null,
    ].filter(Boolean);

    const message = assigned.length
      ? `${tech.name} tiene ${assigned.join(" y ")}. Quedarán sin técnico asignado para que las reasignes. Su historial de actividades completadas se conserva.`
      : `Se eliminará a ${tech.name}. Su historial de actividades completadas se conserva.`;

    const ok = await confirm(message, {
      title: "Eliminar técnico",
      confirmLabel: "Eliminar",
      danger: true,
    });
    if (!ok) return;

    try {
      const res = await deleteTechnician(tech.id);
      await loadTechnicians();
      const r = res?.released || {};
      const freed = (r.routes || 0) + (r.activities || 0) + (r.orders || 0);
      toast.success(freed ? `Técnico eliminado · ${freed} asignación${freed === 1 ? "" : "es"} liberada${freed === 1 ? "" : "s"}` : "Técnico eliminado");
    } catch (error) {
      toast.error(error?.message || "Error eliminando técnico");
    }
  };

  /* ================= FILTRO Y ORDEN ================= */
  const counts = useMemo(() => {
    const active = technicians.filter(isActiveTech).length;
    return { all: technicians.length, active, inactive: technicians.length - active };
  }, [technicians]);

  const filtered = useMemo(() => {
    const q = norm(search);
    const list = technicians.filter((t) => {
      if (statusFilter === "active" && !isActiveTech(t)) return false;
      if (statusFilter === "inactive" && isActiveTech(t)) return false;
      if (!q) return true;
      return [t.name, t.code, t.specialty, t.email, t.phone].some((v) => norm(v).includes(q));
    });

    const byName = (a, b) => String(a?.name || "").localeCompare(String(b?.name || ""), "es");
    const time = (t) => activityDateOf(t)?.getTime() || 0;

    return [...list].sort((a, b) => {
      if (sortBy === "name") return byName(a, b);
      if (sortBy === "overdue") return (b.stats?.overdue || 0) - (a.stats?.overdue || 0) || byName(a, b);
      if (sortBy === "workload") return (b.stats?.pending || 0) - (a.stats?.pending || 0) || byName(a, b);
      // Actividad reciente: activos primero.
      return Number(isActiveTech(b)) - Number(isActiveTech(a)) || time(b) - time(a) || byName(a, b);
    });
  }, [technicians, search, statusFilter, sortBy]);

  const team = useMemo(() => {
    const sum = (k) => technicians.reduce((acc, t) => acc + (Number(t?.stats?.[k]) || 0), 0);
    return { pending: sum("pending"), overdue: sum("overdue"), completed30d: sum("completed30d") };
  }, [technicians]);

  const openCreate = () => {
    setEditingTech(null);
    setShowModal(true);
  };

  return (
    <MainLayout>
      <div className="tch lp-fade-in">
        {/* Encabezado */}
        <header className="tch-head">
          <div>
            <div className="tch-kicker">Personal{currentPlant?.name ? ` · ${currentPlant.name}` : ""}</div>
            <h1 className="tch-title">Técnicos</h1>
            <div className="tch-sub">Personal de lubricación, su carga de trabajo y su actividad reciente.</div>
          </div>
          <div className="tch-head-actions">
            <label className="tch-search">
              <Icon name="search" size="sm" />
              <input
                placeholder="Buscar por nombre, código, especialidad…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Buscar técnico"
              />
              {search ? (
                <button type="button" className="tch-icon-btn" style={{ width: 26, height: 26, border: 0 }} onClick={() => setSearch("")} aria-label="Limpiar búsqueda">
                  <Icon name="close" size="sm" />
                </button>
              ) : null}
            </label>
            {canEdit ? (
              <button type="button" className="tch-btn tch-btn-primary" onClick={openCreate}>
                <Icon name="plus" size="sm" /> Nuevo técnico
              </button>
            ) : null}
          </div>
        </header>

        {/* Indicadores */}
        {!loading && !loadError ? (
          <section className="tch-kpis" aria-label="Resumen del equipo">
            <Kpi icon="userCheck" tone="is-green" value={counts.active} total={counts.all} label="Técnicos activos" />
            <Kpi icon="clock" value={team.pending} label="Pendientes asignadas" />
            <Kpi icon="alert" tone={team.overdue ? "is-red" : ""} value={team.overdue} label="Vencidas" />
            <Kpi icon="checkCircle" tone="is-orange" value={team.completed30d} label="Hechas en 30 días" />
          </section>
        ) : null}

        {/* Filtros */}
        {!loading && !loadError && technicians.length ? (
          <div className="tch-toolbar">
            <div className="tch-tabs" role="group" aria-label="Filtrar por estado">
              {[
                ["all", "Todos", counts.all],
                ["active", "Activos", counts.active],
                ["inactive", "Inactivos", counts.inactive],
              ].map(([key, label, n]) => (
                <button key={key} type="button" className="tch-tab" aria-pressed={statusFilter === key} onClick={() => setStatusFilter(key)}>
                  {label} <span className="tch-tab-count">{n}</span>
                </button>
              ))}
            </div>
            <label className="tch-sort">
              Ordenar por
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                {Object.entries(SORTS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </label>
          </div>
        ) : null}

        {/* Lista */}
        {loading ? (
          <CardSkeleton count={6} columns="repeat(auto-fill, minmax(300px, 1fr))" gap={14} />
        ) : loadError ? (
          <div className="tch-empty" role="alert">
            <div className="tch-empty-icon"><Icon name="alert" /></div>
            <h3>No se pudieron cargar los técnicos</h3>
            <p>{loadError}</p>
            <button type="button" className="tch-btn tch-btn-ghost" onClick={loadTechnicians}>
              <Icon name="refresh" size="sm" /> Reintentar
            </button>
          </div>
        ) : filtered.length ? (
          <div className="tch-grid">
            {filtered.map((t) => (
              <TechnicianCard
                key={t.id}
                technician={t}
                onEdit={canEdit ? handleEdit : undefined}
                onDelete={canDelete ? handleDelete : undefined}
                canDelete={canDelete}
              />
            ))}
          </div>
        ) : (
          <div className="tch-empty">
            <div className="tch-empty-icon"><Icon name="users" /></div>
            <h3>{technicians.length ? "Sin resultados" : "Sin técnicos"}</h3>
            <p>
              {technicians.length
                ? "Ningún técnico coincide con la búsqueda o el filtro."
                : "Aún no hay técnicos registrados en esta planta."}
            </p>
            {technicians.length ? (
              <button
                type="button"
                className="tch-btn tch-btn-ghost"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                }}
              >
                Limpiar filtros
              </button>
            ) : canEdit ? (
              <button type="button" className="tch-btn tch-btn-primary" onClick={openCreate}>
                <Icon name="plus" size="sm" /> Agregar técnico
              </button>
            ) : null}
          </div>
        )}
      </div>

      {showModal && canEdit ? (
        <NewTechnicianModal
          technician={editingTech}
          onClose={() => {
            setShowModal(false);
            setEditingTech(null);
          }}
          onSave={editingTech ? handleUpdate : handleCreate}
        />
      ) : null}
    </MainLayout>
  );
}

function Kpi({ icon, tone = "", value, total, label }) {
  return (
    <div className="tch-kpi">
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
