// Le kit commun des lieux du 4e : le plan du sol d'un lieu, calculé au premier usage et jamais à l'import (retouche 1
// du Bastion, point 18), juste au-dessus du sol ; une valeur gardée après son premier calcul. Sans Three.js.
import { describe, expect, it, vi } from 'vitest';
import { groundPlane4e, once } from './place4eKit';

// Le sol du 4e, compté : un lieu des Fabriques ou du Bastion ne le lit jamais à l'import (restes des Fabriques et du
// Bastion, 22 octobre 2026 : la Forge, la Soute et la Porte calculaient encore leur cour, leur quai, leur place à l'import).
const ground4e = vi.hoisted(() => ({ calls: 0 }));
vi.mock('./terrain4e', async (importOriginal) => {
  const m = await importOriginal<typeof import('./terrain4e')>();
  return {
    ...m,
    heightAt4e: (p: Parameters<typeof m.heightAt4e>[0]) => {
      ground4e.calls++;
      return m.heightAt4e(p);
    },
  };
});

describe('Le kit des lieux du 4e', () => {
  it('le plan du sol ne se calcule qu’au premier usage, une seule fois, et ne passe jamais sous le sol', () => {
    let calls = 0;
    const ground = (x: number, z: number) => {
      calls++;
      return 0.1 * x - 0.05 * z + (x === 0 && z === 0 ? 0.3 : 0);
    };
    const plane = groundPlane4e(ground, [-2, 2], [-2, 2]);
    expect(calls).toBe(0);
    for (let x = -2; x <= 2; x += 0.5) for (let z = -2; z <= 2; z += 0.5) expect(plane(x, z)).toBeGreaterThanOrEqual(ground(x, z) - 1e-9);
    const first = calls;
    expect(first).toBe(81 + 81);
    plane(1, 1);
    expect(calls).toBe(first);
  });

  it('une valeur gardée : calculée une fois, au premier appel', () => {
    let n = 0;
    const v = once(() => ++n);
    expect(n).toBe(0);
    expect(v()).toBe(1);
    expect(v()).toBe(1);
    expect(n).toBe(1);
  });

  it('les lieux des Fabriques et du Bastion ne lisent jamais le sol à l’import', async () => {
    const before = ground4e.calls;
    await Promise.all([import('./forge4e'), import('./soute4e'), import('./porte4e'), import('./etalon4e'), import('./gabarit4e'), import('./manufacture4e'), import('./loge4e'), import('./chariot4e'), import('./recoin4e')]);
    expect(ground4e.calls).toBe(before);
    const { FORGE } = await import('./forge4e');
    expect(FORGE.site.rise).toBeGreaterThan(0);
    expect(ground4e.calls).toBeGreaterThan(before);
  });

  it('les lieux des Coteaux et de l’Épaule, la Crique et le niveau ne lisent jamais le sol à l’import (restes du monde ouvert du 4e, 23 octobre 2026)', async () => {
    const before = ground4e.calls;
    await Promise.all([
      import('./basilique4e'),
      import('./herbier4e'),
      import('./jonction4e'),
      import('./roches4e'),
      import('./veillee4e'),
      import('./terminus4e'),
      import('./orgues4e'),
      import('./dynamo4e'),
      import('./dalle4e'),
      import('./crique4e'),
      import('./levelWorld'),
    ]);
    expect(ground4e.calls).toBe(before);
    const { TERMINUS_LAYOUT } = await import('./terminus4e');
    expect(Number.isFinite(TERMINUS_LAYOUT.remiseY)).toBe(true);
    const { DYNAMO_LAYOUT } = await import('./dynamo4e');
    expect(Number.isFinite(DYNAMO_LAYOUT.posteY)).toBe(true);
    const { criqueLook } = await import('./crique4e');
    expect(Number.isFinite(criqueLook().y)).toBe(true);
    expect(ground4e.calls).toBeGreaterThan(before);
  });
});
