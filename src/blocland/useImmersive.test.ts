import { resolveWorldView } from './useImmersive';

it('montre la vue choisie si l’appareil sait la dessiner, sinon la liste des îles', () => {
  const all = { webgl: true, canvas2d: true };
  expect(resolveWorldView('3d', all)).toBe('3d');
  expect(resolveWorldView('2d', all)).toBe('2d');
  expect(resolveWorldView('liste', all)).toBeNull();
  // Sans WebGL, le monde en 3D laisse la place au monde en 2D ; sans dessin du tout, la liste.
  expect(resolveWorldView('3d', { webgl: false, canvas2d: true })).toBe('2d');
  expect(resolveWorldView('3d', { webgl: false, canvas2d: false })).toBeNull();
  expect(resolveWorldView('2d', { webgl: true, canvas2d: false })).toBeNull();
});
