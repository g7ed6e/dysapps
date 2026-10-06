// Le geste de la pose du mode « Aménager » (GD-9) : 1,5 s au plus ; la coupe descend puis monte d'une couche entière à
// la fois ; le voile d'Archipéo couvre puis se lève.
import { describe, expect, it } from 'vitest';
import { GESTE_DU_LIEU, gestureCut, gestureZone, veilFootprint, veilOpacity, veilZone } from './arrangeGesture';
import type { ArrangeGesture } from './view';

const geste = (phase: ArrangeGesture['phase']): ArrangeGesture => ({ seq: 1, phase, zone: { x0: 0, y0: 0, x1: 10, y1: 10 }, debut: 1000, dureeMs: 600, bas: -5, haut: 24 });

describe('le geste de la pose', () => {
  it('tient en 1,5 s au plus', () => {
    expect(GESTE_DU_LIEU.demonteMs + GESTE_DU_LIEU.remonteMs).toBeLessThanOrEqual(1500);
  });

  it('le démontage descend du haut vers le bas, couche par couche ; le remontage monte', () => {
    const d = geste('demonte');
    const coupes = [0, 100, 200, 300, 400, 500, 600, 700].map((t) => gestureCut(d, 1000 + t));
    expect(coupes[0]).toBe(24);
    expect(coupes[coupes.length - 1]).toBe(-5);
    for (let i = 1; i < coupes.length; i++) expect(coupes[i]).toBeLessThanOrEqual(coupes[i - 1]);
    for (const c of coupes) expect(Number.isInteger(c)).toBe(true);
    const r = geste('remonte');
    expect(gestureCut(r, 1000)).toBe(-5);
    expect(gestureCut(r, 1600)).toBe(24);
  });

  it('le voile couvre puis se lève, et la zone déborde d’une case', () => {
    expect(veilOpacity(geste('demonte'), 1000)).toBe(0);
    expect(veilOpacity(geste('demonte'), 1600)).toBe(1);
    expect(veilOpacity(geste('remonte'), 1600)).toBe(0);
    expect(gestureZone({ x0: 0, y0: 0, x1: 10, y1: 10 })).toEqual({ x0: -1, y0: -1, x1: 11, y1: 11 });
  });

  it('le voile glisse de l’ancienne place à la nouvelle, plein au plus fort, sans jamais disparaître entre les deux', () => {
    const ancienne = { x0: 0, y0: 0, x1: 10, y1: 10 };
    const nouvelle = { x0: 40, y0: 0, x1: 50, y1: 10 };
    const d = { ...geste('demonte'), zone: ancienne, autre: nouvelle };
    const r = { ...geste('remonte'), zone: nouvelle, autre: ancienne, debut: 1600 };
    // Démontage : sur l'ancienne place au début, sur les deux à la fin, plein.
    expect(veilZone(d, 1000)).toEqual(ancienne);
    // Plein, il tient encore à l'emprise de l'ancienne place : le contour du lieu se devine dessous.
    expect(veilOpacity(d, 1300)).toBe(1);
    expect(veilZone(d, 1300)).toEqual(ancienne);
    expect(veilZone(d, 1600)).toEqual({ x0: 0, y0: 0, x1: 50, y1: 10 });
    expect(veilOpacity(d, 1600)).toBe(1);
    // Remontage : il part des deux (là où le démontage l'a laissé), se resserre sur la nouvelle place, puis se lève.
    expect(veilZone(r, 1600)).toEqual(veilZone(d, 1600));
    expect(veilOpacity(r, 1600)).toBe(1);
    expect(veilZone(r, 1900)).toEqual(nouvelle);
    expect(veilOpacity(r, 1900)).toBe(1);
    expect(veilOpacity(r, 2200)).toBe(0);
    // Il glisse : le bord avance pas à pas, jamais d'un saut.
    let avant = veilZone(d, 1000);
    for (let t = 1000; t <= 1600; t += 30) {
      const z = veilZone(d, t);
      expect(Math.abs(z.x1 - avant.x1)).toBeLessThan(8);
      avant = z;
    }
  });

  it('le voile, posé au-dessus du lieu, couvre à l’écran le lieu et ce qui s’y dresse, sans déborder plus loin', () => {
    const r = { x0: 0, y0: 0, x1: 20, y1: 20 };
    // La caméra de la Carte regarde vers le nord : 0,4 case au sol par case de hauteur ; 10 cases de haut.
    expect(veilFootprint(r, 10, { x: 0, y: 0.4 })).toEqual({ x0: 0, y0: -4, x1: 20, y1: 20 });
    // À plat, rien ne change ; jamais plus grand que la zone et son décalage.
    expect(veilFootprint(r, 0, { x: 0.1, y: 0.4 })).toEqual(r);
    const v = veilFootprint(r, 10, { x: 0.1, y: 0.4 });
    expect(v.x1 - v.x0).toBeCloseTo(21);
    expect(v.y1 - v.y0).toBeCloseTo(24);
  });
});
