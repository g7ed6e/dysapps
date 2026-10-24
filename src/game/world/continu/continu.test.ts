// Le monde continu du prototype (6e d'Archipéo) : le plan en données, le terrain et ses tuiles, la mer, les chemins et
// leur A*, la marche, la caméra qui suit Kéo, les maquettes, la brume et le budget. Sans Three.js.
import { describe, expect, it } from 'vitest';
import { FacetBuilder, boundsOf } from './facets';
import { groundCost, mapCost, openWorldCost, OPEN_WORLD_BUDGETS } from './budget';
import { FOLLOW, FOLLOW_SMOOTHING, KEO_HEIGHT, LOOK_UP, MARK_LIFT, WORLD_FOG, followPose, followStep, liftStep, lookUp, markBeside, markOffset, markPoint, markShift, occlusionLift, screenOf, wrapAngle } from './camera';
import { distance, distanceToPolyline, insidePolygon, linearRgb, type Vec3 } from './geometry';
import { START_DISTANCE, atNode, edgesNear, findRoute, networkSamples, pathNode, pathRibbons, pathTopAt, routeLength, snapToNetwork, startOf } from './paths';
import { COAST, COLORS_6E, DECK_HEIGHT, DOCK, ISLET, KEO_STEP, LAGOON, LOOKOUT_RAMP, NORTH_FLATS, NORTH_SHORE, PATH_EDGES, PATH_NODES, PLACES, TERRAIN, fromPlan, hidesTraces, placeOfIsland } from './plan6e';
import { modelOfPlace } from './places';
import { sceneSpot } from './questionScene';
import { SEA_TEXTURE, WATER_TONES, decodeSeaField, seaPixels, shallowness, toneOfFields, waterTone } from './sea';
import { HILLS, RING, RING_FLOOR, RING_LIFT, TILE_SIZE, buildHeightField, hillsAt, heightAt, heightOnFar, heightOnMesh, landDistance, ringHeights, standingHeight, tileFacets, tileRect, tileRings, tileTriangleCounts } from './terrain';
import { createTileStore } from './tiles';
import { landTileFacets } from './flora';
import { VEIL_HEIGHT, VEIL_LAYERS, highest, veilFacets, veilShare } from './veil';
import { bridgeSite } from './bridges';
import { landById, linkedLands } from './lands';
import { WALK_CADENCE, WALK_SPEED, skipWalk, startWalk, walkAt } from './walk';
import { placeById, planFor } from './levelPlan';

/** Le plan du 6e, le seul enregistré (GD-22). */
const PLAN = planFor('6e');
const LANDS = PLAN.lands;
const LINKED_LANDS = linkedLands(PLAN);

const field = buildHeightField();
const ground = (x: number, z: number) => heightOnMesh(field, x, z);

describe('Le plan du 6e', () => {
  it('le lagon est dans l’anneau, l’îlot du Phare dans le lagon', () => {
    for (const p of LAGOON) expect(insidePolygon(p, COAST)).toBe(true);
    for (const p of ISLET) expect(insidePolygon(p, LAGOON)).toBe(true);
  });

  it('les seize lieux reprennent chacun une île du 6e d’aujourd’hui, et leur porte est un nœud du réseau', () => {
    expect(PLACES.map((p) => p.island).sort()).toEqual([
      'civics-6e-democratic-society',
      'english-6e-grammar',
      'english-6e-vocabulary',
      'french-6e-grammar-spelling',
      'french-6e-letter-confusion',
      'french-6e-phonology',
      'french-6e-reading',
      'french-6e-word-spelling',
      'geography-6e-living',
      'history-6e-antiquity',
      'life-earth-sciences-6e-living-world',
      'maths-6e-calculation',
      'maths-6e-decimals',
      'maths-6e-fractions',
      'physics-chemistry-6e-matter-energy',
      'technology-6e-objects',
    ]);
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
      // La tuile sous Kéo est toujours de près, quand il y en a une : sur la jetée et l'îlot de la Gare maritime (lot L9b),
      // à l'ouest du terrain, Kéo marche sur le large.
      if (p.x < TERRAIN.minX) continue;
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
    // Chaque pixel porte les deux champs (le cœur, l'eau claire) ; leur palier, comme le shader.
    const toneAt = (i: number, j: number) => {
      const k = (j * SEA_TEXTURE.size + i) * 4;
      return toneOfFields({ night: decodeSeaField(px[k]), clear: decodeSeaField(px[k + 1]), shelf: decodeSeaField(px[k + 2]) });
    };
    expect(toneAt(0, 0)).toBe(WATER_TONES.lagoon);
    expect(toneAt(SEA_TEXTURE.size / 2, SEA_TEXTURE.size / 2)).toBe(WATER_TONES.clear);
    // Le large au Bleu lagon du pack, le lagon au turquoise clair et moins saturé de la reprise.
    expect(WATER_TONES.lagoon).toBe(0x178078);
    expect(WATER_TONES.clear).toBe(0x5cc3b5);
    // Le cœur de chaque bras de mer est le plus profond ; l'eau du lagon, claire ; loin du pont, le cœur s'arrête.
    for (const land of LINKED_LANDS) expect(waterTone(bridgeSite(land).mid), land).toBe(WATER_TONES.night);
    expect(waterTone(fromPlan([700, 600]))).toBe(WATER_TONES.clear);
    // Hors de l'anneau, en s'éloignant de la côte : l'eau claire, le palier du milieu, puis le Bleu lagon (deuxième reprise).
    const west = (x: number) => waterTone(fromPlan([x, 900]));
    const tones = [395, 370, 340, 300, 200, 120].map(west);
    expect(tones[0]).toBe(WATER_TONES.clear);
    expect(tones).toContain(WATER_TONES.shelf);
    expect(tones.at(-1)).toBe(WATER_TONES.lagoon);
    expect(tones.indexOf(WATER_TONES.shelf)).toBeLessThan(tones.indexOf(WATER_TONES.lagoon));
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
    expect(route.map((p) => PATH_NODES.find((n) => n.at === p)?.id)).toEqual(['phare', 'digue', 'ponton', 'quais', 'est-1', 'est-2', 'est-3', 'est-4', 'ecl-0', 'ecluses']);
    // Des Filets aux Écluses : la crête n'a plus de chemin (GD-20, point 3, « vraies terres ») ; on passe le pont des Crêtes.
    const parLePont = findRoute(atNode('filets'), atNode('ecluses'));
    expect(parLePont.map((p) => PATH_NODES.find((n) => n.at === p)?.id)).toContain('nord-1');
    expect(parLePont.map((p) => PATH_NODES.find((n) => n.at === p)?.id)).toContain('est-4');
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
    // Le liseré brun des sentiers, à 3:1 au moins de leur sable (les deux couleurs de la matière ; mesuré aussi à l'écran).
    const has = (hex: number) => {
      const [r, g, b] = linearRgb(hex);
      for (let k = 0; k < f.colors.length; k += 3) if (Math.abs(f.colors[k] - r) + Math.abs(f.colors[k + 1] - g) + Math.abs(f.colors[k + 2] - b) < 1e-5) return true;
      return false;
    };
    expect(has(COLORS_6E.path)).toBe(true);
    expect(has(COLORS_6E.pathEdge)).toBe(true);
    const lum = (c: number) => { const [r, g, b] = linearRgb(c); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
    expect((lum(COLORS_6E.path) + 0.05) / (lum(COLORS_6E.pathEdge) + 0.05)).toBeGreaterThanOrEqual(3);
    // Quatorze lieux reliés (le chemin de la Turbine, lot L6a ; celui du Chantier naval, lot L6b : 4 880 ; le rivage nord, lot
    // L7, sa rampe et son muret : 6 120 ; le rivage sud et ses quatre chemins, lot L8 : 7 338, mesuré sur le monde réuni).
    // Seize lieux (le large, lot L9 : le chemin de la côte ouest et la jetée de la Gare maritime, 8 592). Le liseré de terre
    // des sentiers (lot 3 des vraies terres, deuxième reprise) : quatre triangles de plus par morceau et un disque de sable
    // de douze par nœud, 12 214.
    expect(f.triangles).toBeLessThan(12600);
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

  it('la caméra tourne autour de Kéo (GD-20, rotation libre) : vers le nord à 0, à l’est à π/2, le relief et le regard levé suivent', () => {
    expect(wrapAngle(Math.PI * 3)).toBeCloseTo(Math.PI, 9);
    expect(wrapAngle(-Math.PI / 2 - 2 * Math.PI)).toBeCloseTo(-Math.PI / 2, 9);
    const feet = { x: 3, y: 1, z: -2 };
    // À 0, la pose d'avant la rotation : derrière Kéo au sud.
    const north = followPose(feet, 0, undefined, 0);
    expect(north.position.x).toBe(feet.x);
    expect(north.position.z).toBeCloseTo(feet.z + FOLLOW.back, 9);
    expect(north).toEqual(followPose(feet));
    // À π/2, à l'est, tournée vers l'ouest ; Kéo à la même place à l'écran.
    const east = followPose(feet, 0, undefined, Math.PI / 2);
    expect(east.position.x).toBeCloseTo(feet.x + FOLLOW.back, 9);
    expect(east.position.z).toBeCloseTo(feet.z, 9);
    expect(east.target.x).toBeLessThan(east.position.x);
    expect(screenOf(east, feet, 1024, 768).y).toBeCloseTo(screenOf(north, feet, 1024, 768).y, 6);
    expect(screenOf(east, feet, 1024, 768).x).toBeCloseTo(512, 6);
    // Une crête à l'est : elle ne lève la caméra que tournée vers l'ouest.
    const ridge = (x: number) => (x > feet.x + 4 && x < feet.x + 6 ? 7 : 1);
    expect(occlusionLift(feet, ridge, 0)).toBe(0);
    expect(occlusionLift(feet, ridge, Math.PI / 2)).toBeGreaterThan(0);
    // Le regard levé garde la direction de la caméra tournée.
    const top = { x: feet.x - 12, y: 14, z: feet.z };
    const pose = followPose(feet, 0, undefined, Math.PI / 2);
    lookUp(pose, top, feet, 1, 768);
    expect(pose.target.z).toBeCloseTo(pose.position.z, 6);
    expect(pose.target.x).toBeLessThan(pose.position.x);
    expect(screenOf(pose, top, 1024, 768).y).toBeLessThanOrEqual(768 * LOOK_UP.air + 1e-6);
  });

  it('les anneaux de tuiles tournent avec la caméra : la tuile sous Kéo toujours là, rien derrière elle', () => {
    for (const p of networkSamples(40))
      for (let k = 0; k < 8; k++) {
        const yaw = (k * Math.PI) / 4;
        const rings = tileRings(p, WORLD_FOG.far, yaw);
        const all = [...rings.near, ...rings.far];
        const under = all.find((i) => {
          const r = tileRect(i % TERRAIN.tilesX, Math.floor(i / TERRAIN.tilesX));
          return p.x >= r.minX && p.x <= r.maxX && p.z >= r.minZ && p.z <= r.maxZ;
        });
        // (Un point hors du terrain, la Gare maritime au large, n'a pas de tuile, dans aucune direction.)
        const inside = p.x >= TERRAIN.minX && p.z >= TERRAIN.minZ && p.x < TERRAIN.minX + TERRAIN.tilesX * TILE_SIZE && p.z < TERRAIN.minZ + TERRAIN.tilesZ * TILE_SIZE;
        if (inside) expect(under, `${p.x},${p.z} à ${k}/8`).toBeDefined();
        for (const i of all) {
          const r = tileRect(i % TERRAIN.tilesX, Math.floor(i / TERRAIN.tilesX));
          const bx = Math.sin(yaw);
          const bz = Math.cos(yaw);
          const behind = ((bx > 0 ? r.minX : r.maxX) - p.x) * bx + ((bz > 0 ? r.minZ : r.maxZ) - p.z) * bz;
          expect(behind).toBeLessThanOrEqual(RING.behind + 1e-9);
        }
      }
    expect(tileRings(pathNode('quais').at, WORLD_FOG.far, 0)).toEqual(tileRings(pathNode('quais').at, WORLD_FOG.far));
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

  it('un lieu pas encore entier : sa marque au-dessus de ce qui est bâti, sans le décalage du Phare entier (le 6e ne bouge pas)', () => {
    // Le Phare en ruine ou en chantier : la marque reste sur son axe, jamais à côté d'une lanterne qui n'est pas là.
    expect(markPoint('phare', 4, false)).toEqual({ x: 0, y: 4 + MARK_LIFT, z: 0 });
    expect(markPoint('phare', modelOfPlace('phare').top, true)).toEqual(markOffset('phare'));
    // Seul `markShift` déplace la marque d'un lieu pas encore entier (la Loge du 4e, au-dessus de son mur ouest).
    for (const id of ['loge', 'gabarit', 'phare'] as const) {
      const m = markPoint(id, 3, false);
      expect({ x: m.x, z: m.z }, id).toEqual(markShift(id));
    }
  });
});

describe('La brume des terres fermées', () => {
  it('basse, sur la terre fermée seule : ses lieux dessous, jamais ceux d’une terre ouverte', () => {
    expect(veilFacets([]).triangles).toBe(0);
    for (const land of LINKED_LANDS) {
      for (const id of landById(land).places) expect(veilShare(land, placeById(id).center), id).toBeGreaterThan(0.5);
      for (const other of LANDS) if (other.id !== land) for (const id of other.places) expect(veilShare(land, placeById(id).center), id).toBe(0);
      const v = veilFacets([land]);
      // Un sommet sur sept (un pas premier, qui ne retombe pas sur le même coin de chaque case de la grille) : plusieurs
      // centaines par terre ; les 41 600 sommets faisaient frôler les 5 s au test (seconde relecture du lot 3).
      let seen = 0;
      for (let k = 0; k < v.positions.length; k += 3 * 7, seen++) {
        // Le voile passe au-dessus du plus haut du sol à une demi-case autour (reprise du lot 3).
        const ground = Math.max(0.05, standingHeight(highest({ x: v.positions[k], z: v.positions[k + 2] })));
        expect(v.positions[k + 1] - ground).toBeLessThanOrEqual(VEIL_HEIGHT + 1e-4);
      }
      expect(seen, land).toBeGreaterThan(300);
      // Le repère de chaque lieu la dépasse.
      for (const id of landById(land).places) expect(modelOfPlace(id).top, id).toBeGreaterThan(VEIL_HEIGHT + 0.5);
    }
    // Une grille de 3 unités (reprise du lot 3) : environ 14 000 triangles pour les quatre terres.
    expect(veilFacets(LINKED_LANDS).triangles).toBeLessThan(15000);
  });

  it('jamais opaque : les deux voiles réunis laissent voir chaque lieu ; nette sur le bras de mer', () => {
    expect(VEIL_LAYERS.reduce((s, l) => s + l.alpha, 0)).toBeLessThanOrEqual(0.62);
    const v = veilFacets(['cretes']);
    expect(v.colors.length).toBe((v.positions.length / 3) * 4);
    for (let k = 3; k < v.colors.length; k += 4) expect(v.colors[k]).toBeLessThanOrEqual(Math.max(...VEIL_LAYERS.map((l) => l.alpha)) + 1e-6);
    // Au milieu de chaque bras de mer, aucune brume : la coupure se lit.
    for (const land of LINKED_LANDS) expect(veilShare(land, bridgeSite(land).mid)).toBe(0);
  });
});

describe('La réserve des tuiles', () => {
  it('une tuile de près au plus par image : celles qui manquent attendent dans une file', () => {
    const store = createTileStore(field, 4);
    const wanted = tileRings(pathNode('quais').at, WORLD_FOG.far).near;
    expect(wanted.length).toBeGreaterThan(1);
    for (const i of wanted) expect(store.near(i)).toBeNull();
    expect(store.pending()).toBe(wanted.length);
    // En deux images (reprise du lot 3) : le sol, puis ce qui y pousse ; la tuile finie est la tuile entière.
    expect(store.pump()).toBeNull();
    expect(store.near(wanted[0])).toBeNull();
    store.clearQueue();
    for (const i of wanted) store.near(i);
    expect(store.pump()).toBe(wanted[0]);
    expect(store.pending()).toBe(wanted.length - 1);
    const whole = landTileFacets(field, wanted[0] % TERRAIN.tilesX, Math.floor(wanted[0] / TERRAIN.tilesX), 'near');
    expect(Array.from(store.near(wanted[0])!.facets.positions)).toEqual(Array.from(whole.positions));
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
      // La Turbine (lot L6a), une machine entière : 1 082 (après la relecture), dans l'estimation du directeur artistique (environ 2 030 avec
      // ses traces et sa brume).
      expect(m.facets.triangles).toBeLessThan(p.id === 'engine' ? 1100 : 800);
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

  it('tient dans l’enveloppe relevée par le mainteneur (111 500 triangles et 22 appels, l’équipier de la scénette, 21 octobre 2026)', () => {
    expect(OPEN_WORLD_BUDGETS['6e']).toEqual({ triangles: 111_500, calls: 22 });
    // Le 5e a la sienne (choix du mainteneur, 20 octobre 2026, « Relever seulement » ; relevée le 23 octobre 2026 pour les habitants près de leur porte, « 1 500 triangles »).
    expect(OPEN_WORLD_BUDGETS['5e']).toEqual({ triangles: 128_000, calls: 22 });
    // Sans les aménagements, dont la vue trace les dessins : le tout se compte dans three/archipeo/amenagements.test.ts.
    const cost = openWorldCost(0);
    const triangles = cost.reduce((s, c) => s + c.triangles, 0);
    const calls = cost.reduce((s, c) => s + c.calls, 0);
    expect(triangles).toBeLessThanOrEqual(OPEN_WORLD_BUDGETS['6e'].triangles);
    expect(calls).toBeLessThanOrEqual(OPEN_WORLD_BUDGETS['6e'].calls);
  });

  it('les lieux, leurs constructions et leurs traces en deux appels, la pose d’une partie en un (GD-20, lot 1)', () => {
    const cost = openWorldCost(0);
    expect(cost.find((c) => c.poste === 'lieux')?.calls).toBe(2);
    expect(cost.find((c) => c.poste === 'pose')?.calls).toBe(1);
    // Il reste de la place pour les lots suivants (la Nef) : 2 appels au moins (3 avant les Détours, dont la baleine et
    // les oiseaux prennent un appel ; 4 avant le lot 3 de GD-20, point 3, qui prend le ciel et l'ombre de Kéo).
    expect(OPEN_WORLD_BUDGETS['6e'].calls - cost.reduce((s, c) => s + c.calls, 0)).toBeGreaterThanOrEqual(2);
  });

  it('la Carte des lieux ouverts, toute l’île de loin, tient aussi dans l’enveloppe', () => {
    const map = mapCost(0);
    expect(map.calls).toBeLessThanOrEqual(OPEN_WORLD_BUDGETS['6e'].calls);
    expect(map.triangles).toBeLessThanOrEqual(OPEN_WORLD_BUDGETS['6e'].triangles);
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

describe('Le rivage nord (GD-20, point 8, lot L7)', () => {
  it('la rampe de la Vigie monte sans marche du pied au plateau, en pente douce, et rien ne change loin d’elle', () => {
    const { from, to } = LOOKOUT_RAMP;
    const L = distance(from, to);
    const at = (t: number) => heightAt({ x: from.x + (to.x - from.x) * t, z: from.z + (to.z - from.z) * t });
    let prev = at(0);
    for (let k = 1; k <= 40; k++) {
      const h = at(k / 40);
      // Jamais de marche : d'un pas au suivant, la pente reste sous 1 pour 3 ; jamais de descente.
      expect(h - prev, `t=${k / 40}`).toBeLessThan(L / 40 / 3);
      expect(h, `t=${k / 40}`).toBeGreaterThan(prev - 0.05);
      prev = h;
    }
    // Le haut rejoint le plateau de la tour.
    expect(Math.abs(at(1) - heightAt(placeById('lookout').center))).toBeLessThan(1);
    // Loin de la rampe (au large de son flanc), le sol est celui d'avant : la rampe n'y ajoute rien.
    const mid = { x: (from.x + to.x) / 2, z: (from.z + to.z) / 2 };
    const n = { x: -(to.z - from.z) / L, z: (to.x - from.x) / L };
    const far = { x: mid.x + n.x * 30, z: mid.z + n.z * 30 };
    expect(heightAt(far)).toBeLessThan(at(0.5) + 6);
  });

  it('Kéo tient la pente de chaque chemin du rivage nord (la rampe comprise)', () => {
    const nodes = new Set(['imp-1', 'arc-1', 'vig-1', 'vig-2', 'vig-3', 'vig-4', 'lookout', 'archives', 'printworks']);
    for (const [a, b] of PATH_EDGES.filter(([u, v]) => nodes.has(u) && nodes.has(v))) {
      const p = pathNode(a).at;
      const q = pathNode(b).at;
      const steps = Math.max(2, Math.ceil(distance(p, q) / 1.5));
      for (let k = 0; k < steps; k++) {
        const u = { x: p.x + ((q.x - p.x) * k) / steps, z: p.z + ((q.z - p.z) * k) / steps };
        const v = { x: p.x + ((q.x - p.x) * (k + 1)) / steps, z: p.z + ((q.z - p.z) * (k + 1)) / steps };
        // La rampe et ses abords sous 0,45 ; les chemins du bas sous 0,6 (ailleurs dans l'île, jusqu'à 0,96 aux Écluses).
        const ramp = a.startsWith('vig-') || b.startsWith('vig-');
        expect(Math.abs(heightAt(v) - heightAt(u)) / distance(u, v), `${a}–${b}`).toBeLessThan(ramp ? 0.45 : 0.6);
      }
    }
  });

  it('les replats des Archives et de l’Imprimerie : à plat sous le lieu, au-dessus de l’eau', () => {
    for (const f of NORTH_FLATS) {
      const h = heightAt(f.center);
      expect(h).toBeGreaterThan(0.3);
      for (const [dx, dz] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) expect(Math.abs(heightAt({ x: f.center.x + dx * f.radius * 0.6, z: f.center.z + dz * f.radius * 0.6 }) - h)).toBeLessThan(0.3);
    }
  });

  it('pendant une question d’un des trois lieux, les traces des trois se cachent ; ailleurs, seules celles du lieu', () => {
    for (const asked of NORTH_SHORE) for (const p of NORTH_SHORE) expect(hidesTraces(asked, p)).toBe(true);
    expect(hidesTraces('lookout', 'filets')).toBe(false);
    expect(hidesTraces('filets', 'lookout')).toBe(false);
    expect(hidesTraces('filets', 'filets')).toBe(true);
    expect(hidesTraces(null, 'lookout')).toBe(false);
  });
});

describe('L’anneau clair sous Kéo (directeur artistique, 17 octobre 2026)', () => {
  // Un anneau de 24 pas, comme celui de la vue (rayons 0,85 et 1,3).
  const xz = new Float32Array(
    Array.from({ length: 25 }, (_, k) => {
      const r = k % 2 ? 1.3 : 0.85;
      const a = (2 * Math.PI * k) / 24;
      return [r * Math.cos(a), r * Math.sin(a)];
    }).flat(),
  );
  const out = new Float32Array(25);
  const field = buildHeightField();
  const ground = (x: number, z: number) => heightOnMesh(field, x, z);

  it('épouse le sol et passe sur les chemins, sans jamais plonger d’une marche : chaque sommet juste au-dessus du sol et du dessus des rubans, et pas plus bas que les pieds moins 0,1', () => {
    const edges: number[] = [];
    let above = 0;
    // Kéo sur le réseau, au milieu de chaque liaison et sur chaque nœud.
    const spots = [...PATH_NODES.map((n) => n.at), ...PATH_EDGES.map(([a, b]) => {
      const p = PATH_NODES.find((n) => n.id === a)!.at;
      const q = PATH_NODES.find((n) => n.id === b)!.at;
      return { x: (p.x + q.x) / 2, z: (p.z + q.z) / 2 };
    })];
    for (const c of spots) {
      edgesNear(c.x, c.z, 1.3, edges);
      const surface = (x: number, z: number) => Math.max(standingHeight(ground(x, z)), pathTopAt(x, z, ground, edges));
      const feet = standingHeight(ground(c.x, c.z));
      ringHeights(c.x, c.z, feet, xz, surface, out);
      for (let i = 0; i < out.length; i++) {
        const x = c.x + xz[2 * i];
        const z = c.z + xz[2 * i + 1];
        const y = feet + out[i];
        expect(y - standingHeight(ground(x, z))).toBeGreaterThanOrEqual(RING_LIFT - 1e-4);
        // Jamais une marche vers le bas : pas plus bas que les pieds de Kéo moins 0,1.
        expect(out[i]).toBeGreaterThanOrEqual(RING_FLOOR - 1e-6);
        // Au-dessus de tout ruban qui passe là, même ceux que `edgesNear` n'a pas retenus.
        expect(y - pathTopAt(x, z, ground, PATH_EDGES.map((_, e) => e))).toBeGreaterThanOrEqual(RING_LIFT - 1e-4);
        if (y - feet > 0.2) above++;
      }
    }
    // Il y a bien des pentes et des chemins qui dépassent sous l'anneau : à plat, il y serait entré.
    expect(above).toBeGreaterThan(0);
  });

  it('sur des planches (Kéo plus haut que le sol), à plat sous ses pieds', () => {
    ringHeights(0, 0, 3, xz, (x) => x * 0.5, out);
    for (const y of out) expect(y).toBeCloseTo(RING_LIFT, 6);
  });
});

describe('Les chemins de loin (directeur artistique, 17 octobre 2026)', () => {
  it('le terrain de loin ne passe jamais au-dessus de la ligne d’un chemin : il reste continu à toute distance', () => {
    const f = buildHeightField();
    let lowered = 0;
    for (const [ia, ib] of PATH_EDGES) {
      const a = pathNode(ia).at;
      const c = pathNode(ib).at;
      const len = Math.hypot(c.x - a.x, c.z - a.z);
      const n = Math.max(1, Math.ceil(len / 0.4));
      for (let q = 0; q <= n; q++) {
        const x = a.x + ((c.x - a.x) * q) / n;
        const z = a.z + ((c.z - a.z) * q) / n;
        // Le dessus du ruban (0,06 au-dessus du sol exact sur sa ligne), moins un peu d'air.
        expect(heightOnFar(f, x, z), `${ia}–${ib}`).toBeLessThanOrEqual(standingHeight(heightOnMesh(f, x, z)) + 0.04 + 1e-4);
      }
    }
    // Loin des chemins, le terrain de loin reste celui du sol.
    for (let r = 0; r < f.far.length; r++) if (f.far[r] !== f.heights[r]) lowered++;
    expect(lowered).toBeGreaterThan(0);
    expect(lowered).toBeLessThan(f.far.length / 9 / 4);
  });
});

describe('Les collines (GD-20, point 3, lot 3, reprise)', () => {
  // Les points de l'île, tous les trois pas, et la hauteur des collines en chacun.
  const samples: { x: number; z: number; h: number }[] = [];
  for (let x = TERRAIN.minX; x < TERRAIN.minX + TERRAIN.tilesX * TILE_SIZE; x += 3)
    for (let z = TERRAIN.minZ; z < TERRAIN.minZ + TERRAIN.tilesZ * TILE_SIZE; z += 3) samples.push({ x, z, h: hillsAt({ x, z }) });
  const nodes = new Map(PATH_NODES.map((n) => [n.id, n.at]));
  const pathDistance = (p: { x: number; z: number }) => Math.min(...PATH_EDGES.map(([a, b]) => distanceToPolyline(p, [nodes.get(a)!, nodes.get(b)!])));

  it('de vraies collines : une dizaine au moins montent à plus de 5, aucune au-dessus de 8', () => {
    const high = samples.filter((s) => s.h > 5);
    const peaks: { x: number; z: number }[] = [];
    for (const s of high) if (!peaks.some((q) => distance(q, s) < 15)) peaks.push(s);
    expect(peaks.length).toBeGreaterThanOrEqual(10);
    expect(Math.max(...samples.map((s) => s.h))).toBeLessThanOrEqual(HILLS.height[1] + 1e-6);
  });

  it('loin des chemins, des lieux et de l’eau : la marche de Kéo, les replats et les plages ne bougent pas', () => {
    for (const s of samples) {
      if (s.h === 0) continue;
      expect(pathDistance(s)).toBeGreaterThan(HILLS.path - 0.01);
      for (const p of PLACES) expect(distance(s, p.center)).toBeGreaterThan(HILLS.place - 0.01);
      expect(landDistance(s)).toBeGreaterThan(HILLS.coast - 0.01);
    }
  });
});
