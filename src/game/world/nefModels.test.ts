import { beforeAll, describe, expect, it } from 'vitest';
import { loadNefFromDisk } from './nefModels.fromDisk.testing';
import { moltPieces, moltPose, NEF_MODELS, NEF_SISTERS, nefOf, nefParts } from './nefModels';
import { vehicleForm } from './vehicle';
import { VEHICLE_SIZE } from './harbor';

describe('la Nef importée d’Archipéo (GD-15)', () => {
  beforeAll(() => loadNefFromDisk());

  it('a ses trois formes, chacune avec sa coque et sa lanterne, sœurs de la mue comprises', () => {
    for (const form of Object.keys(NEF_MODELS).map(Number)) {
      const names = nefParts(form)!.map((p) => p.name);
      expect(names, `forme ${form}`).toEqual(expect.arrayContaining(['coque', 'lanterne']));
      for (const [after, before] of Object.entries(NEF_SISTERS[form] ?? {})) {
        expect(names, `forme ${form}`).toContain(after);
        expect(
          nefParts(form - 1)!.map((p) => p.name),
          `forme ${form - 1}`,
        ).toContain(before);
      }
    }
  });

  it('tient dans la place de la Nef : cinq cases de large à un mètre près, le pont à hauteur du bonhomme', () => {
    for (const form of [1, 2, 3]) {
      const parts = nefParts(form)!;
      const lo = [0, 1, 2].map((a) => Math.min(...parts.map((p) => p.min[a])));
      const hi = [0, 1, 2].map((a) => Math.max(...parts.map((p) => p.max[a])));
      // Le rotor de l'aéronef déborde en l'air au-dessus de la jetée ; le reste tient dans les cinq cases.
      expect((lo[0] + hi[0]) / 2, `forme ${form}`).toBeCloseTo(2.5, 1);
      expect(lo[1], `forme ${form}`).toBeGreaterThanOrEqual(-VEHICLE_SIZE.below);
      expect(hi[1], `forme ${form}`).toBeLessThanOrEqual(VEHICLE_SIZE.h);
      expect(hi[2] - lo[2], `forme ${form}`).toBeLessThanOrEqual(VEHICLE_SIZE.d);
    }
  });

  it('remplace les cubes posés de sa forme, pas les pièces du chantier suivant', () => {
    const forme = vehicleForm(1).map((c) => ({ x: c.x, y: c.y, z: c.z, color: '#000' }));
    const chantier = vehicleForm(2).map((c) => ({ x: c.x, y: c.y, z: c.z + 20, color: '#000', ghost: true }));
    const nef = nefOf(1, [...forme, ...chantier])!;
    expect(nef.replaced.size).toBe(new Set(forme.map((c) => `${c.x},${c.y},${c.z}`)).size);
    expect(nef.fire.positions.length, 'la lanterne prend la lueur').toBeGreaterThan(0);
    expect(nefOf(0, forme), 'le voilier pas encore construit reste en cubes').toBeNull();
  });

  it('mue : chaque partie part de sa forme et arrive à la nouvelle, une seule montrée à la fois', () => {
    const out = [0, 0, 0, 0, 0, 0];
    for (const form of [2, 3]) {
      const pieces = moltPieces(form)!;
      for (const p of pieces) {
        const debut = moltPose(p, 0, out).slice();
        const fin = moltPose(p, 1, out).slice();
        if (p.before) expect(debut, `${form} ${p.part.name}`).toEqual([1, 1, 1, 0, 0, 0]);
        else
          expect(
            debut.slice(0, 3).every((s) => s === 0),
            `${form} ${p.part.name}`,
          ).toBe(true);
        if (p.before)
          expect(
            fin.slice(0, 3).every((s) => s === 0),
            `${form} ${p.part.name}`,
          ).toBe(true);
        else fin.forEach((v, i) => expect(v, `${form} ${p.part.name}`).toBeCloseTo(i < 3 ? 1 : 0, 6));
      }
      // Toutes les parties de la forme qui arrive sont là, et toutes celles d'avant partent.
      expect(new Set(pieces.filter((p) => !p.before).map((p) => p.part.name))).toEqual(new Set(nefParts(form)!.map((p) => p.name)));
      expect(new Set(pieces.filter((p) => p.before).map((p) => p.part.name))).toEqual(new Set(nefParts(form - 1)!.map((p) => p.name)));
    }
  });
});
