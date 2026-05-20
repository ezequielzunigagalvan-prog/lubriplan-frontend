// src/realtime/sseClient.js
import { API_URL } from "../services/api";
import { getToken } from "../auth/auth.js";

let eventSourceRef = null;

function emitGlobal(eventName, payload) {
  try {
    window.dispatchEvent(
      new CustomEvent("lubriplan:sse", {
        detail: { eventName, payload },
      })
    );
  } catch {
    // noop
  }
}

function emitAuthInvalid(reason = "SSE_UNAUTHORIZED") {
  try {
    window.dispatchEvent(
      new CustomEvent("lubriplan:auth-invalid", {
        detail: { reason },
      })
    );
  } catch {
    // noop
  }
}

function getPlantId() {
  return localStorage.getItem("lp_currentPlantId") || "";
}

export function stopSSE() {
  if (eventSourceRef) {
    try {
      eventSourceRef.close();
    } catch {
      // noop
    }
  }
  eventSourceRef = null;
}

export function startSSE({ onStatus, onEvent, onUnauthorized } = {}) {
  const token = getToken();
  const plantId = getPlantId();

  stopSSE();

  if (!token) {
    onStatus?.("no-token");
    return null;
  }

  if (!plantId) {
    onStatus?.("no-plant");
    return null;
  }

  onStatus?.("connecting");

  const stop = openSSE({
    token,
    plantId,
    onEvent: (type, payload) => {
      onEvent?.(type, payload);
      emitGlobal(type, payload);
    },
    onOpen: () => {
      onStatus?.("connected");
    },
    onError: (err) => {
      onStatus?.("error");

      const stillHasToken = !!getToken();
      if (!stillHasToken) {
        stopSSE();
      }
    },
  });

  return stop;
}

/**
 * Abre SSE con EventSource y reconexión exponencial automática.
 * Delays: 2s → 4s → 8s → … → 60s máx.
 */
export function openSSE({
  token,
  plantId,
  onEvent,
  onOpen,
  onError,
} = {}) {
  const safeToken = token || getToken() || "";
  const safePlantId = String(plantId || getPlantId() || "");

  if (!safeToken || !safePlantId) {
    return () => {};
  }

  const base = String(API_URL || "").replace(/\/+$/, "");
  const buildUrl = () => {
    const qs = new URLSearchParams();
    qs.set("token", getToken() || safeToken);
    qs.set("plantId", safePlantId);
    return `${base}/realtime/stream?${qs.toString()}`;
  };

  let closed = false;
  let currentEs = null;
  let retryDelay = 2000;
  const MAX_RETRY_DELAY = 60000;
  let retryTimer = null;

  const safeJson = (raw) => {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  };

  function connect() {
    if (closed) return;

    const es = new EventSource(buildUrl());
    currentEs = es;
    eventSourceRef = es;

    es.onopen = () => {
      retryDelay = 2000; // reset backoff on successful connection
      onOpen?.();
    };

    es.addEventListener("hello", (ev) =>
      onEvent?.("hello", safeJson(ev.data))
    );

    es.addEventListener("ping", (ev) =>
      onEvent?.("ping", safeJson(ev.data ?? "{}"))
    );

    es.addEventListener("notification.created", (ev) =>
      onEvent?.("notification.created", safeJson(ev.data))
    );

    es.addEventListener("execution.critical", (ev) =>
      onEvent?.("execution.critical", safeJson(ev.data))
    );

    es.addEventListener("condition-report.created", (ev) =>
      onEvent?.("condition-report.created", safeJson(ev.data))
    );

    es.addEventListener("condition-report.dismissed", (ev) =>
      onEvent?.("condition-report.dismissed", safeJson(ev.data))
    );

    es.addEventListener("condition-report.corrective-scheduled", (ev) =>
      onEvent?.("condition-report.corrective-scheduled", safeJson(ev.data))
    );

    es.onmessage = (ev) => {
      onEvent?.("message", safeJson(ev.data));
    };

    es.onerror = (e) => {
      onError?.(e);

      if (closed) return;

      // No reintentar si el usuario cerró sesión
      if (!getToken()) return;

      try { es.close(); } catch {}
      if (eventSourceRef === es) eventSourceRef = null;

      retryTimer = setTimeout(() => {
        retryDelay = Math.min(retryDelay * 2, MAX_RETRY_DELAY);
        connect();
      }, retryDelay);
    };
  }

  connect();

  return () => {
    closed = true;
    clearTimeout(retryTimer);
    try { currentEs?.close(); } catch {}
    if (eventSourceRef === currentEs) eventSourceRef = null;
  };
}
