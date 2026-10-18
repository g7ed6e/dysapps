// Les habitants des scénettes en modèles 3D (./habitants.ts) : les seize fichiers, lus comme la vue les lit, publiés tels
// quels, mis à la place du pion ; et le décor de près, qui garde ce que l'habitant tient quand son modèle est montré.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { compacterGlb } from '../../../../scripts/rendu/compacterGlb.mjs';
import { lireGlbTexture } from '../characters/imported/glb';
import type { Facets } from './facets';
import { forgetHabitant, forgetHabitants, HABITANT_FILE, HABITANT_HALVES, HABITANT_HEIGHT, HABITANT_TRIANGLES, habitantBox, habitantModelName, registerHabitant } from './habitants';
import { PLACES, type PlaceId } from './plan6e';
import { habitantHand, scenetteDecor, scenetteHabitant, scenetteKeo, scenetteSetting } from './scenette';

const DOSSIER = resolve(__dirname, '../../../../docs/univers/archipeo/personnages/modeles');
const octets = (place: PlaceId) => readFileSync(resolve(DOSSIER, habitantModelName(place), HABITANT_FILE));
const lu = (place: PlaceId) => {
  const b = octets(place);
  return lireGlbTexture(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
};
const register = (place: PlaceId) => registerHabitant(place, lu(place).positions);

afterEach(() => forgetHabitants());

describe('Les seize fichiers', () => {
  it('chaque lieu a son habitant : 17 000 triangles (22 500 pour la saunière et le chef de gare), texturé d’un JPEG, positions quantifiées', () => {
    for (const { id } of PLACES) {
      const m = lu(id);
      const triangles = m.indices.length / 3;
      expect(triangles, id).toBeLessThanOrEqual(id === 'saltworks' || id === 'ferry' ? HABITANT_TRIANGLES : 17_000);
      expect(triangles, id).toBeGreaterThan(16_000);
      expect(m.image.mimeType, id).toBe('image/jpeg');
      // Le début d'un JPEG (FF D8).
      expect([m.image.bytes[0], m.image.bytes[1]], id).toEqual([0xff, 0xd8]);
      expect(Math.min(...m.uvs), id).toBeGreaterThanOrEqual(0);
      expect(Math.max(...m.uvs), id).toBeLessThanOrEqual(1);
      const b = octets(id);
      const json = JSON.parse(b.subarray(20, 20 + b.readUInt32LE(12)).toString()) as { extensionsUsed?: string[]; meshes: { primitives: { attributes: Record<string, number> }[] }[] };
      expect(json.extensionsUsed, id).toContain('KHR_mesh_quantization');
      expect(Object.keys(json.meshes[0].primitives[0].attributes).sort(), id).toEqual(['POSITION', 'TEXCOORD_0']);
    }
  });

  it('le compactage du build les publie tels quels : ni cassés, ni regrossis', () => {
    for (const { id } of PLACES) {
      const b = new Uint8Array(octets(id));
      expect(compacterGlb(b), id).toBe(b);
    }
  });

  it('mis à la place du pion : sa hauteur, ses pieds au sol, centré sur ses jambes, dans sa boîte des tests de chevauchement', () => {
    for (const { id } of PLACES) {
      const model = register(id);
      const p = model.positions;
      let [low, high] = [Infinity, -Infinity];
      for (let i = 1; i < p.length; i += 3) [low, high] = [Math.min(low, p[i]), Math.max(high, p[i])];
      expect(low, id).toBeCloseTo(0, 5);
      expect(high, id).toBeCloseTo(HABITANT_HEIGHT, 4);
      const box = habitantBox(model);
      const half = HABITANT_HALVES[id];
      // La boîte couvre le modèle, au centième près, sans le déborder de plus.
      expect(Math.max(box.west, box.east), id).toBeLessThanOrEqual(half.x);
      expect(Math.max(box.west, box.east), id).toBeGreaterThan(half.x - 0.02);
      expect(Math.max(box.back, box.front), id).toBeLessThanOrEqual(half.z);
      expect(Math.max(box.back, box.front), id).toBeGreaterThan(half.z - 0.02);
    }
  });

  it('il regarde la caméra (+z) : ce qu’il porte au dos (le sac du couvreur, la longue-vue de la vigie) est derrière lui', () => {
    for (const id of ['commons', 'lookout'] as const) {
      const box = habitantBox(register(id));
      expect(box.back, id).toBeGreaterThan(box.front + 0.1);
    }
  });
});

/** Les triangles d'un décor dans une boîte (centre et demi-tailles), leur centre dedans. */
function inside(f: Facets, c: { x: number; y: number; z: number }, half: { x: number; y: number; z: number }): number {
  let n = 0;
  for (let t = 0; t < f.triangles; t++) {
    const m = [0, 1, 2].map((k) => (f.positions[t * 9 + k] + f.positions[t * 9 + 3 + k] + f.positions[t * 9 + 6 + k]) / 3);
    if (Math.abs(m[0] - c.x) < half.x && Math.abs(m[1] - c.y) < half.y && Math.abs(m[2] - c.z) < half.z) n++;
  }
  return n;
}

describe('Le décor de près, le modèle montré', () => {
  it('sans le corps du pion, et avec tout le reste ; le pion revient quand le modèle n’est plus montré', () => {
    for (const { id } of PLACES) {
      const pawn = scenetteDecor(id).triangles;
      register(id);
      const decor = scenetteDecor(id);
      expect(decor.triangles, id).toBe(scenetteSetting(id).triangles);
      expect(decor.triangles, id).toBeLessThan(pawn);
      // Rien du décor au milieu du corps du modèle (la poitrine, la tête) : le pion n'y est plus.
      const h = scenetteHabitant(id);
      expect(inside(decor, { x: h.x, y: h.y + 0.95, z: h.z }, { x: 0.12, y: 0.35, z: 0.08 }), id).toBe(0);
      forgetHabitant(id);
      expect(scenetteDecor(id).triangles, id).toBe(pawn);
    }
  });

  it('au Phare, la corde de la cloche part de la main du modèle tournée vers Kéo, posée ou au pied de la tour', () => {
    for (const posed of [true, false]) {
      const model = register('phare');
      const at = scenetteHabitant('phare', posed);
      const hand = habitantHand('phare', posed);
      const box = habitantBox(model);
      expect(hand.x - at.x).toBeCloseTo(-box.west, 5);
      expect(hand.y - at.y).toBeGreaterThan(0.33 * HABITANT_HEIGHT);
      expect(hand.y - at.y).toBeLessThan(0.5 * HABITANT_HEIGHT);
      forgetHabitants();
    }
  });

  it('au Phare, la poignée de la corde et le maillet prennent le rouge du bonnet du modèle, une couleur que le pion n’a pas', () => {
    for (const posed of [true, false]) {
      const colors = (f: Facets) => new Set(Array.from({ length: f.triangles }, (_, t) => f.colors.slice(t * 9, t * 9 + 3).join(',')));
      const pawn = colors(scenetteDecor('phare', false, posed));
      register('phare');
      const added = [...colors(scenetteDecor('phare', false, posed))].filter((c) => !pawn.has(c));
      expect(added, String(posed)).toHaveLength(1);
      const [r, g, b] = added[0].split(',').map(Number);
      expect(r, String(posed)).toBeGreaterThan(2 * Math.max(g, b));
      forgetHabitants();
    }
  });

  it('les objets que la scénette garde à côté de lui (la caisse, le levier, la chambre, la tuile) restent hors de son corps', () => {
    for (const id of ['quais', 'ecluses', 'observatory', 'commons'] as const) {
      register(id);
      const h = scenetteHabitant(id);
      const half = HABITANT_HALVES[id];
      const decor = scenetteDecor(id);
      // Au-dessus du sol de la scène et sous ses épaules, dans la moitié de sa boîte (son corps, pas ses mains).
      expect(inside(decor, { x: h.x, y: h.y + 0.6, z: h.z }, { x: half.x / 2, y: 0.5, z: half.z / 2 }), id).toBe(0);
    }
  });

  it('Kéo et l’habitant ne se touchent jamais : plus d’un mètre entre la boîte du modèle et les pieds de Kéo', () => {
    for (const { id } of PLACES)
      for (const posed of id === 'phare' ? [true, false] : [true]) {
        const h = scenetteHabitant(id, posed);
        const k = scenetteKeo(id, posed).at;
        expect(Math.abs(h.x - k.x) - HABITANT_HALVES[id].x, `${id} ${posed}`).toBeGreaterThan(1);
      }
  });
});
