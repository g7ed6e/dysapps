import { clamp, smooth, smoothstep } from './math';

it('clamp ramène dans les bornes', () => {
  expect([clamp(-1, 0, 1), clamp(0.4, 0, 1), clamp(3, 0, 1)]).toEqual([0, 0.4, 1]);
});

it('smoothstep vaut 0 avant le premier seuil, 1 après le second, la rampe douce entre les deux', () => {
  expect([smoothstep(1, 3, 0), smoothstep(1, 3, 2), smoothstep(1, 3, 9)]).toEqual([0, smooth(0.5), 1]);
  expect(smooth(0.5)).toBe(0.5);
});
