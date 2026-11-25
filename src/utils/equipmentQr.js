// src/utils/equipmentQr.js
// URL e imagen del QR único de un equipo (el token lo genera y guarda el servidor).
import QRCode from "qrcode";

export function qrUrl(token) {
  return `${window.location.origin}/qr/${token}`;
}

export async function qrDataUrl(token, width = 320) {
  return QRCode.toDataURL(qrUrl(token), { errorCorrectionLevel: "M", margin: 1, width, color: { dark: "#0f172a", light: "#ffffff" } });
}
