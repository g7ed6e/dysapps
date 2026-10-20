// La Faille (GD-22, lot 11) : le troisième Détour du 5e, une fente dans l'ocre des Contreforts, son arbre de roche et son
// pont de racines qu'on ne traverse pas. Sa place, sa sente marchable et lisible, la caméra à l'arrivée, le toucher sur
// l'autre lèvre, son coût. Sans Three.js.
import { describe, expect, it } from 'vitest';
import { DETOURS, DETOURS_5E, detourAtPoint, detourById, detourCap, detourViewOf } from './detours';
import { followPose } from './camera';
import { standingHeight } from './terrain';
import { FAILLE, FAILLE_LANTERN, FAILLE_STEAM, FAILLE_TREE, failleFacets, failleLantern, failleTapTarget, failleTriangles } from './faille5e';
import { buildWalkGrid, cellOf, freeRoute, isWalkable } from './freeWalk';
import { distance, distanceToPolyline, linearRgb } from './geometry';
import { planFor } from './levelPlan';
import { routeLength } from './paths';
import { COLORS_5E, FAILLE_5E, PATH_EDGES_5E, PATH_NODES_5E } from './plan5e';
import { SENTE_FAILLE } from './faille5e';
import { SENTE_GRASS, buildHeightField5e, channelClearance, heightAt5e, landDistance5e } from './terrain5e';

const PLAN = planFor('5e');
const nodes = new Map(PATH_NODES_5E.map((n) => [n.id, n.at]));
const pathDistance = (p: { x: number; z: number }) => Math.min(...PATH_EDGES_5E.map(([a, b]) => distanceToPolyline(p, [nodes.get(a)!, nodes.get(b)!])));

const lum = (c: number) => {
  const [r, g, b] = linearRgb(c);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: number, b: number) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);

describe('La Faille, troisième Détour du 5e', () => {
  it('suit le Creux et la Hutte dans la liste, aux Contreforts, avec son nom ; elle se reconnaît à la tête du pont, au 5e seulement', () => {
    expect(DETOURS_5E[2]).toBe(FAILLE);
    expect(detourById('faille')).toBe(FAILLE);
    expect(FAILLE.land).toBe('contreforts');
    expect(FAILLE.name).toBe('La Faille');
    expect(detourAtPoint(FAILLE_5E.head, '5e')?.id).toBe('faille');
    expect(detourAtPoint(FAILLE_5E.head)).toBeNull();
    expect(detourAtPoint(FAILLE_5E.start, '5e')).toBeNull();
  });

  it('se tient à l’écart : loin des chemins, des lieux et de l’eau', () => {
    expect(pathDistance(FAILLE_5E.center)).toBeGreaterThan(8);
    for (const p of PLAN.places) expect(distance(FAILLE_5E.center, p.center), p.id).toBeGreaterThan(20);
    expect(landDistance5e(FAILLE_5E.center)).toBeGreaterThan(6);
    expect(channelClearance(FAILLE_5E.center)).toBeGreaterThan(6);
  });

  it('sa sente part du chemin et se marche jusqu’à la tête du pont, aux Contreforts', () => {
    const grid = buildWalkGrid(buildHeightField5e(), PLAN);
    const [a, b] = FAILLE_5E.sente;
    expect(pathDistance(a)).toBeLessThan(0.2);
    const n = Math.ceil(distance(a, b) / 0.5);
    for (let k = 0; k <= n; k++) {
      const p = { x: a.x + ((b.x - a.x) * k) / n, z: a.z + ((b.z - a.z) * k) / n };
      expect(isWalkable(grid, p, []), `${p.x.toFixed(1)} ${p.z.toFixed(1)}`).toBe(true);
    }
    const route = freeRoute(grid, a, b, []);
    expect(route).not.toBeNull();
    expect(routeLength(route!)).toBeLessThan(distance(a, b) * 1.3 + 1);
    expect(grid.lands[grid.land[cellOf(grid, b)]]).toBe('contreforts');
    // Le pont et la fente ne se marchent pas : ils restent un décor.
    expect(isWalkable(grid, FAILLE_5E.center, [])).toBe(false);
    expect(isWalkable(grid, FAILLE_5E.tree, [])).toBe(false);
  });

  it('dessine sa sente en pointillé sur une bande d’herbe rase, lisible (3:1 au moins), une fois trouvée seulement', () => {
    expect(SENTE_GRASS).toBeGreaterThan(SENTE_FAILLE.half);
    expect(contrast(SENTE_FAILLE.color, COLORS_5E.mossSun)).toBeGreaterThanOrEqual(3);
    expect(failleFacets(true).triangles).toBeGreaterThan(failleFacets(false).triangles);
  });

  it('à l’arrivée, la caméra se tient derrière Kéo, à moins de 20° de plongée, du côté opposé à l’arbre, tournée vers le pont', () => {
    const cap = detourCap(FAILLE)!;
    const look = { x: -Math.sin(cap), z: -Math.cos(cap) };
    const toArch = { x: FAILLE_5E.arch.x - FAILLE_5E.head.x, z: FAILLE_5E.arch.z - FAILLE_5E.head.z };
    const l = Math.hypot(toArch.x, toArch.z);
    // Tournée vers le pont, de biais : la paroi d'en face se voit de profil.
    const cos = (look.x * toArch.x + look.z * toArch.z) / l;
    expect(cos).toBeGreaterThan(0.6);
    expect(cos).toBeLessThan(0.95);
    for (const d of DETOURS) expect(detourCap(d), d.id).toBeNull();
    const h = FAILLE_5E.head;
    const y = standingHeight(heightAt5e(h));
    const pose = followPose({ x: h.x, y, z: h.z }, 0, undefined, cap, 1, undefined, detourViewOf(FAILLE));
    const P = pose.position;
    const f = { x: pose.target.x - P.x, y: pose.target.y - P.y, z: pose.target.z - P.z };
    const pitch = (Math.asin(-f.y / Math.hypot(f.x, f.y, f.z)) * 180) / Math.PI;
    expect(pitch).toBeGreaterThan(5);
    expect(pitch).toBeLessThanOrEqual(20);
    // Du côté opposé à l'arbre : plus loin de l'arbre que de Kéo, au sud de lui.
    expect(P.z).toBeGreaterThan(h.z);
    expect(distance(P, FAILLE_5E.tree)).toBeGreaterThan(distance(P, h) + 2);
    // La couronne ne passe jamais entre la caméra et la tête du pont (Kéo et le pied des racines) : sous elle, la ligne
    // de vue est plus basse que son dessous, ou loin d'elle.
    const crownBottom = standingHeight(heightAt5e(FAILLE_5E.tree)) + FAILLE_TREE.crown;
    const reach = FAILLE_TREE.half + 0.4;
    for (const target of [{ ...h, y: y + 2.4 }, { ...FAILLE_5E.arch, y: y + 1.8 }, { ...failleLantern() }]) {
      for (let k = 0; k <= 40; k++) {
        const t = k / 40;
        const q = { x: P.x + (target.x - P.x) * t, y: P.y + (target.y - P.y) * t, z: P.z + (target.z - P.z) * t };
        const inside = Math.abs(q.x - FAILLE_5E.tree.x) <= reach && Math.abs(q.z - FAILLE_5E.tree.z) <= reach && q.y >= crownBottom;
        expect(inside).toBe(false);
      }
    }
    // La lanterne ne se cache pas derrière Kéo : de la caméra, elle est à plus de quatre degrés de lui sur le côté.
    const side = (q: { x: number; z: number }) => Math.atan2((q.x - P.x) * f.z - (q.z - P.z) * f.x, (q.x - P.x) * f.x + (q.z - P.z) * f.z);
    expect((Math.abs(side(failleLantern()) - side(h)) * 180) / Math.PI).toBeGreaterThan(4);
  });

  it('un toucher sur le pont ou l’autre lèvre mène à la tête du pont, sans phrase ; ailleurs, rien', () => {
    expect(failleTapTarget(FAILLE_5E.center)).toEqual(FAILLE_5E.head);
    expect(failleTapTarget({ x: FAILLE_5E.center.x - FAILLE_5E.half.u - 0.6, z: FAILLE_5E.center.z })).toEqual(FAILLE_5E.head);
    // Le dos de la paroi, à 45° jusqu'au sol, aussi.
    expect(failleTapTarget({ x: FAILLE_5E.center.x - FAILLE_5E.half.u - 3, z: FAILLE_5E.center.z })).toEqual(FAILLE_5E.head);
    expect(failleTapTarget(FAILLE_5E.start)).toBeNull();
  });

  it('sa lanterne à quatre pans brille dès le départ, pendue sous la racine du sud ; la vapeur monte jusqu’au blanc de la brume ; 175 triangles au plus, sente comprise', () => {
    const count = (f: ReturnType<typeof failleFacets>, color: number) => {
      const [r, g, b] = linearRgb(color);
      let n = 0;
      for (let i = 0; i < f.colors.length; i += 9) if (Math.abs(f.colors[i] - r) < 1e-4 && Math.abs(f.colors[i + 1] - g) < 1e-4 && Math.abs(f.colors[i + 2] - b) < 1e-4) n++;
      return n;
    };
    const f = failleFacets(false);
    // Quatre pans, deux triangles chacun.
    expect(count(f, COLORS_5E.lantern)).toBe(8);
    expect(FAILLE_LANTERN.r).toBe(0.3);
    const lamp = failleLantern();
    // Au sud du haut de l'arc (côté caméra), sous les racines.
    expect(lamp.z).toBeGreaterThan(FAILLE_5E.arch.z);
    expect(lamp.y).toBeLessThan(standingHeight(heightAt5e(FAILLE_5E.arch)) + 1.5);
    expect(count(f, FAILLE_STEAM.mist)).toBeGreaterThan(0);
    // Le panache monte au-dessus de la crête (vers 4) : le haut de ses bouffées blanches.
    const [mr, mg, mb] = linearRgb(FAILLE_STEAM.mist);
    let top = -Infinity;
    for (let i = 0; i < f.colors.length; i += 3) if (Math.abs(f.colors[i] - mr) < 1e-4 && Math.abs(f.colors[i + 1] - mg) < 1e-4 && Math.abs(f.colors[i + 2] - mb) < 1e-4) top = Math.max(top, f.positions[i + 1]);
    expect(top - standingHeight(heightAt5e(FAILLE_5E.center))).toBeGreaterThan(3.8);
    expect(failleTriangles().withSente).toBeLessThanOrEqual(175);
  });
});
