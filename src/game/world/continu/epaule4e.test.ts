// Les trois lieux de l'Épaule (lot 3 du monde ouvert du 4e) : le Terminus, les Orgues, la Dynamo. Pour chacun : ses
// parties (celles des plans du contenu), la ruine qui part avec la partie qui la remplace, les plafonds de 1 600 et
// 1 200 triangles, une seule lanterne allumée dans la ruine, une trace par mission avec sa partie, aucune rouille claire,
// rien de bas sur les chemins qui le touchent, les phrases de pose, la scénette de son métier, la caméra à la porte, et
// rien de haut entre la caméra et Kéo, de tous côtés. Sans Three.js.
import { describe, expect, it } from 'vitest';
import type { BiomeId } from '../../biomes';
import { partShapes, placePoseWords } from '../../three/archipeo/constructionParts';
import { phraseDeLaPose } from '../../poseWords';
import { partiesDe } from '../parts';
import { PLACE_RUIN_TRIANGLES_MAX_4E, PLACE_TRIANGLES_MAX_4E } from './budget';
import { followPose, occlusionLift } from './camera';
import { posedTraces, type PartShape, type Stage } from './construction';
import { DYNAMO_LAYOUT } from './dynamo4e';
import { DYNAMO_SURROUNDINGS } from './dynamoSurroundings';
import type { Facets } from './facets';
import { linearRgb } from './geometry';
import { hasHabitantModel } from './habitants';
import { hasScenette, planFor } from './levelPlan';
import { doorFrameOf, doorViewOf } from './northShore';
import { ORGUES_LAYOUT } from './orgues4e';
import { ORGUES_SURROUNDINGS } from './orguesSurroundings';
import { BUILT_PLACES_4E, COLORS_4E, PATH_EDGES_4E, PATH_NODES_4E } from './plan4e';
import { COLORS_5E } from './plan5e';
import { drawPieces, placePieces } from './places';
import { placeTrace } from './questionScene';
import { rendered5e } from './rendered5e';
import { RUINS_4E } from './ruins4e';
import { scenetteOf } from './scenette';
import { LIGHT_4E } from './sky';
import { SURROUNDINGS } from './surroundings';
import { TERMINUS_LAYOUT } from './terminus4e';
import { TERMINUS_SURROUNDINGS } from './terminusSurroundings';
import { standingHeight } from './terrain';
import { EPAULE_KEEP, heightAt4e } from './terrain4e';

type Id = 'terminus' | 'orgues' | 'dynamo';

/** Ce que chaque lieu doit montrer : ses parties (celles des plans), son métier, ses mots interdits. */
const CASES: readonly {
  id: Id;
  shapes: [number, number, number][][];
  role: string;
  greeting: string;
  never: RegExp;
  doorLook: { x: number; z: number };
  surroundings: unknown;
  /** Les couleurs qui peuvent passer au ras du chemin : la voie qui continue les rails du lot 1 au pas de la porte. */
  flush?: readonly number[];
}[] = [
  {
    id: 'terminus',
    // 3+1+1 : le corps en trois rangées, le haut, les abords.
    shapes: [[[0, 0, 1 / 3]], [[0, 1 / 3, 2 / 3]], [[0, 2 / 3, 1]], [[1, 0, 1]], [[2, 0, 1]]],
    role: 'Le cheminot',
    greeting: 'Le cheminot envoie le minerai vers la Forge, sur les rails.',
    never: /benne|trémie|galerie/i,
    doorLook: TERMINUS_LAYOUT.doorLook,
    surroundings: TERMINUS_SURROUNDINGS,
    flush: [TERMINUS_LAYOUT.colors.ballast, TERMINUS_LAYOUT.colors.rail, TERMINUS_LAYOUT.colors.railTop],
  },
  {
    id: 'orgues',
    // 2+2+1 : les plans du contenu font deux rangées au corps et deux au haut (l'intention disait 3+1+1).
    shapes: [[[0, 0, 0.5]], [[0, 0.5, 1]], [[1, 0, 0.5]], [[1, 0.5, 1]], [[2, 0, 1]]],
    role: 'Le carrier',
    greeting: 'Le carrier taille la pierre dans la montagne.',
    never: /carrière|palan|grue/i,
    doorLook: ORGUES_LAYOUT.doorLook,
    surroundings: ORGUES_SURROUNDINGS,
  },
  {
    id: 'dynamo',
    shapes: [[[0, 0, 1]], [[1, 0, 1]], [[2, 0, 1]]],
    role: 'L’électricienne',
    greeting: 'L’électricienne tend les fils d’un poteau à l’autre.',
    never: /(poste|poteau|pose).*(poste|poteau|pose)/i,
    doorLook: DYNAMO_LAYOUT.doorLook,
    surroundings: DYNAMO_SURROUNDINGS,
  },
];

const PLAN = planFor('4e');
const ground = (x: number, z: number) => standingHeight(heightAt4e({ x, z }));
const nodes = new Map(PATH_NODES_4E.map((n) => [n.id, n.at]));
const takes = (parts: readonly PartShape[], stage: Stage, row: number) => parts.some((part) => part.some((s) => s.stage === stage && row >= s.from - 1e-9 && row < s.to - 1e-9));

function countColor(f: Facets, color: number): number {
  const [r, g, b] = linearRgb(color);
  let n = 0;
  for (let i = 0; i < f.colors.length; i += 3) if (Math.abs(f.colors[i] - r) < 1e-4 && Math.abs(f.colors[i + 1] - g) < 1e-4 && Math.abs(f.colors[i + 2] - b) < 1e-4) n++;
  return n;
}

function toSegment(p: { x: number; z: number }, a: { x: number; z: number }, b: { x: number; z: number }): number {
  const dx = b.x - a.x,
    dz = b.z - a.z;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / (dx * dx + dz * dz || 1)));
  return Math.hypot(p.x - a.x - dx * t, p.z - a.z - dz * t);
}

describe.each(CASES)('$id, lieu complet de l’Épaule', ({ id, shapes, role, greeting, never, doorLook, surroundings, flush = [] }) => {
  const PLACE = PLAN.places.find((p) => p.id === id)!;
  const SHAPES = partShapes(PLACE.island as BiomeId);
  const MISSIONS = [...BUILT_PLACES_4E[id]];
  const N = SHAPES.length;
  const upTo = (n: number): PartShape[] => SHAPES.slice(0, n);
  const shown = (n: number): Facets => {
    const parts = upTo(n);
    return drawPieces(id, (p) => (p.stage === 'ruine' ? !p.until || !takes(parts, p.until.stage, p.until.row) : takes(parts, p.stage, p.row)));
  };
  const traces = (n: number) => placeTrace(id, posedTraces(id, upTo(n), MISSIONS));

  it('ses missions se jouent dans sa scénette, en parties : celles des plans du contenu', () => {
    expect(PLACE.scenes).toEqual(MISSIONS);
    expect(hasScenette(id)).toBe(true);
    expect(hasHabitantModel(id)).toBe(true);
    expect(SHAPES.map((p) => p.map((s) => [s.stage, s.from, s.to]))).toEqual(shapes);
    expect(Object.hasOwn(RUINS_4E, id)).toBe(false);
  });

  it('chaque partie pose quelque chose ; la ruine part avec la partie qui la remplace ; restauré, plus rien d’elle', () => {
    for (let n = 1; n <= N; n++) expect(shown(n).triangles, String(n)).not.toBe(shown(n - 1).triangles);
    const ruin = placePieces(id).filter((p) => p.stage === 'ruine');
    expect(ruin.filter((p) => p.until).length).toBeGreaterThan(0);
    for (const p of ruin.filter((r) => r.until)) expect(takes(upTo(N), p.until!.stage, p.until!.row)).toBe(true);
  });

  it(`coûte au plus ${PLACE_TRIANGLES_MAX_4E} triangles à son état le plus chargé, traces comprises ; la ruine, ${PLACE_RUIN_TRIANGLES_MAX_4E} au plus`, () => {
    let worst = 0;
    for (let n = 0; n <= N; n++) worst = Math.max(worst, shown(n).triangles + traces(n).triangles);
    expect(worst).toBeLessThanOrEqual(PLACE_TRIANGLES_MAX_4E);
    expect(shown(0).triangles).toBeLessThanOrEqual(PLACE_RUIN_TRIANGLES_MAX_4E);
  });

  it('ce qu’il pose au-delà de la place gardée reste dans les disques de EPAULE_KEEP (la végétation s’en écarte), hors des chemins', () => {
    // La place gardée autour du centre (`FLORA_KEEP.place`, ./terrain4e.ts) et la bande des chemins (`FLORA_KEEP.path`).
    const PLACE_KEEP = 13,
      PATH_KEEP = 3.2;
    const discs = EPAULE_KEEP.filter((k) => k.id === id).map((k) => ({ x: PLACE.center.x + k.dx, z: PLACE.center.z + k.dz, r: k.r }));
    const segments = PATH_EDGES_4E.map(([a, b]) => [nodes.get(a)!, nodes.get(b)!] as const);
    for (const n of [0, N]) {
      const f = shown(n);
      const out: string[] = [];
      for (let i = 0; i < f.positions.length; i += 3) {
        // Les pièces sont dans le repère du lieu, sans rotation au 4e (`yaw: 0`).
        const p = { x: PLACE.center.x + f.positions[i], z: PLACE.center.z + f.positions[i + 2] };
        if (Math.hypot(p.x - PLACE.center.x, p.z - PLACE.center.z) < PLACE_KEEP) continue;
        if (discs.some((d) => Math.hypot(p.x - d.x, p.z - d.z) < d.r)) continue;
        if (segments.some(([a, b]) => toSegment(p, a, b) < PATH_KEEP)) continue;
        out.push(`${(p.x - PLACE.center.x).toFixed(1)},${(p.z - PLACE.center.z).toFixed(1)}`);
      }
      expect([...new Set(out)], String(n)).toEqual([]);
    }
  });

  it('une seule lanterne allumée dans la ruine ; deux au moins et trois au plus restauré ; jamais une de moins', () => {
    const lit = (n: number) => countColor(shown(n), COLORS_5E.lantern);
    expect(lit(0)).toBeGreaterThan(0);
    for (let n = 1; n <= N; n++) expect(lit(n), String(n)).toBeGreaterThanOrEqual(lit(n - 1));
    expect(lit(N)).toBeGreaterThanOrEqual(2 * lit(0));
    expect(lit(N)).toBeLessThanOrEqual(3 * lit(0));
  });

  it('jamais la rouille claire du lot 1, qui se lit orange au soleil bas', () => {
    for (let n = 0; n <= N; n++) {
      expect(countColor(shown(n), COLORS_4E.rust), String(n)).toBe(0);
      expect(countColor(traces(n), COLORS_4E.rust), String(n)).toBe(0);
    }
  });

  it('une trace par mission, posée avec sa partie', () => {
    expect(Array.from({ length: N + 1 }, (_, n) => posedTraces(id, upTo(n), MISSIONS).length)).toEqual(Array.from({ length: N + 1 }, (_, n) => n));
  });

  it('rien du lieu, en ruine comme restauré, sur les chemins qui le touchent (à hauteur de Kéo), sauf la voie au ras du sol', () => {
    const lin = flush.map(linearRgb);
    const isFlush = (f: Facets, i: number) => lin.some(([r, g, b]) => Math.abs(f.colors[i] - r) < 1e-4 && Math.abs(f.colors[i + 1] - g) < 1e-4 && Math.abs(f.colors[i + 2] - b) < 1e-4);
    const edges = PATH_EDGES_4E.filter(([a, b]) => a === id || b === id).map(([a, b]) => [nodes.get(a)!, nodes.get(b)!] as const);
    expect(edges.length).toBeGreaterThan(0);
    const h0 = ground(PLACE.center.x, PLACE.center.z);
    const sets: [Facets, boolean][] = [
      [shown(0), true],
      [shown(N), true],
      [traces(N), false],
    ];
    for (const [f, local] of sets)
      for (let i = 0; i < f.positions.length; i += 9) {
        const x = (f.positions[i] + f.positions[i + 3] + f.positions[i + 6]) / 3 + (local ? PLACE.center.x : 0);
        const z = (f.positions[i + 2] + f.positions[i + 5] + f.positions[i + 8]) / 3 + (local ? PLACE.center.z : 0);
        const y = Math.min(f.positions[i + 1], f.positions[i + 4], f.positions[i + 7]) + (local ? h0 : 0);
        const low = y - ground(x, z) < 1.8;
        const onWay = edges.some(([a, b]) => toSegment({ x, z }, a, b) < 0.8);
        expect(low && onWay && !isFlush(f, i), `${x.toFixed(1)}, ${z.toFixed(1)}`).toBe(false);
      }
  });

  it('le bilan nomme la partie par son étape, puis dit sa phrase de pose', () => {
    const island = PLACE.island as BiomeId;
    const words = placePoseWords(PLACE)!;
    const parties = partiesDe(island);
    expect(parties).toHaveLength(N);
    const pose = scenetteOf(id).words!.pose;
    for (let k = 0; k < N; k++) {
      const said = phraseDeLaPose({ posees: [parties[k]], plansFinis: [] }, words);
      expect(said).toMatch(/^Partie posée : /);
      expect(said.endsWith(pose[k]), said).toBe(true);
      expect(said).not.toMatch(never);
    }
  });

  it('son habitant, sans prénom, avec sa phrase du métier ; sa réplique de fin commence par « Ici »', () => {
    const s = scenetteOf(id);
    expect(s.role).toBe(role);
    expect(s.greeting).toBe(greeting);
    expect(s.words!.end).toMatch(/^Ici, /);
    for (const text of [s.greeting ?? '', s.words!.end ?? '', ...s.words!.pose]) expect(text).not.toMatch(never);
  });

  it('la caméra arrive par la porte, tournée vers le lieu, dans sa vue d’arrivée basse ; ses abords sont enregistrés', () => {
    const door = nodes.get(id)!;
    const yaw = doorViewOf(id);
    const look = { x: -Math.sin(yaw), z: -Math.cos(yaw) };
    const to = { x: PLACE.center.x + doorLook.x - door.x, z: PLACE.center.z + doorLook.z - door.z };
    expect((look.x * to.x + look.z * to.z) / Math.hypot(to.x, to.z)).toBeGreaterThan(0.99);
    expect(doorFrameOf(id)!.height).toBeLessThan(0);
    expect(SURROUNDINGS[id]).toBeDefined();
    expect(surroundings).toBeDefined();
  });

  describe('rien de haut entre la caméra et Kéo, à la porte', () => {
    const H0 = ground(PLACE.center.x, PLACE.center.z);
    const tris: number[][] = [];
    for (const f of [shown(0), shown(N)]) {
      const P = f.positions;
      for (let i = 0; i < P.length; i += 9) tris.push(Array.from(P.slice(i, i + 9), (v, k) => v + (k % 3 === 0 ? PLACE.center.x : k % 3 === 1 ? H0 : PLACE.center.z)));
    }
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
    const door = nodes.get(id)!;
    const focus = { x: door.x, y: ground(door.x, door.z), z: door.z };
    const keo = [focus.x, focus.y + 1.2, focus.z];
    const camera = (yaw: number, frame?: { height: number; back: number }) => {
      const pose = frame ? followPose(focus, occlusionLift(focus, ground, yaw), undefined, yaw, 1, undefined, frame) : followPose(focus, occlusionLift(focus, ground, yaw), undefined, yaw);
      return [pose.position.x, pose.position.y, pose.position.z];
    };

    it('à l’arrivée, dans la vue basse ; puis la caméra qui suit, tournée de tous côtés (72 caps)', () => {
      expect(blocked(camera(doorViewOf(id), doorFrameOf(id)!), keo)).toBe(false);
      const hidden = Array.from({ length: 72 }, (_, k) => k * 5).filter((deg) => blocked(camera((deg * Math.PI) / 180), keo));
      expect(hidden).toEqual([]);
    });
  });
});

describe('le tertre des Orgues, vu d’en haut', () => {
  it('son dessus se lit #5E534E à l’écran, sous la lumière du 4e, jamais en dalle noire (retouche 2, point C)', () => {
    const f = drawPieces('orgues', (p) => p.stage === 'ruine' && !p.until);
    const T = ORGUES_LAYOUT.tertre;
    const goal = [0x5e, 0x53, 0x4e];
    const seen: string[] = [];
    let n = 0;
    for (let i = 0; i < f.positions.length; i += 9) {
      const [y, z] = [(f.positions[i + 1] + f.positions[i + 4] + f.positions[i + 7]) / 3, (f.positions[i + 2] + f.positions[i + 5] + f.positions[i + 8]) / 3];
      const normal = [f.normals[i], f.normals[i + 1], f.normals[i + 2]];
      // Les faces du dessus du tertre : derrière le front, au-dessus des têtes basses, tournées vers le ciel.
      if (z > -6.8 || z < -T.backZ || y < 2 || normal[1] < 0.3) continue;
      n++;
      const c = rendered5e([f.colors[i], f.colors[i + 1], f.colors[i + 2]], normal, LIGHT_4E);
      const rgb = [(c >> 16) & 255, (c >> 8) & 255, c & 255];
      if (rgb.some((v, k) => Math.abs(v - goal[k]) > 6)) seen.push(c.toString(16));
    }
    expect(n).toBeGreaterThan(0);
    expect(seen).toEqual([]);
  });
});
