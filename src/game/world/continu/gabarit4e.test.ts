// Le Gabarit (lot 3 du monde ouvert du 4e, le Bastion) : le lieu par parties (3 + 1 + 1, d'après les trois plans de
// `maths-4e-algebra`), une seule lanterne allumée dans la ruine, trois au plus restauré, une trace par mission avec sa
// partie, le signe de l'absence qui ne change jamais, la grue seule verticale fine, debout en ruine comme restaurée, sa
// flèche d'un seul côté, aucune lueur, rien sur le chemin de marche, la vue d'arrivée basse où la grue tient entière, la
// caméra qui voit Kéo de tous côtés, la scénette du géomètre, les plafonds de 1 600 et 1 200 triangles. Sans Three.js.
import { describe, expect, it } from 'vitest';
import type { BiomeId } from '../../biomes';
import { partShapes, stagePoseWords } from '../../three/archipeo/constructionParts';
import { phraseDeLaPose } from '../../poseWords';
import { partiesDe } from '../parts';
import { PLACE_RUIN_TRIANGLES_MAX_4E, PLACE_TRIANGLES_MAX_4E } from './budget';
import { followPose, occlusionLift, screenOf } from './camera';
import { posedTraces, type PartShape, type Stage } from './construction';
import type { Facets } from './facets';
import { FacetBuilder } from './facets';
import { FORGE_GLOW, FORGE_GLOW_FADE } from './forge4e';
import { GABARIT, GABARIT_LAYOUT } from './gabarit4e';
import { GABARIT_SURROUNDINGS } from './gabaritSurroundings';
import { distance, distanceToPolyline, linearRgb } from './geometry';
import { hasHabitantModel } from './habitants';
import { hasScenette, planFor } from './levelPlan';
import { doorFrameOf, doorViewOf } from './northShore';
import { BUILT_PLACES_4E, COLORS_4E, PATH_NODES_4E } from './plan4e';
import { COLORS_5E } from './plan5e';
import { drawPieces, placePieces } from './places';
import { placeTrace } from './questionScene';
import { RUINS_4E } from './ruins4e';
import { saysRestored, scenetteOf } from './scenette';
import { SURROUNDINGS, SURROUNDINGS_MAX } from './surroundings';
import { standingHeight } from './terrain';
import { heightAt4e } from './terrain4e';

const PLAN = planFor('4e');
const PLACE = PLAN.places.find((p) => p.id === 'gabarit')!;
const SHAPES = partShapes(PLACE.island as BiomeId);
const MISSIONS = [...BUILT_PLACES_4E.gabarit];
const L = GABARIT_LAYOUT;

const upTo = (n: number): PartShape[] => SHAPES.slice(0, n);
const takes = (parts: readonly PartShape[], stage: Stage, row: number) => parts.some((part) => part.some((s) => s.stage === stage && row >= s.from - 1e-9 && row < s.to - 1e-9));

function shown(n: number): Facets {
  const parts = upTo(n);
  return drawPieces('gabarit', (p) => (p.stage === 'ruine' ? !p.until || !takes(parts, p.until.stage, p.until.row) : takes(parts, p.stage, p.row)));
}

function countColor(f: Facets, color: number): number {
  const [r, g, b] = linearRgb(color);
  let n = 0;
  for (let i = 0; i < f.colors.length; i += 3) if (Math.abs(f.colors[i] - r) < 1e-4 && Math.abs(f.colors[i + 1] - g) < 1e-4 && Math.abs(f.colors[i + 2] - b) < 1e-4) n++;
  return n;
}

/** Le plus haut d'un maillage, dans une colonne autour de (`x`, `z`) (dans le repère du lieu). */
function topNear(f: Facets, x: number, z: number, r: number): number {
  let top = -Infinity;
  for (let i = 0; i < f.positions.length; i += 3) if (Math.hypot(f.positions[i] - x, f.positions[i + 2] - z) < r) top = Math.max(top, f.positions[i + 1]);
  return top;
}

const ground = (x: number, z: number) => standingHeight(heightAt4e({ x, z }));
const nodes = new Map(PATH_NODES_4E.map((n) => [n.id, n.at]));
const traces = (n: number) => placeTrace('gabarit', posedTraces('gabarit', upTo(n), MISSIONS));
const H0 = ground(PLACE.center.x, PLACE.center.z);

describe('Le Gabarit, lieu complet', () => {
  it('ses cinq missions se jouent dans sa scénette, en cinq parties : le corps en trois, le haut, les abords', () => {
    expect(PLACE.scenes).toEqual(MISSIONS);
    expect(MISSIONS).toEqual(['simplifying', 'expanding', 'equations', 'rationals', 'pythagorean-theorem']);
    expect(hasScenette('gabarit')).toBe(true);
    expect(hasHabitantModel('gabarit')).toBe(true);
    expect(SHAPES.map((p) => p.map((s) => [s.stage, s.from, s.to]))).toEqual([[[0, 0, 1 / 3]], [[0, 1 / 3, 2 / 3]], [[0, 2 / 3, 1]], [[1, 0, 1]], [[2, 0, 1]]]);
    expect(Object.hasOwn(RUINS_4E, 'gabarit')).toBe(false);
  });

  it('chaque partie pose quelque chose ; la ruine part avec la rangée qui la remplace ; le signe de l’absence ne part jamais', () => {
    for (let n = 1; n <= 5; n++) expect(shown(n).triangles, String(n)).not.toBe(shown(n - 1).triangles);
    const ruin = placePieces('gabarit').filter((p) => p.stage === 'ruine');
    const fallen = ruin.filter((p) => p.until).map((p) => `${p.until!.stage}/${p.until!.row.toFixed(3)}`);
    expect(new Set(fallen)).toEqual(new Set(['0/0.000', '0/0.333', '0/0.667', '1/0.000', '2/0.000']));
    // Le rez-de-chaussée, les corbeaux, la grue, le pied de la balance, le signe de l'absence, l'abri : une pièce, toujours là.
    expect(ruin.filter((p) => !p.until)).toHaveLength(1);
  });

  it('coûte au plus 1 600 triangles à son état le plus chargé, traces comprises ; la ruine, 1 200 au plus', () => {
    let worst = 0;
    for (let n = 0; n <= 5; n++) worst = Math.max(worst, shown(n).triangles + traces(n).triangles);
    expect(worst).toBeLessThanOrEqual(PLACE_TRIANGLES_MAX_4E);
    expect(shown(0).triangles).toBeLessThanOrEqual(PLACE_RUIN_TRIANGLES_MAX_4E);
    expect(GABARIT.reach).toBeUndefined();
    expect(GABARIT.restoration).toBeUndefined();
  });

  it('une seule lanterne allumée dans la ruine, celle de l’abri ; trois au plus restauré ; jamais une à une réussite', () => {
    const lit = (n: number) => countColor(shown(n), COLORS_5E.lantern);
    expect(lit(0)).toBeGreaterThan(0);
    for (let n = 1; n <= 3; n++) expect(lit(n), String(n)).toBe(lit(0));
    expect(lit(4)).toBe(2 * lit(0));
    expect(lit(5)).toBe(3 * lit(0));
  });

  it('aucune lueur rouge, à aucune étape ; ni la rouille claire qui se lit orange, ni le cuivre', () => {
    for (let n = 0; n <= 5; n++)
      for (const f of [shown(n), traces(n)]) for (const c of [COLORS_4E.lava, FORGE_GLOW, ...FORGE_GLOW_FADE, COLORS_4E.rust, COLORS_4E.copper]) expect(countColor(f, c), `${n} ${c.toString(16)}`).toBe(0);
  });

  it('la terre cuite au haut seulement : les toits de l’atelier et de la tour', () => {
    for (let n = 0; n <= 3; n++) expect(countColor(shown(n), COLORS_4E.terracotta), String(n)).toBe(0);
    expect(countColor(shown(4), COLORS_4E.terracotta)).toBeGreaterThan(0);
  });

  it('une trace par mission, posée avec sa partie : une de plus à chaque partie', () => {
    const count = (n: number) => posedTraces('gabarit', upTo(n), MISSIONS).length;
    expect([0, 1, 2, 3, 4, 5].map(count)).toEqual([0, 1, 2, 3, 4, 5]);
    for (const m of MISSIONS) expect(GABARIT.traces[m], m).toBeDefined();
    expect(placeTrace('gabarit', []).triangles).toBe(0);
  });

  it('la grue, seule verticale fine, debout en ruine comme restaurée, la plus haute du lieu ; la tour sous elle', () => {
    const C = L.crane;
    for (const n of [0, 5]) {
      const f = shown(n);
      const crane = topNear(f, C.x, C.z, C.side);
      expect(crane, String(n)).toBeGreaterThan(L.base + 15.5);
      // La tour, plus basse que la grue ; l'atelier, plus bas que la tour.
      const T = L.tower;
      expect(topNear(f, (T.x0 + T.x1) / 2, (T.z0 + T.z1) / 2, 1.0)).toBeLessThan(crane - 4);
    }
    // Restaurée : la tour à environ 12 avec son pavillon, la grue à environ 17 avec sa flèche.
    const whole = shown(5);
    let top = -Infinity;
    for (let i = 1; i < whole.positions.length; i += 3) top = Math.max(top, whole.positions[i]);
    expect(top - L.base).toBeGreaterThan(16.5);
    expect(top - L.base).toBeLessThan(17.5);
    expect(topNear(whole, (L.tower.x0 + L.tower.x1) / 2, (L.tower.z0 + L.tower.z1) / 2, 0.3) - L.base).toBeCloseTo(12, 0);
  });

  it('la flèche de la grue d’un seul côté, au-dessus du plancher : jamais une croix ni un T ; le crochet au-dessus du plancher', () => {
    const C = L.crane;
    const F = L.floor;
    // Le bout de la flèche, vu d'en haut, est au-dessus du plancher, et rien de la grue ne dépasse de l'autre côté du poteau.
    expect(C.tip.x).toBeGreaterThan(F.x0);
    expect(C.tip.x).toBeLessThan(F.x1);
    expect(C.tip.z).toBeGreaterThan(F.z0);
    expect(C.tip.z).toBeLessThan(F.z1);
    const away = { x: C.x - C.tip.x, z: C.z - C.tip.z };
    const f = shown(5);
    for (let i = 0; i < f.positions.length; i += 3) {
      if (f.positions[i + 1] < L.base + 12) continue;
      const d = { x: f.positions[i] - C.x, z: f.positions[i + 2] - C.z };
      // Au-dessus de 12, rien au-delà du poteau, du côté opposé à la flèche.
      expect(d.x * away.x + d.z * away.z).toBeLessThan(0.6 * Math.hypot(away.x, away.z));
    }
  });

  it('la tour jamais couronnée : son haut en ruine cassé en biais, restaurée d’aplomb', () => {
    const r = L.tower.ruin;
    expect(Math.max(...r) - Math.min(...r)).toBeGreaterThan(2);
    expect(Math.max(...r)).toBeLessThanOrEqual(10);
    expect(L.tower.top).toBeGreaterThan(Math.max(...r));
  });

  it('rien du lieu, en ruine comme restauré, sur le chemin de marche, de la porte à son chemin (à hauteur de Kéo)', () => {
    const door = nodes.get('gabarit')!;
    const way = nodes.get('bas-3')!;
    const sets: [Facets, boolean][] = [
      [shown(0), true],
      [shown(5), true],
      [traces(5), false],
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

describe('Le bilan du Gabarit', () => {
  it('nomme la partie par son étape, jamais un nom du contenu', () => {
    const island = PLACE.island as BiomeId;
    const words = stagePoseWords(island, PLACE);
    const parties = partiesDe(island);
    expect(parties).toHaveLength(5);
    const said = (k: number) => phraseDeLaPose({ posees: [parties[k]], plansFinis: [] }, words);
    expect([0, 1, 2, 3, 4].map(said)).toEqual([
      'Partie posée : le corps du Gabarit, 1 sur 3.',
      'Partie posée : le corps du Gabarit, 2 sur 3.',
      'Partie posée : le corps du Gabarit, 3 sur 3.',
      'Partie posée : le haut du Gabarit.',
      'Partie posée : les abords du Gabarit.',
    ]);
    for (const k of [0, 1, 2, 3, 4]) expect(said(k)).not.toMatch(/Ixe|bureau|Golem/);
  });
});

describe('La scénette du Gabarit', () => {
  it('le géomètre, sans prénom ; sa phrase du métier, jamais le géologue ; sa réplique de fin, dite à la dernière pose', () => {
    const s = scenetteOf('gabarit');
    expect(s.role).toBe('Le géomètre');
    expect(s.greeting).toBe('Le géomètre mesure et trace avant qu’on construise.');
    expect(s.words?.pose).toHaveLength(5);
    expect(s.words?.end).toBe('Ici, on traçait chaque pièce en grand avant de la tailler.');
    expect(saysRestored('gabarit')).toBe(true);
    for (const text of [s.role, s.greeting ?? '', ...(s.words?.pose ?? []), s.words?.end ?? '']) expect(text).not.toMatch(/géologue|Ixe|Golem|forteresse|guerre/i);
  });

  it('elle se joue devant l’abri, hors du chemin et loin de la porte, la caméra vers l’est-nord-est ; ses abords sont enregistrés', () => {
    const s = L.scene;
    const door = nodes.get('gabarit')!;
    const way = nodes.get('bas-3')!;
    for (const [sx, sz] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ])
      expect(distanceToPolyline({ x: PLACE.center.x + s.dx + sx * s.half[0], z: PLACE.center.z + s.dz + sz * s.half[1] }, [door, way])).toBeGreaterThan(1.5);
    expect(distance({ x: PLACE.center.x + s.dx, z: PLACE.center.z + s.dz }, door)).toBeGreaterThan(3);
    // Vers l'est-nord-est : l'abri et le mur devant la caméra.
    const look = { x: -Math.sin(L.sceneStart), z: -Math.cos(L.sceneStart) };
    expect(look.x).toBeGreaterThan(0.8);
    expect(look.z).toBeLessThan(0);
    expect(SURROUNDINGS.gabarit).toBeDefined();
    const b = new FacetBuilder();
    SURROUNDINGS.gabarit!(b, { x: PLACE.center.x + s.dx, y: 0, z: PLACE.center.z + s.dz }, { posed: true } as never);
    expect(b.build().triangles).toBeLessThanOrEqual(SURROUNDINGS_MAX);
    expect(GABARIT_SURROUNDINGS.rocks.length).toBeGreaterThan(0);
  });
});

describe('La vue d’arrivée du Gabarit', () => {
  const door = nodes.get('gabarit')!;
  const focus = { x: door.x, y: ground(door.x, door.z), z: door.z };
  const W = 1024;
  const H = 768;
  const world = (x: number, y: number, z: number) => ({ x: PLACE.center.x + x, y: H0 + y, z: PLACE.center.z + z });

  it('basse, vers le nord-nord-est : l’atelier près du milieu, la grue entière à droite, de son pied au bout de sa flèche', () => {
    const yaw = doorViewOf('gabarit');
    const frame = doorFrameOf('gabarit')!;
    expect(frame.height).toBeLessThan(0);
    expect(frame.back).toBeLessThanOrEqual(1.6);
    const pose = followPose(focus, occlusionLift(focus, ground, yaw), undefined, yaw, 1, undefined, frame);
    const s = (p: { x: number; y: number; z: number }) => screenOf(pose, p, W, H);
    const C = L.crane;
    const foot = s(world(C.x, L.base, C.z));
    const head = s(world(C.x, L.base + C.h, C.z));
    const tip = s(world(C.tip.x, L.base + C.tip.y, C.tip.z));
    for (const p of [foot, head, tip]) {
      expect(p.x).toBeGreaterThan(W / 2);
      expect(p.x).toBeLessThan(W - 16);
      expect(p.y).toBeGreaterThan(8);
      expect(p.y).toBeLessThan(H);
    }
    const atelier = s(world(0, L.base + 4, 0));
    expect(Math.abs(atelier.x - W / 2)).toBeLessThan(W * 0.2);
  });
});

describe('La caméra qui suit, au Gabarit', () => {
  const P = drawPieces('gabarit', (p) => p.stage !== 'ruine' || !p.until).positions;
  const tris: number[][] = [];
  for (let i = 0; i < P.length; i += 9) tris.push(Array.from(P.slice(i, i + 9), (v, k) => v + (k % 3 === 0 ? PLACE.center.x : k % 3 === 1 ? H0 : PLACE.center.z)));
  /** Le segment de `o` vers `t` traverse-t-il un triangle (Möller-Trumbore) ? */
  const blocked = (o: readonly number[], t: readonly number[]) => {
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
  };
  const door = nodes.get('gabarit')!;
  const focus = { x: door.x, y: ground(door.x, door.z), z: door.z };
  const keo = [focus.x, focus.y + 1.2, focus.z];
  const camera = (yaw: number, frame?: { height: number; back: number }) => {
    const pose = frame ? followPose(focus, occlusionLift(focus, ground, yaw), undefined, yaw, 1, undefined, frame) : followPose(focus, occlusionLift(focus, ground, yaw), undefined, yaw);
    return [pose.position.x, pose.position.y, pose.position.z];
  };

  it('à l’arrivée, dans la vue basse de « Y aller » ; puis tournée de tous côtés (72 caps) : rien de haut entre elle et Kéo', () => {
    expect(blocked(camera(doorViewOf('gabarit'), doorFrameOf('gabarit')!), keo)).toBe(false);
    const hidden = Array.from({ length: 72 }, (_, k) => k * 5).filter((deg) => blocked(camera((deg * Math.PI) / 180), keo));
    expect(hidden).toEqual([]);
  });
});
