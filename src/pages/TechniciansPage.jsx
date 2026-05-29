// src/pages/TechniciansPage.jsx
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
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
import { useConfirm } from "../components/ui/ConfirmDialog";
import { CardSkeleton } from "../components/ui/CardSkeleton";

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

  const confirm = useConfirm();
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
      toast.error(e?.message || "Error creando técnico");
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
      toast.error(e?.message || "Error actualizando técnico");
    }
  };

  const handleDelete = async (id) => {
    if (!canDelete) return;
    const ok = await confirm("¿Eliminar este técnico? Esta acción no se puede deshacer.", {
      title: "Eliminar técnico",
      confirmLabel: "Eliminar",
      danger: true,
    });
    if (!ok) return;

    try {
      await deleteTechnician(id);
      await loadTechnicians();
      toast.success("Técnico eliminado");
    } catch (error) {
      toast.error(error?.message || "Error eliminando técnico");
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
      <div className="lp-fade-in" style={pageShell}>
        {/* HEADER */}
        <div style={topBar}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, fontWeight: 950, color: "#64748b", letterSpacing: 1.2 }}>
              <span style={{ width: 18, height: 2, background: "#f97316", borderRadius: 999, flexShrink: 0 }} />
              TÉCNICOS · PERSONAL
            </div>
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
              <KpiCard icon={<Icon name="users" />}     value={stats.total}          label="Técnicos"       accentColor="#0f172a" iconTone="navy"  />
              <KpiCard icon={<Icon name="userCheck" />} value={stats.active}         label="Activos"        accentColor="#22c55e" iconTone="green" />
              <KpiCard icon={<Icon name="userX" />}     value={stats.inactive}       label="Inactivos"      accentColor="#ef4444" iconTone="red"   />
              <KpiCard icon={<Icon name="clock" />}     value={humanizeAgo(stats.last)} label="Últ. actividad" accentColor="#64748b" iconTone="slate" small />
            </div>
          </div>
        ) : null}

        {/* GRID */}
        {loading ? (
          <CardSkeleton count={6} columns="repeat(auto-fill, minmax(280px, 1fr))" gap={12} />
        ) : filtered.length > 0 ? (
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
            <div style={emptyIconWrap}>
              <Icon name="users" style={{ width: 24, height: 24, color: "#94a3b8" }} />
            </div>
            <div style={emptyTitle}>
              {search ? "Sin resultados" : "Sin técnicos"}
            </div>
            <div style={emptyDesc}>
              {search
                ? `No encontramos técnicos con "${search}".`
                : "Aún no hay técnicos registrados para esta planta."}
            </div>
            {search ? (
              <button type="button" style={emptyAction} onClick={() => setSearch("")}>
                Limpiar búsqueda
              </button>
            ) : canEdit ? (
              <button type="button" style={emptyActionPrimary} onClick={() => setShowModal(true)}>
                + Agregar técnico
              </button>
            ) : null}
          </div>
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

const KPI_ICON_TONES = {
  navy:   { background: "rgba(15,23,42,0.06)",   border: "1px solid rgba(15,23,42,0.12)",    color: "#334155" },
  orange: { background: "rgba(249,115,22,0.10)",  border: "1px solid rgba(249,115,22,0.28)",  color: "#9a3412" },
  blue:   { background: "rgba(59,130,246,0.08)",  border: "1px solid rgba(59,130,246,0.22)",  color: "#1e40af" },
  green:  { background: "rgba(34,197,94,0.09)",   border: "1px solid rgba(34,197,94,0.22)",   color: "#166534" },
  red:    { background: "rgba(239,68,68,0.08)",   border: "1px solid rgba(239,68,68,0.22)",   color: "#991b1b" },
  amber:  { background: "rgba(245,158,11,0.10)",  border: "1px solid rgba(245,158,11,0.25)",  color: "#78350f" },
  slate:  { background: "rgba(100,116,139,0.08)", border: "1px solid rgba(100,116,139,0.20)", color: "#475569" },
};

function KpiCard({ icon, value, label, small, accentColor = "#0f172a", iconTone = "navy" }) {
  const tone = KPI_ICON_TONES[iconTone] || KPI_ICON_TONES.navy;
  return (
    <div style={{ ...kpiCard, borderTop: `4px solid ${accentColor}` }} className="lpKpiCard">
      <div style={kpiInner}>
        <div style={{ ...kpiIconBox, ...tone }}>{icon}</div>
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
  paddingTop: 6,
  display: "grid",
  gap: 14,
};

const topBar = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
  gap: 12,
  flexWrap: "wrap",
  padding: "14px 16px",
  borderRadius: 20,
  border: "1px solid rgba(226,232,240,0.95)",
  borderTop: "3px solid #0f172a",
  borderLeft: "3px solid rgba(249,115,22,0.55)",
  background: "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.94) 52%, rgba(255,247,237,0.60) 100%)",
  boxShadow: "0 18px 36px rgba(2,6,23,0.07)",
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
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: 12,
};

const kpiCard = {
  background: "linear-gradient(180deg, rgba(255,255,255,0.97) 0%, rgba(248,250,252,0.92) 100%)",
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 18,
  padding: 16,
  boxShadow: "0 10px 24px rgba(2,6,23,0.07)",
  minHeight: 80,
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
};

const kpiInner = {
  display: "flex",
  alignItems: "center",
  gap: 14,
};

const kpiIconBox = {
  width: 48,
  height: 48,
  borderRadius: 14,
  display: "grid",
  placeItems: "center",
  flexShrink: 0,
};

const kpiRight = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  flex: 1,
  lineHeight: 1.05,
};

const kpiValue = {
  fontSize: 38,
  fontWeight: 900,
  color: "#0f172a",
  lineHeight: 1,
  letterSpacing: -1,
};

const kpiValueSmall = {
  fontSize: 22,
  fontWeight: 900,
  color: "#0f172a",
  lineHeight: 1,
};

const kpiLabel = {
  marginTop: 5,
  fontSize: 11,
  fontWeight: 950,
  textTransform: "uppercase",
  color: "#64748b",
  letterSpacing: 0.7,
};

const grid = {
  marginTop: 14,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
  gap: 12,
};

const emptyBox = {
  marginTop: 14,
  padding: "40px 24px",
  borderRadius: 20,
  border: "1px solid rgba(226,232,240,0.95)",
  borderTop: "4px solid rgba(226,232,240,0.80)",
  background: "linear-gradient(180deg, rgba(255,255,255,0.97) 0%, rgba(248,250,252,0.92) 100%)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 10,
  textAlign: "center",
  boxShadow: "0 12px 28px rgba(2,6,23,0.05)",
};

const emptyIconWrap = {
  width: 52,
  height: 52,
  borderRadius: 16,
  background: "rgba(15,23,42,0.05)",
  border: "1px solid rgba(226,232,240,0.95)",
  display: "grid",
  placeItems: "center",
};

const emptyTitle = {
  fontSize: 16,
  fontWeight: 900,
  color: "#0f172a",
};

const emptyDesc = {
  fontSize: 13,
  color: "#64748b",
  fontWeight: 800,
  maxWidth: "34ch",
};

const emptyAction = {
  marginTop: 6,
  padding: "8px 16px",
  borderRadius: 12,
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.90)",
  fontWeight: 950,
  fontSize: 13,
  color: "#334155",
  cursor: "pointer",
};

const emptyActionPrimary = {
  marginTop: 6,
  padding: "9px 18px",
  borderRadius: 12,
  border: "1px solid rgba(249,115,22,0.45)",
  background: "#f97316",
  fontWeight: 950,
  fontSize: 13,
  color: "#0b1220",
  cursor: "pointer",
  boxShadow: "0 8px 18px rgba(249,115,22,0.22)",
};