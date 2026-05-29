// src/components/ui/ConfirmDialog.jsx
import { useState, useCallback, useRef, createContext, useContext } from "react";

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);
  const resolveRef = useRef(null);

  const confirm = useCallback((message, options = {}) => {
    const {
      title = "¿Confirmar acción?",
      confirmLabel = "Confirmar",
      cancelLabel = "Cancelar",
      danger = false,
    } = options;
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setState({ message, title, confirmLabel, cancelLabel, danger });
    });
  }, []);

  const handleConfirm = () => {
    setState(null);
    resolveRef.current?.(true);
  };

  const handleCancel = () => {
    setState(null);
    resolveRef.current?.(false);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div style={overlay} onClick={handleCancel}>
          <div style={dialog} onClick={(e) => e.stopPropagation()}>
            <div style={dialogTitle}>{state.title}</div>
            <div style={dialogMessage}>{state.message}</div>
            <div style={dialogActions}>
              <button type="button" onClick={handleCancel} style={cancelBtn}>
                {state.cancelLabel}
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                style={state.danger ? dangerBtn : confirmBtn}
              >
                {state.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  return useContext(ConfirmContext);
}

// ── Estilos ──────────────────────────────────────────────────────────────────

const FONT = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(15,23,42,0.45)",
  backdropFilter: "blur(2px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
  padding: 16,
};

const dialog = {
  background: "#fff",
  borderRadius: 16,
  boxShadow: "0 20px 60px rgba(2,6,23,0.18)",
  padding: "24px 24px 20px",
  maxWidth: 400,
  width: "100%",
  fontFamily: FONT,
};

const dialogTitle = {
  fontSize: 16,
  fontWeight: 900,
  color: "#0f172a",
  marginBottom: 10,
};

const dialogMessage = {
  fontSize: 14,
  fontWeight: 600,
  color: "#475569",
  lineHeight: 1.6,
  marginBottom: 20,
};

const dialogActions = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
};

const baseBtn = {
  padding: "9px 18px",
  borderRadius: 10,
  fontFamily: FONT,
  fontSize: 13,
  fontWeight: 800,
  cursor: "pointer",
  border: "none",
};

const cancelBtn = {
  ...baseBtn,
  background: "#f1f5f9",
  color: "#475569",
};

const confirmBtn = {
  ...baseBtn,
  background: "#0f172a",
  color: "#f97316",
};

const dangerBtn = {
  ...baseBtn,
  background: "#dc2626",
  color: "#fff",
};
