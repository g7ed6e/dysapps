// Vérifie, sur une pull request, que la version mineure a été incrémentée par rapport à la branche de base :
// chaque build publié porte ainsi un numéro nouveau (affiché dans les réglages et le bandeau de mise à jour).
// Usage : node scripts/check-version.mjs <ref de base>   (ex. origin/main)
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const base = process.argv[2] ?? 'origin/main';
const parse = (v) => {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(v);
  if (!m) throw new Error(`Version illisible : ${v}`);
  return m.slice(1).map(Number);
};

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
const before = JSON.parse(execFileSync('git', ['show', `${base}:package.json`], { encoding: 'utf8' })).version;
const [maj, min] = parse(pkg.version);
const [bMaj, bMin] = parse(before);

const errors = [];
if (lock.version !== pkg.version || lock.packages?.['']?.version !== pkg.version)
  errors.push(`package-lock.json (${lock.version}) ne suit pas package.json (${pkg.version}) : lancer « npm run version:minor ».`);
if (!(maj > bMaj || (maj === bMaj && min > bMin)))
  errors.push(`La version ${pkg.version} doit monter d'une version mineure par rapport à ${before} : lancer « npm run version:minor ».`);

if (errors.length) {
  for (const e of errors) console.error(`✗ ${e}`);
  process.exit(1);
}
console.log(`✓ Version ${before} → ${pkg.version}`);
