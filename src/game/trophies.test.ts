import { BADGES } from '../core/progress';
import { trophies, trophyBlock } from './trophies';

it('un trophée par succès gagné, dans l’ordre des succès, son bloc selon la famille', () => {
  expect(trophies({})).toEqual([]);
  expect(trophies({ 'rang-or': 'x', 'premier-pas': 'x', capitaine: 'x', gardien: 'x' })).toEqual(['trophy-gold', 'trophy-crystal', 'french-3e-close-reading', 'maths-3e-statistics']);
  expect(trophyBlock('rang-legende')).toBe('trophy-crystal');
  expect(trophies(Object.fromEntries(BADGES.map((b) => [b.id, 'x'])))).toHaveLength(BADGES.length);
});
