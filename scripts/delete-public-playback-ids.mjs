import { readFileSync } from "fs";
const envText = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
for (const line of envText.split("\n")) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)/);
  if (m) process.env[m[1]] = m[2];
}

import Mux from "@mux/mux-node";

const client = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET,
});

const assets = await client.video.assets.list({ limit: 50 });
let deleted = 0;
let skipped = 0;

for (const asset of assets.data) {
  const publicIds = (asset.playback_ids || []).filter(p => p.policy === "public");
  if (publicIds.length === 0) {
    skipped++;
    continue;
  }
  for (const pub of publicIds) {
    try {
      await client.video.assets.deletePlaybackId(asset.id, pub.id);
      deleted++;
      console.log(`Deleted public ID ${pub.id} from asset ${asset.id}`);
    } catch (e) {
      console.error(`ERROR deleting ${pub.id} from ${asset.id}:`, e.message);
    }
  }
}

console.log(`\nDone: ${deleted} public IDs deleted, ${skipped} assets had no public ID.`);

// Verify
const assetsAfter = await client.video.assets.list({ limit: 50 });
let remaining = 0;
for (const asset of assetsAfter.data) {
  const publicIds = (asset.playback_ids || []).filter(p => p.policy === "public");
  if (publicIds.length > 0) {
    remaining++;
    console.log(`WARNING: Asset ${asset.id} still has public ID: ${publicIds.map(p => p.id).join(", ")}`);
  }
}
console.log(`Verification: ${remaining} assets still have public playback IDs.`);
