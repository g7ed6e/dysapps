import { fadeRgb, hexToRgb } from './color';

it('hexToRgb lit les trois composantes', () => {
  expect(hexToRgb('#3a3f47')).toEqual([0x3a, 0x3f, 0x47]);
});

it('fadeRgb efface une couleur vers le gris clair des îles fermées', () => {
  const [r, g, b] = fadeRgb(255, 0, 0);
  expect([r, g, b].map(Math.round)).toEqual([174, 117, 117]);
  expect(fadeRgb(205, 205, 205).map((c) => Math.round(c))).toEqual([205, 205, 205]);
});
