import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { preventiveOrdersService } from "../services/preventiveOrdersService";
import PreventiveOrderFormModal from "./PreventiveOrderFormModal";

export default function PreventiveOrdersList() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);

  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  useEffect(() => {
    loadOrders();
  }, [status, page]);

  async function loadOrders() {
    setLoading(true);
    try {
      const data = await preventiveOrdersService.list({ status: status || undefined, page, limit: 20 });
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
    <div style={{ padding: 20, minHeight: "100vh", background: "#0f172a" }}>
      <button
        onClick={handleBackToDashboard}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "transparent",
          border: "1px solid #334155",
          color: "#cbd5e1",
          padding: "8px 16px",
          borderRadius: 8,
          fontWeight: 600,
          cursor: "pointer",
          marginBottom: 20,
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "#475569";
          e.currentTarget.style.color = "#f1f5f9";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "#334155";
          e.currentTarget.style.color = "#cbd5e1";
        }}
      >
        ← Dashboard
      </button>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30 }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: "#f1f5f9" }}>
          Órdenes de Lubricación Preventiva
        </h1>
        <button
          onClick={() => setShowModal(true)}
          style={{
            background: "#f97316",
            color: "white",
            border: "none",
            padding: "10px 20px",
            borderRadius: 10,
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#ea580c")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#f97316")}
        >
          ⚡ Nueva OLP
        </button>
      </div>

      <div style={{ marginBottom: 20, display: "flex", gap: 10, overflowX: "auto", paddingBottom: 8 }}>
        {["", "DRAFT", "OPEN", "IN_PROGRESS", "COMPLETED", "CANCELLED"].map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatus(s);
              setPage(1);
            }}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "1.5px solid",
              background: status === s ? "#f97316" : "transparent",
              color: status === s ? "white" : "#94a3b8",
              borderColor: status === s ? "#f97316" : "#334155",
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.15s",
            }}
          >
            {s ? statusLabels[s] : "Todas"}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>Cargando órdenes…</div>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "#64748b" }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>📋</div>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4, color: "#cbd5e1" }}>
            No hay órdenes preventivas
          </div>
          <div style={{ fontSize: 13, marginBottom: 20 }}>Crea una nueva orden para comenzar</div>
          <button
            onClick={() => setShowModal(true)}
            style={{
              background: "#f97316",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: 8,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Crear orden
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {orders.map((order) => {
            const progress = order.progress?.total > 0
              ? Math.round((order.progress.completed / order.progress.total) * 100)
              : 0;
            const borderColor = statusColors[order.status];
            const bgBorderColor = statusColors[order.status] + '15';

            const handleDelete = async () => {
              if (window.confirm(`¿Seguro que deseas eliminar la orden #${order.id}?`)) {
                try {
                  await fetch(`${import.meta.env.VITE_API_URL}/preventive-orders/${order.id}`, {
                    method: 'DELETE',
                    headers: {
                      'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`,
                      'x-plant-id': localStorage.getItem('lp_currentPlantId') || '',
                    }
                  });
                  loadOrders();
                } catch (err) {
                  console.error('Error eliminando orden:', err);
                }
              }
            };

            const handleOpen = async () => {
              try {
                await fetch(`${import.meta.env.VITE_API_URL}/preventive-orders/${order.id}/open`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`,
                    'x-plant-id': localStorage.getItem('lp_currentPlantId') || '',
                  }
                });
                loadOrders();
              } catch (err) {
                console.error('Error abriendo orden:', err);
              }
            };

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
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#202732";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#1a1f26";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {/* Encabezado con título y badge */}
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
                      background: bgBorderColor,
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

                {/* Fila de información */}
                <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#cbd5e1", marginBottom: 12 }}>
                  {order.assignedToUser ? (
                    <div>👤 {order.assignedToUser.name}</div>
                  ) : (
                    <div style={{ color: '#64748b' }}>👤 Sin asignar</div>
                  )}
                  <div>📋 {order.progress?.total || 0} items</div>
                  <div style={{ color: '#64748b' }}>Creado: {new Date(order.createdAt).toLocaleDateString('es-MX')}</div>
                </div>

                {/* Barra de progreso */}
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

                {/* Botones de acción */}
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  {order.status === 'DRAFT' && (
                    <>
                      <button
                        onClick={handleOpen}
                        style={{
                          padding: "8px 16px",
                          height: 36,
                          borderRadius: 8,
                          border: "none",
                          background: "#3b82f6",
                          color: "white",
                          fontWeight: 700,
                          fontSize: 12,
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#2563eb";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "#3b82f6";
                        }}
                      >
                        Liberar al técnico
                      </button>
                      <button
                        onClick={handleDelete}
                        style={{
                          padding: "8px 12px",
                          height: 36,
                          borderRadius: 8,
                          border: "none",
                          background: "#ef4444",
                          color: "white",
                          fontWeight: 700,
                          fontSize: 12,
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#dc2626";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "#ef4444";
                        }}
                      >
                        🗑️
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => navigate(`/preventive-orders/${order.id}`)}
                    style={{
                      padding: "8px 16px",
                      height: 36,
                      borderRadius: 8,
                      border: "1px solid #475569",
                      background: "transparent",
                      color: "#cbd5e1",
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#64748b";
                      e.currentTarget.style.color = "#f1f5f9";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#475569";
                      e.currentTarget.style.color = "#cbd5e1";
                    }}
                  >
                    Ver detalle →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {total > 20 && (
        <div style={{ marginTop: 30, display: "flex", justifyContent: "center", gap: 10 }}>
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid #334155",
              background: "transparent",
              color: page === 1 ? "#475569" : "#cbd5e1",
              cursor: page === 1 ? "default" : "pointer",
            }}
          >
            Anterior
          </button>
          <span style={{ display: "flex", alignItems: "center", fontWeight: 600, color: "#94a3b8" }}>
            Página {page} de {Math.ceil(total / 20)}
          </span>
          <button
            disabled={page * 20 >= total}
            onClick={() => setPage(page + 1)}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid #334155",
              background: "transparent",
              color: page * 20 >= total ? "#475569" : "#cbd5e1",
              cursor: page * 20 >= total ? "default" : "pointer",
            }}
          >
            Siguiente
          </button>
        </div>
      )}

      {showModal && (
        <PreventiveOrderFormModal onClose={handleModalClose} />
      )}
    </div>
  );
}
