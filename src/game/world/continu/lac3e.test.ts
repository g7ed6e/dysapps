// Le Détour du Lac (le Cirque du 3e, GD-25, lot 5) : près de sa place réservée, sur le replat du creux, hors des
// chemins, loin des lieux et des rives ; sa sente depuis la porte du Standard, au sud de sa scène, libre et marchable ; la
// vue à l'est-sud-est, à travers le lac, le Fanal et le pic dans le cadre ; une eau plate et mate ; quatre blocs, aucun
// devant le Fanal ; trois pierres ; ses 175 triangles, sa sauvegarde, la phrase de Kéo.
import { describe, expect, it } from 'vitest';
import { DETOUR_IDS as SAVED_IDS, sanitizeDetours } from '../../engine/detours';
import { COMMON_DETOUR_VIEW } from './camera';
import { DETOURS_3E, DETOUR_IDS, detourAtPoint, detourById, detourCap, detourViewOf } from './detours';
import type { Facets } from './facets';
import { distance, distanceToPolyline, linearRgb, type Vec2 } from './geometry';
import { LAC, LAC_BUDGET, LAC_LAYOUT, LAC_STONES, lacFacets, lacStoneAt } from './lac3e';
import { NETWORK_3E } from './paths3e';
import { C3E } from './place3eKit';
import { DETOUR_SPOTS_3E, PATH_EDGES_3E, PEAK_3E, PLACES_3E, TERRAIN_3E } from './plan3e';
import { STANDARD_LAYOUT } from './standard3e';
import { buildHeightField3e, ground3e, landDistance3e, obstaclesIn3e, walkBlocked3e } from './terrain3e';

const ground = ground3e(buildHeightField3e());
const node = (id: string) => NETWORK_3E.pathNode(id).at;
const EDGES = PATH_EDGES_3E.map(([a, b]) => [node(a), node(b)]);
const pathDistance = (p: Vec2) => Math.min(...EDGES.map((l) => distanceToPolyline(p, l)));
const capTo = (from: Vec2, to: Vec2) => ((Math.atan2(to.x - from.x, -(to.z - from.z)) * 180) / Math.PI + 360) % 360;
const CAP = (() => {
  const cap = detourCap(LAC)!;
  const look = { x: -Math.sin(cap), z: -Math.cos(cap) };
  return ((Math.atan2(look.x, -look.z) * 180) / Math.PI + 360) % 360;
})();
/** La caméra des Détours, à une douzaine d'unités derrière Kéo, dans l'axe de la vue. */
const CAMERA = { x: LAC.at.x - LAC_LAYOUT.look.x * 12, z: LAC.at.z - LAC_LAYOUT.look.z * 12 };
const offView = (to: Vec2) => ((capTo(CAMERA, to) - CAP + 540) % 360) - 180;
/** Le demi-champ de la tablette (4:3, 56° en hauteur), en degrés. */
const HALF_TABLET = (Math.atan(Math.tan((28 * Math.PI) / 180) * (4 / 3)) * 180) / Math.PI;

function countColor(f: Facets, color: number): number {
  const [r, g, b] = linearRgb(color);
  let n = 0;
  for (let i = 0; i < f.colors.length; i += 3)
    if (Math.abs(f.colors[i] - r) < 1e-4 && Math.abs(f.colors[i + 1] - g) < 1e-4 && Math.abs(f.colors[i + 2] - b) < 1e-4) n++;
  return n;
}

describe('Le Lac, le Détour du Cirque', () => {
  it('se nomme « Le Lac », au Cirque, dans la sauvegarde à la fin ; Kéo dit sa phrase, écrite sous le nom', () => {
    expect(detourById('lac')).toBe(LAC);
    expect(DETOURS_3E.at(-1)).toBe(LAC);
    expect(LAC.name).toBe('Le Lac');
    expect(LAC.land).toBe('cirque');
    expect(SAVED_IDS).toEqual(DETOUR_IDS);
    expect(DETOUR_IDS.at(-1)).toBe('lac');
    expect(sanitizeDetours(['lac', 'cedre'])).toEqual(['cedre', 'lac']);
    expect(LAC.says).toBe('L’eau du lac vient de la neige du pic.');
    expect(LAC.saysAloudOnly).toBeUndefined();
    expect(LAC.says).not.toMatch(/vide|chute|tomb|vertige|phare|versant|peur|noir/i);
  });

  it('se tient près de sa place réservée, hors des chemins, loin des lieux et des rives', () => {
    const at = LAC.at;
    expect(distance(LAC_LAYOUT.lake, DETOUR_SPOTS_3E.lac)).toBe(0);
    expect(walkBlocked3e(at)).toBe(false);
    expect(pathDistance(at)).toBeGreaterThan(8);
    for (const p of PLACES_3E) expect(distance(p.center, at), p.id).toBeGreaterThan(20);
    expect(landDistance3e(at)).toBeGreaterThan(5);
    expect(landDistance3e(LAC_LAYOUT.lake)).toBeGreaterThan(LAC_LAYOUT.water.r + 10);
    expect(detourAtPoint(at, '3e')).toBe(LAC);
    expect(detourAtPoint(at, '4e')).toBeNull();
  });

  it('à l’arrivée, la vue regarde à travers le lac : le lac devant Kéo, le Fanal et le pic dans le cadre', () => {
    expect(CAP).toBeGreaterThan(105);
    expect(CAP).toBeLessThan(130);
    const fanal = PLACES_3E.find((p) => p.id === 'fanal')!.center;
    expect(Math.abs(offView(fanal))).toBeLessThan(HALF_TABLET - 6);
    expect(Math.abs(offView(PEAK_3E.at))).toBeLessThan(HALF_TABLET);
    expect(Math.abs(offView(LAC_LAYOUT.lake))).toBeLessThan(12);
    // À travers le lac, vers le Fanal (relecture du Cirque, correction 6) : l'eau entre Kéo et le Fanal, dans sa direction.
    expect(Math.abs(offView(LAC_LAYOUT.lake) - offView(fanal))).toBeLessThan(15);
    expect(distanceToPolyline(LAC_LAYOUT.lake, [LAC.at, fanal])).toBeLessThan(LAC_LAYOUT.water.r);
    // Aucun bloc entre Kéo et le Fanal.
    for (const b of LAC_LAYOUT.blocks) expect(distanceToPolyline(b, [LAC.at, fanal]), `${b.x}`).toBeGreaterThan(b.s + 0.8);
    expect(detourViewOf(LAC).height).toBeLessThanOrEqual(COMMON_DETOUR_VIEW.height);
  });

  it('une eau plate, au-dessus de l’herbe partout sous elle, et pas plus haute que de quelques doigts', () => {
    const y = LAC_LAYOUT.waterLevel(ground);
    const { lake, water } = LAC_LAYOUT;
    let lo = Infinity;
    for (let a = 0; a < 24; a++)
      for (const r of [0, water.r * 0.5, water.r]) {
        const h = ground(lake.x + Math.cos((a * Math.PI) / 12) * r, lake.z + Math.sin((a * Math.PI) / 12) * r);
        expect(h).toBeLessThan(y);
        lo = Math.min(lo, h);
      }
    expect(y - lo).toBeLessThan(0.35);
  });

  it('sa sente part de la porte du Standard, passe au sud de sa scène, et reste libre et marchable', () => {
    const line = LAC.sente;
    expect(distance(line[0], node('standard'))).toBeLessThan(0.3);
    expect(line.at(-1)).toEqual(LAC.at);
    const std = PLACES_3E.find((p) => p.id === 'standard')!.center;
    const s = STANDARD_LAYOUT.scene;
    for (const [sx, sz] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ])
      expect(distanceToPolyline({ x: std.x + s.dx + sx * s.half[0], z: std.z + s.dz + sz * s.half[1] }, line)).toBeGreaterThan(1);
    expect(distanceToPolyline(std, line)).toBeGreaterThan(7);
    for (let k = 0; k < line.length - 1; k++) {
      const len = distance(line[k], line[k + 1]);
      for (let t = 0; t <= len; t += 0.5) {
        const p = { x: line[k].x + ((line[k + 1].x - line[k].x) * t) / len, z: line[k].z + ((line[k + 1].z - line[k].z) * t) / len };
        expect(walkBlocked3e(p), `${k} ${t}`).toBe(false);
      }
    }
    expect(LAC_LAYOUT.clearOfSente(LAC_LAYOUT.lake)).toBeGreaterThan(LAC_LAYOUT.water.r + 1);
    const tile = TERRAIN_3E.step * TERRAIN_3E.tileCells;
    const xs = [Math.min(...line.map((p) => p.x)) - 6, Math.max(...line.map((p) => p.x)) + 6];
    const zs = [Math.min(...line.map((p) => p.z), LAC_LAYOUT.lake.z) - 6, Math.max(...line.map((p) => p.z), LAC_LAYOUT.lake.z) + 6];
    for (let tx = Math.floor((xs[0] - TERRAIN_3E.minX) / tile); tx <= Math.floor((xs[1] - TERRAIN_3E.minX) / tile); tx++)
      for (let tz = Math.floor((zs[0] - TERRAIN_3E.minZ) / tile); tz <= Math.floor((zs[1] - TERRAIN_3E.minZ) / tile); tz++)
        for (const o of obstaclesIn3e(tx, tz)) {
          expect(distanceToPolyline(o, line) - o.r, `${o.x},${o.z}`).toBeGreaterThan(0.8);
          expect(distance(o, LAC_LAYOUT.lake) - o.r, `${o.x},${o.z}`).toBeGreaterThan(LAC_LAYOUT.water.r + 0.6);
        }
  });

  it('ses trois pierres entourent Kéo, de part et d’autre de la sente, jamais dessus', () => {
    const sides = new Set<number>();
    for (let k = 0; k < LAC_STONES.length; k++) {
      const p = lacStoneAt(k);
      expect(distanceToPolyline(p, LAC.sente), String(k)).toBeGreaterThan(1);
      expect(distance(p, LAC.at), String(k)).toBeLessThan(4);
      expect(distance(p, LAC_LAYOUT.lake), String(k)).toBeGreaterThan(LAC_LAYOUT.water.r + LAC_LAYOUT.water.bank);
      sides.add(Math.sign(LAC_STONES[k].deg));
    }
    expect(sides.size).toBe(2);
  });

  it('coûte 175 triangles au plus sans sa sente ; ni lanterne, ni bronze, rien de presque noir ; la sente se trace une fois trouvée', () => {
    const hidden = lacFacets(false, ground);
    expect(LAC_BUDGET.triangles).toBe(175);
    expect(hidden.triangles).toBeLessThanOrEqual(LAC_BUDGET.triangles);
    expect(countColor(hidden, C3E.lantern)).toBe(0);
    expect(countColor(hidden, C3E.bronze)).toBe(0);
    for (const c of Object.values(LAC_LAYOUT.colors)) expect(Math.max((c >> 16) & 255, (c >> 8) & 255, c & 255), c.toString(16)).toBeGreaterThan(0x60);
    const traced = lacFacets(true, ground);
    expect(traced.triangles).toBeGreaterThan(hidden.triangles);
    expect(traced.triangles - hidden.triangles).toBeLessThanOrEqual(LAC_BUDGET.sente);
  });
});
