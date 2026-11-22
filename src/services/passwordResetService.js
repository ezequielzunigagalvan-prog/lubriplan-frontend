// Recuperación de contraseña (endpoints públicos, sin sesión).
import { API_URL } from "../config.js";

async function post(path, body) {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `Error ${res.status}`);
  return data;
}

export const requestPasswordReset = (email) => post("/auth/forgot-password", { email });
export const checkResetToken = (token) => post("/auth/reset-password/check", { token });
export const resetPassword = (token, password) => post("/auth/reset-password", { token, password });
