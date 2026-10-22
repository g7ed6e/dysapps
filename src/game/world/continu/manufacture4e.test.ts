// La Manufacture (lot 3 du monde ouvert du 4e, le Bastion) : le lieu par parties (une par plan, d'après les plans de
// `history-4e-revolutions`), une seule lanterne allumée dans la ruine, trois au plus restaurée, une trace par mission avec
// sa partie, le signe de l'absence qui ne change jamais, la verrière en bande au faîte (pas tout le toit), une seule
// ligne de toit sans cheminée, le faîte à 8,5, la machine sous la halle et son balancier en plaque, le quai hors du chemin
// et de la tête du pont, la rouille dans la ruine seulement, rien sur le chemin de marche, la vue d'arrivée basse vers le
// nord-nord-est, la caméra qui voit Kéo de tous côtés, la scénette du tisserand, les plafonds de 1 600 et 1 200 triangles.
// Sans Three.js.
import { describe, expect, it } from 'vitest';
import type { BiomeId } from '../../biomes';
import { partShapes, stagePoseWords } from '../../three/archipeo/constructionParts';
import { phraseDeLaPose } from '../../poseWords';
import { partiesDe } from '../parts';
import { PLACE_RUIN_TRIANGLES_MAX_4E, PLACE_TRIANGLES_MAX_4E } from './budget';
import { followPose, occlusionLift, orbitAround, screenOf, type CameraPose } from './camera';
import { posedTraces, type PartShape, type Stage } from './construction';
import type { Facets } from './facets';
import { FacetBuilder } from './facets';
import { FORGE_GLOW, FORGE_GLOW_FADE } from './forge4e';
import { distance, distanceToPolyline, linearRgb } from './geometry';
import { hasHabitantModel } from './habitants';
import { hasScenette, planFor } from './levelPlan';
import { MANUFACTURE, MANUFACTURE_LAYOUT } from './manufacture4e';
import { MANUFACTURE_SURROUNDINGS } from './manufactureSurroundings';
import { doorFrameOf, doorViewOf } from './northShore';
import { BUILT_PLACES_4E, COLORS_4E, PATH_NODES_4E } from './plan4e';
import { COLORS_5E } from './plan5e';
import { drawPieces, placePieces } from './places';
import { placeTrace, questionLayout } from './questionScene';
import { RUINS_4E } from './ruins4e';
import { saysRestored, scenetteDeck, scenetteHabitant, scenetteKeo, scenetteLayout, scenetteOf, scenettePose } from './scenette';
import { SURROUNDINGS, SURROUNDINGS_MAX } from './surroundings';
import { standingHeight } from './terrain';
import { heightAt4e } from './terrain4e';

const PLAN = planFor('4e');
const PLACE = PLAN.places.find((p) => p.id === 'manufacture')!;
const SHAPES = partShapes(PLACE.island as BiomeId);
const MISSIONS = [...BUILT_PLACES_4E.manufacture];
const L = MANUFACTURE_LAYOUT;

const upTo = (n: number): PartShape[] => SHAPES.slice(0, n);
const takes = (parts: readonly PartShape[], stage: Stage, row: number) => parts.some((part) => part.some((s) => s.stage === stage && row >= s.from - 1e-9 && row < s.to - 1e-9));

function shown(n: number): Facets {
  const parts = upTo(n);
  return drawPieces('manufacture', (p) => (p.stage === 'ruine' ? !p.until || !takes(parts, p.until.stage, p.until.row) : takes(parts, p.stage, p.row)));
}

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

const ground = (x: number, z: number) => standingHeight(heightAt4e({ x, z }));
const nodes = new Map(PATH_NODES_4E.map((n) => [n.id, n.at]));
const traces = (n: number) => placeTrace('manufacture', posedTraces('manufacture', upTo(n), MISSIONS));
const H0 = ground(PLACE.center.x, PLACE.center.z);
const SHOWN = [0, 1, 2, 3].map(shown);

describe('La Manufacture, lieu complet', () => {
  it('ses trois missions se jouent dans sa scénette, en trois parties : le corps, le haut, les abords', () => {
    expect(PLACE.scenes).toEqual(MISSIONS);
    expect(MISSIONS).toEqual(['enlightenment', 'industrial-europe', 'french-society']);
    expect(hasScenette('manufacture')).toBe(true);
    expect(hasHabitantModel('manufacture')).toBe(true);
    expect(SHAPES.map((p) => p.map((s) => [s.stage, s.from, s.to]))).toEqual([[[0, 0, 1]], [[1, 0, 1]], [[2, 0, 1]]]);
    expect(Object.hasOwn(RUINS_4E, 'manufacture')).toBe(false);
  });

  it('chaque partie pose quelque chose ; la ruine part avec la partie qui la remplace ; le signe de l’absence ne part jamais', () => {
    for (let n = 1; n <= 3; n++) expect(SHOWN[n].triangles, String(n)).not.toBe(SHOWN[n - 1].triangles);
    const ruin = placePieces('manufacture').filter((p) => p.stage === 'ruine');
    const fallen = ruin.filter((p) => p.until).map((p) => `${p.until!.stage}/${p.until!.row.toFixed(3)}`);
    expect(new Set(fallen)).toEqual(new Set(['0/0.000', '1/0.000']));
    // Le pignon ouest et le bout du lanterneau, le dallage, la ferrure vide, le coin du tisserand : une pièce, toujours là.
    expect(ruin.filter((p) => !p.until)).toHaveLength(1);
    const absence = 0x6a483e;
    const n0 = countColor(SHOWN[0], absence);
    expect(n0).toBeGreaterThan(0);
    for (let n = 1; n <= 3; n++) expect(countColor(SHOWN[n], absence)).toBe(n0);
  });

  it('coûte au plus 1 600 triangles à son état le plus chargé, traces comprises ; la ruine, 1 200 au plus', () => {
    let worst = 0;
    for (let n = 0; n <= 3; n++) worst = Math.max(worst, SHOWN[n].triangles + traces(n).triangles);
    expect(worst).toBeLessThanOrEqual(PLACE_TRIANGLES_MAX_4E);
    expect(SHOWN[0].triangles).toBeLessThanOrEqual(PLACE_RUIN_TRIANGLES_MAX_4E);
    expect(MANUFACTURE.reach).toBeUndefined();
    expect(MANUFACTURE.restoration).toBeUndefined();
  });

  it('une seule lanterne allumée dans la ruine, celle du tisserand ; trois au plus restaurée ; jamais une à une réussite', () => {
    const lit = (n: number) => countColor(SHOWN[n], COLORS_5E.lantern);
    expect(lit(0)).toBeGreaterThan(0);
    expect(lit(1)).toBe(lit(0));
    expect(lit(2)).toBe(2 * lit(0));
    expect(lit(3)).toBe(3 * lit(0));
  });

  it('aucune lueur rouge ni cuivre ni terre cuite ; la rouille dans la ruine seulement : restaurée, le fer est bruni sombre', () => {
    for (let n = 0; n <= 3; n++)
      for (const f of [SHOWN[n], traces(n)]) for (const c of [COLORS_4E.lava, FORGE_GLOW, ...FORGE_GLOW_FADE, COLORS_4E.copper, COLORS_4E.terracotta]) expect(countColor(f, c), `${n} ${c.toString(16)}`).toBe(0);
    expect(countColor(SHOWN[0], COLORS_4E.rust)).toBeGreaterThan(0);
    for (const c of [COLORS_4E.rust, COLORS_4E.rustShade]) expect(countColor(SHOWN[3], c)).toBe(0);
  });

  it('une trace par mission, posée avec sa partie : une de plus à chaque partie', () => {
    const count = (n: number) => posedTraces('manufacture', upTo(n), MISSIONS).length;
    expect([0, 1, 2, 3].map(count)).toEqual([0, 1, 2, 3]);
    for (const m of MISSIONS) expect(MANUFACTURE.traces[m], m).toBeDefined();
    expect(placeTrace('manufacture', []).triangles).toBe(0);
  });

  it('la verrière est une bande au faîte, jamais tout le toit : le verre ne descend pas sous le pied du lanterneau', () => {
    const glass = verticesOf(SHOWN[3], L.colors.glass);
    expect(glass.length).toBeGreaterThan(0);
    for (const [, y, z] of glass) {
      expect(Math.abs(z - L.midZ)).toBeLessThanOrEqual(L.hall.band + 1e-3);
      expect(y - L.base).toBeGreaterThan(L.hall.roofTop);
    }
    // Le verre fait toute la longueur de la halle, restaurée ; dans la ruine, sa moitié ouest seulement.
    const span = (v: [number, number, number][]) => [Math.min(...v.map((p) => p[0])), Math.max(...v.map((p) => p[0]))];
    const [a, c] = span(glass);
    expect(c - a).toBeGreaterThan(L.hall.x1 - L.hall.x0 - 1);
    const ruin = span(verticesOf(SHOWN[0], L.colors.glass));
    expect(ruin[0]).toBeLessThan(L.hall.x0 + 1);
    expect(ruin[1]).toBeLessThanOrEqual(0.01);
    // La tôle rouge sombre couvre le reste du toit, restaurée.
    expect(countColor(SHOWN[3], L.colors.roof)).toBeGreaterThan(0);
  });

  it('une seule ligne de toit continue, la verrière au plus haut (8,5), sans cheminée ni rien qui dépasse', () => {
    expect(topOf(SHOWN[3]) - L.base).toBeLessThanOrEqual(L.hall.ridge + 1e-3);
    expect(topOf(SHOWN[3]) - L.base).toBeGreaterThan(L.hall.ridge - 0.2);
    // Rien au-dessus du toit hors du faîte : tout ce qui dépasse la tôle est sous la bande du lanterneau.
    const P = SHOWN[3].positions;
    for (let i = 0; i < P.length; i += 3) {
      const y = P[i + 1] - L.base;
      if (y > L.hall.roofTop + 0.15) expect(Math.abs(P[i + 2] - L.midZ), `${P[i]}, ${y}`).toBeLessThanOrEqual(L.hall.band + 0.15);
    }
    // En ruine, plus bas que restaurée.
    expect(topOf(SHOWN[0])).toBeLessThanOrEqual(topOf(SHOWN[3]));
  });

  it('la machine est sous la halle, dans la travée est ; son balancier est une plaque à plat (ruine) ou de niveau (restaurée)', () => {
    const M = L.machine;
    expect(M.x).toBeGreaterThan(L.columns.at(-1)! + 1);
    expect(M.x + M.wheel.r).toBeLessThan(L.hall.x1);
    expect(M.wheel.z - 0.6).toBeGreaterThan(L.hall.z0);
    expect(M.wheel.z + 0.6).toBeLessThan(L.hall.z1);
  });

  it('le quai de chargement est contre le pignon ouest, hors du chemin `bas-1` et de la tête du pont', () => {
    const Q = L.quay;
    expect(Q.x1).toBeLessThanOrEqual(L.hall.x0);
    expect(Q.z1).toBeLessThan(L.hall.z1);
    const c = PLACE.center;
    const bas1 = nodes.get('bas-1')!;
    const fab5 = nodes.get('fab-5')!;
    const door = nodes.get('manufacture')!;
    const bas2 = nodes.get('bas-2')!;
    for (const x of [Q.x0, Q.x1])
      for (const z of [Q.z0, Q.z1]) {
        const p = { x: c.x + x, z: c.z + z };
        expect(distanceToPolyline(p, [door, bas1])).toBeGreaterThan(3);
        expect(distanceToPolyline(p, [bas1, bas2])).toBeGreaterThan(3);
        expect(distanceToPolyline(p, [fab5, bas1])).toBeGreaterThan(3);
      }
  });

  it('rien du lieu, en ruine comme restauré, sur le chemin de marche, de la porte à son chemin (à hauteur de Kéo)', () => {
    const door = nodes.get('manufacture')!;
    const way = nodes.get('bas-1')!;
    const sets: [Facets, boolean][] = [
      [SHOWN[0], true],
      [SHOWN[3], true],
      [traces(3), false],
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

describe('Le bilan de la Manufacture', () => {
  it('nomme la partie par son étape, jamais un nom du contenu', () => {
    const island = PLACE.island as BiomeId;
    const words = stagePoseWords(island, PLACE);
    const parties = partiesDe(island);
    expect(parties).toHaveLength(3);
    const said = (k: number) => phraseDeLaPose({ posees: [parties[k]], plansFinis: [] }, words);
    expect([0, 1, 2].map(said)).toEqual(['Partie posée : le corps de la Manufacture.', 'Partie posée : le haut de la Manufacture.', 'Partie posée : les abords de la Manufacture.']);
    for (const k of [0, 1, 2]) expect(said(k)).not.toMatch(/Typo|halle|Paon/i);
  });
});

describe('La scénette de la Manufacture', () => {
  it('le tisserand, sans prénom ; sa phrase du métier ; sa réplique de fin, dite à la dernière pose', () => {
    const s = scenetteOf('manufacture');
    expect(s.role).toBe('Le tisserand');
    expect(s.greeting).toBe('Le tisserand fait la toile, fil après fil.');
    expect(s.words?.pose).toEqual(['La halle est relevée.', 'La verrière est posée.', 'La cour est prête.']);
    expect(s.words?.end).toBe('Sous cette verrière, les machines ont changé le monde.');
    expect(saysRestored('manufacture')).toBe(true);
  });

  it('elle se joue dans la travée ouest, devant le coin du tisserand, la caméra vers le pignon plein ; ses abords sont enregistrés', () => {
    const s = L.scene;
    const H = L.hall;
    // Dans la halle, à l'ouest de la deuxième colonne, au nord de leur rangée.
    expect(s.dx - s.half[0]).toBeGreaterThan(H.x0 + H.wall / 2);
    expect(s.dx + s.half[0]).toBeLessThan(L.columns[1]);
    expect(s.dz - s.half[1]).toBeGreaterThan(H.z0 + H.wall / 2);
    expect(s.dz + s.half[1]).toBeLessThan(L.midZ);
    // Vers l'ouest.
    const look = { x: -Math.sin(L.sceneStart), z: -Math.cos(L.sceneStart) };
    expect(look.x).toBeLessThan(-0.99);
    expect(SURROUNDINGS.manufacture).toBeDefined();
    const b = new FacetBuilder();
    SURROUNDINGS.manufacture!(b, { x: PLACE.center.x + s.dx, y: H0, z: PLACE.center.z + s.dz }, { posed: true } as never);
    expect(b.build().triangles).toBeLessThanOrEqual(SURROUNDINGS_MAX);
    expect(MANUFACTURE_SURROUNDINGS.bolts.length).toBeGreaterThan(0);
  });

  it('rien du lieu entre la caméra de la scénette et Kéo ni le tisserand, en ruine comme restaurée, à 1024 × 768', () => {
    const [w, h] = [1024, 768];
    const stage = scenetteLayout({ count: 3 }, w, h, questionLayout({ count: 3 }, w, h)).scenette!.stage;
    for (const posed of [false, true]) {
      // La pose prévue, tournée de son cap de départ autour du point visé (comme la vue, `turnScenePose`).
      const { pose } = scenettePose('manufacture', stage, w, h, posed);
      const at = orbitAround(pose.position, pose.target, L.sceneStart);
      expect(at.x).toBeGreaterThan(pose.target.x);
      const o = [at.x, at.y, at.z];
      const keo = scenetteKeo('manufacture', posed).at;
      const weaver = scenetteHabitant('manufacture', posed);
      const tris = trianglesOf(posed ? SHOWN[3] : SHOWN[0]);
      for (const t of [
        [keo.x, keo.y + 0.6, keo.z],
        [weaver.x, weaver.y + 1.2, weaver.z],
      ])
        expect(blockedBy(tris, o, t), `${posed} ${t}`).toBe(false);
    }
  });
});


describe('Le cadre de la scénette de la Manufacture (captures du 22 octobre 2026)', () => {
  const [w, h] = [1024, 768];
  // La rangée sur toute la largeur, et la colonne de texte à gauche (l'item a sa règle) : les deux cadres d'une tablette.
  const layouts = [
    { name: 'pleine largeur', base: { count: 3 }, needs: { count: 3 } },
    { name: 'colonne', base: { count: 3, aid: true }, needs: { count: 3, column: true, aid: true } },
  ];
  /** Le point du sol (hauteur `y`) sous un pixel de l'écran, pour la caméra tournée de son cap de départ. */
  const under = (pose: CameraPose, shift: { x: number; y: number }, px: number, py: number, y: number) => {
    const f = { x: pose.target.x - pose.position.x, y: pose.target.y - pose.position.y, z: pose.target.z - pose.position.z };
    const fl = Math.hypot(f.x, f.y, f.z);
    f.x /= fl;
    f.y /= fl;
    f.z /= fl;
    const rl = Math.hypot(f.z, f.x);
    const right = { x: -f.z / rl, y: 0, z: f.x / rl };
    const u = { x: -f.y * f.x, y: 1 - f.y * f.y, z: -f.y * f.z };
    const ul = Math.hypot(u.x, u.y, u.z);
    const half = Math.tan((pose.fov * Math.PI) / 360);
    const sx = (2 * (px + shift.x)) / w - 1;
    const sy = 1 - (2 * (py + shift.y)) / h;
    const d = { x: f.x + sx * half * (w / h) * right.x + (sy * half * u.x) / ul, y: f.y + (sy * half * u.y) / ul, z: f.z + sx * half * (w / h) * right.z + (sy * half * u.z) / ul };
    const k = (y - pose.position.y) / d.y;
    return { x: pose.position.x + k * d.x, y, z: pose.position.z + k * d.z };
  };

  it('rien du lieu entre la caméra et les bobines des réponses, ni sous elles ; aucune colonne dans la scène à côté du texte', () => {
    for (const { name, base, needs } of layouts)
      for (const posed of [false, true]) {
        const q = questionLayout(base, w, h);
        const lay = scenetteLayout(needs, w, h, q);
        const stage = lay.scenette!.stage;
        const { pose, shift } = scenettePose('manufacture', stage, w, h, posed);
        const turned = { ...pose, position: orbitAround(pose.position, pose.target, L.sceneStart) };
        const o = [turned.position.x, turned.position.y, turned.position.z];
        const tris = trianglesOf(posed ? SHOWN[3] : SHOWN[0]);
        const deck = scenetteDeck('manufacture', posed).y;
        for (const slot of lay.slots ?? q.slots) {
          const p = under(turned, shift, slot.foot.x, slot.foot.y, deck);
          for (const dy of [0.25, 0.6]) expect(blockedBy(tris, o, [p.x, p.y + dy, p.z]), `${name} ${posed} ${p.x - PLACE.center.x}, ${p.z - PLACE.center.z}`).toBe(false);
          // Aucun métier sous une bobine.
          for (const m of L.looms) expect(Math.max(Math.abs(p.x - PLACE.center.x - m.x), Math.abs(p.z - PLACE.center.z - m.z)), `${name} ${posed}`).toBeGreaterThan(0.95);
        }
        if (needs.column) {
          // La première colonne passe derrière le texte, à gauche de la scène.
          const c = screenOf(turned, { x: PLACE.center.x + L.columns[0], y: H0 + L.base + 2, z: PLACE.center.z + L.midZ }, w, h);
          expect(c.x - shift.x).toBeLessThan(stage.left);
        }
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

describe('La vue d’arrivée de la Manufacture', () => {
  const door = nodes.get('manufacture')!;
  const focus = { x: door.x, y: ground(door.x, door.z), z: door.z };
  const W = 1024;
  const H = 768;
  const world = (x: number, y: number, z: number) => ({ x: PLACE.center.x + x, y: H0 + y, z: PLACE.center.z + z });

  it('basse, vers le nord-nord-est : la halle en longueur, la travée ouest à gauche, la machine à droite, le faîte dans le cadre', () => {
    const yaw = doorViewOf('manufacture');
    const frame = doorFrameOf('manufacture')!;
    expect(frame).toEqual({ height: -3, back: 1.5 });
    const pose = followPose(focus, occlusionLift(focus, ground, yaw), undefined, yaw, 1, undefined, frame);
    const s = (x: number, z: number, y: number) => screenOf(pose, world(x, L.base + y, z), W, H);
    const inFrame = (p: { x: number; y: number }) => p.x > 16 && p.x < W - 16 && p.y > 8 && p.y < H;
    const westEnd = s(L.hall.x0, L.midZ, L.hall.ridge);
    const eastEnd = s(L.hall.x1, L.midZ, L.hall.ridge);
    const machine = s(L.machine.x, L.machine.wheel.z, L.machine.wheel.axle);
    const corner = s(L.corner.loom.x, L.corner.loom.z, 2.5);
    for (const p of [westEnd, eastEnd, machine]) expect(inFrame(p), JSON.stringify(p)).toBe(true);
    expect(corner.x).toBeLessThan(W / 2);
    expect(machine.x).toBeGreaterThan(W / 2);
    // La halle en longueur : ses deux bouts loin l'un de l'autre à l'écran.
    expect(eastEnd.x - westEnd.x).toBeGreaterThan(W * 0.45);
  });
});

describe('La caméra qui suit, à la Manufacture', () => {
  const tris = trianglesOf(drawPieces('manufacture', (p) => p.stage !== 'ruine' || !p.until));
  const door = nodes.get('manufacture')!;
  const focus = { x: door.x, y: ground(door.x, door.z), z: door.z };
  const keo = [focus.x, focus.y + 1.2, focus.z];
  const camera = (yaw: number, frame?: { height: number; back: number }) => {
    const pose = frame ? followPose(focus, occlusionLift(focus, ground, yaw), undefined, yaw, 1, undefined, frame) : followPose(focus, occlusionLift(focus, ground, yaw), undefined, yaw);
    return [pose.position.x, pose.position.y, pose.position.z];
  };

  it('à l’arrivée, dans la vue basse de « Y aller » ; puis tournée de tous côtés (72 caps) : rien de haut entre elle et Kéo', () => {
    expect(blockedBy(tris, camera(doorViewOf('manufacture'), doorFrameOf('manufacture')!), keo)).toBe(false);
    const hidden = Array.from({ length: 72 }, (_, k) => k * 5).filter((deg) => blockedBy(tris, camera((deg * Math.PI) / 180), keo));
    expect(hidden).toEqual([]);
  });

  it('la porte est loin de la halle : la caméra qui suit n’entre jamais dedans', () => {
    expect(distance(door, { x: PLACE.center.x, z: PLACE.center.z + L.hall.z1 })).toBeGreaterThan(7);
  });
});
