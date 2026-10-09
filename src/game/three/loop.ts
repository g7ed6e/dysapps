// La boucle d'image du monde en 3D (sortie de WorldCanvas.tsx, qualité du code, lot 7) : chaque image, ce qui bouge
// dans le monde, puis le reste des parties, puis le rendu. Économie de batterie : on ne dessine que si le canvas est
// visible et l'onglet actif ; et si l'appareil peine (images trop longues), on baisse la finesse du rendu.
import * as THREE from 'three';
import type { Meter } from './meter';
import { usageFrame } from '../../core/usage';
import type { Derniers, Instant, PartieDeLaScene } from './scenePart';

/** Ce que la boucle fait tourner. */
export interface ScenePourLaBoucle {
  el: HTMLElement;
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.Camera;
  meter: Meter | null;
  /** Ce qui bouge dans le monde, avant la caméra. */
  deplacements: readonly PartieDeLaScene[];
  /** Le reste de l'image, dans l'ordre. */
  parties: readonly PartieDeLaScene[];
  instant: Instant;
  derniers: { readonly current: Derniers };
  reduceMotion: boolean;
  /** La scène est encore là (sinon l'image n'est pas dessinée). */
  prete(): boolean;
  /** Dit à la page que la vue est déplacée, ou ne l'est plus. */
  signaler(): void;
}

/** Lance la boucle ; rend de quoi l'arrêter. */
export function lancerLaBoucle({ el, renderer, scene, camera, meter, deplacements, parties, instant, derniers, reduceMotion, prete, signaler }: ScenePourLaBoucle): () => void {
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
    // Jamais négatif : une horloge qui recule (celle, figée, des captures de la documentation) ne remonte pas le temps.
    const dtMs = nowMs - lastFrame;
    const dt = Math.max(0, Math.min(0.1, dtMs / 1000));
    lastFrame = nowMs;
    if (!prete()) return;
    instant.now = performance.now();
    const t = clock.getElapsedTime();
    for (const p of deplacements) p.deplacer?.(t, dt, reduceMotion);
    instant.carte = derniers.current.carte && !instant.marche && !instant.navigue;
    for (const p of parties) p.animer?.(t, dt, reduceMotion);
    // La caméra efface le décalage quand l'application reprend la main (Carte, marche, voyage, nouvelle île).
    signaler();
    renderer.render(scene, camera);
    meter?.tick(renderer.info, nowMs);
    // La fluidité du monde, pour la mesure d'usage anonyme (core/usage.ts).
    usageFrame(dtMs);
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
  };
}
