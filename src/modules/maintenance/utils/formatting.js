import { STATE_LABELS, PRIORITY_LABELS } from "../constants/maintenance";

export function formatState(state) {
  return STATE_LABELS[state] || state;
}

export function formatPriority(priority) {
  return PRIORITY_LABELS[priority] || priority;
}

export function formatDate(date) {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("es-MX", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(date) {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("es-MX", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
