// src/hooks/useChat.js
// Conversación con LubriBot. El historial vive solo en el navegador.
//  - Se envían los últimos mensajes (antes, pasados 40 el servidor rechazaba y el chat quedaba trabado).
//  - Al cambiar de planta se limpia: las respuestas anteriores eran de otra planta.
import { useState, useCallback, useEffect, useRef } from "react";
import { sendChatMessage } from "../services/chatService.js";

const SEND_LAST = 20;

export default function useChat() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const busy = useRef(false);

  useEffect(() => {
    const reset = () => {
      setMessages([]);
      setError(null);
    };
    window.addEventListener("lubriplan:plant-changed", reset);
    return () => window.removeEventListener("lubriplan:plant-changed", reset);
  }, []);

  const sendMessage = useCallback(
    async (text) => {
      const trimmed = String(text || "").trim();
      if (!trimmed || busy.current) return;
      busy.current = true;

      const userMsg = { role: "user", content: trimmed.slice(0, 4000) };
      const outbound = [...messages, userMsg];

      setMessages(outbound);
      setLoading(true);
      setError(null);

      try {
        const data = await sendChatMessage(outbound.slice(-SEND_LAST));
        if (!data?.reply) throw new Error("El asistente no devolvió respuesta");
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      } catch (e) {
        setError(e?.data?.error || e?.message || "Error al contactar el asistente");
      } finally {
        setLoading(false);
        busy.current = false;
      }
    },
    [messages]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, loading, error, sendMessage, clearChat };
}
