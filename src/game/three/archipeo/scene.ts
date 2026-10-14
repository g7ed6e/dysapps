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
import { WORLD_FOG, followPose, followStep, liftStep, markOffset, occlusionLift, type CameraPose } from '../../world/continu/camera';
import { FacetBuilder, type Facets } from '../../world/continu/facets';
import { distance, type Vec2, type Vec3 } from '../../world/continu/geometry';
import { UNVEIL_DISTANCE, distanceSign, markOnScreen, type MarkOnScreen } from '../../world/continu/mission';
import { atNode, findRoute, pathNode, pathRibbons, snapToNetwork, startOf } from '../../world/continu/paths';
import { PLACES, placeById, type PlaceId } from '../../world/continu/plan6e';
import { modelOfPlace } from '../../world/continu/places';
import { answerObjects, answerScale, itemScene, placePieces, questionPose, sceneSpot, veilleurPiece, type QuestionLayout, type Reaction } from '../../world/continu/questionScene';
import { REACTION_SECONDS, veilleurAwake, type ItemScene } from '../../world/continu/questions';
import { SEA_TEXTURE, seaPixels } from '../../world/continu/sea';
import { buildHeightField, heightOnMesh, standingHeight, tileRings } from '../../world/continu/terrain';
import { createTileStore, type Tile } from '../../world/continu/tiles';
import { MIST_COLOR, veilFacets, type VeilMesh } from '../../world/continu/veil';
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
  /** Montrer le compteur de mesures (`?mesures`) ; `expose` : le laisser lire aux scripts. */
  meter: { show: boolean; expose: boolean };
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
  /** Les pièces durables de chaque lieu remises en marche (0, 1 ou 2), tirées des étoiles gardées. */
  setPieces(counts: Readonly<Record<PlaceId, number>>): void;
  /** Les chiffres de la dernière image : appels de dessin et triangles (captures, mesures). */
  info(): { calls: number; triangles: number };
  dispose(): void;
}

/** Une question à montrer : le lieu, la place à l'écran, l'item (sa scène, s'il a sa réponse, les rangs des bonnes réponses). */
interface QuestionRequest {
  place: PlaceId;
  layout: QuestionLayout;
  item: { scene: ItemScene; answered: boolean; right: readonly number[] };
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
/** Au-delà du bout de la brume, de tant d'unités, un lieu n'est plus dessiné (sauf le lieu suivant). */
const PLACE_BEYOND_FOG = 10;
/** Le lever de la brume d'un lieu : un fondu court, en secondes (d'un bloc avec « Réduire les animations »). */
const VEIL_FADE_SECONDS = 0.8;

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
  const camera = new THREE.PerspectiveCamera(40, host.clientWidth / Math.max(1, host.clientHeight), 0.5, 500);

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

  // Les lieux : un maillage chacun (un modèle TRELLIS le remplacera, lieu par lieu), posés sur le sol à leur centre.
  const feet = new Map<PlaceId, THREE.Vector3>();
  const placeMeshes = new Map<PlaceId, THREE.Mesh>();
  for (const place of PLACES) {
    const model = modelOfPlace(place.id);
    const y = standingHeight(ground(place.center.x, place.center.z));
    const mesh = new THREE.Mesh(keep(geometryOf(model.facets)), landMaterial);
    mesh.position.set(place.center.x, y, place.center.z);
    mesh.rotation.y = place.yaw;
    mesh.userData.place = place.id;
    scene.add(still(mesh));
    touchables.push(mesh);
    placeMeshes.set(place.id, mesh);
    feet.set(place.id, new THREE.Vector3(place.center.x, y, place.center.z));
  }

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
  let appliedShift = { x: 0, y: 0 };
  let shift = { x: 0, y: 0 };
  const applyPose = (p: CameraPose) => {
    camera.position.set(p.position.x, p.position.y, p.position.z);
    camera.up.set(0, 1, 0);
    camera.lookAt(p.target.x, p.target.y, p.target.z);
    if (p.fov !== camera.fov) {
      // Le champ change (une question, son retour) : la projection est refaite, avec le décalage.
      camera.fov = p.fov;
      appliedShift = { x: Number.NaN, y: Number.NaN };
    }
    const x = shift.x;
    const y = shift.y;
    if (x === appliedShift.x && y === appliedShift.y) return;
    appliedShift = { x, y };
    // Les deux refont la projection.
    if (x === 0 && y === 0) camera.clearViewOffset();
    else camera.setViewOffset(viewW, viewH, x, y, viewW, viewH);
  };
  const follow = () => applyPose(followPose(focus, lift, pose));
  follow();

  // Les anneaux du terrain, et les lieux qu'on dessine : refaits quand le point suivi s'éloigne de leur centre.
  let markPlace: PlaceId | null = null;
  const ringCenter = { x: Number.NaN, z: Number.NaN };
  let ringKey = '';
  const placeVisibility = () => {
    for (const [id, mesh] of placeMeshes) {
      const landmark = id === markPlace;
      mesh.material = landmark ? landmarkMaterial : landMaterial;
      mesh.visible = landmark || distance(ringCenter, placeById(id).center) < WORLD_FOG.far + PLACE_BEYOND_FOG;
    }
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
  const marks = new Map<PlaceId, THREE.Vector3>();
  for (const [id, foot] of feet) {
    const o = markOffset(id);
    marks.set(id, new THREE.Vector3(foot.x + o.x, foot.y + o.y, foot.z + o.z));
  }
  const projected = new THREE.Vector3();
  const reportMark = () => {
    const mark = markPlace ? marks.get(markPlace) : undefined;
    if (!mark || !markPlace) return options.onMark(null);
    projected.copy(mark).project(camera);
    const far = distanceSign(here, placeById(markPlace).center);
    options.onMark(markOnScreen({ x: ((projected.x + 1) / 2) * viewW, y: ((1 - projected.y) / 2) * viewH, behind: projected.z > 1 }, viewW, viewH, MARK_MARGIN, far));
  };

  const arrive = (place: PlaceId | null) => {
    walk = null;
    approach();
    options.onArrive(place);
  };
  const startWalkTo = (to: ReturnType<typeof snapToNetwork>, place: PlaceId | null) => {
    const from = snapToNetwork(here);
    const route = findRoute(from, to);
    walkTarget = place;
    if (route.length < 2 || distance(route[0], route[route.length - 1]) < 0.05) return arrive(place);
    walk = startWalk(route, performance.now());
    options.onDepart();
  };
  /** Kéo d'un coup devant un lieu : la caméra le suit d'un bloc (une coupe, jamais un long travelling). */
  const jumpTo = (place: PlaceId) => {
    here = pathNode(placeById(place).door).at;
    heading = FACING_CAMERA;
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
    down = { x: e.clientX, y: e.clientY, t: performance.now() };
  };
  const onCancel = () => {
    down = null;
  };
  const onUp = (e: PointerEvent) => {
    const d = down;
    down = null;
    if (asked || !d || Math.hypot(e.clientX - d.x, e.clientY - d.y) > TAP.pixels || performance.now() - d.t > TAP.ms) return;
    const r = renderer.domElement.getBoundingClientRect();
    pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(touchables, false)[0];
    if (!hit) return;
    const p = { x: hit.point.x, z: hit.point.z };
    const touched = (hit.object.userData.place as PlaceId | undefined) ?? PLACES.find((pl) => distance(p, pl.center) <= pl.touchRadius)?.id;
    if (touched) startWalkTo(atNode(placeById(touched).door), touched);
    else startWalkTo(snapToNetwork(p), null);
  };
  renderer.domElement.addEventListener('pointerdown', onDown);
  renderer.domElement.addEventListener('pointerup', onUp);
  renderer.domElement.addEventListener('pointercancel', onCancel);

  // La question posée dans un lieu (lot 4) : sa pose fixe, la scène de l'item et les objets des réponses (un maillage),
  // la réaction (un maillage qui bouge une à deux secondes). Refaits par item, jamais par image.
  let asked: { place: PlaceId; pose: CameraPose; objectsKey: string; itemKey: string; answered: boolean } | null = null;
  const itemMesh = new THREE.Mesh(new THREE.BufferGeometry(), landMaterial);
  const reactionMesh = new THREE.Mesh(new THREE.BufferGeometry(), landMaterial);
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
  const askQuestion = (q: QuestionRequest | null): LabelOnScreen[] => {
    if (!q) {
      if (!asked) return [];
      asked = null;
      reaction = null;
      itemMesh.visible = false;
      reactionMesh.visible = false;
      keo.visible = true;
      ring.visible = true;
      shift = { x: 0, y: 0 };
      // La brume revient près de Kéo, la caméra derrière lui, sans passage.
      fog.near = WORLD_FOG.near;
      fog.far = WORLD_FOG.far;
      followStep(focus, keoFeet, 0, true);
      follow();
      return [];
    }
    if (host.clientWidth && host.clientHeight && (host.clientWidth !== viewW || host.clientHeight !== viewH)) resize();
    const { place, layout, item } = q;
    // Kéo s'efface le temps de la question : la scène de l'item est devant le lieu, là où il se tient.
    keo.visible = false;
    ring.visible = false;
    walk = null;
    // La caméra de la question est plus loin du lieu que celle qui suit Kéo : la brume s'écarte.
    fog.near = WORLD_FOG.question.near;
    fog.far = WORLD_FOG.question.far;
    const qp = questionPose(place, layout.view, viewW, viewH);
    shift = qp.shift;
    applyPose(qp.pose);
    camera.updateMatrixWorld();
    const slotFeet = layout.slots.map((o) => o.foot);
    const objectsKey = `${place}|${viewW}x${viewH}|${slotFeet.map((o) => `${o.x},${o.y}`).join(';')}`;
    const itemKey = `${JSON.stringify(item.scene)}|${item.right.join(',')}`;
    const spot = sceneSpot(place);
    const points = slotFeet.map((o) => groundUnder(o.x, o.y, spot.y) ?? spot);
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
    merged.append(answerObjects(place, points, scale));
    setGeometry(itemMesh, merged.build());
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
    asked = { place, pose: qp.pose, objectsKey, itemKey, answered: item.answered };
    return facets.labels.map((l) => {
      projected.set(l.at.x, l.at.y, l.at.z).project(camera);
      return { text: l.text, x: ((projected.x + 1) / 2) * viewW, y: ((1 - projected.y) / 2) * viewH };
    });
  };

  // Les pièces durables des lieux (un maillage pour tous), et la Roue des Écluses qui tourne (à part).
  const piecesMesh = still(new THREE.Mesh(new THREE.BufferGeometry(), landMaterial));
  const wheelMesh = new THREE.Mesh(new THREE.BufferGeometry(), landMaterial);
  piecesMesh.visible = false;
  wheelMesh.visible = false;
  scene.add(piecesMesh, wheelMesh);
  let piecesKey = '';
  const setPieces = (counts: Readonly<Record<PlaceId, number>>) => {
    const k = PLACES.map((p) => counts[p.id] ?? 0).join(',');
    if (k === piecesKey) return;
    piecesKey = k;
    const all = new FacetBuilder();
    let wheel: ReturnType<typeof placePieces>['wheel'] = null;
    for (const p of PLACES) {
      const pieces = placePieces(p.id, counts[p.id] ?? 0);
      all.append(pieces.still);
      wheel = pieces.wheel ?? wheel;
    }
    if (veilleurAwake(counts, PLACES.map((p) => p.id))) all.append(veilleurPiece());
    setGeometry(piecesMesh, all.build());
    if (wheel) {
      setGeometry(wheelMesh, wheel.facets);
      wheelMesh.position.set(wheel.at.x, wheel.at.y, wheel.at.z);
    } else wheelMesh.visible = false;
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
    appliedShift = { x: Number.NaN, y: Number.NaN };
    applyPose(asked ? asked.pose : pose);
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
    if (wheelMesh.visible && !reduceMotion) wheelMesh.rotation.x += dt * 0.6;
    // Le banc qui se lève finit son fondu, même si une question s'ouvre à l'arrivée.
    fadeVeil(t);
    if (asked) {
      // Pendant une question, la caméra ne bouge pas ; seule la réaction joue, puis la Roue tourne.
      placeReaction(t);
      options.onMark(null);
      renderer.render(scene, camera);
      meter?.tick(renderer.info, now);
      return;
    }
    placeKeo(here);
    // Il se tourne vers son cap en douceur, par le plus court (d'un coup avec « Réduire les animations »).
    const turn = Math.atan2(Math.sin(heading - keo.rotation.y), Math.cos(heading - keo.rotation.y));
    keo.rotation.y += reduceMotion ? turn : turn * Math.min(1, dt * 12);
    body.bouger(t, dt, moving, reduceMotion, WALK_CADENCE);
    // La caméra rattrape Kéo hors de sa zone morte, et monte si le relief le cache.
    followStep(focus, keoFeet, dt, reduceMotion);
    lift = liftStep(lift, occlusionLift(focus, ground), dt, reduceMotion);
    follow();
    updateRings();
    // Une tuile de près au plus par image : la suivante de la file, puis l'anneau de près refait avec elle.
    if (tiles.pump() !== null) setNear(false);
    if (moving) approach();
    reportMark();
    renderer.render(scene, camera);
    meter?.tick(renderer.info, now);
  };
  loop();

  return {
    goTo: (place, jump = false) => {
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
    },
    setVeiled: (places) => {
      veiled = places;
      approach();
      updateVeil();
    },
    question: askQuestion,
    setPieces,
    info: () => ({ calls: renderer.info.render.calls, triangles: renderer.info.render.triangles }),
    dispose: () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onDown);
      renderer.domElement.removeEventListener('pointerup', onUp);
      renderer.domElement.removeEventListener('pointercancel', onCancel);
      body.dispose();
      for (const g of geometries) g.dispose();
      for (const m of [itemMesh, reactionMesh, piecesMesh, wheelMesh, veilMesh, fadeMesh]) m.geometry.dispose();
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
