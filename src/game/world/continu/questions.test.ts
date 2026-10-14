// Les questions nées du monde (lot 4) : les jumeaux des Filets, les phrases des Quais, la scène des Écluses, les manches
// du Phare, les pièces durables, la place des réponses à l'écran et les scènes d'item. Sans Three.js.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { seeded } from '../../../core/random';
import { screenOf } from './camera';
import PLACE_ITEMS from './placeItems.json';
import { ANSWER_LAYOUT, answerObjects, answerScale, crateLayout, itemScene, placePieces, questionLayout, questionPose, sceneSpot } from './questionScene';
import { BELLS_PER_ROUND, EXERCISES_WITH_TWINS, bellRounds, piecesOf, placeInstruction, placeItems, quaiScene, type QuestionItem } from './questions';

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
});

describe('Les Quais et les Écluses gardent l’item de référence', () => {
  it('la moitié et le double : une idée par phrase, la ligne de calcul de référence dessous', () => {
    expect(quaiScene('half-34')).toEqual({
      scene: { kind: 'quai', op: 'moitie', before: 34, after: 17 },
      prompt: '34 caisses sont sur le quai. La grue prend la moitié. Combien de caisses restent ?',
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

  it('des réponses de 48 px au moins, écartées, dans l’écran ; la colonne au-dessus des objets ; une fenêtre pour la scène', () => {
    for (const [w, h] of screens)
      for (const count of [2, 3, 4, 6]) {
        const l = questionLayout(count, w, h);
        expect(l.width).toBeGreaterThanOrEqual(48);
        expect(ANSWER_LAYOUT.button).toBeGreaterThanOrEqual(48);
        for (let i = 1; i < count; i++) expect(l.buttons[i].x - l.buttons[i - 1].x - l.width).toBeGreaterThanOrEqual(12 - 1e-9);
        expect(l.buttons[0].x - l.width / 2).toBeGreaterThanOrEqual(0);
        expect(l.buttons[count - 1].x + l.width / 2).toBeLessThanOrEqual(w);
        expect(l.buttons[0].y + ANSWER_LAYOUT.button / 2).toBeLessThanOrEqual(h);
        // La colonne ne passe jamais sur les boutons (sur un écran bas, elle passe devant les objets de gauche).
        const objectsTop = l.objects[0].y - l.objectHeight;
        expect(l.panel.top + l.panel.maxHeight).toBeLessThanOrEqual(h < ANSWER_LAYOUT.low ? l.buttons[0].y - l.height / 2 : objectsTop);
        expect(l.view.bottom - l.view.top, `${w}×${h}`).toBeGreaterThan(80);
        expect(l.view.right - l.view.left).toBeGreaterThan(200);
      }
  });

  it('la caméra de la question met la scène de l’item au milieu de sa fenêtre', () => {
    for (const [w, h] of screens) {
      const l = questionLayout(4, w, h);
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

  it('la moitié : les caisses qui restent sur le quai, celles qui partent s’effacent sur la barque', () => {
    const r = itemScene('quais', { kind: 'quai', op: 'moitie', before: 34, after: 17 }, true).reaction;
    expect(r?.stay).toBe(false);
    expect(itemScene('quais', { kind: 'quai', op: 'double', before: 23, after: 46 }, true).reaction?.stay).toBe(true);
  });

  it('les objets des réponses tiennent au-dessus de leur bouton, sans déborder sur le voisin', () => {
    const s = answerScale('phare', points, 10);
    expect(s * 0.55).toBeLessThanOrEqual(0.3 * 2 + 1e-9);
    expect(answerObjects('phare', points, s).triangles).toBeGreaterThan(0);
    expect(answerObjects('quais', [], 1).triangles).toBe(0);
  });
});
