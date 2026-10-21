// Le Perchoir (GD-22, lot 16) : le quatrième Détour du 5e, une dalle bordée d'un muret bas au pied d'une aiguille, aux
// Aiguilles. Sa place, sa sente, la caméra à l'arrivée, sa lanterne, son coût (175 triangles au plus, sente comprise).
// Sans Three.js.
import { describe, expect, it } from 'vitest';
import { DETOURS, DETOURS_5E, DETOUR_IDS, detourAtPoint, detourById, detourCap, detourViewOf } from './detours';
import { DETOUR_IDS as ENGINE_DETOUR_IDS } from '../../engine/detours';
import { followPose } from './camera';
import { buildWalkGrid, freeRoute, isWalkable } from './freeWalk';
import { distance, distanceToPolyline, linearRgb } from './geometry';
import { planFor } from './levelPlan';
import { routeLength } from './paths';
import { COLORS_5E, NEEDLES_5E, PATH_EDGES_5E, PATH_NODES_5E, PERCHOIR_5E } from './plan5e';
import { SENTE_5E } from './creux5e';
import { PERCHOIR, PERCHOIR_LANTERN, SENTE_PERCHOIR, PERCHOIR_TRIANGLES_MAX, perchoirFacets, perchoirTriangles } from './perchoir5e';
import { standingHeight } from './terrain';
import { buildHeightField5e, channelClearance, heightAt5e, landDistance5e, onPlateau } from './terrain5e';

const PLAN = planFor('5e');
const nodes = new Map(PATH_NODES_5E.map((n) => [n.id, n.at]));
const pathDistance = (p: { x: number; z: number }) => Math.min(...PATH_EDGES_5E.map(([a, b]) => distanceToPolyline(p, [nodes.get(a)!, nodes.get(b)!])));
const needle = NEEDLES_5E.find((n) => Math.abs(n.at.x - 65.625) < 0.01 && Math.abs(n.at.z + 50) < 0.01)!;

const lum = (c: number) => {
  const [r, g, b] = linearRgb(c);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: number, b: number) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);

describe('Le Perchoir, quatrième Détour du 5e', () => {
  it('suit la Faille dans la liste, aux Aiguilles, avec son nom ; son identifiant suit celui de la Faille, dans les deux listes', () => {
    expect(DETOURS_5E[3]).toBe(PERCHOIR);
    expect(detourById('perchoir')).toBe(PERCHOIR);
    expect(PERCHOIR.land).toBe('aiguilles');
    expect(PERCHOIR.name).toBe('Le Perchoir');
    // Le dernier du 5e ; ceux du 4e (lot 2 : l'Épave) viennent après lui.
    expect(DETOUR_IDS[DETOUR_IDS.indexOf('faille') + 1]).toBe('perchoir');
    expect(ENGINE_DETOUR_IDS).toEqual(DETOUR_IDS);
    expect(detourAtPoint(PERCHOIR_5E.at, '5e')?.id).toBe('perchoir');
    expect(detourAtPoint(PERCHOIR_5E.at)).toBeNull();
    expect(detourAtPoint(PERCHOIR_5E.start, '5e')).toBeNull();
  });

  it('se tient à l’écart : loin de tout lieu et de l’eau, à dix unités au moins du chemin, sur le plateau, loin de son bord', () => {
    expect(pathDistance(PERCHOIR_5E.center)).toBeGreaterThan(8);
    for (const p of PLAN.places) expect(distance(PERCHOIR_5E.center, p.center), p.id).toBeGreaterThan(40);
    expect(landDistance5e(PERCHOIR_5E.center)).toBeGreaterThan(6);
    expect(channelClearance(PERCHOIR_5E.center)).toBeGreaterThan(6);
    for (const [dx, dz] of [[-4, -3], [4, -3], [-4, 3], [4, 3], [0, 0]]) expect(onPlateau({ x: PERCHOIR_5E.center.x + dx, z: PERCHOIR_5E.center.z + dz })).toBe(true);
  });

  it('est au pied nord-est de l’aiguille [1 110, 420] : la dalle et la sente ne la touchent pas', () => {
    const c = PERCHOIR_5E.center;
    expect(c.x).toBeGreaterThan(needle.at.x);
    expect(c.z).toBeLessThan(needle.at.z);
    const d = distance(c, needle.at);
    expect(d).toBeGreaterThan(6);
    expect(d).toBeLessThan(11);
    for (const [dx, dz] of [[-2.2, -1.7], [-2.2, 1.7], [2.2, 1.7], [2.2, -1.7]]) expect(distance({ x: c.x + dx, z: c.z + dz }, needle.at)).toBeGreaterThan(needle.radius + 1.5);
    expect(distanceToPolyline(needle.at, PERCHOIR_5E.sente)).toBeGreaterThan(needle.radius + 1.5);
  });

  it('sa sente part de la liaison aig-4 – aig-5, se marche jusqu’à la dalle, et contourne le muret par l’ouest', () => {
    const grid = buildWalkGrid(buildHeightField5e(), PLAN);
    const line = PERCHOIR_5E.sente;
    const edge = distanceToPolyline(PERCHOIR_5E.start, [nodes.get('aig-4')!, nodes.get('aig-5')!]);
    expect(edge).toBeLessThan(0.2);
    for (let i = 1; i < line.length; i++) {
      const a = line[i - 1],
        b = line[i];
      const n = Math.ceil(distance(a, b) / 0.5);
      for (let k = 0; k <= n; k++) {
        const p = { x: a.x + ((b.x - a.x) * k) / n, z: a.z + ((b.z - a.z) * k) / n };
        expect(isWalkable(grid, p, []), `${p.x.toFixed(1)} ${p.z.toFixed(1)}`).toBe(true);
        // Jamais sous le muret : ses blocs sont à l'est et au nord de la dalle.
        expect(p.x < PERCHOIR_5E.center.x - PERCHOIR_5E.half.x || p.z > PERCHOIR_5E.center.z - PERCHOIR_5E.half.z).toBe(true);
      }
    }
    const route = freeRoute(grid, line[0], PERCHOIR_5E.at, []);
    expect(route).not.toBeNull();
    expect(routeLength(route!)).toBeLessThan(distance(line[0], PERCHOIR_5E.at) * 1.5 + 2);
    // Le muret ne se franchit pas ; la dalle se marche.
    const c = PERCHOIR_5E.center;
    expect(isWalkable(grid, { x: c.x + PERCHOIR_5E.half.x + 0.25, z: c.z }, [])).toBe(false);
    expect(isWalkable(grid, { x: c.x, z: c.z - PERCHOIR_5E.half.z - 0.25 }, [])).toBe(false);
    expect(isWalkable(grid, PERCHOIR_5E.at, [])).toBe(true);
  });

  it('sa sente est presque continue, de terre brune moyenne, son liseré sombre lisible sur le plateau (3:1 au moins), tracée une fois trouvée seulement', () => {
    // Le liseré donne la forme : 3:1 au moins sur la pierre du plateau ; le corps, plus clair que lui, brun moyen.
    expect(contrast(SENTE_PERCHOIR.edge, COLORS_5E.stone)).toBeGreaterThanOrEqual(3);
    expect(lum(SENTE_PERCHOIR.color)).toBeGreaterThan(lum(SENTE_PERCHOIR.edge));
    expect(contrast(SENTE_PERCHOIR.color, COLORS_5E.stone)).toBeGreaterThan(1.5);
    // Moins pointillée que celle du Creux : des tronçons longs, un vide étroit.
    expect(SENTE_PERCHOIR.dash).toBeGreaterThan(SENTE_5E.dash * 2);
    expect(SENTE_PERCHOIR.gap).toBeLessThan(SENTE_5E.gap);
    expect(perchoirFacets(true).triangles).toBeGreaterThan(perchoirFacets(false).triangles);
  });

  it('son muret, qui bloque la marche, se voit : le dessus des blocs (une dalle chaude) est plus clair que le plateau, les flancs sont de sa pierre', () => {
    const f = perchoirFacets(false);
    const colors = new Set<number>();
    for (let i = 0; i < f.colors.length; i += 9) {
      const [r, g, b] = [f.colors[i], f.colors[i + 1], f.colors[i + 2]];
      for (const c of [0xcfc6b4, COLORS_5E.stone]) {
        const [cr, cg, cb] = linearRgb(c);
        if (Math.abs(r - cr) < 1e-4 && Math.abs(g - cg) < 1e-4 && Math.abs(b - cb) < 1e-4) colors.add(c);
      }
    }
    expect(colors.has(COLORS_5E.stone)).toBe(true);
    expect(lum(0xcfc6b4)).toBeGreaterThan(lum(COLORS_5E.stone) * 1.5);
  });

  it('à l’arrivée, la caméra se tourne vers le nord quel que soit le cap, ne passe jamais dans l’aiguille ni ne la met entre elle et Kéo', () => {
    const cap = detourCap(PERCHOIR)!;
    expect(Math.abs(cap)).toBeLessThan(1e-9);
    for (const d of DETOURS) expect(detourCap(d), d.id).toBeNull();
    const h = PERCHOIR_5E.at;
    const y = standingHeight(heightAt5e(h));
    const pose = followPose({ x: h.x, y, z: h.z }, 0, undefined, cap, 1, undefined, detourViewOf(PERCHOIR));
    const P = pose.position;
    expect(P.z).toBeGreaterThan(h.z);
    // Moins plongeante que la vue commune : l'horizon, donc la terre des Aiguilles et le mur de nuages, dans le tiers haut de l'image.
    const down = Math.atan2(P.y - pose.target.y, Math.hypot(P.x - pose.target.x, P.z - pose.target.z));
    const horizon = (pose.fov / 2 - (down * 180) / Math.PI) / pose.fov;
    expect(horizon).toBeGreaterThan(0.25);
    expect(horizon).toBeLessThan(0.4);
    expect(distance(P, needle.at)).toBeGreaterThan(needle.radius + 2);
    // La ligne de vue de la caméra à Kéo reste loin de l'aiguille (qui cadre la vue sur la gauche, sans la cacher).
    expect(distanceToPolyline(needle.at, [{ x: P.x, z: P.z }, h])).toBeGreaterThan(needle.radius + 1.5);
  });

  it('sa lanterne d’ocre à quatre pans brille dès le départ, sur le coin du muret ; 175 triangles au plus, sente comprise ; cinq blocs', () => {
    const count = (f: ReturnType<typeof perchoirFacets>, color: number) => {
      const [r, g, b] = linearRgb(color);
      let n = 0;
      for (let i = 0; i < f.colors.length; i += 9) if (Math.abs(f.colors[i] - r) < 1e-4 && Math.abs(f.colors[i + 1] - g) < 1e-4 && Math.abs(f.colors[i + 2] - b) < 1e-4) n++;
      return n;
    };
    const f = perchoirFacets(false);
    // Quatre pans, deux triangles chacun, et le dessus de la lanterne.
    expect(count(f, COLORS_5E.lantern)).toBeGreaterThanOrEqual(8);
    expect(PERCHOIR_LANTERN.dx).toBeGreaterThan(PERCHOIR_5E.half.x);
    expect(PERCHOIR_LANTERN.dz).toBeLessThan(-PERCHOIR_5E.half.z);
    expect(perchoirTriangles().withSente).toBeLessThanOrEqual(PERCHOIR_TRIANGLES_MAX);
    expect(PERCHOIR_TRIANGLES_MAX).toBe(175);
  });
});
