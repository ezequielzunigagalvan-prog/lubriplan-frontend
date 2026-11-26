// src/components/dashboard/PlantGauges.jsx
// Indicadores visuales compartidos por el dashboard multiplanta y el de cada planta.
import "../../pages/PlantsOverviewPage.css";

export function Ring({ value, size = 92, label = "del mes" }) {
  const v = value == null ? null : Math.max(0, Math.min(100, value));
  const r = (size - 12) / 2;
  const c = 2 * Math.PI * r;
  const tone = v == null ? "#94a3b8" : v >= 90 ? "#16a34a" : v >= 70 ? "#d97706" : "#dc2626";
  return (
    <div className="po-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${label} ${v == null ? "sin datos" : `${v}%`}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth="8" />
        {v != null ? (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={tone}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${(v / 100) * c} ${c}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        ) : null}
      </svg>
      <div className="po-ring-txt">
        <b>{v == null ? "—" : `${Math.round(v)}%`}</b>
        <span>{label}</span>
      </div>
    </div>
  );
}

export function Spark({ data = [] }) {
  const max = Math.max(1, ...data.map((d) => d.done));
  const total = data.reduce((n, d) => n + d.done, 0);
  return (
    <div className="po-spark" title={`${total} completadas en 14 días`}>
      {data.map((d) => (
        <span key={d.day} className="po-spark-bar" style={{ height: `${Math.max(6, (d.done / max) * 100)}%`, opacity: d.done ? 1 : 0.35 }} title={`${d.day}: ${d.done}`} />
      ))}
    </div>
  );
}

