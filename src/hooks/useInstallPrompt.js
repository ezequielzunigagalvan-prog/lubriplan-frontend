import { useCallback, useEffect, useState } from "react";

function detectStandalone() {
  if (typeof window === "undefined") return false;
  const iosStandalone = window.navigator?.standalone === true;
  const displayStandalone = window.matchMedia?.("(display-mode: standalone)")?.matches;
  return Boolean(iosStandalone || displayStandalone);
}

export default function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(detectStandalone);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const media = window.matchMedia ? window.matchMedia("(display-mode: standalone)") : null;

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
      setCanInstall(true);
    };

    const handleInstalled = () => {
      setDeferredPrompt(null);
      setCanInstall(false);
      setIsInstalled(true);
    };

    const syncStandalone = () => {
      setIsInstalled(detectStandalone());
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    media?.addEventListener?.("change", syncStandalone);
    syncStandalone();

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
      media?.removeEventListener?.("change", syncStandalone);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return false;

    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice.catch(() => null);

    if (choice?.outcome === "accepted") {
      setDeferredPrompt(null);
      setCanInstall(false);
      return true;
    }

    return false;
  }, [deferredPrompt]);

  return {
    canInstall: canInstall && !isInstalled,
    isInstalled,
    promptInstall,
  };
}

