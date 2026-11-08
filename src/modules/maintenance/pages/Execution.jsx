import { useTheme } from "../../../context/ThemeContext";

export default function Execution() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div style={{ padding: 16, color: isDark ? "#f1f5f9" : "#0f172a" }}>
      <h1>Ejecutar Orden</h1>
      <p>Página de ejecución en desarrollo</p>
    </div>
  );
}
