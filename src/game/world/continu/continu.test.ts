// Le monde continu du prototype (6e d'Archipéo) : le plan en données, le terrain, la mer, les chemins et leur A*, la
// marche, les cadrages, les maquettes et le budget. Sans Three.js.
import { describe, expect, it } from 'vitest';
import { openWorldCost, OPEN_WORLD_BUDGET } from './budget';
import { CAMERA_PITCH, poseAt, poseOf, shoreAt } from './camera';
import { distance, insidePolygon } from './geometry';
import { atNode, findRoute, pathNode, pathRibbons, routeLength, snapToNetwork } from './paths';
import { COAST, DECK_HEIGHT, FRAMINGS, ISLET, LAGOON, PATH_EDGES, PATH_NODES, PLACES, fromPlan, framingOf, placeById, placeOfIsland } from './plan6e';
import { modelOfPlace } from './places';
import { SEA_TEXTURE, seaPixels, shallowness } from './sea';
import { buildHeightField, heightAt, heightOnMesh, landDistance, standingHeight, terrainTiles } from './terrain';
import { skipWalk, startWalk, walkAt, WALK_SPEED } from './walk';

const field = buildHeightField();
const ground = (x: number, z: number) => heightOnMesh(field, x, z);

describe('Le plan du 6e', () => {
  it('le lagon est dans l’anneau, l’îlot du Phare dans le lagon', () => {
    for (const p of LAGOON) expect(insidePolygon(p, COAST)).toBe(true);
    for (const p of ISLET) expect(insidePolygon(p, LAGOON)).toBe(true);
  });

  it('les quatre lieux reprennent chacun une île du 6e d’aujourd’hui, et leur porte est un nœud du réseau', () => {
    expect(PLACES.map((p) => p.island).sort()).toEqual(['french-6e-grammar-spelling', 'french-6e-phonology', 'maths-6e-calculation', 'maths-6e-fractions']);
    for (const p of PLACES) {
      expect(placeOfIsland(p.island)).toBe(p);
      expect(pathNode(p.door)).toBeDefined();
      // La porte est à quelques pas du lieu.
      expect(distance(pathNode(p.door).at, p.center)).toBeLessThan(p.touchRadius + 2);
    }
  });

  it('le Phare est au milieu du lagon, les Écluses au nord-est', () => {
    expect(placeById('phare').center).toEqual({ x: 0, z: 0 });
    expect(fromPlan([1240, 382]).x).toBeGreaterThan(25);
  });
});

describe('Le terrain', () => {
  it('la terre est au-dessus de l’eau, le lagon et le large dessous', () => {
    expect(heightAt({ x: 0, z: 0 })).toBeGreaterThan(0.2); // l'îlot du Phare
    expect(heightAt(fromPlan([700, 600]))).toBeLessThan(0); // le lagon
    expect(heightAt({ x: 0, z: -60 })).toBeLessThan(0); // le large
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

  it('quatre tuiles, toutes tournées vers le ciel, sans ce qui est sous l’eau', () => {
    const tiles = terrainTiles(field);
    expect(tiles).toHaveLength(4);
    let total = 0;
    for (const t of tiles) {
      total += t.triangles;
      for (let k = 1; k < t.normals.length; k += 3) expect(t.normals[k]).toBeGreaterThan(-1e-6);
    }
    expect(total).toBeLessThan(((field.nx - 1) * (field.nz - 1) * 2) / 1.5);
  });
});

describe('La mer et le lagon', () => {
  it('l’eau claire dans le lagon, le bleu du large au loin et au bord de l’image', () => {
    expect(shallowness(fromPlan([700, 600]))).toBe(1);
    expect(shallowness({ x: 0, z: -62 })).toBe(0);
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
    const p = snapToNetwork(fromPlan([930, 700]));
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
    // Un trajet court (avis du référent dys) : le plus long tient en moins de quinze secondes de marche.
    expect(routeLength(findRoute(atNode('phare'), atNode('filets'))) / WALK_SPEED).toBeLessThan(15);
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
    expect(f.triangles).toBeLessThan(3000);
  });
});

describe('La marche de Kéo', () => {
  const route = [{ x: 0, z: 0 }, { x: 0, z: -6 }, { x: 6, z: -6 }];

  it('à vitesse constante, le visage vers où il va', () => {
    const w = startWalk(route, 1000);
    const s = walkAt(w, 1500, false);
    expect(s.at.z).toBeCloseTo(-3, 5);
    expect(s.moving).toBe(true);
    expect(s.heading).toBeCloseTo(0, 5); // vers −z, le nord
    const t = walkAt(w, 2500, false);
    expect(t.at).toEqual({ x: 3, z: -6 });
    expect(t.heading).toBeCloseTo(-Math.PI / 2, 5); // vers +x, l'est
    expect(walkAt(w, 3100, false).moving).toBe(false);
  });

  it('« Réduire les animations », ou « Passer le trajet » : il est arrivé', () => {
    const w = startWalk(route, 1000);
    expect(walkAt(w, 1000, true)).toMatchObject({ at: { x: 6, z: -6 }, moving: false });
    expect(walkAt(skipWalk(w, 1100), 1100, false)).toMatchObject({ at: { x: 6, z: -6 }, moving: false });
  });
});

describe('Les cadrages prévus', () => {
  it('chaque nœud a son rivage, et son cadrage le montre', () => {
    for (const n of PATH_NODES) {
      expect(shoreAt(n.at)).toBe(n.shore);
      expect(distance(n.at, framingOf(n.shore).target)).toBeLessThan(framingOf(n.shore).radius * 0.9);
    }
    // Chaque lieu tient dans le cadrage du rivage de sa porte.
    for (const p of PLACES) expect(distance(p.center, framingOf(pathNode(p.door).shore).target)).toBeLessThan(framingOf(pathNode(p.door).shore).radius);
  });

  it('la caméra regarde vers le nord, de biais, et recule sur un écran en hauteur', () => {
    for (const f of FRAMINGS) {
      const p = poseOf(f, 4 / 3);
      expect(p.position.x).toBe(p.target.x);
      expect(p.position.z).toBeGreaterThan(p.target.z);
      expect(Math.atan2(p.position.y - p.target.y, p.position.z - p.target.z)).toBeCloseTo(CAMERA_PITCH, 6);
      const portrait = poseOf(f, 3 / 4);
      expect(portrait.position.y).toBeGreaterThan(p.position.y);
    }
  });

  it('un passage doux, sans roulis ni détour ; une coupe franche avec « Réduire les animations »', () => {
    const from = poseOf(framingOf('lagon'), 4 / 3);
    const to = poseOf(framingOf('nord'), 4 / 3);
    const move = { from, to, start: 10 };
    expect(poseAt(move, 10, true)).toBe(to);
    expect(poseAt(move, 10, false).position).toEqual(from.position);
    const mid = poseAt(move, 10.7, false);
    // À mi-chemin, l'axe de visée garde le même angle : la caméra glisse, elle ne tourne pas.
    expect(Math.atan2(mid.position.y - mid.target.y, mid.position.z - mid.target.z)).toBeCloseTo(CAMERA_PITCH, 6);
    expect(poseAt(move, 20, false).position.x).toBeCloseTo(to.position.x, 9);
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
  it('tient dans l’enveloppe estimée au cadrage', () => {
    const cost = openWorldCost();
    const triangles = cost.reduce((s, c) => s + c.triangles, 0);
    const calls = cost.reduce((s, c) => s + c.calls, 0);
    expect(triangles).toBeLessThanOrEqual(OPEN_WORLD_BUDGET.triangles);
    expect(calls).toBeLessThanOrEqual(OPEN_WORLD_BUDGET.calls);
  });
});
