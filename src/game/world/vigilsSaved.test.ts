// Les veillées vues dans la sauvegarde (GD-23, GD-27, lot 3) : connues, sans doublon, dans leur ordre ; une veillée vue
// ne s'écrit qu'une fois ; une sauvegarde d'avant les veillées se lit sans rien perdre.
import { describe, expect, it } from 'vitest';
import { sanitizeVigils, VIGIL_IDS } from '../engine/vigils';
import { sanitizeState } from '../engine/sanitize';
import type { World } from '../engine/state';
import { seeVigil, vigilSeen } from './vigilsSaved';

const world = (): World => ({ parts: {}, log: [], links: [] });

describe('Les veillées vues', () => {
  it('assainit : connues, sans doublon, dans l’ordre', () => {
    expect(sanitizeVigils(undefined)).toEqual([]);
    expect(sanitizeVigils(['6e-departure', 'x', '6e-arrival', '6e-arrival'])).toEqual(['6e-arrival', '6e-departure']);
    expect(VIGIL_IDS).toEqual(['6e-arrival', '6e-boarding', '6e-departure']);
  });

  it('retient une veillée vue une seule fois, sans rien écrire d’autre', () => {
    const s0 = { world: world() };
    const s1 = seeVigil(s0, '6e-arrival');
    expect(s1).not.toBe(s0);
    expect(s1.world.vigils).toEqual(['6e-arrival']);
    expect(vigilSeen(s1.world, '6e-arrival')).toBe(true);
    expect(vigilSeen(s1.world, '6e-departure')).toBe(false);
    expect(seeVigil(s1, '6e-arrival')).toBe(s1);
    expect(seeVigil(s1, '6e-departure').world.vigils).toEqual(['6e-arrival', '6e-departure']);
    expect(s0.world.vigils).toBeUndefined();
  });

  it('traverse l’assainissement d’une sauvegarde, et manque sans mal dans une sauvegarde d’avant', () => {
    const raw = { stock: {}, world: { parts: {}, log: [], links: [], vigils: ['6e-boarding', 'rien'] } };
    expect(sanitizeState(raw).world.vigils).toEqual(['6e-boarding']);
    expect(sanitizeState({ stock: {}, world: { parts: {}, log: [], links: [] } }).world.vigils).toBeUndefined();
  });
});
