// src/hooks/useNotifications.js
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { usePlant } from "../context/PlantContext";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../services/notificationsService";

function useNotifications({ enabled = true, limit = 10, unreadOnly = false } = {}) {
  const { token } = useAuth();
  const { currentPlantId } = usePlant();

  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refreshTimerRef = useRef(null);
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      if (refreshTimerRef.current) window.clearTimeout(refreshTimerRef.current);
    };
  }, []);

  useEffect(() => {
    setItems([]);
    setUnreadCount(0);
    setError("");
  }, [currentPlantId]);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    if (!token) return;
    if (!currentPlantId) {
      if (!aliveRef.current) return;
      setItems([]);
      setUnreadCount(0);
      setError("");
      setLoading(false);
      return;
    }

    try {
      if (!aliveRef.current) return;
      setError("");
      setLoading(true);

      const res = await getNotifications({ unread: unreadOnly, limit });
      if (!aliveRef.current) return;

      setItems(Array.isArray(res?.items) ? res.items : []);
      setUnreadCount(Number(res?.unreadCount || 0));
    } catch (e) {
      if (!aliveRef.current) return;
      setError(e?.message || "Error cargando notificaciones");
    } finally {
      if (!aliveRef.current) return;
      setLoading(false);
    }
  }, [enabled, token, currentPlantId, limit, unreadOnly]);

  const refreshSoon = useCallback(() => {
    if (!enabled || !token || !currentPlantId) return;

    if (refreshTimerRef.current) window.clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = window.setTimeout(() => {
      refresh();
    }, 350);
  }, [enabled, token, currentPlantId, refresh]);

  const markRead = useCallback(
    async (id) => {
      if (!token || !currentPlantId) return;

      const nid = Number(id);
      if (!Number.isFinite(nid)) return;

      setItems((prev) =>
        prev.map((n) =>
          Number(n.id) === nid ? { ...n, readAt: n.readAt || new Date().toISOString() } : n
        )
      );
      setUnreadCount((c) => Math.max(0, Number(c || 0) - 1));

      try {
        await markNotificationRead({ id: nid });
        refreshSoon();
      } catch (e) {
        refreshSoon();
        throw e;
      }
    },
    [token, currentPlantId, refreshSoon]
  );

  const markAllRead = useCallback(async () => {
    if (!token || !currentPlantId) return;

    setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() })));
    setUnreadCount(0);

    try {
      await markAllNotificationsRead();
      refreshSoon();
    } catch (e) {
      refreshSoon();
      throw e;
    }
  }, [token, currentPlantId, refreshSoon]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    items,
    unreadCount,
    loading,
    error,
    refresh,
    refreshSoon,
    markRead,
    markAllRead,
    readOne: markRead,
    readAll: markAllRead,
  };
}

export default useNotifications;
