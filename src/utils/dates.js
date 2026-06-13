/ src/utils/dates.js
export function toStartOfDaySafe(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isValidDate(d) {
  const dt = new Date(d);
  return !Number.isNaN(dt.getTime());
}