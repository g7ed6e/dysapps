import { BLOCKS } from '../biomes';
import { sanitizeState } from '../engine';
import { ARCHIPELAGOS } from './archipelago';
import { MONUMENTS, MONUMENT_ISLET, getMonument, monumentNeeds, monumentsOf } from './monuments';
import { planCells } from './plans';
import { monumentAnchor, monumentBlocked, monumentIsletFree, worldBounds, worldCubes } from './terrain';
import { earnIsland } from './uses';

it('deux monuments par archipel, chacun avec ses blocs gagnés dans les îles de son archipel', () => {
  for (const a of ARCHIPELAGOS) expect(monumentsOf(a.classe)).toHaveLength(2);
  expect(getMonument('monument-observatoire')?.name).toBe('L’observatoire des baleines');
  for (const m of MONUMENTS) {
    expect(m.cells.length, m.id).toBeGreaterThanOrEqual(60);
    expect(Object.keys(monumentNeeds(m)).length, m.id).toBeGreaterThanOrEqual(4);
    for (const block of Object.keys(monumentNeeds(m)) as (keyof typeof BLOCKS)[]) expect(earnIsland(block)?.classe, `${m.id} ${block}`).toBe(m.archipelago);
    // Le dessin tient dans les 7 × 7 du milieu de l'îlot, posé dessus.
    expect(m.cells.every((c) => c.x >= 0 && c.x < MONUMENT_ISLET - 2 && c.y >= 0 && c.y < MONUMENT_ISLET - 2 && c.z >= 0)).toBe(true);
    expect(new Set(m.cells.map((c) => `${c.x},${c.y},${c.z}`)).size).toBe(m.cells.length);
  }
});

it('chaque îlot de monument est libre (loin des îles, des ouvrages, du port, des baleines), dans l’archipel, sans chevaucher l’autre', () => {
  for (const a of ARCHIPELAGOS) {
    const blocked = monumentBlocked(a.classe);
    const b = worldBounds(a.classe);
    const [m1, m2] = monumentsOf(a.classe);
    for (const m of [m1, m2]) {
      expect(monumentIsletFree(a.classe, m.islet.x, m.islet.y, blocked), m.id).toBe(true);
      expect(m.islet.x >= b.minX && m.islet.x + MONUMENT_ISLET <= b.maxX && m.islet.y >= b.minY && m.islet.y + MONUMENT_ISLET <= b.maxY, m.id).toBe(true);
    }
    const apart = Math.abs(m1.islet.x - m2.islet.x) >= MONUMENT_ISLET + 2 || Math.abs(m1.islet.y - m2.islet.y) >= MONUMENT_ISLET + 2;
    expect(apart, a.classe).toBe(true);
  }
});

it('dans le monde : l’îlot et le monument en fantôme, touchables ; posé, un bloc n’est plus un fantôme', () => {
  const m = getMonument('monument-observatoire')!;
  const cubes = worldCubes('6e', {});
  const mine = cubes.filter((c) => c.place === `monument:${m.id}`);
  const o = monumentAnchor(m);
  const cells = planCells(m);
  const at = (c: { x: number; y: number; z: number }) => mine.find((k) => k.x === o.x + c.x && k.y === o.y + c.y && k.z === o.z + c.z);
  expect(cells.every((c) => at(c)?.ghost)).toBe(true);
  // Aucun autre cube du monde n'occupe une case du monument.
  const keys = new Set(cells.map((c) => `${o.x + c.x},${o.y + c.y},${o.z + c.z}`));
  expect(cubes.filter((c) => keys.has(`${c.x},${c.y},${c.z}`))).toHaveLength(cells.length);
  const first = cells[0];
  const built = worldCubes('6e', {}, { plans: { [m.id]: [first.key] }, journal: [], bridges: [] }).find(
    (k) => k.place === `monument:${m.id}` && k.x === o.x + first.x && k.y === o.y + first.y && k.z === o.z + first.z,
  );
  expect(built?.ghost).toBe(false);
});

it('les cases posées d’un monument sont gardées par la sauvegarde', () => {
  const m = MONUMENTS[0];
  const keys = planCells(m)
    .slice(0, 3)
    .map((c) => c.key);
  expect(sanitizeState({ village: { plans: { [m.id]: [...keys, '99,99,99'] } } }).village.plans[m.id]).toEqual(keys);
});
