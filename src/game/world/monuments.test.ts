import { BLOCKS } from '../biomes';
import { sanitizeState } from '../engine';
import { ARCHIPELAGOS } from './archipelago';
import { MONUMENTS, MONUMENT_ISLET, getMonument, monumentNeeds, monumentsOf } from './monuments';
import { planCells } from './plans';
import { monumentAnchor, monumentBlocked, monumentIsletFree, worldBounds, worldCubes } from './terrain';
import { earnIsland } from './uses';
import { recetteDe, recetteDeLArchipel } from './assembly';
import { LAYERS } from './projects';

// Deux monuments par archipel, et les grands projets neufs de la 4e (deux) et de la 3e (trois), décidés le 8 octobre 2026.
const PAR_ARCHIPEL = { '6e': 2, '5e': 2, '4e': 4, '3e': 5 } as const;

it('deux monuments par archipel (plus les grands projets neufs), chacun avec ses blocs gagnés dans les îles de son archipel ou assemblés avec eux', () => {
  for (const a of ARCHIPELAGOS) expect(monumentsOf(a.classe), a.classe).toHaveLength(PAR_ARCHIPEL[a.classe]);
  expect(getMonument('landmark-6e-1')?.name).toBe('L’observatoire des baleines');
  for (const m of MONUMENTS) {
    expect(m.cells.length, m.id).toBeGreaterThanOrEqual(60);
    expect(Object.keys(monumentNeeds(m)).length, m.id).toBeGreaterThanOrEqual(4);
    for (const block of Object.keys(monumentNeeds(m)) as (keyof typeof BLOCKS)[])
      expect(earnIsland(block)?.classe ?? recetteDe(block)?.archipelago, `${m.id} ${block}`).toBe(m.archipelago);
    // Le bloc assemblé de son archipel (GD-2) : de 4 à 8, aux endroits qui comptent.
    const assembles = monumentNeeds(m)[recetteDeLArchipel(m.archipelago)!.bloc] ?? 0;
    expect(assembles, m.id).toBeGreaterThanOrEqual(4);
    expect(assembles, m.id).toBeLessThanOrEqual(8);
    // Le dessin tient dans les 7 × 7 du milieu de l'îlot, posé dessus.
    expect(m.cells.every((c) => c.x >= 0 && c.x < MONUMENT_ISLET - 2 && c.y >= 0 && c.y < MONUMENT_ISLET - 2 && c.z >= 0)).toBe(true);
    expect(new Set(m.cells.map((c) => `${c.x},${c.y},${c.z}`)).size).toBe(m.cells.length);
  }
});

// Le relevé de ce qui bloque un îlot, pour chaque archipel (39 îles depuis HG-3) : près de 5 s, au-delà du délai par défaut.
it('chaque îlot de monument est libre (loin des îles, des ouvrages, du port, des baleines), dans l’archipel, sans chevaucher les autres', { timeout: 20_000 }, () => {
  for (const a of ARCHIPELAGOS) {
    const blocked = monumentBlocked(a.classe, []);
    const b = worldBounds(a.classe);
    const ms = monumentsOf(a.classe);
    for (const m of ms) {
      expect(monumentIsletFree(a.classe, [], m.islet.x, m.islet.y, blocked), m.id).toBe(true);
      expect(m.islet.x >= b.minX && m.islet.x + MONUMENT_ISLET <= b.maxX && m.islet.y >= b.minY && m.islet.y + MONUMENT_ISLET <= b.maxY, m.id).toBe(true);
    }
    for (const m1 of ms)
      for (const m2 of ms) {
        if (m1 === m2) continue;
        const apart = Math.abs(m1.islet.x - m2.islet.x) >= MONUMENT_ISLET + 2 || Math.abs(m1.islet.y - m2.islet.y) >= MONUMENT_ISLET + 2;
        expect(apart, `${m1.id} ${m2.id}`).toBe(true);
      }
  }
});

it('dans le monde : l’îlot et le monument en fantôme, touchables ; posé, un bloc n’est plus un fantôme', () => {
  const m = getMonument('landmark-6e-1')!;
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
  const built = worldCubes('6e', {}, { parts: { [m.id]: [first.key] }, log: [], links: [] }).find(
    (k) => k.place === `monument:${m.id}` && k.x === o.x + first.x && k.y === o.y + first.y && k.z === o.z + first.z,
  );
  expect(built?.ghost).toBe(false);
});

it('les cases posées d’un monument sont gardées par la sauvegarde', () => {
  const m = MONUMENTS[0];
  const keys = planCells(m)
    .slice(0, 3)
    .map((c) => c.key);
  expect(sanitizeState({ world: { parts: { [m.id]: [...keys, '99,99,99'] } } }).world.parts[m.id]).toEqual(keys);
});

// Le bloc qui s'allume et la pièce où il sert : la lanterne du phare (sous son toit), les hublots du second étage de la
// fusée (sous sa coiffe), la pièce du haut pour les autres.
const LUEURS: Record<string, { bloc: string; piece: string }> = {
  'landmark-5e-1': { bloc: 'vitrail', piece: 'lantern' },
  'landmark-4e-3': { bloc: 'calque', piece: 'cab' },
  'landmark-4e-4': { bloc: 'bobine', piece: 'head' },
  'landmark-3e-3': { bloc: 'lentille', piece: 'stage2' },
  'landmark-3e-4': { bloc: 'prisme', piece: 'crown' },
  'landmark-3e-5': { bloc: 'lentille', piece: 'sphere' },
};

it('un monument fini s’allume : son bloc qui luit, et seulement quand toutes ses cases sont posées (GD-10)', () => {
  expect(MONUMENTS.filter((k) => k.litWhenDone).map((k) => k.id)).toEqual(Object.keys(LUEURS));
  for (const [id, lueur] of Object.entries(LUEURS)) {
    const m = getMonument(id)!;
    const keys = planCells(m).map((c) => c.key);
    const allumes = (parts: string[]) =>
      worldCubes(m.archipelago, {}, { parts: { [m.id]: parts }, log: [], links: [] }).filter((c) => c.place === `monument:${m.id}` && c.lit);
    // Une case manque (la dernière) : rien ne s'allume.
    expect(allumes(keys.slice(0, -1)), id).toHaveLength(0);
    const lit = allumes(keys);
    // Fini : tous les cubes de ce bloc, aucun autre.
    expect(lit, id).toHaveLength(m.cells.filter((c) => c.block === m.litWhenDone).length);
    expect(lit.length, id).toBeGreaterThan(0);
    expect(
      lit.every((c) => c.texture === BLOCKS[m.litWhenDone!].texture && !c.ghost),
      id,
    ).toBe(true);
    expect(BLOCKS[m.litWhenDone!].texture, id).toBe(lueur.bloc);
    // Le bloc qui luit ne sert que dans sa pièce.
    const [z0, z1] = LAYERS[id][lueur.piece];
    expect(
      m.cells.filter((c) => c.block === m.litWhenDone).every((c) => c.z >= z0 && c.z <= z1),
      id,
    ).toBe(true);
  }
});

it('les pièces d’un grand projet : des tranches de hauteur qui se suivent, chacune posée sur celles d’en dessous', () => {
  for (const [id, pieces] of Object.entries(LAYERS)) {
    const m = getMonument(id)!;
    const tranches = Object.values(pieces);
    // De z0 au sommet du dessin, sans trou ni recouvrement.
    expect(tranches[0][0], id).toBe(0);
    tranches.forEach(([a, b], i) => {
      expect(b, id).toBeGreaterThanOrEqual(a);
      if (i > 0) expect(a, id).toBe(tranches[i - 1][1] + 1);
      expect(m.cells.some((c) => c.z >= a && c.z <= b), `${id} ${i}`).toBe(true);
    });
    expect(tranches.at(-1)![1], id).toBe(Math.max(...m.cells.map((c) => c.z)));
    // Rien ne flotte : chaque pièce posée, les cases jusqu'à elle se tiennent (par une face) jusqu'au sol.
    for (const [, haut] of tranches) {
      const posees = m.cells.filter((c) => c.z <= haut);
      const reste = new Set(posees.map((c) => `${c.x},${c.y},${c.z}`));
      const file = posees.filter((c) => c.z === 0).map((c) => [c.x, c.y, c.z]);
      for (const [x, y, z] of file) reste.delete(`${x},${y},${z}`);
      while (file.length) {
        const [x, y, z] = file.pop()!;
        for (const [dx, dy, dz] of [
          [1, 0, 0],
          [-1, 0, 0],
          [0, 1, 0],
          [0, -1, 0],
          [0, 0, 1],
          [0, 0, -1],
        ]) {
          const k = `${x + dx},${y + dy},${z + dz}`;
          if (reste.delete(k)) file.push([x + dx, y + dy, z + dz]);
        }
      }
      expect([...reste], `${id} jusqu'à z${haut}`).toEqual([]);
    }
  }
});
