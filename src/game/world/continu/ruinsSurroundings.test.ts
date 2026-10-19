// Les abords de la scénette des Ruines : rien ne coupe le regard de la caméra sur Kéo et l'archéologue, de face, de côté
// ni de dos (la caméra tourne à deux doigts) ; le premier plan reste bas ; l'arcade debout est au fond, dans l'eau, de
// face (leur poids : ./surroundings.test.ts). Sans Three.js.
import { describe, expect, it } from 'vitest';
import { KEO_HEIGHT, orbitAround } from './camera';
import type { Facets } from './facets';
import type { Vec3 } from './geometry';
import { questionLayout } from './questionScene';
import { RUINS_SURROUNDINGS } from './ruinsSurroundings';
import { groundAt } from './surroundingsKit';
import { scenetteHabitant, scenetteKeo, scenetteLayout, scenettePose, scenetteSurroundings } from './scenette';

const around = (open = false, posed = true): Facets => scenetteSurroundings('ruins', open, posed);
const keo = scenetteKeo('ruins');
const habitant = scenetteHabitant('ruins');
/** Le sol de la scène : Kéo et l'archéologue s'y tiennent. */
const floor = { x: (keo.at.x + habitant.x) / 2, y: keo.at.y, z: keo.at.z - 0.3 };

/** Le segment [p, q] traverse-t-il le triangle (a, b, c) ? (Möller et Trumbore.) */
function crosses(p: Vec3, q: Vec3, a: number[], b: number[], c: number[]): boolean {
  const d = [q.x - p.x, q.y - p.y, q.z - p.z];
  const e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]],
    e2 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const h = [d[1] * e2[2] - d[2] * e2[1], d[2] * e2[0] - d[0] * e2[2], d[0] * e2[1] - d[1] * e2[0]];
  const det = e1[0] * h[0] + e1[1] * h[1] + e1[2] * h[2];
  if (Math.abs(det) < 1e-12) return false;
  const s = [p.x - a[0], p.y - a[1], p.z - a[2]];
  const u = (s[0] * h[0] + s[1] * h[1] + s[2] * h[2]) / det;
  if (u < 0 || u > 1) return false;
  const k = [s[1] * e1[2] - s[2] * e1[1], s[2] * e1[0] - s[0] * e1[2], s[0] * e1[1] - s[1] * e1[0]];
  const v = (d[0] * k[0] + d[1] * k[1] + d[2] * k[2]) / det;
  if (v < 0 || u + v > 1) return false;
  const t = (e2[0] * k[0] + e2[1] * k[1] + e2[2] * k[2]) / det;
  return t > 0 && t < 1;
}

describe('Les abords des Ruines', () => {
  it('ne changent pas d’un état à l’autre', () => {
    const f = around();
    expect(around(true, true).triangles).toBe(f.triangles);
    expect(around(false, false).triangles).toBe(f.triangles);
  });

  it('ne coupent jamais le regard de la caméra sur Kéo et l’archéologue, de face, de côté ni de dos', () => {
    const [w, h] = [1024, 768];
    const stage = scenetteLayout({ count: 4, column: true }, w, h, questionLayout({ count: 4 }, w, h)).scenette!.stage;
    const { pose } = scenettePose('ruins', stage, w, h);
    const f = around();
    const P = f.positions;
    // Les pieds et la tête de chacun (un rien au-dessus du sol, que le dallage de la scène ne compte pas).
    const marks = [
      { ...keo.at, y: keo.at.y + 0.1 },
      { ...keo.at, y: keo.at.y + KEO_HEIGHT * keo.scale },
      { ...habitant, y: habitant.y + 0.1 },
      { ...habitant, y: habitant.y + 1.3 },
    ];
    for (let a = 0; a < 360; a += 30) {
      const eye = orbitAround(pose.position, pose.target, (a * Math.PI) / 180);
      for (const m of marks)
        for (let k = 0; k < P.length; k += 9) {
          const hit = crosses(eye, m, [P[k], P[k + 1], P[k + 2]], [P[k + 3], P[k + 4], P[k + 5]], [P[k + 6], P[k + 7], P[k + 8]]);
          expect(hit, `${a}° : un triangle des abords entre la caméra et (${m.x.toFixed(1)}, ${m.y.toFixed(1)})`).toBe(false);
        }
    }
  });

  it('gardent le premier plan bas : le carré de fouille, ses paniers et le chevalet, à moins d’un pas du sol', () => {
    // Au sud du dallage, jusqu'au pied de la colline (au-delà, le sol monte : le regard de la caméra est vérifié plus haut).
    const P = around().positions;
    for (let k = 0; k < P.length; k += 3) {
      const [dx, dz] = [P[k] - floor.x, P[k + 2] - floor.z];
      if (dz > 1.6 && dz < 6 && Math.abs(dx) < 4.5) expect(P[k + 1] - groundAt(P[k], P[k + 2])).toBeLessThan(1);
    }
  });

  it('dressent l’arcade debout au fond, dans l’eau, dans la moitié droite du cadre de face, et la tente derrière l’archéologue', () => {
    const A = RUINS_SURROUNDINGS.arcade;
    const P = around().positions;
    let top = -Infinity;
    for (let k = 0; k < P.length; k += 3) if (P[k + 2] < floor.z + A.dz + 1 && P[k] > floor.x + A.piles[0] - 1 && P[k] < floor.x + A.piles[2] + 1) top = Math.max(top, P[k + 1]);
    expect(top).toBeGreaterThan(3.3);
    expect(A.piles[0]).toBeGreaterThan(keo.at.x - floor.x);
    expect(RUINS_SURROUNDINGS.tent.dx).toBeGreaterThan(habitant.x - floor.x);
    expect(RUINS_SURROUNDINGS.tent.dz).toBeLessThan(habitant.z - floor.z - 2);
  });
});
