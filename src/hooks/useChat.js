// src/hooks/useChat.js
import { useState, useCallback } from "react";
import { sendChatMessage } from "../services/chatService.js";

export default function useChat() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = useCallback(
    async (text) => {
      const trimmed = String(text || "").trim();
      if (!trimmed || loading) return;

      const userMsg = { role: "user", content: trimmed };
      const outbound = [...messages, userMsg];

      setMessages(outbound);
      setLoading(true);
      setError(null);

      try {
        const data = await sendChatMessage(outbound);

        if (data?.reply) {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: data.reply },
          ]);
        } else {
          throw new Error("El asistente no devolvió respuesta");
        }
      } catch (e) {
        setError(e?.message || "Error al contactar el asistente");
      } finally {
        setLoading(false);
      }
    },
    [messages, loading]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, loading, error, sendMessage, clearChat };
}
