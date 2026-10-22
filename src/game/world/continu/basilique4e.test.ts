// La Basilique (les Coteaux du 4e, lieu d'option) : le lieu par parties (1 + 1 + 1, d'après les trois plans de son
// île), une seule lanterne allumée dans la ruine, trois restaurée, jamais deux au même endroit ; une trace par rang de
// mission avec sa partie, la même pour le latin et le grec ; le signe de l'absence sur le pilier de la fontaine, qui ne
// change jamais ; huit colonnes rondes (jamais six pans), cinq debout dans la ruine ; la halle sans mur, sous 7,7 ; aucune
// lueur, rien d'orange ; rien sur les deux chemins de la porte ; la vue d'arrivée basse à l'ouest, dans l'axe de la nef ;
// la scénette de la sculptrice, sans phrase de métier ; les plafonds de 1 600 et 1 200 triangles. Sans Three.js.
import { afterEach, describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, retenirReglages } from '../../../core/settings';
import type { BiomeId } from '../../biomes';
import { partShapes, stagePoseWords } from '../../three/archipeo/constructionParts';
import { phraseDeLaPose } from '../../poseWords';
import { partiesDe } from '../parts';
import { plansFor } from '../plans';
import { BASILIQUE, BASILIQUE_LAYOUT, BASILIQUE_RANKS } from './basilique4e';
import { BASILIQUE_SURROUNDINGS } from './basiliqueSurroundings';
import { PLACE_RUIN_TRIANGLES_MAX_4E, PLACE_TRIANGLES_MAX_4E } from './budget';
import { posedTraces, type PartShape, type Stage } from './construction';
import { FacetBuilder, boundsOf, type Facets } from './facets';
import { FORGE_GLOW, FORGE_GLOW_FADE } from './forge4e';
import { distance, distanceToPolyline, linearRgb } from './geometry';
import { hasHabitantModel } from './habitants';
import { hasScenette, planFor } from './levelPlan';
import { doorFrameOf, doorViewOf } from './northShore';
import { C4E } from './place4eKit';
import { BUILT_PLACES_4E, COLORS_4E, PATH_NODES_4E, RESERVED_4E, UNPRICED_PLACES_4E } from './plan4e';
import { drawPieces, placePieces } from './places';
import { placeTrace, questionLayout } from './questionScene';
import { rendered5e } from './rendered5e';
import { RUINS_4E } from './ruins4e';
import { scenetteHabitant, scenetteKeo, scenetteLayout, scenetteOf, scenettePose, scenetteStartYaw } from './scenette';
import { LIGHT_4E } from './sky';
import { SURROUNDINGS, SURROUNDINGS_MAX } from './surroundings';
import { standingHeight } from './terrain';
import { heightAt4e } from './terrain4e';

afterEach(() => retenirReglages(null));

const PLAN = planFor('4e');
const PLACE = PLAN.places.find((p) => p.id === 'basilique')!;
const ISLAND = PLACE.island as BiomeId;
const MISSIONS = [...BUILT_PLACES_4E.basilique];
const LATIN = MISSIONS.filter((m) => m.startsWith('la-'));
const GREEK = MISSIONS.filter((m) => m.startsWith('gr-'));

const shapes = (): PartShape[] => partShapes(ISLAND);
const upTo = (n: number): PartShape[] => shapes().slice(0, n);
const takes = (parts: readonly PartShape[], stage: Stage, row: number) => parts.some((part) => part.some((s) => s.stage === stage && row >= s.from - 1e-9 && row < s.to - 1e-9));

function shown(n: number): Facets {
  const parts = upTo(n);
  return drawPieces('basilique', (p) => (p.stage === 'ruine' ? !p.until || !takes(parts, p.until.stage, p.until.row) : takes(parts, p.stage, p.row)));
}

function countColor(f: Facets, color: number): number {
  const [r, g, b] = linearRgb(color);
  let n = 0;
  for (let i = 0; i < f.colors.length; i += 3) if (Math.abs(f.colors[i] - r) < 1e-4 && Math.abs(f.colors[i + 1] - g) < 1e-4 && Math.abs(f.colors[i + 2] - b) < 1e-4) n++;
  return n;
}

const ground = (x: number, z: number) => standingHeight(heightAt4e({ x, z }));
const nodes = new Map(PATH_NODES_4E.map((n) => [n.id, n.at]));
const traces = (n: number, missions = LATIN) => placeTrace('basilique', posedTraces('basilique', upTo(n), missions));

/** Les fûts debout : les sommets du dessus d’un fût (dix pans, dix triangles), un fût par dessus. */
const shafts = (f: Facets) => countColor(f, BASILIQUE_LAYOUT.shaft.top) / 30;

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

describe('La Basilique, lieu d’option complet', () => {
  it('ses six missions, trois par option, se jouent dans sa scénette, en trois parties : le corps, le haut, les abords', () => {
    expect(PLACE.scenes).toEqual(MISSIONS);
    expect(MISSIONS).toHaveLength(6);
    expect(hasScenette('basilique')).toBe(true);
    expect(hasHabitantModel('basilique')).toBe(true);
    for (const lca of ['la', 'gr'] as const) {
      retenirReglages({ ...DEFAULT_SETTINGS, lca });
      expect(
        shapes().map((p) => p.map((s) => [s.stage, s.from, s.to])),
        lca,
      ).toEqual([[[0, 0, 1]], [[1, 0, 1]], [[2, 0, 1]]]);
    }
    expect(Object.hasOwn(RUINS_4E, 'basilique')).toBe(false);
    expect(UNPRICED_PLACES_4E).toContain('basilique');
    expect(BASILIQUE_LAYOUT.door).toEqual({ x: expect.closeTo(8, 6), z: expect.closeTo(0, 6) });
  });

  it('chaque partie pose quelque chose ; la ruine part avec la partie qui la remplace', () => {
    for (let n = 1; n <= 3; n++) expect(shown(n).triangles, String(n)).not.toBe(shown(n - 1).triangles);
    const ruin = placePieces('basilique').filter((p) => p.stage === 'ruine');
    const fallen = ruin.filter((p) => p.until).map((p) => `${p.until!.stage}/${p.until!.row}`);
    expect(new Set(fallen)).toEqual(new Set(['0/0', '1/0', '2/0']));
    expect(ruin.filter((p) => !p.until)).toHaveLength(1);
  });

  it('huit colonnes rondes debout une fois le corps posé, cinq debout dans la ruine (une cassée, deux couchées) ; jamais six pans', () => {
    expect(BASILIQUE_LAYOUT.nef.sides).toBeGreaterThanOrEqual(8);
    expect(BASILIQUE_LAYOUT.nef.sides).not.toBe(6);
    expect(BASILIQUE_LAYOUT.nef.xs.length * BASILIQUE_LAYOUT.nef.zs.length).toBe(8);
    expect(shafts(shown(1))).toBe(8);
    // Dans la ruine : cinq fûts entiers et le moignon de la colonne cassée.
    expect(shafts(shown(0))).toBe(6);
  });

  it('à l’ombre, aucune face d’un fût ne descend à l’écran sous #4A4240 (jamais presque noir), sous la lumière du 4e', () => {
    const lum = (c: number) => linearRgb(c).reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
    const N = BASILIQUE_LAYOUT.nef;
    for (let k = 0; k < N.sides; k++) {
      const a = (2 * Math.PI * (k + 0.5)) / N.sides;
      const seen = rendered5e(linearRgb(BASILIQUE_LAYOUT.shaft.side), [Math.cos(a), 0, Math.sin(a)], LIGHT_4E);
      expect(lum(seen), seen.toString(16)).toBeGreaterThanOrEqual(lum(0x4a4240));
    }
    // Le basalte du 4e tel quel y tombait (#261208 mesuré sur les captures).
    expect(lum(rendered5e(linearRgb(COLORS_4E.basalt), [-1, 0, 0], LIGHT_4E))).toBeLessThan(lum(0x4a4240));
  });

  it('le signe de l’absence (le support vide de la vasque, ses deux goujons) est là avant comme après, seul fer brun', () => {
    for (let n = 0; n <= 3; n++) {
      expect(countColor(shown(n), C4E.rustDull), String(n)).toBe(24);
      expect(countColor(shown(n), C4E.rustDullTop), String(n)).toBe(6);
    }
  });

  it('coûte au plus 1 600 triangles à son état le plus chargé, traces comprises ; la ruine, 1 200 au plus', () => {
    let worst = 0;
    for (let n = 0; n <= 3; n++) worst = Math.max(worst, shown(n).triangles + traces(n).triangles);
    expect(worst).toBeLessThanOrEqual(PLACE_TRIANGLES_MAX_4E);
    expect(shown(0).triangles).toBeLessThanOrEqual(PLACE_RUIN_TRIANGLES_MAX_4E);
    expect(BASILIQUE.reach).toBeUndefined();
    expect(BASILIQUE.restoration).toBeUndefined();
  });

  it('une seule lanterne allumée dans la ruine, celle de la sculptrice ; une de plus au haut (la ferme est), une aux abords (le parvis)', () => {
    const lit = (n: number) => countColor(shown(n), C4E.lantern);
    expect(lit(0)).toBe(30);
    expect([1, 2, 3].map(lit)).toEqual([30, 60, 90]);
  });

  it('aucune lueur rouge ni rien d’orange, à aucune étape : ni lave, ni rouille claire, ni cuivre, ni terre cuite, ni brique', () => {
    for (let n = 0; n <= 3; n++)
      for (const f of [shown(n), traces(n)])
        for (const c of [COLORS_4E.lava, FORGE_GLOW, ...FORGE_GLOW_FADE, COLORS_4E.rust, COLORS_4E.copper, COLORS_4E.terracotta, COLORS_4E.brick]) expect(countColor(f, c), `${n} ${c.toString(16)}`).toBe(0);
  });

  it('une trace par rang, posée avec sa partie, la même pour le latin et le grec (au rang 2, le forum et l’agora)', () => {
    expect(Object.values(BASILIQUE_RANKS).flat().sort()).toEqual([...MISSIONS].sort());
    for (const [lca, missions] of [
      ['la', LATIN],
      ['gr', GREEK],
    ] as const) {
      retenirReglages({ ...DEFAULT_SETTINGS, lca });
      const count = (n: number) => posedTraces('basilique', upTo(n), missions).length;
      expect([0, 1, 2, 3].map(count), lca).toEqual([0, 1, 2, 3]);
    }
    for (const [la, gr] of Object.values(BASILIQUE_RANKS)) expect(BASILIQUE.traces[la], la).toBe(BASILIQUE.traces[gr]);
  });

  it('la halle haute de 7 au plus, sous les 7,7 de la caméra qui suit ; aucun mur', () => {
    const L = BASILIQUE_LAYOUT;
    expect(boundsOf(shown(3)).max[1] - L.floor).toBeLessThanOrEqual(7.05);
    expect(boundsOf(shown(3)).max[1]).toBeLessThan(7.7);
    // Entre deux colonnes d'un rang, rien de la halle plus bas que l'entrait : on voit le large.
    const f = shown(3);
    for (let i = 0; i < f.positions.length; i += 3) {
      const x = f.positions[i],
        y = f.positions[i + 1],
        z = f.positions[i + 2];
      const between = x > L.nef.xs[0] + 0.6 && x < L.nef.xs[3] - 0.6 && Math.abs(Math.abs(z) - Math.abs(L.nef.zs[1])) < 0.05;
      const inGap = L.nef.xs.every((cx) => Math.abs(x - cx) > 0.6);
      if (between && inGap) expect(y > L.top - 0.05 || y < L.floor + 0.6, `${x.toFixed(1)} ${y.toFixed(1)} ${z.toFixed(1)}`).toBe(true);
    }
  });

  it('rien du lieu, en ruine comme restauré, sur ses deux chemins (à hauteur de Kéo) ; la tour des signaux reste libre', () => {
    const door = nodes.get('basilique')!;
    const ways = [nodes.get('cot-2')!, nodes.get('cot-3')!];
    const h0 = ground(PLACE.center.x, PLACE.center.z);
    const sets: [Facets, boolean][] = [
      [shown(0), true],
      [shown(3), true],
      [traces(3), false],
    ];
    const T = RESERVED_4E.tour;
    for (const [f, local] of sets) {
      for (let i = 0; i < f.positions.length; i += 9) {
        const x = (f.positions[i] + f.positions[i + 3] + f.positions[i + 6]) / 3 + (local ? PLACE.center.x : 0);
        const z = (f.positions[i + 2] + f.positions[i + 5] + f.positions[i + 8]) / 3 + (local ? PLACE.center.z : 0);
        const y = Math.min(f.positions[i + 1], f.positions[i + 4], f.positions[i + 7]) + (local ? h0 : 0);
        const low = y - ground(x, z) < 1.8;
        for (const way of ways) expect(low && distanceToPolyline({ x, z }, [door, way]) < 0.9, `${x.toFixed(1)}, ${z.toFixed(1)}`).toBe(false);
        expect(Math.abs(x - T.center.x) < T.half.x && Math.abs(z - T.center.z) < T.half.z).toBe(false);
      }
    }
  });
});

describe('Le bilan de la Basilique', () => {
  it('nomme la partie par son étape, puis dit la phrase du lieu ; jamais un nom du contenu ni le Bastion', () => {
    const words = stagePoseWords(ISLAND, PLACE);
    const parties = partiesDe(ISLAND);
    expect(parties).toHaveLength(3);
    const said = [0, 1, 2].map((k) => phraseDeLaPose({ posees: [parties[k]], plansFinis: [] }, words));
    for (const s of said) expect(s).not.toMatch(/maison|fontaine|Figue|Gardien|Bastion|Rome|Grèce/i);
    // Jamais le nom d'un plan de l'île : ni sa réplique de fin (`done`), ni un nom de son titre (`name`), dans le bilan,
    // les phrases de pose et la phrase de fin (relecture du contenu des Coteaux, retouche 1).
    const texts = [...said, ...(scenetteOf(PLACE.id).words?.pose ?? []), scenetteOf(PLACE.id).words?.end ?? ''];
    for (const plan of plansFor(ISLAND))
      for (const text of texts) {
        expect(text).not.toContain(plan.done);
        for (const noun of planNouns(plan.name, ['colonnes'])) expect(text, noun).not.toMatch(wordRe(noun));
      }
    expect(scenetteOf('basilique').words?.pose).toEqual(['Les colonnes sont relevées.', 'La halle est couverte.', 'Le bassin est plein.']);
    expect(scenetteOf('basilique').words?.end).toBe('Ici, on a relevé les colonnes d’un vieux temple.');
  });
});

describe('La scénette de la Basilique', () => {
  it('la sculptrice, sans prénom ni phrase de métier (le guide est Malo)', () => {
    const s = scenetteOf('basilique');
    expect(s.role).toBe('La sculptrice');
    expect(s.greeting).toBeNull();
  });

  it('la caméra arrive par la porte, basse, à l’ouest (à 45° au moins du soleil) : la nef dans son axe', () => {
    const door = nodes.get('basilique')!;
    const yaw = doorViewOf('basilique');
    const look = { x: -Math.sin(yaw), z: -Math.cos(yaw) };
    const cap = ((Math.atan2(look.x, -look.z) * 180) / Math.PI + 360) % 360;
    expect(cap).toBeCloseTo(270, 6);
    expect(Math.abs(cap - 153)).toBeGreaterThanOrEqual(45);
    // L'axe de la nef (z = 0 du lieu) passe par la porte.
    expect(door.z - PLACE.center.z).toBeCloseTo(0, 6);
    const frame = doorFrameOf('basilique')!;
    expect(frame.height).toBeLessThan(0);
    expect(frame.back).toBeLessThanOrEqual(1.6);
  });

  it('elle se joue sous la halle, entre la fontaine et le bout est de la nef, hors des chemins ; ses abords sont enregistrés', () => {
    const s = BASILIQUE_LAYOUT.scene;
    const door = nodes.get('basilique')!;
    for (const way of [nodes.get('cot-2')!, nodes.get('cot-3')!])
      for (const [sx, sz] of [
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ])
        expect(distanceToPolyline({ x: PLACE.center.x + s.dx + sx * s.half[0], z: PLACE.center.z + s.dz + sz * s.half[1] }, [door, way])).toBeGreaterThan(1.5);
    expect(distance({ x: PLACE.center.x + s.dx, z: PLACE.center.z + s.dz }, door)).toBeGreaterThan(3);
    const L = BASILIQUE_LAYOUT;
    expect(s.dx).toBeGreaterThan(L.fountain.x + L.fountain.len / 2);
    expect(s.dx).toBeLessThan(L.nef.xs[3]);
    expect(SURROUNDINGS.basilique).toBeDefined();
    const b = new FacetBuilder();
    SURROUNDINGS.basilique!(b, { x: PLACE.center.x + s.dx, y: 0, z: PLACE.center.z + s.dz }, { posed: true } as never);
    expect(b.build().triangles).toBeLessThanOrEqual(SURROUNDINGS_MAX);
    expect(BASILIQUE_SURROUNDINGS.rocks.length).toBeGreaterThan(0);
  });

  it('la caméra de la scénette, à l’est, voit Kéo et la sculptrice sous le bas du toit, jamais à travers une colonne', () => {
    const L = BASILIQUE_LAYOUT;
    const N = L.nef;
    for (const [w, h] of [
      [1024, 768],
      [1366, 1024],
      [844, 390],
    ]) {
      const stage = scenetteLayout({ count: 3 }, w, h, questionLayout({ count: 3 }, w, h)).scenette!.stage;
      const { pose } = scenettePose('basilique', stage, w, h);
      const yaw = scenetteStartYaw('basilique');
      const t = pose.target;
      const d = Math.hypot(pose.position.x - t.x, pose.position.z - t.z);
      const cam = { x: t.x + Math.sin(yaw) * d, y: pose.position.y, z: t.z + Math.cos(yaw) * d };
      const c = PLACE.center;
      const h0 = ground(c.x, c.z);
      for (const who of [scenetteKeo('basilique').at, scenetteHabitant('basilique')]) {
        const head = { x: who.x, y: who.y + 1.2, z: who.z };
        for (let k = 1; k < 200; k++) {
          const u = k / 200;
          const x = cam.x + (head.x - cam.x) * u - c.x,
            y = cam.y + (head.y - cam.y) * u - h0,
            z = cam.z + (head.z - cam.z) * u - c.z;
          const under = x > N.xs[0] - N.over.x && x < N.xs[3] + N.over.x && Math.abs(z) < N.zs[1] + N.over.z;
          if (under) expect(y, `${w} toit ${x.toFixed(1)} ${z.toFixed(1)}`).toBeLessThan(L.top - 0.05);
          for (const cx of N.xs) for (const cz of N.zs) expect(Math.hypot(x - cx, z - cz) < N.r + 0.05 && y < L.top, `${w} colonne ${cx} ${cz}`).toBe(false);
        }
      }
    }
  });
});
