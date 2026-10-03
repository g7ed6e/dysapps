// Les petites constructions des commandes (GD-7, PR 3) : chaque forme tient les limites du directeur artistique, et se
// pose sur son île à côté de la créature sans rien chevaucher.
import { BIOMES, BLOCKS, type BlockId } from '../biomes';
import { BRIDGES, VOYAGES } from './archipelago';
import { COMMANDES } from './commandes';
import { PETITES_CONSTRUCTIONS, casesDeLaPetiteConstruction, estPosee } from './petitesConstructions';
import { creatureDuMonde, creatureSpot, cubesDeLIle, placeDeLaPetiteConstruction } from './terrain';

const FINITION: ReadonlySet<BlockId> = new Set<BlockId>(['roof', 'door', 'lantern', 'fence', 'stairs']);

it('une forme par commande, et rien d’autre', () => {
  expect([...PETITES_CONSTRUCTIONS].sort()).toEqual(COMMANDES.map((c) => c.fixture).sort());
});

describe.each(COMMANDES.map((c) => [c.fixture, c] as const))('%s', (_id, c) => {
  const cases = casesDeLaPetiteConstruction(c.fixture)!;

  it('de 4 à 12 cubes, 9 cases au plus (3 × 3), 3 de haut au plus, sans doublon', () => {
    expect(cases.length).toBeGreaterThanOrEqual(4);
    expect(cases.length).toBeLessThanOrEqual(12);
    expect(new Set(cases.map((k) => k.key)).size).toBe(cases.length);
    const pied = new Set(cases.map((k) => `${k.x},${k.y}`));
    expect(pied.size).toBeLessThanOrEqual(9);
    for (const k of cases) {
      expect(k.x).toBeGreaterThanOrEqual(0);
      expect(k.y).toBeGreaterThanOrEqual(0);
      expect(k.z).toBeGreaterThanOrEqual(0);
      expect(k.y).toBeLessThanOrEqual(2);
      expect(k.z).toBeLessThanOrEqual(2);
    }
    // 3 × 3 au plus, sauf l'abreuvoir de Bloquette, une ligne de 4 cases (forme validée par le directeur artistique).
    expect(Math.max(...cases.map((k) => k.x))).toBeLessThanOrEqual(c.fixture === 'french-6e-grammar-spelling-fixture-1' ? 3 : 2);
  });

  it('un cube du bloc livré par bloc demandé ; les autres de l’île de la créature ou de finition', () => {
    expect(cases.filter((k) => k.block === c.block).length).toBeGreaterThanOrEqual(c.count);
    const ile = BIOMES.find((b) => b.id === c.biome)!.block;
    for (const k of cases) expect([c.block, ile].includes(k.block) || FINITION.has(k.block)).toBe(true);
    for (const k of cases) expect(BLOCKS[k.block]).toBeDefined();
  });

  it('rien de penché : chaque cube est posé, ou tenu par le côté à 2 cubes au plus d’un appui', () => {
    const at = new Map(cases.map((k) => [k.key, k]));
    // La distance (en cubes) de chaque cube à un appui (le sol ou un cube dessous), de proche en proche par le côté.
    const portee = new Map<string, number>();
    for (const k of cases) if (k.z === 0 || at.has(`${k.x},${k.y},${k.z - 1}`)) portee.set(k.key, 0);
    for (let tour = 0; tour < 3; tour++)
      for (const k of cases) {
        if (portee.has(k.key)) continue;
        const voisins = [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ].map(([dx, dy]) => portee.get(`${k.x + dx},${k.y + dy},${k.z}`));
        const d = Math.min(...voisins.filter((v): v is number => v !== undefined));
        if (Number.isFinite(d)) portee.set(k.key, d + 1);
      }
    for (const k of cases) expect(portee.get(k.key) ?? Infinity).toBeLessThanOrEqual(2);
  });

  it('se pose sur son île, à côté de la créature, sur le sol, sans rien chevaucher', () => {
    const place = placeDeLaPetiteConstruction(c.biome, c.fixture);
    expect(place).not.toBeNull();
    const links = [...BRIDGES.map((b) => b.id), ...VOYAGES.map((v) => v.id)];
    const progress = {};
    // L'île sans la petite construction, la créature comprise.
    const avant = cubesDeLIle(c.biome, progress, { parts: {}, log: [], links }, true);
    const occupe = new Set(avant.map((k) => `${k.x},${k.y},${k.z}`));
    const ou = cases.map((k) => ({ x: place!.x + k.x, y: place!.y + k.y, z: k.z + 1 }));
    for (const p of ou) expect(occupe.has(`${p.x},${p.y},${p.z}`)).toBe(false);
    // Sur le sol de l'île (un cube dessous, à z = 0).
    for (const p of ou) expect(occupe.has(`${p.x},${p.y},0`)).toBe(true);
    // Jamais sur la créature ni sur ses pas.
    const spot = creatureSpot(c.biome);
    const pas = new Set(([[0, 0], ...spot.steps] as [number, number][]).flatMap(([sx, sy]) => creatureDuMonde(c.biome).map((k) => `${spot.x + sx + k.x},${spot.y + sy + k.y}`)));
    for (const p of ou) expect(pas.has(`${p.x},${p.y}`)).toBe(false);
    // À côté d'elle : à quelques cases au plus.
    const distance = Math.min(...ou.flatMap((p) => creatureDuMonde(c.biome).map((k) => Math.abs(p.x - spot.x - k.x) + Math.abs(p.y - spot.y - k.y))));
    expect(distance).toBeLessThanOrEqual(6);
    // Livrée, elle se dessine là, en cubes posés.
    const parts = { [c.fixture]: cases.map((k) => k.key) };
    expect(estPosee(parts, c.fixture)).toBe(true);
    const apres = cubesDeLIle(c.biome, progress, { parts, log: [], links }, true);
    const poses = new Set(apres.map((k) => `${k.x},${k.y},${k.z}`));
    for (const p of ou) expect(poses.has(`${p.x},${p.y},${p.z}`)).toBe(true);
    expect(apres.length).toBe(avant.length + cases.length);
  });
});
