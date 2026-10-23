// Les Ondes (les Prairies du 3e, GD-25) : le lieu par parties (2 + 1 + 1, d'après les quatre missions de son île), une
// seule lanterne allumée dans la ruine, trois restaurée ; une trace par mission avec sa partie ; le bronze aux seules
// ferrures des lanternes, jamais de cobalt ; le grand mât, le plus haut du lieu, et le pavillon à gauche de la station ;
// rien sur le chemin de marche ; la porte à l'est-nord-est et la vue d'arrivée à l'ouest-sud-ouest, vers la mer de
// nuages, le mât et le pavillon à gauche de Kéo ; la scénette de l'annonceur ; les plafonds de 1 600 et 1 200 triangles.
// Sans Three.js.
import { describe, expect, it } from 'vitest';
import type { BiomeId } from '../../biomes';
import { partShapes, stagePoseWords } from '../../three/archipeo/constructionParts';
import { phraseDeLaPose } from '../../poseWords';
import { partiesDe } from '../parts';
import { plansFor } from '../plans';
import { PLACE_RUIN_TRIANGLES_MAX_3E, PLACE_TRIANGLES_MAX_3E } from './budget';
import { posedTraces, type PartShape, type Stage } from './construction';
import { boundsOf, type Facets } from './facets';
import { distance, distanceToPolyline, linearRgb } from './geometry';
import { hasHabitantModel } from './habitants';
import { hasScenette, planFor } from './levelPlan';
import { doorFrameOf, doorViewOf } from './northShore';
import { C3E } from './place3eKit';
import { BUILT_PLACES_3E, COLORS_3E, PATH_NODES_3E } from './plan3e';
import { drawPieces, placePieces } from './places';
import { placeTrace } from './questionScene';
import { ONDES, ONDES_LAYOUT } from './ondes3e';
import { scenetteOf } from './scenette';
import { standingHeight } from './terrain';
import { heightAt3e, landDistance3e } from './terrain3e';

const PLAN = planFor('3e');
const PLACE = PLAN.places.find((p) => p.id === 'ondes')!;
const SHAPES = partShapes(PLACE.island as BiomeId);
const MISSIONS = [...BUILT_PLACES_3E.ondes];

const upTo = (n: number): PartShape[] => SHAPES.slice(0, n);
const takes = (parts: readonly PartShape[], stage: Stage, row: number) =>
  parts.some((part) => part.some((s) => s.stage === stage && row >= s.from - 1e-9 && row < s.to - 1e-9));

function shown(n: number): Facets {
  const parts = upTo(n);
  return drawPieces('ondes', (p) => (p.stage === 'ruine' ? !p.until || !takes(parts, p.until.stage, p.until.row) : takes(parts, p.stage, p.row)));
}

function countColor(f: Facets, color: number): number {
  const [r, g, b] = linearRgb(color);
  let n = 0;
  for (let i = 0; i < f.colors.length; i += 3)
    if (Math.abs(f.colors[i] - r) < 1e-4 && Math.abs(f.colors[i + 1] - g) < 1e-4 && Math.abs(f.colors[i + 2] - b) < 1e-4) n++;
  return n;
}

const ground = (x: number, z: number) => standingHeight(heightAt3e({ x, z }));
const nodes = new Map(PATH_NODES_3E.map((n) => [n.id, n.at]));
const traces = (n: number) => placeTrace('ondes', posedTraces('ondes', upTo(n), MISSIONS));

/** Les noms du titre d'un plan (« Le toit de la bibliothèque » : toit, bibliothèque), sans ses articles, moins « abords ». */
const planNouns = (name: string) =>
  name
    .toLowerCase()
    .split(/[\s’']+/)
    .filter((w) => w.length > 2 && !['les', 'des', 'aux', 'abords'].includes(w));
/** Un mot entier, au singulier ou au pluriel, quelle que soit sa casse. */
const wordRe = (w: string) => new RegExp(`(?<!\\p{L})${w}s?(?!\\p{L})`, 'iu');

describe('Les Ondes, lieu complet', () => {
  it('ses quatre missions se jouent dans sa scénette, en quatre parties : la station, les postes, le haut, les abords', () => {
    expect(PLACE.scenes).toEqual(MISSIONS);
    expect(MISSIONS).toEqual(['understanding', 'linking-words', 'false-friends', 'media']);
    expect(hasScenette('ondes')).toBe(true);
    expect(hasHabitantModel('ondes')).toBe(false);
    expect(SHAPES.map((p) => p.map((s) => [s.stage, +s.from.toFixed(3), +s.to.toFixed(3)]))).toEqual([[[0, 0, 0.5]], [[0, 0.5, 1]], [[1, 0, 1]], [[2, 0, 1]]]);
  });

  it('chaque partie pose quelque chose ; la ruine part avec la partie qui la remplace', () => {
    for (let n = 1; n <= 4; n++) expect(shown(n).triangles, String(n)).not.toBe(shown(n - 1).triangles);
    const ruin = placePieces('ondes').filter((p) => p.stage === 'ruine');
    const fallen = ruin.filter((p) => p.until).map((p) => `${p.until!.stage}/${p.until!.row.toFixed(3)}`);
    expect(new Set(fallen)).toEqual(new Set(['0/0.000', '0/0.500', '1/0.000', '2/0.000']));
    expect(ruin.filter((p) => !p.until)).toHaveLength(1);
    expect(placePieces('ondes').filter((p) => p.stage !== 'ruine' && p.until)).toHaveLength(0);
  });

  it('coûte au plus 1 600 triangles à son état le plus chargé, traces comprises ; la ruine, 1 200 au plus', () => {
    let worst = 0;
    for (let n = 0; n <= 4; n++) worst = Math.max(worst, shown(n).triangles + traces(n).triangles);
    expect(worst).toBeLessThanOrEqual(PLACE_TRIANGLES_MAX_3E);
    expect(shown(0).triangles).toBeLessThanOrEqual(PLACE_RUIN_TRIANGLES_MAX_3E);
    expect(ONDES.reach).toBeUndefined();
  });

  it('une seule lanterne allumée dans la ruine, celle de l’annonceur ; une de plus au haut (l’auvent), une aux abords ; toutes d’ocre', () => {
    const lit = (n: number) => countColor(shown(n), C3E.lantern);
    expect([0, 1, 2, 3, 4].map(lit)).toEqual([30, 30, 30, 60, 90]);
  });

  it('le bronze aux seules lanternes, jamais de cobalt (il est à la Coupole) ; un peu de neige au faîte, en ruine comme restaurée', () => {
    expect([0, 1, 2, 3, 4].map((n) => countColor(shown(n), C3E.bronze))).toEqual([12, 12, 12, 24, 36]);
    for (let n = 0; n <= 4; n++) {
      expect(countColor(shown(n), COLORS_3E.cobalt), String(n)).toBe(0);
      expect(countColor(shown(n), C3E.snow), String(n)).toBeGreaterThan(0);
    }
  });

  it('l’herbe sèche de la ruine, d’un ton à part, part avec les abords', () => {
    expect([0, 1, 2, 3, 4].map((n) => countColor(shown(n), C3E.dry) > 0)).toEqual([true, true, true, true, false]);
  });

  it('une trace par mission, posée avec sa partie', () => {
    const count = (n: number) => posedTraces('ondes', upTo(n), MISSIONS).length;
    expect([0, 1, 2, 3, 4].map(count)).toEqual([0, 1, 2, 3, 4]);
    for (const m of MISSIONS) expect(ONDES.traces[m], m).toBeDefined();
  });

  it('le grand mât, le plus haut du lieu, et le pavillon, à gauche de la station ; le mât debout dès la ruine', () => {
    const { mast, horn, station } = ONDES_LAYOUT;
    expect(mast.x).toBeLessThan(station.x0);
    expect(horn.x).toBeLessThan(station.x0);
    const top = ONDES_LAYOUT.base() + mast.h;
    for (const n of [0, 4]) expect(boundsOf(shown(n)).max[1], String(n)).toBeGreaterThanOrEqual(top - 0.1);
    expect(mast.h).toBeGreaterThan(station.h + station.ridge + 4);
  });

  it('rien du lieu, en ruine comme restauré, sur le chemin de marche, de la porte à `sa2-b` (à hauteur de Kéo)', () => {
    const way = [nodes.get('ondes')!, nodes.get('sa2-b')!];
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
        expect(low && distanceToPolyline({ x, z }, way) < 0.9, `${x.toFixed(1)}, ${z.toFixed(1)}`).toBe(false);
      }
    }
  });
});

describe('Le bilan des Ondes', () => {
  it('nomme la partie par son étape, puis dit la phrase du lieu ; jamais un nom du contenu ni un nom de plan, ni un mot de peur', () => {
    const island = PLACE.island as BiomeId;
    const words = stagePoseWords(island, PLACE);
    const parties = partiesDe(island);
    expect(parties).toHaveLength(4);
    const said = [0, 1, 2, 3].map((k) => phraseDeLaPose({ posees: [parties[k]], plansFinis: [] }, words));
    for (const s of said) expect(s).not.toMatch(/Gardien|Mémo/);
    const s = scenetteOf(PLACE.id);
    const texts = [...said, ...(s.words?.pose ?? []), s.words?.end ?? ''];
    for (const plan of plansFor(island))
      for (const text of texts) {
        expect(text).not.toContain(plan.done);
        for (const noun of planNouns(plan.name)) expect(text, noun).not.toMatch(wordRe(noun));
      }
    for (const text of texts) expect(text).not.toMatch(/vide|chute|tomb|vertige|phare|abri|grenier|palais|standard/i);
    expect(s.words?.pose).toEqual(['La station est refaite.', 'Les postes sont en rang.', 'Le pavillon écoute le large.', 'Le chemin est prêt.']);
    expect(s.words?.end).toBe('Ici, on entendait les voix des autres archipels.');
  });
});

describe('La scénette des Ondes', () => {
  it('l’annonceur, sans prénom, et sa phrase de métier', () => {
    const s = scenetteOf('ondes');
    expect(s.role).toBe('L’annonceur');
    expect(s.greeting).toBe('L’annonceur lit les nouvelles à la radio.');
  });

  it('la caméra arrive par la porte, vers l’ouest-sud-ouest (243°) : le mât et le pavillon à gauche de Kéo, jamais derrière lui', () => {
    const door = nodes.get('ondes')!;
    const yaw = doorViewOf('ondes');
    const look = { x: -Math.sin(yaw), z: -Math.cos(yaw) };
    const cap = ((Math.atan2(look.x, -look.z) * 180) / Math.PI + 360) % 360;
    expect(cap).toBeCloseTo(243, 6);
    const { mast, horn, local } = ONDES_LAYOUT;
    for (const it of [mast, horn]) {
      const c = local(it.x, it.z);
      const d = {
        x: PLACE.center.x + c.x - door.x,
        z: PLACE.center.z + c.z - door.z,
      };
      const off = (Math.atan2(look.x * d.z - look.z * d.x, look.x * d.x + look.z * d.z) * 180) / Math.PI;
      expect(off, String(it.x)).toBeLessThan(-4);
    }
    // La porte loin des rives ; dans l'axe, au-delà de l'île, rien que la mer de nuages jusqu'au ciel.
    expect(landDistance3e(door)).toBeGreaterThan(6);
    let land = 0;
    for (let t = 30; t <= 400; t += 5) if (landDistance3e({ x: door.x + look.x * t, z: door.z + look.z * t }) >= 0) land++;
    expect(land).toBe(0);
    const frame = doorFrameOf('ondes')!;
    expect(frame.height).toBeLessThan(0);
    expect(frame.back).toBeLessThanOrEqual(1.6);
  });

  it('elle se joue devant le pavillon, hors du chemin, hors de la station, loin de la porte du lieu', () => {
    const s = ONDES_LAYOUT.scene;
    const door = nodes.get('ondes')!;
    const way = [door, nodes.get('sa2-b')!];
    const { toFrame, station, awning } = ONDES_LAYOUT;
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
      expect(distanceToPolyline(p, way)).toBeGreaterThan(1.5);
      const f = toFrame(s.dx + sx * s.half[0], s.dz + sz * s.half[1]);
      expect(f.x < station.x0 - 0.3 || f.z > awning.z1 + 0.3).toBe(true);
    }
    expect(distance({ x: PLACE.center.x + s.dx, z: PLACE.center.z + s.dz }, door)).toBeGreaterThan(3);
  });
});
