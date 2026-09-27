import { BADGES } from '../core/progress';
import { trophies, trophyBlock } from './trophies';

it('un trophée par succès gagné, dans l’ordre des succès, son bloc selon la famille', () => {
  expect(trophies({})).toEqual([]);
  expect(trophies({ 'rang-or': 'x', 'premier-pas': 'x', capitaine: 'x', gardien: 'x' })).toEqual(['or', 'cristal', 'lentille', 'quartz']);
  expect(trophyBlock('rang-legende')).toBe('cristal');
  expect(trophies(Object.fromEntries(BADGES.map((b) => [b.id, 'x'])))).toHaveLength(BADGES.length);
});
