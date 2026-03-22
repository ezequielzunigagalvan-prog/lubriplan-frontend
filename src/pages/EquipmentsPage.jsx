// src/pages/EquipmentsPage.jsx
import { useEffect, useMemo, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import {
  getEquipment,
  deleteEquipment,
  createEquipment,
  getRepeatedFailures,
} from "../services/equipmentService";
import {
  getEquipmentAreas,
  createEquipmentArea,
  updateEquipmentArea,
  deleteEquipmentArea,
} from "../services/equipmentAreasService";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Settings,
  Eye,
  UserCog,
  Pencil,
  Trash2,
  Route,
  MapPin,
  AlertTriangle,
} from "lucide-react";
import { Power } from "lucide-react";
import { Lock } from "lucide-react";
import Toast from "../components/ui/Toast";
import { useToast } from "../components/ui/useToast";
import { usePlant } from "../context/PlantContext";
import NewRouteModal from "../components/routes/NewRouteModal";

export default function EquipmentsPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // ================= DATA =================
  const [areas, setAreas] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [repeatedFailures, setRepeatedFailures] = useState([]);
 const [showNewRouteModal, setShowNewRouteModal] = useState(false);
const [prefillRouteEquipment, setPrefillRouteEquipment] = useState(null);

  // ================= AUTH / PERMISSIONS =================
  const { user } = useAuth();
  const { currentPlantId, currentPlant } = usePlant();
  const role = String(user?.role || "TECHNICIAN").toUpperCase();

const canManage = role === "ADMIN" || role === "SUPERVISOR"; // editar/asignar/crear ruta/crear equipo/crear área
const canDelete = role === "ADMIN";                          // SOLO ADMIN borra

  // ================= SEARCH =================
  const [search, setSearch] = useState("");
  const norm = (v) => String(v ?? "").toLowerCase().trim();

  // ✅ filtro local por área (no afecta URL)
  const [areaFilter, setAreaFilter] = useState(""); // "" = todas, "_no_area" = sin área, "id" = área

  // ================= FILTER (from URL) =================
  const query = useMemo(() => {
    const p = new URLSearchParams(location.search || "");
    return {
      filter: String(p.get("filter") || ""),
      days: Number(p.get("days") || 30),
      month: String(p.get("month") || ""),
      lookbackDays: Number(p.get("lookbackDays") || 90),
      minEvents: Number(p.get("minEvents") || 2),
    };
  }, [location.search]);

  const isRepeatedFailures = query.filter === "repeated-failures";

  const monthParam =
    /^\d{4}-\d{2}$/.test(query.month)
      ? query.month
      : new Date().toISOString().slice(0, 7);

  const onlyWithoutRoutes = query.filter === "without-routes";
  const isNoActivitiesFilter = query.filter === "no-activities";

  // sanitiza days
  const daysParam = Number.isFinite(query.days)
    ? Math.min(Math.max(query.days, 1), 3650)
    : 30;

  // ================= PAGINATION ("Ver más") =================
  const INITIAL_VISIBLE = 12;
  const [visibleByArea, setVisibleByArea] = useState({}); // { [areaId]: number, _no_area: number }
const { toast, showToast, hideToast } = useToast();
  // 🔥 para resaltar renglón activo en forms
const [activeField, setActiveField] = useState("");


  // ================= AREA ORDER (DnD) =================
  const AREA_ORDER_KEY = `lubriplan_area_order_v1:${currentPlantId || "default"}`;


  const areaSortKey = `LP_AREA_SORT:${currentPlantId || "default"}`;

const [areaSort, setAreaSort] = useState("NAME_ASC");

useEffect(() => {
  if (!currentPlantId) return;
  setAreaSort(localStorage.getItem(`LP_AREA_SORT:${currentPlantId}`) || "NAME_ASC");
}, [currentPlantId]);

useEffect(() => {
  if (!currentPlantId) return;
  localStorage.setItem(`LP_AREA_SORT:${currentPlantId}`, areaSort);
}, [areaSort, currentPlantId]);

  // ================= MODALS =================
  const [showAreaModal, setShowAreaModal] = useState(false);
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);

  // ================= AREA FORM =================
  const [editingArea, setEditingArea] = useState(null);
  const [areaName, setAreaName] = useState("");
  const [areaDesc, setAreaDesc] = useState("");
  const [areaSaving, setAreaSaving] = useState(false);

  // ================= EQUIPMENT FORM =================
  const [eqSaving, setEqSaving] = useState(false);
  const [eqForm, setEqForm] = useState({
    name: "",
    criticality: "MEDIA",
    status: "ACTIVO",
    areaId: "",
    location: "",
    code: "",
    brand: "",
    model: "",
    description: "",
  });

  const normalizeCode = (v) =>
    String(v || "")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "-");

  // ✅ loadAll ahora recibe days y filter explícitos (evita bug de scope con query)
  async function loadAll(days = 30, filter = "") {
    try {
      setLoading(true);

      // ♻️ REINCIDENCIA (modo especial)
      if (filter === "repeated-failures") {
        const data = await getRepeatedFailures({
          month: monthParam,
          lookbackDays: query.lookbackDays,
          minEvents: query.minEvents,
        });

        setRepeatedFailures(Array.isArray(data?.items) ? data.items : []);
        setAreas([]);
        setEquipments([]);
        return;
      }

      // =========================
      // 🧩 MODO NORMAL
      // =========================
      const [areasRes, eqRes] = await Promise.all([
        getEquipmentAreas(),
        getEquipment({ filter: filter || "", days }),
      ]);

      const areasList = Array.isArray(areasRes?.result)
        ? areasRes.result
        : Array.isArray(areasRes)
        ? areasRes
        : [];

      const eqList = Array.isArray(eqRes) ? eqRes : [];

      setAreas(areasList);
      setEquipments(eqList);
      setRepeatedFailures([]);

      // init visibles
      setVisibleByArea((prev) => {
        const next = { ...prev };
        for (const a of areasList)
          if (next[a.id] == null) next[a.id] = INITIAL_VISIBLE;
        if (next._no_area == null) next._no_area = INITIAL_VISIBLE;
        return next;
      });

      
    } catch (e) {
      console.error(e);
      alert(e?.message || "Error cargando datos");
    } finally {
      setLoading(false);
    }
  }

 useEffect(() => {
  if (!currentPlantId) return;

  setSearch("");
  setAreaFilter("");
  setVisibleByArea({});
  setRepeatedFailures([]);
  setAreas([]);
  setEquipments([]);

  loadAll(daysParam, query.filter);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [daysParam, query.filter, query.month, currentPlantId]);

  // ✅ ordenar áreas con el orden persistido
  const orderedAreas = useMemo(() => {
  const list = Array.isArray(areas) ? [...areas] : [];
  const collator = new Intl.Collator("es", { numeric: true, sensitivity: "base" });

  if (areaSort === "NAME_DESC") {
    return list.sort((a, b) => collator.compare(String(b?.name || ""), String(a?.name || "")));
  }

  // NAME_ASC (default)
  return list.sort((a, b) => collator.compare(String(a?.name || ""), String(b?.name || "")));
}, [areas, areaSort]);


  // ✅ búsqueda por código/tag o NOMBRE del equipo + filtro por área
  const filteredEquipments = useMemo(() => {
    let list = equipments || [];

    // ✅ 1) filtro: EQUIPOS SIN RUTAS
    if (onlyWithoutRoutes) {
      list = list.filter((eq) => {
  const routesCount =
    Number(eq?.routesCount ?? eq?._count?.routes ?? 0) ||
    (Array.isArray(eq?.routes) ? eq.routes.length : 0);

        return routesCount === 0;
      });
    }

    // ✅ 2) filtro: equipos con rutas pero SIN actividades en el rango
    if (isNoActivitiesFilter) {
      list = list.filter((eq) => {
        const routesCount =
          Number(eq?.routesCount ?? eq?._count?.routes ?? 0) ||
          (Array.isArray(eq?.routes) ? eq.routes.length : 0);

        if (!routesCount) return false;
        return Boolean(eq?.noActivitiesInRange);
      });
    }

    // ✅ 3) filtro local por área
    if (areaFilter) {
      if (areaFilter === "_no_area") {
        list = list.filter((eq) => (eq?.areaId ?? eq?.area?.id) == null);
      } else {
        const aId = Number(areaFilter);
        list = list.filter((eq) => Number(eq?.areaId ?? eq?.area?.id) === aId);
      }
    }

    // ✅ búsqueda por código/tag o nombre
    const q = norm(search);
    if (!q) return list;

    return list.filter((eq) => {
      const code = norm(eq?.code);
      const name = norm(eq?.name);
      return code.includes(q) || name.includes(q);
    });
  }, [equipments, search, onlyWithoutRoutes, isNoActivitiesFilter, areaFilter]);

  // ✅ KPIs (equipos/áreas/activos/inactivos/críticos/mostrando)
  const stats = useMemo(() => {
    const allEq = equipments || [];
    const allAreas = areas || [];

    const isActiveStatus = (s) => {
      const v = String(s || "").toUpperCase().trim();
      return v === "ACTIVO" || v === "ACTIVE";
    };

    const active = allEq.filter((e) => isActiveStatus(e?.status)).length;
    const inactive = Math.max(0, allEq.length - active);

    const critical = allEq.filter((e) => {
      const v = String(e?.criticality || "").toUpperCase();
      return v === "CRITICA" || v === "CRÍTICA";
    }).length;

    return {
      totalEquipments: allEq.length,
      totalAreas: allAreas.length,
      active,
      inactive,
      critical,
      showing: (filteredEquipments || []).length,
    };
  }, [equipments, areas, filteredEquipments]);

  // ✅ mapa: areaId -> equipos (ya filtrados)
  const equipmentsByAreaId = useMemo(() => {
    const map = new Map();
    for (const a of areas) map.set(a.id, []);

    for (const eq of filteredEquipments || []) {
      const areaId = eq?.areaId ?? eq?.area?.id ?? null;
      if (areaId != null) {
        if (!map.has(areaId)) map.set(areaId, []);
        map.get(areaId).push(eq);
      }
    }

    for (const [, list] of map.entries()) {
      list.sort((a, b) =>
        String(a?.name ?? "").localeCompare(String(b?.name ?? ""))
      );
    }

    return map;
  }, [areas, filteredEquipments]);

  const equipmentsWithoutArea = useMemo(() => {
    return (filteredEquipments || [])
      .filter((e) => (e?.areaId ?? e?.area?.id) == null)
      .sort((a, b) =>
        String(a?.name ?? "").localeCompare(String(b?.name ?? ""))
      );
  }, [filteredEquipments]);

  // ================= EQUIPOS =================
  const onDeleteEquipment = async (id) => {
  if (!canDelete) return;
  if (!confirm("¿Seguro que deseas borrar este equipo?")) return;

  try {
   await deleteEquipment(id);

showToast({
  type: "success",
  title: "Equipo eliminado",
  message: "Se removió correctamente.",
});

await loadAll(daysParam, query.filter);
  } catch (e) {
    console.error(e);
   showToast(
  { type: "error", title: "No se pudo eliminar", message: e?.message || "Intenta de nuevo." },
  3000
);
  }
};

  const submitEquipment = async (e) => {
  e.preventDefault();
  if (!canManage) return;

  const payload = {
    name: String(eqForm.name || "").trim(),
    location: String(eqForm.location || "").trim(),
    status: String(eqForm.status || "ACTIVO").toUpperCase(),
    criticality: String(eqForm.criticality || "MEDIA").toUpperCase(),
    areaId: eqForm.areaId ? Number(eqForm.areaId) : null,
    code: normalizeCode(eqForm.code) || null,
    brand: String(eqForm.brand || "").trim() || null,
    model: String(eqForm.model || "").trim() || null,
    description: String(eqForm.description || "").trim() || null,
  };

  console.log("🟧 submitEquipment CLICK", { payload });

  if (!payload.name || !payload.location || !payload.status) {
    alert("Nombre, ubicación y estado son obligatorios");
    return;
  }

  try {
    setEqSaving(true);
    console.log("🟨 calling createEquipment()...");
    const out = await createEquipment(payload);

showToast({
  type: "success",
  title: "Equipo creado",
  message: "Se guardó correctamente.",
});

setShowEquipmentModal(false);

    // reset form
    setEqForm({
      name: "",
      criticality: "MEDIA",
      status: "ACTIVO",
      areaId: "",
      location: "",
      code: "",
      brand: "",
      model: "",
      description: "",
    });

    await loadAll(daysParam, query.filter);
  } catch (err) {
    console.error("🟥 createEquipment FAIL:", err);
    showToast(
  { type: "error", title: "No se pudo crear", message: err?.message || "Intenta de nuevo." },
  3000
);
  } finally {
    console.log("🟦 submitEquipment FINALLY");
    setEqSaving(false);
  }
};

  // ================= ÁREAS =================
  const openCreateArea = () => {
    if (!canManage) return;
    setEditingArea(null);
    setAreaName("");
    setAreaDesc("");
    setShowAreaModal(true);
  };

  const openEditArea = (area) => {
    if (!canManage) return;
    setEditingArea(area);
    setAreaName(String(area?.name || ""));
    setAreaDesc(String(area?.description || ""));
    setShowAreaModal(true);
  };

  const submitArea = async (e) => {
    if (!canManage) return;
    e.preventDefault();

    const name = String(areaName || "").trim();
    const description = String(areaDesc || "").trim() || null;

    if (!name) return alert("El nombre del área es obligatorio");

    try {
      setAreaSaving(true);

      if (editingArea?.id) {
        await updateEquipmentArea(editingArea.id, { name, description });
      } else {
        await createEquipmentArea({ name, description });
      }

      showToast({
  type: "success",
  title: editingArea?.id ? "Área actualizada" : "Área creada",
  message: "Cambios guardados correctamente.",
});

      setShowAreaModal(false);
      setEditingArea(null);
      setAreaName("");
      setAreaDesc("");
      await loadAll(daysParam, query.filter);
    } catch (err) {
      console.error(err);
      showToast(
  { type: "error", title: "No se pudo guardar", message: err?.message || "Intenta de nuevo." },
  3000
);
    } finally {
      setAreaSaving(false);
    }
  };

  const onDeleteArea = async (area) => {
  if (!canDelete) return;
  if (!confirm(`¿Borrar el área "${area?.name}"?`)) return;

  try {
    await deleteEquipmentArea(area.id);
    showToast({
  type: "success",
  title: "Área eliminada",
  message: "Se removió correctamente.",
});
    await loadAll(daysParam, query.filter);
  } catch (err) {
    console.error(err);
    showToast(
  { type: "error", title: "No se pudo eliminar", message: err?.message || "Intenta de nuevo." },
  3000
);
  }
};

  if (loading) {
   return (
  <MainLayout>
    <div style={pageShell}>
          <div style={panel}>
            <p style={{ margin: 0, fontWeight: 900, color: "#0f172a" }}>
              Cargando…
            </p>
          </div>
        </div>
        {/* ✅ Toast global de confirmación */}
<Toast toast={toast} onClose={hideToast} />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
  <div style={pageShell}>
    {/* TOP BAR (solo título/subtítulo + chips de filtro) */}
    <div style={topBar}>
{/* HEADER */}
<div style={headerRow}>
  <div style={headerLeft}>
    <h1 style={title}>Equipos</h1>
    <div style={subtitle}>
  Gestiona tus equipos de planta por áreas
  {currentPlant?.name ? ` · Planta: ${currentPlant.name}` : ""}
</div>
  </div>

  {canManage && (
    <div style={headerRight}>
      <button onClick={openCreateArea} style={btnGhost}>
  <MapPin size={16} strokeWidth={1.8} style={{ marginRight: 8 }} />
  Nueva área
</button>

      <button onClick={() => setShowEquipmentModal(true)} style={btnPrimary}>
  <Settings size={18} strokeWidth={1.9} />
  Nuevo equipo
</button>
    </div>
  )}
</div>

      <div>

        {onlyWithoutRoutes || isNoActivitiesFilter || areaFilter ? (
          <div
            style={{
              marginTop: 8,
              fontSize: 12,
              fontWeight: 900,
              color: "#b45309",
            }}
          >
            🧩 Filtro activo:{" "}
            <b>
              {onlyWithoutRoutes
                ? "Equipos sin rutas"
                : isNoActivitiesFilter
                ? "Equipos sin actividades"
                : "Área"}
            </b>

            {isNoActivitiesFilter ? (
              <>
                {" "}
                · Últimos <b>{daysParam}</b> días (solo equipos con rutas)
              </>
            ) : null}

            {areaFilter ? (
              <span style={{ marginLeft: 10, fontWeight: 900, color: "#334155" }}>
                · Área:{" "}
                <b>
                  {areaFilter === "_no_area"
                    ? "Sin área"
                    : areas.find((a) => String(a.id) === String(areaFilter))?.name || "—"}
                </b>
              </span>
            ) : null}

            <button
              type="button"
              onClick={() => {
                setAreaFilter("");
                navigate("/equipments");
              }}
              style={{ marginLeft: 10, ...btnGhost, padding: "6px 10px" }}
            >
              Quitar filtro
            </button>
          </div>
        ) : null}
      </div>
    </div>

    {/* KPI / RESUMEN (FULL WIDTH, fuera del topBar) */}
{!isRepeatedFailures ? (
  <div style={summaryCard}>
    <div style={summaryMetrics4}>
      {/* EQUIPOS */}
      <div style={{ ...kpiCard, ...kpiEquip }}>
        <div style={kpiAccent} />
        <div style={kpiInner}>
          <div style={kpiIconBox}>
            <Settings size={18} strokeWidth={1.8} />
          </div>
          <div style={kpiRight}>
            <div style={kpiValue}>{stats.totalEquipments}</div>
            <div style={kpiLabel}>Equipos</div>
          </div>
        </div>
      </div>

      {/* ÁREAS */}
      <div style={{ ...kpiCard, ...kpiAreas }}>
        <div style={kpiAccent} />
        <div style={kpiInner}>
          <div style={kpiIconBox}>
            <MapPin size={18} strokeWidth={1.8} />
          </div>
          <div style={kpiRight}>
            <div style={kpiValue}>{stats.totalAreas}</div>
            <div style={kpiLabel}>Áreas</div>
          </div>
        </div>
      </div>

      {/* CRÍTICOS */}
      <div style={{ ...kpiCard, ...kpiCritical }}>
        <div style={kpiAccent} />
        <div style={kpiInner}>
          <div style={kpiIconBox}>
            <AlertTriangle size={18} strokeWidth={1.8} />
          </div>
          <div style={kpiRight}>
            <div style={kpiValue}>{stats.critical}</div>
            <div style={kpiLabel}>Críticos</div>
          </div>
        </div>
      </div>

      {/* INACTIVOS */}
      <div style={{ ...kpiCard, ...kpiInactive }}>
        <div style={kpiAccent} />
        <div style={kpiInner}>
          <div style={kpiIconBox}>
            <Power size={18} strokeWidth={1.8} />
          </div>
          <div style={kpiRight}>
            <div style={kpiValue}>{stats.inactive}</div>
            <div style={kpiLabel}>Inactivos</div>
          </div>
        </div>
      </div>
    </div>
  </div>
) : null}

    {/* CONTROLES (búsqueda + filtro área + botones) */}
    <div style={controlsRow}>
      {/* SEARCH */}
      <div style={searchBox}>
        <span style={searchIcon}>⌕</span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por código/tag o nombre del equipo…"
          style={searchInput}
        />
        {search ? (
          <button
            type="button"
            onClick={() => setSearch("")}
            style={clearBtn}
            title="Limpiar"
          >
            ✕
          </button>
        ) : null}
      </div>

      {/* ✅ FILTRO POR ÁREA */}
      {!isRepeatedFailures ? (
        <div style={filterRow}>
          <label style={filterLabel}>Área</label>
          <select
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
            style={filterSelect}
          >
            <option value="">Todas</option>
            {orderedAreas.map((a) => (
              <option key={a.id} value={String(a.id)}>
                {a.name}
              </option>
            ))}
            <option value="_no_area">Sin área</option>
          </select>
        </div>
      ) : null}

     {/* BOTONES */}
<div style={actionsRow}>
  {!canManage ? (
    <div style={readOnlyPill} title="Perfil Técnico: solo visualización">
      <Lock size={14} strokeWidth={2} />
      Solo visualización
    </div>
  ) : (
    <>
      <div style={{ ...filterRow, minWidth: 200 }}>
  <label style={filterLabel}>Orden</label>
  <select
    value={areaSort}
    onChange={(e) => setAreaSort(e.target.value)}
    style={filterSelect}
  >
    <option value="NAME_ASC">Áreas (A→Z)</option>
    <option value="NAME_DESC">Áreas (Z→A)</option>
  </select>
</div>
    </>
  )}
</div>
</div>
       
        {/* CONTENIDO */}
        {isRepeatedFailures ? (
          <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
            <div style={panel}>
              <div style={{ fontWeight: 950 }}>♻️ Reincidencia (predictiva)</div>
              <div
                style={{
                  fontSize: 12,
                  color: "#64748b",
                  fontWeight: 800,
                  marginTop: 6,
                }}
              >
                Últimos {query.lookbackDays} días · Mínimo eventos: {query.minEvents}
                · Mes: {monthParam}
              </div>

              <button
                onClick={() => navigate("/equipments")}
                style={{ ...btnGhost, marginTop: 10 }}
              >
                Quitar filtro
              </button>
            </div>

            {repeatedFailures.length === 0 ? (
              <div style={emptyBox}>No hay reincidencias con estos criterios.</div>
            ) : (
              repeatedFailures.map((it) => (
                <div key={it.equipment.id} style={areaSection}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 950 }}>
                        {it.equipment.name}{" "}
                        {it.equipment.code ? `· ${it.equipment.code}` : ""}
                      </div>

                      <div
                        style={{
                          fontSize: 12,
                          color: "#64748b",
                          fontWeight: 800,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <MapPin size={14} strokeWidth={1.8} />
                        <span>{it.equipment.location}</span>
                        <span>· Criticidad:</span>
                        <span style={{ fontWeight: 900 }}>
                          {it.equipment.criticality}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={chipCrit("CRITICA")}>Eventos: {it.badCount}</span>

                      {canManage ? (
                        <button
                          style={btnPrimary}
                          onClick={() => navigate(`/equipments/${it.equipment.id}/edit`)}
                        >
                          Editar equipo
                        </button>
                      ) : (
                        <button
                          style={btnPrimary}
                          onClick={() => navigate(`/equipments/${it.equipment.id}`)}
                        >
                          Ver equipo
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                    {(it.samples || []).map((s) => (
                      <div key={s.executionId} style={panel}>
                        <b>{s.condition}</b> · {String(s.executedAt).slice(0, 10)} ·{" "}
                        {s.routeName}
                        {s.notes ? <div style={{ marginTop: 4 }}>{s.notes}</div> : null}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div style={listGrid}>
            {orderedAreas.map((area) => {
              const list = equipmentsByAreaId.get(area.id) || [];

              const visible = visibleByArea[area.id] ?? INITIAL_VISIBLE;
              const sliced = list.slice(0, visible);
              const hasMore = list.length > visible;

             // ✅ marca el área cuando está en edición (modal abierto)
const isEditingThisArea = Boolean(showAreaModal && editingArea?.id === area.id);

return (
 <section
  key={area.id}
  style={{
    ...areaSection,
    ...(isEditingThisArea
      ? {
          outline: "2px solid rgba(249,115,22,0.45)",
          boxShadow: "0 0 0 4px rgba(249,115,22,0.12)",
        }
      : null),
  }}
>
  {/* 🔥 HEADER OSCURO ESTILO RUTAS */}
  <div style={areaTopBar}>
    <div style={areaTopIcon}>
      <MapPin size={18} strokeWidth={1.9} />
    </div>

    <div style={{ minWidth: 0 }}>
      <div style={areaTopTitle}>
        {String(area?.name || "—").toUpperCase()}
      </div>

      <div style={areaTopSub}>
        <b>{list.length}</b> equipo(s)
        {" · "}
        {String(area?.description || "").trim()
          ? area.description
          : "Sin descripción"}
      </div>
    </div>

    <div style={areaTopActions} onClick={(e) => e.stopPropagation()}>
      {canManage && (
        <>
          <button
            type="button"
            style={iconSquareBtnTop}
            title="Editar área"
            onClick={() => openEditArea(area)}
          >
            <Pencil size={16} />
          </button>

          {canDelete && (
            <button
              type="button"
              style={iconSquareBtnDangerTop}
              title="Borrar área"
              onClick={() => onDeleteArea(area)}
            >
              <Trash2 size={16} />
            </button>
          )}
        </>
      )}
    </div>
  </div>

  {/* 🔥 CONTENIDO INTERNO */}
  <div style={areaBodyPad}>
    {list.length === 0 ? (
      <div style={emptyBox}>Sin equipos en esta área</div>
    ) : (
      <>
        <div style={eqGrid}>
          {sliced.map((eq) => (
            <EquipmentCard
              key={eq.id}
              eq={eq}
              readOnly={!canManage}
              onOpen={() => navigate(`/equipments/${eq.id}`)}
              onEdit={canManage ? () => navigate(`/equipments/${eq.id}/edit`) : undefined}
              onAssign={canManage ? () => navigate(`/equipments/${eq.id}/edit#assign`) : undefined}
              onDelete={canDelete ? () => onDeleteEquipment(eq.id) : undefined}
             onNewRoute={
  canManage
    ? () => {
        setPrefillRouteEquipment(eq);
        setShowNewRouteModal(true);
      }
    : undefined
}
            />
          ))}
        </div>

        {hasMore && (
          <div style={{ marginTop: 10, display: "flex", justifyContent: "center" }}>
            <button
              type="button"
              style={btnSeeMore}
              onClick={() =>
                setVisibleByArea((p) => ({
                  ...p,
                  [area.id]: (p[area.id] ?? INITIAL_VISIBLE) + INITIAL_VISIBLE,
                }))
              }
            >
              Ver más ({list.length - visible} restantes)
            </button>
          </div>
        )}
      </>
    )}
  </div>
</section>
              );
            })}

            {/* SIN ÁREA */}
            <section style={areaSection}>
              <div style={areaHeader}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={areaNameStyle}>SIN ÁREA ASIGNADA</div>
                  <div style={areaMeta}>{equipmentsWithoutArea.length} equipo(s)</div>
                </div>
              </div>

              {equipmentsWithoutArea.length === 0 ? (
                <div style={emptyBox}>Todos los equipos tienen área asignada</div>
              ) : (
                (() => {
                  const visible = visibleByArea._no_area ?? INITIAL_VISIBLE;
                  const sliced = equipmentsWithoutArea.slice(0, visible);
                  const hasMore = equipmentsWithoutArea.length > visible;

                  return (
                    <>
                      <div style={eqGrid}>
                        {sliced.map((eq) => (
                          <EquipmentCard
  key={eq.id}
  eq={eq}
  readOnly={!canManage}
  onOpen={() => navigate(`/equipments/${eq.id}`)}
  onEdit={canManage ? () => navigate(`/equipments/${eq.id}/edit`) : undefined}
  onAssign={canManage ? () => navigate(`/equipments/${eq.id}/edit#assign`) : undefined}
  onDelete={canDelete ? () => onDeleteEquipment(eq.id) : undefined}
  onNewRoute={
  canManage
    ? () => {
        setPrefillRouteEquipment(eq);
        setShowNewRouteModal(true);
      }
    : undefined
}
/>
                        ))}
                      </div>

                      {hasMore && (
                        <div style={{ marginTop: 10, display: "flex", justifyContent: "center" }}>
                          <button
                            type="button"
                            style={btnSeeMore}
                            onClick={() =>
                              setVisibleByArea((p) => ({
                                ...p,
                                _no_area: (p._no_area ?? INITIAL_VISIBLE) + INITIAL_VISIBLE,
                              }))
                            }
                          >
                            Ver más ({equipmentsWithoutArea.length - visible} restantes)
                          </button>
                        </div>
                      )}
                    </>
                  );
                })()
              )}
            </section>
          </div>
        )}

       {/* ================= MODAL ÁREA ================= */}
{canManage && showAreaModal && (
  <Modal
    title={editingArea ? "Editar área" : "Nueva área"}
    subtitle="Define la zona / línea para agrupar equipos."
    icon={<MapPin size={18} strokeWidth={1.8} />}
    onClose={() => {
      if (!areaSaving) {
        setShowAreaModal(false);
        setEditingArea(null);
        setActiveField("");
      }
    }}
    footer={
      <>
        <button
          type="button"
          onClick={() => {
            setShowAreaModal(false);
            setEditingArea(null);
            setActiveField("");
          }}
          style={btnGhost}
          disabled={areaSaving}
        >
          Cancelar
        </button>
        <button type="submit" form="area-form" style={btnPrimary} disabled={areaSaving}>
          {areaSaving ? "Guardando..." : "Guardar"}
        </button>
      </>
    }
  >
    <form id="area-form" onSubmit={submitArea} style={{ display: "grid", gap: 12 }}>
      <div style={{ ...formRow, ...(activeField === "area-name" ? formRowActive : null) }}>
        <label style={labelStyle}>Nombre del Área *</label>
        <input
          id="area-name"
          value={areaName}
          onChange={(e) => setAreaName(e.target.value)}
          placeholder="Ej: Planta 1, Línea A, etc."
          style={inputStyle}
          autoFocus
          onFocus={() => setActiveField("area-name")}
          onBlur={() => setActiveField("")}
        />
      </div>

      <div style={{ ...formRow, ...(activeField === "area-desc" ? formRowActive : null) }}>
        <label style={labelStyle}>Descripción</label>
        <textarea
          id="area-desc"
          value={areaDesc}
          onChange={(e) => setAreaDesc(e.target.value)}
          placeholder="Descripción del área…"
          style={{ ...inputStyle, minHeight: 90, resize: "vertical" }}
          onFocus={() => setActiveField("area-desc")}
          onBlur={() => setActiveField("")}
        />
      </div>
    </form>
  </Modal>
)}

      {/* ================= MODAL EQUIPO ================= */}
{canManage && showEquipmentModal && (
  <Modal
    title="Nuevo equipo"
    subtitle="Crea el activo y sus datos base."
    icon={<Settings size={18} strokeWidth={1.8} />}
    size="lg"
    onClose={() => {
      if (!eqSaving) {
        setShowEquipmentModal(false);
        setActiveField("");
      }
    }}
    footer={
      <>
        <button
          type="button"
          onClick={() => {
            setShowEquipmentModal(false);
            setActiveField("");
          }}
          style={btnGhost}
          disabled={eqSaving}
        >
          Cancelar
        </button>
        <button type="submit" form="equipment-form" style={btnPrimary} disabled={eqSaving}>
          {eqSaving ? "Creando..." : "Crear equipo"}
        </button>
      </>
    }
  >
    <form id="equipment-form" onSubmit={submitEquipment} style={{ display: "grid", gap: 12 }}>
      <div style={{ ...formRow, ...(activeField === "eq-name" ? formRowActive : null) }}>
        <label style={labelStyle}>Nombre del Equipo *</label>
        <input
          id="eq-name"
          value={eqForm.name}
          onChange={(e) => setEqForm((p) => ({ ...p, name: e.target.value }))}
          placeholder="Ej: Motor Principal Línea 1"
          style={inputStyle}
          autoFocus
          onFocus={() => setActiveField("eq-name")}
          onBlur={() => setActiveField("")}
        />
      </div>

      <div style={grid2}>
        <div style={{ ...formRow, ...(activeField === "eq-crit" ? formRowActive : null) }}>
          <label style={labelStyle}>Criticidad *</label>
          <select
            id="eq-crit"
            value={eqForm.criticality}
            onChange={(e) => setEqForm((p) => ({ ...p, criticality: e.target.value }))}
            style={inputStyle}
            onFocus={() => setActiveField("eq-crit")}
            onBlur={() => setActiveField("")}
          >
            <option value="BAJA">Baja</option>
            <option value="MEDIA">Media</option>
            <option value="ALTA">Alta</option>
            <option value="CRITICA">Crítica</option>
          </select>
        </div>

        <div style={{ ...formRow, ...(activeField === "eq-status" ? formRowActive : null) }}>
          <label style={labelStyle}>Estado *</label>
          <select
            id="eq-status"
            value={eqForm.status}
            onChange={(e) => setEqForm((p) => ({ ...p, status: e.target.value }))}
            style={inputStyle}
            onFocus={() => setActiveField("eq-status")}
            onBlur={() => setActiveField("")}
          >
            <option value="ACTIVO">Activo</option>
            <option value="INACTIVO">Inactivo</option>
          </select>
        </div>
      </div>

      <div style={{ ...formRow, ...(activeField === "eq-area" ? formRowActive : null) }}>
        <label style={labelStyle}>Área</label>
        <select
          id="eq-area"
          value={eqForm.areaId}
          onChange={(e) => setEqForm((p) => ({ ...p, areaId: e.target.value }))}
          style={inputStyle}
          onFocus={() => setActiveField("eq-area")}
          onBlur={() => setActiveField("")}
        >
          <option value="">Seleccionar área</option>
          {areas.map((a) => (
            <option key={a.id} value={String(a.id)}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      <div style={{ ...formRow, ...(activeField === "eq-loc" ? formRowActive : null) }}>
        <label style={labelStyle}>Ubicación específica *</label>
        <input
          id="eq-loc"
          value={eqForm.location}
          onChange={(e) => setEqForm((p) => ({ ...p, location: e.target.value }))}
          placeholder="Ej: Zona A, Línea 2, etc."
          style={inputStyle}
          onFocus={() => setActiveField("eq-loc")}
          onBlur={() => setActiveField("")}
        />
      </div>

      <div style={grid2}>
        <div style={{ ...formRow, ...(activeField === "eq-code" ? formRowActive : null) }}>
          <label style={labelStyle}>Código / TAG</label>
          <input
            id="eq-code"
            value={eqForm.code}
            onChange={(e) => setEqForm((p) => ({ ...p, code: e.target.value }))}
            placeholder="Ej: MOT-001"
            style={inputStyle}
            onFocus={() => setActiveField("eq-code")}
            onBlur={() => setActiveField("")}
          />
        </div>

        <div style={{ ...formRow, ...(activeField === "eq-brand" ? formRowActive : null) }}>
          <label style={labelStyle}>Marca</label>
          <input
            id="eq-brand"
            value={eqForm.brand}
            onChange={(e) => setEqForm((p) => ({ ...p, brand: e.target.value }))}
            placeholder="Ej: Siemens"
            style={inputStyle}
            onFocus={() => setActiveField("eq-brand")}
            onBlur={() => setActiveField("")}
          />
        </div>
      </div>

      <div style={{ ...formRow, ...(activeField === "eq-model" ? formRowActive : null) }}>
        <label style={labelStyle}>Modelo</label>
        <input
          id="eq-model"
          value={eqForm.model}
          onChange={(e) => setEqForm((p) => ({ ...p, model: e.target.value }))}
          placeholder="Ej: 1LA7083-4AB10"
          style={inputStyle}
          onFocus={() => setActiveField("eq-model")}
          onBlur={() => setActiveField("")}
        />
      </div>

      <div style={{ ...formRow, ...(activeField === "eq-notes" ? formRowActive : null) }}>
        <label style={labelStyle}>Notas adicionales</label>
        <textarea
          id="eq-notes"
          value={eqForm.description}
          onChange={(e) => setEqForm((p) => ({ ...p, description: e.target.value }))}
          placeholder="Información adicional del equipo…"
          style={{ ...inputStyle, minHeight: 100, resize: "vertical" }}
          onFocus={() => setActiveField("eq-notes")}
          onBlur={() => setActiveField("")}
        />
      </div>
    </form>
  </Modal>
)}

{canManage && showNewRouteModal && (
  <NewRouteModal
    open={showNewRouteModal}
    onClose={() => {
      setShowNewRouteModal(false);
      setPrefillRouteEquipment(null);
    }}
    onSave={async () => {
      setShowNewRouteModal(false);
      setPrefillRouteEquipment(null);

      showToast({
        type: "success",
        title: "Ruta creada",
        message: "La ruta se creó correctamente.",
      });

      await loadAll(daysParam, query.filter);
    }}
    initialData={
      prefillRouteEquipment
        ? {
            equipmentId: prefillRouteEquipment.id,
            equipmentName: prefillRouteEquipment.name || "",
            equipmentCode:
              prefillRouteEquipment.code || prefillRouteEquipment.tag || "",
            equipmentLocation: prefillRouteEquipment.location || "",
            technicianId:
              prefillRouteEquipment.assignedTechnician?.id ??
              prefillRouteEquipment.technicianId ??
              prefillRouteEquipment.technician?.id ??
              "",
            lockEquipment: true,
          }
        : null
    }
  />
)}
      </div>
       {/* ✅ Toast global de confirmación */}
<Toast toast={toast} onClose={hideToast} />
    </MainLayout>
  );
}

/* ================= COMPONENTS ================= */

// ✅ Modal local (ARREGLA: "Modal is not defined")
function Modal({ title, subtitle, icon, onClose, children, footer, size = "md" }) {
  const cardStyle = size === "lg" ? modalCardLarge : modalCard;

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div style={modalOverlay} onClick={onClose}>
      <div style={cardStyle} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={modalHeader}>
          <div style={{ display: "flex", gap: 12, alignItems: "center", minWidth: 0 }}>
            {icon ? <div style={modalIconWrap}>{icon}</div> : null}

            <div style={{ minWidth: 0 }}>
              <div style={modalTitle}>{title}</div>
              {subtitle ? <div style={modalSubtitle}>{subtitle}</div> : null}
            </div>
          </div>

          <button type="button" style={xBtn} onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>

        {/* Body (scroll interno) */}
        <div style={modalBody}>{children}</div>

        {/* Footer fijo */}
        {footer ? <div style={modalFooter}>{footer}</div> : null}
      </div>
    </div>
  );
}

function EquipmentCard({ eq, onOpen, onEdit, onAssign, onDelete, onNewRoute, readOnly }) {
  const [hovered, setHovered] = useState(false);
  const status = String(eq?.status || "").toUpperCase();
  const crit = String(eq?.criticality || "MEDIA").toUpperCase();

  const routesCount =
    Number(eq?.routesCount ?? eq?._count?.routes ?? 0) ||
    (Array.isArray(eq?.routes) ? eq.routes.length : 0);

  const assignedTechnician = eq?.assignedTechnician || eq?.technician || null;
  const assignedTechName = assignedTechnician?.name || "";
  const assignedTechCode = assignedTechnician?.code || "";

  const canManageActions =
    !readOnly &&
    (typeof onEdit === "function" || typeof onAssign === "function" || typeof onDelete === "function");

  const isActive = status === "ACTIVO" || status === "ACTIVE";

  return (
    <div
      style={{
        ...eqCardRef,
        ...(hovered ? eqCardHover : null),
      }}
      role="button"
      tabIndex={0}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter") onOpen?.();
      }}
    >
      {/* Barra superior naranja */}
      <div style={eqTopAccent} />

      {/* Header */}
      <div style={eqHeaderWrap}>
        <div style={eqIconBox} aria-hidden>
          <Settings size={20} strokeWidth={1.8} />
        </div>

        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={eqTitleRowRef}>
            <div style={eqTitleRef} title={eq?.name || ""}>
              {eq?.name || "—"}
            </div>

            <div style={routesPill} title={`${routesCount} ruta(s)`}>
              {routesCount} ruta{routesCount === 1 ? "" : "s"}
            </div>
          </div>

          <div style={eqCodeRef}>{eq?.code || "—"}</div>

          {assignedTechnician ? (
            <div
              style={{
                marginTop: 10,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
                padding: "7px 10px",
                borderRadius: 999,
                border: "1px solid rgba(14,116,144,0.18)",
                background: "linear-gradient(135deg, rgba(236,254,255,0.96), rgba(224,242,254,0.92))",
                color: "#0f172a",
                maxWidth: "100%",
              }}
              title={`Técnico asignado por equipo: ${assignedTechName}${assignedTechCode ? ` (${assignedTechCode})` : ""}`}
            >
              <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: 0.3, color: "#0f766e", textTransform: "uppercase" }}>
                Técnico
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {assignedTechName}
              </span>
              {assignedTechCode ? (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "3px 8px",
                    borderRadius: 999,
                    background: "rgba(15,23,42,0.08)",
                    fontSize: 11,
                    fontWeight: 900,
                    color: "#155e75",
                  }}
                >
                  {assignedTechCode}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* ✅ status dot pegado adentro de la card */}
        <div style={statusDotInHeader(isActive)} title={isActive ? "Activo" : "Inactivo"} />
      </div>

      {/* Criticidad (banda) */}
      <div style={{ ...critBar, ...(isCrit(crit) ? critBarCritical : null) }}>
        <div style={critLeft}>CRITICIDAD</div>
        <div style={{ ...critRight, ...(isCrit(crit) ? critRightCritical : null) }}>
          {formatCrit(crit)}
        </div>
      </div>

      {/* Ubicación */}
      <div style={eqLocationRow}>
        <MapPin size={14} strokeWidth={1.8} style={{ color: "#475569" }} />
        <span style={eqLocationText}>{eq?.location || "—"}</span>
      </div>

      {/* Acciones */}
      <div style={eqActionsRef} onClick={(e) => e.stopPropagation()}>
        <button type="button" style={btnLight} onClick={onOpen}>
          <Eye size={16} />&nbsp;Detalle
        </button>

        {canManageActions ? (
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" style={iconSquareBtn} title="Asignar técnico" onClick={onAssign}>
              <UserCog size={16} />
            </button>
            <button type="button" style={iconSquareBtn} title="Editar" onClick={onEdit}>
              <Pencil size={16} />
            </button>
            <button type="button" style={iconSquareBtnDanger} title="Borrar" onClick={onDelete}>
              <Trash2 size={16} />
            </button>
          </div>
        ) : (
          <div />
        )}
      </div>

      {/* CTA Nueva Ruta */}
      {!readOnly && typeof onNewRoute === "function" ? (
        <button
          type="button"
          style={btnDarkFull}
          onClick={(e) => {
            e.stopPropagation();
            onNewRoute();
          }}
        >
          <Route size={16} />&nbsp;Nueva Ruta
        </button>
      ) : null}
    </div>
  );
}

function formatCrit(crit) {
  const v = String(crit || "").toUpperCase();
  if (v === "CRITICA" || v === "CRÍTICA") return "Crítica";
  if (v === "ALTA") return "Alta";
  if (v === "BAJA") return "Baja";
  return "Media";
}

function isCrit(crit) {
  const v = String(crit || "").toUpperCase();
  return v === "CRITICA" || v === "CRÍTICA";
}

/* ================= STYLES ================= */
const btnPrimaryBase = {
  background: "#f97316",
  color: "#0b1220",
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid #fb923c",
  fontWeight: 950,
  cursor: "pointer",
  boxShadow: "0 10px 22px rgba(249,115,22,0.22)",
};
const btnGhostBase = {
  background: "rgba(255,255,255,0.70)",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: "10px 14px",
  cursor: "pointer",
  fontWeight: 950,
  color: "#0f172a",
};

const btnPrimary = {
  ...btnPrimaryBase,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
};

const btnGhost = {
  ...btnGhostBase,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
};
const kpiRow = {
  marginTop: 14,
  width: "100%",
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 12,
};


const kpiTopAccent = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: 5,
  background: "#f97316",
};

const kpiIconWrap = {
  width: 44,
  height: 44,
  borderRadius: 14,
  display: "grid",
  placeItems: "center",
  background: "rgba(15,23,42,0.06)",
  border: "1px solid rgba(226,232,240,1)",
  color: "#0f172a",
};

const controlsRow = {
  marginTop: 12,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
  gap: 12,
  alignItems: "end",
};

const actionsRow = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  justifyContent: "flex-end",
  alignItems: "center",
};

const readOnlyPill = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 12px",
  borderRadius: 999,
  border: "1px solid #e5e7eb",
  background: "rgba(255,255,255,0.70)",
  fontWeight: 900,
  color: "#334155",
  fontSize: 12,
};

const headerActions = {
  display: "flex",
  gap: 12,
};
const btnHeaderGhost = {
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: "10px 14px",
  fontWeight: 800,
  cursor: "pointer",
};

const btnHeaderPrimary = {
  background: "#2563eb",
  color: "#fff",
  border: "1px solid #1d4ed8",
  borderRadius: 10,
  padding: "10px 16px",
  fontWeight: 900,
  cursor: "pointer",
};
const topBarActions = {
  display: "flex",
  gap: 12,
  alignItems: "center",
};

const btnPrimaryLg = {
  background: "#f97316",
  color: "#0b1220",
  padding: "14px 20px",
  borderRadius: 14,
  border: "1px solid #fb923c",
  fontWeight: 1000,
  fontSize: 14,
  cursor: "pointer",
  boxShadow: "0 14px 30px rgba(249,115,22,0.28)",
};

const btnPrimaryLgGhost = {
  background: "rgba(255,255,255,0.85)",
  color: "#0f172a",
  padding: "14px 20px",
  borderRadius: 14,
  border: "1px solid #e5e7eb",
  fontWeight: 950,
  fontSize: 14,
  cursor: "pointer",
};
const pageShell = {
  padding: 16,
  background: "linear-gradient(180deg, #f6f7f9 0%, #eef2f7 100%)",
  borderRadius: 16,
  border: "1px solid #e5e7eb",
};
const headerRow = {
  width: "100%",              // ✅ clave
  display: "flex",
  alignItems: "flex-start",
  gap: 16,
  flexWrap: "wrap",
};

const headerLeft = {
  flex: 1,                    // ✅ empuja el lado derecho hasta la esquina
  minWidth: 0,
};

const headerRight = {
  display: "flex",
  gap: 12,
  justifyContent: "flex-start",
  alignItems: "center",
  flexWrap: "wrap",
  width: "100%",
};

const topBar = {
  display: "flex",
  flexDirection: "column",   // 🔥 importante
  alignItems: "flex-start",
  gap: 12,
  paddingBottom: 12,
  borderBottom: "1px solid #e5e7eb",
};
const topBarActionsLeft = {
  display: "flex",
  gap: 12,
  alignItems: "center",
};

const title = {
  margin: "6px 0 0",
  fontSize: "clamp(2rem, 6vw, 2.75rem)",
  fontWeight: 950,
  color: "#0f172a",
  letterSpacing: 0.2,
};

const subtitle = {
  marginTop: 6,
  color: "#64748b",
  fontWeight: 800,
  fontSize: 12,
  maxWidth: "60ch",
  lineHeight: 1.5,
};

const listGrid = { marginTop: 14, display: "grid", gap: 12 };

const areaSection = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  padding: 14,
  boxShadow: "0 12px 28px rgba(2,6,23,0.06)",
};

const areaHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 10,
  marginBottom: 10,
};

const areaNameStyle = {
  fontWeight: 950,
  color: "#0f172a",
  letterSpacing: 0.8,
  fontSize: 13,
};

const areaMeta = { fontSize: 12, color: "#64748b", fontWeight: 900 };

const emptyBox = {
  marginTop: 8,
  padding: 12,
  borderRadius: 12,
  border: "1px dashed #cbd5e1",
  color: "#64748b",
  fontWeight: 800,
  fontSize: 13,
  background: "rgba(248,250,252,0.85)",
};

const eqGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
  gap: 10,
};

// ✅ BOTONES naranja industrial

const panel = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  padding: 14,
};

const labelStyle = {
  display: "block",
  marginBottom: 6,
  fontWeight: 950,
  fontSize: 12,
  color: "#0f172a",
  letterSpacing: 0.3,
  textTransform: "uppercase",
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  fontSize: 14,
  fontWeight: 800,
  outline: "none",
  background: "#fff",
  boxShadow: "inset 0 1px 0 rgba(2,6,23,0.04)",
};

const grid2 = { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 };

// SEARCH UI
const searchBox = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  background: "rgba(255,255,255,0.70)",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: "10px 12px",
  minWidth: 0,
  width: "100%",
};

const searchIcon = { color: "#64748b", fontWeight: 900 };

const searchInput = {
  border: "none",
  outline: "none",
  background: "transparent",
  width: "100%",
  minWidth: 0,
  fontWeight: 800,
  color: "#0f172a",
};

const clearBtn = {
  border: "none",
  background: "transparent",
  cursor: "pointer",
  color: "#64748b",
  fontWeight: 900,
};

// ✅ FILTRO POR ÁREA (industrial)
const filterRow = { display: "flex", flexDirection: "column", gap: 6, minWidth: 200 };
const filterLabel = {
  fontSize: 11,
  fontWeight: 950,
  color: "#334155",
  letterSpacing: 0.6,
  textTransform: "uppercase",
};
const filterSelect = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  background: "rgba(255,255,255,0.85)",
  fontWeight: 900,
  color: "#0f172a",
  outline: "none",
};

// VER MÁS
const btnSeeMore = {
  background: "rgba(255,255,255,0.70)",
  border: "1px solid #e5e7eb",
  padding: "10px 14px",
  borderRadius: 12,
  fontWeight: 950,
  cursor: "pointer",
  color: "#0f172a",
};

const areaNameBadge = (areaId) => {
  const n = Number(areaId) || 0;
  const hue = (n * 47) % 360;

  return {
    width: "fit-content",
    padding: "8px 12px",
    borderRadius: 12,
    fontWeight: 950,
    letterSpacing: 0.8,
    fontSize: 12,
    background: `hsla(${hue}, 55%, 96%, 0.95)`,
    border: `1px solid hsla(${hue}, 40%, 55%, 0.22)`,
    color: "#0f172a",
    boxShadow: "0 10px 22px rgba(2,6,23,0.05)",
  };
};

/* ===== KPI (cards arriba) ===== */
const kpiInactive = { background: "rgba(15,23,42,0.04)" };
const summaryCard = {
  marginTop: 14,
  width: "100%",
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",

  background: "rgba(255,255,255,0.75)",
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 18,
  padding: 14,

  display: "flex",
  flexDirection: "column",     // ✅ clave
  gap: 12,

  backdropFilter: "blur(6px)",
  boxShadow: "0 16px 30px rgba(15, 23, 42, 0.06)",
};
const summaryMetrics4 = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
  gap: 12,
  width: "100%",
};
const kpiCard = {
  background: "#f97316", 
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 16,
  padding: 12,
  boxShadow: "0 10px 18px rgba(2,6,23,0.06)",
  overflow: "hidden",
  position: "relative",
  minHeight: 74,
};
const kpiAccent = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: 12,
  borderTopLeftRadius: 18,
  borderTopRightRadius: 18,
  background: "linear-gradient(180deg, #374151 0%, #1f2937 100%)",
};
const kpiInner = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
};

const kpiIconBox = {
  width: 52,
  height: 52,
  borderRadius: 16,
  display: "grid",
  placeItems: "center",

  background: "linear-gradient(180deg, #fb923c 0%, #f97316 100%)", // 🟧 naranja de fondo
  border: "1px solid #fb923c",

  color: "#0f172a",              // ⚫ icono negro (se hereda al SVG)
  boxShadow:
    "inset 0 1px 0 rgba(255,255,255,0.35), 0 6px 14px rgba(249,115,22,0.35)",
};
const kpiRight = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  lineHeight: 1.05,
};

const kpiValue = {
  fontSize: 36,        // ⬆️ antes 22 → ahora más protagonista
  fontWeight: 1000,
  color: "#0f172a",
  lineHeight: 1,
  letterSpacing: -0.5,
};

const kpiLabel = {
  marginTop: 6,
  fontSize: 11,
  fontWeight: 950,
  color: "#334155",
  letterSpacing: 0.6,
  textTransform: "uppercase",
};

/* Variantes (solo cambia la barra superior y el tinte) */
const kpiEquip = {
  background: "rgba(255,255,255,0.92)",
};
const kpiCritical = {
  background: "rgba(254,242,242,0.55)",
};
const kpiAreas = {
  background: "rgba(248,250,252,0.85)",
};

const summaryLeft = { minWidth: 220 };
const summaryTitle = { fontWeight: 1000, color: "#0f172a", fontSize: 14, letterSpacing: 0.2 };
const summarySubtitle = { marginTop: 4, color: "#64748b", fontWeight: 800, fontSize: 12 };

const summaryMetrics = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 14,
  width: "100%",
};

const metric = {
  width: "100%",
  borderRadius: 14,
  padding: "12px 14px",
  border: "1px solid rgba(226,232,240,0.95)",
  boxSizing: "border-box",
};

const metricAccentBar = {
  height: 4,
  borderRadius: 999,
  marginBottom: 10,
};

const metricLabel = {
  fontSize: 11,
  fontWeight: 950,
  color: "#64748b",
  letterSpacing: 0.6,
  textTransform: "uppercase",
};

const metricValue = { marginTop: 4, fontSize: 18, fontWeight: 1000, color: "#0f172a" };

const summaryRight = { minWidth: 140, textAlign: "right" };

const metricBlue = { background: "rgba(59,130,246,0.10)" };
const metricSlate = { background: "rgba(15,23,42,0.07)" };
const metricGreen = { background: "rgba(34,197,94,0.10)" };
const metricAmber = { background: "rgba(245,158,11,0.12)" };
const metricRed = { background: "rgba(239,68,68,0.10)" };

/* ===== Card equipo ===== */
const eqCardRef = {
  position: "relative",
  background: "#fff",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#e5e7eb",
  borderRadius: 14,
  padding: 14,
  display: "grid",
  gap: 12,
  boxShadow: "0 10px 22px rgba(2,6,23,0.06)",
  transition: "transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease",
  overflow: "hidden",
};

const eqCardHover = {
  transform: "translateY(-4px)",
  boxShadow: "0 18px 36px rgba(2,6,23,0.14)",
  borderColor: "#cbd5e1",
};

const critBarCritical = {
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "rgba(239,68,68,0.55)",
  background: "rgba(254,242,242,0.85)",
};

const critRightCritical = {
  color: "#991b1b",
};

const eqTopAccent = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: 6,
  borderTopLeftRadius: 14,
  borderTopRightRadius: 14,
  background: "#f97316",
};

const eqIconBox = {
  width: 44,
  height: 44,
  borderRadius: 12,
  background: "#1f2933", // gris industrial (no negro puro)
  color: "#f8fafc",
  display: "grid",
  placeItems: "center",
  fontSize: 18,
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
};

const eqTitleRowRef = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
};

const eqTitleRef = {
  fontWeight: 950,
  color: "#0f172a",
  fontSize: 15,
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const eqCodeRef = {
  marginTop: 4,
  fontSize: 12,
  fontWeight: 800,
  color: "#6b7280",
};

const routesPill = {
  padding: "6px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 900,
  background: "#eef2ff",
  border: "1px solid #e0e7ff",
  color: "#3730a3",
  whiteSpace: "nowrap",
  maxWidth: 140,
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const critBar = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 10,
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  background: "#f8fafc",
};

const critLeft = {
  fontSize: 12,
  fontWeight: 950,
  color: "#334155",
  letterSpacing: 0.4,
};

const critRight = {
  fontSize: 13,
  fontWeight: 950,
  color: "#0f172a",
};

const eqLocationRow = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 13,
  color: "#475569",
  fontWeight: 800,
};

const eqLocationText = {
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const eqActionsRef = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
};

const btnLight = {
  border: "1px solid #e5e7eb",
  background: "#fff",
  borderRadius: 12,
  padding: "10px 12px",
  fontWeight: 950,
  cursor: "pointer",
  width: "100%",
};

const btnDarkFull = {
  border: "1px solid #374151",
  background: "linear-gradient(180deg, #374151 0%, #1f2937 100%)",
  color: "#f9fafb",
  borderRadius: 12,
  padding: "11px 12px",
  fontWeight: 950,
  cursor: "pointer",
  width: "100%",
  boxShadow: "0 8px 18px rgba(31,41,55,0.35)",
};

const eqHeaderWrap = {
  display: "flex",
  alignItems: "flex-start",
  gap: 12,
  flexWrap: "wrap",
  marginTop: 2,
  position: "relative",
  paddingRight: 16,
  minWidth: 0,
};

const statusDotInHeader = (active) => ({
  position: "absolute",
  top: 6,
  right: 6,
  width: 10,
  height: 10,
  borderRadius: 999,
  background: active ? "#16a34a" : "#9ca3af",
  boxShadow: active ? "0 0 0 3px rgba(22,163,74,0.14)" : "0 0 0 3px rgba(156,163,175,0.14)",
});

const iconSquareBtn = {
  border: "1px solid #e5e7eb",
  background: "#fff",
  borderRadius: 12,
  padding: "10px 12px",
  cursor: "pointer",
  fontWeight: 950,
};

const iconSquareBtnDanger = {
  ...iconSquareBtn,
  border: "1px solid #fecaca",
  background: "#fff1f2",
};

const chipBase = {
  padding: "6px 10px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 1000,
  border: "1px solid rgba(226,232,240,1)",
  lineHeight: 1,
  textTransform: "uppercase",
};

const chipCrit = (crit) => {
  const isCrit = crit === "CRITICA" || crit === "CRÍTICA" || crit === "MUY CRÍTICA";
  return {
    ...chipBase,
    background: isCrit ? "rgba(239,68,68,0.10)" : "rgba(15,23,42,0.04)",
    color: isCrit ? "#991b1b" : "#0f172a",
    border: isCrit ? "1px solid rgba(239,68,68,0.20)" : "1px solid rgba(226,232,240,1)",
  };
};

const modalOverlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(2,6,23,0.55)",
  backdropFilter: "blur(6px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 16,
  zIndex: 999,
};

const modalCard = {
  width: "min(720px, 100%)",
  background: "rgba(255,255,255,0.92)",
  borderRadius: 18,
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "rgba(226,232,240,0.95)",
  boxShadow: "0 30px 90px rgba(0,0,0,0.35)",
  overflow: "hidden",
};

const modalCardLarge = {
  ...modalCard,
  width: "min(720px, calc(100vw - 24px))",
};

const modalHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
  padding: "14px 14px",
  borderBottomWidth: 1,
  borderBottomStyle: "solid",
  borderBottomColor: "rgba(226,232,240,0.9)",
  background: "linear-gradient(180deg, rgba(248,250,252,0.95), rgba(255,255,255,0.88))",
};

const modalIconWrap = {
  width: 40,
  height: 40,
  borderRadius: 14,
  display: "grid",
  placeItems: "center",
  background: "rgba(15,23,42,0.06)",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "rgba(226,232,240,1)",
};

const modalTitle = { fontWeight: 950, color: "#0f172a", letterSpacing: 0.2 };
const modalSubtitle = { marginTop: 2, fontSize: 12, fontWeight: 800, color: "#64748b" };

const modalBody = {
  padding: 14,
  maxHeight: "calc(100vh - 132px)",
  overflow: "auto",
};

const modalFooter = {
  padding: 14,
  borderTopWidth: 1,
  borderTopStyle: "solid",
  borderTopColor: "rgba(226,232,240,0.9)",
  background: "rgba(248,250,252,0.92)",
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
};

const xBtn = {
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "rgba(226,232,240,1)",
  background: "rgba(255,255,255,0.9)",
  borderRadius: 12,
  padding: "8px 10px",
  cursor: "pointer",
  fontWeight: 950,
};

const areaTopBar = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "10px 14px",
  background: "linear-gradient(180deg, #374151 0%, #1f2937 100%)",
  color: "#f8fafc",
};

const areaTopIcon = {
  width: 52,
  height: 52,
  borderRadius: 16,
  display: "grid",
  placeItems: "center",
  background: "linear-gradient(180deg, #fb923c 0%, #f97316 100%)",
  border: "1px solid rgba(251,146,60,0.95)",
  color: "#0b1220",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35), 0 10px 18px rgba(249,115,22,0.25)",
  flexShrink: 0,
};

const areaTopTitle = {
  fontSize: 18,
  fontWeight: 1000,
  letterSpacing: 0.6,
  lineHeight: 1.1,
  whiteSpace: "normal",
  overflow: "visible",
  textOverflow: "clip",
  maxWidth: "100%",
};

const areaTopSub = {
  marginTop: 4,
  fontSize: 12,
  fontWeight: 850,
  color: "rgba(226,232,240,0.92)",
  whiteSpace: "normal",
  overflow: "visible",
  textOverflow: "clip",
  maxWidth: "100%",
};

const areaTopActions = {
  marginLeft: 0,
  display: "flex",
  gap: 10,
  alignItems: "center",
  flexWrap: "wrap",
  width: "100%",
  justifyContent: "flex-end",
};

const iconSquareBtnTop = {
  border: "1px solid rgba(226,232,240,0.25)",
  background: "rgba(255,255,255,0.06)",
  color: "#f8fafc",
  borderRadius: 12,
  padding: "10px 12px",
  cursor: "pointer",
};

const iconSquareBtnDangerTop = {
  ...iconSquareBtnTop,
  border: "1px solid rgba(254,202,202,0.35)",
  background: "rgba(239,68,68,0.10)",
  color: "#fee2e2",
};

/* ✅ padding interno del contenido del área (para que no pegue al borde) */
const areaBodyPad = {
  padding: 14,
};
// ✅ Form rows (estilo “renglón activo” como Técnicos)
const formRow = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  padding: "10px 12px",
  borderRadius: 12,

  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "rgba(0,0,0,0.08)",

  background: "rgba(255,255,255,0.55)",
  transition: "box-shadow 150ms ease, border-color 150ms ease, background 150ms ease",
};

const formRowActive = {
  borderColor: "rgba(249,115,22,0.55)",
  boxShadow: "0 0 0 3px rgba(249,115,22,0.18)",
  background: "rgba(255,255,255,0.85)",
};
