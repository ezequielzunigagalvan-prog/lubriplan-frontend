import { useCallback, useEffect, useState } from "react";
import {
  getLubricationCard,
  addLubricationPoint,
  updateLubricationPoint,
  deleteLubricationPoint,
  uploadCardImage,
} from "../services/lubricationCardService";

export function useLubricationCard(equipmentId) {
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const reload = useCallback(async () => {
    if (!equipmentId) return;
    setLoading(true);
    setError("");
    try {
      const data = await getLubricationCard(equipmentId);
      setCard(data?.card ?? null);
    } catch (e) {
      setError(e?.message || "Error cargando carta");
    } finally {
      setLoading(false);
    }
  }, [equipmentId]);

  useEffect(() => { reload(); }, [reload]);

  const addPoint = useCallback(async (pointData) => {
    const data = await addLubricationPoint(equipmentId, pointData);
    setCard((prev) =>
      prev ? { ...prev, points: [...(prev.points || []), data.point] } : prev
    );
    return data.point;
  }, [equipmentId]);

  const updatePoint = useCallback(async (pointId, pointData) => {
    const data = await updateLubricationPoint(pointId, pointData);
    setCard((prev) =>
      prev
        ? { ...prev, points: prev.points.map((p) => (p.id === pointId ? data.point : p)) }
        : prev
    );
    return data.point;
  }, []);

  const deletePoint = useCallback(async (pointId) => {
    await deleteLubricationPoint(pointId);
    setCard((prev) =>
      prev ? { ...prev, points: prev.points.filter((p) => p.id !== pointId) } : prev
    );
  }, []);

  const uploadImage = useCallback(async (file) => {
    const data = await uploadCardImage(equipmentId, file);
    setCard(data?.card ?? null);
    return data?.card;
  }, [equipmentId]);

  return {
    card,
    loading,
    error,
    isEditing,
    setIsEditing,
    addPoint,
    updatePoint,
    deletePoint,
    uploadImage,
    reload,
  };
}
