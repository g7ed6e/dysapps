import { exercisesOf } from '../exercises';
import { sanitizeState } from '../engine';
import { planCells, plansFor } from './plans';
import { NOMS_ARCHIPELS } from './archipelago';
import { textesDe } from '../../univers';
import { nextDestination } from './destination';

const mots = textesDe('blocland').libelles;

const played = (biome: 'french-6e-phonology' | 'maths-6e-calculation', type: string) => ({ [exercisesOf(biome, type)[0].id]: { stars: 2, attempts: 1, best: 0.8 } });

it('au début, la destination est l’île du bonhomme, à explorer', () => {
  expect(nextDestination(sanitizeState({}), NOMS_ARCHIPELS, mots)).toMatchObject({ island: 'french-6e-phonology', name: 'Forêt des sons', text: 'Une île à explorer : ses missions t’attendent.' });
});

it('une île où tout est prêt passe devant, puis une île pas encore explorée, puis l’objectif le plus proche', () => {
  const foretPlayed = { ...played('french-6e-phonology', 'rhymes') };
  // Assez de bois pour un ouvrage qui part de la Forêt : on va le construire (le bâtiment, lui, se pose tout seul : GD-6).
  const rich = sanitizeState({ progress: foretPlayed, stock: { 'french-6e-phonology': 5 }, world: { place: 'french-6e-phonology' } });
  expect(nextDestination(rich, NOMS_ARCHIPELS, mots)).toMatchObject({ island: 'french-6e-phonology', text: expect.stringMatching(/^Tu peux construire /) });
  // Rien de prêt sur la Forêt jouée : une autre île ouverte, jamais jouée.
  const poor = sanitizeState({ progress: foretPlayed, world: { place: 'french-6e-phonology' } });
  expect(nextDestination(poor, NOMS_ARCHIPELS, mots).island).not.toBe('french-6e-phonology');
  expect(nextDestination(poor, NOMS_ARCHIPELS, mots).text).toBe('Une île à explorer : ses missions t’attendent.');
});

it('sans objectif, la destination est le port, avec ce qu’il faut pour le village', () => {
  const plans = Object.fromEntries(['french-6e-phonology', 'maths-6e-calculation'].flatMap((b) => plansFor(b as never)).map((p) => [p.id, planCells(p).map((c) => c.key)]));
  const state = sanitizeState({ progress: { ...played('french-6e-phonology', 'rhymes'), ...played('maths-6e-calculation', 'times-tables') }, world: { place: 'french-6e-phonology', parts: plans, links: ['french-6e-phonology-french-6e-letter-confusion', 'french-6e-phonology-french-6e-grammar-spelling', 'french-6e-phonology-english-6e-grammar', 'maths-6e-calculation-maths-6e-fractions', 'maths-6e-calculation-maths-6e-decimals'] } });
  expect(nextDestination(state, NOMS_ARCHIPELS, mots).text).toMatch(/\.$/);
});
