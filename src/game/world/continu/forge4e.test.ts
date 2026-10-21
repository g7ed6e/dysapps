// La Forge (lot 2 du monde ouvert du 4e) : le lieu par parties (3 + 1 + 1), une seule lanterne allumée dans la ruine, une
// trace par mission avec sa partie, la potence et sa chape vide qui ne changent jamais, la vanne et les regards de la
// rigole hors du modèle (`reach`), l'allumage de la restauration (`restoration` : la vanne, les regards un à un, la grille,
// la gueule, en 4 s au plus), aucune lueur avant lui, rien sur le chemin de marche, la scénette de la chaudronnière, le
// panache du volcan en colonne, les plafonds de 1 600 et 1 200 triangles. Sans Three.js.
import { describe, expect, it } from 'vitest';
import type { BiomeId } from '../../biomes';
import { partShapes, stagePoseWords } from '../../three/archipeo/constructionParts';
import { phraseDeLaPose } from '../../poseWords';
import { partiesDe } from '../parts';
import { PLACE_RUIN_TRIANGLES_MAX_4E, PLACE_TRIANGLES_MAX_4E, reachCost4e } from './budget';
import { posedTraces, type PartShape, type Stage } from './construction';
import type { Facets } from './facets';
import { FORGE, FORGE_GLOW, FORGE_GLOW_FADE, FORGE_LAYOUT } from './forge4e';
import { FORGE_SURROUNDINGS } from './forgeSurroundings';
import { distance, linearRgb } from './geometry';
import { hasHabitantModel } from './habitants';
import { hasScenette, planFor } from './levelPlan';
import { doorFrameOf, doorViewOf } from './northShore';
import { BUILT_PLACES_4E, COLORS_4E, PATH_NODES_4E } from './plan4e';
import { COLORS_5E } from './plan5e';
import { drawPieces, placePieces } from './places';
import { placeTrace } from './questionScene';
import { RUINS_4E } from './ruins4e';
import { scenetteOf } from './scenette';
import { SURROUNDINGS } from './surroundings';
import { standingHeight } from './terrain';
import { PLUME_4E, heightAt4e } from './terrain4e';

const PLAN = planFor('4e');
const PLACE = PLAN.places.find((p) => p.id === 'forge')!;
const SHAPES = partShapes(PLACE.island as BiomeId);
const MISSIONS = [...BUILT_PLACES_4E.forge];
const C0 = { ...PLACE.center, y: standingHeight(heightAt4e(PLACE.center)) };

const upTo = (n: number): PartShape[] => SHAPES.slice(0, n);
const takes = (parts: readonly PartShape[], stage: Stage, row: number) => parts.some((part) => part.some((s) => s.stage === stage && row >= s.from - 1e-9 && row < s.to - 1e-9));
const posedAt = (n: number) => (stage: Stage, row: number) => takes(upTo(n), stage, row);

function shown(n: number): Facets {
  const parts = upTo(n);
  return drawPieces('forge', (p) => (p.stage === 'ruine' ? !p.until || !takes(parts, p.until.stage, p.until.row) : takes(parts, p.stage, p.row)));
}

function countColor(f: Facets, color: number): number {
  const [r, g, b] = linearRgb(color);
  let n = 0;
  for (let i = 0; i < f.colors.length; i += 3) if (Math.abs(f.colors[i] - r) < 1e-4 && Math.abs(f.colors[i + 1] - g) < 1e-4 && Math.abs(f.colors[i + 2] - b) < 1e-4) n++;
  return n;
}

const GLOWS = [COLORS_4E.lava, FORGE_GLOW, ...FORGE_GLOW_FADE];
const glowCount = (f: Facets) => GLOWS.reduce((s, c) => s + countColor(f, c), 0);

const ground = (x: number, z: number) => standingHeight(heightAt4e({ x, z }));
const nodes = new Map(PATH_NODES_4E.map((n) => [n.id, n.at]));

function toSegment(p: { x: number; z: number }, a: { x: number; z: number }, b: { x: number; z: number }): number {
  const dx = b.x - a.x,
    dz = b.z - a.z;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / (dx * dx + dz * dz || 1)));
  return Math.hypot(p.x - a.x - dx * t, p.z - a.z - dz * t);
}

describe('La Forge, lieu complet', () => {
  it('ses cinq missions se jouent dans sa scénette, en cinq parties : le corps en trois, le haut, les abords', () => {
    expect(PLACE.scenes).toEqual(MISSIONS);
    expect(MISSIONS).toEqual(['powers', 'square-roots', 'scientific-notation', 'subtracting', 'volumes']);
    expect(hasScenette('forge')).toBe(true);
    expect(hasHabitantModel('forge')).toBe(true);
    expect(SHAPES.map((p) => p.map((s) => [s.stage, s.from, s.to]))).toEqual([[[0, 0, 1 / 3]], [[0, 1 / 3, 2 / 3]], [[0, 2 / 3, 1]], [[1, 0, 1]], [[2, 0, 1]]]);
    // Sa ruine simple du lot 1 n'est plus dessinée : elle est dans son fichier, avec ses étapes.
    expect(Object.hasOwn(RUINS_4E, 'forge')).toBe(false);
  });

  it('chaque partie pose quelque chose ; la ruine part avec la rangée qui la remplace ; la potence ne part jamais', () => {
    for (let n = 1; n <= 5; n++) expect(shown(n).triangles, String(n)).not.toBe(shown(n - 1).triangles);
    const ruin = placePieces('forge').filter((p) => p.stage === 'ruine');
    const fallen = ruin.filter((p) => p.until).map((p) => `${p.until!.stage}/${p.until!.row.toFixed(3)}`);
    expect(new Set(fallen)).toEqual(new Set(['0/0.000', '0/0.333', '0/0.667', '2/0.000']));
    // La potence, sa chape vide et ses goujons nus (le signe de l'absence du 4e), l'enclume et l'appentis : une pièce, toujours là.
    expect(ruin.filter((p) => !p.until)).toHaveLength(1);
  });

  it('coûte au plus 1 600 triangles à son état le plus chargé, traces, vanne, regards et allumage compris ; la ruine, 1 200 au plus', () => {
    let worst = 0;
    for (let n = 0; n <= 5; n++) {
      const traces = placeTrace('forge', posedTraces('forge', upTo(n), MISSIONS)).triangles;
      const reach = FORGE.reach!(C0, posedAt(n))!.triangles;
      const lit = FORGE.restoration!.draw(C0, n === 5 ? Infinity : 0).triangles;
      worst = Math.max(worst, shown(n).triangles + traces + reach + lit);
    }
    expect(PLACE_TRIANGLES_MAX_4E).toBe(1_600);
    expect(PLACE_RUIN_TRIANGLES_MAX_4E).toBe(1_200);
    expect(worst).toBeLessThanOrEqual(PLACE_TRIANGLES_MAX_4E);
    expect(shown(0).triangles + FORGE.reach!(C0, posedAt(0))!.triangles + FORGE.restoration!.draw(C0, 0).triangles).toBeLessThanOrEqual(PLACE_RUIN_TRIANGLES_MAX_4E);
    expect(reachCost4e()).toBe(FORGE.reach!(C0, () => true)!.triangles + FORGE.restoration!.draw(C0, Infinity).triangles);
  });

  it('une seule lanterne allumée dans la ruine, celle de l’appentis ; trois au plus restaurée ; jamais une à une réussite', () => {
    const lit = (n: number) => countColor(shown(n), COLORS_5E.lantern);
    expect(lit(0)).toBeGreaterThan(0);
    for (let n = 1; n <= 3; n++) expect(lit(n), String(n)).toBe(lit(0));
    expect(lit(4)).toBe(2 * lit(0));
    expect(lit(5)).toBeLessThanOrEqual(3 * lit(0));
    expect(lit(5)).toBeGreaterThan(lit(4));
  });

  it('aucune lueur avant la restauration : ni lave, ni gueule allumée, ni dans le lieu, ni le long de la rigole', () => {
    for (let n = 0; n <= 5; n++) {
      expect(glowCount(shown(n)), String(n)).toBe(0);
      expect(glowCount(FORGE.reach!(C0, posedAt(n))!), String(n)).toBe(0);
    }
    expect(glowCount(FORGE.restoration!.draw(C0, 0))).toBe(0);
    for (const n of [0, 1, 2, 3, 4, 5]) expect(glowCount(placeTrace('forge', posedTraces('forge', upTo(n), MISSIONS)))).toBe(0);
  });

  it('une trace par mission, posée avec sa partie : une de plus à chaque partie', () => {
    const traces = (n: number) => posedTraces('forge', upTo(n), MISSIONS).length;
    expect([0, 1, 2, 3, 4, 5].map(traces)).toEqual([0, 1, 2, 3, 4, 5]);
    for (const m of MISSIONS) expect(FORGE.traces?.[m], m).toBeDefined();
    expect(placeTrace('forge', []).triangles).toBe(0);
  });

  it('rien du lieu, en ruine comme restauré, sur le chemin de marche, de part et d’autre de la porte (à hauteur de Kéo)', () => {
    const door = nodes.get('forge')!;
    const ways = ['fab-2', 'fab-3'].map((id) => nodes.get(id)!);
    const h0 = ground(PLACE.center.x, PLACE.center.z);
    // Le modèle est dans le repère du lieu, les traces dans le monde.
    const sets: [Facets, boolean][] = [
      [shown(0), true],
      [shown(5), true],
      [placeTrace('forge', posedTraces('forge', upTo(5), MISSIONS)), false],
    ];
    for (const [f, local] of sets) {
      for (let i = 0; i < f.positions.length; i += 9) {
        const x = (f.positions[i] + f.positions[i + 3] + f.positions[i + 6]) / 3 + (local ? PLACE.center.x : 0);
        const z = (f.positions[i + 2] + f.positions[i + 5] + f.positions[i + 8]) / 3 + (local ? PLACE.center.z : 0);
        const y = Math.min(f.positions[i + 1], f.positions[i + 4], f.positions[i + 7]) + (local ? h0 : 0);
        const low = y - ground(x, z) < 1.8;
        const onWay = ways.some((w) => toSegment({ x, z }, door, w) < 0.6);
        expect(low && onWay, `${x.toFixed(1)}, ${z.toFixed(1)}`).toBe(false);
      }
    }
  });
});

describe('L’allumage de la Forge restaurée', () => {
  const R = FORGE_LAYOUT.restoration;
  const lava = (t: number) => countColor(FORGE.restoration!.draw(C0, t), COLORS_4E.lava);
  const mouth = (t: number, color: number) => countColor(FORGE.restoration!.draw(C0, t), color);

  it('dure 4 s au plus : la vanne, puis les quatre regards l’un après l’autre, puis la grille, puis la gueule', () => {
    expect(FORGE.restoration!.seconds).toBeLessThanOrEqual(4);
    expect(R.vanne).toBeLessThan(R.regards[0]);
    for (let i = 1; i < R.regards.length; i++) expect(R.regards[i] - R.regards[i - 1]).toBeGreaterThanOrEqual(0.5 - 1e-9);
    expect(R.grate).toBeGreaterThan(R.regards[R.regards.length - 1]);
    expect(R.fade[0]).toBeGreaterThan(R.grate);
    expect(R.fade[R.fade.length - 1]).toBeLessThanOrEqual(FORGE.restoration!.seconds);
    // Chaque lueur s'allume une fois et reste : la lave ne fait que croître, d'un cran à chaque étape.
    const steps = [0, R.vanne, ...R.regards, R.grate].map(lava);
    for (let i = 1; i < steps.length; i++) expect(steps[i], String(i)).toBeGreaterThan(steps[i - 1]);
    expect(lava(R.grate)).toBe(lava(Infinity));
  });

  it('la gueule passe par ses trois teintes, puis reste allumée de sa seule couleur', () => {
    expect(mouth(R.grate, FORGE_GLOW)).toBe(0);
    FORGE_GLOW_FADE.forEach((c, i) => expect(mouth(R.fade[i], c), String(i)).toBeGreaterThan(0));
    expect(mouth(Infinity, FORGE_GLOW)).toBeGreaterThan(0);
    for (const c of FORGE_GLOW_FADE) expect(mouth(Infinity, c)).toBe(0);
    expect(FORGE_GLOW).toBe(0xdc5530);
  });
});

describe('Le bilan de la Forge', () => {
  it('nomme la partie par son étape, jamais un nom du contenu', () => {
    const island = PLACE.island as BiomeId;
    const words = stagePoseWords(island, PLACE);
    const parties = partiesDe(island);
    expect(parties).toHaveLength(5);
    const said = (k: number) => phraseDeLaPose({ posees: [parties[k]], plansFinis: [] }, words);
    expect([0, 1, 2, 3, 4].map(said)).toEqual([
      'Partie posée : le corps de la Forge, 1 sur 3.',
      'Partie posée : le corps de la Forge, 2 sur 3.',
      'Partie posée : le corps de la Forge, 3 sur 3.',
      'Partie posée : le haut de la Forge.',
      'Partie posée : les abords de la Forge.',
    ]);
  });
});

describe('La scénette de la Forge', () => {
  it('la chaudronnière, sans prénom, avec sa phrase du métier ; aucun mot du fourneau ni de la chaleur', () => {
    expect(scenetteOf('forge').role).toBe('La chaudronnière');
    expect(scenetteOf('forge').greeting).toBe('La chaudronnière façonne le métal en grandes feuilles.');
    for (const text of [scenetteOf('forge').role, scenetteOf('forge').greeting ?? '']) expect(text).not.toMatch(/gueule|gueulard|regard|vanne|chaleur|\bchaude?s?\b|brûl|danger/i);
  });

  it('la caméra arrive par la porte, tournée vers le fourneau, dans sa vue d’arrivée', () => {
    const door = nodes.get('forge')!;
    const yaw = doorViewOf('forge');
    // Elle regarde vers −(sin, cos) : du côté du fourneau, depuis la porte.
    const look = { x: -Math.sin(yaw), z: -Math.cos(yaw) };
    const toFurnace = { x: PLACE.center.x + FORGE_LAYOUT.furnace.x - door.x, z: PLACE.center.z + FORGE_LAYOUT.furnace.z - door.z };
    expect((look.x * toFurnace.x + look.z * toFurnace.z) / Math.hypot(toFurnace.x, toFurnace.z)).toBeGreaterThan(0.99);
    expect(doorFrameOf('forge')).toBeDefined();
  });

  it('elle se joue sur le plancher de l’appentis, hors du chemin ; ses abords sont enregistrés', () => {
    const s = FORGE_LAYOUT.scene;
    const f = FORGE_LAYOUT.shedFloor;
    expect(s.dx - s.half[0]).toBeGreaterThanOrEqual(f.x0 - 1e-9);
    expect(s.dx + s.half[0]).toBeLessThanOrEqual(f.x1 + 1e-9);
    expect(s.dz - s.half[1]).toBeGreaterThanOrEqual(f.z0 - 1e-9);
    expect(s.dz + s.half[1]).toBeLessThanOrEqual(f.z1 + 1e-9);
    expect(SURROUNDINGS.forge).toBeDefined();
    expect(FORGE_SURROUNDINGS.rocks.length).toBeGreaterThan(0);
    expect(distance({ x: PLACE.center.x + s.dx, z: PLACE.center.z + s.dz }, nodes.get('forge')!)).toBeGreaterThan(3);
  });
});

describe('Le panache du volcan', () => {
  it('une colonne de troncs de cône empilés, de 2 à 4 de rayon, penchée vers le sud-est, jamais des boules', () => {
    const rings = PLUME_4E.rings;
    expect(rings.length - 1).toBeGreaterThanOrEqual(3);
    expect(rings.length - 1).toBeLessThanOrEqual(4);
    expect(rings[0][3]).toBe(2);
    expect(rings[rings.length - 1][3]).toBe(4);
    for (let i = 1; i < rings.length; i++) {
      expect(rings[i][0]).toBeGreaterThan(rings[i - 1][0]);
      expect(rings[i][1]).toBeGreaterThan(rings[i - 1][1]);
      expect(rings[i][2]).toBeGreaterThan(rings[i - 1][2]);
      expect(rings[i][3]).toBeGreaterThanOrEqual(rings[i - 1][3]);
    }
  });
});

