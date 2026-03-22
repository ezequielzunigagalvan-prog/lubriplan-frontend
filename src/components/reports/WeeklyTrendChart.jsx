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

export default function WeeklyTrendChart({ monthlyTotals }) {
  const data = toWeeksFromMonthlyCounts(monthlyTotals || {});

  return (
    <div
      style={{
        border: "1px solid rgba(226,232,240,0.95)",
        borderRadius: 16,
        padding: 12,
        background: "#fff",
      }}
    >
      <div style={{ fontWeight: 1000, color: "#0f172a" }}>
        Tendencia de ejecución (semanal)
      </div>
      <div style={{ marginTop: 4, fontSize: 12, fontWeight: 850, color: "#64748b" }}>
        Completadas por semana (estimación hasta conectar endpoint real)
      </div>

      <div style={{ marginTop: 10, width: "100%", height: 220 }}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="4 4" />
            <XAxis dataKey="label" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="completed" strokeWidth={3} dot />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}