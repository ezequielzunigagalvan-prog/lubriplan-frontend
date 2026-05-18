// src/components/reports/WeeklyTrendChart.jsx
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

function toWeeksFromMonthlyCounts({ completed = 0, pending = 0, overdue = 0 }) {
  // ⚠️ Placeholder inteligente: si NO tienes series por día/semana aún,
  // repartimos el total en 4 semanas de forma proporcional.
  // Cuando tengas endpoint real, reemplazas este helper por data real.
  const total = Number(completed) + Number(pending) + Number(overdue);
  if (!total) {
    return [
      { label: "Sem 1", completed: 0 },
      { label: "Sem 2", completed: 0 },
      { label: "Sem 3", completed: 0 },
      { label: "Sem 4", completed: 0 },
    ];
  }

  const w1 = Math.round(Number(completed) * 0.22);
  const w2 = Math.round(Number(completed) * 0.26);
  const w3 = Math.round(Number(completed) * 0.25);
  const w4 = Math.max(0, Number(completed) - w1 - w2 - w3);

  return [
    { label: "Sem 1", completed: w1 },
    { label: "Sem 2", completed: w2 },
    { label: "Sem 3", completed: w3 },
    { label: "Sem 4", completed: w4 },
  ];
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={ttBox}>
      <div style={{ fontWeight: 900, color: "#f8fafc" }}>{label}</div>
      <div style={{ marginTop: 4, fontSize: 12, color: "#94a3b8", fontWeight: 800 }}>
        Completadas: <span style={{ color: "#f97316" }}>{payload[0]?.value}</span>
      </div>
    </div>
  );
}

export default function WeeklyTrendChart({ monthlyTotals }) {
  const data = toWeeksFromMonthlyCounts(monthlyTotals || {});

  return (
    <div style={card}>
      <div style={{ fontWeight: 900, fontSize: 15, color: "#0f172a" }}>
        Tendencia de ejecución (semanal)
      </div>
      <div style={{ marginTop: 4, fontSize: 12, fontWeight: 850, color: "#64748b" }}>
        Completadas por semana (estimación hasta conectar endpoint real)
      </div>

      <div style={{ marginTop: 14, width: "100%", height: 220 }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(226,232,240,0.9)" />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#64748b", fontWeight: 800 }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b", fontWeight: 800 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="completed"
              stroke="#2563eb"
              strokeWidth={3}
              dot={{ r: 4, fill: "#2563eb", strokeWidth: 0 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const card = {
  border: "1px solid rgba(226,232,240,0.95)",
  borderTop: "3px solid #0f172a",
  borderRadius: 16,
  padding: 14,
  background: "linear-gradient(180deg, rgba(255,255,255,0.97) 0%, rgba(248,250,252,0.92) 100%)",
  boxShadow: "0 10px 24px rgba(2,6,23,0.06)",
};

const ttBox = {
  background: "#0f172a",
  border: "1px solid rgba(249,115,22,0.35)",
  borderRadius: 12,
  padding: "8px 12px",
  boxShadow: "0 12px 28px rgba(2,6,23,0.28)",
  minWidth: 130,
};