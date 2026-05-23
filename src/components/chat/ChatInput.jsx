// src/components/chat/ChatInput.jsx
import { useRef, useState } from "react";

export default function ChatInput({ onSend, loading, disabled }) {
  const [value, setValue] = useState("");
  const textareaRef = useRef(null);

  const canSend = value.trim().length > 0 && !loading && !disabled;

  const submit = () => {
    if (!canSend) return;
    onSend(value.trim());
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const onInput = (e) => {
    setValue(e.target.value);
    // Auto-resize
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
    }
  };

  return (
    <div style={wrap}>
      <textarea
        ref={textareaRef}
        value={value}
        onInput={onInput}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Escribe tu pregunta… (Enter para enviar)"
        disabled={loading || disabled}
        rows={1}
        style={{
          ...textarea,
          opacity: loading || disabled ? 0.55 : 1,
        }}
      />
      <button
        type="button"
        onClick={submit}
        disabled={!canSend}
        title="Enviar (Enter)"
        style={{
          ...sendBtn,
          opacity: canSend ? 1 : 0.4,
          cursor: canSend ? "pointer" : "default",
        }}
      >
        {loading ? (
          <span style={spinner} />
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        )}
      </button>

      <style>{`
        @keyframes lpChatSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

const wrap = {
  display: "flex",
  alignItems: "flex-end",
  gap: 8,
  padding: "10px 12px",
  borderTop: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(248,250,252,0.95)",
};

const textarea = {
  flex: 1,
  resize: "none",
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 12,
  padding: "9px 12px",
  fontSize: 13,
  fontWeight: 800,
  color: "#0f172a",
  background: "#ffffff",
  outline: "none",
  lineHeight: 1.5,
  fontFamily: "inherit",
  boxShadow: "0 2px 6px rgba(2,6,23,0.04)",
  minHeight: 38,
  maxHeight: 120,
  overflowY: "auto",
  transition: "border-color 140ms ease, box-shadow 140ms ease",
};

const sendBtn = {
  width: 38,
  height: 38,
  flexShrink: 0,
  border: "none",
  borderRadius: 12,
  background: "linear-gradient(135deg, #f97316 0%, #fb923c 100%)",
  color: "#fff",
  display: "grid",
  placeItems: "center",
  boxShadow: "0 4px 12px rgba(249,115,22,0.30)",
  transition: "opacity 140ms ease, box-shadow 140ms ease",
};

const spinner = {
  display: "inline-block",
  width: 16,
  height: 16,
  border: "2.5px solid rgba(255,255,255,0.40)",
  borderTopColor: "#fff",
  borderRadius: "50%",
  animation: "lpChatSpin 0.7s linear infinite",
};
