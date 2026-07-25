/*
 * Creates a minimal, import-safe Vercel environment file from .env.local.
 * Local URLs and optional AI-provider credentials are deliberately excluded.
 * Usage: node scripts/create-vercel-env.js
 */
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const inputPath = path.join(projectRoot, '.env.local');
const outputPath = path.join(projectRoot, '.env.vercel-import');

if (!fs.existsSync(inputPath)) {
  console.error('No .env.local file was found.');
  process.exit(1);
}

const lines = fs.readFileSync(inputPath, 'utf8').split(/\r?\n/);
const result = [];
const omitted = [];
const allowedKeys = new Set([
  'DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'DB_SSL', 'USE_SQLITE',
  'JWT_SECRET', 'JWT_EXPIRES_IN',
  'PAYSTACK_SECRET_KEY', 'PAYSTACK_PUBLIC_KEY', 'NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY',
  'EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASS', 'EMAIL_FROM',
]);

for (const line of lines) {
  const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=/);
  if (!match) {
    if (line.trim() && !line.trim().startsWith('#')) result.push(line);
    continue;
  }

  const key = match[1];
  if (!allowedKeys.has(key)) {
    omitted.push(key);
    continue;
  }

  // A simple unquoted KEY=value format is accepted by Vercel's raw editor.
  const value = line.slice(line.indexOf('=') + 1).trim().replace(/^(?:"([\s\S]*)"|'([\s\S]*)')$/, '$1$2');
  result.push(`${key}=${value}`);
}

fs.writeFileSync(outputPath, `${result.join('\n').trim()}\n`, { mode: 0o600 });
console.log(`Created ${path.basename(outputPath)} with ${result.length} entries.`);
if (omitted.length) console.log(`Omitted reserved variables: ${omitted.join(', ')}`);
