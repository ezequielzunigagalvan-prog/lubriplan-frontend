// src/pages/DashboardHome.jsx
// Inicio del panel: ADMIN y SUPERVISOR ven primero el resumen multiplanta;
// el técnico va directo al dashboard de su planta.
import { lazy } from "react";
import { useAuth } from "../context/AuthContext";

const PlantsOverviewPage = lazy(() => import("./PlantsOverviewPage"));
const Dashboard = lazy(() => import("./Dashboard"));

export default function DashboardHome() {
  const { user } = useAuth();
  const role = String(user?.role || "").toUpperCase();
  return role === "ADMIN" || role === "SUPERVISOR" ? <PlantsOverviewPage /> : <Dashboard />;
}
