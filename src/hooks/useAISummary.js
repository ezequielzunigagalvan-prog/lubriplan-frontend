// src/hooks/useAISummary.js
import { useCallback, useEffect, useMemo, useState } from "react";
import { getAISummary } from "../services/aiService";

function key({ plantId, period, schemaVersion = 1, lang = "es-MX", role = "NA", scope = "NA" }) {
  return `lp_ai_${plantId}_${period}_${role}_${scope}_v${schemaVersion}_${lang}`;
}

export default function useAISummary({
  plantId,
  period,
  enabled = true,
  cacheMs = 24 * 60 * 60 * 1000, // 24h
  schemaVersion = 1,            // ✅ debe alinearse con AI_SCHEMA_VERSION
  lang = "es-MX",
  role = "NA",
  scope = "NA",                 // "TECH" o "MGMT" si quieres diferenciar
} = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const cacheKey = useMemo(() => key({ plantId, period, schemaVersion, lang, role, scope }), [
    plantId, period, schemaVersion, lang, role, scope
  ]);

  const readCache = useCallback(() => {
    try {
      const raw = localStorage.getItem(cacheKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed?.ts) return null;
      if (Date.now() - parsed.ts > cacheMs) return null;
      return parsed.value || null;
    } catch {
      return null;
    }
  }, [cacheKey, cacheMs]);

  const writeCache = useCallback((value) => {
    try {
      localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), value }));
    } catch {}
  }, [cacheKey]);

  const refresh = useCallback(async ({ force = false } = {}) => {
    if (!enabled) return;

    if (!force) {
      const cached = readCache();
      if (cached) {
        setData(cached);
        return;
      }
    }

    try {
      setError("");
      setLoading(true);
      const res = await getAISummary({ plantId, period, lang });
      const payload = res?.data ?? res;
      setData(payload);
      writeCache(payload);
    } catch (e) {
      setError(e?.message || "Error cargando resumen IA");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [enabled, readCache, plantId, period, lang, writeCache]);

  useEffect(() => { refresh(); }, [refresh]);

  return {
    data,
    loading,
    error,
    refresh,
    summary: data?.summary || null,
    bullets: data?.summary?.bullets || [],
    actions: data?.summary?.actions || [],
    riskLevel: data?.summary?.riskLevel || "LOW",
    cached: !!data?.cached,
  };
}