// Les habitants hors de leur scénette, aux quatre niveaux : chacun se tient près de son lieu, à côté de sa porte, sur le
// sol, avec ses pastilles au-dessus de lui (three/archipeo/scene.ts). Choix du mainteneur du 23 octobre 2026 : « les
// habitants de chaque lieu présents dans les scénettes et dans le monde ouvert sous forme de modèle 3D », uniforme aux
// quatre niveaux (au 5e d'abord, le 21 octobre, « Garder au 5e », en pions dessinés en code). Hors de la scénette, c'est
// la version de loin de son modèle (`habitant-loin.glb`, 1 500 triangles au plus, à côté de `habitant.glb`, ./habitants.ts), à la
// taille qu'il a à côté de Kéo dans la scénette (un adulte, pas un enfant) ; la vue les charge et les dessine
// (three/archipeo/worldHabitantModels.ts). Code pur, sans Three.js.
//
// Chaque place est choisie à côté de la porte, du côté où elle ne cache ni le chemin ni le cœur du lieu dans le regard
// d'arrivée de « Y aller », entier, hors de la bande de la bulle et du bouton : sur le sol (ni sur un chemin, avec une
// marge, ni sur l'eau, ni dans le lieu ni sur sa scène), vérifiée par ./worldHabitants.test.ts. Le décor des lieux n'en
// est pas changé. À la Gare maritime et au Fanal, que l'eau et la pente serrent, l'habitant se tient à sa place de la
// scénette.
import { KEO_WORLD_SCALE } from './camera';
import { doorOf } from './construction';
import type { Vec3 } from './geometry';
import { HABITANT_HEIGHT, habitantFit } from './habitants';
import { hasScenette, placeById, type PlaceId, type ScenePlaceId } from './levelPlan';
import { doorViewOf } from './northShore';
import { scenetteHabitant, scenetteKeo } from './scenette';

/**
 * La place d'un habitant hors de sa scénette, depuis le centre de son lieu ; `lift` : de quoi poser ses pieds sur le
 * dallage du lieu qui déborde un peu sur le sol (la cour du Donjon, des Nacelles, le pavé des Terrasses). `'scenette'` :
 * à sa place de la scénette, là où se joue la remise.
 */
export type WorldHabitantSpot = { dx: number; dz: number; lift?: number } | 'scenette';

/**
 * Les places des habitants, à côté de la porte de chaque lieu, à 2 à 6 unités d'elle, dans le regard d'arrivée de « Y
 * aller », entier, hors de la bande de la bulle et de « Y aller », jamais dans l'axe de ce regard vers le cœur du lieu.
 * Celles du 6e, du 4e et du 3e cherchées sur une grille autour de la porte (23 octobre 2026), avec les règles du test ;
 * celles du 5e, à la main (21 octobre 2026).
 */
export const WORLD_HABITANT_SPOTS: Readonly<Partial<Record<PlaceId, WorldHabitantSpot>>> = {
  // Le 6e.
  phare: { dx: -3.2, dz: 6.4 },
  quais: { dx: 2.2, dz: -1.3 },
  filets: { dx: -5.2, dz: 4.5 },
  // Sur le palier des Écluses, à l'ouest de la porte, hors du chemin qui monte.
  ecluses: { dx: -3.5, dz: 1.1 },
  saltworks: { dx: 2.3, dz: 7.4 },
  engine: { dx: 2.3, dz: 7.6 },
  shipyard: { dx: -1.6, dz: 7.5 },
  lookout: { dx: 3, dz: 7.6 },
  archives: { dx: -3.3, dz: 6.4 },
  printworks: { dx: -3.1, dz: 6.5 },
  mangrove: { dx: 3.2, dz: 7.2 },
  ruins: { dx: 3.2, dz: 7.3 },
  observatory: { dx: -3.3, dz: 7.6 },
  commons: { dx: 3.4, dz: 8.4 },
  beacons: { dx: -9.4, dz: 7.1 },
  // Au large, sur le quai de la Gare maritime : la mer tout autour de la porte.
  ferry: 'scenette',
  // Le 5e. À l'ouest du bout du ponton, sur la berge, hors du bassin et de la scène, à une demi-unité du chemin au moins.
  montee: { dx: -4.5, dz: 16 },
  // Au sud-est de la porte du quai, sur la berge, entre le chemin et l'eau.
  radeaux: { dx: 6.5, dz: -2 },
  // À l'ouest de la porte, sur le sol de la forêt, hors du couloir de la caméra.
  croisee: { dx: -2.5, dz: 9 },
  // Au bord de la chaussée, du côté du marais ouvert.
  instants: { dx: 1, dz: 10.5 },
  // À l'ouest de la porte, devant le muret de la cour, à gauche de la bulle du regard d'arrivée (qui le coupait).
  semaphore: { dx: -3, dz: 8 },
  // Devant la cour, à l'est de la porte, hors de l'axe de la maison.
  gaillard: { dx: -0.5, dz: 9 },
  // À l'est de la porte, devant le logis, à droite de la bulle du regard d'arrivée : à l'ouest, au pied de l'escalier,
  // la bulle et « Y aller » le coupaient (le sol de la cour y est dans leur bande, sous le regard levé vers la tour).
  donjon: { dx: 5, dz: 9.5 },
  // Au pied du tertre, à l'ouest de la porte.
  terrasses: { dx: -1, dz: 7, lift: 0.09 },
  // À l'est de la porte, sur la roche, loin des bouches.
  fumerolles: { dx: 4.5, dz: 6.5 },
  // À l'est de la porte, devant le pavé.
  etuve: { dx: 2.5, dz: 8 },
  // Sur le bord de la cour, à l'ouest de la porte.
  nacelles: { dx: -2.5, dz: 8.5, lift: 0.08 },
  // À l'est de la porte du ponton, sur la berge, franchement hors du chemin clair (plus d'une unité de marge).
  hameau: { dx: 4, dz: 10.5 },
  // À l'est de la porte, devant le parvis.
  auberge: { dx: 2.5, dz: 8 },
  // Devant le parvis, à l'ouest de la porte, hors de l'axe de la bouche.
  oracle: { dx: 0, dz: 8 },
  // Le 4e.
  forge: { dx: 4.1, dz: 13.7 },
  // Au pied de la Soute, à l'est de la porte, que les chemins serrent.
  soute: { dx: 1.4, dz: 5.1 },
  porte: { dx: 4.5, dz: 5.9 },
  etalon: { dx: -0.5, dz: 11.1 },
  gabarit: { dx: -3.2, dz: 18.6 },
  manufacture: { dx: 2.9, dz: 9.4 },
  loge: { dx: -3.1, dz: -8.8 },
  chariot: { dx: 0.7, dz: 9.3 },
  herbier: { dx: 3.7, dz: -8.3 },
  roches: { dx: 8.6, dz: 1.2 },
  jonction: { dx: 1.2, dz: -8.6 },
  veillee: { dx: 8.1, dz: 2.5 },
  basilique: { dx: 8, dz: 3.3 },
  terminus: { dx: 10.5, dz: 0.5 },
  orgues: { dx: -3.3, dz: 8 },
  dynamo: { dx: 3.2, dz: 7.7 },
  // Le 3e.
  belvedere: { dx: 9.9, dz: 2.8 },
  grenier: { dx: -9, dz: 4.9 },
  abri: { dx: -3.4, dz: 11.2 },
  jardin: { dx: 1.6, dz: 8.1 },
  // Sur la pente sous le phare, trop raide autour de la porte : à sa place de la scénette.
  fanal: 'scenette',
  rampe: { dx: 5.8, dz: -2.8 },
  standard: { dx: 9.1, dz: 0.9 },
  kiosque: { dx: 5.4, dz: 7.7 },
  maquette: { dx: 4.9, dz: -12.8 },
  tribune: { dx: -12.5, dz: 6.3 },
  douane: { dx: 3.7, dz: 12.4 },
  ermitage: { dx: 8.8, dz: -7.9 },
  coupole: { dx: 9.8, dz: 9 },
  lutherie: { dx: 8.5, dz: 1.8 },
  ondes: { dx: 8.9, dz: -2.3 },
  palais: { dx: 4.8, dz: 12.1 },
};

/** Les triangles de la version de loin d'un habitant, au plus (choix du mainteneur, 23 octobre 2026, « 1 500 triangles » ; un test les relit). */
export const WORLD_HABITANT_TRIANGLES = 1_500;

/** Le lieu a-t-il un habitant qui se tient près de lui hors de sa scénette ? Chaque lieu qui a sa scénette (un lieu fini). */
export const hasWorldHabitant = (place: PlaceId): place is ScenePlaceId => Object.hasOwn(WORLD_HABITANT_SPOTS, place) && hasScenette(place);

/** Où se tient l'habitant d'un lieu hors de sa scénette (ses pieds), ou rien. */
export function worldHabitantAt(place: PlaceId, ground: (x: number, z: number) => number): Vec3 | null {
  if (!hasWorldHabitant(place)) return null;
  const s = WORLD_HABITANT_SPOTS[place]!;
  if (s === 'scenette') return scenetteHabitant(place);
  const c = placeById(place).center;
  const x = c.x + s.dx;
  const z = c.z + s.dz;
  return { x, y: ground(x, z) + (s.lift ?? 0), z };
}

/**
 * Le cap de l'habitant (le visage vers +z au cap nul) : tourné vers celui qui arrive par « Y aller », un point à cinq
 * unités de la porte, du côté de la caméra d'arrivée (`doorView`, le nord par défaut : la caméra au sud).
 */
export function worldHabitantYaw(place: ScenePlaceId): number {
  const at = worldHabitantAt(place, () => 0)!;
  const door = doorOf(place);
  const view = doorViewOf(place);
  const t = { x: door.x + 5 * Math.sin(view), z: door.z + 5 * Math.cos(view) };
  return Math.atan2(t.x - at.x, t.z - at.z);
}

/**
 * L'échelle de l'habitant hors de la scénette : le rapport de sa taille à celle de Kéo y reste celui de la scénette (Kéo
 * à `scenetteKeo(place).scale` à côté de l'habitant à l'échelle 1 ; dans le monde ouvert, Kéo à `KEO_WORLD_SCALE`),
 * environ 2,1 (directeur artistique, relecture des habitants du 5e : à 1, il paraissait un enfant à côté du héros).
 */
export const worldHabitantScale = (place: ScenePlaceId): number => KEO_WORLD_SCALE / scenetteKeo(place).scale;

/** La hauteur de l'habitant hors de la scénette, ses pieds à sa tête (pour poser ses pastilles au-dessus de lui). */
export const worldHabitantHeight = (place: ScenePlaceId): number => HABITANT_HEIGHT * worldHabitantScale(place);

/**
 * Les sommets de la version de loin d'un habitant (ceux de son fichier, trois nombres chacun) mis à sa place près de sa
 * porte : ses pieds en `worldHabitantAt`, à l'échelle du monde, tourné vers qui arrive ; ou rien. Un nouveau tableau.
 */
export function placeWorldHabitant(place: PlaceId, positions: Float32Array, ground: (x: number, z: number) => number): Float32Array | null {
  const at = worldHabitantAt(place, ground);
  if (!at || !hasWorldHabitant(place)) return null;
  const fit = habitantFit(positions);
  const k = fit.scale * worldHabitantScale(place);
  const yaw = worldHabitantYaw(place) + fit.yaw;
  const [c, s] = [Math.cos(yaw), Math.sin(yaw)];
  const out = new Float32Array(positions.length);
  for (let i = 0; i < positions.length; i += 3) {
    const x = (positions[i] - fit.center.x) * k;
    const z = (positions[i + 2] - fit.center.z) * k;
    out[i] = at.x + x * c + z * s;
    out[i + 1] = at.y + (positions[i + 1] - fit.center.y) * k;
    out[i + 2] = at.z - x * s + z * c;
  }
  return out;
}
