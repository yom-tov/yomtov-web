// Generates the icon set referenced by app/manifest.ts from the real logo
// (public/images/mark.png). Two shapes are needed for a good Android/PWA
// install experience:
//   - "any" icons: the logo as-is, used verbatim.
//   - "maskable" icon: the logo shrunk onto a solid brand-navy square with
//     generous padding, because Android crops maskable icons into a circle/
//     squircle/rounded-square depending on the launcher — content near the
//     edges of a plain "any" icon gets clipped without that safe zone.
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = join(__dirname, "..", "public", "images", "mark.png");
const OUT_DIR = join(__dirname, "..", "public", "icons");
mkdirSync(OUT_DIR, { recursive: true });

const BRAND_NAVY = { r: 11, g: 30, b: 58, alpha: 1 }; // --primary-900

async function plainIcon(size) {
  await sharp(SRC)
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(join(OUT_DIR, `icon-${size}.png`));
  console.log(`icon-${size}.png`);
}

async function maskableIcon(size) {
  // Safe zone: keep artwork within the inner ~66% so it survives any
  // launcher's crop mask.
  const logoSize = Math.round(size * 0.62);
  const logo = await sharp(SRC).resize(logoSize, logoSize, { fit: "contain" }).png().toBuffer();
  await sharp({
    create: { width: size, height: size, channels: 4, background: BRAND_NAVY },
  })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toFile(join(OUT_DIR, `maskable-icon-${size}.png`));
  console.log(`maskable-icon-${size}.png`);
}

await plainIcon(192);
await plainIcon(512);
await maskableIcon(512);
console.log("Done.");
