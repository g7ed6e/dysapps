// Le village en 3D : un seul maillage par matériau (faces visibles seulement), caméra libre bornée,
// eau autour des îles, vol vers une île. Chargé à la demande (voir ./index.ts).
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { BiomeId } from '../biomes';
import type { VoxelCube } from '../Voxel';
import { buildMesh, type FaceSide } from '../world/mesher';
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

export interface WorldCanvasProps {
  cubes: VoxelCube[];
  focus: WorldFocus;
  reduceMotion?: boolean;
  /** Île touchée (un tap, pas un glissé), sur l'île elle-même ou sur le pont qui y mène. */
  onPickIsland?: (id: BiomeId) => void;
  /** Mode construction : on touche une face pour poser ou retirer, au lieu d'entrer dans l'île. */
  build?: BuildProps;
  className?: string;
  label: string;
}

const SKY = 0x8fd0f5;
const WATER = 0x4a9be0;
/** Hauteur de l'eau : les deux couches de terre affleurent, le sol reste bien au-dessus. */
const WATER_LEVEL = -0.45;
/** Direction de la caméra (x, y de la grille) et hauteur relative : vue de trois quarts, côté visage des créatures. */
const VIEW = { dx: 0.3, dy: -0.95, up: 0.55 };
const ISLAND_DISTANCE = 22;
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

/** Matériau d'une face : les blocs texturés partagent les matériaux (cache), le reste est une couleur grainée. */
function materialFor(texture: string | undefined, face: FaceSide, color: string | undefined): THREE.Material {
  if (!texture) return tintedMaterial(color ?? '#9c9c9c');
  const m = blockMaterial(texture as TextureKind);
  if (!Array.isArray(m)) return m;
  // Ordre d'une BoxGeometry : +x, −x, +y (dessus), −y (dessous), +z, −z.
  return m[face === 'top' ? 2 : face === 'bottom' ? 3 : 0];
}

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export default function WorldCanvas({ cubes, focus, reduceMotion = false, onPickIsland, build, className, label }: WorldCanvasProps) {
  const host = useRef<HTMLDivElement>(null);
  const world = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    terrain: THREE.Group;
    zone: THREE.Mesh;
    hover: THREE.LineSegments;
    flight: {
      fromPos: THREE.Vector3;
      fromTarget: THREE.Vector3;
      toPos: THREE.Vector3;
      toTarget: THREE.Vector3;
      start: number;
    } | null;
  } | null>(null);
  const pickRef = useRef(onPickIsland);
  pickRef.current = onPickIsland;
  const buildRef = useRef(build);
  buildRef.current = build;
  const bounds = worldBounds();
  const center = {
    x: (bounds.minX + bounds.maxX) / 2,
    y: (bounds.minY + bounds.maxY) / 2,
  };
  const width = bounds.maxX - bounds.minX;

  /** Position et cible de la caméra pour une île (ou la vue d'ensemble). */
  const framing = (island: BiomeId | null) => {
    const c = island ? islandCenter(island) : center;
    const d = island ? ISLAND_DISTANCE : width * 0.8 + 6;
    const target = new THREE.Vector3(c.x, 1, c.y);
    const pos = new THREE.Vector3(c.x + d * VIEW.dx, 1 + d * VIEW.up, c.y + d * VIEW.dy);
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
    scene.background = new THREE.Color(SKY);
    scene.fog = new THREE.Fog(SKY, width * 1.2, width * 3);
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

    scene.add(new THREE.HemisphereLight(0xffffff, 0x8a6a4a, 1.2));
    const sun = new THREE.DirectionalLight(0xffffff, 1.5);
    sun.position.set(40, 60, 20);
    scene.add(sun);

    // L'eau : un grand plan sous le niveau du sol.
    const water = new THREE.Mesh(
      new THREE.PlaneGeometry(width * 8, width * 8),
      new THREE.MeshLambertMaterial({
        color: WATER,
        transparent: true,
        opacity: 0.92,
      }),
    );
    water.rotation.x = -Math.PI / 2;
    water.position.set(center.x, WATER_LEVEL, center.y);
    scene.add(water);

    // Nuages en cubes, au-dessus du monde.
    const cloudGeo = new THREE.BoxGeometry(1, 0.5, 1.2);
    const clouds = new THREE.Group();
    for (const [fx, fy, len] of CLOUDS) {
      for (let i = 0; i < len; i++) {
        const puff = new THREE.Mesh(cloudGeo, blockMaterial('nuage'));
        puff.position.set(bounds.minX + fx * width + i, 12 + (i % 2) * 0.5, bounds.minY + fy * (bounds.maxY - bounds.minY));
        clouds.add(puff);
      }
    }
    scene.add(clouds);

    const terrain = new THREE.Group();
    scene.add(terrain);
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
    world.current = { scene, camera, renderer, controls, terrain, zone, hover, flight: null };

    // Toucher une île : un tap, pas un glissé.
    const ray = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let down: { x: number; y: number } | null = null;
    const aim = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
      ray.setFromCamera(pointer, camera);
      return ray.intersectObjects(terrain.children, false)[0];
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
      if (!down || (!pickRef.current && !buildRef.current)) return;
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
      down = null;
      if (moved > 8) return;
      const hit = aim(e);
      if (!hit) return;
      if (buildRef.current) {
        const { cell, next } = cellsOf(hit);
        buildRef.current.onPickFace(cell, next);
      } else pickRef.current?.(islandAt(Math.floor(hit.point.x), Math.floor(hit.point.z)));
    };
    const onHover = (e: PointerEvent) => {
      if (e.pointerType === 'touch' || (!pickRef.current && !buildRef.current)) return;
      const hit = aim(e);
      renderer.domElement.style.cursor = hit ? 'pointer' : 'grab';
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

    let frame = 0;
    const loop = () => {
      frame = requestAnimationFrame(loop);
      const w = world.current;
      if (w?.flight) {
        const t = Math.min(1, (performance.now() - w.flight.start) / FLIGHT_MS);
        const k = ease(t);
        camera.position.lerpVectors(w.flight.fromPos, w.flight.toPos, k);
        controls.target.lerpVectors(w.flight.fromTarget, w.flight.toTarget, k);
        if (t >= 1) w.flight = null;
      }
      controls.update();
      renderer.render(scene, camera);
    };
    loop();

    return () => {
      cancelAnimationFrame(frame);
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
      water.geometry.dispose();
      (water.material as THREE.Material).dispose();
      cloudGeo.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      world.current = null;
    };
    // La scène est construite une fois ; le terrain et la caméra sont mis à jour à part.
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
    for (const g of buildMesh(cubes)) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(g.positions, 3));
      geo.setAttribute('normal', new THREE.Float32BufferAttribute(g.normals, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(g.uvs, 2));
      geo.setIndex(g.indices);
      const mesh = new THREE.Mesh(geo, materialFor(g.texture, g.face, g.color));
      // Les faces cachées ne sont plus là : on peut renoncer au tri par la taille de la scène.
      mesh.frustumCulled = false;
      w.terrain.add(mesh);
    }
  }, [cubes]);

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
    w.flight = {
      fromPos: w.camera.position.clone(),
      fromTarget: w.controls.target.clone(),
      toPos: pos,
      toTarget: target,
      start: performance.now(),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus.island, focus.seq, reduceMotion]);

  return <div ref={host} className={`voxel-canvas ${className ?? ''}`.trim()} role="img" aria-label={label} />;
}
