import { useTheme } from "../../../context/ThemeContext";

export default function WorkOrders() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div style={{ padding: 16, color: isDark ? "#f1f5f9" : "#0f172a" }}>
      <h1>Órdenes de Trabajo</h1>
      <p>Página de órdenes en desarrollo</p>
    </div>
  );
}
