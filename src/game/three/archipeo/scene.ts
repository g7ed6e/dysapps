// La scène du monde continu (prototype du monde ouvert d'Archipéo, 6e, piste B « chemins aimantés ») : le terrain en
// tuiles, la mer et le lagon, les chemins, les quatre lieux, Kéo ; le toucher qui l'envoie au point du chemin le plus
// proche, sa marche ; la marque de la prochaine mission, donnée à la page à chaque image. Piste 1, lot 1 : l'île
// agrandie, la caméra qui suit Kéo (world/continu/camera.ts), le terrain rassemblé en deux anneaux autour de lui (de
// près, de loin), la brume au loin et sur les lieux pas encore ouverts, d'où ne dépasse que le lieu suivant.
// Chargée à la demande avec la page (./OpenWorldPage.tsx), seulement derrière le drapeau `?monde=ouvert`
// (../../worldLayoutFactory.tsx). Tout ce qui se calcule sans Three.js est dans world/continu/.
import * as THREE from 'three';
import { loadKeo } from '../../importedCharacters';
import { loadedKeo } from '../../world/characters/imported/keo';
import { cielDe } from '../../world/palette';
import { LOOK_UP, MARK_LIFT, WORLD_FOG, followPose, followStep, liftStep, lookUp, lookUpStep, markBeside, markOffset, occlusionLift, type CameraPose } from '../../world/continu/camera';
import { constructionFacets, POSE_DROP, POSE_SECONDS, poseView, ruinFacets, stageComplete, TRACE_STAGE, WHOLE, type PartShape } from '../../world/continu/construction';
import { FacetBuilder, mergeFacets, type Facets } from '../../world/continu/facets';
import { distance, type Vec2, type Vec3 } from '../../world/continu/geometry';
import { clampMap, mapPose, mapStart, panMap, zoomMap, type MapView } from '../../world/continu/map';
import { UNVEIL_DISTANCE, distanceSign, markOnScreen, type MarkOnScreen } from '../../world/continu/mission';
import { atNode, findRoute, pathNode, pathRibbons, snapToNetwork, startOf } from '../../world/continu/paths';
import { PLACES, TERRAIN, placeById, type PlaceId } from '../../world/continu/plan6e';
import { modelOfPlace } from '../../world/continu/places';
import { answerObjects, answerScale, itemScene, placeTrace, sceneSpot, type Reaction } from '../../world/continu/questionScene';
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
  scenetteFinale,
  scenetteHidesPieces,
  scenetteHidesPlace,
  scenetteKeo,
  scenettePose,
  scenetteSuccess,
  type ScenetteFinale,
  type ScenetteLayout,
} from '../../world/continu/scenette';
import { SEA_TEXTURE, seaPixels } from '../../world/continu/sea';
import { buildHeightField, heightOnMesh, standingHeight, tileRings } from '../../world/continu/terrain';
import { createTileStore, type Tile } from '../../world/continu/tiles';
import { MIST_COLOR, VEIL_HEIGHT, veilFacets, type VeilMesh } from '../../world/continu/veil';
import { WALK_CADENCE, skipWalk, startWalk, walkAt, type Walk } from '../../world/continu/walk';
import { corpsDuBonhomme, type CorpsDuBonhomme } from '../paintedCharacters';
import { createMeter } from '../meter';

/** Ce que la page donne à la scène. */
export interface OpenWorldOptions {
  /** Le lieu où Kéo se tient au départ. */
  start: PlaceId;
  /** « Réduire les animations » : Kéo arrive tout de suite, la caméra le suit d'un bloc. */
  reduceMotion: boolean;
  /** Kéo est arrivé : devant un lieu qu'on lui a demandé (`place`), ou sur un point du chemin (`null`). */
  onArrive(place: PlaceId | null): void;
  /** Kéo part (la page change « Y aller » en « Passer le trajet »). */
  onDepart(): void;
  /** La place de la marque de la prochaine mission à l'écran, à chaque image (`null` : pas de marque). */
  onMark(mark: MarkOnScreen | null): void;
  /**
   * La place à l'écran du cadenas de chaque lieu sous la brume, à chaque image (la même liste, remplie sur place ;
   * refaite quand la brume change). Aucun pendant une question.
   */
  onLocks(locks: readonly LockOnScreen[]): void;
  /** La Carte ouverte : la place à l'écran de chaque lieu, à chaque image (la même liste, remplie sur place). */
  onMapPlaces(spots: readonly MapSpotOnScreen[]): void;
  /** Sur la Carte, un lieu touché dans la 3D (ouvert, la page ferme la Carte et y dépose Kéo ; fermé, elle le dit). */
  onMapPick(place: PlaceId): void;
  /** Montrer le compteur de mesures (`?mesures`) ; `expose` : le laisser lire aux scripts. */
  meter: { show: boolean; expose: boolean };
  /** La pose d'une partie est finie (posée, la caméra revenue à Kéo, ou passée) : les célébrations peuvent venir. */
  onPosed(): void;
}

export interface OpenWorld {
  /**
   * Envoie Kéo devant un lieu : en marchant (le toucher d'un lieu), ou d'un coup (`jump`, « Y aller » : le trajet est
   * toujours sauté, il dure trente secondes dans l'île agrandie).
   */
  goTo(place: PlaceId, jump?: boolean): void;
  /** Saute le trajet en cours : Kéo est arrivé. */
  skip(): void;
  /** Le lieu marqué (la prochaine mission), ou aucun : le seul lieu qui dépasse la brume. */
  setMark(place: PlaceId | null): void;
  /** Les lieux sous la brume (world/continu/mission.ts, `veiledPlaces`) ; la scène lève celle des lieux que Kéo approche. */
  setVeiled(places: readonly PlaceId[]): void;
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
  /** Les chiffres de la dernière image : appels de dessin et triangles (captures, mesures). */
  info(): { calls: number; triangles: number; mapMs: number };
  dispose(): void;
}

/** Ce que les lieux montrent : les parties posées de leur construction, et si la trace de leur scénette se voit. */
interface PlacesState {
  built: Readonly<Record<PlaceId, readonly PartShape[]>>;
  traces: Readonly<Record<PlaceId, boolean>>;
}

/** Une question à montrer : le lieu, la place à l'écran, l'item (sa scène, s'il a sa réponse, les rangs des bonnes réponses). */
interface QuestionRequest {
  place: PlaceId;
  layout: ScenetteLayout;
  item: { scene: ItemScene; answered: boolean; right: readonly number[]; picked: readonly number[] };
}

/** Le cadenas d'un lieu sous la brume, à l'écran : en pixels, et s'il se voit. */
export interface LockOnScreen {
  place: PlaceId;
  x: number;
  y: number;
  shown: boolean;
}

/** Sur la Carte, un lieu ou Kéo (`keo`) à l'écran : son point (le bas de son étiquette), en pixels, et s'il se voit. */
export interface MapSpotOnScreen {
  id: PlaceId | 'keo';
  x: number;
  y: number;
  shown: boolean;
}

/** Un repère de la scène à l'écran, en pixels. */
export interface LabelOnScreen {
  text: string;
  x: number;
  y: number;
}

/** La marge de la flèche au bord de l'écran, en pixels : hors des boutons des coins. */
const MARK_MARGIN = 56;
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
 * La finesse du rendu : l'anticrénelage reste (la scène est légère, quelques milliers de triangles) ; le rapport de
 * pixels est plafonné à 2, puis ramené à 1 si l'appareil peine (des images de plus de 45 ms, trente de suite), comme
 * le monde en grille (../loop.ts).
 */
const SLOW_FRAME_MS = 45;
const SLOW_FRAMES = 30;
/** Les anneaux du terrain se refont quand le point suivi s'est éloigné de tant d'unités de leur centre. */
const RING_MOVE = 3;
/** Le lever de la brume d'un lieu : un fondu court, en secondes (d'un bloc avec « Réduire les animations »). */
const VEIL_FADE_SECONDS = 0.8;
/**
 * La réussite d'une scénette posée (les Quais, les Filets, les Écluses) : l'objet qui va à sa place (la caisse dans la
 * barque, le panier plein, la barque qui passe la porte), puis la lumière (la lanterne de proue des Quais) ; 1,5 s en
 * tout.
 */
const FINALE_MOVE_SECONDS = 0.8;
const FINALE_LAMP_SECONDS = 0.7;
/** La lampe du Phare qui s'allume à la réussite : de la vitre éteinte à la lumière, en un fondu (fixe avec « Réduire les animations »). */
const LAMP_SECONDS = 1.2;
/**
 * La partie qui descend, éclaircie (une lueur ajoutée à son matériau) : on la distingue d'un coup d'œil de ce qui est
 * déjà posé ; posée, elle reprend les couleurs du lieu.
 */
const POSE_GLOW = 0x4a4232;
/** Toutes les parties d'un lieu : le lieu entier, pendant sa scénette. */
const WHOLE_PARTS: readonly PartShape[] = [WHOLE];
/** Le cadenas d'un lieu se tient au bord de l'écran de tant de pixels au moins, sinon il ne se montre pas. */
const LOCK_MARGIN = 24;
/** À gauche, le cadenas se tient hors de la bande de la colonne des accès directs (72 px), sa moitié comprise. */
const LOCK_LEFT = 72 + LOCK_MARGIN;
/** Le cadenas se pose de tant d'unités au-dessus du banc de brume. */
const LOCK_LIFT = 1;
/** Le bout de la caméra qui suit Kéo, et celui de la Carte (l'île entière, de haut), en unités. */
const FOLLOW_FAR = 500;
const MAP_FAR = 2000;
/** Sur la Carte, la brume du lointain commence au-delà de l'île : rien ne s'y efface (sans refaire les shaders). */
const MAP_FOG = 5000;
/** Sur la Carte, un toucher choisit le lieu le plus proche à moins de tant de pixels. */
const MAP_TOUCH = 56;
/** Les tuiles de la Carte faites au repos : sans `requestIdleCallback`, une tranche de tant de ms tous les tant de ms. */
const IDLE_SLICE_MS = 6;
const IDLE_DELAY_MS = 40;
/** Sur la Carte, un lieu ne se montre qu'à tant de pixels des bords gauche et droit, et du haut (son nom au-dessus). */
const MAP_LABEL_SIDE = 100;
const MAP_LABEL_TOP = 64;

/** Une géométrie à facettes (positions, normales, couleurs de sommet), sa boîte englobante juste. */
/** Le plus haut point d'un maillage (−∞ s'il est vide). */
function topOf(f: Facets): number {
  let top = -Infinity;
  for (let k = 1; k < f.positions.length; k += 3) top = Math.max(top, f.positions[k]);
  return top;
}

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
  // La brume légère d'Archipéo : le lointain, le large et l'horizon s'y fondent ; le ciel est de sa couleur.
  const mist = new THREE.Color(MIST_COLOR);
  scene.background = mist;
  const fog = new THREE.Fog(mist, WORLD_FOG.near, WORLD_FOG.far);
  scene.fog = fog;
  const camera = new THREE.PerspectiveCamera(40, host.clientWidth / Math.max(1, host.clientHeight), 0.5, FOLLOW_FAR);

  // La lumière d'un matin clair (fiche du 6e, § 2) : le soleil du 6e, bas à l'est, et une ambiance chaude, renvoyée par
  // le sable : les aplats gardent leur couleur sur les faces tournées vers la caméra (au sud).
  const ciel = cielDe('6e', 1);
  scene.add(new THREE.HemisphereLight(0xf4f1e8, 0xa89a7c, 1.5));
  const sun = new THREE.DirectionalLight(ciel.soleil, 1.9);
  sun.position.set(40, 55, 30);
  scene.add(sun);

  const geometries: THREE.BufferGeometry[] = [];
  const keep = <G extends THREE.BufferGeometry>(g: G) => (geometries.push(g), g);

  // Le terrain : la carte de hauteurs, et deux anneaux de tuiles autour de Kéo (de près, chaque case ; de loin, une
  // sur trois), chacun un seul maillage, d'un seul matériau.
  const field = buildHeightField();
  const ground = (x: number, z: number) => heightOnMesh(field, x, z);
  const landMaterial = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
  // Le lieu suivant n'est pas pris dans la brume : de loin, c'est lui qu'on voit.
  const landmarkMaterial = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, fog: false });
  const tiles = createTileStore(field);
  const nearRing = new RingMesh(landMaterial, 9000);
  const farRing = new RingMesh(landMaterial, 6000);
  scene.add(nearRing.mesh, farRing.mesh);
  const touchables: THREE.Object3D[] = [nearRing.mesh, farRing.mesh];

  // La mer et le lagon : un plan d'eau à 0, peint par l'image de l'eau ; au-delà, le bord de l'image (le large).
  const seaTexture = new THREE.DataTexture(seaPixels(), SEA_TEXTURE.size, SEA_TEXTURE.size);
  seaTexture.colorSpace = THREE.SRGBColorSpace;
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
  const seaMaterial = new THREE.MeshBasicMaterial({ map: seaTexture });
  const sea = still(new THREE.Mesh(seaGeometry, seaMaterial));
  scene.add(sea);
  touchables.push(sea);

  // Les chemins : sentiers, digue et pontons, un seul maillage.
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
    ruins.set(place.id, ruinFacets(place.id, ground));
    ruinTops.set(place.id, topOf(ruins.get(place.id)!));
    feet.set(place.id, new THREE.Vector3(place.center.x, y, place.center.z));
  }
  // La marque de la prochaine mission, au-dessus du lieu tel qu'il est bâti (sa ruine, puis plus haut à chaque étape) ;
  // au Phare entier, à côté de la lanterne. Le haut de la lanterne, que le regard levé cadre près du Phare, suit aussi.
  const marks = new Map<PlaceId, THREE.Vector3>();
  for (const [id, foot] of feet) {
    const o = markOffset(id);
    marks.set(id, new THREE.Vector3(foot.x + o.x, foot.y + o.y, foot.z + o.z));
  }
  const phare = placeById('phare');
  const lanternTop: Vec3 = { x: phare.center.x, y: feet.get('phare')!.y + modelOfPlace('phare').top, z: phare.center.z };
  /** La hauteur bâtie de chaque lieu, au-dessus de son pied (le lieu entier tant que la page n'a rien dit). */
  const builtTop = new Map<PlaceId, number>();
  const whole = (id: PlaceId) => (builtTop.get(id) ?? modelOfPlace(id).top) >= modelOfPlace(id).top - 0.5;
  /** Reporte la hauteur bâtie d'un lieu sur sa marque (et, au Phare, sur le haut que le regard levé cadre). */
  const setBuiltTop = (id: PlaceId, top: number) => {
    if (builtTop.get(id) === top) return;
    builtTop.set(id, top);
    const foot = feet.get(id)!;
    const o = markOffset(id);
    const mark = marks.get(id)!;
    if (whole(id)) mark.set(foot.x + o.x, foot.y + o.y, foot.z + o.z);
    else mark.set(foot.x, foot.y + top + MARK_LIFT, foot.z);
    if (id === 'phare') lanternTop.y = foot.y + top;
  };
  const placesMesh = still(new THREE.Mesh(new THREE.BufferGeometry(), landMaterial));
  const landmarkMesh = still(new THREE.Mesh(new THREE.BufferGeometry(), landmarkMaterial));
  const poseMaterial = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, fog: false, emissive: POSE_GLOW });
  const poseMesh = new THREE.Mesh(new THREE.BufferGeometry(), poseMaterial);
  placesMesh.visible = false;
  landmarkMesh.visible = false;
  poseMesh.visible = false;
  scene.add(placesMesh, landmarkMesh, poseMesh);
  touchables.push(placesMesh, landmarkMesh);

  // La brume sur les lieux pas encore ouverts : un seul maillage, refait quand la liste change (jamais par image) ; sans
  // lumière, de la couleur du lointain, transparente par sommet (dense en bas, effacée en haut et sur ses bords). Le banc
  // d'un lieu qui se lève passe le temps de son fondu dans un second maillage (un appel de plus, moins d'une seconde).
  const veilMaterial = veilMaterialOf();
  const fadeMaterial = veilMaterialOf();
  const veilMesh = still(new THREE.Mesh(new THREE.BufferGeometry(), veilMaterial));
  const fadeMesh = still(new THREE.Mesh(new THREE.BufferGeometry(), fadeMaterial));
  veilMesh.visible = false;
  fadeMesh.visible = false;
  // Après le reste : elle se pose par-dessus ce qu'elle voile.
  veilMesh.renderOrder = 1;
  fadeMesh.renderOrder = 1;
  scene.add(veilMesh, fadeMesh);
  let fadeStart = 0;
  const setVeilGeometry = (mesh: THREE.Mesh, v: VeilMesh) => {
    mesh.geometry.dispose();
    mesh.geometry = veilGeometry(v);
    mesh.visible = v.triangles > 0;
  };
  let veiled: readonly PlaceId[] = [];
  const approached = new Set<PlaceId>();
  let veilKey = '';

  // Kéo : le corps du bonhomme d'Archipéo (sa marche existante), son anneau clair au sol ; habillé dès que sa tenue est chargée.
  const keo = new THREE.Group();
  scene.add(keo);
  let body: CorpsDuBonhomme = corpsDuBonhomme('6e');
  keo.add(body.mesh);
  let disposed = false;
  if (!loadedKeo('6e'))
    void loadKeo('6e').then(() => {
      if (disposed || !loadedKeo('6e')) return;
      body.dispose();
      body = corpsDuBonhomme('6e');
      keo.add(body.mesh);
      mapDirty = true;
    });
  keo.scale.setScalar(KEO_SCALE);
  const ringGeometry = keep(new THREE.RingGeometry(KEO_RING.inner, KEO_RING.outer, 24).rotateX(-Math.PI / 2));
  const ringMaterial = new THREE.MeshBasicMaterial({ color: KEO_RING.color, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
  const ring = new THREE.Mesh(ringGeometry, ringMaterial);
  scene.add(ring);

  // Où est Kéo, où il va.
  // Au départ, sur le chemin, à quelques pas du lieu (on voit le Phare de plus loin que sa porte).
  let here: Vec2 = startOf(placeById(options.start).door, placeById(options.start).center).at;
  let walk: Walk | null = null;
  let walkTarget: PlaceId | null = null;
  let heading = FACING_CAMERA;
  keo.rotation.y = FACING_CAMERA;
  const keoFeet: Vec3 = { x: here.x, y: 0, z: here.z };
  const placeKeo = (p: Vec2) => {
    const y = standingHeight(ground(p.x, p.z));
    keo.position.set(p.x, y, p.z);
    ring.position.set(p.x, y + 0.02, p.z);
    keoFeet.x = p.x;
    keoFeet.y = y;
    keoFeet.z = p.z;
  };
  placeKeo(here);

  // La caméra suit un point lissé (`focus`), monté de `lift` quand le relief cache Kéo ; une seule pose, remplie sur place.
  const focus: Vec3 = { ...keoFeet };
  let lift = occlusionLift(focus, ground);
  const pose: CameraPose = followPose(focus, lift);
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
  const nearLantern = () => !walk && distance(here, phare.center) < LOOK_UP.within;
  let look = nearLantern() ? 1 : 0;
  // Le retour d'une scénette (aux Quais) : Kéo reste sur le bord du quai, la caméra garde la barque chargée dans le
  // champ (`back`, de 0 à 1) tant qu'il ne repart pas ; elle rejoint alors la caméra qui suit.
  let exit: ReturnType<typeof scenetteExit> = null;
  let back = 0;
  const atExit = () => !walk && exit !== null && distance(here, exit.at) < 0.05;
  const follow = () => {
    followPose(focus, lift, pose);
    lookUp(pose, lanternTop, keoFeet, look, viewH);
    if (exit) exitView(pose, exit.keep, keoFeet, back);
    applyPose(pose);
  };
  follow();

  // Les anneaux du terrain, et les lieux qu'on dessine : refaits quand le point suivi s'éloigne de leur centre.
  let markPlace: PlaceId | null = null;
  // La Carte ouverte : sa pose (plus bas, « La Carte des lieux ouverts »).
  let mapView: MapView | null = null;
  const ringCenter = { x: Number.NaN, z: Number.NaN };
  let ringKey = '';
  // La scénette où se tient Kéo (plus bas, « La scénette d'un lieu »).
  let scenette: PlaceId | null = null;
  // La Carte ne se redessine que si sa vue, la taille, la brume ou ce qu'elle montre change (expert frontend).
  let mapDirty = false;
  // Ce que montrent les lieux (la page le donne), et les parties retenues le temps d'une pose (elles descendent à part).
  let placesState: PlacesState | null = null;
  let holding: { place: PlaceId; parts: readonly PartShape[] } | null = null;
  const builds = new Map<PlaceId, { parts: readonly PartShape[]; lit: boolean; facets: Facets }>();
  const traceFacets = new Map<string, Facets>();
  /** Les parties posées d'un lieu, sans celles qu'une pose retient (elles descendent à part). */
  const posedOf = (id: PlaceId): readonly PartShape[] => {
    const all = placesState?.built[id] ?? [];
    // `includes` compare par référence : les tranches viennent du cache de `partShapes` (constructionParts.ts), les
    // mêmes objets d'une lecture de la sauvegarde à l'autre.
    return holding?.place === id ? all.filter((s) => !holding!.parts.includes(s)) : all;
  };
  /**
   * La construction posée d'un lieu : refaite seulement si ses parties ou sa lanterne changent. Pendant sa scénette, le
   * lieu se montre entier (la galerie du Phare, les murs du sas : la scénette s'y tient), sa lanterne comme dehors.
   */
  const buildOf = (id: PlaceId, parts: readonly PartShape[]): Facets => {
    const lit = stageComplete(parts, 1);
    const shown = scenette === id ? WHOLE_PARTS : parts;
    const known = builds.get(id);
    if (known && known.lit === lit && known.parts.length === shown.length && known.parts.every((s, i) => s === shown[i])) return known.facets;
    const facets = constructionFacets(id, shown, ground, lit);
    builds.set(id, { parts: shown, lit, facets });
    return facets;
  };
  const traceOf = (id: PlaceId, done: boolean): Facets => {
    const k = `${id}|${done}`;
    let f = traceFacets.get(k);
    if (!f) traceFacets.set(k, (f = placeTrace(id, done)));
    return f;
  };
  let placesKey = '';
  /**
   * Refait le maillage des lieux si ce qu'il montre a changé : le lieu suivi à part (sauf sur la Carte), la maquette des
   * Quais et les traces cachées pendant leur scénette (la scénette a les siennes), les parties retenues par une pose.
   */
  const placeVisibility = () => {
    const landmark = mapView ? null : markPlace;
    const hiddenModel = scenette && scenetteHidesPlace(scenette) ? scenette : null;
    const hiddenTrace = scenette && scenetteHidesPieces(scenette) ? scenette : null;
    const k = `${landmark}|${scenette}|${hiddenModel}|${hiddenTrace}|${placesState ? PLACES.map((p) => `${JSON.stringify(placesState!.built[p.id])}${placesState!.traces[p.id] ? 't' : ''}`).join(',') : ''}|${holding ? `${holding.place}${holding.parts.length}` : ''}`;
    if (k === placesKey) return;
    placesKey = k;
    const rest: Facets[] = [];
    const mark: Facets[] = [];
    for (const p of PLACES) {
      const list = p.id === landmark ? mark : rest;
      const parts = posedOf(p.id);
      const build = buildOf(p.id, parts);
      if (p.id !== hiddenModel) list.push(ruins.get(p.id)!, build);
      if (scenette !== p.id) setBuiltTop(p.id, Math.max(ruinTops.get(p.id)!, topOf(build)) - feet.get(p.id)!.y);
      // La trace attend que l'étape qui la porte soit posée (le lieu est entier pendant sa scénette) : avant, rien, pas
      // même la porte d'amont fermée des Écluses (elle est de leur haut).
      const carried = scenette === p.id || stageComplete(parts, TRACE_STAGE[p.id]);
      if (p.id !== hiddenTrace && carried) list.push(traceOf(p.id, placesState?.traces[p.id] ?? false));
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
    if (!force && Math.hypot(focus.x - ringCenter.x, focus.z - ringCenter.z) < RING_MOVE) return;
    ringCenter.x = focus.x;
    ringCenter.z = focus.z;
    const rings = tileRings(ringCenter, WORLD_FOG.far);
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

  // La brume des lieux : ceux que la page donne, moins ceux que Kéo a approchés ; refaite si la liste change.
  let shown: readonly PlaceId[] = [];
  const updateVeil = () => {
    const ids = veiled.filter((id) => !approached.has(id));
    const k = ids.join(',');
    if (k === veilKey) return;
    veilKey = k;
    // Les bancs qui se lèvent (Kéo approche, la mission devient la prochaine) s'effacent en un fondu court.
    const lifted = shown.filter((id) => !ids.includes(id));
    shown = ids;
    setLocks(ids);
    setVeilGeometry(veilMesh, veilFacets(ids));
    if (lifted.length && !reduceMotion) {
      setVeilGeometry(fadeMesh, veilFacets(lifted));
      fadeMaterial.opacity = 1;
      fadeStart = performance.now() / 1000;
    }
  };
  /** Le fondu du banc qui se lève, à l'instant `t` (en secondes) ; fini, son maillage s'éteint. */
  const fadeVeil = (t: number) => {
    if (!fadeMesh.visible) return;
    const u = Math.min(1, (t - fadeStart) / VEIL_FADE_SECONDS);
    fadeMaterial.opacity = 1 - u;
    if (u >= 1) fadeMesh.visible = false;
  };
  const approach = () => {
    let changed = false;
    for (const id of veiled)
      if (!approached.has(id) && distance(here, placeById(id).center) < UNVEIL_DISTANCE) {
        approached.add(id);
        changed = true;
      }
    if (changed) updateVeil();
  };

  // La marque de la prochaine mission : au-dessus du lieu, ou au bord, avec la distance en signe.
  const projected = new THREE.Vector3();
  const reportMark = () => {
    const mark = markPlace ? marks.get(markPlace) : undefined;
    if (!mark || !markPlace) return options.onMark(null);
    projected.copy(mark).project(camera);
    const far = distanceSign(here, placeById(markPlace).center);
    options.onMark(
      markOnScreen({ x: ((projected.x + 1) / 2) * viewW, y: ((1 - projected.y) / 2) * viewH, behind: projected.z > 1 }, viewW, viewH, MARK_MARGIN, far, markBeside(markPlace) && whole(markPlace)),
    );
  };

  // Les cadenas des lieux sous la brume : leur point (au-dessus du lieu), refaits quand la brume change ; leur place à
  // l'écran remplie sur place à chaque image.
  let locks: LockOnScreen[] = [];
  const lockPoints: THREE.Vector3[] = [];
  const setLocks = (ids: readonly PlaceId[]) => {
    locks = ids.map((place) => ({ place, x: 0, y: 0, shown: false }));
    lockPoints.length = 0;
    // Au-dessus du banc de brume (ou du haut du lieu, s'il est plus bas).
    for (const id of ids) {
      const foot = feet.get(id) ?? new THREE.Vector3();
      lockPoints.push(new THREE.Vector3(foot.x, foot.y + Math.min(modelOfPlace(id).top, VEIL_HEIGHT) + LOCK_LIFT, foot.z));
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
        distance(here, placeById(l.place).center) < WORLD_FOG.far &&
        l.x > LOCK_LEFT &&
        l.x < viewW - LOCK_MARGIN &&
        l.y > LOCK_MARGIN &&
        l.y < viewH - LOCK_MARGIN;
    }
    options.onLocks(locks);
  };
  const hideLocks = () => {
    let any = false;
    for (const l of locks) {
      any ||= l.shown;
      l.shown = false;
    }
    if (any) options.onLocks(locks);
  };

  const arrive = (place: PlaceId | null) => {
    walk = null;
    startPrebuild();
    approach();
    options.onArrive(place);
  };
  const startWalkTo = (to: ReturnType<typeof snapToNetwork>, place: PlaceId | null) => {
    const from = snapToNetwork(here);
    const route = findRoute(from, to);
    // Kéo hors du chemin (sur le bord du quai, au retour d'une scénette) : il le rejoint d'abord.
    if (distance(here, from.at) > 0.05) route.unshift(here);
    walkTarget = place;
    if (route.length < 2 || distance(route[0], route[route.length - 1]) < 0.05) return arrive(place);
    walk = startWalk(route, performance.now());
    options.onDepart();
  };
  /** Kéo d'un coup devant un lieu : la caméra le suit d'un bloc (une coupe, jamais un long travelling). */
  const jumpTo = (place: PlaceId) => {
    here = pathNode(placeById(place).door).at;
    heading = FACING_CAMERA;
    exit = null;
    back = 0;
    keo.rotation.y = FACING_CAMERA;
    placeKeo(here);
    followStep(focus, keoFeet, 0, true);
    lift = occlusionLift(focus, ground);
    updateRings(true, true);
    approach();
    follow();
    arrive(place);
  };

  // Le toucher : un lieu touché y envoie Kéo ; ailleurs (sol, eau), au point du chemin le plus proche.
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let down: { x: number; y: number; t: number } | null = null;
  const onDown = (e: PointerEvent) => {
    if (mapView) return mapDown(e);
    down = { x: e.clientX, y: e.clientY, t: performance.now() };
  };
  const onCancel = (e: PointerEvent) => {
    down = null;
    fingers.delete(e.pointerId);
  };
  const onUp = (e: PointerEvent) => {
    const d = down;
    down = null;
    if (mapView) return mapUp(e, d);
    // Un toucher pendant une pose la passe : la partie est à sa place, la caméra revient à Kéo.
    if (posing) return finishPose();
    if (asked || !d || Math.hypot(e.clientX - d.x, e.clientY - d.y) > TAP.pixels || performance.now() - d.t > TAP.ms) return;
    const r = renderer.domElement.getBoundingClientRect();
    pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(touchables, false)[0];
    if (!hit) return;
    const p = { x: hit.point.x, z: hit.point.z };
    // Un lieu : Kéo va à sa porte.
    const touched = PLACES.find((pl) => distance(p, pl.center) <= pl.touchRadius)?.id;
    if (touched) startWalkTo(atNode(placeById(touched).door), touched);
    else startWalkTo(snapToNetwork(p), null);
  };
  renderer.domElement.addEventListener('pointerdown', onDown);
  renderer.domElement.addEventListener('pointerup', onUp);
  renderer.domElement.addEventListener('pointercancel', onCancel);

  // La Carte des lieux ouverts (lot 3) : l'île entière, de haut ; les tuiles de loin de toute l'île dans l'anneau de
  // loin (un seul maillage, le même appel), celui de près vidé ; la brume du lointain repoussée au-delà de l'île, celle
  // des lieux fermés gardée. Un doigt la fait glisser, deux la pincent, la molette la zoome (comme la Carte du monde en
  // grille) ; un toucher près d'un lieu le choisit. Fermée, les anneaux autour de Kéo reviennent.
  const mapCamera: CameraPose = { position: { x: 0, y: 0, z: 0 }, target: { x: 0, y: 0, z: 0 }, fov: 0, lens: 0 };
  const allTiles = Array.from({ length: TERRAIN.tilesX * TERRAIN.tilesZ }, (_, i) => i);
  const mapSpots: MapSpotOnScreen[] = [...PLACES.map((p) => ({ id: p.id, x: 0, y: 0, shown: false })), { id: 'keo' as const, x: 0, y: 0, shown: false }];
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
  const reportMapPlaces = () => {
    for (const l of mapSpots) {
      const mark = l.id === 'keo' ? keoPoint.set(keoFeet.x, keoFeet.y, keoFeet.z) : marks.get(l.id);
      if (!mark) continue;
      projected.copy(mark).project(camera);
      l.x = ((projected.x + 1) / 2) * viewW;
      l.y = ((1 - projected.y) / 2) * viewH;
      // Le nom d'un lieu, centré au-dessus de lui, reste entier à l'écran : assez loin des bords gauche et droit.
      l.shown = projected.z < 1 && l.x > MAP_LABEL_SIDE && l.x < viewW - MAP_LABEL_SIDE && l.y > MAP_LABEL_TOP && l.y < viewH - LOCK_MARGIN;
    }
    options.onMapPlaces(mapSpots);
  };
  const setMap = (open: readonly PlaceId[] | null) => {
    if (open && asked) return;
    if (open) {
      const t0 = performance.now();
      finishPose();
      // Kéo s'arrête où il est : la Carte n'est pas un trajet.
      if (walk) arrive(null);
      if (!mapView) mapView = mapStart(aspect());
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
    fingers.clear();
    pinch = null;
    for (const l of mapSpots) l.shown = false;
    options.onMapPlaces(mapSpots);
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
  const startPrebuild = () => {
    if (idleStarted || disposed) return;
    idleStarted = true;
    idleQueue.push(...allTiles);
    idleHandle = requestIdle(prebuildFar);
  };
  const mapDown = (e: PointerEvent) => {
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
    if (!mapView || !finger) return;
    const before = { x: finger.x, y: finger.y };
    finger.x = e.clientX;
    finger.y = e.clientY;
    if (pinch && fingers.size >= 2) {
      const [a, b] = [...fingers.values()];
      const gap = Math.max(1, Math.hypot(b.x - a.x, b.y - a.y));
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      const at = mapGround(mx, my);
      if (at) mapView = zoomMap(mapView, gap / pinch.gap, at, aspect());
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
    mapView = panMap(mapView, a.x - b.x, a.z - b.z, aspect());
    showMap();
  };
  const mapUp = (e: PointerEvent, d: { x: number; y: number; t: number } | null) => {
    fingers.delete(e.pointerId);
    if (fingers.size < 2) pinch = null;
    if (!d || Math.hypot(e.clientX - d.x, e.clientY - d.y) > TAP.pixels || performance.now() - d.t > TAP.ms) return;
    // Le lieu le plus proche du toucher, à l'écran (la page ouvre un lieu ouvert, dit qu'un lieu fermé l'est) (le doigt n'a pas à viser le modèle, petit de si haut).
    const r = renderer.domElement.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    let best: PlaceId | null = null;
    let bestD: number = MAP_TOUCH;
    for (const l of mapSpots) {
      if (l.id === 'keo') continue;
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
    if (!at) return;
    mapView = zoomMap(mapView, factor, at, aspect());
    showMap();
  };
  renderer.domElement.addEventListener('pointermove', onMove);
  renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

  // La question posée dans un lieu (lot 4) : sa pose fixe, la scène de l'item et les objets des réponses (un maillage),
  // la réaction (un maillage qui bouge une à deux secondes). Refaits par item, jamais par image.
  let asked: { place: PlaceId; pose: CameraPose; objectsKey: string; itemKey: string; answered: boolean; scene: ItemScene; scale: number } | null = null;
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
    const u = reduceMotion ? 1 : Math.min(1, (t - start) / REACTION_SECONDS);
    const e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
    reactionMesh.position.set(r.from.x + (r.to.x - r.from.x) * e, r.from.y + (r.to.y - r.from.y) * e + r.arc * Math.sin(Math.PI * e), r.from.z + (r.to.z - r.from.z) * e);
    if (u >= 1) {
      // Avec « Réduire les animations », la réaction est un état fixe : elle reste à sa fin.
      reactionMesh.visible = r.stay || reduceMotion;
      reaction = null;
    }
  };
  // La scénette d'un lieu (lot 2) : le décor de près (la galerie, sa rambarde, l'habitant), fait à l'arrivée et libéré
  // au départ, un seul maillage ; la lampe de la réussite, dessinée par le maillage de la réaction (les cloches sont
  // effacées à ce moment-là) avec un matériau sans lumière : aucun appel de plus ; la descente de la caméra, courte
  // (coupe franche avec « Réduire les animations »).
  const decorMesh = still(new THREE.Mesh(new THREE.BufferGeometry(), landMaterial));
  decorMesh.visible = false;
  scene.add(decorMesh);
  const lampMaterial = new THREE.MeshBasicMaterial({ color: LANTERN.off });
  const lampOff = new THREE.Color(LANTERN.off);
  const lampOn = new THREE.Color(LANTERN.on);
  let lampLit = false;
  let lampStart: number | null = null;
  // Le fondu de la lampe : celle du Phare, ou la lanterne de proue des Quais, plus courte (elle suit la descente).
  let lampSeconds: number = LAMP_SECONDS;
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
    const u = reduceMotion ? 1 : Math.min(1, (t - lampStart) / lampSeconds);
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
  /** Entre dans la scénette d'un lieu : le décor de près, Kéo à sa place dans la galerie, sans son anneau. */
  const enterScenette = (place: PlaceId) => {
    if (scenette === place) return;
    scenette = place;
    setGeometry(decorMesh, scenetteDecor(place));
    // Aux Quais, la maquette du lieu (sa grue, son hangar) s'efface : le quai de la scénette a les siens. La trace de
    // la scénette aussi, sauf au Phare : la trace de la réussite (la barque chargée, le panier plein, la porte ouverte)
    // n'est pas dessinée deux fois.
    placeVisibility();
    const k = scenetteKeo(place);
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
    keo.scale.setScalar(KEO_SCALE);
    // Aux Quais, Kéo reste sur le bord du quai, face à la caméra, qui garde la barque chargée (d'un coup, comme tout
    // retour de question).
    const ex = scenetteExit(left);
    if (ex) {
      here = { ...ex.at };
      heading = FACING_CAMERA;
      exit = ex;
      back = 1;
    }
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
      followStep(focus, keoFeet, 0, true);
      follow();
      return [];
    }
    finishPose();
    if (host.clientWidth && host.clientHeight && (host.clientWidth !== viewW || host.clientHeight !== viewH)) resize();
    const { place, layout, item } = q;
    walk = null;
    // Une nouvelle question (« Rejouer ») : la lampe rend le maillage de la réaction, le décor de près reprend son état
    // d'avant la réussite.
    unlitReaction();
    if (finaleShown && scenette === place && !item.answered) {
      finale = null;
      finaleShown = false;
      setGeometry(decorMesh, scenetteDecor(place));
    }
    // La scénette : Kéo à côté de l'habitant ; la brume reste celle du monde (la caméra est près).
    const entering = scenette !== place;
    if (entering) copyPose(current, descent.from);
    const fromShift = { ...shift };
    enterScenette(place);
    fog.near = WORLD_FOG.near;
    fog.far = WORLD_FOG.far;
    const qp = scenettePose(place, layout.scenette.stage, viewW, viewH);
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
    const hang = answersHang(place) ? bellPlane(place) : null;
    const deck = scenetteDeck(place);
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
    );
    // La scène de l'item et les objets des réponses : un seul maillage.
    const merged = new FacetBuilder();
    merged.append(facets.still);
    merged.append(
      answerObjects(place, points, scale, {
        // Une cloche choisie se balance jusqu'à la réponse ; une caisse tentée reste penchée.
        picked: hang && item.answered ? [] : item.picked,
        // La bonne caisse est partie au crochet avec la réaction.
        gone: answerLeaves(place) && item.answered ? item.right : [],
        hanging: hang ? { hand: habitantHand(place), rail: hang.rail } : undefined,
        ground: landBelow,
      }),
    );
    setGeometry(itemMesh, merged.build());
    itemShown = itemMesh.visible;
    if (descent.active) itemMesh.visible = false;
    const before = asked && asked.place === place && asked.itemKey === itemKey ? asked : null;
    if (!item.answered || !facets.reaction) {
      reaction = null;
      reactionMesh.visible = false;
    } else if (!before?.answered || before.objectsKey !== objectsKey) {
      setGeometry(reactionMesh, facets.reaction.facets);
      // La réaction joue au moment de la réponse ; un changement de taille la pose tout de suite à sa fin.
      reaction = { r: facets.reaction, start: before?.answered ? -Infinity : performance.now() / 1000 };
      placeReaction(performance.now() / 1000);
    }
    asked = { place, pose: qp.pose, objectsKey, itemKey, answered: item.answered, scene: item.scene, scale };
    const labels = facets.labels.map((l) => {
      projected.set(l.at.x, l.at.y, l.at.z).project(camera);
      return { text: l.text, x: ((projected.x + 1) / 2) * viewW, y: ((1 - projected.y) / 2) * viewH };
    });
    if (descent.active) {
      // La descente en cours garde sa place : elle reprend du point où elle était.
      appliedShift.x = Number.NaN;
      stepDescent(performance.now() / 1000);
    }
    return labels;
  };
  const scenetteEnd = (lit: boolean) => {
    if (!asked || !scenette) return;
    // Une scénette posée (les Quais, les Filets, les Écluses) : la scène reste ; à la réussite, le décor change, un
    // objet va à sa place, puis une lumière s'allume (environ 1,5 s ; l'état final tout de suite avec « Réduire les
    // animations »).
    if (!answersHang(scenette)) {
      if (!lit || finaleShown) return;
      const f = scenetteFinale(scenette, asked.scene, asked.scale);
      if (!f) return;
      finaleShown = true;
      setGeometry(decorMesh, f.decor);
      if (f.clearsItem) {
        itemShown = false;
        itemMesh.visible = false;
      }
      const from = reactionMesh.visible ? reactionMesh.position.clone() : new THREE.Vector3(f.from.x, f.from.y, f.from.z);
      reaction = null;
      setGeometry(reactionMesh, f.moving);
      finale = { from, start: performance.now() / 1000, f };
      stepFinale(finale.start);
      return;
    }
    itemShown = false;
    itemMesh.visible = false;
    reactionMesh.visible = false;
    reaction = null;
    const light = lit && !lampLit ? scenetteSuccess(scenette) : null;
    if (!light) return;
    lampLit = true;
    setGeometry(reactionMesh, light);
    reactionMesh.material = lampMaterial;
    reactionMesh.position.set(0, 0, 0);
    lampMaterial.color.copy(lampOff);
    lampSeconds = LAMP_SECONDS;
    lampStart = performance.now() / 1000;
    stepLamp(lampStart);
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
    lampSeconds = FINALE_LAMP_SECONDS;
    lampMaterial.color.copy(lampOff);
    lampStart = t;
    stepLamp(t);
  };

  // La pose d'une partie (GD-20, lot 1), après le bilan : la caméra va vers le lieu, du côté de sa porte (`rise`), la
  // partie descend à sa place (`drop`, dans son maillage à part, plus claire), on la regarde (`look`), puis la caméra
  // rejoint Kéo (`back`). Avec « Réduire les animations », la partie est posée d'un coup, la caméra coupe sur le lieu
  // puis revient (`still`).
  // Un toucher, « Y aller », la Carte ou une question la finissent.
  type PosePhase = 'rise' | 'drop' | 'look' | 'back' | 'still';
  const poseFrom: CameraPose = { position: { x: 0, y: 0, z: 0 }, target: { x: 0, y: 0, z: 0 }, fov: 0, lens: 0 };
  const poseTo: CameraPose = { position: { x: 0, y: 0, z: 0 }, target: { x: 0, y: 0, z: 0 }, fov: 0, lens: 0 };
  let posing: { place: PlaceId; phase: PosePhase; start: number } | null = null;
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
  /** Les parties qui arrivent dans un lieu : la pose commence. */
  const startPose = (place: PlaceId, parts: readonly PartShape[]) => {
    finishPose();
    holding = { place, parts };
    placeVisibility();
    setGeometry(poseMesh, constructionFacets(place, parts, ground));
    poseMesh.visible = false;
    copyPose(current, poseFrom);
    poseView(place, ground, poseTo);
    const t = performance.now() / 1000;
    if (reduceMotion) {
      landPose();
      applyPose(poseTo);
      posing = { place, phase: 'still', start: t };
    } else posing = { place, phase: 'rise', start: t };
  };
  /** Finit la pose tout de suite : la partie posée, la caméra derrière Kéo (une coupe). */
  const finishPose = () => {
    if (!posing) return;
    posing = null;
    landPose();
    follow();
    options.onPosed();
  };
  /** La pose à l'instant `t` (en secondes). */
  const stepPose = (t: number) => {
    if (!posing) return;
    const u = Math.min(1, (t - posing.start) / POSE_SECONDS[posing.phase]);
    const smooth = u * u * (3 - 2 * u);
    switch (posing.phase) {
      case 'rise':
        tween(poseFrom, poseTo, smooth);
        if (u >= 1) {
          posing = { ...posing, phase: 'drop', start: t };
          poseMesh.position.y = POSE_DROP;
          poseMesh.visible = true;
        }
        return;
      case 'drop':
        // Elle descend, de haut (on la voit au-dessus de sa place), et ralentit en arrivant (rien ne rebondit).
        poseMesh.position.y = POSE_DROP * (1 - smooth);
        if (u >= 1) {
          landPose();
          posing = { ...posing, phase: 'look', start: t };
        }
        return;
      case 'look':
        if (u >= 1) {
          copyPose(current, poseFrom);
          followPose(focus, lift, poseTo);
          lookUp(poseTo, lanternTop, keoFeet, look, viewH);
          if (exit) exitView(poseTo, exit.keep, keoFeet, back);
          posing = { ...posing, phase: 'back', start: t };
        }
        return;
      case 'back':
        tween(poseFrom, poseTo, smooth);
        if (u >= 1) finishPose();
        return;
      case 'still':
        if (u >= 1) finishPose();
        return;
    }
  };
  const setPlaces = (state: PlacesState, pose?: { place: PlaceId; parts: readonly PartShape[] }): boolean => {
    placesState = state;
    if (pose?.parts.length && !asked && !mapView) {
      startPose(pose.place, pose.parts);
      return true;
    }
    placeVisibility();
    return false;
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
      mapView = clampMap(mapView, aspect());
      showMap();
    } else applyPose(asked ? asked.pose : pose);
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
    let moving = false;
    if (walk) {
      const state = walkAt(walk, now, reduceMotion);
      here = state.at;
      moving = state.moving;
      if (state.heading !== null) heading = state.heading;
      if (!state.moving) arrive(walkTarget);
    }
    // Le banc qui se lève finit son fondu, même si une question s'ouvre à l'arrivée.
    // Un banc qui finit de se lever redessine la Carte jusqu'à sa dernière image.
    if (fadeMesh.visible) mapDirty = true;
    fadeVeil(t);
    if (mapView) {
      // La Carte : rien ne bouge que ce que les doigts font glisser ; les lieux à l'écran, pour leurs étiquettes.
      if (mapDirty) {
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
    if (posing) {
      // Une pose : la caméra va vers la maison et en revient, Kéo attend où il est ; ni marque ni cadenas.
      stepPose(t);
      body.bouger(t, dt, false, reduceMotion, WALK_CADENCE);
      options.onMark(null);
      hideLocks();
      renderer.render(scene, camera);
      meter?.tick(renderer.info, now);
      return;
    }
    placeKeo(here);
    // Il se tourne vers son cap en douceur, par le plus court (d'un coup avec « Réduire les animations »).
    const turn = Math.atan2(Math.sin(heading - keo.rotation.y), Math.cos(heading - keo.rotation.y));
    keo.rotation.y += reduceMotion ? turn : turn * Math.min(1, dt * 12);
    body.bouger(t, dt, moving, reduceMotion, WALK_CADENCE);
    // La caméra rattrape Kéo hors de sa zone morte, et monte si le relief le cache ; arrêté près du Phare, elle lève
    // le regard vers la lanterne (jamais pendant la marche).
    followStep(focus, keoFeet, dt, reduceMotion);
    lift = liftStep(lift, occlusionLift(focus, ground), dt, reduceMotion);
    look = lookUpStep(look, nearLantern() ? 1 : 0, dt, reduceMotion);
    if (back > 0 && !atExit()) back = reduceMotion ? 0 : Math.max(0, back - dt / EXIT_VIEW.down);
    if (back === 0) exit = null;
    follow();
    updateRings();
    // Une tuile de près au plus par image : la suivante de la file, puis l'anneau de près refait avec elle.
    if (tiles.pump() !== null) setNear(false);
    if (moving) approach();
    reportMark();
    reportLocks();
    renderer.render(scene, camera);
    meter?.tick(renderer.info, now);
  };
  loop();
  // L'arrivée dans le monde : les tuiles de la Carte se préparent au repos.
  startPrebuild();

  return {
    goTo: (place, jump = false) => {
      finishPose();
      setMap(null);
      if (jump) jumpTo(place);
      else startWalkTo(atNode(placeById(place).door), place);
    },
    skip: () => {
      if (!walk) return;
      walk = skipWalk(walk, performance.now());
    },
    setMark: (place) => {
      if (place === markPlace) return;
      markPlace = place;
      placeVisibility();
      mapDirty = true;
    },
    setVeiled: (places) => {
      veiled = places;
      approach();
      updateVeil();
      mapDirty = true;
    },
    question: askQuestion,
    map: setMap,
    scenetteEnd,
    setPlaces,
    info: () => ({ calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, mapMs }),
    dispose: () => {
      disposed = true;
      cancelAnimationFrame(frame);
      if (idleHandle) cancelIdle(idleHandle);
      observer.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onDown);
      renderer.domElement.removeEventListener('pointerup', onUp);
      renderer.domElement.removeEventListener('pointercancel', onCancel);
      renderer.domElement.removeEventListener('pointermove', onMove);
      renderer.domElement.removeEventListener('wheel', onWheel);
      body.dispose();
      for (const g of geometries) g.dispose();
      for (const m of [itemMesh, reactionMesh, placesMesh, landmarkMesh, poseMesh, veilMesh, fadeMesh, decorMesh]) m.geometry.dispose();
      lampMaterial.dispose();
      poseMaterial.dispose();
      nearRing.dispose();
      farRing.dispose();
      landMaterial.dispose();
      landmarkMaterial.dispose();
      veilMaterial.dispose();
      fadeMaterial.dispose();
      seaMaterial.dispose();
      seaTexture.dispose();
      ringMaterial.dispose();
      meter?.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
