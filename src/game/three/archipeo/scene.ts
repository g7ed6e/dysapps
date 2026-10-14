// La scène du monde continu (prototype du monde ouvert d'Archipéo, 6e, piste B « chemins aimantés ») : le terrain en
// tuiles, la mer et le lagon, les quatre lieux, Kéo posé devant le lieu de départ, le cadrage prévu de son rivage.
// Chargée à la demande avec la page (./OpenWorldPage.tsx), seulement derrière le drapeau `?monde=ouvert`
// (../../worldLayoutFactory.tsx). Tout ce qui se calcule sans Three.js est dans world/continu/.
import * as THREE from 'three';
import { loadKeo } from '../../importedCharacters';
import { loadedKeo } from '../../world/characters/imported/keo';
import { cielDe } from '../../world/palette';
import { CAMERA_FOV, poseOf, shoreAt, type CameraPose } from '../../world/continu/camera';
import type { Facets } from '../../world/continu/facets';
import type { Vec2 } from '../../world/continu/geometry';
import { COLORS_6E, PATH_NODES, PLACES, framingOf, placeById, type PlaceId, type ShoreId } from '../../world/continu/plan6e';
import { modelOfPlace } from '../../world/continu/places';
import { SEA_TEXTURE, seaPixels } from '../../world/continu/sea';
import { buildHeightField, heightOnMesh, standingHeight, terrainTiles } from '../../world/continu/terrain';
import { corpsDuBonhomme, type CorpsDuBonhomme } from '../paintedCharacters';
import { createMeter } from '../meter';

/** Ce que la page donne à la scène. */
export interface OpenWorldOptions {
  /** Le lieu où Kéo se tient au départ. */
  start: PlaceId;
  /** « Réduire les animations » : Kéo ne respire pas. */
  reduceMotion: boolean;
  /** Montrer le compteur de mesures (`?mesures`) ; `expose` : le laisser lire aux scripts. */
  meter: { show: boolean; expose: boolean };
}

export interface OpenWorld {
  /** Les chiffres de la dernière image : appels de dessin et triangles (captures, mesures). */
  info(): { calls: number; triangles: number };
  dispose(): void;
}

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
  for (const tile of terrainTiles(field)) {
    if (!tile.triangles) continue;
    const mesh = still(new THREE.Mesh(keep(geometryOf(tile)), landMaterial));
    scene.add(mesh);
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

  // Les lieux : un maillage chacun (un modèle TRELLIS le remplacera, lieu par lieu), posés sur le sol à leur centre.
  for (const place of PLACES) {
    const model = modelOfPlace(place.id);
    const y = standingHeight(ground(place.center.x, place.center.z));
    const mesh = new THREE.Mesh(keep(geometryOf(model.facets)), landMaterial);
    mesh.position.set(place.center.x, y, place.center.z);
    mesh.rotation.y = place.yaw;
    scene.add(still(mesh));
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

  // Kéo, posé devant le lieu de départ (un nœud du réseau des chemins), face à la caméra.
  const door = placeById(options.start).door;
  const here: Vec2 = PATH_NODES.find((n) => n.id === door)!.at;
  keo.rotation.y = FACING_CAMERA;
  const y = standingHeight(ground(here.x, here.z));
  keo.position.set(here.x, y, here.z);
  shadow.position.set(here.x, y + 0.02, here.z);

  // La caméra : le cadrage prévu du rivage de Kéo.
  const shore: ShoreId = shoreAt(here);
  const aspect = () => host.clientWidth / Math.max(1, host.clientHeight);
  const applyPose = (p: CameraPose) => {
    camera.position.set(p.position.x, p.position.y, p.position.z);
    camera.up.set(0, 1, 0);
    camera.lookAt(p.target.x, p.target.y, p.target.z);
  };
  applyPose(poseOf(framingOf(shore), aspect()));

  const resize = () => {
    const w = host.clientWidth;
    const h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    // Le cadrage dépend du rapport de l'écran.
    applyPose(poseOf(framingOf(shore), w / h));
  };
  const observer = new ResizeObserver(resize);
  observer.observe(host);

  // La boucle d'image : Kéo respire (sa pose de repos avec « Réduire les animations »).
  let frame = 0;
  let last = performance.now();
  const clock = new THREE.Clock();
  const loop = () => {
    frame = requestAnimationFrame(loop);
    if (document.hidden) return;
    const now = performance.now();
    const dt = Math.max(0, Math.min(0.1, (now - last) / 1000));
    last = now;
    body.bouger(clock.getElapsedTime(), dt, false, reduceMotion);
    renderer.render(scene, camera);
    meter?.tick(renderer.info, now);
  };
  loop();

  return {
    info: () => ({ calls: renderer.info.render.calls, triangles: renderer.info.render.triangles }),
    dispose: () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
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
