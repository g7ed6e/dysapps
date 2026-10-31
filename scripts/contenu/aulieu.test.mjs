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

describe('l’épreuve hors des murs (GD-27, lot 6) : le niveau sur place et ses scènes à trois objets', () => {
  const mangrove = 'docs/contenu/life-earth-sciences-6e-living-world.md';
  const mdMangrove = readFileSync(mangrove, 'utf8');
  const ileMangrove = lireIle(mdMangrove, mangrove);
  /** La section « ## Au lieu · Archipéo » de la Mangrove, retouchée par `f`, lue puis résolue (items et paroles). */
  const relire = (f) => () => {
    const lignes = mdMangrove.split('\n');
    const debut = lignes.findIndex((l) => l.startsWith('## Au lieu · '));
    const fin = lignes.findIndex((l, i) => i > debut && l.startsWith('## '));
    const section = f(lignes.slice(debut, fin).join('\n')).split('\n');
    const auLieu = lireAuLieu(section, debut, mangrove);
    return { items: resoudreAuLieu(auLieu, ileMangrove.exercices, mangrove), paroles: resoudreParoles(auLieu, ileMangrove.missions, mangrove) };
  };

  it('lit le niveau sur place, ses deux phrases et les objets de chaque jumeau, dans l’ordre des choix', () => {
    const { items, paroles } = relire((s) => s)();
    expect(paroles.surPlace).toEqual({ mission: 'living-groups', level: 1, go: 'Va voir les animaux de la rive.', instruction: 'Touche le bon animal.' });
    const jumeaux = items['life-earth-sciences-6e-living-world-living-groups-1'];
    expect(jumeaux.map((it) => it.key.slice(-1))).toEqual(['0', '1', '2', '4']);
    expect(jumeaux[0]).toMatchObject({
      scene: { objects: ['aigrette', 'chauve-souris', 'libellule'] },
      choices: ['oiseau', 'mammifère', 'insecte'],
      answer: 'mammifère',
      spoken: 'Un animal a des ailes et des poils. C’est un (mot manquant)',
      rule: 'On classe selon ce que les êtres vivants ont : leurs attributs.',
    });
    expect(jumeaux[3].scene).toEqual({ objects: ['aigrette', 'libellule', 'araignée'] });
  });

  it('refuse un objet hors du kit, posé deux fois, en nombre différent des choix, une scène des Filets au niveau sur place, une phrase qui presse', () => {
    expect(relire((s) => s.replace('aigrette · chauve-souris · libellule', 'manchot · chauve-souris · libellule'))).toThrow(/pas un objet du kit/);
    expect(relire((s) => s.replace('aigrette · chauve-souris · libellule', 'aigrette · aigrette · libellule'))).toThrow(/posé deux fois/);
    expect(relire((s) => s.replace('aigrette · chauve-souris · libellule', 'aigrette · libellule'))).toThrow(/autant d’objets posés/);
    expect(relire((s) => s.replace('aigrette · chauve-souris · libellule', 'sardines · 3'))).toThrow(/pas un objet du kit/);
    expect(relire((s) => s.replace('- va voir : Va voir les animaux de la rive.', '- va voir : Les animaux attendent sur la rive.'))).toThrow(/ni attente, ni urgence/);
    expect(relire((s) => s.replace('- consigne : Touche le bon animal.', '- consigne : Touche le bon animal posé sur sa pierre, là.'))).toThrow(/8 au plus/);
    expect(relire((s) => s.replace('- consigne : Touche le bon animal.\n', ''))).toThrow(/« consigne » manque/);
    expect(relire((s) => s.replace('- mission : `living-groups`', '- mission : `food-growth`'))).toThrow(/scène attendue/);
    expect(relire((s) => s.replace('- niveau : 1', '- niveau : 2'))).toThrow(/scène attendue/);
    expect(relire((s) => s.replace('### Sur place\n\n- mission : `living-groups`\n- niveau : 1\n- va voir : Va voir les animaux de la rive.\n- consigne : Touche le bon animal.\n', ''))).toThrow(/scène attendue/);
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
    expect(() => verifierParole('La veillée commence au quai.', 'ici')).toThrow(/ne se dit pas à l’élève/);
    expect(() => verifierParole('Ma quête finit ici.', 'ici')).toThrow(/ne se dit pas à l’élève/);
    expect(() => verifierParole('Un Ferrailleur passe au quai.', 'ici')).toThrow(/ne se dit pas à l’élève/);
    expect(() => verifierParole('Je dompte la grue.', 'ici')).toThrow(/figuré/);
    expect(() => verifierParole('La barge attend ses caisses.', 'ici', true)).toThrow(/ni attente, ni urgence/);
    expect(() => verifierParole('La barge attend ses caisses.', 'ici')).not.toThrow();
    expect(paroles((s) => s.replace('| `times-tables` |', '| `tables-inconnues` |'))).toThrow(/n’est pas une mission de l’île/);
    expect(paroles((s) => s.replace('- rallumé :', '- allumé :'))).toThrow();
  });
});
