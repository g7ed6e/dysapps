import { BIOMES } from '../biomes';
import { EMPTY_STATE, completeExercise, rattraperLesParties, type GameState } from '../engine';
import { exercisesOf } from '../exercises';
import type { ExerciseDef } from '../exercises/types';
import { missionsTerminees, nombreDeParties, partiePosee, partiesDe, partiesPosees, poserLesParties, premierePartiePosee, prochainePartie } from './parties';
import { isPlanDone, planCells, plansFor } from './plans';

const joue = (id: string) => ({ [id]: { stars: 1 as const, attempts: 1, best: 0.5 } });
const premierExercice = (biome: string, type: string) => exercisesOf(biome as never, type)[0].id;

it('donne une partie par mission, de 2 à 4, faite des cases des trois plans, sans en oublier ni en doubler', () => {
  for (const b of BIOMES) {
    const parties = partiesDe(b.id);
    const plans = plansFor(b.id);
    if (plans.length < 3) {
      expect(parties).toEqual([]);
      continue;
    }
    expect(parties).toHaveLength(nombreDeParties(b));
    expect(parties.length).toBe(Math.min(4, b.exercises.length));
    // Chaque case de chaque plan est dans une seule partie.
    for (const plan of plans) {
      const keys = parties.flatMap((p) => p.cases.filter((c) => c.plan.id === plan.id).flatMap((c) => c.keys));
      expect(keys.sort()).toEqual(planCells(plan).map((c) => c.key).sort());
    }
    for (const p of parties) expect(p.cases.every((c) => c.keys.length > 0)).toBe(true);
  }
});

it('coupe les murs en deux par la hauteur pour quatre missions, réunit le toit et la cour pour deux', () => {
  const [bas, haut, toit, cour] = partiesDe('maths-6e-calculation');
  expect([bas.nom, haut.nom, toit.nom, cour.nom]).toEqual(['Le bas du nid de Coco', 'Le haut du nid de Coco', 'Le toit du nid', 'La cour du nid']);
  expect(partiesDe('french-6e-grammar-spelling')[0].nom).toBe('Le bas de l’étable de Bloquette');
  expect(partiesDe('lv2-5e-introductions')[1].nom).toBe('Le haut de l’auberge de Lina');
  const z = (keys: string[]) => keys.map((k) => Number(k.split(',')[2]));
  expect(Math.max(...z(bas.cases[0].keys))).toBeLessThan(Math.min(...z(haut.cases[0].keys)));
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
  const id = 'maths-6e-calculation';
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

it('le lieu de la LV2 a quatre parties, posées par les missions des deux langues ensemble, sans dépendre du réglage', () => {
  const id = 'lv2-5e-introductions';
  expect(partiesDe(id)).toHaveLength(4);
  const types = BIOMES.find((b) => b.id === id)!.exercises;
  const es = types.filter((t) => t.lv2 === 'es').map((t) => t.id);
  const de = types.filter((t) => t.lv2 === 'de').map((t) => t.id);
  const progress = { ...joue(premierExercice(id, es[0])), ...joue(premierExercice(id, es[1])), ...joue(premierExercice(id, de[0])) };
  expect(missionsTerminees(progress, id)).toBe(3);
  // Toutes les missions des deux langues : quatre parties, pas plus.
  const tout = Object.assign({}, ...[...es, ...de].map((t) => joue(premierExercice(id, t))));
  expect(missionsTerminees(tout, id)).toBe(8);
  expect(poserLesParties(id, {}, missionsTerminees(tout, id)).posees).toHaveLength(4);
});
