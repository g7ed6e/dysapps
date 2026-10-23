// La Rampe (le Cirque du 3e, GD-25) : le lieu par parties (1 + 1 + 1, d'après les trois missions de son île), une seule
// lanterne allumée dans la ruine ; une trace par mission avec sa partie ; le haut de la rampe au ras du premier gradin du
// Fanal ; la porte au sud-est du pied, la rampe vue de trois quarts et le Fanal entier au-delà ; la ruine cassée du côté
// de la porte ; rien sur le chemin de marche ; la scénette de la charretière ; les plafonds de 1 600 et 1 200 triangles.
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
import { FANAL_LAYOUT } from './fanal3e';
import { distance, distanceToPolyline, linearRgb } from './geometry';
import { hasHabitantModel } from './habitants';
import { hasScenette, planFor } from './levelPlan';
import { arrivalViewOf, doorViewOf } from './northShore';
import { C3E } from './place3eKit';
import { BUILT_PLACES_3E, COLORS_3E, PATH_NODES_3E, PEAK_3E } from './plan3e';
import { drawPieces, placePieces } from './places';
import { placeTrace } from './questionScene';
import { RAMPE, RAMPE_LAYOUT } from './rampe3e';
import { scenetteOf } from './scenette';
import { standingHeight } from './terrain';
import { heightAt3e } from './terrain3e';

const PLAN = planFor('3e');
const PLACE = PLAN.places.find((p) => p.id === 'rampe')!;
const FANAL = PLAN.places.find((p) => p.id === 'fanal')!;
const SHAPES = partShapes(PLACE.island as BiomeId);
const MISSIONS = [...BUILT_PLACES_3E.rampe];

const upTo = (n: number): PartShape[] => SHAPES.slice(0, n);
const takes = (parts: readonly PartShape[], stage: Stage, row: number) =>
  parts.some((part) => part.some((s) => s.stage === stage && row >= s.from - 1e-9 && row < s.to - 1e-9));

function shown(n: number): Facets {
  const parts = upTo(n);
  return drawPieces('rampe', (p) => (p.stage === 'ruine' ? !p.until || !takes(parts, p.until.stage, p.until.row) : takes(parts, p.stage, p.row)));
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
const traces = (n: number) => placeTrace('rampe', posedTraces('rampe', upTo(n), MISSIONS));
const capTo = (from: { x: number; z: number }, to: { x: number; z: number }) => ((Math.atan2(to.x - from.x, -(to.z - from.z)) * 180) / Math.PI + 360) % 360;
const off = (a: number, b: number) => ((a - b + 540) % 360) - 180;

/** Les noms du titre d'un plan, sans ses articles, moins « abords ». */
const planNouns = (name: string) =>
  name
    .toLowerCase()
    .split(/[\s’']+/)
    .filter((w) => w.length > 2 && !['les', 'des', 'aux', 'abords'].includes(w));
const wordRe = (w: string) => new RegExp(`(?<!\\p{L})${w}s?(?!\\p{L})`, 'iu');

describe('La Rampe, lieu complet', () => {
  it('ses trois missions se jouent dans sa scénette, en trois parties : la rampe, le haut, les abords', () => {
    expect(PLACE.scenes).toEqual(MISSIONS);
    expect(MISSIONS).toEqual(['motion-forces', 'energy-power', 'acids-bases']);
    expect(hasScenette('rampe')).toBe(true);
    expect(hasHabitantModel('rampe')).toBe(false);
    expect(SHAPES.map((p) => p.map((s) => [s.stage, s.from, s.to]))).toEqual([[[0, 0, 1]], [[1, 0, 1]], [[2, 0, 1]]]);
  });

  it('chaque partie pose quelque chose ; la ruine part avec la partie qui la remplace', () => {
    for (let n = 1; n <= 3; n++) expect(shown(n).triangles, String(n)).not.toBe(shown(n - 1).triangles);
    const ruin = placePieces('rampe').filter((p) => p.stage === 'ruine');
    expect(new Set(ruin.filter((p) => p.until).map((p) => `${p.until!.stage}/${p.until!.row}`))).toEqual(new Set(['0/0', '1/0', '2/0']));
    expect(ruin.filter((p) => !p.until)).toHaveLength(1);
  });

  it('coûte au plus 1 600 triangles à son état le plus chargé, traces comprises ; la ruine, 1 200 au plus', () => {
    let worst = 0;
    for (let n = 0; n <= 3; n++) worst = Math.max(worst, shown(n).triangles + traces(n).triangles);
    expect(worst).toBeLessThanOrEqual(PLACE_TRIANGLES_MAX_3E);
    expect(shown(0).triangles).toBeLessThanOrEqual(PLACE_RUIN_TRIANGLES_MAX_3E);
  });

  it('une seule lanterne allumée dans la ruine, celle de la charretière ; une de plus aux abords ; le bronze aux seules lanternes ; rien de presque noir', () => {
    expect([0, 1, 2, 3].map((n) => countColor(shown(n), C3E.lantern))).toEqual([30, 30, 30, 60]);
    expect([0, 1, 2, 3].map((n) => countColor(shown(n), C3E.bronze))).toEqual([12, 12, 12, 24]);
    for (let n = 0; n <= 3; n++) {
      const f = shown(n);
      expect(countColor(f, COLORS_3E.cobalt)).toBe(0);
      for (let i = 0; i < f.colors.length; i += 3) expect(Math.max(f.colors[i], f.colors[i + 1], f.colors[i + 2])).toBeGreaterThan(0.04);
    }
  });

  it('l’herbe sèche part avec les abords ; une trace par mission, posée avec sa partie', () => {
    expect([0, 1, 2, 3].map((n) => countColor(shown(n), C3E.dry) > 0)).toEqual([true, true, true, false]);
    expect([0, 1, 2, 3].map((n) => posedTraces('rampe', upTo(n), MISSIONS).length)).toEqual([0, 1, 2, 3]);
  });

  it('la rampe monte de l’herbe jusqu’au ras du premier gradin du Fanal, contre sa façade est, en pente douce', () => {
    const { top, ramp, length, fanalAt } = RAMPE_LAYOUT;
    // Le haut contre la façade est du socle, entre ses deux bouts.
    expect(top.x).toBeCloseTo(fanalAt.x + FANAL_LAYOUT.socle.low.x, 6);
    const zf = top.z - fanalAt.z;
    expect(zf - ramp.width / 2 - ramp.wall).toBeGreaterThan(FANAL_LAYOUT.socle.low.z0);
    expect(zf + ramp.width / 2 + ramp.wall).toBeLessThan(FANAL_LAYOUT.socle.low.z1);
    // Le dallage en haut au ras du gradin du Fanal (dans le repère du monde).
    const gradin = ground(FANAL.center.x, FANAL.center.z) + FANAL_LAYOUT.base() + FANAL_LAYOUT.socle.low.top;
    expect(ground(PLACE.center.x, PLACE.center.z) + RAMPE_LAYOUT.deckY(length)).toBeCloseTo(gradin, 1);
    const slope = (ramp.top - ramp.foot) / length;
    expect(slope).toBeGreaterThan(0.08);
    expect(slope).toBeLessThan(0.2);
  });

  it('rien du lieu, en ruine comme restauré, sur le chemin de marche, de la porte à `col-c`, ni sur le chemin du Fanal', () => {
    const ways = [
      [nodes.get('rampe')!, nodes.get('col-c')!],
      [nodes.get('ci-1')!, nodes.get('fanal')!],
      [nodes.get('col-c')!, nodes.get('ci-1')!],
    ];
    const h0 = ground(PLACE.center.x, PLACE.center.z);
    for (const [f, local] of [
      [shown(0), true],
      [shown(3), true],
      [traces(3), false],
    ] as const) {
      for (let i = 0; i < f.positions.length; i += 9) {
        const x = (f.positions[i] + f.positions[i + 3] + f.positions[i + 6]) / 3 + (local ? PLACE.center.x : 0);
        const z = (f.positions[i + 2] + f.positions[i + 5] + f.positions[i + 8]) / 3 + (local ? PLACE.center.z : 0);
        const y = Math.min(f.positions[i + 1], f.positions[i + 4], f.positions[i + 7]) + (local ? h0 : 0);
        const low = y - ground(x, z) < 1.8;
        for (const way of ways) expect(low && distanceToPolyline({ x, z }, way) < 0.9, `${x.toFixed(1)}, ${z.toFixed(1)}`).toBe(false);
      }
    }
  });

  it('le râtelier des Ferrailleurs, au pied du Fanal, reste loin de la rampe, de son cabestan et de son contrepoids', () => {
    const b = boundsOf(shown(3));
    const rack = FANAL_LAYOUT.ret.rackAt;
    const rackLocal = { x: FANAL.center.x + rack.x - PLACE.center.x, z: FANAL.center.z + rack.z - PLACE.center.z };
    const K = RAMPE_LAYOUT.capstan;
    expect(distance(RAMPE_LAYOUT.local(K.x, K.z), rackLocal)).toBeGreaterThan(3.5);
    // Le râtelier, long de 3,9 nord-sud, au sud du bout de la rampe.
    expect(rackLocal.z - 2).toBeGreaterThan(RAMPE_LAYOUT.local(RAMPE_LAYOUT.length, -RAMPE_LAYOUT.ramp.width / 2 - RAMPE_LAYOUT.ramp.wall).z + 1);
    expect(b.max[1]).toBeLessThan(10);
  });
});

describe('Le bilan de la Rampe', () => {
  it('nomme la partie par son étape, puis dit la phrase du lieu ; jamais un nom de plan, ni un mot de peur', () => {
    const island = PLACE.island as BiomeId;
    const words = stagePoseWords(island, PLACE);
    const parties = partiesDe(island);
    expect(parties).toHaveLength(3);
    const said = [0, 1, 2].map((k) => phraseDeLaPose({ posees: [parties[k]], plansFinis: [] }, words));
    const s = scenetteOf(PLACE.id);
    const texts = [...said, ...(s.words?.pose ?? []), s.words?.end ?? '', s.greeting ?? ''];
    for (const plan of plansFor(island))
      for (const text of texts) {
        expect(text).not.toContain(plan.done);
        for (const noun of planNouns(plan.name)) expect(text, noun).not.toMatch(wordRe(noun));
      }
    for (const text of texts) expect(text).not.toMatch(/vide|chute|tomb|vertige|phare|versant|peur|noir/i);
    expect(s.words?.pose).toEqual(['La rampe est refaite.', 'Le cabestan est prêt.', 'Le traîneau est chargé.']);
    expect(s.words?.end).toBe('Ici, on a hissé toutes les pierres du Fanal.');
    expect(s.role).toBe('La charretière');
    expect(s.greeting).toBe('La charretière mène les pierres jusqu’au Fanal.');
  });
});

describe('La porte et la scénette de la Rampe', () => {
  const door = nodes.get('rampe')!;
  const w = (p: { x: number; z: number }) => ({ x: PLACE.center.x + p.x, z: PLACE.center.z + p.z });

  it('de la porte, au sud-est du pied : la rampe de trois quarts, son pied à droite, son haut à gauche, le Fanal au-delà, dans le cadre', () => {
    const cap = RAMPE_LAYOUT.doorCap;
    expect(doorViewOf('rampe')).toBeCloseTo(((360 - cap) * Math.PI) / 180, 6);
    const foot = off(capTo(door, w(RAMPE_LAYOUT.foot)), cap);
    const top = off(capTo(door, w(RAMPE_LAYOUT.top)), cap);
    const fanal = off(capTo(door, FANAL.center), cap);
    expect(foot).toBeGreaterThan(4);
    expect(top).toBeLessThan(-4);
    expect(foot).toBeLessThan(30);
    expect(fanal).toBeGreaterThan(-32);
    expect(fanal).toBeLessThan(top);
    // De trois quarts : la pente et le regard font entre 30° et 60°.
    const along = capTo(RAMPE_LAYOUT.foot, RAMPE_LAYOUT.top);
    expect(Math.abs(off(along, cap))).toBeGreaterThan(30);
    expect(Math.abs(off(along, cap))).toBeLessThan(65);
    const view = arrivalViewOf('rampe')!;
    expect(view.back).toBeLessThanOrEqual(1.6);
    expect(view.top).toBeGreaterThan(20);
  });

  it('la scène se joue sur l’herbe, hors des chemins, loin de la porte, le regard dos au pic', () => {
    const s = RAMPE_LAYOUT.scene;
    const ways = [
      [door, nodes.get('col-c')!],
      [nodes.get('col-c')!, nodes.get('ci-1')!],
    ];
    for (const [sx, sz] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ]) {
      const p = { x: PLACE.center.x + s.dx + sx * s.half[0], z: PLACE.center.z + s.dz + sz * s.half[1] };
      for (const way of ways) expect(distanceToPolyline(p, way)).toBeGreaterThan(1.5);
    }
    expect(distance({ x: PLACE.center.x + s.dx, z: PLACE.center.z + s.dz }, door)).toBeGreaterThan(3);
    const start = RAMPE.site!.start!;
    const look = { x: -Math.sin(start), z: -Math.cos(start) };
    const pic = { x: PEAK_3E.at.x - PLACE.center.x, z: PEAK_3E.at.z - PLACE.center.z };
    expect(look.x * pic.x + look.z * pic.z).toBeLessThan(0);
  });
});
