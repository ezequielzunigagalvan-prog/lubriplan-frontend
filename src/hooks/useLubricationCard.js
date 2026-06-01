import { useCallback, useEffect, useState } from "react";
import {
  getLubricationCard,
  addLubricationPoint,
  updateLubricationPoint,
  deleteLubricationPoint,
  uploadCardImage,
  uploadCardSectionImage,
  updateCardSectionImage,
  deleteCardSectionImage,
  syncFromRoutes,
} from "../services/lubricationCardService";

export function useLubricationCard(equipmentId) {
  const [card, setCard]         = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
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

  // Imagen adicional (sección)
  const addSectionImage = useCallback(async (file, label) => {
    const data = await uploadCardSectionImage(equipmentId, file, label);
    setCard((prev) =>
      prev ? { ...prev, images: [...(prev.images || []), data.image] } : prev
    );
    return data.image;
  }, [equipmentId]);

  const renameSectionImage = useCallback(async (imageId, label) => {
    const data = await updateCardSectionImage(imageId, { label });
    setCard((prev) =>
      prev
        ? { ...prev, images: prev.images.map((i) => (i.id === imageId ? data.image : i)) }
        : prev
    );
  }, []);

  const removeSectionImage = useCallback(async (imageId) => {
    await deleteCardSectionImage(imageId);
    setCard((prev) =>
      prev
        ? {
            ...prev,
            images: prev.images.filter((i) => i.id !== imageId),
            // puntos de esa imagen pasan a imagen principal (imageId=null)
            points: prev.points.map((p) => p.imageId === imageId ? { ...p, imageId: null } : p),
          }
        : prev
    );
  }, []);

  // Sincronización Ruta → Carta
  const syncRoutes = useCallback(async (routeIds = null) => {
    const data = await syncFromRoutes(equipmentId, routeIds);
    if (data?.card) setCard(data.card);
    return data;
  }, [equipmentId]);

  return {
    card, loading, error,
    isEditing, setIsEditing,
    addPoint, updatePoint, deletePoint,
    uploadImage,
    addSectionImage, renameSectionImage, removeSectionImage,
    syncRoutes,
    reload,
  };
}
