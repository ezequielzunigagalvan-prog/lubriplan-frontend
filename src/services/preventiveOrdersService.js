import { httpGet, httpPost, httpPut, httpDelete } from "./http";

// Órdenes de Lubricación Preventiva (OLP): rutas que se ejecutan junto con el preventivo del equipo.
export const preventiveOrdersService = {
  // Crear orden. payload: { equipmentId, scheduledDate, title, notes, assignedTo, routeIds | allRoutes, requiresPhoto, release }
  async create(payloadOrEquipmentId, scheduledDate, title = "", notes = "", assignedTo = null) {
    const payload =
      typeof payloadOrEquipmentId === "object" && payloadOrEquipmentId !== null
        ? payloadOrEquipmentId
        : { equipmentId: payloadOrEquipmentId, scheduledDate, title, notes, ...(assignedTo && { assignedTo }) };
    return httpPost("/preventive-orders", payload);
  },

  // Rutas del equipo disponibles para elegir
  async equipmentRoutes(equipmentId) {
    return httpGet(`/preventive-orders/equipment-routes/${equipmentId}`);
  },

  // Listar órdenes con filtros
  async list(filters = {}) {
    const { status, equipmentId, assignedTo, q, from, to, page = 1, limit = 20 } = filters;
    const params = new URLSearchParams({
      page,
      limit,
      ...(status && { status }),
      ...(equipmentId && { equipmentId }),
      ...(assignedTo && { assignedTo }),
      ...(q && { q }),
      ...(from && { from }),
      ...(to && { to }),
    });
    return httpGet(`/preventive-orders?${params}`);
  },

  async get(id) {
    return httpGet(`/preventive-orders/${id}`);
  },

  // Editar (borrador o liberada sin avance). Acepta routeIds / allRoutes.
  async update(id, updates) {
    return httpPut(`/preventive-orders/${id}`, updates);
  },

  // Liberar al técnico
  async open(id) {
    return httpPost(`/preventive-orders/${id}/open`, {});
  },

  // Poner en proceso (asignar técnico)
  async start(id, assignedTo) {
    return httpPut(`/preventive-orders/${id}/start`, assignedTo ? { assignedTo } : {});
  },

  // Cerrar la orden con firma
  async complete(id, signatureImage = null) {
    return httpPut(`/preventive-orders/${id}/complete`, { signatureImage });
  },

  // Ejecutar / omitir una ruta. data: { status, condition, usedQuantity, observations, photoUrl }
  async completeItem(orderId, itemId, statusOrData = "COMPLETED", observations = "", photoUrl = null) {
    const body =
      typeof statusOrData === "object" && statusOrData !== null ? statusOrData : { status: statusOrData, observations, photoUrl };
    return httpPut(`/preventive-orders/${orderId}/items/${itemId}`, body);
  },

  // Ejecutar todas las rutas pendientes con las cantidades de la ruta
  async completeAll(orderId, { condition = "BUENO", observations = "" } = {}) {
    return httpPost(`/preventive-orders/${orderId}/items/complete-all`, { condition, observations });
  },

  // Eliminar borrador
  async remove(id) {
    return httpDelete(`/preventive-orders/${id}`);
  },

  // Cancelar orden liberada
  async cancel(id, reason = "") {
    return httpPost(`/preventive-orders/${id}/cancel`, { reason });
  },

  // Órdenes completadas para el historial
  async listCompleted(filters = {}) {
    const { from, to, assignedTo, page = 1, limit = 20 } = filters;
    const params = new URLSearchParams({
      page,
      limit,
      status: "COMPLETED",
      ...(from && { from }),
      ...(to && { to }),
      ...(assignedTo && { assignedTo }),
    });
    return httpGet(`/preventive-orders?${params}`);
  },
};
