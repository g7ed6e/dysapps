// Un personnage d'Archipéo seul, en 3D (lot R6), derrière `?rendu=archipeo` : la créature de la bulle, le Gardien du
// défi en sentinelle. Un maillage, un appel de dessin, sur fond transparent. Il respire (et la créature tourne
// lentement) ; avec « Réduire les animations », il reste immobile, sans fondu. VoxelCanvas.tsx reste celui du monde en
// blocs.
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { BiomeId } from '../biomes';
import { lineaire } from '../world/landMesh';
import { rgb } from '../world/decor/pinceau';
import { LUEUR } from '../world/personnages/couleurs';
import { modeleDuPortrait } from '../world/personnages/portrait';
import { couleursAllumees } from '../world/personnages/sentinelle';
import { materiauALueur } from './personnagesPeints';

export interface PersonnageCanvasProps {
  kind: 'creature' | 'guardian';
  id: BiomeId;
  /** Pour un Gardien : son degré d'allumage (0 : éteint, 1 : rallumé). */
  allumage?: number;
  /** Tourne lentement sur lui-même (désactivé avec « Réduire les animations »). */
  autoRotate?: boolean;
  reduceMotion?: boolean;
  /** La direction d'où on le regarde (x, z : le visage est vers −Z), la plongée, et le recul (1 : il remplit le cadre). */
  cameraDirection?: [number, number];
  elevation?: number;
  fit?: number;
  className?: string;
  label: string;
}

/** La respiration : 0,03 bloc, en quatre secondes ; la rotation : un tour en une minute. */
const RESPIRATION = { amplitude: 0.03, periode: 4 };
const TOUR = 60;

export default function PersonnageCanvas({
  kind,
  id,
  allumage = 0,
  autoRotate = false,
  reduceMotion = false,
  cameraDirection = [-0.35, -1],
  elevation = 0.3,
  fit = 1,
  className,
  label,
}: PersonnageCanvasProps) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(el.clientWidth, el.clientHeight, false);
    el.appendChild(renderer.domElement);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';

    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xfff4e0, 0x8a8f86, 1.6));
    const sun = new THREE.DirectionalLight(0xffffff, 2.2);
    sun.position.set(-35, 60, -40);
    scene.add(sun);

    // Le modèle : ses couleurs de jour (d'une sentinelle, à son degré d'allumage) ; ce qui brille d'un Gardien rallumé.
    const f = modeleDuPortrait(kind, id);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(f.positions, 3));
    g.setAttribute('normal', new THREE.BufferAttribute(f.normals, 3));
    g.setAttribute('color', new THREE.BufferAttribute(kind === 'guardian' ? couleursAllumees(f, allumage) : new Float32Array(f.colors), 3));
    const lueur = new Float32Array((f.positions.length / 3) * 4);
    if (kind === 'guardian' && allumage > 0) {
      const k = rgb(LUEUR).map((v) => lineaire(v / 255));
      for (let t = 0; t < f.pieces.length; t++)
        if (f.table[f.pieces[t]].lueur === 'allumage') for (let s = 0; s < 3; s++) lueur.set([k[0], k[1], k[2], Math.min(1, allumage)], (t * 3 + s) * 4);
    }
    g.setAttribute('lueur', new THREE.BufferAttribute(lueur, 4));
    const { materiau, force } = materiauALueur();
    force.value = 1;
    const mesh = new THREE.Mesh(g, materiau);
    const pivot = new THREE.Group();
    pivot.add(mesh);
    scene.add(pivot);

    // Le cadrage : le personnage entier, vu de `cameraDirection`, en plongée légère.
    g.computeBoundingBox();
    const box = g.boundingBox!;
    const centre = box.getCenter(new THREE.Vector3());
    const taille = box.getSize(new THREE.Vector3());
    const camera = new THREE.PerspectiveCamera(30, el.clientWidth / Math.max(1, el.clientHeight), 0.1, 200);
    const d = (Math.max(taille.y, taille.x, taille.z) / 2 / Math.tan((camera.fov * Math.PI) / 360)) * fit * 1.15;
    const dir = new THREE.Vector3(cameraDirection[0], elevation, cameraDirection[1]).normalize();
    camera.position.copy(centre).addScaledVector(dir, d);
    camera.lookAt(centre);

    const resize = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
      if (reduceMotion) renderer.render(scene, camera);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(el);

    let frame = 0;
    const clock = new THREE.Clock();
    const loop = () => {
      const t = clock.getElapsedTime();
      if (!reduceMotion) {
        mesh.position.y = RESPIRATION.amplitude * Math.sin((t / RESPIRATION.periode) * Math.PI * 2);
        if (autoRotate) pivot.rotation.y = (t / TOUR) * Math.PI * 2;
      }
      renderer.render(scene, camera);
      // Immobile, une image suffit.
      if (!reduceMotion) frame = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      g.dispose();
      materiau.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
    // Le cadrage se lit en nombres : un nouveau tableau de même valeur ne refait pas la scène.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, id, allumage, autoRotate, reduceMotion, cameraDirection[0], cameraDirection[1], elevation, fit]);

  return <div ref={host} className={`voxel-canvas personnage-canvas ${className ?? ''}`.trim()} role="img" aria-label={label} />;
}
