// src/components/routes/NewRouteModal.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  createRoute,
  updateRoute,
  uploadRouteImage,
} from "../../services/routesService";
import { getEquipment } from "../../services/equipmentService";
import { getLubricants } from "../../services/lubricantsService";
import { getTechnicians } from "../../services/techniciansService";
import { Icon } from "../ui/lpIcons";
import { usePlant } from "../../context/PlantContext";
import { API_ASSETS_URL } from "../../services/api";

/* ================== HELPERS ================== */
const WEEK_DAYS = [
  { value: "MON", label: "Lun", jsDay: 1 },
  { value: "TUE", label: "Mar", jsDay: 2 },
  { value: "WED", label: "Mié", jsDay: 3 },
  { value: "THU", label: "Jue", jsDay: 4 },
  { value: "FRI", label: "Vie", jsDay: 5 },
  { value: "SAT", label: "Sáb", jsDay: 6 },
  { value: "SUN", label: "Dom", jsDay: 0 },
];

const WEEK_DAY_TO_NUMBER = {
  MON: 1,
  TUE: 2,
  WED: 3,
  THU: 4,
  FRI: 5,
  SAT: 6,
  SUN: 7,
};

const NUMBER_TO_WEEK_DAY = {
  1: "MON",
  2: "TUE",
  3: "WED",
  4: "THU",
  5: "FRI",
  6: "SAT",
  7: "SUN",
};

function normalizeWeeklyDaysFromBackend(days) {
  if (!Array.isArray(days)) return [];
  return days
    .map((d) => {
      if (typeof d === "string" && WEEK_DAY_TO_NUMBER[d]) return d;
      const n = Number(d);
      return NUMBER_TO_WEEK_DAY[n] || null;
    })
    .filter(Boolean);
}

function mapWeeklyDaysToBackend(days) {
  if (!Array.isArray(days)) return [];
  return Array.from(
    new Set(
      days
        .map((d) => WEEK_DAY_TO_NUMBER[String(d).toUpperCase()] || null)
        .filter(Boolean)
    )
  ).sort((a, b) => a - b);
}

const toYMD = (v) => {
  if (!v) return "";
  if (typeof v === "string") return v.slice(0, 10);
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    const y = v.getFullYear();
    const m = String(v.getMonth() + 1).padStart(2, "0");
    const d = String(v.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return "";
};

function parseLocalDate(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = String(dateStr).split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function formatLocalYMD(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getLastDayOfMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function addMonthsKeepingDay(date, monthsToAdd) {
  const source = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const rawMonth = source.getMonth() + monthsToAdd;
  const year = source.getFullYear() + Math.floor(rawMonth / 12);
  const month = ((rawMonth % 12) + 12) % 12;

  const desiredDay = source.getDate();
  const maxDay = getLastDayOfMonth(year, month);
  const finalDay = Math.min(desiredDay, maxDay);

  return new Date(year, month, finalDay);
}

function addYearsKeepingDay(date, yearsToAdd) {
  const source = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const year = source.getFullYear() + yearsToAdd;
  const month = source.getMonth();
  const desiredDay = source.getDate();
  const maxDay = getLastDayOfMonth(year, month);
  const finalDay = Math.min(desiredDay, maxDay);

  return new Date(year, month, finalDay);
}

function getNextDateByFrequency(lastDateStr, frequency, weeklyDays = []) {
  const baseDate = parseLocalDate(lastDateStr);
  if (!baseDate || !frequency) return "";

  if (frequency === "Diario") {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + 1);
    return formatLocalYMD(d);
  }

  if (frequency === "Semanal") {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + 7);
    return formatLocalYMD(d);
  }

  if (frequency === "Quincenal") {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + 15);
    return formatLocalYMD(d);
  }

  if (frequency === "Mensual") {
    return formatLocalYMD(addMonthsKeepingDay(baseDate, 1));
  }

  if (frequency === "Bimestral") {
    return formatLocalYMD(addMonthsKeepingDay(baseDate, 2));
  }

  if (frequency === "Cuatrimestral") {
    return formatLocalYMD(addMonthsKeepingDay(baseDate, 4));
  }

  if (frequency === "Semestral") {
    return formatLocalYMD(addMonthsKeepingDay(baseDate, 6));
  }

  if (frequency === "Anual") {
    return formatLocalYMD(addYearsKeepingDay(baseDate, 1));
  }

  if (frequency === "Varias veces por semana") {
    const selectedDays = WEEK_DAYS.filter((d) => weeklyDays.includes(d.value)).map(
      (d) => d.jsDay
    );

    if (!selectedDays.length) return "";

    const currentDay = baseDate.getDay();
    const sorted = [...selectedDays].sort((a, b) => a - b);

    for (const day of sorted) {
      if (day > currentDay) {
        const next = new Date(baseDate);
        next.setDate(next.getDate() + (day - currentDay));
        return formatLocalYMD(next);
      }
    }

    const firstDay = sorted[0];
    const delta = 7 - currentDay + firstDay;
    const next = new Date(baseDate);
    next.setDate(next.getDate() + delta);
    return formatLocalYMD(next);
  }

  return "";
}


const buildImgUrl = (raw) => {
  if (!raw) return "";
  const s = String(raw);
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.startsWith("/")) return `${API_ASSETS_URL}${s}`;
  return `${API_ASSETS_URL}/${s}`;
};

const norm = (v) => String(v ?? "").toLowerCase().trim();
const clamp2 = (n) => (Number.isFinite(n) ? Math.round(n * 100) / 100 : 0);

const buildAdvancedPointsBlock = (items, unit) => {
  if (!Array.isArray(items) || items.length === 0) return "";

  const lines = items.map((p, idx) => {
    const name = String(p?.name || `Punto ${idx + 1}`).trim() || `Punto ${idx + 1}`;
    const qty = p?.qty != null && p?.qty !== "" ? clamp2(Number(p.qty)) : 0;
    return `${idx + 1}) ${name} — ${qty}${unit ? ` ${unit}` : ""}`;
  });

  return ["", "— — —", "PUNTOS (AVANZADO)", ...lines, "— — —", ""].join("\n");
};

const stripAdvancedBlock = (text) => {
  const s = String(text || "");
  if (!s.includes("PUNTOS (AVANZADO)")) return s.trim();

  const re = /\n— — —\nPUNTOS \(AVANZADO\)[\s\S]*?\n— — —\n?/g;
  return s.replace(re, "\n").trim();
};

/* ================== INPUTS ================== */
const FieldShell = ({ label, hint, active, children }) => (
  <div style={field}>
    <label style={labelStyle}>{label}</label>
    <div style={{ ...rowShell, ...(active ? rowShellActive : null) }}>{children}</div>
    {hint ? <div style={hintStyle}>{hint}</div> : null}
  </div>
);

const Input = ({ label, hint, active, ...props }) => (
  <FieldShell label={label} hint={hint} active={active}>
    <input {...props} style={rowInput} />
  </FieldShell>
);

const Textarea = ({ label, hint, active, ...props }) => (
  <FieldShell label={label} hint={hint} active={active}>
    <textarea
      {...props}
      style={{ ...rowInput, minHeight: 110, resize: "vertical" }}
    />
  </FieldShell>
);

const Select = ({ label, options, hint, active, ...props }) => (
  <FieldShell label={label} hint={hint} active={active}>
    <select {...props} style={rowInput}>
      <option value="">Seleccionar</option>
      {options.map((o) =>
        typeof o === "string" ? (
          <option key={o} value={o}>
            {o}
          </option>
        ) : (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        )
      )}
    </select>
  </FieldShell>
);

/* ================== MODAL ================== */
export default function NewRouteModal({ open, onClose, onSave, initialData }) {
  const fileRef = useRef(null);
  const { currentPlantId, currentPlant } = usePlant();

  const initialState = {
    name: "",
    equipmentId: "",
    equipmentName: "",
    equipmentCode: "",
    equipmentLocation: "",
    lockEquipment: false,

    lubricantType: "",
    quantity: "",
    frequency: "Mensual",
    weeklyDays: [],

    lubricantId: "",
    lubricantName: "",
    technicianId: "",

    unit: "ml",
    pumpStrokeValue: "",
    pumpStrokeUnit: "g",

    method: "Manual",
    points: "",
    instructions: "",
    lastDate: "",
    nextDate: "",
    imageUrl: "",
  };

  const [form, setForm] = useState(initialState);
  const [equipments, setEquipments] = useState([]);
  const [lubricants, setLubricants] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [saving, setSaving] = useState(false);

  const [equipmentSearch, setEquipmentSearch] = useState("");
  const [pointsMode, setPointsMode] = useState("simple");
  const [pointsItems, setPointsItems] = useState([{ name: "", qty: "" }]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [activeField, setActiveField] = useState("");

  const frequencyFromDays = (days) => {
    const n = Number(days);
    if (n === 1) return "Diario";
    if (n === 7) return "Semanal";
    if (n === 15) return "Quincenal";
    if (n === 30) return "Mensual";
    if (n === 60) return "Bimestral";
    if (n === 120) return "Cuatrimestral";
    if (n === 180) return "Semestral";
    if (n === 365) return "Anual";
    return "Mensual";
  };

  const isBombazos = String(form.unit || "").toUpperCase() === "BOMBAZOS";

  /* ===== abrir / editar ===== */
useEffect(() => {
  if (!open) return;

  console.log(">>> initialData modal =", initialData);

  const data = initialData || {};
  const initialUnit = data.unit ?? "ml";

  const normalizedWeeklyDays = normalizeWeeklyDaysFromBackend(data.weeklyDays);
  const backendFrequencyType = String(data.frequencyType || "").trim().toUpperCase();

  const resolvedFrequency =
    backendFrequencyType === "WEEKLY" && normalizedWeeklyDays.length > 0
      ? "Varias veces por semana"
      : data.frequencyDays != null
      ? frequencyFromDays(data.frequencyDays)
      : data.frequency
      ? data.frequency
      : "Mensual";

  setForm({
    name: data.name ?? "",
    equipmentId: data.equipmentId != null ? String(data.equipmentId) : "",
    equipmentName: data.equipmentName ?? "",
    equipmentCode: data.equipmentCode ?? "",
    equipmentLocation: data.equipmentLocation ?? "",
    lockEquipment: Boolean(data.lockEquipment),

    lubricantType: data.lubricantType ?? "",
    quantity: data.quantity != null ? String(data.quantity) : "",
    frequency: resolvedFrequency,
    weeklyDays: normalizedWeeklyDays,

    lubricantId: data.lubricantId != null ? String(data.lubricantId) : "",
    lubricantName:
      data.lubricantId != null && String(data.lubricantId) !== ""
        ? ""
        : data.lubricantName ?? "",
    technicianId: data.technicianId != null ? String(data.technicianId) : "",

    unit: initialUnit,
    pumpStrokeValue:
      data.pumpStrokeValue != null && data.pumpStrokeValue !== ""
        ? String(data.pumpStrokeValue)
        : "",
    pumpStrokeUnit: data.pumpStrokeUnit ?? "g",

    method: data.method ?? "Manual",
    points: data.points != null ? String(data.points) : "",
    instructions: data.instructions ?? "",
    lastDate: toYMD(data.lastDate ?? ""),
    nextDate: toYMD(data.nextDate ?? ""),
    imageUrl: data.imageUrl ?? "",
  });

  setPointsMode("simple");
  setPointsItems([{ name: "", qty: "" }]);
  setEquipmentSearch("");
  setActiveField("");
  setImageFile(null);
  setImagePreview("");
}, [open, initialData]);

  /* ===== liberar objectURL ===== */
  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(imagePreview);
        } catch {}
      }
    };
  }, [imagePreview]);

  /* ===== reset parcial al cambiar planta ===== */
useEffect(() => {
  if (!open) return;

  setEquipmentSearch("");
  setEquipments([]);
  setLubricants([]);
  setTechnicians([]);

  if (imagePreview?.startsWith("blob:")) {
    try {
      URL.revokeObjectURL(imagePreview);
    } catch {}
  }

  setImageFile(null);
  setImagePreview("");

  setForm((prev) => ({
    ...prev,
    equipmentId: prev.lockEquipment ? prev.equipmentId : "",
    equipmentName: prev.lockEquipment ? prev.equipmentName : "",
    equipmentCode: prev.lockEquipment ? prev.equipmentCode : "",
    equipmentLocation: prev.lockEquipment ? prev.equipmentLocation : "",
    lockEquipment: Boolean(prev.lockEquipment),
  }));
}, [currentPlantId, open]);

  /* ===== cargar lubricantes ===== */
  useEffect(() => {
    if (!open || !currentPlantId) return;

    let alive = true;

    (async () => {
      try {
        const data = await getLubricants();
        if (!alive) return;
        const items = Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data)
          ? data
          : [];
        setLubricants(items);
      } catch (e) {
        console.error(e);
        if (!alive) return;
        setLubricants([]);
      }
    })();

    return () => {
      alive = false;
    };
  }, [open, currentPlantId]);

  /* ===== cargar técnicos ===== */
  useEffect(() => {
    if (!open || !currentPlantId) return;

    let alive = true;

    (async () => {
      try {
        const data = await getTechnicians();
        if (!alive) return;

        const items = Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data)
          ? data
          : [];

        setTechnicians(items);
      } catch (err) {
        console.error("Error cargando técnicos:", err);
        if (!alive) return;
        setTechnicians([]);
      }
    })();

    return () => {
      alive = false;
    };
  }, [open, currentPlantId]);

  /* ===== cargar equipos ===== */
  useEffect(() => {
    if (!open || !currentPlantId) return;

    let alive = true;

    (async () => {
      try {
        const data = await getEquipment();
        if (!alive) return;

        const items = Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data)
          ? data
          : [];

        setEquipments(items);
      } catch (err) {
        console.error("Error cargando equipos:", err);
        if (!alive) return;
        setEquipments([]);
      }
    })();

    return () => {
      alive = false;
    };
  }, [open, currentPlantId]);

  /* ===== completar datos visibles del equipo preseleccionado ===== */
  useEffect(() => {
    if (!open) return;
    if (!form.equipmentId) return;
    if (!Array.isArray(equipments) || equipments.length === 0) return;

    const selected = equipments.find((e) => String(e.id) === String(form.equipmentId));
    if (!selected) return;

    setForm((prev) => {
      const nextName = prev.equipmentName || selected.name || "";
      const nextCode = prev.equipmentCode || selected.code || selected.tag || "";
      const nextLocation = prev.equipmentLocation || selected.location || "";

      if (
        nextName === prev.equipmentName &&
        nextCode === prev.equipmentCode &&
        nextLocation === prev.equipmentLocation
      ) {
        return prev;
      }

      return {
        ...prev,
        equipmentName: nextName,
        equipmentCode: nextCode,
        equipmentLocation: nextLocation,
      };
    });
  }, [open, equipments, form.equipmentId]);

  /* ===== autocompletar unidad por inventario ===== */
 useEffect(() => {
  if (!form.lubricantId) return;
  const selected = lubricants.find((l) => String(l.id) === String(form.lubricantId));
  if (!selected?.unit) return;

  setForm((prev) => {
    if (String(prev.unit || "").toUpperCase() === "BOMBAZOS") return prev;

    // Si la ruta ya trae una unidad guardada, no la sobrescribas.
    if (String(prev.unit || "").trim() !== "") return prev;

    return { ...prev, unit: selected.unit };
  });
}, [form.lubricantId, lubricants]);

  /* ===== bloqueo scroll ===== */
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [open]);

  /* ===== validar equipo existente ===== */
  useEffect(() => {
    if (!open) return;
    if (!form.equipmentId) return;
    if (!Array.isArray(equipments) || equipments.length === 0) return;

    const exists = equipments.some((e) => String(e.id) === String(form.equipmentId));
    if (!exists) {
      setForm((prev) => ({
        ...prev,
        equipmentId: "",
        equipmentName: "",
        equipmentCode: "",
        equipmentLocation: "",
        lockEquipment: false,
      }));
    }
  }, [equipments, form.equipmentId, open]);

  /* ===== validar lubricante existente ===== */
  useEffect(() => {
    if (!open) return;
    if (!form.lubricantId) return;
    if (!Array.isArray(lubricants) || lubricants.length === 0) return;

    const exists = lubricants.some((l) => String(l.id) === String(form.lubricantId));
    if (!exists) {
      setForm((prev) => ({ ...prev, lubricantId: "" }));
    }
  }, [lubricants, form.lubricantId, open]);

  /* ===== validar técnico existente ===== */
  useEffect(() => {
    if (!open) return;
    if (!form.technicianId) return;
    if (!Array.isArray(technicians) || technicians.length === 0) return;

    const exists = technicians.some((t) => String(t.id) === String(form.technicianId));
    if (!exists) {
      setForm((prev) => ({ ...prev, technicianId: "" }));
    }
  }, [technicians, form.technicianId, open]);

  /* ===== calcular próxima fecha sin desfase ===== */
  useEffect(() => {
    if (!form.lastDate || !form.frequency) return;

    const next = getNextDateByFrequency(
      form.lastDate,
      form.frequency,
      Array.isArray(form.weeklyDays) ? form.weeklyDays : []
    );

    if (!next) return;

    setForm((prev) => ({ ...prev, nextDate: next }));
  }, [form.lastDate, form.frequency, form.weeklyDays]);

  /* ===== puntos avanzados ===== */
  const advancedTotal = useMemo(() => {
    if (pointsMode !== "advanced") return null;
    const sum = (pointsItems || []).reduce((acc, p) => {
      const n = Number(p?.qty);
      return acc + (Number.isFinite(n) ? n : 0);
    }, 0);
    return clamp2(sum);
  }, [pointsMode, pointsItems]);

  useEffect(() => {
    if (pointsMode !== "advanced") return;
    setForm((prev) => ({ ...prev, quantity: String(advancedTotal ?? 0) }));
  }, [pointsMode, advancedTotal]);

  const equipmentOptions = useMemo(() => {
    const q = norm(equipmentSearch);
    const list = Array.isArray(equipments) ? equipments : [];

    const filtered = !q
      ? list
      : list.filter((e) => {
          const name = norm(e?.name);
          const code = norm(e?.code);
          const desc = norm(e?.description);
          return name.includes(q) || code.includes(q) || desc.includes(q);
        });

    const selectedId = String(form.equipmentId || "");
    const selectedEq = selectedId && list.find((e) => String(e.id) === selectedId);

    const merged = selectedEq
      ? [selectedEq, ...filtered.filter((e) => String(e.id) !== selectedId)]
      : filtered;

    return merged.map((e) => ({
      value: String(e.id),
      label: `${e.name || "Equipo"}${e.code ? ` — (${e.code})` : ""}`,
    }));
  }, [equipments, equipmentSearch, form.equipmentId]);

  const lubricantTypeOptions = useMemo(
    () => [
      "Aceite hidráulico",
      "Aceite para engranes",
      "Aceite para compresor",
      "Aceite de circulación",
      "Aceite para cadenas",
      "Aceite para unidades neumáticas",
      "Grasa EP",
      "Grasa alta temperatura",
      "Grasa grado alimenticio",
      "Grasa multipropósito",
      "Grasa para motores eléctricos",
      "Grasa para altas velocidades",
      "Otro",
    ],
    []
  );

  const frequencyOptions = useMemo(
    () => [
      "Diario",
      "Semanal",
      "Quincenal",
      "Mensual",
      "Bimestral",
      "Cuatrimestral",
      "Semestral",
      "Anual",
      "Varias veces por semana",
    ],
    []
  );

  const methodOptions = useMemo(
    () => ["Manual", "Inyector", "Aceitera", "Sistema automático", "Unidad de filtrado móvil"],
    []
  );

  const unitOptions = useMemo(
    () => [
      { value: "ml", label: "ml" },
      { value: "L", label: "L" },
      { value: "g", label: "g" },
      { value: "kg", label: "kg" },
      { value: "BOMBAZOS", label: "Bombazos" },
    ],
    []
  );

  const pumpStrokeUnitOptions = useMemo(
    () => [
      { value: "g", label: "g" },
      { value: "kg", label: "kg" },
      { value: "ml", label: "ml" },
      { value: "L", label: "L" },
    ],
    []
  );

  const technicianOptions = useMemo(() => {
    return (technicians || []).map((t) => ({
      value: String(t.id),
      label: `${t.name || "Técnico"}${t.code ? ` — (${t.code})` : ""}`,
    }));
  }, [technicians]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => {
      const next = { ...prev, [name]: value };

      if (name === "unit") {
        if (String(value).toUpperCase() === "BOMBAZOS") {
          if (!next.pumpStrokeUnit) next.pumpStrokeUnit = "g";
        } else {
          next.pumpStrokeValue = "";
          next.pumpStrokeUnit = "g";
        }
      }

      if (name === "equipmentId") {
        const selected = equipments.find((eq) => String(eq.id) === String(value));
        next.equipmentName = selected?.name || "";
        next.equipmentCode = selected?.code || selected?.tag || "";
        next.equipmentLocation = selected?.location || "";

        const defaultTechnicianId =
          selected?.assignedTechnician?.id ?? selected?.technicianId ?? selected?.technician?.id ?? "";

        if (!String(prev.technicianId || "").trim()) {
          next.technicianId = defaultTechnicianId != null ? String(defaultTechnicianId) : "";
        }
      }
            if (name === "lubricantId") {
        if (String(value || "").trim() !== "") {
          next.lubricantName = "";
        }
      }

      if (name === "frequency" && value !== "Varias veces por semana") {
        next.weeklyDays = [];
      }

      return next;
    });
  };

  const setPointItem = (idx, patch) => {
    setPointsItems((prev) => prev.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
  };

  const addPoint = () => setPointsItems((prev) => [...prev, { name: "", qty: "" }]);

  const removePoint = (idx) => {
    setPointsItems((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      return next.length ? next : [{ name: "", qty: "" }];
    });
  };

  const handlePickImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Selecciona un archivo de imagen (JPG/PNG/WEBP).");
      return;
    }

    if (imagePreview?.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(imagePreview);
      } catch {}
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    if (imagePreview?.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(imagePreview);
      } catch {}
    }
    setImageFile(null);
    setImagePreview("");
    setForm((prev) => ({ ...prev, imageUrl: "" }));
  };

  const handleSave = async () => {
    if (saving) return;

    if (!currentPlantId) {
      alert("No hay planta seleccionada.");
      return;
    }

    setSaving(true);
    try {
      const frequencyDays =
        form.frequency === "Varias veces por semana"
          ? 7
          : Number(
              {
                Diario: 1,
                Semanal: 7,
                Quincenal: 15,
                Mensual: 30,
                Bimestral: 60,
                Cuatrimestral: 120,
                Semestral: 180,
                Anual: 365,
              }[form.frequency] || 0
            );

      const pointsInt =
        pointsMode === "advanced"
          ? Math.max(1, (pointsItems || []).length)
          : form.points !== "" && form.points != null
          ? Number(form.points)
          : null;

      const advBlock =
        pointsMode === "advanced" ? buildAdvancedPointsBlock(pointsItems, form.unit) : "";

      const mergedInstructions = (() => {
        const base = stripAdvancedBlock(form.instructions);
        if (!advBlock) return base || null;
        return `${base}${advBlock}`.trim() || null;
      })();

      const name = String(form.name || "").trim();
      const equipmentId = Number(form.equipmentId);
      const quantity = Number(String(form.quantity).replace(",", "."));
      const pumpStrokeValueNum =
        form.pumpStrokeValue === "" || form.pumpStrokeValue == null
          ? null
          : Number(String(form.pumpStrokeValue).replace(",", "."));

      if (!name) throw new Error("Falta: Nombre");
      if (!Number.isFinite(equipmentId) || equipmentId <= 0) throw new Error("Falta: Equipo");
      if (!form.lubricantType) throw new Error("Falta: Tipo de lubricante");
      if (!Number.isFinite(quantity)) throw new Error("Cantidad inválida");
      if (quantity < 0) throw new Error("Cantidad inválida");
      if (!frequencyDays) throw new Error("Frecuencia inválida");

      if (
        form.frequency === "Varias veces por semana" &&
        (!Array.isArray(form.weeklyDays) || form.weeklyDays.length === 0)
      ) {
        throw new Error("Debes seleccionar al menos un día de la semana.");
      }

      if (isBombazos) {
        if (!Number.isFinite(pumpStrokeValueNum) || pumpStrokeValueNum <= 0) {
          throw new Error("Debes capturar cuánto equivale 1 bombazo.");
        }
        if (!form.pumpStrokeUnit) {
          throw new Error("Debes seleccionar la unidad equivalente del bombazo.");
        }
      }

      let finalImageUrl = form.imageUrl || null;
      if (imageFile) {
        const uploaded = await uploadRouteImage(imageFile);
        finalImageUrl = uploaded?.imageUrl || uploaded?.url || null;
      }

     const backendWeeklyDays =
  form.frequency === "Varias veces por semana"
    ? mapWeeklyDaysToBackend(form.weeklyDays)
    : [];

if (form.frequency === "Varias veces por semana" && backendWeeklyDays.length === 0) {
  throw new Error("Debes seleccionar al menos un día de la semana.");
}

const payload = {
  name,
  equipmentId,
  lubricantType: String(form.lubricantType || ""),
  quantity,
  frequencyDays,
  frequencyType:
    form.frequency === "Varias veces por semana" ? "WEEKLY" : null,
  weeklyDays: backendWeeklyDays,
  monthlyAnchorDay:
    form.lastDate && form.frequency !== "Varias veces por semana"
      ? Number(form.lastDate.slice(8, 10))
      : null,

  lubricantId:
    form.lubricantId === "" || form.lubricantId == null
      ? null
      : Number(form.lubricantId),
  lubricantName: String(form.lubricantName || "").trim() || null,

  technicianId:
    form.technicianId === "" || form.technicianId == null
      ? null
      : Number(form.technicianId),

  unit: String(form.unit || "ml"),
  pumpStrokeValue: isBombazos ? pumpStrokeValueNum : null,
  pumpStrokeUnit: isBombazos ? String(form.pumpStrokeUnit || "g") : null,

  method: String(form.method || "").trim() || null,
  points: pointsInt,
  instructions: mergedInstructions,

  lastDate: form.lastDate || null,
  nextDate: form.nextDate || null,

  imageUrl: finalImageUrl,
};

      const saved = initialData?.id
        ? await updateRoute(initialData.id, payload)
        : await createRoute(payload);

      onClose();

      try {
        const maybePromise = onSave?.(saved);
        if (maybePromise?.then) await maybePromise;
      } catch (e) {
        console.warn("onSave failed:", e);
      }
    } catch (err) {
      console.error("Error guardando ruta:", err);
      alert(err?.message || "Error guardando ruta");
    } finally {
      setSaving(false);
    }
  };

  const invSelected = lubricants.find((l) => String(l.id) === String(form.lubricantId));

  if (!open) return null;

  return (
    <div style={overlay} onMouseDown={onClose}>
      <div style={modal} onMouseDown={(e) => e.stopPropagation()}>
        <div style={modalHeader}>
          <div>
            <div style={kicker}>{initialData?.id ? "EDITAR RUTA" : "NUEVA RUTA"}</div>
            <h2 style={modalTitle}>{initialData?.id ? "Editar Ruta" : "Nueva Ruta"}</h2>
            <div style={modalSub}>
              Lubricación · programación · operación
              {currentPlant?.name ? ` · Planta: ${currentPlant.name}` : ""}
            </div>
          </div>

          <button style={xBtn} onClick={onClose} disabled={saving} aria-label="Cerrar">
            <Icon name="close" />
          </button>
        </div>

        <div style={modalBody}>
          <div style={section}>
            <div style={sectionTitle}>Datos principales</div>

            <Input
              label="Nombre de la ruta *"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Ej: Lubricación Motor Principal"
              active={activeField === "name"}
              onFocus={() => setActiveField("name")}
              onBlur={() => setActiveField("")}
            />

            {form.lockEquipment && form.equipmentId ? (
              <div style={prefillEquipmentCard}>
                <div style={prefillEquipmentTitle}>Equipo preseleccionado</div>
                <div style={prefillEquipmentMain}>
                  {form.equipmentName || "Equipo seleccionado"}
                </div>
                <div style={prefillEquipmentMeta}>
                  {form.equipmentCode ? `TAG: ${form.equipmentCode}` : "Sin TAG"}
                  {form.equipmentLocation ? ` · Ubicación: ${form.equipmentLocation}` : ""}
                </div>
              </div>
            ) : null}

            <div style={row2}>
              <div style={{ flex: 1, minWidth: 280 }}>
                <Select
                  label="Equipo *"
                  name="equipmentId"
                  value={form.equipmentId}
                  onChange={handleChange}
                  options={equipmentOptions}
                  hint={
                    form.lockEquipment
                      ? "Este equipo viene preseleccionado desde la card del equipo."
                      : "Tip: filtra por código/TAG para encontrar rápido."
                  }
                  active={activeField === "equipmentId"}
                  onFocus={() => setActiveField("equipmentId")}
                  onBlur={() => setActiveField("")}
                  disabled={form.lockEquipment}
                />
              </div>

              <div style={{ width: 260, minWidth: 240 }}>
                <Input
                  label="Buscar equipo (código/TAG)"
                  value={equipmentSearch}
                  onChange={(e) => setEquipmentSearch(e.target.value)}
                  placeholder="Ej: MOT-001"
                  active={activeField === "equipmentSearch"}
                  onFocus={() => setActiveField("equipmentSearch")}
                  onBlur={() => setActiveField("")}
                />
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <Select
                label="Técnico asignado por defecto"
                name="technicianId"
                value={form.technicianId}
                onChange={handleChange}
                options={technicianOptions}
                hint="Opcional. Si lo asignas aquí, las actividades de esta ruta se crearán con este técnico por defecto."
                active={activeField === "technicianId"}
                onFocus={() => setActiveField("technicianId")}
                onBlur={() => setActiveField("")}
              />
            </div>
          </div>

          <div style={section}>
            <div style={sectionTitle}>Lubricante</div>

            <Select
              label="Tipo de lubricante *"
              name="lubricantType"
              value={form.lubricantType}
              onChange={handleChange}
              options={lubricantTypeOptions}
              active={activeField === "lubricantType"}
              onFocus={() => setActiveField("lubricantType")}
              onBlur={() => setActiveField("")}
            />

            <div style={row2}>
              <div style={{ flex: 1, minWidth: 280 }}>
                <Select
                  label="Producto del inventario (recomendado)"
                  name="lubricantId"
                  value={form.lubricantId}
                  onChange={handleChange}
                  options={(lubricants || []).map((l) => ({
                    value: String(l.id),
                    label: `${l.name}${l.unit ? ` (${l.unit})` : ""}`,
                  }))}
                  hint={
                    invSelected
                      ? `Seleccionado: ${invSelected.name}`
                      : "Si no está en inventario, usa el campo manual."
                  }
                  active={activeField === "lubricantId"}
                  onFocus={() => setActiveField("lubricantId")}
                  onBlur={() => setActiveField("")}
                />
              </div>

              <div style={{ width: 320, minWidth: 280 }}>
                <Input
                  label="Nombre del lubricante (si NO está en inventario)"
                  name="lubricantName"
                  value={form.lubricantName}
                  onChange={handleChange}
                  placeholder="Ej: Mobil Grease XHP 222"
                  active={activeField === "lubricantName"}
                  onFocus={() => setActiveField("lubricantName")}
                  onBlur={() => setActiveField("")}
                />
              </div>
            </div>
          </div>

          <div style={section}>
            <div style={sectionTitle}>Dosificación</div>

            <div style={row2}>
              <div style={{ flex: 1, minWidth: 240 }}>
                <Input
                  label={
                    isBombazos
                      ? "Cantidad * (número de bombazos)"
                      : "Cantidad * (Cantidad por punto en modo simple)"
                  }
                  name="quantity"
                  value={form.quantity}
                  onChange={handleChange}
                  placeholder={isBombazos ? "Ej: 3" : "Ej: 10"}
                  hint={
                    pointsMode === "advanced"
                      ? "En avanzado, el total se calcula automáticamente por punto."
                      : isBombazos
                      ? "Aquí capturas cuántos bombazos se aplican."
                      : null
                  }
                  readOnly={pointsMode === "advanced"}
                  active={activeField === "quantity"}
                  onFocus={() => setActiveField("quantity")}
                  onBlur={() => setActiveField("")}
                />
              </div>

              <div style={{ width: 220, minWidth: 200 }}>
                <Select
                  label="Unidad *"
                  name="unit"
                  value={form.unit || "ml"}
                  onChange={handleChange}
                  options={unitOptions}
                  active={activeField === "unit"}
                  onFocus={() => setActiveField("unit")}
                  onBlur={() => setActiveField("")}
                />
              </div>
            </div>

            {isBombazos ? (
              <div style={bombazosBox}>
                <div style={bombazosTitle}>Equivalencia de bombazo</div>
                <div style={bombazosSub}>
                  Define cuánto equivale <b>1 bombazo</b> para que LubriPlan pueda descontar
                  inventario, analizar consumo e integrarlo al historial y reportes.
                </div>

                <div style={{ ...row2, marginTop: 12 }}>
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <Input
                      label="1 bombazo equivale a *"
                      name="pumpStrokeValue"
                      value={form.pumpStrokeValue}
                      onChange={handleChange}
                      placeholder="Ej: 2"
                      active={activeField === "pumpStrokeValue"}
                      onFocus={() => setActiveField("pumpStrokeValue")}
                      onBlur={() => setActiveField("")}
                    />
                  </div>

                  <div style={{ width: 220, minWidth: 200 }}>
                    <Select
                      label="Unidad equivalente *"
                      name="pumpStrokeUnit"
                      value={form.pumpStrokeUnit || "g"}
                      onChange={handleChange}
                      options={pumpStrokeUnitOptions}
                      active={activeField === "pumpStrokeUnit"}
                      onFocus={() => setActiveField("pumpStrokeUnit")}
                      onBlur={() => setActiveField("")}
                    />
                  </div>
                </div>

                {form.pumpStrokeValue ? (
                  <div style={bombazosPreview}>
                    Ejemplo: si capturas <b>{form.quantity || 0}</b> bombazos y 1 bombazo ={" "}
                    <b>
                      {form.pumpStrokeValue} {form.pumpStrokeUnit}
                    </b>
                    , entonces el equivalente base será{" "}
                    <b>
                      {clamp2(
                        Number(form.quantity || 0) * Number(form.pumpStrokeValue || 0)
                      )}{" "}
                      {form.pumpStrokeUnit}
                    </b>
                    {pointsMode === "simple" && form.points
                      ? ` antes de multiplicar por ${form.points} punto(s) cuando aplique.`
                      : "."}
                  </div>
                ) : null}
              </div>
            ) : null}

            <Select
              label="Método de aplicación"
              name="method"
              value={form.method || "Manual"}
              onChange={handleChange}
              options={methodOptions}
              active={activeField === "method"}
              onFocus={() => setActiveField("method")}
              onBlur={() => setActiveField("")}
            />

            <div style={pointsBox}>
              <div style={pointsTop}>
                <div>
                  <div style={miniTitle}>Puntos de lubricación</div>
                  <div style={miniSub}>
                    Simple: solo número. Avanzado: nombra puntos y asigna cantidades por punto.
                  </div>
                </div>

                <div style={segmented}>
                  <button
                    type="button"
                    style={pointsMode === "simple" ? segBtnOn : segBtnOff}
                    onClick={() => setPointsMode("simple")}
                  >
                    Simple
                  </button>
                  <button
                    type="button"
                    style={pointsMode === "advanced" ? segBtnOn : segBtnOff}
                    onClick={() => setPointsMode("advanced")}
                  >
                    Avanzado
                  </button>
                </div>
              </div>

              {pointsMode === "simple" ? (
                <Input
                  label="Número de puntos"
                  name="points"
                  value={form.points ?? ""}
                  onChange={handleChange}
                  placeholder="Ej: 4"
                  active={activeField === "points"}
                  onFocus={() => setActiveField("points")}
                  onBlur={() => setActiveField("")}
                />
              ) : (
                <>
                  <div style={advGridHeader}>
                    <div style={advHead}>Punto</div>
                    <div style={advHead}>Cantidad ({form.unit || "ml"})</div>
                    <div />
                  </div>

                  <div style={{ display: "grid", gap: 10 }}>
                    {(pointsItems || []).map((p, idx) => (
                      <div key={idx} style={advRow}>
                        <input
                          style={advInput}
                          placeholder={`Ej: Rodamiento ${idx + 1}`}
                          value={p.name}
                          onChange={(e) => setPointItem(idx, { name: e.target.value })}
                        />
                        <input
                          style={advInput}
                          placeholder="Ej: 5"
                          inputMode="decimal"
                          value={p.qty}
                          onChange={(e) => setPointItem(idx, { qty: e.target.value })}
                        />
                        <button
                          type="button"
                          style={miniBtn}
                          onClick={() => removePoint(idx)}
                          title="Quitar punto"
                        >
                          <Icon name="close" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div style={advFooter}>
                    <button type="button" style={btnGhostSmall} onClick={addPoint}>
                      + Agregar punto
                    </button>

                    <div style={totalPill}>
                      Total: <b style={{ marginLeft: 6 }}>{advancedTotal ?? 0}</b>{" "}
                      {form.unit || ""}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div style={section}>
            <div style={sectionTitle}>Fotografía del punto de lubricación (opcional)</div>

            <div style={imgGrid}>
              <div style={{ minWidth: 280 }}>
                <div
                  style={{
                    ...uploadBox,
                    ...(activeField === "routeImage" ? uploadBoxActive : null),
                  }}
                  role="button"
                  tabIndex={0}
                  onClick={() => fileRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") fileRef.current?.click();
                  }}
                  onFocus={() => setActiveField("routeImage")}
                  onBlur={() => setActiveField("")}
                  title="Subir imagen"
                >
                  <div style={uploadIcon}>
                    <Icon name="camera" />
                  </div>

                  <div style={{ display: "grid", gap: 6 }}>
                    <div style={uploadTitle}>Subir imagen</div>
                    <div style={uploadSub}>
                      JPG, PNG o WEBP · Recomendado para identificar el punto
                    </div>
                    <div style={uploadHint}>Click para seleccionar archivo</div>
                  </div>

                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handlePickImage}
                    style={{ display: "none" }}
                  />
                </div>

                {imagePreview || form.imageUrl ? (
                  <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      style={btnGhostSmall}
                      onClick={() => fileRef.current?.click()}
                      disabled={saving}
                    >
                      Cambiar
                    </button>

                    <button
                      type="button"
                      style={btnDangerGhost}
                      onClick={clearImage}
                      disabled={saving}
                    >
                      Quitar
                    </button>
                  </div>
                ) : null}
              </div>

              <div style={imgPreviewCard}>
                <div style={imgPreviewHeader}>
                  <span style={imgPreviewTitle}>Vista previa</span>

                  {imagePreview || form.imageUrl ? (
                    <span style={imgPreviewOk}>
                      <Icon name="check" /> Lista
                    </span>
                  ) : (
                    <span style={imgPreviewEmptyPill}>Sin imagen</span>
                  )}
                </div>

                <div style={imgBoxPro}>
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" style={img} />
                  ) : form.imageUrl ? (
                    <img src={buildImgUrl(form.imageUrl)} alt="Imagen guardada" style={img} />
                  ) : (
                    <div style={imgEmptyPro}>
                      <Icon name="camera" style={{ opacity: 0.55 }} />
                      <div style={{ marginTop: 10 }}>Aún no hay imagen</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div style={section}>
            <div style={sectionTitle}>Programación</div>

            <Select
              label="Frecuencia *"
              name="frequency"
              value={form.frequency}
              onChange={handleChange}
              options={frequencyOptions}
              hint="La próxima lubricación se calcula automáticamente con base en la última + frecuencia."
              active={activeField === "frequency"}
              onFocus={() => setActiveField("frequency")}
              onBlur={() => setActiveField("")}
            />

            {form.frequency === "Varias veces por semana" ? (
              <div style={weeklyBox}>
                <div style={miniTitle}>Días programados</div>
                <div style={miniSub}>
                  Selecciona los días específicos en los que se ejecutará la lubricación.
                </div>

                <div style={weekDaysWrap}>
                  {WEEK_DAYS.map((day) => {
                    const active = form.weeklyDays.includes(day.value);

                    return (
                      <button
                        key={day.value}
                        type="button"
                        style={active ? weekDayBtnActive : weekDayBtn}
                        onClick={() => {
                          setForm((prev) => {
                            const exists = prev.weeklyDays.includes(day.value);
                            const nextDays = exists
                              ? prev.weeklyDays.filter((d) => d !== day.value)
                              : [...prev.weeklyDays, day.value];

                            return {
                              ...prev,
                              weeklyDays: nextDays,
                            };
                          });
                        }}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>

                <div style={hintStyle}>
                  Puedes elegir 2, 3 o 4 días por semana según tu plan de lubricación.
                </div>
              </div>
            ) : null}

            <div style={row2}>
              <div style={{ flex: 1, minWidth: 240 }}>
                <Input
                  type="date"
                  label="Última lubricación (opcional)"
                  name="lastDate"
                  value={form.lastDate}
                  onChange={handleChange}
                  active={activeField === "lastDate"}
                  onFocus={() => setActiveField("lastDate")}
                  onBlur={() => setActiveField("")}
                />
              </div>

              <div style={{ flex: 1, minWidth: 240 }}>
                <Input
                  type="date"
                  label="Próxima lubricación (puedes ajustar)"
                  name="nextDate"
                  value={form.nextDate}
                  onChange={handleChange}
                  active={activeField === "nextDate"}
                  onFocus={() => setActiveField("nextDate")}
                  onBlur={() => setActiveField("")}
                />
              </div>
            </div>
          </div>

          <div style={section}>
            <div style={sectionTitle}>Instrucciones</div>
            <Textarea
              label="Instrucciones (opcional)"
              name="instructions"
              value={form.instructions}
              onChange={handleChange}
              placeholder="Ej: Limpiar boquillas, aplicar en caliente, revisar fugas, etc."
              hint={
                pointsMode === "advanced"
                  ? "En modo avanzado, se guardará un bloque con el detalle por punto al final."
                  : null
              }
              active={activeField === "instructions"}
              onFocus={() => setActiveField("instructions")}
              onBlur={() => setActiveField("")}
            />
          </div>
        </div>

        <div style={actions}>
          <button onClick={onClose} style={btnGhost} disabled={saving}>
            Cancelar
          </button>
          <button onClick={handleSave} style={btnPrimary} disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================== STYLES ================== */
const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(15,23,42,0.55)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
  padding: 16,
};

const modal = {
  width: "min(920px, 100%)",
  maxHeight: "92vh",
  background: "linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)",
  borderRadius: 18,
  border: "1px solid #e5e7eb",
  boxShadow: "0 20px 70px rgba(0,0,0,0.25)",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};

const modalHeader = {
  padding: 16,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
  borderBottom: "1px solid #eef2f7",
  background:
    "linear-gradient(180deg, rgba(246,247,249,0.85) 0%, rgba(255,255,255,0.65) 100%)",
};

const kicker = {
  fontSize: 11,
  fontWeight: 950,
  color: "#64748b",
  letterSpacing: 1.2,
};

const modalTitle = {
  margin: "6px 0 0",
  fontSize: 28,
  fontWeight: 950,
  color: "#0f172a",
  letterSpacing: 0.2,
};

const modalSub = {
  marginTop: 6,
  color: "#64748b",
  fontWeight: 800,
  fontSize: 12,
};

const xBtn = {
  width: 42,
  height: 42,
  border: "1px solid #e5e7eb",
  background: "rgba(255,255,255,0.75)",
  borderRadius: 12,
  display: "grid",
  placeItems: "center",
  cursor: "pointer",
  fontWeight: 950,
  color: "#0f172a",
};

const modalBody = {
  padding: 18,
  overflowY: "auto",
  display: "grid",
  gap: 16,
  background: "linear-gradient(180deg, #f6f7f9 0%, #eef2f7 100%)",
};

const section = {
  background: "rgba(255,255,255,0.82)",
  border: "1px solid rgba(226,232,240,0.9)",
  borderRadius: 16,
  padding: 16,
  boxShadow: "0 10px 22px rgba(2,6,23,0.05)",
  backdropFilter: "blur(4px)",
};

const sectionTitle = {
  fontWeight: 950,
  color: "#0f172a",
  letterSpacing: 0.5,
  fontSize: 12,
  marginBottom: 12,
  textTransform: "uppercase",
  display: "flex",
  alignItems: "center",
  gap: 10,
};

const row2 = {
  display: "flex",
  gap: 14,
  flexWrap: "wrap",
  alignItems: "flex-end",
};

const field = { display: "flex", flexDirection: "column", gap: 8 };

const labelStyle = {
  fontSize: 11,
  fontWeight: 950,
  color: "#334155",
  textTransform: "uppercase",
  letterSpacing: 0.6,
};

const hintStyle = {
  marginTop: 2,
  fontSize: 12,
  fontWeight: 800,
  color: "#64748b",
};

const actions = {
  padding: 16,
  borderTop: "1px solid #eef2f7",
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0.92) 100%)",
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
};

const btnPrimary = {
  background: "#f97316",
  color: "#0b1220",
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid #fb923c",
  fontWeight: 950,
  cursor: "pointer",
  boxShadow: "0 10px 22px rgba(249,115,22,0.22)",
};

const btnGhost = {
  background: "rgba(255,255,255,0.70)",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: "10px 14px",
  cursor: "pointer",
  fontWeight: 950,
  color: "#0f172a",
};

const pointsBox = {
  marginTop: 6,
  padding: 12,
  borderRadius: 14,
  border: "1px solid rgba(226,232,240,0.9)",
  background: "rgba(248,250,252,0.80)",
};

const pointsTop = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap",
};

const miniTitle = { fontWeight: 950, color: "#0f172a" };
const miniSub = { marginTop: 4, fontSize: 12, fontWeight: 800, color: "#64748b" };

const segmented = {
  display: "flex",
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: 12,
  overflow: "hidden",
  background: "rgba(255,255,255,0.70)",
};

const segBtnOn = {
  border: "none",
  padding: "10px 12px",
  cursor: "pointer",
  fontWeight: 950,
  background: "rgba(249,115,22,0.18)",
  color: "#0f172a",
};

const segBtnOff = {
  border: "none",
  padding: "10px 12px",
  cursor: "pointer",
  fontWeight: 950,
  background: "transparent",
  color: "#64748b",
};

const advGridHeader = {
  marginTop: 12,
  display: "grid",
  gridTemplateColumns: "1fr 200px 46px",
  gap: 10,
  fontSize: 12,
};

const advHead = { fontWeight: 950, color: "#0f172a" };

const advRow = {
  display: "grid",
  gridTemplateColumns: "1fr 200px 46px",
  gap: 10,
  alignItems: "center",
};

const advInput = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  fontSize: 14,
  fontWeight: 800,
  outline: "none",
  background: "#fff",
};

const miniBtn = {
  width: 46,
  height: 42,
  border: "1px solid rgba(254,202,202,0.95)",
  background: "rgba(255,241,242,0.75)",
  borderRadius: 12,
  cursor: "pointer",
  fontWeight: 950,
  color: "#7f1d1d",
  display: "grid",
  placeItems: "center",
};

const advFooter = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: 10,
  gap: 10,
  flexWrap: "wrap",
};

const btnGhostSmall = {
  background: "rgba(255,255,255,0.70)",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: "10px 12px",
  cursor: "pointer",
  fontWeight: 950,
  color: "#0f172a",
};

const totalPill = {
  background: "rgba(255,255,255,0.70)",
  border: "1px solid #e5e7eb",
  borderRadius: 999,
  padding: "8px 12px",
  fontWeight: 900,
  fontSize: 12,
  color: "#0f172a",
};

const bombazosBox = {
  marginTop: 12,
  padding: 12,
  borderRadius: 14,
  border: "1px solid rgba(249,115,22,0.28)",
  background: "rgba(255,247,237,0.78)",
};

const bombazosTitle = {
  fontWeight: 950,
  color: "#9a3412",
};

const bombazosSub = {
  marginTop: 4,
  fontSize: 12,
  fontWeight: 800,
  color: "#7c2d12",
  lineHeight: 1.4,
};

const bombazosPreview = {
  marginTop: 10,
  padding: "10px 12px",
  borderRadius: 12,
  background: "rgba(255,255,255,0.75)",
  border: "1px solid rgba(251,146,60,0.35)",
  color: "#7c2d12",
  fontSize: 12,
  fontWeight: 850,
  lineHeight: 1.4,
};

const rowShell = {
  borderRadius: 14,
  borderWidth: "1.8px",
  borderStyle: "solid",
  borderColor: "rgba(51,65,85,0.22)",
  background: "rgba(255,255,255,0.96)",
  boxShadow: "0 10px 22px rgba(2,6,23,0.06)",
  padding: 3,
  position: "relative",
  transition: "border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease",
};

const rowShellActive = {
  borderColor: "rgba(249,115,22,0.85)",
  boxShadow: "0 16px 28px rgba(249,115,22,0.18)",
};

const rowInput = {
  width: "100%",
  padding: "12px 12px",
  borderRadius: 12,
  border: "1px solid rgba(15,23,42,0.12)",
  fontSize: 14,
  fontWeight: 800,
  outline: "none",
  background: "rgba(255,255,255,0.98)",
  color: "#0f172a",
};

const imgGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 14,
  alignItems: "start",
};

const uploadBox = {
  borderRadius: 16,
  borderWidth: 2,
  borderStyle: "dashed",
  borderColor: "rgba(148,163,184,0.65)",
  background: "rgba(248,250,252,0.85)",
  padding: 14,
  display: "flex",
  gap: 12,
  alignItems: "center",
  cursor: "pointer",
  userSelect: "none",
  transition: "border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease",
};

const uploadBoxActive = {
  borderColor: "rgba(249,115,22,0.75)",
  boxShadow: "0 16px 30px rgba(249,115,22,0.12)",
  transform: "translateY(-1px)",
};

const uploadIcon = {
  width: 44,
  height: 44,
  borderRadius: 14,
  display: "grid",
  placeItems: "center",
  background: "rgba(148,163,184,0.18)",
  border: "1px solid rgba(148,163,184,0.30)",
  color: "#0f172a",
};

const uploadTitle = {
  fontWeight: 950,
  color: "#0f172a",
};

const uploadSub = {
  fontSize: 12,
  fontWeight: 800,
  color: "#64748b",
  lineHeight: 1.25,
};

const uploadHint = {
  marginTop: 2,
  fontSize: 12,
  fontWeight: 900,
  color: "#0f172a",
  opacity: 0.75,
};

const imgPreviewCard = {
  borderRadius: 16,
  border: "1px solid rgba(226,232,240,0.92)",
  background: "rgba(255,255,255,0.86)",
  overflow: "hidden",
  boxShadow: "0 10px 22px rgba(2,6,23,0.05)",
};

const imgPreviewHeader = {
  padding: 12,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  borderBottom: "1px solid rgba(226,232,240,0.75)",
  background:
    "linear-gradient(180deg, rgba(248,250,252,0.95) 0%, rgba(255,255,255,0.85) 100%)",
};

const imgPreviewTitle = {
  fontWeight: 950,
  fontSize: 12,
  letterSpacing: 0.5,
  textTransform: "uppercase",
  color: "#0f172a",
};

const imgPreviewOk = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  fontWeight: 950,
  fontSize: 12,
  color: "#166534",
  background: "rgba(34,197,94,0.12)",
  border: "1px solid rgba(34,197,94,0.22)",
  padding: "6px 10px",
  borderRadius: 999,
};

const imgPreviewEmptyPill = {
  fontWeight: 950,
  fontSize: 12,
  color: "#64748b",
  background: "rgba(148,163,184,0.12)",
  border: "1px solid rgba(148,163,184,0.22)",
  padding: "6px 10px",
  borderRadius: 999,
};

const imgBoxPro = {
  height: 210,
  background: "rgba(248,250,252,0.85)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const img = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const imgEmptyPro = {
  padding: 14,
  textAlign: "center",
  color: "#64748b",
  fontWeight: 850,
  fontSize: 12,
};

const btnDangerGhost = {
  background: "rgba(255,255,255,0.70)",
  border: "1px solid rgba(254,202,202,0.95)",
  borderRadius: 12,
  padding: "10px 12px",
  cursor: "pointer",
  fontWeight: 950,
  color: "#7f1d1d",
};

const prefillEquipmentCard = {
  marginBottom: 14,
  padding: 12,
  borderRadius: 14,
  border: "1px solid rgba(249,115,22,0.28)",
  background: "rgba(255,247,237,0.82)",
  boxShadow: "0 10px 20px rgba(249,115,22,0.08)",
};

const prefillEquipmentTitle = {
  fontSize: 11,
  fontWeight: 950,
  color: "#9a3412",
  letterSpacing: 0.7,
  textTransform: "uppercase",
};

const prefillEquipmentMain = {
  marginTop: 6,
  fontSize: 16,
  fontWeight: 950,
  color: "#0f172a",
};

const prefillEquipmentMeta = {
  marginTop: 4,
  fontSize: 12,
  fontWeight: 800,
  color: "#7c2d12",
  lineHeight: 1.35,
};

const weeklyBox = {
  marginTop: 12,
  padding: 12,
  borderRadius: 14,
  border: "1px solid rgba(226,232,240,0.9)",
  background: "rgba(248,250,252,0.82)",
};

const weekDaysWrap = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  marginTop: 12,
};

const weekDayBtn = {
  border: "1px solid rgba(226,232,240,0.95)",
  background: "rgba(255,255,255,0.78)",
  color: "#334155",
  borderRadius: 12,
  padding: "10px 12px",
  fontWeight: 900,
  cursor: "pointer",
  minWidth: 58,
};

const weekDayBtnActive = {
  ...weekDayBtn,
  background: "rgba(249,115,22,0.16)",
  border: "1px solid rgba(249,115,22,0.45)",
  color: "#9a3412",
  boxShadow: "0 8px 18px rgba(249,115,22,0.12)",
};





