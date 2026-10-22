// La Veillée (les Coteaux du 4e, lieu d'option) : le lieu par parties (3 + 1 + 1, d'après les cinq plans de son île),
// une seule lanterne allumée dans la ruine, trois restauré, jamais deux au même endroit ; une trace par rang de mission
// avec sa partie, la même pour les deux langues ; le signe de l'absence au crochet du trépied, qui ne change jamais ; la
// tonnelle basse, que rien ne dépasse ; aucune lueur, rien d'orange ; rien sur le chemin de marche ; la vue d'arrivée
// basse au nord-ouest ; la scénette de l'épicier, sans phrase de métier ; les plafonds de 1 600 et 1 200 triangles. Sans
// Three.js.
import { afterEach, describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, retenirReglages } from '../../../core/settings';
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
import { hasScenette, planFor } from './levelPlan';
import { doorFrameOf, doorViewOf } from './northShore';
import { C4E } from './place4eKit';
import { BUILT_PLACES_4E, COLORS_4E, PATH_NODES_4E, RESERVED_4E, UNPRICED_PLACES_4E } from './plan4e';
import { drawPieces, placePieces } from './places';
import { placeTrace, questionLayout } from './questionScene';
import { RUINS_4E } from './ruins4e';
import { scenetteHabitant, scenetteKeo, scenetteLayout, scenetteOf, scenettePose, scenetteStartYaw } from './scenette';
import { SURROUNDINGS, SURROUNDINGS_MAX } from './surroundings';
import { standingHeight } from './terrain';
import { heightAt4e } from './terrain4e';
import { VEILLEE, VEILLEE_LAYOUT, VEILLEE_RANKS } from './veillee4e';
import { VEILLEE_SURROUNDINGS } from './veilleeSurroundings';

afterEach(() => retenirReglages(null));

const PLAN = planFor('4e');
const PLACE = PLAN.places.find((p) => p.id === 'veillee')!;
const ISLAND = PLACE.island as BiomeId;
const MISSIONS = [...BUILT_PLACES_4E.veillee];
const SPANISH = MISSIONS.filter((m) => m.startsWith('es-'));
const GERMAN = MISSIONS.filter((m) => m.startsWith('de-'));

const shapes = (): PartShape[] => partShapes(ISLAND);
const upTo = (n: number): PartShape[] => shapes().slice(0, n);
const takes = (parts: readonly PartShape[], stage: Stage, row: number) => parts.some((part) => part.some((s) => s.stage === stage && row >= s.from - 1e-9 && row < s.to - 1e-9));

function shown(n: number): Facets {
  const parts = upTo(n);
  return drawPieces('veillee', (p) => (p.stage === 'ruine' ? !p.until || !takes(parts, p.until.stage, p.until.row) : takes(parts, p.stage, p.row)));
}

function countColor(f: Facets, color: number): number {
  const [r, g, b] = linearRgb(color);
  let n = 0;
  for (let i = 0; i < f.colors.length; i += 3) if (Math.abs(f.colors[i] - r) < 1e-4 && Math.abs(f.colors[i + 1] - g) < 1e-4 && Math.abs(f.colors[i + 2] - b) < 1e-4) n++;
  return n;
}

const ground = (x: number, z: number) => standingHeight(heightAt4e({ x, z }));
const nodes = new Map(PATH_NODES_4E.map((n) => [n.id, n.at]));
const traces = (n: number, missions = SPANISH) => placeTrace('veillee', posedTraces('veillee', upTo(n), missions));

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

describe('La Veillée, lieu d’option complet', () => {
  it('ses dix missions, cinq par langue, se jouent dans sa scénette, en cinq parties : trois au corps, le haut, les abords', () => {
    expect(PLACE.scenes).toEqual(MISSIONS);
    expect(MISSIONS).toHaveLength(10);
    expect(hasScenette('veillee')).toBe(true);
    expect(hasHabitantModel('veillee')).toBe(true);
    for (const lv2 of ['es', 'de'] as const) {
      retenirReglages({ ...DEFAULT_SETTINGS, lv2 });
      expect(
        shapes().map((p) => p.map((s) => [s.stage, s.from, s.to])),
        lv2,
      ).toEqual([[[0, 0, 1 / 3]], [[0, 1 / 3, 2 / 3]], [[0, 2 / 3, 1]], [[1, 0, 1]], [[2, 0, 1]]]);
    }
    expect(Object.hasOwn(RUINS_4E, 'veillee')).toBe(false);
    expect(UNPRICED_PLACES_4E).toContain('veillee');
    expect(VEILLEE_LAYOUT.door).toEqual({ x: expect.closeTo(6, 6), z: expect.closeTo(5, 6) });
  });

  it('chaque partie pose quelque chose ; la ruine part avec la rangée qui la remplace', () => {
    const pieces = placePieces('veillee');
    expect([...new Set(pieces.filter((p) => p.stage === 0).map((p) => p.row))]).toEqual([0, 1 / 3, 2 / 3]);
    for (let n = 1; n <= 5; n++) expect(shown(n).triangles, String(n)).not.toBe(shown(n - 1).triangles);
    const fallen = pieces.filter((p) => p.stage === 'ruine' && p.until).map((p) => `${p.until!.stage}/${p.until!.row}`);
    expect(new Set(fallen)).toEqual(new Set(['0/0', `0/${1 / 3}`, `0/${2 / 3}`, '1/0', '2/0']));
    expect(pieces.filter((p) => p.stage === 'ruine' && !p.until)).toHaveLength(1);
  });

  it('le signe de l’absence (la chape vide au crochet du trépied, ses deux goujons) est là avant comme après, seul fer brun une fois restauré', () => {
    expect(countColor(shown(5), C4E.rustDull)).toBe(24);
    for (let n = 0; n <= 5; n++) expect(countColor(shown(n), C4E.rustDullTop), String(n)).toBe(6);
    // Dans la ruine, le trépied aussi est d'un brun éteint ; redressé au corps 3, de fer bruni.
    expect(countColor(shown(2), C4E.rustDull)).toBeGreaterThan(24);
    expect(countColor(shown(3), C4E.rustDull)).toBe(24);
  });

  it('coûte au plus 1 600 triangles à son état le plus chargé, traces comprises ; la ruine, 1 200 au plus', () => {
    let worst = 0;
    for (let n = 0; n <= 5; n++) worst = Math.max(worst, shown(n).triangles + traces(n).triangles);
    expect(worst).toBeLessThanOrEqual(PLACE_TRIANGLES_MAX_4E);
    expect(shown(0).triangles).toBeLessThanOrEqual(PLACE_RUIN_TRIANGLES_MAX_4E);
    expect(VEILLEE.reach).toBeUndefined();
    expect(VEILLEE.restoration).toBeUndefined();
  });

  it('une seule lanterne allumée dans la ruine, celle de l’épicier ; une de plus au haut (l’angle sud-est), une aux abords (l’entrée est)', () => {
    const lit = (n: number) => countColor(shown(n), C4E.lantern);
    expect(lit(0)).toBe(30);
    expect([1, 2, 3, 4, 5].map(lit)).toEqual([30, 30, 30, 60, 90]);
  });

  it('aucune lueur rouge ni rien d’orange, à aucune étape : ni lave, ni rouille claire, ni cuivre, ni terre cuite, ni brique', () => {
    for (let n = 0; n <= 5; n++)
      for (const f of [shown(n), traces(n)])
        for (const c of [COLORS_4E.lava, FORGE_GLOW, ...FORGE_GLOW_FADE, COLORS_4E.rust, COLORS_4E.copper, COLORS_4E.terracotta, COLORS_4E.brick]) expect(countColor(f, c), `${n} ${c.toString(16)}`).toBe(0);
  });

  it('une trace par rang, posée avec sa partie, la même pour les deux langues (au rang 4, ser y estar et les verbes de mode)', () => {
    expect(VEILLEE_RANKS.flatMap(([, es, de]) => [es, de]).sort()).toEqual([...MISSIONS].sort());
    for (const [lv2, missions] of [
      ['es', SPANISH],
      ['de', GERMAN],
    ] as const) {
      retenirReglages({ ...DEFAULT_SETTINGS, lv2 });
      const count = (n: number) => posedTraces('veillee', upTo(n), missions).length;
      expect([0, 1, 2, 3, 4, 5].map(count), lv2).toEqual([0, 1, 2, 3, 4, 5]);
    }
    for (const [, es, de] of VEILLEE_RANKS) expect(VEILLEE.traces[es], es).toBe(VEILLEE.traces[de]);
  });

  it('la tonnelle basse : rien ne dépasse 2,6 au-dessus de sa terre battue ; l’enseigne plus basse qu’elle ; le muret, 0,7 au plus', () => {
    const L = VEILLEE_LAYOUT;
    const h0 = ground(PLACE.center.x, PLACE.center.z);
    for (let n = 0; n <= 5; n++) expect(boundsOf(shown(n)).max[1], String(n)).toBeLessThanOrEqual(L.floor + 2.6);
    expect(L.enseigne.h).toBeLessThan(L.tonnelle.h);
    expect(L.muret.h).toBeLessThanOrEqual(0.7);
    expect(h0).toBeGreaterThan(0);
  });

  it('rien du lieu, en ruine comme restauré, sur le chemin de marche, de part et d’autre de la porte (à hauteur de Kéo) ; la tour des signaux reste libre', () => {
    const door = nodes.get('veillee')!;
    const way = nodes.get('cot-3')!;
    const h0 = ground(PLACE.center.x, PLACE.center.z);
    const sets: [Facets, boolean][] = [
      [shown(0), true],
      [shown(5), true],
      [traces(5), false],
    ];
    const T = RESERVED_4E.tour;
    for (const [f, local] of sets) {
      for (let i = 0; i < f.positions.length; i += 9) {
        const x = (f.positions[i] + f.positions[i + 3] + f.positions[i + 6]) / 3 + (local ? PLACE.center.x : 0);
        const z = (f.positions[i + 2] + f.positions[i + 5] + f.positions[i + 8]) / 3 + (local ? PLACE.center.z : 0);
        const y = Math.min(f.positions[i + 1], f.positions[i + 4], f.positions[i + 7]) + (local ? h0 : 0);
        const low = y - ground(x, z) < 1.8;
        expect(low && distanceToPolyline({ x, z }, [door, way]) < 0.9, `${x.toFixed(1)}, ${z.toFixed(1)}`).toBe(false);
        expect(Math.abs(x - T.center.x) < T.half.x && Math.abs(z - T.center.z) < T.half.z).toBe(false);
      }
    }
  });
});

describe('Le bilan de la Veillée', () => {
  it('nomme la partie par son étape, puis dit la phrase du lieu ; jamais un nom du contenu', () => {
    const words = stagePoseWords(ISLAND, PLACE);
    const parties = partiesDe(ISLAND);
    expect(parties).toHaveLength(5);
    const said = [0, 1, 2, 3, 4].map((k) => phraseDeLaPose({ posees: [parties[k]], plansFinis: [] }, words));
    for (const s of said) expect(s).not.toMatch(/cuisine|tonnelle|Muscade|Gardien/i);
    // Jamais le nom d'un plan de l'île : ni sa réplique de fin (`done`), ni un nom de son titre (`name`), dans le bilan,
    // les phrases de pose et la phrase de fin (relecture du contenu des Coteaux, retouche 1).
    const texts = [...said, ...(scenetteOf(PLACE.id).words?.pose ?? []), scenetteOf(PLACE.id).words?.end ?? ''];
    for (const plan of plansFor(ISLAND))
      for (const text of texts) {
        expect(text).not.toContain(plan.done);
        for (const noun of planNouns(plan.name)) expect(text, noun).not.toMatch(wordRe(noun));
      }
    expect(scenetteOf('veillee').words?.pose).toEqual(['La table et les bancs sont réparés.', 'Les six poteaux sont debout.', 'Le garde-manger est rangé.', 'La vigne couvre de nouveau la table.', 'L’enseigne est raccrochée.']);
    expect(scenetteOf('veillee').words?.end).toBe('Le soir, les mineurs mangeaient ici, tous ensemble.');
  });
});

describe('La scénette de la Veillée', () => {
  it('l’épicier, sans prénom ni phrase de métier (la guide est la radio)', () => {
    const s = scenetteOf('veillee');
    expect(s.role).toBe('L’épicier');
    expect(s.greeting).toBeNull();
  });

  it('la caméra arrive par la porte, basse, au nord-ouest (à 45° au moins du soleil) : la tonnelle au milieu du cadre', () => {
    const door = nodes.get('veillee')!;
    const yaw = doorViewOf('veillee');
    const look = { x: -Math.sin(yaw), z: -Math.cos(yaw) };
    const cap = ((Math.atan2(look.x, -look.z) * 180) / Math.PI + 360) % 360;
    expect(cap).toBeCloseTo(310, 6);
    expect(Math.abs(cap - 153)).toBeGreaterThanOrEqual(45);
    const d = { x: PLACE.center.x - door.x, z: PLACE.center.z - door.z };
    const off = Math.atan2(look.x * d.z - look.z * d.x, look.x * d.x + look.z * d.z);
    expect(Math.abs((off * 180) / Math.PI)).toBeLessThan(15);
    const frame = doorFrameOf('veillee')!;
    expect(frame.height).toBeLessThan(0);
    expect(frame.back).toBeLessThanOrEqual(1.6);
  });

  it('elle se joue dehors, au nord-est du muret, la tonnelle au milieu derrière elle, hors du chemin ; ses abords sont enregistrés', () => {
    const s = VEILLEE_LAYOUT.scene;
    const door = nodes.get('veillee')!;
    const way = nodes.get('cot-3')!;
    const M = VEILLEE_LAYOUT.muret;
    for (const [sx, sz] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ]) {
      expect(distanceToPolyline({ x: PLACE.center.x + s.dx + sx * s.half[0], z: PLACE.center.z + s.dz + sz * s.half[1] }, [door, way])).toBeGreaterThan(1.5);
      // Toute la scène hors du muret, au nord.
      expect(s.dz + sz * s.half[1]).toBeLessThan(-M.z - M.t);
    }
    expect(distance({ x: PLACE.center.x + s.dx, z: PLACE.center.z + s.dz }, door)).toBeGreaterThan(3);
    // La tonnelle derrière la scène, au milieu du regard de la caméra (au sud-ouest, 225°), à 15° près.
    const keo = scenetteKeo('veillee').at;
    const grocer = scenetteHabitant('veillee');
    const bearing = ((Math.atan2(-s.dx, s.dz) * 180) / Math.PI + 360) % 360;
    expect(Math.abs(bearing - 225)).toBeLessThan(15);
    // Kéo et l'épicier, et les pierres des abords, hors du muret.
    for (const p of [keo, grocer]) expect(p.z - PLACE.center.z).toBeLessThan(-M.z - M.t);
    expect(SURROUNDINGS.veillee).toBeDefined();
    const b = new FacetBuilder();
    const floor = { x: PLACE.center.x + s.dx, y: 0, z: PLACE.center.z + s.dz };
    SURROUNDINGS.veillee!(b, floor, { posed: true } as never);
    expect(b.build().triangles).toBeLessThanOrEqual(SURROUNDINGS_MAX);
    expect(VEILLEE_SURROUNDINGS.rocks.length).toBeGreaterThan(0);
    for (const r of VEILLEE_SURROUNDINGS.rocks) expect(s.dz + r.dz + r.r).toBeLessThan(-M.z - M.t / 2);
  });

  it('la caméra de la scénette, au nord-est, hors de la tonnelle et du muret, voit Kéo et l’épicier sans traverser ni poutre, ni vigne, ni garde-manger (retouche 1)', () => {
    const L = VEILLEE_LAYOUT;
    const T = L.tonnelle;
    const G = L.garde;
    const M = L.muret;
    const c = PLACE.center;
    const h0 = ground(c.x, c.z);
    // La tonnelle, du sol au haut de sa vigne, poteaux et débord compris.
    const inArbor = (x: number, y: number, z: number) => x > T.xs[0] - T.over - 0.1 && x < T.xs[2] + T.over + 0.1 && z > T.zs[0] - T.over - 0.1 && z < T.zs[1] + T.over + 0.1 && y < L.floor + T.top + 0.2;
    for (const [w, h] of [
      [1024, 768],
      [1366, 1024],
      [844, 390],
      [390, 844],
    ]) {
      const stage = scenetteLayout({ count: 3 }, w, h, questionLayout({ count: 3 }, w, h)).scenette!.stage;
      const { pose } = scenettePose('veillee', stage, w, h);
      const yaw = scenetteStartYaw('veillee');
      const t = pose.target;
      const d = Math.hypot(pose.position.x - t.x, pose.position.z - t.z);
      const cam = { x: t.x + Math.sin(yaw) * d, y: pose.position.y, z: t.z + Math.cos(yaw) * d };
      // La caméra regarde au sud-ouest : elle est au nord-est de la scène, dehors.
      expect(cam.x - t.x, `${w}`).toBeGreaterThan(0);
      expect(cam.z - t.z, `${w}`).toBeLessThan(0);
      const lx = cam.x - c.x,
        lz = cam.z - c.z;
      const inWalls = lx > M.x0 - 0.5 && lx < M.x1 + 0.5 && Math.abs(lz) < M.z + 0.5;
      expect(inWalls, `${w} caméra dans le muret ${lx.toFixed(1)} ${lz.toFixed(1)}`).toBe(false);
      for (const who of [scenetteKeo('veillee').at, scenetteHabitant('veillee')]) {
        for (const up of [0.2, 0.7, 1.2]) {
          const aim = { x: who.x, y: who.y + up, z: who.z };
          for (let k = 0; k <= 200; k++) {
            const u = k / 200;
            const x = cam.x + (aim.x - cam.x) * u - c.x,
              y = cam.y + (aim.y - cam.y) * u - h0,
              z = cam.z + (aim.z - cam.z) * u - c.z;
            expect(inArbor(x, y, z), `${w} tonnelle ${x.toFixed(1)} ${y.toFixed(1)} ${z.toFixed(1)}`).toBe(false);
            const inLarder = Math.abs(x - G.x) < G.w / 2 + 0.05 && Math.abs(z - G.z) < G.d / 2 + 0.05 && y < L.floor + G.h;
            expect(inLarder, `${w} garde-manger ${x.toFixed(1)} ${z.toFixed(1)}`).toBe(false);
          }
        }
      }
    }
  });
});
