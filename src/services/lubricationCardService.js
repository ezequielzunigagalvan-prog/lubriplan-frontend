import { httpGet, httpPost, httpPatch, httpDelete, httpForm } from "./http";

export const getLubricationCard = (equipmentId) =>
  httpGet(`/lubrication-cards/${equipmentId}`);

export const addLubricationPoint = (equipmentId, data) =>
  httpPost(`/lubrication-cards/${equipmentId}/points`, data);

export const updateLubricationPoint = (pointId, data) =>
  httpPatch(`/lubrication-cards/points/${pointId}`, data);

export const deleteLubricationPoint = (pointId) =>
  httpDelete(`/lubrication-cards/points/${pointId}`);

export const uploadCardImage = (equipmentId, file) => {
  const fd = new FormData();
  fd.append("image", file);
  return httpForm(`/lubrication-cards/${equipmentId}/image`, fd);
};
