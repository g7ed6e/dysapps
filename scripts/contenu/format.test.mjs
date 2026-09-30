import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ecrireIle, lireIle } from './format.mjs';

const DATA = 'src/blocland/exercises/data';

/** Les exercices du jeu, rangés par île. */
function parIle() {
  const iles = new Map();
  for (const f of readdirSync(DATA).sort()) {
    const ex = JSON.parse(readFileSync(join(DATA, f), 'utf8'));
    if (!iles.has(ex.biome)) iles.set(ex.biome, []);
    iles.get(ex.biome).push(ex);
  }
  return iles;
}

describe('le format Markdown du contenu', () => {
  it('écrit puis relit chaque exercice du jeu sans rien perdre', () => {
    for (const [ile, exercices] of parIle()) {
      const md = ecrireIle({ id: ile }, exercices);
      const relu = lireIle(md, `${ile}.md`);
      expect(relu.ile).toBe(ile);
      expect(relu.exercices).toEqual(exercices);
    }
  });

  it('donne la ligne fautive quand un champ est inconnu', () => {
    const md = ['---', 'île : baie', '---', '', '## X · `x`', '', '### Niveau 1 · `baie-x-1`', '- couleur : bleu', ''].join('\n');
    expect(() => lireIle(md, 'baie.md')).toThrow('baie.md, ligne 8 : champ inconnu « couleur »');
  });

  it('refuse un champ donné pour la mission et répété dans un niveau', () => {
    const md = ['---', 'île : baie', '---', '## X · `x`', '- langue : en', '### Niveau 1 · `baie-x-1`', '- langue : fr', ''].join('\n');
    expect(() => lireIle(md, 'baie.md')).toThrow('« langue » est déjà donné pour toute la mission');
  });

  it('refuse un item mal numéroté', () => {
    const md = ['---', 'île : baie', '---', '## X · `x`', '### Niveau 1 · `baie-x-1`', '', '2. mot : chat', ''].join('\n');
    expect(() => lireIle(md, 'baie.md')).toThrow('item 1 attendu, lu 2');
  });
});
