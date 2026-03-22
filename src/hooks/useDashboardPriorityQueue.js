import { useCallback, useEffect, useState } from "react";
import { getDashboardPriorityQueue } from "../services/dashboardService";

export default function useDashboardPriorityQueue({ month, enabled = true } = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    try {
      setError("");
      setLoading(true);
      const res = await getDashboardPriorityQueue({ month });
      const data = res?.data ?? res;
      setItems(Array.isArray(data?.priorityQueue) ? data.priorityQueue : []);
      setTotal(Number(data?.total || 0));
    } catch (e) {
      setItems([]);
      setTotal(0);
      setError(e?.message || "Error cargando priorityQueue");
    } finally {
      setLoading(false);
    }
  }, [month, enabled]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { loading, error, items, total, refresh };
}