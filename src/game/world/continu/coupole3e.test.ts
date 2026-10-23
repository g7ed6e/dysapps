// La Coupole (les Prairies du 3e, GD-25) : le lieu par parties (3 + 1 + 1, d'après les cinq missions de son île), une
// seule lanterne allumée dans la ruine, trois restauré ; une trace par mission avec sa partie ; le bronze aux seules
// ferrures ; le cobalt à la coupole, entière ou ouverte, un peu de neige au faîte ; rien sur le chemin de marche ; la porte
// au sud-est de la salle et la vue d'arrivée au nord, la Coupole à gauche de Kéo ; la scénette du libraire ; les plafonds
// de 1 600 et 1 200 triangles. Sans Three.js.
import { describe, expect, it } from 'vitest';
import type { BiomeId } from '../../biomes';
import { partShapes, stagePoseWords } from '../../three/archipeo/constructionParts';
import { phraseDeLaPose } from '../../poseWords';
import { partiesDe } from '../parts';
import { plansFor } from '../plans';
import { PLACE_RUIN_TRIANGLES_MAX_3E, PLACE_TRIANGLES_MAX_3E } from './budget';
import { COUPOLE, COUPOLE_LAYOUT } from './coupole3e';
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
const PLACE = PLAN.places.find((p) => p.id === 'coupole')!;
const SHAPES = partShapes(PLACE.island as BiomeId);
const MISSIONS = [...BUILT_PLACES_3E.coupole];

const upTo = (n: number): PartShape[] => SHAPES.slice(0, n);
const takes = (parts: readonly PartShape[], stage: Stage, row: number) => parts.some((part) => part.some((s) => s.stage === stage && row >= s.from - 1e-9 && row < s.to - 1e-9));

function shown(n: number): Facets {
  const parts = upTo(n);
  return drawPieces('coupole', (p) => (p.stage === 'ruine' ? !p.until || !takes(parts, p.until.stage, p.until.row) : takes(parts, p.stage, p.row)));
}

function countColor(f: Facets, color: number): number {
  const [r, g, b] = linearRgb(color);
  let n = 0;
  for (let i = 0; i < f.colors.length; i += 3) if (Math.abs(f.colors[i] - r) < 1e-4 && Math.abs(f.colors[i + 1] - g) < 1e-4 && Math.abs(f.colors[i + 2] - b) < 1e-4) n++;
  return n;
}

const ground = (x: number, z: number) => standingHeight(heightAt3e({ x, z }));
const nodes = new Map(PATH_NODES_3E.map((n) => [n.id, n.at]));
const traces = (n: number) => placeTrace('coupole', posedTraces('coupole', upTo(n), MISSIONS));

/** Les noms du titre d'un plan (« Le toit de la bibliothèque » : toit, bibliothèque), sans ses articles, moins « abords ». */
const planNouns = (name: string) =>
  name
    .toLowerCase()
    .split(/[\s’']+/)
    .filter((w) => w.length > 2 && !['les', 'des', 'aux', 'abords'].includes(w));
/** Un mot entier, au singulier ou au pluriel, quelle que soit sa casse. */
const wordRe = (w: string) => new RegExp(`(?<!\\p{L})${w}s?(?!\\p{L})`, 'iu');

describe('La Coupole, lieu complet', () => {
  it('ses cinq missions se jouent dans sa scénette, en cinq parties : les murs, la table, les rayonnages, le haut, les abords', () => {
    expect(PLACE.scenes).toEqual(MISSIONS);
    expect(MISSIONS).toEqual(['inference', 'figures-of-speech', 'text-connectives', 'voices', 'literary-eras']);
    expect(hasScenette('coupole')).toBe(true);
    expect(hasHabitantModel('coupole')).toBe(true);
    expect(SHAPES.map((p) => p.map((s) => [s.stage, +s.from.toFixed(3), +s.to.toFixed(3)]))).toEqual([[[0, 0, 0.333]], [[0, 0.333, 0.667]], [[0, 0.667, 1]], [[1, 0, 1]], [[2, 0, 1]]]);
  });

  it('chaque partie pose quelque chose ; la ruine part avec la partie qui la remplace', () => {
    for (let n = 1; n <= 5; n++) expect(shown(n).triangles, String(n)).not.toBe(shown(n - 1).triangles);
    const ruin = placePieces('coupole').filter((p) => p.stage === 'ruine');
    const fallen = ruin.filter((p) => p.until).map((p) => `${p.until!.stage}/${p.until!.row.toFixed(3)}`);
    expect(new Set(fallen)).toEqual(new Set(['0/0.000', '0/0.333', '0/0.667', '1/0.000', '2/0.000']));
    expect(ruin.filter((p) => !p.until)).toHaveLength(1);
    // Seule la ruine attend sa partie : une pièce d’étape avec `until` se dessinerait dans la ruine (fallenFacets).
    expect(placePieces('coupole').filter((p) => p.stage !== 'ruine' && p.until)).toHaveLength(0);
  });

  it('coûte au plus 1 600 triangles à son état le plus chargé, traces comprises ; la ruine, 1 200 au plus', () => {
    let worst = 0;
    for (let n = 0; n <= 5; n++) worst = Math.max(worst, shown(n).triangles + traces(n).triangles);
    expect(worst).toBeLessThanOrEqual(PLACE_TRIANGLES_MAX_3E);
    expect(shown(0).triangles).toBeLessThanOrEqual(PLACE_RUIN_TRIANGLES_MAX_3E);
    expect(COUPOLE.reach).toBeUndefined();
  });

  it('une seule lanterne allumée dans la ruine, celle du libraire ; une de plus au haut (la lampe de la table), une aux abords ; toutes d’ocre', () => {
    const lit = (n: number) => countColor(shown(n), C3E.lantern);
    expect([0, 1, 2, 3, 4, 5].map(lit)).toEqual([30, 30, 30, 30, 60, 90]);
  });

  it('le bronze aux seules ferrures ; l’émail cobalt à la coupole, en ruine comme restaurée, et un peu de neige au faîte', () => {
    expect(countColor(shown(0), C3E.bronze)).toBe(12);
    expect(countColor(shown(5), C3E.bronze)).toBe(3 * 12);
    for (let n = 0; n <= 5; n++) {
      expect(countColor(shown(n), COLORS_3E.cobalt), String(n)).toBeGreaterThan(0);
      expect(countColor(shown(n), C3E.snow), String(n)).toBeGreaterThan(0);
    }
  });

  it('l’herbe sèche de la ruine, d’un ton à part, part avec les abords', () => {
    expect([0, 1, 2, 3, 4, 5].map((n) => countColor(shown(n), C3E.dry) > 0)).toEqual([true, true, true, true, true, false]);
  });

  it('une trace par mission, posée avec sa partie', () => {
    const count = (n: number) => posedTraces('coupole', upTo(n), MISSIONS).length;
    expect([0, 1, 2, 3, 4, 5].map(count)).toEqual([0, 1, 2, 3, 4, 5]);
    for (const m of MISSIONS) expect(COUPOLE.traces[m], m).toBeDefined();
  });

  it('la coupole et son lanterneau à 9 au plus au-dessus du sol', () => {
    expect(boundsOf(shown(5)).max[1]).toBeLessThanOrEqual(9);
  });

  it('rien du lieu, en ruine comme restauré, sur le chemin de marche, de la porte à `pr-2` (à hauteur de Kéo)', () => {
    const door = nodes.get('coupole')!;
    const ways = [nodes.get('pr-2')!];
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
        for (const way of ways) expect(low && distanceToPolyline({ x, z }, [door, way]) < 0.9, `${x.toFixed(1)}, ${z.toFixed(1)}`).toBe(false);
      }
    }
  });
});

describe('Le bilan de la Coupole', () => {
  it('nomme la partie par son étape, puis dit la phrase du lieu ; jamais un nom du contenu, « coupole » en nom commun, ni un mot de peur', () => {
    const island = PLACE.island as BiomeId;
    const words = stagePoseWords(island, PLACE);
    const parties = partiesDe(island);
    expect(parties).toHaveLength(5);
    const said = [0, 1, 2, 3, 4].map((k) => phraseDeLaPose({ posees: [parties[k]], plansFinis: [] }, words));
    for (const s of said) expect(s).not.toMatch(/Gardien|Mémo/);
    const s = scenetteOf(PLACE.id);
    const texts = [...said, ...(s.words?.pose ?? []), s.words?.end ?? ''];
    // Le nom du lieu (« la Coupole », la majuscule le dit) n'est pas le nom commun d'un plan de l'île.
    const common = (t: string) => t.replace(/[Ll]a Coupole/g, '');
    for (const plan of plansFor(island))
      for (const text of texts.map(common)) {
        expect(text).not.toContain(plan.done);
        for (const noun of planNouns(plan.name)) expect(text, noun).not.toMatch(wordRe(noun));
      }
    for (const text of [...(s.words?.pose ?? []), s.words?.end ?? '']) expect(text).not.toMatch(wordRe('abords'));
    for (const text of texts) expect(text).not.toMatch(/vide|chute|tomb|vertige|phare/i);
    for (const text of texts.map(common)) expect(text).not.toMatch(/(?<!\p{L})coupole/iu);
    for (const text of texts) expect(text).not.toMatch(/parvis|Parvis/);
    expect(s.words?.pose).toEqual(['Les murs sont remontés.', 'La table est remise.', 'Les livres sont rangés.', 'Le dôme bleu est refermé.', 'Le seuil est dallé.']);
    expect(s.words?.end).toBe('Ici, on lisait tous les livres des Passeurs.');
  });
});

describe('La scénette de la Coupole', () => {
  it('le libraire, sans prénom et sans phrase de métier (le métier est connu)', () => {
    const s = scenetteOf('coupole');
    expect(s.role).toBe('Le libraire');
    expect(s.greeting).toBeNull();
  });

  it('la caméra arrive par la porte, basse, au nord (0°, le soleil dans le dos) : la Coupole à gauche de Kéo, jamais derrière lui', () => {
    const door = nodes.get('coupole')!;
    const yaw = doorViewOf('coupole');
    const look = { x: -Math.sin(yaw), z: -Math.cos(yaw) };
    const cap = ((Math.atan2(look.x, -look.z) * 180) / Math.PI + 360) % 360;
    expect(cap).toBeCloseTo(0, 6);
    const d = { x: PLACE.center.x - door.x, z: PLACE.center.z - door.z };
    const off = (Math.atan2(look.x * d.z - look.z * d.x, look.x * d.x + look.z * d.z) * 180) / Math.PI;
    expect(off).toBeLessThan(-25);
    expect(off).toBeGreaterThan(-40);
    // Le bord droit de la salle reste à gauche de Kéo.
    expect(door.x - PLACE.center.x).toBeGreaterThan(COUPOLE_LAYOUT.plinth.r + 1);
    const frame = doorFrameOf('coupole')!;
    expect(frame.height).toBeLessThan(0);
    expect(frame.back).toBeLessThanOrEqual(1.6);
  });

  it('elle se joue au seuil, hors du chemin, hors du socle, loin de la porte du lieu', () => {
    const s = COUPOLE_LAYOUT.scene;
    const door = nodes.get('coupole')!;
    for (const [sx, sz] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ]) {
      const p = { x: PLACE.center.x + s.dx + sx * s.half[0], z: PLACE.center.z + s.dz + sz * s.half[1] };
      expect(distanceToPolyline(p, [door, nodes.get('pr-2')!])).toBeGreaterThan(1.5);
      expect(Math.hypot(s.dx + sx * s.half[0], s.dz + sz * s.half[1])).toBeGreaterThan(COUPOLE_LAYOUT.plinth.r);
    }
    expect(distance({ x: PLACE.center.x + s.dx, z: PLACE.center.z + s.dz }, door)).toBeGreaterThan(3);
  });
});
