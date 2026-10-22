// Le Détour de la Bergerie (les Alpages du 3e, GD-25, lot 3) : sa place réservée au nord des Alpages, hors des chemins,
// loin des lieux, des rives et de la langue de glace ; sa sente depuis le chemin du Kiosque, libre et marchable ; la vue
// au cap de 80°, la bergerie à gauche, le pic au tiers droit ; l'enclos et sa seule entrée, trois moutons couchés dedans,
// trois pierres ; ses 175 triangles, sa sauvegarde, la phrase de Kéo.
import { describe, expect, it } from 'vitest';
import { DETOUR_IDS as SAVED_IDS, sanitizeDetours } from '../../engine/detours';
import { BERGERIE, BERGERIE_BUDGET, BERGERIE_LAYOUT, BERGERIE_STONES, SHEEP, bergerieFacets, bergerieStoneAt } from './bergerie3e';
import { COMMON_DETOUR_VIEW } from './camera';
import { CADRAN } from './cadran3e';
import { DETOURS_3E, DETOUR_IDS, detourAtPoint, detourById, detourCap, detourViewOf } from './detours';
import type { Facets } from './facets';
import { distance, distanceToPolyline, linearRgb, type Vec2 } from './geometry';
import { NETWORK_3E } from './paths3e';
import { C3E } from './place3eKit';
import { DETOUR_SPOTS_3E, PATH_EDGES_3E, PEAK_3E, PLACES_3E, TERRAIN_3E } from './plan3e';
import { buildHeightField3e, ground3e, landDistance3e, langueClearance, obstaclesIn3e, walkBlocked3e } from './terrain3e';

const ground = ground3e(buildHeightField3e());
const node = (id: string) => NETWORK_3E.pathNode(id).at;
const EDGES = PATH_EDGES_3E.map(([a, b]) => [node(a), node(b)]);
const pathDistance = (p: Vec2) => Math.min(...EDGES.map((l) => distanceToPolyline(p, l)));
const capTo = (from: Vec2, to: Vec2) => ((Math.atan2(to.x - from.x, -(to.z - from.z)) * 180) / Math.PI + 360) % 360;
/** La caméra des Détours, à une douzaine d'unités derrière Kéo, dans l'axe de la vue. */
const LOOK = { x: Math.sin((80 * Math.PI) / 180), z: -Math.cos((80 * Math.PI) / 180) };
const CAMERA = { x: BERGERIE.at.x - LOOK.x * 12, z: BERGERIE.at.z - LOOK.z * 12 };
/** Le cap de `to` vu de la caméra, moins celui de la vue, en degrés de −180 à 180 (positif : à droite). */
const offView = (to: Vec2) => ((capTo(CAMERA, to) - 80 + 540) % 360) - 180;
/** Le demi-champ de la tablette (4:3, 56° en hauteur), en degrés. */
const HALF_TABLET = (Math.atan(Math.tan((28 * Math.PI) / 180) * (4 / 3)) * 180) / Math.PI;

function countColor(f: Facets, color: number): number {
  const [r, g, b] = linearRgb(color);
  let n = 0;
  for (let i = 0; i < f.colors.length; i += 3) if (Math.abs(f.colors[i] - r) < 1e-4 && Math.abs(f.colors[i + 1] - g) < 1e-4 && Math.abs(f.colors[i + 2] - b) < 1e-4) n++;
  return n;
}

describe('La Bergerie, le Détour des Alpages', () => {
  it('se nomme « La Bergerie », aux Alpages, dans la sauvegarde à la fin ; Kéo dit sa phrase, écrite sous le nom', () => {
    expect(detourById('bergerie')).toBe(BERGERIE);
    expect(DETOURS_3E).toEqual([CADRAN, BERGERIE]);
    expect(BERGERIE.name).toBe('La Bergerie');
    expect(BERGERIE.land).toBe('alpages');
    expect(SAVED_IDS).toEqual(DETOUR_IDS);
    expect(DETOUR_IDS.at(-1)).toBe('bergerie');
    expect(DETOUR_IDS.at(-2)).toBe('cadran');
    expect(sanitizeDetours(['bergerie', 'cadran'])).toEqual(['cadran', 'bergerie']);
    expect(BERGERIE.says).toBe('Les moutons passent l’été tout là-haut.');
    expect(BERGERIE.saysAloudOnly).toBeUndefined();
    expect(BERGERIE.says).not.toMatch(/vide|chute|tomb|vertige|phare/i);
  });

  it('se tient devant sa place réservée, hors des chemins, loin des lieux, des rives et de la langue de glace', () => {
    const at = BERGERIE.at;
    expect(distance(at, DETOUR_SPOTS_3E.bergerie)).toBeLessThanOrEqual(8);
    expect(walkBlocked3e(at)).toBe(false);
    expect(pathDistance(at)).toBeGreaterThan(10);
    expect(pathDistance(DETOUR_SPOTS_3E.bergerie)).toBeGreaterThan(10);
    for (const p of PLACES_3E) expect(distance(p.center, at), p.id).toBeGreaterThan(25);
    expect(landDistance3e(at)).toBeGreaterThan(20);
    expect(langueClearance(at)).toBeGreaterThan(20);
    expect(detourAtPoint(at, '3e')).toBe(BERGERIE);
    expect(detourAtPoint(at, '4e')).toBeNull();
  });

  it('à l’arrivée, la caméra se tourne au cap de 80° : la bergerie à gauche, le pic au tiers droit, le Fanal dans le cadre', () => {
    const cap = detourCap(BERGERIE)!;
    const look = { x: -Math.sin(cap), z: -Math.cos(cap) };
    const deg = ((Math.atan2(look.x, -look.z) * 180) / Math.PI + 360) % 360;
    expect(deg).toBeCloseTo(80, 6);
    const peak = offView(PEAK_3E.at);
    expect(peak).toBeGreaterThan(HALF_TABLET / 3);
    expect(peak).toBeLessThan(HALF_TABLET - 6);
    expect(Math.abs(offView(PLACES_3E.find((p) => p.id === 'fanal')!.center))).toBeLessThan(HALF_TABLET - 6);
    const [h0, h1] = BERGERIE_LAYOUT.hut;
    const hut = { x: (h0.x + h1.x) / 2, z: (h0.z + h1.z) / 2 };
    expect(offView(hut)).toBeLessThan(-10);
    expect(offView(hut)).toBeGreaterThan(-HALF_TABLET + 4);
    expect(detourViewOf(BERGERIE).height).toBeLessThanOrEqual(COMMON_DETOUR_VIEW.height);
  });

  it('l’enclos devant Kéo, contre la bergerie, avec une seule entrée de 0,85 à côté de l’axe ; les trois moutons dedans', () => {
    const [p0, p1] = BERGERIE_LAYOUT.pen;
    expect(distance(p0, BERGERIE.at)).toBeGreaterThan(3.5);
    const [g0, g1] = BERGERIE_LAYOUT.gate;
    expect(distance(g0, g1)).toBeCloseTo(0.85, 6);
    // L'entrée ne se cache pas derrière Kéo : elle est à gauche de l'axe de la vue ; tout l'enclos aussi.
    expect(offView(g1)).toBeLessThan(-3);
    expect(Math.max(offView(p0), offView(p1))).toBeLessThan(0);
    expect(SHEEP).toHaveLength(3);
    // Dans le repère de Kéo : `f` devant lui, `s` à sa droite.
    const L = BERGERIE_LAYOUT.look;
    const fs = (p: Vec2) => {
      const dx = p.x - BERGERIE.at.x,
        dz = p.z - BERGERIE.at.z;
      return { f: dx * L.x + dz * L.z, s: dx * -L.z + dz * L.x };
    };
    const a = fs(p0),
      b = fs(p1);
    const inside = (p: Vec2) => {
      const q = fs(p);
      return q.f > a.f + 0.6 && q.f < b.f - 0.6 && q.s > a.s + 0.6 && q.s < b.s - 0.6;
    };
    for (const s of BERGERIE_LAYOUT.sheep) expect(inside(s)).toBe(true);
    // Aucun mouton dans l'axe de Kéo, où il le cacherait.
    for (const s of BERGERIE_LAYOUT.sheep) expect(offView(s)).toBeLessThan(-3);
  });

  it('sa sente part du chemin du Kiosque, et reste libre et marchable, loin de la bergerie et de l’enclos', () => {
    const [start, end] = BERGERIE.sente;
    expect(distanceToPolyline(start, [node('al-1'), node('kiosque'), node('al-2')])).toBeLessThan(0.3);
    expect(end).toEqual(BERGERIE.at);
    const len = distance(start, end);
    for (let t = 0; t <= len; t += 0.5) {
      const p = { x: start.x + ((end.x - start.x) * t) / len, z: start.z + ((end.z - start.z) * t) / len };
      expect(walkBlocked3e(p), `${t}`).toBe(false);
    }
    for (const c of [...BERGERIE_LAYOUT.hut, ...BERGERIE_LAYOUT.pen]) expect(BERGERIE_LAYOUT.clearOfSente(c)).toBeGreaterThan(2);
    const tile = TERRAIN_3E.step * TERRAIN_3E.tileCells;
    const spot = BERGERIE_LAYOUT.spot;
    const xs = [Math.min(start.x, end.x, spot.x) - 10, Math.max(start.x, end.x, spot.x) + 10];
    const zs = [Math.min(start.z, end.z, spot.z) - 10, Math.max(start.z, end.z, spot.z) + 10];
    for (let tx = Math.floor((xs[0] - TERRAIN_3E.minX) / tile); tx <= Math.floor((xs[1] - TERRAIN_3E.minX) / tile); tx++)
      for (let tz = Math.floor((zs[0] - TERRAIN_3E.minZ) / tile); tz <= Math.floor((zs[1] - TERRAIN_3E.minZ) / tile); tz++)
        for (const o of obstaclesIn3e(tx, tz)) {
          expect(distanceToPolyline(o, BERGERIE.sente) - o.r, `${o.x},${o.z}`).toBeGreaterThan(0.8);
          expect(distance(o, spot) - o.r, `${o.x},${o.z}`).toBeGreaterThan(4);
        }
  });

  it('ses trois pierres entourent Kéo, de part et d’autre de la sente, jamais dessus', () => {
    const sides = new Set<number>();
    for (let k = 0; k < BERGERIE_STONES.length; k++) {
      const p = bergerieStoneAt(k);
      expect(distanceToPolyline(p, BERGERIE.sente), String(k)).toBeGreaterThan(1);
      expect(distance(p, BERGERIE.at), String(k)).toBeLessThan(4);
      sides.add(Math.sign(BERGERIE_STONES[k].deg));
    }
    expect(sides.size).toBe(2);
  });

  it('coûte 175 triangles au plus sans sa sente, moutons compris ; ni lanterne, ni bronze ; la sente se trace une fois trouvée', () => {
    const hidden = bergerieFacets(false, ground);
    expect(BERGERIE_BUDGET.triangles).toBe(175);
    expect(hidden.triangles).toBeLessThanOrEqual(BERGERIE_BUDGET.triangles);
    expect(countColor(hidden, C3E.lantern)).toBe(0);
    expect(countColor(hidden, C3E.bronze)).toBe(0);
    expect(countColor(hidden, C3E.slate)).toBeGreaterThan(0);
    // La tête des moutons, brune, jamais presque noire.
    const h = BERGERIE_LAYOUT.colors.head;
    expect(Math.min((h >> 16) & 255, (h >> 8) & 255, h & 255)).toBeGreaterThan(0x48);
    const traced = bergerieFacets(true, ground);
    expect(traced.triangles).toBeGreaterThan(hidden.triangles);
    expect(traced.triangles - hidden.triangles).toBeLessThanOrEqual(BERGERIE_BUDGET.sente);
  });
});
