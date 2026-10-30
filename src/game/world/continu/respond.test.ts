// Le monde qui répond (GD-28, lot 4 de GD-27) : le registre des lieux qui répondent, les objets posés et celui qui se
// pose ; un lieu sans objet ne montre rien, et jamais plus d'objets que de bonnes réponses possibles.
import { describe, expect, it } from 'vitest';
import { FacetBuilder } from './facets';
import { RESPOND_MAX, RESPOND_SECONDS, registerResponder, respondMove, respondPlaced, respondTriangles, responds } from './respond';

// Un lieu d'essai qui répond : un cube par bonne réponse, en rangée, tombé de deux unités.
const AT = { x: 10, y: 2, z: -5 };
registerResponder('ruins', () => ({
  spot: (i) => ({ at: { x: AT.x + i, y: AT.y, z: AT.z }, from: { x: AT.x + i, y: AT.y + 2, z: AT.z }, arc: 0.3 }),
  object: (b) => b.box({ x: 0, y: 0, z: 0 }, [0.3, 0.3, 0.3], 0x806040),
}));
const cube = (): number => {
  const b = new FacetBuilder();
  b.box({ x: 0, y: 0, z: 0 }, [0.3, 0.3, 0.3], 0x806040);
  return b.build().triangles;
};

describe('Le monde qui répond', () => {
  it('un lieu sans objet ne répond pas : rien de posé, rien en vol', () => {
    expect(responds('phare')).toBe(false);
    expect(respondPlaced('phare', 3).triangles).toBe(0);
    expect(respondMove('phare', 0)).toBeNull();
    expect(respondTriangles('phare')).toBe(0);
  });

  it('un lieu qui répond pose un objet par bonne réponse, huit au plus, jamais moins que zéro', () => {
    expect(responds('ruins')).toBe(true);
    expect(respondPlaced('ruins', 0).triangles).toBe(0);
    expect(respondPlaced('ruins', 3).triangles).toBe(3 * cube());
    expect(respondPlaced('ruins', 20).triangles).toBe(RESPOND_MAX * cube());
    expect(respondPlaced('ruins', -2).triangles).toBe(0);
    expect(respondPlaced('ruins', 2.9).triangles).toBe(2 * cube());
    expect(respondTriangles('ruins')).toBe(RESPOND_MAX * cube());
  });

  it('chaque objet posé est à sa place (le dessin fait à l’origine, déplacé)', () => {
    const f = respondPlaced('ruins', 2);
    const xs = Array.from(f.positions).filter((_, k) => k % 3 === 0);
    const ys = Array.from(f.positions).filter((_, k) => k % 3 === 1);
    // Le premier cube autour de x = 10, le second autour de x = 11 ; tous posés sur y = 2 (le cube monte de son côté).
    expect(Math.min(...xs)).toBeCloseTo(AT.x - 0.15, 5);
    expect(Math.max(...xs)).toBeCloseTo(AT.x + 1 + 0.15, 5);
    expect(Math.min(...ys)).toBeCloseTo(AT.y, 5);
  });

  it('l’objet qui se pose part d’en haut et arrive à sa place, en un mouvement lent ; aucun au-delà du dernier', () => {
    const m = respondMove('ruins', 1)!;
    expect(m.facets.triangles).toBe(cube());
    expect(m.from).toEqual({ x: AT.x + 1, y: AT.y + 2, z: AT.z });
    expect(m.to).toEqual({ x: AT.x + 1, y: AT.y, z: AT.z });
    expect(m.arc).toBe(0.3);
    expect(respondMove('ruins', RESPOND_MAX)).toBeNull();
    expect(respondMove('ruins', -1)).toBeNull();
    expect(RESPOND_SECONDS).toBeGreaterThan(1);
  });
});
