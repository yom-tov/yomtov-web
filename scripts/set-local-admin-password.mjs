#!/usr/bin/env node
// Sets the admin password for LOCAL development only (writes .env.local).
// Production keeps using ADMIN_PASSWORD_HASH from Vercel.
//
// Usage: node scripts/set-local-admin-password.mjs "your-admin-password"
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import bcrypt from "bcryptjs";

const [, , password] = process.argv;
if (!password) {
  console.error('Usage: node scripts/set-local-admin-password.mjs "<password>"');
  process.exit(1);
}

const FILE = ".env.local";
const hash = bcrypt.hashSync(password, 12);
// Next.js expands "$VAR" inside .env files, so every "$" of the bcrypt hash
// must be escaped or the hash gets mangled.
const line = `ADMIN_PASSWORD_HASH="${hash.replace(/\$/g, "\\$")}"`;

let text = existsSync(FILE) ? readFileSync(FILE, "utf8") : "";
if (/^ADMIN_PASSWORD_HASH=.*$/m.test(text)) {
  text = text.replace(/^ADMIN_PASSWORD_HASH=.*$/m, line);
} else {
  text = `${text.replace(/\s*$/, "")}\n${line}\n`;
}
writeFileSync(FILE, text);
console.log("✓ Local admin password updated in .env.local (the dev server picks it up automatically).");
