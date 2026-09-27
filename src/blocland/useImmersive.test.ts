import { resolveWorldView } from './useImmersive';

it('montre la vue choisie si l’appareil sait la dessiner, sinon la liste des îles', () => {
  const all = { webgl: true, canvas2d: true };
  expect(resolveWorldView('3d', all)).toBe('3d');
  expect(resolveWorldView('2d', all)).toBe('2d');
  expect(resolveWorldView('liste', all)).toBeNull();
  expect(resolveWorldView('3d', { webgl: false, canvas2d: true })).toBeNull();
  expect(resolveWorldView('2d', { webgl: true, canvas2d: false })).toBeNull();
});
