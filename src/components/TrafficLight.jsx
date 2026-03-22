export default function TrafficLight({ stats }) {
  const levels = [
    { label: "Normal", color: "#2ecc71" },
    { label: "Atención", color: "#f1c40f" },
    { label: "Crítico", color: "#e74c3c" },
  ];

  return (
    <>
      <h3>Semáforo de criticidad</h3>

      <div style={{ display: "flex", gap: 20, marginBottom: 30 }}>
        {levels.map(({ label, color }) => (
          <div
            key={label}
            style={{
              flex: 1,
              background: "#f8f9fa",
              borderRadius: 10,
              padding: 20,
              textAlign: "center",
              border: `3px solid ${color}`,
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: color,
                margin: "0 auto 10px",
              }}
            />
            <h3>{stats[label] || 0}</h3>
            <p>{label}</p>
          </div>
        ))}
      </div>
    </>
  );
}