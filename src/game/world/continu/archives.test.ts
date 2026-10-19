// Les Archives (lot L7) : le budget du lieu et de ses traces, rien dans l'eau du lagon.
import { describe, expect, it } from 'vitest';
import { ARCHIVES } from './archives';
import { constructionFacets, fallenFacets, ruinFacets, WHOLE, type PartShape, type Stage } from './construction';
import { boundsOf, FacetBuilder } from './facets';
import { modelOfPlace, ruinOf } from './places';
import { placeById } from './plan6e';
import { scenetteDecor, scenetteSurroundings } from './scenette';
import { buildHeightField, heightAt, heightOnMesh, standingHeight } from './terrain';

const field = buildHeightField();
const ground = (x: number, z: number) => heightOnMesh(field, x, z);
const slice = (stage: Stage, from: number, to: number): PartShape => [{ stage, from, to }];

describe('les Archives', () => {
  it('tiennent sous 2 400 triangles, lieu et traces', () => {
    const c = placeById('archives').center;
    const y = standingHeight(heightAt(c));
    const b = new FacetBuilder();
    for (const t of Object.values(ARCHIVES.traces)) t.draw(b, { x: c.x, y, z: c.z });
    const model = modelOfPlace('archives').facets.triangles;
    const traces = b.build().triangles;
    process.stdout.write(`\narchives: lieu ${model}, ruine ${ruinOf('archives').triangles}, traces ${traces}, total ${model + traces}, scénette ${scenetteDecor('archives').triangles}\n`);
    expect(model + traces).toBeLessThanOrEqual(2400);
    // La scénette (son sol et la copiste, sans ses abords, ./archivesSurroundings.ts) reste sous celle de la Turbine.
    expect(scenetteDecor('archives').triangles - scenetteSurroundings('archives').triangles).toBeLessThan(scenetteDecor('engine').triangles);
  });

  it('se rebâtissent : une ruine basse, puis chaque étape en rangées non vides, rien en double', () => {
    expect(ruinFacets('archives', ground).triangles + fallenFacets('archives', [], ground).triangles).toBeGreaterThan(20);
    const whole = constructionFacets('archives', [WHOLE], ground);
    expect(ruinFacets('archives', ground).triangles + whole.triangles).toBe(modelOfPlace('archives').facets.triangles);
    expect(boundsOf(ruinOf('archives')).max[1]).toBeLessThan(modelOfPlace('archives').top - 1);
    expect(fallenFacets('archives', [WHOLE], ground).triangles).toBe(0);
    for (const stage of [0, 1, 2] as const)
      for (const m of [2, 3]) {
        const cut = Array.from({ length: m }, (_, k) => constructionFacets('archives', [slice(stage, k / m, (k + 1) / m)], ground).triangles);
        if (stage === 0 || m === 2) for (const n of cut) expect(n).toBeGreaterThan(0);
      }
  });

  it('rien ne pose dans l’eau du lagon', () => {
    const c = placeById('archives').center;
    const f = modelOfPlace('archives').facets;
    const { max } = boundsOf(f);
    expect(max[2]).toBeLessThan(8);
    for (const p of [ARCHIVES.exit, ...Object.values(ARCHIVES.traces).map((t) => t.at)]) expect(heightAt({ x: c.x + p.x, z: c.z + p.z })).toBeGreaterThan(0.2);
  });
});
