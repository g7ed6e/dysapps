// Le monde qui répond, lieu par lieu (GD-28, lot 4 de GD-27 ; décisions du directeur artistique du 30 octobre 2026) :
// les quatre lieux témoins de GD-26 ont leur objet (les propagules de la Mangrove, les bûches du Hameau, les chaudrons
// de la Forge, les messages reçus des Ondes), huit places fixées d'avance, en groupe, jamais en ligne régulière ni en
// colonne, dans le cadre de la scénette, hors de la rangée des réponses ; chaque objet descend droit d'au-dessus de sa
// place, sans arc. Les Quais restent tels qu'ils sont (la barque porte les quantités de l'item).
import { describe, expect, it } from 'vitest';
import './forge4e';
import './hameau5e';
import './ondes3e';
import './places';
import { RESPOND_MAX, respondMove, respondPlaced, respondTriangles, responds } from './respond';
import { screenOf } from './camera';
import { scenetteHabitant, scenetteKeo, scenetteLayout, scenettePose } from './scenette';
import { questionLayout } from './questionScene';
import type { PlaceId } from './levelPlan';

const PLACES: readonly PlaceId[] = ['mangrove', 'hameau', 'forge', 'ondes'];

/** La boîte d'un maillage posé. */
const boxOf = (positions: Float32Array) => {
  const lo = { x: Infinity, y: Infinity, z: Infinity };
  const hi = { x: -Infinity, y: -Infinity, z: -Infinity };
  for (let i = 0; i < positions.length; i += 3) {
    lo.x = Math.min(lo.x, positions[i]);
    hi.x = Math.max(hi.x, positions[i]);
    lo.y = Math.min(lo.y, positions[i + 1]);
    hi.y = Math.max(hi.y, positions[i + 1]);
    lo.z = Math.min(lo.z, positions[i + 2]);
    hi.z = Math.max(hi.z, positions[i + 2]);
  }
  return { lo, hi };
};

/** Les écrans d'essai : une tablette et un téléphone en paysage, trois réponses en rangée (la disposition commune). */
const SCREENS: readonly (readonly [number, number])[] = [
  [1180, 820],
  [844, 390],
];

describe('Le monde qui répond, lieu par lieu', () => {
  it('les quatre lieux témoins répondent ; les Quais, le Phare et les autres lieux gardent leur témoin', () => {
    for (const p of PLACES) expect(responds(p), p).toBe(true);
    for (const p of ['quais', 'phare', 'engine', 'montee', 'etuve', 'fanal'] as PlaceId[]) expect(responds(p), p).toBe(false);
  });

  it.each(PLACES)('%s : huit objets de 6 à 40 triangles, tous posés, moins de 320 triangles en tout', (place) => {
    const all = respondPlaced(place, RESPOND_MAX);
    expect(all.triangles).toBe(respondTriangles(place));
    expect(all.triangles).toBeLessThanOrEqual(320);
    for (let i = 0; i < RESPOND_MAX; i++) {
      const m = respondMove(place, i)!;
      expect(m.facets.triangles).toBeGreaterThanOrEqual(6);
      expect(m.facets.triangles).toBeLessThanOrEqual(40);
    }
  });

  it.each(PLACES)('%s : chaque objet descend droit d’au-dessus de sa place, de 0,4 à 0,9, sans arc', (place) => {
    for (let i = 0; i < RESPOND_MAX; i++) {
      const m = respondMove(place, i)!;
      expect(m.arc).toBe(0);
      expect(m.from.y - m.to.y).toBeGreaterThanOrEqual(0.4);
      expect(m.from.y - m.to.y).toBeLessThanOrEqual(0.9);
      expect(Math.hypot(m.from.x - m.to.x, m.from.z - m.to.z)).toBeLessThan(0.25);
    }
  });

  it.each(PLACES)('%s : les places sont distinctes, en groupe (jamais huit en ligne, jamais en colonne), et chaque objet est à la sienne', (place) => {
    const spots = Array.from({ length: RESPOND_MAX }, (_, i) => respondMove(place, i)!.to);
    for (let i = 0; i < spots.length; i++)
      for (let k = i + 1; k < spots.length; k++) {
        const d = Math.hypot(spots[i].x - spots[k].x, spots[i].y - spots[k].y, spots[i].z - spots[k].z);
        expect(d, `${i} et ${k}`).toBeGreaterThan(0.2);
      }
    // Un groupe, jamais une colonne : au moins trois places distinctes au sol, et jamais huit l'une au-dessus de l'autre.
    const xz = new Set(spots.map((s) => `${s.x.toFixed(1)},${s.z.toFixed(1)}`));
    expect(xz.size).toBeGreaterThanOrEqual(3);
    // Le premier objet posé seul est bien à sa place : sa boîte la contient (à 0,1 près) et reste petite.
    const { lo, hi } = boxOf(respondPlaced(place, 1).positions);
    const at = spots[0];
    for (const k of ['x', 'y', 'z'] as const) {
      expect(lo[k], `${k} bas`).toBeLessThanOrEqual(at[k] + 0.1);
      expect(hi[k], `${k} haut`).toBeGreaterThanOrEqual(at[k] - 0.1);
      expect(hi[k] - lo[k], `${k} taille`).toBeLessThan(1.2);
    }
  });

  it.each(PLACES)('%s : le groupe est dans le cadre de la scénette, à l’écran, sous la bulle et hors de la rangée des réponses, jamais sur Kéo ni sur l’habitant', (place) => {
    for (const [W, H] of SCREENS) {
      const L = scenetteLayout({ count: 3 }, W, H, questionLayout({ count: 3 }, W, H));
      const { pose, shift } = scenettePose(place, L.scenette.stage, W, H);
      const at = (p: { x: number; y: number; z: number }) => {
        const s = screenOf(pose, p, W, H);
        // La vue décale son image de `shift` (`setViewOffset`) : un point du cadre entier paraît en `s − shift`.
        return { x: (s.x - shift.x) / W, y: (s.y - shift.y) / H };
      };
      // Kéo et l'habitant : leurs pieds à l'écran, et la demi-largeur de leur corps (0,7 unité du monde, avec la marge) en
      // part de la largeur de l'écran, à leur distance.
      const body = (p: { x: number; y: number; z: number }) => {
        const foot = at(p);
        const up = at({ x: p.x, y: p.y + 0.7, z: p.z });
        return { ...foot, half: ((foot.y - up.y) * H) / W };
      };
      const keo = body(scenetteKeo(place).at);
      const hab = body(scenetteHabitant(place));
      const rowTop = Math.min(...L.slots.map((b) => b.hit.top)) / H;
      for (let i = 0; i < RESPOND_MAX; i++) {
        const to = respondMove(place, i)!.to;
        const s = at(to);
        const tag = `${place} ${i} (${W}×${H}) ${s.x.toFixed(2)},${s.y.toFixed(2)}`;
        // Dans l'image, avec une marge, sous la bulle (le quart haut) et au-dessus de la rangée des réponses.
        expect(s.x, tag).toBeGreaterThan(0.06);
        expect(s.x, tag).toBeLessThan(0.94);
        expect(s.y, tag).toBeGreaterThan(0.28);
        expect(s.y, tag).toBeLessThan(rowTop);
        // Jamais sur Kéo ni sur l'habitant (leur corps au-dessus de leurs pieds) : hors de leur corps, ou nettement
        // au-dessus de leur tête.
        for (const [who, c] of [['Kéo', keo], ['habitant', hab]] as const)
          if (Math.abs(s.x - c.x) < c.half) expect(s.y, `${tag} sur ${who}`).toBeLessThan(c.y - 0.3);
        // Le départ est à l'écran lui aussi (l'objet ne surgit pas du bord).
        const f = at(respondMove(place, i)!.from);
        expect(f.y, `${tag} départ`).toBeGreaterThan(0.1);
      }
    }
  });
});
