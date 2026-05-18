import { useEffect, useState } from "react";

const typeMap = {
  success: {
    border: "rgba(34,197,94,0.35)",
    bg: "rgba(34,197,94,0.08)",
    dot: "#22c55e",
    iconColor: "#166534",
    icon: "✓",
  },
  error: {
    border: "rgba(239,68,68,0.35)",
    bg: "rgba(239,68,68,0.08)",
    dot: "#ef4444",
    iconColor: "#991b1b",
    icon: "✕",
  },
  info: {
    border: "rgba(59,130,246,0.35)",
    bg: "rgba(59,130,246,0.08)",
    dot: "#3b82f6",
    iconColor: "#1d4ed8",
    icon: "i",
  },
  warn: {
    border: "rgba(245,158,11,0.35)",
    bg: "rgba(245,158,11,0.10)",
    dot: "#f59e0b",
    iconColor: "#92400e",
    icon: "!",
  },
};

export default function Toast({ toast, onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => {
      cancelAnimationFrame(raf);
      setVisible(false);
    };
  }, [toast]);

  if (!toast) return null;

  const t = typeMap[toast.type] || typeMap.success;

  return (
    <div style={wrap}>
      <div
        role="status"
        aria-live="polite"
        style={{
          ...card,
          borderColor: t.border,
          background: t.bg,
          transform: visible ? "translateY(0) scale(1)" : "translateY(-12px) scale(0.96)",
          opacity: visible ? 1 : 0,
        }}
      >
        <div style={{ ...iconCircle, background: t.dot, color: "#fff" }}>
          {t.icon}
        </div>

        <div style={{ minWidth: 0, flex: 1 }}>
          {toast.title   && <div style={titleStyle}>{toast.title}</div>}
          {toast.message && <div style={msgStyle}>{toast.message}</div>}
        </div>

        <button
          type="button"
          onClick={() => {
            setVisible(false);
            setTimeout(() => onClose?.(), 160);
          }}
          style={xBtn}
          aria-label="Cerrar notificación"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

const wrap = {
  position: "fixed",
  top: 16,
  right: 16,
  zIndex: 9999,
  width: "min(400px, calc(100vw - 32px))",
  pointerEvents: "none",
};

const card = {
  pointerEvents: "auto",
  display: "flex",
  alignItems: "flex-start",
  gap: 12,
  padding: "13px 13px",
  borderRadius: 16,
  border: "1px solid",
  background: "#fff",
  boxShadow: "0 20px 48px rgba(2,6,23,0.16), 0 4px 8px rgba(2,6,23,0.06)",
  backdropFilter: "blur(12px)",
  transition: "transform 200ms cubic-bezier(0.34,1.56,0.64,1), opacity 180ms ease",
};

const iconCircle = {
  width: 28,
  height: 28,
  borderRadius: "50%",
  display: "grid",
  placeItems: "center",
  fontSize: 13,
  fontWeight: 900,
  flexShrink: 0,
  marginTop: 1,
};

const titleStyle = {
  fontWeight: 900,
  color: "#0f172a",
  fontSize: 13,
  lineHeight: 1.4,
};

const msgStyle = {
  marginTop: 3,
  fontWeight: 700,
  color: "#475569",
  fontSize: 12,
  lineHeight: 1.5,
};

const xBtn = {
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(248,250,252,0.90)",
  borderRadius: 10,
  width: 28,
  height: 28,
  cursor: "pointer",
  fontWeight: 900,
  fontSize: 12,
  color: "#64748b",
  flexShrink: 0,
  display: "grid",
  placeItems: "center",
  transition: "background 140ms ease, color 140ms ease",
};
