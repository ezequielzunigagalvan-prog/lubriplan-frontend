import { useEffect, useState, useCallback } from "react";
import { getDashboardPredictiveAlerts } from "../services/dashboardService";

function currentMonthStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export default function useDashboardPredictiveAlerts({ month, enabled = true } = {}) {
  const [alerts, setAlerts] = useState(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!enabled) return;

    const safeMonth = String(month || currentMonthStr()).trim();

    // ✅ versión estricta (si la quieres como antes):
    // if (!month) return;

    try {
      setError("");
      setLoading(true);

      const res = await getDashboardPredictiveAlerts({ month: safeMonth });

      setAlerts(res?.alerts || null);
      setTotal(Number(res?.total || 0));
    } catch (e) {
      setAlerts(null);
      setTotal(0);
      setError(e?.message || "Error cargando predictivas");
    } finally {
      setLoading(false);
    }
  }, [month, enabled]);

  useEffect(() => {
    if (!enabled) return;

    let alive = true;

    (async () => {
      const safeMonth = String(month || currentMonthStr()).trim();

      // ✅ versión estricta (si la quieres como antes):
      // if (!month) return;

      try {
        setError("");
        setLoading(true);

        const res = await getDashboardPredictiveAlerts({ month: safeMonth });

        if (!alive) return;
        setAlerts(res?.alerts || null);
        setTotal(Number(res?.total || 0));
      } catch (e) {
        if (!alive) return;
        setAlerts(null);
        setTotal(0);
        setError(e?.message || "Error cargando predictivas");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [month, enabled]);

  return { alerts, total, loading, error, refresh };
}