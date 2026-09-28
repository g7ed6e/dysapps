// Le contrat commun des vues du monde de Blocland : la 3D (three/WorldCanvas.tsx) et la 2D (à venir).
// WorldPage ne connaît que ce contrat : il choisit la vue, le reste (panneaux, voyages, chantier) ne change pas.
import type { IslandStateId } from './islandState';
import type { BiomeId } from '../biomes';
import type { PlaceId, VoxelCube } from './cube';
import type { ArchipelagoId } from './archipelago';
import type { VehiclePlacement } from './terrain';
import type { VoyageLeg } from './voyage';
import type { Cell, CreaturePlacement } from './paths';
import type { Ancrage, Intention } from './disposition';
import { dispositionEnGrille } from './grille';

// Une case du monde et la place d'une créature : définies avec la grille de marche (./paths.ts), qui les lit.
export type { Cell, CreaturePlacement } from './paths';

export interface WorldFocus {
  /** Île à cadrer, ou `null` pour la vue d'ensemble. */
  island: BiomeId | null;
  /** Change à chaque demande, pour pouvoir redemander la même île. */
  seq: number;
  /** Un point à cadrer plutôt que le cœur de l'île (l'îlot d'un monument, au large de `island`). */
  spot?: Ancrage;
}

/**
 * En chantier : une face touchée, le bloc touché (`cell`) et la case voisine, devant la face (`next`), en cases du monde.
 * `ile` : l'île dont le plan est touché, quand la vue la connaît (le navire : son port) ; sinon l'île la plus proche.
 */
export interface BuildProps {
  onPickFace: (cell: Cell, next: Cell, ile?: BiomeId) => void;
}

export interface QuestMark {
  /** « île:mission ». */
  id: string;
  biome: BiomeId;
  typeId: string;
  /** Le socle : son île et sa case dans le repère de l'île (z : le sol sous le socle). */
  place: Ancrage;
  /** `'new'` : à faire (repère jaune) ; un nombre : les étoiles gagnées ; `'locked'` : rien. */
  state: 'new' | 'locked' | number;
}

/** Éclats de couleur à un endroit du monde (pose d'un bloc) ; `seq` change à chaque demande. */
export interface Burst {
  seq: number;
  /** Le cube posé : son île et sa case dans le repère de l'île. */
  cell: Ancrage;
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
  /**
   * Les gestes, traduits en intentions (world/disposition.ts) : une île, une borne, un lieu, un ouvrage, une créature, le
   * navire, une face en chantier, la fin d'un temps du voyage ou le voyage sauté.
   * La vue ne décide rien : la page reçoit l'intention et décide. Sans `onIntent`, la vue se regarde sans se toucher.
   */
  onIntent?: (i: Intention) => void;
  /** Mode chantier : toucher une face (un fantôme du plan) donne une intention `face` au lieu d'entrer dans l'île. */
  chantier?: boolean;
  /** Le voyage en cours : le départ (le bonhomme embarque, le navire s'éloigne) ou l'arrivée (il accoste, le bonhomme débarque). */
  voyage?: { seq: number; leg: VoyageLeg; stage: 1 | 2 | 3; back: boolean } | null;
  /** Les créatures, animées à part du terrain. */
  creatures?: CreaturePlacement[];
  /** Ignorer l'heure réelle : toujours en plein jour. */
  forceDay?: boolean;
  /** Les ouvrages construits : la vue d'ensemble cadre les îles ouvertes et leurs voisines. */
  bridges?: string[];
  /** Une flèche jaune qui flotte au-dessus d'une île (« Commence ici »), ou d'un point (le chantier du navire). */
  marker?: BiomeId | Ancrage | null;
  /** Le bonhomme : son itinéraire (un seul point : il se tient là ; plusieurs : il marche). `seq` change à chaque trajet. */
  avatar?: { route: Ancrage[]; seq: number };
  /** La Carte : tout le continent vu du ciel, un fanion au-dessus du bonhomme. */
  map?: boolean;
  /** L'île où le bonhomme se tient (ou se rend) : la caméra cadre cette île et ses voisines, tournée vers le continent. */
  home?: BiomeId;
  /** Un chemin à construire, montré par des balises jaunes qui flottent au-dessus de ses cases. */
  trail?: Ancrage[];
  /** Les bornes de mission : leur case et leur état (à faire, étoiles gagnées, fermée), pour le repère au-dessus. */
  quests?: QuestMark[];
  /** Les noms des îles ouvertes, écrits au-dessus de chacune dans la police de lecture (sans nom, on ne sait pas où aller). */
  islandLabels?: IslandLabel[];
  /**
   * Le mot de la baleine est ouvert : une baleine quitte sa ronde et passe au large de cette île (une fois par `seq`).
   * Jamais avec « Réduire les animations » (WorldPage ne le passe pas) ; la 2D n'a pas de baleine.
   */
  whalePass?: { island: BiomeId; seq: number } | null;
  burst?: Burst;
  className?: string;
  label: string;
}

/**
 * Les positions du contrat, en cases du monde (étape J5) : la 3D et la 2D dessinent le monde en cases, la grille y pose
 * chaque ancrage (`versMonde`). Les positions d'une vue en réseau resteront des ancrages. Les créatures et le navire
 * sont encore en cases du monde (R6 et R5 les passent en ancrages).
 */
export interface EnCasesDuMonde {
  focus: Omit<WorldFocus, 'spot'> & { spot?: Cell };
  marker: BiomeId | Cell | null;
  avatar?: { route: Cell[]; seq: number };
  trail?: Cell[];
  quests?: (Omit<QuestMark, 'place'> & { cell: Cell })[];
  burst?: Omit<Burst, 'cell'> & { cell: Cell };
}

/**
 * Les rappels d'une vue, tirés de ses intentions (étape J4) : les vues convertissent en tête de rendu, leur intérieur ne
 * change pas. Un rappel absent veut dire « ce geste ne fait rien » ; `build` n'existe qu'en chantier.
 */
export interface RappelsDeLaVue {
  onPickIsland?: (id: BiomeId) => void;
  onPickBridge?: (id: string) => void;
  onPickQuest?: (biome: BiomeId, typeId: string) => void;
  onPickPlace?: (place: PlaceId, island: BiomeId) => void;
  onPickCreature?: (id: BiomeId, kind: 'creature' | 'guardian') => void;
  onPickVehicle?: (port: BiomeId) => void;
  build?: BuildProps;
  onVoyageLegEnd?: () => void;
  onVoyageSkip?: () => void;
}

export function rappelsDeLaVue(onIntent: ((i: Intention) => void) | undefined, archipel: ArchipelagoId, chantier = false): RappelsDeLaVue {
  if (!onIntent) return {};
  // Une face touchée passe du monde aux cases du plan de son île : le repère de l'île, un cran plus bas (le plan compte
  // depuis le sol de l'île).
  const face = (cell: Cell, next: Cell, ile?: BiomeId): Intention => {
    const g = dispositionEnGrille(archipel);
    const c = g.versIle(cell, ile);
    const n = g.versIle(next, c.ile);
    const duPlan = (p: Cell): Cell => ({ x: p.x, y: p.y, z: p.z - 1 });
    return { genre: 'face', ile: c.ile, case: duPlan(c.local), voisine: duPlan(n.local) };
  };
  return {
    onPickIsland: (id) => onIntent({ genre: 'ile', id }),
    onPickBridge: (id) => onIntent({ genre: 'ouvrage', id }),
    onPickQuest: (ile, mission) => onIntent({ genre: 'borne', ile, mission }),
    onPickPlace: (id, ile) => onIntent({ genre: 'lieu', id, ile }),
    onPickCreature: (id, kind) => onIntent({ genre: 'creature', id, gardien: kind === 'guardian' }),
    onPickVehicle: (port) => onIntent({ genre: 'navire', port }),
    build: chantier ? { onPickFace: (cell, next, ile) => onIntent(face(cell, next, ile)) } : undefined,
    onVoyageLegEnd: () => onIntent({ genre: 'fin-du-voyage' }),
    onVoyageSkip: () => onIntent({ genre: 'voyage-saute' }),
  };
}
