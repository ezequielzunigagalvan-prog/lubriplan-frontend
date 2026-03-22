import { Link } from "react-router-dom";

export default function DashboardButton({ to, label }) {
  return (
    <Link
      to={to}
      style={{
        flex: 1,
        background: "#ff7a00",
        color: "#fff",
        padding: 16,
        borderRadius: 14,
        textAlign: "center",
        fontWeight: 600,
        textDecoration: "none",
      }}
    >
      {label}
    </Link>
  );
}