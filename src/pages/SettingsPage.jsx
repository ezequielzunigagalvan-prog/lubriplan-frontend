// src/pages/SettingsPage.jsx
import { useEffect, useMemo, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import { getSettings, updateSettings } from "../services/settingsService";
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

function Card({ title, subtitle, icon = "settings", children, right = null }) {
  return (
    <div style={card}>
      <div style={cardTopBar} />
      <div style={cardHeader}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={cardIconBox}>
            <Icon name={icon} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={cardTitle}>{title}</div>
            {subtitle ? <div style={cardSubtitle}>{subtitle}</div> : null}
          </div>
        </div>
        {right}
      </div>

      <div style={{ marginTop: 14, display: "grid", gap: 12 }}>{children}</div>
    </div>
  );
}

function RowItem({ title, description, right }) {
  return (
    <div style={rowItem}>
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

function Input({
  value,
  onChange,
  disabled,
  type = "number",
  step,
  min,
  max,
  placeholder,
}) {
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
      style={{
        ...input,
        ...(disabled ? inputDisabled : {}),
      }}
    />
  );
}

function Toggle({
  checked,
  onChange,
  disabled,
  onLabel = "Activo",
  offLabel = "Inactivo",
}) {
  const active = Boolean(checked);

  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!active)}
      disabled={disabled}
      style={{
        ...toggleWrap,
        ...(active ? toggleWrapOn : toggleWrapOff),
        ...(disabled ? toggleWrapDisabled : {}),
      }}
      title={active ? "Activado" : "Desactivado"}
    >
      <span
        style={{
          ...toggleDot,
          transform: active ? "translateX(25px)" : "translateX(0px)",
        }}
      />
      <span style={toggleText}>{active ? onLabel : offLabel}</span>
    </button>
  );
}

function MiniBadge({ children, tone = "gray" }) {
  const bg =
    tone === "green"
      ? "#dcfce7"
      : tone === "amber"
      ? "#fef3c7"
      : tone === "red"
      ? "#fee2e2"
      : "#f1f5f9";

  const fg =
    tone === "green"
      ? "#166534"
      : tone === "amber"
      ? "#92400e"
      : tone === "red"
      ? "#991b1b"
      : "#334155";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 900,
        background: bg,
        color: fg,
        border: "1px solid rgba(0,0,0,0.06)",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
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

  const [settings, setSettings] = useState(null);
  const [original, setOriginal] = useState(null);

  // ===== UI state =====
  const [executionEvidenceRequired, setExecutionEvidenceRequired] = useState(false);
  const [preventNegativeStock, setPreventNegativeStock] = useState(true);
  const [lowStockWarningEnabled, setLowStockWarningEnabled] = useState(true);

  // Nuevos switches simples para UX SaaS
  const [technicianOverloadEnabled, setTechnicianOverloadEnabled] = useState(true);
  const [predictiveAlertsEnabled, setPredictiveAlertsEnabled] = useState(true);
  const [aiSummaryEnabled, setAiSummaryEnabled] = useState(true);
  const [criticalActivityEmailEnabled, setCriticalActivityEmailEnabled] = useState(true);
  const [conditionReportEmailEnabled, setConditionReportEmailEnabled] = useState(true);
  const [overdueSummaryEmailEnabled, setOverdueSummaryEmailEnabled] = useState(true);
  const [monthlyReportEmailEnabled, setMonthlyReportEmailEnabled] = useState(true);

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
      overloadWindowDays: toInt(original.overloadWindowDays ?? 7, 1, 60),
      overloadOverdueLookbackDays: toInt(original.overloadOverdueLookbackDays ?? 30, 1, 365),
      overloadCapacityPerDay: toInt(original.overloadCapacityPerDay ?? 6, 1, 50),
      overloadWarnRatio: toFloat(original.overloadWarnRatio ?? 1.1, 1.0, 5.0, 2),
      overloadCriticalRatio: toFloat(original.overloadCriticalRatio ?? 1.4, 1.0, 5.0, 2),
    };

    return JSON.stringify(current) !== JSON.stringify(base);
  }, [
    original,
    executionEvidenceRequired,
    preventNegativeStock,
    lowStockWarningEnabled,
    technicianOverloadEnabled,
    predictiveAlertsEnabled,
    aiSummaryEnabled,
    criticalActivityEmailEnabled,
    conditionReportEmailEnabled,
    overdueSummaryEmailEnabled,
    monthlyReportEmailEnabled,
    overloadWindowDays,
    overloadOverdueLookbackDays,
    overloadCapacityPerDay,
    overloadWarnRatio,
    overloadCriticalRatio,
  ]);

  function hydrate(s) {
    const ss = s || {};
    setSettings(ss);
    setOriginal(ss);

    setExecutionEvidenceRequired(Boolean(ss.executionEvidenceRequired));
    setPreventNegativeStock(Boolean(ss.preventNegativeStock ?? true));
    setLowStockWarningEnabled(Boolean(ss.lowStockWarningEnabled ?? true));

    // Si aÃºn no existen en backend, por defecto quedan activados
    setTechnicianOverloadEnabled(Boolean(ss.technicianOverloadEnabled ?? true));
    setPredictiveAlertsEnabled(Boolean(ss.predictiveAlertsEnabled ?? true));
    setAiSummaryEnabled(Boolean(ss.aiSummaryEnabled ?? true));
    setCriticalActivityEmailEnabled(Boolean(ss.criticalActivityEmailEnabled ?? true));
    setConditionReportEmailEnabled(Boolean(ss.conditionReportEmailEnabled ?? true));
    setOverdueSummaryEmailEnabled(Boolean(ss.overdueSummaryEmailEnabled ?? true));
    setMonthlyReportEmailEnabled(Boolean(ss.monthlyReportEmailEnabled ?? true));

    setOverloadWindowDays(toInt(ss.overloadWindowDays ?? 7, 1, 60));
    setOverloadOverdueLookbackDays(
      toInt(ss.overloadOverdueLookbackDays ?? 30, 1, 365)
    );
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

        // Nuevos switches
        technicianOverloadEnabled: Boolean(technicianOverloadEnabled),
        predictiveAlertsEnabled: Boolean(predictiveAlertsEnabled),
        aiSummaryEnabled: Boolean(aiSummaryEnabled),
        criticalActivityEmailEnabled: Boolean(criticalActivityEmailEnabled),
        conditionReportEmailEnabled: Boolean(conditionReportEmailEnabled),
        overdueSummaryEmailEnabled: Boolean(overdueSummaryEmailEnabled),
        monthlyReportEmailEnabled: Boolean(monthlyReportEmailEnabled),

        // Avanzado
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
        <div style={header}>
          <div>
            <div style={eyebrow}>AJUSTES</div>
            <h1 style={title}>Ajustes</h1>
            <div style={subtitle}>
              Configuración de la planta{" "}
              {currentPlant?.name ? <b>{currentPlant.name}</b> : "actual"}.
              <br />
              Mantén la operación simple, clara y controlada.
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={load}
              disabled={saving || loading}
              style={btnGhostLocal}
              type="button"
            >
              <span style={btnInline}>
                <Icon name="refresh" />
                Recargar
              </span>
            </button>
          </div>
        </div>

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

        {loading ? (
          <div style={loadingBox}>Cargando ajustes</div>
        ) : (
          <>
            {error ? <div style={errorBox}>{error}</div> : null}
            {success ? <div style={successBox}>{success}</div> : null}

            <div style={grid}>
              <div style={gridCol}>
                <Card
                  title="Ejecución"
                  subtitle="Reglas al momento de completar actividades."
                  icon="check"
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
                    description="Activa avisos cuando un lubricante cae por debajo del mí­nimo."
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

              <div style={gridCol}>
                <Card
                  title="Alertas e inteligencia"
                  subtitle="Activa solo lo que hoy sí­ aporta valor a LubriPlan."
                  icon="alert"
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
                </Card>

                <Card
                  title="Configuración avanzada"
                  subtitle="Solo para ADMIN. Ajusta la lógica fina de sobrecarga."
                  icon="tool"
                  right={
                    <button
                      type="button"
                      onClick={() => setShowAdvanced((v) => !v)}
                      style={btnCollapse}
                    >
                      <span style={btnInline}>
                        <Icon name={showAdvanced ? "up" : "down"} />
                        {showAdvanced ? "Ocultar" : "Mostrar"}
                      </span>
                    </button>
                  }
                >
                  <div style={advancedNote}>
                    Recomendado para la mayorí­a de plantas: dejar esta sección con valores por
                    defecto y trabajar solo con los switches superiores.
                  </div>

                  {showAdvanced ? (
                    <div style={advancedGrid}>
                      <Field
                        label="Ventana (dí­as)"
                        hint="Dí­as hacia adelante para estimar carga futura."
                      >
                        <Input
                          value={overloadWindowDays}
                          onChange={(e) =>
                            setOverloadWindowDays(toInt(e.target.value, 1, 60))
                          }
                          disabled={!isAdmin || saving}
                          min={1}
                          max={60}
                          step={1}
                        />
                      </Field>

                      <Field
                        label="Historial de vencidas (dí­as)"
                        hint="Cuántos dí­as hacia atrás considerar actividades vencidas."
                      >
                        <Input
                          value={overloadOverdueLookbackDays}
                          onChange={(e) =>
                            setOverloadOverdueLookbackDays(
                              toInt(e.target.value, 1, 365)
                            )
                          }
                          disabled={!isAdmin || saving}
                          min={1}
                          max={365}
                          step={1}
                        />
                      </Field>

                      <Field
                        label="Capacidad por dí­a"
                        hint="Máximo recomendado de actividades por técnico por dí­a."
                      >
                        <Input
                          value={overloadCapacityPerDay}
                          onChange={(e) =>
                            setOverloadCapacityPerDay(toInt(e.target.value, 1, 50))
                          }
                          disabled={!isAdmin || saving}
                          min={1}
                          max={50}
                          step={1}
                        />
                      </Field>

                      <Field label="Umbral AVISO" hint="Ej. 1.10">
                        <Input
                          value={overloadWarnRatio}
                          onChange={(e) =>
                            setOverloadWarnRatio(toFloat(e.target.value, 1.0, 5.0, 2))
                          }
                          disabled={!isAdmin || saving}
                          step={0.01}
                          min={1.0}
                          max={5.0}
                        />
                      </Field>

                      <Field label="Umbral CRITICO" hint="Ej. 1.40">
                        <Input
                          value={overloadCriticalRatio}
                          onChange={(e) =>
                            setOverloadCriticalRatio(
                              toFloat(e.target.value, 1.0, 5.0, 2)
                            )
                          }
                          disabled={!isAdmin || saving}
                          step={0.01}
                          min={1.0}
                          max={5.0}
                        />
                      </Field>
                    </div>
                  ) : null}
                </Card>
              </div>
            </div>

            {!isAdmin ? (
              <div style={readOnlyBox}>
                Solo un usuario con rol <b>ADMIN</b> puede modificar los ajustes.
              </div>
            ) : null}

            <div style={stickyFooter}>
              <div style={stickyLeft}>
                {hasChanges ? (
                  <span>
                    <b style={{ color: "#f97316" }}>Cambios pendientes</b>· Guarda para aplicar en
                    la planta actual.
                  </span>
                ) : (
                  <span>Sin cambios pendientes.</span>
                )}
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  onClick={onDiscard}
                  disabled={!hasChanges || saving}
                  style={btnGhostLocal}
                  type="button"
                >
                  Descartar
                </button>

                <button
                  onClick={onSave}
                  disabled={!isAdmin || saving || !hasChanges}
                  style={btnPrimaryLocal}
                  type="button"
                  title={!isAdmin ? "Solo ADMIN puede guardar" : "Guardar ajustes"}
                >
                  {saving ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}

/* =========================
   STYLES
========================= */

const pageWrap = {
  padding: 18,
  color: "#0f172a",
};

const header = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 14,
};

const eyebrow = {
  fontSize: 12,
  fontWeight: 900,
  color: "#64748b",
  letterSpacing: 2,
};

const title = {
  margin: "6px 0 0 0",
  fontSize: 30,
  fontWeight: 1000,
  color: "#0f172a",
};

const subtitle = {
  marginTop: 8,
  color: "#64748b",
  fontWeight: 800,
  lineHeight: 1.45,
};

const topInfoRow = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  marginBottom: 16,
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
  position: "relative",
  borderRadius: 18,
  padding: 16,
  background: "rgba(255,255,255,0.98)",
  border: "1px solid rgba(148,163,184,0.35)",
  boxShadow: "0 12px 26px rgba(2,6,23,0.06)",
  overflow: "hidden",
};

const cardTopBar = {
  position: "absolute",
  left: 0,
  right: 0,
  top: 0,
  height: 7,
  background: "#f97316",
};

const cardHeader = {
  marginTop: 4,
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
  background: "#0f172a",
  color: "#fff",
  border: "1px solid rgba(0,0,0,0.08)",
  flexShrink: 0,
};

const cardTitle = {
  fontSize: 16,
  fontWeight: 1000,
  color: "#0f172a",
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
  gap: 12,
  alignItems: "center",
  padding: 14,
  borderRadius: 14,
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(248,250,252,0.9)",
};

const rowTitle = {
  fontWeight: 900,
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
  boxShadow: "0 6px 14px rgba(2,6,23,0.04)",
};

const inputDisabled = {
  background: "rgba(241,245,249,0.8)",
  color: "#64748b",
};

const toggleWrap = {
  position: "relative",
  width: 112,
  height: 40,
  borderRadius: 999,
  border: "1px solid rgba(0,0,0,0.08)",
  cursor: "pointer",
  transition: "all 160ms ease",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  paddingLeft: 12,
  paddingRight: 12,
};

const toggleWrapOn = {
  background: "rgba(249,115,22,0.16)",
  color: "#c2410c",
};

const toggleWrapOff = {
  background: "rgba(241,245,249,0.95)",
  color: "#64748b",
};

const toggleWrapDisabled = {
  opacity: 0.6,
  cursor: "not-allowed",
};

const toggleDot = {
  position: "absolute",
  left: 6,
  width: 26,
  height: 26,
  borderRadius: 999,
  background: "#fff",
  border: "1px solid rgba(0,0,0,0.08)",
  boxShadow: "0 4px 10px rgba(2,6,23,0.10)",
  transition: "transform 160ms ease",
};

const toggleText = {
  fontSize: 12,
  fontWeight: 1000,
  letterSpacing: 0.2,
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
  padding: "10px 14px",
  cursor: "pointer",
  fontWeight: 950,
  color: "#0f172a",
  boxShadow: "0 8px 18px rgba(2,6,23,0.04)",
};

const btnPrimaryLocal = {
  border: "1px solid #0f172a",
  background: "#0f172a",
  borderRadius: 12,
  padding: "10px 14px",
  cursor: "pointer",
  fontWeight: 950,
  color: "#fff",
  boxShadow: "0 10px 24px rgba(2,6,23,0.10)",
};

const btnCollapse = {
  border: "1px solid rgba(226,232,240,0.95)",
  background: "#fff",
  borderRadius: 12,
  padding: "8px 12px",
  cursor: "pointer",
  fontWeight: 950,
  color: "#0f172a",
};

const advancedNote = {
  fontSize: 12.5,
  fontWeight: 800,
  color: "#64748b",
  lineHeight: 1.4,
  padding: "10px 12px",
  borderRadius: 12,
  background: "rgba(241,245,249,0.85)",
  border: "1px solid rgba(226,232,240,0.95)",
};

const advancedGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 12,
  marginTop: 2,
};

const loadingBox = {
  borderRadius: 16,
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.95)",
  padding: 16,
  fontWeight: 900,
  color: "#64748b",
};

const errorBox = {
  padding: 12,
  marginBottom: 14,
  borderRadius: 14,
  border: "1px solid rgba(254,202,202,0.95)",
  background: "rgba(254,226,226,0.95)",
  color: "#991b1b",
  fontWeight: 900,
};

const successBox = {
  padding: 12,
  marginBottom: 14,
  borderRadius: 14,
  border: "1px solid rgba(187,247,208,0.95)",
  background: "rgba(220,252,231,0.95)",
  color: "#166534",
  fontWeight: 900,
};

const readOnlyBox = {
  marginTop: 14,
  padding: 12,
  borderRadius: 14,
  border: "1px solid rgba(253,230,138,0.95)",
  background: "rgba(254,243,199,0.95)",
  color: "#92400e",
  fontWeight: 900,
};

const stickyFooter = {
  position: "sticky",
  bottom: 0,
  zIndex: 5,
  marginTop: 16,
  paddingTop: 12,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
  padding: 12,
  borderRadius: 16,
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.95)",
  backdropFilter: "blur(8px)",
  boxShadow: "0 12px 24px rgba(2,6,23,0.08)",
};

const stickyLeft = {
  fontSize: 13,
  color: "#64748b",
  fontWeight: 800,
};


