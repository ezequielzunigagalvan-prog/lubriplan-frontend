/** Ilustraciones SVG del tema industrial (engranes que giran). Decorativas: aria-hidden. */

function gearPath(cx, cy, outer, inner, teeth) {
  const points = [];
  const step = (Math.PI * 2) / (teeth * 2);
  for (let i = 0; i < teeth * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a0 = i * step - step / 2;
    const a1 = i * step + step / 2;
    points.push(`${cx + r * Math.cos(a0)},${cy + r * Math.sin(a0)}`);
    points.push(`${cx + r * Math.cos(a1)},${cy + r * Math.sin(a1)}`);
  }
  return `M${points.join('L')}Z`;
}

export function Gear({ cx, cy, r, teeth = 12, className = 'ind-gear', color = '#38bdf8', opacity = 0.9 }) {
  return (
    <g className={className}>
      <path d={gearPath(cx, cy, r, r * 0.82, teeth)} fill="none" stroke={color} strokeWidth="2.5" opacity={opacity} />
      <circle cx={cx} cy={cy} r={r * 0.55} fill="none" stroke={color} strokeWidth="2" opacity={opacity * 0.8} />
      <circle cx={cx} cy={cy} r={r * 0.18} fill={color} opacity={opacity} />
      {[0, 60, 120, 180, 240, 300].map((deg) => {
        const a = (deg * Math.PI) / 180;
        return (
          <line
            key={deg}
            x1={cx + r * 0.2 * Math.cos(a)}
            y1={cy + r * 0.2 * Math.sin(a)}
            x2={cx + r * 0.53 * Math.cos(a)}
            y2={cy + r * 0.53 * Math.sin(a)}
            stroke={color}
            strokeWidth="2"
            opacity={opacity * 0.7}
          />
        );
      })}
    </g>
  );
}

/** Conjunto de engranes engranados (para los héroes). */
export function GearCluster({ width = 420, height = 320 }) {
  return (
    <svg viewBox="0 0 420 320" width={width} height={height} aria-hidden="true" style={{ maxWidth: '100%', height: 'auto' }}>
      <Gear cx={170} cy={160} r={110} teeth={16} />
      <Gear cx={330} cy={95} r={64} teeth={10} className="ind-gear rev" color="#f59e0b" />
      <Gear cx={335} cy={240} r={46} teeth={8} className="ind-gear fast" color="#94a3b8" opacity={0.7} />
    </svg>
  );
}
