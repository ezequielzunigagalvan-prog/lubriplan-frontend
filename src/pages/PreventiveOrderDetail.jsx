import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { preventiveOrdersService } from "../services/preventiveOrdersService";
import { httpGet } from "../services/http";

export default function PreventiveOrderDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [technicians, setTechnicians] = useState([]);
  const [selectedTechnician, setSelectedTechnician] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadOrder();
    loadTechnicians();
  }, [id]);

  async function loadOrder() {
    setLoading(true);
    try {
      const data = await preventiveOrdersService.get(Number(id));
      setOrder(data);
      if (data.assignedTo) {
        setSelectedTechnician(data.assignedTo);
      }
    } catch (err) {
      setError("No se pudo cargar la orden");
    } finally {
      setLoading(false);
    }
  }

  async function loadTechnicians() {
    try {
      const data = await httpGet("/technicians");
      setTechnicians(data?.data || []);
    } catch (err) {
      console.error("Error loading technicians:", err);
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

  async function handleOpen() {
    setActionLoading(true);
    try {
      const updated = await preventiveOrdersService.open(Number(id));
      setOrder(updated);
    } catch (err) {
      setError(err.response?.data?.error || "Error abriendo orden");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleStart() {
    if (!selectedTechnician) {
      setError("Selecciona un técnico");
      return;
    }

    setActionLoading(true);
    try {
      const updated = await preventiveOrdersService.start(Number(id), selectedTechnician);
      setOrder(updated);
    } catch (err) {
      setError(err.response?.data?.error || "Error iniciando orden");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleEdit() {
    navigate(`/preventive-orders/${id}/edit`);
  }

  async function handleCancel() {
    if (window.confirm("¿Seguro que deseas cancelar esta orden?")) {
      setActionLoading(true);
      try {
        const updated = await preventiveOrdersService.cancel(Number(id));
        setOrder(updated);
      } catch (err) {
        setError(err.response?.data?.error || "Error cancelando orden");
      } finally {
        setActionLoading(false);
      }
    }
  }

  if (loading) {
    return <div style={{ padding: 20, textAlign: "center" }}>Cargando…</div>;
  }

  if (!order) {
    return <div style={{ padding: 20, textAlign: "center", color: "#ef4444" }}>Orden no encontrada</div>;
  }

  const completedCount = order.items?.filter((i) => i.status === "COMPLETED").length || 0;
  const totalItems = order.items?.length || 0;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 30 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: "#0f172a", margin: 0, marginBottom: 10 }}>
            {order.title}
          </h1>
          <div style={{ fontSize: 14, color: "#64748b" }}>
            {order.equipment?.name} • {order.equipment?.code}
          </div>
        </div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            padding: "8px 16px",
            borderRadius: 8,
            background: `${statusColors[order.status]}15`,
            color: statusColors[order.status],
          }}
        >
          {statusLabels[order.status]}
        </div>
      </div>

      {error && (
        <div style={{ padding: 12, borderRadius: 8, background: "#fee2e2", color: "#dc2626", marginBottom: 20, fontWeight: 600 }}>
          {error}
        </div>
      )}

      {/* Grid de detalles */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, marginBottom: 30 }}>
        <div style={{ padding: 16, borderRadius: 12, background: "#f8fafc" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 6 }}>Fecha Programada</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>
            {new Date(order.scheduledDate).toLocaleDateString()}
          </div>
        </div>
        <div style={{ padding: 16, borderRadius: 12, background: "#f8fafc" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 6 }}>Items</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>
            {completedCount} de {totalItems} completados
          </div>
        </div>
        <div style={{ padding: 16, borderRadius: 12, background: "#f8fafc" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 6 }}>Creada por</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
            {order.createdByUser?.name}
          </div>
        </div>
        <div style={{ padding: 16, borderRadius: 12, background: "#f8fafc" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 6 }}>Asignado a</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
            {order.assignedToUser?.name || "Sin asignar"}
          </div>
        </div>
      </div>

      {/* Items */}
      <div style={{ marginBottom: 30 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 16 }}>Items de la Orden</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {order.items?.map((item) => (
            <div
              key={item.id}
              style={{
                padding: 14,
                borderRadius: 10,
                border: item.status === "COMPLETED" ? "1px solid #dcfce7" : "1px solid #e2e8f0",
                background: item.status === "COMPLETED" ? "#f0fdf4" : "white",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ fontSize: 16 }}>
                  {item.status === "COMPLETED" ? "✅" : "⭕"}
                </div>
                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      color: item.status === "COMPLETED" ? "#15803d" : "#0f172a",
                    }}
                  >
                    {item.route?.name}
                  </div>
                  {item.observations && (
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                      {item.observations}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
        <button
          onClick={() => navigate("/preventive-orders")}
          style={{
            padding: "10px 20px",
            borderRadius: 8,
            border: "1px solid #cbd5e1",
            background: "white",
            color: "#475569",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Atrás
        </button>

        {order.status === "DRAFT" && (
          <>
            <button
              onClick={handleEdit}
              style={{
                padding: "10px 20px",
                borderRadius: 8,
                border: "1px solid #f97316",
                background: "white",
                color: "#f97316",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              ✏️ Editar
            </button>
            <button
              onClick={handleOpen}
              disabled={actionLoading}
              style={{
                padding: "10px 20px",
                borderRadius: 8,
                border: "none",
                background: actionLoading ? "#cbd5e1" : "#3b82f6",
                color: "white",
                fontWeight: 700,
                cursor: actionLoading ? "default" : "pointer",
              }}
            >
              {actionLoading ? "Procesando…" : "Abrir Orden"}
            </button>
          </>
        )}

        {["DRAFT", "OPEN"].includes(order.status) && (
          <button
            onClick={handleCancel}
            disabled={actionLoading}
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              border: "1px solid #ef4444",
              background: "white",
              color: "#ef4444",
              fontWeight: 700,
              cursor: actionLoading ? "default" : "pointer",
            }}
          >
            Cancelar
          </button>
        )}

        {order.status === "OPEN" && (
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <select
              value={selectedTechnician}
              onChange={(e) => setSelectedTechnician(e.target.value)}
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                fontFamily: "inherit",
              }}
            >
              <option value="">Selecciona técnico</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleStart}
              disabled={actionLoading || !selectedTechnician}
              style={{
                padding: "10px 20px",
                borderRadius: 8,
                border: "none",
                background: selectedTechnician && !actionLoading ? "#f59e0b" : "#cbd5e1",
                color: "white",
                fontWeight: 700,
                cursor: selectedTechnician && !actionLoading ? "pointer" : "default",
              }}
            >
              {actionLoading ? "Procesando…" : "Iniciar Ejecución"}
            </button>
          </div>
        )}

        {order.status === "IN_PROGRESS" && (
          <button
            onClick={() => navigate(`/preventive-orders/${id}/execute`)}
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              border: "none",
              background: "#f59e0b",
              color: "white",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            ⚡ Continuar Ejecución
          </button>
        )}
      </div>

      {order.notes && (
        <div style={{ padding: 16, borderRadius: 12, background: "#f8fafc", borderLeft: "4px solid #f97316" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 8 }}>Notas</div>
          <div style={{ fontSize: 14, color: "#475569", whiteSpace: "pre-wrap" }}>{order.notes}</div>
        </div>
      )}
    </div>
  );
}
