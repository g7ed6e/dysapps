// Les Terrasses (GD-22, lot 11) : leur modèle par étapes, la lanterne du riziculteur allumée dès la ruine, une trace par
// étape, les trois gradins et leurs vannes, la roue tombée de la ruine, la scénette, les abords et le plafond d'un lieu du
// 5e. Sans Three.js.
import { describe, expect, it } from 'vitest';
import { PLACE_TRIANGLES_MAX_5E } from './budget';
import { WHOLE, posedTraces, traceStagePosed, type PartShape, type Stage } from './construction';
import type { Facets } from './facets';
import { linearRgb } from './geometry';
import { hasHabitantModel } from './habitants';
import { hasScenette, planFor } from './levelPlan';
import { MONTEE_HEIGHT } from './montee5e';
import { drawPieces, placePieces } from './places';
import { COLORS_5E, PATH_EDGES_5E, PATH_NODES_5E } from './plan5e';
import { placeItems } from './questions';
import { answerObjects, placeTrace, sceneSpot } from './questionScene';
import { scenetteHabitant, scenetteKeo, scenetteOf, scenetteSurroundings } from './scenette';
import { SURROUNDINGS_MAX } from './surroundings';
import { SACKS, TERRASSES, TERRASSES_COLORS, TERRASSES_LAYOUT, TERRASSES_MAST_TOP, TERRASSES_RICE, TERRASSES_TOP, TERRASSES_WHEEL, fallenArcs } from './terrasses5e';

const PLAN = planFor('5e');
const PLACE = PLAN.places.find((p) => p.id === 'terrasses')!;
const MISSIONS = ['population', 'resources', 'risks'] as const;

/** Les parties posées jusqu'à l'étape `n` comprise (−1 : la ruine). */
const upTo = (n: number): PartShape[] => [0, 1, 2].filter((s) => s <= n).map((s) => [{ stage: s as Stage, from: 0, to: 1 }]);

/** Ce que le lieu montre, ses parties posées jusqu'à `n` : la ruine qui reste, les étapes posées. */
function shown(n: number): Facets {
  const parts = upTo(n);
  const posed = (stage: Stage) => parts.some((p) => p.some((s) => s.stage === stage));
  return drawPieces('terrasses', (p) => (p.stage === 'ruine' ? !p.until || !posed(p.until.stage) : posed(p.stage)));
}

/** Les sommets d'une couleur exacte (la lanterne d'ocre, que la vue dessine sans ombre). */
function countColor(f: Facets, color: number): number {
  const [r, g, b] = linearRgb(color);
  let n = 0;
  for (let i = 0; i < f.colors.length; i += 3) if (Math.abs(f.colors[i] - r) < 1e-4 && Math.abs(f.colors[i + 1] - g) < 1e-4 && Math.abs(f.colors[i + 2] - b) < 1e-4) n++;
  return n;
}

describe('Les Terrasses, lieu complet', () => {
  it('leurs trois missions se jouent dans leur scénette', () => {
    expect(PLACE.scenes).toEqual([...MISSIONS]);
    expect(hasScenette('terrasses')).toBe(true);
  });

  it('se rebâtissent en trois étapes, chacune en deux temps ; la ruine part avec l’étape qui la remplace', () => {
    const pieces = placePieces('terrasses');
    for (const stage of [0, 1, 2]) expect(pieces.filter((p) => p.stage === stage).map((p) => p.row), String(stage)).toEqual([0, 0.5]);
    const fallen = pieces.filter((p) => p.stage === 'ruine' && p.until).map((p) => p.until!.stage);
    // Le corps relève les murets, l'eau, la roue tombée, le moulin ouvert et le pan de chaume resté sur ses murs ; le haut,
    // le pan tombé et l'aqueduc tombé ; les abords, la cour.
    expect(fallen).toEqual([0, 0, 0, 0, 0, 1, 1, 2]);
  });

  it('coûtent au plus le plafond d’un lieu du 5e, et 1 450 triangles, à leur état le plus chargé', () => {
    let worst = 0;
    for (let n = -1; n <= 2; n++) {
      const traces = placeTrace('terrasses', posedTraces('terrasses', upTo(n), [...MISSIONS])).triangles;
      worst = Math.max(worst, shown(n).triangles + traces);
    }
    expect(worst).toBeLessThanOrEqual(PLACE_TRIANGLES_MAX_5E);
    // Le plafond du directeur artistique pour ce lieu (lot9/da-propositions-9-10-11.md).
    expect(worst).toBeLessThanOrEqual(1_450);
    expect(shown(2).triangles + placeTrace('terrasses', [...MISSIONS]).triangles).toBe(worst);
    // La ruine reste sobre : bien moins que le lieu restauré.
    expect(shown(-1).triangles).toBeLessThanOrEqual(1_100);
  });

  it('la lanterne du riziculteur brille dès la ruine, seule ; le haut allume le mât, les abords la cour', () => {
    const lit = (n: number) => countColor(shown(n), COLORS_5E.lantern);
    // Une lanterne : sa vitre à six pans, ses six côtés et son dessus.
    expect(lit(-1)).toBe(3 * 18);
    expect(lit(0)).toBe(lit(-1));
    expect(lit(1)).toBe(lit(0) + 3 * 18);
    expect(lit(2)).toBe(lit(1) + 3 * 18);
  });

  it('trois gradins nets de 1,3, sous la roue et le moulin ; la vanne dans le muret ; le mât sous la Montée', () => {
    expect(TERRASSES_LAYOUT.terrace.step).toBeCloseTo(1.3, 6);
    expect(TERRASSES_TOP).toBeCloseTo(3 * 1.3, 6);
    expect(TERRASSES_LAYOUT.vanneX).toBeGreaterThan(TERRASSES_LAYOUT.terrace.x0);
    expect(TERRASSES_LAYOUT.vanneX).toBeLessThan(TERRASSES_LAYOUT.terrace.x1);
    // Le moulin à l'est des gradins, l'aqueduc entre les deux.
    expect(TERRASSES_LAYOUT.mill.x0).toBeGreaterThan(TERRASSES_LAYOUT.terrace.x1);
    expect(TERRASSES_WHEEL.spokes).toBe(6);
    // La roue tourne devant le mur sud du moulin, où sa trace reste quand elle est tombée.
    expect(TERRASSES_WHEEL.hub.z).toBeGreaterThan(TERRASSES_WHEEL.hole.z);
    expect(TERRASSES_WHEEL.hub.z - TERRASSES_WHEEL.hole.z).toBeLessThan(0.5);
    expect(TERRASSES_MAST_TOP).toBeLessThan(MONTEE_HEIGHT / 5);
  });

  it('le chemin arrive à la porte par le bord sud de la cour, sans la traverser', () => {
    const K = TERRASSES_LAYOUT.court;
    const at = new Map(PATH_NODES_5E.map((n) => [n.id, n.at]));
    const door = at.get('terrasses')!;
    const edges = PATH_EDGES_5E.filter(([a, b]) => a === 'terrasses' || b === 'terrasses' || a === 'ter-1' || b === 'ter-1');
    expect(edges.length).toBeGreaterThanOrEqual(2);
    for (const [a, b] of edges) {
      const p = at.get(a)!,
        q = at.get(b)!;
      for (let k = 0; k <= 100; k++) {
        const x = p.x + ((q.x - p.x) * k) / 100 - PLACE.center.x,
          z = p.z + ((q.z - p.z) * k) / 100 - PLACE.center.z;
        // Le milieu du ruban reste hors de la cour, à une demi-largeur près (il longe son bord sud) ; seule la porte la touche.
        if (Math.hypot(x + PLACE.center.x - door.x, z + PLACE.center.z - door.z) < 2) continue;
        expect(x > K.x0 - 0.5 && x < K.x1 + 0.5 && z > K.z0 - 0.5 && z < K.z1 + 0.5, `${a}-${b} ${x.toFixed(1)} ${z.toFixed(1)}`).toBe(false);
      }
    }
    expect(door.z - PLACE.center.z).toBeGreaterThanOrEqual(K.z1);
  });

  it('après le corps, l’eau se voit : le muret dépasse de 0,15 la terre du gradin, l’eau juste sous lui ; son dessus plus sombre que l’eau', () => {
    const T = TERRASSES_LAYOUT.terrace;
    expect(T.rim).toBeCloseTo(0.15, 6);
    expect(T.water).toBeGreaterThan(0);
    expect(T.water).toBeLessThan(T.rim);
    const lum = (c: number) => {
      const [r, g, b] = linearRgb(c);
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    expect(lum(TERRASSES_COLORS.wallTop)).toBeLessThan(lum(TERRASSES_COLORS.water));
    // Restaurées, le reflet doré se montre ; dans la ruine, jamais.
    expect(countColor(shown(0), 0xc9c08f)).toBeGreaterThan(0);
    expect(countColor(shown(-1), 0xc9c08f)).toBe(0);
  });

  it('le riz restauré : deux rangs égaux par gradin, bas, le premier à 0,9 au moins derrière le muret, une bande d’eau devant', () => {
    const R = TERRASSES_RICE;
    const T = TERRASSES_LAYOUT.terrace;
    expect(R.rows).toBe(2);
    expect(R.h).toBeCloseTo(0.28, 6);
    expect(R.half).toBeCloseTo(0.12, 6);
    expect(R.behind).toBeGreaterThanOrEqual(0.9);
    // Le dernier rang tient dans le gradin du haut, devant son muret du fond.
    expect(T.wall + R.behind + 2 * R.half + (R.rows - 1) * R.gap).toBeLessThan(T.depth - T.wall);
  });

  it('la roue tombée : trois arcs de jante à leur vrai rayon, de bois usé clair sur un fond plus sombre, jamais croisés ; un penché contre le mur', () => {
    const arcs = fallenArcs();
    expect(arcs).toHaveLength(3);
    const r = (TERRASSES_WHEEL.radius + 1.36) / 2;
    // La flèche de chaque arc dit son rayon : celui de la jante.
    for (const [a, m, c] of arcs) {
      const chord = Math.hypot(c.x - a.x, c.y - a.y, c.z - a.z);
      const mid = { x: (a.x + c.x) / 2, y: (a.y + c.y) / 2, z: (a.z + c.z) / 2 };
      const sag = Math.hypot(m.x - mid.x, m.y - mid.y, m.z - mid.z);
      expect((chord * chord) / (8 * sag) + sag / 2).toBeCloseTo(r, 2);
    }
    // Le premier se dresse, penché vers le mur (le nord), sans le traverser ; les autres sont à plat.
    const top = Math.max(...arcs[0].map((p) => p.y));
    expect(top).toBeGreaterThan(1);
    for (const p of arcs[0]) expect(p.z).toBeGreaterThan(TERRASSES_LAYOUT.mill.z1 + 0.09);
    for (const arc of arcs.slice(1)) for (const p of arc) expect(p.y).toBeLessThan(0.3);
    // Jamais croisés : de l'un à l'autre, plus que la largeur d'un arc.
    const seg = (a: { x: number; z: number }, b: { x: number; z: number }, k: number) => ({ x: a.x + (b.x - a.x) * k, z: a.z + (b.z - a.z) * k });
    const samples = (arc: { x: number; y: number; z: number }[]) => arc.slice(0, 2).flatMap((p, i) => Array.from({ length: 11 }, (_, k) => seg(p, arc[i + 1], k / 10)));
    for (let i = 1; i < 3; i++)
      for (let j = i + 1; j < 3; j++) for (const p of samples(arcs[i])) for (const q of samples(arcs[j])) expect(Math.hypot(p.x - q.x, p.z - q.z)).toBeGreaterThan(0.2);
    // Dans la fosse.
    const P = TERRASSES_LAYOUT.pit;
    for (const arc of arcs) for (const p of arc) expect(p.x > P.x0 && p.x < P.x1 && p.z > P.z0 && p.z < P.z1).toBe(true);
    expect(lumOf(TERRASSES_COLORS.wornWood)).toBeGreaterThan(lumOf(TERRASSES_COLORS.pitFloor) * 1.5);
  });
});

const lumOf = (c: number) => {
  const [r, g, b] = linearRgb(c);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrastOf = (a: number, b: number) => (Math.max(lumOf(a), lumOf(b)) + 0.05) / (Math.min(lumOf(a), lumOf(b)) + 0.05);

describe('Les traces des Terrasses : une par mission, chacune portée par son étape', () => {
  it('la trace de la mission n se montre quand sa mission est réussie et que l’étape n est posée', () => {
    expect(TERRASSES.traces.population.stage).toBe(0);
    expect(TERRASSES.traces.resources.stage).toBe(1);
    expect(TERRASSES.traces.risks.stage).toBe(2);
    expect(posedTraces('terrasses', upTo(-1), [...MISSIONS])).toEqual([]);
    expect(posedTraces('terrasses', upTo(0), [...MISSIONS])).toEqual(['population']);
    expect(posedTraces('terrasses', upTo(1), [...MISSIONS])).toEqual(['population', 'resources']);
    expect(posedTraces('terrasses', [WHOLE], [...MISSIONS])).toEqual([...MISSIONS]);
    expect(posedTraces('terrasses', upTo(0), ['risks'])).toEqual([]);
    expect(traceStagePosed('terrasses', upTo(0))).toBe(true);
    expect(traceStagePosed('terrasses', upTo(-1))).toBe(false);
  });

  it('chaque trace se dessine seule, rien sans réussite ; la réserve compte cinq sacs ventrus, le col noué', () => {
    for (const m of MISSIONS) expect(placeTrace('terrasses', [m]).triangles, m).toBeGreaterThan(0);
    expect(placeTrace('terrasses', []).triangles).toBe(0);
    expect(SACKS).toBe(5);
    // Cinq pans : un ventre en deux bandes, un col, un nœud en touffe (trente-cinq triangles chacun, jamais un cône).
    expect(placeTrace('terrasses', ['risks']).triangles).toBe(SACKS * 35);
  });
});

describe('La scénette des Terrasses', () => {
  it('le riziculteur, Kéo à plus de deux unités de lui ; les réponses se posent au repos', () => {
    expect(scenetteOf('terrasses').role).toBe('Le riziculteur');
    const keo = scenetteKeo('terrasses').at;
    const h = scenetteHabitant('terrasses');
    expect(Math.hypot(h.x - keo.x, h.z - keo.z)).toBeGreaterThan(2);
    const s = sceneSpot('terrasses');
    expect(s.x - PLACE.center.x).toBeCloseTo(TERRASSES.sceneSpot.dx, 6);
    expect(s.z - PLACE.center.z).toBeCloseTo(TERRASSES.sceneSpot.dz, 6);
    const items = placeItems('terrasses', 'geography-5e-resources-1', [{ key: 'a', choices: ['oui', 'non'], answer: 'oui' }]);
    expect(items[0].placeScene).toEqual({ kind: 'rest' });
  });

  it('un bol choisi se soulève d’un cran : sa forme ne change pas, sa place si', () => {
    const at = [{ x: 0, y: 0, z: 0 }];
    const still = answerObjects('terrasses', at, 1, { picked: [] });
    const picked = answerObjects('terrasses', at, 1, { picked: [0] });
    expect(picked.triangles).toBe(still.triangles);
    const top = (f: Facets) => Math.max(...f.positions.filter((_, i) => i % 3 === 1));
    expect(top(picked) - top(still)).toBeGreaterThan(0.15);
  });

  it('les bols se détachent du banc (3:1 au moins), leur riz blanc du bol ; le choix se lit à la hauteur', () => {
    expect(contrastOf(TERRASSES_COLORS.bowl, TERRASSES_COLORS.benchTop)).toBeGreaterThanOrEqual(3);
    expect(contrastOf(TERRASSES_COLORS.bowl, TERRASSES_COLORS.benchSide)).toBeGreaterThanOrEqual(2);
    expect(contrastOf(TERRASSES_COLORS.rice, TERRASSES_COLORS.bowl)).toBeGreaterThanOrEqual(3);
  });

  it('le riziculteur se montre en modèle 3D', () => {
    expect(hasHabitantModel('terrasses')).toBe(true);
  });

  it('ses abords tiennent sous le plafond commun, dans chaque état', () => {
    for (const posed of [false, true])
      for (const open of [false, true]) {
        const f = scenetteSurroundings('terrasses', open, posed);
        expect(f.triangles).toBeGreaterThan(0);
        expect(f.triangles).toBeLessThanOrEqual(SURROUNDINGS_MAX);
      }
  });
});
