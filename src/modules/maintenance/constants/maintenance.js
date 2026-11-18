// Work order states
export const WORK_ORDER_STATES = {
  REQUESTED: "REQUESTED",
  REJECTED: "REJECTED",
  APPROVED: "APPROVED",
  ASSIGNED: "ASSIGNED",
  IN_PROGRESS: "IN_PROGRESS",
  WAITING_PARTS: "WAITING_PARTS",
  WAITING_PRODUCTION: "WAITING_PRODUCTION",
  FINISHED: "FINISHED",
  VALIDATED: "VALIDATED",
  CANCELLED: "CANCELLED",
};

// Work order state labels in Spanish
export const STATE_LABELS = {
  REQUESTED: "Solicitado",
  REJECTED: "Rechazado",
  APPROVED: "Aprobado",
  ASSIGNED: "Asignado",
  IN_PROGRESS: "En progreso",
  WAITING_PARTS: "Esperando refacciones",
  WAITING_PRODUCTION: "Esperando producción",
  FINISHED: "Finalizado",
  VALIDATED: "Validado",
  CANCELLED: "Cancelado",
};

// Priority levels
export const PRIORITIES = {
  CRITICAL: "CRITICAL",
  HIGH: "HIGH",
  MEDIUM: "MEDIUM",
  LOW: "LOW",
};

// Priority labels in Spanish
export const PRIORITY_LABELS = {
  CRITICAL: "Crítica",
  HIGH: "Alta",
  MEDIUM: "Media",
  LOW: "Baja",
};

// Priority colors (steel blue accent #38BDF8 for LOW, others as defined)
export const PRIORITY_COLORS = {
  CRITICAL: { bg: "#fee2e2", text: "#991b1b", border: "#fecaca" }, // Red
  HIGH: "#f97316", // Orange
  MEDIUM: "#eab308", // Yellow
  LOW: "#38bdf8", // Steel blue (LubriPlan maintenance accent)
};

// State colors for UI display
export const STATE_COLORS = {
  REQUESTED: "#94a3b8", // Gray-blue
  REJECTED: "#991b1b", // Dark red
  APPROVED: "#065f46", // Dark green
  ASSIGNED: "#1d4ed8", // Dark blue
  IN_PROGRESS: "#7c3aed", // Purple
  WAITING_PARTS: "#f97316", // Orange
  WAITING_PRODUCTION: "#f59e0b", // Amber
  FINISHED: "#22c55e", // Green
  VALIDATED: "#10b981", // Emerald
  CANCELLED: "#6b7280", // Gray
};

// API Error codes
export const ERROR_CODES = {
  MAINTENANCE_NOT_ENABLED: "MAINTENANCE_NOT_ENABLED",
  FORBIDDEN: "FORBIDDEN",
  CONFLICT: "CONFLICT",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
};

// Error messages in Spanish
export const ERROR_MESSAGES = {
  MAINTENANCE_NOT_ENABLED: "Acceso a Mantenimiento no habilitado para esta planta.",
  FORBIDDEN: "No tienes permisos para realizar esta acción.",
  CONFLICT: "Los datos cambiaron mientras editabas. Por favor recarga la página.",
  NOT_FOUND: "El recurso no fue encontrado.",
  VALIDATION_ERROR: "Por favor verifica los datos ingresados.",
  NETWORK_ERROR: "Error de conexión. Intenta de nuevo.",
  UNKNOWN_ERROR: "Error inesperado. Por favor intenta de nuevo.",
};

// Roles allowed per action
export const ROLE_PERMISSIONS = {
  VIEW_MODULE: ["ADMIN", "SUPERVISOR", "TECHNICIAN"],
  CREATE_ASSET: ["ADMIN", "SUPERVISOR"],
  EDIT_ASSET: ["ADMIN", "SUPERVISOR"],
  DELETE_ASSET: ["ADMIN"],
  CREATE_WORK_ORDER: ["ADMIN", "SUPERVISOR"],
  APPROVE_WORK_ORDER: ["SUPERVISOR"],
  REJECT_WORK_ORDER: ["SUPERVISOR"],
  ASSIGN_WORK_ORDER: ["SUPERVISOR"],
  EXECUTE_WORK_ORDER: ["ADMIN", "SUPERVISOR", "TECHNICIAN"],
  VALIDATE_WORK_ORDER: ["SUPERVISOR"],
};

// Transitions: from -> possible states
export const VALID_TRANSITIONS = {
  REQUESTED: ["APPROVED", "REJECTED"],
  REJECTED: ["REQUESTED"],
  APPROVED: ["ASSIGNED", "CANCELLED"],
  ASSIGNED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["WAITING_PARTS", "WAITING_PRODUCTION", "FINISHED"],
  WAITING_PARTS: ["IN_PROGRESS", "CANCELLED"],
  WAITING_PRODUCTION: ["IN_PROGRESS", "CANCELLED"],
  FINISHED: ["VALIDATED", "CANCELLED"],
  VALIDATED: [],
  CANCELLED: [],
};

// Mobile breakpoint
export const MOBILE_BREAKPOINT = 820;

// Maintenance accent color (steel blue)
export const MAINTENANCE_ACCENT = "#38bdf8";

// Timeout for API requests (ms)
export const API_TIMEOUT = 60000;

// Number of items per page for lists
export const PAGE_SIZE = 20;

// Photo kinds for upload
export const PHOTO_KINDS = {
  BEFORE: "BEFORE",
  AFTER: "AFTER",
  GENERAL: "GENERAL",
};

// ---------- Activos ----------
// Niveles de la jerarquía (de mayor a menor)
export const ASSET_LEVELS = [
  { value: "AREA", label: "Área" },
  { value: "LINE", label: "Línea" },
  { value: "EQUIPMENT", label: "Equipo" },
  { value: "SUBASSEMBLY", label: "Subensamble" },
  { value: "COMPONENT", label: "Componente" },
];
export const ASSET_LEVEL_LABELS = Object.fromEntries(ASSET_LEVELS.map((l) => [l.value, l.label]));

export const ASSET_STATUSES = [
  { value: "OPERATING", label: "Operando", badge: "success" },
  { value: "STOPPED", label: "Detenido", badge: "warning" },
  { value: "OUT_OF_SERVICE", label: "Fuera de servicio", badge: "danger" },
];
export const ASSET_STATUS_INFO = Object.fromEntries(ASSET_STATUSES.map((s) => [s.value, s]));

export const ASSET_CRITICALITIES = [
  { value: "A", label: "Crítica (A)", short: "Crítica", badge: "danger" },
  { value: "B", label: "Moderada (B)", short: "Moderada", badge: "warning" },
  { value: "C", label: "Baja (C)", short: "Baja", badge: "info" },
];
export const ASSET_CRITICALITY_INFO = Object.fromEntries(ASSET_CRITICALITIES.map((c) => [c.value, c]));
