import { useState } from "react";
import { Icon } from "../ui/lpIcons";

export default function EquipmentCard({ equipment, onClick }) {
  const [hover, setHover] = useState(false);

  const st = String(equipment?.status || "").toUpperCase().trim();
  const isActive = st === "ACTIVO" || st === "ACTIVE";

  const crit = String(equipment?.criticality || "").toUpperCase().trim();
  const code = equipment?.code || "";
  const location = equipment?.location || "";

  const statusLabel = isActive ? "Activo" : st ? "Mantenimiento" : "—";

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") onClick?.();
      }}
      style={{ ...card, ...(hover ? cardHover : null) }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title={equipment?.name || ""}
    >
      <div style={{ minWidth: 0 }}>
        <div style={titleRow}>
          <div style={name}>{equipment?.name || "—"}</div>

          <span style={statusPill(isActive)}>
            <span style={dot(isActive)} />
            {statusLabel}
          </span>
        </div>

        {(code || location || crit) ? (
          <div style={metaRow}>
            {code ? (
              <div style={metaItem} title="Código / TAG">
                <span style={metaIcon}><Icon name="tag" size="sm" /></span>
                <span style={metaText}>{code}</span>
              </div>
            ) : null}

            {location ? (
              <div style={metaItem} title="Ubicación">
                <span style={metaIcon}><Icon name="building" size="sm" /></span>
                <span style={metaText}>{location}</span>
              </div>
            ) : null}

            {crit ? (
              <span style={critPill(crit)} title="Criticidad">
                {crit}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      <div style={chev} aria-hidden>
        <Icon name="chevronRight" size="lg" />
      </div>
    </div>
  );
}

const card = {
  background: "rgba(255,255,255,0.72)",
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 16,
  padding: 12,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
  cursor: "pointer",
  backdropFilter: "blur(4px)",
  transition: "transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease",
  boxShadow: "0 10px 22px rgba(15,23,42,0.06)",
};

const cardHover = {
  transform: "translateY(-2px)",
  borderColor: "rgba(203,213,225,0.95)",
  boxShadow: "0 18px 34px rgba(15,23,42,0.10)",
};

const titleRow = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 10,
};

const name = {
  fontWeight: 1000,
  color: "#0f172a",
  letterSpacing: 0.2,
  fontSize: 14,
  lineHeight: 1.15,
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const pillBase = {
  padding: "6px 10px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 950,
  border: "1px solid rgba(226,232,240,0.95)",
  lineHeight: 1,
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  whiteSpace: "nowrap",
};

const statusPill = (active) => ({
  ...pillBase,
  background: active ? "rgba(34,197,94,0.10)" : "rgba(245,158,11,0.12)",
  color: active ? "#14532d" : "#78350f",
});

const dot = (active) => ({
  width: 8,
  height: 8,
  borderRadius: 999,
  background: active ? "rgba(34,197,94,0.90)" : "rgba(245,158,11,0.90)",
  boxShadow: "0 0 0 3px rgba(255,255,255,0.70) inset",
});

const metaRow = {
  marginTop: 8,
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  alignItems: "center",
};

const metaItem = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  minWidth: 0,
  maxWidth: 240,
  padding: "6px 10px",
  borderRadius: 12,
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(248,250,252,0.75)",
};

const metaIcon = { opacity: 0.9, display: "inline-flex", alignItems: "center" };

const metaText = {
  fontSize: 12,
  fontWeight: 900,
  color: "#334155",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const critPill = (crit) => {
  const c = String(crit || "").toUpperCase();
  const isCrit = c === "CRITICA" || c === "CRÍTICA" || c === "MUY CRÍTICA";
  return {
    ...pillBase,
    background: isCrit ? "rgba(239,68,68,0.10)" : "rgba(15,23,42,0.04)",
    color: isCrit ? "#7f1d1d" : "#0f172a",
  };
};

const chev = {
  color: "#94a3b8",
  lineHeight: 1,
  padding: "0 4px",
  display: "inline-flex",
  alignItems: "center",
};
