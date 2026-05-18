// src/components/reports/EfficiencyChart.jsx
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

function safePct(num, den) {
  const a = Number(num || 0);
  const b = Number(den || 0);
  if (b <= 0) return 0;
  return Math.round((a / b) * 100);
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={ttBox}>
      <div style={{ fontWeight: 900, color: "#f8fafc" }}>Eficiencia</div>
      <div style={{ marginTop: 4, fontSize: 12, color: "#94a3b8", fontWeight: 800 }}>
        {payload[0]?.value}%
      </div>
    </div>
  );
}

export default function EfficiencyChart({ monthlyTotals }) {
  const completed = Number(monthlyTotals?.completed || 0);
  const pending = Number(monthlyTotals?.pending || 0);
  const overdue = Number(monthlyTotals?.overdue || 0);

  const total = completed + pending + overdue;
  const efficiency = safePct(completed, total);

  const data = [{ name: "Mes", efficiency }];

  const barColor = efficiency >= 80 ? "#16a34a" : efficiency >= 60 ? "#f59e0b" : "#dc2626";

  return (
    <div style={card}>
      <div style={{ fontWeight: 900, fontSize: 15, color: "#0f172a" }}>Eficiencia operativa</div>
      <div style={{ marginTop: 4, fontSize: 12, fontWeight: 850, color: "#64748b" }}>
        Cumplimiento del mes = completadas / total programadas
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 12, alignItems: "baseline", flexWrap: "wrap" }}>
        <div style={{ fontSize: 32, fontWeight: 900, color: "#0f172a" }}>{efficiency}%</div>
        <div style={{ fontSize: 12, fontWeight: 850, color: "#64748b" }}>
          Completadas: <b style={{ color: "#0f172a" }}>{completed}</b> · Total:{" "}
          <b style={{ color: "#0f172a" }}>{total}</b>
        </div>
      </div>

      <div style={{ marginTop: 14, width: "100%", height: 180 }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b", fontWeight: 800 }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "#64748b", fontWeight: 800 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="efficiency" fill={barColor} radius={[8, 8, 0, 0]} />
          </BarChart>
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
  minWidth: 120,
};