// Le Kiosque (les Alpages du 3e, GD-25) : le lieu par parties (1 + 1 + 1, d'après les trois missions de son île), une
// seule lanterne allumée dans la ruine, trois restauré ; une trace par mission avec sa partie ; le bronze aux seules
// ferrures, jamais de cobalt ; rien sur le chemin de marche ; la porte au sud, à côté de l'axe, et la vue d'arrivée au
// nord ; la scénette de la journaliste ; les plafonds de 1 600 et 1 200 triangles. Sans Three.js.
import { describe, expect, it } from 'vitest';
import type { BiomeId } from '../../biomes';
import { partShapes, stagePoseWords } from '../../three/archipeo/constructionParts';
import { phraseDeLaPose } from '../../poseWords';
import { partiesDe } from '../parts';
import { plansFor } from '../plans';
import { PLACE_RUIN_TRIANGLES_MAX_3E, PLACE_TRIANGLES_MAX_3E } from './budget';
import { KIOSQUE, KIOSQUE_LAYOUT } from './kiosque3e';
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
import { scenetteOf } from './scenette';
import { standingHeight } from './terrain';
import { heightAt3e } from './terrain3e';

const PLAN = planFor('3e');
const PLACE = PLAN.places.find((p) => p.id === 'kiosque')!;
const SHAPES = partShapes(PLACE.island as BiomeId);
const MISSIONS = [...BUILT_PLACES_3E.kiosque];

const upTo = (n: number): PartShape[] => SHAPES.slice(0, n);
const takes = (parts: readonly PartShape[], stage: Stage, row: number) => parts.some((part) => part.some((s) => s.stage === stage && row >= s.from - 1e-9 && row < s.to - 1e-9));

function shown(n: number): Facets {
  const parts = upTo(n);
  return drawPieces('kiosque', (p) => (p.stage === 'ruine' ? !p.until || !takes(parts, p.until.stage, p.until.row) : takes(parts, p.stage, p.row)));
}

function countColor(f: Facets, color: number): number {
  const [r, g, b] = linearRgb(color);
  let n = 0;
  for (let i = 0; i < f.colors.length; i += 3) if (Math.abs(f.colors[i] - r) < 1e-4 && Math.abs(f.colors[i + 1] - g) < 1e-4 && Math.abs(f.colors[i + 2] - b) < 1e-4) n++;
  return n;
}

const ground = (x: number, z: number) => standingHeight(heightAt3e({ x, z }));
const nodes = new Map(PATH_NODES_3E.map((n) => [n.id, n.at]));
const traces = (n: number) => placeTrace('kiosque', posedTraces('kiosque', upTo(n), MISSIONS));

/** Les noms du titre d'un plan (« Le toit de la bibliothèque » : toit, bibliothèque), sans ses articles, moins « abords ». */
const planNouns = (name: string) =>
  name
    .toLowerCase()
    .split(/[\s’']+/)
    .filter((w) => w.length > 2 && !['les', 'des', 'aux', 'abords'].includes(w));
/** Un mot entier, au singulier ou au pluriel, quelle que soit sa casse. */
const wordRe = (w: string) => new RegExp(`(?<!\\p{L})${w}s?(?!\\p{L})`, 'iu');

describe('Le Kiosque, lieu complet', () => {
  it('ses trois missions se jouent dans sa scénette, en trois parties : le corps, le haut, les abords', () => {
    expect(PLACE.scenes).toEqual(MISSIONS);
    expect(MISSIONS).toEqual(['total-wars', 'world-since-1945', 'republic']);
    expect(hasScenette('kiosque')).toBe(true);
    expect(hasHabitantModel('kiosque')).toBe(true);
    expect(SHAPES.map((p) => p.map((s) => [s.stage, s.from, s.to]))).toEqual([[[0, 0, 1]], [[1, 0, 1]], [[2, 0, 1]]]);
  });

  it('chaque partie pose quelque chose ; la ruine part avec la partie qui la remplace', () => {
    for (let n = 1; n <= 3; n++) expect(shown(n).triangles, String(n)).not.toBe(shown(n - 1).triangles);
    const ruin = placePieces('kiosque').filter((p) => p.stage === 'ruine');
    const fallen = ruin.filter((p) => p.until).map((p) => `${p.until!.stage}/${p.until!.row}`);
    expect(new Set(fallen)).toEqual(new Set(['0/0', '1/0', '2/0']));
    expect(ruin.filter((p) => !p.until)).toHaveLength(1);
  });

  it('coûte au plus 1 600 triangles à son état le plus chargé, traces comprises ; la ruine, 1 200 au plus', () => {
    let worst = 0;
    for (let n = 0; n <= 3; n++) worst = Math.max(worst, shown(n).triangles + traces(n).triangles);
    expect(worst).toBeLessThanOrEqual(PLACE_TRIANGLES_MAX_3E);
    expect(shown(0).triangles).toBeLessThanOrEqual(PLACE_RUIN_TRIANGLES_MAX_3E);
    expect(KIOSQUE.reach).toBeUndefined();
  });

  it('une seule lanterne allumée dans la ruine, celle de la journaliste ; une de plus au haut (sous la coupole), une aux abords ; toutes d’ocre', () => {
    const lit = (n: number) => countColor(shown(n), C3E.lantern);
    expect([0, 1, 2, 3].map(lit)).toEqual([30, 30, 60, 90]);
  });

  it('le bronze aux seules ferrures ; la coupole d’ardoise, jamais de cobalt (correction 9)', () => {
    expect(countColor(shown(0), C3E.bronze)).toBe(12);
    expect(countColor(shown(3), C3E.bronze)).toBe(3 * 12);
    for (let n = 0; n <= 3; n++) expect(countColor(shown(n), COLORS_3E.cobalt), String(n)).toBe(0);
    expect(countColor(shown(2), C3E.slate)).toBeGreaterThan(0);
  });

  it('l’herbe sèche de la ruine, d’un ton à part, part avec les abords', () => {
    expect([0, 1, 2, 3].map((n) => countColor(shown(n), C3E.dry) > 0)).toEqual([true, true, true, false]);
  });

  it('une trace par mission, posée avec sa partie', () => {
    const count = (n: number) => posedTraces('kiosque', upTo(n), MISSIONS).length;
    expect([0, 1, 2, 3].map(count)).toEqual([0, 1, 2, 3]);
    for (const m of MISSIONS) expect(KIOSQUE.traces[m], m).toBeDefined();
  });

  it('un lieu bas : le haut de l’épi à 5,5 au plus au-dessus du sol', () => {
    expect(boundsOf(shown(3)).max[1]).toBeLessThanOrEqual(5.5);
  });

  it('rien du lieu, en ruine comme restauré, sur le chemin de marche, de part et d’autre de la porte (à hauteur de Kéo)', () => {
    const door = nodes.get('kiosque')!;
    const ways = [nodes.get('al-1')!, nodes.get('al-2')!];
    const h0 = ground(PLACE.center.x, PLACE.center.z);
    const sets: [Facets, boolean][] = [
      [shown(0), true],
      [shown(3), true],
      [traces(3), false],
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

describe('Le bilan du Kiosque', () => {
  it('nomme la partie par son étape, puis dit la phrase du lieu ; jamais un nom du contenu, « kiosque » en nom commun, ni un mot de peur', () => {
    const island = PLACE.island as BiomeId;
    const words = stagePoseWords(island, PLACE);
    const parties = partiesDe(island);
    expect(parties).toHaveLength(3);
    const said = [0, 1, 2].map((k) => phraseDeLaPose({ posees: [parties[k]], plansFinis: [] }, words));
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
    for (const text of texts) expect(text).not.toMatch(/(?<!\p{L})kiosque/u);
    expect(s.words?.pose).toEqual(['Les six poteaux sont debout.', 'La coupole est remise.', 'Les nouvelles sont arrivées.']);
    expect(s.words?.end).toBe('Ici, les nouvelles du monde montaient jusqu’au sommet.');
  });
});

describe('La scénette du Kiosque', () => {
  it('la journaliste, sans prénom, et sa phrase de métier', () => {
    const s = scenetteOf('kiosque');
    expect(s.role).toBe('La journaliste');
    expect(s.greeting).toBe('La journaliste raconte ce qui se passe dans le monde.');
  });

  it('la caméra arrive par la porte, basse, au nord (0°, le soleil dans le dos) : le kiosque à gauche de Kéo, jamais derrière lui', () => {
    const door = nodes.get('kiosque')!;
    const yaw = doorViewOf('kiosque');
    const look = { x: -Math.sin(yaw), z: -Math.cos(yaw) };
    const cap = ((Math.atan2(look.x, -look.z) * 180) / Math.PI + 360) % 360;
    expect(cap).toBeCloseTo(0, 6);
    const d = { x: PLACE.center.x - door.x, z: PLACE.center.z - door.z };
    const off = (Math.atan2(look.x * d.z - look.z * d.x, look.x * d.x + look.z * d.z) * 180) / Math.PI;
    // Le kiosque à gauche du milieu du cadre (relecture du Versant, (b) 1), dans le cadre.
    expect(off).toBeLessThan(-25);
    expect(off).toBeGreaterThan(-40);
    const frame = doorFrameOf('kiosque')!;
    expect(frame.height).toBeLessThan(0);
    expect(frame.back).toBeLessThanOrEqual(1.6);
  });

  it('elle se joue au sud-ouest du socle, hors du chemin, loin de la porte du lieu', () => {
    const s = KIOSQUE_LAYOUT.scene;
    const door = nodes.get('kiosque')!;
    for (const [sx, sz] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ]) {
      const p = { x: PLACE.center.x + s.dx + sx * s.half[0], z: PLACE.center.z + s.dz + sz * s.half[1] };
      for (const way of ['al-1', 'al-2']) expect(distanceToPolyline(p, [door, nodes.get(way)!])).toBeGreaterThan(1.5);
      expect(Math.hypot(s.dx + sx * s.half[0], s.dz + sz * s.half[1])).toBeGreaterThan(KIOSQUE_LAYOUT.plinth.r);
    }
    expect(distance({ x: PLACE.center.x + s.dx, z: PLACE.center.z + s.dz }, door)).toBeGreaterThan(3);
  });
});
