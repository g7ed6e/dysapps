import { montreLeMonde } from './useImmersive';

it('montre le monde en 3D si l’appareil sait le dessiner, sinon la liste des îles, jamais la 2D', () => {
  expect(montreLeMonde('3d', true)).toBe(true);
  expect(montreLeMonde('liste', true)).toBe(false);
  // Sans WebGL, la liste des îles : la vue 2D n'est pas un repli.
  expect(montreLeMonde('3d', false)).toBe(false);
});
