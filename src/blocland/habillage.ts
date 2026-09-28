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
  /** La brume : les bancs posés sur la mer et la brume de profondeur de la fiche, ou les nappes et la brume du cadrage. */
  brume: 'bancs' | 'nappes';
  /** Le large : la mer peinte, la faune et le planeur ; ou l'eau, l'écume, les nuages et le plancher de nuages en blocs. */
  large: 'mer-peinte' | 'blocs';
  /** Le sol : à facettes, modelé (world/modeleDessine/), avec le décor en formes ; ou en cubes. */
  sol: 'facettes' | 'cubes';
  /** Les personnages de la scène : les modèles dessinés (chargés à la demande), ou en cubes. */
  personnages: 'modeles' | 'cubes';
  /** Les étiquettes des îles prennent la brume du cadrage (le monde en blocs) ; sinon elles restent nettes. */
  etiquettesDansLaBrume: boolean;
  /** Le monde en 2D : peint, ou en pixels. */
  dessin2D: 'peint' | 'pixels';
  /** La créature d'une bulle et le Gardien d'un défi, hors de la scène : en SVG dessiné, ou en cubes. */
  figures: 'svg' | 'cubes';
  /** Le défi d'un Gardien se joue en sentinelle à rallumer (si l'univers en a les textes), sinon dans l'arène. */
  sentinelles: boolean;
}

export const HABILLAGES: Record<UniversId, Habillage> = {
  blocland: {
    univers: 'blocland',
    ciel: 'palette',
    brume: 'nappes',
    large: 'blocs',
    sol: 'cubes',
    personnages: 'cubes',
    etiquettesDansLaBrume: true,
    dessin2D: 'pixels',
    figures: 'cubes',
    sentinelles: false,
  },
  archipeo: {
    univers: 'archipeo',
    ciel: 'degrade',
    brume: 'bancs',
    large: 'mer-peinte',
    sol: 'facettes',
    personnages: 'modeles',
    etiquettesDansLaBrume: false,
    dessin2D: 'peint',
    figures: 'svg',
    sentinelles: true,
  },
};

/** L'habillage d'un rendu (`?rendu=blocs` sur le serveur de développement : celui de Blocland). */
export function habillageDe(rendu: Rendu): Habillage {
  return HABILLAGES[rendu === 'archipeo' ? 'archipeo' : 'blocland'];
}

/** L'habillage du monde de cette page : celui de l'univers choisi (voir rendu.ts). */
export const habillageDuMonde = (): Habillage => habillageDe(renduDuMonde());
