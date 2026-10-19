import { describe, expect, it } from 'vitest';
import { distance } from './geometry';
import { PLACES } from './plan6e';
import { landDistance } from './terrain';
import { assignSpots, coastSpots, crabsPose, critterForms, CRITTER_COUNT, fishPose, gullsPose, WILDLIFE, wildlifeTriangles } from './wildlife';

const spots = coastSpots();
const beachSpots = spots.map((_, i) => i).filter((i) => spots[i].beach);
const seaSpots = spots.map((_, i) => i).filter((i) => spots[i].sea);

describe('La vie animale des côtes du 6e (piste « Ambiance »)', () => {
  it('des places tout autour de l’île : la plage sur la terre, au bord de l’eau ; le large dans l’eau ; loin des lieux', () => {
    expect(beachSpots.length).toBeGreaterThan(20);
    expect(seaSpots.length).toBeGreaterThan(20);
    for (const s of spots) {
      if (s.beach) {
        expect(landDistance(s.beach)).toBeGreaterThan(0.5);
        expect(landDistance(s.beach)).toBeLessThan(2.5);
      }
      if (s.sea) expect(landDistance(s.sea)).toBeLessThan(-3.5);
      for (const p of [s.beach, s.sea]) if (p) for (const pl of PLACES) expect(distance(p, pl.center)).toBeGreaterThanOrEqual(WILDLIFE.clearOfPlaces);
    }
  });

  it('peu de bêtes à la fois, en peu de triangles, en aplats jamais presque noirs', () => {
    expect(CRITTER_COUNT).toBe(12);
    expect(wildlifeTriangles()).toBeLessThanOrEqual(150);
    for (const f of Object.values(critterForms())) for (let k = 0; k < f.colors.length; k += 3) expect(Math.max(f.colors[k], f.colors[k + 1], f.colors[k + 2])).toBeGreaterThan(0.15);
  });

  it('chaque groupe garde sa place près de Kéo, et une place nouvelle n’apparaît jamais sous ses yeux', () => {
    const at = (i: number) => spots[i].beach!;
    const keo = at(beachSpots[0]);
    const first = assignSpots(beachSpots, at, keo, [], 2);
    expect(first.every((i) => i !== null)).toBe(true);
    // Kéo fait quelques pas : rien ne bouge.
    expect(assignSpots(beachSpots, at, { x: keo.x + 5, z: keo.z }, first, 2)).toEqual(first);
    // Loin : chaque groupe change de place, à `appear` unités au moins de Kéo.
    const far = at(beachSpots[Math.floor(beachSpots.length / 2)]);
    const moved = assignSpots(beachSpots, at, far, first, 2);
    for (const i of moved) expect(distance(at(i!), far)).toBeGreaterThanOrEqual(WILDLIFE.appear);
    expect(new Set(moved).size).toBe(2);
  });

  it('les mouettes tournent au-dessus de l’eau ; « Réduire les animations » : posées, sans bouger', () => {
    const i = beachSpots[0];
    for (const g of gullsPose(i, 3, false)) {
      expect(g.form).toBe('gull');
      expect(g.y).toBeGreaterThan(WILDLIFE.gullHeight - 1);
    }
    const still = gullsPose(i, 3, true);
    expect(still.every((g) => g.form === 'perched')).toBe(true);
    expect(gullsPose(i, 40, true)).toEqual(still);
  });

  it('les crabes filent un pas puis se reposent, s’enfouissent près de Kéo ; immobiles avec « Réduire les animations »', () => {
    const i = beachSpots[0];
    const far = { x: 1e4, z: 1e4 };
    // Au repos au départ de leur cycle, ils bougent ensuite.
    const a = crabsPose(i, 0, false, far);
    const moves = [1, 3, 6, 8, 11].some((t) => crabsPose(i, t, false, far).some((c, k) => distance(c, a[k]) > 0.3));
    expect(moves).toBe(true);
    const near = crabsPose(i, 0, false, a[0]);
    expect(near[0].y).toBeLessThan(a[0].y - 0.2);
    expect(crabsPose(i, 7, true, far)).toEqual(crabsPose(i, 0, true, far));
  });

  it('un poisson saute de temps en temps, les deux jamais ensemble ; jamais avec « Réduire les animations »', () => {
    const i = seaSpots[0];
    let both = false;
    let any = false;
    for (let t = 0; t < WILDLIFE.fishEvery * 2; t += 0.05) {
      const a = fishPose(i, 0, t, false);
      const b = fishPose(i, 1, t, false);
      any ||= a !== null;
      both ||= a !== null && b !== null;
      expect(fishPose(i, 0, t, true)).toBeNull();
    }
    expect(any).toBe(true);
    expect(both).toBe(false);
  });
});
