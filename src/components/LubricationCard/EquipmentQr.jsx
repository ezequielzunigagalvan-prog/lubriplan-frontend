// src/components/LubricationCard/EquipmentQr.jsx
// QR único del equipo: lo genera el servidor una sola vez y queda guardado.
// El QR abre /qr/<token> → la carta de lubricación del equipo.
import { useEffect, useState } from "react";
import { qrUrl, qrDataUrl } from "../../utils/equipmentQr";
import { toast } from "sonner";
import { Icon } from "../ui/lpIcons";
import "./LubricationCardUi.css";

/** Etiqueta PNG (QR + nombre + código) lista para imprimir y pegar en el equipo. */
async function buildLabelPng(token, equipment) {
  const W = 600;
  const H = 760;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const x = c.getContext("2d");
  x.fillStyle = "#ffffff";
  x.fillRect(0, 0, W, H);
  x.fillStyle = "#0f172a";
  x.fillRect(0, 0, W, 86);
  x.fillStyle = "#f97316";
  x.fillRect(0, 86, W, 8);
  x.fillStyle = "#ffffff";
  x.font = "900 34px system-ui, Segoe UI, sans-serif";
  x.textAlign = "center";
  x.fillText("LubriPlan · Carta de lubricación", W / 2, 56);

  const img = new Image();
  img.src = await qrDataUrl(token, 440);
  await new Promise((r) => (img.onload = r));
  x.drawImage(img, (W - 440) / 2, 120, 440, 440);

  const fit = (text, size, y, weight = 900, color = "#0f172a") => {
    let s = size;
    x.font = `${weight} ${s}px system-ui, Segoe UI, sans-serif`;
    while (x.measureText(text).width > W - 60 && s > 16) {
      s -= 2;
      x.font = `${weight} ${s}px system-ui, Segoe UI, sans-serif`;
    }
    x.fillStyle = color;
    x.fillText(text, W / 2, y);
  };
  fit(equipment?.name || "Equipo", 40, 618);
  fit([equipment?.code, equipment?.location].filter(Boolean).join(" · ") || " ", 26, 660, 800, "#475569");
  fit("Escanea para ver puntos, lubricantes y frecuencias", 20, 718, 700, "#94a3b8");
  return c.toDataURL("image/png");
}

const safeName = (s) => String(s || "equipo").replace(/[^a-zA-Z0-9\-_]+/g, "_").slice(0, 40);

export default function EquipmentQr({ token, createdAt, equipment, compact = false }) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    if (!token) return;
    let alive = true;
    qrDataUrl(token, 360)
      .then((d) => alive && setSrc(d))
      .catch(() => alive && setSrc(""));
    return () => {
      alive = false;
    };
  }, [token]);

  if (!token) return null;

  const download = async () => {
    try {
      const png = await buildLabelPng(token, equipment);
      const a = document.createElement("a");
      a.href = png;
      a.download = `QR-${safeName(equipment?.code || equipment?.name)}.png`;
      a.click();
    } catch {
      toast.error("No se pudo generar la etiqueta");
    }
  };

  const print = async () => {
    const png = await buildLabelPng(token, equipment);
    const w = window.open("", "_blank", "width=520,height=700");
    if (!w) return toast.error("Permite las ventanas emergentes para imprimir");
    w.document.write(
      `<!DOCTYPE html><html><head><title>QR ${equipment?.name || ""}</title><style>@page{margin:10mm}body{margin:0;display:flex;justify-content:center}img{width:80mm}</style></head><body><img src="${png}" onload="window.focus();window.print()"/></body></html>`
    );
    w.document.close();
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(qrUrl(token));
      toast.success("Enlace copiado");
    } catch {
      toast.error("No se pudo copiar");
    }
  };

  return (
    <div className={`lc-qr ${compact ? "is-compact" : ""}`}>
      <div className="lc-qr-img">{src ? <img src={src} alt={`QR de ${equipment?.name || "equipo"}`} /> : <span>…</span>}</div>
      <div className="lc-qr-info">
        <div className="lc-kicker">QR DEL EQUIPO</div>
        <b>Código único · {token}</b>
        <span>
          Pégalo en el equipo: al escanearlo se abre esta carta.
          {createdAt ? ` Generado el ${new Date(createdAt).toLocaleDateString("es-MX")}.` : ""}
        </span>
        <div className="lc-qr-actions">
          <button type="button" className="lc-btn is-primary" onClick={download}>
            <Icon name="download" size="sm" /> Etiqueta PNG
          </button>
          <button type="button" className="lc-btn" onClick={print}>
            <Icon name="doc" size="sm" /> Imprimir
          </button>
          <button type="button" className="lc-btn" onClick={copy}>
            <Icon name="link" size="sm" /> Copiar enlace
          </button>
        </div>
      </div>
    </div>
  );
}
