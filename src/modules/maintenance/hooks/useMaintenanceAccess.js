import { useState, useEffect } from "react";
import { maintenanceApi } from "../services/maintenanceApi";

/**
 * Caché compartida del acceso a Maintenance por planta.
 * La consultan la protección de rutas y el layout; sin caché cada uno pedía /me/access
 * y, al remontarse, la protección mostraba su loader y desmontaba la página (que volvía a pedir sus datos).
 */
let cache = { key: null, result: null, promise: null };

const currentKey = () => localStorage.getItem("lp_currentPlantId") || "";

function fetchAccess(key) {
  if (cache.key === key && (cache.result || cache.promise)) return cache.promise || Promise.resolve(cache.result);

  const promise = maintenanceApi
    .getAccess()
    .then((response) => ({ hasAccess: response?.enabled === true, error: null }))
    .catch((err) => {
      // 403 / módulo no habilitado = sin acceso; cualquier otro error también bloquea pero se reporta
      const denied = err?.status === 403 || err?.data?.code === "MAINTENANCE_NOT_ENABLED";
      return { hasAccess: false, error: denied ? null : err?.message || "Error checking access" };
    })
    .then((result) => {
      if (cache.key === key) {
        // Los errores de red no se guardan: el próximo montaje vuelve a intentar
        cache = result.error ? { key: null, result: null, promise: null } : { key, result, promise: null };
      }
      return result;
    });

  cache = { key, result: null, promise };
  return promise;
}

/** Invalida la caché (cambio de sesión). */
export function resetMaintenanceAccessCache() {
  cache = { key: null, result: null, promise: null };
}

if (typeof window !== "undefined") {
  window.addEventListener("lubriplan:logout", resetMaintenanceAccessCache);
  window.addEventListener("lubriplan:login-success", resetMaintenanceAccessCache);
}

export function useMaintenanceAccess() {
  const key = currentKey();
  const cached = cache.key === key ? cache.result : null;

  const [state, setState] = useState(() => ({
    hasAccess: cached ? cached.hasAccess : null,
    loading: !cached,
    error: cached ? cached.error : null,
  }));

  useEffect(() => {
    let active = true;
    fetchAccess(key).then((result) => {
      if (active) setState({ hasAccess: result.hasAccess, loading: false, error: result.error });
    });
    return () => {
      active = false;
    };
  }, [key]);

  return state;
}
