import { describe, expect, it } from 'vitest';
import { ALL_PLANS, hasScenette, placeById, planFor } from '../../world/continu/levelPlan';
import { measureTour } from './measureTour';

describe('le tour de la mesure automatique dans le monde ouvert', () => {
  it('garde au 6e le tour de la première mesure', () => {
    expect(measureTour(planFor('6e'))).toEqual({ depart: { id: 'phare', nom: 'Phare' }, arrivee: { id: 'beacons', nom: 'Balises' }, scene: { id: 'quais', nom: 'Quais' } });
  });

  it('donne à chaque niveau une marche entre deux de ses lieux et une scénette', () => {
    for (const plan of ALL_PLANS) {
      const tour = measureTour(plan);
      const lieux = plan.places.map((p) => p.id);
      expect(lieux).toContain(tour.depart.id);
      expect(lieux).toContain(tour.arrivee.id);
      expect(tour.arrivee.id).not.toBe(tour.depart.id);
      expect(tour.scene && hasScenette(tour.scene.id) && placeById(tour.scene.id).scenes.length > 0).toBe(true);
    }
  });
});
