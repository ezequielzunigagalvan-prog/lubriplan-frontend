// El listado de órdenes ya filtra por técnico: esta ruta redirige ahí.
import { Navigate } from "react-router-dom";

export default function PreventiveOrdersTechnician() {
  return <Navigate to="/preventive-orders" replace />;
}
