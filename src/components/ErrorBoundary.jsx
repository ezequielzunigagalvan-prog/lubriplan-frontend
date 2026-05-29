import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        padding: 32,
        background: "#f8fafc",
        fontFamily: "system-ui, -apple-system, sans-serif",
        textAlign: "center",
      }}>
        <div style={{ width: 56, height: 56, borderRadius: 18, background: "rgba(239,68,68,0.1)", display: "grid", placeItems: "center" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <div style={{ fontWeight: 900, fontSize: 18, color: "#0f172a" }}>Algo salió mal</div>
        <div style={{ fontWeight: 600, fontSize: 13, color: "#64748b", maxWidth: 340, lineHeight: 1.5 }}>
          Ocurrió un error inesperado en esta sección. Puedes recargar la página para continuar.
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{ marginTop: 8, padding: "11px 28px", borderRadius: 12, border: "none", background: "#0f172a", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
        >
          Recargar
        </button>
      </div>
    );
  }
}
