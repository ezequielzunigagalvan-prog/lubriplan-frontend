import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { preventiveOrdersService } from "../services/preventiveOrdersService";
import PreventiveOrderFormModal from "./PreventiveOrderFormModal";
import MainLayout from "../layouts/MainLayout";
import { Icon } from "../components/ui/lpIcons";

const COLORS = {
  bgBase: "#050810",
  bgGradient: "linear-gradient(135deg, #050810 0%, #0a0f1a 100%)",
  bgCard: "#0f1724",
  bgCardGradient: "linear-gradient(135deg, rgba(15, 23, 36, 0.9), rgba(10, 15, 26, 0.95))",
  bgCardHover: "linear-gradient(135deg, rgba(20, 30, 45, 0.95), rgba(15, 20, 30, 0.98))",
  border: "rgba(244, 160, 32, 0.08)",
  borderLight: "rgba(244, 160, 32, 0.15)",
  borderAccent: "#F4A020",
  textPrimary: "#F0F4F8",
  textSecondary: "#8899AA",
  textMuted: "#4A5568",
  accent: "#818cf8",
  accentHover: "#6366f1",
  accentGlow: "rgba(129, 140, 248, 0.3)",
  accentPrimary: "#818cf8",
  orange: "#F4A020",
  orangeHover: "#E09010",
  orangeGlow: "rgba(244, 160, 32, 0.4)",
  green: "#10B981",
  greenGlow: "rgba(16, 185, 129, 0.3)",
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
  const [hoveredCard, setHoveredCard] = useState(null);

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
        <div style={{ padding: "20px", minHeight: "100vh", background: COLORS.bgGradient, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 56, height: 56, margin: "0 auto 16px", borderRadius: "50%", background: `${COLORS.accent}20`, display: "flex", alignItems: "center", justifyContent: "center", animation: "spin 1s linear infinite" }}>
              <Icon name="loader" size="lg" style={{ color: COLORS.accent }} />
            </div>
            <p style={{ color: COLORS.textMuted, fontSize: 14, margin: 0 }}>Cargando órdenes…</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div style={{ background: COLORS.bgGradient, minHeight: "100vh", paddingBottom: 40 }}>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes glow { 0%, 100% { box-shadow: 0 0 20px ${COLORS.accentGlow}; } 50% { box-shadow: 0 0 30px ${COLORS.accentGlow}; } }

          .olp-card:hover { animation: glow 2s ease-in-out; }
        `}</style>

        {/* Hero Section */}
        <div style={{ padding: "32px 20px 24px", background: `linear-gradient(135deg, ${COLORS.orange}15 0%, ${COLORS.accent}10 50%, transparent 100%)`, borderBottom: `2px solid ${COLORS.borderLight}`, animation: "slideUp 0.6s ease-out" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
              <div>
                <h1 style={{ margin: "0 0 6px 0", fontSize: "clamp(24px, 5vw, 36px)", fontWeight: 900, color: COLORS.textPrimary, letterSpacing: "-0.02em" }}>
                  Órdenes Preventivas
                </h1>
                <div style={{ display: "flex", gap: 12, fontSize: 13, color: COLORS.textSecondary, flexWrap: "wrap" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.amber }}></span>
                    {activeOrders.length} activa{activeOrders.length !== 1 ? "s" : ""}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.green }}></span>
                    {completedOrders.length} completada{completedOrders.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
              {canCreate && (
                <button
                  onClick={() => setShowModal(true)}
                  style={{
                    background: `linear-gradient(135deg, ${COLORS.orange}, ${COLORS.orangeHover})`,
                    color: "#050810",
                    border: "none",
                    padding: "12px 24px",
                    borderRadius: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontSize: "clamp(13px, 2vw, 15px)",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                    boxShadow: `0 8px 24px ${COLORS.orangeGlow}`,
                    minHeight: 44,
                    minWidth: 44,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px) scale(1.05)";
                    e.currentTarget.style.boxShadow = `0 12px 40px ${COLORS.orangeGlow}`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0) scale(1)";
                    e.currentTarget.style.boxShadow = `0 8px 24px ${COLORS.orangeGlow}`;
                  }}
                >
                  <Icon name="plus" size="sm" />
                  <span style={{ display: "none", "@media (min-width: 768px)": { display: "inline" } }}>Nueva OLP</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div style={{ padding: "20px", borderBottom: `1px solid ${COLORS.borderLight}`, overflowX: "auto" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", gap: 8 }}>
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
                    padding: "10px 16px",
                    borderRadius: 10,
                    border: `1.5px solid ${isActive ? COLORS.accent : COLORS.borderLight}`,
                    background: isActive ? `${COLORS.accent}15` : "transparent",
                    color: isActive ? COLORS.accent : COLORS.textSecondary,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontSize: 13,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    transition: "all 0.2s",
                    whiteSpace: "nowrap",
                    minHeight: 44,
                    backdrop: "blur(10px)",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = COLORS.borderAccent;
                      e.currentTarget.style.background = `${COLORS.accent}08`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = COLORS.borderLight;
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  {s ? (
                    <>
                      <Icon name={config.icon} size="sm" />
                      <span style={{ display: "none", "@media (min-width: 640px)": { display: "inline" } }}>{config.label}</span>
                    </>
                  ) : (
                    <>
                      <Icon name="list" size="sm" />
                      <span>Todas</span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Contenido */}
        <div style={{ padding: "24px 20px", maxWidth: 1200, margin: "0 auto" }}>
          {/* Órdenes Activas */}
          {activeOrders.length > 0 && (
            <section style={{ marginBottom: 48, animation: "slideUp 0.6s ease-out 0.1s backwards" }}>
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ margin: "0 0 4px 0", fontSize: "clamp(16px, 3vw, 20px)", fontWeight: 900, color: COLORS.textPrimary }}>
                  Activas
                </h2>
                <div style={{ height: 3, width: 50, background: `linear-gradient(90deg, ${COLORS.orange}, ${COLORS.accent}, transparent)`, borderRadius: 2, boxShadow: `0 0 12px ${COLORS.orangeGlow}` }}></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 340px), 1fr))", gap: 16 }}>
                {activeOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onDelete={handleDelete}
                    onOpen={handleOpen}
                    onNavigate={() => navigate(`/preventive-orders/${order.id}`)}
                    isHovered={hoveredCard === order.id}
                    onHover={() => setHoveredCard(order.id)}
                    onHoverLeave={() => setHoveredCard(null)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Órdenes Completadas */}
          {completedOrders.length > 0 && (
            <section style={{ animation: "slideUp 0.6s ease-out 0.2s backwards" }}>
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ margin: "0 0 4px 0", fontSize: "clamp(16px, 3vw, 20px)", fontWeight: 900, color: COLORS.textPrimary }}>
                  Completadas
                </h2>
                <div style={{ height: 3, width: 50, background: `linear-gradient(90deg, ${COLORS.green}, ${COLORS.accent}, transparent)`, borderRadius: 2, boxShadow: `0 0 12px ${COLORS.greenGlow}` }}></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 340px), 1fr))", gap: 16 }}>
                {completedOrders.map((order) => (
                  <CompletedOrderCard
                    key={order.id}
                    order={order}
                    onNavigate={() => navigate(`/preventive-orders/${order.id}`)}
                    isHovered={hoveredCard === `completed-${order.id}`}
                    onHover={() => setHoveredCard(`completed-${order.id}`)}
                    onHoverLeave={() => setHoveredCard(null)}
                  />
                ))}
              </div>
            </section>
          )}

          {activeOrders.length === 0 && completedOrders.length === 0 && (
            <div style={{ padding: "60px 20px", textAlign: "center", animation: "slideUp 0.6s ease-out" }}>
              <div style={{ fontSize: 64, marginBottom: 16, color: COLORS.accentGlow, opacity: 0.6 }}>
                <Icon name="inbox" size="xl" />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: COLORS.textPrimary, marginBottom: 8 }}>
                No hay órdenes
              </h2>
              <p style={{ fontSize: 14, color: COLORS.textSecondary, marginBottom: 24 }}>
                {total === 0 ? "Crea una nueva orden para comenzar" : "Cambia el filtro para ver otras órdenes"}
              </p>
              {canCreate && total === 0 && (
                <button
                  onClick={() => setShowModal(true)}
                  style={{
                    background: COLORS.accent,
                    color: "white",
                    border: "none",
                    padding: "12px 24px",
                    borderRadius: 10,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontSize: 14,
                    minHeight: 44,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = COLORS.accentHover)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = COLORS.accent)}
                >
                  Crear primera orden
                </button>
              )}
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && <PreventiveOrderFormModal onClose={handleModalClose} />}
      </div>
    </MainLayout>
  );
}

// Card para órdenes activas
function OrderCard({ order, onDelete, onOpen, onNavigate, isHovered, onHover, onHoverLeave }) {
  const config = {
    DRAFT: { color: COLORS.textMuted, label: "Borrador", icon: "file" },
    OPEN: { color: COLORS.accent, label: "Abierta", icon: "unlock" },
    IN_PROGRESS: { color: COLORS.amber, label: "En progreso", icon: "play" },
  }[order.status];

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
      className="olp-card"
      onMouseEnter={onHover}
      onMouseLeave={onHoverLeave}
      style={{
        background: COLORS.bgCardGradient,
        border: `1px solid ${isHovered ? COLORS.borderAccent : COLORS.borderLight}`,
        borderLeft: `4px solid ${config.color}`,
        borderRadius: 16,
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
        backdropFilter: "blur(10px)",
        minHeight: 280,
      }}
      style={isHovered ? {
        background: COLORS.bgCardHover,
        border: `1px solid ${COLORS.borderAccent}`,
        borderLeft: `4px solid ${config.color}`,
        transform: "translateY(-8px)",
        boxShadow: `0 16px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 ${COLORS.borderAccent}30`,
      } : {
        background: COLORS.bgCardGradient,
        border: `1px solid ${COLORS.borderLight}`,
        borderLeft: `4px solid ${config.color}`,
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)",
      }}
    >
      {/* Header */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 8 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: COLORS.textPrimary, letterSpacing: "-0.01em" }}>
            Orden #{order.id}
          </h3>
          <span style={{ fontSize: 10, fontWeight: 700, padding: "4px 8px", borderRadius: 6, background: `${config.color}20`, color: config.color }}>
            {config.label}
          </span>
        </div>
        <p style={{ margin: "0 0 10px 0", color: COLORS.textSecondary, fontSize: 12, lineHeight: 1.4 }}>
          {order.title || "Sin título"}
        </p>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700, padding: "5px 10px", borderRadius: 6, background: `${urgencyBadge.color}25`, color: urgencyBadge.color, border: `1px solid ${urgencyBadge.color}40`, boxShadow: `0 0 8px ${urgencyBadge.color}30` }}>
            <Icon name={urgencyBadge.icon} size="xs" />
            {urgencyBadge.label}
          </span>
        </div>
      </div>

      {/* Info Grid */}
      <div style={{ display: "grid", gap: 8, fontSize: 12, color: COLORS.textSecondary }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minHeight: 24 }}>
          <Icon name="settings" size="sm" />
          <strong style={{ color: COLORS.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {order.equipment?.name || "Equipo desconocido"}
          </strong>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minHeight: 24 }}>
          <Icon name="calendar" size="sm" />
          {new Date(order.scheduledDate).toLocaleDateString("es-MX")}
        </div>
        {order.assignedToUser && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, minHeight: 24 }}>
            <Icon name="user" size="sm" />
            <strong style={{ color: COLORS.textPrimary }}>
              {order.assignedToUser.name}
            </strong>
          </div>
        )}
      </div>

      {/* Progreso */}
      {order.progress && (
        <div style={{ marginTop: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: COLORS.textMuted, marginBottom: 8 }}>
            <span>Progreso</span>
            <strong style={{ color: COLORS.textPrimary }}>
              {order.progress.completed}/{order.progress.total} ({progress}%)
            </strong>
          </div>
          <div style={{ height: 6, background: COLORS.border, borderRadius: 4, overflow: "hidden", marginBottom: 12 }}>
            <div
              style={{
                height: "100%",
                background: `linear-gradient(90deg, ${config.color}, ${config.color}dd)`,
                width: `${progress}%`,
                transition: "width 0.4s ease",
                boxShadow: `0 0 12px ${config.color}80`,
              }}
            />
          </div>
        </div>
      )}

      {/* Botones */}
      <div style={{ display: "grid", gridTemplateColumns: order.status === "DRAFT" ? "1fr 1fr" : "1fr 1fr", gap: 8, marginTop: "auto" }}>
        {order.status === "DRAFT" && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpen(order.id);
              }}
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                border: "none",
                background: `linear-gradient(135deg, ${COLORS.orange}, ${COLORS.orangeHover})`,
                color: "#050810",
                fontWeight: 600,
                fontSize: 12,
                cursor: "pointer",
                transition: "all 0.2s",
                minHeight: 40,
                boxShadow: `0 4px 12px ${COLORS.orangeGlow}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.08)";
                e.currentTarget.style.boxShadow = `0 6px 16px ${COLORS.orangeGlow}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = `0 4px 12px ${COLORS.orangeGlow}`;
              }}
            >
              Liberar
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(order.id);
              }}
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                border: "none",
                background: COLORS.red,
                color: "white",
                fontWeight: 600,
                fontSize: 12,
                cursor: "pointer",
                transition: "all 0.2s",
                minHeight: 40,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#dc2626";
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = COLORS.red;
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              Eliminar
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
                padding: "10px 12px",
                borderRadius: 8,
                border: "none",
                background: `linear-gradient(135deg, ${COLORS.accent}, #6366f1)`,
                color: "white",
                fontWeight: 600,
                fontSize: 12,
                cursor: "pointer",
                transition: "all 0.2s",
                minHeight: 40,
                boxShadow: `0 4px 12px ${COLORS.accentGlow}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.08)";
                e.currentTarget.style.boxShadow = `0 6px 16px ${COLORS.accentGlow}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = `0 4px 12px ${COLORS.accentGlow}`;
              }}
            >
              Ejecutar
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNavigate();
              }}
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                border: `1px solid ${COLORS.borderAccent}`,
                background: "transparent",
                color: COLORS.textSecondary,
                fontWeight: 600,
                fontSize: 12,
                cursor: "pointer",
                transition: "all 0.2s",
                minHeight: 40,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = COLORS.accent;
                e.currentTarget.style.color = COLORS.accent;
                e.currentTarget.style.background = `${COLORS.accent}10`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = COLORS.borderAccent;
                e.currentTarget.style.color = COLORS.textSecondary;
                e.currentTarget.style.background = "transparent";
              }}
            >
              Detalle
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// Card para órdenes completadas
function CompletedOrderCard({ order, onNavigate, isHovered, onHover, onHoverLeave }) {
  const progress = order.progress?.total > 0 ? Math.round((order.progress.completed / order.progress.total) * 100) : 0;
  const executedDate = order.completedAt ? new Date(order.completedAt) : null;

  return (
    <div
      className="olp-card"
      onMouseEnter={onHover}
      onMouseLeave={onHoverLeave}
      style={{
        background: COLORS.bgCardGradient,
        border: `1px solid ${COLORS.green}30`,
        borderLeft: `4px solid ${COLORS.green}`,
        borderRadius: 16,
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
        backdropFilter: "blur(10px)",
        minHeight: 280,
        opacity: 0.8,
      }}
      style={isHovered ? {
        background: COLORS.bgCardHover,
        border: `1px solid ${COLORS.green}40`,
        borderLeft: `4px solid ${COLORS.green}`,
        transform: "translateY(-8px)",
        boxShadow: `0 16px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 ${COLORS.green}30`,
        opacity: 1,
      } : {
        background: COLORS.bgCardGradient,
        border: `1px solid ${COLORS.green}30`,
        borderLeft: `4px solid ${COLORS.green}`,
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)",
        opacity: 0.8,
      }}
    >
      {/* Header */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 8 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: COLORS.textPrimary, letterSpacing: "-0.01em" }}>
            Orden #{order.id}
          </h3>
          <span style={{ fontSize: 10, fontWeight: 700, padding: "4px 8px", borderRadius: 6, background: `${COLORS.green}20`, color: COLORS.green }}>
            ✓ Completada
          </span>
        </div>
        <p style={{ margin: "0 0 10px 0", color: COLORS.textSecondary, fontSize: 12, lineHeight: 1.4 }}>
          {order.title || "Sin título"}
        </p>
        {executedDate && (
          <span style={{ fontSize: 11, color: COLORS.green, fontWeight: 600 }}>
            Ejecutada: {executedDate.toLocaleDateString("es-MX")}
          </span>
        )}
      </div>

      {/* Info Grid */}
      <div style={{ display: "grid", gap: 8, fontSize: 12, color: COLORS.textSecondary }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minHeight: 24 }}>
          <Icon name="settings" size="sm" />
          <strong style={{ color: COLORS.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {order.equipment?.name || "Equipo desconocido"}
          </strong>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minHeight: 24 }}>
          <Icon name="calendar" size="sm" />
          {new Date(order.scheduledDate).toLocaleDateString("es-MX")}
        </div>
        {order.assignedToUser && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, minHeight: 24 }}>
            <Icon name="user" size="sm" />
            <strong style={{ color: COLORS.textPrimary }}>
              {order.assignedToUser.name}
            </strong>
          </div>
        )}
      </div>

      {/* Progreso */}
      {order.progress && (
        <div style={{ marginTop: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: COLORS.textMuted, marginBottom: 8 }}>
            <span>Completado</span>
            <strong style={{ color: COLORS.green }}>100%</strong>
          </div>
          <div style={{ height: 6, background: COLORS.border, borderRadius: 4, overflow: "hidden", marginBottom: 12 }}>
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
          padding: "10px 12px",
          borderRadius: 8,
          border: `1px solid ${COLORS.borderAccent}`,
          background: "transparent",
          color: COLORS.textSecondary,
          fontWeight: 600,
          fontSize: 12,
          cursor: "pointer",
          transition: "all 0.2s",
          minHeight: 40,
          width: "100%",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = COLORS.accent;
          e.currentTarget.style.color = COLORS.accent;
          e.currentTarget.style.background = `${COLORS.accent}10`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = COLORS.borderAccent;
          e.currentTarget.style.color = COLORS.textSecondary;
          e.currentTarget.style.background = "transparent";
        }}
      >
        Ver detalle
      </button>
    </div>
  );
}
