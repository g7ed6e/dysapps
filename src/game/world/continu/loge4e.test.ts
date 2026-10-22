// La Loge (lot 3 du monde ouvert du 4e, le Bastion) : le lieu par parties (2 + 1 + 1 aujourd'hui, 3 + 1 + 1 à la bascule
// de 2027, d'après les plans de `english-4e-comprehension`), les deux comptes et les sauvegardes d'avant la bascule, une
// seule lanterne allumée dans la ruine, trois au plus restaurée, une trace par mission avec sa partie (celle de 2027
// gardée dans le budget), le signe de l'absence qui ne change jamais, le faîte à 10,5 au plus et la grue du Gabarit dégagée
// depuis la Crique, les rails debout, le rideau rouge vin tombé puis ouvert, aucun orange, la rouille dans la ruine
// seulement, rien sur le chemin de marche, la vue d'arrivée des coulisses (la caméra au nord, vers le sud), la caméra qui
// voit Kéo de tous côtés, la scénette du costumier, les plafonds de 1 600 et 1 200 triangles. Sans Three.js.
import { describe, expect, it } from 'vitest';
import type { BiomeId } from '../../biomes';
import { partShapes, stagePoseWords } from '../../three/archipeo/constructionParts';
import { phraseDeLaPose } from '../../poseWords';
import { partiesDe } from '../parts';
import { planCells, plansFor } from '../plans';
import { PLACE_RUIN_TRIANGLES_MAX_4E, PLACE_TRIANGLES_MAX_4E } from './budget';
import { FOLLOW, followPose, markShift, occlusionLift, orbitAround, screenOf } from './camera';
import { posedTraces, type PartShape, type Stage } from './construction';
import type { Facets } from './facets';
import { FacetBuilder } from './facets';
import { FORGE_GLOW, FORGE_GLOW_FADE } from './forge4e';
import { GABARIT_LAYOUT } from './gabarit4e';
import { distance, distanceToPolyline, linearRgb } from './geometry';
import { hasHabitantModel } from './habitants';
import { hasScenette, planFor } from './levelPlan';
import { LOGE, LOGE_LAYOUT } from './loge4e';
import { LOGE_SURROUNDINGS } from './logeSurroundings';
import { doorFrameOf, doorViewOf } from './northShore';
import { BUILT_PLACES_4E, COLORS_4E, DEPARTURE_4E, PATH_NODES_4E } from './plan4e';
import { COLORS_5E } from './plan5e';
import { drawPieces, placePieces } from './places';
import { placeTrace, questionLayout } from './questionScene';
import { RUINS_4E } from './ruins4e';
import { saysRestored, scenetteHabitant, scenetteKeo, scenetteLayout, scenetteOf, scenettePose } from './scenette';
import { SURROUNDINGS, SURROUNDINGS_MAX } from './surroundings';
import { standingHeight } from './terrain';
import { heightAt4e } from './terrain4e';

/** L'ancienne brique du 4e, orange vif au soleil (avant la retouche 1 du Bastion) : jamais à la Loge. */
const OLD_ORANGE_BRICK = 0xa4553e;
const PLAN = planFor('4e');
const PLACE = PLAN.places.find((p) => p.id === 'loge')!;
const ISLAND = PLACE.island as BiomeId;
const SHAPES = partShapes(ISLAND);
const MISSIONS = [...BUILT_PLACES_4E.loge];
/** La mission de la bascule de 2027 : le milieu du corps. */
const MISSION_2027 = 'relatives-reported';
const L = LOGE_LAYOUT;

/** Les cinq parties de 2027 : le premier plan en trois rangées entières, puis le haut, puis les abords. */
const SHAPES_2027: PartShape[] = [[{ stage: 0, from: 0, to: 1 / 3 }], [{ stage: 0, from: 1 / 3, to: 2 / 3 }], [{ stage: 0, from: 2 / 3, to: 1 }], [{ stage: 1, from: 0, to: 1 }], [{ stage: 2, from: 0, to: 1 }]];

const takes = (parts: readonly PartShape[], stage: Stage, row: number) => parts.some((part) => part.some((s) => s.stage === stage && row >= s.from - 1e-9 && row < s.to - 1e-9));

function drawn(parts: readonly PartShape[]): Facets {
  return drawPieces('loge', (p) => (p.stage === 'ruine' ? !p.until || !takes(parts, p.until.stage, p.until.row) : takes(parts, p.stage, p.row)));
}

const upTo = (n: number): PartShape[] => SHAPES.slice(0, n);
const shown = (n: number): Facets => drawn(upTo(n));

function countColor(f: Facets, color: number): number {
  const [r, g, b] = linearRgb(color);
  let n = 0;
  for (let i = 0; i < f.colors.length; i += 3) if (Math.abs(f.colors[i] - r) < 1e-4 && Math.abs(f.colors[i + 1] - g) < 1e-4 && Math.abs(f.colors[i + 2] - b) < 1e-4) n++;
  return n;
}

/** Les sommets d'une couleur : leurs coordonnées (dans le repère du lieu). */
function verticesOf(f: Facets, color: number): [number, number, number][] {
  const [r, g, b] = linearRgb(color);
  const out: [number, number, number][] = [];
  for (let i = 0; i < f.colors.length; i += 3) if (Math.abs(f.colors[i] - r) < 1e-4 && Math.abs(f.colors[i + 1] - g) < 1e-4 && Math.abs(f.colors[i + 2] - b) < 1e-4) out.push([f.positions[i], f.positions[i + 1], f.positions[i + 2]]);
  return out;
}

const topOf = (f: Facets) => {
  let top = -Infinity;
  for (let i = 1; i < f.positions.length; i += 3) top = Math.max(top, f.positions[i]);
  return top;
};

/** Un maillage, réduit à ses sommets triés : deux dessins qui posent les mêmes volumes ont la même empreinte. */
const printOf = (f: Facets): string => {
  const out: string[] = [];
  for (let i = 0; i < f.positions.length; i += 3) out.push(`${f.positions[i].toFixed(3)},${f.positions[i + 1].toFixed(3)},${f.positions[i + 2].toFixed(3)}`);
  return out.sort().join(';');
};

const ground = (x: number, z: number) => standingHeight(heightAt4e({ x, z }));
const nodes = new Map(PATH_NODES_4E.map((n) => [n.id, n.at]));
const traces = (n: number, missions: readonly string[] = MISSIONS) => placeTrace('loge', posedTraces('loge', upTo(n), missions));
const H0 = ground(PLACE.center.x, PLACE.center.z);
const SHOWN = [0, 1, 2, 3, 4].map(shown);

describe('La Loge, lieu complet', () => {
  it('ses quatre missions se jouent dans sa scénette, en quatre parties : le corps en deux, le haut, les abords', () => {
    expect(PLACE.scenes).toEqual(MISSIONS);
    expect(MISSIONS).toEqual(['dialogues', 'quantities', 'irregular-past', 'stories']);
    expect(hasScenette('loge')).toBe(true);
    expect(hasHabitantModel('loge')).toBe(true);
    expect(SHAPES.map((p) => p.map((s) => [s.stage, s.from, s.to]))).toEqual([[[0, 0, 0.5]], [[0, 0.5, 1]], [[1, 0, 1]], [[2, 0, 1]]]);
    expect(Object.hasOwn(RUINS_4E, 'loge')).toBe(false);
  });

  it('le corps est en trois groupes (0, 0,4, 0,8) : chaque groupe dans une seule partie, en moitiés comme en tiers', () => {
    const rows = [...new Set(placePieces('loge').filter((p) => p.stage === 0).map((p) => p.row))].sort();
    expect(rows).toEqual([0, 0.4, 0.8]);
    for (const shapes of [SHAPES, SHAPES_2027])
      for (const row of rows) expect(shapes.filter((part) => takes([part], 0, row)), `${shapes.length} ${row}`).toHaveLength(1);
    // Aujourd'hui, la première partie pose le bas et le milieu, la seconde le haut du corps ; en 2027, une partie chacun.
    expect(rows.map((row) => SHAPES.findIndex((part) => takes([part], 0, row)))).toEqual([0, 0, 1]);
    expect(rows.map((row) => SHAPES_2027.findIndex((part) => takes([part], 0, row)))).toEqual([0, 1, 2]);
  });

  it('les deux comptes suivent la grille : le premier plan a trois rangées, la moitié du bas en prend deux', () => {
    const plan = plansFor(ISLAND)[0];
    const cells = planCells(plan);
    const levels = [...new Set(cells.map((c) => c.z))].sort((a, b) => a - b);
    expect(levels).toHaveLength(3);
    const parties = partiesDe(ISLAND);
    const keys = (k: number) => new Set(parties[k].cases.flatMap((c) => c.keys));
    const rowKeys = (lo: number, hi: number) => new Set(cells.filter((c) => c.z >= levels[lo] && c.z <= levels[hi]).map((c) => c.key));
    expect(keys(0)).toEqual(rowKeys(0, 1));
    expect(keys(1)).toEqual(rowKeys(2, 2));
  });

  it('une sauvegarde d’avant la bascule dessine les mêmes volumes après : à une, deux, trois et quatre missions', () => {
    // Une mission d'aujourd'hui (les deux premières rangées) vaut deux parties de 2027 ; les suivantes, une de plus chacune.
    for (const [n, m] of [
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
    ] as const)
      expect(printOf(drawn(SHAPES_2027.slice(0, m))), `${n}`).toBe(printOf(shown(n)));
  });

  it('chaque partie pose quelque chose ; la ruine part avec la partie qui la remplace ; le signe de l’absence ne part jamais', () => {
    for (let n = 1; n <= 4; n++) expect(SHOWN[n].triangles, String(n)).not.toBe(SHOWN[n - 1].triangles);
    for (let m = 1; m <= 5; m++) expect(drawn(SHAPES_2027.slice(0, m)).triangles, String(m)).not.toBe(drawn(SHAPES_2027.slice(0, m - 1)).triangles);
    const ruin = placePieces('loge').filter((p) => p.stage === 'ruine');
    const fallen = ruin.filter((p) => p.until).map((p) => `${p.until!.stage}/${p.until!.row.toFixed(3)}`);
    expect(new Set(fallen)).toEqual(new Set(['0/0.000', '0/0.400', '0/0.800']));
    // La ferrure vide, l'appentis du costumier et sa lanterne : une pièce, toujours là.
    expect(ruin.filter((p) => !p.until)).toHaveLength(1);
    const absence = L.colors.bracket;
    const n0 = countColor(SHOWN[0], absence);
    expect(n0).toBeGreaterThan(0);
    for (let n = 1; n <= 4; n++) expect(countColor(SHOWN[n], absence)).toBe(n0);
    // Sur la face intérieure du pilier gauche (à l'est) de la porte des décors, tournée vers le passage ; jamais un portique.
    const plate = verticesOf(SHOWN[0], absence);
    for (const [x, , z] of plate) {
      expect(x).toBeGreaterThan(L.door.half - 0.2);
      expect(x).toBeLessThan(L.door.half + 0.05);
      expect(Math.abs(z - L.cage.z0)).toBeLessThan(L.cage.wall);
    }
  });

  it('coûte au plus 1 600 triangles à son état le plus chargé, la trace de 2027 comprise ; la ruine, 1 200 au plus', () => {
    let worst = 0;
    for (let n = 0; n <= 4; n++) worst = Math.max(worst, SHOWN[n].triangles + traces(n, [...MISSIONS, MISSION_2027]).triangles);
    for (let m = 0; m <= 5; m++) worst = Math.max(worst, drawn(SHAPES_2027.slice(0, m)).triangles + placeTrace('loge', posedTraces('loge', SHAPES_2027.slice(0, m), [...MISSIONS, MISSION_2027])).triangles);
    expect(worst).toBeLessThanOrEqual(PLACE_TRIANGLES_MAX_4E);
    expect(SHOWN[0].triangles).toBeLessThanOrEqual(PLACE_RUIN_TRIANGLES_MAX_4E);
    expect(LOGE.reach).toBeUndefined();
    expect(LOGE.restoration).toBeUndefined();
  });

  it('une seule lanterne allumée dans la ruine, celle du costumier ; trois au plus restaurée ; jamais une à une réussite', () => {
    const lit = (n: number) => countColor(SHOWN[n], COLORS_5E.lantern);
    expect(lit(0)).toBeGreaterThan(0);
    expect(lit(1)).toBe(lit(0));
    expect(lit(2)).toBe(lit(0));
    expect(lit(3)).toBe(2 * lit(0));
    expect(lit(4)).toBe(3 * lit(0));
  });

  it('aucun orange, ni lueur, ni cuivre, ni terre cuite ; la rouille dans la ruine seulement : restaurée, le fer est bruni sombre', () => {
    for (let n = 0; n <= 4; n++)
      for (const f of [SHOWN[n], traces(n, [...MISSIONS, MISSION_2027])])
        for (const c of [COLORS_4E.lava, FORGE_GLOW, ...FORGE_GLOW_FADE, COLORS_4E.copper, COLORS_4E.terracotta, OLD_ORANGE_BRICK]) expect(countColor(f, c), `${n} ${c.toString(16)}`).toBe(0);
    expect(countColor(SHOWN[0], COLORS_4E.rust)).toBeGreaterThan(0);
    for (const c of [COLORS_4E.rust, COLORS_4E.rustShade]) expect(countColor(SHOWN[4], c)).toBe(0);
  });

  it('une trace par mission, posée avec sa partie ; celle de 2027 jamais avant sa mission, puis avec le milieu du corps', () => {
    const count = (n: number) => posedTraces('loge', upTo(n), MISSIONS).length;
    expect([0, 1, 2, 3, 4].map(count)).toEqual([0, 1, 2, 3, 4]);
    for (const m of [...MISSIONS, MISSION_2027]) expect(LOGE.traces[m], m).toBeDefined();
    expect(Object.keys(LOGE.traces).sort()).toEqual([...MISSIONS, MISSION_2027].sort());
    // Aujourd'hui, la mission de 2027 n'existe pas : rien ne la pose, même le lieu restauré.
    expect(posedTraces('loge', SHAPES, MISSIONS)).not.toContain(MISSION_2027);
    // En 2027 : une trace par partie, celle du balai avec le milieu.
    const all = [...MISSIONS.slice(0, 1), MISSION_2027, ...MISSIONS.slice(1)];
    expect([0, 1, 2, 3, 4, 5].map((m) => posedTraces('loge', SHAPES_2027.slice(0, m), all).length)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(posedTraces('loge', SHAPES_2027.slice(0, 2), all)).toEqual(['dialogues', MISSION_2027]);
    expect(placeTrace('loge', []).triangles).toBe(0);
  });

  it('son nom se pose au-dessus du mur ouest, debout dans la ruine : jamais au droit de l’arche ni de la porte des décors', () => {
    const m = L.mapPoint;
    expect(LOGE.mapPoint).toEqual(m);
    expect(Math.abs(m.x)).toBeGreaterThan(L.arch.half + 1);
    expect(Math.abs(m.x)).toBeGreaterThan(L.door.half + 1);
    expect(m.x).toBeLessThan(L.cage.x0 + 1);
    expect(m.y - L.base).toBeGreaterThan(L.cage.ridge);
    // La marque du monde, en ruine comme entière, se pose au même droit que le nom sur la Carte.
    expect(markShift('loge').x).toBeCloseTo(m.x, 6);
    expect(markShift('loge').z).toBeCloseTo(m.z, 6);
  });

  it('la cage restaurée ne dépasse pas 10,5 ; plus basse en ruine ; sous la tour du Gabarit (12)', () => {
    expect(L.cage.ridge).toBeLessThanOrEqual(10.5);
    expect(topOf(SHOWN[4]) - L.base).toBeLessThanOrEqual(L.cage.ridge + 1e-3);
    expect(topOf(SHOWN[4]) - L.base).toBeGreaterThan(L.cage.ridge - 0.3);
    expect(topOf(SHOWN[0])).toBeLessThan(topOf(SHOWN[4]));
  });

  it('depuis le quai de la Crique, la grue du Gabarit dépasse la cage restaurée de tout son tiers haut', () => {
    const g = PLAN.places.find((p) => p.id === 'gabarit')!.center;
    const crane = GABARIT_LAYOUT.crane;
    const gy = ground(g.x, g.z) + GABARIT_LAYOUT.planeY(crane.x, crane.z);
    const foot = { x: g.x + crane.x, z: g.z + crane.z };
    const eye = [DEPARTURE_4E.at.x, ground(DEPARTURE_4E.at.x, DEPARTURE_4E.at.z) + FOLLOW.height, DEPARTURE_4E.at.z];
    const tris = trianglesOf(SHOWN[4]);
    // Le tiers haut du poteau, de son pied à 2/3 de sa hauteur jusqu'à son haut : jamais derrière la cage.
    for (const k of [2 / 3, 0.8, 1]) expect(blockedBy(tris, eye, [foot.x, gy + crane.h * k, foot.z]), String(k)).toBe(false);
  });

  it('les rails des contrepoids sont debout, sur le mur ouest ; le rideau rouge vin est tombé dans l’arche, puis posé ouvert de part et d’autre', () => {
    const iron = verticesOf(SHOWN[4], 0x5c504c).filter(([x]) => x < L.cage.x0 + 0.5);
    const tall = iron.filter(([, y]) => y - L.base > L.rails.top - 0.1);
    expect(tall.length).toBeGreaterThan(0);
    const curtain = (f: Facets) => verticesOf(f, L.colors.curtain);
    // Dans la ruine, en un tas bas dans l'arche.
    for (const [x, y] of curtain(SHOWN[0])) {
      expect(y - L.base).toBeLessThan(1.2);
      expect(Math.abs(x)).toBeLessThan(L.arch.half);
    }
    // Restauré, ouvert : rien au milieu de l'arche plus bas que le haut du cintre.
    const hung = curtain(SHOWN[4]);
    expect(hung.length).toBeGreaterThan(0);
    for (const [x, y] of hung) if (y - L.base < L.arch.crown - 0.4) expect(Math.abs(x), `${x}`).toBeGreaterThan(L.arch.half - 1.3);
    expect(L.colors.curtain).toBe(0x6e2a2c);
  });

  it('rien du lieu, en ruine comme restauré, sur le chemin de marche, de la porte à son chemin (à hauteur de Kéo)', () => {
    const door = nodes.get('loge')!;
    const way = nodes.get('bas-3')!;
    const sets: [Facets, boolean][] = [
      [SHOWN[0], true],
      [SHOWN[4], true],
      [traces(4, [...MISSIONS, MISSION_2027]), false],
    ];
    for (const [f, local] of sets) {
      for (let i = 0; i < f.positions.length; i += 9) {
        const x = (f.positions[i] + f.positions[i + 3] + f.positions[i + 6]) / 3 + (local ? PLACE.center.x : 0);
        const z = (f.positions[i + 2] + f.positions[i + 5] + f.positions[i + 8]) / 3 + (local ? PLACE.center.z : 0);
        const y = Math.min(f.positions[i + 1], f.positions[i + 4], f.positions[i + 7]) + (local ? H0 : 0);
        const low = y - ground(x, z) < 1.8;
        expect(low && distanceToPolyline({ x, z }, [door, way]) < 0.9, `${x.toFixed(1)}, ${z.toFixed(1)}`).toBe(false);
      }
    }
  });
});

describe('Le bilan de la Loge', () => {
  it('nomme la partie par son étape, jamais un nom du contenu ni « loge » en minuscule', () => {
    const words = stagePoseWords(ISLAND, PLACE);
    const parties = partiesDe(ISLAND);
    expect(parties).toHaveLength(4);
    const said = (k: number) => phraseDeLaPose({ posees: [parties[k]], plansFinis: [] }, words);
    expect([0, 1, 2, 3].map(said)).toEqual(['Partie posée : le corps de la Loge, 1 sur 2.', 'Partie posée : le corps de la Loge, 2 sur 2.', 'Partie posée : le haut de la Loge.', 'Partie posée : les abords de la Loge.']);
    for (const k of [0, 1, 2, 3]) expect(said(k)).not.toMatch(/Puck|Masque|théâtre|loge de/i);
    // Les phrases propres du lieu aussi (relecture du contenu du Bastion, retouche 1) : une par partie, aucune avec un nom
    // du contenu.
    const own = scenetteOf('loge').words!;
    expect(own.pose).toHaveLength(parties.length);
    for (const text of [...(own.pose ?? []), own.end ?? '']) expect(text).not.toMatch(/Puck|Masque|théâtre|loge de/i);
  });
});

describe('La scénette de la Loge', () => {
  it('le costumier, sans prénom ; sa phrase du métier ; sa réplique de fin, dite à la dernière pose ; jamais « loge »', () => {
    const s = scenetteOf('loge');
    expect(s.role).toBe('Le costumier');
    expect(s.greeting).toBe('Le costumier coud les habits des comédiens.');
    expect(s.words?.pose).toEqual(['Le plancher et la galerie sont refaits.', 'Le rideau est raccroché.', 'Le toit de la scène est posé.', 'Les bancs sont remis en rangs.']);
    expect(s.words?.end).toBe('Ici, après le travail, les ouvriers venaient écouter des histoires.');
    for (const text of [s.role, s.greeting ?? '', ...(s.words?.pose ?? []), s.words?.end ?? '']) expect(text).not.toMatch(/loge/i);
    expect(saysRestored('loge')).toBe(true);
  });

  it('elle se joue dehors, devant l’appentis, à l’est de la cage, la caméra vers l’est-sud-est ; ses abords sont enregistrés', () => {
    const s = L.scene;
    expect(s.dx - s.half[0]).toBeGreaterThan(L.cage.x1 + L.cage.wall / 2);
    expect(s.dz + s.half[1]).toBeLessThan(L.leanto.z0);
    const look = { x: -Math.sin(L.sceneStart), z: -Math.cos(L.sceneStart) };
    expect(look.x).toBeGreaterThan(0.9);
    expect(look.z).toBeGreaterThan(0.3);
    expect(look.z).toBeLessThan(0.45);
    const door = nodes.get('loge')!;
    expect(distance({ x: PLACE.center.x + s.dx, z: PLACE.center.z + s.dz }, door)).toBeGreaterThan(5);
    expect(SURROUNDINGS.loge).toBeDefined();
    const b = new FacetBuilder();
    SURROUNDINGS.loge!(b, { x: PLACE.center.x + s.dx, y: H0, z: PLACE.center.z + s.dz }, { posed: true } as never);
    expect(b.build().triangles).toBeLessThanOrEqual(SURROUNDINGS_MAX);
    expect(LOGE_SURROUNDINGS.folds.length).toBeGreaterThan(0);
  });

  it('rien du lieu entre la caméra de la scénette et Kéo ni le costumier, en ruine comme restaurée, à 1024 × 768', () => {
    const [w, h] = [1024, 768];
    const stage = scenetteLayout({ count: 3 }, w, h, questionLayout({ count: 3 }, w, h)).scenette!.stage;
    for (const posed of [false, true]) {
      const { pose } = scenettePose('loge', stage, w, h, posed);
      const at = orbitAround(pose.position, pose.target, L.sceneStart);
      expect(at.x).toBeLessThan(pose.target.x);
      const o = [at.x, at.y, at.z];
      const keo = scenetteKeo('loge', posed).at;
      const tailor = scenetteHabitant('loge', posed);
      const tris = trianglesOf(posed ? SHOWN[4] : SHOWN[0]);
      for (const t of [
        [keo.x, keo.y + 0.6, keo.z],
        [tailor.x, tailor.y + 1.2, tailor.z],
      ])
        expect(blockedBy(tris, o, t), `${posed} ${t}`).toBe(false);
    }
  });
});

/** Les triangles d'un maillage du lieu, dans le monde. */
function trianglesOf(f: Facets): number[][] {
  const P = f.positions;
  const out: number[][] = [];
  for (let i = 0; i < P.length; i += 9) out.push(Array.from(P.slice(i, i + 9), (v, k) => v + (k % 3 === 0 ? PLACE.center.x : k % 3 === 1 ? H0 : PLACE.center.z)));
  return out;
}

/** Le segment de `o` vers `t` traverse-t-il un triangle (Möller-Trumbore) ? */
function blockedBy(tris: readonly number[][], o: readonly number[], t: readonly number[]): boolean {
  const len = Math.hypot(t[0] - o[0], t[1] - o[1], t[2] - o[2]);
  const d = [(t[0] - o[0]) / len, (t[1] - o[1]) / len, (t[2] - o[2]) / len];
  return tris.some(([ax, ay, az, bx, by, bz, cx, cy, cz]) => {
    const e1 = [bx - ax, by - ay, bz - az];
    const e2 = [cx - ax, cy - ay, cz - az];
    const p = [d[1] * e2[2] - d[2] * e2[1], d[2] * e2[0] - d[0] * e2[2], d[0] * e2[1] - d[1] * e2[0]];
    const det = e1[0] * p[0] + e1[1] * p[1] + e1[2] * p[2];
    if (Math.abs(det) < 1e-9) return false;
    const s = [o[0] - ax, o[1] - ay, o[2] - az];
    const u = (s[0] * p[0] + s[1] * p[1] + s[2] * p[2]) / det;
    if (u < 0 || u > 1) return false;
    const q = [s[1] * e1[2] - s[2] * e1[1], s[2] * e1[0] - s[0] * e1[2], s[0] * e1[1] - s[1] * e1[0]];
    const v = (d[0] * q[0] + d[1] * q[1] + d[2] * q[2]) / det;
    if (v < 0 || u + v > 1) return false;
    const at = (e2[0] * q[0] + e2[1] * q[1] + e2[2] * q[2]) / det;
    return at > 0.01 && at < len - 0.3;
  });
}

describe('La vue d’arrivée de la Loge, des coulisses', () => {
  const door = nodes.get('loge')!;
  const focus = { x: door.x, y: ground(door.x, door.z), z: door.z };
  const W = 1024;
  const H = 768;
  const world = (x: number, y: number, z: number) => ({ x: PLACE.center.x + x, y: H0 + y, z: PLACE.center.z + z });

  it('la caméra au nord regarde vers le sud, à travers la porte des décors : l’arche au milieu, le faîte dans le cadre, l’appentis à gauche', () => {
    const yaw = doorViewOf('loge');
    // Tournée d'un rien vers le sud-ouest (retouche 1 du Bastion, point 8).
    expect(yaw).toBeLessThan(Math.PI - 0.1);
    expect(yaw).toBeGreaterThan(Math.PI - 0.35);
    const frame = doorFrameOf('loge')!;
    const pose = followPose(focus, occlusionLift(focus, ground, yaw), undefined, yaw, 1, undefined, frame);
    expect(pose.position.z).toBeLessThan(focus.z);
    const s = (x: number, z: number, y: number) => screenOf(pose, world(x, L.base + y, z), W, H);
    const inFrame = (p: { x: number; y: number }) => p.x > 16 && p.x < W - 16 && p.y > 8 && p.y < H;
    const ridgeW = s(L.cage.x0, L.cage.z1, L.cage.ridge);
    const ridgeE = s(L.cage.x1, L.cage.z1, L.cage.ridge);
    const arch = s(0, L.cage.z1, L.arch.crown);
    const leanto = s((L.leanto.x0 + L.leanto.x1) / 2, L.leanto.z0, 2);
    for (const p of [ridgeW, ridgeE, arch, leanto]) expect(inFrame(p), JSON.stringify(p)).toBe(true);
    expect(Math.abs(arch.x - W / 2)).toBeLessThan(W * 0.2);
    // Vue des coulisses, la caméra au nord : l'est (l'appentis) est à gauche.
    expect(leanto.x).toBeLessThan(arch.x);
    // Kéo (au milieu de l'écran) se tient hors de l'ouverture de la porte des décors, devant le mur nord.
    const keo = screenOf(pose, { x: focus.x, y: focus.y + 1, z: focus.z }, W, H);
    const doorW = s(-L.door.half, L.cage.z0, 1);
    const doorE = s(L.door.half, L.cage.z0, 1);
    expect(keo.x < Math.min(doorW.x, doorE.x) || keo.x > Math.max(doorW.x, doorE.x), JSON.stringify({ keo, doorW, doorE })).toBe(true);
  });
});

describe('La caméra qui suit, à la Loge', () => {
  const tris = trianglesOf(drawPieces('loge', (p) => p.stage !== 'ruine' || !p.until));
  const door = nodes.get('loge')!;
  const focus = { x: door.x, y: ground(door.x, door.z), z: door.z };
  const keo = [focus.x, focus.y + 1.2, focus.z];
  const camera = (yaw: number, frame?: { height: number; back: number }) => {
    const pose = frame ? followPose(focus, occlusionLift(focus, ground, yaw), undefined, yaw, 1, undefined, frame) : followPose(focus, occlusionLift(focus, ground, yaw), undefined, yaw);
    return [pose.position.x, pose.position.y, pose.position.z];
  };

  it('à l’arrivée, dans la vue des coulisses ; puis tournée de tous côtés (72 caps) : rien de haut entre elle et Kéo', () => {
    expect(blockedBy(tris, camera(doorViewOf('loge'), doorFrameOf('loge')!), keo)).toBe(false);
    const hidden = Array.from({ length: 72 }, (_, k) => k * 5).filter((deg) => blockedBy(tris, camera((deg * Math.PI) / 180), keo));
    expect(hidden).toEqual([]);
  });

  it('la porte est loin de la cage : la caméra qui suit n’entre jamais dedans', () => {
    // Le plus au nord de ce qui est haut (plus de 3 au-dessus du pied), restaurée : le mur nord, le débord du toit, les battants.
    const all = drawPieces('loge', (p) => p.stage !== 'ruine' || !p.until);
    let north = Infinity;
    for (let i = 0; i < all.positions.length; i += 3) if (all.positions[i + 1] - L.base > 3) north = Math.min(north, all.positions[i + 2]);
    expect(PLACE.center.z + north - door.z).toBeGreaterThan(FOLLOW.back);
  });
});
