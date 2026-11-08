import { useState, useEffect } from "react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { maintenanceApi } from "../services/maintenanceApi";
import { toast } from "sonner";

export default function Indicators() {
  const [dashboard, setDashboard] = useState(null);
  const [costs, setCosts] = useState(null);
  const [topAssets, setTopAssets] = useState([]);
  const [recurrences, setRecurrences] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIndicators();
  }, []);

  async function loadIndicators() {
    try {
      setLoading(true);
      const [dash, costData, assets, recurring] = await Promise.all([
        maintenanceApi.getDashboardSummary?.() || { summary: {} },
        maintenanceApi.getCosts?.() || { summary: {} },
        maintenanceApi.getTopAssets?.() || [],
        maintenanceApi.getRecurrence?.() || [],
      ]);

      setDashboard(dash);
      setCosts(costData);
      setTopAssets(assets);
      setRecurrences(recurring);
    } catch (error) {
      toast.error("Error cargando indicadores: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="p-6">Cargando indicadores...</div>;

  const colors = ["#38bdf8", "#0ea5e9", "#0284c7", "#0c63e4", "#7c3aed"];

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">Indicadores de Mantenimiento</h1>

      {/* KPI Cards */}
      {dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded border border-gray-200">
            <div className="text-sm font-bold text-gray-600">Total OT</div>
            <div className="text-2xl font-bold text-blue-600">{dashboard.summary?.totalOrders || 0}</div>
            <div className="text-xs text-gray-500 mt-1">
              {dashboard.summary?.preventivePercent || 0}% preventivas
            </div>
          </div>

          <div className="bg-white p-4 rounded border border-gray-200">
            <div className="text-sm font-bold text-gray-600">Preventivas</div>
            <div className="text-2xl font-bold text-green-600">{dashboard.summary?.preventive || 0}</div>
            <div className="text-xs text-gray-500 mt-1">vs {dashboard.summary?.corrective || 0} correctivas</div>
          </div>

          <div className="bg-white p-4 rounded border border-gray-200">
            <div className="text-sm font-bold text-gray-600">En Ejecución</div>
            <div className="text-2xl font-bold text-orange-600">{dashboard.summary?.inProgress || 0}</div>
            <div className="text-xs text-gray-500 mt-1">Activas ahora</div>
          </div>

          <div className="bg-white p-4 rounded border border-gray-200">
            <div className="text-sm font-bold text-gray-600">Costo Total</div>
            <div className="text-2xl font-bold text-red-600">${dashboard.costs?.total?.toFixed(2) || 0}</div>
            <div className="text-xs text-gray-500 mt-1">Últimos 30 días</div>
          </div>

          <div className="bg-white p-4 rounded border border-gray-200">
            <div className="text-sm font-bold text-gray-600">MTTR</div>
            <div className="text-2xl font-bold text-purple-600">{dashboard.mttr || 0}h</div>
            <div className="text-xs text-gray-500 mt-1">Promedio reparación</div>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost Distribution by Type */}
        {costs && costs.byType && (
          <div className="bg-white p-6 rounded border border-gray-200">
            <h2 className="text-lg font-bold mb-4">Costo por Tipo de OT</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: "Preventivas", value: costs.byType.PREVENTIVE || 0 },
                    { name: "Correctivas", value: costs.byType.CORRECTIVE || 0 },
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: $${value.toFixed(2)}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill="#38bdf8" />
                  <Cell fill="#ef4444" />
                </Pie>
                <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top Assets by Cost */}
        {topAssets.length > 0 && (
          <div className="bg-white p-6 rounded border border-gray-200">
            <h2 className="text-lg font-bold mb-4">Top Activos por Costo</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={topAssets.map((asset) => ({
                  name: asset.assetCode,
                  cost: asset.cost,
                  downtime: asset.downtime,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                <Legend />
                <Bar dataKey="cost" fill="#38bdf8" name="Costo ($)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Cost Breakdown */}
        {costs && costs.summary && (
          <div className="bg-white p-6 rounded border border-gray-200">
            <h2 className="text-lg font-bold mb-4">Desglose de Costos</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-sm font-bold">Refacciones</span>
                <span className="text-lg font-bold text-blue-600">${costs.summary.byParts?.toFixed(2) || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-sm font-bold">Mano de Obra</span>
                <span className="text-lg font-bold text-green-600">${costs.summary.byLabor?.toFixed(2) || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded border border-blue-200">
                <span className="text-sm font-bold">Total</span>
                <span className="text-lg font-bold text-blue-600">${costs.summary.total?.toFixed(2) || 0}</span>
              </div>
              <div className="text-xs text-gray-500 mt-2">Basado en {costs.summary.workOrders || 0} OT completadas</div>
            </div>
          </div>
        )}

        {/* Recurrence Issues */}
        {recurrences.length > 0 && (
          <div className="bg-white p-6 rounded border border-gray-200">
            <h2 className="text-lg font-bold mb-4">🔄 Fallas Recurrentes</h2>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {recurrences.map((rec, i) => (
                <div key={i} className="p-3 bg-yellow-50 rounded border border-yellow-200 text-sm">
                  <div className="font-bold text-orange-700">
                    {rec.assetCode}: {rec.failureMode}
                  </div>
                  <div className="text-yellow-700">
                    {rec.count}× en {rec.daysSinceFirst} días
                  </div>
                </div>
              ))}
            </div>
            {recurrences.length === 0 && <p className="text-gray-500 text-sm">Sin fallas recurrentes detectadas</p>}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded p-4 text-sm">
        <p className="font-bold text-blue-900 mb-2">📊 Sobre estos indicadores:</p>
        <ul className="space-y-1 text-blue-800">
          <li>
            <strong>MTTR:</strong> Tiempo promedio de reparación (desde que comienza hasta que termina)
          </li>
          <li>
            <strong>Costo:</strong> Incluye refacciones consumidas + estimación de mano de obra
          </li>
          <li>
            <strong>Recurrencias:</strong> Misma falla en mismo activo dentro de 30 días (señal de raíz no resuelta)
          </li>
          <li>
            <strong>Top Activos:</strong> Equipos con mayor costo acumulado en mantenimiento
          </li>
        </ul>
      </div>
    </div>
  );
}
