import App from "./App";
import { usePlant } from "./context/PlantContext";
import { useAuth } from "./context/AuthContext";

const EXEC_DISPLAY_FONT = "\"Iowan Old Style\", \"Palatino Linotype\", \"Book Antiqua\", Georgia, serif";
const EXEC_TEXT_FONT = "\"Aptos\", \"Segoe UI\", \"Helvetica Neue\", Arial, sans-serif";

export default function AppGate() {
  const { user } = useAuth();
  const { plants, loadingPlants, plantsError, currentPlantId } = usePlant();

  // Si no hay usuario, deja que App decida mostrar login
  if (!user) {
    return <App />;
  }

  if (loadingPlants) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#0f172a",
          color: "#fff",
          fontFamily: EXEC_TEXT_FONT,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 700, fontFamily: EXEC_DISPLAY_FONT, letterSpacing: "-.02em" }}>Cargando LubriPlan…</div>
          <div style={{ marginTop: 8, fontSize: 14, opacity: 0.8 }}>
            Preparando planta activa
          </div>
        </div>
      </div>
    );
  }

  if (plantsError) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#0f172a",
          color: "#fff",
          fontFamily: EXEC_TEXT_FONT,
          padding: 24,
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 520 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#fca5a5", fontFamily: EXEC_DISPLAY_FONT, letterSpacing: "-.02em" }}>
            No se pudieron cargar las plantas
          </div>
          <div style={{ marginTop: 10, fontSize: 14, opacity: 0.9 }}>
            {plantsError}
          </div>
        </div>
      </div>
    );
  }

  if (!plants?.length) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#0f172a",
          color: "#fff",
          fontFamily: EXEC_TEXT_FONT,
          padding: 24,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 20, fontWeight: 700, fontFamily: EXEC_DISPLAY_FONT, letterSpacing: "-.02em", marginBottom: 24 }}>
            No tienes plantas asignadas
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "12px 24px",
              borderRadius: "8px",
              background: "#38bdf8",
              color: "#fff",
              border: "none",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
              transition: "opacity 150ms ease",
            }}
            onMouseEnter={(e) => e.target.style.opacity = "0.8"}
            onMouseLeave={(e) => e.target.style.opacity = "1"}
          >
            Recarga la página
          </button>
        </div>
      </div>
    );
  }

  if (!currentPlantId) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#0f172a",
          color: "#fff",
          fontFamily: EXEC_TEXT_FONT,
          padding: 24,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 20, fontWeight: 800 }}>
            Seleccionando planta activa…
          </div>
        </div>
      </div>
    );
  }

  return <App />;
}
