// src/components/analytics/MonthlyLineChartCard.jsx
import { useEffect, useMemo, useRef, useState } from "react";
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
  return String(n);
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

function catmullRomPath(pts) {
  if (!pts || pts.length === 0) return "";
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;

  const p = pts.map((x) => ({ ...x }));
  const clamp = (i) => p[Math.max(0, Math.min(p.length - 1, i))];

  let d = `M ${p[0].x} ${p[0].y}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = clamp(i - 1);
    const p1 = clamp(i);
    const p2 = clamp(i + 1);
    const p3 = clamp(i + 2);

    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

function linearRegressionLine(values) {
  const n = values.length;
  if (n < 2) return null;

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (const v of values) {
    sumX += v.x;
    sumY += v.y;
    sumXY += v.x * v.y;
    sumXX += v.x * v.x;
  }

  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return null;

  const a = (n * sumXY - sumX * sumY) / denom;
  const b = (sumY - a * sumX) / n;
  return { a, b };
}

export default function MonthlyLineChartCard({
  title,
  kind,
  days = 180,
  lubricantId,
}) {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [series, setSeries] = useState([]);
  const [hover, setHover] = useState(null);
  const wrapRef = useRef(null);

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
      total: toNum(map.get(m) || 0),
    }));
  }, [series, days]);

  const stats = useMemo(() => {
    const vals = normalized.map((x) => toNum(x.total));
    const total = vals.reduce((a, b) => a + b, 0);
    const max = vals.length ? Math.max(...vals) : 0;
    const avg = vals.length ? total / vals.length : 0;

    let topMonth = "—";
    let topVal = -1;
    for (const x of normalized) {
      if (x.total > topVal) {
        topVal = x.total;
        topMonth = x.month;
      }
    }

    return { total, max, avg, topMonth, topVal };
  }, [normalized]);

  const geom = useMemo(
    () => ({ w: 760, h: 280, padX: 46, padY: 20, padBottom: 52 }),
    []
  );

  const points = useMemo(() => {
    if (!normalized.length) return [];
    const { w, h, padX, padY, padBottom } = geom;
    const innerW = w - padX * 2;
    const innerH = h - padY - padBottom;
    const maxVal = Math.max(stats.max, 1);

    return normalized.map((x, i) => {
      const t = x.total / maxVal;
      const px = padX + (i * innerW) / Math.max(1, normalized.length - 1);
      const py = padY + (1 - t) * innerH;
      return { ...x, i, px, py };
    });
  }, [normalized, stats.max, geom]);

  const color = kind === "ACEITE" ? "#2563eb" : "#16a34a";
  const fillColor = kind === "ACEITE" ? "rgba(37,99,235,0.16)" : "rgba(22,163,74,0.16)";
  const unitLabel = kind === "ACEITE" ? "Unidad base: L (ml → L)" : "Unidad base: g / kg";

  const linePath = useMemo(() => {
    const pts = points.map((p) => ({ x: p.px, y: p.py }));
    return catmullRomPath(pts);
  }, [points]);

  const areaPath = useMemo(() => {
    if (!points.length) return "";
    const { h, padBottom } = geom;
    const baseY = h - padBottom;
    const first = points[0];
    const last = points[points.length - 1];
    const curve = catmullRomPath(points.map((p) => ({ x: p.px, y: p.py })));
    return `${curve} L ${last.px} ${baseY} L ${first.px} ${baseY} Z`;
  }, [points, geom]);

  const trend = useMemo(() => {
    if (points.length < 2) return null;

    const reg = linearRegressionLine(points.map((p) => ({ x: p.i, y: p.total })));
    if (!reg) return null;

    const { a, b } = reg;
    const yAt = (i) => a * i + b;

    const { w, h, padX, padY, padBottom } = geom;
    const innerW = w - padX * 2;
    const innerH = h - padY - padBottom;
    const maxVal = Math.max(stats.max, 1);

    const p0 = { i: 0, val: yAt(0) };
    const p1 = { i: points.length - 1, val: yAt(points.length - 1) };

    const x0 = padX + (p0.i * innerW) / Math.max(1, points.length - 1);
    const x1 = padX + (p1.i * innerW) / Math.max(1, points.length - 1);

    const y0 = padY + (1 - p0.val / maxVal) * innerH;
    const y1 = padY + (1 - p1.val / maxVal) * innerH;

    return { x0, y0, x1, y1 };
  }, [points, geom, stats.max]);

  const onMove = (e) => {
    if (!wrapRef.current || points.length === 0) return;

    const rect = wrapRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;

    let best = null;
    let bestDx = Infinity;

    for (const p of points) {
      const sx = (p.px / geom.w) * rect.width;
      const dx = Math.abs(sx - mx);
      if (dx < bestDx) {
        bestDx = dx;
        best = { ...p, sx, sy: (p.py / geom.h) * rect.height };
      }
    }

    if (!best) return;

    setHover({
      i: best.i,
      month: best.month,
      total: best.total,
      x: rect.left + best.sx,
      y: rect.top + best.sy,
    });
  };

  const onLeave = () => setHover(null);

  const xTicks = useMemo(() => {
    if (!normalized.length) return [];

    const idxs = new Set([0, normalized.length - 1]);

    if (normalized.length > 4) {
      idxs.add(Math.round((normalized.length - 1) * 0.33));
      idxs.add(Math.round((normalized.length - 1) * 0.66));
    } else if (normalized.length === 4) {
      idxs.add(1);
      idxs.add(2);
    } else if (normalized.length === 3) {
      idxs.add(1);
    }

    const monthsEs = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

    return [...idxs]
      .sort((a, b) => a - b)
      .map((i) => {
        const m = normalized[i]?.month;
        const [yy, mm] = (m || "0000-01").split("-").map(Number);
        const label = `${monthsEs[Math.max(0, Math.min(11, (mm || 1) - 1))]} ${String(yy).slice(2)}`;
        return { i, label, month: m };
      });
  }, [normalized]);

  const yTicks = useMemo(() => {
    const maxVal = Math.max(stats.max, 1);
    return [1, 0.75, 0.5, 0.25, 0].map((factor) => ({
      value: maxVal * factor,
      y: geom.padY + (1 - factor) * (geom.h - geom.padY - geom.padBottom),
    }));
  }, [stats.max, geom]);

  if (loading) {
    return (
      <div className="lpCard" style={card}>
        <div style={topBar} />
        <div style={titleRow}>
          <div>
            <div style={titleTxt}>{title}</div>
            <div style={unitHint}>{unitLabel}</div>
          </div>
        </div>
        <div style={{ color: "#64748b", fontWeight: 800, marginTop: 10 }}>Cargando…</div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="lpCard" style={card}>
        <div style={topBar} />
        <div style={titleRow}>
          <div>
            <div style={titleTxt}>{title}</div>
            <div style={unitHint}>{unitLabel}</div>
          </div>
        </div>
        <div style={errorBox}>{err}</div>
      </div>
    );
  }

  if (!normalized.length) {
    return (
      <div className="lpCard" style={card}>
        <div style={topBar} />
        <div style={titleRow}>
          <div>
            <div style={titleTxt}>{title}</div>
            <div style={unitHint}>{unitLabel}</div>
          </div>
        </div>
        <div style={{ color: "#64748b", fontWeight: 800, marginTop: 10 }}>
          Sin datos en el rango.
        </div>
      </div>
    );
  }

  const gradId = `grad-${kind}-${String(lubricantId ?? "all")}`;

  return (
    <div className="lpCard" style={card}>
      <div style={topBar} />

      <div style={titleRow}>
        <div>
          <div style={titleTxt}>{title}</div>
          <div style={unitHint}>{unitLabel}</div>
        </div>

        <div style={chipsRow}>
          <span style={chip}>{kind}</span>
          <span style={chipSoft}>{days} días</span>
        </div>
      </div>

      <div style={kpiRow}>
        <div style={kpiPill}>
          <div style={kpiLabel}>Total (rango)</div>
          <div style={kpiVal}>{formatByKind(stats.total, kind)}</div>
        </div>
        <div style={kpiPill}>
          <div style={kpiLabel}>Promedio mensual</div>
          <div style={kpiVal}>{formatByKind(stats.avg, kind)}</div>
        </div>
        <div style={kpiPill}>
          <div style={kpiLabel}>Máximo</div>
          <div style={kpiVal}>{formatByKind(stats.max, kind)}</div>
        </div>
        <div style={kpiPill}>
          <div style={kpiLabel}>Mes TOP</div>
          <div style={kpiVal}>{stats.topMonth}</div>
        </div>
      </div>

      <div
        style={{ marginTop: 14, position: "relative" }}
        ref={wrapRef}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
      >
        <svg viewBox={`0 0 ${geom.w} ${geom.h}`} width="100%" height="280" style={{ display: "block" }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.22" />
              <stop offset="100%" stopColor={color} stopOpacity="0.03" />
            </linearGradient>
          </defs>

          {yTicks.map((t, idx) => (
            <g key={idx}>
              <line
                x1={geom.padX}
                x2={geom.w - geom.padX}
                y1={t.y}
                y2={t.y}
                stroke="#eef2f7"
                strokeWidth="1"
              />
              <text
                x={geom.padX - 10}
                y={t.y + 4}
                textAnchor="end"
                fontSize="11"
                fill="#94a3b8"
                style={{ fontWeight: 800 }}
              >
                {formatByKind(t.value, kind)}
              </text>
            </g>
          ))}

          <path d={areaPath} fill={`url(#${gradId})`} />
          <path d={linePath} fill="none" stroke={color} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />

          {trend ? (
            <line
              x1={trend.x0}
              y1={trend.y0}
              x2={trend.x1}
              y2={trend.y1}
              stroke={color}
              strokeWidth="2"
              strokeDasharray="6 6"
              opacity="0.55"
            />
          ) : null}

          {points.map((p) => {
            const isActive = hover?.i === p.i;
            return (
              <g key={p.month}>
                <circle cx={p.px} cy={p.py} r={isActive ? 6 : 4.5} fill={color} opacity="0.95" />
                {isActive ? (
                  <circle cx={p.px} cy={p.py} r="9" fill="none" stroke="#ffffff" strokeWidth="3" opacity="0.9" />
                ) : null}
              </g>
            );
          })}

          {xTicks.map((t) => {
            const p = points[t.i];
            if (!p) return null;
            return (
              <text
                key={t.month}
                x={p.px}
                y={geom.h - 16}
                textAnchor="middle"
                fontSize="12"
                fill="#64748b"
                style={{ fontWeight: 800 }}
              >
                {t.label}
              </text>
            );
          })}
        </svg>

        {hover ? (
          <div style={{ ...tooltip, left: hover.x, top: hover.y }}>
            <div style={{ fontWeight: 900, color: "#0f172a" }}>{hover.month}</div>
            <div style={{ marginTop: 4, fontSize: 12, color: "#475569", fontWeight: 800 }}>
              {formatByKind(hover.total, kind)}
            </div>
          </div>
        ) : null}
      </div>

      <div style={footNote}>
        Línea suavizada + tendencia lineal. Útil para ver si el consumo mensual está creciendo, bajando o estable.
      </div>
    </div>
  );
}

/* styles */
const card = {
  position: "relative",
  border: "1px solid rgba(148,163,184,0.55)",
  borderRadius: 14,
  padding: 14,
  background: "rgba(255,255,255,0.98)",
  boxShadow: "0 10px 26px rgba(2,6,23,0.08)",
  outline: "1px solid rgba(255,255,255,0.9)",
  outlineOffset: -2,
  overflow: "hidden",
};

const topBar = {
  position: "absolute",
  left: 0,
  right: 0,
  top: 0,
  height: 8,
  background: "#f97316",
};

const titleRow = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
  alignItems: "flex-start",
  marginTop: 6,
};

const titleTxt = { fontWeight: 950, color: "#0f172a", fontSize: 15 };
const unitHint = { fontSize: 12, color: "#64748b", fontWeight: 850, marginTop: 4 };

const chipsRow = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  alignItems: "center",
};

const chip = {
  display: "inline-flex",
  alignItems: "center",
  padding: "6px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 950,
  border: "1px solid rgba(226,232,240,0.9)",
  background: "rgba(249,115,22,0.12)",
  color: "#7c2d12",
  whiteSpace: "nowrap",
};

const chipSoft = {
  display: "inline-flex",
  alignItems: "center",
  padding: "6px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 950,
  border: "1px solid rgba(226,232,240,0.9)",
  background: "rgba(241,245,249,0.92)",
  color: "#334155",
  whiteSpace: "nowrap",
};

const kpiRow = {
  marginTop: 12,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: 10,
};

const kpiPill = {
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 12,
  padding: "10px 12px",
  background: "rgba(248,250,252,0.95)",
  minWidth: 0,
};

const kpiLabel = { fontSize: 11, color: "#64748b", fontWeight: 900 };
const kpiVal = { marginTop: 4, fontSize: 14, color: "#0f172a", fontWeight: 900 };

const tooltip = {
  position: "fixed",
  transform: "translate(-50%, -120%)",
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
  borderRadius: 12,
  padding: "10px 12px",
  zIndex: 9999,
  pointerEvents: "none",
  minWidth: 140,
};

const footNote = {
  marginTop: 10,
  fontSize: 12,
  color: "#64748b",
  fontWeight: 850,
};

const errorBox = {
  marginTop: 10,
  background: "#fee2e2",
  border: "1px solid #fecaca",
  padding: 10,
  borderRadius: 12,
  color: "#991b1b",
  fontWeight: 800,
};