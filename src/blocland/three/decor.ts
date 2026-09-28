// Le décor d'Archipéo en 3D (lot R4, derrière `?rendu=archipeo`) : les primitives de world/decorMesh.ts, fusionnées en
// un seul maillage à couleurs par sommet (un second, sans lumière, pour ce qui brille : lanternes, lave). Les matériaux
// sont faits une fois par scène et libérés avec elle ; les géométries, à chaque nouveau décor.
import * as THREE from 'three';
import type { FacettesDuDecor, MaillageDuDecor } from '../world/decorMesh';

export interface DecorEn3D {
  /** Les maillages du décor, à ajouter à la scène ; `userData.decor` les distingue pour le toucher. */
  group: THREE.Group;
  /** Remplace le décor. */
  peindre(m: MaillageDuDecor): void;
  /** Le décor dessiné, pour retrouver la case d'un triangle touché. */
  maillage: MaillageDuDecor | null;
  dispose(): void;
}

export function creerDecor(): DecorEn3D {
  const group = new THREE.Group();
  const mat = new THREE.MeshLambertMaterial({ vertexColors: true });
  const brille = new THREE.MeshBasicMaterial({ vertexColors: true });
  const vider = () => {
    for (const child of [...group.children]) {
      group.remove(child);
      (child as THREE.Mesh).geometry.dispose();
    }
  };
  const ajouter = (f: FacettesDuDecor, material: THREE.Material, lueur: boolean) => {
    if (!f.elements.length) return;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(f.positions, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(f.normals, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(f.colors, 3));
    geo.computeBoundingSphere();
    const mesh = new THREE.Mesh(geo, material);
    mesh.userData = { decor: true, lueur };
    // Un seul maillage pour tout l'archipel : le tri par la vue ne ferait rien gagner.
    mesh.frustumCulled = false;
    group.add(mesh);
  };
  const d: DecorEn3D = {
    group,
    maillage: null,
    peindre(m) {
      vider();
      ajouter(m.decor, mat, false);
      ajouter(m.lueurs, brille, true);
      d.maillage = m;
    },
    dispose() {
      vider();
      mat.dispose();
      brille.dispose();
      d.maillage = null;
    },
  };
  return d;
}
