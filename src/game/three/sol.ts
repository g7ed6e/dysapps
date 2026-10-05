// Le terrain d'Archipéo en 3D (lot R2, dans l’univers Archipéo (voir rendu.ts)) : le maillage à facettes de world/landMesh.ts, en
// un seul appel de dessin (deux s'il y a de la lave, qui brille d'elle-même). Les couleurs sont portées par les
// sommets ; les matériaux sont faits une fois par scène et libérés avec elle.
import * as THREE from 'three';
import type { Facettes, MaillageDuSol } from '../world/landMesh';

export interface SolEn3D {
  /** Les maillages du sol, à ajouter à la scène ; `userData.sol` les distingue des cubes pour le toucher. */
  group: THREE.Group;
  /** Remplace le maillage (le sol a changé de forme ou de couleur). */
  peindre(m: MaillageDuSol): void;
  dispose(): void;
}

/** La lueur de la lave (comme `GLOW` dans WorldCanvas). */
const LAVE: [number, number] = [0xff5a00, 0.6];

export function creerSol(): SolEn3D {
  const group = new THREE.Group();
  const mat = new THREE.MeshLambertMaterial({ vertexColors: true });
  const lave = new THREE.MeshLambertMaterial({ vertexColors: true, emissive: LAVE[0], emissiveIntensity: LAVE[1] });
  const vider = () => {
    for (const child of [...group.children]) {
      group.remove(child);
      (child as THREE.Mesh).geometry.dispose();
    }
  };
  const ajouter = (f: Facettes, material: THREE.Material) => {
    if (!f.colonnes.length) return;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(f.positions, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(f.normals, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(f.colors, 3));
    geo.computeBoundingSphere();
    const mesh = new THREE.Mesh(geo, material);
    mesh.userData = { sol: true };
    // Un seul maillage pour tout l'archipel : le tri par la vue ne ferait rien gagner.
    mesh.frustumCulled = false;
    group.add(mesh);
  };
  return {
    group,
    peindre(m) {
      vider();
      ajouter(m.sol, mat);
      ajouter(m.lumineux, lave);
    },
    dispose() {
      vider();
      mat.dispose();
      lave.dispose();
    },
  };
}
