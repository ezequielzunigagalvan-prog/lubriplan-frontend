// src/components/ui/Tooltip.jsx
export default function Tooltip({ label, children }) {
  if (!label) return children;
  return (
    <span className="lpTooltipWrap">
      {children}
      <span className="lpTooltipBox">{label}</span>
    </span>
  );
}
