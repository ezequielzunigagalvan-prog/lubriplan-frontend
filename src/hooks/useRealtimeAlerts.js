// src/hooks/useRealtimeAlerts.js
import { useEffect, useRef, useState } from "react";
import { startSSE, stopSSE } from "../realtime/sseClient.js";
import { useAuth } from "../context/AuthContext";

export default function useRealtimeAlerts({ enabled = true } = {}) {
  const { token } = useAuth();
  const [connected, setConnected] = useState(false);

  // ✅ evita setState después de un unmount (reintentos SSE / latencias)
  const aliveRef = useRef(true);
  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // si no hay token: asegura parar conexión y marcar disconnected
    if (!token) {
      stopSSE();
      if (aliveRef.current) setConnected(false);
      return;
    }

    // inicia (startSSE ya cierra previa)
    startSSE({
      onStatus: (st) => {
        // st: "connecting" | "connected" | "error" | "no-token"
        if (!aliveRef.current) return;
        setConnected(st === "connected");
      },
      onEvent: (eventName, payload) => {
        // reenvía al resto de la app
        window.dispatchEvent(
          new CustomEvent("lubriplan:sse", {
            detail: { eventName, payload },
          })
        );
      },
    });

    return () => {
      stopSSE();
      if (aliveRef.current) setConnected(false);
    };
  }, [enabled, token]);

  return { connected };
}