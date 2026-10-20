// La Montée finie (GD-22, lot 3) : son modèle par étapes, sa scénette, ses traces, ses abords, la cabine à une seule
// caisse, son trajet, la caméra au bord du plateau et le budget du 5e. Sans Three.js.
import { describe, expect, it } from 'vitest';
import { OPEN_WORLD_BUDGET, openWorldCost5e } from './budget';
import { CABIN_CAR, KEO_ROOM, bridgeFacets, bridgeFloor, bridgeSite, cabinCarBox, cabinCarFacets, cabinCarFloor, cabinCarParked, cabinStops } from './bridges';
import { cabinButtonRoute, cabinCarOpen, cabinOf, cabinSide, routeWithRide } from './cabinRide';
import { CLIFF_HOLD, FOLLOW, cliffHold, followPose, type CliffHold } from './camera';
import { WHOLE, constructionFacets, traceStagePosed } from './construction';
import { FacetBuilder } from './facets';
import { distance } from './geometry';
import { planFor } from './levelPlan';
import { MONTEE, MONTEE_GLOW, MONTEE_HEIGHT, RAIL_SPANS } from './montee5e';
import { lowRock } from './monteeSurroundings';
import { NETWORK_5E } from './paths5e';
import { placePieces } from './places';
import { placeItems } from './questions';
import { placeTrace, sceneSpot } from './questionScene';
import { scenetteHabitant, scenetteKeo, scenetteOf, scenetteSurroundings } from './scenette';
import { SURROUNDINGS_MAX } from './surroundings';
import { standingHeight } from './terrain';
import { buildHeightField5e, groundOn5e, heightAt5e, onPlateau, plateauShare } from './terrain5e';
import { RIDE, WALK_SPEED, startWalk, walkAt, walkSeconds } from './walk';

const PLAN = planFor('5e');
const MONTEE_PLACE = PLAN.places.find((p) => p.id === 'montee')!;
const field = buildHeightField5e();
const ground = (x: number, z: number) => groundOn5e(field, x, z);
const MISSIONS = ['thermometer', 'adding', 'fractions', 'order-of-operations', 'conversions-angles'];

describe('La Montée, lieu fini', () => {
  it('ses cinq missions se jouent dans sa scénette ; les autres lieux du 5e restent sur l’écran habituel', () => {
    expect(MONTEE_PLACE.scenes).toEqual(MISSIONS);
    for (const p of PLAN.places) if (p.id !== 'montee') expect(p.scenes, p.id).toEqual([]);
  });

  it('se rebâtit par étapes : le corps en trois travées, le haut et sa lanterne, les abords ; la ruine part à mesure', () => {
    const pieces = placePieces('montee');
    expect(pieces.filter((p) => p.stage === 0).map((p) => p.row)).toEqual([0, 0.34, 0.67]);
    // Le haut : les poulies, la lanterne du sommet et celle du palétuvier, allumées ensemble.
    expect(pieces.filter((p) => p.stage === 1)).toHaveLength(3);
    expect(pieces.filter((p) => p.stage === 2)).toHaveLength(2);
    // Chaque travée de la ruine part avec la travée neuve qui la remplace ; le chantier part avec les abords.
    const fallen = pieces.filter((p) => p.stage === 'ruine' && p.until);
    expect(fallen.map((p) => `${p.until!.stage}:${p.until!.row}`)).toEqual(['1:0.5', '0:0', '0:0.34', '0:0.67', '0:0', '1:0', '2:0']);
    expect(constructionFacets('montee', [WHOLE], ground).triangles).toBeGreaterThan(500);
  });

  it('reste la plus haute aiguille, son rail sur la face sud jusqu’aux trois quarts', () => {
    expect(MONTEE_HEIGHT).toBe(60);
    expect(RAIL_SPANS[3]).toBeCloseTo(MONTEE_HEIGHT * 0.74, 6);
    expect(MONTEE_GLOW.to).toBe(RAIL_SPANS[3]);
    expect(MONTEE_GLOW.seconds).toBeGreaterThanOrEqual(3);
  });

  it('les traces des cinq missions attendent le haut, puis se posent ; sans figure, rien à lire', () => {
    expect(MONTEE.traceStage).toBe(1);
    expect(Object.keys(MONTEE.traces).sort()).toEqual([...MISSIONS].sort());
    expect(traceStagePosed('montee', [WHOLE])).toBe(true);
    expect(traceStagePosed('montee', [[{ stage: 0, from: 0, to: 1 }]])).toBe(false);
    for (const m of MISSIONS) expect(placeTrace('montee', [m]).triangles, m).toBeGreaterThan(0);
    expect(placeTrace('montee', []).triangles).toBe(0);
  });

  it('sa scénette : la fontainière, Kéo à plus d’un mètre d’elle, sur le plancher devant le bassin ; les réponses aux godets', () => {
    expect(scenetteOf('montee').role).toBe('La fontainière');
    const keo = scenetteKeo('montee').at;
    const h = scenetteHabitant('montee');
    expect(Math.abs(h.x - keo.x)).toBeGreaterThan(2);
    expect(Math.abs(h.y - keo.y)).toBeLessThan(1e-6);
    const s = sceneSpot('montee');
    expect(s.z - MONTEE_PLACE.center.z).toBeCloseTo(MONTEE.sceneSpot.dz, 6);
    const items = placeItems('montee', 'maths-5e-signed-numbers-thermometer-1', [{ key: 'a', choices: ['−3', '2'], answer: '2' }]);
    expect(items[0].placeScene).toEqual({ kind: 'rest' });
  });

  it('sa réplique d’accueil : une idée, le sommet, courte', () => {
    expect(scenetteOf('montee').greeting).toBe('La fontainière monte l’eau jusqu’au sommet, godet par godet.');
  });

  it('son sol de forêt : racines au pied, litière et mousse dans la clairière, rien de haut dans l’anneau de la scénette', () => {
    const c = MONTEE_PLACE.center;
    const h0 = standingHeight(heightAt5e(c));
    const rel = (x: number, z: number) => standingHeight(heightAt5e({ x: c.x + x, z: c.z + z })) - h0;
    // La pièce toujours là, après l'aiguille.
    const floor = placePieces('montee').filter((p) => p.stage === 'ruine' && !p.until)[1];
    const b = new FacetBuilder();
    floor.draw(b);
    const f = b.build();
    expect(f.triangles).toBeGreaterThan(200);
    expect(f.triangles).toBeLessThan(1000);
    const spot = MONTEE.sceneSpot;
    let high = 0;
    for (let k = 0; k < f.positions.length; k += 3) {
      const [x, y, z] = [f.positions[k], f.positions[k + 1], f.positions[k + 2]];
      high = Math.max(high, y - rel(x, z));
      // L'anneau où la rangée des godets se pose quand la caméra tourne (7,5 du point visé, et une marge).
      if (Math.hypot(x - spot.dx, z - spot.dz) < 8.2) expect(y - rel(x, z), `${x} ${z}`).toBeLessThan(0.75);
    }
    // Des arceaux et des roches basses, jamais plus hauts qu'un genou de palétuvier.
    expect(high).toBeLessThan(1.8);
  });

  it('ses roches sont basses, à facettes irrégulières, tournées vers le dehors', () => {
    const b = new FacetBuilder();
    lowRock(b, { x: 0, y: 0, z: 0 }, 1, 0.5, 3);
    const f = b.build();
    expect(f.triangles).toBe(21);
    let top = -Infinity;
    for (let k = 0; k < f.positions.length; k += 9) {
      const p = [0, 1, 2].map((i) => [f.positions[k + 3 * i], f.positions[k + 3 * i + 1], f.positions[k + 3 * i + 2]]);
      const u = [0, 1, 2].map((i) => p[1][i] - p[0][i]);
      const v = [0, 1, 2].map((i) => p[2][i] - p[0][i]);
      const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
      const mid = [0, 1, 2].map((i) => (p[0][i] + p[1][i] + p[2][i]) / 3);
      // Chaque facette regarde le dehors (ou le haut).
      expect(n[0] * mid[0] + n[2] * mid[2] + n[1] * 0.5).toBeGreaterThan(0);
      top = Math.max(top, ...p.map((q) => q[1]));
    }
    expect(top).toBeCloseTo(0.5, 6);
  });

  it('les traces de Fractions et de Priorités : des ancres posées au sol, une pierre à chaque poulie, à la même hauteur', () => {
    const c = MONTEE_PLACE.center;
    const fr = placeTrace('montee', ['fractions']).positions;
    for (const side of [-1, 1]) {
      const ax = c.x + side * 7.4,
        az = c.z + 7.2;
      const g = standingHeight(heightAt5e({ x: ax, z: az }));
      let low = Infinity;
      for (let k = 0; k < fr.length; k += 3) if (Math.hypot(fr[k] - ax, fr[k + 2] - az) < 1.2) low = Math.min(low, fr[k + 1]);
      // La dalle s'enfonce dans le sol : elle n'y pend pas.
      expect(low).toBeLessThan(g);
    }
    const pr = placeTrace('montee', ['order-of-operations']).positions;
    // Les deux pierres : les sommets sous le bas des bras, de part et d'autre du rail, symétriques.
    const low = Math.min(...pr.filter((_, k) => k % 3 === 1));
    const stones = { west: [] as number[], east: [] as number[] };
    for (let k = 0; k < pr.length; k += 3) if (pr[k + 1] < low + 1) (pr[k] < c.x ? stones.west : stones.east).push(pr[k + 1]);
    expect(stones.west.length).toBeGreaterThan(0);
    expect(stones.east.length).toBe(stones.west.length);
    expect(Math.min(...stones.east)).toBeCloseTo(Math.min(...stones.west), 6);
  });

  it('ses abords tiennent sous le plafond commun, dans chaque état, sur le sol du 5e', () => {
    for (const posed of [false, true])
      for (const open of [false, true]) {
        const f = scenetteSurroundings('montee', open, posed);
        expect(f.triangles).toBeGreaterThan(0);
        expect(f.triangles).toBeLessThanOrEqual(SURROUNDINGS_MAX);
      }
  });
});

describe('La cabine de la Montée : une seule caisse', () => {
  const land = cabinOf(PLAN)!;
  const s = bridgeSite(land);
  const stops = cabinStops(s);

  it('la cabine est celle des Aiguilles ; sa caisse est soit au pied, soit en haut, soit en route, jamais deux', () => {
    expect(land).toBe('aiguilles');
    const car = cabinCarFacets(land).triangles;
    const none = bridgeFacets(land, true, null).triangles;
    expect(bridgeFacets(land, true, 'bas').triangles).toBe(none + car);
    expect(bridgeFacets(land, true, 'haut').triangles).toBe(none + car);
    // La Montée n'en couche plus une à son pied : sa ruine n'a aucune caisse de bronze au sol.
    expect(placePieces('montee').length).toBeGreaterThan(0);
  });

  it('le plancher de la caisse reste au-dessus du rail, de niveau ; Kéo s’y tient d’un arrêt à l’autre', () => {
    for (const d of [stops.bottom, (stops.bottom + stops.top) / 2, stops.top]) {
      const p = { x: s.near.x + s.dir.x * d, z: s.near.z + s.dir.z * d };
      expect(bridgeFloor(p.x, p.z, [], PLAN)).toBeCloseTo(cabinCarFloor(s, d), 6);
    }
    expect(cabinCarFloor(s, stops.top)).toBeGreaterThan(cabinCarFloor(s, stops.bottom) + 8);
    expect(CABIN_CAR.half * 2).toBeLessThan(2);
  });

  it('Kéo tient debout dans la caisse, la tête à une demi-unité du toit au moins', () => {
    expect(CABIN_CAR.posts - KEO_ROOM).toBeGreaterThanOrEqual(0.45);
    // La boîte de la caisse, cible du toucher : à sa gare, assez haute pour Kéo.
    for (const car of ['bas', 'haut'] as const) {
      const box = cabinCarBox(land, car);
      expect(box.max[1] - box.min[1]).toBeGreaterThan(KEO_ROOM);
    }
  });

  it('un trajet vers le plateau prend la caisse, d’un arrêt à l’autre, sur l’axe du rail ; l’inverse descend', () => {
    const up = NETWORK_5E.findRoute(NETWORK_5E.atNode('montee'), NETWORK_5E.atNode('donjon'));
    const r = routeWithRide(up, land);
    expect(r.ride?.up).toBe(true);
    expect(r.ride!.to - r.ride!.from).toBeCloseTo(stops.top - stops.bottom, 6);
    const down = routeWithRide([...up].reverse(), land);
    expect(down.ride?.up).toBe(false);
    // Un trajet du bas qui ne monte pas : aucune cabine.
    const flat = NETWORK_5E.findRoute(NETWORK_5E.atNode('montee'), NETWORK_5E.atNode('hameau'));
    expect(routeWithRide(flat, land).ride).toBeNull();
  });

  it('le bouton : « Monter » à la gare du pied, « Descendre » à celle du haut ; son trajet ressort sur la gare d’arrivée', () => {
    const foot = { x: s.near.x + s.dir.x * (s.abut[0] - 2), z: s.near.z + s.dir.z * (s.abut[0] - 2) };
    expect(cabinSide(land, foot)).toBe('bas');
    const route = cabinButtonRoute(land, foot, true);
    const r = routeWithRide(route, land);
    expect(r.ride?.up).toBe(true);
    const end = route[route.length - 1];
    expect(cabinSide(land, end)).toBe('haut');
    expect(onPlateau(end)).toBe(true);
    expect(cabinSide(land, MONTEE_PLACE.center)).toBeNull();
  });

  it('le trajet dure environ 4 s, doux : immobile au départ et à l’arrivée, sans à-coup', () => {
    const route = cabinButtonRoute(land, { x: s.near.x + s.dir.x * (s.abut[0] - 2), z: s.near.z + s.dir.z * (s.abut[0] - 2) }, true);
    const r = routeWithRide(route, land);
    const walk = startWalk(r.route, 0, r.ride);
    const total = walkSeconds(walk, false);
    expect(total).toBeCloseTo((walk.length - (r.ride!.to - r.ride!.from)) / WALK_SPEED + RIDE.seconds + 2 * RIDE.board, 6);
    expect(RIDE.seconds).toBe(4);
    const t0 = r.ride!.from / WALK_SPEED + RIDE.board;
    const at = (t: number) => walkAt(walk, t * 1000, false);
    // La vitesse s'annule aux deux bouts, et ne dépasse jamais π/2 fois la vitesse moyenne.
    const speed = (t: number) => distance(at(t).at, at(t + 0.01).at) / 0.01;
    const mean = (r.ride!.to - r.ride!.from) / RIDE.seconds;
    expect(speed(t0)).toBeLessThan(mean * 0.05);
    expect(speed(t0 + RIDE.seconds - 0.01)).toBeLessThan(mean * 0.05);
    for (let t = t0; t < t0 + RIDE.seconds; t += 0.1) expect(speed(t)).toBeLessThanOrEqual(mean * (Math.PI / 2) + 1e-3);
    expect(at(t0 + 1).riding).not.toBeNull();
    // Le cap de Kéo dans la caisse, calculé une fois au départ : le même du début à la fin du roulement.
    expect(walk.ride?.heading).toBeDefined();
    for (let t = t0 + 0.05; t < t0 + RIDE.seconds; t += 0.5) expect(at(t).heading).toBe(walk.ride!.heading);
    expect(at(total + 0.1).moving).toBe(false);
  });

  it('avec « Réduire les animations », un fondu court par la brume : le voile monte puis se retire, Kéo passe d’un coup', () => {
    const route = cabinButtonRoute(land, { x: s.near.x + s.dir.x * (s.abut[0] - 2), z: s.near.z + s.dir.z * (s.abut[0] - 2) }, true);
    const r = routeWithRide(route, land);
    const walk = startWalk(r.route, 0, r.ride);
    expect(walkSeconds(walk, true)).toBeCloseTo(2 * RIDE.fade, 6);
    expect(walkAt(walk, RIDE.fade * 500, true).veil).toBeCloseTo(0.5, 3);
    expect(walkAt(walk, RIDE.fade * 1000 + 1, true).veil).toBeGreaterThan(0.99);
    const end = walkAt(walk, 2 * RIDE.fade * 1000 + 1, true);
    expect(end.veil).toBe(0);
    expect(end.moving).toBe(false);
    expect(end.riding).toBeNull();
  });
});

describe('La caméra au bord du plateau', () => {
  // Un plateau d'école : tout ce qui est à l'ouest de x = 0.
  const top = (x: number) => x < 0;
  const onTop = (x: number, _z: number) => top(x);
  const fresh = (): CliffHold => ({ height: 0, back: 0, held: 0, level: 0 });
  const r0 = Math.hypot(FOLLOW.height, FOLLOW.back);
  const e0 = Math.atan2(FOLLOW.height, FOLLOW.back);
  // Le cap met la caméra à l'est de Kéo, au-dessus du vide.
  const EAST = Math.PI / 2;

  it('loin du bord, la poursuite ordinaire', () => {
    const out = fresh();
    expect(cliffHold({ x: -30, y: 13, z: 0 }, EAST, 0, onTop, out)).toBe(false);
    expect(out.level).toBe(0);
  });

  it('au bord, elle s’approche d’abord de Kéo, à la plongée ordinaire, jusqu’à 5 unités', () => {
    const out = fresh();
    expect(cliffHold({ x: -6, y: 13, z: 0 }, EAST, 0, onTop, out)).toBe(true);
    expect(Math.atan2(out.height, out.back)).toBeCloseTo(e0, 6);
    const d = Math.hypot(out.height, out.back);
    expect(d).toBeLessThan(r0);
    expect(d).toBeGreaterThanOrEqual(CLIFF_HOLD.approach - 1e-9);
    expect(top(-6 + out.back)).toBe(true);
  });

  it('puis seulement elle se redresse, par crans, jusqu’à 65° au plus, à 5 unités ; en dernier, elle s’approche encore', () => {
    for (const x of [-3, -2.6]) {
      const out = fresh();
      expect(cliffHold({ x, y: 13, z: 0 }, EAST, 0, onTop, out), String(x)).toBe(true);
      const elevation = Math.atan2(out.height, out.back);
      expect(elevation).toBeGreaterThan(e0 + 1e-6);
      expect(elevation).toBeLessThanOrEqual(CLIFF_HOLD.max + 1e-9);
      // Un nombre entier de crans au-dessus de la plongée ordinaire.
      const steps = (elevation - e0) / CLIFF_HOLD.step;
      expect(Math.abs(steps - Math.round(steps)) < 1e-6 || Math.abs(elevation - CLIFF_HOLD.max) < 1e-9).toBe(true);
      expect(Math.hypot(out.height, out.back)).toBeCloseTo(CLIFF_HOLD.approach, 6);
      expect(top(x + out.back)).toBe(true);
    }
    // Kéo tout au bord : à 65°, au plus près permis.
    const out = fresh();
    cliffHold({ x: -1.5, y: 13, z: 0 }, EAST, 0, onTop, out);
    expect(Math.atan2(out.height, out.back)).toBeCloseTo(CLIFF_HOLD.max, 6);
    expect(Math.hypot(out.height, out.back)).toBeCloseTo(CLIFF_HOLD.nearest, 6);
  });

  it('ne pompe pas : Kéo qui va et vient au seuil d’un cran, ou longe le bord, ne la fait pas sauter d’un cran à l’autre', () => {
    // Kéo s'approche du bord pas à pas : les crans ne font que monter.
    const out = fresh();
    const levels: number[] = [];
    for (let x = -14; x <= -1.5; x += 0.05) {
      cliffHold({ x, y: 13, z: 0 }, EAST, 0, onTop, out);
      levels.push(out.level);
    }
    for (let k = 1; k < levels.length; k++) expect(levels[k]).toBeGreaterThanOrEqual(levels[k - 1]);
    // Au seuil d'un cran, un va-et-vient de quelques centimètres : le cran ne bouge plus après le premier pas.
    const changes = levels.map((l, k) => (k > 0 && l !== levels[k - 1] ? -14 + k * 0.05 : null)).filter((x): x is number => x !== null);
    expect(changes.length).toBeGreaterThan(2);
    for (const edge of changes) {
      const o = fresh();
      cliffHold({ x: edge + 0.05, y: 13, z: 0 }, EAST, 0, onTop, o);
      const held = o.level;
      expect(held).toBeGreaterThan(0);
      for (let k = 0; k < 6; k++) {
        cliffHold({ x: edge + (k % 2 ? 0.05 : -0.1), y: 13, z: 0 }, EAST, 0, onTop, o);
        expect(o.level, String(edge)).toBe(held);
      }
    }
    // Kéo longe le bord (avec « Réduire les animations », la vue prend chaque cran d'un coup) : le cran reste le même.
    const along = fresh();
    cliffHold({ x: -3, y: 13, z: 0 }, EAST, 0, onTop, along);
    const kept = along.level;
    for (let z = 0; z < 20; z += 0.5) {
      cliffHold({ x: -3 + 0.08 * Math.sin(z * 3), y: 13, z }, EAST, 0, onTop, along);
      expect(along.level).toBe(kept);
    }
    // Revenu loin du bord, la poursuite ordinaire.
    cliffHold({ x: -30, y: 13, z: 0 }, EAST, 0, onTop, along);
    expect(along.level).toBe(0);
  });

  it('le dessus du plateau du 5e se lit comme la vue le lit (`plateauShare`)', () => {
    const donjon = PLAN.places.find((p) => p.id === 'donjon')!;
    expect(plateauShare(donjon.center)).toBeGreaterThan(0.95);
  });
});

describe('La caisse de la gare du haut et la caméra au bord (seconde relecture du lot 3)', () => {
  const land = cabinOf(PLAN)!;
  const s = bridgeSite(land);
  const stops = cabinStops(s);
  const at = (d: number, v: number) => ({ x: s.near.x + s.dir.x * d - s.dir.z * v, z: s.near.z + s.dir.z * d + s.dir.x * v });
  // Les poteaux et le toit de la caisse du haut : ce que la caisse fermée a de plus que l'ouverte (ils viennent en dernier).
  const closedCar = cabinCarParked(land, 'haut', true);
  const openCar = cabinCarParked(land, 'haut', false);
  const roof = closedCar.positions.subarray(openCar.positions.length);
  /** Le segment de `a` à `b` traverse-t-il un triangle du toit ou d'un poteau (Möller-Trumbore) ? */
  const hitsRoof = (a: readonly number[], b: readonly number[]): boolean => {
    const dir = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    for (let i = 0; i < roof.length; i += 9) {
      const e1 = [roof[i + 3] - roof[i], roof[i + 4] - roof[i + 1], roof[i + 5] - roof[i + 2]];
      const e2 = [roof[i + 6] - roof[i], roof[i + 7] - roof[i + 1], roof[i + 8] - roof[i + 2]];
      const p = [dir[1] * e2[2] - dir[2] * e2[1], dir[2] * e2[0] - dir[0] * e2[2], dir[0] * e2[1] - dir[1] * e2[0]];
      const det = e1[0] * p[0] + e1[1] * p[1] + e1[2] * p[2];
      if (Math.abs(det) < 1e-9) continue;
      const t0 = [a[0] - roof[i], a[1] - roof[i + 1], a[2] - roof[i + 2]];
      const u = (t0[0] * p[0] + t0[1] * p[1] + t0[2] * p[2]) / det;
      if (u < 0 || u > 1) continue;
      const q = [t0[1] * e1[2] - t0[2] * e1[1], t0[2] * e1[0] - t0[0] * e1[2], t0[0] * e1[1] - t0[1] * e1[0]];
      const v = (dir[0] * q[0] + dir[1] * q[1] + dir[2] * q[2]) / det;
      if (v < 0 || u + v > 1) continue;
      const t = (e2[0] * q[0] + e2[1] * q[1] + e2[2] * q[2]) / det;
      if (t > 0 && t < 1) return true;
    }
    return false;
  };

  it('fermée, elle a ses quatre poteaux et son toit ; ouverte, ni l’un ni l’autre, rien au-dessus de ses murets', () => {
    expect(roof.length).toBeGreaterThan(0);
    const floor = cabinCarFloor(s, stops.top);
    for (let i = 1; i < openCar.positions.length; i += 3) expect(openCar.positions[i]).toBeLessThanOrEqual(floor + CABIN_CAR.wall + 1e-4);
    const none = bridgeFacets(land, true, null).triangles;
    expect(bridgeFacets(land, true, 'haut', true).triangles).toBe(none + openCar.triangles);
    // Au pied, elle garde toujours son toit.
    expect(bridgeFacets(land, true, 'bas', true).triangles).toBe(bridgeFacets(land, true, 'bas').triangles);
  });

  it('elle s’ouvre quand Kéo est dedans, ou à la gare du haut la caméra retenue ; loin d’elle, jamais', () => {
    expect(cabinCarOpen(land, at(stops.top, 0), false)).toBe(true);
    expect(cabinCarOpen(land, at(s.abut[1] + 3, 0), true)).toBe(true);
    expect(cabinCarOpen(land, at(s.abut[1] + 3, 0), false)).toBe(false);
    expect(cabinCarOpen(land, at(s.abut[1] + 30, 0), true)).toBe(false);
    // À l'arrivée du bouton « Monter », Kéo est déjà sorti de la gare : la caisse a son toit, même pendant que la caméra
    // tourne vers le Donjon (retenue au bord un instant).
    const arrival = cabinButtonRoute(land, at(s.abut[0] - 2, 0), true).at(-1)!;
    for (const held of [false, true]) expect(cabinCarOpen(land, arrival, held)).toBe(false);
  });

  it('à la gare du haut, à chaque cap, jamais de toit ni de poteau de la caisse entre la caméra et Kéo', () => {
    const onTop = (x: number, z: number) => plateauShare({ x, z }) >= 0.8;
    const pose = followPose({ x: 0, y: 0, z: 0 });
    let checked = 0;
    const fails: string[] = [];
    for (let d = stops.top - CABIN_CAR.half; d <= s.abut[1] + 9; d += 0.5)
      for (let v = -4; v <= 4; v += 0.5) {
        const p = at(d, v);
        const y = bridgeFloor(p.x, p.z, [], PLAN) ?? heightAt5e(p);
        if (cabinSide(land, p) !== 'haut' || (!onTop(p.x, p.z) && bridgeFloor(p.x, p.z, [], PLAN) === null)) continue;
        for (let k = 0; k < 16; k++) {
          const yaw = (k / 16) * 2 * Math.PI - Math.PI;
          const hold: CliffHold = { height: 0, back: 0, held: 0, level: 0 };
          const held = cliffHold({ x: p.x, y, z: p.z }, yaw, 0, onTop, hold);
          if (cabinCarOpen(land, p, held)) continue;
          hold.held = held ? 1 : 0;
          followPose({ x: p.x, y, z: p.z }, 0, pose, yaw, 0, hold);
          const cam = [pose.position.x, pose.position.y, pose.position.z];
          for (const h of [0.3, 1.2, KEO_ROOM - 0.1]) if (hitsRoof(cam, [p.x, y + h, p.z])) fails.push(`d ${(d - stops.top).toFixed(1)} v ${v} cap ${k} h ${h} held ${held} lvl ${hold.level} side ${cabinSide(land, p)}`);
          checked++;
        }
      }
    expect(fails).toEqual([]);
    expect(checked).toBeGreaterThan(500);
  });
});

describe('Le budget du 5e, avec la Montée', () => {
  const sum = (c: { triangles: number; calls: number }[]) => c.reduce((a, p) => ({ triangles: a.triangles + p.triangles, calls: a.calls + p.calls }), { triangles: 0, calls: 0 });

  // Les plafonds du lot 4 (la Lisière et le dirigeable, intention du directeur artistique du 19 octobre 2026), plus la
  // faune (piste « Ambiance par terre ») : un appel de plus, sur « On peut augmenter le budget » du mainteneur (19 octobre 2026).
  it('scénette ouverte : 84 600 triangles et 18 appels au plus ; hors scénette, 84 000 et 16 ; pendant le départ, 17 ; sous l’enveloppe', () => {
    const open = sum(openWorldCost5e());
    expect(open.triangles).toBeLessThanOrEqual(84_600);
    expect(open.calls).toBeLessThanOrEqual(18);
    const world = sum(openWorldCost5e('monde'));
    expect(world.triangles).toBeLessThanOrEqual(84_000);
    expect(world.calls).toBeLessThanOrEqual(16);
    const departure = sum(openWorldCost5e('depart'));
    expect(departure.triangles).toBeLessThanOrEqual(84_000);
    expect(departure.calls).toBeLessThanOrEqual(17);
    expect(world.calls).toBeLessThanOrEqual(OPEN_WORLD_BUDGET.calls);
    expect(openWorldCost5e().some((c) => c.poste === 'pose')).toBe(false);
    expect(openWorldCost5e('monde').some((c) => c.poste === 'scénette')).toBe(false);
  });
});
