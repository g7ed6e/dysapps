// La brume de la scène 3D : le brouillard de profondeur (couleur d'horizon, qui suit le jour ; aucun sur la Carte, vue
// de très haut), les nappes translucides sous les sommets des Îles du Ciel, qui respirent lentement, et dans Archipéo
// les bancs de brume des Îles Brumeuses sur la mer libre (R4b-5e) ou les nappes des sommets des Îles du Ciel en une
// seule couche (R4b-3e), tous deux de world/decor/brume.ts, en un appel de dessin, qui respirent selon la règle commune,
// à moitié sur la Carte, figés quand l'appareil demande moins d'animations (`reduit`).
import * as THREE from 'three';
import { AMBIENCE, mixColor, palette } from '../world/daylight';
import { brumeDArchipeo } from '../world/decor/brume';
import { respirationDeLaBrume } from '../world/decor/fumee';
import { cielDe } from '../world/palette';
import { mistPatches } from '../world/terrain';
import type { Lumiere } from './lumiere';
import { mistTexture } from './maillage';
import type { Instant, Monde, PartieDeLaScene } from './partie';

/** Les bancs de brume la nuit : leur couleur multipliée par ce bleu (jamais plus clairs que la lueur d'horizon). */
const NUIT_DES_BANCS = 0x5d7196;

export function creerBrume(monde: Monde, lumiere: Lumiere, instant: Instant): PartieDeLaScene {
  const { scene, archipel, largeur } = monde;
  const fiche = monde.habillage.brume === 'bancs';
  const ambience = AMBIENCE[archipel];
  const ciel = cielDe(archipel, 1);
  const fog = fiche
    ? new THREE.Fog(ciel.horizon, ciel.brumeProche, ciel.brumeLoin)
    : new THREE.Fog(palette(1, archipel).sky, largeur * ambience.fog[0], largeur * ambience.fog[1]);
  scene.fog = fog;
  // Sa couleur : celle de l'horizon (Archipéo), ou du ciel.
  lumiere.suivre((jour) => fog.color.setHex(fiche ? cielDe(archipel, jour).horizon : palette(jour, archipel).sky));

  // La brume des sommets : une nappe translucide sous chaque île la plus haute (seulement sous les Îles du Ciel), dans
  // le monde en blocs ; Archipéo les dessine en un seul maillage, avec les bancs.
  const mistMat = fiche ? null : new THREE.MeshBasicMaterial({ map: mistTexture(), transparent: true, opacity: 0.55, depthWrite: false });
  const mists: THREE.Mesh[] = [];
  if (mistMat) for (const m of mistPatches(archipel)) {
    const mist = new THREE.Mesh(new THREE.PlaneGeometry(m.w, m.h), mistMat);
    mist.rotation.x = -Math.PI / 2;
    mist.position.set(m.x, m.z, m.y);
    scene.add(mist);
    mists.push(mist);
  }
  // La nuit, les nappes prennent la couleur du plancher de nuit (l'eau de nuit de l'archipel), comme les bancs d'Archipéo
  // s'assombrissent : jamais une auréole blanche sur le plancher de nuit (DA-35). Le jour, blanches comme avant.
  if (mistMat) lumiere.suivre((jour) => mistMat.color.setHex(mixColor(ambience.waterNight, 0xffffff, Math.min(1, Math.max(0, jour)))));

  // Les bancs de brume (Archipéo, 5e) ou les nappes des sommets (3e) : sans lumière ; la nuit les assombrit vers le bleu
  // de crépuscule.
  const bancs = fiche ? brumeDArchipeo(archipel) : null;
  let banc: THREE.Mesh | null = null;
  const bancMat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, fog: false });
  if (bancs) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(bancs.positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(bancs.colors, 4));
    geo.setIndex(new THREE.BufferAttribute(bancs.indices, 1));
    geo.computeBoundingSphere();
    banc = new THREE.Mesh(geo, bancMat);
    // Un seul maillage pour tout l'archipel ; il ne se touche pas (le toucher va à la mer ou à l'île dessous).
    banc.frustumCulled = false;
    banc.raycast = () => {};
    // Après les autres transparents : la brume passe devant la mer, jamais devant les îles (elle est plus basse).
    banc.renderOrder = 1;
    scene.add(banc);
    lumiere.suivre((jour) => bancMat.color.setHex(mixColor(NUIT_DES_BANCS, 0xffffff, Math.min(1, Math.max(0, jour)))));
  }

  return {
    animer: (t, _dt, reduit) => {
      if (banc) {
        const r = respirationDeLaBrume(0, t, reduit);
        banc.position.set(r.dx, r.dy, 0);
        bancMat.opacity = (instant.carte ? 0.5 : 1) * r.opacite;
      }
      // Sur la Carte, vue de très haut : pas de brume, tout le continent net. Archipéo : la brume de profondeur.
      fog.near = instant.carte ? largeur * 8 : fiche ? ciel.brumeProche : largeur * 1.2;
      fog.far = instant.carte ? largeur * 16 : fiche ? ciel.brumeLoin : largeur * 3;
      if (!reduit) for (const [i, mist] of mists.entries()) mist.position.y += Math.sin(t * 0.4 + i) * 0.002;
    },
    dispose: () => {
      for (const mist of mists) mist.geometry.dispose();
      if (banc) {
        scene.remove(banc);
        banc.geometry.dispose();
      }
      bancMat.dispose();
      mistMat?.map?.dispose();
      mistMat?.dispose();
    },
  };
}
