// src/pages/AnalysisPage.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";

import FailuresByEquipment from "../components/analytics/FailuresByEquipment";
import ExecutionsMonthlyChart from "../components/analytics/ExecutionsMonthlyChart";
import TechniciansPerformance from "../components/analytics/TechniciansPerformance";
import ExecutionsKpis from "../components/analytics/ExecutionsKpis";
import MonthlyConsumptionChartCard from "../components/analytics/MonthlyConsumptionChartCard";
import { usePlant } from "../context/PlantContext";

import {
  getAnalyticsSummary,
  getTopEquipment,
  getLubricants,
  getTechniciansPerformance,
  getConditionReportsAnalytics,
  getOleMetrics,
} from "../services/analyticsService";

import { Icon } from "../components/ui/lpIcons";
import useDashboardPredictiveAlerts from "../hooks/useDashboardPredictiveAlerts";
/* ===================== helpers ===================== */
const toNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

const formatGramsSmart = (grams) => {
  const g = toNum(grams);
  if (g >= 1000) return `${(g / 1000).toFixed(2)} kg`;
  return `${Math.round(g)} g`;
};

const formatMlToLiters = (ml) => `${(toNum(ml) / 1000).toFixed(2)} L`;

const formatByKind = (totalBase, kind) => {
  if (kind === "ACEITE") return formatMlToLiters(totalBase);
  if (kind === "GRASA") return formatGramsSmart(totalBase);
  return String(toNum(totalBase));
};

const normalizeUnitForUi = (u) => {
  const s = String(u || "").trim();
  if (!s) return "";
  if (s.toUpperCase() === "BOMBAZOS") return "bombazos";
  if (s === "L") return "L";
  return s.toLowerCase();
};

const formatQty = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return "?";
  if (n % 1 === 0) return String(n);
  return n.toFixed(2);
};

const formatQtyUnit = (qty, unit) => {
  const q = formatQty(qty);
  if (q === "?") return "?";
  const u = normalizeUnitForUi(unit);
  return `${q}${u ? ` ${u}` : ""}`;
};

const formatConsumptionDisplay = (row, kind) => {
  if (!row) return "?";

  const directDisplay =
    String(row.displayTotalLabel || "").trim() ||
    String(row.displayTotal || "").trim();

  if (directDisplay) return directDisplay;

  const inputQty = row.totalInputQuantity;
  const inputUnit = row.totalInputUnit;
  const convQty = row.totalConvertedQuantity ?? row.total;
  const convUnit = row.totalConvertedUnit;

  const hasInput = inputQty != null && String(inputUnit || "").trim() !== "";
  const hasConv = convQty != null;

  if (hasInput && hasConv) {
    const left = formatQtyUnit(inputQty, inputUnit);
    const right =
      convUnit && String(convUnit).trim() !== ""
        ? formatQtyUnit(convQty, convUnit)
        : formatByKind(convQty, kind);

    return `${left} = ${right}`;
  }

  if (hasConv && convUnit && String(convUnit).trim() !== "") {
    return formatQtyUnit(convQty, convUnit);
  }

  return formatByKind(row.total, kind);
};

const formatConsumptionMain = (row, kind) => {
  if (!row) return "?";

  const directDisplay =
    String(row.displayTotalLabel || "").trim() ||
    String(row.displayTotal || "").trim();

  if (directDisplay) return directDisplay;

  const convQty = row.totalConvertedQuantity ?? row.total;
  const convUnit = row.totalConvertedUnit;

  if (convQty != null && convUnit) return formatQtyUnit(convQty, convUnit);
  return formatByKind(row.total, kind);
};

const formatConsumptionSecondary = (row, kind) => {
  if (!row) return "";

  const directInput =
    String(row.displayInputLabel || "").trim() ||
    String(row.displayInput || "").trim();

  if (directInput) return directInput;

  const inputQty = row.totalInputQuantity;
  const inputUnit = row.totalInputUnit;
  const convQty = row.totalConvertedQuantity ?? row.total;
  const convUnit = row.totalConvertedUnit;

  const hasInput = inputQty != null && String(inputUnit || "").trim() !== "";
  const hasConv = convQty != null;

  if (hasInput && hasConv) {
    const left = formatQtyUnit(inputQty, inputUnit);
    const right =
      convUnit && String(convUnit).trim() !== ""
        ? formatQtyUnit(convQty, convUnit)
        : formatByKind(convQty, kind);

    if (left !== right) return `${left} / ${right}`;
  }

  return "";
};

const pickStrings = (...vals) =>
  vals
    .flat()
    .map((x) => String(x || "").trim())
    .filter(Boolean);

const uniq = (arr) => Array.from(new Set(arr));

const eqBadges = (obj) => {
  if (!obj) return [];
  const nested = obj.equipment || obj.eq || obj.asset || null;

  const raw = pickStrings(
    obj.code,
    obj.tag,
    obj.equipmentCode,
    obj.equipmentTag,
    obj.eqCode,
    obj.eqTag,
    Array.isArray(obj.codes) ? obj.codes : [],
    Array.isArray(obj.tags) ? obj.tags : [],
    nested?.code,
    nested?.tag,
    nested?.equipmentCode,
    nested?.equipmentTag,
    Array.isArray(nested?.codes) ? nested.codes : [],
    Array.isArray(nested?.tags) ? nested.tags : []
  );

  return uniq(raw);
};

const normalize = (s) => String(s || "").toLowerCase().trim();

function quantile(arr, q) {
  const a = (Array.isArray(arr) ? arr : [])
    .map(toNum)
    .filter((x) => Number.isFinite(x))
    .sort((x, y) => x - y);
  if (a.length === 0) return 0;
  const pos = (a.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (a[base + 1] == null) return a[base];
  return a[base] + rest * (a[base + 1] - a[base]);
}

/* ===================== UI atoms ===================== */
function Tag({ children, tone = "gray" }) {
  const bg =
    tone === "blue"
      ? "rgba(219,234,254,0.95)"
      : tone === "green"
      ? "rgba(220,252,231,0.92)"
      : tone === "amber"
      ? "rgba(254,243,199,0.92)"
      : tone === "red"
      ? "rgba(254,226,226,0.92)"
      : tone === "steel"
      ? "rgba(226,232,240,0.95)"
      : "rgba(241,245,249,0.92)";

  const fg =
    tone === "blue"
      ? "#1d4ed8"
      : tone === "green"
      ? "#166534"
      : tone === "amber"
      ? "#92400e"
      : tone === "red"
      ? "#991b1b"
      : "#334155";

  return (
    <span style={{ ...tagBase, background: bg, color: fg }}>
      {children}
    </span>
  );
}

function EqBadges({ obj }) {
  const list = eqBadges(obj);
  if (list.length === 0) return null;

  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {list.map((x) => (
        <span key={x} style={tagWrapFix}>
          <Tag tone="steel">{x}</Tag>
        </span>
      ))}
    </div>
  );
}

function PanelHeader({ title, tag, tone = "gray", right, icon, subtitle }) {
  return (
    <div style={panelHeaderRow}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {icon ? <span style={hdrIcon}>{icon}</span> : null}
          <div style={panelTitle}>{title}</div>
          {tag ? <Tag tone={tone}>{tag}</Tag> : null}
        </div>
        {subtitle ? <div style={panelSub}>{subtitle}</div> : null}
      </div>

      {right ? (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {right}
        </div>
      ) : null}
    </div>
  );
}

function SegmentedTabs({ value, onChange, items }) {
  return (
    <div style={tabsWrap}>
      {items.map((it) => {
        const active = it.value === value;
        return (
          <button
            key={it.value}
            onClick={() => onChange(it.value)}
            className="lpPress"
            style={{
              ...tabBtn,
              ...(active ? tabBtnActive : {}),
            }}
            type="button"
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              {it.icon ? <span style={{ opacity: 0.9 }}>{it.icon}</span> : null}
              {it.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function SeverityChip({ level }) {
  if (!level) return <Tag tone="gray">Normal</Tag>;
  if (level === "HIGH") return <Tag tone="red">Anomalia alta</Tag>;
  if (level === "MED") return <Tag tone="amber">Anomalia media</Tag>;
  return <Tag tone="gray">Normal</Tag>;
}

function ConditionMetricCard({ title, value, subtitle, tone = "steel", icon }) {
  const toneMap = {
    steel: {
      border: "rgba(148,163,184,0.45)",
      accent: "#475569",
      iconBg: "rgba(226,232,240,0.95)",
      iconFg: "#334155",
    },
    blue: {
      border: "rgba(96,165,250,0.32)",
      accent: "#2563eb",
      iconBg: "rgba(219,234,254,0.95)",
      iconFg: "#1d4ed8",
    },
    amber: {
      border: "rgba(251,191,36,0.34)",
      accent: "#d97706",
      iconBg: "rgba(254,243,199,0.95)",
      iconFg: "#b45309",
    },
    green: {
      border: "rgba(74,222,128,0.32)",
      accent: "#16a34a",
      iconBg: "rgba(220,252,231,0.95)",
      iconFg: "#15803d",
    },
  };

  const theme = toneMap[tone] || toneMap.steel;

  return (
    <div
      className="lpCard"
      style={{
        ...conditionMetricCard,
        borderTop: `4px solid ${theme.accent}`,
        borderRight: `1px solid ${theme.border}`,
        borderBottom: `1px solid ${theme.border}`,
        borderLeft: `1px solid ${theme.border}`,
      }}
    >
      <div style={conditionMetricHeader}>
        <span style={{ ...conditionMetricIcon, background: theme.iconBg, color: theme.iconFg }}>
          {icon}
        </span>
        <div style={{ ...conditionMetricTitle, color: theme.accent }}>{title}</div>
      </div>
      <div style={{ ...conditionMetricValue, color: "#0f172a" }}>{value}</div>
      <div style={conditionMetricSubtitle}>{subtitle}</div>
    </div>
  );
}

/* ===================== page ===================== */
export default function AnalysisPage() {
  const navigate = useNavigate();
  const { currentPlantId, currentPlant } = usePlant();

  const [loading, setLoading] = useState(true);
  const [softLoading, setSoftLoading] = useState(false);
  const [err, setErr] = useState("");

  const [tab, setTab] = useState("consumo");

  const [days, setDays] = useState(30);

  const [oilLubOptions, setOilLubOptions] = useState([]);
  const [greaseLubOptions, setGreaseLubOptions] = useState([]);

  const [oilLubId, setOilLubId] = useState("");
  const [greaseLubId, setGreaseLubId] = useState("");

  const [oilSummary, setOilSummary] = useState(null);
  const [greaseSummary, setGreaseSummary] = useState(null);

  const [oilTopEq, setOilTopEq] = useState([]);
  const [greaseTopEq, setGreaseTopEq] = useState([]);

  const [q, setQ] = useState("");
  const [onlyAnomalies, setOnlyAnomalies] = useState(false);

  const analysisMonth = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  }, []);

  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [techId, setTechId] = useState("");
  const [techOptions, setTechOptions] = useState([]);

  const [crRange, setCrRange] = useState("90D");
  const [crLoading, setCrLoading] = useState(false);
  const [crErr, setCrErr] = useState("");
  const [crData, setCrData] = useState(null);

  // KPI OLE
  const [oleData, setOleData] = useState(null);
  const [oleLoading, setOleLoading] = useState(false);
  const [oleErr, setOleErr] = useState("");
  const [oleDays, setOleDays] = useState(90);
  const oleReqRef = useRef(0);

  const { alerts: predictiveAlerts } = useDashboardPredictiveAlerts({
    month: analysisMonth,
    enabled: Boolean(currentPlantId),
  });

  const reqIdRef = useRef(0);
  const crReqIdRef = useRef(0);

  const oilLubName = useMemo(() => {
    if (!oilLubId) return "";
    return oilLubOptions.find((x) => String(x.id) === String(oilLubId))?.name || "";
  }, [oilLubId, oilLubOptions]);

  const greaseLubName = useMemo(() => {
    if (!greaseLubId) return "";
    return greaseLubOptions.find((x) => String(x.id) === String(greaseLubId))?.name || "";
  }, [greaseLubId, greaseLubOptions]);

  const loadLubricants = useCallback(async () => {
    try {
      const [oils, greases] = await Promise.all([
        getLubricants({ kind: "ACEITE" }),
        getLubricants({ kind: "GRASA" }),
      ]);
      setOilLubOptions(Array.isArray(oils?.result) ? oils.result : []);
      setGreaseLubOptions(Array.isArray(greases?.result) ? greases.result : []);
    } catch {
      setOilLubOptions([]);
      setGreaseLubOptions([]);
    }
  }, [currentPlantId]);

  const loadAll = useCallback(
    async ({ hard } = { hard: false }) => {
      const myReq = ++reqIdRef.current;

      try {
        setErr("");
        if (hard) setLoading(true);
        else setSoftLoading(true);

        const oilIdNum = oilLubId ? Number(oilLubId) : undefined;
        const greaseIdNum = greaseLubId ? Number(greaseLubId) : undefined;

        const [sOil, sGrease, tOil, tGrease] = await Promise.all([
          getAnalyticsSummary({ days, kind: "ACEITE", lubricantId: oilIdNum }),
          getAnalyticsSummary({ days, kind: "GRASA", lubricantId: greaseIdNum }),
          getTopEquipment({ take: 25, days, kind: "ACEITE", lubricantId: oilIdNum }),
          getTopEquipment({ take: 25, days, kind: "GRASA", lubricantId: greaseIdNum }),
        ]);

        if (myReq !== reqIdRef.current) return;

        setOilSummary(sOil);
        setGreaseSummary(sGrease);
        setOilTopEq(Array.isArray(tOil?.result) ? tOil.result : []);
        setGreaseTopEq(Array.isArray(tGrease?.result) ? tGrease.result : []);
      } catch (e) {
        if (myReq !== reqIdRef.current) return;
        console.error(e);
        setErr(e?.message || "Error cargando analisis");
        setOilSummary(null);
        setGreaseSummary(null);
        setOilTopEq([]);
        setGreaseTopEq([]);
      } finally {
        if (myReq !== reqIdRef.current) return;
        setLoading(false);
        setSoftLoading(false);
      }
    },
    [days, oilLubId, greaseLubId]
  );

  const loadConditionAnalytics = useCallback(async () => {
    const myReq = ++crReqIdRef.current;

    try {
      setCrErr("");
      setCrLoading(true);

      const json = await getConditionReportsAnalytics({ range: crRange });
      if (myReq !== crReqIdRef.current) return;

      setCrData(json);
    } catch (e) {
      if (myReq !== crReqIdRef.current) return;
      console.error(e);
      setCrErr(e?.message || "Error cargando analitica de condicion");
      setCrData(null);
    } finally {
      if (myReq !== crReqIdRef.current) return;
      setCrLoading(false);
    }
  }, [crRange, currentPlantId]);

  useEffect(() => {
    loadConditionAnalytics();
  }, [loadConditionAnalytics]);

  const loadOle = useCallback(async () => {
    if (!currentPlantId) return;
    const myReq = ++oleReqRef.current;
    setOleLoading(true);
    setOleErr("");
    try {
      const json = await getOleMetrics({ days: oleDays });
      if (myReq !== oleReqRef.current) return;
      setOleData(json);
    } catch (e) {
      if (myReq !== oleReqRef.current) return;
      setOleErr(e?.message || "Error cargando KPI OLE");
      setOleData(null);
    } finally {
      if (myReq !== oleReqRef.current) return;
      setOleLoading(false);
    }
  }, [currentPlantId, oleDays]);

  useEffect(() => {
    if (tab === "ole" && currentPlantId) loadOle();
  }, [tab, currentPlantId, oleDays]);

  useEffect(() => {
    if (!currentPlantId) return;

    setOilLubId("");
    setGreaseLubId("");
    setTechId("");

    loadLubricants();
    loadAll({ hard: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPlantId]);

  useEffect(() => {
    if (!loading) loadAll({ hard: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days, oilLubId, greaseLubId, currentPlantId]);

  useEffect(() => {
    if (!currentPlantId) return;

    (async () => {
      try {
        const json = await getTechniciansPerformance(180);
        setTechOptions(Array.isArray(json?.result) ? json.result : []);
      } catch {
        setTechOptions([]);
      }
    })();
  }, [currentPlantId]);

  const oilTrendLabel = useMemo(() => {
    if (!oilSummary?.trend) return "?";
    const { delta, deltaPct } = oilSummary.trend;
    const d = toNum(delta);
    const p = deltaPct == null ? null : Number(deltaPct || 0);
    if (p == null) return `Cambio ${formatByKind(d, "ACEITE")} (sin base previa)`;
    const sign = d >= 0 ? "+" : "";
    return `${sign}${formatByKind(d, "ACEITE")} (${sign}${p.toFixed(1)}%)`;
  }, [oilSummary]);

  const greaseTrendLabel = useMemo(() => {
    if (!greaseSummary?.trend) return "?";
    const { delta, deltaPct } = greaseSummary.trend;
    const d = toNum(delta);
    const p = deltaPct == null ? null : Number(deltaPct || 0);
    if (p == null) return `Cambio ${formatByKind(d, "GRASA")} (sin base previa)`;
    const sign = d >= 0 ? "+" : "";
    return `${sign}${formatByKind(d, "GRASA")} (${sign}${p.toFixed(1)}%)`;
  }, [greaseSummary]);

  const busy = loading || softLoading || crLoading;

  const predictiveAnomalyMap = useMemo(() => {
    const map = new Map();
    const rows = Array.isArray(predictiveAlerts?.equipmentConsumptionAnomaliesTop)
      ? predictiveAlerts.equipmentConsumptionAnomaliesTop
      : [];

    for (const row of rows) {
      const key = String(row?.equipmentId ?? row?.id ?? "").trim();
      if (!key) continue;

      const rawRisk = String(row?.risk || row?.level || "").toUpperCase();
      const level = rawRisk === "HIGH" ? "HIGH" : rawRisk === "MED" ? "MED" : null;

      map.set(key, {
        level,
        ratio: row?.ratio == null ? null : Number(row.ratio),
        baselineAvgDaily: row?.baselineAvgDaily == null ? null : Number(row.baselineAvgDaily),
        last14AvgDaily: row?.last14AvgDaily == null ? null : Number(row.last14AvgDaily),
      });
    }

    return map;
  }, [predictiveAlerts]);

  const filterRows = useCallback(
    (rows) => {
      const query = normalize(q);

      return (Array.isArray(rows) ? rows : [])
        .map((r) => {
          const predictive = predictiveAnomalyMap.get(String(r?.id ?? "").trim());
          return {
            ...r,
            _level: predictive?.level || null,
            _predictiveRatio: predictive?.ratio ?? null,
            _predictiveBaselineAvgDaily: predictive?.baselineAvgDaily ?? null,
            _predictiveLast14AvgDaily: predictive?.last14AvgDaily ?? null,
          };
        })
        .filter((r) => {
          const hay =
            normalize(r?.name).includes(query) ||
            normalize(r?.location).includes(query) ||
            eqBadges(r).some((b) => normalize(b).includes(query));

          if (query && !hay) return false;
          if (onlyAnomalies && !r._level) return false;
          return true;
        });
    },
    [q, onlyAnomalies, predictiveAnomalyMap]
  );

  const oilRows = useMemo(() => filterRows(oilTopEq), [oilTopEq, filterRows]);
  const greaseRows = useMemo(() => filterRows(greaseTopEq), [greaseTopEq, filterRows]);

  const oilAnomCount = useMemo(() => oilRows.filter((r) => r._level).length, [oilRows]);
  const greaseAnomCount = useMemo(() => greaseRows.filter((r) => r._level).length, [greaseRows]);
  const conditionActiveTotal = useMemo(
    () => toNum(crData?.totals?.open) + toNum(crData?.totals?.inProgress),
    [crData]
  );
  const conditionAttendedTotal = useMemo(
    () => toNum(crData?.totals?.resolved) + toNum(crData?.totals?.dismissed),
    [crData]
  );
  const conditionFocusArea = useMemo(() => {
    const labels = Array.isArray(crData?.series?.mttrAvgHoursByArea?.labels)
      ? crData.series.mttrAvgHoursByArea.labels
      : [];
    const values = Array.isArray(crData?.series?.mttrAvgHoursByArea?.values)
      ? crData.series.mttrAvgHoursByArea.values
      : [];

    if (!labels.length) {
      return {
        name: "Sin area",
        subtitle: "Sin tiempo de atencion registrado",
      };
    }

    return {
      name: labels[0] || "Sin area",
      subtitle:
        values.length > 0
          ? `${toNum(values[0]).toFixed(1)} h promedio`
          : "Sin tiempo de atencion registrado",
    };
  }, [crData]);

    const exportLabel = useMemo(() => {
    if (tab === "consumo") return "Exportar consumo";
    if (tab === "actividades") return "Exportar actividades";
    if (tab === "fallas") return "Exportar fallas";
    if (tab === "condicion") return "Exportar condicion";
    return "Exportar";
  }, [tab]);

    const handleExport = useCallback(() => {
    const qs = new URLSearchParams();

    qs.set("source", "analysis");
    qs.set("tab", tab);

    if (tab === "consumo") {
      qs.set("days", String(days));
      if (oilLubId) qs.set("oilLubId", String(oilLubId));
      if (greaseLubId) qs.set("greaseLubId", String(greaseLubId));
      if (q.trim()) qs.set("q", q.trim());
      qs.set("onlyAnomalies", onlyAnomalies ? "1" : "0");
    }

    if (tab === "actividades") {
      qs.set("year", String(year));
      if (techId) qs.set("techId", String(techId));
      qs.set("days", "180");
    }

    if (tab === "condicion") {
      qs.set("crRange", String(crRange));
    }

    if (currentPlantId) {
      qs.set("plantId", String(currentPlantId));
    }

    navigate(`/export?${qs.toString()}`);
  }, [
    navigate,
    tab,
    days,
    oilLubId,
    greaseLubId,
    q,
    onlyAnomalies,
    year,
    techId,
    crRange,
    currentPlantId,
  ]);

  const handleReset = useCallback(() => {
    setDays(30);
    setOilLubId("");
    setGreaseLubId("");
    setQ("");
    setOnlyAnomalies(false);
    setYear(currentYear);
    setTechId("");
    setCrRange("90D");
  }, [currentYear]);

  const goEquipment = useCallback(
    (id) => {
      if (!id) return;
      navigate(`/equipments/${id}`);
    },
    [navigate]
  );

  if (!currentPlantId) {
    return (
      <MainLayout>
        <div style={{ padding: 16 }}>
          <h1 style={{ margin: 0 }}>Analisis</h1>
          <div style={errorBox}>Selecciona una planta para visualizar el analisis.</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <style>{`
        .lpCard {
          position: relative;
          overflow: hidden;
          transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
        }
        .lpCard:hover {
          transform: translateY(-3px);
          box-shadow: 0 18px 40px rgba(2,6,23,0.12);
          border-color: rgba(100,116,139,0.65);
        }
        .lpPress:active {
          transform: translateY(0px) scale(0.99);
        }
        .lpInput {
          border: 1px solid rgba(226,232,240,0.95);
          border-radius: 12px;
          padding: 10px 12px;
          font-weight: 900;
          background: rgba(255,255,255,0.92);
          outline: none;
          box-shadow: 0 8px 18px rgba(2,6,23,0.04);
        }
        .lpInput:focus {
          border-color: rgba(100,116,139,0.75);
          box-shadow: 0 10px 24px rgba(2,6,23,0.08);
        }
      `}</style>

      {/* ── Hero ── */}
      <div style={headerRow} className="lp-enter">
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, minWidth: 0, flex: 1 }}>
          <div style={heroIconBox}>
            <Icon name="trendUp" size="md" />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={heroKicker}>ANÁLISIS · TENDENCIAS</div>
            <h1 style={heroH1}>Análisis</h1>
            <p style={heroSub}>
              Tendencias y estadísticas de lubricación
              {currentPlant?.name ? ` · ${currentPlant.name}` : ""}
            </p>
            <div style={heroMetaRow}>
              {currentPlant?.name ? (
                <span style={heroMetaChip}>
                  <Icon name="building" size="sm" />
                  {currentPlant.name}
                </span>
              ) : null}
              {tab === "consumo" ? (
                <span style={heroMetaChip}>
                  <Icon name="calendar" size="sm" />
                  {days} días
                </span>
              ) : null}
              {tab === "actividades" ? (
                <span style={heroMetaChip}>
                  <Icon name="calendar" size="sm" />
                  Año {year}
                </span>
              ) : null}
              {tab === "condicion" ? (
                <span style={heroMetaChip}>
                  <Icon name="calendar" size="sm" />
                  {crRange}
                </span>
              ) : null}
              {tab === "ole" ? (
                <span style={heroMetaChip}>
                  <Icon name="trendUp" size="sm" />
                  OLE · {oleDays} días
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", flexShrink: 0 }}>
          <button onClick={handleReset} className="lpPress" style={btnGhost} disabled={busy} type="button">
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <Icon name="reset" />
              Reset
            </span>
          </button>

          <button onClick={() => loadAll({ hard: false })} className="lpPress" style={btnGhost} disabled={busy} type="button">
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <Icon name="refresh" size="sm" />
              {busy ? "Actualizando…" : "Actualizar"}
            </span>
          </button>

          <button onClick={handleExport} className="lpPress" style={btnPrimary} disabled={busy} type="button">
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <Icon name="doc" />
              {exportLabel}
            </span>
          </button>
        </div>
      </div>

      <div style={{ marginTop: 12 }} className="lp-enter">
        <SegmentedTabs
          value={tab}
          onChange={setTab}
          items={[
            { value: "consumo",     label: "Consumo",      icon: <Icon name="drop" /> },
            { value: "actividades", label: "Actividades",   icon: <Icon name="route" /> },
            { value: "fallas",      label: "Fallas",        icon: <Icon name="warn" /> },
            { value: "condicion",   label: "Condición",     icon: <Icon name="warn" /> },
            { value: "ole",         label: "KPI OLE",       icon: <Icon name="trendUp" /> },
          ]}
        />
      </div>

      {tab === "consumo" && (
        <div style={stickyFilters}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={miniLbl}>Rango</span>
              <select value={days} onChange={(e) => setDays(Number(e.target.value))} style={selectMini}>
                <option value={30}>30 dias</option>
                <option value={90}>90 dias</option>
                <option value={180}>180 dias</option>
                <option value={365}>365 dias</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={miniLbl}>Buscar equipo</span>
              <input
                className="lpInput"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Nombre, codigo, ubicacion"
                style={{ width: 260 }}
              />
            </div>

            <label style={toggleWrap}>
              <input
                type="checkbox"
                checked={onlyAnomalies}
                onChange={(e) => setOnlyAnomalies(e.target.checked)}
              />
              <span style={{ fontWeight: 950, color: "#0f172a" }}>Solo anomalias</span>
            </label>

            {softLoading ? <Tag tone="steel">Actualizando...</Tag> : null}
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <Tag tone="blue">Aceites - anomalias: {oilAnomCount}</Tag>
            <Tag tone="green">Grasas - anomalias: {greaseAnomCount}</Tag>
            <Tag tone="steel">Rango: {days} dias</Tag>
          </div>
        </div>
      )}

      {err ? <div style={errorBox}>{err}</div> : null}
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12, padding: "18px 16px", borderRadius: 16, border: "1px solid rgba(226,232,240,0.95)", background: "rgba(255,255,255,0.88)", fontWeight: 900, color: "#475569" }}>
          <Icon name="refresh" style={{ width: 18, height: 18, color: "#f97316", flexShrink: 0 }} />
          Cargando análisis…
        </div>
      ) : null}

      {!loading && (
        <>
          {tab === "consumo" && (
            <>
              <div style={twoCols}>
                <div className="lpCard" style={panel}>
                  <div style={accentBarOrange} />
                  <PanelHeader
                    icon={<Icon name="drop" />}
                    title="Consumo y focos operativos"
                    tag="ACEITES"
                    tone="blue"
                    subtitle="Unidad base: litros. Si existe captura operativa original, tambien se muestra."
                    right={
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <span style={miniLbl}>Lubricante</span>
                        <select
                          value={oilLubId}
                          onChange={(e) => setOilLubId(e.target.value)}
                          style={{ ...selectMini, minWidth: 260 }}
                        >
                          <option value="">Todos</option>
                          {oilLubOptions.map((x) => (
                            <option key={x.id} value={String(x.id)}>
                              {x.name}
                            </option>
                          ))}
                        </select>
                        <Tag tone={oilLubId ? "amber" : "steel"}>
                          {oilLubId ? oilLubName || "Lubricante" : "Todos"}
                        </Tag>
                      </div>
                    }
                  />

                  <div style={kpiGrid}>
                    <div className="lpCard" style={kpiCard}>
                      <div style={kpiTopBarDark} /><div style={kpiSideStripe} />
                      <div style={kpiLbl}>Lubricante foco</div>
                      <div style={kpiVal}>{oilSummary?.topLubricant?.name || "?"}</div>
                      <div style={kpiSub}>
                        {oilSummary?.topLubricant
                          ? formatConsumptionDisplay(oilSummary.topLubricant, "ACEITE")
                          : "Sin datos"}
                      </div>
                    </div>

                    <div className="lpCard" style={kpiCard}>
                      <div style={kpiTopBarDark} /><div style={kpiSideStripe} />
                      <div style={kpiLbl}>Equipo foco</div>

                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
                        <div style={kpiVal}>{oilSummary?.topEquipment?.name || "?"}</div>
                        <EqBadges obj={oilSummary?.topEquipment} />
                      </div>

                      <div style={kpiSub}>
                        {oilSummary?.topEquipment
                          ? formatConsumptionDisplay(oilSummary.topEquipment, "ACEITE")
                          : "?"}
                      </div>
                    </div>

                    <div className="lpCard" style={kpiCard}>
                      <div style={kpiTopBarDark} /><div style={kpiSideStripe} />
                      <div style={kpiLbl}>Cambio mensual</div>
                      <div style={kpiVal}>{oilTrendLabel}</div>
                      <div style={kpiSub}>Comparado vs mes anterior</div>
                    </div>
                  </div>
                </div>

                <div className="lpCard" style={panel}>
                  <div style={accentBarOrange} />
                  <PanelHeader
                    icon={<Icon name="drop" />}
                    title="Consumo y focos operativos"
                    tag="GRASAS"
                    tone="green"
                    subtitle="Unidad base: gramos y kilos. Si existe captura operativa original, tambien se muestra."
                    right={
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <span style={miniLbl}>Lubricante</span>
                        <select
                          value={greaseLubId}
                          onChange={(e) => setGreaseLubId(e.target.value)}
                          style={{ ...selectMini, minWidth: 260 }}
                        >
                          <option value="">Todos</option>
                          {greaseLubOptions.map((x) => (
                            <option key={x.id} value={String(x.id)}>
                              {x.name}
                            </option>
                          ))}
                        </select>
                        <Tag tone={greaseLubId ? "amber" : "steel"}>
                          {greaseLubId ? greaseLubName || "Lubricante" : "Todos"}
                        </Tag>
                      </div>
                    }
                  />

                  <div style={kpiGrid}>
                    <div className="lpCard" style={kpiCard}>
                      <div style={kpiTopBarDark} /><div style={kpiSideStripe} />                     
                      <div style={kpiLbl}>Lubricante foco</div>
                      <div style={kpiVal}>{greaseSummary?.topLubricant?.name || "?"}</div>
                      <div style={kpiSub}>
                        {greaseSummary?.topLubricant
                          ? formatConsumptionDisplay(greaseSummary.topLubricant, "GRASA")
                          : "Sin datos"}
                      </div>
                    </div>

                    <div className="lpCard" style={kpiCard}>
                      <div style={kpiTopBarDark} /><div style={kpiSideStripe} />
                      <div style={kpiLbl}>Equipo foco</div>

                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
                        <div style={kpiVal}>{greaseSummary?.topEquipment?.name || "?"}</div>
                        <EqBadges obj={greaseSummary?.topEquipment} />
                      </div>

                      <div style={kpiSub}>
                        {greaseSummary?.topEquipment
                          ? formatConsumptionDisplay(greaseSummary.topEquipment, "GRASA")
                          : "?"}
                      </div>
                    </div>

                    <div className="lpCard" style={kpiCard}>
                      <div style={kpiTopBarDark} /><div style={kpiSideStripe} />
                      <div style={kpiLbl}>Cambio mensual</div>
                      <div style={kpiVal}>{greaseTrendLabel}</div>
                      <div style={kpiSub}>Comparado vs mes anterior</div>
                    </div>
                  </div>
                </div>
              </div>

             <div style={{ ...twoCols, marginTop: 14 }}>
  <div style={{ minWidth: 0 }}>
    <MonthlyConsumptionChartCard
      title="Cambio mensual"
      kind="ACEITE"
      days={days}
      lubricantId={oilLubId ? Number(oilLubId) : undefined}
    />
  </div>

  <div style={{ minWidth: 0 }}>
    <MonthlyConsumptionChartCard
      title="Cambio mensual"
      kind="GRASA"
      days={days}
      lubricantId={greaseLubId ? Number(greaseLubId) : undefined}
    />
  </div>
</div>

              <div style={{ ...twoCols, marginTop: 14 }}>
                <div className="lpCard" style={panel}>
                  <div style={accentBarOrange} />
                  <PanelHeader
                    icon={<Icon name="list" />}
                    title="Top equipos por consumo"
                    tag="ACEITES"
                    tone="blue"
                    subtitle="Ranking operativo. La comparacion se hace con valor convertido real. Si existe, tambien se muestra la captura original."
                    right={
                      oilLubId ? (
                        <Tag tone="amber">{oilLubName || "Lubricante"}</Tag>
                      ) : (
                        <Tag tone="steel">Todos</Tag>
                      )
                    }
                  />

                  {oilRows.length === 0 ? (
                    <div style={emptyTxt}>Sin datos con los filtros actuales.</div>
                  ) : (
                    <div style={tableWrap}>
                      <table style={table}>
                        <thead>
                          <tr>
                            <th style={th}>#</th>
                            <th style={th}>Equipo</th>
                            <th style={th}>Ubicacion</th>
                            <th style={th}>Senal</th>
                            <th style={{ ...th, textAlign: "right" }}>Consumo</th>
                            <th style={{ ...th, textAlign: "right" }}>Accion</th>
                          </tr>
                        </thead>
                        <tbody>
                          {oilRows.map((e, idx) => {
                            const main = formatConsumptionMain(e, "ACEITE");
                            const secondary = formatConsumptionSecondary(e, "ACEITE");

                            return (
                              <tr key={e.id}>
                                <td style={td}>{idx + 1}</td>
                                <td style={td}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                    <span style={{ fontWeight: 950, color: "#0f172a" }}>{e.name}</span>
                                    <EqBadges obj={e} />
                                  </div>
                                </td>
                                <td style={td}>{e.location || "?"}</td>
                                <td style={td}>
                                  <SeverityChip level={e._level} />
                                </td>
                                <td style={{ ...td, textAlign: "right" }}>
                                  <div style={{ display: "grid", gap: 4, justifyItems: "end" }}>
                                    <div>{main}</div>
                                    {secondary ? (
                                      <div style={{ fontSize: 11, color: "#64748b", fontWeight: 850 }}>
                                        {secondary}
                                      </div>
                                    ) : null}
                                  </div>
                                </td>
                                <td style={{ ...td, textAlign: "right" }}>
                                  <button
                                    className="lpPress"
                                    style={btnMini}
                                    onClick={() => goEquipment(e.id)}
                                    type="button"
                                    title="Ver equipo"
                                  >
                                    Ver
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      <div style={footNote}>
                        *La senal de anomalia ya usa el motor predictivo real por equipo. El ranking se mantiene operativo por consumo del periodo.
                      </div>
                    </div>
                  )}
                </div>

                <div className="lpCard" style={panel}>
                  <div style={accentBarOrange} />
                  <PanelHeader
                    icon={<Icon name="list" />}
                    title="Top equipos por consumo"
                    tag="GRASAS"
                    tone="green"
                    subtitle="Ranking operativo. La comparacion se hace con valor convertido real. Si existe, tambien se muestra la captura original."
                    right={
                      greaseLubId ? (
                        <Tag tone="amber">{greaseLubName || "Lubricante"}</Tag>
                      ) : (
                        <Tag tone="steel">Todos</Tag>
                      )
                    }
                  />

                  {greaseRows.length === 0 ? (
                    <div style={emptyTxt}>Sin datos con los filtros actuales.</div>
                  ) : (
                    <div style={tableWrap}>
                      <table style={table}>
                        <thead>
                          <tr>
                            <th style={th}>#</th>
                            <th style={th}>Equipo</th>
                            <th style={th}>Ubicacion</th>
                            <th style={th}>Senal</th>
                            <th style={{ ...th, textAlign: "right" }}>Consumo</th>
                            <th style={{ ...th, textAlign: "right" }}>Accion</th>
                          </tr>
                        </thead>
                        <tbody>
                          {greaseRows.map((e, idx) => {
                            const main = formatConsumptionMain(e, "GRASA");
                            const secondary = formatConsumptionSecondary(e, "GRASA");

                            return (
                              <tr key={e.id}>
                                <td style={td}>{idx + 1}</td>
                                <td style={td}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                    <span style={{ fontWeight: 950, color: "#0f172a" }}>{e.name}</span>
                                    <EqBadges obj={e} />
                                  </div>
                                </td>
                                <td style={td}>{e.location || "?"}</td>
                                <td style={td}>
                                  <SeverityChip level={e._level} />
                                </td>
                                <td style={{ ...td, textAlign: "right" }}>
                                  <div style={{ display: "grid", gap: 4, justifyItems: "end" }}>
                                    <div>{main}</div>
                                    {secondary ? (
                                      <div style={{ fontSize: 11, color: "#64748b", fontWeight: 850 }}>
                                        {secondary}
                                      </div>
                                    ) : null}
                                  </div>
                                </td>
                                <td style={{ ...td, textAlign: "right" }}>
                                  <button
                                    className="lpPress"
                                    style={btnMini}
                                    onClick={() => goEquipment(e.id)}
                                    type="button"
                                    title="Ver equipo"
                                  >
                                    Ver
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      <div style={footNote}>
                        *La senal de anomalia ya usa el motor predictivo real por equipo. El ranking se mantiene operativo por consumo del periodo.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {tab === "actividades" && (
            <div className="lpCard" style={{ ...panel, marginTop: 14 }}>
              <div style={accentBarOrange} />
              <PanelHeader
                icon={<Icon name="doc" />}
                title="Actividades, analisis y tendencias"
                subtitle="KPIs, cumplimiento y tendencia mensual. Enfocado a supervision y operacion."
                right={
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={miniLbl}>Ano</span>
                      <select value={year} onChange={(e) => setYear(Number(e.target.value))} style={selectMini}>
                        {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={miniLbl}>Tecnico</span>
                      <select
                        value={techId}
                        onChange={(e) => setTechId(e.target.value)}
                        style={{ ...selectMini, minWidth: 220 }}
                      >
                        <option value="">Todos</option>
                        {techOptions.map((x) => (
                          <option key={x.technicianId} value={String(x.technicianId)}>
                            {x?.technician?.name || `Tecnico #${x.technicianId}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                }
              />

              <div style={{ marginTop: 12 }}>
                <ExecutionsKpis days={180} techId={techId ? Number(techId) : undefined} />
              </div>

              <div style={{ marginTop: 12 }}>
                <ExecutionsMonthlyChart year={year} techId={techId ? Number(techId) : undefined} />
              </div>

              {!techId && (
                <div style={{ marginTop: 14 }}>
                  <TechniciansPerformance days={180} />
                </div>
              )}
            </div>
          )}

          {tab === "condicion" && (
            <div className="lpCard" style={{ ...panel, marginTop: 14 }}>
              <div style={accentBarOrange} />

              <PanelHeader
                icon={<Icon name="warn" />}
                title="Condicion y confiabilidad"
                subtitle="Backlog, origen del hallazgo, tiempos de atencion y reincidencia operativa."
                right={
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={miniLbl}>Rango</span>
                      <select value={crRange} onChange={(e) => setCrRange(e.target.value)} style={selectMini}>
                        <option value="30D">30 dias</option>
                        <option value="90D">90 dias</option>
                        <option value="180D">180 dias</option>
                        <option value="365D">365 dias</option>
                        <option value="MONTH">Este mes</option>
                      </select>
                    </div>

                    {crLoading ? <Tag tone="steel">Actualizando...</Tag> : null}
                  </div>
                }
              />

              {crErr ? <div style={errorBox}>{crErr}</div> : null}

              {crLoading && !crData ? (
                <div style={{ marginTop: 10, color: "#64748b", fontWeight: 900 }}>
                  Cargando...
                </div>
              ) : null}

              {!crLoading && !crErr && !crData ? (
                <div style={{ marginTop: 10, color: "#64748b", fontWeight: 900 }}>
                  Sin datos.
                </div>
              ) : null}

              {!!crData && (
                <>
                  <div style={conditionMetricGrid}>
                    <ConditionMetricCard
                      title="Reportes"
                      value={toNum(crData?.totals?.total)}
                      subtitle="Hallazgos detectados en el rango"
                      tone="steel"
                      icon={<Icon name="doc" />}
                    />
                    <ConditionMetricCard
                      title="Activos"
                      value={conditionActiveTotal}
                      subtitle={`Open ${toNum(crData?.totals?.open)} / En proceso ${toNum(
                        crData?.totals?.inProgress
                      )}`}
                      tone="amber"
                      icon={<Icon name="warn" />}
                    />
                    <ConditionMetricCard
                      title="Atendidos"
                      value={conditionAttendedTotal}
                      subtitle={`Resueltos ${toNum(crData?.totals?.resolved)} / Descartados ${toNum(
                        crData?.totals?.dismissed
                      )}`}
                      tone="green"
                      icon={<Icon name="check" />}
                    />
                    <ConditionMetricCard
                      title="Area foco"
                      value={conditionFocusArea.name}
                      subtitle={conditionFocusArea.subtitle}
                      tone="blue"
                      icon={<Icon name="route" />}
                    />
                  </div>

                  <div style={{ ...twoCols, marginTop: 14 }}>
                    <div className="lpCard" style={panel}>
                      <div style={accentBarOrange} />
                      <PanelHeader
                        icon={<Icon name="list" />}
                        title="Distribucion por categoria"
                        subtitle="Que esta ocurriendo y donde nace el hallazgo."
                      />

                      <SimpleBars
                        labels={crData?.series?.byCategory?.labels || []}
                        values={crData?.series?.byCategory?.values || []}
                        valueFmt={(v) => `${toNum(v)}`}
                      />
                    </div>

                    <div className="lpCard" style={panel}>
                      <div style={accentBarOrange} />
                      <PanelHeader
                        icon={<Icon name="doc" />}
                        title="Tiempo de atencion por area"
                        subtitle="Tiempo promedio desde detectado hasta ejecucion correctiva completada."
                      />

                      <SimpleBars
                        labels={crData?.series?.mttrAvgHoursByArea?.labels || []}
                        values={crData?.series?.mttrAvgHoursByArea?.values || []}
                        valueFmt={(v) => `${toNum(v).toFixed(2)} h`}
                      />
                    </div>
                  </div>

                  <div className="lpCard" style={{ ...panel, marginTop: 14 }}>
                    <div style={accentBarOrange} />
                    <PanelHeader
                      icon={<Icon name="route" />}
                      title="Flujo semanal"
                      subtitle="Entradas vs salidas de correctivas. Util para ver si el backlog crece."
                    />

                    <div style={tableWrap}>
                      <table style={table}>
                        <thead>
                          <tr>
                            <th style={th}>Semana (Lunes)</th>
                            <th style={{ ...th, textAlign: "right" }}>Creados</th>
                            <th style={{ ...th, textAlign: "right" }}>Resueltos</th>
                            <th style={{ ...th, textAlign: "right" }}>OPEN</th>
                            <th style={{ ...th, textAlign: "right" }}>IN_PROGRESS</th>
                            <th style={{ ...th, textAlign: "right" }}>RESOLVED</th>
                            <th style={{ ...th, textAlign: "right" }}>DISMISSED</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(crData?.series?.backlogWeekly?.labels || []).map((wk, i) => (
                            <tr key={wk}>
                              <td style={td}>{wk}</td>
                              <td style={{ ...td, textAlign: "right" }}>
                                {toNum(crData?.series?.backlogWeekly?.created?.[i])}
                              </td>
                              <td style={{ ...td, textAlign: "right" }}>
                                {toNum(crData?.series?.backlogWeekly?.resolvedByExec?.[i])}
                              </td>
                              <td style={{ ...td, textAlign: "right" }}>
                                {toNum(crData?.series?.backlogWeekly?.statusByCreatedWeek?.open?.[i])}
                              </td>
                              <td style={{ ...td, textAlign: "right" }}>
                                {toNum(crData?.series?.backlogWeekly?.statusByCreatedWeek?.inProgress?.[i])}
                              </td>
                              <td style={{ ...td, textAlign: "right" }}>
                                {toNum(crData?.series?.backlogWeekly?.statusByCreatedWeek?.resolved?.[i])}
                              </td>
                              <td style={{ ...td, textAlign: "right" }}>
                                {toNum(crData?.series?.backlogWeekly?.statusByCreatedWeek?.dismissed?.[i])}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <div style={footNote}>
                        *"Resueltos" usa la fecha de <b>executedAt</b> de la ejecucion correctiva.
                        "Status por semana" se agrupa por semana de creacion.
                      </div>
                    </div>
                  </div>

                  <div style={{ ...twoCols, marginTop: 14 }}>
                    <div className="lpCard" style={panel}>
                      <div style={accentBarOrange} />
                      <PanelHeader
                        icon={<Icon name="warn" />}
                        title="Reincidencia"
                        subtitle="Equipos con dos o mas reportes en el rango."
                      />
                      <SimpleTopList items={crData?.series?.recurrence || []} onGo={goEquipment} />
                    </div>

                    <div className="lpCard" style={panel}>
                      <div style={accentBarOrange} />
                      <PanelHeader
                        icon={<Icon name="list" />}
                        title="Equipos foco"
                        subtitle="Donde se concentra la carga de reportes."
                      />
                      <SimpleTopList items={crData?.series?.topEquipments || []} onGo={goEquipment} />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {tab === "fallas" && (
            <div className="lpCard" style={{ ...panel, marginTop: 14 }}>
              <div style={accentBarOrange} />
              <PanelHeader
                icon={<Icon name="warn" />}
                title="Fallas"
          subtitle="Top fallas por equipo. Util para priorizar causa raiz y lubricacion correctiva."
              />
              <FailuresByEquipment />
            </div>
          )}

          {tab === "ole" && (
            <div style={{ marginTop: 14, display: "grid", gap: 14 }}>
              {/* Header del OLE */}
              <div className="lpCard" style={{ ...panel, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <div style={accentBarOrange} />
                <div style={{ marginTop: 6 }}>
                  <div style={{ fontWeight: 980, fontSize: 16, color: "#0f172a" }}>KPI OLE — Overall Lubrication Effectiveness</div>
                  <div style={{ fontSize: 12, color: "#64748b", fontWeight: 900, marginTop: 2 }}>
                    Disponibilidad × Cumplimiento × Efectividad · Periodo: {oleDays} dias
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 12, fontWeight: 950, color: "#64748b" }}>Rango</span>
                  <select
                    value={oleDays}
                    onChange={(e) => setOleDays(Number(e.target.value))}
                    style={selectMini}
                  >
                    <option value={30}>30 dias</option>
                    <option value={60}>60 dias</option>
                    <option value={90}>90 dias</option>
                    <option value={180}>180 dias</option>
                  </select>
                  <button
                    className="lpPress"
                    style={btnGhost}
                    onClick={loadOle}
                    disabled={oleLoading}
                    type="button"
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <Icon name="reset" />
                      {oleLoading ? "Cargando..." : "Actualizar"}
                    </span>
                  </button>
                </div>
              </div>

              {oleErr ? <div style={errorBox}>{oleErr}</div> : null}

              {oleLoading && !oleData ? (
                <div style={{ padding: "18px 16px", borderRadius: 14, border: "1px solid rgba(226,232,240,0.95)", background: "rgba(255,255,255,0.88)", fontWeight: 900, color: "#475569" }}>
                  Cargando KPI OLE...
                </div>
              ) : null}

              {!oleLoading && oleData && (
                <>
                  {/* OLE principal */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
                    <OleGauge value={toNum(oleData.ole)} label="OLE" subtitle="Indice global de efectividad" benchmark={oleData.benchmark} />
                    <OleGauge value={toNum(oleData.availability)} label="Disponibilidad" subtitle="Equipos y planes activos vs total" color="#2563eb" />
                    <OleGauge value={toNum(oleData.compliance)} label="Cumplimiento" subtitle="Actividades completadas a tiempo" color="#16a34a" />
                    <OleGauge value={toNum(oleData.effectiveness)} label="Efectividad" subtitle="Ejecuciones sin condicion critica" color="#d97706" />
                  </div>

                  {/* Referencia */}
                  {oleData.benchmark && (
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <Tag tone="green">Meta: {oleData.benchmark.target}%</Tag>
                      <Tag tone="amber">Aceptable: {oleData.benchmark.good}%</Tag>
                      {toNum(oleData.ole) >= oleData.benchmark.target ? (
                        <Tag tone="green">En objetivo</Tag>
                      ) : toNum(oleData.ole) >= oleData.benchmark.good ? (
                        <Tag tone="amber">Aceptable — mejorar</Tag>
                      ) : (
                        <Tag tone="red">Bajo objetivo — requiere atencion</Tag>
                      )}
                    </div>
                  )}

                  {/* Tendencia mensual */}
                  {Array.isArray(oleData.monthTrend) && oleData.monthTrend.length > 0 && (
                    <div className="lpCard" style={panel}>
                      <div style={accentBarOrange} />
                      <PanelHeader
                        icon={<Icon name="trendUp" />}
                        title="Tendencia mensual OLE"
                        subtitle="Evolucion de los 4 indicadores por mes."
                      />
                      <div style={{ overflowX: "auto", marginTop: 10 }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <thead>
                            <tr>
                              {["Mes", "OLE %", "Disponibilidad %", "Cumplimiento %", "Efectividad %"].map((h) => (
                                <th key={h} style={{ textAlign: "left", fontSize: 12, color: "#64748b", padding: "8px 10px", fontWeight: 950 }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {oleData.monthTrend.map((row) => {
                              const oleVal = toNum(row.ole);
                              const target = oleData.benchmark?.target ?? 85;
                              const good = oleData.benchmark?.good ?? 75;
                              const oleFg = oleVal >= target ? "#166534" : oleVal >= good ? "#92400e" : "#991b1b";
                              return (
                                <tr key={row.month} style={{ borderTop: "1px solid rgba(226,232,240,0.75)" }}>
                                  <td style={{ padding: "10px 10px", fontWeight: 950, color: "#0f172a", fontSize: 13 }}>{row.month}</td>
                                  <td style={{ padding: "10px 10px", fontWeight: 980, color: oleFg, fontSize: 14 }}>{oleVal.toFixed(1)}%</td>
                                  <td style={{ padding: "10px 10px", color: "#334155", fontSize: 13 }}>{toNum(row.availability).toFixed(1)}%</td>
                                  <td style={{ padding: "10px 10px", color: "#334155", fontSize: 13 }}>{toNum(row.compliance).toFixed(1)}%</td>
                                  <td style={{ padding: "10px 10px", color: "#334155", fontSize: 13 }}>{toNum(row.effectiveness).toFixed(1)}%</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Detalle executions */}
                  {oleData.executions && (
                    <div className="lpCard" style={panel}>
                      <div style={accentBarOrange} />
                      <PanelHeader icon={<Icon name="doc" />} title="Datos del periodo" subtitle="Base de calculo para el OLE." />
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginTop: 12 }}>
                        {[
                          { label: "Programadas", value: toNum(oleData.executions.scheduled) },
                          { label: "Completadas", value: toNum(oleData.executions.completed) },
                          { label: "A tiempo", value: toNum(oleData.executions.onTime) },
                          { label: "Sin condicion critica", value: toNum(oleData.executions.noCondition) },
                        ].map((item) => (
                          <div key={item.label} style={{ padding: "12px 14px", borderRadius: 12, border: "1px solid rgba(226,232,240,0.9)", background: "rgba(248,250,252,0.9)" }}>
                            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 950 }}>{item.label}</div>
                            <div style={{ fontSize: 22, fontWeight: 980, color: "#0f172a", marginTop: 4 }}>{item.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}
    </MainLayout>
  );
}

function SimpleBars({ labels, values, valueFmt }) {
  const max = Math.max(1, ...(Array.isArray(values) ? values.map((v) => Number(v) || 0) : [1]));

  if (!labels?.length) return <div style={{ marginTop: 10, color: "#64748b", fontWeight: 900 }}>Sin datos.</div>;

  return (
    <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
      {labels.map((lab, i) => {
        const v = Number(values?.[i] || 0);
        const pct = Math.max(0, Math.min(100, (v / max) * 100));

        return (
          <div key={lab} style={{ display: "grid", gap: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <div style={{ fontWeight: 950, color: "#0f172a" }}>{lab}</div>
              <div style={{ fontWeight: 950, color: "#334155" }}>{valueFmt ? valueFmt(v) : v}</div>
            </div>

            <div
              style={{
                height: 10,
                borderRadius: 999,
                background: "rgba(226,232,240,0.95)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${pct}%`,
                  background: "linear-gradient(90deg, rgba(249,115,22,0.92) 0%, rgba(251,146,60,0.80) 100%)",
                  borderRadius: 999,
                  transition: "width 500ms ease",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SimpleTopList({ items, onGo }) {
  const rows = Array.isArray(items) ? items : [];
  if (rows.length === 0) return <div style={{ marginTop: 10, color: "#64748b", fontWeight: 900 }}>Sin datos.</div>;

  return (
    <div style={tableWrap}>
      <table style={table}>
        <thead>
          <tr>
            <th style={th}>#</th>
            <th style={th}>Equipo</th>
            <th style={{ ...th, textAlign: "right" }}>Reportes</th>
            <th style={{ ...th, textAlign: "right" }}>Accion</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={`${r.equipmentId}-${idx}`}>
              <td style={td}>{idx + 1}</td>
              <td style={td}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 950, color: "#0f172a" }}>{r.name || "Equipo"}</span>
                  {r.code ? <Tag tone="steel">{r.code}</Tag> : null}
                </div>
              </td>
              <td style={{ ...td, textAlign: "right" }}>{toNum(r.count)}</td>
              <td style={{ ...td, textAlign: "right" }}>
                <button className="lpPress" style={btnMini} onClick={() => onGo?.(r.equipmentId)} type="button">
                  Ver
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OleGauge({ value, label, subtitle, color = "#f97316", benchmark }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  const target = benchmark?.target ?? 85;
  const good = benchmark?.good ?? 75;

  let barColor = color;
  if (label === "OLE") {
    barColor = pct >= target ? "#16a34a" : pct >= good ? "#d97706" : "#dc2626";
  }

  const isMain = label === "OLE";

  return (
    <div
      className="lpCard"
      style={{
        ...panel,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        alignItems: "flex-start",
        borderTop: `4px solid ${barColor}`,
        borderRight: "1px solid rgba(226,232,240,0.95)",
        borderBottom: "1px solid rgba(226,232,240,0.95)",
        borderLeft: "1px solid rgba(226,232,240,0.95)",
      }}
    >
      <div style={accentBarOrange} />
      <div style={{ marginTop: 4, fontSize: 11, fontWeight: 950, color: barColor, textTransform: "uppercase", letterSpacing: 1 }}>
        {label}
      </div>
      <div style={{ fontSize: isMain ? 52 : 40, fontWeight: 900, color: barColor, lineHeight: 1, letterSpacing: "-0.04em" }}>
        {pct.toFixed(1)}
        <span style={{ fontSize: isMain ? 24 : 18, fontWeight: 800, opacity: 0.75 }}>%</span>
      </div>
      <div style={{ fontSize: 12, color: "#64748b", fontWeight: 850, lineHeight: 1.4 }}>{subtitle}</div>
      <div style={{ width: "100%", height: 8, borderRadius: 999, background: "rgba(226,232,240,0.95)", overflow: "hidden", marginTop: 2 }}>
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: barColor,
            borderRadius: 999,
            transition: "width 700ms cubic-bezier(0.22,1,0.36,1)",
            boxShadow: `0 0 8px ${barColor}66`,
          }}
        />
      </div>
      {isMain && benchmark ? (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 2 }}>
          <span style={{ fontSize: 11, fontWeight: 950, color: "#16a34a", padding: "3px 8px", borderRadius: 6, background: "rgba(34,197,94,0.10)", border: "1px solid rgba(34,197,94,0.22)" }}>
            Meta {benchmark.target}%
          </span>
          <span style={{ fontSize: 11, fontWeight: 950, color: "#d97706", padding: "3px 8px", borderRadius: 6, background: "rgba(245,158,11,0.10)", border: "1px solid rgba(245,158,11,0.22)" }}>
            Aceptable {benchmark.good}%
          </span>
        </div>
      ) : null}
    </div>
  );
}

/* ===================== styles ===================== */

const headerRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 14,
  flexWrap: "wrap",
  padding: "18px 20px 16px",
  borderRadius: 22,
  borderTop: "4px solid #0f172a",
  borderRight: "1px solid rgba(226,232,240,0.95)",
  borderBottom: "1px solid rgba(226,232,240,0.95)",
  borderLeft: "4px solid rgba(249,115,22,0.80)",
  background: "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.96) 55%, rgba(255,247,237,0.65) 100%)",
  boxShadow: "0 18px 36px rgba(2,6,23,0.07)",
};

const tabsWrap = {
  display: "inline-flex",
  gap: 6,
  padding: 6,
  borderRadius: 14,
  background: "rgba(226,232,240,0.75)",
  border: "1px solid rgba(148,163,184,0.55)",
  boxShadow: "0 10px 26px rgba(2,6,23,0.06)",
};

const tabBtn = {
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "rgba(148,163,184,0.35)",
  background: "rgba(255,255,255,0.7)",
  borderRadius: 12,
  padding: "10px 12px",
  cursor: "pointer",
  fontWeight: 950,
  color: "#0f172a",
};

const tabBtnActive = {
  background: "#0f172a",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#0f172a",
  color: "#fff",
  boxShadow: "0 4px 12px rgba(2,6,23,0.20)",
};

const stickyFilters = {
  marginTop: 12,
  position: "sticky",
  top: 0,
  zIndex: 10,
  background: "rgba(241,245,249,0.92)",
  border: "1px solid rgba(148,163,184,0.55)",
  boxShadow: "0 12px 30px rgba(2,6,23,0.08)",
  borderRadius: 14,
  padding: 12,
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
  backdropFilter: "blur(8px)",
};

const toggleWrap = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.9)",
  boxShadow: "0 8px 18px rgba(2,6,23,0.04)",
  cursor: "pointer",
  userSelect: "none",
};

const twoCols = {
  marginTop: 14,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
  gap: 12,
  alignItems: "stretch",
  minWidth: 0,
};

const panel = {
  position: "relative",
  minWidth: 0,
  borderTop: "1px solid rgba(226,232,240,0.95)",
  borderRight: "1px solid rgba(226,232,240,0.95)",
  borderBottom: "1px solid rgba(226,232,240,0.95)",
  borderLeft: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 18,
  padding: 16,
  background: "linear-gradient(180deg, rgba(255,255,255,0.97) 0%, rgba(248,250,252,0.93) 100%)",
  boxShadow: "0 10px 26px rgba(2,6,23,0.07)",
  overflow: "hidden",
};

const accentBarOrange = {
  position: "absolute",
  left: 0,
  right: 0,
  top: 0,
  height: 4,
  background: "linear-gradient(90deg, rgba(249,115,22,0.95) 0%, rgba(251,146,60,0.60) 60%, transparent 100%)",
};

const panelHeaderRow = {
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  flexWrap: "wrap",
  alignItems: "center",
  marginTop: 6,
};

const panelTitle = { fontWeight: 980, color: "#0f172a" };
const panelSub = { fontSize: 12, color: "#64748b", fontWeight: 900 };

const hdrIcon = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 34,
  height: 34,
  borderRadius: 12,
  background: "rgba(15,23,42,0.06)",
  border: "1px solid rgba(226,232,240,0.95)",
  color: "#0f172a",
};

const kpiGrid = {
  marginTop: 12,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 12,
};

const kpiCard = {
  position: "relative",
  minWidth: 0,
  borderTop: "4px solid rgba(249,115,22,0.90)",
  borderRight: "1px solid rgba(226,232,240,0.95)",
  borderBottom: "1px solid rgba(226,232,240,0.95)",
  borderLeft: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 14,
  padding: 14,
  background: "#fff",
  boxShadow: "0 8px 20px rgba(2,6,23,0.06)",
  overflow: "hidden",
};

const kpiTopBarDark = { display: "none" };
const kpiSideStripe = { display: "none" };

const kpiLbl = {
  fontSize: 11,
  color: "#64748b",
  fontWeight: 950,
  textTransform: "uppercase",
  letterSpacing: 0.5,
};
const kpiVal = { marginTop: 8, fontSize: 17, fontWeight: 900, color: "#0f172a", lineHeight: 1.2 };
const kpiSub = { marginTop: 6, fontSize: 12, color: "#94a3b8", fontWeight: 850, lineHeight: 1.4 };

const conditionMetricGrid = {
  marginTop: 12,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 12,
};

const conditionMetricCard = {
  position: "relative",
  minWidth: 0,
  borderRadius: 16,
  padding: 16,
  background: "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.98) 100%)",
  boxShadow: "0 12px 28px rgba(2,6,23,0.06)",
  overflow: "hidden",
};

const conditionMetricAccent = { display: "none" };

const conditionMetricHeader = {
  display: "flex",
  alignItems: "center",
  gap: 10,
};

const conditionMetricIcon = {
  width: 38,
  height: 38,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 12,
  border: "1px solid rgba(226,232,240,0.95)",
  flex: "0 0 auto",
};

const conditionMetricTitle = {
  fontSize: 12,
  fontWeight: 950,
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: 0.2,
};

const conditionMetricValue = {
  marginTop: 14,
  fontSize: 24,
  fontWeight: 900,
  color: "#0f172a",
  lineHeight: 1.05,
};

const conditionMetricSubtitle = {
  marginTop: 10,
  fontSize: 12,
  color: "#475569",
  fontWeight: 850,
  lineHeight: 1.5,
};

const tableWrap = {
  overflowX: "auto",
  marginTop: 10,
  minWidth: 0,
};
const table = { width: "100%", borderCollapse: "collapse" };
const th = { textAlign: "left", fontSize: 12, color: "#64748b", padding: "8px 6px", fontWeight: 950 };
const td = {
  padding: "10px 6px",
  borderTop: "1px solid rgba(226,232,240,0.75)",
  fontSize: 13,
  fontWeight: 850,
  color: "#0f172a",
};

const footNote = {
  marginTop: 10,
  fontSize: 12,
  color: "#64748b",
  fontWeight: 850,
};

const emptyTxt = { color: "#64748b", fontWeight: 900, marginTop: 10 };

const errorBox = {
  marginTop: 12,
  background: "rgba(254,226,226,0.92)",
  border: "1px solid rgba(254,202,202,0.95)",
  padding: 12,
  borderRadius: 12,
  color: "#991b1b",
  fontWeight: 950,
};

const btnGhost = {
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.9)",
  borderRadius: 12,
  padding: "10px 12px",
  cursor: "pointer",
  fontWeight: 950,
  color: "#0f172a",
  boxShadow: "0 8px 18px rgba(2,6,23,0.04)",
};

const btnPrimary = {
  border: "1px solid rgba(15,23,42,0.92)",
  background: "rgba(15,23,42,0.92)",
  borderRadius: 12,
  padding: "10px 12px",
  cursor: "pointer",
  fontWeight: 950,
  color: "white",
  boxShadow: "0 10px 24px rgba(2,6,23,0.10)",
};

const btnMini = {
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.9)",
  borderRadius: 10,
  padding: "8px 10px",
  cursor: "pointer",
  fontWeight: 950,
  color: "#0f172a",
  boxShadow: "0 8px 18px rgba(2,6,23,0.04)",
};

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

const miniLbl = { fontSize: 12, fontWeight: 950, color: "#64748b" };

const tagBase = {
  display: "inline-flex",
  alignItems: "center",
  padding: "6px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 950,
  border: "1px solid rgba(226,232,240,0.9)",
  lineHeight: 1,
  whiteSpace: "nowrap",
};

const tagWrapFix = { display: "inline-flex", alignItems: "center" };

/* ── Hero sub-elements ── */
const heroIconBox = {
  width: 46,
  height: 46,
  borderRadius: 15,
  display: "grid",
  placeItems: "center",
  background: "rgba(249,115,22,0.14)",
  border: "1px solid rgba(249,115,22,0.25)",
  color: "#f97316",
  flexShrink: 0,
};

const heroKicker = {
  fontSize: 10,
  fontWeight: 950,
  color: "#f97316",
  letterSpacing: 1.4,
  textTransform: "uppercase",
};

const heroH1 = {
  margin: "4px 0 0",
  fontSize: 24,
  fontWeight: 900,
  color: "#0f172a",
  lineHeight: 1.1,
  letterSpacing: "-0.03em",
};

const heroSub = {
  margin: "6px 0 0",
  color: "#64748b",
  fontWeight: 850,
  fontSize: 13,
  lineHeight: 1.45,
};

const heroMetaRow = {
  marginTop: 10,
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
};

const heroMetaChip = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  borderRadius: 999,
  padding: "5px 10px",
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.85)",
  fontWeight: 900,
  fontSize: 12,
  color: "#334155",
};



