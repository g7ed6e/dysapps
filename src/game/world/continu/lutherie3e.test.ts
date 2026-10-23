// La Lutherie (les Prairies du 3e, GD-25) : le lieu par parties (3 + 1 + 1, d'après les cinq missions de son île, lieu du
// monde ouvert seulement), une seule lanterne allumée dans la ruine, trois restaurée ; une trace par mission avec sa
// partie ; le bronze aux seules ferrures, jamais de cobalt ; les instruments du plus grand au plus petit, debout ou
// couchés ; le toit tombé qui penche ; rien sur le chemin de marche ; la porte à l'est et la vue d'arrivée à l'ouest, les
// instruments à gauche de Kéo ; la scénette de l'accordeur ; les plafonds de 1 600 et 1 200 triangles. Sans Three.js.
import { describe, expect, it } from 'vitest';
import type { BiomeId } from '../../biomes';
import { partShapes, stagePoseWords } from '../../three/archipeo/constructionParts';
import { phraseDeLaPose } from '../../poseWords';
import { partiesDe } from '../parts';
import { plansFor } from '../plans';
import { PLACE_RUIN_TRIANGLES_MAX_3E, PLACE_TRIANGLES_MAX_3E } from './budget';
import { LUTHERIE, LUTHERIE_LAYOUT } from './lutherie3e';
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
import { heightAt3e, landDistance3e } from './terrain3e';

const PLAN = planFor('3e');
const PLACE = PLAN.places.find((p) => p.id === 'lutherie')!;
const SHAPES = partShapes(PLACE.island as BiomeId);
const MISSIONS = [...BUILT_PLACES_3E.lutherie];

const upTo = (n: number): PartShape[] => SHAPES.slice(0, n);
const takes = (parts: readonly PartShape[], stage: Stage, row: number) => parts.some((part) => part.some((s) => s.stage === stage && row >= s.from - 1e-9 && row < s.to - 1e-9));

function shown(n: number): Facets {
  const parts = upTo(n);
  return drawPieces('lutherie', (p) => (p.stage === 'ruine' ? !p.until || !takes(parts, p.until.stage, p.until.row) : takes(parts, p.stage, p.row)));
}

function countColor(f: Facets, color: number): number {
  const [r, g, b] = linearRgb(color);
  let n = 0;
  for (let i = 0; i < f.colors.length; i += 3) if (Math.abs(f.colors[i] - r) < 1e-4 && Math.abs(f.colors[i + 1] - g) < 1e-4 && Math.abs(f.colors[i + 2] - b) < 1e-4) n++;
  return n;
}

const ground = (x: number, z: number) => standingHeight(heightAt3e({ x, z }));
const nodes = new Map(PATH_NODES_3E.map((n) => [n.id, n.at]));
const traces = (n: number) => placeTrace('lutherie', posedTraces('lutherie', upTo(n), MISSIONS));

/** Les noms du titre d'un plan (« Le toit de la bibliothèque » : toit, bibliothèque), sans ses articles, moins « abords ». */
const planNouns = (name: string) =>
  name
    .toLowerCase()
    .split(/[\s’']+/)
    .filter((w) => w.length > 2 && !['les', 'des', 'aux', 'abords'].includes(w));
/** Un mot entier, au singulier ou au pluriel, quelle que soit sa casse. */
const wordRe = (w: string) => new RegExp(`(?<!\\p{L})${w}s?(?!\\p{L})`, 'iu');

describe('La Lutherie, lieu complet', () => {
  it('ses cinq missions se jouent dans sa scénette, en cinq parties : les murs, l’établi, les instruments, le haut, les abords', () => {
    expect(PLACE.scenes).toEqual(MISSIONS);
    expect(MISSIONS).toEqual(['verb-moods', 'complex-agreements', 'connotation', 'emphasis-punctuation', 'verb-stems']);
    expect(hasScenette('lutherie')).toBe(true);
    expect(hasHabitantModel('lutherie')).toBe(false);
    expect(SHAPES.map((p) => p.map((s) => [s.stage, +s.from.toFixed(3), +s.to.toFixed(3)]))).toEqual([[[0, 0, 0.333]], [[0, 0.333, 0.667]], [[0, 0.667, 1]], [[1, 0, 1]], [[2, 0, 1]]]);
    expect(Object.hasOwn(RUINS_3E, 'lutherie')).toBe(false);
  });

  it('chaque partie pose quelque chose ; la ruine part avec la partie qui la remplace', () => {
    for (let n = 1; n <= 5; n++) expect(shown(n).triangles, String(n)).not.toBe(shown(n - 1).triangles);
    const ruin = placePieces('lutherie').filter((p) => p.stage === 'ruine');
    const fallen = ruin.filter((p) => p.until).map((p) => `${p.until!.stage}/${p.until!.row.toFixed(3)}`);
    expect(new Set(fallen)).toEqual(new Set(['0/0.000', '0/0.333', '0/0.667', '1/0.000', '2/0.000']));
    expect(ruin.filter((p) => !p.until)).toHaveLength(1);
    // Seule la ruine attend sa partie : une pièce d’étape avec `until` se dessinerait dans la ruine (fallenFacets).
    expect(placePieces('lutherie').filter((p) => p.stage !== 'ruine' && p.until)).toHaveLength(0);
  });

  it('coûte au plus 1 600 triangles à son état le plus chargé, traces comprises ; la ruine, 1 200 au plus', () => {
    let worst = 0;
    for (let n = 0; n <= 5; n++) worst = Math.max(worst, shown(n).triangles + traces(n).triangles);
    expect(worst).toBeLessThanOrEqual(PLACE_TRIANGLES_MAX_3E);
    expect(shown(0).triangles).toBeLessThanOrEqual(PLACE_RUIN_TRIANGLES_MAX_3E);
    expect(LUTHERIE.reach).toBeUndefined();
  });

  it('une seule lanterne allumée dans la ruine, celle de l’accordeur ; une de plus au haut (l’atelier), une aux abords ; toutes d’ocre', () => {
    const lit = (n: number) => countColor(shown(n), C3E.lantern);
    expect([0, 1, 2, 3, 4, 5].map(lit)).toEqual([30, 30, 30, 30, 60, 90]);
  });

  it('le bronze aux seules ferrures, jamais de cobalt (il est à la Coupole) ; un peu de neige au faîte, en ruine comme restaurée', () => {
    expect(countColor(shown(0), C3E.bronze)).toBe(12);
    expect(countColor(shown(5), C3E.bronze)).toBe(3 * 12);
    for (let n = 0; n <= 5; n++) {
      expect(countColor(shown(n), COLORS_3E.cobalt), String(n)).toBe(0);
      expect(countColor(shown(n), C3E.snow), String(n)).toBeGreaterThan(0);
    }
  });

  it('l’herbe sèche de la ruine, d’un ton à part, part avec les abords', () => {
    expect([0, 1, 2, 3, 4, 5].map((n) => countColor(shown(n), C3E.dry) > 0)).toEqual([true, true, true, true, true, false]);
  });

  it('une trace par mission, posée avec sa partie', () => {
    const count = (n: number) => posedTraces('lutherie', upTo(n), MISSIONS).length;
    expect([0, 1, 2, 3, 4, 5].map(count)).toEqual([0, 1, 2, 3, 4, 5]);
    for (const m of MISSIONS) expect(LUTHERIE.traces[m], m).toBeDefined();
  });

  it('les instruments en un seul rang, du plus grand au plus petit, de gauche à droite', () => {
    const { instruments } = LUTHERIE_LAYOUT;
    for (let k = 1; k < instruments.length; k++) {
      expect(instruments[k].h).toBeLessThan(instruments[k - 1].h);
      expect(instruments[k].x).toBeGreaterThan(instruments[k - 1].x);
    }
  });

  it('un atelier bas : le faîte à 6,5 au plus au-dessus du sol', () => {
    expect(boundsOf(shown(5)).max[1]).toBeLessThanOrEqual(6.5);
  });

  it('rien du lieu, en ruine comme restauré, sur le chemin de marche, de la porte à `pr-3` puis à `pr-2` (à hauteur de Kéo)', () => {
    const door = nodes.get('lutherie')!;
    const way = [door, nodes.get('pr-3')!, nodes.get('pr-2')!];
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
        expect(low && distanceToPolyline({ x, z }, way) < 0.9, `${x.toFixed(1)}, ${z.toFixed(1)}`).toBe(false);
      }
    }
  });

  it('le chemin arrive à la porte en un angle ouvert, à deux unités au moins du coin de la galerie', () => {
    const door = nodes.get('lutherie')!;
    const bend = nodes.get('pr-3')!;
    const from = nodes.get('pr-2')!;
    const u = { x: bend.x - door.x, z: bend.z - door.z };
    const v = { x: from.x - bend.x, z: from.z - bend.z };
    const turn = (Math.acos((u.x * v.x + u.z * v.z) / (Math.hypot(u.x, u.z) * Math.hypot(v.x, v.z))) * 180) / Math.PI;
    expect(turn).toBeLessThan(60);
    const { body, gallery, local } = LUTHERIE_LAYOUT;
    for (const [x, z] of [
      [body.x1, gallery.z1],
      [body.x1, body.z0],
    ] as const) {
      const c = local(x, z);
      expect(distanceToPolyline({ x: PLACE.center.x + c.x, z: PLACE.center.z + c.z }, [door, bend, from])).toBeGreaterThan(2);
    }
  });
});

describe('Le bilan de la Lutherie', () => {
  it('nomme la partie par son étape, puis dit la phrase du lieu ; jamais un nom du contenu ni un nom de plan, ni un mot de peur', () => {
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
    for (const text of texts) expect(text).not.toMatch(/vide|chute|tomb|vertige|phare|abri|grenier|palais|standard/i);
    expect(s.words?.pose).toEqual(['Les fenêtres sont vitrées.', 'L’établi est réparé.', 'Les instruments sont rangés.', 'Les ardoises sont posées.', 'Les bancs sont remis.']);
    expect(s.words?.end).toBe('Ici, chaque instrument trouvait sa juste voix.');
  });
});

describe('La scénette de la Lutherie', () => {
  it('l’accordeur, sans prénom, et sa phrase de métier', () => {
    const s = scenetteOf('lutherie');
    expect(s.role).toBe('L’accordeur');
    expect(s.greeting).toBe('L’accordeur règle chaque instrument pour qu’il sonne juste.');
  });

  it('la caméra arrive par la porte, à l’ouest (270°, le soleil dans le dos) : les instruments à gauche de Kéo, jamais derrière lui', () => {
    const door = nodes.get('lutherie')!;
    const yaw = doorViewOf('lutherie');
    const look = { x: -Math.sin(yaw), z: -Math.cos(yaw) };
    const cap = ((Math.atan2(look.x, -look.z) * 180) / Math.PI + 360) % 360;
    expect(cap).toBeCloseTo(270, 6);
    const { instruments, rack, local } = LUTHERIE_LAYOUT;
    for (const it of instruments) {
      const c = local(it.x, rack.z);
      const d = { x: PLACE.center.x + c.x - door.x, z: PLACE.center.z + c.z - door.z };
      const off = (Math.atan2(look.x * d.z - look.z * d.x, look.x * d.x + look.z * d.z) * 180) / Math.PI;
      expect(off, String(it.x)).toBeLessThan(-4);
    }
    // La porte reste loin des rives : 9 unités au moins de la plus proche, au sud-est, dans le dos de la vue ; la rive est
    // à plus de 11 unités dans l'axe (relecture des lieux, correction 3, écart écrit dans style.md).
    expect(landDistance3e(door)).toBeGreaterThan(9);
    const frame = doorFrameOf('lutherie')!;
    expect(frame.height).toBeLessThan(0);
    expect(frame.back).toBeLessThanOrEqual(1.6);
  });

  it('elle se joue au nord de l’atelier, hors du chemin, hors de l’atelier, loin de la porte du lieu', () => {
    const s = LUTHERIE_LAYOUT.scene;
    const door = nodes.get('lutherie')!;
    const way = [door, nodes.get('pr-3')!, nodes.get('pr-2')!];
    const { toFrame, body } = LUTHERIE_LAYOUT;
    for (const [sx, sz] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ]) {
      const p = { x: PLACE.center.x + s.dx + sx * s.half[0], z: PLACE.center.z + s.dz + sz * s.half[1] };
      expect(distanceToPolyline(p, way)).toBeGreaterThan(1.5);
      const f = toFrame(s.dx + sx * s.half[0], s.dz + sz * s.half[1]);
      expect(f.x > body.x1 + 0.5 || f.z < body.z0 - 0.5).toBe(true);
    }
    expect(distance({ x: PLACE.center.x + s.dx, z: PLACE.center.z + s.dz }, door)).toBeGreaterThan(3);
  });
});
