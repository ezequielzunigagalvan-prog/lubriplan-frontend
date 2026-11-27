// Consola del dueño de la plataforma (/api/owner).
import { httpGet, httpPost, httpPatch, httpPut } from "./http";

export const getOwnerOverview = () => httpGet("/owner/overview");
export const createClient = (payload) => httpPost("/owner/clients", payload);
export const updateOwnerPlant = (id, data) => httpPatch(`/owner/plants/${id}`, data);
export const setMyPlantAccess = (id, enable) => httpPut(`/owner/plants/${id}/my-access`, { enable });
