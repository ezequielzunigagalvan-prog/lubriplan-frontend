// src/components/analytics/MonthlyConsumptionChartCard.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { getMonthlyTotal } from "../../services/analyticsService";

const toNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

const formatGramsSmart = (grams) => {
  const g = toNum(grams);
  if (g >= 1000) return `${(g / 1000).toFixed(2)} kg`;
  return `${Math.round(g)} g`;
};

const formatMlToLiters = (ml) => `${(toNum(ml) / 1000).toFixed(2)} L`;

const formatByKind = (n, kind) => {
  if (kind === "ACEITE") return formatMlToLiters(n);
  if (kind === "GRASA") return formatGramsSmart(n);
  return String(toNum(n));
};

const monthKey = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
};

const addMonths = (d, n) => {
  const x = new Date(d);
  x.setDate(1);
  x.setMonth(x.getMonth() + n);
  return x;
};

const monthsBetweenInclusive = (fromDate, toDate) => {
  const start = new Date(fromDate);
  const end = new Date(toDate);
  start.setDate(1);
  end.setDate(1);

  const out = [];
  let cur = new Date(start);
  while (cur <= end) {
    out.push(monthKey(cur));
    cur = addMonths(cur, 1);
  }
  return out;
};

const monthLabelShort = (ym) => {
  if (!/^\d{4}-\d{2}$/.test(String(ym || ""))) return ym || "—";
  const [y, m] = ym.split("-").map(Number);
  const monthsEs = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return `${monthsEs[(m || 1) - 1]} ${String(y).slice(2)}`;
};

function CustomTooltip({ active, payload, label, kind }) {
  if (!active || !payload?.length) return null;

  const row = payload[0]?.payload || {};
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: "10px 12px",
        boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
      }}
    >
      <div style={{ fontWeight: 900, color: "#0f172a" }}>{label || row.month}</div>
      <div style={{ marginTop: 4, fontSize: 12, color: "#475569", fontWeight: 800 }}>
        Total: <span style={{ color: "#0f172a" }}>{formatByKind(row.totalRaw, kind)}</span>
      </div>
    </div>
  );
}

function useElementWidth() {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let frame = 0;

    const update = () => {
      const rect = el.getBoundingClientRect();
      const next = Math.floor(rect.width || el.offsetWidth || 0);
      setWidth(next);
    };

    const scheduleUpdate = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };

    scheduleUpdate();

    const ro = new ResizeObserver(() => {
      scheduleUpdate();
    });

    ro.observe(el);
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, []);

  return { ref, width };
}

export default function MonthlyConsumptionChartCard({
  title = "Consumo",
  kind,
  days = 180,
  lubricantId,
}) {
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const { ref: chartRef, width: chartWidth } = useElementWidth();
  const safeChartWidth = Math.max(chartWidth || 0, 640);
  const chartHeight = 290;

  const gradientId = useMemo(
    () => `monthly-consumption-grad-${kind}-${String(lubricantId ?? "all")}`,
    [kind, lubricantId]
  );

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setErr("");
        setLoading(true);

        const json = await getMonthlyTotal(days, kind, lubricantId);
        if (!mounted) return;

        const raw = Array.isArray(json?.series) ? json.series : [];
        setSeries(raw);
      } catch (e) {
        if (!mounted) return;
        setErr(e?.message || "Error cargando consumo mensual");
        setSeries([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [days, kind, lubricantId]);

  const normalized = useMemo(() => {
    const today = new Date();
    const from = new Date();
    from.setDate(from.getDate() - Number(days || 180));

    const wantedMonths = monthsBetweenInclusive(from, today);

    const map = new Map(
      (series || [])
        .map((x) => ({
          month: String(x?.month || ""),
          total: toNum(x?.total),
        }))
        .filter((x) => /^\d{4}-\d{2}$/.test(x.month))
        .map((x) => [x.month, x.total])
    );

    return wantedMonths.map((m) => ({
      month: m,
      label: monthLabelShort(m),
      totalRaw: toNum(map.get(m) || 0),
      totalChart: kind === "ACEITE" ? toNum(map.get(m) || 0) / 1000 : toNum(map.get(m) || 0),
    }));
  }, [series, days, kind]);

  const stats = useMemo(() => {
    const vals = normalized.map((x) => toNum(x.totalRaw));
    const total = vals.reduce((a, b) => a + b, 0);
    const max = vals.length ? Math.max(...vals) : 0;
    const avg = vals.length ? total / vals.length : 0;

    let topMonth = "—";
    let topVal = -1;

    for (const x of normalized) {
      if (x.totalRaw > topVal) {
        topVal = x.totalRaw;
        topMonth = x.month;
      }
    }

    return { total, max, avg, topMonth, topVal };
  }, [normalized]);

  const compare = useMemo(() => {
    if (!normalized.length) return null;
    const last = normalized[normalized.length - 1];
    const prev = normalized[normalized.length - 2] || { month: "—", totalRaw: 0 };

    const delta = Number(last.totalRaw || 0) - Number(prev.totalRaw || 0);
    const pct = Number(prev.totalRaw || 0) > 0 ? (delta / prev.totalRaw) * 100 : null;

    return {
      lastMonth: last.month,
      prevMonth: prev.month,
      lastTotal: Number(last.totalRaw || 0),
      prevTotal: Number(prev.totalRaw || 0),
      delta,
      pct,
    };
  }, [normalized]);

  const avgChart = useMemo(() => {
    if (!normalized.length) return 0;
    const vals = normalized.map((x) => toNum(x.totalChart));
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  }, [normalized]);

  const chartColor = kind === "ACEITE" ? "#2563eb" : "#16a34a";
  const unitHint = kind === "ACEITE" ? "Unidad: L" : "Unidad: g / kg";
  const formatChartAxis = useCallbackValueFormatter(kind);

  if (loading) {
    return (
      <div style={card}>
        <div style={titleRow}>
          <div style={titleTxt}>{title}</div>
          <div style={unitHintSt}>{unitHint}</div>
        </div>
        <div style={{ color: "#64748b", fontWeight: 800 }}>Cargando…</div>
      </div>
    );
  }

  if (err) {
    return (
      <div style={card}>
        <div style={titleRow}>
          <div style={titleTxt}>{title}</div>
          <div style={unitHintSt}>{unitHint}</div>
        </div>
        <div style={errorBox}>{err}</div>
      </div>
    );
  }

  if (!normalized.length) {
    return (
      <div style={card}>
        <div style={titleRow}>
          <div style={titleTxt}>{title}</div>
          <div style={unitHintSt}>{unitHint}</div>
        </div>
        <div style={{ color: "#64748b", fontWeight: 800 }}>Sin datos en el rango.</div>
      </div>
    );
  }

  const deltaSign = compare?.delta >= 0 ? "+" : "";
  const deltaLabel =
    compare?.pct == null
      ? `${deltaSign}${formatByKind(compare?.delta, kind)}`
      : `${deltaSign}${formatByKind(compare?.delta, kind)} (${deltaSign}${compare.pct.toFixed(1)}%)`;

  return (
    <div style={card}>
      <div style={titleRow}>
        <div style={titleTxt}>{title}</div>
        <div style={unitHintSt}>{unitHint}</div>
      </div>

      <div style={kpiRow}>
        <div style={kpiPill}>
          <div style={kpiLabel}>Total</div>
          <div style={kpiVal}>{formatByKind(stats.total, kind)}</div>
        </div>
        <div style={kpiPill}>
          <div style={kpiLabel}>Promedio</div>
          <div style={kpiVal}>{formatByKind(stats.avg, kind)}</div>
        </div>
        <div style={kpiPill}>
          <div style={kpiLabel}>Mes TOP</div>
          <div style={kpiVal}>{stats.topMonth}</div>
        </div>
      </div>

      {compare ? (
        <div style={compareWrap}>
          <div style={compareTitle}>Comparación vs mes anterior</div>
          <div style={compareText}>
            {compare.prevMonth} → {compare.lastMonth}
          </div>
          <div style={compareDelta}>{deltaLabel}</div>
        </div>
      ) : null}

      <div style={chartOuter} ref={chartRef}>
        <div style={chartInner}>
          <AreaChart
            width={safeChartWidth}
            height={chartHeight}
            data={normalized}
            margin={{ top: 10, right: 16, left: 0, bottom: 6 }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={chartColor} stopOpacity={0.28} />
                <stop offset="100%" stopColor={chartColor} stopOpacity={0.04} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12, fill: "#64748b", fontWeight: 800 }}
              axisLine={{ stroke: "#e5e7eb" }}
              tickLine={{ stroke: "#e5e7eb" }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#64748b", fontWeight: 800 }}
              axisLine={{ stroke: "#e5e7eb" }}
              tickLine={{ stroke: "#e5e7eb" }}
              tickFormatter={formatChartAxis}
            />
            <Tooltip content={<CustomTooltip kind={kind} />} />
            <ReferenceLine
              y={avgChart}
              stroke="#94a3b8"
              strokeDasharray="4 4"
              label={{
                value: "Prom",
                position: "insideTopRight",
                fill: "#64748b",
                fontSize: 11,
                fontWeight: 800,
              }}
            />
            <Area
              type="monotone"
              dataKey="totalChart"
              stroke={chartColor}
              fill={`url(#${gradientId})`}
              strokeWidth={3}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </div>
      </div>

      <div style={footerNote}>Tendencia mensual de consumo consolidado.</div>
    </div>
  );
}

function useCallbackValueFormatter(kind) {
  return useMemo(() => {
    if (kind === "ACEITE") {
      return (v) => `${toNum(v).toFixed(1)} L`;
    }
    return (v) => {
      const n = toNum(v);
      if (n >= 1000) return `${(n / 1000).toFixed(1)} kg`;
      return `${Math.round(n)} g`;
    };
  }, [kind]);
}

const card = {
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  padding: 14,
  background: "#fff",
  overflow: "hidden",
};

const titleRow = {
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  flexWrap: "wrap",
  alignItems: "baseline",
};

const titleTxt = { fontWeight: 900, color: "#0f172a" };
const unitHintSt = { fontSize: 12, color: "#64748b", fontWeight: 800 };

const kpiRow = { marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" };

const kpiPill = {
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: "10px 12px",
  background: "#f8fafc",
  minWidth: 150,
};

const kpiLabel = { fontSize: 11, color: "#64748b", fontWeight: 900 };
const kpiVal = { marginTop: 4, fontSize: 14, color: "#0f172a", fontWeight: 900 };

const compareWrap = {
  marginTop: 12,
  padding: 12,
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  background: "#f8fafc",
};

const compareTitle = { fontSize: 11, color: "#64748b", fontWeight: 900 };
const compareText = { marginTop: 4, fontSize: 12, color: "#475569", fontWeight: 800 };
const compareDelta = { marginTop: 6, fontSize: 13, color: "#0f172a", fontWeight: 900 };

const footerNote = { marginTop: 10, fontSize: 12, color: "#64748b", fontWeight: 800 };

const errorBox = {
  marginTop: 10,
  background: "#fee2e2",
  border: "1px solid #fecaca",
  padding: 10,
  borderRadius: 12,
  color: "#991b1b",
  fontWeight: 800,
};

const chartOuter = {
  marginTop: 12,
  width: "100%",
  minWidth: 0,
  overflowX: "auto",
};

const chartInner = {
  minWidth: 640,
  height: 290,
};