import { getActivityStatus } from "./activityStatus";

export function getRouteStatus(activities) {
  const statuses = activities.map(getActivityStatus);

  if (statuses.includes("Atrasada")) return "Atrasada";
  if (statuses.includes("Pendiente")) return "Pendiente";
  return "Completada";
}