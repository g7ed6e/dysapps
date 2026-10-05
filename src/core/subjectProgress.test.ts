import { biomesOf, type BiomeId } from '../game/biomes';
import { EMPTY_STATE, type GameState } from '../game/engine';
import { exercisesOf } from '../game/exercises';
import { REWORK_SHOWN, subjectProgress } from './subjectProgress';

/** Une mission jouée : sa première variante, avec ses étoiles et son meilleur score. */
const played = (biome: BiomeId, type: string, stars: 0 | 1 | 2 | 3, best: number) => ({
  [exercisesOf(biome, type)[0].id]: { stars, attempts: 1, best },
});
const blocland = (progress: GameState['progress'], bridges: string[] = []): GameState => ({
  ...EMPTY_STATE,
  progress,
  world: { ...EMPTY_STATE.world, links: bridges },
});
const app = (bestScore: number) => ({ sessions: 1, bestScore, lastPlayed: null });

it('compte les étoiles sur toutes les îles de la matière, de la 6e à la 3e', () => {
  const quests = biomesOf('french').reduce((n, b) => n + b.exercises.length, 0);
  const empty = subjectProgress('french', {}, EMPTY_STATE);
  expect(empty.stars).toEqual({ earned: 0, max: quests * 3 });
  expect(empty.rework).toEqual([]);
  expect(empty.islands.total).toBe(biomesOf('french').length);
  expect(empty.islands.open).toBeGreaterThanOrEqual(1);
  expect(empty.guardians).toEqual({ beaten: 0, total: biomesOf('french').length });

  const some = subjectProgress('french', {}, blocland({ ...played('french-6e-phonology', 'rhymes', 2, 0.75), ...played('french-6e-phonology', 'sound-hunt', 3, 0.95) }));
  expect(some.stars.earned).toBe(5);
});

it('propose de retravailler les missions jouées sous 3 étoiles, les plus faibles d’abord', () => {
  const r = subjectProgress(
    'french',
    {},
    blocland({
      ...played('french-6e-phonology', 'rhymes', 2, 0.75),
      ...played('french-6e-phonology', 'syllables', 1, 0.4),
      ...played('french-6e-phonology', 'sound-hunt', 3, 0.95),
    }),
  );
  expect(r.rework.map((q) => q.title)).toEqual(['Abattage syllabique', 'Rimes-échelle']);
  expect(r.rework[0]).toMatchObject({ kind: 'quete', where: 'Forêt des sons', stars: 1, href: '/adventure/french-6e-phonology/syllables' });
  expect(r.reworkTotal).toBe(2);
});

it('ne propose pas une mission d’une île fermée, ni une mission jamais jouée', () => {
  const closed = subjectProgress('french', {}, blocland(played('french-6e-letter-confusion', 'letter-pairs', 1, 0.3)));
  expect(closed.rework).toEqual([]);
  // Le même résultat, une fois l'île ouverte par son sentier.
  const open = subjectProgress('french', {}, blocland(played('french-6e-letter-confusion', 'letter-pairs', 1, 0.3), ['french-6e-phonology-french-6e-letter-confusion']));
  expect(open.rework.map((q) => q.href)).toEqual(['/adventure/french-6e-letter-confusion/letter-pairs']);
});

it('compte les records des applis, et propose celles sous 70 %', () => {
  const r = subjectProgress('maths', { tables: app(90), 'fractions:niveau-1': app(55) }, EMPTY_STATE);
  expect(r.apps.find((a) => a.id === 'tables')?.record).toBe(90);
  expect(r.apps.find((a) => a.id === 'decimaux')?.record).toBeUndefined();
  expect(r.rework).toEqual([expect.objectContaining({ kind: 'appli', id: 'fractions', record: 55, href: '/app/fractions' })]);
  // Une mission plus faible passe devant l'appli.
  const mixed = subjectProgress('maths', { fractions: app(55) }, blocland(played('maths-6e-calculation', 'times-tables', 1, 0.3)));
  expect(mixed.rework.map((q) => q.id)).toEqual(['maths-6e-calculation:times-tables', 'fractions']);
});

it('ne mélange pas les matières, et montre au plus cinq missions à reprendre', () => {
  const lots = blocland(
    {
      ...played('maths-6e-calculation', 'times-tables', 1, 0.3),
      ...played('maths-6e-calculation', 'make-ten', 1, 0.35),
      ...played('maths-6e-calculation', 'doubles-halves', 2, 0.72),
    },
    [],
  );
  const apps = { tables: app(10), fractions: app(20), decimaux: app(30), homophones: app(5) };
  const maths = subjectProgress('maths', apps, lots);
  expect(maths.reworkTotal).toBe(6);
  expect(maths.rework).toHaveLength(REWORK_SHOWN);
  expect(maths.rework.map((q) => q.id)).not.toContain('homophones');
  expect(subjectProgress('french', apps, lots).rework.map((q) => q.id)).toEqual(['homophones']);
});
