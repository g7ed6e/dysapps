// Le Chariot (lot 3 du monde ouvert du 4e, le Bastion) : le lieu par parties (2 + 1 + 1, d'après les plans de
// `technology-4e-modeling`), une seule lanterne allumée dans la ruine, trois au plus restauré, une trace par mission avec
// sa partie, le signe de l'absence qui ne change jamais, l'eau du bassin d'essai plate et sombre posée d'un coup au corps 1,
// la rouille dans la ruine seulement, le lieu au ras du sol, rien sur le chemin de marche, la vue d'arrivée basse vers le
// nord-ouest, la caméra qui voit Kéo de tous côtés, la scénette de l'ingénieure, les plafonds de 1 600 et 1 200
// triangles. Sans Three.js.
import { describe, expect, it } from 'vitest';
import type { BiomeId } from '../../biomes';
import { partShapes, stagePoseWords } from '../../three/archipeo/constructionParts';
import { phraseDeLaPose } from '../../poseWords';
import { partiesDe } from '../parts';
import { PLACE_RUIN_TRIANGLES_MAX_4E, PLACE_TRIANGLES_MAX_4E } from './budget';
import { followPose, occlusionLift, screenOf } from './camera';
import { CHARIOT, CHARIOT_LAYOUT } from './chariot4e';
import { CHARIOT_SURROUNDINGS } from './chariotSurroundings';
import { posedTraces, type PartShape, type Stage } from './construction';
import type { Facets } from './facets';
import { FacetBuilder } from './facets';
import { FORGE_GLOW, FORGE_GLOW_FADE } from './forge4e';
import { distance, distanceToPolyline, linearRgb } from './geometry';
import { hasHabitantModel } from './habitants';
import { hasScenette, planFor } from './levelPlan';
import { doorFrameOf, doorViewOf } from './northShore';
import { BUILT_PLACES_4E, COLORS_4E, PATH_NODES_4E, VOLCANO_4E } from './plan4e';
import { COLORS_5E } from './plan5e';
import { drawPieces, placePieces } from './places';
import { placeTrace } from './questionScene';
import { RUINS_4E } from './ruins4e';
import { saysRestored, scenetteOf } from './scenette';
import { SURROUNDINGS, SURROUNDINGS_MAX } from './surroundings';
import { standingHeight } from './terrain';
import { heightAt4e } from './terrain4e';

const PLAN = planFor('4e');
const PLACE = PLAN.places.find((p) => p.id === 'chariot')!;
const SHAPES = partShapes(PLACE.island as BiomeId);
const MISSIONS = [...BUILT_PLACES_4E.chariot];
const L = CHARIOT_LAYOUT;

const upTo = (n: number): PartShape[] => SHAPES.slice(0, n);
const takes = (parts: readonly PartShape[], stage: Stage, row: number) => parts.some((part) => part.some((s) => s.stage === stage && row >= s.from - 1e-9 && row < s.to - 1e-9));

function shown(n: number): Facets {
  const parts = upTo(n);
  return drawPieces('chariot', (p) => (p.stage === 'ruine' ? !p.until || !takes(parts, p.until.stage, p.until.row) : takes(parts, p.stage, p.row)));
}

function countColor(f: Facets, color: number): number {
  const [r, g, b] = linearRgb(color);
  let n = 0;
  for (let i = 0; i < f.colors.length; i += 3) if (Math.abs(f.colors[i] - r) < 1e-4 && Math.abs(f.colors[i + 1] - g) < 1e-4 && Math.abs(f.colors[i + 2] - b) < 1e-4) n++;
  return n;
}

const ground = (x: number, z: number) => standingHeight(heightAt4e({ x, z }));
const nodes = new Map(PATH_NODES_4E.map((n) => [n.id, n.at]));
const traces = (n: number) => placeTrace('chariot', posedTraces('chariot', upTo(n), MISSIONS));
const H0 = ground(PLACE.center.x, PLACE.center.z);
const SHOWN = [0, 1, 2, 3, 4].map(shown);

describe('Le Chariot, lieu complet', () => {
  it('ses quatre missions se jouent dans sa scénette, en quatre parties : le corps en deux, le haut, les abords', () => {
    expect(PLACE.scenes).toEqual(MISSIONS);
    expect(MISSIONS).toEqual(['energy-chain', 'information-chain', 'simulation', 'troubleshooting']);
    expect(hasScenette('chariot')).toBe(true);
    expect(hasHabitantModel('chariot')).toBe(true);
    expect(SHAPES.map((p) => p.map((s) => [s.stage, s.from, s.to]))).toEqual([[[0, 0, 0.5]], [[0, 0.5, 1]], [[1, 0, 1]], [[2, 0, 1]]]);
    expect(Object.hasOwn(RUINS_4E, 'chariot')).toBe(false);
  });

  it('chaque partie pose quelque chose ; la ruine part avec la partie qui la remplace ; le signe de l’absence ne part jamais', () => {
    for (let n = 1; n <= 4; n++) expect(SHOWN[n].triangles, String(n)).not.toBe(SHOWN[n - 1].triangles);
    const ruin = placePieces('chariot').filter((p) => p.stage === 'ruine');
    const fallen = ruin.filter((p) => p.until).map((p) => `${p.until!.stage}/${p.until!.row.toFixed(3)}`);
    expect(new Set(fallen)).toEqual(new Set(['0/0.000', '0/0.500', '1/0.000', '2/0.000']));
    // Le bassin, les poteaux de l'auvent, la grande maquette et sa ferrure vide, l'appentis : une pièce, toujours là.
    expect(ruin.filter((p) => !p.until)).toHaveLength(1);
  });

  it('coûte au plus 1 600 triangles à son état le plus chargé, traces comprises ; la ruine, 1 200 au plus', () => {
    let worst = 0;
    for (let n = 0; n <= 4; n++) worst = Math.max(worst, SHOWN[n].triangles + traces(n).triangles);
    expect(worst).toBeLessThanOrEqual(PLACE_TRIANGLES_MAX_4E);
    expect(SHOWN[0].triangles).toBeLessThanOrEqual(PLACE_RUIN_TRIANGLES_MAX_4E);
    expect(CHARIOT.reach).toBeUndefined();
    expect(CHARIOT.restoration).toBeUndefined();
  });

  it('une seule lanterne allumée dans la ruine, celle de l’appentis ; trois au plus restauré ; jamais une à une réussite', () => {
    const lit = (n: number) => countColor(SHOWN[n], COLORS_5E.lantern);
    expect(lit(0)).toBeGreaterThan(0);
    for (let n = 1; n <= 2; n++) expect(lit(n), String(n)).toBe(lit(0));
    expect(lit(3)).toBe(2 * lit(0));
    expect(lit(4)).toBe(3 * lit(0));
  });

  it('aucune lueur rouge ni cuivre ; la rouille dans la ruine seulement : restauré, le fer est bruni sombre', () => {
    for (let n = 0; n <= 4; n++)
      for (const f of [SHOWN[n], traces(n)]) for (const c of [COLORS_4E.lava, FORGE_GLOW, ...FORGE_GLOW_FADE, COLORS_4E.copper]) expect(countColor(f, c), `${n} ${c.toString(16)}`).toBe(0);
    expect(countColor(SHOWN[0], COLORS_4E.rust)).toBeGreaterThan(0);
    for (const c of [COLORS_4E.rust, COLORS_4E.rustShade]) expect(countColor(SHOWN[4], c)).toBe(0);
    // Ni la terre cuite, au seul Gabarit.
    for (let n = 0; n <= 4; n++) expect(countColor(SHOWN[n], COLORS_4E.terracotta)).toBe(0);
  });

  it('le bassin en eau d’un coup au corps 1 : une eau plate, sombre (#24506A), sans reflet ; sèche avant', () => {
    expect(L.colors.water).toBe(0x24506a);
    expect(countColor(SHOWN[0], L.colors.water)).toBe(0);
    const wet = SHOWN[1];
    expect(countColor(wet, L.colors.water)).toBe(6);
    // Plate : tous ses sommets à la même hauteur, sous le rebord.
    const [r, g, b] = linearRgb(L.colors.water);
    const ys = new Set<string>();
    for (let i = 0; i < wet.colors.length; i += 3) if (Math.abs(wet.colors[i] - r) < 1e-4 && Math.abs(wet.colors[i + 1] - g) < 1e-4 && Math.abs(wet.colors[i + 2] - b) < 1e-4) ys.add(wet.positions[i + 1].toFixed(4));
    expect(ys.size).toBe(1);
    expect(Number([...ys][0])).toBeLessThan(L.base + L.basin.top);
  });

  it('une trace par mission, posée avec sa partie : une de plus à chaque partie', () => {
    const count = (n: number) => posedTraces('chariot', upTo(n), MISSIONS).length;
    expect([0, 1, 2, 3, 4].map(count)).toEqual([0, 1, 2, 3, 4]);
    for (const m of MISSIONS) expect(CHARIOT.traces[m], m).toBeDefined();
    expect(placeTrace('chariot', []).triangles).toBe(0);
  });

  it('au ras du sol : plus bas que la cage de la Loge et que le faîte de la Manufacture, en ruine comme restauré', () => {
    for (const n of [0, 4]) {
      let top = -Infinity;
      for (let i = 1; i < SHOWN[n].positions.length; i += 3) top = Math.max(top, SHOWN[n].positions[i]);
      expect(top - L.base, String(n)).toBeLessThan(4);
    }
  });

  it('rien du lieu, en ruine comme restauré, sur le chemin de marche, de la porte à son chemin (à hauteur de Kéo)', () => {
    const door = nodes.get('chariot')!;
    const way = nodes.get('bas-2')!;
    const sets: [Facets, boolean][] = [
      [SHOWN[0], true],
      [SHOWN[4], true],
      [traces(4), false],
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

describe('Le bilan du Chariot', () => {
  it('nomme la partie par son étape, jamais un nom du contenu', () => {
    const island = PLACE.island as BiomeId;
    const words = stagePoseWords(island, PLACE);
    const parties = partiesDe(island);
    expect(parties).toHaveLength(4);
    const said = (k: number) => phraseDeLaPose({ posees: [parties[k]], plansFinis: [] }, words);
    expect([0, 1, 2, 3].map(said)).toEqual(['Partie posée : le corps du Chariot, 1 sur 2.', 'Partie posée : le corps du Chariot, 2 sur 2.', 'Partie posée : le haut du Chariot.', 'Partie posée : les abords du Chariot.']);
    for (const k of [0, 1, 2, 3]) expect(said(k)).not.toMatch(/Manivelle|Grand-bi|érable/i);
  });
});

describe('La scénette du Chariot', () => {
  it('l’ingénieure, sans prénom ; sa phrase du métier ; sa réplique de fin, dite à la dernière pose', () => {
    const s = scenetteOf('chariot');
    expect(s.role).toBe('L’ingénieure');
    expect(s.greeting).toBe('L’ingénieure invente les machines et les essaie.');
    expect(s.words?.pose).toEqual(['Le bassin d’essai est en eau.', 'Le chariot est remis sur ses rails.', 'L’auvent couvre le treuil.', 'La cale d’essai est prête.']);
    expect(s.words?.end).toBe('Ici, on essayait les bateaux en petit avant de les construire en grand.');
    expect(saysRestored('chariot')).toBe(true);
  });

  it('elle se joue devant l’appentis, hors du chemin et loin de la porte, la caméra vers le nord-est ; ses abords sont enregistrés', () => {
    const s = L.scene;
    const door = nodes.get('chariot')!;
    const way = nodes.get('bas-2')!;
    for (const [sx, sz] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ])
      expect(distanceToPolyline({ x: PLACE.center.x + s.dx + sx * s.half[0], z: PLACE.center.z + s.dz + sz * s.half[1] }, [door, way])).toBeGreaterThan(1.5);
    expect(distance({ x: PLACE.center.x + s.dx, z: PLACE.center.z + s.dz }, door)).toBeGreaterThan(3);
    // La scène tient entre le rebord sud du bassin et l'appentis.
    expect(s.dz - s.half[1]).toBeGreaterThan(L.basin.z1);
    expect(s.dx + s.half[0]).toBeLessThan(L.shed.x0);
    // Vers le nord-est : le bout est du bassin et le treuil devant la caméra.
    const look = { x: -Math.sin(L.sceneStart), z: -Math.cos(L.sceneStart) };
    expect(look.x).toBeGreaterThan(0.5);
    expect(look.z).toBeLessThan(-0.5);
    const toWinch = { x: L.winch.x - s.dx, z: L.winch.z - s.dz };
    expect((toWinch.x * look.x + toWinch.z * look.z) / Math.hypot(toWinch.x, toWinch.z)).toBeGreaterThan(Math.cos((25 * Math.PI) / 180));
    expect(SURROUNDINGS.chariot).toBeDefined();
    const b = new FacetBuilder();
    SURROUNDINGS.chariot!(b, { x: PLACE.center.x + s.dx, y: 0, z: PLACE.center.z + s.dz }, { posed: true } as never);
    expect(b.build().triangles).toBeLessThanOrEqual(SURROUNDINGS_MAX);
    expect(CHARIOT_SURROUNDINGS.rocks.length).toBeGreaterThan(0);
  });
});

describe('La vue d’arrivée du Chariot', () => {
  const door = nodes.get('chariot')!;
  const focus = { x: door.x, y: ground(door.x, door.z), z: door.z };
  const W = 1024;
  const H = 768;
  const world = (x: number, y: number, z: number) => ({ x: PLACE.center.x + x, y: H0 + y, z: PLACE.center.z + z });

  it('basse, vers le nord-ouest : le chariot au milieu, le treuil à droite, la cale et les maquettes à gauche, l’appentis à droite devant', () => {
    const yaw = doorViewOf('chariot');
    const frame = doorFrameOf('chariot')!;
    expect(frame).toEqual({ height: -1, back: 1.3 });
    const pose = followPose(focus, occlusionLift(focus, ground, yaw), undefined, yaw, 1, undefined, frame);
    const s = (x: number, z: number, y = 0.8) => screenOf(pose, world(x, L.base + y, z), W, H);
    const inFrame = (p: { x: number; y: number }) => p.x > 16 && p.x < W - 16 && p.y > 8 && p.y < H;
    const chariot = s(L.gantry.x, (L.basin.z0 + L.basin.z1) / 2, 2);
    const winch = s(L.winch.x, L.winch.z);
    const slip = s(L.slip.x0 - 2, (L.slip.rails[0] + L.slip.rails[1]) / 2, 0.3);
    const models = s(L.models.big.x, L.models.big.z);
    const shed = s((L.shed.x0 + L.shed.x1) / 2, (L.shed.z0 + L.shed.z1) / 2, 1.2);
    for (const p of [chariot, winch, slip, models, shed]) expect(inFrame(p), JSON.stringify(p)).toBe(true);
    expect(Math.abs(chariot.x - W / 2)).toBeLessThan(W * 0.15);
    expect(winch.x).toBeGreaterThan(W * 0.6);
    expect(slip.x).toBeLessThan(W / 2);
    expect(models.x).toBeLessThan(W / 2);
    expect(shed.x).toBeGreaterThan(W / 2);
    // Le cratère du volcan bien à gauche du centre, dans le champ.
    const look = { x: -Math.sin(yaw), z: -Math.cos(yaw) };
    const d = { x: VOLCANO_4E.crater.x - door.x, z: VOLCANO_4E.crater.z - door.z };
    const left = (Math.atan2(look.x * d.z - look.z * d.x, look.x * d.x + look.z * d.z) * -180) / Math.PI;
    expect(left).toBeGreaterThan(12);
    expect(left).toBeLessThan(33);
  });
});

describe('La caméra qui suit, au Chariot', () => {
  const P = drawPieces('chariot', (p) => p.stage !== 'ruine' || !p.until).positions;
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
  const door = nodes.get('chariot')!;
  const focus = { x: door.x, y: ground(door.x, door.z), z: door.z };
  const keo = [focus.x, focus.y + 1.2, focus.z];
  const camera = (yaw: number, frame?: { height: number; back: number }) => {
    const pose = frame ? followPose(focus, occlusionLift(focus, ground, yaw), undefined, yaw, 1, undefined, frame) : followPose(focus, occlusionLift(focus, ground, yaw), undefined, yaw);
    return [pose.position.x, pose.position.y, pose.position.z];
  };

  it('à l’arrivée, dans la vue basse de « Y aller » ; puis tournée de tous côtés (72 caps) : rien de haut entre elle et Kéo', () => {
    expect(blocked(camera(doorViewOf('chariot'), doorFrameOf('chariot')!), keo)).toBe(false);
    const hidden = Array.from({ length: 72 }, (_, k) => k * 5).filter((deg) => blocked(camera((deg * Math.PI) / 180), keo));
    expect(hidden).toEqual([]);
  });

  it('à l’arrivée, rien de l’appentis ni de la cour entre la caméra et l’eau ou le chariot (captures du 22 octobre 2026)', () => {
    const eye = camera(doorViewOf('chariot'), doorFrameOf('chariot')!);
    const y = H0 + L.base + L.basin.water + 0.02;
    const mid = (L.basin.z0 + L.basin.z1) / 2;
    const water = [-11, -8, -2, 0, 2].map((x) => [PLACE.center.x + x, y, PLACE.center.z + mid]);
    const deck = [PLACE.center.x + L.gantry.x, H0 + L.base + L.basin.top + 0.5 + L.gantry.deck, PLACE.center.z + mid];
    for (const t of [...water, deck]) expect(blocked(eye, t), JSON.stringify(t)).toBe(false);
  });
});
