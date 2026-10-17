// Les passerelles du monde continu (GD-20, point 3, lot 1 « Relier ») : la table lieu → liaison, les passerelles
// démontées sur leur embranchement, hors de la brume, et la marche qui s'arrête au bord. La grille (les liaisons de
// `getBridge`, leur prix) se vérifie dans three/archipeo/placeLinks.test.ts : world/continu n'importe que lui-même.
import { describe, expect, it } from 'vitest';
import { followPose, screenOf } from './camera';
import { distance } from './geometry';
import {
  AFTER_NEIGHBOUR,
  BRANCH_EDGES,
  BRANCH_NODES,
  KEO_STOP,
  LAY_PLANKS,
  LINK_LAY,
  OBSTACLE_TOUCH,
  SIDE_STEP,
  PLACE_LINKS,
  START_PLACES,
  VEIL_MARGIN,
  allObstacles,
  branchOf,
  branchRibbons,
  clampToOpen,
  closedPlaces,
  isLinked,
  linkFacets,
  linkFrame,
  linkIslands,
  linkLayAt,
  linkPlanks,
  linksFromStart,
  obstacleOf,
  reachableNodes,
  sideStepOf,
} from './links';
import { atNode, findRoute, routeLength, snapToNetwork } from './paths';
import { PATH_EDGES, PLACES, placeById } from './plan6e';
import { heightAt, standingHeight } from './terrain';
import { underVeil, veilFacets } from './veil';

const linked = PLACES.map((p) => p.id).filter(isLinked);
const ground = (x: number, z: number) => heightAt({ x, z });

describe('La table lieu → liaison', () => {
  it('quatorze lieux à relier, le Phare et les Quais ouverts au départ ; dix depuis le départ, quatre après un voisin', () => {
    expect(START_PLACES).toEqual(['phare', 'quais']);
    expect(linked).toHaveLength(14);
    expect(AFTER_NEIGHBOUR).toEqual(['engine', 'shipyard', 'lookout', 'archives']);
    expect([...Object.keys(PLACE_LINKS), ...AFTER_NEIGHBOUR].sort()).toEqual([...linked].sort());
    expect(closedPlaces(() => false)).toEqual(linked);
    expect(closedPlaces(() => true)).toEqual([]);
  });

  it('chaque liaison de la table part d’un lieu ouvert au départ et mène à l’île du lieu ; aucune pour les quatre d’après un voisin', () => {
    for (const place of linked) {
      if (!linksFromStart(place)) {
        expect(linkIslands(place), place).toBeNull();
        continue;
      }
      const pair = linkIslands(place)!;
      expect(pair[0], place).toBe(placeById(PLACE_LINKS[place]).island);
      expect(pair[1], place).toBe(placeById(place).island);
    }
    expect(linkIslands('phare')).toBeNull();
    expect(linkIslands('quais')).toBeNull();
  });
});

describe('Les passerelles démontées', () => {
  it.each(linked)('%s : sur son embranchement, entière hors de la brume, le bord du côté ouvert', (place) => {
    const o = obstacleOf(place);
    const branch = branchOf(place);
    expect(branch.edges).toContain(o.edge);
    expect(o.beyond.every((e) => branch.edges.includes(e))).toBe(true);
    // Le bord où Kéo s'arrête, hors du banc de son lieu ; le ruisseau peint, son milieu aussi. Sur la vraie eau (la
    // Turbine, la Gare maritime), le bout des planches du côté ouvert : à la Gare maritime, la rivière longe le lieu et
    // son autre bout entre dans la brume.
    expect(underVeil(place, o.bank.at, VEIL_MARGIN.whole)).toBe(false);
    if (!o.water) expect(underVeil(place, o.at, VEIL_MARGIN.middle)).toBe(false);
    else {
      const near = distance(o.water.from, o.bank.at) < distance(o.water.to, o.bank.at) ? o.water.from : o.water.to;
      expect(underVeil(place, near, VEIL_MARGIN.whole)).toBe(false);
    }
    // Le bord est plus loin du lieu que la passerelle, en marchant.
    const door = atNode(placeById(place).door);
    expect(routeLength(findRoute(o.bank, door))).toBeGreaterThan(routeLength(findRoute(snapToNetwork(o.at), door)));
  });

  it('Kéo s’arrête avant les pieux, jamais entre eux (relecture du directeur artistique)', () => {
    expect(KEO_STOP.stream).toBeGreaterThanOrEqual(2.4);
    for (const o of allObstacles()) {
      if (o.water) {
        const near = Math.min(distance(o.bank.at, o.water.from), distance(o.bank.at, o.water.to));
        expect(near, o.place).toBeGreaterThanOrEqual(KEO_STOP.water - 1e-6);
      } else expect(distance(o.bank.at, o.at), o.place).toBeGreaterThanOrEqual(KEO_STOP.stream - 1e-6);
    }
  });

  it('le ruban du chemin s’arrête à l’eau du ruisseau peint : il ne passe jamais par-dessus (les Ruines)', () => {
    for (const o of allObstacles()) {
      if (o.water) continue;
      // Les tirets épais de la Carte, larges, peuvent frôler l'eau d'un coude voisin, vus de haut : seul compte le monde.
      for (const look of ['solid', 'dashes'] as const) {
        const f = branchRibbons(o.place, look, ground);
        for (let i = 0; i < f.positions.length; i += 3) {
          const dx = f.positions[i] - o.at.x;
          const dz = f.positions[i + 2] - o.at.z;
          const u = dx * o.toward.x + dz * o.toward.z;
          const v = -dx * o.toward.z + dz * o.toward.x;
          expect(Math.abs(u) > 0.55 || Math.abs(v) > 3, `${o.place} ${look}`).toBe(true);
        }
      }
    }
  });

  it('les embranchements ne se croisent pas, et leurs carrefours restent sur le réseau ouvert', () => {
    const seen = new Set<number>();
    for (const place of linked)
      for (const e of branchOf(place).edges) {
        expect(seen.has(e), `${place} ${e}`).toBe(false);
        seen.add(e);
      }
    expect(BRANCH_EDGES.size).toBe(seen.size);
    for (const place of linked) expect(BRANCH_NODES.has(branchOf(place).junction)).toBe(false);
  });

  it('aucun lieu fermé n’en coupe un autre : tout le réseau hors des embranchements reste accessible', () => {
    const all = reachableNodes(placeById('phare').door, linked);
    const open = new Set(PATH_EDGES.flatMap(([a, b]) => [a, b]).filter((n) => !BRANCH_NODES.has(n)));
    for (const n of open) expect(all.has(n), n).toBe(true);
    // Un lieu fermé seul : tous les autres lieux restent accessibles jusqu'à leur porte.
    for (const place of linked) {
      const reach = reachableNodes(placeById('quais').door, [place]);
      for (const other of PLACES) if (other.id !== place) expect(reach.has(other.door), `${place} → ${other.id}`).toBe(true);
      expect(reach.has(placeById(place).door)).toBe(false);
    }
  });

  it('Kéo s’arrête au bord : au-delà d’une passerelle démontée, il va au bord ; ailleurs, où on l’envoie', () => {
    for (const place of linked) {
      const o = obstacleOf(place);
      expect(clampToOpen(atNode(placeById(place).door), [place])).toBe(o.bank);
      expect(clampToOpen(atNode(placeById(place).door), [])).toEqual(atNode(placeById(place).door));
      const other = linked.find((p) => p !== place)!;
      expect(clampToOpen(atNode(placeById(other).door), [place])).toEqual(atNode(placeById(other).door));
    }
  });

  it('la cible fait 48 px au moins : de loin par son rayon à l’écran, de près par son rayon au sol, vue du bord', () => {
    expect(2 * OBSTACLE_TOUCH.pixels).toBeGreaterThanOrEqual(48);
    for (const { w, h } of [
      { w: 1024, h: 768 },
      { w: 844, h: 390 },
      { w: 768, h: 1024 },
    ])
      for (const place of linked) {
        const o = obstacleOf(place);
        const feet = { x: o.bank.at.x, y: standingHeight(heightAt(o.bank.at)), z: o.bank.at.z };
        const pose = followPose(feet);
        const y = standingHeight(heightAt(o.at));
        const c = screenOf(pose, { x: o.at.x, y, z: o.at.z }, w, h);
        const edge = screenOf(pose, { x: o.at.x + OBSTACLE_TOUCH.radius, y, z: o.at.z }, w, h);
        expect(2 * Math.hypot(edge.x - c.x, edge.y - c.y), `${place} ${w}×${h}`).toBeGreaterThanOrEqual(48);
      }
  });

  it('démontée, la corde coupée ; reliée, le pont neuf : jamais rien de vide', () => {
    for (const o of allObstacles()) {
      const cut = linkFacets(o, false, ground);
      const laid = linkFacets(o, true, ground);
      expect(cut.positions.length, o.place).toBeGreaterThan(0);
      expect(laid.positions.length, o.place).toBeGreaterThan(0);
    }
  });
});

describe('La pose d’une passerelle (lot 2)', () => {
  const at = (u: number) => linkLayAt(u, { planks: 0, fall: 0, landed: false, fade: 0, done: false });

  it('cinq planches, chacune une boîte : la passerelle prête et ses planches font la passerelle reliée', () => {
    expect(LAY_PLANKS).toBe(5);
    for (const o of allObstacles()) {
      const planks = linkPlanks(o, ground);
      expect(planks.triangles, o.place).toBe(LAY_PLANKS * 10);
      expect(linkFrame(o, ground).triangles + planks.triangles, o.place).toBe(linkFacets(o, true, ground).triangles);
    }
  });

  it('les planches se posent l’une après l’autre, en ralentissant, sans rebond ; un toc à la dernière, puis le fondu ; 2,5 s au plus', () => {
    expect(at(0)).toMatchObject({ planks: 1, fall: LINK_LAY.drop, landed: false, fade: 0 });
    for (let k = 0; k < LAY_PLANKS; k++) {
      const start = k * LINK_LAY.plank;
      expect(at(start + 0.01).planks).toBe(k + 1);
      // Elle descend sans jamais remonter, de plus en plus lentement.
      let was = Infinity;
      let step = Infinity;
      for (let i = 0; i < 10; i++) {
        const f = at(start + (LINK_LAY.plank * i) / 10).fall;
        expect(f).toBeLessThanOrEqual(was);
        if (was !== Infinity) {
          expect(was - f).toBeLessThanOrEqual(step + 1e-9);
          step = was - f;
        }
        was = f;
      }
    }
    const end = LAY_PLANKS * LINK_LAY.plank;
    expect(at(end - 0.01).landed).toBe(false);
    expect(at(end)).toMatchObject({ planks: LAY_PLANKS, fall: 0, landed: true, fade: 0, done: false });
    expect(at(end + LINK_LAY.fade / 2).fade).toBeCloseTo(0.5);
    expect(at(end + LINK_LAY.fade + 1e-6).done).toBe(true);
    expect(end + LINK_LAY.fade).toBeLessThanOrEqual(2.5);
  });

  it('la brume du lieu qu’on relie se dessine en dernier, ses sommets à part : le reste ne bouge pas', () => {
    const v = veilFacets(['filets', 'ecluses', 'ruins'], 'filets');
    const rest = veilFacets(['ecluses', 'ruins']);
    expect(v.fadingFrom).toBe(rest.positions.length / 3);
    expect(Array.from(v.positions.slice(0, rest.positions.length))).toEqual(Array.from(rest.positions));
    expect(v.triangles).toBe(rest.triangles + veilFacets(['filets']).triangles);
    expect(rest.fadingFrom).toBe(rest.positions.length / 3);
  });
});

describe('Le pas de côté de Kéo pendant la pose (directeur artistique, relecture du lot 2)', () => {
  it('au bord de chaque ruisseau, Kéo s’écarte du pont neuf, sur le sol, sans pente raide, et regarde la passerelle', () => {
    for (const o of allObstacles()) {
      const step = sideStepOf(o, o.bank.at, ground);
      if (o.water) {
        // Sur la vraie eau, la passerelle est longue : il ne la cache pas.
        expect(step, o.place).toBeNull();
        continue;
      }
      expect(step, o.place).not.toBeNull();
      const { to, heading } = step!;
      const dx = to.x - o.at.x;
      const dz = to.z - o.at.z;
      // Même distance du ruisseau (le long du chemin), et de côté : son bord passe celui du pont neuf.
      expect(dx * o.toward.x + dz * o.toward.z, o.place).toBeCloseTo(-distance(o.bank.at, o.at), 5);
      expect(Math.abs(-dx * o.toward.z + dz * o.toward.x), o.place).toBeCloseTo(SIDE_STEP.lateral, 5);
      expect(ground(to.x, to.z), o.place).toBeGreaterThan(0.05);
      expect(Math.abs(standingHeight(ground(to.x, to.z)) - standingHeight(ground(o.bank.at.x, o.bank.at.z))), o.place).toBeLessThanOrEqual(SIDE_STEP.steep);
      // Le cap de la marche (./walk.ts) : tourné vers le milieu du pont neuf.
      expect(heading).toBeCloseTo(Math.atan2(-(o.at.x - to.x), -(o.at.z - to.z)), 6);
      // Hors de la brume du lieu.
      expect(underVeil(o.place, to), o.place).toBe(false);
    }
  });

  it('pas de pas loin du bord, ni déjà de côté', () => {
    const o = allObstacles().find((x) => !x.water)!;
    const far = { x: o.at.x - o.toward.x * 12, z: o.at.z - o.toward.z * 12 };
    expect(sideStepOf(o, far, ground)).toBeNull();
    const step = sideStepOf(o, o.bank.at, ground)!;
    expect(sideStepOf(o, step.to, ground)).toBeNull();
  });
});
