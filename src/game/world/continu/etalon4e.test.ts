// L'Étalon (lot 2 du monde ouvert du 4e) : le lieu par parties (3 + 1 + 1, d'après les trois plans de `maths-4e-data`),
// une seule lanterne allumée dans la ruine, trois au plus restauré, une trace par mission avec sa partie, le signe de
// l'absence dans la grande niche qui ne change jamais, les niches jamais en escalier, aucune lueur, rien sur le chemin de
// marche, le butoir contre la halle, la vue d'arrivée basse vers le cône, la scénette de la peseuse, les plafonds de 1 600
// et 1 200 triangles. Sans Three.js.
import { describe, expect, it } from 'vitest';
import type { BiomeId } from '../../biomes';
import { partShapes, stagePoseWords } from '../../three/archipeo/constructionParts';
import { phraseDeLaPose } from '../../poseWords';
import { partiesDe } from '../parts';
import { PLACE_RUIN_TRIANGLES_MAX_4E, PLACE_TRIANGLES_MAX_4E } from './budget';
import { posedTraces, type PartShape, type Stage } from './construction';
import { ETALON, ETALON_LAYOUT } from './etalon4e';
import { ETALON_SURROUNDINGS } from './etalonSurroundings';
import type { Facets } from './facets';
import { FORGE_GLOW, FORGE_GLOW_FADE } from './forge4e';
import { distance, distanceToPolyline, linearRgb } from './geometry';
import { hasHabitantModel } from './habitants';
import { hasScenette, planFor } from './levelPlan';
import { doorFrameOf, doorViewOf } from './northShore';
import { BUILT_PLACES_4E, COLORS_4E, PATH_NODES_4E, RAILS_4E, VOLCANO_4E } from './plan4e';
import { COLORS_5E } from './plan5e';
import { drawPieces, placePieces } from './places';
import { placeTrace } from './questionScene';
import { RUINS_4E } from './ruins4e';
import { scenetteOf } from './scenette';
import { SURROUNDINGS, SURROUNDINGS_MAX } from './surroundings';
import { standingHeight } from './terrain';
import { heightAt4e } from './terrain4e';
import { FacetBuilder } from './facets';

const PLAN = planFor('4e');
const PLACE = PLAN.places.find((p) => p.id === 'etalon')!;
const SHAPES = partShapes(PLACE.island as BiomeId);
const MISSIONS = [...BUILT_PLACES_4E.etalon];

const upTo = (n: number): PartShape[] => SHAPES.slice(0, n);
const takes = (parts: readonly PartShape[], stage: Stage, row: number) => parts.some((part) => part.some((s) => s.stage === stage && row >= s.from - 1e-9 && row < s.to - 1e-9));

function shown(n: number): Facets {
  const parts = upTo(n);
  return drawPieces('etalon', (p) => (p.stage === 'ruine' ? !p.until || !takes(parts, p.until.stage, p.until.row) : takes(parts, p.stage, p.row)));
}

function countColor(f: Facets, color: number): number {
  const [r, g, b] = linearRgb(color);
  let n = 0;
  for (let i = 0; i < f.colors.length; i += 3) if (Math.abs(f.colors[i] - r) < 1e-4 && Math.abs(f.colors[i + 1] - g) < 1e-4 && Math.abs(f.colors[i + 2] - b) < 1e-4) n++;
  return n;
}

const ground = (x: number, z: number) => standingHeight(heightAt4e({ x, z }));
const nodes = new Map(PATH_NODES_4E.map((n) => [n.id, n.at]));
const traces = (n: number) => placeTrace('etalon', posedTraces('etalon', upTo(n), MISSIONS));

describe('L’Étalon, lieu complet', () => {
  it('ses cinq missions se jouent dans sa scénette, en cinq parties : le corps en trois, le haut, les abords', () => {
    expect(PLACE.scenes).toEqual(MISSIONS);
    expect(MISSIONS).toEqual(['weighted-mean', 'events', 'proportional-reasoning', 'calculation-programs', 'translations']);
    expect(hasScenette('etalon')).toBe(true);
    expect(hasHabitantModel('etalon')).toBe(true);
    // Les trois plans de `maths-4e-data` : un premier plan à trois rangées (le corps en trois), le toit, la cour.
    expect(SHAPES.map((p) => p.map((s) => [s.stage, s.from, s.to]))).toEqual([[[0, 0, 1 / 3]], [[0, 1 / 3, 2 / 3]], [[0, 2 / 3, 1]], [[1, 0, 1]], [[2, 0, 1]]]);
    expect(Object.hasOwn(RUINS_4E, 'etalon')).toBe(false);
  });

  it('chaque partie pose quelque chose ; la ruine part avec la rangée qui la remplace ; le signe de l’absence ne part jamais', () => {
    for (let n = 1; n <= 5; n++) expect(shown(n).triangles, String(n)).not.toBe(shown(n - 1).triangles);
    const ruin = placePieces('etalon').filter((p) => p.stage === 'ruine');
    const fallen = ruin.filter((p) => p.until).map((p) => `${p.until!.stage}/${p.until!.row.toFixed(3)}`);
    expect(new Set(fallen)).toEqual(new Set(['0/0.000', '0/0.333', '0/0.667', '1/0.000']));
    // La halle de base, les niches et le signe de l'absence, la potence, la lanterne de la peseuse : une pièce, toujours là.
    expect(ruin.filter((p) => !p.until)).toHaveLength(1);
  });

  it('coûte au plus 1 600 triangles à son état le plus chargé, traces comprises ; la ruine, 1 200 au plus', () => {
    let worst = 0;
    for (let n = 0; n <= 5; n++) worst = Math.max(worst, shown(n).triangles + traces(n).triangles);
    expect(PLACE_TRIANGLES_MAX_4E).toBe(1_600);
    expect(PLACE_RUIN_TRIANGLES_MAX_4E).toBe(1_200);
    expect(worst).toBeLessThanOrEqual(PLACE_TRIANGLES_MAX_4E);
    expect(shown(0).triangles).toBeLessThanOrEqual(PLACE_RUIN_TRIANGLES_MAX_4E);
    expect(ETALON.reach).toBeUndefined();
    expect(ETALON.restoration).toBeUndefined();
  });

  it('une seule lanterne allumée dans la ruine, celle de la peseuse ; trois au plus restauré ; jamais une à une réussite', () => {
    const lit = (n: number) => countColor(shown(n), COLORS_5E.lantern);
    expect(lit(0)).toBeGreaterThan(0);
    for (let n = 1; n <= 3; n++) expect(lit(n), String(n)).toBe(lit(0));
    expect(lit(4)).toBe(2 * lit(0));
    expect(lit(5)).toBeGreaterThan(lit(4));
    expect(lit(5)).toBeLessThanOrEqual(3 * lit(0));
  });

  it('aucune lueur rouge, à aucune étape : ni lave, ni la gueule de la Forge ; ni la rouille claire qui se lit orange', () => {
    for (let n = 0; n <= 5; n++) {
      const all = [shown(n), traces(n)];
      for (const f of all) for (const c of [COLORS_4E.lava, FORGE_GLOW, ...FORGE_GLOW_FADE, COLORS_4E.rust, COLORS_4E.copper]) expect(countColor(f, c), `${n} ${c.toString(16)}`).toBe(0);
    }
  });

  it('une trace par mission, posée avec sa partie : une de plus à chaque partie', () => {
    const count = (n: number) => posedTraces('etalon', upTo(n), MISSIONS).length;
    expect([0, 1, 2, 3, 4, 5].map(count)).toEqual([0, 1, 2, 3, 4, 5]);
    for (const m of MISSIONS) expect(ETALON.traces[m], m).toBeDefined();
    expect(placeTrace('etalon', []).triangles).toBe(0);
  });

  it('les trois niches : de tailles différentes, à des hauteurs différentes, jamais en escalier', () => {
    const n = [...ETALON_LAYOUT.niches].sort((a, b) => a.x - b.x);
    const sizes = n.map((k) => k.half * (k.y1 - k.y0));
    const heights = n.map((k) => (k.y0 + k.y1) / 2);
    expect(new Set(sizes).size).toBe(3);
    expect(new Set(heights).size).toBe(3);
    // D'ouest en est, ni la taille ni la hauteur ne vont toujours dans le même sens.
    const monotone = (v: number[]) => v.every((x, i) => i === 0 || x > v[i - 1]) || v.every((x, i) => i === 0 || x < v[i - 1]);
    expect(monotone(sizes)).toBe(false);
    expect(monotone(heights)).toBe(false);
  });

  it('rien du lieu, en ruine comme restauré, sur le chemin de marche, de part et d’autre de la porte (à hauteur de Kéo)', () => {
    const door = nodes.get('etalon')!;
    const ways = ['fab-2', 'fab-4'].map((id) => nodes.get(id)!);
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
        const onWay = ways.some((w) => distanceToPolyline({ x, z }, [door, w]) < 0.9);
        expect(low && onWay, `${x.toFixed(1)}, ${z.toFixed(1)}`).toBe(false);
      }
    }
  });

  it('le butoir, au bout des rails, est contre le mur ouest de la halle, à un pas ; la cour s’arrête avant lui', () => {
    const end = RAILS_4E.line[RAILS_4E.line.length - 1];
    const local = { x: end.x - PLACE.center.x, z: end.z - PLACE.center.z };
    const H = ETALON_LAYOUT.hall;
    expect(local.x).toBeLessThan(H.x0);
    expect(H.x0 - local.x).toBeLessThan(1.2);
    expect(local.z).toBeGreaterThan(H.z0);
    expect(local.z).toBeLessThan(H.z1 + 0.5);
    const yardWest = Math.min(...ETALON_LAYOUT.yard.map((p) => p.x));
    expect(yardWest - local.x).toBeGreaterThan(0.6);
  });
});

describe('Le bilan de l’Étalon', () => {
  it('nomme la partie par son étape, jamais un nom du contenu', () => {
    const island = PLACE.island as BiomeId;
    const words = stagePoseWords(island, PLACE);
    const parties = partiesDe(island);
    expect(parties).toHaveLength(5);
    const said = (k: number) => phraseDeLaPose({ posees: [parties[k]], plansFinis: [] }, words);
    expect([0, 1, 2, 3, 4].map(said)).toEqual([
      'Partie posée : le corps de l’Étalon, 1 sur 3.',
      'Partie posée : le corps de l’Étalon, 2 sur 3.',
      'Partie posée : le corps de l’Étalon, 3 sur 3.',
      'Partie posée : le haut de l’Étalon.',
      'Partie posée : les abords de l’Étalon.',
    ]);
    for (const k of [0, 1, 2, 3, 4]) expect(said(k)).not.toMatch(/Épave|halle de la peseuse/);
  });
});

describe('La scénette de l’Étalon', () => {
  it('la peseuse, sans prénom ; sa phrase explique le mot une fois, sans le cheval ni l’Épave', () => {
    const s = scenetteOf('etalon');
    expect(s.role).toBe('La peseuse');
    expect(s.greeting).toBe('Ici, chaque poids avait son modèle : l’étalon.');
    for (const text of [s.role, s.greeting ?? '']) expect(text).not.toMatch(/cheval|jument|poulain|Épave|naufrage/i);
  });

  it('la caméra arrive par la porte, basse, le cône du volcan dans le cadre à gauche et la halle à droite', () => {
    const door = nodes.get('etalon')!;
    const yaw = doorViewOf('etalon');
    const look = { x: -Math.sin(yaw), z: -Math.cos(yaw) };
    const angle = (p: { x: number; z: number }) => {
      const d = { x: p.x - door.x, z: p.z - door.z };
      // Positif : à gauche de l'axe du regard.
      return Math.atan2(look.x * d.z - look.z * d.x, look.x * d.x + look.z * d.z) * -1;
    };
    const deg = (r: number) => (r * 180) / Math.PI;
    // Le cône, à gauche, dans le champ (35° de chaque côté au plus) ; la halle, à droite, dans le champ.
    expect(deg(angle(VOLCANO_4E.crater))).toBeGreaterThan(10);
    expect(deg(angle(VOLCANO_4E.crater))).toBeLessThan(33);
    const hall = { x: PLACE.center.x - 0.7, z: PLACE.center.z + ETALON_LAYOUT.hall.ridgeZ };
    expect(deg(angle(hall))).toBeLessThan(0);
    expect(deg(angle(hall))).toBeGreaterThan(-33);
    const frame = doorFrameOf('etalon')!;
    expect(frame.height).toBeLessThan(0);
    expect(frame.back).toBeLessThanOrEqual(1.6);
  });

  it('elle se joue dans la cour, hors du chemin et loin de la porte, la caméra vers le nord ; ses abords sont enregistrés', () => {
    const s = ETALON_LAYOUT.scene;
    const door = nodes.get('etalon')!;
    const way = nodes.get('fab-4')!;
    for (const [sx, sz] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ])
      expect(distanceToPolyline({ x: PLACE.center.x + s.dx + sx * s.half[0], z: PLACE.center.z + s.dz + sz * s.half[1] }, [door, way])).toBeGreaterThan(1.5);
    expect(distance({ x: PLACE.center.x + s.dx, z: PLACE.center.z + s.dz }, door)).toBeGreaterThan(3);
    expect(ETALON_LAYOUT.sceneStart).toBe(0);
    expect(SURROUNDINGS.etalon).toBeDefined();
    const b = new FacetBuilder();
    SURROUNDINGS.etalon!(b, { x: PLACE.center.x + s.dx, y: 0, z: PLACE.center.z + s.dz }, { posed: true } as never);
    expect(b.build().triangles).toBeLessThanOrEqual(SURROUNDINGS_MAX);
    expect(ETALON_SURROUNDINGS.rocks.length).toBeGreaterThan(0);
  });
});
