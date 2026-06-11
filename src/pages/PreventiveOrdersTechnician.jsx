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

  const statusConfig = {
    DRAFT: { color: "#94a3b8", label: "Borrador", icon: "📝" },
    OPEN: { color: "#3b82f6", label: "Disponible", icon: "🔓" },
    IN_PROGRESS: { color: "#f59e0b", label: "Asignada a ti", icon: "🎯" },
    COMPLETED: { color: "#10b981", label: "Completada", icon: "✅" },
  };

  const filterConfig = {
    todas: { label: "Todas", icon: "📋", count: orders.length },
    hoy: { label: "Hoy", icon: "📅", count: orders.filter(o => {
      const d = new Date(o.scheduledDate);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    }).length },
    pendientes: { label: "Pendientes", icon: "⏳", count: orders.filter(o => {
      const d = new Date(o.scheduledDate);
      d.setHours(0, 0, 0, 0);
      return d > today && o.status !== "COMPLETED";
    }).length },
    atrasadas: { label: "Atrasadas", icon: "⚠️", count: orders.filter(o => {
      const d = new Date(o.scheduledDate);
      d.setHours(0, 0, 0, 0);
      return d < today && o.status !== "COMPLETED";
    }).length },
    proximas: { label: "Próximas 7 días", icon: "📈", count: orders.filter(o => {
      const d = new Date(o.scheduledDate);
      d.setHours(0, 0, 0, 0);
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      return d > today && d <= nextWeek && o.status !== "COMPLETED";
    }).length },
  };

  return (
    <MainLayout>
      <div style={{ padding: "24px", minHeight: "100vh", background: "#0f172a" }}>
        {/* Header con saludo personalizado */}
        <div style={{ marginBottom: 40 }}>
          <h1 style={{
            margin: "0 0 8px 0",
            fontSize: 32,
            fontWeight: 900,
            color: "#f1f5f9",
          }}>
            👋 Hola, {user?.name || "Técnico"}
          </h1>
          <p style={{ margin: "0", color: "#94a3b8", fontSize: 14 }}>
            Tienes {filteredOrders.length} orden{filteredOrders.length !== 1 ? "es" : ""} en el filtro actual
          </p>
        </div>

        {/* KPI Cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 12,
          marginBottom: 32,
        }}>
          {[
            { label: "Por hacer", count: orders.filter(o => o.status === "OPEN").length, color: "#3b82f6" },
            { label: "Asignadas", count: orders.filter(o => o.status === "IN_PROGRESS").length, color: "#f59e0b" },
            { label: "Completadas", count: orders.filter(o => o.status === "COMPLETED").length, color: "#10b981" },
          ].map((kpi, idx) => (
            <div
              key={idx}
              style={{
                padding: 16,
                borderRadius: 12,
                background: `linear-gradient(135deg, ${kpi.color}15, ${kpi.color}08)`,
                border: `1px solid ${kpi.color}30`,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 28, fontWeight: 900, color: kpi.color, marginBottom: 4 }}>
                {kpi.count}
              </div>
              <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>
                {kpi.label}
              </div>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div style={{
          marginBottom: 28,
          padding: 16,
          borderRadius: 16,
          background: "linear-gradient(135deg, #1e293b 0%, #1a1f26 100%)",
          border: "1px solid #334155",
          display: "flex",
          gap: 8,
          overflowX: "auto",
          paddingBottom: 8,
        }}>
          {Object.entries(filterConfig).map(([key, config]) => {
            const isActive = filter === key;
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                style={{
                  padding: "10px 16px",
                  borderRadius: 12,
                  border: "1.5px solid",
                  background: isActive
                    ? "linear-gradient(135deg, #f97316, #ea580c)"
                    : "transparent",
                  color: isActive ? "white" : "#94a3b8",
                  borderColor: isActive ? "#f97316" : "#334155",
                  fontWeight: 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.2s",
                  fontSize: 13,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = "#475569";
                    e.currentTarget.style.color = "#cbd5e1";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = "#334155";
                    e.currentTarget.style.color = "#94a3b8";
                  }
                }}
              >
                {config.icon} {config.label}
                <span style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "2px 6px",
                  borderRadius: 4,
                  background: isActive ? "rgba(255,255,255,0.2)" : "#334155",
                  color: isActive ? "white" : "#94a3b8",
                }}>
                  {config.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Contenido */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#64748b" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⏳</div>
            <div style={{ fontWeight: 600, fontSize: 16, color: "#cbd5e1" }}>
              Cargando tus órdenes…
            </div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: 80,
            background: "linear-gradient(135deg, #1e293b20, #10b96120)",
            borderRadius: 20,
            border: "2px dashed #334155",
          }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8, color: "#f1f5f9" }}>
              ¡Sin órdenes pendientes!
            </div>
            <div style={{ fontSize: 14, color: "#94a3b8" }}>
              {filter === "todas"
                ? "Espera a que tu supervisor te asigne nuevas órdenes"
                : "No hay órdenes en este filtro"}
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            {filteredOrders.map((order) => {
              const config = statusConfig[order.status];
              const progress = order.progress?.total > 0
                ? Math.round((order.progress.completed / order.progress.total) * 100)
                : 0;
              const daysUntil = Math.ceil(
                (new Date(order.scheduledDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
              );

              return (
                <div
                  key={order.id}
                  onClick={() => navigate(`/preventive-orders/${order.id}/execute`)}
                  style={{
                    padding: 20,
                    borderRadius: 16,
                    border: "1px solid #334155",
                    borderLeft: `5px solid ${config.color}`,
                    background: "linear-gradient(135deg, #1e293b 0%, #1a1f26 100%)",
                    transition: "all 0.3s",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 16,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = config.color;
                    e.currentTarget.style.boxShadow = `0 8px 24px ${config.color}25, 0 4px 12px rgba(0,0,0,0.4)`;
                    e.currentTarget.style.transform = "translateY(-4px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#334155";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  {/* Contenido principal */}
                  <div style={{ flex: 1 }}>
                    {/* Encabezado */}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                      <div>
                        <h3 style={{
                          margin: "0 0 4px 0",
                          fontSize: 18,
                          fontWeight: 900,
                          color: "#f1f5f9",
                        }}>
                          {order.title || `Orden #${order.id}`}
                        </h3>
                        <p style={{
                          margin: 0,
                          color: "#94a3b8",
                          fontSize: 13,
                        }}>
                          ⚙️ {order.equipment?.name}
                        </p>
                      </div>
                    </div>

                    {/* Info */}
                    <div style={{
                      padding: 12,
                      background: "#0f172a80",
                      borderRadius: 10,
                      border: "1px solid #334155",
                      marginBottom: 12,
                    }}>
                      <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                        gap: 12,
                        fontSize: 12,
                      }}>
                        <div>
                          <div style={{ color: "#94a3b8", marginBottom: 4 }}>📅 Fecha</div>
                          <strong style={{ color: "#f1f5f9" }}>
                            {new Date(order.scheduledDate).toLocaleDateString('es-MX')}
                          </strong>
                          {daysUntil !== 0 && (
                            <div style={{
                              fontSize: 11,
                              color: daysUntil < 0 ? "#ef4444" : "#f59e0b",
                              marginTop: 2,
                            }}>
                              {daysUntil < 0
                                ? `⚠️ ${Math.abs(daysUntil)} días atrasada`
                                : daysUntil === 0
                                ? "🎯 Hoy"
                                : `📈 En ${daysUntil} días`}
                            </div>
                          )}
                        </div>
                        <div>
                          <div style={{ color: "#94a3b8", marginBottom: 4 }}>📋 Items</div>
                          <strong style={{ color: "#f1f5f9" }}>
                            {order.progress?.completed || 0}/{order.progress?.total || 0}
                          </strong>
                        </div>
                        <div>
                          <div style={{ color: "#94a3b8", marginBottom: 4 }}>🏷️ Estado</div>
                          <div style={{
                            display: "inline-block",
                            padding: "4px 8px",
                            borderRadius: 6,
                            background: `${config.color}20`,
                            color: config.color,
                            fontWeight: 600,
                            fontSize: 11,
                          }}>
                            {config.icon} {config.label}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Progreso */}
                    {order.progress && (
                      <div>
                        <div style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: 12,
                          color: "#94a3b8",
                          marginBottom: 6,
                        }}>
                          <span>Progreso</span>
                          <strong style={{ color: "#f1f5f9" }}>
                            {Math.round((order.progress.completed / order.progress.total) * 100)}%
                          </strong>
                        </div>
                        <div style={{
                          height: 8,
                          background: "#334155",
                          borderRadius: 4,
                          overflow: "hidden"
                        }}>
                          <div
                            style={{
                              height: "100%",
                              background: `linear-gradient(90deg, ${config.color}, ${config.color}dd)`,
                              width: `${Math.round((order.progress.completed / order.progress.total) * 100)}%`,
                              transition: "width 0.3s ease",
                              boxShadow: `0 0 8px ${config.color}66`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Botón ejecutar */}
                  <div style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    flexShrink: 0,
                  }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/preventive-orders/${order.id}/execute`);
                      }}
                      style={{
                        padding: "10px 20px",
                        height: 40,
                        borderRadius: 12,
                        border: "none",
                        background: "linear-gradient(135deg, #f97316, #ea580c)",
                        color: "white",
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: "pointer",
                        transition: "all 0.2s",
                        whiteSpace: "nowrap",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = "0 6px 20px rgba(249, 115, 22, 0.4)";
                        e.currentTarget.style.transform = "translateY(-2px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = "none";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      ▶️ Ejecutar
                    </button>
                    <div style={{
                      fontSize: 11,
                      color: "#94a3b8",
                      textAlign: "center",
                      fontWeight: 600,
                    }}>
                      Haz clic para abrir
                    </div>
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
