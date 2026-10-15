// Les questions nées du monde (lot 4) : les jumeaux des Filets, les phrases des Quais, la scène des Écluses, les manches
// du Phare, les traces des scénettes, la place des réponses à l'écran et les scènes d'item. Sans Three.js.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { fractionWords } from '../../../core/fractions';
import { seeded } from '../../../core/random';
import { CATALOG } from '../../exercises';
import { MATHS_EXERCISES } from '../../exercises/maths';
import { PROBLEMES_EXERCISES } from '../../exercises/problems';
import { POSEES_EXERCISES } from '../../exercises/writtenOperations';
import { boundsOf } from './facets';
import { modelOfPlace } from './places';
import { heightAt, standingHeight } from './terrain';
import PLACE_ITEMS from './placeItems.json';
import { PLACES, placeById } from './plan6e';
import { ANSWER_LAYOUT, ECLUSES_TRACE_SPOTS, GALLERY_LANTERN, PHARE_GALLERY, PHARE_TRACE_SPOTS, QUAIS_TRACE_SPOTS, answerObjects, answerScale, craneHook, crateLayout, quayBoat, quaySuccess, itemScene, placeTrace, questionLayout, sceneSpot, WIDEN_FULL, WIDEN_OFFER, type ScreenBox } from './questionScene';
import {
  BELLS_PER_ROUND,
  BELLS_PER_SMALL_ROUND,
  EXERCISES_WITH_TWINS,
  LOCK_COLUMN,
  LOCK_IDLE,
  PAIR_INSTRUCTION,
  PHARE_SYLLABLES,
  SAS_HINT,
  answersInColumn,
  pairScene,
  bellRounds,
  phareGesture,
  isItemScene,
  missionIs,
  placeInstruction,
  placeItems,
  QUAI_NU,
  quaiScene,
  sasExplanation,
  traceDone,
  type QuestionItem,
} from './questions';

const reference = (
  id: string,
): {
  instruction: string;
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

  it('chaque jumeau montre la carte de sa référence réduite à une ligne, la même pour tous ; la référence reste entière', () => {
    const rule = 'Le nom commande : déterminant et adjectif prennent son genre et son nombre.';
    for (const id of Object.keys(all)) {
      const items = reference(id).items;
      const placed = placeItems('filets', id, items);
      for (const [i, p] of placed.entries()) {
        const ref = items[i].aid as { kind: string; props: { title: string; lines: string[] } };
        expect(p.aid, p.key).toEqual({ ...ref, props: { ...ref.props, lines: [rule] } });
        expect(ref.props.lines.length).toBeGreaterThan(1);
      }
    }
    // Ce qui manque passe dans les indices.
    const hints = all['french-6e-grammar-spelling-plurals-1'].map((t) => t.hint);
    expect(hints[3]).toBe('Deux, c’est plusieurs. Pense à : un journal, des journaux.');
    expect(hints[6]).toBe('« Les », c’est plusieurs. Pense à : un bateau, des bateaux.');
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
    expect(placeInstruction('ecluses', 'maths-6e-fractions-number-line-1', 1, 'réf.')).toContain('sas');
    expect(placeInstruction('ecluses', 'maths-6e-fractions-number-line-2', 2, 'réf.')).toContain('échelle');
    expect(placeInstruction('filets', 'french-6e-grammar-spelling-plurals-1', 1, 'réf.')).toBe('réf.');
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

  it('une consigne par mission aux Écluses : Deux rives a la sienne, les autres gardent celle de référence (lot L2)', () => {
    expect(placeInstruction('ecluses', 'maths-6e-fractions-equivalence-1', 1, 'réf.')).toBe(PAIR_INSTRUCTION);
    expect(PAIR_INSTRUCTION).toMatch(/égales/);
    // Au Phare, l'Abattage syllabique dit la cloche à toucher ; la fin des niveaux 2 et 3 reste, les autres missions gardent la leur.
    for (const def of CATALOG.filter((d) => d.biome === 'french-6e-phonology')) {
      const { instruction } = reference(def.id);
      const at = placeInstruction('phare', def.id, 1, instruction);
      if (!missionIs(def.id, 'syllables')) expect(at).toBe(instruction);
      else {
        expect(at.startsWith(PHARE_SYLLABLES)).toBe(true);
        expect(at).not.toMatch(/tape le nombre/);
        expect(at.endsWith(instruction.slice(instruction.indexOf('.') + 1))).toBe(true);
      }
    }
    expect(placeInstruction('ecluses', 'maths-6e-fractions-equivalence-1', 1, 'réf.', { kind: 'lockPair', a: [1, 2], b: [2, 4] })).toBe(PAIR_INSTRUCTION);
    // Un item de Deux rives sans ses deux sas (`pairScene` rend `null`) se joue sur le sas au repos, avec la consigne de référence.
    const [alone] = placeItems('ecluses', 'maths-6e-fractions-equivalence-1', [{ key: 'k', prompt: 'réf.' }]);
    expect(alone.placeScene).toEqual(LOCK_IDLE);
    expect(placeInstruction('ecluses', 'maths-6e-fractions-equivalence-1', 1, 'réf.', alone.placeScene)).toBe('réf.');
    for (const id of ['maths-6e-fractions-sharing-1', 'maths-6e-fractions-place-value-2', 'maths-6e-fractions-fraction-sums-1']) expect(placeInstruction('ecluses', id, 1, 'réf.')).toBe('réf.');
  });

  it('Deux rives : deux sas de même unité, la phrase, l’indice et la correction selon le cas ; clé, choix et réponse gardés', () => {
    const item = (a: [number, number], b: [number, number], answer: string) => ({
      key: 'k',
      prompt: 'réf.',
      choices: [`${a[0]}/${a[1]}`, `${b[0]}/${b[1]}`, 'Elles sont égales'],
      answer,
      aid: { kind: 'compare-bars', props: { a, b } },
    });
    const same = pairScene(item([3, 5], [2, 5], '3/5'), fractionWords)!;
    expect(same.scene).toEqual({ kind: 'lockPair', a: [3, 5], b: [2, 5] });
    expect(same.prompt).toBe('Compare 3/5 et 2/5.');
    expect(same.spoken).toBe('Compare 3 cinquièmes et 2 cinquièmes.');
    expect(same.hint).toMatch(/même nombre de parts égales/);
    expect(same.explanation).toBe('3 parts pleines sur 5, c’est plus que 2 parts pleines sur 5 : 3/5 est plus grande que 2/5.');
    const num = pairScene(item([1, 5], [1, 3], '1/3'))!;
    expect(num.prompt).toBe('Compare 1/5 et 1/3.');
    // Un numérateur 1 se lit « un cinquième », jamais « rempli à un demi » (contenu, relecture de L2).
    expect(pairScene(item([1, 5], [1, 3], '1/3'), fractionWords)!.spoken).not.toMatch(/rempli/);
    expect(num.explanation).toBe('Le même nombre de parts pleines, mais des parts plus grandes dans le sas coupé en 3 : 1/3 est plus grande que 1/5.');
    const equal = pairScene(item([2, 3], [4, 6], 'Elles sont égales'))!;
    expect(equal.explanation).toBe('L’eau arrive à la même hauteur dans les deux sas : 2/3 et 4/6 sont égales.');
    expect(pairScene({ key: 'k' })).toBeNull();
    // Sans les mots de la vue, la phrase lue garde les fractions écrites.
    expect(pairScene(item([3, 5], [2, 5], '3/5'))!.spoken).toBe('Compare 3/5 et 2/5.');
    // Les items du générateur : chacun a ses deux sas, jamais « gauche » ni « droite », et garde sa clé, ses choix, sa réponse.
    const def = MATHS_EXERCISES.find((e) => e.id === 'maths-6e-fractions-equivalence-1')!;
    const items = def.generate!('graine') as QuestionItem[];
    const placed = placeItems('ecluses', def.id, items);
    placed.forEach((p, i) => {
      expect(p.placeScene.kind).toBe('lockPair');
      expect(`${p.prompt} ${p.hint} ${p.explanation}`).not.toMatch(/gauche|droite/);
      expect([p.key, p.choices, p.answer]).toEqual([items[i].key, items[i].choices, items[i].answer]);
      // Les barres de « Vue simple » gardées, leurs fractions en colonne (une seule forme, référent dys).
      const aid = items[i].aid as { kind: string; props: object };
      expect(p.aid).toEqual({ ...aid, props: { ...aid.props, stacked: true } });
      const sc = p.placeScene as { a: [number, number]; b: [number, number] };
      expect(Math.max(sc.a[1], sc.b[1])).toBeLessThanOrEqual(10);
    });
  });

  it('Partage du gâteau et Galets en colonnes : leurs items de référence tels quels, le sas au repos ; Calculer avec des fractions : les réponses dans la colonne', () => {
    const defs = [...MATHS_EXERCISES, ...POSEES_EXERCISES].filter((e) => e.biome === 'maths-6e-fractions' && (e.type === 'sharing' || e.type === 'place-value'));
    expect(defs.length).toBe(5);
    for (const def of defs) {
      const items = def.generate!('graine') as QuestionItem[];
      expect(placeItems('ecluses', def.id, items)).toEqual(items.map((it) => ({ ...it, placeScene: LOCK_IDLE })));
    }
    for (const id of ['maths-6e-fractions-fraction-sums-1', 'maths-6e-fractions-fraction-sums-2']) {
      const { items } = reference(id);
      const placed = placeItems('ecluses', id, items);
      expect(placed).toEqual(items.map((it) => ({ ...it, placeScene: LOCK_COLUMN })));
      expect(placed.every((p) => answersInColumn(p.placeScene))).toBe(true);
    }
    expect(answersInColumn(LOCK_IDLE)).toBe(false);
    expect(isItemScene(LOCK_COLUMN) && isItemScene({ kind: 'lockPair', a: [1, 2], b: [2, 4] })).toBe(true);
    expect(isItemScene({ kind: 'lockPair', a: [3, 2], b: [2, 4] })).toBe(false);
  });

  it('missionIs ne reconnaît, pour chaque mission jouée en scénette (plan6e.ts), que les exercices de cette mission', () => {
    for (const place of PLACES)
      for (const mission of place.scenes) {
        const own = CATALOG.filter((d) => d.biome === place.island && missionIs(d.id, mission));
        expect(own.length, `${place.id} ${mission}`).toBeGreaterThan(0);
        for (const d of own) expect(d.id, `${place.id} ${mission}`).toMatch(new RegExp(`^${place.island}-${mission}-[a-z0-9-]+$`));
        // Aucune autre mission du lieu ne prend ces exercices.
        for (const other of place.scenes.filter((m) => m !== mission)) expect(own.some((d) => missionIs(d.id, other)), `${mission} / ${other}`).toBe(false);
      }
  });

  it('les cinq missions des Écluses se jouent en scénette (lot L2)', () => {
    expect(placeById('ecluses').scenes).toEqual(['number-line', 'equivalence', 'sharing', 'place-value', 'fraction-sums']);
  });

  it('le double : une idée par phrase', () => {
    expect(quaiScene('dbl-23')?.prompt).toMatch(/Combien y en a-t-il sur le quai maintenant \?$/);
  });

  it('les autres missions des Quais gardent leurs items de référence tels quels, sur le quai vide (GD-20, point 8)', () => {
    const generated = [...MATHS_EXERCISES, ...PROBLEMES_EXERCISES].filter((e) => e.biome === 'maths-6e-calculation' && e.type !== 'doubles-halves');
    const written = ['maths-6e-calculation-measures-1', 'maths-6e-calculation-measures-2'].map((id) => ({ id, items: reference(id).items }));
    const all = [...generated.map((e) => ({ id: e.id, items: e.generate?.('graine') ?? e.items })), ...written];
    expect(new Set(all.map((e) => e.id.replace(/-\d$/, ''))).size).toBe(4);
    for (const { id, items } of all) {
      const placed = placeItems('quais', id, items as QuestionItem[]);
      expect(placed.map(({ placeScene, ...rest }) => [placeScene, rest])).toEqual(items.map((it) => [QUAI_NU, it]));
    }
    // Une clé de Doubles et moitiés hors de sa mission ne change rien non plus.
    expect(placeItems('quais', 'maths-6e-calculation-make-ten-1', [{ key: 'half-34', prompt: 'p' }])[0]).toEqual({ key: 'half-34', prompt: 'p', placeScene: QUAI_NU });
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

  it('ses trois missions aux mêmes cloches, avec leurs items de référence : marquer puis valider, ou toucher un nombre (lot L3)', () => {
    expect(placeById('phare').scenes).toEqual(['syllables', 'sound-hunt', 'rhymes']);
    for (const def of CATALOG.filter((d) => d.biome === 'french-6e-phonology')) {
      const { items } = reference(def.id);
      const placed = placeItems('phare', def.id, items);
      // Le mot est l'objet appris : rien ne change dans l'item, la scène ne fait que le porter.
      expect(placed.map(({ placeScene, ...rest }) => [placeScene, rest])).toEqual(items.map((it) => [{ kind: 'cloches' }, it]));
      const gesture = phareGesture(def.id);
      if (missionIs(def.id, 'syllables')) {
        expect(gesture).toBe('toucher');
        // Trois cloches, les trois nombres de la référence, dans son ordre (1, 2, 3 au premier niveau ; jusqu'à 5, 6, 7).
        for (const it of items) {
          expect(it.choices).toHaveLength(3);
          const [a, b, c] = it.choices.map(Number);
          expect([b - a, c - b]).toEqual([1, 1]);
          expect(it.choices).toContain(it.answer);
        }
      } else {
        expect(gesture).toBe('marquer');
        expect(items.every((it) => typeof it.correct === 'boolean')).toBe(true);
        // Des manches de quatre à six cloches.
        for (const r of bellRounds(items, seeded(def.id))) {
          expect(r.length).toBeGreaterThanOrEqual(4);
          expect(r.length).toBeLessThanOrEqual(BELLS_PER_ROUND);
        }
        // Au plus grand texte sur un écran bas : quatre au plus, des bons mots et des pièges dans chacune, chaque mot une fois.
        const small = bellRounds(items, seeded(def.id), BELLS_PER_SMALL_ROUND);
        for (const r of small) {
          expect(r.length).toBeLessThanOrEqual(BELLS_PER_SMALL_ROUND);
          expect(r.some((it) => it.correct)).toBe(true);
          expect(r.some((it) => !it.correct)).toBe(true);
        }
        expect(small.flat().map((it) => it.key).sort()).toEqual(items.map((it) => it.key).sort());
      }
    }
  });

  it('un niveau de sept bons mots garde ses deux manches équilibrées', () => {
    const seven = items.map((it, i) => ({ ...it, correct: i < 7 }));
    const counts = bellRounds(seven, seeded('x')).map((r) => r.filter((it) => it.correct).length);
    expect(counts.sort()).toEqual([3, 4]);
  });
});

describe('Les traces des scénettes', () => {
  it('la trace d’un lieu se voit dès la première réussite de sa mission ; rien sans étoile', () => {
    expect(traceDone([])).toBe(false);
    expect(traceDone([0, 0])).toBe(false);
    expect(traceDone([1, 0])).toBe(true);
    expect(traceDone([2, 3])).toBe(true);
  });

  it('une scène d’item se vérifie champ par champ', () => {
    expect(isItemScene({ kind: 'filets', catch: 'bocaux', count: 2 })).toBe(true);
    expect(isItemScene({ kind: 'quai', op: 'double', before: 23, after: 46 })).toBe(true);
    expect(isItemScene(QUAI_NU)).toBe(true);
    expect(isItemScene({ kind: 'sas', n: 3, d: 4 })).toBe(true);
    expect(isItemScene({ kind: 'filets', catch: 'baleine', count: 1 })).toBe(false);
    expect(isItemScene({ kind: 'sas', n: 3, d: 0 })).toBe(false);
    expect(isItemScene({ kind: 'quai', op: 'triple', before: 1, after: 3 })).toBe(false);
    expect(isItemScene(null)).toBe(false);
    expect(isItemScene('cloches')).toBe(false);
  });

  it('chaque mission jouée en scénette a sa trace ; aux Écluses, la porte d’amont fermée est là avant la réussite', () => {
    for (const p of PLACES) {
      if (p.id === 'ecluses') expect(placeTrace(p.id, []).triangles).toBeGreaterThan(0);
      else expect(placeTrace(p.id, []).triangles).toBe(0);
      // Chaque mission ajoute la sienne, et rien d'autre : une mission qui se joue hors de la scénette n'en laisse pas.
      let before = placeTrace(p.id, []).triangles;
      for (let k = 1; k <= p.scenes.length; k++) {
        const now = placeTrace(p.id, p.scenes.slice(0, k)).triangles;
        expect(now).toBeGreaterThan(before);
        before = now;
      }
      expect(placeTrace(p.id, ['abattage-imaginaire']).triangles).toBe(placeTrace(p.id, []).triangles);
    }
  });

  it('au Phare, chaque trace est la sienne, sur le plat de l’îlot, hors des chemins et du jardin ; les lampes sur la galerie (lot L3)', () => {
    const c = placeById('phare').center;
    const y0 = standingHeight(heightAt(c));
    const lamps = placeTrace('phare', ['sound-hunt']);
    expect(boundsOf(lamps).min[1]).toBeCloseTo(y0 + PHARE_GALLERY, 6);
    // Quatre lanternes à cage d'environ 0,6 unité, sur leur poteau, au-dessus de la rambarde, face au sud.
    const L = GALLERY_LANTERN;
    expect(L.base + L.glass + L.cap).toBeCloseTo(0.6, 6);
    expect(boundsOf(lamps).max[1]).toBeCloseTo(y0 + PHARE_GALLERY + L.post + 0.6, 6);
    expect(boundsOf(lamps).min[2]).toBeGreaterThan(c.z);
    const sizes = new Set<number>();
    for (const m of Object.keys(PHARE_TRACE_SPOTS) as (keyof typeof PHARE_TRACE_SPOTS)[]) {
      const t = placeTrace('phare', [m]);
      sizes.add(t.triangles);
      const b = boundsOf(t);
      const o = PHARE_TRACE_SPOTS[m];
      // Autour de son point, au sol : rien sous l'eau, rien au-dessus de la galerie.
      expect(Math.max(Math.abs(b.min[0] - c.x - o.x), Math.abs(b.max[0] - c.x - o.x)), m).toBeLessThan(2);
      expect(Math.max(Math.abs(b.min[2] - c.z - o.z), Math.abs(b.max[2] - c.z - o.z)), m).toBeLessThan(1.2);
      expect(b.max[1], m).toBeLessThan(y0 + PHARE_GALLERY);
      expect(heightAt({ x: c.x + o.x, z: c.z + o.z }), m).toBeGreaterThan(0.5);
      // Hors du socle de la tour (3,6 de rayon) et du jardin clos de la gardienne (à l'ouest, places.ts).
      expect(Math.hypot(o.x, o.z), m).toBeGreaterThan(4.5);
      expect(Math.abs(o.x + 6) > 3 || Math.abs(o.z - 0.5) > 3, m).toBe(true);
      // Loin des chemins : la digue (de la porte vers le sud-est) et le chemin de l'Escale (droit au sud).
      const door = { x: 0, z: 6.14 };
      const digue = { x: 23.2, z: 26.4 };
      const t2 = Math.max(0, Math.min(1, ((o.x - door.x) * (digue.x - door.x) + (o.z - door.z) * (digue.z - door.z)) / ((digue.x - door.x) ** 2 + (digue.z - door.z) ** 2)));
      expect(Math.hypot(o.x - door.x - t2 * (digue.x - door.x), o.z - door.z - t2 * (digue.z - door.z)), m).toBeGreaterThan(3);
      expect(Math.abs(o.x) > 3 || o.z < door.z - 2, m).toBe(true);
    }
    expect(sizes.size).toBe(2);
  });

  it('aux Écluses, chaque trace est la sienne, autour de son point, sans rien laisser au-delà du lieu (lot L2)', () => {
    const c = placeById('ecluses').center;
    const gate = placeTrace('ecluses', []).triangles;
    const sizes = new Set<number>();
    for (const m of Object.keys(ECLUSES_TRACE_SPOTS) as (keyof typeof ECLUSES_TRACE_SPOTS)[]) {
      const t = placeTrace('ecluses', [m]);
      sizes.add(t.triangles - gate);
      const b = boundsOf(t);
      // La porte d'amont et la trace : rien à plus de huit unités du centre du lieu.
      expect(Math.max(Math.abs(b.min[0] - c.x), Math.abs(b.max[0] - c.x), Math.abs(b.min[2] - c.z), Math.abs(b.max[2] - c.z))).toBeLessThan(8);
    }
    expect(sizes.size).toBe(4);
  });

  it('aux Quais, les cinq traces sont posées au sol, sur le terre-plein, sans se toucher ; la barque du passeur sur l’eau, la palette de dix sur le ponton', () => {
    const c = placeById('quais').center;
    const boxes = (['times-tables', 'make-ten', 'doubles-halves', 'word-problems', 'measures'] as const).map((m) => [m, boundsOf(placeTrace('quais', [m]))] as const);
    for (const [m, b] of boxes) {
      if (m === 'doubles-halves') continue;
      const spot = QUAIS_TRACE_SPOTS[m];
      // Autour de son point, à quelques unités au plus.
      expect(Math.abs((b.min[0] + b.max[0]) / 2 - (c.x + spot.x))).toBeLessThan(2);
      if (m === 'word-problems') expect(b.min[1]).toBeLessThan(0.1);
      else if (m === 'make-ten') {
        // Sur le bout nord du ponton (places.ts : x de −7,1 à −3,7, z de −0,9 à 4,3), l'amarre jusqu'au crochet de la grue.
        expect(spot.x).toBeGreaterThan(-7.1 + 1.2);
        expect(spot.x).toBeLessThan(-3.7 - 1.2);
        expect(spot.z).toBeGreaterThan(-0.9 + 0.4);
        expect(b.min[2]).toBeLessThan(c.z - 3.4);
      } else expect(heightAt({ x: c.x + spot.x, z: c.z + spot.z })).toBeGreaterThan(0);
    }
    const lone = boxes.filter(([m]) => m !== 'doubles-halves').map(([, b]) => b);
    for (let i = 0; i < lone.length; i++)
      for (let k = i + 1; k < lone.length; k++) {
        const a = lone[i],
          b = lone[k];
        const apart = a.max[0] < b.min[0] || b.max[0] < a.min[0] || a.max[2] < b.min[2] || b.max[2] < a.min[2];
        expect(apart).toBe(true);
      }
  });

  it('la Roue arrêtée des Écluses est fermée de son côté ouest', () => {
    const still = modelOfPlace('ecluses').facets;
    let west = 0;
    for (let i = 0; i < still.normals.length; i += 3) if (still.normals[i] < -0.99 && still.positions[i] > 3.05 - 0.44) west++;
    expect(west).toBeGreaterThanOrEqual(10);
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
    expect(wider.map((l) => Math.round(l.panel.width))).toEqual([321, 388, 456, 828]);
    for (const l of wider) expect(l.slots).toEqual(wider[0].slots);
    // Au-delà de 54 % : la phrase en pleine largeur, sous la barre de « Vue simple », au-dessus des objets ; la règle y
    // entre ; même place quand « Vue simple » est proposé d'emblée.
    for (const widen of [WIDEN_FULL, WIDEN_OFFER]) {
      const full = questionLayout({ count: 3, aid: true, widen }, 844, 390);
      expect(full.panel.top).toBeGreaterThanOrEqual(ANSWER_LAYOUT.bar);
      expect(full.panel.top + full.panel.maxHeight).toBeLessThanOrEqual(Math.min(...full.slots.map((sl) => sl.hit.top)));
      expect(full.aid).toBeNull();
    }
  });

  it('la scène commence sous la barre du haut (« Vue simple » et la pause)', () => {
    for (const [w, h] of screens) expect(questionLayout({ count: 3 }, w, h).view.top).toBeGreaterThanOrEqual(ANSWER_LAYOUT.bar);
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

  it('aux Quais, la bonne caisse de réponse monte au crochet de la grue et y reste ; les caisses du quai sont déjà à leur place', () => {
    const moitie = { kind: 'quai', op: 'moitie', before: 34, after: 17 } as const;
    const at = { x: 70, y: 0.5, z: 75 };
    expect(itemScene('quais', moitie, false, [at]).reaction).toBeNull();
    // Sans bonne réponse montrée, rien ne monte.
    expect(itemScene('quais', moitie, true).reaction).toBeNull();
    const r = itemScene('quais', moitie, true, [at], 0.8).reaction!;
    expect(r.stay).toBe(true);
    expect(r.from).toEqual(at);
    // Le quai s'allonge avec les caisses : le crochet reste au-dessus de sa bande de devant, à la même hauteur.
    const hook = craneHook();
    const o = sceneSpot('quais');
    expect(r.to.z).toBeCloseTo(hook.z, 6);
    expect(Math.abs(r.to.x - o.x)).toBeLessThan(10);
    // Pendue sous le crochet, au-dessus du quai.
    expect(r.to.y).toBeLessThan(hook.y);
    expect(r.to.y).toBeGreaterThan(sceneSpot('quais').y);
    // Répondu : les caisses qui partent sont dans la barque (plus de triangles qu'avant, aucune ne vole).
    const still = itemScene('quais', moitie, true, [at]).still.triangles;
    expect(still).toBeGreaterThan(0);
    expect(itemScene('quais', { kind: 'quai', op: 'double', before: 23, after: 46 }, true, [at]).reaction?.stay).toBe(true);
  });

  it('à la réussite aux Quais, la caisse descend dans la barque, à côté de ses caisses, et la lanterne de proue s’allume', () => {
    for (const scene of [
      { kind: 'quai', op: 'moitie', before: 98, after: 49 },
      { kind: 'quai', op: 'double', before: 7, after: 14 },
    ] as const) {
      const boat = quayBoat(scene);
      const success = quaySuccess(scene, 0.8);
      const crate = boundsOf(success.crate);
      // Dans la coque, devant le banc de proue, hors des caisses du calcul.
      expect(crate.min[0]).toBeGreaterThan(boat.cargo.x);
      expect(crate.max[0]).toBeLessThan(boat.at.x + boat.length / 2 - 0.4);
      expect(crate.min[2]).toBeGreaterThan(boat.at.z - boat.width / 2);
      expect(crate.max[2]).toBeLessThan(boat.at.z + boat.width / 2);
      // La lanterne au bout de l'étrave, au-delà de la coque, plus haut que les bordés.
      const glass = boundsOf(success.glass);
      expect(glass.min[0]).toBeGreaterThan(boat.at.x + boat.length / 2);
      expect(glass.min[1]).toBeGreaterThan(boat.at.y + 0.5);
      // La proue reste dans le cadre de la scénette : sous la grue, pas plus loin que le quai.
      expect(glass.max[0]).toBeLessThan(sceneSpot('quais').x + 4);
    }
    // La barque chargée et sa lanterne restent aux Quais dès la première réussite : un peu plus de triangles qu'avant.
    expect(placeTrace('quais', ['doubles-halves']).triangles).toBeGreaterThan(placeTrace('quais', []).triangles + 100);
  });

  it('aux Quais, une caisse tentée penche, la caisse partie au crochet s’efface de la rangée', () => {
    const pts = [0, 1, 2, 3].map((i) => ({ x: 66 + 2 * i, y: 0.5, z: 75 }));
    const still = answerObjects('quais', pts, 0.8);
    const tried = answerObjects('quais', pts, 0.8, { picked: [1] });
    expect(tried.triangles).toBe(still.triangles);
    expect(Array.from(tried.positions)).not.toEqual(Array.from(still.positions));
    const gone = answerObjects('quais', pts, 0.8, { gone: [2] });
    expect(gone.triangles).toBeGreaterThan(0);
    expect(gone.triangles).toBeLessThan(still.triangles);
  });

  it('les objets des réponses tiennent au-dessus de leur bouton, sans déborder sur le voisin', () => {
    const s = answerScale('phare', points, 10);
    expect(s * 0.45).toBeLessThanOrEqual(0.45 * 2 + 1e-9);
    expect(answerObjects('phare', points, s).triangles).toBeGreaterThan(0);
    expect(answerObjects('quais', [], 1).triangles).toBe(0);
  });
});
