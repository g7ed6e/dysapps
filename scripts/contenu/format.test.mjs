import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { clesDeplacees } from './chemins.mjs';
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

  it('garde les cas limites à l’aller-retour', () => {
    const items = Array.from({ length: 14 }, (_, n) => ({ key: `baie-x-1-${n}`, prompt: `mot ${n}`, choices: ['a · b', 'c'], answer: 'c' }));
    items[0].hint = ' espace en tête';
    items[1].hint = '"entre guillemets"';
    items[2].hint = 'deux : points et « chevrons »';
    items[3].choices = [];
    items[4].aid = { kind: 'rule-card', props: { title: 'Règle : x', lines: ['une ligne'] } };
    items[5].explanation = '';
    const ex = { id: 'baie-x-1', biome: 'baie', type: 'x', level: 1, instruction: 'Consigne.', items };
    const md = ecrireIle({ id: 'baie' }, [ex]);
    expect(lireIle(md).exercices).toEqual([ex]);
    expect(lireIle(md.replace(/\n/g, '\r\n')).exercices).toEqual([ex]);
    expect(lireIle('\uFEFF' + md).exercices).toEqual([ex]);
  });

  it('refuse une valeur vide ou avec des espaces au bord écrite sans guillemets', () => {
    const md = ['---', 'île : baie', '---', '## X · `x`', '- consigne : texte  ', ''].join('\n');
    expect(() => lireIle(md, 'baie.md')).toThrow('écrire entre guillemets');
  });

  it('refuse un nombre mal écrit et un identifiant qui sortirait du dossier', () => {
    expect(() => lireIle(['---', 'île : baie', '---', '## X · `x`', '- blocs : 0x10', ''].join('\n'))).toThrow('nombre attendu');
    expect(() => lireIle(['---', 'île : baie', '---', '## X · `x`', '### Niveau 1 · `../../tmp/a`', ''].join('\n'))).toThrow('identifiant d’exercice mal écrit');
  });

  it('repère une clé d’item qui désignerait un autre item', () => {
    const avant = { items: [{ key: 'e-0', word: 'chat' }, { key: 'e-1', word: 'chien' }] };
    const apres = { items: [{ key: 'e-0', word: 'chat' }, { key: 'e-1', word: 'lapin' }, { key: 'e-2', word: 'chien' }] };
    expect(clesDeplacees(avant, apres)).toEqual(['e-1']);
    expect(clesDeplacees(avant, { items: [...avant.items, { key: 'e-2', word: 'lapin' }] })).toEqual([]);
  });
});
