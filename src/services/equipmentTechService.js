// src/services/equipmentTechService.js
import { httpGet, httpPost, httpPut, httpDelete, httpForm } from "./http";

export const getEquipmentTech = (equipmentId) => httpGet(`/equipment/${equipmentId}/tech`);
export const saveEquipmentSpecs = (equipmentId, specs) => httpPut(`/equipment/${equipmentId}/specs`, { specs });
export const uploadEquipmentDocument = (equipmentId, file, { category = "MANUAL", name = "" } = {}) => {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("category", category);
  if (name) fd.append("name", name);
  return httpForm(`/equipment/${equipmentId}/documents`, fd);
};
export const deleteEquipmentDocument = (equipmentId, docId) => httpDelete(`/equipment/${equipmentId}/documents/${docId}`);

export const getDiagram = (equipmentId, diagramId) => httpGet(`/equipment/${equipmentId}/diagrams/${diagramId}`);
export const createDiagram = (equipmentId, data) => httpPost(`/equipment/${equipmentId}/diagrams`, data);
export const updateDiagram = (equipmentId, diagramId, data) => httpPut(`/equipment/${equipmentId}/diagrams/${diagramId}`, data);
export const deleteDiagram = (equipmentId, diagramId) => httpDelete(`/equipment/${equipmentId}/diagrams/${diagramId}`);
