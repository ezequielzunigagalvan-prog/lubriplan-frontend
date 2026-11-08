import { useState, useEffect } from "react";
import { AlertTriangle, TrendingUp, Clock, CheckCircle } from "lucide-react";
import { maintenanceApi } from "../services/maintenanceApi";
import { toast } from "sonner";

export default function RiskAssessmentDashboard() {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAssessments();
  }, []);

  async function loadAssessments() {
    try {
      setLoading(true);
      const data = await maintenanceApi.getRiskAssessment();
      setAssessments(data);
    } catch (error) {
      toast.error("Error cargando evaluación de riesgo: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="p-6 text-gray-500">Analizando equipos...</div>;

  const highRisk = assessments.filter((a) => a.riskLevel === "HIGH");
  const mediumRisk = assessments.filter((a) => a.riskLevel === "MEDIUM");
  const lowRisk = assessments.filter((a) => a.riskLevel === "LOW");

  const getRiskColor = (level) => {
    switch (level) {
      case "HIGH":
        return "bg-red-50 border-red-200 text-red-900";
      case "MEDIUM":
        return "bg-yellow-50 border-yellow-200 text-yellow-900";
      default:
        return "bg-green-50 border-green-200 text-green-900";
    }
  };

  const getRiskIcon = (level) => {
    switch (level) {
      case "HIGH":
        return "🔴";
      case "MEDIUM":
        return "🟡";
      default:
        return "🟢";
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">⚠️ Evaluación de Riesgo</h1>
        <p className="text-gray-600">Predicción de degradación de equipos</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { count: highRisk.length, level: "Alto", color: "bg-red-500", icon: "🔴" },
          { count: mediumRisk.length, level: "Medio", color: "bg-yellow-500", icon: "🟡" },
          { count: lowRisk.length, level: "Bajo", color: "bg-green-500", icon: "🟢" },
        ].map((card, i) => (
          <div key={i} className={`${card.color} text-white p-4 rounded-lg`}>
            <div className="text-2xl mb-1">{card.icon}</div>
            <div className="text-sm opacity-90">{card.level}</div>
            <div className="text-3xl font-bold">{card.count}</div>
          </div>
        ))}
      </div>

      {/* High Risk Assets */}
      {highRisk.length > 0 && (
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6">
          <h2 className="text-xl font-bold text-red-900 mb-4 flex items-center gap-2">
            <AlertTriangle size={24} /> Atención Inmediata Requerida
          </h2>
          <div className="space-y-3">
            {highRisk.map((asset, i) => (
              <RiskCard key={i} asset={asset} />
            ))}
          </div>
        </div>
      )}

      {/* Medium Risk Assets */}
      {mediumRisk.length > 0 && (
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6">
          <h2 className="text-xl font-bold text-yellow-900 mb-4 flex items-center gap-2">
            <TrendingUp size={24} /> Monitorear Frecuentemente
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {mediumRisk.map((asset, i) => (
              <RiskCard key={i} asset={asset} />
            ))}
          </div>
        </div>
      )}

      {/* Low Risk Assets */}
      {lowRisk.length > 0 && (
        <div className="bg-green-50 border-2 border-green-300 rounded-lg p-6">
          <h2 className="text-xl font-bold text-green-900 mb-4 flex items-center gap-2">
            <CheckCircle size={24} /> Estado Óptimo
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
            {lowRisk.slice(0, 9).map((asset, i) => (
              <div key={i} className="bg-white p-2 rounded border border-green-200">
                <div className="font-bold">{asset.code}</div>
                <div className="text-xs text-gray-600">{asset.name}</div>
              </div>
            ))}
            {lowRisk.length > 9 && (
              <div className="bg-white p-2 rounded border border-green-200 flex items-center justify-center">
                <span className="text-xs text-gray-600">+{lowRisk.length - 9} más</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function RiskCard({ asset }) {
  return (
    <div className="bg-white p-4 rounded border-l-4 border-red-500">
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="font-bold">{asset.code}</div>
          <div className="text-sm text-gray-600">{asset.name}</div>
        </div>
        <div className="text-right">
          <div className="text-xs bg-red-500 text-white px-2 py-1 rounded">
            {asset.confidence}% confianza
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
        <div className="bg-red-50 p-2 rounded">
          <div className="text-xs text-gray-600">Falla Estimada</div>
          <div className="font-bold text-red-600">
            {asset.daysUntilFailure ? `En ${asset.daysUntilFailure} días` : "N/A"}
          </div>
        </div>
        <div className="bg-red-50 p-2 rounded">
          <div className="text-xs text-gray-600">Degradación</div>
          <div className="font-bold text-red-600">{asset.degradationRate}%</div>
        </div>
      </div>

      {asset.analysis && (
        <div className="bg-red-100 p-3 rounded text-sm text-gray-800 mb-3">
          {asset.analysis}
        </div>
      )}

      {asset.recommendations && asset.recommendations.length > 0 && (
        <div className="bg-orange-50 p-3 rounded">
          <div className="text-xs font-bold text-orange-900 mb-2">Recomendaciones:</div>
          <ul className="text-xs text-orange-800 space-y-1">
            {asset.recommendations.map((rec, i) => (
              <li key={i}>✓ {rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
