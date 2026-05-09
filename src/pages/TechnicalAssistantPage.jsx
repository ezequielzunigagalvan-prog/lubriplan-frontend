import MainLayout from "../layouts/MainLayout";
import GreaseCompatibilityTool from "../components/technical/GreaseCompatibilityTool";
import BearingRegreaseTool from "../components/technical/BearingRegreaseTool";
import GearboxViscosityTool from "../components/technical/GearboxViscosityTool";
import TechnicalConverterTool from "../components/technical/TechnicalConverterTool";
import LubricationFrequencyTool from "../components/technical/LubricationFrequencyTool";

export default function TechnicalAssistantPage() {
  return (
    <MainLayout>
      <style>{`
        @media (max-width: 820px) {
          .technicalHero {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div style={shell}>
        <div className="technicalHero" style={hero}>
          <div style={heroCopy}>
            <div style={kicker}>LUBRIPLAN · HERRAMIENTAS TÉCNICAS</div>
            <h1 style={title}>Asistente técnico de lubricación</h1>
            <p style={subtitle}>
              Herramientas de apoyo para tomar decisiones más rápidas en compatibilidad,
              reengrase, conversión técnica y selección inicial de viscosidad.
            </p>
          </div>

          <div style={heroNote}>
            <div style={heroNoteTitle}>Uso recomendado</div>
            <div style={heroNoteText}>
              Estas herramientas entregan una referencia técnica inicial. Para activos
              críticos, valida siempre con OEM, fichas técnicas y condiciones reales de
              operación.
            </div>
          </div>
        </div>

        <div style={toolsGrid}>
          <GreaseCompatibilityTool />
          <BearingRegreaseTool />
          <TechnicalConverterTool />
          <GearboxViscosityTool />
          <div style={fullWidthTool}>
            <LubricationFrequencyTool />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

const shell = {
  display: "grid",
  gap: 18,
};

const hero = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.5fr) minmax(280px, 0.9fr)",
  gap: 14,
  alignItems: "stretch",
};

const heroCopy = {
  borderRadius: 26,
  padding: "22px 22px 20px",
  background: "linear-gradient(135deg, #0f172a 0%, #172554 50%, #1d4ed8 100%)",
  boxShadow: "0 22px 48px rgba(15,23,42,0.18)",
};

const kicker = {
  fontSize: 11,
  fontWeight: 950,
  color: "#93c5fd",
  letterSpacing: 1.4,
};

const title = {
  margin: "8px 0 0",
  fontSize: "clamp(1.9rem, 3vw, 2.6rem)",
  lineHeight: 1.02,
  fontWeight: 1000,
  color: "#ffffff",
};

const subtitle = {
  margin: "10px 0 0",
  fontSize: 14,
  fontWeight: 800,
  color: "#dbeafe",
  lineHeight: 1.55,
  maxWidth: 760,
};

const heroNote = {
  borderRadius: 26,
  padding: 18,
  background: "linear-gradient(180deg, #fff7ed 0%, #ffffff 100%)",
  border: "1px solid rgba(251,146,60,0.28)",
  boxShadow: "0 18px 34px rgba(15,23,42,0.08)",
};

const heroNoteTitle = {
  fontSize: 15,
  fontWeight: 1000,
  color: "#9a3412",
};

const heroNoteText = {
  marginTop: 8,
  fontSize: 13,
  fontWeight: 850,
  color: "#7c2d12",
  lineHeight: 1.5,
};

const fullWidthTool = { gridColumn: "1 / -1" };

const toolsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))",
  gap: 14,
};




