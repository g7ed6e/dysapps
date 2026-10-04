// Ce que l'univers change au dessin du monde (étape J6 de docs/univers/univers.md §5) : une ligne par partie du
// dessin. Des données seulement, sans React ni Three.js ; aucune règle du jeu ni aucune disposition ne l'importe
// (world/couches.test.ts, couche « univers »).
import type { UniversId } from '../../../univers/types';
import type { Atelier } from '../terrain';

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
   * Le lieu où l'on assemble les blocs (GD-2), sur l'île de l'école : la Fabrique (une halle de brique à toit plat, sa
   * cheminée, une potence de rondins), ou la Halle aux matériaux (une halle basse en bois sur un socle de pierre, un
   * toit à deux pentes, une potence de bois). Même place, même porte : seule la silhouette change (world/terrain.ts).
   */
  atelier: Atelier;
  /**
   * La pose d'un bloc (GD-1, point 4) : le geste de Blocland, où le dernier bloc d'un plan descend et s'enclenche
   * (world/pose.ts, sans poussière), et le « clac » de cliquet à chaque pose ; les autres poses gardent
   * leurs poussières claires. Archipéo : poussières et « toc » commun.
   */
  pose: 'geste' | 'eclats';
  /**
   * Le signe de la créature qui se souvient (GD-4, étape 1), au-dessus d'elle dans le monde : une plaque carrée aux
   * coins presque droits (un bloc vu de face, décision du directeur artistique du 3 octobre 2026), ou un disque.
   */
  signe: 'plaque' | 'disque';
  /**
   * Ce qui montre les objets qu'on touche dans le monde : une à trois bulles sur l'île où l'on est, seulement sur ce
   * qu'on peut faire maintenant, avec les plaques des créatures (proposition P2, choisie par le
   * mainteneur le 4 octobre 2026 ; world/affordance.ts), ou le seul losange qui rebondit au-dessus d'une borne à faire
   * (Archipéo, en pause, garde son dessin).
   */
  signesDesObjets: 'bulles' | 'losanges';
  /**
   * L'étiquette d'une île, dans le monde et sur la Carte : le bloc qu'elle rapporte, avant son nom (demande du
   * mainteneur, 4 octobre 2026 ; world/labelCanvas.ts, dans les deux univers depuis qu'Archipéo reprend le jeu de
   * Blocland, même jour), ou le nom seul.
   */
  blocDesIles: 'avant-le-nom' | 'sans';
}
