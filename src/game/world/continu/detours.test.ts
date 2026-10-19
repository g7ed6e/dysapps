import { describe, expect, it } from 'vitest';
import { sanitizeState } from '../../engine/sanitize';
import { EMPTY_STATE } from '../../engine/state';
import { DETOUR_IDS as SAVED_IDS, sanitizeDetours } from '../../engine/detours';
import { DETOUR_CAIRNS, findDetour, lightDetour } from '../detoursSaved';
import { followPose, detourRise, detourViewStep } from './camera';
import { DETOURS, DETOUR_IDS, FAUNA, FAUNA_BLOW, FAUNA_END, SENTE, birdFacets, cairnSpot, detourAtPoint, detourFacets, faunaPose, keptClearForDetour } from './detours';
import { buildWalkGrid, cellOf, freeRoute, isWalkable } from './freeWalk';
import { distance, distanceToPolyline, linearRgb, type Vec2 } from './geometry';
import { routeLength } from './paths';
import { COLORS_6E, DETOUR_HILL, DETOUR_HILLS, LOOKOUT_RAMP, PATH_EDGES, PATH_NODES, PLACES } from './plan6e';
import { buildHeightField, detourFoot, detourReach, heightAt, landDistance, straitClearance } from './terrain';
import { planFor } from './levelPlan';

/** Le plan du 6e, le seul enregistré (GD-22). */
const PLAN = planFor('6e');
const LANDS = PLAN.lands;

const field = buildHeightField();
const grid = buildWalkGrid(field);
const nodes = new Map(PATH_NODES.map((n) => [n.id, n.at]));
const lines = PATH_EDGES.map(([a, b]) => [nodes.get(a)!, nodes.get(b)!]);
const pathDistance = (p: Vec2) => Math.min(...lines.map((l) => distanceToPolyline(p, l)));
const landAt = (p: Vec2) => LANDS[grid.land[cellOf(grid, p)]]?.id;

describe('les Détours', () => {
  it('sont cinq, un par terre, chacun avec son nom', () => {
    expect(DETOURS.map((d) => d.id)).toEqual([...DETOUR_IDS]);
    expect(new Set(DETOURS.map((d) => d.land)).size).toBe(LANDS.length);
    for (const d of DETOURS) {
      expect(landAt(d.at), d.id).toBe(d.land);
      expect(d.name.split(' ').length, d.id).toBeLessThanOrEqual(4);
      // Le mot « belvédère » est le nom d'une île du 3e : il ne s'affiche jamais.
      expect(d.name.toLowerCase(), d.id).not.toContain('belvédère');
    }
    expect(DETOURS.filter((d) => d.kind === 'cairn').map((d) => d.id)).toEqual(DETOUR_CAIRNS);
    // La sauvegarde garde les mêmes, dans le même ordre.
    expect(SAVED_IDS).toEqual(DETOUR_IDS);
    expect(DETOURS.filter((d) => d.kind === 'rive')).toHaveLength(1);
  });

  it("posent leurs collines loin des chemins, des lieux, de l'eau et des bras de mer", () => {
    for (const h of DETOUR_HILLS) {
      // Le bord du corps (l'hexagone du pied des falaises) et les deux côtés de la rampe.
      const edge: Vec2[] = [];
      const body = (DETOUR_HILL.plateau + h.height / DETOUR_HILL.cliff) / Math.cos(Math.PI / 6);
      for (let k = 0; k < 24; k++) edge.push({ x: h.at.x + body * Math.cos((Math.PI * k) / 12), z: h.at.z + body * Math.sin((Math.PI * k) / 12) });
      const foot = detourFoot(h);
      const ux = Math.cos(h.face);
      const uz = Math.sin(h.face);
      const length = distance(h.at, foot);
      for (let s = DETOUR_HILL.plateau; s <= length; s += 1)
        for (const o of [-DETOUR_HILL.halfWidth - 1, DETOUR_HILL.halfWidth + 1]) edge.push({ x: h.at.x + ux * s - uz * o, z: h.at.z + uz * s + ux * o });
      for (const p of edge) {
        expect(pathDistance(p), h.id).toBeGreaterThanOrEqual(3);
        expect(Math.min(...PLACES.map((pl) => distance(p, pl.center))), h.id).toBeGreaterThanOrEqual(15);
        expect(landDistance(p), h.id).toBeGreaterThanOrEqual(5);
        expect(straitClearance(p), h.id).toBeGreaterThanOrEqual(7);
        expect(distanceToPolyline(p, [LOOKOUT_RAMP.from, LOOKOUT_RAMP.to]) - LOOKOUT_RAMP.halfWidth, h.id).toBeGreaterThanOrEqual(3);
      }
      // Le plateau est en haut : sa hauteur, au-dessus du sol d'à côté.
      expect(heightAt(h.at) - heightAt({ x: foot.x + ux * 3, z: foot.z + uz * 3 }), h.id).toBeGreaterThan(h.height - 3);
    }
  });

  it('se montent par leur sente, et seulement par leur face douce', () => {
    for (const d of DETOURS) {
      // Toute la sente se marche (la végétation la laisse libre), et le trajet libre la suit presque.
      for (let i = 1; i < d.sente.length; i++) {
        const a = d.sente[i - 1];
        const b = d.sente[i];
        const n = Math.ceil(distance(a, b) / 0.4);
        for (let k = 0; k <= n; k++) {
          const p = { x: a.x + ((b.x - a.x) * k) / n, z: a.z + ((b.z - a.z) * k) / n };
          expect(isWalkable(grid, p, []), `${d.id} ${p.x.toFixed(1)} ${p.z.toFixed(1)}`).toBe(true);
        }
      }
      // Elle part d'un chemin.
      expect(pathDistance(d.sente[0]), d.id).toBeLessThan(0.2);
      const route = freeRoute(grid, d.sente[0], d.at, []);
      expect(route, d.id).not.toBeNull();
      expect(routeLength(route!), d.id).toBeLessThan(routeLength(d.sente) * 1.3 + 1);
      // Une terre fermée : on n'y monte pas.
      expect(freeRoute(grid, d.sente[0], d.at, [d.land].filter((l) => l !== 'pointe') as never[]) === null || d.land === 'pointe', d.id).toBe(true);
    }
    for (const h of DETOUR_HILLS) {
      // De derrière la colline, le trajet en fait le tour pour prendre la rampe : les falaises ne se montent pas.
      const back = { x: h.at.x - Math.cos(h.face) * 12, z: h.at.z - Math.sin(h.face) * 12 };
      const route = freeRoute(grid, back, h.at, []);
      expect(route, h.id).not.toBeNull();
      expect(routeLength(route!), h.id).toBeGreaterThan(30);
    }
  });

  it('se reconnaissent à leur place, plateau ou bord d’eau', () => {
    for (const d of DETOURS) {
      expect(detourAtPoint(d.at)?.id).toBe(d.id);
      expect(detourAtPoint(d.foot)?.id ?? null, d.id).toBe(d.kind === 'rive' ? d.id : null);
    }
    const shore = DETOURS.find((d) => d.kind === 'rive')!;
    expect(landDistance(shore.at)).toBeGreaterThan(1);
    expect(landDistance(shore.at)).toBeLessThan(7);
    const braise = DETOURS.find((d) => d.kind === 'cairn')!;
    // Le cairn est sur le plateau, à côté du centre où Kéo s'arrête.
    expect(distance(cairnSpot(braise), braise.at)).toBeLessThan(DETOUR_HILL.plateau);
    expect(distance(cairnSpot(braise), braise.at)).toBeGreaterThan(1);
  });

  it('laissent leurs collines et leurs sentes sans végétation', () => {
    for (const d of DETOURS) for (const p of d.sente) expect(keptClearForDetour(p), d.id).toBe(true);
    for (const h of DETOUR_HILLS) expect(keptClearForDetour({ x: h.at.x + detourReach(h) + 5, z: h.at.z })).toBe(false);
  });

  it('dessinent la sente en pointillé, lisible sur l’herbe (3:1 au moins)', () => {
    const lum = (c: number) => {
      const [r, g, b] = linearRgb(c);
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const ratio = (a: number, b: number) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
    expect(ratio(SENTE.color, COLORS_6E.grass)).toBeGreaterThanOrEqual(3);
    expect(ratio(SENTE.color, 0x72c98e)).toBeGreaterThanOrEqual(3);
    expect(SENTE.gap).toBeGreaterThan(0);
    // Plus étroite qu'un chemin (0,8 de demi-largeur).
    expect(SENTE.half).toBeLessThan(0.8);
  });

  it('ne tracent que les sentes trouvées, et allument le seul cairn', () => {
    const none = detourFacets([], false).triangles;
    const one = detourFacets(['butte-chantier'], false).triangles;
    const all = detourFacets(DETOUR_IDS, true).triangles;
    expect(one).toBeGreaterThan(none);
    expect(all).toBeGreaterThan(one);
    expect(all).toBeLessThan(2500);
  });

  it('se gardent dans la sauvegarde sans doublon ni inconnu, dans leur ordre', () => {
    expect(sanitizeDetours(['haut-cretes', 'x', 'butte-chantier', 'haut-cretes', 3])).toEqual(['butte-chantier', 'haut-cretes']);
    expect(sanitizeDetours(undefined)).toEqual([]);
    expect(sanitizeDetours('butte-chantier')).toEqual([]);
  });

  it('se trouvent une fois, et seul un cairn trouvé se rallume', () => {
    expect(lightDetour(EMPTY_STATE, 'braise-herons')).toBe(EMPTY_STATE);
    const a = findDetour(EMPTY_STATE, 'haut-cretes');
    const b = findDetour(a, 'braise-herons');
    expect(b.world.detours).toEqual(['braise-herons', 'haut-cretes']);
    expect(findDetour(b, 'haut-cretes')).toBe(b);
    expect(lightDetour(b, 'haut-cretes')).toBe(b);
    const c = lightDetour(b, 'braise-herons');
    expect(c.world.detoursLit).toEqual(['braise-herons']);
    expect(lightDetour(c, 'braise-herons')).toBe(c);
    // La sauvegarde les garde ; une partie d'avant les Détours n'a rien à perdre.
    const saved = sanitizeState(JSON.parse(JSON.stringify(c)));
    expect(saved.world.detours).toEqual(['braise-herons', 'haut-cretes']);
    expect(saved.world.detoursLit).toEqual(['braise-herons']);
    expect(sanitizeState(JSON.parse(JSON.stringify(EMPTY_STATE))).world.detours).toBeUndefined();
    // Un cairn rallumé sans son Détour trouvé ne se garde pas.
    const odd = sanitizeState({ ...EMPTY_STATE, world: { ...EMPTY_STATE.world, detoursLit: ['braise-herons'] } });
    expect(odd.world.detoursLit).toBeUndefined();
  });

  it('montent la vue en 1,2 s et la rendent en 0,8 s, sans la tourner ; d’un coup avec « Réduire les animations »', () => {
    let v = 0;
    for (let k = 0; k < 11; k++) v = detourViewStep(v, 1, 0.1, false);
    expect(v).toBeLessThan(1);
    v = detourViewStep(v, 1, 0.1, false);
    expect(v).toBe(1);
    for (let k = 0; k < 8; k++) v = detourViewStep(v, 0, 0.1, false);
    expect(v).toBeCloseTo(0, 6);
    expect(detourViewStep(0, 1, 0.01, true)).toBe(1);
    expect(detourViewStep(1, 0, 0.01, true)).toBe(0);
    expect(detourRise(0)).toBe(0);
    expect(detourRise(1)).toBe(1);
    // Plus haut, plus loin (×1,6 au plus), le même cap.
    const focus = { x: 0, y: 0, z: 0 };
    const low = followPose(focus, 0, undefined, 0.7, 0);
    const high = followPose(focus, 0, undefined, 0.7, 1);
    expect(high.position.y).toBeGreaterThan(low.position.y);
    const flat = (p: { position: { x: number; z: number } }) => Math.hypot(p.position.x, p.position.z);
    expect(flat(high) / flat(low)).toBeLessThanOrEqual(1.6 + 1e-9);
    expect(Math.atan2(high.position.x, high.position.z)).toBeCloseTo(Math.atan2(low.position.x, low.position.z), 9);
  });

  it('jouent la baleine et les oiseaux du bord d’eau toujours de même, loin de Kéo, et immobiles avec « Réduire les animations »', () => {
    const shore = DETOURS.find((d) => d.kind === 'rive')!;
    // Au repos : les oiseaux posés, ailes repliées, à `perchOff` de Kéo au moins ; pas de baleine.
    const rest = faunaPose(shore, null);
    expect(rest.whale).toBeNull();
    expect(rest.spout).toBeNull();
    for (const b of rest.birds) {
      expect(b.perched).toBe(true);
      expect(distance(b, shore.at)).toBeGreaterThanOrEqual(FAUNA.perchOff - 1e-9);
    }
    // La même scène au même instant.
    expect(faunaPose(shore, 2)).toEqual(faunaPose(shore, 2));
    // La baleine loin de Kéo, son souffle au début de son temps en surface, rien après la fin.
    for (let t = 0; t < FAUNA_END; t += 0.25) {
      const p = faunaPose(shore, t);
      if (p.whale) expect(distance(p.whale, shore.at)).toBeGreaterThan(12);
      for (const b of p.birds) expect(distance(b, shore.at), `${t}`).toBeGreaterThan(2.5);
    }
    expect(faunaPose(shore, FAUNA_BLOW + 0.3).spout).not.toBeNull();
    expect(faunaPose(shore, FAUNA_END + 0.1)).toEqual(rest);
    // « Réduire les animations » : le dos en surface, sans souffle, les oiseaux posés.
    const still = faunaPose(shore, FAUNA_BLOW + 0.3, true);
    expect(still.whale?.pitch).toBe(0);
    expect(still.spout).toBeNull();
    expect(still.birds).toEqual(rest.birds);
    // Posé ou en vol, le même nombre de sommets : la vue passe de l'un à l'autre sans changer son maillage.
    expect(birdFacets(true).positions.length).toBe(birdFacets().positions.length);
  });
});
