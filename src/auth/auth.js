// src/auth/auth.js
const STORAGE_KEY = "lubriplan_auth_v1";

export function saveAuth(payload) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function loadAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearAuth() {
  localStorage.removeItem(STORAGE_KEY);
}

export function getToken() {
  const data = loadAuth();
  return (
    data?.token ||
    data?.accessToken ||
    data?.jwt ||
    data?.authToken ||
    data?.data?.token ||
    null
  );
}

/* =========================
   Helpers extra (no rompen)
========================= */
export function getAuth() {
  return loadAuth();
}

export function getUser() {
  const data = loadAuth();
  return data?.user || null;
}

export function getRole() {
  const role = String(getUser()?.role || "").toUpperCase();
  return role || null;
}

export function isLoggedIn() {
  return Boolean(getToken());
}