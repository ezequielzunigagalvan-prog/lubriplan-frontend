import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import AppGate from "./AppGate";
import { AuthProvider } from "./context/AuthContext";
import { PlantProvider } from "./context/PlantContext";
import { registerPwa } from "./pwa/registerPwa";

registerPwa();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <PlantProvider>
          <AppGate />
        </PlantProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
