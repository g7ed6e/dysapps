import { BIOMES } from '../biomes';
import {
  DEPTH,
  GAP,
  ISLAND,
  ISLET_H,
  ISLET_W,
  ROW_GAP,
  bossIsletOrigin,
  creaturePlacements,
  groundHeight,
  guardianPlacements,
  islandAt,
  islandCenter,
  islandOrigin,
  worldBounds,
  worldCubes,
} from './terrain';

const village = (bridges: string[]) => ({ placed: {}, plans: {}, journal: [], bridges });

it('construit une île par biome, avec créature seulement si un pont y mène', () => {
  const cubes = worldCubes({});
  for (const b of BIOMES) expect(cubes.filter((c) => c.tag === b.id).length).toBeGreaterThanOrEqual(ISLAND * ISLAND * (DEPTH + 1));
  const o = islandOrigin(1);
  const onIsland = (c: { x: number; y: number }) => c.x >= o.ox && c.x < o.ox + ISLAND && c.y >= o.oy && c.y < o.oy + ISLAND;
  const foret = cubes.filter((c) => c.tag === 'foret');
  const mine = cubes.filter((c) => c.tag === 'mine' && onIsland(c));
  // La Forêt (ouverte) a des cubes de créature au-dessus du sol ; la Mine (fermée) est grise et sans créature.
  expect(foret.some((c) => c.z >= 1 && c.color === '#5e9b4a')).toBe(true);
  // Sans créatures dans le terrain (elles sont animées à part), la Forêt n'a plus de cube de Mousso.
  expect(worldCubes({}, undefined, false).some((c) => c.color === '#5e9b4a')).toBe(false);
  expect(creaturePlacements([]).map((c) => c.id)).toEqual(['foret', 'plaine']);
  expect(creaturePlacements(['foret-mine']).map((c) => c.id)).toEqual(['foret', 'mine', 'plaine']);
  expect(mine.every((c) => c.color === '#b9b4a8' && c.texture === 'pierre')).toBe(true);
  const unlocked = worldCubes({}, village(['foret-mine']));
  expect(unlocked.filter((c) => c.tag === 'mine' && onIsland(c)).some((c) => c.color !== '#b9b4a8')).toBe(true);
});

it('place les îles selon l’archipel : la Forêt au centre, une rangée devant pour les maths', () => {
  const at = (id: string) => islandOrigin(BIOMES.findIndex((b) => b.id === id));
  expect(at('foret').oy).toBe(0);
  expect(at('mine').ox).toBe(at('foret').ox + ISLAND + GAP);
  expect(at('ferme').ox).toBe(at('foret').ox - ISLAND - GAP);
  expect(at('carriere').ox).toBe(at('mine').ox + ISLAND + GAP);
  expect(at('tour').ox).toBe(at('ferme').ox - ISLAND - GAP);
  // La Plaine des nombres, devant la Forêt, laisse la place à l'îlot du Gardien entre les deux rangées.
  expect(at('plaine').ox).toBe(at('foret').ox);
  expect(at('plaine').oy).toBe(-(ISLAND + ROW_GAP));
  expect(at('plaine').oy + ISLAND).toBeLessThan(bossIsletOrigin(0).y);
  expect(at('riviere')).toEqual({ ox: at('mine').ox, oy: at('plaine').oy });
  expect(at('volcan')).toEqual({ ox: at('ferme').ox, oy: at('plaine').oy });
  expect(at('glacier')).toEqual({ ox: at('foret').ox, oy: -2 * (ISLAND + ROW_GAP) });
  expect(at('glacier').oy + ISLAND).toBeLessThan(bossIsletOrigin(BIOMES.findIndex((b) => b.id === 'plaine')).y);
  // Le français du cycle 4 est derrière la Forêt ; l'îlot du Gardien du Carrefour reste au-dessus de la Forêt.
  expect(at('carrefour')).toEqual({ ox: at('foret').ox, oy: ISLAND + ROW_GAP });
  expect(bossIsletOrigin(BIOMES.findIndex((b) => b.id === 'carrefour')).y).toBeGreaterThanOrEqual(ISLAND + 1);
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

it('relie les îles par des ponts continus (fantômes tant qu’ils ne sont pas construits) et connaît les bornes du monde', () => {
  const a = islandOrigin(0);
  const b = islandOrigin(1);
  const [left, right] = a.ox < b.ox ? [a, b] : [b, a];
  // Sur la rangée de la Forêt seulement (la rangée des maths a ses propres ponts).
  const between = (c: { x: number; y: number; z: number }) =>
    c.z === 0 && c.x >= left.ox + ISLAND && c.x < right.ox && c.y >= left.oy && c.y < left.oy + ISLAND;
  // Forêt–Mine : constructible dès le début, donc en fantôme ; construit, en planches.
  const ghost = worldCubes({}).filter(between);
  expect(ghost.length).toBeGreaterThanOrEqual(GAP);
  expect(ghost.every((c) => c.ghost && c.texture === 'planches')).toBe(true);
  const built = worldCubes({}, village(['foret-mine'])).filter(between);
  expect(built.length).toBe(ghost.length);
  expect(built.every((c) => !c.ghost)).toBe(true);
  // Mine–Carrière : trop loin tant que la Mine est fermée, aucun cube.
  const m = islandOrigin(BIOMES.findIndex((x) => x.id === 'mine'));
  const q = islandOrigin(BIOMES.findIndex((x) => x.id === 'carriere'));
  const far = (c: { x: number; y: number; z: number }) => c.z === 0 && c.x >= m.ox + ISLAND && c.x < q.ox && c.y >= m.oy && c.y < m.oy + ISLAND;
  expect(worldCubes({}).filter(far)).toHaveLength(0);
  expect(worldCubes({}, village(['foret-mine'])).filter(far).length).toBeGreaterThanOrEqual(GAP);
  const cubes = worldCubes({});
  const bounds = worldBounds();
  expect(bounds.maxX - bounds.minX).toBe(5 * ISLAND + 4 * GAP);
  expect(bounds.maxY - bounds.minY).toBe(5 * ISLAND + 4 * ROW_GAP);
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

it('le Gardien apparaît sur un îlot devant son île quand il accepte le défi, puis en statue de pierre une fois vaincu', async () => {
  const { typesWithContent } = await import('../boss');
  const { exercisesOf } = await import('../exercises');
  const { getBiome } = await import('../biomes');
  const ready: Record<string, { stars: number }> = {};
  for (const type of typesWithContent(getBiome('foret')!)) ready[exercisesOf('foret', type)[0].id] = { stars: 2 };
  expect(guardianPlacements({}, [])).toEqual([]);
  expect(worldCubes({}).some((c) => c.tag === 'foret' && c.y < 0)).toBe(false);
  const [g] = guardianPlacements(ready, []);
  expect(g).toMatchObject({ id: 'foret', kind: 'guardian', still: true, beaten: false });
  const islet = worldCubes(ready).filter((c) => c.tag === 'foret' && c.y < 0);
  // Plateforme de pierre sur deux couches de terre, devant l'île, sous les pieds du Gardien.
  expect(islet.filter((c) => c.z === 0 && c.texture === 'pierre')).toHaveLength(ISLET_W * ISLET_H);
  expect(islet.filter((c) => c.z < 0).every((c) => c.texture === 'terre')).toBe(true);
  expect(g.origin).toEqual({ x: bossIsletOrigin(0).x, y: bossIsletOrigin(0).y, z: 1 });
  expect(islet.some((c) => c.texture === 'or')).toBe(false);
  // Vaincu : statue grise et bloc d'or.
  const beaten = { ...ready, 'foret-gardien': { stars: 2 } };
  const [s] = guardianPlacements(beaten, []);
  expect(s.beaten).toBe(true);
  expect(s.cubes.every((c) => /^#([0-9a-f]{2})\1\1$/.test(c.color))).toBe(true);
  expect(worldCubes(beaten).some((c) => c.tag === 'foret' && c.y < 0 && c.texture === 'or')).toBe(true);
});
