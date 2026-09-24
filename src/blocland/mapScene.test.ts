import { BIOMES } from './biomes';
import { ISLAND, islandOrigin, mapCubes } from './mapScene';

it('construit une île étiquetée par biome, avec créature seulement si débloqué', () => {
  const cubes = mapCubes({});
  for (const b of BIOMES) expect(cubes.filter((c) => c.tag === b.id).length).toBeGreaterThanOrEqual(ISLAND * ISLAND * 2);
  const foret = cubes.filter((c) => c.tag === 'foret');
  // Les ponts portent l'étiquette de l'île d'arrivée mais restent en bois : on ne regarde que l'île.
  const o = islandOrigin(1);
  const onIsland = (c: { x: number }) => c.x >= o.ox && c.x < o.ox + ISLAND;
  const mine = cubes.filter((c) => c.tag === 'mine' && onIsland(c));
  // La Forêt (ouverte) a des cubes de créature au-dessus du sol ; la Mine (fermée) est grise et sans créature.
  expect(foret.some((c) => c.z >= 1 && c.color === '#5e9b4a')).toBe(true);
  expect(mine.every((c) => c.color === '#b9b4a8')).toBe(true);
  const unlocked = mapCubes({ 'foret-x': { stars: 1 } });
  expect(unlocked.filter((c) => c.tag === 'mine' && onIsland(c)).some((c) => c.color !== '#b9b4a8')).toBe(true);
});

it('relie les îles par des ponts continus', () => {
  const cubes = mapCubes({});
  const a = islandOrigin(0);
  const b = islandOrigin(1);
  const [left, right] = a.ox < b.ox ? [a, b] : [b, a];
  const bridge = cubes.filter((c) => c.z === 0 && c.x >= left.ox + ISLAND && c.x < right.ox);
  expect(bridge.length).toBeGreaterThanOrEqual(right.ox - (left.ox + ISLAND));
  expect(new Set(cubes.map((c) => `${c.x},${c.y},${c.z}`)).size).toBe(cubes.length);
});
