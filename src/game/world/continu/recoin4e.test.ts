// Le Détour du Recoin (lot 3 du monde ouvert du 4e) : sa place sur la côte nord du Bastion, hors des chemins, l'angle de
// ses murets ouvert au sud et à l'est, la chaudière fermée à ses deux bouts et ouverte par le dessus, le figuier qui en
// sort, sa sente qui contourne la cour de la Manufacture, la végétation qui s'en écarte, sa lanterne allumée, ses 175
// triangles, sa sauvegarde, et les mots qu'on n'écrit pas.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DETOUR_IDS as SAVED_IDS, sanitizeDetours } from '../../engine/detours';
import { findDetour } from '../detoursSaved';
import { DETOURS_4E, DETOUR_IDS, detourAtPoint, detourById, detourCap, detourViewOf } from './detours';
import { EPAVE } from './epave4e';
import type { Facets } from './facets';
import { followPose, screenOf } from './camera';
import { distance, distanceToPolyline, linearRgb } from './geometry';
import { MANUFACTURE_LAYOUT } from './manufacture4e';
import { NETWORK_4E } from './paths4e';
import { COLORS_5E } from './plan5e';
import { PATH_EDGES_4E, PLACES_4E, RECOIN_4E, TERRAIN_4E, inRecoinClearing } from './plan4e';
import { RECOIN, RECOIN_BUDGET, RECOIN_STONES, RECOIN_WALLS, recoinFacets, recoinStoneAt } from './recoin4e';
import { RECOIN_BOILER_DISKS, buildHeightField4e, groundOn4e, heightAt4e, obstaclesIn4e, walkBlocked4e } from './terrain4e';

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

/** Les sommets d'un décor, de couleur `color` (ou tous). */
function points(f: Facets, color?: number): { x: number; y: number; z: number }[] {
  const out: { x: number; y: number; z: number }[] = [];
  const c = color === undefined ? null : linearRgb(color);
  for (let i = 0; i < f.positions.length; i += 3) {
    if (c && (Math.abs(f.colors[i] - c[0]) > 1e-4 || Math.abs(f.colors[i + 1] - c[1]) > 1e-4 || Math.abs(f.colors[i + 2] - c[2]) > 1e-4)) continue;
    out.push({ x: f.positions[i], y: f.positions[i + 1], z: f.positions[i + 2] });
  }
  return out;
}

describe('Le Recoin, le Détour du Bastion', () => {
  it('se nomme « Le Recoin », au Bastion, dans la sauvegarde après l’Épave', () => {
    expect(detourById('recoin')).toBe(RECOIN);
    expect(DETOURS_4E.map((d) => d.id)).toEqual(['epave', 'recoin', 'dalle', 'replat']);
    expect(DETOURS_4E.slice(0, 2)).toEqual([EPAVE, RECOIN]);
    expect(RECOIN.name).toBe('Le Recoin');
    expect(RECOIN.land).toBe('bastion');
    expect(SAVED_IDS).toEqual(DETOUR_IDS);
    expect(DETOUR_IDS.indexOf('recoin')).toBe(DETOUR_IDS.indexOf('epave') + 1);
    expect(sanitizeDetours(['recoin', 'epave', 'creux'])).toEqual(['creux', 'epave', 'recoin']);
    const state = findDetour({ world: { parts: {}, log: [], links: {} } } as never, 'recoin') as { world: { detours: string[] } };
    expect(state.world.detours).toEqual(['recoin']);
  });

  it('se tient sur la côte nord, sur la terre, hors des chemins et des lieux', () => {
    const at = RECOIN.at;
    expect(heightAt4e(at)).toBeGreaterThan(0.6);
    expect(walkBlocked4e(at)).toBe(false);
    expect(pathDistance(at)).toBeGreaterThan(25);
    for (const p of PLACES_4E) expect(distance(p.center, at), p.id).toBeGreaterThan(25);
    expect(detourAtPoint(at, '4e')).toBe(RECOIN);
    expect(detourAtPoint(at)).toBeNull();
    expect(detourAtPoint(at, '5e')).toBeNull();
    expect(detourAtPoint({ x: at.x, z: at.z + RECOIN.radius + 0.5 }, '4e')).toBeNull();
    // La mer au nord, à une quinzaine d'unités : par-dessus les murets.
    expect(heightAt4e({ x: at.x, z: at.z - 22 })).toBeLessThan(0.05);
  });

  it('l’angle des murets, au nord et à l’ouest, est ouvert au sud et à l’est, à hauteur de taille', () => {
    const W = RECOIN_WALLS;
    expect(W.north.z).toBeLessThan(-2);
    expect(W.west.x).toBeLessThan(-2);
    // Le muret nord court vers l'est, le muret ouest vers le sud : rien ne ferme le sud ni l'est (jamais en U).
    expect(W.north.x1).toBeGreaterThan(2);
    expect(W.west.z1).toBeGreaterThan(1);
    const top = (x: number, z: number) => W.high + ground(RECOIN_4E.corner.x + x, RECOIN_4E.corner.z + z);
    expect(W.high).toBeGreaterThan(0.75);
    expect(W.high).toBeLessThan(1.05);
    expect(top(0, W.north.z)).toBeGreaterThan(0);
  });

  it('la chaudière est couchée le long du muret nord, fermée à ses deux bouts, ouverte par le dessus, et ne se traverse pas', () => {
    const { boiler: k } = RECOIN_4E;
    const f = recoinFacets(false, ground);
    // Ses bouts : deux faces pleines (deux éventails de six triangles, depuis un coin), de la couleur des bouts.
    const ends = points(f, 0x4a3834);
    expect(ends.length).toBe(2 * 6 * 3);
    const west = ends.filter((p) => Math.abs(p.x - (k.x - k.half)) < 1e-3);
    const east = ends.filter((p) => Math.abs(p.x - (k.x + k.half)) < 1e-3);
    expect(west.length + east.length).toBe(ends.length);
    expect(west.length).toBe(east.length);
    // Son corps, le long de x, entre les deux bouts, près du muret nord, au nord de Kéo.
    const body = points(f, 0x5a4640);
    for (const p of body) {
      expect(p.x).toBeGreaterThanOrEqual(k.x - k.half - 1e-3);
      expect(p.x).toBeLessThanOrEqual(k.x + k.half + 1e-3);
    }
    expect(RECOIN_4E.corner.z + RECOIN_WALLS.north.z + RECOIN_WALLS.thick / 2).toBeLessThan(k.z - k.r);
    expect(k.z + k.r).toBeLessThan(RECOIN.at.z - 0.5);
    // Le trou d'homme : une ombre sur le dessus (plus haut que tout le corps), jamais tournée vers la caméra.
    const hole = points(f, 0x3a2c28);
    expect(hole.length).toBe(4 * 3);
    const crest = Math.max(...body.map((p) => p.y));
    for (const p of hole) expect(p.y).toBeGreaterThanOrEqual(crest);
    // Elle bloque la marche, sans toucher Kéo.
    let found = 0;
    for (let tx = 0; tx < TERRAIN_4E.tilesX; tx++)
      for (let tz = 0; tz < TERRAIN_4E.tilesZ; tz++) found += obstaclesIn4e(tx, tz).filter((o) => RECOIN_BOILER_DISKS.includes(o)).length;
    expect(found).toBe(RECOIN_BOILER_DISKS.length);
    for (const d of RECOIN_BOILER_DISKS) expect(distance(d, RECOIN.at) - d.r).toBeGreaterThan(0.6);
  });

  it('la chaudière est de fer sombre cerclé, distincte de la brique des murets coiffés de pierre grise (retouche 1)', () => {
    const f = recoinFacets(false, ground);
    const { boiler: k } = RECOIN_4E;
    // La brique sombre, dans les murets seulement : aucun de ses sommets dans la chaudière.
    for (const p of points(f, 0x945c58)) expect(Math.abs(p.x - k.x) < k.half - 0.05 && Math.abs(p.z - k.z) < k.r - 0.05).toBe(false);
    expect(countColor(f, 0xa4553e)).toBe(0);
    expect(countColor(f, 0x5a4640)).toBeGreaterThan(0);
    expect(countColor(f, 0x3e302c)).toBeGreaterThan(0);
    expect(countColor(f, 0x8f8b88)).toBeGreaterThan(0);
  });

  it('le figuier sort du trou d’homme et couvre l’angle, en deux masses vert olive sec', () => {
    const f = recoinFacets(false, ground);
    const leaf = points(f, 0x8a8a4c);
    // La grande masse sur huit côtés, la petite sur six (restes du monde ouvert du 4e, point 3).
    expect(leaf.length).toBe((8 + 6) * 3);
    const top = Math.max(...leaf.map((p) => p.y));
    const wallTop = Math.max(...points(f, 0x8f8b88).map((p) => p.y));
    expect(top - wallTop).toBeGreaterThan(2);
    const bark = points(f, 0x8a8076);
    const foot = bark.reduce((a, p) => (p.y < a.y ? p : a));
    expect(Math.abs(foot.x - (RECOIN_4E.boiler.x - 0.35))).toBeLessThan(0.3);
    expect(Math.abs(foot.z - RECOIN_4E.boiler.z)).toBeLessThan(0.3);
  });

  it('à l’arrivée, la caméra se tourne vers l’angle et la mer du nord, basse : la chaudière à côté de Kéo, jamais derrière lui', () => {
    const cap = detourCap(RECOIN)!;
    // La caméra regarde vers −(sin cap, cos cap) : vers le nord, à peine vers l'ouest et l'angle des murets.
    const look = { x: -Math.sin(cap), z: -Math.cos(cap) };
    expect(look.z).toBeLessThan(-0.9);
    expect(look.x).toBeLessThan(0);
    // Plus basse que la vue commune des Détours, qui plongeait presque à la verticale (captures du 22 octobre 2026).
    const view = detourViewOf(RECOIN);
    expect(view.height).toBeLessThan(0);
    const g = ground;
    const feet = { x: RECOIN.at.x, y: g(RECOIN.at.x, RECOIN.at.z), z: RECOIN.at.z };
    const pose = followPose(feet, 0, undefined, cap, 1, undefined, view);
    expect(pose.position.y - feet.y).toBeLessThan(6);
    const [W, H] = [1024, 768];
    const keo = screenOf(pose, { x: feet.x, y: feet.y + 1.2, z: feet.z }, W, H);
    const k = RECOIN_4E.boiler;
    const axis = g(k.x, k.z) + 0.9;
    const boiler = screenOf(pose, { x: k.x, y: axis, z: k.z }, W, H);
    // Kéo s'arrête à l'est de la chaudière : elle est toute à sa gauche, son bout est hors de sa silhouette ; ses deux
    // bouts et l'angle des murets dans l'image.
    expect(keo.x - boiler.x).toBeGreaterThan(80);
    for (const dx of [-k.half, k.half]) {
      const end = screenOf(pose, { x: k.x + dx, y: axis, z: k.z }, W, H);
      expect(end.x).toBeGreaterThan(16);
      expect(keo.x - end.x).toBeGreaterThan(40);
    }
    const corner = screenOf(pose, { x: RECOIN_4E.corner.x + RECOIN_WALLS.west.x, y: g(RECOIN_4E.corner.x, RECOIN_4E.corner.z) + 0.9, z: RECOIN_4E.corner.z + RECOIN_WALLS.north.z }, W, H);
    expect(corner.x).toBeGreaterThan(16);
  });

  it('sa sente part de la porte de la Manufacture, contourne sa cour, et reste sur le sol sec, sans un buisson ni un rocher', () => {
    const line = RECOIN.sente;
    expect(pathDistance(line[0])).toBeLessThan(0.3);
    expect(line.at(-1)).toEqual(RECOIN.at);
    const manufacture = PLACES_4E.find((p) => p.id === 'manufacture')!.center;
    const { yard } = MANUFACTURE_LAYOUT;
    for (let i = 1; i < line.length; i++) {
      const a = line[i - 1],
        c = line[i];
      const len = distance(a, c);
      for (let t = 0; t <= len; t += 0.5) {
        const p = { x: a.x + ((c.x - a.x) * t) / len, z: a.z + ((c.z - a.z) * t) / len };
        expect(heightAt4e(p), `${i}:${t}`).toBeGreaterThan(0.3);
        expect(walkBlocked4e(p), `${i}:${t}`).toBe(false);
        expect(inRecoinClearing(p)).toBe(true);
        // Jamais dans la cour de la Manufacture.
        const lx = p.x - manufacture.x,
          lz = p.z - manufacture.z;
        const inYard = lx >= Math.min(...yard.map((q) => q.x)) && lx <= Math.max(...yard.map((q) => q.x)) && lz >= Math.min(...yard.map((q) => q.z)) && lz <= Math.max(...yard.map((q) => q.z));
        expect(inYard, `${i}:${t}`).toBe(false);
      }
    }
    const tile = TERRAIN_4E.step * TERRAIN_4E.tileCells;
    const xs = [Math.min(...line.map((p) => p.x)) - 8, Math.max(...line.map((p) => p.x)) + 8];
    const zs = [Math.min(...line.map((p) => p.z)) - 8, Math.max(...line.map((p) => p.z)) + 8];
    for (let tx = Math.floor((xs[0] - TERRAIN_4E.minX) / tile); tx <= Math.floor((xs[1] - TERRAIN_4E.minX) / tile); tx++)
      for (let tz = Math.floor((zs[0] - TERRAIN_4E.minZ) / tile); tz <= Math.floor((zs[1] - TERRAIN_4E.minZ) / tile); tz++)
        for (const o of obstaclesIn4e(tx, tz)) {
          if (RECOIN_BOILER_DISKS.includes(o)) continue;
          expect(distanceToPolyline(o, line) - o.r, `${o.x},${o.z}`).toBeGreaterThan(0.8);
          expect(distance(o, RECOIN.at) - o.r, `${o.x},${o.z}`).toBeGreaterThan(3);
        }
  });

  it('ses trois pierres entourent Kéo, de part et d’autre de la sente, jamais dessus ni dans l’angle', () => {
    for (let k = 0; k < RECOIN_STONES.length; k++) {
      const p = recoinStoneAt(k);
      expect(distanceToPolyline(p, RECOIN.sente), String(k)).toBeGreaterThan(1);
      expect(distance(p, RECOIN.at), String(k)).toBeLessThan(4);
      expect(p.z - RECOIN_4E.corner.z, String(k)).toBeGreaterThan(RECOIN_WALLS.north.z + 1);
      expect(p.x - RECOIN_4E.corner.x, String(k)).toBeGreaterThan(RECOIN_WALLS.west.x + 1);
    }
    const sides = RECOIN_STONES.map((s) => Math.sign(s.x - RECOIN_4E.foot.x + RECOIN_4E.corner.x));
    expect(new Set(sides).size).toBe(2);
  });

  it('coûte 175 triangles au plus sans sa sente, sa lanterne d’ocre allumée dès le départ ; la sente se trace une fois trouvée', () => {
    const hidden = recoinFacets(false, ground);
    expect(RECOIN_BUDGET).toEqual({ triangles: 175, sente: 170 });
    expect(hidden.triangles).toBeLessThanOrEqual(RECOIN_BUDGET.triangles);
    // Une lanterne : sa vitre, un pavé (dix triangles, trente sommets).
    expect(countColor(hidden, COLORS_5E.lantern)).toBe(30);
    const traced = recoinFacets(true, ground);
    expect(traced.triangles).toBeGreaterThan(hidden.triangles);
    expect(traced.triangles - hidden.triangles).toBeLessThanOrEqual(RECOIN_BUDGET.sente);
  });

  it('aucun texte ne dit « chaudière », « oublié », « abandonné » ni « perdu » à l’écran', () => {
    expect(RECOIN.name.toLowerCase()).not.toMatch(/chaudi|oubli|abandon|perdu/);
    const src = readFileSync(resolve('src/game/world/continu/recoin4e.ts'), 'utf8').toLowerCase();
    for (const word of ['oublié', 'abandonné', 'perdu']) expect(src.includes(word), word).toBe(false);
  });
});
