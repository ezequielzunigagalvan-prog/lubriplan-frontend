import { useTheme } from "../../../context/ThemeContext";

export default function Assets() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div style={{ padding: 16, color: isDark ? "#f1f5f9" : "#0f172a" }}>
      <h1>Activos</h1>
      <p>Página de gestión de activos en desarrollo</p>
    </div>
  );
}
