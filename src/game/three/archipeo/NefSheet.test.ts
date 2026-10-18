import { describe, expect, it } from 'vitest';
import { EMPTY_STATE, type GameState } from '../../engine';
import { voyageId } from '../../world/archipelago';
import { planCells } from '../../world/plans';
import { VEHICLE_STAGES } from '../../world/vehicle';
import { nefLookOf, nefSail, nefWaitLabel } from './NefSheet';

const stage = VEHICLE_STAGES[0];
const withParts = (keys: string[], links: string[] = EMPTY_STATE.world.links): GameState => ({ ...EMPTY_STATE, world: { ...EMPTY_STATE.world, parts: { [stage.id]: keys }, links } });

describe('la Nef du monde continu (GD-21)', () => {
  it('hisse sa voile avec trois lieux achevés, sans Gardiens', () => {
    expect(nefSail(EMPTY_STATE, 1)).toEqual({ kit: false, missing: stage.guardians - 1 });
    expect(nefSail(EMPTY_STATE, stage.guardians)).toEqual({ kit: true, missing: 0 });
  });

  it('dit ce qu’il reste à faire, jamais un manque', () => {
    expect(nefWaitLabel(1)).toBe('La Nef a tous ses blocs ! Achève encore 1 lieu pour hisser sa voile.');
    expect(nefWaitLabel(2)).toMatch(/2 lieux/);
  });

  it('lit son temps dans la sauvegarde de la grille', () => {
    const all = planCells(stage).map((c) => c.key);
    const hull = planCells(stage, stage.cells.filter((c) => c.z === 0)).map((c) => c.key);
    expect(nefLookOf(EMPTY_STATE, true)).toBe(0);
    expect(nefLookOf(withParts(hull.slice(1)), true)).toBe(0);
    expect(nefLookOf(withParts(hull), true)).toBe(1);
    expect(nefLookOf(withParts(all), false)).toBe(2);
    expect(nefLookOf(withParts(all), true)).toBe(3);
    expect(nefLookOf(withParts(all, [...EMPTY_STATE.world.links, voyageId(stage.to)]), true)).toBe(4);
  });
});
