// L'équipier qui guide une scénette (GD-23, lot 1 ; ./equipage.ts, ./scenette.ts `scenetteGuide`) : les deux fichiers,
// lus comme la vue les lit, publiés tels quels ; le partage des lieux ; sa place à côté de Kéo, à sa taille, sur le sol
// de la scène, dans le cadre sur tous les écrans, sans entrer dans le décor ni dans Kéo ou l'habitant.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { compacterGlb } from '../../../../scripts/rendu/compacterGlb.mjs';
import { lireGlbTexture } from '../characters/imported/glb';
import { TAILLE_DU_BONHOMME } from '../characters/avatar';
import { screenOf } from './camera';
import { EQUIPIER_FILE, EQUIPIER_HALVES, EQUIPIER_HEIGHT, EQUIPIER_TRIANGLES, equipierModelName, guideOf, type Equipier } from './equipage';
import { HABITANT_HALVES, habitantFit } from './habitants';
import { PLACES, type PlaceId } from './plan6e';
import { PLACES_5E } from './plan5e';
import { questionLayout } from './questionScene';
import { scenetteGuide, scenetteHabitant, scenetteKeo, scenetteLayout, scenettePose, scenetteSetting } from './scenette';
import { heightAt, standingHeight } from './terrain';

const DOSSIER = resolve(__dirname, '../../../../docs/univers/archipeo/personnages/modeles');
const octets = (e: Equipier) => readFileSync(resolve(DOSSIER, equipierModelName(e), EQUIPIER_FILE));
const lu = (e: Equipier) => {
  const b = octets(e);
  return lireGlbTexture(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
};
const EQUIPIERS: Equipier[] = ['zia', 'malo'];
const GUIDED = PLACES.map((p) => p.id).filter((id) => guideOf(id));
const screens = [
  [1024, 768],
  [1180, 820],
  [768, 1024],
  [844, 390],
  [667, 375],
] as const;

/** Les sommets d'un équipier à sa hauteur de scénette, les pieds en 0, centré sur ses jambes. */
function fitted(e: Equipier): Float32Array {
  const p = lu(e).positions;
  const f = habitantFit(p, EQUIPIER_HEIGHT);
  const out = new Float32Array(p.length);
  for (let i = 0; i < p.length; i += 3) {
    out[i] = (p[i] - f.center.x) * f.scale;
    out[i + 1] = (p[i + 1] - f.center.y) * f.scale;
    out[i + 2] = (p[i + 2] - f.center.z) * f.scale;
  }
  return out;
}

describe('Les deux fichiers', () => {
  it('Zia et Malo : sous 11 300 triangles, texturés d’un JPEG, positions quantifiées, sans squelette ni normales', () => {
    for (const e of EQUIPIERS) {
      const m = lu(e);
      expect(m.indices.length / 3, e).toBeLessThanOrEqual(EQUIPIER_TRIANGLES);
      expect(m.indices.length / 3, e).toBeGreaterThan(9_000);
      expect(m.image.mimeType, e).toBe('image/jpeg');
      expect([m.image.bytes[0], m.image.bytes[1]], e).toEqual([0xff, 0xd8]);
      const b = octets(e);
      const json = JSON.parse(b.subarray(20, 20 + b.readUInt32LE(12)).toString()) as { extensionsUsed?: string[]; skins?: unknown[]; meshes: { primitives: { attributes: Record<string, number> }[] }[] };
      expect(json.extensionsUsed, e).toContain('KHR_mesh_quantization');
      expect(json.skins, e).toBeUndefined();
      expect(Object.keys(json.meshes[0].primitives[0].attributes).sort(), e).toEqual(['POSITION', 'TEXCOORD_0']);
    }
  });

  it('le compactage du build les publie tels quels', () => {
    for (const e of EQUIPIERS) {
      const b = new Uint8Array(octets(e));
      expect(compacterGlb(b), e).toBe(b);
    }
  });

  it('à la taille de Kéo, les pieds au sol, le visage vers la caméra (+z), dans sa boîte des tests de chevauchement', () => {
    for (const e of EQUIPIERS) {
      const p = fitted(e);
      let [low, high, x, z, back, front] = [Infinity, -Infinity, 0, 0, 0, 0];
      for (let i = 0; i < p.length; i += 3) {
        [low, high] = [Math.min(low, p[i + 1]), Math.max(high, p[i + 1])];
        x = Math.max(x, Math.abs(p[i]));
        z = Math.max(z, Math.abs(p[i + 2]));
        back = Math.max(back, -p[i + 2]);
        front = Math.max(front, p[i + 2]);
      }
      expect(low, e).toBeCloseTo(0, 5);
      expect(high, e).toBeCloseTo(EQUIPIER_HEIGHT, 4);
      expect(x, e).toBeLessThanOrEqual(EQUIPIER_HALVES[e].x);
      expect(x, e).toBeGreaterThan(EQUIPIER_HALVES[e].x - 0.02);
      expect(z, e).toBeLessThanOrEqual(EQUIPIER_HALVES[e].z);
      expect(z, e).toBeGreaterThan(EQUIPIER_HALVES[e].z - 0.02);
      // La clé de Zia, au dos : derrière elle.
      if (e === 'zia') expect(back, e).toBeGreaterThan(front);
    }
  });
});

describe('Qui guide quel lieu (fiche du 6e, § 6)', () => {
  it('Zia cinq lieux, Malo sept, Kéo seul aux Ruines, à l’Observatoire, à la Mangrove et à la Halle ; personne au 5e', () => {
    expect(GUIDED.filter((id) => guideOf(id) === 'zia').sort()).toEqual(['ecluses', 'engine', 'quais', 'saltworks', 'shipyard']);
    expect(GUIDED.filter((id) => guideOf(id) === 'malo').sort()).toEqual(['archives', 'beacons', 'ferry', 'filets', 'lookout', 'phare', 'printworks']);
    for (const id of ['ruins', 'observatory', 'mangrove', 'commons'] as const) expect(scenetteGuide(id)).toBeNull();
    for (const p of PLACES_5E) expect(scenetteGuide(p.id), p.id).toBeNull();
  });

  it('de la taille de Kéo dans la scénette (deux blocs à son échelle)', () => {
    for (const id of GUIDED) expect(EQUIPIER_HEIGHT, id).toBeCloseTo(TAILLE_DU_BONHOMME * scenetteKeo(id).scale, 9);
  });
});

describe('Sa place dans la scénette', () => {
  const cases: { id: PlaceId; posed: boolean }[] = GUIDED.flatMap((id) => (id === 'phare' ? [true, false] : [true]).map((posed) => ({ id, posed })));

  it('au sol de Kéo, jamais sous le terrain', () => {
    for (const { id, posed } of cases) {
      const g = scenetteGuide(id, posed)!;
      expect(g.at.y, id).toBe(scenetteKeo(id, posed).at.y);
      expect(standingHeight(heightAt(g.at)), id).toBeLessThanOrEqual(g.at.y + 1e-9);
    }
  });

  it('ni dans Kéo, ni dans l’habitant : leurs boîtes ne se touchent pas', () => {
    for (const { id, posed } of cases) {
      const g = scenetteGuide(id, posed)!;
      const half = EQUIPIER_HALVES[g.equipier];
      const k = scenetteKeo(id, posed).at;
      const h = scenetteHabitant(id, posed);
      const apart = (c: { x: number; z: number }, hx: number, hz: number) => Math.abs(c.x - g.at.x) >= hx + half.x || Math.abs(c.z - g.at.z) >= hz + half.z;
      expect(apart(k, 0.3, 0.3), `${id} Kéo`).toBe(true);
      expect(apart(h, HABITANT_HALVES[id].x, HABITANT_HALVES[id].z), `${id} habitant`).toBe(true);
    }
  });

  it('hors du décor de près : aucun triangle de la scène dans sa boîte, au-dessus de ses chevilles', () => {
    for (const { id, posed } of cases) {
      const g = scenetteGuide(id, posed)!;
      const half = EQUIPIER_HALVES[g.equipier];
      const f = scenetteSetting(id, false, posed);
      const hits: string[] = [];
      for (let t = 0; t < f.triangles; t++) {
        for (let v = 0; v < 3; v++) {
          const [x, y, z] = [f.positions[t * 9 + v * 3], f.positions[t * 9 + v * 3 + 1], f.positions[t * 9 + v * 3 + 2]];
          if (Math.abs(x - g.at.x) < half.x && Math.abs(z - g.at.z) < half.z && y > g.at.y + 0.1 && y < g.at.y + EQUIPIER_HEIGHT) hits.push(`${x.toFixed(2)},${y.toFixed(2)},${z.toFixed(2)}`);
        }
      }
      expect(hits.slice(0, 5), `${id} ${posed ? '' : '(au pied)'}`).toEqual([]);
    }
  });

  it('dans le cadre de la scène, sur tous les écrans, sa tête comprise', () => {
    for (const id of GUIDED)
      for (const [w, h] of screens) {
        const base = questionLayout({ count: 4 }, w, h);
        const stage = scenetteLayout({ count: 4, column: true }, w, h, base).scenette!.stage;
        const { pose, shift } = scenettePose(id, stage, w, h);
        const g = scenetteGuide(id)!;
        for (const y of [0, EQUIPIER_HEIGHT]) {
          const s = screenOf(pose, { x: g.at.x, y: g.at.y + y, z: g.at.z }, w, h);
          const at = `${id} ${w}×${h} ${y}`;
          expect(s.x - shift.x, at).toBeGreaterThanOrEqual(stage.left);
          expect(s.x - shift.x, at).toBeLessThanOrEqual(stage.right);
          expect(s.y - shift.y, at).toBeGreaterThanOrEqual(stage.top - 0.03 * h);
          expect(s.y - shift.y, at).toBeLessThanOrEqual(stage.bottom + 1);
        }
      }
  });
});
