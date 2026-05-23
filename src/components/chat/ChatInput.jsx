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
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
    }
  };

  return (
    <div style={wrap}>
      <div style={innerWrap}>
        <textarea
          ref={textareaRef}
          value={value}
          onInput={onInput}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={loading ? "LubriBot está respondiendo…" : "Pregunta sobre la planta… (Enter para enviar)"}
          disabled={loading || disabled}
          rows={1}
          style={{
            ...textarea,
            opacity: loading || disabled ? 0.6 : 1,
          }}
        />
        <button
          type="button"
          onClick={submit}
          disabled={!canSend}
          title="Enviar (Enter)"
          style={{
            ...sendBtn,
            opacity: canSend ? 1 : 0.35,
            cursor: canSend ? "pointer" : "default",
            transform: canSend ? "scale(1)" : "scale(0.92)",
          }}
        >
          {loading ? (
            <span style={spinner} />
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          )}
        </button>
      </div>

      <div style={hint}>
        Enter para enviar · Shift+Enter para nueva línea
      </div>

      <style>{`
        @keyframes lpChatSpin {
          to { transform: rotate(360deg); }
        }
        .lpChatTextarea:focus {
          outline: none;
          border-color: rgba(249,115,22,0.50) !important;
          box-shadow: 0 0 0 3px rgba(249,115,22,0.12) !important;
        }
      `}</style>
    </div>
  );
}

const wrap = {
  padding: "10px 12px 8px",
  borderTop: "1px solid rgba(226,232,240,0.95)",
  background: "linear-gradient(180deg, rgba(248,250,252,0.80) 0%, #ffffff 100%)",
  flexShrink: 0,
};

const innerWrap = {
  display: "flex",
  alignItems: "flex-end",
  gap: 8,
};

const textarea = {
  flex: 1,
  resize: "none",
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 14,
  padding: "9px 12px",
  fontSize: 13,
  fontWeight: 800,
  color: "#0f172a",
  background: "#ffffff",
  lineHeight: 1.5,
  fontFamily: "inherit",
  boxShadow: "0 2px 8px rgba(2,6,23,0.04)",
  minHeight: 40,
  maxHeight: 120,
  overflowY: "auto",
  transition: "border-color 140ms ease, box-shadow 140ms ease",
};

const sendBtn = {
  width: 40,
  height: 40,
  flexShrink: 0,
  border: "none",
  borderRadius: 14,
  background: "linear-gradient(135deg, #f97316 0%, #fb923c 100%)",
  color: "#fff",
  display: "grid",
  placeItems: "center",
  boxShadow: "0 4px 14px rgba(249,115,22,0.32)",
  transition: "opacity 140ms ease, transform 140ms ease, box-shadow 140ms ease",
};

const spinner = {
  display: "inline-block",
  width: 15,
  height: 15,
  border: "2.5px solid rgba(255,255,255,0.35)",
  borderTopColor: "#fff",
  borderRadius: "50%",
  animation: "lpChatSpin 0.7s linear infinite",
};

const hint = {
  marginTop: 5,
  fontSize: 10,
  fontWeight: 800,
  color: "#94a3b8",
  letterSpacing: 0.1,
  textAlign: "center",
};
