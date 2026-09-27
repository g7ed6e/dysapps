import { exercisesOf } from '../exercises';
import { sanitizeState } from '../engine';
import { planCells, plansFor } from './plans';
import { islandState } from './islandState';

const played = { [exercisesOf('foret', 'rimes')[0].id]: { stars: 2, attempts: 1, best: 0.8 } };

it('une île a quatre états, chacun avec son mot et son icône', () => {
  const fresh = sanitizeState({});
  expect(islandState(fresh, 'foret')).toMatchObject({ id: 'a-explorer', name: 'À explorer', icon: 'compass' });
  expect(islandState(fresh, 'carriere')).toMatchObject({ id: 'fermee', name: 'Fermée', icon: 'lock' });
  // Une mission jouée : l'île est en chantier.
  expect(islandState(sanitizeState({ progress: played }), 'foret')).toMatchObject({ id: 'en-chantier', name: 'En chantier' });
  // Ses trois plans terminés : restaurée, même sans mission jouée (un ancien plan compte).
  const plans = Object.fromEntries(plansFor('foret').map((p) => [p.id, planCells(p).map((c) => c.key)]));
  expect(islandState(sanitizeState({ progress: played, village: { plans } }), 'foret')).toMatchObject({ id: 'restauree', name: 'Restaurée' });
});
