// Les habitants hors de leur scénette, au 5e seulement : chacun se tient près de son lieu, à côté de sa porte, sur le sol,
// avec ses pastilles au-dessus de lui (three/archipeo/scene.ts). Choix du mainteneur du 21 octobre 2026, « Garder au
// 5e » (le 6e ne montre pas ses habitants hors de leur scénette ; il suivra plus tard, dans un lot à part). Hors de la
// scénette, c'est son pion dessiné en code (./scenette.ts, `habitantPawn`), à la taille qu'il a à côté de Kéo dans la
// scénette (un adulte, pas un enfant) : son modèle 3D reste à la scénette (une texture de 2 048 par habitant, quatorze
// à la fois ne tiendraient pas). Le 6e n'a pas cette table : ses habitants ne se montrent que dans leur scénette, et
// ses pastilles se tiennent au-dessus de la place de l'habitant dans la scénette, là où se joue la remise. Code pur,
// sans Three.js.
//
// Chaque place est choisie à côté de la porte, du côté où elle ne cache ni le chemin ni le cœur du lieu dans le regard
// d'arrivée de « Y aller », entier, hors de la bande de la bulle et du bouton : sur le sol (ni sur un chemin, avec une
// marge, ni sur l'eau, ni dans le lieu ni sur sa scène), vérifiée par ./worldHabitants.test.ts. Le décor des lieux n'en
// est pas changé.
import { KEO_WORLD_SCALE } from './camera';
import { placeFacets, type Facets } from './facets';
import type { Vec3 } from './geometry';
import { placeById, type PlaceId } from './levelPlan';
import { placeArt } from './northShore';
import { NETWORK_5E } from './paths5e';
import { isBuiltPlace5e, type PlaceId5e } from './plan5e';
import { habitantPawn, scenetteKeo } from './scenette';

/**
 * La place d'un habitant hors de sa scénette, depuis le centre de son lieu ; `lift` : de quoi poser ses pieds sur le
 * dallage du lieu qui déborde un peu sur le sol (la cour du Donjon, des Nacelles, le pavé des Terrasses).
 */
export interface WorldHabitantSpot {
  dx: number;
  dz: number;
  lift?: number;
}

/**
 * Les quatorze places du 5e, à côté de la porte de chaque lieu (`door` de ./plan5e.ts), à 2 à 6 unités d'elle, dans le
 * regard d'arrivée de « Y aller », entier, hors de la bande de la bulle et de « Y aller », jamais dans l'axe de ce regard
 * vers le cœur du lieu.
 */
export const WORLD_HABITANT_SPOTS_5E: Readonly<Record<PlaceId5e, WorldHabitantSpot>> = {
  // À l'ouest du bout du ponton, sur la berge, hors du bassin et de la scène, à une demi-unité du chemin au moins.
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
};

/** Le lieu a-t-il un habitant qui se tient près de lui hors de sa scénette ? Au 5e, chaque lieu fini ; au 6e, aucun. */
export const hasWorldHabitant = (place: PlaceId): place is PlaceId5e => Object.hasOwn(WORLD_HABITANT_SPOTS_5E, place) && isBuiltPlace5e(place);

/** La porte d'un lieu du 5e, dans le monde (le nœud de son chemin). */
const doorOf = (place: PlaceId5e) => NETWORK_5E.pathNode(placeById(place).door).at;

/** Où se tient l'habitant d'un lieu hors de sa scénette (ses pieds), ou rien. */
export function worldHabitantAt(place: PlaceId, ground: (x: number, z: number) => number): Vec3 | null {
  if (!hasWorldHabitant(place)) return null;
  const s = WORLD_HABITANT_SPOTS_5E[place];
  const c = placeById(place).center;
  const x = c.x + s.dx;
  const z = c.z + s.dz;
  return { x, y: ground(x, z) + (s.lift ?? 0), z };
}

/**
 * Le cap de l'habitant (le visage vers +z au cap nul) : tourné vers celui qui arrive par « Y aller », un point à cinq
 * unités de la porte, du côté de la caméra d'arrivée (`doorView`, le nord par défaut : la caméra au sud).
 */
export function worldHabitantYaw(place: PlaceId5e): number {
  const s = WORLD_HABITANT_SPOTS_5E[place];
  const c = placeById(place).center;
  const door = doorOf(place);
  const view = placeArt(place)?.doorView ?? 0;
  const t = { x: door.x + 5 * Math.sin(view), z: door.z + 5 * Math.cos(view) };
  return Math.atan2(t.x - (c.x + s.dx), t.z - (c.z + s.dz));
}

/**
 * L'échelle du pion hors de la scénette : le rapport de sa taille à celle de Kéo y reste celui de la scénette (Kéo à
 * `scenetteKeo(place).scale` à côté du pion à l'échelle 1 ; dans le monde ouvert, Kéo à `KEO_WORLD_SCALE`), environ 2,1
 * (directeur artistique, relecture des habitants du 5e : à 1, le pion paraissait un enfant à côté du héros).
 */
export const worldHabitantScale = (place: PlaceId5e): number => KEO_WORLD_SCALE / scenetteKeo(place).scale;

/** Le pion d'un habitant à l'échelle du monde ouvert, ses pieds à l'origine, le visage vers +z, ou rien. */
function scaledPawn(place: PlaceId5e): Facets | null {
  const pawn = habitantPawn(place);
  if (!pawn) return null;
  const k = worldHabitantScale(place);
  const positions = new Float32Array(pawn.positions.length);
  for (let i = 0; i < positions.length; i++) positions[i] = pawn.positions[i] * k;
  return { ...pawn, positions };
}

const heights = new Map<PlaceId5e, number>();
/** La hauteur du pion hors de la scénette, ses pieds à sa tête (pour poser ses pastilles au-dessus de lui), faite une fois. */
export function worldHabitantHeight(place: PlaceId5e): number {
  let h = heights.get(place);
  if (h === undefined) {
    const p = habitantPawn(place)?.positions;
    let top = 0;
    if (p) for (let i = 1; i < p.length; i += 3) top = Math.max(top, p[i]);
    h = top * worldHabitantScale(place);
    heights.set(place, h);
  }
  return h;
}

/** Le pion d'un habitant à sa place hors de la scénette, tourné vers l'arrivée, ou rien (`hasWorldHabitant`). */
export function worldHabitantFacets(place: PlaceId, ground: (x: number, z: number) => number): Facets | null {
  const at = worldHabitantAt(place, ground);
  const pawn = hasWorldHabitant(place) ? scaledPawn(place) : null;
  if (!at || !pawn || !hasWorldHabitant(place)) return null;
  return placeFacets(pawn, { ...at, yaw: worldHabitantYaw(place) });
}
