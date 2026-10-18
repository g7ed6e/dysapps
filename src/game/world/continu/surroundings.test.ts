// Les abords des scénettes : chaque lieu du registre tient sous le plafond commun, quel que soit l'état du lieu, autour
// du sol de sa scène tel que le décor de près le porte. Sans Three.js.
import { describe, expect, it } from 'vitest';
import type { PlaceId } from './plan6e';
import { scenetteSurroundings } from './scenette';
import { SURROUNDINGS, SURROUNDINGS_MAX } from './surroundings';

const places = Object.keys(SURROUNDINGS) as PlaceId[];

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
});
