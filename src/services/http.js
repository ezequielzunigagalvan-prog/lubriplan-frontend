// src/services/http.js
import { API_URL } from "./api";
import { getToken } from "../auth/auth";

const DEFAULT_TIMEOUT = 60000;

async function safeJson(res) {
  try {
    const ct = String(res.headers.get("content-type") || "").toLowerCase();
    if (!ct.includes("application/json") && !ct.includes("+json")) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function buildUrl(path) {
  const rawBase = String(API_URL || "").trim();
  if (!rawBase) return String(path || "");

  const base = rawBase.replace(/\/+$/, "");
  let p = String(path || "").trim();

  if (!p.startsWith("/")) p = `/${p}`;
  p = p.replace(/\/{2,}/g, "/");

  const baseEndsWithApi = /\/api$/i.test(base);
  const pathStartsWithApi = /^\/api(\/|$)/i.test(p);

  if (baseEndsWithApi && pathStartsWithApi) {
    p = p.replace(/^\/api/i, "");
    if (!p.startsWith("/")) p = `/${p}`;
  }

  if (!baseEndsWithApi && !pathStartsWithApi) {
    p = `/api${p}`;
  }

  return `${base}${p}`;
}

export async function request(
  path,
  {
    method = "GET",
    body,
    token,
    timeoutMs = DEFAULT_TIMEOUT,
    headers: extraHeaders = {},
    plantId: explicitPlantId,
  } = {}
) {
  const url = buildUrl(path);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const jwt = token ?? getToken?.() ?? null;
  const plantId = explicitPlantId ?? localStorage.getItem("lp_currentPlantId");

  const headers = {
    Accept: "application/json",
    ...extraHeaders,
  };

  if (jwt) headers.Authorization = `Bearer ${jwt}`;
  if (plantId) headers["x-plant-id"] = String(plantId);

  let finalBody = undefined;
  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData;

  if (body != null) {
    if (isFormData) {
      finalBody = body;
    } else {
      headers["Content-Type"] = "application/json";
      finalBody = JSON.stringify(body);
    }
  }

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: finalBody,
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timeoutId);

    if (res.status === 204) {
      window.dispatchEvent(new Event("lubriplan:backend-activity"));
      return null;
    }

    const data = await safeJson(res);

    if (!res.ok) {
      const msg =
        data?.error ||
        data?.message ||
        `Error ${res.status} (${res.statusText || "Request failed"})`;

      const err = new Error(msg);
      err.status = res.status;
      err.url = url;
      err.data = data;
      throw err;
    }

    window.dispatchEvent(new Event("lubriplan:backend-activity"));
    return data;
  } catch (e) {
    clearTimeout(timeoutId);

    if (e?.name === "AbortError") {
      throw new Error("Tiempo de espera agotado (timeout).");
    }

    throw e;
  }
}

export const httpGet = (path, opts) =>
  request(path, { ...opts, method: "GET" });

export const httpPost = (path, body, opts) =>
  request(path, { ...opts, method: "POST", body });

export const httpPut = (path, body, opts) =>
  request(path, { ...opts, method: "PUT", body });

export const httpPatch = (path, body, opts) =>
  request(path, { ...opts, method: "PATCH", body });

export const httpDelete = (path, opts) =>
  request(path, { ...opts, method: "DELETE" });

export const httpForm = (
  path,
  formData,
  method = "POST",
  timeoutMs = DEFAULT_TIMEOUT,
  opts = {}
) => request(path, { ...opts, method, body: formData, timeoutMs });

