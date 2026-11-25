// src/pages/QrResolvePage.jsx
// Destino del QR pegado en el equipo: /qr/<token>.
// Resuelve el equipo, cambia a su planta si hace falta y abre su carta de lubricación.
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { usePlant } from "../context/PlantContext";
import { resolveEquipmentQr } from "../services/lubricationCardService";
import { Icon } from "../components/ui/lpIcons";
import "../components/LubricationCard/LubricationCardUi.css";

export default function QrResolvePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { currentPlantId, setPlant } = usePlant();
  const [error, setError] = useState("");
  const [target, setTarget] = useState(null);

  useEffect(() => {
    let alive = true;
    resolveEquipmentQr(token)
      .then((r) => alive && setTarget(r))
      .catch((e) => alive && setError(e?.message || "No se pudo leer el código QR"));
    return () => {
      alive = false;
    };
  }, [token]);

  useEffect(() => {
    if (!target) return;
    if (String(target.plantId) !== String(currentPlantId)) {
      setPlant?.(target.plantId);
      return; // al cambiar la planta se vuelve a evaluar
    }
    navigate(`/equipments/${target.equipmentId}/lubrication-card`, { replace: true });
  }, [target, currentPlantId, setPlant, navigate]);

  return (
    <MainLayout>
      <div style={{ maxWidth: 520, margin: "40px auto", padding: 16 }}>
        {error ? (
          <div className="lc-empty" style={{ background: "#fff", borderRadius: 18, border: "1px solid #e2e8f0" }}>
            <Icon name="alert" size="xl" />
            <b>No se pudo abrir el equipo</b>
            <span>{error}</span>
            <button type="button" className="lc-btn is-primary" style={{ marginTop: 10 }} onClick={() => navigate("/equipments")}>
              Ir a equipos
            </button>
          </div>
        ) : (
          <div className="lc-empty" style={{ background: "#fff", borderRadius: 18, border: "1px solid #e2e8f0" }}>
            <Icon name="search" size="xl" />
            <b>{target ? `Abriendo ${target.name}…` : "Leyendo código QR…"}</b>
            {target?.plantName ? <span>{target.plantName}</span> : null}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
