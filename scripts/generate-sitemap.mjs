import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendRoot = path.resolve(__dirname, "..");
const publicDir = path.join(frontendRoot, "public");

export const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/card",
  "/contacto",
  "/que-es-lubriplan",
  "/software-lubricacion-industrial",
  "/cartas-digitales-lubricacion",
  "/rutas-de-lubricacion",
  "/gestion-de-lubricantes",
  "/analisis-de-lubricacion",
];

export function generateSitemap() {
  mkdirSync(publicDir, { recursive: true });
  const now = new Date().toISOString();
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...PUBLIC_ROUTES.map((route) => {
      const normalized = route === "/" ? "" : route;
      return [
        '  <url>',
        `    <loc>https://www.lubriplan.com${normalized}</loc>`,
        `    <lastmod>${now}</lastmod>`,
        '    <changefreq>weekly</changefreq>',
        route === "/" ? '    <priority>1.0</priority>' : '    <priority>0.8</priority>',
        '  </url>',
      ].join("\n");
    }),
    '</urlset>',
    '',
  ].join("\n");

  writeFileSync(path.join(publicDir, "sitemap.xml"), xml, "utf8");
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  generateSitemap();
}
