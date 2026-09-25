import { BIOMES } from '../biomes';
import { ALTITUDE, CORE, MAP, isLand, islandDef, landCells, reliefHeight } from './map';
import { BRIDGES } from './archipelago';
import { ISLET_H, ISLET_W, bossIsletOrigin, worldCubes } from './terrain';

it('chaque île a une place, une altitude selon sa classe, et son cœur fait partie de sa terre', () => {
  expect(MAP.map((d) => d.id).sort()).toEqual(BIOMES.map((b) => b.id).sort());
  for (const b of BIOMES) {
    const def = islandDef(b.id);
    expect(def.altitude).toBe(ALTITUDE[b.classe]);
    for (let x = 0; x < CORE; x++) for (let y = 0; y < CORE; y++) expect(isLand(def, def.core.x + x, def.core.y + y)).toBe(true);
    // Le contour déborde du cœur (au moins une case en plus), mais pas partout : contour irrégulier.
    const land = landCells(def);
    expect(land.length).toBeGreaterThan(CORE * CORE);
    const box = (def.ext.left + CORE + def.ext.right) * (def.ext.front + CORE + def.ext.back);
    expect(land.length).toBeLessThan(box);
  }
});

it('aucune terre ne chevauche une autre, ni l’îlot d’un Gardien', () => {
  const owner = new Map<string, string>();
  BIOMES.forEach((b, i) => {
    const def = islandDef(b.id);
    for (const c of landCells(def)) {
      const key = `${c.x},${c.y}`;
      expect(owner.get(key), `${b.id} chevauche ${owner.get(key)} en ${key}`).toBeUndefined();
      owner.set(key, b.id);
    }
    const islet = bossIsletOrigin(i);
    for (let x = 0; x < ISLET_W; x++)
      for (let y = 0; y < ISLET_H; y++) {
        const key = `${islet.x + x},${islet.y + y}`;
        expect(owner.get(key), `îlot de ${b.id} sur ${owner.get(key)} en ${key}`).toBeUndefined();
        owner.set(key, `îlot-${b.id}`);
      }
  });
});

it('les ponts relient des îles proches, jamais séparées de plus d’un niveau', () => {
  for (const b of BRIDGES) {
    const a = islandDef(b.from);
    const c = islandDef(b.to);
    const dist = Math.hypot(a.core.x - c.core.x, a.core.y - c.core.y);
    expect(dist, b.id).toBeLessThan(42);
    expect(Math.abs(a.altitude - c.altitude), b.id).toBeLessThanOrEqual(9);
  }
});

it('le relief : plat, collines de 0 à 2, montagne jusqu’à 6 derrière le cœur, jamais dans le cœur', () => {
  for (const def of MAP) {
    let max = 0;
    for (const c of landCells(def)) {
      const h = reliefHeight(def, c.x, c.y);
      expect(h).toBeGreaterThanOrEqual(0);
      if (def.core.x <= c.x && c.x < def.core.x + CORE && def.core.y <= c.y && c.y < def.core.y + CORE) expect(h).toBe(0);
      max = Math.max(max, h);
    }
    if (def.relief === 'plat') expect(max).toBeLessThanOrEqual(1);
    if (def.relief === 'collines') expect(max).toBeLessThanOrEqual(2);
    if (def.relief === 'montagne') {
      expect(max).toBeGreaterThanOrEqual(4);
      expect(max).toBeLessThanOrEqual(6);
    }
  }
});

it('aucun pont ne traverse l’îlot d’un Gardien ni la terre d’une autre île', () => {
  const islets = new Set<string>();
  BIOMES.forEach((_, i) => {
    const o = bossIsletOrigin(i);
    for (let x = 0; x < ISLET_W; x++) for (let y = 0; y < ISLET_H; y++) islets.add(`${o.x + x},${o.y + y}`);
  });
  const land = new Map<string, string>();
  for (const def of MAP) for (const c of landCells(def)) land.set(`${c.x},${c.y}`, def.id);
  const all = BRIDGES.map((b) => b.id);
  const bridges = worldCubes({}, { plans: {}, journal: [], bridges: all }, false).filter((c) => c.bridge);
  for (const c of bridges) {
    const key = `${c.x},${c.y}`;
    expect(islets.has(key), `pont sur un îlot en ${key}`).toBe(false);
    const owner = land.get(key);
    if (owner) {
      const def = BRIDGES.find((b) => b.id === c.bridge)!;
      expect([def.from, def.to], `pont ${def.id} sur ${owner} en ${key}`).toContain(owner);
    }
  }
});
