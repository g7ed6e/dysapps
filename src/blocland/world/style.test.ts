import { ADOUCI, NUANCE, STYLES, bruit, normalesAdoucies, nuanceSommet } from './style';

it('propose les trois options du cadrage', () => {
  expect(STYLES).toEqual(['a', 'b', 'c']);
});

it('le bruit est reproductible, borné et continu', () => {
  for (let x = -5; x < 5; x += 0.37)
    for (let y = -5; y < 5; y += 0.41) {
      const v = bruit(x, y);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
      expect(bruit(x, y)).toBe(v);
      // Continu : un pas minuscule ne fait pas sauter la valeur.
      expect(Math.abs(bruit(x + 1e-4, y) - v)).toBeLessThan(1e-2);
    }
});

it('la nuance (b) reste douce : bornée, plus sombre vers la mer, et la même pour deux faces qui se touchent', () => {
  for (let x = 0; x < 40; x += 3)
    for (let y = -1; y < 14; y += 2)
      for (const dessus of [true, false]) {
        const v = nuanceSommet(x, y, x * 0.7, dessus);
        expect(v).toBeGreaterThanOrEqual(NUANCE[0]);
        expect(v).toBeLessThanOrEqual(NUANCE[1]);
      }
  expect(nuanceSommet(10, 0, 10, false)).toBeLessThan(nuanceSommet(10, 9, 10, false));
  // Un sommet partagé par deux dessus voisins a la même nuance : pas de couture entre les cubes.
  expect(nuanceSommet(4, 3, 7, true)).toBe(nuanceSommet(4, 3, 7, true));
});

it('les normales adoucies (c) penchent vers les coins, restent unitaires et du côté de la face', () => {
  // Le dessus d'un cube posé en (2, 5, 3) : Y en haut.
  const quad = [2, 6, 3, 2, 6, 4, 3, 6, 4, 3, 6, 3];
  const out = normalesAdoucies(quad, [0, 1, 0]);
  expect(out).toHaveLength(12);
  for (let k = 0; k < 4; k++) {
    const [x, y, z] = out.slice(k * 3, k * 3 + 3);
    expect(Math.hypot(x, y, z)).toBeCloseTo(1, 6);
    expect(y).toBeGreaterThan(0.6);
    // Vers son coin : le signe suit le décalage du sommet.
    expect(Math.sign(x)).toBe(Math.sign(quad[k * 3] - 2.5));
    expect(Math.sign(z)).toBe(Math.sign(quad[k * 3 + 2] - 3.5));
  }
  // Environ 35° au coin, pour ADOUCI = 0,5.
  const tilt = (Math.acos(out[1]) * 180) / Math.PI;
  expect(ADOUCI).toBe(0.5);
  expect(tilt).toBeGreaterThan(30);
  expect(tilt).toBeLessThan(40);
});
