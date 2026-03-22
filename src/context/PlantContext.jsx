import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { apiFetch } from "../services/api";
import { getToken } from "../auth/auth.js";

const PlantContext = createContext(null);

export function PlantProvider({ children }) {
  const [plants, setPlants] = useState([]);
  const [currentPlantId, setCurrentPlantId] = useState(() => {
    return localStorage.getItem("lp_currentPlantId") || "";
  });
  const [loadingPlants, setLoadingPlants] = useState(false);
  const [plantsError, setPlantsError] = useState(null);

  const clearPlantState = useCallback(() => {
    setPlants([]);
    setCurrentPlantId("");
    setPlantsError(null);
    setLoadingPlants(false);
    localStorage.removeItem("lp_currentPlantId");
  }, []);

  const refreshPlants = useCallback(async () => {
    const token = getToken();

    if (!token) {
      clearPlantState();
      return;
    }

    setPlantsError(null);
    setLoadingPlants(true);

    try {
      const data = await apiFetch("/plants");
      const list = Array.isArray(data?.plants) ? data.plants : [];

      setPlants(list);

      const storedPlantId = localStorage.getItem("lp_currentPlantId") || "";
      const incomingDefault =
        data?.defaultPlantId ||
        list.find((p) => p.isDefault)?.id ||
        list[0]?.id ||
        null;

      const currentExists =
        storedPlantId &&
        list.some((p) => String(p.id) === String(storedPlantId));

      if (currentExists) {
        setCurrentPlantId(String(storedPlantId));
      } else if (incomingDefault) {
        const idStr = String(incomingDefault);
        setCurrentPlantId(idStr);
        localStorage.setItem("lp_currentPlantId", idStr);
      } else {
        setCurrentPlantId("");
        localStorage.removeItem("lp_currentPlantId");
      }
    } catch (e) {
      console.error("refreshPlants error:", e);

      const msg = e?.message || "Error cargando plantas";

      if (
        msg.includes("Token inválido") ||
        msg.includes("401") ||
        msg.includes("Unauthorized")
      ) {
        clearPlantState();
      } else {
        setPlants([]);
        setPlantsError(msg);
      }
    } finally {
      setLoadingPlants(false);
    }
  }, [clearPlantState]);

  useEffect(() => {
    const token = getToken();

    if (!token) {
      clearPlantState();
      return;
    }

    refreshPlants();
  }, [refreshPlants, clearPlantState]);

  // ✅ Cuando el login termina, vuelve a cargar plantas
  useEffect(() => {
    const onLoginSuccess = () => {
      refreshPlants();
    };

    window.addEventListener("lubriplan:login-success", onLoginSuccess);

    return () => {
      window.removeEventListener("lubriplan:login-success", onLoginSuccess);
    };
  }, [refreshPlants]);

  // ✅ Si se limpia sesión, limpia planta
  useEffect(() => {
    const onLogout = () => {
      clearPlantState();
    };

    window.addEventListener("lubriplan:logout", onLogout);

    return () => {
      window.removeEventListener("lubriplan:logout", onLogout);
    };
  }, [clearPlantState]);

  const setPlant = useCallback(
    async (plantId) => {
      const token = getToken();
      const idStr = String(plantId || "");

      if (!token) return;
      if (!idStr || String(currentPlantId) === idStr) return;

      setCurrentPlantId(idStr);
      localStorage.setItem("lp_currentPlantId", idStr);

      try {
        await apiFetch(`/plants/${idStr}/default`, { method: "POST" });
      } catch (e) {
        console.warn("No se pudo marcar default plant:", e?.message);
      }

      window.dispatchEvent(new Event("lubriplan:plant-changed"));
    },
    [currentPlantId]
  );

  const currentPlant = useMemo(() => {
    return plants.find((p) => String(p.id) === String(currentPlantId)) || null;
  }, [plants, currentPlantId]);

  const value = useMemo(
    () => ({
      plants,
      currentPlantId,
      currentPlant,
      loadingPlants,
      plantsError,
      refreshPlants,
      setPlant,
      clearPlantState,
    }),
    [
      plants,
      currentPlantId,
      currentPlant,
      loadingPlants,
      plantsError,
      refreshPlants,
      setPlant,
      clearPlantState,
    ]
  );

  return <PlantContext.Provider value={value}>{children}</PlantContext.Provider>;
}

export function usePlant() {
  const ctx = useContext(PlantContext);
  if (!ctx) throw new Error("usePlant debe usarse dentro de <PlantProvider />");
  return ctx;
}