// src/components/ui/Tag.jsx
export default function Tag({ children, tone = "slate", size = "md" }) {
  const tones = {
    slate: { bg: "#f1f5f9", br: "#e2e8f0", tx: "#0f172a" },
    blue: { bg: "#eff6ff", br: "#bfdbfe", tx: "#1e40af" },
    green: { bg: "#ecfdf5", br: "#bbf7d0", tx: "#166534" },
    amber: { bg: "#fffbeb", br: "#fde68a", tx: "#92400e" },
    red: { bg: "#fef2f2", br: "#fecaca", tx: "#991b1b" },
  };

  const s = tones[tone] || tones.slate;

  const sizes = {
    sm: { pad: "2px 8px", fs: 11 },
    md: { pad: "3px 10px", fs: 12 },
  };

  const z = sizes[size] || sizes.md;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: z.pad,
        fontSize: z.fs,
        fontWeight: 900,
        borderRadius: 999,
        background: s.bg,
        border: `1px solid ${s.br}`,
        color: s.tx,
        letterSpacing: 0.2,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}