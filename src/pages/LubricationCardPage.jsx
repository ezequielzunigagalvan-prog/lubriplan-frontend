// src/pages/LubricationCardPage.jsx
// Carta de lubricación de un equipo: encabezado con datos del equipo, QR único y la carta.
import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import LubricationCard from "../components/LubricationCard/LubricationCard";
import EquipmentQr from "../components/LubricationCard/EquipmentQr";
import { useLubricationCard } from "../hooks/useLubricationCard";
import { useAuth } from "../context/AuthContext";
import { Icon } from "../components/ui/lpIcons";
import "../components/LubricationCard/LubricationCardUi.css";

export default function LubricationCardPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const equipmentId = useMemo(() => Number(id), [id]);
  const { user } = useAuth();
  const role = String(user?.role || "TECHNICIAN").toUpperCase();
  const canEdit = role === "ADMIN" || role === "SUPERVISOR";

  const {
    card, equipment, qr, loading, error, isEditing, setIsEditing,
    addPoint, updatePoint, deletePoint,
    uploadImage, addSectionImage, renameSectionImage, removeSectionImage,
    syncRoutes,
  } = useLubricationCard(equipmentId);

  const equipmentName = equipment?.name || "Equipo";
  const points = card?.points ?? [];
  const routesLoaded = new Set(points.map((p) => p.routeId).filter(Boolean)).size;
  const images = (card?.images ?? []).length + (card?.imageUrl ? 1 : 0);

  return (
    <MainLayout>
      <div className="lc-page">
        <div className="lc-hero">
          <div style={{ minWidth: 0 }}>
            <div className="lc-kicker">CARTA DE LUBRICACIÓN</div>
            <h1>{equipmentName}</h1>
            <div className="lc-hero-meta">
              {equipment?.code ? (
                <span>
                  <Icon name="tag" size="sm" /> {equipment.code}
                </span>
              ) : null}
              {equipment?.location ? (
                <span>
                  <Icon name="pin" size="sm" /> {equipment.location}
                </span>
              ) : null}
              {equipment?.plant?.name ? (
                <span>
                  <Icon name="building" size="sm" /> {equipment.plant.name}
                </span>
              ) : null}
            </div>
            <div className="lc-hero-stats">
              <span className="lc-stat">
                <b>{points.length}</b>punto{points.length === 1 ? "" : "s"}
              </span>
              <span className="lc-stat">
                <b>{routesLoaded}</b>ruta{routesLoaded === 1 ? "" : "s"} cargada{routesLoaded === 1 ? "" : "s"}
              </span>
              <span className="lc-stat">
                <b>{images}</b>{images === 1 ? "imagen" : "imágenes"}
              </span>
            </div>
            <div className="lc-hero-actions">
              <button type="button" className="lc-btn" onClick={() => navigate(`/equipments/${id}`)}>
                <Icon name="equipment" size="sm" /> Ver equipo
              </button>
              {canEdit && !loading ? (
                <button type="button" className={`lc-btn ${isEditing ? "" : "is-primary"}`} onClick={() => setIsEditing((v) => !v)}>
                  <Icon name={isEditing ? "check" : "edit"} size="sm" />
                  {isEditing ? "Terminar edición" : "Editar carta"}
                </button>
              ) : null}
            </div>
          </div>
          {qr?.token ? <EquipmentQr token={qr.token} createdAt={qr.createdAt} equipment={equipment} compact /> : null}
        </div>

        {error ? <div className="lc-error" style={{ marginBottom: 12 }}>{error}</div> : null}
        {loading ? <div className="lc-muted">Cargando carta de lubricación…</div> : null}

        {!loading && card ? (
          <LubricationCard
            card={card}
            isEditing={isEditing && canEdit}
            canEdit={canEdit}
            equipmentId={equipmentId}
            equipmentName={equipmentName}
            equipment={equipment}
            qrToken={qr?.token || ""}
            onToggleEdit={() => {
              if (canEdit) setIsEditing((v) => !v);
            }}
            onAddPoint={addPoint}
            onUpdatePoint={updatePoint}
            onDeletePoint={deletePoint}
            onUploadImage={uploadImage}
            onAddSectionImage={addSectionImage}
            onRenameSectionImage={renameSectionImage}
            onRemoveSectionImage={removeSectionImage}
            onSyncRoutes={syncRoutes}
          />
        ) : null}
      </div>
    </MainLayout>
  );
}
