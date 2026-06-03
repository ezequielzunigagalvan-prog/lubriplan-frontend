import { httpGet, httpPost, httpPut, httpDelete } from "./http";

export const preventiveOrdersService = {
  // Crear nueva orden
  async create(equipmentId, scheduledDate, title = "", notes = "") {
    return httpPost("/preventive-orders", {
      equipmentId,
      scheduledDate,
      title,
      notes,
    });
  },

  // Listar órdenes con filtros
  async list(filters = {}) {
    const { status, equipmentId, page = 1, limit = 20 } = filters;
    const params = new URLSearchParams({
      page,
      limit,
      ...(status && { status }),
      ...(equipmentId && { equipmentId }),
    });
    return httpGet(`/preventive-orders?${params}`);
  },

  // Obtener detalle de una orden
  async get(id) {
    return httpGet(`/preventive-orders/${id}`);
  },

  // Actualizar orden (DRAFT)
  async update(id, updates) {
    return httpPut(`/preventive-orders/${id}`, updates);
  },

  // Cambiar estado a OPEN
  async open(id) {
    return httpPut(`/preventive-orders/${id}/open`, {});
  },

  // Cambiar estado a IN_PROGRESS (asignar técnico)
  async start(id, assignedTo) {
    return httpPut(`/preventive-orders/${id}/start`, {
      assignedTo,
    });
  },

  // Completar orden (firmar)
  async complete(id, signatureImage = null) {
    return httpPut(`/preventive-orders/${id}/complete`, {
      signatureImage,
    });
  },

  // Marcar item como COMPLETED
  async completeItem(orderId, itemId, status = "COMPLETED", observations = "", photoUrl = null) {
    return httpPut(`/preventive-orders/${orderId}/items/${itemId}`, {
      status,
      observations,
      photoUrl,
    });
  },

  // Cancelar orden
  async cancel(id) {
    return httpDelete(`/preventive-orders/${id}`);
  },
};
