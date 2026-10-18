// Le plan par niveau (GD-22, lot 1) : un seul plan enregistré, celui du 6e, tiré de ./plan6e.ts tel quel ; la fabrique
// de disposition ouvre le monde ouvert aux mêmes archipels ; un lieu se retrouve par son seul identifiant.
import { describe, expect, it } from 'vitest';
import { OPEN_WORLD_ARCHIPELAGOS } from '../../worldLayoutFactory';
import { ALL_LANDS, OPEN_WORLD_LEVELS, levelOfPlace, placeById, placeOfIsland, planFor } from './levelPlan';
import { COAST, LANDS_6E, OFFSHORE, PATH_EDGES, PLACES, STRAITS, TERRAIN } from './plan6e';

describe('Le plan par niveau', () => {
  it('un seul plan, celui du 6e, et la fabrique de disposition connaît les mêmes niveaux', () => {
    expect(OPEN_WORLD_LEVELS).toEqual(['6e']);
    expect([...OPEN_WORLD_ARCHIPELAGOS]).toEqual([...OPEN_WORLD_LEVELS]);
  });

  it('le plan du 6e est celui de plan6e.ts, sans rien changer', () => {
    const plan = planFor('6e');
    expect(plan.level).toBe('6e');
    expect(plan.places).toBe(PLACES);
    expect(plan.lands).toBe(LANDS_6E);
    expect(plan.pathEdges).toBe(PATH_EDGES);
    expect(plan.coast).toBe(COAST);
    expect(plan.offshore).toBe(OFFSHORE);
    expect(plan.terrain).toBe(TERRAIN);
    for (const land of LANDS_6E) if (land.after) expect(plan.bridges[land.id as keyof typeof STRAITS]).toBe(STRAITS[land.id as keyof typeof STRAITS].bridge);
  });

  it('un lieu et une terre se retrouvent par leur seul identifiant, et chaque lieu dit son niveau', () => {
    for (const p of PLACES) {
      expect(placeById(p.id)).toBe(p);
      expect(placeOfIsland(p.island)).toBe(p);
      expect(levelOfPlace(p.id)).toBe('6e');
    }
    expect(placeOfIsland('maths-5e-proportionality')).toBeUndefined();
    expect(ALL_LANDS).toEqual(LANDS_6E);
  });
});
