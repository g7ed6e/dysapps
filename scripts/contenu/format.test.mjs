import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render } from '@testing-library/react';
import { createElement } from 'react';
import { Aid } from '../../src/game/exercises/Aid';
import { AID_COMPONENTS } from '../../src/game/exercises/maths';
import { clesDeplacees, clesRemplacees } from './chemins.mjs';
import { ecrireFigure, ecrireIle, lireFigure, lireIle } from './format.mjs';

const DATA = 'src/game/exercises/data';

/** Des figures de géométrie bien écrites, une par variante (aller-retour, rendu). */
const FIGURES_DE_GEOMETRIE = [
  'angles 40 · 60 · ?', 'angles 80 · ? · ? / isocèle', 'angles 90 · 35 · ?', 'angles ? · ? · ? / équilatéral', 'angles 45 · 75 · ?',
  'angle 120', 'angle 45', 'angle plat 130 · ?', 'angle croisé 70 · ?',
  'plane rectangle 5 · 3 / aire ?', 'plane carré 6 / aire ?', 'plane parallélogramme 6 · 4 / aire ?', 'plane parallélogramme 5 · 3 · 4 / aire ?',
  'plane triangle 8 · 5 / aire ?', 'plane disque 5 / aire ?', 'plane cercle 4 / diamètre ?', 'plane cercle 2,5', 'plane médiatrice 7 · ?',
  'plane partagé 3 / x · 4 / ? · ?', 'plane partagé ? / a · b / 7a · 7b',
  'solide cubes 4 · 2 · 3', 'solide cubes 3 · 2 · 2 / 2 · 2 · 3', 'solide cube 1', 'solide cylindre 3 · 2 / volume ?', 'solide cylindre',
  'solide cône r · h', 'solide cône 3 · 4 / volume ?', 'solide prisme-pyramide h',
  'image translation', 'image axiale', 'image centrale / arc ?', 'image rotation 90 / angle 50 · ?', 'image rotation −90', 'image axiale / aire 12 · ?',
  'image homothétie 2 / angle 40 · ?', 'image centrale / aire 12 cm² · ? / arc ?',
  'repère', 'repère A 4 · −2', 'repère C 2 · 3 / D −6 · 6',
];

/** Les autres figures bien écrites. */
const AUTRES_FIGURES = ['tableau x · f(x) / 2 · 6 / 4 · ?', 'triangle 6 · 8 · ?', 'droite 0 · 20 / 5 · 10', 'graduée −1 · 0 / 5 / −0,4', 'graduée 0 · 1 / 10', 'fraction 3/5', 'fractions 3/5 · 3/10', 'diagramme lundi · mardi / 10 · 20', 'diagramme 4 · 0,5', 'graphique 2 · −1'];

/** Les exercices du jeu, rangés par île. */
function parIle() {
  const iles = new Map();
  for (const f of readdirSync(DATA).sort()) {
    const ex = JSON.parse(readFileSync(join(DATA, f), 'utf8'));
    // Les questions des blocs assemblés ne sont pas dans une île (scripts/contenu/assemblage.mjs, assemblage.test.mjs).
    if (ex.type === 'assembly') continue;
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
    const md = ['---', 'lieu : english-6e-vocabulary', '---', '', '## X · `x`', '', '### Niveau 1 · `english-6e-vocabulary-x-1`', '- couleur : bleu', ''].join('\n');
    expect(() => lireIle(md, 'english-6e-vocabulary.md')).toThrow('english-6e-vocabulary.md, ligne 8 : champ inconnu « couleur »');
  });

  it('refuse un champ donné pour la mission et répété dans un niveau', () => {
    const md = ['---', 'lieu : english-6e-vocabulary', '---', '## X · `x`', '- langue : en', '### Niveau 1 · `english-6e-vocabulary-x-1`', '- langue : fr', ''].join('\n');
    expect(() => lireIle(md, 'english-6e-vocabulary.md')).toThrow('« langue » est déjà donné pour toute la mission');
  });

  it('refuse un item mal numéroté', () => {
    const md = ['---', 'lieu : english-6e-vocabulary', '---', '## X · `x`', '### Niveau 1 · `english-6e-vocabulary-x-1`', '', '2. mot : chat', ''].join('\n');
    expect(() => lireIle(md, 'english-6e-vocabulary.md')).toThrow('item 1 attendu, lu 2');
  });

  it('garde les cas limites à l’aller-retour', () => {
    const items = Array.from({ length: 14 }, (_, n) => ({ key: `english-6e-vocabulary-x-1-${n}`, prompt: `mot ${n}`, choices: ['a · b', 'c'], answer: 'c' }));
    items[0].hint = ' espace en tête';
    items[1].hint = '"entre guillemets"';
    items[2].hint = 'deux : points et « chevrons »';
    items[3].choices = [];
    items[4].aid = { kind: 'rule-card', props: { title: 'Règle : x', lines: ['une ligne'] } };
    items[5].explanation = '';
    items[6].figure = { kind: 'ratio-table', props: { cols: ['bouteilles', 'livres'], rows: [[2, 2], [6, '?']] } };
    items[7].figure = { kind: 'right-triangle', props: { a: 3, b: 4, c: '?', labels: ['A', 'B', 'C'] } };
    items[8].figure = { kind: 'number-line', props: { min: -5, max: 5, points: [-2, 1.5] } };
    const ex = { id: 'english-6e-vocabulary-x-1', biome: 'english-6e-vocabulary', type: 'x', level: 1, instruction: 'Consigne.', items };
    const md = ecrireIle({ id: 'english-6e-vocabulary' }, [ex]);
    expect(lireIle(md).exercices).toEqual([ex]);
    expect(lireIle(md.replace(/\n/g, '\r\n')).exercices).toEqual([ex]);
    expect(lireIle('\uFEFF' + md).exercices).toEqual([ex]);
  });

  it('lit les figures de maths sur une ligne, et refuse une figure mal écrite', () => {
    expect(lireFigure('tableau x · f(x) / 2 · 6 / 4 · ?')).toEqual({ kind: 'ratio-table', props: { cols: ['x', 'f(x)'], rows: [[2, 6], [4, '?']] } });
    expect(lireFigure('droite 0 · 20 / 5 · 10')).toEqual({ kind: 'number-line', props: { min: 0, max: 20, points: [5, 10] } });
    expect(ecrireFigure(lireFigure('triangle 6 · 8 · ?'))).toBe('triangle 6 · 8 · ?');
    expect(lireFigure('fraction 3/5')).toEqual({ kind: 'fraction-bar', props: { n: 3, d: 5 } });
    expect(lireFigure('fractions 3/5 · 3/10')).toEqual({ kind: 'compare-bars', props: { a: [3, 5], b: [3, 10] } });
    expect(lireFigure('diagramme lundi · mardi / 10 · 20')).toEqual({ kind: 'bar-list', props: { values: [10, 20], labels: ['lundi', 'mardi'] } });
    expect(lireFigure('graphique 2 · −1')).toEqual({ kind: 'graph', props: { a: 2, b: -1 } });
    expect(lireFigure('graduée 5 · 6 / 10 / 5,3')).toEqual({ kind: 'graduated-line', props: { start: 5, units: 1, perUnit: 10, point: 3 } });
    expect(() => lireFigure('graduée 5 · 6 / 10 / 5,38')).toThrow(/sur une graduation/);
    for (const f of ['graduée −1 · 0 / 5 / −0,4', 'graduée 0 · 1 / 10', 'fraction 3/5', 'fractions 3/5 · 3/10', 'diagramme lundi · mardi / 10 · 20', 'diagramme 4 · 0,5', 'graphique 2 · −1'])
      expect(ecrireFigure(lireFigure(f))).toBe(f);
    expect(() => lireFigure('fraction 7/5')).toThrow(/une unité/);
    expect(() => lireFigure('fractions 3/5')).toThrow(/deux fractions/);
    expect(() => lireFigure('diagramme a · b / 10')).toThrow(/autant de nombres/);
    expect(() => lireFigure('graphique 2')).toThrow(/a puis b/);
    expect(() => lireFigure('cercle 3')).toThrow(/tableau/);
    expect(() => lireFigure('tableau x · y / 1')).toThrow(/même longueur/);
    expect(() => lireFigure('triangle 3 · 4')).toThrow(/trois côtés/);
    expect(() => lireFigure('droite 5 · 2')).toThrow(/plus grand/);
  });

  it('lit les figures de géométrie sur une ligne', () => {
    expect(lireFigure('angles 40 · 60 · ?')).toEqual({ kind: 'triangle-angles', props: { angles: [40, 60, '?'] } });
    expect(lireFigure('angles 80 · ? · ? / isocèle')).toEqual({ kind: 'triangle-angles', props: { angles: [80, '?', '?'], marks: 'isosceles' } });
    expect(lireFigure('angles ? · ? · ? / équilatéral')).toEqual({ kind: 'triangle-angles', props: { angles: ['?', '?', '?'], marks: 'equilateral' } });
    expect(lireFigure('angle 120')).toEqual({ kind: 'angle', props: { layout: 'single', values: [120] } });
    expect(lireFigure('angle plat 130 · ?')).toEqual({ kind: 'angle', props: { layout: 'straight', values: [130, '?'] } });
    expect(lireFigure('angle croisé 70 · ?')).toEqual({ kind: 'angle', props: { layout: 'crossed', values: [70, '?'] } });
    expect(lireFigure('plane rectangle 5 · 3 / aire ?')).toEqual({ kind: 'plane-figure', props: { shape: 'rectangle', values: [5, 3], area: '?' } });
    expect(lireFigure('plane parallélogramme 5 · 3 · 4 / aire ?')).toEqual({ kind: 'plane-figure', props: { shape: 'parallelogram', values: [5, 3, 4], area: '?' } });
    expect(lireFigure('plane cercle 4 / diamètre ?')).toEqual({ kind: 'plane-figure', props: { shape: 'circle', values: [4], diameter: '?' } });
    expect(lireFigure('plane médiatrice 7 · ?')).toEqual({ kind: 'plane-figure', props: { shape: 'bisector', values: [7, '?'] } });
    expect(lireFigure('plane partagé ? / a · b / 7a · 7b')).toEqual({ kind: 'plane-figure', props: { shape: 'split', values: ['?'], widths: ['a', 'b'], areas: ['7a', '7b'] } });
    expect(lireFigure('solide cubes 3 · 2 · 2 / 2 · 2 · 3')).toEqual({ kind: 'solid', props: { solid: 'cubes', boxes: [[3, 2, 2], [2, 2, 3]] } });
    expect(lireFigure('solide cylindre')).toEqual({ kind: 'solid', props: { solid: 'cylinder' } });
    expect(lireFigure('solide cylindre 3 · 2 / volume ?')).toEqual({ kind: 'solid', props: { solid: 'cylinder', values: [3, 2], volume: '?' } });
    expect(lireFigure('solide cône r · h')).toEqual({ kind: 'solid', props: { solid: 'cone', values: ['r', 'h'] } });
    expect(lireFigure('image translation')).toEqual({ kind: 'transformation', props: { transform: 'translation' } });
    expect(lireFigure('image centrale / arc ?')).toEqual({ kind: 'transformation', props: { transform: 'point-reflection', arc: '?' } });
    expect(lireFigure('image rotation 90 / angle 50 · ?')).toEqual({ kind: 'transformation', props: { transform: 'rotation', amount: 90, angles: [50, '?'] } });
    expect(lireFigure('image axiale / aire 12 · ?')).toEqual({ kind: 'transformation', props: { transform: 'reflection', areas: [12, '?'] } });
    expect(lireFigure('repère')).toEqual({ kind: 'coordinate-plane', props: { points: [] } });
    expect(lireFigure('repère A 4 · −2 / B 0 · 5')).toEqual({ kind: 'coordinate-plane', props: { points: [{ name: 'A', x: 4, y: -2 }, { name: 'B', x: 0, y: 5 }] } });
  });

  it('réécrit chaque figure de géométrie telle qu’elle a été lue', () => {
    for (const l of FIGURES_DE_GEOMETRIE) expect(ecrireFigure(lireFigure(l))).toBe(l);
    // Dans une île : la figure passe par le Markdown et revient identique.
    const items = FIGURES_DE_GEOMETRIE.map((l, n) => ({ key: `maths-6e-calculation-x-1-${n}`, prompt: `Question ${n}`, choices: ['a', 'b'], answer: 'a', figure: lireFigure(l) }));
    const ex = { id: 'maths-6e-calculation-x-1', biome: 'maths-6e-calculation', type: 'x', level: 1, items };
    expect(lireIle(ecrireIle({ id: 'maths-6e-calculation' }, [ex])).exercices).toEqual([ex]);
  });

  it('dessine chaque figure bien écrite, et chaque figure du jeu : aucune ne disparaît en silence', () => {
    const duJeu = readdirSync(DATA).flatMap((f) => JSON.parse(readFileSync(join(DATA, f), 'utf8')).items.flatMap((it) => (it.figure ? [it.figure] : [])));
    for (const figure of [...[...FIGURES_DE_GEOMETRIE, ...AUTRES_FIGURES].map(lireFigure), ...duJeu]) {
      expect(AID_COMPONENTS[figure.kind], figure.kind).toBeDefined();
      const { container, unmount } = render(createElement(Aid, { aid: figure }));
      expect(container.querySelector('[role="img"], table'), JSON.stringify(figure)).not.toBeNull();
      unmount();
    }
  });

  it('refuse une figure de géométrie mal écrite, en disant comment l’écrire', () => {
    const refus = {
      'angles 40 · 60': /angles 40 · 60 · \?/,
      'angles 100 · 90 · ?': /somme 180°/,
      'angles 80 · ? · ?': /isocèle/,
      'angles 80 · 60 · ? / rectangle': /équilatéral/,
      'angles 50 · ? · ? / équilatéral': /équilatéral/,
      'angle 200': /angle 120/,
      'angle 10': /de 20 à 180/,
      'angles 90 · 75 · ?': /20° au moins/,
      'angles 150 · ? · ? / isocèle': /20° au moins/,
      'angle plat 170 · ?': /de 20 à 180/,
      'angle ?': /angle 120/,
      'angle plat 130 · 60': /somme 180°/,
      'angle croisé 70 · 80': /opposé par le sommet/,
      'angle croisé ? · ?': /opposé par le sommet/,
      'plane rectangle 5': /plane rectangle 5 · 3/,
      'plane losange 5 · 3': /plane rectangle/,
      'plane carré 6 / périmètre ?': /plane carré 6/,
      'plane cercle 4 / aire ?': /diamètre/,
      'plane médiatrice 7 · ? / aire ?': /médiatrice/,
      'plane partagé 3 / x · 4': /partagé/,
      'plane rectangle −5 · 3': /plane rectangle/,
      'solide cubes 4 · 2': /solide cubes 4 · 2 · 3/,
      'solide cubes 4 · 2 · 1,5': /entiers/,
      'solide cylindre 3': /solide cylindre 3 · 2/,
      'solide cube 1 / volume ?': /solide cube 1/,
      'solide sphère 3': /solide cône/,
      'image rotation': /multiple de 90/,
      'image rotation 45': /multiple de 90/,
      'image homothétie 0,5': /rapport 2 ou 3/,
      'image translation 3': /image translation/,
      'image axiale / arc ?': /arc \?/,
      'image rotation 90 / angle 50': /angle 50 · \?/,
      'image axiale / angle 50 · ? / aire 12 · ?': /angle 50 · \?/,
      'image centrale / arc ? / aire 12 · ?': /arc \?/,
      'repère A 7 · 0': /de −6 à 6/,
      'repère A 1 · 2 / A 3 · 4': /repère A 4 · −2/,
      'repère a 1 · 2': /majuscule/,
    };
    for (const [ligne, message] of Object.entries(refus)) expect(() => lireFigure(ligne), ligne).toThrow(message);
    expect(() => lireFigure('cercle 3')).toThrow(/« repère »/);
  });

  it('refuse une valeur vide ou avec des espaces au bord écrite sans guillemets', () => {
    const md = ['---', 'lieu : english-6e-vocabulary', '---', '## X · `x`', '- consigne : texte  ', ''].join('\n');
    expect(() => lireIle(md, 'english-6e-vocabulary.md')).toThrow('écrire entre guillemets');
  });

  it('refuse un nombre mal écrit et un identifiant qui sortirait du dossier', () => {
    expect(() => lireIle(['---', 'lieu : english-6e-vocabulary', '---', '## X · `x`', '- blocs : 0x10', ''].join('\n'))).toThrow('nombre attendu');
    expect(() => lireIle(['---', 'lieu : english-6e-vocabulary', '---', '## X · `x`', '### Niveau 1 · `../../tmp/a`', ''].join('\n'))).toThrow('identifiant d’exercice mal écrit');
  });

  it('repère une clé d’item qui désignerait un autre item', () => {
    const avant = { items: [{ key: 'e-0', word: 'chat' }, { key: 'e-1', word: 'chien' }] };
    const apres = { items: [{ key: 'e-0', word: 'chat' }, { key: 'e-1', word: 'lapin' }, { key: 'e-2', word: 'chien' }] };
    expect(clesDeplacees(avant, apres)).toEqual(['e-2']);
    expect(clesDeplacees(avant, { items: [...avant.items, { key: 'e-2', word: 'lapin' }] })).toEqual([]);
  });

  it('refuse deux items qui auraient la même clé', () => {
    // A, N, B, C : B et C ont repris leurs anciennes clés, N reçoit la clé par défaut x-1, déjà prise par B.
    const md = ['---', 'lieu : english-6e-vocabulary', '---', '## X · `x`', '### Niveau 1 · `english-6e-vocabulary-x-1`', '', '1. mot : A', '2. mot : N', '3. clé : english-6e-vocabulary-x-1-1', '   - mot : B', '4. clé : english-6e-vocabulary-x-1-2', '   - mot : C', ''].join('\n');
    expect(() => lireIle(md, 'english-6e-vocabulary.md')).toThrow('les items 2 et 3 ont la même clé « english-6e-vocabulary-x-1-1 »');
  });

  it('laisse corriger la faute d’un item sans changer sa place', () => {
    const avant = { items: [{ key: 'e-0', word: 'chta' }, { key: 'e-1', word: 'chien' }] };
    expect(clesDeplacees(avant, { items: [{ key: 'e-0', word: 'chat' }, { key: 'e-1', word: 'chien' }] })).toEqual([]);
  });

  it('déduit la clé, la lecture du trou et le mot troué, et lit les tableaux', () => {
    const md = [
      '---', 'lieu : english-6e-vocabulary', '---', '## X · `x`', '',
      'Pour tous les items :', '- clé des items : mot', '- trou lu : blank', '',
      '### Niveau 1 · `english-6e-vocabulary-x-1`', '',
      '| mot troué | énoncé | choix |', '| --- | --- | --- |',
      '| [en]fant | Un … ici. | en · an |', '| p[an]talon |  | an · en |', '',
      '### Niveau 2 · `english-6e-vocabulary-x-2`', '',
      'Pour tous les items :', '- clé des items : paragraphe', '',
      '1. texte : Premier paragraphe.', '2. texte : Second.', '   - lu : autre lecture', '',
    ].join('\n');
    const [un, deux] = lireIle(md, 'english-6e-vocabulary.md').exercices;
    expect(un.items).toEqual([
      { key: 'enfant', prompt: 'Un … ici.', word: 'enfant', before: '', after: 'fant', spoken: 'Un blank ici.', choices: ['en', 'an'], answer: 'en' },
      { key: 'pantalon', word: 'pantalon', before: 'p', after: 'talon', choices: ['an', 'en'], answer: 'an' },
    ]);
    expect(deux.items).toEqual([{ key: 'p1', text: 'Premier paragraphe.' }, { key: 'p2', text: 'Second.', spoken: 'autre lecture' }]);
    expect(lireIle(ecrireIle({ id: 'english-6e-vocabulary' }, [un, deux])).exercices).toEqual([un, deux]);
  });

  it('refuse un tableau mal formé ou mêlé à des items numérotés', () => {
    const debut = ['---', 'lieu : english-6e-vocabulary', '---', '## X · `x`', '### Niveau 1 · `english-6e-vocabulary-x-1`', ''];
    const lire = (...l) => () => lireIle([...debut, ...l, ''].join('\n'), 'english-6e-vocabulary.md');
    expect(lire('| mot | choix |', '| --- | --- |', '| chat |')).toThrow('2 cases attendues, lu 1');
    expect(lire('| couleur |', '| --- |', '| bleu |')).toThrow('colonne inconnue « couleur »');
    expect(lire('| mot |', '| chat |')).toThrow('ligne « |---|---| » attendue');
    expect(lire('1. mot : chat', '| mot |', '| --- |', '| chien |')).toThrow('pas les deux');
    expect(lire('| mot |', '| --- |', '| chat |', '2. mot : chien')).toThrow('pas les deux');
    expect(lire('1. mot : chat', '   - trou lu : blank')).toThrow('va dans « Pour tous les items »');
    expect(lire('Pour tous les items :', '- clé des items : rang', '', '1. mot : chat')).toThrow('« clé des items » vaut');
    expect(lire('Pour tous les items :', '- clé des items : mot', '', '1. texte : sans mot')).toThrow('n’a pas de mot pour faire sa clé');
    expect(lire('1. mot troué : enfant')).toThrow('mot troué attendu sous la forme « en[f]ant »');
  });

  it('refuse les écritures ambiguës autour des tableaux et des règles', () => {
    const debut = ['---', 'lieu : english-6e-vocabulary', '---', '## X · `x`', '### Niveau 1 · `english-6e-vocabulary-x-1`', ''];
    const lire = (...l) => () => lireIle([...debut, ...l, ''].join('\n'), 'english-6e-vocabulary.md');
    expect(lire('| mot |', '| --- |', '| chat |', '| chien |', '', 'Pour tous les items :', '- réponse : X')).toThrow('va avant le premier item');
    expect(lire('Pour tous les items :', '- clé des items : mot', '', '| mot |', '| --- |', '| chat |', '| chat |')).toThrow('ont la même clé « chat »');
    expect(lire('Pour tous les items :', '- réponse : z', '', '1. mot troué : en[f]ant')).toThrow('« mot troué » donne déjà « réponse »');
    expect(lire('| mot |', '| --- |', '| chat |', '- langue : en')).toThrow('un champ du niveau va avant ses items');
    const deux = ['---', 'lieu : english-6e-vocabulary', '---', '## X · `x`', '### Niveau 1 · `english-6e-vocabulary-x-1`', '', 'Pour tous les items :', '- réponse : z', '', '1. mot : a', '', '## Y · `y`', 'Pour tous les items :', '- mot troué : en[f]ant', ''].join('\n');
    expect(() => lireIle(deux)).not.toThrow();
    const md = ['---', 'lieu : english-6e-vocabulary', '---', '## X · `x`', 'Pour tous les items :', '- trou lu : blank', '', '### Niveau 1 · `english-6e-vocabulary-x-1`', '', 'Pour tous les items :', '- trou lu : (mot manquant)', '', '1. énoncé : Il … ici.', ''].join('\n');
    expect(lireIle(md).exercices[0].items[0].spoken).toBe('Il (mot manquant) ici.');
  });

  it('écrit une liste vide hors du tableau', () => {
    const ex = { id: 'english-6e-vocabulary-x-1', biome: 'english-6e-vocabulary', type: 'x', level: 1, items: [{ key: 'english-6e-vocabulary-x-1-0', word: 'a', choices: [] }, { key: 'english-6e-vocabulary-x-1-1', word: 'b', choices: ['c'] }] };
    expect(lireIle(ecrireIle({ id: 'english-6e-vocabulary' }, [ex])).exercices).toEqual([ex]);
  });

  it('signale une clé remplacée par une autre au même rang', () => {
    const avant = { items: [{ key: 'chta', word: 'chta' }, { key: 'chien', word: 'chien' }] };
    expect(clesRemplacees(avant, { items: [{ key: 'chat', word: 'chat' }, { key: 'chien', word: 'chien' }] })).toEqual(['chta → chat']);
  });

  it('écrit puis relit chaque île du jeu, ses missions et son en-tête', () => {
    const texte = readFileSync('src/game/islands.ts', 'utf8');
    const iles = JSON.parse(texte.slice(texte.indexOf('= [') + 2, texte.lastIndexOf(' satisfies')));
    const exercices = parIle();
    for (const ile of iles) {
      const relu = lireIle(ecrireIle(ile, exercices.get(ile.id) ?? []), `${ile.id}.md`);
      expect(relu.biome).toEqual(ile);
      const parId = (liste) => [...liste].sort((a, b) => a.id.localeCompare(b.id));
      expect(parId(relu.exercices)).toEqual(parId(exercices.get(ile.id) ?? []));
    }
  });

  it('refuse un en-tête ou un champ de mission mal écrit', () => {
    expect(() => lireIle(['---', 'lieu : english-6e-vocabulary', 'couleur : bleu', '---', ''].join('\n'), 'english-6e-vocabulary.md')).toThrow('champ d’en-tête inconnu « couleur »');
    expect(() => lireIle(['---', 'lieu : english-6e-vocabulary', 'module : a', 'module : b', '---', ''].join('\n'), 'english-6e-vocabulary.md')).toThrow('« module » écrit deux fois');
    expect(() => lireIle(['---', 'lieu : english-6e-vocabulary', '---', '# A', '# B', ''].join('\n'), 'english-6e-vocabulary.md')).toThrow('l’île a un seul titre');
    const md = ['---', 'lieu : english-6e-vocabulary', '---', '## X · `x`', '- description : a', '- description : b', ''].join('\n');
    expect(() => lireIle(md, 'english-6e-vocabulary.md')).toThrow('« description » écrit deux fois');
    const niveau = ['---', 'lieu : english-6e-vocabulary', '---', '## X · `x`', '### Niveau 1 · `english-6e-vocabulary-x-1`', '- compétences : c3.x', ''].join('\n');
    expect(() => lireIle(niveau, 'english-6e-vocabulary.md')).toThrow('champ inconnu « compétences »');
  });

  it('ne voit aucun glissement quand une île passe en Markdown', () => {
    for (const [ile, exercices] of parIle()) {
      const relu = lireIle(ecrireIle({ id: ile }, exercices)).exercices;
      exercices.forEach((ex, n) => expect(clesDeplacees(ex, relu[n])).toEqual([]));
    }
  });
});
