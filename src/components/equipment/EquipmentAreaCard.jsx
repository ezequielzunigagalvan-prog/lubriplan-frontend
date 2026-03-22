import { useNavigate } from "react-router-dom";
import EquipmentCard from "./EquipmentCard";

export default function EquipmentAreaCard({ area }) {
  const navigate = useNavigate();

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        padding: 20,
        boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
      }}
    >
      {/* HEADER ÁREA */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <h3 style={{ margin: 0 }}>{area.name}</h3>

        <span style={{ fontSize: 13, color: "#666" }}>
          {area.equipments.length} equipos
        </span>
      </div>

      {/* EQUIPOS */}
      <div
        style={{
          display: "grid",
          gap: 12,
        }}
      >
        {area.equipments.map((eq) => (
          <EquipmentCard
            key={eq.id}
            equipment={eq}
            onClick={() => navigate(`/equipment/${eq.id}`)}
          />
        ))}
      </div>
    </div>
  );
}