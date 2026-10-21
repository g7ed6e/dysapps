// Le Hameau (GD-22, lot 5) : son modèle par étapes, la lanterne du boulanger allumée dès la ruine, une trace par étape,
// sa scénette, ses abords, son plafond de 1 600 triangles et le budget du 5e. Sans Three.js.
import { describe, expect, it } from 'vitest';
import { PLACE_TRIANGLES_MAX_5E, openWorldCost5e } from './budget';
import { WHOLE, posedTraces, traceStagePosed, type PartShape, type Stage } from './construction';
import { COLORS_5E } from './plan5e';
import { linearRgb } from './geometry';
import { GARLAND_SHAPES, HAMEAU, HAMEAU_MAST_TOP } from './hameau5e';
import { HABITANT_TRIANGLES_5E, hasHabitantModel } from './habitants';
import { hasScenette, planFor } from './levelPlan';
import { MONTEE, MONTEE_HEIGHT } from './montee5e';
import { drawPieces, placePieces } from './places';
import { placeItems } from './questions';
import { answerObjects, placeTrace, sceneSpot } from './questionScene';
import { scenetteHabitant, scenetteKeo, scenetteOf, scenetteSurroundings } from './scenette';
import { SURROUNDINGS_MAX } from './surroundings';
import type { Facets } from './facets';

const PLAN = planFor('5e');
const HAMEAU_PLACE = PLAN.places.find((p) => p.id === 'hameau')!;
const MISSIONS = ['gender-equality', 'discrimination', 'solidarity'] as const;

/** Les parties posées jusqu'à l'étape `n` comprise (−1 : la ruine). */
const upTo = (n: number): PartShape[] => [0, 1, 2].filter((s) => s <= n).map((s) => [{ stage: s as Stage, from: 0, to: 1 }]);

/** Ce que le lieu montre, ses parties posées jusqu'à `n` : la ruine qui reste, les étapes posées. */
function shown(n: number): Facets {
  const parts = upTo(n);
  const posed = (stage: Stage) => parts.some((p) => p.some((s) => s.stage === stage));
  return drawPieces('hameau', (p) => (p.stage === 'ruine' ? !p.until || !posed(p.until.stage) : posed(p.stage)));
}

/** Les sommets d'une couleur exacte (la lanterne d'ocre, que la vue dessine sans ombre). */
function countColor(f: Facets, color: number): number {
  const [r, g, b] = linearRgb(color);
  let n = 0;
  for (let i = 0; i < f.colors.length; i += 3) if (Math.abs(f.colors[i] - r) < 1e-4 && Math.abs(f.colors[i + 1] - g) < 1e-4 && Math.abs(f.colors[i + 2] - b) < 1e-4) n++;
  return n;
}

describe('Le Hameau, lieu complet', () => {
  it('ses trois missions se jouent dans sa scénette ; la Montée, le Hameau, les Radeaux, la Croisée, les Instants, les Fumerolles, l’Étuve, les Terrasses, l’Auberge, le Sémaphore et le Gaillard en ont une au 5e', () => {
    expect(HAMEAU_PLACE.scenes).toEqual([...MISSIONS]);
    expect(PLAN.places.filter((p) => hasScenette(p.id)).map((p) => p.id).sort()).toEqual(['auberge', 'croisee', 'donjon', 'etuve', 'fumerolles', 'gaillard', 'hameau', 'instants', 'montee', 'oracle', 'radeaux', 'semaphore', 'terrasses']);
    for (const p of PLAN.places) if (!hasScenette(p.id)) expect(p.scenes, p.id).toEqual([]);
  });

  it('se rebâtit en trois étapes, chacune en deux temps ; la ruine part avec l’étape qui la remplace', () => {
    const pieces = placePieces('hameau');
    for (const stage of [0, 1, 2]) expect(pieces.filter((p) => p.stage === stage).map((p) => p.row), String(stage)).toEqual([0, 0.5]);
    const fallen = pieces.filter((p) => p.stage === 'ruine' && p.until).map((p) => p.until!.stage);
    // Le corps relève le four, ses blocs et les trois maisons ; le toit gardé de l'est part avec le haut ; les abords
    // remplacent les passerelles coupées, le ponton cassé, la barque coulée et les pots.
    expect(fallen).toEqual([0, 0, 0, 0, 1, 0, 0, 2]);
  });

  it('coûte au plus le plafond d’un lieu du 5e à son état le plus chargé, ruine, étapes et traces montrées ensemble', () => {
    let worst = 0;
    for (let n = -1; n <= 2; n++) {
      const traces = placeTrace('hameau', posedTraces('hameau', upTo(n), [...MISSIONS])).triangles;
      worst = Math.max(worst, shown(n).triangles + traces);
    }
    expect(worst).toBeLessThanOrEqual(PLACE_TRIANGLES_MAX_5E);
    // Le plus chargé est le lieu restauré : le budget le compte ainsi (`modelOfPlace` et toutes les traces).
    expect(shown(2).triangles + placeTrace('hameau', [...MISSIONS]).triangles).toBe(worst);
  });

  it('la lanterne du boulanger brille dès la ruine, seule ; le haut allume le mât, les abords la cour', () => {
    const lit = (n: number) => countColor(shown(n), COLORS_5E.lantern);
    const ruin = lit(-1);
    // Une lanterne : sa vitre à six pans, ses six côtés et son dessus.
    expect(ruin).toBe(3 * 18);
    // Le corps ajoute la braise fixe dans la bouche du four (un pavé).
    expect(lit(0)).toBe(ruin + 3 * 10);
    expect(lit(1)).toBe(lit(0) + 3 * 18);
    expect(lit(2)).toBe(lit(1) + 2 * 3 * 10);
  });

  it('le mât reste sous la canopée et bien sous la Montée', () => {
    expect(HAMEAU_MAST_TOP).toBeLessThan(8);
    expect(HAMEAU_MAST_TOP).toBeLessThan(MONTEE_HEIGHT / 5);
  });
});

describe('Les traces du Hameau : une par mission, chacune portée par son étape', () => {
  it('la trace de la mission n se montre quand sa mission est réussie et que l’étape n est posée', () => {
    expect(HAMEAU.traces['gender-equality'].stage).toBe(0);
    expect(HAMEAU.traces.discrimination.stage).toBe(1);
    expect(HAMEAU.traces.solidarity.stage).toBe(2);
    expect(posedTraces('hameau', upTo(-1), [...MISSIONS])).toEqual([]);
    expect(posedTraces('hameau', upTo(0), [...MISSIONS])).toEqual(['gender-equality']);
    expect(posedTraces('hameau', upTo(1), [...MISSIONS])).toEqual(['gender-equality', 'discrimination']);
    expect(posedTraces('hameau', [WHOLE], [...MISSIONS])).toEqual([...MISSIONS]);
    // Réussie, mais son étape attend : rien ; posée, mais pas réussie : rien.
    expect(posedTraces('hameau', upTo(0), ['solidarity'])).toEqual([]);
    expect(posedTraces('hameau', [WHOLE], [])).toEqual([]);
    expect(traceStagePosed('hameau', upTo(0))).toBe(true);
    expect(traceStagePosed('hameau', upTo(-1))).toBe(false);
  });

  it('la Montée ne change pas : ses cinq traces attendent toujours le haut', () => {
    expect(MONTEE.traceStage).toBe(1);
    for (const t of Object.values(MONTEE.traces)) expect(t.stage).toBeUndefined();
    const all = Object.keys(MONTEE.traces);
    expect(posedTraces('montee', upTo(0), all)).toEqual([]);
    expect(posedTraces('montee', upTo(1), all)).toEqual(all);
  });

  it('chaque trace se dessine seule, rien sans réussite ; la guirlande a cinq lanternes de trois formes', () => {
    for (const m of MISSIONS) expect(placeTrace('hameau', [m]).triangles, m).toBeGreaterThan(0);
    expect(placeTrace('hameau', []).triangles).toBe(0);
    expect(new Set(GARLAND_SHAPES)).toEqual(new Set(['ronde', 'carree', 'hexagonale']));
    expect(GARLAND_SHAPES).toHaveLength(5);
    // Toutes de la même lumière d'ocre : seule la forme les distingue.
    const g = placeTrace('hameau', ['discrimination']);
    expect(countColor(g, COLORS_5E.lantern)).toBeGreaterThan(0);
  });
});

describe('La scénette du Hameau', () => {
  it('le boulanger, Kéo à plus de deux unités de lui, sur le ponton devant la bouche ; les réponses aux miches', () => {
    expect(scenetteOf('hameau').role).toBe('Le boulanger');
    const keo = scenetteKeo('hameau').at;
    const h = scenetteHabitant('hameau');
    expect(h.x - keo.x).toBeGreaterThan(2);
    expect(Math.abs(h.y - keo.y)).toBeLessThan(1e-6);
    const s = sceneSpot('hameau');
    expect(s.z - HAMEAU_PLACE.center.z).toBeCloseTo(HAMEAU.sceneSpot.dz, 6);
    const items = placeItems('hameau', 'civics-5e-equality-solidarity-solidarity-1', [{ key: 'a', choices: ['prévention', 'sanction'], answer: 'prévention' }]);
    expect(items[0].placeScene).toEqual({ kind: 'rest' });
  });

  it('une miche choisie se soulève d’un cran : sa forme ne change pas, sa place si', () => {
    const at = [{ x: 0, y: 0, z: 0 }];
    const still = answerObjects('hameau', at, 1, { picked: [] });
    const picked = answerObjects('hameau', at, 1, { picked: [0] });
    expect(picked.triangles).toBe(still.triangles);
    const top = (f: Facets) => Math.max(...f.positions.filter((_, i) => i % 3 === 1));
    expect(top(picked) - top(still)).toBeGreaterThan(0.15);
  });

  it('le boulanger et la fontainière se montrent en modèle 3D ; les autres lieux du 5e gardent leur pion', () => {
    expect(hasHabitantModel('hameau')).toBe(true);
    expect(hasHabitantModel('montee')).toBe(true);
    expect(hasHabitantModel('nacelles')).toBe(false);
    expect(hasHabitantModel('phare')).toBe(true);
  });

  it('ses abords tiennent sous le plafond commun, dans chaque état', () => {
    for (const posed of [false, true])
      for (const open of [false, true]) {
        const f = scenetteSurroundings('hameau', open, posed);
        expect(f.triangles).toBeGreaterThan(0);
        expect(f.triangles).toBeLessThanOrEqual(SURROUNDINGS_MAX);
      }
  });
});

describe('Le budget du 5e, avec le Hameau (plafonds du lot 5, intention du directeur artistique du 20 octobre 2026)', () => {
  // Les plafonds hors scénette, au départ et sur la Carte, lot par lot : ./radeaux5e.test.ts ; le plafond scénette
  // ouverte et la réserve des lots suivants : ./plan5e.test.ts (« Le budget du 5e »).
  it('l’habitant en modèle 3D compte un appel de plus, et ses triangles au plus, à la place du pion', () => {
    // Le décor de la scénette (son plancher et ses abords), à côté du modèle : 1 900 triangles au plus.
    const SETTING_MAX = 1_900;
    const scenette = openWorldCost5e().find((c) => c.poste === 'scénette')!;
    expect(scenette.calls).toBe(2);
    expect(scenette.triangles).toBeGreaterThan(HABITANT_TRIANGLES_5E);
    expect(scenette.triangles).toBeLessThanOrEqual(HABITANT_TRIANGLES_5E + SETTING_MAX);
  });
});
