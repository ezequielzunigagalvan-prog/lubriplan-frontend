import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

// Eager: tiny pages needed on first paint
import LoginPage from "./pages/LoginPage";
import LubriPlanLanding from "./pages/LubriPlanLanding";
import Unauthorized from "./pages/Unauthorized";
import ProtectedRoute from "./auth/ProtectedRoute";

// Lazy: load only when the route is visited
const Dashboard               = lazy(() => import("./pages/Dashboard"));
const RoutesPage              = lazy(() => import("./pages/RoutesPage"));
const RouteDetail             = lazy(() => import("./pages/RouteDetail"));
const EditRoutePage           = lazy(() => import("./pages/EditRoutePage"));
const ActivitiesPage          = lazy(() => import("./pages/ActivitiesPage"));
const ActivitiesDetailPage    = lazy(() => import("./pages/ActivitiesDetailPage"));
const CompleteExecutionModal  = lazy(() => import("./pages/CompleteExecutionModal"));
const EquipmentsPage          = lazy(() => import("./pages/EquipmentsPage"));
const EquipmentDetailPage     = lazy(() => import("./pages/EquipmentDetailPage"));
const EditEquipmentPage       = lazy(() => import("./pages/EditEquipmentPage"));
const NewAreaPage             = lazy(() => import("./pages/NewAreaPage"));
const UsersPage               = lazy(() => import("./pages/UsersPage"));
const InventoryPage           = lazy(() => import("./pages/InventoryPage"));
const TechniciansPage         = lazy(() => import("./pages/TechniciansPage"));
const AnalysisPage            = lazy(() => import("./pages/AnalysisPage"));
const ExportPage              = lazy(() => import("./pages/ExportPage"));
const HistoryPage             = lazy(() => import("./pages/HistoryPage"));
const ConditionReportsPage    = lazy(() => import("./pages/ConditionReportsPage"));
const AdminTechLinksPage      = lazy(() => import("./pages/AdminTechLinksPage"));
const NewRoutePage            = lazy(() => import("./pages/NewRoutePage"));
const NotificationsPage       = lazy(() => import("./pages/NotificationsPage"));
const MonthlyIntelligentReport = lazy(() => import("./pages/reports/MonthlyIntelligentReport"));
const SettingsPage            = lazy(() => import("./pages/SettingsPage"));
const AdminOnboardingPage     = lazy(() => import("./pages/AdminOnboardingPage"));
const LandingChatLogsPage     = lazy(() => import("./pages/admin/LandingChatLogsPage"));
const TechnicalAssistantPage  = lazy(() => import("./pages/TechnicalAssistantPage"));
const CorporateDashboard      = lazy(() => import("./pages/CorporateDashboard"));
const LubricationCardPage     = lazy(() => import("./pages/LubricationCardPage"));

function PageLoader() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#f8fafc" }}>
      <div style={{ width: 36, height: 36, border: "3px solid #e2e8f0", borderTopColor: "#0f172a", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function NotFoundRedirect() {
  const { isAuthenticated } = useAuth();
  return <Navigate to={isAuthenticated ? "/dashboard" : "/"} replace />;
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<LubriPlanLanding />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        <Route path="/dashboard" element={<ProtectedRoute roles={["ADMIN", "SUPERVISOR", "TECHNICIAN"]}><Dashboard /></ProtectedRoute>} />

        <Route path="/admin/links/technicians" element={<ProtectedRoute roles={["ADMIN"]}><AdminTechLinksPage /></ProtectedRoute>} />
        <Route path="/admin/onboarding" element={<ProtectedRoute roles={["ADMIN"]}><AdminOnboardingPage /></ProtectedRoute>} />
        <Route path="/admin/landing-leads" element={<ProtectedRoute roles={["ADMIN"]}><LandingChatLogsPage /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute roles={["ADMIN"]}><UsersPage /></ProtectedRoute>} />

        <Route path="/inventory" element={<ProtectedRoute roles={["ADMIN", "SUPERVISOR"]}><InventoryPage /></ProtectedRoute>} />
        <Route path="/analysis" element={<ProtectedRoute roles={["ADMIN", "SUPERVISOR"]}><AnalysisPage /></ProtectedRoute>} />
        <Route path="/export" element={<ProtectedRoute roles={["ADMIN", "SUPERVISOR"]}><ExportPage /></ProtectedRoute>} />
        <Route path="/technicians" element={<ProtectedRoute roles={["ADMIN", "SUPERVISOR"]}><TechniciansPage /></ProtectedRoute>} />
        <Route path="/areas/new" element={<ProtectedRoute roles={["ADMIN", "SUPERVISOR"]}><NewAreaPage /></ProtectedRoute>} />
        <Route path="/equipments/:id/edit" element={<ProtectedRoute roles={["ADMIN", "SUPERVISOR"]}><EditEquipmentPage /></ProtectedRoute>} />
        <Route path="/routes/new" element={<ProtectedRoute roles={["ADMIN", "SUPERVISOR"]}><NewRoutePage /></ProtectedRoute>} />
        <Route path="/routes/:id/edit" element={<ProtectedRoute roles={["ADMIN", "SUPERVISOR"]}><EditRoutePage /></ProtectedRoute>} />
        <Route path="/reports/monthly" element={<ProtectedRoute roles={["ADMIN", "SUPERVISOR"]}><MonthlyIntelligentReport /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute roles={["ADMIN"]}><SettingsPage /></ProtectedRoute>} />
        <Route path="/corporate" element={<ProtectedRoute roles={["ADMIN", "SUPERVISOR"]}><CorporateDashboard /></ProtectedRoute>} />

        <Route path="/equipments" element={<ProtectedRoute roles={["ADMIN", "SUPERVISOR", "TECHNICIAN"]}><EquipmentsPage /></ProtectedRoute>} />
        <Route path="/equipments/:id" element={<ProtectedRoute roles={["ADMIN", "SUPERVISOR", "TECHNICIAN"]}><EquipmentDetailPage /></ProtectedRoute>} />
        <Route path="/equipments/:id/lubrication-card" element={<ProtectedRoute roles={["ADMIN", "SUPERVISOR", "TECHNICIAN"]}><LubricationCardPage /></ProtectedRoute>} />
        <Route path="/activities" element={<ProtectedRoute roles={["ADMIN", "SUPERVISOR", "TECHNICIAN"]}><ActivitiesPage /></ProtectedRoute>} />
        <Route path="/activities/:id/complete" element={<ProtectedRoute roles={["ADMIN", "SUPERVISOR", "TECHNICIAN"]}><CompleteExecutionModal /></ProtectedRoute>} />
        <Route path="/routes/:routeId/activities" element={<ProtectedRoute roles={["ADMIN", "SUPERVISOR", "TECHNICIAN"]}><ActivitiesDetailPage /></ProtectedRoute>} />
        <Route path="/routes" element={<ProtectedRoute roles={["ADMIN", "SUPERVISOR", "TECHNICIAN"]}><RoutesPage /></ProtectedRoute>} />
        <Route path="/routes/:id" element={<ProtectedRoute roles={["ADMIN", "SUPERVISOR", "TECHNICIAN"]}><RouteDetail /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute roles={["ADMIN", "SUPERVISOR", "TECHNICIAN"]}><HistoryPage /></ProtectedRoute>} />
        <Route path="/condition-reports" element={<ProtectedRoute roles={["ADMIN", "SUPERVISOR", "TECHNICIAN"]}><ConditionReportsPage /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute roles={["ADMIN", "SUPERVISOR", "TECHNICIAN"]}><NotificationsPage /></ProtectedRoute>} />
        <Route path="/technical-assistant" element={<ProtectedRoute roles={["ADMIN", "SUPERVISOR", "TECHNICIAN"]}><TechnicalAssistantPage /></ProtectedRoute>} />

        <Route path="*" element={<NotFoundRedirect />} />
      </Routes>
    </Suspense>
  );
}
