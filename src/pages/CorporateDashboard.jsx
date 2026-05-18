// src/pages/CorporateDashboard.jsx
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { usePlant } from "../context/PlantContext";
import { useAuth } from "../context/AuthContext";
import { getCorporateDashboard } from "../services/analyticsService";
import { Icon } from "../components/ui/lpIcons";

const toNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

function OleBadge({ value }) {
  const pct = toNum(value);
  const color = pct >= 85 ? "#166534" : pct >= 75 ? "#92400e" : "#991b1b";
  const bg = pct >= 85 ? "#dcfce7" : pct >= 75 ? "#fef3c7" : "#fee2e2";
  return (
    <span style={{ display: "inline-block", padding: "4px 10px", borderRadius: 999, fontSize: 13, fontWeight: 980, background: bg, color }}>
      {pct.toFixed(1)}%
    </span>
  );
}

function KpiCard({ icon, label, value, subtitle, accent = "#0f172a" }) {
  return (
    <div style={{
      position: "relative",
      borderRadius: 16,
      padding: "16px 18px",
      background: "linear-gradient(180deg, rgba(255,255,255,0.99) 0%, rgba(248,250,252,0.95) 100%)",
      borderTop: `4px solid ${accent}`,
      borderRight: "1px solid rgba(226,232,240,0.9)",
      borderBottom: "1px solid rgba(226,232,240,0.9)",
      borderLeft: "1px solid rgba(226,232,240,0.9)",
      boxShadow: "0 10px 26px rgba(2,6,23,0.07)",
      display: "flex",
      flexDirection: "column",
      gap: 6,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{
          width: 38, height: 38,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          borderRadius: 12,
          background: `${accent}14`,
          color: accent,
          border: `1px solid ${accent}28`,
          flexShrink: 0,
        }}>
          <Icon name={icon} />
        </span>
        <span style={{ fontSize: 12, fontWeight: 950, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</span>
      </div>
      <div style={{ fontSize: 32, fontWeight: 980, color: "#0f172a", lineHeight: 1.1 }}>{value}</div>
      {subtitle ? <div style={{ fontSize: 12, color: "#64748b", fontWeight: 850 }}>{subtitle}</div> : null}
    </div>
  );
}

export default function CorporateDashboard() {
  const navigate = useNavigate();
  const { plants, currentPlantId, setPlant } = usePlant();
  const { user } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [days, setDays] = useState(90);
  const reqRef = useRef(0);

  const plantCount = Array.isArray(plants) ? plants.length : 0;
  const canAccess = plantCount >= 2;

  const load = useCallback(async () => {
    if (!canAccess) return;
    const myReq = ++reqRef.current;
    setLoading(true);
    setErr("");
    try {
      const json = await getCorporateDashboard({ days });
      if (myReq !== reqRef.current) return;
      setData(json);
    } catch (e) {
      if (myReq !== reqRef.current) return;
      setErr(e?.message || "Error cargando dashboard corporativo.");
      setData(null);
    } finally {
      if (myReq !== reqRef.current) return;
      setLoading(false);
    }
  }, [canAccess, days]);

  useEffect(() => {
    load();
  }, [load]);

  async function goToPlant(plantId) {
    if (!plantId) return;
    await setPlant(plantId);
    navigate("/dashboard");
  }

  if (!canAccess) {
    return (
      <MainLayout>
        <div style={pageWrap}>
          <div style={header}>
            <div>
              <div style={eyebrow}>
                <span style={{ width: 18, height: 2, background: "#f97316", borderRadius: 999, flexShrink: 0 }} />
                DASHBOARD · CORPORATIVO
              </div>
              <h1 style={titleStyle}>Dashboard Corporativo</h1>
            </div>
          </div>
          <div style={infoBox}>
            <Icon name="building" />
            <div>
              <div style={{ fontWeight: 950, marginBottom: 4 }}>Acceso no disponible</div>
              <div style={{ fontWeight: 800, color: "#64748b" }}>
                El dashboard corporativo requiere acceso a 2 o más plantas.
                Actualmente tienes acceso a <b>{plantCount}</b> planta{plantCount !== 1 ? "s" : ""}.
                Contacta a tu administrador para ampliar el acceso.
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  const summary = data?.summary || {};
  const byPlant = Array.isArray(data?.byPlant) ? data.byPlant : [];

  const avgOle = toNum(summary.avgOle);
  const totalExecs = toNum(summary.totalExecutions);
  const totalAlerts = toNum(summary.totalActiveAlerts);
  const bestPlant = summary.bestPlant?.name || "—";

  return (
    <MainLayout>
      <div style={pageWrap}>
        {/* Header */}
        <div style={header}>
          <div>
            <div style={eyebrow}>
              <span style={{ width: 18, height: 2, background: "#f97316", borderRadius: 999, flexShrink: 0 }} />
              DASHBOARD · CORPORATIVO
            </div>
            <h1 style={titleStyle}>Dashboard Corporativo</h1>
            <div style={subtitleStyle}>
              Vista consolidada de <b>{plantCount}</b> plantas · Periodo: {days} días
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, fontWeight: 950, color: "#64748b" }}>Rango</span>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              style={selectStyle}
            >
              <option value={30}>30 días</option>
              <option value={60}>60 días</option>
              <option value={90}>90 días</option>
              <option value={180}>180 días</option>
            </select>
            <button onClick={load} disabled={loading} style={btnGhostLocal} type="button">
              <span style={btnInline}>
                <Icon name="refresh" />
                {loading ? "Cargando..." : "Actualizar"}
              </span>
            </button>
          </div>
        </div>

        {err ? (
          <div style={errorBox}>
            <Icon name="warn" />
            {err}
          </div>
        ) : null}

        {loading && !data ? (
          <div style={{ padding: "20px 16px", borderRadius: 14, border: "1px solid rgba(226,232,240,0.9)", background: "rgba(255,255,255,0.9)", fontWeight: 900, color: "#475569" }}>
            Cargando datos corporativos...
          </div>
        ) : null}

        {!loading && data && (
          <>
            {/* KPI cards */}
            <div style={kpiGrid}>
              <KpiCard
                icon="building"
                label="Plantas activas"
                value={plantCount}
                subtitle="Con acceso en tu cuenta"
                accent="#0f172a"
              />
              <KpiCard
                icon="trendUp"
                label="OLE promedio"
                value={`${avgOle.toFixed(1)}%`}
                subtitle={avgOle >= 85 ? "En objetivo corporativo" : avgOle >= 75 ? "Aceptable — mejorar" : "Bajo objetivo"}
                accent={avgOle >= 85 ? "#16a34a" : avgOle >= 75 ? "#d97706" : "#dc2626"}
              />
              <KpiCard
                icon="check"
                label="Ejecuciones totales"
                value={totalExecs.toLocaleString("es-MX")}
                subtitle={`En los últimos ${days} días`}
                accent="#2563eb"
              />
              <KpiCard
                icon="warn"
                label="Alertas activas"
                value={totalAlerts}
                subtitle="Suma consolidada de todas las plantas"
                accent={totalAlerts > 0 ? "#d97706" : "#16a34a"}
              />
            </div>

            {/* Tabla comparativa por planta */}
            <div style={tableCard}>
              <div style={tableCardHeader}>
                <div>
                  <div style={{ fontWeight: 950, fontSize: 15, color: "#0f172a" }}>Comparativo por planta</div>
                  <div style={{ fontSize: 12, color: "#64748b", fontWeight: 800, marginTop: 2 }}>
                    Ordenado por OLE descendente · Clic en una fila para ir a esa planta
                  </div>
                </div>
                {summary.bestPlant ? (
                  <span style={{ fontSize: 12, fontWeight: 900, color: "#16a34a", display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <Icon name="check" />
                    Mejor: {bestPlant}
                  </span>
                ) : null}
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "rgba(248,250,252,0.95)" }}>
                      {["Planta", "OLE", "Disponibilidad", "Cumplimiento", "Efectividad", "Ejecuciones", "Alertas", "Stock critico", ""].map((h) => (
                        <th key={h} style={th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {byPlant.map((row) => {
                      const isCurrent = String(row.plantId) === String(currentPlantId);
                      return (
                        <tr
                          key={row.plantId}
                          onClick={() => goToPlant(row.plantId)}
                          style={{
                            borderTop: "1px solid rgba(226,232,240,0.75)",
                            cursor: "pointer",
                            background: isCurrent ? "rgba(249,115,22,0.04)" : "transparent",
                            transition: "background 120ms",
                          }}
                          onMouseEnter={(e) => { if (!isCurrent) e.currentTarget.style.background = "rgba(248,250,252,0.95)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = isCurrent ? "rgba(249,115,22,0.04)" : "transparent"; }}
                        >
                          <td style={td}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontWeight: 980, color: "#0f172a" }}>{row.plantName || `Planta ${row.plantId}`}</span>
                              {isCurrent ? (
                                <span style={{ fontSize: 10, fontWeight: 950, color: "#f97316", background: "rgba(249,115,22,0.1)", padding: "2px 7px", borderRadius: 999 }}>
                                  Actual
                                </span>
                              ) : null}
                            </div>
                          </td>
                          <td style={td}><OleBadge value={row.ole} /></td>
                          <td style={td}>{toNum(row.availability).toFixed(1)}%</td>
                          <td style={td}>{toNum(row.compliance).toFixed(1)}%</td>
                          <td style={td}>{toNum(row.effectiveness).toFixed(1)}%</td>
                          <td style={td}>{toNum(row.executions).toLocaleString("es-MX")}</td>
                          <td style={td}>
                            {toNum(row.activeAlerts) > 0 ? (
                              <span style={{ fontWeight: 950, color: "#d97706" }}>{toNum(row.activeAlerts)}</span>
                            ) : (
                              <span style={{ color: "#94a3b8" }}>0</span>
                            )}
                          </td>
                          <td style={td}>
                            {toNum(row.atRiskLubs) > 0 ? (
                              <span style={{ fontWeight: 950, color: "#dc2626" }}>{toNum(row.atRiskLubs)}</span>
                            ) : (
                              <span style={{ color: "#94a3b8" }}>0</span>
                            )}
                          </td>
                          <td style={{ ...td, textAlign: "right" }}>
                            <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 900 }}>
                              Ir →
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {byPlant.length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ padding: "20px 12px", textAlign: "center", color: "#94a3b8", fontWeight: 900 }}>
                          Sin datos disponibles para el periodo seleccionado.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}

/* ===================== styles ===================== */

const pageWrap = {
  paddingTop: 6,
  display: "grid",
  gap: 14,
  color: "#0f172a",
};

const header = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
  padding: "18px 20px",
  borderRadius: 20,
  borderTop: "4px solid #0f172a",
  borderRight: "1px solid rgba(226,232,240,0.9)",
  borderBottom: "1px solid rgba(226,232,240,0.9)",
  borderLeft: "4px solid rgba(249,115,22,0.55)",
  background: "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.94) 52%, rgba(255,247,237,0.55) 100%)",
  boxShadow: "0 18px 36px rgba(2,6,23,0.07)",
};

const eyebrow = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 11,
  fontWeight: 950,
  color: "#64748b",
  letterSpacing: 1.2,
};

const titleStyle = {
  margin: "6px 0 0 0",
  fontSize: 30,
  fontWeight: 950,
  color: "#0f172a",
  lineHeight: 1.05,
};

const subtitleStyle = {
  marginTop: 8,
  color: "#64748b",
  fontWeight: 800,
  lineHeight: 1.45,
  fontSize: 14,
};

const kpiGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 12,
};

const tableCard = {
  borderRadius: 18,
  borderTop: "4px solid #0f172a",
  borderRight: "1px solid rgba(226,232,240,0.9)",
  borderBottom: "1px solid rgba(226,232,240,0.9)",
  borderLeft: "1px solid rgba(226,232,240,0.9)",
  background: "rgba(255,255,255,0.99)",
  boxShadow: "0 10px 26px rgba(2,6,23,0.06)",
  overflow: "hidden",
};

const tableCardHeader = {
  padding: "14px 16px",
  borderBottom: "1px solid rgba(226,232,240,0.9)",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 10,
};

const th = {
  textAlign: "left",
  fontSize: 11,
  color: "#64748b",
  padding: "10px 12px",
  fontWeight: 950,
  whiteSpace: "nowrap",
};

const td = {
  padding: "12px 12px",
  fontSize: 13,
  fontWeight: 850,
  color: "#0f172a",
};

const errorBox = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "12px 16px",
  borderRadius: 14,
  borderLeft: "4px solid #dc2626",
  border: "1px solid rgba(254,202,202,0.9)",
  background: "rgba(254,226,226,0.95)",
  color: "#991b1b",
  fontWeight: 900,
  fontSize: 13,
};

const infoBox = {
  display: "flex",
  alignItems: "flex-start",
  gap: 14,
  padding: "18px 20px",
  borderRadius: 16,
  border: "1px solid rgba(253,230,138,0.9)",
  borderLeft: "4px solid #d97706",
  background: "rgba(254,243,199,0.95)",
  color: "#92400e",
  fontWeight: 900,
  fontSize: 14,
};

const selectStyle = {
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 12,
  padding: "9px 12px",
  fontWeight: 950,
  background: "rgba(255,255,255,0.92)",
  cursor: "pointer",
  outline: "none",
};

const btnGhostLocal = {
  border: "1px solid rgba(203,213,225,0.95)",
  background: "rgba(255,255,255,0.95)",
  borderRadius: 12,
  padding: "9px 14px",
  cursor: "pointer",
  fontWeight: 950,
  color: "#0f172a",
  boxShadow: "0 6px 14px rgba(2,6,23,0.04)",
  fontSize: 13,
};

const btnInline = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
};
