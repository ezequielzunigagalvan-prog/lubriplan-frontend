import { useTheme } from "../../../context/ThemeContext";

export default function AssetDetail() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div style={{ padding: 16, color: isDark ? "#f1f5f9" : "#0f172a" }}>
      <h1>Detalle de Activo</h1>
      <p>Página de detalle en desarrollo</p>
    </div>
  );
}
