export function getRouteKindPrefix(routeKind) {
  return String(routeKind || "").trim().toUpperCase() === "INSPECTION"
    ? "Inspección de"
    : "Lubricación de";
}

export function stripRouteKindPrefix(value) {
  return String(value || "")
    .replace(/^\s*(inspecci[oó]n|lubricaci[oó]n)\s+de\s+/i, "")
    .replace(/^\s+/, "");
}

export function formatRouteDisplayName(name, routeKind, fallback = "") {
  const rawName = String(name || "");
  const normalizedKind = String(routeKind || "").trim().toUpperCase();

  if (!rawName.trim()) return fallback;

  if (normalizedKind !== "INSPECTION" && normalizedKind !== "LUBRICATION") {
    return rawName.trim();
  }

  const baseName = stripRouteKindPrefix(rawName).trim();
  if (!baseName) return fallback;

  return `${getRouteKindPrefix(normalizedKind)} ${baseName}`.trim();
}
