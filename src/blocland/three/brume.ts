// La brume de la scène 3D : le brouillard de profondeur (couleur d'horizon, qui suit le jour ; aucun sur la Carte, vue
// de très haut), et les nappes translucides sous les sommets des Îles du Ciel, qui respirent lentement.
import * as THREE from 'three';
import { AMBIENCE, palette } from '../world/daylight';
import { cielDe } from '../world/palette';
import { mistPatches } from '../world/terrain';
import type { Lumiere } from './lumiere';
import { mistTexture } from './maillage';
import type { Instant, Monde, PartieDeLaScene } from './partie';

export function creerBrume(monde: Monde, lumiere: Lumiere, instant: Instant): PartieDeLaScene {
  const { scene, archipel, archipeo, largeur } = monde;
  const ambience = AMBIENCE[archipel];
  const ciel = cielDe(archipel, 1);
  const fog = archipeo
    ? new THREE.Fog(ciel.horizon, ciel.brumeProche, ciel.brumeLoin)
    : new THREE.Fog(palette(1, archipel).sky, largeur * ambience.fog[0], largeur * ambience.fog[1]);
  scene.fog = fog;
  // Sa couleur : celle de l'horizon (Archipéo), ou du ciel.
  lumiere.suivre((jour) => fog.color.setHex(archipeo ? cielDe(archipel, jour).horizon : palette(jour, archipel).sky));

  // La brume des sommets : une nappe translucide sous chaque île la plus haute (seulement sous les Îles du Ciel).
  const mistMat = new THREE.MeshBasicMaterial({ map: mistTexture(), transparent: true, opacity: 0.55, depthWrite: false });
  const mists: THREE.Mesh[] = [];
  for (const m of mistPatches(archipel)) {
    const mist = new THREE.Mesh(new THREE.PlaneGeometry(m.w, m.h), mistMat);
    mist.rotation.x = -Math.PI / 2;
    mist.position.set(m.x, m.z, m.y);
    scene.add(mist);
    mists.push(mist);
  }

  return {
    animer: (t, _dt, reduit) => {
      // Sur la Carte, vue de très haut : pas de brume, tout le continent net. Archipéo : la brume de profondeur.
      fog.near = instant.carte ? largeur * 8 : archipeo ? ciel.brumeProche : largeur * 1.2;
      fog.far = instant.carte ? largeur * 16 : archipeo ? ciel.brumeLoin : largeur * 3;
      if (!reduit) for (const [i, mist] of mists.entries()) mist.position.y += Math.sin(t * 0.4 + i) * 0.002;
    },
    dispose: () => {
      for (const mist of mists) mist.geometry.dispose();
      mistMat.map?.dispose();
      mistMat.dispose();
    },
  };
}
