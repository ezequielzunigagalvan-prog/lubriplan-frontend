import { useEffect, useMemo, useState } from "react";
import { Cell, Pie, PieChart, Tooltip } from "recharts";
import { httpGet } from "../../services/http";
import { Icon } from "../ui/lpIcons";

function pct(part, total) {
  if (!total) return 0;
  return Math.round((Number(part || 0) / Number(total || 1)) * 100);
}

function iconForKey(key) {
  if (key === "OVERDUE") return "clock";
  if (key === "PENDING") return "alert";
  return "check";
}

function toneForKey(key) {
  if (key === "OVERDUE") return { color: "#dc2626", soft: "rgba(254,242,242,0.96)" };
  if (key === "PENDING") return { color: "#f97316", soft: "rgba(255,247,237,0.96)" };
  return { color: "#16a34a", soft: "rgba(240,253,244,0.96)" };
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload;
  if (!item) return null;
  const tone = toneForKey(item.key);
  return (
    <div
      style={{
        borderRadius: 16,
        border: "1px solid rgba(226,232,240,0.96)",
        background: "rgba(255,255,255,0.98)",
        boxShadow: "0 18px 34px rgba(2,6,23,0.14)",
        padding: 12,
        minWidth: 180,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 950, color: "#0f172a" }}>
          <span
            style={{
              width: 30,
              height: 30,
              borderRadius: 12,
              display: "grid",
              placeItems: "center",
              background: tone.soft,
              border: `1px solid ${tone.color}33`,
              color: tone.color,
            }}
          >
            <Icon name={iconForKey(item.key)} size="sm" />
          </span>
          {item.label}
        </div>
        <span style={{ fontSize: 12, fontWeight: 950, color: tone.color }}>{item.pct}%</span>
      </div>
      <div style={{ marginTop: 8, fontSize: 12, fontWeight: 850, color: "#64748b" }}>Cantidad</div>
      <div style={{ marginTop: 2, fontSize: 22, fontWeight: 1000, color: "#0f172a" }}>{item.value}</div>
    </div>
  );
}

export default function ActivitiesDonut({
  month,
  completed: completedProp,
  pending: pendingProp,
  overdue: overdueProp,
  size = 200,
  stroke = 18,
  onClickSlice,
}) {
  const shouldFetch = completedProp == null && pendingProp == null && overdueProp == null;
  const [apiData, setApiData] = useState(null);
  const [loading, setLoading] = useState(shouldFetch);
  const [error, setError] = useState(null);
  const [activeKey, setActiveKey] = useState(null);
  const [isCompact, setIsCompact] = useState(() => (typeof window !== "undefined" ? window.innerWidth < 768 : false));

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const onResize = () => setIsCompact(window.innerWidth < 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!shouldFetch) return;
    let mounted = true;
    setLoading(true);
    setError(null);
    const qs = month ? `?month=${encodeURIComponent(month)}` : "";

    httpGet(`/dashboard/activities/monthly${qs}`)
      .then((res) => {
        if (!mounted) return;
        setApiData(res);
      })
      .catch((e) => {
        if (!mounted) return;
        setError(e?.message || "Error cargando datos");
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, [month, shouldFetch]);

  const d = shouldFetch ? apiData?.data ?? {} : {};
  const completed = Number(shouldFetch ? d.completed : completedProp) || 0;
  const pending = Number(shouldFetch ? d.pending : pendingProp) || 0;
  const overdue = Number(shouldFetch ? d.overdue : overdueProp) || 0;
  const total = completed + pending + overdue;

  const data = useMemo(() => {
    const items = [
      { key: "OVERDUE", label: "Atrasadas", value: overdue, color: "#dc2626" },
      { key: "PENDING", label: "Pendientes", value: pending, color: "#f97316" },
      { key: "COMPLETED", label: "Completadas", value: completed, color: "#16a34a" },
    ];
    return items.map((item) => ({ ...item, pct: pct(item.value, total) }));
  }, [completed, pending, overdue, total]);

  const activeIndex = useMemo(() => data.findIndex((x) => x.key === activeKey), [data, activeKey]);
  const activeItem = activeIndex >= 0 ? data[activeIndex] : null;
  const chartSize = isCompact ? Math.min(size, 176) : size;
  const innerRadius = Math.max(40, chartSize * 0.28);
  const outerRadius = Math.max(innerRadius + 18, chartSize * 0.42);
  if (shouldFetch && loading) {
    return <div style={wrap}>Cargando gráfica…</div>;
  }

  if (shouldFetch && error) {
    return (
      <div style={{ ...wrap, padding: isCompact ? 12 : wrap.padding }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={iconChip}>
            <Icon name="alert" size="sm" weight="bold" />
          </span>
          <div>
            <div style={{ fontWeight: 950, color: "#0f172a" }}>No se pudo cargar la gráfica</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#64748b", marginTop: 4 }}>{String(error)}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...wrap, padding: isCompact ? 12 : wrap.padding }}>
      <div style={{ ...titleRow, flexDirection: isCompact ? "column" : "row", alignItems: isCompact ? "stretch" : titleRow.alignItems }}>
        <div style={{ ...titleLeft, alignItems: isCompact ? "flex-start" : titleLeft.alignItems }}>
          <span style={iconChip}>
            <Icon name="search" size="sm" weight="bold" />
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={title}>Distribución ejecutiva</div>
            <div style={subTitle}>{month || "Mes actual"}</div>
          </div>
        </div>

        <div style={{ ...rightMeta, width: isCompact ? "100%" : undefined, justifyContent: isCompact ? "flex-start" : undefined }}>
          <div style={metaPill}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <Icon name="calendar" size="sm" />
              Total <b style={{ color: "#0f172a" }}>{total}</b>
            </span>
          </div>
        </div>
      </div>

      <div style={{ ...body, flexDirection: isCompact ? "column" : "row", alignItems: isCompact ? "stretch" : body.alignItems, gap: isCompact ? 12 : body.gap }}>
        <div style={{ width: chartSize, minWidth: isCompact ? 0 : chartSize, height: chartSize, minHeight: chartSize, position: "relative", flex: isCompact ? "0 1 auto" : `0 0 ${chartSize}px`, alignSelf: "center", maxWidth: "100%" }}>
          <PieChart width={chartSize} height={chartSize}>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={3}
              stroke="rgba(255,255,255,0.96)"
              strokeWidth={2}
              activeIndex={activeIndex >= 0 ? activeIndex : undefined}
              activeOuterRadius={outerRadius + 8}
              onMouseEnter={(_, idx) => setActiveKey(data[idx]?.key || null)}
              onMouseLeave={() => setActiveKey(null)}
              onClick={(entry) => entry?.value > 0 && onClickSlice?.(entry.key)}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.key}
                  fill={entry.color}
                  style={{
                    cursor: entry.value > 0 && onClickSlice ? "pointer" : "default",
                    opacity: activeKey && activeKey !== entry.key ? 0.42 : entry.value > 0 ? 1 : 0.2,
                    filter: activeKey === entry.key ? "drop-shadow(0 12px 20px rgba(15,23,42,0.16))" : "none",
                  }}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>

          <div style={center}>
            <div style={{ ...centerTop, fontSize: isCompact ? 11 : centerTop.fontSize }}>{total ? "Este mes" : "Sin datos"}</div>
            <div style={{ ...centerBig, fontSize: isCompact ? 24 : centerBig.fontSize }}>{total}</div>
            <div style={{ ...centerSub, marginTop: isCompact ? 6 : centerSub.marginTop, fontSize: isCompact ? 11 : centerSub.fontSize, maxWidth: isCompact ? 148 : undefined, textAlign: "center", lineHeight: 1.25 }}>
              {activeItem ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <span style={miniDot(activeItem.color)} />
                  <b style={{ color: "#0f172a" }}>{activeItem.label}</b> · {activeItem.value} ({activeItem.pct}%)
                </span>
              ) : (
                <span style={{ color: "#64748b" }}>Resumen operativo del mes</span>
              )}
            </div>
          </div>
        </div>

        <div style={{ ...legend, minWidth: isCompact ? 0 : legend.minWidth, flex: isCompact ? "1 1 100%" : legend.flex, width: isCompact ? "100%" : undefined }}>
          {data.map((item) => {
            const isActive = activeKey === item.key;
            const tone = toneForKey(item.key);
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => item.value > 0 && onClickSlice?.(item.key)}
                onMouseEnter={() => setActiveKey(item.key)}
                onMouseLeave={() => setActiveKey(null)}
                style={{
                  ...legendRow,
                  cursor: item.value > 0 && onClickSlice ? "pointer" : "default",
                  opacity: item.value > 0 ? 1 : 0.55,
                  transform: isActive ? "translateY(-1px)" : "none",
                  boxShadow: isActive ? "0 14px 28px rgba(2,6,23,0.12)" : "none",
                  border: isActive ? `1px solid ${tone.color}44` : legendRow.border,
                }}
              >
                <span style={{ ...iconChipSmall, color: tone.color, background: tone.soft, border: `1px solid ${tone.color}33` }}>
                  <Icon name={iconForKey(item.key)} size="sm" weight="bold" />
                </span>
                <div style={{ minWidth: 0 }}>
                  <div style={legendLabel}>{item.label}</div>
                  <div style={legendSub}>
                    <span style={miniDot(item.color)} /> {item.pct}% del total
                  </div>
                </div>
                <span style={legendValue}>{item.value}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const wrap = {
  position: "relative",
  background: "radial-gradient(circle at top, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.94) 58%, rgba(241,245,249,0.92) 100%)",
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 22,
  padding: 16,
  boxShadow: "0 18px 34px rgba(2,6,23,0.08)",
  overflow: "hidden",
};

const titleRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
};

const titleLeft = {
  display: "flex",
  alignItems: "center",
  gap: 10,
};

const iconChip = {
  width: 38,
  height: 38,
  borderRadius: 15,
  background: "linear-gradient(180deg, rgba(249,115,22,0.22) 0%, rgba(249,115,22,0.12) 100%)",
  border: "1px solid rgba(249,115,22,0.24)",
  color: "#0f172a",
  display: "grid",
  placeItems: "center",
  flex: "0 0 auto",
};

const iconChipSmall = {
  width: 34,
  height: 34,
  borderRadius: 15,
  color: "#0f172a",
  display: "grid",
  placeItems: "center",
  flex: "0 0 auto",
};

const title = { fontWeight: 1000, fontSize: 15, color: "#0f172a" };
const subTitle = { fontWeight: 800, fontSize: 12, color: "#64748b", marginTop: 2 };

const rightMeta = { display: "flex", gap: 8, flexWrap: "wrap" };
const metaPill = {
  padding: "8px 12px",
  borderRadius: 999,
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.94)",
  fontWeight: 900,
  fontSize: 12,
  color: "#334155",
};

const body = {
  display: "flex",
  gap: 18,
  alignItems: "center",
  marginTop: 14,
  flexWrap: "wrap",
};

const center = {
  position: "absolute",
  inset: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  pointerEvents: "none",
};

const centerTop = { fontWeight: 900, fontSize: 12, color: "#64748b" };
const centerBig = { fontWeight: 1000, fontSize: 30, color: "#0f172a", lineHeight: 1.05 };
const centerSub = {
  marginTop: 8,
  fontWeight: 850,
  fontSize: 12,
  color: "#475569",
  background: "rgba(255,255,255,0.92)",
  border: "1px solid rgba(226,232,240,0.95)",
  padding: "6px 10px",
  borderRadius: 999,
};

const legend = { display: "flex", flexDirection: "column", gap: 10, minWidth: 272, flex: "1 1 272px" };
const legendRow = {
  display: "grid",
  gridTemplateColumns: "34px 1fr auto",
  gap: 12,
  padding: 11,
  borderRadius: 18,
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.94)",
  textAlign: "left",
  transition: "transform 160ms ease, box-shadow 160ms ease, opacity 160ms ease, border 160ms ease",
};
const legendLabel = { fontWeight: 950, fontSize: 12, color: "#0f172a" };
const legendSub = {
  marginTop: 4,
  fontWeight: 850,
  fontSize: 12,
  color: "#64748b",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
};
const legendValue = { fontWeight: 1000, fontSize: 14, color: "#0f172a" };

function miniDot(color) {
  return {
    width: 8,
    height: 8,
    borderRadius: 999,
    display: "inline-block",
    background: color,
    boxShadow: `0 0 0 4px ${color}1f`,
  };
}



