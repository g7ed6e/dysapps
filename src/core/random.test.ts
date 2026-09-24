import { randomInt, shuffle } from './random';

it('shuffle conserve les éléments', () => {
  const items = [1, 2, 3, 4, 5];
  expect([...shuffle(items)].sort()).toEqual(items);
});

it('randomInt reste dans les bornes', () => {
  expect(randomInt(3, 7, () => 0)).toBe(3);
  expect(randomInt(3, 7, () => 0.9999)).toBe(7);
});
