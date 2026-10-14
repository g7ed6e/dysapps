// Les questions nées du monde (lot 4) : les jumeaux des Filets, les phrases des Quais, la scène des Écluses, les manches
// du Phare, les pièces durables, la place des réponses à l'écran et les scènes d'item. Sans Three.js.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { seeded } from '../../../core/random';
import { screenOf } from './camera';
import PLACE_ITEMS from './placeItems.json';
import { ANSWER_LAYOUT, answerObjects, answerScale, crateLayout, itemScene, placePieces, questionLayout, questionPose, sceneSpot, veilleurPiece, type ScreenBox } from './questionScene';
import {
  BELLS_PER_ROUND,
  EXERCISES_WITH_TWINS,
  SAS_HINT,
  bellRounds,
  piecesOf,
  placeInstruction,
  placeItems,
  quaiScene,
  sasExplanation,
  veilleurAwake,
  type QuestionItem,
} from './questions';

const reference = (
  id: string,
): {
  items: (QuestionItem & {
    prompt: string;
    choices: string[];
    answer: string;
  })[];
} => JSON.parse(readFileSync(join(process.cwd(), 'src/game/exercises/data', `${id}.json`), 'utf8'));
const words = (s: string) => s.split(/\s+/).filter((w) => /[\p{L}\d]/u.test(w)).length;

describe('Les jumeaux des Filets (règle « à l’essai »)', () => {
  const all = (PLACE_ITEMS as Record<string, Record<string, (QuestionItem & Record<string, unknown>)[]>>).archipeo;

  it('chaque item du lieu porte la clé d’un item de référence, une seule fois, avec autant de choix', () => {
    expect(EXERCISES_WITH_TWINS).toContain('french-6e-grammar-spelling-plurals-1');
    for (const [id, twins] of Object.entries(all)) {
      const ref = new Map(reference(id).items.map((it) => [it.key, it]));
      const keys = twins.map((t) => t.key);
      expect(new Set(keys).size).toBe(keys.length);
      for (const t of twins) {
        const r = ref.get(t.key);
        expect(r, t.key).toBeDefined();
        expect((t.choices as string[]).length).toBe(r!.choices.length);
        expect(t.choices).toContain(t.answer);
        expect(String(t.spoken)).not.toContain('…');
        expect(String(t.point).length).toBeGreaterThan(0);
        expect((t.traps as string[]).length).toBeGreaterThan(0);
      }
    }
  });

  it('une phrase du lieu reste courte : pas plus de deux mots de plus que la plus longue du niveau de référence', () => {
    for (const [id, twins] of Object.entries(all)) {
      const longest = Math.max(...reference(id).items.map((it) => words(it.prompt)));
      for (const t of twins) expect(words(String(t.prompt)), String(t.prompt)).toBeLessThanOrEqual(longest + 2);
    }
  });

  it('un item tiré par le jeu commun prend son jumeau, et garde sa clé ; la scène dit ce qu’on voit', () => {
    const items = reference('french-6e-grammar-spelling-plurals-1').items;
    const placed = placeItems('filets', 'french-6e-grammar-spelling-plurals-1', items);
    expect(placed.map((p) => p.key)).toEqual(items.map((it) => it.key));
    expect(placed[0].prompt).toBe('Les sardines … brillent dans le filet.');
    expect(placed[0].placeScene).toEqual({
      kind: 'filets',
      catch: 'sardines',
      count: 3,
    });
    expect(placed[0]).not.toHaveProperty('traps');
    expect(placed[0]).not.toHaveProperty('point');
  });

  it('chaque jumeau garde exactement la règle de son item de référence (la carte de l’accord)', () => {
    for (const id of Object.keys(all)) {
      const items = reference(id).items;
      const placed = placeItems('filets', id, items);
      for (const [i, p] of placed.entries()) expect(p.aid, p.key).toEqual(items[i].aid);
    }
    expect(placeItems('filets', 'french-6e-grammar-spelling-plurals-1', reference('french-6e-grammar-spelling-plurals-1').items)[0].aid).toMatchObject({
      kind: 'rule-card',
    });
  });

  it('le jumeau des bocaux : un bocal, deux bocaux', () => {
    const twin = Object.values(all)
      .flat()
      .find((t) => t.answer === 'bocaux');
    expect(twin).toMatchObject({
      prompt: 'Le pêcheur remplit deux … de crevettes.',
      choices: ['bocal', 'bocaux', 'bocals'],
      scene: { catch: 'bocaux', count: 2 },
    });
  });
});

describe('Les Quais et les Écluses gardent l’item de référence', () => {
  it('la moitié et le double : une idée par phrase, la ligne de calcul de référence dessous', () => {
    expect(quaiScene('half-34')).toEqual({
      scene: { kind: 'quai', op: 'moitie', before: 34, after: 17 },
      prompt: '34 caisses sont sur le quai. La grue prend la moitié. Combien de caisses restent sur le quai ?',
    });
    expect(quaiScene('dbl-23')?.scene).toEqual({
      kind: 'quai',
      op: 'double',
      before: 23,
      after: 46,
    });
    expect(quaiScene('autre')).toBeNull();
    const [placed] = placeItems('quais', 'maths-6e-calculation-doubles-halves-1', [
      {
        key: 'half-34',
        prompt: 'Moitié de 34 = …',
        choices: ['16', '17', '18'],
        answer: '17',
      },
    ]);
    expect(placed).toMatchObject({
      key: 'half-34',
      answer: '17',
      choices: ['16', '17', '18'],
      referenceLine: 'Moitié de 34 = …',
      spoken: placed.prompt,
    });
  });

  it('les doubles s’arrêtent à 49 : 98 caisses au plus, en palettes de dix', () => {
    expect(crateLayout(34)).toEqual({ palettes: 3, singles: 4 });
    expect(crateLayout(98)).toEqual({ palettes: 9, singles: 8 });
  });

  it('le sas (niveau 1) et l’échelle (niveau 2) se tirent de la figure de l’item', () => {
    const [bar, line] = placeItems('ecluses', 'x', [
      { key: '3/4', figure: { kind: 'fraction-bar', props: { n: 3, d: 4 } } },
      {
        key: '5/3',
        figure: {
          kind: 'graduated-line',
          props: { start: 0, units: 2, perUnit: 3, point: 5 },
        },
      },
    ]);
    expect(bar.placeScene).toEqual({ kind: 'sas', n: 3, d: 4 });
    expect(line.placeScene).toEqual({ kind: 'echelle', n: 5, d: 3 });
    expect(bar.figure).toBeDefined();
    expect(placeInstruction('ecluses', 1, 'réf.')).toContain('sas');
    expect(placeInstruction('ecluses', 2, 'réf.')).toContain('échelle');
    expect(placeInstruction('filets', 1, 'réf.')).toBe('réf.');
  });

  it('au sas, l’indice et la correction parlent du sas ; la clé et les choix restent ceux de la référence', () => {
    const ref = { key: '3/4', choices: ['3/4', '4/3', '1/4'], answer: '3/4', hint: 'réf.', explanation: 'réf.', figure: { kind: 'fraction-bar', props: { n: 3, d: 4 } } };
    const [sas] = placeItems('ecluses', 'x', [ref]);
    expect(sas).toMatchObject({ key: '3/4', choices: ref.choices, answer: '3/4', hint: SAS_HINT });
    expect(SAS_HINT).toBe('En bas : le nombre de parts égales du sas. En haut : le nombre de parts pleines d’eau.');
    expect(sas.explanation).toBe('3 parts pleines d’eau sur 4 parts égales : 3/4.');
    expect(sasExplanation(1, 2)).toBe('1 part pleine d’eau sur 2 parts égales : 1/2.');
    const [line] = placeItems('ecluses', 'x', [{ key: '5/3', hint: 'réf.', figure: { kind: 'graduated-line', props: { start: 0, units: 2, perUnit: 3, point: 5 } } }]);
    expect(line.hint).toBe('réf.');
  });

  it('le double : une idée par phrase', () => {
    expect(quaiScene('dbl-23')?.prompt).toMatch(/Combien y en a-t-il sur le quai maintenant \?$/);
  });
});

describe('Les cloches du Phare', () => {
  const items = Array.from({ length: 12 }, (_, i) => ({
    key: `m${i}`,
    correct: i < 8,
  }));

  it('deux manches de six, chacune avec des bons mots et des pièges, chaque mot une fois', () => {
    const rounds = bellRounds(items, seeded('graine'));
    expect(rounds.map((r) => r.length)).toEqual([BELLS_PER_ROUND, BELLS_PER_ROUND]);
    for (const r of rounds) {
      expect(r.some((it) => it.correct)).toBe(true);
      expect(r.some((it) => !it.correct)).toBe(true);
    }
    expect(new Set(rounds.flat().map((it) => it.key)).size).toBe(12);
    expect(bellRounds(items, seeded('graine'))).toEqual(rounds);
  });

  it('un niveau de sept bons mots garde ses deux manches équilibrées', () => {
    const seven = items.map((it, i) => ({ ...it, correct: i < 7 }));
    const counts = bellRounds(seven, seeded('x')).map((r) => r.filter((it) => it.correct).length);
    expect(counts.sort()).toEqual([3, 4]);
  });
});

describe('Les pièces durables', () => {
  it('une à la première mission réussie, deux à trois étoiles ; rien sans étoile', () => {
    expect(piecesOf([])).toBe(0);
    expect(piecesOf([0, 0])).toBe(0);
    expect(piecesOf([1, 0])).toBe(1);
    expect(piecesOf([2, 3])).toBe(2);
  });

  it('le Veilleur s’éveille quand chaque lieu a ses deux pièces', () => {
    const places = ['phare', 'filets', 'ecluses', 'quais'] as const;
    expect(veilleurAwake({ phare: 2, filets: 2, ecluses: 2, quais: 2 }, places)).toBe(true);
    expect(veilleurAwake({ phare: 2, filets: 2, ecluses: 1, quais: 2 }, places)).toBe(false);
    expect(veilleurPiece().triangles).toBeGreaterThan(0);
  });

  it('chaque lieu a ses pièces ; la Roue des Écluses tourne à part', () => {
    for (const id of ['phare', 'filets', 'ecluses', 'quais'] as const) {
      expect(placePieces(id, 0).still.triangles).toBe(0);
      const two = placePieces(id, 2);
      expect(two.still.triangles + (two.wheel?.facets.triangles ?? 0)).toBeGreaterThan(placePieces(id, 1).still.triangles);
    }
    expect(placePieces('ecluses', 2).wheel).not.toBeNull();
    expect(placePieces('ecluses', 1).wheel).toBeNull();
  });
});

describe('La place de la question à l’écran', () => {
  const screens = [
    [844, 390],
    [1024, 768],
    [768, 1024],
    [390, 844],
  ] as const;

  const overlap = (a: ScreenBox, b: ScreenBox) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

  it('chaque réponse : une étiquette de 48 px au moins, sur l’objet qui la porte, touchables ensemble, dans l’écran', () => {
    for (const [w, h] of screens)
      for (const count of [2, 3, 4, 6])
        for (const bells of [false, true]) {
          const l = questionLayout({ count, bells }, w, h);
          const at = `${w}×${h}, ${count}`;
          expect(l.slots).toHaveLength(count);
          // L'objet est au moins aussi haut que son étiquette.
          expect(l.objectHeight, at).toBeGreaterThanOrEqual(l.slots[0].label.bottom - l.slots[0].label.top - 1e-9);
          for (const [i, s] of l.slots.entries()) {
            expect(s.label.bottom - s.label.top).toBeGreaterThanOrEqual(48);
            expect(s.label.right - s.label.left).toBeGreaterThanOrEqual(48);
            // La cible couvre l'étiquette et l'objet (du pied à sa hauteur).
            expect(s.hit.left).toBeLessThanOrEqual(s.label.left);
            expect(s.hit.right).toBeGreaterThanOrEqual(s.label.right);
            expect(s.hit.top).toBeLessThanOrEqual(Math.min(s.label.top, s.foot.y - l.objectHeight) + 1e-9);
            expect(s.hit.bottom).toBeGreaterThanOrEqual(Math.max(s.label.bottom, s.foot.y) - 1e-9);
            expect(s.hit.left, at).toBeGreaterThanOrEqual(0);
            expect(s.hit.right, at).toBeLessThanOrEqual(w);
            expect(s.hit.bottom, at).toBeLessThanOrEqual(h);
            // Deux réponses voisines ne se touchent pas.
            if (i > 0) expect(s.hit.left - l.slots[i - 1].hit.right).toBeGreaterThanOrEqual(12 - 1e-9);
            // Rien derrière une réponse : ni la colonne, ni la règle.
            const panel = { left: l.panel.left, right: l.panel.left + l.panel.width, top: l.panel.top, bottom: l.panel.top + l.panel.maxHeight };
            expect(overlap(panel, s.hit), at).toBe(false);
            if (l.aid) expect(overlap(l.aid, s.hit), at).toBe(false);
          }
          expect(l.view.bottom - l.view.top, at).toBeGreaterThan(80);
          expect(l.view.right - l.view.left).toBeGreaterThan(200);
        }
  });

  it('sur tablette, les objets sont dans le tiers du milieu, leur étiquette au-dessus', () => {
    for (const [w, h] of screens.filter(([, h]) => h >= ANSWER_LAYOUT.low)) {
      const l = questionLayout({ count: 3 }, w, h);
      for (const s of l.slots) {
        expect(s.foot.y).toBeGreaterThan(h / 3);
        expect(s.foot.y).toBeLessThanOrEqual((2 * h) / 3 + 1);
        expect(s.label.bottom).toBeLessThanOrEqual(s.foot.y - l.objectHeight);
      }
    }
  });

  it('sur un téléphone couché, les étiquettes en rangée en bas, les objets juste au-dessus, la règle à droite de la colonne', () => {
    const l = questionLayout({ count: 3, aid: true }, 844, 390);
    expect(l.low).toBe(true);
    expect(l.panel.width).toBeCloseTo(0.38 * 844, 3);
    for (const s of l.slots) {
      expect(s.label.bottom).toBeLessThanOrEqual(390);
      expect(s.label.bottom).toBeGreaterThan(390 - 20);
      expect(s.foot.y).toBeLessThanOrEqual(s.label.top);
    }
    expect(l.aid).not.toBeNull();
    expect(l.aid!.left).toBeGreaterThanOrEqual(l.panel.left + l.panel.width);
    expect(questionLayout({ count: 3 }, 844, 390).aid).toBeNull();
    expect(questionLayout({ count: 3, aid: true }, 1024, 768).aid).toBeNull();
    // Une phrase qui ne tient pas : la colonne prend un cran, puis deux, jamais plus ; les réponses ne bougent pas.
    const wider = [0, 1, 2, 3].map((widen) => questionLayout({ count: 4, widen }, 844, 390));
    expect(wider.map((l) => Math.round(l.panel.width))).toEqual([321, 388, 456, 456]);
    for (const l of wider) expect(l.slots).toEqual(wider[0].slots);
  });

  it('au Phare, le carillon : la cloche dans le tiers du milieu, son mot dessous, la tour cadrée jusqu’au pied des cloches', () => {
    const l = questionLayout({ count: 6, bells: true, centered: true }, 1024, 768);
    for (const s of l.slots) {
      expect(s.label.top).toBeGreaterThanOrEqual(s.foot.y);
      expect(s.foot.y).toBeLessThanOrEqual((2 * 768) / 3 + 1);
    }
    expect(l.view.bottom).toBe(l.slots[0].foot.y);
    expect(l.view.left + l.view.right).toBeCloseTo(1024, 0);
  });

  it('la scène commence sous la barre du haut (« Vue simple » et la pause)', () => {
    for (const [w, h] of screens) expect(questionLayout({ count: 3 }, w, h).view.top).toBeGreaterThanOrEqual(ANSWER_LAYOUT.bar);
  });

  it('la caméra de la question met la scène de l’item au milieu de sa fenêtre', () => {
    for (const [w, h] of screens) {
      const l = questionLayout({ count: 4 }, w, h);
      const { pose, shift } = questionPose('quais', l.view, w, h);
      const p = screenOf(pose, sceneSpot('quais'), w, h);
      expect(p.x - shift.x).toBeCloseTo((l.view.left + l.view.right) / 2, 3);
      expect(p.y - shift.y).toBeCloseTo((l.view.top + l.view.bottom) / 2, 3);
    }
  });
});

describe('La scène d’un item', () => {
  const spot = sceneSpot('filets');
  const points = [0, 1, 2].map((i) => ({
    x: spot.x - 2 + 2 * i,
    y: spot.y,
    z: spot.z + 5,
  }));

  it('avant la réponse, la pêche est dans le filet ; après, elle va au panier de la bonne réponse et y reste', () => {
    const scene = {
      kind: 'filets' as const,
      catch: 'sardines' as const,
      count: 3,
    };
    const before = itemScene('filets', scene, false, [], 1);
    const after = itemScene('filets', scene, true, [points[2]], 1);
    expect(before.reaction).toBeNull();
    expect(after.still.triangles).toBeLessThan(before.still.triangles);
    expect(after.reaction).toMatchObject({
      to: { x: points[2].x, z: points[2].z },
      stay: true,
    });
  });

  it('les bonnes cloches s’allument le temps de la réaction, puis rien ne reste', () => {
    const r = itemScene('phare', { kind: 'cloches' }, true, points.slice(0, 2), 1).reaction;
    expect(r?.stay).toBe(false);
    expect(itemScene('phare', { kind: 'cloches' }, false, [], 1).reaction).toBeNull();
  });

  it('l’échelle a ses repères 0, 1, 2 en panneaux de la page, jamais peints', () => {
    expect(itemScene('ecluses', { kind: 'echelle', n: 5, d: 3 }, false).labels.map((l) => l.text)).toEqual(['0', '1', '2']);
    expect(itemScene('ecluses', { kind: 'sas', n: 3, d: 4 }, false).labels).toEqual([]);
  });

  it('la moitié : les caisses qui partent volent à la barque et y restent ; le double : les nouvelles arrivent sur le quai et y restent', () => {
    const before = itemScene('quais', { kind: 'quai', op: 'moitie', before: 34, after: 17 }, false);
    const r = itemScene('quais', { kind: 'quai', op: 'moitie', before: 34, after: 17 }, true).reaction;
    expect(before.reaction).toBeNull();
    expect(r?.stay).toBe(true);
    expect(itemScene('quais', { kind: 'quai', op: 'double', before: 23, after: 46 }, true).reaction?.stay).toBe(true);
  });

  it('les objets des réponses tiennent au-dessus de leur bouton, sans déborder sur le voisin', () => {
    const s = answerScale('phare', points, 10);
    expect(s * 0.55).toBeLessThanOrEqual(0.45 * 2 + 1e-9);
    expect(answerObjects('phare', points, s).triangles).toBeGreaterThan(0);
    expect(answerObjects('quais', [], 1).triangles).toBe(0);
  });
});
