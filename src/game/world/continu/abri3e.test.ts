// L'Abri (le Versant du 3e, GD-25) : le lieu par parties (2 + 1 + 1, d'après les quatre missions de son île), une seule
// lanterne allumée dans la ruine, trois restauré ; une trace par mission avec sa partie ; le bronze aux seules ferrures ;
// rien sur le chemin de marche ; la vue d'arrivée au nord-nord-ouest ; la scénette de la météorologue ; les plafonds de
// 1 600 et 1 200 triangles. Sans Three.js.
import { describe, expect, it } from 'vitest';
import type { BiomeId } from '../../biomes';
import { partShapes, stagePoseWords } from '../../three/archipeo/constructionParts';
import { phraseDeLaPose } from '../../poseWords';
import { partiesDe } from '../parts';
import { plansFor } from '../plans';
import { PLACE_RUIN_TRIANGLES_MAX_3E, PLACE_TRIANGLES_MAX_3E } from './budget';
import { ABRI, ABRI_LAYOUT } from './abri3e';
import { ABRI_SURROUNDINGS } from './abriSurroundings';
import { posedTraces, type PartShape, type Stage } from './construction';
import { FacetBuilder, boundsOf, type Facets } from './facets';
import { distance, distanceToPolyline, linearRgb } from './geometry';
import { hasHabitantModel } from './habitants';
import { hasScenette, planFor } from './levelPlan';
import { doorFrameOf, doorViewOf } from './northShore';
import { C3E } from './place3eKit';
import { BUILT_PLACES_3E, PATH_NODES_3E } from './plan3e';
import { drawPieces, placePieces } from './places';
import { placeTrace } from './questionScene';
import { RUINS_3E } from './ruins3e';
import { scenetteOf } from './scenette';
import { SURROUNDINGS, SURROUNDINGS_MAX } from './surroundings';
import { standingHeight } from './terrain';
import { heightAt3e } from './terrain3e';

const PLAN = planFor('3e');
const PLACE = PLAN.places.find((p) => p.id === 'abri')!;
const SHAPES = partShapes(PLACE.island as BiomeId);
const MISSIONS = [...BUILT_PLACES_3E.abri];

const upTo = (n: number): PartShape[] => SHAPES.slice(0, n);
const takes = (parts: readonly PartShape[], stage: Stage, row: number) => parts.some((part) => part.some((s) => s.stage === stage && row >= s.from - 1e-9 && row < s.to - 1e-9));

function shown(n: number): Facets {
  const parts = upTo(n);
  return drawPieces('abri', (p) => (p.stage === 'ruine' ? !p.until || !takes(parts, p.until.stage, p.until.row) : takes(parts, p.stage, p.row)));
}

function countColor(f: Facets, color: number): number {
  const [r, g, b] = linearRgb(color);
  let n = 0;
  for (let i = 0; i < f.colors.length; i += 3) if (Math.abs(f.colors[i] - r) < 1e-4 && Math.abs(f.colors[i + 1] - g) < 1e-4 && Math.abs(f.colors[i + 2] - b) < 1e-4) n++;
  return n;
}

const ground = (x: number, z: number) => standingHeight(heightAt3e({ x, z }));
const nodes = new Map(PATH_NODES_3E.map((n) => [n.id, n.at]));
const traces = (n: number) => placeTrace('abri', posedTraces('abri', upTo(n), MISSIONS));

/**
 * Les noms du titre d'un plan (« Le toit de la réserve » : toit, réserve), sans ses articles ni ses prépositions, moins
 * « abords », le nom de l'étape que le bilan dit à chaque lieu (« les abords de l'Abri »).
 */
const planNouns = (name: string) =>
  name
    .toLowerCase()
    .split(/[\s’']+/)
    .filter((w) => w.length > 2 && !['les', 'des', 'aux', 'abords'].includes(w));
/** Un mot entier, au singulier ou au pluriel, quelle que soit sa casse. */
const wordRe = (w: string) => new RegExp(`(?<!\\p{L})${w}s?(?!\\p{L})`, 'iu');

describe('L’Abri, lieu complet', () => {
  it('ses quatre missions se jouent dans sa scénette, en quatre parties : le corps en deux, le haut, les abords', () => {
    expect(PLACE.scenes).toEqual(MISSIONS);
    expect(MISSIONS).toEqual(['mean', 'probability', 'data', 'ratio-sharing']);
    expect(hasScenette('abri')).toBe(true);
    // Aucun modèle d'habitant du 3e encore : la météorologue est en pion.
    expect(hasHabitantModel('abri')).toBe(false);
    expect(SHAPES.map((p) => p.map((s) => [s.stage, s.from, s.to]))).toEqual([[[0, 0, 0.5]], [[0, 0.5, 1]], [[1, 0, 1]], [[2, 0, 1]]]);
    expect(Object.hasOwn(RUINS_3E, 'abri')).toBe(false);
  });

  it('chaque partie pose quelque chose ; la ruine part avec la partie qui la remplace', () => {
    for (let n = 1; n <= 4; n++) expect(shown(n).triangles, String(n)).not.toBe(shown(n - 1).triangles);
    const ruin = placePieces('abri').filter((p) => p.stage === 'ruine');
    const fallen = ruin.filter((p) => p.until).map((p) => `${p.until!.stage}/${p.until!.row}`);
    expect(new Set(fallen)).toEqual(new Set(['0/0', '0/0.5', '1/0', '2/0']));
    expect(ruin.filter((p) => !p.until)).toHaveLength(1);
  });

  it('coûte au plus 1 600 triangles à son état le plus chargé, traces comprises ; la ruine, 1 200 au plus', () => {
    let worst = 0;
    for (let n = 0; n <= 4; n++) worst = Math.max(worst, shown(n).triangles + traces(n).triangles);
    expect(worst).toBeLessThanOrEqual(PLACE_TRIANGLES_MAX_3E);
    expect(shown(0).triangles).toBeLessThanOrEqual(PLACE_RUIN_TRIANGLES_MAX_3E);
    expect(ABRI.reach).toBeUndefined();
  });

  it('une seule lanterne allumée dans la ruine, celle de la météorologue ; une de plus au haut, une aux abords ; toutes d’ocre', () => {
    const lit = (n: number) => countColor(shown(n), C3E.lantern);
    expect([0, 1, 2, 3, 4].map(lit)).toEqual([30, 30, 30, 60, 90]);
    expect(C3E.lantern).toBe(0xe0a84a);
  });

  it('le bronze aux seules ferrures : les chapeaux des lanternes, rien d’autre', () => {
    // Un chapeau de lanterne : une pointe à quatre pans (douze sommets).
    expect(countColor(shown(0), C3E.bronze)).toBe(12);
    expect(countColor(shown(4), C3E.bronze)).toBe(3 * 12);
  });

  it('cinq pluviomètres en rang ; trois manches à air au mât, sans bras ; la roue à l’ouest, la table de relevés à l’est', () => {
    expect(ABRI_LAYOUT.gauges.xs).toHaveLength(5);
    expect(ABRI_LAYOUT.mast.socks).toHaveLength(3);
    expect(ABRI_LAYOUT.drum.x).toBeLessThan(0);
    expect(ABRI_LAYOUT.table.x).toBeGreaterThan(0);
    // L'ouverture du muret au sud, du côté de la porte ; la porte hors du muret.
    expect(ABRI_LAYOUT.wall.gate[0]).toBeLessThan(ABRI_LAYOUT.door.x);
    expect(ABRI_LAYOUT.wall.gate[1]).toBeGreaterThan(ABRI_LAYOUT.door.x);
    expect(ABRI_LAYOUT.door.z).toBeGreaterThan(ABRI_LAYOUT.wall.z1);
  });

  it('les boules de la roue toutes du même bois : une couleur ne dit jamais une chance', () => {
    const balls = countColor(shown(4), ABRI_LAYOUT.colors.ball);
    expect(balls).toBeGreaterThan(0);
    expect(balls % 3).toBe(0);
  });

  it('une trace par mission, posée avec sa partie', () => {
    const count = (n: number) => posedTraces('abri', upTo(n), MISSIONS).length;
    expect([0, 1, 2, 3, 4].map(count)).toEqual([0, 1, 2, 3, 4]);
    for (const m of MISSIONS) expect(ABRI.traces[m], m).toBeDefined();
  });

  it('un lieu bas : le haut du mât à 5,6 au plus au-dessus du sol', () => {
    expect(boundsOf(shown(4)).max[1]).toBeLessThanOrEqual(5.6);
  });

  it('rien du lieu, en ruine comme restauré, sur le chemin de marche, de part et d’autre de la porte (à hauteur de Kéo)', () => {
    const door = nodes.get('abri')!;
    const ways = [nodes.get('ve-5')!];
    const h0 = ground(PLACE.center.x, PLACE.center.z);
    const sets: [Facets, boolean][] = [
      [shown(0), true],
      [shown(4), true],
      [traces(4), false],
    ];
    for (const [f, local] of sets) {
      for (let i = 0; i < f.positions.length; i += 9) {
        const x = (f.positions[i] + f.positions[i + 3] + f.positions[i + 6]) / 3 + (local ? PLACE.center.x : 0);
        const z = (f.positions[i + 2] + f.positions[i + 5] + f.positions[i + 8]) / 3 + (local ? PLACE.center.z : 0);
        const y = Math.min(f.positions[i + 1], f.positions[i + 4], f.positions[i + 7]) + (local ? h0 : 0);
        const low = y - ground(x, z) < 1.8;
        for (const way of ways) expect(low && distanceToPolyline({ x, z }, [door, way]) < 0.9, `${x.toFixed(1)}, ${z.toFixed(1)}`).toBe(false);
      }
    }
  });
});

describe('Le bilan de l’Abri', () => {
  it('nomme la partie par son étape, puis dit la phrase du lieu ; jamais un nom du contenu ni un mot de peur', () => {
    const island = PLACE.island as BiomeId;
    const words = stagePoseWords(island, PLACE);
    const parties = partiesDe(island);
    expect(parties).toHaveLength(4);
    const said = [0, 1, 2, 3].map((k) => phraseDeLaPose({ posees: [parties[k]], plansFinis: [] }, words));
    // « Abri » est le nom du lieu ; « abri », jamais en nom commun (relecture des lieux, point 13).
    for (const s of said) expect(s).not.toMatch(/Gardien|Stat|abri/);
    const s = scenetteOf(PLACE.id);
    const texts = [...said, ...(s.words?.pose ?? []), s.words?.end ?? ''];
    for (const plan of plansFor(island))
      for (const text of texts) {
        expect(text).not.toContain(plan.done);
        for (const noun of planNouns(plan.name)) expect(text, noun).not.toMatch(wordRe(noun));
      }
    // Les phrases du lieu ne disent pas non plus « abords ».
    for (const text of [...(s.words?.pose ?? []), s.words?.end ?? '']) expect(text).not.toMatch(wordRe('abords'));
    for (const text of texts) expect(text).not.toMatch(/vide|chute|tomb|vertige|phare/i);
    expect(s.words?.pose).toEqual(['Les persiennes sont remises.', 'Les instruments sont en rang.', 'Le mât est relevé.', 'Le muret est refait.']);
    expect(s.words?.end).toBe('Ici, matin et soir, on regardait le ciel pour savoir le temps du lendemain.');
    for (const text of texts) expect(text).not.toMatch(/(?<!\p{L})abri/u);
  });
});

describe('La scénette de l’Abri', () => {
  it('la météorologue, sans prénom, et sa phrase de métier', () => {
    const s = scenetteOf('abri');
    expect(s.role).toBe('La météorologue');
    expect(s.greeting).toBe('La météorologue observe le temps qu’il fait.');
  });

  it('la caméra arrive par la porte, basse, au nord-nord-ouest (342°) : l’abri à persiennes au milieu du cadre', () => {
    const door = nodes.get('abri')!;
    const yaw = doorViewOf('abri');
    const look = { x: -Math.sin(yaw), z: -Math.cos(yaw) };
    const cap = ((Math.atan2(look.x, -look.z) * 180) / Math.PI + 360) % 360;
    expect(cap).toBeCloseTo(342, 6);
    const d = { x: PLACE.center.x - door.x, z: PLACE.center.z - door.z };
    const off = Math.atan2(look.x * d.z - look.z * d.x, look.x * d.x + look.z * d.z);
    expect(Math.abs((off * 180) / Math.PI)).toBeLessThan(15);
    const frame = doorFrameOf('abri')!;
    expect(frame.height).toBeLessThan(0);
    expect(frame.back).toBeLessThanOrEqual(1.6);
  });

  it('elle se joue devant l’abri, hors du chemin, loin de la porte du lieu ; ses abords sont enregistrés', () => {
    const s = ABRI_LAYOUT.scene;
    const door = nodes.get('abri')!;
    for (const [sx, sz] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ]) {
      const p = {
        x: PLACE.center.x + s.dx + sx * s.half[0],
        z: PLACE.center.z + s.dz + sz * s.half[1],
      };
      for (const way of ['ve-5']) expect(distanceToPolyline(p, [door, nodes.get(way)!])).toBeGreaterThan(1.5);
    }
    expect(distance({ x: PLACE.center.x + s.dx, z: PLACE.center.z + s.dz }, door)).toBeGreaterThan(3);
    expect(SURROUNDINGS.abri).toBeDefined();
    const b = new FacetBuilder();
    SURROUNDINGS.abri!(b, { x: PLACE.center.x + s.dx, y: 0, z: PLACE.center.z + s.dz }, { posed: true } as never);
    expect(b.build().triangles).toBeLessThanOrEqual(SURROUNDINGS_MAX);
    expect(ABRI_SURROUNDINGS.rocks.length).toBeGreaterThan(0);
  });
});
