// La scène du monde continu (prototype du monde ouvert d'Archipéo, 6e, piste B « chemins aimantés ») : le terrain en
// tuiles, la mer et le lagon, les chemins, les quatre lieux, Kéo ; le toucher qui l'envoie au point du chemin le plus
// proche, sa marche ; la marque de la prochaine mission, donnée à la page à chaque image. Piste 1, lot 1 : l'île
// agrandie, la caméra qui suit Kéo (world/continu/camera.ts), le terrain rassemblé en deux anneaux autour de lui (de
// près, de loin), la brume au loin et sur les terres fermées. Les terres (GD-20, point 3, « vraies terres, vrais
// ponts ») : le pont tombé de chaque terre fermée, où Kéo s'arrête sur la culée, et le pont rebâti de celles qu'on a
// reliées, dans le maillage des lieux ; sur la Carte, chaque pont en trait double.
// Chargée à la demande avec la page (./OpenWorldPage.tsx), seulement derrière le drapeau `?monde=ouvert`
// (../../worldLayoutFactory.tsx). Tout ce qui se calcule sans Three.js est dans world/continu/.
import * as THREE from 'three';
import { loadKeo } from '../../importedCharacters';
import { createHabitantModels } from './habitantModels';
import { loadedKeo } from '../../world/characters/imported/keo';
import { KEO_HEIGHT, LOOK_UP, MARK_LIFT, WORLD_FOG, followPose, followStep, liftStep, lookUp, lookUpStep, markBeside, markOffset, occlusionLift, screenOf, wrapAngle, type CameraPose } from '../../world/continu/camera';
import { constructionFacets, createPoseRun, fallenFacets, lanternLit, POSE_DROP, poseView, ruinFacets, traceStagePosed, type PartShape } from '../../world/continu/construction';
import { FacetBuilder, mergeFacets, placeFacets, type Facets } from '../../world/continu/facets';
import { distance, linearRgb, type Vec2, type Vec3 } from '../../world/continu/geometry';
import { clampMap, mapPose, mapStart, panMap, reframeMap, zoomMap, type MapView } from '../../world/continu/map';
import { BRIDGE, BRIDGE_TOUCH, bridgeFacets, bridgeFloor, bridgeLayRest, bridgeLockPoint, bridgeMapMark, bridgeSite, clampToOpen } from '../../world/continu/bridges';
import { bridgeLay, bridgeLayAt, bridgeLayDrawn, bridgeLayPositions, type BridgeLay, type BridgeLayState } from '../../world/continu/bridgeLay';
import { LINKED_LANDS, START_LAND, bridgeSpot, firstClosed, isBridgeSpot, landOf, type BridgeSpot, type LinkedLand } from '../../world/continu/lands';
import { freeRoute, isWalkable, nearestWalkable, onPathCell, walkGridSteps, type WalkGrid } from '../../world/continu/freeWalk';
import { distanceSign, markOnScreen, type MarkOnScreen } from '../../world/continu/mission';
import { atNode, edgesNear, findRoute, pathNode, pathRibbons, pathTopAt, snapToNetwork, startOf, type NetworkPoint } from '../../world/continu/paths';
import { COLORS_6E, PLACES, TERRAIN, hidesTraces, placeById, portFloor, portNode, type PlaceId, type PortSpot } from '../../world/continu/plan6e';
import { ENGINE_ROTOR_COLORS, LAMP_COLOR, STEAM_COLORS, engineRotorHub, lanternLight, modelOfPlace } from '../../world/continu/places';
import { PAPER_COLOR } from '../../world/continu/printworks';
import { PORT_MAP_POINT, PORT_ROOFLINES, assemblyScene, portFacets, portHeading, portSubject, portTouch, type PortState } from '../../world/continu/port';
import { HELD_LIFT, SALT_PUMP, answerObjects, answerScale, inBasket, itemScene, placeTrace, rankInBasket, saltPumpHub, sceneSpot, sortPrise, sortScales, swingTo, type Reaction, type SortLook } from '../../world/continu/questionScene';
import { REACTION_SECONDS, type ItemScene } from '../../world/continu/questions';
import {
  EXIT_VIEW,
  LANTERN,
  SCENETTE_CAMERA,
  answerLeaves,
  answersHang,
  bellPlane,
  exitView,
  habitantHand,
  scenetteDeck,
  scenetteDecor,
  scenetteExit,
  placeKeep,
  PLACE_VIEW,
  TRACE_VIEW,
  type ExitView,
  scenetteFinale,
  scenetteHidesPieces,
  scenetteTraces,
  scenetteHidesPlace,
  scenetteKeo,
  scenetteHabitant,
  scenettePose,
  type ScenetteFinale,
  type ScenetteLayout,
} from '../../world/continu/scenette';
import { SEA_TEXTURE, WATER_TONES, seaPixels } from '../../world/continu/sea';
import { HORIZON_COLOR, LIGHT, SHADOW_DIR, skyDome } from '../../world/continu/sky';
import { buildHeightField, heightOnMesh, ringHeights, standingHeight, tileRings } from '../../world/continu/terrain';
import { createTileStore, type Tile } from '../../world/continu/tiles';
import { veilFacets, type VeilMesh } from '../../world/continu/veil';
import { WALK_CADENCE, skipWalk, startWalk, walkAt, type Walk } from '../../world/continu/walk';
import { corpsDuBonhomme, type CorpsDuBonhomme } from '../paintedCharacters';
import { createMeter } from '../meter';
import { placedAmenagement } from './amenagements';
import { amenagementById, remiseFrame, remisePosed, showsAmenagements, type WorldBox } from '../../world/continu/amenagements';
import { placedCaisse } from '../../world/continu/caisse';
import { REMISE_DROP, REMISE_TIMING } from '../../world/continu/remise';
import { createRemiseRun, createSignsTracker, type RemiseEvents, type SignOnScreen } from './remiseRun';
import { nearestPlace, screenRect, touchedObject, type ObjectTarget } from '../../world/continu/toucher';

/** Ce que la page donne à la scène. */
export interface OpenWorldOptions {
  /** Le lieu où Kéo se tient au départ, ou l'endroit de l'Escale (son quai, une porte de l'école…). */
  start: PlaceId | PortSpot;
  /** « Réduire les animations » : Kéo arrive tout de suite, la caméra le suit d'un bloc. */
  reduceMotion: boolean;
  /** Kéo est arrivé : devant un lieu qu'on lui a demandé (`place`), ou sur un point du chemin (`null`). */
  onArrive(place: PlaceId | null): void;
  /** Kéo part (la page change « Y aller » en « Passer le trajet »). */
  onDepart(): void;
  /** La place de la marque de la prochaine mission à l'écran, à chaque image (`null` : pas de marque). */
  onMark(mark: MarkOnScreen | null): void;
  /**
   * La place à l'écran du cadenas du pont de chaque terre fermée, à chaque image (la même liste, remplie sur place ;
   * refaite quand les terres changent). Aucun pendant une question.
   */
  onLocks(locks: readonly LockOnScreen[]): void;
  /**
   * La Carte ouverte : la place à l'écran de chaque lieu, à chaque image (la même liste, remplie sur place) ; `moving`
   * tant qu'un doigt la fait glisser ou la pince, ou que la molette tourne ; à l'arrêt (le dernier doigt levé, la molette
   * au repos), une pose de plus, `moving` faux.
   */
  onMapPlaces(spots: readonly MapSpotOnScreen[], moving: boolean): void;
  /**
   * Sur la Carte, un lieu, l'Escale ou le pont d'une terre fermée touché dans la 3D (un lieu ouvert : la page ferme la
   * Carte et y dépose Kéo ; un lieu d'une terre fermée ou son pont : elle ouvre la fiche de la terre).
   */
  onMapPick(place: PlaceId | 'port' | BridgeSpot): void;
  /** Dans le monde, un lieu d'une terre fermée ou son pont tombé touché (GD-20, point 3) : la page ouvre la fiche de la terre. */
  onClosed(land: LinkedLand): void;
  /**
   * À l'Escale (GD-20, lot 2) : Kéo est devant une porte de l'école, la galerie ou le lieu d'assemblage (la page en ouvre
   * le panneau), ou l'on a touché le reste du Port (`fiche`, la page ouvre sa fiche).
   */
  onPort(spot: PortSpot | 'fiche'): void;
  /** La scénette d'assemblage est finie (posée, passée, ou sans rien à montrer) : la page ouvre le panneau du lieu. */
  onAssembled(): void;
  /** Montrer le compteur de mesures (`?mesures`) ; `expose` : le laisser lire aux scripts. */
  meter: { show: boolean; expose: boolean };
  /** La pose d'une partie est finie (posée, la caméra revenue à Kéo, ou passée) : les célébrations peuvent venir. */
  onPosed(): void;
  /**
   * La place à l'écran des pastilles des habitants (GD-20, point 4, lot L1), à chaque image, comme les cadenas (la même
   * liste, remplie sur place ; refaite quand `setSigns` change). Aucune pendant une question, une remise ou sur la Carte.
   */
  onSigns?(signs: readonly SignOnScreen[]): void;
  /**
   * La caméra a tourné autour de Kéo (GD-20, rotation libre) : `yaw` en radians, 0 tournée vers le nord, croissant quand
   * le monde tourne dans le sens des aiguilles d'une montre ; la page en tourne sa boussole. À chaque image où il change.
   */
  onYaw?(yaw: number): void;
}

export type { RemiseEvents, SignOnScreen } from './remiseRun';

/**
 * Ce que la remise pose (lots L1 et L2) : l'aménagement d'une commande, ou l'objet d'entraide apporté (`carry` : il
 * part de la main de Kéo) ; ou la caisse de « Donner » et ses blocs (`caisse`, les deux faces du bloc donné).
 */
export type RemisePlay = { place: PlaceId; amenagement: string; carry?: boolean } | { place: PlaceId; caisse: { count: number; block: { dessus: number; cote: number } } };

export interface OpenWorld {
  /**
   * Envoie Kéo devant un lieu : en marchant (le toucher d'un lieu), ou d'un coup (`jump`, « Y aller » : le trajet est
   * toujours sauté, il dure trente secondes dans l'île agrandie).
   */
  goTo(place: PlaceId, jump?: boolean): void;
  /** Saute le trajet en cours : Kéo est arrivé. */
  skip(): void;
  /**
   * Tourne la caméra autour de Kéo d'un cran (`1` : le monde dans le sens des aiguilles d'une montre, `-1` : dans l'autre),
   * ou la remet vers le nord (`0`) ; en douceur, d'un coup avec « Réduire les animations ».
   */
  turn(step: -1 | 0 | 1): void;
  /** Kéo d'un coup à un endroit de l'Escale, tourné vers sa façade : la page en ouvre le panneau (`onPort`). */
  goToPort(spot: PortSpot): void;
  /** Ce que montre l'Escale (ses portes, ses trophées, l'état de la région, la pile) : refait seulement s'il change. */
  setPort(state: PortState): void;
  /**
   * La part de l'écran que laisse un panneau ouvert (en pixels, `null` : tout l'écran) : la caméra y garde ce que le
   * panneau concerne (la porte, la galerie, l'établi ; `place`, le lieu dont la fiche est ouverte ; pour la fiche d'une
   * terre fermée, l'un de ses lieux : le pont à rebâtir, si Kéo se tient devant), sans bouger (un décalage de l'image).
   */
  frame(free: { left: number; top: number; width: number; height: number } | null, place?: PlaceId): void;
  /**
   * La scénette d'assemblage, au retour d'une question réussie : les pièces de l'établi se joignent en un bloc, que la
   * grue pose sur le râtelier ; un toucher la passe, d'un coup avec « Réduire les animations ». `onAssembled` dit sa fin.
   */
  assemble(): void;
  /** Le lieu marqué (la prochaine mission), ou aucun : le seul lieu qui dépasse la brume. */
  setMark(place: PlaceId | null): void;
  /**
   * Les terres (GD-20, point 3, « vraies terres, vrais ponts ») : les terres fermées (sous la brume, leur pont tombé, Kéo
   * s'arrête sur sa culée). Une terre qu'on vient de relier perd sa brume et voit son pont rebâti, d'un coup, ou par sa
   * pose (`layLand`) ; refait seulement s'il change.
   */
  setLands(lands: { closed: readonly LinkedLand[] }): void;
  /**
   * La pose du pont d'une terre qu'on relie (GD-20, point 3, « La pose »), dite avant que les terres changent : au
   * prochain `setLands` qui ouvre cette terre, la caméra immobile, les piles se relèvent, puis le tablier, puis les
   * garde-corps et les lanternes ; `tap` à la fin (le toc), puis la brume de la terre se lève en fondu, `laid` à la fin
   * (la phrase) ; Kéo ne passe pas avant. D'un coup, `tap` puis `laid` aussitôt, avec « Réduire les animations », sur la
   * Carte, pendant une question, une pose ou une scénette, ou si le pont n'est pas à l'écran ; un toucher la finit.
   */
  layLand(land: LinkedLand, events: BridgeLayEvents): void;
  /** Où se tient Kéo, au sol (le voisin le plus proche de la fiche d'un lieu pas encore reliable). */
  keoAt(): Vec2;
  /**
   * Pose une question dans un lieu (lot 4), ou la retire (`null`) : la caméra coupe sur un cadrage fixe, la scène de
   * l'item se montre dans la fenêtre de la question, les objets des réponses au-dessus de leurs boutons. Rend la place à
   * l'écran des repères de la scène (les nombres de l'échelle), que la page écrit. Refaite à chaque item, à chaque
   * réponse et à chaque changement de taille ; la réaction ne joue qu'au moment où l'item reçoit sa réponse.
   */
  question(q: QuestionRequest | null): LabelOnScreen[];
  /**
   * La fin de la mission dans une scénette (le Phare) : la caméra reste dans la galerie, les objets des réponses
   * s'effacent, et à la réussite (`lit`) la lampe du Phare s'allume (tout de suite avec « Réduire les animations »).
   * `question(null)` la quitte.
   */
  scenetteEnd(lit: boolean): void;
  /**
   * Les lieux (GD-20, lot 1) : chacun se rebâtit lui-même, sa ruine et ses parties posées en tranches d'étapes, et la
   * trace de sa scénette ; tout réuni en un maillage, refait ici seulement (jamais par image). `pose` : les parties qui
   * viennent d'arriver dans un lieu, posées sous les yeux de l'élève (la caméra va vers le lieu, du côté de sa porte, la
   * partie descend à sa place, puis la caméra revient) ; un toucher passe la pose, et avec « Réduire les animations »
   * elle est posée d'un coup. Rend `true` si une pose commence (`onPosed` dira sa fin).
   */
  setPlaces(places: PlacesState, pose?: { place: PlaceId; parts: readonly PartShape[] }): boolean;
  /**
   * Ouvre la Carte des lieux ouverts (`open`, les lieux qu'on peut toucher), ou la ferme (`null`) : l'île entière vue
   * de haut, sans brume au loin ; on la fait glisser et on la pince. Kéo s'arrête où il est. Jamais pendant une question.
   */
  map(open: readonly PlaceId[] | null): void;
  /**
   * La vue de départ de la Carte change (GD-20, « La Carte au plus grand texte ») : la plus proche de l'île entière où
   * `crowded` (les lieux ouverts sans leur nom près d'eux ou hors de l'écran, pour des points à l'écran) s'annule
   * (`reframeMap`) ; plus loin que l'île entière, elle devient aussi la distance la plus lointaine. Seulement si la Carte
   * n'a pas été touchée : son premier toucher la fige. À l'ouverture (ou quand l'écran change de taille), elle ne se
   * dessine qu'une fois sa vue choisie, sans animation (consultant UX UI).
   */
  reframeMap(crowded: (spots: readonly MapSpotOnScreen[]) => number): void;
  /**
   * Le cadrage prévu de la remise (GD-20, point 4, lot L0, pour les captures seulement, sans geste) : la scénette du lieu,
   * au Phare au pied de la tour, Kéo et l'habitant à leur place, ses aménagements posés montrés, la caméra élargie juste
   * assez pour eux ; `null` la quitte.
   */
  remiseView(place: PlaceId | null): void;
  /**
   * La remise (GD-20, point 4, lot L1 « Livrer ») : le cadrage de la remise du lieu, l'aménagement `amenagement` à poser
   * pris dans le cadre, rien de lui posé encore (son assise de pierre seule, s'il en a une) ; `null` la quitte (la caméra
   * revient derrière Kéo, devant le lieu). La page la lance (`remiseStart`, à la fin de la consigne) et la finit
   * (`remiseFinish`, un toucher qui saute) ; `on` dit chaque élément posé et la fin de la pose.
   */
  remise(r: RemisePlay | null, on?: RemiseEvents): void;
  /** La pose de la remise part : un calme, puis chaque élément descend à sa place (tout d'un coup avec « Réduire les animations »). */
  remiseStart(): void;
  /** L'état final de la remise, tout de suite : tout est posé (un toucher qui saute, une sortie). */
  remiseFinish(): void;
  /** Les lieux dont l'habitant a une pastille (trois au plus), ou aucun. */
  setSigns(places: readonly PlaceId[]): void;
  /** Les chiffres de la dernière image : appels de dessin et triangles (captures, mesures). */
  info(): { calls: number; triangles: number; mapMs: number };
  /** Ce qu'un toucher en ce point de la fenêtre ouvrirait au Port, sans rien faire (la mesure des cibles). */
  portAt(clientX: number, clientY: number): PortSpot | 'fiche' | null;
  dispose(): void;
}

/**
 * Ce que les lieux montrent : les parties posées de leur construction, et les missions jouées en scénette déjà réussies
 * (chacune laisse sa trace, GD-20, point 8).
 */
interface PlacesState {
  built: Readonly<Record<PlaceId, readonly PartShape[]>>;
  traces: Readonly<Record<PlaceId, readonly string[]>>;
  /** Les aménagements posés de chaque lieu (GD-20, point 4, lot L0 : les petites constructions livrées, `world.parts`). */
  amenagements?: Readonly<Partial<Record<PlaceId, readonly string[]>>>;
}

/**
 * Une question à montrer : le lieu et la mission (sa trace, au retour), la place à l'écran, l'item (sa scène, s'il a
 * sa réponse, les rangs des bonnes réponses).
 */
interface QuestionRequest {
  place: PlaceId;
  mission: string;
  layout: ScenetteLayout;
  item: { scene: ItemScene; answered: boolean; right: readonly number[]; picked: readonly number[]; sort?: SortLook };
}

/** Ce que la pose d'un pont dit à la page : le toc (toutes ses parties posées), puis sa fin (la brume levée : la phrase). */
export interface BridgeLayEvents {
  tap(): void;
  laid(): void;
}

/** Le cadenas du pont d'une terre fermée, à l'écran : en pixels, et s'il se voit. */
export interface LockOnScreen {
  land: LinkedLand;
  x: number;
  y: number;
  shown: boolean;
}

/**
 * Sur la Carte, un lieu, l'Escale (`port`), le pont d'une terre (`pont-<terre>`) ou Kéo (`keo`) à l'écran : son point (le
 * bas de son étiquette), en pixels, et s'il se voit.
 */
export interface MapSpotOnScreen {
  id: PlaceId | 'port' | 'keo' | BridgeSpot;
  x: number;
  y: number;
  shown: boolean;
}

/** Un repère de la scène à l'écran, en pixels. */
export interface LabelOnScreen {
  text: string;
  x: number;
  y: number;
  /** Centré sous son point (les fractions sous les deux sas de Deux rives). */
  center?: boolean;
}

/** La marge de la flèche au bord de l'écran, en pixels : hors des boutons des coins. */
const MARK_MARGIN = 56;
/** La pastille d'un habitant, à tant d'unités au-dessus de ses pieds (au-dessus de sa tête, de Kéo près de lui). */
const SIGN_LIFT = 2.4;
/** Un toucher : moins de tant de pixels de glissé, moins de tant de millisecondes. */
const TAP = { pixels: 10, ms: 700 };
/** Le cap de Kéo au départ : face à la caméra (le sud). */
const FACING_CAMERA = Math.PI;
/**
 * Kéo un peu plus grand que dans le monde en grille, et un anneau clair au sol autour de ses pieds : on le trouve sans
 * chercher (directeur artistique, 14 octobre 2026).
 */
const KEO_SCALE = 1.25;
const KEO_RING = { inner: 0.85, outer: 1.3, color: 0xfff6dc };
/**
 * L'ombre peinte de Kéo (lot 3) : un disque de `radius`, décalé de `shift` du côté opposé au soleil, dans le creux de
 * l'anneau (jamais sur lui) ; un bleu-vert sombre, transparent, jamais noir ; un rien sous l'anneau (`below`).
 */
const KEO_SHADOW = { radius: 0.5, sides: 10, shift: 0.26, color: 0x1f3d3b, opacity: 0.3, below: 0.01 } as const;
/**
 * Le déplacement libre (GD-20, « Le déplacement libre », lot 1) : la marque au sol là où va Kéo, un anneau plus petit
 * que le sien, de la même couleur claire, sans texte, posé jusqu'à l'arrivée ; de loin, jamais moins de `minPx` pixels
 * de rayon à l'écran (grandie jusqu'à `maxScale` fois), et un toucher qui ne fait pas bouger Kéo la montre `pulseMs` ms
 * (référent dys, consultant UX UI). Sa silhouette, de la même couleur, se voit à travers ce qui le cache (un arbre, une
 * colline, un lieu), jamais sur lui. La grille de ce qui se marche se tire par tranches au repos, `WALK_GRID_DELAY` ms
 * après l'arrivée dans le monde (ou d'un coup au premier toucher qui en a besoin).
 */
const FREE_MARK = { inner: 0.45, outer: 0.75, segments: 20, minPx: 22, maxScale: 2.5, pulseMs: 800 } as const;
const KEO_SILHOUETTE = { color: KEO_RING.color, opacity: 0.6 } as const;
const WALK_GRID_DELAY = 2500;
/** La couche de Kéo : dessiné à part, pour que sa silhouette se voie à travers le décor. */
const KEO_LAYER = 1;
/**
 * La caméra qui tourne autour de Kéo (GD-20, « Le déplacement libre », rotation libre à deux doigts, choix du mainteneur
 * du 18 octobre 2026) : un cran des boutons (un huitième de tour), en `seconds` ; les anneaux de tuiles refaits quand
 * elle a tourné de plus de `rings` depuis leur dernier tirage ; deux doigts qui tournent de moins de `deadAngle` ne la
 * tournent pas encore (un pincement ou deux doigts posés ne la bougent pas).
 */
const CAMERA_TURN = { step: Math.PI / 4, seconds: 0.35, rings: Math.PI / 8, deadAngle: 0.2 } as const;
/**
 * La finesse du rendu : l'anticrénelage reste (la scène est légère, quelques milliers de triangles) ; le rapport de
 * pixels est plafonné à 2, puis ramené à 1 si l'appareil peine (des images de plus de 45 ms, trente de suite), comme
 * le monde en grille (../loop.ts).
 */
const SLOW_FRAME_MS = 45;
const SLOW_FRAMES = 30;
/** Les anneaux du terrain se refont quand le point suivi s'est éloigné de tant d'unités de leur centre. */
const RING_MOVE = 3;
/**
 * La réussite d'une scénette posée (les Quais, les Filets, les Écluses) : l'objet qui va à sa place (la caisse dans la
 * barque, le panier plein, la barque qui passe la porte), puis la lumière (la lanterne de proue des Quais) ; 1,5 s en
 * tout.
 */
const FINALE_MOVE_SECONDS = 0.8;
const FINALE_LAMP_SECONDS = 0.7;
/**
 * La partie qui descend, éclaircie (une lueur ajoutée à son matériau) : on la distingue d'un coup d'œil de ce qui est
 * déjà posé ; posée, elle reprend les couleurs du lieu.
 */
const POSE_GLOW = 0x4a4232;
/** Le cadenas d'un lieu se tient au bord de l'écran de tant de pixels au moins, sinon il ne se montre pas. */
const LOCK_MARGIN = 24;
/** À gauche, le cadenas se tient hors de la bande de la colonne des accès directs (72 px), sa moitié comprise. */
const LOCK_LEFT = 72 + LOCK_MARGIN;
/** Le cadenas d'un pont se pose de tant d'unités au-dessus de son tablier. */
const LOCK_LIFT = 1.6;
/**
 * Kéo arrêté sur la culée d'un pont à rebâtir : la caméra vise à cette part du chemin de Kéo au milieu de l'eau (le
 * cadenas et la culée jumelle restent dans l'image, Kéo aussi).
 */
const BRIDGE_AIM = 0.6;
/** Sous un panneau ouvert, la caméra garde dans la part libre le lieu à cette hauteur au-dessus de son pied. */
const FRAMED_PLACE_HEIGHT = 2;
/** La fiche d'une terre fermée garde son pont dans la part libre quand Kéo se tient à moins de tant d'unités de lui. */
const FRAMED_BRIDGE_NEAR = 12;
/** Le bout de la caméra qui suit Kéo, et celui de la Carte (l'île entière, de haut), en unités. */
const FOLLOW_FAR = 500;
const MAP_FAR = 2000;
/** Le rayon du dôme du ciel : en deçà du bout de la caméra qui suit Kéo (`FOLLOW_FAR`). */
const SKY_RADIUS = 450;
/** Sur la Carte, la brume du lointain commence au-delà de l'île : rien ne s'y efface (sans refaire les shaders). */
const MAP_FOG = 5000;
/** Sur la Carte, un toucher choisit le lieu le plus proche à moins de tant de pixels. */
const MAP_TOUCH = 56;
/** Les tuiles de la Carte faites au repos : sans `requestIdleCallback`, une tranche de tant de ms tous les tant de ms. */
const IDLE_SLICE_MS = 6;
const IDLE_DELAY_MS = 40;
/**
 * La scénette d'assemblage (GD-20, lot 2), en secondes : les pièces se joignent sur l'établi, puis le bloc assemblé
 * monte et va se coucher sur le râtelier, en arc bas (sous le toit de la halle, que la caméra voit de haut) ; d'un coup avec « Réduire les animations ».
 */
const ASSEMBLY = { join: 0.6, carry: 1.3, arc: 0.7 } as const;
/** Sur la Carte, un lieu ne se montre qu'à tant de pixels des bords gauche et droit, et du haut (son nom au-dessus). */
const MAP_LABEL_SIDE = 100;
const MAP_LABEL_TOP = 64;
/**
 * Les images, au plus, où la Carte qui s'ouvre attend que ses étiquettes choisissent sa vue de départ avant de se
 * dessiner (une ou deux d'habitude : le temps de mesurer les étiquettes) ; au-delà, elle se dessine telle quelle.
 */
const MAP_SETTLE_FRAMES = 10;
/** La molette au repos depuis tant de millisecondes : la Carte est à l'arrêt (ses étiquettes se posent avec la reprise). */
const MAP_WHEEL_REST = 150;

/** Le plus haut point d'un maillage (−∞ s'il est vide). */
function topOf(f: Facets): number {
  let top = -Infinity;
  for (let k = 1; k < f.positions.length; k += 3) top = Math.max(top, f.positions[k]);
  return top;
}

/** Une géométrie à facettes (positions, normales, couleurs de sommet), sa boîte englobante juste. */
function geometryOf(f: Facets): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(f.positions, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(f.normals, 3));
  g.setAttribute('color', new THREE.BufferAttribute(f.colors, 3));
  g.computeBoundingBox();
  g.computeBoundingSphere();
  return g;
}

/** Un maillage immobile : sa matrice calculée une fois. */
function still<M extends THREE.Object3D>(mesh: M): M {
  mesh.matrixAutoUpdate = false;
  mesh.updateMatrix();
  return mesh;
}

/**
 * Un anneau du terrain : un seul maillage, dont les tableaux sont faits une fois (et agrandis s'il le faut) ; on y
 * recopie les tuiles de l'anneau quand il change, et on ne dessine que ce qui est rempli (`drawRange`). Sa boîte
 * englobante est celle de ses tuiles : l'élimination hors champ reste juste.
 */
class RingMesh {
  readonly mesh: THREE.Mesh;
  private capacity = 0;
  private positions = new THREE.BufferAttribute(new Float32Array(0), 3);
  private normals = new THREE.BufferAttribute(new Float32Array(0), 3);
  private colors = new THREE.BufferAttribute(new Float32Array(0), 3);
  private readonly box = new THREE.Box3();
  private readonly sphere = new THREE.Sphere();
  private readonly corner = new THREE.Vector3();

  constructor(material: THREE.Material, initialTriangles: number) {
    this.mesh = still(new THREE.Mesh(new THREE.BufferGeometry(), material));
    this.allocate(initialTriangles);
  }

  private allocate(triangles: number): void {
    this.mesh.geometry.dispose();
    const g = new THREE.BufferGeometry();
    const attribute = () => new THREE.BufferAttribute(new Float32Array(triangles * 9), 3).setUsage(THREE.DynamicDrawUsage);
    this.positions = attribute();
    this.normals = attribute();
    this.colors = attribute();
    g.setAttribute('position', this.positions);
    g.setAttribute('normal', this.normals);
    g.setAttribute('color', this.colors);
    // La boîte et la sphère de l'anneau sont celles de ses tuiles (tenues ici) : Three.js ne les recalcule pas.
    g.boundingBox = this.box;
    g.boundingSphere = this.sphere;
    this.mesh.geometry = g;
    this.capacity = triangles;
  }

  set(tiles: readonly Tile[]): void {
    let total = 0;
    for (const t of tiles) total += t.facets.triangles;
    if (total > this.capacity) this.allocate(Math.ceil(total * 1.25));
    const { positions, normals, colors, box, corner } = this;
    box.makeEmpty();
    let offset = 0;
    for (const t of tiles) {
      if (!t.facets.triangles) continue;
      positions.array.set(t.facets.positions, offset);
      normals.array.set(t.facets.normals, offset);
      colors.array.set(t.facets.colors, offset);
      offset += t.facets.positions.length;
      box.expandByPoint(corner.fromArray(t.min));
      box.expandByPoint(corner.fromArray(t.max));
    }
    for (const a of [positions, normals, colors]) {
      a.clearUpdateRanges();
      a.addUpdateRange(0, offset);
      a.needsUpdate = true;
    }
    this.mesh.geometry.setDrawRange(0, offset / 3);
    if (offset) box.getBoundingSphere(this.sphere);
    this.mesh.visible = offset > 0;
  }

  dispose(): void {
    this.mesh.geometry.dispose();
  }
}

/**
 * Le matériau de la brume : sans lumière, sa couleur et sa transparence par sommet, et ce qu'on en voit de biais
 * s'efface (la silhouette du banc reste douce, jamais un bord net). Une ligne de plus dans le shader de base de
 * Three.js, aucun appel de plus.
 */
function veilMaterialOf(): THREE.MeshBasicMaterial {
  const m = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false });
  m.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vVeilNormal;\nvarying vec3 vVeilView;')
      .replace('#include <fog_vertex>', '#include <fog_vertex>\nvVeilNormal = normalize( normalMatrix * normal );\nvVeilView = normalize( -mvPosition.xyz );');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vVeilNormal;\nvarying vec3 vVeilView;')
      .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.a *= mix( 0.3, 1.0, smoothstep( 0.0, 0.15, abs( dot( normalize( vVeilNormal ), normalize( vVeilView ) ) ) ) );');
  };
  return m;
}

/**
 * Les ailes de la pompe à vent des Marais salants (la trace de la Pente graduée, lot L5) tournent autour de leur moyeu,
 * face au sud, dans le matériau des lieux : les sommets de leur couleur (`SALT_PUMP.vane`, que rien d'autre ne prend
 * dans le monde) tournent dans le shader, d'un angle que la boucle d'image avance (`vaneAngle`), sans maillage ni appel
 * de plus. À l'arrêt avec « Réduire les animations », et sur la Carte (elle ne se redessine qu'à la demande).
 */
const VANE = { turn: 0.5 } as const;

/**
 * Le rotor de la Turbine (lot L6a) tourne de même autour de son moyeu, face au sud (ses deux teintes,
 * `ENGINE_ROTOR_COLORS`, que rien d'autre ne prend dans le monde), lentement : son angle n'avance pas pendant une
 * question (scène ou « Vue simple »), avec « Réduire les animations », ni sur la Carte (redessinée à la demande, il y
 * sauterait d'un cran à chaque glissé) ; il reprend où il s'était arrêté.
 */
const ROTOR = { turn: 0.35 } as const;

/**
 * Les faces de la couleur de la lampe (`LAMP_COLOR`, #FFD36B : la lanterne du Phare, les lampes de sa galerie, la
 * lanterne de proue de la barque des Quais) se dessinent sans ombre, de leur couleur même, au soleil comme à l'ombre :
 * elles se lisent comme des lumières (directeur artistique), sans maillage ni appel de plus. Les autres faces gardent
 * leur lumière ; la couleur de la lampe n'est prise par rien d'autre dans le monde. La vapeur de la Turbine aussi
 * (`STEAM_COLORS`, lot L6a : des aplats clairs, jamais gris foncé à l'ombre), et le papier des feuilles de l'Imprimerie
 * (`PAPER_COLOR`, lot L7 : il se lit comme du papier, jamais comme une dalle de la cour), et le sable des sentiers
 * (`COLORS_6E.path`, lot 3 des vraies terres : il se lit sur la prairie claire au soleil comme à contre-jour). Les
 * ailes de la pompe à vent y tournent (`VANE`), et le rotor de la Turbine (`ROTOR`) : `vaneAngle` et `rotorAngle` sont
 * partagés par les matériaux du monde.
 */
function unshadedLamp(m: THREE.MeshLambertMaterial, vaneAngle: { value: number }, rotorAngle: { value: number }): THREE.MeshLambertMaterial {
  const [r, g, b] = linearRgb(LAMP_COLOR);
  const [vr, vg, vb] = linearRgb(SALT_PUMP.vane);
  const [rotorDisc, rotorRim] = ENGINE_ROTOR_COLORS.map((c) => new THREE.Vector3(...linearRgb(c)));
  const hub = saltPumpHub();
  const rotorHub = engineRotorHub();
  m.onBeforeCompile = (shader) => {
    shader.uniforms.lampColor = { value: new THREE.Vector3(r, g, b) };
    shader.uniforms.steamColor = { value: new THREE.Vector3(...linearRgb(STEAM_COLORS[0])) };
    shader.uniforms.steamShade = { value: new THREE.Vector3(...linearRgb(STEAM_COLORS[1])) };
    shader.uniforms.paperColor = { value: new THREE.Vector3(...linearRgb(PAPER_COLOR)) };
    shader.uniforms.pathColor = { value: new THREE.Vector3(...linearRgb(COLORS_6E.path)) };
    shader.uniforms.vaneColor = { value: new THREE.Vector3(vr, vg, vb) };
    shader.uniforms.vanePivot = { value: new THREE.Vector2(hub.x, hub.y) };
    shader.uniforms.vaneAngle = vaneAngle;
    shader.uniforms.rotorColor = { value: rotorDisc };
    shader.uniforms.rotorRim = { value: rotorRim };
    shader.uniforms.rotorPivot = { value: new THREE.Vector2(rotorHub.x, rotorHub.y) };
    shader.uniforms.rotorAngle = rotorAngle;
    // Garde : si Three.js renomme ses morceaux de shader, la lampe redevient ombrée ; on le dit en développement.
    if (import.meta.env.DEV && !shader.fragmentShader.includes('#include <opaque_fragment>')) console.warn('unshadedLamp : #include <opaque_fragment> introuvable, la lampe reste ombrée');
    if (import.meta.env.DEV && !shader.vertexShader.includes('#include <begin_vertex>')) console.warn('unshadedLamp : #include <begin_vertex> introuvable, les ailes de la pompe restent fixes');
    // Les sommets des ailes tournent autour du moyeu, dans le plan face au sud (x, y du monde : les lieux y sont posés
    // tels quels, sans déplacement de leur maillage).
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform vec3 vaneColor;\nuniform vec2 vanePivot;\nuniform float vaneAngle;\nuniform vec3 rotorColor;\nuniform vec3 rotorRim;\nuniform vec2 rotorPivot;\nuniform float rotorAngle;')
      .replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\n#ifdef USE_COLOR\nif ( all( lessThan( abs( color.rgb - vaneColor ), vec3( 0.004 ) ) ) ) {\n\tvec2 vaneD = transformed.xy - vanePivot;\n\tfloat vaneC = cos( vaneAngle ), vaneS = sin( vaneAngle );\n\ttransformed.xy = vanePivot + vec2( vaneC * vaneD.x - vaneS * vaneD.y, vaneS * vaneD.x + vaneC * vaneD.y );\n} else if ( all( lessThan( abs( color.rgb - rotorColor ), vec3( 0.004 ) ) ) || all( lessThan( abs( color.rgb - rotorRim ), vec3( 0.004 ) ) ) ) {\n\tvec2 rotorD = transformed.xy - rotorPivot;\n\tfloat rotorC = cos( rotorAngle ), rotorS = sin( rotorAngle );\n\ttransformed.xy = rotorPivot + vec2( rotorC * rotorD.x - rotorS * rotorD.y, rotorS * rotorD.x + rotorC * rotorD.y );\n}\n#endif',
      );
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 lampColor;\nuniform vec3 steamColor;\nuniform vec3 steamShade;\nuniform vec3 paperColor;\nuniform vec3 pathColor;')
      .replace(
        '#include <opaque_fragment>',
        'if ( all( lessThan( abs( vColor.rgb - lampColor ), vec3( 0.004 ) ) ) || all( lessThan( abs( vColor.rgb - steamColor ), vec3( 0.004 ) ) ) || all( lessThan( abs( vColor.rgb - steamShade ), vec3( 0.004 ) ) ) || all( lessThan( abs( vColor.rgb - paperColor ), vec3( 0.004 ) ) ) || all( lessThan( abs( vColor.rgb - pathColor ), vec3( 0.004 ) ) ) ) outgoingLight = vColor.rgb;\n#include <opaque_fragment>',
      );
  };
  return m;
}

/**
 * Le matériau de l'eau (reprise du lot 3) : l'image de l'eau porte trois champs (le cœur des bras de mer, l'eau claire,
 * le palier du milieu au large, ./world/continu/sea.ts) ; le shader les lit interpolés et tranche net sur leur ligne
 * zéro, adoucie d'un pixel d'écran (`fwidth`) : quatre paliers francs, au contour lisse qui épouse le bras, jamais une flaque pixellisée. Une ligne de
 * shader, aucun appel ni aucune image de plus.
 */
function seaMaterialOf(map: THREE.DataTexture): THREE.MeshBasicMaterial {
  const m = new THREE.MeshBasicMaterial({ map });
  const tone = (hex: number) => new THREE.Vector3(...linearRgb(hex));
  m.onBeforeCompile = (shader) => {
    shader.uniforms.seaClear = { value: tone(WATER_TONES.clear) };
    shader.uniforms.seaLagoon = { value: tone(WATER_TONES.lagoon) };
    shader.uniforms.seaShelf = { value: tone(WATER_TONES.shelf) };
    shader.uniforms.seaNight = { value: tone(WATER_TONES.night) };
    if (import.meta.env.DEV && !shader.fragmentShader.includes('#include <map_fragment>')) console.warn('seaMaterialOf : #include <map_fragment> introuvable');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 seaClear;\nuniform vec3 seaLagoon;\nuniform vec3 seaShelf;\nuniform vec3 seaNight;')
      .replace(
        '#include <map_fragment>',
        'vec3 seaF = texture2D( map, vMapUv ).rgb - 128.0 / 255.0;\nvec3 seaW = fwidth( seaF ) * 0.75 + 1e-4;\nfloat seaN = smoothstep( -seaW.x, seaW.x, seaF.x );\nfloat seaC = smoothstep( -seaW.y, seaW.y, seaF.y );\nfloat seaM = smoothstep( -seaW.z, seaW.z, seaF.z );\ndiffuseColor.rgb *= mix( mix( mix( seaLagoon, seaShelf, seaM ), seaClear, seaC ), seaNight, seaN );',
      );
  };
  return m;
}

/** Une brume en géométrie : positions et couleurs avec leur transparence, sa boîte englobante juste. */
function veilGeometry(v: VeilMesh): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(v.positions, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(v.normals, 3));
  g.setAttribute('color', new THREE.BufferAttribute(v.colors, 4));
  g.computeBoundingBox();
  g.computeBoundingSphere();
  return g;
}

export function createOpenWorld(host: HTMLElement, options: OpenWorldOptions): OpenWorld {
  const { reduceMotion } = options;
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(host.clientWidth, host.clientHeight, false);
  host.appendChild(renderer.domElement);
  Object.assign(renderer.domElement.style, { width: '100%', height: '100%', touchAction: 'none', display: 'block' });
  const meter = createMeter(host, 'archipeo', options.meter.show, options.meter.expose);

  const scene = new THREE.Scene();
  // La brume légère d'Archipéo : le lointain, le large et l'horizon s'y fondent, de la couleur de l'horizon du ciel (GD-20,
  // point 3, lot 3 : la mer rejoint le ciel sans couture).
  const horizon = new THREE.Color(HORIZON_COLOR);
  scene.background = horizon;
  const fog = new THREE.Fog(horizon, WORLD_FOG.near, WORLD_FOG.far);
  scene.fog = fog;
  const camera = new THREE.PerspectiveCamera(40, host.clientWidth / Math.max(1, host.clientHeight), 0.5, FOLLOW_FAR);
  // Elle voit le monde et Kéo, à part sur sa couche (sa silhouette, `drawWithSilhouette`).
  camera.layers.enable(KEO_LAYER);
  // Le mappage des tons neutre : les aplats gardent leur couleur, les blancs au soleil s'adoucissent (lot 3).
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = LIGHT.exposure;

  // La lumière d'un matin clair (fiche du 6e, § 2 ; GD-20, point 3, lot 3) : une ambiance plus basse et froide, le
  // soleil chaud, bas à l'est (`LIGHT`).
  const sky0 = new THREE.HemisphereLight(LIGHT.sky, LIGHT.ground, LIGHT.ambient);
  scene.add(sky0);
  const sun = new THREE.DirectionalLight(LIGHT.sun, LIGHT.sunIntensity);
  // Les lumières éclairent aussi Kéo quand il est dessiné à part, sur sa couche.
  sky0.layers.enable(KEO_LAYER);
  sun.layers.enable(KEO_LAYER);
  sun.position.set(LIGHT.sunFrom.x, LIGHT.sunFrom.y, LIGHT.sunFrom.z);
  scene.add(sun);
  // Le ciel : un dôme en dégradé, crème à l'horizon, bleu en haut, centré sur la caméra à chaque image (sa matrice
  // seule), dessiné d'abord, sans brouillard ni profondeur : tout le reste passe devant. Un appel.
  const skyGeometry = new THREE.BufferGeometry();
  {
    const dome = skyDome(SKY_RADIUS);
    skyGeometry.setAttribute('position', new THREE.BufferAttribute(dome.positions, 3));
    skyGeometry.setAttribute('color', new THREE.BufferAttribute(dome.colors, 3));
  }
  const skyMaterial = new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, depthWrite: false, depthTest: false, side: THREE.DoubleSide });
  const sky = new THREE.Mesh(skyGeometry, skyMaterial);
  sky.matrixAutoUpdate = false;
  sky.frustumCulled = false;
  sky.renderOrder = -1;
  // Juste avant d'être dessiné, il se recentre sur la caméra de l'image (rien n'est créé).
  sky.onBeforeRender = (_r, _s, cam) => void sky.matrixWorld.setPosition(cam.position);
  scene.add(sky);

  const geometries: THREE.BufferGeometry[] = [];
  const keep = <G extends THREE.BufferGeometry>(g: G) => (geometries.push(g), g);
  keep(skyGeometry);

  // Le terrain : la carte de hauteurs, et deux anneaux de tuiles autour de Kéo (de près, chaque case ; de loin, une
  // sur trois), chacun un seul maillage, d'un seul matériau.
  const field = buildHeightField();
  // Le sol dessiné, ou la pierre de l'Escale (son quai, sa place) là où Kéo y marche.
  const ground = (x: number, z: number) => portFloor(x, z) ?? heightOnMesh(field, x, z);
  // L'angle des ailes de la pompe à vent des Marais salants, avancé par la boucle d'image (partagé par les deux matériaux).
  const vaneAngle = { value: 0 };
  // L'angle du rotor de la Turbine, avancé de même, sauf pendant une question.
  const rotorAngle = { value: 0 };
  const landMaterial = unshadedLamp(new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }), vaneAngle, rotorAngle);
  // Le lieu suivant n'est pas pris dans la brume : de loin, c'est lui qu'on voit.
  const landmarkMaterial = unshadedLamp(new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, fog: false }), vaneAngle, rotorAngle);
  const tiles = createTileStore(field);
  const nearRing = new RingMesh(landMaterial, 9000);
  const farRing = new RingMesh(landMaterial, 6000);
  scene.add(nearRing.mesh, farRing.mesh);
  const touchables: THREE.Object3D[] = [nearRing.mesh, farRing.mesh];

  // La mer et le lagon : un plan d'eau à 0, peint par l'image de l'eau ; au-delà, le bord de l'image (le large).
  const seaTexture = new THREE.DataTexture(seaPixels(), SEA_TEXTURE.size, SEA_TEXTURE.size);
  // Des champs, pas des couleurs : lus tels quels, interpolés.
  seaTexture.colorSpace = THREE.NoColorSpace;
  seaTexture.magFilter = THREE.LinearFilter;
  seaTexture.minFilter = THREE.LinearFilter;
  seaTexture.needsUpdate = true;
  const seaSize = 2000;
  const seaGeometry = keep(new THREE.PlaneGeometry(seaSize, seaSize).rotateX(-Math.PI / 2));
  // Les coordonnées de l'image suivent x et z du monde : le carré de l'image au milieu, son bord étiré au-delà.
  const uv = seaGeometry.getAttribute('uv') as THREE.BufferAttribute;
  const pos = seaGeometry.getAttribute('position') as THREE.BufferAttribute;
  for (let k = 0; k < uv.count; k++) uv.setXY(k, (pos.getX(k) + SEA_TEXTURE.half) / (2 * SEA_TEXTURE.half), (pos.getZ(k) + SEA_TEXTURE.half) / (2 * SEA_TEXTURE.half));
  uv.needsUpdate = true;
  const seaMaterial = seaMaterialOf(seaTexture);
  const sea = still(new THREE.Mesh(seaGeometry, seaMaterial));
  scene.add(sea);
  touchables.push(sea);

  // Les chemins : sentiers, digue et pontons, un seul maillage, jusqu'aux culées des ponts (GD-20, point 3, « vraies
  // terres » : les ponts sont dans le maillage des lieux).
  const paths = still(new THREE.Mesh(keep(geometryOf(pathRibbons(ground))), landMaterial));
  scene.add(paths);
  touchables.push(paths);

  // Les lieux (GD-20, lot 1) : chacun se rebâtit lui-même ; leurs ruines, leurs parties posées et les traces des
  // scénettes des quatre lieux, réunies en un maillage (posées dans le monde) ; le lieu suivi, seul hors de la brume,
  // dans un second, de son matériau sans brouillard ; la partie qui se pose, dans un troisième, le temps de sa descente,
  // plus claire que ce qui est déjà posé (son matériau éclairci, sans brouillard). Refaits quand un lieu change, jamais
  // par image.
  const feet = new Map<PlaceId, THREE.Vector3>();
  const ruins = new Map<PlaceId, Facets>();
  const ruinTops = new Map<PlaceId, number>();
  for (const place of PLACES) {
    const y = standingHeight(ground(place.center.x, place.center.z));
    const ruin = ruinFacets(place.id, ground);
    ruins.set(place.id, ruin);
    ruinTops.set(place.id, topOf(ruin));
    feet.set(place.id, new THREE.Vector3(place.center.x, y, place.center.z));
  }
  // La marque de la prochaine mission, au-dessus du lieu tel qu'il est bâti (sa ruine, puis plus haut à chaque étape) ;
  // au Phare entier, à côté de la lanterne. Le haut de la lanterne, que le regard levé cadre près du Phare, suit aussi.
  const marks = new Map<PlaceId, THREE.Vector3>();
  for (const [id, foot] of feet) {
    const o = markOffset(id);
    marks.set(id, new THREE.Vector3(foot.x + o.x, foot.y + o.y, foot.z + o.z));
  }
  // Les lieux hauts dont le regard se lève pour cadrer le haut à l'arrivée : la lanterne du Phare ; le toit et le mât de
  // la Vigie (lot L7). `lanternTop` : le haut du plus proche, que `lookUp` cadre.
  const TALL: readonly PlaceId[] = ['phare', 'lookout'];
  const tallTops = new Map<PlaceId, Vec3>(TALL.map((id) => [id, { x: placeById(id).center.x, y: feet.get(id)!.y + modelOfPlace(id).top, z: placeById(id).center.z }]));
  const lanternTop: Vec3 = { ...tallTops.get('phare')! };
  /** La hauteur bâtie de chaque lieu, au-dessus de son pied (le lieu entier tant que la page n'a rien dit). */
  const builtTop = new Map<PlaceId, number>();
  const whole = (id: PlaceId) => (builtTop.get(id) ?? modelOfPlace(id).top) >= modelOfPlace(id).top - 0.5;
  /** Reporte la hauteur bâtie d'un lieu sur sa marque (et, au Phare et à la Vigie, sur le haut que le regard levé cadre). */
  const setBuiltTop = (id: PlaceId, top: number) => {
    if (builtTop.get(id) === top) return;
    builtTop.set(id, top);
    const foot = feet.get(id)!;
    const o = markOffset(id);
    const mark = marks.get(id)!;
    if (whole(id)) mark.set(foot.x + o.x, foot.y + o.y, foot.z + o.z);
    else mark.set(foot.x, foot.y + top + MARK_LIFT, foot.z);
    const tallTop = tallTops.get(id);
    if (tallTop) tallTop.y = foot.y + top;
  };
  const placesMesh = still(new THREE.Mesh(new THREE.BufferGeometry(), landMaterial));
  const landmarkMesh = still(new THREE.Mesh(new THREE.BufferGeometry(), landmarkMaterial));
  const poseMaterial = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, fog: false, emissive: POSE_GLOW });
  const poseMesh = new THREE.Mesh(new THREE.BufferGeometry(), poseMaterial);
  // La lumière de la lanterne du Phare, allumée (son haut posé) : réunie aux lieux, de la couleur
  // de la lampe, que leurs matériaux dessinent sans ombre (`unshadedLamp`) ; aucun appel de plus.
  const lampFacets = placeFacets(lanternLight(), feet.get('phare') ?? new THREE.Vector3());
  let lampShown = false;
  placesMesh.visible = false;
  landmarkMesh.visible = false;
  poseMesh.visible = false;
  scene.add(placesMesh, landmarkMesh, poseMesh);
  touchables.push(placesMesh, landmarkMesh);
  // La remise (lot L1) : l'aménagement qui se pose, à part, du matériau des lieux (posé, il est déjà tel qu'au retour :
  // rien ne s'allume) ; ses éléments posés par la plage de dessin, celui qui descend dans le maillage de la réaction. Un
  // appel de plus, le temps de la remise seulement.
  const remiseMesh = still(new THREE.Mesh(new THREE.BufferGeometry(), landMaterial));
  remiseMesh.visible = false;
  scene.add(remiseMesh);

  // La brume sur les terres fermées : un seul maillage, refait quand la liste change (jamais par image) ; sans lumière,
  // de la couleur du lointain, transparente par sommet (jamais opaque, effacée sur ses bords). Quand on relie une terre,
  // la sienne part d'un coup (le fondu viendra avec la pose en trois temps, au second lot).
  const veilMaterial = veilMaterialOf();
  const veilMesh = still(new THREE.Mesh(new THREE.BufferGeometry(), veilMaterial));
  veilMesh.visible = false;
  // Après le reste : elle se pose par-dessus ce qu'elle voile.
  veilMesh.renderOrder = 1;
  scene.add(veilMesh);
  const setVeilGeometry = (mesh: THREE.Mesh, v: VeilMesh) => {
    mesh.geometry.dispose();
    mesh.geometry = veilGeometry(v);
    mesh.visible = v.triangles > 0;
  };
  // Les terres (GD-20, point 3, « vraies terres, vrais ponts ») : les terres fermées, et ce qui en est montré (la brume,
  // les cadenas, les ponts tombés ou rebâtis).
  let closed: readonly LinkedLand[] = [];
  let veilKey = '';
  // La pose d'un pont (GD-20, point 3, « La pose ») : ce qui se relève (`lay`, ses sommets à part dans le maillage de
  // pose), son début, ce que la page attend ; le toc dit. `pendingLay` : annoncée, en attente des terres.
  let laying: { lay: BridgeLay; start: number; events: BridgeLayEvents; tapped: boolean; drawn: number } | null = null;
  let pendingLay: { land: LinkedLand; events: BridgeLayEvents } | null = null;
  const layState: BridgeLayState = { landed: false, fade: 0, done: false };
  // Les terres où Kéo ne passe pas : les fermées, et celle dont le pont se pose (il ne passe qu'à la fin).
  let walkClosed: readonly LinkedLand[] = [];
  // Le pont devant lequel la caméra reste cadrée après sa pose, Kéo toujours sur sa culée : elle ne bouge pas tant
  // qu'il ne repart pas.
  let heldBridge: LinkedLand | null = null;
  // La transparence de la brume qui se lève, à ses sommets (refaite avec la brume, jamais par image).
  let veilAlphas: Float32Array | null = null;
  let veilFadeFrom = 0;

  // Kéo : le corps du bonhomme d'Archipéo (sa marche existante), son anneau clair au sol ; habillé dès que sa tenue est chargée.
  const keo = new THREE.Group();
  scene.add(keo);
  let body: CorpsDuBonhomme = corpsDuBonhomme('6e');
  keo.add(body.mesh);
  body.mesh.layers.set(KEO_LAYER);
  let disposed = false;
  if (!loadedKeo('6e'))
    void loadKeo('6e').then(() => {
      if (disposed || !loadedKeo('6e')) return;
      body.dispose();
      body = corpsDuBonhomme('6e');
      keo.add(body.mesh);
      body.mesh.layers.set(KEO_LAYER);
      mapDirty = true;
    });
  keo.scale.setScalar(KEO_SCALE);
  // L'habitant de la scénette en modèle 3D (./habitantModels.ts) : un maillage texturé à part, un appel ; sa texture
  // envoyée à la carte graphique dès qu'elle est décodée (à l'approche du lieu), jamais au premier dessin de la scénette.
  // Fait ici, avant tout ce qui l'appelle (`setFrame`, l'entrée et la sortie d'une scénette, `dispose`).
  const habitants = createHabitantModels(scene, (t) => renderer.initTexture(t));
  const ringGeometry = keep(new THREE.RingGeometry(KEO_RING.inner, KEO_RING.outer, 24).rotateX(-Math.PI / 2));
  // L'anneau épouse le sol (directeur artistique) : ses sommets suivent le sol dessiné, refaits quand Kéo bouge ; sa
  // sphère englobante tient les pentes.
  const ringPosition = ringGeometry.getAttribute('position') as THREE.BufferAttribute;
  const ringXZ = new Float32Array(ringPosition.count * 2);
  for (let i = 0; i < ringPosition.count; i++) {
    ringXZ[2 * i] = ringPosition.getX(i);
    ringXZ[2 * i + 1] = ringPosition.getZ(i);
  }
  const ringY = new Float32Array(ringPosition.count);
  // Ce que l'anneau couvre : le sol, ou le dessus d'un chemin proche (plat en travers, il dépasse du sol d'une pente).
  const ringEdges: number[] = [];
  const ringSurface = (x: number, z: number) => Math.max(standingHeight(ground(x, z)), pathTopAt(x, z, ground, ringEdges));
  ringGeometry.computeBoundingSphere();
  // `computeBoundingSphere` vient de la calculer : elle n'est pas nulle.
  ringGeometry.boundingSphere!.radius += 2;
  const ringMaterial = new THREE.MeshBasicMaterial({ color: KEO_RING.color, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
  const ring = new THREE.Mesh(ringGeometry, ringMaterial);
  scene.add(ring);
  // L'ombre peinte de Kéo (GD-20, point 3, lot 3) : un disque sombre et transparent dans le creux de l'anneau, décalé du
  // côté opposé au soleil, qui épouse le sol comme lui ; il le suit (enfant de l'anneau), caché avec lui. Un appel.
  const shadowGeometry = keep(new THREE.CircleGeometry(KEO_SHADOW.radius, KEO_SHADOW.sides).rotateX(-Math.PI / 2).translate(SHADOW_DIR.x * KEO_SHADOW.shift, 0, SHADOW_DIR.z * KEO_SHADOW.shift));
  const shadowPosition = shadowGeometry.getAttribute('position') as THREE.BufferAttribute;
  const shadowXZ = new Float32Array(shadowPosition.count * 2);
  for (let i = 0; i < shadowPosition.count; i++) {
    shadowXZ[2 * i] = shadowPosition.getX(i);
    shadowXZ[2 * i + 1] = shadowPosition.getZ(i);
  }
  const shadowY = new Float32Array(shadowPosition.count);
  shadowGeometry.computeBoundingSphere();
  shadowGeometry.boundingSphere!.radius += 2;
  const shadowMaterial = new THREE.MeshBasicMaterial({ color: KEO_SHADOW.color, transparent: true, opacity: KEO_SHADOW.opacity, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
  ring.add(new THREE.Mesh(shadowGeometry, shadowMaterial));
  // La marque au sol du déplacement libre : posée où va Kéo, épousant le sol comme son anneau ; cachée à l'arrivée.
  const markGeometry = keep(new THREE.RingGeometry(FREE_MARK.inner, FREE_MARK.outer, FREE_MARK.segments).rotateX(-Math.PI / 2));
  const markPosition = markGeometry.getAttribute('position') as THREE.BufferAttribute;
  const markXZ = new Float32Array(markPosition.count * 2);
  for (let i = 0; i < markPosition.count; i++) {
    markXZ[2 * i] = markPosition.getX(i);
    markXZ[2 * i + 1] = markPosition.getZ(i);
  }
  const markY = new Float32Array(markPosition.count);
  const markScaledXZ = new Float32Array(markXZ.length);
  markGeometry.computeBoundingSphere();
  markGeometry.boundingSphere!.radius = FREE_MARK.outer * FREE_MARK.maxScale + 2;
  const freeMark = new THREE.Mesh(markGeometry, ringMaterial);
  freeMark.visible = false;
  scene.add(freeMark);
  const markEdges: number[] = [];
  const markSurface = (x: number, z: number) => Math.max(standingHeight(ground(x, z)), pathTopAt(x, z, ground, markEdges));
  let markScale = 0;
  let markPulse = 0;
  const markAt = new THREE.Vector3();
  /** La taille de la marque pour qu'elle garde `minPx` pixels de rayon à l'écran, vue d'où est la caméra. */
  const markScaleNow = () => {
    const d = camera.position.distanceTo(markAt);
    const px = (FREE_MARK.outer * renderer.domElement.clientHeight) / (2 * d * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
    return Math.min(FREE_MARK.maxScale, Math.max(1, FREE_MARK.minPx / Math.max(px, 1e-3)));
  };
  /** Pose la marque à sa taille, épousant le sol ; refaite seulement si la taille change assez (un dixième). */
  const fitFreeMark = (force = false) => {
    const sc = markScaleNow();
    if (!force && Math.abs(sc - markScale) < 0.1 * markScale) return;
    markScale = sc;
    freeMark.scale.set(sc, 1, sc);
    for (let i = 0; i < markXZ.length; i++) markScaledXZ[i] = markXZ[i] * sc;
    edgesNear(markAt.x, markAt.z, FREE_MARK.outer * sc, markEdges);
    ringHeights(markAt.x, markAt.z, markAt.y, markScaledXZ, markSurface, markY);
    for (let i = 0; i < markY.length; i++) markPosition.setY(i, markY[i]);
    markPosition.needsUpdate = true;
  };
  const showFreeMark = (p: Vec2 | null) => {
    window.clearTimeout(markPulse);
    freeMark.visible = p !== null;
    if (!p) return;
    markAt.set(p.x, standingHeight(ground(p.x, p.z)), p.z);
    freeMark.position.copy(markAt);
    fitFreeMark(true);
  };
  /** Un toucher qui ne fait pas bouger Kéo (il y est déjà) : la marque s'y montre un instant. */
  const pulseFreeMark = (p: Vec2) => {
    showFreeMark(p);
    markPulse = window.setTimeout(() => showFreeMark(null), FREE_MARK.pulseMs);
  };
  // La silhouette de Kéo : son corps dessiné une deuxième fois, là seulement où le décor passe devant lui.
  const silhouetteMaterial = new THREE.MeshBasicMaterial({ color: KEO_SILHOUETTE.color, transparent: true, opacity: KEO_SILHOUETTE.opacity, depthWrite: false, depthFunc: THREE.GreaterDepth, fog: false });

  // Où est Kéo, où il va.
  // Au départ, sur le chemin, à quelques pas du lieu (on voit le Phare de plus loin que sa porte) ; à l'Escale, à son
  // endroit (le quai, face à la caméra ; devant une porte, tourné vers elle).
  const startPlace = PLACES.find((p) => p.id === options.start);
  const startSpot = startPlace ? null : (options.start as PortSpot);
  let here: Vec2 = startPlace ? startOf(startPlace.door, startPlace.center).at : pathNode(portNode(startSpot!)).at;
  let walk: Walk | null = null;
  let walkTarget: PlaceId | null = null;
  let heading = startSpot ? portHeading(startSpot) : FACING_CAMERA;
  keo.rotation.y = heading;
  const keoFeet: Vec3 = { x: here.x, y: 0, z: here.z };
  const placeKeo = (p: Vec2) => {
    let y = standingHeight(ground(p.x, p.z));
    // Sur la culée d'un pont, et sur le tablier d'un pont rebâti, il marche sur la pierre et les planches.
    const floor = bridgeFloor(p.x, p.z, walkClosed);
    if (floor !== null && floor > y) y = floor;
    keo.position.set(p.x, y, p.z);
    if (ring.position.x !== p.x || ring.position.z !== p.z || ring.position.y !== y) {
      ring.position.set(p.x, y, p.z);
      edgesNear(p.x, p.z, KEO_RING.outer, ringEdges);
      ringHeights(p.x, p.z, y, ringXZ, ringSurface, ringY);
      for (let i = 0; i < ringY.length; i++) ringPosition.setY(i, ringY[i]);
      ringPosition.needsUpdate = true;
      ringHeights(p.x, p.z, y, shadowXZ, ringSurface, shadowY);
      for (let i = 0; i < shadowY.length; i++) shadowPosition.setY(i, shadowY[i] - KEO_SHADOW.below);
      shadowPosition.needsUpdate = true;
    }
    keoFeet.x = p.x;
    keoFeet.y = y;
    keoFeet.z = p.z;
  };
  placeKeo(here);

  // Ce que la caméra vise : les pieds de Kéo ; arrêté sur la culée d'un pont à rebâtir, un point entre lui et le bras de
  // mer (`BRIDGE_AIM`) : la caméra, toujours tournée vers le nord, garde à l'écran Kéo, le cadenas du pont et la culée
  // jumelle, même sur un pont qui file vers l'ouest (le Couchant ; directeur artistique, consultant UX UI, relecture du
  // lot 1). Rempli sur place, rien n'est créé à chaque image.
  const aim: Vec3 = { ...keoFeet };
  const aimed = (): Vec3 => {
    aim.x = keoFeet.x;
    aim.y = keoFeet.y;
    aim.z = keoFeet.z;
    if (walk) return aim;
    for (const land of LINKED_LANDS) {
      if (land !== heldBridge && !walkClosed.includes(land)) continue;
      const { stop, mid } = bridgeSite(land);
      if (Math.abs(here.x - stop.at.x) + Math.abs(here.z - stop.at.z) > 0.3) continue;
      aim.x += (mid.x - keoFeet.x) * BRIDGE_AIM;
      aim.z += (mid.z - keoFeet.z) * BRIDGE_AIM;
      break;
    }
    return aim;
  };
  // La caméra suit un point lissé (`focus`), monté de `lift` quand le relief cache Kéo ; une seule pose, remplie sur place.
  const focus: Vec3 = { ...keoFeet };
  // La caméra tournée autour de Kéo (GD-20, rotation libre) : `yaw`, et le tour en cours des boutons (`turning`).
  let yaw = 0;
  let turning: { from: number; to: number; start: number } | null = null;
  let lift = occlusionLift(focus, ground, yaw);
  const pose: CameraPose = followPose(focus, lift, undefined, yaw);
  // La taille de l'écran est relue au redimensionnement seulement (rien n'est lu ni créé à chaque image).
  let viewW = Math.max(1, host.clientWidth);
  let viewH = Math.max(1, host.clientHeight);
  // Le décalage de l'image d'une question, en pixels (refait seulement quand il change).
  const appliedShift = { x: 0, y: 0 };
  const shift = { x: 0, y: 0 };
  const setShift = (s: { x: number; y: number }) => {
    shift.x = s.x;
    shift.y = s.y;
  };
  // La dernière pose posée : le départ de la descente dans une scénette.
  const current: CameraPose = { position: { x: 0, y: 0, z: 0 }, target: { x: 0, y: 0, z: 0 }, fov: 0, lens: 0 };
  const copyPose = (from: CameraPose, to: CameraPose) => {
    Object.assign(to.position, from.position);
    Object.assign(to.target, from.target);
    to.fov = from.fov;
    to.lens = from.lens;
    return to;
  };
  const applyPose = (p: CameraPose) => {
    copyPose(p, current);
    camera.position.set(p.position.x, p.position.y, p.position.z);
    camera.up.set(0, 1, 0);
    camera.lookAt(p.target.x, p.target.y, p.target.z);
    if (p.fov !== camera.fov) {
      // Le champ change (une question, son retour) : la projection est refaite, avec le décalage.
      camera.fov = p.fov;
      appliedShift.x = Number.NaN;
    }
    const x = shift.x;
    const y = shift.y;
    if (x === appliedShift.x && y === appliedShift.y) return;
    appliedShift.x = x;
    appliedShift.y = y;
    // Les deux refont la projection.
    if (x === 0 && y === 0) camera.clearViewOffset();
    else camera.setViewOffset(viewW, viewH, x, y, viewW, viewH);
  };
  // Le regard levé près du Phare (`lookUp`) : sa part, de 0 à 1 ; le haut de la lanterne.
  const nearLantern = () => {
    if (walk) return false;
    const near = TALL.find((id) => distance(here, placeById(id).center) < LOOK_UP.within);
    if (near) Object.assign(lanternTop, tallTops.get(near)!);
    return near !== undefined;
  };
  let look = nearLantern() ? 1 : 0;
  // Le retour d'une scénette (aux Quais) : Kéo reste sur le bord du quai, la caméra garde la barque chargée dans le
  // champ (`back`, de 0 à 1) tant qu'il ne repart pas ; elle rejoint alors la caméra qui suit.
  let exit: (NonNullable<ReturnType<typeof scenetteExit>> & { view?: ExitView }) | null = null;
  let back = 0;
  const atExit = () => !walk && exit !== null && distance(here, exit.at) < 0.05;
  const follow = () => {
    followPose(focus, lift, pose, yaw);
    lookUp(pose, lanternTop, keoFeet, look, viewH);
    if (exit) exitView(pose, exit.keep, keoFeet, back, exit.view);
    applyPose(pose);
  };
  follow();
  /**
   * Tourne la caméra autour de Kéo, à l'angle `to` : la vue du retour d'une scénette se rend (la caméra qui suit reprend
   * la main), la boussole de la page suit.
   */
  const setYaw = (to: number) => {
    const y = wrapAngle(to);
    if (y === yaw) return;
    yaw = y;
    exit = null;
    back = 0;
    options.onYaw?.(yaw);
  };
  /** La caméra d'un coup vers le nord (l'arrivée d'un « Y aller », l'Escale, une scénette). */
  const faceNorth = () => {
    turning = null;
    setYaw(0);
  };
  /** Un tour des boutons : vers `to`, par le plus court, en douceur ; d'un coup avec « Réduire les animations ». */
  const turnTo = (to: number) => {
    if (reduceMotion) {
      turning = null;
      setYaw(to);
      return;
    }
    turning = { from: yaw, to: yaw + wrapAngle(to - yaw), start: performance.now() };
  };
  /** Le tour des boutons, à l'image `now` : départ et arrivée en douceur. */
  const stepTurn = (now: number) => {
    if (!turning) return;
    const u = Math.min(1, (now - turning.start) / (CAMERA_TURN.seconds * 1000));
    const k = u * u * (3 - 2 * u);
    setYaw(turning.from + (turning.to - turning.from) * k);
    if (u >= 1) turning = null;
  };
  // Un panneau ouvert (l'Escale, GD-20, lot 2 ; un lieu et sa liste de missions, point 8) : la part de l'écran qu'il
  // laisse, et l'endroit dont la caméra y garde le sujet (la porte, la galerie, l'établi ; le lieu, ou la trace que la
  // scénette vient de laisser), par un décalage de l'image, calculé à l'ouverture (Kéo ne bouge pas tant que le panneau
  // est ouvert), jamais à chaque image.
  let framed: PortSpot | PlaceId | null = startPlace?.id ?? startSpot;
  let frameRect: { left: number; top: number; width: number; height: number } | null = null;
  const subjectOf = (spot: PortSpot | PlaceId): Vec3 | null => {
    const place = PLACES.find((p) => p.id === spot);
    if (!place) return portSubject(spot as PortSpot, port?.trophies.length ?? 0);
    // La fiche d'une terre fermée : le pont à rebâtir d'abord, si Kéo se tient devant (de loin, la caméra reste où elle est).
    const land = landOf(place.id);
    if (land !== START_LAND && closed.includes(land)) {
      const s = bridgeSite(firstClosed(land, closed));
      return distance(here, s.mid) < FRAMED_BRIDGE_NEAR ? { x: s.mid.x, y: BRIDGE.deck, z: s.mid.z } : null;
    }
    if (exit && atExit()) return exit.keep;
    const foot = feet.get(place.id);
    return { x: place.center.x, y: (foot?.y ?? 0) + FRAMED_PLACE_HEIGHT, z: place.center.z };
  };
  const reframe = () => {
    if (!frameRect || !framed || asked || remise || mapView) return;
    followPose(focus, lift, pose, yaw);
    lookUp(pose, lanternTop, keoFeet, look, viewH);
    if (exit) exitView(pose, exit.keep, keoFeet, back, exit.view);
    const subject = subjectOf(framed);
    const p = subject && screenOf(pose, subject, viewW, viewH);
    setShift(p ? { x: Math.round(p.x - (frameRect.left + frameRect.width / 2)), y: Math.round(p.y - (frameRect.top + frameRect.height / 2)) } : { x: 0, y: 0 });
    follow();
  };
  const setFrame = (free: typeof frameRect, place?: PlaceId) => {
    frameRect = free;
    if (place) framed = place;
    // Le panneau d'un lieu s'ouvre (Kéo y arrive) : le modèle de son habitant se prépare, avant sa scénette.
    if (place) habitants.prefetch(place);
    if (free) return reframe();
    // Pendant une question ou une remise, la caméra garde son cadrage : le panneau se recadre à leur fin.
    if (asked || remise || mapView) return;
    setShift({ x: 0, y: 0 });
    follow();
  };

  // Les anneaux du terrain, et les lieux qu'on dessine : refaits quand le point suivi s'éloigne de leur centre.
  let markPlace: PlaceId | null = null;
  // La Carte ouverte : sa pose (plus bas, « La Carte des lieux ouverts »).
  let mapView: MapView | null = null;
  const ringCenter = { x: Number.NaN, z: Number.NaN };
  let ringYaw = 0;
  let ringKey = '';
  // La scénette où se tient Kéo (plus bas, « La scénette d'un lieu »), et si l'étape qui porte sa trace est posée.
  let scenette: PlaceId | null = null;
  /**
   * Le cadrage de la remise montré (`remiseView`, lot L0 : les captures), sa pose de caméra, et l'aménagement qui s'y pose
   * (`extra`, pris dans le cadre : le recadrage après un changement de taille le garde).
   */
  let remise: { place: PlaceId; pose: CameraPose; extra?: string; box?: WorldBox } | null = null;
  let posed = true;
  // La mission jouée dans la scénette : le retour garde sa trace dans le champ (GD-20, point 8).
  let scenetteMission: string | null = null;
  // La Carte ne se redessine que si sa vue, la taille, la brume ou ce qu'elle montre change (expert frontend).
  let mapDirty = false;
  // Ce que montrent les lieux (la page le donne), et les parties retenues le temps d'une pose (elles descendent à part).
  let placesState: PlacesState | null = null;
  let holding: { place: PlaceId; parts: readonly PartShape[] } | null = null;
  // L'Escale (GD-20, lot 2) : ce qu'elle montre (la page le donne), ses facettes, refaites seulement si cela change, et
  // la scénette d'assemblage en cours (la pile d'avant, l'établi vide : les pièces sont dans le maillage de la réaction).
  let port: PortState | null = null;
  let portKey = '';
  let portMesh: Facets | null = null;
  let assembly: { start: number; scene: ReturnType<typeof assemblyScene>; joined: boolean } | null = null;
  /** Les facettes de l'Escale, refaites quand ce qu'elle montre change. */
  const portOf = (): Facets | null => {
    if (!port) return null;
    const k = `${JSON.stringify(port)}|${assembly ? 'a' : ''}`;
    if (k !== portKey || !portMesh) {
      portKey = k;
      portMesh = portFacets(port, { assembling: Boolean(assembly) });
    }
    return portMesh;
  };
  const builds = new Map<PlaceId, { parts: readonly PartShape[]; facets: Facets }>();
  const traceFacets = new Map<string, Facets>();
  /** Les parties posées d'un lieu, sans celles qu'une pose retient (elles descendent à part). */
  const posedOf = (id: PlaceId): readonly PartShape[] => {
    const all = placesState?.built[id] ?? [];
    // `includes` compare par référence : les tranches viennent du cache de `partShapes` (constructionParts.ts), les
    // mêmes objets d'une lecture de la sauvegarde à l'autre.
    return holding?.place === id ? all.filter((s) => !holding!.parts.includes(s)) : all;
  };
  /**
   * La construction posée d'un lieu et ce qui gît encore dans sa ruine (la cloche tombée du Phare) : refaites seulement
   * si ses parties changent. Pendant sa scénette aussi, le lieu se montre tel qu'il est bâti (rien d'achevé avant d'être
   * posé : la scénette se joue sur ce qui est là).
   */
  const buildOf = (id: PlaceId, parts: readonly PartShape[]): Facets => {
    const known = builds.get(id);
    if (known && known.parts.length === parts.length && known.parts.every((s, i) => s === parts[i])) return known.facets;
    const facets = mergeFacets([constructionFacets(id, parts, ground), fallenFacets(id, parts, ground)]);
    builds.set(id, { parts, facets });
    return facets;
  };
  const traceOf = (id: PlaceId, done: readonly string[]): Facets => {
    const k = `${id}|${done.join(',')}`;
    let f = traceFacets.get(k);
    if (!f) traceFacets.set(k, (f = placeTrace(id, done)));
    return f;
  };
  // Les ponts, tombés ou rebâtis, et leur trait double de la Carte, faits une fois chacun (ils ne dépendent que du sol).
  const bridgeCache = new Map<string, Facets>();
  // Pendant sa pose (`pose`), le pont n'y a que ses culées et ses départs d'arche : le reste se relève à part.
  const bridgeOf = (land: LinkedLand, look: 'tombe' | 'pose' | 'rebati' | 'carte'): Facets => {
    const k = `${land}|${look}`;
    let f = bridgeCache.get(k);
    if (!f) bridgeCache.set(k, (f = look === 'carte' ? bridgeMapMark(land) : look === 'pose' ? bridgeLayRest(land) : bridgeFacets(land, look === 'rebati')));
    return f;
  };
  let placesKey = '';
  /**
   * Refait le maillage des lieux si ce qu'il montre a changé : le lieu suivi à part (sauf sur la Carte), la maquette des
   * Quais et les traces cachées pendant leur scénette (la scénette a les siennes), les parties retenues par une pose ;
   * et la lumière de la lanterne du Phare.
   */
  const placeVisibility = () => {
    const landmark = mapView ? null : markPlace;
    const hiddenModel = scenette && scenetteHidesPlace(scenette) ? scenette : null;
    const hiddenTrace = scenette && scenetteHidesPieces(scenette) ? scenette : null;
    const portFacetsNow = portOf();
    const k = `${landmark}|${scenette}|${scenette ? `${scenetteMission}${posed}` : ''}|${hiddenModel}|${hiddenTrace}|${placesState ? PLACES.map((p) => `${JSON.stringify(placesState!.built[p.id])}${placesState!.traces[p.id].join('+')}${placesState!.amenagements?.[p.id]?.join('+') ?? ''}`).join(',') : ''}|${remise?.place ?? ''}|${holding ? `${holding.place}${holding.parts.length}` : ''}|${portKey}|${mapView ? 'carte' : ''}|${closed.join(',')}|${laying && !laying.tapped ? laying.lay.land : ''}`;
    if (k === placesKey) return;
    placesKey = k;
    // L'Escale entre dans le maillage des lieux : aucun appel de plus.
    const rest: Facets[] = portFacetsNow ? [portFacetsNow] : [];
    const mark: Facets[] = [];
    lampShown = lanternLit(posedOf('phare'));
    for (const p of PLACES) {
      const ruin = ruins.get(p.id);
      const ruinTop = ruinTops.get(p.id);
      const foot = feet.get(p.id);
      if (!ruin || ruinTop === undefined || !foot) continue;
      const list = p.id === landmark ? mark : rest;
      const parts = posedOf(p.id);
      const build = buildOf(p.id, parts);
      if (p.id !== hiddenModel) list.push(ruin, build);
      if (scenette !== p.id) setBuiltTop(p.id, Math.max(ruinTop, topOf(build)) - foot.y);
      // La trace attend que l'étape qui la porte soit posée, pendant la scénette comme dehors : avant, rien, pas même
      // la porte d'amont fermée des Écluses (elle est de leur haut).
      // Pendant une scénette, une trace d'une autre mission dans le cadre se cache (les lanternes de la galerie du Phare).
      const done = placesState?.traces[p.id] ?? [];
      // Au rivage nord (lot L7), les trois lieux sont dans le même cadre : les traces des trois se cachent pendant toute
      // question de l'un (directeur artistique).
      const hidden = hidesTraces(hiddenTrace, p.id);
      if (!hidden && traceStagePosed(p.id, parts)) list.push(traceOf(p.id, scenette === p.id ? scenetteTraces(p.id, done, scenetteMission, posed) : done));
      if (p.id === 'phare' && lampShown) list.push(lampFacets);
      // Les aménagements posés (GD-20, point 4, lot L0), dans le même maillage : cachés pendant toute question, comme les
      // traces (au rivage nord et au large, ceux des lieux du même cadre) ; montrés dans le cadrage de la remise.
      if (showsAmenagements(scenette, p.id, remise?.place ?? null)) for (const id of placesState?.amenagements?.[p.id] ?? []) list.push(placedAmenagement(id, ground).facets);
    }
    // Les ponts (GD-20, point 3, « vraies terres ») : tombé pour une terre fermée, rebâti sinon, dans le maillage des
    // lieux (aucun appel de plus) ; sur la Carte, chacun aussi en trait double, d'une autre forme qu'un chemin.
    for (const land of LINKED_LANDS) {
      rest.push(bridgeOf(land, closed.includes(land) ? 'tombe' : laying?.lay.land === land && !laying.tapped ? 'pose' : 'rebati'));
      if (mapView) rest.push(bridgeOf(land, 'carte'));
    }
    setGeometry(placesMesh, mergeFacets(rest));
    setGeometry(landmarkMesh, mergeFacets(mark));
    mapDirty = true;
  };
  let nearIndices: number[] = [];
  /** L'anneau de près : ses tuiles prêtes, ou leur version de loin en attendant (une seule faite par image, `pump`). */
  const setNear = (now: boolean) => nearRing.set(nearIndices.map((i) => (now ? tiles.build(i, 'near') : (tiles.near(i) ?? tiles.build(i, 'far')))));
  /** Les anneaux autour du point suivi ; `now` (le départ, un saut) : les tuiles de près faites tout de suite. */
  const updateRings = (force = false, now = false) => {
    if (!force && Math.hypot(focus.x - ringCenter.x, focus.z - ringCenter.z) < RING_MOVE && Math.abs(wrapAngle(yaw - ringYaw)) < CAMERA_TURN.rings) return;
    ringCenter.x = focus.x;
    ringCenter.z = focus.z;
    ringYaw = yaw;
    const rings = tileRings(ringCenter, WORLD_FOG.far, yaw);
    const k = `${rings.near.join(',')}|${rings.far.join(',')}`;
    if (k !== ringKey) {
      ringKey = k;
      nearIndices = rings.near;
      tiles.clearQueue();
      setNear(now);
      farRing.set(rings.far.map((i) => tiles.build(i, 'far')));
    }
    placeVisibility();
  };
  updateRings(true, true);

  // La brume des terres fermées, et le cadenas de leur pont : refaits si la liste change ; une terre reliée perd son
  // cadenas tout de suite, sa brume d'un coup, ou en fondu après le toc de sa pose (elle vient alors en dernier dans le
  // maillage, sa transparence gardée à part).
  const updateVeil = () => {
    const fading = laying?.lay.land;
    const k = `${closed.join(',')}|${fading ?? ''}`;
    if (k === veilKey) return;
    veilKey = k;
    setLocks(closed);
    const v = veilFacets(fading ? [...closed, fading] : closed, fading);
    setVeilGeometry(veilMesh, v);
    veilFadeFrom = v.fadingFrom;
    veilAlphas = null;
    if (!fading) return;
    const n = v.positions.length / 3 - v.fadingFrom;
    veilAlphas = new Float32Array(n);
    for (let i = 0; i < n; i++) veilAlphas[i] = v.colors[(v.fadingFrom + i) * 4 + 3];
  };
  /** La brume de la terre dont le pont est posé, levée à la part `e` (0 : entière, 1 : partie). */
  const fadeVeil = (e: number) => {
    if (!veilAlphas) return;
    const color = veilMesh.geometry.getAttribute('color') as THREE.BufferAttribute;
    const a = color.array as Float32Array;
    for (let i = 0; i < veilAlphas.length; i++) a[(veilFadeFrom + i) * 4 + 3] = veilAlphas[i] * (1 - e);
    color.clearUpdateRanges();
    color.addUpdateRange(veilFadeFrom * 4, veilAlphas.length * 4);
    color.needsUpdate = true;
  };
  const layPoint = new THREE.Vector3();
  /** Un point du monde à l'écran ? */
  const onScreen = (x: number, y: number, z: number) => {
    layPoint.set(x, y, z).project(camera);
    return layPoint.z < 1 && Math.abs(layPoint.x) < 0.95 && Math.abs(layPoint.y) < 0.95;
  };
  /** Le pont d'une terre est-il à l'écran ? Son milieu ou l'un de ses bouts suffit : il est long. Hors de l'écran, il est posé d'un coup. */
  const bridgeOnScreen = (land: LinkedLand) => {
    const s = bridgeSite(land);
    const at = (d: number) => onScreen(s.near.x + s.dir.x * d, BRIDGE.deck, s.near.z + s.dir.z * d);
    return distance(here, s.mid) < WORLD_FOG.far && (at(s.water[0]) || at((s.water[0] + s.water[1]) / 2) || at(s.water[1]));
  };
  /**
   * La pose d'un pont commence : son maillage à part, de ce qui se relève (une copie de ses sommets, que la pose
   * réécrit), sa boîte englobante tenant les piles sous l'eau (l'élimination hors champ reste allumée) ; les lieux n'en
   * gardent que les culées et les départs d'arche. Kéo, sur sa culée, y reste cadré.
   */
  const startLay = (land: LinkedLand, events: BridgeLayEvents) => {
    finishLay();
    finishPose();
    // Kéo sur la culée : la caméra reste cadrée sur le pont, posé d'un coup ou non.
    const { stop } = bridgeSite(land);
    if (!walk && Math.abs(here.x - stop.at.x) + Math.abs(here.z - stop.at.z) <= 0.3) heldBridge = land;
    if (reduceMotion || mapView || asked || scenette || assembly || !bridgeOnScreen(land)) {
      events.tap();
      events.laid();
      return;
    }
    const lay = bridgeLay(land);
    laying = { lay, start: performance.now() / 1000, events, tapped: false, drawn: -1 };
    walkClosed = [...closed, land];
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(lay.facets.positions), 3));
    g.setAttribute('normal', new THREE.BufferAttribute(lay.facets.normals, 3));
    g.setAttribute('color', new THREE.BufferAttribute(lay.facets.colors, 3));
    g.computeBoundingBox();
    // `computeBoundingBox` vient de la calculer : elle n'est pas nulle.
    g.boundingBox!.min.y -= lay.sink;
    g.boundingSphere = g.boundingBox!.getBoundingSphere(new THREE.Sphere());
    poseMesh.geometry.dispose();
    poseMesh.geometry = g;
    poseMesh.material = landMaterial;
    poseMesh.position.set(0, 0, 0);
    poseMesh.visible = true;
    updateVeil();
    placeVisibility();
    stepLay(laying.start);
  };
  /** La pose à l'instant `t` (en secondes) : ce qui se relève, le toc, puis le fondu de la brume. */
  const stepLay = (t: number) => {
    if (!laying) return;
    const u = t - laying.start;
    const s = bridgeLayAt(laying.lay, u, layState);
    if (!laying.tapped) {
      const position = poseMesh.geometry.getAttribute('position') as THREE.BufferAttribute;
      bridgeLayPositions(laying.lay, u, position.array as Float32Array);
      position.needsUpdate = true;
      const drawn = bridgeLayDrawn(laying.lay, u);
      if (drawn !== laying.drawn) poseMesh.geometry.setDrawRange(0, drawn);
      laying.drawn = drawn;
    }
    if (s.landed && !laying.tapped) {
      // Tout est posé : le pont rejoint les lieux, le toc.
      laying.tapped = true;
      placeVisibility();
      poseMesh.visible = false;
      laying.events.tap();
    }
    if (s.landed) fadeVeil(s.fade);
    if (s.done) finishLay();
  };
  /** Finit la pose tout de suite : le pont rebâti, la brume partie, le toc s'il n'a pas été dit (`tell`), puis la fin. */
  function finishLay(tell = true) {
    if (!laying) return;
    const l = laying;
    laying = null;
    walkClosed = closed;
    poseMesh.visible = false;
    poseMesh.geometry.dispose();
    poseMesh.geometry = new THREE.BufferGeometry();
    poseMesh.material = poseMaterial;
    updateVeil();
    placeVisibility();
    mapDirty = true;
    if (!tell) return;
    if (!l.tapped) l.events.tap();
    l.events.laid();
  }
  /**
   * Les terres changent : la brume, les cadenas, les ponts ; Kéo, s'il se tenait au-delà d'un pont tombé (une adresse
   * vers une terre fermée), revient sur la culée. La terre dont la pose est annoncée (`layLand`), si elle s'ouvre, voit
   * son pont se poser.
   */
  const setLands = (lands: { closed: readonly LinkedLand[] }) => {
    const opened = pendingLay && closed.includes(pendingLay.land) && !lands.closed.includes(pendingLay.land) ? pendingLay : null;
    pendingLay = null;
    if (laying && lands.closed.includes(laying.lay.land)) finishLay(false);
    closed = lands.closed;
    walkClosed = laying ? [...closed, laying.lay.land] : closed;
    updateVeil();
    placeVisibility();
    mapDirty = true;
    if (opened) startLay(opened.land, opened.events);
    if (asked || scenette) return;
    // Hors des chemins, dans une terre ouverte : il reste où il est (sans grille encore tirée, il est sur le réseau).
    if (walkGrid && !onPathCell(walkGrid, here) && isWalkable(walkGrid, here, walkClosed)) return;
    const at = snapToNetwork(here);
    const stop = clampToOpen(at, walkClosed);
    if (stop === at) return;
    walk = null;
    here = { ...stop.at };
    placeKeo(here);
    followStep(focus, aimed(), 0, true);
    lift = occlusionLift(focus, ground, yaw);
    updateRings(true, true);
    follow();
  };

  // La marque de la prochaine mission : au-dessus du lieu, ou au bord, avec la distance en signe.
  const projected = new THREE.Vector3();
  const roofA = new THREE.Vector3();
  const roofB = new THREE.Vector3();
  const sx = (v: THREE.Vector3) => ((v.x + 1) / 2) * viewW;
  const sy = (v: THREE.Vector3) => ((1 - v.y) / 2) * viewH;
  const reportMark = () => {
    const mark = markPlace ? marks.get(markPlace) : undefined;
    if (!mark || !markPlace) return options.onMark(null);
    projected.copy(mark).project(camera);
    const far = distanceSign(here, placeById(markPlace).center);
    const m = markOnScreen({ x: sx(projected), y: sy(projected), behind: projected.z > 1 }, viewW, viewH, MARK_MARGIN, far, markBeside(markPlace) && whole(markPlace));
    if (m.inside && portFloor(here.x, here.z) !== null) markAtPort(m);
    options.onMark(m);
  };
  /**
   * Au Port (GD-20, lot 2) : la ligne de toit sous laquelle la marque ne descend pas, là où elle se tient (le bas du toit
   * de l'école, de la galerie, le faîte de la halle), et la place de Kéo à l'écran, qu'elle ne couvre pas.
   */
  const markAtPort = (m: MarkOnScreen) => {
    let ceiling = Infinity;
    for (const [a, b] of PORT_ROOFLINES) {
      roofA.set(a.x, a.y, a.z).project(camera);
      roofB.set(b.x, b.y, b.z).project(camera);
      if (roofA.z > 1 || roofB.z > 1) continue;
      const ax = sx(roofA),
        bx = sx(roofB);
      if (m.x < Math.min(ax, bx) || m.x > Math.max(ax, bx)) continue;
      const u = (m.x - ax) / (bx - ax || 1);
      ceiling = Math.min(ceiling, sy(roofA) + u * (sy(roofB) - sy(roofA)));
    }
    if (ceiling < Infinity) m.ceiling = ceiling;
    roofA.copy(keo.position).project(camera);
    roofB.set(keo.position.x, keo.position.y + KEO_HEIGHT, keo.position.z).project(camera);
    const h = sy(roofA) - sy(roofB);
    m.keo = { left: sx(roofB) - h * 0.3, top: sy(roofB), width: h * 0.6, height: h };
  };

  // Les cadenas des ponts des terres fermées : leur point, le même sur les quatre ponts (`bridgeLockPoint` : au-dessus
  // de l'eau, passé le milieu, du côté de la terre fermée ; directeur artistique), refaits quand les terres changent ;
  // leur place à l'écran remplie sur place à chaque image.
  let locks: LockOnScreen[] = [];
  const lockPoints: THREE.Vector3[] = [];
  const setLocks = (lands: readonly LinkedLand[]) => {
    locks = lands.map((land) => ({ land, x: 0, y: 0, shown: false }));
    lockPoints.length = 0;
    for (const land of lands) {
      const at = bridgeLockPoint(land);
      lockPoints.push(new THREE.Vector3(at.x, BRIDGE.deck + LOCK_LIFT, at.z));
    }
  };
  const reportLocks = () => {
    for (let i = 0; i < locks.length; i++) {
      const l = locks[i];
      projected.copy(lockPoints[i]).project(camera);
      l.x = ((projected.x + 1) / 2) * viewW;
      l.y = ((1 - projected.y) / 2) * viewH;
      l.shown =
        projected.z < 1 &&
        distance(here, bridgeSite(l.land).mid) < WORLD_FOG.far &&
        l.x > LOCK_LEFT &&
        l.x < viewW - LOCK_MARGIN &&
        l.y > LOCK_MARGIN &&
        l.y < viewH - LOCK_MARGIN;
    }
    options.onLocks(locks);
    reportSigns();
  };
  /** Les cadenas cachés (une question, une pose…) ; les pastilles des habitants aussi, aux mêmes moments. */
  const hideLocks = () => {
    let any = false;
    for (const l of locks) {
      any ||= l.shown;
      l.shown = false;
    }
    if (any) options.onLocks(locks);
    hideSigns();
  };
  // Les pastilles des habitants (GD-20, point 4, lot L1) : au-dessus de la place de l'habitant, là où la remise se joue
  // et où l'aménagement se pose (au Phare, au pied de la tour), comme un cadenas au-dessus de son pont (./remiseRun.ts).
  const signsTracker = createSignsTracker({
    anchorOf: (place) => {
      const h = scenetteHabitant(place, remisePosed(place));
      return { x: h.x, y: h.y + SIGN_LIFT, z: h.z };
    },
    place: (anchor, sign) => {
      projected.copy(anchor).project(camera);
      const x = sx(projected);
      const y = sy(projected);
      sign.x = x;
      sign.y = y;
      sign.shown = projected.z < 1 && distance(here, placeById(sign.place).center) < WORLD_FOG.far && x > LOCK_LEFT && x < viewW - LOCK_MARGIN && y > LOCK_MARGIN && y < viewH - LOCK_MARGIN;
    },
    onSigns: options.onSigns,
  });
  const setSigns = signsTracker.set;
  const reportSigns = signsTracker.report;
  const hideSigns = signsTracker.hide;

  // La grille de ce qui se marche (le déplacement libre), tirée une fois : par tranches au repos (`stepGrid`, plus bas),
  // ou le reste d'un coup au premier besoin.
  let walkGrid: WalkGrid | null = null;
  const walkSteps = walkGridSteps(field);
  /** Une tranche du tirage ; vrai quand la grille est là. */
  const gridStep = (): boolean => {
    if (walkGrid) return true;
    const r = walkSteps.next();
    if (r.done) walkGrid = r.value;
    return r.done === true;
  };
  const grid = (): WalkGrid => {
    while (!gridStep());
    return walkGrid!;
  };
  /** Kéo hors des chemins (dans un pré, au bord de l'eau) ? */
  const offNetwork = () => !onPathCell(grid(), here);

  const arrive = (place: PlaceId | null) => {
    walk = null;
    showFreeMark(null);
    if (place) framed = place;
    startPrebuild();
    options.onArrive(place);
  };
  const startWalkTo = (target: NetworkPoint, place: PlaceId | null) => {
    const from = snapToNetwork(here);
    // Au-delà d'un pont tombé, ou d'un pont qui se pose, Kéo s'arrête sur sa culée, sans heurt ni son (GD-20, point 3).
    const to = clampToOpen(target, walkClosed);
    if (to !== target) place = null;
    // Kéo hors des chemins (le déplacement libre) : le trajet libre jusqu'à la porte, qui préfère les chemins ; sinon le
    // réseau, et s'il est hors du chemin (sur le bord du quai, au retour d'une scénette), il le rejoint d'abord.
    const free = distance(here, from.at) > 0.05 && offNetwork() ? freeRoute(grid(), here, to.at, walkClosed) : null;
    const route = free ?? findRoute(from, to);
    if (!free && distance(here, from.at) > 0.05) route.unshift(here);
    showFreeMark(null);
    walkTarget = place;
    if (route.length < 2 || distance(route[0], route[route.length - 1]) < 0.05) return arrive(place);
    walk = startWalk(route, performance.now());
    heldBridge = null;
    options.onDepart();
  };
  /**
   * Le déplacement libre : Kéo va au point du sol touché, ou au plus proche où l'on marche (l'eau, un rocher, une terre
   * fermée), par le trajet libre ; la marque au sol l'y attend. Sans grille utile (hors du terrain), le réseau, comme
   * avant.
   */
  const startFreeWalk = (p: Vec2) => {
    const g = grid();
    const to = nearestWalkable(g, p, walkClosed);
    const route = to ? freeRoute(g, here, to, walkClosed) : null;
    if (!to || !route) return startWalkTo(snapToNetwork(p), null);
    walkTarget = null;
    heldBridge = null;
    if (route.length < 2 || distance(route[0], route[route.length - 1]) < 0.05) {
      arrive(null);
      return pulseFreeMark(to);
    }
    walk = startWalk(route, performance.now());
    showFreeMark(to);
    options.onDepart();
  };

  /**
   * Kéo d'un coup devant un lieu : la caméra le suit d'un bloc (une coupe, jamais un long travelling). Devant un lieu
   * d'une terre fermée, sur la culée du pont à rebâtir d'abord, tourné vers l'eau.
   */
  const jumpTo = (place: PlaceId) => {
    heldBridge = null;
    const door = atNode(placeById(place).door);
    const stop = clampToOpen(door, closed);
    const shut = stop !== door ? bridgeSite(firstClosed(landOf(place) as LinkedLand, closed)) : null;
    here = shut ? { ...stop.at } : pathNode(placeById(place).door).at;
    heading = shut ? Math.atan2(-shut.dir.x, -shut.dir.z) : FACING_CAMERA;
    faceNorth();
    exit = null;
    back = 0;
    keo.rotation.y = heading;
    placeKeo(here);
    followStep(focus, aimed(), 0, true);
    lift = occlusionLift(focus, ground, yaw);
    updateRings(true, true);
    follow();
    arrive(place);
  };
  /** Kéo d'un coup à un endroit de l'Escale, tourné vers sa façade ; la page en ouvre le panneau. */
  const jumpToPort = (spot: PortSpot) => {
    heldBridge = null;
    here = pathNode(portNode(spot)).at;
    heading = portHeading(spot);
    faceNorth();
    exit = null;
    back = 0;
    keo.rotation.y = heading;
    placeKeo(here);
    followStep(focus, aimed(), 0, true);
    lift = occlusionLift(focus, ground, yaw);
    framed = spot;
    updateRings(true, true);
    follow();
    reframe();
    arrive(null);
    options.onPort(spot);
  };

  /**
   * L'image de la marche, en trois passes comptées ensemble : le monde sans Kéo, sa silhouette là où le décor le cache
   * (sa profondeur derrière celle du décor), puis Kéo lui-même, qui recouvre la silhouette là où on le voit.
   */
  const drawWithSilhouette = () => {
    renderer.info.reset();
    renderer.info.autoReset = false;
    try {
      camera.layers.set(0);
      renderer.render(scene, camera);
      renderer.autoClear = false;
      // Le fond n'est pas repeint par-dessus le monde.
      scene.background = null;
      camera.layers.set(KEO_LAYER);
      scene.overrideMaterial = silhouetteMaterial;
      renderer.render(scene, camera);
      scene.overrideMaterial = null;
      renderer.render(scene, camera);
    } finally {
      // Quoi qu'il arrive, la scène et la caméra retrouvent leur état (les autres images ne passent pas par ici).
      scene.overrideMaterial = null;
      scene.background = horizon;
      renderer.autoClear = true;
      camera.layers.set(0);
      camera.layers.enable(KEO_LAYER);
      renderer.info.autoReset = true;
    }
  };

  // Le toucher : un lieu touché y envoie Kéo ; ailleurs (sol, eau), au point du chemin le plus proche. Le rayon ne voit
  // que la couche 0 (celle du monde) : Kéo, sur la sienne, ne prend jamais un toucher.
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let down: { x: number; y: number; t: number } | null = null;
  const onDown = (e: PointerEvent) => {
    if (mapView) return mapDown(e);
    fingers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    // Capturé dès le premier doigt : un pointeur levé hors du dessin repasse par `onUp` et ne reste pas compté
    // (expert frontend : à la souris, un doigt fantôme bloquait ensuite tout toucher).
    try {
      renderer.domElement.setPointerCapture(e.pointerId);
    } catch {
      // Un pointeur déjà relâché : rien à capturer.
    }
    if (fingers.size === 1) {
      down = { x: e.clientX, y: e.clientY, t: performance.now() };
      return;
    }
    // Deux doigts : ce n'est plus un toucher (Kéo ne part pas, même si le premier se lève seul) ; s'ils tournent, la
    // caméra tourne autour de Kéo (GD-20, rotation libre).
    down = null;
    if (fingers.size === 2) twist = { angle: fingersAngle(), started: false };
  };
  /** L'angle de la ligne entre les deux premiers doigts posés, à l'écran. */
  const fingersAngle = () => {
    const [a, b] = [...fingers.values()];
    return Math.atan2(b.y - a.y, b.x - a.x);
  };
  /** Deux doigts posés dans le monde : l'angle de leur ligne au dernier mouvement, et s'ils ont déjà tourné la caméra. */
  let twist: { angle: number; started: boolean } | null = null;
  /** Deux doigts qui tournent : la caméra tourne d'autant, le monde suivant les doigts ; elle reste où on la laisse. */
  const twistMove = () => {
    if (!twist || fingers.size < 2) return;
    const angle = fingersAngle();
    // Pendant une question, une pose ou une remise, la caméra ne tourne pas, et l'écart ne s'accumule pas.
    if (asked || remise || scenette || poseRun.active || assembly || laying) {
      twist.angle = angle;
      return;
    }
    const d = wrapAngle(angle - twist.angle);
    if (!twist.started && Math.abs(d) < CAMERA_TURN.deadAngle) return;
    twist.started = true;
    twist.angle = angle;
    turning = null;
    setYaw(yaw + d);
  };
  const onCancel = (e: PointerEvent) => {
    down = null;
    if (!fingers.delete(e.pointerId)) return;
    if (fingers.size < 2) {
      pinch = null;
      twist = null;
    }
    mapAtRest();
  };
  /** Le point du monde sous un toucher (au sol, ou sur un lieu), ou rien. */
  const hitAt = (clientX: number, clientY: number): Vec2 | null => {
    const r = renderer.domElement.getBoundingClientRect();
    pointer.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(touchables, false)[0];
    return hit ? { x: hit.point.x, z: hit.point.z } : null;
  };
  const onUp = (e: PointerEvent) => {
    const d = down;
    down = null;
    if (mapView) return mapUp(e, d);
    fingers.delete(e.pointerId);
    if (fingers.size < 2) twist = null;
    // Un toucher pendant une pose la passe : la partie est à sa place, la caméra revient à Kéo ; de même la scénette
    // d'assemblage.
    if (poseRun.active) return finishPose();
    if (assembly) return finishAssembly();
    // Un toucher pendant la pose d'un pont la finit : le pont posé, le toc s'il n'a pas été dit.
    if (laying) return finishLay();
    if (asked || remise || !d || Math.hypot(e.clientX - d.x, e.clientY - d.y) > TAP.pixels || performance.now() - d.t > TAP.ms) return;
    // Un aménagement posé (GD-20, point 4, lot L1) : son lieu, toujours le sien, par son dessin ou le disque autour de lui ;
    // Kéo y marche, puis son panneau s'ouvre ; d'une terre fermée, la fiche de la terre.
    const object = objectAt(e.clientX, e.clientY);
    if (object) {
      const land = landOf(object);
      if (land !== START_LAND && closed.includes(land)) return options.onClosed(land);
      return startWalkTo(atNode(placeById(object).door), object);
    }
    const p = hitAt(e.clientX, e.clientY);
    if (!p) return;
    // L'Escale : une porte, la galerie ou le lieu d'assemblage y mène Kéo d'un coup et en ouvre le panneau ; le reste du
    // Port ouvre sa fiche (Kéo reste où il est).
    const atPort = portTouch(p);
    if (atPort === 'fiche') return options.onPort('fiche');
    if (atPort) return jumpToPort(atPort);
    // Un lieu d'une terre fermée, ou son pont tombé : la fiche de la terre (GD-20, point 3), Kéo reste où il est.
    const shut = closedAt(p, e.clientX, e.clientY);
    if (shut) return options.onClosed(shut);
    // Un lieu : Kéo va à sa porte ; si deux rayons prennent le point, le plus proche.
    const touched = nearestPlace(p);
    if (touched) startWalkTo(atNode(placeById(touched).door), touched);
    else startFreeWalk(p);
  };
  /**
   * Le lieu de l'aménagement montré sous un toucher (`clientX`, `clientY`), s'il y en a un : sa boîte projetée à l'écran,
   * et le disque de 48 px au moins autour d'elle (world/continu/toucher.ts) ; ni derrière la caméra, ni dans la brume.
   */
  const corner = new THREE.Vector3();
  const objectAt = (clientX: number, clientY: number): PlaceId | null => {
    if (!placesState?.amenagements) return null;
    const targets: ObjectTarget[] = [];
    for (const pl of PLACES) {
      if (!showsAmenagements(scenette, pl.id, null) || distance(here, pl.center) > WORLD_FOG.far) continue;
      for (const id of placesState.amenagements[pl.id] ?? []) {
        const { box } = placedAmenagement(id, ground);
        const points: { x: number; y: number }[] = [];
        let behind = false;
        for (const x of [box.min[0], box.max[0]])
          for (const y of [box.min[1], box.max[1]])
            for (const z of [box.min[2], box.max[2]]) {
              corner.set(x, y, z).project(camera);
              behind ||= corner.z >= 1;
              points.push({ x: sx(corner), y: sy(corner) });
            }
        if (!behind) targets.push({ place: pl.id, rect: screenRect(points) });
      }
    }
    const r = renderer.domElement.getBoundingClientRect();
    return touchedObject(clientX - r.left, clientY - r.top, targets);
  };
  /**
   * La terre fermée sous un toucher (`p` au sol, `clientX`, `clientY` à l'écran) : l'un de ses lieux (son rayon de
   * toucher), ou le pont tombé d'une terre fermée, dans son rayon au sol ou, de loin, à `BRIDGE_TOUCH.pixels` pixels de
   * lui à l'écran (la cible fait 48 px au moins, à toute distance).
   */
  const closedAt = (p: Vec2, clientX: number, clientY: number): LinkedLand | null => {
    if (!closed.length) return null;
    for (const pl of PLACES) {
      const land = landOf(pl.id);
      if (land !== START_LAND && closed.includes(land) && distance(p, pl.center) <= pl.touchRadius) return land;
    }
    const r = renderer.domElement.getBoundingClientRect();
    const x = clientX - r.left;
    const y = clientY - r.top;
    let best: LinkedLand | null = null;
    let bestD = Infinity;
    for (const land of closed) {
      const { mid } = bridgeSite(land);
      projected.set(mid.x, BRIDGE.deck, mid.z).project(camera);
      const px = Math.hypot(sx(projected) - x, sy(projected) - y);
      const d = distance(p, mid);
      if (projected.z < 1 && (d <= BRIDGE_TOUCH.radius || px <= BRIDGE_TOUCH.pixels) && px < bestD) {
        best = land;
        bestD = px;
      }
    }
    return best;
  };
  renderer.domElement.addEventListener('pointerdown', onDown);
  renderer.domElement.addEventListener('pointerup', onUp);
  renderer.domElement.addEventListener('pointercancel', onCancel);

  // La Carte des lieux ouverts (lot 3) : l'île entière, de haut ; les tuiles de loin de toute l'île dans l'anneau de
  // loin (un seul maillage, le même appel), celui de près vidé ; la brume du lointain repoussée au-delà de l'île, celle
  // des terres fermées gardée. Un doigt la fait glisser, deux la pincent, la molette la zoome (comme la Carte du monde en
  // grille) ; un toucher près d'un lieu le choisit. Fermée, les anneaux autour de Kéo reviennent.
  const mapCamera: CameraPose = { position: { x: 0, y: 0, z: 0 }, target: { x: 0, y: 0, z: 0 }, fov: 0, lens: 0 };
  const allTiles = Array.from({ length: TERRAIN.tilesX * TERRAIN.tilesZ }, (_, i) => i);
  const mapSpots: MapSpotOnScreen[] = [
    ...PLACES.map((p) => ({ id: p.id, x: 0, y: 0, shown: false })),
    ...LINKED_LANDS.map((land) => ({ id: bridgeSpot(land), x: 0, y: 0, shown: false })),
    { id: 'port' as const, x: 0, y: 0, shown: false },
    { id: 'keo' as const, x: 0, y: 0, shown: false },
  ];
  const portPoint = new THREE.Vector3(PORT_MAP_POINT.x, PORT_MAP_POINT.y, PORT_MAP_POINT.z);
  let mapMs = 0;
  const keoPoint = new THREE.Vector3();
  const fingers = new Map<number, { x: number; y: number }>();
  let pinch: { gap: number; mx: number; my: number } | null = null;
  const aspect = () => viewW / viewH;
  const showMap = () => {
    if (!mapView) return;
    applyPose(mapPose(mapView, mapCamera));
    mapDirty = true;
  };
  /** Un point de l'écran (pixels du client) au sol de la Carte, au niveau de l'eau. */
  const mapGround = (cx: number, cy: number) => {
    const r = renderer.domElement.getBoundingClientRect();
    return groundUnder(cx - r.left, cy - r.top, 0);
  };
  // Le point d'un pont sur la Carte : le milieu de son eau, au-dessus du tablier.
  const bridgePoints = new Map<string, THREE.Vector3>(
    LINKED_LANDS.map((land) => {
      const { mid } = bridgeSite(land);
      return [bridgeSpot(land), new THREE.Vector3(mid.x, BRIDGE.deck, mid.z)];
    }),
  );
  const mapMark = (id: MapSpotOnScreen['id']) => (id === 'keo' ? keoPoint.set(keoFeet.x, keoFeet.y, keoFeet.z) : id === 'port' ? portPoint : (bridgePoints.get(id) ?? marks.get(id as PlaceId)));
  // Le nom d'un lieu, centré au-dessus de lui, reste entier à l'écran : assez loin des bords gauche et droit.
  const mapShown = (x: number, y: number) => x > MAP_LABEL_SIDE && x < viewW - MAP_LABEL_SIDE && y > MAP_LABEL_TOP && y < viewH - LOCK_MARGIN;
  const reportMapPlaces = () => {
    for (const l of mapSpots) {
      const mark = mapMark(l.id);
      if (!mark) continue;
      projected.copy(mark).project(camera);
      l.x = ((projected.x + 1) / 2) * viewW;
      l.y = ((1 - projected.y) / 2) * viewH;
      l.shown = projected.z < 1 && mapShown(l.x, l.y);
    }
    mapMoving = fingers.size > 0 || wheelRest !== 0;
    options.onMapPlaces(mapSpots, mapMoving);
  };
  // La molette n'a pas de fin de geste : la Carte est à l'arrêt `MAP_WHEEL_REST` ms après son dernier cran.
  let wheelRest = 0;
  // La dernière pose faite pendant un geste : l'arrêt en demande une de plus (un toucher sans glisser, non).
  let mapMoving = false;
  /** La Carte à l'arrêt (le dernier doigt levé, la molette au repos) : ses étiquettes se posent une fois de plus. */
  const mapAtRest = () => {
    if (mapView && mapMoving && !fingers.size && !wheelRest) reportMapPlaces();
  };
  // La distance la plus lointaine de la Carte, reculée au plus grand texte (0 : l'île entière), et sa vue de départ,
  // tant que l'élève ne l'a ni glissée ni pincée ; remises à l'ouverture et quand l'écran change de taille (les
  // étiquettes redemandent alors la vue qu'il leur faut).
  let mapFar = 0;
  let mapFirst: MapView | null = null;
  // La Carte qui s'ouvre, tant que ses étiquettes n'ont pas choisi sa vue de départ (`reframeStart`) : elle ne se dessine
  // pas encore (la dernière image reste à l'écran), pour ne pas se montrer une première fois puis changer aussitôt de vue
  // (consultant UX UI : la Carte ne « respire » pas à l'ouverture) ; au plus `MAP_SETTLE_FRAMES` images.
  let mapSettling = 0;
  let mapOpen: readonly PlaceId[] = [];
  const probePose: CameraPose = { position: { x: 0, y: 0, z: 0 }, target: { x: 0, y: 0, z: 0 }, fov: 0, lens: 0 };
  const probeSpots: MapSpotOnScreen[] = mapSpots.map((l) => ({ ...l }));
  const reframeStart = (crowded: (spots: readonly MapSpotOnScreen[]) => number) => {
    if (!mapView) return;
    if (mapView !== mapFirst) {
      // Touchée par l'élève : elle ne bouge plus ; si elle attendait, elle se dessine telle quelle.
      if (mapSettling) {
        mapSettling = 0;
        showMap();
      }
      return;
    }
    const a = aspect();
    const open = [...mapOpen.map((id) => marks.get(id)), portPoint].filter((m): m is THREE.Vector3 => Boolean(m));
    // Les points des lieux pour une vue essayée, sans toucher la caméra (`screenOf`, la même projection).
    const view = reframeMap(a, open, (v) => {
      const pose = mapPose(v, probePose);
      for (const l of probeSpots) {
        const mark = mapMark(l.id);
        l.shown = false;
        if (!mark) continue;
        const s = screenOf(pose, mark, viewW, viewH);
        l.x = s.x;
        l.y = s.y;
        l.shown = mapShown(s.x, s.y);
      }
      return crowded(probeSpots);
    });
    mapFar = view.distance;
    mapView = mapFirst = clampMap(view, a, mapFar);
    mapSettling = 0;
    showMap();
  };
  /** Le premier toucher de la Carte (doigt, pointeur, molette) la fige : sa vue de départ ne change plus. */
  const freezeMap = () => {
    mapFirst = null;
    if (mapSettling) {
      mapSettling = 0;
      showMap();
    }
  };
  const setMap = (open: readonly PlaceId[] | null) => {
    if (open && asked) return;
    if (open) {
      const t0 = performance.now();
      // Rien ne bouge sur la Carte.
      finishLay();
      finishPose();
      finishAssembly();
      // Kéo s'arrête où il est : la Carte n'est pas un trajet.
      if (walk) arrive(null);
      mapOpen = open;
      if (!mapView) {
        mapView = mapFirst = mapStart(aspect());
        mapFar = 0;
        mapSettling = MAP_SETTLE_FRAMES;
      }
      fog.near = MAP_FOG;
      fog.far = MAP_FOG + 1;
      camera.far = MAP_FAR;
      camera.updateProjectionMatrix();
      nearRing.set([]);
      farRing.set(allTiles.map((i) => tiles.build(i, 'far')));
      placeVisibility();
      setShift({ x: 0, y: 0 });
      options.onMark(null);
      hideLocks();
      showMap();
      if (!mapMs) mapMs = performance.now() - t0;
      return;
    }
    if (!mapView) return;
    mapView = null;
    mapSettling = 0;
    fingers.clear();
    pinch = null;
    for (const l of mapSpots) l.shown = false;
    options.onMapPlaces(mapSpots, false);
    fog.near = WORLD_FOG.near;
    fog.far = WORLD_FOG.far;
    camera.far = FOLLOW_FAR;
    camera.updateProjectionMatrix();
    updateRings(true, true);
    follow();
  };
  // Les tuiles de loin de toute l'île, faites au repos après la première arrivée (expert frontend) : la première
  // ouverture de la Carte n'a plus qu'à les recopier. Sans `requestIdleCallback` (Safari), un court délai en tient lieu.
  const idleQueue: number[] = [];
  let idleHandle = 0;
  let idleStarted = false;
  const requestIdle = (cb: (d: { timeRemaining(): number }) => void): number =>
    typeof window.requestIdleCallback === 'function' ? window.requestIdleCallback(cb) : window.setTimeout(() => {
          const end = performance.now() + IDLE_SLICE_MS;
          cb({ timeRemaining: () => end - performance.now() });
        }, IDLE_DELAY_MS);
  const cancelIdle = (handle: number) => (typeof window.cancelIdleCallback === 'function' ? window.cancelIdleCallback(handle) : window.clearTimeout(handle));
  const prebuildFar = (d: { timeRemaining(): number }) => {
    idleHandle = 0;
    while (idleQueue.length && d.timeRemaining() > 1) tiles.build(idleQueue.pop()!, 'far');
    if (idleQueue.length) idleHandle = requestIdle(prebuildFar);
  };
  // La grille du déplacement libre, par tranches au repos, un peu après l'arrivée dans le monde.
  let gridHandle = 0;
  const stepGrid = (d: { timeRemaining(): number }) => {
    gridHandle = 0;
    while (d.timeRemaining() > 1) if (gridStep()) return;
    gridHandle = requestIdle(stepGrid);
  };
  const gridTimer = window.setTimeout(() => {
    if (!disposed) gridHandle = requestIdle(stepGrid);
  }, WALK_GRID_DELAY);
  const startPrebuild = () => {
    if (idleStarted || disposed) return;
    idleStarted = true;
    idleQueue.push(...allTiles);
    idleHandle = requestIdle(prebuildFar);
  };
  const mapDown = (e: PointerEvent) => {
    freezeMap();
    fingers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try {
      renderer.domElement.setPointerCapture(e.pointerId);
    } catch {
      // Un pointeur déjà relâché : rien à capturer.
    }
    if (fingers.size === 1) down = { x: e.clientX, y: e.clientY, t: performance.now() };
    else if (fingers.size === 2) {
      // Deux doigts : on pince, ce n'est plus un toucher.
      down = null;
      const [a, b] = [...fingers.values()];
      pinch = { gap: Math.max(1, Math.hypot(b.x - a.x, b.y - a.y)), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
    }
  };
  const onMove = (e: PointerEvent) => {
    const finger = fingers.get(e.pointerId);
    if (!finger) return;
    if (!mapView) {
      finger.x = e.clientX;
      finger.y = e.clientY;
      return twistMove();
    }
    const before = { x: finger.x, y: finger.y };
    finger.x = e.clientX;
    finger.y = e.clientY;
    if (pinch && fingers.size >= 2) {
      const [a, b] = [...fingers.values()];
      const gap = Math.max(1, Math.hypot(b.x - a.x, b.y - a.y));
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      const at = mapGround(mx, my);
      if (at) mapView = zoomMap(mapView, gap / pinch.gap, at, aspect(), mapFar);
      showMap();
      dragMap(pinch.mx, pinch.my, mx, my);
      pinch.gap = gap;
      pinch.mx = mx;
      pinch.my = my;
      return;
    }
    if (fingers.size === 1) dragMap(before.x, before.y, e.clientX, e.clientY);
  };
  /** La Carte glissée : le point du sol sous le doigt reste sous le doigt. */
  const dragMap = (x0: number, y0: number, x1: number, y1: number) => {
    if (!mapView) return;
    const a = mapGround(x0, y0);
    const b = mapGround(x1, y1);
    if (!a || !b) return;
    mapView = panMap(mapView, a.x - b.x, a.z - b.z, aspect(), mapFar);
    showMap();
  };
  const mapUp = (e: PointerEvent, d: { x: number; y: number; t: number } | null) => {
    fingers.delete(e.pointerId);
    if (fingers.size < 2) pinch = null;
    mapAtRest();
    if (!d || Math.hypot(e.clientX - d.x, e.clientY - d.y) > TAP.pixels || performance.now() - d.t > TAP.ms) return;
    // Le lieu le plus proche du toucher, à l'écran (la page ouvre un lieu ouvert, ou la fiche de la terre d'un lieu fermé ou d'un pont) (le doigt n'a pas à viser le modèle, petit de si haut).
    const r = renderer.domElement.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    let best: PlaceId | 'port' | BridgeSpot | null = null;
    let bestD: number = MAP_TOUCH;
    for (const l of mapSpots) {
      // Kéo ne se choisit pas ; le pont d'une terre ouverte n'a pas de cadenas.
      if (l.id === 'keo' || (isBridgeSpot(l.id) && !closed.some((land) => bridgeSpot(land) === l.id))) continue;
      const dd = Math.hypot(l.x - x, l.y - y);
      if (l.shown && dd < bestD) {
        best = l.id;
        bestD = dd;
      }
    }
    if (best) options.onMapPick(best);
  };
  const onWheel = (e: WheelEvent) => {
    if (!mapView) return;
    e.preventDefault();
    const pixels = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1;
    // Un pavé tactile qui pince envoie la molette avec Ctrl, par petits pas : plus sensible (comme ../gestures.ts).
    const factor = Math.exp(-e.deltaY * pixels * (e.ctrlKey ? 0.01 : 0.002));
    const at = mapGround(e.clientX, e.clientY);
    freezeMap();
    window.clearTimeout(wheelRest);
    wheelRest = window.setTimeout(() => {
      wheelRest = 0;
      mapAtRest();
    }, MAP_WHEEL_REST);
    if (!at) return;
    mapView = zoomMap(mapView, factor, at, aspect(), mapFar);
    showMap();
  };
  renderer.domElement.addEventListener('pointermove', onMove);
  renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

  // La question posée dans un lieu (lot 4) : sa pose fixe, la scène de l'item et les objets des réponses (un maillage),
  // la réaction (un maillage qui bouge une à deux secondes). Refaits par item, jamais par image.
  let asked: { place: PlaceId; pose: CameraPose; objectsKey: string; itemKey: string; answered: boolean; scene: ItemScene; scale: number; sort?: SortLook } | null = null;
  const itemMesh = new THREE.Mesh(new THREE.BufferGeometry(), landMaterial);
  const reactionMesh = new THREE.Mesh<THREE.BufferGeometry, THREE.Material>(new THREE.BufferGeometry(), landMaterial);
  itemMesh.visible = false;
  reactionMesh.visible = false;
  scene.add(still(itemMesh), reactionMesh);
  let reaction: { r: Reaction; start: number } | null = null;
  function setGeometry(mesh: THREE.Mesh, f: Facets) {
    mesh.geometry.dispose();
    mesh.geometry = geometryOf(f);
    mesh.visible = f.triangles > 0;
  }
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const ground3 = new THREE.Vector3();
  /** Le point du sol (à la hauteur `y`) sous un point de l'écran, avec la pose de la caméra déjà posée. */
  const groundUnder = (sx: number, sy: number, y: number) => {
    pointer.set((sx / viewW) * 2 - 1, -(sy / viewH) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    plane.constant = -y;
    const hit = raycaster.ray.intersectPlane(plane, ground3);
    return hit ? { x: hit.x, y, z: hit.z } : null;
  };
  const top3 = new THREE.Vector3();
  /** La hauteur à l'écran, en pixels, d'un trait vertical de `h` posé en `p`, avec la pose de la caméra déjà posée. */
  const screenHeight = (p: { x: number; y: number; z: number }, h: number) => {
    projected.set(p.x, p.y, p.z).project(camera);
    top3.set(p.x, p.y + h, p.z).project(camera);
    return ((top3.y - projected.y) / 2) * viewH;
  };
  /** La réaction à l'instant `t` (en secondes) : sa place sur son arc ; finie, elle reste ou s'efface (elle reste toujours avec « Réduire les animations »). */
  const placeReaction = (t: number) => {
    if (!reaction) return;
    const { r, start } = reaction;
    const u = reduceMotion ? 1 : Math.min(1, (t - start) / (r.swing?.seconds ?? REACTION_SECONDS));
    const e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
    if (r.swing) {
      // Les battants sur leurs gonds (les volets de l'Observatoire) : leurs sommets tournés en place, dans les tableaux de
      // la géométrie (des copies, faites une fois à la réponse), sans allocation.
      const g = reactionMesh.geometry;
      const pos = g.getAttribute('position') as THREE.BufferAttribute;
      const nor = g.getAttribute('normal') as THREE.BufferAttribute;
      swingTo(r.facets, r.swing, e, pos.array as Float32Array, nor.array as Float32Array);
      pos.needsUpdate = true;
      nor.needsUpdate = true;
    }
    reactionMesh.position.set(r.from.x + (r.to.x - r.from.x) * e, r.from.y + (r.to.y - r.from.y) * e + r.arc * Math.sin(Math.PI * e), r.from.z + (r.to.z - r.from.z) * e);
    // Son cap, et son roulis qui monte avec elle (la planche de bordé du Chantier naval, lot L6b) ; sans `turn`, aucun.
    reactionMesh.rotation.set(0, r.turn?.yaw ?? 0, (r.turn?.roll ?? 0) * e, 'YXZ');
    if (u >= 1) {
      // Avec « Réduire les animations », la réaction est un état fixe : elle reste à sa fin.
      reactionMesh.visible = r.stay || reduceMotion;
      reaction = null;
    }
  };
  // La scénette d'un lieu (lot 2) : le décor de près (la galerie, sa rambarde, l'habitant), fait à l'arrivée et libéré
  // au départ, un seul maillage ; la lumière de la réussite d'une scénette posée (la lanterne de proue des Quais),
  // dessinée par le maillage de la réaction avec un matériau sans lumière : aucun appel de plus ; la descente de la
  // caméra, courte (coupe franche avec « Réduire les animations »).
  const decorMesh = still(new THREE.Mesh(new THREE.BufferGeometry(), landMaterial));
  decorMesh.visible = false;
  scene.add(decorMesh);
  const lampMaterial = new THREE.MeshBasicMaterial({ color: LANTERN.off });
  const lampOff = new THREE.Color(LANTERN.off);
  const lampOn = new THREE.Color(LANTERN.on);
  let lampLit = false;
  let lampStart: number | null = null;
  // La réussite d'une scénette posée (world/continu/scenette.ts, `scenetteFinale`) : l'objet qui va à sa place (d'où,
  // quand), puis la lumière ; `finaleShown` : elle est montrée (le décor de près a changé).
  let finale: { from: THREE.Vector3; start: number; f: ScenetteFinale } | null = null;
  let finaleShown = false;
  // La scène de l'item est-elle à montrer (cachée le temps de la descente) ?
  let itemShown = false;
  const descent = {
    active: false,
    start: 0,
    from: { position: { x: 0, y: 0, z: 0 }, target: { x: 0, y: 0, z: 0 }, fov: 0, lens: 0 } as CameraPose,
    to: { position: { x: 0, y: 0, z: 0 }, target: { x: 0, y: 0, z: 0 }, fov: 0, lens: 0 } as CameraPose,
    fromShift: { x: 0, y: 0 },
    toShift: { x: 0, y: 0 },
  };
  const between: CameraPose = { position: { x: 0, y: 0, z: 0 }, target: { x: 0, y: 0, z: 0 }, fov: 0, lens: 0 };
  const mix = (a: number, b: number, u: number) => a + (b - a) * u;
  /** La descente à l'instant `t` (en secondes) : la pose entre le départ et la galerie ; finie, la pose de la galerie. */
  const stepDescent = (t: number) => {
    if (!descent.active) return;
    const u = Math.min(1, (t - descent.start) / SCENETTE_CAMERA.seconds);
    const e = u * u * (3 - 2 * u);
    const { from, to } = descent;
    for (const k of ['x', 'y', 'z'] as const) {
      between.position[k] = mix(from.position[k], to.position[k], e);
      between.target[k] = mix(from.target[k], to.target[k], e);
    }
    between.fov = mix(from.fov, to.fov, e);
    shift.x = mix(descent.fromShift.x, descent.toShift.x, e);
    shift.y = mix(descent.fromShift.y, descent.toShift.y, e);
    applyPose(between);
    if (u < 1) return;
    descent.active = false;
    // Les cloches paraissent quand la caméra est arrivée (elles sont posées pour la galerie, pas pour le chemin).
    itemMesh.visible = itemShown;
  };
  /** La lampe qui s'allume, à l'instant `t`. */
  const stepLamp = (t: number) => {
    if (lampStart === null) return;
    const u = reduceMotion ? 1 : Math.min(1, (t - lampStart) / FINALE_LAMP_SECONDS);
    lampMaterial.color.lerpColors(lampOff, lampOn, u);
    if (u >= 1) lampStart = null;
  };
  /** Le maillage de la réaction reprend son matériau (la lampe éteinte, une autre question, le départ). */
  const unlitReaction = () => {
    if (!lampLit) return;
    lampLit = false;
    lampStart = null;
    reactionMesh.material = landMaterial;
    reactionMesh.visible = false;
  };
  /**
   * Entre dans la scénette d'un lieu : le décor de près, Kéo à sa place, sans son anneau. La scénette se joue sur le lieu
   * tel qu'il est bâti (`posed` : l'étape qui porte sa trace est posée ; sinon, au Phare, au pied de la tour).
   */
  const enterScenette = (place: PlaceId, site?: boolean) => {
    if (scenette === place) return;
    scenette = place;
    // Au retour, la caméra qui suit est tournée vers le nord, comme la scénette.
    faceNorth();
    posed = site ?? traceStagePosed(place, posedOf(place));
    // Le modèle de l'habitant, s'il est prêt, avant le décor de près : celui-ci se fait alors sans le pion.
    habitants.show(place, scenetteHabitant(place, posed));
    setGeometry(decorMesh, scenetteDecor(place, false, posed));
    // Aux Quais, la maquette du lieu (sa grue, son hangar) s'efface : le quai de la scénette a les siens. La trace de
    // la scénette aussi, sauf au Phare : la trace de la réussite (la barque chargée, le panier plein, la porte ouverte)
    // n'est pas dessinée deux fois.
    placeVisibility();
    const k = scenetteKeo(place, posed);
    keo.position.set(k.at.x, k.at.y, k.at.z);
    keo.scale.setScalar(k.scale);
    keo.rotation.y = k.yaw;
    keo.visible = true;
    ring.visible = false;
  };
  /** Quitte la scénette : son décor et sa lampe libérés, Kéo de retour sur le chemin, à sa taille. */
  const leaveScenette = () => {
    if (!scenette) return;
    const left = scenette;
    scenette = null;
    descent.active = false;
    placeVisibility();
    unlitReaction();
    finale = null;
    finaleShown = false;
    decorMesh.geometry.dispose();
    decorMesh.geometry = new THREE.BufferGeometry();
    decorMesh.visible = false;
    habitants.hide();
    keo.scale.setScalar(KEO_SCALE);
    // Aux Quais, Kéo reste sur le bord du quai, face à la caméra, qui garde la barque chargée (d'un coup, comme tout
    // retour de question).
    const ex = scenetteExit(left, posed, scenetteMission ?? undefined);
    scenetteMission = null;
    // La liste du lieu se rouvre au retour : la caméra recule et garde, au-dessus d'elle, la trace qu'on vient de laisser,
    // ou, sans trace à garder, le lieu lui-même (Kéo reste où il est).
    framed = left;
    if (ex) {
      here = { ...ex.at };
      heading = FACING_CAMERA;
    }
    exit = ex ? { ...ex, view: ex.view ?? TRACE_VIEW } : { at: { ...here }, keep: placeKeep(left), view: PLACE_VIEW };
    back = 1;
    keo.rotation.y = heading;
    placeKeo(here);
  };
  const vertical = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  /** Le point du plan vertical `z` (face à la caméra) sous un point de l'écran, avec la pose de la caméra déjà posée. */
  const planeUnder = (sx: number, sy: number, z: number) => {
    pointer.set((sx / viewW) * 2 - 1, -(sy / viewH) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    vertical.constant = -z;
    const hit = raycaster.ray.intersectPlane(vertical, ground3);
    return hit ? { x: hit.x, y: hit.y, z } : null;
  };
  const askQuestion = (q: QuestionRequest | null): LabelOnScreen[] => {
    if (!q) {
      if (!asked) return [];
      asked = null;
      reaction = null;
      itemShown = false;
      itemMesh.visible = false;
      reactionMesh.visible = false;
      leaveScenette();
      keo.visible = true;
      ring.visible = true;
      setShift({ x: 0, y: 0 });
      // La brume revient près de Kéo, la caméra derrière lui, sans passage.
      fog.near = WORLD_FOG.near;
      fog.far = WORLD_FOG.far;
      followStep(focus, aimed(), 0, true);
      follow();
      return [];
    }
    finishLay();
    finishPose();
    finishAssembly();
    if (remise) {
      remise = null;
      endRemise();
      leaveScenette();
    }
    if (host.clientWidth && host.clientHeight && (host.clientWidth !== viewW || host.clientHeight !== viewH)) resize();
    const { place, layout, item } = q;
    scenetteMission = q.mission;
    walk = null;
    // Une nouvelle question (« Rejouer ») : la lampe rend le maillage de la réaction, le décor de près reprend son état
    // d'avant la réussite.
    unlitReaction();
    if (finaleShown && scenette === place && !item.answered) {
      finale = null;
      finaleShown = false;
      setGeometry(decorMesh, scenetteDecor(place, false, posed));
    }
    // La scénette : Kéo à côté de l'habitant ; la brume reste celle du monde (la caméra est près).
    const entering = scenette !== place;
    if (entering) copyPose(current, descent.from);
    const fromShift = { ...shift };
    enterScenette(place);
    fog.near = WORLD_FOG.near;
    fog.far = WORLD_FOG.far;
    const qp = scenettePose(place, layout.scenette.stage, viewW, viewH, posed);
    if (entering && !reduceMotion) {
      copyPose(qp.pose, descent.to);
      descent.fromShift = fromShift;
      descent.toShift = { ...qp.shift };
      descent.start = performance.now() / 1000;
      descent.active = true;
    } else if (descent.active) {
      copyPose(qp.pose, descent.to);
      descent.toShift = { ...qp.shift };
    }
    // Les objets se posent sous leurs réponses avec la pose finale ; la descente reprend ensuite sa place.
    setShift(qp.shift);
    applyPose(qp.pose);
    camera.updateMatrixWorld();
    const slotFeet = layout.slots.map((o) => o.foot);
    const objectsKey = `${place}|${viewW}x${viewH}|${slotFeet.map((o) => `${o.x},${o.y}`).join(';')}`;
    const itemKey = `${JSON.stringify(item.scene)}|${item.right.join(',')}`;
    const spot = sceneSpot(place);
    // Dans une scénette, les cloches pendent devant la rambarde ; les caisses sont posées sur un ponton du bassin ; les
    // paniers et les leviers sur une margelle à terre, à la hauteur du plancher de la scène, relevée si le sol monte
    // devant elle (elle ne s'y enfonce jamais), sa jupe jusqu'au sol.
    const hang = answersHang(place, posed) ? bellPlane(place) : null;
    const deck = scenetteDeck(place, posed);
    let deckY = deck.y;
    const pointsAt = (y: number) => slotFeet.map((o) => (hang ? planeUnder(o.x, o.y, hang.z) : groundUnder(o.x, o.y, y)) ?? spot);
    let points = pointsAt(deckY);
    let landBelow: number | undefined;
    if (deck.onLand && !hang) {
      const heights = points.flatMap((p) => [-1, 0, 1].flatMap((dx) => [-0.5, 0.5].map((dz) => standingHeight(ground(p.x + dx, p.z + dz)))));
      const top = Math.max(...heights) + 0.05;
      if (top > deckY) {
        deckY = top;
        points = pointsAt(deckY);
      }
      landBelow = Math.max(-0.3, Math.min(...points.flatMap((p) => [-1, 0, 1].map((dx) => ground(p.x + dx, p.z)))));
    }
    // La hauteur d'un objet dans le monde : sa hauteur à l'écran, à l'échelle de l'écart entre deux objets.
    const pxStep = slotFeet.length > 1 ? Math.abs(slotFeet[1].x - slotFeet[0].x) : 120;
    const worldStep = points.length > 1 ? Math.hypot(points[1].x - points[0].x, points[1].z - points[0].z) : 2;
    // La caméra regarde en plongée : une hauteur se voit plus courte qu'une largeur. On mesure la hauteur à l'écran
    // d'un premier essai au pied du premier objet, puis on corrige.
    let height = (layout.objectHeight * worldStep) / Math.max(1, pxStep);
    const seen = screenHeight(points[0] ?? spot, height);
    if (seen > 1) height *= layout.objectHeight / seen;
    const scale = answerScale(place, points, height);
    const facets = itemScene(
      place,
      item.scene,
      item.answered,
      item.right.map((k) => points[k]).filter(Boolean),
      scale,
      posed,
    );
    // « Ranger » (lot L4) : l'objet qu'on vient de ranger vole jusqu'à son panier, en arc, le temps de la réaction (d'un
    // coup avec « Réduire les animations ») ; les objets restent dessinés à leur place.
    const sort = item.sort;
    let moving: number | null = null;
    if (sort && !reduceMotion && !item.answered && asked?.place === place && asked.sort)
      for (const [i, bin] of sort.placed.entries()) if (bin !== null && asked.sort.placed[i] !== bin) moving = i;
    // La scène de l'item et les objets des réponses : un seul maillage.
    const merged = new FacetBuilder();
    merged.append(facets.still);
    merged.append(
      answerObjects(place, points, scale, {
        sort: sort ? { ...sort, moving } : undefined,
        // Une cloche choisie se balance jusqu'à la réponse ; une caisse tentée reste penchée.
        picked: hang && item.answered ? [] : item.picked,
        // La bonne caisse est partie au crochet avec la réaction.
        gone: answerLeaves(place) && item.answered ? item.right : [],
        hanging: hang ? { hand: habitantHand(place, posed), rail: hang.rail } : undefined,
        ground: landBelow,
      }),
    );
    setGeometry(itemMesh, merged.build());
    itemShown = itemMesh.visible;
    if (descent.active) itemMesh.visible = false;
    const before = asked && asked.place === place && asked.itemKey === itemKey ? asked : null;
    const bin = moving !== null && sort ? sort.placed[moving] : null;
    if (sort && moving !== null && bin !== null && points[moving] && points[bin]) {
      const f = new FacetBuilder();
      const scales = sortScales(points, scale, sort.low ?? true);
      sortPrise(f, { x: 0, y: 0, z: 0 }, scales.inBasket);
      const flying = f.build();
      setGeometry(reactionMesh, flying);
      const from = { x: points[moving].x, y: points[moving].y + HELD_LIFT, z: points[moving].z };
      const to = inBasket(points[bin], scales.bin, rankInBasket(sort.placed, moving));
      reaction = { r: { facets: flying, from, to, arc: 1.2, stay: true }, start: performance.now() / 1000 };
      placeReaction(performance.now() / 1000);
    } else if (!item.answered || !facets.reaction) {
      reaction = null;
      reactionMesh.visible = false;
    } else if (!before?.answered || before.objectsKey !== objectsKey) {
      const f = facets.reaction.facets;
      const swing = facets.reaction.swing;
      // Des battants : leurs sommets tournent en place, dans des copies (jamais les tableaux de la scène de l'item) ; la
      // boîte englobante couvre leur course entière, fermés et ouverts, pour que l'élimination hors champ reste juste.
      setGeometry(reactionMesh, swing ? { ...f, positions: f.positions.slice(), normals: f.normals.slice() } : f);
      if (swing) {
        const g = reactionMesh.geometry;
        const pos = g.getAttribute('position') as THREE.BufferAttribute;
        const nor = g.getAttribute('normal') as THREE.BufferAttribute;
        swingTo(f, swing, 1, pos.array as Float32Array, nor.array as Float32Array);
        g.computeBoundingBox();
        const box = g.boundingBox!.clone();
        swingTo(f, swing, 0, pos.array as Float32Array, nor.array as Float32Array);
        g.computeBoundingBox();
        g.boundingBox!.union(box);
        g.boundingSphere = g.boundingBox!.getBoundingSphere(new THREE.Sphere());
      }
      // La réaction joue au moment de la réponse ; un changement de taille la pose tout de suite à sa fin.
      reaction = { r: facets.reaction, start: before?.answered ? -Infinity : performance.now() / 1000 };
      placeReaction(performance.now() / 1000);
    }
    asked = { place, pose: qp.pose, objectsKey, itemKey, answered: item.answered, scene: item.scene, scale, sort };
    const labels = facets.labels.map((l) => {
      projected.set(l.at.x, l.at.y, l.at.z).project(camera);
      return { text: l.text, x: ((projected.x + 1) / 2) * viewW, y: ((1 - projected.y) / 2) * viewH, ...(l.center ? { center: true } : {}) };
    });
    if (descent.active) {
      // La descente en cours garde sa place : elle reprend du point où elle était.
      appliedShift.x = Number.NaN;
      stepDescent(performance.now() / 1000);
    }
    return labels;
  };
  /**
   * Le cadrage de la remise (lot L0 en image fixe, `OpenWorld.remiseView` ; lot L1, la remise jouée) : `extra`,
   * l'aménagement qui va se poser, pris dans le cadre avec ceux qui sont déjà là.
   */
  const remiseView = (place: PlaceId | null, extra?: string, box?: WorldBox) => {
    // La page fermée : la scène défaite ne fait plus rien (la sortie de la remise arrive après, en micro-tâche).
    if (disposed || asked || mapView) return;
    if (!place) {
      endRemise();
      if (!remise) return;
      remise = null;
      leaveScenette();
      keo.visible = true;
      ring.visible = true;
      setShift({ x: 0, y: 0 });
      followStep(focus, keoFeet, 0, true);
      follow();
      return;
    }
    finishPose();
    finishAssembly();
    walk = null;
    if (remise && remise.place !== place) {
      remise = null;
      leaveScenette();
    }
    enterScenette(place, remisePosed(place));
    // Les tuiles du terrain suivent le point suivi : il vient à la scène de la remise (sinon, loin de Kéo, le sol du lieu
    // manque et la mer paraît dessous ; défaut trouvé sur les captures du lot L0 au format téléphone).
    Object.assign(focus, scenetteKeo(place, remisePosed(place)).at);
    updateRings(true, true);
    remise = { place, pose: pose, extra, box };
    placeVisibility();
    fog.near = WORLD_FOG.near;
    fog.far = WORLD_FOG.far;
    refitRemise();
  };
  /**
   * Le cadrage de la remise à la taille de l'écran : à l'entrée, et de nouveau quand l'écran change de taille (une
   * tablette qui tourne pendant la pose), sans refaire la scénette : l'aménagement reste entier dans la scène.
   */
  const refitRemise = () => {
    if (!remise) return;
    const shown = placesState?.amenagements?.[remise.place] ?? [];
    const extra = remise.extra;
    const list: { a: { frame?: number }; box: WorldBox }[] = [...shown, ...(extra && !shown.includes(extra) ? [extra] : [])].flatMap((id) => {
      const a = amenagementById(id);
      return a ? [{ a, box: placedAmenagement(id, ground).box }] : [];
    });
    // La caisse de « Donner » (lot L2) : dans le cadre, avec ce qui est déjà posé.
    if (remise.box) list.push({ a: {}, box: remise.box });
    const qp = remiseFrame(remise.place, list, viewW, viewH);
    remise.pose = qp.pose;
    setShift(qp.shift);
    applyPose(qp.pose);
  };
  // ---------- La remise (GD-20, point 4, lots L1 « Livrer » et L2 « Donner », « Apporter ») ----------
  // La pose elle-même (./remiseRun.ts) : l'aménagement, la caisse et ses blocs, ou l'objet apporté.
  const remiseRun = createRemiseRun({
    mesh: remiseMesh,
    reaction: reactionMesh,
    material: landMaterial,
    reduceMotion,
    delivered: (place, id) => Boolean(placesState?.amenagements?.[place]?.includes(id)),
    geometryOf,
    setGeometry,
  });
  const endRemise = remiseRun.end;
  const playRemise = (r: RemisePlay | null, on?: RemiseEvents) => {
    if (!r) return remiseView(null);
    if (disposed || asked || mapView) return;
    if ('caisse' in r) {
      const placed = placedCaisse(r.place, r.caisse.count, r.caisse.block);
      endRemise();
      remiseView(r.place, undefined, placed.box);
      if (!remise) return;
      remiseRun.play({ place: r.place, id: null, placed, from: { x: 0, y: REMISE_DROP, z: 0 }, per: REMISE_TIMING.element }, on);
      return;
    }
    if (!amenagementById(r.amenagement)) return;
    endRemise();
    remiseView(r.place, r.amenagement);
    if (!remise) return;
    const placed = placedAmenagement(r.amenagement, ground);
    // L'objet apporté part de la main de Kéo (sa hauteur), et glisse jusqu'à sa place ; un élément descend de haut.
    const from = r.carry ? carryFrom(r.place, placed.box) : { x: 0, y: REMISE_DROP, z: 0 };
    remiseRun.play({ place: r.place, id: r.amenagement, placed, from, per: r.carry ? REMISE_TIMING.carry : REMISE_TIMING.element }, on);
  };
  /** D'où part l'objet apporté, depuis sa place : la main de Kéo (à mi-hauteur de son corps), le bas de l'objet dedans. */
  const carryFrom = (place: PlaceId, box: WorldBox): Vec3 => {
    const k = scenetteKeo(place, remisePosed(place));
    const hand = { x: k.at.x, y: k.at.y + KEO_HEIGHT * k.scale * 0.45, z: k.at.z };
    return { x: hand.x - (box.min[0] + box.max[0]) / 2, y: hand.y - box.min[1], z: hand.z - (box.min[2] + box.max[2]) / 2 };
  };
  const remiseStart = () => remiseRun.start();
  const remiseFinish = () => remiseRun.finish();
  const stepRemise = (t: number) => remiseRun.step(t);
  const scenetteEnd = (lit: boolean) => {
    if (!asked || !scenette) return;
    // Une scénette posée (les Quais, les Filets, les Écluses) : la scène reste ; à la réussite, le décor change, un
    // objet va à sa place, puis une lumière s'allume (environ 1,5 s ; l'état final tout de suite avec « Réduire les
    // animations »).
    if (!answersHang(scenette, posed)) {
      if (!lit || finaleShown) return;
      const f = scenetteFinale(scenette, asked.scene, asked.scale, posed, scenetteMission ?? '');
      if (!f) return;
      finaleShown = true;
      setGeometry(decorMesh, f.decor);
      if (f.clearsItem) {
        itemShown = false;
        itemMesh.visible = false;
      }
      // Rien ne va à sa place (aux Filets sans les abords) : la réaction reste où elle est.
      if (!f.moving.triangles) return;
      const from = reactionMesh.visible ? reactionMesh.position.clone() : new THREE.Vector3(f.from.x, f.from.y, f.from.z);
      reaction = null;
      reactionMesh.rotation.set(0, 0, 0);
      setGeometry(reactionMesh, f.moving);
      finale = { from, start: performance.now() / 1000, f };
      stepFinale(finale.start);
      return;
    }
    // Au Phare, les cloches s'effacent : la lanterne s'allume quand son haut est posé, jamais à une réussite (directeur
    // artistique, 15 octobre 2026) ; la trace de la mission se voit au retour.
    itemShown = false;
    itemMesh.visible = false;
    reactionMesh.visible = false;
    reaction = null;
  };

  /** L'objet de la réussite qui va à sa place à l'instant `t`, puis, posé, la lumière qui s'allume. */
  const stepFinale = (t: number) => {
    if (!finale || !scenette) return;
    const { from, start, f } = finale;
    const u = reduceMotion ? 1 : Math.min(1, (t - start) / FINALE_MOVE_SECONDS);
    const e = u * u * (3 - 2 * u);
    reactionMesh.visible = true;
    reactionMesh.position.set(mix(from.x, f.to.x, e), mix(from.y, f.to.y, e) + f.arc * Math.sin(Math.PI * e), mix(from.z, f.to.z, e));
    if (u < 1) return;
    // Posé : il rejoint le décor de près (aucun appel de plus), et le maillage de la réaction dessine la lumière.
    const decor = new FacetBuilder();
    decor.append(f.decor);
    decor.append(f.landed);
    setGeometry(decorMesh, decor.build());
    finale = null;
    if (!f.glow) {
      reactionMesh.visible = false;
      return;
    }
    setGeometry(reactionMesh, f.glow);
    reactionMesh.material = lampMaterial;
    reactionMesh.position.set(0, 0, 0);
    lampLit = true;
    lampMaterial.color.copy(lampOff);
    lampStart = t;
    stepLamp(t);
  };

  // La pose d'une partie (GD-20, lot 1), après le bilan : la caméra va vers le lieu, du côté de sa porte (`rise`), la
  // partie descend à sa place (`drop`, dans son maillage à part, plus claire), on la regarde (`look`), puis la caméra
  // rejoint Kéo (`back`). Avec « Réduire les animations », la partie est posée d'un coup, la caméra coupe sur le lieu
  // puis revient (`still`).
  // Un toucher, « Y aller », la Carte ou une question la finissent.
  const poseFrom: CameraPose = { position: { x: 0, y: 0, z: 0 }, target: { x: 0, y: 0, z: 0 }, fov: 0, lens: 0 };
  const poseTo: CameraPose = { position: { x: 0, y: 0, z: 0 }, target: { x: 0, y: 0, z: 0 }, fov: 0, lens: 0 };
  /** La caméra entre deux poses, à la part `e` (déjà adoucie). */
  const tween = (from: CameraPose, to: CameraPose, e: number) => {
    for (const k of ['x', 'y', 'z'] as const) {
      between.position[k] = mix(from.position[k], to.position[k], e);
      between.target[k] = mix(from.target[k], to.target[k], e);
    }
    between.fov = mix(from.fov, to.fov, e);
    between.lens = 0;
    applyPose(between);
  };
  /** La partie à sa place : réunie aux lieux, son maillage à part vidé. */
  const landPose = () => {
    if (!holding) return;
    holding = null;
    poseMesh.visible = false;
    poseMesh.geometry.dispose();
    poseMesh.geometry = new THREE.BufferGeometry();
    placeVisibility();
  };
  // Le déroulé (world/continu/construction.ts, `createPoseRun`) : sa fin, par n'importe quel chemin, rend la caméra à
  // Kéo et dit à la page que les célébrations peuvent venir.
  const poseRun = createPoseRun({
    rise: (e) => tween(poseFrom, poseTo, e),
    // Elle descend, de haut (on la voit au-dessus de sa place), et ralentit en arrivant (rien ne rebondit).
    drop: (e) => {
      poseMesh.position.y = POSE_DROP * (1 - e);
      poseMesh.visible = true;
    },
    land: landPose,
    turn: () => {
      copyPose(current, poseFrom);
      followPose(focus, lift, poseTo, yaw);
      lookUp(poseTo, lanternTop, keoFeet, look, viewH);
      if (exit) exitView(poseTo, exit.keep, keoFeet, back, exit.view);
    },
    back: (e) => tween(poseFrom, poseTo, e),
    done: () => {
      follow();
      options.onPosed();
    },
  });
  /** Les parties qui arrivent dans un lieu : la pose commence. */
  const startPose = (place: PlaceId, parts: readonly PartShape[]) => {
    // Une pose en cours (deux réussites rapprochées) passe la main sans dire sa fin : seule la dernière la dit.
    poseRun.handOver();
    finishLay();
    holding = { place, parts };
    placeVisibility();
    setGeometry(poseMesh, constructionFacets(place, parts, ground));
    poseMesh.visible = false;
    copyPose(current, poseFrom);
    poseView(place, ground, poseTo);
    poseRun.start(performance.now() / 1000, reduceMotion);
    if (reduceMotion) applyPose(poseTo);
  };
  /** Finit la pose tout de suite : la partie posée, la caméra derrière Kéo (une coupe). */
  const finishPose = () => poseRun.finish();
  /** La pose à l'instant `t` (en secondes). */
  const stepPose = (t: number) => poseRun.step(t);
  const setPlaces = (state: PlacesState, pose?: { place: PlaceId; parts: readonly PartShape[] }): boolean => {
    placesState = state;
    // La livraison écrite (l'état final de la remise) : l'aménagement entre dans les lieux, son maillage à part se cache.
    if (remiseRun.active && remise && placesState.amenagements?.[remise.place]?.includes(remise.extra ?? '')) remiseMesh.visible = false;
    if (pose?.parts.length && !asked && !mapView) {
      startPose(pose.place, pose.parts);
      return true;
    }
    placeVisibility();
    return false;
  };

  // La scénette d'assemblage (GD-20, lot 2), au retour d'une question réussie : la pile d'avant et l'établi vide dans le
  // maillage des lieux ; les pièces, puis le bloc assemblé, dans le maillage de la réaction (aucun appel de plus, aucune
  // question n'est ouverte en même temps). Les pièces se joignent sur l'établi, le bloc monte et va se coucher sur le
  // râtelier, en travers ; posé, il rejoint la pile. Un toucher, une question, la Carte ou « Y aller » la finissent.
  const settle = () => {
    reactionMesh.visible = false;
    reactionMesh.position.set(0, 0, 0);
    reactionMesh.rotation.set(0, 0, 0);
    reactionMesh.scale.set(1, 1, 1);
  };
  const finishAssembly = () => {
    if (!assembly) return;
    assembly = null;
    settle();
    placeVisibility();
    options.onAssembled();
  };
  const startAssembly = () => {
    finishLay();
    finishPose();
    finishAssembly();
    if (!port || !port.recipe.pieces.length || port.pile < 1 || asked || mapView) return options.onAssembled();
    unlitReaction();
    const scene = assemblyScene(port);
    assembly = { start: performance.now() / 1000, scene, joined: false };
    placeVisibility();
    settle();
    setGeometry(reactionMesh, scene.pieces);
    reactionMesh.position.set(scene.from.x, scene.from.y, scene.from.z);
    if (reduceMotion) finishAssembly();
  };
  /** La scénette d'assemblage à l'instant `t` (en secondes). */
  const stepAssembly = (t: number) => {
    if (!assembly) return;
    const u = t - assembly.start;
    if (u < ASSEMBLY.join) {
      // Les pièces se serrent l'une contre l'autre, sur l'établi.
      const e = u / ASSEMBLY.join;
      reactionMesh.scale.x = 1 - 0.6 * e * e * (3 - 2 * e);
      return;
    }
    if (!assembly.joined) {
      assembly.joined = true;
      setGeometry(reactionMesh, assembly.scene.made);
      reactionMesh.scale.set(1, 1, 1);
    }
    const v = Math.min(1, (u - ASSEMBLY.join) / ASSEMBLY.carry);
    const e = v * v * (3 - 2 * v);
    const { from, to } = assembly.scene;
    reactionMesh.position.set(mix(from.x, to.x, e), mix(from.y, to.y, e) + ASSEMBLY.arc * Math.sin(Math.PI * e), mix(from.z, to.z, e));
    reactionMesh.rotation.y = (-Math.PI / 2) * e;
    if (v >= 1) finishAssembly();
  };

  const resize = () => {
    const w = host.clientWidth;
    const h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    viewW = w;
    viewH = h;
    // La taille a changé : le décalage se repose sur la nouvelle taille (la page redonne la place d'une question).
    appliedShift.x = Number.NaN;
    if (mapView) {
      const first = mapView === mapFirst;
      mapFar = 0;
      mapView = first ? mapStart(aspect()) : clampMap(mapView, aspect());
      mapFirst = first ? mapView : null;
      // L'écran a changé de taille avant tout toucher : la vue de départ se choisit de nouveau, avant de se dessiner.
      if (first) mapSettling = MAP_SETTLE_FRAMES;
      showMap();
    } else if (remise && !asked) refitRemise();
    else applyPose(asked ? asked.pose : pose);
  };
  const observer = new ResizeObserver(resize);
  observer.observe(host);

  // La boucle d'image : la marche, la caméra qui suit, la marque (quelques petits objets par image : la place de Kéo, la marque).
  let frame = 0;
  let last = performance.now();
  let slowFrames = 0;
  const loop = () => {
    frame = requestAnimationFrame(loop);
    const now = performance.now();
    if (document.hidden) {
      // Au retour sur la page, la première image ne rattrape pas le temps passé ailleurs.
      last = now;
      return;
    }
    if (now - last > SLOW_FRAME_MS && renderer.getPixelRatio() > 1) {
      if (++slowFrames > SLOW_FRAMES) renderer.setPixelRatio(1);
    } else slowFrames = 0;
    const dt = Math.max(0, Math.min(0.1, (now - last) / 1000));
    last = now;
    const t = now / 1000;
    // Les ailes de la pompe à vent tournent lentement ; à l'arrêt avec « Réduire les animations ».
    if (!reduceMotion) vaneAngle.value = (t * VANE.turn) % (2 * Math.PI);
    // Le rotor de la Turbine tourne lentement, à l'arrêt pendant toute question et sur la Carte (il reprend où il s'était
    // arrêté).
    if (!reduceMotion && !asked && !scenette && !mapView) rotorAngle.value = (rotorAngle.value + dt * ROTOR.turn) % (2 * Math.PI);
    let moving = false;
    if (walk) {
      const state = walkAt(walk, now, reduceMotion);
      here = state.at;
      moving = state.moving;
      if (state.heading !== null) heading = state.heading;
      if (!state.moving) arrive(walkTarget);
    }
    if (mapView) {
      // La Carte : rien ne bouge que ce que les doigts font glisser ; les lieux à l'écran, pour leurs étiquettes.
      if (mapSettling) {
        // Les points à l'écran de la vue de départ, pour les étiquettes, sans la dessiner (`mapSettling`).
        mapSettling--;
        camera.updateMatrixWorld();
        reportMapPlaces();
        if (!mapSettling) mapDirty = true;
      } else if (mapDirty) {
        mapDirty = false;
        // Après le rendu : la caméra y a refait ses matrices, les points à l'écran sont ceux de l'image.
        renderer.render(scene, camera);
        reportMapPlaces();
      }
      meter?.tick(renderer.info, now);
      return;
    }
    if (asked) {
      // Pendant une question, la caméra ne bouge pas (sauf la descente dans une scénette, moins d'une seconde) ; seule
      // la réaction joue, puis la Roue tourne ; dans une scénette, Kéo se tient là, au repos, et la lampe s'allume.
      stepDescent(t);
      placeReaction(t);
      stepFinale(t);
      stepLamp(t);
      if (scenette) body.bouger(t, dt, false, reduceMotion, WALK_CADENCE);
      options.onMark(null);
      hideLocks();
      renderer.render(scene, camera);
      meter?.tick(renderer.info, now);
      return;
    }
    if (remise) {
      // Le cadrage de la remise : la caméra fixe, Kéo au repos ; la remise jouée (lot L1) pose ses éléments.
      stepRemise(t);
      body.bouger(t, dt, false, reduceMotion, WALK_CADENCE);
      options.onMark(null);
      hideLocks();
      renderer.render(scene, camera);
      meter?.tick(renderer.info, now);
      return;
    }
    if (assembly) {
      // La scénette d'assemblage : la caméra reste derrière Kéo, le bloc va de l'établi au râtelier.
      stepAssembly(t);
      body.bouger(t, dt, false, reduceMotion, WALK_CADENCE);
      options.onMark(null);
      hideLocks();
      renderer.render(scene, camera);
      meter?.tick(renderer.info, now);
      return;
    }
    if (poseRun.active) {
      // Une pose : la caméra va vers la maison et en revient, Kéo attend où il est ; ni marque ni cadenas.
      stepPose(t);
      body.bouger(t, dt, false, reduceMotion, WALK_CADENCE);
      options.onMark(null);
      hideLocks();
      renderer.render(scene, camera);
      meter?.tick(renderer.info, now);
      return;
    }
    // La pose d'un pont : la caméra reste où elle est, Kéo attend sur la culée.
    stepLay(t);
    placeKeo(here);
    // Il se tourne vers son cap en douceur, par le plus court (d'un coup avec « Réduire les animations »).
    const turn = Math.atan2(Math.sin(heading - keo.rotation.y), Math.cos(heading - keo.rotation.y));
    keo.rotation.y += reduceMotion ? turn : turn * Math.min(1, dt * 12);
    body.bouger(t, dt, moving, reduceMotion, WALK_CADENCE);
    // La caméra rattrape Kéo hors de sa zone morte, et monte si le relief le cache ; arrêté près du Phare, elle lève
    // le regard vers la lanterne (jamais pendant la marche).
    stepTurn(now);
    followStep(focus, aimed(), dt, reduceMotion);
    lift = liftStep(lift, occlusionLift(focus, ground, yaw), dt, reduceMotion);
    look = lookUpStep(look, nearLantern() ? 1 : 0, dt, reduceMotion);
    if (back > 0 && !atExit()) back = reduceMotion ? 0 : Math.max(0, back - dt / EXIT_VIEW.down);
    if (back === 0) exit = null;
    follow();
    updateRings();
    if (freeMark.visible) fitFreeMark();
    // Une tuile de près au plus par image : la suivante de la file, puis l'anneau de près refait avec elle.
    if (tiles.pump() !== null) setNear(false);
    reportMark();
    reportLocks();
    drawWithSilhouette();
    meter?.tick(renderer.info, now);
  };
  loop();
  // L'arrivée dans le monde : les tuiles de la Carte se préparent au repos.
  startPrebuild();

  return {
    goTo: (place, jump = false) => {
      finishLay();
      finishPose();
      finishAssembly();
      setMap(null);
      if (jump) jumpTo(place);
      else startWalkTo(atNode(placeById(place).door), place);
    },
    skip: () => {
      if (!walk) return;
      walk = skipWalk(walk, performance.now());
    },
    turn: (step) => {
      if (mapView || asked || scenette || remise) return;
      turnTo(step === 0 ? 0 : (turning?.to ?? yaw) + step * CAMERA_TURN.step);
    },
    goToPort: (spot) => {
      finishLay();
      finishPose();
      finishAssembly();
      setMap(null);
      jumpToPort(spot);
    },
    setPort: (state) => {
      port = state;
      placeVisibility();
      mapDirty = true;
    },
    frame: setFrame,
    assemble: startAssembly,
    setMark: (place) => {
      if (place === markPlace) return;
      markPlace = place;
      placeVisibility();
      mapDirty = true;
    },
    setLands,
    layLand: (land, events) => {
      // Une seule pose annoncée à la fois : une seconde, avant que les terres changent, effacerait la phrase de la
      // première (relecture du lot 2) ; la page ne l'annonce pas, la scène la refuse aussi.
      if (pendingLay) return;
      pendingLay = { land, events };
    },
    keoAt: () => ({ x: here.x, z: here.z }),
    question: askQuestion,
    map: setMap,
    reframeMap: reframeStart,
    scenetteEnd,
    setPlaces,
    remiseView: (place) => remiseView(place),
    remise: playRemise,
    remiseStart,
    remiseFinish,
    setSigns,
    info: () => ({ calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, mapMs }),
    portAt: (clientX: number, clientY: number) => {
      const p = hitAt(clientX, clientY);
      return p ? portTouch(p) : null;
    },
    dispose: () => {
      disposed = true;
      laying = null;
      pendingLay = null;
      cancelAnimationFrame(frame);
      window.clearTimeout(wheelRest);
      window.clearTimeout(gridTimer);
      window.clearTimeout(markPulse);
      if (gridHandle) cancelIdle(gridHandle);
      if (idleHandle) cancelIdle(idleHandle);
      observer.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onDown);
      renderer.domElement.removeEventListener('pointerup', onUp);
      renderer.domElement.removeEventListener('pointercancel', onCancel);
      renderer.domElement.removeEventListener('pointermove', onMove);
      renderer.domElement.removeEventListener('wheel', onWheel);
      body.dispose();
      habitants.dispose();
      for (const g of geometries) g.dispose();
      for (const m of [itemMesh, reactionMesh, placesMesh, landmarkMesh, poseMesh, remiseMesh, veilMesh, decorMesh]) m.geometry.dispose();
      lampMaterial.dispose();
      poseMaterial.dispose();
      nearRing.dispose();
      farRing.dispose();
      landMaterial.dispose();
      landmarkMaterial.dispose();
      veilMaterial.dispose();
      seaMaterial.dispose();
      seaTexture.dispose();
      skyMaterial.dispose();
      ringMaterial.dispose();
      shadowMaterial.dispose();
      silhouetteMaterial.dispose();
      meter?.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
