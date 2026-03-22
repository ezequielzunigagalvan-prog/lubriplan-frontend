// src/services/api.js
import { getToken, clearAuth } from "../auth/auth.js";

export const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3001/api"
).replace(/\/$/, "");

function emitAuthInvalid(reason = "HTTP_401") {
  try {
    window.dispatchEvent(
      new CustomEvent("lubriplan:auth-invalid", {
        detail: { reason },
      })
    );
  } catch {
    // noop
  }
}

export async function apiFetch(path, options = {}) {
  const token = getToken();
  const plantId = localStorage.getItem("lp_currentPlantId");

  const headers = {
    ...(options.headers || {}),
  };

  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  if (!isFormData && !headers["Content-Type"] && !headers["content-type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (token) headers.Authorization = `Bearer ${token}`;
  if (plantId) headers["x-plant-id"] = plantId;

  const cleanPath = String(path || "").startsWith("/") ? path : `/${path}`;

  let res;
  try {
    res = await fetch(`${API_URL}${cleanPath}`, {
      ...options,
      headers,
    });
  } catch (e) {
    throw new Error("No se pudo conectar con el servidor");
  }

  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await res.json().catch(() => ({}))
    : await res.text().catch(() => "");

  // ✅ sesión inválida / expirada
  if (res.status === 401) {
    try {
      clearAuth();
      localStorage.removeItem("lp_currentPlantId");
    } catch {
      // noop
    }

    emitAuthInvalid("HTTP_401");
    throw new Error(
      data && typeof data === "object" && data.error
        ? data.error
        : "Sesión expirada"
    );
  }

  if (res.status === 403) {
    throw new Error(
      data && typeof data === "object" && data.error
        ? data.error
        : "Sin permisos"
    );
  }

  if (!res.ok) {
    const msg =
      data && typeof data === "object" && data.error
        ? data.error
        : `HTTP_${res.status}`;
    throw new Error(msg);
  }

  // ✅ request exitosa = actividad real del backend
  try {
    window.dispatchEvent(new Event("lubriplan:backend-activity"));
  } catch {
    // noop
  }

  return data;
}