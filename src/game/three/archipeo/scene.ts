// La scène du monde continu (prototype du monde ouvert d'Archipéo, 6e, piste B « chemins aimantés ») : le terrain en
// tuiles, la mer et le lagon, les chemins, les quatre lieux, Kéo ; le toucher qui l'envoie au point du chemin le plus
// proche, sa marche ; la marque de la prochaine mission, donnée à la page à chaque image. Piste 1, lot 1 : l'île
// agrandie, la caméra qui suit Kéo (world/continu/camera.ts), le terrain rassemblé en deux anneaux autour de lui (de
// près, de loin), la brume au loin et sur les terres fermées. Les terres (GD-20, point 3, « vraies terres, vrais
// ponts ») : le pont tombé de chaque terre fermée, où Kéo s'arrête sur la culée, et le pont rebâti de celles qu'on a
// reliées, dans le maillage des lieux ; sur la Carte, chaque pont en trait double.
// Chargée à la demande avec la page (./OpenWorldPage.tsx), seulement derrière le drapeau `?monde=ouvert`
// (../../worldLayoutFactory.tsx). Tout ce qui se calcule sans Three.js est dans world/continu/. Depuis GD-22 (lot 2), elle
// lit ce que son niveau dessine (world/continu/levelWorld.ts) : au 5e, sans ce qui n'est encore qu'au 6e (`sixth`).
import * as THREE from 'three';
import { loadKeo } from '../../importedCharacters';
import { createHabitantModels } from './habitantModels';
import { createWorldHabitantModels } from './worldHabitantModels';
import { createEquipierModels } from './equipierModels';
import { guideOf } from '../../world/continu/equipage';
import { loadNef } from '../../importedNef';
import { nefParts } from '../../world/nefModels';
import { blendPose, nefArrivingParts, nefAtBerth, nefModelFacets, nefSheetPose, nefShownParts, type NefFlight, type NefLook } from '../../world/continu/nef';
import { loadedKeo } from '../../world/characters/imported/keo';
import type { CameraScript } from '../../world/continu/cameraPath';
import { vigilScript, type Vigil } from '../../world/continu/vigil';
import { KEO_HEIGHT, KEO_WORLD_SCALE, LOOK_UP, orbitAround, MARK_LIFT, COMMON_DETOUR_VIEW, cliffHold, detourRise, detourViewStep, fitArrivalBack, followPose, followStep, holdStep, liftStep, lookUp, lookUpStep, markBeside, markPoint, markOffset, occlusionLift, screenOf, wrapAngle, type CameraPose, type CliffHold, type DetourView } from '../../world/continu/camera';
import { DETOUR_TIMING, DETOURS, FAUNA, FAUNA_BLOW, FAUNA_END, birdFacets, detourAtPoint, detourCap, detourFacets, faunaPose, spoutFacets, whaleFacets, detourViewOf, type DetourId } from '../../world/continu/detours';
import { hutteFacets } from '../../world/continu/hutte5e';
import { dalleFacets } from '../../world/continu/dalle4e';
import { epaveFacets } from '../../world/continu/epave4e';
import { recoinFacets } from '../../world/continu/recoin4e';
import { replatFacets } from '../../world/continu/replat4e';
import { cadranFacets } from '../../world/continu/cadran3e';
import { bergerieFacets } from '../../world/continu/bergerie3e';
import { cedreFacets } from '../../world/continu/cedre3e';
import { lacFacets } from '../../world/continu/lac3e';
import { constructionFacets, createPoseRun, fallenFacets, lanternLit, POSE_DROP, posedTraces, poseView, rowPosed, ruinFacets, stageComplete, traceStagePosed, type PartShape } from '../../world/continu/construction';
import { FacetBuilder, mergeFacets, placeFacets, type Facets } from '../../world/continu/facets';
import { distance, linearRgb, type Vec2, type Vec3 } from '../../world/continu/geometry';
import { clampMap, mapFarPlane, mapLabelSide, mapPose, mapStart, panMap, reframeMap, zoomMap, type MapView } from '../../world/continu/map';
import { BRIDGE_TOUCH, bridgeDeck, bridgeFacets, bridgeFloor, bridgeLayRest, bridgeLockPoint, bridgeLockRange, bridgeMapMark, bridgeSite, cabinCarBox, cabinCarFacets, cabinCarFloor, cabinPoint, cabinStops, cabinYaw, clampToOpen, colGalleryOf, colRoofOpen, type CabinCar } from '../../world/continu/bridges';
import { cabinButtonRoute, cabinCarOpen, cabinOf, cabinSide, routeWithRide } from '../../world/continu/cabinRide';
import { creuxFacets } from '../../world/continu/creux5e';
import { failleFacets, failleTapTarget } from '../../world/continu/faille5e';
import { perchoirFacets } from '../../world/continu/perchoir5e';
import { MONTEE_GLOW, monteeGlowBand, monteeGlowFront } from '../../world/continu/montee5e';
import { bridgeLay, bridgeLayAt, bridgeLayColors, bridgeLayDrawn, bridgeLayPositions, type BridgeLay, type BridgeLayState } from '../../world/continu/bridgeLay';
import { bridgeSpot, firstClosed, isBridgeSpot, isLinkedLand, landOf, linkedLands, type BridgeSpot, type LinkedLand } from '../../world/continu/lands';
import { hasScenette, placeById, type LevelPlan, type OpenWorldLevel, type PlaceId, type ScenePlaceId } from '../../world/continu/levelPlan';
import { HABITANT_HEIGHT, hasHabitantModel } from '../../world/continu/habitants';
import { arrivalViewOf, doorFrameOf, doorViewOf, placeArt } from '../../world/continu/northShore';
import { levelWorld, type LevelWorld, type ThinFog } from '../../world/continu/levelWorld';
import { riftMistFacets } from '../../world/continu/mist5e';
import { COLORS_5E } from '../../world/continu/plan5e';
import { onPlateau, plateauShare } from '../../world/continu/terrain5e';
import { freeRoute, isWalkable, nearestWalkable, onPathCell, walkGridSteps, type WalkGrid } from '../../world/continu/freeWalk';
import { distanceSign, markOnScreen, type MarkOnScreen } from '../../world/continu/mission';
import { edgesNear, pathTopAt, type NetworkPoint } from '../../world/continu/paths';
import type { DialShown } from '../../world/continu/placeArt';
import { COLORS_6E, hidesTraces, portNode, type PortSpot } from '../../world/continu/plan6e';
import { ENGINE_ROTOR_COLORS, LAMP_COLOR, STEAM_COLORS, engineRotorHub, lanternLight, modelOfPlace } from '../../world/continu/places';
import { PAPER_COLOR } from '../../world/continu/printworks';
import { assemblyScene, portFacets, portHeading, portMapPoint, portRooflines, portSubject, portTouch, type PortState } from '../../world/continu/port';
import { HELD_LIFT, SALT_PUMP, answerScale, facingAnswerObjects, inBasket, itemScene, placeTrace, rankInBasket, saltPumpHub, sceneSpot, sortPrise, sortScales, swingTo, type Reaction, type SortLook } from '../../world/continu/questionScene';
import { REACTION_SECONDS, type ItemScene } from '../../world/continu/questions';
import { RESPOND_MAX, RESPOND_SECONDS, type RespondMove, respondMove, respondPlaced, responds } from '../../world/continu/respond';
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
  traceViewOf,
  type ExitView,
  scenetteFinale,
  scenetteHidesPieces,
  scenetteTraces,
  scenetteHidesPlace,
  scenetteKeo,
  scenetteHabitant,
  scenetteGuide,
  scenettePose,
  scenetteStartYaw,
  scenetteArc,
  turnSceneYaw,
  startSceneReturn,
  stepSceneReturn,
  stopSceneReturn,
  type SceneReturn,
  type ScenetteFinale,
  type ScenetteLayout,
  saysRestored,
} from '../../world/continu/scenette';
import { SEA_TEXTURE } from '../../world/continu/sea';
import { skyDome, type HeightLight } from '../../world/continu/sky';
import { FOLLOW_FAR_5E } from '../../world/continu/nef5e';
import { FOLLOW_FAR_4E } from '../../world/continu/crique4e';
import { FOLLOW_FAR_3E, NEF_PARURES } from '../../world/continu/parvis3e';
import { ringHeights, standingHeight, tileRings } from '../../world/continu/terrain';
import { createTileStore, type Tile } from '../../world/continu/tiles';
import { veilFacets, type VeilMesh } from '../../world/continu/veil';
import { WALK_CADENCE, skipWalk, startWalk, walkAt, type Walk } from '../../world/continu/walk';
import { seatedHeight } from '../../world/continu/corps';
import { hasWorldHabitant, worldHabitantAt, worldHabitantHeight } from '../../world/continu/worldHabitants';
import { GESTE_SETTLE, activeGeste, gesteCandidates, gestePhase, moveMobile, worldGestes, type GesteCandidate, type MobilePiece } from '../../world/continu/gestes';
import { corpsDuBonhomme, type CorpsDuBonhomme } from '../paintedCharacters';
import { createMeter } from '../meter';
import { placedAmenagement } from './amenagements';
import { amenagementById, remiseFrame, remisePosed, showsAmenagements, type WorldBox } from '../../world/continu/amenagements';
import { placedCaisse } from '../../world/continu/caisse';
import { REMISE_DROP, REMISE_TIMING } from '../../world/continu/remise';
import { createRemiseRun, createSignsTracker, type RemiseEvents, type SignOnScreen, type SignSpot } from './remiseRun';
import { nearestPlace, screenRect, touchedObject, type ObjectTarget } from '../../world/continu/toucher';
import { assignSpots, wildlifeGroups6e, type CritterPose } from '../../world/continu/wildlife';
import { allCritterForms, wildlifeGroups5e } from '../../world/continu/wildlife5e';
import { createResolution } from './resolution';
import { createTextureUploads } from './textureUploads';

/** Ce que la page donne à la scène. */
export interface OpenWorldOptions {
  /** Le plan du niveau (GD-22) : ses lieux, ses terres, l'étendue de son terrain, et le niveau de Kéo. */
  plan: LevelPlan;
  /** Le lieu où Kéo se tient au départ, ou l'endroit de l'Escale (son quai, une porte de l'école…). */
  start: PlaceId | PortSpot;
  /**
   * Les pièces du Rafiot rendues au Fanal du 3e (la fin des Ferrailleurs jouée) : au 4e, le pont du Rafiot est vide
   * (`Departure.decor`). Lu à la création : le Fanal ne se restaure pas pendant qu'on est au 4e.
   */
  piecesReturned?: boolean;
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
   * L'habitant d'un lieu touché près de sa porte, hors de sa scénette (GD-27, la parole du lieu) : la page lui fait dire
   * une ligne ; Kéo ne bouge pas.
   */
  onHabitant?(place: PlaceId): void;
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
   * Un lieu qui s'anime à sa restauration (`PlaceArt.restoration`, la Forge du 4e) vient d'être achevé : son allumage
   * commence (ou se pose d'un coup, avec « Réduire les animations ») ; la page dit son état, écrit et à voix haute.
   */
  onRestored?(place: PlaceId): void;
  /**
   * La vue finale du niveau ou une veillée commence (`true`) ou finit (`false`) : la page cache ses boutons le temps
   * qu'elle dure.
   */
  onCameraScript?(playing: boolean): void;
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
  /**
   * Kéo s'est arrêté sur un Détour (GD-20, déplacement libre, lot 2) : immobile quelques dixièmes de seconde sur son
   * plateau ou au bord d'eau (jamais au passage), puis `null` dès qu'il en repart ; la page écrit son nom, le garde trouvé,
   * propose « Rallumer » au cairn.
   */
  onDetour?(id: DetourId | null): void;
  /** La baleine du bord d'eau souffle : la page fait entendre son souffle si les sons sont actifs. */
  onWhaleBlow?(): void;
  /** La Nef, son ber ou le banc du large touché (GD-21) : la page ouvre la fiche de la Nef, Kéo reste où il est. */
  onNef?(): void;
  /**
   * La cabine de la Montée (GD-22, lot 3) : Kéo à l'arrêt à la gare du pied (`bas`, la page ajoute « Monter » à côté de
   * « Y aller »), à celle du haut (`haut`, « Descendre ») ou ailleurs (`null`, aussi pendant toute marche) ; `riding`,
   * pendant que la caisse roule, où elle va (à son arrivée, la page l'annonce). À chaque changement.
   */
  onCabin?(cabin: { side: 'bas' | 'haut' | null; riding: 'haut' | 'bas' | null }): void;
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
   * Retient le geste du métier (GD-27, lot 5) : tant que `on`, l'outil de l'habitant actif reste au repos, le temps
   * d'une ligne écrite et dite dans la phrase du monde (référent dys : rien ne bouge pendant qu'on lit).
   */
  holdGestes(on: boolean): void;
  /**
   * La cabine de la Montée (GD-22, lot 3, le bouton « Monter » ou « Descendre », ou la caisse touchée) : de la gare où se
   * tient Kéo, elle monte ou descend ; rien ailleurs, pendant un trajet, une question ou sur la Carte, ni tant que la
   * cabine n'est pas reliée.
   */
  ride(): void;
  /**
   * Kéo d'un coup en un point du sol (les mesures et les captures seulement : la vue d'un Détour) ; la caméra le suit
   * d'un bloc. Rien si l'on n'y marche pas.
   */
  standAt(p: Vec2): void;
  /**
   * La caméra posée à la main, de `position` vers `target`, de champ `fov` (les captures seulement : un lieu vu en entier,
   * de loin) ; elle y reste jusqu'au prochain geste (`standAt`, `goTo`, `turn`, un toucher). `null` : elle reprend Kéo.
   */
  view(at: { position: Vec3; target: Vec3; fov?: number } | null): void;
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
   * terre fermée, l'un de ses lieux : le pont à rebâtir, si Kéo se tient devant ; `'nef'`, la Nef sur son ber, pour sa
   * fiche), sans bouger (un décalage de l'image).
   */
  frame(free: { left: number; top: number; width: number; height: number } | null, place?: PlaceId | 'nef'): void;
  /**
   * La scénette d'assemblage, au retour d'une question réussie : les pièces de l'établi se joignent en un bloc, que la
   * grue pose sur le râtelier ; un toucher la passe, d'un coup avec « Réduire les animations ». `onAssembled` dit sa fin.
   */
  assemble(): void;
  /**
   * Le lieu marqué (la prochaine mission), ou aucun : le seul lieu qui dépasse la brume ; ou `'nef'`, la Nef prête sur son
   * ber (GD-21, « Prête » : le passage prêt passe en tête), sa marque au-dessus d'elle.
   */
  setMark(place: PlaceId | 'nef' | null): void;
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
   * Écoute les repères de la scène quand la caméra tourne pendant une scénette (deux doigts, « caméra libre ») : ils
   * suivent le décor, comme ceux que rend `question`. Rend de quoi ne plus écouter.
   */
  onSceneTurn(listener: (labels: LabelOnScreen[]) => void): () => void;
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
  /**
   * Les lieux dont l'habitant a une pastille (trois au plus), ou aucun ; et `'nef'`, la pastille de la Nef sur laquelle
   * on peut poser (GD-25), au-dessus d'elle, là où se pose sa marque.
   */
  setSigns(places: readonly SignSpot[]): void;
  /**
   * Les Détours trouvés (leur sente tracée, dans le monde et sur la Carte) et les cairns rallumés (GD-20, déplacement
   * libre, lot 2), dans le maillage des lieux : refait seulement s'ils changent.
   */
  setDetours(found: readonly DetourId[], lit: readonly DetourId[]): void;
  /**
   * Où en est la Nef de l'Escale (GD-21) : le ber vide, la coque, le mât, la voile hissée, ou partie. Un temps qui
   * arrive descend à sa place (d'un coup avec « Réduire les animations ») ; le reste est dans le maillage des lieux.
   */
  setNef(look: NefLook): void;
  /**
   * Les parures posées de l'aéronef au repos du 3e (GD-25) : 0 à 3, dans l'ordre (la figure de proue, le pavois, les
   * feux). Comme un temps de la Nef, la parure qui arrive descend à sa place, d'un coup avec « Réduire les animations »,
   * jamais sur la Carte, pendant une question ni une scénette ; rien avant d'être posée. Sans effet ailleurs qu'au 3e.
   */
  setParures(look: 0 | 1 | 2 | 3): void;
  /**
   * Le départ de la Nef (GD-21) : la caméra ne bouge pas, la Nef glisse vers la passe, le banc se retire ; huit secondes
   * au plus, qu'un toucher termine (d'un coup avec « Réduire les animations ») ; `done` à la fin, par n'importe quel chemin.
   */
  departNef(done: () => void): void;
  /**
   * La vue finale du niveau (`LevelWorld.finalView`, au 3e), jouée tout de suite, comme à la fin de l'allumage de son lieu
   * (les captures seulement) ; rien ailleurs, sur la Carte ou pendant une question.
   */
  playFinal(): void;
  /**
   * Une veillée (GD-23, GD-27, lot 3 : world/continu/vigil.ts) : la caméra quitte Kéo pour ses plans, et revient derrière
   * lui à la fin ou au premier toucher ; `done` alors, par n'importe quel chemin. `false`, sans rien faire, sur la Carte,
   * pendant une question, le départ de la Nef ou un autre script. `pass`, s'il est donné, reçoit le toucher qui passe la
   * veillée à la place de la fin immédiate : la page couvre d'abord, puis appelle `endScript`.
   */
  playVigil(vigil: Vigil, done: () => void, pass?: () => void): boolean;
  /** Termine la vue finale ou la veillée en cours, comme un toucher (Échap, Entrée ou Espace) ; rien s'il n'y en a pas. */
  endScript(): void;
  /** Les chiffres de la dernière image : appels de dessin et triangles (captures, mesures). */
  info(): { calls: number; triangles: number; mapMs: number };
  /** Ce qu'un toucher en ce point de la fenêtre ouvrirait au Port, la Nef comprise, sans rien faire (la mesure des cibles). */
  portAt(clientX: number, clientY: number): PortSpot | 'fiche' | 'nef' | null;
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
  /** `key` : la clé de l'item (un autre item ramène la caméra de la scénette de face). */
  item: { key?: string; scene: ItemScene; answered: boolean; right: readonly number[]; picked: readonly number[]; sort?: SortLook; dial?: DialShown };
  /**
   * Les réponses sorties de la scène (un mot coupé dans son étiquette : l'offre de « Vue simple ») : les objets des
   * réponses et leur support ne se dessinent pas, pour qu'aucun objet sans étiquette ne semble se toucher (retouche 3 du
   * lot 5 du 5e : les miches du Hameau en portrait).
   */
  answersOut?: boolean;
  /**
   * Le monde qui répond (GD-28, lot 4 de GD-27) : le nombre de bonnes réponses de la scénette en cours. Quand il monte
   * d'un cran, l'objet de plus descend sur le monument dès « Valider », à la place de la réaction du témoin de l'item,
   * en un mouvement lent, et reste jusqu'à la sortie de la scénette ; un lieu sans objet (`responds`) ne montre rien.
   */
  responded?: number;
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
  /**
   * Un lieu du haut, ou Kéo sur le plateau (GD-22, lot 2 : le 5e a deux étages) : la Carte met un triangle « en haut » à
   * côté de son nom. Jamais au 6e, qui est à plat.
   */
  up?: boolean;
  /**
   * Ce que les étiquettes laissent à découvert, en pixels : le repère du lieu de loin (aux Radeaux, les trois radeaux sur
   * le chenal ; `PlaceArt.mapClear`). Rempli sur place à chaque pose.
   */
  clear?: { left: number; top: number; right: number; bottom: number };
  /** Son nom reste au-dessus de son point, de son côté (`PlaceArt.nameAbove` : son repère de loin est au sud, sur l'eau). */
  above?: true;
  /** Le côté où son nom se pose d'abord (`OpenPlace.mapSide`, au 4e) ; rien : au-dessus. */
  side?: 'below' | 'left' | 'right';
  /** Un lieu à disposition fixe (`OpenPlace.mapPinned`, au 4e) : son nom posé avant les autres, son point à découvert. */
  pinned?: true;
}

/** Un repère de la scène à l'écran, en pixels. */
export interface LabelOnScreen {
  text: string;
  x: number;
  y: number;
  /** Centré sous son point (les fractions sous les deux sas de Deux rives). */
  center?: boolean;
}

/** La distance (en unités du monde) en deçà de laquelle toucher l'habitant d'un lieu le fait parler (GD-27). */
const HABITANT_REACH = 8;
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
const KEO_SCALE = KEO_WORLD_SCALE;
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
 * La caméra qui tourne aussi pendant une scénette (lot commun des scénettes, choix du mainteneur du 18 octobre 2026 :
 * « caméra libre ») : deux doigts la font tourner autour du point visé de la scène ; les objets des réponses restent
 * sous leurs boutons (ils se reposent au sol sous eux à chaque image du geste), le décor tourne. Elle garde sa distance
 * et sa hauteur (lot transverse des scénettes, piste A du directeur artistique, 21 octobre 2026 : elle ne monte plus sur
 * les toits) ; seulement, elle reste `clearance` unités au-dessus du sol. Ce qui passe entre elle et Kéo ou l'habitant
 * s'estompe (`SEE_THROUGH`).
 */
/** Les pas où la margelle des réponses à terre se relève au-dessus du sol (un seul suffit sur le plat). */
const DECK_RAISES = 4;
const SCENE_TURN = { clearance: 1, keoHead: 1.3, habitantHead: 1.5 } as const;
/**
 * La trame des volumes proches (lot transverse des scénettes, piste A) : pendant une scénette, le lieu, sa maquette et le
 * décor de près qui passent entre la caméra et la tête de Kéo ou de l'habitant se dessinent en trame fine (une part
 * `holes` de leurs pixels tombe, motif ordonné de 4 × 4) : un toit, une dalle ou un tronc ne cache plus la scène. La
 * trame suit un cône autour de chaque regard : `radius` unités autour de la tête, plus `open` par unité vers la caméra
 * (il s'ouvre comme le champ de la vue) ; rien à moins de `keep` de la tête (le sol sous ses pieds, son voisin), et son
 * bord s'adoucit sur `soft` de son rayon. Le sol, l'eau, Kéo, les habitants et les objets des réponses ne s'estompent
 * jamais. Sur le terrain (les arbres, les rochers des tuiles), seuls s'estompent les pans plus raides que `steep` (la
 * part verticale de leur normale) et ce qui passe à plus de `above` unités au-dessus du sol de la scène : jamais le sol
 * sous la caméra. Quelques lignes de shader, aucun triangle ni appel de plus.
 */
const SEE_THROUGH = { radius: 1.3, open: 0.32, keep: 1.4, soft: 0.35, holes: 0.82, steep: 0.7, above: 2.5 } as const;
/**
 * La finesse du rendu : l'anticrénelage reste (la scène est légère, quelques milliers de triangles) ; le rapport de
 * pixels est plafonné à 2, descend d'un cran jusqu'à 1,5 si l'appareil reste sous 50 images par seconde
 * (./resolution.ts), puis est ramené à 1 s'il peine vraiment (des images de plus de 45 ms, trente de suite), comme le
 * monde en grille (../loop.ts).
 */
const SLOW_FRAME_MS = 45;
const SLOW_FRAMES = 30;
/**
 * Kéo arrêté depuis tant de millisecondes avant qu'une texture d'habitant ou d'équipier parte à la carte graphique : la
 * caméra a fini de se poser, l'image qui l'envoie ne coupe aucun mouvement.
 */
const UPLOAD_STILL_MS = 600;
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
/** La fiche de la Nef ouverte : la caméra garde dans la part libre ce point au-dessus de son ber (la nacelle et le bas de l'enveloppe). */
const NEF_FRAMED_HEIGHT = 2.5;
/** La fiche d'une terre fermée garde son pont dans la part libre quand Kéo se tient à moins de tant d'unités de lui. */
const FRAMED_BRIDGE_NEAR = 12;
/** Le bout de la caméra qui suit Kéo, et celui de la Carte (l'île entière, de haut), en unités. */
const FOLLOW_FAR = 500;
// Au 5e, `FOLLOW_FAR_5E` (./world/continu/nef5e.ts), pour le panache de la Nef, au-delà de 500 vu du quai.
/** Le bout de la caméra qui suit Kéo, par niveau : 500 au 6e ; au 5e, au 4e et au 3e, le leur (le panache de leur Nef, leur volcan, leur pic). */
const FOLLOW_FAR_OF: Readonly<Record<OpenWorldLevel, number>> = { '6e': FOLLOW_FAR, '5e': FOLLOW_FAR_5E, '4e': FOLLOW_FAR_4E, '3e': FOLLOW_FAR_3E };
/**
 * Le regard levé au quai du lieu de départ, ou à la porte d'un lieu haut (`PlaceArt.arrivalView`), ne vaut que la caméra
 * tournée à moins de tant de son cap (en radians).
 */
const QUAY_LOOK_TURN = 0.6;
/** Le bout de la caméra de la Carte, au moins (`mapFarPlane` le recule avec la vue). */
const MAP_FAR = 2000;
/** Le rayon du dôme du ciel : en deçà du bout de la caméra qui suit Kéo (`FOLLOW_FAR`) ; dessiné sans profondeur, tout le reste passe devant. */
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
/** Sur la Carte, un lieu ne se montre qu'à tant de pixels du haut (son nom au-dessus) ; des côtés : `mapLabelSide`. */
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
    // Les couleurs sans ombre se reconnaissent par sommet (`vUnlit`), pas par pixel : une facette est d'une seule couleur,
    // le résultat est le même, et le calcul se fait quelques dizaines de milliers de fois par image au lieu de quelques
    // millions (mesure iPad du 24 octobre 2026).
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform vec3 vaneColor;\nuniform vec2 vanePivot;\nuniform float vaneAngle;\nuniform vec3 rotorColor;\nuniform vec3 rotorRim;\nuniform vec2 rotorPivot;\nuniform float rotorAngle;\nuniform vec3 lampColor;\nuniform vec3 steamColor;\nuniform vec3 steamShade;\nuniform vec3 paperColor;\nuniform vec3 pathColor;\nvarying float vUnlit;')
      .replace(
        '#include <color_vertex>',
        '#include <color_vertex>\nvUnlit = 0.0;\n#ifdef USE_COLOR\nif ( all( lessThan( abs( vColor.rgb - lampColor ), vec3( 0.004 ) ) ) || all( lessThan( abs( vColor.rgb - steamColor ), vec3( 0.004 ) ) ) || all( lessThan( abs( vColor.rgb - steamShade ), vec3( 0.004 ) ) ) || all( lessThan( abs( vColor.rgb - paperColor ), vec3( 0.004 ) ) ) || all( lessThan( abs( vColor.rgb - pathColor ), vec3( 0.004 ) ) ) ) vUnlit = 1.0;\n#endif',
      )
      .replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\n#ifdef USE_COLOR\nif ( all( lessThan( abs( color.rgb - vaneColor ), vec3( 0.004 ) ) ) ) {\n\tvec2 vaneD = transformed.xy - vanePivot;\n\tfloat vaneC = cos( vaneAngle ), vaneS = sin( vaneAngle );\n\ttransformed.xy = vanePivot + vec2( vaneC * vaneD.x - vaneS * vaneD.y, vaneS * vaneD.x + vaneC * vaneD.y );\n} else if ( all( lessThan( abs( color.rgb - rotorColor ), vec3( 0.004 ) ) ) || all( lessThan( abs( color.rgb - rotorRim ), vec3( 0.004 ) ) ) ) {\n\tvec2 rotorD = transformed.xy - rotorPivot;\n\tfloat rotorC = cos( rotorAngle ), rotorS = sin( rotorAngle );\n\ttransformed.xy = rotorPivot + vec2( rotorC * rotorD.x - rotorS * rotorD.y, rotorS * rotorD.x + rotorC * rotorD.y );\n}\n#endif',
      );
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vUnlit;')
      .replace('#include <opaque_fragment>', '#ifdef USE_COLOR\noutgoingLight = mix( outgoingLight, vColor.rgb, vUnlit );\n#endif\n#include <opaque_fragment>');
  };
  return m;
}

/**
 * Les couleurs peu voilées (./world/continu/levelWorld.ts, `thinFog` : au 5e, la lumière du Phare au ras de l'horizon,
 * le mur et le panache) : chacune ne garde que sa part du brouillard du lointain (`thinFogK`, lu par le brouillard), et
 * celles qui se dessinent sans ombre (`unlit` : le panache, une fumée et non une roche) gardent leur couleur telle
 * quelle. Une ligne de shader par couleur, une seule comparaison chacune, des constantes (le programme reste celui du 5e),
 * dans le shader des sommets : la part du brouillard (`vThinFogK`) et le sans-ombre (`vUnlit`) passent tels quels aux pixels.
 */
function thinFogLines(list: readonly ThinFog[]): string {
  return list
    .map(({ color, fog, unlit }) => {
      const [r, g, b] = linearRgb(color).map((v) => v.toFixed(5));
      return `if ( all( lessThan( abs( vColor.rgb - vec3( ${r}, ${g}, ${b} ) ), vec3( 0.004 ) ) ) ) { vThinFogK = ${fog.toFixed(2)};${unlit ? ' vUnlit = 1.0;' : ''} }`;
    })
    .join('\n');
}

/**
 * La lumière par la hauteur (GD-22, lot 2, retouche : les deux étages du 5e ; ./world/continu/sky.ts, `HeightLight`),
 * ajoutée au matériau du décor : sous `low`, le soleil affaibli et le ciel renvoyé refroidi (la pénombre sous la
 * canopée) ; au-dessus de `high`, toute la lumière (l'or sur les sommets) ; le brouillard s'éclaircit en hauteur (les
 * sommets dépassent la brume du lointain). La hauteur est celle d'un sommet de chaque triangle (`flat`, le dernier :
 * le haut d'un pan dressé), pas interpolée : chaque facette garde un seul aplat. La lanterne d'ocre du 5e (`COLORS_5E.lantern`) se dessine sans ombre, comme la
 * lampe du 6e. Quelques lignes de shader après celles de `unshadedLamp`, aucun appel de plus ; le programme a sa propre
 * clé (le 6e garde le sien, inchangé).
 */
function heightLit(m: THREE.MeshLambertMaterial, light: HeightLight, thin: readonly ThinFog[], key: string): THREE.MeshLambertMaterial {
  const before = m.onBeforeCompile;
  const lantern = new THREE.Vector3(...linearRgb(COLORS_5E.lantern));
  m.onBeforeCompile = (shader, renderer) => {
    before.call(m, shader, renderer);
    shader.uniforms.heightLow = { value: light.low };
    shader.uniforms.heightHigh = { value: light.high };
    shader.uniforms.heightSunLow = { value: light.sunLow };
    shader.uniforms.heightTintLow = { value: new THREE.Vector3(...light.tintLow) };
    shader.uniforms.heightFog = { value: new THREE.Vector3(light.fogFrom, light.fogTo, light.fogTop) };
    shader.uniforms.lanternColor = { value: lantern };
    if (import.meta.env.DEV && !shader.fragmentShader.includes('#include <lights_fragment_end>')) console.warn('heightLit : #include <lights_fragment_end> introuvable, la lumière reste à plat');
    // La lanterne et les couleurs peu voilées, reconnues par sommet comme la lampe, après elle : `m` doit sortir de
    // `unshadedLamp`, qui déclare `vUnlit` et le remet à zéro (`before`).
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nflat varying float vHeight;\nvarying float vThinFogK;\nuniform vec3 lanternColor;')
      .replace(
        '#include <project_vertex>',
        `#include <project_vertex>\nvHeight = ( modelMatrix * vec4( transformed, 1.0 ) ).y;\nvThinFogK = 1.0;\n#ifdef USE_COLOR\nif ( all( lessThan( abs( vColor.rgb - lanternColor ), vec3( 0.004 ) ) ) ) vUnlit = 1.0;\n${thinFogLines(thin)}\n#endif`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nflat varying float vHeight;\nvarying float vThinFogK;\nuniform float heightLow;\nuniform float heightHigh;\nuniform float heightSunLow;\nuniform vec3 heightTintLow;\nuniform vec3 heightFog;')
      .replace(
        '#include <lights_fragment_end>',
        '#include <lights_fragment_end>\nfloat heightLift = smoothstep( heightLow, heightHigh, vHeight );\nreflectedLight.directDiffuse *= mix( heightSunLow, 1.0, heightLift );\nreflectedLight.indirectDiffuse *= mix( heightTintLow, vec3( 1.0 ), heightLift );',
      )
      .replace('#include <opaque_fragment>', 'float thinFogK = vThinFogK;\n#include <opaque_fragment>')
      .replace(
        '#include <fog_fragment>',
        '#ifdef USE_FOG\nfloat fogFactor = smoothstep( fogNear, fogFar, vFogDepth ) * mix( 1.0, heightFog.z, smoothstep( heightFog.x, heightFog.y, vHeight ) ) * thinFogK;\ngl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );\n#endif',
      );
  };
  // La clé du programme, une par niveau (`key` : celle du 5e reste « archipeo-hauteur », le 4e a la sienne) : Three.js
  // réutilise le programme compilé de toute matière qui porte la même clé, sans relire `onBeforeCompile`, et chaque
  // niveau a sa liste `thin` et ses réglages. Les couleurs de `thin` (15 au 5e, 21 au 4e depuis la lanterne du Sémaphore du lot 5 de GD-27 : comparées par sommet depuis la mesure iPad du 24 octobre 2026) sont
  // loin de toute autre couleur du 5e (world/continu/thinFog.test.ts).
  m.customProgramCacheKey = () => key;
  return m;
}

/**
 * La trame des volumes proches (`SEE_THROUGH`), ajoutée à un matériau des lieux : ses fragments dans le cône d'un des
 * deux regards (`see.a`, `see.b` : les têtes de Kéo et de l'habitant, depuis `cameraPosition`) tombent selon un motif
 * ordonné fixe à l'écran, d'autant plus nombreux que le fragment est loin du bord du cône. `see.on` à 0 hors des
 * scénettes : rien ne change. Sa propre clé de programme (`key`), à côté de celle du matériau des lieux.
 */
function seeThrough(m: THREE.MeshLambertMaterial, see: SeeUniforms, key: string, ground = false): THREE.MeshLambertMaterial {
  const before = m.onBeforeCompile;
  m.onBeforeCompile = (shader, renderer) => {
    before.call(m, shader, renderer);
    shader.uniforms.seeOn = see.on;
    shader.uniforms.seeA = see.a;
    shader.uniforms.seeB = see.b;
    shader.uniforms.seeFloor = see.floor;
    if (import.meta.env.DEV && !shader.fragmentShader.includes('#include <clipping_planes_fragment>')) console.warn('seeThrough : #include <clipping_planes_fragment> introuvable, la trame ne se fait pas');
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vSeeWorld;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvSeeWorld = ( modelMatrix * vec4( transformed, 1.0 ) ).xyz;');
    const S = SEE_THROUGH;
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>\nvarying vec3 vSeeWorld;\nuniform float seeOn;\nuniform vec3 seeA;\nuniform vec3 seeB;\nuniform float seeFloor;\nfloat seeCone( vec3 head ) {\n\tvec3 d = head - cameraPosition;\n\tfloat len = length( d );\n\tvec3 u = d / max( len, 1e-4 );\n\tvec3 p = vSeeWorld - cameraPosition;\n\tfloat s = dot( p, u );\n\tif ( s <= 0.0 || s >= len - ${S.keep.toFixed(2)} ) return 0.0;\n\tfloat r = ${S.radius.toFixed(2)} + ( len - s ) * ${S.open.toFixed(2)};\n\treturn 1.0 - smoothstep( r * ${(1 - S.soft).toFixed(2)}, r, length( p - u * s ) );\n}\nfloat seeBayer2( vec2 a ) { a = floor( a ); return fract( a.x / 2.0 + a.y * a.y * 0.75 ); }`,
      )
      .replace(
        '#include <clipping_planes_fragment>',
        `#include <clipping_planes_fragment>\nif ( seeOn > 0.5${ground ? ` && ( abs( normalize( cross( dFdx( vSeeWorld ), dFdy( vSeeWorld ) ) ).y ) < ${S.steep.toFixed(2)} || vSeeWorld.y > seeFloor + ${S.above.toFixed(2)} )` : ''} ) {\n\tfloat seeK = max( seeCone( seeA ), seeCone( seeB ) );\n\tif ( seeK > 0.0 && seeBayer2( 0.5 * gl_FragCoord.xy ) * 0.25 + seeBayer2( gl_FragCoord.xy ) < seeK * ${S.holes.toFixed(2)} ) discard;\n}`,
      );
  };
  m.customProgramCacheKey = () => key;
  return m;
}

/** Les réglages de la trame que la boucle d'image remplit : allumée ou non, et les deux têtes regardées. */
interface SeeUniforms {
  on: { value: number };
  a: { value: THREE.Vector3 };
  b: { value: THREE.Vector3 };
  /** Le sol de la scénette : sur le terrain, seuls s'estompent ce qui se dresse (pentes raides) et ce qui passe au-dessus. */
  floor: { value: number };
}

/**
 * Le matériau de l'eau (reprise du lot 3) : l'image de l'eau porte trois champs (le cœur des bras de mer, l'eau claire,
 * le palier du milieu au large, ./world/continu/sea.ts) ; le shader les lit interpolés et tranche net sur leur ligne
 * zéro, adoucie d'un pixel d'écran (`fwidth`) : quatre paliers francs, au contour lisse qui épouse le bras, jamais une flaque pixellisée. Une ligne de
 * shader, aucun appel ni aucune image de plus.
 */
function seaMaterialOf(map: THREE.DataTexture, tones: LevelWorld['water']): THREE.MeshBasicMaterial {
  const m = new THREE.MeshBasicMaterial({ map });
  const tone = (hex: number) => new THREE.Vector3(...linearRgb(hex));
  m.onBeforeCompile = (shader) => {
    shader.uniforms.seaClear = { value: tone(tones.clear) };
    shader.uniforms.seaLagoon = { value: tone(tones.lagoon) };
    shader.uniforms.seaShelf = { value: tone(tones.shelf) };
    shader.uniforms.seaNight = { value: tone(tones.night) };
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
  const { reduceMotion, plan } = options;
  // Le plan du niveau (GD-22) : son niveau, ses lieux et ses terres qu'on relie, lus une fois.
  const { level, places: PLACES } = plan;
  const LINKED_LANDS = linkedLands(plan);
  // Ce que la vue lit du niveau (GD-22, lot 2) : son sol, ses chemins, ses tuiles, son eau, son ciel. `sixth` : le 6e,
  // seul à avoir l'Escale, la Nef, les Détours, les scénettes, les remises et les traces ; au 5e, tout cela reste caché,
  // et rien ne s'y appelle, sauf la scénette et les traces de la Montée (GD-22, lot 3, `hasScenette`), et sa faune.
  const world = levelWorld(level);
  const { sixth, net } = world;
  // Le brouillard du lointain du niveau (au 4e, repoussé : l'air net de la fin de journée).
  const FOG = world.fog;
  // Le 5e seul a sa falaise, sa brume des failles, ses Détours et sa faune par terre ; le 4e (lot 1) n'a encore rien de
  // tout cela, et sur la Carte, les hachures de son sommet.
  const fifth = level === '5e';
  const followFar = FOLLOW_FAR_OF[level];
  // Le lieu de départ du niveau et sa Nef (GD-20, lot 2 ; GD-21 ; GD-22, lot 4) : l'Escale et le voilier au 6e, la
  // Lisière et le dirigeable au 5e.
  const departure = world.departure;
  const site = departure.port;
  // En portrait, l'obstacle de la Nef et son départ pour un écran plus haut que large, s'il en a (au 4e, les îles du ciel
  // resserrées : Règle commune du port en portrait), pris quand l'écran tourne (`fitNefSite`).
  const nefWide = departure.nef;
  const nefTall = nefWide.portrait ? { ...nefWide, ...nefWide.portrait } : nefWide;
  let nefSite = host.clientHeight > host.clientWidth ? nefTall : nefWide;
  const siteRooflines = portRooflines(site);
  const { atNode, findRoute, pathNode, snapToNetwork, startOf } = net;
  const LIGHT = world.light;
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(host.clientWidth, host.clientHeight, false);
  host.appendChild(renderer.domElement);
  Object.assign(renderer.domElement.style, { width: '100%', height: '100%', touchAction: 'none', display: 'block' });
  const meter = createMeter(host, 'archipeo', options.meter.show, options.meter.expose);

  const scene = new THREE.Scene();
  // La brume légère d'Archipéo : le lointain, le large et l'horizon s'y fondent, de la couleur de l'horizon du ciel (GD-20,
  // point 3, lot 3 : la mer rejoint le ciel sans couture).
  const horizon = new THREE.Color(world.horizon);
  scene.background = horizon;
  const fog = new THREE.Fog(horizon, FOG.near, FOG.far);
  scene.fog = fog;
  const camera = new THREE.PerspectiveCamera(40, host.clientWidth / Math.max(1, host.clientHeight), 0.5, followFar);
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
  // seule), dessiné d'abord, sans brouillard ni profondeur : tout le reste passe devant. Un appel. Sans brouillard, parce
  // qu'il est lui-même le lointain : son bas a la couleur du brouillard, qui le voilerait d'une teinte unie.
  const skyGeometry = new THREE.BufferGeometry();
  {
    const dome = skyDome(SKY_RADIUS, world.sky);
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
  const field = world.field();
  // Le sol dessiné, ou, au 6e, la pierre de l'Escale (son quai, sa place) là où Kéo y marche.
  const ground = world.ground(field);
  // L'angle des ailes de la pompe à vent des Marais salants, avancé par la boucle d'image (partagé par les deux matériaux).
  const vaneAngle = { value: 0 };
  // L'angle du rotor de la Turbine, avancé de même, sauf pendant une question.
  const rotorAngle = { value: 0 };
  const landMaterial = unshadedLamp(new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }), vaneAngle, rotorAngle);
  // Au 5e, la lumière par la hauteur (ses deux étages) ; le 6e garde son matériau tel quel.
  if (world.heightLight) heightLit(landMaterial, world.heightLight, world.thinFog, fifth ? 'archipeo-hauteur' : `archipeo-hauteur-${level}`);
  // Le lieu, sa maquette et le décor de près : le même matériau, qui s'estompe entre la caméra et la scénette (`SEE_THROUGH`).
  const see: SeeUniforms = { on: { value: 0 }, a: { value: new THREE.Vector3() }, b: { value: new THREE.Vector3() }, floor: { value: 0 } };
  const volumeMaterial = unshadedLamp(new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }), vaneAngle, rotorAngle);
  if (world.heightLight) heightLit(volumeMaterial, world.heightLight, world.thinFog, fifth ? 'archipeo-hauteur' : `archipeo-hauteur-${level}`);
  seeThrough(volumeMaterial, see, `archipeo-trame-${level}`);
  // Le terrain (les tuiles, leurs arbres et leurs rochers) : la même trame, sans jamais trouer le sol.
  const groundMaterial = unshadedLamp(new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }), vaneAngle, rotorAngle);
  if (world.heightLight) heightLit(groundMaterial, world.heightLight, world.thinFog, fifth ? 'archipeo-hauteur' : `archipeo-hauteur-${level}`);
  seeThrough(groundMaterial, see, `archipeo-trame-sol-${level}`, true);
  const tiles = createTileStore(field, undefined, world.tiles);
  const nearRing = new RingMesh(groundMaterial, 9000);
  const farRing = new RingMesh(groundMaterial, 6000);
  scene.add(nearRing.mesh, farRing.mesh);
  const touchables: THREE.Object3D[] = [nearRing.mesh, farRing.mesh];

  // La mer et le lagon : un plan d'eau à 0, peint par l'image de l'eau ; au-delà, le bord de l'image (le large).
  const seaSquare = world.seaTexture ?? SEA_TEXTURE;
  const seaTexture = new THREE.DataTexture(world.seaPixels(), seaSquare.size, seaSquare.size);
  // Des champs, pas des couleurs : lus tels quels, interpolés.
  seaTexture.colorSpace = THREE.NoColorSpace;
  seaTexture.magFilter = THREE.LinearFilter;
  seaTexture.minFilter = THREE.LinearFilter;
  seaTexture.needsUpdate = true;
  // Assez grand pour la Carte la plus reculée (au téléphone en portrait, au plus grand texte, son haut voyait le ciel au-delà
  // d'un plan de 2 000 : retouche 2 des restes du monde ouvert du 4e) ; le suivi n'en voit jamais le bord (`followFar`).
  const seaSize = 8000;
  const seaGeometry = keep(new THREE.PlaneGeometry(seaSize, seaSize).rotateX(-Math.PI / 2));
  // Les coordonnées de l'image suivent x et z du monde : le carré de l'image au milieu, son bord étiré au-delà.
  const uv = seaGeometry.getAttribute('uv') as THREE.BufferAttribute;
  const pos = seaGeometry.getAttribute('position') as THREE.BufferAttribute;
  for (let k = 0; k < uv.count; k++) uv.setXY(k, (pos.getX(k) + seaSquare.half) / (2 * seaSquare.half), (pos.getZ(k) + seaSquare.half) / (2 * seaSquare.half));
  uv.needsUpdate = true;
  const seaMaterial = seaMaterialOf(seaTexture, world.water);
  const sea = still(new THREE.Mesh(seaGeometry, seaMaterial));
  scene.add(sea);
  touchables.push(sea);

  // Les chemins : sentiers, digue et pontons, un seul maillage, jusqu'aux culées des ponts (GD-20, point 3, « vraies
  // terres » : les ponts sont dans le maillage des lieux).
  const paths = still(new THREE.Mesh(keep(geometryOf(world.pathFacets(ground))), landMaterial));
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
  // Le 5e n'en a pas : ses lieux hauts (le Donjon, le Sémaphore) lèvent le regard à leur porte (`arrivals`, plus bas).
  const TALL: readonly PlaceId[] = sixth ? ['phare', 'lookout'] : [];
  const tallTops = new Map<PlaceId, Vec3>(TALL.map((id) => [id, { x: placeById(id).center.x, y: feet.get(id)!.y + modelOfPlace(id).top, z: placeById(id).center.z }]));
  // Au 5e, hors de la porte d'un lieu haut, le regard ne se lève qu'au quai de la Lisière, tourné vers la Montée, pour
  // que son sommet entre dans la première image (GD-22, lot 4, `quayLook`) ; ailleurs, `look` reste à 0 et `lookUp` ne
  // bouge pas la caméra (`lanternTop` reste à l'origine tant qu'il n'est pas cadré).
  const lanternTop: Vec3 = { ...(tallTops.get('phare') ?? { x: 0, y: 0, z: 0 }) };
  // Le haut que le regard levé cadre au quai du lieu de départ (au 5e, le sommet de la Montée : la première image de la
  // Lisière la montre au fond ; GD-22, lot 4), et l'endroit du quai.
  const quayLook: Vec3 | null = departure.lookTop ? { ...departure.lookTop } : departure.lookAt ? { x: placeById(departure.lookAt).center.x, y: (feet.get(departure.lookAt)?.y ?? 0) + modelOfPlace(departure.lookAt).top, z: placeById(departure.lookAt).center.z } : null;
  const quayPoint = net.pathNode(portNode('quai')).at;
  // Les lieux trop hauts pour la caméra qui suit à leur porte (`PlaceArt.arrivalView` ; au 5e, le Donjon, retouche 1 du
  // lot 13a ; l'Oracle, lot 13b, dont le regard monte à la tour du Donjon ; le Sémaphore, lot 14) : leur porte, le bord du
  // haut que le regard levé y cadre (à la hauteur de ce qui est bâti, `builtTop`) et le recul de la caméra. `arrivalNow` :
  // celui où Kéo se tient, tourné vers son cap ; `arrivalBack`, la part du recul, de 0 à 1, comme `look` ; `arrivalShape`,
  // le recul du dernier, gardé pendant que la caméra revient.
  const arrivals = PLACES.flatMap((p) => {
    const a = arrivalViewOf(p.id);
    return a ? [{ id: p.id, door: net.pathNode(p.door).at, look: { x: p.center.x + a.look.x, z: p.center.z + a.look.z }, top: a.top, view: { height: 0, back: a.back }, maxBack: a.maxBack ?? a.back }] : [];
  });
  let arrivalNow: (typeof arrivals)[number] | null = null;
  // Au quai du lieu de départ, tourné vers son cap, quand le niveau a une vue d'arrivée (`Departure.quayView`, au 3e) : la
  // caméra recule et monte de cette vue, comme à la porte d'un lieu haut.
  let quayArrival = false;
  let arrivalBack = 0;
  let arrivalShape: DetourView = COMMON_DETOUR_VIEW;
  /** La hauteur bâtie de chaque lieu, au-dessus de son pied (le lieu entier tant que la page n'a rien dit). */
  const builtTop = new Map<PlaceId, number>();
  const whole = (id: PlaceId) => (builtTop.get(id) ?? modelOfPlace(id).top) >= modelOfPlace(id).top - 0.5;
  /** Reporte la hauteur bâtie d'un lieu sur sa marque (et, au Phare et à la Vigie, sur le haut que le regard levé cadre). */
  const setBuiltTop = (id: PlaceId, top: number) => {
    if (builtTop.get(id) === top) return;
    builtTop.set(id, top);
    const foot = feet.get(id)!;
    const o = markPoint(id, top, whole(id));
    marks.get(id)!.set(foot.x + o.x, foot.y + o.y, foot.z + o.z);
    const tallTop = tallTops.get(id);
    if (tallTop) tallTop.y = foot.y + top;
  };
  const placesMesh = still(new THREE.Mesh(new THREE.BufferGeometry(), volumeMaterial));
  placesMesh.name = 'lieux';
  // Le premier triangle de ce que les lieux posent hors de leur emprise (`PlaceArt.reach`, aux Nacelles les deux câbles),
  // rangé en dernier dans le maillage des lieux : un toucher qui le rencontre passe au travers (il ne répond pas).
  let reachFrom = Infinity;
  // Ce qu'un rayon (le toucher, la caméra de scénette) prend pour un volume : tout, sauf ce qui est posé hors de l'emprise.
  const solid = (h: THREE.Intersection): boolean => !(h.object === placesMesh && (h.faceIndex ?? 0) >= reachFrom);
  // Le lieu suivi, à part, du même matériau, pris dans la brume comme le reste : sorti d'elle, il se détachait net du
  // lointain voilé (retour du mainteneur, 19 octobre 2026) ; de loin, c'est la marque qui le montre.
  const landmarkMesh = still(new THREE.Mesh(new THREE.BufferGeometry(), volumeMaterial));
  // Au 6e, sans brouillard : la partie qui descend, tout près, se détache plus claire. Au 5e, dans le brouillard comme
  // tout son décor (GD-22, lot 2) : son éclat (`emissive`) suffit à la détacher.
  const poseMaterial = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, fog: !sixth, emissive: POSE_GLOW });
  const poseMesh = new THREE.Mesh(new THREE.BufferGeometry(), poseMaterial);
  // Son nom : les tests de la scène le retrouvent (la pose, la lueur et la caisse qui roule y passent tour à tour).
  poseMesh.name = 'pose';
  // La lumière de la lanterne du Phare, allumée (son haut posé) : réunie aux lieux, de la couleur
  // de la lampe, que leurs matériaux dessinent sans ombre (`unshadedLamp`) ; aucun appel de plus.
  const lampFacets = placeFacets(lanternLight(), feet.get('phare') ?? new THREE.Vector3());
  let lampShown = false;
  placesMesh.visible = false;
  landmarkMesh.visible = false;
  poseMesh.visible = false;
  // La Nef qui arrive ou qui part, et le banc qui se retire (GD-21) : du matériau des lieux.
  const nefMesh = new THREE.Mesh(new THREE.BufferGeometry(), landMaterial);
  const bancMesh = new THREE.Mesh(new THREE.BufferGeometry(), landMaterial);
  nefMesh.visible = false;
  bancMesh.visible = false;
  scene.add(placesMesh, landmarkMesh, poseMesh, nefMesh, bancMesh);
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
  // La brume des failles du 5e (GD-22, lot 2 ; ./world/continu/mist5e.ts) : des nappes basses et immobiles au creux des
  // failles, du matériau de la brume (prise dans le brouillard), faites une fois ; cachées sur la Carte, qui montre la
  // ligne de la falaise à leur place. Un appel ; aucun au 6e.
  const riftMesh = still(new THREE.Mesh(new THREE.BufferGeometry(), veilMaterial));
  riftMesh.renderOrder = 1;
  riftMesh.visible = false;
  if (fifth) {
    setVeilGeometry(riftMesh, riftMistFacets());
    scene.add(riftMesh);
  }
  // Les terres (GD-20, point 3, « vraies terres, vrais ponts ») : les terres fermées, et ce qui en est montré (la brume,
  // les cadenas, les ponts tombés ou rebâtis).
  let closed: readonly LinkedLand[] = [];
  let veilKey = '';
  // La pose d'un pont (GD-20, point 3, « La pose ») : ce qui se relève (`lay`, ses sommets à part dans le maillage de
  // pose), son début, ce que la page attend ; le toc dit. `pendingLay` : annoncée, en attente des terres.
  let laying: { lay: BridgeLay; start: number; events: BridgeLayEvents; tapped: boolean; drawn: number; fade: number } | null = null;
  let pendingLay: { land: LinkedLand; events: BridgeLayEvents } | null = null;
  const layState: BridgeLayState = { landed: false, fade: 0, done: false };
  // Les terres où Kéo ne passe pas : les fermées, et celle dont le pont se pose (il ne passe qu'à la fin).
  let walkClosed: readonly LinkedLand[] = [];
  // La cabine de la Montée (GD-22, lot 3 ; au 6e, aucune) : où attend sa caisse (au pied, en haut, ou nulle part pendant un
  // trajet : elle roule alors dans le maillage de la pose), dans quel sens roule le trajet en cours, ce que sait la page.
  const cabinLand = cabinOf(plan);
  const cabinSite = cabinLand ? bridgeSite(cabinLand) : null;
  let carAt: CabinCar = 'bas';
  // La caisse de la gare du haut ouverte, sans poteaux ni toit (`cabinCarOpen`) : la caméra au bord ne passe jamais dessous.
  let carOpen = false;
  // La galerie du col du 3e reliée, sans son toit quand Kéo est dessous (`colRoofOpen`) : la caméra qui le suit, plus
  // haute que le faîte, ne voit jamais le toit entre elle et lui (les lieux ne se refont qu'au changement).
  const colLand = colGalleryOf(plan);
  let colOpen = false;
  let rideUp: boolean | null = null;
  let carRolling = false;
  let cabinTold = '';
  // Le voile de la brume (« Réduire les animations » : le fondu de la cabine, jamais par le noir), au-dessus de l'image :
  // sa couleur et sa place dans openWorld.css (`.open-world-veil`), seule son opacité ici.
  const veilEl = document.createElement('div');
  veilEl.className = 'open-world-veil';
  veilEl.style.opacity = '0';
  veilEl.setAttribute('aria-hidden', 'true');
  if (cabinLand) host.appendChild(veilEl);
  let veilShown = 0;
  // Le pont devant lequel la caméra reste cadrée après sa pose, Kéo toujours sur sa culée : elle ne bouge pas tant
  // qu'il ne repart pas.
  let heldBridge: LinkedLand | null = null;
  // La transparence de la brume qui se lève, à ses sommets (refaite avec la brume, jamais par image).
  let veilAlphas: Float32Array | null = null;
  let veilFadeFrom = 0;

  // Kéo : le corps du bonhomme d'Archipéo (sa marche existante), son anneau clair au sol ; habillé dès que sa tenue est chargée.
  const keo = new THREE.Group();
  scene.add(keo);
  let body: CorpsDuBonhomme = corpsDuBonhomme(level);
  keo.add(body.mesh);
  body.mesh.layers.set(KEO_LAYER);
  let disposed = false;
  if (!loadedKeo(level))
    void loadKeo(level).then(() => {
      if (disposed || !loadedKeo(level)) return;
      body.dispose();
      body = corpsDuBonhomme(level);
      keo.add(body.mesh);
      body.mesh.layers.set(KEO_LAYER);
      mapDirty = true;
    });
  keo.scale.setScalar(KEO_SCALE);
  // L'habitant de la scénette en modèle 3D (./habitantModels.ts) : un maillage texturé à part, un appel ; sa texture
  // envoyée à la carte graphique dès qu'elle est décodée (à l'approche du lieu), jamais au premier dessin de la scénette.
  // Fait ici, avant tout ce qui l'appelle (`setFrame`, l'entrée et la sortie d'une scénette, `dispose`).
  // Un modèle prêt après l'entrée de la remise de son lieu (« Livrer » touché aussitôt arrivé) prend la place du pion : rien
  // de la remise ne dépend du pion ; dans une mission, ce qui pend de la main de l'habitant s'y règle, le pion reste.
  // Les textures de l'habitant et de l'équipier, préparées pendant la marche, attendent que Kéo s'arrête pour partir à la
  // carte graphique (`UPLOAD_STILL_MS`, la caméra posée) : envoyée aussitôt, une texture faisait l'image la plus longue de
  // la marche, aux quatre niveaux (mesure iPad du 24 octobre 2026). Elles partent en bandes, une par image
  // (./textureUploads.ts) : envoyée d'un bloc, elle faisait encore une image de 124 à 298 ms à l'arrêt (remesure du même
  // jour). Une texture qu'on va dessiner avant la fin est finie d'un coup (`finishShown`, au dessin de son maillage) ;
  // une texture libérée en attente quitte la file.
  const uploads = createTextureUploads(renderer);
  const prepareLater = (t: THREE.Texture) => uploads.add(t);
  const finishShown = (_r: unknown, _s: unknown, _c: unknown, _g: unknown, material: THREE.Material) => {
    const map = (material as THREE.MeshLambertMaterial).map;
    if (map) uploads.finish(map);
  };
  const habitants = createHabitantModels(
    scene,
    prepareLater,
    (place) => {
      if (scenette !== place || remise?.place !== place || asked) return;
      habitants.show(place, scenetteHabitant(place, posed));
      setGeometry(decorMesh, scenetteDecor(place, false, posed, topped));
    },
  );
  // Les habitants près de leur porte, hors de leur scénette (choix du mainteneur, 23 octobre 2026 : en modèle 3D, aux
  // quatre niveaux ; ./worldHabitantModels.ts) : leurs versions de loin, un maillage texturé à part, un appel.
  const worldHabitants = createWorldHabitantModels(scene, PLACES.map((p) => p.id), ground, (t) => renderer.initTexture(t));
  // Le geste du métier (GD-27, lot 5, piste A « l'outil qui travaille » ; ../../world/continu/gestes.ts) : les outils des
  // habitants montrés, dans un maillage à part (un appel), montré et caché avec eux ; la pièce mobile d'un seul, celui
  // du lieu rallumé le plus proche de Kéo arrêté, tournée sommet par sommet quand le monde est calme.
  const gestesMesh = new THREE.Mesh(new THREE.BufferGeometry(), landMaterial);
  gestesMesh.visible = false;
  gestesMesh.name = 'gestes';
  scene.add(still(gestesMesh));
  let gestesKey = '';
  let gestesRest: Float32Array | null = null;
  let gestesMobiles: readonly MobilePiece[] = [];
  /** Les lieux rallumés dont l'habitant est montré, à la place de ses pieds : ceux dont l'outil peut bouger. */
  let gesteCandidatesShown: readonly GesteCandidate[] = [];
  let gesteActive: ScenePlaceId | null = null;
  /** La pièce mobile de `gesteActive`, retenue au changement ; `gesteStart`, l'instant `t` (en secondes) de son départ. */
  let gesteMobile: MobilePiece | null = null;
  let gesteStart = 0;
  let gesteHeld = false;
  /** La place de Kéo au dernier choix de l'habitant : le choix ne se refait que si elle a changé. */
  const gesteHere = { x: NaN, z: NaN };
  /** Le dernier instant `now` (en millisecondes, `performance.now()`) où Kéo bougeait (en marchant, dans la cabine) : le
   * geste attend `GESTE_SETTLE` secondes après. */
  let keoMovedAt = 0;
  const showGestes = (places: readonly PlaceId[]) => {
    // Dans la ruine, ni outil ni support (directeur artistique) : l'outil paraît avec la première partie posée.
    const withTool = (p: PlaceId) => posedOf(p).length > 0;
    const k = places.map((p) => `${p}${withTool(p) ? '+' : ''}`).join(',');
    if (k === gestesKey) return;
    gestesKey = k;
    gesteActive = null;
    gesteMobile = null;
    gesteHere.x = NaN;
    const g = worldGestes(places, ground, withTool);
    gestesRest = g.facets.positions.slice();
    gestesMobiles = g.mobiles;
    setGeometry(gestesMesh, g.facets);
    // Les sommets de la pièce mobile sont réécrits à chaque image.
    (gestesMesh.geometry.getAttribute('position') as THREE.BufferAttribute).setUsage(THREE.DynamicDrawUsage);
  };
  /** Remet la pièce mobile de l'habitant `place`, et son corps, au repos. */
  const restGeste = (place: ScenePlaceId) => {
    worldHabitants.work(place, 0);
    const m = gestesMobiles.find((x) => x.place === place);
    if (!m || !gestesRest) return;
    const attr = gestesMesh.geometry.getAttribute('position') as THREE.BufferAttribute;
    moveMobile(gestesRest, attr.array as Float32Array, m, 0);
    attr.addUpdateRange(m.start * 3, m.count * 3);
    attr.needsUpdate = true;
  };
  /**
   * Le geste de l'image : `calm`, rien d'autre ne se joue (ni question, ni scénette, ni Carte, ni script, ni voile, ni
   * ligne retenue, ni « Réduire les animations ») et Kéo est arrêté depuis `GESTE_SETTLE` ; sinon, l'outil actif revient
   * au repos. Le choix de l'habitant ne dépend que de Kéo, jamais de la caméra.
   */
  const stepGestes = (t: number, now: number, calm: boolean) => {
    let next: ScenePlaceId | null = null;
    if (calm && gestesMobiles.length && now - keoMovedAt >= GESTE_SETTLE * 1000) {
      // Kéo arrêté au même endroit : le choix d'avant tient, sans refaire les distances.
      if (here.x === gesteHere.x && here.z === gesteHere.z) next = gesteActive;
      else {
        next = activeGeste(here, gesteCandidatesShown, gesteActive);
        gesteHere.x = here.x;
        gesteHere.z = here.z;
      }
    } else gesteHere.x = NaN; // Le calme revenu refait le choix, même sans que Kéo ait bougé.
    if (next !== gesteActive) {
      if (gesteActive) restGeste(gesteActive);
      gesteActive = next;
      gesteMobile = next ? (gestesMobiles.find((x) => x.place === next) ?? null) : null;
      gesteStart = t;
    }
    if (!gesteMobile || !gestesRest) return;
    const phase = gestePhase(t - gesteStart);
    // Le corps qui travaille (piste B) : le buste et le bras droit de l'habitant actif, au même rythme que son outil.
    worldHabitants.work(gesteMobile.place, phase);
    const attr = gestesMesh.geometry.getAttribute('position') as THREE.BufferAttribute;
    moveMobile(gestesRest, attr.array as Float32Array, gesteMobile, phase);
    attr.addUpdateRange(gesteMobile.start * 3, gesteMobile.count * 3);
    attr.needsUpdate = true;
  };
  /** Les habitants montrés près de leur porte à la dernière pose des lieux : ceux qu'un toucher peut atteindre. */
  let habitantsOnShow: readonly PlaceId[] = [];
  /** La hauteur de l'habitant d'un lieu telle qu'il se tient : assis dans la ruine (le corps qui travaille), debout sinon. */
  const habitantHeightNow = (place: ScenePlaceId): number => (posedOf(place).length === 0 ? seatedHeight(worldHabitantHeight(place)) : worldHabitantHeight(place));
  // L'équipier qui guide le lieu (GD-23, lot 1, ./equipierModels.ts) : préparé avec l'habitant, montré dans la scénette.
  const equipiers = createEquipierModels(scene, prepareLater);
  habitants.mesh.onBeforeRender = finishShown;
  equipiers.mesh.onBeforeRender = finishShown;
  const prefetchGuide = (place: PlaceId) => {
    const g = guideOf(place);
    if (g) equipiers.prefetch(g);
  };
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
  const ringSurface = (x: number, z: number) => Math.max(standingHeight(ground(x, z)), pathTopAt(x, z, ground, ringEdges, world.ribbons));
  ringGeometry.computeBoundingSphere();
  // `computeBoundingSphere` vient de la calculer : elle n'est pas nulle.
  ringGeometry.boundingSphere!.radius += 2;
  const ringMaterial = new THREE.MeshBasicMaterial({ color: KEO_RING.color, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
  const ring = new THREE.Mesh(ringGeometry, ringMaterial);
  scene.add(ring);
  // L'ombre peinte de Kéo (GD-20, point 3, lot 3) : un disque sombre et transparent dans le creux de l'anneau, décalé du
  // côté opposé au soleil, qui épouse le sol comme lui ; il le suit (enfant de l'anneau), caché avec lui. Un appel.
  const shadowGeometry = keep(new THREE.CircleGeometry(KEO_SHADOW.radius, KEO_SHADOW.sides).rotateX(-Math.PI / 2).translate(world.shadowDir.x * KEO_SHADOW.shift, 0, world.shadowDir.z * KEO_SHADOW.shift));
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
  const markSurface = (x: number, z: number) => Math.max(standingHeight(ground(x, z)), pathTopAt(x, z, ground, markEdges, world.ribbons));
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
    edgesNear(markAt.x, markAt.z, FREE_MARK.outer * sc, markEdges, world.ribbons);
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
  // La silhouette de Kéo : son corps dessiné une deuxième fois, là seulement où le décor passe devant lui. Sans
  // brouillard : elle montre où est Kéo derrière le décor, et doit se lire même au loin (ce n'est pas un décor).
  const silhouetteMaterial = new THREE.MeshBasicMaterial({ color: KEO_SILHOUETTE.color, transparent: true, opacity: KEO_SILHOUETTE.opacity, depthWrite: false, depthFunc: THREE.GreaterDepth, fog: false });

  // Où est Kéo, où il va.
  // Au départ, sur le chemin, à quelques pas du lieu (on voit le Phare de plus loin que sa porte) ; à l'Escale, à son
  // endroit (le quai, face à la caméra ; devant une porte, tourné vers elle).
  const startPlace = PLACES.find((p) => p.id === options.start);
  const startSpot = startPlace ? null : (options.start as PortSpot);
  // Hors d'un lieu, à son endroit du lieu de départ du niveau (l'Escale, la Lisière).
  let here: Vec2 = startPlace ? startOf(startPlace.door, startPlace.center).at : pathNode(portNode(startSpot!)).at;
  let walk: Walk | null = null;
  let walkTarget: PlaceId | null = null;
  // Les Détours (GD-20, déplacement libre, lot 2) : ceux trouvés (leur sente tracée), les cairns rallumés, celui où Kéo
  // s'est arrêté (dit à la page), depuis quand il s'y tient immobile, et l'avancée de la vue qui monte.
  let detoursFound: readonly DetourId[] = [];
  let detoursLit: readonly DetourId[] = [];
  let detourHere: DetourId | null = null;
  let detourStill = 0;
  let detourView = 0;
  // La forme de la vue du dernier Détour atteint (la Faille a la sienne), gardée pendant que la vue redescend.
  let detourShape: DetourView = COMMON_DETOUR_VIEW;
  // La vue d'arrivée d'un « Y aller » devant un lieu qui a la sienne (`doorFrameOf`, le Gaillard) : sa forme, la porte où
  // Kéo se tient, le cap d'arrivée, et son avancée (1 à l'arrivée, d'un coup ; elle retombe en douceur quand il repart).
  // Une vue plus basse que la caméra qui suit (la Forge du 4e, retouche 1 du lot 2 : le volcan dans le cadre) retombe
  // aussi dès que la caméra tourne : basse et reculée, elle passerait derrière le fourneau ou sous le toit de
  // l'appentis ; la caméra qui suit, elle, n'a rien de haut entre elle et Kéo.
  let doorArrival: { shape: DetourView; at: Vec2; yaw: number } | null = null;
  let doorArrivalView = 0;
  let detourDecor: { key: string; facets: Facets } | null = null;
  const detourFacetsNow = (): Facets => {
    const key = `${detoursFound.join(',')}|${detoursLit.join(',')}`;
    // Au 5e, la Hutte (GD-22, lot 8) : sa cabane, et sa sente une fois trouvée.
    if (detourDecor?.key !== key) detourDecor = { key, facets: sixth ? detourFacets(detoursFound, detoursLit.includes('braise-herons')) : hutteFacets(detoursFound.includes('hutte'), ground) };
    return detourDecor.facets;
  };
  // Le Creux du 5e (GD-22, lot 6) : ses deux formes, sans et avec sa sente, faites une fois.
  const creuxDrawn: { found: boolean; facets: Facets }[] = [];
  const creuxNow = (): Facets => {
    const found = detoursFound.includes('creux');
    let c = creuxDrawn.find((k) => k.found === found);
    if (!c) creuxDrawn.push((c = { found, facets: creuxFacets(found) }));
    return c.facets;
  };
  // La Faille du 5e (GD-22, lot 11) : de même, sans et avec sa sente.
  const failleDrawn: { found: boolean; facets: Facets }[] = [];
  const failleNow = (): Facets => {
    const found = detoursFound.includes('faille');
    let c = failleDrawn.find((k) => k.found === found);
    if (!c) failleDrawn.push((c = { found, facets: failleFacets(found) }));
    return c.facets;
  };
  // Le Perchoir du 5e (GD-22, lot 16) : de même, sans et avec sa sente.
  const perchoirDrawn: { found: boolean; facets: Facets }[] = [];
  const perchoirNow = (): Facets => {
    const found = detoursFound.includes('perchoir');
    let c = perchoirDrawn.find((k) => k.found === found);
    if (!c) perchoirDrawn.push((c = { found, facets: perchoirFacets(found) }));
    return c.facets;
  };
  // L'Épave du 4e (lot 2) : de même, sans et avec sa sente, sur le sol du 4e.
  const epaveDrawn: { found: boolean; facets: Facets }[] = [];
  const epaveNow = (): Facets => {
    const found = detoursFound.includes('epave');
    let c = epaveDrawn.find((k) => k.found === found);
    if (!c) epaveDrawn.push((c = { found, facets: epaveFacets(found, ground) }));
    return c.facets;
  };
  // Le Recoin du 4e (lot 3) : de même.
  const recoinDrawn: { found: boolean; facets: Facets }[] = [];
  const recoinNow = (): Facets => {
    const found = detoursFound.includes('recoin');
    let c = recoinDrawn.find((k) => k.found === found);
    if (!c) recoinDrawn.push((c = { found, facets: recoinFacets(found, ground) }));
    return c.facets;
  };
  // La Dalle du 4e (lot 3, l'Épaule) : de même, sans et avec sa sente.
  const dalleDrawn: { found: boolean; facets: Facets }[] = [];
  const dalleNow = (): Facets => {
    const found = detoursFound.includes('dalle');
    let c = dalleDrawn.find((k) => k.found === found);
    if (!c) dalleDrawn.push((c = { found, facets: dalleFacets(found, ground) }));
    return c.facets;
  };
  // Le Replat du 4e (les Coteaux) : de même, sans et avec sa sente.
  const replatDrawn: { found: boolean; facets: Facets }[] = [];
  const replatNow = (): Facets => {
    const found = detoursFound.includes('replat');
    let c = replatDrawn.find((k) => k.found === found);
    if (!c) replatDrawn.push((c = { found, facets: replatFacets(found, ground) }));
    return c.facets;
  };
  // Le Cadran du 3e (le Versant) : de même, sans et avec sa sente, sur le sol du 3e.
  const cadranDrawn: { found: boolean; facets: Facets }[] = [];
  const cadranNow = (): Facets => {
    const found = detoursFound.includes('cadran');
    let c = cadranDrawn.find((k) => k.found === found);
    if (!c) cadranDrawn.push((c = { found, facets: cadranFacets(found, ground) }));
    return c.facets;
  };
  // La Bergerie du 3e (les Alpages) : de même.
  const bergerieDrawn: { found: boolean; facets: Facets }[] = [];
  const bergerieNow = (): Facets => {
    const found = detoursFound.includes('bergerie');
    let c = bergerieDrawn.find((k) => k.found === found);
    if (!c) bergerieDrawn.push((c = { found, facets: bergerieFacets(found, ground) }));
    return c.facets;
  };
  // Le Cèdre du 3e (les Prairies) : de même.
  const cedreDrawn: { found: boolean; facets: Facets }[] = [];
  const cedreNow = (): Facets => {
    const found = detoursFound.includes('cedre');
    let c = cedreDrawn.find((k) => k.found === found);
    if (!c) cedreDrawn.push((c = { found, facets: cedreFacets(found, ground) }));
    return c.facets;
  };
  // Le Lac du 3e (le Cirque) : de même.
  const lacDrawn: { found: boolean; facets: Facets }[] = [];
  const lacNow = (): Facets => {
    const found = detoursFound.includes('lac');
    let c = lacDrawn.find((k) => k.found === found);
    if (!c) lacDrawn.push((c = { found, facets: lacFacets(found, ground) }));
    return c.facets;
  };
  // La Nef du lieu de départ (GD-21 ; GD-22, lot 4) : son temps (la page le donne), le modèle de sa forme chargé à la
  // demande (sans lui, le ber seul), ses parties montrées réunies aux lieux, son obstacle (le banc du large, le mur de
  // nuages) avec eux. Le temps qui arrive descend à part (`nefDrop`, dans `nefMesh`) ; au départ (`nefTrip`), la Nef et
  // l'obstacle s'en vont chacun dans son maillage, le temps de leur mouvement (jamais pendant une question ni une pose).
  // Le premier temps dit par la page se montre tel quel, sans descente : rien ne bouge à l'ouverture (directeur
  // artistique, lot 4).
  let nefLookNow: NefLook = 0;
  let nefKnown = false;
  const flight: NefFlight = { x: 0, y: 0, z: 0, yaw: 0, shiftX: 0, shiftZ: 0, open: 0 };
  let nefDrop: { start: number; from: NefLook; to: NefLook } | null = null;
  let nefTrip: { start: number; done: () => void; outSince: number | null; farSince: number | null } | null = null;
  /** Au 5e, le sens de glissement de chaque sommet du mur, pour ouvrir la brèche sans rien refaire (aucun au 6e). */
  const nefSides = nefSite.obstacleSides?.() ?? null;
  /** La Nef qui part, ramenée à l'écran (sa place projetée). */
  const nefSeen = new THREE.Vector3();
  const nefModelCache = new Map<string, Facets>();
  /** Des parties de la forme de la Nef, dans son repère, ou rien (pas encore chargée, ou aucune partie). */
  const nefModel = (names: readonly string[]): Facets | null => {
    const parts = nefParts(nefSite.form);
    if (!parts || names.length === 0) return null;
    const k = names.join(',');
    let f = nefModelCache.get(k);
    if (!f) nefModelCache.set(k, (f = nefModelFacets(parts, names, nefSite.model)));
    return f;
  };
  /** Le ber à chaque temps (au 5e, le gréement déposé change avec lui), fait une fois. */
  const nefBers = new Map<NefLook, Facets>();
  const nefBer = (look: NefLook): Facets => {
    let f = nefBers.get(look);
    if (!f) nefBers.set(look, (f = nefSite.ber(look)));
    return f;
  };
  let nefBanc = nefSite.obstacle();
  const nefStays = nefSite.stays();
  let nefAfter = nefSite.after();
  /** L'obstacle de la Nef de l'écran (portrait ou paysage), jamais pendant son départ : les lieux se refont avec lui. */
  const fitNefSite = () => {
    const now = viewH > viewW ? nefTall : nefWide;
    if (now === nefSite || nefTrip) return;
    nefSite = now;
    nefBanc = now.obstacle();
    nefAfter = now.after();
    placesKey = '';
    placeVisibility();
  };
  const siteDecor = departure.decor(options.piecesReturned);
  // Le décor hors de la Carte (au 3e, le zeppelin), dans le même maillage.
  const offMapDecor = departure.offMap?.() ?? null;
  /** Le temps que les parties nouvelles de la Nef mettent à descendre sur le ber. */
  const NEF_DROP_SECONDS = 0.8;
  // Les parures de l'aéronef au repos (au 3e, GD-25) : celles qui sont posées, réunies aux lieux (aucun appel de plus) ;
  // celle qui arrive descend à part, dans `nefMesh`, libre au 3e (la Nef n'y part pas). Le premier nombre dit par la page
  // se montre tel quel.
  let paruresNow = 0;
  let paruresKnown = false;
  let paruresDrop: { start: number; from: number } | null = null;
  const paruresCache = new Map<number, Facets>();
  /** Les parures de `from` (compris) à `to` (exclu), dans le repère de la Nef, ou rien. */
  const paruresOf = (from: number, to: number): Facets | null => {
    if (!departure.parures || to <= from) return null;
    const k = from * 4 + to;
    let f = paruresCache.get(k);
    if (!f) paruresCache.set(k, (f = departure.parures(NEF_PARURES.slice(from, to))));
    return f;
  };
  // La baleine et les oiseaux du bord d'eau : un seul maillage, dont les sommets sont réécrits sur place pendant leur
  // scène ; montré seulement près du bord d'eau. Leur horloge n'avance que hors des questions et de la Carte (tout se
  // fige quand un panneau s'ouvre, référent dys) ; la scène ne revient pas avant `faunaAgain` secondes.
  const shore = DETOURS.find((d) => d.kind === 'rive')!;
  const whaleBase = whaleFacets();
  const spoutBase = spoutFacets();
  const birdBase = birdFacets();
  const birdPerched = birdFacets(true);
  const spoutAt = whaleBase.positions.length;
  const birdsAt = spoutAt + spoutBase.positions.length;
  // La vie animale (world/continu/wildlife.ts) : au 6e, les côtes (piste « Ambiance », 19 octobre 2026) ; au 5e, terre
  // par terre (piste « Ambiance par terre », même jour ; world/continu/wildlife5e.ts). Dans le même maillage, après les
  // oiseaux du bord d'eau : chaque espèce à sa place fixe, chacune de ses bêtes à la taille de sa forme.
  const critters = allCritterForms();
  const groundAt = (p: Vec2) => ground(p.x, p.z);
  const groups = (sixth ? wildlifeGroups6e() : fifth ? wildlifeGroups5e(groundAt) : []).map((g) => ({ ...g, length: critters[g.form].positions.length, start: 0, held: [] as (number | null)[] }));
  // La baleine, son souffle et les oiseaux du bord d'eau sont du 6e : au 5e, le maillage ne tient que les bêtes.
  const whaleEnd = sixth ? birdsAt + FAUNA.birds * birdBase.positions.length : 0;
  let critterEnd = whaleEnd;
  for (const g of groups) {
    g.start = critterEnd;
    critterEnd += g.slots * g.perGroup * g.length;
  }
  const faunaGeometry = keep(new THREE.BufferGeometry());
  const faunaPositions = new Float32Array(critterEnd);
  faunaGeometry.setAttribute('position', new THREE.BufferAttribute(faunaPositions, 3).setUsage(THREE.DynamicDrawUsage));
  faunaGeometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(faunaPositions.length), 3));
  {
    const colors = new Float32Array(faunaPositions.length);
    if (sixth) {
      colors.set(whaleBase.colors, 0);
      colors.set(spoutBase.colors, spoutAt);
      for (let k = 0; k < FAUNA.birds; k++) colors.set(birdBase.colors, birdsAt + k * birdBase.colors.length);
    }
    for (const g of groups) for (let k = 0; k < g.slots * g.perGroup; k++) colors.set(critters[g.form].colors, g.start + k * g.length);
    faunaGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  }
  // La sphère de la scène du bord d'eau (la baleine au large), pour les calculs qui la lisent ; le maillage n'est pas
  // éliminé hors champ (ci-dessous).
  faunaGeometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(shore.at.x + Math.cos(shore.face) * 12, 0, shore.at.z + Math.sin(shore.face) * 12), FAUNA.whaleOff + FAUNA.whaleSide + 8);
  const faunaMaterial = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, side: THREE.DoubleSide });
  const faunaMesh = new THREE.Mesh(faunaGeometry, faunaMaterial);
  faunaMesh.matrixAutoUpdate = false;
  // Les bêtes suivent Kéo partout sur l'île : le maillage se dessine toujours, sans élimination hors champ.
  faunaMesh.frustumCulled = false;
  scene.add(faunaMesh);
  let faunaClock = 0;
  let faunaStart: number | null = null;
  let faunaKey: string | null = null;
  /** Écrit des facettes de base tournées (cap `yaw`, bascule `pitch`) et posées en (x, y, z), à partir du rang `offset`. */
  const writeFacets = (base: Facets, offset: number, x: number, y: number, z: number, yaw: number, pitch: number, scale = 1, stretch = 1) => {
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const src = base.positions;
    for (let k = 0; k < src.length; k += 3) {
      // La bascule autour de l'axe des ailes (z), puis le cap autour de la verticale ; la tête vers +x.
      const px = (src[k] * cp - src[k + 1] * stretch * sp) * scale;
      const py = (src[k] * sp + src[k + 1] * stretch * cp) * scale;
      const pz = src[k + 2] * scale;
      faunaPositions[offset + k] = x + px * cy + pz * sy;
      faunaPositions[offset + k + 1] = y + py;
      faunaPositions[offset + k + 2] = z - px * sy + pz * cy;
    }
  };
  let critterClock = 0;
  let critterAssigned = -Infinity;
  /** Écrit une bête à sa place du maillage, ou l'efface (aucune bête : des sommets nuls, rien ne se dessine). */
  const writeCritter = (pose: CritterPose | null, offset: number, length: number) => {
    if (pose) writeFacets(critters[pose.form], offset, pose.x, pose.y, pose.z, pose.yaw, pose.pitch);
    else faunaPositions.fill(0, offset, offset + length);
  };
  /**
   * Les bêtes à l'image suivante ; vrai si leurs sommets ont changé. Leurs places (celles que tient chaque groupe) sont
   * revues deux fois par seconde autour de Kéo. Avec « Réduire les animations », elles ne sont réécrites que quand leurs
   * places changent : posées, sans bouger.
   */
  const stepCritters = (dt: number): boolean => {
    critterClock += dt;
    if (critterClock - critterAssigned >= 0.5) {
      critterAssigned = critterClock;
      let changed = false;
      for (const g of groups) {
        const next = assignSpots(g.spots, g.at, here, g.held, g.slots);
        changed ||= next.length !== g.held.length || next.some((v, k) => v !== g.held[k]);
        g.held = next;
      }
      if (reduceMotion && !changed) return false;
    } else if (reduceMotion) return false;
    const t = critterClock;
    for (const g of groups)
      g.held.forEach((spot, s) => {
        const poses = spot === null ? [] : g.pose(spot, s, t, reduceMotion, here);
        for (let k = 0; k < g.perGroup; k++) writeCritter(poses[k] ?? null, g.start + (s * g.perGroup + k) * g.length, g.length);
      });
    return true;
  };
  /** La baleine et les oiseaux à l'image suivante : leur scène part à l'arrivée au bord d'eau, puis se joue. */
  const stepFauna = (dt: number, arrived: boolean) => {
    faunaClock += dt;
    if (arrived && (faunaStart === null || faunaClock - faunaStart >= Math.max(FAUNA_END, DETOUR_TIMING.faunaAgain))) faunaStart = faunaClock + DETOUR_TIMING.faunaDelay - DETOUR_TIMING.settle;
    const near = sixth && distance(here, shore.at) < 45;
    const t = faunaStart === null ? null : faunaClock - faunaStart;
    // Le souffle de la baleine, entendu à l'instant où le jet part (jamais avec « Réduire les animations »).
    if (!reduceMotion && t !== null && t >= FAUNA_BLOW && t - dt < FAUNA_BLOW) options.onWhaleBlow?.();
    const playing = t !== null && t >= 0 && t < FAUNA_END;
    const critterMoved = stepCritters(dt);
    const flush = () => {
      if (critterMoved) (faunaGeometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
    };
    if (!near && !playing) {
      // Loin du bord d'eau, sa scène finie : la baleine, son jet et les oiseaux s'effacent (le maillage reste dessiné
      // pour les bêtes des côtes), et se réécrivent au retour.
      if (faunaKey !== 'gone') {
        faunaKey = 'gone';
        faunaPositions.fill(0, 0, whaleEnd);
        (faunaGeometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
      }
      return flush();
    }
    // Avec « Réduire les animations », la baleine se tient en surface tant que Kéo est là. Rien ne bouge (les oiseaux
    // posés, la baleine sous l'eau ou immobile) : les sommets d'avant restent, sans rien calculer.
    const surface = reduceMotion && detourHere === shore.id;
    const key = reduceMotion ? (surface ? 'surface' : 'rest') : playing ? null : 'rest';
    if (key !== null && key === faunaKey) return flush();
    faunaKey = key;
    const pose = faunaPose(shore, reduceMotion ? (surface ? 0 : null) : t, reduceMotion);
    const w = pose.whale;
    if (w) writeFacets(whaleBase, 0, w.x, w.y, w.z, w.yaw - Math.PI / 2, w.pitch);
    else faunaPositions.fill(0, 0, spoutAt);
    const j = pose.spout;
    if (j) writeFacets(spoutBase, spoutAt, j.x, j.y, j.z, 0, 0, Math.max(0.05, j.grow), 1.6);
    else faunaPositions.fill(0, spoutAt, birdsAt);
    pose.birds.forEach((b, k) => writeFacets(b.perched ? birdPerched : birdBase, birdsAt + k * birdBase.positions.length, b.x, b.y, b.z, b.yaw, 0));
    (faunaGeometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
  };
  /**
   * Kéo sur un Détour : immobile `settle` secondes sur son plateau ou au bord d'eau, il y est arrivé (la page le sait) ;
   * dès qu'il en repart, `null`. La vue monte tant qu'il y reste, et revient quand il repart.
   */
  const stepDetour = (now: number, moving: boolean, dt: number) => {
    // Chaque niveau a ses Détours : au 5e, le Creux des Frondaisons (GD-22, lot 6).
    const d = moving || walk ? null : detourAtPoint(here, level);
    let arrived = false;
    if (!d) {
      detourStill = 0;
      if (detourHere) {
        detourHere = null;
        options.onDetour?.(null);
      }
    } else if (detourHere !== d.id) {
      if (!detourStill) detourStill = now;
      else if (now - detourStill >= DETOUR_TIMING.settle * 1000) {
        detourHere = d.id;
        arrived = d.kind === 'rive';
        // Au Creux, la caméra qui monte se tourne vers l'arche, derrière Kéo sur le seuil (GD-22, lot 6).
        const cap = detourCap(d);
        if (cap !== null) turnTo(cap);
        // À la Dalle, Kéo se tourne aussi vers la mer, de dos, comme la caméra (retouche 1 de l'Épaule, DA 13).
        if (cap !== null && d.kind === 'dalle') heading = cap;
        detourShape = detourViewOf(d);
        options.onDetour?.(d.id);
      }
    }
    detourView = detourViewStep(detourView, detourHere ? 1 : 0, dt, reduceMotion);
    if (doorArrival) {
      const held = !walk && distance(here, doorArrival.at) < 0.05 && (doorArrival.shape.height >= 0 || Math.abs(wrapAngle(yaw - doorArrival.yaw)) < 0.05);
      doorArrivalView = detourViewStep(doorArrivalView, held ? 1 : 0, dt, reduceMotion);
      if (doorArrivalView === 0) doorArrival = null;
    }
    stepFauna(dt, arrived);
  };
  /** La part de la vue qui monte (celle d'un Détour, ou celle de l'arrivée d'un lieu), et sa forme. */
  const viewRise = (): number => Math.max(detourRise(detourView), doorArrival ? detourRise(doorArrivalView) : 0);
  const viewShape = (): DetourView => (doorArrival && detourRise(doorArrivalView) > detourRise(detourView) ? doorArrival.shape : detourShape);
  let heading = startSpot ? portHeading(startSpot, site, departure.viewYaw) : FACING_CAMERA;
  keo.rotation.y = heading;
  const keoFeet: Vec3 = { x: here.x, y: 0, z: here.z };
  const placeKeo = (p: Vec2) => {
    let y = standingHeight(ground(p.x, p.z));
    // Sur la culée d'un pont, et sur le tablier d'un pont rebâti, il marche sur la pierre et les planches.
    const floor = bridgeFloor(p.x, p.z, walkClosed, plan);
    if (floor !== null && floor > y) y = floor;
    keo.position.set(p.x, y, p.z);
    if (ring.position.x !== p.x || ring.position.z !== p.z || ring.position.y !== y) {
      ring.position.set(p.x, y, p.z);
      edgesNear(p.x, p.z, KEO_RING.outer, ringEdges, world.ribbons);
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
  // La caisse de la cabine attend du côté de Kéo (un départ sur le plateau : en haut).
  if (cabinLand && onPlateau(here)) carAt = 'haut';

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
  // Au départ à un endroit du lieu de départ, son cap (à la Lisière, vers la Montée) ; devant un lieu, le nord.
  let yaw = startSpot ? (startSpot === 'quai' ? departure.viewYaw : departure.facadeYaw) : 0;
  /**
   * L'angle dont la caméra a tourné autour de la scénette (`SCENE_TURN`), la scène à refaire à l'image suivante, et la
   * dernière question posée, avec laquelle elle se refait. Déclarés ici, avant le premier `updateRings`, qui les lit ;
   * remis à zéro en quittant la scénette (`leaveScenette`).
   */
  let sceneYaw = 0;
  let sceneTurnPending = false;
  let lastQuestion: QuestionRequest | null = null;
  /** L'item de la dernière question posée (sa mission, sa clé) : un autre ramène la caméra de face. */
  let lastItem = '';
  /**
   * Le retour en douceur au cap de départ à chaque nouvel item (`SCENE_RETURN`) : un seul objet, rempli sur place ; un
   * geste à deux doigts l'interrompt.
   */
  const sceneReturn: SceneReturn = { active: false, start: 0, from: 0, to: 0 };
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
    arrivalNow = null;
    quayArrival = false;
    if (walk) return false;
    const near = TALL.find((id) => distance(here, placeById(id).center) < LOOK_UP.within);
    if (near) Object.assign(lanternTop, tallTops.get(near)!);
    if (near !== undefined) return true;
    // À la porte d'un lieu haut, tourné vers son cap : la caméra recule et lève le regard jusqu'au haut tel qu'il est bâti.
    for (const a of arrivals) {
      if (distance(here, a.door) > 0.5 || Math.abs(wrapAngle(yaw - doorViewOf(a.id))) > QUAY_LOOK_TURN) continue;
      lanternTop.x = a.look.x;
      // Le haut bâti du lieu, ou un repère au-delà de lui (à l'Oracle, la tour du Donjon au-dessus de sa paroi).
      lanternTop.y = feet.get(a.id)!.y + (a.top ?? builtTop.get(a.id) ?? modelOfPlace(a.id).top);
      lanternTop.z = a.look.z;
      arrivalNow = a;
      arrivalShape = fittedArrival(a);
      return true;
    }
    // Au quai du lieu de départ (5e, 4e, 3e), tourné vers son cap : le sommet de la Montée au 5e, au fond (directeur artistique, lot 4).
    if (!quayLook || distance(here, quayPoint) > 0.5 || Math.abs(wrapAngle(yaw - departure.viewYaw)) > QUAY_LOOK_TURN) return false;
    Object.assign(lanternTop, quayLook);
    if (departure.quayView) {
      arrivalShape = departure.quayView;
      quayArrival = true;
    }
    return true;
  };
  // Le recul d'arrivée devant un lieu haut qui s'ajuste (`maxBack`) : le haut du lieu entier avec Kéo au-dessus de la
  // rangée du bas ; refait à l'arrivée et quand l'écran change.
  // `nearLantern` le lit à chaque image : il n'est refait que si le lieu, son haut bâti, la rangée ou l'écran ont changé.
  const arrivalFit = { place: null as PlaceId | null, top: 0, w: 0, h: 0, shape: COMMON_DETOUR_VIEW };
  function fittedArrival(a: (typeof arrivals)[number]): DetourView {
    if (a.maxBack <= a.view.back) return a.view;
    const F = arrivalFit;
    if (F.place !== a.id || F.top !== lanternTop.y || F.w !== viewW || F.h !== viewH) {
      Object.assign(F, { place: a.id, top: lanternTop.y, w: viewW, h: viewH, shape: { height: 0, back: fitArrivalBack(focus, lift, yaw, lanternTop, a.view.back, a.maxBack, viewW, viewH, ground) } });
    }
    return F.shape;
  }
  function fitArrival() {
    if (arrivalNow) arrivalShape = fittedArrival(arrivalNow);
  }
  let look = nearLantern() ? 1 : 0;
  // Au 3e, la vue d'arrivée du quai dès la première image.
  if (look && quayArrival) arrivalBack = 1;
  // Le retour d'une scénette (aux Quais) : Kéo reste sur le bord du quai, la caméra garde la barque chargée dans le
  // champ (`back`, de 0 à 1) tant qu'il ne repart pas ; elle rejoint alors la caméra qui suit.
  let exit: (NonNullable<ReturnType<typeof scenetteExit>> & { view?: ExitView }) | null = null;
  let back = 0;
  const atExit = () => !walk && exit !== null && distance(here, exit.at) < 0.05;
  // La caméra au bord du plateau (GD-22, lot 3, `cliffHold`) : ce qu'elle vise (refait à chaque image, sans rien créer)
  // et ce qu'elle retient, lissé ; le dessus du plateau commence aux quatre cinquièmes de sa falaise (`plateauShare`). Au 6e, rien.
  const holdTarget: CliffHold = { height: 0, back: 0, held: 1, level: 0 };
  const hold: CliffHold = { height: 0, back: 0, held: 0, level: 0 };
  const probe: Vec2 = { x: 0, z: 0 };
  const onTop = (x: number, z: number): boolean => {
    probe.x = x;
    probe.z = z;
    return plateauShare(probe) >= 0.8;
  };
  const stepHold = (dt: number) => {
    const want = cliffHold(focus, yaw, lift, onTop, holdTarget);
    if (want) {
      const first = hold.held < 0.01 || reduceMotion;
      hold.height = first ? holdTarget.height : liftStep(hold.height, holdTarget.height, dt, reduceMotion);
      hold.back = first ? holdTarget.back : liftStep(hold.back, holdTarget.back, dt, reduceMotion);
    }
    hold.held = holdStep(hold.held, want ? 1 : 0, dt, reduceMotion);
    // La caisse de la gare du haut s'ouvre avant que la caméra s'approche, et ne se referme qu'une fois la caméra
    // revenue (les lieux ne se refont qu'au changement).
    const open = cabinLand !== null && carAt === 'haut' && !carRolling && cabinCarOpen(cabinLand, here, want || hold.held > 0.01);
    if (open === carOpen) return;
    carOpen = open;
    placeVisibility();
  };
  // La caméra posée à la main (`view`, les captures seulement).
  let manualView: CameraPose | null = null;
  /**
   * La vue de la fiche de la Nef (au 3e, `NefSite.sheetView` : l'aéronef de trois quarts avant, restes du 3e, piste 1 B) :
   * sa pose, faite une fois, et la part où en est la caméra (0 : derrière Kéo ; 1 : toute la vue), qui monte comme la
   * vue d'un Détour et redescend à la fermeture de la fiche, d'un coup avec « Réduire les animations ».
   */
  const nefSheet = nefSite.sheetView ? nefSheetPose(nefSite, nefSite.sheetView, { position: { x: 0, y: 0, z: 0 }, target: { x: 0, y: 0, z: 0 }, fov: 0, lens: 0 }) : null;
  let nefSheetView = 0;
  const follow = () => {
    if (manualView) return applyPose(manualView);
    followPose(focus, lift, pose, yaw, arrivalBack > 0 ? arrivalBack : viewRise(), fifth ? hold : undefined, arrivalBack > 0 ? arrivalShape : viewShape());
    lookUp(pose, lanternTop, keoFeet, look, viewH, ground);
    if (exit) exitView(pose, exit.keep, keoFeet, back, exit.view);
    if (nefSheet && nefSheetView > 0) blendPose(pose, nefSheet, detourRise(nefSheetView));
    applyPose(pose);
  };
  follow();
  // La boussole de la page suit le cap de départ (à la Lisière, vers la Montée).
  if (yaw !== 0) options.onYaw?.(yaw);
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
  /** La caméra d'un coup vers le nord (l'Escale, une scénette), ou vers `to`. */
  const faceNorth = (to = 0) => {
    turning = null;
    setYaw(to);
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
  /** La fiche de la Nef ouverte : la caméra garde la Nef sur son ber, l'enveloppe comprise (artiste technique 3D, retouche du lot 4). */
  let framedNef = false;
  const nefFramed: Vec3 = { x: nefSite.berth.x, y: nefSite.lift.ber + NEF_FRAMED_HEIGHT, z: nefSite.berth.z };
  /** La marque de la Nef prête (`setMark('nef')`) : au-dessus de son modèle, une fois chargé (avant, au-dessus du cadrage de sa fiche). */
  const nefMark = new THREE.Vector3(nefSite.berth.x, nefFramed.y + MARK_LIFT, nefSite.berth.z);
  const subjectOf = (spot: PortSpot | PlaceId): Vec3 | null => {
    const place = PLACES.find((p) => p.id === spot);
    if (!place) return portSubject(spot as PortSpot, port?.trophies.length ?? 0, site);
    // La fiche d'une terre fermée : le pont à rebâtir d'abord, si Kéo se tient devant (de loin, la caméra reste où elle est).
    const land = landOf(place.id);
    if (isLinkedLand(land) && closed.includes(land)) {
      const first = firstClosed(land, closed);
      const s = bridgeSite(first);
      return distance(here, s.mid) < FRAMED_BRIDGE_NEAR ? { x: s.mid.x, y: bridgeDeck(first), z: s.mid.z } : null;
    }
    if (exit && atExit()) return exit.keep;
    const foot = feet.get(place.id);
    return { x: place.center.x, y: (foot?.y ?? 0) + FRAMED_PLACE_HEIGHT, z: place.center.z };
  };
  const reframe = () => {
    if (!frameRect || (!framed && !framedNef) || asked || remise || mapView) return;
    followPose(focus, lift, pose, yaw, arrivalBack > 0 ? arrivalBack : viewRise(), undefined, arrivalBack > 0 ? arrivalShape : viewShape());
    lookUp(pose, lanternTop, keoFeet, look, viewH, ground);
    if (exit) exitView(pose, exit.keep, keoFeet, back, exit.view);
    // La vue de la fiche de la Nef : le décalage se calcule sur la vue d'arrivée, celle que la caméra rejoint.
    if (nefSheet && nefSheetWanted()) blendPose(pose, nefSheet, 1);
    const subject = framedNef ? nefFramed : framed && subjectOf(framed);
    const p = subject && screenOf(pose, subject, viewW, viewH);
    setShift(p ? { x: Math.round(p.x - (frameRect.left + frameRect.width / 2)), y: Math.round(p.y - (frameRect.top + frameRect.height / 2)) } : { x: 0, y: 0 });
    follow();
  };
  /** La vue de la fiche de la Nef est-elle voulue : sa fiche ouverte, Kéo assez près de son poste, rien d'autre en cours. */
  const nefSheetWanted = (): boolean => !!nefSite.sheetView && framedNef && !!frameRect && !asked && !remise && !mapView && Math.hypot(here.x - nefSite.berth.x, here.z - nefSite.berth.z) <= nefSite.sheetView.near;
  const setFrame = (free: typeof frameRect, place?: PlaceId | 'nef') => {
    frameRect = free;
    framedNef = place === 'nef';
    if (place && place !== 'nef') framed = place;
    // Le panneau d'un lieu s'ouvre (Kéo y arrive) : le modèle de son habitant se prépare, avant sa scénette.
    if (place && place !== 'nef' && hasHabitantModel(place)) habitants.prefetch(place);
    if (place && place !== 'nef') prefetchGuide(place);
    if (free) return reframe();
    // Pendant une question ou une remise, la caméra garde son cadrage : le panneau se recadre à leur fin.
    if (asked || remise || mapView) return;
    setShift({ x: 0, y: 0 });
    follow();
  };

  // Les anneaux du terrain, et les lieux qu'on dessine : refaits quand le point suivi s'éloigne de leur centre.
  let markPlace: PlaceId | 'nef' | null = null;
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
  // L'étape du haut du lieu de la scénette posée : ses abords en dépendent (le carbet de la Mangrove).
  let topped = false;
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
      portMesh = portFacets(port, { assembling: Boolean(assembly) }, site);
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
    // La cabine rebâtie : sa caisse où elle attend (au pied, en haut, ou partie rouler).
    const car = land === cabinLand && look === 'rebati' ? carAt : 'bas';
    const open = (car === 'haut' && carOpen) || (land === colLand && look === 'rebati' && colOpen);
    const k = `${land}|${look}|${car}|${open}`;
    let f = bridgeCache.get(k);
    if (!f) bridgeCache.set(k, (f = look === 'carte' ? bridgeMapMark(land) : look === 'pose' ? bridgeLayRest(land) : bridgeFacets(land, look === 'rebati', car, open)));
    return f;
  };
  // L'allumage d'un lieu restauré (`startRestore`, plus bas) : le lieu qui l'attend, celui qui s'allume.
  let restoreNext: PlaceId | null = null;
  let restoring: { place: PlaceId; start: number; frame: string | null } | null = null;
  /** Les trois étapes d'un lieu posées : il est restauré. */
  const isWhole = (parts: readonly PartShape[]) => [0, 1, 2].every((st) => stageComplete(parts, st as 0 | 1 | 2));
  let placesKey = '';
  // La ligne de la falaise du 5e sur la Carte, et la bande sombre de ses chemins ; au 4e, les hachures du sommet ; faites
  // une fois (rien au 6e).
  // Ce que la Carte ajoute au monde, par niveau (./world/continu/levelWorld.ts, `mapOverlay`) : la falaise du 5e, les
  // hachures du sommet et les coupures du 4e.
  const cliffLine: Facets = world.mapOverlay(ground);
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
    const k = `${landmark}|${scenette}|${scenette ? `${scenetteMission}${posed}` : ''}|${hiddenModel}|${hiddenTrace}|${placesState ? PLACES.map((p) => `${JSON.stringify(placesState!.built[p.id])}${placesState!.traces[p.id].join('+')}${placesState!.amenagements?.[p.id]?.join('+') ?? ''}`).join(',') : ''}|${remise?.place ?? ''}|${holding ? `${holding.place}${holding.parts.length}` : ''}|${portKey}|${mapView ? 'carte' : ''}|${closed.join(',')}|${laying && !laying.tapped ? laying.lay.land : ''}|${detoursFound.join(',')}|${detoursLit.join(',')}|${nefLookNow}${nefDrop ? `d${nefDrop.from}` : ''}${nefTrip ? 't' : ''}p${paruresDrop ? paruresDrop.from : paruresNow}${nefParts(nefSite.form) ? 'm' : ''}|${carAt}${carOpen ? 'o' : ''}${colOpen ? 'g' : ''}|${restoring?.place ?? ''}`;
    if (k === placesKey) return;
    placesKey = k;
    // L'Escale entre dans le maillage des lieux : aucun appel de plus.
    const rest: Facets[] = portFacetsNow ? [portFacetsNow] : [];
    const mark: Facets[] = [];
    // Ce que des lieux posent bien au-delà de leur emprise (GD-22, lot 16 : les câbles des Nacelles), dans le monde seulement.
    const reaches: Facets[] = [];
    const habitantsShown: PlaceId[] = [];
    habitantsOnShow = habitantsShown;
    lampShown = sixth && lanternLit(posedOf('phare'));
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
      // Chaque trace avec l'étape qui la porte (au Hameau, celle de sa mission : GD-22, lot 5).
      if (!hidden && hasScenette(p.id) && traceStagePosed(p.id, parts)) list.push(traceOf(p.id, posedTraces(p.id, parts, scenette === p.id ? scenetteTraces(p.id, done, scenetteMission, posed) : done)));
      if (p.id === 'phare' && lampShown) list.push(lampFacets);
      // Sur la Carte, ce qui fait lire le repère du lieu de loin (aux Radeaux, le dessus des radeaux à flot, éclairci).
      const mapMark = mapView ? placeArt(p.id)?.mapMark : undefined;
      if (mapMark) list.push(mapMark({ x: p.center.x, y: foot.y, z: p.center.z }, (stage, row) => rowPosed(parts, stage, row)));
      const reach = mapView ? undefined : placeArt(p.id)?.reach;
      const far = reach?.({ x: p.center.x, y: foot.y, z: p.center.z }, (stage, row) => rowPosed(parts, stage, row));
      if (far) reaches.push(far);
      // Ce qui s'allume à la restauration (la Forge du 4e) : éteint avant, allumé après, comme `reach` hors du modèle et
      // de la Carte ; pendant son allumage, dans le maillage de la pose (`startRestore`).
      const restoration = mapView || restoring?.place === p.id ? undefined : placeArt(p.id)?.restoration;
      if (restoration) reaches.push(restoration.draw({ x: p.center.x, y: foot.y, z: p.center.z }, isWhole(parts) ? Infinity : 0));
      // Les aménagements posés (GD-20, point 4, lot L0), dans le même maillage : cachés pendant toute question, comme les
      // traces (au rivage nord et au large, ceux des lieux du même cadre) ; montrés dans le cadrage de la remise.
      if (showsAmenagements(scenette, p.id, remise?.place ?? null)) for (const id of placesState?.amenagements?.[p.id] ?? []) list.push(placedAmenagement(id, ground).facets);
      // L'habitant près de sa porte (choix du mainteneur, 23 octobre 2026 : en modèle 3D, aux quatre niveaux), dans son
      // maillage à part : ni sur la Carte, ni pendant une scénette (la sienne a son modèle, les autres lieux sont hors du
      // cadre : le budget de la scénette ouverte ne bouge pas), ni dans une terre fermée.
      const land = landOf(p.id);
      if (!mapView && !scenette && !(isLinkedLand(land) && closed.includes(land)) && hasWorldHabitant(p.id)) habitantsShown.push(p.id);
    }
    // Dans la ruine, l'habitant est assis sur son bloc (le corps qui travaille, ../../world/continu/corps.ts).
    worldHabitants.show(habitantsShown, (p) => posedOf(p).length === 0);
    showGestes(habitantsShown);
    gesteCandidatesShown = gesteCandidates(habitantsShown.filter((p): p is ScenePlaceId => hasScenette(p) && isWhole(posedOf(p))), ground);
    // Les ponts (GD-20, point 3, « vraies terres ») : tombé pour une terre fermée, rebâti sinon, dans le maillage des
    // lieux (aucun appel de plus) ; sur la Carte, chacun aussi en trait double, d'une autre forme qu'un chemin.
    for (const land of LINKED_LANDS) {
      rest.push(bridgeOf(land, closed.includes(land) ? 'tombe' : laying?.lay.land === land && !laying.tapped ? 'pose' : 'rebati'));
      if (mapView) rest.push(bridgeOf(land, 'carte'));
    }
    // La Nef (GD-21 ; GD-22, lot 4) : son ber (vide, et la bouée, une fois partie ; au 5e, le gréement déposé), ses
    // parties posées (sans celles qui descendent), et son obstacle tant qu'elle n'est pas partie, avec le lieu suivi (sur
    // la Carte, avec les lieux, sauf au 4e : `offMap`) ; au 5e, le mur écarté après le départ, et le panache du 4e, toujours.
    const gone = nefLookNow === 4 || Boolean(nefTrip);
    const berLook: NefLook = nefTrip ? 3 : nefDrop ? nefDrop.from : nefLookNow;
    rest.push(nefBer(berLook));
    const nefNow = gone ? null : nefModel(nefShownParts(nefDrop ? nefDrop.from : nefLookNow, nefSite.temps));
    if (nefNow) {
      rest.push(nefAtBerth(nefNow, nefSite));
      nefMark.y = nefSite.lift.ber + topOf(nefNow) + MARK_LIFT;
    }
    // Les parures posées (au 3e), sans celle qui descend.
    const parures = gone ? null : paruresOf(0, paruresDrop ? paruresDrop.from : paruresNow);
    if (parures) rest.push(nefAtBerth(parures, nefSite));
    const obstacleShown = !(mapView && nefSite.offMap);
    if (!gone && obstacleShown) (mapView ? rest : mark).push(nefBanc);
    else if (gone && nefLookNow === 4 && nefAfter && obstacleShown) rest.push(nefAfter);
    if (nefStays) rest.push(nefStays);
    if (siteDecor) rest.push(siteDecor);
    if (offMapDecor && !mapView) rest.push(offMapDecor);
    // Le Rafiot des Ferrailleurs à quai (au 6e : GD-23, lot 2 ; GD-27 ; GD-28), près d'un lieu encore éteint ; parti quand
    // ils le sont tous. Dans le monde et sur la Carte, aucun appel de plus.
    const rafiot = world.rafiot?.((id) => isWhole(posedOf(id)));
    if (rafiot) rest.push(rafiot);
    // Au 5e, sur la Carte, la ligne de la falaise (GD-22, lot 2) : le bord du plateau, et la bande sombre des chemins, dans
    // le maillage des lieux.
    if (!sixth) {
      if (mapView) rest.push(cliffLine);
      // Les Détours du 5e (GD-22) : le Creux (lot 6), le fût creusé, son banc et sa lanterne ; la Hutte (lot 8), sa cabane ;
      // la Faille (lot 11), la fente, son arbre, son pont de racines, sa lanterne et sa vapeur ; et la sente de chacun une
      // fois trouvé, dans le monde comme sur la Carte, sans appel de plus.
      if (fifth) rest.push(creuxNow(), detourFacetsNow(), failleNow(), perchoirNow());
      // Les Détours du 4e : l'Épave (lot 2), sa coque sur sa cale ; le Recoin (lot 3), ses murets, sa chaudière et son
      // figuier ; la Dalle (lot 3), sur ses colonnes, son muret ; le Replat (les Coteaux), sa terrasse et son muret ; leur
      // lanterne, et la sente de chacun une fois trouvé.
      else if (level === '4e') rest.push(epaveNow(), recoinNow(), dalleNow(), replatNow());
      // Les Détours du 3e : le Cadran (le Versant), son rocher, son disque et son style ; la Bergerie (les Alpages), son
      // enclos et ses moutons ; le Cèdre (les Prairies), ses plateaux ; le Lac (le Cirque), son eau et ses blocs ; la sente de chacun une fois trouvé.
      else rest.push(cadranNow(), bergerieNow(), cedreNow(), lacNow());
      // `reaches` en dernier : `reachFrom` compte sur eux pour les rayons (`solid`), `mergeFacets` garde l'ordre (nacelles5e.test.ts).
      rest.push(...reaches);
      const placed = mergeFacets(rest);
      reachFrom = reaches.length ? placed.triangles - reaches.reduce((n, f) => n + f.triangles, 0) : Infinity;
      setGeometry(placesMesh, placed);
      setGeometry(landmarkMesh, mergeFacets(mark));
      mapDirty = true;
      return;
    }
    // Les Détours : leurs pierres, le cairn, les sentes trouvées (dans le monde comme sur la Carte), sans appel de plus.
    rest.push(detourFacetsNow(), ...reaches);
    const placed = mergeFacets(rest);
    reachFrom = reaches.length ? placed.triangles - reaches.reduce((n, f) => n + f.triangles, 0) : Infinity;
    setGeometry(placesMesh, placed);
    setGeometry(landmarkMesh, mergeFacets(mark));
    mapDirty = true;
  };
  // La forme de la Nef chargée à la demande (GD-21) : les lieux se refont avec elle (la clé des lieux sait si elle est là).
  if (!nefParts(nefSite.form))
    void loadNef().then((changed) => {
      if (!disposed && changed) placeVisibility();
    });
  let nearIndices: number[] = [];
  /** L'anneau de près : ses tuiles prêtes, ou leur version de loin en attendant (une seule faite par image, `pump`). */
  const setNear = (now: boolean) => nearRing.set(nearIndices.map((i) => (now ? tiles.build(i, 'near') : (tiles.near(i) ?? tiles.build(i, 'far')))));
  /** Les anneaux autour du point suivi ; `now` (le départ, un saut) : les tuiles de près faites tout de suite. */
  const updateRings = (force = false, now = false, from?: { x: number; z: number; look: number }) => {
    // Pendant une scénette, la caméra tourne autour de la scène (`sceneYaw`) : les tuiles suivent son regard. Pendant la
    // vue finale (`from`), elles suivent la caméra et son regard.
    const look = from ? from.look : yaw + (scenette && asked ? sceneYaw : 0);
    const at = from ?? focus;
    if (!force && Math.hypot(at.x - ringCenter.x, at.z - ringCenter.z) < RING_MOVE && Math.abs(wrapAngle(look - ringYaw)) < CAMERA_TURN.rings) return;
    ringCenter.x = at.x;
    ringCenter.z = at.z;
    ringYaw = look;
    const rings = tileRings(ringCenter, FOG.far, look, world.tiles.grid);
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
    // Rien à lever sans brume (au 3e, aucun voile : retouche 1 du lot 1).
    if (!fading || !v.triangles) return;
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
    const at = (d: number) => onScreen(s.near.x + s.dir.x * d, bridgeDeck(land, d), s.near.z + s.dir.z * d);
    return distance(here, s.mid) < FOG.far && (at(s.water[0]) || at((s.water[0] + s.water[1]) / 2) || at(s.water[1]));
  };
  /**
   * La pose d'un pont commence : son maillage à part, de ce qui se relève (une copie de ses sommets, que la pose
   * réécrit), sa boîte englobante tenant les piles sous l'eau (l'élimination hors champ reste allumée) ; les lieux n'en
   * gardent que les culées et les départs d'arche. Kéo, sur sa culée, y reste cadré.
   */
  const startLay = (land: LinkedLand, events: BridgeLayEvents) => {
    finishLay();
    finishPose();
    endGlow();
    // Kéo sur la culée : la caméra reste cadrée sur le pont, posé d'un coup ou non.
    const { stop } = bridgeSite(land);
    if (!walk && Math.abs(here.x - stop.at.x) + Math.abs(here.z - stop.at.z) <= 0.3) heldBridge = land;
    if (reduceMotion || mapView || asked || scenette || assembly || !bridgeOnScreen(land)) {
      events.tap();
      events.laid();
      return;
    }
    const lay = bridgeLay(land);
    laying = { lay, start: performance.now() / 1000, events, tapped: false, drawn: -1, fade: -1 };
    walkClosed = [...closed, land];
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(lay.facets.positions), 3));
    // Le pont tournant réécrit aussi ses normales (la volée tourne) et ses couleurs (le fondu de la rouille) : des copies.
    g.setAttribute('normal', new THREE.BufferAttribute(lay.swing ? new Float32Array(lay.facets.normals) : lay.facets.normals, 3));
    g.setAttribute('color', new THREE.BufferAttribute(lay.swing ? new Float32Array(lay.facets.colors) : lay.facets.colors, 3));
    if (lay.swing) {
      // La boîte de la volée ouverte et du pont fermé, qui l'encadre à tout instant.
      const { min, max } = lay.swing.bounds;
      g.boundingBox = new THREE.Box3(new THREE.Vector3(...min), new THREE.Vector3(...max));
    } else {
      g.computeBoundingBox();
      // `computeBoundingBox` vient de la calculer : elle n'est pas nulle.
      g.boundingBox!.min.y -= lay.sink;
    }
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
      const normal = poseMesh.geometry.getAttribute('normal') as THREE.BufferAttribute;
      bridgeLayPositions(laying.lay, u, position.array as Float32Array, laying.lay.swing ? (normal.array as Float32Array) : undefined);
      position.needsUpdate = true;
      if (laying.lay.swing) normal.needsUpdate = true;
      const color = poseMesh.geometry.getAttribute('color') as THREE.BufferAttribute;
      const fade = bridgeLayColors(laying.lay, u, color.array as Float32Array, laying.fade);
      if (fade !== null) {
        laying.fade = fade;
        color.needsUpdate = true;
      }
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
    const stop = clampToOpen(at, walkClosed, plan);
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
    const place = markPlace === 'nef' ? null : markPlace;
    const mark = markPlace === 'nef' ? nefMark : place ? marks.get(place) : undefined;
    if (!mark) return options.onMark(null);
    projected.copy(mark).project(camera);
    const far = distanceSign(here, place ? placeById(place).center : nefSite.berth);
    const m = markOnScreen({ x: sx(projected), y: sy(projected), behind: projected.z > 1 }, viewW, viewH, MARK_MARGIN, far, place !== null && markBeside(place) && whole(place));
    if (m.inside && departure.floor(here.x, here.z) !== null) markAtPort(m);
    if (landmarks.length) m.landmarks = landmarksOnScreen(place);
    options.onMark(m);
  };
  // Les repères du niveau (`LevelWorld.landmarks`, au 3e) : leur boîte à l'écran, remplie sur place à chaque image, sauf
  // celui qu'est le lieu marqué, ceux derrière la caméra et ceux au-delà du brouillard.
  const landmarks = world.landmarks ?? [];
  const landmarkRects = landmarks.map(() => ({ left: 0, top: 0, width: 0, height: 0 }));
  const landmarkShown: { left: number; top: number; width: number; height: number }[] = [];
  const landmarkCorner = new THREE.Vector3();
  const landmarksOnScreen = (place: PlaceId | null) => {
    landmarkShown.length = 0;
    landmarks.forEach((l, k) => {
      if (l.place && l.place === place) return;
      const cx = (l.min.x + l.max.x) / 2,
        cz = (l.min.z + l.max.z) / 2;
      if (Math.hypot(cx - camera.position.x, cz - camera.position.z) > world.fog.far) return;
      let x0 = Infinity,
        y0 = Infinity,
        x1 = -Infinity,
        y1 = -Infinity;
      for (let c = 0; c < 8; c++) {
        landmarkCorner.set(c & 1 ? l.max.x : l.min.x, c & 2 ? l.max.y : l.min.y, c & 4 ? l.max.z : l.min.z).project(camera);
        if (landmarkCorner.z > 1) return;
        x0 = Math.min(x0, sx(landmarkCorner));
        x1 = Math.max(x1, sx(landmarkCorner));
        y0 = Math.min(y0, sy(landmarkCorner));
        y1 = Math.max(y1, sy(landmarkCorner));
      }
      if (x1 < 0 || y1 < 0 || x0 > viewW || y0 > viewH) return;
      const r = landmarkRects[k];
      r.left = x0;
      r.top = y0;
      r.width = x1 - x0;
      r.height = y1 - y0;
      landmarkShown.push(r);
    });
    return landmarkShown;
  };
  /**
   * Au Port (GD-20, lot 2) : la ligne de toit sous laquelle la marque ne descend pas, là où elle se tient (le bas du toit
   * de l'école, de la galerie, le faîte de la halle), et la place de Kéo à l'écran, qu'elle ne couvre pas.
   */
  const markAtPort = (m: MarkOnScreen) => {
    let ceiling = Infinity;
    for (const [a, b] of siteRooflines) {
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
      lockPoints.push(new THREE.Vector3(at.x, bridgeDeck(land) + LOCK_LIFT, at.z));
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
        distance(here, bridgeSite(l.land).mid) < Math.min(FOG.far, bridgeLockRange(l.land)) &&
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
      // La Nef : là où se pose sa marque (`nefMark`, relu à chaque image, sa hauteur venant avec le modèle).
      if (place === 'nef') return nefMark;
      // Au-dessus de l'habitant près de sa porte (à sa taille dans le monde), sinon de sa place dans la scénette,
      // là où se joue la remise ; autant au-dessus de sa tête que dans la scénette.
      const w = worldHabitantAt(place, ground);
      if (w && hasWorldHabitant(place)) return { x: w.x, y: w.y + habitantHeightNow(place) + SIGN_LIFT - HABITANT_HEIGHT, z: w.z };
      const h = scenetteHabitant(place, remisePosed(place));
      return { x: h.x, y: h.y + SIGN_LIFT, z: h.z };
    },
    place: (anchor, sign) => {
      const nef = sign.place === 'nef';
      projected.copy(nef ? nefMark : anchor).project(camera);
      const x = sx(projected);
      const y = sy(projected);
      sign.x = x;
      sign.y = y;
      sign.shown = projected.z < 1 && distance(here, nef ? nefSite.berth : placeById(sign.place as PlaceId).center) < FOG.far && x > LOCK_LEFT && x < viewW - LOCK_MARGIN && y > LOCK_MARGIN && y < viewH - LOCK_MARGIN;
    },
    onSigns: options.onSigns,
  });
  const setSigns = signsTracker.set;
  const reportSigns = signsTracker.report;
  const hideSigns = signsTracker.hide;

  // La grille de ce qui se marche (le déplacement libre), tirée une fois : par tranches au repos (`stepGrid`, plus bas),
  // ou le reste d'un coup au premier besoin.
  let walkGrid: WalkGrid | null = null;
  const walkSteps = walkGridSteps(field, plan);
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

  /**
   * Un trajet commence : s'il passe la cabine de la Montée (reliée), il prend la caisse (./cabinRide.ts), qui roule
   * pendant le trajet (`stepCabin`).
   */
  const beginWalk = (route: readonly Vec2[]) => {
    const r = cabinLand && !walkClosed.includes(cabinLand) ? routeWithRide(route, cabinLand) : null;
    rideUp = r?.ride ? r.ride.up : null;
    walk = startWalk(r ? r.route : route, performance.now(), r?.ride);
  };
  /** La caisse de la cabine attend du côté où se tient Kéo (après un saut, un trajet, une marche) : les lieux se refont si elle change de gare. */
  const parkCar = () => {
    if (!cabinLand || carRolling) return;
    const side: CabinCar = onPlateau(here) ? 'haut' : 'bas';
    if (side === carAt) return;
    carAt = side;
    placeVisibility();
  };
  const arrive = (place: PlaceId | null) => {
    walk = null;
    rideUp = null;
    parkCar();
    showFreeMark(null);
    if (place) framed = place;
    startPrebuild();
    options.onArrive(place);
  };
  const startWalkTo = (target: NetworkPoint, place: PlaceId | null) => {
    const from = snapToNetwork(here);
    // Au-delà d'un pont tombé, ou d'un pont qui se pose, Kéo s'arrête sur sa culée, sans heurt ni son (GD-20, point 3).
    const to = clampToOpen(target, walkClosed, plan);
    if (to !== target) place = null;
    // Kéo hors des chemins (le déplacement libre) : le trajet libre jusqu'à la porte, qui préfère les chemins ; sinon le
    // réseau, et s'il est hors du chemin (sur le bord du quai, au retour d'une scénette), il le rejoint d'abord.
    const free = distance(here, from.at) > 0.05 && offNetwork() ? freeRoute(grid(), here, to.at, walkClosed) : null;
    const route = free ?? findRoute(from, to);
    if (!free && distance(here, from.at) > 0.05) route.unshift(here);
    showFreeMark(null);
    walkTarget = place;
    // Kéo part vers un lieu : le modèle de son habitant se prépare pendant la marche, avant « Livrer » ou une mission.
    if (place && hasHabitantModel(place)) habitants.prefetch(place);
    if (place) prefetchGuide(place);
    if (route.length < 2 || distance(route[0], route[route.length - 1]) < 0.05) return arrive(place);
    beginWalk(route);
    heldBridge = null;
    options.onDepart();
  };
  /**
   * Le déplacement libre : Kéo va au point du sol touché, ou au plus proche où l'on marche (l'eau, un rocher, une terre
   * fermée), par le trajet libre ; la marque au sol l'y attend. Sans grille utile (hors du terrain), le réseau, comme
   * avant.
   */
  const startFreeWalk = (touched: Vec2) => {
    const g = grid();
    // Au 5e, un toucher sur le pont de la Faille, dans sa fente ou sur sa paroi mène à la tête du pont (GD-22, lot 11).
    const p = (level === '5e' ? failleTapTarget(touched) : null) ?? touched;
    const to = nearestWalkable(g, p, walkClosed);
    const route = to ? freeRoute(g, here, to, walkClosed) : null;
    if (!to || !route) return startWalkTo(snapToNetwork(p), null);
    walkTarget = null;
    heldBridge = null;
    if (route.length < 2 || distance(route[0], route[route.length - 1]) < 0.05) {
      arrive(null);
      return pulseFreeMark(to);
    }
    beginWalk(route);
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
    const stop = clampToOpen(door, closed, plan);
    const shut = stop !== door ? bridgeSite(firstClosed(landOf(place) as LinkedLand, closed)) : null;
    here = shut ? { ...stop.at } : pathNode(placeById(place).door).at;
    // La caméra regarde le lieu depuis sa porte : le nord, sauf aux Radeaux, porte au nord-est (GD-22, lot 6), et aux
    // Instants, le long de la chaussée (lot 8) ; jamais devant un pont fermé. Kéo tourné vers elle.
    const view = shut ? 0 : doorViewOf(place);
    heading = shut ? Math.atan2(-shut.dir.x, -shut.dir.z) : FACING_CAMERA + view;
    faceNorth(view);
    detourView = 0;
    // Un lieu plus haut que ce que la caméra qui suit voit de sa porte a sa vue d'arrivée (le Gaillard, lot 15).
    const frame = shut ? null : doorFrameOf(place);
    doorArrival = frame ? { shape: frame, at: { ...here }, yaw: view } : null;
    doorArrivalView = doorArrival ? 1 : 0;
    exit = null;
    back = 0;
    keo.rotation.y = heading;
    placeKeo(here);
    followStep(focus, aimed(), 0, true);
    lift = occlusionLift(focus, ground, yaw);
    // Devant un lieu haut, la caméra a reculé et levé le regard dès la première image : « Y aller » est une coupe.
    // « Y aller » est une coupe : le recul du lieu quitté ne déborde pas sur celui-ci (sinon il masquerait la vue d'arrivée du Gaillard).
    arrivalBack = 0;
    if (nearLantern() && (arrivalNow || quayArrival)) look = arrivalBack = 1;
    updateRings(true, true);
    follow();
    arrive(place);
  };
  /** Kéo d'un coup à un endroit de l'Escale, tourné vers sa façade ; la page en ouvre le panneau. */
  const jumpToPort = (spot: PortSpot) => {
    heldBridge = null;
    here = pathNode(portNode(spot)).at;
    heading = portHeading(spot, site, departure.viewYaw);
    // La caméra au cap du quai (vers la Montée, à la Lisière), ou face aux façades.
    turning = null;
    setYaw(spot === 'quai' ? departure.viewYaw : departure.facadeYaw);
    detourView = 0;
    doorArrival = null;
    doorArrivalView = 0;
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
    // Pendant une scénette, la caméra tourne autour de la scène (« caméra libre ») ; la scène se refait à l'image suivante.
    if (asked && scenette && !remise && !descent.active && !finaleShown && !poseRun.active && !assembly && !laying) {
      const d = wrapAngle(angle - twist.angle);
      if (!twist.started && Math.abs(d) < CAMERA_TURN.deadAngle) return;
      twist.started = true;
      twist.angle = angle;
      // Le geste interrompt le retour au cap de départ et part de l'angle courant ; au Phare et au Guet, il s'arrête au
      // bout de l'arc (`ScenetteSite.arc`).
      stopSceneReturn(sceneReturn);
      sceneYaw = turnSceneYaw(sceneYaw, d, scenetteStartYaw(scenette, posed), scenetteArc(scenette, posed));
      sceneTurnPending = true;
      return;
    }
    // Pendant une pose, une remise ou la fin d'une scénette, la caméra ne tourne pas, et l'écart ne s'accumule pas.
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
    // Un câble hors de l'emprise d'un lieu ne répond pas au toucher (GD-22, lot 16) : le toucher passe au travers.
    const hit = raycaster.intersectObjects(touchables, false).find(solid);
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
    // Un toucher pendant l'allumage d'un lieu restauré le passe : tout allumé d'un coup.
    if (restoring) return endRestore();
    // Un toucher pendant la vue finale ou une veillée la termine : la caméra revient derrière Kéo (ou la page couvre
    // d'abord, `pass`).
    if (scriptRun) return scriptRun.pass ? scriptRun.pass() : finishScript();
    // Un toucher pendant le départ de la Nef le termine (GD-21).
    if (nefTrip) return finishNefTrip();
    if (assembly) return finishAssembly();
    // Un toucher pendant la pose d'un pont la finit : le pont posé, le toc s'il n'a pas été dit.
    if (laying) return finishLay();
    if (asked || remise || !d || Math.hypot(e.clientX - d.x, e.clientY - d.y) > TAP.pixels || performance.now() - d.t > TAP.ms) return;
    // La caisse de la cabine roule, ou le voile de la brume est montré : aucun geste ne fait repartir Kéo (première
    // relecture du lot 3). La caisse touchée à sa gare part, comme le bouton.
    if (cabinBusy()) return;
    manualView = null;
    if (carTouched(e.clientX, e.clientY)) return touchCar();
    // L'habitant d'un lieu, près de sa porte (GD-27) : Kéo déjà près de lui, il dit une ligne et Kéo reste où il est.
    const habitant = habitantAt(e.clientX, e.clientY);
    if (habitant && options.onHabitant) return options.onHabitant(habitant);
    // Un aménagement posé (GD-20, point 4, lot L1) : son lieu, toujours le sien, par son dessin ou le disque autour de lui ;
    // Kéo y marche, puis son panneau s'ouvre ; d'une terre fermée, la fiche de la terre.
    const object = objectAt(e.clientX, e.clientY);
    if (object) {
      const land = landOf(object);
      if (isLinkedLand(land) && closed.includes(land)) return options.onClosed(land);
      return startWalkTo(atNode(placeById(object).door), object);
    }
    const p = hitAt(e.clientX, e.clientY);
    if (!p) return;
    // La Nef, son ber ou son obstacle (le banc du large, le mur de nuages) : la fiche de la Nef (GD-21), Kéo reste où il
    // est ; partie, le ber vide et sa bouée l'ouvrent aussi, avec la rangée « Revenir » (voyage entre niveaux, piste A).
    if (options.onNef && (nefSite.touched(p) || nefSite.obstacleTouched(p))) return options.onNef();
    // Le lieu de départ : une porte, la galerie ou le lieu d'assemblage y mène Kéo d'un coup et en ouvre le panneau ; le
    // reste ouvre sa fiche (Kéo reste où il est).
    const atPort = portTouch(p, site);
    if (atPort === 'fiche') return options.onPort('fiche');
    if (atPort) return jumpToPort(atPort);
    // Un lieu d'une terre fermée, ou son pont tombé : la fiche de la terre (GD-20, point 3), Kéo reste où il est.
    const shut = closedAt(p, e.clientX, e.clientY);
    if (shut) return options.onClosed(shut);
    // Un lieu : Kéo va à sa porte ; si deux rayons prennent le point, le plus proche.
    const touched = nearestPlace(p, PLACES);
    if (touched) startWalkTo(atNode(placeById(touched).door), touched);
    else startFreeWalk(p);
  };
  /**
   * L'habitant montré près de sa porte sous un toucher (`clientX`, `clientY`), s'il y en a un : sa boîte (ses pieds, sa
   * hauteur, une demi-unité de côté) projetée à l'écran, et le disque de 48 px au moins autour d'elle, comme un
   * aménagement ; ni derrière la caméra, ni dans la brume.
   */
  const habitantAt = (clientX: number, clientY: number): PlaceId | null => {
    if (!habitantsOnShow.length || !options.onHabitant) return null;
    const targets: ObjectTarget[] = [];
    for (const place of habitantsOnShow) {
      const at = worldHabitantAt(place, ground);
      // De loin, le toucher garde son sens : Kéo marche vers le lieu (consultant UX UI, référent dys).
      if (!at || distance(here, at) > HABITANT_REACH) continue;
      const h = habitantHeightNow(place);
      // Assis, les jambes avancent : la boîte s'élargit d'autant.
      const half = h < worldHabitantHeight(place) ? 0.8 : 0.5;
      const points: { x: number; y: number }[] = [];
      let behind = false;
      for (const x of [at.x - half, at.x + half])
        for (const y of [at.y, at.y + h])
          for (const z of [at.z - half, at.z + half]) {
            corner.set(x, y, z).project(camera);
            behind ||= corner.z >= 1;
            points.push({ x: sx(corner), y: sy(corner) });
          }
      if (!behind) targets.push({ place, rect: screenRect(points) });
    }
    const r = renderer.domElement.getBoundingClientRect();
    return touchedObject(clientX - r.left, clientY - r.top, targets);
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
      if (!showsAmenagements(scenette, pl.id, null) || distance(here, pl.center) > FOG.far) continue;
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
      if (isLinkedLand(land) && closed.includes(land) && distance(p, pl.center) <= pl.touchRadius) return land;
    }
    const r = renderer.domElement.getBoundingClientRect();
    const x = clientX - r.left;
    const y = clientY - r.top;
    let best: LinkedLand | null = null;
    let bestD = Infinity;
    for (const land of closed) {
      const { mid } = bridgeSite(land);
      projected.set(mid.x, bridgeDeck(land), mid.z).project(camera);
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
  const allTiles = Array.from({ length: plan.terrain.tilesX * plan.terrain.tilesZ }, (_, i) => i);
  const mapSpots: MapSpotOnScreen[] = [
    ...PLACES.map((p) => ({ id: p.id, x: 0, y: 0, shown: false, ...(plan.upper.includes(p.id) ? { up: true } : {}), ...(placeArt(p.id)?.mapClear ? { clear: { left: 0, top: 0, right: 0, bottom: 0 } } : {}), ...(placeArt(p.id)?.nameAbove ? { above: true as const } : {}), ...(p.mapSide ? { side: p.mapSide } : {}), ...(p.mapPinned ? { pinned: true as const } : {}) })),
    ...LINKED_LANDS.map((land) => ({ id: bridgeSpot(land), x: 0, y: 0, shown: false })),
    // Le lieu de départ (l'Escale, la Lisière).
    { id: 'port' as const, x: 0, y: 0, shown: false },
    { id: 'keo' as const, x: 0, y: 0, shown: false },
  ];
  // Kéo, sur la Carte du 5e : en haut quand il est sur le plateau (refait à chaque pose, sans rien créer).
  const keoSpot = mapSpots[mapSpots.length - 1];
  const portSpotPoint = portMapPoint(site);
  const portPoint = new THREE.Vector3(portSpotPoint.x, portSpotPoint.y, portSpotPoint.z);
  let mapMs = 0;
  const keoPoint = new THREE.Vector3();
  const fingers = new Map<number, { x: number; y: number }>();
  let pinch: { gap: number; mx: number; my: number } | null = null;
  const aspect = () => viewW / viewH;
  const showMap = () => {
    if (!mapView) return;
    // Le bout de la caméra suit la vue : jamais en deçà de l'île (au téléphone en portrait, elle est loin).
    const far = Math.max(MAP_FAR, mapFarPlane(plan, mapView));
    if (camera.far !== far) {
      camera.far = far;
      camera.updateProjectionMatrix();
      fog.near = Math.max(MAP_FOG, far);
      fog.far = fog.near + 1;
    }
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
      return [bridgeSpot(land), new THREE.Vector3(mid.x, bridgeDeck(land), mid.z)];
    }),
  );
  // Le point du nom d'un lieu qui le fixe (le Sémaphore, au-dessus de sa corniche ; le Gaillard, au-dessus de ses
  // cheminées : le même en ruine et restauré), fait une fois ; sinon, la marque de la prochaine mission.
  const mapPoints = new Map<PlaceId, THREE.Vector3>(
    PLACES.flatMap((p) => {
      const o = placeArt(p.id)?.mapPoint;
      const foot = feet.get(p.id)!;
      return o ? [[p.id, new THREE.Vector3(foot.x + o.x, foot.y + o.y, foot.z + o.z)] as const] : [];
    }),
  );
  const placeMapPoint = (id: PlaceId) => mapPoints.get(id) ?? marks.get(id);
  const mapMark = (id: MapSpotOnScreen['id']) => (id === 'keo' ? keoPoint.set(keoFeet.x, keoFeet.y, keoFeet.z) : id === 'port' ? portPoint : (bridgePoints.get(id) ?? placeMapPoint(id as PlaceId)));
  // Un lieu assez loin des bords gauche et droit (une part de la largeur, `mapLabelSide` : au téléphone en portrait, 100 px
  // ne laissaient que 190 px sur 390), et du haut.
  const mapShown = (x: number, y: number) => x > mapLabelSide(viewW) && x < viewW - mapLabelSide(viewW) && y > MAP_LABEL_TOP && y < viewH - LOCK_MARGIN;
  // Les coins de ce que les étiquettes laissent à découvert, au niveau de l'eau, faits une fois (les trois radeaux).
  const clearCorners = new Map<string, THREE.Vector3[]>(
    PLACES.flatMap((p) => {
      const corners = placeArt(p.id)?.mapClear;
      return corners ? [[p.id, corners.map((c) => new THREE.Vector3(p.center.x + c.x, 0, p.center.z + c.z))] as const] : [];
    }),
  );
  const reportMapPlaces = () => {
    for (const l of mapSpots) {
      const mark = mapMark(l.id);
      if (!mark) continue;
      projected.copy(mark).project(camera);
      l.x = ((projected.x + 1) / 2) * viewW;
      l.y = ((1 - projected.y) / 2) * viewH;
      l.shown = projected.z < 1 && mapShown(l.x, l.y);
      const corners = l.clear ? clearCorners.get(l.id) : undefined;
      if (l.clear && corners) {
        l.clear.left = l.clear.top = Infinity;
        l.clear.right = l.clear.bottom = -Infinity;
        for (const c of corners) {
          projected.copy(c).project(camera);
          const x = ((projected.x + 1) / 2) * viewW,
            y = ((1 - projected.y) / 2) * viewH;
          l.clear.left = Math.min(l.clear.left, x);
          l.clear.right = Math.max(l.clear.right, x);
          l.clear.top = Math.min(l.clear.top, y);
          l.clear.bottom = Math.max(l.clear.bottom, y);
        }
      }
    }
    if (plan.upper.length) keoSpot.up = onPlateau(keoFeet);
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
  // Sans ce que les étiquettes laissent à découvert : les vues essayées ne comptent que les noms des lieux ouverts.
  const probeSpots: MapSpotOnScreen[] = mapSpots.map((l) => ({ id: l.id, x: l.x, y: l.y, shown: l.shown, ...(l.up !== undefined ? { up: l.up } : {}), ...(l.above ? { above: l.above } : {}), ...(l.side ? { side: l.side } : {}) }));
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
    const open = [...mapOpen.map((id) => placeMapPoint(id)), portPoint].filter((m): m is THREE.Vector3 => Boolean(m));
    // Les points des lieux pour une vue essayée, sans toucher la caméra (`screenOf`, la même projection).
    const view = reframeMap(plan, a, open, (v) => {
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
    mapView = mapFirst = clampMap(plan, view, a, mapFar);
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
      // Rien ne bouge sur la Carte : la caisse qui roule arrive d'abord à sa gare.
      finishRide();
      finishLay();
      finishPose();
      finishAssembly();
      // Kéo s'arrête où il est : la Carte n'est pas un trajet.
      if (walk) arrive(null);
      mapOpen = open;
      if (!mapView) {
        mapView = mapFirst = mapStart(plan, aspect());
        mapFar = 0;
        mapSettling = MAP_SETTLE_FRAMES;
      }
      fog.near = MAP_FOG;
      fog.far = MAP_FOG + 1;
      camera.far = MAP_FAR;
      camera.updateProjectionMatrix();
      nearRing.set([]);
      farRing.set(allTiles.map((i) => tiles.build(i, 'far')));
      // La brume des failles ne se montre pas sur la Carte : la ligne de la falaise y est à sa place.
      riftMesh.visible = false;
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
    fog.near = FOG.near;
    fog.far = FOG.far;
    camera.far = followFar;
    camera.updateProjectionMatrix();
    riftMesh.visible = fifth;
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
      if (at) mapView = zoomMap(plan, mapView, gap / pinch.gap, at, aspect(), mapFar);
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
    mapView = panMap(plan, mapView, a.x - b.x, a.z - b.z, aspect(), mapFar);
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
    mapView = zoomMap(plan, mapView, factor, at, aspect(), mapFar);
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
  // Nommés pour les tests de la scène (le monde qui répond), rien d'autre ne lit ces noms.
  itemMesh.name = 'item';
  reactionMesh.name = 'reaction';
  scene.add(still(itemMesh), reactionMesh);
  let reaction: { r: Reaction; start: number } | null = null;
  // Le monde qui répond (GD-28, lot 4 de GD-27) : les objets posés sont dans le maillage de l'item, et celui qui se pose
  // descend dans le maillage de la réaction, libre là où le lieu a son objet (l'objet remplace la réaction du témoin,
  // directeur artistique) : aucun appel de plus. Si une réaction joue quand même (le tri), l'objet se pose d'un coup.
  // `itemFacets` : la scène de l'item sans les objets posés, pour y remettre le prochain.
  let respond: { place: PlaceId; mission: string; item: string; count: number; shown: number; move: { start: number; m: RespondMove } | null } | null = null;
  let itemFacets: Facets | null = null;
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
  /** Les objets posés du monde qui répond, avec la scène de l'item, dans son maillage. */
  const showResponded = () => {
    if (!itemFacets) return;
    const posed = respond && respond.shown > 0 ? respondPlaced(respond.place, respond.shown) : null;
    setGeometry(itemMesh, posed && posed.triangles ? mergeFacets([itemFacets, posed]) : itemFacets);
    if (descent.active) itemMesh.visible = false;
  };
  /** L'objet en vol se pose d'un coup (un autre item, « Suivant » avant la fin, la sortie, le bilan) ; rien en vol : rien. */
  const finishRespond = () => {
    if (!respond?.move) return;
    respond.move = null;
    reactionMesh.visible = false;
    respond.shown = respond.count;
    showResponded();
  };
  /** L'objet qui se pose, à l'instant `t` : il descend dans le maillage de la réaction, puis rejoint les objets posés. */
  const stepRespond = (t: number) => {
    const move = respond?.move;
    if (!move) return;
    if (t < move.start) return;
    const u = reduceMotion ? 1 : Math.min(1, (t - move.start) / RESPOND_SECONDS);
    // Une descente droite qui ralentit à la fin (directeur artistique) : jamais un arc, qui est le geste des réactions.
    const e = 1 - (1 - u) ** 3;
    const { from, to, arc } = move.m;
    reactionMesh.visible = true;
    reactionMesh.position.set(from.x + (to.x - from.x) * e, from.y + (to.y - from.y) * e + arc * Math.sin(Math.PI * e), from.z + (to.z - from.z) * e);
    if (u >= 1) finishRespond();
  };
  /**
   * Le compte des bonnes réponses de la scénette (`QuestionRequest.responded`) : un cran de plus, l'objet suivant part
   * (dès « Valider », pendant l'écran du résultat ; d'un coup avec « Réduire les animations ») ; une autre mission ou un compte qui retombe
   * (« Rejouer »), tout s'efface ; le même compte, rien ne bouge.
   */
  const countResponded = (place: PlaceId, mission: string, item: string, responded: number | undefined) => {
    const wanted = responds(place) ? Math.max(0, Math.min(RESPOND_MAX, Math.floor(responded ?? 0))) : 0;
    if (!respond || respond.place !== place || respond.mission !== mission || wanted < respond.count) {
      finishRespond();
      respond = { place, mission, item, count: wanted, shown: wanted, move: null };
      return;
    }
    respond.item = item;
    if (wanted === respond.count) return;
    finishRespond();
    respond.count = wanted;
    const m = respondMove(place, wanted - 1);
    if (!m || reduceMotion || reaction) {
      respond.shown = wanted;
      return;
    }
    setGeometry(reactionMesh, m.facets);
    reactionMesh.rotation.set(0, 0, 0);
    reactionMesh.position.set(m.from.x, m.from.y, m.from.z);
    respond.shown = wanted - 1;
    respond.move = { start: performance.now() / 1000, m };
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
  const decorMesh = still(new THREE.Mesh(new THREE.BufferGeometry(), volumeMaterial));
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
  /** Ceux qui écrivent les repères de la scène (la page) : la caméra tournée les déplace. */
  const sceneTurnListeners = new Set<(labels: LabelOnScreen[]) => void>();
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
  /**
   * La trame des volumes proches (`SEE_THROUGH`), le temps d'une image de scénette : les têtes de Kéo et de l'habitant ;
   * éteinte ailleurs (la boucle la remet à zéro après l'image).
   */
  const seeScene = () => {
    if (!scenette) return;
    const h = scenetteHabitant(scenette, posed);
    see.a.value.set(keo.position.x, keo.position.y + SCENE_TURN.keoHead, keo.position.z);
    see.b.value.set(h.x, h.y + SCENE_TURN.habitantHead, h.z);
    see.floor.value = Math.min(keo.position.y, h.y);
    see.on.value = 1;
  };
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
    topped = stageComplete(posedOf(place), 1);
    // Le modèle de l'habitant, s'il est prêt, avant le décor de près : celui-ci se fait alors sans le pion. Un lieu du 5e
    // sans modèle encore garde son pion (./habitants.ts, `hasHabitantModel`).
    if (hasHabitantModel(place)) habitants.show(place, scenetteHabitant(place, posed));
    else habitants.hide();
    // L'équipier qui guide le lieu, à côté de Kéo, immobile (GD-23, lot 1) ; Kéo seul ailleurs.
    const guide = scenetteGuide(place, posed);
    if (guide) equipiers.show(guide.equipier, guide.at, guide.yaw);
    else equipiers.hide();
    setGeometry(decorMesh, scenetteDecor(place, false, posed, topped));
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
    sceneYaw = 0;
    sceneReturn.active = false;
    sceneTurnPending = false;
    lastQuestion = null;
    descent.active = false;
    placeVisibility();
    unlitReaction();
    finale = null;
    finaleShown = false;
    decorMesh.geometry.dispose();
    decorMesh.geometry = new THREE.BufferGeometry();
    decorMesh.visible = false;
    habitants.hide();
    equipiers.hide();
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
    exit = ex ? { ...ex, view: ex.view ?? traceViewOf(left) } : { at: { ...here }, keep: placeKeep(left), view: PLACE_VIEW };
    back = 1;
    keo.rotation.y = heading;
    placeKeo(here);
  };
  const vertical = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  /**
   * Le point d'un plan vertical (sa normale horizontale `normal`, passant par `through` ; face à la caméra) sous un point
   * de l'écran, avec la pose de la caméra déjà posée.
   */
  const planeUnder = (sx: number, sy: number, through: Vec3, normal: { x: number; z: number }) => {
    pointer.set((sx / viewW) * 2 - 1, -(sy / viewH) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    vertical.normal.set(normal.x, 0, normal.z);
    vertical.constant = -(normal.x * through.x + normal.z * through.z);
    const hit = raycaster.ray.intersectPlane(vertical, ground3);
    return hit ? { x: hit.x, y: hit.y, z: hit.z } : null;
  };
  /**
   * Tourne la pose prévue d'une scénette de `sceneYaw` autour de son point visé, à la même distance et à la même hauteur,
   * relevée seulement au-dessus du sol (`SCENE_TURN`) : les volumes entre elle et la scène s'estompent (`SEE_THROUGH`).
   * À l'angle nul, la pose prévue, telle quelle.
   */
  const turnScenePose = (pose: CameraPose) => {
    if (!sceneYaw) return;
    pose.position = orbitAround(pose.position, pose.target, sceneYaw);
    const floor = ground(pose.position.x, pose.position.z) + SCENE_TURN.clearance;
    if (pose.position.y < floor) pose.position.y = floor;
  };
  const askQuestion = (q: QuestionRequest | null): LabelOnScreen[] => {
    if (!q) {
      if (!asked) return [];
      asked = null;
      reaction = null;
      itemShown = false;
      itemMesh.visible = false;
      reactionMesh.visible = false;
      respond = null;
      itemFacets = null;
      leaveScenette();
      keo.visible = true;
      ring.visible = true;
      setShift({ x: 0, y: 0 });
      // La brume revient près de Kéo, la caméra derrière lui, sans passage.
      fog.near = FOG.near;
      fog.far = FOG.far;
      followStep(focus, aimed(), 0, true);
      follow();
      return [];
    }
    // La pose, la lueur et la caisse qui roule passent par le maillage de la pose : jamais en même temps qu'une scénette.
    finishRide();
    finishLay();
    finishPose();
    endGlow();
    finishAssembly();
    if (remise) {
      remise = null;
      endRemise();
      leaveScenette();
    }
    if (host.clientWidth && host.clientHeight && (host.clientWidth !== viewW || host.clientHeight !== viewH)) resize();
    const { place, layout, item } = q;
    // Au 5e, la Montée seule a sa scénette (GD-22, lot 3) : les missions des autres lieux se jouent sur l'écran habituel.
    if (!hasScenette(place)) return [];
    // Une autre scénette, et chaque nouvel item, repartent de la pose prévue, à son cap de départ (de face, sauf aux
    // Écluses, dans l'axe du canal ; référent dys, consultant UX UI : un élève qui a tourné par mégarde retrouve la scène
    // qui aide à répondre sans refaire le geste).
    const nextItem = `${q.mission}|${item.key ?? JSON.stringify(item.scene)}`;
    const turnBack = scenette !== place || nextItem !== lastItem;
    lastItem = nextItem;
    lastQuestion = q;
    scenetteMission = q.mission;
    walk = null;
    // Une nouvelle question (« Rejouer ») : la lampe rend le maillage de la réaction, le décor de près reprend son état
    // d'avant la réussite.
    unlitReaction();
    if (finaleShown && scenette === place && !item.answered) {
      finale = null;
      finaleShown = false;
      setGeometry(decorMesh, scenetteDecor(place, false, posed, topped));
    }
    // La scénette : Kéo à côté de l'habitant ; la brume reste celle du monde (la caméra est près).
    const entering = scenette !== place;
    if (entering) copyPose(current, descent.from);
    const fromShift = { ...shift };
    enterScenette(place);
    // Le cap de départ se lit une fois la scénette entrée (au Phare, son lieu dépend de ce qui est posé).
    // En entrant, la descente part déjà vers le cap ; à un nouvel item de la même scène, la caméra y glisse en douceur
    // (`sceneReturn`, à partir de l'image suivante), d'un coup avec « Réduire les animations ».
    if (turnBack) {
      const to = scenetteStartYaw(place, posed);
      sceneYaw = startSceneReturn(sceneReturn, sceneYaw, to, performance.now() / 1000, entering || reduceMotion);
    }
    fog.near = FOG.near;
    fog.far = FOG.far;
    const qp = scenettePose(place, layout.scenette.stage, viewW, viewH, posed);
    turnScenePose(qp.pose);
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
    const objectsKey = `${place}|${viewW}x${viewH}|${sceneYaw.toFixed(4)}|${slotFeet.map((o) => `${o.x},${o.y}`).join(';')}`;
    const itemKey = `${JSON.stringify(item.scene)}|${item.right.join(',')}`;
    const spot = sceneSpot(place);
    // Dans une scénette, les cloches pendent devant la rambarde ; les caisses sont posées sur un ponton du bassin ; les
    // paniers et les leviers sur une margelle à terre, à la hauteur du plancher de la scène, relevée si le sol monte
    // devant elle (elle ne s'y enfonce jamais), sa jupe jusqu'au sol.
    // Les cloches pendent dans un plan qui tourne avec la caméra autour de l'axe de la galerie : la poutre reste de face,
    // horizontale, sous la rambarde, sur tout l'arc (directeur artistique, 19 octobre 2026).
    const hang = answersHang(place, posed) ? bellPlane(place, sceneYaw) : null;
    const deck = scenetteDeck(place, posed);
    let deckY = deck.y;
    const pointsAt = (y: number) => slotFeet.map((o) => (hang ? planeUnder(o.x, o.y, hang.through, hang.normal) : groundUnder(o.x, o.y, y)) ?? spot);
    let points = pointsAt(deckY);
    let landBelow: number | undefined;
    if (deck.onLand && !hang) {
      // Relevée, la margelle se rapproche de la caméra : si le sol monte vers elle (le Fanal du 3e, retouche 1), elle
      // s'enfonçait de nouveau ; on la relève jusqu'à ce qu'elle tienne, en quelques pas.
      for (let k = 0; k < DECK_RAISES; k++) {
        const heights = points.flatMap((p) => [-1, 0, 1].flatMap((dx) => [-0.5, 0.5].map((dz) => standingHeight(ground(p.x + dx, p.z + dz)))));
        const top = Math.max(...heights) + 0.05;
        if (top <= deckY) break;
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
    // Le monde qui répond remplace l'objet témoin du C neutre là où il a son objet (la pirogue de la Mangrove reste au
    // repos : deux mouvements à la suite se liraient comme deux réponses, directeur artistique, 30 octobre 2026).
    const witness = item.answered && !(item.scene.kind === 'column' && responds(place));
    const facets = itemScene(
      place,
      item.scene,
      witness,
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
    // Pendant un réglage (GD-26), aucun objet de réponse : trois objets semblables se liraient comme trois choix.
    if (!q.answersOut && !item.dial)
      merged.append(
        facingAnswerObjects(
          place,
          points,
          scale,
          {
            sort: sort ? { ...sort, moving } : undefined,
            // Une cloche choisie se balance jusqu'à la réponse ; une caisse tentée reste penchée.
            picked: hang && item.answered ? [] : item.picked,
            // La bonne caisse est partie au crochet avec la réaction.
            gone: answerLeaves(place) && item.answered ? item.right : [],
            hanging: hang ? { hand: habitantHand(place, posed), rail: hang.rail } : undefined,
            ground: landBelow,
          },
          hang?.pivot ?? spot,
          // Face à la caméra, tournés avec elle : les cloches du Phare, et la rangée d'un lieu qui le demande (les Radeaux).
          hang || placeArt(place)?.answer?.facing ? sceneYaw : 0,
        ),
      );
    // Le geste « régler » (GD-26) : ce que le lieu montre des crans réglés (la lueur de la Forge), dans le même maillage.
    const dialArt = item.dial ? placeArt(place)?.dial : undefined;
    const dialFoot = feet.get(place);
    if (item.dial && dialArt && dialFoot) merged.append(dialArt(dialFoot, item.dial));
    // Le monde qui répond : la scène de l'item, sans ses objets encore ; ils s'y posent une fois la réaction réglée. Un
    // autre item (« Suivant » avant la fin du mouvement ; sa clé, pas sa scène, que deux items peuvent partager) : l'objet
    // en vol se pose d'un coup.
    itemFacets = merged.build();
    if (respond && (respond.place !== place || respond.item !== item.key)) finishRespond();
    if (descent.active) itemMesh.visible = false;
    const before = asked && asked.place === place && asked.itemKey === itemKey ? asked : null;
    const bin = moving !== null && sort ? sort.placed[moving] : null;
    if (sort && moving !== null && bin !== null && points[moving] && points[bin]) {
      // Le maillage de la réaction est repris : l'objet du monde qui répond encore en vol se pose d'un coup (expert frontend).
      finishRespond();
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
      // Le maillage reste à l'objet du monde qui répond s'il est en vol (un cadrage refait pendant la descente).
      if (!respond?.move) reactionMesh.visible = false;
    } else if (!before?.answered || before.objectsKey !== objectsKey) {
      finishRespond();
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
    // Le monde qui répond : les objets déjà posés, avec la scène de l'item ; un cran de plus, le prochain part dans le
    // maillage de la réaction, s'il est libre.
    countResponded(place, q.mission, item.key ?? itemKey, q.responded);
    showResponded();
    itemShown = itemMesh.visible;
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
    fog.near = FOG.near;
    fog.far = FOG.far;
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
    // Le monde qui répond : l'objet en vol se pose ; les objets restent derrière le panneau du bilan, jusqu'à la sortie.
    finishRespond();
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
      lookUp(poseTo, lanternTop, keoFeet, look, viewH, ground);
      if (exit) exitView(poseTo, exit.keep, keoFeet, back, exit.view);
    },
    back: (e) => tween(poseFrom, poseTo, e),
    done: () => {
      follow();
      options.onPosed();
      if (glowNext) startGlow();
      if (restoreNext) startRestore();
    },
  });
  /** Les parties qui arrivent dans un lieu : la pose commence. */
  const startPose = (place: PlaceId, parts: readonly PartShape[]) => {
    // Une pose en cours (deux réussites rapprochées) passe la main sans dire sa fin : seule la dernière la dit.
    poseRun.handOver();
    finishLay();
    endGlow();
    // Une pose qui achevait un lieu, passée la main avant sa fin (deux réussites rapprochées) : son allumage ne se jouera
    // pas, son état se dit tout de suite (jamais perdu : expert frontend, lot 2 du 4e) ; le lieu se dessine restauré.
    if (restoreNext) {
      options.onRestored?.(restoreNext);
      restoreNext = null;
    }
    // La pose qui achève la Montée (ses trois étapes) : la lueur montera le long du rail, une fois, à la fin de la pose.
    const all = placesState?.built[place] ?? [];
    const whole = (list: readonly PartShape[]) => [0, 1, 2].every((st) => stageComplete(list, st as 0 | 1 | 2));
    glowNext = place === 'montee' && whole(all) && !whole(all.filter((p) => !parts.includes(p)));
    // De même, la pose qui achève un lieu qui s'anime à sa restauration (la Forge du 4e), ou qui dit sa réplique de fin
    // (la Soute, le Gabarit : son état et sa réplique, sans animation, `saysRestored`).
    restoreNext = saysRestored(place) && whole(all) && !whole(all.filter((p) => !parts.includes(p))) ? place : null;
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

  // La lueur de la Montée restaurée (GD-22, lot 3 ; intention, § 2) : après la pose qui l'achève, une bande d'ocre, sans
  // ombre, monte une seule fois le long du rail, du zéro au sommet, lentement, dans le maillage de la pose (aucun appel de
  // plus) ; jamais avec « Réduire les animations » (le changement est net : la lanterne allumée). Rien ne clignote.
  let glowNext = false;
  let glowStart: number | null = null;
  const startGlow = () => {
    glowNext = false;
    const foot = feet.get('montee');
    if (reduceMotion || !foot || walk || asked || mapView || laying || carRolling) return;
    setGeometry(poseMesh, monteeGlowBand());
    poseMesh.material = landMaterial;
    poseMesh.visible = true;
    glowStart = performance.now() / 1000;
    stepGlow(glowStart);
  };
  function endGlow() {
    endRestore();
    if (glowStart === null) return;
    glowStart = null;
    poseMesh.visible = false;
    poseMesh.geometry.dispose();
    poseMesh.geometry = new THREE.BufferGeometry();
    poseMesh.material = poseMaterial;
    poseMesh.position.set(0, 0, 0);
  }
  function stepGlow(t: number) {
    if (glowStart === null) return;
    const foot = feet.get('montee');
    const u = (t - glowStart) / MONTEE_GLOW.seconds;
    if (!foot || u >= 1 || walk || asked || mapView) return endGlow();
    const y = MONTEE_GLOW.from + (MONTEE_GLOW.to - MONTEE_GLOW.from - MONTEE_GLOW.height) * Math.max(0, u);
    poseMesh.position.set(foot.x, foot.y + y, foot.z + monteeGlowFront(y + MONTEE_GLOW.height / 2));
  }

  // L'allumage d'un lieu restauré (`PlaceArt.restoration` : la Forge du 4e, lot 2 ; intention, § 6) : après la pose qui
  // l'achève, une seule fois, au plus 4 s, dans le maillage de la pose (aucun appel de plus), refait une vingtaine de fois
  // par seconde ; d'un coup avec « Réduire les animations », sur la Carte, en marche ou pendant une question ; un toucher
  // le passe. La page dit l'état à la fin, ou au toucher qui le passe (`onRestored`, dans `endRestore`) : la voix, la
  // bulle et son icône (référent dys et consultant UX UI, lot 2 du 4e : une chose à la fois) ; tout de suite quand
  // l'allumage ne se joue pas.
  /** Le centre du lieu à son sol, pour son allumage. */
  const restoreAt = (place: PlaceId) => {
    const foot = feet.get(place);
    const center = PLACES.find((q) => q.id === place)?.center;
    return foot && center ? { x: center.x, y: foot.y, z: center.z } : null;
  };
  const startRestore = () => {
    const place = restoreNext;
    restoreNext = null;
    if (!place) return;
    const art = placeArt(place)?.restoration;
    const at = restoreAt(place);
    if (!art || !at || reduceMotion || walk || asked || mapView || laying || carRolling) {
      options.onRestored?.(place);
      return startFinal(place);
    }
    restoring = { place, start: performance.now() / 1000, frame: null };
    placeVisibility();
    poseMesh.material = landMaterial;
    poseMesh.position.set(0, 0, 0);
    poseMesh.visible = true;
    stepRestore(restoring.start);
  };
  function endRestore() {
    if (!restoring) return;
    const { place } = restoring;
    restoring = null;
    poseMesh.visible = false;
    poseMesh.geometry.dispose();
    poseMesh.geometry = new THREE.BufferGeometry();
    poseMesh.material = poseMaterial;
    placeVisibility();
    options.onRestored?.(place);
    startFinal(place);
  }

  // Un script de caméra (world/continu/cameraPath.ts, `CameraScript`) : la vue finale du niveau (`LevelWorld.finalView`,
  // au 3e : GD-25, relecture du Cirque, correction 1), une fois, à la fin de l'allumage de son lieu (la fin des
  // Ferrailleurs, au Fanal restauré) ; ou une veillée (GD-23, GD-27, lot 3 : `playVigil`). La caméra quitte Kéo, suit le
  // script et revient derrière lui à la fin, ou au premier toucher. Ce que la vue finale seule dessine (les archipels au
  // loin) entre dans le maillage de la pose (aucun appel de plus) ; une veillée ne dessine rien. Avec « Réduire les
  // animations », l'image finale, fixe. Jamais sur la Carte ni pendant une question.
  const finalView = world.finalView ?? null;
  let scriptRun: { script: CameraScript; start: number; from: CameraPose; still: boolean; drawn: boolean; done: (() => void) | null; pass: (() => void) | null } | null = null;
  const scriptPose: CameraPose = { position: { x: 0, y: 0, z: 0 }, target: { x: 0, y: 0, z: 0 }, fov: 0, lens: 0 };
  function startScript(script: CameraScript, facets: Facets | null, done: (() => void) | null, pass: (() => void) | null = null): boolean {
    if (scriptRun || asked || mapView || nefTrip) return false;
    finishPose();
    finishLay();
    endGlow();
    walk = null;
    const from: CameraPose = { position: { x: 0, y: 0, z: 0 }, target: { x: 0, y: 0, z: 0 }, fov: 0, lens: 0 };
    copyPose(current, from);
    scriptRun = { script, start: performance.now() / 1000, from, still: reduceMotion, drawn: facets !== null, done, pass };
    if (facets) {
      setGeometry(poseMesh, facets);
      poseMesh.material = landMaterial;
      poseMesh.position.set(0, 0, 0);
    }
    options.onMark(null);
    options.onCameraScript?.(true);
    stepScript(scriptRun.start);
    return true;
  }
  function startFinal(place: PlaceId | null) {
    if (!finalView || (place !== null && place !== finalView.place)) return;
    startScript(finalView, finalView.facets(), null);
  }
  function finishScript() {
    if (!scriptRun) return;
    const { drawn, done } = scriptRun;
    scriptRun = null;
    if (drawn) {
      poseMesh.visible = false;
      poseMesh.geometry.dispose();
      poseMesh.geometry = new THREE.BufferGeometry();
      poseMesh.material = poseMaterial;
    }
    updateRings(true);
    follow();
    options.onCameraScript?.(false);
    done?.();
  }
  function stepScript(t: number) {
    if (!scriptRun) return;
    const u = t - scriptRun.start;
    if (u >= (scriptRun.still ? scriptRun.script.still : scriptRun.script.seconds)) return finishScript();
    const p = scriptRun.script.pose(u, scriptRun.from, scriptPose, scriptRun.still);
    applyPose(p);
    // Les tuiles du sol suivent la caméra et son regard (le cap de la caméra qui suit : 0 vers le nord).
    scriptRings.x = p.position.x;
    scriptRings.z = p.position.z;
    scriptRings.look = Math.atan2(-(p.target.x - p.position.x), -(p.target.z - p.position.z));
    updateRings(false, scriptRun.still, scriptRings);
  }
  const scriptRings = { x: 0, z: 0, look: 0 };
  function stepRestore(t: number) {
    if (!restoring) return;
    const art = placeArt(restoring.place)?.restoration;
    const at = restoreAt(restoring.place);
    const u = t - restoring.start;
    // Les mêmes arrêts que ceux qui empêchent l'allumage de commencer (`startRestore`) : tout allumé d'un coup.
    if (!art || !at || u >= art.seconds || walk || asked || mapView || laying || carRolling) return endRestore();
    // La géométrie ne se refait que si l'image change (une quinzaine de fois en 4 s), jamais à chaque image.
    const frame = art.frame(u);
    if (frame === restoring.frame) return;
    restoring.frame = frame;
    setGeometry(poseMesh, art.draw(at, u));
  }

  // La caisse de la cabine qui roule (GD-22, lot 3) : à son départ, elle quitte les lieux pour le maillage de la pose (ses
  // facettes faites une fois), posée à chaque image sous Kéo, sur la ligne du rail ; la caméra la suit de trois quarts,
  // tournée une fois au départ (`RIDE_YAW`) ; à l'arrivée en haut, tournée vers le Donjon (`arrivalYaw` : il se tient
  // dans le tiers haut de l'image, même s'il n'est pas tout à fait au nord). Le voile de la brume, avec « Réduire les
  // animations ».
  const RIDE_YAW = 0.6;
  const lookedAt = PLACES.find((p) => p.id === 'donjon')?.center ?? null;
  /** Le cap de la caméra qui regarde le Donjon depuis là où se tient Kéo (vers le nord, s'il n'y en a pas). */
  const arrivalYaw = (): number => (lookedAt ? Math.atan2(-(lookedAt.x - here.x), -(lookedAt.z - here.z)) : 0);
  function stepCabin(riding: number | null, veil: number) {
    if (!cabinLand || !cabinSite) return;
    if (veil !== veilShown) {
      veilShown = veil;
      veilEl.style.opacity = String(veil);
    }
    if (riding !== null && !carRolling) {
      finishLay();
      finishPose();
      endGlow();
      carRolling = true;
      carAt = null;
      placeVisibility();
      setGeometry(poseMesh, cabinCarFacets(cabinLand));
      poseMesh.material = landMaterial;
      poseMesh.rotation.y = cabinYaw(cabinSite);
      poseMesh.visible = true;
      turnTo(RIDE_YAW);
    }
    if (!carRolling) return;
    if (riding !== null) {
      const d = (here.x - cabinSite.near.x) * cabinSite.dir.x + (here.z - cabinSite.near.z) * cabinSite.dir.z;
      const stops = cabinStops(cabinSite);
      poseMesh.position.set(here.x, cabinCarFloor(cabinSite, Math.min(stops.top, Math.max(stops.bottom, d))), here.z);
      return;
    }
    // Arrivée : la caisse rejoint les lieux, à la gare d'arrivée.
    carRolling = false;
    poseMesh.visible = false;
    poseMesh.geometry.dispose();
    poseMesh.geometry = new THREE.BufferGeometry();
    poseMesh.material = poseMaterial;
    poseMesh.position.set(0, 0, 0);
    poseMesh.rotation.y = 0;
    carAt = onPlateau(here) ? 'haut' : 'bas';
    placeVisibility();
    if (rideUp) turnTo(arrivalYaw());
  }
  /** La caisse roule, ou le voile de la brume est montré : aucun geste ne fait repartir Kéo (`onUp`, `goTo`, `standAt`). */
  const cabinBusy = (): boolean => carRolling || veilShown > 0;
  /**
   * Finit proprement un trajet de cabine en cours (une question, la Carte) : Kéo au bout de son trajet, la caisse à sa
   * gare, le voile retiré ; rien hors de la caisse.
   */
  function finishRide(): void {
    if (!walk || !cabinBusy()) return;
    const now = performance.now();
    walk = skipWalk(walk, now);
    const state = walkAt(walk, now, reduceMotion);
    here = state.at;
    if (state.heading !== null) heading = state.heading;
    keo.rotation.y = heading;
    placeKeo(here);
    stepCabin(null, 0);
    arrive(walkTarget);
  }
  /**
   * La caisse qui attend à sa gare est-elle sous le toucher (`clientX`, `clientY`) ? Sa boîte projetée, et le disque de
   * 48 px au moins autour d'elle, comme un aménagement (world/continu/toucher.ts) ; jamais derrière la caméra.
   */
  const carTouched = (clientX: number, clientY: number): boolean => {
    if (!cabinLand || carAt === null || closed.includes(cabinLand)) return false;
    const box = cabinCarBox(cabinLand, carAt);
    const points: { x: number; y: number }[] = [];
    for (const x of [box.min[0], box.max[0]])
      for (const y of [box.min[1], box.max[1]])
        for (const z of [box.min[2], box.max[2]]) {
          corner.set(x, y, z).project(camera);
          if (corner.z >= 1) return false;
          points.push({ x: sx(corner), y: sy(corner) });
        }
    const r = renderer.domElement.getBoundingClientRect();
    return touchedObject(clientX - r.left, clientY - r.top, [{ place: 'montee', rect: screenRect(points) }]) !== null;
  };
  /**
   * La caisse touchée : Kéo à sa gare, elle part (comme le bouton « Monter » ou « Descendre ») ; ailleurs, Kéo marche
   * jusqu'à la gare, où le bouton l'attend.
   */
  const touchCar = () => {
    if (!cabinLand || !cabinSite || carAt === null) return;
    if (cabinSide(cabinLand, here) === carAt) return rideCabin();
    startFreeWalk(cabinPoint(cabinSite, carAt === 'bas' ? cabinSite.abut[0] - 2 : cabinSite.abut[1] + 3));
  };
  /** Le trajet du bouton « Monter » ou « Descendre », de la gare où se tient Kéo. */
  function rideCabin(): void {
    if (!cabinLand || walk || asked || mapView || closed.includes(cabinLand)) return;
    const side = cabinSide(cabinLand, here);
    if (!side) return;
    finishLay();
    finishPose();
    finishAssembly();
    walkTarget = null;
    heldBridge = null;
    showFreeMark(null);
    beginWalk(cabinButtonRoute(cabinLand, here, side === 'bas'));
    options.onDepart();
  }
  /**
   * Ce que la page sait de la cabine, dit seulement quand cela change : la gare où Kéo se tient à l'arrêt (le bouton
   * « Monter » au pied, « Descendre » en haut ; rien pendant une marche), et, pendant que la caisse roule, où elle va
   * (l'annonce de l'arrivée).
   */
  function reportCabin() {
    if (!cabinLand) return;
    const riding = cabinBusy() && rideUp !== null ? (rideUp ? 'haut' : 'bas') : null;
    const side = riding || walk || closed.includes(cabinLand) ? null : cabinSide(cabinLand, here);
    const k = `${side}|${riding}`;
    if (k === cabinTold) return;
    cabinTold = k;
    options.onCabin?.({ side, riding });
  }
  /** Le temps de la Nef qui arrive : ses parties nouvelles descendent sur le ber, de haut, et ralentissent en arrivant. */
  const startNefDrop = (from: NefLook, to: NefLook) => {
    const f = nefModel(nefArrivingParts(from, to, nefSite.temps));
    if (!f) return;
    const at = nefSite.berth;
    nefDrop = { start: performance.now() / 1000, from, to };
    setGeometry(nefMesh, f);
    nefMesh.position.set(at.x, nefSite.lift.ber + POSE_DROP, at.z);
    nefMesh.rotation.y = at.yaw;
  };
  const finishNefDrop = () => {
    if (!nefDrop) return;
    nefDrop = null;
    nefMesh.visible = false;
    placeVisibility();
  };
  const stepNefDrop = (t: number) => {
    if (!nefDrop) return;
    const u = Math.min(1, (t - nefDrop.start) / NEF_DROP_SECONDS);
    nefMesh.position.y = nefSite.lift.ber + POSE_DROP * (1 - u) ** 3;
    if (u >= 1) finishNefDrop();
  };
  /** La parure qui arrive (au 3e) : elle descend sur l'aéronef, de haut, et ralentit en arrivant, comme un temps de la Nef. */
  const startParuresDrop = (from: number, to: number) => {
    const f = paruresOf(from, to);
    if (!f) return;
    const at = nefSite.berth;
    paruresDrop = { start: performance.now() / 1000, from };
    setGeometry(nefMesh, f);
    nefMesh.position.set(at.x, nefSite.lift.ber + POSE_DROP, at.z);
    nefMesh.rotation.y = at.yaw;
  };
  const finishParuresDrop = () => {
    if (!paruresDrop) return;
    paruresDrop = null;
    nefMesh.visible = false;
    placeVisibility();
  };
  const stepParuresDrop = (t: number) => {
    if (!paruresDrop) return;
    const u = Math.min(1, (t - paruresDrop.start) / NEF_DROP_SECONDS);
    nefMesh.position.y = nefSite.lift.ber + POSE_DROP * (1 - u) ** 3;
    if (u >= 1) finishParuresDrop();
  };
  /** Le départ de la Nef : elle et son obstacle dans leurs maillages à part, le temps du voyage ; la caméra ne bouge pas. */
  const startNefTrip = (done: () => void) => {
    finishNefDrop();
    // Le maillage de la pose (une pose, un pont, la lueur, la caisse qui roule) se ferme : jamais en même temps (budget).
    finishRide();
    finishLay();
    finishPose();
    endGlow();
    const f = nefModel(nefShownParts(3, nefSite.temps));
    if (reduceMotion || mapView || !f) {
      nefLookNow = 4;
      placeVisibility();
      done();
      return;
    }
    nefTrip = { start: performance.now() / 1000, done, outSince: null, farSince: null };
    setGeometry(nefMesh, f);
    // La brèche (5e) : ses sommets glissent dans une copie (l'obstacle de la Nef reste tel quel, en cache) ; la boîte
    // englobante s'élargit de l'ouverture la plus grande, l'élimination hors champ reste juste.
    setGeometry(bancMesh, nefSides ? { ...nefBanc, positions: nefBanc.positions.slice() } : nefBanc);
    if (nefSides) {
      const wide = nefSite.flight(1, flight).open;
      const g = bancMesh.geometry;
      g.boundingBox?.min.setX(g.boundingBox.min.x - wide);
      g.boundingBox?.max.setX(g.boundingBox.max.x + wide);
      if (g.boundingSphere) g.boundingSphere.radius += wide;
    }
    stepNefTrip(nefTrip.start);
    placeVisibility();
  };
  /** La Nef partie : le ber vide et sa bouée, le banc levé ; la page passe à la suite (la grille, en 5e). */
  const finishNefTrip = () => {
    const trip = nefTrip;
    if (!trip) return;
    nefTrip = null;
    nefMesh.visible = false;
    bancMesh.visible = false;
    bancMesh.position.set(0, 0, 0);
    nefLookNow = 4;
    placeVisibility();
    fitNefSite();
    trip.done();
  };
  const stepNefTrip = (t: number) => {
    if (!nefTrip) return;
    const u = Math.min(1, (t - nefTrip.start) / nefSite.seconds);
    const at = nefSite.flight(u, flight);
    nefMesh.position.set(at.x, at.y, at.z);
    nefMesh.rotation.y = at.yaw;
    bancMesh.position.set(at.shiftX, 0, at.shiftZ);
    if (nefSides) {
      const pos = bancMesh.geometry.getAttribute('position') as THREE.BufferAttribute;
      const base = nefBanc.positions;
      const arr = pos.array as Float32Array;
      for (let i = 0; i < nefSides.length; i++) arr[3 * i] = base[3 * i] + nefSides[i] * at.open;
      pos.needsUpdate = true;
    }
    // Sortie de l'image (le haut du mât ou de l'enveloppe compris), ou si loin qu'elle n'est plus qu'un point : elle
    // finit son départ peu après, mais jamais avant que son obstacle soit ouvert (au 5e, la brèche).
    nefSeen.set(at.x, at.y + 2, at.z);
    const far = nefSeen.distanceTo(camera.position) > nefSite.pointBeyond;
    nefSeen.project(camera);
    const out = nefSeen.z > 1 || Math.abs(nefSeen.x) > 1.15 || Math.abs(nefSeen.y) > 1.15;
    if (!out) nefTrip.outSince = null;
    else nefTrip.outSince ??= t;
    if (!far) nefTrip.farSince = null;
    else nefTrip.farSince ??= t;
    const long = (since: number | null) => since !== null && t - since >= nefSite.outOfView;
    const gone = long(nefTrip.outSince) || long(nefTrip.farSince);
    if (u >= 1 || (gone && u >= nefSite.obstacleDone)) finishNefTrip();
  };
  const setPlaces = (state: PlacesState, pose?: { place: PlaceId; parts: readonly PartShape[] }): boolean => {
    placesState = state;
    // La livraison écrite (l'état final de la remise) : l'aménagement entre dans les lieux, son maillage à part se cache.
    if (remiseRun.active && remise && placesState.amenagements?.[remise.place]?.includes(remise.extra ?? '')) remiseMesh.visible = false;
    // Au 5e, seule la Montée se bâtit (GD-22, lot 3) : les autres lieux restent des ruines, rien ne s'y pose.
    if (pose?.parts.length && !asked && !mapView && hasScenette(pose.place)) {
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
    fitNefSite();
    fitArrival();
    // La taille a changé : le décalage se repose sur la nouvelle taille (la page redonne la place d'une question).
    appliedShift.x = Number.NaN;
    if (mapView) {
      const first = mapView === mapFirst;
      mapFar = 0;
      mapView = first ? mapStart(plan, aspect()) : clampMap(plan, mapView, aspect());
      mapFirst = first ? mapView : null;
      // L'écran a changé de taille avant tout toucher : la vue de départ se choisit de nouveau, avant de se dessiner.
      if (first) mapSettling = MAP_SETTLE_FRAMES;
      showMap();
    } else if (remise && !asked) refitRemise();
    else applyPose(asked ? asked.pose : pose);
  };
  const observer = new ResizeObserver(resize);
  observer.observe(host);

  /** Le retour au cap de départ à l'instant `t` (en secondes) : l'angle avance, la scène se refait à cette image. */
  const advanceSceneReturn = (t: number) => {
    if (!sceneReturn.active) return;
    if (!asked || !scenette) {
      sceneReturn.active = false;
      return;
    }
    const y = stepSceneReturn(sceneReturn, t);
    if (y === null) return;
    sceneYaw = y;
    sceneTurnPending = true;
  };
  // La boucle d'image : la marche, la caméra qui suit, la marque (quelques petits objets par image : la place de Kéo, la marque).
  let frame = 0;
  let last = performance.now();
  let slowFrames = 0;
  // La finesse qui descend d'un cran quand l'appareil peine longtemps (./resolution.ts).
  const resolution = createResolution(renderer.getPixelRatio(), last);
  let movedAt = 0;
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
    const finer = resolution.frame(now - last, now);
    if (finer !== null && finer < renderer.getPixelRatio()) {
      renderer.setPixelRatio(finer);
      // Le canevas refait s'efface : la Carte, dessinée à la demande, se redessine aussitôt.
      mapDirty = true;
    }
    const dt = Math.max(0, Math.min(0.1, (now - last) / 1000));
    last = now;
    const t = now / 1000;
    stepNefDrop(t);
    stepParuresDrop(t);
    advanceSceneReturn(t);
    // La caméra tournée pendant une scénette : la scène se refait une fois par image au plus, et ses repères suivent.
    if (sceneTurnPending) {
      sceneTurnPending = false;
      if (lastQuestion && asked && scenette) {
        const labels = askQuestion(lastQuestion);
        updateRings();
        for (const l of sceneTurnListeners) l(labels);
      }
    }
    // Les ailes de la pompe à vent tournent lentement ; à l'arrêt avec « Réduire les animations ».
    if (!reduceMotion) vaneAngle.value = (t * VANE.turn) % (2 * Math.PI);
    // Le rotor de la Turbine tourne lentement, à l'arrêt pendant toute question et sur la Carte (il reprend où il s'était
    // arrêté).
    if (!reduceMotion && !asked && !scenette && !mapView) rotorAngle.value = (rotorAngle.value + dt * ROTOR.turn) % (2 * Math.PI);
    // Le geste du métier : seulement quand le monde est calme et Kéo arrêté (référent dys) ; sinon l'outil au repos.
    if (walk || carRolling) keoMovedAt = now;
    // Le monde est calme : rien ne se joue (ni question, ni scénette, ni Carte, ni script, ni voyage de la Nef, ni pose,
    // ni remise, ni assemblage, ni trajet, ni voile, ni retenue de la page), et sans « Réduire les animations ».
    const worldIsCalm = !reduceMotion && !asked && !scenette && !mapView && !scriptRun && !nefTrip && !poseRun.active && !remise && !assembly && !walk && !carRolling && !gesteHeld && veilShown === 0;
    stepGestes(t, now, worldIsCalm);
    let moving = false;
    if (walk) {
      const state = walkAt(walk, now, reduceMotion);
      here = state.at;
      moving = state.moving;
      if (state.heading !== null) heading = state.heading;
      stepCabin(state.riding, state.veil);
      if (!state.moving) arrive(walkTarget);
    } else if (carRolling || veilShown) stepCabin(null, 0);
    if (cabinLand) reportCabin();
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
      stepRespond(t);
      stepFinale(t);
      stepLamp(t);
      if (scenette) body.bouger(t, dt, false, reduceMotion, WALK_CADENCE);
      options.onMark(null);
      hideLocks();
      seeScene();
      renderer.render(scene, camera);
      see.on.value = 0;
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
    if (scriptRun) {
      // La vue finale ou une veillée : la caméra suit son script, Kéo attend où il est ; ni marque ni cadenas.
      stepScript(t);
      body.bouger(t, dt, false, reduceMotion, WALK_CADENCE);
      options.onMark(null);
      hideLocks();
      renderer.render(scene, camera);
      meter?.tick(renderer.info, now);
      return;
    }
    if (nefTrip) {
      // Le départ de la Nef : la caméra ne bouge pas, Kéo attend où il est ; ni marque ni cadenas.
      stepNefTrip(t);
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
    if (moving) movedAt = now;
    else if (now - movedAt > UPLOAD_STILL_MS) uploads.step();
    stepDetour(now, moving, dt);
    // La caméra rattrape Kéo hors de sa zone morte, et monte si le relief le cache ; arrêté près du Phare, elle lève
    // le regard vers la lanterne (jamais pendant la marche).
    stepTurn(now);
    followStep(focus, aimed(), dt, reduceMotion);
    lift = liftStep(lift, occlusionLift(focus, ground, yaw), dt, reduceMotion);
    if (fifth) stepHold(dt);
    if (colLand && colRoofOpen(colLand, here) !== colOpen) {
      colOpen = !colOpen;
      placeVisibility();
    }
    stepGlow(t);
    stepRestore(t);
    look = lookUpStep(look, nearLantern() ? 1 : 0, dt, reduceMotion);
    arrivalBack = lookUpStep(arrivalBack, arrivalNow || quayArrival ? 1 : 0, dt, reduceMotion);
    if (back > 0 && !atExit()) back = reduceMotion ? 0 : Math.max(0, back - dt / EXIT_VIEW.down);
    if (back === 0) exit = null;
    if (nefSheet) nefSheetView = detourViewStep(nefSheetView, nefSheetWanted() ? 1 : 0, dt, reduceMotion);
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
      if (cabinBusy()) return;
      manualView = null;
      finishLay();
      finishPose();
      finishAssembly();
      setMap(null);
      if (jump) jumpTo(place);
      else startWalkTo(atNode(placeById(place).door), place);
    },
    skip: () => {
      if (!walk) return;
      // Dans la caisse : elle finit son trajet proprement, Kéo au bout du sien (« Passer le trajet »).
      if (cabinBusy()) return finishRide();
      walk = skipWalk(walk, performance.now());
    },
    ride: () => rideCabin(),
    view: (at) => {
      manualView = at ? { position: { ...at.position }, target: { ...at.target }, fov: at.fov ?? pose.fov, lens: 0 } : null;
      follow();
    },
    standAt: (p) => {
      if (mapView || asked || cabinBusy() || !isWalkable(grid(), p, walkClosed)) return;
      manualView = null;
      walk = null;
      doorArrival = null;
      doorArrivalView = 0;
      here = { x: p.x, z: p.z };
      placeKeo(here);
      followStep(focus, aimed(), 0, true);
      lift = occlusionLift(focus, ground, yaw);
      updateRings(true, true);
      follow();
      arrive(null);
    },
    turn: (step) => {
      if (mapView || asked || scenette || remise) return;
      manualView = null;
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
    onSceneTurn: (listener) => {
      sceneTurnListeners.add(listener);
      return () => void sceneTurnListeners.delete(listener);
    },
    map: setMap,
    reframeMap: reframeStart,
    holdGestes: (on) => {
      gesteHeld = on;
    },
    scenetteEnd,
    setPlaces,
    remiseView: (place) => remiseView(place),
    remise: playRemise,
    remiseStart,
    remiseFinish,
    setSigns,
    setNef: (look) => {
      if (look === nefLookNow || nefTrip) return;
      const from = nefLookNow;
      finishNefDrop();
      nefLookNow = look;
      // Le premier temps dit (l'ouverture) se montre tel quel ; les suivants descendent sur le ber.
      const first = !nefKnown;
      nefKnown = true;
      if (!first && !reduceMotion && !mapView && look !== 4 && look > from) startNefDrop(from, look);
      placeVisibility();
    },
    setParures: (look) => {
      if (!departure.parures) return;
      const first = !paruresKnown;
      paruresKnown = true;
      if (look === paruresNow) return;
      const from = paruresNow;
      finishParuresDrop();
      paruresNow = look;
      // Rien ne descend à l'ouverture, sur la Carte, pendant une question ou une scénette, ni en reculant.
      if (!first && !reduceMotion && !mapView && !asked && !scenette && look > from) startParuresDrop(from, look);
      placeVisibility();
    },
    playFinal: () => startFinal(null),
    playVigil: (vigil, done, pass) => startScript(vigilScript(vigil), null, done, pass ?? null),
    endScript: () => finishScript(),
    departNef: (done) => {
      if (nefTrip || nefLookNow === 4) return done();
      startNefTrip(done);
    },
    setDetours: (found, lit) => {
      if (found.join(',') === detoursFound.join(',') && lit.join(',') === detoursLit.join(',')) return;
      detoursFound = [...found];
      detoursLit = [...lit];
      placeVisibility();
      mapDirty = true;
    },
    info: () => ({ calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, mapMs }),
    portAt: (clientX: number, clientY: number) => {
      const p = hitAt(clientX, clientY);
      if (p && options.onNef && (nefSite.touched(p) || nefSite.obstacleTouched(p))) return 'nef';
      return p ? portTouch(p, site) : null;
    },
    dispose: () => {
      disposed = true;
      uploads.clear();
      sceneTurnListeners.clear();
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
      worldHabitants.dispose();
      equipiers.dispose();
      for (const g of geometries) g.dispose();
      for (const m of [itemMesh, reactionMesh, placesMesh, landmarkMesh, poseMesh, remiseMesh, veilMesh, decorMesh, nefMesh, bancMesh, gestesMesh]) m.geometry.dispose();
      lampMaterial.dispose();
      poseMaterial.dispose();
      faunaMaterial.dispose();
      nearRing.dispose();
      farRing.dispose();
      landMaterial.dispose();
      volumeMaterial.dispose();
      groundMaterial.dispose();
      veilMaterial.dispose();
      seaMaterial.dispose();
      seaTexture.dispose();
      skyMaterial.dispose();
      ringMaterial.dispose();
      shadowMaterial.dispose();
      silhouetteMaterial.dispose();
      meter?.dispose();
      veilEl.remove();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
