// Les Radeaux (GD-22, lot 6) : le lieu complet, une trace par mission dès que sa partie est posée (trois au corps, puis
// le haut, puis les abords), une seule lanterne allumée dans la ruine, sa scénette, ses abords, son plafond de 1 600
// triangles et le budget du 5e avec eux et le Creux. Sans Three.js.
import { describe, expect, it } from 'vitest';
import { PLACE_TRIANGLES_MAX_5E, mapCost5e, openWorldCost5e } from './budget';
import { WHOLE, posedTraces, rowPosed, traceStagePosed, type PartShape, type Stage } from './construction';
import { creuxTriangles } from './creux5e';
import { linearRgb } from './geometry';
import { hasHabitantModel } from './habitants';
import { hasScenette, planFor } from './levelPlan';
import { BUILT_PLACES_5E, COLORS_5E } from './plan5e';
import { drawPieces, placePieces } from './places';
import { placeItems } from './questions';
import { answerObjects, placeTrace } from './questionScene';
import { RADEAUX, RADEAUX_HEIGHTS, RADEAUX_LAYOUT } from './radeaux5e';
import { landDistance5e } from './terrain5e';
import { scenetteHabitant, scenetteKeo, scenetteOf, scenetteSurroundings } from './scenette';
import { SURROUNDINGS_MAX } from './surroundings';
import type { Facets } from './facets';

const PLAN = planFor('5e');
const PLACE = PLAN.places.find((p) => p.id === 'radeaux')!;
const MISSIONS = [...BUILT_PLACES_5E.radeaux];

/** Les parties des Radeaux, dans l'ordre de la pose : le corps en trois tiers, le haut, les abords. */
const PARTS: readonly PartShape[] = [
  [{ stage: 0, from: 0, to: 1 / 3 }],
  [{ stage: 0, from: 1 / 3, to: 2 / 3 }],
  [{ stage: 0, from: 2 / 3, to: 1 }],
  [{ stage: 1, from: 0, to: 1 }],
  [{ stage: 2, from: 0, to: 1 }],
];

/** Ce que le lieu montre, ses `n` premières parties posées : la ruine qui reste, les rangées posées. */
function shown(n: number): Facets {
  const parts = PARTS.slice(0, n);
  const posed = (stage: Stage, row: number) => parts.some((p) => p.some((s) => s.stage === stage && row >= s.from - 1e-9 && row < s.to - 1e-9));
  return drawPieces('radeaux', (p) => (p.stage === 'ruine' ? !p.until || !rowPosed(parts, p.until.stage, p.until.row) : posed(p.stage, p.row)));
}

/** Les sommets d'une couleur exacte (la lanterne d'ocre, que la vue dessine sans ombre). */
function countColor(f: Facets, color: number): number {
  const [r, g, b] = linearRgb(color);
  let n = 0;
  for (let i = 0; i < f.colors.length; i += 3) if (Math.abs(f.colors[i] - r) < 1e-4 && Math.abs(f.colors[i + 1] - g) < 1e-4 && Math.abs(f.colors[i + 2] - b) < 1e-4) n++;
  return n;
}

describe('Les Radeaux, lieu complet', () => {
  it('ses cinq missions se jouent dans sa scénette', () => {
    expect(PLACE.scenes).toEqual(MISSIONS);
    expect(hasScenette('radeaux')).toBe(true);
    expect(scenetteOf('radeaux').role).toBe('Le marchand');
  });

  it('le corps se pose en trois tiers, le haut et les abords d’un coup ; la ruine part avec ce qui la remplace', () => {
    const pieces = placePieces('radeaux');
    expect([...new Set(pieces.filter((p) => p.stage === 0).map((p) => p.row))]).toEqual([0, 1 / 3, 2 / 3]);
    expect([...new Set(pieces.filter((p) => p.stage === 1 || p.stage === 2).map((p) => p.row))]).toEqual([0]);
    // Toute la ruine, sauf la racine en arche, le bois et le portique, s'en va un jour.
    expect(pieces.filter((p) => p.stage === 'ruine' && p.until).length).toBeGreaterThan(4);
  });

  it('coûte au plus le plafond d’un lieu du 5e à chaque partie, ruine, rangées et traces montrées ensemble ; la ruine, 1 200 au plus', () => {
    for (let n = 0; n <= PARTS.length; n++) {
      const traces = placeTrace('radeaux', posedTraces('radeaux', PARTS.slice(0, n), MISSIONS)).triangles;
      expect(shown(n).triangles + traces, String(n)).toBeLessThanOrEqual(PLACE_TRIANGLES_MAX_5E);
    }
    expect(shown(0).triangles).toBeLessThanOrEqual(1200);
  });

  it('une seule lanterne brille dans la ruine ; restauré, trois', () => {
    const lantern = countColor(shown(0), COLORS_5E.lantern);
    expect(lantern).toBeGreaterThan(0);
    expect(countColor(shown(PARTS.length), COLORS_5E.lantern)).toBe(3 * lantern);
  });

  it('ses trois radeaux et les poteaux du portique sont sur l’eau ; la cabane, sur la rive', () => {
    const at = (p: { x: number; z: number }) => ({ x: PLACE.center.x + p.x, z: PLACE.center.z + p.z });
    for (const r of RADEAUX_LAYOUT.rafts) expect(landDistance5e(at(r)), `${r.x} ${r.z}`).toBeLessThan(0);
    for (const p of RADEAUX_LAYOUT.posts) expect(landDistance5e(at(p)), `${p.x} ${p.z}`).toBeLessThan(0);
    expect(landDistance5e(at(RADEAUX_LAYOUT.cabin))).toBeGreaterThan(0);
  });

  it('la lanterne de la grande perche reste sous les fourches du portique, et le lieu sous la canopée', () => {
    expect(RADEAUX_HEIGHTS.perchAboveWater).toBeLessThan(RADEAUX_HEIGHTS.forks);
    expect(RADEAUX_HEIGHTS.top).toBeLessThan(8);
  });
});

describe('Les traces des Radeaux : une par mission, chacune avec sa partie', () => {
  it('trois au corps (une par tiers), une au haut, une aux abords', () => {
    expect(MISSIONS.map((m) => [RADEAUX.traces[m].stage, RADEAUX.traces[m].row])).toEqual([
      [0, 0],
      [0, 1 / 3],
      [0, 2 / 3],
      [1, undefined],
      [2, undefined],
    ]);
    for (let n = 0; n <= PARTS.length; n++) expect(posedTraces('radeaux', PARTS.slice(0, n), MISSIONS), String(n)).toEqual(MISSIONS.slice(0, n));
    expect(posedTraces('radeaux', [WHOLE], [])).toEqual([]);
    expect(traceStagePosed('radeaux', PARTS.slice(0, 1))).toBe(true);
  });

  it('chaque trace se dessine seule, rien sans réussite', () => {
    for (const m of MISSIONS) expect(placeTrace('radeaux', [m]).triangles, m).toBeGreaterThan(0);
    expect(placeTrace('radeaux', []).triangles).toBe(0);
  });
});

describe('La scénette des Radeaux', () => {
  it('le marchand en modèle 3D, Kéo à son côté, au même plancher ; les réponses aux poids', () => {
    expect(hasHabitantModel('radeaux')).toBe(true);
    const keo = scenetteKeo('radeaux').at;
    const h = scenetteHabitant('radeaux');
    expect(Math.hypot(h.x - keo.x, h.z - keo.z)).toBeGreaterThan(2);
    expect(Math.abs(h.y - keo.y)).toBeLessThan(1e-6);
    const items = placeItems('radeaux', 'maths-5e-proportionality-percentages-1', [{ key: 'a', choices: ['25 %', '50 %'], answer: '25 %' }]);
    expect(items[0].placeScene).toEqual({ kind: 'rest' });
  });

  it('un poids choisi se soulève d’un cran : sa forme ne change pas, sa place si', () => {
    const at = [{ x: 0, y: 0, z: 0 }];
    const still = answerObjects('radeaux', at, 1, { picked: [] });
    const picked = answerObjects('radeaux', at, 1, { picked: [0] });
    expect(picked.triangles).toBe(still.triangles);
    const top = (f: Facets) => Math.max(...f.positions.filter((_, i) => i % 3 === 1));
    expect(top(picked) - top(still)).toBeGreaterThan(0.15);
  });

  it('ses abords tiennent sous le plafond commun, dans chaque état', () => {
    for (const posed of [false, true])
      for (const open of [false, true]) {
        const f = scenetteSurroundings('radeaux', open, posed);
        expect(f.triangles).toBeGreaterThan(0);
        expect(f.triangles).toBeLessThanOrEqual(SURROUNDINGS_MAX);
      }
  });

  it('ne dit aucun nom du contenu (ni Bazar, ni Colporteur, ni l’échoppe)', () => {
    const said = `${scenetteOf('radeaux').role} ${scenetteOf('radeaux').greeting ?? ''}`;
    expect(said).not.toMatch(/Bazar|Colporteur|échoppe/i);
  });
});

/**
 * Le budget du 5e au lot 5, avant les Radeaux et le Creux (`npm run rendu:budget -- --archipel 6e,5e`, 20 octobre
 * 2026), en triangles : hors scénette, au départ et sur la Carte.
 */
const LOT5_5E = { world: { triangles: 84_510, calls: 16 }, departure: { triangles: 83_388, calls: 17 }, map: { triangles: 83_115, calls: 12 } } as const;

/** Le plafond du Creux (intention du directeur artistique, lot 6). */
const CREUX_MAX = 175;

/** Le pied des palétuviers de loin (./terrain5e.ts, trois triangles par arbre, #475) : 1 900 triangles au plus (la Carte, la plus chargée). */
const FOREST_FEET_5E = 1_900;

describe('Le budget du 5e, avec les Radeaux et le Creux (plafonds du lot 6)', () => {
  const sum = (c: { triangles: number; calls: number }[]) => c.reduce((a, p) => ({ triangles: a.triangles + p.triangles, calls: a.calls + p.calls }), { triangles: 0, calls: 0 });

  it('le Creux, sa sente comprise, 175 triangles au plus, sans appel', () => {
    expect(creuxTriangles().withSente).toBeLessThanOrEqual(CREUX_MAX);
    expect(openWorldCost5e().find((c) => c.poste === 'détours')).toEqual({ poste: 'détours', triangles: creuxTriangles().withSente, calls: 0 });
  });

  // Le plafond scénette ouverte et la réserve des lots suivants : ./plan5e.test.ts (« Le budget du 5e »).
  it('hors scénette, au départ et sur la Carte : le lot 5, un lieu, le Creux et le pied des palétuviers de plus au plus, sans appel de plus', () => {
    const views = [
      [sum(openWorldCost5e('monde')), LOT5_5E.world],
      [sum(openWorldCost5e('depart')), LOT5_5E.departure],
      [mapCost5e(), LOT5_5E.map],
    ] as const;
    for (const [now, before] of views) {
      expect(now.triangles).toBeLessThanOrEqual(before.triangles + PLACE_TRIANGLES_MAX_5E + CREUX_MAX + FOREST_FEET_5E);
      expect(now.calls).toBeLessThanOrEqual(before.calls);
    }
  });
});
