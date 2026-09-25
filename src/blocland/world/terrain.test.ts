import { BIOMES } from '../biomes';
import { DEPTH, GAP, ISLAND, creaturePlacements, groundHeight, islandAt, islandCenter, islandOrigin, worldBounds, worldCubes } from './terrain';

it('construit une île par biome, avec créature seulement si débloqué', () => {
  const cubes = worldCubes({});
  for (const b of BIOMES) expect(cubes.filter((c) => c.tag === b.id).length).toBeGreaterThanOrEqual(ISLAND * ISLAND * (DEPTH + 1));
  const o = islandOrigin(1);
  const onIsland = (c: { x: number }) => c.x >= o.ox && c.x < o.ox + ISLAND;
  const foret = cubes.filter((c) => c.tag === 'foret');
  const mine = cubes.filter((c) => c.tag === 'mine' && onIsland(c));
  // La Forêt (ouverte) a des cubes de créature au-dessus du sol ; la Mine (fermée) est grise et sans créature.
  expect(foret.some((c) => c.z >= 1 && c.color === '#5e9b4a')).toBe(true);
  // Sans créatures dans le terrain (elles sont animées à part), la Forêt n'a plus de cube de Mousso.
  expect(worldCubes({}, undefined, false).some((c) => c.color === '#5e9b4a')).toBe(false);
  expect(creaturePlacements({}).map((c) => c.id)).toEqual(['foret']);
  expect(creaturePlacements({ 'foret-x': { stars: 1 } }).map((c) => c.id)).toEqual(['foret', 'mine']);
  expect(mine.every((c) => c.color === '#b9b4a8' && c.texture === 'pierre')).toBe(true);
  const unlocked = worldCubes({ 'foret-x': { stars: 1 } });
  expect(unlocked.filter((c) => c.tag === 'mine' && onIsland(c)).some((c) => c.color !== '#b9b4a8')).toBe(true);
});

it('a un relief léger : sol à 0 ou 1, jamais de trou, terre sous les cases surélevées', () => {
  const cubes = worldCubes({});
  const at = new Set(cubes.map((c) => `${c.x},${c.y},${c.z}`));
  BIOMES.forEach((_, i) => {
    const { ox, oy } = islandOrigin(i);
    let raised = 0;
    for (let x = 0; x < ISLAND; x++) {
      for (let y = 0; y < ISLAND; y++) {
        const h = groundHeight(i, x, y);
        expect([0, 1]).toContain(h);
        for (let z = -DEPTH; z <= h; z++) expect(at.has(`${ox + x},${oy + y},${z}`)).toBe(true);
        if (h) raised++;
      }
    }
    expect(raised).toBeGreaterThan(4);
    expect(raised).toBeLessThan((ISLAND * ISLAND) / 2);
  });
  // Aucun cube en double.
  expect(at.size).toBe(cubes.length);
});

it('relie les îles par des ponts continus et connaît les bornes du monde', () => {
  const cubes = worldCubes({});
  const a = islandOrigin(0);
  const b = islandOrigin(1);
  const [left, right] = a.ox < b.ox ? [a, b] : [b, a];
  const bridge = cubes.filter((c) => c.z === 0 && c.x >= left.ox + ISLAND && c.x < right.ox);
  expect(bridge.length).toBeGreaterThanOrEqual(GAP);
  const bounds = worldBounds();
  expect(bounds.maxX - bounds.minX).toBe(BIOMES.length * ISLAND + (BIOMES.length - 1) * GAP);
  for (const c of cubes) {
    expect(c.x).toBeGreaterThanOrEqual(bounds.minX);
    expect(c.x).toBeLessThan(bounds.maxX);
  }
});

it("retrouve l'île sous un point, y compris depuis un pont", () => {
  for (const b of BIOMES) {
    const c = islandCenter(b.id);
    expect(islandAt(c.x, c.y)).toBe(b.id);
  }
  const o = islandOrigin(1);
  // Juste à côté du bord de la deuxième île, sur le pont.
  expect(islandAt(o.ox + ISLAND + 1, o.oy + ISLAND / 2)).toBe(BIOMES[1].id);
});
