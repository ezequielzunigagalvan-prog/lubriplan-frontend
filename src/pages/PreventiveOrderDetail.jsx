import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { preventiveOrdersService } from "../services/preventiveOrdersService";
import { httpGet } from "../services/http";
import { Icon } from "../components/ui/lpIcons";

export default function PreventiveOrderDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
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
    setNotFound(false);
    try {
      const data = await preventiveOrdersService.get(Number(id));
      setOrder(data);
      if (data.assignedTo) {
        setSelectedTechnician(data.assignedTo);
      }
    } catch (err) {
      console.error("Error loading order:", err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }

  async function loadTechnicians() {
    try {
      const data = await httpGet("/technicians");
      const techs = data?.data || data?.technicians || data || [];
      setTechnicians(Array.isArray(techs) ? techs : []);
    } catch (err) {
      console.error("Error loading technicians:", err);
      setTechnicians([]);
    }
  }

  const statusConfig = {
    DRAFT: { color: "#94a3b8", label: "Borrador", icon: "file" },
    OPEN: { color: "#3b82f6", label: "Abierta", icon: "unlock" },
    IN_PROGRESS: { color: "#f59e0b", label: "En progreso", icon: "play" },
    COMPLETED: { color: "#10b981", label: "Completada", icon: "check" },
    CANCELLED: { color: "#ef4444", label: "Cancelada", icon: "x" },
  };

  // Pantalla de carga
  if (loading) {
    return (
      <MainLayout>
        <div style={{ padding: 40, textAlign: "center", minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div>
            <Icon name="loader" size="lg" style={{ marginBottom: 16, display: "block" }} />
            <p style={{ color: "#64748b", fontSize: 16, fontWeight: 600 }}>Cargando orden…</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Pantalla de orden no encontrada
  if (notFound || !order) {
    return (
      <MainLayout>
        <div style={{
          padding: "40px 24px",
          minHeight: "80vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f172a"
        }}>
          <div style={{
            maxWidth: 500,
            textAlign: "center",
            padding: 40,
            borderRadius: 20,
            background: "linear-gradient(135deg, #1e293b 0%, #1a1f26 100%)",
            border: "2px dashed #334155"
          }}>
            <div style={{
              fontSize: 64,
              marginBottom: 20,
              color: "#ef4444"
            }}>
              <Icon name="alertCircle" size="xl" />
            </div>
            <h1 style={{
              fontSize: 28,
              fontWeight: 900,
              color: "#f1f5f9",
              marginBottom: 8
            }}>
              Orden no encontrada
            </h1>
            <p style={{
              fontSize: 14,
              color: "#94a3b8",
              marginBottom: 32
            }}>
              La orden que buscas no existe o fue eliminada. Verifica el ID e intenta nuevamente.
            </p>
            <button
              onClick={() => navigate("/preventive-orders")}
              style={{
                padding: "12px 24px",
                borderRadius: 12,
                border: "none",
                background: "linear-gradient(135deg, #f97316, #ea580c)",
                color: "white",
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
                transition: "all 0.2s",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(249, 115, 22, 0.4)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <Icon name="arrowLeft" size="sm" />
              Volver a órdenes
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const completedCount = order.items?.filter((i) => i.status === "COMPLETED").length || 0;
  const totalItems = order.items?.length || 0;
  const progress = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;
  const config = statusConfig[order.status];

  return (
    <MainLayout>
      <div style={{ padding: "24px", minHeight: "100vh", background: "#0f172a" }}>
        {/* Botón para regresar */}
        <button
          onClick={() => navigate("/preventive-orders")}
          style={{
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
            marginBottom: 24,
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
          Volver
        </button>

        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          {/* Header */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 32,
            paddingBottom: 20,
            borderBottom: "2px solid #334155"
          }}>
            <div>
              <h1 style={{
                fontSize: 32,
                fontWeight: 900,
                color: "#f1f5f9",
                margin: "0 0 8px 0"
              }}>
                Orden #{order.id}
              </h1>
              <p style={{ margin: 0, color: "#94a3b8", fontSize: 14 }}>
                {order.title}
              </p>
            </div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                padding: "8px 16px",
                borderRadius: 10,
                background: `${config.color}20`,
                color: config.color,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Icon name={config.icon} size="sm" />
              {config.label}
            </div>
          </div>

          {error && (
            <div style={{
              padding: 16,
              borderRadius: 12,
              background: "#fee2e2",
              color: "#dc2626",
              marginBottom: 20,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 8
            }}>
              <Icon name="alertCircle" size="sm" />
              {error}
            </div>
          )}

          {/* Grid de información */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16,
            marginBottom: 32,
          }}>
            {[
              {
                icon: "settings",
                label: "Equipo",
                value: order.equipment?.name,
                detail: order.equipment?.code
              },
              {
                icon: "calendar",
                label: "Fecha Programada",
                value: new Date(order.scheduledDate).toLocaleDateString('es-MX'),
              },
              {
                icon: "users",
                label: "Asignado a",
                value: order.assignedToUser?.name || "Sin asignar",
              },
              {
                icon: "user",
                label: "Creado por",
                value: order.createdByUser?.name,
              }
            ].map((item, idx) => (
              <div
                key={idx}
                style={{
                  padding: 16,
                  borderRadius: 12,
                  background: "linear-gradient(135deg, #1e293b 0%, #1a1f26 100%)",
                  border: "1px solid #334155",
                }}
              >
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 8,
                  color: "#94a3b8",
                  fontSize: 12,
                  fontWeight: 600,
                }}>
                  <Icon name={item.icon} size="sm" />
                  {item.label}
                </div>
                <div style={{
                  fontSize: 16,
                  fontWeight: 900,
                  color: "#f1f5f9"
                }}>
                  {item.value}
                </div>
                {item.detail && (
                  <div style={{
                    fontSize: 12,
                    color: "#64748b",
                    marginTop: 4
                  }}>
                    {item.detail}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Progreso */}
          <div style={{
            padding: 20,
            borderRadius: 16,
            background: "linear-gradient(135deg, #1e293b 0%, #1a1f26 100%)",
            border: "1px solid #334155",
            marginBottom: 32,
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: "#94a3b8",
                fontWeight: 600,
                fontSize: 14,
              }}>
                <Icon name="check" size="sm" />
                Progreso de Ejecución
              </div>
              <div style={{
                fontSize: 18,
                fontWeight: 900,
                color: config.color,
              }}>
                {completedCount}/{totalItems} ({progress}%)
              </div>
            </div>
            <div style={{
              height: 10,
              background: "#334155",
              borderRadius: 5,
              overflow: "hidden"
            }}>
              <div
                style={{
                  height: "100%",
                  background: `linear-gradient(90deg, ${config.color}, ${config.color}dd)`,
                  width: `${progress}%`,
                  transition: "width 0.3s ease",
                  boxShadow: `0 0 12px ${config.color}66`,
                }}
              />
            </div>
          </div>

          {/* Items */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={{
              fontSize: 20,
              fontWeight: 900,
              color: "#f1f5f9",
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}>
              <Icon name="list" size="sm" />
              Items de la Orden ({totalItems})
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {order.items?.map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    border: `1px solid ${item.status === "COMPLETED" ? "#10b981" : "#334155"}`,
                    borderLeft: `4px solid ${item.status === "COMPLETED" ? "#10b981" : "#f59e0b"}`,
                    background: item.status === "COMPLETED" ? "#10b98115" : "transparent",
                  }}
                >
                  <div style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12
                  }}>
                    <div style={{
                      marginTop: 2,
                      color: item.status === "COMPLETED" ? "#10b981" : "#f59e0b",
                    }}>
                      <Icon
                        name={item.status === "COMPLETED" ? "check" : "circle"}
                        size="sm"
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontWeight: 700,
                        color: item.status === "COMPLETED" ? "#10b981" : "#f1f5f9",
                        fontSize: 14,
                      }}>
                        {item.route?.name}
                      </div>
                      {item.observations && (
                        <div style={{
                          fontSize: 12,
                          color: "#94a3b8",
                          marginTop: 6
                        }}>
                          {item.observations}
                        </div>
                      )}
                      {item.completedByUser && (
                        <div style={{
                          fontSize: 11,
                          color: "#64748b",
                          marginTop: 4
                        }}>
                          Completado por: {item.completedByUser.name}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notas */}
          {order.notes && (
            <div style={{
              padding: 16,
              borderRadius: 12,
              background: "#1e293b",
              border: "1px solid #f97316",
              borderLeft: "4px solid #f97316",
              marginBottom: 32,
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
                fontWeight: 700,
                color: "#94a3b8",
                marginBottom: 8,
              }}>
                <Icon name="note" size="sm" />
                Notas
              </div>
              <div style={{
                fontSize: 14,
                color: "#cbd5e1",
                whiteSpace: "pre-wrap"
              }}>
                {order.notes}
              </div>
            </div>
          )}

          {/* Acciones */}
          <div style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            paddingTop: 20,
            borderTop: "2px solid #334155"
          }}>
            <button
              onClick={() => navigate("/preventive-orders")}
              style={{
                padding: "10px 20px",
                borderRadius: 10,
                border: "1px solid #475569",
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
                e.currentTarget.style.borderColor = "#f97316";
                e.currentTarget.style.color = "#f97316";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#475569";
                e.currentTarget.style.color = "#cbd5e1";
              }}
            >
              <Icon name="arrowLeft" size="sm" />
              Atrás
            </button>

            {order.status === "DRAFT" && (
              <>
                <button
                  onClick={() => navigate(`/preventive-orders/${id}/edit`)}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 10,
                    border: "1px solid #f97316",
                    background: "transparent",
                    color: "#f97316",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#f97316" + "15";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <Icon name="edit" size="sm" />
                  Editar
                </button>
              </>
            )}

            {order.status === "IN_PROGRESS" && (
              <button
                onClick={() => navigate(`/preventive-orders/${id}/execute`)}
                style={{
                  padding: "10px 20px",
                  borderRadius: 10,
                  border: "none",
                  background: "linear-gradient(135deg, #f97316, #ea580c)",
                  color: "white",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(249, 115, 22, 0.4)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <Icon name="play" size="sm" />
                Continuar Ejecución
              </button>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
