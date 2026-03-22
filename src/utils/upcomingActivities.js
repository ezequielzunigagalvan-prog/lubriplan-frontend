import { parseISO } from "date-fns";

export function getUpcomingActivities(activities, periodFilter, today) {
  return activities
    .filter(a => {
      if (a.status !== "pendiente" || !a.scheduled_date) return false;
      const scheduledDate = parseISO(a.scheduled_date);

      if (periodFilter === "daily") {
        return scheduledDate.toDateString() === today.toDateString();
      }

      if (periodFilter === "weekly") {
        const weekEnd = new Date(today);
        weekEnd.setDate(today.getDate() + 7);
        return scheduledDate >= today && scheduledDate <= weekEnd;
      }

      if (periodFilter === "monthly") {
        const monthEnd = new Date(today);
        monthEnd.setMonth(today.getMonth() + 1);
        return scheduledDate >= today && scheduledDate <= monthEnd;
      }

      return true;
    })
    .sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date))
    .slice(0, 10);
}