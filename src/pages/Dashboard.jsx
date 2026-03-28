// src/pages/Dashboard.jsx
import { Link, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import { ActivityCard, toLocalYMD, diffDaysLocal } from "./ActivitiesPage";
import ActivitiesDonut from "../components/dashboard/ActivitiesDonut";
import { Icon } from "../components/ui/lpIcons";
import { useAuth } from "../context/AuthContext";
import { usePlant } from "../context/PlantContext";
import { getExecutions } from "../services/executionsService";
import { getSettings } from "../services/settingsService";



import {
  getDashboardSummary,
  getDashboardMonthlyActivities,
  getDashboardMonthlyActivitiesMe,
  getDashboardAdminCounts,
} from "../services/dashboardService";

import useDashboardAlerts from "../hooks/useDashboardAlerts";
import useDashboardPredictiveAlerts from "../hooks/useDashboardPredictiveAlerts";
import useRealtimeAlerts from "../hooks/useRealtimeAlerts";
import useDashboardPriorityQueue from "../hooks/useDashboardPriorityQueue.js";

import { getTechnicianOverload } from "../services/equipmentService";
import { getTechniciansEfficiencyMonthly } from "../services/dashboardTechniciansService";

import TechniciansEfficiencyCard from "../components/dashboard/TechniciansEfficiencyCard";

import { getAiSummary, refreshAiSummary } from "../services/aiService";

import CompleteExecutionModal from "../pages/CompleteExecutionModal";
import ScheduleActivityModal from "../components/activities/ScheduleActivityModal";
import EmergencyActivityModal from "../components/activities/EmergencyActivityModal";
import ReportConditionModal from "../components/activities/ReportConditionModal";

// ï¿½S& si tú ya usas btnPrimary / btnGhost en otros lados, déjalo.
// (Aquí mantenemos btnPrimary/btnGhost para compatibilidad con tu DashTop/otros)
import { btnPrimary, btnGhost } from "../components/ui/styles";

/* ================= HELPERS ================= */

function fmtDateTimeLocal(d) {
  if (!d) return "—";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleString("es-MX", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function priorityTypeLabel(type) {
  const t = String(type || "").toUpperCase();
  const map = {
    OVERDUE: "Actividad vencida",
    OVERDUE_ACTIVITY: "Actividad vencida",
    EXEC_OVERDUE: "Actividad vencida",
    UNASSIGNED_PENDING: "Actividad sin técnico",
    EXEC_UNASSIGNED: "Actividad sin técnico",
    RISK_LATE: "Riesgo de atraso",
    CRITICAL_RISK_OVERDUE: "Crítica vencida",
    REPEATED_FAILURES: "Reincidencia",
    CONDITION_REPORTS_OPEN: "Condición anormal",
    CONDITION_REPORT_OPEN: "Condición anormal",
    COND_REPORT: "Condición reportada",
    LOW_STOCK: "Bajo stock",
    DAYS_TO_EMPTY: "Inventario en riesgo",
    CONSUMPTION_ANOMALY: "Consumo fuera de patrón",
    EQUIPMENT_WITHOUT_ROUTES: "Sin rutas",
    TECHNICIAN_OVERLOAD: "Sobrecarga",
  };
  return map[t] || t || "Prioridad";
}

function prioritySeverityLabel(severity) {
  const s = String(severity || "").toUpperCase();
  if (s === "CRITICAL") return "Atención inmediata";
  if (s === "HIGH") return "Alta prioridad";
  if (s === "MED") return "Atender hoy";
  return "Seguimiento";
}

function priorityOwnerLabel(owner) {
  const o = String(owner || "").toUpperCase();
  if (o === "ADMIN") return "Administrador";
  if (o === "SUPERVISOR") return "Supervisor";
  if (o === "TECHNICIAN") return "Técnico";
  return "Equipo";
}

function priorityStripeColor(severity) {
  const s = String(severity || "").toUpperCase();
  return s === "CRITICAL" || s === "HIGH" ? "#dc2626" : "#f59e0b";
}

function parsePriorityPresentation(item) {
  const type = String(item?.type || "").toUpperCase();
  const rawTitle = String(item?.title || priorityTypeLabel(type) || "Prioridad");
  const rawReason = String(item?.reason || "Sin detalle adicional.");

  if (type === "CONSUMPTION_ANOMALY" || type === "ANOMALIES") {
    const match = rawReason.match(/^(.*?)\s*·\s*Ratio:\s*([\d.]+)\s*·\s*Base:\s*([\d.]+)\s*·\s*Últ\.?14:\s*([\d.]+)/i);
    if (match) {
      const equipment = String(match[1] || "Equipo").trim();
      const baseline = match[3];
      const recent = match[4];
      return {
        title: "Consumo fuera de patrón",
        reason: `${equipment}: el consumo reciente está por encima de lo normal y requiere revisión prioritaria.`,
        metaBadges: [`Consumo reciente: ${recent}`, `Consumo habitual: ${baseline}`],
      };
    }
    return {
      title: "Consumo fuera de patrón",
      reason: "El consumo reciente del equipo se salió del comportamiento habitual.",
      metaBadges: [],
    };
  }

  if (type === "REPEATED_FAILURES") {
    return {
      title: "Falla repetida en condición crítica",
      reason: rawReason
        .replace(/^Eventos:/i, "Eventos repetidos:")
        .replace(/CRÍTICOS:/i, "casos críticos:")
        .replace(/REPEATED_FAILURE/gi, "Reincidencia")
        .trim(),
      metaBadges: [],
    };
  }

  if (type === "DAYS_TO_EMPTY" || type === "PREDICTIVE_DTE") {
    return {
      title: "Inventario en riesgo",
      reason: rawReason.replace(/DTE:/i, "Días estimados restantes:").trim(),
      metaBadges: [],
    };
  }

  return {
    title: rawTitle.replace(/\((HIGH|CRITICAL|MED|LOW)\)/gi, "").trim(),
    reason: rawReason,
    metaBadges: [],
  };
}

function formatPriorityItem(item, month) {
  const type = String(item?.type || "").toUpperCase();
  const severity = String(item?.severity || "MED").toUpperCase();
  const score = Number(item?.score || 0);
  const presentation = parsePriorityPresentation(item);
  return {
    ...item,
    type,
    severity,
    score,
    link: buildPriorityLink(item, month),
    categoryLabel: item?.categoryLabel || priorityTypeLabel(type),
    priorityLabel: item?.priorityLabel || prioritySeverityLabel(severity),
    ownerLabel: item?.ownerLabel || priorityOwnerLabel(item?.suggestedOwner),
    title: presentation.title,
    reason: presentation.reason,
    metaBadges: presentation.metaBadges,
    actionLabel: item?.actionLabel || "Revisar y atender.",
    stripeColor: priorityStripeColor(severity),
  };
}
function buildPriorityLink(item, month) {
  const m = encodeURIComponent(month || "");
  const type = String(item?.type || "").toUpperCase();

  const eq = item?.equipmentId != null ? encodeURIComponent(String(item.equipmentId)) : "";
  const lub = item?.lubricantId != null ? encodeURIComponent(String(item.lubricantId)) : "";
  const tech = item?.technicianId != null ? encodeURIComponent(String(item.technicianId)) : "";
  const act = item?.activityId != null ? encodeURIComponent(String(item.activityId)) : "";
  const exec = item?.executionId != null ? encodeURIComponent(String(item.executionId)) : "";

  if (item?.link && typeof item.link === "string") {
    if (item.link.includes("month=")) return item.link;
    return item.link.includes("?") ? `${item.link}&month=${m}` : `${item.link}?month=${m}`;
  }

  switch (type) {
    case "OVERDUE":
    case "OVERDUE_ACTIVITY":
      return `/activities?status=OVERDUE&month=${m}`;

    case "UNASSIGNED":
    case "UNASSIGNED_PENDING":
      return `/activities?filter=unassigned&month=${m}`;

    case "RISK_LATE":
    case "RISK_PENDING":
      return `/activities?filter=risk-late&month=${m}`;

    case "CRITICAL_RISK_OVERDUE":
      return `/activities?status=OVERDUE&filter=critical-risk&month=${m}`;

    case "BAD_CONDITION":
    case "REPEATED_FAILURES":
      return `/activities?filter=bad-condition&month=${m}`;

    case "CONDITION_REPORT_OPEN":
    case "CONDITION_REPORTS_OPEN":
      return `/condition-reports?status=OPEN`;

    case "LOW_STOCK":
      return `/inventory?filter=low&month=${m}`;

    case "PREDICTIVE_DTE":
    case "DAYS_TO_EMPTY":
      return lub
        ? `/inventory?filter=predictive-dte&month=${m}&lubricantId=${lub}`
        : `/inventory?filter=predictive-dte&month=${m}`;

    case "CONSUMPTION_ANOMALY":
    case "ANOMALIES":
      return eq
        ? `/analysis?tab=consumption&filter=anomalies&month=${m}&equipmentId=${eq}`
        : `/analysis?tab=consumption&filter=anomalies&month=${m}`;

    case "EQUIPMENT_WITHOUT_ROUTES":
      return `/equipments?filter=without-routes&month=${m}`;

    case "TECHNICIAN_OVERLOAD":
      return tech ? `/activities?technicianId=${tech}&month=${m}` : `/activities?month=${m}`;

    case "ACTIVITY":
      return act ? `/activities?month=${m}&activityId=${act}` : `/activities?month=${m}`;

    case "EXECUTION":
      return exec ? `/activities?month=${m}&executionId=${exec}` : `/activities?month=${m}`;

    default:
      return `/activities?month=${m}`;
  }
}

const toNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

function toDateOnly(d) {
  if (!d) return null;
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return null;
  dt.setHours(0, 0, 0, 0);
  return dt;
}

/* ================= DATE HELPERS ================= */

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}
function startOfWeekMonday(d) {
  const x = startOfDay(d);
  const day = x.getDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  return x;
}
function endOfWeekMonday(d) {
  const x = startOfWeekMonday(d);
  x.setDate(x.getDate() + 6);
  x.setHours(23, 59, 59, 999);
  return x;
}
function isValidDate(v) {
  const dt = new Date(v);
  return !Number.isNaN(dt.getTime());
}
function inRange(date, from, to) {
  const dt = new Date(date);
  if (Number.isNaN(dt.getTime())) return false;
  return dt.getTime() >= from.getTime() && dt.getTime() <= to.getTime();
}

function statusLabelFromExecution(e) {
  const raw = String(e?.status || e?.execution?.status || "").toUpperCase();

  if (raw === "COMPLETADA" || raw === "COMPLETED") return "Completada";
  if (raw === "ATRASADA" || raw === "OVERDUE") return "Atrasada";
  if (raw === "PENDIENTE" || raw === "PENDING") return "Pendiente";

  const sched = toDateOnly(e?.scheduledAt);
  const today = toDateOnly(new Date());
  if (sched && today && sched.getTime() < today.getTime()) return "Atrasada";
  return "Pendiente";
}

function fmtQty(q) {
  if (q == null) return "—";
  if (typeof q === "number") return String(q);
  return String(q);
}

function roleLabel(role) {
  const r = String(role || "").toUpperCase();
  if (r === "ADMIN") return "Administrador";
  if (r === "SUPERVISOR") return "Supervisor";
  if (r === "TECHNICIAN") return "Técnico";
  return "Usuario";
}

/* ================= UI: PANEL & KPI ================= */

const EXEC_DISPLAY_FONT = "\"Iowan Old Style\", \"Palatino Linotype\", \"Book Antiqua\", Georgia, serif";
const EXEC_TEXT_FONT = "\"Aptos\", \"Segoe UI\", \"Helvetica Neue\", Arial, sans-serif";

function PanelCard({ title, subtitle, right = null, children, executive = false }) {
  return (
    <div style={panelAdminCard}>
      <div style={panelAdminHeader}>
        <div style={{ minWidth: 0 }}>
          <div style={panelTitleAdminRow}>
            <div style={executive ? { ...panelTitleAdmin, fontFamily: EXEC_DISPLAY_FONT, letterSpacing: "-.02em", fontWeight: 700 } : panelTitleAdmin}>{title}</div>
            {right}
          </div>
          {subtitle ? <div style={panelSubtitleAdmin}>{subtitle}</div> : null}
        </div>
      </div>
      <div style={{ padding: 14 }}>{children}</div>
    </div>
  );
}

function KpiCard({ title, value, sub, tone = "blue", iconName = "alert", executive = false }) {
  const toneMap = {
    blue: { bg: "rgba(239,246,255,0.95)", bd: "rgba(191,219,254,0.95)", fg: "#1d4ed8" },
    red: { bg: "rgba(254,226,226,0.95)", bd: "rgba(254,202,202,0.95)", fg: "#991b1b" },
    amber: { bg: "rgba(254,243,199,0.95)", bd: "rgba(253,230,138,0.95)", fg: "#92400e" },
    green: { bg: "rgba(220,252,231,0.95)", bd: "rgba(187,247,208,0.95)", fg: "#166534" },
    gray: { bg: "rgba(248,250,252,0.95)", bd: "rgba(226,232,240,0.95)", fg: "#0f172a" },
  };
  const t = toneMap[tone] || toneMap.blue;

  return (
    <div
      style={{
        border: `1px solid ${t.bd}`,
        borderRadius: 18,
        overflow: "hidden",
        boxShadow: "0 12px 28px rgba(2,6,23,0.06)",
        minWidth: 0,
        background: "rgba(255,255,255,0.9)",
      }}
    >
      <div style={{ height: 10, background: "#0f172a", opacity: 0.92 }} />
      <div style={{ padding: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 14,
              display: "grid",
              placeItems: "center",
              background: "#f97316",
              border: "1px solid rgba(0,0,0,0.10)",
              color: "#0b0f19",
              flex: "0 0 auto",
              boxShadow: "0 10px 18px rgba(15,23,42,0.10)",
            }}
          >
            <Icon name={iconName} size="lg" weight="bold" />
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={executive ? { fontSize: 11, fontWeight: 900, color: "#64748b", textTransform: "uppercase", letterSpacing: ".12em", fontFamily: EXEC_TEXT_FONT } : { fontSize: 12, fontWeight: 950, color: "#64748b", textTransform: "uppercase" }}>{title}</div>
            <div style={executive ? { marginTop: 6, fontSize: 30, fontWeight: 700, color: t.fg, lineHeight: 0.98, fontFamily: EXEC_DISPLAY_FONT, letterSpacing: "-.03em" } : { marginTop: 6, fontSize: 28, fontWeight: 1000, color: t.fg, lineHeight: 1.05 }}>{value}</div>
          </div>
        </div>

        {sub ? <div style={executive ? { marginTop: 10, fontSize: 12, fontWeight: 700, color: "#475569", fontFamily: EXEC_TEXT_FONT, letterSpacing: ".01em" } : { marginTop: 10, fontSize: 12, fontWeight: 850, color: "#475569" }}>{sub}</div> : null}
      </div>
    </div>
  );
}

/* ================= UTIL: % ================= */

function safePct(num, den) {
  const a = Number(num || 0);
  const b = Number(den || 0);
  if (b <= 0) return 0;
  return Math.round((a / b) * 100);
}

/* ================= IA SUMMARY BOX ================= */

function AiSummaryBox({ month, aiState, onGenerate, onRefresh, canForceRefreshAi = false }) {
  const loading = !!aiState?.loading;
  const err = aiState?.error;
  const data = aiState?.data;
  const summary = data?.summary;
  const cached = !!data?.cached;
  const model = data?.model;
  const generatedAt = data?.generatedAt ? fmtDateTimeLocal(data.generatedAt) : null;
  const isFallback = /fallback/i.test(String(summary?.title || ""));
  const hallazgos = Array.isArray(summary?.highlights) ? summary.highlights.slice(0, 4) : [];
  const acciones = Array.isArray(summary?.recommendations) ? summary.recommendations.slice(0, 4) : [];
  const riesgos = Array.isArray(summary?.risks) ? summary.risks.slice(0, 4) : [];
  const executiveText = String(summary?.executiveSummary || "").trim();
  const executiveCompact = executiveText
    ? executiveText.split(/(?<=[.!?])\s+/).slice(0, 2).join(" ")
    : "Sin diagnóstico disponible para este periodo.";
  const statusLine = loading
    ? "Generando lectura ejecutiva…"
    : err
    ? "No se pudo generar el resumen IA."
    : summary
    ? "IA lista · " + (cached ? "cache" : "nuevo") + (model ? " · " + model : "") + (generatedAt ? " · " + generatedAt : "")
    : "Listo para generar una lectura ejecutiva de riesgos y prioridades.";

  return (
    <div style={aiBox}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <div>
          <div style={{ fontWeight: 950, color: "#0f172a", display: "inline-flex", alignItems: "center", gap: 8 }}>
            <Icon name="search" size="sm" />
            Resumen inteligente
          </div>
          <div style={{ marginTop: 4, fontSize: 12, fontWeight: 800, color: "#64748b" }}>
            {statusLine}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {summary ? (
            <span style={{ ...pqBadge, ...(isFallback ? pqBadgeWarn : pqBadgeInfo) }}>
              {isFallback ? "Fallback seguro" : "IA activa"}
            </span>
          ) : null}

          <button
            type="button"
            style={{
              ...aiBtn,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.55 : 1,
            }}
            disabled={loading}
            onClick={onGenerate}
            title="Generar o refrescar resumen"
          >
            {loading ? "Generando…" : summary ? "Actualizar →" : "Generar →"}
          </button>

          {canForceRefreshAi ? (
            <button
              type="button"
              style={{ ...btnAdminGhost, padding: "10px 12px" }}
              disabled={loading}
              onClick={onRefresh}
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

      <div style={aiBody}>
        {loading ? (
          <div style={{ fontSize: 12, fontWeight: 850, color: "#64748b" }}>Preparando lectura para {month}…</div>
        ) : err ? (
          <div style={{ fontSize: 12, fontWeight: 900, color: "#991b1b" }}>
            {err}
            <div style={{ marginTop: 8, fontWeight: 800, color: "#64748b" }}>
              Tip: revisa la conexión con OpenAI, la cuota del proyecto y la configuración del backend.
            </div>
          </div>
        ) : summary ? (
  <div style={{ display: "grid", gap: 12 }}>
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 20,
        padding: 16,
        background:
          "radial-gradient(circle at top left, rgba(249,115,22,0.10), transparent 28%), linear-gradient(180deg, #1a1f2f 0%, #111624 100%)",
        boxShadow: "0 18px 40px rgba(15,23,42,0.18)",
      }}
    >
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
          <div
            style={{
              fontSize: 12,
              fontWeight: 950,
              color: "#fb923c",
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            Diagnóstico ejecutivo
          </div>
          <div style={{ marginTop: 6, fontSize: 12, fontWeight: 850, color: "#94a3b8" }}>
            {summary.title || "Lectura ejecutiva del periodo"}
          </div>
        </div>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 12px",
            borderRadius: 999,
            background: isFallback ? "rgba(245,158,11,0.14)" : "rgba(34,197,94,0.14)",
            border: isFallback ? "1px solid rgba(245,158,11,0.26)" : "1px solid rgba(34,197,94,0.26)",
            color: isFallback ? "#fde68a" : "#bbf7d0",
            fontSize: 12,
            fontWeight: 950,
          }}
        >
          {isFallback ? "Fallback seguro" : "IA activa"}
        </span>
      </div>

      <div
        style={{
          marginTop: 14,
          fontSize: 24,
          lineHeight: 1.2,
          color: "#f8fafc",
          fontWeight: 980,
          maxWidth: 920,
        }}
      >
        {executiveCompact}
      </div>
    </div>

    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 12,
      }}
    >
      <div
        style={{
          borderRadius: 18,
          padding: 14,
          background: "#ffffff",
          border: "1px solid rgba(226,232,240,0.95)",
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 950,
            color: "#f97316",
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          Hallazgos clave
        </div>

        <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
          {hallazgos.length ? (
            hallazgos.slice(0, 3).map((item, i) => (
              <div
                key={i}
                style={{
                  borderRadius: 14,
                  padding: "12px 13px",
                  background: "#f8fafc",
                  border: "1px solid rgba(226,232,240,0.95)",
                  fontSize: 13,
                  fontWeight: 850,
                  color: "#0f172a",
                  lineHeight: 1.4,
                }}
              >
                {item}
              </div>
            ))
          ) : (
            <div style={{ fontSize: 12, fontWeight: 850, color: "#64748b" }}>
              Sin hallazgos disponibles.
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          borderRadius: 18,
          padding: 14,
          background: "#ffffff",
          border: "1px solid rgba(226,232,240,0.95)",
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 950,
            color: "#f97316",
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          Acciones recomendadas
        </div>

        <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
          {acciones.length ? (
            acciones.slice(0, 3).map((item, i) => (
              <div
                key={i}
                style={{
                  borderRadius: 14,
                  padding: "12px 13px",
                  background: "#f8fafc",
                  border: "1px solid rgba(226,232,240,0.95)",
                  fontSize: 13,
                  fontWeight: 900,
                  color: "#0f172a",
                  lineHeight: 1.4,
                }}
              >
                {item}
              </div>
            ))
          ) : (
            <div style={{ fontSize: 12, fontWeight: 850, color: "#64748b" }}>
              Sin acciones sugeridas.
            </div>
          )}
        </div>
      </div>
    </div>

    {riesgos.length ? (
      <div
        style={{
          borderRadius: 18,
          padding: 14,
          background: "#ffffff",
          border: "1px solid rgba(226,232,240,0.95)",
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 950,
            color: "#64748b",
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          Riesgos detectados
        </div>

        <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
          {riesgos.slice(0, 2).map((r, i) => {
            const lvl = String(r.level || "LOW").toUpperCase();
            const isHigh = lvl === "CRITICAL" || lvl === "HIGH";
            const isMedium = lvl === "MEDIUM";

            const tone = isHigh ? "#991b1b" : isMedium ? "#92400e" : "#166534";
            const bg = isHigh
              ? "rgba(254,226,226,0.60)"
              : isMedium
              ? "rgba(254,243,199,0.65)"
              : "rgba(220,252,231,0.65)";

            return (
              <div
                key={i}
                style={{
                  borderRadius: 14,
                  padding: "12px 13px",
                  background: bg,
                  border: "1px solid rgba(226,232,240,0.95)",
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 850, color: "#0f172a", lineHeight: 1.4 }}>
                  <div>{r.message || "Sin descripción disponible."}</div>
                  <div style={{ marginTop: 6, fontSize: 12, color: "#475569" }}>
                    Acción: <b style={{ color: "#0f172a" }}>{r.action || "Sin acción sugerida."}</b>
                  </div>
                </div>

                <span
                  style={{
                    ...pqBadge,
                    color: tone,
                    borderColor: tone + "33",
                    background: "rgba(255,255,255,0.70)",
                  }}
                >
                  {lvl}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    ) : null}
  </div>
        ) : (
          <div style={{ fontSize: 12, fontWeight: 850, color: "#64748b" }}>
            No hay resumen aún. Presiona <b>Generar</b>.
          </div>
        )}
      </div>
    </div>
  );
}

 /* ================= MINI CHARTS ================= */

function ymFromDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return y + "-" + m;
}
function lastNMonths(n = 6) {
  const out = [];
  const base = new Date();
  base.setDate(1);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(base);
    d.setMonth(d.getMonth() - i);
    out.push(ymFromDate(d));
  }
  return out;
}
function monthLabel(ym) {
  const [y, m] = String(ym || "").split("-");
  const dt = new Date(Number(y), Number(m || 1) - 1, 1);
  return dt.toLocaleString("es-MX", { month: "short" }).replace(".", "");
}

function MiniBars({ title, subtitle, data = [] }) {
  const max = Math.max(1, ...data.map((d) => Number(d.value || 0)));

  return (
    <PanelCard title={title} subtitle={subtitle}>
      <div style={{ display: "grid", gap: 10 }}>
        {data.map((d, idx) => {
          const v = Number(d.value || 0);
          const w = Math.round((v / max) * 100);
          return (
            <div key={`${d.label}-${idx}`} style={{ display: "grid", gridTemplateColumns: "54px 1fr 48px", gap: 10, alignItems: "center" }}>
              <div style={{ fontWeight: 950, color: "#475569", fontSize: 12, textTransform: "capitalize" }}>{d.label}</div>

              <div style={{ height: 10, borderRadius: 999, background: "#e5e7eb", overflow: "hidden", border: "1px solid rgba(0,0,0,0.05)" }}>
                <div style={{ height: "100%", width: `${w}%`, background: "#0f172a", borderRadius: 999, opacity: 0.92 }} />
              </div>

              <div style={{ textAlign: "right", fontWeight: 950, color: "#0f172a", fontSize: 12 }}>{v}</div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 12, fontSize: 12, fontWeight: 800, color: "#64748b" }}>
        Tip: esto refleja carga de trabajo total por mes (pendientes + vencidas + completadas).
      </div>
    </PanelCard>
  );
}

function MiniLines({ title, subtitle, series = [] }) {
  return (
    <PanelCard title={title} subtitle={subtitle}>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.max(1, series.length)}, minmax(0,1fr))`, gap: 10 }}>
        {series.map((p, idx) => (
          <div key={`${p.label}-${idx}`} style={miniStat}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="check" size="sm" />
              <div style={{ fontSize: 12, fontWeight: 950, color: "#64748b", textTransform: "capitalize" }}>{p.label}</div>
            </div>

            <div style={{ marginTop: 8, fontSize: 22, fontWeight: 1000, color: "#0f172a" }}>{Number(p.valuePct || 0)}%</div>

            <div style={{ marginTop: 10, height: 10, borderRadius: 999, background: "#e5e7eb", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.min(100, Math.max(0, Number(p.valuePct || 0)))}%`, background: "#f97316" }} />
            </div>
          </div>
        ))}
      </div>
    </PanelCard>
  );
}

/* ================= ADMIN PANEL ================= */

function AdminPanel({
  isMobile,
  month,
  donutTotals,
  donutLoading,
  onClickDonut,
  navigate,
  overdueCount,
  unassignedPending,
  lowStockCount,
  totalRoutes,
  totalEquipments,
  loadMonthlyActivities,

  aiState,
  loadAiSummary,
  forceRefreshAi,
  canForceRefreshAi = false,
  aiEnabled,

  predAlerts,
  predTotal,
  predLoading,
  predError,
  refreshPred,
  criticalRiskOverdue,
  predictiveEnabled,
  canSeeOverload,
  overloadHotItems,
  loadOverload,

  canSeePriorityQueue,
  pqLoading,
  pqError,
  pqItems,
  pqTotal,
  refreshPQ,

  upcomingActivities,
  showStructureKpis = true,
  onOpenScheduleActivity,
}) {
  const { currentPlantId, loadingPlants } = usePlant();
  const [trendsLoading, setTrendsLoading] = useState(false);
  const [trendCounts, setTrendCounts] = useState([]);
  const [trendError, setTrendError] = useState("");
  const [effLoading, setEffLoading] = useState(false);
  const [effError, setEffError] = useState("");
  const [effItems, setEffItems] = useState([]);
  const [operationalLoading, setOperationalLoading] = useState(false);
  const [operationalItems, setOperationalItems] = useState([]);
  const [prevMonthTotals, setPrevMonthTotals] = useState(null);

  const months6 = useMemo(() => lastNMonths(6), []);
  const todayYMD = toLocalYMD(new Date());
  const overloadHotCount = canSeeOverload ? Number(overloadHotItems?.length || 0) : 0;
  const handleRefreshPredictive = () => {
    refreshPred?.();
    loadOverload?.();
  };

  const previousMonth = useMemo(() => {
    const [yRaw, mRaw] = String(month || "").split("-");
    const y = Number(yRaw);
    const m = Number(mRaw);
    if (!Number.isFinite(y) || !Number.isFinite(m)) return null;
    const dt = new Date(y, m - 2, 1);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
  }, [month]);

  useEffect(() => {
    let alive = true;
    async function loadTrends() {
      try {
        setTrendError("");
        setTrendsLoading(true);
        const res = await Promise.all(
          months6.map(async (ym) => {
            const d = await loadMonthlyActivities(ym);
            return { ym, ...(d || {}) };
          })
        );
        if (!alive) return;
        setTrendCounts(res);
      } catch (e) {
        if (!alive) return;
        setTrendError(e?.message || "Error cargando tendencias");
        setTrendCounts([]);
      } finally {
        if (alive) setTrendsLoading(false);
      }
    }
    loadTrends();
    return () => {
      alive = false;
    };
  }, [months6, loadMonthlyActivities]);

  const loadEfficiency = useCallback(async () => {
    try {
      setEffError("");
      setEffLoading(true);
      const res = await getTechniciansEfficiencyMonthly({ month });
      const list = Array.isArray(res?.items) ? res.items : Array.isArray(res?.data?.items) ? res.data.items : [];
      setEffItems(list);
    } catch (e) {
      setEffItems([]);
      setEffError(e?.message || "Error cargando desempeño por técnico");
    } finally {
      setEffLoading(false);
    }
  }, [month]);

  useEffect(() => {
    loadEfficiency();
  }, [loadEfficiency]);

  useEffect(() => {
    let alive = true;
    async function loadOperationalFeed() {
      if (loadingPlants || !currentPlantId) return;
      try {
        setOperationalLoading(true);
        const res = await getExecutions({ month, futureWindow: "MONTH", limit: 250 });
        const list = Array.isArray(res?.items)
          ? res.items
          : Array.isArray(res?.data?.items)
          ? res.data.items
          : [];
        const normalized = list
          .map((ex) => normalizeExecutionToActivity(ex, todayYMD))
          .filter((item) => item.computedStatus !== "Completada");
        if (!alive) return;
        setOperationalItems(normalized);
      } catch {
        if (!alive) return;
        setOperationalItems(Array.isArray(upcomingActivities) ? upcomingActivities : []);
      } finally {
        if (alive) setOperationalLoading(false);
      }
    }
    loadOperationalFeed();
    return () => {
      alive = false;
    };
  }, [month, currentPlantId, loadingPlants, todayYMD, upcomingActivities]);

  useEffect(() => {
    let alive = true;
    async function loadPrevMonth() {
      if (!previousMonth) {
        setPrevMonthTotals(null);
        return;
      }
      try {
        const data = await loadMonthlyActivities(previousMonth);
        if (!alive) return;
        setPrevMonthTotals(data || null);
      } catch {
        if (!alive) return;
        setPrevMonthTotals(null);
      }
    }
    loadPrevMonth();
    return () => {
      alive = false;
    };
  }, [previousMonth, loadMonthlyActivities]);

  const currentMonthTotals = donutTotals || { pending: 0, overdue: 0, completed: 0 };
  const totalMonth = Number(currentMonthTotals.pending || 0) + Number(currentMonthTotals.overdue || 0) + Number(currentMonthTotals.completed || 0);
  const cumplimientoGlobal = safePct(currentMonthTotals.completed, totalMonth);
  const previousMonthTotal = Number(prevMonthTotals?.pending || 0) + Number(prevMonthTotals?.overdue || 0) + Number(prevMonthTotals?.completed || 0);
  const previousCumplimiento = previousMonthTotal > 0 ? safePct(prevMonthTotals?.completed, previousMonthTotal) : null;
  const cumplimientoDelta = previousCumplimiento == null ? null : cumplimientoGlobal - previousCumplimiento;

  const operationalBuckets = useMemo(() => {
    const overdue = [];
    const today = [];
    const upcoming = [];
    const isAdminPriorityCandidate = (item) => {
      const crit = String(item?.equipmentCriticality || "").toUpperCase();
      const isCriticalEq = ["ALTA", "CRITICA", "CRÍTICA"].includes(crit);
      const fromConditionReport = item?.conditionReportId != null;
      return isCriticalEq || fromConditionReport;
    };
    for (const item of operationalItems) {
      if (item?.computedStatus === "Atrasada") overdue.push(item);
      else if (item?.dateLabel === todayYMD && !item?.isFuture && isAdminPriorityCandidate(item)) today.push(item);
      else if (item?.isFuture && isAdminPriorityCandidate(item)) upcoming.push(item);
    }
    overdue.sort((a, b) => Number(b?.overdueDays || 0) - Number(a?.overdueDays || 0));
    today.sort((a, b) => new Date(a?.dateISO || a?.scheduledAt || 0).getTime() - new Date(b?.dateISO || b?.scheduledAt || 0).getTime());
    upcoming.sort((a, b) => new Date(a?.dateISO || a?.scheduledAt || 0).getTime() - new Date(b?.dateISO || b?.scheduledAt || 0).getTime());
    return {
      overdue,
      today,
      upcoming,
      maxOverdueDays: Number(overdue?.[0]?.overdueDays || 0),
    };
  }, [operationalItems, todayYMD]);

  const kpis = [
    {
      title: "Cumplimiento global",
      value: `${cumplimientoGlobal}%`,
      sub: cumplimientoDelta == null ? "Mes seleccionado" : `${cumplimientoDelta >= 0 ? "+" : ""}${cumplimientoDelta}% vs mes anterior`,
      tone: cumplimientoGlobal >= 85 ? "green" : cumplimientoGlobal >= 70 ? "amber" : "red",
      iconName: "check",
    },
    {
      title: "Completadas",
      value: String(currentMonthTotals.completed || 0),
      sub: "Mes seleccionado",
      tone: "green",
      iconName: "check",
    },
    {
      title: "Atrasadas",
      value: String(currentMonthTotals.overdue || 0),
      sub: operationalBuckets.maxOverdueDays > 0 ? `${operationalBuckets.maxOverdueDays} día(s) de retraso` : "Mes seleccionado",
      tone: "red",
      iconName: "clock",
    },
    ...(showStructureKpis
      ? [
          {
            title: "Total de rutas",
            value: String(totalRoutes || 0),
            sub: "Registradas",
            tone: "blue",
            iconName: "route",
          },
          {
            title: "Total de equipos",
            value: String(totalEquipments || 0),
            sub: "Registrados",
            tone: "gray",
            iconName: "equipment",
          },
        ]
      : []),
  ];

  const activityByMonth = trendCounts.map((x) => ({
    label: monthLabel(x.ym),
    value: Number(x.pending || 0) + Number(x.overdue || 0) + Number(x.completed || 0),
  }));

  const efficiencyByMonth = trendCounts.map((x) => {
    const total = Number(x.pending || 0) + Number(x.overdue || 0) + Number(x.completed || 0);
    return { label: monthLabel(x.ym), valuePct: safePct(x.completed, total) };
  });

  const adminPriorityQueueItems = useMemo(() => {
    const source = Array.isArray(pqItems) ? pqItems : [];
    return source.filter((item) => {
      const type = String(item?.type || "").toUpperCase();
      const crit = String(
        item?.equipment?.criticality ||
          item?.entity?.equipment?.criticality ||
          item?.criticality ||
          ""
      ).toUpperCase();
      const isCriticalEq = ["ALTA", "CRITICA", "CRÍTICA"].includes(crit);
      const isConditionDerived =
        type.includes("CONDITION_REPORT") ||
        type === "COND_REPORT" ||
        type === "BAD_CONDITION" ||
        type === "REPEATED_FAILURES";
      return isCriticalEq || isConditionDerived;
    });
  }, [pqItems]);

  const adminPriorityQueueViewItems = adminPriorityQueueItems.length ? adminPriorityQueueItems : (Array.isArray(pqItems) ? pqItems : []);

  const chipAdminCompact = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    padding: "6px 10px",
    border: "1px solid rgba(148,163,184,0.28)",
    background: "rgba(255,255,255,0.88)",
    fontSize: 12,
    fontWeight: 900,
    color: "#475569",
  };

  const renderAdminActivityCard = (activity, prefix, tone = "amber") => {
    const statusParam =
      prefix === "overdue"
        ? "OVERDUE"
        : prefix === "today" || prefix === "upcoming"
        ? "PENDING"
        : "";
    const futureParam = prefix === "upcoming" ? "&futureWindow=MONTH" : "";
    const filterParam = prefix === "today" || prefix === "upcoming" ? "&filter=admin-priority" : "";
    const equipmentValue = activity?.equipment;
    const equipmentLabel =
      typeof equipmentValue === "string"
        ? equipmentValue
        : equipmentValue?.name || activity?.equipmentName || "Equipo no disponible";
    const equipmentCode =
      (typeof equipmentValue === "object" && equipmentValue?.code) ||
      activity?.equipmentCode ||
      activity?.equipment?.code ||
      "";
    const title =
      activity?.routeName ||
      activity?.activityName ||
      activity?.title ||
      equipmentLabel ||
      "Actividad";
    const equipment = equipmentLabel;
    const dateText = activity?.relativeText || activity?.dateText || activity?.dateLabel || "Fecha no definida";
    const quantity = activity?.quantityLabel || activity?.quantity || "Cantidad no definida";
    const technician = activity?.technicianName || activity?.technician?.name || (activity?.isUnassigned ? "Sin técnico" : "No asignado");
    const accent = tone === "red" ? "#ef4444" : tone === "green" ? "#22c55e" : "#f59e0b";
    const soft = tone === "red" ? "rgba(254,242,242,0.96)" : tone === "green" ? "rgba(240,253,244,0.96)" : "rgba(255,247,237,0.96)";

    return (
      <button
        key={`${prefix}-${activity.id}`}
        type="button"
        onClick={() => navigate(`/activities?month=${encodeURIComponent(month)}${statusParam ? `&status=${encodeURIComponent(statusParam)}` : ""}${futureParam}${filterParam}`)}
        style={{
          width: "100%",
          border: `1px solid ${accent}33`,
          borderLeft: `4px solid ${accent}`,
          borderRadius: 16,
          background: soft,
          padding: "12px 14px",
          display: "grid",
          gap: 8,
          textAlign: "left",
          cursor: "pointer",
          boxShadow: "0 10px 24px rgba(15,23,42,0.05)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "start" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 900, color: "#64748b", textTransform: "uppercase", letterSpacing: ".12em", fontFamily: EXEC_TEXT_FONT }}>
              {activity?.computedStatus === "Atrasada" ? "Atención inmediata" : activity?.computedStatus || "Programada"}
            </div>
            <div style={{ marginTop: 4, fontSize: 20, lineHeight: 1.02, fontWeight: 700, color: "#0f172a", fontFamily: EXEC_DISPLAY_FONT, letterSpacing: "-.03em" }}>{title}</div>
          </div>
          <span
            style={{
              flexShrink: 0,
              borderRadius: 999,
              padding: "6px 10px",
              fontSize: 11,
              fontWeight: 900,
              color: accent,
              background: "rgba(255,255,255,0.92)",
              border: `1px solid ${accent}33`,
            }}
          >
            {activity?.computedStatus || "Pendiente"}
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gap: 6,
            padding: "10px 12px",
            borderRadius: 14,
            background: "rgba(255,255,255,0.82)",
            border: "1px solid rgba(148,163,184,0.2)",
          }}
        >
          {equipmentCode ? (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "fit-content",
                borderRadius: 999,
                padding: "6px 12px",
                background: "rgba(15,23,42,0.08)",
                border: "1px solid rgba(15,23,42,0.12)",
                fontSize: 15,
                fontWeight: 1000,
                color: "#0f172a",
                letterSpacing: ".03em",
              }}
            >
              {equipmentCode}
            </div>
          ) : null}
          <div style={{ fontSize: 14, fontWeight: 700, color: "#334155", fontFamily: EXEC_TEXT_FONT }}>{equipment}</div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span style={chipAdminCompact}>{dateText}</span>
          <span style={chipAdminCompact}>{quantity}</span>
          <span style={chipAdminCompact}>Técnico: {technician}</span>
        </div>
      </button>
    );
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12 }}>
        {kpis.map((k) => (
          <KpiCard key={k.title} title={k.title} value={k.value} sub={k.sub} tone={k.tone} iconName={k.iconName} executive />
        ))}
      </div>

      <PanelCard
        title="Actividades críticas"
        subtitle="Lo urgente del mes antes de entrar al análisis"
        right={
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#64748b", fontWeight: 900, fontSize: 12 }}>
            <Icon name="alert" size="sm" />
            Prioridad 1
          </span>
        }
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1.22fr) minmax(280px, 0.78fr)",
            gap: 14,
            alignItems: "start",
          }}
        >
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 1000, color: "#991b1b", display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <Icon name="clock" size="sm" />
                    Atrasadas ({operationalBuckets.overdue.length})
                  </div>
                  <div style={{ marginTop: 4, fontSize: 12, fontWeight: 800, color: "#64748b" }}>Lo que ya se salió de fecha y requiere acción inmediata.</div>
                </div>
                {operationalBuckets.overdue.length > 3 ? (
                  <button type="button" style={btnAdminGhost} onClick={() => navigate(`/activities?status=OVERDUE&month=${encodeURIComponent(month)}`)}>
                    Ver más →
                  </button>
                ) : null}
              </div>
              {operationalLoading ? (
                <div style={{ fontWeight: 850, color: "#64748b" }}>Cargando actividades críticas…</div>
              ) : operationalBuckets.overdue.length === 0 ? (
                <div style={{ fontWeight: 850, color: "#64748b" }}>Sin atrasadas en este momento.</div>
              ) : (
                <div style={{ display: "grid", gap: 8 }}>{operationalBuckets.overdue.slice(0, 3).map((a) => renderAdminActivityCard(a, "overdue", "red"))}</div>
              )}
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 1000, color: "#b45309", display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <Icon name="alert" size="sm" />
                    Pendientes hoy ({operationalBuckets.today.length})
                  </div>
                  <div style={{ marginTop: 4, fontSize: 12, fontWeight: 800, color: "#64748b" }}>Solo rutas de equipos críticos y actividades nacidas de reportes de condición que deben resolverse hoy.</div>
                </div>
                {operationalBuckets.today.length > 3 ? (
                  <button type="button" style={btnAdminGhost} onClick={() => navigate(`/activities?status=PENDING&month=${encodeURIComponent(month)}&filter=admin-priority`)}>
                    Ver más →
                  </button>
                ) : null}
              </div>
              {operationalLoading ? null : operationalBuckets.today.length === 0 ? (
                <div style={{ fontWeight: 850, color: "#64748b" }}>No hay pendientes programadas para hoy.</div>
              ) : (
                <div style={{ display: "grid", gap: 8 }}>{operationalBuckets.today.slice(0, 3).map((a) => renderAdminActivityCard(a, "today", "amber"))}</div>
              )}
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 1000, color: "#166534", display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <Icon name="calendar" size="sm" />
                    Próximas ({operationalBuckets.upcoming.length})
                  </div>
                  <div style={{ marginTop: 4, fontSize: 12, fontWeight: 800, color: "#64748b" }}>Lo crítico y correctivo que viene en los próximos días para anticiparte sin perder foco operativo.</div>
                </div>
                {operationalBuckets.upcoming.length > 3 ? (
                  <button type="button" style={btnAdminGhost} onClick={() => navigate(`/activities?month=${encodeURIComponent(month)}&status=PENDING&futureWindow=MONTH&filter=admin-priority`)}>
                    Ver más →
                  </button>
                ) : null}
              </div>
              {operationalLoading ? null : operationalBuckets.upcoming.length === 0 ? (
                <div style={{ fontWeight: 850, color: "#64748b" }}>Sin próximas actividades relevantes por ahora.</div>
              ) : (
                <div style={{ display: "grid", gap: 8 }}>{operationalBuckets.upcoming.slice(0, 3).map((a) => renderAdminActivityCard(a, "upcoming", "green"))}</div>
              )}
            </div>
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            <PanelCard
              title="Distribución del mes"
              subtitle="Pendientes · Vencidas · Completadas"
              right={
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#64748b", fontWeight: 900, fontSize: 12 }}>
                  <Icon name="calendar" size="sm" />
                  {month}
                </span>
              }
            >
              {donutLoading ? (
                <div style={{ fontWeight: 850, color: "#64748b" }}>Cargando…</div>
              ) : (
                <ActivitiesDonut
                  completed={Number(currentMonthTotals.completed || 0)}
                  pending={Number(currentMonthTotals.pending || 0)}
                  overdue={Number(currentMonthTotals.overdue || 0)}
                  onClickSlice={onClickDonut}
                  size={224}
                  stroke={20}
                />
              )}
              <div style={{ marginTop: 14, fontSize: 13, fontWeight: 850, color: "#475569", lineHeight: 1.45 }}>
                Ataca primero las atrasadas, luego saca las de hoy y usa las próximas como colchón operativo.
              </div>
            </PanelCard>

            <div style={{ border: "1px solid rgba(226,232,240,0.95)", borderRadius: 16, padding: 12, background: "rgba(255,255,255,0.94)", display: "grid", gap: 10 }}>
              <div>
                <div style={{ fontWeight: 1000, color: "#0f172a", display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <Icon name="tool" size="sm" />
                  Acciones rápidas
                </div>
                <div style={{ marginTop: 4, fontSize: 12, fontWeight: 800, color: "#64748b" }}>Atajos cortos para resolver sin salir del bloque operativo.</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 8 }}>
                <button style={btnAdminPrimary} onClick={() => navigate("/analysis")}>
                  <span style={btnRow}><Icon name="search" size="sm" />Análisis →</span>
                </button>
                <button style={btnAdminGhost} onClick={() => onOpenScheduleActivity?.()}>
                  <span style={btnRow}><Icon name="plus" size="sm" />Programar →</span>
                </button>
                <button style={btnAdminGhost} onClick={() => navigate("/condition-reports?status=OPEN")}>
                  <span style={btnRow}><Icon name="warn" size="sm" />Condición →</span>
                </button>
                <button style={btnAdminGhost} onClick={() => navigate("/inventory")}>
                  <span style={btnRow}><Icon name="drop" size="sm" />Inventario {lowStockCount > 0 ? <span style={dotWarnTiny} /> : null} →</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </PanelCard>

      <PanelCard
        title="Centro de alertas"
        subtitle="IA + operación + predictivas + prioridades"
        right={
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#64748b", fontWeight: 900, fontSize: 12 }}>
            <Icon name="alert" size="sm" />
            Priorizar
          </span>
        }
      >
        {aiEnabled ? (
          <div style={{ border: "1px solid rgba(226,232,240,0.95)", borderRadius: 16, padding: 12, background: "rgba(248,250,252,0.9)" }}>
            <AiSummaryBox month={month} aiState={aiState} onGenerate={loadAiSummary} onRefresh={forceRefreshAi} canForceRefreshAi={canForceRefreshAi} />
          </div>
        ) : null}

        <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))",
              gap: 12,
              alignItems: "start",
            }}
          >
            <div style={{ border: "1px solid rgba(226,232,240,0.95)", borderRadius: 16, padding: 12, background: "rgba(255,255,255,0.92)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 1000, color: "#0f172a", display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <Icon name="tool" size="sm" />
                    Alertas operativas
                  </div>
                  <div style={{ marginTop: 4, fontSize: 12, fontWeight: 800, color: "#64748b" }}>Atajos directos para lo urgente del día</div>
                </div>
              </div>
              <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
                <button type="button" style={{ ...btnAdminChip, padding: "12px 12px", justifyContent: "space-between", ...(overdueCount ? chipRedMini : chipOffMini) }} onClick={() => navigate(`/activities?status=OVERDUE&month=${encodeURIComponent(month)}`)} disabled={!overdueCount}><span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Icon name="clock" size="sm" />Atrasadas</span><span style={chipCountMini}>{Number(overdueCount || 0)}</span></button>
                <button type="button" style={{ ...btnAdminChip, padding: "12px 12px", justifyContent: "space-between", ...(unassignedPending ? chipBlueMini : chipOffMini) }} onClick={() => navigate(`/activities?filter=unassigned&month=${encodeURIComponent(month)}`)} disabled={!unassignedPending}><span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Icon name="user" size="sm" />Sin técnico</span><span style={chipCountMini}>{Number(unassignedPending || 0)}</span></button>
                <button type="button" style={{ ...btnAdminChip, padding: "12px 12px", justifyContent: "space-between", ...(lowStockCount ? chipAmberMini : chipOffMini) }} onClick={() => navigate(`/inventory?filter=low&month=${encodeURIComponent(month)}`)} disabled={!lowStockCount}><span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Icon name="drop" size="sm" />Bajo stock</span><span style={chipCountMini}>{Number(lowStockCount || 0)}</span></button>
                <button type="button" style={{ ...btnAdminChip, padding: "12px 12px", justifyContent: "space-between", ...(criticalRiskOverdue ? chipRedMini : chipOffMini) }} onClick={() => navigate(`/activities?status=OVERDUE&filter=critical-risk&month=${encodeURIComponent(month)}`)} disabled={!criticalRiskOverdue}><span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Icon name="warn" size="sm" />Críticas vencidas</span><span style={chipCountMini}>{Number(criticalRiskOverdue || 0)}</span></button>
              </div>
            </div>

            {(predLoading || predError || predTotal > 0 || predAlerts) ? (
              <div style={{ border: "1px solid rgba(226,232,240,0.95)", borderRadius: 16, padding: 12, background: "rgba(255,255,255,0.92)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 1000, color: "#0f172a", display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <Icon name="alert" size="sm" />
                      Alertas predictivas
                    </div>
                    <div style={{ marginTop: 4, fontSize: 12, fontWeight: 800, color: "#64748b" }}>{predLoading ? "Calculando..." : predTotal > 0 ? "Riesgos detectados para anticiparse" : "Sin señales predictivas por ahora"}</div>
                  </div>
                  <button type="button" onClick={handleRefreshPredictive} style={btnAdminGhost} disabled={predLoading} title="Actualizar predictivas"><span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Icon name="refresh" size="sm" />{predLoading ? "..." : "Actualizar"}</span></button>
                </div>
                {predError ? <div style={miniError}>{predError}</div> : null}
                {(() => {
                  const dteCount = Number(predAlerts?.lubricantDaysToEmptyCount || 0);
                  const anomaliesCount = Number(predAlerts?.equipmentConsumptionAnomaliesCount || 0);
                  return (
                    <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button type="button" style={{ ...chipBtn, ...(predAlerts?.riskPendingCount ? chipBlue : chipOff) }} onClick={() => navigate(`/activities?filter=risk-late&month=${encodeURIComponent(month)}`)} disabled={!predAlerts?.riskPendingCount}><Icon name="clock" size="sm" />Riesgo de atraso <span style={chipCount}>{Number(predAlerts?.riskPendingCount || 0)}</span></button>
                      <button type="button" style={{ ...chipBtn, ...(criticalRiskOverdue ? chipRed : chipOff) }} onClick={() => navigate(`/activities?status=OVERDUE&filter=critical-risk&month=${encodeURIComponent(month)}`)} disabled={!criticalRiskOverdue}><Icon name="alert" size="sm" />Críticas vencidas <span style={chipCount}>{Number(criticalRiskOverdue || 0)}</span></button>
                      <button type="button" style={{ ...chipBtn, ...(predAlerts?.repeatedFailuresCount ? chipAmber : chipOff) }} onClick={() => navigate(`/activities?filter=bad-condition&month=${encodeURIComponent(month)}`)} disabled={!predAlerts?.repeatedFailuresCount}><Icon name="warn" size="sm" />Reincidencia <span style={chipCount}>{Number(predAlerts?.repeatedFailuresCount || 0)}</span></button>
                      <button type="button" style={{ ...chipBtn, ...(dteCount ? chipAmber : chipOff) }} onClick={() => navigate(`/inventory?filter=predictive-dte&month=${encodeURIComponent(month)}`)} disabled={!dteCount}><Icon name="drop" size="sm" />Inventario en riesgo <span style={chipCount}>{dteCount}</span></button>
                      <button type="button" style={{ ...chipBtn, ...(overloadHotCount ? chipRed : chipOff) }} onClick={() => navigate(`/activities?month=${encodeURIComponent(month)}`)} disabled={!overloadHotCount}><Icon name="user" size="sm" />Sobrecarga técnica <span style={chipCount}>{overloadHotCount}</span></button>
                      <button type="button" style={{ ...chipBtn, ...(anomaliesCount ? chipRed : chipOff) }} onClick={() => navigate(`/analysis?tab=consumption&filter=anomalies&month=${encodeURIComponent(month)}`)} disabled={!anomaliesCount}><Icon name="alert" size="sm" />Consumo fuera de patrón <span style={chipCount}>{anomaliesCount}</span></button>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div style={{ border: "1px solid rgba(226,232,240,0.95)", borderRadius: 16, padding: 12, background: "rgba(255,255,255,0.92)", fontWeight: 850, color: "#64748b" }}>
                Sin señales predictivas por ahora.
              </div>
            )}
          </div>

          <SupervisorPriorityTodayPanel month={month} navigate={navigate} canSeePriorityQueue={canSeePriorityQueue} pqLoading={pqLoading} pqError={pqError} pqItems={adminPriorityQueueViewItems} pqTotal={adminPriorityQueueViewItems.length} refreshPQ={refreshPQ} />
        </div>
      </PanelCard>

      {trendError ? <div style={miniError}>{trendError}</div> : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))",
          gap: 12,
        }}
      >
        <MiniBars
          title="Actividades por mes"
          subtitle="Últimos 6 meses"
          data={trendsLoading ? months6.map((ym) => ({ label: monthLabel(ym), value: 0 })) : activityByMonth}
        />

        <TechniciansEfficiencyCard
          month={month}
          items={effItems}
          loading={effLoading}
          error={effError}
          onRefresh={loadEfficiency}
          onOpenTechnician={(technicianId) => {
            if (!technicianId) return;
            navigate(`/activities?technicianId=${encodeURIComponent(technicianId)}&month=${encodeURIComponent(month)}`);
          }}
        />
      </div>

      <MiniLines
        title="Eficiencia operacional"
        subtitle="% completadas vs programadas · últimos 6 meses"
        series={trendsLoading ? months6.map((ym) => ({ label: monthLabel(ym), valuePct: 0 })) : efficiencyByMonth}
      />


    </div>
  );
}

/* =========================
  SUP: Actividades focus
========================= */

function SupervisorActivitiesFocusCard({ month, navigate, upcomingActivities, loading }) {
  const { currentPlantId, loadingPlants } = usePlant();
  const [range, setRange] = useState("TODAY");
  const [tech, setTech] = useState("");
  const [includeUnassigned, setIncludeUnassigned] = useState(false);
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedItems, setFeedItems] = useState([]);
  const now = useMemo(() => new Date(), []);
  const todayYMD = toLocalYMD(new Date());

  useEffect(() => {
    if (loadingPlants || !currentPlantId) return;

    let alive = true;

    async function loadFeed() {
      try {
        setFeedLoading(true);
        const res = await getExecutions({ month, futureWindow: "MONTH", limit: 400 });
        const list = Array.isArray(res?.items)
          ? res.items
          : Array.isArray(res?.data?.items)
          ? res.data.items
          : [];

        const normalized = list
          .map((ex) => normalizeExecutionToActivity(ex, todayYMD))
          .filter((item) => item.computedStatus !== "Completada");

        if (!alive) return;
        setFeedItems(normalized);
      } catch {
        if (!alive) return;
        setFeedItems(Array.isArray(upcomingActivities) ? upcomingActivities : []);
      } finally {
        if (alive) setFeedLoading(false);
      }
    }

    loadFeed();
    return () => {
      alive = false;
    };
  }, [month, currentPlantId, loadingPlants, todayYMD, upcomingActivities]);

  const sourceItems = feedItems.length ? feedItems : Array.isArray(upcomingActivities) ? upcomingActivities : [];

  const fromTo = useMemo(() => {
    if (range === "TODAY") return { from: startOfDay(now), to: endOfDay(now) };
    if (range === "WEEK") return { from: startOfWeekMonday(now), to: endOfWeekMonday(now) };

    const y = Number(String(month || "").slice(0, 4));
    const m = Number(String(month || "").slice(5, 7));

    if (Number.isFinite(y) && Number.isFinite(m)) {
      const f = new Date(y, m - 1, 1, 0, 0, 0, 0);
      const t = new Date(y, m, 0, 23, 59, 59, 999);
      return { from: f, to: t };
    }

    return { from: startOfDay(now), to: endOfDay(now) };
  }, [range, month, now]);

  const techOptions = useMemo(() => {
    const map = new Map();

    sourceItems.forEach((a) => {
      const id = a?.technicianId ?? a?.technician?.id;
      const name = a?.technicianName || a?.technician?.name;
      if (id == null || !name) return;
      map.set(String(id), name);
    });

    return [...map.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [sourceItems]);

  const items = useMemo(() => {
    const list = sourceItems.filter((a) => {
      const scheduledAt = a?.scheduledAt || a?.dateISO;
      if (!scheduledAt || !isValidDate(scheduledAt)) return false;

      const isOverdue = String(a?.computedStatus || "").toUpperCase() === "ATRASADA";
      const okRange =
        range === "TODAY"
          ? (a?.dateLabel === todayYMD || isOverdue)
          : inRange(scheduledAt, fromTo.from, fromTo.to);

      if (!okRange) return false;
      if (includeUnassigned && a?.technicianId != null) return false;
      if (!includeUnassigned && tech) return String(a?.technicianId || "") === String(tech);
      return true;
    });

    return list.sort((x, y) => {
      const xOverdue = String(x?.computedStatus || "").toUpperCase() === "ATRASADA" ? 0 : 1;
      const yOverdue = String(y?.computedStatus || "").toUpperCase() === "ATRASADA" ? 0 : 1;
      if (xOverdue !== yOverdue) return xOverdue - yOverdue;
      return new Date(x.scheduledAt || x.dateISO).getTime() - new Date(y.scheduledAt || y.dateISO).getTime();
    });
  }, [sourceItems, fromTo, tech, includeUnassigned, range, todayYMD]);

  const title =
    range === "TODAY"
      ? "Actividades de hoy"
      : range === "WEEK"
      ? "Actividades de la semana"
      : "Actividades del mes";

  return (
    <PanelCard
      title={title}
      subtitle="Lo que toca atender primero, con filtro por periodo y técnico"
      right={
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            color: "#64748b",
            fontWeight: 900,
            fontSize: 12,
          }}
        >
          <Icon name="tool" size="sm" />
          Operación
        </span>
      }
    >
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" onClick={() => setRange("TODAY")} style={{ ...segBtn, ...(range === "TODAY" ? segOn : segOff) }}>
            Hoy
          </button>
          <button type="button" onClick={() => setRange("WEEK")} style={{ ...segBtn, ...(range === "WEEK" ? segOn : segOff) }}>
            Semana
          </button>
          <button type="button" onClick={() => setRange("MONTH")} style={{ ...segBtn, ...(range === "MONTH" ? segOn : segOff) }}>
            Mes
          </button>
          <button
            type="button"
            onClick={() => {
              setIncludeUnassigned((v) => !v);
              setTech("");
            }}
            style={{ ...segBtn, ...(includeUnassigned ? segOn : segOff) }}
          >
            {includeUnassigned ? "Sin técnico" : "Filtrar sin técnico"}
          </button>
        </div>

        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 900, color: "#64748b" }}>Técnico</span>

          <select
            value={tech}
            onChange={(e) => {
              setTech(e.target.value);
              if (e.target.value) setIncludeUnassigned(false);
            }}
            style={segSelect}
            disabled={includeUnassigned}
          >
            <option value="">Todos</option>
            {techOptions.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => navigate(`/activities?month=${encodeURIComponent(month)}`)}
            style={btnAdminPrimary}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <Icon name="search" size="sm" />
              Ir a actividades →
            </span>
          </button>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        {loading || feedLoading ? (
          <div style={{ fontWeight: 850, color: "#64748b" }}>Cargando…</div>
        ) : items.length === 0 ? (
          <div style={{ fontWeight: 850, color: "#64748b" }}>
            No hay actividades para este filtro.
          </div>
        ) : (
          <>
            <div style={supervisorActivityList}>
              {items.map((a) => (
                <div key={a.id} style={supervisorActivityListItem}>
                  <ActivityCard
                    activity={a}
                    todayYMD={todayYMD}
                    onOpen={() =>
                      navigate(`/activities?month=${encodeURIComponent(month)}`)
                    }
                    techs={[]}
                    onAssignTech={() => {}}
                    assigningId={null}
                    canAssignTech={false}
                    canCompleteActivities={false}
                    showPreviewAction
                    previewActionLabel="Abrir"
                  />
                </div>
              ))}
            </div>

            <div style={supervisorCompactFooter}>
              <span>{items.length} actividad(es) en este filtro.</span>
              <span>Desliza la lista para revisar toda la jornada.</span>
            </div>

          </>
        )}
      </div>
    </PanelCard>
  );
}

function SupervisorDistributionAlertsPanel({
  month,
  donutTotals,
  donutLoading,
  navigate,
  overdueCount,
  unassignedPending,
  lowStockCount,
  predAlerts,
  predTotal,
  predLoading,
  predError,
  refreshPred,
  predictiveEnabled,
  canSeeOverload,
  overloadHotItems,
  loadOverload,
  criticalRiskOverdue,
  canSeePriorityQueue,
  pqLoading,
  pqError,
  pqItems,
  pqTotal,
  refreshPQ,
  onOpenScheduleActivity,
  onOpenEmergencyActivity,
  activitiesNode = null,
  showPriority = true,
}) {
  const currentMonthTotals = donutTotals || { pending: 0, overdue: 0, completed: 0 };
  const dteCount = Number(predAlerts?.lubricantDaysToEmptyCount || 0);
  const anomaliesCount = Number(predAlerts?.equipmentConsumptionAnomaliesCount || 0);
  const repeatedFailuresCount = Number(predAlerts?.repeatedFailuresCount || 0);
  const priorityItems = (Array.isArray(pqItems) ? pqItems : [])
    .map((x) => formatPriorityItem(x, month))
    .slice(0, Math.max(6, Math.min(10, Number(pqTotal || 0) || 6)));
  const overloadHotCount = canSeeOverload ? Number(overloadHotItems?.length || 0) : 0;
  const handleRefreshPredictive = () => {
    refreshPred?.();
    loadOverload?.();
  };

  return (
    <PanelCard
      title="Distribución y alertas"
      subtitle="Lo que el supervisor necesita ver al entrar"
      right={
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            color: "#64748b",
            fontWeight: 900,
            fontSize: 12,
          }}
        >
          <Icon name="alert" size="sm" />
          Operación
        </span>
      }
    >
      <div style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "grid", justifyItems: "center", paddingBottom: 4 }}>
          {donutLoading ? (
            <div style={{ fontWeight: 850, color: "#64748b" }}>Cargando…</div>
          ) : (
            <ActivitiesDonut
              completed={Number(currentMonthTotals.completed || 0)}
              pending={Number(currentMonthTotals.pending || 0)}
              overdue={Number(currentMonthTotals.overdue || 0)}
              onClickSlice={(key) => {
                if (key === "OVERDUE") navigate(`/activities?status=OVERDUE&month=${encodeURIComponent(month)}`);
                if (key === "PENDING") navigate(`/activities?status=PENDING&month=${encodeURIComponent(month)}`);
                if (key === "COMPLETED") navigate(`/activities?status=COMPLETED&month=${encodeURIComponent(month)}`);
              }}
              size={210}
              stroke={18}
            />
          )}
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ border: "1px solid rgba(226,232,240,0.95)", borderRadius: 16, padding: 12, background: "rgba(255,255,255,0.92)" }}>
            <div style={{ fontWeight: 1000, color: "#0f172a", display: "inline-flex", alignItems: "center", gap: 8 }}>
              <Icon name="tool" size="sm" />
              Alertas operativas
            </div>
            <div style={{ marginTop: 4, fontSize: 12, fontWeight: 800, color: "#64748b" }}>Atajos directos para atender pendientes reales.</div>
            <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button type="button" style={{ ...chipBtn, ...(overdueCount ? chipRed : chipOff) }} onClick={() => navigate(`/activities?status=OVERDUE&month=${encodeURIComponent(month)}`)} disabled={!overdueCount}>
                <Icon name="clock" size="sm" />
                Atrasadas <span style={chipCount}>{Number(overdueCount || 0)}</span>
              </button>
              <button type="button" style={{ ...chipBtn, ...(unassignedPending ? chipBlue : chipOff) }} onClick={() => navigate(`/activities?filter=unassigned&month=${encodeURIComponent(month)}`)} disabled={!unassignedPending}>
                <Icon name="user" size="sm" />
                Sin técnico <span style={chipCount}>{Number(unassignedPending || 0)}</span>
              </button>
              <button type="button" style={{ ...chipBtn, ...(lowStockCount ? chipAmber : chipOff) }} onClick={() => navigate(`/inventory?filter=low&month=${encodeURIComponent(month)}`)} disabled={!lowStockCount}>
                <Icon name="drop" size="sm" />
                Bajo stock <span style={chipCount}>{Number(lowStockCount || 0)}</span>
              </button>
            </div>
          </div>

          <div style={{ border: "1px solid rgba(226,232,240,0.95)", borderRadius: 16, padding: 12, background: "rgba(255,255,255,0.92)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 1000, color: "#0f172a", display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <Icon name="alert" size="sm" />
                  Alertas predictivas
                </div>
                <div style={{ marginTop: 4, fontSize: 12, fontWeight: 800, color: "#64748b" }}>
                  {predLoading ? "Calculando…" : predTotal > 0 ? "Riesgos detectados para anticiparse" : "Sin señales predictivas por ahora"}
                </div>
              </div>
              <button type="button" onClick={handleRefreshPredictive} style={btnAdminGhost} disabled={predLoading || !predictiveEnabled}>Actualizar</button>
            </div>
            {predError ? <div style={miniError}>{predError}</div> : null}
            <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button type="button" style={{ ...chipBtn, ...(predAlerts?.riskPendingCount ? chipBlue : chipOff) }} onClick={() => navigate(`/activities?filter=risk-late&month=${encodeURIComponent(month)}`)} disabled={!predAlerts?.riskPendingCount}>
                <Icon name="clock" size="sm" />
                Riesgo de atraso <span style={chipCount}>{Number(predAlerts?.riskPendingCount || 0)}</span>
              </button>
              <button type="button" style={{ ...chipBtn, ...(criticalRiskOverdue ? chipRed : chipOff) }} onClick={() => navigate(`/activities?status=OVERDUE&filter=critical-risk&month=${encodeURIComponent(month)}`)} disabled={!criticalRiskOverdue}>
                <Icon name="warn" size="sm" />
                Críticas vencidas <span style={chipCount}>{Number(criticalRiskOverdue || 0)}</span>
              </button>
              <button type="button" style={{ ...chipBtn, ...(repeatedFailuresCount ? chipAmber : chipOff) }} onClick={() => navigate(`/activities?filter=bad-condition&month=${encodeURIComponent(month)}`)} disabled={!repeatedFailuresCount}>
                <Icon name="warn" size="sm" />
                Reincidencia <span style={chipCount}>{repeatedFailuresCount}</span>
              </button>
              <button type="button" style={{ ...chipBtn, ...(dteCount ? chipAmber : chipOff) }} onClick={() => navigate(`/inventory?filter=predictive-dte&month=${encodeURIComponent(month)}`)} disabled={!dteCount}>
                <Icon name="drop" size="sm" />
                Inventario en riesgo <span style={chipCount}>{dteCount}</span>
              </button>
              <button type="button" style={{ ...chipBtn, ...(overloadHotCount ? chipRed : chipOff) }} onClick={() => navigate(`/activities?month=${encodeURIComponent(month)}`)} disabled={!overloadHotCount}>
                <Icon name="user" size="sm" />
                Sobrecarga técnica <span style={chipCount}>{overloadHotCount}</span>
              </button>
              <button type="button" style={{ ...chipBtn, ...(anomaliesCount ? chipRed : chipOff) }} onClick={() => navigate(`/analysis?tab=consumption&filter=anomalies&month=${encodeURIComponent(month)}`)} disabled={!anomaliesCount}>
                <Icon name="alert" size="sm" />
                Consumo fuera de patrón <span style={chipCount}>{anomaliesCount}</span>
              </button>
            </div>
          </div>

{showPriority ? <SupervisorPriorityTodayPanel month={month} navigate={navigate} canSeePriorityQueue={canSeePriorityQueue} pqLoading={pqLoading} pqError={pqError} pqItems={adminPriorityQueueItems} pqTotal={adminPriorityQueueItems.length} refreshPQ={refreshPQ} /> : null}
        </div>
      </div>
    </PanelCard>
  );
}
function SupervisorPriorityTodayPanel({ month, navigate, canSeePriorityQueue, pqLoading, pqError, pqItems, pqTotal, refreshPQ }) {
  const priorityItems = (Array.isArray(pqItems) ? pqItems : [])
    .map((x) => formatPriorityItem(x, month))
    .slice(0, Math.max(6, Math.min(10, Number(pqTotal || 0) || 6)));

  return (
    <PanelCard
      title="Prioridad de hoy"
      subtitle={pqLoading ? "Ordenando prioridades…" : pqTotal > 0 ? `Mostrando ${priorityItems.length} de ${pqTotal} caso(s) priorizados.` : "No hay prioridades abiertas ahora."}
      right={canSeePriorityQueue ? <button type="button" style={btnAdminGhost} onClick={refreshPQ} disabled={pqLoading}>Actualizar</button> : null}
    >
      {pqError ? <div style={miniError}>{pqError}</div> : null}
      {!canSeePriorityQueue ? (
        <div style={{ fontWeight: 850, color: "#64748b" }}>Disponible solo para supervisor y administrador.</div>
      ) : priorityItems.length === 0 ? (
        <div style={{ fontWeight: 850, color: "#64748b" }}>No hay casos prioritarios en este momento.</div>
      ) : (
        <div
          style={{
            display: "grid",
            gap: 10,
            gridTemplateColumns:
              typeof window !== "undefined" && window.innerWidth >= 1680
                ? "repeat(3, minmax(0, 1fr))"
                : typeof window !== "undefined" && window.innerWidth >= 1220
                ? "repeat(2, minmax(0, 1fr))"
                : "1fr",
          }}
        >
          {priorityItems.map((x, i) => (
            <div key={x.key || i} style={cardRow}>
              <div style={{ height: 6, background: x.stripeColor || "#f59e0b" }} />
              <div style={cardRowBody}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 950, color: "#0f172a" }}>{x.title || priorityTypeLabel(x.type)}</div>
                  <div style={{ marginTop: 6, fontSize: 12, fontWeight: 850, color: "#475569", lineHeight: 1.45 }}>{x.reason || "Sin detalle adicional."}</div>
                  {Array.isArray(x.metaBadges) && x.metaBadges.length ? (
                    <div style={{ marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {x.metaBadges.map((meta, idx) => (
                        <span key={`${x.key || i}-meta-${idx}`} style={{ ...pqBadge, ...pqBadgeInfo }}>{meta}</span>
                      ))}
                    </div>
                  ) : null}
                  <div style={{ marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ ...pqBadge, ...(x.severity === "CRITICAL" || x.severity === "HIGH" ? pqBadgeHigh : pqBadgeWarn) }}>{x.priorityLabel}</span>
                    <span style={{ ...pqBadge, ...pqBadgeInfo }}>{x.categoryLabel || priorityTypeLabel(x.type)}</span>
                    <span style={{ ...pqBadge, ...pqBadgeInfo }}>Responsable: {x.ownerLabel || "Equipo"}</span>
                  </div>
                </div>
                <button type="button" style={btnAdminGhost} onClick={() => navigate(x.link)}>Abrir →</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </PanelCard>
  );
}

/* =========================
  SUP: Desempeño por técnico
========================= */

function SupervisorTechniciansEfficiencyCard({ month, navigate }) {
  const { currentPlantId, loadingPlants } = usePlant();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (loadingPlants) return;
    if (!currentPlantId) return;

    let alive = true;

    async function run() {
      try {
        setErr("");
        setLoading(true);

        const res = await getTechniciansEfficiencyMonthly({ month });
        const list = Array.isArray(res?.items)
          ? res.items
          : Array.isArray(res?.data?.items)
          ? res.data.items
          : [];

        if (!alive) return;
        setItems(list);
      } catch (e) {
        if (!alive) return;
        setErr(e?.message || "Error cargando desempeño por técnico");
        setItems([]);
      } finally {
        if (alive) setLoading(false);
      }
    }

    run();

    return () => {
      alive = false;
    };
  }, [month, currentPlantId, loadingPlants]);

  const visibleItems = items.slice(0, 8);

  return (
    <PanelCard
      title="Desempeño por técnico"
      subtitle="Score del mes (a tiempo vs tarde vs vencidas)"
      right={
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            color: "#64748b",
            fontWeight: 900,
            fontSize: 12,
          }}
        >
          <Icon name="user" size="sm" />
          Ranking
        </span>
      }
    >
      {loading ? (
        <div style={{ fontWeight: 850, color: "#64748b" }}>Cargando…</div>
      ) : err ? (
        <div style={miniError}>{err}</div>
      ) : items.length === 0 ? (
        <div style={{ fontWeight: 850, color: "#64748b" }}>Sin datos de desempeño.</div>
      ) : (
        <>
          <div style={supervisorFocusBox}>
            <div style={{ display: "grid", gap: 10 }}>
              {visibleItems.map((it, idx) => {
                const t = it?.technician || {};
                const score = Number(it?.scorePct || 0);
                const total = Number(it?.totalProgramadas || 0);
                const ontime = Number(it?.aTiempo || 0);
                const late = Number(it?.tarde || 0);
                const overdue = Number(it?.vencidas || 0);

                return (
                  <div key={t.id || idx} style={perfRowCompact}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 950, color: "#0f172a" }}>
                        {t.name || `Técnico ${idx + 1}`}
                      </div>

                      <div
                        style={{
                          marginTop: 4,
                          fontSize: 12,
                          fontWeight: 800,
                          color: "#64748b",
                          lineHeight: 1.35,
                        }}
                      >
                        Total: <b>{total}</b> · A tiempo: <b>{ontime}</b> · Tarde: <b>{late}</b> ·
                        Vencidas: <b>{overdue}</b>
                      </div>
                    </div>

                    <div style={perfBarWrapCompact}>
                      <div
                        style={{
                          ...perfBar,
                          width: `${Math.min(100, Math.max(0, score))}%`,
                        }}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/activities?technicianId=${encodeURIComponent(
                            t.id
                          )}&month=${encodeURIComponent(month)}`
                        )
                      }
                      style={
                        score >= 85 ? chipOkMini : score >= 70 ? chipWarnMini : chipCritMini
                      }
                      title="Ver actividades del técnico"
                    >
                      {score}%
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={supervisorCompactFooter}>
            <span>Mostrando {visibleItems.length} de {items.length}.</span>
            <span>Se compacta para mantener el dashboard limpio.</span>
          </div>

          <div style={{ marginTop: 12, fontSize: 12, fontWeight: 800, color: "#64748b" }}>
            Fórmula: A tiempo=100% · Tarde=60% · Vencidas=20% (ponderado sobre total del mes).
          </div>
        </>
      )}
    </PanelCard>
  );
}

/* =========================
  TECHNICIAN DASHBOARD (panel)
========================= */

function TechnicianPerfectPanel(props) {
  const {
    isMobile = false,
    month,
    donutTotals,
    donutLoading,
    navigate,
    overdueCount,
    unassignedPending,
    conditionReportsOpen,
    loading,
    userId,
    openExecutionModal,
    onOpenEmergencyActivity,
    onOpenReportCondition,
    activities = [],
  } = props;

  const currentMonthTotals = donutTotals || { pending: 0, overdue: 0, completed: 0 };
  const totalMonth =
    Number(currentMonthTotals.pending || 0) +
    Number(currentMonthTotals.overdue || 0) +
    Number(currentMonthTotals.completed || 0);

  const cumplimiento = safePct(currentMonthTotals.completed, totalMonth);

  const kpis = [
    {
      title: "Completadas",
      value: String(currentMonthTotals.completed || 0),
      sub: "Mes seleccionado",
      tone: "green",
      iconName: "check",
    },
    {
      title: "Atrasadas",
      value: String(currentMonthTotals.overdue || 0),
      sub: "Mes seleccionado",
      tone: "red",
      iconName: "clock",
    },
    {
      title: "Pendientes",
      value: String(currentMonthTotals.pending || 0),
      sub: "Mes seleccionado",
      tone: "blue",
      iconName: "alert",
    },
  ];

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <TechnicianActivitiesFocusCard
        month={month}
        navigate={navigate}
        activities={activities}
        loading={loading}
        userId={userId}
        openExecutionModal={openExecutionModal}
      />

      <div
  style={{
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0,1fr))",
    gap: 12,
  }}
>
        {kpis.map((k) => (
          <KpiCard
            key={k.title}
            title={k.title}
            value={k.value}
            sub={k.sub}
            tone={k.tone}
            iconName={k.iconName}
          />
        ))}
      </div>

      <div
  style={{
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
    gap: 12,
    alignItems: "stretch",
  }}
>
        <PanelCard
          title="Mi avance del mes"
          subtitle={`Cumplimiento: ${cumplimiento}% · Mes seleccionado`}
          right={
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#64748b", fontWeight: 900, fontSize: 12 }}>
              <Icon name="calendar" size="sm" />
              {month}
            </span>
          }
        >
          {donutLoading ? (
            <div style={{ fontWeight: 850, color: "#64748b" }}>Cargando&</div>
          ) : (
            <ActivitiesDonut
              month={month}
              completed={Number(currentMonthTotals.completed || 0)}
              pending={Number(currentMonthTotals.pending || 0)}
              overdue={Number(currentMonthTotals.overdue || 0)}
              onClickSlice={(key) => {
                if (key === "OVERDUE") navigate(`/activities?status=OVERDUE&month=${encodeURIComponent(month)}&scope=mine`);
                if (key === "PENDING") navigate(`/activities?status=PENDING&month=${encodeURIComponent(month)}&scope=mine`);
                if (key === "COMPLETED") navigate(`/activities?status=COMPLETED&month=${encodeURIComponent(month)}&scope=mine`);
              }}
              size={210}
              stroke={18}
            />
          )}
        </PanelCard>

        <div style={{ display: "grid", gap: 12, gridTemplateRows: isMobile ? "auto auto" : "1fr 1fr" }}>
          <PanelCard
            title="Alertas operativas"
            subtitle="Lo más importante del técnico"
            right={
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#64748b", fontWeight: 900, fontSize: 12 }}>
                <Icon name="alert" size="sm" />
                Prioridad
              </span>
            }
          >
            <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                style={{ ...btnAdminChip, ...(overdueCount ? chipRedMini : chipOffMini) }}
                onClick={() => navigate(`/activities?status=OVERDUE&month=${encodeURIComponent(month)}&scope=mine`)}
                disabled={!overdueCount}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <Icon name="clock" size="sm" />
                  Mis atrasadas <span style={chipCountMini}>{overdueCount}</span>
                </span>
              </button>

              <button
                type="button"
                style={{ ...btnAdminChip, ...(unassignedPending ? chipBlueMini : chipOffMini) }}
                onClick={() => navigate(`/activities?filter=unassigned&month=${encodeURIComponent(month)}`)}
                disabled={!unassignedPending}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <Icon name="user" size="sm" />
                  Sin técnico <span style={chipCountMini}>{unassignedPending}</span>
                </span>
              </button>

              <button
                type="button"
                style={{ ...btnAdminChip, ...(conditionReportsOpen ? chipRedMini : chipOffMini) }}
                onClick={() => navigate(`/condition-reports?status=OPEN`)}
                disabled={!conditionReportsOpen}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <Icon name="warn" size="sm" />
                  Condición anormal <span style={chipCountMini}>{conditionReportsOpen}</span>
                </span>
              </button>
            </div>
          </PanelCard>

          <PanelCard
            title="Acciones rápidas"
            subtitle="Atajos directos desde el dashboard"
            right={
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#64748b", fontWeight: 900, fontSize: 12 }}>
                <Icon name="tool" size="sm" />
                Operación
              </span>
            }
          >
            <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
              <button type="button" style={{ ...btnAdminPrimary, minHeight: 52 }} onClick={() => onOpenReportCondition?.()}>
                <span style={btnRow}><Icon name="warn" size="sm" />Reportar condición</span>
              </button>
              <button type="button" style={{ ...btnAdminGhost, minHeight: 52 }} onClick={() => onOpenEmergencyActivity?.()}>
                <span style={btnRow}><Icon name="alert" size="sm" />Actividad emergente</span>
              </button>
              <button type="button" style={{ ...btnAdminGhost, minHeight: 52, gridColumn: isMobile ? "auto" : "1 / -1" }} onClick={() => navigate(`/history?month=${encodeURIComponent(month)}`)}>
                <span style={btnRow}><Icon name="history" size="sm" />Ver historial</span>
              </button>
            </div>
          </PanelCard>
        </div>
      </div>
    </div>
  );
}

function TechnicianActivitiesFocusCard({
  month,
  navigate,
  activities = [],
  loading,
  userId,
  openExecutionModal,
}) {
  const [range, setRange] = useState("TODAY");
  const [includeUnassigned, setIncludeUnassigned] = useState(true);

  const now = new Date();
  const todayYMD = toLocalYMD(now);

  const fromTo = useMemo(() => {
    if (range === "TODAY") return { from: startOfDay(now), to: endOfDay(now) };
    if (range === "WEEK") return { from: startOfWeekMonday(now), to: endOfWeekMonday(now) };

    const y = Number(String(month || "").slice(0, 4));
    const m = Number(String(month || "").slice(5, 7));

    if (Number.isFinite(y) && Number.isFinite(m)) {
      const f = new Date(y, m - 1, 1, 0, 0, 0, 0);
      const t = new Date(y, m, 0, 23, 59, 59, 999);
      return { from: f, to: t };
    }

    return { from: startOfDay(now), to: endOfDay(now) };
  }, [range, month, now]);

   const filteredItems = useMemo(() => {
    return (activities || []).filter((a) => {
      if (!a?.dateISO || !isValidDate(a.dateISO)) return false;

      const technicianId = a?.technicianId ?? a?.technician?.id;
      const isMine = String(technicianId || "") === String(userId || "");
      const isUnassigned = technicianId == null || String(technicianId) === "";

      const allowedByAssignment = includeUnassigned ? isMine || isUnassigned : isMine;
      if (!allowedByAssignment) return false;

      const status = String(a?.computedStatus || "").toUpperCase();
      const dateLabel = a?.dateLabel || "";

      // En "Hoy" deben entrar:
      // 1) las actividades de hoy
      // 2) las atrasadas
      if (range === "TODAY") {
        return dateLabel === todayYMD || status === "ATRASADA";
      }

      const okRange = inRange(a.dateISO, fromTo.from, fromTo.to);
      return okRange;
    });
  }, [activities, fromTo, includeUnassigned, userId, range, todayYMD]);

  const grouped = useMemo(() => {
    const overdue = [];
    const pending = [];
    const upcoming = [];

    for (const a of filteredItems) {
      if (a.computedStatus === "Completada") continue;

      if (a.computedStatus === "Atrasada") {
        overdue.push(a);
        continue;
      }

      if (a.dateLabel && a.dateLabel <= todayYMD && !a.isFuture) {
        pending.push(a);
        continue;
      }

      upcoming.push(a);
    }

        overdue.sort((x, y) => new Date(x.dateISO).getTime() - new Date(y.dateISO).getTime());
    pending.sort((x, y) => new Date(x.dateISO).getTime() - new Date(y.dateISO).getTime());
    upcoming.sort((x, y) => new Date(x.dateISO).getTime() - new Date(y.dateISO).getTime());

    // En vista "Hoy", primero las actividades de hoy y luego las atrasadas
    if (range === "TODAY") {
      pending.sort((x, y) => {
        const xToday = x?.dateLabel === todayYMD ? 0 : 1;
        const yToday = y?.dateLabel === todayYMD ? 0 : 1;
        if (xToday !== yToday) return xToday - yToday;
        return new Date(x.dateISO).getTime() - new Date(y.dateISO).getTime();
      });
    }

    return { overdue, pending, upcoming };
    }, [filteredItems, todayYMD, range]);

  const stats = {
    overdue: grouped.overdue.length,
    pending: grouped.pending.length,
    upcoming: grouped.upcoming.length,
    total: grouped.overdue.length + grouped.pending.length + grouped.upcoming.length,
    executable: grouped.overdue.length + grouped.pending.length,
  };

  const title =
    range === "TODAY"
      ? "Mis actividades de hoy"
      : range === "WEEK"
      ? "Mis actividades de la semana"
      : "Mis actividades del mes";

  return (
    <PanelCard
      title={title}
      subtitle="Primero ves lo urgente: atrasadas, pendientes y próximas"
      right={
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#64748b", fontWeight: 900, fontSize: 12 }}>
          <Icon name="tool" size="sm" />
          Operación
        </span>
      }
    >
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" onClick={() => setRange("TODAY")} style={{ ...segBtn, ...(range === "TODAY" ? segOn : segOff) }}>
            Hoy
          </button>
          <button type="button" onClick={() => setRange("WEEK")} style={{ ...segBtn, ...(range === "WEEK" ? segOn : segOff) }}>
            Semana
          </button>
          <button type="button" onClick={() => setRange("MONTH")} style={{ ...segBtn, ...(range === "MONTH" ? segOn : segOff) }}>
            Mes
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIncludeUnassigned((v) => !v)}
          style={{ ...segBtn, ...(includeUnassigned ? segOn : segOff) }}
        >
          {includeUnassigned ? "Mis + Sin técnico" : "Solo mis actividades"}
        </button>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => navigate(`/activities?filter=unassigned&month=${encodeURIComponent(month)}`)}
            style={btnAdminGhost}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <Icon name="user" size="sm" />
              Sin técnico →
            </span>
          </button>
        </div>
      </div>

      <div
        style={{
          marginTop: 12,
          border: "1px solid rgba(226,232,240,0.95)",
          borderRadius: 16,
          padding: 12,
          background: "rgba(248,250,252,0.9)",
          display: "grid",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ fontWeight: 950, color: "#0f172a" }}>Resumen del periodo</div>
          <div style={{ fontSize: 12, fontWeight: 900, color: "#64748b" }}>
            Ejecutables ahora: <b style={{ color: "#0f172a" }}>{stats.executable}</b>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 10 }}>
          <MiniStatCard label="Atrasadas" value={stats.overdue} valueColor="#991b1b" />
          <MiniStatCard label="Pendientes" value={stats.pending} valueColor="#b45309" />
          <MiniStatCard label="Próximas" value={stats.upcoming} valueColor="#1d4ed8" />
          <MiniStatCard label="Total" value={stats.total} valueColor="#0f172a" />
        </div>
      </div>

      <div style={{ marginTop: 14, display: "grid", gap: 14 }}>
        {loading ? (
          <div style={{ fontWeight: 850, color: "#64748b" }}>Cargando…</div>
        ) : stats.total === 0 ? (
          <div style={{ fontWeight: 850, color: "#64748b" }}>No hay actividades para este filtro.</div>
        ) : (
          <>
            <ActivitiesSection
              title="Atrasadas"
              tone="red"
              items={grouped.overdue}
              month={month}
              navigate={navigate}
              openExecutionModal={openExecutionModal}
              emptyText="No tienes actividades atrasadas."
            />

            <ActivitiesSection
              title="Pendientes"
              tone="amber"
              items={grouped.pending}
              month={month}
              navigate={navigate}
              openExecutionModal={openExecutionModal}
              emptyText="No tienes actividades pendientes."
            />

            <ActivitiesSection
              title="Próximas"
              tone="blue"
              items={grouped.upcoming}
              month={month}
              navigate={navigate}
              openExecutionModal={openExecutionModal}
              emptyText="No tienes actividades próximas."
            />
          </>
        )}
      </div>
    </PanelCard>
  );
}

function ActivitiesSection({
  title,
  tone = "blue",
  items = [],
  month,
  navigate,
  openExecutionModal,
  emptyText,
}) {
  const toneMap = {
    red: {
      bg: "rgba(254,242,242,0.9)",
      bd: "rgba(254,202,202,0.95)",
      title: "#991b1b",
    },
    amber: {
      bg: "rgba(255,251,235,0.9)",
      bd: "rgba(253,230,138,0.95)",
      title: "#92400e",
    },
    blue: {
      bg: "rgba(239,246,255,0.9)",
      bd: "rgba(191,219,254,0.95)",
      title: "#1d4ed8",
    },
  };

  const c = toneMap[tone] || toneMap.blue;

  return (
    <div
      style={{
        border: `1px solid ${c.bd}`,
        borderRadius: 16,
        background: c.bg,
        padding: 12,
        display: "grid",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <div style={{ fontWeight: 950, color: c.title, fontSize: 15 }}>
          {title} <span style={{ color: "#0f172a" }}>({items.length})</span>
        </div>
      </div>

      {items.length === 0 ? (
        <div style={{ fontSize: 13, fontWeight: 800, color: "#64748b" }}>{emptyText}</div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {items.map((a) => (
            <TechnicianActivityCard
              key={a.id}
              activity={a}
              month={month}
              navigate={navigate}
              openExecutionModal={openExecutionModal}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TechnicianActivityCard({ activity, month, navigate, openExecutionModal }) {
  const todayYMD = toLocalYMD(new Date());

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <ActivityCard
        activity={activity}
        todayYMD={todayYMD}
        onOpen={() => openExecutionModal?.(activity.executionId || activity.id)}
        techs={[]}
        onAssignTech={() => {}}
        assigningId={null}
        canAssignTech={false}
        canCompleteActivities={true}
      />

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
        <button
          type="button"
          style={btnAdminGhost}
          onClick={() =>
            navigate(
              `/activities?month=${encodeURIComponent(month)}&executionId=${encodeURIComponent(
                activity?.executionId || activity?.id
              )}`
            )
          }
        >
          <span style={btnRow}>
            <Icon name="search" size="sm" />
            Ver detalle
          </span>
        </button>
      </div>
    </div>
  );
}

function useIsMobile(breakpoint = 820) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth <= breakpoint : false
  );

  useEffect(() => {
    const onResize = () => {
      setIsMobile(window.innerWidth <= breakpoint);
    };

    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);

  return isMobile;
}

 /* ================= PAGE ================= */

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentPlantId, loadingPlants } = usePlant();
  const isMobile = useIsMobile();

  const [month, setMonth] = useState(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    return y + "-" + m;
  });

  const role = String(user?.role || "").toUpperCase();
  const isAdmin = role === "ADMIN";
  const isSupervisor = role === "SUPERVISOR";
  const isTech = role === "TECHNICIAN";

  const [techDashboardActivities, setTechDashboardActivities] = useState([]);
  const [techDashboardLoading, setTechDashboardLoading] = useState(false);

  const [appSettings, setAppSettings] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(false);

  const predictiveEnabled = Boolean(appSettings?.predictiveAlertsEnabled ?? true);
  const overloadEnabled = Boolean(appSettings?.technicianOverloadEnabled ?? true);
  const aiEnabled = Boolean(appSettings?.aiSummaryEnabled ?? true);

  const canSeePredictive = (isAdmin || isSupervisor) && predictiveEnabled;
  const canSeeOverload = !isTech && overloadEnabled;
  const canSeePriorityQueue = (isAdmin || isSupervisor) && predictiveEnabled;
  const canSeeUsers = isAdmin;
  const canSeeMonthlyDonut = true;
  const canSeeInventory = !isTech;

  const { connected } = useRealtimeAlerts({ enabled: !isTech });

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [summary, setSummary] = useState(null);
  const [toast, setToast] = useState(null);

  const [openExecute, setOpenExecute] = useState(false);
  const [openScheduleActivity, setOpenScheduleActivity] = useState(false);
  const [openEmergencyActivity, setOpenEmergencyActivity] = useState(false);
  const [openReportConditionDashboard, setOpenReportConditionDashboard] = useState(false);
  const [executeId, setExecuteId] = useState(null);
  const [completePulse, setCompletePulse] = useState(false);
  const [completePulseText, setCompletePulseText] = useState({
    title: "Actividad completada",
    subtitle: "Cambios guardados correctamente",
  });

  const triggerCompletePulse = useCallback((title, subtitle = "Cambios guardados correctamente") => {
    setCompletePulseText({ title, subtitle });
    setCompletePulse(true);
    window.clearTimeout(triggerCompletePulse._t);
    triggerCompletePulse._t = window.setTimeout(() => setCompletePulse(false), 1000);
  }, []);


  const openExecutionModal = useCallback((executionId) => {
    if (!executionId) return;
    setExecuteId(executionId);
    setOpenExecute(true);
  }, []);

  const [donutTotals, setDonutTotals] = useState({
    pending: 0,
    overdue: 0,
    completed: 0,
  });
  const [donutLoading, setDonutLoading] = useState(false);

  const [adminCounts, setAdminCounts] = useState({ routes: 0, equipments: 0 });
  const [adminCountsLoading, setAdminCountsLoading] = useState(false);
  const [adminCountsError, setAdminCountsError] = useState("");

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

  const [aiState, setAiState] = useState({
    loading: false,
    error: "",
    data: null,
  });
  const aiLang = "es";
  const canForceRefreshAi = String(user?.role || "").toUpperCase() === "ADMIN";

  const aiCacheRef = useRef(new Map());
  const aiInflightRef = useRef(new Map());
  const aiLoadedRef = useRef("");
  const aiCacheTtlMs = 5 * 60 * 1000; // 5 min

  const loadAiSummary = useCallback(
    async ({ force = false } = {}) => {
      if (!currentPlantId) return;

      const cacheKey = `${currentPlantId}__${month}__${aiLang}`;
      const nowTs = Date.now();

      if (!force) {
        const cached = aiCacheRef.current.get(cacheKey);
        if (cached && nowTs - cached.savedAt < aiCacheTtlMs) {
          setAiState({
            loading: false,
            error: "",
            data: {
              ...cached.data,
              cached: true,
            },
          });
          return;
        }
      }

      if (!force && aiInflightRef.current.has(cacheKey)) {
        try {
          setAiState((p) => ({ ...p, loading: true, error: "" }));
          const samePromise = aiInflightRef.current.get(cacheKey);
          const res = await samePromise;

          setAiState({
            loading: false,
            error: "",
            data: {
              ...res,
              cached: false,
            },
          });
        } catch (e) {
          const msg =
            e?.status === 429 || String(e?.message || "").includes("429")
              ? "Se alcanzó el límite temporal de solicitudes de IA. Espera unos segundos e intenta de nuevo."
              : e?.response?.data?.error ||
                e?.message ||
                "Error cargando resumen IA";

          setAiState({
            loading: false,
            error: msg,
            data: null,
          });
        }
        return;
      }

      try {
        setAiState((p) => ({ ...p, loading: true, error: "" }));

        const requestPromise = getAiSummary({
          period: month,
          plantId: currentPlantId,
          lang: aiLang,
        });

        aiInflightRef.current.set(cacheKey, requestPromise);

        const res = await requestPromise;

        aiCacheRef.current.set(cacheKey, {
          savedAt: Date.now(),
          data: res,
        });

        setAiState({
          loading: false,
          error: "",
          data: {
            ...res,
            cached: false,
          },
        });
      } catch (e) {
        const msg =
          e?.status === 429 || String(e?.message || "").includes("429")
            ? "Se alcanzó el límite temporal de solicitudes de IA. Espera unos segundos e intenta de nuevo."
            : e?.response?.data?.error ||
              e?.message ||
              "Error cargando resumen IA";

        setAiState({
          loading: false,
          error: msg,
          data: null,
        });
      } finally {
        aiInflightRef.current.delete(cacheKey);
      }
    },
    [month, currentPlantId, aiLang]
  );

  const loadTechDashboardActivities = useCallback(async () => {
    if (!isTech) return;
    if (!currentPlantId) return;

    try {
      setTechDashboardLoading(true);

      const res = await getExecutions({
        completedRange: "MONTH",
        month,
        futureWindow: "MONTH",
      });

      const list = Array.isArray(res?.items)
        ? res.items
        : Array.isArray(res?.data?.items)
        ? res.data.items
        : Array.isArray(res)
        ? res
        : [];

      const todayYMD = toLocalYMD(new Date());
      const normalized = list
        .map((ex) => normalizeExecutionToActivity(ex, todayYMD))
        .filter((item) => item.computedStatus !== "Completada");

      setTechDashboardActivities(normalized);
    } catch (e) {
      setTechDashboardActivities([]);
    } finally {
      setTechDashboardLoading(false);
    }
  }, [isTech, currentPlantId, month]);
  const forceRefreshAi = useCallback(async () => {
    if (!currentPlantId || !canForceRefreshAi) return;

    const cacheKey = `${currentPlantId}__${month}__${aiLang}`;
    aiCacheRef.current.delete(cacheKey);
    aiInflightRef.current.delete(cacheKey);

    try {
      setAiState((p) => ({ ...p, loading: true, error: "" }));
      await refreshAiSummary({
        period: month,
        plantId: currentPlantId,
      });
      await loadAiSummary({ force: true });
    } catch (e) {
      const msg =
        e?.status === 429 || String(e?.message || "").includes("429")
          ? "Se alcanzó el límite temporal de solicitudes de IA. Espera unos segundos e intenta de nuevo."
          : e?.response?.data?.error ||
            e?.message ||
            "Error regenerando resumen IA";

      setAiState({
        loading: false,
        error: msg,
        data: null,
      });
    }
  }, [currentPlantId, month, aiLang, canForceRefreshAi, loadAiSummary]);

  const {
    alerts: hookAlerts,
    total: hookTotal,
    loading: alertsLoading,
    error: alertsError,
    refresh: refreshAlerts,
  } = useDashboardAlerts({
    month,
    enabled: !isTech && !!currentPlantId && !loadingPlants,
  });

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

  const showToast = useCallback((message, tone = "blue") => {
    setToast({ message, tone });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(null), 3500);
  }, []);

  const [overload, setOverload] = useState({
    loading: false,
    items: [],
    unassignedCount: 0,
    meta: null,
    error: null,
  });

  const loadOverload = useCallback(async () => {
    if (!canSeeOverload) return;
    if (!currentPlantId) return;

    setOverload((p) => ({ ...p, loading: true, error: null }));
    try {
      const data = await getTechnicianOverload({
        windowDays: 7,
        overdueLookbackDays: 30,
        capacityPerDay: 6,
        warnRatio: 1.1,
        criticalRatio: 1.4,
      });

      setOverload({
        loading: false,
        items: Array.isArray(data?.items) ? data.items : [],
        unassignedCount: Number(data?.unassignedCount ?? 0),
        meta: data?.meta ?? null,
        error: null,
      });
    } catch (e) {
      setOverload({
        loading: false,
        items: [],
        unassignedCount: 0,
        meta: null,
        error: e?.message || "Error cargando sobrecarga",
      });
    }
  }, [canSeeOverload, currentPlantId]);

  const load = useCallback(async () => {
    if (!currentPlantId) return;

    try {
      setErr("");
      setLoading(true);
      const json = await getDashboardSummary({ month });
      setSummary(json || null);
    } catch (e) {
      setErr(e?.message || "Error cargando dashboard");
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [month, currentPlantId]);

  const loadMonthly = useCallback(async () => {
    if (!currentPlantId) return;

    setDonutLoading(true);
    try {
      const res = isTech
        ? await getDashboardMonthlyActivitiesMe({ month })
        : await getDashboardMonthlyActivities({ month });

      const d = res?.data ?? res ?? {};
      setDonutTotals({
        pending: Number(d.pending || 0),
        overdue: Number(d.overdue || 0),
        completed: Number(d.completed || 0),
      });
    } catch (e) {
      setDonutTotals({ pending: 0, overdue: 0, completed: 0 });
    } finally {
      setDonutLoading(false);
    }
  }, [month, isTech, currentPlantId]);

  const loadMonthlyActivities = useCallback(
    async (ym) => {
      if (!currentPlantId) {
        return { pending: 0, overdue: 0, completed: 0 };
      }

      try {
        const res = await getDashboardMonthlyActivities({ month: ym });
        const d = res?.data ?? res ?? {};
        return {
          pending: Number(d.pending || 0),
          overdue: Number(d.overdue || 0),
          completed: Number(d.completed || 0),
        };
      } catch {
        return { pending: 0, overdue: 0, completed: 0 };
      }
    },
    [currentPlantId]
  );

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

  const loadAdminCounts = useCallback(async () => {
    if (!isAdmin) return;
    if (!currentPlantId) return;

    try {
      setAdminCountsError("");
      setAdminCountsLoading(true);

      const res = await getDashboardAdminCounts();
      const data = res?.data ?? res ?? {};

      setAdminCounts({
        routes: Number(data?.routesCount || 0),
        equipments: Number(data?.equipmentsCount || 0),
      });
    } catch (e) {
      setAdminCounts({ routes: 0, equipments: 0 });
      setAdminCountsError(e?.message || "Error cargando KPIs admin");
    } finally {
      setAdminCountsLoading(false);
    }
  }, [isAdmin, currentPlantId]);

  useEffect(() => {
  if (loadingPlants) return;
  if (!currentPlantId) return;

  load();
  loadMonthly();
  loadAppSettings();
  loadOverload();
  loadAdminCounts();
}, [
  loadingPlants,
  currentPlantId,
  month,
  load,
  loadMonthly,
  loadAppSettings,
  loadOverload,
  loadAdminCounts,
]);

useEffect(() => {
  if (loadingPlants) return;
  if (!currentPlantId) return;

  if (!aiEnabled) {
    aiLoadedRef.current = "";
    setAiState({
      loading: false,
      error: "",
      data: null,
    });
    return;
  }

  const loadKey = `${currentPlantId}__${month}__${aiLang}`;
  if (aiLoadedRef.current === loadKey) return;
  aiLoadedRef.current = loadKey;

  loadAiSummary();
}, [loadingPlants, currentPlantId, aiEnabled, month, aiLang, loadAiSummary]);

  const inventoryLow = summary?.inventory?.lowStock || [];
  const criticalEquipments = summary?.criticalEquipments || [];
  const topOverdue = summary?.top?.overdueEquipments || [];
  const upcomingMeta = summary?.upcomingMeta || null;

  const mergedAlerts = useMemo(() => {
    if (isTech) return { ...(summary?.alerts || {}) };
    return { ...(summary?.alerts || {}), ...(hookAlerts || {}) };
  }, [summary, hookAlerts, isTech]);

  const conditionReportsOpen = Number(mergedAlerts?.conditionReportsOpen || 0);
  const criticalExecutions = Number(summary?.criticalExecutions ?? mergedAlerts?.criticalExecutions ?? 0);
  const repeatedFailuresCount = Number(mergedAlerts?.repeatedFailuresCount ?? mergedAlerts?.repeatedFailures ?? 0);

  const overdueCount = Number(mergedAlerts.overdueActivities || 0);
  const lowStockCount = Number(mergedAlerts.lowStockCount || 0);
  const unassignedPending = Number(mergedAlerts.unassignedPending || 0);
  const equipmentsWithoutRoutes = Number(mergedAlerts.equipmentWithoutRoutes || 0);
  const criticalRiskOverdue = Number(mergedAlerts.criticalRiskOverdueCount || 0);

  const redTotal =
    Number(mergedAlerts.overdueActivities || 0) +
    Number(mergedAlerts.badConditionCount || 0) +
    Number(criticalExecutions || 0) +
    repeatedFailuresCount +
    Number(conditionReportsOpen || 0);

  const amberTotal =
    Number(mergedAlerts.lowStockCount || 0) +
    Number(mergedAlerts.unassignedPending || 0) +
    Number(mergedAlerts.outOfRangeConsumption || 0) +
    Number(mergedAlerts.equipmentWithoutRoutes || 0);

  const total = useMemo(() => {
    const base = redTotal + amberTotal;
    const pred = canSeePredictive ? Number(predTotal || 0) : 0;
    return base + pred;
  }, [redTotal, amberTotal, predTotal, canSeePredictive]);

  const prevRef = useRef({ conditionReportsOpen: 0, criticalExecutions: 0 });
  useEffect(() => {
    if (isTech) return;
    if (!mergedAlerts) return;

    const prevOpen = prevRef.current.conditionReportsOpen;
    const prevCrit = prevRef.current.criticalExecutions;

    if (conditionReportsOpen > prevOpen) showToast(`Nuevo reporte de condición (abiertos: ${conditionReportsOpen})`, "red");
    if (criticalExecutions > prevCrit) showToast(`Se marcó una ejecución como CRÍTICA (total mes: ${criticalExecutions})`, "red");

    prevRef.current.conditionReportsOpen = conditionReportsOpen;
    prevRef.current.criticalExecutions = criticalExecutions;
  }, [conditionReportsOpen, criticalExecutions, mergedAlerts, isTech, showToast]);

  const goActivities = useCallback(
    (filter) => {
      const p = new URLSearchParams();
      if (filter) p.set("filter", filter);
      p.set("month", month);
      navigate(`/activities?${p.toString()}`);
    },
    [navigate, month]
  );

  useEffect(() => {
  if (loadingPlants) return;
  if (!currentPlantId) return;
  if (!isTech) return;

  loadTechDashboardActivities();
}, [loadingPlants, currentPlantId, isTech, loadTechDashboardActivities]);

  useEffect(() => {
    if (isTech) return;

    const handler = (ev) => {
      const { eventName, payload } = ev.detail || {};
      if (!eventName) return;

      const payloadPlantId = payload?.plantId != null ? String(payload.plantId) : "";
      const activePlantId = currentPlantId != null ? String(currentPlantId) : "";
      const samePlant = !payloadPlantId || !activePlantId || payloadPlantId === activePlantId;
      if (!samePlant) return;

      if (eventName === "condition-report.created") {
        showToast("Nuevo reporte de condición", "red");
        refreshAlerts?.();
        load?.();
      }

      if (eventName === "execution.critical") {
        showToast("Se marcó una ejecución como CRÍTICA", "red");
        refreshAlerts?.();
        refreshPred?.();
        load?.();
      }
    };

    window.addEventListener("lubriplan:sse", handler);
    return () => window.removeEventListener("lubriplan:sse", handler);
  }, [currentPlantId, isTech, refreshAlerts, refreshPred, load, showToast]);

  const upcomingActivities = useMemo(() => {
    const upcoming = Array.isArray(summary?.upcoming) ? summary.upcoming : [];
    const todayYMD = toLocalYMD(new Date());
    return upcoming.map((e) => normalizeExecutionToActivity(e, todayYMD));
  }, [summary]);

  const myTechId = user?.technicianId != null ? Number(user.technicianId) : null;

  const myUpcoming = useMemo(() => {
    if (!isTech) return [];
    if (!Number.isFinite(myTechId)) return [];
    return (upcomingActivities || []).filter((a) => Number(a?.technicianId) === Number(myTechId));
  }, [isTech, upcomingActivities, myTechId]);

  const unassignedUpcoming = useMemo(() => {
    if (!isTech) return [];
    return (upcomingActivities || []).filter((a) => a?.technicianId == null);
  }, [isTech, upcomingActivities]);

  const overloadHotItems = useMemo(() => {
    const items = overload?.items || [];
    return items.filter((it) => {
      const lvl = String(it?.level || "OK").toUpperCase();
      return lvl === "WARN" || lvl === "CRITICAL";
    });
  }, [overload]);

  const common = {
    isMobile,
    user,
    role,
    month,
    setMonth,
    loading,
    err,
    summary,
    appSettings,
    settingsLoading,
    aiEnabled,
    predictiveEnabled,
    overloadEnabled,
    openExecutionModal,

    navigate,
    goActivities,

    mergedAlerts,
    alertsLoading,
    alertsError,
    refreshAlerts,
    total,
    overdueCount,
    lowStockCount,
    unassignedPending,
    equipmentsWithoutRoutes,
    conditionReportsOpen,
    criticalExecutions,

    techDashboardActivities,
techDashboardLoading,
loadTechDashboardActivities,

    canSeePredictive,
    predAlerts,
    predTotal,
    predLoading,
    predError,
    refreshPred,
    criticalRiskOverdue,

    canSeeMonthlyDonut,
    donutLoading,
    donutTotals,

    inventoryLow,
    canSeeInventory,
    criticalEquipments,
    topOverdue,

    upcomingActivities,
    upcomingMeta,
    myUpcoming,
    unassignedUpcoming,

    canSeeOverload,
    overload,
    overloadHotItems,
    loadOverload,

    connected,
    toast,
    setToast,
    showToast,

    load,
    isAdmin,
    isSupervisor,
    isTech,
    canSeeUsers,

    adminCounts,
    adminCountsLoading,
    adminCountsError,

    aiState,
    loadAiSummary,
    forceRefreshAi,

    loadMonthlyActivities,
    canSeePriorityQueue,
    pqLoading,
    pqError,
    pqItems,
    pqTotal,
    refreshPQ,
  };

  return (
    <MainLayout>
      <style>{`
        @keyframes lpPulse {
          0% { transform: scale(0.96); opacity: 0; }
          60% { transform: scale(1.02); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
      {common.err ? <div style={errorBox}>{common.err}</div> : null}
      {toast ? <Toast message={toast.message} tone={toast.tone} /> : null}

      {isAdmin ? <AdminDashboard {...common} onOpenScheduleActivity={() => setOpenScheduleActivity(true)} /> : isSupervisor ? <SupervisorDashboard {...common} onOpenScheduleActivity={() => setOpenScheduleActivity(true)} onOpenEmergencyActivity={() => setOpenEmergencyActivity(true)} /> : <TechnicianDashboard {...common} onOpenEmergencyActivity={() => setOpenEmergencyActivity(true)} onOpenReportCondition={() => setOpenReportConditionDashboard(true)} />}

      <ScheduleActivityModal
        open={openScheduleActivity}
        onClose={() => setOpenScheduleActivity(false)}
        onSaved={async () => {
          setOpenScheduleActivity(false);
          await Promise.allSettled([load(), loadMonthly(), refreshAlerts?.()]);
        }}
      />

      <EmergencyActivityModal
        open={openEmergencyActivity}
        onClose={() => setOpenEmergencyActivity(false)}
        onSaved={async () => {
          setOpenEmergencyActivity(false);
          await Promise.allSettled([load(), loadMonthly(), refreshAlerts?.()]);
        }}
      />

      <ReportConditionModal
        open={openReportConditionDashboard}
        onClose={() => setOpenReportConditionDashboard(false)}
        onSaved={async () => {
          setOpenReportConditionDashboard(false);
          await Promise.allSettled([load(), loadMonthly(), refreshAlerts?.()]);
        }}
      />

      <CompleteExecutionModal
        open={openExecute}
        executionId={executeId}
        onClose={() => {
          setOpenExecute(false);
          setExecuteId(null);
        }}
        onSaved={async (updated) => {
          const completedId = Number(updated?.id);

          setOpenExecute(false);
          setExecuteId(null);

          if (Number.isFinite(completedId)) {
            setTechDashboardActivities((prev) =>
              prev.filter((item) => Number(item.executionId || item.id) !== completedId)
            );
          }

          await Promise.allSettled([
            load(),
            loadMonthly(),
            refreshAlerts?.(),
            isTech ? loadTechDashboardActivities() : Promise.resolve(),
          ]);

          triggerCompletePulse("Actividad completada");
        }}
      />

      {completePulse ? (
        <div style={centerOverlay}>
          <div style={centerCard}>
            <div style={centerIconWrap}>
              <Icon name="check" style={{ width: 24, height: 24, color: "#0b1220" }} />
            </div>
            <div style={{ fontWeight: 980, color: "#0f172a", fontSize: 18, lineHeight: 1.15 }}>{completePulseText.title}</div>
            <div style={{ marginTop: 6, fontWeight: 850, color: "#475569", fontSize: 12, lineHeight: 1.35 }}>
              {completePulseText.subtitle}
            </div>
          </div>
        </div>
      ) : null}
    </MainLayout>
  );
}

/* ================= VISTAS POR ROL ================= */

function AdminDashboard(props) {
  const { month, donutTotals, donutLoading, navigate, overdueCount, unassignedPending, lowStockCount, adminCounts, loadMonthlyActivities, overload } =
    props;

  return (
    <>
      <DashTop {...props} title="Panel de Control" executive />

      <AdminPanel
        isMobile={props.isMobile}
        month={month}
        donutTotals={donutTotals}
        donutLoading={donutLoading}
        onClickDonut={(key) => {
          if (key === "OVERDUE") navigate(`/activities?status=OVERDUE&month=${encodeURIComponent(month)}`);
          if (key === "PENDING") navigate(`/activities?status=PENDING&month=${encodeURIComponent(month)}`);
          if (key === "COMPLETED") navigate(`/activities?status=COMPLETED&month=${encodeURIComponent(month)}`);
        }}
        navigate={navigate}
        overdueCount={overdueCount}
        unassignedPending={unassignedPending}
        lowStockCount={lowStockCount}
        totalRoutes={adminCounts?.routes || 0}
        totalEquipments={adminCounts?.equipments || 0}
        loadMonthlyActivities={loadMonthlyActivities}
        overload={overload}
        aiState={props.aiState}
        loadAiSummary={props.loadAiSummary}
        forceRefreshAi={props.forceRefreshAi}
        aiEnabled={props.aiEnabled}
        predictiveEnabled={props.predictiveEnabled}
        canSeeOverload={props.canSeeOverload}
        overloadHotItems={props.overloadHotItems}
        loadOverload={props.loadOverload}
        predAlerts={props.predAlerts}
        predTotal={props.predTotal}
        predLoading={props.predLoading}
        predError={props.predError}
        refreshPred={props.refreshPred}
        criticalRiskOverdue={props.criticalRiskOverdue}
        canSeePriorityQueue={props.canSeePriorityQueue}
        pqLoading={props.pqLoading}
        pqError={props.pqError}
        pqItems={props.pqItems}
        pqTotal={props.pqTotal}
        refreshPQ={props.refreshPQ}
        upcomingActivities={props.upcomingActivities}
        onOpenScheduleActivity={props.onOpenScheduleActivity}
      />

      <AdminMainGrid {...props} />
      <AdminBottomGrid {...props} />
    </>
  );
}

function SupervisorExecutivePanel({
  isMobile,
  month,
  donutTotals,
  donutLoading,
  navigate,
  overdueCount,
  unassignedPending,
  lowStockCount,
  loadMonthlyActivities,
  aiState,
  loadAiSummary,
  forceRefreshAi,
  canForceRefreshAi = false,
  aiEnabled,
  predAlerts,
  predTotal,
  predLoading,
  predError,
  refreshPred,
  criticalRiskOverdue,
  predictiveEnabled,
  canSeePriorityQueue,
  pqLoading,
  pqError,
  pqItems,
  pqTotal,
  refreshPQ,
  onOpenScheduleActivity,
  onOpenEmergencyActivity,
  activitiesNode = null,
  showPriority = true,
}) {
  const [trendsLoading, setTrendsLoading] = useState(false);
  const [trendCounts, setTrendCounts] = useState([]);
  const [trendError, setTrendError] = useState("");
  const months6 = useMemo(() => lastNMonths(6), []);

  useEffect(() => {
    let alive = true;

    async function loadTrends() {
      try {
        setTrendError("");
        setTrendsLoading(true);

        const res = await Promise.all(
          months6.map(async (ym) => {
            const d = await loadMonthlyActivities(ym);
            return { ym, ...(d || {}) };
          })
        );

        if (!alive) return;
        setTrendCounts(res);
      } catch (e) {
        if (!alive) return;
        setTrendError(e?.message || "Error cargando tendencias");
        setTrendCounts([]);
      } finally {
        if (alive) setTrendsLoading(false);
      }
    }

    loadTrends();
    return () => {
      alive = false;
    };
  }, [months6, loadMonthlyActivities]);

  const currentMonthTotals = donutTotals || { pending: 0, overdue: 0, completed: 0 };
  const totalMonth = Number(currentMonthTotals.pending || 0) + Number(currentMonthTotals.overdue || 0) + Number(currentMonthTotals.completed || 0);
  const cumplimientoGlobal = safePct(currentMonthTotals.completed, totalMonth);

  const kpis = [
    {
      title: "Cumplimiento global",
      value: `${cumplimientoGlobal}%`,
      sub: "Mes seleccionado",
      tone: cumplimientoGlobal >= 85 ? "green" : cumplimientoGlobal >= 70 ? "amber" : "red",
      iconName: "check",
    },
    {
      title: "Completadas",
      value: String(currentMonthTotals.completed || 0),
      sub: "Mes seleccionado",
      tone: "green",
      iconName: "check",
    },
    {
      title: "Atrasadas",
      value: String(currentMonthTotals.overdue || 0),
      sub: "Mes seleccionado",
      tone: "red",
      iconName: "clock",
    },
  ];

  const activityByMonth = trendCounts.map((x) => ({
    label: monthLabel(x.ym),
    value: Number(x.pending || 0) + Number(x.overdue || 0) + Number(x.completed || 0),
  }));

  const efficiencyByMonth = trendCounts.map((x) => {
    const total = Number(x.pending || 0) + Number(x.overdue || 0) + Number(x.completed || 0);
    return { label: monthLabel(x.ym), valuePct: safePct(x.completed, total) };
  });

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12 }}>
        {kpis.map((k) => (
          <KpiCard key={k.title} title={k.title} value={k.value} sub={k.sub} tone={k.tone} iconName={k.iconName} />
        ))}
      </div>

      {activitiesNode}

      {aiEnabled ? (
        <div
          style={{
            border: "1px solid rgba(226,232,240,0.95)",
            borderRadius: 16,
            padding: 12,
            background: "rgba(248,250,252,0.9)",
          }}
        >
          <AiSummaryBox
            month={month}
            aiState={aiState}
            onGenerate={loadAiSummary}
            onRefresh={forceRefreshAi}
            canForceRefreshAi={canForceRefreshAi} />
        </div>
      ) : null}

      {trendError ? <div style={miniError}>{trendError}</div> : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1.05fr) minmax(340px, 0.95fr)",
          gap: 12,
          alignItems: "start",
        }}
      >
        <div style={{ display: "grid", gap: 12 }}>
          <MiniBars
            title="Actividades por mes"
            subtitle="Últimos 6 meses"
            data={trendsLoading ? months6.map((ym) => ({ label: monthLabel(ym), value: 0 })) : activityByMonth}
          />

          <MiniLines
            title="Eficiencia operacional"
            subtitle="% completadas vs programadas · últimos 6 meses"
            series={trendsLoading ? months6.map((ym) => ({ label: monthLabel(ym), valuePct: 0 })) : efficiencyByMonth}
          />

          <PanelCard
            title="Acciones rápidas"
            subtitle="Operación diaria del supervisor"
            right={
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#64748b", fontWeight: 900, fontSize: 12 }}>
                <Icon name="tool" size="sm" />
                Atajos
              </span>
            }
          >
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button style={btnAdminPrimary} onClick={() => navigate(`/activities?month=${encodeURIComponent(month)}`)}>
                <span style={btnRow}>
                  <Icon name="search" size="sm" />
                  Ir a actividades →
                </span>
              </button>

              <button style={btnAdminGhost} onClick={() => onOpenScheduleActivity?.()}>
                <span style={btnRow}>
                  <Icon name="plus" size="sm" />
                  Programar actividad →
                </span>
              </button>

              <button style={btnAdminGhost} onClick={() => onOpenEmergencyActivity?.()}>
                <span style={btnRow}>
                  <Icon name="warn" size="sm" />
                  Registrar emergente →
                </span>
              </button>

              <button style={btnAdminGhost} onClick={() => navigate("/condition-reports?status=OPEN")}>
                <span style={btnRow}>
                  <Icon name="alert" size="sm" />
                  Ver reportes de condición →
                </span>
              </button>

              <button style={btnAdminGhost} onClick={() => navigate("/inventory")}>
                <span style={btnRow}>
                  <Icon name="drop" size="sm" />
                  Inventario {lowStockCount > 0 ? <span style={dotWarnTiny} /> : null} →
                </span>
              </button>

              <button style={btnAdminGhost} onClick={() => navigate("/analysis")}>
                <span style={btnRow}>
                  <Icon name="search" size="sm" />
                  Ir a análisis →
                </span>
              </button>
            </div>
          </PanelCard>
        </div>

        <SupervisorDistributionAlertsPanel
          month={month}
          donutTotals={donutTotals}
          donutLoading={donutLoading}
          navigate={navigate}
          overdueCount={overdueCount}
          unassignedPending={unassignedPending}
          lowStockCount={lowStockCount}
          predAlerts={predAlerts}
          predTotal={predTotal}
          predLoading={predLoading}
          predError={predError}
          refreshPred={refreshPred}
          predictiveEnabled={predictiveEnabled}
          criticalRiskOverdue={criticalRiskOverdue}
          canSeePriorityQueue={canSeePriorityQueue}
          pqLoading={pqLoading}
          pqError={pqError}
          pqItems={pqItems}
          pqTotal={pqTotal}
          refreshPQ={refreshPQ}
          showPriority={false}
        />
      </div>

      <SupervisorPriorityTodayPanel
        month={month}
        navigate={navigate}
        canSeePriorityQueue={canSeePriorityQueue}
        pqLoading={pqLoading}
        pqError={pqError}
        pqItems={pqItems}
        pqTotal={pqTotal}
        refreshPQ={refreshPQ}
      />
    </div>
  );
}
function SupervisorDashboard(props) {
  const { month, upcomingActivities, loading, onOpenScheduleActivity, onOpenEmergencyActivity } = props;

  return (
    <>
      <DashTop {...props} title="Dashboard · Supervisor" />

      <SupervisorExecutivePanel
        {...props}
        onOpenScheduleActivity={onOpenScheduleActivity}
        onOpenEmergencyActivity={onOpenEmergencyActivity}
        activitiesNode={
          <SupervisorActivitiesFocusCard
            month={month}
            navigate={props.navigate}
            upcomingActivities={upcomingActivities}
            loading={loading}
          />
        }
      />

      <SupervisorBottomGrid {...props} />
    </>
  );
}
function TechnicianDashboard(props) {
  const myTechId = props.user?.technicianId != null ? Number(props.user.technicianId) : null;

  return (
    <>
      <DashTop {...props} title="Dashboard · Técnico" />
      <TechnicianPerfectPanel
        {...props}
        userId={myTechId}
        userName={props.user?.name}
        activities={props.techDashboardActivities}
        loading={props.techDashboardLoading}
      />
    </>
  );
}

function normalizeExecutionToActivity(ex, todayYMD) {
  const origin = String(ex?.origin || "ROUTE").toUpperCase();
  const isManual = origin !== "ROUTE";

  const route = ex?.route || {};
  const equipment = isManual ? ex?.equipment || null : route?.equipment || null;

  const instructionsTxt = isManual
    ? ex?.manualInstructions ??
      ex?.manualNotes ??
      ex?.instructions ??
      ex?.notes ??
      ex?.observations ??
      ""
    : route?.instructions ?? "";

  const rawStatus = String(ex?.status || "").toUpperCase();

  const dateISO =
    rawStatus === "COMPLETED"
      ? ex?.executedAt
      : ex?.scheduledAt || ex?.executedAt;

  const dateLabel = dateISO ? toLocalYMD(dateISO) : "";
  const computedStatus =
    rawStatus === "COMPLETED"
      ? "Completada"
      : dateLabel && dateLabel < todayYMD
      ? "Atrasada"
      : "Pendiente";
  const isFuture = computedStatus !== "Completada" && dateLabel && dateLabel > todayYMD;
  const isToday = computedStatus !== "Completada" && dateLabel && dateLabel === todayYMD;

  const overdueDays =
    computedStatus === "Atrasada" && dateISO ? diffDaysLocal(dateISO, new Date()) : 0;

  const plannedLub = !isManual ? route?.lubricant || null : null;
  const plannedLabel = !isManual
    ? plannedLub?.name
      ? `${plannedLub.name}${plannedLub.code ? ` (${plannedLub.code})` : ""}`
      : route?.lubricantType || "—"
    : "—";

  const moves = Array.isArray(ex?.lubricantMovements) ? ex.lubricantMovements : [];
  const usedMove =
    moves.find((m) =>
      ["OUT", "SALIDA", "CONSUMO"].includes(String(m?.type || "").toUpperCase())
    ) ||
    moves[0] ||
    null;

  const usedLub = usedMove?.lubricant || null;
  const usedLabel = usedLub?.name
    ? `${usedLub.name}${usedLub.code ? ` (${usedLub.code})` : ""}`
    : "";

  const activityName = isManual
    ? ex?.manualTitle || "Actividad programada"
    : route?.name || "—";

  const used = Number(ex?.usedQuantity);
  const expected = Number(route?.quantity);
  const hasNumbers =
    !isManual && Number.isFinite(used) && Number.isFinite(expected) && expected > 0;
  const ratio = hasNumbers ? used / expected : null;
  const outOfRange =
    computedStatus === "Completada" && hasNumbers
      ? ratio < 0.7 || ratio > 1.3
      : false;

  return {
    id: ex.id,
    origin,
    isManual,
    computedStatus,
    statusRaw: ex?.status,
    hasEvidence: Boolean(ex?.evidenceImage),
    condition: ex?.condition ?? null,
    notes: ex?.notes ?? ex?.observations ?? "",
    evidenceImage: ex?.evidenceImage ?? null,
    dateISO,
    dateLabel,
    isFuture,
    isToday,
    overdueDays,
    usedQuantity: ex?.usedQuantity ?? null,
    expectedQuantity: route?.quantity ?? null,
    outOfRange,
    ratio,
    activityName,
    routeName: isManual ? "MANUAL" : route?.name || "—",
    routeUnit: !isManual ? route?.unit || "" : "",
    equipment: equipment || null,
    equipmentName: equipment?.name || "—",
    equipmentCode: equipment?.code || equipment?.tag || "",
    equipmentLocation: equipment?.location || "",
    equipmentCriticality: equipment?.criticality || null,
    plannedLubricantLabel: plannedLabel,
    usedLubricantLabel: usedLabel,
    usedLubricantQty: usedMove?.quantity ?? ex?.usedQuantity ?? null,
    usedLubricantUnit: usedLub?.unit || (!isManual ? route?.unit || "" : ""),
    lubricant: plannedLabel,
    quantityLabel:
      !isManual && route?.quantity != null
        ? `${route.quantity}${route.unit ? ` ${route.unit}` : ""} por punto`
        : "—",
    method: !isManual ? route?.method || "—" : "—",
    instructions: String(instructionsTxt || ""),
    technicianId: ex?.technicianId ?? ex?.technician?.id ?? null,
    technician: ex?.technician ?? null,
    technicianName: ex?.technician?.name ?? ex?.technicianName ?? null,
    isUnassigned: !(ex?.technicianId ?? ex?.technician?.id ?? null),
    scheduledAt: ex?.scheduledAt || null,
    executionId: ex?.id ?? null,
  };
}

/* ================= BLOQUES REUSABLES ================= */

function DashTop({ user, role, summary, month, setMonth, load, loading, connected, title, executive = false }) {
  const h1View = executive
    ? { ...h1, fontFamily: EXEC_DISPLAY_FONT, fontWeight: 700, letterSpacing: "-.03em" }
    : h1;
  const subView = executive
    ? { ...sub, fontFamily: EXEC_TEXT_FONT, letterSpacing: ".01em" }
    : sub;
  const headerView = executive
    ? { ...header, fontFamily: EXEC_TEXT_FONT }
    : header;

  return (
    <div style={headerView}>
      <div style={{ minWidth: 0 }}>
        <div style={h1View}>{title}</div>

        <div style={subView}>
          Bienvenido, <b>{user?.name || "—"}</b> · Rol: <b>{roleLabel(role)}</b> · <b>Actualizado:</b> {fmtDateTimeLocal(summary?.updatedAt)}
          {" · "}
          <span style={{ fontWeight: 900, color: connected ? "#166534" : "#b45309", display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: connected ? "#22c55e" : "#f59e0b", display: "inline-block" }} />
            {connected ? "En vivo" : "reconectando"}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={miniLbl}>Mes</span>
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} style={select} />
        </div>

        <button onClick={load} style={btnGhost} disabled={loading}>
          <span style={btnRow}>
            <Icon name="refresh" size="sm" />
            {loading ? "Actualizando..." : "Actualizar"}
          </span>
        </button>
      </div>
    </div>
  );
}

/* ================= GRIDS POR ROL ================= */

function AdminMainGrid(props) {
  return <MainGridBase {...props} />;
}

function SupervisorMainGrid() {
  return null;
}

function TechMainGrid(props) {
  return <MainGridTech {...props} />;
}

function MainGridBase({ canSeeInventory, inventoryLow, loading, navigate, goActivities, month, upcomingActivities, upcomingMeta }) {
  return (
    <div style={grid2}>
      <div style={panel}>
        <div style={panelTitleRow}>
          <div style={panelTitle}>Inventario</div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#64748b", fontWeight: 900, fontSize: 12 }}>
            <Icon name="drop" size="sm" />
            Lubricantes
          </div>
        </div>

        <div style={{ marginTop: 8, color: "#64748b", fontWeight: 800, fontSize: 12 }}>Bajo stock y acciones recomendadas.</div>

        {canSeeInventory ? (
          <div style={{ marginTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ fontWeight: 950, color: "#0f172a" }}>Inventario bajo stock</div>
              <Link to="/inventory" style={seeAll}>
                Ver →
              </Link>
            </div>

            {loading ? (
              <div style={mutedTxt}>Cargando…</div>
            ) : inventoryLow.length === 0 ? (
              <div style={{ ...mutedTxt, marginTop: 8 }}>Sin bajo stock</div>
            ) : (
              <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                {inventoryLow.slice(0, 4).map((l) => (
                  <div key={l.id} style={miniRow}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 950, color: "#0f172a" }}>
                        {l.name} {l.code ? <span style={miniTag}>({l.code})</span> : null}
                      </div>
                      <div style={miniSub}>
                        Stock: <b>{toNum(l.stock)}</b> {l.unit} · Mín: <b>{toNum(l.minStock)}</b> {l.unit}
                      </div>
                    </div>
                    <Chip tone="amber">Faltan {toNum(l.deficit)}</Chip>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={mutedTxt}>No disponible para tu rol.</div>
        )}
      </div>

      <UpcomingBlock title="Próximas actividades" loading={loading} items={upcomingActivities} goActivities={goActivities} navigate={navigate} month={month} showUnassignedButton meta={upcomingMeta} />
    </div>
  );
}

function MiniStatCard({ label, value, valueColor = "#0f172a" }) {
  return (
    <div
      style={{
        borderRadius: 14,
        padding: 10,
        border: "1px solid #eef2f7",
        background: "#fff",
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 900,
          color: "#64748b",
        }}
      >
        {label}
      </div>

      <div
        style={{
          marginTop: 6,
          fontSize: 22,
          fontWeight: 1000,
          color: valueColor,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function MainGridTech({ loading, month, navigate, goActivities, overdueCount, myUpcoming, unassignedUpcoming }) {
  return (
    <div style={grid2}>
      <div style={panel}>
        <div style={panelTitleRow}>
          <div style={panelTitle}>Acciones rápidas</div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#64748b", fontWeight: 900, fontSize: 12 }}>
            <Icon name="tool" size="sm" />
            Atajos
          </div>
        </div>

        <div style={quickBox}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={() => goActivities("")} style={btnPrimary}>
              Ver actividades {overdueCount > 0 ? <span style={dotDanger} /> : null} →
            </button>

            <button onClick={() => navigate(`/activities?month=${encodeURIComponent(month)}`, { state: { openEmergency: true } })} style={btnGhost} title="Registrar trabajo no programado">
              <span style={btnRow}>
                <Icon name="warn" size="sm" />
                Actividad emergente →
              </span>
            </button>

            <button onClick={() => navigate(`/history?month=${encodeURIComponent(month)}`)} style={btnGhost} title="Ver historial">
              <span style={btnRow}>
                <Icon name="history" size="sm" />
                Ver historial →
              </span>
            </button>
          </div>
        </div>
      </div>

      <UpcomingBlock
        title="Mis próximas actividades"
        loading={loading}
        items={myUpcoming}
        goActivities={goActivities}
        navigate={navigate}
        month={month}
        extra={
          unassignedUpcoming.length > 0 ? (
            <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid #eef2f7" }}>
              <div style={{ fontWeight: 950, color: "#0f172a", display: "inline-flex", alignItems: "center", gap: 8 }}>
                <Icon name="user" size="sm" />
                Pendientes sin asignar
              </div>
              <div style={{ marginTop: 4, color: "#64748b", fontWeight: 800, fontSize: 12 }}>Puedes tomarlas si tu supervisor lo indica.</div>

              <div style={{ marginTop: 10, display: "grid", gap: 10, gridTemplateColumns: typeof window !== "undefined" && window.innerWidth >= 1600 ? "repeat(2, minmax(0, 1fr))" : "1fr" }}>
                {unassignedUpcoming.slice(0, 5).map((a) => (
                  <div key={a.id}>
                    <ActivityCard activity={a} onOpen={() => goActivities("")} />
                    <div style={miniLine}>
                      <span style={{ fontWeight: 900 }}>Programada:</span> {a.scheduledAt ? fmtDateTimeLocal(a.scheduledAt) : "—"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null
        }
        showUnassignedButton={false}
        meta={null}
      />
    </div>
  );
}

function UpcomingBlock({
  title,
  loading,
  items,
  goActivities,
  navigate,
  month,
  extra = null,
  showUnassignedButton = false,
  meta = null,
}) {
  const visibleItems = (items || []).slice(0, 6);

  return (
    <div style={panel}>
      <div style={panelTitleRow}>
        <div style={panelTitle}>{title}</div>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            color: "#64748b",
            fontWeight: 900,
            fontSize: 12,
          }}
        >
          <Icon name="calendar" size="sm" />
          Programadas
        </div>
      </div>

      {loading ? (
        <div style={mutedTxt}>Cargando…</div>
      ) : (items || []).length === 0 ? (
        <div style={mutedTxt}>
          No hay actividades en esta lista.
          {meta?.count > 0 ? (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: "#0f172a" }}>
                Pendientes registradas: <b>{meta.count}</b>{" "}
                {meta?.unassigned ? `· Sin técnico: ${meta.unassigned}` : ""}
              </div>

              <button
                onClick={() =>
                  navigate(`/activities?status=PENDING&month=${encodeURIComponent(month)}`)
                }
                style={{ ...seeAllBtnGhost, marginTop: 8 }}
              >
                Ver pendientes del mes →
              </button>
            </div>
          ) : null}
        </div>
      ) : (
        <div style={{ marginTop: 10, display: "grid", gap: 10, gridTemplateColumns: typeof window !== "undefined" && window.innerWidth >= 1600 ? "repeat(2, minmax(0, 1fr))" : "1fr" }}>
          <div style={dashboardUpcomingList}>
            {visibleItems.map((a) => (
              <DashboardUpcomingCard
                key={a.id}
                activity={a}
                month={month}
                navigate={navigate}
              />
            ))}
          </div>

          {extra}

          <div style={{ marginTop: 6, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={() => goActivities("")} style={seeAllBtn}>
              Ir a actividades →
            </button>

            {showUnassignedButton ? (
              <button
                onClick={() =>
                  navigate(`/activities?filter=unassigned&month=${encodeURIComponent(month)}`)
                }
                style={seeAllBtnGhost}
              >
                Sin técnico →
              </button>
            ) : null}
          </div>

          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 850 }}>
            Mostrando {visibleItems.length} de {(items || []).length}.
          </div>
        </div>
      )}
    </div>
  );
}

function DashboardUpcomingCard({ activity, month, navigate, isMobile = false }) {
  const title =
    activity?.routeName ||
    activity?.activityName ||
    activity?.title ||
    activity?.equipment ||
    "Actividad";

  const equipment =
    activity?.equipment ||
    activity?.equipmentName ||
    "Equipo no disponible";

  const technician =
    activity?.technicianName ||
    activity?.technician?.name ||
    (activity?.isUnassigned ? "Sin técnico" : "No asignado");

  const lubricant =
    activity?.lubricant && String(activity.lubricant).trim() !== "—"
      ? activity.lubricant
      : activity?.plannedLubricantLabel && String(activity.plannedLubricantLabel).trim() !== "—"
      ? activity.plannedLubricantLabel
      : "No definido";

  const quantity =
    activity?.quantity && String(activity.quantity).trim() !== "—"
      ? activity.quantity
      : activity?.quantityLabel && String(activity.quantityLabel).trim() !== "—"
      ? activity.quantityLabel
      : "No definida";

  const method =
    activity?.method && String(activity.method).trim() !== "—"
      ? activity.method
      : "No definido";

  return (
    <div style={dashboardUpcomingMetaGridStyle(isMobile)}>
      <div style={dashboardUpcomingCardTop}>
        <div style={{ minWidth: 0 }}>
          <div style={dashboardUpcomingTitle}>{title}</div>
          <div style={dashboardUpcomingDate}>
            <b>Programada:</b> {activity?.scheduledAt ? fmtDateTimeLocal(activity.scheduledAt) : "—"}
          </div>
        </div>

        <button
          type="button"
          style={btnAdminGhostMini}
          onClick={() =>
            navigate(
              `/activities?month=${encodeURIComponent(month)}&executionId=${encodeURIComponent(
                activity?.executionId || activity?.id || ""
              )}`
            )
          }
        >
          Ver →
        </button>
      </div>

      <div style={dashboardUpcomingMetaGridStyle(isMobile)}>
        <div style={dashboardUpcomingMetaBox}>
          <div style={dashboardMetaLabel}>Equipo</div>
          <div style={dashboardMetaValue}>{equipment}</div>
        </div>

        <div style={dashboardUpcomingMetaBox}>
          <div style={dashboardMetaLabel}>Técnico</div>
          <div style={dashboardMetaValue}>{technician}</div>
        </div>

        <div style={dashboardUpcomingMetaBox}>
          <div style={dashboardMetaLabel}>Lubricante</div>
          <div style={dashboardMetaValue}>{lubricant}</div>
        </div>

        <div style={dashboardUpcomingMetaBox}>
          <div style={dashboardMetaLabel}>Cantidad</div>
          <div style={dashboardMetaValue}>{quantity}</div>
        </div>

        <div style={dashboardUpcomingMetaBoxFull}>
          <div style={dashboardMetaLabel}>Método</div>
          <div style={dashboardMetaValue}>{method}</div>
        </div>
      </div>
    </div>
  );
}

function AdminBottomGrid({ isTech, criticalEquipments, topOverdue, loading }) {
  if (isTech) return null;
  return <BottomGrid criticalEquipments={criticalEquipments} topOverdue={topOverdue} loading={loading} />;
}
function SupervisorBottomGrid({ isTech, criticalEquipments, topOverdue, loading }) {
  if (isTech) return null;
  return <BottomGrid criticalEquipments={criticalEquipments} topOverdue={topOverdue} loading={loading} />;
}

function BottomGrid({ criticalEquipments, topOverdue, loading }) {
  return (
    <div style={{ ...grid2, marginTop: 12 }}>
      <div style={panel}>
        <div style={panelTitleRow}>
          <div style={panelTitle}>Equipos críticos</div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#64748b", fontWeight: 900, fontSize: 12 }}>
            <Icon name="equipment" size="sm" />
            Prioridad
          </div>
        </div>

        {loading ? (
          <div style={mutedTxt}>Cargando…</div>
        ) : (criticalEquipments || []).length === 0 ? (
          <div style={mutedTxt}>No hay equipos con criticidad ALTA/CRITICA.</div>
        ) : (
          <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
            {criticalEquipments.slice(0, 6).map((e) => (
              <div key={e.id} style={miniRow}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 950, color: "#0f172a" }}>
                    {e.name} {e.code ? <span style={miniTag}>({e.code})</span> : null}
                  </div>
                  <div style={miniSub}>{e.location || "—"}</div>
                </div>
                <Chip tone="red">{e.criticality || "CRITICA"}</Chip>
              </div>
            ))}
            <div style={note}>Tip: aquí puedes priorizar inspecciones y rutas.</div>
          </div>
        )}
      </div>

      <div style={panel}>
        <div style={panelTitleRow}>
          <div style={panelTitle}>Top equipos con actividades vencidas</div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#64748b", fontWeight: 900, fontSize: 12 }}>
            <Icon name="clock" size="sm" />
            Backlog
          </div>
        </div>

        {loading ? (
          <div style={mutedTxt}>Cargando…</div>
        ) : (topOverdue || []).length === 0 ? (
          <div style={mutedTxt}>Sin vencidas por equipo</div>
        ) : (
          <div style={{ marginTop: 10, display: "grid", gap: 10, gridTemplateColumns: typeof window !== "undefined" && window.innerWidth >= 1600 ? "repeat(2, minmax(0, 1fr))" : "1fr" }}>
            {topOverdue.map((x, idx) => {
              const eq = x?.equipment || {};
              return (
                <div key={eq.id || idx} style={rankRow}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 950, color: "#0f172a" }}>
                      {eq.name || "—"} {eq.code ? <span style={miniTag}>({eq.code})</span> : null}
                    </div>
                    <div style={miniSub}>{eq.location || "—"}</div>
                  </div>

                  <div style={rankBarWrap}>
                    <div style={{ ...rankBar, width: `${Math.min(100, (toNum(x.overdue) / Math.max(1, toNum(topOverdue[0]?.overdue))) * 100)}%` }} />
                  </div>

                  <div style={rankNum}>{toNum(x.overdue)}</div>
                </div>
              );
            })}
            <div style={note}>Tip: útil para atacar backlog.</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================= UI MINI ================= */

const centerOverlay = {
  position: "fixed",
  inset: 0,
  zIndex: 80,
  background: "rgba(2,6,23,0.35)",
  display: "grid",
  placeItems: "center",
  padding: 16,
};

const centerCard = {
  width: "min(340px, 90vw)",
  borderRadius: 16,
  border: "2px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.96)",
  boxShadow: "0 26px 56px rgba(2,6,23,0.22)",
  padding: "14px 14px 12px",
  textAlign: "center",
  animation: "lpPulse 260ms ease-out",
};

const centerIconWrap = {
  width: 50,
  height: 50,
  borderRadius: 16,
  margin: "0 auto 8px",
  display: "grid",
  placeItems: "center",
  background: "rgba(249,115,22,0.92)",
  border: "1px solid rgba(251,146,60,0.85)",
  boxShadow: "inset 0 -6px 12px rgba(255,255,255,0.2)",
};

function Toast({ message, tone = "blue" }) {
  return (
    <div
      style={{
        position: "fixed",
        right: 16,
        bottom: 16,
        zIndex: 9999,
        padding: "10px 12px",
        borderRadius: 14,
        fontWeight: 950,
        boxShadow: "0 12px 28px rgba(2,6,23,0.18)",
        border: "1px solid rgba(0,0,0,0.06)",
        background: tone === "red" ? "#fee2e2" : tone === "amber" ? "#fef3c7" : "#dbeafe",
        color: tone === "red" ? "#991b1b" : tone === "amber" ? "#92400e" : "#1d4ed8",
      }}
    >
      {message}
    </div>
  );
}

function Chip({ children, tone = "gray" }) {
  const bg = tone === "red" ? "#fee2e2" : tone === "amber" ? "#fef3c7" : tone === "green" ? "#dcfce7" : "#f1f5f9";
  const fg = tone === "red" ? "#991b1b" : tone === "amber" ? "#92400e" : tone === "green" ? "#166534" : "#334155";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
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

  /* ================= STYLES ================= */

  const btnRow = { display: "inline-flex", alignItems: "center", gap: 8 };

  const header = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
  alignItems: "flex-start",
  marginBottom: 18,
  padding: "16px 18px",
  borderRadius: 22,
  border: "1px solid rgba(226,232,240,0.95)",
  background: "linear-gradient(135deg, rgba(255,255,255,0.97) 0%, rgba(248,250,252,0.92) 56%, rgba(255,247,237,0.76) 100%)",
  boxShadow: "0 20px 40px rgba(2,6,23,0.06)",
};

  const h1 = { fontSize: 28, fontWeight: 950, color: "#0f172a" };
  const sub = { marginTop: 6, color: "#64748b", fontWeight: 800, fontSize: 12 };

  const miniLbl = { fontSize: 12, fontWeight: 900, color: "#64748b" };
  const select = {
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    padding: "8px 10px",
    fontWeight: 900,
    outline: "none",
  };

  const errorBox = {
    marginBottom: 14,
    background: "#fee2e2",
    border: "1px solid #fecaca",
    padding: 12,
    borderRadius: 12,
    color: "#991b1b",
    fontWeight: 800,
  };

  const grid2 = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
  gap: 12,
  marginTop: 12,
};

  const panel = {
    border: "1px solid rgba(226,232,240,0.95)",
    borderRadius: 18,
    padding: 14,
    background: "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.94) 100%)",
    boxShadow: "0 16px 30px rgba(2,6,23,0.05)",
  };

  const panelTitleRow = {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
  };

  const panelTitle = { fontWeight: 950, color: "#0f172a" };
  const mutedTxt = { marginTop: 10, color: "#64748b", fontWeight: 800 };
  const seeAll = { color: "#0f172a", textDecoration: "none", fontWeight: 950 };
  const miniLine = { marginTop: 6, color: "#94a3b8", fontWeight: 900, fontSize: 12 };

  const quickBox = {
    marginTop: 10,
    borderRadius: 16,
    padding: 12,
    background: "linear-gradient(180deg, rgba(248,250,252,0.96) 0%, rgba(255,255,255,0.94) 100%)",
    border: "1px solid rgba(226,232,240,0.95)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7)",
  };

  const miniRow = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    border: "1px solid #eef2f7",
    borderRadius: 12,
    padding: 10,
    background: "#fff",
  };

  const miniSub = { marginTop: 4, fontSize: 12, fontWeight: 900, color: "#64748b" };
  const miniTag = { color: "#64748b", fontWeight: 950 };
  const note = { marginTop: 10, fontSize: 12, color: "#64748b", fontWeight: 800 };

  const rankRow = {
  display: "grid",
  gridTemplateColumns:
    typeof window !== "undefined" && window.innerWidth <= 820
      ? "1fr"
      : "1fr 160px 34px",
  gap: 10,
  alignItems: "center",
};
  const rankBarWrap = { height: 8, background: "#e5e7eb", borderRadius: 999, overflow: "hidden" };
  const rankBar = { height: "100%", background: "#0f172a", borderRadius: 999, opacity: 0.92 };
  const rankNum = { textAlign: "right", fontWeight: 950, color: "#0f172a" };

  const dotDanger = {
    display: "inline-block",
    width: 8,
    height: 8,
    borderRadius: 999,
    background: "#ef4444",
    marginLeft: 8,
  };

  const dotWarnTiny = {
    display: "inline-block",
    width: 8,
    height: 8,
    borderRadius: 999,
    background: "#f59e0b",
    marginLeft: 8,
  };

  const supervisorFocusBox = {
  maxHeight: 430,
  overflowY: "auto",
  paddingRight: 4,
};

const supervisorFocusGrid = {
  display: "grid",
  gap: 10,
};

const supervisorCompactCard = {
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 14,
  padding: 10,
  background: "rgba(255,255,255,0.92)",
};

const supervisorCompactCardBody = {
  display: "grid",
  gridTemplateColumns:
    typeof window !== "undefined" && window.innerWidth <= 820
      ? "1fr"
      : "minmax(0, 1fr) auto",
  gap: 10,
  alignItems: "start",
};

const supervisorCompactTitle = {
  fontWeight: 950,
  color: "#0f172a",
  lineHeight: 1.25,
  wordBreak: "break-word",
};

const supervisorCompactMeta = {
  marginTop: 6,
  color: "#64748b",
  fontWeight: 850,
  fontSize: 12,
  lineHeight: 1.4,
  display: "grid",
  gap: 2,
};

const supervisorCompactFooter = {
  marginTop: 10,
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  flexWrap: "wrap",
  fontSize: 12,
  fontWeight: 850,
  color: "#64748b",
};

const btnAdminGhostMini = {
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.92)",
  color: "#0f172a",
  borderRadius: 10,
  padding: "8px 10px",
  cursor: "pointer",
  fontWeight: 900,
  fontSize: 12,
  whiteSpace: "nowrap",
  alignSelf: "start",
};

const perfRowCompact = {
  display: "grid",
  gridTemplateColumns:
    typeof window !== "undefined" && window.innerWidth <= 820
      ? "1fr"
      : "minmax(0, 1fr) 140px 72px",
  gap: 12,
  alignItems: "center",
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 14,
  padding: 10,
  background: "rgba(255,255,255,0.92)",
};

const perfBarWrapCompact = {
  width: "100%",
  height: 10,
  borderRadius: 999,
  background: "rgba(226,232,240,0.95)",
  overflow: "hidden",
  border: "1px solid rgba(226,232,240,0.95)",
};

  const focusListWrap = {
  maxHeight: 420,
  overflowY: "auto",
  paddingRight: 4,
};

const focusListGrid = {
  display: "grid",
  gap: 10,
};

const focusCompactCard = {
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 14,
  padding: 10,
  background: "rgba(255,255,255,0.9)",
};

const supervisorActivityList = {
  marginTop: 4,
  display: "grid",
  gap: 10,
  maxHeight: typeof window !== "undefined" && window.innerWidth <= 900 ? 620 : 760,
  overflowY: "auto",
  overflowX: "hidden",
  overscrollBehaviorY: "contain",
  paddingRight: 6,
  scrollbarWidth: "thin",
};

const supervisorActivityListItem = {
  minWidth: 0,
};

const seeAllBtn = {
    background: "transparent",
    border: "none",
    color: "#0f172a",
    fontWeight: 950,
    cursor: "pointer",
    padding: 0,
  };

  const seeAllBtnGhost = {
    background: "transparent",
    border: "none",
    color: "#1d4ed8",
    fontWeight: 950,
    cursor: "pointer",
    padding: 0,
  };

  const cardRow = {
    background: "rgba(255,255,255,0.8)",
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    overflow: "hidden",
    display: "grid",
    gap: 0,
  };

  const cardRowBody = {
    padding: 12,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  };

  const chipsWrap = {
    marginTop: 12,
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  };

  const chipBtn = {
    borderRadius: 999,
    padding: "8px 12px",
    border: "1px solid rgba(226,232,240,0.95)",
    background: "rgba(255,255,255,0.85)",
    cursor: "pointer",
    fontWeight: 950,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
  };

  const chipCount = {
    padding: "2px 8px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 950,
    border: "1px solid rgba(0,0,0,0.06)",
    background: "rgba(255,255,255,0.7)",
  };

  const chipOff = { opacity: 0.55, cursor: "not-allowed" };

  const chipRed = { background: "#fee2e2", border: "1px solid #fecaca", color: "#991b1b" };
  const chipAmber = { background: "#fef3c7", border: "1px solid #fde68a", color: "#92400e" };
  const chipBlue = { background: "#dbeafe", border: "1px solid #bfdbfe", color: "#1d4ed8" };

  const globalChip = { borderRadius: 999, padding: "4px 10px", fontSize: 12, fontWeight: 900 };

  const btnMini = {
    border: "1px solid #e5e7eb",
    background: "rgba(255,255,255,0.85)",
    borderRadius: 12,
    padding: "8px 10px",
    cursor: "pointer",
    fontWeight: 950,
  };

  const miniError = {
    marginTop: 10,
    background: "#fff1f2",
    border: "1px solid #fecaca",
    padding: "8px 10px",
    borderRadius: 12,
    color: "#991b1b",
    fontWeight: 900,
    fontSize: 12,
  };

  const miniHelp = {
    marginTop: 10,
    fontSize: 12,
    color: "#475569",
    fontWeight: 800,
    background: "rgba(248,250,252,0.9)",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 10,
  };

  const chipBase = {
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 950,
    border: "1px solid rgba(226,232,240,0.9)",
    textTransform: "uppercase",
    lineHeight: 1,
  };

  const chipWarn = { ...chipBase, background: "#fff7ed", color: "#b45309", border: "1px solid rgba(251,146,60,0.45)" };
  const chipCrit = { ...chipBase, background: "#fdecea", color: "#b91c1c", border: "1px solid rgba(248,113,113,0.45)" };
  const chipOkMini = { ...chipBase, background: "#ecfdf5", color: "#166534", border: "1px solid rgba(34,197,94,0.25)" };

  /* ============ styles admin ============ */

  const panelAdminCard = {
    border: "1px solid rgba(226,232,240,0.95)",
    borderRadius: 18,
    overflow: "hidden",
    background: "linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)",
    boxShadow: "0 12px 28px rgba(2,6,23,0.06)",
  };

  const panelAdminHeader = {
    background: "#0f172a",
    padding: 12,
    color: "#fff",
  };

  const panelTitleAdminRow = {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
  };

  const panelTitleAdmin = { fontWeight: 1000, color: "#fff" };

  const panelSubtitleAdmin = {
    marginTop: 4,
    fontSize: 12,
    fontWeight: 800,
    color: "rgba(226,232,240,0.92)",
  };

  

  const btnAdminPrimary = {
    background: "#0f172a",
    color: "#fff",
    border: "1px solid #0f172a",
    borderRadius: 12,
    padding: "10px 12px",
    cursor: "pointer",
    fontWeight: 950,
  };

  const btnAdminGhost = {
    border: "1px solid rgba(226,232,240,0.95)",
    background: "rgba(255,255,255,0.85)",
    borderRadius: 12,
    padding: "10px 12px",
    cursor: "pointer",
    fontWeight: 950,
    color: "#0f172a",
  };

  const btnAdminChip = {
    borderRadius: 999,
    padding: "8px 12px",
    border: "1px solid rgba(226,232,240,0.95)",
    background: "rgba(255,255,255,0.85)",
    cursor: "pointer",
    fontWeight: 950,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
  };

  const chipCountMini = {
    padding: "2px 8px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 950,
    border: "1px solid rgba(0,0,0,0.06)",
    background: "rgba(255,255,255,0.7)",
  };

  const chipOffMini = { opacity: 0.55, cursor: "not-allowed" };
  const chipRedMini = { background: "#fee2e2", border: "1px solid #fecaca", color: "#991b1b" };
  const chipBlueMini = { background: "#dbeafe", border: "1px solid #bfdbfe", color: "#1d4ed8" };

/* ================= IA SUMMARY STYLES ================= */

const aiWrapCard = {
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 22,
  background: "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.98) 100%)",
  boxShadow: "0 16px 36px rgba(15,23,42,0.08)",
  overflow: "hidden",
};

const aiHead = {
  padding: 16,
  borderBottom: "1px solid rgba(226,232,240,0.9)",
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
  alignItems: "center",
};

const aiHeadTitle = {
  fontWeight: 950,
  color: "#0f172a",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
};

const aiHeadSub = {
  marginTop: 4,
  fontSize: 12,
  fontWeight: 800,
  color: "#64748b",
};

const aiHeadActions = {
  display: "flex",
  gap: 8,
  alignItems: "center",
  flexWrap: "wrap",
};

const aiStateBadge = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 12px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 950,
  border: "1px solid transparent",
};

const aiStateBadgeOk = {
  background: "rgba(34,197,94,0.12)",
  borderColor: "rgba(34,197,94,0.22)",
  color: "#166534",
};

const aiStateBadgeWarn = {
  background: "rgba(245,158,11,0.12)",
  borderColor: "rgba(245,158,11,0.22)",
  color: "#92400e",
};

const aiPrimaryBtn = {
  border: "1px solid rgba(249,115,22,0.55)",
  background: "rgba(249,115,22,0.92)",
  color: "#0b1220",
  borderRadius: 12,
  padding: "10px 14px",
  cursor: "pointer",
  fontWeight: 980,
  boxShadow: "0 12px 24px rgba(249,115,22,0.18)",
};

const aiGhostBtn = {
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.92)",
  borderRadius: 12,
  padding: "10px 12px",
  cursor: "pointer",
  fontWeight: 950,
  color: "#0f172a",
};

const aiMainBody = {
  padding: 16,
};

const aiHeroCard = {
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 20,
  padding: 16,
  background:
    "radial-gradient(circle at top left, rgba(249,115,22,0.10), transparent 28%), linear-gradient(180deg, #1a1f2f 0%, #111624 100%)",
  boxShadow: "0 18px 40px rgba(15,23,42,0.18)",
};

const aiHeroTop = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "center",
  flexWrap: "wrap",
};

const aiHeroKicker = {
  fontSize: 12,
  fontWeight: 950,
  color: "#fb923c",
  textTransform: "uppercase",
  letterSpacing: 1,
};

const aiHeroMiniTitle = {
  marginTop: 6,
  fontSize: 12,
  fontWeight: 850,
  color: "#94a3b8",
};

const aiHeroStatus = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 12px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 950,
  border: "1px solid transparent",
};

const aiHeroStatusOk = {
  background: "rgba(34,197,94,0.14)",
  borderColor: "rgba(34,197,94,0.26)",
  color: "#bbf7d0",
};

const aiHeroStatusWarn = {
  background: "rgba(245,158,11,0.14)",
  borderColor: "rgba(245,158,11,0.26)",
  color: "#fde68a",
};

const aiHeroText = {
  marginTop: 14,
  fontSize: 24,
  lineHeight: 1.2,
  color: "#f8fafc",
  fontWeight: 980,
  maxWidth: 920,
};

const aiCompactGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 12,
};

const aiSectionCard = {
  borderRadius: 18,
  padding: 14,
  background: "#ffffff",
  border: "1px solid rgba(226,232,240,0.95)",
};

const aiSectionTitle = {
  fontSize: 12,
  fontWeight: 950,
  color: "#f97316",
  textTransform: "uppercase",
  letterSpacing: 1,
};

const aiList = {
  marginTop: 10,
  display: "grid",
  gap: 8,
};

const aiBulletCard = {
  borderRadius: 14,
  padding: "12px 13px",
  background: "#f8fafc",
  border: "1px solid rgba(226,232,240,0.95)",
  fontSize: 13,
  fontWeight: 850,
  color: "#0f172a",
  lineHeight: 1.4,
  display: "flex",
  gap: 10,
  alignItems: "flex-start",
};

const aiBulletDot = {
  width: 8,
  height: 8,
  borderRadius: 999,
  background: "#f97316",
  marginTop: 5,
  flex: "0 0 auto",
};

const aiActionCard = {
  borderRadius: 14,
  padding: "12px 13px",
  background: "#f8fafc",
  border: "1px solid rgba(226,232,240,0.95)",
  fontSize: 13,
  fontWeight: 900,
  color: "#0f172a",
  lineHeight: 1.4,
  display: "flex",
  gap: 10,
  alignItems: "flex-start",
};

const aiActionIndex = {
  width: 24,
  height: 24,
  borderRadius: 999,
  background: "rgba(249,115,22,0.14)",
  color: "#9a3412",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 12,
  fontWeight: 1000,
  flex: "0 0 auto",
};

const aiRiskRow = {
  borderRadius: 14,
  padding: "12px 13px",
  border: "1px solid rgba(226,232,240,0.95)",
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  alignItems: "flex-start",
  flexWrap: "wrap",
};

const aiRiskMsg = {
  fontSize: 13,
  fontWeight: 850,
  color: "#0f172a",
  lineHeight: 1.4,
};

const aiRiskAction = {
  marginTop: 6,
  fontSize: 12,
  color: "#475569",
};

const aiRiskBadge = {
  display: "inline-flex",
  alignItems: "center",
  padding: "6px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 950,
  background: "rgba(255,255,255,0.72)",
  border: "1px solid rgba(226,232,240,0.95)",
  whiteSpace: "nowrap",
};

const aiInfoBox = {
  fontSize: 12,
  fontWeight: 850,
  color: "#64748b",
};

const aiEmptyTxt = {
  fontSize: 12,
  fontWeight: 850,
  color: "#64748b",
};

const aiErrorBox = {
  fontSize: 12,
  fontWeight: 900,
  color: "#991b1b",
};
  
  const alertsPremiumHead = {
    background: "#0f172a",
    borderRadius: 16,
    padding: 14,
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
    alignItems: "center",
    boxShadow: "0 14px 30px rgba(2,6,23,0.14)",
  };

  const alertsIconBox = {
    width: 44,
    height: 44,
    borderRadius: 16,
    display: "grid",
    placeItems: "center",
    background: "#f97316",
    color: "#0b0f19",
    border: "1px solid rgba(0,0,0,0.10)",
  };

  const alertsPillBad = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    borderRadius: 999,
    fontWeight: 950,
    background: "rgba(239,68,68,0.14)",
    border: "1px solid rgba(239,68,68,0.22)",
    color: "#fecaca",
  };

  const alertsPillOk = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    borderRadius: 999,
    fontWeight: 950,
    background: "rgba(34,197,94,0.12)",
    border: "1px solid rgba(34,197,94,0.20)",
    color: "#bbf7d0",
  };

  const alertsRefreshBtn = {
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.08)",
    color: "#fff",
    padding: "10px 12px",
    cursor: "pointer",
    fontWeight: 950,
  };

  const aiBox = {
    marginTop: 12,
    borderRadius: 18,
    padding: 14,
    background: "linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.94) 55%, rgba(239,246,255,0.72) 100%)",
    border: "1px solid rgba(226,232,240,0.95)",
    boxShadow: "0 16px 30px rgba(2,6,23,0.06)",
  };

  const aiBody = {
    marginTop: 12,
    borderRadius: 14,
    padding: 12,
    border: "1px dashed rgba(148,163,184,0.55)",
    background: "rgba(255,255,255,0.6)",
  };

  const aiBtn = {
    border: "1px solid rgba(226,232,240,0.95)",
    background: "rgba(15,23,42,0.06)",
    borderRadius: 12,
    padding: "10px 12px",
    cursor: "pointer",
    fontWeight: 950,
    color: "#0f172a",
  opacity: 1,
  };

  /* ============ perf bars ============ */

  const perfRow = {
    display: "grid",
    gridTemplateColumns: "1fr 180px 110px",
    gap: 12,
    alignItems: "center",
    border: "1px solid rgba(226,232,240,0.95)",
    borderRadius: 14,
    padding: 12,
    background: "rgba(255,255,255,0.85)",
  };

  const perfBarWrap = {
    height: 10,
    borderRadius: 999,
    background: "#e5e7eb",
    overflow: "hidden",
    border: "1px solid rgba(0,0,0,0.05)",
  };

  const dashboardUpcomingList = {
  maxHeight: 420,
  overflowY: "auto",
  paddingRight: 4,
  display: "grid",
  gap: 10,
};

const dashboardUpcomingCard = {
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 14,
  padding: 12,
  background: "rgba(255,255,255,0.95)",
  boxShadow: "0 6px 16px rgba(2,6,23,0.04)",
};

const dashboardUpcomingCardTop = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  gap: 10,
  alignItems: "start",
};

const dashboardUpcomingTitle = {
  fontWeight: 950,
  color: "#0f172a",
  lineHeight: 1.25,
  wordBreak: "break-word",
};

const dashboardUpcomingDate = {
  marginTop: 6,
  fontSize: 12,
  fontWeight: 850,
  color: "#64748b",
};

function dashboardUpcomingMetaGridStyle(isMobile) {
  return {
    marginTop: 10,
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))",
    gap: 10,
  };
}

const dashboardUpcomingMetaBox = {
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 12,
  padding: "10px 12px",
  background: "rgba(248,250,252,0.7)",
  minWidth: 0,
};

const dashboardUpcomingMetaBoxFull = {
  gridColumn: "1 / -1",
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 12,
  padding: "10px 12px",
  background: "rgba(248,250,252,0.7)",
  minWidth: 0,
};

const dashboardMetaLabel = {
  fontSize: 11,
  fontWeight: 950,
  color: "#64748b",
  textTransform: "uppercase",
  marginBottom: 4,
};

const dashboardMetaValue = {
  fontSize: 13,
  fontWeight: 900,
  color: "#0f172a",
  wordBreak: "break-word",
};

  const perfBar = {
    height: "100%",
    borderRadius: 999,
    background: "#0f172a",
    opacity: 0.92,
  };

  /* ============ misc ============ */

  const miniStat = {
    background: "rgba(248,250,252,0.85)",
    border: "1px solid rgba(226,232,240,0.95)",
    borderRadius: 14,
    padding: 12,
  };

  /* =========================
    SUP extra styles (pegarlos al final con tus styles)
  ========================= */

  const segBtn = {
    borderRadius: 999,
    padding: "8px 12px",
    border: "1px solid rgba(226,232,240,0.95)",
    background: "rgba(255,255,255,0.85)",
    cursor: "pointer",
    fontWeight: 950,
  };

  const segOn = {
    background: "#0f172a",
    color: "#fff",
    border: "1px solid #0f172a",
  };

  const segOff = { color: "#0f172a" };

  const segSelect = {
    border: "1px solid rgba(226,232,240,0.95)",
    borderRadius: 12,
    padding: "10px 12px",
    fontWeight: 900,
    background: "rgba(255,255,255,0.95)",
  };

  const chipAmberMini = { background: "#fef3c7", border: "1px solid #fde68a", color: "#92400e" };

  const chipWarnMini = {
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 950,
    border: "1px solid rgba(245,158,11,0.35)",
    background: "rgba(254,243,199,0.95)",
    color: "#92400e",
    cursor: "pointer",
  };

  const chipCritMini = {
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 950,
    border: "1px solid rgba(239,68,68,0.35)",
    background: "rgba(254,226,226,0.95)",
    color: "#991b1b",
    cursor: "pointer",
  };

  const pqBadge = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 1000,
    border: "1px solid rgba(0,0,0,0.06)",
    lineHeight: 1,
    whiteSpace: "nowrap",
  };

  const pqBadgeInfo = {
    background: "#f8fafc",
    color: "#334155",
    border: "1px solid rgba(148,163,184,0.22)",
  };
  const pqBadgeHigh = {
    background: "#fee2e2",
    color: "#991b1b",
    border: "1px solid rgba(248,113,113,0.30)",
  };

  const pqBadgeWarn = {
    background: "#fff7ed",
    color: "#b45309",
    border: "1px solid rgba(251,146,60,0.35)",
  };

  const pqBadgeDte = { background: "#ecfeff", color: "#0e7490", border: "1px solid rgba(6,182,212,0.30)" };
  const pqBadgeAnom = { background: "#fff7ed", color: "#9a3412", border: "1px solid rgba(251,146,60,0.35)" };































































