import { exercisesOf } from '../exercises';
import { sanitizeState } from '../engine';
import { planCells, plansFor } from './plans';
import { islandState } from './islandState';

const played = { [exercisesOf('foret', 'rimes')[0].id]: { stars: 2, attempts: 1, best: 0.8 } };

it('une île a quatre états, chacun avec son icône (le mot est un texte d’univers)', () => {
  const fresh = sanitizeState({});
  expect(islandState(fresh, 'foret')).toMatchObject({ id: 'a-explorer', icon: 'compass' });
  expect(islandState(fresh, 'carriere')).toMatchObject({ id: 'fermee', icon: 'lock' });
  // Une mission jouée : l'île est en chantier.
  expect(islandState(sanitizeState({ progress: played }), 'foret')).toMatchObject({ id: 'en-chantier' });
  // Ses trois plans terminés : restaurée, même sans mission jouée (un ancien plan compte).
  const plans = Object.fromEntries(plansFor('foret').map((p) => [p.id, planCells(p).map((c) => c.key)]));
  expect(islandState(sanitizeState({ progress: played, world: { parts: plans } }), 'foret')).toMatchObject({ id: 'restauree' });
});
