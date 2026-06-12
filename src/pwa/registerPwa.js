import { registerSW } from "virtual:pwa-register";

let registered = false;

export function registerPwa() {
  if (registered || typeof window === "undefined") return;

  registered = true;

  // Limpiar SWs viejos que puedan estar sirviendo chunks antiguos
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister();
      });
    });
  }

  // Limpiar caches viejos
  if ("caches" in window) {
    caches.keys().then((cacheNames) => {
      cacheNames.forEach((cacheName) => {
        caches.delete(cacheName);
      });
    });
  }

  // Registrar nuevo SW
  registerSW({
    immediate: true,
    onRegistered(registration) {
      window.__lubriplanSW = registration || null;
    },
    onRegisterError(error) {
      console.error("No se pudo registrar la PWA de LubriPlan.", error);
    },
  });
}
