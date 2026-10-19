// Le monde ouvert du 5e (GD-22, lot 2, « toute l'île en grandes masses ») : ses quatorze lieux, ses quatre terres et leurs
// passages, ses deux étages faits par la seule hauteur du sol, ses chenaux sans gué, ses ruines, ses couleurs (jamais
// presque noires) et son budget. Sans Three.js.
import { describe, expect, it } from 'vitest';
import { LINK_PRICE, islandsOf } from '../archipelago';
import { OPEN_WORLD_BUDGET, mapCost5e, openWorldCost5e } from './budget';
import { bridgeFacets, bridgeFloor, bridgeSite, clampToOpen, isCabin } from './bridges';
import { distance, distanceToPolyline, linearRgb, type Vec2 } from './geometry';
import { bridgeEdge, landOf, landPrice, linkedLands, nodeLands } from './lands';
import { planFor } from './levelPlan';
import { cliffMapLine, riftMistFacets, riftMistSpots, RIFT_MIST } from './mist5e';
import { modelOfPlace } from './places';
import { NETWORK_5E, pathRibbons5e } from './paths5e';
import { COLORS_5E, DEPARTURE_5E, LINKS_5E, NEEDLES_5E, PATH_EDGES_5E, PLATEAU, UPPER_PLACES_5E } from './plan5e';
import { MONTEE_HEIGHT } from './ruins5e';
import { HORIZON_COLOR_5E, LIGHT_5E, SKY_OF, skyDome } from './sky';
import { SEA_TEXTURE, WATER_TONES_5E, seaPixels5e, waterTone5e } from './sea';
import { FOREST_COLORS, buildHeightField5e, channelClearance, groundFar5e, groundOn5e, heightAt5e, landDistance5e, onPlateau, plateauShare, tileFacets5e, tileFlora5e, tileGround5e } from './terrain5e';
import { veilFacets, veilShare } from './veil';

const PLAN = planFor('5e');
const LINKED = linkedLands(PLAN);
const node = (id: string): Vec2 => NETWORK_5E.pathNode(id).at;
const isPassage = (a: string, b: string) => Object.values(LINKS_5E).some(({ bridge: [u, v] }) => (u === a && v === b) || (u === b && v === a));

/** La luminance relative d'une couleur linéaire : au-dessus de tant, rien n'est presque noir. */
const luminance = ([r, g, b]: readonly number[]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
const NOT_BLACK = 0.03;

describe('Le plan du 5e', () => {
  it('quatorze lieux, un par île du 5e, chacun dans une terre et une seule', () => {
    expect(PLAN.places).toHaveLength(14);
    expect(new Set(PLAN.places.map((p) => p.island))).toEqual(new Set(islandsOf('5e').map((b) => b.id)));
    const all = PLAN.lands.flatMap((l) => l.places);
    expect(new Set(all)).toEqual(new Set(PLAN.places.map((p) => p.id)));
    expect(all).toHaveLength(14);
    expect(PLAN.lands.map((l) => l.name)).toEqual(['Les Frondaisons', 'Les Roselières', 'Les Contreforts', 'Les Aiguilles']);
  });

  it('la Lisière, le départ, au sud-est, dans les Frondaisons, près du Hameau', () => {
    expect(nodeLands(PLAN).get(DEPARTURE_5E.node)).toBe('frondaisons');
    expect(distance(node(DEPARTURE_5E.node), PLAN.places.find((p) => p.id === 'hameau')!.center)).toBeLessThan(80);
    expect(DEPARTURE_5E.at.x).toBeGreaterThan(0);
    expect(DEPARTURE_5E.at.z).toBeGreaterThan(0);
  });

  it('le prix d’une terre : celui d’une liaison du 5e par lieu (10, 15, 25)', () => {
    expect(PLAN.pricePerPlace).toBe(LINK_PRICE['5e']);
    expect(LINKED.map(landPrice)).toEqual([10, 15, 25]);
  });

  it('sans ses trois passages, le réseau fait exactement les quatre terres', () => {
    const lands = nodeLands(PLAN);
    expect(new Set(lands.values())).toEqual(new Set(PLAN.lands.map((l) => l.id)));
    for (const p of PLAN.places) expect(lands.get(p.door), p.id).toBe(landOf(p.id));
    const passages = new Set(LINKED.map((l) => bridgeEdge(PLAN, l)));
    PATH_EDGES_5E.forEach(([a, b], i) => {
      if (!passages.has(i)) expect(lands.get(a), `${a}–${b}`).toBe(lands.get(b));
    });
    // D'un seul tenant, passages compris : de la Lisière, on va partout.
    for (const p of PLAN.places) expect(NETWORK_5E.findRoute(NETWORK_5E.atNode('port-quai'), NETWORK_5E.atNode(p.door)).length, p.id).toBeGreaterThan(1);
  });
});

describe('Deux étages, par la seule hauteur du sol', () => {
  it('les lieux du haut sont sur le plateau, les autres en bas ; la Carte met un triangle à côté des seuls lieux du haut', () => {
    for (const p of PLAN.places) expect(onPlateau(p.center), p.id).toBe(UPPER_PLACES_5E.includes(p.id as never));
    expect(PLAN.upper).toEqual(UPPER_PLACES_5E);
    expect(PLAN.lands.find((l) => l.id === 'aiguilles')!.places.slice().sort()).toEqual([...UPPER_PLACES_5E].sort());
  });

  it('de vraies falaises : le plateau monte de toute sa hauteur sur quelques unités', () => {
    for (const x of [-150, -60, 60, 150]) {
      let steepest = 0;
      for (let z = -60; z < 40; z += 0.5) steepest = Math.max(steepest, heightAt5e({ x, z: z - 3 }) - heightAt5e({ x, z: z + 3 }));
      expect(steepest, `x = ${x}`).toBeGreaterThan(PLATEAU.height * 0.8);
    }
  });

  it('aucun sentier ne monte la falaise ni ne passe l’eau : seuls les deux ponts et la cabine', () => {
    for (const [a, b] of PATH_EDGES_5E) {
      if (isPassage(a, b)) continue;
      const p = node(a);
      const q = node(b);
      const n = Math.ceil(distance(p, q) / 0.5);
      const shares: number[] = [];
      for (let k = 0; k <= n; k++) {
        const at = { x: p.x + ((q.x - p.x) * k) / n, z: p.z + ((q.z - p.z) * k) / n };
        expect(landDistance5e(at), `${a}–${b}`).toBeGreaterThan(1);
        shares.push(plateauShare(at));
      }
      // Tout en haut, ou tout en bas.
      expect(Math.min(...shares) > 0.95 || Math.max(...shares) < 0.05, `${a}–${b}`).toBe(true);
    }
  });

  it('les chenaux : profonds au droit de chaque pont, sans gué, d’eau sombre jamais presque noire', () => {
    for (const land of LINKED.filter((l) => !isCabin(l))) {
      const s = bridgeSite(land);
      expect(channelClearance(s.mid), land).toBeLessThan(-3);
      expect(heightAt5e(s.mid), land).toBeLessThan(-1.5);
      expect(waterTone5e(s.mid), land).toBe(WATER_TONES_5E.night);
    }
    for (const c of Object.values(WATER_TONES_5E)) if (c > 0xff) expect(luminance(linearRgb(c))).toBeGreaterThan(NOT_BLACK);
  });

  it('les aiguilles se tiennent loin des chemins et des lieux ; la Montée, au centre, est la plus haute', () => {
    for (const n of NEEDLES_5E) {
      for (const [a, b] of PATH_EDGES_5E) expect(distanceToPolyline(n.at, [node(a), node(b)]), `${n.at.x}, ${n.at.z}`).toBeGreaterThan(n.radius + 2);
      for (const p of PLAN.places) expect(distance(n.at, p.center)).toBeGreaterThan(n.radius + 8);
    }
    const montee = PLAN.places.find((p) => p.id === 'montee')!;
    for (const n of NEEDLES_5E) expect(heightAt5e(n.at) + n.height).toBeLessThan(heightAt5e(montee.center) + MONTEE_HEIGHT - 5);
    expect(distance(montee.center, { x: 0, z: 0 })).toBeLessThan(5);
    expect(modelOfPlace('montee').top).toBeGreaterThan(Math.max(...PLAN.places.filter((p) => p.id !== 'montee').map((p) => modelOfPlace(p.id).top)) + 20);
  });
});

describe('Les passages : deux ponts et la cabine de la Montée', () => {
  it('fermé, Kéo s’arrête avant ; relié, il passe, et sur la cabine il monte du bas au plateau', () => {
    for (const land of LINKED) {
      const s = bridgeSite(land);
      const beyond = { edge: s.edge, t: s.nearEnd === 0 ? 0.99 : 0.01, at: s.mid };
      expect(clampToOpen(beyond, [land], PLAN), land).toEqual(s.stop);
      expect(clampToOpen(beyond, [], PLAN), land).toBe(beyond);
    }
    const cabin = bridgeSite('aiguilles');
    const along = (d: number) => ({ x: cabin.near.x + cabin.dir.x * d, z: cabin.near.z + cabin.dir.z * d });
    const low = along(cabin.abut[0] + 0.5);
    const high = along(cabin.abut[1] - 0.5);
    expect(bridgeFloor(low.x, low.z, ['aiguilles'], PLAN)).toBeNull();
    expect(bridgeFloor(high.x, high.z, [], PLAN)! - bridgeFloor(low.x, low.z, [], PLAN)!).toBeGreaterThan(PLATEAU.height * 0.8);
  });

  it('tombés et relevés, chacun se dessine ; sur la Carte, un trait pour chacun et la ligne de la falaise', () => {
    for (const land of LINKED) {
      expect(bridgeFacets(land, false).triangles, land).toBeGreaterThan(20);
      expect(bridgeFacets(land, true).triangles, land).toBeGreaterThan(bridgeFacets(land, false).triangles * 0.5);
    }
    expect(cliffMapLine().triangles).toBeGreaterThan(20);
  });
});

describe('La brume', () => {
  it('celle des terres fermées couvre leurs lieux, jamais ceux d’une autre terre ; celle des Aiguilles reste en haut', () => {
    for (const land of LINKED) {
      for (const p of PLAN.places) {
        const share = veilShare(land, p.center);
        if (landOf(p.id) === land) expect(share, `${land} ${p.id}`).toBeGreaterThan(0.5);
        else expect(share, `${land} ${p.id}`).toBe(0);
      }
    }
    expect(veilFacets(LINKED).triangles).toBeGreaterThan(0);
  });

  it('celle des failles : au pied de la falaise, jamais sur un chemin ni sur un lieu', () => {
    const spots = riftMistSpots();
    expect(spots.length).toBeGreaterThan(5);
    for (const s of spots) {
      expect(plateauShare(s)).toBeLessThan(0.3);
      for (const [a, b] of PATH_EDGES_5E) expect(distanceToPolyline(s, [node(a), node(b)])).toBeGreaterThan(RIFT_MIST.radius);
      for (const p of PLAN.places) expect(distance(s, p.center)).toBeGreaterThan(RIFT_MIST.radius + 2);
    }
    const m = riftMistFacets();
    for (let k = 3; k < m.colors.length; k += 4) expect(m.colors[k]).toBeLessThanOrEqual(RIFT_MIST.alpha);
  });
});

describe('Le sol, l’eau, le ciel', () => {
  it('une tuile en deux temps (son sol, puis ce qui y pousse) fait la tuile entière ; de loin, le sol suit la grille grossière', () => {
    const field = buildHeightField5e();
    for (const [tx, tz] of [[7, 5], [3, 6]] as const)
      for (const d of ['near', 'far'] as const) expect(tileGround5e(field, tx, tz, d).triangles + tileFlora5e(field, tx, tz, d).triangles).toBe(tileFacets5e(field, tx, tz, d).triangles);
    // Hors de la grille, le sol du plan.
    expect(groundFar5e(field, 1000, 1000)).toBe(heightAt5e({ x: 1000, z: 1000 }));
    expect(groundOn5e(field, 1000, 1000)).toBe(heightAt5e({ x: 1000, z: 1000 }));
  });

  it('l’image de l’eau du 5e a la taille de celle du 6e ; le ciel du 5e a ses couleurs à lui', () => {
    expect(seaPixels5e()).toHaveLength(SEA_TEXTURE.size * SEA_TEXTURE.size * 4);
    expect(skyDome(1, SKY_OF['5e']).colors).not.toEqual(skyDome(1, SKY_OF['6e']).colors);
    expect(skyDome(1, SKY_OF['6e']).colors).toEqual(skyDome(1).colors);
  });
});

describe('Les couleurs et la lumière', () => {
  it('jamais presque noires : le sol, la forêt, les aiguilles, les ruines', () => {
    for (const c of [...Object.values(COLORS_5E), ...Object.values(FOREST_COLORS), HORIZON_COLOR_5E]) expect(luminance(linearRgb(c)), c.toString(16)).toBeGreaterThan(NOT_BLACK);
    const field = buildHeightField5e();
    const check = (colors: Float32Array, what: string) => {
      for (let k = 0; k < colors.length; k += 3) expect(luminance([colors[k], colors[k + 1], colors[k + 2]]), what).toBeGreaterThan(NOT_BLACK);
    };
    for (const [tx, tz] of [[7, 5], [7, 2], [3, 6], [10, 7]] as const) check(tileFacets5e(field, tx, tz, 'near').colors, `tuile ${tx}, ${tz}`);
    for (const p of PLAN.places) check(modelOfPlace(p.id).facets.colors, p.id);
  });

  it('un soleil bas, de l’ouest, sur la fin de l’après-midi', () => {
    const { x, y, z } = LIGHT_5E.sunFrom;
    const elevation = (Math.atan2(y, Math.hypot(x, z)) * 180) / Math.PI;
    expect(elevation).toBeGreaterThan(8);
    expect(elevation).toBeLessThan(20);
    expect(x).toBeLessThan(0);
  });
});

describe('Le budget du 5e', () => {
  it('le monde et la Carte tiennent dans l’enveloppe du monde ouvert, avec de la place pour les lots suivants', () => {
    const cost = openWorldCost5e();
    const triangles = cost.reduce((s, c) => s + c.triangles, 0);
    const calls = cost.reduce((s, c) => s + c.calls, 0);
    expect(triangles).toBeLessThanOrEqual(OPEN_WORLD_BUDGET.triangles * 0.8);
    expect(calls).toBeLessThanOrEqual(OPEN_WORLD_BUDGET.calls - 5);
    const map = mapCost5e();
    expect(map.triangles).toBeLessThanOrEqual(OPEN_WORLD_BUDGET.triangles);
    expect(map.calls).toBeLessThanOrEqual(OPEN_WORLD_BUDGET.calls);
    // Les chemins se dessinent sur le sol du 5e.
    const field = buildHeightField5e();
    expect(pathRibbons5e((px, pz) => groundOn5e(field, px, pz)).triangles).toBeGreaterThan(1000);
  });
});
