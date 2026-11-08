import { useState, useEffect } from "react";
import { maintenanceApi } from "../services/maintenanceApi";
import { toast } from "sonner";

export default function NotificationPreferences() {
  const [prefs, setPrefs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  async function loadPreferences() {
    try {
      setLoading(true);
      const data = await maintenanceApi.getNotificationPreferences();
      setPrefs(data || {});
    } catch (error) {
      toast.error("Error cargando preferencias: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      await maintenanceApi.updateNotificationPreferences(prefs);
      toast.success("Preferencias guardadas");
    } catch (error) {
      toast.error("Error guardando: " + error.message);
    } finally {
      setSaving(false);
    }
  }

  const toggleAlertType = (type) => {
    setPrefs({
      ...prefs,
      [type]: !prefs[type],
    });
  };

  const toggleChannel = (channel) => {
    setPrefs({
      ...prefs,
      [channel]: !prefs[channel],
    });
  };

  if (loading) return <p className="p-6">Cargando preferencias...</p>;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Preferencias de Notificaciones</h1>
        <p className="text-gray-600">Controla qué alertas deseas recibir y por qué canal</p>
      </div>

      <div className="space-y-6">
        {/* Alert Types */}
        <div className="bg-white rounded-lg border p-6 space-y-4">
          <h2 className="text-xl font-bold">📢 Tipos de Alertas</h2>
          <p className="text-sm text-gray-600">Selecciona qué alertas deseas recibir</p>

          <div className="space-y-3">
            {[
              {
                key: "enableLowStockAlerts",
                label: "📦 Stock Bajo",
                desc: "Notificación cuando el inventario está por debajo del mínimo",
              },
              {
                key: "enableOverdueAlerts",
                label: "⏰ Órdenes Vencidas",
                desc: "Alerta cuando una OT supera su fecha de vencimiento",
              },
              {
                key: "enableTechnicianOverloadAlerts",
                label: "😰 Sobrecarga de Técnicos",
                desc: "Aviso cuando un técnico tiene demasiadas órdenes abiertas",
              },
              {
                key: "enablePreventiveAlerts",
                label: "🔧 Preventivos Próximos",
                desc: "Recordatorio 7 días antes del próximo preventivo",
              },
            ].map((alert) => (
              <label key={alert.key} className="flex items-start gap-3 p-3 rounded bg-gray-50 hover:bg-gray-100 cursor-pointer">
                <input
                  type="checkbox"
                  checked={prefs[alert.key] ?? true}
                  onChange={() => toggleAlertType(alert.key)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-bold">{alert.label}</div>
                  <div className="text-sm text-gray-600">{alert.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Channels */}
        <div className="bg-white rounded-lg border p-6 space-y-4">
          <h2 className="text-xl font-bold">📧 Canales</h2>
          <p className="text-sm text-gray-600">Elige cómo prefieres recibir las notificaciones</p>

          <div className="space-y-3">
            {[
              {
                key: "enableInAppNotifications",
                label: "🔔 En la Aplicación",
                desc: "Notificaciones dentro de LubriPlan Maintenance",
              },
              {
                key: "enableEmailNotifications",
                label: "✉️ Correo Electrónico",
                desc: "Envío de alertas a tu email registrado",
              },
            ].map((channel) => (
              <label key={channel.key} className="flex items-start gap-3 p-3 rounded bg-gray-50 hover:bg-gray-100 cursor-pointer">
                <input
                  type="checkbox"
                  checked={prefs[channel.key] ?? true}
                  onChange={() => toggleChannel(channel.key)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-bold">{channel.label}</div>
                  <div className="text-sm text-gray-600">{channel.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={loadPreferences}
            className="px-6 py-2 bg-gray-200 text-gray-800 rounded font-bold hover:bg-gray-300 disabled:opacity-50"
            disabled={saving}
          >
            Descartar
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-blue-500 text-white rounded font-bold hover:bg-blue-600 disabled:opacity-50"
            disabled={saving}
          >
            {saving ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <p className="font-bold mb-1">💡 Tip</p>
        <p>Las notificaciones vencen automáticamente después de 30 días. Puedes marcar las que ya leíste para limpiar tu lista.</p>
      </div>
    </div>
  );
}
