import { BIOMES } from '../biomes';
import { MAP, landCells } from './map';
import { BRIDGES } from './archipelago';
import {
  avatarHome,
  avatarRoute,
  fade,
  DEPTH,
  ISLAND,
  ISLET_H,
  ISLET_W,
  bossIsletOrigin,
  creaturePlacements,
  groundHeight,
  guardianPlacements,
  islandAt,
  islandCenter,
  islandOrigin,
  mistPatches,
  whaleSpots,
  worldBounds,
  worldCubes,
} from './terrain';

const village = (bridges: string[]) => ({ plans: {}, journal: [], bridges });

it('construit une île par biome, avec créature seulement si un pont y mène', () => {
  const cubes = worldCubes({});
  for (const b of BIOMES) expect(cubes.filter((c) => c.tag === b.id).length).toBeGreaterThanOrEqual(ISLAND * ISLAND * (DEPTH + 1));
  const o = islandOrigin(1);
  const onIsland = (c: { x: number; y: number }) => c.x >= o.ox && c.x < o.ox + ISLAND && c.y >= o.oy && c.y < o.oy + ISLAND;
  const foret = cubes.filter((c) => c.tag === 'foret');
  const mine = cubes.filter((c) => c.tag === 'mine' && onIsland(c));
  // La Forêt (ouverte) a des cubes de créature au-dessus du sol ; la Mine (fermée) est délavée et sans créature.
  expect(foret.some((c) => c.z >= 1 && c.color === '#5e9b4a')).toBe(true);
  // Sans créatures dans le terrain (elles sont animées à part), la Forêt n'a plus de cube de Mousso.
  expect(worldCubes({}, undefined, false).some((c) => c.color === '#5e9b4a')).toBe(false);
  expect(creaturePlacements([]).map((c) => c.id)).toEqual(['foret', 'plaine']);
  expect(creaturePlacements(['foret-mine']).map((c) => c.id)).toEqual(['foret', 'mine', 'plaine']);
  expect(mine.every((c) => c.muted)).toBe(true);
  expect(mine.some((c) => c.texture === 'pierre')).toBe(true);
  expect(foret.some((c) => c.muted)).toBe(false);
  const unlocked = worldCubes({}, village(['foret-mine']));
  expect(unlocked.filter((c) => c.tag === 'mine' && onIsland(c)).some((c) => c.muted)).toBe(false);
  // Délavé : plus clair et moins saturé, jamais gris uniforme.
  expect(fade('#6cb33f')).not.toBe(fade('#b8623a'));
});

it('place les îles sur la carte du continent, à leur altitude', () => {
  const at = (id: string) => islandOrigin(BIOMES.findIndex((b) => b.id === id));
  expect(at('foret')).toEqual({ ox: 50, oy: 44, oz: 0 });
  expect(at('plaine').oz).toBe(0);
  expect(at('glacier').oz).toBe(3);
  expect(at('forge').oz).toBe(6);
  expect(at('phare').oz).toBe(9);
  expect(islandCenter('phare').z).toBe(9);
  // Le sol d'une île en altitude est bien à son altitude, et elle flotte : de la roche dessous, rien au niveau de la mer.
  const cubes = worldCubes({});
  const phare = cubes.filter((c) => c.tag === 'phare');
  expect(phare.some((c) => c.z === 9)).toBe(true);
  expect(phare.some((c) => c.z < 9 - DEPTH && c.texture === 'pierre')).toBe(true);
  // (Seule une cascade descend jusqu'à la mer.)
  expect(phare.some((c) => c.z <= 0 && c.texture !== 'eau' && c.texture !== 'nuage')).toBe(false);
});

it('le cœur a un relief léger : sol à 0 ou 1, jamais de trou, terre sous les cases surélevées', () => {
  const cubes = worldCubes({});
  const at = new Set(cubes.map((c) => `${c.x},${c.y},${c.z}`));
  BIOMES.forEach((_, i) => {
    const { ox, oy, oz } = islandOrigin(i);
    let raised = 0;
    for (let x = 0; x < ISLAND; x++) {
      for (let y = 0; y < ISLAND; y++) {
        const h = groundHeight(i, x, y);
        expect([0, 1]).toContain(h);
        for (let z = -DEPTH; z <= h; z++) expect(at.has(`${ox + x},${oy + y},${oz + z}`)).toBe(true);
        if (h) raised++;
      }
    }
    expect(raised).toBeGreaterThan(4);
    expect(raised).toBeLessThan((ISLAND * ISLAND) / 2);
  });
  // Aucun cube en double.
  expect(at.size).toBe(cubes.length);
});

it('relie les îles par des ponts continus (fantômes tant qu’ils ne sont pas construits), en rampe entre deux altitudes', () => {
  const bridgeCubes = (bridges: string[], id: string) => worldCubes({}, village(bridges)).filter((c) => c.bridge === id);
  // Forêt–Mine : un sentier sur l'isthme, constructible dès le début, donc en fantôme : des pierres de gué sur le sol.
  const trail = bridgeCubes([], 'foret-mine');
  expect(trail.length).toBeGreaterThanOrEqual(4);
  expect(trail.every((c) => c.ghost)).toBe(true);
  expect(trail.filter((c) => c.texture === 'galet').every((c) => c.z >= 1 && c.z <= 4)).toBe(true);
  // Forêt–Ferme : un pont, en planches, à plat (même altitude).
  const ghost = bridgeCubes([], 'foret-ferme').filter((c) => c.ghost);
  expect(ghost.length).toBeGreaterThanOrEqual(4);
  expect(ghost.filter((c) => c.texture !== 'lanterne' && c.texture !== 'tronc').every((c) => c.texture === 'planches' && c.z === 0)).toBe(true);
  // Une lanterne sur un poteau à chaque bout, à côté du tablier (jamais sur le passage).
  const lanterns = ghost.filter((c) => c.texture === 'lanterne');
  expect(lanterns).toHaveLength(2);
  const deck = new Set(ghost.filter((c) => c.texture === 'planches').map((c) => `${c.x},${c.y}`));
  for (const l of lanterns) expect(deck.has(`${l.x},${l.y}`)).toBe(false);
  const built = bridgeCubes(['foret-ferme'], 'foret-ferme').filter((c) => !c.ghost);
  expect(built.length).toBe(ghost.length);
  // Mine–Carrière : trop loin tant que la Mine est fermée, aucun cube de pont côté Carrière.
  expect(bridgeCubes([], 'mine-carriere')).toHaveLength(0);
  expect(bridgeCubes(['foret-mine'], 'mine-carriere').filter((c) => c.ghost).length).toBeGreaterThanOrEqual(4);
  // Plaine (0) → Glacier (3) : un escalier taillé qui monte, marches de pierre.
  const ramp = bridgeCubes([], 'plaine-glacier').filter((c) => c.ghost);
  expect(ramp.some((c) => c.texture === 'marche')).toBe(true);
  expect(ramp.every((c) => c.texture === 'marche' || c.texture === 'pierre' || c.texture === 'lanterne' || c.texture === 'tronc')).toBe(true);
  expect(Math.max(...ramp.map((c) => c.z))).toBeGreaterThan(Math.min(...ramp.map((c) => c.z)));
  // Plaine–Rivière : un bac, des poteaux de bois et un radeau, au fil de l'eau.
  const ferry = bridgeCubes([], 'plaine-riviere');
  expect(ferry.some((c) => c.texture === 'tronc')).toBe(true);
  expect(ferry.filter((c) => c.texture === 'planches').length).toBeGreaterThanOrEqual(3);
  expect(ferry.filter((c) => c.texture !== 'lanterne').every((c) => c.z === 0)).toBe(true);
  // Volcan (0) → Forge (6) : un tunnel, arches de pierre et lanternes au-dessus du chemin.
  const tunnel = bridgeCubes(['plaine-volcan'], 'volcan-forge');
  expect(tunnel.some((c) => c.texture === 'lanterne')).toBe(true);
  expect(tunnel.filter((c) => c.texture === 'pierre').length).toBeGreaterThanOrEqual(8);
  // Tour (0) → Textes (9) : un col, avec son garde-fou.
  const pass = bridgeCubes(['foret-ferme', 'ferme-tour'], 'tour-textes');
  expect(pass.some((c) => c.texture === 'barriere')).toBe(true);
  // Tout construit : aucun cube d'ouvrage en double, ni sur un autre cube.
  const all = worldCubes({}, village(BRIDGES.map((b) => b.id)), false);
  const seen = new Set<string>();
  for (const c of all) {
    const key = `${c.x},${c.y},${c.z}`;
    expect(seen.has(key), `cube en double en ${key} (${c.tag}, ${c.bridge})`).toBe(false);
    seen.add(key);
  }
  const cubes = worldCubes({});
  const bounds = worldBounds();
  for (const c of cubes) {
    expect(c.x).toBeGreaterThanOrEqual(bounds.minX);
    expect(c.x).toBeLessThan(bounds.maxX);
    expect(c.y).toBeGreaterThanOrEqual(bounds.minY);
    expect(c.y).toBeLessThan(bounds.maxY);
  }
});

it("retrouve l'île sous un point, y compris depuis un pont", () => {
  for (const b of BIOMES) {
    const c = islandCenter(b.id);
    expect(islandAt(c.x, c.y)).toBe(b.id);
  }
  const o = islandOrigin(1);
  // Juste à côté du bord du cœur de la deuxième île, sur sa terre ou son pont.
  expect(islandAt(o.ox + ISLAND + 1, o.oy + ISLAND / 2)).toBe(BIOMES[1].id);
});

it('le Gardien apparaît sur un îlot devant son île quand il accepte le défi, puis en statue de pierre une fois vaincu', async () => {
  const { typesWithContent } = await import('../boss');
  const { exercisesOf } = await import('../exercises');
  const { getBiome } = await import('../biomes');
  const ready: Record<string, { stars: number }> = {};
  for (const type of typesWithContent(getBiome('foret')!)) ready[exercisesOf('foret', type)[0].id] = { stars: 2 };
  expect(guardianPlacements({}, [])).toEqual([]);
  const front = bossIsletOrigin(0).y;
  expect(worldCubes({}).some((c) => c.tag === 'foret' && c.y < front + ISLET_H)).toBe(false);
  const [g] = guardianPlacements(ready, []);
  expect(g).toMatchObject({ id: 'foret', kind: 'guardian', still: true, beaten: false });
  const islet = worldCubes(ready).filter((c) => c.tag === 'foret' && c.y < front + ISLET_H);
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
  expect(worldCubes(beaten).some((c) => c.tag === 'foret' && c.y < front + ISLET_H && c.texture === 'or')).toBe(true);
});

it('les repères et les cascades : un grand arbre à la Forêt, un phare au Phare, de la fumée au Volcan, une cascade jusqu’à la mer', () => {
  const cubes = worldCubes({}, village(BRIDGES.map((b) => b.id)), false);
  const of = (id: string) => cubes.filter((c) => c.tag === id && !c.bridge);
  const foret = of('foret');
  expect(Math.max(...foret.filter((c) => c.texture === 'feuilles').map((c) => c.z))).toBeGreaterThanOrEqual(8);
  const phare = of('phare');
  expect(phare.filter((c) => c.texture === 'lanterne').length).toBeGreaterThanOrEqual(4);
  expect(Math.max(...phare.map((c) => c.z))).toBeGreaterThanOrEqual(9 + 10);
  expect(of('volcan').some((c) => c.color === '#a9a4a0')).toBe(true);
  expect(of('mine').some((c) => c.texture === 'toile')).toBe(true);
  expect(of('marais').filter((c) => c.color === '#d9453f').length).toBeGreaterThanOrEqual(20);
  // Au moins une île en altitude a une cascade : une colonne d'eau qui descend jusqu'au niveau de la mer.
  const falls = cubes.filter((c) => c.texture === 'eau' && c.z === 0 && BIOMES.some((b) => b.id === c.tag && islandCenter(b.id).z > 0));
  expect(falls.length).toBeGreaterThanOrEqual(1);
  expect(mistPatches().length).toBe(4);
  for (const m of mistPatches()) expect(m.z).toBe(7.5);
});

it('le bonhomme marche d’île en île sur les ouvrages construits, jamais sur l’eau', () => {
  expect(avatarRoute('foret', 'foret', [])).toEqual([avatarHome('foret')]);
  // Sans ouvrage construit vers la Mine : pas de chemin.
  expect(avatarRoute('foret', 'mine', [])).toBeNull();
  const route = avatarRoute('foret', 'mine', ['foret-mine'])!;
  expect(route[0]).toEqual(avatarHome('foret'));
  expect(route[route.length - 1]).toEqual(avatarHome('mine'));
  // Un sentier se marche de pierre de gué en pierre de gué (sur la pierre : z = sol + 1).
  expect(route.length).toBeGreaterThan(5);
  for (const p of route) expect(p.z).toBeGreaterThanOrEqual(0);
  const stones = new Set(
    worldCubes({}, village(['foret-mine']))
      .filter((c) => c.bridge === 'foret-mine' && c.texture === 'galet')
      .map((c) => `${c.x},${c.y},${c.z}`),
  );
  for (const p of route.slice(1, -1)) expect(stones.has(`${p.x},${p.y},${p.z}`)).toBe(true);
  // Deux ouvrages : Forêt → Ferme (pont) → Tour (sentier) ; le pont se marche sur le tablier (z = 1).
  const far = avatarRoute('foret', 'tour', ['foret-ferme', 'ferme-tour'])!;
  expect(far[far.length - 1]).toEqual(avatarHome('tour'));
  expect(far.some((p) => p.z === 1)).toBe(true);
  // En montant vers le Glacier (3), l'itinéraire monte.
  const up = avatarRoute('plaine', 'glacier', ['plaine-glacier'])!;
  expect(Math.max(...up.map((p) => p.z))).toBe(4);
});

it('les baleines nagent dans les clairières d’eau entre les îles, jamais sur une terre ni un îlot', () => {
  const spots = whaleSpots();
  expect(spots).toHaveLength(3);
  const land = new Set<string>();
  MAP.forEach((def, i) => {
    for (const c of landCells(def)) land.add(`${c.x},${c.y}`);
    const o = bossIsletOrigin(i);
    for (let x = 0; x < ISLET_W; x++) for (let y = 0; y < ISLET_H; y++) land.add(`${o.x + x},${o.y + y}`);
  });
  const b = worldBounds();
  for (const s of spots) {
    expect(s.r).toBeGreaterThanOrEqual(4);
    // Dans le monde (visible), et tout le rond (avec deux cases de marge) dans l'eau.
    expect(s.x).toBeGreaterThan(b.minX);
    expect(s.x).toBeLessThan(b.maxX);
    for (let x = Math.floor(s.x - s.r - 2); x <= Math.ceil(s.x + s.r + 2); x++)
      for (let y = Math.floor(s.y - s.r - 2); y <= Math.ceil(s.y + s.r + 2); y++)
        if (Math.hypot(x - s.x, y - s.y) <= s.r + 2) expect(land.has(`${x},${y}`), `baleine sur la terre en ${x},${y}`).toBe(false);
  }
});
