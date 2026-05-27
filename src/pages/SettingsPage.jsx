// src/pages/SettingsPage.jsx
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import { getSettings, updateSettings } from "../services/settingsService";
import { getAuditLog } from "../services/auditLogService";
import { useAuth } from "../context/AuthContext";
import { btnPrimary, btnGhost } from "../components/ui/styles";
import { usePlant } from "../context/PlantContext";
import { Icon } from "../components/ui/lpIcons";

function clampNum(v, min, max) {
  const n = Number(v);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function toInt(v, min, max) {
  return Math.trunc(clampNum(v, min, max));
}

function toFloat(v, min, max, decimals = 2) {
  const n = clampNum(v, min, max);
  const f = Number(n.toFixed(decimals));
  return Number.isFinite(f) ? f : min;
}

function Card({ title, subtitle, icon = "settings", children, right = null, accent = "#0f172a" }) {
  const iconBg = `${accent}18`;
  const iconBorder = `${accent}28`;

  return (
    <div style={{ ...card, borderTop: `4px solid ${accent}` }}>
      <div style={cardHeader}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ ...cardIconBox, background: iconBg, color: accent, border: `1px solid ${iconBorder}` }}>
            <Icon name={icon} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={cardTitle}>{title}</div>
            {subtitle ? <div style={cardSubtitle}>{subtitle}</div> : null}
          </div>
        </div>
        {right}
      </div>
      <div style={{ marginTop: 14, display: "grid", gap: 10, paddingLeft: 2 }}>{children}</div>
    </div>
  );
}

function RowItem({ title, description, right }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      style={{
        ...rowItem,
        boxShadow: hover ? "0 4px 14px rgba(2,6,23,0.06)" : "0 2px 6px rgba(2,6,23,0.03)",
        border: hover ? "1px solid rgba(203,213,225,0.9)" : "1px solid rgba(226,232,240,0.9)",
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div style={{ minWidth: 0 }}>
        <div style={rowTitle}>{title}</div>
        {description ? <div style={rowDescription}>{description}</div> : null}
      </div>
      <div style={{ flexShrink: 0 }}>{right}</div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <div>
        <div style={fieldLabel}>{label}</div>
        {hint ? <div style={fieldHint}>{hint}</div> : null}
      </div>
      {children}
    </div>
  );
}

function Input({ value, onChange, disabled, type = "number", step, min, max, placeholder }) {
  return (
    <input
      value={value}
      onChange={onChange}
      disabled={disabled}
      type={type}
      step={step}
      min={min}
      max={max}
      placeholder={placeholder}
      style={{ ...input, ...(disabled ? inputDisabled : {}) }}
    />
  );
}

function Toggle({ checked, onChange, disabled, onLabel = "Activo", offLabel = "Inactivo" }) {
  const active = Boolean(checked);
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!active)}
      disabled={disabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 9,
        background: "none",
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        padding: 0,
        opacity: disabled ? 0.55 : 1,
      }}
      title={active ? "Activado — clic para desactivar" : "Desactivado — clic para activar"}
    >
      <span
        style={{
          position: "relative",
          display: "block",
          width: 44,
          height: 24,
          borderRadius: 999,
          background: active ? "#f97316" : "rgba(203,213,225,0.9)",
          border: active ? "1px solid rgba(249,115,22,0.45)" : "1px solid rgba(203,213,225,0.95)",
          transition: "background 160ms ease, border-color 160ms ease",
          flexShrink: 0,
          boxShadow: active ? "0 0 0 3px rgba(249,115,22,0.15)" : "none",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 3,
            left: 3,
            width: 16,
            height: 16,
            borderRadius: 999,
            background: "#fff",
            boxShadow: "0 2px 6px rgba(0,0,0,0.20)",
            transition: "transform 160ms cubic-bezier(0.22,1,0.36,1)",
            transform: active ? "translateX(20px)" : "translateX(0)",
          }}
        />
      </span>
      <span
        style={{
          fontSize: 12.5,
          fontWeight: 900,
          color: active ? "#c2410c" : "#94a3b8",
          transition: "color 160ms ease",
          minWidth: 48,
        }}
      >
        {active ? onLabel : offLabel}
      </span>
    </button>
  );
}

function MiniBadge({ children, tone = "gray" }) {
  const tones = {
    green: { bg: "#dcfce7", fg: "#166534", border: "rgba(34,197,94,0.25)" },
    amber: { bg: "#fef3c7", fg: "#92400e", border: "rgba(245,158,11,0.25)" },
    red:   { bg: "#fee2e2", fg: "#991b1b", border: "rgba(239,68,68,0.25)" },
    blue:  { bg: "#dbeafe", fg: "#1d4ed8", border: "rgba(37,99,235,0.25)" },
    gray:  { bg: "#f1f5f9", fg: "#334155", border: "rgba(148,163,184,0.25)" },
  };
  const t = tones[tone] || tones.gray;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 12px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 900,
        background: t.bg,
        color: t.fg,
        border: `1px solid ${t.border}`,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function LoadingCards() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 14 }}>
      {[1, 2].map((col) => (
        <div key={col} style={{ display: "grid", gap: 14 }}>
          {[1, 2].map((c) => (
            <div key={c} style={loadingCard}>
              <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 14 }}>
                <div className="lpShimmer" style={{ width: 42, height: 42, borderRadius: 14 }} />
                <div style={{ flex: 1, display: "grid", gap: 7 }}>
                  <div className="lpShimmer" style={{ height: 14, width: "45%", borderRadius: 6 }} />
                  <div className="lpShimmer" style={{ height: 11, width: "65%", borderRadius: 6 }} />
                </div>
              </div>
              {[1, 2].map((r) => (
                <div key={r} className="lpShimmer" style={{ height: 58, borderRadius: 14, marginBottom: 4 }} />
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const role = String(user?.role || "").toUpperCase();
  const isAdmin = useMemo(() => role === "ADMIN", [role]);
  const { currentPlantId, currentPlant } = usePlant();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeTab, setActiveTab] = useState("ajustes");

  // Historial de cambios
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditPages, setAuditPages] = useState(1);
  const [auditPage, setAuditPage] = useState(1);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditErr, setAuditErr] = useState("");
  const [auditModel, setAuditModel] = useState("");
  const [auditAction, setAuditAction] = useState("");
  const [auditDateFrom, setAuditDateFrom] = useState("");
  const [auditDateTo, setAuditDateTo] = useState("");
  const [expandedRow, setExpandedRow] = useState(null);

  const [settings, setSettings] = useState(null);
  const [original, setOriginal] = useState(null);

  // ===== UI state =====
  const [executionEvidenceRequired, setExecutionEvidenceRequired] = useState(false);
  const [preventNegativeStock, setPreventNegativeStock] = useState(true);
  const [lowStockWarningEnabled, setLowStockWarningEnabled] = useState(true);

  const [technicianOverloadEnabled, setTechnicianOverloadEnabled] = useState(true);
  const [predictiveAlertsEnabled, setPredictiveAlertsEnabled] = useState(true);
  const [aiSummaryEnabled, setAiSummaryEnabled] = useState(true);
  const [criticalActivityEmailEnabled, setCriticalActivityEmailEnabled] = useState(true);
  const [conditionReportEmailEnabled, setConditionReportEmailEnabled] = useState(true);
  const [overdueSummaryEmailEnabled, setOverdueSummaryEmailEnabled] = useState(true);
  const [monthlyReportEmailEnabled, setMonthlyReportEmailEnabled] = useState(true);
  const [monthlyTechSummaryEnabled, setMonthlyTechSummaryEnabled] = useState(false);

  // Avanzado
  const [overloadWindowDays, setOverloadWindowDays] = useState(7);
  const [overloadOverdueLookbackDays, setOverloadOverdueLookbackDays] = useState(30);
  const [overloadCapacityPerDay, setOverloadCapacityPerDay] = useState(6);
  const [overloadWarnRatio, setOverloadWarnRatio] = useState(1.1);
  const [overloadCriticalRatio, setOverloadCriticalRatio] = useState(1.4);

  const hasChanges = useMemo(() => {
    if (!original) return false;

    const current = {
      executionEvidenceRequired: Boolean(executionEvidenceRequired),
      preventNegativeStock: Boolean(preventNegativeStock),
      lowStockWarningEnabled: Boolean(lowStockWarningEnabled),
      technicianOverloadEnabled: Boolean(technicianOverloadEnabled),
      predictiveAlertsEnabled: Boolean(predictiveAlertsEnabled),
      aiSummaryEnabled: Boolean(aiSummaryEnabled),
      criticalActivityEmailEnabled: Boolean(criticalActivityEmailEnabled),
      conditionReportEmailEnabled: Boolean(conditionReportEmailEnabled),
      overdueSummaryEmailEnabled: Boolean(overdueSummaryEmailEnabled),
      monthlyReportEmailEnabled: Boolean(monthlyReportEmailEnabled),
      monthlyTechSummaryEnabled: Boolean(monthlyTechSummaryEnabled),
      overloadWindowDays: toInt(overloadWindowDays, 1, 60),
      overloadOverdueLookbackDays: toInt(overloadOverdueLookbackDays, 1, 365),
      overloadCapacityPerDay: toInt(overloadCapacityPerDay, 1, 50),
      overloadWarnRatio: toFloat(overloadWarnRatio, 1.0, 5.0, 2),
      overloadCriticalRatio: toFloat(overloadCriticalRatio, 1.0, 5.0, 2),
    };

    const base = {
      executionEvidenceRequired: Boolean(original.executionEvidenceRequired),
      preventNegativeStock: Boolean(original.preventNegativeStock ?? true),
      lowStockWarningEnabled: Boolean(original.lowStockWarningEnabled ?? true),
      technicianOverloadEnabled: Boolean(original.technicianOverloadEnabled ?? true),
      predictiveAlertsEnabled: Boolean(original.predictiveAlertsEnabled ?? true),
      aiSummaryEnabled: Boolean(original.aiSummaryEnabled ?? true),
      criticalActivityEmailEnabled: Boolean(original.criticalActivityEmailEnabled ?? true),
      conditionReportEmailEnabled: Boolean(original.conditionReportEmailEnabled ?? true),
      overdueSummaryEmailEnabled: Boolean(original.overdueSummaryEmailEnabled ?? true),
      monthlyReportEmailEnabled: Boolean(original.monthlyReportEmailEnabled ?? true),
      monthlyTechSummaryEnabled: Boolean(original.monthlyTechSummaryEnabled ?? false),
      overloadWindowDays: toInt(original.overloadWindowDays ?? 7, 1, 60),
      overloadOverdueLookbackDays: toInt(original.overloadOverdueLookbackDays ?? 30, 1, 365),
      overloadCapacityPerDay: toInt(original.overloadCapacityPerDay ?? 6, 1, 50),
      overloadWarnRatio: toFloat(original.overloadWarnRatio ?? 1.1, 1.0, 5.0, 2),
      overloadCriticalRatio: toFloat(original.overloadCriticalRatio ?? 1.4, 1.0, 5.0, 2),
    };

    return JSON.stringify(current) !== JSON.stringify(base);
  }, [
    original, executionEvidenceRequired, preventNegativeStock, lowStockWarningEnabled,
    technicianOverloadEnabled, predictiveAlertsEnabled, aiSummaryEnabled,
    criticalActivityEmailEnabled, conditionReportEmailEnabled,
    overdueSummaryEmailEnabled, monthlyReportEmailEnabled, monthlyTechSummaryEnabled,
    overloadWindowDays, overloadOverdueLookbackDays, overloadCapacityPerDay,
    overloadWarnRatio, overloadCriticalRatio,
  ]);

  function hydrate(s) {
    const ss = s || {};
    setSettings(ss);
    setOriginal(ss);

    setExecutionEvidenceRequired(Boolean(ss.executionEvidenceRequired));
    setPreventNegativeStock(Boolean(ss.preventNegativeStock ?? true));
    setLowStockWarningEnabled(Boolean(ss.lowStockWarningEnabled ?? true));

    setTechnicianOverloadEnabled(Boolean(ss.technicianOverloadEnabled ?? true));
    setPredictiveAlertsEnabled(Boolean(ss.predictiveAlertsEnabled ?? true));
    setAiSummaryEnabled(Boolean(ss.aiSummaryEnabled ?? true));
    setCriticalActivityEmailEnabled(Boolean(ss.criticalActivityEmailEnabled ?? true));
    setConditionReportEmailEnabled(Boolean(ss.conditionReportEmailEnabled ?? true));
    setOverdueSummaryEmailEnabled(Boolean(ss.overdueSummaryEmailEnabled ?? true));
    setMonthlyReportEmailEnabled(Boolean(ss.monthlyReportEmailEnabled ?? true));
    setMonthlyTechSummaryEnabled(Boolean(ss.monthlyTechSummaryEnabled ?? false));

    setOverloadWindowDays(toInt(ss.overloadWindowDays ?? 7, 1, 60));
    setOverloadOverdueLookbackDays(toInt(ss.overloadOverdueLookbackDays ?? 30, 1, 365));
    setOverloadCapacityPerDay(toInt(ss.overloadCapacityPerDay ?? 6, 1, 50));
    setOverloadWarnRatio(toFloat(ss.overloadWarnRatio ?? 1.1, 1.0, 5.0, 2));
    setOverloadCriticalRatio(toFloat(ss.overloadCriticalRatio ?? 1.4, 1.0, 5.0, 2));
  }

  async function load() {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await getSettings();
      const s = res?.settings ?? res;
      hydrate(s);
    } catch (e) {
      setError(e?.message || "No se pudo cargar ajustes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!currentPlantId) return;
    load();
  }, [currentPlantId]);

  const loadAuditLog = useCallback(
    async (page = 1) => {
      if (!currentPlantId) return;
      setAuditLoading(true);
      setAuditErr("");
      try {
        const res = await getAuditLog({
          model: auditModel || undefined,
          action: auditAction || undefined,
          dateFrom: auditDateFrom || undefined,
          dateTo: auditDateTo || undefined,
          page,
          limit: 25,
        });
        setAuditLogs(Array.isArray(res?.logs) ? res.logs : []);
        setAuditTotal(Number(res?.total) || 0);
        setAuditPages(Number(res?.pages) || 1);
        setAuditPage(page);
      } catch (e) {
        setAuditErr(e?.message || "No se pudo cargar el historial.");
        setAuditLogs([]);
      } finally {
        setAuditLoading(false);
      }
    },
    [currentPlantId, auditModel, auditAction, auditDateFrom, auditDateTo]
  );

  useEffect(() => {
    if (activeTab === "historial" && currentPlantId) {
      loadAuditLog(1);
    }
  }, [activeTab, currentPlantId]);

  function onDiscard() {
    setError("");
    setSuccess("");
    if (!original) return;
    hydrate(original);
  }

  async function onSave() {
    if (!isAdmin) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const warn = toFloat(overloadWarnRatio, 1.0, 5.0, 2);
      const crit = toFloat(overloadCriticalRatio, 1.0, 5.0, 2);
      if (warn >= crit) {
        setSaving(false);
        setError("El umbral AVISO debe ser menor que CRITICO.");
        return;
      }
      const payload = {
        executionEvidenceRequired: Boolean(executionEvidenceRequired),
        preventNegativeStock: Boolean(preventNegativeStock),
        lowStockWarningEnabled: Boolean(lowStockWarningEnabled),
        technicianOverloadEnabled: Boolean(technicianOverloadEnabled),
        predictiveAlertsEnabled: Boolean(predictiveAlertsEnabled),
        aiSummaryEnabled: Boolean(aiSummaryEnabled),
        criticalActivityEmailEnabled: Boolean(criticalActivityEmailEnabled),
        conditionReportEmailEnabled: Boolean(conditionReportEmailEnabled),
        overdueSummaryEmailEnabled: Boolean(overdueSummaryEmailEnabled),
        monthlyReportEmailEnabled: Boolean(monthlyReportEmailEnabled),
        monthlyTechSummaryEnabled: Boolean(monthlyTechSummaryEnabled),
        overloadWindowDays: toInt(overloadWindowDays, 1, 60),
        overloadOverdueLookbackDays: toInt(overloadOverdueLookbackDays, 1, 365),
        overloadCapacityPerDay: toInt(overloadCapacityPerDay, 1, 50),
        overloadWarnRatio: warn,
        overloadCriticalRatio: crit,
      };
      const res = await updateSettings(payload);
      const s = res?.settings ?? res;
      hydrate(s);
      setSuccess("Ajustes guardados correctamente.");
    } catch (e) {
      setError(e?.message || "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <MainLayout>
      <div style={pageWrap}>
        {/* ── Page header ── */}
        <div style={header}>
          <div>
            <div style={eyebrow}>
              <span style={{ width: 18, height: 2, background: "#f97316", borderRadius: 999, flexShrink: 0 }} />
              AJUSTES · CONFIGURACIÓN
            </div>
            <h1 style={titleStyle}>Ajustes</h1>
            <div style={subtitleStyle}>
              Configuración de la planta{" "}
              {currentPlant?.name ? <b>{currentPlant.name}</b> : "actual"}.
              <br />
              Mantén la operación simple, clara y controlada.
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={load} disabled={saving || loading} style={btnGhostLocal} type="button">
              <span style={btnInline}>
                <Icon name="refresh" />
                Recargar
              </span>
            </button>
          </div>
        </div>

        {/* ── Meta badges ── */}
        <div style={topInfoRow}>
          <MiniBadge tone="blue">
            <Icon name="pin" />
            Planta: {currentPlant?.name || "Actual"}
          </MiniBadge>
          <MiniBadge tone={isAdmin ? "green" : "amber"}>
            <Icon name="user" />
            {isAdmin ? "Modo edición habilitado" : "Solo lectura"}
          </MiniBadge>
          <MiniBadge tone="gray">
            <Icon name="settings" />
            Ajustes aplican por planta
          </MiniBadge>
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            { id: "ajustes", label: "Ajustes", icon: "settings" },
            { id: "historial", label: "Historial de cambios", icon: "list" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              style={{
                ...btnGhostLocal,
                ...(activeTab === t.id
                  ? { background: "#0f172a", color: "#fff", border: "1px solid #0f172a" }
                  : {}),
              }}
            >
              <span style={btnInline}>
                <Icon name={t.icon} />
                {t.label}
              </span>
            </button>
          ))}
        </div>

        {activeTab === "ajustes" && loading && <LoadingCards />}
        {activeTab === "ajustes" && !loading && (
          <>
            {error ? (
              <div style={errorBox}>
                <Icon name="warn" size="sm" />
                {error}
              </div>
            ) : null}
            {success ? (
              <div style={successBox}>
                <Icon name="check" size="sm" />
                {success}
              </div>
            ) : null}

            <div style={grid}>
              {/* ── Left column ── */}
              <div style={gridCol}>
                <Card
                  title="Ejecución"
                  subtitle="Reglas al momento de completar actividades."
                  icon="check"
                  accent="#16a34a"
                >
                  <RowItem
                    title="Evidencia obligatoria"
                    description="Solicita foto o nota al completar una actividad."
                    right={
                      <Toggle
                        checked={executionEvidenceRequired}
                        onChange={setExecutionEvidenceRequired}
                        disabled={!isAdmin || saving}
                      />
                    }
                  />
                </Card>

                <Card
                  title="Inventario"
                  subtitle="Control básico de stock para operación segura."
                  icon="drop"
                  accent="#2563eb"
                >
                  <RowItem
                    title="Evitar stock negativo"
                    description="Bloquea descuentos que dejen el inventario por debajo de 0."
                    right={
                      <Toggle
                        checked={preventNegativeStock}
                        onChange={setPreventNegativeStock}
                        disabled={!isAdmin || saving}
                      />
                    }
                  />
                  <RowItem
                    title="Alertas de bajo stock"
                    description="Activa avisos cuando un lubricante cae por debajo del mínimo."
                    right={
                      <Toggle
                        checked={lowStockWarningEnabled}
                        onChange={setLowStockWarningEnabled}
                        disabled={!isAdmin || saving}
                      />
                    }
                  />
                </Card>
              </div>

              {/* ── Right column ── */}
              <div style={gridCol}>
                <Card
                  title="Alertas e inteligencia"
                  subtitle="Activa solo lo que hoy sí aporta valor a LubriPlan."
                  icon="warn"
                  accent="#d97706"
                >
                  <RowItem
                    title="Sobrecarga de técnicos"
                    description="Muestra señales cuando la carga operativa es alta."
                    right={
                      <Toggle
                        checked={technicianOverloadEnabled}
                        onChange={setTechnicianOverloadEnabled}
                        disabled={!isAdmin || saving}
                      />
                    }
                  />
                  <RowItem
                    title="Alertas predictivas"
                    description="Activa days-to-empty, reincidencia y consumo anómalo."
                    right={
                      <Toggle
                        checked={predictiveAlertsEnabled}
                        onChange={setPredictiveAlertsEnabled}
                        disabled={!isAdmin || saving}
                      />
                    }
                  />
                  <RowItem
                    title="Resumen inteligente IA"
                    description="Permite generar resúmenes ejecutivos del dashboard y reporte mensual."
                    right={
                      <Toggle
                        checked={aiSummaryEnabled}
                        onChange={setAiSummaryEnabled}
                        disabled={!isAdmin || saving}
                      />
                    }
                  />
                </Card>

                <Card
                  title="Correos automáticos"
                  subtitle="Controla qué avisos y reportes automáticos se envían por correo."
                  icon="alert"
                  accent="#f97316"
                >
                  <RowItem
                    title="Actividad con condición crítica"
                    description="Envía correo cuando una actividad ejecutada se marca como crítica."
                    right={
                      <Toggle
                        checked={criticalActivityEmailEnabled}
                        onChange={setCriticalActivityEmailEnabled}
                        disabled={!isAdmin || saving}
                      />
                    }
                  />
                  <RowItem
                    title="Reporte de condición"
                    description="Envía correo cuando se reporta una condición relevante del equipo."
                    right={
                      <Toggle
                        checked={conditionReportEmailEnabled}
                        onChange={setConditionReportEmailEnabled}
                        disabled={!isAdmin || saving}
                      />
                    }
                  />
                  <RowItem
                    title="Pendientes vencidas"
                    description="Envía el resumen automático de actividades vencidas de la planta."
                    right={
                      <Toggle
                        checked={overdueSummaryEmailEnabled}
                        onChange={setOverdueSummaryEmailEnabled}
                        disabled={!isAdmin || saving}
                      />
                    }
                  />
                  <RowItem
                    title="Reporte mensual"
                    description="Permite el envío automático del reporte ejecutivo mensual."
                    right={
                      <Toggle
                        checked={monthlyReportEmailEnabled}
                        onChange={setMonthlyReportEmailEnabled}
                        disabled={!isAdmin || saving}
                      />
                    }
                  />
                  <RowItem
                    title="Resumen mensual a técnicos"
                    description="El último día de cada mes los técnicos reciben una notificación con su cumplimiento y un mensaje según su desempeño."
                    right={
                      <Toggle
                        checked={monthlyTechSummaryEnabled}
                        onChange={setMonthlyTechSummaryEnabled}
                        disabled={!isAdmin || saving}
                      />
                    }
                  />
                </Card>

                <Card
                  title="Configuración avanzada"
                  subtitle="Solo para ADMIN. Ajusta la lógica fina de sobrecarga."
                  icon="tool"
                  accent="#475569"
                  right={
                    <button type="button" onClick={() => setShowAdvanced((v) => !v)} style={btnCollapse}>
                      <span style={btnInline}>
                        <Icon name={showAdvanced ? "up" : "down"} />
                        {showAdvanced ? "Ocultar" : "Mostrar"}
                      </span>
                    </button>
                  }
                >
                  <div style={advancedNote}>
                    Recomendado para la mayoría de plantas: dejar esta sección con valores por
                    defecto y trabajar solo con los switches superiores.
                  </div>

                  {showAdvanced ? (
                    <div style={advancedGrid}>
                      <Field label="Ventana (días)" hint="Días hacia adelante para estimar carga futura.">
                        <Input
                          value={overloadWindowDays}
                          onChange={(e) => setOverloadWindowDays(toInt(e.target.value, 1, 60))}
                          disabled={!isAdmin || saving}
                          min={1} max={60} step={1}
                        />
                      </Field>
                      <Field label="Historial de vencidas (días)" hint="Cuántos días hacia atrás considerar actividades vencidas.">
                        <Input
                          value={overloadOverdueLookbackDays}
                          onChange={(e) => setOverloadOverdueLookbackDays(toInt(e.target.value, 1, 365))}
                          disabled={!isAdmin || saving}
                          min={1} max={365} step={1}
                        />
                      </Field>
                      <Field label="Capacidad por día" hint="Máximo recomendado de actividades por técnico por día.">
                        <Input
                          value={overloadCapacityPerDay}
                          onChange={(e) => setOverloadCapacityPerDay(toInt(e.target.value, 1, 50))}
                          disabled={!isAdmin || saving}
                          min={1} max={50} step={1}
                        />
                      </Field>
                      <Field label="Umbral AVISO" hint="Ej. 1.10">
                        <Input
                          value={overloadWarnRatio}
                          onChange={(e) => setOverloadWarnRatio(toFloat(e.target.value, 1.0, 5.0, 2))}
                          disabled={!isAdmin || saving}
                          step={0.01} min={1.0} max={5.0}
                        />
                      </Field>
                      <Field label="Umbral CRÍTICO" hint="Ej. 1.40">
                        <Input
                          value={overloadCriticalRatio}
                          onChange={(e) => setOverloadCriticalRatio(toFloat(e.target.value, 1.0, 5.0, 2))}
                          disabled={!isAdmin || saving}
                          step={0.01} min={1.0} max={5.0}
                        />
                      </Field>
                    </div>
                  ) : null}
                </Card>
              </div>
            </div>

            {!isAdmin ? (
              <div style={readOnlyBox}>
                <Icon name="warn" size="sm" />
                Solo un usuario con rol <b>ADMIN</b> puede modificar los ajustes.
              </div>
            ) : null}

            {/* ── Sticky footer ── */}
            <div
              style={{
                ...stickyFooter,
                borderLeft: hasChanges
                  ? "4px solid rgba(249,115,22,0.75)"
                  : "4px solid rgba(226,232,240,0.95)",
                background: hasChanges
                  ? "linear-gradient(135deg, rgba(255,247,237,0.97) 0%, rgba(255,255,255,0.97) 100%)"
                  : "rgba(255,255,255,0.97)",
              }}
            >
              <div style={stickyLeft}>
                {hasChanges ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 999, background: "#f97316", flexShrink: 0 }} />
                    <b style={{ color: "#f97316" }}>Cambios pendientes</b>
                    <span style={{ color: "#64748b" }}>· Guarda para aplicar en la planta actual.</span>
                  </span>
                ) : (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#94a3b8" }}>
                    <span style={{ width: 8, height: 8, borderRadius: 999, background: "#94a3b8", flexShrink: 0 }} />
                    Sin cambios pendientes.
                  </span>
                )}
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  onClick={onDiscard}
                  disabled={!hasChanges || saving}
                  style={{ ...btnGhostLocal, opacity: !hasChanges || saving ? 0.5 : 1 }}
                  type="button"
                >
                  Descartar
                </button>
                <button
                  onClick={onSave}
                  disabled={!isAdmin || saving || !hasChanges}
                  style={{ ...btnPrimaryLocal, opacity: !isAdmin || saving || !hasChanges ? 0.5 : 1 }}
                  type="button"
                  title={!isAdmin ? "Solo ADMIN puede guardar" : "Guardar ajustes"}
                >
                  {saving ? (
                    <span style={btnInline}>
                      <Icon name="refresh" />
                      Guardando…
                    </span>
                  ) : (
                    "Guardar cambios"
                  )}
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── Historial de cambios ── */}
        {activeTab === "historial" && (
          <div style={{ display: "grid", gap: 14 }}>
            {/* Filters */}
            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                alignItems: "flex-end",
                padding: "14px 16px",
                borderRadius: 16,
                border: "1px solid rgba(226,232,240,0.9)",
                background: "rgba(248,250,252,0.95)",
                boxShadow: "0 4px 10px rgba(2,6,23,0.04)",
              }}
            >
              <div style={{ display: "grid", gap: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 950, color: "#64748b" }}>Modelo</span>
                <select
                  value={auditModel}
                  onChange={(e) => setAuditModel(e.target.value)}
                  style={auditSelect}
                >
                  <option value="">Todos</option>
                  {["User","Technician","Equipment","Route","Lubricant","Execution","PurchaseOrder","OilSample","AppSettings","WebhookEndpoint"].map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: "grid", gap: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 950, color: "#64748b" }}>Acción</span>
                <select
                  value={auditAction}
                  onChange={(e) => setAuditAction(e.target.value)}
                  style={auditSelect}
                >
                  <option value="">Todas</option>
                  <option value="CREATE">CREATE</option>
                  <option value="UPDATE">UPDATE</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>
              <div style={{ display: "grid", gap: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 950, color: "#64748b" }}>Desde</span>
                <input
                  type="date"
                  value={auditDateFrom}
                  onChange={(e) => setAuditDateFrom(e.target.value)}
                  style={auditInput}
                />
              </div>
              <div style={{ display: "grid", gap: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 950, color: "#64748b" }}>Hasta</span>
                <input
                  type="date"
                  value={auditDateTo}
                  onChange={(e) => setAuditDateTo(e.target.value)}
                  style={auditInput}
                />
              </div>
              <button
                type="button"
                onClick={() => loadAuditLog(1)}
                disabled={auditLoading}
                style={btnPrimaryLocal}
              >
                <span style={btnInline}>
                  <Icon name="refresh" />
                  {auditLoading ? "Buscando..." : "Buscar"}
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuditModel("");
                  setAuditAction("");
                  setAuditDateFrom("");
                  setAuditDateTo("");
                }}
                style={btnGhostLocal}
              >
                Limpiar
              </button>
            </div>

            {auditErr ? (
              <div style={errorBox}>
                <Icon name="warn" size="sm" />
                {auditErr}
              </div>
            ) : null}

            <div
              style={{
                borderRadius: 18,
                border: "1px solid rgba(226,232,240,0.9)",
                borderTop: "4px solid #475569",
                background: "rgba(255,255,255,0.99)",
                boxShadow: "0 10px 26px rgba(2,6,23,0.06)",
                overflow: "hidden",
              }}
            >
              <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(226,232,240,0.9)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 950, fontSize: 15, color: "#0f172a" }}>Historial de cambios</div>
                  <div style={{ fontSize: 12, color: "#64748b", fontWeight: 800, marginTop: 2 }}>
                    {auditTotal} {auditTotal === 1 ? "registro" : "registros"} · Página {auditPage} de {auditPages}
                  </div>
                </div>
                {auditLoading ? (
                  <span style={{ fontSize: 12, color: "#64748b", fontWeight: 900 }}>Cargando...</span>
                ) : null}
              </div>

              {auditLogs.length === 0 && !auditLoading ? (
                <div style={{ padding: "24px 16px", textAlign: "center", color: "#94a3b8", fontWeight: 900 }}>
                  Sin registros con los filtros actuales.
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "rgba(248,250,252,0.95)" }}>
                        {["Fecha", "Usuario", "Modelo", "Acción", "Registro", "Cambios"].map((h) => (
                          <th key={h} style={auditTh}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map((log) => {
                        const changes = log.changes;
                        const hasChanges = changes && Object.keys(changes).length > 0;
                        const isExpanded = expandedRow === log.id;
                        const actionTone = log.action === "CREATE" ? "green" : log.action === "DELETE" ? "red" : "blue";
                        const actionColors = {
                          green: { bg: "#dcfce7", fg: "#166534" },
                          red:   { bg: "#fee2e2", fg: "#991b1b" },
                          blue:  { bg: "#dbeafe", fg: "#1d4ed8" },
                        };
                        const ac = actionColors[actionTone];

                        return (
                          <Fragment key={log.id}>
                            <tr style={{ borderTop: "1px solid rgba(226,232,240,0.75)" }}>
                              <td style={auditTd}>
                                {log.createdAt
                                  ? new Date(log.createdAt).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })
                                  : "?"}
                              </td>
                              <td style={auditTd}>
                                <div style={{ fontWeight: 950, color: "#0f172a", fontSize: 13 }}>
                                  {log.user?.name || log.userEmail || "—"}
                                </div>
                                {log.user?.name && log.userEmail ? (
                                  <div style={{ fontSize: 11, color: "#94a3b8" }}>{log.userEmail}</div>
                                ) : null}
                              </td>
                              <td style={auditTd}>
                                <span style={{ fontWeight: 950, color: "#334155" }}>{log.model || "—"}</span>
                              </td>
                              <td style={auditTd}>
                                <span style={{
                                  display: "inline-block",
                                  padding: "3px 10px",
                                  borderRadius: 999,
                                  fontSize: 11,
                                  fontWeight: 950,
                                  background: ac.bg,
                                  color: ac.fg,
                                }}>
                                  {log.action || "—"}
                                </span>
                              </td>
                              <td style={auditTd}>
                                <span style={{ fontFamily: "monospace", fontSize: 12, color: "#475569" }}>
                                  {log.recordId || "—"}
                                </span>
                              </td>
                              <td style={auditTd}>
                                {hasChanges ? (
                                  <button
                                    type="button"
                                    onClick={() => setExpandedRow(isExpanded ? null : log.id)}
                                    style={{ ...btnGhostLocal, padding: "5px 10px", fontSize: 12 }}
                                  >
                                    {isExpanded ? "Ocultar" : "Ver"}
                                  </button>
                                ) : (
                                  <span style={{ color: "#cbd5e1", fontSize: 12 }}>—</span>
                                )}
                              </td>
                            </tr>
                            {isExpanded && hasChanges ? (
                              <tr style={{ background: "rgba(248,250,252,0.95)" }}>
                                <td colSpan={6} style={{ padding: "12px 16px" }}>
                                  <div style={{
                                    fontFamily: "monospace",
                                    fontSize: 12,
                                    color: "#334155",
                                    background: "#f8fafc",
                                    borderRadius: 10,
                                    padding: "10px 14px",
                                    whiteSpace: "pre-wrap",
                                    wordBreak: "break-all",
                                    maxHeight: 260,
                                    overflowY: "auto",
                                    boxShadow: "inset 0 0 0 1px rgba(226,232,240,0.9)",
                                  }}>
                                    {JSON.stringify(changes, null, 2)}
                                  </div>
                                </td>
                              </tr>
                            ) : null}
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {auditPages > 1 ? (
                <div style={{ display: "flex", justifyContent: "center", gap: 8, padding: "12px 16px", borderTop: "1px solid rgba(226,232,240,0.9)" }}>
                  <button
                    type="button"
                    disabled={auditPage <= 1 || auditLoading}
                    onClick={() => loadAuditLog(auditPage - 1)}
                    style={{ ...btnGhostLocal, opacity: auditPage <= 1 ? 0.4 : 1 }}
                  >
                    ← Anterior
                  </button>
                  <span style={{ display: "flex", alignItems: "center", fontSize: 13, fontWeight: 900, color: "#475569" }}>
                    {auditPage} / {auditPages}
                  </span>
                  <button
                    type="button"
                    disabled={auditPage >= auditPages || auditLoading}
                    onClick={() => loadAuditLog(auditPage + 1)}
                    style={{ ...btnGhostLocal, opacity: auditPage >= auditPages ? 0.4 : 1 }}
                  >
                    Siguiente →
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

/* =========================
   STYLES
========================= */

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

const topInfoRow = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  marginBottom: 4,
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
  gap: 14,
};

const gridCol = {
  display: "grid",
  gap: 14,
  alignItems: "start",
};

const card = {
  borderRadius: 18,
  padding: 18,
  background: "linear-gradient(180deg, rgba(255,255,255,0.99) 0%, rgba(248,250,252,0.95) 100%)",
  borderRight: "1px solid rgba(226,232,240,0.9)",
  borderBottom: "1px solid rgba(226,232,240,0.9)",
  borderLeft: "1px solid rgba(226,232,240,0.9)",
  boxShadow: "0 10px 26px rgba(2,6,23,0.06)",
};

const cardHeader = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
  alignItems: "flex-start",
};

const cardIconBox = {
  width: 42,
  height: 42,
  borderRadius: 14,
  display: "grid",
  placeItems: "center",
  flexShrink: 0,
};

const cardTitle = {
  fontSize: 16,
  fontWeight: 950,
  color: "#0f172a",
  lineHeight: 1.2,
};

const cardSubtitle = {
  marginTop: 4,
  fontSize: 12.5,
  color: "#64748b",
  fontWeight: 800,
  lineHeight: 1.4,
};

const rowItem = {
  display: "grid",
  gridTemplateColumns: "1fr auto",
  gap: 14,
  alignItems: "center",
  padding: "13px 16px",
  borderRadius: 14,
  border: "1px solid rgba(226,232,240,0.9)",
  background: "linear-gradient(135deg, rgba(255,255,255,0.99) 0%, rgba(248,250,252,0.95) 100%)",
  transition: "box-shadow 160ms ease, border-color 160ms ease",
};

const rowTitle = {
  fontWeight: 900,
  fontSize: 14,
  color: "#0f172a",
};

const rowDescription = {
  marginTop: 4,
  fontSize: 12.5,
  color: "#64748b",
  fontWeight: 800,
  lineHeight: 1.35,
};

const fieldLabel = {
  fontSize: 13,
  fontWeight: 900,
  color: "#0f172a",
};

const fieldHint = {
  marginTop: 2,
  fontSize: 12,
  color: "#64748b",
  fontWeight: 800,
  lineHeight: 1.35,
};

const input = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(226,232,240,0.95)",
  background: "#fff",
  color: "#0f172a",
  outline: "none",
  fontWeight: 900,
  boxShadow: "0 4px 10px rgba(2,6,23,0.04)",
  fontSize: 14,
  boxSizing: "border-box",
};

const inputDisabled = {
  background: "rgba(241,245,249,0.8)",
  color: "#64748b",
};

const btnInline = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
};

const btnGhostLocal = {
  border: "1px solid rgba(203,213,225,0.95)",
  background: "rgba(255,255,255,0.95)",
  borderRadius: 12,
  padding: "10px 16px",
  cursor: "pointer",
  fontWeight: 950,
  color: "#0f172a",
  boxShadow: "0 6px 14px rgba(2,6,23,0.04)",
  fontSize: 13,
};

const btnPrimaryLocal = {
  border: "1px solid #0f172a",
  background: "#0f172a",
  borderRadius: 12,
  padding: "10px 18px",
  cursor: "pointer",
  fontWeight: 950,
  color: "#fff",
  boxShadow: "0 10px 24px rgba(2,6,23,0.14)",
  fontSize: 13,
};

const btnCollapse = {
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(248,250,252,0.9)",
  borderRadius: 10,
  padding: "7px 12px",
  cursor: "pointer",
  fontWeight: 900,
  color: "#475569",
  fontSize: 12,
};

const advancedNote = {
  fontSize: 12.5,
  fontWeight: 800,
  color: "#64748b",
  lineHeight: 1.4,
  padding: "10px 14px",
  borderRadius: 12,
  background: "rgba(241,245,249,0.85)",
  border: "1px solid rgba(226,232,240,0.9)",
  borderLeft: "3px solid #94a3b8",
};

const advancedGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: 12,
  marginTop: 2,
};

const loadingCard = {
  borderRadius: 18,
  padding: 18,
  background: "rgba(255,255,255,0.98)",
  border: "1px solid rgba(226,232,240,0.9)",
  borderTop: "4px solid rgba(226,232,240,0.85)",
  boxShadow: "0 8px 20px rgba(2,6,23,0.05)",
  display: "grid",
  gap: 10,
};

const errorBox = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "12px 16px",
  marginBottom: 4,
  borderRadius: 14,
  borderLeft: "4px solid #dc2626",
  border: "1px solid rgba(254,202,202,0.9)",
  background: "rgba(254,226,226,0.95)",
  color: "#991b1b",
  fontWeight: 900,
  fontSize: 13,
};

const successBox = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "12px 16px",
  marginBottom: 4,
  borderRadius: 14,
  borderLeft: "4px solid #16a34a",
  border: "1px solid rgba(187,247,208,0.9)",
  background: "rgba(220,252,231,0.95)",
  color: "#166534",
  fontWeight: 900,
  fontSize: 13,
};

const readOnlyBox = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  marginTop: 4,
  padding: "12px 16px",
  borderRadius: 14,
  borderLeft: "4px solid #d97706",
  border: "1px solid rgba(253,230,138,0.9)",
  background: "rgba(254,243,199,0.95)",
  color: "#92400e",
  fontWeight: 900,
  fontSize: 13,
};

const stickyFooter = {
  position: "sticky",
  bottom: 0,
  zIndex: 5,
  marginTop: 8,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
  padding: "14px 18px",
  borderRadius: 16,
  border: "1px solid rgba(226,232,240,0.95)",
  backdropFilter: "blur(10px)",
  boxShadow: "0 -2px 0 rgba(226,232,240,0.6), 0 12px 28px rgba(2,6,23,0.08)",
  transition: "background 200ms ease, border-left-color 200ms ease",
};

const stickyLeft = {
  fontSize: 13,
  color: "#64748b",
  fontWeight: 800,
};

const auditSelect = {
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 10,
  padding: "8px 12px",
  fontWeight: 900,
  background: "#fff",
  cursor: "pointer",
  outline: "none",
  fontSize: 13,
};

const auditInput = {
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 10,
  padding: "8px 12px",
  fontWeight: 900,
  background: "#fff",
  outline: "none",
  fontSize: 13,
  color: "#0f172a",
};

const auditTh = {
  textAlign: "left",
  fontSize: 11,
  color: "#64748b",
  padding: "10px 12px",
  fontWeight: 950,
  whiteSpace: "nowrap",
};

const auditTd = {
  padding: "10px 12px",
  fontSize: 13,
  fontWeight: 850,
  color: "#0f172a",
  verticalAlign: "top",
};
