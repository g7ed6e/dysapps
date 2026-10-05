import { cellHash, mulberry32, randomInt, seeded, shuffle } from './random';

it('shuffle conserve les éléments', () => {
  const items = [1, 2, 3, 4, 5];
  expect([...shuffle(items)].sort()).toEqual(items);
});

it('randomInt reste dans les bornes', () => {
  expect(randomInt(3, 7, () => 0)).toBe(3);
  expect(randomInt(3, 7, () => 0.9999)).toBe(7);
});

// Les suites d'avant la mise en commun (5 octobre 2026) : les tirages des parties, les textures et le relief n'ont pas
// bougé d'un bit.
it('seeded, mulberry32 et cellHash rendent les mêmes suites qu’avant', () => {
  const a = seeded('6e-fractions#abc');
  expect([a(), a(), a()]).toEqual([0.3224453197326511, 0.6057293822523206, 0.577436902327463]);
  const b = mulberry32(0xdeadbeef);
  expect([b(), b(), b()]).toEqual([0.9413696140982211, 0.26719574979506433, 0.772033357527107]);
  expect([cellHash(3, -7), cellHash(12, 5, 40), cellHash(-1, 0)]).toEqual([0.3137954112607986, 0.7077056299895048, 0.5404983453918248]);
});
