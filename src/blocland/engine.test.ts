import {
  EMPTY_STATE,
  adapt,
  addDays,
  completeExercise,
  daysBetween,
  dueItems,
  recordSpaced,
  sanitizeState,
  scoreOf,
  starsFor,
  updateStreak,
} from './engine';
import type { ExerciseDef, ItemResult } from './exercises/types';

const DEF: ExerciseDef = {
  id: 'foret-test-001',
  biome: 'foret',
  type: 'qcm',
  level: 1,
  instruction: 'Test',
  items: [{ key: 'a' }, { key: 'b' }, { key: 'c' }, { key: 'd' }],
  feedback: { correct: 'Bravo', wrong: 'Non : {word}' },
  reward: { block: 'bois', amount: 4, xp: 10 },
  adaptive: { promoteAt: 0.85, demoteAt: 0.5 },
};
const ok = (key: string): ItemResult => ({ key, correct: true, attempts: 1, usedHelp: false });
const ko = (key: string): ItemResult => ({ key, correct: false, attempts: 1, usedHelp: false });

describe('dates', () => {
  it('ajoute des jours et compte les écarts', () => {
    expect(addDays('2026-09-24', 7)).toBe('2026-10-01');
    expect(daysBetween('2026-09-24', '2026-09-26')).toBe(2);
  });
});

describe('score et étoiles', () => {
  it('compte 1 point du premier coup, ½ avec aide ou après erreur', () => {
    expect(scoreOf([ok('a'), { ...ok('b'), usedHelp: true }, { ...ok('c'), attempts: 2 }, ko('d')])).toBe(0.5);
    expect(starsFor(1)).toBe(3);
    expect(starsFor(0.75)).toBe(2);
    expect(starsFor(0.2)).toBe(1);
  });
});

describe('streak quotidien', () => {
  it('se prolonge jour après jour et donne un coffre tous les 3 jours', () => {
    let s = updateStreak(EMPTY_STATE.streak, '2026-09-24');
    expect(s.streak.current).toBe(1);
    s = updateStreak(s.streak, '2026-09-25');
    s = updateStreak(s.streak, '2026-09-26');
    expect(s.streak.current).toBe(3);
    expect(s.chest).toBe(true);
    expect(updateStreak(s.streak, '2026-09-26').extended).toBe(false);
  });

  it('se fissure après un jour manqué, se répare le lendemain, se casse après deux jours', () => {
    let s = updateStreak({ current: 2, lastDay: '2026-09-24', cracked: false }, '2026-09-26');
    expect(s.streak).toEqual({ current: 3, lastDay: '2026-09-26', cracked: true });
    s = updateStreak(s.streak, '2026-09-27');
    expect(s.streak).toEqual({ current: 4, lastDay: '2026-09-27', cracked: false });
    // Déjà fissuré et encore un jour manqué : on repart de 1.
    s = updateStreak({ current: 4, lastDay: '2026-09-27', cracked: true }, '2026-09-29');
    expect(s.streak.current).toBe(1);
    expect(updateStreak({ current: 5, lastDay: '2026-09-20', cracked: false }, '2026-09-24').streak.current).toBe(1);
  });
});

describe('répétition espacée', () => {
  it('reprogramme un item raté à J+1, J+3, J+7, J+15 puis le sort après 3 réussites', () => {
    let q = recordSpaced([], 'x', false, '2026-09-24');
    expect(q).toEqual([{ itemId: 'x', due: '2026-09-25', stage: 0, streak: 0 }]);
    q = recordSpaced(q, 'x', true, '2026-09-25');
    expect(q[0]).toMatchObject({ due: '2026-09-28', stage: 1, streak: 1 });
    q = recordSpaced(q, 'x', true, '2026-09-28');
    expect(q[0]).toMatchObject({ due: '2026-10-05', stage: 2, streak: 2 });
    q = recordSpaced(q, 'x', true, '2026-10-05');
    expect(q).toEqual([]);
  });

  it('remet un item raté au début, et ignore les items réussis hors file', () => {
    let q = recordSpaced([{ itemId: 'x', due: '2026-09-28', stage: 2, streak: 2 }], 'x', false, '2026-09-28');
    expect(q[0]).toMatchObject({ due: '2026-09-29', stage: 0, streak: 0 });
    q = recordSpaced(q, 'y', true, '2026-09-28');
    expect(q).toHaveLength(1);
    expect(dueItems(q, '2026-09-28')).toEqual([]);
    expect(dueItems(q, '2026-09-30')).toHaveLength(1);
  });
});

describe('adaptation', () => {
  it('monte après 2 bonnes sessions, descend après 2 faibles, jamais sous 1', () => {
    let t = adapt(undefined, 0.9, DEF.adaptive);
    expect(t).toEqual({ level: 1, recent: [0.9] });
    t = adapt(t, 0.95, DEF.adaptive);
    expect(t).toEqual({ level: 2, recent: [] });
    t = adapt(t, 0.4, DEF.adaptive);
    t = adapt(t, 0.3, DEF.adaptive);
    expect(t.level).toBe(1);
    t = adapt(t, 0.2, DEF.adaptive);
    t = adapt(t, 0.1, DEF.adaptive);
    expect(t.level).toBe(1);
  });
});

describe('completeExercise', () => {
  it('donne étoiles, blocs, XP et garde le meilleur', () => {
    const c = completeExercise(EMPTY_STATE, DEF, [ok('a'), ok('b'), ok('c'), ko('d')], '2026-09-24');
    expect(c.score).toBe(0.75);
    expect(c.stars).toBe(2);
    expect(c.blocks).toBe(3);
    expect(c.xp).toBe(10);
    expect(c.perfect).toBe(false);
    expect(c.state.inventory.bois).toBe(3);
    expect(c.state.progress[DEF.id]).toEqual({ stars: 2, attempts: 1, best: 0.75 });
    expect(c.state.spaced.map((s) => s.itemId)).toEqual(['foret-test-001:d']);

    const c2 = completeExercise(c.state, DEF, [ok('a'), ok('b'), ko('c'), ko('d')], '2026-09-24');
    expect(c2.newBest).toBe(false);
    expect(c2.state.progress[DEF.id]).toEqual({ stars: 2, attempts: 2, best: 0.75 });
  });

  it('bonus XP sans aide ni erreur, au moins 1 bloc dès une bonne réponse, 0 sinon', () => {
    const perfect = completeExercise(EMPTY_STATE, DEF, DEF.items.map((i) => ok(i.key)), '2026-09-24');
    expect(perfect).toMatchObject({ perfect: true, xp: 15, blocks: 4, stars: 3 });
    const one = completeExercise(EMPTY_STATE, DEF, [ok('a'), ko('b'), ko('c'), ko('d')], '2026-09-24');
    expect(one.blocks).toBe(1);
    const none = completeExercise(EMPTY_STATE, DEF, DEF.items.map((i) => ko(i.key)), '2026-09-24');
    expect(none.blocks).toBe(0);
    expect(none.xp).toBe(10);
  });

  it('ouvre un coffre au 3e jour d’affilée', () => {
    let state = EMPTY_STATE;
    for (const day of ['2026-09-24', '2026-09-25']) state = completeExercise(state, DEF, [ok('a')], day).state;
    const c = completeExercise(state, DEF, [ok('a')], '2026-09-26', () => 0);
    expect(c.chestBlock).toBe('bois');
    expect(c.state.chests).toBe(1);
    // 4 blocs par exercice sans faute (1 item juste = score 1), plus le coffre de 6.
    expect(c.state.inventory.bois).toBe(4 + 4 + 4 + 6);
  });
});

it('sanitizeState répare des données corrompues', () => {
  const s = sanitizeState({ progress: { x: { stars: 9, attempts: -1, best: 2 } }, inventory: { bois: '3', faux: 5 }, spaced: [{ itemId: 'a' }, 'rien'], streak: null });
  expect(s.progress.x).toEqual({ stars: 3, attempts: 0, best: 1 });
  expect(s.inventory).toEqual({ bois: 3 });
  expect(s.spaced).toEqual([]);
  expect(s.streak).toEqual(EMPTY_STATE.streak);
  expect(sanitizeState(undefined)).toEqual(EMPTY_STATE);
});
