import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import AppGate from "./AppGate";   // 👈 este sí lo usamos
import { AuthProvider } from "./context/AuthContext";
import { PlantProvider } from "./context/PlantContext";

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
 