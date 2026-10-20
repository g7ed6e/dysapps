// Le Détour de la Hutte (GD-22, lot 8) : sa place au bord du grand chenal, hors des chemins et à l'écart du pont, sa
// sente depuis le chemin du pont, la forêt qui s'en écarte, sa lanterne allumée, ses 175 triangles, sa sauvegarde.
import { describe, expect, it } from 'vitest';
import { DETOUR_IDS as SAVED_IDS, sanitizeDetours } from '../../engine/detours';
import { findDetour } from '../detoursSaved';
import { DETOURS_5E, DETOUR_IDS, detourAtPoint, detourById } from './detours';
import type { Facets } from './facets';
import { distance, distanceToPolyline, linearRgb } from './geometry';
import { HUTTE, HUTTE_REEDS, hutteFacets, hutteReedAt } from './hutte5e';
import { NETWORK_5E } from './paths5e';
import { COLORS_5E, HUTTE_5E, PATH_EDGES_5E, PLACES_5E, TERRAIN_5E, inHutteClearing } from './plan5e';
import { buildHeightField5e, channelClearance, groundOn5e, heightAt5e, obstaclesIn5e } from './terrain5e';

const field = buildHeightField5e();
const ground = (x: number, z: number) => groundOn5e(field, x, z);
const node = (id: string) => NETWORK_5E.pathNode(id).at;
const EDGES = PATH_EDGES_5E.map(([a, b]) => [node(a), node(b)]);
const pathDistance = (p: { x: number; z: number }) => Math.min(...EDGES.map((l) => distanceToPolyline(p, l)));

function countColor(f: Facets, color: number): number {
  const [r, g, b] = linearRgb(color);
  let n = 0;
  for (let i = 0; i < f.colors.length; i += 3) if (Math.abs(f.colors[i] - r) < 1e-4 && Math.abs(f.colors[i + 1] - g) < 1e-4 && Math.abs(f.colors[i + 2] - b) < 1e-4) n++;
  return n;
}

describe('La Hutte, le deuxième Détour du 5e', () => {
  it('se nomme « La Hutte », dans la sauvegarde après les cinq du 6e et le Creux', () => {
    expect(detourById('hutte')).toBe(HUTTE);
    expect(DETOURS_5E.map((d) => d.id)).toEqual(['creux', 'hutte']);
    expect(HUTTE.name).toBe('La Hutte');
    expect(HUTTE.land).toBe('roselieres');
    expect(SAVED_IDS).toEqual(DETOUR_IDS);
    expect(DETOUR_IDS.slice(-2)).toEqual(['creux', 'hutte']);
    expect(sanitizeDetours(['hutte', 'creux', 'butte-chantier'])).toEqual(['butte-chantier', 'creux', 'hutte']);
    const state = findDetour({ world: { parts: {}, log: [], links: {} } } as never, 'hutte') as { world: { detours: string[] } };
    expect(state.world.detours).toEqual(['hutte']);
  });

  it('se tient sur la rive sud du grand chenal, sur le sol sec, hors des chemins et à l’écart du pont', () => {
    const at = HUTTE.at;
    expect(heightAt5e(at)).toBeGreaterThan(0.3);
    expect(channelClearance(at, 'grand')).toBeGreaterThan(1);
    expect(channelClearance(at, 'grand')).toBeLessThan(4.5);
    const cabin = HUTTE_5E.cabin;
    expect(heightAt5e(cabin)).toBeGreaterThan(0.6);
    expect(pathDistance(at)).toBeGreaterThan(12);
    expect(pathDistance(cabin)).toBeGreaterThan(12);
    // Le pont des Roselières : son tronçon passe le chenal à plus de quinze unités.
    expect(distanceToPolyline(at, [node('ros-1'), node('ros-2')])).toBeGreaterThan(15);
    for (const p of PLACES_5E) expect(distance(p.center, at), p.id).toBeGreaterThan(30);
    expect(detourAtPoint(at, '5e')).toBe(HUTTE);
    expect(detourAtPoint(at)).toBeNull();
    expect(detourAtPoint({ x: at.x + HUTTE.radius + 0.5, z: at.z }, '5e')).toBeNull();
    expect(distance(cabin, at)).toBeGreaterThan(HUTTE.radius + cabin.r);
  });

  it('Kéo s’arrête devant la cabane, à l’est de sa porte, face à l’eau', () => {
    const c = HUTTE_5E.cabin;
    // Le chenal est au nord-nord-est de la cabane : Kéo est entre elle et l'eau, à l'est.
    expect(channelClearance(HUTTE.at, 'grand')).toBeLessThan(channelClearance(c, 'grand'));
    expect(HUTTE.at.x).toBeGreaterThan(c.x);
  });

  it('sa sente part du chemin du pont, passé le pont, et reste sur le sol sec, sans un arbre', () => {
    const [start, end] = HUTTE.sente;
    expect(distanceToPolyline(start, [node('ros-1'), node('ros-2')])).toBeLessThan(0.3);
    expect(channelClearance(start)).toBeGreaterThan(3);
    expect(end).toEqual(HUTTE.at);
    const len = distance(start, end);
    for (let t = 0; t <= len; t += 0.5) {
      const p = { x: start.x + ((end.x - start.x) * t) / len, z: start.z + ((end.z - start.z) * t) / len };
      expect(heightAt5e(p), `${t}`).toBeGreaterThan(0.2);
      expect(inHutteClearing(p)).toBe(true);
    }
    const tile = TERRAIN_5E.step * TERRAIN_5E.tileCells;
    const xs = [Math.min(start.x, end.x) - 8, Math.max(start.x, end.x) + 8];
    const zs = [Math.min(start.z, end.z) - 8, Math.max(start.z, end.z) + 8];
    for (let tx = Math.floor((xs[0] - TERRAIN_5E.minX) / tile); tx <= Math.floor((xs[1] - TERRAIN_5E.minX) / tile); tx++)
      for (let tz = Math.floor((zs[0] - TERRAIN_5E.minZ) / tile); tz <= Math.floor((zs[1] - TERRAIN_5E.minZ) / tile); tz++)
        for (const o of obstaclesIn5e(tx, tz)) {
          if (o.x === HUTTE_5E.cabin.x && o.z === HUTTE_5E.cabin.z) continue;
          expect(distanceToPolyline(o, HUTTE.sente) - o.r, `${o.x},${o.z}`).toBeGreaterThan(0.8);
          expect(distance(o, HUTTE.at) - o.r, `${o.x},${o.z}`).toBeGreaterThan(HUTTE.radius);
        }
  });

  it('ses deux touffes de roseaux bordent la sente dans sa moitié côté chemin, jamais dessus, sur le sol sec', () => {
    const [start, end] = HUTTE.sente;
    const len = distance(start, end);
    for (let k = 0; k < HUTTE_REEDS.length; k++) {
      const p = hutteReedAt(k);
      expect(distanceToPolyline(p, HUTTE.sente), String(k)).toBeGreaterThan(1);
      expect(distance(p, start), String(k)).toBeLessThan(len / 2);
      expect(distance(p, HUTTE_5E.cabin), String(k)).toBeGreaterThan(HUTTE_5E.cabin.r + 2);
      expect(heightAt5e(p), String(k)).toBeGreaterThan(0.2);
    }
  });

  it('la cabane bloque la marche libre, une fois', () => {
    let found = 0;
    for (let tx = 0; tx < TERRAIN_5E.tilesX; tx++)
      for (let tz = 0; tz < TERRAIN_5E.tilesZ; tz++) found += obstaclesIn5e(tx, tz).filter((o) => o.x === HUTTE_5E.cabin.x && o.z === HUTTE_5E.cabin.z).length;
    expect(found).toBe(1);
  });

  it('coûte 175 triangles au plus sans sa sente, sa lanterne d’ocre allumée dès le départ ; la sente se trace une fois trouvée', () => {
    const hidden = hutteFacets(false, ground);
    expect(hidden.triangles).toBeLessThanOrEqual(175);
    // Une lanterne : sa vitre, un pavé (dix triangles, trente sommets).
    expect(countColor(hidden, COLORS_5E.lantern)).toBe(30);
    const traced = hutteFacets(true, ground);
    expect(traced.triangles).toBeGreaterThan(hidden.triangles);
    expect(traced.triangles - hidden.triangles).toBeLessThan(120);
  });
});
