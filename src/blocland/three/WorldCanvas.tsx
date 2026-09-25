// Le village en 3D : un seul maillage par matériau (faces visibles seulement), caméra libre bornée,
// eau autour des îles, vol vers une île, jour et nuit, créatures qui se promènent. Chargé à la demande (voir ./index.ts).
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { BiomeId } from '../biomes';
import type { VoxelCube } from '../Voxel';
import { daylight, palette } from '../world/daylight';
import { buildMesh, type FaceSide, type MeshGroup } from '../world/mesher';
import { islandAt, islandCenter, worldBounds } from '../world/terrain';
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
  /** Zone libre mise en évidence (coordonnées du monde, bornes hautes exclues). */
  zone: { x0: number; y0: number; x1: number; y1: number };
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
}

/** Éclats de couleur à un endroit du monde (pose d'un bloc) ; `seq` change à chaque demande. */
export interface Burst {
  seq: number;
  cell: Cell;
  color: string;
}

export interface WorldCanvasProps {
  cubes: VoxelCube[];
  focus: WorldFocus;
  reduceMotion?: boolean;
  /** Île touchée (un tap, pas un glissé), sur l'île elle-même ou sur le pont qui y mène. */
  onPickIsland?: (id: BiomeId) => void;
  /** Mode construction : on touche une face pour poser ou retirer, au lieu d'entrer dans l'île. */
  build?: BuildProps;
  /** Les créatures, animées à part du terrain. */
  creatures?: CreaturePlacement[];
  onPickCreature?: (id: BiomeId, kind: 'creature' | 'guardian') => void;
  /** Ignorer l'heure réelle : toujours en plein jour. */
  forceDay?: boolean;
  burst?: Burst;
  /** Sensibilité de la caméra (rotation, zoom, déplacement). */
  cameraSpeed?: number;
  className?: string;
  label: string;
}

/** Hauteur de l'eau : les deux couches de terre affleurent, le sol reste bien au-dessus. */
const WATER_LEVEL = -0.45;
/** Direction de la caméra (x, y de la grille) et hauteur relative : vue de trois quarts, côté visage des créatures. */
const VIEW = { dx: 0.3, dy: -0.95, up: 0.55 };
/** Vue d'une île : plus haute, pour voir le plan au fond et la zone libre devant. */
const ISLAND_VIEW = { dx: 0.7, dy: -0.7, up: 0.9 };
const ISLAND_DISTANCE = 24;
const FLIGHT_MS = 700;
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
/** Promenade des créatures : un pas d'une case, à gauche ou en arrière, jamais vers la zone libre ni les plans. */
const STEPS: [number, number][] = [
  [0, 0],
  [-1, 0],
  [0, 1],
  [-1, 1],
];

const ghostCache = new Map<string, THREE.Material>();

/** Matériau d'une face : les blocs texturés partagent les matériaux (cache), le reste est une couleur grainée. */
function materialFor(texture: string | undefined, face: FaceSide, color: string | undefined, ghost = false): THREE.Material {
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
  // La lanterne brille (surtout la nuit).
  if (texture === 'lanterne') {
    let m = ghostCache.get('lit:lanterne');
    if (!m) {
      const base = blockMaterial('lanterne');
      const src = (Array.isArray(base) ? base[0] : base) as THREE.MeshLambertMaterial;
      m = new THREE.MeshLambertMaterial({ map: src.map, emissive: 0xffb830, emissiveIntensity: 0.55 });
      ghostCache.set('lit:lanterne', m);
    }
    return m;
  }
  const m = blockMaterial(texture as TextureKind);
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
  const mesh = new THREE.Mesh(geo, materialFor(g.texture, g.face, g.color, g.ghost));
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
  cubes,
  focus,
  reduceMotion = false,
  cameraSpeed = 1,
  onPickIsland,
  build,
  creatures = [],
  onPickCreature,
  forceDay = false,
  burst,
  className,
  label,
}: WorldCanvasProps) {
  const host = useRef<HTMLDivElement>(null);
  const world = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    terrain: THREE.Group;
    creatures: THREE.Group;
    walkers: Walker[];
    sparks: Spark[];
    sparkGeo: THREE.BoxGeometry;
    zone: THREE.Mesh;
    hover: THREE.LineSegments;
    sky: { hemi: THREE.HemisphereLight; sun: THREE.DirectionalLight; water: THREE.MeshLambertMaterial; fog: THREE.Fog };
    flight: { fromPos: THREE.Vector3; fromTarget: THREE.Vector3; toPos: THREE.Vector3; toTarget: THREE.Vector3; start: number } | null;
  } | null>(null);
  const pickRef = useRef(onPickIsland);
  pickRef.current = onPickIsland;
  const buildRef = useRef(build);
  buildRef.current = build;
  const creatureRef = useRef(onPickCreature);
  creatureRef.current = onPickCreature;
  const forceDayRef = useRef(forceDay);
  forceDayRef.current = forceDay;
  const bounds = worldBounds();
  const center = { x: (bounds.minX + bounds.maxX) / 2, y: (bounds.minY + bounds.maxY) / 2 };
  // Étendue la plus grande de l'archipel (largeur ou profondeur) : sert au cadrage, à la brume et au zoom maximal.
  const width = Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);

  /** Position et cible de la caméra pour une île (ou la vue d'ensemble). */
  const framing = (island: BiomeId | null) => {
    const c = island ? islandCenter(island) : center;
    const d = island ? ISLAND_DISTANCE : width * 0.8 + 6;
    const target = new THREE.Vector3(c.x, 1, c.y);
    const v = island ? ISLAND_VIEW : VIEW;
    const pos = new THREE.Vector3(c.x + d * v.dx, 1 + d * v.up, c.y + d * v.dy);
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
    const day = palette(1);
    scene.background = new THREE.Color(day.sky);
    const fog = new THREE.Fog(day.sky, width * 1.2, width * 3);
    scene.fog = fog;
    const camera = new THREE.PerspectiveCamera(40, el.clientWidth / Math.max(1, el.clientHeight), 0.5, width * 4);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !reduceMotion;
    controls.dampingFactor = 0.08;
    // Un doigt : tourner ; deux doigts : se déplacer et zoomer. À la souris : glisser, molette, clic droit.
    controls.enablePan = true;
    controls.screenSpacePanning = false;
    controls.maxPolarAngle = Math.PI * 0.46;
    controls.minDistance = 6;
    controls.maxDistance = width * 1.6;
    // Clavier : flèches pour se déplacer, + et − pour zoomer (le canvas prend le focus).
    el.tabIndex = 0;
    controls.listenToKeyEvents(el);
    controls.keyPanSpeed = 14;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '+' && e.key !== '-' && e.key !== '=') return;
      e.preventDefault();
      const dir = camera.position.clone().sub(controls.target);
      const factor = e.key === '-' ? 1.2 : 1 / 1.2;
      const d = THREE.MathUtils.clamp(dir.length() * factor, controls.minDistance, controls.maxDistance);
      camera.position.copy(controls.target).addScaledVector(dir.normalize(), d);
      controls.update();
    };
    el.addEventListener('keydown', onKey);

    // On ne sort pas du monde : la cible reste au-dessus des îles, la caméra suit.
    const margin = 6;
    const clamp = () => {
      const t = controls.target;
      const cx = THREE.MathUtils.clamp(t.x, bounds.minX - margin, bounds.maxX + margin);
      const cz = THREE.MathUtils.clamp(t.z, bounds.minY - margin, bounds.maxY + margin);
      const cy = THREE.MathUtils.clamp(t.y, 0, 6);
      const dx = cx - t.x;
      const dy = cy - t.y;
      const dz = cz - t.z;
      if (dx || dy || dz) {
        t.set(cx, cy, cz);
        camera.position.x += dx;
        camera.position.y += dy;
        camera.position.z += dz;
      }
    };
    controls.addEventListener('change', clamp);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x8a6a4a, day.ambient);
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
    scene.add(water);

    // Nuages en cubes, au-dessus du monde.
    const cloudGeo = new THREE.BoxGeometry(1, 0.5, 1.2);
    const clouds = new THREE.Group();
    for (const [fx, fy, len] of CLOUDS) {
      const cloud = new THREE.Group();
      for (let i = 0; i < len; i++) {
        const puff = new THREE.Mesh(cloudGeo, blockMaterial('nuage'));
        puff.position.set(i, (i % 2) * 0.5, 0);
        cloud.add(puff);
      }
      cloud.position.set(bounds.minX + fx * width, 12, bounds.minY + fy * (bounds.maxY - bounds.minY));
      clouds.add(cloud);
    }
    scene.add(clouds);

    const terrain = new THREE.Group();
    scene.add(terrain);
    const creaturesGroup = new THREE.Group();
    scene.add(creaturesGroup);
    // Zone libre (mode construction) : un tapis translucide au ras du sol ; et le contour de la case visée.
    const zone = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ color: 0xffe066, transparent: true, opacity: 0.35, depthWrite: false }),
    );
    zone.rotation.x = -Math.PI / 2;
    zone.visible = false;
    scene.add(zone);
    const hover = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.02, 1.02, 1.02)), new THREE.LineBasicMaterial({ color: 0x1e6fd9 }));
    hover.visible = false;
    scene.add(hover);
    const sparkGeo = new THREE.BoxGeometry(0.18, 0.18, 0.18);
    world.current = {
      scene,
      camera,
      renderer,
      controls,
      terrain,
      creatures: creaturesGroup,
      walkers: [],
      sparks: [],
      sparkGeo,
      zone,
      hover,
      sky: { hemi, sun, water: waterMat, fog },
      flight: null,
    };

    // Toucher une île, une face ou une créature : un tap, pas un glissé.
    const ray = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let down: { x: number; y: number } | null = null;
    const aim = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
      ray.setFromCamera(pointer, camera);
      const creature = ray.intersectObjects(creaturesGroup.children, true)[0];
      const ground = ray.intersectObjects(terrain.children, false)[0];
      if (creature && (!ground || creature.distance < ground.distance)) return { creature, hit: undefined };
      return { creature: undefined, hit: ground };
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
      const { creature, hit } = aim(e);
      if (creature) {
        const found = creatureIdOf(creature.object);
        if (found && creatureRef.current) return creatureRef.current(found.id, found.kind);
        if (found && !buildRef.current) return pickRef.current?.(found.id);
      }
      if (!hit) return;
      if (buildRef.current) {
        const { cell, next } = cellsOf(hit);
        buildRef.current.onPickFace(cell, next);
      } else pickRef.current?.(islandAt(Math.floor(hit.point.x), Math.floor(hit.point.z)));
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
      const p = palette(light);
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
      lastFrame = nowMs;
      const w = world.current;
      if (!w) return;
      const now = performance.now();
      const t = clock.getElapsedTime();
      if (w.flight) {
        const k = ease(Math.min(1, (now - w.flight.start) / FLIGHT_MS));
        camera.position.lerpVectors(w.flight.fromPos, w.flight.toPos, k);
        controls.target.lerpVectors(w.flight.fromTarget, w.flight.toTarget, k);
        if (k >= 1) w.flight = null;
      }
      if (!reduceMotion) {
        if (forceDayRef.current ? light !== 1 : false) applyDaylight();
        // Nuages qui dérivent, eau qui ondule.
        for (const cloud of clouds.children) {
          cloud.position.x -= 0.004;
          if (cloud.position.x < bounds.minX - 12) cloud.position.x = bounds.maxX + 12;
        }
        if (waterMat.map) waterMat.map.offset.set(t * 0.02, t * 0.013);
        // Créatures : petit balancement, et un pas de temps en temps.
        for (const wk of w.walkers) {
          if (!wk.still && now >= wk.next && wk.start === 0) {
            const step = STEPS[Math.floor(Math.random() * STEPS.length)];
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
      controls.update();
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
      controls.stopListenToKeyEvents();
      if (dayTimer) window.clearInterval(dayTimer);
      observer.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onDown);
      renderer.domElement.removeEventListener('pointerup', onUp);
      renderer.domElement.removeEventListener('pointermove', onHover);
      renderer.domElement.removeEventListener('pointerleave', onLeave);
      controls.removeEventListener('change', clamp);
      zone.geometry.dispose();
      (zone.material as THREE.Material).dispose();
      hover.geometry.dispose();
      (hover.material as THREE.Material).dispose();
      controls.dispose();
      for (const m of terrain.children) (m as THREE.Mesh).geometry.dispose();
      creaturesGroup.traverse((o) => {
        if (o instanceof THREE.Mesh) o.geometry.dispose();
      });
      for (const s of world.current?.sparks ?? []) (s.mesh.material as THREE.Material).dispose();
      sparkGeo.dispose();
      water.geometry.dispose();
      waterMat.map?.dispose();
      waterMat.dispose();
      cloudGeo.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      world.current = null;
    };
    // La scène est construite une fois ; le terrain, les créatures et la caméra sont mis à jour à part.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion]);

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
        still: Boolean(c.still),
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

  // ---- Sensibilité de la caméra
  useEffect(() => {
    const c = world.current?.controls;
    if (!c) return;
    c.rotateSpeed = cameraSpeed;
    c.zoomSpeed = cameraSpeed;
    c.panSpeed = cameraSpeed;
  }, [cameraSpeed]);

  // ---- Zone libre mise en évidence
  useEffect(() => {
    const w = world.current;
    if (!w) return;
    w.zone.visible = Boolean(build);
    w.hover.visible = false;
    if (!build) return;
    const { x0, y0, x1, y1 } = build.zone;
    w.zone.scale.set(x1 - x0, y1 - y0, 1);
    // Le sol de la zone est à z = 0, donc son dessus à la hauteur 1.
    w.zone.position.set((x0 + x1) / 2, 1.02, (y0 + y1) / 2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [build?.zone.x0, build?.zone.y0, build?.zone.x1, build?.zone.y1, Boolean(build)]);

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

  // ---- Caméra : vol vers l'île demandée (ou la vue d'ensemble)
  useEffect(() => {
    const w = world.current;
    if (!w) return;
    const { target, pos } = framing(focus.island);
    if (reduceMotion || focus.seq === 0) {
      w.flight = null;
      w.camera.position.copy(pos);
      w.controls.target.copy(target);
      w.controls.update();
      return;
    }
    w.flight = { fromPos: w.camera.position.clone(), fromTarget: w.controls.target.clone(), toPos: pos, toTarget: target, start: performance.now() };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus.island, focus.seq, reduceMotion]);

  return (
    <div
      ref={host}
      className={`voxel-canvas ${className ?? ''}`.trim()}
      role="img"
      aria-label={`${label}. Au clavier : flèches pour se déplacer, plus et moins pour zoomer.`}
    />
  );
}
