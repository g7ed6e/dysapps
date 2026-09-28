// L'habillage du monde (étape J6 de docs/conception/univers.md §5, avec U4) : ce que l'univers change au dessin, et rien
// d'autre. Les parties de la scène, la 2D, les figures des créatures et des Gardiens lisent chacune la ligne qui les
// concerne, au lieu de demander « est-ce Archipéo ? ». Blocland en est un, Archipéo l'autre ; un troisième univers
// écrirait le sien. Aucune règle du jeu ne l'importe (world/couches.test.ts).
import type { UniversId } from '../univers/types';
import { renduDuMonde, type Rendu } from './rendu';

export interface Habillage {
  univers: UniversId;
  /** Le ciel et la lumière : le dôme en dégradé de la fiche de famille (world/palette.ts, `cielDe`), ou la palette du jour. */
  ciel: 'degrade' | 'palette';
  /**
   * La brume : les bancs posés sur la mer et la brume de profondeur de la fiche de famille, à la couleur de l'horizon du
   * ciel en dégradé ; ou les voiles translucides des sommets et la brume de la palette du monde en blocs.
   */
  brume: 'bancs' | 'voiles';
  /**
   * Le large : la mer peinte, les baleines, les oiseaux et le planeur dessinés ; ou l'eau plate à crêtes en pixels,
   * l'écume, les nuages en rangées de cubes, les baleines et les oiseaux en cubes, le plancher de nuages.
   */
  large: 'mer-et-faune' | 'blocs';
  /** Le sol : à facettes, modelé (world/modeleDessine/), avec le décor en formes ; ou en cubes. */
  sol: 'facettes' | 'cubes';
  /** Les personnages de la scène : les modèles dessinés (chargés à la demande), ou en cubes. */
  personnages: 'modeles' | 'cubes';
  /** Les étiquettes des îles : voilées par la brume de profondeur, ou nettes. */
  etiquettes: 'voilees' | 'nettes';
  /** Le monde en 2D : peint, ou en pixels. */
  dessin2D: 'peint' | 'pixels';
  /** La créature d'une bulle et le Gardien d'un défi, hors de la scène : les modèles dessinés (en SVG sans la 3D), ou en cubes. */
  figures: 'modeles' | 'cubes';
  /** Le défi d'un Gardien : une sentinelle à rallumer (si l'univers en a les textes), ou l'arène. */
  defi: 'sentinelle' | 'arene';
}

export const HABILLAGES = {
  blocland: {
    univers: 'blocland',
    ciel: 'palette',
    brume: 'voiles',
    large: 'blocs',
    sol: 'cubes',
    personnages: 'cubes',
    etiquettes: 'voilees',
    dessin2D: 'pixels',
    figures: 'cubes',
    defi: 'arene',
  },
  archipeo: {
    univers: 'archipeo',
    ciel: 'degrade',
    brume: 'bancs',
    large: 'mer-et-faune',
    sol: 'facettes',
    personnages: 'modeles',
    etiquettes: 'nettes',
    dessin2D: 'peint',
    figures: 'modeles',
    defi: 'sentinelle',
  },
} as const satisfies { readonly [U in UniversId]: Readonly<Habillage> & { univers: U } };

/** L'habillage d'un rendu (`?rendu=blocs` sur le serveur de développement : celui de Blocland). */
export function habillageDe(rendu: Rendu): Habillage {
  return HABILLAGES[rendu === 'archipeo' ? 'archipeo' : 'blocland'];
}

/** L'habillage du monde de cette page : celui de l'univers choisi (voir rendu.ts). */
export const habillageDuMonde = (): Habillage => habillageDe(renduDuMonde());
