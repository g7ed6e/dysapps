// Ce qui se dessine à sa place réelle une fois aménagé (GD-9, PR 2) : le Gardien, qui suit son lieu sur son île
// (GD-11) ; une borne déplacée dans la bande de devant ; et les écueils de la mer, qu'une île
// posée dessus cache sous elle (mainteneur, 5 octobre 2026, « Cacher »), qui reviennent quand elle repart.
import { afterEach, describe, expect, it } from 'vitest';
import type { BiomeId } from '../biomes';
import type { World } from '../engine/state';
import { applyLayout } from './appliedLayout';
import { freeSpots, freeStationSpots, moveIsland, moveStation } from './arrange';
import { ARCHIPELAGO_IDS } from './archipelagos';
import { toutConstruit } from './budget';
import { footprintOf, poseOfSpot, placedIsland } from './footprint';
import { islandDef, isLandInWorld } from './map';
import { guardianCells, guardianPlacements, questStations, worldCubes } from './terrain';
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

describe('un lieu déplacé et tourné : son Gardien le suit, sur son île (GD-11)', () => {
  it('le carré du Gardien est sur la terre de son lieu, et le Gardien s’y tient, à chaque orientation', () => {
    const w = partie.world;
    for (const turn of [1, 2, 3] as const) {
      const ailleurs = freeSpots(w, VOLCAN, turn)[0];
      const w2 = apres(moveIsland(w, VOLCAN, ailleurs));
      applyLayout(w2.layout);
      const def = islandDef(VOLCAN);
      const carre = guardianCells(VOLCAN);
      expect(carre.length).toBe(25);
      for (const c of carre) expect(isLandInWorld(def, c.x, c.y), `${turn} ${c.x},${c.y}`).toBe(true);
      // Dans Blocland, réduit de moitié autour de son pied (`echelleDesGardiens`) : chaque cube dessiné tient sur son carré.
      const g = guardianPlacements('6e', partie.progress, w2.links, true, [], 0.5).find((x) => x.id === VOLCAN)!;
      expect(g.cases).toEqual(carre);
      const sol = new Set(carre.map((c) => `${c.x},${c.y}`));
      const xs = g.cubes.map((c) => g.origin.x + c.x);
      const ys = g.cubes.map((c) => g.origin.y + c.y);
      const cx = (Math.min(...xs) + Math.max(...xs) + 1) / 2;
      const cy = (Math.min(...ys) + Math.max(...ys) + 1) / 2;
      for (const c of g.cubes) {
        const x = Math.floor(cx + (g.origin.x + c.x + 0.5 - cx) * g.echelle);
        const y = Math.floor(cy + (g.origin.y + c.y + 0.5 - cy) * g.echelle);
        expect(sol.has(`${x},${y}`), `${turn} ${x},${y}`).toBe(true);
      }
      applyLayout(undefined);
    }
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
