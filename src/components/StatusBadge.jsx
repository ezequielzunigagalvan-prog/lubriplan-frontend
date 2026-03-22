const statusStyles = {
  PENDING: {
    background: "#fff4e5",
    color: "#f39c12",
    label: "Pendiente",
  },
  COMPLETED: {
    background: "#e6f7ee",
    color: "#2ecc71",
    label: "Completada",
  },
  OVERDUE: {
    background: "#fdecea",
    color: "#e74c3c",
    label: "Vencida",
  },
  EMERGENCY: {
    background: "#f3e6ff",
    color: "#8e44ad",
    label: "Emergencia",
  },
};

export default function StatusBadge({ status }) {
  const style = statusStyles[status] || statusStyles.PENDING;

  return (
    <span
      style={{
        padding: "4px 10px",
        borderRadius: 20,
        fontSize: 12,
        fontWeight: "bold",
        background: style.background,
        color: style.color,
      }}
    >
      {style.label}
    </span>
  );
}