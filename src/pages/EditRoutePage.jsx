// src/pages/EditRoutePage.jsx
// La edición de rutas vive en el detalle (modal completo con frecuencias, equipos y evidencia).
// Esta ruta antigua solo redirige para no romper enlaces guardados.
import { Navigate, useParams } from "react-router-dom";

export default function EditRoutePage() {
  const { id } = useParams();
  return <Navigate to={`/routes/${id}`} replace />;
}
