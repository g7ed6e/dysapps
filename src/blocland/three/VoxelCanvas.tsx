// Rendu 3D des cubes avec Three.js. Chargé à la demande (voir ./index.ts) pour ne pas alourdir le reste de l'app.
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { VoxelCube } from '../Voxel';
import { blockMaterial, tintedMaterial, type TextureKind } from './textures';

export interface VoxelCanvasProps {
  cubes: VoxelCube[];
  /** Dessine un sol cliquable de gridSize × gridSize blocs d'herbe. */
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
  /** Ciel bleu et nuages en cubes (sinon fond transparent). Par défaut : oui s'il y a un sol. */
  sky?: boolean;
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

const SKY = 0x8fd0f5;
/** Nuages : rangées de cubes blancs, en positions fixes autour du centre de la scène. */
const CLOUDS: [number, number, number][] = [
  [-9, 9, 3],
  [-2, 12, 4],
  [6, 10, 2],
  [12, 13, 3],
  [3, 15, 5],
];

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
  sky = Boolean(gridSize),
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
    cubeGeo: THREE.BoxGeometry;
    cursor: THREE.Mesh;
    hover: THREE.Mesh;
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
    return { cx: (minX + maxX) / 2, cy: (minY + maxY) / 2, cz: maxZ / 2, maxZ, radius: Math.max(maxX - minX, maxY - minY, maxZ) };
  })();

  // ---- Création de la scène (une fois)
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: !sky });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(el.clientWidth, el.clientHeight, false);
    el.appendChild(renderer.domElement);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.touchAction = 'none';

    const scene = new THREE.Scene();
    if (sky) scene.background = new THREE.Color(SKY);
    const camera = new THREE.PerspectiveCamera(38, el.clientWidth / Math.max(1, el.clientHeight), 0.1, 300);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !reduceMotion;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.enableRotate = interactive;
    controls.enableZoom = interactive;
    if (!interactive) renderer.domElement.style.touchAction = 'auto';
    controls.maxPolarAngle = Math.PI * 0.47;
    controls.minDistance = 3;
    controls.maxDistance = 90;
    controls.autoRotate = autoRotate && !reduceMotion;
    controls.autoRotateSpeed = interactive ? 0.6 : 2.2;

    scene.add(new THREE.HemisphereLight(0xffffff, 0x8a6a4a, 1.25));
    const sun = new THREE.DirectionalLight(0xffffff, 1.5);
    sun.position.set(6, 12, 4);
    scene.add(sun);

    const tilesGroup = new THREE.Group();
    const cubesGroup = new THREE.Group();
    scene.add(tilesGroup, cubesGroup);
    const cubeGeo = new THREE.BoxGeometry(1, 1, 1);

    const cursor = new THREE.Mesh(new THREE.BoxGeometry(1.04, 0.12, 1.04), new THREE.MeshBasicMaterial({ color: 0x1e6fd9, transparent: true, opacity: 0.7 }));
    cursor.visible = false;
    scene.add(cursor);
    const hover = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.06, 1.02), new THREE.MeshBasicMaterial({ color: 0xffe066, transparent: true, opacity: 0.6 }));
    hover.visible = false;
    scene.add(hover);

    const pickables: THREE.Object3D[] = [];
    world.current = { scene, camera, renderer, controls, cubesGroup, tilesGroup, cubeGeo, cursor, hover, pickables };

    // Sol : des blocs d'herbe cliquables sur une couche de terre
    if (gridSize) {
      for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
          const tile = new THREE.Mesh(cubeGeo, blockMaterial('herbe'));
          tile.position.set(x + 0.5, -0.5, y + 0.5);
          tile.userData = { x, y, tile: true };
          tilesGroup.add(tile);
          pickables.push(tile);
          const dirt = new THREE.Mesh(cubeGeo, blockMaterial('terre'));
          dirt.position.set(x + 0.5, -1.5, y + 0.5);
          tilesGroup.add(dirt);
        }
      }
    }

    // Nuages
    if (sky) {
      for (const [dx, dz, len] of CLOUDS) {
        for (let i = 0; i < len; i++) {
          const puff = new THREE.Mesh(cubeGeo, blockMaterial('nuage'));
          puff.position.set(extent.cx + dx + i, extent.maxZ + 7 + (dz % 3), extent.cy - 4 + dz * 0.4 + (i % 2) * 0.5);
          puff.scale.set(1, 0.5, 1.2);
          scene.add(puff);
        }
      }
    }

    // Sélection au toucher : un tap, pas un glissé
    const ray = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let down: { x: number; y: number } | null = null;
    const aim = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
      ray.setFromCamera(pointer, camera);
      return ray.intersectObjects(world.current?.pickables ?? [], false)[0];
    };
    const onDown = (e: PointerEvent) => {
      down = { x: e.clientX, y: e.clientY };
    };
    const onUp = (e: PointerEvent) => {
      if (!down || (!pickRef.current && !pickTagRef.current)) return;
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
      down = null;
      if (moved > 8) return;
      const hit = aim(e);
      if (!hit) return;
      if (typeof hit.object.userData.tag === 'string') pickTagRef.current?.(hit.object.userData.tag);
      else if (typeof hit.object.userData.x === 'number') pickRef.current?.(hit.object.userData.x, hit.object.userData.y);
    };
    const onHover = (e: PointerEvent) => {
      if (e.pointerType === 'touch' || (!pickRef.current && !pickTagRef.current)) return;
      const hit = aim(e);
      renderer.domElement.style.cursor = hit ? 'pointer' : interactive ? 'grab' : 'default';
      const h = world.current?.hover;
      if (!h) return;
      if (hit && typeof hit.object.userData.x === 'number') {
        h.visible = true;
        h.position.set(hit.object.userData.x + 0.5, hit.object.position.y + 0.5 + 0.04, hit.object.userData.y + 0.5);
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
      renderer.domElement.removeEventListener('pointerleave', onLeave);
      controls.dispose();
      // Les matériaux texturés sont partagés (cache) : on ne libère que les géométries propres à la scène.
      cubeGeo.dispose();
      cursor.geometry.dispose();
      (cursor.material as THREE.Material).dispose();
      hover.geometry.dispose();
      (hover.material as THREE.Material).dispose();
      renderer.dispose();
      renderer.domElement.remove();
      world.current = null;
    };
    // La scène est construite une fois ; les cubes, la sélection et la caméra sont mis à jour à part.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gridSize, reduceMotion, autoRotate, breathe, interactive, sky]);

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
    for (const child of [...w.cubesGroup.children]) w.cubesGroup.remove(child);
    w.pickables = w.pickables.filter((p) => p.userData.tile);
    for (const c of cubes) {
      const mesh = new THREE.Mesh(w.cubeGeo, c.texture ? blockMaterial(c.texture as TextureKind) : tintedMaterial(c.color));
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
