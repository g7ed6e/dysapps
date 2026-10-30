// Le lieu retenu de chaque équipier dans le monde (GD-27, lot 5) : écrit une fois, jamais changé, assaini à la lecture.
import { describe, expect, it } from 'vitest';
import { sanitizeEquipage } from '../engine/equipage';
import { EMPTY_STATE } from '../engine/state';
import { sanitizeState } from '../engine/sanitize';
import { keepEquipage } from './equipageSaved';

describe('le lieu retenu des équipiers', () => {
  it('est écrit une fois par équipier, et plus jamais ; rien de nouveau, le même état', () => {
    const s1 = keepEquipage(EMPTY_STATE, { zia: 'quais' });
    expect(s1.world.equipage).toEqual({ zia: 'quais' });
    expect(keepEquipage(s1, { zia: 'ecluses' })).toBe(s1);
    expect(keepEquipage(s1, {})).toBe(s1);
    const s2 = keepEquipage(s1, { zia: 'ecluses', malo: 'phare' });
    expect(s2.world.equipage).toEqual({ zia: 'quais', malo: 'phare' });
    expect(EMPTY_STATE.world.equipage).toBeUndefined();
  });

  it('se lit d’une sauvegarde : les équipiers connus, un identifiant de lieu ; rien sinon', () => {
    expect(sanitizeEquipage(undefined)).toBeUndefined();
    expect(sanitizeEquipage({})).toBeUndefined();
    expect(sanitizeEquipage({ zia: 'quais', malo: 7, keo: 'phare' })).toEqual({ zia: 'quais' });
    expect(sanitizeEquipage({ zia: 'Quais !' })).toBeUndefined();
    const saved = sanitizeState({ ...EMPTY_STATE, world: { ...EMPTY_STATE.world, equipage: { malo: 'phare' } } });
    expect(saved.world.equipage).toEqual({ malo: 'phare' });
    expect(sanitizeState(EMPTY_STATE).world.equipage).toBeUndefined();
  });
});
