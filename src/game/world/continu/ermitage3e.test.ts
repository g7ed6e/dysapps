// L'Ermitage (les Alpages du 3e, GD-25, lieu d'option) : le lieu par parties (1 + 1 + 1, d'après les trois plans de son
// île), une seule lanterne allumée dans la ruine, trois restauré ; une trace par rang de mission avec sa partie, la même
// pour le latin et le grec ; le bronze aux seules ferrures, jamais de cobalt ; les pins debout, tous, loin des colonnes ;
// rien sur le chemin de marche ; la porte au nord-est, à côté de la colonnade, et la vue d'arrivée à l'ouest ; la
// scénette de la traductrice ; les plafonds de 1 600 et 1 200 triangles. Sans Three.js.
import { afterEach, describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, retenirReglages } from '../../../core/settings';
import type { BiomeId } from '../../biomes';
import { partShapes, stagePoseWords } from '../../three/archipeo/constructionParts';
import { phraseDeLaPose } from '../../poseWords';
import { partiesDe } from '../parts';
import { plansFor } from '../plans';
import { PLACE_RUIN_TRIANGLES_MAX_3E, PLACE_TRIANGLES_MAX_3E } from './budget';
import { ERMITAGE, ERMITAGE_LAYOUT, ERMITAGE_RANKS } from './ermitage3e';
import { posedTraces, type PartShape, type Stage } from './construction';
import { boundsOf, type Facets } from './facets';
import { distance, distanceToPolyline, linearRgb } from './geometry';
import { hasHabitantModel } from './habitants';
import { hasScenette, planFor } from './levelPlan';
import { doorFrameOf, doorViewOf } from './northShore';
import { C3E } from './place3eKit';
import { BUILT_PLACES_3E, COLORS_3E, PATH_EDGES_3E, PATH_NODES_3E, UNPRICED_PLACES_3E } from './plan3e';
import { drawPieces, placePieces } from './places';
import { placeTrace } from './questionScene';
import { scenetteOf } from './scenette';
import { standingHeight } from './terrain';
import { heightAt3e } from './terrain3e';

afterEach(() => retenirReglages(null));

const PLAN = planFor('3e');
const PLACE = PLAN.places.find((p) => p.id === 'ermitage')!;
const MISSIONS = [...BUILT_PLACES_3E.ermitage];
const LATIN = MISSIONS.filter((m) => m.startsWith('la-'));
const GREEK = MISSIONS.filter((m) => m.startsWith('gr-'));

const upTo = (n: number): PartShape[] => partShapes(PLACE.island as BiomeId).slice(0, n);
const takes = (parts: readonly PartShape[], stage: Stage, row: number) => parts.some((part) => part.some((s) => s.stage === stage && row >= s.from - 1e-9 && row < s.to - 1e-9));

function shown(n: number): Facets {
  const parts = upTo(n);
  return drawPieces('ermitage', (p) => (p.stage === 'ruine' ? !p.until || !takes(parts, p.until.stage, p.until.row) : takes(parts, p.stage, p.row)));
}

function countColor(f: Facets, color: number): number {
  const [r, g, b] = linearRgb(color);
  let n = 0;
  for (let i = 0; i < f.colors.length; i += 3) if (Math.abs(f.colors[i] - r) < 1e-4 && Math.abs(f.colors[i + 1] - g) < 1e-4 && Math.abs(f.colors[i + 2] - b) < 1e-4) n++;
  return n;
}

const ground = (x: number, z: number) => standingHeight(heightAt3e({ x, z }));
const nodes = new Map(PATH_NODES_3E.map((n) => [n.id, n.at]));
const traces = (n: number, missions: string[] = LATIN) => placeTrace('ermitage', posedTraces('ermitage', upTo(n), missions));

/** Les noms du titre d'un plan (« Le toit de la bibliothèque » : toit, bibliothèque), sans ses articles, moins « abords ». */
const planNouns = (name: string) =>
  name
    .toLowerCase()
    .split(/[\s’']+/)
    .filter((w) => w.length > 2 && !['les', 'des', 'aux', 'abords'].includes(w));
/** Un mot entier, au singulier ou au pluriel, quelle que soit sa casse. */
const wordRe = (w: string) => new RegExp(`(?<!\\p{L})${w}s?(?!\\p{L})`, 'iu');

describe('L’Ermitage, lieu d’option complet', () => {
  it('ses six missions, trois par option, se jouent dans sa scénette, en trois parties : le corps, le haut, les abords', () => {
    expect(PLACE.scenes).toEqual(MISSIONS);
    expect(MISSIONS).toHaveLength(6);
    expect(hasScenette('ermitage')).toBe(true);
    expect(hasHabitantModel('ermitage')).toBe(false);
    for (const lca of ['la', 'gr'] as const) {
      retenirReglages({ ...DEFAULT_SETTINGS, lca });
      expect(
        partShapes(PLACE.island as BiomeId).map((p) => p.map((s) => [s.stage, s.from, s.to])),
        lca,
      ).toEqual([[[0, 0, 1]], [[1, 0, 1]], [[2, 0, 1]]]);
    }
    expect(UNPRICED_PLACES_3E).toContain('ermitage');
  });

  it('chaque partie pose quelque chose ; la ruine part avec la partie qui la remplace', () => {
    for (let n = 1; n <= 3; n++) expect(shown(n).triangles, String(n)).not.toBe(shown(n - 1).triangles);
    const ruin = placePieces('ermitage').filter((p) => p.stage === 'ruine');
    const fallen = ruin.filter((p) => p.until).map((p) => `${p.until!.stage}/${p.until!.row}`);
    expect(new Set(fallen)).toEqual(new Set(['0/0', '1/0', '2/0']));
    expect(ruin.filter((p) => !p.until)).toHaveLength(1);
  });

  it('coûte au plus 1 600 triangles à son état le plus chargé, traces comprises ; la ruine, 1 200 au plus', () => {
    let worst = 0;
    for (let n = 0; n <= 3; n++) for (const m of [LATIN, GREEK]) worst = Math.max(worst, shown(n).triangles + traces(n, m).triangles);
    expect(worst).toBeLessThanOrEqual(PLACE_TRIANGLES_MAX_3E);
    expect(shown(0).triangles).toBeLessThanOrEqual(PLACE_RUIN_TRIANGLES_MAX_3E);
    expect(ERMITAGE.reach).toBeUndefined();
  });

  it('une seule lanterne allumée dans la ruine, celle de la traductrice, à l’entrée ; une de plus au haut (au linteau), une aux abords ; toutes d’ocre', () => {
    const lit = (n: number) => countColor(shown(n), C3E.lantern);
    expect([0, 1, 2, 3].map(lit)).toEqual([30, 30, 60, 90]);
  });

  it('le bronze aux seules ferrures ; jamais de cobalt ; l’eau de la fontaine, sombre, jamais presque noire', () => {
    expect(countColor(shown(0), C3E.bronze)).toBe(12);
    expect(countColor(shown(3), C3E.bronze)).toBe(3 * 12);
    for (let n = 0; n <= 3; n++) expect(countColor(shown(n), COLORS_3E.cobalt), String(n)).toBe(0);
    expect(countColor(shown(2), 0x6d8299)).toBe(0);
    expect(countColor(shown(3), 0x6d8299)).toBeGreaterThan(0);
  });

  it('les pins debout, tous, dès la ruine, et bien dégagés des colonnes', () => {
    const { pines, columns } = ERMITAGE_LAYOUT;
    expect(countColor(shown(0), COLORS_3E.pine)).toBe(countColor(shown(3), COLORS_3E.pine));
    for (const p of pines) expect(p.r - columns.r).toBeGreaterThan(4);
  });

  it('l’herbe sèche de la ruine, d’un ton à part, part avec les abords', () => {
    expect([0, 1, 2, 3].map((n) => countColor(shown(n), C3E.dry) > 0)).toEqual([true, true, true, false]);
  });

  it('une trace par rang, posée avec sa partie, la même pour le latin et le grec', () => {
    expect(Object.values(ERMITAGE_RANKS).flat().sort()).toEqual([...MISSIONS].sort());
    for (const [lca, missions] of [
      ['la', LATIN],
      ['gr', GREEK],
    ] as const) {
      retenirReglages({ ...DEFAULT_SETTINGS, lca });
      const count = (n: number) => posedTraces('ermitage', upTo(n), missions).length;
      expect([0, 1, 2, 3].map(count), lca).toEqual([0, 1, 2, 3]);
    }
    for (const [la, gr] of Object.values(ERMITAGE_RANKS)) expect(ERMITAGE.traces[la], la).toBe(ERMITAGE.traces[gr]);
  });

  it('des colonnes basses (2,9 au plus, linteaux compris) ; les pins, 7 au plus', () => {
    const { columns } = ERMITAGE_LAYOUT;
    expect(columns.h + 0.32).toBeLessThanOrEqual(2.9);
    expect(boundsOf(shown(3)).max[1]).toBeLessThanOrEqual(7);
  });

  it('rien du lieu, en ruine comme restauré, sur le chemin de marche, de part et d’autre de la porte (à hauteur de Kéo)', () => {
    const door = nodes.get('ermitage')!;
    const ways = [nodes.get('al-3')!];
    const h0 = ground(PLACE.center.x, PLACE.center.z);
    const sets: [Facets, boolean][] = [
      [shown(0), true],
      [shown(3), true],
      [traces(3), false],
      [traces(3, GREEK), false],
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

describe('La porte de l’Ermitage', () => {
  it('se tient à l’écart des chemins qui passent sans y mener (le chemin des Alpages vers l’ouest, au nord de la halle)', () => {
    const door = nodes.get('ermitage')!;
    for (const [a, b] of PATH_EDGES_3E) {
      if (a === 'ermitage' || b === 'ermitage') continue;
      expect(distanceToPolyline(door, [nodes.get(a)!, nodes.get(b)!]), `${a}-${b}`).toBeGreaterThan(4);
    }
  });
});

describe('Le bilan de l’Ermitage', () => {
  it('nomme la partie par son étape, puis dit la phrase du lieu ; jamais un nom du contenu, « ermitage » en nom commun, ni un mot de peur', () => {
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
    for (const text of texts) expect(text).not.toMatch(/(?<!\p{L})ermitage/u);
    expect(s.words?.pose).toEqual(['La colonnade est debout.', 'Le banc est réparé.', 'La fontaine est pleine.']);
    for (const text of texts) expect(text).not.toMatch(/latin|grec|Rome|Grèce/i);
    expect(s.words?.end).toBe('Ici, on venait réfléchir, à l’ombre des pins.');
  });
});

describe('La scénette de l’Ermitage', () => {
  it('la traductrice, sans prénom, et sa phrase de métier', () => {
    const s = scenetteOf('ermitage');
    expect(s.role).toBe('La traductrice');
    expect(s.greeting).toBe('La traductrice fait passer les mots d’une langue à une autre.');
  });

  it('la caméra arrive par la porte, basse, à l’ouest (270°), le soleil dans le dos : la colonnade à gauche de Kéo, jamais derrière lui', () => {
    const door = nodes.get('ermitage')!;
    const yaw = doorViewOf('ermitage');
    const look = { x: -Math.sin(yaw), z: -Math.cos(yaw) };
    const cap = ((Math.atan2(look.x, -look.z) * 180) / Math.PI + 360) % 360;
    expect(cap).toBeCloseTo(270, 6);
    const d = { x: PLACE.center.x - door.x, z: PLACE.center.z - door.z };
    const off = (Math.atan2(look.x * d.z - look.z * d.x, look.x * d.x + look.z * d.z) * 180) / Math.PI;
    // La colonnade à gauche du milieu du cadre (relecture du Versant, (b) 1), dans le cadre.
    expect(off).toBeLessThan(-20);
    expect(off).toBeGreaterThan(-40);
    const frame = doorFrameOf('ermitage')!;
    expect(frame.height).toBeLessThan(0);
    expect(frame.back).toBeLessThanOrEqual(1.6);
  });

  it('elle se joue à l’est de la colonnade, hors des colonnes, des pins et du chemin, loin de la porte du lieu', () => {
    const s = ERMITAGE_LAYOUT.scene;
    const { columns, pines } = ERMITAGE_LAYOUT;
    const door = nodes.get('ermitage')!;
    for (const [sx, sz] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ]) {
      const x = s.dx + sx * s.half[0],
        z = s.dz + sz * s.half[1];
      expect(Math.hypot(x, z)).toBeGreaterThan(columns.r + 0.5);
      expect(distanceToPolyline({ x: PLACE.center.x + x, z: PLACE.center.z + z }, [door, nodes.get('al-3')!])).toBeGreaterThan(1.5);
    }
    // Aucun pin entre la caméra (à l’est de la scène, elle regarde à l’ouest) et la scène.
    for (const p of pines) {
      const q = { x: p.r * Math.sin((p.cap * Math.PI) / 180), z: -p.r * Math.cos((p.cap * Math.PI) / 180) };
      expect(q.x > s.dx && Math.abs(q.z - s.dz) < 3, `${p.cap}`).toBe(false);
    }
    expect(distance({ x: PLACE.center.x + s.dx, z: PLACE.center.z + s.dz }, door)).toBeGreaterThan(3);
  });
});
