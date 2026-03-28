import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { API_URL } from "../services/api";
import { saveAuth, loadAuth, clearAuth, getToken } from "../auth/auth.js";
import { ROLES } from "../constants/roles.js";
import { startSSE, stopSSE } from "../realtime/sseClient";

const AuthContext = createContext(null);

const INACTIVITY_TIMEOUT_MS = 16 * 60 * 60 * 1000;
const WARNING_BEFORE_LOGOUT_MS = 2 * 60 * 1000;

export function AuthProvider({ children }) {
  const boot = loadAuth();

  const [token, setToken] = useState(() => boot?.token || null);
  const [user, setUser] = useState(() => boot?.user || null);
  const [showSessionWarning, setShowSessionWarning] = useState(false);
  const [warningCountdownSec, setWarningCountdownSec] = useState(
    Math.floor(WARNING_BEFORE_LOGOUT_MS / 1000)
  );

  const inactivityTimerRef = useRef(null);
  const warningTimerRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const logoutInProgressRef = useRef(false);

  const role = String(user?.role || "").toUpperCase() || null;

  const isAuthenticated = !!token && !!user;
  const isAdmin = role === ROLES.ADMIN;
  const isSupervisor = role === ROLES.SUPERVISOR;
  const isTechnician = role === ROLES.TECHNICIAN;

  const clearSessionTimers = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  const clearClientSession = useCallback(() => {
    clearAuth();

    try {
      localStorage.removeItem("lubriplan_alerts");
      localStorage.removeItem("lubriplan_alerts_updatedAt");
      localStorage.removeItem("lp_currentPlantId");
      localStorage.removeItem("lp_user");
      sessionStorage.clear();
    } catch {
      // noop
    }
  }, []);

  const hardLogout = useCallback(
    (reason = "manual") => {
      if (logoutInProgressRef.current) return;
      logoutInProgressRef.current = true;

      try {
        stopSSE();
      } catch {
        // noop
      }

      clearSessionTimers();
      setShowSessionWarning(false);
      setWarningCountdownSec(Math.floor(WARNING_BEFORE_LOGOUT_MS / 1000));

      setToken(null);
      setUser(null);

      clearClientSession();
      window.dispatchEvent(new Event("lubriplan:logout"));

      const nextUrl = reason === "inactive" ? "/login?reason=expired" : "/login";
      try {
        window.history.replaceState({}, "", nextUrl);
        window.dispatchEvent(new PopStateEvent("popstate"));
      } catch {
        window.location.replace(nextUrl);
      }
    },
    [clearSessionTimers, clearClientSession]
  );

  const startWarningCountdown = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    setWarningCountdownSec(Math.floor(WARNING_BEFORE_LOGOUT_MS / 1000));

    countdownIntervalRef.current = setInterval(() => {
      setWarningCountdownSec((prev) => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const resetInactivityTimer = useCallback(() => {
    if (!token || !user) return;

    clearSessionTimers();
    setShowSessionWarning(false);
    setWarningCountdownSec(Math.floor(WARNING_BEFORE_LOGOUT_MS / 1000));

    warningTimerRef.current = setTimeout(() => {
      setShowSessionWarning(true);
      startWarningCountdown();
    }, INACTIVITY_TIMEOUT_MS - WARNING_BEFORE_LOGOUT_MS);

    inactivityTimerRef.current = setTimeout(() => {
      hardLogout("inactive");
    }, INACTIVITY_TIMEOUT_MS);
  }, [token, user, clearSessionTimers, startWarningCountdown, hardLogout]);

  const continueSession = useCallback(() => {
    resetInactivityTimer();
  }, [resetInactivityTimer]);

  useEffect(() => {
    if (token && user) {
      saveAuth({ token, user });
      try {
        localStorage.setItem("lp_user", JSON.stringify(user));
      } catch {
        // noop
      }
    } else {
      clearAuth();
      try {
        localStorage.removeItem("lp_user");
      } catch {
        // noop
      }
    }
  }, [token, user]);

  useEffect(() => {
    logoutInProgressRef.current = false;
  }, [token, user]);

  useEffect(() => {
    const plantId = localStorage.getItem("lp_currentPlantId");

    if (!token || !user || !plantId) {
      try {
        stopSSE();
      } catch {
        // noop
      }
      return;
    }

    startSSE({
      onStatus: (s) => console.log("[SSE]", s),
      onEvent: () => {},
      onUnauthorized: () => {
        console.warn("[SSE] unauthorized");
        hardLogout("manual");
      },
    });

    return () => {
      try {
        stopSSE();
      } catch {
        // noop
      }
    };
  }, [token, user, hardLogout]);

  useEffect(() => {
    const onPlantChange = () => {
      if (!getToken()) return;

      const plantId = localStorage.getItem("lp_currentPlantId");
      if (!plantId) {
        try {
          stopSSE();
        } catch {
          // noop
        }
        return;
      }

      console.log("[SSE] restarting for new plant");

      try {
        stopSSE();
      } catch {
        // noop
      }

      startSSE({
        onStatus: (s) => console.log("[SSE]", s),
        onUnauthorized: () => {
          console.warn("[SSE] unauthorized after plant change");
          hardLogout("manual");
        },
      });

      resetInactivityTimer();
    };

    window.addEventListener("lubriplan:plant-changed", onPlantChange);

    return () => {
      window.removeEventListener("lubriplan:plant-changed", onPlantChange);
    };
  }, [resetInactivityTimer, hardLogout]);

  useEffect(() => {
    if (!token || !user) {
      clearSessionTimers();
      setShowSessionWarning(false);
      return;
    }

    const onUserActivity = () => {
      resetInactivityTimer();
    };

    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"];

    events.forEach((evt) =>
      window.addEventListener(evt, onUserActivity, { passive: true })
    );

    resetInactivityTimer();

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, onUserActivity));
      clearSessionTimers();
    };
  }, [token, user, resetInactivityTimer, clearSessionTimers]);

  useEffect(() => {
    if (!token || !user) return;

    const onBackendActivity = () => {
      resetInactivityTimer();
    };

    window.addEventListener("lubriplan:backend-activity", onBackendActivity);

    return () => {
      window.removeEventListener("lubriplan:backend-activity", onBackendActivity);
    };
  }, [token, user, resetInactivityTimer]);

  useEffect(() => {
    const onAuthInvalid = () => {
      hardLogout("manual");
    };

    window.addEventListener("lubriplan:auth-invalid", onAuthInvalid);

    return () => {
      window.removeEventListener("lubriplan:auth-invalid", onAuthInvalid);
    };
  }, [hardLogout]);

  const permissions = useMemo(() => {
    const canManageRoutes = isAdmin || isSupervisor;
    const canManageEquipments = isAdmin || isSupervisor;
    const canAssignTechnician = isAdmin || isSupervisor;

    return {
      canManageRoutes,
      canManageEquipments,
      canAssignTechnician,
      canViewRoutes: true,
    };
  }, [isAdmin, isSupervisor]);

  async function login(email, password) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || "Credenciales inválidas");

    saveAuth({ token: data.token, user: data.user });

    try {
      localStorage.setItem("lp_user", JSON.stringify(data.user));
      if (data?.defaultPlantId) {
        localStorage.setItem("lp_currentPlantId", String(data.defaultPlantId));
      }
    } catch {
      // noop
    }

    setToken(data.token);
    setUser(data.user);

    window.dispatchEvent(new Event("lubriplan:login-success"));

    setTimeout(() => {
      resetInactivityTimer();
    }, 0);

    return data;
  }

  function logout() {
    hardLogout("manual");
  }

  const value = useMemo(
    () => ({
      token,
      user,
      role,
      isAuthenticated,
      isAdmin,
      isSupervisor,
      isTechnician,
      permissions,
      login,
      logout,
      setUser,
      continueSession,
    }),
    [
      token,
      user,
      role,
      isAuthenticated,
      isAdmin,
      isSupervisor,
      isTechnician,
      permissions,
      continueSession,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}

      {showSessionWarning ? (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <div style={warningIconWrap}>⏳</div>

            <div style={modalTitleStyle}>Sesión por expirar</div>

            <div style={modalTextStyle}>
              Tu sesión se cerrará por inactividad.
            </div>

            <div style={countdownStyle}>
              Tiempo restante: <strong>{formatSeconds(warningCountdownSec)}</strong>
            </div>

            <div style={actionsStyle}>
              <button type="button" onClick={continueSession} style={btnPrimaryStyle}>
                Continuar sesión
              </button>

              <button type="button" onClick={() => hardLogout("manual")} style={btnGhostStyle}>
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}

function formatSeconds(total) {
  const sec = Math.max(0, Number(total || 0));
  const mm = String(Math.floor(sec / 60)).padStart(2, "0");
  const ss = String(sec % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(15, 23, 42, 0.52)",
  backdropFilter: "blur(6px)",
  display: "grid",
  placeItems: "center",
  zIndex: 1000,
  padding: 16,
};

const modalStyle = {
  width: "100%",
  maxWidth: 420,
  background: "#ffffff",
  borderRadius: 24,
  border: "1px solid #e2e8f0",
  boxShadow: "0 30px 80px rgba(15, 23, 42, 0.24)",
  padding: 24,
  textAlign: "center",
};

const warningIconWrap = {
  width: 64,
  height: 64,
  borderRadius: 20,
  margin: "0 auto 16px",
  display: "grid",
  placeItems: "center",
  background: "linear-gradient(180deg, #fdba74 0%, #f97316 100%)",
  color: "#111827",
  fontSize: 30,
};

const modalTitleStyle = {
  fontSize: 24,
  fontWeight: 900,
  color: "#0f172a",
};

const modalTextStyle = {
  marginTop: 10,
  fontSize: 14,
  lineHeight: 1.6,
  color: "#475569",
  fontWeight: 700,
};

const countdownStyle = {
  marginTop: 18,
  padding: "12px 14px",
  borderRadius: 14,
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  color: "#0f172a",
  fontSize: 14,
  fontWeight: 800,
};

const actionsStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 12,
  marginTop: 20,
};

const btnPrimaryStyle = {
  height: 46,
  borderRadius: 14,
  border: "1px solid rgba(249,115,22,0.5)",
  background: "linear-gradient(180deg, #fb923c 0%, #f97316 100%)",
  color: "#111827",
  fontWeight: 900,
  cursor: "pointer",
};

const btnGhostStyle = {
  height: 46,
  borderRadius: 14,
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
  fontWeight: 900,
  cursor: "pointer",
};


