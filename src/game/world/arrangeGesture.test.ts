// Le geste de la pose du mode « Aménager » (GD-9) : 1,5 s au plus ; la coupe descend puis monte d'une couche entière à
// la fois ; le voile d'Archipéo couvre puis se lève.
import { describe, expect, it } from 'vitest';
import { GESTE_DU_LIEU, gestureCut, gestureZone, veilOpacity } from './arrangeGesture';
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
});
