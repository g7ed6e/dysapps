// Le monde continu du prototype (6e d'Archipéo) : le plan en données, le terrain, la mer, les cadrages, les maquettes et
// le budget. Sans Three.js.
import { describe, expect, it } from 'vitest';
import { openWorldCost, OPEN_WORLD_BUDGET } from './budget';
import { CAMERA_PITCH, poseOf, shoreAt } from './camera';
import { distance, insidePolygon } from './geometry';
import { COAST, DECK_HEIGHT, FRAMINGS, ISLET, LAGOON, PATH_EDGES, PATH_NODES, PLACES, fromPlan, framingOf, placeById, placeOfIsland } from './plan6e';
import { modelOfPlace } from './places';
import { SEA_TEXTURE, seaPixels, shallowness } from './sea';
import { buildHeightField, heightAt, heightOnMesh, landDistance, standingHeight, terrainTiles } from './terrain';

const field = buildHeightField();
const ground = (x: number, z: number) => heightOnMesh(field, x, z);
const pathNode = (id: string) => PATH_NODES.find((n) => n.id === id)!;

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

describe('Le réseau des chemins', () => {
  it('est d’un seul tenant', () => {
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

  it('on se tient au sec : sur la terre, ou sur la digue et les pontons au-dessus de l’eau', () => {
    for (const n of PATH_NODES) expect(standingHeight(ground(n.at.x, n.at.z))).toBeGreaterThanOrEqual(DECK_HEIGHT);
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
