// Le plan par niveau (GD-22, lots 1 et 2 ; lot 1 du 4e ; lot 1 du 3e) : quatre plans enregistrés, celui du 6e, tiré de
// ./plan6e.ts tel quel, celui du 5e, celui du 4e et celui du 3e ; la fabrique de disposition n'ouvre le monde ouvert qu'à des niveaux qui ont leur plan ; un lieu se retrouve
// par son seul identifiant.
import { describe, expect, it } from 'vitest';
import { OPEN_WORLD_ARCHIPELAGOS } from '../../worldLayoutFactory';
import { ALL_LANDS, ALL_PLANS, OPEN_WORLD_LEVELS, levelOfPlace, placeById, placeOfIsland, placeRecord, planFor } from './levelPlan';
import { COAST, LANDS_6E, OFFSHORE, PATH_EDGES, PLACES, STRAITS, TERRAIN } from './plan6e';
import { LANDS_3E, PLACES_3E } from './plan3e';
import { LANDS_4E, PLACES_4E } from './plan4e';
import { LANDS_5E, PLACES_5E } from './plan5e';

describe('Le plan par niveau', () => {
  it('`placeRecord` a une clé par lieu de son plan, et aucune autre, pour chaque plan (expert frontend, relecture du lot 2 du 5e)', () => {
    // Le type `Record<PlaceId, T>` ne le vérifie plus depuis que `PlaceId` réunit les lieux de tous les niveaux.
    for (const plan of ALL_PLANS) {
      const record = placeRecord(plan, (id) => id);
      expect(Object.keys(record).sort(), plan.level).toEqual(plan.places.map((p) => p.id).sort());
      for (const p of plan.places) expect(record[p.id], p.id).toBe(p.id);
    }
  });

  it('quatre plans, le 6e, le 5e, le 4e et le 3e ; la fabrique de disposition n’ouvre que des niveaux qui ont leur plan', () => {
    expect(OPEN_WORLD_LEVELS).toEqual(['6e', '5e', '4e', '3e']);
    // Les mêmes listes : chaque niveau qui a son plan a son monde ouvert, et seulement lui.
    expect([...OPEN_WORLD_ARCHIPELAGOS]).toEqual([...OPEN_WORLD_LEVELS]);
  });

  it('la Carte est la même aux quatre niveaux (piste B, plus d’option du plan)', () => {
    for (const l of OPEN_WORLD_LEVELS) expect(Object.keys(planFor(l)).filter((k) => /map/i.test(k))).toEqual([]);
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
    for (const p of PLACES_5E) {
      expect(placeById(p.id)).toBe(p);
      expect(placeOfIsland(p.island)).toBe(p);
      expect(levelOfPlace(p.id)).toBe('5e');
    }
    for (const p of PLACES_4E) {
      expect(placeById(p.id)).toBe(p);
      expect(placeOfIsland(p.island)).toBe(p);
      expect(levelOfPlace(p.id)).toBe('4e');
    }
    for (const p of PLACES_3E) {
      expect(placeById(p.id)).toBe(p);
      expect(placeOfIsland(p.island)).toBe(p);
      expect(levelOfPlace(p.id)).toBe('3e');
    }
    expect(ALL_LANDS).toEqual([...LANDS_6E, ...LANDS_5E, ...LANDS_4E, ...LANDS_3E]);
  });

  it('les identifiants des lieux, des îles et des terres sont uniques entre tous les plans, et chaque plan a une seule terre de départ', () => {
    const unique = (ids: readonly string[]) => expect(new Set(ids).size).toBe(ids.length);
    unique(ALL_PLANS.flatMap((p) => p.places.map((q) => q.id)));
    unique(ALL_PLANS.flatMap((p) => p.places.map((q) => q.island)));
    unique(ALL_PLANS.flatMap((p) => p.lands.map((l) => l.id)));
    for (const plan of ALL_PLANS) expect(plan.lands.filter((l) => l.after === null)).toHaveLength(1);
  });
});
