import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

import Dashboard from "./pages/Dashboard";
import LoginPage from "./pages/LoginPage";
import LubriPlanLanding from "./pages/LubriPlanLanding";
import RoutesPage from "./pages/RoutesPage";
import RouteDetail from "./pages/RouteDetail";
import EditRoutePage from "./pages/EditRoutePage";

import ActivitiesPage from "./pages/ActivitiesPage";
import ActivitiesDetailPage from "./pages/ActivitiesDetailPage";
import CompleteExecutionModal from "./pages/CompleteExecutionModal.jsx";
import EquipmentsPage from "./pages/EquipmentsPage";
import EquipmentDetailPage from "./pages/EquipmentDetailPage";
import EditEquipmentPage from "./pages/EditEquipmentPage.jsx";

import NewAreaPage from "./pages/NewAreaPage";
import UsersPage from "./pages/UsersPage";
import InventoryPage from "./pages/InventoryPage";
import TechniciansPage from "./pages/TechniciansPage";
import AnalysisPage from "./pages/AnalysisPage";
import ExportPage from "./pages/ExportPage";
import HistoryPage from "./pages/HistoryPage";

import ProtectedRoute from "./auth/ProtectedRoute";
import Unauthorized from "./pages/Unauthorized";
import ConditionReportsPage from "./pages/ConditionReportsPage.jsx";
import AdminTechLinksPage from "./pages/AdminTechLinksPage";
import NewRoutePage from "./pages/NewRoutePage";
import NotificationsPage from "./pages/NotificationsPage";
import MonthlyIntelligentReport from "./pages/reports/MonthlyIntelligentReport";
import SettingsPage from "./pages/SettingsPage";

function NotFoundRedirect() {
  const { isAuthenticated } = useAuth();
  return <Navigate to={isAuthenticated ? "/dashboard" : "/"} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LubriPlanLanding />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute roles={["ADMIN", "SUPERVISOR", "TECHNICIAN"]}>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/links/technicians"
        element={
          <ProtectedRoute roles={["ADMIN"]}>
            <AdminTechLinksPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/users"
        element={
          <ProtectedRoute roles={["ADMIN"]}>
            <UsersPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/inventory"
        element={
          <ProtectedRoute roles={["ADMIN", "SUPERVISOR"]}>
            <InventoryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analysis"
        element={
          <ProtectedRoute roles={["ADMIN", "SUPERVISOR"]}>
            <AnalysisPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/export"
        element={
          <ProtectedRoute roles={["ADMIN", "SUPERVISOR"]}>
            <ExportPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/technicians"
        element={
          <ProtectedRoute roles={["ADMIN", "SUPERVISOR"]}>
            <TechniciansPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/areas/new"
        element={
          <ProtectedRoute roles={["ADMIN", "SUPERVISOR"]}>
            <NewAreaPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/equipments/:id/edit"
        element={
          <ProtectedRoute roles={["ADMIN", "SUPERVISOR"]}>
            <EditEquipmentPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/routes/new"
        element={
          <ProtectedRoute roles={["ADMIN", "SUPERVISOR"]}>
            <NewRoutePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/equipments"
        element={
          <ProtectedRoute roles={["ADMIN", "SUPERVISOR", "TECHNICIAN"]}>
            <EquipmentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/equipments/:id"
        element={
          <ProtectedRoute roles={["ADMIN", "SUPERVISOR", "TECHNICIAN"]}>
            <EquipmentDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/activities"
        element={
          <ProtectedRoute roles={["ADMIN", "SUPERVISOR", "TECHNICIAN"]}>
            <ActivitiesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/activities/:id/complete"
        element={
          <ProtectedRoute roles={["ADMIN", "SUPERVISOR", "TECHNICIAN"]}>
            <CompleteExecutionModal />
          </ProtectedRoute>
        }
      />
      <Route
        path="/routes/:routeId/activities"
        element={
          <ProtectedRoute roles={["ADMIN", "SUPERVISOR", "TECHNICIAN"]}>
            <CompleteExecutionModal />
          </ProtectedRoute>
        }
      />

      <Route
        path="/routes"
        element={
          <ProtectedRoute roles={["ADMIN", "SUPERVISOR", "TECHNICIAN"]}>
            <RoutesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/routes/:id"
        element={
          <ProtectedRoute roles={["ADMIN", "SUPERVISOR", "TECHNICIAN"]}>
            <RouteDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/routes/:id/edit"
        element={
          <ProtectedRoute roles={["ADMIN", "SUPERVISOR"]}>
            <EditRoutePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/history"
        element={
          <ProtectedRoute roles={["ADMIN", "SUPERVISOR", "TECHNICIAN"]}>
            <HistoryPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/condition-reports"
        element={
          <ProtectedRoute roles={["ADMIN", "SUPERVISOR", "TECHNICIAN"]}>
            <ConditionReportsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/notifications"
        element={
          <ProtectedRoute roles={["ADMIN", "SUPERVISOR", "TECHNICIAN"]}>
            <NotificationsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/reports/monthly"
        element={
          <ProtectedRoute roles={["ADMIN", "SUPERVISOR"]}>
            <MonthlyIntelligentReport />
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute roles={["ADMIN"]}>
            <SettingsPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFoundRedirect />} />
    </Routes>
  );
}

