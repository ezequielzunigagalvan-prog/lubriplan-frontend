export default function EquipmentRanking({ ranking }) {
  if (ranking.length === 0) return null;

  return (
    <div style={{ marginBottom: 40 }}>
      <h3>⚠️ Equipos más problemáticos</h3>

      <ol>
        {ranking.map(([equipment, score], index) => (
          <li key={equipment} style={{ marginBottom: 6 }}>
            <strong>
              {index + 1}. {equipment}
            </strong>{" "}
            — {score} punto{score > 1 ? "s" : ""}
          </li>
        ))}
      </ol>
    </div>
  );
}