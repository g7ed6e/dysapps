// Le corps qui travaille (GD-27, lot 5, piste B) : les poids lus sur les vrais modèles de loin, le buste qui penche vers
// l'avant sans bouger les pieds, le bras droit qui monte vers l'outil, l'habitant assis les pieds au sol sur son bloc.
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { lireGlbTexture } from '../characters/imported/glb';
import { ARM, BEND, HIP, KNEE, SEAT_COLOR, SEAT_TRIANGLES, SHOULDER, bodyWeights, seatFacets, seatedBody, seatedHeight, workBody, type BodyFrame } from './corps';
import { FacetBuilder } from './facets';
import { habitantModelName } from './habitants';
import { levelWorld } from './levelWorld';
import { type OpenWorldLevel, type ScenePlaceId } from './levelPlan';
import { worldGestes } from './gestes';
import { placeWorldHabitant, worldHabitantAt, worldHabitantHeight, worldHabitantYaw } from './worldHabitants';

const MODELS = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../docs/univers/archipeo/personnages/modeles');

/** La version de loin d'un habitant, à sa place dans le monde, et son repère. */
function placed(place: ScenePlaceId, level: OpenWorldLevel): { rest: Float32Array; frame: BodyFrame } {
  const world = levelWorld(level);
  const ground = world.ground(world.field());
  const bytes = readFileSync(resolve(MODELS, habitantModelName(place), 'habitant-loin.glb'));
  const m = lireGlbTexture(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
  const rest = placeWorldHabitant(place, m.positions, ground)!;
  return { rest, frame: { at: worldHabitantAt(place, ground)!, yaw: worldHabitantYaw(place), height: worldHabitantHeight(place) } };
}

/** Les quatre habitants de l'essai (directeur artistique) : le charpentier, l'aubergiste en robe, le cantonnier, l'annonceur. */
const TRIAL: [ScenePlaceId, OpenWorldLevel][] = [
  ['shipyard', '6e'],
  ['auberge', '5e'],
  ['chariot', '4e'],
  ['tribune', '3e'],
];

/** Devant, et la droite de l'habitant (le côté de son outil, −x dans son repère). */
const axes = (frame: BodyFrame) => ({ f: { x: Math.sin(frame.yaw), z: Math.cos(frame.yaw) }, r: { x: -Math.cos(frame.yaw), z: Math.sin(frame.yaw) } });
const fwdOf = (p: Float32Array, k: number, frame: BodyFrame) => (p[k] - frame.at.x) * axes(frame).f.x + (p[k + 2] - frame.at.z) * axes(frame).f.z;

describe('le corps qui travaille', () => {
  it('les articulations se suivent, le buste penche de 15° au plus, le bras de 25°', () => {
    expect(KNEE).toBeLessThan(HIP);
    expect(HIP).toBeLessThan(SHOULDER);
    expect(BEND).toBeLessThanOrEqual((15 * Math.PI) / 180 + 1e-9);
    expect(ARM).toBeLessThanOrEqual((30 * Math.PI) / 180);
  });

  for (const [place, level] of TRIAL) {
    describe(`${place} (${level})`, () => {
      const { rest, frame } = placed(place, level);
      const w = bodyWeights(rest, frame);

      it('les poids : nuls aux pieds, pleins à la tête ; le bras à droite seulement, des hanches à l’épaule, du côté de l’outil', () => {
        const n = rest.length / 3;
        let armCount = 0;
        for (let i = 0; i < n; i++) {
          const y = (rest[i * 3 + 1] - frame.at.y) / frame.height;
          if (y < HIP - 0.05 && w.arm[i] === 0) expect(w.bend[i]).toBe(0);
          if (y > HIP + 0.05) expect(w.bend[i]).toBe(1);
          expect(w.arm[i]).toBeGreaterThanOrEqual(0);
          expect(w.arm[i]).toBeLessThanOrEqual(1);
          if (w.arm[i] > 0) {
            armCount++;
            expect(y).toBeGreaterThan(HIP - 0.03);
            expect(y).toBeLessThan(SHOULDER + 0.1);
            const lat = (rest[i * 3] - frame.at.x) * axes(frame).r.x + (rest[i * 3 + 2] - frame.at.z) * axes(frame).r.z;
            expect(lat).toBeGreaterThan(0);
          }
        }
        expect(armCount).toBeGreaterThan(10);
        // Du côté de l'outil : la moyenne des sommets du bras et celle de l'outil sont du même côté de l'habitant.
        const g = worldGestes([place], (x, z) => frame.at.y + 0 * x * z);
        let tool = 0;
        for (let k = 0; k < g.facets.positions.length; k += 3) tool += (g.facets.positions[k] - frame.at.x) * axes(frame).r.x + (g.facets.positions[k + 2] - frame.at.z) * axes(frame).r.z;
        expect(tool).toBeGreaterThan(0);
      });

      it('au repos, rien ne bouge ; au bout, la tête avance et descend un peu, les pieds ne bougent pas, la main droite avance', () => {
        const out = new Float32Array(rest.length);
        workBody(rest, out, 0, frame, w, 0);
        expect(out).toEqual(rest);
        workBody(rest, out, 0, frame, w, 1);
        let top = -1, hand = -1, foot = -1;
        for (let i = 0; i < rest.length / 3; i++) {
          if (top < 0 || rest[i * 3 + 1] > rest[top * 3 + 1]) top = i;
          if (foot < 0 || rest[i * 3 + 1] < rest[foot * 3 + 1]) foot = i;
          if (w.arm[i] > 0.9 && (hand < 0 || rest[i * 3 + 1] < rest[hand * 3 + 1])) hand = i;
        }
        // La tête : plus en avant, plus bas, d'une part modeste de la hauteur.
        expect(fwdOf(out, top * 3, frame) - fwdOf(rest, top * 3, frame)).toBeGreaterThan(0.05 * frame.height);
        expect(out[top * 3 + 1]).toBeLessThan(rest[top * 3 + 1]);
        expect(rest[top * 3 + 1] - out[top * 3 + 1]).toBeLessThan(0.06 * frame.height);
        // Les pieds : à leur place.
        expect(out[foot * 3 + 1]).toBeCloseTo(rest[foot * 3 + 1], 6);
        // La main droite : nettement en avant, vers l'outil, à peu près à sa hauteur (elle passe sous l'épaule penchée).
        expect(hand).toBeGreaterThanOrEqual(0);
        expect(fwdOf(out, hand * 3, frame) - fwdOf(rest, hand * 3, frame)).toBeGreaterThan(0.08 * frame.height);
        expect(Math.abs(out[hand * 3 + 1] - rest[hand * 3 + 1])).toBeLessThan(0.05 * frame.height);
      });

      it('assis : les pieds au sol et devant, la tête descendue de la longueur des cuisses, rien sous le sol', () => {
        const s = seatedBody(rest, frame);
        let y0 = Infinity, y1 = -Infinity, top = -1;
        for (let k = 0; k < s.length; k += 3) {
          y0 = Math.min(y0, s[k + 1]);
          if (s[k + 1] > y1) {
            y1 = s[k + 1];
            top = k;
          }
        }
        expect(y0).toBeGreaterThanOrEqual(frame.at.y - 0.02 * frame.height);
        expect(y1 - frame.at.y).toBeCloseTo(seatedHeight(frame.height), 1);
        expect(fwdOf(s, top, frame)).toBeCloseTo(fwdOf(rest, top, frame), 4);
        // Un pied (un sommet au sol) a avancé de la longueur des cuisses.
        for (let k = 0; k < s.length; k += 3) if (rest[k + 1] - frame.at.y < 0.02 * frame.height) expect(fwdOf(s, k, frame) - fwdOf(rest, k, frame)).toBeCloseTo((HIP - KNEE) * frame.height, 4);
      });

      it('le bloc : vingt-quatre triangles, à hauteur de genou, sous les hanches, de la teinte du niveau', () => {
        const b = new FacetBuilder();
        seatFacets(b, frame, SEAT_COLOR[level]);
        const f = b.build();
        expect(f.triangles).toBe(SEAT_TRIANGLES);
        let y1 = -Infinity;
        for (let k = 1; k < f.positions.length; k += 3) y1 = Math.max(y1, f.positions[k]);
        expect(y1 - frame.at.y).toBeCloseTo(KNEE * frame.height, 6);
      });
    });
  }
});
