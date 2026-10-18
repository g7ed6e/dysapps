// Les abords de la scénette du Phare : le chantier au pied de la tour, la potence et l'échelle de la galerie posée ; rien
// de haut devant la caméra de face, dans le tour où la rangée des cloches se pose, ni sous les pieds de Kéo et de la
// gardienne (leur poids : ./surroundings.test.ts). Sans Three.js.
import { describe, expect, it } from 'vitest';
import type { Facets } from './facets';
import { PHARE_SURROUNDINGS } from './phareSurroundings';
import { placeById } from './plan6e';
import { scenetteHabitant, scenetteKeo, scenetteSurroundings } from './scenette';
import { heightAt, standingHeight } from './terrain';

const c = placeById('phare').center;
const g = standingHeight(heightAt(c));

/** Les sommets des abords, depuis le pied du lieu. */
const points = (f: Facets): { dx: number; dy: number; dz: number }[] => {
  const out = [];
  for (let k = 0; k < f.positions.length; k += 3) out.push({ dx: f.positions[k] - c.x, dy: f.positions[k + 1] - g, dz: f.positions[k + 2] - c.z });
  return out;
};

/** Le sol sous un point, depuis le pied du lieu. */
const groundAt = (dx: number, dz: number) => heightAt({ x: c.x + dx, z: c.z + dz }) - g;

describe('Les abords du Phare', () => {
  it.each([false, true])('posé %s : ne dressent rien devant la caméra de face, entre la scène et elle', (posed) => {
    for (const p of points(scenetteSurroundings('phare', false, posed)))
      if (p.dz > 2.6 && Math.abs(p.dx) < 4.6) expect(p.dy - Math.max(0.7, groundAt(p.dx, p.dz))).toBeLessThan(0.6);
  });

  it.each([false, true])('posé %s : restent bas dans le tour où la rangée des cloches se pose, sauf la bande et le revers de la tour', (posed) => {
    const keo = scenetteKeo('phare', posed).at, habitant = scenetteHabitant('phare', posed);
    const mid = { x: (keo.x + habitant.x) / 2 - c.x, z: (keo.z + habitant.z) / 2 - c.z };
    for (const p of points(scenetteSurroundings('phare', false, posed))) {
      // La bande, sur la tour elle-même (son rayon au plus 1,8).
      if (p.dz < 0 || Math.hypot(p.dx, p.dz) < 1.8 || Math.hypot(p.dx - mid.x, p.dz - mid.z) > 5.4) continue;
      expect(p.dy - Math.max(0.7, groundAt(p.dx, p.dz))).toBeLessThan(0.6);
    }
  });

  it.each([false, true])('posé %s : ne mettent rien sous les pieds de Kéo ni de la gardienne', (posed) => {
    const feet = [scenetteKeo('phare', posed).at, scenetteHabitant('phare', posed)];
    for (const p of points(scenetteSurroundings('phare', false, posed)))
      for (const f of feet) if (Math.hypot(p.dx + c.x - f.x, p.dz + c.z - f.z) < 0.8) expect(p.dy + g).toBeLessThan(f.y - 0.3);
  });

  it('au pied : l’échafaudage monte au-dessus du moignon, rien ne passe la galerie', () => {
    const f = points(scenetteSurroundings('phare', false, false));
    expect(Math.max(...f.map((p) => p.dy))).toBeGreaterThan(5);
    expect(Math.max(...f.map((p) => p.dy))).toBeLessThan(10);
  });

  it('sur la galerie : la potence passe la rambarde, sa bouée pend sous le plancher, l’échelle monte du sol', () => {
    const f = points(scenetteSurroundings('phare', false, true));
    const out = f.filter((p) => Math.hypot(p.dx, p.dz) > 4);
    expect(out.some((p) => p.dy > 12.5)).toBe(true);
    expect(out.some((p) => p.dy < 10.5 && p.dy > 9)).toBe(true);
    expect(Math.min(...f.map((p) => p.dy))).toBeLessThan(1);
  });

  it('posent la bande entre le haut de la porte et le haut du moignon, au pied', () => {
    const band = PHARE_SURROUNDINGS.band.foot;
    // La porte monte à 2,3 au-dessus du pied du lieu, le moignon à 3,4 (places.ts).
    expect(band.y).toBeGreaterThan(2.3);
    expect(band.y + band.h).toBeLessThan(3.4);
  });
});
