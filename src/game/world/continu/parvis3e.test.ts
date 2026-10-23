// Les parures de l'aéronef du 3e (GD-25) : chacune se dessine seule, dans l'ordre ; la tête de baleine (règle des
// parures, § 6) est plus large que haute, en bronze chaud, sans vert, et tient avec les deux autres dans les 300
// triangles du poste ; le pavois en bande, deux fois plus haut que le plat-bord, et les feux au bout de deux perches,
// au-dessus de la cabine, se lisent de loin ; la fiche montre l'aéronef de trois quarts avant (restes du 3e, piste 1).
import { describe, expect, it } from 'vitest';
import type { CameraPose } from './camera';
import { blendPose, nefSheetPose, nefViewAngle } from './nef';
import { BULWARK, CABIN_ROOF, NEF_3E, NEF_PARURES, ROTOR_LOW, nefParuresFacets, nefParuresLocal } from './parvis3e';

/** Les couleurs (sRVB, 0 à 255) des sommets d'un dessin, ramenées du linéaire. */
function colorsOf(f: { colors: Float32Array }): Set<string> {
  const toSrgb = (c: number) => Math.round(255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055));
  const out = new Set<string>();
  for (let i = 0; i < f.colors.length; i += 3) out.add([f.colors[i], f.colors[i + 1], f.colors[i + 2]].map(toSrgb).join(','));
  return out;
}

describe('les parures de l’aéronef (GD-25)', () => {
  it('rien de posé, rien de dessiné ; chaque parure s’ajoute aux précédentes', () => {
    expect(nefParuresLocal([]).triangles).toBe(0);
    const counts = [1, 2, 3].map((n) => nefParuresLocal(NEF_PARURES.slice(0, n)).triangles);
    expect(counts[0]).toBeGreaterThan(0);
    expect(counts[1]).toBeGreaterThan(counts[0]);
    expect(counts[2]).toBeGreaterThan(counts[1]);
    expect(nefParuresFacets(NEF_PARURES).triangles).toBe(counts[2]);
  });

  it('les trois tiennent dans les 300 triangles du poste, la tête dans environ 120', () => {
    const head = nefParuresLocal(['proue']).triangles;
    expect(head).toBeGreaterThanOrEqual(80);
    expect(head).toBeLessThanOrEqual(130);
    expect(nefParuresLocal(NEF_PARURES).triangles).toBeLessThanOrEqual(300);
  });

  it('la tête est plus large que haute, son dessus au bastingage à un dixième près, son museau 0,9 devant l’étrave', () => {
    const p = nefParuresLocal(['proue']).positions;
    const span = (k: number) => {
      let lo = Infinity,
        hi = -Infinity;
      for (let i = k; i < p.length; i += 3) {
        lo = Math.min(lo, p[i]);
        hi = Math.max(hi, p[i]);
      }
      return { lo, hi, size: hi - lo };
    };
    const [x, y, z] = [span(0), span(1), span(2)];
    expect(x.size / y.size).toBeGreaterThan(1.25);
    expect(x.size / y.size).toBeLessThan(1.6);
    expect(Math.abs(y.hi - 0.87)).toBeLessThanOrEqual(0.1);
    expect(z.size).toBeCloseTo(0.95, 1);
  });

  it('le pavois : une rangée de cinq plaques par flanc, au bord de la coque, en arrière des hélices, en bande deux fois plus haute que le plat-bord', () => {
    const p = nefParuresLocal(['pavois']).positions;
    // Dix plaques de dix triangles (trente sommets chacune), dans l'ordre : chacune à son tour sur les deux flancs.
    expect(p.length / 3).toBe(10 * 30);
    const plates = Array.from({ length: 10 }, (_, k) => {
      let x = 0,
        z = 0,
        yHi = -Infinity,
        zLo = Infinity;
      for (let i = k * 90; i < (k + 1) * 90; i += 3) {
        x += p[i] / 30;
        z += p[i + 2] / 30;
        yHi = Math.max(yHi, p[i + 1]);
        zLo = Math.min(zLo, p[i + 2]);
      }
      return { x, z, yHi, zLo };
    });
    for (const s of [-1, 1]) {
      const side = plates.filter((q) => Math.sign(q.x) === s);
      expect(side).toHaveLength(5);
      // Le long de la coque, de l'avant vers l'arrière, collées à son bord (0,95 à 1,45 de l'axe).
      for (let k = 1; k < 5; k++) expect(side[k].z).toBeGreaterThan(side[k - 1].z + 0.3);
      for (const q of side) {
        expect(Math.abs(q.x)).toBeGreaterThan(0.95);
        expect(Math.abs(q.x)).toBeLessThan(1.55);
        // Jamais derrière une hélice (leurs pales tournent entre z = −0,98 et −0,49) ; leur haut à deux fois le plat-bord
        // (0,87), à un dixième près : une vraie bande bleue sur le flanc (restes du 3e, piste 1 A).
        expect(q.zLo).toBeGreaterThan(-0.45);
        expect(Math.abs(q.yHi - 2 * BULWARK)).toBeLessThanOrEqual(0.1);
      }
    }
  });

  it('la tête est en bronze chaud (corps, soleil, ombre), sans vert ni autre teinte', () => {
    expect([...colorsOf(nefParuresLocal(['proue']))].sort()).toEqual(['138,91,44', '180,126,62', '204,151,87']);
  });

  it('les feux : deux lanternes d’ocre au bout de deux perches, au-dessus du toit de la cabine, sous les pales du rotor', () => {
    const before = nefParuresLocal(['proue', 'pavois']);
    const all = nefParuresLocal(NEF_PARURES);
    const feux = all.triangles - before.triangles;
    // Les perches et leurs socles : une quarantaine de triangles de plus que la potence d'avant (52), au plus.
    expect(feux).toBeLessThanOrEqual(52 + 45);
    const p = all.positions.subarray(before.positions.length);
    const c = all.colors.subarray(before.colors.length);
    const ocre = '224,168,74';
    const lantern: { x: number; y: number }[] = [];
    let top = -Infinity;
    const toSrgb = (v: number) => Math.round(255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055));
    for (let i = 0; i < p.length; i += 3) {
      top = Math.max(top, p[i + 1]);
      if ([c[i], c[i + 1], c[i + 2]].map(toSrgb).join(',') === ocre) lantern.push({ x: p[i], y: p[i + 1] });
    }
    // Deux lanternes, une de chaque côté, tout entières au-dessus du toit de la cabine ; rien ne touche le rotor.
    expect(lantern.length).toBeGreaterThan(0);
    for (const s of [-1, 1]) expect(lantern.some((q) => Math.sign(q.x) === s)).toBe(true);
    for (const q of lantern) expect(q.y).toBeGreaterThan(CABIN_ROOF + 0.6);
    expect(top).toBeLessThan(ROTOR_LOW - 0.1);
  });
});

describe('la fiche de l’aéronef (restes du 3e, piste 1 B)', () => {
  const fresh = (): CameraPose => ({ position: { x: 0, y: 0, z: 0 }, target: { x: 0, y: 0, z: 0 }, fov: 56, lens: 0 });

  it('la caméra montre l’aéronef de trois quarts avant, jamais de face ni de flanc, un peu d’en haut', () => {
    const view = NEF_3E.sheetView!;
    expect(view).toBeDefined();
    const pose = nefSheetPose(NEF_3E, view, fresh());
    const angle = (nefViewAngle(NEF_3E, pose) * 180) / Math.PI;
    expect(angle).toBeGreaterThanOrEqual(30);
    expect(angle).toBeLessThanOrEqual(55);
    // Elle regarde l'aéronef sur son aire, d'au-dessus de la cabine, assez loin pour le voir entier (le rotor, 5,3 de large).
    expect(pose.target.x).toBeCloseTo(NEF_3E.berth.x, 6);
    expect(pose.target.z).toBeCloseTo(NEF_3E.berth.z, 6);
    expect(pose.position.y - pose.target.y).toBeGreaterThan(2);
    expect(Math.hypot(pose.position.x - pose.target.x, pose.position.z - pose.target.z)).toBeGreaterThan(8);
    expect(pose.fov).toBe(56);
  });

  it('la caméra y va par parts, sans rien créer, et revient à la poursuite', () => {
    const to = nefSheetPose(NEF_3E, NEF_3E.sheetView!, fresh());
    const pose = fresh();
    blendPose(pose, to, 0);
    expect(pose.position).toEqual({ x: 0, y: 0, z: 0 });
    blendPose(pose, to, 0.5);
    expect(pose.position.x).toBeCloseTo(to.position.x / 2, 6);
    blendPose(pose, to, 1);
    expect(pose.position).toEqual(to.position);
    expect(pose.target).toEqual(to.target);
  });
});
