import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { preventiveOrdersService } from "../services/preventiveOrdersService";
import SignaturePad from "../components/ui/SignaturePad";

export default function PreventiveOrderExecution() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [signature, setSignature] = useState(null);
  const [completingItemId, setCompletingItemId] = useState(null);

  // Warning state
  const [showWarning, setShowWarning] = useState(false);
  const [warningAcknowledged, setWarningAcknowledged] = useState(false);

  useEffect(() => {
    loadOrder();
    checkWarning();
  }, [id]);

  function checkWarning() {
    const acknowledged = sessionStorage.getItem("olpWarningAcknowledged");
    if (!acknowledged) {
      setShowWarning(true);
    }
  }

  function acknowledgeWarning() {
    sessionStorage.setItem("olpWarningAcknowledged", "true");
    setWarningAcknowledged(true);
    setShowWarning(false);
  }

  async function loadOrder() {
    setLoading(true);
    try {
      const data = await preventiveOrdersService.get(Number(id));
      setOrder(data);
    } catch (err) {
      setError("No se pudo cargar la orden");
    } finally {
      setLoading(false);
    }
  }

  async function handleCompleteItem(itemId) {
    setCompletingItemId(itemId);
    try {
      await preventiveOrdersService.completeItem(Number(id), itemId, "COMPLETED", "", null);
      await loadOrder();
    } catch (err) {
      setError("Error completando item");
    } finally {
      setCompletingItemId(null);
    }
  }

  async function handleCompleteOrder() {
    if (!signature) {
      setError("La firma es requerida para completar la orden");
      return;
    }

    try {
      await preventiveOrdersService.complete(Number(id), signature);
      navigate("/preventive-orders");
    } catch (err) {
      setError(err.response?.data?.error || "Error completando orden");
    }
  }

  if (loading) {
    return <div style={{ padding: 20, textAlign: "center" }}>Cargando orden…</div>;
  }

  if (!order) {
    return <div style={{ padding: 20, textAlign: "center", color: "#ef4444" }}>Orden no encontrada</div>;
  }

  const completedCount = order.items?.filter((i) => i.status === "COMPLETED").length || 0;
  const totalItems = order.items?.length || 0;
  const progress = totalItems > 0 ? (completedCount / totalItems) * 100 : 0;

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 20 }}>
      {showWarning && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(15,23,42,0.55)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: 20,
              maxWidth: 500,
              padding: 30,
              boxShadow: "0 24px 60px rgba(15,23,42,0.2)",
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 10 }}>⚠️</div>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: "#0f172a", marginBottom: 12 }}>
              Advertencia Importante
            </h2>
            <p style={{ color: "#475569", fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
              Una Orden de Lubricación Preventiva agrupa múltiples rutas en una sola intervención. Sin embargo, <strong>cada equipo debe respetar sus frecuencias individuales</strong> independientemente.
            </p>
            <p style={{ color: "#475569", fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
              Asegúrate de que las ejecuciones correspondan a los intervalos correctos según el plan de mantenimiento.
            </p>
            <label style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={warningAcknowledged}
                onChange={(e) => setWarningAcknowledged(e.target.checked)}
                style={{ width: 18, height: 18, cursor: "pointer" }}
              />
              <span style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>
                He leído y entiendo la advertencia
              </span>
            </label>
            <button
              onClick={acknowledgeWarning}
              disabled={!warningAcknowledged}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 10,
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

      <div style={{ marginBottom: 30 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", margin: 0, marginBottom: 4 }}>
              {order.title}
            </h1>
            <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
              {order.equipment?.name} • {new Date(order.scheduledDate).toLocaleDateString()}
            </p>
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              padding: "6px 14px",
              borderRadius: 6,
              background: "#f97316",
              color: "white",
            }}
          >
            En progreso
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 8 }}>
            Progreso: {completedCount} de {totalItems} items
          </div>
          <div
            style={{
              width: "100%",
              height: 8,
              borderRadius: 4,
              background: "#e2e8f0",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                background: "#10b981",
                transition: "width 0.3s",
              }}
            />
          </div>
        </div>
      </div>

      {error && (
        <div style={{ padding: 12, borderRadius: 8, background: "#fee2e2", color: "#dc2626", marginBottom: 20, fontWeight: 600 }}>
          {error}
        </div>
      )}

      {/* Items */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 30 }}>
        {order.items?.map((item) => (
          <div
            key={item.id}
            style={{
              padding: 16,
              borderRadius: 12,
              border: item.status === "COMPLETED" ? "1px solid #dcfce7" : "1px solid #cbd5e1",
              background: item.status === "COMPLETED" ? "#f0fdf4" : "white",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: item.status === "COMPLETED" ? "#15803d" : "#0f172a",
                  }}
                >
                  {item.status === "COMPLETED" && "✓ "}
                  {item.route?.name}
                </div>
                {item.observations && (
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>{item.observations}</div>
                )}
              </div>
              {item.status !== "COMPLETED" && (
                <button
                  onClick={() => handleCompleteItem(item.id)}
                  disabled={completingItemId === item.id}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: "none",
                    background: completingItemId === item.id ? "#cbd5e1" : "#10b981",
                    color: "white",
                    fontWeight: 700,
                    cursor: completingItemId === item.id ? "default" : "pointer",
                    fontSize: 12,
                  }}
                >
                  {completingItemId === item.id ? "Completando…" : "Completar"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Signature */}
      {completedCount === totalItems && (
        <div style={{ background: "#f8fafc", padding: 20, borderRadius: 12, marginBottom: 20 }}>
          <SignaturePad
            onChange={setSignature}
            label="Firma del técnico responsable"
          />
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button
          onClick={() => navigate(`/preventive-orders/${id}`)}
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
          Cancelar
        </button>
        {completedCount === totalItems && (
          <button
            onClick={handleCompleteOrder}
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              border: "none",
              background: signature ? "#10b981" : "#cbd5e1",
              color: "white",
              fontWeight: 700,
              cursor: signature ? "pointer" : "default",
            }}
          >
            ✓ Completar Orden
          </button>
        )}
      </div>
    </div>
  );
}
