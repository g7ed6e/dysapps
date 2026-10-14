// À l'arrivée, la mission s'ouvre sur l'écran de mission actuel, à l'adresse de l'île d'aujourd'hui.
import { describe, expect, it } from 'vitest';
import { missionScreenInteraction } from './missionScreen';

describe('L’ouverture d’une mission dans le monde continu', () => {
  it('va à l’écran de mission de l’île que reprend le lieu', () => {
    const vers: string[] = [];
    const m = missionScreenInteraction((path) => vers.push(path));
    m.open('phare', 'syllables');
    m.open('ecluses', 'parts');
    expect(vers).toEqual(['/adventure/french-6e-phonology/syllables', '/adventure/maths-6e-fractions/parts']);
  });
});
