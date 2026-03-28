// src/components/plants/PlantSwitcher.jsx
import { useMemo } from "react";
import { usePlant } from "../../context/PlantContext";

export default function PlantSwitcher({ compact = false }) {
  const { plants, currentPlantId, setPlant, loadingPlants, plantsError } = usePlant();

  const disabled = loadingPlants || !!plantsError || !plants?.length;

  const label = useMemo(() => {
    if (loadingPlants) return "Cargando...";
    if (plantsError) return "Sin plantas";
    if (!plants?.length) return "Sin plantas";
    return "Planta";
  }, [loadingPlants, plantsError, plants]);

  const currentPlantName = useMemo(() => {
    return plants.find((p) => String(p.id) === String(currentPlantId))?.name || "";
  }, [plants, currentPlantId]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0, width: compact ? "auto" : "100%", maxWidth: compact ? 220 : "100%" }}>
      {!compact && (
        <div style={{ fontSize: 12, color: "#A7A7A7", letterSpacing: 0.2 }}>
          {label}
        </div>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 12px",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(24,24,24,0.95)",
          boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
          opacity: loadingPlants ? 0.75 : 1,
        }}
        title={
          loadingPlants
            ? "Cargando plantas..."
            : plantsError
            ? plantsError
            : currentPlantName
            ? `Planta activa: ${currentPlantName}`
            : "Selecciona una planta"
        }
      >
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: 999,
            background: "#F97316",
            boxShadow: "0 0 0 4px rgba(249,115,22,0.18)",
            flex: "0 0 auto",
          }}
        />

        <select
          value={currentPlantId || ""}
          disabled={disabled}
          onChange={(e) => setPlant(e.target.value)}
          style={{
            width: "100%",
            background: "transparent",
            border: "none",
            outline: "none",
            color: "#EDEDED",
            fontSize: 14,
            fontWeight: 600,
            appearance: "none",
            cursor: disabled ? "not-allowed" : "pointer",
          }}
        >
          {!plants?.length ? <option value="">Sin plantas</option> : null}

          {plants?.length > 0 && !currentPlantId ? (
            <option value="">Seleccionar planta...</option>
          ) : null}

          {plants?.map((p) => (
            <option key={p.id} value={p.id} style={{ color: "#111" }}>
              {p.name}
            </option>
          ))}
        </select>

        
      </div>

      {plantsError ? (
        <div style={{ fontSize: 12, color: "#FCA5A5" }}>{plantsError}</div>
      ) : null}
    </div>
  );
}

