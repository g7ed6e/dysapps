// Ce que montre l'Escale vient de la sauvegarde telle qu'elle est (GD-20, lot 2) : les portes de l'école des missions
// jouées, les trophées des succès gagnés, l'état de la région des parties et des liaisons, la pile du stock.
import { describe, expect, it } from 'vitest';
import { appsBySubject } from '../../../apps/registry';
import { BADGES, type Progress } from '../../../core/progress';
import type { GameState } from '../../engine';
import { BRIDGES, getArchipelago, voyageId } from '../../world/archipelago';
import { monumentsOf } from '../../world/monuments';
import { partiesDe } from '../../world/parts';
import { doorState, regionDegree, trophyAccents } from './portState';

const played = (ids: readonly string[], score = 80): Progress['apps'] => Object.fromEntries(ids.map((id) => [id, { sessions: 1, bestScore: score, lastPlayed: '2026-10-15' }]));
const missions = (s: 'french' | 'maths' | 'english') => appsBySubject(s).filter((a) => a.status === 'disponible').map((a) => a.id);

/** Toutes les cases d'un lieu posées. */
function allParts(id: Parameters<typeof partiesDe>[0]): Record<string, string[]> {
  const parts: Record<string, string[]> = {};
  for (const p of partiesDe(id)) for (const { plan, keys } of p.cases) parts[plan.id] = [...(parts[plan.id] ?? []), ...keys];
  return parts;
}

describe('l’état de l’Escale tiré de la sauvegarde', () => {
  it('une porte est fermée sans réussite, ouverte après une, pavoisée quand toutes ses missions sont jouées', () => {
    const maths = missions('maths');
    expect(maths.length).toBeGreaterThan(1);
    expect(doorState('maths', {})).toBe('closed');
    expect(doorState('maths', played(maths.slice(0, 1), 0))).toBe('closed');
    expect(doorState('maths', played(maths.slice(0, 1)))).toBe('lit');
    expect(doorState('maths', played(maths))).toBe('flags');
    // Une mission d'une autre matière n'ouvre pas la porte.
    expect(doorState('maths', played(missions('french')))).toBe('closed');
  });

  it('un trophée par succès gagné, dans l’ordre de la liste des succès', () => {
    expect(trophyAccents({})).toEqual([]);
    const [a, b] = [BADGES[3].id, BADGES[0].id];
    expect(trophyAccents({ [a]: '2026-10-01', [b]: '2026-10-02' })).toHaveLength(2);
    expect(trophyAccents(Object.fromEntries(BADGES.map((x) => [x.id, '2026-10-01'])))).toHaveLength(BADGES.length);
  });

  it('la région monte d’un degré à la fois : abandonnée, réactivée, en reconstruction, en développement, ouverte', () => {
    const empty: GameState['world'] = { parts: {}, links: [] } as unknown as GameState['world'];
    expect(regionDegree(empty)).toBe(0);
    const start = getArchipelago('6e').school;
    const first = partiesDe(start)[0];
    const one = Object.fromEntries(first.cases.map(({ plan, keys }) => [plan.id, keys]));
    expect(regionDegree({ ...empty, parts: one })).toBe(1);
    const whole = allParts(start);
    expect(regionDegree({ ...empty, parts: whole })).toBe(1);
    const link = BRIDGES.find((b) => b.cost > 0 && (b.from === start || b.to === start))!;
    expect(regionDegree({ ...empty, parts: whole, links: [link.id] })).toBe(2);
    const monument = monumentsOf('6e')[0];
    expect(regionDegree({ ...empty, parts: { ...whole, [monument.id]: ['0'] }, links: [link.id] })).toBe(3);
    expect(regionDegree({ ...empty, links: [voyageId('5e')] })).toBe(4);
  });
});
