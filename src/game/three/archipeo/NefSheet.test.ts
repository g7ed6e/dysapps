import { describe, expect, it } from 'vitest';
import { EMPTY_STATE, type GameState } from '../../engine';
import { voyageId } from '../../world/archipelago';
import { planCells } from '../../world/plans';
import { VEHICLE_STAGES } from '../../world/vehicle';
import { NEF_LEAVES, nefLookOf, nefReadyLabel, nefSail, nefWaitLabel } from './NefSheet';

const stage = VEHICLE_STAGES[0];
const withParts = (keys: string[], links: string[] = EMPTY_STATE.world.links): GameState => ({ ...EMPTY_STATE, world: { ...EMPTY_STATE.world, parts: { [stage.id]: keys }, links } });

describe('la Nef du monde continu (GD-21)', () => {
  it('hisse sa voile avec trois lieux achevés, sans Gardiens', () => {
    expect(nefSail(EMPTY_STATE, 1)).toEqual({ kit: false, missing: stage.guardians - 1 });
    expect(nefSail(EMPTY_STATE, stage.guardians)).toEqual({ kit: true, missing: 0 });
  });

  it('dit ce qu’il reste à faire, jamais un manque', () => {
    expect(nefWaitLabel(1)).toBe('Encore 1 lieu à achever.');
    expect(nefWaitLabel(2)).toBe('Encore 2 lieux à achever.');
    expect(nefReadyLabel('Anciens Ateliers')).toBe('Prête. Direction : les Anciens Ateliers.');
    expect(NEF_LEAVES).toBe('La Nef part.');
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

  it('au 5e, la nacelle est là dès l’arrivée : la première pastille est faite, rien n’est encore posé (UX 3, voulu)', () => {
    const dirigeable = VEHICLE_STAGES[1];
    // La nacelle est reprise du voilier (`kept`) : le dirigeable n'a aucune case à poser au pied de son plan.
    expect(dirigeable.cells.filter((c) => c.z === 0)).toHaveLength(0);
    expect(nefLookOf(EMPTY_STATE, false, dirigeable)).toBe(1);
    // Au 6e, rien posé, rien de fait.
    expect(nefLookOf(EMPTY_STATE, false, stage)).toBe(0);
  });
});
