// Ce qui se dessine à sa place réelle une fois aménagé (GD-9, PR 2) : l'îlot d'un Gardien déplacé autour de son lieu,
// son gué et le Gardien lui-même ; une borne déplacée dans la bande de devant ; et les écueils de la mer, qu'une île
// posée dessus cache sous elle (mainteneur, 5 octobre 2026, « Cacher »), qui reviennent quand elle repart.
import { afterEach, describe, expect, it } from 'vitest';
import type { BiomeId } from '../biomes';
import type { World } from '../engine/state';
import { applyLayout } from './appliedLayout';
import { freeGuardianSpots, freeSpots, freeStationSpots, moveGuardian, moveIsland, moveStation } from './arrange';
import { ARCHIPELAGO_IDS } from './archipelagos';
import { toutConstruit } from './budget';
import { footprintOf, guardianIsletRectangle, poseOfSpot, placedIsland } from './footprint';
import { islandDef } from './map';
import { bossIsletCells, bossIsletSteps, guardianPlacements, questStations, worldCubes } from './terrain';
import { ecueilsDe, seaDecor, seaDecorShown, visibleReefs } from './terrain/sea';

afterEach(() => {
  applyLayout(undefined);
});

const partie = toutConstruit();
const VOLCAN: BiomeId = 'maths-6e-decimals';

function apres(r: ReturnType<typeof moveIsland>): World {
  if (!r.ok) throw new Error(`refusée : ${r.reason}`);
  return r.world;
}

describe('les écueils cachés sous une île posée dessus (« Cacher »)', () => {
  it('sur la carte de départ, tous les écueils se dessinent : la mer ne change pas', () => {
    applyLayout(undefined);
    for (const a of ARCHIPELAGO_IDS) {
      expect(seaDecorShown(a)).toEqual(seaDecor(a));
      expect(visibleReefs(a).size).toBe(ecueilsDe(a).size);
    }
  });

  it('une place sur des écueils est libre ; posée, l’île les cache ; repartie, ils reviennent', () => {
    const w = partie.world;
    const ecueils = [...ecueilsDe('6e')].map((k) => k.split(',').map(Number));
    // Une place libre dont l'emprise couvre au moins un écueil.
    const couvre = (spot: Parameters<typeof poseOfSpot>[1]) =>
      footprintOf(VOLCAN, placedIsland(VOLCAN, poseOfSpot('6e', spot))).some((p) => ecueils.some(([x, y]) => x >= p.x0 && x < p.x1 && y >= p.y0 && y < p.y1));
    const spot = freeSpots(w, VOLCAN).find(couvre);
    expect(spot, 'une place libre sur des écueils').toBeDefined();
    const w2 = apres(moveIsland(w, VOLCAN, spot!));
    applyLayout(w2.layout);
    const parts = footprintOf(VOLCAN, islandDef(VOLCAN));
    const sous = ecueils.filter(([x, y]) => parts.some((p) => x >= p.x0 && x < p.x1 && y >= p.y0 && y < p.y1));
    expect(sous.length).toBeGreaterThan(0);
    const cubes = worldCubes('6e', partie.progress, w2, false, [], true);
    for (const [x, y] of sous) {
      expect(visibleReefs('6e').has(`${x},${y}`)).toBe(false);
      expect(cubes.some((c) => c.x === x && c.y === y && c.decor?.startsWith('mer/'))).toBe(false);
    }
    // Revenue à la carte de départ, la mer est celle d'avant.
    applyLayout(undefined);
    expect(seaDecorShown('6e')).toEqual(seaDecor('6e'));
  });
});

describe('un Gardien déplacé autour de son lieu', () => {
  it('son îlot, son gué et le Gardien se dessinent sur son côté', () => {
    const w = partie.world;
    const ailleurs = freeGuardianSpots(w, VOLCAN).find((g) => g.side !== 'front')!;
    expect(ailleurs).toBeDefined();
    const w2 = apres(moveGuardian(w, VOLCAN, ailleurs));
    applyLayout(w2.layout);
    const r = guardianIsletRectangle(islandDef(VOLCAN), ailleurs);
    const dans = (x: number, y: number) => x >= r.x0 && x < r.x1 && y >= r.y0 && y < r.y1;
    const cells = bossIsletCells(VOLCAN);
    expect(cells.length).toBeGreaterThan(20);
    for (const c of cells) expect(dans(c.x, c.y), `${c.x},${c.y}`).toBe(true);
    // Le gué part de l'îlot et mène à la côte : chaque pas hors de l'îlot.
    const pas = bossIsletSteps(VOLCAN);
    expect(pas.length).toBeGreaterThan(0);
    for (const p of pas) expect(dans(p.x, p.y)).toBe(false);
    // Le Gardien se tient sur son îlot.
    const g = guardianPlacements('6e', partie.progress, w2.links, true).find((x) => x.id === VOLCAN)!;
    const sol = new Set(cells.map((c) => `${c.x},${c.y}`));
    for (const c of g.cubes) expect(sol.has(`${g.origin.x + c.x},${g.origin.y + c.y}`), `${c.x},${c.y}`).toBe(true);
  });
});

describe('une borne déplacée dans la bande de devant', () => {
  it('se dessine à sa nouvelle place, et le monde ne la garde pas à l’ancienne', () => {
    const w = partie.world;
    const depart = questStations(VOLCAN)[0];
    const key = `${VOLCAN}:${depart.typeId}`;
    const to = freeStationSpots(w, key).find((p) => p.x !== depart.x)!;
    const w2 = apres(moveStation(w, key, to));
    const avant = worldCubes('6e', partie.progress, w, false, [], true).filter((c) => c.quest === key);
    applyLayout(w2.layout);
    expect(questStations(VOLCAN)[0]).toEqual({ typeId: depart.typeId, x: to.x, y: to.y });
    const maintenant = worldCubes('6e', partie.progress, w2, false, [], true).filter((c) => c.quest === key);
    expect(maintenant.length).toBe(avant.length);
    // Le lieu n'est pas tourné : la borne a glissé de l'écart dans la bande.
    expect(new Set(maintenant.map((c) => c.x - (to.x - depart.x)))).toEqual(new Set(avant.map((c) => c.x)));
  });
});
