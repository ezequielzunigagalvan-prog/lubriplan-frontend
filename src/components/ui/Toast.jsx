import { useEffect, useState } from "react";

export default function Toast({ toast, onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!toast) return;
    setVisible(true);
    return () => setVisible(false);
  }, [toast]);

  if (!toast) return null;

  const stylesByType = {
    success: { border: "rgba(34,197,94,0.35)", bg: "rgba(34,197,94,0.10)", dot: "#22c55e" },
    error: { border: "rgba(239,68,68,0.35)", bg: "rgba(239,68,68,0.10)", dot: "#ef4444" },
    info: { border: "rgba(59,130,246,0.35)", bg: "rgba(59,130,246,0.10)", dot: "#3b82f6" },
    warn: { border: "rgba(245,158,11,0.35)", bg: "rgba(245,158,11,0.12)", dot: "#f59e0b" },
  };

  const t = stylesByType[toast.type] || stylesByType.success;

  return (
    <div style={wrap}>
      <div
        role="status"
        style={{
          ...card,
          borderColor: t.border,
          background: t.bg,
          transform: visible ? "translateY(0)" : "translateY(-10px)",
          opacity: visible ? 1 : 0,
        }}
      >
        <div style={{ ...dot, background: t.dot }} />
        <div style={{ minWidth: 0, flex: 1 }}>
          {toast.title ? <div style={title}>{toast.title}</div> : null}
          {toast.message ? <div style={msg}>{toast.message}</div> : null}
        </div>

        <button
          type="button"
          onClick={() => {
            setVisible(false);
            setTimeout(() => onClose?.(), 140);
          }}
          style={xBtn}
          aria-label="Cerrar"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

const wrap = {
  position: "fixed",
  top: 14,
  right: 14,
  zIndex: 9999,
  width: "min(420px, calc(100vw - 28px))",
};

const card = {
  display: "flex",
  alignItems: "flex-start",
  gap: 10,
  padding: "12px 12px",
  borderRadius: 14,
  border: "1px solid rgba(226,232,240,0.95)",
  boxShadow: "0 18px 40px rgba(2,6,23,0.18)",
  backdropFilter: "blur(10px)",
  transition: "transform 160ms ease, opacity 160ms ease",
};

const dot = {
  width: 10,
  height: 10,
  borderRadius: 999,
  marginTop: 5,
  flexShrink: 0,
};

const title = { fontWeight: 1000, color: "#0f172a", fontSize: 13 };
const msg = { marginTop: 2, fontWeight: 800, color: "#334155", fontSize: 12 };

const xBtn = {
  border: "1px solid rgba(226,232,240,1)",
  background: "rgba(255,255,255,0.75)",
  borderRadius: 12,
  padding: "6px 9px",
  cursor: "pointer",
  fontWeight: 950,
  color: "#0f172a",
};