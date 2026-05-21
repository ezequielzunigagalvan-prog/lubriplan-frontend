import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Wrench } from "lucide-react";
import MainLayout from "../layouts/MainLayout";
import LubricationCard from "../components/LubricationCard/LubricationCard";
import { useLubricationCard } from "../hooks/useLubricationCard";
import { useAuth } from "../context/AuthContext";
import { getEquipmentById } from "../services/equipmentService";

export default function LubricationCardPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const equipmentId = useMemo(() => Number(id), [id]);
  const { user } = useAuth();
  const role = String(user?.role || "TECHNICIAN").toUpperCase();
  const canEdit = role === "ADMIN" || role === "SUPERVISOR";

  const [equipmentName, setEquipmentName] = useState("Equipo");

  const { card, loading, error, isEditing, setIsEditing, addPoint, updatePoint, deletePoint, uploadImage } =
    useLubricationCard(equipmentId);

  useEffect(() => {
    if (!equipmentId) return;
    getEquipmentById(equipmentId)
      .then((data) => {
        const eq = data?.item || data?.equipment || data?.result || data;
        if (eq?.name) setEquipmentName(eq.name);
      })
      .catch(() => {});
  }, [equipmentId]);

  return (
    <MainLayout>
      <div style={pageShell}>
        <div style={backRow}>
          <button type="button" onClick={() => navigate(`/equipments/${id}`)} style={btnGhost}>
            <ArrowLeft size={16} />
            Volver al equipo
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
            <Wrench size={16} color="#f97316" style={{ flexShrink: 0 }} />
            <span style={pageTitle}>Carta de Lubricación — {equipmentName}</span>
          </div>

          {canEdit && !loading && (
            <button
              type="button"
              onClick={() => setIsEditing((v) => !v)}
              style={isEditing ? btnEditActive : btnGhost}
            >
              {isEditing ? "✓ Finalizar edición" : "Editar carta"}
            </button>
          )}
        </div>

        {error && (
          <div style={errorBox}>{error}</div>
        )}

        {!loading && (
          <LubricationCard
            card={card}
            isEditing={isEditing && canEdit}
            canEdit={canEdit}
            equipmentName={equipmentName}
            onToggleEdit={() => { if (canEdit) setIsEditing((v) => !v); }}
            onAddPoint={addPoint}
            onUpdatePoint={updatePoint}
            onDeletePoint={deletePoint}
            onUploadImage={uploadImage}
          />
        )}

        {loading && (
          <div style={statusBox}>Cargando carta de lubricación…</div>
        )}
      </div>
    </MainLayout>
  );
}

const pageShell = {
  padding: 16,
  background: "linear-gradient(180deg, #f6f7f9 0%, #eef2f7 100%)",
  borderRadius: 16,
  border: "1px solid #e5e7eb",
};

const backRow = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: 16,
  flexWrap: "wrap",
};

const pageTitle = {
  fontSize: 17,
  fontWeight: 950,
  color: "#0f172a",
};

const btnGhost = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  background: "rgba(255,255,255,0.75)",
  color: "#0f172a",
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 12,
  padding: "10px 14px",
  fontWeight: 900,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const btnEditActive = {
  ...btnGhost,
  background: "rgba(249,115,22,0.12)",
  border: "1px solid rgba(249,115,22,0.4)",
  color: "#9a3412",
  fontWeight: 950,
};

const statusBox = {
  padding: 14,
  borderRadius: 12,
  border: "1px solid #e2e8f0",
  background: "#f8fafc",
  color: "#64748b",
  fontWeight: 800,
  fontSize: 13,
};

const errorBox = {
  marginBottom: 12,
  padding: 12,
  borderRadius: 12,
  border: "1px solid #fecaca",
  background: "#fee2e2",
  color: "#991b1b",
  fontWeight: 900,
  fontSize: 13,
};
