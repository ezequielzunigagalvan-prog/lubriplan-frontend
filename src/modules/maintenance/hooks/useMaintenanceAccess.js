import { useState, useEffect } from "react";
import { maintenanceApi } from "../services/maintenanceApi";

export function useMaintenanceAccess() {
  const [hasAccess, setHasAccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log("🔍 [useMaintenanceAccess] Calling getAccess...");
        console.log("📍 PlantId from localStorage:", localStorage.getItem("lp_currentPlantId"));
        const response = await maintenanceApi.getAccess();
        console.log("✅ [useMaintenanceAccess] Response:", response);
        setHasAccess(response?.enabled === true);
      } catch (err) {
        console.error("❌ [useMaintenanceAccess] Error:", err);
        // If 403 or access denied, set to false; other errors are real errors
        if (err?.status === 403 || err?.data?.code === "MAINTENANCE_NOT_ENABLED") {
          setHasAccess(false);
        } else {
          setError(err?.message || "Error checking access");
          setHasAccess(false);
        }
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, []);

  return { hasAccess, loading, error };
}
