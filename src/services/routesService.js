// src/services/routesService.js
import { httpGet, httpPost, httpPut, httpDelete, httpForm } from "./http";

export function getRoutes() {
  return httpGet("/routes");
}

export function getRouteById(id) {
  return httpGet(`/routes/${id}`);
}

export function createRoute(data) {
  return httpPost("/routes", data);
}

export function updateRoute(id, data) {
  return httpPut(`/routes/${id}`, data);
}

export function deleteRoute(id) {
  return httpDelete(`/routes/${id}`);
}

export async function uploadRouteImage(file) {
  if (!file) throw new Error("No se recibió archivo para subir.");

  const fd = new FormData();
  fd.append("image", file);

  const res = await httpForm("/uploads/routes-image", fd, "POST", 60000);
  const finalUrl = res?.imageUrl || res?.url || null;

  return {
    ...(res || {}),
    imageUrl: finalUrl,
    url: finalUrl,
  };
}
