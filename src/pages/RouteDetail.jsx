// src/pages/RouteDetailPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import NewRouteModal from "../components/routes/NewRouteModal";
import { getRoutes, deleteRoute } from "../services/routesService";
import { getExecutionsByRoute } from "../services/executionsService";
import { Icon } from "../components/ui/lpIcons";
import { useAuth } from "../context/AuthContext";
import { usePlant } from "../context/PlantContext";
import { formatRouteDisplayName } from "../utils/routeNames";
// Si quieres toast global como en RoutesPage, descomenta:
// import Toast from "../components/ui/Toast";

/* =========================
   HELPERS (fechas locales)
========================= */
const toLocalYMD = (d) => {
  const dt = d instanceof Date ? d : new Date(d);
  if (!dt || Number.isNaN(dt.getTime())) return "?";
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export default function RouteDetailPage() {
  const { id } = useParams();
  const routeId = Number(id);
  const navigate = useNavigate();

  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [showEdit, setShowEdit] = useState(false);

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const { user, permissions } = useAuth();
  const { currentPlantId } = usePlant();
const role = String(user?.role || "TECHNICIAN").toUpperCase();

const canManageRoutes = Boolean(permissions?.canManageRoutes);
const canDeleteRoute = canManageRoutes && role === "ADMIN";

  // Si quieres Toast aqu? también:
  // const [toast, setToast] = useState(null);
  // const pushToast = (type, title, message) => {
  //   setToast({ id: crypto.randomUUID?.() || String(Date.now()), type, title, message });
  // };
  // useEffect(() => {
  //   if (!toast) return;
  //   const t = window.setTimeout(() => setToast(null), 2200);
  //   return () => window.clearTimeout(t);
  // }, [toast]);

  /* ===== cargar ruta (de listado) ===== */
  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setErr("");
        setLoading(true);

        const response = await getRoutes();
        const routes = Array.isArray(response?.items)
          ? response.items
          : Array.isArray(response)
          ? response
          : [];
        const found = routes.find((r) => Number(r.id) === routeId) || null;

        if (!alive) return;
        setRoute(found);
        if (!found) {
          setErr("No se pudo encontrar la ruta en la planta actual.");
        }
      } catch (e) {
        console.error(e);
        if (!alive) return;
        setErr("No se pudo cargar el detalle de la ruta.");
        setRoute(null);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    if (!currentPlantId) {
      setRoute(null);
      setHistory([]);
      setErr("");
      setLoading(false);
      return () => {
        alive = false;
      };
    }

    if (!Number.isFinite(routeId)) {
      setErr("ID de ruta inválido.");
      setLoading(false);
      return () => {
        alive = false;
      };
    }

    load();
    return () => {
      alive = false;
    };
  }, [currentPlantId, routeId]);

  /* ===== cargar historial por ruta ===== */
  useEffect(() => {
    let alive = true;

    if (!currentPlantId || !route?.id) {
      setHistory([]);
      setHistoryLoading(false);
      return () => {
        alive = false;
      };
    }

    async function loadHistory() {
      try {
        setHistoryLoading(true);
        const data = await getExecutionsByRoute(route.id);
        if (!alive) return;
        setHistory(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        if (!alive) return;
        setHistory([]);
      } finally {
        if (!alive) return;
        setHistoryLoading(false);
      }
    }

    loadHistory();
    return () => {
      alive = false;
    };
  }, [currentPlantId, route?.id]);

  /* ===== computed UI ===== */
  const equipmentName = useMemo(() => {
    if (route?.equipment?.name) return route.equipment.name;
    if (route?.equipmentName) return route.equipmentName;
    return "Equipo no asignado";
  }, [route]);

  const equipmentCode = useMemo(() => {
    return (
      route?.equipment?.code ||
      route?.equipment?.tag ||
      route?.equipmentCode ||
      route?.equipmentTag ||
      ""
    );
  }, [route]);
  const isInspectionRoute = useMemo(
    () => String(route?.routeKind || "").trim().toUpperCase() === "INSPECTION",
    [route]
  );
  const routeDisplayName = useMemo(
    () => formatRouteDisplayName(route?.name, route?.routeKind, "Detalle de ruta"),
    [route]
  );

  const qtyLabel = useMemo(() => {
    if (route?.quantity == null) return isInspectionRoute ? "Consumo opcional" : "?";
    return `${route.quantity}${route.unit ? ` ${route.unit}` : ""}${isInspectionRoute ? " opcional" : ""}`;
  }, [isInspectionRoute, route]);

  const frequencyLabel = useMemo(() => {
    const d = route?.frequencyDays;
    if (d == null) return route?.frequency || "?";
    if (d === 1) return "Diaria (1 día)";
    if (d === 7) return "Semanal (7 días)";
    if (d === 15) return "Quincenal (15 días)";
    if (d === 30) return "Mensual (30 días)";
    if (d === 60) return "Bimestral (60 días)";
    if (d === 120) return "Cuatrimestral (120 días)";
    if (d === 180) return "Semestral (180 días)";
    if (d === 365) return "Anual (365 días)";
    return `${d} días`;
  }, [route]);

  const prettyStatus = (s) => {
    if (s === "COMPLETED") return { label: "Completada", icon: "check" };
    if (s === "OVERDUE") return { label: "Atrasada", icon: "warn" };
    return { label: "Pendiente", icon: "clock" };
  };

  const date10 = (d) => (d ? toLocalYMD(d) : "?");

  /* ===== acciones ===== */
  const handleDelete = async () => {
    if (!route?.id) return;
    if (!confirm("?Eliminar esta ruta?")) return;

    try {
      await deleteRoute(route.id);
      // pushToast("success", "Ruta eliminada", "La ruta se elimin? correctamente.");
      navigate("/routes");
    } catch (e) {
      console.error(e);
      // pushToast("error", "Error", "No se pudo eliminar la ruta.");
      alert("Error eliminando ruta");
    }
  };

  const handleSavedFromModal = (savedRoute) => {
    if (!savedRoute?.id) return;
    setRoute(savedRoute);
    setShowEdit(false);
    // pushToast("success", "Ruta actualizada", "Los cambios se guardaron correctamente.");
  };

  return (
    <MainLayout>
      <div style={pageShell}>
        {/* TOP */}
        <div style={topBar}>
          <div style={{ minWidth: 0 }}>
            <div style={kicker}>LUBRIPLAN - RUTAS</div>
            <h1 style={pageTitle}>{routeDisplayName}</h1>

            <div style={subRow}>
              <span style={pill}>
                <Icon name="list" style={{ width: 16, height: 16 }} />
                <span style={{ fontWeight: 950 }}>{equipmentName}</span>
              </span>

              {equipmentCode ? (
                <span style={pillMuted} title="Código / TAG">
                  <Icon name="tag" style={{ width: 14, height: 14 }} />
                  <span>{equipmentCode}</span>
                </span>
              ) : null}
            </div>
          </div>

          <div style={topActions}>
            <button style={btnGhost} onClick={() => navigate("/routes")}>
               Volver
            </button>

            <button
              style={btnSecondary}
              onClick={() => setShowEdit(true)}
              disabled={!route} 
              title="Editar ruta"
              type="button"
            >
              <Icon name="edit" style={{ width: 16, height: 16 }} />
              Editar
            </button>

            {canDeleteRoute ? (
  <button
    style={btnDanger}
    onClick={handleDelete}
    disabled={!route}
    title="Eliminar ruta"
    type="button"
  >
    <Icon name="trash" style={{ width: 16, height: 16 }} />
    Eliminar
  </button>
) : null}
          </div>
        </div>

        {/* STATES */}
        {loading && (
          <div style={panel}>
            <p style={{ margin: 0, fontWeight: 900, color: "#0f172a" }}>Cargando detalle...</p>
          </div>
        )}

        {!loading && err && (
          <div style={errorBox}>
            <div style={{ fontWeight: 950 }}>Error</div>
            <div style={{ marginTop: 6 }}>{err}</div>
          </div>
        )}

        {!loading && !err && !route && (
          <div style={emptyBox}>
            No encontr? la ruta con id <b>{id}</b>.
          </div>
        )}

        {/* CONTENT */}
        {!loading && !err && route ? (
          <div style={mainCard}>
            {/* GRID principal */}
            <div style={grid}>
              <InfoCard
                title="Lubricante"
                value={route.lubricantType || (isInspectionRoute ? "Inspección" : "?")}
                sub={
                  route.lubricantName ||
                  route?.lubricant?.name ||
                  (isInspectionRoute ? "Lubricante opcional" : "")
                }
                icon="drop"
              />
              <InfoCard title="Cantidad" value={qtyLabel} sub={route.points ? `por punto ? ${route.points} punto(s)` : ""} icon="scale" />
              <InfoCard title="Frecuencia" value={frequencyLabel} sub={route.nextDate ? `Próxima: ${date10(route.nextDate)}` : ""} icon="calendar" />
            <InfoCard title="Método" value={route.method || "—"} sub={route.lastDate ? `Última: ${date10(route.lastDate)}` : ""} icon="settings" />
            </div>

            {/* instrucciones */}
            <div style={sectionCard}>
              <div style={sectionHeader}>
                <div style={sectionTitle}>Instrucciones</div>
              </div>

              <div style={notesText}>
                {route.instructions ? (
                  <div style={{ whiteSpace: "pre-wrap" }}>{route.instructions}</div>
                ) : (
                  <span style={{ color: "#64748b", fontWeight: 800 }}>?</span>
                )}
              </div>
            </div>

            {/* historial */}
            <div style={sectionCard}>
              <div style={sectionHeader}>
                <div>
                  <div style={sectionTitle}>Historial de ejecuciones</div>
              <div style={sectionSub}>Últimos registros de esta ruta</div>
                </div>

                <button
                  style={btnGhost}
                  onClick={() => navigate(`/routes/${routeId}/activities`)}
                  disabled={!route?.id}
                  title="Ver todas las ejecuciones"
                  type="button"
                >
                  Ver todas 
                </button>
              </div>

              {historyLoading ? (
                <div style={{ color: "#64748b", fontWeight: 800 }}>Cargando historial...</div>
              ) : history.length === 0 ? (
                <div style={{ color: "#64748b", fontWeight: 800 }}>
                  Aún no hay ejecuciones para esta ruta.
                </div>
              ) : (
                <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
                  {history.map((ex) => {
                    const st = prettyStatus(ex.status);
                    return (
                      <div key={ex.id} style={historyRow}>
                        <div style={historyTop}>
                          <span style={statusPill(ex.status)}>
                            <Icon name={st.icon} style={{ width: 14, height: 14 }} />
                            {st.label}
                          </span>

                          <div style={historyDates}>
                            <span>
                              <b>Programada:</b> {date10(ex.scheduledAt)}
                            </span>
                            <span>
                              <b>Realizada:</b> {date10(ex.executedAt)}
                            </span>
                          </div>
                        </div>

                        <div style={historyMeta}>
                          <span>
                            <b>Técnico:</b> {ex.technician?.name || "?"}
                          </span>
                          <span>
                            <b>Cantidad:</b>{" "}
                            {ex.usedQuantity != null
                              ? `${ex.usedQuantity}${route?.unit ? ` ${route.unit}` : ""}`
                              : "?"}
                          </span>
                          <span>
                            <b>Condición:</b> {ex.condition || "?"}
                          </span>
                        </div>

                        {ex.observations ? (
                          <div style={historyObs}>
                            <b>Obs:</b> {ex.observations}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {/* MODAL EDIT */}
      <NewRouteModal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        onSave={handleSavedFromModal}
        initialData={{
          ...route,
          equipmentId: route?.equipmentId ?? route?.equipment?.id,
        }}
      />

      {/* Si usas Toast aqu? también */}
      {/* <Toast toast={toast} onClose={() => setToast(null)} /> */}
    </MainLayout>
  );
}

/* =========================
   UI pieces
========================= */
function InfoCard({ title, value, sub, icon }) {
  return (
    <div style={infoCard}>
      <div style={infoTop}>
        <div style={infoTitle}>{title}</div>
        <div style={infoIcon}>
          <Icon name={icon} style={{ width: 18, height: 18, color: "#0b1220" }} />
        </div>
      </div>

      <div style={infoValue}>{value}</div>
      {sub ? <div style={infoSub}>{sub}</div> : <div style={infoSubMuted}> </div>}
    </div>
  );
}

/* =========================
   STYLES (LubriPlan premium)
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
  marginBottom: 14,
};

const kicker = {
  fontSize: 11,
  fontWeight: 950,
  color: "#64748b",
  letterSpacing: 1.2,
};

const pageTitle = {
  margin: "6px 0 0",
  fontSize: 28,
  fontWeight: 950,
  color: "#0f172a",
  letterSpacing: 0.2,
  lineHeight: 1.05,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  maxWidth: 760,
};

const subRow = {
  marginTop: 10,
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  alignItems: "center",
};

const pill = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid #e5e7eb",
  background: "rgba(255,255,255,0.70)",
  color: "#0f172a",
  fontWeight: 900,
  fontSize: 12,
};

const pillMuted = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.55)",
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
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  padding: 14,
};

const errorBox = {
  background: "rgba(239,68,68,0.10)",
  border: "1px solid rgba(239,68,68,0.28)",
  padding: 12,
  borderRadius: 14,
  color: "#7f1d1d",
  fontWeight: 850,
};

const emptyBox = {
  background: "rgba(148,163,184,0.10)",
  border: "1px solid rgba(148,163,184,0.30)",
  padding: 12,
  borderRadius: 14,
  color: "#334155",
  fontWeight: 850,
};

const mainCard = {
  background: "rgba(255,255,255,0.78)",
  borderRadius: 18,
  padding: 14,
 border: "3px solid rgba(203,213,225,0.95)",
  boxShadow: "0 14px 30px rgba(2,6,23,0.06)",
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 12,
};

const infoCard = {
  borderRadius: 16,
  border: "2px solid rgba(226,232,240,0.98)", // contorno fuerte
  background: "rgba(255,255,255,0.80)",
  boxShadow: "0 10px 22px rgba(2,6,23,0.05)",
  padding: 14,
  minHeight: 98,
};

const infoTop = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
};

const infoTitle = {
  fontSize: 12,
  fontWeight: 950,
  color: "#64748b",
  letterSpacing: 0.6,
  textTransform: "uppercase",
};

const infoIcon = {
  width: 38,
  height: 38,
  borderRadius: 14,
  display: "grid",
  placeItems: "center",
  background: "rgba(249,115,22,0.92)",
  border: "1px solid rgba(251,146,60,0.90)",
  boxShadow: "0 10px 22px rgba(249,115,22,0.16)",
};

const infoValue = {
  marginTop: 10,
  fontSize: 16,
  fontWeight: 950,
  color: "#0f172a",
};

const infoSub = {
  marginTop: 6,
  fontSize: 12,
  fontWeight: 800,
  color: "#475569",
};

const infoSubMuted = {
  marginTop: 6,
  fontSize: 12,
  fontWeight: 800,
  color: "transparent",
  userSelect: "none",
};

const sectionCard = {
  marginTop: 12,
  borderRadius: 16,
  border: "2px solid rgba(226,232,240,0.98)", // contorno fuerte
  background: "rgba(255,255,255,0.80)",
  boxShadow: "0 10px 22px rgba(2,6,23,0.05)",
  padding: 14,
};

const sectionHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
};

const sectionTitle = {
  fontWeight: 950,
  color: "#0f172a",
  letterSpacing: 0.5,
  fontSize: 12,
  textTransform: "uppercase",
};

const sectionSub = {
  marginTop: 6,
  color: "#64748b",
  fontWeight: 800,
  fontSize: 12,
};

const notesText = {
  marginTop: 10,
  color: "#334155",
  fontWeight: 800,
  lineHeight: 1.45,
};

const historyRow = {
  borderRadius: 14,
  border: "2px solid rgba(226,232,240,0.98)", // contorno más grueso
  background: "rgba(248,250,252,0.78)",
  padding: 12,
};

const historyTop = {
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  alignItems: "center",
  flexWrap: "wrap",
};

const historyDates = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  color: "#475569",
  fontWeight: 800,
  fontSize: 12,
};

const historyMeta = {
  marginTop: 10,
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  color: "#475569",
  fontWeight: 800,
  fontSize: 13,
};

const historyObs = {
  marginTop: 8,
  color: "#334155",
  fontWeight: 800,
  fontSize: 13,
};

const statusPill = (raw) => {
  const isDone = raw === "COMPLETED";
  const isOver = raw === "OVERDUE";
  const bg = isDone ? "rgba(34,197,94,0.12)" : isOver ? "rgba(239,68,68,0.10)" : "rgba(245,158,11,0.12)";
  const bd = isDone ? "rgba(34,197,94,0.30)" : isOver ? "rgba(239,68,68,0.28)" : "rgba(245,158,11,0.30)";
  const tx = isDone ? "#14532d" : isOver ? "#7f1d1d" : "#78350f";

  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    borderRadius: 999,
    border: `1px solid ${bd}`,
    background: bg,
    color: tx,
    fontWeight: 950,
    fontSize: 12,
  };
};

/* Buttons */
const btnGhost = {
  background: "rgba(255,255,255,0.70)",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: "10px 12px",
  cursor: "pointer",
  fontWeight: 950,
  color: "#0f172a",
};

const btnSecondary = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  background: "rgba(15,23,42,0.06)",
  border: "1px solid rgba(15,23,42,0.10)",
  color: "#0f172a",
  borderRadius: 12,
  padding: "10px 12px",
  cursor: "pointer",
  fontWeight: 950,
};

const btnDanger = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  background: "rgba(239,68,68,0.92)",
  border: "1px solid rgba(239,68,68,0.55)",
  color: "#fff",
  borderRadius: 12,
  padding: "10px 12px",
  cursor: "pointer",
  fontWeight: 950,
};


