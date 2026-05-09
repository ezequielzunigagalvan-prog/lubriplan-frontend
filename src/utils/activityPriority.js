function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
}

export function getSuggestedActivityOrder(activities = []) {
  const getPriority = (activity) => {
    const status = normalizeText(activity?.computedStatus);
    const criticality = normalizeText(activity?.equipmentCriticality);
    const isCritical = criticality === "CRITICA" || criticality === "ALTA";
    const overdueDays = Number(activity?.overdueDays || 0);

    if (status === "COMPLETADA") {
      return 9999;
    }

    if (status === "ATRASADA" && isCritical) {
      return 1 - overdueDays * 0.01;
    }

    if (status === "ATRASADA") {
      return 10 - overdueDays * 0.01;
    }

    if (activity?.isToday && isCritical) {
      return 20;
    }

    if (activity?.isToday) {
      return 30;
    }

    if (status === "PENDIENTE" && isCritical) {
      return 40;
    }

    return 100;
  };

  return [...activities].sort((a, b) => {
    const pa = getPriority(a);
    const pb = getPriority(b);

    if (pa !== pb) return pa - pb;

    const da = a?.dateISO ? new Date(a.dateISO).getTime() : 0;
    const db = b?.dateISO ? new Date(b.dateISO).getTime() : 0;

    if (normalizeText(a?.computedStatus) === "COMPLETADA" && normalizeText(b?.computedStatus) === "COMPLETADA") {
      return db - da;
    }

    return da - db;
  });
}
