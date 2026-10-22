// Le Détour de la Dalle (lot 3 du monde ouvert du 4e, l'Épaule) : sa place sur la roche, hors des chemins, loin des
// lieux ; la dalle et son muret entre Kéo et la mer ; la vue tournée au nord-nord-est, jamais vers la coulée ; sa sente
// depuis le chemin, sans un buisson ; sa lanterne allumée ; ses 175 triangles ; sa sauvegarde ; la phrase de Kéo.
import { describe, expect, it } from 'vitest';
import { DETOUR_IDS as SAVED_IDS, sanitizeDetours } from '../../engine/detours';
import { findDetour } from '../detoursSaved';
import { DALLE, DALLE_BUDGET, DALLE_LAYOUT, dalleFacets } from './dalle4e';
import { DETOURS_4E, DETOUR_IDS, detourAtPoint, detourById, detourCap, detourViewOf } from './detours';
import type { Facets } from './facets';
import { distance, distanceToPolyline, linearRgb } from './geometry';
import { NETWORK_4E } from './paths4e';
import { COLORS_5E } from './plan5e';
import { DALLE_4E, DALLE_SLAB_AT, PATH_EDGES_4E, PLACES_4E, TERRAIN_4E, inDalleClearing } from './plan4e';
import { buildHeightField4e, groundOn4e, heightAt4e, obstaclesIn4e, walkBlocked4e } from './terrain4e';

const field = buildHeightField4e();
const ground = (x: number, z: number) => groundOn4e(field, x, z);
const node = (id: string) => NETWORK_4E.pathNode(id).at;
const EDGES = PATH_EDGES_4E.map(([a, b]) => [node(a), node(b)]);
const pathDistance = (p: { x: number; z: number }) => Math.min(...EDGES.map((l) => distanceToPolyline(p, l)));

function countColor(f: Facets, color: number): number {
  const [r, g, b] = linearRgb(color);
  let n = 0;
  for (let i = 0; i < f.colors.length; i += 3) if (Math.abs(f.colors[i] - r) < 1e-4 && Math.abs(f.colors[i + 1] - g) < 1e-4 && Math.abs(f.colors[i + 2] - b) < 1e-4) n++;
  return n;
}

describe('La Dalle, le Détour de l’Épaule', () => {
  it('se nomme « La Dalle », à l’Épaule, dans la sauvegarde après l’Épave et le Recoin ; Kéo y dit sa phrase', () => {
    expect(detourById('dalle')).toBe(DALLE);
    expect(DETOURS_4E.map((d) => d.id)).toEqual(['epave', 'recoin', 'dalle']);
    expect(DALLE.name).toBe('La Dalle');
    expect(DALLE.land).toBe('epaule');
    expect(DALLE.says).toBe('D’ici, on voit toute la mer.');
    expect(SAVED_IDS).toEqual(DETOUR_IDS);
    expect(DETOUR_IDS.at(-1)).toBe('dalle');
    expect(DETOUR_IDS.at(-2)).toBe('recoin');
    expect(sanitizeDetours(['dalle', 'epave'])).toEqual(['epave', 'dalle']);
    const state = findDetour({ world: { parts: {}, log: [], links: {} } } as never, 'dalle') as { world: { detours: string[] } };
    expect(state.world.detours).toEqual(['dalle']);
  });

  it('se tient sur la roche, hors des chemins et loin des lieux ; on la trouve en marchant', () => {
    const at = DALLE.at;
    expect(heightAt4e(at)).toBeGreaterThan(0.6);
    expect(walkBlocked4e(at)).toBe(false);
    expect(pathDistance(at)).toBeGreaterThan(8);
    for (const p of PLACES_4E) expect(distance(p.center, at), p.id).toBeGreaterThan(15);
    expect(detourAtPoint(at, '4e')).toBe(DALLE);
    expect(detourAtPoint(at)).toBeNull();
    expect(detourAtPoint({ x: at.x + DALLE.radius + 0.5, z: at.z }, '4e')).toBeNull();
  });

  it('la dalle et son muret sont entre Kéo et la mer, hors de son rayon ; la lanterne à sa droite', () => {
    const { sea, slab, wall, lamp } = DALLE_LAYOUT;
    expect(slab.ahead - slab.deep / 2).toBeGreaterThan(0.3);
    for (const w of wall) expect(w.ahead).toBeGreaterThan(slab.ahead + slab.deep / 2);
    expect(lamp.side).toBeGreaterThan(DALLE.radius);
    // La mer est au nord-nord-est : vingt degrés à l'est du nord.
    expect(sea.z).toBeLessThan(-0.9);
    expect(sea.x).toBeGreaterThan(0.3);
  });

  it('la dalle, ses colonnes et le muret restent dans le disque que la végétation laisse libre (une seule source)', () => {
    const { slab, wall, from } = DALLE_LAYOUT;
    const inside = (p: { x: number; z: number }, margin: number) => expect(distance(p, DALLE_SLAB_AT) + margin).toBeLessThan(DALLE_4E.keep.slab);
    for (const sa of [-1, 1]) for (const ss of [-1, 1]) inside(from(slab.ahead + (sa * slab.deep) / 2, (ss * slab.long) / 2), 0);
    for (const w of wall) inside(from(w.ahead, w.side), Math.hypot(w.s[0], w.s[2]) / 2);
  });

  it('à l’arrivée, la caméra se tourne vers la mer, au nord-nord-est, jamais à l’est de 55°, et ne monte pas', () => {
    const cap = detourCap(DALLE)!;
    const look = { x: -Math.sin(cap), z: -Math.cos(cap) };
    const compass = (Math.atan2(look.x, -look.z) * 180) / Math.PI;
    expect(compass).toBeGreaterThan(10);
    expect(compass).toBeLessThan(55);
    expect(detourViewOf(DALLE).height).toBeLessThanOrEqual(0);
  });

  it('sa sente part du chemin et reste sur la roche, sans un buisson ni un rocher', () => {
    const [start, end] = DALLE.sente;
    expect(pathDistance(start)).toBeLessThan(0.3);
    expect(end).toEqual(DALLE.at);
    const len = distance(start, end);
    for (let t = 0; t <= len; t += 0.5) {
      const p = { x: start.x + ((end.x - start.x) * t) / len, z: start.z + ((end.z - start.z) * t) / len };
      expect(heightAt4e(p), `${t}`).toBeGreaterThan(0.3);
      expect(walkBlocked4e(p), `${t}`).toBe(false);
      expect(inDalleClearing(p)).toBe(true);
    }
    const tile = TERRAIN_4E.step * TERRAIN_4E.tileCells;
    const xs = [Math.min(start.x, end.x) - 8, Math.max(start.x, end.x) + 8];
    const zs = [Math.min(start.z, end.z) - 10, Math.max(start.z, end.z) + 8];
    for (let tx = Math.floor((xs[0] - TERRAIN_4E.minX) / tile); tx <= Math.floor((xs[1] - TERRAIN_4E.minX) / tile); tx++)
      for (let tz = Math.floor((zs[0] - TERRAIN_4E.minZ) / tile); tz <= Math.floor((zs[1] - TERRAIN_4E.minZ) / tile); tz++)
        for (const o of obstaclesIn4e(tx, tz)) expect(distanceToPolyline(o, DALLE.sente) - o.r, `${o.x},${o.z}`).toBeGreaterThan(0.8);
    expect(DALLE_4E.keep.sente).toBeGreaterThan(2);
  });

  it('coûte 175 triangles au plus sans sa sente, sa lanterne d’ocre allumée dès le départ ; la sente se trace une fois trouvée', () => {
    const hidden = dalleFacets(false, ground);
    expect(DALLE_BUDGET.triangles).toBe(175);
    expect(hidden.triangles).toBeLessThanOrEqual(DALLE_BUDGET.triangles);
    expect(countColor(hidden, COLORS_5E.lantern)).toBeGreaterThan(0);
    const traced = dalleFacets(true, ground);
    expect(traced.triangles).toBeGreaterThan(hidden.triangles);
    expect(traced.triangles - hidden.triangles).toBeLessThanOrEqual(DALLE_BUDGET.sente);
  });
});
