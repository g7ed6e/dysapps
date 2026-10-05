import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { cadrageSerre, coinsDesCubes } from './tightFraming';

/** Les points projetés par une vraie caméra Three.js posée là où le cadrage le dit. */
function projection(points: Float64Array, direction: [number, number, number], fov: number, aspect: number, marge: number) {
  const { cible, distance } = cadrageSerre(points, direction, fov, aspect, marge);
  const camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 500);
  const visee = new THREE.Vector3(...cible);
  camera.position.copy(visee).addScaledVector(new THREE.Vector3(...direction).normalize(), distance);
  camera.lookAt(visee);
  camera.updateMatrixWorld();
  const out: THREE.Vector3[] = [];
  for (let i = 0; i < points.length; i += 3) out.push(new THREE.Vector3(points[i], points[i + 1], points[i + 2]).project(camera));
  return out;
}

/** Une silhouette de Gardien : un corps large, une tête étroite, des pieds écartés. */
const gardien: [number, number, number][] = [];
for (let y = 0; y < 10; y++) for (let x = 0; x < 9; x++) for (let z = 0; z < 4; z++) if (y < 7 ? x > 0 && x < 8 : x > 2 && x < 6) gardien.push([x, y, z]);

describe('cadrageSerre', () => {
  const cas: [string, [number, number, number], number][] = [
    ['de trois quarts, vitrine carrée', [0.55, 0.35, -0.85], 1],
    ['de l’autre côté, en plongée', [-0.55, 0.6, -0.85], 1],
    ['dans une vitrine large', [0.55, 0.35, -0.85], 3],
  ];
  it.each(cas)('%s : tout tient dans le cadre, qui est rempli', (_, direction, aspect) => {
    const marge = 0.06;
    const points = coinsDesCubes(gardien, [4.5, 5, 2]);
    const projetes = projection(points, direction, 38, aspect, marge);
    for (const p of projetes) {
      expect(Math.abs(p.x)).toBeLessThanOrEqual(1 - marge + 1e-6);
      expect(Math.abs(p.y)).toBeLessThanOrEqual(1 - marge + 1e-6);
    }
    // Serré sur un axe au moins : du bord au bord, à la marge près, et centré.
    const xs = projetes.map((p) => p.x);
    const ys = projetes.map((p) => p.y);
    const ecart = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
    expect(ecart).toBeCloseTo(2 * (1 - marge), 4);
  });

  it('sur un Gardien plus haut que large, la hauteur est remplie', () => {
    const points = coinsDesCubes(gardien, [4.5, 5, 2]);
    const ys = projection(points, [0.55, 0.35, -0.85], 38, 1, 0.06).map((p) => p.y);
    expect(Math.max(...ys)).toBeCloseTo(0.94, 4);
    expect(Math.min(...ys)).toBeCloseTo(-0.94, 4);
  });
});
