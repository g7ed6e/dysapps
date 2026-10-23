// Le Jardin (le Versant du 3e, GD-25) : le lieu par parties (1 + 1 + 1, d'après les trois missions de son île), une
// seule lanterne allumée dans la ruine, trois restauré ; une trace par mission avec sa partie ; le bronze aux seules
// ferrures ; rien sur le chemin de marche ; la porte au sud et la vue d'arrivée au nord ; la scénette du greffeur ; les
// plafonds de 1 600 et 1 200 triangles. Sans Three.js.
import { describe, expect, it } from 'vitest';
import type { BiomeId } from '../../biomes';
import { partShapes, stagePoseWords } from '../../three/archipeo/constructionParts';
import { phraseDeLaPose } from '../../poseWords';
import { partiesDe } from '../parts';
import { plansFor } from '../plans';
import { PLACE_RUIN_TRIANGLES_MAX_3E, PLACE_TRIANGLES_MAX_3E } from './budget';
import { JARDIN, JARDIN_LAYOUT } from './jardin3e';
import { JARDIN_SURROUNDINGS } from './jardinSurroundings';
import { posedTraces, type PartShape, type Stage } from './construction';
import { FacetBuilder, boundsOf, type Facets } from './facets';
import { distance, distanceToPolyline, linearRgb } from './geometry';
import { hasHabitantModel } from './habitants';
import { hasScenette, planFor } from './levelPlan';
import { doorFrameOf, doorViewOf } from './northShore';
import { C3E } from './place3eKit';
import { BUILT_PLACES_3E, PATH_NODES_3E } from './plan3e';
import { drawPieces, placePieces } from './places';
import { placeTrace } from './questionScene';
import { scenetteOf } from './scenette';
import { SURROUNDINGS, SURROUNDINGS_MAX } from './surroundings';
import { standingHeight } from './terrain';
import { heightAt3e } from './terrain3e';

const PLAN = planFor('3e');
const PLACE = PLAN.places.find((p) => p.id === 'jardin')!;
const SHAPES = partShapes(PLACE.island as BiomeId);
const MISSIONS = [...BUILT_PLACES_3E.jardin];

const upTo = (n: number): PartShape[] => SHAPES.slice(0, n);
const takes = (parts: readonly PartShape[], stage: Stage, row: number) => parts.some((part) => part.some((s) => s.stage === stage && row >= s.from - 1e-9 && row < s.to - 1e-9));

function shown(n: number): Facets {
  const parts = upTo(n);
  return drawPieces('jardin', (p) => (p.stage === 'ruine' ? !p.until || !takes(parts, p.until.stage, p.until.row) : takes(parts, p.stage, p.row)));
}

function countColor(f: Facets, color: number): number {
  const [r, g, b] = linearRgb(color);
  let n = 0;
  for (let i = 0; i < f.colors.length; i += 3) if (Math.abs(f.colors[i] - r) < 1e-4 && Math.abs(f.colors[i + 1] - g) < 1e-4 && Math.abs(f.colors[i + 2] - b) < 1e-4) n++;
  return n;
}

const ground = (x: number, z: number) => standingHeight(heightAt3e({ x, z }));
const nodes = new Map(PATH_NODES_3E.map((n) => [n.id, n.at]));
const traces = (n: number) => placeTrace('jardin', posedTraces('jardin', upTo(n), MISSIONS));

/**
 * Les noms du titre d'un plan (« Le toit de l'infirmerie » : toit, infirmerie), sans ses articles ni ses prépositions, moins
 * « abords », le nom de l'étape que le bilan dit à chaque lieu, et « jardin » : « Jardin » est le nom du lieu, que le bilan
 * dit (« le corps du Jardin ») ; le mot commun, jamais, se vérifie à part, casse comprise.
 */
const planNouns = (name: string) =>
  name
    .toLowerCase()
    .split(/[\s’']+/)
    .filter((w) => w.length > 2 && !['les', 'des', 'aux', 'abords', 'jardin'].includes(w));
/** Un mot entier, au singulier ou au pluriel, quelle que soit sa casse. */
const wordRe = (w: string) => new RegExp(`(?<!\\p{L})${w}s?(?!\\p{L})`, 'iu');

describe('Le Jardin, lieu complet', () => {
  it('ses trois missions se jouent dans sa scénette, en trois parties : le corps, le haut, les abords', () => {
    expect(PLACE.scenes).toEqual(MISSIONS);
    expect(MISSIONS).toEqual(['effort-brain', 'digestion-microbes', 'puberty-reproduction']);
    expect(hasScenette('jardin')).toBe(true);
    // Son habitant en modèle 3D dans sa scénette, à la place du pion (le greffeur).
    expect(hasHabitantModel('jardin')).toBe(true);
    expect(SHAPES.map((p) => p.map((s) => [s.stage, s.from, s.to]))).toEqual([[[0, 0, 1]], [[1, 0, 1]], [[2, 0, 1]]]);
  });

  it('chaque partie pose quelque chose ; la ruine part avec la partie qui la remplace', () => {
    for (let n = 1; n <= 3; n++) expect(shown(n).triangles, String(n)).not.toBe(shown(n - 1).triangles);
    const ruin = placePieces('jardin').filter((p) => p.stage === 'ruine');
    const fallen = ruin.filter((p) => p.until).map((p) => `${p.until!.stage}/${p.until!.row}`);
    expect(new Set(fallen)).toEqual(new Set(['0/0', '1/0', '2/0']));
    expect(ruin.filter((p) => !p.until)).toHaveLength(1);
  });

  it('coûte au plus 1 600 triangles à son état le plus chargé, traces comprises ; la ruine, 1 200 au plus', () => {
    let worst = 0;
    for (let n = 0; n <= 3; n++) worst = Math.max(worst, shown(n).triangles + traces(n).triangles);
    expect(worst).toBeLessThanOrEqual(PLACE_TRIANGLES_MAX_3E);
    expect(shown(0).triangles).toBeLessThanOrEqual(PLACE_RUIN_TRIANGLES_MAX_3E);
    expect(JARDIN.reach).toBeUndefined();
  });

  it('une seule lanterne allumée dans la ruine, celle du greffeur ; une de plus au haut (le séchoir), une aux abords ; toutes d’ocre', () => {
    const lit = (n: number) => countColor(shown(n), C3E.lantern);
    expect([0, 1, 2, 3].map(lit)).toEqual([30, 30, 60, 90]);
    expect(C3E.lantern).toBe(0xe0a84a);
  });

  it('le bronze aux seules ferrures : les chapeaux des lanternes, rien d’autre', () => {
    // Un chapeau de lanterne : une pointe à quatre pans (douze sommets).
    expect(countColor(shown(0), C3E.bronze)).toBe(12);
    expect(countColor(shown(3), C3E.bronze)).toBe(3 * 12);
  });

  it('le mur des espaliers au nord, ses trois arbres contre lui ; quatre carrés, la fontaine au milieu ; la porte au sud, dans l’ouverture', () => {
    const L = JARDIN_LAYOUT;
    expect(L.trees.xs).toHaveLength(3);
    for (const x of L.trees.xs) expect(x > L.wall.x0 && x < L.wall.x1).toBe(true);
    expect(L.trees.z).toBeGreaterThan(L.wall.z);
    expect(L.squares.at).toHaveLength(4);
    expect(Math.hypot(L.fountain.x, L.fountain.z)).toBeLessThan(1);
    // Kéo s'arrête à gauche de l'entrée, la fontaine à côté de lui (relecture du Versant, (a) 5).
    expect(L.door.x).toBeCloseTo(-3, 6);
    expect(L.door.z).toBeCloseTo(9.3, 6);
    expect(L.door.x).toBeLessThan(-L.sides.gate / 2);
    expect(L.door.z).toBeGreaterThan(L.sides.z1);
    expect(L.dryer.x).toBeGreaterThan(0);
    expect(L.mortar.x).toBeLessThan(0);
  });

  it('l’eau de la fontaine sombre mais jamais presque noire, et seulement aux abords', () => {
    const water = JARDIN_LAYOUT.colors.water;
    expect(Math.max((water >> 16) & 255, (water >> 8) & 255, water & 255)).toBeGreaterThan(0x60);
    expect([0, 1, 2, 3].map((n) => countColor(shown(n), water) > 0)).toEqual([false, false, false, true]);
  });

  it('une trace par mission, posée avec sa partie', () => {
    const count = (n: number) => posedTraces('jardin', upTo(n), MISSIONS).length;
    expect([0, 1, 2, 3].map(count)).toEqual([0, 1, 2, 3]);
    for (const m of MISSIONS) expect(JARDIN.traces[m], m).toBeDefined();
  });

  it('un lieu bas : le haut du mur et du séchoir à 3,5 au plus au-dessus du sol', () => {
    expect(boundsOf(shown(3)).max[1]).toBeLessThanOrEqual(3.5);
  });

  it('rien du lieu, en ruine comme restauré, sur le chemin de marche, de part et d’autre de la porte (à hauteur de Kéo)', () => {
    const door = nodes.get('jardin')!;
    const ways = [nodes.get('ve-8')!];
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

describe('Le bilan du Jardin', () => {
  it('nomme la partie par son étape, puis dit la phrase du lieu ; jamais un nom du contenu ni un mot de peur', () => {
    const island = PLACE.island as BiomeId;
    const words = stagePoseWords(island, PLACE);
    const parties = partiesDe(island);
    expect(parties).toHaveLength(3);
    const said = [0, 1, 2].map((k) => phraseDeLaPose({ posees: [parties[k]], plansFinis: [] }, words));
    // « Jardin » est le nom du lieu ; « jardin », nom d'un plan de l'île, jamais dans une phrase.
    for (const s of said) expect(s).not.toMatch(/Gardien|Olive|jardin/);
    const s = scenetteOf(PLACE.id);
    const texts = [...said, ...(s.words?.pose ?? []), s.words?.end ?? ''];
    for (const plan of plansFor(island))
      for (const text of texts) {
        expect(text).not.toContain(plan.done);
        for (const noun of planNouns(plan.name)) expect(text, noun).not.toMatch(wordRe(noun));
      }
    // Les phrases du lieu ne disent pas non plus « abords ».
    for (const text of [...(s.words?.pose ?? []), s.words?.end ?? '']) expect(text).not.toMatch(wordRe('abords'));
    for (const text of texts) expect(text).not.toMatch(/vide|chute|tomb|vertige|phare/i);
    expect(s.words?.pose).toEqual(['Les carrés sont refaits.', 'Les arbres sont attachés au mur.', 'La fontaine est pleine.']);
    expect(s.words?.end).toBe('Ici, on cultivait les plantes qui servaient à soigner.');
    for (const text of texts) expect(text).not.toMatch(/(?<!\p{L})jardin/u);
  });
});

describe('La scénette du Jardin', () => {
  it('le greffeur, sans prénom, et sa phrase de métier', () => {
    const s = scenetteOf('jardin');
    expect(s.role).toBe('Le greffeur');
    expect(s.greeting).toBe('Le greffeur fixe la branche d’un arbre sur un autre arbre.');
  });

  it('la caméra arrive par la porte, basse, au nord (0°, le soleil dans le dos) : la fontaine à droite de Kéo, dans le cadre', () => {
    const door = nodes.get('jardin')!;
    const yaw = doorViewOf('jardin');
    const look = { x: -Math.sin(yaw), z: -Math.cos(yaw) };
    const cap = ((Math.atan2(look.x, -look.z) * 180) / Math.PI + 360) % 360;
    expect(cap).toBeCloseTo(0, 6);
    const d = { x: PLACE.center.x - door.x, z: PLACE.center.z - door.z };
    const off = (Math.atan2(look.x * d.z - look.z * d.x, look.x * d.x + look.z * d.z) * 180) / Math.PI;
    // Le cœur (la fontaine) à côté de Kéo, à droite, jamais derrière lui (relecture du Versant, (a) 5).
    expect(off).toBeGreaterThan(12);
    expect(off).toBeLessThan(30);
    const frame = doorFrameOf('jardin')!;
    expect(frame.height).toBeLessThan(0);
    expect(frame.back).toBeLessThanOrEqual(1.6);
  });

  it('elle se joue entre les carrés du sud, hors du chemin, loin de la porte du lieu ; ses abords sont enregistrés', () => {
    const s = JARDIN_LAYOUT.scene;
    const door = nodes.get('jardin')!;
    for (const [sx, sz] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ]) {
      const p = {
        x: PLACE.center.x + s.dx + sx * s.half[0],
        z: PLACE.center.z + s.dz + sz * s.half[1],
      };
      for (const way of ['ve-8']) expect(distanceToPolyline(p, [door, nodes.get(way)!])).toBeGreaterThan(1.5);
    }
    expect(distance({ x: PLACE.center.x + s.dx, z: PLACE.center.z + s.dz }, door)).toBeGreaterThan(3);
    expect(SURROUNDINGS.jardin).toBeDefined();
    const b = new FacetBuilder();
    SURROUNDINGS.jardin!(b, { x: PLACE.center.x + s.dx, y: 0, z: PLACE.center.z + s.dz }, { posed: true } as never);
    expect(b.build().triangles).toBeLessThanOrEqual(SURROUNDINGS_MAX);
    expect(JARDIN_SURROUNDINGS.rocks.length).toBeGreaterThan(0);
  });
});
