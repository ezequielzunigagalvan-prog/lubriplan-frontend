// src/pages/NewRoutePage.jsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";

import { createRoute, uploadRouteImage } from "../services/routesService";
import { getEquipment } from "../services/equipmentService";
import { API_URL } from "../services/api";

/* ================== HELPERS ================== */
const norm = (v) => String(v ?? "").toLowerCase().trim();

export default function NewRoutePage() {
  const navigate = useNavigate();
  const location = useLocation();

  const equipmentIdFromQuery = useMemo(() => {
    const p = new URLSearchParams(location.search || "");
    const id = Number(p.get("equipmentId") || "");
    return Number.isFinite(id) && id > 0 ? String(id) : "";
  }, [location.search]);

  const [form, setForm] = useState({
    name: "",
    equipmentId: "",
    lubricantType: "",
    quantity: "",
    unit: "ml",
    pumpStrokeValue: "",
    pumpStrokeUnit: "g",
    frequencyDays: 30,
    imageUrl: "",
  });

  const [equipments, setEquipments] = useState([]);
  const [equipmentSearch, setEquipmentSearch] = useState("");

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (equipmentIdFromQuery && !form.equipmentId) {
      setForm((p) => ({ ...p, equipmentId: equipmentIdFromQuery }));
    }
  }, [equipmentIdFromQuery, form.equipmentId]);

  useEffect(() => {
    (async () => {
      try {
        const data = await getEquipment({ filter: "", days: 3650 });
        setEquipments(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Error cargando equipos:", e);
        setEquipments([]);
      }
    })();
  }, []);

  const equipmentOptions = useMemo(() => {
    const q = norm(equipmentSearch);
    const list = Array.isArray(equipments) ? equipments : [];

    if (!q) return list;

    return list.filter((e) => {
      const name = norm(e?.name);
      const code = norm(e?.code);
      const desc = norm(e?.description);
      return name.includes(q) || code.includes(q) || desc.includes(q);
    });
  }, [equipments, equipmentSearch]);

  const lubricantTypeOptions = useMemo(
    () => [
      "Grasa para motores eléctricos",
      "Grasa para altas velocidades",
      "Aceite para compresor",
      "Aceite de circulación",
      "Grasa multipropósito",
      "Aceite para unidades neumáticas",
      "Aceite hidráulico",
      "Aceite para engranes",
      "Grasa EP",
      "Grasa alta temperatura",
      "Grasa grado alimenticio",
      "Aceite para cadenas",
      "Otro",
    ],
    []
  );

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => {
      const next = { ...prev, [name]: value };

      if (name === "unit" && value !== "BOMBAZOS") {
        next.pumpStrokeValue = "";
        next.pumpStrokeUnit = "g";
      }

      return next;
    });
  };

  const handlePickImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Selecciona un archivo de imagen.");
      return;
    }

    if (file.size > 6 * 1024 * 1024) {
      alert("La imagen excede 6MB.");
      return;
    }

    const url = URL.createObjectURL(file);
    setImageFile(file);
    setImagePreview(url);
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview("");
    setForm((prev) => ({ ...prev, imageUrl: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      const payload = {
        name: String(form.name || "").trim(),
        equipmentId: Number(form.equipmentId),
        lubricantType: String(form.lubricantType || ""),
        quantity: form.quantity === "" ? NaN : Number(form.quantity),
        unit: String(form.unit || "ml").trim(),
        pumpStrokeValue:
          form.unit === "BOMBAZOS"
            ? form.pumpStrokeValue === ""
              ? NaN
              : Number(form.pumpStrokeValue)
            : null,
        pumpStrokeUnit:
          form.unit === "BOMBAZOS"
            ? String(form.pumpStrokeUnit || "g").trim().toLowerCase()
            : null,
        frequencyDays: form.frequencyDays === "" ? NaN : Number(form.frequencyDays),
        imageUrl: form.imageUrl || null,
      };

      if (!payload.name) return alert("Falta: Nombre de la ruta");
      if (!Number.isFinite(payload.equipmentId) || payload.equipmentId <= 0) return alert("Falta: Equipo");
      if (!payload.lubricantType) return alert("Falta: Tipo de lubricante");
      if (!Number.isFinite(payload.quantity) || payload.quantity <= 0) return alert("Cantidad inválida");
      if (!payload.unit) return alert("Falta: Unidad");
      if (!Number.isFinite(payload.frequencyDays) || payload.frequencyDays <= 0) return alert("Frecuencia inválida");

      if (payload.unit === "BOMBAZOS") {
        if (!Number.isFinite(payload.pumpStrokeValue) || payload.pumpStrokeValue <= 0) {
          return alert("Debes capturar cuánto equivale 1 bombazo.");
        }

        if (!payload.pumpStrokeUnit) {
          return alert("Debes seleccionar la unidad equivalente del bombazo.");
        }
      }

      let finalImageUrl = payload.imageUrl;

      if (imageFile) {
        const uploaded = await uploadRouteImage(imageFile);
        finalImageUrl = uploaded?.url || null;
      }

      await createRoute({
        ...payload,
        imageUrl: finalImageUrl,
      });

      alert("Ruta creada ✅");
      navigate("/routes");
    } catch (err) {
      console.error("Error creando ruta:", err);
      alert(err?.message || "Error creando ruta");
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout>
      <div style={pageShell}>
        <div style={topBar}>
          <div>
            <div style={kicker}>LUBRIPLAN · RUTAS</div>
            <h1 style={title}>Nueva ruta</h1>
            <div style={subtitle}>Crea una nueva ruta de lubricación</div>
          </div>

          <button style={btnGhost} onClick={() => navigate("/routes")} disabled={saving}>
            ← Volver
          </button>
        </div>

        <form onSubmit={handleSubmit} style={panel}>
          <FormField
            label="Nombre de la ruta *"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Ej. Ruta prensa hidráulica"
          />

          <div style={row2}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Equipo *</label>
              <select name="equipmentId" value={form.equipmentId} onChange={handleChange} style={input}>
                <option value="">Seleccionar</option>
                {equipmentOptions.map((e) => (
                  <option key={e.id} value={String(e.id)}>
                    {e.name}
                    {e.code ? ` — (${e.code})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ width: 260 }}>
              <FormField
                label="Buscar equipo (código/TAG)"
                name="equipmentSearch"
                value={equipmentSearch}
                onChange={(e) => setEquipmentSearch(e.target.value)}
                placeholder="Ej: PRE-02"
              />
            </div>
          </div>

          <div style={{ marginTop: 10 }}>
            <label style={labelStyle}>Tipo de lubricante *</label>
            <select name="lubricantType" value={form.lubricantType} onChange={handleChange} style={input}>
              <option value="">Seleccionar</option>
              {lubricantTypeOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div style={row2}>
            <FormField
              label="Cantidad *"
              name="quantity"
              type="number"
              value={form.quantity}
              onChange={handleChange}
              placeholder="Ej. 50"
            />

            <div style={{ flex: 1, minWidth: 240, marginTop: 10 }}>
              <label style={labelStyle}>Unidad *</label>
              <select name="unit" value={form.unit} onChange={handleChange} style={input}>
                <option value="ml">ml</option>
                <option value="l">L</option>
                <option value="g">g</option>
                <option value="kg">kg</option>
                <option value="BOMBAZOS">Bombazos</option>
              </select>
            </div>

            <FormField
              label="Frecuencia (días) *"
              name="frequencyDays"
              type="number"
              value={form.frequencyDays}
              onChange={handleChange}
              placeholder="Ej. 30"
            />
          </div>

          {form.unit === "BOMBAZOS" ? (
            <div style={row2}>
              <FormField
                label="1 bombazo equivale a *"
                name="pumpStrokeValue"
                type="number"
                value={form.pumpStrokeValue}
                onChange={handleChange}
                placeholder="Ej. 2.5"
              />

              <div style={{ flex: 1, minWidth: 240, marginTop: 10 }}>
                <label style={labelStyle}>Unidad equivalente *</label>
                <select
                  name="pumpStrokeUnit"
                  value={form.pumpStrokeUnit}
                  onChange={handleChange}
                  style={input}
                >
                  <option value="g">g</option>
                  <option value="kg">kg</option>
                  <option value="ml">ml</option>
                  <option value="l">L</option>
                </select>
              </div>
            </div>
          ) : null}

          <div style={{ marginTop: 10 }}>
            <div style={sectionTitle}>Imagen del punto / mecanismo (opcional)</div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
              <div style={{ flex: 1, minWidth: 260 }}>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handlePickImage}
                  style={input}
                />
                <div style={hintStyle}>JPG, PNG o WEBP · Máx 6MB</div>

                {imagePreview ? (
                  <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
                    <button type="button" style={btnGhost} onClick={clearImage} disabled={saving}>
                      Quitar imagen
                    </button>
                  </div>
                ) : null}
              </div>

              <div style={{ width: 260 }}>
                <div style={thumb}>
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 12 }}
                    />
                  ) : form.imageUrl ? (
                    <img
                      src={`${API_URL}${form.imageUrl}`}
                      alt="Imagen"
                      style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 12 }}
                    />
                  ) : (
                    <div style={{ padding: 12, color: "#64748b", fontWeight: 800, fontSize: 12 }}>
                      Sin imagen
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div style={actions}>
            <button type="button" onClick={() => navigate("/routes")} style={btnGhost} disabled={saving}>
              Cancelar
            </button>

            <button type="submit" style={btnPrimary} disabled={saving}>
              {saving ? "Guardando..." : "Guardar ruta"}
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}

function FormField({ label, name, value, onChange, placeholder, type = "text" }) {
  return (
    <div style={{ flex: 1, minWidth: 240, marginTop: 10 }}>
      <label style={labelStyle}>{label}</label>
      <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} style={input} />
    </div>
  );
}

/* ===== estilos ===== */
const pageShell = {
  padding: 16,
  background: "linear-gradient(180deg, #f6f7f9 0%, #eef2f7 100%)",
  borderRadius: 16,
  border: "1px solid #e5e7eb",
};

const topBar = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
  gap: 12,
  flexWrap: "wrap",
  paddingBottom: 12,
  borderBottom: "1px solid #e5e7eb",
};

const kicker = { fontSize: 11, fontWeight: 950, color: "#64748b", letterSpacing: 1.2 };
const title = { margin: "6px 0 0", fontSize: 28, fontWeight: 950, color: "#0f172a" };
const subtitle = { marginTop: 6, color: "#64748b", fontWeight: 800, fontSize: 12 };

const panel = {
  marginTop: 14,
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  padding: 16,
  boxShadow: "0 10px 22px rgba(2,6,23,0.05)",
};

const row2 = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  alignItems: "flex-end",
};

const labelStyle = {
  display: "block",
  marginBottom: 6,
  fontWeight: 950,
  fontSize: 12,
  color: "#0f172a",
  textTransform: "uppercase",
  letterSpacing: 0.3,
};

const input = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  fontSize: 14,
  fontWeight: 800,
  outline: "none",
  background: "#fff",
  boxShadow: "inset 0 1px 0 rgba(2,6,23,0.04)",
};

const hintStyle = { marginTop: 6, fontSize: 12, fontWeight: 800, color: "#64748b" };

const sectionTitle = {
  fontWeight: 950,
  color: "#0f172a",
  letterSpacing: 0.3,
  fontSize: 13,
  marginTop: 6,
  marginBottom: 10,
  textTransform: "uppercase",
};

const thumb = {
  height: 180,
  borderRadius: 14,
  border: "1px solid rgba(226,232,240,0.9)",
  background: "rgba(248,250,252,0.80)",
  overflow: "hidden",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const actions = {
  marginTop: 18,
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