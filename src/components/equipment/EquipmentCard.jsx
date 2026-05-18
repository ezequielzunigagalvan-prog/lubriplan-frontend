import { useState } from "react";
import { Icon } from "../ui/lpIcons";

const CRIT_TONE = {
  CRITICA:      { border: "rgba(239,68,68,0.70)",  bg: "rgba(239,68,68,0.10)",  color: "#991b1b", label: "Crítica" },
  "CRÍTICA":    { border: "rgba(239,68,68,0.70)",  bg: "rgba(239,68,68,0.10)",  color: "#991b1b", label: "Crítica" },
  "MUY CRÍTICA":{ border: "rgba(239,68,68,0.70)",  bg: "rgba(239,68,68,0.10)",  color: "#991b1b", label: "Crítica" },
  ALTA:         { border: "rgba(245,158,11,0.65)", bg: "rgba(245,158,11,0.12)", color: "#92400e", label: "Alta" },
  MEDIA:        { border: "rgba(59,130,246,0.40)", bg: "rgba(59,130,246,0.09)", color: "#1e40af", label: "Media" },
  BAJA:         { border: "rgba(34,197,94,0.40)",  bg: "rgba(34,197,94,0.09)",  color: "#166534", label: "Baja" },
};

const getCritTone = (crit) =>
  CRIT_TONE[String(crit || "").toUpperCase().trim()] ||
  { border: "rgba(15,23,42,0.10)", bg: "rgba(15,23,42,0.04)", color: "#475569", label: null };

export default function EquipmentCard({ equipment, onClick }) {
  const [hover, setHover] = useState(false);

  const st  = String(equipment?.status || "").toUpperCase().trim();
  const isActive = st === "ACTIVO" || st === "ACTIVE";
  const statusLabel = isActive ? "Activo" : st ? "En mantenimiento" : "—";

  const crit     = String(equipment?.criticality || "").toUpperCase().trim();
  const critTone = getCritTone(crit);

  const code     = equipment?.code     || "";
  const location = equipment?.location || "";
  const type     = equipment?.type     || equipment?.equipmentType || "";

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter") onClick?.(); }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...card,
        borderLeft: `5px solid ${critTone.border}`,
        transform: hover ? "translateY(-3px)" : "translateY(0)",
        boxShadow: hover
          ? "0 20px 44px rgba(2,6,23,0.13), 0 4px 12px rgba(2,6,23,0.07)"
          : "0 10px 24px rgba(2,6,23,0.07)",
      }}
      title={equipment?.name || ""}
    >
      {/* ── TOP ROW: icono + criticidad ── */}
      <div style={topRow}>
        <div style={iconBox(critTone)}>
          <Icon name="equipment" size="md" />
        </div>

        {critTone.label ? (
          <span style={{ ...critBadge, background: critTone.bg, color: critTone.color }}>
            {critTone.label}
          </span>
        ) : null}
      </div>

      {/* ── NOMBRE ── */}
      <div style={nameBlock}>
        <div style={nameText}>{equipment?.name || "—"}</div>
        {type ? <div style={typeText}>{type}</div> : null}
      </div>

      {/* ── META: código y ubicación ── */}
      {(code || location) ? (
        <div style={metaRow}>
          {code ? (
            <span style={metaPill} title="Código / TAG">
              <Icon name="tag" size="sm" />
              {code}
            </span>
          ) : null}
          {location ? (
            <span style={metaPill} title="Ubicación">
              <Icon name="pin" size="sm" />
              {location}
            </span>
          ) : null}
        </div>
      ) : null}

      {/* ── FOOTER: estado + flecha ── */}
      <div style={footer}>
        <span style={statusPill(isActive)}>
          <span style={statusDot(isActive)} />
          {statusLabel}
        </span>
        <span style={chevWrap}>
          <Icon name="chevronRight" size="sm" />
        </span>
      </div>
    </div>
  );
}

/* ── Styles ── */

const card = {
  background: "linear-gradient(180deg, rgba(255,255,255,0.97) 0%, rgba(248,250,252,0.92) 100%)",
  border: "1px solid rgba(226,232,240,0.95)",
  borderTop: "3px solid #0f172a",
  borderRadius: 18,
  padding: 16,
  display: "flex",
  flexDirection: "column",
  gap: 12,
  cursor: "pointer",
  transition: "transform 200ms cubic-bezier(0.22,1,0.36,1), box-shadow 200ms ease",
  minWidth: 0,
};

const topRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const iconBox = (tone) => ({
  width: 40,
  height: 40,
  borderRadius: 12,
  background: tone.bg,
  border: `1px solid ${tone.border}`,
  color: tone.color,
  display: "grid",
  placeItems: "center",
  flexShrink: 0,
});

const critBadge = {
  padding: "4px 10px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 950,
  letterSpacing: 0.3,
  whiteSpace: "nowrap",
};

const nameBlock = {
  display: "flex",
  flexDirection: "column",
  gap: 3,
  minWidth: 0,
};

const nameText = {
  fontSize: 15,
  fontWeight: 900,
  color: "#0f172a",
  lineHeight: 1.25,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
};

const typeText = {
  fontSize: 12,
  fontWeight: 800,
  color: "#64748b",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const metaRow = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
};

const metaPill = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "5px 10px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 900,
  color: "#334155",
  background: "rgba(15,23,42,0.04)",
  border: "1px solid rgba(226,232,240,0.95)",
  whiteSpace: "nowrap",
  maxWidth: 180,
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const footer = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  borderTop: "1px solid rgba(226,232,240,0.80)",
  paddingTop: 10,
  marginTop: 2,
};

const statusPill = (active) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  padding: "5px 10px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 950,
  background: active ? "rgba(34,197,94,0.10)" : "rgba(245,158,11,0.12)",
  color: active ? "#14532d" : "#78350f",
  border: active ? "1px solid rgba(34,197,94,0.25)" : "1px solid rgba(245,158,11,0.30)",
  whiteSpace: "nowrap",
});

const statusDot = (active) => ({
  width: 7,
  height: 7,
  borderRadius: 999,
  background: active ? "#22c55e" : "#f59e0b",
  flexShrink: 0,
});

const chevWrap = {
  width: 28,
  height: 28,
  borderRadius: 8,
  display: "grid",
  placeItems: "center",
  background: "rgba(15,23,42,0.04)",
  border: "1px solid rgba(226,232,240,0.95)",
  color: "#64748b",
  flexShrink: 0,
};
