const SVGS = {
  compresor: (showName) => (
    <svg viewBox="0 0 320 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Base */}
      <rect x="20" y="150" width="280" height="30" rx="4" fill="#1C2230" stroke="#2A3448" strokeWidth="1.5" />
      {/* Main body */}
      <rect x="40" y="80" width="180" height="75" rx="8" fill="#131820" stroke="#2A3448" strokeWidth="1.5" />
      {/* Motor section */}
      <rect x="230" y="90" width="70" height="60" rx="6" fill="#0F1621" stroke="#2A3448" strokeWidth="1.5" />
      {/* Cooling fins */}
      {[0, 1, 2, 3, 4].map(i => (
        <line key={i} x1={250 + i * 9} y1="90" x2={250 + i * 9} y2="150" stroke="#2A3448" strokeWidth="1" />
      ))}
      {/* Inlet pipe */}
      <rect x="40" y="95" width="25" height="14" rx="3" fill="#0A0C0F" stroke="#F4A020" strokeWidth="1.5" />
      <text x="52" y="106" fill="#F4A020" fontSize="9" textAnchor="middle" fontFamily="DM Sans">IN</text>
      {/* Outlet pipe */}
      <rect x="195" y="95" width="25" height="14" rx="3" fill="#0A0C0F" stroke="#F4A020" strokeWidth="1.5" />
      <text x="207" y="106" fill="#F4A020" fontSize="9" textAnchor="middle" fontFamily="DM Sans">OUT</text>
      {/* Pressure gauge */}
      <circle cx="130" cy="75" r="14" fill="#0A0C0F" stroke="#2A3448" strokeWidth="1.5" />
      <circle cx="130" cy="75" r="9" fill="none" stroke="#2A3448" strokeWidth="1" />
      <line x1="130" y1="75" x2="136" y2="69" stroke="#F4A020" strokeWidth="1.5" strokeLinecap="round" />
      {/* Drain valve */}
      <rect x="115" y="155" width="20" height="12" rx="2" fill="#1C2230" stroke="#2A3448" strokeWidth="1" />
      {/* Labels */}
      {showName && <text x="130" y="130" fill="#7A8BA8" fontSize="11" textAnchor="middle" fontFamily="DM Sans">KAESER SK-19</text>}
      <text x="265" y="125" fill="#7A8BA8" fontSize="9" textAnchor="middle" fontFamily="DM Sans">MOTOR</text>
    </svg>
  ),
  bomba: (showName) => (
    <svg viewBox="0 0 320 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect x="20" y="160" width="280" height="25" rx="4" fill="#1C2230" stroke="#2A3448" strokeWidth="1.5" />
      {/* Volute */}
      <path d="M100 100 Q100 55 145 55 Q195 55 195 105 Q195 150 145 150 Q100 150 100 120Z" fill="#131820" stroke="#2A3448" strokeWidth="1.5" />
      {/* Impeller */}
      <circle cx="148" cy="103" r="30" fill="none" stroke="#2A3448" strokeWidth="1" />
      <circle cx="148" cy="103" r="10" fill="#0A0C0F" stroke="#F4A020" strokeWidth="1.5" />
      {[0, 60, 120, 180, 240, 300].map(a => (
        <line key={a}
          x1={148 + 10 * Math.cos(a * Math.PI / 180)}
          y1={103 + 10 * Math.sin(a * Math.PI / 180)}
          x2={148 + 28 * Math.cos((a + 20) * Math.PI / 180)}
          y2={103 + 28 * Math.sin((a + 20) * Math.PI / 180)}
          stroke="#2A3448" strokeWidth="2" strokeLinecap="round" />
      ))}
      {/* Inlet (left) */}
      <rect x="35" y="96" width="65" height="18" rx="4" fill="#0F1621" stroke="#2A3448" strokeWidth="1.5" />
      <text x="67" y="109" fill="#7A8BA8" fontSize="9" textAnchor="middle" fontFamily="DM Sans">ASPIRACIÓN</text>
      {/* Outlet (top) */}
      <rect x="132" y="28" width="32" height="27" rx="4" fill="#0F1621" stroke="#2A3448" strokeWidth="1.5" />
      <text x="148" y="45" fill="#7A8BA8" fontSize="9" textAnchor="middle" fontFamily="DM Sans">IMP</text>
      {/* Motor */}
      <rect x="200" y="80" width="90" height="55" rx="6" fill="#0F1621" stroke="#2A3448" strokeWidth="1.5" />
      {[0, 1, 2, 3, 4, 5].map(i => (
        <line key={i} x1={215 + i * 12} y1="80" x2={215 + i * 12} y2="135" stroke="#2A3448" strokeWidth="1" />
      ))}
      <text x="245" y="112" fill="#7A8BA8" fontSize="9" textAnchor="middle" fontFamily="DM Sans">MOTOR</text>
      {showName && <text x="148" y="175" fill="#7A8BA8" fontSize="11" textAnchor="middle" fontFamily="DM Sans">Grundfos CR-15</text>}
    </svg>
  ),
  reductor: (showName) => (
    <svg viewBox="0 0 320 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect x="30" y="155" width="260" height="25" rx="4" fill="#1C2230" stroke="#2A3448" strokeWidth="1.5" />
      {/* Housing */}
      <rect x="70" y="65" width="180" height="95" rx="10" fill="#131820" stroke="#2A3448" strokeWidth="2" />
      {/* Input shaft */}
      <rect x="30" y="103" width="40" height="14" rx="3" fill="#0F1621" stroke="#F4A020" strokeWidth="1.5" />
      {/* Output shaft */}
      <rect x="250" y="103" width="40" height="18" rx="4" fill="#0F1621" stroke="#F4A020" strokeWidth="2" />
      {/* Gear outlines */}
      <circle cx="120" cy="112" r="28" fill="none" stroke="#2A3448" strokeWidth="1.5" strokeDasharray="4 3" />
      <circle cx="190" cy="112" r="36" fill="none" stroke="#2A3448" strokeWidth="1.5" strokeDasharray="4 3" />
      <circle cx="120" cy="112" r="8" fill="#0A0C0F" stroke="#F4A020" strokeWidth="1.5" />
      <circle cx="190" cy="112" r="10" fill="#0A0C0F" stroke="#F4A020" strokeWidth="1.5" />
      {/* Oil level glass */}
      <rect x="75" y="130" width="10" height="18" rx="2" fill="#0A0C0F" stroke="#22C55E" strokeWidth="1.5" />
      <rect x="77" y="135" width="6" height="10" rx="1" fill="#22C55E" fillOpacity="0.4" />
      {/* Vent plug */}
      <rect x="148" y="60" width="14" height="8" rx="2" fill="#1C2230" stroke="#2A3448" strokeWidth="1" />
      {showName && <text x="160" y="145" fill="#7A8BA8" fontSize="11" textAnchor="middle" fontFamily="DM Sans">SEW R97</text>}
    </svg>
  ),
  motor: (showName) => (
    <svg viewBox="0 0 320 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect x="30" y="160" width="260" height="22" rx="4" fill="#1C2230" stroke="#2A3448" strokeWidth="1.5" />
      {/* Motor body */}
      <rect x="60" y="70" width="180" height="90" rx="8" fill="#131820" stroke="#2A3448" strokeWidth="2" />
      {/* Cooling fins */}
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => (
        <rect key={i} x={70 + i * 18} y="70" width="8" height="90" rx="1" fill="#0F1621" stroke="#2A3448" strokeWidth="1" />
      ))}
      {/* Drive end cap */}
      <rect x="35" y="78" width="28" height="74" rx="6" fill="#0F1621" stroke="#2A3448" strokeWidth="1.5" />
      {/* Shaft */}
      <rect x="20" y="110" width="18" height="12" rx="2" fill="#0F1621" stroke="#F4A020" strokeWidth="1.5" />
      {/* Fan cover NDE */}
      <path d="M240 70 L260 70 L270 78 L270 152 L260 160 L240 160Z" fill="#0F1621" stroke="#2A3448" strokeWidth="1.5" />
      {/* Terminal box */}
      <rect x="110" y="55" width="50" height="18" rx="4" fill="#1C2230" stroke="#2A3448" strokeWidth="1.5" />
      <text x="135" y="67" fill="#7A8BA8" fontSize="9" textAnchor="middle" fontFamily="DM Sans">460V/60Hz</text>
      {showName && <text x="150" y="145" fill="#7A8BA8" fontSize="11" textAnchor="middle" fontFamily="DM Sans">WEG W22</text>}
    </svg>
  ),
  ventilador: (showName) => (
    <svg viewBox="0 0 320 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect x="20" y="165" width="280" height="22" rx="4" fill="#1C2230" stroke="#2A3448" strokeWidth="1.5" />
      {/* Fan housing */}
      <circle cx="160" cy="105" r="75" fill="#131820" stroke="#2A3448" strokeWidth="2" />
      <circle cx="160" cy="105" r="60" fill="none" stroke="#2A3448" strokeWidth="1" strokeDasharray="6 4" />
      {/* Blades */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map(a => (
        <path key={a}
          d={`M ${160 + 12 * Math.cos(a * Math.PI / 180)} ${105 + 12 * Math.sin(a * Math.PI / 180)}
              Q ${160 + 45 * Math.cos((a + 25) * Math.PI / 180)} ${105 + 45 * Math.sin((a + 25) * Math.PI / 180)}
                ${160 + 55 * Math.cos((a + 45) * Math.PI / 180)} ${105 + 55 * Math.sin((a + 45) * Math.PI / 180)}`}
          stroke="#2A3448" strokeWidth="3" strokeLinecap="round" fill="none"
        />
      ))}
      {/* Hub */}
      <circle cx="160" cy="105" r="15" fill="#0A0C0F" stroke="#F4A020" strokeWidth="2" />
      <circle cx="160" cy="105" r="5" fill="#F4A020" />
      {/* Shaft */}
      <rect x="233" y="100" width="55" height="12" rx="3" fill="#0F1621" stroke="#F4A020" strokeWidth="1.5" />
      {showName && <text x="160" y="195" fill="#7A8BA8" fontSize="11" textAnchor="middle" fontFamily="DM Sans">Ventilador Siemens</text>}
    </svg>
  ),
  banda: (showName) => (
    <svg viewBox="0 0 320 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Frame */}
      <rect x="20" y="145" width="280" height="12" rx="3" fill="#1C2230" stroke="#2A3448" strokeWidth="1.5" />
      <rect x="25" y="157" width="8" height="30" rx="2" fill="#1C2230" stroke="#2A3448" strokeWidth="1" />
      <rect x="287" y="157" width="8" height="30" rx="2" fill="#1C2230" stroke="#2A3448" strokeWidth="1" />
      {/* Upper belt */}
      <rect x="50" y="100" width="220" height="20" rx="3" fill="#131820" stroke="#2A3448" strokeWidth="1.5" />
      {/* Lower belt */}
      <rect x="50" y="130" width="220" height="20" rx="3" fill="#0F1621" stroke="#2A3448" strokeWidth="1" />
      {/* Head drum */}
      <circle cx="270" cy="120" r="22" fill="#131820" stroke="#2A3448" strokeWidth="2" />
      <circle cx="270" cy="120" r="8" fill="#0A0C0F" stroke="#F4A020" strokeWidth="2" />
      {/* Tail drum */}
      <circle cx="50" cy="120" r="22" fill="#131820" stroke="#2A3448" strokeWidth="2" />
      <circle cx="50" cy="120" r="8" fill="#0A0C0F" stroke="#F4A020" strokeWidth="2" />
      {/* Idler rollers */}
      {[120, 160, 200].map(x => (
        <g key={x}>
          <rect x={x - 6} y="112" width="12" height="10" rx="3" fill="#1C2230" stroke="#2A3448" strokeWidth="1" />
        </g>
      ))}
      {/* Drive motor */}
      <rect x="250" y="60" width="55" height="35" rx="5" fill="#0F1621" stroke="#2A3448" strokeWidth="1.5" />
      <line x1="270" y1="95" x2="270" y2="98" stroke="#F4A020" strokeWidth="2" />
      {showName && <text x="160" y="85" fill="#7A8BA8" fontSize="11" textAnchor="middle" fontFamily="DM Sans">Banda Transportadora</text>}
    </svg>
  ),
  turbina: (showName) => (
    <svg viewBox="0 0 320 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect x="15" y="170" width="290" height="18" rx="4" fill="#1C2230" stroke="#2A3448" strokeWidth="1.5" />
      {/* Turbine casing */}
      <ellipse cx="110" cy="110" rx="70" ry="60" fill="#131820" stroke="#2A3448" strokeWidth="2" />
      {/* Turbine stages */}
      {[-20, 0, 20].map((offset, i) => (
        <ellipse key={i} cx={110 + offset} cy="110" rx="12" ry="45" fill="none" stroke="#2A3448" strokeWidth="1" strokeDasharray="3 3" />
      ))}
      {/* Main shaft */}
      <rect x="35" y="107" width="240" height="8" rx="2" fill="#0F1621" stroke="#F4A020" strokeWidth="1.5" />
      {/* Generator */}
      <rect x="195" y="82" width="100" height="58" rx="6" fill="#0F1621" stroke="#2A3448" strokeWidth="2" />
      {[0, 1, 2, 3, 4].map(i => (
        <line key={i} x1={210 + i * 17} y1="82" x2={210 + i * 17} y2="140" stroke="#2A3448" strokeWidth="1" />
      ))}
      <text x="245" y="115" fill="#7A8BA8" fontSize="9" textAnchor="middle" fontFamily="DM Sans">GENERADOR</text>
      {/* Steam inlet */}
      <rect x="75" y="42" width="24" height="35" rx="4" fill="#0F1621" stroke="#F4A020" strokeWidth="1.5" />
      <text x="87" y="60" fill="#F4A020" fontSize="8" textAnchor="middle" fontFamily="DM Sans">VAP</text>
      {/* Oil tank */}
      <rect x="20" y="135" width="40" height="28" rx="4" fill="#0F1621" stroke="#2A3448" strokeWidth="1.5" />
      <rect x="25" y="140" width="8" height="18" rx="1" fill="#0A0C0F" stroke="#22C55E" strokeWidth="1" />
      <rect x="27" y="148" width="4" height="8" rx="1" fill="#22C55E" fillOpacity="0.5" />
      <text x="47" y="150" fill="#7A8BA8" fontSize="8" textAnchor="middle" fontFamily="DM Sans">ACEITE</text>
      {showName && <text x="155" y="195" fill="#7A8BA8" fontSize="11" textAnchor="middle" fontFamily="DM Sans">Turbina GE</text>}
    </svg>
  ),
  agitador: (showName) => (
    <svg viewBox="0 0 320 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Reducer on top */}
      <rect x="120" y="20" width="80" height="50" rx="8" fill="#131820" stroke="#2A3448" strokeWidth="2" />
      <text x="160" y="50" fill="#7A8BA8" fontSize="9" textAnchor="middle" fontFamily="DM Sans">REDUCTOR</text>
      {showName && <text x="160" y="62" fill="#7A8BA8" fontSize="8" textAnchor="middle" fontFamily="DM Sans">Lightnin</text>}
      {/* Main shaft */}
      <rect x="156" y="70" width="8" height="120" rx="2" fill="#0F1621" stroke="#F4A020" strokeWidth="1.5" />
      {/* Support bracket */}
      <rect x="100" y="85" width="120" height="14" rx="4" fill="#1C2230" stroke="#2A3448" strokeWidth="1.5" />
      {/* Intermediate bearing */}
      <rect x="138" y="130" width="44" height="14" rx="4" fill="#1C2230" stroke="#2A3448" strokeWidth="1.5" />
      {/* Impeller blades */}
      <rect x="95" y="170" width="130" height="8" rx="3" fill="#131820" stroke="#2A3448" strokeWidth="1.5" />
      <rect x="115" y="162" width="90" height="8" rx="3" fill="#131820" stroke="#2A3448" strokeWidth="1.5" transform="rotate(-15 160 165)" />
      <rect x="115" y="162" width="90" height="8" rx="3" fill="#131820" stroke="#2A3448" strokeWidth="1.5" transform="rotate(15 160 165)" />
      {/* Tank outline */}
      <path d="M50 95 L50 200 Q50 210 60 210 L260 210 Q270 210 270 200 L270 95" stroke="#2A3448" strokeWidth="1.5" fill="none" strokeDasharray="6 4" />
      {/* Mechanical seal */}
      <rect x="145" y="195" width="30" height="10" rx="3" fill="#1C2230" stroke="#F4A020" strokeWidth="1" />
    </svg>
  ),
}

export default function EquipoSVG({ tipo, showName = true }) {
  const render = SVGS[tipo] || SVGS.motor
  return render(showName)
}
