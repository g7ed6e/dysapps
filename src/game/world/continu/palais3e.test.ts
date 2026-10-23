// Le Palais (les Prairies du 3e, GD-25) : le lieu par parties (2 + 1 + 1, d'après les quatre missions de son île), une
// seule lanterne allumée dans la ruine, trois restauré ; une trace par mission avec sa partie ; le bronze aux seules
// ferrures, jamais de cobalt ; rien sur le chemin de marche ; la porte au sud-sud-ouest, à droite de l'escalier, et la vue
// d'arrivée au nord-nord-est ; le gong à gauche de Kéo, jamais derrière lui ; la scénette du majordome ; les plafonds de
// 1 600 et 1 200 triangles. Sans Three.js.
import { describe, expect, it } from 'vitest';
import type { BiomeId } from '../../biomes';
import { partShapes, stagePoseWords } from '../../three/archipeo/constructionParts';
import { phraseDeLaPose } from '../../poseWords';
import { partiesDe } from '../parts';
import { plansFor } from '../plans';
import { PLACE_RUIN_TRIANGLES_MAX_3E, PLACE_TRIANGLES_MAX_3E } from './budget';
import { PALAIS, PALAIS_LAYOUT } from './palais3e';
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
import { RUINS_3E } from './ruins3e';
import { scenetteOf } from './scenette';
import { standingHeight } from './terrain';
import { heightAt3e } from './terrain3e';

const PLAN = planFor('3e');
const PLACE = PLAN.places.find((p) => p.id === 'palais')!;
const SHAPES = partShapes(PLACE.island as BiomeId);
const MISSIONS = [...BUILT_PLACES_3E.palais];

const upTo = (n: number): PartShape[] => SHAPES.slice(0, n);
const takes = (parts: readonly PartShape[], stage: Stage, row: number) => parts.some((part) => part.some((s) => s.stage === stage && row >= s.from - 1e-9 && row < s.to - 1e-9));

function shown(n: number): Facets {
  const parts = upTo(n);
  return drawPieces('palais', (p) => (p.stage === 'ruine' ? !p.until || !takes(parts, p.until.stage, p.until.row) : takes(parts, p.stage, p.row)));
}

function countColor(f: Facets, color: number): number {
  const [r, g, b] = linearRgb(color);
  let n = 0;
  for (let i = 0; i < f.colors.length; i += 3) if (Math.abs(f.colors[i] - r) < 1e-4 && Math.abs(f.colors[i + 1] - g) < 1e-4 && Math.abs(f.colors[i + 2] - b) < 1e-4) n++;
  return n;
}

const ground = (x: number, z: number) => standingHeight(heightAt3e({ x, z }));
const nodes = new Map(PATH_NODES_3E.map((n) => [n.id, n.at]));
const traces = (n: number) => placeTrace('palais', posedTraces('palais', upTo(n), MISSIONS));

/** Les noms du titre d'un plan (« Le toit de la bibliothèque » : toit, bibliothèque), sans ses articles, moins « abords ». */
const planNouns = (name: string) =>
  name
    .toLowerCase()
    .split(/[\s’']+/)
    .filter((w) => w.length > 2 && !['les', 'des', 'aux', 'abords'].includes(w));
/** Un mot entier, au singulier ou au pluriel, quelle que soit sa casse. */
const wordRe = (w: string) => new RegExp(`(?<!\\p{L})${w}s?(?!\\p{L})`, 'iu');

describe('Le Palais, lieu complet', () => {
  it('ses quatre missions se jouent dans sa scénette, en quatre parties : l’escalier, l’aile droite, le haut, les abords', () => {
    expect(PLACE.scenes).toEqual(MISSIONS);
    expect(MISSIONS).toEqual(['for-since', 'if', 'passive', 'messages']);
    expect(hasScenette('palais')).toBe(true);
    expect(hasHabitantModel('palais')).toBe(false);
    expect(SHAPES.map((p) => p.map((s) => [s.stage, s.from, s.to]))).toEqual([[[0, 0, 0.5]], [[0, 0.5, 1]], [[1, 0, 1]], [[2, 0, 1]]]);
    expect(Object.hasOwn(RUINS_3E, 'palais')).toBe(false);
  });

  it('chaque partie pose quelque chose ; la ruine part avec la partie qui la remplace', () => {
    for (let n = 1; n <= 4; n++) expect(shown(n).triangles, String(n)).not.toBe(shown(n - 1).triangles);
    const ruin = placePieces('palais').filter((p) => p.stage === 'ruine');
    const fallen = ruin.filter((p) => p.until).map((p) => `${p.until!.stage}/${p.until!.row}`);
    expect(new Set(fallen)).toEqual(new Set(['0/0', '0/0.5', '1/0', '2/0']));
    expect(ruin.filter((p) => !p.until)).toHaveLength(1);
    // Seule la ruine attend sa partie : une pièce d’étape avec `until` se dessinerait dans la ruine (fallenFacets).
    expect(placePieces('palais').filter((p) => p.stage !== 'ruine' && p.until)).toHaveLength(0);
  });

  it('coûte au plus 1 600 triangles à son état le plus chargé, traces comprises ; la ruine, 1 200 au plus', () => {
    let worst = 0;
    for (let n = 0; n <= 4; n++) worst = Math.max(worst, shown(n).triangles + traces(n).triangles);
    expect(worst).toBeLessThanOrEqual(PLACE_TRIANGLES_MAX_3E);
    expect(shown(0).triangles).toBeLessThanOrEqual(PLACE_RUIN_TRIANGLES_MAX_3E);
    expect(PALAIS.reach).toBeUndefined();
  });

  it('une seule lanterne allumée dans la ruine, celle du majordome ; une de plus au haut (le perron), une aux abords ; toutes d’ocre', () => {
    const lit = (n: number) => countColor(shown(n), C3E.lantern);
    expect([0, 1, 2, 3, 4].map(lit)).toEqual([30, 30, 30, 60, 90]);
  });

  it('le bronze aux seules ferrures ; le gong de fer, jamais de cobalt (il est à la Coupole)', () => {
    expect(countColor(shown(0), C3E.bronze)).toBe(12);
    expect(countColor(shown(4), C3E.bronze)).toBe(3 * 12);
    for (let n = 0; n <= 4; n++) expect(countColor(shown(n), COLORS_3E.cobalt), String(n)).toBe(0);
    expect(countColor(shown(3), C3E.iron)).toBeGreaterThan(0);
  });

  it('un peu de neige au faîte, en ruine comme restauré', () => {
    for (let n = 0; n <= 4; n++) expect(countColor(shown(n), C3E.snow), String(n)).toBeGreaterThan(0);
  });

  it('l’herbe sèche de la ruine, d’un ton à part, part avec l’aile droite', () => {
    expect([0, 1, 2, 3, 4].map((n) => countColor(shown(n), C3E.dry) > 0)).toEqual([true, true, false, false, false]);
  });

  it('une trace par mission, posée avec sa partie', () => {
    const count = (n: number) => posedTraces('palais', upTo(n), MISSIONS).length;
    expect([0, 1, 2, 3, 4].map(count)).toEqual([0, 1, 2, 3, 4]);
    for (const m of MISSIONS) expect(PALAIS.traces[m], m).toBeDefined();
  });

  it('un palais bas : le faîte à 6,5 au plus au-dessus du sol', () => {
    expect(boundsOf(shown(4)).max[1]).toBeLessThanOrEqual(6.5);
  });

  it('les fenêtres vides de l’aile cassée restent sous le haut ébréché de ses murs', () => {
    // Le creux d’une fenêtre vide ne dépasse jamais du mur qui la porte.
    const L = PALAIS_LAYOUT;
    const f = shown(0);
    const [r, g, b] = linearRgb(L.hollow);
    let n = 0;
    for (let i = 0; i < f.colors.length; i += 3)
      if (Math.abs(f.colors[i] - r) < 1e-4 && Math.abs(f.colors[i + 1] - g) < 1e-4 && Math.abs(f.colors[i + 2] - b) < 1e-4) {
        const p = L.toFrame(f.positions[i], f.positions[i + 2]);
        expect(f.positions[i + 1] - L.base(), p.x.toFixed(1)).toBeLessThan(L.brokenTop(p.x) - 0.3);
        n++;
      }
    expect(n).toBeGreaterThan(0);
  });

  it('rien du lieu, en ruine comme restauré, sur le chemin de marche, de la porte aux arches (à hauteur de Kéo)', () => {
    const door = nodes.get('palais')!;
    const ways = [nodes.get('arc-p')!];
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

describe('Le bilan du Palais', () => {
  it('nomme la partie par son étape, puis dit la phrase du lieu ; jamais un nom du contenu, « palais » en nom commun, ni un mot de peur', () => {
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
    for (const text of [...(s.words?.pose ?? []), s.words?.end ?? '']) expect(text).not.toMatch(wordRe('abords'));
    for (const text of texts) expect(text).not.toMatch(/vide|chute|tomb|vertige|phare/i);
    for (const text of texts) expect(text).not.toMatch(/(?<!\p{L})palais/u);
    for (const text of texts) expect(text).not.toMatch(/Prairie|Parvis/);
    expect(s.words?.pose).toEqual(['L’escalier est refait.', 'L’aile est couverte d’ardoise.', 'Le gong est relevé.', 'L’allée est prête.']);
    expect(s.words?.end).toBe('Ici, on recevait les messagers de tous les archipels.');
  });
});

describe('La scénette du Palais', () => {
  it('le majordome, sans prénom, et sa phrase de métier', () => {
    const s = scenetteOf('palais');
    expect(s.role).toBe('Le majordome');
    expect(s.greeting).toBe('Le majordome reçoit les visiteurs et veille sur la maison.');
  });

  it('la caméra arrive par la porte, basse, au nord-nord-est (27°) : le palais à gauche de Kéo, le gong à sa gauche, jamais derrière lui', () => {
    const door = nodes.get('palais')!;
    const yaw = doorViewOf('palais');
    const look = { x: -Math.sin(yaw), z: -Math.cos(yaw) };
    const cap = ((Math.atan2(look.x, -look.z) * 180) / Math.PI + 360) % 360;
    expect(cap).toBeCloseTo(27, 6);
    const offOf = (p: { x: number; z: number }) => {
      const d = { x: p.x - door.x, z: p.z - door.z };
      return (Math.atan2(look.x * d.z - look.z * d.x, look.x * d.x + look.z * d.z) * 180) / Math.PI;
    };
    // Le palais à gauche du milieu du cadre (relecture du Versant, (b) 1), dans le cadre.
    const off = offOf(PLACE.center);
    expect(off).toBeLessThan(-25);
    expect(off).toBeGreaterThan(-40);
    // Le gong à gauche de Kéo, à l'écart : son portique s'arrête avant lui.
    const L = PALAIS_LAYOUT;
    const right = L.local(L.gong.x + L.gong.half, L.gong.z);
    expect(offOf({ x: PLACE.center.x + right.x, z: PLACE.center.z + right.z })).toBeLessThan(-8);
    const frame = doorFrameOf('palais')!;
    expect(frame.height).toBeLessThan(0);
    expect(frame.back).toBeLessThanOrEqual(1.6);
  });

  it('elle se joue devant l’aile gauche, hors du chemin, loin de la porte du lieu', () => {
    const s = PALAIS_LAYOUT.scene;
    const door = nodes.get('palais')!;
    for (const [sx, sz] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ]) {
      const p = { x: PLACE.center.x + s.dx + sx * s.half[0], z: PLACE.center.z + s.dz + sz * s.half[1] };
      expect(distanceToPolyline(p, [door, nodes.get('arc-p')!])).toBeGreaterThan(1.5);
    }
    expect(distance({ x: PLACE.center.x + s.dx, z: PLACE.center.z + s.dz }, door)).toBeGreaterThan(3);
  });
});
