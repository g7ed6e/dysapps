import {
  EMPTY_STATE,
  adapt,
  addDays,
  completeExercise,
  completePortalQuest,
  daysBetween,
  dueItems,
  moveAvatar,
  recordSpaced,
  sanitizeState,
  scoreOf,
  starsFor,
  updateStreak,
} from './engine';
import type { ExerciseDef, ItemResult } from './exercises/types';

const DEF: ExerciseDef = {
  id: 'foret-test-001',
  biome: 'french-6e-phonology',
  type: 'qcm',
  level: 1,
  instruction: 'Test',
  items: [{ key: 'a' }, { key: 'b' }, { key: 'c' }, { key: 'd' }],
  feedback: { correct: 'Bravo', wrong: 'Non : {word}' },
  reward: { block: 'french-6e-phonology', amount: 4, xp: 10 },
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
    // 3 blocs pour le score, +1 pour deux étoiles, +2 pour la première fois.
    expect(c.blocks).toBe(6);
    expect(c.bonus).toEqual({ stars: 1, first: 2 });
    expect(c.xp).toBe(10);
    expect(c.perfect).toBe(false);
    expect(c.state.stock['french-6e-phonology']).toBe(6);
    expect(c.state.progress[DEF.id]).toEqual({ stars: 2, attempts: 1, best: 0.75 });
    expect(c.state.spaced.map((s) => s.itemId)).toEqual(['foret-test-001:d']);

    const c2 = completeExercise(c.state, DEF, [ok('a'), ok('b'), ko('c'), ko('d')], '2026-09-24');
    expect(c2.newBest).toBe(false);
    // Rejouée : plus de bonus « première fois », une étoile : pas de bonus d'étoiles.
    expect(c2.bonus).toEqual({ stars: 0, first: 0 });
    expect(c2.blocks).toBe(2);
    expect(c2.state.progress[DEF.id]).toEqual({ stars: 2, attempts: 2, best: 0.75 });
  });

  it('bonus XP sans aide ni erreur, au moins 1 bloc dès une bonne réponse, 0 sinon', () => {
    const perfect = completeExercise(
      EMPTY_STATE,
      DEF,
      DEF.items.map((i) => ok(i.key)),
      '2026-09-24',
    );
    expect(perfect).toMatchObject({ perfect: true, xp: 15, blocks: 8, stars: 3, bonus: { stars: 2, first: 2 } });
    const one = completeExercise(EMPTY_STATE, DEF, [ok('a'), ko('b'), ko('c'), ko('d')], '2026-09-24');
    // Une seule bonne réponse : 1 bloc, plus les 2 de la première fois.
    expect(one.blocks).toBe(3);
    const none = completeExercise(
      EMPTY_STATE,
      DEF,
      DEF.items.map((i) => ko(i.key)),
      '2026-09-24',
    );
    expect(none.blocks).toBe(0);
    expect(none.xp).toBe(10);
  });

  it('une révision finie rapporte toujours autant, quel que soit le score : ni le joker ni les erreurs n’en retirent (GD-6)', () => {
    // La première partie rate « d » : elle revient le lendemain.
    const hier = completeExercise(EMPTY_STATE, DEF, [ok('a'), ok('b'), ok('c'), ko('d')], '2026-09-24').state;
    const jour = '2026-09-25';
    // Toutes fausses, avec le joker et des erreurs, ou sans faute : la base de la mission et le bonus de trois étoiles.
    const ratee = completeExercise(hier, DEF, DEF.items.map((i) => ({ ...ko(i.key), attempts: 2, usedHelp: true })), jour);
    const parfaite = completeExercise(hier, DEF, DEF.items.map((i) => ok(i.key)), jour);
    for (const c of [ratee, parfaite]) {
      expect(c.revision).toBe(true);
      expect(c.blocks).toBe(DEF.reward.amount + 2);
      // Aucun compteur de bonus à montrer.
      expect(c.bonus).toEqual({ stars: 0, first: 0 });
      expect(c.state.stock['french-6e-phonology']).toBe((hier.stock['french-6e-phonology'] ?? 0) + DEF.reward.amount + 2);
    }
    // Rejouée sans question due : le barème habituel (rien sans bonne réponse).
    const rejouee = completeExercise(parfaite.state, DEF, DEF.items.map((i) => ko(i.key)), jour);
    expect(rejouee.revision).toBe(false);
    expect(rejouee.blocks).toBe(0);
  });

  it('ouvre un coffre au 3e jour d’affilée', () => {
    let state = EMPTY_STATE;
    for (const day of ['2026-09-24', '2026-09-25']) state = completeExercise(state, DEF, [ok('a')], day).state;
    const c = completeExercise(state, DEF, [ok('a')], '2026-09-26', () => 0);
    expect(c.chestBlock).toBe('french-6e-phonology');
    expect(c.state.chests).toBe(1);
    // 4 blocs par exercice sans faute (1 item juste = score 1) +2 pour trois étoiles, +2 la première fois, plus le coffre de 6.
    expect(c.state.stock['french-6e-phonology']).toBe(4 + 2 + 2 + (4 + 2) + (4 + 2) + 6);
    // Le coffre ne donne que des blocs d'îles : jamais d'or, de cristal ni de bloc de finition (GD-6).
    const last = completeExercise(state, DEF, [ok('a')], '2026-09-26', () => 0.9999);
    expect(['trophy-gold', 'trophy-crystal', 'roof', 'door', 'lantern', 'fence', 'stairs']).not.toContain(last.chestBlock);
  });
});

it('sanitizeState répare des données corrompues', () => {
  const s = sanitizeState({
    progress: { x: { stars: 9, attempts: -1, best: 2 } },
    stock: { 'french-6e-phonology': '3', faux: 5 },
    spaced: [{ itemId: 'a' }, 'rien'],
    streak: null,
  });
  expect(s.progress.x).toEqual({ stars: 3, attempts: 0, best: 1 });
  expect(s.stock).toEqual({ 'french-6e-phonology': 3 });
  expect(s.spaced).toEqual([]);
  expect(s.streak).toEqual(EMPTY_STATE.streak);
  expect(sanitizeState(undefined)).toEqual(EMPTY_STATE);
});

it('sanitizeState rend à l’inventaire les blocs de l’ancien chantier et de l’ancienne zone libre', () => {
  const s = sanitizeState({
    inventory: { bois: 1 },
    build: [
      { x: 1, y: 1, z: 0, block: 'bois' },
      { x: 0, y: 0, z: 0, block: 'neige' },
    ],
    village: {
      placed: {
        foret: [
          { x: 2, y: 1, z: 0, block: 'bois' },
          { x: 2, y: 1, z: 1, block: 'pierre' },
        ],
        nulle: [],
      },
    },
  });
  expect(s.stock).toEqual({ 'french-6e-phonology': 3, 'french-6e-letter-confusion': 1 });
  expect(s.world).toEqual({ parts: {}, log: [], links: [] });
});

it('le bonhomme se souvient de son île, seulement si elle est ouverte', () => {
  expect(sanitizeState({ world: { place: 'french-6e-phonology' } }).world.place).toBe('french-6e-phonology');
  expect(sanitizeState({ world: { place: 'french-6e-letter-confusion' } }).world.place).toBeUndefined();
  expect(sanitizeState({ world: { place: 'french-6e-letter-confusion', links: ['french-6e-phonology-french-6e-letter-confusion'] } }).world.place).toBe('french-6e-letter-confusion');
  expect(sanitizeState({ world: { place: 'nulle-part' } }).world.place).toBeUndefined();
  const moved = moveAvatar(EMPTY_STATE, 'maths-6e-calculation');
  expect(moved.world.place).toBe('maths-6e-calculation');
  expect(moveAvatar(moved, 'french-6e-letter-confusion')).toBe(moved);
  expect(moveAvatar(moved, 'maths-6e-calculation')).toBe(moved);
});

it('une mission du portail (l’école du village) rapporte des blocs de l’île de l’école, au barème des missions d’île', () => {
  // Toute juste la première fois : 4 blocs, +2 pour trois étoiles, +2 la première fois ; le streak démarre.
  const first = completePortalQuest(EMPTY_STATE, 1, true, '2026-09-27');
  expect(first).toMatchObject({ school: 'french-6e-phonology', block: 'french-6e-phonology', blocks: 8, bonus: { stars: 2, first: 2 } });
  expect(first.state.stock['french-6e-phonology']).toBe(8);
  expect(first.state.streak.current).toBe(1);
  // À moitié : 2 blocs, rien en plus ; aucune bonne réponse : rien.
  expect(completePortalQuest(EMPTY_STATE, 0.5, false, '2026-09-27').blocks).toBe(2);
  expect(completePortalQuest(EMPTY_STATE, 0, true, '2026-09-27').blocks).toBe(0);
  // Les étoiles et les Gardiens ne bougent pas.
  expect(first.state.progress).toEqual({});
  // Dans les Îles Brumeuses, l'école est au Marché : des blocs de toile.
  const away = { ...EMPTY_STATE, world: { ...EMPTY_STATE.world, links: ['passage-5e'], place: 'maths-5e-proportionality' as const } };
  expect(completePortalQuest(away, 1, false, '2026-09-27')).toMatchObject({ school: 'maths-5e-proportionality', block: 'maths-5e-proportionality', blocks: 6 });
});

describe('les sauvegardes d’avant le nouveau dessin des bâtiments', () => {
  it('un plan terminé avec l’ancien dessin reste terminé ; les plans n’ont plus de coffre (GD-6), rien ne s’ajoute ni ne se perd', async () => {
    const { planV1 } = await import('./world/plansV1');
    const { getPlan, planCells } = await import('./world/plans');
    const old = planV1('french-6e-phonology-1')!;
    const state = sanitizeState({ village: { plans: { 'french-6e-phonology-1': [...old.blocks.keys()] } }, inventory: { 'roof': 9, 'lantern': 1, 'door': 1 } });
    const cabane = getPlan('french-6e-phonology-1')!;
    expect(state.world.parts['french-6e-phonology-1']).toEqual(planCells(cabane).map((c) => c.key));
    expect(cabane.reward.chest).toEqual({});
    expect(state.stock).toEqual({ 'roof': 9, 'lantern': 1, 'door': 1 });
  });

  it('un plan commencé avec l’ancien dessin garde ses cases encore valables et rend les autres blocs', async () => {
    const { planV1 } = await import('./world/plansV1');
    const { getPlan, planCells } = await import('./world/plans');
    const oldKeys = [...planV1('french-6e-phonology-1')!.blocks.keys()].slice(0, 6);
    const valid = new Set(planCells(getPlan('french-6e-phonology-1')!).map((c) => c.key));
    const state = sanitizeState({ village: { plans: { 'french-6e-phonology-1': oldKeys } } });
    const kept = oldKeys.filter((k) => valid.has(k));
    expect(state.world.parts['french-6e-phonology-1'] ?? []).toEqual(kept);
    expect(state.stock['french-6e-phonology'] ?? 0).toBe(oldKeys.length - kept.length);
  });

  it('une sauvegarde du nouveau dessin ne change pas', async () => {
    const { getPlan, planCells } = await import('./world/plans');
    const keys = planCells(getPlan('french-6e-phonology-1')!).map((c) => c.key);
    const partial = sanitizeState({ world: { parts: { 'french-6e-phonology-1': keys.slice(0, 20) } }, stock: { 'french-6e-phonology': 3 } });
    expect(partial.world.parts['french-6e-phonology-1']).toEqual(keys.slice(0, 20));
    expect(partial.stock).toEqual({ 'french-6e-phonology': 3 });
    const done = sanitizeState({ world: { parts: { 'french-6e-phonology-1': keys } } });
    expect(done.stock).toEqual({});
  });
});
