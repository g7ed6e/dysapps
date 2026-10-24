// Les questions nées du monde (lot 4) : les jumeaux des Filets, les phrases des Quais, la scène des Écluses, les manches
// du Phare, les traces des scénettes, la place des réponses à l'écran et les scènes d'item. Sans Three.js.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { fractionWords } from '../../../core/fractions';
import { pourLaVoix } from '../../../core/speech';
import { seeded } from '../../../core/random';
import { CATALOG, loadExercise } from '../../exercises';
import { SHORT_INSTRUCTIONS } from '../../exercises/shortInstructions';
import { MATHS_EXERCISES } from '../../exercises/maths';
import { PROBLEMES_EXERCISES } from '../../exercises/problems';
import { POSEES_EXERCISES } from '../../exercises/writtenOperations';
import { boundsOf } from './facets';
import { placeFacets } from './facets';
import { distance, linearRgb } from './geometry';
import { COMMONS, ENGINE, ENGINE_ROTOR_COLORS, LAMP_COLOR, OBSERVATORY, OBSERVATORY_TABLE, SHIPYARD, STEAM_COLORS, engineRill, engineRotorHub, hullEdge, hullPoint, modelOfPlace, ruinOf, slipRails } from './places';
import { MANGROVE, mangroveCarbetFloor, mangroveDeckTop } from './places';
import { RUINS, RUINS_ORNATE_ARCH, ruinsTop } from './places';
import { NEW_WOOD, PLANK_BRIDGES, pathRibbons } from './paths';
import { networkSamples, pathNode } from './paths';
import { buildHeightField, heightAt, heightOnMesh, landDistance, standingHeight, tileFacets } from './terrain';
import PLACE_ITEMS from './placeItems.json';
import { PLACES, TERRAIN, placeById } from './plan6e';
import { PAPER_COLOR } from './printworks';
import {
  ANSWER_LAYOUT,
  ECLUSES_TRACE_SPOTS,
  ENGINE_TRACE_SPOTS,
  MANGROVE_TRACE_SPOTS,
  PIROGUE,
  pirogueRest,
  DIG_WINCH,
  RUINS_TRACE_SPOTS,
  digBucketSpots,
  FILETS_CARRELET,
  FILETS_TRACE_SPOTS,
  FILETS_VIVIER,
  GALLERY_LANTERN,
  OBSERVATORY_TRACE_SPOTS,
  COMMONS_TRACE_SPOTS,
  PHARE_GALLERY,
  PHARE_TRACE_SPOTS,
  QUAIS_TRACE_SPOTS,
  SALTWORKS_TRACE_SPOTS,
  SALT_PUMP,
  SHIPYARD_TRACE_SPOTS,
  answerObjects,
  answerScale,
  craneHook,
  crateLayout,
  quayBoat,
  quaySuccess,
  itemScene,
  placeTrace,
  questionLayout,
  saltPumpHub,
  sceneSpot,
  WIDEN_FULL,
  WIDEN_OFFER,
  type ScreenBox,
} from './questionScene';
import {
  BELLS_PER_ROUND,
  BELLS_PER_SMALL_ROUND,
  COLUMN,
  ENCLOS,
  ENCLOS_BINS,
  ENCLOS_INSTRUCTION,
  ENCLOS_RULE_LINE,
  JAUGE_HINT,
  JAUGE_INSTRUCTION,
  JAUGE_PROMPT,
  RANGE_PER_GRAND_ROUND,
  SALINE,
  jaugeExplanation,
  RECOLTE_ORDER,
  agreedSentence,
  placeRuleLine,
  EXERCISES_WITH_TWINS,
  LOCK_IDLE,
  PAIR_INSTRUCTION,
  PHARE_SYLLABLES,
  SAS_HINT,
  pairScene,
  sceneDrawsFigure,
  bellRounds,
  phareGesture,
  isItemScene,
  missionIs,
  placeInstruction,
  placeItems,
  rangeGesture,
  rangeRounds,
  QUAI_NU,
  REST,
  quaiScene,
  sasExplanation,
  traceDone,
  type QuestionItem,
  gestureBins,
  gestureScreens,
  itemGesture,
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
    // L'Enclos dit le geste « ranger » (lot L4) ; le Tri des graines et la Récolte gardent la consigne de référence.
    expect(placeInstruction('filets', 'french-6e-grammar-spelling-word-classes-1', 1, 'réf.')).toBe(ENCLOS_INSTRUCTION[0]);
    expect(placeInstruction('filets', 'french-6e-grammar-spelling-word-classes-2', 2, 'réf.')).toBe(ENCLOS_INSTRUCTION[1]);
    expect(placeInstruction('filets', 'french-6e-grammar-spelling-e-er-ez-1', 1, 'réf.')).toBe('réf.');
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

  it('Partage du gâteau, Galets en colonnes et Calculer avec des fractions : leurs items de référence tels quels, le sas au repos', () => {
    const defs = [...MATHS_EXERCISES, ...POSEES_EXERCISES].filter((e) => e.biome === 'maths-6e-fractions' && (e.type === 'sharing' || e.type === 'place-value'));
    expect(defs.length).toBe(5);
    for (const def of defs) {
      const items = def.generate!('graine') as QuestionItem[];
      expect(placeItems('ecluses', def.id, items)).toEqual(items.map((it) => ({ ...it, placeScene: LOCK_IDLE })));
    }
    for (const id of ['maths-6e-fractions-fraction-sums-1', 'maths-6e-fractions-fraction-sums-2']) {
      const { items } = reference(id);
      const placed = placeItems('ecluses', id, items);
      expect(placed).toEqual(items.map((it) => ({ ...it, placeScene: LOCK_IDLE })));
    }
    expect(isItemScene(LOCK_IDLE) && isItemScene({ kind: 'lockPair', a: [1, 2], b: [2, 4] })).toBe(true);
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

describe('Les Marais salants (GD-20, point 8, lot L5)', () => {
  const decimals = (m: string, level: number) => `maths-6e-decimals-${m}-${level}`;
  type Drawn = QuestionItem & { prompt: string; choices: string[]; answer: string; figure?: unknown };
  const generated = async (id: string): Promise<Drawn[]> => {
    const def = (await loadExercise(id))!;
    return (def.generate ? def.generate(`marais:${id}`) : def.items) as unknown as Drawn[];
  };

  it('la Pente graduée, au niveau 1, a sa jauge : la phrase, l’indice et la correction du contenu ; clé, choix et réponse gardés', async () => {
    const items = await generated(decimals('scale', 1));
    const placed = placeItems('saltworks', decimals('scale', 1), items);
    expect(placed).toHaveLength(items.length);
    for (const [i, p] of placed.entries()) {
      const ref = items[i];
      const props = (ref.figure as { props: { start: number; point: number } }).props;
      expect(p.placeScene).toEqual({ kind: 'jauge', start: props.start, d: 10, n: props.point });
      expect([p.key, p.choices, p.answer]).toEqual([ref.key, ref.choices, ref.answer]);
      expect(p.prompt).toBe(JAUGE_PROMPT);
      expect(p.spoken).toBe(JAUGE_PROMPT);
      expect(p.hint).toBe(JAUGE_HINT);
      expect(p.explanation).toBe(jaugeExplanation(props.start, props.point, ref.answer));
      // La droite de référence reste dans l'item : « Vue simple » la montre.
      expect(p.figure).toEqual(ref.figure);
    }
    // Le calcul ne se coupe pas (espaces insécables autour de + et de =), ni « au-dessus » à son trait d'union (référent
    // dys, relecture du lot L5) ; la voix lit les mêmes signes, « plus » et « égale », sans rien recoller.
    expect(jaugeExplanation(5, 3, '5,3')).toBe('L’eau arrive 3 graduations au-\u2060dessus de 5 : 5\u00a0+\u00a00,3\u00a0=\u00a05,3.');
    expect(jaugeExplanation(7, 1, '7,1')).toBe('L’eau arrive 1 graduation au-\u2060dessus de 7 : 7\u00a0+\u00a00,1\u00a0=\u00a07,1.');
    expect(pourLaVoix(jaugeExplanation(9, 4, '9,4')).replace(/[\u00a0\u2060]/g, (c) => (c === '\u00a0' ? ' ' : ''))).toBe('L’eau arrive 4 graduations au-dessus de 9 : 9 + 0,4 = 9,4.');
  });

  it('« Vue simple » joue l’item de référence en entier quand la scène remplace sa figure : aux Marais salants et aux Écluses', async () => {
    // La Pente graduée, niveau 1 : la phrase, la voix, l'indice, la correction et la figure de la référence ; la jauge reste.
    const items = await generated(decimals('scale', 1));
    const simple = placeItems('saltworks', decimals('scale', 1), items, undefined, true);
    for (const [i, p] of simple.entries()) {
      const { placeScene, ...rest } = p;
      expect(rest).toEqual(items[i]);
      expect(placeScene.kind).toBe('jauge');
    }
    // Les Nénuphars (le sas, l'échelle) et Deux rives (les deux sas, leurs barres d'origine) : de même.
    for (const id of ['maths-6e-fractions-number-line-1', 'maths-6e-fractions-number-line-2', 'maths-6e-fractions-equivalence-1']) {
      const def = (await loadExercise(id))!;
      const ref = (def.generate ? def.generate(`simple:${id}`) : def.items) as unknown as QuestionItem[];
      const scene = placeItems('ecluses', id, ref, fractionWords);
      const plain = placeItems('ecluses', id, ref, fractionWords, true);
      expect(plain.map((p) => p.placeScene)).toEqual(scene.map((p) => p.placeScene));
      for (const [i, p] of plain.entries()) {
        const { placeScene, ...rest } = p;
        if (sceneDrawsFigure(placeScene)) expect(rest, id).toEqual(ref[i]);
        else expect(p, id).toEqual(scene[i]);
      }
      expect(scene.some((p) => sceneDrawsFigure(p.placeScene)), id).toBe(true);
    }
    // Les autres missions ne changent pas : la scène ne remplace aucune figure.
    const other = await generated(decimals('operations', 1));
    expect(placeItems('saltworks', decimals('operations', 1), other, undefined, true)).toEqual(placeItems('saltworks', decimals('operations', 1), other));
  });

  it('toutes les autres missions, et la Pente graduée aux niveaux 2 et 3, gardent leurs items de référence, le bassin au repos', async () => {
    const ids = CATALOG.filter((d) => d.biome === 'maths-6e-decimals' && placeById('saltworks').scenes.some((m) => missionIs(d.id, m))).map((d) => d.id);
    expect(ids.length).toBeGreaterThanOrEqual(14);
    for (const id of ids.filter((x) => x !== decimals('scale', 1))) {
      const items = await generated(id);
      const placed = placeItems('saltworks', id, items);
      for (const [i, p] of placed.entries()) {
        expect(p.placeScene, id).toEqual(SALINE);
        const { placeScene: _scene, ...rest } = p;
        expect(rest, id).toEqual(items[i]);
      }
    }
  });

  it('une consigne de lieu pour la Pente graduée au niveau 1 seulement (contenu) ; les autres gardent la leur', () => {
    const jauge = { kind: 'jauge', start: 5, d: 10, n: 3 } as const;
    expect(placeInstruction('saltworks', decimals('scale', 1), 1, 'Référence.', jauge)).toBe(JAUGE_INSTRUCTION);
    // Avant le premier item aussi.
    expect(placeInstruction('saltworks', decimals('scale', 1), 1, 'Référence.')).toBe(JAUGE_INSTRUCTION);
    expect(placeInstruction('saltworks', decimals('scale', 1), 1, 'Référence.', SALINE)).toBe('Référence.');
    for (const [m, level] of [
      ['scale', 2],
      ['scale', 3],
      ['ordering', 1],
      ['operations', 2],
      ['large-numbers', 3],
      ['rounding-products', 2],
    ] as const)
      expect(placeInstruction('saltworks', decimals(m, level), level, 'Référence.', SALINE), `${m} ${level}`).toBe('Référence.');
    expect(JAUGE_INSTRUCTION).toBe('Sur la jauge, l’unité est coupée en dix : chaque graduation vaut un dixième. Lis le nombre où arrive l’eau.');
  });

  it('une scène de jauge se vérifie champ par champ', () => {
    expect(isItemScene(SALINE)).toBe(true);
    expect(isItemScene({ kind: 'jauge', start: 5, d: 10, n: 3 })).toBe(true);
    expect(isItemScene({ kind: 'jauge', start: 5, d: 10, n: 11 })).toBe(false);
    expect(isItemScene({ kind: 'jauge', start: 5, d: 0, n: 0 })).toBe(false);
  });

  it('chaque trace est la sienne, sur la grève plate, hors des chemins et du lieu ; la pompe à vent, la plus haute, seule à porter la couleur de ses ailes', () => {
    const c = placeById('saltworks').center;
    const y0 = standingHeight(heightAt(c));
    const missions = Object.keys(SALTWORKS_TRACE_SPOTS) as (keyof typeof SALTWORKS_TRACE_SPOTS)[];
    expect(missions.sort()).toEqual([...placeById('saltworks').scenes].sort());
    const traces = missions.map((m) => [m, placeTrace('saltworks', [m])] as const);
    expect(new Set(traces.map(([, f]) => f.triangles)).size).toBe(5);
    const boxes = traces.map(([, f]) => boundsOf(f));
    const near = networkSamples(0.25).filter((p) => Math.hypot(p.x - c.x, p.z - c.z) < 20);
    const model = boundsOf(modelOfPlace('saltworks').facets);
    for (const [k, [m]] of traces.entries()) {
      const b = boxes[k];
      const o = SALTWORKS_TRACE_SPOTS[m];
      // Sur la grève plate, au pied du lieu ; rien sous le sol ni dans l'eau.
      expect(standingHeight(heightAt({ x: c.x + o.x, z: c.z + o.z })), m).toBeCloseTo(y0, 3);
      expect(b.min[1], m).toBeGreaterThan(y0 - 0.5);
      for (const p of near) expect(p.x > b.min[0] - 0.8 && p.x < b.max[0] + 0.8 && p.z > b.min[2] - 0.8 && p.z < b.max[2] + 0.8, m).toBe(false);
      for (let j = k + 1; j < boxes.length; j++) {
        const d = boxes[j];
        expect(b.max[0] < d.min[0] || d.max[0] < b.min[0] || b.max[2] < d.min[2] || d.max[2] < b.min[2], `${m} / ${traces[j][0]}`).toBe(true);
      }
      // Autour de la grille des bassins et du hangar, jamais dessus (leurs emprises, murets compris, dans le repère du lieu).
      const local = { x0: b.min[0] - c.x, x1: b.max[0] - c.x, z0: b.min[2] - c.z, z1: b.max[2] - c.z };
      for (const [name, r] of [
        ['grille', { x0: -4.96, x1: 3.76, z0: -1.31, z1: 3.61 }],
        ['hangar', { x0: -4.2, x1: 3.0, z0: -5.5, z1: -2.7 }],
      ] as const)
        expect(local.x1 < r.x0 || local.x0 > r.x1 || local.z1 < r.z0 || local.z0 > r.z1, `${m} / ${name}`).toBe(true);
    }
    const tops = traces.map(([m, f]) => [m, boundsOf(f).max[1]] as const);
    const pump = tops.find(([m]) => m === 'scale')![1];
    for (const [m, top] of tops) if (m !== 'scale') expect(top, m).toBeLessThan(pump - 2);
    expect(pump).toBeGreaterThan(model.max[1]);
    // Les ailes : la seule couleur que la vue fait tourner (scene.ts, `unshadedLamp`), autour du moyeu.
    const vane = linearRgb(SALT_PUMP.vane);
    const vaneVertices = (f: ReturnType<typeof placeTrace>) => {
      const out: number[] = [];
      for (let i = 0; i < f.colors.length; i += 3) if ([0, 1, 2].every((k) => Math.abs(f.colors[i + k] - vane[k]) < 0.004)) out.push(i);
      return out;
    };
    const hub = saltPumpHub();
    const blades = traces.find(([m]) => m === 'scale')![1];
    const on = vaneVertices(blades);
    expect(on.length).toBe(4 * 4 * 3);
    for (const i of on) expect(Math.hypot(blades.positions[i] - hub.x, blades.positions[i + 1] - hub.y)).toBeLessThanOrEqual(SALT_PUMP.blade + 0.35);
    for (const [m, f] of traces) if (m !== 'scale') expect(vaneVertices(f), m).toEqual([]);
    for (const p of PLACES) {
      expect(vaneVertices(modelOfPlace(p.id).facets), p.id).toEqual([]);
      if (p.id !== 'saltworks') expect(vaneVertices(placeTrace(p.id, p.scenes)), p.id).toEqual([]);
    }
  });
});

describe('La Turbine (GD-20, point 8, lot L6a)', () => {
  const ids = CATALOG.filter((d) => d.biome === 'physics-chemistry-6e-matter-energy').map((d) => d.id);
  const colorVertices = (f: { colors: Float32Array }, color: number) => {
    const rgb = linearRgb(color);
    const out: number[] = [];
    for (let i = 0; i < f.colors.length; i += 3) if ([0, 1, 2].every((k) => Math.abs(f.colors[i + k] - rgb[k]) < 0.004)) out.push(i);
    return out;
  };

  it('ses quatre missions, aux deux niveaux, sur le décor neutre : les items de référence tels quels, les réponses sur la rangée (GD-26)', () => {
    expect(ids.length).toBe(8);
    expect(isItemScene(COLUMN)).toBe(true);
    for (const id of ids) {
      const items = reference(id).items;
      const placed = placeItems('engine', id, items);
      expect(placed.map((it) => it.key), id).toEqual(items.map((it) => it.key));
      for (const it of placed) {
        expect(it.placeScene, it.key).toEqual(COLUMN);
        const ref = items.find((r) => r.key === it.key)!;
        expect([it.prompt, it.answer, it.choices], it.key).toEqual([ref.prompt, ref.answer, ref.choices]);
      }
      // La consigne de référence.
      expect(placeInstruction('engine', id, 1, 'Référence.', COLUMN), id).toBe('Référence.');
    }
  });

  it('chaque trace est la sienne, sur le replat, hors des chemins et l’une hors de l’autre ; aucune plus haute que le rotor', () => {
    const c = placeById('engine').center;
    const missions = Object.keys(ENGINE_TRACE_SPOTS) as (keyof typeof ENGINE_TRACE_SPOTS)[];
    expect([...missions].sort()).toEqual([...placeById('engine').scenes].sort());
    const traces = missions.map((m) => [m, placeTrace('engine', [m])] as const);
    expect(new Set(traces.map(([, f]) => f.triangles)).size).toBe(4);
    const boxes = traces.map(([, f]) => boundsOf(f));
    const near = networkSamples(0.25).filter((p) => Math.hypot(p.x - c.x, p.z - c.z) < 20);
    const rotorTop = engineRotorHub().y + ENGINE.rotor.crown;
    for (const [k, [m]] of traces.entries()) {
      const b = boxes[k];
      expect(b.min[1], m).toBeGreaterThan(standingHeight(heightAt(c)) - 0.5);
      expect(b.max[1], m).toBeLessThan(rotorTop);
      for (const p of near) expect(p.x > b.min[0] - 0.6 && p.x < b.max[0] + 0.6 && p.z > b.min[2] - 0.6 && p.z < b.max[2] + 0.6, m).toBe(false);
      for (let j = k + 1; j < boxes.length; j++) {
        const d = boxes[j];
        expect(b.max[0] < d.min[0] || d.max[0] < b.min[0] || b.max[2] < d.min[2] || d.max[2] < b.min[2], `${m} / ${traces[j][0]}`).toBe(true);
      }
    }
    // La citerne d'États et mélanges, la plus haute des quatre.
    const tops = traces.map(([m, f]) => [m, boundsOf(f).max[1]] as const);
    const tank = tops.find(([m]) => m === 'states-of-matter')![1];
    for (const [m, top] of tops) if (m !== 'states-of-matter') expect(top, m).toBeLessThan(tank);
  });

  it('le rotor et la vapeur portent des couleurs que rien d’autre ne prend : la vue fait tourner l’un, éclaire l’autre sans ombre', () => {
    const model = modelOfPlace('engine').facets;
    const rotor = ENGINE_ROTOR_COLORS.flatMap((color) => colorVertices(model, color));
    for (const color of ENGINE_ROTOR_COLORS) expect(colorVertices(model, color).length, color.toString(16)).toBeGreaterThan(0);
    // La maquette est dans le repère du lieu ; le moyeu, dans le monde (`engineRotorHub`) : le même, à la hauteur du sol près.
    const hub = engineRotorHub();
    const c = placeById('engine').center;
    expect(hub.x - c.x).toBeCloseTo(ENGINE.rotor.x, 9);
    expect(hub.z - c.z).toBeCloseTo(ENGINE.rotor.z, 9);
    for (const i of rotor) expect(Math.hypot(model.positions[i] - ENGINE.rotor.x, model.positions[i + 1] - ENGINE.rotor.y)).toBeLessThanOrEqual(ENGINE.rotor.crown + 1e-6);
    for (const color of STEAM_COLORS) expect(colorVertices(model, color).length).toBeGreaterThan(0);
    for (const p of PLACES) {
      const traces = placeTrace(p.id, p.scenes);
      for (const color of [...ENGINE_ROTOR_COLORS, ...STEAM_COLORS]) {
        expect(colorVertices(traces, color), `${p.id} ${color.toString(16)}`).toEqual([]);
        if (p.id !== 'engine') expect(colorVertices(modelOfPlace(p.id).facets, color), `${p.id} ${color.toString(16)}`).toEqual([]);
      }
    }
    // La ruine ne tourne pas : son rotor couché n'a pas les teintes du rotor.
    for (const color of ENGINE_ROTOR_COLORS) expect(colorVertices(ruinOf('engine'), color)).toEqual([]);
  });

  it('le rotor, jamais une lame de scie : une couronne pleine ferme le cercle, rien ne dépasse de son bord ni de son épaisseur, les aubes en relief sur la face (relecture de L6a)', () => {
    const R = ENGINE.rotor;
    const model = modelOfPlace('engine').facets;
    const [disc, rim] = ENGINE_ROTOR_COLORS.map((color) => colorVertices(model, color));
    const at = (i: number) => ({ r: Math.hypot(model.positions[i] - R.x, model.positions[i + 1] - R.y), a: Math.atan2(model.positions[i + 1] - R.y, model.positions[i] - R.x), z: model.positions[i + 2] - R.z });
    // Rien ne dépasse : ni du bord de la couronne, ni de son épaisseur, devant comme derrière.
    for (const i of [...disc, ...rim]) {
      const v = at(i);
      expect(v.r).toBeLessThanOrEqual(R.crown + 1e-6);
      expect(Math.abs(v.z)).toBeLessThanOrEqual(R.crownDepth / 2 + 1e-6);
    }
    // La couronne fait tout le tour : son bord, sur seize angles réguliers.
    const edge = new Set(rim.map(at).filter((v) => Math.abs(v.r - R.crown) < 1e-4).map((v) => Math.round(((v.a + 2 * Math.PI) % (2 * Math.PI)) / ((2 * Math.PI) / 16)) % 16));
    expect(edge.size).toBe(16);
    // Les aubes : sur la face au sud, devant le disque, sous la couronne (jamais au-delà de son rayon intérieur).
    const front = rim.map(at).filter((v) => v.z > R.depth / 2 + 1e-6 && v.z < R.crownDepth / 2 - 1e-6 && v.r > R.hub + 0.01);
    expect(front.length).toBeGreaterThan(0);
    for (const v of front) {
      expect(v.r).toBeGreaterThanOrEqual(R.bladeFoot - 1e-6);
      expect(v.z).toBeLessThanOrEqual(R.depth / 2 + R.relief + 1e-6);
    }
    // Seize aubes, chacune son pied (deux coins) à `bladeFoot` du moyeu.
    expect(new Set(front.filter((v) => Math.abs(v.r - R.bladeFoot) < 1e-4).map((v) => v.a.toFixed(3))).size).toBe(2 * R.blades);
  });

  it('la source : trois cercles fins, concentriques et pleins, sur une eau claire, sans secteurs ni centre sombre (relecture de L6a)', () => {
    const S = ENGINE.spring;
    const model = modelOfPlace('engine').facets;
    const water = linearRgb(0x8fcfc3);
    const ring = linearRgb(0xbfe6dd);
    const sames = (k: number, rgb: number[]) => [0, 1, 2].every((j) => Math.abs(model.colors[k + j] - rgb[j]) < 1e-6);
    const rings: { r: number; a: number }[] = [];
    for (let k = 0; k < model.positions.length; k += 3) {
      const r = Math.hypot(model.positions[k] - S.x, model.positions[k + 2] - S.z);
      // Dans la margelle, au-dessus de la pierre : rien que l'eau et ses cercles, jamais une teinte sombre.
      if (r < S.r - 0.25 && model.positions[k + 1] > 0.325) expect(sames(k, water) || sames(k, ring), `${r.toFixed(2)}`).toBe(true);
      if (sames(k, ring)) rings.push({ r, a: Math.atan2(model.positions[k + 2] - S.z, model.positions[k] - S.x) });
    }
    for (const r0 of S.rings) {
      const on = rings.filter((v) => Math.abs(v.r - r0) <= S.ring / 2 + 1e-6);
      // Plein sur tout son tour : seize angles.
      expect(new Set(on.map((v) => Math.round(((v.a + 2 * Math.PI) % (2 * Math.PI)) / (Math.PI / 8)) % 16)).size, `${r0}`).toBe(16);
    }
    // Ni cercle au milieu ni secteur : chaque sommet d'un cercle est sur l'un des trois.
    for (const v of rings) expect(S.rings.some((r0) => Math.abs(v.r - r0) <= S.ring / 2 + 1e-6)).toBe(true);
  });

  it('la rigole descend sur le sol dessiné jusqu’à la berge, puis se déverse dans la rivière : jamais en l’air au-dessus de l’eau (relecture de L6a)', () => {
    const { points, water, spill } = engineRill();
    const c = placeById('engine').center;
    const h0 = standingHeight(heightAt(c));
    const field = buildHeightField();
    const z = c.z + ENGINE.spring.z;
    // D'est en ouest, de la source à la berge, posée sur le sol (au-dessus, à moins d'un pouce), sur la terre ferme.
    for (const [k, p] of points.slice(0, -1).entries()) {
      for (const dz of [-0.4, 0, 0.4]) expect(p.y + h0, `${k}`).toBeGreaterThanOrEqual(heightOnMesh(field, c.x + p.x, z + dz) - 1e-6);
      expect(p.y + h0 - heightOnMesh(field, c.x + p.x, z), `${k}`).toBeLessThan(0.3);
      expect(heightOnMesh(field, c.x + p.x, z), `${k}`).toBeGreaterThan(water + h0);
      if (k > 0) expect(p.x).toBeLessThan(points[k - 1].x);
    }
    expect(points[0].x).toBeGreaterThan(ENGINE.spring.x - ENGINE.spring.r);
    // La chute finit à fleur d'eau ; la nappe est sur la rivière.
    const end = points.at(-1)!;
    expect(end.y - water).toBeGreaterThan(0);
    expect(end.y - water).toBeLessThan(0.05);
    expect(landDistance({ x: c.x + spill.x, z })).toBeLessThan(0);
    expect(heightOnMesh(field, c.x + spill.x, z)).toBeLessThan(0);
  });

  it('les planches vers la Turbine : du bois neuf sur des pieux, au-dessus de la rivière, toujours là (GD-20, point 3, « vraies terres » : aucun verrou dans une terre)', () => {
    const field = buildHeightField();
    const ground = (x: number, z: number) => heightOnMesh(field, x, z);
    expect(PLANK_BRIDGES).toEqual([
      ['tur-1', 'tur-2'],
      ['lar-4', 'lar-5'],
    ]);
    const of = (f: { colors: ArrayLike<number>; positions: ArrayLike<number> }, color: number) => {
      const rgb = linearRgb(color);
      const out: (readonly [number, number, number])[] = [];
      for (let i = 0; i < f.colors.length; i += 3) if ([0, 1, 2].every((k) => Math.abs(f.colors[i + k] - rgb[k]) < 1e-6)) out.push([f.positions[i], f.positions[i + 1], f.positions[i + 2]]);
      return out;
    };
    const paths = pathRibbons(ground);
    const a = pathNode('tur-1').at;
    const c = pathNode('tur-2').at;
    const near = (p: readonly [number, number, number]) => Math.hypot(p[0] - (a.x + c.x) / 2, p[2] - (a.z + c.z) / 2) < distance(a, c) / 2 + 1;
    // Les pieux plantés dans la rivière, leur tête au-dessus des planches ; le dessus des planches et les traverses.
    const posts = of(paths, 0x7a5636).filter(near);
    expect(posts.length).toBeGreaterThan(0);
    expect(Math.min(...posts.map((p) => p[1]))).toBeLessThan(-1);
    expect(of(paths, NEW_WOOD.top).filter(near).length).toBeGreaterThan(0);
    expect(of(paths, NEW_WOOD.beam).filter(near).length).toBeGreaterThan(0);
  });

  it('le cadran solaire : un style de cuivre fin, jamais une plaque de fer pleine (relecture de L6a)', () => {
    const f = placeTrace('engine', ['materials-light']);
    expect(colorVertices(f, 0x2f3e48)).toEqual([]);
    expect(colorVertices(f, 0xc07a3e).length).toBeGreaterThan(0);
  });
});

describe('Le Chantier naval (GD-20, point 8, lot L6b)', () => {
  const ids = CATALOG.filter((d) => d.biome === 'technology-6e-objects').map((d) => d.id);
  const c = placeById('shipyard').center;
  const y0 = standingHeight(heightAt(c));

  it('ses quatre missions, aux deux niveaux, sur le décor neutre : les items de référence tels quels, les réponses sur la rangée (GD-26)', () => {
    expect(ids.length).toBe(8);
    for (const id of ids) {
      const items = reference(id).items;
      const placed = placeItems('shipyard', id, items);
      expect(placed.map((it) => it.key), id).toEqual(items.map((it) => it.key));
      for (const it of placed) {
        expect(it.placeScene, it.key).toEqual(COLUMN);
        const ref = items.find((r) => r.key === it.key)!;
        expect([it.prompt, it.answer, it.choices], it.key).toEqual([ref.prompt, ref.answer, ref.choices]);
      }
      expect(placeInstruction('shipyard', id, 1, 'Référence.', COLUMN), id).toBe('Référence.');
    }
  });

  it('chaque trace est la sienne, hors des chemins et l’une hors de l’autre ; toutes sous le plat-bord de la coque', () => {
    const missions = Object.keys(SHIPYARD_TRACE_SPOTS) as (keyof typeof SHIPYARD_TRACE_SPOTS)[];
    expect([...missions].sort()).toEqual([...placeById('shipyard').scenes].sort());
    const traces = missions.map((m) => [m, placeTrace('shipyard', [m])] as const);
    expect(new Set(traces.map(([, f]) => f.triangles)).size).toBe(4);
    const boxes = traces.map(([, f]) => boundsOf(f));
    const near = networkSamples(0.25).filter((p) => Math.hypot(p.x - c.x, p.z - c.z) < 20);
    // Le plat-bord au plus bas, sur la partie droite de la coque.
    const sheer = y0 + Math.min(...[0.16, 0.4, 0.7, 1].map((t) => hullEdge(t, 4, 1)[1]));
    for (const [k, [m]] of traces.entries()) {
      const b = boxes[k];
      expect(b.max[1], m).toBeLessThan(sheer);
      // Au sol, sauf le capteur de marée, dans l'eau.
      if (m !== 'information-networks') expect(b.min[1], m).toBeGreaterThan(y0 - 0.5);
      for (const p of near) expect(p.x > b.min[0] - 0.6 && p.x < b.max[0] + 0.6 && p.z > b.min[2] - 0.6 && p.z < b.max[2] + 0.6, m).toBe(false);
      for (let j = k + 1; j < boxes.length; j++) {
        const d = boxes[j];
        expect(b.max[0] < d.min[0] || d.max[0] < b.min[0] || b.max[2] < d.min[2] || d.max[2] < b.min[2], `${m} / ${traces[j][0]}`).toBe(true);
      }
    }
  });

  it('aucune trace sur le chemin de sable de la porte à l’atelier ; le gouvernail devant l’étrave, en vue depuis la porte (relecture de L6b)', () => {
    const at = pathNode(placeById('shipyard').door).at;
    const door = { x: at.x - c.x, z: at.z - c.z };
    const foot = { x: SHIPYARD.shop.x, z: SHIPYARD.shop.z + SHIPYARD.shop.d / 2 + 0.5 };
    expect(Number.isFinite(door.x) && Number.isFinite(door.z)).toBe(true);
    for (const m of placeById('shipyard').scenes) {
      const b = boundsOf(placeTrace('shipyard', [m]));
      for (let k = 0; k <= 40; k++) {
        const p = { x: c.x + door.x + ((foot.x - door.x) * k) / 40, z: c.z + door.z + ((foot.z - door.z) * k) / 40 };
        expect(p.x > b.min[0] - 0.6 && p.x < b.max[0] + 0.6 && p.z > b.min[2] - 0.6 && p.z < b.max[2] + 0.6, m).toBe(false);
      }
    }
    // Le gouvernail au sud de l'étrave (entre elle et la porte), plus long que l'écart de ses tréteaux.
    const rudder = boundsOf(placeTrace('shipyard', ['object-function']));
    expect(rudder.min[2]).toBeGreaterThan(c.z + hullPoint(0, 0, 0)[2]);
    expect(rudder.max[0] - rudder.min[0]).toBeGreaterThan(2.4);
  });

  it('le capteur de marée se tient dans l’eau, au bout du ponton ; le câble du treuil va jusqu’à l’étrave', () => {
    const o = SHIPYARD_TRACE_SPOTS['information-networks'];
    expect(heightAt({ x: c.x + o.x, z: c.z + o.z })).toBeLessThan(0);
    const well = boundsOf(placeTrace('shipyard', ['information-networks']));
    expect(well.min[1]).toBeLessThan(0);
    expect(well.max[1]).toBeGreaterThan(0);
    const winch = boundsOf(placeTrace('shipyard', ['solve-program']));
    const [sx, , sz] = hullPoint(0.02, 0, 0);
    const stem = { x: c.x + sx, z: c.z + sz };
    expect(stem.x >= winch.min[0] - 1e-3 && stem.x <= winch.max[0] + 1e-3 && stem.z >= winch.min[2] - 1e-3 && stem.z <= winch.max[2] + 1e-3).toBe(true);
  });

  it('la cale descend de son replat jusque sous l’eau', () => {
    const rails = slipRails();
    expect(rails.length).toBeGreaterThan(2);
    for (let k = 1; k < rails.length; k++) expect(rails[k].y).toBeLessThanOrEqual(rails[k - 1].y + 1e-6);
    expect(y0 + rails[0].y).toBeGreaterThan(0);
    expect(y0 + rails[rails.length - 1].y).toBeLessThan(0);
  });
});

describe('La Mangrove (GD-20, point 8, lot L8a)', () => {
  const ids = CATALOG.filter((d) => d.biome === 'life-earth-sciences-6e-living-world').map((d) => d.id);
  const colorVertices = (f: { colors: Float32Array }, color: number) => {
    const rgb = linearRgb(color);
    const out: number[] = [];
    for (let i = 0; i < f.colors.length; i += 3) if ([0, 1, 2].every((k) => Math.abs(f.colors[i + k] - rgb[k]) < 1e-6)) out.push(i);
    return out;
  };

  it('ses quatre missions, aux deux niveaux, sur le décor neutre : les items de référence tels quels, les réponses sur la rangée (GD-26)', () => {
    expect(ids.length).toBe(8);
    for (const id of ids) {
      const items = reference(id).items;
      const placed = placeItems('mangrove', id, items);
      expect(placed.map((it) => it.key), id).toEqual(items.map((it) => it.key));
      for (const it of placed) {
        expect(it.placeScene, it.key).toEqual(COLUMN);
        const ref = items.find((r) => r.key === it.key)!;
        expect([it.prompt, it.answer, it.choices], it.key).toEqual([ref.prompt, ref.answer, ref.choices]);
      }
      expect(placeInstruction('mangrove', id, 1, 'Référence.', COLUMN), id).toBe('Référence.');
    }
  });

  it('chaque trace est la sienne, hors des chemins et l’une hors de l’autre ; aucune plus haute que le carbet, aucune dans l’eau sans pieux', () => {
    const c = placeById('mangrove').center;
    const missions = Object.keys(MANGROVE_TRACE_SPOTS) as (keyof typeof MANGROVE_TRACE_SPOTS)[];
    expect([...missions].sort()).toEqual([...placeById('mangrove').scenes].sort());
    const traces = missions.map((m) => [m, placeTrace('mangrove', [m])] as const);
    expect(new Set(traces.map(([, f]) => f.triangles)).size).toBe(4);
    const boxes = traces.map(([, f]) => boundsOf(f));
    const near = networkSamples(0.25).filter((p) => Math.hypot(p.x - c.x, p.z - c.z) < 20);
    const h0 = standingHeight(heightAt(c));
    const roof = h0 + mangroveCarbetFloor() + MANGROVE.carbet.posts + MANGROVE.carbet.roof;
    for (const [k, [m]] of traces.entries()) {
      const b = boxes[k];
      expect(b.max[1], m).toBeLessThan(roof);
      for (const p of near) expect(p.x > b.min[0] - 0.6 && p.x < b.max[0] + 0.6 && p.z > b.min[2] - 0.6 && p.z < b.max[2] + 0.6, m).toBe(false);
      for (let j = k + 1; j < boxes.length; j++) {
        const d = boxes[j];
        expect(b.max[0] < d.min[0] || d.max[0] < b.min[0] || b.max[2] < d.min[2] || d.max[2] < b.min[2], `${m} / ${traces[j][0]}`).toBe(true);
      }
    }
    // La pépinière : quatre godets, tous pareils (jamais trois : le contenu en fait un document).
    const pots = colorVertices(placeTrace('mangrove', ['food-growth']), 0xb07a52);
    expect(pots.length).toBe(4 * 18 * 3);
  });

  it('la pirogue, l’objet témoin : au repos sur l’eau derrière le platelage ; après une bonne réponse, elle glisse droit vers lui, s’arrête encore visible, et reste', () => {
    const before = itemScene('mangrove', COLUMN, false, []);
    expect(before.reaction).toBeNull();
    expect(before.labels).toEqual([]);
    expect(before.still.triangles).toBeGreaterThan(10);
    const after = itemScene('mangrove', COLUMN, true, []);
    // Elle n'est plus dans ce qui reste en place : c'est elle qui bouge, sans arc ni roulis, et elle reste.
    expect(after.still.triangles).toBe(0);
    expect(after.reaction).toMatchObject({ arc: 0, stay: true });
    const { from, to } = after.reaction!;
    expect(from).toEqual(pirogueRest());
    expect([to.x, to.y]).toEqual([from.x, from.y]);
    expect(to.z - from.z).toBeCloseTo(PIROGUE.glide, 9);
    // Au repos, sa coque au même endroit que celle qui glisse, sur l'eau du lagon, au milieu de la scène.
    expect(boundsOf(before.still)).toEqual(boundsOf(placeFacets(after.reaction!.facets, from)));
    const o = sceneSpot('mangrove');
    expect(Math.abs(from.x - o.x)).toBeLessThan(1e-9);
    const hull = boundsOf(placeFacets(after.reaction!.facets, to));
    for (const x of [hull.min[0], hull.max[0]]) for (const z of [hull.min[2], hull.max[2]]) expect(landDistance({ x, z }), `${x}, ${z}`).toBeLessThan(0);
    // Elle s'arrête à un peu plus d'une unité du bord du platelage de la scène : sous la caméra de la scénette (28°),
    // son plat-bord passe encore au-dessus du bord du platelage, plus haut qu'elle.
    const edge = o.z - MANGROVE.deck.d / 2 - 0.1;
    expect(edge - hull.max[2]).toBeCloseTo(PIROGUE.rest - PIROGUE.glide, 4);
    const drop = mangroveDeckTop() + standingHeight(heightAt(placeById('mangrove').center)) - PIROGUE.rim;
    expect((edge - hull.max[2]) * Math.tan((28 * Math.PI) / 180)).toBeGreaterThan(drop);
    // Ni animal ni pagayeur : rien que la coque et son intérieur.
    expect(new Set(Array.from({ length: after.reaction!.facets.colors.length / 3 }, (_, i) => after.reaction!.facets.colors.slice(3 * i, 3 * i + 3).join(','))).size).toBe(2);
  });

  it('les palétuviers dans l’eau ou au bord, sous le toit du carbet ; la passerelle en coude sur l’eau', () => {
    const c = placeById('mangrove').center;
    const model = modelOfPlace('mangrove');
    expect(model.top).toBeCloseTo(mangroveCarbetFloor() + MANGROVE.carbet.posts + MANGROVE.carbet.roof, 6);
    for (const [x, z] of MANGROVE.trees) expect(landDistance({ x: c.x + x, z: c.z + z }), `${x}, ${z}`).toBeLessThan(1);
    for (const p of [MANGROVE.walk.knee, MANGROVE.walk.end, MANGROVE.carbet]) expect(landDistance({ x: c.x + p.x, z: c.z + p.z })).toBeLessThan(0);
    // Le feuillage, plus haut que tout sauf le carbet.
    const leaves = colorVertices(model.facets, 0x2e6e4e).map((i) => model.facets.positions[i + 1]);
    expect(Math.max(...leaves)).toBeLessThan(model.top - 0.3);
  });
});

describe('Les Ruines (GD-20, point 8, lot L8b)', () => {
  const ids = CATALOG.filter((d) => d.biome === 'history-6e-antiquity').map((d) => d.id);
  const colorVertices = (f: { colors: Float32Array; positions: Float32Array }, color: number) => {
    const rgb = linearRgb(color);
    const out: [number, number, number][] = [];
    for (let i = 0; i < f.colors.length; i += 3) if ([0, 1, 2].every((k) => Math.abs(f.colors[i + k] - rgb[k]) < 1e-6)) out.push([f.positions[i], f.positions[i + 1], f.positions[i + 2]]);
    return out;
  };

  it('ses quatre missions, aux deux niveaux, sur le décor neutre : les items de référence tels quels, les réponses sur la rangée (GD-26)', () => {
    expect(ids.length).toBe(8);
    for (const id of ids) {
      const items = reference(id).items;
      const placed = placeItems('ruins', id, items);
      expect(placed.map((it) => it.key), id).toEqual(items.map((it) => it.key));
      for (const it of placed) {
        expect(it.placeScene, it.key).toEqual(COLUMN);
        const ref = items.find((r) => r.key === it.key)!;
        expect([it.prompt, it.answer, it.choices], it.key).toEqual([ref.prompt, ref.answer, ref.choices]);
      }
      expect(placeInstruction('ruins', id, 1, 'Référence.', COLUMN), id).toBe('Référence.');
    }
  });

  it('l’arcade : quatre arcs surbaissés (plus larges que hauts), de face au sud, ses piles ouest sur la terre, ses piles est dans l’eau ; la corniche, le plus haut point', () => {
    const c = placeById('ruins').center;
    const A = RUINS.arcade;
    const half = (A.piles[1] - A.piles[0]) / 2 - A.pile / 2;
    // Une anse de panier : la montée de l'arc bien plus petite que sa demi-ouverture (un plein cintre les égalerait).
    expect(A.rise).toBeLessThan(0.6 * half);
    expect(A.piles.length).toBe(5);
    expect(landDistance({ x: c.x + A.piles[0], z: c.z + A.z })).toBeGreaterThan(0);
    expect(landDistance({ x: c.x + A.piles[1], z: c.z + A.z })).toBeGreaterThan(0);
    expect(landDistance({ x: c.x + A.piles[3], z: c.z + A.z })).toBeLessThan(0);
    expect(landDistance({ x: c.x + A.piles[4], z: c.z + A.z })).toBeLessThan(0);
    const model = modelOfPlace('ruins');
    expect(model.top).toBeCloseTo(ruinsTop(), 6);
    // Une seule clé ornée (relecture DA de L8 : jamais une rangée de signes), celle de l'arc le plus près de l'axe de la
    // scénette (la pile 1) : sa vague de bronze, une incrustation en six pans sur la face sud, sur toute la largeur de
    // la clé.
    const bronze = colorVertices(model.facets, 0x9c7a3c);
    expect(bronze.length).toBe(6 * 6);
    for (const v of bronze) expect(v[2]).toBeGreaterThan(A.z + A.depth / 2);
    const centers = A.piles.slice(0, -1).map((p, k) => (p + A.piles[k + 1]) / 2);
    const axis = sceneSpot('ruins').x - c.x;
    const nearest = Math.min(...centers.map((x) => Math.abs(x - axis)));
    expect(Math.abs(centers[RUINS_ORNATE_ARCH] - axis)).toBeCloseTo(nearest, 6);
    const xs = bronze.map((v) => v[0]);
    expect(Math.min(...xs)).toBeLessThan(centers[RUINS_ORNATE_ARCH] - 0.25);
    expect(Math.max(...xs)).toBeGreaterThan(centers[RUINS_ORNATE_ARCH] + 0.25);
    // Les dalles noyées : un aplat juste au-dessus de l'eau, dans l'eau, devant l'arcade ; cinq (relecture DA de L8 :
    // les trois premières ne se voyaient pas), une face chacune, jamais une tranche.
    const drowned = colorVertices(ruinOf('ruins'), 0xa8d4c0);
    expect(drowned.length).toBe(5 * 6);
    const water = -standingHeight(heightAt(c));
    for (const v of drowned) {
      expect(v[1]).toBeCloseTo(water + 0.06, 4);
      expect(v[2]).toBeGreaterThan(A.z);
      expect(landDistance({ x: c.x + v[0], z: c.z + v[2] })).toBeLessThan(0);
    }
  });

  it('chaque trace est la sienne, hors des chemins et l’une hors de l’autre ; aucune plus haute que la corniche', () => {
    const c = placeById('ruins').center;
    const missions = Object.keys(RUINS_TRACE_SPOTS) as (keyof typeof RUINS_TRACE_SPOTS)[];
    expect([...missions].sort()).toEqual([...placeById('ruins').scenes].sort());
    const traces = missions.map((m) => [m, placeTrace('ruins', [m])] as const);
    expect(new Set(traces.map(([, f]) => f.triangles)).size).toBe(4);
    const boxes = traces.map(([, f]) => boundsOf(f));
    const near = networkSamples(0.25).filter((p) => Math.hypot(p.x - c.x, p.z - c.z) < 20);
    const roof = standingHeight(heightAt(c)) + ruinsTop();
    for (const [k, [m]] of traces.entries()) {
      const b = boxes[k];
      expect(b.max[1], m).toBeLessThan(roof);
      for (const p of near) expect(p.x > b.min[0] - 0.6 && p.x < b.max[0] + 0.6 && p.z > b.min[2] - 0.6 && p.z < b.max[2] + 0.6, m).toBe(false);
      for (let j = k + 1; j < boxes.length; j++) {
        const d = boxes[j];
        expect(b.max[0] < d.min[0] || d.max[0] < b.min[0] || b.max[2] < d.min[2] || d.max[2] < b.min[2], `${m} / ${traces[j][0]}`).toBe(true);
      }
    }
    // La stèle : debout, plus haute que large, et la seule vague de bronze des traces, la même incrustation que sur la
    // clé ornée, sur toute la largeur de sa face.
    const stele = boxes[missions.indexOf('viewpoints')];
    expect(stele.max[1] - stele.min[1]).toBeGreaterThan(2 * (stele.max[0] - stele.min[0]));
    const inlay = colorVertices(placeTrace('ruins', ['viewpoints']), 0x9c7a3c).map((v) => v[0]);
    expect(Math.max(...inlay) - Math.min(...inlay)).toBeCloseTo(0.44, 4);
    for (const m of missions) expect(colorVertices(placeTrace('ruins', [m]), 0x9c7a3c).length > 0, m).toBe(m === 'viewpoints');
  });

  it('le treuil de fouille, l’objet témoin : le seau au fond de la fosse, son bord seul visible ; après une bonne réponse, il remonte et se pose sur la planche, et reste', () => {
    const before = itemScene('ruins', COLUMN, false, []);
    expect(before.reaction).toBeNull();
    expect(before.labels).toEqual([]);
    const after = itemScene('ruins', COLUMN, true, []);
    expect(after.reaction).toMatchObject({ arc: DIG_WINCH.arc, stay: true });
    const { pit, board } = digBucketSpots();
    expect(after.reaction!.from).toEqual(pit);
    expect(after.reaction!.to).toEqual(board);
    // Au fond, seul son haut dépasse du dallage ; posé, il est sur la planche, au bord de la fosse.
    const floor = sceneSpot('ruins').y + 0.12;
    expect(pit.y + DIG_WINCH.bucket).toBeCloseTo(floor + 0.03, 6);
    expect(board.y).toBeCloseTo(floor + 0.05, 6);
    expect(board.x - pit.x).toBeGreaterThan(DIG_WINCH.pit);
    // Au plus haut de son geste, il est remonté d'environ 0,8.
    const peak = (pit.y + board.y) / 2 + DIG_WINCH.arc - pit.y;
    expect(peak).toBeGreaterThan(0.7);
    expect(peak).toBeLessThan(0.95);
    // Le seau quitte ce qui reste en place : le trépied et la fosse y restent, sans lui.
    expect(after.still.triangles).toBe(before.still.triangles - after.reaction!.facets.triangles);
    // Son dessus : du sable, rien d'autre (ni objet ni os).
    expect(new Set(Array.from({ length: after.reaction!.facets.colors.length / 3 }, (_, i) => after.reaction!.facets.colors.slice(3 * i, 3 * i + 3).join(','))).size).toBe(3);
  });
});

describe('L’Observatoire (GD-20, point 8, lot L8c)', () => {
  const ids = CATALOG.filter((d) => d.biome === 'geography-6e-living').map((d) => d.id);

  it('ses trois missions, aux deux niveaux, sur le décor neutre : les items de référence tels quels, les réponses sur la rangée (GD-26)', () => {
    expect(ids.length).toBe(placeById('observatory').scenes.length * 2);
    for (const id of ids) {
      const items = reference(id).items;
      const placed = placeItems('observatory', id, items);
      expect(placed.map((it) => it.key), id).toEqual(items.map((it) => it.key));
      for (const it of placed) {
        expect(it.placeScene, it.key).toEqual(COLUMN);
        const ref = items.find((r) => r.key === it.key)!;
        expect([it.prompt, it.answer, it.choices], it.key).toEqual([ref.prompt, ref.answer, ref.choices]);
      }
      expect(placeInstruction('observatory', id, 1, 'Référence.', COLUMN), id).toBe('Référence.');
    }
  });

  it('chaque trace est la sienne, sur la terrasse ou au pied de son escalier, hors des chemins et l’une hors de l’autre ; aucune plus haute que le tambour', () => {
    const c = placeById('observatory').center;
    const y0 = standingHeight(heightAt(c));
    const missions = Object.keys(OBSERVATORY_TRACE_SPOTS) as (keyof typeof OBSERVATORY_TRACE_SPOTS)[];
    expect([...missions].sort()).toEqual([...placeById('observatory').scenes].sort());
    const traces = missions.map((m) => [m, placeTrace('observatory', [m])] as const);
    expect(new Set(traces.map(([, f]) => f.triangles)).size).toBe(3);
    const boxes = traces.map(([, f]) => boundsOf(f));
    const near = networkSamples(0.25).filter((p) => Math.hypot(p.x - c.x, p.z - c.z) < 20);
    // Le cadre de la scénette, au sud du tambour (les traces s'y cachent de toute façon pendant une question).
    const scene = sceneSpot('observatory');
    for (const [k, [m]] of traces.entries()) {
      const b = boxes[k];
      expect(b.min[1], m).toBeGreaterThan(y0 - 0.8);
      expect(b.max[1], m).toBeLessThan(y0 + OBSERVATORY.drum.top);
      for (const p of near) expect(p.x > b.min[0] - 0.6 && p.x < b.max[0] + 0.6 && p.z > b.min[2] - 0.6 && p.z < b.max[2] + 0.6, m).toBe(false);
      expect(b.max[0] < scene.x - 3.7 || b.min[0] > scene.x + 3.7 || b.max[2] < scene.z - 1.6, m).toBe(true);
      for (let j = k + 1; j < boxes.length; j++) {
        const d = boxes[j];
        expect(b.max[0] < d.min[0] || d.max[0] < b.min[0] || b.max[2] < d.min[2] || d.max[2] < b.min[2], `${m} / ${traces[j][0]}`).toBe(true);
      }
      // Hors du tambour et de la table d'orientation.
      expect(Math.hypot((b.min[0] + b.max[0]) / 2 - c.x, (b.min[2] + b.max[2]) / 2 - c.z), m).toBeGreaterThan(OBSERVATORY.drum.r + 1);
      expect(b.max[0] < c.x + OBSERVATORY_TABLE.x - 0.7 || b.min[0] > c.x + OBSERVATORY_TABLE.x + 0.7 || b.max[2] < c.z + OBSERVATORY_TABLE.z - 0.7 || b.min[2] > c.z + OBSERVATORY_TABLE.z + 0.7, m).toBe(true);
    }
    // Le cairn, petit : moins haut que le parapet n'est loin du tambour, et plus haut que le parapet (il se lit au-dessus).
    const cairn = boxes[missions.indexOf('low-density')];
    expect(cairn.max[1] - y0).toBeGreaterThan(OBSERVATORY.terrace.top + 0.6);
    expect(cairn.max[1] - y0).toBeLessThan(OBSERVATORY.terrace.top + 1.3);
  });

  it('la table d’orientation, un disque de bronze lisse sur un pied de pierre : rien d’autre de bronze, ni lettre ni flèche', () => {
    const model = modelOfPlace('observatory').facets;
    const bronze = linearRgb(0x9c7a3c);
    const pts: number[][] = [];
    for (let i = 0; i < model.colors.length; i += 3)
      if ([0, 1, 2].every((k) => Math.abs(model.colors[i + k] - bronze[k]) < 1e-6)) pts.push([model.positions[i], model.positions[i + 1], model.positions[i + 2]]);
    expect(pts.length).toBeGreaterThan(0);
    for (const [x, , z] of pts) expect(Math.hypot(x - OBSERVATORY_TABLE.x, z - OBSERVATORY_TABLE.z)).toBeLessThanOrEqual(0.55 + 1e-6);
    // Un disque plat : deux hauteurs seulement (son dessous et son dessus).
    expect(new Set(pts.map((p) => p[1].toFixed(4))).size).toBe(2);
  });
});

describe('La Halle (GD-20, point 8, lot L8d)', () => {
  const ids = CATALOG.filter((d) => d.biome === 'civics-6e-democratic-society').map((d) => d.id);

  it('ses trois missions, aux deux niveaux, sur le décor neutre : les items de référence tels quels, les réponses sur la rangée (GD-26)', () => {
    expect(ids.length).toBe(placeById('commons').scenes.length * 2);
    for (const id of ids) {
      const items = reference(id).items;
      const placed = placeItems('commons', id, items);
      expect(placed.map((it) => it.key), id).toEqual(items.map((it) => it.key));
      for (const it of placed) {
        expect(it.placeScene, it.key).toEqual(COLUMN);
        const ref = items.find((r) => r.key === it.key)!;
        expect([it.prompt, it.answer, it.choices], it.key).toEqual([ref.prompt, ref.answer, ref.choices]);
      }
      expect(placeInstruction('commons', id, 1, 'Référence.', COLUMN), id).toBe('Référence.');
    }
  });

  it('chaque trace est la sienne, hors des chemins, hors du cadre de la scénette et l’une hors de l’autre ; les bancs et les pupitres sous le bord de la toiture, vus du sud, la haie au coin sud-est', () => {
    const c = placeById('commons').center;
    const y0 = standingHeight(heightAt(c));
    const missions = Object.keys(COMMONS_TRACE_SPOTS) as (keyof typeof COMMONS_TRACE_SPOTS)[];
    expect([...missions].sort()).toEqual([...placeById('commons').scenes].sort());
    const traces = missions.map((m) => [m, placeTrace('commons', [m])] as const);
    expect(new Set(traces.map(([, f]) => f.triangles)).size).toBe(3);
    const boxes = traces.map(([, f]) => boundsOf(f));
    const near = networkSamples(0.25).filter((p) => Math.hypot(p.x - c.x, p.z - c.z) < 20);
    const scene = sceneSpot('commons');
    const R = COMMONS.roof;
    for (const [k, [m]] of traces.entries()) {
      const b = boxes[k];
      expect(b.min[1], m).toBeGreaterThan(y0 - 1);
      // Sous l'égout : aucune n'en touche le bord.
      expect(b.max[1], m).toBeLessThan(y0 + R.eave - 0.5);
      for (const p of near) expect(p.x > b.min[0] - 0.6 && p.x < b.max[0] + 0.6 && p.z > b.min[2] - 0.6 && p.z < b.max[2] + 0.6, m).toBe(false);
      expect(b.max[0] < scene.x - 1.8 || b.min[0] > scene.x + 1.8, m).toBe(true);
      for (let j = k + 1; j < boxes.length; j++) {
        const d = boxes[j];
        expect(b.max[0] < d.min[0] || d.max[0] < b.min[0] || b.max[2] < d.min[2] || d.max[2] < b.min[2], `${m} / ${traces[j][0]}`).toBe(true);
      }
      // Hors des piliers.
      for (const p of COMMONS.pillar.xs.flatMap((x) => [{ x, z: COMMONS.pillar.z }]))
        expect(b.max[0] < c.x + p.x - 0.4 || b.min[0] > c.x + p.x + 0.4 || b.max[2] < c.z + p.z - 0.4 || b.min[2] > c.z + p.z + 0.4, m).toBe(true);
    }
    // Les bancs et les pupitres sous la toiture, au sud du rang des piliers, assez près de l'égout pour se voir du sud
    // (plus loin sous elle, l'égout les cache à la caméra qui suit Kéo).
    for (const m of ['representatives', 'school-secularism'] as const) {
      const b = boxes[missions.indexOf(m)];
      expect(b.min[2] - c.z, m).toBeGreaterThan(COMMONS.pillar.z + 0.35);
      expect(b.max[2] - c.z, m).toBeLessThan(R.ez);
      expect(Math.max(Math.abs(b.min[0] - c.x), Math.abs(b.max[0] - c.x)), m).toBeLessThan(R.ex);
    }
    // La haie au coin sud-est, hors du dallage.
    const hedge = boxes[missions.indexOf('private-life')];
    expect(hedge.min[0] - c.x).toBeGreaterThan(COMMONS.paving.halfX - 1);
    expect(hedge.max[2] - c.z).toBeGreaterThan(COMMONS.paving.halfZ);
  });

  it('rien qui se lise comme un symbole : aucune couleur hors du lieu dans les traces (ni rouge, ni bleu, ni blanc), la haie sans cadenas', () => {
    const allowed = new Set([0x8e6a48, 0xa98258, 0x4f8a3c, 0x5f9c48, 0xdcd0b5, 0xb9a988].map((h) => linearRgb(h).map((v) => v.toFixed(5)).join(',')));
    const f = placeTrace('commons', placeById('commons').scenes);
    for (let i = 0; i < f.colors.length; i += 3) expect(allowed.has([f.colors[i], f.colors[i + 1], f.colors[i + 2]].map((v) => v.toFixed(5)).join(','))).toBe(true);
  });
});

describe('Les couleurs que la vue reconnaît (scene.ts, `unshadedLamp`)', () => {
  it('aucune autre couleur du monde à moins de 0,004 de la lampe, des ailes de la pompe, du rotor, de la vapeur ou du papier', () => {
    const markers = [LAMP_COLOR, SALT_PUMP.vane, ...ENGINE_ROTOR_COLORS, ...STEAM_COLORS, PAPER_COLOR];
    const near = (a: readonly number[], b: readonly number[]) => [0, 1, 2].every((k) => Math.abs(a[k] - b[k]) < 0.004);
    const same = (a: readonly number[], b: readonly number[]) => [0, 1, 2].every((k) => Math.abs(a[k] - b[k]) < 1e-6);
    // Les marqueurs, assez loin l'un de l'autre.
    for (const [i, a] of markers.entries()) for (const b of markers.slice(i + 1)) expect(near(linearRgb(a), linearRgb(b)), `${a.toString(16)} ${b.toString(16)}`).toBe(false);
    // Toutes les couleurs dessinées dans le matériau des lieux : le sol (toutes les tuiles), les chemins, les lieux et leurs
    // ruines, leurs traces, leurs scénettes et la soupape levée.
    const seen = new Map<string, number[]>();
    const take = (f: { colors: Float32Array }) => {
      for (let i = 0; i < f.colors.length; i += 3) {
        const rgb = [f.colors[i], f.colors[i + 1], f.colors[i + 2]];
        seen.set(rgb.map((v) => v.toFixed(6)).join(','), rgb);
      }
    };
    const field = buildHeightField();
    for (let tz = 0; tz < TERRAIN.tilesZ; tz++) for (let tx = 0; tx < TERRAIN.tilesX; tx++) take(tileFacets(field, tx, tz, 'far'));
    take(pathRibbons((x, z) => heightOnMesh(field, x, z)));
    for (const p of PLACES) {
      take(modelOfPlace(p.id).facets);
      take(ruinOf(p.id));
      take(placeTrace(p.id, p.scenes));
      // Les objets des réponses, dessinés dans le maillage de la question (même matériau), choisis ou non.
      const pts = [0, 1, 2, 3].map((k) => ({ x: k * 1.5, y: 0, z: 0 }));
      take(answerObjects(p.id, pts, 1));
      take(answerObjects(p.id, pts, 1, { picked: [1] }));
    }
    const engineScene = itemScene('engine', { kind: 'column' }, true, []);
    take(engineScene.still);
    take(engineScene.reaction!.facets);
    const shipyardScene = itemScene('shipyard', { kind: 'column' }, true, []);
    take(shipyardScene.still);
    take(shipyardScene.reaction!.facets);
    // La pirogue de la Mangrove (lot L8a), au repos et après une bonne réponse.
    take(itemScene('mangrove', { kind: 'column' }, false, []).still);
    take(itemScene('mangrove', { kind: 'column' }, true, []).reaction!.facets);
    // Le treuil de fouille des Ruines (lot L8b), au repos et après une bonne réponse.
    take(itemScene('ruins', { kind: 'column' }, false, []).still);
    take(itemScene('ruins', { kind: 'column' }, true, []).still);
    take(itemScene('ruins', { kind: 'column' }, true, []).reaction!.facets);
    // L'Observatoire (lot L8c) : la baie aux volets ouverts.
    take(itemScene('observatory', { kind: 'column' }, true, []).still);
    // La Halle (lot L8d) : la borne-fontaine, son filet et l'eau de son auge.
    const commonsScene = itemScene('commons', { kind: 'column' }, true, []);
    take(commonsScene.still);
    take(commonsScene.reaction!.facets);
    for (const rgb of seen.values()) for (const m of markers) if (near(rgb, linearRgb(m))) expect(same(rgb, linearRgb(m)), `${rgb.join(',')} près de ${m.toString(16)}`).toBe(true);
  });
});

describe('Le geste « ranger » aux Filets (GD-20, point 8, lot L4)', () => {
  it('l’Enclos se range dans les paniers des catégories du contenu ; les autres missions des Filets touchent un panier', () => {
    expect(rangeGesture('filets', 'french-6e-grammar-spelling-word-classes-1')).toBe(ENCLOS_BINS);
    expect(rangeGesture('filets', 'french-6e-grammar-spelling-plurals-1')).toBeNull();
    expect(rangeGesture('phare', 'french-6e-grammar-spelling-word-classes-1')).toBeNull();
    // Les paniers sont les réponses du contenu, rien d'autre.
    const items = reference('french-6e-grammar-spelling-word-classes-1').items;
    expect(new Set(items.map((it) => it.answer))).toEqual(new Set(ENCLOS_BINS.map((b) => b.id)));
    // Les items de référence, tels quels, sur l'Enclos.
    const placed = placeItems('filets', 'french-6e-grammar-spelling-word-classes-1', items);
    expect(placed.map((it) => it.key)).toEqual(items.map((it) => it.key));
    expect(placed.every((it) => it.placeScene === ENCLOS && it.answer === items.find((r) => r.key === it.key)!.answer)).toBe(true);
    expect(rangeRounds(placed).map((r) => r.length)).toEqual(Array.from({ length: Math.ceil(items.length / 4) }, (_, i) => Math.min(4, items.length - 4 * i)));
    // La Récolte (et le Tri des graines, au même écran) : la pêche du jour, la même pour tous les items (rien ne dit la
    // réponse).
    for (const id of ['french-6e-grammar-spelling-e-er-ez-1', 'french-6e-grammar-spelling-e-er-ez-2']) {
      const scenes = placeItems('filets', id, reference(id).items).map((it) => JSON.stringify(it.placeScene));
      expect(new Set(scenes), id).toEqual(new Set([JSON.stringify({ kind: 'filets', catch: 'pêche', count: 1 })]));
      // Les paniers de la Récolte dans l'ordre de la consigne, quel que soit le tirage (relecture de L4, référent dys).
      const shuffled = reference(id).items.map((it, i) => ({ ...it, choices: i % 2 ? ['ez', 'é', 'er'] : ['er', 'ez', 'é'] }));
      for (const it of placeItems('filets', id, shuffled)) expect(it.choices, id).toEqual([...RECOLTE_ORDER]);
    }
    // Le Tri des graines garde ses choix.
    const tri = [{ key: 'a', choices: ['verbe', 'nom'] }];
    expect(placeItems('filets', 'french-6e-grammar-spelling-sorting-1', tri)[0].choices).toEqual(['verbe', 'nom']);
    // Au plus grand texte sur un écran bas, un sujet par manche (la ligne de règle reste affichée, contenu).
    expect(rangeRounds(placed, RANGE_PER_GRAND_ROUND).every((r) => r.length === 1)).toBe(true);
  });

  it('l’Enclos : le verbe accordé de chaque sujet, et la ligne de règle du niveau (relecture de L4, contenu)', () => {
    expect(agreedSentence({ key: 'k', subject: 'Les chiens', singular: 'mange', plural: 'mangent', answer: 'pluriel' })).toBe('Les chiens mangent');
    expect(agreedSentence({ key: 'k', subject: 'Le chien', singular: 'mange', plural: 'mangent', answer: 'singulier' })).toBe('Le chien mange');
    expect(agreedSentence({ key: 'k', subject: 'Le chien' })).toBe('Le chien');
    const id = (n: number) => `french-6e-grammar-spelling-word-classes-${n}`;
    expect(placeRuleLine('filets', id(1), 1)).toBe(ENCLOS_RULE_LINE[0]);
    expect(placeRuleLine('filets', id(2), 2)).toBe(ENCLOS_RULE_LINE[1]);
    expect(placeRuleLine('filets', 'french-6e-grammar-spelling-sorting-1', 1)).toBeNull();
    // Chaque ligne est une ligne de la carte de règle de son niveau : la carte et la ligne disent la même chose.
    for (const n of [1, 2]) {
      const lines = (reference(id(n)).items[0].aid as { props: { lines: string[] } }).props.lines;
      expect(lines).toContain(ENCLOS_RULE_LINE[n - 1]);
    }
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

  it('aux Filets, le vivier dans l’eau, les nasses sur le sable contre le séchoir, le carrelet sur l’eau, le plus haut ; hors des chemins (lot L4)', () => {
    const c = placeById('filets').center;
    const traces = (Object.keys(FILETS_TRACE_SPOTS) as (keyof typeof FILETS_TRACE_SPOTS)[]).map((m) => [m, placeTrace('filets', [m])] as const);
    // Environ 700 triangles pour les trois (directeur artistique), chacune la sienne.
    const total = traces.reduce((t, [, f]) => t + f.triangles, 0);
    expect(total).toBeLessThanOrEqual(700);
    expect(new Set(traces.map(([, f]) => f.triangles)).size).toBe(3);
    // Le vivier : ses pieux plantés dans l'eau, tout autour du cercle.
    const v = FILETS_TRACE_SPOTS['word-classes'];
    for (let k = 0; k < FILETS_VIVIER.stakes; k++) {
      const a = (2 * Math.PI * k) / FILETS_VIVIER.stakes;
      expect(heightAt({ x: c.x + v.x + FILETS_VIVIER.radius * Math.cos(a), z: c.z + v.z + FILETS_VIVIER.radius * Math.sin(a) })).toBeLessThan(-0.1);
    }
    // Les nasses sur le sable ; le carrelet sur l'eau.
    const n = FILETS_TRACE_SPOTS.sorting;
    expect(heightAt({ x: c.x + n.x, z: c.z + n.z })).toBeGreaterThan(0);
    const k = FILETS_TRACE_SPOTS['e-er-ez'];
    expect(heightAt({ x: c.x + k.x, z: c.z + k.z })).toBeLessThan(-0.1);
    // Le carrelet, la trace la plus haute du lieu (le filet raccommodé du Troupeau compris).
    const top = (f: ReturnType<typeof placeTrace>) => boundsOf(f).max[1];
    const carrelet = top(placeTrace('filets', ['e-er-ez']));
    expect(carrelet).toBeCloseTo(FILETS_CARRELET.tip + 0.06, 1);
    for (const m of ['word-classes', 'sorting', 'plurals']) expect(top(placeTrace('filets', [m])), m).toBeLessThan(carrelet);
    // Les trois ne se touchent pas, et aucune n'est sur un chemin.
    const boxes = traces.map(([, f]) => boundsOf(f));
    for (let i = 0; i < boxes.length; i++)
      for (let j = i + 1; j < boxes.length; j++) {
        const [a, b] = [boxes[i], boxes[j]];
        expect(a.max[0] < b.min[0] || b.max[0] < a.min[0] || a.max[2] < b.min[2] || b.max[2] < a.min[2]).toBe(true);
      }
    const near = networkSamples(0.25).filter((p) => Math.hypot(p.x - c.x, p.z - c.z) < 16);
    for (const [m, f] of traces) {
      const b = boundsOf(f);
      for (const p of near) expect(p.x > b.min[0] - 0.8 && p.x < b.max[0] + 0.8 && p.z > b.min[2] - 0.8 && p.z < b.max[2] + 0.8, m).toBe(false);
    }
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

describe('Le rivage nord (GD-20, point 8, lot L7)', () => {
  const north = { lookout: 'french-6e-reading', archives: 'french-6e-word-spelling', printworks: 'french-6e-letter-confusion' } as const;
  const COLUMN_MISSIONS = ['comprehension', 'tense-values', 'word-forms'];

  it('Étages du sens, Les temps du récit et Facettes sur le décor neutre ; les autres missions de la scène en R, le lieu au repos', () => {
    for (const [place, island] of Object.entries(north) as [keyof typeof north, string][]) {
      for (const d of CATALOG.filter((e) => e.biome === island)) {
        const mission = placeById(place).scenes.find((m) => missionIs(d.id, m));
        if (!mission) continue;
        const items = reference(d.id).items;
        const placed = placeItems(place, d.id, items);
        expect(placed.map((it) => it.key), d.id).toEqual(items.map((it) => it.key));
        for (const it of placed) {
          expect(it.placeScene, it.key).toEqual(COLUMN_MISSIONS.includes(mission) ? COLUMN : REST);
          // Les champs de l'item restent : le retour de l'exercice les cite (`fillTemplate`).
          const ref = items.find((r) => r.key === it.key)!;
          expect([it.answer, it.choices], it.key).toEqual([ref.answer, ref.choices]);
          for (const k of Object.keys(ref)) if (k !== 'prompt' && k !== 'spoken') expect(it[k], `${it.key}.${k}`).toEqual(ref[k]);
        }
      }
    }
    expect(isItemScene(REST)).toBe(true);
  });

  it('aucun item redit sans son mot : chaque écran de référence a sa phrase affichée et sa voix', () => {
    for (const [place, island] of [['archives', 'french-6e-word-spelling'], ['printworks', 'french-6e-letter-confusion']] as const) {
      for (const d of CATALOG.filter((e) => e.biome === island)) {
        if (!['missing-letters', 'word-families', 'sight-words', 'sound-discrimination'].some((m) => missionIs(d.id, m))) continue;
        for (const it of placeItems(place, d.id, reference(d.id).items)) {
          expect(String(it.prompt).replace(/…/g, '').trim(), it.key).not.toBe('');
          expect(String(it.spoken ?? '').trim(), it.key).not.toBe('');
          if (it.gapWord !== undefined) expect(it.gapWord.replace('…', ''), it.key).not.toBe('');
        }
      }
    }
  });

  it('les écrans de référence redits : le mot troué, la racine et ses affixes, la phrase à écouter', () => {
    const first = (id: string) => placeItems(id.startsWith('french-6e-letter') ? 'printworks' : 'archives', id, reference(id).items)[0];
    const troue = first('french-6e-word-spelling-missing-letters-1');
    expect(troue.prompt).toContain('…');
    expect(troue.listen).toBe('mot');
    expect(troue.spoken).toBe(String(reference('french-6e-word-spelling-missing-letters-1').items[0].word));
    const family = CATALOG.find((d) => d.biome === 'french-6e-word-spelling' && missionIs(d.id, 'word-families'))!.id;
    const fam = first(family);
    expect(fam.gapWord).toMatch(/^…|…$/);
    expect(fam.choiceLabels).toHaveLength((fam.choices as unknown[]).length);
    for (const l of fam.choiceLabels!) expect(l).toMatch(/^-|-$/);
    const listen = first('french-6e-letter-confusion-sound-discrimination-1');
    expect(listen.listen).toBe('reecouter');
    expect(listen.speakOnOpen).toBe(true);
    expect(listen.spoken).toBeTruthy();
  });
});

describe('Les gestes des items (GD-26)', () => {
  const fiche = (key: string, choices: string[]) => ({ key, gesture: 'ranger', choices });
  it('lit le geste d’un item : ranger, placer, régler ; rien pour toucher', () => {
    expect(itemGesture({ gesture: 'ranger' })).toBe('ranger');
    expect(itemGesture({ gesture: 'régler' })).toBe('régler');
    expect(itemGesture({ gesture: 'glisser' })).toBeNull();
    expect(itemGesture({})).toBeNull();
  });
  it('donne aux caisses l’union des choix de la manche, dans leur ordre', () => {
    expect(gestureBins([fiche('a', ['oiseau', 'mammifère']), fiche('b', ['poisson', 'oiseau'])]).map((b) => b.id)).toEqual(['oiseau', 'mammifère', 'poisson']);
  });
  it('range les fiches en manches à la place de la première, les autres items un par écran', () => {
    const t1 = { key: 't1' };
    const t2 = { key: 't2', gesture: 'placer' };
    const [a, b, c] = ['a', 'b', 'c'].map((k) => fiche(k, ['x']));
    expect(gestureScreens([t1, a, t2, b, c], 2)).toEqual([[t1], [a, b], [c], [t2]]);
    expect(gestureScreens([t1, t2], 3)).toEqual([[t1], [t2]]);
  });
  it('écrit les fiches de la Mangrove et les paniers du Hameau dans le contenu, la réponse parmi les choix', async () => {
    const vivant = await loadExercise('life-earth-sciences-6e-living-world-living-groups-1');
    const solidarite = await loadExercise('civics-5e-equality-solidarity-solidarity-1');
    expect(vivant?.items.filter((it) => itemGesture(it) === 'ranger')).toHaveLength(3);
    expect(solidarite?.items.filter((it) => itemGesture(it) === 'placer')).toHaveLength(1);
    for (const it of [...(vivant?.items ?? []), ...(solidarite?.items ?? [])].filter((x) => itemGesture(x))) expect(it.choices).toContain(it.answer);
  });
});

describe('Les caisses d’une manche (GD-26, avis du contenu)', () => {
  it('donne à chaque fiche de la Mangrove une caisse de sa manche', async () => {
    const fiches = (await loadExercise('life-earth-sciences-6e-living-world-living-groups-1'))!.items.filter((it) => itemGesture(it) === 'ranger');
    const bins = gestureBins(fiches).map((b) => b.id);
    for (const f of fiches) expect(bins).toContain(f.answer);
  });
});

describe('Les consignes courtes des missions produites par le code (GD-26)', () => {
  it('tiennent en huit mots, et chaque mission du code en a une', async () => {
    const all = await Promise.all(CATALOG.map((m) => loadExercise(m.id)));
    const words = (t: string) => t.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
    for (const t of Object.values(SHORT_INSTRUCTIONS)) expect(words(t), t).toBeLessThanOrEqual(8);
    for (const ex of all) if (ex?.generate) expect(ex.shortInstruction, ex.id).toBeTruthy();
  });
});
