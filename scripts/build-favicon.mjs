// Rebuild app/favicon.ico from our real logo (public/images/mark.png).
// The scaffolded app/favicon.ico (Next.js default triangle icon) was never
// replaced when we set up app/icon.png / apple-icon.png — and the
// convention route `app/favicon.ico` wins over <link rel="icon"> in many
// browsers, so the tab kept showing the wrong icon. ICO files can embed PNG
// data directly (valid since Vista+, supported by every current browser),
// so we hand-roll a tiny multi-resolution ICO container around sharp's
// PNG output instead of pulling in an ICO-writing dependency.
import sharp from "sharp";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = join(__dirname, "..", "public", "images", "mark.png");
const OUT = join(__dirname, "..", "app", "favicon.ico");

const SIZES = [16, 32, 48];

function buildIco(pngBuffers, sizes) {
  const count = pngBuffers.length;
  const headerSize = 6 + 16 * count;
  let offset = headerSize;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: 1 = icon
  header.writeUInt16LE(count, 4);

  const entries = [];
  for (let i = 0; i < count; i++) {
    const size = sizes[i];
    const png = pngBuffers[i];
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // width (0 = 256)
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // height
    entry.writeUInt8(0, 2); // color count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // planes
    entry.writeUInt16LE(32, 6); // bit count
    entry.writeUInt32LE(png.length, 8); // bytes in resource
    entry.writeUInt32LE(offset, 12); // offset
    entries.push(entry);
    offset += png.length;
  }

  return Buffer.concat([header, ...entries, ...pngBuffers]);
}

const pngBuffers = await Promise.all(
  SIZES.map((size) =>
    sharp(SRC).resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer()
  )
);

const ico = buildIco(pngBuffers, SIZES);
writeFileSync(OUT, ico);
console.log(`Wrote ${OUT} (${ico.length} bytes, sizes: ${SIZES.join(", ")})`);
