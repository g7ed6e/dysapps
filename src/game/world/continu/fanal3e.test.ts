// Le Fanal (le Cirque du 3e, GD-25) : le lieu par parties (3 + 1 + 1, d'après les cinq missions de son île), une seule
// lanterne allumée dans la ruine ; une trace par mission avec sa partie ; deux bandes d'ardoise, jamais une troisième ;
// l'or blanc à la seule lanterne, et seulement le haut posé ; le bronze aux seules ferrures des lanternes, jamais de
// cobalt ; la brèche sur la face vue de la porte ; rien sur le chemin de marche ; la porte au sud et la vue d'arrivée
// au nord, la tour entière, la mer de nuages au-delà ; la scénette de l'opticienne ; les plafonds de 1 600 et 1 200 triangles. Sans Three.js.
import { describe, expect, it } from 'vitest';
import type { BiomeId } from '../../biomes';
import { partShapes, stagePoseWords } from '../../three/archipeo/constructionParts';
import { phraseDeLaPose } from '../../poseWords';
import { partiesDe } from '../parts';
import { plansFor } from '../plans';
import { PLACE_RUIN_TRIANGLES_MAX_3E, PLACE_TRIANGLES_MAX_3E } from './budget';
import { followPose, lookUp, screenOf } from './camera';
import { posedTraces, type PartShape, type Stage } from './construction';
import type { Facets } from './facets';
import { FANAL, FANAL_LAYOUT, FANAL_TOWER_3E } from './fanal3e';
import { PORT_LAMP_OFF_3E } from './ferrailleurs3e';
import { distance, distanceToPolyline, linearRgb } from './geometry';
import { hasHabitantModel } from './habitants';
import { hasScenette, planFor } from './levelPlan';
import { arrivalViewOf, doorViewOf } from './northShore';
import { C3E } from './place3eKit';
import { BUILT_PLACES_3E, COLORS_3E, PATH_NODES_3E, PEAK_3E } from './plan3e';
import { drawPieces, placePieces } from './places';
import { placeTrace } from './questionScene';
import { scenetteOf } from './scenette';
import { standingHeight } from './terrain';
import { heightAt3e, landDistance3e } from './terrain3e';

const PLAN = planFor('3e');
const PLACE = PLAN.places.find((p) => p.id === 'fanal')!;
const SHAPES = partShapes(PLACE.island as BiomeId);
const MISSIONS = [...BUILT_PLACES_3E.fanal];
const LIGHT = 0xffe6a6;

const upTo = (n: number): PartShape[] => SHAPES.slice(0, n);
const takes = (parts: readonly PartShape[], stage: Stage, row: number) =>
  parts.some((part) => part.some((s) => s.stage === stage && row >= s.from - 1e-9 && row < s.to - 1e-9));

function shown(n: number): Facets {
  const parts = upTo(n);
  return drawPieces('fanal', (p) => (p.stage === 'ruine' ? !p.until || !takes(parts, p.until.stage, p.until.row) : takes(parts, p.stage, p.row)));
}

function countColor(f: Facets, color: number): number {
  const [r, g, b] = linearRgb(color);
  let n = 0;
  for (let i = 0; i < f.colors.length; i += 3)
    if (Math.abs(f.colors[i] - r) < 1e-4 && Math.abs(f.colors[i + 1] - g) < 1e-4 && Math.abs(f.colors[i + 2] - b) < 1e-4) n++;
  return n;
}

const topOf = (f: Facets): number => Math.max(...f.positions.filter((_, i) => i % 3 === 1));
const ground = (x: number, z: number) => standingHeight(heightAt3e({ x, z }));
const nodes = new Map(PATH_NODES_3E.map((n) => [n.id, n.at]));
const traces = (n: number) => placeTrace('fanal', posedTraces('fanal', upTo(n), MISSIONS));

/** Les noms du titre d'un plan (« Le toit de la lanterne » : toit, lanterne), sans ses articles, moins « abords ». */
const planNouns = (name: string) =>
  name
    .toLowerCase()
    .split(/[\s’']+/)
    .filter((w) => w.length > 2 && !['les', 'des', 'aux', 'abords'].includes(w));
/** Un mot entier, au singulier ou au pluriel, quelle que soit sa casse. */
const wordRe = (w: string) => new RegExp(`(?<!\\p{L})${w}s?(?!\\p{L})`, 'iu');

describe('Le Fanal, lieu complet', () => {
  it('ses cinq missions se jouent dans sa scénette, en cinq parties : le socle, la tour, la galerie, le haut, les abords', () => {
    expect(PLACE.scenes).toEqual(MISSIONS);
    expect(MISSIONS).toEqual(['images', 'linear', 'graphs', 'proportions', 'coordinates']);
    expect(hasScenette('fanal')).toBe(true);
    expect(hasHabitantModel('fanal')).toBe(true);
    expect(SHAPES.map((p) => p.map((s) => [s.stage, +s.from.toFixed(3), +s.to.toFixed(3)]))).toEqual([[[0, 0, 0.333]], [[0, 0.333, 0.667]], [[0, 0.667, 1]], [[1, 0, 1]], [[2, 0, 1]]]);
  });

  it('chaque partie pose quelque chose ; la ruine part avec la partie qui la remplace', () => {
    for (let n = 1; n <= 5; n++) expect(shown(n).triangles, String(n)).not.toBe(shown(n - 1).triangles);
    const ruin = placePieces('fanal').filter((p) => p.stage === 'ruine');
    const fallen = ruin.filter((p) => p.until).map((p) => `${p.until!.stage}/${p.until!.row.toFixed(3)}`);
    expect(new Set(fallen)).toEqual(new Set(['0/0.000', '0/0.333', '0/0.667', '1/0.000', '2/0.000']));
    expect(ruin.filter((p) => !p.until)).toHaveLength(1);
    expect(placePieces('fanal').filter((p) => p.stage !== 'ruine' && p.until)).toHaveLength(0);
  });

  it('coûte au plus 1 600 triangles à son état le plus chargé, traces comprises ; la ruine, 1 200 au plus', () => {
    let worst = 0;
    for (let n = 0; n <= 5; n++) worst = Math.max(worst, shown(n).triangles + traces(n).triangles);
    expect(worst).toBeLessThanOrEqual(PLACE_TRIANGLES_MAX_3E);
    expect(shown(0).triangles).toBeLessThanOrEqual(PLACE_RUIN_TRIANGLES_MAX_3E);
    expect(FANAL.reach).toBeUndefined();
  });

  it('une seule lanterne allumée dans la ruine, celle de l’opticienne ; une de plus aux abords ; toutes d’ocre', () => {
    expect([0, 1, 2, 3, 4, 5].map((n) => countColor(shown(n), C3E.lantern))).toEqual([30, 30, 30, 30, 30, 60]);
  });

  it('l’or blanc de la lumière à la seule lanterne du sommet, et seulement quand le haut est posé', () => {
    expect([0, 1, 2, 3, 4, 5].map((n) => countColor(shown(n), LIGHT) > 0)).toEqual([false, false, false, false, true, true]);
    const f = shown(5);
    const [r, g, b] = linearRgb(LIGHT);
    const lantern0 = FANAL_LAYOUT.base() + FANAL_TOWER_3E.y1;
    for (let i = 0; i < f.colors.length; i += 3)
      if (Math.abs(f.colors[i] - r) < 1e-4 && Math.abs(f.colors[i + 1] - g) < 1e-4 && Math.abs(f.colors[i + 2] - b) < 1e-4) expect(f.positions[i + 1]).toBeGreaterThan(lantern0);
  });

  it('le bronze aux seules lanternes, jamais de cobalt ; un peu de neige au toit, en ruine comme restauré ; rien de presque noir', () => {
    expect([0, 1, 2, 3, 4, 5].map((n) => countColor(shown(n), C3E.bronze))).toEqual([12, 12, 12, 12, 12, 24]);
    for (let n = 0; n <= 5; n++) {
      const f = shown(n);
      expect(countColor(f, COLORS_3E.cobalt), String(n)).toBe(0);
      expect(countColor(f, C3E.snow), String(n)).toBeGreaterThan(0);
      for (let i = 0; i < f.colors.length; i += 3) expect(Math.max(f.colors[i], f.colors[i + 1], f.colors[i + 2])).toBeGreaterThan(0.04);
    }
  });

  it('la tour : deux larges bandes d’ardoise, jamais une troisième ; plus haute que tout le Cirque', () => {
    const T = FANAL_TOWER_3E;
    expect(T.bands).toHaveLength(2);
    expect(topOf(shown(0))).toBeGreaterThan(T.y1 + 3);
    // Ses ardoises : les deux bandes, le chaperon de la galerie et le toit, rien d'autre entre le socle et la galerie.
    const f = shown(5);
    const [r, g, b] = linearRgb(C3E.slate);
    for (let i = 0; i < f.colors.length; i += 9) {
      if (!(Math.abs(f.colors[i] - r) < 1e-4 && Math.abs(f.colors[i + 1] - g) < 1e-4 && Math.abs(f.colors[i + 2] - b) < 1e-4)) continue;
      const y = (f.positions[i + 1] + f.positions[i + 4] + f.positions[i + 7]) / 3 - FANAL_LAYOUT.base();
      if (y < T.y0 || y > T.y1 - 0.5) continue;
      expect(T.bands.some(([lo, hi]) => y >= lo - 0.05 && y <= hi + 0.05), y.toFixed(2)).toBe(true);
    }
  });

  it('la ruine est cassée du côté vu de la porte : la brèche sur la face sud, entre les deux bandes', () => {
    const B = FANAL_LAYOUT.breach;
    const [lo, hi] = [FANAL_TOWER_3E.bands[0][1], FANAL_TOWER_3E.bands[1][0]];
    expect(B.y0).toBeGreaterThan(lo);
    expect(B.y1).toBeLessThan(hi);
    const face = FANAL_LAYOUT.onFace(90, B.y0);
    expect(face.z).toBeGreaterThan(FANAL_TOWER_3E.z);
    expect(FANAL_LAYOUT.door.z).toBeGreaterThan(face.z + 6);
  });

  it('l’herbe sèche de la ruine, d’un ton à part, part avec les abords', () => {
    expect([0, 1, 2, 3, 4, 5].map((n) => countColor(shown(n), C3E.dry) > 0)).toEqual([true, true, true, true, true, false]);
  });

  it('une trace par mission, posée avec sa partie', () => {
    const count = (n: number) => posedTraces('fanal', upTo(n), MISSIONS).length;
    expect([0, 1, 2, 3, 4, 5].map(count)).toEqual([0, 1, 2, 3, 4, 5]);
    for (const m of MISSIONS) expect(FANAL.traces[m], m).toBeDefined();
  });

  it('rien du lieu, en ruine comme restauré, sur le chemin de marche, de la porte à `ci-1` (à hauteur de Kéo)', () => {
    const way = [nodes.get('fanal')!, nodes.get('ci-1')!];
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
        expect(low && distanceToPolyline({ x, z }, way) < 0.9, `${x.toFixed(1)}, ${z.toFixed(1)}`).toBe(false);
      }
    }
  });
});

describe('Le bilan du Fanal', () => {
  it('nomme la partie par son étape, puis dit la phrase du lieu ; jamais un nom du contenu ni un nom de plan, ni un mot de peur', () => {
    const island = PLACE.island as BiomeId;
    const words = stagePoseWords(island, PLACE);
    const parties = partiesDe(island);
    expect(parties).toHaveLength(5);
    const said = [0, 1, 2, 3, 4].map((k) => phraseDeLaPose({ posees: [parties[k]], plansFinis: [] }, words));
    for (const s of said) expect(s).not.toMatch(/Gardien|Mémo/);
    const s = scenetteOf(PLACE.id);
    const texts = [...said, ...(s.words?.pose ?? []), s.words?.end ?? '', s.greeting ?? ''];
    for (const plan of plansFor(island))
      for (const text of texts) {
        expect(text).not.toContain(plan.done);
        for (const noun of planNouns(plan.name)) expect(text, noun).not.toMatch(wordRe(noun));
      }
    for (const text of texts) expect(text).not.toMatch(/vide|chute|tomb|vertige|phare|versant|peur|noir/i);
    expect(s.words?.pose).toEqual(['Le socle est refermé.', 'La tour est reprise.', 'Le garde-corps est relevé.', 'Le Fanal est allumé.', 'Le seuil est dallé.']);
    expect(s.words?.end).toBe('Ici, la lumière répondait aux trois autres archipels.');
  });
});

describe('La scénette du Fanal', () => {
  it('l’opticienne, sans prénom, et sa phrase de métier', () => {
    const s = scenetteOf('fanal');
    expect(s.role).toBe('L’opticienne');
    expect(s.greeting).toBe('L’opticienne taille les verres qui portent la lumière.');
  });

  it('elle se joue devant la porte des salles, hors du chemin, hors du socle, loin de la porte du lieu, le regard dos au pic', () => {
    const s = FANAL_LAYOUT.scene;
    const door = nodes.get('fanal')!;
    const way = [door, nodes.get('ci-1')!];
    for (const [sx, sz] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ]) {
      const p = { x: PLACE.center.x + s.dx + sx * s.half[0], z: PLACE.center.z + s.dz + sz * s.half[1] };
      expect(distanceToPolyline(p, way)).toBeGreaterThan(1.5);
      expect(s.dz + sz * s.half[1]).toBeGreaterThan(FANAL_LAYOUT.socle.low.z1 + 0.5);
    }
    expect(distance({ x: PLACE.center.x + s.dx, z: PLACE.center.z + s.dz }, door)).toBeGreaterThan(3);
    // Le regard de départ, au nord : la mer de nuages, jamais le pic (dans le dos).
    const start = FANAL.site!.start!;
    const look = { x: -Math.sin(start), z: -Math.cos(start) };
    const pic = { x: PEAK_3E.at.x - PLACE.center.x, z: PEAK_3E.at.z - PLACE.center.z };
    expect(look.x * pic.x + look.z * pic.z).toBeLessThan(0);
  });
});

describe('« Y aller » au Fanal', () => {
  const c = PLACE.center;
  const H0 = ground(c.x, c.z);
  const view = arrivalViewOf('fanal')!;
  const door = nodes.get('fanal')!;
  const feet = { x: door.x, y: ground(door.x, door.z), z: door.z };
  const world = (x: number, y: number, z: number) => ({ x: c.x + x, y: H0 + y, z: c.z + z });

  it('Kéo à la porte, au sud ; la caméra au cap nord, qui recule comme un Détour au plus ; au-delà, la mer de nuages jusqu’au ciel', () => {
    expect(doorViewOf('fanal')).toBe(0);
    expect(view.back).toBeGreaterThan(1);
    expect(view.back).toBeLessThanOrEqual(1.6);
    expect(landDistance3e(door)).toBeGreaterThan(6);
    // Dans l'axe, au nord, l'herbe du creux, puis rien que la nappe.
    let land = 0;
    for (let t = 60; t <= 400; t += 5) if (landDistance3e({ x: door.x, z: door.z - t }) >= 0) land++;
    expect(land).toBe(0);
  });

  for (const n of [0, 5])
    for (const [W, H] of [
      [1024, 768],
      [844, 390],
    ])
      it(`${n ? 'restauré' : 'en ruine'}, en ${W} × ${H} : le Fanal entier, du ciel au-dessus (${H > 500 ? 40 : 8} px), le socle dans le cadre, Kéo lisible`, () => {
        const pose = followPose(feet, 0, undefined, doorViewOf('fanal'), 1, undefined, { height: 0, back: view.back });
        lookUp(pose, world(view.look.x, topOf(shown(n)), view.look.z), feet, 1, H);
        const s = (p: { x: number; y: number; z: number }) => screenOf(pose, p, W, H);
        const inFrame = (p: { x: number; y: number }, what: string, sky = 0) => {
          expect(p.x, what).toBeGreaterThan(0);
          expect(p.x, what).toBeLessThan(W);
          expect(p.y, what).toBeGreaterThan(sky);
          expect(p.y, what).toBeLessThan(H);
        };
        const T = FANAL_TOWER_3E;
        const sky = H > 500 ? 40 : 8;
        inFrame(s(world(0, topOf(shown(n)), T.z)), 'pointe du toit', sky);
        for (const sx of [-1, 1]) inFrame(s(world(sx * FANAL_LAYOUT.gallery.r, FANAL_LAYOUT.base() + T.y1, T.z)), `galerie ${sx}`, sky);
        const L = FANAL_LAYOUT.socle.low;
        for (const sx of [-1, 1]) inFrame(s(world(sx * (L.x - 0.5), FANAL_LAYOUT.base() + L.top, L.z1)), `socle ${sx}`);
        const foot = s(feet);
        expect(foot.y - s({ ...feet, y: feet.y + 2.4 }).y).toBeGreaterThanOrEqual(H > 500 ? 70 : 40);
      });
});

describe('La fin des Ferrailleurs, au Fanal restauré', () => {
  const art = FANAL.restoration!;
  const c = { x: PLACE.center.x, y: ground(PLACE.center.x, PLACE.center.z), z: PLACE.center.z };
  const bronzeAt = (f: Facets) => {
    const [r, g, b] = linearRgb(C3E.bronze);
    const out: { x: number; z: number }[] = [];
    for (let i = 0; i < f.colors.length; i += 3) if (Math.abs(f.colors[i] - r) < 1e-4 && Math.abs(f.colors[i + 1] - g) < 1e-4 && Math.abs(f.colors[i + 2] - b) < 1e-4) out.push({ x: f.positions[i], z: f.positions[i + 2] });
    return out;
  };

  it('avant : les pièces de bronze sur la gondole du zeppelin, loin du Cirque ; le port au nord, sa lanterne éteinte', () => {
    const before = art.draw(c, 0);
    const bronze = bronzeAt(before);
    expect(bronze.length).toBeGreaterThan(0);
    for (const p of bronze) expect(distance(p, PLACE.center)).toBeGreaterThan(100);
    expect(countColor(before, C3E.lantern)).toBe(0);
    expect(countColor(before, PORT_LAMP_OFF_3E)).toBeGreaterThan(0);
  });

  it('jouée : les pièces rangées sur le râtelier au pied du Fanal, côté Rampe ; la gondole n’en porte plus ; une seule lumière, celle du port, au nord', () => {
    const after = art.draw(c, Infinity);
    const bronze = bronzeAt(after);
    expect(bronze.length).toBeGreaterThan(0);
    const rampe = PLAN.places.find((p) => p.id === 'rampe')!.center;
    for (const p of bronze) {
      expect(distance(p, PLACE.center)).toBeLessThan(14);
      expect(p.x).toBeGreaterThan(PLACE.center.x + FANAL_LAYOUT.socle.low.x);
    }
    expect(distance(FANAL_LAYOUT.ret.rackAt, { x: rampe.x - PLACE.center.x, z: rampe.z - PLACE.center.z })).toBeLessThan(distance({ x: 0, z: 0 }, { x: rampe.x - PLACE.center.x, z: rampe.z - PLACE.center.z }));
    // Une seule lanterne d'ocre : la lumière fixe du port, au nord du Cirque, loin et basse sur l'horizon (relecture du
    // Cirque, correction 2), sur son poteau au ras des nuages.
    expect(countColor(after, C3E.lantern)).toBe(30);
    const [r, g, b] = linearRgb(C3E.lantern);
    for (let i = 0; i < after.colors.length; i += 3)
      if (Math.abs(after.colors[i] - r) < 1e-4 && Math.abs(after.colors[i + 1] - g) < 1e-4 && Math.abs(after.colors[i + 2] - b) < 1e-4) {
        expect(after.positions[i + 2]).toBeLessThan(PLACE.center.z - 120);
        expect(distance({ x: after.positions[i], z: after.positions[i + 2] }, PLACE.center)).toBeGreaterThan(200);
        expect(distance({ x: after.positions[i], z: after.positions[i + 2] }, PLACE.center)).toBeLessThan(240);
        expect(after.positions[i + 1]).toBeGreaterThan(3);
        expect(after.positions[i + 1]).toBeLessThan(7);
        expect(landDistance3e({ x: after.positions[i], z: after.positions[i + 2] })).toBeLessThan(0);
      }
  });

  it('une seule fois, en moins de 4 secondes, une pièce après l’autre ; rien sur le chemin du Fanal', () => {
    expect(art.seconds).toBeLessThanOrEqual(4);
    const frames = [0, 0.5, 1, 1.3, 1.7, 2.1, 2.5, 2.9, 3.1, 3.5].map((t) => art.frame(t));
    expect(new Set(frames).size).toBe(frames.length);
    expect(art.frame(Infinity)).toBe(art.frame(art.seconds));
    const way = [nodes.get('fanal')!, nodes.get('ci-1')!];
    const f = art.draw(c, Infinity);
    for (let i = 0; i < f.positions.length; i += 3) {
      const p = { x: f.positions[i], z: f.positions[i + 2] };
      if (distance(p, PLACE.center) < 20) expect(distanceToPolyline(p, way)).toBeGreaterThan(1.5);
    }
  });
});
