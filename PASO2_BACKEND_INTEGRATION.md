# PASO 2: Integración Backend Real - LubriPlan Maintenance

## 📋 Estado General

**Fecha:** 2026-11-08  
**Build Frontend:** ✅ Exitoso (5.59s)  
**API Methods:** 29 endpoints definidos en maintenanceApi.js  
**Endpoints Faltantes:** 8 (requieren implementación backend)

---

## 🔗 Mapeo de Endpoints Frontend → Backend

### ✅ ENDPOINTS YA EXISTENTES EN BACKEND

| Categoría | Endpoint Frontend | Ruta Backend | Status |
|-----------|------------------|--------------|--------|
| **Dashboard** | getDashboardSummary() | GET /api/dashboard/summary | ✅ Existe |
| **Alerts** | checkAlerts() | GET /api/alerts | ✅ Existe |
| **Technicians** | getTechnicians() | GET /api/technicians | ✅ Existe |
| **Technicians** | getTechnician(id) | GET /api/technicians/:id | ✅ Existe |
| **Technicians** | updateTechnician(id) | PATCH /api/technicians/:id | ✅ Existe |
| **Analytics** | getRiskAssessment() | GET /api/analytics/risk-assessment | ✅ Existe |

---

## 🔴 ENDPOINTS FALTANTES - PRIORIDAD ALTA

### 1️⃣ Personnel Management
```javascript
// Frontend llama:
await maintenanceApi.createTechnician(technicianData);

// Endpoint Backend requerido:
POST /api/maintenance/technicians
Body: {
  name: string,
  email: string,
  phone: string,
  speciality: string,
  plant: string,
  certifications: string[],
  status: 'active' | 'inactive'
}
Response: { id, ...technicianData, createdAt }
```

**Ubicación Backend:** `/src/routes/technicians.routes.js` (YA EXISTE)  
**Estado:** Controller createTechnician() existe - SOLO AÑADIR RUTA EN /api/maintenance

---

### 2️⃣ Asset Expedient
```javascript
// Frontend llama:
await maintenanceApi.getAssetExpedient(assetId);

// Endpoint Backend requerido:
GET /api/maintenance/assets/:id/expedient
Response: {
  id, code, name, manufacturer, model,
  maintenanceOrders: [],
  failureHistory: [],
  spareParts: [],
  interventions: [],
  totalWorkOrders: number,
  preventiveOrders: number,
  totalDowntime: number,
  accumulatedCost: number
}
```

**Ubicación Backend:** CREAR en `/src/routes/` nuevo archivo o extender assets  
**Acción:** Implementar endpoint que agrega historial completo del activo

---

### 3️⃣ Asset Hierarchy
```javascript
// Frontend llama:
await maintenanceApi.getAssetHierarchy();

// Endpoint Backend requerido:
GET /api/maintenance/assets/hierarchy
Response: {
  id: 'empresa-1',
  name: string,
  type: 'EMPRESA' | 'PLANTA' | 'AREA' | 'LINEA' | 'EQUIPO' | 'SUBCONJUNTO' | 'COMPONENTE',
  children: [...]  // Recursive structure
}
```

**Ubicación Backend:** CREAR en `/src/routes/` nuevo archivo  
**Acción:** Implementar tree builder que navegue Prisma relationships

---

### 4️⃣ Preventive Orders
```javascript
// Frontend llama:
await maintenanceApi.getPreventiveOrder(workOrderId);

// Endpoint Backend requerido:
GET /api/maintenance/preventive-orders/:id
Response: {
  id, workOrderId, status,
  checklistItems: [
    { id, title, description, completed, completedAt, completedBy, photos[], comments[] }
  ],
  totalItems: number,
  completedItems: number,
  completionPercentage: number
}
```

**Ubicación Backend:** CREAR en `/src/routes/` nuevo archivo preventiveOrders.routes.js  
**Acción:** Implementar endpoint que retorna preventive order con checklist

---

### 5️⃣ Work Order Status Updates
```javascript
// Frontend llama:
await maintenanceApi.updateWorkOrderStatus(id, {
  status: 'APPROVED' | 'PENDING_APPROVAL',
  assignedTechnicianId: number,
  estimatedDate: date,
  estimatedHours: number,
  notes: string
});

// Endpoint Backend requerido:
PATCH /api/maintenance/work-orders/:id/status
Body: { status, assignedTechnicianId, estimatedDate, estimatedHours, notes }
Response: { id, status, ...updatedData, updatedAt }
```

**Ubicación Backend:** CREAR o extender en work-orders routes  
**Acción:** Implementar estado machine validation y update

---

### 6️⃣ Work Order Approval/Rejection
```javascript
// Frontend llama (2 endpoints):
await maintenanceApi.approveWorkOrder(id, data);
await maintenanceApi.rejectWorkOrder(id, data);

// Endpoints Backend requeridos:
POST /api/maintenance/work-orders/:id/approve
POST /api/maintenance/work-orders/:id/reject

Body: {
  approverComments?: string,
  reason?: string (solo para reject)
}
Response: { id, status: 'APPROVED' | 'REJECTED', ...workOrder }
```

**Ubicación Backend:** CREAR en work-orders routes  
**Acción:** Implementar estado transitions específicas

---

### 7️⃣ Preventive Checklist Items
```javascript
// Frontend llama:
await maintenanceApi.updatePreventiveChecklistItem(workOrderId, itemId, {
  completed: boolean,
  photos: string[],
  comments: string
});

// Endpoint Backend requerido:
PATCH /api/maintenance/preventive-orders/:workOrderId/checklist/:itemId
Body: { completed, photos[], comments }
Response: { id, ...updatedItem, updatedAt }
```

**Ubicación Backend:** En preventiveOrders.routes.js  
**Acción:** Implementar checklist item update

---

### 8️⃣ Asset History
```javascript
// Frontend llama:
await maintenanceApi.getAssetHistory(assetId, days = 90);

// Endpoint Backend requerido:
GET /api/maintenance/assets/:id/history?days=90
Response: {
  assetId, assetName,
  events: [
    {
      date, type: 'MAINTENANCE' | 'FAILURE' | 'STATUS_CHANGE',
      description, technician, cost, duration, workOrderId
    }
  ],
  totalEvents: number,
  dateRange: { from, to }
}
```

**Ubicación Backend:** Extender assets routes  
**Acción:** Implementar history timeline builder

---

## 📊 Prioridad de Implementación

```
🔴 CRÍTICA (Bloquea funcionalidad principal)
  1. createTechnician - Crear técnicos (usada en PersonnelManagement)
  2. updateWorkOrderStatus - Cambiar estado de órdenes (usada en WorkOrderReview)
  3. getAssetExpedient - Ver expediente de equipo (usada en AssetExpedient)

🟠 ALTA (Bloquea varias características)
  4. getAssetHierarchy - Ver árbol de activos (usada en AssetHierarchy)
  5. getPreventiveOrder - Órdenes preventivas (usada en PreventiveChecklist)
  6. approveWorkOrder + rejectWorkOrder - Aprobaciones (usada en WorkOrderReview)

🟡 MEDIA (Mejora experiencia)
  7. updatePreventiveChecklistItem - Completar tareas (usada en PreventiveChecklist)
  8. getAssetHistory - Historial de activos (usada en HistoryDashboard)
```

---

## 🛠️ Plan de Implementación

### Fase 1: Endpoints Críticos (2-3 horas)
1. ✅ maintenanceApi.js - Métodos ya agregados
2. ⬜ Backend: Validar createTechnician en technicians.routes.js
3. ⬜ Backend: Crear work-orders status endpoints
4. ⬜ Backend: Crear asset expedient endpoint

### Fase 2: Endpoints Secundarios (2 horas)
5. ⬜ Backend: Crear preventive orders routes
6. ⬜ Backend: Crear asset hierarchy endpoint

### Fase 3: Endpoints Complementarios (1 hora)
7. ⬜ Backend: Crear checklist items endpoints
8. ⬜ Backend: Crear asset history endpoint

### Fase 4: Testing (2 horas)
9. ⬜ Verificar todas las integraciones
10. ⬜ Validar error handling
11. ⬜ Probar fallbacks a mock data

---

## 🧪 Testing Checklist

- [ ] GET /api/maintenance/assets/hierarchy - Retorna estructura árbol
- [ ] GET /api/maintenance/assets/:id/expedient - Retorna historia completa
- [ ] GET /api/maintenance/preventive-orders/:id - Retorna orden con checklist
- [ ] POST /api/maintenance/technicians - Crea técnico
- [ ] PATCH /api/maintenance/work-orders/:id/status - Actualiza estado
- [ ] POST /api/maintenance/work-orders/:id/approve - Aprueba
- [ ] POST /api/maintenance/work-orders/:id/reject - Rechaza
- [ ] GET /api/maintenance/assets/:id/history - Retorna timeline

---

## 📝 Notas Importantes

1. **Rutas ya existen:** Technicians routes están en `/src/routes/technicians.routes.js`
2. **Prefijo:** Backend usa `/api/`, frontend espera `/api/maintenance/`
3. **Auth:** Todos los endpoints deben usar middleware `requireAuth`
4. **Respuestas:** Mantener formato consistente { id, ...data, createdAt/updatedAt }
5. **Errores:** Implementar error handling consistente (400, 404, 500)

---

**Próximo paso:** Comenzar con Fase 1 (Endpoints Críticos)
