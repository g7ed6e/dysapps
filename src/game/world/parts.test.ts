import { afterEach } from 'vitest';
import { BIOMES, missionsJouables } from '../biomes';
import { DEFAULT_SETTINGS, retenirReglages } from '../../core/settings';
import { EMPTY_STATE, completeExercise, rattraperLesParties, type GameState } from '../engine';
import { exercisesOf } from '../exercises';
import type { ExerciseDef } from '../exercises/types';
import { missionsTerminees, nombreDeParties, partiePosee, partiesDe, partiesPosees, poserLesParties, premierePartiePosee, prochainePartie } from './parts';
import { isPlanDone, planCells, plansFor } from './plans';

const joue = (id: string) => ({ [id]: { stars: 1 as const, attempts: 1, best: 0.5 } });
const premierExercice = (biome: string, type: string) => exercisesOf(biome as never, type)[0].id;

it('donne une partie par mission, de 2 à 5, faite des cases des trois plans, sans en oublier ni en doubler', () => {
  for (const b of BIOMES) {
    const parties = partiesDe(b.id);
    const plans = plansFor(b.id);
    if (plans.length < 3) {
      expect(parties).toEqual([]);
      continue;
    }
    expect(parties).toHaveLength(nombreDeParties(b));
    // Le lieu de la LV2 compte les missions d'une seule langue (le lieu du latin et du grec : le test suivant).
    const langue = b.exercises.find((x) => x.lv2 !== undefined)?.lv2;
    if (b.subject !== 'lca') expect(parties.length).toBe(Math.max(2, Math.min(5, b.exercises.filter((x) => x.lv2 === langue).length)));
    // Chaque case de chaque plan est dans une seule partie, quelle que soit l'option latin ou grec.
    for (const lca of ['la', 'gr', 'none'] as const) {
      const deLOption = partiesDe(b.id, lca);
      for (const plan of plans) {
        const keys = deLOption.flatMap((p) => p.cases.filter((c) => c.plan.id === plan.id).flatMap((c) => c.keys));
        expect(keys.sort()).toEqual(planCells(plan).map((c) => c.key).sort());
      }
      for (const p of deLOption) expect(p.cases.every((c) => c.keys.length > 0)).toBe(true);
    }
  }
});

afterEach(() => retenirReglages(null));

const LIEUX_LCA = ['lca-5e-legends', 'lca-4e-cities', 'lca-3e-ideas'] as const;

it('le lieu du latin et du grec compte les missions jouables de l’option choisie (GD-13, GD-14), comme la LV2', () => {
  expect(BIOMES.filter((b) => b.subject === 'lca').map((b) => b.id)).toEqual([...LIEUX_LCA]);
  for (const id of LIEUX_LCA) {
    const b = BIOMES.find((x) => x.id === id)!;
    for (const lca of ['la', 'gr'] as const) expect(partiesDe(id, lca), `${id} ${lca}`).toHaveLength(Math.max(2, missionsJouables(b, 'none', lca).length));
    // Latin : trois missions, trois parties, une par plan.
    expect(partiesDe(id, 'la').map((p) => p.nom)).toEqual(plansFor(id).map((p) => p.name));
    // Avec « Pas d'option » : l'option qui en a le plus.
    expect(partiesDe(id, 'none')).toHaveLength(3);
  }
  // Le grec de la Grotte des légendes, tant que « L'alphabet grec » attend sa police : deux parties, le corps, puis le
  // haut et les abords ensemble.
  expect(partiesDe('lca-5e-legends', 'gr').map((p) => p.cases.map((c) => c.plan.id))).toEqual([
    ['lca-5e-legends-1'],
    ['lca-5e-legends-2', 'lca-5e-legends-3'],
  ]);
  expect(partiesDe('lca-4e-cities', 'gr')).toHaveLength(3);
  expect(partiesDe('lca-3e-ideas', 'gr')).toHaveLength(3);
  // Le réglage en mémoire décide, sans rien passer ; le même tableau revient tant que l'option ne change pas.
  retenirReglages({ ...DEFAULT_SETTINGS, lca: 'gr' });
  expect(partiesDe('lca-5e-legends')).toBe(partiesDe('lca-5e-legends', 'gr'));
  retenirReglages({ ...DEFAULT_SETTINGS, lca: 'la' });
  expect(partiesDe('lca-5e-legends')).toHaveLength(3);
  // Les trois missions de chaque option finissent le bâtiment.
  for (const id of LIEUX_LCA) {
    const latin = BIOMES.find((x) => x.id === id)!.exercises.filter((x) => x.option === 'la');
    const progress = Object.assign({}, ...latin.map((t) => joue(premierExercice(id, t.id))));
    const r = poserLesParties(id, {}, missionsTerminees(progress, id));
    expect(plansFor(id).every((p) => isPlanDone(p, r.parts)), id).toBe(true);
    expect(prochainePartie(id, r.parts)).toBeNull();
  }
});

it('remet au bon compte une sauvegarde posée quand le lieu d’option comptait cinq parties, sans rien perdre ni rien redonner', () => {
  const id = 'lca-5e-legends';
  const [abri, porche] = plansFor(id);
  const toutes = (plan: typeof abri) => planCells(plan).map((c) => c.key);
  const types = BIOMES.find((x) => x.id === id)!.exercises;
  const jouees = (option: 'la' | 'gr') =>
    Object.assign({}, ...types.filter((t) => t.option === option && t.waiting === undefined).map((t) => joue(premierExercice(id, t.id))));
  // Latin, 3 parties sur 5 : l'abri (ses deux rangées), puis le bas du porche.
  const zPorche = [...new Set(planCells(porche).map((c) => c.z))].sort((a, b) => a - b);
  const basDuPorche = planCells(porche).filter((c) => c.z <= zPorche[1]).map((c) => c.key);
  retenirReglages({ ...DEFAULT_SETTINGS, lca: 'la' });
  const latin: GameState = { ...EMPTY_STATE, progress: jouees('la'), world: { ...EMPTY_STATE.world, parts: { [abri.id]: toutes(abri), [porche.id]: basDuPorche } } };
  expect(partiesPosees(id, latin.world.parts)).toBe(1);
  const r = rattraperLesParties(latin, '2026-10-21');
  expect(partiesPosees(id, r.state.world.parts)).toBe(3);
  expect(prochainePartie(id, r.state.world.parts)).toBeNull();
  // Les cases déjà posées restent en tête ; l'XP n'est rendue que pour les plans finis à l'instant.
  expect(r.state.world.parts[porche.id].slice(0, basDuPorche.length)).toEqual(basDuPorche);
  expect(r.plansFinis.map((p) => p.id)).toEqual([`${id}-2`, `${id}-3`]);
  expect(rattraperLesParties(r.state, '2026-10-22').state).toBe(r.state);
  // Grec, 2 parties sur 5 (l'abri) : ses deux parties, le bâtiment fini.
  retenirReglages({ ...DEFAULT_SETTINGS, lca: 'gr' });
  const grec: GameState = { ...EMPTY_STATE, progress: jouees('gr'), world: { ...EMPTY_STATE.world, parts: { [abri.id]: toutes(abri) } } };
  const g = rattraperLesParties(grec, '2026-10-21');
  expect(partiesPosees(id, g.state.world.parts)).toBe(2);
  expect(prochainePartie(id, g.state.world.parts)).toBeNull();
  // Quand la police arrivera, le grec comptera trois parties : déjà posées, rien ne se perd.
  expect(partiesDe(id, 'la').every((p) => partiePosee(p, g.state.world.parts))).toBe(true);
});

it('coupe les murs en deux par la hauteur pour quatre missions, en trois rangées pour cinq (ou le mur et le toit en deux), réunit le toit et la cour pour deux', () => {
  expect(partiesDe('french-6e-word-spelling').map((p) => p.nom)).toEqual(['Le bas du four de Rouxel', 'Le haut du four de Rouxel', 'L’abri du four', 'La cour du four']);
  expect(partiesDe('french-6e-grammar-spelling')[0].nom).toBe('Le bas de l’étable de Bloquette');
  expect(partiesDe('lv2-5e-introductions')[2].nom).toBe('Le haut de l’auberge de Lina');
  // Cinq missions (GD-14) : le premier plan en trois, sans case partagée, du bas vers le haut.
  const cinq = partiesDe('maths-6e-calculation');
  expect(cinq.map((p) => p.nom)).toEqual(['Le bas du nid de Coco', 'Le milieu du nid de Coco', 'Le haut du nid de Coco', 'Le toit du nid', 'La cour du nid']);
  const z = (keys: string[]) => keys.map((k) => Number(k.split(',')[2]));
  const [basEtable, hautEtable] = partiesDe('french-6e-grammar-spelling');
  expect(Math.max(...z(basEtable.cases[0].keys))).toBeLessThan(Math.min(...z(hautEtable.cases[0].keys)));
  // Un mur de deux rangées seulement : son bas et son haut, puis le bas et le haut du deuxième plan.
  expect(partiesDe('maths-5e-signed-numbers').map((p) => p.nom)).toEqual([
    'Le bas de l’igloo de Frimas',
    'Le haut de l’igloo de Frimas',
    'Le bas du dôme de l’igloo',
    'Le haut du dôme de l’igloo',
    'La patinoire de l’igloo',
  ]);
  // Partout où un plan se coupe pour cinq missions, il se coupe en rangées entières : chaque partie est toute en
  // dessous de la suivante, sans case vide, et « Le milieu » ou « Le haut » dit vrai.
  for (const biome of BIOMES.filter((b) => partiesDe(b.id).length === 5)) {
    const parties = partiesDe(biome.id);
    for (const [a, b] of parties.slice(0, -1).map((p, i) => [p, parties[i + 1]] as const)) {
      expect(a.cases[0].keys.length, a.nom).toBeGreaterThan(0);
      if (a.cases.length !== 1 || b.cases.length !== 1 || a.cases[0].plan.id !== b.cases[0].plan.id) continue;
      expect(Math.max(...z(a.cases[0].keys)), `${a.nom} sous ${b.nom}`).toBeLessThan(Math.min(...z(b.cases[0].keys)));
    }
  }
  const mine = partiesDe('french-6e-letter-confusion');
  expect(mine).toHaveLength(2);
  expect(mine[1].cases.map((c) => c.plan.id)).toEqual(['french-6e-letter-confusion-2', 'french-6e-letter-confusion-3']);
  expect(mine.map((p) => p.nom)).toEqual(['La forge de Tunel', 'Le toit et la cour de la forge']);
  expect(partiesDe('french-6e-phonology').map((p) => p.nom)).toEqual(['La cabane de Mousso', 'Le toit de la cabane', 'La cour de la cabane']);
});

it('compte les missions terminées d’un lieu, une fois chacune, sans prendre celles d’un autre lieu', () => {
  const progress = {
    ...joue(premierExercice('french-6e-phonology', 'rhymes')),
    ...joue(exercisesOf('french-6e-phonology', 'rhymes').at(-1)!.id),
    ...joue(premierExercice('french-6e-phonology', 'syllables')),
    ...joue(premierExercice('french-6e-letter-confusion', 'letter-pairs')),
    'french-6e-phonology-challenge': { stars: 3 as const, attempts: 1, best: 1 },
  };
  expect(missionsTerminees(progress, 'french-6e-phonology')).toBe(2);
  expect(missionsTerminees(progress, 'french-6e-letter-confusion')).toBe(1);
  expect(missionsTerminees({}, 'french-6e-phonology')).toBe(0);
});

it('pose les parties dans l’ordre du dessin, autant que de missions terminées, sans rien poser deux fois', () => {
  const id = 'french-6e-word-spelling';
  const une = poserLesParties(id, {}, 1);
  expect(une.posees.map((p) => p.rang)).toEqual([1]);
  expect(une.plansFinis).toEqual([]);
  expect(prochainePartie(id, une.parts)?.rang).toBe(2);
  expect(premierePartiePosee(id, une.parts)).toBe(true);
  // La deuxième finit le premier plan.
  const deux = poserLesParties(id, une.parts, 2);
  expect(deux.posees.map((p) => p.rang)).toEqual([2]);
  expect(deux.plansFinis.map((p) => p.id)).toEqual([`${id}-1`]);
  // Une mission rejouée : rien de plus.
  expect(poserLesParties(id, deux.parts, 2).posees).toEqual([]);
  // Plus de missions que de parties : le bâtiment est fini, sans plus.
  const tout = poserLesParties(id, deux.parts, 9);
  expect(tout.posees.map((p) => p.rang)).toEqual([3, 4]);
  expect(plansFor(id).every((p) => isPlanDone(p, tout.parts))).toBe(true);
  expect(prochainePartie(id, tout.parts)).toBeNull();
  // Cinq parties (GD-14) : la troisième finit le premier plan.
  const cinq = 'maths-6e-calculation';
  const deuxSurCinq = poserLesParties(cinq, {}, 2);
  expect(deuxSurCinq.plansFinis).toEqual([]);
  const trois = poserLesParties(cinq, deuxSurCinq.parts, 3);
  expect(trois.posees.map((p) => p.rang)).toEqual([3]);
  expect(trois.plansFinis.map((p) => p.id)).toEqual([`${cinq}-1`]);
  expect(poserLesParties(cinq, trois.parts, 5).posees.map((p) => p.rang)).toEqual([4, 5]);
});

it('compte un plan bâti à la main avant GD-6 comme ses parties posées', () => {
  const id = 'french-6e-phonology';
  const cabane = plansFor(id)[0];
  const parts = { [cabane.id]: planCells(cabane).map((c) => c.key) };
  expect(partiesPosees(id, parts)).toBe(1);
  // Une mission terminée : la cabane compte déjà, rien n'est posé.
  expect(poserLesParties(id, parts, 1).posees).toEqual([]);
  // Deux : le toit vient.
  const r = poserLesParties(id, parts, 2);
  expect(r.posees.map((p) => p.nom)).toEqual(['Le toit de la cabane']);
  // Un plan à moitié bâti à la main garde ses cases, la partie y ajoute les autres.
  const moitie = { [cabane.id]: planCells(cabane).slice(0, 5).map((c) => c.key) };
  const fini = poserLesParties(id, moitie, 1);
  expect(fini.parts[cabane.id].slice(0, 5)).toEqual(moitie[cabane.id]);
  expect(partiePosee(partiesDe(id)[0], fini.parts)).toBe(true);
});

it('une mission terminée pose sa partie sans prendre de blocs, sans coffre, avec une ligne du journal par plan fini', () => {
  const def: ExerciseDef = {
    id: premierExercice('french-6e-phonology', 'rhymes'),
    biome: 'french-6e-phonology',
    type: 'rhymes',
    level: 1,
    instruction: 'Test',
    items: [{ key: 'a' }],
    feedback: { correct: 'Bravo', wrong: 'Non' },
    reward: { block: 'french-6e-phonology', amount: 4, xp: 10 },
    adaptive: { promoteAt: 0.85, demoteAt: 0.5 },
  };
  const stock = { 'french-6e-phonology': 3 };
  const state: GameState = { ...EMPTY_STATE, stock };
  // Aucune bonne réponse : la mission est terminée, la partie se pose (jokers et erreurs n'y changent rien).
  const r = completeExercise(state, def, [{ key: 'a', correct: false, attempts: 2, usedHelp: true }], '2026-10-02');
  expect(r.pose?.posees.map((p) => p.nom)).toEqual(['La cabane de Mousso']);
  expect(r.pose?.plansFinis.map((p) => p.id)).toEqual(['french-6e-phonology-1']);
  expect(r.state.world.log).toEqual([{ day: '2026-10-02', part: 'french-6e-phonology-1' }]);
  // Seul le stock du lieu bouge, des blocs de la mission ; aucun bloc de finition, ni or ni cristal.
  expect(Object.keys(r.state.stock)).toEqual(['french-6e-phonology']);
  expect(r.state.stock['french-6e-phonology']).toBeGreaterThanOrEqual(3);
  // Rejouée : rien de plus.
  const again = completeExercise(r.state, def, [{ key: 'a', correct: true, attempts: 1, usedHelp: false }], '2026-10-03');
  expect(again.pose).toBeUndefined();
  expect(again.state.world.parts).toBe(r.state.world.parts);
});

it('rattrape une ancienne sauvegarde : les parties des missions déjà terminées, une seule fois', () => {
  const state: GameState = {
    ...EMPTY_STATE,
    progress: { ...joue(premierExercice('french-6e-phonology', 'rhymes')), ...joue(premierExercice('french-6e-phonology', 'syllables')) },
  };
  const r = rattraperLesParties(state, '2026-10-02');
  expect(partiesPosees('french-6e-phonology', r.state.world.parts)).toBe(2);
  expect(r.plansFinis.map((p) => p.id)).toEqual(['french-6e-phonology-1', 'french-6e-phonology-2']);
  expect(r.state.stock).toEqual({});
  const encore = rattraperLesParties(r.state, '2026-10-03');
  expect(encore.state).toBe(r.state);
  expect(encore.plansFinis).toEqual([]);
});

it('le lieu de la LV2 a cinq parties, posées par les missions des deux langues ensemble, sans dépendre du réglage', () => {
  // Le bâtiment compte les missions d'une seule langue : les deux en ont autant, sur chaque lieu de LV2.
  for (const b of BIOMES.filter((x) => x.exercises.some((e) => e.lv2 !== undefined)))
    expect(b.exercises.filter((e) => e.lv2 === 'es').length, b.id).toBe(b.exercises.filter((e) => e.lv2 === 'de').length);
  const id = 'lv2-5e-introductions';
  expect(partiesDe(id)).toHaveLength(5);
  const types = BIOMES.find((b) => b.id === id)!.exercises;
  const es = types.filter((t) => t.lv2 === 'es').map((t) => t.id);
  const de = types.filter((t) => t.lv2 === 'de').map((t) => t.id);
  const progress = { ...joue(premierExercice(id, es[0])), ...joue(premierExercice(id, es[1])), ...joue(premierExercice(id, de[0])) };
  expect(missionsTerminees(progress, id)).toBe(3);
  // Toutes les missions des deux langues : cinq parties, pas plus.
  const tout = Object.assign({}, ...[...es, ...de].map((t) => joue(premierExercice(id, t))));
  expect(missionsTerminees(tout, id)).toBe(10);
  expect(poserLesParties(id, {}, missionsTerminees(tout, id)).posees).toHaveLength(5);
});
