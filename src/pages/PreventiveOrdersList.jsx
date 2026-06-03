import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { preventiveOrdersService } from "../services/preventiveOrdersService";

export default function PreventiveOrdersList() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

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
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30 }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: "#0f172a" }}>
          Órdenes de Lubricación Preventiva
        </h1>
        <button
          onClick={() => navigate("/preventive-orders/new")}
          style={{
            background: "#f97316",
            color: "white",
            border: "none",
            padding: "10px 20px",
            borderRadius: 10,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          ⚡ Nueva Orden
        </button>
      </div>

      <div style={{ marginBottom: 20, display: "flex", gap: 10 }}>
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
              background: status === s ? "#f97316" : "white",
              color: status === s ? "white" : "#475569",
              borderColor: status === s ? "#f97316" : "#cbd5e1",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {s ? statusLabels[s] : "Todas"}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>Cargando órdenes…</div>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>📋</div>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Sin órdenes</div>
          <div style={{ fontSize: 13 }}>Crea una nueva orden para comenzar</div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {orders.map((order) => (
            <div
              key={order.id}
              onClick={() => navigate(`/preventive-orders/${order.id}`)}
              style={{
                padding: 16,
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                background: "white",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#cbd5e1";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(15,23,42,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#e2e8f0";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>
                    {order.title}
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>
                    {order.equipment?.name} • {new Date(order.scheduledDate).toLocaleDateString()}
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12, color: "#64748b" }}>
                    <span>📋 {order.items?.length || 0} items</span>
                    <span>
                      ✓{" "}
                      {order.items?.filter((i) => i.status === "COMPLETED").length || 0} completados
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    display: "inline-block",
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "4px 12px",
                    borderRadius: 6,
                    background: `${statusColors[order.status]}15`,
                    color: statusColors[order.status],
                  }}
                >
                  {statusLabels[order.status]}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {total > 20 && (
        <div style={{ marginTop: 30, display: "flex", justifyContent: "center", gap: 10 }}>
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #cbd5e1", cursor: page === 1 ? "default" : "pointer" }}
          >
            Anterior
          </button>
          <span style={{ display: "flex", alignItems: "center", fontWeight: 600, color: "#475569" }}>
            Página {page} de {Math.ceil(total / 20)}
          </span>
          <button
            disabled={page * 20 >= total}
            onClick={() => setPage(page + 1)}
            style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #cbd5e1", cursor: page * 20 >= total ? "default" : "pointer" }}
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
