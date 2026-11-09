# PASO 3: Agregar Tests - Plan Completo

## 🎯 Objetivo

Implementar cobertura de testing del 80%+ para todos los endpoints del PASO 2.

---

## 📊 Testing Strategy

### Niveles de Testing

```
┌─────────────────────────────────────────┐
│        E2E Testing (Integration)        │ ← Full user workflows
├─────────────────────────────────────────┤
│      Component Tests (Frontend)         │ ← React components
├─────────────────────────────────────────┤
│    API Integration Tests (Backend)      │ ← Route handlers
├─────────────────────────────────────────┤
│       Unit Tests (Business Logic)       │ ← Controllers, utilities
├─────────────────────────────────────────┤
│           Static Analysis                │ ← Linting, type checks
└─────────────────────────────────────────┘
```

---

## 🧪 Test Categories

### 1️⃣ **Unit Tests** (Controllers)

**Framework:** Vitest (already configured)  
**Target:** technicians.controller.js, state validations

```javascript
// Example: technicians.controller.test.js
describe("createTechnician", () => {
  it("should create technician with valid data", () => {})
  it("should reject missing required fields", () => {})
  it("should auto-generate code if not provided", () => {})
  it("should handle duplicate code error", () => {})
  it("should parse certifications as JSON", () => {})
})
```

**Files to Test:**
- ✅ technicians.controller.js
- ✅ workOrders state machine
- ✅ assetExpedient aggregations
- ✅ preventiveOrders checklist logic

---

### 2️⃣ **API Integration Tests** (Routes)

**Framework:** Supertest + Vitest  
**Target:** All route endpoints

```javascript
// Example: workOrders.routes.test.js
describe("Work Orders Routes", () => {
  describe("GET /api/maintenance/work-orders", () => {
    it("should return list of work orders", () => {})
    it("should filter by status", () => {})
    it("should require PLANT_REQUIRED", () => {})
  })
  
  describe("PATCH /api/maintenance/work-orders/:id/status", () => {
    it("should validate state transition", () => {})
    it("should reject invalid transition", () => {})
    it("should update with assignedTechnicianId", () => {})
  })
})
```

**Test Suite:**
- [ ] workOrders.routes.test.js (5 endpoints)
- [ ] assetExpedient.routes.test.js (1 endpoint)
- [ ] assetHierarchy.routes.test.js (1 endpoint)
- [ ] preventiveOrders.routes.test.js (4 endpoints)
- [ ] assetHistory.routes.test.js (1 endpoint)

---

### 3️⃣ **Frontend Component Tests** (React)

**Framework:** Vitest + React Testing Library  
**Target:** Components with API integration

```javascript
// Example: WorkOrderReview.test.jsx
describe("WorkOrderReview", () => {
  it("should display work order details", () => {})
  it("should submit approval with API", () => {})
  it("should show fallback to mock data on API error", () => {})
  it("should validate state transitions before submit", () => {})
})
```

**Files to Test:**
- [ ] NewTechnician.jsx
- [ ] WorkOrderReview.jsx
- [ ] AssetExpedient.jsx
- [ ] PreventiveChecklist.jsx
- [ ] ExecutiveDashboard.jsx

---

### 4️⃣ **E2E Tests** (Full Workflows)

**Framework:** Playwright (optional, future)  
**Target:** Complete user journeys

```javascript
// Example: create-technician.e2e.js
test("Complete technician creation workflow", async ({ page }) => {
  // Navigate to form
  // Fill form
  // Submit
  // Verify API call
  // Check success message
  // Verify list updated
})
```

---

## 📋 Test Coverage Targets

| Component | Target | Priority |
|-----------|--------|----------|
| Controllers | 90% | 🔴 HIGH |
| Routes | 85% | 🔴 HIGH |
| Components | 70% | 🟠 MEDIUM |
| Utilities | 95% | 🟠 MEDIUM |
| **Overall** | **80%** | ✅ GOAL |

---

## 🛠️ Testing Tools Setup

### Backend (Node.js)
```bash
npm install --save-dev vitest @vitest/ui
npm install --save-dev supertest
npm install --save-dev @testing-library/jest-dom
```

### Frontend (React)
```bash
npm install --save-dev @testing-library/react
npm install --save-dev @testing-library/user-event
npm install --save-dev @testing-library/jest-dom
```

---

## 📝 Test Implementation Order

### Phase 1: Backend Unit Tests (2 hours)
```
1. [ ] technicians.controller.test.js
2. [ ] workOrders state machine tests
3. [ ] assetExpedient aggregations tests
4. [ ] preventiveOrders logic tests
```

### Phase 2: Backend Integration Tests (2 hours)
```
1. [ ] workOrders.routes.test.js
2. [ ] assetExpedient.routes.test.js
3. [ ] assetHierarchy.routes.test.js
4. [ ] preventiveOrders.routes.test.js
5. [ ] assetHistory.routes.test.js
```

### Phase 3: Frontend Component Tests (2 hours)
```
1. [ ] NewTechnician.test.jsx
2. [ ] WorkOrderReview.test.jsx
3. [ ] AssetExpedient.test.jsx
4. [ ] PreventiveChecklist.test.jsx
5. [ ] maintenanceApi.test.js
```

### Phase 4: E2E Tests (Optional, 2 hours)
```
1. [ ] Complete workflows
2. [ ] Error handling paths
3. [ ] State transitions
```

---

## 🧪 Test File Structure

### Backend Tests
```
src/
  ├── __tests__/
  │   ├── controllers/
  │   │   └── technicians.controller.test.js
  │   └── routes/
  │       ├── workOrders.routes.test.js
  │       ├── assetExpedient.routes.test.js
  │       ├── assetHierarchy.routes.test.js
  │       ├── preventiveOrders.routes.test.js
  │       └── assetHistory.routes.test.js
```

### Frontend Tests
```
src/
  ├── modules/
  │   └── maintenance/
  │       ├── __tests__/
  │       │   ├── components/
  │       │   ├── pages/
  │       │   └── services/
```

---

## 🔍 Test Examples

### Example 1: Unit Test
```javascript
// workOrders.statemachine.test.js
describe("Work Order State Machine", () => {
  it("should allow PENDING_APPROVAL -> APPROVED transition", () => {
    const currentStatus = "PENDING_APPROVAL";
    const newStatus = "APPROVED";
    
    const isValid = isValidTransition(currentStatus, newStatus);
    
    expect(isValid).toBe(true);
  });
  
  it("should reject IN_PROGRESS -> APPROVED transition", () => {
    const currentStatus = "IN_PROGRESS";
    const newStatus = "APPROVED";
    
    const isValid = isValidTransition(currentStatus, newStatus);
    
    expect(isValid).toBe(false);
  });
});
```

### Example 2: Integration Test
```javascript
// workOrders.routes.test.js
describe("PATCH /api/maintenance/work-orders/:id/status", () => {
  it("should update work order status", async () => {
    const response = await request(app)
      .patch("/api/maintenance/work-orders/1/status")
      .set("Authorization", `Bearer ${token}`)
      .send({
        status: "APPROVED",
        assignedTechnicianId: 5,
        estimatedHours: 4
      });
    
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("APPROVED");
  });
});
```

### Example 3: Component Test
```javascript
// WorkOrderReview.test.jsx
describe("WorkOrderReview", () => {
  it("should call API on approval", async () => {
    const mockApi = vi.mock("../services/maintenanceApi");
    const { getByText } = render(<WorkOrderReview />);
    
    const approveBtn = getByText("Aprobar");
    await user.click(approveBtn);
    
    expect(mockApi.updateWorkOrderStatus).toHaveBeenCalled();
  });
});
```

---

## ✅ Checklist

### Before Testing
- [ ] All endpoints implemented
- [ ] All routes registered
- [ ] No TypeScript errors
- [ ] Linting passes
- [ ] Build successful

### During Testing
- [ ] Write unit tests first
- [ ] Write integration tests
- [ ] Write component tests
- [ ] Achieve 80%+ coverage
- [ ] All tests pass

### After Testing
- [ ] Coverage report generated
- [ ] Document any gaps
- [ ] Set up CI/CD testing
- [ ] Add pre-commit hooks

---

## 📊 Coverage Reports

### Generate Coverage
```bash
# Backend
npm run test:coverage

# Frontend
npm run test:coverage

# Generate HTML reports
npm run test:coverage -- --reporter=html
```

### Expected Output
```
File               | Stmts | Branch | Funcs | Lines |
-------------------|-------|--------|-------|-------|
All files          |  85%  |  80%   |  90%  |  85%  |
Controllers        |  90%  |  85%   |  95%  |  90%  |
Routes             |  82%  |  78%   |  88%  |  82%  |
Components         |  75%  |  70%   |  80%  |  75%  |
```

---

## 🚀 Next Steps

1. **Setup testing infrastructure** (15 min)
2. **Write unit tests** (2 hours)
3. **Write integration tests** (2 hours)
4. **Write component tests** (2 hours)
5. **Generate coverage reports** (30 min)
6. **Setup CI/CD** (1 hour)

---

**Estimated Total Time:** 8 hours  
**Current Status:** Ready to begin  
**Start Time:** Now 🚀

