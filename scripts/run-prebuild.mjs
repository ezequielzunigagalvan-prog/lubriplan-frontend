import { execSync } from "node:child_process";
import { generateSitemap } from "./generate-sitemap.mjs";

generateSitemap();

try {
  execSync("npx eslint .", { stdio: "inherit" });
} catch {
  console.warn("Lint no bloqueante: se continua con el build.");
}
