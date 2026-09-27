// Le contrat commun des vues du monde de Blocland : la 3D (three/WorldCanvas.tsx) et la 2D (à venir).
// WorldPage ne connaît que ce contrat : il choisit la vue, le reste (panneaux, voyages, chantier) ne change pas.
import type { IslandStateId } from './islandState';
import type { BiomeId } from '../biomes';
import type { PlaceId, VoxelCube } from '../Voxel';
import type { ArchipelagoId } from './archipelago';
import type { VehiclePlacement } from './terrain';
import type { VoyageLeg } from './voyage';

export interface WorldFocus {
  /** Île à cadrer, ou `null` pour la vue d'ensemble. */
  island: BiomeId | null;
  /** Change à chaque demande, pour pouvoir redemander la même île. */
  seq: number;
  /** Un point à cadrer plutôt que le cœur de l'île (l'îlot d'un monument, au large de `island`). */
  spot?: { x: number; y: number; z: number };
}

export interface Cell {
  x: number;
  y: number;
  z: number;
}

export interface BuildProps {
  /** Face touchée : le bloc touché (`cell`) et la case voisine, devant la face (`next`). */
  onPickFace: (cell: Cell, next: Cell) => void;
}

export interface CreaturePlacement {
  id: BiomeId;
  cubes: VoxelCube[];
  origin: Cell;
  /** Une créature se promène ; un Gardien reste sur son îlot. */
  kind?: 'creature' | 'guardian';
  still?: boolean;
  /** Les pas possibles depuis sa place (sinon ceux par défaut). */
  steps?: [number, number][];
}

export interface QuestMark {
  /** « île:mission ». */
  id: string;
  biome: BiomeId;
  typeId: string;
  /** La case du socle (z : le sol sous le socle). */
  cell: Cell;
  /** `'new'` : à faire (repère jaune) ; un nombre : les étoiles gagnées ; `'locked'` : rien. */
  state: 'new' | 'locked' | number;
}

/** Éclats de couleur à un endroit du monde (pose d'un bloc) ; `seq` change à chaque demande. */
export interface Burst {
  seq: number;
  cell: Cell;
  color: string;
}

/**
 * Ce que reçoit une vue du monde (la 3D de three/, la 2D à venir) et ce qu'elle renvoie. Les vues ne font que
 * dessiner et traduire les gestes : les règles du monde sont dans world/, la simulation dans world/scene.ts.
 */
/** Le nom d'une île, écrit au-dessus d'elle dans le monde. */
export interface IslandLabel {
  id: BiomeId;
  text: string;
  /** Sur la Carte : l'état de l'île (Fermée, À explorer, En chantier, Restaurée), dessiné en icône et en mot sous le nom. */
  state?: { id: IslandStateId; name: string };
}

export interface WorldViewProps {
  /** L'archipel affiché : la scène (mer, brume, baleines, cadrage) est la sienne. */
  archipelago: ArchipelagoId;
  cubes: VoxelCube[];
  focus: WorldFocus;
  reduceMotion?: boolean;
  /** Le Bloc-Navire amarré au port : ses cubes locaux (fantômes pour les cases à poser), animé à part. */
  vehicle?: VehiclePlacement | null;
  /** Le navire touché (hors d'une case à poser) : on ouvre le panneau du port sur sa section. */
  onPickVehicle?: (port: BiomeId) => void;
  /** Le voyage en cours : le départ (le bonhomme embarque, le navire s'éloigne) ou l'arrivée (il accoste, le bonhomme débarque). */
  voyage?: { seq: number; leg: VoyageLeg; stage: 1 | 2 | 3; back: boolean } | null;
  /** Le temps du voyage est joué jusqu'au bout. */
  onVoyageLegEnd?: () => void;
  /** Un toucher ou une touche pendant le voyage : on arrive tout de suite. */
  onVoyageSkip?: () => void;
  /** Île touchée (un tap, pas un glissé), sur l'île elle-même. */
  onPickIsland?: (id: BiomeId) => void;
  /** Ouvrage touché (construit ou fantôme) : son identifiant. */
  onPickBridge?: (id: string) => void;
  /** Mode chantier : on touche une face (un fantôme du plan) au lieu d'entrer dans l'île. */
  build?: BuildProps;
  /** Les créatures, animées à part du terrain. */
  creatures?: CreaturePlacement[];
  onPickCreature?: (id: BiomeId, kind: 'creature' | 'guardian') => void;
  /** Ignorer l'heure réelle : toujours en plein jour. */
  forceDay?: boolean;
  /** Les ouvrages construits : la vue d'ensemble cadre les îles ouvertes et leurs voisines. */
  bridges?: string[];
  /** Une flèche jaune qui flotte au-dessus d'une île (« Commence ici »), ou d'une case du monde (le chantier du navire). */
  marker?: BiomeId | Cell | null;
  /** Le bonhomme : son itinéraire (un seul point : il se tient là ; plusieurs : il marche). `seq` change à chaque trajet. */
  avatar?: { route: Cell[]; seq: number };
  /** La Carte : tout le continent vu du ciel, un fanion au-dessus du bonhomme. */
  map?: boolean;
  /** L'île où le bonhomme se tient (ou se rend) : la caméra cadre cette île et ses voisines, tournée vers le continent. */
  home?: BiomeId;
  /** Un chemin à construire, montré par des balises jaunes qui flottent au-dessus de ses cases. */
  trail?: Cell[];
  /** Les bornes de mission : leur case et leur état (à faire, étoiles gagnées, fermée), pour le repère au-dessus. */
  quests?: QuestMark[];
  /** Les noms des îles ouvertes, écrits au-dessus de chacune dans la police de lecture (sans nom, on ne sait pas où aller). */
  islandLabels?: IslandLabel[];
  /** Borne de mission touchée (le socle, le panneau ou son repère). */
  onPickQuest?: (biome: BiomeId, typeId: string) => void;
  /** Lieu du village touché (l'école) : on y entre. */
  onPickPlace?: (place: PlaceId, island: BiomeId) => void;
  burst?: Burst;
  /** La marche libre (vue 2D, en option) : une croix de direction et un bouton « Entrer » ; toucher pour aller reste. */
  freeWalk?: boolean;
  /** En marche libre, le bonhomme vient d'arriver sur une autre île (ouverte) : elle devient la sienne. */
  onWalkedInto?: (id: BiomeId) => void;
  className?: string;
  label: string;
}
