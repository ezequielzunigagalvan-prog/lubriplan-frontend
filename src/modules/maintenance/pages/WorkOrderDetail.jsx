import { useTheme } from "../../../context/ThemeContext";

export default function WorkOrderDetail() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div style={{ padding: 16, color: isDark ? "#f1f5f9" : "#0f172a" }}>
      <h1>Detalle de Orden</h1>
      <p>Página de detalle de orden en desarrollo</p>
    </div>
  );
}
