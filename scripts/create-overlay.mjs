import { createRequire } from "module";
const require = createRequire(import.meta.url);
const sharp = require("sharp");
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const W = 1200;
const H = 44;

const svg = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="${W}" height="${H}" rx="8" ry="8" fill="rgba(0,0,0,0.5)" />
  <text x="${W / 2}" y="30" text-anchor="middle" direction="rtl"
        font-family="Arial, sans-serif" font-size="24" letter-spacing="1"
        fill="rgba(255,255,255,0.9)">
    סרטון פרטי - אין להקליט לשתף ולהפיץ - yomtovian.com
  </text>
</svg>`;

const outputPath = join(ROOT, "public/images/video-overlay.png");

await sharp(Buffer.from(svg))
  .png()
  .toFile(outputPath);

console.log("Text overlay created at:", outputPath);
const meta = await sharp(outputPath).metadata();
console.log("Dimensions:", meta.width, "x", meta.height);
console.log("Format:", meta.format, "hasAlpha:", meta.hasAlpha);
