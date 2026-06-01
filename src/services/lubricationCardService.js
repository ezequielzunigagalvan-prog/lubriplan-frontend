import { httpGet, httpPost, httpPatch, httpDelete, httpForm } from "./http";

export const getLubricationCard = (equipmentId) =>
  httpGet(`/lubrication-cards/${equipmentId}`);

export const addLubricationPoint = (equipmentId, data) =>
  httpPost(`/lubrication-cards/${equipmentId}/points`, data);

export const updateLubricationPoint = (pointId, data) =>
  httpPatch(`/lubrication-cards/points/${pointId}`, data);

export const deleteLubricationPoint = (pointId) =>
  httpDelete(`/lubrication-cards/points/${pointId}`);

// Imagen principal
export const uploadCardImage = (equipmentId, file) => {
  const fd = new FormData();
  fd.append("image", file);
  return httpForm(`/lubrication-cards/${equipmentId}/image`, fd);
};

// Imágenes adicionales (para equipos grandes con secciones)
export const uploadCardSectionImage = (equipmentId, file, label = "Sección") => {
  const fd = new FormData();
  fd.append("image", file);
  fd.append("label", label);
  return httpForm(`/lubrication-cards/${equipmentId}/images`, fd);
};

export const updateCardSectionImage = (imageId, data) =>
  httpPatch(`/lubrication-cards/images/${imageId}`, data);

export const deleteCardSectionImage = (imageId) =>
  httpDelete(`/lubrication-cards/images/${imageId}`);

// Sincronización Ruta → Carta
export const getSyncPreview = (equipmentId) =>
  httpGet(`/lubrication-cards/${equipmentId}/sync-preview`);

export const syncFromRoutes = (equipmentId, routeIds = null) =>
  httpPost(`/lubrication-cards/${equipmentId}/sync-from-routes`, routeIds ? { routeIds } : {});
