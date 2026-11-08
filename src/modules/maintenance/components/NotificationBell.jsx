import { useState, useEffect } from "react";
import { maintenanceApi } from "../services/maintenanceApi";
import { Bell } from "lucide-react";
import { toast } from "sonner";

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  async function loadUnreadCount() {
    try {
      const data = await maintenanceApi.getUnreadCount();
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error("Error loading unread count:", error);
    }
  }

  async function loadNotifications() {
    try {
      setLoading(true);
      const data = await maintenanceApi.getNotifications(5);
      setNotifications(data);
    } catch (error) {
      toast.error("Error cargando notificaciones");
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAsRead(notifId) {
    try {
      await maintenanceApi.markNotificationAsRead(notifId);
      setNotifications(
        notifications.map((n) =>
          n.id === notifId ? { ...n, isRead: true } : n
        )
      );
      loadUnreadCount();
    } catch (error) {
      toast.error("Error: " + error.message);
    }
  }

  const handleBellClick = () => {
    if (!isOpen) {
      loadNotifications();
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative">
      <button
        onClick={handleBellClick}
        className="relative p-2 hover:bg-gray-100 rounded-full transition"
        title="Notificaciones"
      >
        <Bell size={24} className="text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-12 right-0 bg-white rounded-lg shadow-lg border w-80 max-h-96 overflow-hidden z-50">
          {/* Header */}
          <div className="bg-gray-50 border-b p-4 flex justify-between items-center">
            <h3 className="font-bold">Notificaciones</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700 text-xl leading-none"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              <p>Cargando...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="text-sm">✨ Sin notificaciones</p>
            </div>
          ) : (
            <div className="divide-y max-h-72 overflow-y-auto">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3 hover:bg-gray-50 transition ${!notif.isRead ? "bg-blue-50" : ""}`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">
                        {notif.title}
                      </p>
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {notif.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notif.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    {!notif.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(notif.id)}
                        className="flex-shrink-0 text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        ✓
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="bg-gray-50 border-t p-3">
            <a
              href="/maintenance/app/notifications"
              onClick={() => setIsOpen(false)}
              className="block text-center text-blue-500 hover:text-blue-700 text-sm font-bold py-2"
            >
              Ver todas →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
