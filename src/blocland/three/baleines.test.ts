// Les baleines de la vue de l'archipel depuis le port (DA, 01/10/2026) : une baleine que la caméra regarde ne nage pas
// derrière une île, où seul son souffle flotterait en l'air. Sans WebGL : on place la caméra (./camera.ts) et on suit
// le rayon de la caméra vers chaque point du rond de la baleine, au-dessus de la plus haute case de chaque colonne.
import * as THREE from 'three';
import { HABILLAGES } from '../habillage';
import { getArchipelago } from '../world/archipelago';
import { toutConstruit } from '../world/budget';
import { ARCHIPELAGO_IDS } from '../world/map';
import { BALEINES_REPLACEES, whaleSpots, worldBounds, worldCubes } from '../world/terrain';
import { creerCamera } from './camera';
import type { Derniers, Instant, Monde } from './partie';
import type { ArchipelagoId } from '../world/archipelago';

/** La tablette de référence (1024 × 768), moins la barre du haut ; la barre des boutons du bas (72 px) cache la mer. */
const VUE = { w: 1024, h: 688, bas: 72 };

function cameraDuPort(a: ArchipelagoId): THREE.PerspectiveCamera {
  const b = worldBounds(a);
  const monde: Monde = {
    scene: new THREE.Scene(),
    archipel: a,
    habillage: HABILLAGES.archipeo,
    surface: null,
    etendue: b,
    centre: { x: (b.minX + b.maxX) / 2, y: (b.minY + b.maxY) / 2 },
    largeur: Math.max(b.maxX - b.minX, b.maxY - b.minY),
  };
  const home = getArchipelago(a).port;
  const camera = new THREE.PerspectiveCamera(40, VUE.w / VUE.h, 0.5, 2000);
  const focus = { island: null };
  const derniers = { current: { carte: false, focus, home, forceDay: true, whalePass: undefined, sons: false } as unknown as Derniers };
  const instant: Instant = { now: 0, marche: false, navigue: null, carte: false, but: { target: new THREE.Vector3(), pos: new THREE.Vector3() } };
  creerCamera(monde, camera, new THREE.Object3D(), derniers, instant).cadrer(focus as Derniers['focus'], false, home);
  camera.updateMatrixWorld();
  return camera;
}

describe('Les baleines dans la vue de l’archipel depuis le port', () => {
  for (const a of ARCHIPELAGO_IDS.filter((x) => whaleSpots(x).length > 0))
    it(`${a} : une baleine dans le cadre n'y est cachée par aucune terre, sur tout son rond`, () => {
      const camera = cameraDuPort(a);
      const tout = toutConstruit();
      // La plus haute case de chaque colonne, tout construit (les bâtiments du port comptent).
      const haut = new Map<string, number>();
      for (const c of worldCubes(a, tout.progress, tout.world, true, [], true)) {
        const k = `${c.x},${c.y}`;
        haut.set(k, Math.max(haut.get(k) ?? -Infinity, c.z + 1));
      }
      const cam = camera.position;
      const p = new THREE.Vector3();
      const dansLeCadre = (x: number, y: number) => {
        p.set(x, 0, y).project(camera);
        const sx = ((p.x + 1) / 2) * VUE.w;
        const sy = ((1 - p.y) / 2) * VUE.h;
        return p.z < 1 && sx >= 0 && sx <= VUE.w && sy >= 0 && sy <= VUE.h - VUE.bas;
      };
      // Le dos de la baleine (au ras de l'eau) et son souffle (une case et demie au-dessus).
      const cache = (x: number, y: number) =>
        [0, 1.5].some((z) => {
          for (let s = 0.02; s < 0.995; s += 0.002) {
            const h = haut.get(`${Math.round(cam.x + (x - cam.x) * s)},${Math.round(cam.z + (y - cam.z) * s)}`);
            if (h !== undefined && h > cam.y + (z - cam.y) * s) return true;
          }
          return false;
        });
      const vues = whaleSpots(a).filter((w) => dansLeCadre(w.x, w.y));
      for (const w of vues)
        for (let k = 0; k < 16; k++) {
          const x = Math.round(w.x + w.r * Math.cos((k * Math.PI) / 8));
          const y = Math.round(w.y + w.r * Math.sin((k * Math.PI) / 8));
          expect(cache(x, y), `${a} : baleine de ${w.x}, ${w.y} cachée en ${x}, ${y}`).toBe(false);
        }
      // Une baleine replacée à la main l'a été pour se voir : elle est dans le cadre.
      for (const { vers } of BALEINES_REPLACEES[a] ?? []) expect(vues.some((w) => w.x === vers.x && w.y === vers.y), `${a} : ${vers.x}, ${vers.y}`).toBe(true);
    });
});
