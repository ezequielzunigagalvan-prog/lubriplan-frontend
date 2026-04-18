import { useMemo, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import { Icon } from "../components/ui/lpIcons";
import { createClientOnboarding } from "../services/adminOnboardingService";
import { usePlant } from "../context/PlantContext";

const DEFAULT_FORM = {
  companyName: "",
  plantName: "",
  timezone: "America/Mexico_City",
  adminName: "",
  adminEmail: "",
  adminPassword: "",
  monthlyReportEnabled: true,
  monthlyReportDay: 1,
  monthlyReportHour: 8,
  monthlyReportRecipientsExtra: "",
  linkRequesterToPlant: true,
  createBaseArea: true,
  baseAreaName: "General",
  applyGlobalSettings: false,
  settings: {
    executionEvidenceRequired: true,
    preventNegativeStock: true,
    lowStockWarningEnabled: true,
    predictiveAlertsEnabled: true,
    aiSummaryEnabled: false,
    technicianOverloadEnabled: true,
  },
};

function Field({ label, hint, children }) {
  return (
    <label style={fieldWrap}>
      <span style={fieldTop}>
        <span style={fieldLabel}>{label}</span>
        {hint ? <span style={fieldHint}>{hint}</span> : null}
      </span>
      {children}
    </label>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        ...toggle,
        ...(checked ? toggleOn : toggleOff),
      }}
      title={label}
    >
      <span style={{ ...toggleDot, transform: checked ? "translateX(24px)" : "translateX(0)" }} />
      <span style={toggleText}>{checked ? "Activo" : "Inactivo"}</span>
    </button>
  );
}

function SectionCard({ title, subtitle, icon = "building", children, tone = "orange" }) {
  return (
    <section style={{ ...card, ...(tone === "amber" ? cardAmber : null) }}>
      <div style={{ ...cardBar, background: tone === "amber" ? "#f59e0b" : "#f97316" }} />
      <div style={cardHead}>
        <div style={cardIconBox}>
          <Icon name={icon} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={cardTitle}>{title}</div>
          {subtitle ? <div style={cardSubtitle}>{subtitle}</div> : null}
        </div>
      </div>
      <div style={cardBody}>{children}</div>
    </section>
  );
}

export default function AdminOnboardingPage() {
  const { refreshPlants, setPlant } = usePlant();
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [created, setCreated] = useState(null);

  const selectedSettingsCount = useMemo(() => {
    return Object.values(form.settings).filter(Boolean).length;
  }, [form.settings]);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateSetting(key, value) {
    setForm((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        [key]: value,
      },
    }));
  }

  function resetForm() {
    setForm(DEFAULT_FORM);
    setError("");
    setSuccess("");
    setCreated(null);
  }

  async function onSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setCreated(null);

    if (!String(form.plantName || form.companyName || "").trim()) {
      setError("Captura al menos el nombre de la planta o el nombre comercial.");
      return;
    }

    if (!String(form.adminName || "").trim()) {
      setError("Captura el nombre del administrador inicial.");
      return;
    }

    if (!String(form.adminEmail || "").trim()) {
      setError("Captura el correo del administrador inicial.");
      return;
    }

    if (String(form.adminPassword || "").length < 8) {
      setError("La password temporal debe tener al menos 8 caracteres.");
      return;
    }

    const payload = {
      companyName: String(form.companyName || "").trim() || undefined,
      plantName: String(form.plantName || "").trim() || undefined,
      timezone: String(form.timezone || "").trim() || "America/Mexico_City",
      adminName: String(form.adminName || "").trim(),
      adminEmail: String(form.adminEmail || "").trim().toLowerCase(),
      adminPassword: String(form.adminPassword || ""),
      monthlyReportEnabled: Boolean(form.monthlyReportEnabled),
      monthlyReportDay: Number(form.monthlyReportDay || 1),
      monthlyReportHour: Number(form.monthlyReportHour || 8),
      monthlyReportRecipientsExtra:
        String(form.monthlyReportRecipientsExtra || "").trim() || undefined,
      linkRequesterToPlant: Boolean(form.linkRequesterToPlant),
      createBaseArea: Boolean(form.createBaseArea),
      baseAreaName: String(form.baseAreaName || "").trim() || undefined,
      applyGlobalSettings: Boolean(form.applyGlobalSettings),
      settings: form.applyGlobalSettings ? form.settings : undefined,
    };

    setSaving(true);
    try {
      const response = await createClientOnboarding(payload);
      setCreated(response);
      setSuccess("Cliente creado correctamente.");
      if (response?.requesterLinked) {
        await refreshPlants();
      }
    } catch (err) {
      setError(err?.message || "No se pudo crear el cliente.");
    } finally {
      setSaving(false);
    }
  }

  async function onEnterPlant() {
    const plantId = created?.plant?.id;
    if (!plantId) return;
    try {
      await refreshPlants();
      await setPlant(plantId);
      setSuccess("Planta lista. Ya puedes trabajar sobre el nuevo cliente.");
    } catch (err) {
      setError(err?.message || "No se pudo cambiar a la nueva planta.");
    }
  }

  return (
    <MainLayout>
      <div style={pageWrap}>
        <div style={hero}>
          <div>
            <div style={eyebrow}>ONBOARDING INTERNO</div>
            <h1 style={title}>Alta de cliente</h1>
            <p style={subtitle}>
              Crea la planta inicial, el administrador del cliente y la configuracion base desde un solo flujo.
            </p>
          </div>

          <div style={heroBadges}>
            <span style={badge}>Uso interno</span>
            <span style={badge}>Admin</span>
          </div>
        </div>

        {error ? <div style={errorBox}>{error}</div> : null}
        {success ? <div style={successBox}>{success}</div> : null}

        {created ? (
          <div style={summaryCard}>
            <div style={summaryHead}>
              <div>
                <div style={summaryTitle}>Cliente listo</div>
                <div style={summarySubtitle}>
                  Planta <b>{created?.plant?.name}</b> creada con administrador <b>{created?.user?.email}</b>.
                </div>
              </div>

              {created?.requesterLinked ? (
                <button type="button" style={btnPrimary} onClick={onEnterPlant}>
                  Entrar a la nueva planta
                </button>
              ) : null}
            </div>

            <div style={summaryGrid}>
              <div style={summaryItem}>
                <span style={summaryLabel}>Zona horaria</span>
                <span style={summaryValue}>{created?.plant?.timezone || "-"}</span>
              </div>
              <div style={summaryItem}>
                <span style={summaryLabel}>Area base</span>
                <span style={summaryValue}>{created?.baseArea?.name || "No creada"}</span>
              </div>
              <div style={summaryItem}>
                <span style={summaryLabel}>Ajustes globales</span>
                <span style={summaryValue}>{created?.settingsApplied ? "Aplicados" : "Sin cambios"}</span>
              </div>
              <div style={summaryItem}>
                <span style={summaryLabel}>Vinculo interno</span>
                <span style={summaryValue}>{created?.requesterLinked ? "Activo" : "No vinculado"}</span>
              </div>
            </div>

            {created?.note ? <div style={summaryNote}>{created.note}</div> : null}
          </div>
        ) : null}

        <form onSubmit={onSubmit} style={formWrap}>
          <div style={grid}>
            <SectionCard
              title="Cliente y planta"
              subtitle="Datos base para abrir el entorno del nuevo cliente."
              icon="building"
            >
              <Field label="Nombre comercial" hint="Referencia interna o nombre de la empresa.">
                <input
                  value={form.companyName}
                  onChange={(e) => updateField("companyName", e.target.value)}
                  style={input}
                  placeholder="Cliente Demo"
                />
              </Field>

              <Field label="Planta inicial" hint="Este nombre si se guarda como planta operativa.">
                <input
                  value={form.plantName}
                  onChange={(e) => updateField("plantName", e.target.value)}
                  style={input}
                  placeholder="Planta Principal"
                />
              </Field>

              <Field label="Zona horaria" hint="Usa la zona horaria exacta de la planta.">
                <input
                  value={form.timezone}
                  onChange={(e) => updateField("timezone", e.target.value)}
                  style={input}
                  placeholder="America/Mexico_City"
                />
              </Field>
            </SectionCard>

            <SectionCard
              title="Administrador inicial"
              subtitle="Credenciales del primer usuario del cliente."
              icon="user"
            >
              <Field label="Nombre" hint="Contacto principal del cliente.">
                <input
                  value={form.adminName}
                  onChange={(e) => updateField("adminName", e.target.value)}
                  style={input}
                  placeholder="Juan Perez"
                />
              </Field>

              <Field label="Correo" hint="Debe ser unico dentro de LubriPlan.">
                <input
                  value={form.adminEmail}
                  onChange={(e) => updateField("adminEmail", e.target.value)}
                  style={input}
                  placeholder="juan@cliente.com"
                  type="email"
                />
              </Field>

              <Field label="Password temporal" hint="Minimo 8 caracteres.">
                <input
                  value={form.adminPassword}
                  onChange={(e) => updateField("adminPassword", e.target.value)}
                  style={input}
                  placeholder="Temp1234*"
                  type="password"
                />
              </Field>
            </SectionCard>
          </div>

          <div style={grid}>
            <SectionCard
              title="Configuracion de planta"
              subtitle="Deja activa la base de reportes desde el primer dia."
              icon="calendar"
            >
              <div style={toggleRow}>
                <div>
                  <div style={toggleTitle}>Reporte mensual</div>
                  <div style={toggleHint}>Activa la programacion mensual para la planta nueva.</div>
                </div>
                <Toggle
                  checked={form.monthlyReportEnabled}
                  onChange={(value) => updateField("monthlyReportEnabled", value)}
                  label="Reporte mensual"
                />
              </div>

              <div style={inlineGrid}>
                <Field label="Dia de envio">
                  <input
                    value={form.monthlyReportDay}
                    onChange={(e) => updateField("monthlyReportDay", e.target.value)}
                    style={input}
                    type="number"
                    min="1"
                    max="28"
                  />
                </Field>

                <Field label="Hora de envio">
                  <input
                    value={form.monthlyReportHour}
                    onChange={(e) => updateField("monthlyReportHour", e.target.value)}
                    style={input}
                    type="number"
                    min="0"
                    max="23"
                  />
                </Field>
              </div>

              <Field label="Correos extra" hint="Opcional. Separa varios correos con coma.">
                <textarea
                  value={form.monthlyReportRecipientsExtra}
                  onChange={(e) => updateField("monthlyReportRecipientsExtra", e.target.value)}
                  style={{ ...input, minHeight: 92, resize: "vertical" }}
                  placeholder="mantenimiento@cliente.com, gerencia@cliente.com"
                />
              </Field>
            </SectionCard>

            <SectionCard
              title="Opciones iniciales"
              subtitle="Ajustes operativos para dejar el entorno listo."
              icon="tool"
            >
              <div style={toggleRow}>
                <div>
                  <div style={toggleTitle}>Vincular mi usuario a la nueva planta</div>
                  <div style={toggleHint}>Sirve para entrar despues y terminar configuracion o demo.</div>
                </div>
                <Toggle
                  checked={form.linkRequesterToPlant}
                  onChange={(value) => updateField("linkRequesterToPlant", value)}
                  label="Vincular usuario"
                />
              </div>

              <div style={toggleRow}>
                <div>
                  <div style={toggleTitle}>Crear area base</div>
                  <div style={toggleHint}>Recomendado para arrancar con estructura minima.</div>
                </div>
                <Toggle
                  checked={form.createBaseArea}
                  onChange={(value) => updateField("createBaseArea", value)}
                  label="Crear area base"
                />
              </div>

              <Field label="Nombre del area base" hint="Solo aplica si esta activada la opcion anterior.">
                <input
                  value={form.baseAreaName}
                  onChange={(e) => updateField("baseAreaName", e.target.value)}
                  style={input}
                  placeholder="General"
                  disabled={!form.createBaseArea}
                />
              </Field>
            </SectionCard>
          </div>

          <SectionCard
            title="Ajustes globales"
            subtitle="Solo aplica si estas preparando un entorno nuevo y controlado."
            icon="settings"
            tone="amber"
          >
            <div style={warningBox}>
              Hoy estos ajustes siguen siendo globales. Si los aplicas aqui, pueden impactar otras plantas del mismo entorno.
            </div>

            <div style={toggleRow}>
              <div>
                <div style={toggleTitle}>Aplicar ajustes globales base</div>
                <div style={toggleHint}>Activalo solo si quieres dejar reglas operativas iniciales desde onboarding.</div>
              </div>
              <Toggle
                checked={form.applyGlobalSettings}
                onChange={(value) => updateField("applyGlobalSettings", value)}
                label="Aplicar ajustes globales"
              />
            </div>

            <div style={settingsInfoRow}>
              <span style={settingsBadge}>{selectedSettingsCount} ajustes listos</span>
              <span style={settingsHint}>Puedes dejar esto apagado y configurarlo despues desde Ajustes.</span>
            </div>

            <div style={settingsGrid}>
              {[
                ["executionEvidenceRequired", "Evidencia obligatoria"],
                ["preventNegativeStock", "Evitar stock negativo"],
                ["lowStockWarningEnabled", "Alertas de bajo stock"],
                ["predictiveAlertsEnabled", "Alertas predictivas"],
                ["aiSummaryEnabled", "Resumen IA"],
                ["technicianOverloadEnabled", "Sobrecarga de tecnicos"],
              ].map(([key, label]) => (
                <div key={key} style={{ ...settingItem, opacity: form.applyGlobalSettings ? 1 : 0.55 }}>
                  <div>
                    <div style={toggleTitle}>{label}</div>
                  </div>
                  <Toggle
                    checked={Boolean(form.settings[key])}
                    onChange={(value) => updateSetting(key, value)}
                    label={label}
                  />
                </div>
              ))}
            </div>
          </SectionCard>

          <div style={footerBar}>
            <button type="button" onClick={resetForm} style={btnGhost} disabled={saving}>
              Limpiar formulario
            </button>
            <button type="submit" style={btnPrimary} disabled={saving}>
              {saving ? "Creando cliente..." : "Crear cliente"}
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}

const pageWrap = {
  display: "grid",
  gap: 18,
};

const hero = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 16,
  flexWrap: "wrap",
  padding: 20,
  borderRadius: 24,
  background: "linear-gradient(135deg, rgba(249,115,22,0.14) 0%, rgba(15,23,42,0.03) 100%)",
  border: "1px solid rgba(249,115,22,0.20)",
  boxShadow: "0 18px 36px rgba(15,23,42,0.06)",
};

const eyebrow = {
  fontSize: 12,
  fontWeight: 900,
  letterSpacing: 1.8,
  color: "#64748b",
};

const title = {
  margin: "8px 0 0 0",
  fontSize: 34,
  lineHeight: 1,
  fontWeight: 1000,
  color: "#0f172a",
};

const subtitle = {
  margin: "12px 0 0 0",
  maxWidth: 720,
  fontSize: 15,
  lineHeight: 1.6,
  fontWeight: 700,
  color: "#475569",
};

const heroBadges = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
};

const badge = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "8px 12px",
  borderRadius: 999,
  border: "1px solid rgba(148,163,184,0.30)",
  background: "rgba(255,255,255,0.82)",
  fontSize: 12,
  fontWeight: 900,
  color: "#334155",
};

const errorBox = {
  padding: 14,
  borderRadius: 18,
  border: "1px solid rgba(248,113,113,0.26)",
  background: "rgba(254,226,226,0.88)",
  color: "#991b1b",
  fontWeight: 900,
};

const successBox = {
  padding: 14,
  borderRadius: 18,
  border: "1px solid rgba(74,222,128,0.26)",
  background: "rgba(220,252,231,0.90)",
  color: "#166534",
  fontWeight: 900,
};

const summaryCard = {
  display: "grid",
  gap: 14,
  padding: 18,
  borderRadius: 22,
  border: "1px solid rgba(59,130,246,0.20)",
  background: "linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(255,255,255,0.96) 100%)",
  boxShadow: "0 16px 34px rgba(2,6,23,0.06)",
};

const summaryHead = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
};

const summaryTitle = {
  fontSize: 20,
  fontWeight: 1000,
  color: "#0f172a",
};

const summarySubtitle = {
  marginTop: 4,
  fontSize: 14,
  lineHeight: 1.55,
  color: "#334155",
  fontWeight: 700,
};

const summaryGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 12,
};

const summaryItem = {
  display: "grid",
  gap: 6,
  padding: 14,
  borderRadius: 16,
  border: "1px solid rgba(191,219,254,0.58)",
  background: "rgba(255,255,255,0.90)",
};

const summaryLabel = {
  fontSize: 12,
  fontWeight: 900,
  color: "#64748b",
  letterSpacing: 0.5,
  textTransform: "uppercase",
};

const summaryValue = {
  fontSize: 15,
  fontWeight: 900,
  color: "#0f172a",
};

const summaryNote = {
  padding: 12,
  borderRadius: 14,
  background: "rgba(255,255,255,0.82)",
  border: "1px solid rgba(148,163,184,0.22)",
  fontSize: 13,
  lineHeight: 1.5,
  fontWeight: 700,
  color: "#475569",
};

const formWrap = {
  display: "grid",
  gap: 16,
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: 16,
};

const card = {
  position: "relative",
  padding: 18,
  borderRadius: 22,
  background: "rgba(255,255,255,0.98)",
  border: "1px solid rgba(226,232,240,0.95)",
  boxShadow: "0 16px 32px rgba(2,6,23,0.06)",
  overflow: "hidden",
};

const cardAmber = {
  border: "1px solid rgba(245,158,11,0.22)",
  background: "linear-gradient(180deg, rgba(255,251,235,0.96) 0%, rgba(255,255,255,0.98) 100%)",
};

const cardBar = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: 6,
};

const cardHead = {
  display: "flex",
  alignItems: "flex-start",
  gap: 12,
};

const cardIconBox = {
  width: 42,
  height: 42,
  borderRadius: 14,
  display: "grid",
  placeItems: "center",
  background: "#0f172a",
  color: "#fff",
  flexShrink: 0,
};

const cardTitle = {
  fontSize: 18,
  fontWeight: 1000,
  color: "#0f172a",
};

const cardSubtitle = {
  marginTop: 4,
  fontSize: 13,
  lineHeight: 1.5,
  fontWeight: 700,
  color: "#64748b",
};

const cardBody = {
  display: "grid",
  gap: 14,
  marginTop: 16,
};

const fieldWrap = {
  display: "grid",
  gap: 8,
};

const fieldTop = {
  display: "grid",
  gap: 4,
};

const fieldLabel = {
  fontSize: 13,
  fontWeight: 900,
  color: "#0f172a",
};

const fieldHint = {
  fontSize: 12,
  fontWeight: 700,
  lineHeight: 1.45,
  color: "#64748b",
};

const input = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 14,
  border: "1px solid rgba(203,213,225,0.95)",
  background: "#fff",
  color: "#0f172a",
  fontSize: 14,
  fontWeight: 800,
  outline: "none",
  boxSizing: "border-box",
};

const inlineGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 12,
};

const toggleRow = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 14,
  padding: 14,
  borderRadius: 16,
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(248,250,252,0.78)",
  flexWrap: "wrap",
};

const toggleTitle = {
  fontSize: 14,
  fontWeight: 900,
  color: "#0f172a",
};

const toggleHint = {
  marginTop: 4,
  fontSize: 12,
  lineHeight: 1.45,
  fontWeight: 700,
  color: "#64748b",
};

const toggle = {
  position: "relative",
  width: 110,
  height: 38,
  padding: "0 12px",
  borderRadius: 999,
  border: "1px solid rgba(0,0,0,0.08)",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#fff",
};

const toggleOn = {
  background: "rgba(249,115,22,0.16)",
  color: "#c2410c",
};

const toggleOff = {
  background: "rgba(241,245,249,0.94)",
  color: "#64748b",
};

const toggleDot = {
  position: "absolute",
  left: 6,
  width: 24,
  height: 24,
  borderRadius: 999,
  background: "#fff",
  border: "1px solid rgba(0,0,0,0.08)",
  boxShadow: "0 6px 14px rgba(2,6,23,0.10)",
  transition: "transform 160ms ease",
};

const toggleText = {
  fontSize: 12,
  fontWeight: 1000,
  letterSpacing: 0.2,
};

const warningBox = {
  padding: 14,
  borderRadius: 16,
  border: "1px solid rgba(245,158,11,0.22)",
  background: "rgba(255,251,235,0.94)",
  color: "#92400e",
  fontSize: 13,
  lineHeight: 1.5,
  fontWeight: 800,
};

const settingsInfoRow = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  flexWrap: "wrap",
};

const settingsBadge = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "8px 12px",
  borderRadius: 999,
  background: "rgba(249,115,22,0.14)",
  color: "#c2410c",
  border: "1px solid rgba(249,115,22,0.18)",
  fontSize: 12,
  fontWeight: 900,
};

const settingsHint = {
  fontSize: 12,
  fontWeight: 700,
  color: "#64748b",
};

const settingsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
  gap: 12,
};

const settingItem = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  padding: 14,
  borderRadius: 16,
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.84)",
};

const footerBar = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 12,
  flexWrap: "wrap",
  padding: 16,
  borderRadius: 20,
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.96)",
  boxShadow: "0 12px 24px rgba(2,6,23,0.04)",
};

const btnGhost = {
  border: "1px solid rgba(203,213,225,0.95)",
  background: "rgba(255,255,255,0.98)",
  color: "#0f172a",
  padding: "12px 16px",
  borderRadius: 14,
  fontWeight: 900,
  cursor: "pointer",
};

const btnPrimary = {
  border: "1px solid #0f172a",
  background: "#0f172a",
  color: "#fff",
  padding: "12px 16px",
  borderRadius: 14,
  fontWeight: 900,
  cursor: "pointer",
  boxShadow: "0 14px 28px rgba(15,23,42,0.12)",
};
