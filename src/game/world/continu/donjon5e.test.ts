// Le Donjon (GD-22, lot 13a) : le lieu par parties (le corps, le haut, les abords), la ruine qui part avec l'étape qui
// la remplace, une seule lanterne allumée dans la ruine et trois au plus, une trace par mission avec son étape, le signe
// de l'absence (le trou du pilier et ses quatre goujons), la tour plus haute que tout le 5e sans passer 27, rien de la
// ruine sur le chemin de marche, la scénette sur la cour, la maçonne en modèle 3D, ses abords dans le cadre, les claveaux
// des réponses, les plafonds de 1 600 et 1 200 triangles et le budget du 5e. Sans Three.js.
import { describe, expect, it } from 'vitest';
import type { BiomeId } from '../../biomes';
import { partShapes, stagePoseWords } from '../../three/archipeo/constructionParts';
import { phraseDeLaPose } from '../../poseWords';
import { partiesDe } from '../parts';
import { plansFor } from '../plans';
import { CAUSEWAYS_ADDED_5E, PLACE_TRIANGLES_MAX_5E, openWorldCost5e } from './budget';
import { screenOf } from './camera';
import { posedTraces, traceStagePosed, WHOLE, type PartShape, type Stage } from './construction';
import { DONJON, DONJON_LAYOUT } from './donjon5e';
import { DONJON_SURROUNDINGS } from './donjonSurroundings';
import type { Facets } from './facets';
import { linearRgb, type Vec2 } from './geometry';
import { hasHabitantModel } from './habitants';
import { hasScenette, planFor } from './levelPlan';
import { doorViewOf } from './northShore';
import { BUILT_PLACES_5E, COLORS_5E, PATH_NODES_5E } from './plan5e';
import { drawPieces, placePieces, ruinOf } from './places';
import { placeItems } from './questions';
import { answerObjects, placeTrace, questionLayout, sceneSpot } from './questionScene';
import { scenetteHabitant, scenetteKeo, scenetteLayout, scenetteOf, scenettePose, scenetteSurroundings } from './scenette';
import { SURROUNDINGS_MAX } from './surroundings';

const PLAN = planFor('5e');
const PLACE = PLAN.places.find((p) => p.id === 'donjon')!;
const ISLAND = PLACE.island as BiomeId;
const MISSIONS = [...BUILT_PLACES_5E.donjon];
const SHAPES = partShapes(ISLAND);

/** La ruine du Donjon au plus (intention du directeur artistique, « Le budget »). */
const DONJON_RUIN_MAX = 1_200;

/** Les `n` premières parties posées (0 : la ruine, 3 : tout). */
const upTo = (n: number): PartShape[] => SHAPES.slice(0, n);
const takes = (parts: readonly PartShape[], stage: Stage, row: number) => parts.some((part) => part.some((s) => s.stage === stage && row >= s.from - 1e-9 && row < s.to - 1e-9));

/** Ce que le lieu montre, ses `n` premières parties posées : la ruine qui reste, les étapes posées. */
function shown(n: number): Facets {
  const parts = upTo(n);
  return drawPieces('donjon', (p) => (p.stage === 'ruine' ? !p.until || !takes(parts, p.until.stage, p.until.row) : takes(parts, p.stage, p.row)));
}

/** Les sommets d'une couleur exacte. */
function countColor(f: Facets, color: number): number {
  const [r, g, b] = linearRgb(color);
  let n = 0;
  for (let i = 0; i < f.colors.length; i += 3) if (Math.abs(f.colors[i] - r) < 1e-4 && Math.abs(f.colors[i + 1] - g) < 1e-4 && Math.abs(f.colors[i + 2] - b) < 1e-4) n++;
  return n;
}

/** Le plus haut d'un dessin, depuis le sol du centre du lieu. */
const topOf = (f: Facets): number => Math.max(...f.positions.filter((_, i) => i % 3 === 1));

/** La distance d'un point au segment [a, b]. */
function toSegment(p: Vec2, a: Vec2, b: Vec2): number {
  const dx = b.x - a.x,
    dz = b.z - a.z;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / (dx * dx + dz * dz)));
  return Math.hypot(p.x - a.x - dx * t, p.z - a.z - dz * t);
}

describe('Le Donjon, lieu complet', () => {
  it('ses trois missions se jouent dans sa scénette, en trois parties : le corps, le haut, les abords', () => {
    expect(PLACE.scenes).toEqual(MISSIONS);
    expect(MISSIONS).toEqual(['christendoms-islam', 'feudal-west', 'new-worlds']);
    expect(hasScenette('donjon')).toBe(true);
    expect(SHAPES.map((p) => p.map((s) => [s.stage, s.from, s.to]))).toEqual([[[0, 0, 1]], [[1, 0, 1]], [[2, 0, 1]]]);
  });

  it('chaque partie pose quelque chose ; la ruine part avec l’étape qui la remplace', () => {
    const pieces = placePieces('donjon');
    for (let n = 1; n <= 3; n++) expect(shown(n).triangles, String(n)).not.toBe(shown(n - 1).triangles);
    const fallen = pieces.filter((p) => p.stage === 'ruine' && p.until).map((p) => `${p.until!.stage}/${p.until!.row}`);
    expect(new Set(fallen)).toEqual(new Set(['0/0', '1/0', '2/0']));
  });

  it('coûte au plus 1 600 triangles à son état le plus chargé, traces comprises ; la ruine, 1 200 au plus', () => {
    let worst = 0;
    for (let n = 0; n <= 3; n++) {
      const traces = placeTrace('donjon', posedTraces('donjon', upTo(n), MISSIONS)).triangles;
      worst = Math.max(worst, shown(n).triangles + traces);
    }
    expect(worst).toBeLessThanOrEqual(PLACE_TRIANGLES_MAX_5E);
    expect(shown(0).triangles).toBeLessThanOrEqual(DONJON_RUIN_MAX);
    // Le plus chargé est le lieu restauré, toutes les traces posées : le budget le compte ainsi.
    expect(shown(3).triangles + placeTrace('donjon', MISSIONS).triangles).toBe(worst);
  });

  it('une seule lanterne allumée dans la ruine, celle de la maçonne ; le haut allume celle du guet, les abords celle de la cour', () => {
    // Une lanterne : sa vitre, un pavé (dix triangles, trente sommets).
    const lit = (n: number) => countColor(shown(n), COLORS_5E.lantern);
    expect(lit(0)).toBe(30);
    expect(lit(1)).toBe(30);
    expect(lit(2)).toBe(60);
    expect(lit(3)).toBe(90);
  });

  it('le signe de l’absence ne change jamais : le trou du pilier, ses quatre goujons en diagonale, à hauteur d’enfant', () => {
    // Parmi ce qui reste toujours, seul le trou du pilier a le brun très sombre : un aplat à huit pans, six triangles.
    expect(countColor(ruinOf('donjon'), 0x3a312c)).toBe(18);
    const Q = DONJON_LAYOUT.pillar;
    expect(Q.hole).toBeGreaterThan(0.8);
    expect(Q.hole).toBeLessThan(1.2);
    // Les goujons hors du trou, dans la face du pilier.
    expect(Q.stud * 0.75 * Math.SQRT2 - Q.size).toBeGreaterThan(Q.r);
    expect(Q.stud * 0.75 + Q.size / 2).toBeLessThan(Q.w / 2);
    expect(Q.hole + Q.stud * 0.75 + Q.size).toBeLessThan(Q.h);
  });

  it('la tour, plus haute que tout le 5e, reste sous 27 : son sommet entre 18 et 27 au-dessus de la cour', () => {
    const above = topOf(shown(3)) - DONJON_LAYOUT.courTop;
    expect(above).toBeGreaterThan(18);
    expect(above).toBeLessThan(27);
    // La ruine, coupée en biais, plus basse : le haut s'est écroulé.
    expect(topOf(shown(0))).toBeLessThan(topOf(shown(3)) - 3);
  });

  it('rien de la ruine sur le chemin de marche, d’`aig-2` à la porte, hors des dalles de la cour', () => {
    const c = PLACE.center;
    const node = PATH_NODES_5E.find((n) => n.id === 'aig-2')!.at;
    const from = { x: node.x - c.x, z: node.z - c.z };
    const door = DONJON_LAYOUT.door;
    const ruin = drawPieces('donjon', (p) => p.stage === 'ruine');
    for (let i = 0; i < ruin.positions.length; i += 3) {
      const p = { x: ruin.positions[i], z: ruin.positions[i + 2] };
      const y = ruin.positions[i + 1] - DONJON_LAYOUT.courTop;
      // Les dalles de la cour, à peine soulevées, se marchent ; ce qui passe haut ne gêne pas.
      if (y < 0.2 || y > 2) continue;
      expect(toSegment(p, from, door), `${p.x.toFixed(2)} ${p.z.toFixed(2)}`).toBeGreaterThan(0.9);
    }
  });
});

describe('Les traces du Donjon : une par mission, avec son étape', () => {
  it('l’auge au corps, la brouette au haut, la pile de dalles aux abords', () => {
    expect(Object.keys(DONJON.traces).sort()).toEqual([...MISSIONS].sort());
    expect(MISSIONS.map((m) => [DONJON.traces[m].stage, DONJON.traces[m].row ?? 0])).toEqual([
      [0, 0],
      [1, 0],
      [2, 0],
    ]);
  });

  it('la trace d’une mission se montre quand sa mission est réussie et que son étape est posée', () => {
    for (let n = 0; n <= 3; n++) expect(posedTraces('donjon', upTo(n), MISSIONS), String(n)).toEqual(MISSIONS.slice(0, n));
    expect(posedTraces('donjon', [WHOLE], MISSIONS)).toEqual(MISSIONS);
    expect(posedTraces('donjon', upTo(1), ['feudal-west'])).toEqual([]);
    expect(traceStagePosed('donjon', upTo(1))).toBe(true);
    expect(traceStagePosed('donjon', upTo(0))).toBe(false);
  });

  it('chaque trace se dessine seule', () => {
    for (const m of MISSIONS) expect(placeTrace('donjon', [m]).triangles, m).toBeGreaterThan(0);
    expect(placeTrace('donjon', []).triangles).toBe(0);
  });
});

describe('La scénette du Donjon', () => {
  it('la maçonne, sans prénom, à droite ; Kéo à gauche, à plus de deux unités d’elle, sur la cour', () => {
    expect(scenetteOf('donjon').role).toBe('La maçonne');
    expect(scenetteOf('donjon').greeting).toBe('La maçonne bâtit des murs de pierre.');
    const keo = scenetteKeo('donjon').at;
    const h = scenetteHabitant('donjon');
    expect(h.x - keo.x).toBeGreaterThan(2);
    expect(Math.abs(h.y - keo.y)).toBeLessThan(1e-6);
    const s = sceneSpot('donjon');
    expect(s.z - PLACE.center.z).toBeCloseTo(DONJON_LAYOUT.scene.dz, 6);
    // Le sol de la scène est le dessus de la cour.
    expect(keo.y).toBeCloseTo(DONJON_LAYOUT.heightAtCenter + DONJON_LAYOUT.courTop, 2);
    const items = placeItems('donjon', 'history-5e-middle-ages-christendoms-islam-1', [{ key: 'a', choices: ['oui', 'non'], answer: 'oui' }]);
    expect(items[0].placeScene).toEqual({ kind: 'rest' });
    expect(DONJON.answer).toBeDefined();
  });

  it('ses abords, le rocher à l’est et le buisson à l’ouest, dans le cadre à 1024 × 768', () => {
    const [w, h] = [1024, 768];
    const stage = scenetteLayout({ count: 3 }, w, h, questionLayout({ count: 3 }, w, h)).scenette!.stage;
    const { pose, shift } = scenettePose('donjon', stage, w, h);
    const floor = sceneSpot('donjon');
    const { rock, bush } = DONJON_SURROUNDINGS;
    for (const [dx, dz] of [
      [rock.dx - rock.r, rock.dz],
      [rock.dx + rock.r, rock.dz],
      [bush.dx - bush.s, bush.dz],
      [bush.dx + bush.s, bush.dz],
    ]) {
      const p = screenOf(pose, { x: floor.x + dx, y: floor.y + 0.3, z: floor.z + dz }, w, h);
      expect(p.x - shift.x, `${dx} ${dz}`).toBeGreaterThan(stage.left);
      expect(p.x - shift.x, `${dx} ${dz}`).toBeLessThan(stage.right);
    }
  });

  it('un claveau choisi se soulève d’un cran : sa forme ne change pas, sa place si', () => {
    const at = [{ x: 0, y: 0, z: 0 }];
    const still = answerObjects('donjon', at, 1, { picked: [] });
    const picked = answerObjects('donjon', at, 1, { picked: [0] });
    expect(picked.triangles).toBe(still.triangles);
    expect(topOf(picked) - topOf(still)).toBeGreaterThan(0.15);
  });

  it('la maçonne se montre en modèle 3D', () => {
    expect(hasHabitantModel('donjon')).toBe(true);
  });

  it('ses abords tiennent sous le plafond commun, dans chaque état', () => {
    for (const posed of [false, true])
      for (const open of [false, true]) {
        const f = scenetteSurroundings('donjon', open, posed);
        expect(f.triangles).toBeGreaterThan(0);
        expect(f.triangles).toBeLessThanOrEqual(SURROUNDINGS_MAX);
      }
  });

  it('ne dit aucun nom du contenu (ni château, ni seigneur, ni croisade)', () => {
    const said = `${scenetteOf('donjon').role} ${scenetteOf('donjon').greeting ?? ''}`;
    expect(said).not.toMatch(/château|seigneur|croisade|chevalier|Passeurs/i);
  });
});

describe('Le bilan du Donjon nomme la partie par son étape', () => {
  it('« Partie posée : le corps du Donjon. », puis le haut et les abords ; jamais le nom d’un plan', () => {
    const parties = partiesDe(ISLAND);
    expect(parties).toHaveLength(3);
    const words = stagePoseWords(ISLAND, PLACE);
    const said = (k: number) => phraseDeLaPose({ posees: [parties[k]], plansFinis: [] }, words);
    expect(said(0)).toMatch(/^Partie posée : le corps du Donjon/);
    for (let k = 0; k < 3; k++) for (const plan of plansFor(ISLAND)) expect(said(k)).not.toContain(plan.done);
  });

  it('« Y aller » arrive au cap nord, de face', () => {
    expect(doorViewOf('donjon')).toBe(0);
  });
});

/**
 * Le budget du 5e au lot 12, avant les chaussées et le Donjon (l'Auberge et sa retouche 2 comprises : `npm run
 * rendu:budget -- --archipel 6e,5e` sur `preview`, 20 octobre 2026), scénette ouverte.
 */
const LOT12_OPEN_5E = { triangles: 101_415, calls: 19 } as const;

describe('Le budget du 5e, avec les chaussées et le Donjon (plafonds du lot 13a)', () => {
  it('scénette ouverte : le lot 12, les chaussées et un lieu de plus au plus, sans appel de plus ; la maçonne dans les deux appels de la scénette', () => {
    const cost = openWorldCost5e();
    const triangles = cost.reduce((a, p) => a + p.triangles, 0);
    const calls = cost.reduce((a, p) => a + p.calls, 0);
    expect(triangles).toBeLessThanOrEqual(LOT12_OPEN_5E.triangles + CAUSEWAYS_ADDED_5E + PLACE_TRIANGLES_MAX_5E);
    expect(calls).toBeLessThanOrEqual(LOT12_OPEN_5E.calls);
    expect(cost.find((c) => c.poste === 'scénette')!.calls).toBe(2);
  });
});
