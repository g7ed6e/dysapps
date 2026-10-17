// Les passerelles du monde continu (GD-20, point 3, lot 1 « Relier ») : la table lieu → liaison, les passerelles
// démontées sur leur embranchement, hors de la brume, et la marche qui s'arrête au bord. La grille (les liaisons de
// `getBridge`, leur prix) se vérifie dans three/archipeo/placeLinks.test.ts : world/continu n'importe que lui-même.
import { describe, expect, it } from 'vitest';
import { followPose, screenOf } from './camera';
import { distance } from './geometry';
import {
  BRANCH_EDGES,
  BRANCH_NODES,
  OBSTACLE_TOUCH,
  PLACE_LINKS,
  START_PLACES,
  VEIL_MARGIN,
  allObstacles,
  branchOf,
  clampToOpen,
  closedPlaces,
  isLinked,
  linkFacets,
  linkIslands,
  obstacleOf,
  reachableNodes,
} from './links';
import { atNode, findRoute, pathNode } from './paths';
import { PATH_EDGES, PLACES, placeById } from './plan6e';
import { heightAt, standingHeight } from './terrain';
import { underVeil } from './veil';

const linked = PLACES.map((p) => p.id).filter(isLinked);
const ground = (x: number, z: number) => heightAt({ x, z });

describe('La table lieu → liaison', () => {
  it('quatorze lieux à relier, le Phare et les Quais ouverts au départ', () => {
    expect(START_PLACES).toEqual(['phare', 'quais']);
    expect(linked).toHaveLength(14);
    expect(Object.keys(PLACE_LINKS).sort()).toEqual([...linked].sort());
    expect(closedPlaces(() => false)).toEqual(linked);
    expect(closedPlaces(() => true)).toEqual([]);
  });

  it('chaque liaison part d’un lieu ouvert au départ et mène à l’île du lieu', () => {
    for (const place of linked) {
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
    // Le bord est plus loin du lieu que la passerelle.
    const door = pathNode(placeById(place).door).at;
    expect(findRoute(o.bank, atNode(placeById(place).door)).length).toBeGreaterThan(0);
    expect(distance(o.bank.at, door)).toBeGreaterThan(distance(o.at, door) - 1e-6);
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
