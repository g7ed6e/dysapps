import { biomesOf, type BiomeId } from '../blocland/biomes';
import { EMPTY_STATE, type BloclandState } from '../blocland/engine';
import { exercisesOf } from '../blocland/exercises';
import { REWORK_SHOWN, subjectProgress } from './subjectProgress';

/** Une quête jouée : sa première variante, avec ses étoiles et son meilleur score. */
const played = (biome: BiomeId, type: string, stars: 0 | 1 | 2 | 3, best: number) => ({
  [exercisesOf(biome, type)[0].id]: { stars, attempts: 1, best },
});
const blocland = (progress: BloclandState['progress'], bridges: string[] = []): BloclandState => ({
  ...EMPTY_STATE,
  progress,
  village: { ...EMPTY_STATE.village, bridges },
});
const app = (bestScore: number) => ({ sessions: 1, bestScore, lastPlayed: null });

it('compte les étoiles sur toutes les îles de la matière, de la 6e à la 3e', () => {
  const quests = biomesOf('francais').reduce((n, b) => n + b.exercises.length, 0);
  const empty = subjectProgress('francais', {}, EMPTY_STATE);
  expect(empty.stars).toEqual({ earned: 0, max: quests * 3 });
  expect(empty.rework).toEqual([]);
  expect(empty.islands.total).toBe(biomesOf('francais').length);
  expect(empty.islands.open).toBeGreaterThanOrEqual(1);
  expect(empty.guardians).toEqual({ beaten: 0, total: biomesOf('francais').length });

  const some = subjectProgress('francais', {}, blocland({ ...played('foret', 'rimes', 2, 0.75), ...played('foret', 'chasse-son', 3, 0.95) }));
  expect(some.stars.earned).toBe(5);
});

it('propose de retravailler les quêtes jouées sous 3 étoiles, les plus faibles d’abord', () => {
  const r = subjectProgress(
    'francais',
    {},
    blocland({
      ...played('foret', 'rimes', 2, 0.75),
      ...played('foret', 'abattage', 1, 0.4),
      ...played('foret', 'chasse-son', 3, 0.95),
    }),
  );
  expect(r.rework.map((q) => q.title)).toEqual(['Abattage syllabique', 'Rimes-échelle']);
  expect(r.rework[0]).toMatchObject({ kind: 'quete', where: 'Forêt des sons', stars: 1, href: '/aventure/foret/abattage' });
  expect(r.reworkTotal).toBe(2);
});

it('ne propose pas une quête d’une île fermée, ni une quête jamais jouée', () => {
  const closed = subjectProgress('francais', {}, blocland(played('mine', 'filon', 1, 0.3)));
  expect(closed.rework).toEqual([]);
  // Le même résultat, une fois l'île ouverte par son sentier.
  const open = subjectProgress('francais', {}, blocland(played('mine', 'filon', 1, 0.3), ['foret-mine']));
  expect(open.rework.map((q) => q.href)).toEqual(['/aventure/mine/filon']);
});

it('compte les records des applis, et propose celles sous 70 %', () => {
  const r = subjectProgress('maths', { tables: app(90), 'fractions:niveau-1': app(55) }, EMPTY_STATE);
  expect(r.apps.find((a) => a.id === 'tables')?.record).toBe(90);
  expect(r.apps.find((a) => a.id === 'decimaux')?.record).toBeUndefined();
  expect(r.rework).toEqual([expect.objectContaining({ kind: 'appli', id: 'fractions', record: 55, href: '/app/fractions' })]);
  // Une quête plus faible passe devant l'appli.
  const mixed = subjectProgress('maths', { fractions: app(55) }, blocland(played('plaine', 'tables', 1, 0.3)));
  expect(mixed.rework.map((q) => q.id)).toEqual(['plaine:tables', 'fractions']);
});

it('ne mélange pas les matières, et montre au plus cinq quêtes à reprendre', () => {
  const lots = blocland(
    {
      ...played('plaine', 'tables', 1, 0.3),
      ...played('plaine', 'complements', 1, 0.35),
      ...played('plaine', 'doubles', 2, 0.72),
    },
    [],
  );
  const apps = { tables: app(10), fractions: app(20), decimaux: app(30), homophones: app(5) };
  const maths = subjectProgress('maths', apps, lots);
  expect(maths.reworkTotal).toBe(6);
  expect(maths.rework).toHaveLength(REWORK_SHOWN);
  expect(maths.rework.map((q) => q.id)).not.toContain('homophones');
  expect(subjectProgress('francais', apps, lots).rework.map((q) => q.id)).toEqual(['homophones']);
});
