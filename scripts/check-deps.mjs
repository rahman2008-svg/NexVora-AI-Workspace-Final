#!/usr/bin/env node
// Dependency consistency: every package imported from src/App/index must be declared in package.json,
// and declared runtime dependencies that nothing imports are listed for review (never auto-removed).
// Run: node scripts/check-deps.mjs
import fs from 'node:fs';
import path from 'node:path';
import { builtinModules } from 'node:module';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const declared = new Set([...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.devDependencies ?? {})]);
const files = [];
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { if (['node_modules', 'locales', 'assets'].includes(e.name)) continue; const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (/\.(tsx?|jsx?)$/.test(e.name)) files.push(p); } })(path.join(root, 'src'));
files.push(path.join(root, 'App.tsx'), path.join(root, 'index.js'));
const used = new Map();
// Only real import/export/require statements (not words inside comments or strings)
const re = /^\s*(?:import|export)\b[^'"`;]*?\bfrom\s*['"]([^'"]+)['"]|^\s*import\s*['"]([^'"]+)['"]|\brequire\(\s*['"]([^'"]+)['"]\s*\)|\bimport\(\s*['"]([^'"]+)['"]\s*\)/gm;
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  for (const m of src.matchAll(re)) {
    const spec = m[1] || m[2] || m[3] || m[4];
    if (spec.startsWith('.') || spec.startsWith('@/') || spec.startsWith('node:') || builtinModules.includes(spec) || spec.endsWith('.png') || spec.endsWith('.json') || spec.endsWith('.css')) continue;
    const name = spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0];
    if (!used.has(name)) used.set(name, path.relative(root, f));
  }
}
const aliasOnly = new Set(['@env', '@yz1311/react-native-intent-launcher']);
const undeclared = [...used].filter(([n]) => !declared.has(n) && !aliasOnly.has(n));
console.log(`imported packages: ${used.size}; declared: ${declared.size}`);
if (undeclared.length) { console.log('FAIL  imported but NOT declared in package.json:'); undeclared.forEach(([n, f]) => console.log(`   ${n}  (first seen in ${f})`)); }
else console.log('ok    every imported package is declared in package.json');
const maybeUnused = Object.keys(pkg.dependencies ?? {}).filter((n) => !used.has(n));
console.log(`info  declared runtime deps with no direct import in JS (native/autolinked/CLI packages are normal here): ${maybeUnused.length}`);
console.log('      ' + maybeUnused.join(', '));
process.exit(undeclared.length ? 1 : 0);
