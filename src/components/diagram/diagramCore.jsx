// src/components/diagram/diagramCore.jsx
// Geometría de líneas, plantillas iniciales y exportación (SVG / PNG / PDF).
import { renderToStaticMarkup } from "react-dom/server";
import { SYMBOLS, EDGE_KINDS, SYSTEM_TYPES, sizeOf, captionOf } from "./symbols";

let seq = 0;
export const uid = (p = "n") => `${p}${Date.now().toString(36)}${(seq++).toString(36)}`;

const center = (n) => {
  const s = sizeOf(n);
  return { x: n.x + s.w / 2, y: n.y + s.h / 2, ...s };
};

/**
 * Salida numerada: si la línea sale de un distribuidor progresivo o de un bloque y su etiqueta
 * es el número de salida, arranca desde esa salida (impares a la izquierda, pares a la derecha).
 */
function portStart(a, edge) {
  const k = parseInt(String(edge?.label || "").trim(), 10);
  if (!Number.isInteger(k) || k < 1) return null;
  if (a.type === "DIVIDER") {
    const outlets = Math.max(2, Math.min(24, Number(a.outlets) || 6));
    if (k > outlets) return null;
    const y = a.y + 22 + Math.floor((k - 1) / 2) * 20 + 2;
    return k % 2 ? { x: a.x, y, dir: "left" } : { x: a.x + 74, y, dir: "right" };
  }
  if (a.type === "MANIFOLD") {
    const ports = Math.max(1, Math.min(16, Number(a.ports) || 4));
    if (k > ports) return null;
    return { x: a.x + 30 + (k - 1) * 34, y: a.y + 34, dir: "down" };
  }
  return null;
}

/** Trayectoria ortogonal entre dos elementos (sale y entra por el lado más cercano). */
export function edgePath(a, b, route = "ortho", edge = null) {
  const P = portStart(a, edge);
  if (P) {
    const B = center(b);
    if (P.dir === "down") {
      const stub = P.y + 14;
      const ey = B.y - B.h / 2;
      const d = route === "straight" ? `M${P.x},${P.y} L${B.x},${ey}` : `M${P.x},${P.y} V${stub} H${B.x} V${ey}`;
      return { d, mid: { x: P.x, y: P.y + 8 }, port: true };
    }
    const sgn = P.dir === "left" ? -1 : 1;
    const stubX = P.x + sgn * 16;
    const ex = B.x - Math.sign(B.x - stubX || sgn) * (B.w / 2);
    const d = route === "straight" ? `M${P.x},${P.y} L${ex},${B.y}` : `M${P.x},${P.y} H${stubX} V${B.y} H${ex}`;
    return { d, mid: { x: P.x + sgn * 9, y: P.y - 9 }, port: true };
  }
  const A = center(a);
  const B = center(b);
  const dx = B.x - A.x;
  const dy = B.y - A.y;
  if (Math.abs(dx) >= Math.abs(dy)) {
    const sx = A.x + Math.sign(dx || 1) * (A.w / 2);
    const ex = B.x - Math.sign(dx || 1) * (B.w / 2);
    if (route === "straight") return { d: `M${sx},${A.y} L${ex},${B.y}`, mid: { x: (sx + ex) / 2, y: (A.y + B.y) / 2 } };
    const mx = (sx + ex) / 2;
    return { d: `M${sx},${A.y} H${mx} V${B.y} H${ex}`, mid: { x: mx, y: (A.y + B.y) / 2 } };
  }
  const sy = A.y + Math.sign(dy || 1) * (A.h / 2);
  const ey = B.y - Math.sign(dy || 1) * (B.h / 2);
  if (route === "straight") return { d: `M${A.x},${sy} L${B.x},${ey}`, mid: { x: (A.x + B.x) / 2, y: (sy + ey) / 2 } };
  const my = (sy + ey) / 2;
  return { d: `M${A.x},${sy} V${my} H${B.x} V${ey}`, mid: { x: (A.x + B.x) / 2, y: my } };
}

export function boundsOf(nodes) {
  if (!nodes.length) return { x: 0, y: 0, w: 800, h: 500 };
  let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
  for (const n of nodes) {
    const s = sizeOf(n);
    x1 = Math.min(x1, n.x - 10);
    y1 = Math.min(y1, n.y - 10);
    x2 = Math.max(x2, n.x + s.w + 70);
    y2 = Math.max(y2, n.y + s.h + 34);
  }
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
}

/** Dibujo de un elemento (símbolo + texto). */
export function NodeShape({ node, selected = false, pending = false }) {
  const sym = SYMBOLS[node.type];
  if (!sym) return null;
  const s = sizeOf(node);
  const cap = captionOf(node);
  const above = node.type === "MANIFOLD";
  return (
    <g transform={`translate(${node.x},${node.y})`}>
      {selected || pending ? (
        <rect x={-6} y={-6} width={s.w + 12} height={s.h + 12} rx={8} fill="none" stroke={pending ? "#16a34a" : "#f97316"} strokeWidth={2} strokeDasharray="5 4" />
      ) : null}
      {sym.draw(node)}
      {cap.title ? (
        <text x={above ? 0 : s.w / 2} y={above ? -6 : s.h + 14} fontSize={11} fontWeight={900} textAnchor={above ? "start" : "middle"} fill="#0f172a" fontFamily="Segoe UI, system-ui, sans-serif">
          {cap.title}
        </text>
      ) : null}
      {cap.extra && !above ? (
        <text x={s.w / 2} y={s.h + 27} fontSize={9.5} fontWeight={700} textAnchor="middle" fill="#64748b" fontFamily="Segoe UI, system-ui, sans-serif">
          {cap.extra}
        </text>
      ) : null}
    </g>
  );
}

export function EdgeShape({ edge, nodesById, selected = false }) {
  const a = nodesById[edge.from];
  const b = nodesById[edge.to];
  if (!a || !b) return null;
  const k = EDGE_KINDS[edge.kind] || EDGE_KINDS.SECONDARY;
  const { d, mid, port } = edgePath(a, b, edge.route, edge);
  return (
    <g>
      {selected ? <path d={d} fill="none" stroke="#f97316" strokeWidth={k.width + 6} strokeOpacity={0.35} /> : null}
      <path d={d} fill="none" stroke={k.stroke} strokeWidth={k.width} strokeDasharray={k.dash} strokeLinejoin="round" />
      {edge.label && !port ? (
        <g transform={`translate(${mid.x},${mid.y})`}>
          <rect x={-(String(edge.label).length * 3.4 + 7)} y={-9} width={String(edge.label).length * 6.8 + 14} height={18} rx={9} fill="#ffffff" stroke={k.stroke} strokeWidth={1} />
          <text y={4} fontSize={10} fontWeight={900} textAnchor="middle" fill={k.stroke} fontFamily="Segoe UI, system-ui, sans-serif">
            {edge.label}
          </text>
        </g>
      ) : null}
    </g>
  );
}

// ── Plantillas ──────────────────────────────────────────────────────────────
const N = (type, x, y, extra = {}) => ({ id: uid(), type, x, y, ...SYMBOLS[type].defaults, ...extra });
const E = (from, to, kind, label = "") => ({ id: uid("e"), from: from.id, to: to.id, kind, label });

export function templateFor(systemType) {
  if (systemType === "PROGRESSIVE") {
    const ctrl = N("CONTROLLER", 40, 40);
    const pump = N("PUMP_GREASE", 40, 160);
    const relief = N("RELIEF", 60, 330, { label: "Alivio" });
    const main = N("DIVIDER", 260, 150, { label: "Distribuidor principal", outlets: 6 });
    const cyc = N("CYCLE_SWITCH", 275, 70, { label: "Control de ciclo" });
    const sec1 = N("DIVIDER", 480, 40, { label: "Secundario A", outlets: 6 });
    const sec2 = N("DIVIDER", 480, 260, { label: "Secundario B", outlets: 6 });
    const pts = [
      N("POINT", 680, 30, { label: "Rodamiento 1" }), N("POINT", 680, 100, { label: "Rodamiento 2" }),
      N("POINT", 680, 250, { label: "Rodamiento 3" }), N("POINT", 680, 320, { label: "Rodamiento 4" }),
    ];
    return {
      nodes: [ctrl, pump, relief, main, cyc, sec1, sec2, ...pts],
      edges: [
        E(ctrl, pump, "SIGNAL"), E(pump, main, "MAIN"), E(pump, relief, "MAIN"), E(cyc, ctrl, "SIGNAL"),
        E(main, sec1, "SECONDARY", "2"), E(main, sec2, "SECONDARY", "6"),
        E(sec1, pts[0], "SECONDARY", "2"), E(sec1, pts[1], "SECONDARY", "4"),
        E(sec2, pts[2], "SECONDARY", "2"), E(sec2, pts[3], "SECONDARY", "4"),
      ],
    };
  }
  if (systemType === "OIL_METERING") {
    const tank = N("TANK", 30, 60);
    const pump = N("PUMP_OIL", 50, 190);
    const filter = N("FILTER", 200, 194);
    const ps = N("PRESSURE_SWITCH", 330, 90, { pressure: "8 bar" });
    const gauge = N("GAUGE", 420, 92, { pressure: "0–25 bar" });
    const relief = N("RELIEF", 150, 290, { pressure: "15 bar" });
    const man = N("MANIFOLD", 330, 200, { ports: 4 });
    const meters = [0, 1, 2, 3].map((i) => N("METERING", 337 + i * 34 - 18 + 18, 300, { volume: "0.10 cc" }));
    meters.forEach((m, i) => (m.x = 324 + i * 70));
    const pts = meters.map((m, i) => N("POINT", m.x + 6, 400, { label: `Punto ${i + 1}` }));
    return {
      nodes: [tank, pump, filter, ps, gauge, relief, man, ...meters, ...pts],
      edges: [
        E(tank, pump, "MAIN"), E(pump, filter, "MAIN"), E(filter, man, "MAIN"), E(man, ps, "SECONDARY"), E(man, gauge, "SECONDARY"),
        E(pump, relief, "MAIN"), E(relief, tank, "RETURN"),
        ...meters.map((m, i) => E(man, m, "SECONDARY", String(i + 1))),
        ...meters.map((m, i) => E(m, pts[i], "SECONDARY")),
      ],
    };
  }
  return { nodes: [], edges: [] };
}

// ── Exportación ─────────────────────────────────────────────────────────────
const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/** SVG completo con cuadro de título y simbología, listo para descargar. */
export function buildExportSvg({ nodes, edges, name, systemType, equipment, plant, author }) {
  const b = boundsOf(nodes);
  const used = [...new Set(nodes.map((n) => n.type))].filter((t) => t !== "NOTE");
  const usedEdges = [...new Set(edges.map((e) => e.kind || "SECONDARY"))];
  const legendRows = Math.ceil((used.length + usedEdges.length) / 4);
  const W = Math.max(900, b.w + 60);
  const drawH = b.h + 40;
  const titleH = 92;
  const legendH = 34 + legendRows * 30;
  const H = drawH + legendH + titleH;
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const d = new Date();
  const date = `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  const offX = (W - b.w) / 2 - b.x;
  const offY = 20 - b.y;
  const legendItems = [
    ...used.map((t) => ({ kind: "node", t })),
    ...usedEdges.map((k) => ({ kind: "edge", k })),
  ];
  const colW = (W - 40) / 4;

  const svg = (
    <svg xmlns="http://www.w3.org/2000/svg" width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <rect width={W} height={H} fill="#ffffff" />
      <defs>
        <pattern id="g" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0 H0 V20" fill="none" stroke="#f1f5f9" strokeWidth="1" />
        </pattern>
      </defs>
      <rect x={10} y={10} width={W - 20} height={drawH - 10} fill="url(#g)" stroke="#cbd5e1" />
      <g transform={`translate(${offX},${offY})`}>
        {edges.map((e) => (
          <EdgeShape key={e.id} edge={e} nodesById={byId} />
        ))}
        {nodes.map((n) => (
          <NodeShape key={n.id} node={n} />
        ))}
      </g>
      <g transform={`translate(20,${drawH + 6})`}>
        <text y={14} fontSize={11} fontWeight={900} fill="#475569" fontFamily="Segoe UI, sans-serif" letterSpacing="1">SIMBOLOGÍA</text>
        {legendItems.map((it, i) => {
          const x = (i % 4) * colW;
          const y = 26 + Math.floor(i / 4) * 30;
          if (it.kind === "edge") {
            const k = EDGE_KINDS[it.k] || EDGE_KINDS.SECONDARY;
            return (
              <g key={`e${it.k}`} transform={`translate(${x},${y})`}>
                <line x1={0} y1={10} x2={34} y2={10} stroke={k.stroke} strokeWidth={k.width} strokeDasharray={k.dash} />
                <text x={42} y={14} fontSize={11} fontWeight={700} fill="#0f172a" fontFamily="Segoe UI, sans-serif">{k.label}</text>
              </g>
            );
          }
          const sym = SYMBOLS[it.t];
          const s = sym.size({ ...sym.defaults });
          const sc = Math.min(22 / s.w, 22 / s.h);
          return (
            <g key={it.t} transform={`translate(${x},${y})`}>
              <g transform={`scale(${sc})`}>{sym.draw({ ...sym.defaults, capacity: "", volume: "", setting: "" })}</g>
              <text x={30} y={14} fontSize={11} fontWeight={700} fill="#0f172a" fontFamily="Segoe UI, sans-serif">{sym.label}</text>
            </g>
          );
        })}
      </g>
      <g transform={`translate(10,${H - titleH})`}>
        <rect width={W - 20} height={titleH - 10} fill="#0f172a" />
        <rect width={6} height={titleH - 10} fill="#f97316" />
        <text x={22} y={26} fontSize={11} fontWeight={900} fill="#fdba74" fontFamily="Segoe UI, sans-serif" letterSpacing="1.2">
          DIAGRAMA DE LUBRICACIÓN AUTOMÁTICA · {String(SYSTEM_TYPES[systemType] || "").toUpperCase()}
        </text>
        <text x={22} y={52} fontSize={20} fontWeight={900} fill="#ffffff" fontFamily="Segoe UI, sans-serif">{name}</text>
        <text x={22} y={72} fontSize={11} fontWeight={700} fill="#cbd5e1" fontFamily="Segoe UI, sans-serif">
          {[equipment?.name, equipment?.code, plant].filter(Boolean).join("  ·  ")}
        </text>
        <text x={W - 40} y={52} fontSize={11} fontWeight={800} fill="#ffffff" textAnchor="end" fontFamily="Segoe UI, sans-serif">{date}</text>
        <text x={W - 40} y={72} fontSize={10} fontWeight={700} fill="#94a3b8" textAnchor="end" fontFamily="Segoe UI, sans-serif">
          {author ? `Elaboró: ${author} · ` : ""}LubriPlan
        </text>
      </g>
    </svg>
  );
  return { svg: `<?xml version="1.0" encoding="UTF-8"?>\n${renderToStaticMarkup(svg)}`, width: W, height: H };
}

export async function svgToPng(svgText, width, height, scale = 2) {
  const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = () => rej(new Error("No se pudo convertir el diagrama a imagen"));
      img.src = url;
    });
    const c = document.createElement("canvas");
    c.width = Math.round(width * scale);
    c.height = Math.round(height * scale);
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function download(href, filename) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export const fileSafe = (s) => String(s || "diagrama").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9\-_]+/g, "_").slice(0, 60);
