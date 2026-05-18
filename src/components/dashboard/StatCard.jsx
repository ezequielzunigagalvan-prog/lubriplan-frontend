import CountUp from "react-countup";
import { useState, useEffect } from "react";

const colorMap = {
  success: { top: "#22c55e", glow: "rgba(34,197,94,0.18)", bg: "rgba(34,197,94,0.06)" },
  warning: { top: "#f59e0b", glow: "rgba(245,158,11,0.20)", bg: "rgba(245,158,11,0.06)" },
  danger:  { top: "#ef4444", glow: "rgba(239,68,68,0.18)",  bg: "rgba(239,68,68,0.06)"  },
};

function StatCard({ value, label, color = "success", onClick, delay = 0 }) {
  const [hover, setHover] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  const theme = colorMap[color] || colorMap.success;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: "20px 20px 16px",
        borderRadius: 16,
        background: hover ? theme.bg : "var(--lp-surface, #fff)",
        textAlign: "center",
        cursor: onClick ? "pointer" : "default",
        borderTop: `4px solid ${theme.top}`,
        border: `1px solid var(--lp-border, #e2e8f0)`,
        borderTopWidth: 4,
        borderTopColor: theme.top,
        boxShadow: hover
          ? `0 16px 36px ${theme.glow}, 0 4px 8px rgba(2,6,23,0.06)`
          : "0 2px 8px rgba(2,6,23,0.06)",
        transform: visible
          ? hover ? "translateY(-4px)" : "translateY(0)"
          : "translateY(16px)",
        opacity: visible ? 1 : 0,
        transition: "transform 280ms ease, opacity 280ms ease, box-shadow 200ms ease, background 200ms ease",
        userSelect: "none",
      }}
    >
      <div style={{
        fontSize: "2.2rem",
        fontWeight: 800,
        color: "var(--lp-text, #0f172a)",
        lineHeight: 1,
        letterSpacing: "-0.03em",
      }}>
        <CountUp end={value} duration={0.7} />
      </div>
      <div style={{
        marginTop: 8,
        fontSize: 13,
        fontWeight: 700,
        color: "var(--lp-text-muted, #64748b)",
        letterSpacing: 0.2,
      }}>
        {label}
      </div>
    </div>
  );
}

export default StatCard;
