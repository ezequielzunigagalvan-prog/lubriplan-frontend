export function isLate(dateStr) {
  const today = new Date();
  const date = new Date(dateStr);

  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  return date < today;
}