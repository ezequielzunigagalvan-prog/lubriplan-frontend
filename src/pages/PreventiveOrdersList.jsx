import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { preventiveOrdersService } from "../services/preventiveOrdersService";
import PreventiveOrderFormModal from "./PreventiveOrderFormModal";
import MainLayout from "../layouts/MainLayout";
import { Icon } from "../components/ui/lpIcons";

const COLORS = {
  bgBase: "#070B0F",
  bgCard: "#0D1117",
  bgCardHover: "#131920",
  border: "#1E2D42",
  borderPrimary: "#818cf8",
  textPrimary: "#F0F4F8",
  textSecondary: "#8899AA",
  textMuted: "#4A5568",
  accent: "#818cf8",
  accentHover: "#6366f1",
  amber: "#F4A020",
  green: "#10B981",
  red: "#EF4444",
};

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
    DRAFT: { color: COLORS.textMuted, label: "Borrador", icon: "file" },
    OPEN: { color: COLORS.accent, label: "Abierta", icon: "unlock" },
    IN_PROGRESS: { color: COLORS.amber, label: "En progreso", icon: "play" },
    COMPLETED: { color: COLORS.green, label: "Completada", icon: "check" },
    CANCELLED: { color: COLORS.red, label: "Cancelada", icon: "x" },
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
        limit: 50,
      });
      setOrders(data.data || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error("Error loading orders:", err);
    } finally {
      setLoading(false);
    }
  }

  const { activeOrders, completedOrders } = useMemo(() => {
    return {
      activeOrders: orders.filter(o => o.status !== "COMPLETED"),
      completedOrders: orders.filter(o => o.status === "COMPLETED"),
    };
  }, [orders]);

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

  if (loading) {
    return (
      <MainLayout>
        <div style={{ padding: 40, textAlign: "center", color: COLORS.textMuted, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div>
            <Icon name="loader" size="lg" style={{ marginBottom: 16, display: "block", color: COLORS.accent }} />
            <p>Cargando órdenes…</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div style={{ padding: "24px", minHeight: "100vh", background: COLORS.bgBase }}>
        {/* Header */}
        <div style={{ marginBottom: 40, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ margin: "0 0 8px 0", fontSize: 32, fontWeight: 900, color: COLORS.textPrimary }}>
              Órdenes Preventivas
            </h1>
            <p style={{ margin: 0, color: COLORS.textSecondary, fontSize: 14 }}>
              {activeOrders.length} activa{activeOrders.length !== 1 ? "s" : ""} • {completedOrders.length} completada{completedOrders.length !== 1 ? "s" : ""}
            </p>
          </div>
          {canCreate && (
            <button
              onClick={() => setShowModal(true)}
              style={{
                background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accentHover})`,
                color: "white",
                border: "none",
                padding: "12px 24px",
                borderRadius: 12,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s",
                boxShadow: `0 4px 12px ${COLORS.accent}40`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = `0 6px 20px ${COLORS.accent}60`;
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = `0 4px 12px ${COLORS.accent}40`;
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <Icon name="plus" size="sm" style={{ marginRight: 6, display: "inline-block" }} />
              Nueva OLP
            </button>
          )}
        </div>

        {/* Filtros */}
        {!status && (
          <div style={{ display: "flex", gap: 8, marginBottom: 32, flexWrap: "wrap" }}>
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
                    border: `1.5px solid ${isActive ? (config?.color || COLORS.accent) : COLORS.border}`,
                    background: isActive ? `${config?.color || COLORS.accent}15` : "transparent",
                    color: isActive ? config?.color || COLORS.accent : COLORS.textSecondary,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontSize: 13,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = COLORS.textSecondary;
                      e.currentTarget.style.color = COLORS.textPrimary;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = COLORS.border;
                      e.currentTarget.style.color = COLORS.textSecondary;
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
        )}

        {/* Órdenes Activas */}
        {activeOrders.length > 0 && (
          <div style={{ marginBottom: 48 }}>
            <h2 style={{ margin: "0 0 16px 0", fontSize: 18, fontWeight: 900, color: COLORS.textPrimary }}>
              Activas ({activeOrders.length})
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: 16 }}>
              {activeOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onDelete={handleDelete}
                  onOpen={handleOpen}
                  onNavigate={() => navigate(`/preventive-orders/${order.id}`)}
                  onReload={loadOrders}
                />
              ))}
            </div>
          </div>
        )}

        {/* Órdenes Completadas */}
        {completedOrders.length > 0 && (
          <div>
            <h2 style={{ margin: "0 0 16px 0", fontSize: 18, fontWeight: 900, color: COLORS.textPrimary }}>
              Completadas ({completedOrders.length})
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: 16 }}>
              {completedOrders.map((order) => (
                <CompletedOrderCard key={order.id} order={order} onNavigate={() => navigate(`/preventive-orders/${order.id}`)} />
              ))}
            </div>
          </div>
        )}

        {activeOrders.length === 0 && completedOrders.length === 0 && (
          <div
            style={{
              padding: 40,
              borderRadius: 16,
              border: `1px dashed ${COLORS.border}`,
              textAlign: "center",
              background: `${COLORS.accent}05`,
            }}
          >
            <div style={{ fontSize: 56, marginBottom: 16, color: COLORS.accent }}>
              <Icon name="list" size="xl" />
            </div>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8, color: COLORS.textPrimary }}>
              No hay órdenes en este filtro
            </div>
            <div style={{ fontSize: 14, marginBottom: 24, color: COLORS.textSecondary }}>
              {total === 0 ? "Crea una nueva orden para comenzar" : "Cambia el filtro para ver otras órdenes"}
            </div>
            {canCreate && total === 0 && (
              <button
                onClick={() => setShowModal(true)}
                style={{
                  background: COLORS.accent,
                  color: "white",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: 10,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = COLORS.accentHover)}
                onMouseLeave={(e) => (e.currentTarget.style.background = COLORS.accent)}
              >
                Crear primera orden
              </button>
            )}
          </div>
        )}

        {/* Modal */}
        {showModal && <PreventiveOrderFormModal onClose={handleModalClose} />}
      </div>
    </MainLayout>
  );
}

// Card para órdenes activas
function OrderCard({ order, onDelete, onOpen, onNavigate, onReload }) {
  const config = {
    DRAFT: { color: COLORS.textMuted, label: "Borrador", icon: "file" },
    OPEN: { color: COLORS.accent, label: "Abierta", icon: "unlock" },
    IN_PROGRESS: { color: COLORS.amber, label: "En progreso", icon: "play" },
  }[order.status];

  // Calcular urgencia
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const scheduledDate = new Date(order.scheduledDate);
  scheduledDate.setHours(0, 0, 0, 0);
  const daysUntil = Math.floor((scheduledDate - today) / (1000 * 60 * 60 * 24));

  let urgencyBadge = { color: COLORS.accent, label: "Próxima", icon: "calendar" };
  if (daysUntil < 0) {
    urgencyBadge = { color: COLORS.red, label: "Atrasada", icon: "alertCircle" };
  } else if (daysUntil === 0) {
    urgencyBadge = { color: COLORS.amber, label: "Hoy", icon: "clock" };
  }

  const progress = order.progress?.total > 0 ? Math.round((order.progress.completed / order.progress.total) * 100) : 0;

  return (
    <div
      style={{
        padding: 20,
        borderRadius: 14,
        background: COLORS.bgCard,
        border: `1px solid ${COLORS.border}`,
        borderLeft: `4px solid ${config.color}`,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        transition: "all 0.3s",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = config.color;
        e.currentTarget.style.background = COLORS.bgCardHover;
        e.currentTarget.style.boxShadow = `0 8px 24px ${config.color}20, 0 4px 12px rgba(0,0,0,0.4)`;
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = COLORS.border;
        e.currentTarget.style.background = COLORS.bgCard;
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Título y badges */}
      <div>
        <h3 style={{ margin: "0 0 8px 0", fontSize: 16, fontWeight: 900, color: COLORS.textPrimary }}>
          Orden #{order.id}
        </h3>
        <p style={{ margin: "0 0 10px 0", color: COLORS.textSecondary, fontSize: 12 }}>
          {order.title || "Sin título"}
        </p>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11,
              fontWeight: 700,
              padding: "5px 10px",
              borderRadius: 8,
              background: `${config.color}20`,
              color: config.color,
            }}
          >
            <Icon name={config.icon} size="xs" />
            {config.label}
          </span>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11,
              fontWeight: 700,
              padding: "5px 10px",
              borderRadius: 8,
              background: `${urgencyBadge.color}20`,
              color: urgencyBadge.color,
            }}
          >
            <Icon name={urgencyBadge.icon} size="xs" />
            {urgencyBadge.label}
          </span>
        </div>
      </div>

      {/* Info */}
      <div style={{ display: "grid", gap: 8, fontSize: 12, color: COLORS.textSecondary }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name="settings" size="sm" />
          <strong>{order.equipment?.name || "Equipo desconocido"}</strong>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name="calendar" size="sm" />
          {new Date(order.scheduledDate).toLocaleDateString("es-MX")}
        </div>
        {order.assignedToUser && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="user" size="sm" />
            <strong>{order.assignedToUser.name}</strong>
          </div>
        )}
      </div>

      {/* Progreso */}
      {order.progress && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: COLORS.textMuted, marginBottom: 6 }}>
            <span>Progreso</span>
            <strong style={{ color: COLORS.textPrimary }}>
              {order.progress.completed}/{order.progress.total} ({progress}%)
            </strong>
          </div>
          <div style={{ height: 6, background: COLORS.border, borderRadius: 3, overflow: "hidden" }}>
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

      {/* Botones */}
      <div style={{ display: "flex", gap: 8, marginTop: "auto", flexWrap: "wrap" }}>
        {order.status === "DRAFT" && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpen(order.id);
              }}
              style={{
                flex: 1,
                minWidth: 120,
                padding: "8px 12px",
                borderRadius: 8,
                border: "none",
                background: COLORS.accent,
                color: "white",
                fontWeight: 600,
                fontSize: 12,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = COLORS.accentHover)}
              onMouseLeave={(e) => (e.currentTarget.style.background = COLORS.accent)}
            >
              Liberar
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(order.id);
              }}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "none",
                background: COLORS.red,
                color: "white",
                fontWeight: 600,
                fontSize: 12,
                cursor: "pointer",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#dc2626")}
              onMouseLeave={(e) => (e.currentTarget.style.background = COLORS.red)}
            >
              <Icon name="trash" size="sm" />
            </button>
          </>
        )}

        {(order.status === "OPEN" || order.status === "IN_PROGRESS") && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNavigate();
              }}
              style={{
                flex: 1,
                minWidth: 120,
                padding: "8px 12px",
                borderRadius: 8,
                border: "none",
                background: COLORS.green,
                color: "white",
                fontWeight: 600,
                fontSize: 12,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#059669")}
              onMouseLeave={(e) => (e.currentTarget.style.background = COLORS.green)}
            >
              Ejecutar
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNavigate();
              }}
              style={{
                flex: 1,
                minWidth: 120,
                padding: "8px 12px",
                borderRadius: 8,
                border: `1px solid ${COLORS.border}`,
                background: "transparent",
                color: COLORS.textSecondary,
                fontWeight: 600,
                fontSize: 12,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = COLORS.accent;
                e.currentTarget.style.color = COLORS.accent;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = COLORS.border;
                e.currentTarget.style.color = COLORS.textSecondary;
              }}
            >
              Ver detalle
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// Card para órdenes completadas
function CompletedOrderCard({ order, onNavigate }) {
  const progress = order.progress?.total > 0 ? Math.round((order.progress.completed / order.progress.total) * 100) : 0;
  const executedDate = order.completedAt ? new Date(order.completedAt) : null;

  return (
    <div
      style={{
        padding: 20,
        borderRadius: 14,
        background: COLORS.bgCard,
        border: `1px solid ${COLORS.green}30`,
        borderLeft: `4px solid ${COLORS.green}`,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        transition: "all 0.3s",
        cursor: "pointer",
        opacity: 0.85,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = "1";
        e.currentTarget.style.boxShadow = `0 8px 24px ${COLORS.green}15, 0 4px 12px rgba(0,0,0,0.4)`;
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = "0.85";
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Título y estado */}
      <div>
        <h3 style={{ margin: "0 0 8px 0", fontSize: 16, fontWeight: 900, color: COLORS.textPrimary }}>
          Orden #{order.id}
        </h3>
        <p style={{ margin: "0 0 10px 0", color: COLORS.textSecondary, fontSize: 12 }}>
          {order.title || "Sin título"}
        </p>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11,
              fontWeight: 700,
              padding: "5px 10px",
              borderRadius: 8,
              background: `${COLORS.green}20`,
              color: COLORS.green,
            }}
          >
            <Icon name="check" size="xs" />
            Completada
          </span>
          {executedDate && (
            <span style={{ fontSize: 11, color: COLORS.textMuted }}>
              {executedDate.toLocaleDateString("es-MX")}
            </span>
          )}
        </div>
      </div>

      {/* Info */}
      <div style={{ display: "grid", gap: 8, fontSize: 12, color: COLORS.textSecondary }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name="settings" size="sm" />
          <strong>{order.equipment?.name || "Equipo desconocido"}</strong>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name="calendar" size="sm" />
          {new Date(order.scheduledDate).toLocaleDateString("es-MX")}
        </div>
        {order.assignedToUser && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="user" size="sm" />
            <strong>{order.assignedToUser.name}</strong>
          </div>
        )}
      </div>

      {/* Progreso */}
      {order.progress && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: COLORS.textMuted, marginBottom: 6 }}>
            <span>Completado</span>
            <strong style={{ color: COLORS.green }}>
              {order.progress.completed}/{order.progress.total} (100%)
            </strong>
          </div>
          <div style={{ height: 6, background: COLORS.border, borderRadius: 3, overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                background: COLORS.green,
                width: "100%",
              }}
            />
          </div>
        </div>
      )}

      {/* Botón */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onNavigate();
        }}
        style={{
          width: "100%",
          padding: "8px 12px",
          borderRadius: 8,
          border: `1px solid ${COLORS.border}`,
          background: "transparent",
          color: COLORS.textSecondary,
          fontWeight: 600,
          fontSize: 12,
          cursor: "pointer",
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = COLORS.accent;
          e.currentTarget.style.color = COLORS.accent;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = COLORS.border;
          e.currentTarget.style.color = COLORS.textSecondary;
        }}
      >
        Ver detalle
      </button>
    </div>
  );
}
