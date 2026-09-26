import { RETURN_MS, VEIL_MS, VOYAGE_MS, legDuration, legTiming, vehiclePath } from './voyage';

it('un voyage dure huit secondes en deux temps, un retour cinq ; le voile est court', () => {
  expect(legDuration('depart', false) + legDuration('arrivee', false)).toBe(8000);
  expect(legDuration('depart', true) + legDuration('arrivee', true)).toBe(5000);
  expect(legTiming('depart', false)).toEqual(VOYAGE_MS.depart);
  expect(legTiming('arrivee', true)).toEqual(RETURN_MS.arrivee);
  expect(VEIL_MS).toBeLessThanOrEqual(1000);
  for (const t of [...Object.values(VOYAGE_MS), ...Object.values(RETURN_MS)]) {
    expect(t.walk).toBeGreaterThan(0);
    expect(t.sail).toBeGreaterThan(t.walk * 0.5);
  }
});

it('la trajectoire : la voile glisse vers le large, le ballon s’élève, le réacteur monte presque à la verticale', () => {
  for (const stage of [1, 2, 3] as const) {
    const start = vehiclePath(stage, 0);
    for (const v of Object.values(start)) expect(Math.abs(v)).toBeLessThan(1e-9);
    // Toujours vers le large (devant l'île, −y), et jamais en arrière.
    let prev = vehiclePath(stage, 0);
    for (let k = 0.1; k <= 1.0001; k += 0.1) {
      const p = vehiclePath(stage, k);
      expect(p.dy, `${stage} ${k}`).toBeLessThanOrEqual(prev.dy + 1e-9);
      expect(p.dz, `${stage} ${k}`).toBeGreaterThanOrEqual(prev.dz - 1e-9);
      prev = p;
    }
  }
  expect(vehiclePath(1, 1).dz).toBe(0);
  expect(vehiclePath(1, 1).dy).toBeLessThan(-20);
  expect(vehiclePath(2, 1).dz).toBeGreaterThanOrEqual(25);
  expect(vehiclePath(3, 1).dz).toBeGreaterThanOrEqual(50);
  expect(Math.abs(vehiclePath(3, 1).dy)).toBeLessThan(Math.abs(vehiclePath(1, 1).dy));
  // Hors de [0, 1] : borné.
  expect(vehiclePath(2, 2)).toEqual(vehiclePath(2, 1));
  expect(vehiclePath(2, -1)).toEqual(vehiclePath(2, 0));
});
