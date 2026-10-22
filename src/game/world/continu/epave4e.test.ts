// Le Détour de l'Épave (lot 2 du monde ouvert du 4e) : sa place sur la grève sud, hors des chemins, sur le sable sec, la
// coque sur sa cale entre Kéo et la mer, sa sente depuis le chemin du port, la végétation qui s'en écarte, sa lanterne
// allumée, ses 175 triangles, sa sauvegarde, et les mots qu'on n'écrit pas.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DETOUR_IDS as SAVED_IDS, sanitizeDetours } from '../../engine/detours';
import { findDetour } from '../detoursSaved';
import { DETOURS_4E, DETOUR_IDS, detourAtPoint, detourById, detourCap, detourViewOf } from './detours';
import { EPAVE, EPAVE_BUDGET, EPAVE_STONES, epaveFacets, epaveStoneAt } from './epave4e';
import type { Facets } from './facets';
import { distance, distanceToPolyline, linearRgb } from './geometry';
import { NETWORK_4E } from './paths4e';
import { COLORS_5E } from './plan5e';
import { EPAVE_4E, PATH_EDGES_4E, PLACES_4E, RAFIOT_4E, TERRAIN_4E, inEpaveClearing } from './plan4e';
import { EPAVE_HULL_DISKS, buildHeightField4e, groundOn4e, heightAt4e, obstaclesIn4e, walkBlocked4e } from './terrain4e';

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

describe('L’Épave, le premier Détour du 4e', () => {
  it('se nomme « L’Épave », aux Fabriques, dans la sauvegarde après ceux du 6e et du 5e, avant le Recoin', () => {
    expect(detourById('epave')).toBe(EPAVE);
    expect(DETOURS_4E[0]).toBe(EPAVE);
    expect(EPAVE.name).toBe('L’Épave');
    expect(EPAVE.land).toBe('fabriques');
    expect(SAVED_IDS).toEqual(DETOUR_IDS);
    expect(DETOUR_IDS.indexOf('epave')).toBe(DETOUR_IDS.indexOf('perchoir') + 1);
    expect(sanitizeDetours(['epave', 'perchoir', 'butte-chantier'])).toEqual(['butte-chantier', 'perchoir', 'epave']);
    const state = findDetour({ world: { parts: {}, log: [], links: {} } } as never, 'epave') as { world: { detours: string[] } };
    expect(state.world.detours).toEqual(['epave']);
  });

  it('se tient sur la grève sud, sur le sable sec, hors des chemins, à l’ouest du quai du Rafiot', () => {
    const at = EPAVE.at;
    expect(heightAt4e(at)).toBeGreaterThan(0.6);
    expect(walkBlocked4e(at)).toBe(false);
    expect(pathDistance(at)).toBeGreaterThan(30);
    for (const p of PLACES_4E) expect(distance(p.center, at), p.id).toBeGreaterThan(30);
    expect(RAFIOT_4E.quay[0].x - at.x).toBeGreaterThan(25);
    expect(detourAtPoint(at, '4e')).toBe(EPAVE);
    expect(detourAtPoint(at)).toBeNull();
    expect(detourAtPoint(at, '5e')).toBeNull();
    expect(detourAtPoint({ x: at.x + EPAVE.radius + 0.5, z: at.z }, '4e')).toBeNull();
  });

  it('la coque est entre Kéo et la mer, droite sur le sable sec, et ne se traverse pas', () => {
    const { hull } = EPAVE_4E;
    // La mer au sud : la coque au sud de Kéo, hors de son rayon, sur le sable sec de bout en bout.
    expect(hull.z - hull.beam - EPAVE.at.z).toBeGreaterThan(EPAVE.radius + 1);
    for (const dx of [-hull.half, 0, hull.half]) for (const dz of [-hull.beam, 0, hull.beam]) expect(heightAt4e({ x: hull.x + dx, z: hull.z + dz }), `${dx},${dz}`).toBeGreaterThan(0.8);
    // Plus bas vers la mer, au pied de la cale.
    expect(heightAt4e({ x: hull.x, z: hull.z + 10 })).toBeLessThan(heightAt4e({ x: hull.x, z: hull.z }) - 0.3);
    let found = 0;
    for (let tx = 0; tx < TERRAIN_4E.tilesX; tx++)
      for (let tz = 0; tz < TERRAIN_4E.tilesZ; tz++) found += obstaclesIn4e(tx, tz).filter((o) => EPAVE_HULL_DISKS.includes(o)).length;
    expect(found).toBe(EPAVE_HULL_DISKS.length);
    for (const d of EPAVE_HULL_DISKS) expect(distance(d, EPAVE.at) - d.r).toBeGreaterThan(EPAVE.radius);
  });

  it('à l’arrivée, la caméra se tourne vers la mer, au sud, un peu vers l’est, et ne monte pas', () => {
    const cap = detourCap(EPAVE)!;
    // La caméra regarde vers −(sin cap, cos cap) : au sud (+z), quinze degrés vers l'est (+x).
    const look = { x: -Math.sin(cap), z: -Math.cos(cap) };
    expect(look.z).toBeGreaterThan(0.95);
    expect(look.x).toBeGreaterThan(0.2);
    expect(look.x).toBeLessThan(0.3);
    expect(detourViewOf(EPAVE).height).toBeLessThanOrEqual(0);
  });

  it('sa sente part du chemin du port et reste sur le sol sec, sans un buisson ni un rocher', () => {
    const [start, end] = EPAVE.sente;
    expect(pathDistance(start)).toBeLessThan(0.3);
    expect(end).toEqual(EPAVE.at);
    const len = distance(start, end);
    for (let t = 0; t <= len; t += 0.5) {
      const p = { x: start.x + ((end.x - start.x) * t) / len, z: start.z + ((end.z - start.z) * t) / len };
      expect(heightAt4e(p), `${t}`).toBeGreaterThan(0.3);
      expect(walkBlocked4e(p), `${t}`).toBe(false);
      expect(inEpaveClearing(p)).toBe(true);
    }
    const tile = TERRAIN_4E.step * TERRAIN_4E.tileCells;
    const xs = [Math.min(start.x, end.x) - 8, Math.max(start.x, end.x) + 8];
    const zs = [Math.min(start.z, end.z) - 12, Math.max(start.z, end.z) + 12];
    for (let tx = Math.floor((xs[0] - TERRAIN_4E.minX) / tile); tx <= Math.floor((xs[1] - TERRAIN_4E.minX) / tile); tx++)
      for (let tz = Math.floor((zs[0] - TERRAIN_4E.minZ) / tile); tz <= Math.floor((zs[1] - TERRAIN_4E.minZ) / tile); tz++)
        for (const o of obstaclesIn4e(tx, tz)) {
          if (EPAVE_HULL_DISKS.includes(o)) continue;
          expect(distanceToPolyline(o, EPAVE.sente) - o.r, `${o.x},${o.z}`).toBeGreaterThan(0.8);
          expect(distance(o, EPAVE_4E.hull) - o.r, `${o.x},${o.z}`).toBeGreaterThan(EPAVE_4E.hull.half);
        }
  });

  it('ses trois pierres entourent Kéo, de part et d’autre de la sente, jamais dessus ni sous la coque', () => {
    for (let k = 0; k < EPAVE_STONES.length; k++) {
      const p = epaveStoneAt(k);
      expect(distanceToPolyline(p, EPAVE.sente), String(k)).toBeGreaterThan(1);
      expect(distance(p, EPAVE.at), String(k)).toBeLessThan(4);
      for (const d of EPAVE_HULL_DISKS) expect(distance(p, d), String(k)).toBeGreaterThan(d.r);
    }
  });

  it('coûte 175 triangles au plus sans sa sente, sa lanterne d’ocre allumée dès le départ ; la sente se trace une fois trouvée', () => {
    const hidden = epaveFacets(false, ground);
    expect(EPAVE_BUDGET.triangles).toBe(175);
    expect(hidden.triangles).toBeLessThanOrEqual(EPAVE_BUDGET.triangles);
    // Une lanterne : sa vitre, un pavé (dix triangles, trente sommets).
    expect(countColor(hidden, COLORS_5E.lantern)).toBe(30);
    const traced = epaveFacets(true, ground);
    expect(traced.triangles).toBeGreaterThan(hidden.triangles);
    expect(traced.triangles - hidden.triangles).toBeLessThanOrEqual(EPAVE_BUDGET.sente);
  });

  it('aucun texte ne dit « naufrage », « coulé » ni « perdu »', () => {
    const src = readFileSync(resolve('src/game/world/continu/epave4e.ts'), 'utf8').toLowerCase();
    for (const word of ['naufrag', 'coulé', 'perdu']) expect(src.includes(word), word).toBe(false);
  });
});
