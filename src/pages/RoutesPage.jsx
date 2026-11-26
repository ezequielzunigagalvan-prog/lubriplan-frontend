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
import { RouteSkeleton } from "../components/ui/CardSkeleton";
import "./TechniciansPage.css";
import "./RoutesPage.css";
import { daysFromToday, routeEquipmentList } from "../utils/routeFrequency";

const STATUS_FILTERS = [
  { key: "ALL", label: "Todas" },
  { key: "OVERDUE", label: "Atrasadas" },
  { key: "TODAY", label: "Hoy" },
  { key: "WEEK", label: "Próximos 7 días" },
  { key: "NO_TECH", label: "Sin técnico" },
  { key: "MULTI", label: "Varios equipos" },
  { key: "EVIDENCE", label: "Foto obligatoria" },
];

function matchesStatus(r, key) {
  const diff = daysFromToday(r?.nextDate);
  if (key === "OVERDUE") return diff != null && diff < 0;
  if (key === "TODAY") return diff === 0;
  if (key === "WEEK") return diff != null && diff >= 0 && diff <= 7;
  if (key === "NO_TECH") return !(r?.technicianId ?? r?.technician?.id);
  if (key === "MULTI") return routeEquipmentList(r).length > 1;
  if (key === "EVIDENCE") return Boolean(r?.evidenceRequired);
  return true;
}

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
    imagePublicId: route.imagePublicId ?? "",
    monthlyAnchorDay: route.monthlyAnchorDay ?? null,
    evidenceRequired: Boolean(route.evidenceRequired),
    equipments: Array.isArray(route.equipments) ? route.equipments : [],
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
  const [statusFilter, setStatusFilter] = useState("ALL");
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
  } catch {
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
    } catch {
      if (!alive) return;
      pushToast("error", "Error", "Error cargando rutas.");
      setRoutes([]);
    } finally {
      if (alive) setLoading(false);
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
    } catch {
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

  const handleSaveRoute = async () => {
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
    pushToast("error", "No se pudo asignar", err?.message || "Ocurrió un error al actualizar la ruta.");
  }
};

  const handleDeleteRoute = async (id) => {
    if (!canDeleteRoutes) return;

    if (!confirm("¿Eliminar esta ruta? Sus actividades pendientes se eliminan; las completadas se conservan en el historial.")) return;

    try {
      const res = await deleteRoute(id);
      setRoutes((prev) => prev.filter((r) => r.id !== id));
      pushToast("success", "Ruta eliminada", res?.preserved ? `${res.preserved} actividad${res.preserved === 1 ? "" : "es"} completada${res.preserved === 1 ? "" : "s"} se conserva${res.preserved === 1 ? "" : "n"} en el historial.` : "La ruta fue eliminada correctamente.");
    } catch (err) {
      pushToast("error", "No se pudo eliminar", err?.message || "Ocurrió un error eliminando la ruta.");
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
  const base = (routes || []).filter((r) => matchesStatus(r, statusFilter));
  if (!q) return base;

  return base.filter((r) => {
    const extraEq = routeEquipmentList(r).some((e) => norm(e?.name).includes(q) || norm(e?.code).includes(q));
    if (extraEq) return true;
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
}, [routes, search, statusFilter]);

  // ✅ orden estable (por id desc)
  const sorted = useMemo(() => {
    return [...(filtered || [])].sort((a, b) => (Number(b?.id) || 0) - (Number(a?.id) || 0));
  }, [filtered]);

  const kpis = useMemo(() => {
    const equipmentsSet = new Set();
    const count = (key) => (routes || []).filter((r) => matchesStatus(r, key)).length;
    (routes || []).forEach((r) => routeEquipmentList(r).forEach((e) => e?.id != null && equipmentsSet.add(String(e.id))));
    return {
      equipments: equipmentsSet.size,
      routes: (routes || []).length,
      overdue: count("OVERDUE"),
      today: count("TODAY"),
      noTech: count("NO_TECH"),
    };
  }, [routes]);

  // ✅ agrupar por equipo
  const grouped = useMemo(() => {
    const map = new Map();

    for (const r of sorted) {
      const eq = r?.equipment || null;
      const eqId = eq?.id ?? r?.equipmentId ?? null;

      const multi = routeEquipmentList(r).length > 1;
      const key = multi ? "MULTI" : eqId != null ? String(eqId) : "NO_EQUIPMENT";
      if (!map.has(key)) {
        map.set(key, { equipment: multi ? null : eq, equipmentId: multi ? "MULTI" : eqId, multi, routes: [] });
      }
      map.get(key).routes.push(r);
    }

    const arr = Array.from(map.values());
    arr.sort((a, b) => {
      if (a.multi !== b.multi) return a.multi ? -1 : 1;
      const an = String(a?.equipment?.name || "Sin equipo").toLowerCase();
      const bn = String(b?.equipment?.name || "Sin equipo").toLowerCase();
      return an.localeCompare(bn);
    });

    return arr;
  }, [sorted]);

  return (
    <MainLayout>
      <div className="tch lp-fade-in">
        <header className="tch-head">
          <div>
            <div className="tch-kicker">Rutas de lubricación{currentPlant?.name ? ` · ${currentPlant.name}` : ""}</div>
            <h1 className="tch-title">Rutas</h1>
            <div className="tch-sub">
              Qué se lubrica, con qué, cuánto, cada cuándo y quién lo hace.
              {!canEditRoutes ? " · Solo visualización" : role === "SUPERVISOR" ? " · Supervisor (sin eliminar)" : ""}
            </div>
          </div>
          <div className="tch-head-actions">
            <label className="tch-search">
              <Icon name="search" size="sm" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar ruta, equipo, TAG, lubricante…" />
              {search ? (
                <button type="button" className="rp-clear" onClick={() => setSearch("")} aria-label="Limpiar búsqueda">
                  <Icon name="close" size="sm" />
                </button>
              ) : null}
            </label>
            {canEditRoutes ? (
              <button
                type="button"
                className="tch-btn tch-btn-primary"
                onClick={() => {
                  setEditingRoute(null);
                  setShowNewRoute(true);
                }}
              >
                <Icon name="plus" size="sm" /> Nueva ruta
              </button>
            ) : null}
          </div>
        </header>

        {!loading ? (
          <section className="tch-kpis rp-kpis" aria-label="Resumen de rutas">
            {[
              { k: "ALL", icon: "route", v: kpis.routes, l: "Rutas", tone: "is-orange" },
              { k: null, icon: "equipment", v: kpis.equipments, l: "Equipos cubiertos", tone: "" },
              { k: "OVERDUE", icon: "alert", v: kpis.overdue, l: "Atrasadas", tone: kpis.overdue ? "is-red" : "" },
              { k: "TODAY", icon: "calendar", v: kpis.today, l: "Para hoy", tone: kpis.today ? "is-orange" : "" },
              { k: "NO_TECH", icon: "user", v: kpis.noTech, l: "Sin técnico", tone: kpis.noTech ? "is-orange" : "" },
            ].map((x) => (
              <button
                key={x.l}
                type="button"
                className={`tch-kpi rp-kpi ${x.k && statusFilter === x.k ? "is-on" : ""}`}
                onClick={() => x.k && setStatusFilter(x.k)}
                disabled={!x.k}
              >
                <div className={`tch-kpi-icon ${x.tone}`}><Icon name={x.icon} /></div>
                <div style={{ minWidth: 0, textAlign: "left" }}>
                  <div className="tch-kpi-value">{x.v}</div>
                  <div className="tch-kpi-label">{x.l}</div>
                </div>
              </button>
            ))}
          </section>
        ) : null}

        {!loading && routes.length > 0 ? (
          <div className="tch-toolbar">
            <div className="tch-tabs rp-tabs" role="group" aria-label="Filtrar rutas">
              {STATUS_FILTERS.map((f) => (
                <button key={f.key} type="button" className="tch-tab" aria-pressed={statusFilter === f.key} onClick={() => setStatusFilter(f.key)}>
                  {f.label}
                </button>
              ))}
            </div>
            <span className="rp-meta">
              Mostrando <b>{sorted.length}</b> de {routes.length}
            </span>
          </div>
        ) : null}

        {!loading && routes.length > 0 && sorted.length === 0 ? (
          <div className="rp-empty">
            <b>Sin resultados</b>
            <span>Ninguna ruta coincide con el filtro o la búsqueda.</span>
            <button type="button" className="tch-btn tch-btn-ghost" onClick={() => { setStatusFilter("ALL"); setSearch(""); }}>
              Ver todas
            </button>
          </div>
        ) : null}

        {/* CONTENT */}
        {loading && <RouteSkeleton count={4} />}

        {!loading && routes.length === 0 && (
          <div style={emptyBox}>
            <div style={emptyIconWrap}>
              <Icon name="route" style={{ width: 24, height: 24, color: "#94a3b8" }} />
            </div>
            <div style={emptyTitle}>Sin rutas</div>
            <div style={emptyDesc}>
              {canEditRoutes
                ? "No hay rutas registradas. Crea la primera para comenzar."
                : "No hay rutas registradas para esta planta."}
            </div>
            {canEditRoutes && (
              <button type="button" style={emptyActionPrimary} onClick={() => setShowNewRoute(true)}>
                + Nueva ruta
              </button>
            )}
          </div>
        )}

        {/* ✅ Agrupado por equipo */}
        {!loading && grouped.length > 0 ? (
          <div className="rp-groups">
            {grouped.map((group, idx) => (
              <EquipmentGroupCard
  key={String(group.equipmentId ?? `no-eq-${idx}`)}
  equipment={group.equipment}
  multi={group.multi}
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

const KPI_ICON_TONES = {
  navy:   { background: "rgba(15,23,42,0.06)",   border: "1px solid rgba(15,23,42,0.12)",    color: "#334155" },
  orange: { background: "rgba(249,115,22,0.10)",  border: "1px solid rgba(249,115,22,0.28)",  color: "#9a3412" },
  blue:   { background: "rgba(59,130,246,0.08)",  border: "1px solid rgba(59,130,246,0.22)",  color: "#1e40af" },
  green:  { background: "rgba(34,197,94,0.09)",   border: "1px solid rgba(34,197,94,0.22)",   color: "#166534" },
  red:    { background: "rgba(239,68,68,0.08)",   border: "1px solid rgba(239,68,68,0.22)",   color: "#991b1b" },
  amber:  { background: "rgba(245,158,11,0.10)",  border: "1px solid rgba(245,158,11,0.25)",  color: "#78350f" },
  slate:  { background: "rgba(100,116,139,0.08)", border: "1px solid rgba(100,116,139,0.20)", color: "#475569" },
};

function KpiCard({ title, value, icon, accentColor = "#0f172a", iconTone = "navy", small, onClick }) {
  const tone = KPI_ICON_TONES[iconTone] || KPI_ICON_TONES.navy;
  return (
    <div
      style={{ ...kpiCard, borderTop: `4px solid ${accentColor}`, cursor: onClick ? "pointer" : "default" }}
      className="lpKpiCard"
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
    >
      <div style={kpiInner}>
        <div style={{ ...kpiIconBox, ...tone }}>
          <Icon name={icon} style={{ width: 20, height: 20 }} />
        </div>
        <div style={kpiRight}>
          <div style={small ? kpiValueSmall : kpiValue}>{value}</div>
          <div style={kpiLabel}>{title}</div>
        </div>
      </div>
    </div>
  );
}

function EquipmentGroupCard({
  equipment,
  multi = false,
  routes,
  canEditRoutes,
  canDeleteRoutes,
  onEditRoute,
  onDeleteRoute,
  technicians,
  onAssignTechnician,
}) {
  const eqName = multi ? "Rutas con varios equipos" : equipment?.name || "Sin equipo";
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
    <section className={`rp-group ${multi ? "is-multi" : ""} ${(routes?.length || 0) >= 3 ? "is-wide" : ""}`}>
      <header className="rp-group-head">
        <span className="rp-group-icon"><Icon name={multi ? "grid" : "equipment"} /></span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="rp-group-title">
            {eqName}
            {critLabel ? <span className={`rp-crit ${critLabel.includes("CR") ? "is-red" : critLabel === "MEDIO" ? "is-amber" : ""}`}>{critLabel}</span> : null}
          </div>
          <div className="rp-group-sub">
            {eqCode ? <span className="rp-code">{eqCode}</span> : null}
            {eqLocation ? <span>{eqLocation}</span> : null}
            {multi ? <span>Una actividad con lista de equipos</span> : null}
          </div>
        </div>
        <span className="rp-group-count">
          <b>{routes?.length || 0}</b> ruta{routes?.length === 1 ? "" : "s"}
        </span>
      </header>
      <div className="rp-group-body">
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
    </section>
  );
}

/* =========================
   STYLES (alineado a tu look)
========================= */








const _panel = {
  marginTop: 14,
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  padding: 14,
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
  maxWidth: "36ch",
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

/* SEARCH */



/* KPI */

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
  color: "#64748b",
  letterSpacing: 0.7,
  textTransform: "uppercase",
};

/* EQUIPMENT GROUP CARD */








