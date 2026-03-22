import { useEffect, useMemo, useRef, useState } from "react";
import { getExecutionsMonthly } from "../../services/analyticsService";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  ReferenceLine,
} from "recharts";

function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function ymToShortLabel(ym) {
  const s = String(ym || "");
  if (!/^\d{4}-\d{2}$/.test(s)) return s;

  const [y, m] = s.split("-").map(Number);
  const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return `${months[(m || 1) - 1]} ${String(y).slice(2)}`;
}

function nextMonthKey(ym) {
  const s = String(ym || "");
  if (!/^\d{4}-\d{2}$/.test(s)) return null;

  const [y, m] = s.split("-").map(Number);
  const dt = new Date(y, (m || 1) - 1, 1);
  dt.setMonth(dt.getMonth() + 1);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
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

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  const data = payload[0]?.payload || {};
  const isForecast = !!data.isForecast;

  return (
    <div
      style={{
        background: "#fff",
        borderWidth: 1,
        borderStyle: "solid",
        borderColor: "rgba(226,232,240,0.95)",
        borderRadius: 14,
        padding: 12,
        boxShadow: "0 18px 34px rgba(2,6,23,0.14)",
        minWidth: 180,
      }}
    >
      <div style={{ fontWeight: 950, color: "#0f172a" }}>
        {isForecast ? `Forecast · ${ymToShortLabel(label)}` : ymToShortLabel(label)}
      </div>

      <div
        style={{
          marginTop: 8,
          display: "grid",
          gap: 6,
          fontSize: 12,
          fontWeight: 850,
          color: "#334155",
        }}
      >
        <div>A tiempo: <b style={{ color: "#0f172a" }}>{toNum(data.onTime)}</b></div>
        <div>Tarde: <b style={{ color: "#0f172a" }}>{toNum(data.late)}</b></div>
        <div>Pendiente: <b style={{ color: "#0f172a" }}>{toNum(data.pendingDue)}</b></div>
        <div>Vencida: <b style={{ color: "#0f172a" }}>{toNum(data.overdue)}</b></div>
        <div>Total: <b style={{ color: "#0f172a" }}>{toNum(data.totalScheduled)}</b></div>

        {data.ma3 != null ? (
          <div>MA(3): <b style={{ color: "#0f172a" }}>{toNum(data.ma3).toFixed(1)}</b></div>
        ) : null}

        {isForecast && Array.isArray(data.forecastBaseMonths) && data.forecastBaseMonths.length > 0 ? (
          <div style={{ color: "#64748b" }}>
            Base: {data.forecastBaseMonths.map((x) => ymToShortLabel(x)).join(", ")}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function ExecutionsMonthlyChart({ year, techId }) {
  const y = year ?? new Date().getFullYear();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [series, setSeries] = useState([]);


  const { ref: chartRef, width: chartWidth } = useElementWidth();
const safeChartWidth = Math.max(chartWidth || 0, 720);
const chartHeight = 360;

  const load = async () => {
    try {
      setErr("");
      setLoading(true);

      const json = await getExecutionsMonthly({
        year: y,
        techId: techId ? Number(techId) : undefined,
      });

      setSeries(Array.isArray(json?.series) ? json.series : []);
    } catch (e) {
      console.error(e);
      setErr(e?.message || "Error cargando serie mensual");
      setSeries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [y, techId]);

  const ma3 = useMemo(() => {
    const totals = series.map((r) => toNum(r?.totalScheduled));

    return totals.map((_, idx) => {
      const slice = totals
        .slice(Math.max(0, idx - 2), idx + 1)
        .filter((v) => v > 0);

      if (!slice.length) return null;
      return slice.reduce((a, b) => a + b, 0) / slice.length;
    });
  }, [series]);

  const forecast = useMemo(() => {
    if (!series.length) return null;

    const active = series
      .map((r) => ({
        month: r.month,
        total: toNum(r?.totalScheduled),
      }))
      .filter((x) => x.total > 0);

    if (!active.length) return null;

    const last3 = active.slice(-3);
    const avg = last3.reduce((a, b) => a + b.total, 0) / last3.length;
    const nextMonth = nextMonthKey(active[active.length - 1].month);

    if (!nextMonth) return null;

    return {
      nextMonth,
      value: avg,
      baseMonths: last3.map((x) => x.month),
    };
  }, [series]);

  const chartData = useMemo(() => {
    const base = series.map((r, idx) => ({
      month: r.month,
      shortLabel: ymToShortLabel(r.month),
      onTime: toNum(r?.onTime),
      late: toNum(r?.late),
      pendingDue: toNum(r?.pendingDue),
      overdue: toNum(r?.overdue),
      totalScheduled: toNum(r?.totalScheduled),
      ma3: ma3[idx],
      isForecast: false,
      forecastBaseMonths: [],
    }));

    if (forecast) {
      base.push({
        month: forecast.nextMonth,
        shortLabel: ymToShortLabel(forecast.nextMonth),
        onTime: 0,
        late: 0,
        pendingDue: 0,
        overdue: 0,
        totalScheduled: Math.round(forecast.value),
        ma3: forecast.value,
        isForecast: true,
        forecastBaseMonths: forecast.baseMonths,
      });
    }

    return base;
  }, [series, ma3, forecast]);

  const summary = useMemo(() => {
    const realRows = chartData.filter((x) => !x.isForecast);
    const totals = realRows.map((x) => toNum(x.totalScheduled));
    const total = totals.reduce((a, b) => a + b, 0);
    const avg = totals.length ? total / totals.length : 0;

    return { total, avg };
  }, [chartData]);

  if (loading) {
    return (
      <div style={panel}>
        <div style={panelTop}>
          <div style={panelTitle}>Actividades por mes ({y})</div>
        </div>
        <p style={{ marginTop: 8, color: "#64748b", fontWeight: 850 }}>Cargando…</p>
      </div>
    );
  }

  if (err) {
    return (
      <div style={panel}>
        <div style={panelTop}>
          <div style={panelTitle}>Actividades por mes ({y})</div>
        </div>
        <div style={errorBox}>{err}</div>
      </div>
    );
  }

  if (series.length === 0) {
    return (
      <div style={panel}>
        <div style={panelTop}>
          <div style={panelTitle}>Actividades por mes ({y})</div>
        </div>
        <p style={{ marginTop: 8, color: "#64748b", fontWeight: 850 }}>Sin datos para el año.</p>
      </div>
    );
  }

  return (
    <div style={panel}>
      <div style={panelTop}>
        <div>
          <div style={panelTitle}>Actividades por mes ({y})</div>
          <div style={panelSub}>
            Barra apilada por estatus + promedio móvil de 3 meses + forecast del siguiente mes.
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <span style={chipGray}>Total: {summary.total}</span>
          <span style={chipGray}>Promedio: {summary.avg.toFixed(1)}</span>
          {forecast ? <span style={chipWarn}>Forecast</span> : null}
        </div>
      </div>

      <div style={legendRow}>
        <LegendDot label="A tiempo" tone="ok" />
        <LegendDot label="Tarde" tone="late" />
        <LegendDot label="Pendiente" tone="pending" />
        <LegendDot label="Vencida" tone="overdue" />
        <LegendLine label="Promedio móvil (3M)" />
        {forecast ? <LegendForecast label={`Forecast: ${ymToShortLabel(forecast.nextMonth)}`} /> : null}
      </div>

      <div style={chartOuter} ref={chartRef}>
  <div style={chartInner}>
    <ComposedChart
      width={safeChartWidth}
      height={chartHeight}
      data={chartData}
      margin={{ top: 14, right: 18, left: 0, bottom: 8 }}
      barCategoryGap={18}
    >
      <CartesianGrid strokeDasharray="3 3" stroke="rgba(226,232,240,0.9)" />
      <XAxis
        dataKey="shortLabel"
        tick={{ fontSize: 12, fill: "#64748b", fontWeight: 800 }}
        axisLine={{ stroke: "rgba(226,232,240,0.95)" }}
        tickLine={false}
      />
      <YAxis
        allowDecimals={false}
        tick={{ fontSize: 12, fill: "#64748b", fontWeight: 800 }}
        axisLine={false}
        tickLine={false}
      />
      <Tooltip content={<CustomTooltip />} />
      <Legend wrapperStyle={{ display: "none" }} />

      <ReferenceLine
        y={summary.avg}
        stroke="#cbd5e1"
        strokeDasharray="6 6"
        ifOverflow="extendDomain"
      />

      <Bar dataKey="onTime" stackId="a" name="A tiempo" radius={[10, 10, 0, 0]} maxBarSize={34}>
        {chartData.map((entry, idx) => (
          <Cell
            key={`onTime-${idx}`}
            fill={entry.isForecast ? "rgba(34,197,94,0.18)" : "#22c55e"}
          />
        ))}
      </Bar>

      <Bar dataKey="late" stackId="a" name="Tarde" maxBarSize={34}>
        {chartData.map((entry, idx) => (
          <Cell
            key={`late-${idx}`}
            fill={entry.isForecast ? "rgba(249,115,22,0.18)" : "#f97316"}
          />
        ))}
      </Bar>

      <Bar dataKey="pendingDue" stackId="a" name="Pendiente" maxBarSize={34}>
        {chartData.map((entry, idx) => (
          <Cell
            key={`pending-${idx}`}
            fill={entry.isForecast ? "rgba(245,158,11,0.18)" : "#f59e0b"}
          />
        ))}
      </Bar>

      <Bar dataKey="overdue" stackId="a" name="Vencida" radius={[0, 0, 10, 10]} maxBarSize={34}>
        {chartData.map((entry, idx) => (
          <Cell
            key={`overdue-${idx}`}
            fill={entry.isForecast ? "rgba(239,68,68,0.18)" : "#ef4444"}
          />
        ))}
      </Bar>

      <Line
        type="monotone"
        dataKey="ma3"
        name="Promedio móvil (3M)"
        stroke="#0f172a"
        strokeWidth={2.5}
        dot={{ r: 3, fill: "#0f172a" }}
        activeDot={{ r: 5 }}
        connectNulls
      />

      {forecast ? (
        <Line
          type="monotone"
          dataKey={(row) => (row.isForecast ? row.totalScheduled : null)}
          name="Forecast"
          stroke="#0f172a"
          strokeWidth={0}
          dot={{ r: 6, fill: "#0f172a" }}
          activeDot={{ r: 7 }}
          connectNulls={false}
        />
      ) : null}
    </ComposedChart>
  </div>
</div>

      <div style={note}>
        Tip: la barra apilada representa el total programado por mes. La línea muestra el promedio móvil de 3 meses.
        {forecast
          ? ` El forecast de ${ymToShortLabel(forecast.nextMonth)} usa ${forecast.baseMonths.length} meses con actividad.`
          : ""}
      </div>
    </div>
  );
}

function LegendDot({ label, tone }) {
  const st =
    tone === "ok"
      ? dotOk
      : tone === "late"
      ? dotLate
      : tone === "pending"
      ? dotPending
      : dotOverdue;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ ...dotBase, ...st }} />
      <span style={legendTxt}>{label}</span>
    </div>
  );
}

function LegendLine({ label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={legendLine} />
      <span style={legendTxt}>{label}</span>
    </div>
  );
}

function LegendForecast({ label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={legendForecast} />
      <span style={legendTxt}>{label}</span>
    </div>
  );
}

/* styles */
const panel = {
  minWidth: 0,
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "rgba(226,232,240,0.95)",
  borderRadius: 16,
  padding: 14,
  background: "#fff",
  boxShadow: "0 10px 24px rgba(2,6,23,0.05)",
  overflow: "hidden",
};

const chartOuter = {
  marginTop: 14,
  width: "100%",
  minWidth: 0,
  overflowX: "auto",
};

const chartInner = {
  minWidth: 720,
  height: 360,
};

const chartSkeleton = {
  height: 360,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#64748b",
  fontWeight: 850,
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#e5e7eb",
  borderRadius: 12,
  background: "#f8fafc",
};

const panelTop = {
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  flexWrap: "wrap",
  alignItems: "center",
};

const panelTitle = {
  fontWeight: 1000,
  color: "#0f172a",
  fontSize: 16,
};

const panelSub = {
  marginTop: 4,
  fontSize: 12,
  color: "#64748b",
  fontWeight: 850,
};

const errorBox = {
  marginTop: 10,
  background: "#fee2e2",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#fecaca",
  padding: 10,
  borderRadius: 12,
  color: "#991b1b",
  fontWeight: 800,
};

const chipGray = {
  fontSize: 12,
  fontWeight: 900,
  color: "#0f172a",
  background: "#f1f5f9",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#e5e7eb",
  padding: "5px 10px",
  borderRadius: 999,
};

const chipWarn = {
  fontSize: 12,
  fontWeight: 900,
  color: "#7c2d12",
  background: "rgba(249,115,22,0.14)",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "rgba(249,115,22,0.28)",
  padding: "5px 10px",
  borderRadius: 999,
};

const legendRow = {
  marginTop: 12,
  display: "flex",
  gap: 14,
  flexWrap: "wrap",
  alignItems: "center",
};

const legendTxt = {
  fontSize: 12,
  color: "#64748b",
  fontWeight: 900,
};

const dotBase = {
  width: 10,
  height: 10,
  borderRadius: 999,
  display: "inline-block",
};

const dotOk = { background: "#22c55e" };
const dotLate = { background: "#f97316" };
const dotPending = { background: "#f59e0b" };
const dotOverdue = { background: "#ef4444" };

const legendLine = {
  width: 18,
  height: 2,
  background: "#0f172a",
  borderRadius: 999,
  opacity: 0.9,
};

const legendForecast = {
  width: 10,
  height: 10,
  borderRadius: 999,
  background: "#0f172a",
  opacity: 0.95,
};

const note = {
  marginTop: 10,
  fontSize: 12,
  color: "#64748b",
  fontWeight: 800,
};