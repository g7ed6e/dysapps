// Vérifie que la documentation suit la version : chaque pull request monte la version mineure
// (npm run version:minor) et doit décrire ce qu'elle change dans docs/journal.md, sous un titre « ## <version> ».
// Le build de la doc (npm run docs:build) vérifie de son côté que toutes les pages du sommaire existent.
// Usage : node scripts/docs/check.mjs
import { readFileSync } from 'node:fs';

const version = JSON.parse(readFileSync('package.json', 'utf8')).version;
const journal = readFileSync('docs/journal.md', 'utf8');
const errors = [];

const escaped = version.replace(/\./g, '\\.');
if (!new RegExp(`^## ${escaped}(\\s|$)`, 'm').test(journal)) {
  errors.push(`docs/journal.md n'a pas d'entrée pour la version ${version} : ajouter un titre « ## ${version} — <date> » en tête du journal, avec ce que change la pull request.`);
}
const first = /^## (\d+\.\d+\.\d+)/m.exec(journal);
if (first && first[1] !== version) {
  errors.push(`La première entrée de docs/journal.md est ${first[1]} ; la version courante ${version} doit être en tête (les entrées vont de la plus récente à la plus ancienne).`);
}

if (errors.length) {
  for (const e of errors) console.error(`✗ ${e}`);
  process.exit(1);
}
console.log(`✓ docs/journal.md décrit la version ${version}`);
