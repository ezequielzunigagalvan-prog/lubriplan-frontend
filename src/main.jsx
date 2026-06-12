// Limpiar Service Workers viejos INMEDIATAMENTE al cargar
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => registration.unregister());
  });
}

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";

import AppGate from "./AppGate";
import { AuthProvider } from "./context/AuthContext";
import { PlantProvider } from "./context/PlantContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ConfirmProvider } from "./components/ui/ConfirmDialog";
import ErrorBoundary from "./components/ErrorBoundary";
import { registerPwa } from "./pwa/registerPwa";
import { initSentry } from "./config/sentry";

initSentry();
registerPwa();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <PlantProvider>
              <ConfirmProvider>
                <AppGate />
                <Toaster
                  position="bottom-right"
                  richColors
                  toastOptions={{ style: { fontFamily: 'system-ui, -apple-system, sans-serif', fontWeight: 700, fontSize: 13 } }}
                />
              </ConfirmProvider>
            </PlantProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
