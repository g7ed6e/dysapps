import { BIOMES } from '../biomes';
import { ARCHIPELAGO_IDS, CORE, MAP, islandDef, landBox, landCells, mapOf } from './map';
import { PLAN_ZONE } from './plans';
import { CREATURE_CUBES } from '../Creatures';
import { GUARDIAN_CUBES } from '../Guardians';
import { ARCHIPELAGOS, BRIDGES, VOYAGES, archipelagoOf } from './archipelago';
import { dockBox, dockCells, dockOrigin, VEHICLE_DECK, VEHICLE_SIZE } from './harbour';
import { VEHICLE_STAGES } from './vehicle';
import {
  avatarHome,
  avatarRoute,
  boardingRoute,
  bossIsletOrigin,
  bridgePath,
  creaturePlacements,
  creatureSpot,
  DEPTH,
  fade,
  groundHeight,
  guardianPlacements,
  ISLAND,
  islandAt,
  islandCenter,
  islandOrigin,
  ISLET_H,
  ISLET_W,
  mistPatches,
  questStations,
  seaDecor,
  vehiclePlacement,
  VIEW_YAW_MAX,
  viewYaw,
  viewZone,
  whaleSpots,
  worldBounds,
  worldCubes,
} from './terrain';

const village = (bridges: string[]) => ({ plans: {}, journal: [], bridges });
/** Tous les archipels d'un coup, pour les tests qui parcourent les vingt îles. */
const allCubes = (progress: Record<string, { stars: number }>, v = village([]), withCreatures = true) =>
  ARCHIPELAGO_IDS.flatMap((a) => worldCubes(a, progress, v, withCreatures));
/** Tout construit : les ouvrages et les voyages. */
const everything = [...BRIDGES, ...VOYAGES].map((b) => b.id);

it('construit une île par biome, avec créature seulement si un pont y mène', () => {
  const cubes = allCubes({});
  for (const b of BIOMES) expect(cubes.filter((c) => c.tag === b.id).length).toBeGreaterThanOrEqual(ISLAND * ISLAND * (DEPTH + 1));
  const o = islandOrigin(1);
  const onIsland = (c: { x: number; y: number }) => c.x >= o.ox && c.x < o.ox + ISLAND && c.y >= o.oy && c.y < o.oy + ISLAND;
  const foret = cubes.filter((c) => c.tag === 'foret');
  const mine = cubes.filter((c) => c.tag === 'mine' && onIsland(c));
  // La Forêt (ouverte) a des cubes de créature au-dessus du sol ; la Mine (fermée) est délavée et sans créature.
  expect(foret.some((c) => c.z >= 1 && c.color === '#5e9b4a')).toBe(true);
  // Sans créatures dans le terrain (elles sont animées à part), la Forêt n'a plus de cube de Mousso.
  expect(worldCubes('6e', {}, undefined, false).some((c) => c.color === '#5e9b4a')).toBe(false);
  expect(creaturePlacements('6e', []).map((c) => c.id)).toEqual(['foret', 'plaine']);
  expect(creaturePlacements('6e', ['foret-mine']).map((c) => c.id)).toEqual(['foret', 'mine', 'plaine']);
  // Les créatures d'un autre archipel ne sont pas dans cette scène.
  expect(creaturePlacements('5e', ['voyage-5e']).map((c) => c.id)).toEqual(['marche']);
  expect(mine.every((c) => c.muted)).toBe(true);
  expect(mine.some((c) => c.texture === 'pierre')).toBe(true);
  expect(foret.some((c) => c.muted)).toBe(false);
  const unlocked = worldCubes('6e', {}, village(['foret-mine']));
  expect(unlocked.filter((c) => c.tag === 'mine' && onIsland(c)).some((c) => c.muted)).toBe(false);
  // Délavé : plus clair et moins saturé, jamais gris uniforme.
  expect(fade('#6cb33f')).not.toBe(fade('#b8623a'));
});

it('place les îles de chaque archipel dans leur bande, à leur altitude', () => {
  const at = (id: string) => islandOrigin(BIOMES.findIndex((b) => b.id === id));
  expect(at('foret')).toEqual({ ox: 67, oy: 59, oz: 0 });
  expect(at('plaine').oz).toBe(0);
  expect(at('glacier').oz).toBe(3);
  expect(at('forge').oz).toBe(6);
  expect(at('phare').oz).toBe(9);
  expect(islandCenter('phare').z).toBe(9);
  // Le sol d'une île en altitude est bien à son altitude, et elle flotte : de la roche dessous, rien au niveau de la mer.
  const cubes = worldCubes('3e', {});
  const phare = cubes.filter((c) => c.tag === 'phare');
  expect(phare.some((c) => c.z === 9)).toBe(true);
  expect(phare.some((c) => c.z < 9 - DEPTH && c.texture === 'pierre')).toBe(true);
  // (Seule une cascade descend jusqu'à la mer ; le quai du Phare est à hauteur d'île.)
  expect(phare.some((c) => c.z <= 0 && c.texture !== 'eau' && c.texture !== 'nuage')).toBe(false);
  // Chaque archipel occupe sa bande : les étendues ne se recouvrent pas, et une scène ne contient que ses îles.
  for (let i = 0; i + 1 < ARCHIPELAGO_IDS.length; i++) {
    const a = worldBounds(ARCHIPELAGO_IDS[i]);
    const b = worldBounds(ARCHIPELAGO_IDS[i + 1]);
    expect(a.maxY, `${ARCHIPELAGO_IDS[i]} / ${ARCHIPELAGO_IDS[i + 1]}`).toBeLessThan(b.minY);
  }
  for (const a of ARCHIPELAGO_IDS) {
    const tags = new Set(worldCubes(a, {}).map((c) => c.tag));
    for (const b of BIOMES) expect(tags.has(b.id), `${b.id} dans ${a}`).toBe(b.classe === a);
  }
});

it('le cœur a un relief léger : sol à 0 ou 1, jamais de trou, terre sous les cases surélevées', () => {
  const cubes = allCubes({});
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

it('relie les îles par des ponts continus (fantômes tant qu’ils ne sont pas construits), tous dans leur archipel', () => {
  const bridgeCubes = (bridges: string[], id: string) => allCubes({}, village(bridges)).filter((c) => c.bridge === id);
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
  // Plaine–Rivière : un bac, des poteaux de bois et un radeau, au fil de l'eau.
  const ferry = bridgeCubes([], 'plaine-riviere');
  expect(ferry.some((c) => c.texture === 'tronc')).toBe(true);
  expect(ferry.filter((c) => c.texture === 'planches').length).toBeGreaterThanOrEqual(3);
  expect(ferry.filter((c) => c.texture !== 'lanterne').every((c) => c.z === 0)).toBe(true);
  // Falaise → Cabinet : un escalier taillé (à plat dans un archipel : de la pierre), Phare → Textes : un col à garde-fou.
  const stairs = bridgeCubes(['voyage-5e', 'voyage-4e', 'atelier-falaise'], 'falaise-cabinet');
  expect(stairs.some((c) => c.texture === 'pierre')).toBe(true);
  const pass = bridgeCubes(['voyage-5e', 'voyage-4e', 'voyage-3e'], 'phare-textes');
  expect(pass.some((c) => c.texture === 'barriere')).toBe(true);
  // Chaque ouvrage relie deux îles du même archipel.
  for (const b of BRIDGES) expect(archipelagoOf(b.from).classe, b.id).toBe(archipelagoOf(b.to).classe);
  // Tout construit : aucun cube d'ouvrage en double, ni sur un autre cube.
  const all = allCubes({}, village(everything), false);
  const seen = new Set<string>();
  for (const c of all) {
    const key = `${c.x},${c.y},${c.z}`;
    expect(seen.has(key), `cube en double en ${key} (${c.tag}, ${c.bridge})`).toBe(false);
    seen.add(key);
  }
  // Tout tient dans son archipel, sauf l'habillage de la mer, semé au large exprès.
  for (const a of ARCHIPELAGO_IDS) {
    const cubes = worldCubes(a, {}, village(everything)).filter((c) => c.tag !== 'mer');
    const bounds = worldBounds(a);
    for (const c of cubes) {
      expect(c.x, `${a} ${c.tag}`).toBeGreaterThanOrEqual(bounds.minX);
      expect(c.x, `${a} ${c.tag}`).toBeLessThan(bounds.maxX);
      expect(c.y, `${a} ${c.tag}`).toBeGreaterThanOrEqual(bounds.minY);
      expect(c.y, `${a} ${c.tag}`).toBeLessThan(bounds.maxY);
    }
  }
  // (Ce test reconstruit les quatre archipels plusieurs fois : on lui laisse le temps sur une machine chargée.)
}, 30_000);

it("retrouve l'île sous un point, y compris depuis un pont", () => {
  for (const b of BIOMES) {
    const c = islandCenter(b.id);
    expect(islandAt(b.classe, c.x, c.y)).toBe(b.id);
  }
  const o = islandOrigin(1);
  // Juste à côté du bord du cœur de la deuxième île, sur sa terre ou son pont.
  expect(islandAt('6e', o.ox + ISLAND + 1, o.oy + ISLAND / 2)).toBe(BIOMES[1].id);
});

it('le Gardien apparaît sur un îlot devant son île quand il accepte le défi, puis en statue de pierre une fois vaincu', async () => {
  const { typesWithContent } = await import('../boss');
  const { exercisesOf } = await import('../exercises');
  const { getBiome } = await import('../biomes');
  const ready: Record<string, { stars: number }> = {};
  for (const type of typesWithContent(getBiome('foret')!)) ready[exercisesOf('foret', type)[0].id] = { stars: 2 };
  expect(guardianPlacements('6e', {}, [])).toEqual([]);
  const front = bossIsletOrigin(0).y;
  expect(worldCubes('6e', {}).some((c) => c.tag === 'foret' && c.y < front + ISLET_H)).toBe(false);
  const [g] = guardianPlacements('6e', ready, []);
  expect(g).toMatchObject({ id: 'foret', kind: 'guardian', still: true, beaten: false });
  const islet = worldCubes('6e', ready).filter((c) => c.tag === 'foret' && c.y < front + ISLET_H);
  // Plateforme de pierre sur deux couches de terre, devant l'île, sous les pieds du Gardien.
  expect(islet.filter((c) => c.z === 0 && c.texture === 'pierre')).toHaveLength(ISLET_W * ISLET_H);
  expect(islet.filter((c) => c.z < 0).every((c) => c.texture === 'terre')).toBe(true);
  expect(g.origin).toEqual({ x: bossIsletOrigin(0).x, y: bossIsletOrigin(0).y, z: 1 });
  expect(islet.some((c) => c.texture === 'or')).toBe(false);
  // Vaincu : statue grise et bloc d'or.
  const beaten = { ...ready, 'foret-gardien': { stars: 2 } };
  const [s] = guardianPlacements('6e', beaten, []);
  expect(s.beaten).toBe(true);
  expect(s.cubes.every((c) => /^#([0-9a-f]{2})\1\1$/.test(c.color))).toBe(true);
  expect(worldCubes('6e', beaten).some((c) => c.tag === 'foret' && c.y < front + ISLET_H && c.texture === 'or')).toBe(true);
});

it('les repères et les cascades : un grand arbre à la Forêt, un phare au Phare, de la fumée au Volcan, une cascade jusqu’à la mer', () => {
  const cubes = allCubes({}, village(everything), false);
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
  // La brume des sommets : sous les quatre Îles du Ciel, nulle part ailleurs.
  expect(mistPatches('3e').length).toBe(4);
  for (const m of mistPatches('3e')) expect(m.z).toBe(7.5);
  expect(mistPatches('6e')).toEqual([]);
  // Un repère par archipel du collège aussi : l'aiguille de glace du Glacier, le haut-fourneau de la Forge.
  const glacier = of('glacier');
  expect(glacier.filter((c) => c.texture === 'glace' && c.z >= 3 + 6).length).toBeGreaterThanOrEqual(3);
  expect(glacier.some((c) => c.texture === 'cristal' && c.z >= 3 + 9)).toBe(true);
  const forge = of('forge');
  expect(forge.filter((c) => c.texture === 'basalte' && c.z >= 6 + 9).length).toBeGreaterThanOrEqual(4);
  expect(forge.some((c) => c.texture === 'lave' && c.z >= 6 + 10)).toBe(true);
  expect(forge.some((c) => c.color === '#a9a4a0' && c.z >= 6 + 12)).toBe(true);
});

it('le bonhomme marche d’île en île sur les ouvrages construits, jamais sur l’eau, et pas d’un archipel à l’autre', () => {
  expect(avatarRoute('foret', 'foret', [])).toEqual([avatarHome('foret')]);
  // Sans ouvrage construit vers la Mine : pas de chemin.
  expect(avatarRoute('foret', 'mine', [])).toBeNull();
  const route = avatarRoute('foret', 'mine', ['foret-mine'])!;
  expect(route[0]).toEqual(avatarHome('foret'));
  expect(route[route.length - 1]).toEqual(avatarHome('mine'));
  // Un sentier se marche de pierre de gué en pierre de gué (sur la pierre, pas dedans : ses pieds sont sur son dessus).
  expect(route.length).toBeGreaterThan(5);
  for (const p of route) expect(p.z).toBeGreaterThanOrEqual(0);
  const stones = new Set(
    worldCubes('6e', {}, village(['foret-mine']))
      .filter((c) => c.bridge === 'foret-mine' && c.texture === 'galet')
      .map((c) => `${c.x},${c.y},${c.z}`),
  );
  for (const p of route.slice(1, -1)) expect(stones.has(`${p.x},${p.y},${p.z - 1}`)).toBe(true);
  // Deux ouvrages : Forêt → Ferme (pont) → Tour (sentier) ; le pont se marche sur le tablier (z = 1).
  const far = avatarRoute('foret', 'tour', ['foret-ferme', 'ferme-tour'])!;
  expect(far[far.length - 1]).toEqual(avatarHome('tour'));
  expect(far.some((p) => p.z === 1)).toBe(true);
  // D'un archipel à l'autre, on ne marche pas : c'est le Bloc-Navire (changement de scène).
  expect(avatarRoute('plaine', 'marche', ['voyage-5e'])).toBeNull();
  // Dans les Collines, on marche à leur altitude.
  const up = avatarRoute('marche', 'marais', ['voyage-5e', 'marche-marais'])!;
  expect(Math.min(...up.map((p) => p.z))).toBe(4);
});

it('le bonhomme a toujours les pieds sur un bloc, jamais dedans, sur chaque île et chaque ouvrage (hors bac)', () => {
  const solid = new Set(
    allCubes({}, village(everything), false)
      .filter((c) => !c.ghost)
      .map((c) => `${c.x},${c.y},${c.z}`),
  );
  // Sur son île, il se tient sur le sol, à la même hauteur que la créature.
  for (const b of BIOMES) {
    const h = avatarHome(b.id);
    expect(h.z, b.id).toBe(islandOrigin(BIOMES.indexOf(b)).oz + 1);
  }
  const ferries = new Set(BRIDGES.filter((b) => b.kind === 'bac').map((b) => b.id));
  for (const bridge of BRIDGES) {
    if (ferries.has(bridge.id)) continue; // le bac flotte au fil de l'eau, entre ses poteaux
    const route = avatarRoute(bridge.from, bridge.to, [bridge.id])!;
    for (const p of route) {
      expect(solid.has(`${p.x},${p.y},${p.z - 1}`), `${bridge.id} (${p.x},${p.y},${p.z}) sur un bloc`).toBe(true);
      expect(solid.has(`${p.x},${p.y},${p.z}`), `${bridge.id} (${p.x},${p.y},${p.z}) pas dans un bloc`).toBe(false);
    }
  }
});

it('les baleines nagent dans les clairières d’eau de chaque archipel, jamais sur une terre, un îlot ni le port', () => {
  // Pas de mer dans les Îles du Ciel : pas de baleines.
  expect(whaleSpots('3e')).toEqual([]);
  for (const a of ARCHIPELAGO_IDS) {
    if (a === '3e') continue;
    const spots = whaleSpots(a);
    // Quatre dans les Basses Terres ; au moins deux dans les petits archipels, où l'eau libre est plus rare.
    expect(spots.length, a).toBeGreaterThanOrEqual(a === '6e' ? 4 : 2);
    expect(spots.length, a).toBeLessThanOrEqual(4);
    const land = new Set<string>();
    for (const def of mapOf(a)) {
      for (const c of landCells(def)) land.add(`${c.x},${c.y}`);
      const o = bossIsletOrigin(BIOMES.findIndex((b) => b.id === def.id));
      for (let x = 0; x < ISLET_W; x++) for (let y = 0; y < ISLET_H; y++) land.add(`${o.x + x},${o.y + y}`);
    }
    const dock = dockBox(ARCHIPELAGOS.find((x) => x.classe === a)!.port);
    for (let x = dock.x0; x <= dock.x1; x++) for (let y = dock.y0; y <= dock.y1; y++) land.add(`${x},${y}`);
    const b = worldBounds(a);
    for (const s of spots) {
      expect(s.r).toBeGreaterThanOrEqual(4);
      // Dans le monde (visible), et tout le rond (avec deux cases de marge) dans l'eau.
      expect(s.x).toBeGreaterThan(b.minX);
      expect(s.x).toBeLessThan(b.maxX);
      for (let x = Math.floor(s.x - s.r - 2); x <= Math.ceil(s.x + s.r + 2); x++)
        for (let y = Math.floor(s.y - s.r - 2); y <= Math.ceil(s.y + s.r + 2); y++)
          if (Math.hypot(x - s.x, y - s.y) <= s.r + 2) expect(land.has(`${x},${y}`), `baleine sur la terre en ${x},${y}`).toBe(false);
    }
  }
});

it('chaque quête a sa borne sur la rangée de devant, dans le cœur, hors de la zone des plans et loin de la créature', () => {
  for (const b of BIOMES) {
    const stations = questStations(b.id);
    expect(stations.map((s) => s.typeId)).toEqual(b.exercises.map((e) => e.id));
    const spot = creatureSpot(b.id);
    const creature = new Set<string>();
    for (const [sx, sy] of spot.steps) for (const c of CREATURE_CUBES[b.id]) creature.add(`${spot.x + sx + c.x},${spot.y + sy + c.y}`);
    for (const st of stations) {
      expect(st.x).toBeGreaterThanOrEqual(0);
      expect(st.x).toBeLessThan(CORE);
      expect(st.y).toBeLessThan(PLAN_ZONE.y);
      expect(creature.has(`${st.x},${st.y}`), `${b.id} ${st.typeId}`).toBe(false);
    }
  }
  // Dans le monde : un socle et une ardoise étoilée par borne, étiquetés « île:quête », délavés sur une île fermée.
  const cubes = worldCubes('6e', {}, { plans: {}, journal: [], bridges: [] });
  const foret = cubes.filter((c) => c.quest?.startsWith('foret:'));
  expect(foret).toHaveLength(2 * 3);
  expect(foret.filter((c) => c.texture === 'borne')).toHaveLength(3);
  expect(foret.every((c) => !c.muted)).toBe(true);
  const mine = cubes.filter((c) => c.quest?.startsWith('mine:'));
  expect(mine.length).toBeGreaterThan(0);
  expect(mine.every((c) => c.muted)).toBe(true);
});

it('chaque Gardien tient sur son îlot, et chaque créature reste petite devant lui', () => {
  for (const b of BIOMES) {
    const g = GUARDIAN_CUBES[b.id];
    expect(Math.max(...g.map((c) => c.x)), b.id).toBeLessThan(ISLET_W);
    expect(Math.max(...g.map((c) => c.y)), b.id).toBeLessThan(ISLET_H);
    expect(Math.min(...g.map((c) => c.x)), b.id).toBeGreaterThanOrEqual(0);
    const gh = Math.max(...g.map((c) => c.z)) + 1;
    const ch = Math.max(...CREATURE_CUBES[b.id].map((c) => c.z)) + 1;
    expect(gh, b.id).toBeGreaterThanOrEqual(6);
    expect(ch, b.id).toBeLessThanOrEqual(9);
    expect(ch, b.id).toBeLessThan(gh + 2);
  }
});

it('la caméra cadre l’île du bonhomme et ses voisines, et pivote vers le centre de l’archipel sans dépasser 40 degrés', () => {
  // La Forêt et ses voisines (Mine, Ferme, Plaine) : la zone englobe toutes leurs terres ; le Carrefour est ailleurs.
  const z = viewZone('foret');
  for (const id of ['foret', 'mine', 'ferme', 'plaine'] as const) {
    const b = landBox(islandDef(id));
    expect(b.x0).toBeGreaterThanOrEqual(z.minX);
    expect(b.x1).toBeLessThanOrEqual(z.maxX);
    expect(b.y0).toBeGreaterThanOrEqual(z.minY);
    expect(b.y1).toBeLessThanOrEqual(z.maxY);
  }
  expect(landBox(islandDef('carrefour')).y0).toBeGreaterThan(z.maxY);
  // Au centre, pas de pivot ; sur le bord ouest (Tour), la caméra tourne vers l'est ; à l'est (Carrière), vers l'ouest.
  expect(Math.abs(viewYaw('foret'))).toBeLessThan(0.25);
  expect(viewYaw('tour')).toBeGreaterThan(0.3);
  expect(viewYaw('carriere')).toBeLessThan(-0.3);
  for (const b of BIOMES) expect(Math.abs(viewYaw(b.id))).toBeLessThanOrEqual(VIEW_YAW_MAX + 1e-9);
});

it('la mer est habillée de rochers et de bancs de sable, loin des terres, des îlots, des ouvrages, du port et des baleines', () => {
  const decor = seaDecor('6e');
  expect(decor.length).toBeGreaterThan(60);
  expect(decor.some((c) => c.texture === 'sable')).toBe(true);
  expect(decor.some((c) => c.texture === 'galet')).toBe(true);
  expect(decor.every((c) => c.tag === 'mer' && c.z >= -1 && c.z <= 1)).toBe(true);
  const solid = new Set<string>();
  for (const def of mapOf('6e')) {
    for (const c of landCells(def)) solid.add(`${c.x},${c.y}`);
    const o = bossIsletOrigin(BIOMES.findIndex((b) => b.id === def.id));
    for (let x = 0; x < ISLET_W; x++) for (let y = 0; y < ISLET_H; y++) solid.add(`${o.x + x},${o.y + y}`);
  }
  for (const def of BRIDGES.filter((b) => archipelagoOf(b.from).classe === '6e')) for (const c of bridgePath(def)) solid.add(`${c.x},${c.y}`);
  const dock = dockBox('plaine');
  for (let x = dock.x0; x <= dock.x1; x++) for (let y = dock.y0; y <= dock.y1; y++) solid.add(`${x},${y}`);
  const whales = whaleSpots('6e');
  for (const c of decor) {
    for (let dx = -3; dx <= 3; dx++)
      for (let dy = -3; dy <= 3; dy++) expect(solid.has(`${c.x + dx},${c.y + dy}`), `décor de mer contre la terre en ${c.x},${c.y}`).toBe(false);
    for (const w of whales) expect(Math.hypot(w.x - c.x, w.y - c.y)).toBeGreaterThan(w.r + 2);
  }
  // Les cubes du monde contiennent l'habillage, et un ouvrage ne le remplace jamais.
  const world = worldCubes('6e', {}, { plans: {}, journal: [], bridges: BRIDGES.map((b) => b.id) });
  expect(world.filter((c) => c.tag === 'mer')).toHaveLength(decor.length);
  // Chaque archipel habille sa mer à sa façon : plaques de glace dans les Collines, aiguilles d'ardoise dans les Monts, rien dans le ciel.
  const collines = seaDecor('5e');
  expect(collines.some((c) => c.texture === 'glace')).toBe(true);
  expect(collines.some((c) => c.texture === 'sable')).toBe(false);
  const monts = seaDecor('4e');
  expect(monts.some((c) => c.texture === 'ardoise' && c.z >= 1)).toBe(true);
  expect(monts.some((c) => c.texture === 'sable')).toBe(false);
  expect(seaDecor('3e')).toEqual([]);
  expect(worldCubes('3e', {}).some((c) => c.tag === 'mer')).toBe(false);
});

it('le port : une jetée dans l’eau devant l’île-port, et le Bloc-Navire à côté, hors de tout', () => {
  for (const a of ARCHIPELAGOS) {
    const def = islandDef(a.port);
    const cells = dockCells(a.port);
    expect(cells.length, a.port).toBeGreaterThanOrEqual(8);
    // Dans l'eau, devant l'île, hors de l'îlot du Gardien et de tout ouvrage ; descend d'une marche par case au plus.
    const islet = bossIsletOrigin(BIOMES.findIndex((b) => b.id === a.port));
    const paths = new Set(BRIDGES.filter((b) => archipelagoOf(b.from).classe === a.classe).flatMap((b) => bridgePath(b).map((c) => `${c.x},${c.y}`)));
    let prevZ = def.altitude;
    for (const c of cells) {
      expect(isLandAt(c.x, c.y), `${a.port} jetée sur la terre en ${c.x},${c.y}`).toBe(false);
      expect(c.y, a.port).toBeLessThan(def.core.y);
      expect(c.x < islet.x || c.x >= islet.x + ISLET_W || c.y < islet.y || c.y >= islet.y + ISLET_H, `${a.port} jetée sur l'îlot`).toBe(true);
      expect(paths.has(`${c.x},${c.y}`), `${a.port} jetée sur un ouvrage`).toBe(false);
      expect(prevZ - c.z, a.port).toBeLessThanOrEqual(1);
      prevZ = c.z;
    }
    // L'emprise du navire : dans l'eau, hors de la jetée, dans l'étendue de la scène.
    const o = dockOrigin(a.port);
    const jetty = new Set(cells.map((c) => `${c.x},${c.y}`));
    const bounds = worldBounds(a.classe);
    for (let x = o.x; x < o.x + VEHICLE_SIZE.w; x++)
      for (let y = o.y; y < o.y + VEHICLE_SIZE.d; y++) {
        expect(isLandAt(x, y), `${a.port} navire sur la terre en ${x},${y}`).toBe(false);
        expect(jetty.has(`${x},${y}`), `${a.port} navire sur la jetée`).toBe(false);
        expect(x).toBeGreaterThanOrEqual(bounds.minX);
        expect(y).toBeGreaterThanOrEqual(bounds.minY);
      }
    // Dans le monde : les planches et deux lanternes du quai, étiquetées du port.
    const cubes = worldCubes(a.classe, {}, village(everything), false).filter((c) => c.tag === a.port);
    expect(cubes.filter((c) => c.texture === 'planches' || c.texture === 'escalier').length).toBeGreaterThanOrEqual(cells.length);
    expect(cubes.filter((c) => c.texture === 'lanterne' && c.y < def.core.y).length).toBeGreaterThanOrEqual(2);
  }
  function isLandAt(x: number, y: number): boolean {
    return MAP.some((d) => landCells(d).some((c) => c.x === x && c.y === y));
  }
});

it('le bonhomme embarque : de son île à la jetée, planche par planche, jusqu’au pont du navire', () => {
  for (const a of ARCHIPELAGOS) {
    const route = boardingRoute(a.port);
    const o = dockOrigin(a.port);
    expect(route[0]).toEqual(avatarHome(a.port));
    // Il finit sur le pont, une case au-dessus du plancher.
    expect(route[route.length - 1]).toEqual({ x: o.x + VEHICLE_DECK.x, y: o.y + VEHICLE_DECK.y, z: o.z + 1 });
    // Sur la jetée, ses pieds sont sur une planche.
    const planks = new Map(dockCells(a.port).map((c) => [`${c.x},${c.y}`, c.z]));
    const onJetty = route.filter((p) => planks.has(`${p.x},${p.y}`));
    expect(onJetty.length, a.port).toBeGreaterThanOrEqual(3);
    for (const p of onJetty) expect(p.z, a.port).toBe(planks.get(`${p.x},${p.y}`)! + 1);
    // Jamais un pas de plus d'un bloc de haut.
    for (let i = 1; i < route.length; i++) expect(Math.abs(route[i].z - route[i - 1].z), a.port).toBeLessThanOrEqual(1);
  }
});

it('le Bloc-Navire : le chantier du port montre ses cases en fantôme, les étapes parties sont dessinées entières', () => {
  const [coque, ballon] = VEHICLE_STAGES;
  // Le navire n'est pas dans le terrain (il tangue, c'est un objet à part) : le terrain ne garde que la jetée.
  const terrain = worldCubes('6e', {}, village([]), false).filter((c) => c.tag === 'plaine' && c.y < islandDef('plaine').core.y - 4);
  expect(terrain.some((c) => c.ghost)).toBe(false);
  expect(terrain.every((c) => c.texture === 'planches' || c.texture === 'escalier' || c.texture === 'tronc' || c.texture === 'lanterne')).toBe(true);
  // Au début, sur la Plaine : la coque en fantôme (la voile aussi, tant que les Gardiens ne sont pas vaincus), amarrée au quai.
  const fresh = vehiclePlacement('6e', {}, village([]));
  expect(fresh.port).toBe('plaine');
  expect(fresh.origin).toEqual(dockOrigin('plaine'));
  expect(fresh.afloat).toBe(true);
  expect(fresh.building).toBe(coque.id);
  expect(fresh.cubes.filter((c) => c.ghost).length).toBe(coque.cells.length + coque.kit.length);
  // Les cubes sont locaux : dans l'encombrement du navire.
  for (const c of fresh.cubes) {
    expect(c.x).toBeGreaterThanOrEqual(0);
    expect(c.x).toBeLessThan(VEHICLE_SIZE.w);
    expect(c.y).toBeLessThan(VEHICLE_SIZE.d);
  }
  // Trois Gardiens vaincus : la voile est là, en dur.
  const guardians = Object.fromEntries(['foret', 'plaine', 'mine'].map((id) => [`${id}-gardien`, { stars: 2 }]));
  const sail = vehiclePlacement('6e', guardians, village([])).cubes.filter((c) => c.texture === 'toile');
  expect(sail).toHaveLength(coque.kit.filter((c) => c.block === 'toile').length);
  expect(sail.every((c) => !c.ghost)).toBe(true);
  // Le voyage fait : la coque entière et en dur ; au Marché, le ballon en fantôme au-dessus.
  const sailed = vehiclePlacement('5e', {}, village(['voyage-5e']));
  expect(sailed.port).toBe('marche');
  expect(sailed.building).toBe(ballon.id);
  expect(sailed.cubes.filter((c) => !c.ghost && c.texture === 'planches').length).toBeGreaterThan(0);
  expect(sailed.cubes.filter((c) => c.ghost).length).toBe(ballon.cells.length + ballon.kit.length);
  // Revenu dans les Basses Terres après le deuxième voyage : le navire porte son ballon, rien en fantôme, rien à construire ici.
  const back = vehiclePlacement('6e', {}, village(['voyage-5e', 'voyage-4e']));
  expect(back.cubes.some((c) => c.ghost)).toBe(false);
  expect(back.building).toBeNull();
  expect(back.cubes.filter((c) => c.texture === 'toile').length).toBeGreaterThan(coque.kit.length);
  // Dans les Îles du Ciel, il plane à hauteur de quai.
  expect(vehiclePlacement('3e', {}, village(['voyage-5e', 'voyage-4e', 'voyage-3e'])).afloat).toBe(false);
});
