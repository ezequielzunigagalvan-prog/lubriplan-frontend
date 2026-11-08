import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { maintenanceApi } from "../services/maintenanceApi";
import { toast } from "sonner";

const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6"];

export default function AssetHistory({ assetId, days = 90 }) {
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [assetId, days]);

  async function loadHistory() {
    try {
      setLoading(true);
      const data = await maintenanceApi.getAssetHistory(assetId, days);
      setHistory(data);
    } catch (error) {
      toast.error("Error cargando histórico: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="p-6 text-gray-500">Cargando histórico...</div>;
  if (!history) return <div className="p-6 text-red-500">Activo no encontrado</div>;

  const { asset, metrics, monthlyTrend, failureDistribution, timeline } = history;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{asset.name}</h1>
        <p className="text-gray-600">
          {asset.code} • {asset.location} • Estado: {asset.status}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Total OT", value: metrics.totalWorkOrders, icon: "📋" },
          { label: "Preventivas", value: metrics.preventive, icon: "🔧" },
          { label: "Correctivas", value: metrics.corrective, icon: "🚨" },
          {
            label: "Downtime",
            value: `${metrics.totalDowntimeHours}h`,
            icon: "⏱️",
          },
          { label: "Costo", value: `$${metrics.totalCost}`, icon: "💰" },
        ].map((kpi, i) => (
          <div key={i} className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
            <div className="text-2xl mb-1">{kpi.icon}</div>
            <div className="text-xs text-gray-600">{kpi.label}</div>
            <div className="text-xl font-bold text-blue-900">{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <div className="bg-white rounded-lg border p-4">
          <h3 className="font-bold mb-4">📈 Tendencia Mensual</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" label={{ value: "OT", angle: -90, position: "insideLeft" }} />
              <YAxis yAxisId="right" orientation="right" label={{ value: "Costo ($)", angle: 90, position: "insideRight" }} />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="count" stroke="#3b82f6" name="Órdenes" />
              <Line yAxisId="right" type="monotone" dataKey="cost" stroke="#ef4444" name="Costo" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Failure Distribution */}
        {Object.keys(failureDistribution).length > 0 && (
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-bold mb-4">⚠️ Distribución de Fallas</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={Object.entries(failureDistribution).map(([code, count]) => ({
                    name: code,
                    value: count,
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name} (${value})`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {Object.entries(failureDistribution).map((_, idx) => (
                    <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="font-bold mb-4 text-lg">📅 Histórico de Órdenes</h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {timeline.length === 0 ? (
            <p className="text-gray-500 text-sm">Sin órdenes en este período</p>
          ) : (
            timeline.map((wo, i) => (
              <div key={i} className="border-l-4 border-blue-400 pl-4 py-2 hover:bg-gray-50 transition">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <span className="font-bold">#{wo.number}</span>
                    <span className="text-xs bg-gray-200 text-gray-800 px-2 py-1 rounded ml-2">
                      {wo.type === "PREVENTIVE" ? "🔧 Preventiva" : "🚨 Correctiva"}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded ml-1 ${
                        wo.status === "FINISHED"
                          ? "bg-green-200 text-green-800"
                          : wo.status === "IN_PROGRESS"
                          ? "bg-yellow-200 text-yellow-800"
                          : "bg-gray-200 text-gray-800"
                      }`}
                    >
                      {wo.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">
                    {new Date(wo.date).toLocaleDateString()}
                  </div>
                </div>
                <p className="text-sm text-gray-700 mb-2">{wo.title}</p>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div className="bg-blue-50 p-2 rounded">
                    <div className="text-gray-600">Downtime</div>
                    <div className="font-bold">{Math.round(wo.downtime / 60)}h</div>
                  </div>
                  <div className="bg-green-50 p-2 rounded">
                    <div className="text-gray-600">Costo</div>
                    <div className="font-bold">${Math.round(wo.cost)}</div>
                  </div>
                  <div className="bg-purple-50 p-2 rounded">
                    <div className="text-gray-600">Fotos</div>
                    <div className="font-bold">{wo.photoCount}</div>
                  </div>
                  {wo.failure && (
                    <div className="bg-red-50 p-2 rounded">
                      <div className="text-gray-600">Falla</div>
                      <div className="font-bold text-xs">{wo.failure.mode}</div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
