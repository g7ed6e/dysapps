// La lumière de la scène 3D : le ciel (fond, dôme d'Archipéo), la lumière d'ambiance et le soleil, qui suivent l'heure
// réelle, ajustés chaque minute (figés avec « Réduire les animations »). Les autres parties suivent le jour (la brume,
// l'eau, la faune) ; `nuit()` dit le degré de nuit (les fenêtres qui s'allument, lot R5).
import * as THREE from 'three';
import { daylight, palette } from '../world/daylight';
import { cielDe, SOLEIL_DIRECTION } from '../world/palette';
import { creerDome } from './sky';
import type { Derniers, Monde, PartieDeLaScene } from './scenePart';

export interface Lumiere extends PartieDeLaScene {
  /** Le degré de nuit : 0 en plein jour, 1 au cœur de la nuit. */
  nuit(): number;
  /** `f` est appelée à chaque changement de lumière, avec le degré de jour (0 à 1). */
  suivre(f: (jour: number) => void): void;
  /** La lumière de l'heure, tout de suite, puis chaque minute (sauf avec « Réduire les animations »). */
  allumer(reduit: boolean): void;
}

export function creerLumiere(monde: Monde, camera: THREE.Camera, derniers: { readonly current: Derniers }): Lumiere {
  const { scene, archipel, largeur } = monde;
  const degrade = monde.habillage.ciel === 'degrade';
  const day = palette(1, archipel);
  // Archipéo (lot R1) : un dôme dégradé, un soleil chaud et une ambiance froide.
  const ciel = cielDe(archipel, 1);
  scene.background = new THREE.Color(degrade ? ciel.horizon : day.sky);
  const dome = degrade ? creerDome(ciel, largeur * 4) : null;
  if (dome) scene.add(dome.mesh);
  const hemi = degrade ? new THREE.HemisphereLight(ciel.ambianceCiel, ciel.ambianceSol, ciel.ambianceForce) : new THREE.HemisphereLight(0xffffff, day.ground, day.ambient);
  scene.add(hemi);
  const sun = degrade ? new THREE.DirectionalLight(ciel.soleil, ciel.soleilForce) : new THREE.DirectionalLight(day.sun, day.sunIntensity);
  if (degrade) sun.position.set(...SOLEIL_DIRECTION);
  else sun.position.set(40, 60, 20);
  scene.add(sun);

  const suivants: ((jour: number) => void)[] = [];
  let light = -1;
  let dayTimer = 0;
  const appliquer = () => {
    const target = derniers.current.forceDay ? 1 : daylight().light;
    if (target === light) return;
    light = target;
    if (degrade) {
      // Le ciel et la lumière suivent le jour.
      const c = cielDe(archipel, light);
      (scene.background as THREE.Color).setHex(c.horizon);
      dome?.peindre(c);
      hemi.color.setHex(c.ambianceCiel);
      hemi.groundColor.setHex(c.ambianceSol);
      hemi.intensity = c.ambianceForce;
      sun.color.setHex(c.soleil);
      sun.intensity = c.soleilForce;
    } else {
      const p = palette(light, archipel);
      (scene.background as THREE.Color).setHex(p.sky);
      hemi.intensity = p.ambient;
      sun.color.setHex(p.sun);
      sun.intensity = p.sunIntensity;
    }
    for (const f of suivants) f(light);
  };

  return {
    nuit: () => 1 - light,
    suivre: (f) => {
      suivants.push(f);
    },
    allumer: (reduit) => {
      appliquer();
      dayTimer = reduit ? 0 : window.setInterval(appliquer, 60_000);
    },
    animer: () => {
      if (derniers.current.forceDay ? light !== 1 : false) appliquer();
      // Le dôme du ciel suit la caméra : l'horizon ne s'approche jamais.
      dome?.mesh.position.copy(camera.position);
    },
    dispose: () => {
      if (dayTimer) window.clearInterval(dayTimer);
      dome?.dispose();
    },
  };
}
