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

  // Executive dashboard: KPIs reales de la planta actual
  async getExecutiveDashboard({ days = 30 } = {}) {
    const res = await httpGet(`/maintenance/dashboard/executive?days=${days}`);
    return res?.data ?? res;
  },

  // Dashboard summary (stub - returns mock until backend ready)
  async getDashboardSummary(filters = {}) {
    try {
      const params = new URLSearchParams(filters);
      return await httpGet(`/maintenance/dashboard/summary?${params}`);
    } catch (error) {
      // Fallback: endpoint not yet implemented
      return null;
    }
  },

  // ============================================================
  // PHASE 3A: SPARE PARTS & INVENTORY
  // ============================================================

  // Spare Parts CRUD
  async getSpareParts(filters = {}) {
    const params = new URLSearchParams(filters);
    return httpGet(`/maintenance/spare-parts?${params}`);
  },

  async getSparePart(id) {
    return httpGet(`/maintenance/spare-parts/${id}`);
  },

  async createSparePart(data) {
    return httpPost("/maintenance/spare-parts", data);
  },

  async updateSparePart(id, data) {
    return httpPatch(`/maintenance/spare-parts/${id}`, data);
  },

  async linkSparePartToAsset(sparePartId, assetId) {
    return httpPost(`/maintenance/spare-parts/${sparePartId}/assets/${assetId}`, {});
  },

  async getSparePartsForAsset(assetId) {
    return httpGet(`/maintenance/assets/${assetId}/spare-parts`);
  },

  // Warehouses CRUD
  async getWarehouses() {
    return httpGet("/maintenance/inventory/warehouses");
  },

  async getWarehouse(id) {
    return httpGet(`/maintenance/inventory/warehouses/${id}`);
  },

  async createWarehouse(data) {
    return httpPost("/maintenance/inventory/warehouses", data);
  },

  async getWarehouseStock(warehouseId) {
    return httpGet(`/maintenance/inventory/warehouses/${warehouseId}/stock`);
  },

  // Stock CRUD
  async getStock(id) {
    return httpGet(`/maintenance/inventory/stock/${id}`);
  },

  async createStock(data) {
    return httpPost("/maintenance/inventory/stock", data);
  },

  async updateStock(stockId, data) {
    return httpPatch(`/maintenance/inventory/stock/${stockId}`, data);
  },

  async recordStockMovement(data) {
    return httpPost("/maintenance/inventory/movements", data);
  },

  async getStockMovementHistory(stockId, limit = 50) {
    return httpGet(`/maintenance/inventory/stock/${stockId}/movements?limit=${limit}`);
  },

  async consumeSparePartInWorkOrder(data) {
    return httpPost("/maintenance/inventory/consume", data);
  },

  async getLowStockAlerts() {
    return httpGet("/maintenance/inventory/alerts/low-stock");
  },

  // Failure Codes CRUD
  async seedFailureCodes() {
    return httpPost("/maintenance/failure-codes/seed", {});
  },

  async getFailureCodes(filters = {}) {
    const params = new URLSearchParams(filters);
    return httpGet(`/maintenance/failure-codes?${params}`);
  },

  async getFailureCode(id) {
    return httpGet(`/maintenance/failure-codes/${id}`);
  },

  async createFailureCode(data) {
    return httpPost("/maintenance/failure-codes", data);
  },

  async updateFailureCode(id, data) {
    return httpPatch(`/maintenance/failure-codes/${id}`, data);
  },

  async assignFailureToWorkOrder(workOrderId, data) {
    return httpPost(`/maintenance/work-orders/${workOrderId}/failure`, data);
  },

  async getWorkOrderFailure(workOrderId) {
    return httpGet(`/maintenance/work-orders/${workOrderId}/failure`);
  },

  // ============================================================
  // INDICATORS (Phase 3B)
  // ============================================================

  async getCosts(startDate, endDate) {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    return httpGet(`/maintenance/indicators/costs?${params}`);
  },

  async getWorkOrderCost(workOrderId) {
    return httpGet(`/maintenance/indicators/work-orders/${workOrderId}/cost`);
  },

  async getMTTR(days = 30) {
    return httpGet(`/maintenance/indicators/mttr?days=${days}`);
  },

  async getMTBF(assetId) {
    return httpGet(`/maintenance/indicators/assets/${assetId}/mtbf`);
  },

  async getAvailability(assetId, days = 30) {
    return httpGet(`/maintenance/indicators/assets/${assetId}/availability?days=${days}`);
  },

  async getRecurrence(days = 30) {
    return httpGet(`/maintenance/indicators/recurrence?days=${days}`);
  },

  async getTopAssets(metric = "cost", limit = 10, days = 30) {
    return httpGet(`/maintenance/indicators/top-assets?metric=${metric}&limit=${limit}&days=${days}`);
  },

  // ============================================================
  // NOTIFICATIONS (Phase 4)
  // ============================================================

  async getNotifications(limit = 50) {
    return httpGet(`/maintenance/notifications?limit=${limit}`);
  },

  async getUnreadCount() {
    return httpGet("/maintenance/notifications/unread-count");
  },

  async markNotificationAsRead(notificationId) {
    return httpPatch(`/maintenance/notifications/${notificationId}/read`, {});
  },

  async checkAlerts() {
    return httpPost("/maintenance/notifications/check-alerts", {});
  },

  async getNotificationPreferences() {
    return httpGet("/maintenance/notifications/preferences");
  },

  async updateNotificationPreferences(data) {
    return httpPatch("/maintenance/notifications/preferences", data);
  },

  // ============================================================
  // ASSET HISTORY (Week 2)
  // ============================================================

  async getAssetHistory(assetId, days = 90) {
    return httpGet(`/maintenance/assets/${assetId}/history?days=${days}`);
  },

  // ============================================================
  // ANALYTICS & PREDICTIVE (Week 3)
  // ============================================================

  async getRiskAssessment() {
    return httpGet("/maintenance/analytics/risk-assessment");
  },

  async predictEquipmentDegradation(assetId) {
    return httpGet(`/maintenance/analytics/predict/${assetId}`);
  },

  // ============================================================
  // REPORTS & EXPORTS (Week 4)
  // ============================================================

  async getAssetHistoryReport(assetId, format = "json") {
    return httpGet(`/maintenance/reports/asset/${assetId}?format=${format}`);
  },

  async getPlantSummaryReport() {
    return httpGet("/maintenance/reports/plant-summary");
  },

  async getWeeklyDigest() {
    return httpGet("/maintenance/reports/weekly-digest");
  },

  // ============================================================
  // MISSING ENDPOINTS (Fase 2: Integración Backend)
  // ============================================================

  // Personnel Management
  async createTechnician(data) {
    return httpPost("/maintenance/technicians", data);
  },

  async getTechnicians(filters = {}) {
    const params = new URLSearchParams(filters);
    return httpGet(`/maintenance/technicians?${params}`);
  },

  async getTechnician(id) {
    return httpGet(`/maintenance/technicians/${id}`);
  },

  async updateTechnician(id, data) {
    return httpPatch(`/maintenance/technicians/${id}`, data);
  },

  // Asset Expedient & History
  async getAssetExpedient(id) {
    try {
      return await httpGet(`/maintenance/assets/${id}/expedient`);
    } catch (error) {
      // Fallback: endpoint not yet implemented
      return null;
    }
  },

  // Asset Hierarchy
  async getAssetHierarchy() {
    try {
      return await httpGet("/maintenance/assets/hierarchy");
    } catch (error) {
      // Fallback: endpoint not yet implemented
      return null;
    }
  },

  // Preventive Orders & Checklists
  async getPreventiveOrder(workOrderId) {
    try {
      return await httpGet(`/maintenance/preventive-orders/${workOrderId}`);
    } catch (error) {
      // Fallback: endpoint not yet implemented
      return null;
    }
  },

  async getPreventiveOrders(filters = {}) {
    const params = new URLSearchParams(filters);
    return httpGet(`/maintenance/preventive-orders?${params}`);
  },

  async createPreventiveOrder(data) {
    return httpPost("/maintenance/preventive-orders", data);
  },

  async getPreventiveChecklist(workOrderId) {
    return httpGet(`/maintenance/preventive-orders/${workOrderId}/checklist`);
  },

  async updatePreventiveChecklistItem(workOrderId, itemId, data) {
    return httpPatch(`/maintenance/preventive-orders/${workOrderId}/checklist/${itemId}`, data);
  },

  // Work Order Status Management
  async updateWorkOrderStatus(id, data) {
    return httpPatch(`/maintenance/work-orders/${id}/status`, data);
  },

  async approveWorkOrder(id, data) {
    return httpPost(`/maintenance/work-orders/${id}/approve`, data);
  },

  async rejectWorkOrder(id, data) {
    return httpPost(`/maintenance/work-orders/${id}/reject`, data);
  },

  // ============================================================
  // PLANS MODULE (Nuevo - Módulo de Planes Mejorado)
  // ============================================================

  // Plans CRUD
  async getAllPlans(filters = {}) {
    const params = new URLSearchParams(filters);
    return httpGet(`/maintenance/plans?${params}`);
  },

  async getPlan(id) {
    return httpGet(`/maintenance/plans/${id}`);
  },

  async createPlan(data) {
    return httpPost("/maintenance/plans", data);
  },

  async updatePlan(id, data) {
    return httpPatch(`/maintenance/plans/${id}`, data);
  },

  async deletePlan(id) {
    return httpDelete(`/maintenance/plans/${id}`);
  },

  // Plans - Roadmap & History
  async getPlanRoadmap(id) {
    return httpGet(`/maintenance/plans/${id}/roadmap`);
  },

  async getPlanHistory(id, limit = 10) {
    return httpGet(`/maintenance/plans/${id}/history?limit=${limit}`);
  },

  // Plans - Execution
  async executePlan(id, data = {}) {
    return httpPost(`/maintenance/plans/${id}/execute`, data);
  },

  async completePlanExecution(executionId, data) {
    return httpPost(`/maintenance/execution/${executionId}/complete`, data);
  },

  // Plans - Technicians
  async addTechnicianToPlan(planId, data) {
    return httpPost(`/maintenance/plans/${planId}/technicians`, data);
  },

  async removeTechnicianFromPlan(planId, technicianId) {
    return httpDelete(`/maintenance/plans/${planId}/technicians/${technicianId}`);
  },

  // Plans - Spare Parts
  async addSparePartToPlan(planId, data) {
    return httpPost(`/maintenance/plans/${planId}/spareparts`, data);
  },

  async removeSparePartFromPlan(planId, sparePartId) {
    return httpDelete(`/maintenance/plans/${planId}/spareparts/${sparePartId}`);
  },

  // Plans - Lists
  async getOverduePlans() {
    return httpGet("/maintenance/plans/list/overdue");
  },

  async getUpcomingPlans(days = 7) {
    return httpGet(`/maintenance/plans/list/upcoming?days=${days}`);
  },

  // Search
  async searchAssets(params) {
    const queryParams = new URLSearchParams(params);
    return httpGet(`/maintenance/plans/search/assets?${queryParams}`);
  },

  async searchTechnicians(params) {
    const queryParams = new URLSearchParams(params);
    return httpGet(`/maintenance/plans/search/technicians?${queryParams}`);
  },

  async searchSpareParts(params) {
    const queryParams = new URLSearchParams(params);
    return httpGet(`/maintenance/plans/search/spareparts?${queryParams}`);
  },
};
