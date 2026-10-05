// Le ciel d'Archipéo en 3D (lot R1, dans l’univers Archipéo (voir rendu.ts)) : un dôme dégradé du zénith à l'horizon, tiré de
// world/palette.ts. Un seul maillage, un seul appel de dessin, dessiné en premier derrière tout le reste (ni test ni
// écriture de profondeur), sans brume : il suit la caméra, l'horizon reste toujours à la même place.
import * as THREE from 'three';
import { domeDuCiel, type Ciel } from '../world/palette';

export interface Dome {
  mesh: THREE.Mesh;
  /** Repeint le dégradé (jour, nuit), sans refaire la géométrie. */
  peindre(c: Ciel): void;
  dispose(): void;
}

/** Les couleurs du dôme, de sRGB (la palette) vers l'espace de travail de Three.js. */
function couleurs(c: Ciel, out: Float32Array) {
  const { colors } = domeDuCiel(c);
  const tmp = new THREE.Color();
  for (let i = 0; i < colors.length; i += 3) {
    tmp.setRGB(colors[i], colors[i + 1], colors[i + 2], THREE.SRGBColorSpace);
    out[i] = tmp.r;
    out[i + 1] = tmp.g;
    out[i + 2] = tmp.b;
  }
}

export function creerDome(c: Ciel, rayon: number): Dome {
  const d = domeDuCiel(c);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(d.positions.map((v) => v * rayon), 3));
  const color = new THREE.Float32BufferAttribute(new Float32Array(d.colors.length), 3);
  couleurs(c, color.array as Float32Array);
  geo.setAttribute('color', color);
  geo.setIndex(d.indices);
  const material = new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, depthTest: false, depthWrite: false });
  const mesh = new THREE.Mesh(geo, material);
  mesh.renderOrder = -1000;
  mesh.frustumCulled = false;
  mesh.raycast = () => {};
  return {
    mesh,
    peindre(next) {
      couleurs(next, color.array as Float32Array);
      color.needsUpdate = true;
    },
    dispose() {
      geo.dispose();
      material.dispose();
    },
  };
}
