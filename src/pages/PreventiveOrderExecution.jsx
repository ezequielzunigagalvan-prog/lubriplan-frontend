import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { preventiveOrdersService } from "../services/preventiveOrdersService";
import SignaturePad from "../components/ui/SignaturePad";
import { Icon } from "../components/ui/lpIcons";
import MainLayout from "../layouts/MainLayout";

export default function PreventiveOrderExecution() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [completing, setCompleting] = useState(false);
  const [signature, setSignature] = useState(null);
  const [showWarning, setShowWarning] = useState(true);
  const [warningAcknowledged, setWarningAcknowledged] = useState(false);
  const [itemStates, setItemStates] = useState({});
  const [itemObservations, setItemObservations] = useState({});

  useEffect(() => {
    loadOrder();
  }, [id]);

  async function loadOrder() {
    setLoading(true);
    try {
      const data = await preventiveOrdersService.get(Number(id));
      setOrder(data);

      // Inicializar estados de items
      const states = {};
      const observations = {};
      if (data.items && Array.isArray(data.items)) {
        data.items.forEach((item) => {
          states[item.id] = item.status === "COMPLETED" ? true : false;
          observations[item.id] = item.observations || "";
        });
      }
      setItemStates(states);
      setItemObservations(observations);
    } catch (err) {
      setError("No se pudo cargar la orden");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCompleteItem(itemId) {
    try {
      const observations = itemObservations[itemId] || "";
      await preventiveOrdersService.completeItem(Number(id), itemId, "COMPLETED", observations, null);
      setItemStates((prev) => ({ ...prev, [itemId]: true }));
    } catch (err) {
      setError("Error completando item");
      console.error(err);
    }
  }

  async function handleCompleteOrder() {
    if (!signature) {
      setError("Se requiere firma para completar la orden");
      return;
    }

    setCompleting(true);
    try {
      await preventiveOrdersService.complete(Number(id), signature);
      setTimeout(() => {
        navigate("/preventive-orders");
      }, 1000);
    } catch (err) {
      setError(err?.message || "Error completando orden");
      setCompleting(false);
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
          <p>Orden no encontrada</p>
          <button
            onClick={() => navigate("/preventive-orders")}
            style={{
              marginTop: 16,
              padding: "10px 20px",
              borderRadius: 8,
              border: "1px solid #ef4444",
              background: "transparent",
              color: "#ef4444",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Volver a órdenes
          </button>
        </div>
      </MainLayout>
    );
  }

  const allItemsCompleted = order.items && Array.isArray(order.items) && order.items.length > 0 && order.items.every((item) => itemStates[item.id] === true);
  const completedCount = order.items ? order.items.filter((item) => itemStates[item.id] === true).length : 0;
  const totalItems = order.items ? order.items.length : 0;

  return (
    <MainLayout>
      <div style={{ padding: "24px", minHeight: "100vh", background: "#0A0C0F" }}>
        {/* Warning Modal */}
        {showWarning && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <div style={{ background: "white", borderRadius: 12, padding: 32, maxWidth: 500, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
              <h2 style={{ margin: "0 0 16px 0", fontSize: 20, fontWeight: 900, color: "#1e293b" }}>Advertencia Importante</h2>
              <p style={{ margin: "0 0 16px 0", color: "#475569", lineHeight: 1.6 }}>
                Las órdenes preventivas deben ejecutarse respetando la frecuencia establecida. No ejecutar antes de la fecha programada puede afectar el ciclo de mantenimiento.
              </p>
              <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={warningAcknowledged}
                  onChange={(e) => setWarningAcknowledged(e.target.checked)}
                  style={{ cursor: "pointer" }}
                />
                <span style={{ color: "#334155", fontSize: 13 }}>Entiendo y continúo con la ejecución</span>
              </label>
              <button
                onClick={() => setShowWarning(false)}
                disabled={!warningAcknowledged}
                style={{
                  width: "100%",
                  padding: "12px 20px",
                  borderRadius: 8,
                  border: "none",
                  background: warningAcknowledged ? "#f97316" : "#cbd5e1",
                  color: "white",
                  fontWeight: 700,
                  cursor: warningAcknowledged ? "pointer" : "default",
                }}
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ margin: "0 0 8px 0", fontSize: 28, fontWeight: 900, color: "#f1f5f9" }}>
              Orden #{order.id} - En Ejecución
            </h1>
            <p style={{ margin: 0, color: "#94a3b8", fontSize: 14 }}>
              {completedCount} de {totalItems} items completados
            </p>
          </div>
          <button
            onClick={() => navigate(`/preventive-orders/${order.id}`)}
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
            Ver Detalle
          </button>
        </div>

        {/* Progress Bar */}
        <div
          style={{
            marginBottom: 24,
            padding: 16,
            borderRadius: 12,
            background: "linear-gradient(135deg, #1e293b, #1a1f26)",
            border: "1px solid #334155",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#cbd5e1" }}>Progreso</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>
              {Math.round((completedCount / totalItems) * 100)}%
            </span>
          </div>
          <div style={{ height: 8, background: "#334155", borderRadius: 4, overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                background: "linear-gradient(90deg, #f97316, #ea580c)",
                width: `${(completedCount / totalItems) * 100}%`,
                transition: "width 0.3s",
              }}
            />
          </div>
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

        {/* Items List */}
        <div style={{ display: "grid", gap: 12, marginBottom: 32 }}>
          {order.items && Array.isArray(order.items)
            ? order.items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    border: "1px solid #334155",
                    background: "linear-gradient(135deg, #1e293b, #1a1f26)",
                    transition: "all 0.3s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={itemStates[item.id] || false}
                      onChange={() => {
                        if (!itemStates[item.id]) {
                          handleCompleteItem(item.id);
                        }
                      }}
                      style={{
                        width: 52,
                        height: 52,
                        cursor: "pointer",
                        marginTop: 4,
                      }}
                    />

                    {/* Item Info */}
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: "0 0 8px 0", fontSize: 15, fontWeight: 800, color: "#f1f5f9" }}>
                        {item.routeName || "Item"}
                      </h3>
                      {item.route && (
                        <div style={{ display: "grid", gap: 4, fontSize: 13, color: "#cbd5e1", marginBottom: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <Icon name="settings" size="sm" />
                            {item.route.name}
                          </div>
                        </div>
                      )}

                      {/* Observaciones */}
                      {itemStates[item.id] && (
                        <textarea
                          placeholder="Añade observaciones (opcional)"
                          value={itemObservations[item.id] || ""}
                          onChange={(e) => setItemObservations((prev) => ({ ...prev, [item.id]: e.target.value }))}
                          style={{
                            width: "100%",
                            padding: 8,
                            borderRadius: 8,
                            border: "1px solid #334155",
                            background: "#0A0C0F",
                            color: "#cbd5e1",
                            fontSize: 12,
                            fontFamily: "inherit",
                            minHeight: 60,
                            resize: "vertical",
                          }}
                        />
                      )}
                    </div>

                    {/* Status */}
                    <div
                      style={{
                        padding: "6px 12px",
                        borderRadius: 8,
                        background: itemStates[item.id] ? "#10b98120" : "#f59e0b20",
                        color: itemStates[item.id] ? "#10b981" : "#f59e0b",
                        fontSize: 12,
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {itemStates[item.id] ? "✓ Completado" : "Pendiente"}
                    </div>
                  </div>
                </div>
              ))
            : null}
        </div>

        {/* Firma */}
        {allItemsCompleted && (
          <div
            style={{
              padding: 20,
              borderRadius: 12,
              border: "2px solid #f97316",
              background: "#f97316" + "20",
              marginBottom: 24,
            }}
          >
            <h3 style={{ margin: "0 0 12px 0", fontSize: 15, fontWeight: 800, color: "#f1f5f9" }}>
              Firma Digital
            </h3>
            <SignaturePad onSignatureCapture={setSignature} />
          </div>
        )}

        {/* Botones Finales */}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            onClick={() => navigate(`/preventive-orders/${order.id}`)}
            style={{
              padding: "12px 24px",
              borderRadius: 10,
              border: "1px solid #334155",
              background: "transparent",
              color: "#cbd5e1",
              fontWeight: 700,
              cursor: "pointer",
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
            Atrás
          </button>
          <button
            onClick={() => navigate("/preventive-orders/technician")}
            style={{
              padding: "12px 24px",
              borderRadius: 10,
              border: "none",
              background: "#3b82f6",
              color: "white",
              fontWeight: 700,
              cursor: "pointer",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#2563eb")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#3b82f6")}
          >
            Mis Órdenes
          </button>
          <button
            onClick={handleCompleteOrder}
            disabled={!allItemsCompleted || completing}
            style={{
              padding: "12px 24px",
              borderRadius: 10,
              border: "none",
              background: allItemsCompleted && !completing ? "#10b981" : "#94a3b8",
              color: "white",
              fontWeight: 700,
              cursor: allItemsCompleted && !completing ? "pointer" : "default",
            }}
            onMouseEnter={(e) => {
              if (allItemsCompleted && !completing) {
                e.currentTarget.style.background = "#059669";
              }
            }}
            onMouseLeave={(e) => {
              if (allItemsCompleted && !completing) {
                e.currentTarget.style.background = "#10b981";
              }
            }}
          >
            {completing ? "Finalizando…" : "Completar Orden"}
          </button>
        </div>
      </div>
    </MainLayout>
  );
}
