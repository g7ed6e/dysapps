// Le village en 3D : un seul maillage par matériau (faces visibles seulement), caméra libre bornée,
// eau autour des îles, vol vers une île, jour et nuit, créatures qui se promènent. Chargé à la demande (voir ./index.ts).
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { type BiomeId } from '../biomes';
import { AMBIENCE, daylight, palette } from '../world/daylight';
import { buildMesh, type FaceSide, type MeshGroup } from '../world/mesher';
import { islandCenter, mistPatches, viewYaw, viewZone, whaleSpots, worldBounds } from '../world/terrain';
import { drawIslandLabel, drawMapArrow, measureIslandLabel } from '../world/labelCanvas';
import { layoutLabels, separateMark, type LabelBox, type LabelOffset } from '../world/labelLayout';
import { VEHICLE_DECK } from '../world/harbour';
import { vehiclePath } from '../world/voyage';
import { AVATAR_PARTS, AVATAR_SCALE } from '../Avatar';
import {
  ARROW_DIRS,
  avatarWalk,
  boardingWalk,
  cubeTags,
  finishWalk,
  groundTap,
  islandInDirection,
  startStrolls,
  startVoyage,
  strollAt,
  voyageFrame,
  walkPose,
  type Stroll,
  type VoyageRun,
  type Walk,
} from '../world/scene';
import type { WorldViewProps } from '../world/view';
import { blockMaterial, tintedMaterial, type TextureKind } from './textures';
import { createMeter } from './meter';
import { mesuresDemandees, renduDuMonde, styleDuMonde } from '../rendu';
import { cielDe, SOLEIL_DIRECTION, teinteSur } from '../world/palette';
import { creerDome } from './ciel';
import { surfaceDe, type Surface } from './surface';

/** Hauteur de l'eau : les deux couches de terre affleurent, le sol reste bien au-dessus. */
const WATER_LEVEL = -0.45;
/** Le plancher de nuages des Îles du Ciel : sous la roche des îles (à 9), au-dessus de la mer qu'on ne voit plus. */
const CLOUD_FLOOR = 2.5;
/** Direction de la caméra (x, y de la grille) et hauteur relative : vue de trois quarts, côté visage des créatures. */
const VIEW = { dx: 0.3, dy: -0.95, up: 0.42 };
/** Vue d'une île : plus haute, pour voir le plan au fond. */
const ISLAND_VIEW = { dx: 0.7, dy: -0.7, up: 0.9 };
const ISLAND_DISTANCE = 30;
/** Vue autour du bonhomme : assez loin pour voir son île et les voisines (bornes du cadrage de zone). */
const FOLLOW_DISTANCE = 50;
const FOLLOW_MAX = 64;
/** La Carte : presque à la verticale, le même nord, assez loin pour tout le continent. */
const MAP_VIEW = { dx: 0.03, dy: -0.4, up: 1 };
const MAP_FOV = 40;
/** Les étiquettes des îles : le nom dessiné à 40 px dans sa texture, affiché à 18 px CSS à l'écran (comme en 2D). */
const LABEL_PX = 40;
const LABEL_CSS = 18 / LABEL_PX;
/** Sur la Carte, la bande du bas de l'écran où flottent les boutons (Carte, Blocs, École) : pas d'étiquette dessous. */
const LABEL_RESERVE = 72;
/** Sur la Carte, la flèche de la prochaine destination : 48 px de haut à l'écran, à 56 px au moins du fanion. */
const ARROW_CSS = 48;
const ARROW_GAP = 56;
/** Le voyage : vue de côté, depuis l'ouest, la caméra qui s'écarte à mesure que le navire s'éloigne. */
const VOYAGE_VIEW = { dx: -0.85, dy: -0.4, up: 0.3 };
/** La couleur moyenne de la texture de l'eau (world/pixels.ts) : Archipéo teinte la mer pour qu'elle ait, en moyenne, la couleur de la palette. */
const EAU_MOYENNE = 0x54a2e4;
/** Nuages : positions relatives à l'étendue du monde (0..1), longueur en cubes. */
const CLOUDS: [number, number, number][] = [
  [0.05, 0.1, 4],
  [0.22, 0.9, 3],
  [0.4, 0.3, 5],
  [0.55, 1.1, 3],
  [0.7, -0.1, 4],
  [0.88, 0.6, 3],
  [1.02, 0.2, 2],
];

/** Une nappe de brume : blanc au centre, qui s'efface vers les bords (dégradé radial peint une fois). */
function mistTexture(): THREE.Texture | null {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const g = ctx.createRadialGradient(size / 2, size / 2, 4, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(246, 249, 252, 1)');
  g.addColorStop(0.55, 'rgba(246, 249, 252, 0.7)');
  g.addColorStop(1, 'rgba(246, 249, 252, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const ghostCache = new Map<string, THREE.Material>();

/** Matériau d'une face : les blocs texturés partagent les matériaux (cache), le reste est une couleur grainée. */
/** Blocs qui brillent d'eux-mêmes (surtout la nuit). */
const GLOW: Partial<Record<TextureKind, [number, number]>> = { lanterne: [0xffb830, 0.55], lave: [0xff5a00, 0.6] };

function materialFor(texture: string | undefined, face: FaceSide, color: string | undefined, ghost = false, muted = false): THREE.Material {
  if (ghost) {
    const k = texture ?? color ?? 'gris';
    let m = ghostCache.get(k);
    if (!m) {
      const base = texture ? blockMaterial(texture as TextureKind) : tintedMaterial(color ?? '#9c9c9c');
      const src = (Array.isArray(base) ? base[0] : base) as THREE.MeshLambertMaterial;
      // Bleuté et translucide : on voit que c'est « à poser », et ce qu'il y a derrière.
      m = new THREE.MeshLambertMaterial({ map: src.map, color: 0xa8d8ff, emissive: 0x2a4a6a, transparent: true, opacity: 0.6, depthWrite: false });
      ghostCache.set(k, m);
    }
    return m;
  }
  if (!texture) return tintedMaterial(color ?? '#9c9c9c');
  const glow = GLOW[texture as TextureKind];
  if (glow && !muted) {
    let m = ghostCache.get(`lit:${texture}`);
    if (!m) {
      const base = blockMaterial(texture as TextureKind);
      const src = (Array.isArray(base) ? base[0] : base) as THREE.MeshLambertMaterial;
      m = new THREE.MeshLambertMaterial({ map: src.map, emissive: glow[0], emissiveIntensity: glow[1] });
      ghostCache.set(`lit:${texture}`, m);
    }
    return m;
  }
  const m = blockMaterial(texture as TextureKind, muted);
  if (!Array.isArray(m)) return m;
  // Ordre d'une BoxGeometry : +x, −x, +y (dessus), −y (dessous), +z, −z.
  return m[face === 'top' ? 2 : face === 'bottom' ? 3 : 0];
}

/** Un groupe de faces en maillage ; `surface` : une option de style du lot R1 (`?rendu=archipeo&style=…`), sinon les textures. */
function meshOf(g: MeshGroup, surface: Surface | null = null): THREE.Mesh {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(g.positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(g.normals, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(g.uvs, 2));
  geo.setIndex(g.indices);
  surface?.geometry(g, geo);
  const mesh = new THREE.Mesh(geo, surface?.material(g) ?? materialFor(g.texture, g.face, g.color, g.ghost, g.muted));
  if (g.ghost) mesh.renderOrder = 1;
  // Les faces cachées ne sont plus là : on peut renoncer au tri par la taille de la scène.
  mesh.frustumCulled = false;
  return mesh;
}

/** Une créature : son groupe dans la scène et sa promenade (world/scene.ts). */
interface Walker {
  group: THREE.Group;
  stroll: Stroll;
}

interface Spark {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  born: number;
}

export default function WorldCanvas({
  archipelago,
  cubes,
  focus,
  reduceMotion = false,
  onPickIsland,
  onPickBridge,
  build,
  creatures = [],
  onPickCreature,
  forceDay = false,
  bridges = [],
  marker = null,
  vehicle = null,
  onPickVehicle,
  voyage = null,
  onVoyageLegEnd,
  onVoyageSkip,
  avatar,
  map = false,
  home,
  trail,
  quests,
  onPickQuest,
  onPickPlace,
  islandLabels,
  burst,
  className,
  label,
}: WorldViewProps) {
  const host = useRef<HTMLDivElement>(null);
  // Le rendu du monde (drapeau `?rendu=archipeo`), lu une fois pour la vie du composant.
  const rendu = useRef(renduDuMonde()).current;
  const world = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    terrain: THREE.Group;
    creatures: THREE.Group;
    walkers: Walker[];
    sparks: Spark[];
    sparkGeo: THREE.BoxGeometry;
    hover: THREE.LineSegments;
    sky: { hemi: THREE.HemisphereLight; sun: THREE.DirectionalLight; water: THREE.MeshLambertMaterial; fog: THREE.Fog };
    /** Cible et position que la caméra rejoint en douceur (calculées à chaque image). */
    camTarget: THREE.Vector3;
    camPos: THREE.Vector3;
    marker: THREE.Group;
    beacon: THREE.Group;
    trail: THREE.Group;
    questMarks: THREE.Group;
    labels: THREE.Group;
    avatar: THREE.Group;
    walk: Walk | null;
    /** Le Bloc-Navire : la coque (qui tangue) et le ballon (qui se balance au sommet du mât). */
    vehicle: { group: THREE.Group; hull: THREE.Group; balloon: THREE.Group };
    /** L'option de style de surface (lot R1), ou `null` : les textures des blocs. */
    surface: Surface | null;
  } | null>(null);
  const pickRef = useRef(onPickIsland);
  pickRef.current = onPickIsland;
  const pickVehicleRef = useRef(onPickVehicle);
  pickVehicleRef.current = onPickVehicle;
  const voyageEndRef = useRef(onVoyageLegEnd);
  voyageEndRef.current = onVoyageLegEnd;
  const voyageSkipRef = useRef(onVoyageSkip);
  voyageSkipRef.current = onVoyageSkip;
  /** Le voyage en cours dans la scène : son temps (départ ou arrivée), son début, où l'on en est. */
  const voyageRef = useRef<VoyageRun | null>(null);
  /** Le navire : son groupe, son origine dans le monde et les cases fantômes que l'on peut poser. */
  const vehicleRef = useRef<{ origin: { x: number; y: number; z: number }; ghosts: Set<string>; afloat: boolean; port: BiomeId } | null>(null);
  const pickBridgeRef = useRef(onPickBridge);
  pickBridgeRef.current = onPickBridge;
  const pickQuestRef = useRef(onPickQuest);
  pickQuestRef.current = onPickQuest;
  const pickPlaceRef = useRef(onPickPlace);
  pickPlaceRef.current = onPickPlace;
  // Les cubes des bornes de mission et des ouvrages, par case : pour savoir ce qu'on touche.
  const tags = useRef(cubeTags([]));
  useEffect(() => {
    tags.current = cubeTags(cubes);
  }, [cubes]);
  const buildRef = useRef(build);
  buildRef.current = build;
  const creatureRef = useRef(onPickCreature);
  creatureRef.current = onPickCreature;
  const forceDayRef = useRef(forceDay);
  forceDayRef.current = forceDay;
  const bridgesRef = useRef(bridges);
  bridgesRef.current = bridges;
  const mapRef = useRef(map);
  mapRef.current = map;
  const homeRef = useRef(home);
  homeRef.current = home;
  const archRef = useRef(archipelago);
  archRef.current = archipelago;
  const bounds = worldBounds(archipelago);
  const center = { x: (bounds.minX + bounds.maxX) / 2, y: (bounds.minY + bounds.maxY) / 2 };
  // Étendue la plus grande de l'archipel (largeur ou profondeur) : sert au cadrage, à la brume et au zoom maximal.
  const width = Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);

  const focusRef = useRef(focus);
  focusRef.current = focus;

  /**
   * Où la caméra veut être : sur l'île ouverte (vue rapprochée), sinon autour du bonhomme. La caméra est gérée par
   * l'application : pas de zoom ni de rotation ; on touche une île pour y aller. En portrait, un peu plus loin pour
   * que tout tienne dans la largeur.
   */
  const framing = (
    island: BiomeId | null,
    avatarAt: THREE.Vector3,
    aspect: number,
    onMap = false,
    zone: BiomeId | null = null,
    spot: { x: number; y: number; z: number } | null = null,
  ) => {
    if (onMap) {
      // Tout le continent tient dans la vue, en largeur comme en profondeur (la vue est un peu inclinée).
      const ex = bounds.maxX - bounds.minX;
      const ey = bounds.maxY - bounds.minY;
      const need = Math.max(ey * 1.35, (ex * 1.2) / Math.max(0.3, aspect));
      const d = need / (2 * Math.tan((MAP_FOV / 2) * (Math.PI / 180)));
      const len = Math.hypot(MAP_VIEW.dx, MAP_VIEW.dy, MAP_VIEW.up);
      // Un peu au nord : le continent descend sur l'écran, sous la ligne d'aide.
      const target = new THREE.Vector3(center.x, 0, center.y + ey * 0.18);
      const pos = new THREE.Vector3(target.x + (d * MAP_VIEW.dx) / len, target.y + (d * MAP_VIEW.up) / len, target.z + (d * MAP_VIEW.dy) / len);
      return { target, pos };
    }
    const portrait = aspect < 1 ? 1 / Math.sqrt(Math.max(0.4, aspect)) : 1;
    const avatar = { x: avatarAt.x, y: avatarAt.z, z: avatarAt.y };
    let c = spot ?? (island ? islandCenter(island) : avatar);
    let d = (island ? ISLAND_DISTANCE : FOLLOW_DISTANCE) * portrait;
    const v = island ? ISLAND_VIEW : VIEW;
    // Bonhomme posé sur son île : on cadre la zone (son île et ses voisines), le bonhomme restant au premier tiers.
    if (!island && zone) {
      const z = viewZone(zone);
      const zc = { x: (z.minX + z.maxX) / 2, y: (z.minY + z.maxY) / 2 };
      const home = islandCenter(zone);
      c = { x: (home.x * 2 + zc.x) / 3, y: (home.y * 2 + zc.y) / 3, z: home.z };
      const ex = z.maxX - z.minX;
      const ey = z.maxY - z.minY;
      const need = (Math.max(ex / Math.max(0.6, aspect), ey * 1.1) * 0.5) / Math.tan((20 * Math.PI) / 180);
      d = Math.min(FOLLOW_MAX, Math.max(FOLLOW_DISTANCE, need * 0.8)) * portrait;
    }
    // Le pivot vers le cœur du continent : la direction de vue tourne autour de la verticale.
    // (pivot positif : la caméra passe à l'ouest et regarde vers l'est, d'où le signe).
    const yaw = -(island ? viewYaw(island) : zone ? viewYaw(zone) : 0);
    const dx = v.dx * Math.cos(yaw) - v.dy * Math.sin(yaw);
    const dy = v.dx * Math.sin(yaw) + v.dy * Math.cos(yaw);
    const target = new THREE.Vector3(c.x, c.z + 1, c.y);
    const pos = new THREE.Vector3(c.x + d * dx, c.z + 1 + d * v.up, c.y + d * dy);
    return { target, pos };
  };

  // ---- Création de la scène (une fois)
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(el.clientWidth, el.clientHeight, false);
    el.appendChild(renderer.domElement);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.touchAction = 'none';
    // Le compteur de mesures (lot R0) : visible avec `?mesures`, lisible par les scripts en développement.
    const meter = createMeter(el, rendu, mesuresDemandees(), import.meta.env.DEV || mesuresDemandees());

    const scene = new THREE.Scene();
    // L'ambiance de l'archipel : ciel, mer (ou nuages), brouillard, sol.
    const ambience = AMBIENCE[archipelago];
    const day = palette(1, archipelago);
    // Archipéo (lot R1) : un dôme dégradé, une brume de profondeur couleur d'horizon, un soleil chaud et une ambiance froide.
    const archipeo = rendu === 'archipeo';
    const ciel = cielDe(archipelago, 1);
    // L'option de style `?style=a|b|c` (seulement avec le drapeau), sinon les textures des blocs.
    const style = archipeo ? styleDuMonde() : null;
    const surface = style ? surfaceDe(style, archipelago) : null;
    scene.background = new THREE.Color(archipeo ? ciel.horizon : day.sky);
    const fog = archipeo ? new THREE.Fog(ciel.horizon, ciel.brumeProche, ciel.brumeLoin) : new THREE.Fog(day.sky, width * ambience.fog[0], width * ambience.fog[1]);
    scene.fog = fog;
    const camera = new THREE.PerspectiveCamera(40, el.clientWidth / Math.max(1, el.clientHeight), 0.5, width * 10);
    const dome = archipeo ? creerDome(ciel, width * 4) : null;
    if (dome) scene.add(dome.mesh);
    // Clavier (le canvas prend le focus) : les flèches vont à l'île voisine dans cette direction.
    el.tabIndex = 0;
    const onKey = (e: KeyboardEvent) => {
      // Pendant le voyage : Entrée, Espace ou Échap font arriver tout de suite ; les flèches attendent.
      if (voyageRef.current) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
          e.preventDefault();
          voyageSkipRef.current?.();
        }
        return;
      }
      const dir = ARROW_DIRS[e.key];
      if (!dir || !pickRef.current) return;
      e.preventDefault();
      const w = world.current;
      const from = w ? { x: w.camTarget.x, y: w.camTarget.z } : center;
      const next = islandInDirection(archRef.current, from, dir);
      if (next) pickRef.current(next);
    };
    el.addEventListener('keydown', onKey);

    const hemi = archipeo ? new THREE.HemisphereLight(ciel.ambianceCiel, ciel.ambianceSol, ciel.ambianceForce) : new THREE.HemisphereLight(0xffffff, day.ground, day.ambient);
    scene.add(hemi);
    const sun = archipeo ? new THREE.DirectionalLight(ciel.soleil, ciel.soleilForce) : new THREE.DirectionalLight(day.sun, day.sunIntensity);
    if (archipeo) sun.position.set(...SOLEIL_DIRECTION);
    else sun.position.set(40, 60, 20);
    scene.add(sun);

    // L'eau : un grand plan sous le niveau du sol, avec des crêtes pixel qui défilent.
    const waterMaterial = (
      Array.isArray(blockMaterial('eau')) ? (blockMaterial('eau') as THREE.Material[])[2] : blockMaterial('eau')
    ) as THREE.MeshLambertMaterial;
    const waterMat = waterMaterial.clone();
    waterMat.transparent = true;
    waterMat.opacity = 0.92;
    if (waterMat.map) {
      waterMat.map = waterMat.map.clone();
      waterMat.map.wrapS = THREE.RepeatWrapping;
      waterMat.map.wrapT = THREE.RepeatWrapping;
      waterMat.map.repeat.set(width * 2, width * 2);
      waterMat.map.needsUpdate = true;
    }
    const water = new THREE.Mesh(new THREE.PlaneGeometry(width * 8, width * 8), waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.set(center.x, WATER_LEVEL, center.y);
    // Les Îles du Ciel : pas de mer, un plancher de nuages qui dérive lentement sous les îles.
    water.visible = !ambience.sky;
    scene.add(water);
    const floorTex = ambience.sky ? mistTexture() : null;
    if (floorTex) {
      floorTex.wrapS = THREE.RepeatWrapping;
      floorTex.wrapT = THREE.RepeatWrapping;
      floorTex.repeat.set(width / 6, width / 6);
    }
    const cloudFloorMat = new THREE.MeshBasicMaterial({ map: floorTex, color: 0xf6f9fc, transparent: true, opacity: 0.92, depthWrite: false });
    const cloudFloor = new THREE.Mesh(new THREE.PlaneGeometry(width * 8, width * 8), cloudFloorMat);
    cloudFloor.rotation.x = -Math.PI / 2;
    cloudFloor.position.set(center.x, CLOUD_FLOOR, center.y);
    cloudFloor.visible = ambience.sky;
    scene.add(cloudFloor);

    // Nuages en cubes, au-dessus du monde ; dans les Îles du Ciel, deux fois plus, et bas, entre les îles.
    const cloudGeo = new THREE.BoxGeometry(1, 0.5, 1.2);
    const clouds = new THREE.Group();
    const cloudSpots: [number, number, number][] = ambience.sky ? [...CLOUDS, ...CLOUDS.map(([fx, fy, len]) => [(fx + 0.5) % 1.1, fy - 0.45, len + 1] as [number, number, number])] : CLOUDS;
    cloudSpots.forEach(([fx, fy, len], i) => {
      const cloud = new THREE.Group();
      for (let k = 0; k < len; k++) {
        const puff = new THREE.Mesh(cloudGeo, blockMaterial('nuage'));
        puff.position.set(k, (k % 2) * 0.5, 0);
        cloud.add(puff);
      }
      const low = ambience.sky && i >= CLOUDS.length;
      cloud.position.set(bounds.minX + fx * width, low ? 4 + (i % 3) : 12, bounds.minY + fy * (bounds.maxY - bounds.minY));
      clouds.add(cloud);
    });
    scene.add(clouds);

    // La brume des sommets : une nappe translucide sous chaque île la plus haute, qui respire lentement.
    const mistMat = new THREE.MeshBasicMaterial({ map: mistTexture(), transparent: true, opacity: 0.55, depthWrite: false });
    const mists: THREE.Mesh[] = [];
    for (const m of mistPatches(archipelago)) {
      // (Les nappes de brume des sommets : seulement sous les Îles du Ciel.)
      const mist = new THREE.Mesh(new THREE.PlaneGeometry(m.w, m.h), mistMat);
      mist.rotation.x = -Math.PI / 2;
      mist.position.set(m.x, m.z, m.y);
      scene.add(mist);
      mists.push(mist);
    }

    // Les oiseaux : de petits V sombres qui tournent au-dessus du monde, ailes battantes.
    const birdMat = new THREE.MeshLambertMaterial({ color: 0x3a2f2a });
    const wingGeo = new THREE.BoxGeometry(0.5, 0.08, 0.16);
    const birds: { group: THREE.Group; wings: THREE.Mesh[]; cx: number; cy: number; r: number; alt: number; phase: number; speed: number }[] = [];
    // Plus d'oiseaux et plus haut dans les Anciens Ateliers ; tout en haut dans les Îles du Ciel.
    const birdCount = archipelago === '4e' ? 8 : 6;
    const birdAlt = archipelago === '4e' ? 17 : ambience.sky ? 18 : 13;
    for (let i = 0; i < birdCount; i++) {
      const group = new THREE.Group();
      const left = new THREE.Mesh(wingGeo, birdMat);
      const right = new THREE.Mesh(wingGeo, birdMat);
      left.position.x = -0.25;
      right.position.x = 0.25;
      group.add(left, right);
      scene.add(group);
      birds.push({
        group,
        wings: [left, right],
        cx: bounds.minX + (0.2 + 0.6 * ((i * 0.37) % 1)) * width,
        cy: bounds.minY + (0.2 + 0.6 * ((i * 0.61) % 1)) * (bounds.maxY - bounds.minY),
        r: 8 + (i % 3) * 4,
        alt: birdAlt + (i % 2) * 3,
        phase: i * 1.7,
        speed: 0.25 + (i % 3) * 0.05,
      });
    }

    // Les baleines : trois grandes bêtes bleu ardoise qui tournent au large, font surface et soufflent.
    const whaleMat = new THREE.MeshLambertMaterial({ color: 0x3f5d7a });
    const bellyMat = new THREE.MeshLambertMaterial({ color: 0xc9d6e2 });
    const spoutMat = new THREE.MeshLambertMaterial({ color: 0xf4f8fb, transparent: true, opacity: 0.85 });
    const whales: { group: THREE.Group; fluke: THREE.Mesh; spout: THREE.Group; cx: number; cy: number; r: number; phase: number; speed: number }[] = [];
    whaleSpots(archipelago).forEach((spot, i) => {
      const group = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.3, 1.5), whaleMat);
      const head = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.1, 1.3), whaleMat);
      head.position.x = 2.3;
      const belly = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.3, 1.1), bellyMat);
      belly.position.y = -0.6;
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.15, 0.7), whaleMat);
      fin.position.set(0.6, -0.2, 1.0);
      const fluke = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.18, 2.2), whaleMat);
      fluke.position.x = -2.2;
      const spout = new THREE.Group();
      for (let k = 0; k < 3; k++) {
        const puff = new THREE.Mesh(new THREE.BoxGeometry(0.3 + k * 0.15, 0.3, 0.3 + k * 0.15), spoutMat);
        puff.position.set(2.3 + (k - 1) * 0.2, 0.9 + k * 0.45, 0);
        spout.add(puff);
      }
      spout.visible = false;
      group.add(body, head, belly, fin, fluke, spout);
      scene.add(group);
      whales.push({ group, fluke, spout, cx: spot.x, cy: spot.y, r: spot.r, phase: i * 2.1, speed: 0.12 + i * 0.03 });
    });

    // La flèche « Commence ici » : un chevron jaune qui flotte et pointe vers le bas.
    const markerMat = new THREE.MeshLambertMaterial({ color: 0xffc83c, emissive: 0x7a5a00, emissiveIntensity: 0.4 });
    const markerGroup = new THREE.Group();
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.6, 4), markerMat);
    tip.rotation.x = Math.PI;
    tip.rotation.y = Math.PI / 4;
    markerGroup.add(tip);
    const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.4, 0.6), markerMat);
    shaft.position.y = 1.4;
    markerGroup.add(shaft);
    markerGroup.visible = false;
    scene.add(markerGroup);
    // Sur la Carte : un grand fanion au-dessus du bonhomme (« tu es ici »), et des balises le long d'un chemin à construire.
    const beaconGroup = new THREE.Group();
    const beaconTip = new THREE.Mesh(new THREE.ConeGeometry(4, 7, 4), markerMat);
    beaconTip.rotation.x = Math.PI;
    beaconTip.rotation.y = Math.PI / 4;
    beaconGroup.add(beaconTip);
    const beaconShaft = new THREE.Mesh(new THREE.BoxGeometry(2.2, 6, 2.2), markerMat);
    beaconShaft.position.y = 6.2;
    beaconGroup.add(beaconShaft);
    beaconGroup.visible = false;
    scene.add(beaconGroup);
    // Sur la Carte, la flèche de la prochaine destination : une image toujours tournée vers l'écran (vue du ciel, un
    // cône ne se voit pas), de taille fixe, par-dessus les étiquettes ; sa pointe se pose sur l'île.
    const arrowCanvas = document.createElement('canvas');
    arrowCanvas.width = 96;
    arrowCanvas.height = 124;
    const arrowCtx = arrowCanvas.getContext('2d');
    if (arrowCtx) drawMapArrow(arrowCtx, 48, 114, 104);
    const arrowTex = new THREE.CanvasTexture(arrowCanvas);
    arrowTex.colorSpace = THREE.SRGBColorSpace;
    const mapArrow = new THREE.Sprite(new THREE.SpriteMaterial({ map: arrowTex, depthTest: false, transparent: true, sizeAttenuation: false, fog: false }));
    mapArrow.userData.px = { w: (ARROW_CSS * arrowCanvas.width) / arrowCanvas.height, h: ARROW_CSS, tip: 114 / arrowCanvas.height };
    mapArrow.renderOrder = 12;
    mapArrow.raycast = () => {};
    mapArrow.visible = false;
    scene.add(mapArrow);
    const trailGroup = new THREE.Group();
    scene.add(trailGroup);
    const questMarksGroup = new THREE.Group();
    scene.add(questMarksGroup);
    // Le nom des îles ouvertes : des étiquettes toujours face à l'écran, de taille fixe, par-dessus le relief.
    const labelsGroup = new THREE.Group();
    scene.add(labelsGroup);

    // Le bonhomme (ses cubes arrivent par la prop `avatar`). Le groupe extérieur est posé au centre de sa case, sous
    // ses pieds, et tourne sur lui-même ; le corps, recentré dedans, regarde vers -Z (la caméra) sans rotation.
    const avatarGroup = new THREE.Group();
    avatarGroup.visible = false;
    const avatarBody = new THREE.Group();
    // Ses pièces sont en seizièmes de bloc : deux blocs de haut, comme une porte et un bloc. Chaque membre pivote.
    avatarBody.scale.setScalar(AVATAR_SCALE);
    avatarBody.position.set(-8 * AVATAR_SCALE, 0, -4 * AVATAR_SCALE);
    avatarGroup.add(avatarBody);
    const limbs: { arms: THREE.Group[]; legs: THREE.Group[] } = { arms: [], legs: [] };
    for (const part of AVATAR_PARTS) {
      const pivot = new THREE.Group();
      pivot.position.set(part.pivot.x, part.pivot.z, part.pivot.y);
      const inner = new THREE.Group();
      inner.position.set(-part.pivot.x, -part.pivot.z, -part.pivot.y);
      for (const g of buildMesh(part.cubes)) inner.add(meshOf(g, surface));
      pivot.add(inner);
      avatarBody.add(pivot);
      if (part.name.startsWith('bras')) limbs.arms.push(pivot);
      if (part.name.startsWith('jambe')) limbs.legs.push(pivot);
    }
    scene.add(avatarGroup);

    const terrain = new THREE.Group();
    scene.add(terrain);
    const creaturesGroup = new THREE.Group();
    scene.add(creaturesGroup);
    // Le Bloc-Navire : un groupe à part, amarré au quai, qui tangue ; le ballon pivote au sommet du mât.
    const vehicleGroup = new THREE.Group();
    vehicleGroup.userData = { vehicle: true };
    const hullGroup = new THREE.Group();
    const balloonGroup = new THREE.Group();
    // La flamme du réacteur (troisième étape), visible seulement en vol.
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xff7a1a, transparent: true, opacity: 0.9 });
    const flame = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.9, 1.4), flameMat);
    flame.position.set(2.5, 1.5, 11.6);
    flame.visible = false;
    vehicleGroup.add(hullGroup, balloonGroup, flame);
    scene.add(vehicleGroup);
    // Le contour de la case visée (mode chantier).
    const hover = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.02, 1.02, 1.02)), new THREE.LineBasicMaterial({ color: 0x1e6fd9 }));
    hover.visible = false;
    scene.add(hover);
    const sparkGeo = new THREE.BoxGeometry(0.18, 0.18, 0.18);
    world.current = {
      scene,
      camera,
      renderer,
      terrain,
      creatures: creaturesGroup,
      walkers: [],
      sparks: [],
      sparkGeo,
      hover,
      sky: { hemi, sun, water: waterMat, fog },
      camTarget: new THREE.Vector3(),
      camPos: new THREE.Vector3(),
      marker: markerGroup,
      beacon: beaconGroup,
      trail: trailGroup,
      questMarks: questMarksGroup,
      labels: labelsGroup,
      avatar: avatarGroup,
      walk: null,
      vehicle: { group: vehicleGroup, hull: hullGroup, balloon: balloonGroup },
      surface,
    };

    // Toucher une île, une face ou une créature : un tap, pas un glissé.
    const ray = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let down: { x: number; y: number } | null = null;
    const aim = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
      ray.setFromCamera(pointer, camera);
      const creature = ray.intersectObjects([...creaturesGroup.children, ...questMarksGroup.children, vehicleGroup], true)[0];
      const ground = ray.intersectObjects(terrain.children, false)[0];
      if (creature && (!ground || creature.distance < ground.distance)) return { creature, hit: undefined };
      return { creature: undefined, hit: ground };
    };
    const questIdOf = (o: THREE.Object3D): { biome: BiomeId; typeId: string } | null => {
      let cur: THREE.Object3D | null = o;
      while (cur) {
        if (typeof cur.userData.quest === 'string') {
          const [biome, typeId] = (cur.userData.quest as string).split(':');
          return { biome: biome as BiomeId, typeId };
        }
        cur = cur.parent;
      }
      return null;
    };
    const creatureIdOf = (o: THREE.Object3D): { id: BiomeId; kind: 'creature' | 'guardian' } | null => {
      let cur: THREE.Object3D | null = o;
      while (cur) {
        if (typeof cur.userData.creature === 'string')
          return { id: cur.userData.creature as BiomeId, kind: cur.userData.kind === 'guardian' ? 'guardian' : 'creature' };
        cur = cur.parent;
      }
      return null;
    };
    const isInside = (o: THREE.Object3D, root: THREE.Object3D): boolean => {
      let cur: THREE.Object3D | null = o;
      while (cur) {
        if (cur === root) return true;
        cur = cur.parent;
      }
      return false;
    };
    const onDown = (e: PointerEvent) => {
      down = { x: e.clientX, y: e.clientY };
    };
    /** Bloc touché et case voisine devant la face, en coordonnées de grille (x, y, z = hauteur). */
    const cellsOf = (hit: THREE.Intersection) => {
      const n = hit.face?.normal ?? new THREE.Vector3(0, 1, 0);
      const inside = hit.point.clone().addScaledVector(n, -0.5);
      const outside = hit.point.clone().addScaledVector(n, 0.5);
      const cell = { x: Math.floor(inside.x), y: Math.floor(inside.z), z: Math.floor(inside.y) };
      const next = { x: Math.floor(outside.x), y: Math.floor(outside.z), z: Math.floor(outside.y) };
      return { cell, next };
    };
    const onUp = (e: PointerEvent) => {
      if (!down) return;
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
      down = null;
      if (moved > 8) return;
      // Pendant le voyage, un tap n'importe où fait arriver le navire tout de suite.
      if (voyageRef.current) return voyageSkipRef.current?.();
      // Pendant un trajet, un tap n'importe où fait arriver le bonhomme tout de suite.
      if (finishWalk(world.current?.walk ?? null, performance.now())) return;
      const { creature, hit } = aim(e);
      if (creature && vehicleRef.current && isInside(creature.object, vehicleGroup)) {
        // Une case du navire : en coordonnées locales (le navire tangue), puis dans le monde ; un fantôme se pose.
        const v = vehicleRef.current;
        const n = creature.face?.normal ?? new THREE.Vector3(0, 1, 0);
        const local = vehicleGroup.worldToLocal(creature.point.clone().addScaledVector(n, -0.5));
        const cell = { x: v.origin.x + Math.floor(local.x), y: v.origin.y + Math.floor(local.z), z: v.origin.z + Math.floor(local.y) };
        if (v.ghosts.has(`${Math.floor(local.x)},${Math.floor(local.z)},${Math.floor(local.y)}`) && buildRef.current) return buildRef.current.onPickFace(cell, cell);
        return pickVehicleRef.current?.(v.port);
      }
      if (creature) {
        const quest = questIdOf(creature.object);
        if (quest && pickQuestRef.current) return pickQuestRef.current(quest.biome, quest.typeId);
        const found = creatureIdOf(creature.object);
        if (found && creatureRef.current) return creatureRef.current(found.id, found.kind);
        if (found && !buildRef.current) return pickRef.current?.(found.id);
      }
      if (!hit) return;
      const tap = groundTap(
        archRef.current,
        { ...cellsOf(hit), ground: { x: hit.point.x, y: hit.point.z } },
        tags.current,
        { quest: Boolean(pickQuestRef.current), bridge: Boolean(pickBridgeRef.current), build: Boolean(buildRef.current), place: Boolean(pickPlaceRef.current) },
      );
      if (tap.kind === 'quest') pickQuestRef.current?.(tap.biome, tap.typeId);
      else if (tap.kind === 'place') pickPlaceRef.current?.(tap.place, tap.island);
      else if (tap.kind === 'bridge') pickBridgeRef.current?.(tap.id);
      else if (tap.kind === 'face') buildRef.current?.onPickFace(tap.cell, tap.next);
      else pickRef.current?.(tap.id);
    };
    const onHover = (e: PointerEvent) => {
      if (e.pointerType === 'touch' || (!pickRef.current && !buildRef.current && !creatureRef.current)) return;
      const { creature, hit } = aim(e);
      renderer.domElement.style.cursor = creature || hit ? 'pointer' : 'grab';
      const h = world.current?.hover;
      if (!h) return;
      if (hit && buildRef.current) {
        const { next } = cellsOf(hit);
        h.visible = true;
        h.position.set(next.x + 0.5, next.z + 0.5, next.y + 0.5);
      } else h.visible = false;
    };
    const onLeave = () => {
      if (world.current) world.current.hover.visible = false;
    };
    renderer.domElement.addEventListener('pointerdown', onDown);
    renderer.domElement.addEventListener('pointerup', onUp);
    renderer.domElement.addEventListener('pointermove', onHover);
    renderer.domElement.addEventListener('pointerleave', onLeave);

    const resize = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(el);

    // Jour et nuit : la lumière suit l'heure réelle, ajustée chaque minute (figée avec « réduire les animations »).
    let light = -1;
    const applyDaylight = () => {
      const target = forceDayRef.current ? 1 : daylight().light;
      if (target === light) return;
      light = target;
      if (archipeo) {
        // Le ciel, la brume (couleur d'horizon), la lumière et la mer (ou le plancher de nuages) suivent le jour.
        const c = cielDe(archipelago, light);
        (scene.background as THREE.Color).setHex(c.horizon);
        fog.color.setHex(c.horizon);
        dome?.peindre(c);
        hemi.color.setHex(c.ambianceCiel);
        hemi.groundColor.setHex(c.ambianceSol);
        hemi.intensity = c.ambianceForce;
        sun.color.setHex(c.soleil);
        sun.intensity = c.soleilForce;
        waterMat.color.setHex(teinteSur(c.mer, EAU_MOYENNE));
        if (ambience.sky) cloudFloorMat.color.setHex(c.mer);
        return;
      }
      const p = palette(light, archipelago);
      (scene.background as THREE.Color).setHex(p.sky);
      fog.color.setHex(p.sky);
      hemi.intensity = p.ambient;
      sun.color.setHex(p.sun);
      sun.intensity = p.sunIntensity;
      waterMat.color.setHex(p.water);
    };
    applyDaylight();
    const dayTimer = reduceMotion ? 0 : window.setInterval(applyDaylight, 60_000);

    // Économie de batterie : on ne dessine que si le canvas est visible et l'onglet actif ;
    // et si l'appareil peine (images trop longues), on baisse la finesse du rendu.
    let visible = true;
    let running = true;
    let slowFrames = 0;
    const seen = new IntersectionObserver((entries) => {
      visible = entries.some((e) => e.isIntersecting);
      if (visible && !running) start();
    });
    seen.observe(el);
    const onVisibility = () => {
      if (!document.hidden && !running) start();
    };
    document.addEventListener('visibilitychange', onVisibility);

    // Les étiquettes des îles : taille fixe en pixels CSS (une échelle « sans atténuation » se compte en hauteur
    // d'écran), et sur la Carte, écartées les unes des autres pour qu'aucune n'en cache une autre (le décalage se fait à
    // l'écran, par le point d'ancrage du sprite : l'étiquette reste au-dessus de son île).
    const labelAt = new THREE.Vector3();
    // Le cadrage où la caméra arrive : l'écart des étiquettes se calcule pour lui (une fois, gardé tant qu'il ne change
    // pas), pas image par image ; pendant qu'elle glisse, les étiquettes suivent leur île sans sauter de place.
    const camGoal = { target: new THREE.Vector3(), pos: new THREE.Vector3() };
    const goalCamera = new THREE.PerspectiveCamera();
    let labelLayout: { key: string; offsets: LabelOffset[] } | null = null;
    // Sur la Carte, la flèche de la destination (à la place du petit chevron « Commence ici », invisible de si haut) ; si
    // le bonhomme est sur la même île, elle s'écarte de son fanion pour que les deux restent distincts.
    const toScreen = (v: THREE.Vector3, cam: THREE.Camera, W: number, H: number) => {
      labelAt.copy(v).project(cam);
      return { x: ((labelAt.x + 1) / 2) * W, y: ((1 - labelAt.y) / 2) * H };
    };
    const beaconBase = new THREE.Vector3();
    const beaconTop = new THREE.Vector3();
    /** Le fanion et la flèche, en pixels d'écran vus par `cam` (la flèche déjà écartée du fanion) : ce que les étiquettes évitent. */
    const marksOnScreen = (cam: THREE.Camera, W: number, H: number) => {
      const out: { arrow: LabelBox | null; arrowShift: LabelOffset; beacon: LabelBox | null } = { arrow: null, arrowShift: { dx: 0, dy: 0 }, beacon: null };
      const w = world.current;
      if (!w) return out;
      if (w.avatar.visible) {
        beaconBase.set(w.avatar.position.x, w.avatar.position.y + 4.5, w.avatar.position.z);
        beaconTop.set(w.avatar.position.x, w.avatar.position.y + 17, w.avatar.position.z);
        const a = toScreen(beaconBase, cam, W, H);
        const b = toScreen(beaconTop, cam, W, H);
        const h = Math.max(24, Math.abs(a.y - b.y));
        out.beacon = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, w: Math.max(24, h * 0.9), h };
      }
      if (w.marker.userData.island) {
        const tip = toScreen(mapArrow.position, cam, W, H);
        if (out.beacon) out.arrowShift = separateMark(tip, { x: out.beacon.x, y: out.beacon.y + out.beacon.h / 2 }, ARROW_GAP);
        const { w: aw, h: ah } = mapArrow.userData.px;
        out.arrow = { x: tip.x + out.arrowShift.dx, y: tip.y + out.arrowShift.dy - ah / 2, w: aw, h: ah };
      }
      return out;
    };
    const placeMarks = (onMap: boolean, t: number) => {
      const w = world.current;
      if (!w) return;
      const island = w.marker.userData.island as BiomeId | null;
      const show = onMap && Boolean(island);
      mapArrow.visible = show;
      if (w.marker.userData.island !== undefined) w.marker.visible = Boolean(w.marker.userData.on) && !show;
      if (!show || !island) return;
      const c = islandCenter(island);
      mapArrow.position.set(c.x + 0.5, c.z + 8, c.y + 0.5);
      const H = Math.max(1, el.clientHeight);
      const W = Math.max(1, el.clientWidth);
      const perPx = 2 / (camera.projectionMatrix.elements[5] * H);
      const { w: aw, h: ah, tip } = mapArrow.userData.px;
      mapArrow.scale.set(aw * perPx, ah * perPx, 1);
      const { arrowShift } = marksOnScreen(camera, W, H);
      const bob = reduceMotion ? 0 : Math.abs(Math.sin(t * 2.2)) * 6;
      mapArrow.center.set(0.5 - arrowShift.dx / aw, 1 - tip + (arrowShift.dy - bob) / ah);
    };
    const placeLabels = (labels: THREE.Group, spread: boolean) => {
      const sprites = labels.children as THREE.Sprite[];
      if (!sprites.length) return;
      const H = Math.max(1, el.clientHeight);
      const W = Math.max(1, el.clientWidth);
      const perPx = 2 / (camera.projectionMatrix.elements[5] * H);
      for (const s of sprites) s.scale.set(s.userData.px.w * perPx, s.userData.px.h * perPx, 1);
      if (!spread) {
        if (labelLayout) for (const s of sprites) s.center.set(0.5, 0.5);
        labelLayout = null;
        return;
      }
      const av = world.current?.avatar.position;
      const marks = `${world.current?.marker.userData.island ?? ''}:${av ? av.toArray().map((v) => v.toFixed(0)) : ''}`;
      const key = `${sprites.map((s) => s.id).join(',')}@${camGoal.pos.toArray().map((v) => v.toFixed(1))}>${camGoal.target.toArray().map((v) => v.toFixed(1))}@${W}x${H}@${marks}`;
      if (labelLayout?.key !== key) {
        goalCamera.copy(camera);
        goalCamera.position.copy(camGoal.pos);
        goalCamera.lookAt(camGoal.target);
        goalCamera.updateMatrixWorld();
        const boxes = sprites.map((s) => {
          labelAt.copy(s.position).project(goalCamera);
          return { x: ((labelAt.x + 1) / 2) * W, y: ((1 - labelAt.y) / 2) * H, w: s.userData.px.w, h: s.userData.px.h };
        });
        // Une île fermée pèse moins : c'est son étiquette qui s'écarte d'abord.
        const weights = sprites.map((s) => (s.userData.fermee ? 0.5 : 1));
        // La flèche de la destination et le fanion du bonhomme restent visibles : aucune étiquette ne se pose dessus.
        const { arrow, beacon } = marksOnScreen(goalCamera, W, H);
        const obstacles = [arrow, beacon].filter((b): b is LabelBox => b !== null);
        labelLayout = { key, offsets: layoutLabels(boxes, 6, { w: W, h: H - LABEL_RESERVE }, weights, obstacles) };
        labelLayout.offsets.forEach((o, i) => {
          const s = sprites[i];
          s.center.set(0.5 - o.dx / s.userData.px.w, 0.5 + o.dy / s.userData.px.h);
        });
      }
    };

    let frame = 0;
    const clock = new THREE.Clock();
    let lastFrame = performance.now();
    // Le cap du bonhomme (rotation autour de la verticale) : face à la caméra tant qu'il n'a pas marché.
    let heading = 0;
    const loop = () => {
      if (!visible || document.hidden) {
        running = false;
        return;
      }
      running = true;
      frame = requestAnimationFrame(loop);
      const nowMs = performance.now();
      if (nowMs - lastFrame > 45 && renderer.getPixelRatio() > 1) {
        if (++slowFrames > 30) renderer.setPixelRatio(1);
      } else slowFrames = 0;
      const dt = Math.min(0.1, (nowMs - lastFrame) / 1000);
      lastFrame = nowMs;
      const w = world.current;
      if (!w) return;
      const now = performance.now();
      const t = clock.getElapsedTime();
      // Le bonhomme marche le long de son itinéraire (à vitesse constante, un petit pas sautillant), puis attend.
      let walking = false;
      if (w.walk) {
        const pose = walkPose(w.walk, now, reduceMotion);
        const swing = pose.moving ? Math.sin(t * 11) * 0.8 : 0;
        limbs.arms[0].rotation.x = swing;
        limbs.arms[1].rotation.x = -swing;
        limbs.legs[0].rotation.x = -swing;
        limbs.legs[1].rotation.x = swing;
        w.avatar.position.set(pose.x + 0.5, pose.z, pose.y + 0.5);
        // Il regarde là où il va. Le visage est vers -Z : pour regarder vers (dx, dy) (Y du plan = Z de la scène), on
        // tourne de atan2(-dx, -dy).
        if (pose.facing) heading = Math.atan2(-pose.facing.dx, -pose.facing.dy);
        if (!pose.moving) w.walk = null;
        else walking = true;
      }
      // Le voyage : le navire s'éloigne (départ) ou accoste (arrivée), le bonhomme à bord entre les deux marches.
      let sailing: { at: THREE.Vector3; k: number; stage: 1 | 2 | 3 } | null = null;
      const vy = voyageRef.current;
      if (vy && vehicleRef.current) {
        const v = vehicleRef.current;
        const f = voyageFrame(vy, v.port, now);
        // Accosté : le bonhomme débarque (le chemin d'embarquement à rebours).
        if (f.disembark) w.walk = f.disembark;
        const p = vehiclePath(vy.stage, f.k);
        vehicleGroup.position.set(v.origin.x + p.dx, v.origin.z + p.dz, v.origin.y + p.dy);
        vehicleGroup.rotation.x = -p.pitch;
        vehicleGroup.rotation.z = 0;
        if (f.aboard) {
          w.avatar.position.set(vehicleGroup.position.x + VEHICLE_DECK.x + 0.5, vehicleGroup.position.y + 1, vehicleGroup.position.z + VEHICLE_DECK.y + 0.5);
          heading = 0;
        }
        if (f.underway && !reduceMotion) {
          sailing = { at: vehicleGroup.position.clone(), k: f.progress, stage: vy.stage };
          // L'écume à la poupe (à la voile), la flamme qui vacille (au réacteur).
          if (vy.stage === 1 && now - vy.lastFoam > 100) {
            vy.lastFoam = now;
            const mesh = new THREE.Mesh(w.sparkGeo, new THREE.MeshBasicMaterial({ color: 0xf4f8fb, transparent: true, opacity: 0.9 }));
            mesh.position.set(vehicleGroup.position.x + 2.5 + (Math.random() - 0.5) * 3, vehicleGroup.position.y + 0.2, vehicleGroup.position.z + 8);
            w.scene.add(mesh);
            w.sparks.push({ mesh, velocity: new THREE.Vector3((Math.random() - 0.5) * 1.5, 1.2, 1.5), born: now });
          }
          flame.visible = vy.stage === 3;
          if (flame.visible) flame.scale.set(1, 1, 1 + 0.4 * Math.sin(t * 37) + 0.3 * Math.random());
        } else flame.visible = false;
        if (f.end) voyageEndRef.current?.();
      }
      // Il se tourne vers son cap en douceur, par le plus court.
      {
        const turn = Math.atan2(Math.sin(heading - w.avatar.rotation.y), Math.cos(heading - w.avatar.rotation.y));
        w.avatar.rotation.y += reduceMotion ? turn : turn * Math.min(1, dt * 12);
      }
      // La caméra rejoint sa place en douceur : le bonhomme tant qu'il marche (elle le suit pas à pas), puis l'île
      // ouverte, sinon le bonhomme.
      {
        const onMap = Boolean(mapRef.current) && !walking && !sailing;
        // En mer (ou dans les airs) : vue de côté sur le navire, la caméra s'écarte à mesure qu'il s'éloigne.
        const frame = sailing
          ? (() => {
              const dist = sailing.stage === 1 ? 22 + 12 * sailing.k : sailing.stage === 2 ? 22 + 26 * sailing.k : 26;
              const target = new THREE.Vector3(sailing.at.x + 2.5, sailing.at.y + (sailing.stage === 3 ? 4 : 1), sailing.at.z + 5);
              const len = Math.hypot(VOYAGE_VIEW.dx, VOYAGE_VIEW.dy, VOYAGE_VIEW.up);
              const pos = new THREE.Vector3(target.x + (dist * VOYAGE_VIEW.dx) / len, target.y + (dist * VOYAGE_VIEW.up) / len, target.z + (dist * VOYAGE_VIEW.dy) / len);
              return { target, pos };
            })()
          : framing(
                walking ? null : focusRef.current.island,
                w.avatar.position,
                camera.aspect,
                onMap,
                walking ? null : (homeRef.current ?? null),
                walking ? null : (focusRef.current.spot ?? null),
              );
        const { target, pos } = frame;
        camGoal.target.copy(target);
        camGoal.pos.copy(pos);
        w.beacon.visible = onMap && w.avatar.visible;
        // Sur la Carte, vue de très haut : pas de brume, tout le continent net. Archipéo : la brume de profondeur.
        fog.near = onMap ? width * 8 : archipeo ? ciel.brumeProche : width * 1.2;
        fog.far = onMap ? width * 16 : archipeo ? ciel.brumeLoin : width * 3;
        if (w.beacon.visible) {
          w.beacon.position.set(w.avatar.position.x, w.avatar.position.y + 8 + Math.abs(Math.sin(t * 2.2)) * 1.5, w.avatar.position.z);
          w.beacon.rotation.y = t * 0.8;
        }
        for (const mk of w.questMarks.children) {
          if (mk.userData.bob) {
            mk.position.y = mk.userData.base + Math.abs(Math.sin(t * 2.4 + mk.userData.phase)) * 0.5;
            mk.rotation.y = t * 1.2;
          } else mk.rotation.y = t * 0.4;
        }
        if (w.trail.children.length) {
          const pulse = 0.85 + Math.sin(t * 3) * 0.15;
          w.trail.scale.setScalar(1);
          for (const m of w.trail.children) m.scale.setScalar(pulse);
        }
        const dt = Math.min(0.1, (nowMs - lastFrame) / 1000 || 0.016);
        const k = reduceMotion ? 1 : 1 - Math.exp(-dt * 3.5);
        if (w.camTarget.lengthSq() === 0 && w.camPos.lengthSq() === 0) {
          w.camTarget.copy(target);
          w.camPos.copy(pos);
        } else {
          w.camTarget.lerp(target, k);
          w.camPos.lerp(pos, k);
        }
        camera.position.copy(w.camPos);
        camera.lookAt(w.camTarget);
      }
      if (!reduceMotion) {
        if (forceDayRef.current ? light !== 1 : false) applyDaylight();
        // Nuages qui dérivent, eau qui ondule.
        for (const cloud of clouds.children) {
          cloud.position.x -= 0.004;
          if (cloud.position.x < bounds.minX - 12) cloud.position.x = bounds.maxX + 12;
        }
        if (waterMat.map) waterMat.map.offset.set(t * 0.02, t * 0.013);
        if (floorTex) floorTex.offset.set(t * 0.004, t * 0.002);
        for (const b of birds) {
          const a = t * b.speed + b.phase;
          b.group.position.set(b.cx + Math.cos(a) * b.r, b.alt + Math.sin(t * 0.7 + b.phase) * 0.6, b.cy + Math.sin(a) * b.r);
          b.group.rotation.y = -a;
          const flap = Math.sin(t * 9 + b.phase) * 0.6;
          b.wings[0].rotation.z = flap;
          b.wings[1].rotation.z = -flap;
        }
        for (const [i, mist] of mists.entries()) mist.position.y += Math.sin(t * 0.4 + i) * 0.002;
        for (const wh of whales) {
          const a = t * wh.speed + wh.phase;
          // Elle monte et descend lentement ; en surface, elle souffle.
          const rise = Math.sin(t * 0.45 + wh.phase);
          wh.group.position.set(wh.cx + Math.cos(a) * wh.r, -0.9 + rise * 0.9, wh.cy + Math.sin(a) * wh.r);
          wh.group.rotation.y = -a - Math.PI / 2;
          wh.group.rotation.z = rise * 0.12;
          wh.fluke.rotation.z = Math.sin(t * 2.4 + wh.phase) * 0.35;
          const surfacing = rise > 0.7;
          wh.spout.visible = surfacing;
          if (surfacing) wh.spout.scale.setScalar(0.6 + (rise - 0.7) * 2.5);
        }
        if (markerGroup.visible) {
          markerGroup.position.y = markerGroup.userData.base + 0.5 + Math.abs(Math.sin(t * 2.2)) * 0.8;
          markerGroup.rotation.y = t * 0.8;
        }
        // Le Bloc-Navire tangue doucement sur l'eau (plane, plus lentement, dans le ciel) ; son ballon se balance.
        if (vehicleRef.current && !voyageRef.current) {
          const v = vehicleRef.current;
          vehicleGroup.position.y = v.origin.z + (v.afloat ? Math.sin(t * 1.8) * 0.08 : 0.3 + Math.sin(t * 0.9) * 0.15);
          vehicleGroup.rotation.z = v.afloat ? Math.sin(t * 1.3) * 0.015 : 0;
          balloonGroup.rotation.z = Math.sin(t * 1.3) * 0.04;
          balloonGroup.rotation.x = Math.sin(t * 0.9) * 0.03;
        }
        // Créatures : petit balancement, et un pas de temps en temps.
        for (const { group, stroll } of w.walkers) {
          const { dx, dy, bob } = strollAt(stroll, now, t);
          group.position.set(stroll.origin.x + dx, stroll.origin.z + bob, stroll.origin.y + dy);
        }
        // Éclats : petits cubes qui retombent et disparaissent.
        for (const s of [...w.sparks]) {
          const age = (now - s.born) / 1000;
          s.velocity.y -= 9 * 0.016;
          s.mesh.position.addScaledVector(s.velocity, 0.016);
          s.mesh.rotation.x += 0.2;
          s.mesh.rotation.z += 0.15;
          if (age > 0.7) {
            scene.remove(s.mesh);
            (s.mesh.material as THREE.Material).dispose();
            w.sparks.splice(w.sparks.indexOf(s), 1);
          }
        }
      } else if (forceDayRef.current ? light !== 1 : false) applyDaylight();
      // Le dôme du ciel suit la caméra : l'horizon ne s'approche jamais.
      dome?.mesh.position.copy(camera.position);
      const onMapNow = Boolean(mapRef.current) && !walking && !sailing;
      placeMarks(onMapNow, t);
      placeLabels(w.labels, onMapNow);
      renderer.render(scene, camera);
      meter?.tick(renderer.info, nowMs);
    };
    const start = () => {
      lastFrame = performance.now();
      loop();
    };
    start();

    return () => {
      cancelAnimationFrame(frame);
      seen.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      el.removeEventListener('keydown', onKey);
      if (dayTimer) window.clearInterval(dayTimer);
      observer.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onDown);
      renderer.domElement.removeEventListener('pointerup', onUp);
      renderer.domElement.removeEventListener('pointermove', onHover);
      renderer.domElement.removeEventListener('pointerleave', onLeave);
      hover.geometry.dispose();
      (hover.material as THREE.Material).dispose();
      for (const m of terrain.children) (m as THREE.Mesh).geometry.dispose();
      creaturesGroup.traverse((o) => {
        if (o instanceof THREE.Mesh) o.geometry.dispose();
      });
      for (const s of world.current?.sparks ?? []) (s.mesh.material as THREE.Material).dispose();
      sparkGeo.dispose();
      water.geometry.dispose();
      waterMat.map?.dispose();
      waterMat.dispose();
      cloudFloorMat.dispose();
      floorTex?.dispose();
      cloudGeo.dispose();
      dome?.dispose();
      arrowTex.dispose();
      mapArrow.material.dispose();
      meter?.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      world.current = null;
    };
    // La scène est construite une fois par archipel (sa mer, sa brume, ses baleines) ; le terrain, les créatures et la
    // caméra sont mis à jour à part. Le changement d'archipel se fait derrière l'écran du voyage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion, archipelago]);

  // ---- Terrain : une géométrie par matériau, faces visibles seulement
  useEffect(() => {
    const w = world.current;
    if (!w) return;
    for (const child of [...w.terrain.children]) {
      w.terrain.remove(child);
      (child as THREE.Mesh).geometry.dispose();
    }
    for (const g of buildMesh(cubes)) w.terrain.add(meshOf(g, w.surface));
  }, [cubes]);

  // ---- Créatures : un groupe chacune, positionné sur son île, animé dans la boucle
  useEffect(() => {
    const w = world.current;
    if (!w) return;
    for (const child of [...w.creatures.children]) {
      w.creatures.remove(child);
      child.traverse((o) => {
        if (o instanceof THREE.Mesh) o.geometry.dispose();
      });
    }
    const strolls = startStrolls(creatures, performance.now());
    w.walkers = creatures.map((c, i) => {
      const group = new THREE.Group();
      group.userData = { creature: c.id, kind: c.kind ?? 'creature' };
      for (const g of buildMesh(c.cubes)) group.add(meshOf(g, w.surface));
      group.position.set(c.origin.x, c.origin.z, c.origin.y);
      w.creatures.add(group);
      return { group, stroll: strolls[i] };
    });
  }, [creatures]);

  // ---- Le Bloc-Navire : la coque (tout ce qui est sous le mât) et le ballon, qui pivote au sommet du mât
  useEffect(() => {
    const w = world.current;
    if (!w) return;
    for (const part of [w.vehicle.hull, w.vehicle.balloon]) {
      for (const child of [...part.children]) {
        part.remove(child);
        (child as THREE.Mesh).geometry.dispose();
      }
    }
    if (!vehicle) {
      vehicleRef.current = null;
      w.vehicle.group.visible = false;
      return;
    }
    const MAST_TOP = 7;
    const hull = vehicle.cubes.filter((c) => c.z < MAST_TOP);
    const balloon = vehicle.cubes.filter((c) => c.z >= MAST_TOP).map((c) => ({ ...c, x: c.x - 2, y: c.y - 3, z: c.z - MAST_TOP }));
    for (const g of buildMesh(hull)) w.vehicle.hull.add(meshOf(g, w.surface));
    for (const g of buildMesh(balloon)) w.vehicle.balloon.add(meshOf(g, w.surface));
    w.vehicle.balloon.position.set(2, MAST_TOP, 3);
    w.vehicle.group.position.set(vehicle.origin.x, vehicle.origin.z, vehicle.origin.y);
    w.vehicle.group.rotation.set(0, 0, 0);
    w.vehicle.group.visible = true;
    vehicleRef.current = {
      origin: vehicle.origin,
      port: vehicle.port,
      afloat: vehicle.afloat,
      ghosts: new Set(vehicle.cubes.filter((c) => c.ghost).map((c) => `${c.x},${c.y},${c.z}`)),
    };
  }, [vehicle]);

  // ---- Le voyage : au départ, le bonhomme marche jusqu'au pont ; à l'arrivée, il est à bord et le navire accoste
  useEffect(() => {
    const w = world.current;
    if (!w) return;
    if (!voyage || voyage.seq === 0 || !vehicleRef.current) {
      voyageRef.current = null;
      if (vehicleRef.current) {
        const o = vehicleRef.current.origin;
        w.vehicle.group.position.set(o.x, o.z, o.y);
        w.vehicle.group.rotation.set(0, 0, 0);
      }
      return;
    }
    const now = performance.now();
    voyageRef.current = startVoyage(voyage, now);
    w.walk = boardingWalk(vehicleRef.current.port, voyageRef.current, now);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voyage?.seq, voyage?.leg]);

  // ---- La flèche « Commence ici » (sur une île, ou sur une case du monde : le chantier du navire)
  useEffect(() => {
    const w = world.current;
    if (!w) return;
    w.marker.userData.island = typeof marker === 'string' ? marker : null;
    w.marker.userData.on = Boolean(marker);
    if (!marker) {
      w.marker.visible = false;
      return;
    }
    const c = typeof marker === 'string' ? islandCenter(marker) : marker;
    const base = typeof marker === 'string' ? c.z + 8 : c.z;
    w.marker.userData.base = base;
    w.marker.position.set(c.x, base + 0.5, c.y);
    w.marker.visible = true;
    w.marker.userData.on = true;
  }, [marker]);

  // ---- Le nom des îles ouvertes (une texture par étiquette, refaite quand la liste change) ; sur la Carte, leur état
  const labelsKey = (islandLabels ?? []).map((l) => `${l.id}:${l.text}:${l.state?.id ?? ''}`).join('|');
  useEffect(() => {
    const w = world.current;
    if (!w) return;
    const dispose = () => {
      for (const s of [...w.labels.children] as THREE.Sprite[]) {
        s.material.map?.dispose();
        s.material.dispose();
        w.labels.remove(s);
      }
    };
    dispose();
    for (const l of islandLabels ?? []) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;
      const size = measureIslandLabel(ctx, l.text, LABEL_PX, l.state);
      canvas.width = Math.ceil(size.w + 4);
      canvas.height = Math.ceil(size.h + 4);
      drawIslandLabel(ctx, l.text, canvas.width / 2, canvas.height / 2, LABEL_PX, l.state);
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      // Archipéo : la brume de profondeur ne voile jamais un nom d'île (DA-02).
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthTest: false, transparent: true, sizeAttenuation: false, fog: rendu !== 'archipeo' }));
      // Taille fixe à l'écran (le nom à 18 px, l'état à 16 px), quel que soit le zoom : l'échelle suit la hauteur du
      // canvas, à chaque image (labelScreenScale).
      sprite.userData.px = { w: canvas.width * LABEL_CSS, h: canvas.height * LABEL_CSS };
      sprite.userData.fermee = l.state?.id === 'fermee';
      sprite.renderOrder = l.state?.id === 'fermee' ? 10 : 11;
      sprite.raycast = () => {};
      const c = islandCenter(l.id);
      sprite.position.set(c.x + 0.5, c.z + 12, c.y + 0.5);
      w.labels.add(sprite);
    }
    return dispose;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [labelsKey]);

  // ---- Mode chantier : pas de case visée en dehors
  useEffect(() => {
    const w = world.current;
    if (w) w.hover.visible = false;
  }, [Boolean(build)]);

  // ---- À la pose d'un bloc : trois poussières claires qui montent doucement, sans partir en tous sens
  useEffect(() => {
    const w = world.current;
    if (!w || !burst || burst.seq === 0 || reduceMotion) return;
    const color = new THREE.Color(burst.color).lerp(new THREE.Color('#ffffff'), 0.6);
    for (let i = 0; i < 3; i++) {
      const mesh = new THREE.Mesh(w.sparkGeo, new THREE.MeshBasicMaterial({ color }));
      mesh.position.set(burst.cell.x + 0.3 + i * 0.2, burst.cell.z + 0.8, burst.cell.y + 0.5);
      const velocity = new THREE.Vector3(0, 3.6 + i * 0.3, 0);
      w.scene.add(mesh);
      w.sparks.push({ mesh, velocity, born: performance.now() });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [burst?.seq]);

  // ---- Le bonhomme : ses cubes (une fois), puis chaque itinéraire
  useEffect(() => {
    const w = world.current;
    if (!w) return;
    w.avatar.visible = Boolean(avatar);
  }, [Boolean(avatar)]);
  useEffect(() => {
    const w = world.current;
    if (!w || !avatar || !avatar.route.length) return;
    // Six cases par seconde, mais jamais plus de six secondes de marche (un tap fait arriver tout de suite).
    w.walk = avatarWalk(avatar, performance.now());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avatar?.seq]);

  // ---- Les repères des bornes de mission : un losange jaune qui flotte (à faire), ou les étoiles gagnées en petits
  // cubes d'or empilés. Rien sur une île fermée.
  useEffect(() => {
    const w = world.current;
    if (!w) return;
    for (const child of [...w.questMarks.children]) {
      w.questMarks.remove(child);
      child.traverse((o) => {
        if (o instanceof THREE.Mesh) o.geometry.dispose();
      });
    }
    if (!quests?.length) return;
    const gold = (w.marker.children[0] as THREE.Mesh).material;
    quests.forEach((q, i) => {
      if (q.state === 'locked' || q.state === 0) return;
      const g = new THREE.Group();
      g.userData = { quest: q.id, phase: i * 0.7 };
      const base = q.cell.z + 3.4;
      if (q.state === 'new') {
        const m = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), gold);
        m.rotation.x = Math.PI / 4;
        m.rotation.z = Math.PI / 4;
        g.add(m);
        g.userData.bob = true;
        g.userData.base = base;
      } else {
        for (let k = 0; k < q.state; k++) {
          const m = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.45), gold);
          m.position.y = k * 0.6;
          m.rotation.y = Math.PI / 4;
          g.add(m);
        }
      }
      g.position.set(q.cell.x + 0.5, base, q.cell.y + 0.5);
      w.questMarks.add(g);
    });
  }, [quests]);

  // ---- Le chemin à construire (sur la Carte) : une balise toutes les deux cases, au-dessus du sol.
  useEffect(() => {
    const w = world.current;
    if (!w) return;
    for (const child of [...w.trail.children]) {
      w.trail.remove(child);
      (child as THREE.Mesh).geometry.dispose();
    }
    if (!trail?.length) return;
    const mat = (w.marker.children[0] as THREE.Mesh).material;
    trail.forEach((c, i) => {
      if (i % 3) return;
      const m = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.2, 2.2), mat);
      m.position.set(c.x + 0.5, c.z + 3.5, c.y + 0.5);
      m.rotation.y = Math.PI / 4;
      w.trail.add(m);
    });
  }, [trail]);

  // ---- Caméra : l'île demandée (ou le bonhomme) est rejointe en douceur par la boucle ; au premier cadrage, d'un coup.
  useEffect(() => {
    const w = world.current;
    if (!w || focus.seq !== 0) return;
    const { target, pos } = framing(focus.island, w.avatar.position, w.camera.aspect, Boolean(map), home ?? null, focus.spot ?? null);
    w.camTarget.copy(target);
    w.camPos.copy(pos);
    w.camera.position.copy(pos);
    w.camera.lookAt(target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus.island, focus.seq]);

  return (
    <div ref={host} className={`voxel-canvas ${className ?? ''}`.trim()} data-rendu={rendu} role="img" aria-label={`${label}. Au clavier : les flèches vont à l'île voisine.`} />
  );
}
