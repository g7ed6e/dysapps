// La Vigie (GD-20, point 8, lot L7) : sa ruine, ses étapes, ses traces, sa scénette, et ce qu'elle coûte.
import { describe, expect, it } from 'vitest';
import { fallenFacets } from './construction';
import { boundsOf } from './facets';
import { LOOKOUT, LOOKOUT_TOWER } from './lookout';
import { modelOfPlace, placePieces, ruinOf } from './places';
import { placeById } from './plan6e';
import { answerObjects, itemScene, placeTrace, sceneSpot } from './questionScene';
import { COLUMN, REST } from './questions';
import { scenetteDecor } from './scenette';
import { buildHeightField, heightAt, heightOnMesh, standingHeight } from './terrain';

describe('La Vigie (lot L7)', () => {
  const missions = placeById('lookout').scenes.concat(placeById('lookout').panels ?? []);

  it('une trace par mission, chacune la sienne ; lieu et traces sous 2 300 triangles', () => {
    expect(Object.keys(LOOKOUT.traces).sort()).toEqual([...missions].sort());
    const sizes = new Set(missions.map((m) => placeTrace('lookout', [m]).triangles));
    expect(sizes.size).toBe(missions.length);
    const model = modelOfPlace('lookout').facets.triangles;
    const traces = placeTrace('lookout', missions).triangles;
    console.info(`Vigie : lieu ${model}, ruine ${ruinOf('lookout').triangles}, traces ${traces}, total ${model + traces}`);
    expect(model + traces).toBeLessThanOrEqual(2300);
  });

  it('la ruine, basse, sous le fût ; ce qui en tombe s’en va quand sa rangée se pose', () => {
    expect(boundsOf(ruinOf('lookout')).max[1]).toBeLessThan(LOOKOUT_TOWER.top / 2 + 0.5);
    expect(modelOfPlace('lookout').top).toBeGreaterThan(LOOKOUT_TOWER.mast - 0.01);
    for (const p of placePieces('lookout')) if (p.until) expect(p.stage).toBe('ruine');
  });

  it('les abords se voient : leur première rangée enlève les pierres tombées, la seconde le mât brisé (relecture de L7)', () => {
    const field = buildHeightField();
    const ground = (x: number, z: number) => heightOnMesh(field, x, z);
    const fallen = (parts: { stage: 0 | 1 | 2; from: number; to: number }[][]) => fallenFacets('lookout', parts, ground).triangles;
    const all = fallen([]);
    expect(all).toBeGreaterThan(0);
    // Le corps et le haut posés n'enlèvent rien ; le dallage, si.
    const tower = [[{ stage: 0 as const, from: 0, to: 1 }], [{ stage: 1 as const, from: 0, to: 1 }]];
    expect(fallen(tower)).toBe(all);
    const first = fallen([...tower, [{ stage: 2, from: 0, to: 0.5 }]]);
    expect(first).toBeLessThan(all);
    expect(first).toBeGreaterThan(0);
    expect(fallen([...tower, [{ stage: 2, from: 0, to: 1 }]])).toBe(0);
  });

  it('les traces sont posées autour de la tour, aucune plus haute que le mât', () => {
    const c = placeById('lookout').center;
    const y0 = standingHeight(heightAt(c));
    for (const m of missions) {
      const b = boundsOf(placeTrace('lookout', [m]));
      expect(b.max[1], m).toBeLessThan(y0 + LOOKOUT_TOWER.mast);
      expect(Math.hypot(b.max[0] - c.x, b.max[2] - c.z), m).toBeLessThan(6);
    }
  });

  it('la scénette : le guetteur, les vitraux (un vitrail choisi penche), le volet témoin qui reste ouvert', () => {
    const decor = scenetteDecor('lookout').triangles;
    const o = sceneSpot('lookout');
    const points = [-1.2, 0, 1.2].map((dx) => ({ x: o.x + dx, y: o.y + 0.3, z: o.z + 1.5 }));
    const still = answerObjects('lookout', points, 1);
    const picked = answerObjects('lookout', points, 1, { picked: [1] });
    expect(picked.triangles).toBe(still.triangles);
    expect(Array.from(picked.positions)).not.toEqual(Array.from(still.positions));
    const rest = itemScene('lookout', REST, false);
    expect(rest.reaction).toBeNull();
    const closed = itemScene('lookout', COLUMN, false);
    expect(closed.reaction).toBeNull();
    const open = itemScene('lookout', COLUMN, true);
    expect(open.reaction?.stay).toBe(true);
    expect(open.reaction!.to.x).toBeGreaterThan(open.reaction!.from.x);
    // Le volet ouvert remplace le volet fermé : jamais les deux.
    expect(open.still.triangles + open.reaction!.facets.triangles).toBe(closed.still.triangles);
    console.info(`Vigie, scénette : décor ${decor}, trois vitraux ${still.triangles}, volet ${open.reaction!.facets.triangles}`);
  });
});
