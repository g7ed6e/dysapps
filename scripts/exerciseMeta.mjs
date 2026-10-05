// Plugin Vite : `./data/x.json?meta` ne garde d'un exercice que ce qui sert aux listes (id, île, type, niveau).
// L'index des exercices est ainsi dans le bundle principal, et leur contenu dans des fichiers chargés à la demande
// (voir src/game/exercises/index.ts). Utilisé par vite.config.ts (application, tests) et scripts/www/generate.mjs.
import { readFile } from 'node:fs/promises';

export const EXERCISE_META_FIELDS = ['id', 'biome', 'type', 'level'];

export function exerciseMeta() {
  return {
    name: 'dysapps-exercise-meta',
    enforce: 'pre',
    async load(id) {
      const [file, query = ''] = id.split('?');
      // `?meta` au build ; `?import&meta` au serveur de développement et dans les tests.
      if (!new URLSearchParams(query).has('meta') || !file.endsWith('.json')) return null;
      this.addWatchFile(file);
      const def = JSON.parse(await readFile(file, 'utf8'));
      const meta = Object.fromEntries(EXERCISE_META_FIELDS.map((k) => [k, def[k]]));
      return { code: `export default ${JSON.stringify(meta)};`, moduleType: 'js' };
    },
  };
}
