import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { preventiveOrdersService } from "../services/preventiveOrdersService";
import { Icon } from "../components/ui/lpIcons";
import MainLayout from "../layouts/MainLayout";

export default function PreventiveOrderDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const statusConfig = {
    DRAFT: { color: "#94a3b8", label: "Borrador", icon: "file" },
    OPEN: { color: "#3b82f6", label: "Abierta", icon: "unlock" },
    IN_PROGRESS: { color: "#f59e0b", label: "En progreso", icon: "play" },
    COMPLETED: { color: "#10b981", label: "Completada", icon: "check" },
    CANCELLED: { color: "#ef4444", label: "Cancelada", icon: "x" },
  };

  const isTechnician = user?.role === "TECHNICIAN";

  useEffect(() => {
    loadOrder();
  }, [id]);

  async function loadOrder() {
    setLoading(true);
    try {
      const data = await preventiveOrdersService.get(Number(id));
      setOrder(data);
    } catch (err) {
      setError("No se pudo cargar la orden");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div style={{ padding: 40, textAlign: "center", color: "#94a3b8", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div>
            <Icon name="loader" size="lg" style={{ marginBottom: 16, display: "block" }} />
            <p>Cargando orden…</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!order) {
    return (
      <MainLayout>
        <div style={{ padding: 40, textAlign: "center", color: "#ef4444", minHeight: "100vh" }}>
          <div style={{ fontSize: 80, marginBottom: 16 }}>404</div>
          <h1 style={{ margin: "0 0 8px 0", fontSize: 24, fontWeight: 900, color: "#f1f5f9" }}>
            Orden No Encontrada
          </h1>
          <p style={{ color: "#94a3b8", marginBottom: 24 }}>La orden que buscas no existe o fue eliminada.</p>
          <button
            onClick={() => navigate("/preventive-orders")}
            style={{
              padding: "12px 24px",
              borderRadius: 10,
              border: "1px solid #ef4444",
              background: "transparent",
              color: "#ef4444",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            Volver a Órdenes
          </button>
        </div>
      </MainLayout>
    );
  }

  const config = statusConfig[order.status] || statusConfig.DRAFT;
  const progress = order.progress?.total > 0 ? Math.round((order.progress.completed / order.progress.total) * 100) : 0;
  const canExecute = order.status === "OPEN" || order.status === "IN_PROGRESS";

  return (
    <MainLayout>
      <div style={{ padding: "24px", minHeight: "100vh", background: "#0A0C0F" }}>
        {/* Header */}
        <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ margin: "0 0 8px 0", fontSize: 28, fontWeight: 900, color: "#f1f5f9" }}>
              Orden #{order.id}
            </h1>
            <p style={{ margin: 0, color: "#94a3b8", fontSize: 14 }}>
              {order.title || "Sin título"}
            </p>
          </div>
          <button
            onClick={() => navigate("/preventive-orders")}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid #334155",
              background: "transparent",
              color: "#cbd5e1",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontWeight: 600,
            }}
          >
            <Icon name="arrowLeft" size="sm" />
            Volver
          </button>
        </div>

        {error && (
          <div
            style={{
              marginBottom: 16,
              padding: 12,
              borderRadius: 8,
              background: "#fee2e2",
              color: "#991b1b",
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        {/* Status Badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 16px",
            borderRadius: 10,
            background: `${config.color}20`,
            color: config.color,
            fontWeight: 700,
            fontSize: 13,
            marginBottom: 24,
          }}
        >
          <Icon name={config.icon} size="sm" />
          {config.label}
        </div>

        {/* KPI Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginBottom: 24 }}>
          <div
            style={{
              padding: 16,
              borderRadius: 12,
              background: "linear-gradient(135deg, #1e293b, #1a1f26)",
              border: "1px solid #334155",
            }}
          >
            <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, marginBottom: 8 }}>
              <Icon name="settings" size="sm" style={{ marginRight: 4 }} />
              Equipo
            </div>
            <div style={{ fontSize: 15, fontWeight: 900, color: "#f1f5f9" }}>
              {order.equipment?.name || "Desconocido"}
            </div>
          </div>

          <div
            style={{
              padding: 16,
              borderRadius: 12,
              background: "linear-gradient(135deg, #1e293b, #1a1f26)",
              border: "1px solid #334155",
            }}
          >
            <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, marginBottom: 8 }}>
              <Icon name="calendar" size="sm" style={{ marginRight: 4 }} />
              Fecha Programada
            </div>
            <div style={{ fontSize: 15, fontWeight: 900, color: "#f1f5f9" }}>
              {new Date(order.scheduledDate).toLocaleDateString("es-MX", {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </div>
          </div>

          {order.assignedToUser && (
            <div
              style={{
                padding: 16,
                borderRadius: 12,
                background: "linear-gradient(135deg, #1e293b, #1a1f26)",
                border: "1px solid #334155",
              }}
            >
              <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, marginBottom: 8 }}>
                <Icon name="user" size="sm" style={{ marginRight: 4 }} />
                Técnico Asignado
              </div>
              <div style={{ fontSize: 15, fontWeight: 900, color: "#f1f5f9" }}>
                {order.assignedToUser.name}
              </div>
            </div>
          )}

          {order.createdByUser && (
            <div
              style={{
                padding: 16,
                borderRadius: 12,
                background: "linear-gradient(135deg, #1e293b, #1a1f26)",
                border: "1px solid #334155",
              }}
            >
              <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, marginBottom: 8 }}>
                <Icon name="user" size="sm" style={{ marginRight: 4 }} />
                Creada Por
              </div>
              <div style={{ fontSize: 15, fontWeight: 900, color: "#f1f5f9" }}>
                {order.createdByUser.name}
              </div>
            </div>
          )}
        </div>

        {/* Progress */}
        {order.progress && (
          <div
            style={{
              padding: 16,
              borderRadius: 12,
              background: "linear-gradient(135deg, #1e293b, #1a1f26)",
              border: "1px solid #334155",
              marginBottom: 24,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#cbd5e1" }}>Progreso</span>
              <strong style={{ color: "#f1f5f9" }}>
                {order.progress.completed}/{order.progress.total} ({progress}%)
              </strong>
            </div>
            <div style={{ height: 8, background: "#334155", borderRadius: 4, overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  background: `linear-gradient(90deg, ${config.color}, ${config.color}dd)`,
                  width: `${progress}%`,
                  transition: "width 0.3s",
                }}
              />
            </div>
          </div>
        )}

        {/* Items List */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ margin: "0 0 12px 0", fontSize: 18, fontWeight: 900, color: "#f1f5f9" }}>
            Items ({order.items?.length || 0})
          </h2>
          <div style={{ display: "grid", gap: 8 }}>
            {order.items && Array.isArray(order.items)
              ? order.items.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      padding: 14,
                      borderRadius: 10,
                      background: item.status === "COMPLETED" ? "#10b98110" : "#334155",
                      border: `1px solid ${item.status === "COMPLETED" ? "#10b981" : "#475569"}`,
                      display: "grid",
                      gap: 10,
                    }}
                  >
                    {/* Header con nombre de ruta y estado */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <div style={{ flex: 1 }}>
                        <strong style={{ color: "#f1f5f9", fontSize: 14, display: "block", marginBottom: 4 }}>
                          {item.route?.name || "Ruta sin nombre"}
                        </strong>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8" }}>
                          ID Item: {item.id}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "4px 8px",
                          borderRadius: 6,
                          background: item.status === "COMPLETED" ? "#10b98140" : "#f59e0b40",
                          color: item.status === "COMPLETED" ? "#10b981" : "#f59e0b",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.status === "COMPLETED" && <Icon name="check" size="xs" />}
                        {item.status === "COMPLETED" ? "Completado" : "Pendiente"}
                      </span>
                    </div>

                    {/* Datos técnicos */}
                    {item.route && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12, color: "#cbd5e1" }}>
                        {item.route.lubricantName && (
                          <div>
                            <span style={{ color: "#94a3b8", fontSize: 11 }}>Lubricante</span>
                            <div style={{ fontWeight: 700 }}>{item.route.lubricantName}</div>
                          </div>
                        )}
                        {item.route.quantity && (
                          <div>
                            <span style={{ color: "#94a3b8", fontSize: 11 }}>Cantidad</span>
                            <div style={{ fontWeight: 700 }}>
                              {item.route.quantity} {item.route.unit || "unidades"}
                            </div>
                          </div>
                        )}
                        {item.route.method && (
                          <div>
                            <span style={{ color: "#94a3b8", fontSize: 11 }}>Método</span>
                            <div style={{ fontWeight: 700 }}>{item.route.method}</div>
                          </div>
                        )}
                        {item.route.frequencyType && (
                          <div>
                            <span style={{ color: "#94a3b8", fontSize: 11 }}>Frecuencia</span>
                            <div style={{ fontWeight: 700 }}>{item.route.frequencyType}</div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Instrucciones */}
                    {item.route?.instructions && (
                      <div style={{ fontSize: 12, color: "#cbd5e1", padding: "8px", borderLeft: "2px solid #3b82f6", background: "#3b82f610" }}>
                        <strong style={{ color: "#94a3b8", display: "block", marginBottom: 4 }}>Instrucciones:</strong>
                        {item.route.instructions}
                      </div>
                    )}

                    {/* Observaciones */}
                    {item.observations && (
                      <div style={{ fontSize: 12, color: "#cbd5e1", padding: "8px", borderLeft: "2px solid #10b981", background: "#10b98110" }}>
                        <strong style={{ color: "#10b981", display: "block", marginBottom: 4 }}>Observaciones:</strong>
                        {item.observations}
                      </div>
                    )}
                  </div>
                ))
              : null}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          {canExecute && (
            <button
              onClick={() => navigate(`/preventive-orders/${order.id}/execution`)}
              style={{
                padding: "12px 24px",
                borderRadius: 10,
                border: "none",
                background: "#f97316",
                color: "white",
                fontWeight: 700,
                cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#ea580c")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#f97316")}
            >
              <Icon name="play" size="sm" style={{ marginRight: 6 }} />
              Ejecutar Orden
            </button>
          )}

          {isTechnician && order.status !== "IN_PROGRESS" && (
            <div style={{ padding: "12px 16px", borderRadius: 10, background: "#cbd5e120", color: "#cbd5e1", fontSize: 13, fontWeight: 600 }}>
              <Icon name="lock" size="sm" style={{ marginRight: 6 }} />
              Esta orden no está disponible para ejecutar
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
