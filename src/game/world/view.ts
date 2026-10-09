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
import type { Rectangle } from './placement';

/**
 * Ce qu'est une case du dessin du mode « Aménager » (GD-9 ; calculé par ./arrangeView.ts). Pendant le glissé (choix 1b du
 * mainteneur, 7 octobre 2026) : `grille`, une place de la grille autour du fantôme ; `empreinte`, une place qu'il couvre,
 * libre ; `conflit`, une place qu'il couvre, trop près d'un autre lieu, barrée de deux `barre` en biais. `lien` : la ligne
 * en pointillés entre un Gardien détaché et son lieu (choix 4a).
 */
export type ArrangeCellKind = 'fantome' | 'place' | 'liaison' | 'barree' | 'croix' | 'grille' | 'empreinte' | 'conflit' | 'barre' | 'socle';

/**
 * Une case du dessin du mode, en cases du monde : un carré plat posé sur le dessus de la case (z + 1), bordé d'un
 * contour sombre (la couleur n'est jamais seule), de `l` cases de côté (1 par défaut).
 */
export interface ArrangeCell {
  x: number;
  y: number;
  z: number;
  genre: ArrangeCellKind;
  /** Le côté du carré, en cases (une place libre d'un lieu : 3). */
  l?: number;
  /** Une barre de croix : tournée de tant (radians) sur l'eau, mince ; sans elle, un carré droit. */
  angle?: number;
}

/** Le dessin du mode pendant un choix (./arrangeView.ts). */
export interface ArrangeView {
  cases: ArrangeCell[];
  /** L'emprise du choix à sa place d'avant (le lieu), soulevée tant qu'il est choisi ; ou rien. */
  souleve: Rectangle | null;
  /**
   * Ce qui se soulève vraiment, dans `souleve` : les bandes de la terre du lieu et de sa réunion, une case de plus tout
   * autour (GD-12, `liftPartsOf`), quand un lieu a une forme ; sans elles, tout `souleve`.
   */
  liftParts?: readonly Rectangle[];
  /** Le milieu du fantôme : la vue le suit s'il sort de l'écran. */
  suivre: { x: number; y: number; z: number };
  /** Les liaisons qui ne tiendraient plus après la pose (leur nombre se dit dans la barre). */
  barrees: string[];
  /** Le nom du lieu choisi, écrit sur son fantôme (le nom de l'univers, donné par la page). */
  nom?: string;
  /** Le lieu choisi : son étiquette sur l'île se tait le temps du choix, son nom n'est écrit qu'une fois, sur le fantôme. */
  lieu?: string;
  /** Ce que la vue garde entier à l'écran : le fantôme (les deux lieux réunis et leur réunion), à hauteur de l'eau. */
  cadre?: CadreDuMode;
  /** Les flèches et « Tourner », dessinées sur l'eau autour du choix (./arrangeHandles.ts). */
  poignees?: PoigneesDuChoix;
  /**
   * Les places libres montrées qui colleraient le lieu à un voisin (6 octobre 2026, choix 2a du mainteneur), une par
   * voisin, la plus proche du fantôme : le milieu de leur jointure (sur l'eau, là où irait la construction), en cases du
   * monde, `z` le dessus de l'eau ; la page y pose l'icône de « Réunir ».
   */
  reunions?: { x: number; y: number; z: number }[];
  /**
   * Pendant le glissé (7 octobre 2026, choix 1b du mainteneur) : la zone de la grille, en cases du monde ; les étiquettes
   * des autres lieux qui s'y trouvent s'estompent, jusqu'au lever du doigt.
   */
  zoneDuGlisse?: Rectangle;
  /** Pendant le glissé : le milieu du bord nord de l'empreinte, où le nom du choix se pose, au-dessus d'elle à l'écran. */
  nomAuNord?: { x: number; y: number; z: number };
}

/**
 * Glisser le choix du mode « Aménager » au doigt (7 octobre 2026, choix 1b, 2a et 3a du mainteneur), en cases du monde.
 * La vue demande d'abord, au départ d'un glissé, si le doigt est parti du choix (`prendre`) : de la terre du lieu choisi,
 * du Gardien choisi, ou de son fantôme (`touche` : ce que le doigt a touché, s'il a touché un lieu ou un Gardien) ;
 * sinon la vue glisse. Puis, à chaque mouvement, où est le doigt (`suivre`, sur le plan horizontal du point pris) ; au
 * lever, `lacher(true)` (la page pose sur une place libre) ; un geste interrompu (un second doigt, l'appui annulé),
 * `lacher(false)`.
 */
export interface GlisserLeChoix {
  /** Le doigt parti de `point` part-il du choix ? Rien n'est pris : la vue en décide son seuil (`SEUIL_DU_CHOIX`). */
  partDuChoix(point: { x: number; y: number }, touche: { lieu?: BiomeId; gardien?: BiomeId }): boolean;
  prendre(point: { x: number; y: number }, touche: { lieu?: BiomeId; gardien?: BiomeId }): boolean;
  suivre(point: { x: number; y: number }): void;
  lacher(poser: boolean): void;
}

/** Un rectangle du monde (en cases, x et y) à garder entier à l'écran, à une hauteur ; `seq` change à chaque demande. */
export interface CadreDuMode {
  rect: Rectangle;
  z: number;
  seq: number;
}

/** Une poignée dessinée dans le monde, à l'écran : son milieu et sa taille (pixels CSS, `POIGNEE_MIN_PX` au moins). */
interface PoigneeALEcran {
  cle: CleDePoignee;
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Où se tiennent les poignées du mode « Modifier le plan » à l'écran, image après image (pixels CSS, dans le repère de
 * la scène de la page, `[data-scene]`), et la place libre (`libre` : sous la ligne du mode, au-dessus de sa barre, sans
 * les boutons du haut). Les boutons transparents posés sur les poignées dessinées (ArrangeHandles.tsx) s'y placent.
 */
export interface ChoixALEcran {
  poignees: readonly PoigneeALEcran[];
  /** Les places qui colleraient le lieu choisi à un voisin, à l'écran (le milieu de leur jointure ; choix 2a du mainteneur). */
  reunions?: readonly { x: number; y: number }[];
  libre: Rectangle;
}

/**
 * Le geste de la pose en cours (./arrangeGesture.ts) : la zone du monde où il se joue (en cases du monde, x et y), le
 * temps (`demonte` à la place d'avant, `remonte` à la nouvelle), son début (horloge de la page, `performance.now`), sa
 * durée, et les hauteurs du lieu (`bas` sous l'eau, `haut` au-dessus de son plus haut cube).
 */
export interface ArrangeGesture {
  seq: number;
  /**
   * `descend` (7 octobre 2026, choix 2a du mainteneur, Blocland) : le choix lâché sur une place libre redescend d'un cube,
   * déjà à sa nouvelle place, puis la pose sonne ; sans démontage.
   */
  phase: 'demonte' | 'remonte' | 'descend';
  zone: Rectangle;
  /** Ce qui se joue vraiment, dans `zone` (GD-12, `liftPartsOf`) : sans elles, toute la zone. */
  zoneParts?: readonly Rectangle[];
  /**
   * L'autre place du geste (la nouvelle pendant le démontage, l'ancienne pendant le remontage) : le voile de brume
   * d'Archipéo glisse de l'une à l'autre.
   */
  autre?: Rectangle;
  debut: number;
  dureeMs: number;
  bas: number;
  haut: number;
}

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
  /**
   * Sur la Carte : l'état de l'île (Fermée, À explorer, En chantier, Restaurée ou Bâtie selon l'univers :
   * textes.etatsDIle), dessiné en icône et en mot sous le nom ; rien dans le mode « Aménager » (GD-9), où l'étiquette
   * se réduit au nom.
   */
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
  /**
   * Le mode « Aménager » (GD-9), sur la Carte : `vue`, le dessin du choix en cours (fantôme, places autour, liaisons
   * retracées et barrées, lieu soulevé ; ./arrangeView.ts), ou rien. Dans le mode, toucher la mer donne une intention
   * `mer` ; avec un choix, un glissé parti du choix lui-même (son lieu, son Gardien, ou son fantôme) le glisse au doigt
   * (`glisser` ; 7 octobre 2026, choix 1b, 2a et 3a du mainteneur), tout autre glissé fait glisser la vue ; et si le
   * fantôme sort de l'écran, la vue le suit. Les poignées (les flèches et « Tourner ») sont dessinées sur l'eau autour
   * du choix ; `ecran` reçoit, à chaque image où elles bougent, où elles se tiennent à l'écran (rien sans choix, ni
   * pendant le geste) : la page y pose leurs boutons transparents. La vue simple l'ignore.
   */
  amenager?: {
    vue: ArrangeView | null;
    cadre?: CadreDuMode | null;
    ecran?: (b: ChoixALEcran | null) => void;
    /** Les touchers des boutons posés sur les poignées : la poignée touchée s'enfonce dans le monde. */
    touchers?: { ecouter(f: (cle: CleDePoignee) => void): () => void };
    /** Le choix glissé au doigt (choix 1b, 2a et 3a du mainteneur). */
    glisser?: GlisserLeChoix;
  } | null;
  /** Le geste de la pose en cours dans le mode « Aménager » (./arrangeGesture.ts), ou rien. */
  geste?: ArrangeGesture | null;
  /** Change à chaque appui sur « Recentrer » : la vue efface son décalage et revient en douceur à son cadrage. */
  recentrage?: number;
  /**
   * La fiche ouverte (lot 2 de « Toucher le monde »), une fois posée dans la page : la vue garde son objet hors d'elle
   * (si elle le cache, le cadrage glisse pour le poser dans la place libre ; sinon rien ne bouge) et, quand elle ne s'est
   * pas ouverte d'un toucher sur l'objet (`saut`), fait sauter son signe. Une fois par `seq`.
   */
  fiche?: { objet: ObjetDeLaFiche; seq: number; saut: boolean } | null;
  /**
   * Sur la Carte, l'île fermée touchée, dont le chemin d'ouvrages est montré : comme celui de l'île dont la fiche est
   * ouverte, son nom ne se tait jamais (référent dys, 9 octobre 2026). La vue simple l'ignore.
   */
  selectedIsland?: BiomeId | null;
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
  onPickBridge?: (id: string, point?: { x: number; y: number }) => void;
  /** Le mode « Aménager » : la mer touchée (ou le doigt qui glisse, avec un choix), en cases du monde. */
  onPickSea?: (point: { x: number; y: number }) => void;
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
    onPickBridge: (id, point) => onIntent({ genre: 'ouvrage', id, ...(point ? { point } : {}) }),
    onPickSea: (point) => onIntent({ genre: 'mer', point }),
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

// Les poignées du mode « Modifier le plan » (GD-9), calculées par ./arrangeHandles.ts : leurs types vivent ici, avec la vue,
// pour que la vue ne dépende pas du calcul.

/** Une poignée : une des quatre flèches, ou « Tourner ». */
export type CleDePoignee = 'nord' | 'sud' | 'est' | 'ouest' | 'tourner';

/**
 * Une poignée posée : son décalage depuis le milieu du choix à chaque échelle de `ECHELLES` (en cases du monde, x puis y),
 * le premier à l'échelle 1 (`ox`, `oy`), et si elle sert.
 */
export interface PoigneeDuMonde {
  cle: CleDePoignee;
  ox: number;
  oy: number;
  places: readonly number[];
  dispo: boolean;
}

/** Les poignées d'un choix : le milieu de son emprise, la hauteur de l'eau (le dessus), et chaque poignée. */
export interface PoigneesDuChoix {
  cx: number;
  cy: number;
  z: number;
  liste: PoigneeDuMonde[];
  /**
   * Le choix est sur une place prise (choix 3 du mainteneur) : une croix grise se dessine au milieu de son emprise,
   * de la demi-taille `bras` (en cases, à l'échelle 1) ; rien sinon.
   */
  prise?: { bras: number };
  /** Ce que couvrent les radeaux à l'échelle 1, emprise du choix comprise : la vue le garde à l'écran. */
  emprise: Rectangle;
}
