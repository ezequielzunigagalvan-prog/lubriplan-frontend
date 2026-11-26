// src/pages/LubeDiagramEditorPage.jsx
// Editor de diagramas de lubricación automática de un equipo.
// Ruta: /equipments/:id/diagrams/:diagramId   (diagramId = "new" para uno nuevo; ?type=PROGRESSIVE|OIL_METERING|...)
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import MainLayout from "../layouts/MainLayout";
import { useAuth } from "../context/AuthContext";
import { usePlant } from "../context/PlantContext";
import { Icon } from "../components/ui/lpIcons";
import { SYMBOLS, PALETTE, PROPS, EDGE_KINDS, SYSTEM_TYPES, sizeOf } from "../components/diagram/symbols";
import { NodeShape, EdgeShape, edgePath, templateFor, uid, boundsOf, buildExportSvg, svgToPng, download, fileSafe } from "../components/diagram/diagramCore";
import { getDiagram, createDiagram, updateDiagram } from "../services/equipmentTechService";
import { getEquipmentById } from "../services/equipmentService";
import "../components/diagram/DiagramEditor.css";

const GRID = 10;
const snap = (v) => Math.round(v / GRID) * GRID;
const clone = (x) => JSON.parse(JSON.stringify(x));

export default function LubeDiagramEditorPage() {
  const { id, diagramId } = useParams();
  const equipmentId = Number(id);
  const isNew = diagramId === "new";
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { currentPlant } = usePlant();
  const canEdit = ["ADMIN", "SUPERVISOR"].includes(String(user?.role || "").toUpperCase());

  const [equipment, setEquipment] = useState(null);
  const [name, setName] = useState("");
  const [systemType, setSystemType] = useState(() => new URLSearchParams(location.search).get("type") || "PROGRESSIVE");
  const [notes, setNotes] = useState("");
  const [doc, setDoc] = useState({ nodes: [], edges: [] });
  const [savedId, setSavedId] = useState(isNew ? null : Number(diagramId));
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [sel, setSel] = useState(null); // { kind: "node"|"edge", id }
  const [mode, setMode] = useState("select"); // select | connect
  const [edgeKind, setEdgeKind] = useState("SECONDARY");
  const [pendingFrom, setPendingFrom] = useState(null);
  const [view, setView] = useState({ x: -20, y: -20, k: 1 });
  const [exportOpen, setExportOpen] = useState(false);

  const svgRef = useRef(null);
  const drag = useRef(null);
  const past = useRef([]);
  const future = useRef([]);

  // ── Carga ────────────────────────────────────────────────────────────────
  useEffect(() => {
    getEquipmentById(equipmentId)
      .then((r) => setEquipment(r?.item ?? r?.equipment ?? r))
      .catch(() => setEquipment(null));
  }, [equipmentId]);

  useEffect(() => {
    if (isNew) {
      const t = templateFor(systemType);
      setDoc(t);
      setName(`Sistema ${SYSTEM_TYPES[systemType]?.toLowerCase() || ""}`.trim());
      setDirty(true);
      return;
    }
    let alive = true;
    getDiagram(equipmentId, diagramId)
      .then((r) => {
        if (!alive) return;
        const d = r?.diagram;
        setName(d?.name || "");
        setSystemType(d?.systemType || "OTHER");
        setNotes(d?.notes || "");
        setDoc({ nodes: d?.data?.nodes || [], edges: d?.data?.edges || [] });
        if (d?.data?.view) setView(d.data.view);
      })
      .catch((e) => alive && setError(e?.message || "No se pudo abrir el diagrama"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [equipmentId, diagramId]);

  // Aviso al salir con cambios sin guardar
  useEffect(() => {
    const fn = (e) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", fn);
    return () => window.removeEventListener("beforeunload", fn);
  }, [dirty]);

  const byId = useMemo(() => Object.fromEntries(doc.nodes.map((n) => [n.id, n])), [doc.nodes]);
  const selNode = sel?.kind === "node" ? byId[sel.id] : null;
  const selEdge = sel?.kind === "edge" ? doc.edges.find((e) => e.id === sel.id) : null;

  // ── Historial ────────────────────────────────────────────────────────────
  const commit = useCallback((next) => {
    setDoc((prev) => {
      past.current.push(clone(prev));
      if (past.current.length > 60) past.current.shift();
      future.current = [];
      return typeof next === "function" ? next(prev) : next;
    });
    setDirty(true);
  }, []);
  const undo = useCallback(() => {
    const prev = past.current.pop();
    if (!prev) return;
    setDoc((cur) => {
      future.current.push(clone(cur));
      return prev;
    });
    setDirty(true);
  }, []);
  const redo = useCallback(() => {
    const nxt = future.current.pop();
    if (!nxt) return;
    setDoc((cur) => {
      past.current.push(clone(cur));
      return nxt;
    });
    setDirty(true);
  }, []);

  // ── Coordenadas ──────────────────────────────────────────────────────────
  const toWorld = useCallback(
    (clientX, clientY) => {
      const r = svgRef.current.getBoundingClientRect();
      return { x: view.x + (clientX - r.left) / view.k, y: view.y + (clientY - r.top) / view.k };
    },
    [view]
  );

  const addNode = (type) => {
    if (!canEdit) return;
    const r = svgRef.current.getBoundingClientRect();
    const c = toWorld(r.left + r.width / 2, r.top + r.height / 2);
    const n = { id: uid(), type, ...SYMBOLS[type].defaults };
    const s = sizeOf(n);
    // Evita encimar: desplaza si ya hay algo en el centro
    const offset = (doc.nodes.filter((m) => Math.abs(m.x - (c.x - s.w / 2)) < 30 && Math.abs(m.y - (c.y - s.h / 2)) < 30).length) * 30;
    n.x = snap(c.x - s.w / 2 + offset);
    n.y = snap(c.y - s.h / 2 + offset);
    commit((d) => ({ ...d, nodes: [...d.nodes, n] }));
    setSel({ kind: "node", id: n.id });
    setMode("select");
  };

  const removeSelected = useCallback(() => {
    if (!canEdit || !sel) return;
    if (sel.kind === "node") {
      commit((d) => ({ nodes: d.nodes.filter((n) => n.id !== sel.id), edges: d.edges.filter((e) => e.from !== sel.id && e.to !== sel.id) }));
    } else {
      commit((d) => ({ ...d, edges: d.edges.filter((e) => e.id !== sel.id) }));
    }
    setSel(null);
  }, [canEdit, sel, commit]);

  const duplicate = () => {
    if (!selNode) return;
    const n = { ...clone(selNode), id: uid(), x: selNode.x + 30, y: selNode.y + 30 };
    commit((d) => ({ ...d, nodes: [...d.nodes, n] }));
    setSel({ kind: "node", id: n.id });
  };

  const patchNode = (patch) => commit((d) => ({ ...d, nodes: d.nodes.map((n) => (n.id === selNode.id ? { ...n, ...patch } : n)) }));
  const patchEdge = (patch) => commit((d) => ({ ...d, edges: d.edges.map((e) => (e.id === selEdge.id ? { ...e, ...patch } : e)) }));

  // ── Teclado ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      const tag = String(e.target?.tagName || "").toLowerCase();
      if (["input", "textarea", "select"].includes(tag)) return;
      if ((e.key === "Delete" || e.key === "Backspace") && sel) {
        e.preventDefault();
        removeSelected();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      } else if (e.key === "Escape") {
        setPendingFrom(null);
        setMode("select");
        setSel(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sel, removeSelected, undo, redo]);

  // ── Puntero: arrastrar elementos y mover el lienzo ───────────────────────
  const onNodeDown = (e, n) => {
    e.stopPropagation();
    if (mode === "connect" && canEdit) {
      if (!pendingFrom) {
        setPendingFrom(n.id);
      } else if (pendingFrom !== n.id) {
        const exists = doc.edges.some((x) => (x.from === pendingFrom && x.to === n.id) || (x.from === n.id && x.to === pendingFrom));
        if (exists) toast.info("Esos elementos ya están conectados");
        else {
          const edge = { id: uid("e"), from: pendingFrom, to: n.id, kind: edgeKind, label: "" };
          commit((d) => ({ ...d, edges: [...d.edges, edge] }));
          setSel({ kind: "edge", id: edge.id });
        }
        setPendingFrom(null);
      }
      return;
    }
    setSel({ kind: "node", id: n.id });
    if (!canEdit) return;
    const p = toWorld(e.clientX, e.clientY);
    drag.current = { type: "node", id: n.id, dx: p.x - n.x, dy: p.y - n.y, start: clone(doc), moved: false };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onBgDown = (e) => {
    if (e.button !== 0 && e.button !== 1) return;
    setSel(null);
    if (mode === "connect") setPendingFrom(null);
    drag.current = { type: "pan", sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onMove = (e) => {
    const d = drag.current;
    if (!d) return;
    if (d.type === "pan") {
      setView((v) => ({ ...v, x: d.vx - (e.clientX - d.sx) / v.k, y: d.vy - (e.clientY - d.sy) / v.k }));
      return;
    }
    const p = toWorld(e.clientX, e.clientY);
    const x = snap(p.x - d.dx);
    const y = snap(p.y - d.dy);
    d.moved = true;
    setDoc((cur) => ({ ...cur, nodes: cur.nodes.map((n) => (n.id === d.id ? { ...n, x, y } : n)) }));
  };

  const onUp = () => {
    const d = drag.current;
    drag.current = null;
    if (d?.type === "node" && d.moved) {
      past.current.push(d.start);
      future.current = [];
      setDirty(true);
    }
  };

  const onWheel = (e) => {
    e.preventDefault();
    const r = svgRef.current.getBoundingClientRect();
    const f = e.deltaY < 0 ? 1.1 : 1 / 1.1;
    setView((v) => {
      const k = Math.min(3, Math.max(0.3, v.k * f));
      const mx = v.x + (e.clientX - r.left) / v.k;
      const my = v.y + (e.clientY - r.top) / v.k;
      return { k, x: mx - (e.clientX - r.left) / k, y: my - (e.clientY - r.top) / k };
    });
  };

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return undefined;
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  });

  const zoom = (f) => setView((v) => ({ ...v, k: Math.min(3, Math.max(0.3, v.k * f)) }));
  const fit = useCallback(() => {
    if (!svgRef.current) return;
    const r = svgRef.current.getBoundingClientRect();
    const b = boundsOf(doc.nodes);
    const k = Math.min(2, Math.max(0.3, Math.min(r.width / (b.w + 60), r.height / (b.h + 60))));
    setView({ k, x: b.x - (r.width / k - b.w) / 2, y: b.y - (r.height / k - b.h) / 2 });
  }, [doc.nodes]);

  // Ajuste inicial al abrir
  const fitted = useRef(false);
  useEffect(() => {
    if (fitted.current || loading || !doc.nodes.length) return;
    fitted.current = true;
    const t = setTimeout(fit, 50);
    return () => clearTimeout(t);
  }, [loading, doc.nodes.length, fit]);

  // ── Guardar ──────────────────────────────────────────────────────────────
  const save = async () => {
    if (!canEdit || saving) return;
    if (name.trim().length < 2) return toast.error("Escribe el nombre del diagrama");
    setSaving(true);
    try {
      const payload = { name: name.trim(), systemType, notes, data: { nodes: doc.nodes, edges: doc.edges, view } };
      if (savedId) {
        await updateDiagram(equipmentId, savedId, payload);
      } else {
        const r = await createDiagram(equipmentId, payload);
        setSavedId(r?.diagram?.id);
        navigate(`/equipments/${equipmentId}/diagrams/${r?.diagram?.id}`, { replace: true });
      }
      setDirty(false);
      toast.success("Diagrama guardado");
    } catch (e) {
      toast.error(e?.message || "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  // ── Exportar ─────────────────────────────────────────────────────────────
  const doExport = async (fmt) => {
    setExportOpen(false);
    if (!doc.nodes.length) return toast.error("El diagrama está vacío");
    try {
      const { svg, width, height } = buildExportSvg({
        nodes: doc.nodes,
        edges: doc.edges,
        name: name || "Diagrama",
        systemType,
        equipment,
        plant: currentPlant?.name,
        author: user?.name,
      });
      const base = `Diagrama_${fileSafe(equipment?.code || equipment?.name)}_${fileSafe(name)}`;
      if (fmt === "svg") {
        const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
        download(url, `${base}.svg`);
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        return;
      }
      const png = await svgToPng(svg, width, height, 2);
      if (fmt === "png") return download(png, `${base}.png`);
      const { jsPDF } = await import("jspdf");
      const landscape = width >= height;
      const pdf = new jsPDF(landscape ? "landscape" : "portrait", "pt", "a4");
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();
      const m = 24;
      const k = Math.min((pw - 2 * m) / width, (ph - 2 * m) / height);
      pdf.addImage(png, "PNG", (pw - width * k) / 2, (ph - height * k) / 2, width * k, height * k);
      pdf.save(`${base}.pdf`);
    } catch (e) {
      toast.error(e?.message || "No se pudo exportar");
    }
  };

  const back = () => {
    if (dirty && canEdit && !window.confirm("Hay cambios sin guardar. ¿Salir de todos modos?")) return;
    navigate(`/equipments/${equipmentId}#diagramas`);
  };

  const counts = useMemo(() => {
    const c = (t) => doc.nodes.filter((n) => n.type === t).length;
    return { points: c("POINT"), dividers: c("DIVIDER"), meters: c("METERING") };
  }, [doc.nodes]);

  const pendingNode = pendingFrom ? byId[pendingFrom] : null;

  return (
    <MainLayout>
      <div className="dg-page">
        <header className="dg-head">
          <button type="button" className="dg-btn is-ghost" onClick={back}>
            <Icon name="arrowLeft" size="sm" /> {equipment?.name || "Equipo"}
          </button>
          <div className="dg-title">
            <input value={name} onChange={(e) => { setName(e.target.value); setDirty(true); }} disabled={!canEdit} placeholder="Nombre del diagrama" aria-label="Nombre del diagrama" />
            <select value={systemType} onChange={(e) => { setSystemType(e.target.value); setDirty(true); }} disabled={!canEdit} aria-label="Tipo de sistema">
              {Object.entries(SYSTEM_TYPES).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="dg-head-actions">
            {dirty && canEdit ? <span className="dg-dirty">Sin guardar</span> : null}
            <div className="dg-export">
              <button type="button" className="dg-btn" onClick={() => setExportOpen((v) => !v)}>
                <Icon name="download" size="sm" /> Descargar
              </button>
              {exportOpen ? (
                <div className="dg-menu" onMouseLeave={() => setExportOpen(false)}>
                  <button type="button" onClick={() => doExport("pdf")}>PDF (para imprimir)</button>
                  <button type="button" onClick={() => doExport("png")}>Imagen PNG</button>
                  <button type="button" onClick={() => doExport("svg")}>SVG (editable / CAD)</button>
                </div>
              ) : null}
            </div>
            {canEdit ? (
              <button type="button" className="dg-btn is-primary" onClick={save} disabled={saving}>
                <Icon name="check" size="sm" /> {saving ? "Guardando…" : "Guardar"}
              </button>
            ) : null}
          </div>
        </header>

        {error ? <div className="dg-error">{error}</div> : null}

        <div className={`dg-body ${canEdit ? "" : "is-readonly"}`}>
          {canEdit ? (
            <aside className="dg-palette" aria-label="Símbolos">
              {PALETTE.map((g) => (
                <div key={g.group} className="dg-pgroup">
                  <div className="dg-pgroup-title">{g.group}</div>
                  <div className="dg-pgrid">
                    {g.types.map((t) => {
                      const sym = SYMBOLS[t];
                      const s = sym.size({ ...sym.defaults });
                      const sc = Math.min(34 / s.w, 34 / s.h);
                      return (
                        <button key={t} type="button" className="dg-sym" onClick={() => addNode(t)} title={`Agregar ${sym.label}`}>
                          <svg width="40" height="40" viewBox="-3 -3 40 40">
                            <g transform={`scale(${sc})`}>{sym.draw({ ...sym.defaults, capacity: "", volume: "", setting: "" })}</g>
                          </svg>
                          <span>{sym.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </aside>
          ) : null}

          <section className="dg-canvas-wrap">
            <div className="dg-toolbar">
              {canEdit ? (
                <>
                  <button type="button" className={`dg-tool ${mode === "select" ? "is-on" : ""}`} onClick={() => { setMode("select"); setPendingFrom(null); }} title="Seleccionar y mover (Esc)">
                    <Icon name="grid" size="sm" /> Mover
                  </button>
                  <button type="button" className={`dg-tool ${mode === "connect" ? "is-on" : ""}`} onClick={() => { setMode("connect"); setSel(null); }} title="Conectar dos elementos">
                    <Icon name="route" size="sm" /> Conectar
                  </button>
                  <select value={edgeKind} onChange={(e) => setEdgeKind(e.target.value)} aria-label="Tipo de línea" className="dg-kind">
                    {Object.entries(EDGE_KINDS).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                  <span className="dg-sep" />
                  <button type="button" className="dg-tool" onClick={undo} title="Deshacer (Ctrl+Z)">
                    <Icon name="reset" size="sm" />
                  </button>
                  <button type="button" className="dg-tool" onClick={redo} title="Rehacer (Ctrl+Y)">
                    <Icon name="refresh" size="sm" />
                  </button>
                  <span className="dg-sep" />
                </>
              ) : (
                <span className="dg-ro">Solo lectura</span>
              )}
              <button type="button" className="dg-tool" onClick={() => zoom(1 / 1.2)} title="Alejar">−</button>
              <span className="dg-zoom">{Math.round(view.k * 100)}%</span>
              <button type="button" className="dg-tool" onClick={() => zoom(1.2)} title="Acercar">+</button>
              <button type="button" className="dg-tool" onClick={fit} title="Ajustar a pantalla">
                <Icon name="eye" size="sm" /> Ajustar
              </button>
              <span className="dg-stats">
                {doc.nodes.length} elementos · {counts.dividers} distribuidores · {counts.meters} dosificadores · {counts.points} puntos
              </span>
            </div>

            {mode === "connect" ? (
              <div className="dg-hint">
                {pendingNode ? `Ahora toca el elemento destino desde «${pendingNode.label || SYMBOLS[pendingNode.type].label}»` : "Toca el elemento de origen y luego el de destino"} · Línea: {EDGE_KINDS[edgeKind].label} · Esc para salir
              </div>
            ) : null}

            <svg
              ref={svgRef}
              className={`dg-canvas ${mode === "connect" ? "is-connect" : ""}`}
              onPointerDown={onBgDown}
              onPointerMove={onMove}
              onPointerUp={onUp}
              onPointerLeave={onUp}
            >
              <defs>
                <pattern id="dg-grid" width={20 * view.k} height={20 * view.k} patternUnits="userSpaceOnUse" x={-view.x * view.k} y={-view.y * view.k}>
                  <path d={`M${20 * view.k} 0 H0 V${20 * view.k}`} fill="none" stroke="#e2e8f0" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#dg-grid)" />
              <g transform={`scale(${view.k}) translate(${-view.x},${-view.y})`}>
                {doc.edges.map((e) => {
                  const a = byId[e.from];
                  const b = byId[e.to];
                  if (!a || !b) return null;
                  const { d } = edgePath(a, b, e.route, e);
                  return (
                    <g key={e.id}>
                      <EdgeShape edge={e} nodesById={byId} selected={sel?.kind === "edge" && sel.id === e.id} />
                      <path
                        d={d}
                        fill="none"
                        stroke="transparent"
                        strokeWidth={14}
                        style={{ cursor: "pointer" }}
                        onPointerDown={(ev) => {
                          ev.stopPropagation();
                          setSel({ kind: "edge", id: e.id });
                        }}
                      />
                    </g>
                  );
                })}
                {doc.nodes.map((n) => {
                  const s = sizeOf(n);
                  return (
                    <g key={n.id} onPointerDown={(e) => onNodeDown(e, n)} style={{ cursor: mode === "connect" ? "crosshair" : canEdit ? "move" : "pointer" }}>
                      <rect x={n.x - 4} y={n.y - 4} width={s.w + 8} height={s.h + 8} fill="transparent" />
                      <NodeShape node={n} selected={sel?.kind === "node" && sel.id === n.id} pending={pendingFrom === n.id} />
                    </g>
                  );
                })}
              </g>
            </svg>
            {!doc.nodes.length && !loading ? (
              <div className="dg-empty">
                <b>Lienzo vacío</b>
                <span>Agrega símbolos desde la izquierda o empieza con una plantilla.</span>
                {canEdit ? (
                  <div className="dg-empty-actions">
                    <button type="button" className="dg-btn" onClick={() => commit(templateFor("PROGRESSIVE"))}>Plantilla progresivo</button>
                    <button type="button" className="dg-btn" onClick={() => commit(templateFor("OIL_METERING"))}>Plantilla aceite con dosificadores</button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>

          <aside className="dg-props" aria-label="Propiedades">
            {selNode ? (
              <>
                <div className="dg-props-title">{SYMBOLS[selNode.type]?.label}</div>
                {selNode.type !== "NOTE" ? (
                  <label className="dg-field">
                    Etiqueta
                    <input value={selNode.label || ""} onChange={(e) => patchNode({ label: e.target.value })} disabled={!canEdit} />
                  </label>
                ) : null}
                {(PROPS[selNode.type] || []).map((p) => (
                  <label key={p.key} className="dg-field">
                    {p.label}
                    {p.type === "textarea" ? (
                      <textarea rows={4} value={selNode[p.key] || ""} onChange={(e) => patchNode({ [p.key]: e.target.value })} disabled={!canEdit} />
                    ) : (
                      <input
                        type={p.type || "text"}
                        min={p.min}
                        max={p.max}
                        step={p.step}
                        placeholder={p.placeholder}
                        value={selNode[p.key] ?? ""}
                        onChange={(e) => patchNode({ [p.key]: p.type === "number" ? Math.max(p.min, Math.min(p.max, Number(e.target.value) || p.min)) : e.target.value })}
                        disabled={!canEdit}
                      />
                    )}
                  </label>
                ))}
                <label className="dg-field">
                  Notas
                  <textarea rows={3} value={selNode.notes || ""} onChange={(e) => patchNode({ notes: e.target.value })} disabled={!canEdit} placeholder="Ubicación, número de parte…" />
                </label>
                <div className="dg-props-meta">
                  Conexiones: {doc.edges.filter((e) => e.from === selNode.id || e.to === selNode.id).length}
                </div>
                {canEdit ? (
                  <div className="dg-props-actions">
                    <button type="button" className="dg-btn" onClick={duplicate}><Icon name="copy" size="sm" /> Duplicar</button>
                    <button type="button" className="dg-btn is-danger" onClick={removeSelected}><Icon name="trash" size="sm" /> Eliminar</button>
                  </div>
                ) : null}
              </>
            ) : selEdge ? (
              <>
                <div className="dg-props-title">Línea</div>
                <div className="dg-props-meta">
                  {(byId[selEdge.from]?.label || SYMBOLS[byId[selEdge.from]?.type]?.label)} → {(byId[selEdge.to]?.label || SYMBOLS[byId[selEdge.to]?.type]?.label)}
                </div>
                <label className="dg-field">
                  Tipo
                  <select value={selEdge.kind} onChange={(e) => patchEdge({ kind: e.target.value })} disabled={!canEdit}>
                    {Object.entries(EDGE_KINDS).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </label>
                <label className="dg-field">
                  Etiqueta (salida, diámetro…)
                  <input value={selEdge.label || ""} onChange={(e) => patchEdge({ label: e.target.value })} disabled={!canEdit} placeholder="Ej. 3 · Ø6 mm" />
                </label>
                <label className="dg-field">
                  Trazo
                  <select value={selEdge.route || "ortho"} onChange={(e) => patchEdge({ route: e.target.value })} disabled={!canEdit}>
                    <option value="ortho">Ortogonal</option>
                    <option value="straight">Recto</option>
                  </select>
                </label>
                {canEdit ? (
                  <div className="dg-props-actions">
                    <button type="button" className="dg-btn" onClick={() => patchEdge({ from: selEdge.to, to: selEdge.from })}><Icon name="refresh" size="sm" /> Invertir</button>
                    <button type="button" className="dg-btn is-danger" onClick={removeSelected}><Icon name="trash" size="sm" /> Eliminar</button>
                  </div>
                ) : null}
              </>
            ) : (
              <>
                <div className="dg-props-title">Diagrama</div>
                <label className="dg-field">
                  Notas generales
                  <textarea rows={5} value={notes} onChange={(e) => { setNotes(e.target.value); setDirty(true); }} disabled={!canEdit} placeholder="Ciclo, presión de trabajo, lubricante, observaciones…" />
                </label>
                <div className="dg-help">
                  <b>Cómo dibujar</b>
                  <ol>
                    <li>Toca un símbolo de la izquierda para agregarlo.</li>
                    <li>Arrástralo a su lugar (se alinea a la cuadrícula).</li>
                    <li>Usa <b>Conectar</b>: toca origen y destino.</li>
                    <li>Selecciona un elemento o línea para editar sus datos.</li>
                    <li>Arrastra el fondo para moverte; rueda del mouse para zoom.</li>
                  </ol>
                  <span>Supr borra · Ctrl+Z deshace · Esc cancela</span>
                </div>
              </>
            )}
          </aside>
        </div>
      </div>
    </MainLayout>
  );
}
