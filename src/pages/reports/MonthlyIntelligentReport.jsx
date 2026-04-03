// src/pages/reports/MonthlyIntelligentReport.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout";
import { useAuth } from "../../context/AuthContext";
import { usePlant } from "../../context/PlantContext";
import { getSettings } from "../../services/settingsService";


import { getDashboardSummary } from "../../services/dashboardService";
import useDashboardPredictiveAlerts from "../../hooks/useDashboardPredictiveAlerts";
import useDashboardPriorityQueue from "../../hooks/useDashboardPriorityQueue";

import { getAiSummary, refreshAiSummary } from "../../services/aiService";
import { Icon } from "../../components/ui/lpIcons";

// âœ… Recharts
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";

// âœ… Export PDF
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/* =========================
   HELPERS
========================= */

function ymNow() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function fmtDateTimeLocal(d) {
  if (!d) return "-";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleString("es-MX", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function safePct(num, den) {
  const a = Number(num || 0);
  const b = Number(den || 0);
  if (b <= 0) return 0;
  return Math.round((a / b) * 100);
}

function clamp(n, a, b) {
  const x = Number(n || 0);
  return Math.max(a, Math.min(b, x));
}

function monthLabel(ym) {
  if (!/^\d{4}-\d{2}$/.test(String(ym || ""))) return String(ym || "");
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, (m || 1) - 1, 1);
  return d.toLocaleString("es-MX", { month: "long", year: "numeric" });
}

function addMonths(ym, delta) {
  if (!/^\d{4}-\d{2}$/.test(String(ym || ""))) return ym;
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, (m - 1) + delta, 1);
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${yy}-${mm}`;
}

function riskTone(level) {
  const lvl = String(level || "").toUpperCase();
  if (lvl === "CRITICAL" || lvl === "HIGH") return "red";
  if (lvl === "MEDIUM" || lvl === "MED") return "amber";
  return "green";
}

function pqSeverityLabel(severity) {
  const s = String(severity || "").toUpperCase();
  if (s === "CRITICAL") return "Atención inmediata";
  if (s === "HIGH") return "Alta prioridad";
  if (s === "MED") return "Atender hoy";
  return "Seguimiento";
}

function pqTypeLabel(type) {
  const t = String(type || "").toUpperCase();
  if (t === "EXEC_OVERDUE") return "Actividad vencida";
  if (t === "EXEC_UNASSIGNED") return "Actividad sin técnico";
  if (t === "COND_REPORT") return "Condición reportada";
  if (t === "DAYS_TO_EMPTY") return "Inventario en riesgo";
  if (t === "CONSUMPTION_ANOMALY") return "Consumo fuera de patrón";
  return "Prioridad";
}

function pqOwnerLabel(owner) {
  const o = String(owner || "").toUpperCase();
  if (o === "ADMIN") return "Administrador";
  if (o === "SUPERVISOR") return "Supervisor";
  if (o === "TECHNICIAN") return "Técnico";
  return "Equipo";
}

function formatPriorityQueueItem(item) {
  const severity = String(item?.severity || "MED").toUpperCase();
  return {
    ...item,
    severity,
    title: item?.title || pqTypeLabel(item?.type),
    reason: item?.reason || "Sin detalle adicional.",
    actionLabel: item?.actionLabel || "Revisar y atender.",
    categoryLabel: item?.categoryLabel || pqTypeLabel(item?.type),
    priorityLabel: item?.priorityLabel || pqSeverityLabel(severity),
    ownerLabel: item?.ownerLabel || pqOwnerLabel(item?.suggestedOwner),
  };
}

function safeFilename(str) {
  return String(str || "")
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, " ")
    .slice(0, 120);
}

/* =========================
   UI
========================= */

function Chip({ children, tone = "gray" }) {
  const bg =
    tone === "red"
      ? "#fee2e2"
      : tone === "amber"
      ? "#fef3c7"
      : tone === "green"
      ? "#dcfce7"
      : "#f1f5f9";

  const fg =
    tone === "red"
      ? "#991b1b"
      : tone === "amber"
      ? "#92400e"
      : tone === "green"
      ? "#166534"
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
        fontWeight: 950,
        background: bg,
        color: fg,
        border: "1px solid rgba(0,0,0,0.06)",
        lineHeight: 1,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function Card({ title, subtitle, right, children }) {
  return (
    <div
      style={{
        border: "1px solid rgba(226,232,240,0.95)",
        borderRadius: 16,
        padding: 12,
        background: "#fff",
        boxShadow: "0 10px 22px rgba(2,6,23,0.04)",
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
          alignItems: "start",
          flexWrap: "wrap",
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          {title ? (
            <div
              style={{
                fontWeight: 1000,
                color: "#0f172a",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {title}
            </div>
          ) : null}
          {subtitle ? (
            <div
              style={{
                marginTop: 4,
                fontSize: 12,
                fontWeight: 850,
                color: "#64748b",
              }}
            >
              {subtitle}
            </div>
          ) : null}
        </div>
        {right ? <div style={{ flexShrink: 0 }}>{right}</div> : null}
      </div>

      <div style={{ marginTop: 10, minWidth: 0 }}>{children}</div>
    </div>
  );
}

function KPI({ label, value, hint, tone = "dark" }) {
  const color =
    tone === "red"
      ? "#991b1b"
      : tone === "amber"
      ? "#92400e"
      : tone === "blue"
      ? "#1d4ed8"
      : tone === "green"
      ? "#166534"
      : "#0f172a";

  return (
    <div
      style={{
        border: "1px solid rgba(226,232,240,0.95)",
        borderRadius: 16,
        padding: 12,
        background: "#fff",
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 950,
          color: "#64748b",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div style={{ marginTop: 8, fontSize: 28, fontWeight: 1000, color }}>
        {value}
      </div>
      <div
        style={{ marginTop: 6, fontSize: 12, fontWeight: 850, color: "#64748b" }}
      >
        {hint}
      </div>
    </div>
  );
}

/* =========================
   AI SUMMARY BOX
========================= */

function AiSummaryBox({ month, aiState, onGenerate, onRefresh, canForceRefresh = false }) {
  const loading = !!aiState?.loading;
  const err = aiState?.error;
  const data = aiState?.data;
  const summary = data?.summary;

  const cached = !!data?.cached;
  const model = data?.model;
  const generatedAt = data?.generatedAt ? fmtDateTimeLocal(data.generatedAt) : null;
  const isFallback = String(summary?.title || "").toLowerCase().includes("fallback");

  const highlights = Array.isArray(summary?.highlights) ? summary.highlights.slice(0, 4) : [];
  const recommendations = Array.isArray(summary?.recommendations)
    ? summary.recommendations.slice(0, 4)
    : [];
  const risks = Array.isArray(summary?.risks) ? summary.risks.slice(0, 4) : [];

  return (
    <div className="ai-summary-box" style={aiSummaryRoot}>
      <style>{`
        @keyframes lpAiSummaryReveal {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media print {
          @page {
            size: A4;
            margin: 14mm;
          }

          .ai-summary-box {
            background: #ffffff !important;
            border: 1px solid #dbe2ea !important;
            box-shadow: none !important;
            border-radius: 14px !important;
            overflow: visible !important;
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .ai-summary-toolbar {
            display: none !important;
          }

          .ai-summary-status {
            color: #475569 !important;
          }

          .ai-summary-screen-hero {
            background: #ffffff !important;
            border: 1px solid #dbe2ea !important;
            box-shadow: none !important;
            color: #0f172a !important;
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .ai-summary-screen-hero * {
            color: #0f172a !important;
          }

          .ai-summary-screen-chip {
            background: #f8fafc !important;
            border: 1px solid #dbe2ea !important;
            color: #0f172a !important;
          }

          .ai-summary-print-title {
            display: block !important;
          }

          .ai-summary-screen-title {
            font-family: Georgia, serif !important;
            font-size: 22px !important;
            line-height: 1.25 !important;
            color: #0f172a !important;
            max-width: 100% !important;
          }

          .ai-summary-grid {
            display: block !important;
          }

          .ai-summary-card {
            background: #ffffff !important;
            border: 1px solid #dbe2ea !important;
            box-shadow: none !important;
            break-inside: avoid;
            page-break-inside: avoid;
            margin-top: 12px !important;
          }

          .ai-summary-dark-card {
            background: #ffffff !important;
            border: 1px solid #dbe2ea !important;
            box-shadow: none !important;
          }

          .ai-summary-dark-card * {
            color: #0f172a !important;
          }

          .ai-summary-risk-card {
            background: #ffffff !important;
            border: 1px solid #dbe2ea !important;
            box-shadow: none !important;
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .ai-summary-risk-card * {
            color: #0f172a !important;
          }

          .ai-summary-risk-card .risk-level-badge {
            background: #f8fafc !important;
            border: 1px solid #cbd5e1 !important;
            color: #0f172a !important;
          }

          .ai-summary-section-title {
            color: #9a3412 !important;
          }

          .ai-summary-subtle {
            color: #475569 !important;
          }
        }
      `}</style>

      <div
        className="ai-summary-toolbar"
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontWeight: 1000,
              color: "#0f172a",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Icon name="search" size="sm" />
            Resumen inteligente
          </div>

          <div
            className="ai-summary-status"
            style={{ marginTop: 4, fontSize: 12, fontWeight: 850, color: "#64748b" }}
          >
            {loading
              ? "Generando resumen"
              : err
              ? "No se pudo generar el resumen IA."
              : summary
              ? `IA lista · ${cached ? "cache" : "nuevo"}${model ? ` · ${model}` : ""}${
                  generatedAt ? ` · ${generatedAt}` : ""
                }`
              : "Genera un resumen ejecutivo del mes."}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={onGenerate}
            disabled={loading}
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              fontWeight: 950,
              border: "1px solid rgba(0,0,0,0.08)",
              background: "#0f172a",
              color: "#fff",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Generando" : "Generar"}
          </button>

          {canForceRefresh ? (
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                fontWeight: 950,
                border: "1px solid rgba(0,0,0,0.08)",
                background: "#fff",
                cursor: loading ? "not-allowed" : "pointer",
              }}
              title="Forzar regeneración"
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <Icon name="refresh" size="sm" />
                Regenerar
              </span>
            </button>
          ) : null}
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        {loading ? (
          <div style={aiLoadingBox}>Preparando resumen para {month}...</div>
        ) : err ? (
          <div style={aiErrorBox}>{err}</div>
        ) : summary ? (
          <div
            style={{
              display: "grid",
              gap: 16,
              animation: "lpAiSummaryReveal 420ms ease",
            }}
          >
            <div className="ai-summary-print-title" style={printTitleBox}>
              <div style={printTitleMain}>Resumen inteligente del periodo</div>
              <div style={printTitleSub}>
                {summary.title || "Resumen ejecutivo"} · {month}
              </div>
            </div>

            <div className="ai-summary-screen-hero" style={heroBox}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div style={heroKicker}>Resumen inteligente del periodo</div>
                  <div style={{ marginTop: 6, fontSize: 12, fontWeight: 800, color: "#94a3b8" }}>
                    {summary.title || "Resumen ejecutivo"}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span className="ai-summary-screen-chip" style={heroChip(isFallback)}>
                    {isFallback ? "Fallback seguro" : "IA activa"}
                  </span>

                  {model ? (
                    <span className="ai-summary-screen-chip" style={heroModelChip}>
                      {model}
                    </span>
                  ) : null}
                </div>
              </div>

              <div style={heroInner}>
                <div style={heroDiagnosisKicker}>Diagnóstico ejecutivo</div>
                <div className="ai-summary-screen-title" style={heroTitle}>
                  {summary.executiveSummary || "Sin diagnóstico disponible para este periodo."}
                </div>
              </div>
            </div>

            <div className="ai-summary-grid" style={screenGrid}>
              {highlights.length > 0 ? (
                <div className="ai-summary-card" style={sectionCard}>
                  <div className="ai-summary-section-title" style={sectionTitle}>
                    Hallazgos clave
                  </div>

                  <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
                    {highlights.map((item, i) => (
                      <div className="ai-summary-dark-card" key={i} style={darkItemCard}>
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {recommendations.length > 0 ? (
                <div className="ai-summary-card" style={sectionCard}>
                  <div className="ai-summary-section-title" style={sectionTitle}>
                    Acciones recomendadas
                  </div>

                  <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
                    {recommendations.map((item, i) => (
                      <div className="ai-summary-dark-card" key={i} style={darkItemCard}>
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            {risks.length > 0 ? (
              <div className="ai-summary-card" style={sectionCard}>
                <div className="ai-summary-section-title" style={sectionTitle}>
                  Riesgos detectados
                </div>

                <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
                  {risks.map((r, i) => {
                    const lvl = String(r.level || "LOW").toUpperCase();
                    return (
                      <div key={i} className="ai-summary-risk-card" style={riskCard(lvl)}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 12,
                            alignItems: "flex-start",
                            flexWrap: "wrap",
                          }}
                        >
                          <div style={{ maxWidth: 980 }}>
                            <div
                              style={{
                                color: "#f8fafc",
                                fontSize: 16,
                                fontWeight: 950,
                                lineHeight: 1.3,
                              }}
                            >
                              {r.message || "Sin descripción disponible."}
                            </div>

                            <div
                              className="ai-summary-subtle"
                              style={{
                                marginTop: 10,
                                color: "#cbd5e1",
                                fontSize: 13,
                                fontWeight: 800,
                                lineHeight: 1.45,
                              }}
                            >
                              Acción sugerida:{" "}
                              <b style={{ color: "#f8fafc" }}>
                                {r.action || "Sin acción sugerida."}
                              </b>
                            </div>
                          </div>

                          <span className="risk-level-badge" style={riskBadge(lvl)}>
                            {lvl}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div style={aiLoadingBox}>
            No hay resumen todavía. Presiona <b style={{ color: "#fff" }}>Generar</b>.
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================
   CHARTS
========================= */

function ChartBox({ title, subtitle, right, children }) {
  return (
    <div
      style={{
        border: "1px solid rgba(226,232,240,0.95)",
        borderRadius: 16,
        padding: 12,
        background: "#fff",
        minWidth: 0,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
          alignItems: "start",
          flexWrap: "wrap",
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontWeight: 1000, color: "#0f172a" }}>{title}</div>
          {subtitle ? (
            <div
              style={{
                marginTop: 4,
                fontSize: 12,
                fontWeight: 850,
                color: "#64748b",
              }}
            >
              {subtitle}
            </div>
          ) : null}
        </div>
        {right ? <div style={{ flexShrink: 0 }}>{right}</div> : null}
      </div>

      <div
        style={{
          marginTop: 10,
          width: "100%",
          minWidth: 0,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function EmptyChart({ text }) {
  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        minWidth: 0,
        display: "grid",
        placeItems: "center",
        color: "#64748b",
        fontWeight: 850,
      }}
    >
      {text || "Sin datos"}
    </div>
  );
}

function StableChart({ height = 260, children }) {
  const wrapRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [box, setBox] = useState({ width: 0, height });

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      const w = Math.max(0, Math.floor(rect.width));
      const h = Math.max(0, Math.floor(rect.height || height));

      setBox({ width: w, height: h });
      setReady(w > 0 && h > 0);
    };

    updateSize();

    const ro = new ResizeObserver(() => {
      updateSize();
    });

    ro.observe(el);
    window.addEventListener("resize", updateSize);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateSize);
    };
  }, [height]);

  return (
    <div
      ref={wrapRef}
      style={{
        width: "100%",
        height,
        minWidth: 0,
        minHeight: height,
      }}
    >
      {ready ? children(box) : null}
    </div>
  );
}

/* =========================
   PDF EXPORT HELPERS
========================= */

async function captureSectionToCanvas(el, { scale = 2 } = {}) {
  if (!el) throw new Error("No se encontró la sección para exportar.");
  const canvas = await html2canvas(el, {
    scale,
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
    windowWidth: document.documentElement.scrollWidth,
  });
  return canvas;
}

function addCanvasToPdf(pdf, canvas, { margin = 10 } = {}) {
  const imgData = canvas.toDataURL("image/png", 1.0);

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const usableWidth = pageWidth - margin * 2;
  const usableHeight = pageHeight - margin * 2;

  const imgWidth = usableWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  if (imgHeight <= usableHeight) {
    pdf.addImage(imgData, "PNG", margin, margin, imgWidth, imgHeight, undefined, "FAST");
    return;
  }

  let y = 0;
  let page = 0;

  const pxPerMm = canvas.width / imgWidth;
  const pageHeightPx = usableHeight * pxPerMm;

  while (y < canvas.height) {
    if (page > 0) pdf.addPage();

    const sliceCanvas = document.createElement("canvas");
    sliceCanvas.width = canvas.width;
    sliceCanvas.height = Math.min(pageHeightPx, canvas.height - y);

    const ctx = sliceCanvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);

    ctx.drawImage(
      canvas,
      0,
      y,
      canvas.width,
      sliceCanvas.height,
      0,
      0,
      canvas.width,
      sliceCanvas.height
    );

    const sliceData = sliceCanvas.toDataURL("image/png", 1.0);
    const sliceHeightMm = (sliceCanvas.height * imgWidth) / sliceCanvas.width;

    pdf.addImage(sliceData, "PNG", margin, margin, imgWidth, sliceHeightMm, undefined, "FAST");

    y += sliceCanvas.height;
    page += 1;
  }
}

/* =========================
   MAIN PAGE
========================= */

export default function MonthlyIntelligentReport() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentPlantId, currentPlant } = usePlant();

 const [month, setMonth] = useState(ymNow());

const [loading, setLoading] = useState(true);
const [err, setErr] = useState("");
const [summary, setSummary] = useState(null);

const [trendLoading, setTrendLoading] = useState(false);
const [trendErr, setTrendErr] = useState("");
const [trend, setTrend] = useState([]);

const [appSettings, setAppSettings] = useState(null);
const [settingsLoading, setSettingsLoading] = useState(false);

const executiveRef = useRef(null);
const annexRef = useRef(null);

const [exporting, setExporting] = useState(false);
const [exportErr, setExportErr] = useState("");
const aiLoadedRef = useRef(false);
const aiCacheRef = useRef(new Map());
const aiInflightRef = useRef(new Map());

const [aiState, setAiState] = useState({
  loading: false,
  error: "",
  data: null,
});

const aiLang = "es";

  const load = useCallback(async () => {
    try {
      setErr("");
      setLoading(true);
      const res = await getDashboardSummary({ month });
      setSummary(res || null);
    } catch (e) {
      setErr(e?.message || "Error cargando reporte");
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [month]);

  const loadAppSettings = useCallback(async () => {
  if (!currentPlantId) return;

  try {
    setSettingsLoading(true);
    const res = await getSettings();
    const s = res?.settings ?? res ?? null;
    setAppSettings(s);
  } catch {
    setAppSettings(null);
  } finally {
    setSettingsLoading(false);
  }
}, [currentPlantId]);

  const predictiveEnabled = Boolean(appSettings?.predictiveAlertsEnabled ?? true);
const aiEnabled = Boolean(appSettings?.aiSummaryEnabled ?? true);
const priorityQueueEnabled = Boolean(appSettings?.priorityQueueEnabled ?? true);

const canSeePredictive = predictiveEnabled;
const canSeePriorityQueue = priorityQueueEnabled && predictiveEnabled;

const {
  alerts: predAlerts,
  total: predTotal,
  loading: predLoading,
  error: predError,
  refresh: refreshPred,
} = useDashboardPredictiveAlerts({
  month,
  enabled: canSeePredictive && !!currentPlantId,
});

const {
  loading: pqLoading,
  error: pqError,
  items: pqItems,
  total: pqTotal,
  refresh: refreshPQ,
} = useDashboardPriorityQueue({
  month,
  enabled: canSeePriorityQueue && !!currentPlantId,
});

useEffect(() => {
  load();
  loadAppSettings();
}, [load, loadAppSettings]);

  const loadAiSummary = useCallback(
  async ({ force = false } = {}) => {
    if (!currentPlantId) {
      setAiState({
        loading: false,
        error: "No hay planta seleccionada.",
        data: null,
      });
      return;
    }

    const cacheKey = `${currentPlantId}__${month}__${aiLang}`;

    if (!force && aiCacheRef.current.has(cacheKey)) {
      setAiState({
        loading: false,
        error: "",
        data: aiCacheRef.current.get(cacheKey),
      });
      return;
    }

    if (!force && aiInflightRef.current.has(cacheKey)) {
      setAiState((p) => ({ ...p, loading: true, error: "" }));
      try {
        const inflightData = await aiInflightRef.current.get(cacheKey);
        setAiState({ loading: false, error: "", data: inflightData });
      } catch (e) {
        setAiState({
          loading: false,
          error:
            e?.response?.data?.error ||
            e?.message ||
            "Error cargando resumen IA",
          data: null,
        });
      }
      return;
    }

    try {
      setAiState((p) => ({ ...p, loading: true, error: "" }));

      const promise = getAiSummary({
        period: month,
        plantId: currentPlantId,
        lang: aiLang,
      });

      aiInflightRef.current.set(cacheKey, promise);

      const res = await promise;

      aiCacheRef.current.set(cacheKey, res);
      aiInflightRef.current.delete(cacheKey);

      setAiState({
        loading: false,
        error: "",
        data: res,
      });
    } catch (e) {
      aiInflightRef.current.delete(cacheKey);

      setAiState({
        loading: false,
        error:
          e?.response?.data?.error ||
          e?.message ||
          "Error cargando resumen IA",
        data: null,
      });
    }
  },
  [currentPlantId, month, aiLang]
);
  const forceRefreshAi = useCallback(async () => {
  if (!currentPlantId) return;

  const cacheKey = `${currentPlantId}__${month}__${aiLang}`;
  aiCacheRef.current.delete(cacheKey);
  aiInflightRef.current.delete(cacheKey);

  try {
    setAiState((p) => ({ ...p, loading: true, error: "" }));
    await refreshAiSummary({
      period: month,
      plantId: currentPlantId,
      lang: aiLang,
    });

    await loadAiSummary({ force: true });
  } catch (e) {
    setAiState({
      loading: false,
      error:
        e?.response?.data?.error ||
        e?.message ||
        "Error regenerando resumen IA",
      data: null,
    });
  }
}, [currentPlantId, month, aiLang]);

  useEffect(() => {
  if (!currentPlantId) return;

  if (!aiEnabled) {
    setAiState({
      loading: false,
      error: "",
      data: null,
    });
    return;
  }

  loadAiSummary();
}, [currentPlantId, aiEnabled, loadAiSummary]);

useEffect(() => {
  aiLoadedRef.current = false;
}, [month]);

  const loadTrend = useCallback(async () => {
    try {
      setTrendErr("");
      setTrendLoading(true);

      const months = [
        addMonths(month, -5),
        addMonths(month, -4),
        addMonths(month, -3),
        addMonths(month, -2),
        addMonths(month, -1),
        month,
      ];

      const results = await Promise.all(
        months.map(async (m) => {
          try {
            const res = await getDashboardSummary({ month: m });
            const mt = res?.monthlyTotals || res?.activities || {};
            const c = Number(mt.completed || 0);
            const p = Number(mt.pending || 0);
            const o = Number(mt.overdue || 0);
            const t = Number(mt.total || (c + p + o) || 0);
            const comp = safePct(c, t);
            return {
              month: m,
              label: m,
              completed: c,
              pending: p,
              overdue: o,
              total: t,
              compliance: comp,
            };
          } catch {
            return {
              month: m,
              label: m,
              completed: 0,
              pending: 0,
              overdue: 0,
              total: 0,
              compliance: 0,
            };
          }
        })
      );

      setTrend(results);
    } catch (e) {
      setTrendErr(e?.message || "Error cargando tendencia");
      setTrend([]);
    } finally {
      setTrendLoading(false);
    }
  }, [month]);

  useEffect(() => {
    loadTrend();
  }, [loadTrend]);

  const kpis = useMemo(() => {
    const mt = summary?.monthlyTotals || summary?.activities || {};
    const alerts = summary?.alerts || {};

    const completed = Number(mt.completed || 0);
    const pending = Number(mt.pending || 0);
    const overdue = Number(mt.overdue || 0);
    const total = Number(mt.total || (completed + pending + overdue) || 0);

    const compliance = safePct(completed, total);

    const unassigned = Number(alerts?.unassignedPending || 0);
    const lowStock = Number(alerts?.lowStockCount || 0);

    const conditionOpen = Number(alerts?.conditionOpenCount || 0);
    const conditionInProgress = Number(alerts?.conditionInProgressCount || 0);

    const penalty = total > 0 ? Math.round((overdue / total) * 100) : 0;
    const opEfficiency = clamp(compliance - Math.round(penalty * 0.75), 0, 100);

    return {
      completed,
      pending,
      overdue,
      total,
      compliance,
      opEfficiency,
      unassigned,
      lowStock,
      conditionOpen,
      conditionInProgress,
    };
  }, [summary]);

  const donutData = useMemo(() => {
    return [
      { name: "Completadas", value: kpis.completed },
      { name: "Pendientes", value: kpis.pending },
      { name: "Atrasadas", value: kpis.overdue },
    ];
  }, [kpis.completed, kpis.pending, kpis.overdue]);

  const dteTop =
  canSeePredictive && Array.isArray(predAlerts?.lubricantDaysToEmptyTop)
    ? predAlerts.lubricantDaysToEmptyTop
    : [];

const anomaliesTop =
  canSeePredictive && Array.isArray(predAlerts?.equipmentConsumptionAnomaliesTop)
    ? predAlerts.equipmentConsumptionAnomaliesTop
    : [];

  const execRisks = useMemo(() => {
    if (!canSeePredictive) return [];

    const rows = [];

    if (Number(predAlerts?.riskPendingCount || 0) > 0) {
      rows.push({
        title: "Riesgo de atraso",
        msg: `${Number(predAlerts.riskPendingCount || 0)} actividades con señal de atraso en el mes.`,
        tone: Number(predAlerts?.riskOverdueCount || 0) > 0 ? "red" : "amber",
        action:
          Number(predAlerts?.riskOverdueCount || 0) > 0
            ? `${Number(predAlerts.riskOverdueCount || 0)} ya están vencidas.`
            : "Revisar carga y anticipar reasignaciones.",
      });
    }

    if (Number(predAlerts?.criticalUnassignedCount || 0) > 0) {
      rows.push({
        title: "Crí­ticas sin técnico",
        msg: `${Number(predAlerts.criticalUnassignedCount || 0)} actividades crí­ticas vencidas siguen sin asignación.`,
        tone: "red",
        action: "Asignar responsable inmediato y bloquear rezago.",
      });
    }

    if (Number(predAlerts?.repeatedFailuresCount || 0) > 0) {
      rows.push({
        title: "Reincidencia",
        msg: `${Number(predAlerts.repeatedFailuresCount || 0)} equipos muestran patrón repetido de fallas o malas condiciones.`,
        tone: "amber",
        action: "Atacar causa raí­z y revisar frecuencia/condición operativa.",
      });
    }

    if (dteTop.length > 0) {
      const x = dteTop[0];
      rows.push({
        title: "Days-to-empty",
        msg: `${x?.lubricantName || "Lubricante"} con riesgo de quedarse sin stock (~${Math.round(
          Number(x?.daysToEmpty || 0)
        )} dí­as).`,
        tone: String(x?.risk || "").toUpperCase() === "HIGH" ? "red" : "amber",
        action: x?.underMin ? "Ya está bajo mí­nimo. Reabastecer o transferir stock." : "Programar compra/traspaso inmediato.",
      });
    }

    if (anomaliesTop.length > 0) {
      const x = anomaliesTop[0];
      rows.push({
        title: "Anomalí­a de consumo",
        msg: `${x?.equipmentName || "Equipo"} con consumo anómalo (${String(x?.risk || "MED").toUpperCase()}).`,
        tone: String(x?.risk || "").toUpperCase() === "HIGH" ? "red" : "amber",
        action: "Revisar fugas, puntos, frecuencia y dosificación.",
      });
    }

    return rows.slice(0, 6);
  }, [canSeePredictive, predAlerts, dteTop, anomaliesTop]);

  const scrollTo = (ref) => {
    try {
      ref?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {}
  };

  const exportPdf = useCallback(async () => {
    try {
      setExportErr("");
      setExporting(true);

      const execEl = executiveRef.current;
      const annexEl = annexRef.current;

      if (!execEl) throw new Error("No se encontra sección ejecutiva.");
      if (!annexEl) throw new Error("No se encontra sección de anexos.");

      const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });

      const execCanvas = await captureSectionToCanvas(execEl, { scale: 2 });
      addCanvasToPdf(pdf, execCanvas, { margin: 10 });

      pdf.addPage();

      const annexCanvas = await captureSectionToCanvas(annexEl, { scale: 2 });
      addCanvasToPdf(pdf, annexCanvas, { margin: 10 });

      const file = safeFilename(`LubriPlan - Reporte inteligente mensual - ${month}.pdf`);
      pdf.save(file);
    } catch (e) {
      setExportErr(e?.message || "No se pudo exportar PDF");
    } finally {
      setExporting(false);
    }
  }, [month]);

  return (
    <MainLayout>
      <div style={{ padding: 16, minWidth: 0 }}>
        {/* HEADER */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 22, fontWeight: 1000, color: "#0f172a" }}>
              Reporte inteligente mensual
            </div>
            <div
              style={{
                marginTop: 4,
                fontSize: 12,
                fontWeight: 850,
                color: "#64748b",
              }}
            >
              {user?.name ? `Generado para: ${user.name}` : ""}
{currentPlant?.name ? ` · Planta: ${currentPlant.name}` : ""}
 Â· {monthLabel(month)} · última actualización: {fmtDateTimeLocal(summary?.updatedAt)}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 950, color: "#64748b" }}>Mes</span>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(0,0,0,0.12)",
                }}
              />
            </div>

            <button
              onClick={load}
              disabled={loading}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                fontWeight: 950,
                border: "1px solid rgba(0,0,0,0.08)",
                background: "#fff",
              }}
              type="button"
              title="Actualizar"
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <Icon name="refresh" size="sm" />
                {loading ? "Actualizando" : "Actualizar"}
              </span>
            </button>

            <button
              onClick={exportPdf}
              disabled={exporting || loading}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                fontWeight: 950,
                border: "1px solid rgba(0,0,0,0.08)",
                background: "#0f172a",
                color: "#fff",
                cursor: exporting ? "not-allowed" : "pointer",
                opacity: exporting ? 0.7 : 1,
              }}
              type="button"
              title="Exportar a PDF"
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <Icon name="export" size="sm" />
                {exporting ? "Exportando" : "Exportar PDF"}
              </span>
            </button>

            <button
              onClick={() => scrollTo(executiveRef)}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                fontWeight: 950,
                border: "1px solid rgba(0,0,0,0.08)",
                background: "#fff",
              }}
              type="button"
              title="Ir a resumen ejecutivo"
            >
              Ejecutivo 
            </button>

            <button
              onClick={() => scrollTo(annexRef)}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                fontWeight: 950,
                border: "1px solid rgba(0,0,0,0.08)",
                background: "#fff",
              }}
              type="button"
              title="Ir a anexos"
            >
              Anexos 
            </button>

            <button
              onClick={() => navigate("/dashboard")}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                fontWeight: 950,
                border: "1px solid rgba(0,0,0,0.08)",
                background: "#fff",
              }}
              type="button"
              title="Volver al dashboard"
            >
              Volver
            </button>
          </div>
        </div>

        {err ? (
          <div
            style={{
              marginTop: 12,
              padding: 12,
              borderRadius: 14,
              background: "#fee2e2",
              border: "1px solid rgba(0,0,0,0.06)",
              color: "#991b1b",
              fontWeight: 900,
            }}
          >
            {err}
          </div>
        ) : null}

        {exportErr ? (
          <div
            style={{
              marginTop: 12,
              padding: 12,
              borderRadius: 14,
              background: "#fff1f2",
              border: "1px solid #fecaca",
              color: "#991b1b",
              fontWeight: 900,
            }}
          >
            {exportErr}
          </div>
        ) : null}

        {/* =========================
            EJECUTIVO (1 â€œpÃ¡ginaâ€)
        ========================= */}
        <div ref={executiveRef} style={{ marginTop: 14, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "end",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                fontWeight: 1000,
                color: "#0f172a",
                fontSize: 14,
                letterSpacing: 0.4,
              }}
            >
              Resumen ejecutivo (1 página)
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Chip tone="gray">{monthLabel(month)}</Chip>
              <Chip
                tone={
                  kpis.compliance >= 85
                    ? "green"
                    : kpis.compliance >= 70
                    ? "amber"
                    : "red"
                }
              >
                Cumplimiento: {kpis.compliance}%
              </Chip>
              <Chip
                tone={
                  kpis.opEfficiency >= 80
                    ? "green"
                    : kpis.opEfficiency >= 65
                    ? "amber"
                    : "red"
                }
              >
                Eficiencia: {kpis.opEfficiency}%
              </Chip>
            </div>
          </div>

          <div
            style={{
              marginTop: 12,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 12,
            }}
          >
            <KPI
              label="Cumplimiento"
              value={`${kpis.compliance}%`}
              hint="Completadas / Total (mes)"
              tone={kpis.compliance >= 85 ? "green" : kpis.compliance >= 70 ? "amber" : "red"}
            />
            <KPI
              label="Eficiencia operativa"
              value={`${kpis.opEfficiency}%`}
              hint="Cumplimiento penalizado por atrasos"
              tone={kpis.opEfficiency >= 80 ? "green" : kpis.opEfficiency >= 65 ? "amber" : "red"}
            />
            <KPI label="Completadas" value={kpis.completed} hint="Ejecutadas en el mes" tone="blue" />
            <KPI label="Pendientes" value={kpis.pending} hint="Programadas futuras (mes)" tone="dark" />
            <KPI label="Atrasadas" value={kpis.overdue} hint="Pendientes con fecha vencida" tone="red" />
            <KPI
              label="Condición abierta"
              value={kpis.conditionOpen + kpis.conditionInProgress}
              hint="OPEN + IN_PROGRESS"
              tone="red"
            />
          </div>

          <div
            style={{
              marginTop: 12,
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 12,
              alignItems: "start",
            }}
          >
            <ChartBox
              title="Distribución de actividades"
              subtitle="Completadas vs pendientes vs atrasadas"
              right={<Chip tone="gray">Total: {kpis.total}</Chip>}
            >
              {kpis.total <= 0 ? (
                <EmptyChart text="Sin actividades para el mes" />
              ) : (
                <div style={{ width: "100%", height: "100%", minWidth: 0 }}>
                  <StableChart height={260}>
  {({ width, height }) => (
    <PieChart width={width} height={height}>
      <Pie
        data={donutData}
        dataKey="value"
        nameKey="name"
        innerRadius={62}
        outerRadius={90}
        paddingAngle={2}
        cx="50%"
        cy="50%"
      >
        <Cell fill="#22c55e" />
        <Cell fill="#f59e0b" />
        <Cell fill="#ef4444" />
      </Pie>
      <Tooltip />
      <Legend />
    </PieChart>
  )}
</StableChart>
                </div>
              )}
            </ChartBox>

            <ChartBox
              title="Backlog del mes"
              subtitle="Pendientes vs atrasadas"
              right={<Chip tone={kpis.overdue > 0 ? "red" : "green"}>{kpis.overdue > 0 ? "Atención" : "OK"}</Chip>}
            >
              <div style={{ width: "100%", height: "100%", minWidth: 0 }}>
                <StableChart height={260}>
  {({ width, height }) => (
    <BarChart
      width={width}
      height={height}
      data={[{ name: "Mes", pending: kpis.pending, overdue: kpis.overdue }]}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis allowDecimals={false} />
      <Tooltip />
      <Legend />
      <Bar dataKey="pending" name="Pendientes" fill="#f59e0b" />
      <Bar dataKey="overdue" name="Atrasadas" fill="#ef4444" />
    </BarChart>
  )}
</StableChart>
              </div>
            </ChartBox>
          </div>

          <div
  style={{
    marginTop: 12,
    display: "grid",
    gridTemplateColumns: aiEnabled
      ? "minmax(0, 1.25fr) minmax(0, 0.75fr)"
      : "1fr",
    gap: 12,
    alignItems: "start",
  }}
>
  {aiEnabled ? (
    <AiSummaryBox
      month={month}
      aiState={aiState}
      onGenerate={() => loadAiSummary({ force: true })}
      onRefresh={forceRefreshAi}
      canForceRefresh
    />
  ) : null}

            <Card
              title={
                <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                  <Icon name="alert" size="sm" />
                  Top riesgos
                </span>
              }
              subtitle={
  !canSeePredictive
    ? "Desactivado en ajustes"
    : predLoading
    ? "Calculandose"
    : predError
    ? "No disponible"
    : predTotal
    ? `Detectados: ${predTotal}`
    : "Sin señales relevantes"
}
             right={
  canSeePredictive ? (
    <button
      onClick={refreshPred}
      disabled={predLoading}
      type="button"
      style={{
        padding: "8px 10px",
        borderRadius: 12,
        fontWeight: 950,
        border: "1px solid rgba(0,0,0,0.08)",
        background: "#fff",
        cursor: predLoading ? "not-allowed" : "pointer",
        opacity: predLoading ? 0.7 : 1,
      }}
      title="Actualizar predictivas"
    >
      <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
        <Icon name="refresh" size="sm" />
        {predLoading ? "â€¦" : "Actualizar"}
      </span>
    </button>
  ) : null
}
            >
              {!canSeePredictive ? (
  <div style={{ fontSize: 12, fontWeight: 850, color: "#64748b" }}>
    Las alertas predictivas están desactivadas en Ajustes.
  </div>
) : predError ? (
  <div style={{ fontSize: 12, fontWeight: 900, color: "#991b1b" }}>{predError}</div>
) : (
                <div style={{ display: "grid", gap: 10 }}>
                  {execRisks.length === 0 ? (
                    <div style={{ fontSize: 12, fontWeight: 850, color: "#64748b" }}>
                      Todo estable. Sin riesgos destacados.
                    </div>
                  ) : (
                    execRisks.map((r, i) => (
                      <div
                        key={i}
                        style={{
                          border: "1px solid rgba(226,232,240,0.95)",
                          borderRadius: 14,
                          padding: 10,
                          background: "rgba(248,250,252,0.7)",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                          <div style={{ fontWeight: 950, color: "#0f172a" }}>{r.title}</div>
                          <Chip tone={r.tone}>{String(r.tone || "").toUpperCase()}</Chip>
                        </div>
                        <div
                          style={{
                            marginTop: 6,
                            fontSize: 12,
                            fontWeight: 850,
                            color: "#475569",
                          }}
                        >
                          {r.msg}
                        </div>
                        <div
                          style={{
                            marginTop: 6,
                            fontSize: 12,
                            fontWeight: 900,
                            color: "#0f172a",
                          }}
                        >
                          Acción:{" "}
                          <span style={{ fontWeight: 850, color: "#334155" }}>{r.action}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* =========================
            ANEXOS
        ========================= */}
        <div ref={annexRef} style={{ marginTop: 18, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 1000,
              color: "#0f172a",
              fontSize: 14,
              letterSpacing: 0.4,
            }}
          >
            Anexos (detalle)
          </div>

          <div style={{ marginTop: 12 }}>
            <ChartBox
              title="Tendencia (útimos 6 meses)"
              subtitle={trendLoading ? "Cargando" : trendErr ? "No disponible" : "Cumplimiento mensual"}
              right={trendLoading ? <Chip tone="gray">â€¦</Chip> : <Chip tone="gray">6 meses</Chip>}
            >
              {trendErr ? (
                <EmptyChart text={trendErr} />
              ) : trend.length === 0 ? (
                <EmptyChart text="Sin datos" />
              ) : (
                <div style={{ width: "100%", height: "100%", minWidth: 0 }}>
                 <StableChart height={260}>
  {({ width, height }) => (
    <LineChart
      width={width}
      height={height}
      data={trend.map((x) => ({ ...x, label: x.month }))}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="label" tickFormatter={(v) => String(v).slice(5)} />
      <YAxis domain={[0, 100]} />
      <Tooltip />
      <Legend />
      <Line
        type="monotone"
        dataKey="compliance"
        name="Cumplimiento (%)"
        dot={false}
        stroke="#1d4ed8"
      />
    </LineChart>
  )}
</StableChart>
                </div>
              )}
            </ChartBox>
          </div>

          <div
            style={{
              marginTop: 12,
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 12,
              alignItems: "start",
            }}
          >
            <ChartBox
              title="Actividades (detalle)"
              subtitle="Conteo por estatus (mes)"
            >
              <div style={{ width: "100%", height: "100%", minWidth: 0 }}>
               <StableChart height={260}>
  {({ width, height }) => (
    <BarChart
      width={width}
      height={height}
      data={[
        { name: "Completadas", value: kpis.completed },
        { name: "Pendientes", value: kpis.pending },
        { name: "Atrasadas", value: kpis.overdue },
      ]}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis allowDecimals={false} />
      <Tooltip />
      <Bar dataKey="value" name="Actividades" fill="#0f172a" />
    </BarChart>
  )}
</StableChart>
              </div>
            </ChartBox>

            <Card
              title={
                <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                  <Icon name="warn" size="sm" />
                  Prioridad de hoy (anexo)
                </span>
              }
              subtitle={
                !canSeePriorityQueue
                  ? "Desactivado en ajustes"
                  : pqLoading
                  ? "Calculando?"
                  : pqError
                  ? "No disponible"
                  : pqTotal > 0
                  ? `Casos que conviene atender primero: ${pqTotal}`
                  : "Sin pendientes prioritarios"
              }
              right={
                canSeePriorityQueue ? (
                  <button
                    onClick={refreshPQ}
                    disabled={pqLoading}
                    type="button"
                    style={{
                      padding: "8px 10px",
                      borderRadius: 12,
                      fontWeight: 950,
                      border: "1px solid rgba(0,0,0,0.08)",
                      background: "#fff",
                    }}
                    title="Actualizar prioridad"
                  >
                    <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                      <Icon name="refresh" size="sm" />
                      {pqLoading ? "?" : "Actualizar"}
                    </span>
                  </button>
                ) : null
              }
            >
              {!canSeePriorityQueue ? (
                <div style={{ fontSize: 12, fontWeight: 850, color: "#64748b" }}>
                  La cola de prioridad est? desactivada en Ajustes.
                </div>
              ) : pqError ? (
                <div style={{ fontSize: 12, fontWeight: 900, color: "#991b1b" }}>{pqError}</div>
              ) : (
                <div style={{ display: "grid", gap: 8 }}>
                  {(Array.isArray(pqItems) ? pqItems : []).slice(0, 10).map((raw, i) => {
                    const x = formatPriorityQueueItem(raw);
                    return (
                      <div
                        key={x?.key ?? i}
                        style={{
                          border: "1px solid rgba(226,232,240,0.95)",
                          borderRadius: 14,
                          padding: 10,
                          background: "rgba(248,250,252,0.7)",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                          <div style={{ fontWeight: 950, color: "#0f172a" }}>
                            {x?.title || "Acción prioritaria"}
                          </div>
                          <Chip tone={riskTone(x?.severity)}>{x?.priorityLabel || pqSeverityLabel(x?.severity)}</Chip>
                        </div>
                        <div style={{ marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <Chip tone="gray">{x?.categoryLabel || pqTypeLabel(x?.type)}</Chip>
                          <Chip tone="gray">Responsable: {x?.ownerLabel || "Equipo"}</Chip>
                        </div>
                        <div
                          style={{
                            marginTop: 6,
                            fontSize: 12,
                            fontWeight: 850,
                            color: "#64748b",
                          }}
                        >
                          {x?.reason || "Sin detalle adicional."}
                        </div>
                        <div
                          style={{
                            marginTop: 6,
                            fontSize: 12,
                            fontWeight: 950,
                            color: "#0f172a",
                          }}
                        >
                          Siguiente paso: <span style={{ fontWeight: 850, color: "#334155" }}>{x?.actionLabel || "Revisar y atender."}</span>
                        </div>
                      </div>
                    );
                  })}
                  {pqTotal === 0 ? (
                    <div style={{ fontSize: 12, fontWeight: 850, color: "#64748b" }}>
                      Todo bien. Nada urgente.
                    </div>
                  ) : null}
                </div>
              )}
            </Card>

          </div>
          <div
            style={{
              marginTop: 12,
              border: "1px dashed rgba(0,0,0,0.18)",
              borderRadius: 16,
              padding: 12,
              background: "rgba(255,255,255,0.65)",
            }}
          >
            <div style={{ fontWeight: 1000, color: "#0f172a" }}>Exportación</div>
            <div
              style={{
                marginTop: 6,
                fontSize: 12,
                fontWeight: 850,
                color: "#64748b",
              }}
            >
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

const aiSummaryRoot = {
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 16,
  padding: 12,
  background: "rgba(248,250,252,0.9)",
  minWidth: 0,
};

const aiLoadingBox = {
  borderRadius: 24,
  padding: "18px 20px",
  background: "linear-gradient(180deg, #171c2c 0%, #101522 100%)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#cbd5e1",
  fontSize: 13,
  fontWeight: 850,
};

const aiErrorBox = {
  borderRadius: 20,
  padding: "16px 18px",
  background: "linear-gradient(180deg, #2a1515 0%, #1b1010 100%)",
  border: "1px solid rgba(248,113,113,0.28)",
  color: "#fecaca",
  fontSize: 13,
  fontWeight: 900,
};

const printTitleBox = {
  display: "none",
  padding: "0 0 4px 0",
};

const printTitleMain = {
  fontSize: 18,
  fontWeight: 1000,
  color: "#0f172a",
};

const printTitleSub = {
  marginTop: 4,
  fontSize: 12,
  fontWeight: 700,
  color: "#475569",
};

const heroBox = {
  display: "grid",
  gap: 16,
  padding: 18,
  borderRadius: 28,
  background:
    "radial-gradient(circle at top left, rgba(249,115,22,0.14), transparent 28%), linear-gradient(180deg, #1a1f2f 0%, #0f1421 100%)",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 24px 60px rgba(15,23,42,0.28)",
};

const heroKicker = {
  fontSize: 12,
  fontWeight: 950,
  letterSpacing: 1,
  textTransform: "uppercase",
  color: "#fb923c",
};

const heroChip = (isFallback) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 12px",
  borderRadius: 999,
  background: isFallback ? "rgba(245,158,11,0.14)" : "rgba(34,197,94,0.14)",
  border: isFallback
    ? "1px solid rgba(245,158,11,0.28)"
    : "1px solid rgba(34,197,94,0.28)",
  color: isFallback ? "#fde68a" : "#bbf7d0",
  fontSize: 12,
  fontWeight: 950,
});

const heroModelChip = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 12px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#e2e8f0",
  fontSize: 12,
  fontWeight: 900,
};

const heroInner = {
  borderRadius: 24,
  padding: "24px 22px",
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.03) 100%)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const heroDiagnosisKicker = {
  fontSize: 12,
  fontWeight: 950,
  letterSpacing: 1,
  textTransform: "uppercase",
  color: "#fb923c",
};

const heroTitle = {
  marginTop: 12,
  fontFamily: '"DM Serif Display", Georgia, serif',
  fontSize: "clamp(28px, 3.2vw, 42px)",
  lineHeight: 1.04,
  color: "#f8fafc",
  maxWidth: 980,
};

const screenGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: 14,
};

const sectionCard = {
  borderRadius: 24,
  padding: 18,
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.03) 100%)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const sectionTitle = {
  fontSize: 12,
  fontWeight: 950,
  letterSpacing: 1,
  textTransform: "uppercase",
  color: "#fb923c",
};

const darkItemCard = {
  borderRadius: 18,
  padding: "14px 16px",
  background: "rgba(12,18,32,0.58)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#f8fafc",
  fontSize: 14,
  fontWeight: 850,
  lineHeight: 1.45,
};

const riskCard = (lvl) => {
  const isHigh = lvl === "CRITICAL" || lvl === "HIGH";
  const isMedium = lvl === "MEDIUM";

  return {
    borderRadius: 20,
    padding: "16px 18px",
    background: "rgba(12,18,32,0.62)",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: isHigh
      ? "inset 0 4px 0 rgba(239,68,68,0.85)"
      : isMedium
      ? "inset 0 4px 0 rgba(245,158,11,0.85)"
      : "inset 0 4px 0 rgba(59,130,246,0.75)",
  };
};

const riskBadge = (lvl) => {
  const isHigh = lvl === "CRITICAL" || lvl === "HIGH";
  const isMedium = lvl === "MEDIUM";

  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px 12px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 950,
    background: isHigh
      ? "rgba(239,68,68,0.14)"
      : isMedium
      ? "rgba(245,158,11,0.14)"
      : "rgba(59,130,246,0.14)",
    border: isHigh
      ? "1px solid rgba(239,68,68,0.28)"
      : isMedium
      ? "1px solid rgba(245,158,11,0.28)"
      : "1px solid rgba(59,130,246,0.28)",
    color: isHigh ? "#fecaca" : isMedium ? "#fde68a" : "#bfdbfe",
  };
};





