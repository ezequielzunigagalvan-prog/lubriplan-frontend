const map = {
  activa: {
    label: "Activa",
    bg: "rgba(34,197,94,0.10)",
    border: "rgba(34,197,94,0.28)",
    color: "#166534",
    dot: "#22c55e",
  },
  pausada: {
    label: "Pausada",
    bg: "rgba(245,158,11,0.10)",
    border: "rgba(245,158,11,0.30)",
    color: "#92400e",
    dot: "#f59e0b",
  },
  atrasada: {
    label: "Atrasada",
    bg: "rgba(239,68,68,0.10)",
    border: "rgba(239,68,68,0.28)",
    color: "#991b1b",
    dot: "#ef4444",
  },
};

export default function RouteStatusBadge({ status }) {
  const cfg = map[String(status || "").toLowerCase()] || map.activa;

  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "4px 10px",
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 800,
      background: cfg.bg,
      border: `1px solid ${cfg.border}`,
      color: cfg.color,
      whiteSpace: "nowrap",
    }}>
      <span style={{
        width: 7,
        height: 7,
        borderRadius: "50%",
        background: cfg.dot,
        flexShrink: 0,
      }} />
      {cfg.label}
    </span>
  );
}
