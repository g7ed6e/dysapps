import type { Surface } from './surface';
import { blockedCells, cellAhead, stepFrom } from './walk';

const ground = (cells: [number, number, number, string][]): Surface =>
  new Map(cells.map(([x, y, z, m]) => [`${x},${y}`, { z, material: m as never }]));

describe('la marche libre', () => {
  const s = ground([
    [0, 0, 0, 'herbe'],
    [1, 0, 0, 'herbe'],
    [2, 0, 1, 'herbe'],
    [3, 0, 3, 'pierre'],
    [0, 1, 0, 'eau'],
    [0, -1, 0, 'lave'],
    [-1, 0, 0, 'sable'],
  ]);
  const at = { x: 0, y: 0, z: 1 };

  it('un pas d’une case sur le sol, les pieds un bloc au-dessus', () => {
    expect(stepFrom(s, new Set(), at, 'right')).toEqual({ x: 1, y: 0, z: 1 });
    expect(stepFrom(s, new Set(), at, 'left')).toEqual({ x: -1, y: 0, z: 1 });
  });

  it('jamais sur l’eau ni la lave, ni hors du sol', () => {
    expect(stepFrom(s, new Set(), at, 'up')).toBeNull();
    expect(stepFrom(s, new Set(), at, 'down')).toBeNull();
    expect(stepFrom(s, new Set(), { x: -1, y: 0, z: 1 }, 'left')).toBeNull();
  });

  it('une marche d’un bloc se monte, pas une falaise', () => {
    expect(stepFrom(s, new Set(), { x: 1, y: 0, z: 1 }, 'right')).toEqual({ x: 2, y: 0, z: 2 });
    expect(stepFrom(s, new Set(), { x: 2, y: 0, z: 2 }, 'right')).toBeNull();
  });

  it('on ne traverse ni un arbre ni un panneau ni une créature ; on enjambe les fleurs', () => {
    const blocked = blockedCells(
      [
        { id: 'a', kind: 'arbre', x: 1, y: 0, z: 1, muted: false },
        { id: 'f', kind: 'fleur', x: -1, y: 0, z: 1, muted: false },
      ],
      [{ quest: 'foret:rimes', x: 5, y: 5, z: 1, muted: false }],
      [{ x: 7.6, y: 2.2 }],
    );
    expect(blocked.has('1,0')).toBe(true);
    expect(blocked.has('-1,0')).toBe(false);
    expect(blocked.has('5,5')).toBe(true);
    expect(blocked.has('7,2')).toBe(true);
    expect(stepFrom(s, blocked, at, 'right')).toBeNull();
    expect(stepFrom(s, blocked, at, 'left')).toEqual({ x: -1, y: 0, z: 1 });
  });

  it('la case devant le bonhomme, selon où il regarde', () => {
    expect(cellAhead({ x: 3, y: 4, z: 1 }, 'up')).toEqual({ x: 3, y: 5 });
    expect(cellAhead({ x: 3, y: 4, z: 1 }, 'left')).toEqual({ x: 2, y: 4 });
  });
});
