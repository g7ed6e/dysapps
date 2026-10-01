import { exercisesOf } from '../exercises';
import { sanitizeState } from '../engine';
import { planCells, plansFor } from './plans';
import { NOMS_ARCHIPELS } from './archipelago';
import { nextDestination } from './destination';

const played = (biome: 'foret' | 'plaine', type: string) => ({ [exercisesOf(biome, type)[0].id]: { stars: 2, attempts: 1, best: 0.8 } });

it('au début, la destination est l’île du bonhomme, à explorer', () => {
  expect(nextDestination(sanitizeState({}), NOMS_ARCHIPELS)).toMatchObject({ island: 'foret', name: 'Forêt des sons', text: 'Une île à explorer : ses missions t’attendent.' });
});

it('une île où tout est prêt passe devant, puis une île pas encore explorée, puis l’objectif le plus proche', () => {
  const foretPlayed = { ...played('foret', 'rimes') };
  // Assez de bois pour la cabane : on va la poser.
  const cabane = plansFor('foret')[0].cells.length;
  const rich = sanitizeState({ progress: foretPlayed, inventory: { bois: cabane }, village: { at: 'foret' } });
  expect(nextDestination(rich, NOMS_ARCHIPELS)).toMatchObject({ island: 'foret', text: 'Tu as tout pour finir La cabane de Mousso : pose tes blocs.' });
  // Rien de prêt sur la Forêt jouée : une autre île ouverte, jamais jouée.
  const poor = sanitizeState({ progress: foretPlayed, village: { at: 'foret' } });
  expect(nextDestination(poor, NOMS_ARCHIPELS).island).not.toBe('foret');
  expect(nextDestination(poor, NOMS_ARCHIPELS).text).toBe('Une île à explorer : ses missions t’attendent.');
});

it('sans objectif, la destination est le port, avec ce qu’il faut pour le village', () => {
  const plans = Object.fromEntries(['foret', 'plaine'].flatMap((b) => plansFor(b as never)).map((p) => [p.id, planCells(p).map((c) => c.key)]));
  const state = sanitizeState({ progress: { ...played('foret', 'rimes'), ...played('plaine', 'tables') }, village: { at: 'foret', plans, bridges: ['foret-mine', 'foret-ferme', 'foret-horloge', 'plaine-riviere', 'plaine-volcan'] } });
  expect(nextDestination(state, NOMS_ARCHIPELS).text).toMatch(/\.$/);
});
