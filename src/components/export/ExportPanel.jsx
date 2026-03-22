// src/components/export/ExportPanel.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "../ui/lpIcons";

const RESOURCES = [
  { value: "executions", label: "Actividades / Ejecuciones", desc: "Estado, fechas, técnico, ruta, equipo, condición y observaciones." },
  { value: "movements", label: "Movimientos (Consumo)", desc: "Entradas/Salidas/Ajustes con stock before/after y liga a ejecución." },
  { value: "routes", label: "Rutas", desc: "Frecuencia, método, instrucciones, equipo y lubricante." },
  { value: "failures", label: "Fallas (MALO/CRITICO)", desc: "Ejecuciones COMPLETED con condición MALO o CRITICO." },
  { value: "emergents", label: "Actividades emergentes", desc: "Rutas con isEmergency=true (no planeadas / urgentes)." },
  { value: "condition_reports", label: "Condición reportada", desc: "Reportes por equipo: condición, categoría, descripción, estatus y evidencia." },
];

const REPORT_STATUS = ["OPEN", "IN_PROGRESS", "RESOLVED", "DISMISSED"];
const REPORT_CONDITION = ["BUENO", "REGULAR", "MALO", "CRITICO"];
const REPORT_CATEGORY = ["FUGA", "RUIDO", "VIBRACION", "TEMPERATURA", "CONTAMINACION", "OTRO"];

function Field({ label, hint, active, icon, children }) {
  return (
    <div style={{ ...fieldWrap, ...(active ? fieldActive : null) }}>
      <div style={fieldTop}>
        <div style={fieldLabelRow}>
          {icon ? <span style={fieldIcon}>{icon}</span> : null}
          <span style={fieldLabel}>{label}</span>
        </div>
        {hint ? <div style={fieldHint}>{hint}</div> : null}
      </div>

      <div style={fieldBody}>{children}</div>
      <div style={{ ...underline, ...(active ? underlineOn : null) }} />
    </div>
  );
}

export default function ExportPanel({
  busy = false,
  mode,
  setMode,
  days,
  setDays,
  from,
  setFrom,
  to,
  setTo,
  severity,
  setSeverity,
  resource,
  setResource,
  movementType,
  setMovementType,
  execStatus,
  setExecStatus,
  reportStatus,
  setReportStatus,
  reportCondition,
  setReportCondition,
  reportCategory,
  setReportCategory,
  format,
  setFormat,
  onDownload,
}) {
  const [focusKey, setFocusKey] = useState("");
  const blurT = useRef(null);

  const onFieldFocus = (key) => {
    if (blurT.current) window.clearTimeout(blurT.current);
    setFocusKey(key);
  };

  const onFieldBlur = () => {
    if (blurT.current) window.clearTimeout(blurT.current);
    blurT.current = window.setTimeout(() => setFocusKey(""), 0);
  };

  useEffect(() => {
    return () => {
      if (blurT.current) window.clearTimeout(blurT.current);
    };
  }, []);

  const resourceMeta = useMemo(
    () => RESOURCES.find((r) => r.value === resource),
    [resource]
  );

  return (
    <div className="lpExportCard" style={card}>
      <style>{`
        .lpExportCard {
          position: relative;
          transition: transform 160ms ease, box-shadow 160ms ease;
        }
        .lpExportCard:hover {
          transform: translateY(-3px);
          box-shadow: 0 18px 40px rgba(2,6,23,0.10);
        }
      `}</style>

      <div style={accentBar} />

      <div style={topRow}>
        <div style={{ minWidth: 0 }}>
          <div style={titleRow}>
            <div style={panelTitle}>Configuración de exportación</div>
            {!busy ? <span style={pillOk}>LISTO</span> : <span style={pillBusy}>GENERANDO…</span>}
          </div>

          <div style={panelSub}>
            {resourceMeta?.desc || "Configura el tipo de reporte, rango y formato."}
          </div>
        </div>

        <button
          onClick={onDownload}
          style={{ ...btn, opacity: busy ? 0.75 : 1 }}
          disabled={busy}
          type="button"
        >
          {busy ? "Generando..." : `⬇️ Descargar ${String(format || "xlsx").toUpperCase()}`}
        </button>
      </div>

      <div style={grid}>
        <Field
          label="Tipo de exportación"
          icon={<Icon name="list" />}
          hint="Selecciona qué información quieres descargar."
          active={focusKey === "resource"}
        >
          <select
            value={resource}
            onChange={(e) => setResource(e.target.value)}
            style={input}
            onFocus={() => onFieldFocus("resource")}
            onBlur={onFieldBlur}
          >
            {RESOURCES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Formato"
          icon={<Icon name="doc" />}
          hint="Excel para análisis; PDF para compartir o presentar."
          active={focusKey === "format"}
        >
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              style={{ ...chip, ...(format === "xlsx" ? chipOn : null) }}
              onClick={() => setFormat("xlsx")}
              onFocus={() => onFieldFocus("format")}
              onBlur={onFieldBlur}
            >
              XLSX
            </button>

            <button
              type="button"
              style={{ ...chip, ...(format === "pdf" ? chipOn : null) }}
              onClick={() => setFormat("pdf")}
              onFocus={() => onFieldFocus("format")}
              onBlur={onFieldBlur}
            >
              PDF
            </button>
          </div>
        </Field>

        <Field
          label="Rango"
          icon={<Icon name="calendar" />}
          hint="Puedes exportar por últimos días o por fechas."
          active={focusKey === "mode"}
        >
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              style={{ ...chip, ...(mode === "days" ? chipOn : null) }}
              onClick={() => setMode("days")}
              onFocus={() => onFieldFocus("mode")}
              onBlur={onFieldBlur}
            >
              Últimos días
            </button>

            <button
              type="button"
              style={{ ...chip, ...(mode === "range" ? chipOn : null) }}
              onClick={() => setMode("range")}
              onFocus={() => onFieldFocus("mode")}
              onBlur={onFieldBlur}
            >
              Desde / Hasta
            </button>
          </div>

          <div style={{ marginTop: 10 }}>
            {mode === "days" ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span style={ctlLabel}>Días</span>
                <select
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  style={input}
                  onFocus={() => onFieldFocus("days")}
                  onBlur={onFieldBlur}
                >
                  {[30, 90, 180, 365, 730].map((d) => (
                    <option key={d} value={d}>
                      Últimos {d} días
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={ctlLabel}>Desde</span>
                  <input
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    style={input}
                    onFocus={() => onFieldFocus("from")}
                    onBlur={onFieldBlur}
                  />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={ctlLabel}>Hasta</span>
                  <input
                    type="date"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    style={input}
                    onFocus={() => onFieldFocus("to")}
                    onBlur={onFieldBlur}
                  />
                </div>
              </div>
            )}
          </div>
        </Field>

        {resource === "failures" ? (
          <Field
            label="Severidad"
            icon={<Icon name="warn" />}
            hint="ALL exporta MALO + CRITICO."
            active={focusKey === "severity"}
          >
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              style={input}
              onFocus={() => onFieldFocus("severity")}
              onBlur={onFieldBlur}
            >
              <option value="ALL">ALL (MALO + CRITICO)</option>
              <option value="MALO">MALO</option>
              <option value="CRITICO">CRITICO</option>
            </select>
          </Field>
        ) : null}

        {resource === "executions" ? (
          <Field
            label="Estatus"
            icon={<Icon name="checkCircle" />}
            hint="Opcional. Si no eliges, exporta todo."
            active={focusKey === "execStatus"}
          >
            <select
              value={execStatus}
              onChange={(e) => setExecStatus(e.target.value)}
              style={input}
              onFocus={() => onFieldFocus("execStatus")}
              onBlur={onFieldBlur}
            >
              <option value="">Todos</option>
              <option value="PENDING">Pendiente</option>
              <option value="OVERDUE">Atrasada</option>
              <option value="COMPLETED">Completada</option>
            </select>
          </Field>
        ) : null}

        {resource === "movements" ? (
          <Field
            label="Tipo de movimiento"
            icon={<Icon name="drop" />}
            hint="Opcional. Filtra entradas, salidas o ajustes."
            active={focusKey === "movementType"}
          >
            <select
              value={movementType}
              onChange={(e) => setMovementType(e.target.value)}
              style={input}
              onFocus={() => onFieldFocus("movementType")}
              onBlur={onFieldBlur}
            >
              <option value="">Todos</option>
              <option value="OUT">OUT (Salida)</option>
              <option value="IN">IN (Entrada)</option>
              <option value="ADJUST">ADJUST (Ajuste)</option>
            </select>
          </Field>
        ) : null}

        {resource === "condition_reports" ? (
          <>
            <Field label="Estatus del reporte" hint="Opcional" active={focusKey === "reportStatus"}>
              <select
                value={reportStatus}
                onChange={(e) => setReportStatus(e.target.value)}
                style={input}
                onFocus={() => onFieldFocus("reportStatus")}
                onBlur={onFieldBlur}
              >
                <option value="">Todos</option>
                {REPORT_STATUS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Condición" hint="Opcional" active={focusKey === "reportCondition"}>
              <select
                value={reportCondition}
                onChange={(e) => setReportCondition(e.target.value)}
                style={input}
                onFocus={() => onFieldFocus("reportCondition")}
                onBlur={onFieldBlur}
              >
                <option value="">Todas</option>
                {REPORT_CONDITION.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Categoría" hint="Opcional" active={focusKey === "reportCategory"}>
              <select
                value={reportCategory}
                onChange={(e) => setReportCategory(e.target.value)}
                style={input}
                onFocus={() => onFieldFocus("reportCategory")}
                onBlur={onFieldBlur}
              >
                <option value="">Todas</option>
                {REPORT_CATEGORY.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
          </>
        ) : null}
      </div>
    </div>
  );
}

/* estilos */
const card = {
  position: "relative",
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 16,
  padding: 14,
  background: "linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)",
  boxShadow: "0 12px 30px rgba(2,6,23,0.06)",
  overflow: "hidden",
};

const accentBar = {
  position: "absolute",
  left: 0,
  right: 0,
  top: 0,
  height: 6,
  background: "#334155",
};

const topRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
  flexWrap: "wrap",
};

const titleRow = { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" };
const panelTitle = { fontWeight: 1000, fontSize: 16, color: "#0f172a" };
const panelSub = { marginTop: 6, fontSize: 12, color: "#64748b", fontWeight: 850, lineHeight: 1.4 };

const pillOk = {
  background: "rgba(220,252,231,0.85)",
  color: "#166534",
  borderRadius: 999,
  padding: "4px 10px",
  fontSize: 12,
  fontWeight: 950,
  border: "1px solid rgba(34,197,94,0.28)",
};

const pillBusy = {
  background: "rgba(249,115,22,0.14)",
  color: "#7c2d12",
  borderRadius: 999,
  padding: "4px 10px",
  fontSize: 12,
  fontWeight: 950,
  border: "1px solid rgba(249,115,22,0.30)",
};

const grid = {
  marginTop: 14,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 12,
};

const ctlLabel = { fontSize: 12, fontWeight: 900, color: "#64748b" };

const input = {
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 12,
  padding: "10px 12px",
  fontWeight: 900,
  background: "rgba(255,255,255,0.9)",
  boxShadow: "0 8px 18px rgba(2,6,23,0.04)",
  outline: "none",
  cursor: "pointer",
};

const chip = {
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.9)",
  padding: "8px 10px",
  borderRadius: 999,
  fontWeight: 950,
  fontSize: 12,
  cursor: "pointer",
  boxShadow: "0 8px 18px rgba(2,6,23,0.04)",
};

const chipOn = {
  background: "rgba(249,115,22,0.14)",
  border: "1px solid rgba(249,115,22,0.35)",
  color: "#0f172a",
};

const btn = {
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(15,23,42,0.96)",
  color: "#fff",
  borderRadius: 12,
  padding: "10px 14px",
  cursor: "pointer",
  fontWeight: 950,
  boxShadow: "0 10px 22px rgba(2,6,23,0.12)",
  whiteSpace: "nowrap",
};

const fieldWrap = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  paddingBottom: 10,
};

const fieldTop = { display: "grid", gap: 4 };
const fieldLabelRow = { display: "inline-flex", alignItems: "center", gap: 8 };
const fieldIcon = { display: "inline-flex", alignItems: "center", opacity: 0.9 };
const fieldLabel = { fontSize: 12, fontWeight: 950, color: "#64748b" };
const fieldHint = { fontSize: 12, color: "#94a3b8", fontWeight: 850, lineHeight: 1.35 };
const fieldBody = { display: "grid", gap: 8 };

const underline = {
  height: 2,
  borderRadius: 999,
  background: "rgba(148,163,184,0.35)",
  transition: "background 160ms ease, transform 160ms ease",
  transform: "scaleX(0.65)",
  transformOrigin: "left",
};

const underlineOn = {
  background: "rgba(249,115,22,0.95)",
  transform: "scaleX(1)",
};

const fieldActive = {};