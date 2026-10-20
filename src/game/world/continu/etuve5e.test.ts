// L'Étuve (GD-22, lot 10) : son modèle par étapes, la lanterne du souffleur allumée dès la ruine, la vapeur qui passe de
// la rigole aux évents, la calotte basse, le creux à l'angle, une trace par étape, sa scénette, ses abords, son plafond de
// 1 600 triangles et le budget du 5e. Sans Three.js.
import { describe, expect, it } from 'vitest';
import { PLACE_TRIANGLES_MAX_5E, openWorldCost5e } from './budget';
import { WHOLE, posedTraces, traceStagePosed, type PartShape, type Stage } from './construction';
import { ETUVE, ETUVE_DOME, ETUVE_DOME_TOP, ETUVE_HOLLOW, ETUVE_TUB, ETUVE_VENTS } from './etuve5e';
import type { Facets } from './facets';
import { linearRgb } from './geometry';
import { HABITANT_TRIANGLES_5E, hasHabitantModel } from './habitants';
import { hasScenette, planFor } from './levelPlan';
import { COLORS_5E } from './plan5e';
import { drawPieces, placePieces } from './places';
import { placeItems } from './questions';
import { answerObjects, placeTrace, sceneSpot } from './questionScene';
import { RUINS_5E } from './ruins5e';
import { scenetteHabitant, scenetteKeo, scenetteOf, scenetteSurroundings } from './scenette';
import { SURROUNDINGS_MAX } from './surroundings';

const PLAN = planFor('5e');
const PLACE = PLAN.places.find((p) => p.id === 'etuve')!;
const MISSIONS = ['changes-of-state', 'mixtures-density', 'universe-atoms'] as const;

/** Les parties posées jusqu'à l'étape `n` comprise (−1 : la ruine). */
const upTo = (n: number): PartShape[] => [0, 1, 2].filter((s) => s <= n).map((s) => [{ stage: s as Stage, from: 0, to: 1 }]);

/** Ce que le lieu montre, ses parties posées jusqu'à `n` : la ruine qui reste, les étapes posées. */
function shown(n: number): Facets {
  const parts = upTo(n);
  const posed = (stage: Stage) => parts.some((p) => p.some((s) => s.stage === stage));
  return drawPieces('etuve', (p) => (p.stage === 'ruine' ? !p.until || !posed(p.until.stage) : posed(p.stage)));
}

/** Les sommets d'une couleur exacte (la lanterne d'ocre, que la vue dessine sans ombre ; la vapeur). */
function countColor(f: Facets, color: number): number {
  const [r, g, b] = linearRgb(color);
  let n = 0;
  for (let i = 0; i < f.colors.length; i += 3) if (Math.abs(f.colors[i] - r) < 1e-4 && Math.abs(f.colors[i + 1] - g) < 1e-4 && Math.abs(f.colors[i + 2] - b) < 1e-4) n++;
  return n;
}

/** Le milieu (x, z) des sommets d'une couleur exacte. */
function centerOf(f: Facets, color: number): { x: number; z: number } {
  const [r, g, b] = linearRgb(color);
  let x = 0,
    z = 0,
    n = 0;
  for (let i = 0; i < f.colors.length; i += 3)
    if (Math.abs(f.colors[i] - r) < 1e-4 && Math.abs(f.colors[i + 1] - g) < 1e-4 && Math.abs(f.colors[i + 2] - b) < 1e-4) {
      x += f.positions[i];
      z += f.positions[i + 2];
      n++;
    }
  return { x: x / n, z: z / n };
}

const STEAM = 0xe5ebe3;

describe('L’Étuve, lieu complet', () => {
  it('ses trois missions se jouent dans sa scénette ; sa ruine d’hier, le tambour rond, est partie', () => {
    expect(PLACE.scenes).toEqual([...MISSIONS]);
    expect(hasScenette('etuve')).toBe(true);
    expect(Object.keys(RUINS_5E)).not.toContain('etuve');
  });

  it('se rebâtit en trois étapes, chacune en deux temps ; la ruine part avec l’étape qui la remplace', () => {
    const pieces = placePieces('etuve');
    for (const stage of [0, 1, 2]) expect(pieces.filter((p) => p.stage === stage).map((p) => p.row), String(stage)).toEqual([0, 0.5]);
    const fallen = pieces.filter((p) => p.stage === 'ruine' && p.until).map((p) => `${p.until!.stage}:${p.until!.row}`);
    // Le corps relève la calotte, ses blocs, la rigole (premier temps), puis le chalet et l'établi (second temps) ; les
    // abords remplacent la lentille couchée, le parvis et le pavé fendus, puis les bassins vides.
    expect(fallen).toEqual(['0:0', '0:0', '0:0', '0:0.5', '2:0', '2:0.5']);
  });

  it('coûte au plus le plafond d’un lieu du 5e à son état le plus chargé, ruine, étapes et traces montrées ensemble', () => {
    let worst = 0;
    for (let n = -1; n <= 2; n++) {
      const traces = placeTrace('etuve', posedTraces('etuve', upTo(n), [...MISSIONS])).triangles;
      worst = Math.max(worst, shown(n).triangles + traces);
    }
    expect(worst).toBeLessThanOrEqual(PLACE_TRIANGLES_MAX_5E);
    // La ruine seule, au plus 1 100 triangles (intention, « Le budget »).
    expect(shown(-1).triangles).toBeLessThanOrEqual(1_100);
    // Le plus chargé est le lieu restauré : le budget le compte ainsi (`modelOfPlace` et toutes les traces).
    expect(shown(2).triangles + placeTrace('etuve', [...MISSIONS]).triangles).toBe(worst);
  });

  it('la lanterne du souffleur brille dès la ruine, seule ; le haut allume le pignon, les abords le parvis : trois au plus', () => {
    const lit = (n: number) => countColor(shown(n), COLORS_5E.lantern);
    // Une lanterne pendue : sa vitre à six pans, ses six côtés et son dessus.
    expect(lit(-1)).toBe(3 * 18);
    // Le corps n'allume rien : le four n'a ni braise ni lueur.
    expect(lit(0)).toBe(lit(-1));
    expect(lit(1)).toBe(lit(0) + 3 * 18);
    // La lanterne du parvis, sur piquet : un pavé.
    expect(lit(2)).toBe(lit(1) + 3 * 10);
    // Aucune trace n'est d'ocre.
    expect(countColor(placeTrace('etuve', [...MISSIONS]), COLORS_5E.lantern)).toBe(0);
  });

  it('une seule vapeur à la fois : au bout cassé de la rigole dans la ruine, aux évents dès le corps', () => {
    const ruin = shown(-1),
      body = shown(0);
    expect(countColor(ruin, STEAM)).toBe(countColor(body, STEAM));
    const before = centerOf(ruin, STEAM),
      after = centerOf(body, STEAM);
    // Dans la ruine, au nord-ouest, loin du four ; ensuite, au-dessus de la calotte.
    expect(Math.hypot(after.x - ETUVE_VENTS[0].x, after.z - ETUVE_VENTS[0].z)).toBeLessThan(1);
    expect(Math.hypot(before.x - after.x, before.z - after.z)).toBeGreaterThan(3);
    expect(before.x).toBeLessThan(after.x);
  });

  it('une calotte basse, haute d’un tiers de sa largeur, et ses trois évents groupés au sommet', () => {
    expect(ETUVE_DOME.height / ETUVE_DOME.width).toBeGreaterThan(0.28);
    expect(ETUVE_DOME.height / ETUVE_DOME.width).toBeLessThan(0.4);
    expect(ETUVE_DOME_TOP).toBeLessThan(4.5);
    expect(ETUVE_VENTS).toHaveLength(3);
    for (const v of ETUVE_VENTS) expect(Math.hypot(v.x - ETUVE_VENTS[0].x, v.z - ETUVE_VENTS[0].z)).toBeLessThan(1);
  });

  it('le creux du soufflet à l’angle ouest de la face sud, loin du milieu ; le baquet jamais devant lui', () => {
    expect(ETUVE_HOLLOW.x).toBeLessThan(-ETUVE_HOLLOW.faceHalf / 2);
    expect(ETUVE_TUB.x - ETUVE_TUB.r).toBeGreaterThan(ETUVE_HOLLOW.x + 1);
  });
});

describe('Les traces de l’Étuve : une par mission, chacune portée par son étape', () => {
  it('la trace de la mission n se montre quand sa mission est réussie et que l’étape n est posée', () => {
    expect(ETUVE.traces['changes-of-state'].stage).toBe(0);
    expect(ETUVE.traces['mixtures-density'].stage).toBe(1);
    expect(ETUVE.traces['universe-atoms'].stage).toBe(2);
    expect(posedTraces('etuve', upTo(-1), [...MISSIONS])).toEqual([]);
    expect(posedTraces('etuve', upTo(0), [...MISSIONS])).toEqual(['changes-of-state']);
    expect(posedTraces('etuve', upTo(1), [...MISSIONS])).toEqual(['changes-of-state', 'mixtures-density']);
    expect(posedTraces('etuve', [WHOLE], [...MISSIONS])).toEqual([...MISSIONS]);
    expect(posedTraces('etuve', upTo(0), ['universe-atoms'])).toEqual([]);
    expect(traceStagePosed('etuve', upTo(0))).toBe(true);
    expect(traceStagePosed('etuve', upTo(-1))).toBe(false);
  });

  it('chaque trace se dessine seule, rien sans réussite', () => {
    for (const m of MISSIONS) expect(placeTrace('etuve', [m]).triangles, m).toBeGreaterThan(0);
    expect(placeTrace('etuve', []).triangles).toBe(0);
  });
});

describe('La scénette de l’Étuve', () => {
  it('le souffleur de verre, Kéo à plus de deux unités de lui, sur le pavé ; les réponses aux gobelets', () => {
    expect(scenetteOf('etuve').role).toBe('Le souffleur de verre');
    // Aucun nom propre dans le monde ouvert.
    expect(`${scenetteOf('etuve').role} ${scenetteOf('etuve').greeting}`).not.toMatch(/Perle|Flamant|Zia/);
    const keo = scenetteKeo('etuve').at;
    const h = scenetteHabitant('etuve');
    expect(h.x - keo.x).toBeGreaterThan(2);
    expect(Math.abs(h.y - keo.y)).toBeLessThan(1e-6);
    const s = sceneSpot('etuve');
    expect(s.z - PLACE.center.z).toBeCloseTo(ETUVE.sceneSpot.dz, 6);
    const items = placeItems('etuve', 'physics-chemistry-5e-matter-universe-changes-of-state-1', [{ key: 'a', choices: ['ordre', 'désordre'], answer: 'désordre' }]);
    expect(items[0].placeScene).toEqual({ kind: 'rest' });
  });

  it('un gobelet choisi se soulève d’un cran : sa forme ne change pas, sa place si', () => {
    const at = [{ x: 0, y: 0, z: 0 }];
    const still = answerObjects('etuve', at, 1, { picked: [] });
    const picked = answerObjects('etuve', at, 1, { picked: [0] });
    expect(picked.triangles).toBe(still.triangles);
    const top = (f: Facets) => Math.max(...f.positions.filter((_, i) => i % 3 === 1));
    expect(top(picked) - top(still)).toBeGreaterThan(0.15);
  });

  it('le souffleur de verre se montre en modèle 3D', () => {
    expect(hasHabitantModel('etuve')).toBe(true);
  });

  it('ses abords tiennent sous le plafond commun, dans chaque état', () => {
    for (const posed of [false, true])
      for (const open of [false, true]) {
        const f = scenetteSurroundings('etuve', open, posed);
        expect(f.triangles).toBeGreaterThan(0);
        expect(f.triangles).toBeLessThanOrEqual(SURROUNDINGS_MAX);
      }
  });

  it('la scénette garde son décor de près et la question sous ceux du Hameau, sans appel de plus', () => {
    const scenette = openWorldCost5e().find((c) => c.poste === 'scénette')!;
    expect(scenette.calls).toBe(2);
    expect(scenette.triangles).toBeLessThanOrEqual(HABITANT_TRIANGLES_5E + 1_900);
  });
});
