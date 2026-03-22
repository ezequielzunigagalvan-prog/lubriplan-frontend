// src/components/reports/EfficiencyChart.jsx
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

function safePct(num, den) {
  const a = Number(num || 0);
  const b = Number(den || 0);
  if (b <= 0) return 0;
  return Math.round((a / b) * 100);
}

export default function EfficiencyChart({ monthlyTotals }) {
  const completed = Number(monthlyTotals?.completed || 0);
  const pending = Number(monthlyTotals?.pending || 0);
  const overdue = Number(monthlyTotals?.overdue || 0);

  const total = completed + pending + overdue;
  const efficiency = safePct(completed, total);

  const data = [{ name: "Mes", efficiency }];

  return (
    <div
      style={{
        border: "1px solid rgba(226,232,240,0.95)",
        borderRadius: 16,
        padding: 12,
        background: "#fff",
      }}
    >
      <div style={{ fontWeight: 1000, color: "#0f172a" }}>Eficiencia operativa</div>
      <div style={{ marginTop: 4, fontSize: 12, fontWeight: 850, color: "#64748b" }}>
        Cumplimiento del mes = completadas / total programadas
      </div>

      <div style={{ marginTop: 10, display: "flex", gap: 12, alignItems: "baseline", flexWrap: "wrap" }}>
        <div style={{ fontSize: 28, fontWeight: 1000, color: "#0f172a" }}>{efficiency}%</div>
        <div style={{ fontSize: 12, fontWeight: 850, color: "#64748b" }}>
          Completadas: <b style={{ color: "#0f172a" }}>{completed}</b> · Total:{" "}
          <b style={{ color: "#0f172a" }}>{total}</b>
        </div>
      </div>

      <div style={{ marginTop: 10, width: "100%", height: 180 }}>
        <ResponsiveContainer>
          <BarChart data={data}>
            <XAxis dataKey="name" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Bar dataKey="efficiency" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}