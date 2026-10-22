// Le kit commun des lieux du 4e : le plan du sol d'un lieu, calculé au premier usage et jamais à l'import (retouche 1
// du Bastion, point 18), juste au-dessus du sol ; une valeur gardée après son premier calcul. Sans Three.js.
import { describe, expect, it } from 'vitest';
import { groundPlane4e, once } from './place4eKit';

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
});
