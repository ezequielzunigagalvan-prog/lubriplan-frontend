// src/components/onboarding/WelcomeChecklist.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getOnboardingProgress } from "../../services/dashboardService";

const STEPS = [
  {
    key: "areas",
    label: "Configura tus áreas",
    description: "Divide tu planta en zonas o departamentos.",
    icon: "🏭",
    path: "/equipments",
  },
  {
    key: "equipments",
    label: "Registra tus equipos",
    description: "Agrega los equipos que requieren lubricación.",
    icon: "⚙️",
    path: "/equipments",
  },
  {
    key: "technicians",
    label: "Crea tus técnicos",
    description: "Asigna a las personas que ejecutarán las actividades.",
    icon: "👷",
    path: "/technicians",
  },
  {
    key: "routes",
    label: "Define tu primera ruta",
    description: "Agrupa equipos en rutas y asigna frecuencia.",
    icon: "🗺️",
    path: "/routes/new",
  },
];

const STORAGE_KEY = "lubriplan_onboarding_dismissed";

export default function WelcomeChecklist() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(null);
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(STORAGE_KEY) === "true"
  );

  useEffect(() => {
    if (dismissed) return;
    getOnboardingProgress()
      .then((data) => {
        if (data?.completed) {
          // Todo configurado — no mostrar
          setDismissed(true);
        } else {
          setProgress(data?.progress ?? null);
        }
      })
      .catch(() => {}); // silencioso si falla
  }, [dismissed]);

  if (dismissed || !progress) return null;

  const completedCount = STEPS.filter((s) => (progress[s.key] ?? 0) > 0).length;
  const pct = Math.round((completedCount / STEPS.length) * 100);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "true");
    setDismissed(true);
  }

  return (
    <div style={{
      margin: "0 0 20px 0",
      borderRadius: 18,
      border: "1px solid rgba(249,115,22,0.25)",
      background: "linear-gradient(135deg, rgba(249,115,22,0.06) 0%, rgba(255,255,255,0.95) 100%)",
      boxShadow: "0 4px 24px rgba(249,115,22,0.08)",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px 12px", borderBottom: "1px solid rgba(226,232,240,0.8)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22 }}>🚀</span>
          <div>
            <div style={{ fontWeight: 900, fontSize: 15, color: "#0f172a" }}>¡Bienvenido a LubriPlan!</div>
            <div style={{ fontWeight: 600, fontSize: 12, color: "#64748b" }}>Completa estos pasos para tener el sistema listo</div>
          </div>
        </div>
        <button
          onClick={dismiss}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 18, lineHeight: 1, padding: 4 }}
          aria-label="Cerrar"
        >
          ×
        </button>
      </div>

      {/* Progress bar */}
      <div style={{ padding: "10px 20px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>Progreso de configuración</span>
          <span style={{ fontSize: 12, fontWeight: 900, color: pct === 100 ? "#16a34a" : "#f97316" }}>{completedCount} de {STEPS.length} pasos</span>
        </div>
        <div style={{ height: 6, borderRadius: 99, background: "rgba(226,232,240,0.8)", overflow: "hidden" }}>
          <div style={{
            height: "100%",
            borderRadius: 99,
            width: `${pct}%`,
            background: pct === 100 ? "#16a34a" : "#f97316",
            transition: "width 0.4s ease",
          }} />
        </div>
      </div>

      {/* Steps */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10, padding: 16 }}>
        {STEPS.map((step) => {
          const done = (progress[step.key] ?? 0) > 0;
          return (
            <button
              key={step.key}
              onClick={() => !done && navigate(step.path)}
              disabled={done}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                padding: "12px 14px",
                borderRadius: 12,
                border: done ? "1.5px solid rgba(34,197,94,0.35)" : "1.5px solid rgba(226,232,240,0.9)",
                background: done ? "rgba(34,197,94,0.06)" : "rgba(255,255,255,0.8)",
                cursor: done ? "default" : "pointer",
                textAlign: "left",
                transition: "all 0.15s",
              }}
            >
              <div style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: done ? "rgba(34,197,94,0.15)" : "rgba(249,115,22,0.1)",
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
                fontSize: 14,
              }}>
                {done ? "✅" : step.icon}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 13, color: done ? "#15803d" : "#0f172a" }}>{step.label}</div>
                <div style={{ fontWeight: 500, fontSize: 11, color: "#64748b", marginTop: 2 }}>{step.description}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
