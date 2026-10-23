// Le Belvédère (le Versant du 3e, GD-25) : le lieu par parties (3 + 1 + 1, d'après les cinq missions de son île), une
// seule lanterne allumée dans la ruine, trois restauré ; une trace par mission avec sa partie ; le muret côté nuages
// entier, en ruine comme restauré, la brèche côté montagne ; le bronze aux seules ferrures ; rien sur le chemin de
// marche ; la vue d'arrivée au nord-ouest ; la scénette de la topographe ; les plafonds du grand lieu (2 400 triangles)
// et de la ruine (1 200). Sans Three.js.
import { describe, expect, it } from 'vitest';
import type { BiomeId } from '../../biomes';
import { partShapes, stagePoseWords } from '../../three/archipeo/constructionParts';
import { phraseDeLaPose } from '../../poseWords';
import { partiesDe } from '../parts';
import { plansFor } from '../plans';
import { BELVEDERE, BELVEDERE_LAYOUT, GNOMON_FALLEN } from './belvedere3e';
import { BELVEDERE_SURROUNDINGS } from './belvedereSurroundings';
import { GRAND_PLACE_TRIANGLES_MAX_3E, PLACE_RUIN_TRIANGLES_MAX_3E } from './budget';
import { posedTraces, type PartShape, type Stage } from './construction';
import { FacetBuilder, boundsOf, type Facets } from './facets';
import { distance, distanceToPolyline, linearRgb } from './geometry';
import { hasHabitantModel } from './habitants';
import { hasScenette, planFor } from './levelPlan';
import { doorFrameOf, doorViewOf } from './northShore';
import { C3E, onCircle } from './place3eKit';
import { BUILT_PLACES_3E, PATH_NODES_3E } from './plan3e';
import { drawPieces, placePieces } from './places';
import { placeTrace } from './questionScene';
import { scenetteOf } from './scenette';
import { SURROUNDINGS, SURROUNDINGS_MAX } from './surroundings';
import { standingHeight } from './terrain';
import { heightAt3e } from './terrain3e';

const PLAN = planFor('3e');
const PLACE = PLAN.places.find((p) => p.id === 'belvedere')!;
const SHAPES = partShapes(PLACE.island as BiomeId);
const MISSIONS = [...BUILT_PLACES_3E.belvedere];

const upTo = (n: number): PartShape[] => SHAPES.slice(0, n);
const takes = (parts: readonly PartShape[], stage: Stage, row: number) => parts.some((part) => part.some((s) => s.stage === stage && row >= s.from - 1e-9 && row < s.to - 1e-9));

function shown(n: number): Facets {
  const parts = upTo(n);
  return drawPieces('belvedere', (p) => (p.stage === 'ruine' ? !p.until || !takes(parts, p.until.stage, p.until.row) : takes(parts, p.stage, p.row)));
}

function countColor(f: Facets, color: number): number {
  const [r, g, b] = linearRgb(color);
  let n = 0;
  for (let i = 0; i < f.colors.length; i += 3) if (Math.abs(f.colors[i] - r) < 1e-4 && Math.abs(f.colors[i + 1] - g) < 1e-4 && Math.abs(f.colors[i + 2] - b) < 1e-4) n++;
  return n;
}

const ground = (x: number, z: number) => standingHeight(heightAt3e({ x, z }));
const nodes = new Map(PATH_NODES_3E.map((n) => [n.id, n.at]));
const traces = (n: number) => placeTrace('belvedere', posedTraces('belvedere', upTo(n), MISSIONS));

/** Les noms du titre d'un plan (« Le toit du kiosque » : toit, kiosque), sans ses articles ni ses prépositions. */
const planNouns = (name: string) =>
  name
    .toLowerCase()
    .split(/[\s’']+/)
    .filter((w) => w.length > 2 && !['les', 'des', 'aux'].includes(w));
/** Un mot entier, au singulier ou au pluriel, quelle que soit sa casse. */
const wordRe = (w: string) => new RegExp(`(?<!\\p{L})${w}s?(?!\\p{L})`, 'iu');

describe('Le Belvédère, lieu complet', () => {
  it('ses cinq missions se jouent dans sa scénette, en cinq parties : le corps en trois, le haut, les abords', () => {
    expect(PLACE.scenes).toEqual(MISSIONS);
    expect(MISSIONS).toEqual(['pythagoras', 'thales', 'trigonometry', 'scaling', 'transformations']);
    expect(hasScenette('belvedere')).toBe(true);
    // Son habitant en modèle 3D dans sa scénette, à la place du pion (la topographe).
    expect(hasHabitantModel('belvedere')).toBe(true);
    expect(SHAPES.map((p) => p.map((s) => [s.stage, s.from, s.to]))).toEqual([[[0, 0, 1 / 3]], [[0, 1 / 3, 2 / 3]], [[0, 2 / 3, 1]], [[1, 0, 1]], [[2, 0, 1]]]);
  });

  it('chaque partie pose quelque chose ; la ruine part avec la partie qui la remplace', () => {
    for (let n = 1; n <= 5; n++) expect(shown(n).triangles, String(n)).not.toBe(shown(n - 1).triangles);
    const ruin = placePieces('belvedere').filter((p) => p.stage === 'ruine');
    const fallen = ruin.filter((p) => p.until).map((p) => `${p.until!.stage}/${p.until!.row}`);
    expect(new Set(fallen)).toEqual(new Set(['0/0', `0/${1 / 3}`, `0/${2 / 3}`, '1/0', '2/0']));
    expect(ruin.filter((p) => !p.until)).toHaveLength(1);
  });

  it('coûte au plus 2 400 triangles (le grand lieu) à son état le plus chargé, traces comprises ; la ruine, 1 200 au plus', () => {
    let worst = 0;
    for (let n = 0; n <= 5; n++) worst = Math.max(worst, shown(n).triangles + traces(n).triangles);
    expect(worst).toBeLessThanOrEqual(GRAND_PLACE_TRIANGLES_MAX_3E);
    expect(shown(0).triangles).toBeLessThanOrEqual(PLACE_RUIN_TRIANGLES_MAX_3E);
    expect(BELVEDERE.reach).toBeUndefined();
  });

  it('une seule lanterne allumée dans la ruine, celle de la topographe ; une de plus au haut, une aux abords ; toutes d’ocre', () => {
    const lit = (n: number) => countColor(shown(n), C3E.lantern);
    expect([0, 1, 2, 3, 4, 5].map(lit)).toEqual([30, 30, 30, 30, 60, 90]);
    expect(C3E.lantern).toBe(0xe0a84a);
  });

  it('le bronze aux seules ferrures : les chapeaux des lanternes et les deux ferrures du cercle de visée, rien d’autre', () => {
    // Un chapeau de lanterne : une pointe à quatre pans (douze sommets) ; une ferrure : un pavé (trente sommets).
    expect(countColor(shown(0), C3E.bronze)).toBe(12 + 2 * 30);
    expect(countColor(shown(5), C3E.bronze)).toBe(3 * 12 + 2 * 30);
  });

  it('le muret entier en ruine comme restauré, sauf l’entrée vers la porte ; la brèche est côté montagne', () => {
    const T = BELVEDERE_LAYOUT.terrace;
    // Le pan de la brèche regarde le nord-ouest (le pic) ; l'entrée, du sud-est au sud, la porte et le chemin.
    expect(T.breach * 30).toBeGreaterThanOrEqual(270);
    expect(T.gate.map((k) => k * 30 + 15)).toEqual([135, 165]);
    // Les nuages sont à l'est et au sud du Belvédère : le pan de la brèche en est loin.
    const c = BELVEDERE_LAYOUT.center;
    const mid = onCircle(T.r + 20, T.breach * 30 + 15, c);
    expect(heightAt3e(mid)).toBeGreaterThan(0);
  });

  it('une trace par mission, posée avec sa partie', () => {
    const count = (n: number) => posedTraces('belvedere', upTo(n), MISSIONS).length;
    expect([0, 1, 2, 3, 4, 5].map(count)).toEqual([0, 1, 2, 3, 4, 5]);
    for (const m of MISSIONS) expect(BELVEDERE.traces[m], m).toBeDefined();
  });

  it('le gnomon couché reste en dedans du muret, le long de lui, sans le traverser', () => {
    for (const g of GNOMON_FALLEN)
      for (const d of [0, g.len]) {
        const p = { x: g.x + Math.sin(g.yaw) * d, z: g.z + Math.cos(g.yaw) * d };
        expect(Math.hypot(p.x, p.z) + g.r0).toBeLessThan(6.6 - 0.45 / 2);
        expect(Math.hypot(p.x, p.z)).toBeGreaterThan(4);
      }
  });

  it('un lieu bas : seul le gnomon monte (5,5 au plus au-dessus du sol)', () => {
    expect(boundsOf(shown(5)).max[1]).toBeLessThanOrEqual(5.6);
  });

  it('rien du lieu, en ruine comme restauré, sur le chemin de marche, de part et d’autre de la porte (à hauteur de Kéo)', () => {
    const door = nodes.get('belvedere')!;
    const ways = [nodes.get('ve-4')!, nodes.get('arc-v')!];
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

describe('Le bilan du Belvédère', () => {
  it('nomme la partie par son étape, puis dit la phrase du lieu ; jamais un nom du contenu ni un mot de peur', () => {
    const island = PLACE.island as BiomeId;
    const words = stagePoseWords(island, PLACE);
    const parties = partiesDe(island);
    expect(parties).toHaveLength(5);
    const said = [0, 1, 2, 3, 4].map((k) => phraseDeLaPose({ posees: [parties[k]], plansFinis: [] }, words));
    for (const s of said) expect(s).not.toMatch(/Sphinx|Gardien|Théo/i);
    const s = scenetteOf(PLACE.id);
    const texts = [...said, ...(s.words?.pose ?? []), s.words?.end ?? '', s.greeting ?? ''];
    for (const plan of plansFor(island))
      for (const text of texts) {
        expect(text).not.toContain(plan.done);
        for (const noun of planNouns(plan.name)) expect(text, noun).not.toMatch(wordRe(noun));
      }
    for (const text of texts) expect(text).not.toMatch(/vide|chute|tomb|vertige|phare/i);
    expect(s.words?.pose).toEqual(['Le dallage est remis.', 'Le gnomon est debout.', 'Les pierres sont à leur place.', 'La visée est prête.', 'Les flèches sont posées.']);
    expect(s.words?.end).toBe('D’ici, on mesurait la montagne sans la gravir.');
  });
});

describe('La scénette du Belvédère', () => {
  it('la topographe, sans prénom, et sa phrase de métier', () => {
    const s = scenetteOf('belvedere');
    expect(s.role).toBe('La topographe');
    expect(s.greeting).toBe('La topographe mesure le terrain et le dessine.');
  });

  it('la caméra arrive par la porte, basse, au nord-ouest (323°, le soleil dans le dos) : la terrasse à gauche de Kéo, dans le cadre', () => {
    const door = nodes.get('belvedere')!;
    const yaw = doorViewOf('belvedere');
    const look = { x: -Math.sin(yaw), z: -Math.cos(yaw) };
    const cap = ((Math.atan2(look.x, -look.z) * 180) / Math.PI + 360) % 360;
    expect(cap).toBeCloseTo(323, 6);
    const d = { x: PLACE.center.x - door.x, z: PLACE.center.z - door.z };
    const off = (Math.atan2(look.x * d.z - look.z * d.x, look.x * d.x + look.z * d.z) * 180) / Math.PI;
    // Le cœur à côté de Kéo, à sa gauche, jamais derrière lui (relecture du Versant, (a) 5).
    expect(off).toBeLessThan(-12);
    expect(off).toBeGreaterThan(-30);
    const frame = doorFrameOf('belvedere')!;
    expect(frame.height).toBeLessThan(0);
    expect(frame.back).toBeLessThanOrEqual(1.6);
  });

  it('elle se joue sur la terrasse, au pied du gnomon, hors du chemin, loin de la porte ; ses abords sont enregistrés', () => {
    const s = BELVEDERE_LAYOUT.scene;
    const door = nodes.get('belvedere')!;
    for (const [sx, sz] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ]) {
      const p = { x: PLACE.center.x + s.dx + sx * s.half[0], z: PLACE.center.z + s.dz + sz * s.half[1] };
      expect(distanceToPolyline(p, [door, nodes.get('arc-v')!])).toBeGreaterThan(1.5);
      expect(Math.hypot(s.dx + sx * s.half[0], s.dz + sz * s.half[1])).toBeLessThan(BELVEDERE_LAYOUT.terrace.r - 0.5);
    }
    expect(distance({ x: PLACE.center.x + s.dx, z: PLACE.center.z + s.dz }, door)).toBeGreaterThan(3);
    expect(Math.hypot(s.dx - BELVEDERE_LAYOUT.gnomon.at.x, s.dz - BELVEDERE_LAYOUT.gnomon.at.z)).toBeLessThan(4);
    expect(SURROUNDINGS.belvedere).toBeDefined();
    const b = new FacetBuilder();
    SURROUNDINGS.belvedere!(b, { x: PLACE.center.x + s.dx, y: 0, z: PLACE.center.z + s.dz }, { posed: true } as never);
    expect(b.build().triangles).toBeLessThanOrEqual(SURROUNDINGS_MAX);
    // Les blocs des abords sont hors de la terrasse.
    for (const r of BELVEDERE_SURROUNDINGS.rocks) expect(Math.hypot(s.dx + r.dx, s.dz + r.dz)).toBeGreaterThan(BELVEDERE_LAYOUT.terrace.r + r.r);
  });
});
