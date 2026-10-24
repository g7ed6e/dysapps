// La finesse qui s'adapte (./resolution.ts) : rien pendant que le monde se pose ; un cran de moins après deux fenêtres
// lentes de suite, jamais sous 1,5 ; les à-coups isolés ne comptent pas ; un écran ×1 ne bouge pas.
import { describe, expect, it } from 'vitest';
import { createResolution, SETTLE_MS, SLOW_WINDOWS, WINDOW_FRAMES } from './resolution';

/** `n` images de `ms`, à partir de `t` ; les crans demandés et l'instant de la fin. */
function run(r: ReturnType<typeof createResolution>, t: number, n: number, ms: (i: number) => number) {
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    t += ms(i);
    const v = r.frame(ms(i), t);
    if (v !== null) out.push(v);
  }
  return { out, t };
}

describe('la finesse qui s’adapte', () => {
  it('rien pendant que le monde se pose, puis un cran après deux fenêtres lentes, jusqu’à 1,5', () => {
    const r = createResolution(2, 0);
    // Lent, mais le monde se pose encore.
    expect(run(r, 0, Math.floor(SETTLE_MS / 25) - 1, () => 25).out).toEqual([]);
    const a = run(r, SETTLE_MS, WINDOW_FRAMES * SLOW_WINDOWS, () => 25);
    expect(a.out).toEqual([1.75]);
    const b = run(r, a.t + SETTLE_MS, WINDOW_FRAMES * SLOW_WINDOWS, () => 25);
    expect(b.out).toEqual([1.5]);
    // Jamais plus bas.
    expect(run(r, b.t + SETTLE_MS, WINDOW_FRAMES * 10, () => 25).out).toEqual([]);
  });

  it('un appareil à 60 images par seconde garde sa finesse, même avec des à-coups', () => {
    const r = createResolution(2, 0);
    expect(run(r, SETTLE_MS, WINDOW_FRAMES * 20, (i) => (i % 10 === 0 ? 200 : 16.7)).out).toEqual([]);
  });

  it('une fenêtre lente seule ne suffit pas', () => {
    const r = createResolution(2, 0);
    const slowFast = (i: number) => (Math.floor(i / WINDOW_FRAMES) % 2 === 0 ? 25 : 16.7);
    expect(run(r, SETTLE_MS, WINDOW_FRAMES * 10, slowFast).out).toEqual([]);
  });

  it('un écran bridé à 30 images par seconde (économie d’énergie) garde sa finesse', () => {
    expect(run(createResolution(2, 0), SETTLE_MS, WINDOW_FRAMES * 10, () => 33.3).out).toEqual([]);
  });

  it('un écran ×1 ou ×1,5 ne descend pas', () => {
    expect(run(createResolution(1, 0), SETTLE_MS, WINDOW_FRAMES * 10, () => 25).out).toEqual([]);
    expect(run(createResolution(1.5, 0), SETTLE_MS, WINDOW_FRAMES * 10, () => 25).out).toEqual([]);
  });
});
