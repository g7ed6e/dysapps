// L'Herbier (les Coteaux du 4e) : le lieu par parties (1 + 1 + 1, d'après les trois plans de son île), une seule lanterne
// allumée dans la ruine, trois restauré, jamais deux au même endroit ; une trace par mission avec sa partie ; le signe de
// l'absence sur la margelle de la citerne, qui ne change jamais ; la serre en berceau, basse ; aucune lueur, rien
// d'orange ; rien sur le chemin de marche ; la vue d'arrivée basse au sud-ouest ; la scénette de l'horticultrice ; les
// plafonds de 1 600 et 1 200 triangles. Sans Three.js.
import { describe, expect, it } from 'vitest';
import type { BiomeId } from '../../biomes';
import { partShapes, stagePoseWords } from '../../three/archipeo/constructionParts';
import { phraseDeLaPose } from '../../poseWords';
import { partiesDe } from '../parts';
import { plansFor } from '../plans';
import { PLACE_RUIN_TRIANGLES_MAX_4E, PLACE_TRIANGLES_MAX_4E } from './budget';
import { posedTraces, type PartShape, type Stage } from './construction';
import { FacetBuilder, boundsOf, type Facets } from './facets';
import { FORGE_GLOW, FORGE_GLOW_FADE } from './forge4e';
import { distance, distanceToPolyline, linearRgb } from './geometry';
import { hasHabitantModel } from './habitants';
import { HERBIER, HERBIER_LAYOUT } from './herbier4e';
import { HERBIER_SURROUNDINGS } from './herbierSurroundings';
import { hasScenette, planFor } from './levelPlan';
import { doorFrameOf, doorViewOf } from './northShore';
import { C4E } from './place4eKit';
import { BUILT_PLACES_4E, COLORS_4E, PATH_NODES_4E } from './plan4e';
import { drawPieces, placePieces } from './places';
import { placeTrace } from './questionScene';
import { RUINS_4E } from './ruins4e';
import { scenetteOf } from './scenette';
import { SURROUNDINGS, SURROUNDINGS_MAX } from './surroundings';
import { standingHeight } from './terrain';
import { heightAt4e } from './terrain4e';

const PLAN = planFor('4e');
const PLACE = PLAN.places.find((p) => p.id === 'herbier')!;
const SHAPES = partShapes(PLACE.island as BiomeId);
const MISSIONS = [...BUILT_PLACES_4E.herbier];

const upTo = (n: number): PartShape[] => SHAPES.slice(0, n);
const takes = (parts: readonly PartShape[], stage: Stage, row: number) => parts.some((part) => part.some((s) => s.stage === stage && row >= s.from - 1e-9 && row < s.to - 1e-9));

function shown(n: number): Facets {
  const parts = upTo(n);
  return drawPieces('herbier', (p) => (p.stage === 'ruine' ? !p.until || !takes(parts, p.until.stage, p.until.row) : takes(parts, p.stage, p.row)));
}

function countColor(f: Facets, color: number): number {
  const [r, g, b] = linearRgb(color);
  let n = 0;
  for (let i = 0; i < f.colors.length; i += 3) if (Math.abs(f.colors[i] - r) < 1e-4 && Math.abs(f.colors[i + 1] - g) < 1e-4 && Math.abs(f.colors[i + 2] - b) < 1e-4) n++;
  return n;
}

const ground = (x: number, z: number) => standingHeight(heightAt4e({ x, z }));
const nodes = new Map(PATH_NODES_4E.map((n) => [n.id, n.at]));
const traces = (n: number) => placeTrace('herbier', posedTraces('herbier', upTo(n), MISSIONS));

/**
 * Les noms du titre d'un plan (« Le toit du nid » : toit, nid), sans ses articles ni ses prépositions, moins les mots
 * validés pour ce lieu (relecture du contenu des Coteaux : « serre » à l'Herbier, « colonnes » à la Basilique).
 */
const planNouns = (name: string, allowed: readonly string[] = []) =>
  name
    .toLowerCase()
    .split(/[\s’']+/)
    .filter((w) => w.length > 2 && !['les', 'des', 'aux'].includes(w) && !allowed.includes(w));
/** Un mot entier, au singulier ou au pluriel, quelle que soit sa casse. */
const wordRe = (w: string) => new RegExp(`(?<!\\p{L})${w}s?(?!\\p{L})`, 'iu');

describe('L’Herbier, lieu complet', () => {
  it('ses trois missions se jouent dans sa scénette, en trois parties : le corps, le haut, les abords', () => {
    expect(PLACE.scenes).toEqual(MISSIONS);
    expect(MISSIONS).toEqual(['cells-nutrition', 'heredity', 'species-evolution']);
    expect(hasScenette('herbier')).toBe(true);
    expect(hasHabitantModel('herbier')).toBe(true);
    expect(SHAPES.map((p) => p.map((s) => [s.stage, s.from, s.to]))).toEqual([[[0, 0, 1]], [[1, 0, 1]], [[2, 0, 1]]]);
    expect(Object.hasOwn(RUINS_4E, 'herbier')).toBe(false);
    // Sa porte passe au nord-est (intention, « Les caps »).
    expect(HERBIER_LAYOUT.door).toEqual({ x: expect.closeTo(6, 6), z: expect.closeTo(-6, 6) });
  });

  it('chaque partie pose quelque chose ; la ruine part avec la partie qui la remplace', () => {
    for (let n = 1; n <= 3; n++) expect(shown(n).triangles, String(n)).not.toBe(shown(n - 1).triangles);
    const ruin = placePieces('herbier').filter((p) => p.stage === 'ruine');
    const fallen = ruin.filter((p) => p.until).map((p) => `${p.until!.stage}/${p.until!.row}`);
    expect(new Set(fallen)).toEqual(new Set(['0/0', '1/0', '2/0']));
    expect(ruin.filter((p) => !p.until)).toHaveLength(1);
  });

  it('le signe de l’absence (le support vide de la pompe, ses deux goujons) est là avant comme après, seul fer brun une fois restauré', () => {
    // Le support : un pavé d'un brun éteint (ses quatre flancs, vingt-quatre sommets ; son dessus, six) ; les goujons, de fer bruni.
    expect(countColor(shown(3), C4E.rustDull)).toBe(24);
    expect(countColor(shown(3), C4E.rustDullTop)).toBe(6);
    for (let n = 0; n <= 3; n++) expect(countColor(shown(n), C4E.rustDullTop), String(n)).toBe(6);
  });

  it('coûte au plus 1 600 triangles à son état le plus chargé, traces comprises ; la ruine, 1 200 au plus', () => {
    let worst = 0;
    for (let n = 0; n <= 3; n++) worst = Math.max(worst, shown(n).triangles + traces(n).triangles);
    expect(worst).toBeLessThanOrEqual(PLACE_TRIANGLES_MAX_4E);
    expect(shown(0).triangles).toBeLessThanOrEqual(PLACE_RUIN_TRIANGLES_MAX_4E);
    expect(HERBIER.reach).toBeUndefined();
    expect(HERBIER.restoration).toBeUndefined();
  });

  it('une seule lanterne allumée dans la ruine, celle de l’horticultrice ; une de plus au haut, une aux abords', () => {
    const lit = (n: number) => countColor(shown(n), C4E.lantern);
    expect(lit(0)).toBe(30);
    expect([1, 2, 3].map(lit)).toEqual([30, 60, 90]);
  });

  it('aucune lueur rouge ni rien d’orange, à aucune étape : ni lave, ni rouille claire, ni cuivre, ni terre cuite', () => {
    for (let n = 0; n <= 3; n++)
      for (const f of [shown(n), traces(n)])
        for (const c of [COLORS_4E.lava, FORGE_GLOW, ...FORGE_GLOW_FADE, COLORS_4E.rust, COLORS_4E.copper, COLORS_4E.terracotta, COLORS_4E.brick]) expect(countColor(f, c), `${n} ${c.toString(16)}`).toBe(0);
  });

  it('une trace par mission, posée avec sa partie', () => {
    const count = (n: number) => posedTraces('herbier', upTo(n), MISSIONS).length;
    expect([0, 1, 2, 3].map(count)).toEqual([0, 1, 2, 3]);
    for (const m of MISSIONS) expect(HERBIER.traces[m], m).toBeDefined();
  });

  it('la serre en berceau, basse : 5,5 au plus au-dessus du sol, son verre tombé presque tout dans la ruine', () => {
    const top = boundsOf(shown(3)).max[1];
    expect(top).toBeLessThanOrEqual(5.6);
    const G = HERBIER_LAYOUT.glass;
    const glass = (f: Facets) => countColor(f, G.roof) + countColor(f, G.wall);
    expect(glass(shown(3))).toBeGreaterThan(glass(shown(0)));
  });

  it('la verrière se lit comme du verre (retouche 1) : clair, bien plus clair que la fonte, les pousses des bacs devinées derrière les pieds droits', () => {
    const G = HERBIER_LAYOUT.glass;
    const light = (c: number) => linearRgb(c).reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
    expect(light(G.roof)).toBeGreaterThan(light(G.wall));
    expect(light(G.wall)).toBeGreaterThan(4 * light(C4E.iron));
    // Un vert d'eau : le bleu et le vert au-dessus du rouge, jamais un gris.
    const [r, g, b] = linearRgb(G.roof);
    expect(Math.min(g, b)).toBeGreaterThan(r);
    // Les pousses ne sont devinées qu'avec la verrière, et seulement en bas des pieds droits (sous le haut des bacs et de leurs pousses).
    expect(countColor(shown(1), G.leaf)).toBe(0);
    expect(countColor(shown(2), G.leaf)).toBeGreaterThan(0);
    const f = shown(2);
    const [cr, cg, cb] = linearRgb(G.leaf);
    const top = HERBIER_LAYOUT.base + HERBIER_LAYOUT.greenhouse.leg;
    for (let i = 0; i < f.colors.length; i += 3)
      if (Math.abs(f.colors[i] - cr) < 1e-4 && Math.abs(f.colors[i + 1] - cg) < 1e-4 && Math.abs(f.colors[i + 2] - cb) < 1e-4) {
        expect(f.positions[i + 1]).toBeLessThan(top);
        expect(Math.abs(f.positions[i + 2])).toBeGreaterThan(HERBIER_LAYOUT.greenhouse.r);
      }
  });

  it('rien du lieu, en ruine comme restauré, sur le chemin de marche, de part et d’autre de la porte (à hauteur de Kéo)', () => {
    const door = nodes.get('herbier')!;
    const way = nodes.get('cot-2')!;
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
        expect(low && distanceToPolyline({ x, z }, [door, way]) < 0.9, `${x.toFixed(1)}, ${z.toFixed(1)}`).toBe(false);
      }
    }
  });
});

describe('Le bilan de l’Herbier', () => {
  it('nomme la partie par son étape, puis dit la phrase du lieu ; jamais un nom du contenu', () => {
    const island = PLACE.island as BiomeId;
    const words = stagePoseWords(island, PLACE);
    const parties = partiesDe(island);
    expect(parties).toHaveLength(3);
    const said = [0, 1, 2].map((k) => phraseDeLaPose({ posees: [parties[k]], plansFinis: [] }, words));
    for (const s of said) expect(s).not.toMatch(/pépinière|Nectar|Gardien/i);
    // Jamais le nom d'un plan de l'île : ni sa réplique de fin (`done`), ni un nom de son titre (`name`), dans le bilan,
    // les phrases de pose et la phrase de fin (relecture du contenu des Coteaux, retouche 1).
    const texts = [...said, ...(scenetteOf(PLACE.id).words?.pose ?? []), scenetteOf(PLACE.id).words?.end ?? ''];
    for (const plan of plansFor(island))
      for (const text of texts) {
        expect(text).not.toContain(plan.done);
        for (const noun of planNouns(plan.name, ['serre'])) expect(text, noun).not.toMatch(wordRe(noun));
      }
    expect(scenetteOf('herbier').words?.pose).toEqual(['Les bacs sont replantés.', 'La serre a retrouvé son verre.', 'La citerne est pleine.']);
    expect(scenetteOf('herbier').words?.end).toBe('Ici, chaque plante avait sa place sur la terre noire.');
  });
});

describe('La scénette de l’Herbier', () => {
  it('l’horticultrice, sans prénom, et sa phrase de métier', () => {
    const s = scenetteOf('herbier');
    expect(s.role).toBe('L’horticultrice');
    expect(s.greeting).toBe('L’horticultrice fait pousser les plantes de la serre.');
  });

  it('la caméra arrive par la porte, basse, au sud-ouest (à 45° au moins du soleil) : la serre au milieu du cadre', () => {
    const door = nodes.get('herbier')!;
    const yaw = doorViewOf('herbier');
    const look = { x: -Math.sin(yaw), z: -Math.cos(yaw) };
    // Le cap, en degrés depuis le nord dans le sens des aiguilles d'une montre.
    const cap = ((Math.atan2(look.x, -look.z) * 180) / Math.PI + 360) % 360;
    expect(cap).toBeCloseTo(225, 6);
    expect(Math.abs(cap - 153)).toBeGreaterThanOrEqual(45);
    const d = { x: PLACE.center.x - door.x, z: PLACE.center.z - door.z };
    const off = Math.atan2(look.x * d.z - look.z * d.x, look.x * d.x + look.z * d.z);
    expect(Math.abs((off * 180) / Math.PI)).toBeLessThan(15);
    const frame = doorFrameOf('herbier')!;
    expect(frame.height).toBeLessThan(0);
    expect(frame.back).toBeLessThanOrEqual(1.6);
  });

  it('elle se joue devant la paillasse, hors du chemin, loin de la porte, la caméra au sud-ouest ; ses abords sont enregistrés', () => {
    const s = HERBIER_LAYOUT.scene;
    const door = nodes.get('herbier')!;
    const way = nodes.get('cot-2')!;
    for (const [sx, sz] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ])
      expect(distanceToPolyline({ x: PLACE.center.x + s.dx + sx * s.half[0], z: PLACE.center.z + s.dz + sz * s.half[1] }, [door, way])).toBeGreaterThan(1.5);
    expect(distance({ x: PLACE.center.x + s.dx, z: PLACE.center.z + s.dz }, door)).toBeGreaterThan(3);
    // La paillasse est à l'est de la scène, tout près ; la scène ne la touche pas.
    const P = HERBIER_LAYOUT.paillasse;
    expect(P.x - P.w / 2 - (s.dx + s.half[0])).toBeGreaterThan(0.3);
    expect(P.x - P.w / 2 - (s.dx + s.half[0])).toBeLessThan(2);
    expect(SURROUNDINGS.herbier).toBeDefined();
    const b = new FacetBuilder();
    SURROUNDINGS.herbier!(b, { x: PLACE.center.x + s.dx, y: 0, z: PLACE.center.z + s.dz }, { posed: true } as never);
    expect(b.build().triangles).toBeLessThanOrEqual(SURROUNDINGS_MAX);
    expect(HERBIER_SURROUNDINGS.rocks.length).toBeGreaterThan(0);
  });
});
