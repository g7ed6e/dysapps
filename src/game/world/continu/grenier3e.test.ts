// Le Grenier (le Versant du 3e, GD-25, lieu du monde ouvert seulement) : le lieu par parties (3 + 1 + 1, d'après les
// cinq missions de son île), une seule lanterne allumée dans la ruine, trois restauré ; une trace par mission avec sa
// partie ; le bronze aux seules ferrures ; rien sur le chemin de marche ; la vue d'arrivée au nord-nord-est ; la scénette
// du meunier ; les plafonds de 1 600 et 1 200 triangles. Sans Three.js.
import { describe, expect, it } from 'vitest';
import type { BiomeId } from '../../biomes';
import { partShapes, stagePoseWords } from '../../three/archipeo/constructionParts';
import { phraseDeLaPose } from '../../poseWords';
import { partiesDe } from '../parts';
import { plansFor } from '../plans';
import { PLACE_RUIN_TRIANGLES_MAX_3E, PLACE_TRIANGLES_MAX_3E } from './budget';
import { FALLEN_SLATES, GRENIER, GRENIER_LAYOUT } from './grenier3e';
import { GRENIER_SURROUNDINGS } from './grenierSurroundings';
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
import { scenetteOf } from './scenette';
import { SURROUNDINGS, SURROUNDINGS_MAX } from './surroundings';
import { standingHeight } from './terrain';
import { heightAt3e } from './terrain3e';

const PLAN = planFor('3e');
const PLACE = PLAN.places.find((p) => p.id === 'grenier')!;
const SHAPES = partShapes(PLACE.island as BiomeId);
const MISSIONS = [...BUILT_PLACES_3E.grenier];

const upTo = (n: number): PartShape[] => SHAPES.slice(0, n);
const takes = (parts: readonly PartShape[], stage: Stage, row: number) => parts.some((part) => part.some((s) => s.stage === stage && row >= s.from - 1e-9 && row < s.to - 1e-9));

function shown(n: number): Facets {
  const parts = upTo(n);
  return drawPieces('grenier', (p) => (p.stage === 'ruine' ? !p.until || !takes(parts, p.until.stage, p.until.row) : takes(parts, p.stage, p.row)));
}

function countColor(f: Facets, color: number): number {
  const [r, g, b] = linearRgb(color);
  let n = 0;
  for (let i = 0; i < f.colors.length; i += 3) if (Math.abs(f.colors[i] - r) < 1e-4 && Math.abs(f.colors[i + 1] - g) < 1e-4 && Math.abs(f.colors[i + 2] - b) < 1e-4) n++;
  return n;
}

const ground = (x: number, z: number) => standingHeight(heightAt3e({ x, z }));
const nodes = new Map(PATH_NODES_3E.map((n) => [n.id, n.at]));
const traces = (n: number) => placeTrace('grenier', posedTraces('grenier', upTo(n), MISSIONS));

/**
 * Les noms du titre d'un plan (« Le toit de la réserve » : toit, réserve), sans ses articles ni ses prépositions, moins
 * « abords », le nom de l'étape que le bilan dit à chaque lieu (« les abords du Grenier »).
 */
const planNouns = (name: string) =>
  name
    .toLowerCase()
    .split(/[\s’']+/)
    .filter((w) => w.length > 2 && !['les', 'des', 'aux', 'abords'].includes(w));
/** Un mot entier, au singulier ou au pluriel, quelle que soit sa casse. */
const wordRe = (w: string) => new RegExp(`(?<!\\p{L})${w}s?(?!\\p{L})`, 'iu');

describe('Le Grenier, lieu complet', () => {
  it('ses cinq missions se jouent dans sa scénette, en cinq parties : le corps en trois, le haut, les abords', () => {
    expect(PLACE.scenes).toEqual(MISSIONS);
    expect(MISSIONS).toEqual(['power-rules', 'square-equations', 'prime-factors', 'identities', 'zero-product']);
    expect(hasScenette('grenier')).toBe(true);
    // Aucun modèle d'habitant du 3e encore : le meunier est en pion.
    expect(hasHabitantModel('grenier')).toBe(false);
    expect(SHAPES.map((p) => p.map((s) => [s.stage, s.from, s.to]))).toEqual([[[0, 0, 1 / 3]], [[0, 1 / 3, 2 / 3]], [[0, 2 / 3, 1]], [[1, 0, 1]], [[2, 0, 1]]]);
  });

  it('chaque partie pose quelque chose ; la ruine part avec la partie qui la remplace', () => {
    for (let n = 1; n <= 5; n++) expect(shown(n).triangles, String(n)).not.toBe(shown(n - 1).triangles);
    const ruin = placePieces('grenier').filter((p) => p.stage === 'ruine');
    const fallen = ruin.filter((p) => p.until).map((p) => `${p.until!.stage}/${p.until!.row}`);
    expect(new Set(fallen)).toEqual(new Set(['0/0', `0/${1 / 3}`, `0/${2 / 3}`, '1/0', '2/0']));
    expect(ruin.filter((p) => !p.until)).toHaveLength(1);
  });

  it('coûte au plus 1 600 triangles à son état le plus chargé, traces comprises ; la ruine, 1 200 au plus', () => {
    let worst = 0;
    for (let n = 0; n <= 5; n++) worst = Math.max(worst, shown(n).triangles + traces(n).triangles);
    expect(worst).toBeLessThanOrEqual(PLACE_TRIANGLES_MAX_3E);
    expect(shown(0).triangles).toBeLessThanOrEqual(PLACE_RUIN_TRIANGLES_MAX_3E);
    expect(GRENIER.reach).toBeUndefined();
  });

  it('une seule lanterne allumée dans la ruine, celle du meunier ; une de plus au haut, une aux abords ; toutes d’ocre', () => {
    const lit = (n: number) => countColor(shown(n), C3E.lantern);
    expect([0, 1, 2, 3, 4, 5].map(lit)).toEqual([30, 30, 30, 30, 60, 90]);
    expect(C3E.lantern).toBe(0xe0a84a);
  });

  it('le bronze aux seules ferrures : les chapeaux des lanternes, rien d’autre', () => {
    // Un chapeau de lanterne : une pointe à quatre pans (douze sommets).
    expect(countColor(shown(0), C3E.bronze)).toBe(12);
    expect(countColor(shown(5), C3E.bronze)).toBe(3 * 12);
  });

  it('le grenier sur ses six pieds en champignon, son pignon au sud, face au chemin ; la meule à droite', () => {
    expect(GRENIER_LAYOUT.feet).toHaveLength(6);
    expect(GRENIER_LAYOUT.mill.x).toBeGreaterThan(GRENIER_LAYOUT.granary.w / 2 + 2);
    expect(GRENIER_LAYOUT.front).toBeGreaterThan(0);
  });

  it('une trace par mission, posée avec sa partie', () => {
    const count = (n: number) => posedTraces('grenier', upTo(n), MISSIONS).length;
    expect([0, 1, 2, 3, 4, 5].map(count)).toEqual([0, 1, 2, 3, 4, 5]);
    for (const m of MISSIONS) expect(GRENIER.traces[m], m).toBeDefined();
  });

  it('un lieu bas : le faîte à 5,6 au plus au-dessus du sol', () => {
    expect(boundsOf(shown(5)).max[1]).toBeLessThanOrEqual(5.6);
  });

  it('rien du lieu, en ruine comme restauré, sur le chemin de marche, de part et d’autre de la porte (à hauteur de Kéo)', () => {
    const door = nodes.get('grenier')!;
    const ways = [nodes.get('ve-3')!, nodes.get('ve-4')!];
    const h0 = ground(PLACE.center.x, PLACE.center.z);
    const sets: [Facets, boolean][] = [
      [shown(0), true],
      [shown(5), true],
      [traces(5), false],
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

describe('Le bilan du Grenier', () => {
  it('nomme la partie par son étape, puis dit la phrase du lieu ; jamais un nom du contenu ni un mot de peur', () => {
    const island = PLACE.island as BiomeId;
    const words = stagePoseWords(island, PLACE);
    const parties = partiesDe(island);
    expect(parties).toHaveLength(5);
    const said = [0, 1, 2, 3, 4].map((k) => phraseDeLaPose({ posees: [parties[k]], plansFinis: [] }, words));
    // « Grenier » est le nom du lieu ; « grenier », jamais en nom commun (relecture des lieux, point 13).
    for (const s of said) expect(s).not.toMatch(/Gardien|Grappin|grenier/);
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
    expect(s.words?.pose).toEqual(['Le plancher est calé.', 'Les sacs sont rangés.', 'Les mesures sont en ordre.', 'Les ardoises sont remises.', 'La meule est prête.']);
    expect(s.words?.end).toBe('Ici, chacun avait sa part des provisions.');
    for (const text of texts) expect(text).not.toMatch(/(?<!\p{L})grenier/u);
  });
});

describe('La scénette du Grenier', () => {
  it('le meunier, sans prénom ; son métier est connu, sans phrase de métier', () => {
    const s = scenetteOf('grenier');
    expect(s.role).toBe('Le meunier');
    expect(s.greeting).toBeNull();
  });

  it('la ruine ouvre le pan ouest, celui que voit la porte : ses lauzes au pied du mur ouest, entre lui et la table', () => {
    const tableEdge = GRENIER_LAYOUT.table.x + GRENIER_LAYOUT.table.w / 2;
    for (const s of FALLEN_SLATES) {
      expect(s.x).toBeLessThan(-2.1 - 0.15);
      expect(s.x).toBeGreaterThan(tableEdge + 0.3);
    }
  });

  it('la caméra arrive par la porte, basse, au nord-nord-est (21°, le soleil de côté) : le grenier à droite de Kéo, dans le cadre', () => {
    const door = nodes.get('grenier')!;
    const yaw = doorViewOf('grenier');
    const look = { x: -Math.sin(yaw), z: -Math.cos(yaw) };
    const cap = ((Math.atan2(look.x, -look.z) * 180) / Math.PI + 360) % 360;
    expect(cap).toBeCloseTo(21, 6);
    const d = { x: PLACE.center.x - door.x, z: PLACE.center.z - door.z };
    const off = (Math.atan2(look.x * d.z - look.z * d.x, look.x * d.x + look.z * d.z) * 180) / Math.PI;
    // Le cœur à côté de Kéo, à sa droite, jamais derrière lui (relecture du Versant, (a) 5).
    expect(off).toBeGreaterThan(12);
    expect(off).toBeLessThan(30);
    const frame = doorFrameOf('grenier')!;
    expect(frame.height).toBeLessThan(0);
    expect(frame.back).toBeLessThanOrEqual(1.6);
  });

  it('elle se joue devant la porte, hors du chemin, loin de la porte du lieu ; ses abords sont enregistrés', () => {
    const s = GRENIER_LAYOUT.scene;
    const door = nodes.get('grenier')!;
    for (const [sx, sz] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ]) {
      const p = { x: PLACE.center.x + s.dx + sx * s.half[0], z: PLACE.center.z + s.dz + sz * s.half[1] };
      for (const way of ['ve-3', 've-4']) expect(distanceToPolyline(p, [door, nodes.get(way)!])).toBeGreaterThan(1.5);
    }
    expect(distance({ x: PLACE.center.x + s.dx, z: PLACE.center.z + s.dz }, door)).toBeGreaterThan(3);
    expect(SURROUNDINGS.grenier).toBeDefined();
    const b = new FacetBuilder();
    SURROUNDINGS.grenier!(b, { x: PLACE.center.x + s.dx, y: 0, z: PLACE.center.z + s.dz }, { posed: true } as never);
    expect(b.build().triangles).toBeLessThanOrEqual(SURROUNDINGS_MAX);
    expect(GRENIER_SURROUNDINGS.rocks.length).toBeGreaterThan(0);
  });
});
