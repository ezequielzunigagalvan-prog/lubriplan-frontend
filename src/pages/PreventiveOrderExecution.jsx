import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { preventiveOrdersService } from "../services/preventiveOrdersService";
import SignaturePad from "../components/ui/SignaturePad";
import MainLayout from "../layouts/MainLayout";
import { Icon } from "../components/ui/lpIcons";

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
    return (
      <MainLayout>
        <div style={{ padding: 40, textAlign: "center", color: "#94a3b8", minHeight: "100vh", background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div>
            <Icon name="loader" size="lg" style={{ marginBottom: 16, display: "block" }} />
            <p style={{ fontSize: 16, fontWeight: 600, color: "#cbd5e1" }}>Cargando orden…</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!order) {
    return (
      <MainLayout>
        <div style={{ padding: 40, textAlign: "center", minHeight: "100vh", background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div>
            <Icon name="alertCircle" size="lg" style={{ marginBottom: 16, display: "block", color: "#ef4444" }} />
            <p style={{ fontSize: 16, fontWeight: 600, color: "#ef4444" }}>Orden no encontrada</p>
            <button onClick={() => navigate("/preventive-orders")} style={{ marginTop: 20, padding: "10px 20px", borderRadius: 10, border: "1px solid #334155", background: "transparent", color: "#cbd5e1", cursor: "pointer", fontWeight: 600 }}>
              Volver a órdenes
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const completedCount = order.items?.filter((i) => i.status === "COMPLETED").length || 0;
  const totalItems = order.items?.length || 0;
  const progress = totalItems > 0 ? (completedCount / totalItems) * 100 : 0;

  return (
    <MainLayout>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: 20, minHeight: "100vh", background: "#0f172a" }}>
      {showWarning && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(15,23,42,0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              background: "#1a1f26",
              borderRadius: 20,
              maxWidth: 500,
              padding: 30,
              boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
              border: "1px solid #334155",
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 10 }}>⚠️</div>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: "#f1f5f9", marginBottom: 12 }}>
              Advertencia Importante
            </h2>
            <p style={{ color: "#cbd5e1", fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
              Una Orden de Lubricación Preventiva agrupa múltiples rutas en una sola intervención. Sin embargo, <strong>cada equipo debe respetar sus frecuencias individuales</strong> independientemente.
            </p>
            <p style={{ color: "#cbd5e1", fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
              Asegúrate de que las ejecuciones correspondan a los intervalos correctos según el plan de mantenimiento.
            </p>
            <label style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={warningAcknowledged}
                onChange={(e) => setWarningAcknowledged(e.target.checked)}
                style={{ width: 18, height: 18, cursor: "pointer" }}
              />
              <span style={{ fontSize: 13, fontWeight: 600, color: "#cbd5e1" }}>
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
                background: warningAcknowledged ? "#f97316" : "#475569",
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

      {/* Header con botones de navegación */}
      <div style={{ marginBottom: 30, position: "sticky", top: 0, background: "#0f172a", paddingBottom: 20, zIndex: 100 }}>
        {/* Botón de retroceso */}
        <button
          onClick={() => navigate(`/preventive-orders/${id}`)}
          style={{
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "transparent",
            border: "1px solid #334155",
            color: "#cbd5e1",
            padding: "8px 16px",
            borderRadius: 10,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s",
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
          <Icon name="arrowLeft" size="sm" />
          Ver detalle
        </button>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: "#f1f5f9", margin: 0, marginBottom: 4 }}>
              {order.title || `Orden #${order.id}`}
            </h1>
            <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>
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
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Icon name="play" size="sm" />
            En ejecución
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", marginBottom: 8 }}>
            Progreso: {completedCount} de {totalItems} items
          </div>
          <div
            style={{
              width: "100%",
              height: 8,
              borderRadius: 4,
              background: "#334155",
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
        <div style={{ padding: 12, borderRadius: 8, background: "#7f1d1d", color: "#fecaca", marginBottom: 20, fontWeight: 600 }}>
          {error}
        </div>
      )}

      {/* Items */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 30 }}>
        {order.items?.map((item, idx) => (
          <div
            key={item.id}
            style={{
              padding: 16,
              borderRadius: 12,
              border: item.status === "COMPLETED" ? "1px solid #166534" : "1px solid #334155",
              background: item.status === "COMPLETED" ? "#064e3b" : "#1a1f26",
              transition: "all 0.15s",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  minWidth: 48,
                  borderRadius: 8,
                  background: item.status === "COMPLETED" ? "#10b981" : "#475569",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: 700,
                  fontSize: 16,
                }}
              >
                {item.status === "COMPLETED" ? "✓" : idx + 1}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: item.status === "COMPLETED" ? "#86efac" : "#f1f5f9",
                  }}
                >
                  {item.route?.name}
                </div>
                {item.observations && (
                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 6 }}>{item.observations}</div>
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
                    background: completingItemId === item.id ? "#475569" : "#10b981",
                    color: "white",
                    fontWeight: 700,
                    cursor: completingItemId === item.id ? "default" : "pointer",
                    fontSize: 12,
                    transition: "all 0.15s",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) => {
                    if (completingItemId !== item.id) e.currentTarget.style.background = "#059669";
                  }}
                  onMouseLeave={(e) => {
                    if (completingItemId !== item.id) e.currentTarget.style.background = "#10b981";
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
        <div style={{ background: "#242b35", padding: 20, borderRadius: 12, marginBottom: 20, border: "1px solid #334155" }}>
          <SignaturePad
            onChange={setSignature}
            label="Firma del técnico responsable"
          />
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 10, justifyContent: "space-between", position: "sticky", bottom: 0, background: "#0f172a", paddingTop: 20, marginBottom: -20, marginLeft: -20, marginRight: -20, paddingLeft: 20, paddingRight: 20, paddingBottom: 20, borderTop: "1px solid #334155" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => navigate(`/preventive-orders/${id}`)}
            style={{
              padding: "10px 20px",
              borderRadius: 10,
              border: "1px solid #334155",
              background: "transparent",
              color: "#cbd5e1",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              gap: 6,
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
            <Icon name="arrowLeft" size="sm" />
            Atrás
          </button>
          <button
            onClick={() => navigate("/preventive-orders/technician")}
            style={{
              padding: "10px 20px",
              borderRadius: 10,
              border: "1px solid #334155",
              background: "transparent",
              color: "#cbd5e1",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              gap: 6,
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
            <Icon name="home" size="sm" />
            Mis órdenes
          </button>
        </div>

        {completedCount === totalItems && (
          <button
            onClick={handleCompleteOrder}
            style={{
              padding: "10px 24px",
              borderRadius: 10,
              border: "none",
              background: signature ? "linear-gradient(135deg, #10b981, #059669)" : "#475569",
              color: "white",
              fontWeight: 700,
              cursor: signature ? "pointer" : "default",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
            onMouseEnter={(e) => {
              if (signature) {
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(16, 185, 129, 0.4)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <Icon name="check" size="sm" />
            Completar Orden
          </button>
        )}
      </div>
    </div>
    </MainLayout>
  );
}
