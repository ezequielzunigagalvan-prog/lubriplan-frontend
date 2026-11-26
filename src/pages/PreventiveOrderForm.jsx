// src/pages/PreventiveOrderForm.jsx
// /preventive-orders/new y /preventive-orders/:id/edit: abre el formulario de la orden sobre el listado/detalle.
import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import OlpOrderForm from "../components/olp/OlpOrderForm";
import { preventiveOrdersService } from "../services/preventiveOrdersService";
import "./TechniciansPage.css";
import "../components/olp/Olp.css";

export default function PreventiveOrderForm() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    preventiveOrdersService
      .get(Number(id))
      .then(setOrder)
      .catch((e) => setError(e?.message || "No se pudo cargar la orden"));
  }, [id]);

  const back = () => navigate(id ? `/preventive-orders/${id}` : "/preventive-orders");

  return (
    <MainLayout>
      <div className="tch lp-fade-in">
        {error ? <div className="olp-error">{error}</div> : <div className="olp-empty">{id && !order ? "Cargando orden…" : "Orden preventiva"}</div>}
      </div>
      {!id || order ? (
        <OlpOrderForm
          open
          order={order}
          defaultEquipmentId={params.get("equipmentId")}
          onClose={back}
          onSaved={(o) => navigate(`/preventive-orders/${o?.id || id}`)}
        />
      ) : null}
    </MainLayout>
  );
}
