// src/pages/reports/MonthlyIntelligentReport.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout";
import { useAuth } from "../../context/AuthContext";
import { usePlant } from "../../context/PlantContext";
import { getSettings } from "../../services/settingsService";


import { getDashboardSummary } from "../../services/dashboardService";

import { getAiSummary, refreshAiSummary } from "../../services/aiService";
import { Icon } from "../../components/ui/lpIcons";

// Recharts
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

// Export PDF
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
  if (s === "CRITICAL") return "Atencion inmediata";
  if (s === "HIGH") return "Alta prioridad";
  if (s === "MED") return "Atender hoy";
  return "Seguimiento";
}

function pqTypeLabel(type) {
  const t = String(type || "").toUpperCase();
  if (t === "EXEC_OVERDUE") return "Actividad vencida";
  if (t === "EXEC_UNASSIGNED") return "Actividad sin tecnico";
  if (t === "COND_REPORT") return "Condicion reportada";
  if (t === "DAYS_TO_EMPTY") return "Inventario en riesgo";
  if (t === "CONSUMPTION_ANOMALY") return "Consumo fuera de patron";
  return "Prioridad";
}

function pqOwnerLabel(owner) {
  const o = String(owner || "").toUpperCase();
  if (o === "ADMIN") return "Administrador";
  if (o === "SUPERVISOR") return "Supervisor";
  if (o === "TECHNICIAN") return "Tecnico";
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
    .replace(/[\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, " ")
    .slice(0, 120);
}

function normalizeAiText(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim();
}

/* =========================
   UI
========================= */
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

      <div style={{ marginTop: 10, width: "100%", minWidth: 0 }}>{children}</div>
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
    const ro = new ResizeObserver(updateSize);
    ro.observe(el);
    window.addEventListener("resize", updateSize);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateSize);
    };
  }, [height]);

  return (
    <div ref={wrapRef} style={{ width: "100%", height, minWidth: 0, minHeight: height }}>
      {ready ? children(box) : null}
    </div>
  );
}
/* =========================
   AI SUMMARY BOX
========================= */

function AiSummaryBox({
  month,
  aiState,
  enabled,
  onGenerate,
  onRefresh,
  canForceRefresh = false,
  signals = [],
}) {
  const loading = !!aiState?.loading;
  const err = aiState?.error;
  const data = aiState?.data;
  const summary = data?.summary;

  const cached = !!data?.cached;
  const model = data?.model;
  const generatedAt = data?.generatedAt ? fmtDateTimeLocal(data.generatedAt) : null;
  const isFallback = String(summary?.title || "").toLowerCase().includes("fallback");

  const executiveSummary = normalizeAiText(
    summary?.executiveSummary || "Sin diagnostico disponible para este periodo."
  );
  const summaryTitle = normalizeAiText(summary?.title || "Lectura ejecutiva operativa");
  const highlights = Array.isArray(summary?.highlights)
    ? summary.highlights.map((item) => normalizeAiText(item)).filter(Boolean).slice(0, 2)
    : [];
  const recommendations = Array.isArray(summary?.recommendations)
    ? summary.recommendations.map((item) => normalizeAiText(item)).filter(Boolean).slice(0, 2)
    : [];
  const summarySignals = Array.isArray(signals) ? signals.filter(Boolean).slice(0, 3) : [];

  return (
    <div className="ai-summary-box" style={aiSummaryRoot}>
      <div
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

          <div style={{ marginTop: 4, fontSize: 12, fontWeight: 850, color: "#64748b" }}>
            {!enabled
              ? "IA desactivada para esta planta."
              : loading
              ? "Generando lectura ejecutiva"
              : err
              ? "No se pudo generar el resumen IA."
              : summary
              ? `IA lista | ${cached ? "cache" : "nuevo"}${model ? ` | ${model}` : ""}${
                  generatedAt ? ` | ${generatedAt}` : ""
                }`
              : "Genera un resumen ejecutivo corto del periodo."}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={summary ? onRefresh : onGenerate}
            disabled={loading || !enabled}
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              fontWeight: 950,
              border: "1px solid rgba(0,0,0,0.08)",
              background: "#0f172a",
              color: "#fff",
              cursor: loading || !enabled ? "not-allowed" : "pointer",
              opacity: loading || !enabled ? 0.6 : 1,
            }}
          >
            {loading ? "Actualizando" : summary ? "Actualizar" : "Generar"}
          </button>

          {canForceRefresh && summary ? (
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading || !enabled}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                fontWeight: 950,
                border: "1px solid rgba(0,0,0,0.08)",
                background: "#fff",
                cursor: loading || !enabled ? "not-allowed" : "pointer",
              }}
              title="Forzar regeneracion"
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
        {!enabled ? (
          <div style={aiLoadingBox}>La IA esta desactivada para esta planta.</div>
        ) : loading ? (
          <div style={aiLoadingBox}>Preparando lectura ejecutiva para {month}...</div>
        ) : err ? (
          <div style={aiErrorBox}>{err}</div>
        ) : summary ? (
          <div style={{ display: "grid", gap: 12 }}>
            <div style={heroBox}>
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
                  <div style={heroKicker}>Diagnostico ejecutivo</div>
                  <div style={{ marginTop: 6, fontSize: 12, fontWeight: 800, color: "#94a3b8" }}>
                    {summaryTitle}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span style={heroChip(isFallback)}>{isFallback ? "Fallback seguro" : "IA activa"}</span>
                  {model ? <span style={heroModelChip}>{model}</span> : null}
                </div>
              </div>

              <div style={heroSummary}>{executiveSummary}</div>

              {summarySignals.length ? (
                <div style={signalRow}>
                  {summarySignals.map((signal) => (
                    <div key={signal.label} style={signalCard}>
                      <div style={signalValue}>{signal.value}</div>
                      <div style={signalLabel}>{signal.label}</div>
                      {signal.note ? <div style={signalNote}>{signal.note}</div> : null}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              <div style={sectionCard}>
                <div style={sectionTitle}>Hallazgos clave</div>
                <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
                  {(highlights.length ? highlights : ["Sin hallazgos relevantes para este periodo."]).map((item, i) => (
                    <div key={`highlight-${i}`} style={compactRow}>
                      <div style={compactIndexOrange}>{i + 1}</div>
                      <div style={compactText}>{item}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={sectionCard}>
                <div style={sectionTitle}>Acciones recomendadas</div>
                <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
                  {(recommendations.length
                    ? recommendations
                    : ["Mantener disciplina de cierre y seguimiento del periodo."]).map((item, i) => (
                    <div key={`recommendation-${i}`} style={compactRow}>
                      <div style={compactIndexGreen}>{i + 1}</div>
                      <div style={compactText}>{item}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={aiLoadingBox}>
            No hay resumen todavia. Presiona <b style={{ color: "#fff" }}>Generar</b>.
          </div>
        )}
      </div>
    </div>
  );
}
async function captureSectionToCanvas(el, { scale = 2 } = {}) {
  if (!el) throw new Error("No se encontro la seccion para exportar.");
  const canvas = await html2canvas(el, {
    scale,
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
    windowWidth: document.documentElement.scrollWidth,
  });
  return canvas;
}

function addCanvasToPdf(pdf, canvas, state, { margin = 10, gap = 6 } = {}) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const usableWidth = pageWidth - margin * 2;
  const usableHeight = pageHeight - margin * 2;

  const imgWidth = usableWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  const currentY = Number(state?.y ?? margin);
  const availableHeight = pageHeight - currentY - margin;

  if (imgHeight <= usableHeight) {
    if (imgHeight > availableHeight && currentY > margin) {
      pdf.addPage();
      state.y = margin;
    }

    const y = Number(state?.y ?? margin);
    const imgData = canvas.toDataURL("image/png", 1.0);
    pdf.addImage(imgData, "PNG", margin, y, imgWidth, imgHeight, undefined, "FAST");
    state.y = y + imgHeight + gap;
    return;
  }

  if (currentY > margin) {
    pdf.addPage();
    state.y = margin;
  }

  let offsetY = 0;
  let page = 0;
  const pxPerMm = canvas.width / imgWidth;
  const pageHeightPx = usableHeight * pxPerMm;

  while (offsetY < canvas.height) {
    if (page > 0) {
      pdf.addPage();
      state.y = margin;
    }

    const sliceCanvas = document.createElement("canvas");
    sliceCanvas.width = canvas.width;
    sliceCanvas.height = Math.min(pageHeightPx, canvas.height - offsetY);

    const ctx = sliceCanvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
    ctx.drawImage(
      canvas,
      0,
      offsetY,
      canvas.width,
      sliceCanvas.height,
      0,
      0,
      canvas.width,
      sliceCanvas.height
    );

    const sliceData = sliceCanvas.toDataURL("image/png", 1.0);
    const sliceHeightMm = (sliceCanvas.height * imgWidth) / sliceCanvas.width;
    pdf.addImage(sliceData, "PNG", margin, state.y, imgWidth, sliceHeightMm, undefined, "FAST");

    offsetY += sliceCanvas.height;
    page += 1;
    state.y = margin + sliceHeightMm + gap;
  }
}

function getExportBlocks(root) {
  if (!root) return [];
  const blocks = Array.from(root.children || []).filter(
    (node) => node && node.nodeType === 1 && node.getBoundingClientRect().height > 0
  );
  return blocks.length > 0 ? blocks : [root];
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

const aiEnabled = Boolean(appSettings?.aiSummaryEnabled ?? true);

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

  const conditionMetrics = useMemo(() => {
    const reports =
      summary?.activities?.conditionReports ||
      summary?.monthlyTotals?.conditionReports ||
      {};

    const open = Number(reports.OPEN || 0);
    const inProgress = Number(reports.IN_PROGRESS || 0);
    const resolved = Number(reports.RESOLVED || 0);
    const dismissed = Number(reports.DISMISSED || 0);
    const reported = open + inProgress + resolved + dismissed;
    const attended = inProgress + resolved + dismissed;
    const active = open + inProgress;

    return {
      open,
      inProgress,
      resolved,
      dismissed,
      reported,
      attended,
      active,
      statusData: [
        { name: "Abiertas", value: open, fill: "#ef4444" },
        { name: "En progreso", value: inProgress, fill: "#f59e0b" },
        { name: "Resueltas", value: resolved, fill: "#22c55e" },
        { name: "Descartadas", value: dismissed, fill: "#94a3b8" },
      ],
      attentionData: [
        { name: "Atendidas", value: attended, fill: "#16a34a" },
        { name: "Sin intervencion", value: Math.max(reported - attended, 0), fill: "#ef4444" },
      ],
    };
  }, [summary]);

  const aiSignals = useMemo(
    () => [
      {
        label: "Cumplimiento",
        value: `${kpis.compliance}%`,
        note: "Cierre mensual del plan",
      },
      {
        label: "Atrasadas",
        value: kpis.overdue,
        note: "Pendientes con fecha vencida",
      },
      {
        label: "Condiciones activas",
        value: conditionMetrics.active,
        note: "Abiertas y en progreso",
      },
    ],
    [conditionMetrics.active, kpis.compliance, kpis.overdue]
  );

  const donutData = useMemo(() => {
    return [
      { name: "Completadas", value: kpis.completed },
      { name: "Pendientes", value: kpis.pending },
      { name: "Atrasadas", value: kpis.overdue },
    ];
  }, [kpis.completed, kpis.pending, kpis.overdue]);

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
    if (!execEl) throw new Error("No se encontro la seccion ejecutiva.");
    if (!annexEl) throw new Error("No se encontro la seccion de anexos.");

    const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
    const blocks = [...getExportBlocks(execEl), ...getExportBlocks(annexEl)];
    const flow = { y: 10 };

    for (const block of blocks) {
      const canvas = await captureSectionToCanvas(block, { scale: 2 });
      addCanvasToPdf(pdf, canvas, flow, { margin: 10, gap: 6 });
    }

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
          <div style={{ marginTop: 4, fontSize: 12, fontWeight: 850, color: "#64748b" }}>
            {user?.name ? `Generado para: ${user.name}` : ""}
            {currentPlant?.name ? ` - Planta: ${currentPlant.name}` : ""}
            {` - ${monthLabel(month)} - ultima actualizacion: ${fmtDateTimeLocal(summary?.updatedAt)}`}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
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

          <button onClick={load} disabled={loading} style={toolbarButton} type="button" title="Actualizar">
            <span style={toolbarButtonInner}>
              <Icon name="refresh" size="sm" />
              {loading ? "Actualizando" : "Actualizar"}
            </span>
          </button>

          <button
            onClick={exportPdf}
            disabled={exporting || loading}
            style={{ ...toolbarButtonDark, opacity: exporting ? 0.7 : 1 }}
            type="button"
            title="Exportar a PDF"
          >
            <span style={toolbarButtonInner}>
              <Icon name="export" size="sm" />
              {exporting ? "Exportando" : "Exportar PDF"}
            </span>
          </button>

          <button onClick={() => scrollTo(executiveRef)} style={toolbarButton} type="button">
            Ejecutivo
          </button>

          <button onClick={() => scrollTo(annexRef)} style={toolbarButton} type="button">
            Anexos
          </button>

          <button onClick={() => navigate("/dashboard")} style={toolbarButton} type="button">
            Volver
          </button>
        </div>
      </div>

      {err ? <div style={errorBox}>{err}</div> : null}
      {exportErr ? <div style={exportErrorBox}>{exportErr}</div> : null}

      <div ref={executiveRef} style={{ marginTop: 14, minWidth: 0, display: "grid", gap: 12 }}>
        <div style={sectionHeaderRow}>
          <div style={sectionHeaderTitle}>Resumen ejecutivo</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Chip tone="gray">{monthLabel(month)}</Chip>
            <Chip tone={kpis.compliance >= 85 ? "green" : kpis.compliance >= 70 ? "amber" : "red"}>
              Cumplimiento: {kpis.compliance}%
            </Chip>
            <Chip tone={kpis.opEfficiency >= 80 ? "green" : kpis.opEfficiency >= 65 ? "amber" : "red"}>
              Eficiencia: {kpis.opEfficiency}%
            </Chip>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
          }}
        >
          <KPI
            label="Cumplimiento"
            value={`${kpis.compliance}%`}
            hint="Completadas / Total del mes"
            tone={kpis.compliance >= 85 ? "green" : kpis.compliance >= 70 ? "amber" : "red"}
          />
          <KPI
            label="Eficiencia operativa"
            value={`${kpis.opEfficiency}%`}
            hint="Cumplimiento penalizado por atrasos"
            tone={kpis.opEfficiency >= 80 ? "green" : kpis.opEfficiency >= 65 ? "amber" : "red"}
          />
          <KPI label="Completadas" value={kpis.completed} hint="Ejecutadas en el mes" tone="blue" />
          <KPI label="Pendientes" value={kpis.pending} hint="Programadas futuras" tone="dark" />
          <KPI label="Atrasadas" value={kpis.overdue} hint="Pendientes con fecha vencida" tone="red" />
          <KPI
            label="Condiciones activas"
            value={kpis.conditionOpen + kpis.conditionInProgress}
            hint="OPEN + IN_PROGRESS"
            tone="red"
          />
        </div>

        <AiSummaryBox
          month={month}
          aiState={aiState}
          enabled={aiEnabled}
          onGenerate={() => loadAiSummary({ force: true })}
          onRefresh={forceRefreshAi}
          canForceRefresh
          signals={aiSignals}
        />

        <ChartBox title="Actividades del periodo" subtitle="Conteo por estatus del mes">
          <div style={{ width: "100%", height: "100%", minWidth: 0 }}>
            <StableChart height={240}>
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
      </div>

      <div ref={annexRef} style={{ marginTop: 14, minWidth: 0, display: "grid", gap: 12 }}>
        <div style={sectionHeaderRow}>
          <div style={sectionHeaderTitle}>Anexos operativos</div>
          <div style={{ fontSize: 12, fontWeight: 850, color: "#64748b" }}>
            Graficas complementarias del periodo
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 12,
          }}
        >
          <ChartBox title="Distribucion del mes" subtitle="Completadas, pendientes y atrasadas">
            <StableChart height={260}>
              {({ width, height }) => {
                const total = donutData.reduce((acc, item) => acc + Number(item.value || 0), 0);
                const donutColors = ["#22c55e", "#3b82f6", "#ef4444"];
                if (!total) return <EmptyChart text="Sin actividades registradas en el periodo" />;
                return (
                  <PieChart width={width} height={height}>
                    <Pie
                      data={donutData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={92}
                      paddingAngle={4}
                    >
                      {donutData.map((entry, index) => (
                        <Cell key={entry.name} fill={donutColors[index] || "#94a3b8"} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                );
              }}
            </StableChart>
          </ChartBox>

          <ChartBox title="Tendencia de cumplimiento" subtitle="Seguimiento de los ultimos 6 meses">
            <StableChart height={260}>
              {({ width, height }) => {
                if (trendLoading) return <EmptyChart text="Cargando tendencia..." />;
                if (trendErr) return <EmptyChart text={trendErr} />;
                return (
                  <LineChart width={width} height={height} data={trend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis allowDecimals={false} domain={[0, 100]} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="compliance"
                      name="Cumplimiento %"
                      stroke="#f97316"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                );
              }}
            </StableChart>
          </ChartBox>

          <ChartBox
            title="Condiciones reportadas"
            subtitle={`Total del periodo: ${conditionMetrics.reported}`}
            right={<Chip tone={conditionMetrics.reported > 0 ? "amber" : "gray"}>{conditionMetrics.reported}</Chip>}
          >
            <StableChart height={260}>
              {({ width, height }) => {
                const total = conditionMetrics.statusData.reduce((acc, item) => acc + Number(item.value || 0), 0);
                if (!total) return <EmptyChart text="Sin condiciones registradas en el periodo" />;
                return (
                  <BarChart width={width} height={height} data={conditionMetrics.statusData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" name="Condiciones">
                      {conditionMetrics.statusData.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                );
              }}
            </StableChart>
          </ChartBox>

          <ChartBox
            title="Condiciones atendidas"
            subtitle={`Atendidas: ${conditionMetrics.attended} | Sin intervencion: ${Math.max(
              conditionMetrics.reported - conditionMetrics.attended,
              0
            )}`}
            right={<Chip tone={conditionMetrics.attended > 0 ? "green" : "gray"}>{conditionMetrics.attended}</Chip>}
          >
            <StableChart height={260}>
              {({ width, height }) => {
                const total = conditionMetrics.attentionData.reduce((acc, item) => acc + Number(item.value || 0), 0);
                if (!total) return <EmptyChart text="Sin atencion registrada en el periodo" />;
                return (
                  <PieChart width={width} height={height}>
                    <Pie
                      data={conditionMetrics.attentionData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={58}
                      outerRadius={92}
                      paddingAngle={4}
                    >
                      {conditionMetrics.attentionData.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                );
              }}
            </StableChart>
          </ChartBox>
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

const toolbarButton = {
  padding: "10px 12px",
  borderRadius: 12,
  fontWeight: 950,
  border: "1px solid rgba(0,0,0,0.08)",
  background: "#fff",
};

const toolbarButtonDark = {
  ...toolbarButton,
  background: "#0f172a",
  color: "#fff",
};

const toolbarButtonInner = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
};

const errorBox = {
  marginTop: 12,
  padding: 12,
  borderRadius: 14,
  background: "#fee2e2",
  border: "1px solid rgba(0,0,0,0.06)",
  color: "#991b1b",
  fontWeight: 900,
};

const exportErrorBox = {
  marginTop: 12,
  padding: 12,
  borderRadius: 14,
  background: "#fff1f2",
  border: "1px solid #fecaca",
  color: "#991b1b",
  fontWeight: 900,
};

const sectionHeaderRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "end",
  gap: 10,
  flexWrap: "wrap",
};

const sectionHeaderTitle = {
  fontWeight: 1000,
  color: "#0f172a",
  fontSize: 14,
  letterSpacing: 0.4,
};

const aiLoadingBox = {
  borderRadius: 18,
  padding: "16px 18px",
  background: "linear-gradient(180deg, #171c2c 0%, #101522 100%)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#cbd5e1",
  fontSize: 13,
  fontWeight: 850,
};

const aiErrorBox = {
  borderRadius: 18,
  padding: "16px 18px",
  background: "linear-gradient(180deg, #2a1515 0%, #1b1010 100%)",
  border: "1px solid rgba(248,113,113,0.28)",
  color: "#fecaca",
  fontSize: 13,
  fontWeight: 900,
};

const heroBox = {
  display: "grid",
  gap: 14,
  padding: 16,
  borderRadius: 24,
  background:
    "radial-gradient(circle at top left, rgba(249,115,22,0.14), transparent 28%), linear-gradient(180deg, #1a1f2f 0%, #0f1421 100%)",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 24px 60px rgba(15,23,42,0.20)",
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
  padding: "7px 11px",
  borderRadius: 999,
  background: isFallback ? "rgba(245,158,11,0.14)" : "rgba(34,197,94,0.14)",
  border: isFallback ? "1px solid rgba(245,158,11,0.28)" : "1px solid rgba(34,197,94,0.28)",
  color: isFallback ? "#fde68a" : "#bbf7d0",
  fontSize: 12,
  fontWeight: 950,
});

const heroModelChip = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "7px 11px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#e2e8f0",
  fontSize: 12,
  fontWeight: 900,
};

const heroSummary = {
  fontSize: 17,
  lineHeight: 1.5,
  fontWeight: 900,
  color: "#f8fafc",
};

const signalRow = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: 10,
};

const signalCard = {
  borderRadius: 16,
  padding: 12,
  background: "rgba(12,18,32,0.52)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const signalValue = {
  fontSize: 24,
  fontWeight: 1000,
  color: "#f8fafc",
  lineHeight: 1,
};

const signalLabel = {
  marginTop: 6,
  fontSize: 12,
  fontWeight: 950,
  color: "#fdba74",
  textTransform: "uppercase",
  letterSpacing: 0.4,
};

const signalNote = {
  marginTop: 4,
  fontSize: 12,
  fontWeight: 800,
  color: "#cbd5e1",
  lineHeight: 1.45,
};

const sectionCard = {
  borderRadius: 20,
  padding: 14,
  background: "#ffffff",
  border: "1px solid rgba(226,232,240,0.95)",
};

const sectionTitle = {
  fontSize: 12,
  fontWeight: 950,
  letterSpacing: 1,
  textTransform: "uppercase",
  color: "#fb923c",
};

const compactRow = {
  display: "grid",
  gridTemplateColumns: "28px minmax(0, 1fr)",
  gap: 10,
  alignItems: "start",
  padding: 10,
  borderRadius: 14,
  background: "#f8fafc",
  border: "1px solid rgba(226,232,240,0.95)",
};

const compactIndexOrange = {
  width: 28,
  height: 28,
  borderRadius: 999,
  display: "grid",
  placeItems: "center",
  background: "rgba(249,115,22,0.14)",
  color: "#f97316",
  fontWeight: 1000,
  fontSize: 12,
};

const compactIndexGreen = {
  width: 28,
  height: 28,
  borderRadius: 999,
  display: "grid",
  placeItems: "center",
  background: "rgba(34,197,94,0.14)",
  color: "#16a34a",
  fontWeight: 1000,
  fontSize: 12,
};

const compactText = {
  color: "#0f172a",
  fontSize: 13,
  lineHeight: 1.5,
  fontWeight: 850,
};
