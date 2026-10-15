// La Carte des lieux ouverts du monde continu (piste 1, lot 3) : l'île entière à l'ouverture, glisser et pincer dans
// leurs limites, la pose de la caméra (nord en haut). Sans Three.js.
import { describe, expect, it } from 'vitest';
import { screenOf } from './camera';
import { ISLAND_BOX, MAP_CAMERA, clampMap, fitDistance, mapPose, mapStart, panMap, zoomMap } from './map';
import { PLACES } from './plan6e';

const screens = [
  [1024, 768],
  [768, 1024],
  [844, 390],
  [667, 375],
] as const;

describe('La Carte des lieux ouverts', () => {
  it('s’ouvre sur l’île entière : les quatre lieux et les bords de l’île à l’écran, nord en haut', () => {
    for (const [w, h] of screens) {
      const pose = mapPose(mapStart(w / h));
      const at = `${w}×${h}`;
      for (const p of PLACES) {
        const s = screenOf(pose, { x: p.center.x, y: 0, z: p.center.z }, w, h);
        expect(s.x, at).toBeGreaterThan(0);
        expect(s.x, at).toBeLessThan(w);
        expect(s.y, at).toBeGreaterThan(0);
        expect(s.y, at).toBeLessThan(h);
      }
      const { minX, maxX, minZ, maxZ } = ISLAND_BOX;
      const cx = (minX + maxX) / 2;
      const cz = (minZ + maxZ) / 2;
      const west = screenOf(pose, { x: minX, y: 0, z: cz }, w, h);
      const east = screenOf(pose, { x: maxX, y: 0, z: cz }, w, h);
      const north = screenOf(pose, { x: cx, y: 0, z: minZ }, w, h);
      const south = screenOf(pose, { x: cx, y: 0, z: maxZ }, w, h);
      expect(west.x, at).toBeGreaterThanOrEqual(-1);
      expect(east.x, at).toBeLessThanOrEqual(w + 1);
      expect(north.y, at).toBeGreaterThanOrEqual(-1);
      expect(south.y, at).toBeLessThanOrEqual(h + 1);
      // Le nord en haut de l'écran.
      expect(north.y).toBeLessThan(south.y);
      expect(west.x).toBeLessThan(east.x);
    }
  });

  it('se pince entre la plus proche et l’île entière, autour du point sous les doigts', () => {
    const aspect = 1024 / 768;
    const start = mapStart(aspect);
    const toward = PLACES[0].center;
    const near = zoomMap(start, 2, toward, aspect);
    expect(near.distance).toBeCloseTo(start.distance / 2, 6);
    // Le point sous les doigts se rapproche du milieu, à la même part.
    expect(near.x - toward.x).toBeCloseTo((start.x - toward.x) / 2, 6);
    expect(zoomMap(start, 1000, toward, aspect).distance).toBe(MAP_CAMERA.closest);
    expect(zoomMap(start, 0.001, toward, aspect).distance).toBeCloseTo(fitDistance(aspect), 6);
  });

  it('se glisse sans quitter l’île', () => {
    const aspect = 844 / 390;
    const start = mapStart(aspect);
    const moved = panMap(start, 10, -5, aspect);
    expect(moved.x).toBeCloseTo(start.x + 10, 6);
    expect(moved.z).toBeCloseTo(start.z - 5, 6);
    const far = panMap(start, 1e4, -1e4, aspect);
    expect(far.x).toBe(ISLAND_BOX.maxX);
    expect(far.z).toBe(ISLAND_BOX.minZ);
    expect(clampMap(far, aspect)).toEqual(far);
  });
});
