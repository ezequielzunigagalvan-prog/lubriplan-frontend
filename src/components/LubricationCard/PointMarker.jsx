import { useState } from "react";

const FREQ_COLOR = {
  DAILY:     "#dc2626",
  WEEKLY:    "#f97316",
  MONTHLY:   "#d97706",
  QUARTERLY: "#16a34a",
  ANNUAL:    "#2563eb",
};

const FREQ_LABEL = {
  DAILY: "Diaria", WEEKLY: "Semanal", MONTHLY: "Mensual",
  QUARTERLY: "Trimestral", ANNUAL: "Anual",
};

const METHOD_LABEL = {
  MANUAL: "Manual", AUTO: "Automático", GREASE_GUN: "Pistola grasa", OIL_CAN: "Aceitera",
};

export default function PointMarker({ point, index, isEditing, onPointerDown, onClick }) {
  const [hovered, setHovered] = useState(false);
  const color = FREQ_COLOR[point.frequency] ?? "#64748b";

  const markerStyle = {
    position: "absolute",
    left: `${point.x}%`,
    top: `${point.y}%`,
    transform: "translate(-50%, -50%)",
    zIndex: 10,
    cursor: isEditing ? "grab" : "pointer",
    userSelect: "none",
    touchAction: "none",
  };

  const circleStyle = {
    width: 28,
    height: 28,
    borderRadius: "50%",
    background: color,
    border: "2.5px solid #fff",
    boxShadow: `0 0 0 ${hovered ? "4px" : "2px"} ${color}55, 0 2px 8px rgba(0,0,0,0.25)`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontSize: 11,
    fontWeight: 900,
    transition: "box-shadow 0.15s, transform 0.15s",
    transform: hovered ? "scale(1.15)" : "scale(1)",
  };

  const tooltipStyle = {
    position: "absolute",
    bottom: "calc(100% + 8px)",
    left: "50%",
    transform: "translateX(-50%)",
    background: "rgba(15,23,42,0.96)",
    color: "#f1f5f9",
    borderRadius: 8,
    padding: "8px 10px",
    fontSize: 11,
    lineHeight: 1.5,
    whiteSpace: "nowrap",
    pointerEvents: "none",
    boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
    zIndex: 50,
    minWidth: 150,
  };

  return (
    <>
      {/* Pulse ring — only in view mode */}
      {!isEditing && (
        <div
          style={{
            position: "absolute",
            left: `${point.x}%`,
            top: `${point.y}%`,
            transform: "translate(-50%, -50%)",
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: `${color}33`,
            animation: "lp-pulse 2s infinite",
            zIndex: 9,
            pointerEvents: "none",
          }}
        />
      )}

      <div
        style={markerStyle}
        onPointerDown={(e) => { onPointerDown?.(e, point.id); }}
        onClick={(e) => { if (!isEditing) onClick?.(e, point); }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div style={circleStyle}>{index + 1}</div>

        {hovered && !isEditing && (
          <div style={tooltipStyle}>
            <div style={{ fontWeight: 800, marginBottom: 3 }}>{point.label}</div>
            {point.lubricant && <div>Lubricante: {point.lubricant}</div>}
            {point.quantity != null && <div>Cantidad: {point.quantity} {point.unit}</div>}
            <div>Frecuencia: <span style={{ color }}>{FREQ_LABEL[point.frequency]}</span></div>
            <div>Método: {METHOD_LABEL[point.method]}</div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes lp-pulse {
          0%   { transform: translate(-50%,-50%) scale(1);   opacity: 0.8; }
          70%  { transform: translate(-50%,-50%) scale(2.2); opacity: 0;   }
          100% { transform: translate(-50%,-50%) scale(1);   opacity: 0;   }
        }
      `}</style>
    </>
  );
}
