// Sur la Carte, le tracé renforcé de l'ouvrage que désigne la flèche (GD-7, world/suggestedTrace.ts) : un seul maillage,
// un appel de dessin, des tirets immobiles (rien à couper avec « Réduire les animations »). Sans lumière (la nuit ne
// l'éteint pas) ni brume (la Carte voit de loin) : il se lit comme la flèche qu'il accompagne.
import * as THREE from 'three';
import { formeDesTirets, TIRET_SUGGERE } from '../world/suggestedTrace';
import type { Cell } from '../world/paths';

export interface TraceSuggere {
  mesh: THREE.Mesh;
  /**
   * Pose le tracé d'une liaison (ses tirets, `casesDesTirets`, calculés une fois par la vue), ou l'enlève (`null`) ;
   * refait seulement s'il change. Ses triangles (780 au plus) se comptent dans les mesures du navigateur
   * (`renderer.info`, « Dans la scène »), et leur plafond dans world/suggestedTrace.test.ts.
   */
  poser(tirets: readonly Cell[] | null): void;
  /** Un tracé est posé. */
  pose(): boolean;
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
    poser(tirets) {
      const k = tirets?.length ? `${tirets.length}:${tirets[0].x},${tirets[0].y}:${tirets[tirets.length - 1].x},${tirets[tirets.length - 1].y}` : '';
      if (k === cle) return;
      cle = k;
      mesh.geometry.dispose();
      const geo = new THREE.BufferGeometry();
      triangles = 0;
      if (tirets?.length) {
        const f = formeDesTirets(tirets);
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
    dispose() {
      mesh.geometry.dispose();
      material.dispose();
    },
  };
}
