import { registerSW } from "virtual:pwa-register";

let registered = false;

export function registerPwa() {
  if (registered || typeof window === "undefined") return;

  registered = true;

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
