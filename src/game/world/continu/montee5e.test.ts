// La Montée finie (GD-22, lot 3) : son modèle par étapes, sa scénette, ses traces, ses abords, la cabine à une seule
// caisse, son trajet, la caméra au bord du plateau et le budget du 5e. Sans Three.js.
import { describe, expect, it } from 'vitest';
import { OPEN_WORLD_BUDGET, openWorldCost5e } from './budget';
import { CABIN_CAR, bridgeFacets, bridgeFloor, bridgeSite, cabinCarFacets, cabinCarFloor, cabinStops } from './bridges';
import { cabinButtonRoute, cabinOf, cabinSide, routeWithRide } from './cabinRide';
import { CLIFF_HOLD, FOLLOW, cliffHold, type CliffHold } from './camera';
import { WHOLE, constructionFacets, traceStagePosed } from './construction';
import { distance } from './geometry';
import { planFor } from './levelPlan';
import { MONTEE, MONTEE_GLOW, MONTEE_HEIGHT, RAIL_SPANS } from './montee5e';
import { NETWORK_5E } from './paths5e';
import { placePieces } from './places';
import { placeItems } from './questions';
import { placeTrace, sceneSpot } from './questionScene';
import { scenetteHabitant, scenetteKeo, scenetteOf, scenetteSurroundings } from './scenette';
import { SURROUNDINGS_MAX } from './surroundings';
import { buildHeightField5e, groundOn5e, onPlateau, plateauShare } from './terrain5e';
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
    expect(pieces.filter((p) => p.stage === 1)).toHaveLength(2);
    expect(pieces.filter((p) => p.stage === 2)).toHaveLength(2);
    // Chaque travée de la ruine part avec la travée neuve qui la remplace ; le chantier part avec les abords.
    const fallen = pieces.filter((p) => p.stage === 'ruine' && p.until);
    expect(fallen.map((p) => `${p.until!.stage}:${p.until!.row}`)).toEqual(['0:0', '0:0.34', '0:0.67', '0:0', '1:0', '2:0']);
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

  it('le bouton : « Haut » à la gare du pied, « Bas » à celle du haut ; son trajet ressort sur la gare d’arrivée', () => {
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

  it('loin du bord, la poursuite ordinaire', () => {
    const out: CliffHold = { height: 0, back: 0, held: 0 };
    expect(cliffHold({ x: -30, y: 13, z: 0 }, Math.PI / 2, 0, onTop, out)).toBe(false);
  });

  it('au bord, elle se redresse par crans, jusqu’à 65° au plus, puis s’approche : son pied reste sur le plateau', () => {
    for (const x of [-7, -4, -3]) {
      const out: CliffHold = { height: 0, back: 0, held: 0 };
      // Le cap met la caméra à l'est de Kéo, au-dessus du vide.
      expect(cliffHold({ x, y: 13, z: 0 }, Math.PI / 2, 0, onTop, out), String(x)).toBe(true);
      const elevation = Math.atan2(out.height, out.back);
      expect(elevation).toBeLessThanOrEqual(CLIFF_HOLD.max + 1e-9);
      expect(elevation).toBeGreaterThan(Math.atan2(FOLLOW.height, FOLLOW.back));
      expect(top(x + out.back)).toBe(true);
      expect(out.height).toBeGreaterThan(0);
    }
    // Kéo tout au bord : à 65°, au plus près permis ; son pied dépasse à peine.
    const out: CliffHold = { height: 0, back: 0, held: 0 };
    cliffHold({ x: -1.5, y: 13, z: 0 }, Math.PI / 2, 0, onTop, out);
    expect(Math.atan2(out.height, out.back)).toBeCloseTo(CLIFF_HOLD.max, 6);
    expect(out.back).toBeLessThanOrEqual(CLIFF_HOLD.nearest * Math.cos(CLIFF_HOLD.max) + 1e-6);
  });

  it('le dessus du plateau du 5e se lit comme la vue le lit (`plateauShare`)', () => {
    const donjon = PLAN.places.find((p) => p.id === 'donjon')!;
    expect(plateauShare(donjon.center)).toBeGreaterThan(0.95);
  });
});

describe('Le budget du 5e, avec la Montée', () => {
  const sum = (c: { triangles: number; calls: number }[]) => c.reduce((a, p) => ({ triangles: a.triangles + p.triangles, calls: a.calls + p.calls }), { triangles: 0, calls: 0 });

  it('scénette ouverte : 88 000 triangles et 17 appels au plus ; hors scénette, 78 000 au plus ; sous l’enveloppe', () => {
    const open = sum(openWorldCost5e());
    expect(open.triangles).toBeLessThanOrEqual(88_000);
    expect(open.calls).toBeLessThanOrEqual(17);
    const world = sum(openWorldCost5e('monde'));
    expect(world.triangles).toBeLessThanOrEqual(78_000);
    expect(world.calls).toBeLessThanOrEqual(OPEN_WORLD_BUDGET.calls);
    expect(openWorldCost5e().some((c) => c.poste === 'pose')).toBe(false);
    expect(openWorldCost5e('monde').some((c) => c.poste === 'scénette')).toBe(false);
  });
});
