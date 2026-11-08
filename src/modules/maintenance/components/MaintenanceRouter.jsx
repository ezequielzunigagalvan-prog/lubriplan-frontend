import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

// Pages
const MaintenanceLanding = lazy(() => import("../pages/MaintenanceLanding"));
const MaintenanceLogin = lazy(() => import("../pages/MaintenanceLogin"));
const MaintenanceLayout = lazy(() => import("../pages/MaintenanceLayout"));
const MaintenanceDashboard = lazy(() => import("../pages/Dashboard"));
const MaintenanceAssets = lazy(() => import("../pages/Assets"));
const MaintenanceAssetDetail = lazy(() => import("../pages/AssetDetail"));
const MaintenanceAssetHistory = lazy(() => import("../pages/AssetHistoryPage"));
const MaintenanceWorkOrders = lazy(() => import("../pages/WorkOrders"));
const MaintenanceWorkOrderDetail = lazy(() => import("../pages/WorkOrderDetail"));
const MaintenanceReportFailure = lazy(() => import("../pages/ReportFailure"));
const MaintenanceExecution = lazy(() => import("../pages/Execution"));
const AccessDenied = lazy(() => import("../pages/AccessDenied"));
const MaintenanceSpareParts = lazy(() => import("../pages/SpareParts"));
const MaintenanceInventory = lazy(() => import("../pages/Inventory"));
const MaintenanceFailureCodes = lazy(() => import("../pages/FailureCodes"));
const MaintenanceIndicators = lazy(() => import("../pages/Indicators"));
const EquipmentAnalytics = lazy(() => import("../pages/EquipmentAnalytics"));
const ExecutiveDashboard = lazy(() => import("../pages/ExecutiveDashboard"));
const AssetHierarchy = lazy(() => import("../pages/AssetHierarchy"));
const AssetExpedient = lazy(() => import("../pages/AssetExpedient"));
const NotificationCenter = lazy(() => import("../pages/NotificationCenter"));
const NotificationPreferences = lazy(() => import("../pages/NotificationPreferences"));
const WorkOrderReview = lazy(() => import("../pages/WorkOrderReview"));
const PreventivePlans = lazy(() => import("../pages/PreventivePlans"));
const MaintenanceCalendar = lazy(() => import("../pages/MaintenanceCalendar"));

// Protected Route Component
import MaintenanceProtectedRoute from "../hooks/useMaintenanceProtectedRoute.jsx";

function PageLoader() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#f8fafc" }}>
      <div style={{ width: 36, height: 36, border: "3px solid #e2e8f0", borderTopColor: "#38bdf8", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function MaintenanceRouter() {
  const { isAuthenticated } = useAuth();

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Routes */}
        <Route path="" element={<MaintenanceLanding />} />
        <Route path="login" element={isAuthenticated ? <Navigate to="/maintenance/app" replace /> : <MaintenanceLogin />} />
        <Route path="access-denied" element={<AccessDenied />} />

        {/* Protected Routes */}
        <Route path="app" element={<MaintenanceProtectedRoute><MaintenanceLayout /></MaintenanceProtectedRoute>}>
          <Route index element={<ExecutiveDashboard />} />
          <Route path="assets" element={<MaintenanceAssets />} />
          <Route path="assets/hierarchy" element={<AssetHierarchy />} />
          <Route path="assets/:id" element={<AssetExpedient />} />
          <Route path="assets/:id/history" element={<MaintenanceAssetHistory />} />
          <Route path="work-orders" element={<MaintenanceWorkOrders />} />
          <Route path="work-orders/:id" element={<MaintenanceWorkOrderDetail />} />
          <Route path="work-orders/:id/review" element={<WorkOrderReview />} />
          <Route path="report-failure" element={<MaintenanceReportFailure />} />
          <Route path="work-orders/:id/execute" element={<MaintenanceExecution />} />

          {/* Phase 3A: Inventory & Spare Parts */}
          <Route path="spare-parts" element={<MaintenanceSpareParts />} />
          <Route path="inventory" element={<MaintenanceInventory />} />
          <Route path="failure-codes" element={<MaintenanceFailureCodes />} />

          {/* Phase 3B: Indicators */}
          <Route path="indicators" element={<MaintenanceIndicators />} />

          {/* Phase 2: Equipment Analytics */}
          <Route path="analytics" element={<EquipmentAnalytics />} />

          {/* Phase 4: Preventive Maintenance */}
          <Route path="preventive-plans" element={<PreventivePlans />} />
          <Route path="maintenance-calendar" element={<MaintenanceCalendar />} />

          {/* Phase 5: Notifications */}
          <Route path="notifications" element={<NotificationCenter />} />
          <Route path="notifications/preferences" element={<NotificationPreferences />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/maintenance" replace />} />
      </Routes>
    </Suspense>
  );
}
