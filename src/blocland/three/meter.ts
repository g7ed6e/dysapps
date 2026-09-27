// Le compteur de mesures du rendu 3D (lot R0 d'Archipéo) : appels de dessin, triangles, géométries, textures et images
// par seconde de la dernière image. Affiché dans un coin de la vue avec `?mesures` (invisible sans lui), et lu par
// `npm run rendu:mesures` sur `window.__dysappsRendu` (en développement, ou avec `?mesures`).
import type * as THREE from 'three';
import type { Rendu } from '../rendu';

export interface RenderStats {
  rendu: Rendu;
  calls: number;
  triangles: number;
  geometries: number;
  textures: number;
  fps: number;
}

declare global {
  interface Window {
    __dysappsRendu?: RenderStats;
  }
}

export interface Meter {
  /** À appeler juste après `renderer.render()`. */
  tick(info: THREE.WebGLInfo, nowMs: number): void;
  dispose(): void;
}

export function createMeter(host: HTMLElement, rendu: Rendu, show: boolean, expose: boolean): Meter | null {
  if (!show && !expose) return null;
  const stats: RenderStats = { rendu, calls: 0, triangles: 0, geometries: 0, textures: 0, fps: 0 };
  if (expose) window.__dysappsRendu = stats;
  let box: HTMLOutputElement | null = null;
  if (show) {
    box = document.createElement('output');
    box.className = 'render-meter';
    box.setAttribute('aria-hidden', 'true');
    Object.assign(box.style, {
      position: 'absolute',
      left: '8px',
      bottom: '8px',
      padding: '4px 8px',
      font: '12px/1.4 ui-monospace, monospace',
      background: '#000c',
      color: '#fff',
      pointerEvents: 'none',
      whiteSpace: 'pre',
      zIndex: '5',
    });
    host.appendChild(box);
  }
  let frames = 0;
  let since = performance.now();
  return {
    tick(info, nowMs) {
      stats.calls = info.render.calls;
      stats.triangles = info.render.triangles;
      stats.geometries = info.memory.geometries;
      stats.textures = info.memory.textures;
      frames += 1;
      // Après une pause (onglet caché, vue hors de l'écran), la fenêtre repart de zéro.
      if (nowMs - since > 2000) {
        frames = 0;
        since = nowMs;
        return;
      }
      if (nowMs - since < 500) return;
      stats.fps = Math.round((frames * 1000) / (nowMs - since));
      frames = 0;
      since = nowMs;
      if (box) box.textContent = `${rendu} · ${stats.calls} appels · ${stats.triangles.toLocaleString('fr-FR')} triangles · ${stats.fps} i/s`;
    },
    dispose() {
      box?.remove();
      if (window.__dysappsRendu === stats) delete window.__dysappsRendu;
    },
  };
}
