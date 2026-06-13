import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { preventiveOrdersService } from "../services/preventiveOrdersService";
import SignaturePad from "../components/ui/SignaturePad";
import { Icon } from "../components/ui/lpIcons";
import MainLayout from "../layouts/MainLayout";

const COLORS = {
  bgBase: "#070B0F",
  bgCard: "#0D1117",
  bgCardHover: "#131920",
  bgElevated: "#1A2232",
  border: "#1E2D42",
  borderAccent: "#818cf8",
  textPrimary: "#F0F4F8",
  textSecondary: "#8899AA",
  textMuted: "#4A5568",
  accent: "#818cf8",
  accentHover: "#6366f1",
  green: "#10B981",
  red: "#EF4444",
  blue: "#3B82F6",
  purple: "#8B5CF6",
};

const FREQUENCY_COLORS = {
  DAILY: { bg: "#EF444420", border: "#EF4444", label: "Diaria" },
  WEEKLY: { bg: "#F59E0B20", border: "#F59E0B", label: "Semanal" },
  MONTHLY: { bg: "#818cf820", border: "#818cf8", label: "Mensual" },
  QUARTERLY: { bg: "#10B98120", border: "#10B981", label: "Trimestral" },
  ANNUAL: { bg: "#3B82F620", border: "#3B82F6", label: "Anual" },
  BIMONTHLY: { bg: "#8B5CF620", border: "#8B5CF6", label: "Bimestral" },
  SEMIANNUAL: { bg: "#06B6D420", border: "#06B6D4", label: "Semestral" },
};

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
        <div style={{ padding: 40, textAlign: "center", color: COLORS.textMuted, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div>
            <Icon name="loader" size="lg" style={{ marginBottom: 16, display: "block", color: COLORS.accent }} />
            <p>Cargando orden…</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!order) {
    return (
      <MainLayout>
        <div style={{ padding: 40, textAlign: "center", color: COLORS.red, minHeight: "100vh", background: COLORS.bgBase }}>
          <p style={{ fontSize: 80, margin: "0 0 16px 0" }}>404</p>
          <h1 style={{ margin: "0 0 8px 0", fontSize: 24, fontWeight: 900, color: COLORS.textPrimary }}>
            Orden No Encontrada
          </h1>
          <p style={{ color: COLORS.textSecondary, marginBottom: 24 }}>La orden que buscas no existe o fue eliminada.</p>
          <button
            onClick={() => navigate("/preventive-orders")}
            style={{
              padding: "12px 24px",
              borderRadius: 10,
              border: `2px solid ${COLORS.red}`,
              background: "transparent",
              color: COLORS.red,
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

  const completedCount = order.items ? order.items.filter((item) => itemStates[item.id] === true).length : 0;
  const totalItems = order.items ? order.items.length : 0;
  const allItemsCompleted = totalItems > 0 && completedCount === totalItems;

  return (
    <MainLayout>
      <div style={{ background: COLORS.bgBase, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        {/* Warning Modal */}
        {showWarning && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <div style={{ background: COLORS.bgCard, borderRadius: 16, padding: 48, maxWidth: 480, border: `2px solid ${COLORS.borderAccent}`, boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
              <div style={{ textAlign: "center", marginBottom: 32 }}>
                <div style={{ fontSize: 64, marginBottom: 16, background: `${COLORS.accent}20`, borderRadius: "50%", width: 80, height: 80, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                  ⚠️
                </div>
                <h2 style={{ margin: "0 0 12px 0", fontSize: 20, fontWeight: 900, color: COLORS.textPrimary }}>
                  Aviso Técnico Importante
                </h2>
              </div>

              <p style={{ color: COLORS.textSecondary, lineHeight: 1.6, marginBottom: 24, textAlign: "center" }}>
                Las órdenes preventivas deben ejecutarse respetando la frecuencia establecida. No ejecutar conforme a calendario puede afectar el ciclo de mantenimiento.
              </p>

              <label style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 24, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={warningAcknowledged}
                  onChange={(e) => setWarningAcknowledged(e.target.checked)}
                  style={{ marginTop: 4, width: 18, height: 18, cursor: "pointer", accentColor: COLORS.accent }}
                />
                <span style={{ color: COLORS.textSecondary, fontSize: 14 }}>
                  Entiendo las implicaciones y deseo continuar con la ejecución de esta orden preventiva
                </span>
              </label>

              <button
                onClick={() => setShowWarning(false)}
                disabled={!warningAcknowledged}
                style={{
                  width: "100%",
                  padding: "12px 20px",
                  borderRadius: 10,
                  border: "none",
                  background: warningAcknowledged ? COLORS.accent : COLORS.textMuted,
                  color: warningAcknowledged ? COLORS.bgBase : COLORS.textSecondary,
                  fontWeight: 700,
                  cursor: warningAcknowledged ? "pointer" : "default",
                  transition: "all 0.3s",
                }}
                onMouseEnter={(e) => {
                  if (warningAcknowledged) e.currentTarget.style.background = COLORS.accentHover;
                }}
                onMouseLeave={(e) => {
                  if (warningAcknowledged) e.currentTarget.style.background = COLORS.accent;
                }}
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* Sticky Header */}
        <div style={{ position: "sticky", top: 0, zIndex: 100, background: COLORS.bgCard, borderBottom: `1px solid ${COLORS.border}`, padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Icon name="settings" size="lg" style={{ color: COLORS.accent }} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 900, color: COLORS.textPrimary }}>
                {order.equipment?.name || "Equipo"}
              </div>
              <div style={{ fontSize: 12, color: COLORS.textSecondary }}>
                Orden #{order.id}
              </div>
            </div>
          </div>

          <div style={{ flex: 1, marginX: 24, display: "flex", alignItems: "center", gap: 12, maxWidth: 300 }}>
            <div style={{ height: 6, flex: 1, background: COLORS.border, borderRadius: 3, overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  background: `linear-gradient(90deg, ${COLORS.accent}, ${COLORS.accentHover})`,
                  width: `${totalItems > 0 ? (completedCount / totalItems) * 100 : 0}%`,
                  transition: "width 0.3s",
                }}
              />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.textPrimary, whiteSpace: "nowrap" }}>
              {completedCount}/{totalItems}
            </span>
          </div>

          <button
            onClick={() => navigate(`/preventive-orders/${order.id}`)}
            style={{
              background: "transparent",
              border: "none",
              color: COLORS.textSecondary,
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
              padding: "6px 12px",
              borderRadius: 8,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = COLORS.accent;
              e.currentTarget.style.background = `${COLORS.accent}10`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = COLORS.textSecondary;
              e.currentTarget.style.background = "transparent";
            }}
          >
            Ver Detalle
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: "24px", overflow: "auto" }}>
          {error && (
            <div style={{ marginBottom: 16, padding: 12, borderRadius: 8, background: "#EF444420", color: COLORS.red, fontSize: 13, border: `1px solid ${COLORS.red}40` }}>
              {error}
            </div>
          )}

          {/* Items List */}
          <div style={{ display: "grid", gap: 16, marginBottom: 32 }}>
            {order.items && Array.isArray(order.items)
              ? order.items.map((item) => {
                  const isCompleted = itemStates[item.id];
                  const freqColor = FREQUENCY_COLORS[item.route?.frequencyType] || FREQUENCY_COLORS.MONTHLY;

                  return (
                    <div
                      key={item.id}
                      style={{
                        padding: 20,
                        borderRadius: 12,
                        background: isCompleted ? `${COLORS.green}08` : COLORS.bgCard,
                        border: `1px solid ${isCompleted ? COLORS.green : COLORS.border}`,
                        borderLeft: `3px solid ${isCompleted ? COLORS.green : freqColor.border}`,
                        transition: "all 0.3s",
                      }}
                    >
                      {/* Header con checkbox y nombre */}
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 16 }}>
                        <input
                          type="checkbox"
                          checked={isCompleted}
                          onChange={() => {
                            if (!isCompleted) {
                              handleCompleteItem(item.id);
                            }
                          }}
                          style={{
                            width: 52,
                            height: 52,
                            cursor: "pointer",
                            accentColor: COLORS.green,
                            flexShrink: 0,
                          }}
                        />

                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
                            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: COLORS.textPrimary }}>
                              {item.route?.name || "Ruta sin nombre"}
                            </h3>
                            <span
                              style={{
                                padding: "4px 8px",
                                borderRadius: 6,
                                fontSize: 11,
                                fontWeight: 700,
                                background: isCompleted ? `${COLORS.green}20` : freqColor.bg,
                                color: isCompleted ? COLORS.green : freqColor.border,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {isCompleted ? "✓ Completado" : freqColor.label}
                            </span>
                          </div>

                          {/* Datos técnicos grid */}
                          {item.route && (
                            <div style={{ background: COLORS.bgCardHover, padding: 14, borderRadius: 8, marginBottom: 12 }}>
                              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                                {item.route.lubricantName && (
                                  <div>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", marginBottom: 4 }}>
                                      🛢 Lubricante
                                    </div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.textPrimary }}>
                                      {item.route.lubricantName}
                                    </div>
                                  </div>
                                )}

                                {item.route.quantity && (
                                  <div>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", marginBottom: 4 }}>
                                      📊 Cantidad
                                    </div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.textPrimary }}>
                                      {item.route.quantity} {item.route.unit || "ml"}
                                    </div>
                                  </div>
                                )}

                                {item.route.method && (
                                  <div>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", marginBottom: 4 }}>
                                      🔧 Método
                                    </div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.textPrimary }}>
                                      {item.route.method}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Imagen */}
                          {item.route?.imageUrl && (
                            <div style={{ marginBottom: 12, borderRadius: 8, overflow: "hidden", maxHeight: 120 }}>
                              <img
                                src={item.route.imageUrl}
                                alt={item.route.name}
                                style={{ width: "100%", height: "auto", maxHeight: 120, objectFit: "cover", borderRadius: 8 }}
                                onError={(e) => (e.target.style.display = "none")}
                              />
                            </div>
                          )}

                          {/* Instrucciones */}
                          {item.route?.instructions && (
                            <div style={{ marginBottom: 12, padding: 12, borderRadius: 8, background: `${COLORS.blue}10`, borderLeft: `3px solid ${COLORS.blue}` }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", marginBottom: 4 }}>
                                📋 Instrucciones
                              </div>
                              <div style={{ fontSize: 12, color: COLORS.textSecondary, lineHeight: 1.5 }}>
                                {item.route.instructions}
                              </div>
                            </div>
                          )}

                          {/* Observaciones - se expande al completar */}
                          {isCompleted && (
                            <textarea
                              placeholder="Añade observaciones técnicas o problemas encontrados (opcional)"
                              value={itemObservations[item.id] || ""}
                              onChange={(e) => setItemObservations((prev) => ({ ...prev, [item.id]: e.target.value }))}
                              style={{
                                width: "100%",
                                padding: 12,
                                borderRadius: 8,
                                border: `1px solid ${COLORS.border}`,
                                background: COLORS.bgElevated,
                                color: COLORS.textPrimary,
                                fontSize: 12,
                                fontFamily: "inherit",
                                minHeight: 80,
                                resize: "vertical",
                              }}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              : null}
          </div>

          {/* Firma Digital */}
          {allItemsCompleted && (
            <div style={{ padding: 20, borderRadius: 12, border: `2px solid ${COLORS.borderAccent}`, background: `${COLORS.accent}10`, marginBottom: 100 }}>
              <h3 style={{ margin: "0 0 12px 0", fontSize: 15, fontWeight: 900, color: COLORS.textPrimary }}>
                Firma Digital
              </h3>
              <SignaturePad onSignatureCapture={setSignature} />
            </div>
          )}
        </div>

        {/* Sticky Footer */}
        <div style={{ position: "sticky", bottom: 0, background: COLORS.bgCard, borderTop: `1px solid ${COLORS.border}`, padding: "16px 24px", display: "flex", gap: 8, justifyContent: "flex-end", alignItems: "center" }}>
          <button
            onClick={() => navigate(`/preventive-orders/${order.id}`)}
            style={{
              padding: "12px 24px",
              borderRadius: 10,
              border: `1px solid ${COLORS.border}`,
              background: "transparent",
              color: COLORS.textSecondary,
              fontWeight: 700,
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
            Atrás
          </button>

          <button
            onClick={handleCompleteOrder}
            disabled={!allItemsCompleted || completing}
            style={{
              padding: "12px 28px",
              borderRadius: 10,
              border: "none",
              background: allItemsCompleted && !completing ? COLORS.green : COLORS.textMuted,
              color: "white",
              fontWeight: 700,
              cursor: allItemsCompleted && !completing ? "pointer" : "not-allowed",
              opacity: allItemsCompleted && !completing ? 1 : 0.4,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              if (allItemsCompleted && !completing) {
                e.currentTarget.style.background = "#059669";
                e.currentTarget.style.boxShadow = `0 8px 16px ${COLORS.green}40`;
              }
            }}
            onMouseLeave={(e) => {
              if (allItemsCompleted && !completing) {
                e.currentTarget.style.background = COLORS.green;
                e.currentTarget.style.boxShadow = "none";
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
