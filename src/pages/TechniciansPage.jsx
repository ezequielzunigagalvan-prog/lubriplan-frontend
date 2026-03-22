// src/pages/TechniciansPage.jsx
import { useEffect, useMemo, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import TechnicianCard from "../components/ui/TechnicianCard";
import NewTechnicianModal from "../components/modals/NewTechnicianModal";
import {
  getTechnicians,
  createTechnician,
  updateTechnician,
  deleteTechnician,
} from "../services/techniciansService";

import { useAuth } from "../context/AuthContext";
import { Icon } from "../components/ui/lpIcons";
import { usePlant } from "../context/PlantContext";

export default function TechniciansPage() {
  const [technicians, setTechnicians] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTech, setEditingTech] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // ================= AUTH / PERMISSIONS =================
  const { user } = useAuth();
  const { currentPlantId, currentPlant } = usePlant();
  const role = String(user?.role || "TECHNICIAN").toUpperCase();

  const canEdit = role === "ADMIN" || role === "SUPERVISOR";
  const canDelete = role === "ADMIN"; // supervisor NO borra

  /* ================= HELPERS ================= */

  const toDate = (v) => {
    if (!v) return null;
    const d = v instanceof Date ? v : new Date(v);
    return Number.isFinite(d.getTime()) ? d : null;
  };

  const activityDateOf = (tech) => {
    return (
      toDate(tech?.lastActivityAt) ||
      toDate(tech?.lastExecutionAt) ||
      toDate(tech?.lastCompletedAt) ||
      toDate(tech?.lastCompletedExecutionAt) ||
      null
    );
  };

  /* ================= LOAD ================= */

  const loadTechnicians = async () => {
    try {
      setLoading(true);

      if (!currentPlantId) {
        setTechnicians([]);
        return;
      }

      const data = await getTechnicians();
      const items = Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data)
        ? data
        : [];

      setTechnicians(items);
    } catch (error) {
      console.error(error);
      setTechnicians([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentPlantId) {
      setTechnicians([]);
      setLoading(false);
      return;
    }

    loadTechnicians();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPlantId]);

  useEffect(() => {
    if (!currentPlantId) return;

    setSearch("");
    setEditingTech(null);
    setShowModal(false);
  }, [currentPlantId]);

  /* ================= CRUD ================= */

  const handleCreate = async (newTech) => {
    try {
      await createTechnician(newTech);
      await loadTechnicians();

      setShowModal(false);
      setEditingTech(null);
    } catch (e) {
      console.error(e);
      alert("Error creando técnico");
    }
  };

  const handleEdit = (tech) => {
    if (!canEdit) return;
    setEditingTech(tech);
    setShowModal(true);
  };

  const handleUpdate = async (updatedTech) => {
    try {
      await updateTechnician(updatedTech.id, updatedTech);
      await loadTechnicians();

      setEditingTech(null);
      setShowModal(false);
    } catch (e) {
      console.error(e);
      alert("Error actualizando técnico");
    }
  };

  const handleDelete = async (id) => {
    if (!canDelete) return;
    if (!confirm("¿Eliminar este técnico?")) return;

    try {
      await deleteTechnician(id);
      await loadTechnicians();
    } catch (error) {
      console.error(error);
      alert("Error eliminando técnico");
    }
  };

  /* ================= FILTRO ================= */

  const norm = (v) => String(v ?? "").toLowerCase().trim();

  const filtered = useMemo(() => {
    const q = norm(search);

    const base = (technicians || []).filter((t) => {
      if (!q) return true;

      return (
        norm(t?.name).includes(q) ||
        norm(t?.code).includes(q) ||
        norm(t?.specialty).includes(q) ||
        norm(t?.status).includes(q) ||
        norm(t?.email).includes(q)
      );
    });

    return base.sort((a, b) => {
      const aActive = String(a?.status || "").toUpperCase().trim() === "ACTIVO" ? 1 : 0;
      const bActive = String(b?.status || "").toUpperCase().trim() === "ACTIVO" ? 1 : 0;

      if (bActive !== aActive) return bActive - aActive;

      const aLast = activityDateOf(a)?.getTime?.() || 0;
      const bLast = activityDateOf(b)?.getTime?.() || 0;

      if (bLast !== aLast) return bLast - aLast;

      return String(a?.name || "").localeCompare(String(b?.name || ""));
    });
  }, [technicians, search]);

  /* ================= KPI ================= */

  const stats = useMemo(() => {
    const list = technicians || [];
    const total = list.length;

    const active = list.filter(
      (t) => String(t?.status || "").toUpperCase().trim() === "ACTIVO"
    ).length;

    const inactive = Math.max(0, total - active);

    const last =
      list
        .map((t) => activityDateOf(t))
        .filter(Boolean)
        .sort((a, b) => b.getTime() - a.getTime())[0] || null;

    return { total, active, inactive, last };
  }, [technicians]);

  const humanizeAgo = (date) => {
    if (!date) return "Sin actividad";

    const diff = Date.now() - date.getTime();
    if (!Number.isFinite(diff) || diff < 0) return "—";

    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "hace 0m";
    if (mins < 60) return `hace ${mins}m`;

    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `hace ${hrs}h`;

    const days = Math.floor(hrs / 24);
    if (days < 30) return `hace ${days}d`;

    const months = Math.floor(days / 30);
    if (months < 12) return `hace ${months} mes${months === 1 ? "" : "es"}`;

    const years = Math.floor(months / 12);
    return `hace ${years} año${years === 1 ? "" : "s"}`;
  };

  return (
    <MainLayout>
      <div style={pageShell}>
        {/* HEADER */}
        <div style={topBar}>
          <div>
            <h1 style={title}>Técnicos</h1>
            <div style={subtitle}>
              Gestión del personal de lubricación
              {currentPlant?.name ? ` · Planta: ${currentPlant.name}` : ""}
            </div>
          </div>

          <div style={topActions}>
            <div style={searchBox}>
              <span style={searchIcon}>
                <Icon name="search" />
              </span>
              <input
                placeholder="Buscar técnico..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={searchInput}
              />
            </div>

            {canEdit ? (
              <button
                style={btnPrimary}
                onClick={() => {
                  setEditingTech(null);
                  setShowModal(true);
                }}
                type="button"
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <Icon name="plus" />
                  Nuevo técnico
                </span>
              </button>
            ) : null}
          </div>
        </div>

        {/* KPI */}
        {!loading ? (
          <div style={summaryCard}>
            <div style={summaryMetrics4}>
              <KpiCard icon={<Icon name="users" />} value={stats.total} label="Técnicos" />
              <KpiCard icon={<Icon name="userCheck" />} value={stats.active} label="Activos" />
              <KpiCard icon={<Icon name="userX" />} value={stats.inactive} label="Inactivos" />
              <KpiCard
                icon={<Icon name="clock" />}
                value={humanizeAgo(stats.last)}
                label="Últ. actividad"
                small
              />
            </div>
          </div>
        ) : null}

        {/* GRID */}
        {!loading ? (
          filtered.length > 0 ? (
            <div style={grid}>
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
            <div style={emptyBox}>
              <div style={emptyTitle}>Sin técnicos</div>
              <div style={emptyText}>
                {search
                  ? "No encontramos técnicos con ese criterio de búsqueda."
                  : "Aún no hay técnicos registrados para esta planta."}
              </div>
            </div>
          )
        ) : (
          <div style={loadingBox}>Cargando técnicos…</div>
        )}
      </div>

      {/* MODAL */}
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

/* ================= KPI COMPONENT ================= */

function KpiCard({ icon, value, label, small }) {
  return (
    <div style={kpiCard}>
      <div style={kpiTopBarDark} />
      <div style={kpiInner}>
        <div style={kpiIconBox}>{icon}</div>
        <div style={kpiRight}>
          <div style={small ? kpiValueSmall : kpiValue}>{value}</div>
          <div style={kpiLabel}>{label}</div>
        </div>
      </div>
    </div>
  );
}

/* ================= ESTILOS ================= */

const pageShell = {
  padding: 16,
  background: "linear-gradient(180deg, #f6f7f9 0%, #eef2f7 100%)",
  borderRadius: 16,
  border: "1px solid #e5e7eb",
};

const topBar = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
  paddingBottom: 12,
  borderBottom: "1px solid #e5e7eb",
  gap: 12,
  flexWrap: "wrap",
};

const title = {
  margin: "6px 0 0",
  fontSize: 28,
  fontWeight: 950,
  color: "#0f172a",
};

const subtitle = {
  marginTop: 6,
  color: "#64748b",
  fontWeight: 800,
  fontSize: 12,
};

const topActions = {
  display: "flex",
  gap: 10,
  alignItems: "center",
  flexWrap: "wrap",
};

const btnPrimary = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  background: "#f97316",
  color: "#0b1220",
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid #fb923c",
  fontWeight: 950,
  cursor: "pointer",
  boxShadow: "0 10px 22px rgba(249,115,22,0.22)",
};

const searchBox = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  background: "rgba(255,255,255,0.70)",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: "10px 12px",
};

const searchIcon = { color: "#64748b", display: "inline-flex" };

const searchInput = {
  border: "none",
  outline: "none",
  background: "transparent",
  fontWeight: 800,
};

const summaryCard = { marginTop: 14 };

const summaryMetrics4 = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 12,
};

const kpiCard = {
  position: "relative",
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  padding: 12,
  boxShadow: "0 10px 18px rgba(2,6,23,0.06)",
  overflow: "hidden",
};

const kpiTopBarDark = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: 12,
  background: "#334155",
};

const kpiInner = {
  position: "relative",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  marginTop: 10,
};

const kpiIconBox = {
  width: 52,
  height: 52,
  borderRadius: 16,
  display: "grid",
  placeItems: "center",
  background: "linear-gradient(180deg, #fb923c 0%, #f97316 100%)",
  color: "#0f172a",
  border: "1px solid #fb923c",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35), 0 6px 14px rgba(249,115,22,0.35)",
};

const kpiRight = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  lineHeight: 1.05,
};

const kpiValue = {
  fontSize: 36,
  fontWeight: 1000,
  color: "#0f172a",
  lineHeight: 1,
  letterSpacing: -0.5,
};

const kpiValueSmall = {
  fontSize: 22,
  fontWeight: 1000,
  color: "#0f172a",
};

const kpiLabel = {
  fontSize: 11,
  fontWeight: 950,
  textTransform: "uppercase",
  color: "#334155",
  letterSpacing: 0.6,
};

const grid = {
  marginTop: 14,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
  gap: 12,
};

const emptyBox = {
  marginTop: 14,
  padding: 24,
  borderRadius: 16,
  background: "rgba(255,255,255,0.75)",
  border: "1px solid #e5e7eb",
  textAlign: "center",
};

const emptyTitle = {
  fontSize: 16,
  fontWeight: 900,
  color: "#0f172a",
};

const emptyText = {
  marginTop: 6,
  fontSize: 13,
  color: "#64748b",
  fontWeight: 800,
};

const loadingBox = {
  marginTop: 14,
  padding: 20,
  borderRadius: 16,
  background: "rgba(255,255,255,0.75)",
  border: "1px solid #e5e7eb",
  color: "#64748b",
  fontWeight: 900,
  textAlign: "center",
};