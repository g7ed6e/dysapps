// Le Standard (le Cirque du 3e, GD-25) : le lieu par parties (2 + 1 + 1, d'après les quatre missions de son île), une
// seule lanterne allumée dans la ruine ; les lampes témoins éteintes jusqu'au haut, allumées ensemble ; une trace par
// mission avec sa partie ; la ligne des poteaux hors du modèle (`reach`), en ruine trois poteaux dont un penché, puis
// six debout et leurs fils jusqu'à la ferrure du Fanal ; rien sur le chemin de marche ; la porte à l'est-sud-est et la
// vue d'arrivée à l'ouest-nord-ouest, la salle de face, le premier poteau et le Lac dans le cadre ; la scénette de la
// télégraphiste ; les plafonds de 1 600 et 1 200 triangles. Sans Three.js.
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
import { doorViewOf } from './northShore';
import { C3E } from './place3eKit';
import { BUILT_PLACES_3E, COLORS_3E, PATH_NODES_3E, PEAK_3E } from './plan3e';
import { drawPieces, placePieces } from './places';
import { placeTrace } from './questionScene';
import { scenetteOf } from './scenette';
import { STANDARD, STANDARD_LAYOUT } from './standard3e';
import { standingHeight } from './terrain';
import { heightAt3e } from './terrain3e';

const PLAN = planFor('3e');
const PLACE = PLAN.places.find((p) => p.id === 'standard')!;
const FANAL = PLAN.places.find((p) => p.id === 'fanal')!;
const SHAPES = partShapes(PLACE.island as BiomeId);
const MISSIONS = [...BUILT_PLACES_3E.standard];

const upTo = (n: number): PartShape[] => SHAPES.slice(0, n);
const takes = (parts: readonly PartShape[], stage: Stage, row: number) =>
  parts.some((part) => part.some((s) => s.stage === stage && row >= s.from - 1e-9 && row < s.to - 1e-9));

function shown(n: number): Facets {
  const parts = upTo(n);
  return drawPieces('standard', (p) => (p.stage === 'ruine' ? !p.until || !takes(parts, p.until.stage, p.until.row) : takes(parts, p.stage, p.row)));
}

function countColor(f: Facets, color: number): number {
  const [r, g, b] = linearRgb(color);
  let n = 0;
  for (let i = 0; i < f.colors.length; i += 3)
    if (Math.abs(f.colors[i] - r) < 1e-4 && Math.abs(f.colors[i + 1] - g) < 1e-4 && Math.abs(f.colors[i + 2] - b) < 1e-4) n++;
  return n;
}

const ground = (x: number, z: number) => standingHeight(heightAt3e({ x, z }));
const h0 = ground(PLACE.center.x, PLACE.center.z);
const origin = { x: PLACE.center.x, y: h0, z: PLACE.center.z };
const reach = (done: boolean) => STANDARD.reach!(origin, (stage) => done && stage === 2)!;
const nodes = new Map(PATH_NODES_3E.map((n) => [n.id, n.at]));
const traces = (n: number) => placeTrace('standard', posedTraces('standard', upTo(n), MISSIONS));
const capTo = (from: { x: number; z: number }, to: { x: number; z: number }) => ((Math.atan2(to.x - from.x, -(to.z - from.z)) * 180) / Math.PI + 360) % 360;
const off = (a: number, b: number) => ((a - b + 540) % 360) - 180;

/** Les noms du titre d'un plan, sans ses articles, moins « abords ». */
const planNouns = (name: string) =>
  name
    .toLowerCase()
    .split(/[\s’']+/)
    .filter((w) => w.length > 2 && !['les', 'des', 'aux', 'abords'].includes(w));
const wordRe = (w: string) => new RegExp(`(?<!\\p{L})${w}s?(?!\\p{L})`, 'iu');

describe('Le Standard, lieu complet', () => {
  it('ses quatre missions se jouent dans sa scénette, en quatre parties : la salle, le tableau, le haut, les abords', () => {
    expect(PLACE.scenes).toEqual(MISSIONS);
    expect(MISSIONS).toEqual(['computer-networks', 'connected-objects', 'algorithms', 'data-tables']);
    expect(hasScenette('standard')).toBe(true);
    expect(hasHabitantModel('standard')).toBe(true);
    expect(SHAPES.map((p) => p.map((s) => [s.stage, +s.from.toFixed(3), +s.to.toFixed(3)]))).toEqual([[[0, 0, 0.5]], [[0, 0.5, 1]], [[1, 0, 1]], [[2, 0, 1]]]);
  });

  it('chaque partie pose quelque chose ; la ruine part avec la partie qui la remplace', () => {
    for (let n = 1; n <= 4; n++) expect(shown(n).triangles, String(n)).not.toBe(shown(n - 1).triangles);
    const ruin = placePieces('standard').filter((p) => p.stage === 'ruine');
    const fallen = ruin.filter((p) => p.until).map((p) => `${p.until!.stage}/${p.until!.row.toFixed(3)}`);
    expect(new Set(fallen)).toEqual(new Set(['0/0.000', '0/0.500', '1/0.000', '2/0.000']));
    expect(ruin.filter((p) => !p.until)).toHaveLength(1);
  });

  it('coûte au plus 1 600 triangles à son état le plus chargé, traces comprises ; la ruine, 1 200 au plus ; la ligne des poteaux, 700 au plus', () => {
    let worst = 0;
    for (let n = 0; n <= 4; n++) worst = Math.max(worst, shown(n).triangles + traces(n).triangles);
    expect(worst).toBeLessThanOrEqual(PLACE_TRIANGLES_MAX_3E);
    expect(shown(0).triangles).toBeLessThanOrEqual(PLACE_RUIN_TRIANGLES_MAX_3E);
    expect(reach(true).triangles).toBeLessThanOrEqual(700);
    expect(reach(false).triangles).toBeLessThan(reach(true).triangles);
  });

  it('une seule lanterne allumée dans la ruine, celle de la télégraphiste ; les lampes témoins s’allument ensemble au haut, avec la lanterne de la façade ; une aux abords', () => {
    const lamps = STANDARD_LAYOUT.lamps.xs.length * 30;
    expect([0, 1, 2, 3, 4].map((n) => countColor(shown(n), C3E.lantern))).toEqual([30, 30, 30, 60 + lamps, 90 + lamps]);
    expect([0, 1, 2, 3, 4].map((n) => countColor(shown(n), C3E.lanternOff))).toEqual([lamps, lamps, lamps, 0, 0]);
    expect([0, 1, 2, 3, 4].map((n) => countColor(shown(n), C3E.bronze))).toEqual([12, 12, 12, 24, 36]);
  });

  it('jamais de cobalt ni rien de presque noir ; un peu de neige au faîte, en ruine comme restaurée', () => {
    for (let n = 0; n <= 4; n++) {
      const f = shown(n);
      expect(countColor(f, COLORS_3E.cobalt)).toBe(0);
      expect(countColor(f, C3E.snow), String(n)).toBeGreaterThan(0);
      for (let i = 0; i < f.colors.length; i += 3) expect(Math.max(f.colors[i], f.colors[i + 1], f.colors[i + 2])).toBeGreaterThan(0.04);
    }
  });

  it('l’herbe sèche part avec les abords ; une trace par mission, posée avec sa partie', () => {
    expect([0, 1, 2, 3, 4].map((n) => countColor(shown(n), C3E.dry) > 0)).toEqual([true, true, true, true, false]);
    expect([0, 1, 2, 3, 4].map((n) => posedTraces('standard', upTo(n), MISSIONS).length)).toEqual([0, 1, 2, 3, 4]);
    for (const m of MISSIONS) expect(STANDARD.traces[m], m).toBeDefined();
  });

  it('six poteaux en ligne droite, à pas égaux, du pignon de la salle jusqu’à l’ouest du Fanal ; les fils s’attachent sous la tour, au second gradin', () => {
    const line = STANDARD_LAYOUT.line;
    expect(line).toHaveLength(6);
    const steps = line.slice(1).map((p, k) => distance(p, line[k]));
    for (const s of steps) expect(s).toBeCloseTo(steps[0], 6);
    expect(steps[0]).toBeGreaterThan(7);
    expect(steps[0]).toBeLessThan(10);
    const fanal = STANDARD_LAYOUT.fanalAt;
    const last = line[5];
    expect(fanal.x - last.x).toBeGreaterThan(FANAL_LAYOUT.socle.low.x + 1);
    const hook = STANDARD_LAYOUT.fanalHook;
    const towerBase = ground(FANAL.center.x, FANAL.center.z) + FANAL_LAYOUT.base() + FANAL_LAYOUT.tower.y0;
    expect(h0 + hook.y).toBeLessThan(towerBase);
    expect(h0 + hook.y).toBeGreaterThan(ground(FANAL.center.x, FANAL.center.z) + FANAL_LAYOUT.base() + FANAL_LAYOUT.socle.low.top);
    // Les fils posés montent jusqu'à la ferrure : le haut de la ligne, au-dessus du premier gradin du Fanal.
    const b = boundsOf(reach(true));
    expect(b.max[0]).toBeGreaterThan(FANAL.center.x - FANAL_LAYOUT.socle.high.x - 0.5);
    expect(b.max[0]).toBeLessThan(FANAL.center.x - FANAL_LAYOUT.socle.high.x + 0.3);
  });

  it('rien du lieu, en ruine comme restauré, ni de sa ligne de poteaux, sur le chemin de marche, de la porte au Fanal', () => {
    const ways = [
      [nodes.get('standard')!, nodes.get('ci-2')!],
      [nodes.get('ci-2')!, nodes.get('ci-1')!],
      [nodes.get('ci-1')!, nodes.get('fanal')!],
    ];
    for (const [f, local] of [
      [shown(0), true],
      [shown(4), true],
      [traces(4), false],
      [reach(false), false],
      [reach(true), false],
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
});

describe('Le bilan du Standard', () => {
  it('nomme la partie par son étape, puis dit la phrase du lieu ; jamais un nom de plan, ni « standard », ni un mot de peur', () => {
    const island = PLACE.island as BiomeId;
    const words = stagePoseWords(island, PLACE);
    const parties = partiesDe(island);
    expect(parties).toHaveLength(4);
    const said = [0, 1, 2, 3].map((k) => phraseDeLaPose({ posees: [parties[k]], plansFinis: [] }, words));
    const s = scenetteOf(PLACE.id);
    const texts = [...said, ...(s.words?.pose ?? []), s.words?.end ?? '', s.greeting ?? ''];
    for (const plan of plansFor(island))
      for (const text of texts) {
        expect(text).not.toContain(plan.done);
        for (const noun of planNouns(plan.name)) expect(text, noun).not.toMatch(wordRe(noun));
      }
    for (const text of texts) expect(text).not.toMatch(/vide|chute|tomb|vertige|phare|versant|peur|noir|ruche|piquet/i);
    // « Standard » reste le nom du lieu (« le corps du Standard ») ; jamais un mot commun.
    for (const text of texts) expect(text).not.toMatch(/standard/);
    expect(s.words?.pose).toEqual(['La salle est couverte.', 'Le tableau est redressé.', 'Les lampes sont allumées.', 'Les fils vont jusqu’au Fanal.']);
    expect(s.words?.end).toBe('D’ici, les messages partaient vers les autres archipels.');
    expect(s.role).toBe('La télégraphiste');
    expect(s.greeting).toBe('La télégraphiste envoie les messages par les fils.');
  });
});

describe('La porte et la scénette du Standard', () => {
  const door = nodes.get('standard')!;
  const w = (p: { x: number; z: number }) => ({ x: PLACE.center.x + p.x, z: PLACE.center.z + p.z });

  it('de la porte, à l’est-sud-est : la salle de face, le premier poteau à droite, le Lac au-delà, dans le cadre', () => {
    expect(doorViewOf('standard')).toBeCloseTo(((360 - 297) * Math.PI) / 180, 6);
    expect(capTo(w({ x: 0, z: 0 }), door)).toBeCloseTo(STANDARD_LAYOUT.facing, -1);
    const pole = off(capTo(door, w(STANDARD_LAYOUT.line[0])), 297);
    expect(pole).toBeGreaterThan(15);
    expect(pole).toBeLessThan(31);
    const lac = off(capTo(door, { x: -105.6, z: -148.6 }), 297);
    expect(lac).toBeGreaterThan(5);
    expect(lac).toBeLessThan(pole - 4);
  });

  it('la scène se joue sur l’herbe, hors des chemins, loin de la porte, le regard dos au pic', () => {
    const s = STANDARD_LAYOUT.scene;
    const ways = [[door, nodes.get('ci-2')!]];
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
    const start = STANDARD.site!.start!;
    const look = { x: -Math.sin(start), z: -Math.cos(start) };
    const pic = { x: PEAK_3E.at.x - PLACE.center.x, z: PEAK_3E.at.z - PLACE.center.z };
    expect(look.x * pic.x + look.z * pic.z).toBeLessThan(0);
  });
});
