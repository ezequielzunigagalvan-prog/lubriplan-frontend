// src/pages/RoutesPage.jsx
import { useEffect, useMemo, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import NewRouteModal from "../components/routes/NewRouteModal";
import RouteCard from "../components/routes/RouteCard";
import { getRoutes, deleteRoute } from "../services/routesService";
import { useAuth } from "../context/AuthContext";
import { Icon } from "../components/ui/lpIcons";
import Toast from "../components/ui/Toast";
import { usePlant } from "../context/PlantContext";
import { getTechnicians } from "../services/techniciansService";
import { updateRoute } from "../services/routesService";

function mapRouteToModalData(route) {
  if (!route) return null;

  return {
    id: route.id,

    routeKind: route.routeKind ?? "LUBRICATION",
    name: route.name ?? "",

    equipmentId:
      route.equipmentId != null
        ? String(route.equipmentId)
        : route.equipment?.id != null
        ? String(route.equipment.id)
        : "",

    equipmentName: route.equipmentName ?? route.equipment?.name ?? "",
    equipmentCode:
      route.equipmentCode ?? route.equipment?.code ?? route.equipment?.tag ?? "",
    equipmentLocation: route.equipmentLocation ?? route.equipment?.location ?? "",
    lockEquipment: true,

    lubricantType: route.lubricantType ?? "",

    quantity:
      route.quantity != null && route.quantity !== ""
        ? String(route.quantity)
        : "",

    frequencyDays: route.frequencyDays ?? null,
frequencyType: route.frequencyType ?? null, // 🔥 ESTA ES LA CLAVE
weeklyDays:
  Array.isArray(route.weeklyDays) && route.weeklyDays.length > 0
    ? route.weeklyDays
    : [],

        lubricantId:
      route.lubricantId != null
        ? String(route.lubricantId)
        : route.lubricant?.id != null
        ? String(route.lubricant.id)
        : "",

    lubricantName:
      route.lubricantId != null || route.lubricant?.id != null
        ? ""
        : route.lubricantName ?? route.lubricant?.name ?? "",

    technicianId:
      route.technicianId != null
        ? String(route.technicianId)
        : route.technician?.id != null
        ? String(route.technician.id)
        : route.nextExecutionTechnicianId != null
        ? String(route.nextExecutionTechnicianId)
        : route.nextExecutionTechnician?.id != null
        ? String(route.nextExecutionTechnician.id)
        : "",

    unit: route.unit ?? "ml",
    pumpStrokeValue:
      route.pumpStrokeValue != null && route.pumpStrokeValue !== ""
        ? String(route.pumpStrokeValue)
        : "",
    pumpStrokeUnit: route.pumpStrokeUnit ?? "g",

    method: route.method ?? "Manual",

    points:
      route.points != null && route.points !== ""
        ? String(route.points)
        : "",

    instructions: route.instructions ?? "",

    lastDate: route.lastDate ?? "",
    nextDate: route.nextDate ?? "",

    imageUrl: route.imageUrl ?? "",
  };
}

export default function RoutesPage() {
  const { user, permissions } = useAuth();
  const { currentPlantId, currentPlant } = usePlant();

  const role = String(user?.role || "TECHNICIAN").toUpperCase();

  // ✅ Reglas:
  // - TECH: solo lectura
  // - SUPERVISOR: crear/editar, NO borrar
  // - ADMIN: crear/editar/borrar
  const canManageRoutes = Boolean(permissions?.canManageRoutes);
  const canEditRoutes = canManageRoutes; // admin/supervisor
  const canDeleteRoutes = canManageRoutes && role === "ADMIN"; // ✅ solo admin

  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showNewRoute, setShowNewRoute] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);

  // ✅ búsqueda
  const [search, setSearch] = useState("");
  const norm = (v) => String(v ?? "").toLowerCase().trim();

  // ✅ toast confirmación (crear/editar/eliminar)
  // { id, type: "success"|"error"|"info"|"warn", title, message }
  const [toast, setToast] = useState(null);
  const [technicians, setTechnicians] = useState([]);

  const loadRoutes = async () => {
  try {
    setLoading(true);

    if (!currentPlantId) {
      setRoutes([]);
      return;
    }

    const data = await getRoutes();
    setRoutes(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error("Error cargando rutas:", err);
    pushToast("error", "Error", "Error cargando rutas.");
    setRoutes([]);
  } finally {
    setLoading(false);
  }
};

  const pushToast = (type, title, message) => {
    setToast({
      id: globalThis.crypto?.randomUUID?.() || String(Date.now()),
      type,
      title,
      message,
    });
  };

  // autocierre
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(t);
  }, [toast]);

  // ✅ cargar rutas
  useEffect(() => {
  let alive = true;

  (async () => {
    try {
      setLoading(true);

      if (!currentPlantId) {
        if (!alive) return;
        setRoutes([]);
        return;
      }

      const data = await getRoutes();
      if (!alive) return;
      setRoutes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error cargando rutas:", err);
      if (!alive) return;
      pushToast("error", "Error", "Error cargando rutas.");
      setRoutes([]);
    } finally {
      if (!alive) return;
      setLoading(false);
    }
  })();

  return () => {
    alive = false;
  };
}, [currentPlantId]);

useEffect(() => {
  let alive = true;

  (async () => {
    try {
      if (!currentPlantId) {
        if (!alive) return;
        setTechnicians([]);
        return;
      }

      const data = await getTechnicians();
      if (!alive) return;

      const items =
        Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];

      setTechnicians(items);
    } catch (err) {
      console.error("Error cargando técnicos:", err);
      if (!alive) return;
      setTechnicians([]);
    }
  })();

  return () => {
    alive = false;
  };
}, [currentPlantId]);

useEffect(() => {
  if (!currentPlantId) return;

  setSearch("");
  setShowNewRoute(false);
  setEditingRoute(null);
}, [currentPlantId]);

  /* ===== CRUD ===== */

  const handleSaveRoute = async (savedRoute) => {
  const wasEdit = Boolean(editingRoute?.id);

  setShowNewRoute(false);
  setEditingRoute(null);

  pushToast(
    "success",
    wasEdit ? "Ruta actualizada" : "Ruta creada",
    wasEdit ? "Los cambios se guardaron correctamente." : "La ruta fue creada correctamente."
  );

  await loadRoutes();
};

const handleAssignTechnicianToRoute = async (route, technicianId) => {
  try {
  const payload = {
  routeKind: route.routeKind ?? "LUBRICATION",
  name: route.name,
  equipmentId: route.equipmentId ?? route.equipment?.id,
  lubricantType: route.lubricantType,
  quantity: route.quantity,
  frequencyDays: route.frequencyDays,
  frequencyType: route.frequencyType ?? null,
  weeklyDays: Array.isArray(route.weeklyDays) ? route.weeklyDays : [],
  monthlyAnchorDay: route.monthlyAnchorDay ?? null,

  lubricantId: route.lubricantId ?? route.lubricant?.id ?? null,
  lubricantName: route.lubricantName ?? route.lubricant?.name ?? null,

  technicianId: technicianId ?? null,

  unit: route.unit ?? "ml",
  pumpStrokeValue: route.pumpStrokeValue ?? null,
  pumpStrokeUnit: route.pumpStrokeUnit ?? null,

  method: route.method ?? null,
  points: route.points ?? null,
  instructions: route.instructions ?? null,

  lastDate: route.lastDate ?? null,
  nextDate: route.nextDate ?? null,

  imageUrl: route.imageUrl ?? null,
};

    await updateRoute(route.id, payload);

    pushToast("success", "Técnico asignado", "La ruta fue actualizada correctamente.");
    await loadRoutes();
  } catch (err) {
    console.error("Error asignando técnico a ruta:", err);
    pushToast("error", "No se pudo asignar", "Ocurrió un error al actualizar la ruta.");
  }
};

  const handleDeleteRoute = async (id) => {
    if (!canDeleteRoutes) return;

    if (!confirm("¿Eliminar esta ruta?")) return;

    try {
      await deleteRoute(id);
      setRoutes((prev) => prev.filter((r) => r.id !== id));
      pushToast("success", "Ruta eliminada", "La ruta fue eliminada correctamente.");
    } catch (err) {
      console.error("Error eliminando ruta:", err);
      pushToast("error", "No se pudo eliminar", "Ocurrió un error eliminando la ruta.");
    }
  };

  const handleEditRoute = (route) => {
  if (!canEditRoutes) return;

  const mappedRoute = mapRouteToModalData(route);

  setEditingRoute(mappedRoute);
  setShowNewRoute(true);
};

  // ✅ filtro búsqueda
  const filtered = useMemo(() => {
  const q = norm(search);
  if (!q) return routes;

  return (routes || []).filter((r) => {
    const routeName = norm(r?.name);
    const eqName = norm(r?.equipment?.name);
    const eqCode = norm(r?.equipment?.code || r?.equipment?.tag);
    const lubType = norm(r?.lubricantType);
    const lubName = norm(r?.lubricantName);
    const invLubName = norm(r?.lubricant?.name);
    const method = norm(r?.method);
    const instructions = norm(r?.instructions);

    const unit = norm(r?.unit);
    const pumpStrokeValue = norm(r?.pumpStrokeValue);
    const pumpStrokeUnit = norm(r?.pumpStrokeUnit);

    return (
      routeName.includes(q) ||
      eqName.includes(q) ||
      eqCode.includes(q) ||
      lubType.includes(q) ||
      lubName.includes(q) ||
      invLubName.includes(q) ||
      method.includes(q) ||
      instructions.includes(q) ||
      unit.includes(q) ||
      pumpStrokeValue.includes(q) ||
      pumpStrokeUnit.includes(q) ||
      (unit === "bombazos" && "bombazos".includes(q))
    );
  });
}, [routes, search]);

  // ✅ orden estable (por id desc)
  const sorted = useMemo(() => {
    return [...(filtered || [])].sort((a, b) => (Number(b?.id) || 0) - (Number(a?.id) || 0));
  }, [filtered]);

  // ✅ KPIs (solo 3)
  const kpis = useMemo(() => {
    const equipmentsSet = new Set();
    let withInstructions = 0;

    (routes || []).forEach((r) => {
      const eqId = r?.equipment?.id ?? r?.equipmentId ?? null;
      if (eqId != null) equipmentsSet.add(String(eqId));
      if (String(r?.instructions || "").trim()) withInstructions += 1;
    });

    return {
      equipments: equipmentsSet.size,
      routes: (routes || []).length,
      withInstructions,
    };
  }, [routes]);

  // ✅ agrupar por equipo
  const grouped = useMemo(() => {
    const map = new Map();

    for (const r of sorted) {
      const eq = r?.equipment || null;
      const eqId = eq?.id ?? r?.equipmentId ?? null;

      const key = eqId != null ? String(eqId) : "NO_EQUIPMENT";
      if (!map.has(key)) {
        map.set(key, { equipment: eq, equipmentId: eqId, routes: [] });
      }
      map.get(key).routes.push(r);
    }

    const arr = Array.from(map.values());
    arr.sort((a, b) => {
      const an = String(a?.equipment?.name || "Sin equipo").toLowerCase();
      const bn = String(b?.equipment?.name || "Sin equipo").toLowerCase();
      return an.localeCompare(bn);
    });

    return arr;
  }, [sorted]);

  return (
    <MainLayout>
      <div style={pageShell}>
        {/* TOP BAR */}
        <div style={topBar}>
          <div>
            
            <h1 style={title}>Rutas</h1>
            <div style={subtitle}>
  Planifica y gestiona las rutas de lubricación
  {currentPlant?.name ? ` · Planta: ${currentPlant.name}` : ""}
</div>

            {!canEditRoutes ? (
              <div style={readOnlyPill} title={`Perfil ${role}: solo visualización`}>
                <Icon name="user" style={{ width: 16, height: 16 }} />
                <span>Solo visualización</span>
              </div>
            ) : role === "SUPERVISOR" ? (
              <div style={readOnlyPill} title="Supervisor: puede crear y editar, no puede eliminar">
                <Icon name="warn" style={{ width: 16, height: 16 }} />
                <span>Supervisor (sin eliminar)</span>
              </div>
            ) : null}
          </div>

          <div style={topActions}>
            {/* SEARCH */}
            <div style={searchBox}>
              <Icon name="search" style={{ width: 18, height: 18, color: "#64748b" }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar: ruta, equipo, TAG, lubricante, método…"
                style={searchInput}
              />
              {search ? (
                <button type="button" onClick={() => setSearch("")} style={iconBtn} title="Limpiar">
                  <Icon name="close" style={{ width: 18, height: 18, color: "#64748b" }} />
                </button>
              ) : null}
            </div>

            {/* ✅ solo admin/supervisor */}
            {canEditRoutes ? (
              <button
                type="button"
                onClick={() => {
                  setEditingRoute(null);
                  setShowNewRoute(true);
                }}
                style={btnPrimarySlim}
              >
                <Icon name="plus" style={{ width: 16, height: 16 }} />
                <span>Nueva ruta</span>
              </button>
            ) : null}
          </div>
        </div>

        {/* KPIs (3 cards) */}
        {!loading ? (
          <div style={kpiGrid}>
            <KpiCard title="Equipos" value={kpis.equipments} icon="settings" />
            <KpiCard title="Rutas" value={kpis.routes} icon="route" />
            <KpiCard title="Con instrucciones" value={kpis.withInstructions} icon="doc" />
          </div>
        ) : null}

        {/* META */}
        {!loading && (
          <div style={metaRow}>
            <div style={metaPill}>
              Total rutas: <b style={{ marginLeft: 6 }}>{routes.length}</b>
            </div>
            <div style={metaPill}>
              Mostrando: <b style={{ marginLeft: 6 }}>{sorted.length}</b>
            </div>
            <div style={metaPill}>
              Equipos: <b style={{ marginLeft: 6 }}>{kpis.equipments}</b>
            </div>
          </div>
        )}

        {/* CONTENT */}
        {loading && (
          <div style={panel}>
            <p style={{ margin: 0, fontWeight: 900, color: "#0f172a" }}>Cargando rutas…</p>
          </div>
        )}

        {!loading && routes.length === 0 && (
          <div style={emptyBox}>
            {canEditRoutes ? (
              <>
                No hay rutas aún. Crea tu primera ruta con <b>Nueva ruta</b>.
              </>
            ) : (
              <>No hay rutas aún.</>
            )}
          </div>
        )}

        {/* ✅ Agrupado por equipo */}
        {!loading && grouped.length > 0 ? (
          <div style={{ marginTop: 14, display: "grid", gap: 14 }}>
            {grouped.map((group, idx) => (
              <EquipmentGroupCard
  key={String(group.equipmentId ?? `no-eq-${idx}`)}
  equipment={group.equipment}
  routes={group.routes}
  canEditRoutes={canEditRoutes}
  canDeleteRoutes={canDeleteRoutes}
  onEditRoute={handleEditRoute}
  onDeleteRoute={handleDeleteRoute}
  technicians={technicians}
  onAssignTechnician={handleAssignTechnicianToRoute}
/>
            ))}
          </div>
        ) : null}
      </div>

      {/* MODAL solo admin/supervisor */}
      {canEditRoutes ? (
        <NewRouteModal
          open={showNewRoute}
          onClose={() => {
            setShowNewRoute(false);
            setEditingRoute(null);
          }}
          onSave={handleSaveRoute}
          initialData={editingRoute}
        />
      ) : null}

      {/* ✅ TOAST GLOBAL */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </MainLayout>
  );
}

/* =========================
   UI PIECES
========================= */

function KpiCard({ title, value, icon }) {
  return (
    <div style={kpiCard}>
      <div style={kpiStripe} />
      <div style={kpiBody}>
        <div style={kpiIconWrap}>
          <Icon name={icon} style={{ width: 18, height: 18, color: "#0b1220" }} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={kpiValue}>{value}</div>
          <div style={kpiTitle}>{title}</div>
        </div>
      </div>
    </div>
  );
}

function EquipmentGroupCard({
  equipment,
  routes,
  canEditRoutes,
  canDeleteRoutes,
  onEditRoute,
  onDeleteRoute,
  technicians,
  onAssignTechnician,
}) {
  const eqName = equipment?.name || "Sin equipo";
  const eqCode = equipment?.code || equipment?.tag || "";
  const eqLocation = equipment?.location || "";
  const crit = String(equipment?.criticality || "").toUpperCase();

  const critLabel =
    crit === "MUY_CRITICO" || crit === "MUY CRITICO" || crit === "MUY CRÍTICO"
      ? "MUY CRÍTICO"
      : crit === "CRITICO" || crit === "CRÍTICO"
      ? "CRÍTICO"
      : crit === "MEDIO"
      ? "MEDIO"
      : crit === "BAJO"
      ? "BAJO"
      : "";

  return (
    <div style={equipmentCard}>
      <div style={equipmentStripe}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <div style={eqIconWrap}>
            <Icon name="list" style={{ width: 18, height: 18, color: "#0b1220" }} />
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div style={eqTitle}>{eqName}</div>
              {critLabel ? <span style={critPill(critLabel)}>{critLabel}</span> : null}
            </div>

            <div style={eqSub}>
              {routes?.length || 0} ruta(s)
              {eqCode ? (
                <span style={eqCodePill} title="Código / TAG">
                  <Icon name="tag" style={{ width: 14, height: 14 }} /> {eqCode}
                </span>
              ) : null}
              {eqLocation ? <span style={{ opacity: 0.9 }}>· {eqLocation}</span> : null}
            </div>
          </div>
        </div>
      </div>

      {/* Rutas dentro */}
      <div style={routesGrid}>
        {(routes || []).map((route) => (
          <RouteCard
  key={route.id}
  route={route}
  onEdit={canEditRoutes ? () => onEditRoute(route) : undefined}
  onDelete={canDeleteRoutes ? onDeleteRoute : undefined}
  readOnly={!canEditRoutes}
  disableDetails={!canEditRoutes}
  technicians={technicians}
  onAssignTechnician={canEditRoutes ? onAssignTechnician : undefined}
/>
        ))}
      </div>
    </div>
  );
}

/* =========================
   STYLES (alineado a tu look)
========================= */

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
  gap: 12,
  flexWrap: "wrap",
  paddingBottom: 12,
  borderBottom: "1px solid #e5e7eb",
};

const kicker = {
  fontSize: 11,
  fontWeight: 950,
  color: "#64748b",
  letterSpacing: 1.2,
};

const title = {
  margin: "6px 0 0",
  fontSize: 28,
  fontWeight: 950,
  color: "#0f172a",
  letterSpacing: 0.2,
};

const subtitle = {
  marginTop: 6,
  color: "#64748b",
  fontWeight: 800,
  fontSize: 12,
};

const readOnlyPill = {
  marginTop: 10,
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid #e5e7eb",
  background: "rgba(255,255,255,0.70)",
  color: "#334155",
  fontWeight: 900,
  fontSize: 12,
};

const topActions = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  alignItems: "center",
};

const panel = {
  marginTop: 14,
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  padding: 14,
};

const metaRow = {
  marginTop: 14,
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
};

const metaPill = {
  background: "rgba(255,255,255,0.70)",
  border: "1px solid #e5e7eb",
  borderRadius: 999,
  padding: "8px 12px",
  fontWeight: 900,
  fontSize: 12,
  color: "#0f172a",
};

const emptyBox = {
  marginTop: 14,
  padding: 12,
  borderRadius: 12,
  border: "1px dashed #cbd5e1",
  color: "#64748b",
  fontWeight: 800,
  fontSize: 13,
  background: "rgba(248,250,252,0.85)",
};

/* SEARCH */
const searchBox = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  background: "rgba(255,255,255,0.70)",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: "10px 12px",
  minWidth: 340,
};

const searchInput = {
  border: "none",
  outline: "none",
  background: "transparent",
  width: 280,
  fontWeight: 800,
  color: "#0f172a",
};

const iconBtn = {
  border: "none",
  background: "transparent",
  cursor: "pointer",
  padding: 2,
  display: "grid",
  placeItems: "center",
};

/* KPI */
const kpiGrid = {
  marginTop: 14,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 14,
};

const kpiCard = {
  position: "relative",
  overflow: "hidden",
  borderRadius: 16,
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.80)",
  boxShadow: "0 10px 22px rgba(2,6,23,0.05)",
  minHeight: 84,
};

const kpiStripe = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: 10,
  background: "rgba(15,23,42,0.88)", // ✅ franja gris oscuro
};

const kpiBody = {
  padding: 14,
  paddingTop: 18,
  display: "flex",
  gap: 12,
  alignItems: "center",
};

const kpiIconWrap = {
  width: 42,
  height: 42,
  borderRadius: 14,
  display: "grid",
  placeItems: "center",
  background: "rgba(249,115,22,0.92)", // ✅ naranja
  border: "1px solid rgba(251,146,60,0.90)",
  boxShadow: "0 10px 22px rgba(249,115,22,0.18)",
};

const kpiValue = {
  fontSize: 28,
  fontWeight: 950,
  color: "#0f172a",
  lineHeight: 1,
};

const kpiTitle = {
  marginTop: 4,
  fontSize: 12,
  fontWeight: 900,
  color: "#64748b",
  letterSpacing: 0.6,
  textTransform: "uppercase",
};

/* EQUIPMENT GROUP CARD */
const equipmentCard = {
  borderRadius: 18,
  border: "1px solid rgba(226,232,240,0.95)",
  overflow: "hidden",
  background: "rgba(255,255,255,0.78)",
  boxShadow: "0 12px 28px rgba(2,6,23,0.06)",
};

const equipmentStripe = {
  background: "linear-gradient(90deg, rgba(15,23,42,0.92), rgba(30,41,59,0.86))",
  padding: 14,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const eqIconWrap = {
  width: 44,
  height: 44,
  borderRadius: 14,
  display: "grid",
  placeItems: "center",
  background: "rgba(249,115,22,0.92)",
  border: "1px solid rgba(251,146,60,0.90)",
  color: "#0b1220",
};

const eqTitle = {
  color: "#fff",
  fontWeight: 950,
  fontSize: 18,
  letterSpacing: 0.2,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  maxWidth: 520,
};

const eqSub = {
  marginTop: 4,
  color: "rgba(226,232,240,0.92)",
  fontWeight: 800,
  fontSize: 12,
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  alignItems: "center",
};

const eqCodePill = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "4px 10px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.12)",
  border: "1px solid rgba(226,232,240,0.22)",
  color: "rgba(255,255,255,0.95)",
  fontWeight: 950,
};

const critPill = (label) => {
  const isVery = label === "MUY CRÍTICO";
  return {
    padding: "6px 10px",
    borderRadius: 999,
    border: `1px solid ${isVery ? "rgba(251,113,133,0.35)" : "rgba(226,232,240,0.22)"}`,
    background: isVery ? "rgba(251,113,133,0.14)" : "rgba(255,255,255,0.12)",
    color: isVery ? "rgba(255,241,242,0.95)" : "rgba(255,255,255,0.92)",
    fontWeight: 950,
    fontSize: 12,
    letterSpacing: 0.4,
  };
};

const routesGrid = {
  padding: 14,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
  gap: 14,
  alignItems: "start",
};

const btnPrimarySlim = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 14px",
  borderRadius: 12,
  border: "1px solid rgba(249,115,22,0.55)",
  background: "rgba(249,115,22,0.95)",
  color: "#0b1220",
  fontWeight: 900,
  fontSize: 14,
  cursor: "pointer",
  boxShadow: "0 6px 14px rgba(249,115,22,0.18)",
  transition: "all 140ms ease",
};
