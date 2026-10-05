// Le sens des mots du mode « Aménager » (GD-9) : la flèche « Est » mène le fantôme vers la droite de l'écran de la
// Carte, « Nord » vers le haut, et la phrase dit ce que l'élève voit. Sans WebGL : on place la caméra de la Carte comme
// la scène (`cadrageDeLaCarte`) et on projette des points du monde.
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import type { World } from '../engine/state';
import type { BiomeId } from '../biomes';
import { DIRECTION_STEP, type Direction, nextFreeSpot, placeIn, spotOf } from '../world/arrange';
import { archipelagoOfIsland, ARCHIPELAGO_IDS } from '../world/archipelagos';
import { landRectangle, poseOfSpot } from '../world/footprint';
import type { LayoutSpot } from '../world/savedLayout';
import { worldBounds } from '../world/terrain';
import { mapOf } from '../world/map';
import { placesOf } from '../world/routing';
import { directionWords } from '../world/placeSentence';
import { cadrageDeLaCarte } from './camera';

const VIDE: World = { parts: {}, log: [], links: [] };
const T = { w: 1024, h: 688 };

/** La caméra de la Carte d'un archipel, placée comme dans la scène. */
function cameraDeLaCarte(a: (typeof ARCHIPELAGO_IDS)[number]): THREE.PerspectiveCamera {
  const c = cadrageDeLaCarte(a, null, T.w, T.h, { x0: 0, y0: 0, x1: T.w, y1: T.h });
  const cam = new THREE.PerspectiveCamera(40, T.w / T.h, 0.5, 1e5);
  cam.position.copy(c.pos);
  cam.lookAt(c.target);
  cam.updateMatrixWorld();
  return cam;
}

/** Un point du monde (x, y au sol) à l'écran, en pixels (y vers le bas). */
function ecran(cam: THREE.PerspectiveCamera, p: { x: number; y: number }, altitude: number): { x: number; y: number } {
  const v = new THREE.Vector3(p.x, altitude, p.y).project(cam);
  return { x: ((v.x + 1) / 2) * T.w, y: ((1 - v.y) / 2) * T.h };
}

/** Le milieu d'un lieu posé à une place, en cases du monde. */
function milieuDeLaPlace(id: BiomeId, s: LayoutSpot): { x: number; y: number } {
  const p = poseOfSpot(archipelagoOfIsland(id), s);
  return { x: p.x + 8, y: p.y + 8 };
}

/** Ce que chaque flèche doit faire à l'écran, et le mot qui la dit. */
const ATTENDU: Readonly<Record<Direction, { mot: string; sens: (d: { x: number; y: number }) => boolean }>> = {
  est: { mot: 'à l’est', sens: (d) => d.x > Math.abs(d.y) },
  ouest: { mot: 'à l’ouest', sens: (d) => -d.x > Math.abs(d.y) },
  nord: { mot: 'au nord', sens: (d) => -d.y > Math.abs(d.x) },
  sud: { mot: 'au sud', sens: (d) => d.y > Math.abs(d.x) },
};

/** Le mot de la direction d'un vecteur à l'écran (huit secteurs, l'est à droite, le nord en haut). */
function motALEcran(d: { x: number; y: number }): string {
  const mots = ['à l’est', 'au nord-est', 'au nord', 'au nord-ouest', 'à l’ouest', 'au sud-ouest', 'au sud', 'au sud-est'];
  const s = Math.round(Math.atan2(-d.y, d.x) / (Math.PI / 4));
  return mots[((s % 8) + 8) % 8];
}

describe('les mots du mode « Aménager » et la caméra de la Carte', () => {
  for (const a of ARCHIPELAGO_IDS) {
    it(`${a} : chaque flèche va du côté qu'elle nomme, et son mot est celui qu'on voit`, () => {
      const cam = cameraDeLaCarte(a);
      const alt = mapOf(a)[0]?.altitude ?? 0;
      const b = worldBounds(a);
      const o = { x: (b.minX + b.maxX) / 2, y: (b.minY + b.maxY) / 2 };
      for (const dir of Object.keys(ATTENDU) as Direction[]) {
        const s = DIRECTION_STEP[dir];
        const p = { x: o.x + 8 * s.dx, y: o.y + 8 * s.dy };
        const d = { x: ecran(cam, p, alt).x - ecran(cam, o, alt).x, y: ecran(cam, p, alt).y - ecran(cam, o, alt).y };
        expect(ATTENDU[dir].sens(d), `${a} ${dir}`).toBe(true);
        expect(directionWords(o, p), `${a} ${dir}`).toBe(ATTENDU[dir].mot);
      }
    });

    it(`${a} : la flèche déplace le fantôme du lieu du bon côté de l'écran`, () => {
      const cam = cameraDeLaCarte(a);
      const alt = mapOf(a)[0]?.altitude ?? 0;
      const id = placesOf(a).find((l) => (['est', 'ouest', 'nord', 'sud'] as Direction[]).some((d) => nextFreeSpot(VIDE, l, spotOf(VIDE, l), d)))!;
      expect(archipelagoOfIsland(id)).toBe(a);
      const depuis = spotOf(VIDE, id);
      for (const dir of Object.keys(ATTENDU) as Direction[]) {
        const s = nextFreeSpot(VIDE, id, depuis, dir);
        if (!s) continue;
        const p0 = ecran(cam, milieuDeLaPlace(id, depuis), alt);
        const p1 = ecran(cam, milieuDeLaPlace(id, s), alt);
        // Le pas avance du côté nommé (la place suivante peut glisser un peu de côté).
        const d = { x: p1.x - p0.x, y: p1.y - p0.y };
        const avance = dir === 'est' ? d.x : dir === 'ouest' ? -d.x : dir === 'nord' ? -d.y : d.y;
        expect(avance, `${a} ${id} ${dir}`).toBeGreaterThan(0);
      }
    });

    it(`${a} : la phrase d'une place dit, entre deux lieux, la direction vue à l'écran`, () => {
      const cam = cameraDeLaCarte(a);
      const alt = mapOf(a)[0]?.altitude ?? 0;
      const lieux = placesOf(a);
      const milieu = (id: (typeof lieux)[number]) => {
        const r = landRectangle(placeIn(VIDE, id));
        return { x: (r.x0 + r.x1) / 2, y: (r.y0 + r.y1) / 2 };
      };
      for (let i = 1; i < lieux.length; i++) {
        const u = milieu(lieux[0]);
        const v = milieu(lieux[i]);
        const pu = ecran(cam, u, alt);
        const pv = ecran(cam, v, alt);
        const d = { x: pv.x - pu.x, y: pv.y - pu.y };
        // Loin des limites entre deux secteurs (la perspective penche un peu les droites), le mot est celui de l'écran.
        const angle = (Math.atan2(-d.y, d.x) / (Math.PI / 4)) % 1;
        if (Math.abs(Math.abs(angle) - 0.5) < 0.15) continue;
        expect(directionWords(u, v), `${a} ${lieux[i]}`).toBe(motALEcran(d));
      }
    });
  }
});
