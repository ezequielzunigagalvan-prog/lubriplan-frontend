import { useEffect, useState, useCallback } from "react";
import { getDashboardAlerts } from "../services/dashboardService";

function currentMonthStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export default function useDashboardAlerts({ month, enabled = true } = {}) {
  const [alerts, setAlerts] = useState(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!enabled) return;

    const safeMonth = String(month || currentMonthStr()).trim();

    try {
      setError("");
      setLoading(true);

      const res = await getDashboardAlerts({ month: safeMonth });

      setAlerts(res?.alerts || null);
      setTotal(Number(res?.total || 0));
    } catch (e) {
      setAlerts(null);
      setTotal(0);
      setError(e?.message || "Error cargando alertas");
    } finally {
      setLoading(false);
    }
  }, [month, enabled]);

  useEffect(() => {
    if (!enabled) return;

    let alive = true;

    (async () => {
      try {
        setError("");
        setLoading(true);

        const safeMonth = String(month || currentMonthStr()).trim();
        const res = await getDashboardAlerts({ month: safeMonth });

        if (!alive) return;
        setAlerts(res?.alerts || null);
        setTotal(Number(res?.total || 0));
      } catch (e) {
        if (!alive) return;
        setAlerts(null);
        setTotal(0);
        setError(e?.message || "Error cargando alertas");
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