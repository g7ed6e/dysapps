// Rendu 3D des cubes avec Three.js. Chargé à la demande (voir ./index.ts) pour ne pas alourdir le reste de l'app.
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { VoxelCube } from '../Voxel';

export interface VoxelCanvasProps {
  cubes: VoxelCube[];
  /** Dessine un sol cliquable de gridSize × gridSize cases. */
  gridSize?: number;
  /** Case touchée (sol ou cube) : coordonnées de la colonne. */
  onPick?: (x: number, y: number) => void;
  /** Cube étiqueté touché (voir VoxelCube.tag). */
  onPickTag?: (tag: string) => void;
  selected?: { x: number; y: number } | null;
  /** Hauteur de la colonne sélectionnée, pour placer le curseur. */
  selectedHeight?: number;
  /** Tourne lentement autour de la scène (désactivé avec « réduire les animations »). */
  autoRotate?: boolean;
  reduceMotion?: boolean;
  /** Animation d'attente des cubes (respiration), désactivée avec « réduire les animations ». */
  breathe?: boolean;
  /** Distance initiale de la caméra (par défaut selon la taille de la scène). */
  distance?: number;
  /** Rotation et zoom au doigt (faux pour une simple vitrine, comme une créature). */
  interactive?: boolean;
  /** Cadrage : direction horizontale de la caméra (x, y de la grille), hauteur relative, et facteur de distance. */
  cameraDirection?: [number, number];
  elevation?: number;
  fit?: number;
  className?: string;
  label: string;
}

/** Grille (x, y, z) → Three (x, hauteur, y). */
const toWorld = (x: number, y: number, z: number) => new THREE.Vector3(x + 0.5, z + 0.5, y + 0.5);

const TILE_A = 0xa9d18e;
const TILE_B = 0x9cc782;
const TILE_HOVER = 0xf0d27a;

export default function VoxelCanvas({
  cubes,
  gridSize,
  onPick,
  onPickTag,
  selected,
  selectedHeight = 0,
  autoRotate = false,
  reduceMotion = false,
  breathe = false,
  distance,
  interactive = true,
  cameraDirection,
  elevation,
  fit,
  className,
  label,
}: VoxelCanvasProps) {
  const host = useRef<HTMLDivElement>(null);
  const world = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    cubesGroup: THREE.Group;
    tilesGroup: THREE.Group;
    cursor: THREE.Mesh;
    pickables: THREE.Object3D[];
  } | null>(null);
  const pickRef = useRef(onPick);
  pickRef.current = onPick;
  const pickTagRef = useRef(onPickTag);
  pickTagRef.current = onPickTag;

  // Centre et rayon de la scène, pour cadrer la caméra.
  const extent = (() => {
    const size = gridSize ?? 0;
    let minX = size ? 0 : Infinity;
    let maxX = size ? size : -Infinity;
    let minY = size ? 0 : Infinity;
    let maxY = size ? size : -Infinity;
    let maxZ = 1;
    for (const c of cubes) {
      minX = Math.min(minX, c.x);
      maxX = Math.max(maxX, c.x + 1);
      minY = Math.min(minY, c.y);
      maxY = Math.max(maxY, c.y + 1);
      maxZ = Math.max(maxZ, c.z + 1);
    }
    if (!Number.isFinite(minX)) {
      minX = 0;
      maxX = 1;
      minY = 0;
      maxY = 1;
    }
    return { cx: (minX + maxX) / 2, cy: (minY + maxY) / 2, cz: maxZ / 2, radius: Math.max(maxX - minX, maxY - minY, maxZ) };
  })();

  // ---- Création de la scène (une fois)
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(el.clientWidth, el.clientHeight, false);
    el.appendChild(renderer.domElement);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.touchAction = 'none';

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, el.clientWidth / Math.max(1, el.clientHeight), 0.1, 200);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !reduceMotion;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.enableRotate = interactive;
    controls.enableZoom = interactive;
    if (!interactive) renderer.domElement.style.touchAction = 'auto';
    controls.maxPolarAngle = Math.PI * 0.47;
    controls.minDistance = 3;
    controls.maxDistance = 60;
    controls.autoRotate = autoRotate && !reduceMotion;
    controls.autoRotateSpeed = interactive ? 0.6 : 2.2;

    scene.add(new THREE.HemisphereLight(0xffffff, 0x8a6a4a, 1.1));
    const sun = new THREE.DirectionalLight(0xffffff, 1.6);
    sun.position.set(6, 12, 4);
    scene.add(sun);

    const tilesGroup = new THREE.Group();
    const cubesGroup = new THREE.Group();
    scene.add(tilesGroup, cubesGroup);

    const cursor = new THREE.Mesh(new THREE.BoxGeometry(1.04, 0.12, 1.04), new THREE.MeshBasicMaterial({ color: 0x1e6fd9, transparent: true, opacity: 0.7 }));
    cursor.visible = false;
    scene.add(cursor);

    const pickables: THREE.Object3D[] = [];
    world.current = { scene, camera, renderer, controls, cubesGroup, tilesGroup, cursor, pickables };

    // Sol cliquable
    if (gridSize) {
      const geo = new THREE.BoxGeometry(0.96, 0.12, 0.96);
      for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
          const tile = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: (x + y) % 2 ? TILE_B : TILE_A }));
          tile.position.set(x + 0.5, -0.06, y + 0.5);
          tile.userData = { x, y, tile: true };
          tilesGroup.add(tile);
          pickables.push(tile);
        }
      }
      // Socle en terre sous le sol
      const base = new THREE.Mesh(new THREE.BoxGeometry(gridSize + 0.2, 0.6, gridSize + 0.2), new THREE.MeshLambertMaterial({ color: 0x8a5a26 }));
      base.position.set(gridSize / 2, -0.42, gridSize / 2);
      scene.add(base);
    }

    // Sélection au toucher : un tap, pas un glissé
    const ray = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let down: { x: number; y: number } | null = null;
    const onDown = (e: PointerEvent) => {
      down = { x: e.clientX, y: e.clientY };
    };
    const onUp = (e: PointerEvent) => {
      if (!down || (!pickRef.current && !pickTagRef.current)) return;
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
      down = null;
      if (moved > 8) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
      ray.setFromCamera(pointer, camera);
      const hit = ray.intersectObjects(world.current?.pickables ?? [], false)[0];
      if (!hit) return;
      if (typeof hit.object.userData.tag === 'string') pickTagRef.current?.(hit.object.userData.tag);
      else if (typeof hit.object.userData.x === 'number') pickRef.current?.(hit.object.userData.x, hit.object.userData.y);
    };
    const onHover = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
      ray.setFromCamera(pointer, camera);
      if (!gridSize) {
        const over = ray.intersectObjects(world.current?.pickables ?? [], false)[0];
        renderer.domElement.style.cursor = over ? 'pointer' : 'grab';
        return;
      }
      const hit = ray.intersectObjects(tilesGroup.children, false)[0];
      for (const t of tilesGroup.children) {
        const m = t as THREE.Mesh;
        (m.material as THREE.MeshLambertMaterial).color.setHex(hit?.object === t ? TILE_HOVER : (m.userData.x + m.userData.y) % 2 ? TILE_B : TILE_A);
      }
      renderer.domElement.style.cursor = hit ? 'pointer' : 'grab';
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
    const clock = new THREE.Clock();
    const loop = () => {
      frame = requestAnimationFrame(loop);
      const t = clock.getElapsedTime();
      if (breathe && !reduceMotion) cubesGroup.position.y = Math.sin(t * 1.6) * 0.06;
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
      controls.dispose();
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          const m = o.material as THREE.Material | THREE.Material[];
          (Array.isArray(m) ? m : [m]).forEach((x) => x.dispose());
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
      world.current = null;
    };
    // La scène est construite une fois ; les cubes, la sélection et la caméra sont mis à jour à part.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gridSize, reduceMotion, autoRotate, breathe, interactive]);

  // ---- Cadrage initial de la caméra
  useEffect(() => {
    const w = world.current;
    if (!w) return;
    // Assez près pour que la scène remplisse le cadre, vue de trois quarts en plongée légère.
    const d = distance ?? extent.radius * (fit ?? (gridSize ? 1.15 : 1.6)) + 1.5;
    w.controls.target.set(extent.cx, gridSize ? Math.min(extent.cz, 1.5) : extent.cz, extent.cy);
    // Par défaut : sol vu depuis le coin (+x, +y) en plongée ; créature vue presque de face
    // (son visage est du côté y négatif), pour voir les yeux.
    const [dx, dy] = cameraDirection ?? (gridSize ? [0.75, 0.75] : [0.75, -0.75]);
    const up = elevation ?? (gridSize ? 0.62 : 0.3);
    w.camera.position.set(extent.cx + d * dx, extent.cz + d * up, extent.cy + d * dy);
    w.controls.update();
    // Uniquement au montage et quand la taille de la scène change nettement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gridSize, distance, fit, elevation, cameraDirection?.[0], cameraDirection?.[1], Math.round(extent.radius)]);

  // ---- Cubes
  useEffect(() => {
    const w = world.current;
    if (!w) return;
    for (const child of [...w.cubesGroup.children]) {
      w.cubesGroup.remove(child);
      const m = child as THREE.Mesh;
      m.geometry.dispose();
      (m.material as THREE.Material).dispose();
    }
    w.pickables = w.pickables.filter((p) => p.userData.tile);
    const geo = new THREE.BoxGeometry(0.98, 0.98, 0.98);
    for (const c of cubes) {
      const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: new THREE.Color(c.color) }));
      mesh.position.copy(toWorld(c.x, c.y, c.z));
      mesh.userData = c.tag ? { tag: c.tag } : { x: c.x, y: c.y };
      w.cubesGroup.add(mesh);
      if (gridSize || c.tag) w.pickables.push(mesh);
    }
  }, [cubes, gridSize]);

  // ---- Curseur de sélection
  useEffect(() => {
    const w = world.current;
    if (!w) return;
    w.cursor.visible = Boolean(selected);
    if (selected) w.cursor.position.set(selected.x + 0.5, selectedHeight + 0.06, selected.y + 0.5);
  }, [selected, selectedHeight]);

  return <div ref={host} className={`voxel-canvas ${className ?? ''}`.trim()} role="img" aria-label={label} />;
}
