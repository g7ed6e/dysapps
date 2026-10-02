import { readFileSync } from 'node:fs';
import { ecrireIle, lireIle } from './format.mjs';

/** Les plans dans l'ordre où le jeu les débloque (PLAN_FILES de src/blocland/world/plans.ts). */
function plansDuJeu() {
  const ts = readFileSync('src/blocland/world/plans.ts', 'utf8');
  const imports = new Map([...ts.matchAll(/^import (\w+) from '\.\/plans\/([a-z0-9-]+)\.json';$/gm)].map((m) => [m[1], m[2]]));
  const noms = /const PLAN_FILES = \[([\s\S]*?)\] as/.exec(ts)[1].split(',').map((x) => x.trim()).filter(Boolean);
  return noms.map((n) => JSON.parse(readFileSync(`src/blocland/world/plans/${imports.get(n)}.json`, 'utf8')));
}

const debut = ['---', 'lieu : french-6e-letter-confusion', '---', '', '# Mine', '', '## Les plans', ''];
const tete = ['| plan | nom | XP | quand c’est bâti |', '| --- | --- | --- | --- |'];
const lire = (...l) => () => lireIle([...debut, ...tete, ...l, ''].join('\n'), 'french-6e-letter-confusion.md');

describe('les plans des bâtiments en Markdown', () => {
  it('écrit puis relit les plans de chaque île à l’identique', () => {
    const plans = plansDuJeu();
    for (const ile of new Set(plans.map((p) => p.biome))) {
      const siens = plans.filter((p) => p.biome === ile);
      expect(lireIle(ecrireIle({ id: ile }, [], siens), `${ile}.md`).plans).toEqual(siens);
    }
  });

  it('suit, dans chaque docs/contenu/<île>.md, l’ordre où le jeu débloque les plans', () => {
    const plans = plansDuJeu();
    for (const ile of new Set(plans.map((p) => p.biome))) {
      const md = lireIle(readFileSync(`docs/contenu/${ile}.md`, 'utf8'), `${ile}.md`);
      expect(md.plans.map((p) => p.id)).toEqual(plans.filter((p) => p.biome === ile).map((p) => p.id));
    }
  });

  it('refuse une rangée mal écrite, avec la ligne', () => {
    expect(lire('| `french-6e-letter-confusion-1` | La forge | 50 | Fini. |').call().plans).toEqual([
      { id: 'french-6e-letter-confusion-1', biome: 'french-6e-letter-confusion', name: 'La forge', reward: { xp: 50 }, done: 'Fini.' },
    ]);
    expect(lire('| french-6e-letter-confusion-1 | La forge | 50 | Fini. |')).toThrow('french-6e-letter-confusion.md, ligne 11 : identifiant de plan attendu');
    expect(lire('| `french-6e-letter-confusion-1` | La forge | cinquante | Fini. |')).toThrow('XP : nombre attendu');
    expect(lire('| `french-6e-letter-confusion-1` | La forge | 50 | sable × 3 | Fini. |')).toThrow('4 cases attendues, lu 5');
    expect(lire('| `a` | A | 1 | Fini. |', '| `a` | B | 1 | Fini. |')).toThrow('french-6e-letter-confusion.md, ligne 12 : le plan « a » est écrit deux fois');
    expect(lire('| `a` | A | 1 | "Fini. |')).toThrow(/^french-6e-letter-confusion\.md, ligne 11 : chaîne entre guillemets/);
    expect(lire('| `a` | A | 1 | Fini. |', '', 'du texte')).toThrow('ligne inattendue après le tableau des plans');
  });
});
