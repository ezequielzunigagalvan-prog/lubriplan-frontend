// src/services/routesService.js
import { httpGet, httpPost, httpPut, httpDelete, httpForm } from "./http";

// =========================
// GET ALL ROUTES
// =========================
export function getRoutes() {
  return httpGet("/routes");
}

// =========================
// GET ONE ROUTE
// =========================
export function getRouteById(id) {
  return httpGet(`/routes/${id}`);
}

// =========================
// CREATE ROUTE
// =========================
export function createRoute(data) {
  return httpPost("/routes", data); 
}

// =========================
// UPDATE ROUTE
// =========================
export function updateRoute(id, data) {
  return httpPut(`/routes/${id}`, data);
}

// =========================
// DELETE ROUTE
// =========================
export function deleteRoute(id) {
  return httpDelete(`/routes/${id}`);
}

// =========================
// UPLOAD ROUTE IMAGE
// OJO:
// este endpoint debe existir en backend:
// POST /api/uploads/routes-image
// field: image
// =========================
export function uploadRouteImage(file) {
  if (!file) throw new Error("No se recibió archivo para subir.");

  const fd = new FormData();
  fd.append("image", file);

  return httpForm("/uploads/routes-image", fd, "POST", 60000);
}