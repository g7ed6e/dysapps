// La Tribune (les Alpages du 3e, GD-25) : le lieu par parties (1 + 1 + 1, d'après les trois missions de son île), une
// seule lanterne allumée dans la ruine, trois restauré ; une trace par mission avec sa partie ; le bronze aux seules
// ferrures, la cloche de fer bruni, jamais de cobalt ; les gradins étagés, tournés vers le pic ; rien sur le chemin de
// marche ; la porte au sud-ouest, à côté de l'estrade, et la vue d'arrivée au nord-est ; la scénette de la conseillère ;
// les plafonds de 1 600 et 1 200 triangles. Sans Three.js.
import { describe, expect, it } from 'vitest';
import type { BiomeId } from '../../biomes';
import { partShapes, stagePoseWords } from '../../three/archipeo/constructionParts';
import { phraseDeLaPose } from '../../poseWords';
import { partiesDe } from '../parts';
import { plansFor } from '../plans';
import { PLACE_RUIN_TRIANGLES_MAX_3E, PLACE_TRIANGLES_MAX_3E } from './budget';
import { TRIBUNE, TRIBUNE_LAYOUT } from './tribune3e';
import { posedTraces, type PartShape, type Stage } from './construction';
import { boundsOf, type Facets } from './facets';
import { distance, distanceToPolyline, linearRgb } from './geometry';
import { hasHabitantModel } from './habitants';
import { hasScenette, planFor } from './levelPlan';
import { doorFrameOf, doorViewOf } from './northShore';
import { C3E } from './place3eKit';
import { BUILT_PLACES_3E, COLORS_3E, PATH_EDGES_3E, PATH_NODES_3E, PEAK_3E } from './plan3e';
import { drawPieces, placePieces } from './places';
import { placeTrace } from './questionScene';
import { scenetteOf } from './scenette';
import { standingHeight } from './terrain';
import { heightAt3e } from './terrain3e';

const PLAN = planFor('3e');
const PLACE = PLAN.places.find((p) => p.id === 'tribune')!;
const SHAPES = partShapes(PLACE.island as BiomeId);
const MISSIONS = [...BUILT_PLACES_3E.tribune];

const upTo = (n: number): PartShape[] => SHAPES.slice(0, n);
const takes = (parts: readonly PartShape[], stage: Stage, row: number) => parts.some((part) => part.some((s) => s.stage === stage && row >= s.from - 1e-9 && row < s.to - 1e-9));

function shown(n: number): Facets {
  const parts = upTo(n);
  return drawPieces('tribune', (p) => (p.stage === 'ruine' ? !p.until || !takes(parts, p.until.stage, p.until.row) : takes(parts, p.stage, p.row)));
}

function countColor(f: Facets, color: number): number {
  const [r, g, b] = linearRgb(color);
  let n = 0;
  for (let i = 0; i < f.colors.length; i += 3) if (Math.abs(f.colors[i] - r) < 1e-4 && Math.abs(f.colors[i + 1] - g) < 1e-4 && Math.abs(f.colors[i + 2] - b) < 1e-4) n++;
  return n;
}

const ground = (x: number, z: number) => standingHeight(heightAt3e({ x, z }));
const nodes = new Map(PATH_NODES_3E.map((n) => [n.id, n.at]));
const traces = (n: number) => placeTrace('tribune', posedTraces('tribune', upTo(n), MISSIONS));

/** Les noms du titre d'un plan (« Le toit de la bibliothèque » : toit, bibliothèque), sans ses articles, moins « abords ». */
const planNouns = (name: string) =>
  name
    .toLowerCase()
    .split(/[\s’']+/)
    .filter((w) => w.length > 2 && !['les', 'des', 'aux', 'abords'].includes(w));
/** Un mot entier, au singulier ou au pluriel, quelle que soit sa casse. */
const wordRe = (w: string) => new RegExp(`(?<!\\p{L})${w}s?(?!\\p{L})`, 'iu');

describe('La Tribune, lieu complet', () => {
  it('ses trois missions se jouent dans sa scénette, en trois parties : le corps, le haut, les abords', () => {
    expect(PLACE.scenes).toEqual(MISSIONS);
    expect(MISSIONS).toEqual(['constitution', 'information', 'civic-engagement']);
    expect(hasScenette('tribune')).toBe(true);
    expect(hasHabitantModel('tribune')).toBe(true);
    expect(SHAPES.map((p) => p.map((s) => [s.stage, s.from, s.to]))).toEqual([[[0, 0, 1]], [[1, 0, 1]], [[2, 0, 1]]]);
  });

  it('chaque partie pose quelque chose ; la ruine part avec la partie qui la remplace', () => {
    for (let n = 1; n <= 3; n++) expect(shown(n).triangles, String(n)).not.toBe(shown(n - 1).triangles);
    const ruin = placePieces('tribune').filter((p) => p.stage === 'ruine');
    const fallen = ruin.filter((p) => p.until).map((p) => `${p.until!.stage}/${p.until!.row}`);
    expect(new Set(fallen)).toEqual(new Set(['0/0', '1/0', '2/0']));
    expect(ruin.filter((p) => !p.until)).toHaveLength(1);
  });

  it('coûte au plus 1 600 triangles à son état le plus chargé, traces comprises ; la ruine, 1 200 au plus', () => {
    let worst = 0;
    for (let n = 0; n <= 3; n++) worst = Math.max(worst, shown(n).triangles + traces(n).triangles);
    expect(worst).toBeLessThanOrEqual(PLACE_TRIANGLES_MAX_3E);
    expect(shown(0).triangles).toBeLessThanOrEqual(PLACE_RUIN_TRIANGLES_MAX_3E);
    expect(TRIBUNE.reach).toBeUndefined();
  });

  it('une seule lanterne allumée dans la ruine, celle de la conseillère, au bras d’un pilier ; une de plus au haut (sous l’auvent), une aux abords ; toutes d’ocre', () => {
    const lit = (n: number) => countColor(shown(n), C3E.lantern);
    expect([0, 1, 2, 3].map(lit)).toEqual([30, 30, 60, 90]);
  });

  it('le bronze aux seules ferrures, la cloche de fer bruni (correction 7) ; jamais de cobalt', () => {
    expect(countColor(shown(0), C3E.bronze)).toBe(12);
    expect(countColor(shown(3), C3E.bronze)).toBe(3 * 12);
    for (let n = 0; n <= 3; n++) expect(countColor(shown(n), COLORS_3E.cobalt), String(n)).toBe(0);
    expect(countColor(shown(2), C3E.iron)).toBeGreaterThan(0);
  });

  it('les gradins étagés dans la pente, en demi-cercle à l’ouest de l’estrade : tournés vers le pic (à l’est), jamais fermés', () => {
    const { rows, stage } = TRIBUNE_LAYOUT;
    expect(rows.count).toBe(3);
    expect(rows.from).toBeGreaterThan(180);
    expect(rows.to).toBeLessThan(360);
    // Le milieu de l’arc regarde le pic, à 30° près ; l’estrade est entre les gradins et lui.
    const facing = ((rows.from + rows.to) / 2 + 180) % 360;
    const peak = ((Math.atan2(PEAK_3E.at.x - PLACE.center.x, -(PEAK_3E.at.z - PLACE.center.z)) * 180) / Math.PI + 360) % 360;
    expect(Math.abs(peak - facing)).toBeLessThan(30);
    expect(stage.x).toBeGreaterThan(0);
  });

  it('l’herbe sèche de la ruine, d’un ton à part, part avec les abords', () => {
    expect([0, 1, 2, 3].map((n) => countColor(shown(n), C3E.dry) > 0)).toEqual([true, true, true, false]);
  });

  it('une trace par mission, posée avec sa partie', () => {
    const count = (n: number) => posedTraces('tribune', upTo(n), MISSIONS).length;
    expect([0, 1, 2, 3].map(count)).toEqual([0, 1, 2, 3]);
    for (const m of MISSIONS) expect(TRIBUNE.traces[m], m).toBeDefined();
  });

  it('un lieu bas : le haut de l’auvent à 3,6 au plus au-dessus du sol, rien devant le haut du Fanal', () => {
    expect(boundsOf(shown(3)).max[1]).toBeLessThanOrEqual(3.6);
  });

  it('rien du lieu, en ruine comme restauré, sur le chemin de marche, de part et d’autre de la porte (à hauteur de Kéo)', () => {
    const door = nodes.get('tribune')!;
    const ways = [nodes.get('al-2')!];
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

describe('La porte de la Tribune', () => {
  it('se tient à l’écart des chemins qui passent sans y mener (le chemin des Alpages vers l’ouest, au nord de la halle)', () => {
    const door = nodes.get('tribune')!;
    for (const [a, b] of PATH_EDGES_3E) {
      if (a === 'tribune' || b === 'tribune') continue;
      expect(distanceToPolyline(door, [nodes.get(a)!, nodes.get(b)!]), `${a}-${b}`).toBeGreaterThan(4);
    }
  });
});

describe('Le bilan de la Tribune', () => {
  it('nomme la partie par son étape, puis dit la phrase du lieu ; jamais un nom du contenu, « tribune » en nom commun, ni un mot de peur', () => {
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
        // Le nom propre du lieu (« la Tribune », avec sa majuscule) n'est pas le nom commun du plan (« la tribune »).
        for (const noun of planNouns(plan.name)) expect(text.replace(/(?<!\p{L})Tribune(?!\p{L})/gu, ''), noun).not.toMatch(wordRe(noun));
      }
    for (const text of [...(s.words?.pose ?? []), s.words?.end ?? '']) expect(text).not.toMatch(wordRe('abords'));
    for (const text of texts) expect(text).not.toMatch(/vide|chute|tomb|vertige|phare/i);
    for (const text of texts) expect(text).not.toMatch(/(?<!\p{L})tribune/u);
    expect(s.words?.pose).toEqual(['Les gradins sont remontés.', 'La cloche est pendue.', 'Le tableau des votes est debout.']);
    expect(s.words?.end).toBe('Ici, chacun pouvait parler, et tout le village écoutait.');
  });
});

describe('La scénette de la Tribune', () => {
  it('la conseillère, sans prénom, et sa phrase de métier', () => {
    const s = scenetteOf('tribune');
    expect(s.role).toBe('La conseillère');
    expect(s.greeting).toBe('La conseillère parle au nom de tout le village.');
  });

  it('la caméra arrive par la porte, au nord-est (41°), un peu haute pour voir les rangs : l’estrade à droite de Kéo, jamais derrière lui ; le haut du Fanal à +20°', () => {
    const door = nodes.get('tribune')!;
    const yaw = doorViewOf('tribune');
    const look = { x: -Math.sin(yaw), z: -Math.cos(yaw) };
    const cap = ((Math.atan2(look.x, -look.z) * 180) / Math.PI + 360) % 360;
    expect(cap).toBeCloseTo(41, 6);
    const offOf = (q: { x: number; z: number }) => {
      const d = { x: q.x - door.x, z: q.z - door.z };
      return (Math.atan2(look.x * d.z - look.z * d.x, look.x * d.x + look.z * d.z) * 180) / Math.PI;
    };
    // L’estrade à droite du milieu du cadre (relecture du Versant, (b) 1), dans le cadre.
    const st = offOf({ x: PLACE.center.x + TRIBUNE_LAYOUT.stage.x, z: PLACE.center.z });
    expect(st).toBeGreaterThan(10);
    expect(st).toBeLessThan(30);
    const fanal = PLAN.places.find((p) => p.id === 'fanal')!;
    expect(offOf(fanal.center)).toBeGreaterThan(15);
    expect(offOf(fanal.center)).toBeLessThan(25);
    const frame = doorFrameOf('tribune')!;
    expect(frame.height).toBeLessThanOrEqual(0);
    expect(frame.back).toBeLessThanOrEqual(1.6);
  });

  it('elle se joue au sud de l’estrade, du côté ouvert de l’arène : hors des gradins, du talus, de l’estrade, des piliers et du chemin', () => {
    const s = TRIBUNE_LAYOUT.scene;
    const { rows, berm, stage, bell } = TRIBUNE_LAYOUT;
    const door = nodes.get('tribune')!;
    for (let i = -2; i <= 2; i++)
      for (const sz of [-1, 0, 1]) {
        const x = s.dx + (i / 2) * s.half[0],
          z = s.dz + sz * s.half[1];
        const cap = ((Math.atan2(x, -z) * 180) / Math.PI + 360) % 360;
        const inArc = cap >= rows.from && cap <= rows.to;
        expect(inArc && Math.hypot(x, z) > rows.r0 - 0.3 && Math.hypot(x, z) < berm.r + 0.3, `${x}, ${z}`).toBe(false);
        expect(Math.abs(x - stage.x) < stage.w / 2 + 2 * stage.step && Math.abs(z) < stage.d / 2).toBe(false);
        for (const px of bell.xs) expect(Math.hypot(x - px, z - bell.z)).toBeGreaterThan(0.5);
        expect(distanceToPolyline({ x: PLACE.center.x + x, z: PLACE.center.z + z }, [door, nodes.get('al-2')!])).toBeGreaterThan(1.5);
      }
    expect(distance({ x: PLACE.center.x + s.dx, z: PLACE.center.z + s.dz }, door)).toBeGreaterThan(3);
  });

});
