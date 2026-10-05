import { montreLeMonde } from './useImmersive';

it('montre le monde en 3D si l’appareil sait le dessiner, sinon la liste des îles', () => {
  expect(montreLeMonde('3d', true)).toBe(true);
  expect(montreLeMonde('list', true)).toBe(false);
  // Sans WebGL, la liste des îles.
  expect(montreLeMonde('3d', false)).toBe(false);
});
