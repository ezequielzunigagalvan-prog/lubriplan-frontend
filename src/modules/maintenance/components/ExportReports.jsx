import { useState } from "react";
import { Download, FileJson, FileText, BarChart3 } from "lucide-react";
import { maintenanceApi } from "../services/maintenanceApi";
import { toast } from "sonner";

export default function ExportReports({ assetId = null }) {
  const [loading, setLoading] = useState(false);

  const downloadJSON = async (data, filename) => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAssetReport = async () => {
    if (!assetId) {
      toast.warning("Selecciona un activo");
      return;
    }

    try {
      setLoading(true);
      const report = await maintenanceApi.getAssetHistoryReport(assetId);
      const filename = `Asset_${report.asset.code}_Report_${new Date().toISOString().split("T")[0]}.json`;
      downloadJSON(report, filename);
      toast.success("Reporte descargado");
    } catch (error) {
      toast.error("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePlantSummary = async () => {
    try {
      setLoading(true);
      const report = await maintenanceApi.getPlantSummaryReport();
      const filename = `Plant_Summary_${new Date().toISOString().split("T")[0]}.json`;
      downloadJSON(report, filename);
      toast.success("Resumen descargado");
    } catch (error) {
      toast.error("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleWeeklyDigest = async () => {
    try {
      setLoading(true);
      const report = await maintenanceApi.getWeeklyDigest();
      const filename = `Weekly_Digest_${new Date().toISOString().split("T")[0]}.json`;
      downloadJSON(report, filename);
      toast.success("Resumen semanal descargado");
    } catch (error) {
      toast.error("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border-2 border-blue-200">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <Download size={24} /> Exportar Reportes
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {assetId && (
          <button
            onClick={handleAssetReport}
            disabled={loading}
            className="flex items-center gap-2 p-4 bg-white rounded-lg border-2 border-blue-300 hover:shadow-lg transition disabled:opacity-50"
          >
            <FileJson size={20} className="text-blue-600" />
            <div className="text-left">
              <div className="font-bold text-sm">Histórico por Activo</div>
              <div className="text-xs text-gray-600">JSON</div>
            </div>
          </button>
        )}

        <button
          onClick={handlePlantSummary}
          disabled={loading}
          className="flex items-center gap-2 p-4 bg-white rounded-lg border-2 border-blue-300 hover:shadow-lg transition disabled:opacity-50"
        >
          <BarChart3 size={20} className="text-green-600" />
          <div className="text-left">
            <div className="font-bold text-sm">Resumen de Planta</div>
            <div className="text-xs text-gray-600">JSON</div>
          </div>
        </button>

        <button
          onClick={handleWeeklyDigest}
          disabled={loading}
          className="flex items-center gap-2 p-4 bg-white rounded-lg border-2 border-blue-300 hover:shadow-lg transition disabled:opacity-50"
        >
          <FileText size={20} className="text-purple-600" />
          <div className="text-left">
            <div className="font-bold text-sm">Resumen Semanal</div>
            <div className="text-xs text-gray-600">JSON</div>
          </div>
        </button>
      </div>

      <div className="bg-blue-100 p-3 rounded text-sm text-blue-900">
        <strong>💡 Tip:</strong> Los reportes se descargan en formato JSON. Puedes importarlos a Excel o Google Sheets para análisis avanzado.
      </div>
    </div>
  );
}
