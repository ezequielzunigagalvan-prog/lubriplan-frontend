import { useState, useEffect } from "react";
import { maintenanceApi } from "../services/maintenanceApi";
import { toast } from "sonner";

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, unread, low_stock, overdue, etc

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    try {
      setLoading(true);
      const data = await maintenanceApi.getNotifications(100);
      setNotifications(data);
    } catch (error) {
      toast.error("Error cargando notificaciones: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAsRead(notifId) {
    try {
      await maintenanceApi.markNotificationAsRead(notifId);
      setNotifications(
        notifications.map((n) =>
          n.id === notifId ? { ...n, isRead: true, readAt: new Date() } : n
        )
      );
      toast.success("Notificación marcada como leída");
    } catch (error) {
      toast.error("Error: " + error.message);
    }
  }

  const filtered = notifications.filter((n) => {
    if (filter === "unread") return !n.isRead;
    if (filter === "all") return true;
    return n.type === filter;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const severityColor = (severity) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-red-50 border-red-200";
      case "WARNING":
        return "bg-yellow-50 border-yellow-200";
      default:
        return "bg-blue-50 border-blue-200";
    }
  };

  const severityBadge = (severity) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-red-100 text-red-800";
      case "WARNING":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Centro de Notificaciones</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            {unreadCount} sin leer de {notifications.length}
          </div>
          <a
            href="/maintenance/app/notifications/preferences"
            className="text-sm px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 font-bold"
          >
            ⚙️ Preferencias
          </a>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {[
          { value: "all", label: "Todas" },
          { value: "unread", label: `Sin leer (${unreadCount})` },
          { value: "LOW_STOCK", label: "📦 Stock Bajo" },
          { value: "OVERDUE_WO", label: "⏰ OT Vencidas" },
          { value: "TECHNICIAN_OVERLOAD", label: "😰 Sobrecarga" },
          { value: "PREVENTIVE_SOON", label: "🔧 Preventivos" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded text-sm font-bold transition ${
              filter === f.value
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {loading ? (
        <p>Cargando notificaciones...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg mb-2">✨ Sin notificaciones</p>
          <p className="text-sm">Todo está en orden</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((notif) => (
            <div
              key={notif.id}
              className={`p-4 rounded border ${severityColor(notif.severity)} space-y-2`}
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-gray-900">{notif.title}</h3>
                    <span className={`text-xs px-2 py-1 rounded ${severityBadge(notif.severity)}`}>
                      {notif.severity}
                    </span>
                    {!notif.isRead && (
                      <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700">{notif.message}</p>
                  <div className="text-xs text-gray-500 mt-2">
                    {new Date(notif.createdAt).toLocaleString()}
                  </div>
                </div>

                <div className="flex gap-2">
                  {notif.actionUrl && (
                    <a
                      href={notif.actionUrl}
                      className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                    >
                      {notif.actionLabel || "Ver"}
                    </a>
                  )}
                  {!notif.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(notif.id)}
                      className="px-3 py-1 bg-gray-300 text-gray-800 text-sm rounded hover:bg-gray-400"
                    >
                      Marcar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
