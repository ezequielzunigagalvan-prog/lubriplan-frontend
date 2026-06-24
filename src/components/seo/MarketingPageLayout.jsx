import React from "react";
import { Link } from "react-router-dom";

const FONT = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const DEMO_URL = "https://www.hidrolub.com/lubriplan";

export default function MarketingPageLayout({
  eyebrow,
  title,
  intro,
  highlights = [],
  sections = [],
  gallery = [],
  ctaTitle = "Solicita una demo de LubriPlan",
  ctaText = "Conoce como ordenar rutas, actividades, alertas, inventario y lectura ejecutiva en una sola plataforma.",
}) {
  return (
    <div style={page}>
      <header style={topbar}>
        <Link to="/" style={brand}>LubriPlan</Link>
        <div style={navRow}>
          <Link to="/que-es-lubriplan" style={navLink}>Que es</Link>
          <Link to="/contacto" style={navLink}>Contacto</Link>
          <a href={DEMO_URL} target="_blank" rel="noreferrer" style={navButton}>Solicitar demo</a>
        </div>
      </header>
      <main style={shell}>
        <section style={hero}>
          <div style={heroCopy}>
            <div style={eyebrowStyle}>{eyebrow}</div>
            <h1 style={titleStyle}>{title}</h1>
            <p style={introStyle}>{intro}</p>
            <div style={highlightGrid}>
              {highlights.map((item) => (
                <div key={item} style={highlightCard}>{item}</div>
              ))}
            </div>
          </div>
        </section>
        {gallery.length ? (
          <section style={gallerySection}>
            <div style={sectionLabel}>Capturas reales</div>
            <div style={galleryGrid}>
              {gallery.map((item) => (
                <figure key={item.alt} style={galleryCard}>
                  <img src={item.image} alt={item.alt} style={galleryImage} />
                  <figcaption style={galleryCaption}>{item.caption}</figcaption>
                </figure>
              ))}
            </div>
          </section>
        ) : null}
        <section style={sectionWrap}>
          <div style={sectionLabel}>Contenido tecnico</div>
          <div style={sectionGrid}>
            {sections.map((section) => (
              <article key={section.title} style={sectionCard}>
                <h2 style={sectionTitle}>{section.title}</h2>
                <p style={sectionText}>{section.text}</p>
              </article>
            ))}
          </div>
        </section>
        <section style={ctaBox}>
          <div style={sectionLabel}>Siguiente paso</div>
          <h2 style={ctaTitleStyle}>{ctaTitle}</h2>
          <p style={ctaTextStyle}>{ctaText}</p>
          <div style={ctaRow}>
            <a href={DEMO_URL} target="_blank" rel="noreferrer" style={ctaPrimary}>Solicitar demo</a>
            <Link to="/contacto" style={ctaGhost}>Hablar con LubriPlan</Link>
          </div>
        </section>
      </main>
    </div>
  );
}

const page = { minHeight: "100vh", background: "linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)", color: "#0f172a", fontFamily: FONT };
const topbar = { maxWidth: 1280, margin: "0 auto", padding: "22px 24px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" };
const brand = { color: "#0f172a", textDecoration: "none", fontSize: 30, fontWeight: 1000 };
const navRow = { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" };
const navLink = { color: "#334155", textDecoration: "none", fontWeight: 800, fontSize: 14 };
const navButton = { textDecoration: "none", background: "#0f172a", color: "#fff", padding: "12px 18px", borderRadius: 14, fontWeight: 900, fontSize: 14 };
const shell = { maxWidth: 1280, margin: "0 auto", padding: "16px 24px 72px", display: "grid", gap: 24 };
const hero = { borderRadius: 28, padding: "34px 30px", background: "linear-gradient(135deg, #0f172a 0%, #172554 55%, #1d4ed8 100%)", boxShadow: "0 30px 70px rgba(15,23,42,0.18)" };
const heroCopy = { maxWidth: 900 };
const eyebrowStyle = { fontSize: 11, fontWeight: 950, letterSpacing: "0.14em", textTransform: "uppercase", color: "#93c5fd" };
const titleStyle = { margin: "10px 0 0", fontSize: "clamp(2rem, 4vw, 3.4rem)", lineHeight: 1.02, fontWeight: 1000, color: "#fff" };
const introStyle = { margin: "14px 0 0", maxWidth: 860, fontSize: 16, lineHeight: 1.7, fontWeight: 700, color: "#dbeafe" };
const highlightGrid = { marginTop: 22, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 };
const highlightCard = { padding: "14px 16px", borderRadius: 16, background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.12)", color: "#eff6ff", fontWeight: 800, lineHeight: 1.5 };
const gallerySection = { display: "grid", gap: 14 };
const sectionLabel = { fontSize: 11, fontWeight: 950, letterSpacing: "0.14em", textTransform: "uppercase", color: "#f97316" };
const galleryGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 };
const galleryCard = { margin: 0, padding: 14, borderRadius: 22, background: "#fff", border: "1px solid rgba(226,232,240,0.95)", boxShadow: "0 14px 30px rgba(15,23,42,0.06)" };
const galleryImage = { width: "100%", display: "block", borderRadius: 16 };
const galleryCaption = { marginTop: 10, color: "#475569", fontSize: 13, fontWeight: 800, lineHeight: 1.5 };
const sectionWrap = { display: "grid", gap: 14 };
const sectionGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 };
const sectionCard = { padding: 20, borderRadius: 22, background: "#fff", border: "1px solid rgba(226,232,240,0.95)", boxShadow: "0 14px 30px rgba(15,23,42,0.06)" };
const sectionTitle = { margin: 0, fontSize: 20, lineHeight: 1.15, fontWeight: 1000, color: "#0f172a" };
const sectionText = { marginTop: 10, color: "#475569", fontSize: 14, lineHeight: 1.7, fontWeight: 700 };
const ctaBox = { padding: 28, borderRadius: 24, background: "linear-gradient(135deg, #fff7ed 0%, #ffffff 100%)", border: "1px solid rgba(251,146,60,0.30)", boxShadow: "0 18px 36px rgba(15,23,42,0.08)" };
const ctaTitleStyle = { margin: "8px 0 0", fontSize: 28, lineHeight: 1.05, fontWeight: 1000, color: "#9a3412" };
const ctaTextStyle = { marginTop: 12, maxWidth: 760, color: "#7c2d12", fontSize: 15, lineHeight: 1.65, fontWeight: 700 };
const ctaRow = { marginTop: 18, display: "flex", gap: 12, flexWrap: "wrap" };
const ctaPrimary = { textDecoration: "none", background: "#f97316", color: "#fff", padding: "14px 18px", borderRadius: 14, fontWeight: 900 };
const ctaGhost = { textDecoration: "none", background: "#fff", color: "#9a3412", padding: "14px 18px", borderRadius: 14, border: "1px solid rgba(251,146,60,0.28)", fontWeight: 900 };
