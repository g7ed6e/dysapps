import { EMPTY_STATE, sanitizeState } from '../engine';
import { nextGoal } from './goals';
import { planCells, plansFor } from './plans';
import { overviewBounds, worldBounds } from './terrain';

it('le prochain objectif dit ce qu’il manque pour le plan, ou pour l’ouvrage le moins cher', () => {
  const fresh = sanitizeState({});
  expect(nextGoal(fresh, 'foret')).toBe('Encore 16 bois pour La cabane de Mousso, ou 3 blocs pour le sentier vers Mine des lettres.');
  const some = sanitizeState({ inventory: { bois: 5 } });
  expect(nextGoal(some, 'foret')).toBe('Encore 11 bois pour La cabane de Mousso, ou tu peux construire le sentier vers Mine des lettres.');
  const rich = sanitizeState({ inventory: { bois: 20 } });
  expect(nextGoal(rich, 'foret')).toBe('Tu as tout pour finir La cabane de Mousso : pose tes blocs, ou tu peux construire le sentier vers Mine des lettres.');
  // Tous les plans posés et tous les ouvrages construits : plus rien à dire.
  const plans = Object.fromEntries(plansFor('foret').map((p) => [p.id, planCells(p).map((c) => c.key)]));
  const done = sanitizeState({ village: { plans, bridges: ['foret-mine', 'foret-ferme', 'foret-carrefour'] } });
  expect(nextGoal(done, 'foret')).toBeNull();
  expect(nextGoal(EMPTY_STATE, 'mine')).toContain('pour La forge de Tunel');
});

it('la vue d’ensemble cadre les îles ouvertes et leurs voisines, puis s’élargit', () => {
  const start = overviewBounds([]);
  const all = worldBounds();
  expect(start.maxX - start.minX).toBeLessThan(all.maxX - all.minX);
  expect(start.maxY - start.minY).toBeLessThan(all.maxY - all.minY);
  const later = overviewBounds(['foret-mine', 'mine-carriere']);
  expect(later.maxX).toBeGreaterThan(start.maxX);
});
