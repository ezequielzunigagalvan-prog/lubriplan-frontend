// Resumen de "Mis pendientes" (Plan de acción) en todas mis plantas; se recarga al cambiar de planta.
import { useEffect, useState } from "react";
import { usePlant } from "../context/PlantContext";
import { getMyActionSummary } from "../services/actionPlanService";

export default function useMyPending() {
  const [data, setData] = useState(null);
  const { currentPlantId } = usePlant();
  useEffect(() => {
    let alive = true;
    getMyActionSummary()
      .then((r) => alive && setData(r))
      .catch(() => alive && setData({ total: 0, overdue: 0, dueSoon: 0, items: [], byPlant: [], error: true }));
    return () => {
      alive = false;
    };
  }, [currentPlantId]);
  return data;
}
