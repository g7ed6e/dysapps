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

export interface WorldCanvasProps {
  cubes: VoxelCube[];
  focus: WorldFocus;
  reduceMotion?: boolean;
  /** Île touchée (un tap, pas un glissé), sur l'île elle-même ou sur le pont qui y mène. */
  onPickIsland?: (id: BiomeId) => void;
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

export default function WorldCanvas({ cubes, focus, reduceMotion = false, onPickIsland, className, label }: WorldCanvasProps) {
  const host = useRef<HTMLDivElement>(null);
  const world = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    terrain: THREE.Group;
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
    world.current = {
      scene,
      camera,
      renderer,
      controls,
      terrain,
      flight: null,
    };

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
    const onUp = (e: PointerEvent) => {
      if (!down || !pickRef.current) return;
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
      down = null;
      if (moved > 8) return;
      const hit = aim(e);
      if (hit) pickRef.current(islandAt(Math.floor(hit.point.x), Math.floor(hit.point.z)));
    };
    const onHover = (e: PointerEvent) => {
      if (e.pointerType === 'touch' || !pickRef.current) return;
      renderer.domElement.style.cursor = aim(e) ? 'pointer' : 'grab';
    };
    renderer.domElement.addEventListener('pointerdown', onDown);
    renderer.domElement.addEventListener('pointerup', onUp);
    renderer.domElement.addEventListener('pointermove', onHover);

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
      controls.removeEventListener('change', clamp);
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
