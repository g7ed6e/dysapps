// Le Rafiot des Ferrailleurs au 6e (GD-23, lot 2 ; GD-27 ; GD-28) : sur l'eau, près d'un lieu éteint, loin de la passe
// de la Nef et du quai de l'Escale ; il recule quand son lieu est rallumé, et part quand les trois le sont ; une poignée de
// pièces, aucune fumée ; dans l'enveloppe du 6e sans hausse. Le Rafiot du 4e ne change pas (crique4e.test.ts).
import { describe, expect, it } from 'vitest';
import { insidePolygon } from './geometry';
import { levelWorld } from './levelWorld';
import { PASS, PORT, placeById, type PlaceId } from './plan6e';
import { RAFIOT_PIECES } from './rafiot';
import { RAFIOT_6E_TRIANGLES_MAX, RAFIOT_PIECES_6E, RAFIOT_SPOTS_6E, rafiot6eFacets, rafiotSpot6e } from './rafiot6e';
import { heightAt, landDistance } from './terrain';

const none = () => false;
const only = (...ids: PlaceId[]) => (id: PlaceId) => ids.includes(id);

describe('Le Rafiot à quai au 6e', () => {
  it('trois mouillages, chacun sur l’eau, à moins de trente pas de son lieu, loin de la passe de la Nef et du quai de l’Escale', () => {
    expect(RAFIOT_SPOTS_6E.map((s) => s.place)).toEqual(['ruins', 'mangrove', 'ferry']);
    const quay = PORT.toWorld(0, -9);
    for (const s of RAFIOT_SPOTS_6E) {
      expect(heightAt(s.at), s.place).toBeLessThan(-1);
      expect(landDistance(s.at), s.place).toBeLessThan(-5);
      const c = placeById(s.place).center;
      expect(Math.hypot(s.at.x - c.x, s.at.z - c.z), s.place).toBeLessThan(30);
      expect(Math.hypot(s.at.x - c.x, s.at.z - c.z), s.place).toBeGreaterThan(10);
      expect(insidePolygon(s.at, PASS), s.place).toBe(false);
      expect(Math.hypot(s.at.x - quay.x, s.at.z - quay.z), s.place).toBeGreaterThan(25);
    }
  });

  it('amarré près du premier lieu éteint ; il recule quand ce lieu est rallumé ; parti quand les trois le sont', () => {
    expect(rafiotSpot6e(none)?.place).toBe('ruins');
    expect(rafiotSpot6e(only('ruins'))?.place).toBe('mangrove');
    expect(rafiotSpot6e(only('ruins', 'mangrove'))?.place).toBe('ferry');
    expect(rafiotSpot6e(only('ruins', 'mangrove', 'ferry'))).toBeNull();
    // Un autre lieu rallumé ne le fait pas bouger.
    expect(rafiotSpot6e(only('phare', 'quais'))?.place).toBe('ruins');
    expect(rafiot6eFacets(only('ruins', 'mangrove', 'ferry'))).toBeNull();
    expect(levelWorld('6e').rafiot!(none)).toBe(rafiot6eFacets(none));
    for (const l of ['5e', '4e', '3e'] as const) expect(levelWorld(l).rafiot).toBeUndefined();
  });

  it('une poignée de pièces, jamais une par lieu ; sous 600 triangles, le même dessin à chaque mouillage', () => {
    expect(RAFIOT_PIECES_6E.length).toBeGreaterThanOrEqual(2);
    expect(RAFIOT_PIECES_6E.length).toBeLessThan(RAFIOT_PIECES.length);
    for (const spot of [none, only('ruins'), only('ruins', 'mangrove')]) {
      const f = rafiot6eFacets(spot)!;
      expect(f.triangles).toBeLessThanOrEqual(RAFIOT_6E_TRIANGLES_MAX);
      expect(f.triangles).toBe(rafiot6eFacets(none)!.triangles);
    }
    // Le dessin, une fois par mouillage.
    expect(rafiot6eFacets(none)).toBe(rafiot6eFacets(none));
  });

  it('est bien là où il est dit : ses sommets autour de son mouillage, au-dessus de l’eau, et aucun au-dessus de deux fois sa cabine (sans fumée)', () => {
    const spot = RAFIOT_SPOTS_6E[0];
    const f = rafiot6eFacets(none)!;
    const pos = f.positions;
    let top = -Infinity;
    for (let i = 0; i < pos.length; i += 3) {
      expect(Math.hypot(pos[i] - spot.at.x, pos[i + 2] - spot.at.z)).toBeLessThan(6);
      top = Math.max(top, pos[i + 1]);
    }
    expect(top).toBeLessThan(4.5);
    expect(top).toBeGreaterThan(2.5);
  });
});
