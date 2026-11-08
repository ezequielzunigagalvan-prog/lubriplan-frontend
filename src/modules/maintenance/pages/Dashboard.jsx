import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { maintenanceApi } from "../services/maintenanceApi";
import { STATE_LABELS, PRIORITY_LABELS, PRIORITY_COLORS } from "../constants/maintenance";
import { useTheme } from "../../../context/ThemeContext";
import { Icon } from "../../../components/ui/lpIcons";

export default function Dashboard() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await maintenanceApi.getDashboardSummary();
        setSummary(response?.data || null);
      } catch (err) {
        setError(err?.message || "Error cargando dashboard");
        setSummary(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  if (loading) {
    return (
      <div style={emptyContainer}>
        <div style={spinner} />
        <div style={loadingText}>Cargando dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={emptyContainer}>
        <div style={{ ...errorBox, background: isDark ? "rgba(127,29,29,0.15)" : "#fee2e2" }}>
          <Icon name="warn" size="lg" />
          <div style={{ ...errorText, color: isDark ? "#fca5a5" : "#991b1b" }}>
            {error}
          </div>
        </div>
      </div>
    );
  }

  const opened = summary?.openedCount || 0;
  const overdue = summary?.overdueCount || 0;
  const waiting = summary?.waitingCount || 0;
  const closed30 = summary?.closed30DaysCount || 0;
  const topAssets = summary?.topAssets || [];

  return (
    <div style={container}>
      <div style={cardsGrid}>
        <SummaryCard
          title="Órdenes Abiertas"
          value={opened}
          icon="clipboard"
          color="#38bdf8"
          isDark={isDark}
        />
        <SummaryCard
          title="Vencidas"
          value={overdue}
          icon="alertCircle"
          color="#ef4444"
          isDark={isDark}
        />
        <SummaryCard
          title="En Espera"
          value={waiting}
          icon="clock"
          color="#f59e0b"
          isDark={isDark}
        />
        <SummaryCard
          title="Cerradas (30 días)"
          value={closed30}
          icon="checkCircle"
          color="#10b981"
          isDark={isDark}
        />
      </div>

      <div style={section}>
        <div style={sectionTitle}>Activos con Más Correctivos</div>
        {topAssets.length === 0 ? (
          <div style={{ ...emptyState, background: isDark ? "rgba(255,255,255,0.03)" : "rgba(248,250,252,0.8)" }}>
            <Icon name="package" size="lg" />
            <div>Sin activos con correctivos</div>
          </div>
        ) : (
          <div style={assetsList}>
            {topAssets.slice(0, 5).map((asset, idx) => (
              <div key={asset.id} style={{ ...assetItem, background: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.8)" }}>
                <div style={assetRank}>{idx + 1}</div>
                <div style={assetInfo}>
                  <div style={{ ...assetName, color: isDark ? "#f1f5f9" : "#0f172a" }}>
                    {asset.name}
                  </div>
                  <div style={assetDesc}>{asset.workOrderCount} órdenes correctivas</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={reportFailureSection}>
        <button
          type="button"
          onClick={() => navigate("/maintenance/app/report-failure")}
          style={{
            ...reportFailureButton,
            background: isDark ? "#1f2937" : "linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)",
            color: isDark ? "#38bdf8" : "#fff",
            border: isDark ? "1px solid rgba(56,189,248,0.3)" : "none",
          }}
          title="Reportar nueva falla"
        >
          <Icon name="plus" size="md" />
          <span>Reportar Falla</span>
        </button>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, icon, color, isDark }) {
  return (
    <div
      style={{
        ...card,
        background: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.8)",
        border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(226,232,240,0.95)",
      }}
    >
      <div style={cardHeader}>
        <div style={{ ...cardIcon, background: `${color}20`, color }}>{icon === "clipboard" ? <Icon name="clipboard" size="lg" /> : icon === "alertCircle" ? <Icon name="alertCircle" size="lg" /> : icon === "clock" ? <Icon name="clock" size="lg" /> : <Icon name="checkCircle" size="lg" />}</div>
        <div style={{ ...cardTitle, color: isDark ? "#94a3b8" : "#64748b" }}>{title}</div>
      </div>
      <div style={{ ...cardValue, color: isDark ? "#f1f5f9" : "#0f172a" }}>{value}</div>
    </div>
  );
}

const container = {
  display: "flex",
  flexDirection: "column",
  gap: 20,
};

const cardsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: 12,
};

const card = {
  padding: 16,
  borderRadius: 14,
  border: "1px solid rgba(226,232,240,0.95)",
  boxShadow: "0 8px 18px rgba(2,6,23,0.03)",
};

const cardHeader = {
  display: "flex",
  alignItems: "flex-start",
  gap: 12,
  marginBottom: 12,
};

const cardIcon = {
  width: 40,
  height: 40,
  borderRadius: 10,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const cardTitle = {
  fontSize: 12,
  fontWeight: 850,
  letterSpacing: ".04em",
  textTransform: "uppercase",
};

const cardValue = {
  fontSize: 32,
  fontWeight: 950,
  lineHeight: 1,
};

const section = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const sectionTitle = {
  fontSize: 15,
  fontWeight: 950,
  color: "#0f172a",
};

const assetsList = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const assetItem = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: 12,
  borderRadius: 12,
  border: "1px solid rgba(226,232,240,0.95)",
  cursor: "pointer",
  transition: "all 140ms ease",
};

const assetRank = {
  width: 36,
  height: 36,
  borderRadius: 999,
  background: "#38bdf8",
  color: "#fff",
  fontWeight: 950,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 14,
  flexShrink: 0,
};

const assetInfo = {
  flex: 1,
  minWidth: 0,
};

const assetName = {
  fontWeight: 850,
  fontSize: 14,
  marginBottom: 2,
};

const assetDesc = {
  fontSize: 12,
  fontWeight: 800,
  color: "#94a3b8",
};

const emptyState = {
  padding: 24,
  borderRadius: 14,
  border: "1px solid rgba(226,232,240,0.95)",
  textAlign: "center",
  color: "#94a3b8",
  fontWeight: 850,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 8,
};

const reportFailureSection = {
  display: "flex",
  justifyContent: "center",
  marginTop: 12,
};

const reportFailureButton = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "12px 24px",
  borderRadius: 12,
  border: "none",
  cursor: "pointer",
  fontWeight: 950,
  fontSize: 14,
  boxShadow: "0 12px 24px rgba(56,189,248,0.2)",
  transition: "all 140ms ease",
  minHeight: 48,
};

const emptyContainer = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "60vh",
  gap: 12,
};

const spinner = {
  width: 40,
  height: 40,
  border: "3px solid rgba(226,232,240,0.3)",
  borderTopColor: "#38bdf8",
  borderRadius: "50%",
  animation: "spin 0.8s linear infinite",
};

const loadingText = {
  fontSize: 14,
  fontWeight: 850,
  color: "#94a3b8",
};

const errorBox = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 8,
  padding: 16,
  borderRadius: 12,
  border: "1px solid #fecaca",
};

const errorText = {
  fontSize: 13,
  fontWeight: 850,
};
