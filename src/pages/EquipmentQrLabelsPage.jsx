// src/pages/EquipmentQrLabelsPage.jsx
// Hoja de etiquetas QR de todos los equipos de la planta, lista para imprimir y pegar.
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { usePlant } from "../context/PlantContext";
import { httpGet } from "../services/http";
import { qrDataUrl } from "../utils/equipmentQr";
import { Icon } from "../components/ui/lpIcons";
import "../components/LubricationCard/LubricationCardUi.css";
import "./EquipmentQrLabelsPage.css";

export default function EquipmentQrLabelsPage() {
  const navigate = useNavigate();
  const { currentPlantId, currentPlant } = usePlant();
  const [items, setItems] = useState(null);
  const [images, setImages] = useState({});
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [error, setError] = useState("");

  useEffect(() => {
    if (!currentPlantId) return;
    let alive = true;
    httpGet("/equipment/qr-labels")
      .then(async (r) => {
        const list = Array.isArray(r?.items) ? r.items : [];
        if (!alive) return;
        setItems(list);
        setSelected(new Set(list.filter((e) => String(e.status || "").toUpperCase() !== "INACTIVO").map((e) => e.id)));
        const imgs = {};
        for (const e of list) {
          if (e.qrToken) imgs[e.id] = await qrDataUrl(e.qrToken, 260);
        }
        if (alive) setImages(imgs);
      })
      .catch((e) => alive && setError(e?.message || "No se pudieron cargar los equipos"));
    return () => {
      alive = false;
    };
  }, [currentPlantId]);

  const visible = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (items || []).filter((e) => !s || `${e.name} ${e.code || ""} ${e.location || ""}`.toLowerCase().includes(s));
  }, [items, q]);
  const toPrint = (items || []).filter((e) => selected.has(e.id));

  const printSheet = () => {
    const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" })[c]);
    const cells = toPrint
      .map((e) => `<div class="l"><div class="b">LubriPlan · Carta de lubricación</div><img src="${images[e.id] || ""}"/><div class="n">${esc(e.name)}</div><div class="m">${esc([e.code, e.location].filter(Boolean).join(" · "))}</div></div>`)
      .join("");
    const w = window.open("", "_blank", "width=900,height=900");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Etiquetas QR</title><style>@page{margin:8mm}body{font-family:system-ui,Segoe UI,sans-serif;margin:0}.g{display:grid;grid-template-columns:repeat(3,1fr);gap:6mm}.l{border:1px dashed #94a3b8;border-radius:4mm;padding:4mm;text-align:center;break-inside:avoid}.b{font-size:8pt;font-weight:900;color:#f97316;text-transform:uppercase}img{width:40mm;height:40mm;image-rendering:pixelated}.n{font-weight:900;font-size:11pt;color:#0f172a}.m{font-size:8pt;color:#475569}</style></head><body><div class="g">${cells}</div><script>window.onload=function(){window.focus();window.print()}</script></body></html>`);
    w.document.close();
  };

  const toggle = (id) =>
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  return (
    <MainLayout>
      <div className="qrl-page">
        <div className="lc-hero qrl-noprint">
          <div>
            <div className="lc-kicker">EQUIPOS · CÓDIGOS QR</div>
            <h1>Etiquetas QR</h1>
            <div className="lc-hero-meta">
              <span>Cada equipo tiene un QR único y permanente. Al escanearlo se abre su carta de lubricación.</span>
              {currentPlant?.name ? <span>· {currentPlant.name}</span> : null}
            </div>
            <div className="lc-hero-actions">
              <button type="button" className="lc-btn" onClick={() => navigate("/equipments")}>
                <Icon name="equipment" size="sm" /> Equipos
              </button>
              <button type="button" className="lc-btn is-primary" onClick={printSheet} disabled={!toPrint.length || toPrint.some((e) => !images[e.id])}>
                <Icon name="doc" size="sm" /> Imprimir {toPrint.length} etiqueta{toPrint.length === 1 ? "" : "s"}
              </button>
            </div>
          </div>
        </div>

        {error ? <div className="lc-error qrl-noprint">{error}</div> : null}
        {items == null && !error ? <div className="lc-muted qrl-noprint">Generando códigos QR…</div> : null}

        {items?.length ? (
          <div className="qrl-tools qrl-noprint">
            <div className="qrl-search">
              <Icon name="search" size="sm" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar equipo, código o ubicación" />
            </div>
            <button type="button" className="lc-btn" onClick={() => setSelected(new Set(visible.map((e) => e.id)))}>
              Elegir visibles
            </button>
            <button type="button" className="lc-btn" onClick={() => setSelected(new Set())}>
              Ninguno
            </button>
          </div>
        ) : null}

        <div className="qrl-grid">
          {visible.map((e) => (
            <label key={e.id} className={`qrl-label ${selected.has(e.id) ? "is-on" : "is-off"}`}>
              <input type="checkbox" className="qrl-noprint" checked={selected.has(e.id)} onChange={() => toggle(e.id)} />
              <div className="qrl-brand">LubriPlan · Carta de lubricación</div>
              {images[e.id] ? <img src={images[e.id]} alt={`QR ${e.name}`} /> : <div className="qrl-ph">…</div>}
              <b>{e.name}</b>
              <span>{[e.code, e.location].filter(Boolean).join(" · ") || " "}</span>
            </label>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
