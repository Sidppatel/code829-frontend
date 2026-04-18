#!/usr/bin/env node
// Sync the canonical logo from packages/shared/src/assets/logo.svg to each app's
// public/ folder. The public/ copies are only used for favicons
// (<link rel="icon" href="/logo.svg"> in each app's index.html) — in-app
// rendering (BrandLogo.tsx) imports the canonical directly via Vite.
// Run this whenever the canonical logo changes:
//     pnpm sync-logo
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const src = resolve(root, 'packages/shared/src/assets/logo.svg');
const svg = readFileSync(src, 'utf8');

const targets = [
  'apps/public/public/logo.svg',
  'apps/admin/public/logo.svg',
  'apps/staff/public/logo.svg',
  'apps/developer/public/logo.svg',
];

for (const t of targets) {
  const dest = resolve(root, t);
  writeFileSync(dest, svg);
  console.log(`  ✓ ${t}`);
}

console.log(`Synced ${targets.length} favicons from ${src} (${svg.length} bytes)`);
