// La scène du monde continu (prototype du monde ouvert d'Archipéo, 6e, piste B « chemins aimantés ») : le terrain en
// tuiles, la mer et le lagon, les chemins, les quatre lieux, Kéo ; le toucher qui l'envoie au point du chemin le plus
// proche, sa marche, les cadrages prévus par rivage ; la marque de la prochaine mission, donnée à la page à chaque image.
// Chargée à la demande avec la page (./OpenWorldPage.tsx), seulement derrière le drapeau `?monde=ouvert`
// (../../worldLayoutFactory.tsx). Tout ce qui se calcule sans Three.js est dans world/continu/.
import * as THREE from 'three';
import { loadKeo } from '../../importedCharacters';
import { loadedKeo } from '../../world/characters/imported/keo';
import { cielDe } from '../../world/palette';
import { CAMERA_BLEND_SECONDS, CAMERA_FOV, poseAt, poseOf, shoreAt, type CameraMove, type CameraPose } from '../../world/continu/camera';
import type { Facets } from '../../world/continu/facets';
import { distance, type Vec2 } from '../../world/continu/geometry';
import { markOnScreen, type MarkOnScreen } from '../../world/continu/mission';
import { atNode, findRoute, pathNode, pathRibbons, snapToNetwork } from '../../world/continu/paths';
import { COLORS_6E, PLACES, framingOf, placeById, type PlaceId, type ShoreId } from '../../world/continu/plan6e';
import { modelOfPlace } from '../../world/continu/places';
import { SEA_TEXTURE, seaPixels } from '../../world/continu/sea';
import { buildHeightField, heightOnMesh, standingHeight, terrainTiles } from '../../world/continu/terrain';
import { skipWalk, startWalk, walkAt, type Walk } from '../../world/continu/walk';
import { corpsDuBonhomme, type CorpsDuBonhomme } from '../paintedCharacters';
import { createMeter } from '../meter';

/** Ce que la page donne à la scène. */
export interface OpenWorldOptions {
  /** Le lieu où Kéo se tient au départ. */
  start: PlaceId;
  /** « Réduire les animations » : Kéo arrive tout de suite, la caméra coupe franc. */
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
  /** Envoie Kéo devant un lieu (« Y aller », le toucher d'un lieu). */
  goTo(place: PlaceId): void;
  /** Saute le trajet en cours : Kéo est arrivé. */
  skip(): void;
  /** Le lieu marqué (la prochaine mission), ou aucun. */
  setMark(place: PlaceId | null): void;
  /** Les chiffres de la dernière image : appels de dessin et triangles (captures, mesures). */
  info(): { calls: number; triangles: number };
  dispose(): void;
}

/** La marge de la flèche au bord de l'écran, en pixels : hors des boutons des coins. */
const MARK_MARGIN = 56;
/** Au-dessus du sommet d'un lieu, en unités : là où se pose la marque. */
const MARK_LIFT = 1.2;
/** Un toucher : moins de tant de pixels de glissé, moins de tant de millisecondes. */
const TAP = { pixels: 10, ms: 700 };
/** Le cap de Kéo au départ : face à la caméra (le sud). */
const FACING_CAMERA = Math.PI;

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
function still(mesh: THREE.Mesh): THREE.Mesh {
  mesh.matrixAutoUpdate = false;
  mesh.updateMatrix();
  return mesh;
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
  const deep = new THREE.Color(COLORS_6E.deepSea);
  scene.background = deep;
  // La brume de profondeur : la mer se fond dans le large, l'horizon reste loin.
  scene.fog = new THREE.Fog(deep, 110, 260);
  const camera = new THREE.PerspectiveCamera(CAMERA_FOV, host.clientWidth / Math.max(1, host.clientHeight), 0.5, 600);

  // La lumière d'un matin clair (fiche du 6e, § 2) : le soleil du 6e, bas à l'est, et une ambiance chaude, renvoyée par
  // le sable : les aplats gardent leur couleur sur les faces tournées vers la caméra (au sud).
  const ciel = cielDe('6e', 1);
  scene.add(new THREE.HemisphereLight(0xf4f1e8, 0xa89a7c, 1.5));
  const sun = new THREE.DirectionalLight(ciel.soleil, 1.9);
  sun.position.set(40, 55, 30);
  scene.add(sun);

  const geometries: THREE.BufferGeometry[] = [];
  const keep = <G extends THREE.BufferGeometry>(g: G) => (geometries.push(g), g);

  // Le terrain : la carte de hauteurs, en tuiles (chacune écartée quand elle sort de la vue), un seul matériau.
  const field = buildHeightField();
  const ground = (x: number, z: number) => heightOnMesh(field, x, z);
  const landMaterial = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
  const touchables: THREE.Object3D[] = [];
  for (const tile of terrainTiles(field)) {
    if (!tile.triangles) continue;
    const mesh = still(new THREE.Mesh(keep(geometryOf(tile)), landMaterial));
    scene.add(mesh);
    touchables.push(mesh);
  }

  // La mer et le lagon : un plan d'eau à 0, peint par l'image de l'eau ; au-delà, le bord de l'image (le large).
  const seaTexture = new THREE.DataTexture(seaPixels(), SEA_TEXTURE.size, SEA_TEXTURE.size);
  seaTexture.colorSpace = THREE.SRGBColorSpace;
  seaTexture.magFilter = THREE.LinearFilter;
  seaTexture.minFilter = THREE.LinearFilter;
  seaTexture.needsUpdate = true;
  const seaSize = 900;
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
  const marks = new Map<PlaceId, THREE.Vector3>();
  for (const place of PLACES) {
    const model = modelOfPlace(place.id);
    const y = standingHeight(ground(place.center.x, place.center.z));
    const mesh = new THREE.Mesh(keep(geometryOf(model.facets)), landMaterial);
    mesh.position.set(place.center.x, y, place.center.z);
    mesh.rotation.y = place.yaw;
    mesh.userData.place = place.id;
    scene.add(still(mesh));
    touchables.push(mesh);
    marks.set(place.id, new THREE.Vector3(place.center.x, y + model.top + MARK_LIFT, place.center.z));
  }

  // Kéo : le corps du bonhomme d'Archipéo (sa marche existante), son ombre au sol ; habillé dès que sa tenue est chargée.
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
  const shadowGeometry = keep(new THREE.CircleGeometry(0.75, 12).rotateX(-Math.PI / 2));
  const shadowMaterial = new THREE.MeshBasicMaterial({ color: 0x1d3a3a, transparent: true, opacity: 0.25, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
  const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
  scene.add(shadow);

  // Où est Kéo, où il va.
  const startNode = pathNode(placeById(options.start).door);
  let here: Vec2 = startNode.at;
  let walk: Walk | null = null;
  let walkTarget: PlaceId | null = null;
  let heading = FACING_CAMERA;
  keo.rotation.y = FACING_CAMERA;
  const placeKeo = (p: Vec2) => {
    const y = standingHeight(ground(p.x, p.z));
    keo.position.set(p.x, y, p.z);
    shadow.position.set(p.x, y + 0.02, p.z);
  };
  placeKeo(here);

  const startWalkTo = (to: ReturnType<typeof snapToNetwork>, place: PlaceId | null) => {
    const from = snapToNetwork(here);
    const route = findRoute(from, to);
    walkTarget = place;
    if (route.length < 2 || distance(route[0], route[route.length - 1]) < 0.05) {
      walk = null;
      options.onArrive(place);
      return;
    }
    walk = startWalk(route, performance.now());
    options.onDepart();
  };

  // La caméra : le cadrage du rivage de Kéo, et le passage en cours.
  let shore: ShoreId = shoreAt(here);
  const aspect = () => host.clientWidth / Math.max(1, host.clientHeight);
  let pose: CameraPose = poseOf(framingOf(shore), aspect());
  let move: CameraMove | null = null;
  const applyPose = (p: CameraPose) => {
    camera.position.set(p.position.x, p.position.y, p.position.z);
    camera.up.set(0, 1, 0);
    camera.lookAt(p.target.x, p.target.y, p.target.z);
  };
  applyPose(pose);

  // La marque de la prochaine mission.
  let markPlace: PlaceId | null = null;
  const projected = new THREE.Vector3();
  const reportMark = () => {
    const anchor = markPlace ? marks.get(markPlace) : undefined;
    if (!anchor) return options.onMark(null);
    projected.copy(anchor).project(camera);
    const w = host.clientWidth;
    const h = host.clientHeight;
    options.onMark(markOnScreen({ x: ((projected.x + 1) / 2) * w, y: ((1 - projected.y) / 2) * h, behind: projected.z > 1 }, w, h, MARK_MARGIN));
  };

  // Le toucher : un lieu touché y envoie Kéo ; ailleurs (sol, eau), au point du chemin le plus proche.
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let down: { x: number; y: number; t: number } | null = null;
  const onDown = (e: PointerEvent) => {
    down = { x: e.clientX, y: e.clientY, t: performance.now() };
  };
  const onUp = (e: PointerEvent) => {
    const d = down;
    down = null;
    if (!d || Math.hypot(e.clientX - d.x, e.clientY - d.y) > TAP.pixels || performance.now() - d.t > TAP.ms) return;
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

  const resize = () => {
    const w = host.clientWidth;
    const h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    // Le cadrage dépend du rapport de l'écran : la pose d'arrivée est refaite, sans passage.
    pose = poseOf(framingOf(shore), w / h);
    move = null;
    applyPose(pose);
  };
  const observer = new ResizeObserver(resize);
  observer.observe(host);

  // La boucle d'image : la marche, le cadrage, la marque (quelques petits objets par image : la place de Kéo, la marque).
  let frame = 0;
  let last = performance.now();
  const clock = new THREE.Clock();
  const loop = () => {
    frame = requestAnimationFrame(loop);
    if (document.hidden) return;
    const now = performance.now();
    const dt = Math.max(0, Math.min(0.1, (now - last) / 1000));
    last = now;
    const t = clock.getElapsedTime();
    let moving = false;
    if (walk) {
      const state = walkAt(walk, now, reduceMotion);
      here = state.at;
      moving = state.moving;
      if (state.heading !== null) heading = state.heading;
      if (!state.moving) {
        walk = null;
        options.onArrive(walkTarget);
      }
    }
    placeKeo(here);
    // Il se tourne vers son cap en douceur, par le plus court (d'un coup avec « Réduire les animations »).
    const turn = Math.atan2(Math.sin(heading - keo.rotation.y), Math.cos(heading - keo.rotation.y));
    keo.rotation.y += reduceMotion ? turn : turn * Math.min(1, dt * 12);
    body.bouger(t, dt, moving, reduceMotion);
    // Le rivage a changé : passage doux vers son cadrage (coupe franche avec « Réduire les animations »).
    const nextShore = shoreAt(here);
    if (nextShore !== shore) {
      shore = nextShore;
      const to = poseOf(framingOf(shore), aspect());
      move = { from: pose, to, start: t };
    }
    if (move) {
      pose = poseAt(move, t, reduceMotion);
      if (reduceMotion || t - move.start >= CAMERA_BLEND_SECONDS) {
        pose = move.to;
        move = null;
      }
    }
    applyPose(pose);
    reportMark();
    renderer.render(scene, camera);
    meter?.tick(renderer.info, now);
  };
  loop();

  return {
    goTo: (place) => startWalkTo(atNode(placeById(place).door), place),
    skip: () => {
      if (!walk) return;
      walk = skipWalk(walk, performance.now());
    },
    setMark: (place) => {
      markPlace = place;
    },
    info: () => ({ calls: renderer.info.render.calls, triangles: renderer.info.render.triangles }),
    dispose: () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onDown);
      renderer.domElement.removeEventListener('pointerup', onUp);
      body.dispose();
      for (const g of geometries) g.dispose();
      landMaterial.dispose();
      seaMaterial.dispose();
      seaTexture.dispose();
      shadowMaterial.dispose();
      meter?.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
