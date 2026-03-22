import { httpPost } from "./http";

// POST /auth/set-password { email, password }
export function setPasswordByEmail(email, password) {
  return httpPost("/auth/set-password", { email, password });
}