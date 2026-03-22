import { useEffect, useState } from "react";

const KEY = "lubriplan_alerts";
const KEY_UPDATED = "lubriplan_alerts_updatedAt";

const safeParse = (s) => {
  try { return JSON.parse(s || "{}"); } catch { return {}; }
};

export default function useGlobalAlerts() {
  const [alerts, setAlerts] = useState(() => safeParse(localStorage.getItem(KEY)));
  const [updatedAt, setUpdatedAt] = useState(() => localStorage.getItem(KEY_UPDATED) || "");

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === KEY) setAlerts(safeParse(e.newValue));
      if (e.key === KEY_UPDATED) setUpdatedAt(e.newValue || "");
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // ✅ Para cuando se actualiza en la misma pestaña (Dashboard)
  const refreshFromLocal = () => {
    setAlerts(safeParse(localStorage.getItem(KEY)));
    setUpdatedAt(localStorage.getItem(KEY_UPDATED) || "");
  };

  return { alerts: alerts || {}, updatedAt, refreshFromLocal };
}