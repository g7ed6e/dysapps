// Ce que l'univers change au dessin du monde (étape J6 de docs/conception/univers.md §5) : une ligne par partie du
// dessin. Des données seulement, sans React ni Three.js ; aucune règle du jeu ni aucune disposition ne l'importe
// (world/couches.test.ts, couche « univers »).
import type { UniversId } from '../../../univers/types';

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
  /**
   * Les grands repères (world/cadrage.ts : le grand phare des Îles du Ciel) : la caméra les garde dans le cadre et les
   * étiquettes s'en écartent ; ou le cadrage de la zone seul.
   */
  reperes: 'cadres' | 'libres';
  /**
   * La pose d'un bloc (GD-1, point 4) : le geste de Blocland, où le dernier bloc d'un plan descend et s'enclenche
   * (world/pose.ts, sans poussière), et le « clac » de cliquet à chaque pose ; les autres poses gardent
   * leurs poussières claires. Archipéo : poussières et « toc » commun.
   */
  pose: 'geste' | 'eclats';
}
