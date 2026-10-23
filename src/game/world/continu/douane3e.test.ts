// La Douane (les Alpages du 3e, GD-25, lieu d'option) : le lieu par parties (3 + 1 + 1, d'après les cinq plans de son
// île), une seule lanterne allumée dans la ruine, trois restauré ; une trace par rang de mission avec sa partie, la même
// pour les deux langues ; le bronze aux seules ferrures, jamais de cobalt ; la barrière basse, jamais un bras ; rien le
// long de la rive ; rien sur le chemin de marche ; la porte au sud-est, à côté de la maison, et la vue d'arrivée au
// nord-ouest ; la scénette du porteur ; les plafonds de 1 600 et 1 200 triangles. Sans Three.js.
import { afterEach, describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, retenirReglages } from '../../../core/settings';
import type { BiomeId } from '../../biomes';
import { partShapes, stagePoseWords } from '../../three/archipeo/constructionParts';
import { phraseDeLaPose } from '../../poseWords';
import { partiesDe } from '../parts';
import { plansFor } from '../plans';
import { PLACE_RUIN_TRIANGLES_MAX_3E, PLACE_TRIANGLES_MAX_3E } from './budget';
import { DOUANE, DOUANE_LAYOUT, DOUANE_RANKS } from './douane3e';
import { posedTraces, type PartShape, type Stage } from './construction';
import { boundsOf, type Facets } from './facets';
import { distance, distanceToPolyline, linearRgb } from './geometry';
import { hasHabitantModel } from './habitants';
import { hasScenette, planFor } from './levelPlan';
import { doorFrameOf, doorViewOf } from './northShore';
import { C3E } from './place3eKit';
import { BUILT_PLACES_3E, COLORS_3E, PATH_EDGES_3E, PATH_NODES_3E, UNPRICED_PLACES_3E } from './plan3e';
import { landDistance3e } from './terrain3e';
import { drawPieces, placePieces } from './places';
import { placeTrace } from './questionScene';
import { scenetteOf } from './scenette';
import { standingHeight } from './terrain';
import { heightAt3e } from './terrain3e';

afterEach(() => retenirReglages(null));

const PLAN = planFor('3e');
const PLACE = PLAN.places.find((p) => p.id === 'douane')!;
const MISSIONS = [...BUILT_PLACES_3E.douane];
const SPANISH = MISSIONS.filter((m) => m.startsWith('es-'));
const GERMAN = MISSIONS.filter((m) => m.startsWith('de-'));

const upTo = (n: number): PartShape[] => partShapes(PLACE.island as BiomeId).slice(0, n);
const takes = (parts: readonly PartShape[], stage: Stage, row: number) => parts.some((part) => part.some((s) => s.stage === stage && row >= s.from - 1e-9 && row < s.to - 1e-9));

function shown(n: number): Facets {
  const parts = upTo(n);
  return drawPieces('douane', (p) => (p.stage === 'ruine' ? !p.until || !takes(parts, p.until.stage, p.until.row) : takes(parts, p.stage, p.row)));
}

function countColor(f: Facets, color: number): number {
  const [r, g, b] = linearRgb(color);
  let n = 0;
  for (let i = 0; i < f.colors.length; i += 3) if (Math.abs(f.colors[i] - r) < 1e-4 && Math.abs(f.colors[i + 1] - g) < 1e-4 && Math.abs(f.colors[i + 2] - b) < 1e-4) n++;
  return n;
}

const ground = (x: number, z: number) => standingHeight(heightAt3e({ x, z }));
const nodes = new Map(PATH_NODES_3E.map((n) => [n.id, n.at]));
const traces = (n: number, missions: string[] = SPANISH) => placeTrace('douane', posedTraces('douane', upTo(n), missions));

/** Les noms du titre d'un plan (« Le toit de la bibliothèque » : toit, bibliothèque), sans ses articles, moins « abords ». */
const planNouns = (name: string) =>
  name
    .toLowerCase()
    .split(/[\s’']+/)
    .filter((w) => w.length > 2 && !['les', 'des', 'aux', 'abords'].includes(w));
/** Un mot entier, au singulier ou au pluriel, quelle que soit sa casse. */
const wordRe = (w: string) => new RegExp(`(?<!\\p{L})${w}s?(?!\\p{L})`, 'iu');

describe('La Douane, lieu d’option complet', () => {
  it('ses dix missions, cinq par langue, se jouent dans sa scénette, en cinq parties : trois au corps, le haut, les abords', () => {
    expect(PLACE.scenes).toEqual(MISSIONS);
    expect(MISSIONS).toHaveLength(10);
    expect(hasScenette('douane')).toBe(true);
    expect(hasHabitantModel('douane')).toBe(false);
    for (const lv2 of ['es', 'de'] as const) {
      retenirReglages({ ...DEFAULT_SETTINGS, lv2 });
      expect(
        partShapes(PLACE.island as BiomeId).map((p) => p.map((s) => [s.stage, s.from, s.to])),
        lv2,
      ).toEqual([[[0, 0, 1 / 3]], [[0, 1 / 3, 2 / 3]], [[0, 2 / 3, 1]], [[1, 0, 1]], [[2, 0, 1]]]);
    }
    expect(UNPRICED_PLACES_3E).toContain('douane');
  });

  it('chaque partie pose quelque chose ; la ruine part avec la rangée qui la remplace', () => {
    const pieces = placePieces('douane');
    expect([...new Set(pieces.filter((p) => p.stage === 0).map((p) => p.row))]).toEqual([0, 1 / 3, 2 / 3]);
    for (let n = 1; n <= 5; n++) expect(shown(n).triangles, String(n)).not.toBe(shown(n - 1).triangles);
    const fallen = pieces.filter((p) => p.stage === 'ruine' && p.until).map((p) => `${p.until!.stage}/${p.until!.row}`);
    expect(new Set(fallen)).toEqual(new Set(['0/0', `0/${1 / 3}`, `0/${2 / 3}`, '1/0', '2/0']));
    expect(pieces.filter((p) => p.stage === 'ruine' && !p.until)).toHaveLength(1);
  });

  it('coûte au plus 1 600 triangles à son état le plus chargé, traces comprises ; la ruine, 1 200 au plus', () => {
    let worst = 0;
    for (let n = 0; n <= 5; n++) for (const m of [SPANISH, GERMAN]) worst = Math.max(worst, shown(n).triangles + traces(n, m).triangles);
    expect(worst).toBeLessThanOrEqual(PLACE_TRIANGLES_MAX_3E);
    expect(shown(0).triangles).toBeLessThanOrEqual(PLACE_RUIN_TRIANGLES_MAX_3E);
    expect(DOUANE.reach).toBeUndefined();
  });

  it('une seule lanterne allumée dans la ruine, celle du porteur, à la porte ; une de plus au haut (sous l’auvent), une aux abords ; toutes d’ocre', () => {
    const lit = (n: number) => countColor(shown(n), C3E.lantern);
    expect([0, 1, 2, 3, 4, 5].map(lit)).toEqual([30, 30, 30, 30, 60, 90]);
  });

  it('le bronze aux seules ferrures ; jamais de cobalt (correction 9)', () => {
    expect(countColor(shown(0), C3E.bronze)).toBe(12);
    expect(countColor(shown(5), C3E.bronze)).toBe(3 * 12);
    for (let n = 0; n <= 5; n++) expect(countColor(shown(n), COLORS_3E.cobalt), String(n)).toBe(0);
  });

  it('la barrière, une lisse basse sur deux poteaux, levée d’un quart au plus : jamais un bras ; rien le long de la rive', () => {
    const G = DOUANE_LAYOUT.gate;
    expect(G.raise).toBeLessThanOrEqual(Math.PI / 6);
    expect(G.y + G.len * Math.sin(G.raise)).toBeLessThan(2.6);
    // Tout le lieu, ruine et restauré, à plus de 6 unités de la rive.
    for (const f of [shown(0), shown(5)])
      for (let i = 0; i < f.positions.length; i += 3) {
        const p = { x: f.positions[i] + PLACE.center.x, z: f.positions[i + 2] + PLACE.center.z };
        expect(landDistance3e(p)).toBeGreaterThan(6);
      }
  });

  it('l’herbe sèche de la ruine, d’un ton à part, part avec les abords', () => {
    expect([0, 1, 2, 3, 4, 5].map((n) => countColor(shown(n), C3E.dry) > 0)).toEqual([true, true, true, true, true, false]);
  });

  it('une trace par rang, posée avec sa partie, la même pour les deux langues (au rang 3, « en route »)', () => {
    expect(DOUANE_RANKS.flatMap(([, es, de]) => [es, de]).sort()).toEqual([...MISSIONS].sort());
    for (const [lv2, missions] of [
      ['es', SPANISH],
      ['de', GERMAN],
    ] as const) {
      retenirReglages({ ...DEFAULT_SETTINGS, lv2 });
      const count = (n: number) => posedTraces('douane', upTo(n), missions).length;
      expect([0, 1, 2, 3, 4, 5].map(count), lv2).toEqual([0, 1, 2, 3, 4, 5]);
    }
    for (const [, es, de] of DOUANE_RANKS) expect(DOUANE.traces[es], es).toBe(DOUANE.traces[de]);
  });

  it('un lieu bas : le haut de la cheminée à 4,6 au plus au-dessus du sol', () => {
    expect(boundsOf(shown(5)).max[1]).toBeLessThanOrEqual(4.6);
  });

  it('rien du lieu, en ruine comme restauré, sur le chemin de marche, de part et d’autre de la porte (à hauteur de Kéo)', () => {
    const door = nodes.get('douane')!;
    const ways = [nodes.get('al-4')!];
    const h0 = ground(PLACE.center.x, PLACE.center.z);
    const sets: [Facets, boolean][] = [
      [shown(0), true],
      [shown(5), true],
      [traces(5), false],
      [traces(5, GERMAN), false],
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

describe('La porte de la Douane', () => {
  it('se tient à l’écart des chemins qui passent sans y mener (le chemin des Alpages vers l’ouest, au nord de la halle)', () => {
    const door = nodes.get('douane')!;
    for (const [a, b] of PATH_EDGES_3E) {
      if (a === 'douane' || b === 'douane') continue;
      expect(distanceToPolyline(door, [nodes.get(a)!, nodes.get(b)!]), `${a}-${b}`).toBeGreaterThan(4);
    }
  });
});

describe('Le bilan de la Douane', () => {
  it('nomme la partie par son étape, puis dit la phrase du lieu ; jamais un nom du contenu, « douane » en nom commun, ni un mot de peur', () => {
    const island = PLACE.island as BiomeId;
    const words = stagePoseWords(island, PLACE);
    const parties = partiesDe(island);
    expect(parties).toHaveLength(5);
    const said = [0, 1, 2, 3, 4].map((k) => phraseDeLaPose({ posees: [parties[k]], plansFinis: [] }, words));
    for (const s of said) expect(s).not.toMatch(/Gardien|Mémo/);
    const s = scenetteOf(PLACE.id);
    const texts = [...said, ...(s.words?.pose ?? []), s.words?.end ?? ''];
    for (const plan of plansFor(island))
      for (const text of texts) {
        expect(text).not.toContain(plan.done);
        for (const noun of planNouns(plan.name)) expect(text, noun).not.toMatch(wordRe(noun));
      }
    for (const text of [...(s.words?.pose ?? []), s.words?.end ?? '']) expect(text).not.toMatch(wordRe('abords'));
    for (const text of texts) expect(text).not.toMatch(/vide|chute|tomb|vertige|phare/i);
    for (const text of texts) expect(text).not.toMatch(/(?<!\p{L})douane/u);
    expect(s.words?.pose).toEqual(['La maison est rouverte.', 'Le comptoir est refait.', 'La barrière se lève.', 'Le toit est refait.', 'Les bagages sont rangés.']);
    for (const text of texts) expect(text).not.toMatch(/espagnol|allemand|langue/i);
    expect(s.words?.end).toBe('Ici passaient tous les voyageurs venus d’ailleurs.');
  });
});

describe('La scénette de la Douane', () => {
  it('le porteur, sans prénom, et sa phrase de métier', () => {
    const s = scenetteOf('douane');
    expect(s.role).toBe('Le porteur');
    expect(s.greeting).toBe('Le porteur porte les bagages des voyageurs.');
  });

  it('la caméra arrive par la porte, basse, au nord-ouest (306°, le soleil dans le dos) : la maison à droite de Kéo, la barrière à sa gauche', () => {
    const door = nodes.get('douane')!;
    const yaw = doorViewOf('douane');
    const look = { x: -Math.sin(yaw), z: -Math.cos(yaw) };
    const cap = ((Math.atan2(look.x, -look.z) * 180) / Math.PI + 360) % 360;
    expect(cap).toBeCloseTo(306, 6);
    const offOf = (q: { x: number; z: number }) => {
      const d = { x: q.x - door.x, z: q.z - door.z };
      return (Math.atan2(look.x * d.z - look.z * d.x, look.x * d.x + look.z * d.z) * 180) / Math.PI;
    };
    const house = offOf(PLACE.center);
    expect(house).toBeGreaterThan(18);
    expect(house).toBeLessThan(35);
    const { gate, toLocal } = DOUANE_LAYOUT;
    const g = toLocal(gate.x, (gate.pivot + gate.rest) / 2);
    const barrier = offOf({ x: PLACE.center.x + g.x, z: PLACE.center.z + g.z });
    expect(barrier).toBeLessThan(-8);
    expect(barrier).toBeGreaterThan(-35);
    const frame = doorFrameOf('douane')!;
    expect(frame.height).toBeLessThan(0);
    expect(frame.back).toBeLessThanOrEqual(1.6);
  });

  it('elle se joue au sud-est du guichet, dehors, hors de la maison et du chemin, loin de la porte du lieu', () => {
    const s = DOUANE_LAYOUT.scene;
    const { house, toLocal } = DOUANE_LAYOUT;
    const door = nodes.get('douane')!;
    // Le repère de la maison : x le long de la façade (36°), z vers la façade (126°).
    const X = toLocal(1, 0),
      Z = toLocal(0, 1);
    for (const [sx, sz] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ]) {
      const p = { x: s.dx + sx * s.half[0], z: s.dz + sz * s.half[1] };
      const hx = p.x * X.x + p.z * X.z,
        hz = p.x * Z.x + p.z * Z.z;
      expect(Math.abs(hx) < house.hx + 0.5 && Math.abs(hz) < house.hz + 1.6).toBe(false);
      expect(distanceToPolyline({ x: PLACE.center.x + p.x, z: PLACE.center.z + p.z }, [door, nodes.get('al-4')!])).toBeGreaterThan(1.5);
    }
    expect(distance({ x: PLACE.center.x + s.dx, z: PLACE.center.z + s.dz }, door)).toBeGreaterThan(3);
  });
});
