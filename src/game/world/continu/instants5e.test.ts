// Les Instants (GD-22, lot 8) : la chaussée par parties (2 + 2 + 1), une lanterne allumée dans la ruine, une trace par
// partie, la brume au-delà de la dernière pierre, la scénette sur le débarcadère, les abords, le plafond de 1 600
// triangles et la clairière de la forêt le long de l'axe. Sans Three.js.
import { describe, expect, it } from 'vitest';
import type { BiomeId } from '../../biomes';
import { partShapes, stagePoseWords } from '../../three/archipeo/constructionParts';
import { phraseDeLaPose } from '../../poseWords';
import { partiesDe } from '../parts';
import { plansFor } from '../plans';
import { PLACE_TRIANGLES_MAX_5E, openWorldCost5e } from './budget';
import { posedTraces, traceStagePosed, WHOLE, type PartShape, type Stage } from './construction';
import { creuxTriangles } from './creux5e';
import type { Facets } from './facets';
import { failleTriangles } from './faille5e';
import { distance, distanceToPolyline, linearRgb } from './geometry';
import { hasHabitantModel } from './habitants';
import { hutteFacets } from './hutte5e';
import { DECK_TOP, INSTANTS, INSTANTS_DECK, INSTANTS_MIST, INSTANTS_STONES, INSTANTS_TOP, LAST_STONE_S, MIST_NEAR_S, onCauseway } from './instants5e';
import { hasScenette, planFor } from './levelPlan';
import { riftMistSpots } from './mist5e';
import { NETWORK_5E } from './paths5e';
import { COLORS_5E, TERRAIN_5E } from './plan5e';
import { drawPieces, placePieces } from './places';
import { doorViewOf } from './northShore';
import { placeItems } from './questions';
import { answerObjects, placeTrace, sceneSpot } from './questionScene';
import { scenetteHabitant, scenetteKeo, scenetteOf, scenetteSurroundings } from './scenette';
import { SURROUNDINGS_MAX } from './surroundings';
import { INSTANTS_AXIS, buildHeightField5e, groundOn5e, obstaclesIn5e } from './terrain5e';

const PLAN = planFor('5e');
const PLACE = PLAN.places.find((p) => p.id === 'instants')!;
const ISLAND = PLACE.island as BiomeId;
const MISSIONS = ['past-tenses', 'future-tense', 'tense-recognition', 'tense-choice', 'sentence-grammar'] as const;
const SHAPES = partShapes(ISLAND);

/** Les `n` premières parties posées (0 : la ruine, 5 : tout). */
const upTo = (n: number): PartShape[] => SHAPES.slice(0, n);
const takes = (parts: readonly PartShape[], stage: Stage, row: number) => parts.some((part) => part.some((s) => s.stage === stage && row >= s.from - 1e-9 && row < s.to - 1e-9));

/** Ce que le lieu montre, ses `n` premières parties posées : la ruine qui reste, les rangées posées. */
function shown(n: number): Facets {
  const parts = upTo(n);
  return drawPieces('instants', (p) => (p.stage === 'ruine' ? !p.until || !takes(parts, p.until.stage, p.until.row) : takes(parts, p.stage, p.row)));
}

/** Les sommets d'une couleur exacte (la lanterne d'ocre, que la vue dessine sans ombre). */
function countColor(f: Facets, color: number): number {
  const [r, g, b] = linearRgb(color);
  let n = 0;
  for (let i = 0; i < f.colors.length; i += 3) if (Math.abs(f.colors[i] - r) < 1e-4 && Math.abs(f.colors[i + 1] - g) < 1e-4 && Math.abs(f.colors[i + 2] - b) < 1e-4) n++;
  return n;
}

describe('Les Instants, lieu complet', () => {
  it('ses cinq missions se jouent dans sa scénette, en cinq parties : deux au corps, deux au haut, une aux abords', () => {
    expect(PLACE.scenes).toEqual([...MISSIONS]);
    expect(hasScenette('instants')).toBe(true);
    expect(SHAPES.map((p) => p.map((s) => [s.stage, s.from, s.to]))).toEqual([[[0, 0, 0.5]], [[0, 0.5, 1]], [[1, 0, 0.5]], [[1, 0.5, 1]], [[2, 0, 1]]]);
  });

  it('chaque partie pose quelque chose ; la ruine part avec la rangée qui la relève', () => {
    const pieces = placePieces('instants');
    for (const [stage, row] of [
      [0, 0],
      [0, 0.5],
      [1, 0],
      [1, 0.5],
      [2, 0],
    ] as const)
      expect(pieces.some((p) => p.stage === stage && p.row === row), `${stage}/${row}`).toBe(true);
    for (let n = 1; n <= 5; n++) expect(shown(n).triangles, String(n)).not.toBe(shown(n - 1).triangles);
    const fallen = pieces.filter((p) => p.stage === 'ruine' && p.until).map((p) => `${p.until!.stage}/${p.until!.row}`);
    // L'est (trois pierres, ses dalles, les outils à plat), l'ouest (six pierres et ses dalles), le linteau tombé, l'abri.
    expect(new Set(fallen)).toEqual(new Set(['0/0', '0/0.5', '1/0', '2/0']));
  });

  it('coûte au plus le plafond d’un lieu du 5e à son état le plus chargé, avec ses traces et sa brume', () => {
    const mist = INSTANTS_MIST.length * 2 * 8;
    let worst = 0;
    for (let n = 0; n <= 5; n++) {
      const traces = placeTrace('instants', posedTraces('instants', upTo(n), [...MISSIONS])).triangles;
      worst = Math.max(worst, shown(n).triangles + traces + mist);
    }
    expect(worst).toBeLessThanOrEqual(PLACE_TRIANGLES_MAX_5E);
    // Le plus chargé est le lieu restauré : le budget le compte ainsi (`modelOfPlace` et toutes les traces).
    expect(shown(5).triangles + placeTrace('instants', [...MISSIONS]).triangles + mist).toBe(worst);
  });

  it('une seule lanterne allumée dans la ruine, celle de l’abri ; le haut 2 sur 2 allume celle de l’arche', () => {
    // Une lanterne : sa vitre, un pavé (dix triangles, trente sommets).
    const lit = (n: number) => countColor(shown(n), COLORS_5E.lantern);
    expect(lit(0)).toBe(30);
    expect(lit(3)).toBe(30);
    expect(lit(4)).toBe(60);
    expect(lit(5)).toBe(60);
  });

  it('des blocs épais, jamais des stèles : l’épaisseur près des quatre cinquièmes de la largeur, les hautes trois fois plus hautes que larges', () => {
    const all = [...INSTANTS_STONES.file, ...INSTANTS_STONES.ghosts, INSTANTS_STONES.arch];
    for (const st of all) expect(st.d / (2 * st.w), `${st.h}`).toBeGreaterThanOrEqual(0.75);
    const tall = all.filter((st) => st.h > 2.2);
    const low = all.filter((st) => st.h <= 2.2);
    expect(tall.length).toBeGreaterThan(5);
    for (const st of tall) expect(st.h / (2 * st.w), `${st.h}`).toBeGreaterThanOrEqual(3);
    // L'alternance se lit : la plus basse des hautes dépasse d'un tiers au moins la plus haute des basses.
    expect(Math.min(...tall.map((st) => st.h))).toBeGreaterThan(1.33 * Math.max(...low.map((st) => st.h)));
  });

  it('les arches restent basses, sous la canopée', () => {
    expect(INSTANTS_TOP).toBeLessThan(4);
  });
});

describe('Les traces des Instants : une par partie', () => {
  it('la trace d’une mission se montre quand sa mission est réussie et que sa partie est posée', () => {
    for (let n = 0; n <= 5; n++) expect(posedTraces('instants', upTo(n), [...MISSIONS]), String(n)).toEqual(MISSIONS.slice(0, n));
    expect(posedTraces('instants', [WHOLE], [...MISSIONS])).toEqual([...MISSIONS]);
    // Réussie, sa partie attend : rien ; posée, pas réussie : rien.
    expect(posedTraces('instants', upTo(1), ['future-tense'])).toEqual([]);
    expect(posedTraces('instants', [WHOLE], [])).toEqual([]);
    expect(traceStagePosed('instants', upTo(2))).toBe(true);
    expect(traceStagePosed('instants', upTo(0))).toBe(false);
  });

  it('chaque trace se dessine seule, rien sans réussite', () => {
    for (const m of MISSIONS) expect(placeTrace('instants', [m]).triangles, m).toBeGreaterThan(0);
    expect(placeTrace('instants', []).triangles).toBe(0);
  });
});

describe('La brume des Instants', () => {
  it('commence au-delà de la dernière pierre : la chaussée entière reste lisible', () => {
    expect(MIST_NEAR_S).toBeGreaterThan(LAST_STONE_S + 3);
    const last = onCauseway(LAST_STONE_S, 0);
    const lastWorld = { x: PLACE.center.x + last.x, z: PLACE.center.z + last.z };
    for (const spot of INSTANTS_MIST) expect(distance(spot.at, lastWorld) - spot.radius, `${spot.at.x}`).toBeGreaterThan(3);
    // Ses nappes sont celles des failles (un seul maillage, un seul appel).
    const all = riftMistSpots();
    for (const spot of INSTANTS_MIST) expect(all).toContainEqual(spot);
  });
});

describe('La scénette des Instants', () => {
  it('le tailleur de pierre, Kéo à plus de deux unités de lui, sur les planches du débarcadère ; les réponses aux galets', () => {
    expect(scenetteOf('instants').role).toBe('Le tailleur de pierre');
    const keo = scenetteKeo('instants').at;
    const h = scenetteHabitant('instants');
    expect(h.x - keo.x).toBeGreaterThan(2);
    expect(Math.abs(h.y - keo.y)).toBeLessThan(1e-6);
    const s = sceneSpot('instants');
    expect(s.z - PLACE.center.z).toBeCloseTo(INSTANTS_DECK.spot.dz, 6);
    // Le sol de la scène est le dessus des planches.
    expect(keo.y).toBeCloseTo(INSTANTS_DECK.heightAtCenter + DECK_TOP, 2);
    const items = placeItems('instants', 'french-5e-conjugation-past-tenses-1', [{ key: 'a', choices: ['chanta', 'chantait'], answer: 'chanta' }]);
    expect(items[0].placeScene).toEqual({ kind: 'rest' });
    expect(INSTANTS.answer).toBeDefined();
  });

  it('un galet choisi se soulève d’un cran : sa forme ne change pas, sa place si', () => {
    const at = [{ x: 0, y: 0, z: 0 }];
    const still = answerObjects('instants', at, 1, { picked: [] });
    const picked = answerObjects('instants', at, 1, { picked: [0] });
    expect(picked.triangles).toBe(still.triangles);
    const top = (f: Facets) => Math.max(...f.positions.filter((_, i) => i % 3 === 1));
    expect(top(picked) - top(still)).toBeGreaterThan(0.15);
  });

  it('le tailleur se montre en modèle 3D', () => {
    expect(hasHabitantModel('instants')).toBe(true);
  });

  it('ses abords tiennent sous le plafond commun, dans chaque état', () => {
    for (const posed of [false, true])
      for (const open of [false, true]) {
        const f = scenetteSurroundings('instants', open, posed);
        expect(f.triangles).toBeGreaterThan(0);
        expect(f.triangles).toBeLessThanOrEqual(SURROUNDINGS_MAX);
      }
  });
});

describe('Le bilan des Instants nomme la partie par son étape', () => {
  it('« Partie posée : le corps des Instants, 1 sur 2. », jamais le nom d’un plan', () => {
    const parties = partiesDe(ISLAND);
    expect(parties).toHaveLength(5);
    const said = phraseDeLaPose({ posees: [parties[0]], plansFinis: [] }, stagePoseWords(ISLAND, PLACE));
    expect(said).toBe('Partie posée : le corps des Instants, 1 sur 2.');
    for (const plan of plansFor(ISLAND)) expect(said).not.toContain(plan.done);
  });
});

describe('« Y aller » aux Instants', () => {
  it('la caméra regarde le long de la chaussée, depuis la porte : elle part du bas de l’image et file droit', () => {
    const yaw = doorViewOf('instants');
    // La caméra regarde vers −(sin, cos) de son cap (camera.ts, `followPose`).
    const look = { x: -Math.sin(yaw), z: -Math.cos(yaw) };
    const a = onCauseway(0, 0);
    const b = onCauseway(LAST_STONE_S, 0);
    const len = distance(a, b);
    expect(look.x).toBeCloseTo((b.x - a.x) / len, 6);
    expect(look.z).toBeCloseTo((b.z - a.z) / len, 6);
    // La porte (où Kéo arrive) est sur l'axe, à moins d'une demi-unité.
    const node = NETWORK_5E.pathNode(PLACE.door).at;
    const door = { x: node.x - PLACE.center.x, z: node.z - PLACE.center.z };
    const across = (door.x - a.x) * -look.z + (door.z - a.z) * look.x;
    expect(Math.abs(across)).toBeLessThan(0.5);
    // Les autres lieux du 5e gardent l'arrivée vers le nord (l'Auberge y revient à la retouche 1 du lot 12), sauf l'Oracle,
    // tourné de 0,2 vers sa bouche (lot 13b, ./oracle5e.test.ts), et le Sémaphore, un peu à gauche (retouche 1 du lot 14,
    // ./semaphore5e.test.ts).
    for (const p of PLAN.places) if (!['instants', 'radeaux', 'oracle', 'semaphore'].includes(p.id)) expect(doorViewOf(p.id), p.id).toBe(0);
  });
});

describe('La forêt s’écarte de la chaussée', () => {
  it('l’axe gardé par la forêt est celui de la chaussée, et aucun arbre ne se tient sur elle', () => {
    const [a, b] = INSTANTS_AXIS;
    const from = onCauseway(-6, 0);
    const to = onCauseway(31, 0);
    expect(a[0]).toBeCloseTo(from.x, 6);
    expect(a[1]).toBeCloseTo(from.z, 6);
    expect(b[0]).toBeCloseTo(to.x, 6);
    expect(b[1]).toBeCloseTo(to.z, 6);
    const line = [onCauseway(-4, 0), onCauseway(LAST_STONE_S + 1, 0)].map((p) => ({ x: PLACE.center.x + p.x, z: PLACE.center.z + p.z }));
    const tile = TERRAIN_5E.step * TERRAIN_5E.tileCells;
    const tx = Math.floor((PLACE.center.x - TERRAIN_5E.minX) / tile);
    const tz = Math.floor((PLACE.center.z - TERRAIN_5E.minZ) / tile);
    for (let i = tx - 2; i <= tx + 2; i++)
      for (let k = tz - 2; k <= tz + 2; k++) {
        if (i < 0 || k < 0 || i >= TERRAIN_5E.tilesX || k >= TERRAIN_5E.tilesZ) continue;
        for (const o of obstaclesIn5e(i, k)) expect(distanceToPolyline(o, line) - o.r, `${o.x},${o.z}`).toBeGreaterThan(3);
      }
  });
});

/** La Hutte et sa sente tracée (./hutte5e.test.ts : 175 triangles sans la sente, moins de 120 pour elle). */
const HUTTE_MAX = 175 + 120;

// Le plafond hors scénette, au départ et sur la Carte, lieu par lieu : ./radeaux5e.test.ts.
describe('Le budget du 5e, avec la Hutte (plafond du lot 8)', () => {
  it('la Hutte, sa sente comprise, compte au poste des Détours, sans appel', () => {
    const field = buildHeightField5e();
    const hutte = hutteFacets(true, (x, z) => groundOn5e(field, x, z)).triangles;
    expect(hutte).toBeLessThanOrEqual(HUTTE_MAX);
    const detours = openWorldCost5e().find((c) => c.poste === 'détours')!;
    expect(detours.calls).toBe(0);
    // Le poste compte le Creux, la Hutte et la Faille (lot 11), leurs sentes tracées, et rien d'autre.
    expect(detours.triangles).toBe(creuxTriangles().withSente + hutte + failleTriangles().withSente);
  });

});
