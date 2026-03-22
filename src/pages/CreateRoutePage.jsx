import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";

export default function CreateRoutePage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    lubricant: "",
    frequency: "",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // 👉 aquí luego conectamos backend
    console.log("Nueva ruta:", form);

    // regresar a listado
    navigate("/routes");
  };

  return (
    <MainLayout>
      <h1>Nueva ruta</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>
        Crea una nueva ruta de lubricación
      </p>

      <form
        onSubmit={handleSubmit}
        style={{
          maxWidth: 420,
          background: "#fff",
          padding: 24,
          borderRadius: 16,
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        }}
      >
        <label style={labelStyle}>Nombre de la ruta</label>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          required
          style={inputStyle}
        />

        <label style={labelStyle}>Lubricante</label>
        <input
          name="lubricant"
          value={form.lubricant}
          onChange={handleChange}
          style={inputStyle}
        />

        <label style={labelStyle}>Frecuencia</label>
        <input
          name="frequency"
          value={form.frequency}
          onChange={handleChange}
          placeholder="Ej. Cada 7 días"
          style={inputStyle}
        />

        <button
          type="submit"
          style={{
            marginTop: 16,
            width: "100%",
            background: "#ff7a00",
            color: "#fff",
            padding: 12,
            borderRadius: 10,
            border: "none",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Guardar ruta
        </button>
      </form>
    </MainLayout>
  );
}

const labelStyle = {
  display: "block",
  fontWeight: 600,
  marginTop: 12,
  marginBottom: 4,
};

const inputStyle = {
  width: "100%",
  padding: 10,
  borderRadius: 8,
  border: "1px solid #ddd",
};