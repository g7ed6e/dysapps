// Le village en 3D : un seul maillage par matériau (faces visibles seulement), caméra libre bornée,
// eau autour des îles, vol vers une île, jour et nuit, créatures qui se promènent. Chargé à la demande (voir ./index.ts).
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { type BiomeId } from '../biomes';
import type { VoxelCube } from '../Voxel';
import { AMBIENCE, daylight, palette } from '../world/daylight';
import { buildMesh, type FaceSide, type MeshGroup } from '../world/mesher';
import { CREATURE_STEPS, boardingRoute, islandAt, islandCenter, mistPatches, viewYaw, viewZone, whaleSpots, worldBounds, type VehiclePlacement } from '../world/terrain';
import { VEHICLE_DECK } from '../world/harbour';
import { legTiming, vehiclePath, type LegTiming, type VoyageLeg } from '../world/voyage';
import { islandsOf, type ArchipelagoId } from '../world/archipelago';
import { AVATAR_PARTS, AVATAR_SCALE } from '../Avatar';
import { blockMaterial, tintedMaterial, type TextureKind } from './textures';

export interface WorldFocus {
  /** Île à cadrer, ou `null` pour la vue d'ensemble. */
  island: BiomeId | null;
  /** Change à chaque demande, pour pouvoir redemander la même île. */
  seq: number;
}

export interface Cell {
  x: number;
  y: number;
  z: number;
}

export interface BuildProps {
  /** Face touchée : le bloc touché (`cell`) et la case voisine, devant la face (`next`). */
  onPickFace: (cell: Cell, next: Cell) => void;
}

export interface CreaturePlacement {
  id: BiomeId;
  cubes: VoxelCube[];
  origin: Cell;
  /** Une créature se promène ; un Gardien reste sur son îlot. */
  kind?: 'creature' | 'guardian';
  still?: boolean;
  /** Les pas possibles depuis sa place (sinon ceux par défaut). */
  steps?: [number, number][];
}

export interface QuestMark {
  /** « île:quête ». */
  id: string;
  biome: BiomeId;
  typeId: string;
  /** La case du socle (z : le sol sous le socle). */
  cell: Cell;
  /** `'new'` : à faire (repère jaune) ; un nombre : les étoiles gagnées ; `'locked'` : rien. */
  state: 'new' | 'locked' | number;
}

/** Éclats de couleur à un endroit du monde (pose d'un bloc) ; `seq` change à chaque demande. */
export interface Burst {
  seq: number;
  cell: Cell;
  color: string;
}

export interface WorldCanvasProps {
  /** L'archipel affiché : la scène (mer, brume, baleines, cadrage) est la sienne. */
  archipelago: ArchipelagoId;
  cubes: VoxelCube[];
  focus: WorldFocus;
  reduceMotion?: boolean;
  /** Le Bloc-Navire amarré au port : ses cubes locaux (fantômes pour les cases à poser), animé à part. */
  vehicle?: VehiclePlacement | null;
  /** Le navire touché (hors d'une case à poser) : on ouvre le panneau du port sur sa section. */
  onPickVehicle?: (port: BiomeId) => void;
  /** Le voyage en cours : le départ (le bonhomme embarque, le navire s'éloigne) ou l'arrivée (il accoste, le bonhomme débarque). */
  voyage?: { seq: number; leg: VoyageLeg; stage: 1 | 2 | 3; back: boolean } | null;
  /** Le temps du voyage est joué jusqu'au bout. */
  onVoyageLegEnd?: () => void;
  /** Un toucher ou une touche pendant le voyage : on arrive tout de suite. */
  onVoyageSkip?: () => void;
  /** Île touchée (un tap, pas un glissé), sur l'île elle-même. */
  onPickIsland?: (id: BiomeId) => void;
  /** Ouvrage touché (construit ou fantôme) : son identifiant. */
  onPickBridge?: (id: string) => void;
  /** Mode chantier : on touche une face (un fantôme du plan) au lieu d'entrer dans l'île. */
  build?: BuildProps;
  /** Les créatures, animées à part du terrain. */
  creatures?: CreaturePlacement[];
  onPickCreature?: (id: BiomeId, kind: 'creature' | 'guardian') => void;
  /** Ignorer l'heure réelle : toujours en plein jour. */
  forceDay?: boolean;
  /** Les ouvrages construits : la vue d'ensemble cadre les îles ouvertes et leurs voisines. */
  bridges?: string[];
  /** Une flèche jaune qui flotte au-dessus d'une île (« Commence ici »), ou d'une case du monde (le chantier du navire). */
  marker?: BiomeId | Cell | null;
  /** Le bonhomme : son itinéraire (un seul point : il se tient là ; plusieurs : il marche). `seq` change à chaque trajet. */
  avatar?: { route: Cell[]; seq: number };
  /** La Carte : tout le continent vu du ciel, un fanion au-dessus du bonhomme. */
  map?: boolean;
  /** L'île où le bonhomme se tient (ou se rend) : la caméra cadre cette île et ses voisines, tournée vers le continent. */
  home?: BiomeId;
  /** Un chemin à construire, montré par des balises jaunes qui flottent au-dessus de ses cases. */
  trail?: Cell[];
  /** Les bornes de quête : leur case et leur état (à faire, étoiles gagnées, fermée), pour le repère au-dessus. */
  quests?: QuestMark[];
  /** Borne de quête touchée (le socle, le panneau ou son repère). */
  onPickQuest?: (biome: BiomeId, typeId: string) => void;
  burst?: Burst;
  className?: string;
  label: string;
}

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
/** Le voyage : vue de côté, depuis l'ouest, la caméra qui s'écarte à mesure que le navire s'éloigne. */
const VOYAGE_VIEW = { dx: -0.85, dy: -0.4, up: 0.3 };
/** Le bonhomme marche à six cases par seconde ; au-delà de six secondes, il accélère. */
const WALK_SPEED = 6;
const WALK_MAX_MS = 6000;

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

function meshOf(g: MeshGroup): THREE.Mesh {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(g.positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(g.normals, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(g.uvs, 2));
  geo.setIndex(g.indices);
  const mesh = new THREE.Mesh(geo, materialFor(g.texture, g.face, g.color, g.ghost, g.muted));
  if (g.ghost) mesh.renderOrder = 1;
  // Les faces cachées ne sont plus là : on peut renoncer au tri par la taille de la scène.
  mesh.frustumCulled = false;
  return mesh;
}

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

interface Walker {
  group: THREE.Group;
  id: BiomeId;
  still: boolean;
  steps: [number, number][];
  origin: Cell;
  from: [number, number];
  to: [number, number];
  start: number;
  duration: number;
  /** Prochain départ (ms). */
  next: number;
  phase: number;
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
  burst,
  className,
  label,
}: WorldCanvasProps) {
  const host = useRef<HTMLDivElement>(null);
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
    avatar: THREE.Group;
    walk: { route: Cell[]; start: number; duration: number } | null;
    /** Le Bloc-Navire : la coque (qui tangue) et le ballon (qui se balance au sommet du mât). */
    vehicle: { group: THREE.Group; hull: THREE.Group; balloon: THREE.Group };
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
  const voyageRef = useRef<{ leg: VoyageLeg; stage: 1 | 2 | 3; timing: LegTiming; start: number; ended: boolean; disembarked: boolean; lastFoam: number } | null>(null);
  /** Le navire : son groupe, son origine dans le monde et les cases fantômes que l'on peut poser. */
  const vehicleRef = useRef<{ origin: { x: number; y: number; z: number }; ghosts: Set<string>; afloat: boolean; port: BiomeId } | null>(null);
  const pickBridgeRef = useRef(onPickBridge);
  pickBridgeRef.current = onPickBridge;
  const pickQuestRef = useRef(onPickQuest);
  pickQuestRef.current = onPickQuest;
  // Les cubes des bornes de quête, par case : pour savoir quelle quête on touche.
  const questCells = useRef(new Map<string, string>());
  // Les cubes des ouvrages, par case : pour savoir quel ouvrage on touche.
  const bridgeCells = useRef(new Map<string, string>());
  useEffect(() => {
    const m = new Map<string, string>();
    const q = new Map<string, string>();
    for (const c of cubes) {
      if (c.bridge) m.set(`${c.x},${c.y},${c.z}`, c.bridge);
      if (c.quest) q.set(`${c.x},${c.y},${c.z}`, c.quest);
    }
    bridgeCells.current = m;
    questCells.current = q;
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

  const focusRef = useRef(focus.island);
  focusRef.current = focus.island;

  /**
   * Où la caméra veut être : sur l'île ouverte (vue rapprochée), sinon autour du bonhomme. La caméra est gérée par
   * l'application : pas de zoom ni de rotation ; on touche une île pour y aller. En portrait, un peu plus loin pour
   * que tout tienne dans la largeur.
   */
  const framing = (island: BiomeId | null, avatarAt: THREE.Vector3, aspect: number, onMap = false, zone: BiomeId | null = null) => {
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
    let c = island ? islandCenter(island) : avatar;
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

    const scene = new THREE.Scene();
    // L'ambiance de l'archipel : ciel, mer (ou nuages), brouillard, sol.
    const ambience = AMBIENCE[archipelago];
    const day = palette(1, archipelago);
    scene.background = new THREE.Color(day.sky);
    const fog = new THREE.Fog(day.sky, width * ambience.fog[0], width * ambience.fog[1]);
    scene.fog = fog;
    const camera = new THREE.PerspectiveCamera(40, el.clientWidth / Math.max(1, el.clientHeight), 0.5, width * 10);
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
      const dirs: Record<string, [number, number]> = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] };
      const dir = dirs[e.key];
      if (!dir || !pickRef.current) return;
      e.preventDefault();
      const w = world.current;
      const from = w ? { x: w.camTarget.x, y: w.camTarget.z } : center;
      let best: { id: BiomeId; score: number } | null = null;
      for (const b of islandsOf(archRef.current)) {
        const c = islandCenter(b.id);
        const dx = c.x - from.x;
        const dy = c.y - from.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 4) continue;
        const along = (dx * dir[0] + dy * dir[1]) / dist;
        if (along < 0.5) continue;
        const score = dist / along;
        if (!best || score < best.score) best = { id: b.id, score };
      }
      if (best) pickRef.current(best.id);
    };
    el.addEventListener('keydown', onKey);

    const hemi = new THREE.HemisphereLight(0xffffff, day.ground, day.ambient);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(day.sun, day.sunIntensity);
    sun.position.set(40, 60, 20);
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
    // Plus d'oiseaux et plus haut dans les Monts de Feu ; tout en haut dans les Îles du Ciel.
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
    const trailGroup = new THREE.Group();
    scene.add(trailGroup);
    const questMarksGroup = new THREE.Group();
    scene.add(questMarksGroup);

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
      for (const g of buildMesh(part.cubes)) inner.add(meshOf(g));
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
      avatar: avatarGroup,
      walk: null,
      vehicle: { group: vehicleGroup, hull: hullGroup, balloon: balloonGroup },
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
      const walking = world.current?.walk;
      if (walking && performance.now() - walking.start < walking.duration) {
        walking.start = performance.now() - walking.duration;
        return;
      }
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
      const { cell, next } = cellsOf(hit);
      // Une borne de quête : sa quête.
      const questId = questCells.current.get(`${cell.x},${cell.y},${cell.z}`);
      if (questId && pickQuestRef.current) {
        const [biome, typeId] = questId.split(':');
        return pickQuestRef.current(biome as BiomeId, typeId);
      }
      // Un ouvrage (construit ou fantôme) : sa proposition, plutôt que l'île la plus proche.
      const bridgeId = bridgeCells.current.get(`${cell.x},${cell.y},${cell.z}`);
      if (bridgeId && pickBridgeRef.current) return pickBridgeRef.current(bridgeId);
      if (buildRef.current) buildRef.current.onPickFace(cell, next);
      else pickRef.current?.(islandAt(archRef.current, Math.floor(hit.point.x), Math.floor(hit.point.z)));
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
        const { route, start, duration } = w.walk;
        const k = reduceMotion ? 1 : Math.min(1, (now - start) / duration);
        const pos = k * (route.length - 1);
        const i = Math.min(route.length - 2, Math.floor(pos));
        const f = pos - i;
        const a = route[i];
        const b = route[i + 1];
        const x = a.x + (b.x - a.x) * f;
        const y = a.y + (b.y - a.y) * f;
        const z = a.z + (b.z - a.z) * f;
        const swing = k < 1 ? Math.sin(t * 11) * 0.8 : 0;
        limbs.arms[0].rotation.x = swing;
        limbs.arms[1].rotation.x = -swing;
        limbs.legs[0].rotation.x = -swing;
        limbs.legs[1].rotation.x = swing;
        w.avatar.position.set(x + 0.5, z, y + 0.5);
        // Il regarde là où il va : un point un peu plus loin sur l'itinéraire (les tracés en escalier alternent pas
        // droits et pas en diagonale, on ne veut pas qu'il se tortille à chaque case).
        const ahead = Math.min(route.length - 1, pos + 1.5);
        const j = Math.min(route.length - 2, Math.floor(ahead));
        const g = ahead - j;
        const dx = route[j].x + (route[j + 1].x - route[j].x) * g - x;
        const dy = route[j].y + (route[j + 1].y - route[j].y) * g - y;
        // Le visage est vers -Z : pour regarder vers (dx, dy) (Y du plan = Z de la scène), on tourne de atan2(-dx, -dy).
        if (Math.hypot(dx, dy) > 0.05) heading = Math.atan2(-dx, -dy);
        if (k >= 1) w.walk = null;
        else walking = true;
      }
      // Le voyage : le navire s'éloigne (départ) ou accoste (arrivée), le bonhomme à bord entre les deux marches.
      let sailing: { at: THREE.Vector3; k: number; stage: 1 | 2 | 3 } | null = null;
      const vy = voyageRef.current;
      if (vy && vehicleRef.current) {
        const v = vehicleRef.current;
        const elapsed = now - vy.start;
        const { walk: walkMs, sail: sailMs } = vy.timing;
        let k: number;
        if (vy.leg === 'depart') k = Math.max(0, Math.min(1, (elapsed - walkMs) / sailMs));
        else {
          k = 1 - Math.max(0, Math.min(1, elapsed / sailMs));
          // Accosté : le bonhomme débarque (le chemin d'embarquement à rebours).
          if (elapsed >= sailMs && !vy.disembarked) {
            vy.disembarked = true;
            w.walk = { route: [...boardingRoute(v.port)].reverse(), start: now, duration: Math.max(1, walkMs) };
          }
        }
        const p = vehiclePath(vy.stage, k);
        vehicleGroup.position.set(v.origin.x + p.dx, v.origin.z + p.dz, v.origin.y + p.dy);
        vehicleGroup.rotation.x = -p.pitch;
        vehicleGroup.rotation.z = 0;
        const aboard = vy.leg === 'depart' ? elapsed >= walkMs : !vy.disembarked;
        if (aboard) {
          w.avatar.position.set(vehicleGroup.position.x + VEHICLE_DECK.x + 0.5, vehicleGroup.position.y + 1, vehicleGroup.position.z + VEHICLE_DECK.y + 0.5);
          heading = 0;
        }
        const underway = k > 0 && k < 1;
        if (underway && !reduceMotion) {
          sailing = { at: vehicleGroup.position.clone(), k: vy.leg === 'depart' ? k : 1 - k, stage: vy.stage };
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
        if (elapsed >= walkMs + sailMs && !vy.ended) {
          vy.ended = true;
          voyageEndRef.current?.();
        }
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
          : framing(walking ? null : focusRef.current, w.avatar.position, camera.aspect, onMap, walking ? null : (homeRef.current ?? null));
        const { target, pos } = frame;
        w.beacon.visible = onMap && w.avatar.visible;
        // Sur la Carte, vue de très haut : pas de brume, tout le continent net.
        fog.near = onMap ? width * 8 : width * 1.2;
        fog.far = onMap ? width * 16 : width * 3;
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
        for (const wk of w.walkers) {
          if (!wk.still && now >= wk.next && wk.start === 0) {
            const step = wk.steps[Math.floor(Math.random() * wk.steps.length)];
            wk.from = wk.to;
            wk.to = step;
            wk.start = now;
            wk.duration = 1800;
          }
          let dx = wk.to[0];
          let dy = wk.to[1];
          if (wk.start) {
            const k = ease(Math.min(1, (now - wk.start) / wk.duration));
            dx = wk.from[0] + (wk.to[0] - wk.from[0]) * k;
            dy = wk.from[1] + (wk.to[1] - wk.from[1]) * k;
            if (k >= 1) {
              wk.start = 0;
              wk.next = now + 3000 + Math.random() * 5000;
            }
          }
          const bob = wk.start ? Math.abs(Math.sin(t * 8)) * 0.12 : Math.sin(t * 1.6 + wk.phase) * 0.04;
          wk.group.position.set(wk.origin.x + dx, wk.origin.z + bob, wk.origin.y + dy);
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
      renderer.render(scene, camera);
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
    for (const g of buildMesh(cubes)) w.terrain.add(meshOf(g));
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
    w.walkers = creatures.map((c, i) => {
      const group = new THREE.Group();
      group.userData = { creature: c.id, kind: c.kind ?? 'creature' };
      for (const g of buildMesh(c.cubes)) group.add(meshOf(g));
      group.position.set(c.origin.x, c.origin.z, c.origin.y);
      w.creatures.add(group);
      return {
        group,
        id: c.id,
        still: Boolean(c.still) || (c.steps?.length ?? 2) < 2,
        steps: c.steps ?? CREATURE_STEPS,
        origin: c.origin,
        from: [0, 0],
        to: [0, 0],
        start: 0,
        duration: 0,
        next: performance.now() + 2000 + i * 1500,
        phase: i * 1.3,
      };
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
    for (const g of buildMesh(hull)) w.vehicle.hull.add(meshOf(g));
    for (const g of buildMesh(balloon)) w.vehicle.balloon.add(meshOf(g));
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
    const timing = legTiming(voyage.leg, voyage.back);
    const now = performance.now();
    voyageRef.current = { leg: voyage.leg, stage: voyage.stage, timing, start: now, ended: false, disembarked: false, lastFoam: 0 };
    if (voyage.leg === 'depart') w.walk = { route: boardingRoute(vehicleRef.current.port), start: now, duration: Math.max(1, timing.walk) };
    else w.walk = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voyage?.seq, voyage?.leg]);

  // ---- La flèche « Commence ici » (sur une île, ou sur une case du monde : le chantier du navire)
  useEffect(() => {
    const w = world.current;
    if (!w) return;
    if (!marker) {
      w.marker.visible = false;
      return;
    }
    const c = typeof marker === 'string' ? islandCenter(marker) : marker;
    const base = typeof marker === 'string' ? c.z + 8 : c.z;
    w.marker.userData.base = base;
    w.marker.position.set(c.x, base + 0.5, c.y);
    w.marker.visible = true;
  }, [marker]);

  // ---- Mode chantier : pas de case visée en dehors
  useEffect(() => {
    const w = world.current;
    if (w) w.hover.visible = false;
  }, [Boolean(build)]);

  // ---- Éclats à la pose d'un bloc
  useEffect(() => {
    const w = world.current;
    if (!w || !burst || burst.seq === 0 || reduceMotion) return;
    const color = new THREE.Color(burst.color);
    for (let i = 0; i < 10; i++) {
      const mesh = new THREE.Mesh(w.sparkGeo, new THREE.MeshBasicMaterial({ color }));
      mesh.position.set(burst.cell.x + 0.5, burst.cell.z + 0.5, burst.cell.y + 0.5);
      const a = Math.random() * Math.PI * 2;
      const velocity = new THREE.Vector3(Math.cos(a) * (1 + Math.random() * 2), 3 + Math.random() * 3, Math.sin(a) * (1 + Math.random() * 2));
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
    const route = avatar.route;
    let length = 0;
    for (let i = 1; i < route.length; i++) length += Math.hypot(route[i].x - route[i - 1].x, route[i].y - route[i - 1].y);
    // Six cases par seconde, mais jamais plus de six secondes de marche (un tap fait arriver tout de suite).
    const duration = route.length < 2 || avatar.seq === 0 ? 0 : Math.min(WALK_MAX_MS, (length / WALK_SPEED) * 1000);
    w.walk = { route: route.length < 2 ? [route[0], route[0]] : route, start: performance.now(), duration: Math.max(1, duration) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avatar?.seq]);

  // ---- Les repères des bornes de quête : un losange jaune qui flotte (à faire), ou les étoiles gagnées en petits
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
    const { target, pos } = framing(focus.island, w.avatar.position, w.camera.aspect, Boolean(map), home ?? null);
    w.camTarget.copy(target);
    w.camPos.copy(pos);
    w.camera.position.copy(pos);
    w.camera.lookAt(target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus.island, focus.seq]);

  return (
    <div ref={host} className={`voxel-canvas ${className ?? ''}`.trim()} role="img" aria-label={`${label}. Au clavier : les flèches vont à l'île voisine.`} />
  );
}
