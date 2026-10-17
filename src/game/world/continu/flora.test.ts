// La végétation, les rochers, les ombres peintes et l'écume du monde continu (GD-20, point 3, lot 3, leviers 3 à 5).
import { describe, expect, it } from 'vitest';
import { FLORA_COLORS, FLORA_KEEP, SHADOW, floraOf, landTileCounts, landTileFacets, shadowColor, type FloraItem } from './flora';
import { distance, distanceToPolyline, linearRgb } from './geometry';
import { PATH_EDGES, PATH_NODES, PLACES, PORT, TERRAIN } from './plan6e';
import { FOAM, buildHeightField, landDistance, straitClearance } from './terrain';

const field = buildHeightField();
const all: FloraItem[] = [];
for (let tz = 0; tz < TERRAIN.tilesZ; tz++) for (let tx = 0; tx < TERRAIN.tilesX; tx++) all.push(...floraOf(field, tx, tz));
const nodes = new Map(PATH_NODES.map((n) => [n.id, n.at]));
const pathDistance = (p: { x: number; z: number }) => Math.min(...PATH_EDGES.map(([a, b]) => distanceToPolyline(p, [nodes.get(a)!, nodes.get(b)!])));
const sameColor = (f: { colors: Float32Array }, k: number, hex: number) => {
  const c = linearRgb(hex);
  return Math.abs(f.colors[k] - c[0]) < 1e-6 && Math.abs(f.colors[k + 1] - c[1]) < 1e-6 && Math.abs(f.colors[k + 2] - c[2]) < 1e-6;
};

describe('La végétation et les rochers', () => {
  it('des pins, des palmiers, des buissons et des rochers en trois gris, toujours au même endroit', () => {
    const kinds = new Map<string, number>();
    for (const it of all) kinds.set(it.kind, (kinds.get(it.kind) ?? 0) + 1);
    for (const k of ['pin', 'palmier', 'buisson', 'rocher']) expect(kinds.get(k) ?? 0, k).toBeGreaterThan(20);
    expect(new Set(all.filter((it) => it.kind === 'rocher').map((it) => it.shade)).size).toBe(3);
    expect(FLORA_COLORS.rocks).toHaveLength(3);
    expect(floraOf(field, 5, 5)).toBe(floraOf(field, 5, 5));
  });

  it('jamais sur un chemin, un lieu, un pont, la rive d’un bras de mer, l’Escale ni dans l’eau ; aucun grand arbre devant la caméra', () => {
    for (const it of all) {
      const p = { x: it.x, z: it.z };
      expect(landDistance(p)).toBeGreaterThan(0.5);
      // Sur la rive d'un bras de mer, des rochers seuls, loin des chemins (des culées et des ponts).
      if (it.kind === 'rocher') expect(straitClearance(p)).toBeGreaterThanOrEqual(FLORA_KEEP.bank);
      else expect(straitClearance(p)).toBeGreaterThanOrEqual(FLORA_KEEP.strait);
      if (straitClearance(p) < FLORA_KEEP.strait) expect(pathDistance(p)).toBeGreaterThanOrEqual(FLORA_KEEP.bankPath - 1e-6);
      expect(pathDistance(p)).toBeGreaterThanOrEqual(FLORA_KEEP.path - 1e-6);
      for (const pl of PLACES) expect(distance(p, pl.center)).toBeGreaterThanOrEqual(FLORA_KEEP.place);
      const port = PORT.toLocal(p);
      expect(port.x > -9 && port.x < 43 && port.z > -15 && port.z < 26).toBe(false);
      if (it.kind === 'pin' || it.kind === 'palmier') {
        expect(pathDistance(p)).toBeGreaterThanOrEqual(FLORA_KEEP.pathTall - 1e-6);
        // Au nord, à moins de 7,5 unités, aucun chemin : la caméra, au sud de Kéo, ne voit pas l'arbre devant lui.
        for (let k = 1.5; k <= FLORA_KEEP.camera; k += 1.5) expect(pathDistance({ x: p.x, z: p.z - k })).toBeGreaterThanOrEqual(1.8 - 0.3);
      }
    }
  });
});

describe('Les tuiles entières', () => {
  it('le compte sans rien construire est celui des facettes, de près et de loin', () => {
    const near = landTileCounts(field, 'near');
    const far = landTileCounts(field, 'far');
    for (const [tx, tz] of [
      [3, 3],
      [6, 4],
      [8, 8],
      [4, 9],
    ] as const) {
      const i = tz * TERRAIN.tilesX + tx;
      if (tx >= TERRAIN.tilesX || tz >= TERRAIN.tilesZ) continue;
      expect(landTileFacets(field, tx, tz, 'near').triangles).toBe(near[i]);
      expect(landTileFacets(field, tx, tz, 'far').triangles).toBe(far[i]);
    }
  });

  it('l’écume regarde le ciel, à plat sur l’eau, en bandes au rivage', () => {
    let foam = 0;
    for (let tz = 0; tz < TERRAIN.tilesZ; tz++)
      for (let tx = 0; tx < TERRAIN.tilesX; tx++) {
        const f = landTileFacets(field, tx, tz, 'near');
        for (let k = 0; k < f.colors.length; k += 9) {
          if (sameColor(f, k, FOAM.color)) {
            foam++;
            expect(f.normals[k + 1]).toBeGreaterThan(0.99);
            for (let v = 0; v < 3; v++) expect(f.positions[k + 3 * v + 1]).toBeCloseTo(FOAM.lift, 6);
          }
        }
      }
    expect(foam).toBeGreaterThan(1000);
  });

  it('une ombre est plus sombre que son sol, et plus froide, jamais noire', () => {
    for (const ground of [0x8ad59c, 0x438b82, 0xe8cf9c, 0x968e83]) {
      const s = shadowColor(ground);
      const [r, g, b] = [(s >> 16) & 255, (s >> 8) & 255, s & 255];
      expect(r).toBeLessThan((ground >> 16) & 255);
      expect(Math.max(r, g, b)).toBeGreaterThan(50);
      expect(b / Math.max(1, r)).toBeGreaterThanOrEqual((ground & 255) / Math.max(1, (ground >> 16) & 255));
    }
    expect(SHADOW.lift).toBeGreaterThan(0);
  });

  it('les palmes regardent le ciel (elles se voient d’en haut)', () => {
    const f = landTileFacets(field, 6, 6, 'near');
    for (let k = 0; k < f.colors.length; k += 9) if (sameColor(f, k, FLORA_COLORS.palm)) expect(f.normals[k + 1]).toBeGreaterThan(0);
  });
});
