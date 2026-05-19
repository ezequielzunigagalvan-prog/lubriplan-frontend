import MainLayout from "../layouts/MainLayout";
import { Icon } from "../components/ui/lpIcons";
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
          .technicalHero { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={shell}>
        {/* ── Hero ── */}
        <div className="technicalHero" style={hero}>
          <div style={heroCopy}>
            {/* decorative rings */}
            <div style={{ position: "absolute", right: -60, top: -60, width: 220, height: 220, borderRadius: 999, border: "1px solid rgba(249,115,22,0.14)", opacity: 0.6, pointerEvents: "none" }} />
            <div style={{ position: "absolute", right: -20, top: -20, width: 130, height: 130, borderRadius: 999, border: "1px solid rgba(249,115,22,0.22)", opacity: 0.8, pointerEvents: "none" }} />
            <div style={{ position: "absolute", right: 26, top: 26, width: 10, height: 10, borderRadius: 999, background: "#f97316", boxShadow: "0 0 0 8px rgba(249,115,22,0.10)", opacity: 0.9, pointerEvents: "none" }} />

            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={heroIconRow}>
                <div style={heroIconBox}>
                  <Icon name="tool" size="xl" />
                </div>
                <div style={kicker}>LUBRIPLAN · HERRAMIENTAS TÉCNICAS</div>
              </div>
              <h1 style={heroTitle}>Asistente técnico<br />de lubricación</h1>
              <p style={heroSubtitle}>
                Herramientas de apoyo para tomar decisiones más rápidas en compatibilidad,
                reengrase, conversión técnica y selección inicial de viscosidad.
              </p>

              <div style={pillsRow}>
                {["Compatibilidad", "Reengrase", "Conversor", "Viscosidad", "Frecuencia"].map((t) => (
                  <span key={t} style={heroPill}>{t}</span>
                ))}
              </div>
            </div>
          </div>

          <div style={heroNote}>
            <div style={heroNoteHeader}>
              <div style={heroNoteIconBox}>
                <Icon name="warn" size="md" />
              </div>
              <div style={heroNoteTitle}>Uso recomendado</div>
            </div>
            <div style={heroNoteText}>
              Estas herramientas entregan una referencia técnica inicial. Para activos
              críticos, valida siempre con OEM, fichas técnicas y condiciones reales de
              operación.
            </div>
            <div style={heroNoteItems}>
              {[
                { icon: "checkCircle", text: "Referencia rápida en campo" },
                { icon: "checkCircle", text: "Sin reemplazar ficha del fabricante" },
                { icon: "checkCircle", text: "Ajustar con historial real" },
              ].map(({ icon, text }) => (
                <div key={text} style={heroNoteItem}>
                  <span style={{ color: "#d97706" }}><Icon name={icon} size="sm" /></span>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Tools Grid ── */}
        <div className="lp-stagger" style={toolsGrid}>
          <div className="lp-enter"><GreaseCompatibilityTool /></div>
          <div className="lp-enter"><BearingRegreaseTool /></div>
          <div className="lp-enter"><TechnicalConverterTool /></div>
          <div className="lp-enter"><GearboxViscosityTool /></div>
          <div className="lp-enter" style={fullWidthTool}><LubricationFrequencyTool /></div>
        </div>
      </div>
    </MainLayout>
  );
}

const shell = { display: "grid", gap: 18 };

const hero = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.5fr) minmax(260px, 0.9fr)",
  gap: 14,
  alignItems: "stretch",
};

const heroCopy = {
  position: "relative",
  overflow: "hidden",
  borderRadius: 26,
  padding: "26px 24px 24px",
  background: "radial-gradient(circle at 90% 10%, rgba(249,115,22,0.18), transparent 28%), linear-gradient(140deg, #0f172a 0%, #172554 55%, #1e3a8a 100%)",
  boxShadow: "0 22px 48px rgba(15,23,42,0.22)",
};

const heroIconRow = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  marginBottom: 14,
};

const heroIconBox = {
  width: 42,
  height: 42,
  borderRadius: 14,
  display: "grid",
  placeItems: "center",
  background: "rgba(249,115,22,0.14)",
  border: "1px solid rgba(249,115,22,0.24)",
  color: "#fb923c",
  flexShrink: 0,
};

const kicker = {
  fontSize: 10,
  fontWeight: 950,
  color: "#93c5fd",
  letterSpacing: 1.6,
  textTransform: "uppercase",
};

const heroTitle = {
  margin: "0 0 10px",
  fontSize: "clamp(1.7rem, 3vw, 2.4rem)",
  lineHeight: 1.06,
  fontWeight: 900,
  color: "#ffffff",
  letterSpacing: "-0.03em",
};

const heroSubtitle = {
  margin: "0 0 16px",
  fontSize: 14,
  fontWeight: 800,
  color: "#bfdbfe",
  lineHeight: 1.55,
  maxWidth: 540,
};

const pillsRow = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
};

const heroPill = {
  display: "inline-flex",
  alignItems: "center",
  padding: "5px 12px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 900,
  background: "rgba(255,255,255,0.10)",
  border: "1px solid rgba(255,255,255,0.16)",
  color: "#e0e7ff",
  letterSpacing: 0.3,
};

const heroNote = {
  borderRadius: 26,
  padding: "20px 18px 18px",
  background: "linear-gradient(160deg, #fffbeb 0%, #ffffff 100%)",
  border: "1px solid rgba(251,146,60,0.28)",
  borderTop: "4px solid #f59e0b",
  boxShadow: "0 18px 34px rgba(15,23,42,0.08)",
  display: "grid",
  gap: 14,
  alignContent: "start",
};

const heroNoteHeader = {
  display: "flex",
  gap: 10,
  alignItems: "center",
};

const heroNoteIconBox = {
  width: 36,
  height: 36,
  borderRadius: 11,
  display: "grid",
  placeItems: "center",
  background: "rgba(245,158,11,0.14)",
  border: "1px solid rgba(245,158,11,0.28)",
  color: "#d97706",
  flexShrink: 0,
};

const heroNoteTitle = {
  fontSize: 15,
  fontWeight: 900,
  color: "#9a3412",
};

const heroNoteText = {
  fontSize: 13,
  fontWeight: 850,
  color: "#78350f",
  lineHeight: 1.55,
};

const heroNoteItems = {
  display: "grid",
  gap: 8,
};

const heroNoteItem = {
  display: "flex",
  gap: 8,
  alignItems: "center",
  fontSize: 12,
  fontWeight: 850,
  color: "#92400e",
};

const fullWidthTool = { gridColumn: "1 / -1" };

const toolsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 400px), 1fr))",
  gap: 14,
};
