#!/usr/bin/env node
// Usage: node scripts/hash-password.mjs "your-plain-password"
// Prints a bcrypt hash to paste into ADMIN_PASSWORD_HASH env var.
import bcrypt from 'bcryptjs';

const [, , password] = process.argv;
if (!password) {
  console.error('Usage: node scripts/hash-password.mjs "<password>"');
  process.exit(1);
}
if (password.length < 12) {
  console.error('Refusing: password must be at least 12 characters.');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 12);
console.log('\nADMIN_PASSWORD_HASH=' + hash + '\n');
console.log('Paste this line into your Vercel project env vars (Production + Preview + Development).');
