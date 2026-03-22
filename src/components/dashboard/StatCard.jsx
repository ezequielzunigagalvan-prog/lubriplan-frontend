import CountUp from "react-countup";
import { useState, useEffect } from "react";

function StatCard({ value, label, color, onClick, delay = 0 }) {
  const [hover, setHover] = useState(false);
  const [visible, setVisible] = useState(false);

  // Animación de entrada
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: 20,
        borderRadius: 14,
        background: "var(--card)",
        color: "var(--text)",
        textAlign: "center",
        cursor: "pointer",
        borderTop: `5px solid var(--${color})`,
        boxShadow: hover
          ? `
            0 18px 45px rgba(0,0,0,0.35),
            0 0 18px rgba(var(--${color}-rgb), 0.55)
          `
          : "var(--shadow)",
        transform: visible
          ? hover
            ? "translateY(-6px)"
            : "translateY(0)"
          : "translateY(20px)",
        opacity: visible ? 1 : 0,
        transition: "all 0.35s ease",
        userSelect: "none",
      }}
    >
      <h3 style={{ fontSize: "2rem", margin: 0 }}>
        <CountUp end={value} duration={0.8} />
      </h3>
      <p style={{ margin: 0, opacity: 0.7 }}>{label}</p>
    </div>
  );
}

export default StatCard;