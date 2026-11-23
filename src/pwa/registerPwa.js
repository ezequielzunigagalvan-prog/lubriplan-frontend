import { registerSW } from "virtual:pwa-register";

let registered = false;

// Cada cuánto se revisa si hay una versión nueva publicada.
const UPDATE_EVERY_MS = 15 * 60 * 1000;

export function registerPwa() {
  if (registered || typeof window === "undefined") return;

  registered = true;

  registerSW({
    immediate: true,
    onRegistered(registration) {
      window.__lubriplanSW = registration || null;
      if (!registration) return;

      // Antes solo se buscaba versión nueva al abrir la app: con la pestaña abierta
      // (o la app del celular en segundo plano) se seguía viendo la versión anterior.
      const check = () => {
        if (navigator.onLine === false) return;
        registration.update().catch(() => {});
      };
      setInterval(check, UPDATE_EVERY_MS);
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") check();
      });
      window.addEventListener("online", check);
    },
    onRegisterError(error) {
      console.error("No se pudo registrar la PWA de LubriPlan.", error);
    },
  });
}
