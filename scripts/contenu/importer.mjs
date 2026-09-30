// Passe une île en Markdown (étape de migration, une fois par île) : écrit docs/contenu/<île>.md depuis ses JSON
// actuels, après avoir vérifié que le Markdown redonne exactement les mêmes exercices.
// Usage : node scripts/contenu/importer.mjs <île> [<île>…]
import { isDeepStrictEqual } from 'node:util';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createServer } from 'vite';
import { exerciseMeta } from '../exerciseMeta.mjs';
import { ecrireIle, lireIle } from './format.mjs';
import { CONTENU, DATA } from './chemins.mjs';

const iles = process.argv.slice(2);
if (iles.length === 0) throw new Error('Usage : node scripts/contenu/importer.mjs <île> [<île>…]');

const server = await createServer({
  configFile: false,
  root: process.cwd(),
  logLevel: 'error',
  appType: 'custom',
  server: { middlewareMode: true, hmr: false, watch: null },
  optimizeDeps: { noDiscovery: true, include: [] },
  plugins: [exerciseMeta()],
});
try {
  const { BIOMES } = await server.ssrLoadModule('/src/blocland/biomes.ts');
  const tous = readdirSync(DATA)
    .sort()
    .map((n) => JSON.parse(readFileSync(join(DATA, n), 'utf8')));
  for (const id of iles) {
    const biome = BIOMES.find((b) => b.id === id);
    if (!biome) throw new Error(`île inconnue : ${id}`);
    const cible = join(CONTENU, `${id}.md`);
    if (existsSync(cible)) throw new Error(`${cible} existe déjà : c'est lui qui fait foi`);
    const exercices = tous.filter((ex) => ex.biome === id);
    const md = ecrireIle({ id, nom: biome.name, missions: biome.exercises.map((m) => ({ id: m.id, titre: m.title })) }, exercices);
    const relu = lireIle(md, cible).exercices;
    const parId = new Map(relu.map((ex) => [ex.id, ex]));
    for (const ex of exercices) if (!isDeepStrictEqual(parId.get(ex.id), ex)) throw new Error(`${ex.id} : le Markdown ne redonne pas le même exercice`);
    writeFileSync(cible, md);
    console.log(`✓ ${cible} (${exercices.length} niveaux)`);
  }
} finally {
  await server.close();
}
