// La Jonction (les Coteaux du 4e, monde ouvert seulement) : le lieu par parties (3 + 1 + 1), une seule lanterne allumée
// dans la ruine, trois restauré ; une trace par mission avec sa partie ; le signe de l'absence au bout de la rangée des
// leviers, qui ne change jamais ; trois voies toujours, les rails du lot 1 à leur place, la plaque sur la première voie ;
// aucune lueur, rien d'orange hors des rails ; rien sur le chemin de marche ; la vue d'arrivée basse à 210° ; la scénette
// du cantonnier, le dos à la voie principale ; les plafonds de 1 600 et 1 200 triangles. Sans Three.js.
import { describe, expect, it } from 'vitest';
import type { BiomeId } from '../../biomes';
import { partShapes, stagePoseWords } from '../../three/archipeo/constructionParts';
import { phraseDeLaPose } from '../../poseWords';
import { partiesDe } from '../parts';
import { plansFor } from '../plans';
import { PLACE_RUIN_TRIANGLES_MAX_4E, PLACE_TRIANGLES_MAX_4E } from './budget';
import { posedTraces, type PartShape, type Stage } from './construction';
import { FacetBuilder, type Facets } from './facets';
import { FORGE_GLOW, FORGE_GLOW_FADE } from './forge4e';
import { distance, distanceToPolyline, linearRgb } from './geometry';
import { hasHabitantModel } from './habitants';
import { JONCTION, JONCTION_LAYOUT } from './jonction4e';
import { JONCTION_SURROUNDINGS } from './jonctionSurroundings';
import { hasScenette, planFor } from './levelPlan';
import { doorFrameOf, doorViewOf } from './northShore';
import { C4E } from './place4eKit';
import { BUILT_PLACES_4E, COLORS_4E, JONCTION_TRACK_4E, PATH_NODES_4E, RAILS_4E } from './plan4e';
import { RAILS_LOOK_4E } from './paths4e';
import { drawPieces, placePieces } from './places';
import { placeTrace } from './questionScene';
import { RUINS_4E } from './ruins4e';
import { scenetteHabitant, scenetteKeo, scenetteOf } from './scenette';
import { SURROUNDINGS, SURROUNDINGS_MAX } from './surroundings';
import { standingHeight } from './terrain';
import { heightAt4e } from './terrain4e';

const PLAN = planFor('4e');
const PLACE = PLAN.places.find((p) => p.id === 'jonction')!;
const SHAPES = partShapes(PLACE.island as BiomeId);
const MISSIONS = [...BUILT_PLACES_4E.jonction];

const upTo = (n: number): PartShape[] => SHAPES.slice(0, n);
const takes = (parts: readonly PartShape[], stage: Stage, row: number) => parts.some((part) => part.some((s) => s.stage === stage && row >= s.from - 1e-9 && row < s.to - 1e-9));

function shown(n: number): Facets {
  const parts = upTo(n);
  return drawPieces('jonction', (p) => (p.stage === 'ruine' ? !p.until || !takes(parts, p.until.stage, p.until.row) : takes(parts, p.stage, p.row)));
}

function countColor(f: Facets, color: number): number {
  const [r, g, b] = linearRgb(color);
  let n = 0;
  for (let i = 0; i < f.colors.length; i += 3) if (Math.abs(f.colors[i] - r) < 1e-4 && Math.abs(f.colors[i + 1] - g) < 1e-4 && Math.abs(f.colors[i + 2] - b) < 1e-4) n++;
  return n;
}

const ground = (x: number, z: number) => standingHeight(heightAt4e({ x, z }));
const nodes = new Map(PATH_NODES_4E.map((n) => [n.id, n.at]));
const traces = (n: number) => placeTrace('jonction', posedTraces('jonction', upTo(n), MISSIONS));

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

describe('La Jonction, lieu complet', () => {
  it('ses cinq missions se jouent dans sa scénette, en cinq parties : le corps en trois, le haut, les abords', () => {
    expect(PLACE.scenes).toEqual(MISSIONS);
    expect(MISSIONS).toEqual(['relative-clauses', 'subordinate-clauses', 'passive-reported', 'compound-tenses', 'moods']);
    expect(hasScenette('jonction')).toBe(true);
    expect(hasHabitantModel('jonction')).toBe(true);
    expect(SHAPES.map((p) => p.map((s) => [s.stage, s.from, s.to]))).toEqual([[[0, 0, 1 / 3]], [[0, 1 / 3, 2 / 3]], [[0, 2 / 3, 1]], [[1, 0, 1]], [[2, 0, 1]]]);
    expect(Object.hasOwn(RUINS_4E, 'jonction')).toBe(false);
  });

  it('chaque partie pose quelque chose ; la ruine part avec la rangée qui la remplace', () => {
    for (let n = 1; n <= 5; n++) expect(shown(n).triangles, String(n)).not.toBe(shown(n - 1).triangles);
    const ruin = placePieces('jonction').filter((p) => p.stage === 'ruine');
    const fallen = ruin.filter((p) => p.until).map((p) => `${p.until!.stage}/${p.until!.row.toFixed(3)}`);
    expect(new Set(fallen)).toEqual(new Set(['0/0.000', '0/0.333', '0/0.667', '1/0.000', '2/0.000']));
    expect(ruin.filter((p) => !p.until)).toHaveLength(1);
  });

  it('le signe de l’absence (le support vide du grand levier, ses deux goujons) est là avant comme après', () => {
    // Après la ruine (les pans du toit, les leviers, la plaque d'un brun éteint), seul le support reste brun.
    expect(countColor(shown(5), C4E.rustDull)).toBe(24);
    expect(countColor(shown(5), C4E.rustDullTop)).toBe(6);
    for (let n = 0; n <= 5; n++) expect(countColor(shown(n), C4E.rustDull), String(n)).toBeGreaterThanOrEqual(24);
  });

  it('coûte au plus 1 600 triangles à son état le plus chargé, traces comprises ; la ruine, 1 200 au plus', () => {
    let worst = 0;
    for (let n = 0; n <= 5; n++) worst = Math.max(worst, shown(n).triangles + traces(n).triangles);
    expect(worst).toBeLessThanOrEqual(PLACE_TRIANGLES_MAX_4E);
    expect(shown(0).triangles).toBeLessThanOrEqual(PLACE_RUIN_TRIANGLES_MAX_4E);
    expect(JONCTION.reach).toBeUndefined();
    expect(JONCTION.restoration).toBeUndefined();
  });

  it('une seule lanterne allumée dans la ruine, celle du cantonnier ; la lanterne de voie éteinte, allumée avec le haut ; une aux abords', () => {
    const lit = (n: number) => countColor(shown(n), C4E.lantern);
    const off = (n: number) => countColor(shown(n), C4E.lanternOff);
    expect([0, 1, 2, 3, 4, 5].map(lit)).toEqual([30, 30, 30, 30, 60, 90]);
    expect([0, 1, 2, 3, 4, 5].map(off)).toEqual([30, 30, 30, 30, 0, 0]);
  });

  it('aucune lueur rouge ni rien d’orange, à aucune étape ; la rouille claire seulement sur les rails, dans l’axe des voies', () => {
    const L = JONCTION_LAYOUT;
    for (let n = 0; n <= 5; n++) {
      for (const f of [shown(n), traces(n)]) for (const col of [COLORS_4E.lava, FORGE_GLOW, ...FORGE_GLOW_FADE, COLORS_4E.copper, COLORS_4E.terracotta, COLORS_4E.brick]) expect(countColor(f, col), `${n} ${col.toString(16)}`).toBe(0);
      expect(countColor(traces(n), COLORS_4E.rust)).toBe(0);
    }
    // Chaque sommet de rouille claire est sur une voie de service, à moins de la voie et demie de son axe.
    const [r, g, b] = linearRgb(COLORS_4E.rust);
    const f = shown(5);
    for (let i = 0; i < f.colors.length; i += 3) {
      if (Math.abs(f.colors[i] - r) > 1e-4 || Math.abs(f.colors[i + 1] - g) > 1e-4 || Math.abs(f.colors[i + 2] - b) > 1e-4) continue;
      const p = { x: f.positions[i], z: f.positions[i + 2] };
      const near = L.sidings.some((_, k) => distanceToPolyline(p, [L.onSiding(k, 0), L.onSiding(k, L.sidings[k].len)]) < 1.5);
      expect(near, `${p.x.toFixed(1)} ${p.z.toFixed(1)}`).toBe(true);
    }
  });

  it('une trace par mission, posée avec sa partie, jamais entre les rails', () => {
    const count = (n: number) => posedTraces('jonction', upTo(n), MISSIONS).length;
    expect([0, 1, 2, 3, 4, 5].map(count)).toEqual([0, 1, 2, 3, 4, 5]);
    for (const m of MISSIONS) expect(JONCTION.traces[m], m).toBeDefined();
    const c = PLACE.center;
    for (const m of MISSIONS) {
      const at = JONCTION.traces[m].at;
      const p = { x: c.x + at.x, z: c.z + at.z };
      for (const line of [RAILS_4E.branch, ...RAILS_4E.sidings]) expect(distanceToPolyline(p, line), m).toBeGreaterThan(RAILS_LOOK_4E.gauge);
    }
  });

  it('trois voies toujours, d’un seul tenant : la plaque sur la première voie, ses rails dans l’axe une fois remise', () => {
    const L = JONCTION_LAYOUT;
    // La plaque est sur la première voie, à quelques pas de l'aiguillage.
    const d = Math.hypot(L.plaque.x - L.switchAt.x, L.plaque.z - L.switchAt.z);
    expect(d).toBeGreaterThan(3);
    expect(d).toBeLessThan(8);
    expect(distanceToPolyline({ x: L.plaque.x + PLACE.center.x, z: L.plaque.z + PLACE.center.z }, RAILS_4E.sidings[0])).toBeLessThan(1e-6);
    // Ni la plaque, ni le poste, ni les leviers sur le chemin.
    const door = nodes.get('jonction')!;
    const way = nodes.get('cot-2')!;
    const w = (p: { x: number; z: number }) => ({ x: p.x + PLACE.center.x, z: p.z + PLACE.center.z });
    expect(distanceToPolyline(w(L.plaque), [door, way])).toBeGreaterThan(JONCTION_TRACK_4E.plaque.pit + 0.9);
    expect(distanceToPolyline(w(L.posteAt), [door, way])).toBeGreaterThan(3);
  });

  it('rien du lieu, en ruine comme restauré, sur le chemin de marche, de part et d’autre de la porte (à hauteur de Kéo)', () => {
    const door = nodes.get('jonction')!;
    const ways = ['rav-2', 'cot-2'].map((id) => nodes.get(id)!);
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
        // Les rails du lieu croisent le chemin comme ceux du lot 1 (au ras du ballast) : seul ce qui dépasse compte.
        const low = y - ground(x, z) < 1.8 && Math.max(f.positions[i + 1], f.positions[i + 4], f.positions[i + 7]) + (local ? h0 : 0) - ground(x, z) > 0.4;
        const onWay = ways.some((wy) => distanceToPolyline({ x, z }, [door, wy]) < 0.9);
        expect(low && onWay, `${x.toFixed(1)}, ${z.toFixed(1)}`).toBe(false);
      }
    }
  });
});

describe('Le bilan de la Jonction', () => {
  it('nomme la partie par son étape, puis dit la phrase du lieu ; jamais un nom du contenu', () => {
    const island = PLACE.island as BiomeId;
    const words = stagePoseWords(island, PLACE);
    const parties = partiesDe(island);
    expect(parties).toHaveLength(5);
    const said = [0, 1, 2, 3, 4].map((k) => phraseDeLaPose({ posees: [parties[k]], plansFinis: [] }, words));
    for (const s of said) expect(s).not.toMatch(/cabine d’aiguillage|Gardien|benne/i);
    // Jamais le nom d'un plan de l'île : ni sa réplique de fin (`done`), ni un nom de son titre (`name`), dans le bilan,
    // les phrases de pose et la phrase de fin (relecture du contenu des Coteaux, retouche 1).
    const texts = [...said, ...(scenetteOf(PLACE.id).words?.pose ?? []), scenetteOf(PLACE.id).words?.end ?? ''];
    for (const plan of plansFor(island))
      for (const text of texts) {
        expect(text).not.toContain(plan.done);
        // « Les abords » nomment aussi la troisième partie de chaque lieu, dans son bilan : le mot du jeu, pas celui du plan.
        for (const noun of planNouns(plan.name, said.includes(text) ? ['abords'] : [])) expect(text, noun).not.toMatch(wordRe(noun));
      }
    expect(scenetteOf('jonction').words?.pose).toEqual(['Le poste est rebâti.', 'Les leviers sont en place.', 'La plaque tournante est réparée.', 'Le poste est couvert.', 'Les voies de service sont refaites.']);
    expect(scenetteOf('jonction').words?.end).toBe('Ici, chaque voie de service partait de la voie principale.');
  });
});

describe('La scénette de la Jonction', () => {
  it('le cantonnier, sans prénom, et sa phrase de métier', () => {
    const s = scenetteOf('jonction');
    expect(s.role).toBe('Le cantonnier');
    expect(s.greeting).toBe('Le cantonnier entretient la voie.');
  });

  it('la caméra arrive par la porte, basse, à 210° (à 45° au moins du soleil) : l’aiguillage au premier plan, au milieu', () => {
    const door = nodes.get('jonction')!;
    const yaw = doorViewOf('jonction');
    const look = { x: -Math.sin(yaw), z: -Math.cos(yaw) };
    const cap = ((Math.atan2(look.x, -look.z) * 180) / Math.PI + 360) % 360;
    expect(cap).toBeCloseTo(210, 6);
    expect(Math.abs(cap - 153)).toBeGreaterThanOrEqual(45);
    const angle = (p: { x: number; z: number }) => {
      const d = { x: p.x - door.x, z: p.z - door.z };
      return (Math.atan2(look.x * d.z - look.z * d.x, look.x * d.x + look.z * d.z) * 180) / Math.PI;
    };
    const L = JONCTION_LAYOUT;
    expect(Math.abs(angle({ x: PLACE.center.x + L.switchAt.x, z: PLACE.center.z + L.switchAt.z }))).toBeLessThan(10);
    expect(Math.abs(angle({ x: PLACE.center.x + L.posteAt.x, z: PLACE.center.z + L.posteAt.z }))).toBeLessThan(30);
    const frame = doorFrameOf('jonction')!;
    expect(frame.height).toBeLessThan(0);
    expect(frame.back).toBeLessThanOrEqual(1.6);
  });

  it('elle se joue vers le bout des voies de service, hors du chemin et des voies, loin de la porte ; ses abords sont enregistrés', () => {
    const s = JONCTION_LAYOUT.scene;
    const door = nodes.get('jonction')!;
    const way = nodes.get('cot-2')!;
    for (const [sx, sz] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ]) {
      const p = { x: PLACE.center.x + s.dx + sx * s.half[0], z: PLACE.center.z + s.dz + sz * s.half[1] };
      expect(distanceToPolyline(p, [door, way])).toBeGreaterThan(1.5);
      for (const line of RAILS_4E.sidings) expect(distanceToPolyline(p, line)).toBeGreaterThan(RAILS_LOOK_4E.ballast);
    }
    for (const who of [scenetteKeo('jonction').at, scenetteHabitant('jonction')]) for (const line of RAILS_4E.sidings) expect(distanceToPolyline(who, line)).toBeGreaterThan(RAILS_LOOK_4E.ballast + 0.4);
    expect(distance({ x: PLACE.center.x + s.dx, z: PLACE.center.z + s.dz }, door)).toBeGreaterThan(3);
    expect(SURROUNDINGS.jonction).toBeDefined();
    const b = new FacetBuilder();
    SURROUNDINGS.jonction!(b, { x: PLACE.center.x + s.dx, y: 0, z: PLACE.center.z + s.dz }, { posed: true } as never);
    expect(b.build().triangles).toBeLessThanOrEqual(SURROUNDINGS_MAX);
    expect(JONCTION_SURROUNDINGS.rocks.length).toBeGreaterThan(0);
  });
});
