// Generates the icon set referenced by app/manifest.ts from the real logo
// (public/images/mark.png). Two shapes are needed for a good Android/PWA
// install experience:
//   - "any" icons: the logo on a solid white backing (flattened, not
//     transparent — a transparent PNG picks up whatever the launcher paints
//     behind it, which on some Android skins is black/dark).
//   - "maskable" icon: the logo shrunk onto a solid white square with
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

const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };

async function plainIcon(size) {
  await sharp(SRC)
    .resize(size, size, { fit: "contain", background: WHITE })
    .flatten({ background: WHITE })
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
    create: { width: size, height: size, channels: 4, background: WHITE },
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
