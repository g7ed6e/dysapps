// Le contrat commun des vues du monde de Blocland : la 3D (three/WorldCanvas.tsx), et toute vue à venir.
// WorldPage ne connaît que ce contrat : il choisit la vue, le reste (panneaux, voyages, chantier) ne change pas.
import type { IslandStateId } from './islandState';
import type { BiomeDef, BiomeId, BlockId } from '../biomes';
import type { PlaceId, VoxelCube } from './cube';
import type { ArchipelagoId } from './archipelago';
import type { VehiclePlacement } from './terrain';
import type { VoyageLeg } from './voyage';
import type { Cell, CreaturePlacement } from './paths';
import type { Ancrage, Intention, ObjetDeLaFiche } from './layout';
import type { EtatsDesObjets } from './model';
import { grilleDe } from './grid';

// Une case du monde et la place d'une créature : définies avec la grille de marche (./paths.ts), qui les lit.
export type { Cell, CreaturePlacement } from './paths';

/**
 * Le bonhomme : son itinéraire (un seul point : il se tient là ; plusieurs : il marche), `seq` qui change à chaque
 * trajet. `flanerie` : il marche sur l'île où il est, vers une case touchée ; la caméra ne le suit pas (elle garde son
 * cadrage, et le décalage d'un glissé). `vise` : le but vient d'un toucher sur le sol ; un rond, posé sur le dernier
 * point, le montre jusqu'à l'arrivée.
 */
export interface Bonhomme<P> {
  route: P[];
  seq: number;
  flanerie?: boolean;
  vise?: boolean;
}

/**
 * La flèche posée sur un ouvrage (GD-7) : son identifiant, et l'île d'où la prochaine destination propose de le
 * construire (`depuis`, l'île de départ ; sans elle, l'île `from` de l'ouvrage). La vue trouve sa place par la
 * disposition en grille (`placesDeLaFleche`).
 */
export interface MarqueDOuvrage {
  ouvrage: string;
  depuis?: BiomeId;
}

/**
 * La flèche sur un ouvrage, en cases du monde : `cell`, la case où elle se pose ; `places`, les cases où elle peut
 * glisser si une étiquette occupe déjà sa place (de `cell` vers l'arrivée) ; `trace`, toutes les cases de la liaison,
 * dont le tracé se renforce sur la Carte, et `tirets`, celles qu'il dessine (`casesDesTirets`, calculées une fois) ;
 * `arrivee`, l'île d'en face, dont le nom pèse sur la Carte autant que celui de l'île de départ.
 */
interface MarqueDOuvrageEnCases extends MarqueDOuvrage {
  cell: Cell;
  places: Cell[];
  trace: Cell[];
  tirets: Cell[];
  arrivee?: BiomeId;
}

/** La flèche est-elle posée sur un ouvrage ? */
export function estUnOuvrage<M>(m: M): m is Extract<M, MarqueDOuvrage> {
  return typeof m === 'object' && m !== null && 'ouvrage' in m;
}

interface WorldFocus {
  /** Île à cadrer, ou `null` pour la vue d'ensemble. */
  island: BiomeId | null;
  /** Change à chaque demande, pour pouvoir redemander la même île. */
  seq: number;
  /** Un point à cadrer plutôt que le cœur de l'île (l'îlot d'un monument, au large de `island`). */
  spot?: Ancrage;
}

/** Ce qu'une vue sait en plus d'une face touchée en chantier. */
interface OptionsDeLaFace {
  /** L'île dont le plan est touché, quand la vue la connaît (le navire : son port) ; sinon l'île la plus proche. */
  ile?: BiomeId;
  /**
   * La face est sur le sol d'une île (pas sur le navire) : si elle n'est pas une case d'un plan, le bonhomme y va,
   * depuis `enRoute` s'il marchait.
   */
  terrain?: { enRoute?: Cell };
}

/**
 * En chantier : une face touchée, le bloc touché (`cell`) et la case voisine, devant la face (`next`), en cases du monde.
 */
interface BuildProps {
  onPickFace: (cell: Cell, next: Cell, options?: OptionsDeLaFace) => void;
}

export interface QuestMark {
  /** « île:mission ». */
  id: string;
  biome: BiomeId;
  typeId: string;
  /** Le socle : son île et sa case dans le repère de l'île (z : le sol sous le socle). */
  place: Ancrage;
  /**
   * `'new'` : à faire (le losange d'or) ; un nombre : les étoiles gagnées (sans étoile : la pierre, comme `'locked'`, pas
   * encore jouable ; world/affordance.ts).
   */
  state: 'new' | 'locked' | number;
}

/** Éclats de couleur à un endroit du monde (pose d'un bloc) ; `seq` change à chaque demande. */
export interface Burst {
  seq: number;
  /** Le cube posé : son île et sa case dans le repère de l'île. */
  cell: Ancrage;
  color: string;
  /**
   * Le dernier bloc d'un plan du village : dans Blocland, au lieu des poussières, le geste de pose (world/pose.ts), ce
   * bloc descend et s'enclenche. Archipéo garde ses éclats.
   */
  pose?: boolean;
}

/**
 * Ce que reçoit une vue du monde (la 3D de three/) et ce qu'elle renvoie. Les vues ne font que
 * dessiner et traduire les gestes : les règles du monde sont dans world/, la simulation dans world/scene.ts.
 */
/** Le nom d'une île, écrit au-dessus d'elle dans le monde. */
export interface IslandLabel {
  id: BiomeId;
  text: string;
  /** Sur la Carte : l'état de l'île (Fermée, À explorer, En chantier, Restaurée ou Bâtie selon l'univers : textes.etatsDIle), dessiné en icône et en mot sous le nom. */
  state?: { id: IslandStateId; name: string };
  /** Le bloc que l'île rapporte (sa ressource), dessiné avant le nom, comme dans Mes blocs. */
  bloc?: BlockId;
}

/**
 * Une créature qui fait signe (GD-4, étape 1) : celle de cette île, avec l'icône de la notion (celle de l'île). Un seul
 * signe par créature (affordance-blocland.md §8) : sa commande prête et suggérée d'abord (GD-7, PR 3), sinon ses
 * révisions (world/requests.ts, `signeDeLaCreature`).
 */
export interface SigneDeCreature {
  id: BiomeId;
  /** L'icône de la plaque : celle de la notion (révisions), celle des blocs (commande). */
  icone: BiomeDef['icon'];
  /**
   * Une commande (GD-7) : le bloc demandé, dont la plaque montre l'image, celle de Mes blocs (en 3D, three/signs.ts ; en
   * vue simple, `BlockIcon` sur la Carte), à la place de l'icône.
   */
  bloc?: BlockId;
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
   * Les gestes, traduits en intentions (world/layout.ts) : une île, une borne, un lieu, un ouvrage, une créature, le
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
  /**
   * Les créatures qui font signe (GD-4, étape 1 : des révisions dues sur leur île) : un geste lent et court à l'arrivée
   * de la caméra sur leur île, puis l'icône de la notion au-dessus d'elles, fixe (./sign.ts). La vue simple
   * montre l'icône sur la Carte.
   */
  signes?: SigneDeCreature[];
  /**
   * La clé de la prochaine chose à faire (world/affordance.ts : `cleDeLObjet`, ou `creature:<île>` pour une commande à
   * livrer) : dans Blocland, sa bulle est mise en avant quand elle est sur l'île où l'on est.
   */
  prochaine?: string | null;
  /** Une fiche, un panneau ou un mot est ouvert par-dessus le monde : la bulle mise en avant se tient tranquille. */
  calme?: boolean;
  /** Ignorer l'heure réelle : toujours en plein jour. */
  forceDay?: boolean;
  /** Les ouvrages construits : la vue d'ensemble cadre les îles ouvertes et leurs voisines. */
  bridges?: string[];
  /**
   * Une liaison montrée en fantôme depuis un autre départ (GD-9, « Partir d'une autre île ») : la caméra tient son
   * départ et son arrivée dans la place libre au-dessus de la fiche (`cadreDeLaLiaison`), comme une longue traversée ;
   * d'un coup quand l'appareil demande moins d'animations. La vue simple l'ignore.
   */
  liaisonCadree?: string | null;
  /**
   * Une flèche jaune qui flotte au-dessus d'une île (« Commence ici »), d'un point (le chantier du navire) ou, sur la
   * Carte, d'un ouvrage (la prochaine destination est un ouvrage à construire, GD-7) : posée sur sa liaison, côté île de
   * départ (`placesDeLaFleche`), avec l'icône d'un ouvrage.
   */
  marker?: BiomeId | Ancrage | MarqueDOuvrage | null;
  /**
   * Blocland, sur la Carte : l'image de la bulle d'or qui remplace la flèche de la prochaine destination (le bloc d'une
   * commande, ou l'icône de ce qu'on y fait : world/affordance.ts, `imageDeLaDestination`). Sans elle, la flèche.
   */
  // Le type de `ImageDeLaBulle` (world/affordance.ts), recopié : le contrat commun n'importe pas le dessin (layers.test.ts).
  imageDeLaCarte?: { icone: BiomeDef['icon'] } | { bloc: BlockId } | null;
  /** Le bonhomme : son itinéraire (un seul point : il se tient là ; plusieurs : il marche). `seq` change à chaque trajet. */
  avatar?: Bonhomme<Ancrage>;
  /** La Carte : tout le continent vu du ciel, un fanion au-dessus du bonhomme. */
  map?: boolean;
  /** L'île où le bonhomme se tient (ou se rend) : la caméra cadre cette île et ses voisines, tournée vers le continent. */
  home?: BiomeId;
  /** Un chemin à construire, montré par des balises jaunes qui flottent au-dessus de ses cases. */
  trail?: Ancrage[];
  /** Les bornes de mission : leur case et leur état (à faire, étoiles gagnées, fermée), pour le repère au-dessus. */
  quests?: QuestMark[];
  /**
   * L'état des autres objets qui portent un signe (Gardiens, Bloc-Navire, chantiers en fantôme ; world/model.ts,
   * `etatsDesObjets`) : le cube au-dessus d'eux, l'or ou la pierre (world/affordance.ts).
   */
  etatsDesObjets?: EtatsDesObjets;
  /** Les noms des îles ouvertes, écrits au-dessus de chacune dans la police de lecture (sans nom, on ne sait pas où aller). */
  islandLabels?: IslandLabel[];
  /**
   * Le mot de la baleine est ouvert : une baleine quitte sa ronde et passe au large de cette île (une fois par `seq`).
   * Jamais quand l'appareil demande moins d'animations (WorldPage ne le passe pas).
   */
  whalePass?: { island: BiomeId; seq: number } | null;
  /**
   * Le moment du rallumage (lot 6) : la sentinelle de ce Gardien, encore éteinte dans son placement, se rallume en
   * fondu, en `dureeMs` millisecondes, et reste allumée tant que le moment dure.
   */
  rallumage?: { id: BiomeId; seq: number; dureeMs: number } | null;
  burst?: Burst;
  /**
   * La pose d'une partie du bâtiment en vague (GD-6, Blocland) : ces cubes, en cases du monde, absents de `cubes`,
   * descendent couche par couche (./wave.ts), une fois par `seq`. La vue dit chaque couche posée et la fin (`onPose`),
   * et garde la partie posée jusqu'à ce que `pose` revienne à `null` avec le monde qui la contient. Une vue sans vague
   * dit la fin tout de suite.
   */
  pose?: { seq: number; cubes: VoxelCube[] } | null;
  onPose?: (moment: 'couche' | 'finie') => void;
  /**
   * Faire glisser le monde pour l'explorer (la 3D) : la vue dit quand elle a été déplacée (`true`) et quand elle est
   * revenue à son cadrage (`false`), pour le bouton « Recentrer ». Sans ce rappel, la vue ne glisse pas.
   */
  onVueDeplacee?: (deplacee: boolean) => void;
  /** Change à chaque appui sur « Recentrer » : la vue efface son décalage et revient en douceur à son cadrage. */
  recentrage?: number;
  /**
   * La fiche ouverte (lot 2 de « Toucher le monde »), une fois posée dans la page : la vue garde son objet hors d'elle
   * (si elle le cache, le cadrage glisse pour le poser dans la place libre ; sinon rien ne bouge) et, quand elle ne s'est
   * pas ouverte d'un toucher sur l'objet (`saut`), fait sauter son signe. Une fois par `seq`.
   */
  fiche?: { objet: ObjetDeLaFiche; seq: number; saut: boolean } | null;
  /**
   * Où se tient un objet à l'écran, la caméra posée à son cadrage (en pixels de la fenêtre), ou `null` s'il est derrière
   * elle : la vue y range sa fonction tant que la scène existe (le vol des blocs part de la borne de la mission).
   */
  situer?: { current: ((objet: ObjetDeLaFiche) => { x: number; y: number } | null) | null };
  className?: string;
  label: string;
}

/**
 * Les positions du contrat, en cases du monde (étape J5) : la 3D dessine le monde en cases, la grille y pose
 * chaque ancrage (`versMonde`). Les positions d'une vue en réseau resteront des ancrages. Les créatures et le navire
 * sont encore en cases du monde (R6 et R5 les passent en ancrages).
 */
export interface EnCasesDuMonde {
  focus: Omit<WorldFocus, 'spot'> & { spot?: Cell };
  marker: BiomeId | Cell | MarqueDOuvrageEnCases | null;
  avatar?: Bonhomme<Cell>;
  trail?: Cell[];
  quests?: (Omit<QuestMark, 'place'> & { cell: Cell })[];
  burst?: Omit<Burst, 'cell'> & { cell: Cell };
}

/**
 * Les rappels d'une vue, tirés de ses intentions (étape J4) : les vues convertissent en tête de rendu, leur intérieur ne
 * change pas. Un rappel absent veut dire « ce geste ne fait rien » ; `build` n'existe qu'en chantier.
 */
export interface RappelsDeLaVue {
  /** Une île : touchée sur le sol en `sol` (le bonhomme en route en `enRoute`), ou choisie au clavier. En cases du monde. */
  onPickIsland?: (id: BiomeId, sol?: Cell, enRoute?: Cell) => void;
  onPickBridge?: (id: string) => void;
  onPickQuest?: (biome: BiomeId, typeId: string) => void;
  onPickPlace?: (place: PlaceId, island: BiomeId) => void;
  onPickCreature?: (id: BiomeId, kind: 'creature' | 'guardian') => void;
  onPickVehicle?: (port: BiomeId) => void;
  build?: BuildProps;
  onVoyageLegEnd?: () => void;
  onVoyageSkip?: () => void;
  /** Le bonhomme arrivé tout de suite (un toucher dans le vide pendant un trajet). */
  onArrive?: () => void;
}

export function rappelsDeLaVue(onIntent: ((i: Intention) => void) | undefined, archipel: ArchipelagoId, chantier = false): RappelsDeLaVue {
  if (!onIntent) return {};
  // Une face touchée passe du monde aux cases du plan de son île : le repère de l'île, un cran plus bas (le plan compte
  // depuis le sol de l'île).
  const face = (cell: Cell, next: Cell, { ile, terrain }: OptionsDeLaFace = {}): Intention => {
    const g = grilleDe(archipel);
    const c = g.versIle(cell, ile);
    const n = g.versIle(next, c.ile);
    const duPlan = (p: Cell): Cell => ({ x: p.x, y: p.y, z: p.z - 1 });
    const sol = terrain ? { sol: c, ...(terrain.enRoute ? { enRoute: g.versIle(terrain.enRoute) } : {}) } : {};
    return { genre: 'face', ile: c.ile, case: duPlan(c.local), voisine: duPlan(n.local), ...sol };
  };
  return {
    onPickIsland: (id, sol, enRoute) => {
      if (!sol) return onIntent({ genre: 'ile', id });
      const g = grilleDe(archipel);
      onIntent({ genre: 'ile', id, sol: g.versIle(sol, id), ...(enRoute ? { enRoute: g.versIle(enRoute) } : {}) });
    },
    onPickBridge: (id) => onIntent({ genre: 'ouvrage', id }),
    onPickQuest: (ile, mission) => onIntent({ genre: 'borne', ile, mission }),
    onPickPlace: (id, ile) => onIntent({ genre: 'lieu', id, ile }),
    onPickCreature: (id, kind) => onIntent({ genre: 'creature', id, gardien: kind === 'guardian' }),
    onPickVehicle: (port) => onIntent({ genre: 'navire', port }),
    build: chantier ? { onPickFace: (cell, next, options) => onIntent(face(cell, next, options)) } : undefined,
    onVoyageLegEnd: () => onIntent({ genre: 'fin-du-voyage' }),
    onVoyageSkip: () => onIntent({ genre: 'voyage-saute' }),
    onArrive: () => onIntent({ genre: 'arrivee' }),
  };
}
