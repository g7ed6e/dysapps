// Les abords des scénettes : chaque lieu du registre tient sous le plafond commun, quel que soit l'état du lieu, autour
// du sol de sa scène tel que le décor de près le porte. Sans Three.js.
import { describe, expect, it } from 'vitest';
import { OPEN_WORLD_BUDGET, openWorldCost } from './budget';
import { HABITANT_TRIANGLES } from './habitants';
import type { PlaceId } from './plan6e';
import { scenetteSetting, scenetteSurroundings } from './scenette';
import { SURROUNDINGS, SURROUNDINGS_MAX } from './surroundings';

const places = Object.keys(SURROUNDINGS) as PlaceId[];

/** Ce que l'enveloppe du monde laisse au poste de la scénette : le poste, plus la marge du monde (compté une fois). */
let allowed: number | undefined;
function allowance(): number {
  if (allowed === undefined) {
    const cost = openWorldCost(0);
    const total = cost.reduce((s, c) => s + c.triangles, 0);
    allowed = cost.find((c) => c.poste === 'scénette')!.triangles + OPEN_WORLD_BUDGET.triangles - total;
  }
  return allowed;
}

describe('Les abords des scénettes', () => {
  it('ont un registre non vide', () => {
    expect(places.length).toBeGreaterThan(0);
  });

  it.each(places)('%s : tiennent sous le plafond commun, dans chaque état du lieu', (place) => {
    for (const posed of [false, true])
      for (const open of [false, true]) {
        const f = scenetteSurroundings(place, open, posed);
        expect(f.triangles).toBeGreaterThan(0);
        expect(f.triangles).toBeLessThanOrEqual(SURROUNDINGS_MAX);
      }
  });

  // Le test de l'enveloppe (continu.test.ts) compte chaque lieu dans un seul état (posé, ou à sa réussite) : ce test-ci,
  // le plus simple qui protège aussi un lieu au gros décor de près de base, reprend chaque état de chaque lieu du registre
  // contre ce que l'enveloppe laisse au poste de la scénette (le plafond commun des abords n'y suffit pas).
  it.each(places)('%s : sa scénette au pire tient dans ce que l’enveloppe du monde laisse à la scénette', (place) => {
    const allowed = allowance();
    for (const posed of [false, true])
      for (const open of [false, true]) expect(scenetteSetting(place, open, posed).triangles + HABITANT_TRIANGLES).toBeLessThanOrEqual(allowed);
  });
});
