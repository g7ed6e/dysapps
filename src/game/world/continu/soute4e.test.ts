// La Soute (lot 2 du monde ouvert du 4e) : le lieu par parties (le corps, le haut, les abords), une seule lanterne
// allumée dans la ruine, une trace par mission avec sa partie, la grande bitte et son support vide qui ne changent jamais,
// le navire le long du quai (jamais en travers du bassin), rien sur les chemins, la scénette du magasinier, les plafonds
// de 1 600 et 1 200 triangles, aucune rouille claire. Sans Three.js.
import { describe, expect, it } from 'vitest';
import type { BiomeId } from '../../biomes';
import { partShapes, placePoseWords } from '../../three/archipeo/constructionParts';
import { phraseDeLaPose } from '../../poseWords';
import { partiesDe } from '../parts';
import { PLACE_RUIN_TRIANGLES_MAX_4E, PLACE_TRIANGLES_MAX_4E } from './budget';
import { posedTraces, type PartShape, type Stage } from './construction';
import type { Facets } from './facets';
import { linearRgb } from './geometry';
import { hasHabitantModel } from './habitants';
import { hasScenette, planFor } from './levelPlan';
import { doorFrameOf, doorViewOf } from './northShore';
import { BASSIN_4E, BUILT_PLACES_4E, COLORS_4E, PATH_EDGES_4E, PATH_NODES_4E } from './plan4e';
import { COLORS_5E } from './plan5e';
import { drawPieces, placePieces } from './places';
import { placeTrace } from './questionScene';
import { RUINS_4E } from './ruins4e';
import { scenetteOf } from './scenette';
import { SOUTE, SOUTE_LAYOUT } from './soute4e';
import { SOUTE_SURROUNDINGS } from './souteSurroundings';
import { SURROUNDINGS } from './surroundings';
import { standingHeight } from './terrain';
import { bassinClearance, heightAt4e } from './terrain4e';

const PLAN = planFor('4e');
const PLACE = PLAN.places.find((p) => p.id === 'soute')!;
const SHAPES = partShapes(PLACE.island as BiomeId);
const MISSIONS = [...BUILT_PLACES_4E.soute];

const upTo = (n: number): PartShape[] => SHAPES.slice(0, n);
const takes = (parts: readonly PartShape[], stage: Stage, row: number) => parts.some((part) => part.some((s) => s.stage === stage && row >= s.from - 1e-9 && row < s.to - 1e-9));

function shown(n: number): Facets {
  const parts = upTo(n);
  return drawPieces('soute', (p) => (p.stage === 'ruine' ? !p.until || !takes(parts, p.until.stage, p.until.row) : takes(parts, p.stage, p.row)));
}

function countColor(f: Facets, color: number): number {
  const [r, g, b] = linearRgb(color);
  let n = 0;
  for (let i = 0; i < f.colors.length; i += 3) if (Math.abs(f.colors[i] - r) < 1e-4 && Math.abs(f.colors[i + 1] - g) < 1e-4 && Math.abs(f.colors[i + 2] - b) < 1e-4) n++;
  return n;
}

const ground = (x: number, z: number) => standingHeight(heightAt4e({ x, z }));
const nodes = new Map(PATH_NODES_4E.map((n) => [n.id, n.at]));

function toSegment(p: { x: number; z: number }, a: { x: number; z: number }, b: { x: number; z: number }): number {
  const dx = b.x - a.x,
    dz = b.z - a.z;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / (dx * dx + dz * dz || 1)));
  return Math.hypot(p.x - a.x - dx * t, p.z - a.z - dz * t);
}

describe('La Soute, lieu complet', () => {
  it('ses trois missions se jouent dans sa scénette, en trois parties : le corps, le haut, les abords', () => {
    expect(PLACE.scenes).toEqual(MISSIONS);
    expect(MISSIONS).toEqual(['urbanization', 'mobilities', 'globalization']);
    expect(hasScenette('soute')).toBe(true);
    expect(hasHabitantModel('soute')).toBe(true);
    expect(SHAPES.map((p) => p.map((s) => [s.stage, s.from, s.to]))).toEqual([[[0, 0, 1]], [[1, 0, 1]], [[2, 0, 1]]]);
    expect(Object.hasOwn(RUINS_4E, 'soute')).toBe(false);
  });

  it('chaque partie pose quelque chose ; la ruine part avec la partie qui la remplace ; le quai et sa bitte restent', () => {
    for (let n = 1; n <= 3; n++) expect(shown(n).triangles, String(n)).not.toBe(shown(n - 1).triangles);
    const ruin = placePieces('soute').filter((p) => p.stage === 'ruine');
    expect(new Set(ruin.filter((p) => p.until).map((p) => p.until!.stage))).toEqual(new Set([0, 2]));
    // Le quai, la grande bitte et son support vide (le signe de l'absence du 4e), la lanterne du magasinier : toujours là.
    expect(ruin.filter((p) => !p.until)).toHaveLength(1);
  });

  it('coûte au plus 1 600 triangles à son état le plus chargé, traces comprises ; la ruine, 1 200 au plus', () => {
    let worst = 0;
    for (let n = 0; n <= 3; n++) worst = Math.max(worst, shown(n).triangles + placeTrace('soute', posedTraces('soute', upTo(n), MISSIONS)).triangles);
    expect(worst).toBeLessThanOrEqual(PLACE_TRIANGLES_MAX_4E);
    expect(shown(0).triangles).toBeLessThanOrEqual(PLACE_RUIN_TRIANGLES_MAX_4E);
  });

  it('une seule lanterne allumée dans la ruine, celle du magasinier ; trois au plus restaurée ; jamais une à une réussite', () => {
    const lit = (n: number) => countColor(shown(n), COLORS_5E.lantern);
    expect(lit(0)).toBeGreaterThan(0);
    expect(lit(1)).toBe(lit(0));
    expect(lit(2)).toBe(2 * lit(0));
    expect(lit(3)).toBeGreaterThan(lit(2));
    expect(lit(3)).toBeLessThanOrEqual(3 * lit(0));
  });

  it('jamais la rouille claire du lot 1, qui se lit orange au soleil bas', () => {
    for (let n = 0; n <= 3; n++) {
      expect(countColor(shown(n), COLORS_4E.rust), String(n)).toBe(0);
      expect(countColor(placeTrace('soute', posedTraces('soute', upTo(n), MISSIONS)), COLORS_4E.rust), String(n)).toBe(0);
    }
  });

  it('une trace par mission, posée avec sa partie', () => {
    const traces = (n: number) => posedTraces('soute', upTo(n), MISSIONS).length;
    expect([0, 1, 2, 3].map(traces)).toEqual([0, 1, 2, 3]);
    for (const m of MISSIONS) expect(SOUTE.traces[m], m).toBeDefined();
  });

  it('le navire est à flot le long du quai, jamais en travers du bassin, et laisse de l’eau libre vers le Bastion', () => {
    const S = SOUTE_LAYOUT.ship;
    const L = SOUTE_LAYOUT;
    // Son axe suit celui du bassin (le repère du quai) ; il est dans l'eau, de la proue à la poupe, des deux bords.
    for (const v of [S.v - S.half, S.v + S.half])
      for (const u of [S.u - S.beam, S.u + S.beam]) {
        const p = L.quayToLocal(u, v);
        expect(bassinClearance({ x: PLACE.center.x + p.x, z: PLACE.center.z + p.z }), `${u}, ${v}`).toBeLessThan(0);
      }
    expect(S.u - S.beam - L.edge).toBeGreaterThan(0.5);
    expect(L.edge + 2 * BASSIN_4E.halfWidth - (S.u + S.beam)).toBeGreaterThan(7);
    expect(S.half * 2).toBeGreaterThan(S.beam * 4);
  });

  it('rien du lieu, en ruine comme restauré, sur les chemins qui passent près de lui (à hauteur de Kéo)', () => {
    const edges = PATH_EDGES_4E.filter(([a, b]) => ['soute', 'cri-1'].includes(a) || ['soute', 'cri-1'].includes(b)).map(([a, b]) => [nodes.get(a)!, nodes.get(b)!] as const);
    expect(edges.length).toBeGreaterThanOrEqual(3);
    const h0 = ground(PLACE.center.x, PLACE.center.z);
    const sets: [Facets, boolean][] = [
      [shown(0), true],
      [shown(3), true],
      [placeTrace('soute', posedTraces('soute', upTo(3), MISSIONS)), false],
    ];
    for (const [f, local] of sets) {
      for (let i = 0; i < f.positions.length; i += 9) {
        const x = (f.positions[i] + f.positions[i + 3] + f.positions[i + 6]) / 3 + (local ? PLACE.center.x : 0);
        const z = (f.positions[i + 2] + f.positions[i + 5] + f.positions[i + 8]) / 3 + (local ? PLACE.center.z : 0);
        const y = Math.min(f.positions[i + 1], f.positions[i + 4], f.positions[i + 7]) + (local ? h0 : 0);
        const low = y - ground(x, z) < 1.8;
        const onWay = edges.some(([a, b]) => toSegment({ x, z }, a, b) < 0.8);
        expect(low && onWay, `${x.toFixed(1)}, ${z.toFixed(1)}`).toBe(false);
      }
    }
  });
});

describe('Le bilan de la Soute', () => {
  it('nomme la partie par son étape, puis dit sa phrase, jamais « entrepôt »', () => {
    const island = PLACE.island as BiomeId;
    const words = placePoseWords(PLACE)!;
    const parties = partiesDe(island);
    expect(parties).toHaveLength(3);
    const said = [0, 1, 2].map((k) => phraseDeLaPose({ posees: [parties[k]], plansFinis: [] }, words));
    expect(said).toEqual(['Partie posée : le corps de la Soute. La halle est debout.', 'Partie posée : le haut de la Soute. La halle a son toit.', 'Partie posée : les abords de la Soute. Le quai est prêt, le navire aussi.']);
    for (const s of said) expect(s).not.toMatch(/entrepôt/i);
  });
});

describe('La scénette de la Soute', () => {
  it('le magasinier, sans prénom, avec sa phrase du métier ; jamais « entrepôt »', () => {
    expect(scenetteOf('soute').role).toBe('Le magasinier');
    expect(scenetteOf('soute').greeting).toBe('Le magasinier range et compte tout ce qui part et tout ce qui arrive.');
    for (const text of [scenetteOf('soute').role, scenetteOf('soute').greeting ?? '']) expect(text).not.toMatch(/entrepôt/i);
  });

  it('la caméra arrive par la porte, tournée le long du quai, dans sa vue d’arrivée basse', () => {
    const door = nodes.get('soute')!;
    const yaw = doorViewOf('soute');
    const look = { x: -Math.sin(yaw), z: -Math.cos(yaw) };
    const to = { x: PLACE.center.x + SOUTE_LAYOUT.doorLook.x - door.x, z: PLACE.center.z + SOUTE_LAYOUT.doorLook.z - door.z };
    expect((look.x * to.x + look.z * to.z) / Math.hypot(to.x, to.z)).toBeGreaterThan(0.99);
    expect(doorFrameOf('soute')!.height).toBeLessThan(0);
  });

  it('elle se joue sur les planches du quai, entre la halle et l’eau, hors du chemin ; ses abords sont enregistrés', () => {
    const { u, v } = SOUTE_LAYOUT.sceneQuay;
    const [hu, hv] = SOUTE_LAYOUT.scene.half;
    expect(u - hu).toBeGreaterThan(SOUTE_LAYOUT.hall.u1);
    expect(u + hu).toBeLessThan(SOUTE_LAYOUT.edge - 0.5);
    expect(v - hv).toBeGreaterThan(SOUTE_LAYOUT.bollard.v + 0.5);
    expect(v + hv).toBeLessThan(SOUTE_LAYOUT.quay.v1);
    expect(SURROUNDINGS.soute).toBeDefined();
    expect(SOUTE_SURROUNDINGS.barrels.length).toBeGreaterThan(0);
  });
});
