import { httpGet, httpPost, httpPatch, httpDelete, httpForm } from "../../../services/http";

export const maintenanceApi = {
  // Check if user has access to maintenance module
  async getAccess() {
    return httpGet("/maintenance/me/access");
  },

  // Get list of assignable users (for SUPERVISOR assigning work)
  async getAssignableUsers(filters = {}) {
    const params = new URLSearchParams(filters);
    return httpGet(`/maintenance/assignable-users?${params}`);
  },

  // Assets CRUD
  async getAssets(filters = {}) {
    const params = new URLSearchParams(filters);
    return httpGet(`/maintenance/assets?${params}`);
  },

  async getAsset(id) {
    return httpGet(`/maintenance/assets/${id}`);
  },

  async createAsset(data) {
    return httpPost("/maintenance/assets", data);
  },

  async updateAsset(id, data) {
    return httpPatch(`/maintenance/assets/${id}`, data);
  },

  async deleteAsset(id) {
    return httpDelete(`/maintenance/assets/${id}`);
  },

  // Work Orders CRUD
  async getWorkOrders(filters = {}) {
    const params = new URLSearchParams(filters);
    return httpGet(`/maintenance/work-orders?${params}`);
  },

  async getWorkOrder(id) {
    return httpGet(`/maintenance/work-orders/${id}`);
  },

  async createWorkOrder(data) {
    return httpPost("/maintenance/work-orders", data);
  },

  // Transition work order state (approve, reject, assign, etc.)
  async transitionWorkOrder(id, transition) {
    return httpPost(`/maintenance/work-orders/${id}/transition`, transition);
  },

  // Update execution (diagnosis, work done, downtime, etc.)
  async updateExecution(id, execution) {
    return httpPatch(`/maintenance/work-orders/${id}/execution`, execution);
  },

  // Upload photo to work order
  async uploadPhoto(id, file, kind) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("kind", kind);
    return httpForm(`/maintenance/work-orders/${id}/photos`, formData, "POST");
  },

  // Dashboard summary
  async getDashboardSummary(filters = {}) {
    const params = new URLSearchParams(filters);
    return httpGet(`/maintenance/dashboard/summary?${params}`);
  },
};
