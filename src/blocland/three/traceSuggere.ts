// Sur la Carte, le tracé renforcé de l'ouvrage que désigne la flèche (GD-7, world/traceSuggere.ts) : un seul maillage,
// un appel de dessin, des tirets immobiles (rien à couper avec « Réduire les animations »). Sans lumière (la nuit ne
// l'éteint pas) ni brume (la Carte voit de loin) : il se lit comme la flèche qu'il accompagne.
import * as THREE from 'three';
import { formeDuTrace, TIRET_SUGGERE } from '../world/traceSuggere';
import type { Cell } from '../world/paths';

export interface TraceSuggere {
  mesh: THREE.Mesh;
  /** Pose le tracé d'une liaison (ses cases, de bout en bout), ou l'enlève (`null`) ; refait seulement s'il change. */
  poser(trace: readonly Cell[] | null): void;
  /** Un tracé est posé. */
  pose(): boolean;
  /** Triangles dessinés (pour les mesures). */
  triangles(): number;
  dispose(): void;
}

export function creerTraceSuggere(): TraceSuggere {
  const material = new THREE.MeshBasicMaterial({ vertexColors: true, fog: false });
  const mesh = new THREE.Mesh(new THREE.BufferGeometry(), material);
  mesh.visible = false;
  mesh.frustumCulled = false;
  mesh.raycast = () => {};
  mesh.name = 'trace-suggere';
  const couleurs = [new THREE.Color(TIRET_SUGGERE.lisere.couleur), new THREE.Color(TIRET_SUGGERE.coeur.couleur)];
  let cle = '';
  let triangles = 0;
  return {
    mesh,
    poser(trace) {
      const k = trace?.length ? `${trace.length}:${trace[0].x},${trace[0].y}:${trace[trace.length - 1].x},${trace[trace.length - 1].y}` : '';
      if (k === cle) return;
      cle = k;
      mesh.geometry.dispose();
      const geo = new THREE.BufferGeometry();
      triangles = 0;
      if (trace?.length) {
        const f = formeDuTrace(trace);
        const color = new Float32Array(f.parties.length * 3);
        f.parties.forEach((p, i) => couleurs[p].toArray(color, i * 3));
        geo.setAttribute('position', new THREE.BufferAttribute(f.positions, 3));
        geo.setAttribute('normal', new THREE.BufferAttribute(f.normals, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(color, 3));
        triangles = f.triangles;
      }
      mesh.geometry = geo;
    },
    pose: () => triangles > 0,
    triangles: () => triangles,
    dispose() {
      mesh.geometry.dispose();
      material.dispose();
    },
  };
}
