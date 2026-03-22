import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { getRouteById, updateRoute } from "../services/routesService";
import { usePlant } from "../context/PlantContext";

export default function EditRoutePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentPlantId } = usePlant();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    equipment: "",
    lubricant: "",
    quantity: "",
    frequencyDays: "",
  });

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        setError("");
        setLoading(true);

        if (!currentPlantId) {
          setForm({ name: "", equipment: "", lubricant: "", quantity: "", frequencyDays: "" });
          return;
        }

        const route = await getRouteById(id);
        if (!alive) return;

        if (!route?.id) {
          setError("No se encontró la ruta en la planta actual.");
          return;
        }

        setForm({
          name: route.name || "",
          equipment: route.equipment?.name || route.equipmentName || route.equipment || "",
          lubricant: route.lubricant?.name || route.lubricantName || route.lubricant || "",
          quantity: route.quantity != null ? String(route.quantity) : "",
          frequencyDays: route.frequencyDays != null ? String(route.frequencyDays) : "",
        });
      } catch (e) {
        console.error(e);
        if (!alive) return;
        setError(e?.message || "No se pudo cargar la ruta.");
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();
    return () => {
      alive = false;
    };
  }, [currentPlantId, id]);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      await updateRoute(id, form);
      navigate("/routes");
    } catch (e) {
      console.error(e);
      setError(e?.message || "No se pudo actualizar la ruta.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <p>Cargando ruta...</p>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <h1>Editar ruta</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>
        Actualiza la información de la ruta
      </p>

      {error ? (
        <div style={{ color: "#991b1b", marginBottom: 16, fontWeight: 700 }}>{error}</div>
      ) : null}

      <form
        onSubmit={handleSubmit}
        style={{
          maxWidth: 520,
          background: "#fff",
          padding: 24,
          borderRadius: 16,
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        }}
      >
        <FormField label="Nombre de la ruta" name="name" value={form.name} onChange={handleChange} />

        <FormField label="Equipo" name="equipment" value={form.equipment} onChange={handleChange} />

        <FormField
          label="Tipo de lubricante"
          name="lubricant"
          value={form.lubricant}
          onChange={handleChange}
        />

        <FormField
          label="Cantidad"
          name="quantity"
          type="number"
          value={form.quantity}
          onChange={handleChange}
        />

        <FormField
          label="Frecuencia (días)"
          name="frequencyDays"
          type="number"
          value={form.frequencyDays}
          onChange={handleChange}
        />

        <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              flex: 1,
              background: "#ff7a00",
              color: "#fff",
              padding: "12px 16px",
              border: "none",
              borderRadius: 10,
              fontWeight: 600,
              cursor: saving ? "wait" : "pointer",
              opacity: saving ? 0.8 : 1,
            }}
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/routes")}
            style={{
              flex: 1,
              background: "#f3f3f3",
              color: "#333",
              padding: "12px 16px",
              border: "none",
              borderRadius: 10,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cancelar
          </button>
        </div>
      </form>
    </MainLayout>
  );
}

function FormField({ label, name, value, onChange, type = "text" }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label
        style={{
          display: "block",
          marginBottom: 6,
          fontWeight: 600,
          fontSize: 14,
        }}
      >
        {label}
      </label>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: 10,
          border: "1px solid #ddd",
          fontSize: 14,
        }}
      />
    </div>
  );
}
