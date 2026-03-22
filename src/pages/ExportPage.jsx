// src/pages/ExportPage.jsx
import { useMemo, useRef, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import ExportPanel from "../components/export/ExportPanel";
import { downloadExportXlsx, downloadExportPdf } from "../services/exportService";
import { Icon } from "../components/ui/lpIcons";
import { usePlant } from "../context/PlantContext";

/* helpers */
const ymd = (d) => {
  const dt = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

/* Toast */
function Toast({ toast, onClose }) {
  if (!toast?.open) return null;

  const tone =
    toast.tone === "success"
      ? { bg: "rgba(34,197,94,0.14)", bd: "rgba(34,197,94,0.28)", fg: "#14532d" }
      : toast.tone === "danger"
      ? { bg: "rgba(239,68,68,0.12)", bd: "rgba(239,68,68,0.26)", fg: "#7f1d1d" }
      : { bg: "rgba(100,116,139,0.12)", bd: "rgba(100,116,139,0.24)", fg: "#0f172a" };

  return (
    <div style={toastWrap} role="status" aria-live="polite" onClick={onClose}>
      <div style={{ ...toastCard, background: tone.bg, borderColor: tone.bd, color: tone.fg }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {toast.tone === "success" ? (
            <span style={okPop}>
              <Icon name="check" />
            </span>
          ) : null}
          <div style={{ fontWeight: 950 }}>{toast.title || "Listo"}</div>
        </div>
        {toast.message ? (
          <div style={{ marginTop: 2, fontWeight: 850, opacity: 0.92 }}>{toast.message}</div>
        ) : null}
      </div>
    </div>
  );
}

const toastWrap = { position: "fixed", right: 18, bottom: 18, zIndex: 9999, cursor: "pointer" };
const toastCard = {
  minWidth: 260,
  maxWidth: 460,
  padding: "12px 14px",
  borderRadius: 14,
  border: "1px solid rgba(226,232,240,0.95)",
  boxShadow: "0 18px 34px rgba(2,6,23,0.18)",
  animation: "lp_toast_in 220ms ease",
};

export default function ExportPage() {
  const { currentPlantId, currentPlant } = usePlant();

  const [resource, setResource] = useState("executions");
  const [movementType, setMovementType] = useState("");
  const [execStatus, setExecStatus] = useState("");
  const [reportStatus, setReportStatus] = useState("");
  const [reportCondition, setReportCondition] = useState("");
  const [reportCategory, setReportCategory] = useState("");

  const [mode, setMode] = useState("days");
  const [days, setDays] = useState(180);

  const today = new Date();
  const [from, setFrom] = useState(ymd(new Date(today.getFullYear(), 0, 1)));
  const [to, setTo] = useState(ymd(today));

  const [severity, setSeverity] = useState("ALL");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState({ open: false });
  const [format, setFormat] = useState("xlsx");

  const [confirmPulse, setConfirmPulse] = useState(false);
  const confirmT = useRef(null);

  const showToast = (t) => {
    setToast({ open: true, ms: 2200, ...t });
    window.setTimeout(() => setToast((p) => ({ ...p, open: false })), t?.ms || 2200);
  };

  const commonParams = useMemo(() => {
    if (mode === "range") return { from, to };
    return { days };
  }, [mode, from, to, days]);

  const rangeLabel = useMemo(() => {
    if (mode === "range") return `${from || "—"} → ${to || "—"}`;
    return `Últimos ${days} días`;
  }, [mode, from, to, days]);

  const validateRange = () => {
    if (mode === "days") {
      const n = Number(days);
      if (!Number.isFinite(n) || n <= 0) return "Días inválidos.";
      return null;
    }

    if (!from || !to) return "Selecciona Desde y Hasta.";

    const a = new Date(from);
    const b = new Date(to);

    if (!Number.isFinite(a.getTime()) || !Number.isFinite(b.getTime())) {
      return "Fechas inválidas.";
    }

    if (a > b) return "El rango es inválido: 'Desde' debe ser ≤ 'Hasta'.";
    return null;
  };

  const buildExtraFilters = () => {
    const extra = {};

    if (resource === "failures" && severity) {
      extra.severity = severity;
    }

    if (resource === "executions" && execStatus) {
      extra.status = execStatus;
    }

    if (resource === "movements" && movementType) {
      extra.type = movementType;
    }

    if (resource === "condition_reports") {
      if (reportStatus) extra.status = reportStatus;
      if (reportCondition) extra.condition = reportCondition;
      if (reportCategory) extra.category = reportCategory;
    }

    return extra;
  };

  const doDownload = async (resourceOrResources = resource, extra = {}, label = "") => {
  if (busy) return;

  const errRange = validateRange();
  if (errRange) {
    showToast({ tone: "danger", title: "Revisa el rango", message: errRange });
    return;
  }

  if (!currentPlantId) {
    showToast({
      tone: "danger",
      title: "Sin planta",
      message: "Selecciona una planta antes de exportar.",
    });
    return;
  }

  const finalParams = {
    ...commonParams,
    ...extra,
    plantId: currentPlantId,
  };

  try {
    setBusy(true);

    if (format === "pdf") {
      await downloadExportPdf(resourceOrResources, finalParams, {}, 90000);
    } else {
      await downloadExportXlsx(resourceOrResources, finalParams, {}, 90000);
    }

    setConfirmPulse(true);
    if (confirmT.current) window.clearTimeout(confirmT.current);
    confirmT.current = window.setTimeout(() => setConfirmPulse(false), 1200);

    showToast({
      tone: "success",
      title: "Descarga lista",
      message: label || `${String(format).toUpperCase()} generado`,
    });
  } catch (e) {
    console.error("EXPORT FRONT ERROR:", e);
    showToast({
      tone: "danger",
      title: "Error al exportar",
      message: e?.message || "Error",
    });
  } finally {
    setBusy(false);
  }
};

  return (
    <MainLayout>
      <style>{`
        @keyframes lp_toast_in {
          from { transform: translateY(12px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes lp_ok_pop {
          0% { transform: scale(.7); opacity: 0; }
          70% { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes lp_shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .lpCard {
          position: relative;
          overflow: hidden;
          transition: transform 160ms ease, box-shadow 160ms ease;
        }
        .lpCard:hover {
          transform: translateY(-3px);
          box-shadow: 0 18px 40px rgba(2,6,23,0.12);
        }
        .lpConfirmBtn {
          position: relative;
          overflow: hidden;
        }
        .lpConfirmBtn.lpOk::after{
          content:"";
          position:absolute;
          inset:0;
          background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0) 100%);
          background-size: 200% 100%;
          animation: lp_shimmer 700ms ease;
          pointer-events:none;
        }
      `}</style>

      <Toast toast={toast} onClose={() => setToast((p) => ({ ...p, open: false }))} />

      <div style={pageHeader}>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ margin: 0 }}>Exportar</h1>
          <p style={{ margin: "6px 0 0", color: "#64748b", fontWeight: 800 }}>
            Descarga información general de LubriPlan en Excel o PDF
            {currentPlant?.name ? ` · Planta: ${currentPlant.name}` : ""}
          </p>

          <div style={summaryRow}>
            <span style={pillGray}>
              <span style={pillIcon}>
                <Icon name="doc" />
              </span>
              Formato: {format.toUpperCase()}
            </span>

            <span style={pillGray}>
              <span style={pillIcon}>
                <Icon name="route" />
              </span>
              Rango: {rangeLabel}
            </span>

            <span style={pillGray2}>
              <span style={pillIcon}>
                <Icon name="list" />
              </span>
              Modo: {mode === "range" ? "Desde / Hasta" : "Últimos días"}
            </span>

            {busy ? (
              <span style={pillWarn}>
                <span style={pillIcon}>
                  <Icon name="bolt" />
                </span>
                Exportando…
              </span>
            ) : null}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button
            style={btnGhost}
            disabled={busy}
            onClick={() => {
              setMode("days");
              setDays(180);
              setFrom(ymd(new Date(today.getFullYear(), 0, 1)));
              setTo(ymd(today));
              setSeverity("ALL");
              setResource("executions");
              setMovementType("");
              setExecStatus("");
              setReportStatus("");
              setReportCondition("");
              setReportCategory("");
              setFormat("xlsx");
              showToast({ tone: "neutral", title: "Listo", message: "Filtros restablecidos" });
            }}
            title="Restablecer filtros"
          >
            <span style={btnRow}>
              <Icon name="reset" />
              Reset
            </span>
          </button>

          <button
            className={`lpConfirmBtn ${confirmPulse ? "lpOk" : ""}`}
            style={btnPrimary}
            disabled={busy}
            onClick={() => doDownload(resource, buildExtraFilters(), resource)}
            title="Export rápido"
          >
            <span style={btnRow}>
              {confirmPulse ? <Icon name="check" /> : <Icon name="download" />}
              {confirmPulse ? "Listo" : "Export rápido"}
            </span>
          </button>
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <ExportPanel
          busy={busy}
          mode={mode}
          setMode={setMode}
          days={days}
          setDays={setDays}
          from={from}
          setFrom={setFrom}
          to={to}
          setTo={setTo}
          severity={severity}
          setSeverity={setSeverity}
          resource={resource}
          setResource={setResource}
          movementType={movementType}
          setMovementType={setMovementType}
          execStatus={execStatus}
          setExecStatus={setExecStatus}
          reportStatus={reportStatus}
          setReportStatus={setReportStatus}
          reportCondition={reportCondition}
          setReportCondition={setReportCondition}
          reportCategory={reportCategory}
          setReportCategory={setReportCategory}
          format={format}
          setFormat={setFormat}
          onDownload={() => doDownload(resource, buildExtraFilters(), resource)}
        />
      </div>

      <div style={grid}>
        <ExportCard
          icon="doc"
          title="Reporte consolidado"
          desc="Descarga un paquete completo con ejecuciones, movimientos y rutas en un solo archivo."
          badge="Pro"
          onDownload={() =>
            doDownload(
              ["executions", "movements", "routes"],
              {},
              "Reporte consolidado"
            )
          }
          busy={busy}
        />

        <ExportCard
          icon="list"
          title="Actividades / Ejecuciones"
          desc="Incluye estado, fechas, técnico, ruta, equipo, condición, observaciones y cantidad usada."
          onDownload={() =>
            doDownload("executions", buildExtraFilters(), "Actividades / Ejecuciones")
          }
          busy={busy}
        />

        <ExportCard
          icon="drop"
          title="Consumo (Movimientos)"
          desc="Entradas/salidas, cantidades, stock before/after, ejecución ligada, equipo y técnico."
          onDownload={() =>
            doDownload("movements", buildExtraFilters(), "Movimientos")
          }
          busy={busy}
        />

        <ExportCard
          icon="route"
          title="Rutas"
          desc="Rutas con frecuencia, método, instrucciones, equipo y lubricante asociado."
          onDownload={() => doDownload("routes", {}, "Rutas")}
          busy={busy}
        />

        <div className="lpCard" style={card}>
          <div style={orangeBar} />
          <div style={cardTop}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={iconBoxSoft}>
                <Icon name="warn" />
              </span>
              <div>
                <div style={cardTitle}>Fallas</div>
                <div style={cardDesc}>
                  Ejecuciones completadas con condición <b>MALO</b> o <b>CRITICO</b>.
                </div>
              </div>
            </div>
            <span style={pillGray}>Filtro</span>
          </div>

          <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={miniLbl}>Severidad</span>
            <select
              value={severity}
              disabled={busy}
              onChange={(e) => setSeverity(e.target.value)}
              style={selectMini}
            >
              <option value="ALL">ALL (MALO + CRITICO)</option>
              <option value="MALO">MALO</option>
              <option value="CRITICO">CRITICO</option>
            </select>
          </div>

          <button
            style={{ ...btnDark, opacity: busy ? 0.7 : 1 }}
            disabled={busy}
            onClick={() => doDownload("failures", buildExtraFilters(), "Fallas")}
          >
            <span style={btnRow}>
              <Icon name="download" />
              Descargar
            </span>
          </button>

          <div style={note}>Tip: usa el filtro para reducir ruido.</div>
        </div>

        <ExportCard
  icon="bolt"
  title="Actividades emergentes"
  desc="Fuera de ruta/plan: equipo, técnico, fecha, motivo/notas y condición."
  badge="Nuevo"
  onDownload={() => doDownload("emergents", {}, "Actividades emergentes")}
  busy={busy}
/>

        <ExportCard
          icon="doc"
          title="Condición reportada"
          desc="Consolidado de condición, observaciones, equipo y quién reportó."
          badge="Nuevo"
          onDownload={() =>
            doDownload("condition_reports", buildExtraFilters(), "Condición reportada")
          }
          busy={busy}
        />
      </div>
    </MainLayout>
  );
}

function ExportCard({ icon, title, desc, onDownload, busy, badge }) {
  return (
    <div className="lpCard" style={card}>
      <div style={orangeBar} />
      <div style={cardTop}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={iconBox}>
            <Icon name={icon} />
          </span>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <div style={cardTitle}>{title}</div>
              {badge ? <span style={pillWarn}>{badge}</span> : null}
            </div>
            <div style={cardDesc}>{desc}</div>
          </div>
        </div>
        <span style={pillGray}>Export</span>
      </div>

      <button
        style={{ ...btnDark, opacity: busy ? 0.7 : 1 }}
        disabled={busy}
        onClick={onDownload}
      >
        <span style={btnRow}>
          <Icon name="download" />
          Descargar
        </span>
      </button>
    </div>
  );
}

/* ===== estilos ===== */

const btnRow = { display: "inline-flex", alignItems: "center", gap: 8 };

const okPop = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 26,
  height: 26,
  borderRadius: 999,
  background: "rgba(34,197,94,0.16)",
  border: "1px solid rgba(34,197,94,0.30)",
  animation: "lp_ok_pop 220ms ease",
};

const pageHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
  gap: 12,
  flexWrap: "wrap",
};

const summaryRow = {
  marginTop: 10,
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  alignItems: "center",
};

const grid = {
  marginTop: 14,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: 12,
};

const card = {
  position: "relative",
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 14,
  padding: 14,
  background: "#fff",
  boxShadow: "0 12px 30px rgba(2,6,23,0.06)",
  overflow: "hidden",
};

const orangeBar = {
  position: "absolute",
  left: 0,
  right: 0,
  top: 0,
  height: 8,
  background: "#f97316",
};

const cardTop = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 12,
  marginTop: 6,
};

const cardTitle = { fontWeight: 950, color: "#0f172a" };
const cardDesc = {
  marginTop: 6,
  color: "#64748b",
  fontWeight: 850,
  fontSize: 12,
  lineHeight: 1.4,
};

const iconBox = {
  width: 38,
  height: 38,
  borderRadius: 12,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(249,115,22,0.16)",
  border: "1px solid rgba(249,115,22,0.22)",
  fontWeight: 950,
  color: "#0f172a",
  flex: "0 0 auto",
};

const iconBoxSoft = {
  ...iconBox,
  background: "rgba(241,245,249,0.95)",
  border: "1px solid rgba(226,232,240,0.95)",
};

const btnDark = {
  marginTop: 12,
  width: "fit-content",
  border: "1px solid rgba(15,23,42,0.12)",
  borderRadius: 12,
  background: "#0f172a",
  color: "#fff",
  padding: "10px 14px",
  cursor: "pointer",
  fontWeight: 950,
  boxShadow: "0 10px 22px rgba(2,6,23,0.10)",
};

const note = { marginTop: 10, fontSize: 12, color: "#94a3b8", fontWeight: 850 };

const pillGray = {
  background: "rgba(241,245,249,0.95)",
  color: "#0f172a",
  borderRadius: 999,
  padding: "6px 10px",
  fontSize: 12,
  fontWeight: 950,
  border: "1px solid rgba(226,232,240,0.95)",
};

const pillGray2 = {
  ...pillGray,
  background: "rgba(226,232,240,0.7)",
  color: "#0f172a",
};

const pillWarn = {
  background: "rgba(249,115,22,0.16)",
  color: "#7c2d12",
  borderRadius: 999,
  padding: "6px 10px",
  fontSize: 12,
  fontWeight: 950,
  border: "1px solid rgba(249,115,22,0.28)",
};

const btnPrimary = {
  border: "1px solid rgba(249,115,22,0.30)",
  background: "rgba(249,115,22,0.20)",
  borderRadius: 12,
  padding: "10px 12px",
  cursor: "pointer",
  fontWeight: 950,
  color: "#0f172a",
  boxShadow: "0 10px 22px rgba(249,115,22,0.12)",
  whiteSpace: "nowrap",
};

const btnGhost = {
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.92)",
  borderRadius: 12,
  padding: "10px 12px",
  cursor: "pointer",
  fontWeight: 950,
  color: "#0f172a",
  boxShadow: "0 8px 18px rgba(2,6,23,0.04)",
  whiteSpace: "nowrap",
};

const miniLbl = { fontSize: 12, fontWeight: 950, color: "#64748b" };

const selectMini = {
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 12,
  padding: "10px 12px",
  fontWeight: 950,
  background: "rgba(255,255,255,0.92)",
  cursor: "pointer",
  boxShadow: "0 8px 18px rgba(2,6,23,0.04)",
  outline: "none",
};

const pillIcon = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  marginRight: 6,
  transform: "translateY(1px)",
};