import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { preventiveOrdersService } from "../services/preventiveOrdersService";
import { useAuth } from "../context/AuthContext";
import { usePlant } from "../context/PlantContext";

export default function PreventiveOrdersTechnician() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentPlantId } = usePlant();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("todas");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    setLoading(true);
    try {
      const filters = { status: "OPEN,IN_PROGRESS", limit: 100 };
      if (user?.technicianId) {
        filters.assignedTo = user.technicianId;
      }
      const data = await preventiveOrdersService.list(filters);
      setOrders(data.data || []);
    } catch (err) {
      console.error("Error loading orders:", err);
    } finally {
      setLoading(false);
    }
  }

  const filteredOrders = useMemo(() => {
    const now = new Date();

    return orders.filter((order) => {
      const scheduledDate = new Date(order.scheduledDate);
      scheduledDate.setHours(0, 0, 0, 0);

      switch (filter) {
        case "hoy":
          return scheduledDate.getTime() === today.getTime();
        case "pendientes":
          return scheduledDate > today && order.status !== "COMPLETED";
        case "atrasadas":
          return scheduledDate < today && order.status !== "COMPLETED";
        case "proximas":
          const nextWeek = new Date(today);
          nextWeek.setDate(nextWeek.getDate() + 7);
          return scheduledDate > today && scheduledDate <= nextWeek && order.status !== "COMPLETED";
        default:
          return true;
      }
    });
  }, [orders, filter]);

  const statusColors = {
    DRAFT: "#94a3b8",
    OPEN: "#3b82f6",
    IN_PROGRESS: "#f59e0b",
    COMPLETED: "#10b981",
    CANCELLED: "#ef4444",
  };

  const statusLabels = {
    DRAFT: "Borrador",
    OPEN: "Abierta",
    IN_PROGRESS: "En progreso",
    COMPLETED: "Completada",
    CANCELLED: "Cancelada",
  };

  return (
    <MainLayout>
      <div style={{ padding: 20, minHeight: "100vh", background: "#0f172a" }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: "#f1f5f9", marginBottom: 30 }}>
          Mis Órdenes de Lubricación Preventiva
        </h1>

        {/* Filtros */}
        <div style={{ marginBottom: 20, display: "flex", gap: 10, overflowX: "auto", paddingBottom: 8 }}>
          {["todas", "hoy", "pendientes", "atrasadas", "proximas"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "1.5px solid",
                background: filter === f ? "#f97316" : "transparent",
                color: filter === f ? "white" : "#94a3b8",
                borderColor: filter === f ? "#f97316" : "#334155",
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
                textTransform: "capitalize",
                transition: "all 0.15s",
              }}
            >
              {f === "todas" && "Todas"}
              {f === "hoy" && "Hoy"}
              {f === "pendientes" && "Pendientes"}
              {f === "atrasadas" && "Atrasadas"}
              {f === "proximas" && "Próximas"}
            </button>
          ))}
        </div>

        {/* Órdenes */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>
            Cargando órdenes…
          </div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "#64748b" }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>📋</div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4, color: "#cbd5e1" }}>
              No hay órdenes en este filtro
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            {filteredOrders.map((order) => {
              const progress = order.progress?.total > 0
                ? Math.round((order.progress.completed / order.progress.total) * 100)
                : 0;
              const borderColor = statusColors[order.status];

              return (
                <div
                  key={order.id}
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    border: "1px solid #334155",
                    borderLeft: `4px solid ${borderColor}`,
                    background: "#1a1f26",
                    transition: "all 0.2s",
                    cursor: "pointer",
                  }}
                  onClick={() => navigate(`/preventive-orders/${order.id}/execute`)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#202732";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#1a1f26";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  {/* Encabezado */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#f1f5f9" }}>
                      {order.title || `Orden #${order.id}`}
                    </h3>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "6px 12px",
                        borderRadius: 6,
                        background: `${borderColor}15`,
                        color: borderColor,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {statusLabels[order.status]}
                    </div>
                  </div>

                  {/* Equipo y fecha */}
                  <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 12 }}>
                    ⚙️ {order.equipment?.name} • 📅 {new Date(order.scheduledDate).toLocaleDateString('es-MX')}
                  </div>

                  {/* Progreso */}
                  {order.progress && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>
                        {order.progress.completed}/{order.progress.total} items · {progress}%
                      </div>
                      <div style={{ height: 6, background: "#334155", borderRadius: 3, overflow: "hidden" }}>
                        <div
                          style={{
                            height: "100%",
                            background: borderColor,
                            width: `${progress}%`,
                            transition: "width 0.3s ease",
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Botón ejecutar */}
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
                    <button
                      style={{
                        padding: "8px 16px",
                        height: 36,
                        borderRadius: 8,
                        border: "none",
                        background: "#f97316",
                        color: "white",
                        fontWeight: 700,
                        fontSize: 12,
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#ea580c";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#f97316";
                      }}
                    >
                      Ejecutar →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
