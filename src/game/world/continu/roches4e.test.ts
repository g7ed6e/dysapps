// Les Roches (les Coteaux du 4e) : le lieu par parties (2 + 1 + 1 aujourd'hui), une seule lanterne allumée dans la ruine,
// trois restauré ; une trace par mission avec sa partie ; le signe de l'absence au pied de la loupe, qui ne change
// jamais ; la terrasse entaillée sous la salle ; aucune lueur, rien d'orange ; rien sur le chemin de marche ; la vue
// d'arrivée basse à 290°, le cratère à droite ; la scénette de la géologue, la caméra sous le toit par le côté est ouvert ;
// les plafonds de 1 600 et 1 200 triangles. Sans Three.js.
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
import { orbitAround, screenOf } from './camera';
import { distance, distanceToPolyline, linearRgb } from './geometry';
import { hasHabitantModel } from './habitants';
import { ROCHES, ROCHES_LAYOUT } from './roches4e';
import { ROCHES_SURROUNDINGS } from './rochesSurroundings';
import { hasScenette, planFor } from './levelPlan';
import { doorFrameOf, doorViewOf } from './northShore';
import { C4E } from './place4eKit';
import { BUILT_PLACES_4E, COLORS_4E, PATH_NODES_4E, VOLCANO_4E } from './plan4e';
import { drawPieces, placePieces } from './places';
import { placeTrace, questionLayout } from './questionScene';
import { RUINS_4E } from './ruins4e';
import { scenetteHabitant, scenetteKeo, scenetteLayout, scenetteOf, scenettePose, scenetteStartYaw } from './scenette';
import { SURROUNDINGS, SURROUNDINGS_MAX } from './surroundings';
import { standingHeight } from './terrain';
import { heightAt4e } from './terrain4e';

const PLAN = planFor('4e');
const PLACE = PLAN.places.find((p) => p.id === 'roches')!;
const SHAPES = partShapes(PLACE.island as BiomeId);
const MISSIONS = [...BUILT_PLACES_4E.roches];

const upTo = (n: number): PartShape[] => SHAPES.slice(0, n);
const takes = (parts: readonly PartShape[], stage: Stage, row: number) => parts.some((part) => part.some((s) => s.stage === stage && row >= s.from - 1e-9 && row < s.to - 1e-9));

function shown(n: number): Facets {
  const parts = upTo(n);
  return drawPieces('roches', (p) => (p.stage === 'ruine' ? !p.until || !takes(parts, p.until.stage, p.until.row) : takes(parts, p.stage, p.row)));
}

function countColor(f: Facets, color: number): number {
  const [r, g, b] = linearRgb(color);
  let n = 0;
  for (let i = 0; i < f.colors.length; i += 3) if (Math.abs(f.colors[i] - r) < 1e-4 && Math.abs(f.colors[i + 1] - g) < 1e-4 && Math.abs(f.colors[i + 2] - b) < 1e-4) n++;
  return n;
}

const ground = (x: number, z: number) => standingHeight(heightAt4e({ x, z }));
const nodes = new Map(PATH_NODES_4E.map((n) => [n.id, n.at]));
const traces = (n: number) => placeTrace('roches', posedTraces('roches', upTo(n), MISSIONS));

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

describe('Les Roches, lieu complet', () => {
  it('ses quatre missions se jouent dans sa scénette, en quatre parties : le corps en deux, le haut, les abords', () => {
    expect(PLACE.scenes).toEqual(MISSIONS);
    expect(MISSIONS).toEqual(['word-roots', 'meaning', 'nuances', 'conjunctions']);
    expect(hasScenette('roches')).toBe(true);
    expect(hasHabitantModel('roches')).toBe(true);
    expect(SHAPES.map((p) => p.map((s) => [s.stage, s.from, s.to]))).toEqual([[[0, 0, 0.5]], [[0, 0.5, 1]], [[1, 0, 1]], [[2, 0, 1]]]);
    expect(Object.hasOwn(RUINS_4E, 'roches')).toBe(false);
  });

  it('chaque partie pose quelque chose ; la ruine part avec la partie qui la remplace', () => {
    for (let n = 1; n <= 4; n++) expect(shown(n).triangles, String(n)).not.toBe(shown(n - 1).triangles);
    const ruin = placePieces('roches').filter((p) => p.stage === 'ruine');
    const fallen = ruin.filter((p) => p.until).map((p) => `${p.until!.stage}/${p.until!.row}`);
    // Les abords ne relèvent rien : la ruine n'a de débris que le tas d'échantillons, la vitrine et les deux poutres.
    expect(new Set(fallen)).toEqual(new Set(['0/0', '0/0.5', '1/0']));
    expect(ruin.filter((p) => !p.until)).toHaveLength(1);
  });

  it('le signe de l’absence (le support vide de la loupe, ses deux goujons, sur son pied bas) est là avant comme après', () => {
    // Le support : un pavé d'un brun éteint (ses quatre flancs, vingt-quatre sommets ; son dessus, six) ; les goujons, de fer bruni.
    for (let n = 0; n <= 4; n++) {
      expect(countColor(shown(n), C4E.rustDull), String(n)).toBe(24);
      expect(countColor(shown(n), C4E.rustDullTop), String(n)).toBe(6);
    }
    // Un pied bas, jamais un chevalet : le support à moins d'un mètre du sol.
    expect(ROCHES_LAYOUT.loupe.h).toBeLessThan(1);
  });

  it('coûte au plus 1 600 triangles à son état le plus chargé, traces comprises ; la ruine, 1 200 au plus', () => {
    let worst = 0;
    for (let n = 0; n <= 4; n++) worst = Math.max(worst, shown(n).triangles + traces(n).triangles);
    expect(worst).toBeLessThanOrEqual(PLACE_TRIANGLES_MAX_4E);
    expect(shown(0).triangles).toBeLessThanOrEqual(PLACE_RUIN_TRIANGLES_MAX_4E);
    expect(ROCHES.reach).toBeUndefined();
    expect(ROCHES.restoration).toBeUndefined();
  });

  it('une seule lanterne allumée dans la ruine, celle de la géologue ; une de plus au haut, une aux abords', () => {
    const lit = (n: number) => countColor(shown(n), C4E.lantern);
    expect(lit(0)).toBe(30);
    expect([1, 2, 3, 4].map(lit)).toEqual([30, 30, 60, 90]);
  });

  it('aucune lueur rouge ni rien d’orange, à aucune étape : ni lave, ni rouille claire, ni cuivre, ni terre cuite', () => {
    for (let n = 0; n <= 4; n++)
      for (const f of [shown(n), traces(n)])
        for (const c of [COLORS_4E.lava, FORGE_GLOW, ...FORGE_GLOW_FADE, COLORS_4E.rust, COLORS_4E.copper, COLORS_4E.terracotta, COLORS_4E.brick]) expect(countColor(f, c), `${n} ${c.toString(16)}`).toBe(0);
  });

  it('une trace par mission, posée avec sa partie', () => {
    const count = (n: number) => posedTraces('roches', upTo(n), MISSIONS).length;
    expect([0, 1, 2, 3, 4].map(count)).toEqual([0, 1, 2, 3, 4]);
    for (const m of MISSIONS) expect(ROCHES.traces[m], m).toBeDefined();
  });

  it('la salle basse sur sa terrasse : le sol plat sous la salle et son seuil, la pente du cône derrière ses murs', () => {
    const R = ROCHES_LAYOUT.room;
    const c = PLACE.center;
    const h0 = ground(c.x, c.z);
    for (let x = R.x0; x <= R.x1 + 1e-6; x += 0.5)
      for (let z = R.z0; z <= R.z1 + 1 + 1e-6; z += 0.5) expect(Math.abs(ground(c.x + x, c.z + z) - h0), `${x} ${z}`).toBeLessThan(0.12);
    // Derrière le mur du fond, à l'ouest, la pente monte au-dessus du haut du mur relevé.
    expect(ground(c.x, c.z - 4.6) - h0).toBeGreaterThan(R.h);
    expect(boundsOf(shown(4)).max[1]).toBeLessThan(7.7);
  });

  it('rien du lieu, en ruine comme restauré, sur le chemin de marche, de part et d’autre de la porte (à hauteur de Kéo)', () => {
    const door = nodes.get('roches')!;
    const way = nodes.get('cot-1')!;
    const h0 = ground(PLACE.center.x, PLACE.center.z);
    const sets: [Facets, boolean][] = [
      [shown(0), true],
      [shown(4), true],
      [traces(4), false],
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

describe('Le bilan des Roches', () => {
  it('nomme la partie par son étape, puis dit la phrase du lieu ; jamais un nom du contenu', () => {
    const island = PLACE.island as BiomeId;
    const words = stagePoseWords(island, PLACE);
    const parties = partiesDe(island);
    expect(parties).toHaveLength(4);
    const said = [0, 1, 2, 3].map((k) => phraseDeLaPose({ posees: [parties[k]], plansFinis: [] }, words));
    for (const s of said) expect(s).not.toMatch(/nid|toit|Plume|Gardien/i);
    // Jamais le nom d'un plan de l'île : ni sa réplique de fin (`done`), ni un nom de son titre (`name`), dans le bilan,
    // les phrases de pose et la phrase de fin (relecture du contenu des Coteaux, retouche 1).
    const texts = [...said, ...(scenetteOf(PLACE.id).words?.pose ?? []), scenetteOf(PLACE.id).words?.end ?? ''];
    for (const plan of plansFor(island))
      for (const text of texts) {
        expect(text).not.toContain(plan.done);
        for (const noun of planNouns(plan.name)) expect(text, noun).not.toMatch(wordRe(noun));
      }
    expect(scenetteOf('roches').words?.pose).toEqual(['Les murs sont remontés.', 'Chaque pierre a retrouvé sa case.', 'La salle est à l’abri de la pluie.', 'Le seuil est dégagé.']);
    expect(scenetteOf('roches').words?.end).toBe('Ici, on rangeait toutes les pierres de la montagne.');
  });
});

describe('La scénette des Roches', () => {
  it('la géologue, sans prénom, et sa phrase de métier', () => {
    const s = scenetteOf('roches');
    expect(s.role).toBe('La géologue');
    expect(s.greeting).toBe('La géologue connaît chaque pierre de la montagne.');
  });

  it('la caméra arrive par la porte, basse, à 290° (à 45° au moins du soleil) : la salle au milieu, le cratère haut à droite, jamais au centre', () => {
    const door = nodes.get('roches')!;
    const yaw = doorViewOf('roches');
    const look = { x: -Math.sin(yaw), z: -Math.cos(yaw) };
    // Le cap, en degrés depuis le nord dans le sens des aiguilles d'une montre.
    const cap = ((Math.atan2(look.x, -look.z) * 180) / Math.PI + 360) % 360;
    expect(cap).toBeCloseTo(290, 6);
    expect(Math.abs(cap - 153)).toBeGreaterThanOrEqual(45);
    // Positif : à droite de l'axe du regard.
    const angle = (p: { x: number; z: number }) => {
      const d = { x: p.x - door.x, z: p.z - door.z };
      return (Math.atan2(look.x * d.z - look.z * d.x, look.x * d.x + look.z * d.z) * 180) / Math.PI;
    };
    const room = { x: PLACE.center.x + 3.2, z: PLACE.center.z + 2.5 };
    expect(Math.abs(angle(room))).toBeLessThan(15);
    expect(angle(VOLCANO_4E.crater)).toBeGreaterThan(12);
    expect(angle(VOLCANO_4E.crater)).toBeLessThan(30);
    const frame = doorFrameOf('roches')!;
    expect(frame.height).toBeLessThan(0);
    expect(frame.back).toBeLessThanOrEqual(1.6);
  });

  it('elle se joue au bord du toit, devant la table, hors du chemin, loin de la porte, la caméra au sud-ouest ; ses abords sont enregistrés', () => {
    const s = ROCHES_LAYOUT.scene;
    const door = nodes.get('roches')!;
    const way = nodes.get('cot-1')!;
    for (const [sx, sz] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ])
      expect(distanceToPolyline({ x: PLACE.center.x + s.dx + sx * s.half[0], z: PLACE.center.z + s.dz + sz * s.half[1] }, [door, way])).toBeGreaterThan(0.9);
    expect(distance({ x: PLACE.center.x + s.dx, z: PLACE.center.z + s.dz }, door)).toBeGreaterThan(3);
    // La géologue sous le toit, devant la table.
    const R = ROCHES_LAYOUT.roof;
    const T = ROCHES_LAYOUT.table;
    const geo = scenetteHabitant('roches');
    const local = { x: geo.x - PLACE.center.x, z: geo.z - PLACE.center.z };
    expect(local.x).toBeGreaterThan(R.x0);
    expect(local.x).toBeLessThan(R.x1);
    expect(local.z).toBeLessThan(R.z1);
    expect(local.z).toBeGreaterThan(T.z + T.d / 2 + 0.4);
    expect(SURROUNDINGS.roches).toBeDefined();
    const b = new FacetBuilder();
    SURROUNDINGS.roches!(b, { x: PLACE.center.x + s.dx, y: 0, z: PLACE.center.z + s.dz }, { posed: true } as never);
    expect(b.build().triangles).toBeLessThanOrEqual(SURROUNDINGS_MAX);
    expect(ROCHES_SURROUNDINGS.rocks.length).toBeGreaterThan(0);
  });

  it('la caméra de la scénette, au nord-est, voit Kéo et la géologue par le côté est ouvert, sous le toit, jamais à travers le mur du fond', () => {
    for (const [w, h] of [
      [1024, 768],
      [1366, 1024],
      [844, 390],
    ]) {
      const stage = scenetteLayout({ count: 3 }, w, h, questionLayout({ count: 3 }, w, h)).scenette!.stage;
      const { pose } = scenettePose('roches', stage, w, h);
      const yaw = scenetteStartYaw('roches');
      const t = pose.target;
      const d = Math.hypot(pose.position.x - t.x, pose.position.z - t.z);
      const cam = { x: t.x + Math.sin(yaw) * d, y: pose.position.y, z: t.z + Math.cos(yaw) * d };
      const c = PLACE.center;
      const h0 = ground(c.x, c.z);
      const R = ROCHES_LAYOUT.room;
      const roof = ROCHES_LAYOUT.roof;
      for (const who of [scenetteKeo('roches').at, scenetteHabitant('roches')]) {
        const head = { x: who.x, y: who.y + 1.2, z: who.z };
        for (let k = 1; k < 200; k++) {
          const u = k / 200;
          const x = cam.x + (head.x - cam.x) * u - c.x,
            y = cam.y + (head.y - cam.y) * u - h0,
            z = cam.z + (head.z - cam.z) * u - c.z;
          const inBack = x > R.x0 - R.wall - 0.05 && x < R.x1 + 0.05 && z > R.z0 - R.wall - 0.05 && z < R.z0 + 0.05 && y < R.h + 0.1;
          expect(inBack, `${w} mur ${x.toFixed(1)} ${z.toFixed(1)}`).toBe(false);
          const underRoof = x > roof.x0 && x < roof.x1 && z > roof.z0 && z < roof.z1;
          if (underRoof) expect(y, `${w} toit ${x.toFixed(1)} ${z.toFixed(1)}`).toBeLessThan(R.h - (z - R.z0) * roof.slope);
        }
      }
    }
  });
  it('la géologue et Kéo, à toutes les étapes, ne sont cachés par rien du lieu ; la géologue reste à 16 px au moins du bord droit de la scène (retouche 1)', () => {
    // Le rayon de la caméra à un point : le premier triangle touché avant lui (Möller-Trumbore), ou rien.
    const blocked = (o: { x: number; y: number; z: number }, p: { x: number; y: number; z: number }, f: Facets, c: { x: number; y: number; z: number }) => {
      const d = [p.x - o.x, p.y - o.y, p.z - o.z];
      for (let i = 0; i < f.positions.length; i += 9) {
        const a = [f.positions[i] + c.x, f.positions[i + 1] + c.y, f.positions[i + 2] + c.z];
        const e1 = [f.positions[i + 3] + c.x - a[0], f.positions[i + 4] + c.y - a[1], f.positions[i + 5] + c.z - a[2]];
        const e2 = [f.positions[i + 6] + c.x - a[0], f.positions[i + 7] + c.y - a[1], f.positions[i + 8] + c.z - a[2]];
        const q = [d[1] * e2[2] - d[2] * e2[1], d[2] * e2[0] - d[0] * e2[2], d[0] * e2[1] - d[1] * e2[0]];
        const det = e1[0] * q[0] + e1[1] * q[1] + e1[2] * q[2];
        if (Math.abs(det) < 1e-9) continue;
        const t0 = [o.x - a[0], o.y - a[1], o.z - a[2]];
        const u = (t0[0] * q[0] + t0[1] * q[1] + t0[2] * q[2]) / det;
        if (u < 0 || u > 1) continue;
        const r = [t0[1] * e1[2] - t0[2] * e1[1], t0[2] * e1[0] - t0[0] * e1[2], t0[0] * e1[1] - t0[1] * e1[0]];
        const v = (d[0] * r[0] + d[1] * r[1] + d[2] * r[2]) / det;
        if (v < 0 || u + v > 1) continue;
        const t = (e2[0] * r[0] + e2[1] * r[1] + e2[2] * r[2]) / det;
        if (t > 1e-4 && t < 0.999) return true;
      }
      return false;
    };
    const c = { x: PLACE.center.x, y: ground(PLACE.center.x, PLACE.center.z), z: PLACE.center.z };
    const geo = scenetteHabitant('roches');
    const keo = scenetteKeo('roches').at;
    const side = { x: (geo.x - keo.x) / distance(geo, keo), z: (geo.z - keo.z) / distance(geo, keo) };
    const states = Array.from({ length: SHAPES.length + 1 }, (_, n) => shown(n));
    for (const [w, h] of [
      [1024, 768],
      [1366, 768],
      [844, 390],
    ]) {
      // La scène du jeu : la colonne du panneau à gauche, la scène à sa droite (./WorldQuestion.tsx).
      const stage = scenetteLayout({ count: 3, column: true }, w, h, questionLayout({ count: 3 }, w, h)).scenette!.stage;
      const { pose, shift } = scenettePose('roches', stage, w, h);
      const cam = orbitAround(pose.position, pose.target, scenetteStartYaw('roches'));
      const view = { ...pose, position: cam };
      for (const f of states)
        for (const who of [geo, keo])
          for (const up of [0.15, 0.5, 0.9, 1.3])
            for (const s of [-0.25, 0, 0.25]) {
              const p = { x: who.x + side.x * s, y: who.y + up, z: who.z + side.z * s };
              expect(blocked(cam, p, f, c), `${w}×${h} étape ${states.indexOf(f)} ${who === geo ? 'géologue' : 'Kéo'} ${up} ${s}`).toBe(false);
            }
      // Le bord droit de la géologue : son bras tendu (0,4 de côté) et sa tête.
      const right = Math.max(screenOf(view, { x: geo.x + side.x * 0.4, y: geo.y + 0.7, z: geo.z + side.z * 0.4 }, w, h).x, screenOf(view, { ...geo, y: geo.y + 1.4 }, w, h).x) - shift.x;
      expect(stage.right - right, `${w}×${h}`).toBeGreaterThanOrEqual(16);
    }
  });
});
