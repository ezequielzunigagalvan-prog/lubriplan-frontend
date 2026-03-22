export default function RouteStatusBadge({ status }) {
  const map = {
    activa: {
      label: "🟢 Activa",
      bg: "#e6f6ec",
      color: "#1e7e34",
    },
    pausada: {
      label: "🟡 Pausada",
      bg: "#fff8e1",
      color: "#f9a825",
    },
    atrasada: {
      label: "🔴 Atrasada",
      bg: "#fdecea",
      color: "#c62828",
    },
  };

  const cfg = map[status] || map.activa;

  return (
    <div
      style={{
        display: "inline-block",
        padding: "6px 12px",
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
        background: cfg.bg,
        color: cfg.color,
      }}
    >
      {cfg.label}
    </div>
  );
}