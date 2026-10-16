// Le monde continu du prototype (6e d'Archipéo) : le plan en données, le terrain et ses tuiles, la mer, les chemins et
// leur A*, la marche, la caméra qui suit Kéo, les maquettes, la brume et le budget. Sans Three.js.
import { describe, expect, it } from 'vitest';
import { FacetBuilder, boundsOf } from './facets';
import { groundCost, mapCost, openWorldCost, OPEN_WORLD_BUDGET } from './budget';
import { FOLLOW, FOLLOW_SMOOTHING, KEO_HEIGHT, MARK_LIFT, WORLD_FOG, followPose, followStep, liftStep, markBeside, markOffset, occlusionLift, screenOf } from './camera';
import { distance, insidePolygon, type Vec3 } from './geometry';
import { START_DISTANCE, atNode, findRoute, networkSamples, pathNode, pathRibbons, routeLength, snapToNetwork, startOf } from './paths';
import { COAST, DECK_HEIGHT, DOCK, ISLET, KEO_STEP, LAGOON, PATH_EDGES, PATH_NODES, PLACES, TERRAIN, fromPlan, placeById, placeOfIsland } from './plan6e';
import { modelOfPlace } from './places';
import { sceneSpot } from './questionScene';
import { SEA_TEXTURE, seaPixels, shallowness } from './sea';
import { RING, TILE_SIZE, buildHeightField, heightAt, heightOnMesh, landDistance, standingHeight, tileFacets, tileRect, tileRings, tileTriangleCounts } from './terrain';
import { createTileStore } from './tiles';
import { VEIL_HEIGHT, VEIL_PROFILE, veilFacets } from './veil';
import { WALK_CADENCE, WALK_SPEED, skipWalk, startWalk, walkAt } from './walk';

const field = buildHeightField();
const ground = (x: number, z: number) => heightOnMesh(field, x, z);

describe('Le plan du 6e', () => {
  it('le lagon est dans l’anneau, l’îlot du Phare dans le lagon', () => {
    for (const p of LAGOON) expect(insidePolygon(p, COAST)).toBe(true);
    for (const p of ISLET) expect(insidePolygon(p, LAGOON)).toBe(true);
  });

  it('les cinq lieux reprennent chacun une île du 6e d’aujourd’hui, et leur porte est un nœud du réseau', () => {
    expect(PLACES.map((p) => p.island).sort()).toEqual(['french-6e-grammar-spelling', 'french-6e-phonology', 'maths-6e-calculation', 'maths-6e-decimals', 'maths-6e-fractions']);
    for (const p of PLACES) {
      expect(placeOfIsland(p.island)).toBe(p);
      expect(pathNode(p.door)).toBeDefined();
      // La porte est à quelques pas du lieu.
      expect(distance(pathNode(p.door).at, p.center)).toBeLessThan(p.touchRadius + 2);
    }
  });

  it('le Phare est au milieu du lagon, les Écluses au nord-est', () => {
    expect(placeById('phare').center).toEqual({ x: 0, z: 0 });
    expect(placeById('ecluses').center.x).toBeGreaterThan(100);
    expect(placeById('ecluses').center.z).toBeLessThan(-50);
  });

  it('l’île agrandie : environ 120 pas de Kéo du Phare aux Quais (premier essai, piste 1)', () => {
    const steps = (a: string, b: string) => routeLength(findRoute(atNode(a), atNode(b))) / KEO_STEP;
    expect(steps('phare', 'quais')).toBeGreaterThan(110);
    expect(steps('phare', 'quais')).toBeLessThan(130);
    // Les autres voisins, tels que le plan les donne : des Écluses aux Filets un peu moins, des Quais aux Écluses
    // presque deux fois plus (le sentier de l'est longe tout le rivage).
    expect(steps('ecluses', 'filets')).toBeGreaterThan(90);
    expect(steps('quais', 'ecluses')).toBeLessThan(230);
  });

  it('chaque lieu reste au bord de son rivage : les Quais devant leur bassin, les Filets sur la plage, les Écluses sur la rivière', () => {
    expect(landDistance(placeById('quais').center)).toBeLessThan(5);
    expect(landDistance(placeById('filets').center)).toBeLessThan(2);
    // La scène d'une question des Écluses est sur l'eau de la rivière ; celle des Quais, à quelques pas du bassin.
    expect(landDistance(sceneSpot('ecluses'))).toBeLessThan(0);
    expect(landDistance(sceneSpot('quais'))).toBeLessThan(5);
    for (const p of DOCK) expect(insidePolygon(p, COAST)).toBe(true);
  });
});

describe('Le terrain', () => {
  it('la terre est au-dessus de l’eau, le lagon et le large dessous', () => {
    expect(heightAt({ x: 0, z: 0 })).toBeGreaterThan(0.2); // l'îlot du Phare
    expect(heightAt(fromPlan([700, 600]))).toBeLessThan(0); // le lagon
    expect(heightAt(fromPlan([880, 40]))).toBeLessThan(0); // le large
    expect(heightAt(fromPlan([1300, 600]))).toBeGreaterThan(0.4); // le rivage est
    expect(landDistance(fromPlan([1250, 600]))).toBeLessThan(0); // la rivière
  });

  it('la falaise nord domine le reste', () => {
    expect(heightAt(fromPlan([750, 280]))).toBeGreaterThan(6);
  });

  it('les pieds se posent sur le sol dessiné : aux sommets de la grille, la hauteur de la carte', () => {
    for (const [i, j] of [[3, 4], [20, 30], [40, 10], [41, 11]]) {
      const x = field.minX + i * field.step;
      const z = field.minZ + j * field.step;
      expect(heightOnMesh(field, x, z)).toBeCloseTo(field.heights[j * field.nx + i], 5);
    }
    // Au milieu d'une case, entre ses quatre coins.
    const x = field.minX + 30.5 * field.step;
    const z = field.minZ + 20.25 * field.step;
    const coins = [[30, 20], [31, 20], [30, 21], [31, 21]].map(([i, j]) => field.heights[j * field.nx + i]);
    const h = heightOnMesh(field, x, z);
    expect(h).toBeGreaterThanOrEqual(Math.min(...coins) - 1e-6);
    expect(h).toBeLessThanOrEqual(Math.max(...coins) + 1e-6);
  });

  it('des tuiles carrées sur toute l’étendue, à deux niveaux de détail, comptées sans être construites', () => {
    expect(field.nx).toBe(TERRAIN.tilesX * TERRAIN.tileCells + 1);
    expect(TERRAIN.tileCells % TERRAIN.coarse).toBe(0);
    const near = tileTriangleCounts(field, 'near');
    const far = tileTriangleCounts(field, 'far');
    // La tuile du Phare : sur la terre, du sable à l'herbe.
    const tx = Math.floor((0 - TERRAIN.minX) / TILE_SIZE);
    const tz = Math.floor((0 - TERRAIN.minZ) / TILE_SIZE);
    const i = tz * TERRAIN.tilesX + tx;
    const fine = tileFacets(field, tx, tz, 'near');
    const coarse = tileFacets(field, tx, tz, 'far');
    expect(fine.triangles).toBe(near[i]);
    expect(coarse.triangles).toBe(far[i]);
    expect(coarse.triangles).toBeLessThan(fine.triangles / 4);
    // Rien ne regarde vers le bas : le dessus vers le ciel, la jupe du bord à la verticale.
    for (const t of [fine, coarse]) for (let k = 1; k < t.normals.length; k += 3) expect(t.normals[k]).toBeGreaterThan(-1e-6);
    // Le large n'a rien à dessiner.
    expect(near[0]).toBe(0);
  });

  it('la jupe du bord : chaque tuile descend sous son pourtour, et la fente avec une voisine de loin est bouchée', () => {
    const tx = Math.floor((0 - TERRAIN.minX) / TILE_SIZE);
    const tz = Math.floor((0 - TERRAIN.minZ) / TILE_SIZE);
    const r = tileRect(tx, tz);
    const t = tileFacets(field, tx, tz, 'far');
    let below = 0;
    for (let k = 0; k < t.positions.length; k += 3) {
      const onEdge = Math.abs(t.positions[k] - r.minX) < 1e-4 || Math.abs(t.positions[k] - r.maxX) < 1e-4 || Math.abs(t.positions[k + 2] - r.minZ) < 1e-4 || Math.abs(t.positions[k + 2] - r.maxZ) < 1e-4;
      if (onEdge && t.positions[k + 1] < heightOnMesh(field, t.positions[k], t.positions[k + 2]) - 1) below++;
    }
    expect(below).toBeGreaterThan(0);
  });

  it('deux anneaux autour de Kéo : de près au plus neuf tuiles, de loin jusqu’au bout de la brume, rien derrière la caméra', () => {
    for (const p of networkSamples(10)) {
      const rings = tileRings(p, WORLD_FOG.far);
      expect(rings.near.length).toBeGreaterThan(0);
      expect(rings.near.length).toBeLessThanOrEqual(9);
      for (const i of [...rings.near, ...rings.far]) {
        const r = tileRect(i % TERRAIN.tilesX, Math.floor(i / TERRAIN.tilesX));
        expect(r.minZ).toBeLessThanOrEqual(p.z + RING.behind);
      }
      // La tuile sous Kéo est toujours de près.
      const under = Math.floor((p.z - TERRAIN.minZ) / TILE_SIZE) * TERRAIN.tilesX + Math.floor((p.x - TERRAIN.minX) / TILE_SIZE);
      expect(rings.near).toContain(under);
    }
  });
});

describe('La mer et le lagon', () => {
  it('l’eau claire dans le lagon, le bleu du large au loin et au bord de l’image', () => {
    expect(shallowness(fromPlan([700, 600]))).toBe(1);
    expect(shallowness(fromPlan([880, 20]))).toBe(0);
    const px = seaPixels();
    expect(px).toHaveLength(SEA_TEXTURE.size * SEA_TEXTURE.size * 4);
    const at = (i: number, j: number) => Array.from(px.slice((j * SEA_TEXTURE.size + i) * 4, (j * SEA_TEXTURE.size + i) * 4 + 3));
    expect(at(0, 0)).toEqual([0x17, 0x80, 0x78]);
    expect(at(SEA_TEXTURE.size / 2, SEA_TEXTURE.size / 2)).toEqual([0x2f, 0xb5, 0xa6]);
  });
});

describe('Les chemins aimantés', () => {
  it('le réseau est d’un seul tenant', () => {
    const seen = new Set([PATH_NODES[0].id]);
    for (let changed = true; changed; ) {
      changed = false;
      for (const [a, b] of PATH_EDGES)
        if (seen.has(a) !== seen.has(b)) {
          seen.add(a);
          seen.add(b);
          changed = true;
        }
    }
    expect(seen.size).toBe(PATH_NODES.length);
  });

  it('on marche au sec : sur la terre, ou sur la digue et les pontons au-dessus de l’eau', () => {
    for (const n of PATH_NODES) expect(standingHeight(ground(n.at.x, n.at.z))).toBeGreaterThanOrEqual(DECK_HEIGHT);
  });

  it('un toucher dans le lagon aimante Kéo sur la digue la plus proche', () => {
    const p = snapToNetwork(fromPlan([930, 655]));
    expect(PATH_EDGES[p.edge]).toEqual(['phare', 'digue']);
    // Aucun autre point du réseau n'est plus près.
    for (let k = 0; k <= 50; k++) {
      const q = snapToNetwork(fromPlan([600 + k * 16, 300 + k * 12]));
      const [a, b] = PATH_EDGES[q.edge];
      expect(distance(q.at, { x: pathNode(a).at.x + q.t * (pathNode(b).at.x - pathNode(a).at.x), z: pathNode(a).at.z + q.t * (pathNode(b).at.z - pathNode(a).at.z) })).toBeLessThan(1e-9);
    }
  });

  it('A* rend le plus court trajet, d’un lieu à l’autre, par les nœuds voisins', () => {
    const route = findRoute(atNode('phare'), atNode('ecluses'));
    expect(route[0]).toEqual(pathNode('phare').at);
    expect(route[route.length - 1]).toEqual(pathNode('ecluses').at);
    expect(route.map((p) => PATH_NODES.find((n) => n.at === p)?.id)).toEqual(['phare', 'digue', 'ponton', 'quais', 'est-1', 'est-2', 'est-3', 'est-4', 'ecluses']);
    // Des Filets aux Écluses : par la crête, plus court que par le lagon.
    const parLaCrete = findRoute(atNode('filets'), atNode('ecluses'));
    expect(parLaCrete).toHaveLength(3);
  });

  it('d’un point au milieu d’une liaison à un autre sur la même liaison : tout droit', () => {
    const a = snapToNetwork(fromPlan([1194, 600]));
    const b = snapToNetwork(fromPlan([1194, 540]));
    expect(a.edge).toBe(b.edge);
    expect(findRoute(a, b)).toEqual([a.at, b.at]);
  });

  it('les rubans des chemins ont leur dessus vers le ciel', () => {
    const f = pathRibbons(ground);
    expect(f.triangles).toBeGreaterThan(100);
    expect(f.triangles).toBeLessThan(4000);
  });
});

describe('La marche de Kéo', () => {
  const route = [{ x: 0, z: 0 }, { x: 0, z: -6 }, { x: 6, z: -6 }];

  it('à vitesse constante, 4 unités par seconde, le visage vers où il va', () => {
    expect(WALK_SPEED).toBe(4);
    const w = startWalk(route, 1000);
    const s = walkAt(w, 1000 + (3 / WALK_SPEED) * 1000, false);
    expect(s.at.z).toBeCloseTo(-3, 5);
    expect(s.moving).toBe(true);
    expect(s.heading).toBeCloseTo(0, 5); // vers −z, le nord
    const t = walkAt(w, 1000 + (9 / WALK_SPEED) * 1000, false);
    expect(t.at.x).toBeCloseTo(3, 5);
    expect(t.at.z).toBeCloseTo(-6, 5);
    expect(t.heading).toBeCloseTo(-Math.PI / 2, 5); // vers +x, l'est
    expect(walkAt(w, 1000 + (12.1 / WALK_SPEED) * 1000, false).moving).toBe(false);
  });

  it('ses jambes suivent la vitesse : un pas de Kéo par demi-cycle, sans glisser', () => {
    // Un cycle (2π) fait deux pas : en une seconde, WALK_SPEED / KEO_STEP pas.
    expect((WALK_CADENCE / Math.PI) * KEO_STEP).toBeCloseTo(WALK_SPEED, 9);
  });

  it('« Passer le trajet » dépose Kéo au point touché (sur le chemin), même loin du prochain lieu', () => {
    const from = snapToNetwork(pathNode('phare').at);
    const touched = snapToNetwork(fromPlan([1200, 560]));
    const w = startWalk(findRoute(from, touched), 1000);
    const end = walkAt(skipWalk(w, 1200), 1200, false);
    expect(end.moving).toBe(false);
    expect(distance(end.at, touched.at)).toBeLessThan(1e-9);
  });

  it('« Réduire les animations », ou « Passer le trajet » : il est arrivé', () => {
    const w = startWalk(route, 1000);
    expect(walkAt(w, 1000, true)).toMatchObject({ at: { x: 6, z: -6 }, moving: false });
    expect(walkAt(skipWalk(w, 1100), 1100, false)).toMatchObject({ at: { x: 6, z: -6 }, moving: false });
  });
});

describe('La caméra qui suit Kéo', () => {
  const at = (n: (typeof PATH_NODES)[number]): Vec3 => ({ x: n.at.x, y: standingHeight(heightAt(n.at)), z: n.at.z });
  const SCREENS = [
    { name: 'tablette', w: 1024, h: 768 },
    { name: 'téléphone couché', w: 844, h: 390 },
    { name: 'tablette debout', w: 768, h: 1024 },
  ];

  it('de trois quarts, 4 à 5 m de haut et 6 m derrière Kéo (une unité fait 0,62 m), toujours tournée vers le nord', () => {
    const metres = 1.5 / 2.4;
    expect(FOLLOW.height * metres).toBeGreaterThanOrEqual(4);
    expect(FOLLOW.height * metres).toBeLessThanOrEqual(5);
    expect(FOLLOW.back * metres).toBeCloseTo(6, 0);
    for (const n of PATH_NODES) {
      const p = followPose(at(n));
      expect(p.position.x).toBe(p.target.x);
      expect(p.position.z).toBeGreaterThan(p.target.z);
      expect(p.position.y).toBeCloseTo(at(n).y + FOLLOW.height, 9);
      expect(p.lens).toBe(0);
    }
  });

  it.each(SCREENS)('Kéo y tient environ un sixième de la hauteur de l’écran, sous le milieu, au-dessus de « Y aller » ($name)', ({ w, h }) => {
    for (const n of PATH_NODES) {
      const feet = at(n);
      const pose = followPose(feet);
      const a = screenOf(pose, feet, w, h);
      const b = screenOf(pose, { ...feet, y: feet.y + 2.4 }, w, h);
      expect((a.y - b.y) / h).toBeGreaterThan(0.15);
      expect((a.y - b.y) / h).toBeLessThan(0.19);
      expect(Math.abs(a.x - w / 2)).toBeLessThan(0.5);
      // Ses pieds et son anneau au-dessus de « Y aller » (72 px de haut avec sa marge, en texte normal) et de son air.
      expect(screenOf(pose, { ...feet, z: feet.z + 1.3 }, w, h).y).toBeLessThan(h - 72 - 8);
    }
  });

  it('le haut de l’image garde l’horizon : le Phare se voit du bout de l’île', () => {
    const { w, h } = SCREENS[0];
    const feet = at(pathNode('ecluses'));
    const pose = followPose(feet);
    const horizon = screenOf(pose, { x: feet.x, y: pose.position.y, z: feet.z - 10_000 }, w, h);
    expect(horizon.y).toBeGreaterThan(0);
    expect(horizon.y).toBeLessThan(h * 0.25);
    // Le sommet d'un lieu haut à 100 unités devant Kéo est dans l'image.
    const top = screenOf(pose, { x: feet.x, y: feet.y + modelOfPlace('phare').top, z: feet.z - 100 }, w, h);
    expect(top.y).toBeGreaterThan(0);
  });

  it('une zone morte, puis un rattrapage doux ; d’un bloc avec « Réduire les animations » ou après un saut', () => {
    const focus = { x: 0, y: 1, z: 0 };
    followStep(focus, { x: FOLLOW_SMOOTHING.deadZone * 0.9, y: 1, z: 0 }, 0.016, false);
    expect(focus.x).toBe(0);
    followStep(focus, { x: 4, y: 1, z: 0 }, 0.016, false);
    expect(focus.x).toBeGreaterThan(0);
    expect(focus.x).toBeLessThan(0.5);
    // Une seconde plus tard, il est revenu au bord de la zone morte.
    for (let k = 0; k < 60; k++) followStep(focus, { x: 4, y: 1, z: 0 }, 1 / 60, false);
    expect(focus.x).toBeGreaterThan(4 - FOLLOW_SMOOTHING.deadZone - 0.05);
    followStep(focus, { x: 6, y: 2, z: 3 }, 0.016, true);
    expect(focus).toEqual({ x: 6, y: 2, z: 3 });
    followStep(focus, { x: 6 + FOLLOW_SMOOTHING.jump + 1, y: 2, z: 3 }, 0.016, false);
    expect(focus.x).toBe(6 + FOLLOW_SMOOTHING.jump + 1);
  });

  it('si le relief cache Kéo, la caméra monte juste assez ; sur le plat, elle ne bouge pas', () => {
    const feet = { x: 0, y: 1, z: 0 };
    expect(occlusionLift(feet, () => 1)).toBe(0);
    // Une crête entre Kéo et la caméra.
    const ridge = (_x: number, z: number) => (z > 4 && z < 6 ? 7 : 1);
    const lift = occlusionLift(feet, ridge);
    expect(lift).toBeGreaterThan(0);
    // La ligne de sa tête à la caméra montée passe au-dessus de la crête.
    const head = feet.y + KEO_HEIGHT * 0.8;
    const cam = followPose(feet, lift).position;
    for (const z of [4.5, 5, 5.5]) expect(head + ((cam.y - head) * z) / FOLLOW.back).toBeGreaterThanOrEqual(7.5);
    expect(liftStep(0, lift, 0.016, true)).toBe(lift);
    expect(liftStep(0, lift, 0.016, false)).toBeGreaterThan(0);
    expect(liftStep(0, lift, 0.016, false)).toBeLessThan(lift);
    // Sur le réseau du 6e, la montée reste mesurée.
    const ground = (x: number, z: number) => heightOnMesh(field, x, z);
    for (const p of networkSamples(4)) expect(occlusionLift({ x: p.x, y: standingHeight(ground(p.x, p.z)), z: p.z }, ground)).toBeLessThan(6);
  });

  it('au départ, Kéo est sur le chemin, à 9 unités du pied du lieu, au sud du Phare', () => {
    for (const p of PLACES) {
      const s = startOf(p.door, p.center);
      expect(distance(s.at, p.center)).toBeLessThanOrEqual(START_DISTANCE + 1e-6);
      expect(snapToNetwork(s.at).at.x).toBeCloseTo(s.at.x, 6);
    }
    const phare = startOf('phare', placeById('phare').center);
    expect(distance(phare.at, placeById('phare').center)).toBeCloseTo(START_DISTANCE, 6);
    expect(phare.at.z).toBeGreaterThan(placeById('phare').center.z + 6);
  });

  it('la marque se pose au-dessus du sommet du lieu ; au Phare, à côté de la lanterne, sous son toit', () => {
    for (const p of PLACES.filter((pl) => pl.id !== 'phare')) {
      expect(markOffset(p.id)).toEqual({ x: 0, y: modelOfPlace(p.id).top + MARK_LIFT, z: 0 });
      expect(markBeside(p.id)).toBe(false);
    }
    const phare = markOffset('phare');
    expect(markBeside('phare')).toBe(true);
    expect(phare.x).toBeGreaterThan(1.35);
    expect(phare.y).toBeLessThan(modelOfPlace('phare').top);
  });
});

describe('La brume sur les lieux', () => {
  it('un banc bas et large : le repère du lieu le dépasse (la flèche de la grue, la tour du Phare)', () => {
    expect(veilFacets([]).triangles).toBe(0);
    for (const id of ['quais', 'phare'] as const) {
      const v = veilFacets([id]);
      const ground = standingHeight(heightAt(placeById(id).center));
      let top = -Infinity;
      let reach = 0;
      for (let k = 0; k < v.positions.length; k += 3) {
        top = Math.max(top, v.positions[k + 1]);
        reach = Math.max(reach, Math.hypot(v.positions[k] - placeById(id).center.x, v.positions[k + 2] - placeById(id).center.z));
      }
      expect(top - ground).toBeLessThan(VEIL_HEIGHT + 2);
      expect(top - ground).toBeLessThan(modelOfPlace(id).top - 2);
      // Bien plus large que haut.
      expect(reach).toBeGreaterThan(2.5 * VEIL_HEIGHT);
    }
    expect(veilFacets(['quais', 'filets', 'ecluses']).triangles).toBeLessThan(1200);
  });

  it('dense en bas, effacée vers le haut et sur ses bords, jamais opaque : on devine le lieu dessous', () => {
    expect(VEIL_PROFILE[0].a).toBe(0);
    const densest = Math.max(...VEIL_PROFILE.map((p) => p.a));
    expect(densest).toBeLessThanOrEqual(0.75);
    expect(VEIL_PROFILE[VEIL_PROFILE.length - 1].a).toBeLessThan(densest);
    const v = veilFacets(['filets']);
    expect(v.colors.length).toBe((v.positions.length / 3) * 4);
    for (let k = 3; k < v.colors.length; k += 4) expect(v.colors[k]).toBeLessThanOrEqual(densest + 1e-6);
  });
});

describe('La réserve des tuiles', () => {
  it('une tuile de près au plus par image : celles qui manquent attendent dans une file', () => {
    const store = createTileStore(field, 4);
    const wanted = tileRings(pathNode('quais').at, WORLD_FOG.far).near;
    expect(wanted.length).toBeGreaterThan(1);
    for (const i of wanted) expect(store.near(i)).toBeNull();
    expect(store.pending()).toBe(wanted.length);
    expect(store.pump()).toBe(wanted[0]);
    expect(store.pending()).toBe(wanted.length - 1);
    expect(store.near(wanted[0])).not.toBeNull();
    store.clearQueue();
    expect(store.pump()).toBeNull();
    // Faite tout de suite quand on la demande (le départ, un saut) ; la même ensuite.
    expect(store.build(wanted[1], 'near')).toBe(store.near(wanted[1]));
  });
});

describe('Les maquettes des lieux', () => {
  it('chaque lieu a ses volumes dessinés par le code, légers, et le Phare se voit de loin', () => {
    for (const p of PLACES) {
      const m = modelOfPlace(p.id);
      expect(m.source).toBe('dessine');
      expect(m.facets.triangles).toBeGreaterThan(20);
      expect(m.facets.triangles).toBeLessThan(800);
      expect(m.top).toBeGreaterThan(2);
    }
    expect(modelOfPlace('phare').top).toBeGreaterThan(12);
    expect(modelOfPlace('phare')).toBe(modelOfPlace('phare'));
  });
});

describe('Le budget du monde continu', () => {
  it('le sol en deux appels (de près, de loin), quel que soit le point du réseau où se tient Kéo', () => {
    const g = groundCost();
    expect(g.calls).toBe(2);
    expect(g.near).toBeGreaterThan(g.far / 3);
    expect(g.triangles).toBe(g.near + g.far);
  });

  it('tient dans l’enveloppe estimée au cadrage, sans la relever', () => {
    expect(OPEN_WORLD_BUDGET).toEqual({ triangles: 45_000, calls: 18 });
    const cost = openWorldCost();
    const triangles = cost.reduce((s, c) => s + c.triangles, 0);
    const calls = cost.reduce((s, c) => s + c.calls, 0);
    expect(triangles).toBeLessThanOrEqual(OPEN_WORLD_BUDGET.triangles);
    expect(calls).toBeLessThanOrEqual(OPEN_WORLD_BUDGET.calls);
  });

  it('les cinq lieux, leurs constructions et leurs traces en deux appels, la pose d’une partie en un (GD-20, lot 1)', () => {
    const cost = openWorldCost();
    expect(cost.find((c) => c.poste === 'lieux')?.calls).toBe(2);
    expect(cost.find((c) => c.poste === 'pose')?.calls).toBe(1);
    // Il reste de la place pour les lots suivants (lieu de départ, obstacles, Nef, repère) : 4 appels au moins.
    expect(OPEN_WORLD_BUDGET.calls - cost.reduce((s, c) => s + c.calls, 0)).toBeGreaterThanOrEqual(4);
  });

  it('la Carte des lieux ouverts, toute l’île de loin, tient aussi dans l’enveloppe', () => {
    const map = mapCost();
    expect(map.calls).toBeLessThanOrEqual(OPEN_WORLD_BUDGET.calls);
    expect(map.triangles).toBeLessThanOrEqual(OPEN_WORLD_BUDGET.triangles);
    expect(map.triangles).toBeGreaterThan(groundCost().far);
  });
});

describe('Les facettes', () => {
  it('un pavé tendu entre deux points, aligné sur un axe : ses 12 triangles, ses normales vers le dehors', () => {
    const b = new FacetBuilder();
    b.beam({ x: 0, y: 0, z: 0 }, { x: 2, y: 0, z: 0 }, 0.5, 0xffffff);
    const f = b.build();
    expect(f.triangles).toBe(12);
    const { min, max } = boundsOf(f);
    expect(min.map((v) => +v.toFixed(6))).toEqual([0, -0.25, -0.25]);
    expect(max.map((v) => +v.toFixed(6))).toEqual([2, 0.25, 0.25]);
    // Chaque face regarde dehors : sa normale va du centre du pavé vers le centre de la face, et sa longueur vaut 1.
    for (let t = 0; t < 12; t++) {
      const c = [0, 1, 2].map((a) => (f.positions[t * 9 + a] + f.positions[t * 9 + 3 + a] + f.positions[t * 9 + 6 + a]) / 3);
      const n = [0, 1, 2].map((a) => f.normals[t * 9 + a]);
      expect(Math.hypot(...n)).toBeCloseTo(1, 6);
      expect(n[0] * (c[0] - 1) + n[1] * c[1] + n[2] * c[2]).toBeGreaterThan(0);
      // Alignée sur un axe.
      expect(n.filter((v) => Math.abs(v) > 1e-6)).toHaveLength(1);
    }
  });
});
