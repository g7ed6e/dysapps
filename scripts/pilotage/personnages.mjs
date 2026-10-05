// Écrit docs/gameplay/personnages.md à partir des données du jeu (hors du site de documentation).
// Usage : npm run pilotage:personnages   (--check : échoue si la page n'est plus à jour)
import { readFileSync, writeFileSync } from 'node:fs';
import { generatePersonnages } from '../www/generate.mjs';

const path = 'docs/gameplay/personnages.md';
const body = await generatePersonnages();
if (process.argv.includes('--check')) {
  let current = '';
  try {
    current = readFileSync(path, 'utf8');
  } catch {}
  if (current !== body) {
    console.error(`✗ ${path} n'est plus à jour : npm run pilotage:personnages`);
    process.exit(1);
  }
  console.log(`✓ ${path} à jour`);
} else {
  writeFileSync(path, body);
  console.log(`✓ ${path}`);
}
