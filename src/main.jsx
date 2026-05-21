import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import AppGate from "./AppGate";
import { AuthProvider } from "./context/AuthContext";
import { PlantProvider } from "./context/PlantContext";
import { ThemeProvider } from "./context/ThemeContext";
import { registerPwa } from "./pwa/registerPwa";

registerPwa();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <PlantProvider>
            <AppGate />
          </PlantProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
