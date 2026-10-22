// Le monde ouvert du 3e (lot 1, « les Îles du Ciel en grandes masses », GD-25) : ses seize lieux, ses quatre terres et
// leurs trois passages, la montagne et ses trois Prairies sur la mer de nuages, le pic et ses arêtes, la langue de glace,
// le liseré d'ardoise, les deux petites arches toujours ouvertes, le Parvis et l'aéronef, le zeppelin, ses couleurs
// (jamais presque noires), la marche libre, et son budget. Sans Three.js.
import { describe, expect, it } from 'vitest';
import { LINK_PRICE, islandsOf } from '../archipelago';
import { OPEN_WORLD_BUDGETS, mapCost3e, openWorldCost3e } from './budget';
import { BRIDGE, bridgeFacets, bridgeFloor, bridgeSite } from './bridges';
import { distance, linearRgb, type Vec2 } from './geometry';
import { bridgeEdge, landOf, landPrice, linkedLands, nodeLands } from './lands';
import { levelWorld } from './levelWorld';
import { planFor } from './levelPlan';
import { modelOfPlace } from './places';
import { CUT_CLEARANCE_3E, NETWORK_3E, pathRibbons3e } from './paths3e';
import { NEF_3E, PARVIS_SITE, PARVIS_VIEW, nef3eFlight, parvisDecorFacets } from './parvis3e';
import { COLORS_3E, DEPARTURE_3E, LINKS_3E, PARVIS, PARVIS_PAD, PATH_EDGES_3E, PEAK_3E, SMALL_ARCHES_3E, TERRAIN_3E, ZEPPELIN_3E, parvisFloor } from './plan3e';
import { SKY_OF } from './sky';
import { SEA_TEXTURE_3E, WATER_TONES_3E, seaPixels3e } from './sea';
import { FLORA_3E_COLORS, buildHeightField3e, groundOn3e, heightAt3e, landDistance3e, mapOverlay3e, shoreRimFacets, smallArchFloor, walkBlocked3e } from './terrain3e';
import { buildWalkGrid } from './freeWalk';

const PLAN = planFor('3e');
const LINKED = linkedLands(PLAN);
const node = (id: string): Vec2 => NETWORK_3E.pathNode(id).at;
const isPassage = (a: string, b: string) => Object.values(LINKS_3E).some(({ bridge: [u, v] }) => (u === a && v === b) || (u === b && v === a));
const isSmallArch = (a: string, b: string) => SMALL_ARCHES_3E.some(([u, v]) => (u === a && v === b) || (u === b && v === a));

/** La luminance relative d'une couleur linéaire : au-dessus de tant, rien n'est presque noir. */
const luminance = ([r, g, b]: readonly number[]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
const NOT_BLACK = 0.03;

/** Le plafond du lot 1 du 3e (mesuré le 22 octobre 2026 : 58 136 triangles et 14 appels dans le monde, 57 206 et 15 au départ, 54 443 et 12 sur la Carte), avec sa marge. */
const LOT1_CEILING = { triangles: 62_000, calls: 16 } as const;

describe('Le plan du 3e', () => {
  it('seize lieux, chacun dans une terre et une seule ; quatre terres, le Cirque suggéré en dernier', () => {
    expect(PLAN.places.map((p) => p.id)).toEqual(['belvedere', 'grenier', 'abri', 'jardin', 'fanal', 'rampe', 'standard', 'kiosque', 'maquette', 'tribune', 'douane', 'ermitage', 'coupole', 'lutherie', 'ondes', 'palais']);
    const all = PLAN.lands.flatMap((l) => l.places);
    expect(new Set(all)).toEqual(new Set(PLAN.places.map((p) => p.id)));
    expect(all).toHaveLength(16);
    expect(PLAN.lands.map((l) => l.name)).toEqual(['Le Versant', 'Les Alpages', 'Les Prairies', 'Le Cirque']);
    expect(PLAN.lands.map((l) => l.bridgeName)).toEqual([null, 'Le pont du glacier', 'Les arches basses', 'La galerie du col']);
    expect(PLAN.lands.map((l) => l.places.length)).toEqual([4, 5, 4, 3]);
    expect(PLAN.firstPlace).toBe('belvedere');
    expect(PLAN.shutPort).toBe(true);
  });

  it('chaque île du 3e a son lieu ; le Grenier et la Lutherie, nouveaux, attendent la leur ; le port de la grille, les fonctions, est au Cirque', () => {
    const islands = new Set<string>(islandsOf('3e').map((b) => b.id));
    const fresh = PLAN.places.filter((p) => !islands.has(p.island)).map((p) => p.id);
    expect(fresh).toEqual(['grenier', 'lutherie']);
    expect(new Set(PLAN.places.map((p) => p.island).filter((i) => islands.has(i)))).toEqual(islands);
    expect(landOf(PLAN.places.find((p) => p.island === 'maths-3e-functions')!.id)).toBe('cirque');
  });

  it('le prix d’une terre : celui d’une liaison du 3e par lieu, la Douane et l’Ermitage en option ne comptent pas (15, 20, 15)', () => {
    expect(PLAN.pricePerPlace).toBe(LINK_PRICE['3e']);
    expect(PLAN.unpriced).toEqual(['douane', 'ermitage']);
    expect(LINKED).toEqual(['alpages', 'prairies', 'cirque']);
    expect(LINKED.map(landPrice)).toEqual([15, 20, 15]);
  });

  it('le Parvis, le départ, au sud-ouest, dans le Versant, posé au sol ; la caméra y regarde le nord-est', () => {
    expect(nodeLands(PLAN).get(DEPARTURE_3E.node)).toBe('versant');
    expect(DEPARTURE_3E.at.x).toBeLessThan(0);
    expect(DEPARTURE_3E.at.z).toBeGreaterThan(0);
    expect(parvisFloor(DEPARTURE_3E.at.x, DEPARTURE_3E.at.z)).not.toBeNull();
    // Sans pilotis : la pierre de la place est sur la terre, à moins d'une unité au-dessus du sol.
    for (const [lx, lz] of [[0, 10], [20, 20], [40, 28]] as const) {
      const p = PARVIS.toWorld(lx, lz);
      expect(landDistance3e(p), `${lx}, ${lz}`).toBeGreaterThan(0);
      expect(parvisFloor(p.x, p.z)! - heightAt3e(p), `${lx}, ${lz}`).toBeLessThan(1);
    }
    // Le cap de la caméra (−sin, −cos) va vers le nord-est.
    expect(-Math.sin(PARVIS_VIEW.yaw)).toBeGreaterThan(0);
    expect(-Math.cos(PARVIS_VIEW.yaw)).toBeLessThan(0);
  });

  it('sans ses trois passages, le réseau fait exactement les quatre terres ; avec eux, on va partout depuis le Parvis', () => {
    const lands = nodeLands(PLAN);
    expect(new Set(lands.values())).toEqual(new Set(PLAN.lands.map((l) => l.id)));
    for (const p of PLAN.places) expect(lands.get(p.door), p.id).toBe(landOf(p.id));
    const passages = new Set(LINKED.map((l) => bridgeEdge(PLAN, l)));
    PATH_EDGES_3E.forEach(([a, b], i) => {
      if (!passages.has(i)) expect(lands.get(a), `${a}–${b}`).toBe(lands.get(b));
    });
    for (const p of PLAN.places) expect(NETWORK_3E.findRoute(NETWORK_3E.atNode(DEPARTURE_3E.node), NETWORK_3E.atNode(p.door)).length, p.id).toBeGreaterThan(1);
  });
});

describe('Les coupures : la langue de glace, l’arête du col, les nuages', () => {
  it('aucun sentier ne passe une coupure ni les nuages : seuls les trois passages, et les deux petites arches sur leur chaussée', () => {
    for (const [a, b] of PATH_EDGES_3E) {
      if (isPassage(a, b)) continue;
      const p = node(a);
      const q = node(b);
      const n = Math.ceil(distance(p, q) / 0.5);
      for (let k = 0; k <= n; k++) {
        const at = { x: p.x + ((q.x - p.x) * k) / n, z: p.z + ((q.z - p.z) * k) / n };
        if (parvisFloor(at.x, at.z) !== null) continue;
        if (isSmallArch(a, b)) {
          expect(smallArchFloor(at.x, at.z) !== null || landDistance3e(at) > 1, `${a}–${b}`).toBe(true);
          continue;
        }
        expect(landDistance3e(at), `${a}–${b}`).toBeGreaterThan(1);
        for (const [cut, clear] of Object.entries(CUT_CLEARANCE_3E)) if (cut !== 'nuages') expect(clear(at), `${a}–${b} (${cut})`).toBeGreaterThan(1);
        expect(walkBlocked3e(at), `${a}–${b}`).toBe(false);
      }
    }
  });

  it('chaque passage franchit sa coupure ; le sol sous ses culées et dans la galerie reste sous son tablier', () => {
    for (const land of LINKED) {
      const s = bridgeSite(land);
      const cut = LINKS_3E[land as keyof typeof LINKS_3E].cut;
      expect(CUT_CLEARANCE_3E[cut](s.mid), land).toBeLessThan(-1);
      expect(s.water[1] - s.water[0], land).toBeGreaterThan(5);
      for (let d = s.abut[0]; d <= s.abut[1]; d += 0.5) expect(heightAt3e({ x: s.near.x + s.dir.x * d, z: s.near.z + s.dir.z * d }), `${land} ${d}`).toBeLessThan(BRIDGE.deck - 0.2);
    }
    // Les arches basses passent sur les nuages ; la langue de glace et le col sont à plat, au-dessus d'eux.
    expect(heightAt3e(bridgeSite('prairies').mid)).toBeLessThan(0);
    for (const land of ['alpages', 'cirque'] as const) expect(heightAt3e(bridgeSite(land).mid), land).toBeGreaterThan(0.8);
  });

  it('les arches basses : tombées, la chaussée de chaque rive seulement ; rebâties, Kéo marche sur leur dessus, d’une rive à l’autre', () => {
    const s = bridgeSite('prairies');
    const fallen = bridgeFacets('prairies', false);
    const mid = s.mid;
    for (let k = 0; k < fallen.positions.length; k += 3) expect(Math.hypot(fallen.positions[k] - mid.x, fallen.positions[k + 2] - mid.z)).toBeGreaterThan(3);
    for (let d = s.water[0] + BRIDGE.over + 0.1; d <= s.water[1] - BRIDGE.over - 0.1; d += 1) {
      const p = { x: s.near.x + s.dir.x * d, z: s.near.z + s.dir.z * d };
      expect(bridgeFloor(p.x, p.z, [], PLAN), `${d}`).toBe(BRIDGE.deck);
    }
  });

  it('les deux petites arches sont toujours ouvertes : leur chaussée se marche de bout en bout, au-dessus des nuages', () => {
    for (const [a, b] of SMALL_ARCHES_3E) {
      const p = node(a);
      const q = node(b);
      for (let t = 0; t <= 1; t += 0.05) {
        const at = { x: p.x + (q.x - p.x) * t, z: p.z + (q.z - p.z) * t };
        if (landDistance3e(at) < 0) expect(smallArchFloor(at.x, at.z), `${a}–${b} ${t}`).toBeGreaterThan(1.5);
      }
    }
  });

  it('les lieux sont sur la terre, hors du pic, des arêtes et de la langue de glace', () => {
    for (const p of PLAN.places) {
      expect(landDistance3e(p.center), p.id).toBeGreaterThan(3);
      expect(walkBlocked3e(p.center), p.id).toBe(false);
      expect(walkBlocked3e(node(p.door)), p.id).toBe(false);
    }
  });
});

describe('Le pic, les arêtes et la mer de nuages', () => {
  it('le pic ne se marche pas, ni les arêtes ; ils sont hachurés sur la Carte', () => {
    expect(walkBlocked3e(PEAK_3E.at)).toBe(true);
    const grid = buildWalkGrid(buildHeightField3e(), PLAN);
    const cellOf = (p: Vec2) => grid.kind[Math.floor((p.z - grid.minZ) / grid.cell) * grid.nx + Math.floor((p.x - grid.minX) / grid.cell)];
    expect(cellOf({ x: PEAK_3E.at.x + 20, z: PEAK_3E.at.z })).toBe(0);
    expect(mapOverlay3e().triangles).toBeGreaterThan(40);
  });

  it('les rives s’enfoncent sous les nuages, sans dessous d’île ; un liseré d’ardoise continu les borde toutes', () => {
    // À cinq unités au large de chaque rive, le sol est sous le plan des nuages.
    const field = buildHeightField3e();
    for (const p of PLAN.places) expect(groundOn3e(field, p.center.x, p.center.z), p.id).toBeGreaterThan(0.5);
    for (let x = TERRAIN_3E.minX + 4; x < -TERRAIN_3E.minX; x += 7)
      for (let z = TERRAIN_3E.minZ + 4; z < -TERRAIN_3E.minZ; z += 7) {
        const p = { x, z };
        if (landDistance3e(p) < -5) expect(heightAt3e(p), `${x}, ${z}`).toBeLessThan(-0.5);
      }
    const rim = shoreRimFacets();
    expect(rim.triangles).toBeGreaterThan(400);
    expect([...new Set(Array.from({ length: rim.colors.length / 3 }, (_, k) => rim.colors.slice(k * 3, k * 3 + 3).join()))].length).toBe(2);
  });

  it('le zeppelin est amarré sur un rocher à part, dans les nuages, au nord-est de la grande Prairie ; immobile (dans le décor fixe)', () => {
    expect(landDistance3e(ZEPPELIN_3E.rock)).toBeLessThan(-10);
    expect(ZEPPELIN_3E.rock.x).toBeGreaterThan(0);
    expect(ZEPPELIN_3E.rock.z).toBeLessThan(0);
    expect(parvisDecorFacets().triangles).toBeLessThan(600);
  });

  it('la mer de nuages : son image couvre toutes les terres', () => {
    expect(seaPixels3e().length).toBe(SEA_TEXTURE_3E.size * SEA_TEXTURE_3E.size * 4);
    expect(SEA_TEXTURE_3E.half).toBeGreaterThan(-TERRAIN_3E.minX);
    expect(levelWorld('3e').seaTexture).toBe(SEA_TEXTURE_3E);
  });
});

describe('L’aéronef au repos au Parvis', () => {
  it('l’aire est au milieu de la place, sur la terre ; l’aéronef est la troisième forme, et son départ monte', () => {
    const pad = PARVIS_SITE.frame.toWorld(PARVIS_PAD.center.x, PARVIS_PAD.center.z);
    expect(landDistance3e(pad)).toBeGreaterThan(2);
    expect(parvisFloor(pad.x, pad.z)).not.toBeNull();
    expect(NEF_3E.form).toBe(3);
    expect(distance(NEF_3E.berth, pad)).toBeLessThan(0.01);
    const out = { x: 0, y: 0, z: 0, yaw: 0, shiftX: 0, shiftZ: 0, open: 0 };
    const start = nef3eFlight(0, { ...out }).y;
    expect(nef3eFlight(1, out).y).toBeGreaterThan(start + 50);
  });
});

describe('Les couleurs froides du 3e', () => {
  it('rien de presque noir : le sol, les nuages, le ciel, les ruines, les chemins, le Parvis et son décor', () => {
    const colors = [...Object.values(COLORS_3E), ...Object.values(FLORA_3E_COLORS), ...Object.values(WATER_TONES_3E).filter((c) => c > 0xff), ...SKY_OF['3e'].map((s) => s.color)];
    for (const c of colors) expect(luminance(linearRgb(c)), c.toString(16)).toBeGreaterThan(NOT_BLACK);
    const field = buildHeightField3e();
    const meshes = [pathRibbons3e((x, z) => groundOn3e(field, x, z)), parvisDecorFacets(), ...PLAN.places.map((p) => modelOfPlace(p.id).facets), ...LINKED.flatMap((l) => [bridgeFacets(l, false), bridgeFacets(l, true)])];
    for (const f of meshes)
      for (let k = 0; k < f.colors.length; k += 3) expect(luminance([f.colors[k], f.colors[k + 1], f.colors[k + 2]])).toBeGreaterThan(NOT_BLACK);
  });
});

describe('Le budget du 3e', () => {
  it('le monde, le départ et la Carte tiennent dans l’enveloppe du 3e, et sous le plafond du lot 1', () => {
    const total = (list: { triangles: number; calls: number }[]) => list.reduce((s, p) => ({ triangles: s.triangles + p.triangles, calls: s.calls + p.calls }), { triangles: 0, calls: 0 });
    const env = OPEN_WORLD_BUDGETS['3e'];
    expect(env).toEqual({ triangles: 118_000, calls: 22 });
    for (const cost of [total(openWorldCost3e('monde')), total(openWorldCost3e('depart')), mapCost3e()]) {
      expect(cost.triangles).toBeLessThanOrEqual(LOT1_CEILING.triangles);
      expect(cost.calls).toBeLessThanOrEqual(LOT1_CEILING.calls);
    }
  });
});
