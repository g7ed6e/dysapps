import { readFileSync } from 'node:fs';
import { lireAuLieu, resoudreAuLieu } from './aulieu.mjs';
import { lireIle } from './format.mjs';

const fichier = 'docs/contenu/french-6e-grammar-spelling.md';
const md = readFileSync(fichier, 'utf8');
const ile = lireIle(md, fichier);

/** La section « ## Au lieu · Archipéo » de l'île, retouchée par `f`, lue puis rattachée à ses jumeaux. */
const relire = (f) => () => {
  const lignes = md.split('\n');
  const debut = lignes.findIndex((l) => l.startsWith('## Au lieu · '));
  const fin = lignes.findIndex((l, i) => i > debut && l.startsWith('## '));
  const section = f(lignes.slice(debut, fin).join('\n')).split('\n');
  return resoudreAuLieu(lireAuLieu(section, debut, fichier), ile.exercices, fichier);
};

describe('les items du lieu en Markdown (monde ouvert d’Archipéo)', () => {
  it('lit les jumeaux des Filets : la clé de l’item de référence, la scène, le trou lu', () => {
    expect(ile.auLieu.univers).toBe('archipeo');
    const items = relire((s) => s)()['french-6e-grammar-spelling-plurals-1'];
    expect(items).toHaveLength(8);
    expect(items[0]).toMatchObject({
      key: 'french-6e-grammar-spelling-plurals-1-0',
      scene: { catch: 'sardines', count: 3 },
      prompt: 'Les sardines … brillent dans le filet.',
      spoken: 'Les sardines (mot manquant) brillent dans le filet.',
      answer: 'grises',
    });
  });

  it('refuse un jumeau absent, pris deux fois, un nombre de choix différent ou une réponse hors des choix', () => {
    expect(relire((s) => s.replace('1. jumeau : 1', '1. jumeau : 40'))).toThrow(/n’existe pas/);
    expect(relire((s) => s.replace('2. jumeau : 2', '2. jumeau : 1'))).toThrow(/déjà un item du lieu/);
    expect(relire((s) => s.replace('gris · grise · grises', 'grise · grises'))).toThrow(/autant de choix/);
    expect(relire((s) => s.replace('- réponse : grises', '- réponse : gros'))).toThrow(/pas dans les choix/);
    expect(relire((s) => s.replace('sardines · 3', 'baleine · 1'))).toThrow(/scène attendue/);
    expect(relire((s) => s.replace('## Au lieu · Archipéo', '## Au lieu · Blocland'))).toThrow(/monde ouvert inconnu/);
    expect(relire((s) => s.replace('- trou lu : (mot manquant)', ''))).toThrow(/« … » resterait/);
  });
});
