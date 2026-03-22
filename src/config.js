// src/config.js
const RAW_API_URL = String(import.meta.env.VITE_API_URL || "http://localhost:3001/api").trim();

export const API_URL = RAW_API_URL.replace(/\/+$/, "");
export const API_BASE_URL = API_URL.replace(/\/api\/?$/i, "");
export const API_ASSETS_URL = String(import.meta.env.VITE_ASSETS_BASE_URL || API_BASE_URL).replace(/\/+$/, "");
