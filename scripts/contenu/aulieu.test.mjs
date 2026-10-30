import { readFileSync } from 'node:fs';
import { lireAuLieu, resoudreAuLieu, resoudreParoles, verifierParole } from './aulieu.mjs';
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
      rule: 'Le nom commande : déterminant et adjectif prennent son genre et son nombre.',
    });
  });

  it('refuse un jumeau absent, pris deux fois, un nombre de choix différent ou une réponse hors des choix', () => {
    expect(relire((s) => s.replace('1. jumeau : 1', '1. jumeau : 40'))).toThrow(/n’existe pas/);
    expect(relire((s) => s.replace('2. jumeau : 2', '2. jumeau : 1'))).toThrow(/déjà un item du lieu/);
    expect(relire((s) => s.replace('gris · grise · grises', 'grise · grises'))).toThrow(/autant de choix/);
    expect(relire((s) => s.replace('- réponse : grises', '- réponse : gros'))).toThrow(/pas dans les choix/);
    expect(relire((s) => s.replace('sardines · 3', 'baleine · 1'))).toThrow(/scène attendue/);
    expect(relire((s) => s.replace('## Au lieu · Archipéo', '## Au lieu · Blocland'))).toThrow(/monde ouvert inconnu/);
    expect(relire((s) => s.replace('- trou lu : (mot manquant)\n', ''))).toThrow(/« … » resterait/);
    expect(relire((s) => s.replace('- règle : Le nom commande', '- règle : Le verbe commande'))).toThrow(/pas une ligne de la carte/);
  });
});

describe('la parole du lieu (GD-27, lot 2) : l’habitant et les missions', () => {
  const quais = 'docs/contenu/maths-6e-calculation.md';
  const mdQuais = readFileSync(quais, 'utf8');
  const ileQuais = lireIle(mdQuais, quais);
  /** La section « ## Au lieu · Archipéo » des Quais, retouchée par `f`, lue puis résolue en paroles. */
  const paroles = (f) => () => {
    const lignes = mdQuais.split('\n');
    const debut = lignes.findIndex((l) => l.startsWith('## Au lieu · '));
    const fin = lignes.findIndex((l, i) => i > debut && l.startsWith('## '));
    const section = f(lignes.slice(debut, fin).join('\n')).split('\n');
    return resoudreParoles(lireAuLieu(section, debut, quais), ileQuais.missions, quais);
  };

  it('lit les cinq registres de l’habitant et le cadre et la suite de chaque mission', () => {
    const p = paroles((s) => s)();
    expect(Object.keys(p.lines)).toEqual(['metier', 'lieu', 'ruine', 'chantier', 'rallume']);
    expect(p.lines.metier[0]).toBe('Je charge les caisses sur la barge.');
    expect(p.missions['times-tables']).toEqual({ frame: 'La barge prend des caisses par rangées.', follow: 'Les rangées sont comptées.' });
    expect(resoudreParoles(ileQuais.auLieu, ileQuais.missions, quais)).toEqual(p);
  });

  it('refuse une ligne trop longue, sans point, un mot interdit, un verbe figuré, un cadre qui presse, une mission inconnue', () => {
    expect(() => verifierParole('Un deux trois quatre cinq six sept huit neuf dix onze.', 'ici')).toThrow(/11 mots, 10 au plus/);
    expect(() => verifierParole('Je charge la barge', 'ici')).toThrow(/finit par un point/);
    expect(() => verifierParole('Oh ! la barge est là.', 'ici')).toThrow(/ni « ! »/);
    expect(() => verifierParole('Je charge 3 caisses.', 'ici')).toThrow(/en lettres/);
    expect(() => verifierParole('Le rafiot est à quai.', 'ici')).toThrow(/ne se dit pas à l’élève/);
    expect(() => verifierParole('La grue est en ruine.', 'ici')).toThrow(/ne se dit pas à l’élève/);
    expect(() => verifierParole('Je dompte la grue.', 'ici')).toThrow(/figuré/);
    expect(() => verifierParole('La barge attend ses caisses.', 'ici', true)).toThrow(/ni attente, ni urgence/);
    expect(() => verifierParole('La barge attend ses caisses.', 'ici')).not.toThrow();
    expect(paroles((s) => s.replace('| `times-tables` |', '| `tables-inconnues` |'))).toThrow(/n’est pas une mission de l’île/);
    expect(paroles((s) => s.replace('- rallumé :', '- allumé :'))).toThrow();
  });
});
