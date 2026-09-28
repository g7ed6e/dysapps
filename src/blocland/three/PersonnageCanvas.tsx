// Un personnage d'Archipéo seul, en 3D (lot R6), dans l’univers Archipéo (voir rendu.ts) : la créature de la bulle, le Gardien du
// défi en sentinelle. Un maillage, un appel de dessin, sur fond transparent. La créature respire (et peut tourner
// lentement) ; la sentinelle ne bouge jamais, seul son allumage change, en fondu (lot 6). Quand l'appareil demande moins
// d'animations, rien ne bouge et l'allumage change d'un coup. VoxelCanvas.tsx reste celui du monde en blocs.
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { BiomeId } from '../biomes';
import { lineaire } from '../world/landMesh';
import { rgb } from '../world/decor/pinceau';
import { LUEUR } from '../world/personnages/couleurs';
import { modeleDuPortrait } from '../world/personnages/portrait';
import { couleursAllumees, degresDAllumage, type Allumage } from '../world/personnages/sentinelle';
import { materiauALueur } from './personnagesPeints';

export interface PersonnageCanvasProps {
  kind: 'creature' | 'guardian';
  id: BiomeId;
  /** Pour un Gardien : son degré d'allumage (0 : éteint, 1 : rallumé), ou celui de sa pierre et de ses lueurs. */
  allumage?: Allumage;
  /** Pour un Gardien : la durée du fondu vers un nouvel allumage, en secondes (0 : d'un coup). Le premier est d'un coup. */
  fondu?: number;
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
  fondu = 0,
  autoRotate = false,
  reduceMotion = false,
  cameraDirection = [-0.35, -1],
  elevation = 0.3,
  fit = 1,
  className,
  label,
}: PersonnageCanvasProps) {
  const host = useRef<HTMLDivElement>(null);
  const { pierre, lueurs } = degresDAllumage(allumage);
  // L'allumage demandé et son fondu, lus par la scène sans la refaire ; `relancer` repart la boucle d'une scène immobile.
  // (Écrit dans un effet, jamais pendant le rendu ; déclaré avant celui de la scène, qui le lit à sa création.)
  const demande = useRef({ pierre, lueurs, fondu });
  const relancer = useRef<(() => void) | null>(null);
  useEffect(() => {
    demande.current = { pierre, lueurs, fondu };
  }, [pierre, lueurs, fondu]);

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
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(f.colors), 3));
    g.setAttribute('lueur', new THREE.BufferAttribute(new Float32Array((f.positions.length / 3) * 4), 4));
    const k = rgb(LUEUR).map((v) => lineaire(v / 255));
    /** Peint la sentinelle à un degré : sa pierre, et ce qui brille (la flamme et les veines) au poids de leurs lueurs. */
    const peindre = (d: { pierre: number; lueurs: number }) => {
      if (kind !== 'guardian') return;
      const couleurs = g.getAttribute('color') as THREE.BufferAttribute;
      const lueur = g.getAttribute('lueur') as THREE.BufferAttribute;
      couleursAllumees(f, d, couleurs.array as Float32Array<ArrayBuffer>);
      const l = lueur.array as Float32Array;
      l.fill(0);
      if (d.lueurs > 0)
        for (let t = 0; t < f.pieces.length; t++) {
          if (f.table[f.pieces[t]].lueur !== 'allumage') continue;
          for (let v = t * 3; v < t * 3 + 3; v++) {
            l[v * 4] = k[0];
            l[v * 4 + 1] = k[1];
            l[v * 4 + 2] = k[2];
            l[v * 4 + 3] = d.lueurs;
          }
        }
      couleurs.needsUpdate = true;
      lueur.needsUpdate = true;
    };
    // Le fondu : d'où l'on part, où l'on va, quand il a commencé ; le premier allumage est posé d'un coup.
    const fonte = { de: { ...demande.current }, vers: { ...demande.current }, t0: 0, duree: 0 };
    let actuel = { pierre: demande.current.pierre, lueurs: demande.current.lueurs };
    peindre(actuel);
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
      if (!frame) renderer.render(scene, camera);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(el);

    let frame = 0;
    const clock = new THREE.Clock();
    /** Rejoint l'allumage demandé : vrai tant que le fondu n'est pas fini. */
    const fondre = (t: number): boolean => {
      const d = demande.current;
      if (d.pierre !== fonte.vers.pierre || d.lueurs !== fonte.vers.lueurs) {
        Object.assign(fonte, { de: { ...actuel }, vers: { pierre: d.pierre, lueurs: d.lueurs }, t0: t, duree: reduceMotion ? 0 : d.fondu });
      }
      if (actuel.pierre === fonte.vers.pierre && actuel.lueurs === fonte.vers.lueurs) return false;
      const u = fonte.duree > 0 ? Math.min(1, (t - fonte.t0) / fonte.duree) : 1;
      // Doux au début et à la fin : la lumière monte, elle ne saute pas.
      const e = u * u * (3 - 2 * u);
      actuel = {
        pierre: fonte.de.pierre + (fonte.vers.pierre - fonte.de.pierre) * e,
        lueurs: fonte.de.lueurs + (fonte.vers.lueurs - fonte.de.lueurs) * e,
      };
      if (u >= 1) actuel = { ...fonte.vers };
      peindre(actuel);
      return u < 1;
    };
    // La créature respire (et tourne, si on le demande) ; la sentinelle, jamais.
    const bouge = !reduceMotion && (kind === 'creature' || autoRotate);
    const loop = () => {
      frame = 0;
      const t = clock.getElapsedTime();
      const enFondu = fondre(t);
      if (!reduceMotion) {
        if (kind === 'creature') mesh.position.y = RESPIRATION.amplitude * Math.sin((t / RESPIRATION.periode) * Math.PI * 2);
        if (autoRotate) pivot.rotation.y = (t / TOUR) * Math.PI * 2;
      }
      renderer.render(scene, camera);
      // Immobile et sans fondu en cours, une image suffit.
      if (bouge || enFondu) frame = requestAnimationFrame(loop);
    };
    relancer.current = () => {
      if (!frame) frame = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      relancer.current = null;
      cancelAnimationFrame(frame);
      observer.disconnect();
      g.dispose();
      materiau.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
    // Le cadrage se lit en nombres : un nouveau tableau de même valeur ne refait pas la scène. L'allumage ne la refait
    // pas non plus : la boucle le rejoint en fondu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, id, autoRotate, reduceMotion, cameraDirection[0], cameraDirection[1], elevation, fit]);

  // Un nouvel allumage : la scène immobile repart le temps du fondu.
  useEffect(() => relancer.current?.(), [pierre, lueurs]);

  return <div ref={host} className={`voxel-canvas personnage-canvas ${className ?? ''}`.trim()} role="img" aria-label={label} />;
}
