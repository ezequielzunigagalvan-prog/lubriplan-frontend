import { API_URL } from "./api"; // o donde tengas API_URL

export default function openSSE({ token, onEvent, onError, signal }) {
  const url = `${API_URL}/realtime/stream`;

  fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "text/event-stream",
    },
    signal,
  })
    .then(async (res) => {
      if (!res.ok) throw new Error(`SSE failed: ${res.status}`);
      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");

      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE separa eventos por doble salto
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";

        for (const chunk of parts) {
          // parse simple: busca "event:" y "data:"
          const lines = chunk.split("\n");
          let eventName = "message";
          let dataStr = "";

          for (const line of lines) {
            if (line.startsWith("event:")) eventName = line.slice(6).trim();
            if (line.startsWith("data:")) dataStr += line.slice(5).trim() + "\n";
          }

          if (!dataStr) continue;
          if (line.startsWith("data:")) dataStr += line.slice(5).trim() + "\n";
          let data;
          try { data = JSON.parse(dataStr); }
          catch { data = dataStr; }

          onEvent?.(eventName, data);
        }
      }
    })
    .catch((e) => {
      if (signal?.aborted) return;
      onError?.(e);
    });
}