export function getActivityStatus(activity) {
  if (activity.status === "completada") {
    return "Completada";
  }

  const today = new Date();
  const activityDate = new Date(activity.date);

  if (activityDate < today) {
    return "Atrasada";
  }

  return "Pendiente";
}