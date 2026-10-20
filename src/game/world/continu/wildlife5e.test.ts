import { describe, expect, it } from 'vitest';
import { distance } from './geometry';
import { DEPARTURE_5E, PLACES_5E } from './plan5e';
import { landDistance5e, onPlateau } from './terrain5e';
import { groupsTriangles } from './wildlife';
import { allCritterForms, crocPose, jackdawsPose, spots5e, waderPose, wildlifeGroups5e, WILDLIFE_5E } from './wildlife5e';

const spots = spots5e();
const groups = wildlifeGroups5e();
const group = (form: string) => groups.find((g) => g.form === form)!;
const far = { x: 1e4, z: 1e4 };

describe('La vie animale du 5e (piste « Ambiance par terre »)', () => {
  it('chaque espèce a ses places, dans sa terre ; loin des lieux et de la Lisière', () => {
    for (const g of groups) expect(g.spots.length, g.form).toBeGreaterThan(4);
    const lands = { croc: 'frondaisons', mangroveCrab: 'frondaisons', heron: 'roselieres', fish: 'roselieres', egret: 'contreforts' } as const;
    for (const [form, land] of Object.entries(lands)) for (const i of group(form).spots) expect(spots[i].land).toBe(land);
    // Jamais un crabe à la place d'un crocodile.
    expect(group('mangroveCrab').spots.filter((i) => group('croc').spots.includes(i))).toEqual([]);
    for (const s of spots) {
      if (s.water) expect(landDistance5e(s.at)).toBeLessThan(-3.5);
      else {
        expect(landDistance5e(s.at)).toBeGreaterThan(0.5);
        expect(onPlateau(s.at)).toBe(false);
      }
      for (const pl of PLACES_5E) expect(distance(s.at, pl.center)).toBeGreaterThanOrEqual(WILDLIFE_5E.clearOfPlaces);
      expect(distance(s.at, DEPARTURE_5E.at)).toBeGreaterThanOrEqual(WILDLIFE_5E.clearOfDeparture);
    }
  });

  it('peu de bêtes, en peu de triangles, en aplats jamais presque noirs', () => {
    expect(groupsTriangles(groups, allCritterForms())).toBeLessThanOrEqual(320);
    for (const f of Object.values(allCritterForms())) for (let k = 0; k < f.colors.length; k += 3) expect(Math.max(f.colors[k], f.colors[k + 1], f.colors[k + 2])).toBeGreaterThan(0.15);
    // Le choucas posé prend la place du choucas en vol : les mêmes sommets.
    expect(allCritterForms().jackdawPerched.positions.length).toBe(allCritterForms().jackdaw.positions.length);
  });

  it('le crocodile flotte au ras de l’eau et dérive lentement ; immobile près de Kéo et avec « Réduire les animations »', () => {
    const i = group('croc').spots.find((k) => spots[k].water)!;
    const a = crocPose(i, 0, false, far, () => 0);
    expect(a.y).toBeLessThan(0);
    const moves = [5, 10, 15].some((t) => distance(crocPose(i, t, false, far, () => 0), a) > 0.1);
    expect(moves).toBe(true);
    const near = spots[i].at;
    expect(crocPose(i, 5, false, near, () => 0)).toEqual(crocPose(i, 12, false, near, () => 0));
    expect(crocPose(i, 5, true, far, () => 0)).toEqual(crocPose(i, 12, true, far, () => 0));
    // Sur la rive : il se dore, sans bouger.
    const bank = group('croc').spots.find((k) => !spots[k].water);
    if (bank !== undefined) expect(crocPose(bank, 3, false, far, () => 0.5)).toEqual(crocPose(bank, 30, false, far, () => 0.5));
  });

  it('le héron fait un pas de temps en temps ; immobile près de Kéo et avec « Réduire les animations »', () => {
    const i = group('heron').spots[0];
    const a = waderPose(i, 0, 0, false, far, 'heron', () => 0);
    const moves = Array.from({ length: 40 }, (_, t) => waderPose(i, 0, t, false, far, 'heron', () => 0)).some((p) => distance(p, a) > 0.2);
    expect(moves).toBe(true);
    const still = waderPose(i, 0, 0, true, far, 'heron', () => 0);
    for (const t of [3, 9, 17, 25]) expect(waderPose(i, 0, t, true, far, 'heron', () => 0)).toEqual(still);
    const keo = spots[i].at;
    const calm = waderPose(i, 0, 0, false, keo, 'heron', () => 0);
    for (const t of [3, 9, 17, 25]) expect(waderPose(i, 0, t, false, keo, 'heron', () => 0)).toEqual(calm);
  });

  it('les choucas tournent autour d’une aiguille ; « Réduire les animations » : posés à son pied, sans bouger', () => {
    const n = group('jackdaw').spots[0];
    for (const b of jackdawsPose(n, 4, false, () => 13)) {
      expect(b.form).toBe('jackdaw');
      expect(b.y).toBeGreaterThan(20);
    }
    const still = jackdawsPose(n, 4, true, () => 13);
    expect(still.every((b) => b.form === 'jackdawPerched' && b.y === 13)).toBe(true);
    expect(jackdawsPose(n, 40, true, () => 13)).toEqual(still);
  });
});
