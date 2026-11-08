// Le Sémaphore (GD-22, lot 14) : le lieu par parties (3 + 1 + 1), une seule lanterne allumée dans la ruine et quatre au
// plus, trois sous 4 et la lanterne de tête du mât, le feu du 5e (GD-27, lot 3 bis ; aucune autre lumière au-dessus de la
// corniche), une trace par mission avec sa partie, le signe du pivot
// pris, la tour à six pans au sommet plat, les bras attachés au mât par le bout, relevés et parallèles, le mât qui dépasse,
// la corne tournée vers l'ouest, rien sur le chemin de marche ni sur la chaussée, le seuil où la chaussée arrive, la
// scénette sur la cour, le cap de « Y aller » un peu à gauche du nord et le regard d'arrivée qui cadre le mât et ses bras,
// les plafonds de 1 600 et 1 000 triangles, le budget du 5e (la chaîne des lots : ./auberge5e.test.ts,
// ./donjon5e.test.ts, puis ici). Sans Three.js.
import { describe, expect, it } from 'vitest';
import type { BiomeId } from '../../biomes';
import { partShapes, stagePoseWords } from '../../three/archipeo/constructionParts';
import { phraseDeLaPose } from '../../poseWords';
import { partiesDe } from '../parts';
import { plansFor } from '../plans';
import { FOREST_REWORK_MAX_5E, PLACE_TRIANGLES_MAX_5E, openWorldCost5e } from './budget';
import { followPose, lookUp, screenOf } from './camera';
import { posedTraces, traceStagePosed, WHOLE, type PartShape, type Stage } from './construction';
import { boundsOf, type Facets } from './facets';
import { linearRgb, type Vec2 } from './geometry';
import { hasHabitantModel } from './habitants';
import { hasScenette, planFor } from './levelPlan';
import { arrivalViewOf, doorViewOf } from './northShore';
import { RIBBON_LIFT, edgesNear, pathTopAt } from './paths';
import { CAUSEWAY_5E, RIBBONS_5E } from './paths5e';
import { BUILT_PLACES_5E, COLORS_5E, PATH_NODES_5E } from './plan5e';
import { drawPieces, modelOfPlace, placePieces, ruinOf } from './places';
import { placeItems } from './questions';
import { answerObjects, placeTrace, questionLayout, sceneSpot } from './questionScene';
import { scenetteHabitant, scenetteKeo, scenetteLayout, scenetteOf, scenettePose, scenetteSurroundings } from './scenette';
import { SEMAPHORE, SEMAPHORE_LAYOUT as L } from './semaphore5e';
import { SEMAPHORE_SURROUNDINGS } from './semaphoreSurroundings';
import { SURROUNDINGS_MAX } from './surroundings';
import { standingHeight } from './terrain';
import { buildHeightField5e, groundOn5e, heightAt5e } from './terrain5e';

const PLAN = planFor('5e');
const PLACE = PLAN.places.find((p) => p.id === 'semaphore')!;
const ISLAND = PLACE.island as BiomeId;
const MISSIONS = [...BUILT_PLACES_5E.semaphore];
const SHAPES = partShapes(ISLAND);

/** La ruine du Sémaphore au plus (intention du directeur artistique, « Le budget » : 1 000 visés, 1 200 au plus). */
const SEMAPHORE_RUIN_MAX = 1_000;

/** Les `n` premières parties posées (0 : la ruine, 5 : tout). */
const upTo = (n: number): PartShape[] => SHAPES.slice(0, n);
const takes = (parts: readonly PartShape[], stage: Stage, row: number) => parts.some((part) => part.some((s) => s.stage === stage && row >= s.from - 1e-9 && row < s.to - 1e-9));

/** Ce que le lieu montre, ses `n` premières parties posées : la ruine qui reste, les rangées posées. */
function shown(n: number): Facets {
  const parts = upTo(n);
  return drawPieces('semaphore', (p) => (p.stage === 'ruine' ? !p.until || !takes(parts, p.until.stage, p.until.row) : takes(parts, p.stage, p.row)));
}

/** Les sommets d'une couleur exacte (la lanterne d'ocre, que la vue dessine sans ombre). */
function verticesOf(f: Facets, color: number): number[] {
  const [r, g, b] = linearRgb(color);
  const out: number[] = [];
  for (let i = 0; i < f.colors.length; i += 3) if (Math.abs(f.colors[i] - r) < 1e-4 && Math.abs(f.colors[i + 1] - g) < 1e-4 && Math.abs(f.colors[i + 2] - b) < 1e-4) out.push(i);
  return out;
}
const countColor = (f: Facets, color: number): number => verticesOf(f, color).length;

/** La distance d'un point au segment [a, b]. */
function toSegment(p: Vec2, a: Vec2, b: Vec2): number {
  const dx = b.x - a.x,
    dz = b.z - a.z;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / (dx * dx + dz * dz)));
  return Math.hypot(p.x - a.x - dx * t, p.z - a.z - dz * t);
}

describe('Le Sémaphore, lieu complet', () => {
  it('ses cinq missions se jouent dans sa scénette, en cinq parties : trois au corps, le haut, les abords', () => {
    expect(PLACE.scenes).toEqual(MISSIONS);
    expect(MISSIONS).toEqual(['shopping', 'routine', 'listening', 'notices', 'united-kingdom']);
    expect(hasScenette('semaphore')).toBe(true);
    expect(SHAPES.map((p) => p.map((s) => [s.stage, s.from, s.to]))).toEqual([[[0, 0, 1 / 3]], [[0, 1 / 3, 2 / 3]], [[0, 2 / 3, 1]], [[1, 0, 1]], [[2, 0, 1]]]);
  });

  it('chaque partie pose quelque chose ; la ruine part avec la rangée qui la remplace', () => {
    const pieces = placePieces('semaphore');
    expect([...new Set(pieces.filter((p) => p.stage === 0).map((p) => p.row))]).toEqual([0, 1 / 3, 2 / 3]);
    for (let n = 1; n <= 5; n++) expect(shown(n).triangles, String(n)).not.toBe(shown(n - 1).triangles);
    const fallen = pieces.filter((p) => p.stage === 'ruine' && p.until).map((p) => `${p.until!.stage}/${p.until!.row}`);
    expect(new Set(fallen)).toEqual(new Set(['0/0', `0/${1 / 3}`, `0/${2 / 3}`, '1/0', '2/0']));
  });

  it('coûte au plus 1 600 triangles à son état le plus chargé, traces et objets de la question compris ; la ruine, 1 000 au plus', () => {
    // Les objets de la question (la planche et ses trois fanions) se montrent avec le lieu : comptés avec lui.
    const answers = answerObjects('semaphore', [0, 1, 2].map((x) => ({ x, y: 0, z: 0 })), 1, { picked: [] }).triangles;
    let worst = 0;
    for (let n = 0; n <= 5; n++) {
      const traces = placeTrace('semaphore', posedTraces('semaphore', upTo(n), MISSIONS)).triangles;
      worst = Math.max(worst, shown(n).triangles + traces);
    }
    expect(worst + answers).toBeLessThanOrEqual(PLACE_TRIANGLES_MAX_5E);
    expect(shown(0).triangles).toBeLessThanOrEqual(SEMAPHORE_RUIN_MAX);
    // Le plus chargé est le lieu restauré, toutes les traces posées : le budget le compte ainsi.
    expect(shown(5).triangles + placeTrace('semaphore', MISSIONS).triangles).toBe(worst);
  });

  it('une seule lanterne allumée dans la ruine, celle du signaleur ; le haut allume la potence et la tête du mât (le feu du 5e), les abords le chemin : quatre au plus, trois sous 4', () => {
    // Une lanterne : sa vitre, un pavé (dix triangles, trente sommets).
    const lit = (n: number) => countColor(shown(n), COLORS_5E.lantern);
    expect(lit(0)).toBe(30);
    expect(lit(3)).toBe(30);
    expect(lit(4)).toBe(90);
    expect(lit(5)).toBe(120);
    // Les trois lanternes éteintes de la ruine (la potence, la tête du mât couchée, celle du chemin couchée) partent avec
    // leur partie.
    expect(countColor(shown(0), 0xbfc4b8)).toBe(90);
    expect(countColor(shown(4), 0xbfc4b8)).toBe(30);
    expect(countColor(shown(5), 0xbfc4b8)).toBe(0);
    // Aucune lumière au-dessus de la corniche, ni sur la cabine ni sur le mât, hors la lanterne de tête du mât, au-dessus
    // de son chapeau (GD-27, le feu du 5e, décision du directeur artistique du 30 octobre 2026) : les autres sous 4.
    const f = shown(5);
    const mastTop = L.courtTop + L.mast.top + L.mast.capH;
    let atMast = 0;
    for (const i of verticesOf(f, COLORS_5E.lantern)) {
      const y = f.positions[i + 1];
      if (y > mastTop && Math.hypot(f.positions[i] - L.mast.x, f.positions[i + 2] - L.mast.z) < 0.4) atMast++;
      else expect(y - L.courtTop).toBeLessThan(4);
    }
    expect(atMast).toBe(30);
    // Le chapeau des trois lanternes est de fer : plus de bronze nulle part, aucune face ocre hors des vitres allumées.
    for (let n = 0; n <= 5; n++) expect(countColor(shown(n), 0xb8954f), String(n)).toBe(0);
  });

  it('le signe du pivot pris ne change jamais : un trou nu brun sombre et quatre goujons, à droite de la porte, vers 2,6', () => {
    // Parmi ce qui reste toujours, seul le trou a le brun très sombre : un aplat à seize pans (rond, plus un octogone),
    // quatorze triangles ; ni anneau, ni cercle de fer ; le même, lieu restauré.
    const M = L.pivotMark;
    expect(M.sides).toBe(16);
    expect(countColor(ruinOf('semaphore'), 0x3a312c)).toBe(3 * (M.sides - 2));
    expect(countColor(shown(5), 0x3a312c)).toBe(3 * (M.sides - 2));
    expect(M.y).toBeGreaterThan(2.4);
    expect(M.y).toBeLessThan(2.8);
    // Les goujons en diagonale, à l'écart du linteau, sur la face sud.
    const reach = M.stud * Math.SQRT1_2 + M.size / 2;
    expect(M.x - reach).toBeGreaterThan(L.door.lintelHalf);
    expect(M.x + reach).toBeLessThan(L.tower.r / 2);
    // Il n'est sur aucune étape : la ruine qui reste toujours le porte.
    for (const p of placePieces('semaphore')) if (p.stage !== 'ruine' || p.until) expect(countColor(drawPieces('semaphore', (q) => q === p), 0x3a312c), String(p.stage)).toBe(0);
  });

  it('la tour : six pans, aussi large que haute, un sommet plat sans créneaux ; la cabine à un pan sur la corniche', () => {
    const T = L.tower;
    expect(2 * T.r).toBeGreaterThan(T.h * 0.9);
    expect(2 * T.r).toBeLessThan(T.h * 1.2);
    // Rien de la tour restaurée ne dépasse sa corniche, hors de la cabine et du mât : pas de créneau.
    const f = shown(2);
    expect(boundsOf(f).max[1] - L.courtTop).toBeCloseTo(L.corniceTop, 6);
    // Le toit de la cabine monte vers le nord, d'un seul pan.
    expect(L.cabinRoofTop(L.cabin.z - 1)).toBeGreaterThan(L.cabinRoofTop(L.cabin.z + 1));
  });

  it('le mât et ses bras : attachés par le bout, relevés d’environ 35°, parallèles, le bras du bas plus long ; le mât dépasse de 1,5 ; chapeau à 16 au plus', () => {
    const A = L.arms;
    expect(A.low.len).toBeGreaterThan(A.high.len);
    expect(A.high.y - A.low.y).toBeCloseTo(2.2, 6);
    expect(A.angle).toBeGreaterThan((30 * Math.PI) / 180);
    expect(A.angle).toBeLessThan((40 * Math.PI) / 180);
    // Les deux bouts : du même côté (le nord-ouest), à la même pente depuis leur attache (parallèles).
    const slope = (tip: { x: number; y: number; z: number }, y: number) => (tip.y - y) / Math.hypot(tip.x - L.mast.x, tip.z - L.mast.z);
    expect(slope(L.armTips.low, A.low.y)).toBeCloseTo(slope(L.armTips.high, A.high.y), 1);
    for (const tip of [L.armTips.low, L.armTips.high]) {
      expect(tip.x).toBeLessThan(L.mast.x);
      expect(tip.z).toBeLessThan(L.mast.z);
    }
    // Le mât dépasse d'au moins 1,5 la charnière du haut ; son chapeau à 16 au plus au-dessus de la cour, sous les
    // aiguilles et sous le Donjon.
    expect(L.mast.top - A.high.y).toBeGreaterThanOrEqual(1.5);
    expect(L.mast.top + L.mast.capH).toBeLessThanOrEqual(16);
    // Des planches larges (retouche 1) : lues de loin comme des bras, plus comme des tiges.
    expect(A.width).toBeGreaterThanOrEqual(0.65);
    expect(A.thick).toBeGreaterThanOrEqual(0.14);
    // Le mât, à l'ouest de la cabine, sur la corniche.
    expect(L.mast.x).toBeLessThan(L.cabin.x - L.cabin.side / 2);
    expect(Math.hypot(L.mast.x - L.tower.x, L.mast.z - L.tower.z)).toBeLessThan(L.tower.corniceR * Math.cos(Math.PI / 6) - L.mast.r);
  });

  it('la corne de brume tournée vers l’ouest, son pavillon très évasé, sur un tréteau bas, à gauche de la tour', () => {
    const H = L.horn;
    expect(H.tube.len + H.bell.len).toBeCloseTo(2.6, 6);
    expect(2 * H.bell.r1).toBeCloseTo(1.6, 6);
    expect(H.bell.r1 / H.tube.r1).toBeGreaterThan(3);
    expect(H.trestle).toBeLessThan(1);
    expect(H.x).toBeLessThan(L.tower.x - L.tower.r);
  });

  it('la drisse finit sur le mur ouest de la cabine, sous le débord du toit ; ses trois fanions ne se touchent pas', () => {
    const H = L.halyard;
    expect(H.to.x).toBeCloseTo(L.cabin.x - L.cabin.side / 2, 6);
    expect(H.to.y).toBeGreaterThan(L.corniceTop);
    expect(H.to.y).toBeLessThan(L.corniceTop + L.cabin.low - 0.3);
    const span = Math.abs(H.to.x - H.from.x);
    for (let i = 1; i < H.flags.length; i++) expect((H.flags[i] - H.flags[i - 1]) * span).toBeGreaterThan(H.w);
    expect(H.flags[0] * span).toBeGreaterThan(H.w / 2);
    expect((1 - H.flags[H.flags.length - 1]) * span).toBeGreaterThan(H.w / 2);
  });

  it('sur la Carte, son nom au même point en ruine et restauré, au-dessus de la corniche', () => {
    expect(SEMAPHORE.mapPoint).toEqual(L.mapPoint);
    expect(L.mapPoint.y - L.courtTop - L.corniceTop).toBeCloseTo(1.5, 6);
    expect(Math.hypot(L.mapPoint.x - L.tower.x, L.mapPoint.z - L.tower.z)).toBeLessThan(1e-9);
  });

  it('la chaussée devient le seuil de la cour : sous son disque, au-dessus du sol, aucun sol entre les deux ; une marche à la cour', () => {
    const ground = (x: number, z: number) => standingHeight(heightAt5e({ x: PLACE.center.x + x, z: PLACE.center.z + z })) - L.heightAtCenter;
    const S = L.step;
    // Du bord de la cour au nœud de la porte, large comme la chaussée.
    expect(S.z0).toBe(L.court.z1);
    expect(S.z1).toBeCloseTo(L.doorNode.z, 9);
    expect(S.x1 - S.x0).toBeCloseTo(2 * CAUSEWAY_5E.half, 9);
    // À la hauteur du disque de la chaussée, juste dessous ; au-dessus du sol partout.
    const disc = ground(L.doorNode.x, L.doorNode.z) + RIBBON_LIFT;
    expect(disc - S.top).toBeGreaterThan(0.02);
    expect(disc - S.top).toBeLessThanOrEqual(0.03 + 1e-9);
    for (let x = S.x0; x <= S.x1 + 1e-6; x += 0.25) for (let z = S.z0; z <= S.z1 + 1e-6; z += 0.25) expect(S.top - ground(x, z), `${x} ${z}`).toBeGreaterThan(0.01);
    // La cour, une marche plus haut (0,8 au plus, comme au Donjon).
    expect(L.courtTop - S.top).toBeGreaterThan(0);
    expect(L.courtTop - S.top).toBeLessThanOrEqual(0.8);
  });

  it('rien du lieu n’est posé sur la chaussée : tout ce qui est au-dessus d’elle en est à plus de sa demi-largeur', () => {
    const field = buildHeightField5e();
    const ground = (x: number, z: number) => groundOn5e(field, x, z);
    const near: number[] = [];
    // Le lieu entier et sa ruine, dans le repère du monde.
    for (const f of [drawPieces('semaphore', () => true), ruinOf('semaphore')]) {
      for (let i = 0; i < f.positions.length; i += 3) {
        const x = PLACE.center.x + f.positions[i];
        const z = PLACE.center.z + f.positions[i + 2];
        edgesNear(x, z, 0, near, RIBBONS_5E);
        if (near.length === 0) continue;
        const top = pathTopAt(x, z, ground, near, RIBBONS_5E);
        expect(L.heightAtCenter + f.positions[i + 1], `${f.positions[i].toFixed(2)} ${f.positions[i + 2].toFixed(2)}`).toBeLessThan(top);
      }
    }
  });

  it('rien de la ruine sur le chemin de marche, de la chaussée (`aig-3`) à la porte', () => {
    const ground = (x: number, z: number) => standingHeight(heightAt5e({ x: PLACE.center.x + x, z: PLACE.center.z + z })) - L.heightAtCenter;
    const ruin = drawPieces('semaphore', (p) => p.stage === 'ruine');
    for (let i = 0; i < ruin.positions.length; i += 3) {
      const p = { x: ruin.positions[i], z: ruin.positions[i + 2] };
      // Le seuil de dalles, à plat sous la chaussée, se marche ; ce qui passe haut ne gêne pas.
      const y = ruin.positions[i + 1] - ground(p.x, p.z);
      if (y < 0.2 || y > 2) continue;
      expect(toSegment(p, L.aig3, L.doorNode), `${p.x.toFixed(2)} ${p.z.toFixed(2)}`).toBeGreaterThan(0.9);
    }
  });
});

describe('Les traces du Sémaphore : une par partie', () => {
  it('une trace par mission, chacune avec sa partie (3+1+1)', () => {
    expect(Object.keys(SEMAPHORE.traces)).toEqual(MISSIONS);
    expect(MISSIONS.map((m) => [SEMAPHORE.traces[m].stage, SEMAPHORE.traces[m].row])).toEqual([
      [0, 0],
      [0, 1 / 3],
      [0, 2 / 3],
      [1, 0],
      [2, 0],
    ]);
  });

  it('la trace d’une mission se montre quand sa mission est réussie et que sa partie est posée', () => {
    for (let n = 0; n <= 5; n++) expect(posedTraces('semaphore', upTo(n), MISSIONS), String(n)).toEqual(MISSIONS.slice(0, n));
    expect(posedTraces('semaphore', [WHOLE], MISSIONS)).toEqual(MISSIONS);
    expect(posedTraces('semaphore', upTo(1), ['routine'])).toEqual([]);
    expect(traceStagePosed('semaphore', upTo(1))).toBe(true);
    expect(traceStagePosed('semaphore', upTo(0))).toBe(false);
  });

  it('chaque trace se dessine seule ; les traces du corps à gauche de la porte, le banc contre le pied est, le râtelier aux abords', () => {
    for (const m of MISSIONS) expect(placeTrace('semaphore', [m]).triangles, m).toBeGreaterThan(0);
    expect(placeTrace('semaphore', []).triangles).toBe(0);
    for (const m of ['shopping', 'routine', 'listening']) expect(SEMAPHORE.traces[m].at.x, m).toBeLessThan(-L.door.half);
    expect(SEMAPHORE.traces.notices.at.x).toBeGreaterThan(L.tower.x + 1);
    expect(SEMAPHORE.traces['united-kingdom'].at.x).toBeGreaterThan(L.tower.x + L.tower.r);
  });
});

describe('La scénette du Sémaphore', () => {
  it('le signaleur, sans prénom, à droite ; Kéo à gauche, sur les dalles de la cour', () => {
    expect(scenetteOf('semaphore').role).toBe('Le signaleur');
    expect(scenetteOf('semaphore').greeting).toBe('Le signaleur fait des signes aux bateaux avec de grands bras de bois.');
    const keo = scenetteKeo('semaphore').at;
    const h = scenetteHabitant('semaphore');
    expect(h.x - keo.x).toBeGreaterThan(2);
    expect(Math.abs(h.y - keo.y)).toBeLessThan(1e-6);
    expect(sceneSpot('semaphore').z - PLACE.center.z).toBeCloseTo(L.scene.dz, 6);
    expect(keo.y).toBeCloseTo(L.heightAtCenter + L.courtTop, 2);
    // Le signaleur devant la façade, à droite de la porte et de sa lanterne : il ne cache ni le trou ni sa lanterne.
    expect(h.x - PLACE.center.x).toBeGreaterThan(L.perch.x + L.perch.arm + 0.3);
    expect(keo.x - PLACE.center.x).toBeLessThan(0);
    const items = placeItems('semaphore', 'english-5e-vocabulary-shopping-1', [{ key: 'a', choices: ['bread', 'milk', 'eggs'], answer: 'bread' }]);
    expect(items[0].placeScene).toEqual({ kind: 'rest' });
  });

  it('un fanion choisi se soulève d’un cran : sa forme ne change pas, sa place si ; quatre formes distinctes, sans rectangle, une seule teinte', () => {
    const at = [{ x: 0, y: 0, z: 0 }];
    const still = answerObjects('semaphore', at, 1, { picked: [] });
    const picked = answerObjects('semaphore', at, 1, { picked: [0] });
    expect(picked.triangles).toBe(still.triangles);
    const top = (f: Facets) => Math.max(...f.positions.filter((_, i) => i % 3 === 1));
    expect(top(picked) - top(still)).toBeCloseTo(0.2, 6);
    // Les formes diffèrent par leurs aplats, leurs sommets ou leur allongement : la forme seule les distingue.
    const shapes = L.answerShapes.map((parts) => {
      const pts = parts.flat();
      const xs = pts.map(([x]) => x),
        ys = pts.map(([, y]) => y);
      return `${parts.map((p) => p.length).join('+')}/${((Math.max(...xs) - Math.min(...xs)) / (Math.max(...ys) - Math.min(...ys))).toFixed(1)}`;
    });
    expect(new Set(shapes).size).toBe(L.answerShapes.length);
    // Aucun rectangle (il se lit « drapeau ») : aucun aplat à quatre sommets sur deux x et deux y seulement.
    for (const parts of L.answerShapes)
      for (const p of parts) {
        const rect = p.length === 4 && new Set(p.map(([x]) => x)).size === 2 && new Set(p.map(([, y]) => y)).size === 2;
        expect(rect).toBe(false);
      }
  });

  it('le signaleur se montre en modèle 3D ; ses abords tiennent sous le plafond commun, dans chaque état', () => {
    expect(hasHabitantModel('semaphore')).toBe(true);
    for (const posed of [false, true])
      for (const open of [false, true]) {
        const f = scenetteSurroundings('semaphore', open, posed);
        expect(f.triangles).toBeGreaterThan(0);
        expect(f.triangles).toBeLessThanOrEqual(SURROUNDINGS_MAX);
      }
  });

  it('la roche qui cadre, à l’est, dans le cadre à 1024 × 768, hors de la cour', () => {
    const [w, h] = [1024, 768];
    const stage = scenetteLayout({ count: 3 }, w, h, questionLayout({ count: 3 }, w, h)).scenette!.stage;
    const { pose, shift } = scenettePose('semaphore', stage, w, h);
    const floor = sceneSpot('semaphore');
    const { rock } = SEMAPHORE_SURROUNDINGS;
    const p = screenOf(pose, { x: floor.x + rock.dx - rock.r, y: floor.y + 0.3, z: floor.z + rock.dz }, w, h);
    expect(p.x - shift.x).toBeGreaterThan(stage.left);
    expect(p.x - shift.x).toBeLessThan(stage.right);
    expect(L.scene.dx + rock.dx - rock.r * 0.7).toBeGreaterThan(L.court.x1 - 0.5);
  });

  it('ne dit aucun nom du contenu (ni Pudding, ni la Reine du marché, ni Comptoir), ni dans sa phrase ni dans les cinq phrases de pose', () => {
    const said = `${scenetteOf('semaphore').role} ${scenetteOf('semaphore').greeting ?? ''}`;
    const names = /Pudding|Reine|Comptoir|boutique|terrasse|toit/i;
    expect(said).not.toMatch(names);
    const parties = partiesDe(ISLAND);
    const words = stagePoseWords(ISLAND, PLACE);
    expect(parties).toHaveLength(5);
    for (const partie of parties) expect(phraseDeLaPose({ posees: [partie], plansFinis: [] }, words)).not.toMatch(names);
  });
});

describe('Le bilan du Sémaphore nomme la partie par son étape', () => {
  it('« Partie posée : le corps du Sémaphore, 1 sur 3. » ; jamais le nom d’un plan', () => {
    const parties = partiesDe(ISLAND);
    expect(parties).toHaveLength(5);
    const words = stagePoseWords(ISLAND, PLACE);
    const said = (k: number) => phraseDeLaPose({ posees: [parties[k]], plansFinis: [] }, words);
    expect(said(0)).toBe('Partie posée : le corps du Sémaphore, 1 sur 3.');
    for (let k = 0; k < 5; k++) for (const plan of plansFor(ISLAND)) expect(said(k)).not.toContain(plan.done);
  });
});

describe('« Y aller » au Sémaphore', () => {
  const door = PATH_NODES_5E.find((n) => n.id === 'semaphore')!.at;
  const feet = { x: door.x, y: standingHeight(heightAt5e(door)), z: door.z };
  const W = 1024,
    H = 768;
  const world = (p: Vec2, y: number) => ({ x: PLACE.center.x + p.x, y: L.heightAtCenter + L.courtTop + y, z: PLACE.center.z + p.z });
  /** Les trois tailles des captures : la tablette couchée, la tablette debout, le téléphone. */
  const SIZES = [
    [1024, 768],
    [800, 1280],
    [390, 844],
  ] as const;
  const inFrame = (p: { x: number; y: number }, what: string, w: number = W, h: number = H) => {
    expect(p.x, what).toBeGreaterThan(0);
    expect(p.x, what).toBeLessThan(w);
    expect(p.y, what).toBeGreaterThan(0);
    expect(p.y, what).toBeLessThan(h);
  };

  it('la caméra arrive un peu à gauche du nord, vers le large : la tour entière dans le cadre, aux trois tailles', () => {
    expect(doorViewOf('semaphore')).toBe(L.doorView);
    expect(L.doorView).toBeGreaterThan(0);
    expect(L.doorView).toBeLessThan(0.35);
    const T = L.tower;
    for (const [w, h] of SIZES) {
      const pose = followPose(feet, 0, undefined, doorViewOf('semaphore'));
      for (const a of [Math.PI / 6, (5 * Math.PI) / 6]) for (const y of [0, T.h]) inFrame(screenOf(pose, world({ x: T.x + T.r * Math.cos(a), z: T.z + T.r * Math.sin(a) }, y), w, h), `${w} ${a} ${y}`, w, h);
    }
  });

  it('le regard d’arrivée (comme au Donjon) cadre le chapeau du mât, avec de l’air, et le bout des deux bras ; les pieds de Kéo restent dans l’image', () => {
    const view = arrivalViewOf('semaphore')!;
    expect(view).toEqual(L.arrivalView);
    // Le regard se lève au-dessus du mât ; la caméra ne recule pas.
    expect(view.look).toEqual({ x: L.mast.x, z: L.mast.z });
    expect(view.back).toBe(1);
    // Comme la vue (scene.ts, `arrivals`) : la caméra qui suit, reculée de `back`, puis le regard levé jusqu'au haut bâti.
    const arrive = () => followPose(feet, 0, undefined, doorViewOf('semaphore'), 1, undefined, { height: 0, back: view.back });
    const top = { x: PLACE.center.x + view.look.x, y: L.heightAtCenter + modelOfPlace('semaphore').top, z: PLACE.center.z + view.look.z };
    for (const [w, h] of SIZES) {
      const pose = arrive();
      lookUp(pose, top, feet, 1, h);
      const cap = screenOf(pose, world({ x: L.mast.x, z: L.mast.z }, L.mast.top + L.mast.capH), w, h);
      inFrame(cap, `chapeau ${w}`, w, h);
      // De l'air au-dessus du chapeau (la marque du lieu, la bulle et les boutons n'y sont pas) : 6 % de l'écran au moins.
      expect(cap.y, `air ${w}`).toBeGreaterThan(0.06 * h);
      for (const [k, tip] of Object.entries(L.armTips)) inFrame(screenOf(pose, world(tip, tip.y), w, h), `${k} ${w}`, w, h);
      inFrame(screenOf(pose, feet, w, h), `Kéo ${w}`, w, h);
    }
    // Dans la ruine, la tour basse est déjà dans le cadre : le regard ne bouge pas.
    const still = arrive();
    const before = { ...still.target };
    lookUp(still, { ...top, y: L.heightAtCenter + boundsOf(shown(0)).max[1] }, feet, 1, H);
    expect(still.target).toEqual(before);
  });
});

/**
 * Le budget du 5e au lot 13b, avant le Sémaphore (les chaussées, le Donjon et l'Oracle : `npm run rendu:budget --
 * --archipel 6e,5e` sur `preview`, 21 octobre 2026), scénette ouverte.
 */
const LOT13B_OPEN_5E = { triangles: 104_710, calls: 19 } as const;

describe('Le budget du 5e, avec le Sémaphore (plafonds du lot 14)', () => {
  it('scénette ouverte : le lot 13b et un lieu de plus au plus par lieu fini depuis, sans appel de plus ; le signaleur dans les deux appels de la scénette', () => {
    const cost = openWorldCost5e();
    const triangles = cost.reduce((a, p) => a + p.triangles, 0);
    const calls = cost.reduce((a, p) => a + p.calls, 0);
    // Les lieux finis depuis le lot 13b : le Sémaphore (lot 14) ; et la forêt retaillée (#490), venue avant lui.
    const since = Object.keys(BUILT_PLACES_5E).filter((id) => !['montee', 'hameau', 'radeaux', 'croisee', 'instants', 'fumerolles', 'etuve', 'terrasses', 'auberge', 'donjon', 'oracle'].includes(id)).length;
    expect(since).toBeGreaterThanOrEqual(1);
    expect(triangles).toBeLessThanOrEqual(LOT13B_OPEN_5E.triangles + since * PLACE_TRIANGLES_MAX_5E + FOREST_REWORK_MAX_5E);
    expect(calls).toBeLessThanOrEqual(LOT13B_OPEN_5E.calls);
    expect(cost.find((c) => c.poste === 'scénette')!.calls).toBe(2);
  });
});
