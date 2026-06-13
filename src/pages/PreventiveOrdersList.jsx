import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { preventiveOrdersService } from "../services/preventiveOrdersService";
import PreventiveOrderFormModal from "./PreventiveOrderFormModal";
import MainLayout from "../layouts/MainLayout";
import { Icon } from "../components/ui/lpIcons";

export default function PreventiveOrdersList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canCreate = user?.role === "ADMIN" || user?.role === "SUPERVISOR";

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);

  const statusConfig = {
    DRAFT: { color: "#94a3b8", label: "Borrador", icon: "file" },
    OPEN: { color: "#3b82f6", label: "Abierta", icon: "unlock" },
    IN_PROGRESS: { color: "#f59e0b", label: "En progreso", icon: "play" },
    COMPLETED: { color: "#10b981", label: "Completada", icon: "check" },
    CANCELLED: { color: "#ef4444", label: "Cancelada", icon: "x" },
  };

  const statuses = ["", "DRAFT", "OPEN", "IN_PROGRESS", "COMPLETED"];

  useEffect(() => {
    loadOrders();
  }, [status, page]);

  async function loadOrders() {
    setLoading(true);
    try {
      const data = await preventiveOrdersService.list({
        status: status || undefined,
        page,
        limit: 20,
      });
      setOrders(data.data || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error("Error loading orders:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleModalClose = () => {
    setShowModal(false);
    loadOrders();
  };

  const handleDelete = async (orderId) => {
    if (window.confirm("¿Seguro que deseas cancelar esta orden?")) {
      try {
        await preventiveOrdersService.cancel(orderId);
        loadOrders();
      } catch (err) {
        console.error("Error cancelando orden:", err);
      }
    }
  };

  const handleOpen = async (orderId) => {
    try {
      await preventiveOrdersService.open(orderId);
      loadOrders();
    } catch (err) {
      console.error("Error abriendo orden:", err);
    }
  };

  return (
    <MainLayout>
      <div style={{ padding: "24px", minHeight: "100vh", background: "#0f172a" }}>
        {/* Header */}
        <div style={{ marginBottom: 40, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1
              style={{
                margin: "0 0 8px 0",
                fontSize: 32,
                fontWeight: 900,
                color: "#f1f5f9",
                background: "linear-gradient(135deg, #f97316, #ea580c)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Órdenes de Lubricación Preventiva
            </h1>
            <p style={{ margin: "0", color: "#94a3b8", fontSize: 14 }}>
              {total} orden{total !== 1 ? "es" : ""} en total • {orders.length} en esta página
            </p>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            style={{
              padding: "8px 16px",
              borderRadius: 10,
              border: "1px solid #334155",
              background: "transparent",
              color: "#cbd5e1",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#f97316";
              e.currentTarget.style.color = "#f97316";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#334155";
              e.currentTarget.style.color = "#cbd5e1";
            }}
          >
            <Icon name="arrowLeft" size="sm" />
            Volver
          </button>
        </div>

        {/* Filtros y Crear */}
        <div
          style={{
            marginBottom: 28,
            padding: 20,
            borderRadius: 16,
            background: "linear-gradient(135deg, #1e293b 0%, #1a1f26 100%)",
            border: "1px solid #334155",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", gap: 8, overflowX: "auto", flex: 1 }}>
            {statuses.map((s) => {
              const isActive = status === s;
              const config = s ? statusConfig[s] : null;
              return (
                <button
                  key={s}
                  onClick={() => {
                    setStatus(s);
                    setPage(1);
                  }}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 10,
                    border: "1.5px solid",
                    background: isActive ? `${config?.color || "#f97316"}20` : "transparent",
                    color: isActive ? config?.color || "#f97316" : "#94a3b8",
                    borderColor: isActive ? config?.color || "#f97316" : "#334155",
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
                  {s ? (
                    <>
                      <Icon name={config.icon} size="sm" />
                      {config.label}
                    </>
                  ) : (
                    <>
                      <Icon name="list" size="sm" />
                      Todas
                    </>
                  )}
                </button>
              );
            })}
          </div>

          {canCreate && (
            <button
              onClick={() => setShowModal(true)}
              style={{
                background: "linear-gradient(135deg, #f97316, #ea580c)",
                color: "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: 12,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s",
                fontSize: 14,
                boxShadow: "0 4px 12px rgba(249, 115, 22, 0.3)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(249, 115, 22, 0.4)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(249, 115, 22, 0.3)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              Crear Orden
            </button>
          )}
        </div>

        {/* Contenido */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#64748b" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>
              <Icon name="loader" size="xl" />
            </div>
            <div style={{ fontWeight: 600, fontSize: 16, color: "#cbd5e1" }}>Cargando órdenes…</div>
          </div>
        ) : orders.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: 80,
              background: "linear-gradient(135deg, #1e293b20, #3b82f620)",
              borderRadius: 20,
              border: "2px dashed #334155",
            }}
          >
            <div style={{ fontSize: 56, marginBottom: 16, color: "#3b82f6" }}>
              <Icon name="list" size="xl" />
            </div>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8, color: "#f1f5f9" }}>
              No hay órdenes en este filtro
            </div>
            <div style={{ fontSize: 14, marginBottom: 24, color: "#94a3b8" }}>
              {total === 0
                ? "Crea una nueva orden para comenzar"
                : "Cambia el filtro para ver otras órdenes"}
            </div>
            {canCreate && total === 0 && (
              <button
                onClick={() => setShowModal(true)}
                style={{
                  background: "#f97316",
                  color: "white",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: 10,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#ea580c")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#f97316")}
              >
                Crear primera orden
              </button>
            )}
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gap: 16,
              gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))",
            }}
          >
            {orders.map((order) => {
              const config = statusConfig[order.status];
              const progress =
                order.progress?.total > 0
                  ? Math.round((order.progress.completed / order.progress.total) * 100)
                  : 0;

              // Calcular urgencia según fecha
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const scheduledDate = new Date(order.scheduledDate);
              scheduledDate.setHours(0, 0, 0, 0);
              const daysUntil = Math.floor((scheduledDate - today) / (1000 * 60 * 60 * 24));

              let urgencyBadge = { color: "#3b82f6", label: "Próxima", icon: "calendar" };
              if (daysUntil < 0) {
                urgencyBadge = { color: "#ef4444", label: "Atrasada", icon: "alertCircle" };
              } else if (daysUntil === 0) {
                urgencyBadge = { color: "#f59e0b", label: "Hoy", icon: "clock" };
              }

              return (
                <div
                  key={order.id}
                  style={{
                    padding: 20,
                    borderRadius: 16,
                    border: "1px solid #334155",
                    borderLeft: `5px solid ${config.color}`,
                    background: "linear-gradient(135deg, #1e293b 0%, #1a1f26 100%)",
                    transition: "all 0.3s",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
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
                  {/* Header con título grande y badges */}
                  <div>
                    <h3
                      style={{
                        margin: "0 0 12px 0",
                        fontSize: 20,
                        fontWeight: 900,
                        color: "#f1f5f9",
                      }}
                    >
                      Orden #{order.id}
                    </h3>
                    <p style={{ margin: "0 0 12px 0", color: "#cbd5e1", fontSize: 13 }}>
                      {order.title || "Sin título"}
                    </p>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {/* Badge de estado */}
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "6px 10px",
                          borderRadius: 8,
                          background: `${config.color}20`,
                          color: config.color,
                        }}
                      >
                        <Icon name={config.icon} size="xs" />
                        {config.label}
                      </div>
                      {/* Badge de urgencia */}
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "6px 10px",
                          borderRadius: 8,
                          background: `${urgencyBadge.color}20`,
                          color: urgencyBadge.color,
                        }}
                      >
                        <Icon name={urgencyBadge.icon} size="xs" />
                        {urgencyBadge.label}
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div
                    style={{
                      padding: "12px",
                      background: "#0f172a80",
                      borderRadius: 12,
                      border: "1px solid #334155",
                    }}
                  >
                    <div style={{ display: "grid", gap: 8, fontSize: 13, color: "#cbd5e1" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Icon name="settings" size="sm" />
                        <strong>{order.equipment?.name || "Equipo desconocido"}</strong>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Icon name="calendar" size="sm" />
                        {new Date(order.scheduledDate).toLocaleDateString("es-MX", {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                      {order.assignedToUser && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <Icon name="user" size="sm" />
                          <strong>{order.assignedToUser.name}</strong>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress */}
                  {order.progress && (
                    <div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: 12,
                          color: "#94a3b8",
                          marginBottom: 6,
                        }}
                      >
                        <span>Progreso</span>
                        <strong style={{ color: "#f1f5f9" }}>
                          {order.progress.completed}/{order.progress.total} ({progress}%)
                        </strong>
                      </div>
                      <div
                        style={{
                          height: 8,
                          background: "#334155",
                          borderRadius: 4,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            background: `linear-gradient(90deg, ${config.color}, ${config.color}dd)`,
                            width: `${progress}%`,
                            transition: "width 0.3s ease",
                            boxShadow: `0 0 8px ${config.color}66`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Botones según estado */}
                  <div style={{ display: "flex", gap: 8, marginTop: "auto", flexWrap: "wrap" }}>
                    {order.status === "DRAFT" && (
                      <>
                        <button
                          onClick={() => handleOpen(order.id)}
                          style={{
                            flex: 1,
                            minWidth: 120,
                            padding: "8px 16px",
                            borderRadius: 10,
                            border: "none",
                            background: "#3b82f6",
                            color: "white",
                            fontWeight: 600,
                            fontSize: 12,
                            cursor: "pointer",
                            transition: "all 0.15s",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#2563eb")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "#3b82f6")}
                        >
                          Liberar al técnico
                        </button>
                        <button
                          onClick={() => handleDelete(order.id)}
                          style={{
                            padding: "8px 12px",
                            borderRadius: 10,
                            border: "none",
                            background: "#ef4444",
                            color: "white",
                            fontWeight: 600,
                            fontSize: 12,
                            cursor: "pointer",
                            transition: "all 0.15s",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#dc2626")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "#ef4444")}
                          title="Eliminar orden"
                        >
                          <Icon name="trash" size="sm" />
                        </button>
                      </>
                    )}

                    {(order.status === "OPEN" || order.status === "IN_PROGRESS") && (
                      <>
                        <button
                          onClick={() => navigate(`/preventive-orders/${order.id}/execution`)}
                          style={{
                            flex: 1,
                            minWidth: 120,
                            padding: "8px 16px",
                            borderRadius: 10,
                            border: "none",
                            background: "#10b981",
                            color: "white",
                            fontWeight: 600,
                            fontSize: 12,
                            cursor: "pointer",
                            transition: "all 0.15s",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#059669")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "#10b981")}
                        >
                          Ejecutar
                        </button>
                        <button
                          onClick={() => navigate(`/preventive-orders/${order.id}`)}
                          style={{
                            flex: 1,
                            minWidth: 120,
                            padding: "8px 16px",
                            borderRadius: 10,
                            border: "1px solid #475569",
                            background: "transparent",
                            color: "#cbd5e1",
                            fontWeight: 600,
                            fontSize: 12,
                            cursor: "pointer",
                            transition: "all 0.15s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "#cbd5e1";
                            e.currentTarget.style.color = "#f1f5f9";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "#475569";
                            e.currentTarget.style.color = "#cbd5e1";
                          }}
                        >
                          Ver detalle
                        </button>
                      </>
                    )}

                    {order.status === "COMPLETED" && (
                      <button
                        onClick={() => navigate(`/preventive-orders/${order.id}`)}
                        style={{
                          flex: 1,
                          minWidth: 120,
                          padding: "8px 16px",
                          borderRadius: 10,
                          border: "1px solid #475569",
                          background: "transparent",
                          color: "#cbd5e1",
                          fontWeight: 600,
                          fontSize: 12,
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "#cbd5e1";
                          e.currentTarget.style.color = "#f1f5f9";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "#475569";
                          e.currentTarget.style.color = "#cbd5e1";
                        }}
                      >
                        Ver detalle
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Paginación */}
        {total > 20 && (
          <div
            style={{
              marginTop: 40,
              display: "flex",
              justifyContent: "center",
              gap: 12,
              alignItems: "center",
            }}
          >
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              style={{
                padding: "8px 16px",
                borderRadius: 10,
                border: "1px solid #334155",
                background: "transparent",
                color: page === 1 ? "#475569" : "#cbd5e1",
                cursor: page === 1 ? "default" : "pointer",
                fontWeight: 600,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                if (page !== 1) {
                  e.currentTarget.style.borderColor = "#f97316";
                  e.currentTarget.style.color = "#f97316";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#334155";
                e.currentTarget.style.color = "#cbd5e1";
              }}
            >
              Anterior
            </button>
            <span style={{ fontWeight: 600, color: "#94a3b8", minWidth: 120, textAlign: "center" }}>
              Página {page} de {Math.ceil(total / 20)}
            </span>
            <button
              disabled={page * 20 >= total}
              onClick={() => setPage(page + 1)}
              style={{
                padding: "8px 16px",
                borderRadius: 10,
                border: "1px solid #334155",
                background: "transparent",
                color: page * 20 >= total ? "#475569" : "#cbd5e1",
                cursor: page * 20 >= total ? "default" : "pointer",
                fontWeight: 600,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                if (page * 20 < total) {
                  e.currentTarget.style.borderColor = "#f97316";
                  e.currentTarget.style.color = "#f97316";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#334155";
                e.currentTarget.style.color = "#cbd5e1";
              }}
            >
              Siguiente
            </button>
          </div>
        )}

        {showModal && <PreventiveOrderFormModal onClose={handleModalClose} />}
      </div>
    </MainLayout>
  );
}
