// La Croisée (GD-22, lot 7) : son modèle par parties (3+1+1), la lanterne de la cordière allumée dès la ruine, une trace
// par mission posée avec sa partie (`row`), la fourche en Y sans croisement, sa scénette, ses abords, son plafond de
// 1 600 triangles et le budget du 5e. Sans Three.js.
import { describe, expect, it } from 'vitest';
import type { BiomeId } from '../../biomes';
import { partShapes } from '../../three/archipeo/constructionParts';
import { PLACE_TRIANGLES_MAX_5E, openWorldCost5e } from './budget';
import { WHOLE, posedTraces, traceStagePosed, type PartShape } from './construction';
import { FOLLOW, followPose } from './camera';
import { CROISEE, CROISEE_CROWN_BOTTOM, CROISEE_MAST_TOP, CROISEE_PLATFORM_Y, CROISEE_SPANS, CROISEE_TOP, CROISEE_TWIN_TREES, ROSELIERES_REED } from './croisee5e';
import type { Facets } from './facets';
import { linearRgb, type Vec2, type Vec3 } from './geometry';
import { HABITANT_TRIANGLES_5E, hasHabitantModel } from './habitants';
import { hasScenette, planFor } from './levelPlan';
import { MONTEE_HEIGHT } from './montee5e';
import { COLORS_5E } from './plan5e';
import { drawPieces, placePieces, type PlacePiece } from './places';
import { placeItems } from './questions';
import { answerObjects, placeTrace, sceneSpot } from './questionScene';
import { scenetteHabitant, scenetteKeo, scenetteOf, scenetteSurroundings } from './scenette';
import { SURROUNDINGS_MAX } from './surroundings';

const PLAN = planFor('5e');
const PLACE = PLAN.places.find((p) => p.id === 'croisee')!;
const MISSIONS = ['pairs', 'choices', 'homophone-sentences', 'participles', 'word-meaning'] as const;

/** Les cinq parties de la Croisée, dans l'ordre de la grille (le corps en trois rangées, le haut, les abords). */
const SHAPES = partShapes(PLACE.island as BiomeId);

/** Les `n` premières parties posées. */
const first = (n: number): PartShape[] => SHAPES.slice(0, n);

/** Une tranche posée prend-elle cette rangée de cette étape ? */
const holds = (parts: readonly PartShape[], stage: number, row: number) => parts.some((p) => p.some((s) => s.stage === stage && row >= s.from - 1e-9 && row < s.to - 1e-9));

/** Ce que le lieu montre, ces parties posées : la ruine qui reste, les rangées posées. */
function shown(parts: readonly PartShape[]): Facets {
  return drawPieces('croisee', (p: PlacePiece) => (p.stage === 'ruine' ? !p.until || !holds(parts, p.until.stage, p.until.row) : holds(parts, p.stage, p.row)));
}

/** Les sommets d'une couleur exacte (la lanterne d'ocre, que la vue dessine sans ombre). */
function countColor(f: Facets, color: number): number {
  const [r, g, b] = linearRgb(color);
  let n = 0;
  for (let i = 0; i < f.colors.length; i += 3) if (Math.abs(f.colors[i] - r) < 1e-4 && Math.abs(f.colors[i + 1] - g) < 1e-4 && Math.abs(f.colors[i + 2] - b) < 1e-4) n++;
  return n;
}

/**
 * Un point du lieu à l'écran d'une tablette (4:3), vu par la caméra de marche qui suit Kéo arrêté en `keo` (repère du
 * lieu) : x vers la droite, y vers le haut, en part de la demi-hauteur de l'écran.
 */
function onScreen(keo: Vec2, p: Vec3): { x: number; y: number } {
  const pose = followPose({ x: keo.x, y: 0, z: keo.z });
  const c = pose.position;
  const f = { x: pose.target.x - c.x, y: pose.target.y - c.y, z: pose.target.z - c.z };
  const fl = Math.hypot(f.x, f.y, f.z);
  const fw = { x: f.x / fl, y: f.y / fl, z: f.z / fl };
  // La caméra regarde vers le nord, sans roulis : la droite est +x, le haut est perpendiculaire au regard.
  const up = { y: -fw.z, z: fw.y };
  const d = { x: p.x - c.x, y: p.y - c.y, z: p.z - c.z };
  const depth = d.x * fw.x + d.y * fw.y + d.z * fw.z;
  const t = Math.tan(((FOLLOW.fov / 2) * Math.PI) / 180);
  return { x: d.x / (depth * t * (4 / 3)), y: (d.y * up.y + d.z * up.z) / (depth * t) };
}

/** Deux segments au sol se coupent-ils (hors de leurs bouts) ? */
function cross(a: Vec2, b: Vec2, c: Vec2, d: Vec2): boolean {
  const o = (p: Vec2, q: Vec2, r: Vec2) => (q.x - p.x) * (r.z - p.z) - (q.z - p.z) * (r.x - p.x);
  return o(a, b, c) * o(a, b, d) < 0 && o(c, d, a) * o(c, d, b) < 0;
}

describe('La Croisée, lieu complet', () => {
  it('ses cinq missions se jouent dans sa scénette, comme à la Montée, au Hameau et aux Radeaux', () => {
    expect(PLACE.scenes).toEqual([...MISSIONS]);
    expect(PLAN.places.filter((p) => hasScenette(p.id)).map((p) => p.id).sort()).toEqual(['croisee', 'hameau', 'montee', 'radeaux']);
  });

  it('cinq parties : le corps en trois rangées, puis le haut, puis les abords (3+1+1)', () => {
    expect(SHAPES).toHaveLength(5);
    expect(SHAPES.map((p) => p.map((s) => [s.stage, Math.round(s.from * 3), Math.round(s.to * 3)]))).toEqual([[[0, 0, 1]], [[0, 1, 2]], [[0, 2, 3]], [[1, 0, 3]], [[2, 0, 3]]]);
    const pieces = placePieces('croisee');
    expect(pieces.filter((p) => p.stage === 0).map((p) => p.row)).toEqual([0, 1 / 3, 2 / 3]);
    for (const stage of [1, 2]) expect(pieces.filter((p) => p.stage === stage).map((p) => p.row), String(stage)).toEqual([0, 0.5]);
  });

  it('la ruine part avec la partie qui la remplace, et chaque partie montre quelque chose de neuf', () => {
    const fallen = placePieces('croisee').filter((p) => p.stage === 'ruine' && p.until).map((p) => [p.until!.stage, Math.round(p.until!.row * 3)]);
    // La cabane grise, son pont et le poteau couché (1 sur 3) ; le toit affaissé, les bottes et les lanternes éteintes
    // (le haut) ; les marches tombées (2 sur 3) ; la moitié de plateforme, ce qui est tombé dessous, les passerelles (3 sur 3).
    expect(fallen).toEqual([
      [0, 0],
      [1, 0],
      [0, 1],
      [0, 2],
      [0, 2],
    ]);
    let before = shown([]);
    for (let n = 1; n <= 5; n++) {
      const now = shown(first(n));
      expect(now.triangles, String(n)).not.toBe(before.triangles);
      before = now;
    }
  });

  it('coûte au plus le plafond d’un lieu du 5e, ruine, parties et traces montrées ensemble ; la ruine seule, 1 200', () => {
    let worst = 0;
    for (let n = 0; n <= 5; n++) {
      const traces = placeTrace('croisee', posedTraces('croisee', first(n), [...MISSIONS])).triangles;
      worst = Math.max(worst, shown(first(n)).triangles + traces);
    }
    expect(worst).toBeLessThanOrEqual(PLACE_TRIANGLES_MAX_5E);
    expect(shown([]).triangles).toBeLessThanOrEqual(1_200);
    // Le plus chargé est le lieu restauré, comme le budget le compte (`modelOfPlace` et toutes les traces).
    expect(shown(SHAPES).triangles + placeTrace('croisee', [...MISSIONS]).triangles).toBe(worst);
  });

  it('une seule lanterne allumée dans la ruine, celle de la cordière ; le haut allume le mât, les abords le rond-point', () => {
    const lit = (n: number) => countColor(shown(first(n)), COLORS_5E.lantern);
    // Une lanterne pendue : sa vitre à six pans, ses six côtés et son dessus.
    expect(lit(0)).toBe(3 * 18);
    for (let n = 1; n <= 3; n++) expect(lit(n), String(n)).toBe(lit(0));
    expect(lit(4)).toBe(lit(3) + 3 * 18);
    // La lanterne du rond-point : un pavé d'ocre sous son chapeau.
    expect(lit(5)).toBe(lit(4) + 3 * 10);
    // Les deux lanternes éteintes de la ruine ont la vitre #BFC4B8, et partent avec le haut.
    expect(countColor(shown([]), 0xbfc4b8)).toBe(2 * 3 * 18);
    expect(countColor(shown(first(4)), 0xbfc4b8)).toBe(0);
  });

  it('le tronc vivant monte au-dessus de sa plateforme dans sa couronne, sous la Montée ; le mât reste sous la couronne', () => {
    expect(CROISEE_TOP).toBeGreaterThan(CROISEE_PLATFORM_Y + 6);
    expect(CROISEE_TOP).toBeLessThan(MONTEE_HEIGHT / 4);
    expect(CROISEE_MAST_TOP).toBeLessThanOrEqual(CROISEE_CROWN_BOTTOM + 0.5);
    // La plateforme est un décor haut : au-dessus de la tête de Kéo (2,6) avec de la marge.
    expect(CROISEE_PLATFORM_Y).toBeGreaterThan(4);
  });

  it('la fourche est un Y : les jumelles partent à un pas l’une de l’autre et s’écartent, la troisième part à l’opposé ; rien ne se croise', () => {
    const [right, left, third] = CROISEE_SPANS;
    expect(Math.hypot(right.from.x - left.from.x, right.from.z - left.from.z)).toBeLessThan(1.2);
    const turn = (s: { from: Vec2; to: Vec2 }) => Math.atan2(s.to.x - s.from.x, s.to.z - s.from.z);
    // De part et d'autre de l'axe de la caméra (le sud), à 45° (retouche 1 du directeur artistique).
    expect(turn(right) * (180 / Math.PI)).toBeCloseTo(45, 6);
    expect(turn(left)).toBeCloseTo(-turn(right), 6);
    expect(third.to.z).toBeLessThan(third.from.z - 6);
    for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) expect(cross(CROISEE_SPANS[i].from, CROISEE_SPANS[i].to, CROISEE_SPANS[j].from, CROISEE_SPANS[j].to), `${i}×${j}`).toBe(false);
  });

  it('les jumelles montent : leurs paliers à 1,5 à 2 au-dessus de la plateforme, sous la canopée de leur palétuvier ; la troisième reste à plat', () => {
    const [right, left, third] = CROISEE_SPANS;
    for (const s of [right, left]) {
      expect(s.from.y).toBeCloseTo(CROISEE_PLATFORM_Y, 6);
      expect(s.to.y - s.from.y).toBeGreaterThanOrEqual(1.5);
      expect(s.to.y - s.from.y).toBeLessThanOrEqual(2);
    }
    expect(third.to.y).toBeCloseTo(third.from.y, 6);
    // La canopée couvre le palier et les mains courantes (0,85 au-dessus du tablier), avec de la marge.
    for (const [i, tree] of CROISEE_TWIN_TREES.entries()) expect(tree.crown, String(i)).toBeGreaterThan(CROISEE_SPANS[i].to.y + 1.1);
  });

  it('de la porte, la caméra de marche voit un Y : chaque jumelle monte d’au moins 15° à l’écran, ses deux bouts dans le cadre', () => {
    const door = { x: 0, z: 7.5 };
    for (const s of CROISEE_SPANS.slice(0, 2)) {
      const a = onScreen(door, s.from);
      const e = onScreen(door, s.to);
      // L'écran fait 4 sur 3 : un pas en x vaut 4/3 d'un pas en y.
      const climb = (Math.atan2(e.y - a.y, Math.abs(e.x - a.x) * (4 / 3)) * 180) / Math.PI;
      expect(climb).toBeGreaterThanOrEqual(15);
      for (const p of [a, e]) {
        expect(Math.abs(p.x)).toBeLessThan(1);
        expect(Math.abs(p.y)).toBeLessThan(1);
      }
    }
  });

  it('le roseau des Roselières : un paille pâle et chaud, loin du bleu-vert de l’eau', () => {
    const [r, , b] = linearRgb(ROSELIERES_REED.reed);
    expect(r).toBeGreaterThan(b * 1.5);
    expect(r).toBeGreaterThan(0.4);
  });
});

describe('Les traces de la Croisée : une par mission, chacune posée avec sa partie (3+1+1)', () => {
  it('la trace de la mission n se montre quand sa mission est réussie et que la partie n est posée', () => {
    expect(MISSIONS.map((m) => [CROISEE.traces[m].stage, CROISEE.traces[m].row])).toEqual([
      [0, 0],
      [0, 1 / 3],
      [0, 2 / 3],
      [1, undefined],
      [2, undefined],
    ]);
    expect(posedTraces('croisee', first(0), [...MISSIONS])).toEqual([]);
    for (let n = 1; n <= 5; n++) expect(posedTraces('croisee', first(n), [...MISSIONS]), String(n)).toEqual(MISSIONS.slice(0, n));
    expect(posedTraces('croisee', [WHOLE], [...MISSIONS])).toEqual([...MISSIONS]);
    // Réussie, mais sa partie attend : rien ; posée, mais pas réussie : rien.
    expect(posedTraces('croisee', first(1), ['choices'])).toEqual([]);
    expect(posedTraces('croisee', first(5), [])).toEqual([]);
    // Comme aux Radeaux, le corps porte les traces dès que la partie de l'une d'elles est posée.
    expect(traceStagePosed('croisee', first(0))).toBe(false);
    expect(traceStagePosed('croisee', first(1))).toBe(true);
  });

  it('le Hameau ne change pas : chaque trace avec son étape entière', () => {
    const hameau = ['gender-equality', 'discrimination', 'solidarity'];
    const upTo = (n: number): PartShape[] => [0, 1, 2].filter((s) => s <= n).map((s) => [{ stage: s as 0 | 1 | 2, from: 0, to: 1 }]);
    expect(posedTraces('hameau', upTo(0), hameau)).toEqual(['gender-equality']);
    expect(posedTraces('hameau', upTo(2), hameau)).toEqual(hameau);
  });

  it('chaque trace se dessine seule, rien sans réussite ; les deux flèches portent deux pictogrammes', () => {
    for (const m of MISSIONS) expect(placeTrace('croisee', [m]).triangles, m).toBeGreaterThan(0);
    expect(placeTrace('croisee', []).triangles).toBe(0);
    // Les fanions, d'un brique sourd, jamais l'ocre de la lanterne.
    expect(countColor(placeTrace('croisee', ['participles']), COLORS_5E.lantern)).toBe(0);
  });
});

describe('La scénette de la Croisée', () => {
  it('la cordière, Kéo à plus de deux unités d’elle, sur le rond-point ; les réponses aux bobines', () => {
    expect(scenetteOf('croisee').role).toBe('La cordière');
    // Aucun nom propre dans le monde ouvert.
    expect(`${scenetteOf('croisee').role} ${scenetteOf('croisee').greeting}`).not.toMatch(/Sema|Sphinx|Malo/);
    const keo = scenetteKeo('croisee').at;
    const h = scenetteHabitant('croisee');
    expect(h.x - keo.x).toBeGreaterThan(2);
    expect(Math.abs(h.y - keo.y)).toBeLessThan(1e-6);
    const s = sceneSpot('croisee');
    expect(s.z - PLACE.center.z).toBeCloseTo(CROISEE.sceneSpot.dz, 6);
    const items = placeItems('croisee', 'french-5e-homophones-choices-1', [{ key: 'a', choices: ['a', 'à'], answer: 'à' }]);
    expect(items[0].placeScene).toEqual({ kind: 'rest' });
  });

  it('une bobine choisie se soulève d’un cran : sa forme ne change pas, sa place si', () => {
    const at = [{ x: 0, y: 0, z: 0 }];
    const still = answerObjects('croisee', at, 1, { picked: [] });
    const picked = answerObjects('croisee', at, 1, { picked: [0] });
    expect(picked.triangles).toBe(still.triangles);
    const top = (f: Facets) => Math.max(...f.positions.filter((_, i) => i % 3 === 1));
    expect(top(picked) - top(still)).toBeGreaterThan(0.15);
  });

  it('la cordière se montre en modèle 3D', () => {
    expect(hasHabitantModel('croisee')).toBe(true);
    expect(hasHabitantModel('instants')).toBe(false);
  });

  it('ses abords tiennent sous le plafond commun, dans chaque état', () => {
    for (const posed of [false, true])
      for (const open of [false, true]) {
        const f = scenetteSurroundings('croisee', open, posed);
        expect(f.triangles).toBeGreaterThan(0);
        expect(f.triangles).toBeLessThanOrEqual(SURROUNDINGS_MAX);
      }
  });
});

/**
 * Le budget du 5e au lot 6, avant la Croisée (les Radeaux, le Creux et le pied des palétuviers de loin compris : `npm run
 * rendu:budget -- --archipel 6e,5e`, 20 octobre 2026), scénette ouverte. Hors scénette, au départ et sur la Carte :
 * ./radeaux5e.test.ts (un lieu de plus par lieu fini depuis le lot 5).
 */
const LOT6_OPEN_5E = { triangles: 95_276, calls: 19 } as const;

describe('Le budget du 5e, avec la Croisée (plafonds du lot 7, intention du directeur artistique du 20 octobre 2026)', () => {
  it('scénette ouverte : le lot 6 et un lieu de plus au plus, sans appel de plus ; la cordière en modèle 3D dans les deux appels de la scénette', () => {
    const cost = openWorldCost5e();
    const triangles = cost.reduce((a, p) => a + p.triangles, 0);
    const calls = cost.reduce((a, p) => a + p.calls, 0);
    expect(triangles).toBeLessThanOrEqual(LOT6_OPEN_5E.triangles + PLACE_TRIANGLES_MAX_5E);
    expect(calls).toBeLessThanOrEqual(LOT6_OPEN_5E.calls);
    const scenette = cost.find((c) => c.poste === 'scénette')!;
    expect(scenette.calls).toBe(2);
    expect(scenette.triangles).toBeLessThanOrEqual(HABITANT_TRIANGLES_5E + 1_900);
  });
});
