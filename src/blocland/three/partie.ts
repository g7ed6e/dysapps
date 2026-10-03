// Ce que partagent les parties de la scène 3D (cubes, navire, bornes, personnages, lumière, brume, étiquettes, le
// large, la caméra) : le monde qu'elles dessinent, les dernières props de la vue, et l'instant de chaque image.
// La boucle de `WorldCanvas.tsx` ne fait qu'itérer sur elles (docs/conception/separation-jeu-rendu.md, étape D).
import type * as THREE from 'three';
import type { BiomeId } from '../biomes';
import type { Habillage } from '../habillage';
import type { ArchipelagoId } from '../world/archipelago';
import type { EnCasesDuMonde, WorldViewProps } from '../world/view';
import type { Surface } from './surface';

/** Le monde que dessine la scène : fixé pour sa vie (elle est refaite quand l'archipel ou « Réduire les animations » change). */
export interface Monde {
  scene: THREE.Scene;
  archipel: ArchipelagoId;
  /** Ce que l'univers change au dessin (../habillage.ts), lu par chaque partie à sa construction. */
  habillage: Habillage;
  /** L'option de style de surface (lot R1), ou `null` : les textures des blocs. */
  surface: Surface | null;
  etendue: { minX: number; maxX: number; minY: number; maxY: number };
  centre: { x: number; y: number };
  /** Étendue la plus grande de l'archipel (largeur ou profondeur) : sert au cadrage, à la brume et au zoom maximal. */
  largeur: number;
}

/** Les dernières props de la vue, lues à chaque image (la scène n'est pas refaite quand elles changent). */
export interface Derniers {
  carte: boolean;
  focus: EnCasesDuMonde['focus'];
  home: BiomeId | null;
  forceDay: boolean;
  whalePass: WorldViewProps['whalePass'];
  sons: boolean;
  onVoyageLegEnd?: () => void;
}

/** L'instant d'une image : ce que les déplacements (le bonhomme, le navire) ont décidé, que les autres parties lisent. */
export interface Instant {
  /** L'horloge, en millisecondes (`performance.now`). */
  now: number;
  /** Le bonhomme marche, et la caméra le suit (pas pendant une flânerie sur son île, vers une case touchée). */
  marche: boolean;
  /** Le bonhomme prend une longue traversée (GD-7) : le cadre fixe de la caméra, du départ à l'arrivée, ou `null`. */
  traversee: { minX: number; maxX: number; minY: number; maxY: number } | null;
  /** Le navire est en route : où il est, où il en est de son temps (0 à 1), à quelle étape du navire. */
  navigue: { at: THREE.Vector3; k: number; stage: 1 | 2 | 3 } | null;
  /** La Carte est montrée (ni marche ni voyage en cours). */
  carte: boolean;
  /** Là où la caméra arrive : l'écart des étiquettes se calcule pour ce cadrage, pas image par image. */
  but: { target: THREE.Vector3; pos: THREE.Vector3 };
}

/**
 * Une partie de la scène. `deplacer` fait avancer ce qui bouge dans le monde (avant la caméra) ; `animer` fait le
 * reste de l'image ; `t` est le temps de la scène en secondes, `dt` le pas de l'image (jamais négatif, 0,1 s au plus).
 */
export interface PartieDeLaScene {
  deplacer?(t: number, dt: number, reduit: boolean): void;
  animer?(t: number, dt: number, reduit: boolean): void;
  dispose(): void;
}
