// src/pages/ActivitiesPage.jsx
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import MainLayout from "../layouts/MainLayout";
import { useLocation, useNavigate } from "react-router-dom";
import {
  getExecutions,
  checkOverdue,
  assignExecutionTechnician,
  createManualExecution,
  getExecutionOfflineStatus,
  syncOfflineExecutionQueue,
  prepareTechnicianOffline,
  OFFLINE_SYNC_EVENT,
} from "../services/executionsService";
import { getTechnicians } from "../services/techniciansService";
import { getEquipment } from "../services/equipmentService";
import CompleteExecutionModal from "./CompleteExecutionModal";
import EmergencyActivityModal from "../components/activities/EmergencyActivityModal";
import ReportConditionModal from "../components/activities/ReportConditionModal";
import { useAuth } from "../context/AuthContext";
import { Icon } from "../components/ui/lpIcons";
import { usePlant } from "../context/PlantContext";

import { API_ASSETS_URL } from "../services/api";

const buildImgUrl = (raw) => {
  if (!raw) return "";
  const s = String(raw);
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.startsWith("/")) return `${API_ASSETS_URL}${s}`;
  return `${API_ASSETS_URL}/${s}`;
};

const parseLocalDateSafe = (value) => {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const s = String(value).trim();
  if (!s) return null;

  // Caso 1: YYYY-MM-DD  -> crear fecha LOCAL, no UTC
  const ymd = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymd) {
    const [, y, m, d] = ymd;
    return new Date(Number(y), Number(m) - 1, Number(d), 12, 0, 0, 0);
  }

  // Caso 2: YYYY-MM-DDTHH:mm:ss...
  const isoLike = s.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/
  );
  if (isoLike) {
    const [, y, m, d, hh, mm, ss = "0"] = isoLike;
    return new Date(
      Number(y),
      Number(m) - 1,
      Number(d),
      Number(hh),
      Number(mm),
      Number(ss),
      0
    );
  }

  const dt = new Date(s);
  return Number.isNaN(dt.getTime()) ? null : dt;
};

const toLocalYMDSafe = (value) => {
  const dt = parseLocalDateSafe(value);
  if (!dt) return "";

  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const toLocalDateTimeTextSafe = (value) => {
  const dt = parseLocalDateSafe(value);
  if (!dt) return "";

  const dd = String(dt.getDate()).padStart(2, "0");
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const yyyy = dt.getFullYear();
  const hh = String(dt.getHours()).padStart(2, "0");
  const mi = String(dt.getMinutes()).padStart(2, "0");

  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
};
const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

const cleanUiText = (value) => {
  let text = String(value ?? "");
  if (!text) return "";

  if (/[ÃÂâï]/.test(text)) {
    try {
      text = decodeURIComponent(escape(text));
    } catch {
      // Mantener texto original si no puede decodificarse.
    }
  }

  return text
    .replace(/Â·/g, "·")
    .replace(/â€¦/g, "...")
    .replace(/â€”/g, "-")
    .replace(/â€¢/g, "·")
    .replace(/Ã¡/g, "á")
    .replace(/Ã©/g, "é")
    .replace(/Ã­/g, "í")
    .replace(/Ã³/g, "ó")
    .replace(/Ãº/g, "ú")
    .replace(/Ã/g, "Á")
    .replace(/Ã‰/g, "É")
    .replace(/Ã/g, "Í")
    .replace(/Ã“/g, "Ó")
    .replace(/Ãš/g, "Ú")
    .replace(/Ã±/g, "ñ")
    .replace(/Ã‘/g, "Ñ")
    .replace(/Gesti\uFFFDn/g, "Gestión")
    .replace(/gesti\uFFFDn/g, "gestión")
    .replace(/ejecuci\uFFFDn/g, "ejecución")
    .replace(/asignaci\uFFFDn/g, "asignación")
    .replace(/ubicaci\uFFFDn/g, "ubicación")
    .replace(/Aplicaci\uFFFDn/g, "Aplicación")
    .replace(/aplicaci\uFFFDn/g, "aplicación")
    .replace(/M\uFFFDtodo/g, "Método")
    .replace(/m\uFFFDtodo/g, "método")
    .replace(/Condici\uFFFDn/g, "Condición")
    .replace(/condici\uFFFDn/g, "condición")
    .replace(/Operaci\uFFFDn/g, "Operación")
    .replace(/operaci\uFFFDn/g, "operación")
    .replace(/Acci\uFFFDn/g, "Acción")
    .replace(/acci\uFFFDn/g, "acción")
    .replace(/T\uFFFDcnico/g, "Técnico")
    .replace(/t\uFFFDcnico/g, "técnico")
    .replace(/Cr\uFFFDtica/g, "Crítica")
    .replace(/cr\uFFFDtica/g, "crítica")
    .replace(/Cr\uFFFDtico/g, "Crítico")
    .replace(/cr\uFFFDtico/g, "crítico")
    .replace(/d\uFFFDa\(s\)/g, "día(s)")
    .replace(/d\uFFFDas/g, "días")
    .replace(/d\uFFFDa/g, "día")
    .replace(/atr\uFFFDs/g, "atrás")
    .replace(/a\uFFFDn/g, "aún")
    .replace(/inv\uFFFDlida/g, "inválida")
    .replace(/inv\uFFFDlido/g, "inválido")
    .replace(/CRITICO/g, "CRÍTICO")
    .replace(/\s+\uFFFD\s+/g, " · ")
    .replace(/[�]/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
};

// =========================
// Query params (Dashboard deep-links)
// =========================
const readQuery = (search) => {
  const p = new URLSearchParams(search || "");
  return {
    filter: String(p.get("filter") || ""),
    status: String(p.get("status") || "").toUpperCase(),
    unassigned: p.get("unassigned") === "1",
    q: String(p.get("q") || ""),
    month: String(p.get("month") || ""),
    futureWindow: String(p.get("futureWindow") || "MONTH").toUpperCase(),

    executionId: String(p.get("executionId") || ""),
    activityId: String(p.get("activityId") || ""),
    reportId: String(p.get("reportId") || ""),
    focus: String(p.get("focus") || "").toLowerCase(),
  };
};

const currentMonthStr = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
};

const readMonth = (search) => {
  const p = new URLSearchParams(search || "");
  const m = String(p.get("month") || "");
  if (/^\d{4}-\d{2}$/.test(m)) return m;
  return currentMonthStr();
};

const mapStatusToFilter = (status) => {
  if (status === "PENDING") return "Pendiente";
  if (status === "OVERDUE") return "Atrasada";
  if (status === "COMPLETED") return "Completada";
  return "Todas";
};

/* =========================
   HELPERS (fechas locales)
========================= */

const monthToFromTo = (monthStr) => {
  const [y, m] = String(monthStr || "").split("-").map(Number);
  if (!Number.isFinite(y) || !Number.isFinite(m)) {
    const d = new Date();
    return {
      from: new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0),
      to: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999),
    };
  }
  return {
    from: new Date(y, m - 1, 1, 0, 0, 0, 0),
    to: new Date(y, m, 0, 23, 59, 59, 999),
  };
};

export const toLocalYMD = (value) => toLocalYMDSafe(value);

export const diffDaysLocal = (fromISO, toISO) => {
  const a = parseLocalDateSafe(fromISO);
  const b = parseLocalDateSafe(toISO);

  if (!a || !b) return 0;

  const aMid = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const bMid = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();

  return Math.floor((bMid - aMid) / 86400000);
};


const startOfMonthLocal = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonthLocal = (d = new Date()) =>
  new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

const addDaysLocal = (d, days) => {
  const out = new Date(d);
  out.setDate(out.getDate() + days);
  return out;
};

export const isCriticality = (c) => {
  const s = String(c || "").toUpperCase().trim();
  return (
    s === "CRITICO" ||
    s === "CRITICO" ||
    s === "MUY_CRITICO" ||
    s === "MUY CRITICO" ||
    s === "MUY CRITICO" ||
    s === "VERY_CRITICAL"
  );
};

const isExecutionUnassigned = (activity) => {
  const raw = activity?.technicianId ?? activity?.technician?.id ?? null;
  const tid = raw === "" || raw == null ? null : Number(raw);
  return tid == null || Number.isNaN(tid) || tid === 0;
};

function useIsMobile(breakpoint = 820) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth <= breakpoint : false
  );

  useEffect(() => {
    const onResize = () => {
      setIsMobile(window.innerWidth <= breakpoint);
    };

    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);

  return isMobile;
}

export default function ActivitiesPage() {
  // ================= AUTH / PERMISSIONS =================
  const { user } = useAuth();
  const { currentPlantId, currentPlant } = usePlant();
  const role = String(user?.role || "TECHNICIAN").toUpperCase();
  const isTech = role === "TECHNICIAN";
  const isMobile = useIsMobile();

  const myTechId = user?.technicianId != null ? Number(user.technicianId) : null;

  // filtro por técnico (solo ADMIN/SUP)
  const [techFilterId, setTechFilterId] = useState(""); // "" = todos

  // reglas nuevas por rol
  const canCompleteActivities = isTech;
  const canAssignTech = role === "SUPERVISOR" || role === "ADMIN";
  const canSchedule = role === "SUPERVISOR" || role === "ADMIN";
  const canCreateEmergency = isTech || role === "SUPERVISOR";
  const canReportCondition = isTech;
  const canPrintActivities = role === "SUPERVISOR" || role === "ADMIN";

  const navigate = useNavigate();
  const location = useLocation();

  const monthFromUrl = useMemo(() => readMonth(location.search), [location.search]);
  const qs = useMemo(() => new URLSearchParams(location.search || ""), [location.search]);
  const urlFilter = String(qs.get("filter") || "");

  const isRiskLate = urlFilter === "risk-late";
  const isBadCondition = urlFilter === "bad-condition";

  const [month, setMonth] = useState(monthFromUrl);
  useEffect(() => setMonth(monthFromUrl), [monthFromUrl]);

  const setQueryParam = (key, value) => {
    const p = new URLSearchParams(location.search || "");
    if (value == null || value === "") p.delete(key);
    else p.set(key, String(value));
    navigate({ pathname: location.pathname, search: `?${p.toString()}` }, { replace: true });
  };

  const [filter, setFilter] = useState("Todas");
  const [q, setQ] = useState("");
  const [unassignedOnly, setUnassignedOnly] = useState(false);

  const [loading, setLoading] = useState(true);
  const [executions, setExecutions] = useState([]);
  const [err, setErr] = useState("");

  // estado del modal
  const [completeOpen, setCompleteOpen] = useState(false);
  const [selectedExecutionId, setSelectedExecutionId] = useState(null);
  const [showEmergency, setShowEmergency] = useState(false);
  const [openReportCondition, setOpenReportCondition] = useState(false);

  // animación al completar
  const [completePulse, setCompletePulse] = useState(false);

  // programar actividad manual
  const [openSchedule, setOpenSchedule] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [scheduleErr, setScheduleErr] = useState("");
  const [equipments, setEquipments] = useState([]);
  const [scheduleForm, setScheduleForm] = useState({
    equipmentId: "",
    equipmentSearch: "",
    manualTitle: "",
    manualInstructions: "",
    scheduledAt: toLocalYMD(new Date()),
    technicianId: "",
  });

  const [printFrom, setPrintFrom] = useState("");
  const [printTo, setPrintTo] = useState("");

  const [completedRange, setCompletedRange] = useState("MONTH"); // MONTH | 30D | 90D
  const reqIdRef = useRef(0);
const highlightedCardRef = useRef(null);
  const [meta, setMeta] = useState(null);
  const [offlineInfo, setOfflineInfo] = useState({
    enabled: false,
    isOnline: true,
    pendingCount: 0,
    failedCount: 0,
    syncingCount: 0,
    lastSyncAt: null,
    lastPreparedAt: null,
  });
  const [syncingOffline, setSyncingOffline] = useState(false);
  const [preparingOffline, setPreparingOffline] = useState(false);

  const todayYMD = useMemo(() => toLocalYMD(new Date()), []);

  // ===== Técnicos (Supervisor / Admin) =====
  const [techs, setTechs] = useState([]);
  const [assigningId, setAssigningId] = useState(null);

  const deep = useMemo(() => readQuery(location.search), [location.search]);
  const isUnassignedDeepLink = deep.filter === "unassigned";
  const isOutOfRangeDeepLink = deep.filter === "out-of-range";
  const isRiskLateDeepLink = deep.filter === "risk-late";
  const isAdminPriorityDeepLink = deep.filter === "admin-priority";

  const highlightExecutionId = useMemo(() => {
  const fromQuery = Number(deep.executionId || 0);
  const fromState = Number(location.state?.executionId || 0);
  const val = fromQuery || fromState || 0;
  return Number.isFinite(val) && val > 0 ? val : null;
}, [deep.executionId, location.state]);

const highlightActivityId = useMemo(() => {
  const fromQuery = Number(deep.activityId || 0);
  const fromState = Number(location.state?.activityId || 0);
  const val = fromQuery || fromState || 0;
  return Number.isFinite(val) && val > 0 ? val : null;
}, [deep.activityId, location.state]);

const highlightReportId = useMemo(() => {
  const fromQuery = Number(deep.reportId || 0);
  const fromState = Number(location.state?.reportId || 0);
  const val = fromQuery || fromState || 0;
  return Number.isFinite(val) && val > 0 ? val : null;
}, [deep.reportId, location.state]);

const focusMode = String(deep.focus || location.state?.focus || "").toLowerCase();

  const inRange = (iso, fromDate, toDate) => {
  if (!iso || !fromDate || !toDate) return false;

  const dt = parseLocalDateSafe(iso);
  if (!dt) return false;

  const t = dt.getTime();
  return t >= fromDate.getTime() && t <= toDate.getTime();
};

  const load = async () => {
    const reqId = ++reqIdRef.current;

    try {
      setErr("");
      setLoading(true);

      if (!currentPlantId) {
        setExecutions([]);
        setMeta(null);
        setLoading(false);
        return;
      }

      if (role === "SUPERVISOR" || role === "ADMIN") {
        await checkOverdue().catch(() => {});
      }

      const urlStatus = String(qs.get("status") || "").toUpperCase();
      const urlMonth = monthFromUrl;

      const data = await getExecutions({
  completedRange,
  month: urlMonth,
  futureWindow: "MONTH",
  filter: urlFilter || undefined,
  status: ["PENDING", "OVERDUE", "COMPLETED"].includes(urlStatus) ? urlStatus : undefined,
  technicianId: !isTech && techFilterId ? Number(techFilterId) : undefined,
  limit: highlightExecutionId || highlightActivityId || highlightReportId ? 200 : undefined,
});

      if (reqId !== reqIdRef.current) return;

      setExecutions(Array.isArray(data?.items) ? data.items : []);
      setMeta(data?.meta || null);
      if (isTech) {
        try {
          setOfflineInfo(data?.sync || (await getExecutionOfflineStatus()));
        } catch {
          // noop
        }
      }
    } catch (e) {
      console.error(e);
      if (reqId !== reqIdRef.current) return;
      setErr(e?.message || "Error cargando actividades");
      if (isTech) {
        try {
          setOfflineInfo(await getExecutionOfflineStatus());
        } catch {
          // noop
        }
      }
    } finally {
      if (reqId === reqIdRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentPlantId) return;

    setExecutions([]);
    setMeta(null);
    setErr("");

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, completedRange, month, currentPlantId, techFilterId]);

  const refreshOfflineInfo = useCallback(async () => {
    if (!isTech) return;
    try {
      setOfflineInfo(await getExecutionOfflineStatus());
    } catch {
      // noop
    }
  }, [isTech]);

  const triggerCompletePulse = useCallback((title, subtitle = "Cambios guardados correctamente") => {
    setCompletePulseText({ title, subtitle });
    setCompletePulse(true);
    window.clearTimeout(triggerCompletePulse._t);
    triggerCompletePulse._t = window.setTimeout(() => setCompletePulse(false), 1200);
  }, []);

  const handleSyncOfflineNow = useCallback(async () => {
    if (!isTech) return;
    try {
      setErr("");
      setSyncingOffline(true);
      const result = await syncOfflineExecutionQueue();
      await load();
      const syncedCount = Number(result?.synced || 0);
      triggerCompletePulse(
        syncedCount > 0 ? "Sincronización completada" : "Sin cambios por sincronizar",
        syncedCount > 0
          ? `Se sincronizaron ${syncedCount} actividad${syncedCount === 1 ? "" : "es"} pendientes.`
          : "No había actividades pendientes en este momento."
      );
    } catch (error) {
      setErr(error?.message || "No se pudo sincronizar.");
    } finally {
      setSyncingOffline(false);
      refreshOfflineInfo();
    }
  }, [isTech, refreshOfflineInfo, triggerCompletePulse]);

  const handlePrepareOfflineNow = useCallback(async () => {
    if (!isTech) return;
    try {
      setErr("");
      setPreparingOffline(true);
      await prepareTechnicianOffline({ futureDays: 7, limit: 200 });
      await load();
      triggerCompletePulse("Modo offline listo", "Tus actividades quedaron guardadas para trabajar sin conexión.");
    } catch (error) {
      setErr(error?.message || "No se pudo preparar el modo offline.");
    } finally {
      setPreparingOffline(false);
      refreshOfflineInfo();
    }
  }, [isTech, refreshOfflineInfo, triggerCompletePulse]);


  useEffect(() => {
    if (!isTech) return;

    refreshOfflineInfo();

    const handleConnectionChange = () => {
      refreshOfflineInfo();
    };

    window.addEventListener("online", handleConnectionChange);
    window.addEventListener("offline", handleConnectionChange);
    window.addEventListener(OFFLINE_SYNC_EVENT, handleConnectionChange);

    return () => {
      window.removeEventListener("online", handleConnectionChange);
      window.removeEventListener("offline", handleConnectionChange);
      window.removeEventListener(OFFLINE_SYNC_EVENT, handleConnectionChange);
    };
  }, [isTech, refreshOfflineInfo]);

 // inicial + deep-links
useEffect(() => {
  if (deep.filter === "overdue") setFilter("Atrasada");
  if (deep.filter === "unassigned") setUnassignedOnly(true);
  if (deep.filter === "out-of-range") setFilter("Completada");
  if (deep.filter === "risk-late") setFilter("Todas");

  if (deep.status) setFilter(mapStatusToFilter(deep.status));
  if (deep.q) setQ(deep.q);
  if (deep.unassigned) setUnassignedOnly(true);

  // si viene desde notificación, limpia filtros para no ocultar la actividad
  if (highlightExecutionId || highlightActivityId || highlightReportId) {
    setFilter("Todas");
    setQ("");
    setUnassignedOnly(false);
    setTechFilterId("");
  }

  if (location.state?.refresh) {
    navigate("/activities", { replace: true, state: {} });
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

  // abrir modal emergente desde state
  useEffect(() => {
    if (location.state?.openEmergency) {
      setShowEmergency(true);
      navigate(location.pathname + location.search, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  // cargar técnicos (Supervisor / Admin cuando aplique)
  useEffect(() => {
    if (!(canAssignTech || canSchedule) || !currentPlantId) {
      setTechs([]);
      return;
    }

    (async () => {
      try {
        const data = await getTechnicians();
        const items = Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data)
          ? data
          : [];
        setTechs(items);
      } catch (e) {
        console.error("Error cargando Técnicos:", e);
        setTechs([]);
      }
    })();
  }, [canAssignTech, canSchedule, currentPlantId]);

  // cargar equipos (solo si puede programar)
  useEffect(() => {
    if (!canSchedule || !currentPlantId) {
      setEquipments([]);
      return;
    }

    (async () => {
      try {
        const data = await getEquipment();
        const items = Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data)
          ? data
          : [];
        setEquipments(items);
      } catch (e) {
        console.error("Error cargando equipos:", e);
        setEquipments([]);
      }
    })();
  }, [canSchedule, currentPlantId]);

  useEffect(() => {
    if (!currentPlantId) return;

    setQ("");
    setUnassignedOnly(false);
    setTechFilterId("");
    setFilter("Todas");

    setCompleteOpen(false);
    setSelectedExecutionId(null);
    setShowEmergency(false);
    setOpenReportCondition(false);

    setOpenSchedule(false);
    setScheduleErr("");
    setSavingSchedule(false);

    setScheduleForm({
      equipmentId: "",
      equipmentSearch: "",
      manualTitle: "",
      manualInstructions: "",
      scheduledAt: toLocalYMD(new Date()),
      technicianId: "",
    });
  }, [currentPlantId]);

  const openComplete = (id) => {
    setSelectedExecutionId(Number(id));
    setCompleteOpen(true);
  };

  const onAssignTech = async (executionId, technicianId) => {
    if (!canAssignTech) return;

    try {
      setErr("");
      setAssigningId(executionId);

      const techId = technicianId ? Number(technicianId) : null;
      await assignExecutionTechnician(executionId, techId);
      await load();
    } catch (e) {
      console.error(e);
      setErr(e?.message || "Error asignando Técnico");
    } finally {
      setAssigningId(null);
    }
  };

  // programar actividad
  const openScheduleModal = () => {
    setScheduleErr("");
    setScheduleForm({
      equipmentId: "",
      equipmentSearch: "",
      manualTitle: "",
      manualInstructions: "",
      scheduledAt: toLocalYMD(new Date()),
      technicianId: "",
    });
    setOpenSchedule(true);
  };

  const closeScheduleModal = () => {
    setOpenSchedule(false);
    setSavingSchedule(false);
    setScheduleErr("");
  };

  const saveSchedule = async () => {
    if (!canSchedule) return;

    try {
      setScheduleErr("");

      const equipmentId = Number(scheduleForm.equipmentId);
      if (!Number.isFinite(equipmentId)) return setScheduleErr("Selecciona un equipo.");

      const manualTitle = String(scheduleForm.manualTitle || "").trim();
      if (!manualTitle) return setScheduleErr("Escribe el nombre de la actividad.");

      const scheduledAt = String(scheduleForm.scheduledAt || "").trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(scheduledAt)) {
      return setScheduleErr("Fecha inválida (YYYY-MM-DD).");
      }

      const technicianId =
        scheduleForm.technicianId === "" || scheduleForm.technicianId == null
          ? null
          : Number(scheduleForm.technicianId);

      if (technicianId !== null && !Number.isFinite(technicianId)) {
        return setScheduleErr("Técnico inválido.");
      }

      setSavingSchedule(true);

      await createManualExecution({
        origin: "MANUAL",
        equipmentId,
        manualTitle,
        manualInstructions: String(scheduleForm.manualInstructions || "").trim() || null,
        scheduledAt,
        technicianId,
      });

      closeScheduleModal();
      await load();
    } catch (e) {
      console.error(e);
      setScheduleErr(e?.message || "Error programando actividad");
    } finally {
      setSavingSchedule(false);
    }
  };

  // =========================
  // Ventanas de visibilidad
  // =========================
  const now = new Date();

  const completedFromTo = useMemo(() => {
    if (completedRange === "MONTH") {
      return { from: startOfMonthLocal(now), to: endOfMonthLocal(now) };
    }
    if (completedRange === "90D") {
      return { from: addDaysLocal(now, -90), to: now };
    }
    return { from: addDaysLocal(now, -30), to: now };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completedRange]);

  const futureFromTo = useMemo(() => monthToFromTo(month), [month]);

  useEffect(() => {
    setPrintFrom(toLocalYMD(futureFromTo.from));
    setPrintTo(toLocalYMD(futureFromTo.to));
  }, [futureFromTo.from, futureFromTo.to]);

  // =========================
  // Normaliza ejecuciones a activity UI
  // =========================
  const activities = useMemo(() => {
    const TOL_LOW = 0.7;
    const TOL_HIGH = 1.3;

    return (executions || [])
      .filter((ex) => ex && typeof ex.id === "number")
      .map((ex) => {
        const origin = String(ex?.origin || "ROUTE").toUpperCase();
        const isManual = origin !== "ROUTE";

        const route = ex?.route || {};
        const equipment = isManual ? ex?.equipment || null : route?.equipment || null;

        const instructionsTxt = isManual
          ? ex?.manualInstructions ??
            ex?.manualNotes ??
            ex?.instructions ??
            ex?.notes ??
            ex?.observations ??
            ""
          : route?.instructions ??
            ex?.route?.instructions ??
            ex?.instructions ??
            ex?.notes ??
            "";

        const rawStatus = String(ex?.status || "").toUpperCase();
        const dateISO =
          rawStatus === "COMPLETED"
            ? ex?.executedAt
            : ex?.scheduledAt || ex?.executedAt;

        const dateLabel = dateISO ? toLocalYMD(dateISO) : "";
        const computedStatus =
          rawStatus === "COMPLETED"
            ? "Completada"
            : dateLabel && dateLabel < todayYMD
            ? "Atrasada"
            : "Pendiente";

        const isFuture = computedStatus !== "Completada" && dateLabel && dateLabel > todayYMD;
        const isToday = computedStatus !== "Completada" && dateLabel && dateLabel === todayYMD;

        const overdueDays =
          computedStatus === "Atrasada" && dateISO ? diffDaysLocal(dateISO, new Date()) : 0;

        const used = Number(ex?.usedQuantity);
        const expected = Number(route?.quantity);
        const hasNumbers =
          !isManual && Number.isFinite(used) && Number.isFinite(expected) && expected > 0;
        const ratio = hasNumbers ? used / expected : null;
        const outOfRange =
          computedStatus === "Completada" && hasNumbers
            ? ratio < TOL_LOW || ratio > TOL_HIGH
            : false;

        const plannedLub = !isManual ? route?.lubricant || null : null;
        const plannedLabel = !isManual
          ? plannedLub?.name
            ? `${plannedLub.name}${plannedLub.code ? ` (${plannedLub.code})` : ""}`
            : route?.lubricantType || "-"
          : "-";

        const moves = Array.isArray(ex?.lubricantMovements) ? ex.lubricantMovements : [];
        const usedMove =
          moves.find((m) =>
            ["OUT", "SALIDA", "CONSUMO"].includes(String(m?.type || "").toUpperCase())
          ) ||
          moves[0] ||
          null;

        const usedLub = usedMove?.lubricant || null;
        const usedLabel = usedLub?.name
          ? `${usedLub.name}${usedLub.code ? ` (${usedLub.code})` : ""}`
          : "";

        const activityName = isManual
          ? ex?.manualTitle || "Actividad programada"
          : route?.name || "-";

        return {
          id: ex.id,
          origin,
          isManual,
          computedStatus,
          statusRaw: ex?.status,

          executionId: ex.id,
          activityId: route?.id ?? ex?.activityId ?? null,
          reportId:
            ex?.conditionReportId ??
            ex?.reportId ??
            ex?.conditionReport?.id ??
            null,
          hasEvidence: Boolean(ex?.evidenceImage),
          condition: ex?.condition ?? null,
          notes: ex?.notes ?? ex?.observations ?? "",
          evidenceImage: ex?.evidenceImage ?? null,
          previewImage: ex?.evidenceImage ?? route?.imageUrl ?? ex?.route?.imageUrl ?? null,

          dateISO,
          dateLabel,
          isFuture,
          isToday,
          overdueDays,

          usedQuantity: ex?.usedQuantity ?? null,
          expectedQuantity: route?.quantity ?? null,
          outOfRange,
          ratio,

          activityName: cleanUiText(activityName),
          routeName: cleanUiText(isManual ? "MANUAL" : route?.name || "?"),
          routeUnit: !isManual ? route?.unit || "" : "",

          equipment: equipment || null,
          equipmentName: cleanUiText(equipment?.name || "?"),
          equipmentCode: equipment?.code || equipment?.tag || "",
          equipmentLocation: cleanUiText(equipment?.location || ""),
          equipmentCriticality: equipment?.criticality || null,

          plannedLubricantLabel: cleanUiText(plannedLabel),
          usedLubricantLabel: cleanUiText(usedLabel),
          usedLubricantQty: usedMove?.quantity ?? ex?.usedQuantity ?? null,
          usedLubricantUnit: usedLub?.unit || (!isManual ? route?.unit || "" : ""),

          lubricant: plannedLabel,
          quantityLabel:
            !isManual && route?.quantity != null
              ? `${route.quantity}${route.unit ? ` ${route.unit}` : ""} por punto`
              : "?",
          pointsCount: !isManual && route?.points != null ? Number(route.points) : null,
          method: cleanUiText(!isManual ? route?.method || "?" : "?"),
          instructions: cleanUiText(String(instructionsTxt || "")),
          technicianId: ex?.technicianId ?? ex?.technician?.id ?? null,
          technician: ex?.technician ?? null,
          technicianName: cleanUiText(ex?.technician?.name ?? ex?.technicianName ?? null),
          localSyncStatus: ex?.localSyncStatus || "synced",
          localSyncError: cleanUiText(ex?.localSyncError || ""),
        };
      });
  }, [executions, todayYMD]);

  // =========================
  // Orden base
  // =========================
  const sorted = useMemo(() => {
    const priority = (s) => (s === "Atrasada" ? 0 : s === "Pendiente" ? 1 : 2);

    return [...(activities || [])].sort((a, b) => {
      const pa = priority(a.computedStatus);
      const pb = priority(b.computedStatus);
      if (pa !== pb) return pa - pb;

      const ta = a?.dateISO ? new Date(a.dateISO).getTime() : 0;
      const tb = b?.dateISO ? new Date(b.dateISO).getTime() : 0;

      if (a.computedStatus === "Completada" && b.computedStatus === "Completada") return tb - ta;
      return ta - tb;
    });
  }, [activities]);

  // =========================
  // Scope por ventanas
  // =========================
  const scoped = useMemo(() => {
    return sorted.filter((a) => {
      if (a.computedStatus === "Pendiente" || a.computedStatus === "Atrasada") {
        return inRange(a.dateISO, futureFromTo.from, futureFromTo.to);
      }
      if (a.computedStatus === "Completada") {
        return inRange(a.dateISO, completedFromTo.from, completedFromTo.to);
      }
      return true;
    });
  }, [sorted, completedFromTo, futureFromTo]);

  // técnico ve: sin asignar + asignadas a su technicianId
  const techScoped = useMemo(() => {
    if (!isTech) return scoped;

    return (scoped || []).filter((a) => {
      const raw = a?.technicianId ?? a?.technician?.id ?? null;
      const tid = raw === "" || raw == null ? null : Number(raw);
      const unassigned = tid == null || Number.isNaN(tid) || tid === 0;

      if (unassigned) return true;

      if (!Number.isFinite(myTechId)) return false;
      return tid === Number(myTechId);
    });
  }, [scoped, isTech, myTechId]);

  // =========================
  // Filtros
  // =========================
  const filtered = useMemo(() => {
    let list = techScoped;

    if (isRiskLateDeepLink) {
      list = list.filter((a) => a.computedStatus !== "Completada");
    }

    if (isOutOfRangeDeepLink) {
      list = list.filter((a) => a.computedStatus === "Completada" && a.outOfRange);
    }

    if (isUnassignedDeepLink) {
      list = list.filter((a) => isExecutionUnassigned(a));
    }

    if (isAdminPriorityDeepLink) {
      list = list.filter((a) => {
        const crit = String(a?.equipmentCriticality || "").toUpperCase();
        const isCriticalEq = ["ALTA", "CRITICA", "CRÍTICA"].includes(crit);
        const fromConditionReport = a?.conditionReportId != null;
        return isCriticalEq || fromConditionReport;
      });
    }

    if (filter !== "Todas") {
      if (filter === "Hoy") {
        list = list.filter((a) => a.computedStatus !== "Completada" && a.dateLabel === todayYMD);
      } else {
        list = list.filter((a) => a.computedStatus === filter);
      }
    }

    if (isBadCondition) {
      list = list.filter((a) => {
        const c = String(a.condition || "").toUpperCase();
        const bad = c === "MALO" || c === "BAD";
      const crit = c === "CRITICO" || c === "CRITICO" || c === "CRITICAL";
        return a.computedStatus === "Completada" && (bad || crit);
      });
    }

    if (unassignedOnly) {
      list = list.filter((a) => isExecutionUnassigned(a));
    }

    const s = String(q || "").trim().toLowerCase();
    if (s) {
      list = list.filter((a) => {
        const act = (a.activityName || "").toLowerCase();
        const eq = (a.equipmentName || "").toLowerCase();
        const code = (a.equipmentCode || "").toLowerCase();
        const code2 = (a.equipment?.code || "").toLowerCase();
        const tag = (a.equipment?.tag || "").toLowerCase();
        const loc = (a.equipmentLocation || "").toLowerCase();
        const lube = (a.lubricant || "").toLowerCase();

        return (
          act.includes(s) ||
          eq.includes(s) ||
          code.includes(s) ||
          code2.includes(s) ||
          tag.includes(s) ||
          loc.includes(s) ||
          lube.includes(s)
        );
      });
    }

    if (highlightExecutionId) {
  list = list.filter((a) => Number(a.id) === Number(highlightExecutionId));
} else if (highlightActivityId) {
  list = list.filter((a) => Number(a.route?.id || a.activityId || 0) === Number(highlightActivityId));
} else if (highlightReportId) {
  list = list.filter((a) => Number(a.reportId || a.conditionReportId || 0) === Number(highlightReportId));
}

    return list;
  }, [
    techScoped,
    isOutOfRangeDeepLink,
    isUnassignedDeepLink,
    isRiskLateDeepLink,
    isAdminPriorityDeepLink,
    filter,
    todayYMD,
    unassignedOnly,
    q,
    isBadCondition,
    highlightExecutionId,
    highlightActivityId,
    highlightReportId,
  ]);

  const printRows = useMemo(() => {
    const from = String(printFrom || "").trim();
    const to = String(printTo || "").trim();

    return filtered.filter((a) => {
      const ymd = String(a?.dateLabel || toLocalYMD(a?.dateISO) || "").trim();
      if (!ymd) return false;
      if (from && ymd < from) return false;
      if (to && ymd > to) return false;
      return true;
    });
  }, [filtered, printFrom, printTo]);

  const handlePrintActivities = useCallback(() => {
    if (!canPrintActivities) return;
    if (!printRows.length) {
      window.alert("No hay actividades en el rango seleccionado.");
      return;
    }

    const rangeText = `${printFrom || "-"} a ${printTo || "-"}`;
    const plantName = currentPlant?.name || "Planta";
    const generatedAt = toLocalDateTimeTextSafe(new Date());

    const rowsHtml = printRows
      .map((a, idx) => {
        const technician = a?.technicianName || a?.technician?.name || "Sin asignar";
        const equipment = [a?.equipmentName || "-", a?.equipmentCode ? `(${a.equipmentCode})` : ""]
          .filter(Boolean)
          .join(" ");

        return `
          <tr>
            <td>${idx + 1}</td>
            <td>${escapeHtml(a?.dateLabel || "-")}</td>
            <td>${escapeHtml(equipment)}</td>
            <td>${escapeHtml(a?.activityName || "-")}</td>
            <td>${escapeHtml(a?.plannedLubricantLabel || a?.lubricant || "-")}</td>
            <td>${escapeHtml(a?.quantityLabel || "-")}</td>
            <td>${escapeHtml(technician)}</td>
            <td>${escapeHtml(a?.computedStatus || "-")}</td>
          </tr>`;
      })
      .join("");

    const popup = window.open("", "_blank", "width=1200,height=800");
    if (!popup) return;

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8" /><title>Impresión de actividades</title><style>body{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;margin:24px;color:#0f172a;}h1{margin:0 0 6px;font-size:28px;}p{margin:0 0 4px;color:#475569;font-weight:600;}table{width:100%;border-collapse:collapse;margin-top:20px;font-size:13px;}th,td{border:1px solid #cbd5e1;padding:10px 8px;text-align:left;vertical-align:top;}th{background:#e2e8f0;font-size:12px;text-transform:uppercase;letter-spacing:.04em;}tbody tr:nth-child(even){background:#f8fafc;}.meta{display:grid;gap:4px;margin-top:10px;}.count{margin-top:12px;font-weight:800;color:#0f172a;}</style></head><body><h1>LubriPlan</h1><div class="meta"><p>Planta: ${escapeHtml(plantName)}</p><p>Rango: ${escapeHtml(rangeText)}</p><p>Generado: ${escapeHtml(generatedAt)}</p></div><div class="count">Actividades: ${printRows.length}</div><table><thead><tr><th>#</th><th>Fecha</th><th>Equipo</th><th>Actividad</th><th>Lubricante</th><th>Cantidad</th><th>Técnico</th><th>Estado</th></tr></thead><tbody>${rowsHtml}</tbody></table></body></html>`;

    popup.document.open();
    popup.document.write(html);
    popup.document.close();
    popup.focus();
    popup.onload = () => {
      popup.focus();
      popup.print();
    };
    window.setTimeout(() => {
      try {
        popup.focus();
        popup.print();
      } catch {}
    }, 350);
  }, [canPrintActivities, printRows, printFrom, printTo, currentPlant]);

  const baseCountList = techScoped;

const pendingCount = baseCountList.filter((a) => a.computedStatus === "Pendiente").length;
const lateCount = baseCountList.filter((a) => a.computedStatus === "Atrasada").length;
const completedCount = baseCountList.filter((a) => a.computedStatus === "Completada").length;


     useEffect(() => {
  if (!highlightExecutionId) return;
  if (loading) return;

  const found = filtered.find((a) => Number(a.id) === Number(highlightExecutionId));
  if (!found) return;

  // Si puede completarse, abre modal directo
  if (
    found.computedStatus !== "Completada" &&
    found.dateLabel &&
    found.dateLabel <= todayYMD &&
    !found.isFuture
  ) {
    setSelectedExecutionId(Number(found.id));
    setCompleteOpen(true);
  }
}, [highlightExecutionId, loading, filtered, todayYMD]);

useEffect(() => {
  if (loading) return;
  if (!highlightedCardRef.current) return;

  highlightedCardRef.current.scrollIntoView({
    behavior: "smooth",
    block: "center",
  });
}, [loading, filtered]);

  return (
    <MainLayout>
      <style>{`
        @keyframes lpToastIn {
          from { transform: translateY(10px) scale(0.985); opacity: 0; }
          to   { transform: translateY(0px) scale(1); opacity: 1; }
        }
        @keyframes lpPulse {
          0% { transform: scale(0.96); opacity: 0; }
          60% { transform: scale(1.02); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      <CompleteExecutionModal
        open={completeOpen}
        executionId={selectedExecutionId}
        onClose={() => setCompleteOpen(false)}
        onSaved={async () => {
          await load();
          triggerCompletePulse("Actividad completada");
        }}
      />

      {completePulse ? (
        <div style={centerOverlay}>
          <div style={centerCard}>
            <div style={centerIconWrap}>
              <Icon name="check" style={{ width: 26, height: 26, color: "#0b1220" }} />
            </div>
            <div style={{ fontWeight: 980, color: "#0f172a", fontSize: 18, lineHeight: 1.15 }}>{completePulseText.title}</div>
            <div style={{ marginTop: 6, fontWeight: 850, color: "#475569", fontSize: 12, lineHeight: 1.35 }}>
              {completePulseText.subtitle}
            </div>
          </div>
        </div>
      ) : null}

      <div style={pageShell}>
        <div style={topBar}>
          <div>
            <div style={kicker}>  </div>
            <h1 style={title}>Actividades</h1>
            <div style={subtitle}>
              {cleanUiText("Gestión diaria de ejecución, asignación y control")}
              {currentPlant?.name ? ` - Planta: ${currentPlant.name}` : ""}
            </div>
          </div>

          <div style={topActions}>
            {canSchedule ? (
              <button
                type="button"
                style={btnPrimarySlim}
                onClick={openScheduleModal}
                title="Programar actividad"
              >
                <Icon name="plus" style={{ width: 16, height: 16 }} />
                <span>{cleanUiText("Programar actividad")}</span>
              </button>
            ) : null}

            <button onClick={load} style={btnGhost} disabled={loading} type="button">
              <Icon name="refresh" style={{ width: 16, height: 16 }} />
              <span>{cleanUiText(loading ? "Actualizando..." : "Actualizar")}</span>
            </button>

            {isTech && offlineInfo.enabled ? (
              <>
                <button
                  type="button"
                  style={btnGhost}
                  onClick={handlePrepareOfflineNow}
                  disabled={preparingOffline || !offlineInfo.isOnline}
                  title="Guardar actividades para trabajar sin conexión"
                >
                  <Icon name="download" style={{ width: 16, height: 16 }} />
                  <span>{preparingOffline ? "Preparando..." : "Preparar modo offline"}</span>
                </button>
                <button
                  type="button"
                  style={btnGhost}
                  onClick={handleSyncOfflineNow}
                  disabled={syncingOffline || !offlineInfo.isOnline}
                  title="Sincronizar pendientes"
                >
                  <Icon name="refresh" style={{ width: 16, height: 16 }} />
                  <span>{syncingOffline ? "Sincronizando..." : "Sincronizar ahora"}</span>
                </button>
              </>
            ) : null}

            {canCreateEmergency ? (
              <button
                type="button"
                style={btnEmergency}
                onClick={() => setShowEmergency(true)}
                title="Crear actividad emergente"
              >
                <Icon name="bolt" style={{ width: 16, height: 16 }} />
                <span>{cleanUiText("Actividad emergente")}</span>
              </button>
            ) : null}

            {canReportCondition ? (
              <button
                type="button"
                onClick={() => setOpenReportCondition(true)}
                style={btnGhost}
                title="Reportar condición anormal"
              >
                <Icon name="warn" style={{ width: 16, height: 16 }} />
                <span>{cleanUiText("Reportar condición")}</span>
              </button>
            ) : null}
          </div>
        </div>

        {isTech && offlineInfo.enabled ? (
          <div style={offlineBanner}>
            <div style={{ display: "grid", gap: 4 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 950, color: offlineInfo.isOnline ? "#166534" : "#9a3412" }}>
                <span style={{ width: 10, height: 10, borderRadius: 999, background: offlineInfo.isOnline ? "#22c55e" : "#f97316", display: "inline-block" }} />
                {offlineInfo.isOnline ? "En línea" : "Sin conexión"}
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#475569" }}>
                Pendientes por sincronizar: <b style={{ color: "#0f172a" }}>{Number(offlineInfo.pendingCount || 0)}</b>
                {offlineInfo.failedCount ? ` · Con error: ${Number(offlineInfo.failedCount || 0)}` : ""}
                {offlineInfo.lastSyncAt ? ` · Última sincronización: ${toLocalDateTimeTextSafe(offlineInfo.lastSyncAt)}` : ""}
              </div>
            </div>

            {!offlineInfo.isOnline ? (
              <div style={offlineBannerPill}>Se guardará local y se sincronizará al volver la conexión.</div>
            ) : null}
          </div>
        ) : null}

        {openSchedule ? (
          <div
            style={modalOverlay}
            onClick={(e) => e.target === e.currentTarget && closeScheduleModal()}
          >
            <div style={modalCard} onClick={(e) => e.stopPropagation()}>
              <div style={modalHeader}>
                <div>
                  <div style={modalKicker}>PROGRAMAR</div>
                  <div style={modalTitle}>Actividad única</div>
                </div>

                <button
                  style={btnGhostSmall}
                  onClick={closeScheduleModal}
                  type="button"
                  title="Cerrar"
                >
                  <Icon name="close" style={{ width: 16, height: 16 }} />
                </button>
              </div>

              <div style={modalHint}>
                Se crea como actividad <b>única</b> (no recurrente).
              </div>

              <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                <label style={lbl}>
                  Buscar equipo (TAG / nombre)
                  <input
                    value={scheduleForm.equipmentSearch || ""}
                    onChange={(e) =>
                      setScheduleForm((p) => ({ ...p, equipmentSearch: e.target.value }))
                    }
                    placeholder="Ej. MTR-102, TAG-33, BOMBA..."
                    style={modalInput}
                  />
                </label>

                <label style={lbl}>
                  Equipo
                  <select
                    value={scheduleForm.equipmentId}
                    onChange={(e) =>
                      setScheduleForm((p) => ({ ...p, equipmentId: e.target.value }))
                    }
                    style={modalInput}
                  >
                    <option value="">Selecciona equipo...</option>

                    {(equipments || [])
                      .filter((eq) => {
                        const s = String(scheduleForm.equipmentSearch || "")
                          .trim()
                          .toLowerCase();
                        if (!s) return true;
                        const name = String(eq?.name || "").toLowerCase();
                        const code = String(eq?.code || eq?.tag || "").toLowerCase();
                        const loc = String(eq?.location || "").toLowerCase();
                        return name.includes(s) || code.includes(s) || loc.includes(s);
                      })
                      .slice(0, 200)
                      .map((eq) => (
                        <option key={eq.id} value={eq.id}>
                          {eq.name}
                          {eq.code ? ` · ${eq.code}` : eq.tag ? ` · ${eq.tag}` : ""}
                          {eq.location ? ` · ${eq.location}` : ""}
                        </option>
                      ))}
                  </select>

                  {String(scheduleForm.equipmentSearch || "").trim() ? (
                    <div
                      style={{
                        marginTop: 6,
                        color: "#64748b",
                        fontWeight: 850,
                        fontSize: 12,
                      }}
                    >
                      Mostrando resultados para: <b>{scheduleForm.equipmentSearch}</b>
                    </div>
                  ) : null}
                </label>

                <label style={lbl}>
                  Actividad
                  <input
                    value={scheduleForm.manualTitle}
                    onChange={(e) =>
                      setScheduleForm((p) => ({ ...p, manualTitle: e.target.value }))
                    }
                    placeholder="Ej. Lubricar chumacera motor #2"
                    style={modalInput}
                  />
                </label>

                <label style={lbl}>
                  Fecha
                  <input
                    type="date"
                    value={scheduleForm.scheduledAt}
                    onChange={(e) =>
                      setScheduleForm((p) => ({ ...p, scheduledAt: e.target.value }))
                    }
                    style={modalInput}
                  />
                </label>

                <label style={lbl}>
                  Técnico (opcional)
                  <select
                    value={scheduleForm.technicianId}
                    onChange={(e) =>
                      setScheduleForm((p) => ({ ...p, technicianId: e.target.value }))
                    }
                    style={modalInput}
                  >
                    <option value="">Sin asignar</option>
                    {techs.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} {t.code ? `(${t.code})` : ""}
                      </option>
                    ))}
                  </select>
                </label>

                <label style={lbl}>
                  Instrucciones (opcional)
                  <textarea
                    value={scheduleForm.manualInstructions || ""}
                    onChange={(e) =>
                      setScheduleForm((p) => ({
                        ...p,
                        manualInstructions: e.target.value,
                      }))
                    }
                    placeholder="Puntos, riesgos, EPP, pasos..."
                    style={{ ...modalInput, minHeight: 90, resize: "vertical" }}
                  />
                </label>

                {scheduleErr ? <div style={errorBox}>{scheduleErr}</div> : null}

                <div
                  style={{
                    marginTop: 6,
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 10,
                  }}
                >
                  <button
                    style={btnGhostSmall}
                    onClick={closeScheduleModal}
                    type="button"
                    disabled={savingSchedule}
                  >
                    Cancelar
                  </button>
                  <button
                    style={btnPrimary}
                    type="button"
                    onClick={saveSchedule}
                    disabled={savingSchedule}
                  >
                  {savingSchedule ? "Guardando..." : "Guardar"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <EmergencyActivityModal
          open={showEmergency}
          onClose={() => setShowEmergency(false)}
          onSaved={() => {
            setShowEmergency(false);
            load();
          }}
        />

        <ReportConditionModal
          open={openReportCondition}
          onClose={() => setOpenReportCondition(false)}
          onSaved={() => {
            setOpenReportCondition(false);
            load();
          }}
        />

        {err ? <div style={errorBox}>{err}</div> : null}

        {isRiskLate ? (
          <div style={infoBanner}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 10,
                flexWrap: "wrap",
                alignItems: "flex-start",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={infoIconWrap}>
                    <Icon
                      name="sparkles"
                      style={{ width: 18, height: 18, color: "#0b1220" }}
                    />
                  </span>
                  <div style={{ fontWeight: 950, color: "#0f172a" }}>
                    Riesgo de atraso (predictivo)
                  </div>
                </div>

                <div style={infoText}>
                  <div>
                    <b>Por qué aparece:</b> vista enfocada en tareas <b>pendientes</b> del mes
                    con riesgo <b>MED/HIGH</b>.
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <b>Recomendación:</b> prioriza, reasigna si hay sobrecarga y reprograma.
                  </div>
                </div>
              </div>

              <button
                type="button"
                style={btnGhostSmall}
                onClick={() => {
                  qs.delete("filter");
                  navigate(`/activities?${qs.toString()}`);
                }}
              >
                Quitar filtro
              </button>
            </div>
          </div>
        ) : null}

        {isBadCondition ? (
          <div style={infoBanner}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 10,
                flexWrap: "wrap",
                alignItems: "flex-start",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={infoIconWrap}>
                    <Icon name="warn" style={{ width: 18, height: 18, color: "#0b1220" }} />
                  </span>
                  <div style={{ fontWeight: 950, color: "#0f172a" }}>
                    Condición mala / crítica
                  </div>
                </div>

                <div style={infoText}>
                  <div>
                    <b>Por qué aparece:</b> actividades completadas con condición <b>MALO</b> o{" "}
                    <b>CRITICO</b>.
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <b>Recomendación:</b> revisa observación, evidencia y prioriza la inspección.
                  </div>
                </div>
              </div>

              <button
                type="button"
                style={btnGhostSmall}
                onClick={() => {
                  qs.delete("filter");
                  navigate(`/activities?${qs.toString()}`);
                }}
              >
                Quitar filtro
              </button>
            </div>
          </div>
        ) : null}

        <div style={kpiGrid}>
          <KpiCard title="Pendientes" value={pendingCount} icon="clock" tone="warn" />
          <KpiCard title="Atrasadas" value={lateCount} icon="warn" tone="danger" />
          <KpiCard title="Completadas" value={completedCount} icon="check" tone="success" />
        </div>

        <div style={controlsRow}>
          {canPrintActivities ? (
            <div style={{ ...controlBlock, display: "grid", gap: 8, alignItems: "start" }}>
              <span style={controlLabel}>{cleanUiText("Imprimir actividades:")}</span>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <input type="date" value={printFrom} onChange={(e) => setPrintFrom(e.target.value)} style={controlInput} />
                <span style={{ color: "#64748b", fontWeight: 900 }}>a</span>
                <input type="date" value={printTo} onChange={(e) => setPrintTo(e.target.value)} style={controlInput} />
                <button type="button" onClick={handlePrintActivities} style={btnGhost}>
                  <Icon name="doc" style={{ width: 16, height: 16 }} />
                  <span>Imprimir</span>
                </button>
              </div>
            </div>
          ) : null}
          <div style={controlBlock}>
            <span style={controlLabel}>{cleanUiText("Mes base:")}</span>
            <input
              type="month"
              value={month}
              onChange={(e) => {
                const v = e.target.value;
                setMonth(v);
                setQueryParam("month", v);
              }}
              style={controlInput}
            />
          </div>

          <div style={controlBlock}>
            <span style={controlLabel}>{cleanUiText("Completadas:")}</span>
            <select
              value={completedRange}
              onChange={(e) => setCompletedRange(e.target.value)}
              style={controlSelect}
            >
              <option value="MONTH">Este mes</option>
              <option value="30D">Últimos 30 días</option>
              <option value="90D">Últimos 90 días</option>
            </select>
          </div>
        </div>

        <div style={searchRow}>
          <div style={searchBox}>
            <Icon name="search" style={{ width: 18, height: 18, color: "#0b1b33" }} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={cleanUiText("Buscar actividad, equipo, TAG o lubricante...")}
              style={searchInput}
            />
            {q ? (
              <button type="button" onClick={() => setQ("")} style={iconBtn} title="Limpiar">
                <Icon name="close" style={{ width: 18, height: 18, color: "#0b1b33" }} />
              </button>
            ) : null}
          </div>

          {!isTech ? (
            <select
              value={techFilterId}
              onChange={(e) => setTechFilterId(e.target.value)}
              style={controlSelect}
              title="Filtrar por Técnico"
            >
              <option value="">{cleanUiText("Todos los Técnicos")}</option>
              {techs.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} {t.code ? `(${t.code})` : ""}
                </option>
              ))}
            </select>
          ) : null}

          <button
            type="button"
            onClick={() => setUnassignedOnly((v) => !v)}
            style={{ ...filterBtn, ...(unassignedOnly ? filterBtnOn : {}) }}
          >
            {cleanUiText(unassignedOnly ? "Sin Técnico (activo)" : "Sin Técnico")}
          </button>
        </div>

        <div style={filtersWrap}>
          <div style={filters}>
            {["Hoy", "Todas", "Pendiente", "Atrasada", "Completada"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                type="button"
                style={{
                  ...filterBtn,
                  ...(filter === f ? filterBtnOn : {}),
                }}
              >
                {cleanUiText(f)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p style={{ marginTop: 14, fontWeight: 900, color: "#475569" }}>
            {cleanUiText("Cargando actividades...")}
          </p>
        ) : null}

        {!loading && filtered.length === 0 ? (
          <p style={{ marginTop: 14, fontWeight: 900, color: "#475569" }}>
            {cleanUiText("No hay actividades.")}
          </p>
        ) : null}

        <div style={list}>
          {filtered.map((a) => {
  const isHighlighted = Number(a.id) === Number(highlightExecutionId);

  return (
    <div
      key={a.id}
      ref={isHighlighted ? highlightedCardRef : null}
    >
      <ActivityCard
  activity={a}
  todayYMD={todayYMD}
  onOpen={() => openComplete(a.id)}
  techs={techs}
  onAssignTech={onAssignTech}
  assigningId={assigningId}
  canAssignTech={canAssignTech}
  canCompleteActivities={canCompleteActivities}
  highlighted={isHighlighted}
  isMobile={isMobile}
/>
    </div>
  );
})}
        </div>
      </div>
    </MainLayout>
  );
}

/* =========================
   COMPONENTES UI
========================= */

function KpiCard({ title, value, icon, tone }) {
  const toneMap = {
    warn: { dot: "#f59e0b" },
    danger: { dot: "#ef4444" },
    success: { dot: "#22c55e" },
  };
  const t = toneMap[tone] || toneMap.warn;

  return (
    <div style={kpiCard}>
      <div style={kpiStripe} />
      <div style={kpiBody}>
        <div style={kpiIconWrap}>
          <Icon name={icon} style={{ width: 20, height: 20, color: "#0b1220" }} />
        </div>

        <div style={{ minWidth: 0 }}>
          <div style={kpiValue}>{value}</div>
          <div style={kpiTitle}>
            <span style={{ ...kpiDot, background: t.dot }} />
            {title}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ActivityCard({
  activity,
  onOpen,
  todayYMD,
  techs,
  onAssignTech,
  assigningId,
  canAssignTech,
  canCompleteActivities,
  highlighted = false,
  isMobile = false,
  showPreviewAction = false,
  previewActionLabel = "Abrir",
  compactPreviewMode = false,
}) {
  const mobileView =
    isMobile || (typeof window !== "undefined" && Number(window.innerWidth || 0) <= 820);
  const technicianMode = canCompleteActivities && !canAssignTech && !showPreviewAction;
  const rawPreviewImage =
    activity?.previewImage || activity?.evidenceImage || activity?.routeImage || activity?.imageUrl;
  const browserOnline = typeof navigator === "undefined" ? true : navigator.onLine !== false;
  const localPreview =
    typeof rawPreviewImage === "string" &&
    /^(data:image\/|blob:|https?:\/\/)/i.test(String(rawPreviewImage).trim());
  const evidenceUrl =
    !browserOnline && !localPreview ? "" : buildImgUrl(rawPreviewImage);

  const safeDateLabel = (() => {
    const raw =
      activity?.scheduledAt ||
      activity?.nextExecutionAt ||
      activity?.date ||
      activity?.dateLabel ||
      "";

    if (!raw) return "";

    if (typeof raw === "string" && /^d{4}-d{2}-d{2}/.test(raw)) {
      return raw.slice(0, 10);
    }

    const dt = new Date(raw);
    if (Number.isNaN(dt.getTime())) return activity?.dateLabel || "";

    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const d = String(dt.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  })();

  const normalizedInstructions = String(activity?.instructions || "")
    .replace(/\\s+/g, " ")
    .trim();

  const normalizedNotes = String(activity?.notes || "")
    .replace(/\\s+/g, " ")
    .trim();

  const showInstructions = Boolean(normalizedInstructions);

  const showNotes =
    Boolean(normalizedNotes) &&
    normalizedNotes !== normalizedInstructions &&
    activity?.computedStatus === "Completada";

  const canComplete =
    canCompleteActivities &&
    activity.computedStatus !== "Completada" &&
    Boolean(safeDateLabel) &&
    safeDateLabel <= todayYMD &&
    !activity.isFuture;

  const canOpenPreview = showPreviewAction && typeof onOpen === "function";

  const leftColor =
    activity.computedStatus === "Atrasada"
      ? "#ef4444"
      : activity.computedStatus === "Pendiente"
      ? "#f59e0b"
      : "#22c55e";

  const isCriticalEq = isCriticality(activity?.equipmentCriticality);
  const cardBorder = isCriticalEq ? "rgba(239,68,68,0.35)" : "rgba(226,232,240,0.95)";

  const plannedLubricant = activity?.plannedLubricantLabel || "?";
  const quantityText = activity?.quantityLabel || "?";
  const pointsText =
    activity?.quantityLabel && String(activity.quantityLabel).includes("por punto")
      ? "Por punto"
      : "?";
  const pointsCount = Number(activity?.pointsCount);
  const hasPointsCount = Number.isFinite(pointsCount) && pointsCount > 0;

  const methodText =
    String(activity?.method || "?").trim().toLowerCase() === "grasera"
      ? "Inyector"
      : activity?.method || "?";

  const technicianName =
    activity?.technician?.name ||
    activity?.technicianName ||
    (activity?.technicianId ? `#${activity.technicianId}` : "Sin asignar");

  const statusTone =
    activity.computedStatus === "Atrasada"
      ? {
          accent: "#dc2626",
          bg: "linear-gradient(180deg, rgba(254,242,242,0.98), rgba(255,255,255,0.98))",
          badgeBg: "rgba(239,68,68,0.14)",
          badgeColor: "#991b1b",
          badgeBorder: "rgba(239,68,68,0.34)",
        }
      : activity.isToday
      ? {
          accent: "#d97706",
          bg: "linear-gradient(180deg, rgba(255,251,235,0.98), rgba(255,255,255,0.98))",
          badgeBg: "rgba(245,158,11,0.16)",
          badgeColor: "#92400e",
          badgeBorder: "rgba(245,158,11,0.34)",
        }
      : {
          accent: "#16a34a",
          bg: "linear-gradient(180deg, rgba(240,253,244,0.98), rgba(255,255,255,0.98))",
          badgeBg: "rgba(34,197,94,0.14)",
          badgeColor: "#166534",
          badgeBorder: "rgba(34,197,94,0.32)",
        };

  const technicianStatusText = cleanUiText(
    activity.computedStatus === "Atrasada" && activity.overdueDays > 0
      ? `Atrasada · ${activity.overdueDays} día${activity.overdueDays === 1 ? "" : "s"}`
      : activity.isToday
      ? "Hoy"
      : activity.computedStatus || "Pendiente");

  const quantityCompact = String(quantityText || "?").replace(/\s+por punto/gi, "/punto");
  const showDesktopPreview = !mobileView;
  const compactDesktopCard = compactPreviewMode && !mobileView;

  if (technicianMode) {
    return (
      <div
        style={{
          ...(mobileView ? technicianCardMobile : technicianCardDesktop),
          background: statusTone.bg,
          borderLeft: `8px solid ${statusTone.accent}`,
          cursor: canComplete || canOpenPreview ? "pointer" : "default",
          opacity: activity.computedStatus === "Completada" ? 0.78 : 1,
        }}
        onClick={() => {
          if (canComplete || canOpenPreview) onOpen();
        }}
        title={
          !canComplete && activity.computedStatus !== "Completada"
            ? `Programada para ${safeDateLabel || "?"} (aún no disponible)`
            : ""
        }
      >
        <div style={technicianHeaderRow}>
          <span
            style={{
              ...technicianStatusPill,
              ...(compactDesktopCard ? technicianStatusPillCompact : null),
              background: statusTone.badgeBg,
              color: statusTone.badgeColor,
              borderColor: statusTone.badgeBorder,
            }}
          >
            {technicianStatusText}
          </span>
          {activity?.localSyncStatus === "pending" ? (
            <span style={technicianMetaChip}>
              <Icon name="refresh" size="sm" />
              <span>Pendiente de sincronizar</span>
            </span>
          ) : null}
          {activity?.localSyncStatus === "failed" ? (
            <span style={technicianMetaChip}>
              <Icon name="warn" size="sm" />
              <span>Error de sincronización</span>
            </span>
          ) : null}
          {isCriticalEq ? (
            <span style={technicianMetaChip}>
              <Icon name="alert" size="sm" />
              <span>Equipo crítico</span>
            </span>
          ) : null}
        </div>

        <div style={showDesktopPreview ? { ...technicianDesktopBody, ...(compactDesktopCard ? technicianDesktopBodyCompact : null) } : null}>
          <div style={showDesktopPreview ? { ...technicianDesktopMain, ...(compactDesktopCard ? technicianDesktopMainCompact : null) } : null}>
            <div
              style={{
                ...(mobileView ? technicianTaskTitleMobile : technicianTaskTitleDesktop),
                ...(compactDesktopCard ? technicianTaskTitleCompact : null),
              }}
            >
              {cleanUiText(activity.activityName)}
            </div>

            <div
              style={{
                ...technicianMainFacts,
                ...(compactDesktopCard ? technicianMainFactsCompact : null),
              }}
            >
              <div style={technicianFactLine}>
                <span style={technicianFactIcon}>
                  <Icon name="equipment" size="sm" />
                </span>
                <span style={technicianFactText}>
                  {cleanUiText(activity.equipmentName)}
                  {activity.equipmentCode ? ` (${activity.equipmentCode})` : ""}
                </span>
              </div>

              <div style={technicianFactLine}>
                <span style={technicianFactIcon}>
                  <Icon name="drop" size="sm" />
                </span>
                <span style={technicianFactText}>{cleanUiText(plannedLubricant)}</span>
              </div>

              <div style={technicianFactLine}>
                <span style={technicianFactIcon}>
                  <Icon name="quantity" size="sm" />
                </span>
                <span style={technicianFactText}>{quantityCompact}</span>
                {hasPointsCount ? (
                  <span style={technicianPointsBadge}>
                    {pointsCount} punto{pointsCount === 1 ? "" : "s"}
                  </span>
                ) : null}
              </div>
            </div>

            <div
              style={{
                ...technicianMetaRow,
                ...(compactDesktopCard ? technicianMetaRowCompact : null),
              }}
            >
              {safeDateLabel ? (
                <span style={technicianMetaChip}>
                  <Icon name="calendar" size="sm" />
                  <span>{safeDateLabel}</span>
                </span>
              ) : null}

              <span style={technicianMetaChip}>
                <Icon name="tool" size="sm" />
                <span>{cleanUiText(methodText)}</span>
              </span>

              <span style={technicianMetaChip}>
                <Icon name="user" size="sm" />
                <span>{cleanUiText(technicianName)}</span>
              </span>
            </div>
          </div>

          {showDesktopPreview ? (
            <div style={{ ...technicianPreviewPanel, ...(compactDesktopCard ? technicianPreviewPanelCompact : null) }}>
              {evidenceUrl ? (
                <div style={{ ...technicianEvidenceFrame, ...(compactDesktopCard ? technicianEvidenceFrameCompact : null) }}>
                  <img
                    src={evidenceUrl}
                    alt="Evidencia"
                    style={technicianEvidenceImg}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.parentElement.style.display = "none";
                    }}
                  />
                </div>
              ) : null}

              {showInstructions ? (
                <div style={{ ...technicianInstructionBox, ...(compactDesktopCard ? technicianInstructionBoxCompact : null) }}>
                  <div style={technicianInstructionTitle}>Instrucciones</div>
                  <div style={technicianInstructionText}>{cleanUiText(normalizedInstructions)}</div>
                </div>
              ) : (
                <div style={{ ...technicianInstructionBox, ...(compactDesktopCard ? technicianInstructionBoxCompact : null) }}>
                  <div style={technicianInstructionTitle}>Instrucciones</div>
                  <div style={technicianInstructionText}>Sin instrucciones registradas.</div>
                </div>
              )}

              {showNotes ? (
                <div style={{ ...technicianInstructionBox, ...(compactDesktopCard ? technicianInstructionBoxCompact : null) }}>
                  <div style={technicianInstructionTitle}>Observación</div>
                  <div style={technicianInstructionText}>{cleanUiText(normalizedNotes)}</div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>


        {canComplete ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
            style={mobileView ? technicianCompleteBtnMobile : technicianCompleteBtnDesktop}
            type="button"
          >
            <Icon name="checkCircle" size="sm" />
            <span>Completar</span>
          </button>
        ) : canOpenPreview ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
            style={mobileView ? technicianCompleteBtnMobile : technicianCompleteBtnDesktop}
            type="button"
          >
            <Icon name="search" size="sm" />
            <span>{cleanUiText(previewActionLabel)}</span>
          </button>
        ) : activity.computedStatus !== "Completada" ? (
          <div style={{ ...notReadyBox, width: mobileView ? "100%" : "auto" }}>
            <Icon name="clock" size="sm" />
            <span>No disponible</span>
          </div>
        ) : null}
      </div>
    );
  }

  if (canAssignTech || showPreviewAction) {
    const supervisorStatusText = cleanUiText(
      activity.computedStatus === "Atrasada" && activity.overdueDays > 0
        ? `Atrasada · ${activity.overdueDays} día${activity.overdueDays === 1 ? "" : "s"}`
        : activity.isToday
        ? "Hoy"
        : activity.computedStatus || "Pendiente");

    const showDesktopSupervisorPreview =
      !mobileView && Boolean(evidenceUrl || showInstructions || showNotes);
    const compactDesktopSupervisor = compactPreviewMode && !mobileView;

    return (
      <div
        style={{
          ...(mobileView ? technicianCardMobile : technicianCardDesktop),
          ...(!mobileView && compactDesktopSupervisor ? technicianCardDesktopCompact : null),
          background: statusTone.bg,
          border: highlighted
            ? "2px solid rgba(249,115,22,0.65)"
            : `2px solid ${cardBorder}`,
          borderLeft: `8px solid ${highlighted ? "#f97316" : leftColor}`,
          cursor: canOpenPreview ? "pointer" : "default",
          opacity: activity.computedStatus === "Completada" ? 0.82 : 1,
          boxShadow: highlighted
            ? "0 18px 40px rgba(249,115,22,0.18)"
            : "0 12px 30px rgba(2,6,23,0.06)",
        }}
        onMouseEnter={(e) => {
          if (!canOpenPreview || mobileView) return;
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 18px 38px rgba(2,6,23,0.12)";
        }}
        onMouseLeave={(e) => {
          if (mobileView) return;
          e.currentTarget.style.transform = "translateY(0px)";
          e.currentTarget.style.boxShadow = highlighted
            ? "0 18px 40px rgba(249,115,22,0.18)"
            : "0 12px 30px rgba(2,6,23,0.06)";
        }}
        onClick={() => {
          if (canOpenPreview) onOpen();
        }}
        title={
          !canOpenPreview && activity.computedStatus !== "Completada"
            ? `Programada para ${safeDateLabel || "?"} (aún no disponible)`
            : ""
        }
      >
        <div style={technicianHeaderRow}>
          <span
            style={{
              ...technicianStatusPill,
              ...(compactDesktopSupervisor ? technicianStatusPillCompact : null),
              background: statusTone.badgeBg,
              color: statusTone.badgeColor,
              borderColor: statusTone.badgeBorder,
            }}
          >
            {supervisorStatusText}
          </span>

          <div style={{ ...technicianMetaRow, ...(compactDesktopSupervisor ? technicianMetaRowCompact : null) }}>
            {highlighted ? (
              <span style={technicianMetaChip}>
                <Icon name="bell" size="sm" />
                <span>Desde notificación</span>
              </span>
            ) : null}
            {activity.isManual ? (
              <span style={technicianMetaChip}>
                <Icon name="tool" size="sm" />
                <span>Programada</span>
              </span>
            ) : null}
            {isCriticalEq ? (
              <span style={technicianMetaChip}>
                <Icon name="alert" size="sm" />
                <span>Equipo crítico</span>
              </span>
            ) : null}
          </div>
        </div>

        <div style={showDesktopSupervisorPreview ? { ...technicianDesktopBody, ...(compactDesktopSupervisor ? technicianDesktopBodyCompact : null) } : null}>
          <div style={showDesktopSupervisorPreview ? { ...technicianDesktopMain, ...(compactDesktopSupervisor ? technicianDesktopMainCompact : null) } : null}>
            <div
              style={{
                ...(mobileView ? technicianTaskTitleMobile : technicianTaskTitleDesktop),
                ...(compactDesktopSupervisor ? technicianTaskTitleCompact : null),
              }}
            >
              {cleanUiText(activity.activityName)}
            </div>

            <div
              style={{
                ...technicianMainFacts,
                ...(compactDesktopSupervisor ? technicianMainFactsCompact : null),
              }}
            >
              <div style={technicianFactLine}>
                <span style={technicianFactIcon}>
                  <Icon name="equipment" size="sm" />
                </span>
                <span style={technicianFactText}>
                  {cleanUiText(activity.equipmentName)}
                  {activity.equipmentCode ? ` (${activity.equipmentCode})` : ""}
                </span>
              </div>

              <div style={technicianFactLine}>
                <span style={technicianFactIcon}>
                  <Icon name="drop" size="sm" />
                </span>
                <span style={technicianFactText}>{cleanUiText(plannedLubricant)}</span>
              </div>

              <div style={technicianFactLine}>
                <span style={technicianFactIcon}>
                  <Icon name="quantity" size="sm" />
                </span>
                <span style={technicianFactText}>{quantityCompact}</span>
                {hasPointsCount ? (
                  <span style={technicianPointsBadge}>
                    {pointsCount} punto{pointsCount === 1 ? "" : "s"}
                  </span>
                ) : null}
              </div>
            </div>

            <div
              style={{
                ...technicianMetaRow,
                ...(compactDesktopSupervisor ? technicianMetaRowCompact : null),
              }}
            >
              {safeDateLabel ? (
                <span style={technicianMetaChip}>
                  <Icon name="calendar" size="sm" />
                  <span>{safeDateLabel}</span>
                </span>
              ) : null}

              <span style={technicianMetaChip}>
                <Icon name="tool" size="sm" />
                <span>{cleanUiText(methodText)}</span>
              </span>

              <span style={technicianMetaChip}>
                <Icon name="user" size="sm" />
                <span>{cleanUiText(technicianName)}</span>
              </span>

              {activity.computedStatus === "Completada" && activity.outOfRange ? (
                <span style={technicianMetaChip}>
                  <Icon name="alert" size="sm" />
                  <span>Fuera de rango</span>
                </span>
              ) : null}
            </div>

            {canAssignTech && activity.computedStatus !== "Completada" ? (
              <div
                style={{
                  ...techRow,
                  ...(mobileView ? techRowMobile : null),
                  ...(compactDesktopSupervisor ? techRowCompact : null),
                }}
              >
                <select
                  value={activity.technicianId ?? ""}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => onAssignTech(activity.id, e.target.value)}
                  disabled={assigningId === activity.id}
                  style={{ ...techSelect, ...(mobileView ? techSelectMobile : null) }}
                  title="Asignar técnico"
                >
                  <option value="">Sin asignar</option>
                  {techs.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} {t.code ? `${t.code}` : ""}
                    </option>
                  ))}
                </select>

                {assigningId === activity.id ? (
                  <span style={assigningTxt}>Asignando...</span>
                ) : null}
              </div>
            ) : null}

            {!activity.hasEvidence && !showInstructions && !showNotes && activity.isFuture ? (
              <div style={{ ...futureNote, ...(compactDesktopSupervisor ? futureNoteCompact : null) }}>
                <Icon name="clock" size="sm" />
                <span>Programada para esa fecha (no disponible aún)</span>
              </div>
            ) : null}

            <div
              style={{
                ...supervisorActionRow,
                ...(compactDesktopSupervisor ? supervisorActionRowCompact : null),
              }}
            >
              {canOpenPreview ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpen();
                  }}
                  style={supervisorOpenBtn}
                  type="button"
                >
                  <Icon name="search" size="sm" />
                  <span>{cleanUiText(previewActionLabel)}</span>
                </button>
              ) : (
                <div style={{ ...futureNote, marginTop: 0 }}>
                  <Icon name="clock" size="sm" />
                  <span>No disponible</span>
                </div>
              )}
            </div>
          </div>

          {showDesktopSupervisorPreview ? (
            <div style={{ ...technicianPreviewPanel, ...(compactDesktopSupervisor ? technicianPreviewPanelCompact : null) }}>
              {evidenceUrl ? (
                <div style={{ ...technicianEvidenceFrame, ...(compactDesktopSupervisor ? technicianEvidenceFrameCompact : null) }}>
                  <img
                    src={evidenceUrl}
                    alt="Evidencia"
                    style={technicianEvidenceImg}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.parentElement.style.display = "none";
                    }}
                  />
                </div>
              ) : null}

              {showInstructions ? (
                <div style={{ ...technicianInstructionBox, ...(compactDesktopSupervisor ? technicianInstructionBoxCompact : null) }}>
                  <div style={technicianInstructionTitle}>Instrucciones</div>
                  <div style={technicianInstructionText}>{cleanUiText(normalizedInstructions)}</div>
                </div>
              ) : null}

              {showNotes ? (
                <div style={{ ...technicianInstructionBox, ...(compactDesktopSupervisor ? technicianInstructionBoxCompact : null) }}>
                  <div style={technicianInstructionTitle}>Observación</div>
                  <div style={technicianInstructionText}>{cleanUiText(normalizedNotes)}</div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        ...card,
        ...(mobileView ? cardMobile : null),
        border: highlighted
          ? "2px solid rgba(249,115,22,0.65)"
          : `2px solid ${cardBorder}`,
        borderLeft: `8px solid ${highlighted ? "#f97316" : leftColor}`,
        cursor: canComplete || canOpenPreview ? "pointer" : "default",
        opacity: activity.computedStatus === "Completada" ? 0.78 : 1,
        boxShadow: highlighted
          ? "0 18px 40px rgba(249,115,22,0.18)"
          : "0 12px 30px rgba(2,6,23,0.06)",
      }}
      onMouseEnter={(e) => {
        if ((!canComplete && !canOpenPreview) || mobileView) return;
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 18px 38px rgba(2,6,23,0.12)";
      }}
      onMouseLeave={(e) => {
        if (mobileView) return;
        e.currentTarget.style.transform = "translateY(0px)";
        e.currentTarget.style.boxShadow = highlighted
          ? "0 18px 40px rgba(249,115,22,0.18)"
          : "0 12px 30px rgba(2,6,23,0.06)";
      }}
      onClick={() => {
        if (canComplete || canOpenPreview) onOpen();
      }}
      title={
        !canComplete && activity.computedStatus !== "Completada"
          ? `Programada para ${safeDateLabel || "?"} (aún no disponible)`
          : ""
      }
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={cardTopRow}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={cardTaskLabel}>QUÉ VOY A HACER</div>
            <div style={{ ...cardTaskTitle, ...(mobileView ? cardTaskTitleMobile : null) }}>
              {cleanUiText(activity.activityName)}
            </div>
          </div>

          <div style={cardTopBadges}>
            {activity.isToday ? (
              <span
                style={pillStrong(
                  "rgba(14,165,233,0.14)",
                  "#075985",
                  "rgba(14,165,233,0.40)"
                )}
              >
                HOY
              </span>
            ) : null}

            {highlighted ? (
              <span
                style={pillStrong(
                  "rgba(249,115,22,0.14)",
                  "#9a3412",
                  "rgba(249,115,22,0.40)"
                )}
              >
                Desde notificación
              </span>
            ) : null}

            {activity.computedStatus === "Atrasada" && activity.overdueDays > 0 ? (
              <span
                style={pillStrong(
                  "rgba(239,68,68,0.14)",
                  "#7f1d1d",
                  "rgba(239,68,68,0.40)"
                )}
              >
                {activity.overdueDays} día{activity.overdueDays === 1 ? "" : "s"} tarde
              </span>
            ) : null}

            {activity.isManual ? (
              <span style={miniPill("rgba(249,115,22,0.12)", "#9a3412")}>
                Programada
              </span>
            ) : null}

            {isCriticalEq ? (
              <span style={miniPill("rgba(239,68,68,0.12)", "#7f1d1d")}>
                Equipo crítico
              </span>
            ) : null}
          </div>
        </div>

        <div style={{ ...summaryGrid, ...(mobileView ? summaryGridMobile : null) }}>
          <div style={{ ...summaryCard, ...(mobileView ? summaryCardMobile : null) }}>
            <div style={summaryLabel}>
              <Icon name="equipment" size="sm" />
              <span>Equipo</span>
            </div>
            <div style={{ ...summaryValue, ...(mobileView ? summaryValueMobile : null) }}>
              {cleanUiText(activity.equipmentName)}
            </div>
            <div style={{ ...summarySub, ...(mobileView ? summarySubMobile : null) }}>
              {activity.equipmentCode ? (
                <span style={tagPill}>{activity.equipmentCode}</span>
              ) : null}
              {activity.equipmentLocation ? (
                <span>{activity.equipmentLocation}</span>
              ) : (
                <span>Sin ubicación</span>
              )}
            </div>
          </div>

          <div style={{ ...summaryCard, ...(mobileView ? summaryCardMobile : null) }}>
            <div style={summaryLabel}>
              <Icon name="drop" size="sm" />
              <span>Lubricante</span>
            </div>
            <div style={{ ...summaryValue, ...(mobileView ? summaryValueMobile : null) }}>
              {cleanUiText(plannedLubricant)}
            </div>
            <div style={{ ...summarySub, ...(mobileView ? summarySubMobile : null) }}>
              Producto planeado
            </div>
          </div>

          <div style={{ ...summaryCard, ...(mobileView ? summaryCardMobile : null) }}>
            <div style={summaryLabel}>
              <Icon name="quantity" size="sm" />
              <span>Cantidad</span>
            </div>
            <div style={{ ...summaryValue, ...(mobileView ? summaryValueMobile : null) }}>
              {quantityText}
            </div>
            <div style={{ ...summarySub, ...(mobileView ? summarySubMobile : null), display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span>{pointsText}</span>
              {hasPointsCount ? (
                <span style={{ ...tagPill, fontSize: 12, fontWeight: 900 }}>
                  {pointsCount} punto{pointsCount === 1 ? "" : "s"}
                </span>
              ) : null}
            </div>
          </div>

          <div style={{ ...summaryCard, ...(mobileView ? summaryCardMobile : null) }}>
            <div style={summaryLabel}>
              <Icon name="tool" size="sm" />
              <span>Método</span>
            </div>
            <div style={{ ...summaryValue, ...(mobileView ? summaryValueMobile : null) }}>
              {cleanUiText(methodText)}
            </div>
            <div style={{ ...summarySub, ...(mobileView ? summarySubMobile : null) }}>
              Aplicación
            </div>
          </div>
        </div>

        <div style={{ ...infoRow, ...(mobileView ? infoRowMobile : null) }}>
          {safeDateLabel ? (
            <span style={{ ...infoChip, ...(mobileView ? infoChipMobile : null) }}>
              <Icon name="calendar" size="sm" />
              <span>{safeDateLabel}</span>
            </span>
          ) : null}

            <span style={{ ...infoChip, ...(mobileView ? infoChipMobile : null) }}>
              <Icon name="user" size="sm" />
              <span>
                Técnico:{" "}
                <b style={{ color: "#0f172a" }}>{cleanUiText(technicianName)}</b>
              </span>
            </span>

          {activity.hasEvidence ? (
            <span style={{ ...infoChip, ...(mobileView ? infoChipMobile : null) }}>
              <Icon name="camera" size="sm" />
              <span>Evidencia</span>
            </span>
          ) : null}

          {activity.computedStatus === "Completada" && activity.outOfRange ? (
            <span style={miniPill("rgba(249,115,22,0.14)", "#7c2d12")}>
              Fuera de rango
            </span>
          ) : null}
        </div>

        {showInstructions ? (
          <div style={bigInstructionBadge}>
            <div style={bigInstructionTitle}>
              <Icon name="doc" size="sm" />
              <span>Instrucciones</span>
            </div>
            <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.35 }}>
              {cleanUiText(normalizedInstructions)}
            </div>
          </div>
        ) : null}

        {showNotes ? (
          <div style={noteBox}>
            <div style={noteTitle}>
              <Icon name="doc" size="sm" />
              <span>Observación</span>
            </div>
            <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.35 }}>
              {cleanUiText(normalizedNotes)}
            </div>
          </div>
        ) : null}

        {evidenceUrl ? (
          <div style={{ marginTop: 10 }}>
            <div style={evidenceTitle}>
              <Icon name="camera" size="sm" />
              <span>Evidencia</span>
            </div>

            <img
              src={evidenceUrl}
              alt="Evidencia"
              style={evidenceImg}
              loading="lazy"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
        ) : null}

        {activity.computedStatus !== "Completada" && canAssignTech ? (
          <div style={{ ...techRow, ...(mobileView ? techRowMobile : null) }}>
            <select
              value={activity.technicianId ?? ""}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => onAssignTech(activity.id, e.target.value)}
              disabled={assigningId === activity.id}
              style={{ ...techSelect, ...(mobileView ? techSelectMobile : null) }}
              title="Asignar Técnico"
            >
              <option value="">Sin asignar</option>
              {techs.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} {t.code ? `${t.code}` : ""}
                </option>
              ))}
            </select>

            {assigningId === activity.id ? (
              <span style={assigningTxt}>Asignando...</span>
            ) : null}
          </div>
        ) : null}

        {!canComplete && activity.isFuture ? (
          <div style={futureNote}>
            <Icon name="clock" size="sm" />
            <span>Programada para esa fecha (no disponible aún)</span>
          </div>
        ) : null}
      </div>

      <div style={{ ...cardAside, ...(mobileView ? cardAsideMobile : null) }}>
        <span
          style={{
            ...badge(activity.computedStatus),
            ...(mobileView ? badgeMobile : null),
          }}
        >
          {cleanUiText(activity.computedStatus)}
        </span>

        {canComplete ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
            style={{ ...completeBtnPro, ...(mobileView ? completeBtnProMobile : null) }}
            type="button"
          >
            <Icon name="checkCircle" size="sm" />
            <span>Completar</span>
          </button>
        ) : canOpenPreview ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
            style={{
              ...notReadyBox,
              ...(mobileView ? notReadyBoxMobile : null),
              cursor: "pointer",
              background: "rgba(255,255,255,0.96)",
              color: "#0f172a",
              border: "1px solid rgba(148,163,184,0.35)",
            }}
            type="button"
          >
            <Icon name="search" size="sm" />
            <span>{cleanUiText(previewActionLabel)}</span>
          </button>
        ) : activity.computedStatus !== "Completada" ? (
          <div style={{ ...notReadyBox, ...(mobileView ? notReadyBoxMobile : null) }}>
            <Icon name="clock" size="sm" />
            <span>No disponible</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
/* =========================
   ESTILOS
========================= */

const pageShell = {
  paddingTop: 6,
  display: "grid",
  gap: 14,
};

const kicker = {
  fontSize: 11,
  fontWeight: 950,
  letterSpacing: 1.2,
  color: "#64748b",
};

const title = {
  margin: "6px 0 0",
  fontSize: 22,
  fontWeight: 980,
  letterSpacing: 0.2,
  color: "#0f172a",
};

const subtitle = {
  marginTop: 6,
  fontSize: 13,
  fontWeight: 850,
  color: "#475569",
};

const topBar = {
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "space-between",
  gap: 10,
  flexWrap: "wrap",
  marginBottom: 14,
  padding: "14px 16px",
  borderRadius: 20,
  border: "1px solid rgba(226,232,240,0.95)",
  background: "linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.92) 52%, rgba(255,247,237,0.72) 100%)",
  boxShadow: "0 18px 36px rgba(2,6,23,0.06)",
};

const topActions = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap",
};

/* ===== Buttons ===== */
const btnGhost = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.88)",
  borderRadius: 12,
  padding: "10px 12px",
  cursor: "pointer",
  fontWeight: 950,
  color: "#0f172a",
  boxShadow: "0 10px 22px rgba(2,6,23,0.06)",
  transition: "transform 160ms ease, box-shadow 160ms ease",
};

const btnGhostSmall = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  background: "rgba(255,255,255,0.85)",
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 12,
  padding: "8px 10px",
  cursor: "pointer",
  fontWeight: 950,
  color: "#0f172a",
};

const btnPrimarySlim = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  border: "1px solid rgba(249,115,22,0.55)",
  background: "rgba(249,115,22,0.92)",
  color: "#0b1220",
  borderRadius: 12,
  padding: "10px 12px",
  cursor: "pointer",
  fontWeight: 980,
  boxShadow: "0 14px 28px rgba(249,115,22,0.18)",
  transition: "transform 160ms ease, box-shadow 160ms ease",
};

const btnPrimary = {
  border: "1px solid rgba(249,115,22,0.55)",
  background: "rgba(249,115,22,0.92)",
  color: "#0b1220",
  borderRadius: 12,
  padding: "10px 14px",
  cursor: "pointer",
  fontWeight: 980,
  boxShadow: "0 14px 28px rgba(249,115,22,0.18)",
};

const btnEmergency = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 12px",
  borderRadius: 12,
  background: "rgba(15,23,42,0.90)",
  border: "1px solid rgba(15,23,42,0.80)",
  color: "#fff",
  fontSize: 13,
  fontWeight: 980,
  letterSpacing: 0.2,
  cursor: "pointer",
  boxShadow: "0 12px 26px rgba(2,6,23,0.18)",
  transition: "transform 160ms ease, box-shadow 160ms ease",
};

/* ===== Banner ===== */
const infoBanner = {
  marginTop: 12,
  borderRadius: 16,
  border: "1px solid #bfdbfe",
  background: "rgba(219,234,254,0.48)",
  padding: 12,
  boxShadow: "0 10px 22px rgba(2,6,23,0.04)",
};

const infoIconWrap = {
  width: 34,
  height: 34,
  borderRadius: 12,
  display: "grid",
  placeItems: "center",
  background: "rgba(249,115,22,0.92)",
  border: "1px solid rgba(251,146,60,0.85)",
  boxShadow: "0 10px 22px rgba(249,115,22,0.16)",
};

const infoText = {
  marginTop: 8,
  fontSize: 12,
  color: "#475569",
  fontWeight: 850,
  lineHeight: 1.35,
};

/* ===== KPIs ===== */
const kpiGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 14,
  marginTop: 14,
};

const kpiCard = {
  position: "relative",
  borderRadius: 16,
  border: "2px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.80)",
  boxShadow: "0 12px 28px rgba(2,6,23,0.06)",
  overflow: "hidden",
  minHeight: 92,
};

const kpiStripe = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: 14,
  background: "rgba(15,23,42,0.82)",
};

const kpiBody = {
  padding: "18px 14px 14px",
  display: "flex",
  alignItems: "center",
  gap: 10,
};

const kpiIconWrap = {
  width: 44,
  height: 44,
  borderRadius: 14,
  display: "grid",
  placeItems: "center",
  background: "rgba(249,115,22,0.92)",
  border: "1px solid rgba(251,146,60,0.85)",
  boxShadow: "0 12px 26px rgba(249,115,22,0.16)",
  flex: "0 0 auto",
};

const kpiValue = {
  fontSize: 28,
  fontWeight: 980,
  color: "#0f172a",
  letterSpacing: 0.2,
  lineHeight: 1.05,
};

const kpiTitle = {
  marginTop: 6,
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  fontSize: 13,
  fontWeight: 950,
  color: "#0f172a",
};

const kpiDot = {
  width: 10,
  height: 10,
  borderRadius: 999,
  display: "inline-block",
};

/* ===== Controls / Search ===== */
const controlsRow = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap",
  marginTop: 12,
};

const controlBlock = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
  minWidth: 0,
};

const controlLabel = {
  fontSize: 12,
  color: "#64748b",
  fontWeight: 950,
};

const filterBtn = {
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 999,
  padding: "8px 14px",
  cursor: "pointer",
  boxShadow: "0 10px 22px rgba(2,6,23,0.05)",
  fontWeight: 950,
  background: "rgba(255,255,255,0.88)",
  color: "#0f172a",
};

const filterBtnOn = {
  background: "rgba(249,115,22,0.16)",
  border: "1px solid rgba(249,115,22,0.40)",
  color: "#0f172a",
};

const controlInput = { ...filterBtn, borderRadius: 12, padding: "8px 12px", minWidth: 0 };

const controlSelect = { ...filterBtn, borderRadius: 12, minWidth: 0 };

const searchRow = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  marginTop: 12,
  alignItems: "center",
};

const searchBox = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  background: "rgba(255,255,255,0.90)",
  border: "2px solid rgba(226,232,240,0.95)",
  borderRadius: 14,
  padding: "10px 12px",
  minWidth: 0,
  width: "100%",
  flex: 1,
  boxShadow: "0 12px 24px rgba(2,6,23,0.06)",
};

const searchInput = {
  border: "none",
  outline: "none",
  background: "transparent",
  fontWeight: 950,
  color: "#0f172a",
  minWidth: 0,
  flex: 1,
  width: "100%",
};

const iconBtn = {
  border: "none",
  background: "transparent",
  cursor: "pointer",
  padding: 2,
  display: "grid",
  placeItems: "center",
};

/* ===== Filters wrap ===== */
const filtersWrap = {
  marginTop: 16,
  padding: 12,
  borderRadius: 20,
  border: "1px solid rgba(226,232,240,0.95)",
  background: "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(248,250,252,0.86) 100%)",
  boxShadow: "0 16px 30px rgba(2,6,23,0.05)",
  backdropFilter: "blur(8px)",
};

const filters = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
};


const cardTaskTitleMobile = {
  fontSize: 15,
  lineHeight: 1.15,
};

const summaryCardMobile = {
  padding: "10px 10px 9px",
};

const infoRowMobile = {
  gap: 8,
  marginTop: 10,
};

const infoChipMobile = {
  padding: "7px 9px",
  fontSize: 11,
};

const cardAsideMobile = {
  minWidth: 0,
  width: "100%",
  flexDirection: "column",
  justifyContent: "flex-start",
  alignItems: "stretch",
  gap: 10,
};

const completeBtnProMobile = {
  minWidth: 0,
  width: "100%",
};

const notReadyBoxMobile = {
  minWidth: 0,
  width: "100%",
  padding: "10px 12px",
  fontSize: 11,
};

const techRowMobile = {
  flexDirection: "column",
  alignItems: "stretch",
};

const techSelectMobile = {
  minWidth: 0,
  width: "100%",
};

const badgeMobile = {
  padding: "5px 10px",
  fontSize: 11,
};

/* ===== List / Cards ===== */
const list = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
  marginTop: 14,
};

const supervisorActivitiesListDesktop = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 14,
  marginTop: 14,
  alignItems: "stretch",
};

const card = {
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.99) 0%, rgba(248,250,252,0.96) 100%)",
  borderRadius: 20,
  border: "1px solid rgba(226,232,240,0.95)",
  padding: 16,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 10,
  width: "100%",
  maxWidth: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
  boxShadow: "0 18px 34px rgba(2,6,23,0.06)",
  transition: "transform 160ms ease, box-shadow 160ms ease, opacity 160ms ease",
};

const technicianCardDesktop = {
  borderRadius: 20,
  border: "1px solid rgba(226,232,240,0.96)",
  padding: 16,
  display: "grid",
  gap: 10,
  width: "100%",
  boxSizing: "border-box",
  overflow: "hidden",
  boxShadow: "0 14px 28px rgba(2,6,23,0.06)",
  transition: "transform 160ms ease, box-shadow 160ms ease, opacity 160ms ease",
};

const technicianCardDesktopCompact = {
  padding: 14,
  gap: 10,
};

const technicianCardMobile = {
  ...technicianCardDesktop,
  padding: 12,
  gap: 10,
};

const technicianHeaderRow = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  flexWrap: "wrap",
};

const technicianStatusPill = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "7px 12px",
  borderRadius: 999,
  border: "1px solid transparent",
  fontSize: 12,
  fontWeight: 980,
  letterSpacing: 0.2,
};

const technicianStatusPillCompact = {
  padding: "10px 16px",
  fontSize: 15,
  fontWeight: 1000,
};

const technicianTaskTitleDesktop = {
  fontSize: 26,
  lineHeight: 1.02,
  fontWeight: 1000,
  color: "#0f172a",
  letterSpacing: -0.6,
};

const technicianTaskTitleMobile = {
  fontSize: 20,
  lineHeight: 1.05,
  fontWeight: 1000,
  color: "#0f172a",
  letterSpacing: -0.4,
};

const technicianMainFacts = {
  display: "grid",
  gap: 8,
};

const technicianMainFactsCompact = {
  gridArea: "facts",
  gap: 10,
  alignContent: "center",
};

const technicianFactLine = {
  display: "flex",
  alignItems: "flex-start",
  gap: 10,
};

const technicianFactIcon = {
  width: 30,
  height: 30,
  borderRadius: 10,
  background: "rgba(15,23,42,0.06)",
  color: "#475569",
  display: "grid",
  placeItems: "center",
  flexShrink: 0,
};

const technicianFactText = {
  fontSize: 16,
  lineHeight: 1.3,
  fontWeight: 900,
  color: "#0f172a",
};

const technicianMetaRow = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  alignItems: "center",
};

const technicianMetaRowCompact = {
  gridArea: "meta",
  alignSelf: "center",
};

const technicianMetaChip = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "7px 10px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.88)",
  border: "1px solid rgba(226,232,240,0.96)",
  color: "#475569",
  fontSize: 12,
  fontWeight: 900,
};

const technicianDesktopBody = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.25fr) 280px",
  gap: 18,
  alignItems: "stretch",
};

const technicianDesktopBodyCompact = {
  gridTemplateColumns: "minmax(0, 1fr) 240px",
  gap: 12,
  alignItems: "center",
};

const technicianDesktopMain = {
  display: "grid",
  gap: 10,
  minWidth: 0,
};

const technicianDesktopMainCompact = {
  gridTemplateColumns: "minmax(280px, 1fr) minmax(240px, 0.82fr)",
  gridTemplateAreas: "\"title facts\" \"meta action\"",
  gap: 12,
  alignItems: "center",
};

const technicianPreviewPanel = {
  display: "grid",
  gap: 10,
  minWidth: 0,
  alignSelf: "stretch",
};

const technicianPreviewPanelCompact = {
  gap: 8,
  alignContent: "center",
};

const technicianPointsBadge = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "4px 8px",
  borderRadius: 999,
  background: "rgba(249,115,22,0.12)",
  border: "1px solid rgba(249,115,22,0.28)",
  color: "#9a3412",
  fontSize: 11,
  fontWeight: 950,
  lineHeight: 1,
};

const technicianInstructionBox = {
  padding: "10px 12px",
  borderRadius: 14,
  background: "rgba(255,255,255,0.74)",
  border: "1px solid rgba(251,146,60,0.28)",
};

const technicianInstructionBoxCompact = {
  minHeight: 74,
  padding: "10px 12px",
};

const technicianInstructionTitle = {
  fontSize: 11,
  fontWeight: 950,
  letterSpacing: 0.6,
  textTransform: "uppercase",
  color: "#9a3412",
  marginBottom: 6,
};

const technicianInstructionText = {
  fontSize: 13,
  lineHeight: 1.45,
  color: "#334155",
  fontWeight: 800,
  whiteSpace: "pre-wrap",
};

const technicianEvidenceFrame = {
  width: "100%",
  height: 140,
  borderRadius: 14,
  overflow: "hidden",
  border: "1px solid rgba(226,232,240,0.96)",
  boxShadow: "0 10px 22px rgba(2,6,23,0.06)",
  background: "rgba(248,250,252,0.9)",
};

const technicianEvidenceFrameCompact = {
  height: 92,
};

const technicianEvidenceFrameMobile = {
  ...technicianEvidenceFrame,
  height: 132,
};

const technicianEvidenceImg = {
  width: "100%",
  height: "100%",
  display: "block",
  objectFit: "cover",
};

const technicianCompleteBtnDesktop = {
  width: "fit-content",
  minWidth: 180,
  maxWidth: 240,
  alignSelf: "flex-start",
  minHeight: 52,
  border: "1px solid rgba(34,197,94,0.58)",
  background: "linear-gradient(180deg, rgba(34,197,94,0.98), rgba(22,163,74,0.98))",
  color: "#fff",
  borderRadius: 16,
  padding: "14px 16px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
  fontSize: 17,
  fontWeight: 1000,
  cursor: "pointer",
  boxShadow: "0 16px 28px rgba(34,197,94,0.20)",
};

const supervisorActionRow = {
  marginTop: 6,
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  alignItems: "center",
};

const supervisorActionRowCompact = {
  gridArea: "action",
  alignSelf: "center",
  justifyContent: "flex-start",
  marginTop: 0,
};

const technicianTaskTitleCompact = {
  gridArea: "title",
  fontSize: 34,
  lineHeight: 1,
  alignSelf: "center",
};

const techRowCompact = {
  gridColumn: "2",
  alignSelf: "start",
};

const futureNoteCompact = {
  gridColumn: "2",
  marginTop: 0,
};

const supervisorOpenBtn = {
  width: "fit-content",
  minWidth: 150,
  maxWidth: 220,
  minHeight: 48,
  border: "1px solid rgba(148,163,184,0.30)",
  background: "rgba(255,255,255,0.92)",
  color: "#0f172a",
  borderRadius: 16,
  padding: "12px 16px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
  fontSize: 16,
  fontWeight: 950,
  cursor: "pointer",
};

const technicianCompleteBtnMobile = {
  ...technicianCompleteBtnDesktop,
  width: "100%",
  minWidth: 0,
  maxWidth: "none",
  alignSelf: "stretch",
  minHeight: 50,
  padding: "13px 14px",
  fontSize: 16,
};

const meta = {
  fontSize: 13,
  color: "#64748b",
  display: "flex",
  gap: 14,
  marginTop: 6,
  flexWrap: "wrap",
  fontWeight: 850,
};

const metaLine = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
};

const tagPill = {
  marginLeft: 8,
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "2px 8px",
  borderRadius: 999,
  background: "rgba(15,23,42,0.06)",
  border: "1px solid rgba(15,23,42,0.12)",
  fontWeight: 980,
  color: "#0f172a",
};

const miniTxt = {
  fontSize: 12,
  fontWeight: 950,
};

const badge = (status) => ({
  padding: "6px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 980,
  background:
    status === "Atrasada"
      ? "rgba(239,68,68,0.16)"
      : status === "Pendiente"
      ? "rgba(245,158,11,0.16)"
      : "rgba(34,197,94,0.16)",
  color: status === "Atrasada" ? "#7f1d1d" : status === "Pendiente" ? "#7c2d12" : "#052e16",
  border:
    status === "Atrasada"
      ? "2px solid rgba(239,68,68,0.35)"
      : status === "Pendiente"
      ? "2px solid rgba(245,158,11,0.35)"
      : "2px solid rgba(34,197,94,0.35)",
});

const miniPill = (bg, color) => ({
  background: bg,
  color,
  borderRadius: 999,
  padding: "4px 10px",
  fontSize: 12,
  fontWeight: 980,
  letterSpacing: 0.2,
  border: "1px solid rgba(226,232,240,0.95)",
});

const noteBox = {
  marginTop: 10,
  padding: "10px 12px",
  borderRadius: 14,
  background: "rgba(254, 242, 242, 0.65)",
  border: "2px solid rgba(252, 165, 165, 0.55)",
  color: "#7f1d1d",
  fontWeight: 900,
  fontSize: 13,
  lineHeight: 1.35,
};

const noteTitle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontWeight: 980,
  marginBottom: 6,
  color: "#0f172a",
};

const evidenceTitle = {
  fontSize: 12,
  fontWeight: 950,
  color: "#64748b",
  marginBottom: 6,
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const evidenceImg = {
  width: "min(280px, 100%)",
  borderRadius: 14,
  border: "2px solid rgba(226,232,240,0.95)",
  boxShadow: "0 12px 26px rgba(2,6,23,0.06)",
};


const cardTopRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 10,
  flexWrap: "wrap",
};

const cardTaskLabel = {
  fontSize: 10,
  fontWeight: 950,
  letterSpacing: 1,
  color: "#64748b",
  textTransform: "uppercase",
};

const cardTaskTitle = {
  marginTop: 4,
  fontSize: 18,
  fontWeight: 980,
  color: "#0f172a",
  lineHeight: 1.15,
  letterSpacing: 0.2,
};

const cardTopBadges = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  alignItems: "center",
};

const summaryGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 10,
  marginTop: 14,
};

const summaryCard = {
  padding: "12px 12px 11px",
  borderRadius: 14,
  border: "1px solid rgba(226,232,240,0.95)",
  background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
  boxShadow: "0 10px 22px rgba(2,6,23,0.04)",
};

const summaryLabel = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 11,
  fontWeight: 950,
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: 0.6,
};

const summaryValue = {
  marginTop: 8,
  fontSize: 15,
  fontWeight: 980,
  color: "#0f172a",
  lineHeight: 1.2,
};

const summaryValueMobile = {
  marginTop: 6,
  fontSize: 13,
  lineHeight: 1.15,
};

const summarySub = {
  marginTop: 6,
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
  fontSize: 12,
  fontWeight: 850,
  color: "#475569",
};

const summarySubMobile = {
  marginTop: 4,
  fontSize: 11,
  gap: 6,
};

const infoRow = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  marginTop: 12,
  alignItems: "center",
};

const infoChip = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 10px",
  borderRadius: 999,
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(248,250,252,0.9)",
  color: "#334155",
  fontSize: 12,
  fontWeight: 900,
};

const cardAside = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  justifyContent: "space-between",
  gap: 10,
  minWidth: 150,
};

const completeBtnPro = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  minWidth: 140,
  border: "1px solid rgba(34,197,94,0.55)",
  background: "linear-gradient(180deg, rgba(34,197,94,0.96) 0%, rgba(22,163,74,0.96) 100%)",
  color: "#ffffff",
  borderRadius: 14,
  padding: "12px 16px",
  cursor: "pointer",
  fontWeight: 980,
  boxShadow: "0 14px 28px rgba(34,197,94,0.22)",
};

const notReadyBox = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  minWidth: 140,
  justifyContent: "center",
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(248,250,252,0.92)",
  color: "#64748b",
  borderRadius: 14,
  padding: "12px 16px",
  fontWeight: 950,
  fontSize: 12,
};

const cardMobile = {
  flexDirection: "column",
  alignItems: "stretch",
  padding: 10,
  gap: 10,
  width: "100%",
};

const summaryGridMobile = {
  gridTemplateColumns: "1fr",
};


/* ===== Tech row ===== */
const techRow = {
  marginTop: 10,
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  alignItems: "center",
};

const techSelect = {
  border: "2px solid rgba(226,232,240,0.95)",
  borderRadius: 12,
  padding: "10px 12px",
  fontWeight: 950,
  background: "rgba(255,255,255,0.95)",
  cursor: "pointer",
  minWidth: 220,
};

const assigningTxt = {
  fontSize: 12,
  fontWeight: 950,
  color: "#64748b",
};

const futureNote = {
  marginTop: 10,
  fontSize: 12,
  color: "#475569",
  fontWeight: 950,
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 10px",
  borderRadius: 12,
  background: "rgba(226,232,240,0.45)",
  border: "1px solid rgba(226,232,240,0.95)",
};

/* ===== Errors ===== */
const errorBox = {
  marginTop: 12,
  background: "rgba(239,68,68,0.14)",
  border: "2px solid rgba(239,68,68,0.30)",
  padding: 12,
  borderRadius: 14,
  color: "#7f1d1d",
  fontWeight: 950,
};

/* ===== Big instruction badge ===== */
const bigInstructionBadge = {
  marginTop: 10,
  padding: "12px 14px",
  borderRadius: 16,
  background: "rgba(255,247,237,0.78)",
  border: "2px solid rgba(251,146,60,0.45)",
  color: "#7c2d12",
  fontWeight: 900,
  fontSize: 13,
  boxShadow: "0 12px 24px rgba(2,6,23,0.05)",
};

const bigInstructionTitle = {
  fontWeight: 980,
  marginBottom: 6,
  display: "flex",
  alignItems: "center",
  gap: 8,
  color: "#0f172a",
};

/* ===== Modal ===== */
const modalOverlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(2,6,23,0.60)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 16,
  zIndex: 60,
};

const modalCard = {
  width: "min(560px, 100%)",
  background: "#fff",
  borderRadius: 16,
  border: "2px solid rgba(226,232,240,0.95)",
  padding: 14,
  boxShadow: "0 22px 46px rgba(2,6,23,0.22)",
};

const modalHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 10,
  marginBottom: 10,
};

const modalKicker = {
  fontSize: 11,
  fontWeight: 980,
  letterSpacing: 1.1,
  color: "#64748b",
};

const modalTitle = {
  marginTop: 4,
  fontWeight: 980,
  color: "#0f172a",
  fontSize: 16,
};

const modalHint = {
  color: "#475569",
  fontWeight: 850,
  fontSize: 13,
  lineHeight: 1.35,
  marginTop: 4,
};

const lbl = {
  fontWeight: 950,
  fontSize: 12,
  color: "#475569",
  display: "grid",
  gap: 6,
};

const modalInput = {
  border: "2px solid rgba(226,232,240,0.95)",
  borderRadius: 14,
  padding: "10px 12px",
  fontWeight: 950,
  background: "rgba(255,255,255,0.96)",
  boxShadow: "0 10px 22px rgba(2,6,23,0.05)",
};

const pillStrong = (bg, color, border) => ({
  background: bg,
  color,
  borderRadius: 999,
  padding: "5px 12px",
  fontSize: 12,
  fontWeight: 980,
  letterSpacing: 0.25,
  border: `2px solid ${border}`,
  boxShadow: "0 10px 22px rgba(2,6,23,0.06)",
});

/* ===== Center complete animation ===== */
const centerOverlay = {
  position: "fixed",
  inset: 0,
  zIndex: 80,
  background: "rgba(2,6,23,0.35)",
  display: "grid",
  placeItems: "center",
  padding: 16,
};

const offlineBanner = {
  marginTop: 12,
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  alignItems: "center",
  flexWrap: "wrap",
  padding: "16px 18px",
  borderRadius: 18,
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.92)",
  boxShadow: "0 12px 30px rgba(2,6,23,0.06)",
};

const offlineBannerPill = {
  padding: "10px 12px",
  borderRadius: 999,
  background: "rgba(249,115,22,0.12)",
  color: "#9a3412",
  fontWeight: 900,
  fontSize: 12,
  border: "1px solid rgba(249,115,22,0.24)",
};

const centerCard = {
  width: "min(340px, 90vw)",
  borderRadius: 18,
  border: "2px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.96)",
  boxShadow: "0 26px 56px rgba(2,6,23,0.22)",
  padding: "14px 14px 12px",
  textAlign: "center",
  animation: "lpPulse 260ms ease-out",
};

const centerIconWrap = {
  width: 50,
  height: 50,
  borderRadius: 18,
  margin: "0 auto 8px",
  display: "grid",
  placeItems: "center",
  background: "rgba(249,115,22,0.92)",
  border: "1px solid rgba(251,146,60,0.85)",
  boxShadow: "0 14px 30px rgba(249,115,22,0.18)",
};



















































