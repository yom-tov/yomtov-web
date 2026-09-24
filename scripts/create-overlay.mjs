import { createRequire } from "module";
const require = createRequire(import.meta.url);
const sharp = require("sharp");
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const logoBuf = readFileSync(join(ROOT, "public/images/logo.png"));
const logoB64 = logoBuf.toString("base64");

const W = 900;
const H = 280;

const svg = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="${W}" height="${H}" rx="20" ry="20" fill="rgba(0,0,0,0.55)" />

  <image href="data:image/png;base64,${logoB64}"
         x="${(W - 200) / 2}" y="15" width="200" height="82" />

  <line x1="100" y1="108" x2="${W - 100}" y2="108" stroke="rgba(255,255,255,0.3)" stroke-width="1" />

  <text x="${W / 2}" y="148" text-anchor="middle"
        font-family="Arial, sans-serif" font-size="32" font-weight="bold"
        fill="rgba(255,255,255,0.85)" direction="rtl">
    סרטון פרטי — yomtovian.com
  </text>

  <text x="${W / 2}" y="192" text-anchor="middle"
        font-family="Arial, sans-serif" font-size="26"
        fill="rgba(255,200,200,0.8)" direction="rtl">
    אין לצלם, לשתף או להפיץ
  </text>

  <text x="${W / 2}" y="232" text-anchor="middle"
        font-family="Arial, sans-serif" font-size="22"
        fill="rgba(255,255,255,0.55)" direction="rtl">
    כל הזכויות שמורות
  </text>
</svg>`;

const outputPath = join(ROOT, "public/images/video-overlay.png");

await sharp(Buffer.from(svg))
  .png()
  .toFile(outputPath);

console.log("Overlay created at:", outputPath);

const meta = await sharp(outputPath).metadata();
console.log("Dimensions:", meta.width, "x", meta.height);
console.log("Format:", meta.format, "hasAlpha:", meta.hasAlpha);
