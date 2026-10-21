// Le Gaillard (GD-22, lot 15) : le lieu par parties (3 + 1 + 1), une seule lanterne allumée dans la ruine et trois au plus,
// une trace par mission avec sa partie, la cour à plat sur le plateau sans marche à la porte, la galerie et ses cinq cadres
// au milieu de leurs travées, sans poteau devant un cadre au cap de « Y aller », les toiles (voilier, aiguille, voilier,
// aiguille, voilier), la toile nue en Brume, la fenêtre de poupe à cinq pans d'une vitre, le socle de la longue-vue prise,
// rien sur le chemin de marche, la scénette sur la cour, ses abords dans le cadre, le cap de « Y aller » tourné vers l'est
// (la maison entière), les plafonds de 1 600 et 1 200 triangles et le budget du 5e. Sans Three.js.
import { describe, expect, it } from 'vitest';
import type { BiomeId } from '../../biomes';
import { partShapes, stagePoseWords } from '../../three/archipeo/constructionParts';
import { phraseDeLaPose } from '../../poseWords';
import { partiesDe } from '../parts';
import { plansFor } from '../plans';
import { PLACE_TRIANGLES_MAX_5E, openWorldCost5e } from './budget';
import { FOLLOW, followPose, screenOf } from './camera';
import { posedTraces, traceStagePosed, WHOLE, type PartShape, type Stage } from './construction';
import { FacetBuilder, type Facets } from './facets';
import { GAILLARD, GAILLARD_LAYOUT } from './gaillard5e';
import { GAILLARD_SURROUNDINGS } from './gaillardSurroundings';
import { linearRgb, type Vec2 } from './geometry';
import { hasHabitantModel } from './habitants';
import { hasScenette, planFor } from './levelPlan';
import { riftMistSpots } from './mist5e';
import { PERCHOIR_TRIANGLES_MAX } from './perchoir5e';
import { doorFrameOf, doorViewOf } from './northShore';
import { BUILT_PLACES_5E, COLORS_5E, NEEDLES_5E, PATH_NODES_5E } from './plan5e';
import { drawPieces, placePieces, ruinOf } from './places';
import { placeItems } from './questions';
import { answerObjects, placeTrace, questionLayout, sceneSpot } from './questionScene';
import { exitView, scenetteExit, traceViewOf, scenetteHabitant, scenetteKeo, scenetteLayout, scenetteOf, scenettePose, scenetteSurroundings } from './scenette';
import { SURROUNDINGS_MAX } from './surroundings';
import { standingHeight } from './terrain';
import { heightAt5e, plateauShare } from './terrain5e';

const PLAN = planFor('5e');
const PLACE = PLAN.places.find((p) => p.id === 'gaillard')!;
const ISLAND = PLACE.island as BiomeId;
const MISSIONS = [...BUILT_PLACES_5E.gaillard];
const SHAPES = partShapes(ISLAND);
const L = GAILLARD_LAYOUT;

/** La ruine du Gaillard au plus (intention du directeur artistique, « Le budget » : 1 200, viser 1 000). */
const GAILLARD_RUIN_MAX = 1_200;

/** Les `n` premières parties posées (0 : la ruine, 5 : tout). */
const upTo = (n: number): PartShape[] => SHAPES.slice(0, n);
const takes = (parts: readonly PartShape[], stage: Stage, row: number) => parts.some((part) => part.some((s) => s.stage === stage && row >= s.from - 1e-9 && row < s.to - 1e-9));

/** Ce que le lieu montre, ses `n` premières parties posées : la ruine qui reste, les rangées posées. */
function shown(n: number): Facets {
  const parts = upTo(n);
  return drawPieces('gaillard', (p) => (p.stage === 'ruine' ? !p.until || !takes(parts, p.until.stage, p.until.row) : takes(parts, p.stage, p.row)));
}

/** Les sommets d'une couleur exacte. */
function countColor(f: Facets, color: number): number {
  const [r, g, b] = linearRgb(color);
  let n = 0;
  for (let i = 0; i < f.colors.length; i += 3) if (Math.abs(f.colors[i] - r) < 1e-4 && Math.abs(f.colors[i + 1] - g) < 1e-4 && Math.abs(f.colors[i + 2] - b) < 1e-4) n++;
  return n;
}

/** La distance d'un point au segment [a, b]. */
function toSegment(p: Vec2, a: Vec2, b: Vec2): number {
  const dx = b.x - a.x,
    dz = b.z - a.z;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / (dx * dx + dz * dz)));
  return Math.hypot(p.x - a.x - dx * t, p.z - a.z - dz * t);
}

/** Le plus haut d'un maillage, au-dessus du sol du centre. */
const topOf = (f: Facets) => Math.max(...f.positions.filter((_, i) => i % 3 === 1));

describe('Le Gaillard, lieu complet', () => {
  it('ses cinq missions se jouent dans sa scénette, en cinq parties : trois au corps, le haut, les abords', () => {
    expect(PLACE.scenes).toEqual(MISSIONS);
    expect(MISSIONS).toEqual(['ing', 'past-simple', 'comparatives', 'sentences', 'portraits']);
    expect(hasScenette('gaillard')).toBe(true);
    expect(SHAPES.map((p) => p.map((s) => [s.stage, s.from, s.to]))).toEqual([[[0, 0, 1 / 3]], [[0, 1 / 3, 2 / 3]], [[0, 2 / 3, 1]], [[1, 0, 1]], [[2, 0, 1]]]);
  });

  it('chaque partie pose quelque chose ; la ruine part avec la rangée qui la remplace', () => {
    const pieces = placePieces('gaillard');
    expect([...new Set(pieces.filter((p) => p.stage === 0).map((p) => p.row))]).toEqual([0, 1 / 3, 2 / 3]);
    for (let n = 1; n <= 5; n++) expect(shown(n).triangles, String(n)).not.toBe(shown(n - 1).triangles);
    const fallen = pieces.filter((p) => p.stage === 'ruine' && p.until).map((p) => `${p.until!.stage}/${p.until!.row}`);
    expect(new Set(fallen)).toEqual(new Set(['0/0', `0/${1 / 3}`, `0/${2 / 3}`, '1/0', '2/0']));
  });

  it('coûte au plus 1 600 triangles à son état le plus chargé, traces comprises ; la ruine, 1 200 au plus', () => {
    let worst = 0;
    for (let n = 0; n <= 5; n++) {
      const traces = placeTrace('gaillard', posedTraces('gaillard', upTo(n), MISSIONS)).triangles;
      worst = Math.max(worst, shown(n).triangles + traces);
    }
    expect(worst).toBeLessThanOrEqual(PLACE_TRIANGLES_MAX_5E);
    expect(shown(0).triangles).toBeLessThanOrEqual(GAILLARD_RUIN_MAX);
  });

  it('une seule lanterne allumée dans la ruine, celle de la peintre ; le haut allume celle de la galerie, les abords celle du chemin : trois au plus', () => {
    // Une lanterne : sa vitre, un pavé (dix triangles, trente sommets).
    const lit = (n: number) => countColor(shown(n), COLORS_5E.lantern);
    expect(lit(0)).toBe(30);
    expect(lit(3)).toBe(30);
    expect(lit(4)).toBe(60);
    expect(lit(5)).toBe(90);
    // La lanterne éteinte de la ruine, couchée au pied de son piquet, part avec les abords.
    expect(countColor(shown(0), 0xbfc4b8)).toBe(30);
    expect(countColor(shown(4), 0xbfc4b8)).toBe(30);
    expect(countColor(shown(5), 0xbfc4b8)).toBe(0);
  });

  it('aucune lumière au-dessus du faîte ni d’une cheminée ; la lanterne de la galerie sous le toit, au mur du bout est', () => {
    const G = L.galleryLantern;
    expect(G.y).toBeLessThan(L.house.top);
    expect(G.x).toBeGreaterThan(L.bays[4] + L.frame.w / 2 + 0.2);
    expect(G.x).toBeLessThan(L.loggia.half);
    expect(G.z).toBeGreaterThan(L.loggia.back);
    // Le lieu entier reste bas, bien sous ses aiguilles (aucun lieu au-dessus de 27, commun 5).
    expect(topOf(shown(5)) - L.houseY).toBeLessThan(13);
  });

  it('le socle de la longue-vue prise ne change jamais : un trou brun très sombre, quatre goujons de fer, rien dessus', () => {
    // Parmi ce qui reste toujours (la ruine sans ce qui tombe), seul le trou du socle a le brun très sombre : un disque à
    // douze pans, dix triangles ; les quatre goujons, quatre pavés de fer.
    expect(countColor(ruinOf('gaillard'), 0x3a312c)).toBe(30);
    expect(countColor(ruinOf('gaillard'), 0x6f6a60)).toBe(4 * 30);
    const S = L.spyglass;
    // À hauteur de genou, au bord est de la cour, hors du chemin ; les goujons autour du trou, sur le dessus.
    expect(S.h).toBeGreaterThan(0.4);
    expect(S.h).toBeLessThan(0.7);
    expect(S.x).toBeGreaterThan(L.wing.x1);
    expect(S.studs - S.stud).toBeGreaterThan(S.hole);
    expect(S.studs + S.stud).toBeLessThan(S.r);
  });

  it('la galerie : cinq travées égales, quatre poteaux entre elles, chaque cadre au milieu de la sienne, de même taille, plus haut que large', () => {
    expect(L.bays).toHaveLength(5);
    expect(L.posts).toHaveLength(4);
    const bay = (2 * L.loggia.half) / 5;
    for (let k = 0; k < 5; k++) expect(L.bays[k]).toBeCloseTo(-L.loggia.half + bay * (k + 0.5), 9);
    for (let k = 0; k < 4; k++) expect(L.posts[k]).toBeCloseTo((L.bays[k] + L.bays[k + 1]) / 2, 9);
    expect(L.frame.h / L.frame.w).toBeGreaterThan(1.1);
    expect(L.frame.w).toBeLessThan(bay - 0.5);
    // Les cadres au-dessus de la main courante, sous le haut des murs.
    expect(L.frame.y0).toBeGreaterThan(L.loggia.rails[1] + 0.1);
    expect(L.frame.y0 + L.frame.h).toBeLessThan(L.house.top);
  });

  it('les toiles nues en Brume avec le corps 2, les cinq toiles peintes avec les abords : fonds bleu-gris, olive, brique, Vert île, brun', () => {
    const brume = 0xe5ebe3;
    expect(countColor(shown(1), brume)).toBe(0);
    // Les cinq toiles nues, deux triangles chacune.
    expect(countColor(shown(2), brume)).toBe(5 * 6);
    // Les fonds peints, chacun une fois, avec les abords seulement.
    for (const ground of [0x6f8089, 0x8a9a5a, 0x9c5e4a, 0x438b82, 0x7a6455]) {
      expect(countColor(shown(4), ground), ground.toString(16)).toBe(0);
      expect(countColor(shown(5), ground), ground.toString(16)).toBeGreaterThanOrEqual(6);
    }
    // Les voiles des trois voiliers, Brume aussi : une, deux, puis deux triangles (la voile carrée en trapèze), son creux
    // gonflé d'une seconde teinte (deux triangles).
    expect(countColor(shown(5), brume) - 5 * 6).toBe(3 * (1 + 2 + 2));
    expect(countColor(shown(5), 0xc3cbc4)).toBe(3 * 2);
    // La coque et les deux aiguilles : trois coques, deux aiguilles à deux faces.
    expect(countColor(shown(5), 0x4e4034)).toBeGreaterThan(0);
  });

  it('la fenêtre de poupe : cinq pans d’une seule vitre haute, sans croisillon ; deux brisés dans la ruine', () => {
    expect(L.poupePlan).toHaveLength(6);
    const glass = 0x4f5a5e;
    // La vitre unie des cinq pans (deux triangles chacun), en plus des deux fenêtres du rez (deux triangles chacune).
    expect(countColor(shown(5), glass)).toBe(3 * 2 * (5 + 2));
    // Dans la ruine, trois vitres et les deux fenêtres du rez ; deux pans brisés, brun très sombre.
    expect(countColor(shown(0), glass)).toBe(3 * 2 * (3 + 2));
    // Les pans de même largeur, en saillie au nord du mur.
    const w = L.poupePlan.slice(1).map((p, k) => Math.hypot(p.x - L.poupePlan[k].x, p.z - L.poupePlan[k].z));
    for (const x of w) expect(x).toBeGreaterThan(0.5);
    for (const p of L.poupePlan) expect(p.z).toBeLessThanOrEqual(L.house.z0 + 1e-9);
  });

  it('la cour est à plat sur le plateau : jamais sous le sol, à moins de 0,2 au-dessus, sans marche au pas de la porte', () => {
    const ground = (x: number, z: number) => standingHeight(heightAt5e({ x: PLACE.center.x + x, z: PLACE.center.z + z })) - L.heightAtCenter;
    const Y = L.yard;
    for (let x = Y.x0; x <= Y.x1; x += 0.5)
      for (let z = Y.z0; z <= Y.z1; z += 0.5) {
        const d = L.yardY(x, z) - ground(x, z);
        expect(d, `${x} ${z}`).toBeGreaterThan(0);
        expect(d, `${x} ${z}`).toBeLessThan(0.2);
      }
    // Son bord sud passe au nord du pas de la porte, à moins d'une unité : Kéo s'arrête au bord de la cour.
    expect(L.door.z - Y.z1).toBeGreaterThan(0);
    expect(L.door.z - Y.z1).toBeLessThan(1);
    expect(L.yardY(L.door.x, Y.z1) - ground(L.door.x, L.door.z)).toBeLessThan(0.2);
    // Une cour de l'ordre de 20 sur 18, autour de la maison et de son aile.
    expect(Y.x1 - Y.x0).toBeGreaterThan(18);
    expect(Y.z1 - Y.z0).toBeGreaterThan(14);
    expect(Y.x0).toBeLessThan(-L.house.x - 3);
    expect(Y.x1).toBeGreaterThan(L.wing.x1 + 2);
    expect(Y.z0).toBeLessThan(L.house.z0 - 3);
  });

  it('rien de la ruine sur le chemin de marche, d’`aig-5` à la porte ; ni la bordure, ni la lanterne du chemin', () => {
    const ground = (x: number, z: number) => standingHeight(heightAt5e({ x: PLACE.center.x + x, z: PLACE.center.z + z })) - L.heightAtCenter;
    for (const f of [drawPieces('gaillard', (p) => p.stage === 'ruine'), drawPieces('gaillard', (p) => p.stage === 2)])
      for (let i = 0; i < f.positions.length; i += 3) {
        const p = { x: f.positions[i], z: f.positions[i + 2] };
        if (f.positions[i + 1] - ground(p.x, p.z) > 2) continue;
        // La cour elle-même se marche jusqu'au pas de la porte.
        if (f.positions[i + 1] - ground(p.x, p.z) < 0.25 && p.z <= L.yard.z1 + 1e-6) continue;
        expect(toSegment(p, L.aig5, L.door), `${p.x.toFixed(2)} ${p.z.toFixed(2)}`).toBeGreaterThan(0.9);
      }
  });

  it('une seule porte, au sud, au milieu du long pan ; le perron devant elle', () => {
    expect(L.house.z1).toBeGreaterThan(L.house.z0);
    expect(2 * L.house.x).toBeGreaterThanOrEqual(12);
    // À l'échelle de Kéo, qui mesure 2,6 (retouche 1, demande du mainteneur) : un rez de 4 au moins, sa porte plus haute
    // que Kéo, l'égout vers 8, un toit de 30° au moins (la planche : 35 à 40), profond de 6,6.
    expect(L.house.z1 - L.house.z0).toBeCloseTo(6.6, 6);
    expect(L.house.rez).toBeGreaterThanOrEqual(4);
    expect(L.house.eave).toBeGreaterThan(7.5);
    expect(L.house.eave).toBeLessThan(8.5);
    const pitch = (Math.atan((L.house.ridge - L.house.eave) / (L.house.z1 - L.house.ridgeZ)) * 180) / Math.PI;
    expect(pitch).toBeGreaterThanOrEqual(30);
    expect(pitch).toBeLessThanOrEqual(40);
    // Les cadres de l'ordre de 1,2 sur 2.
    expect(L.frame.w).toBeCloseTo(1.2, 6);
    expect(L.frame.h).toBeCloseTo(2, 6);
    // Les cheminées nettement plus hautes que le faîte : la souche sort de plus d'un demi au-dessus des ardoises.
    expect(L.chimney.above - L.house.slab).toBeGreaterThan(0.5);
    // L'aile plus basse, en retrait, à l'est.
    expect(L.wing.x0).toBeCloseTo(L.house.x, 9);
    expect(L.wing.high).toBeLessThan(L.house.eave);
    expect(L.wing.z1).toBeLessThan(L.house.z1);
  });
});

describe('Les traces du Gaillard : une par partie', () => {
  it('chaque mission a sa trace, avec sa partie (3+1+1)', () => {
    expect(Object.keys(GAILLARD.traces).sort()).toEqual([...MISSIONS].sort());
    expect(MISSIONS.map((m) => [GAILLARD.traces[m].stage, GAILLARD.traces[m].row])).toEqual([
      [0, 0],
      [0, 1 / 3],
      [0, 2 / 3],
      [1, 0],
      [2, 0],
    ]);
  });

  it('la trace d’une mission se montre quand sa mission est réussie et que sa partie est posée', () => {
    for (let n = 0; n <= 5; n++) expect(posedTraces('gaillard', upTo(n), MISSIONS), String(n)).toEqual(MISSIONS.slice(0, n));
    expect(posedTraces('gaillard', [WHOLE], MISSIONS)).toEqual(MISSIONS);
    expect(posedTraces('gaillard', upTo(1), ['past-simple'])).toEqual([]);
    expect(traceStagePosed('gaillard', upTo(1))).toBe(true);
    expect(traceStagePosed('gaillard', upTo(0))).toBe(false);
    for (const m of MISSIONS) expect(placeTrace('gaillard', [m]).triangles, m).toBeGreaterThan(0);
    expect(placeTrace('gaillard', []).triangles).toBe(0);
  });

  it('les traces se tiennent à gauche de la porte (la palette, le rouleau, la caisse, les pinceaux), le seau à droite, au pied de l’aile', () => {
    for (const m of ['ing', 'past-simple', 'comparatives', 'portraits']) expect(GAILLARD.traces[m].at.x, m).toBeLessThan(-1.2);
    const bucket = GAILLARD.traces.sentences.at;
    expect(bucket.x).toBeGreaterThan(L.wing.x0);
    expect(bucket.x).toBeLessThan(L.wing.x1);
    expect(bucket.z).toBeGreaterThan(L.wing.z1);
    expect(bucket.z - L.wing.z1).toBeLessThan(1);
    // Ni sur le perron, ni sous la perche de la peintre.
    for (const m of MISSIONS) expect(Math.hypot(GAILLARD.traces[m].at.x - L.perch.x, GAILLARD.traces[m].at.z - L.perch.z), m).toBeGreaterThan(1.5);
  });
});

describe('La scénette du Gaillard', () => {
  it('la peintre, sans prénom, à droite ; Kéo à gauche, à plus de deux unités d’elle, sur les dalles de la cour', () => {
    expect(scenetteOf('gaillard').role).toBe('La peintre');
    expect(scenetteOf('gaillard').greeting).toBe('La peintre peint les bateaux des capitaines sur ses toiles.');
    const keo = scenetteKeo('gaillard').at;
    const h = scenetteHabitant('gaillard');
    expect(h.x - keo.x).toBeGreaterThan(2);
    expect(Math.abs(h.y - keo.y)).toBeLessThan(1e-6);
    // Le sol de la scène est le dessus des dalles.
    expect(keo.y).toBeCloseTo(L.heightAtCenter + L.yardY(L.scene.dx, L.scene.dz), 2);
    // La peintre devant la façade, à droite de la porte, près de sa lanterne ; Kéo à gauche.
    expect(h.x - PLACE.center.x).toBeGreaterThan(1);
    expect(Math.hypot(h.x - PLACE.center.x - L.perch.x, h.z - PLACE.center.z - L.perch.z)).toBeLessThan(3);
    expect(keo.x - PLACE.center.x).toBeLessThan(0);
    const items = placeItems('gaillard', 'english-5e-grammar-ing-1', [{ key: 'a', choices: ['is reading', 'reads'], answer: 'is reading' }]);
    expect(items[0].placeScene).toEqual({ kind: 'rest' });
  });

  it('une petite toile choisie se soulève d’un cran : sa forme ne change pas, sa place si', () => {
    const at = [{ x: 0, y: 0, z: 0 }];
    const still = answerObjects('gaillard', at, 1, { picked: [] });
    const picked = answerObjects('gaillard', at, 1, { picked: [0] });
    expect(picked.triangles).toBe(still.triangles);
    expect(topOf(picked) - topOf(still)).toBeGreaterThan(0.15);
    // Plus petite que les cadres de la galerie, et un peu penchée : son haut en arrière de son pied.
    const one = new FacetBuilder();
    GAILLARD.answer!.object(one, { x: 0, y: 0, z: 0 }, 1, 0, 1, false);
    const canvas = one.build();
    const ys = canvas.positions.filter((_, i) => i % 3 === 1);
    const zs = canvas.positions.filter((_, i) => i % 3 === 2);
    expect(Math.max(...ys) - Math.min(...ys)).toBeLessThan(L.frame.h);
    expect(Math.max(...zs) - Math.min(...zs)).toBeGreaterThan(0.15);
  });

  it('la roche qui cadre, dans le cadre à 1024 × 768, sur la cour, à l’écart du seau ; sous le plafond commun', () => {
    const [w, h] = [1024, 768];
    const stage = scenetteLayout({ count: 3 }, w, h, questionLayout({ count: 3 }, w, h)).scenette!.stage;
    const { pose, shift } = scenettePose('gaillard', stage, w, h);
    const floor = sceneSpot('gaillard');
    const { rock } = GAILLARD_SURROUNDINGS;
    for (const dx of [rock.dx - rock.r, rock.dx + rock.r]) {
      const p = screenOf(pose, { x: floor.x + dx, y: floor.y + 0.3, z: floor.z + rock.dz }, w, h);
      expect(p.x - shift.x, String(dx)).toBeGreaterThan(stage.left);
      expect(p.x - shift.x, String(dx)).toBeLessThan(stage.right);
    }
    const at = { x: L.scene.dx + rock.dx, z: L.scene.dz + rock.dz };
    expect(at.z + rock.r).toBeLessThan(L.yard.z1);
    expect(Math.hypot(at.x - GAILLARD.traces.sentences.at.x, at.z - GAILLARD.traces.sentences.at.z)).toBeGreaterThan(2);
    for (const posed of [false, true])
      for (const open of [false, true]) {
        const f = scenetteSurroundings('gaillard', open, posed);
        expect(f.triangles).toBeGreaterThan(0);
        expect(f.triangles).toBeLessThanOrEqual(SURROUNDINGS_MAX);
      }
  });

  it('la peintre se montre en modèle 3D ; aucun nom du contenu', () => {
    expect(hasHabitantModel('gaillard')).toBe(true);
    const said = `${scenetteOf('gaillard').role} ${scenetteOf('gaillard').greeting ?? ''}`;
    expect(said).not.toMatch(/Moustache|Spectre|manoir|salon|jardin|portrait|galerie|navire|poupe|longue-vue/i);
  });
});

describe('Le bilan du Gaillard nomme la partie par son étape', () => {
  it('« Partie posée : le corps du Gaillard, 1 sur 3. », puis le haut et les abords ; jamais le nom d’un plan', () => {
    const parties = partiesDe(ISLAND);
    expect(parties).toHaveLength(5);
    const words = stagePoseWords(ISLAND, PLACE);
    const said = (k: number) => phraseDeLaPose({ posees: [parties[k]], plansFinis: [] }, words);
    expect(said(0)).toBe('Partie posée : le corps du Gaillard, 1 sur 3.');
    expect(said(3)).toBe('Partie posée : le haut du Gaillard.');
    expect(said(4)).toBe('Partie posée : les abords du Gaillard.');
    for (let k = 0; k < 5; k++) for (const plan of plansFor(ISLAND)) expect(said(k)).not.toContain(plan.done);
    for (let k = 0; k < 5; k++) expect(said(k)).not.toMatch(/Moustache|Spectre|manoir|salon|jardin/i);
  });
});

describe('Le Gaillard sur la Carte', () => {
  it('son nom au même point en ruine et restauré, sur l’axe du faîte, au-dessus des cheminées', () => {
    expect(GAILLARD.mapPoint).toEqual(L.mapPoint);
    expect(L.mapPoint.y - L.houseY - L.house.ridge - L.chimney.above).toBeGreaterThan(1.5);
    expect(L.mapPoint.x).toBe(0);
    expect(L.mapPoint.z).toBe(L.house.ridgeZ);
  });
});

describe('« Y aller » au Gaillard', () => {
  const door = PATH_NODES_5E.find((n) => n.id === 'gaillard')!.at;
  const feet = { x: door.x, y: standingHeight(heightAt5e(door)), z: door.z };
  // La vue d'arrivée du lieu, toute montée (retouche 1).
  const pose = followPose(feet, 0, undefined, doorViewOf('gaillard'), 1, undefined, doorFrameOf('gaillard')!);
  const W = 1024,
    H = 768;
  const world = (x: number, z: number, y: number) => ({ x: PLACE.center.x + x, y: L.heightAtCenter + y, z: PLACE.center.z + z });
  const at = (x: number, z: number, y: number) => screenOf(pose, world(x, z, y), W, H);
  const inFrame = (p: { x: number; y: number }, what: string) => {
    expect(p.x, what).toBeGreaterThan(0);
    expect(p.x, what).toBeLessThan(W);
    expect(p.y, what).toBeGreaterThan(0);
    expect(p.y, what).toBeLessThan(H);
  };

  it('la caméra arrive tournée de 20 à 30° vers l’est : la maison entière, au centre, son aile et le socle dans le cadre', () => {
    const cap = (-doorViewOf('gaillard') * 180) / Math.PI;
    expect(cap).toBeGreaterThanOrEqual(20);
    expect(cap).toBeLessThanOrEqual(30);
    const Ho = L.house;
    const y = L.houseY;
    // Les coins du socle, de l'égout, le faîte et le haut des deux cheminées ; l'aile.
    for (const x of [-Ho.x - Ho.overhang, Ho.x + Ho.overhang])
      for (const z of [Ho.z0, Ho.z1]) {
        inFrame(at(x, z, y), `socle ${x} ${z}`);
        inFrame(at(x, z, y + Ho.eave), `égout ${x} ${z}`);
      }
    // Le haut des cheminées, chapeau compris, à 12 pixels au moins du bord haut (retouche 0 : rien ne touche le bord).
    for (const side of [-1, 1]) {
      const top = at(side * L.chimney.x, Ho.ridgeZ, y + Ho.ridge + L.chimney.above + 0.16);
      inFrame(top, `cheminée ${side}`);
      expect(top.y, `cheminée ${side}`).toBeGreaterThan(12);
    }
    inFrame(at(L.wing.x1 + L.wing.overhang, L.wing.z1, y), 'aile');
    inFrame(at(L.spyglass.x, L.spyglass.z, y + L.spyglass.h), 'socle');
    // La maison au milieu de l'image : le milieu de son long pan à moins d'un sixième du centre.
    expect(Math.abs(at(1.7, Ho.z1, y + 4).x - W / 2)).toBeLessThan(W / 6);
  });

  it('au retour d\u2019une scénette, la vue de retour lit la même vue d\u2019arrivée : la trace gagnée et Kéo dans le champ, la maison entière, cheminées comprises', () => {
    for (const mission of BUILT_PLACES_5E.gaillard) {
      const exit = scenetteExit('gaillard', true, mission)!;
      const feetBack = { x: exit.at.x, y: standingHeight(heightAt5e(exit.at)), z: exit.at.z };
      const back = followPose(feetBack);
      exitView(back, exit.keep, feetBack, 1, traceViewOf('gaillard'));
      const Ho = L.house;
      const y = L.houseY;
      for (const p of [feetBack, exit.keep]) inFrame(screenOf(back, p, W, H), `${mission} trace`);
      for (const side of [-1, 1]) {
        const top = screenOf(back, world(side * L.chimney.x, Ho.ridgeZ, y + Ho.ridge + L.chimney.above + 0.16), W, H);
        expect(top.y, `${mission} cheminée ${side}`).toBeGreaterThan(0);
      }
    }
  });

  it('aucun poteau de la galerie devant un cadre : chacun tombe entre deux cadres, vu de la caméra', () => {
    const y = L.houseY;
    const F = L.frame;
    const z = L.loggia.back + F.depth;
    const frames = L.bays.map((x) => [at(x - F.w / 2, z, y + F.y0 + F.h / 2).x, at(x + F.w / 2, z, y + F.y0 + F.h / 2).x]);
    for (const px of L.posts)
      for (const h of [F.y0, F.y0 + F.h]) {
        const left = Math.min(at(px - L.loggia.post / 2, L.loggia.postZ + L.loggia.post / 2, y + h).x, at(px - L.loggia.post / 2, L.loggia.postZ - L.loggia.post / 2, y + h).x);
        const right = Math.max(at(px + L.loggia.post / 2, L.loggia.postZ + L.loggia.post / 2, y + h).x, at(px + L.loggia.post / 2, L.loggia.postZ - L.loggia.post / 2, y + h).x);
        for (const [a, b] of frames) expect(right <= a || left >= b, `poteau ${px} à ${h}`).toBe(true);
      }
    // La lanterne de la galerie non plus.
    const G = L.galleryLantern;
    const lx = [at(G.x - 0.12, G.z, y + G.y - 0.2).x, at(G.x + 0.12, G.z, y + G.y - 0.2).x];
    for (const [a, b] of frames) expect(lx[1] <= a || lx[0] >= b).toBe(true);
  });

  it('les cadres au-dessus de la main courante, vus de la caméra', () => {
    const y = L.houseY;
    for (const x of L.bays) expect(at(x, L.loggia.back + L.frame.depth, y + L.frame.y0).y).toBeLessThan(at(x, L.loggia.railZ, y + L.loggia.rails[1] + 0.08).y);
  });

  it('la caméra reste sur le plateau, au-dessus de Kéo, plus reculée et moins plongeante que la caméra qui suit', () => {
    expect(pose.position.y - feet.y).toBeGreaterThanOrEqual(FOLLOW.height - 1e-9);
    expect(heightAt5e({ x: pose.position.x, z: pose.position.z })).toBeGreaterThan(10);
    expect(plateauShare({ x: pose.position.x, z: pose.position.z })).toBeGreaterThanOrEqual(0.8);
    const follow = followPose(feet, 0, undefined, doorViewOf('gaillard'));
    const dip = (p: typeof pose) => (p.position.y - p.target.y) / Math.hypot(p.target.x - p.position.x, p.target.z - p.position.z);
    expect(dip(pose)).toBeLessThan(dip(follow));
    expect(Math.hypot(pose.position.x - feet.x, pose.position.z - feet.z)).toBeGreaterThan(Math.hypot(follow.position.x - feet.x, follow.position.z - feet.z));
    // L'aiguille de l'est dans le cadre, à droite de la maison.
    const needle = NEEDLES_5E.filter((n) => n.at.x > PLACE.center.x + 20).sort((a, b) => Math.hypot(a.at.x - PLACE.center.x, a.at.z - PLACE.center.z) - Math.hypot(b.at.x - PLACE.center.x, b.at.z - PLACE.center.z))[0];
    const n = screenOf(pose, { x: needle.at.x, y: L.heightAtCenter + 5, z: needle.at.z }, W, H);
    expect(n.x).toBeGreaterThan(at(L.wing.x1, L.wing.z1, L.houseY).x);
    expect(n.x).toBeLessThan(W);
  });

  it('seuls le Gaillard et les Nacelles (lot 16, leur mât) ont leur vue d’arrivée : les autres lieux arrivent avec la caméra qui suit', () => {
    for (const p of PLAN.places) if (!['gaillard', 'nacelles'].includes(p.id)) expect(doorFrameOf(p.id), p.id).toBeNull();
    for (const p of planFor('6e').places) expect(doorFrameOf(p.id), p.id).toBeNull();
  });

  it('les autres lieux du 5e gardent leur cap, sauf les Instants, les Radeaux, l’Oracle, le Sémaphore et le Gaillard', () => {
    for (const p of PLAN.places) if (!['instants', 'radeaux', 'oracle', 'semaphore', 'gaillard'].includes(p.id)) expect(doorViewOf(p.id), p.id).toBe(0);
  });
});

describe('Le plateau autour du Gaillard', () => {
  it('la brume de décor reste à 25 unités au moins du lieu ; ses aiguilles bien plus hautes que lui', () => {
    for (const s of riftMistSpots()) expect(Math.hypot(s.at.x - PLACE.center.x, s.at.z - PLACE.center.z) - s.radius).toBeGreaterThanOrEqual(25);
    const near = NEEDLES_5E.filter((n) => Math.hypot(n.at.x - PLACE.center.x, n.at.z - PLACE.center.z) < 60);
    expect(near.length).toBeGreaterThan(0);
    for (const n of near) expect(n.height).toBeGreaterThan(2 * L.house.ridge);
  });
});

/**
 * Le budget du 5e au lot 14, avant le Gaillard (les chaussées, le Donjon, l'Oracle, la forêt retaillée et le Sémaphore :
 * `npm run rendu:budget -- --archipel 6e,5e` sur `preview` 03f4750f, 21 octobre 2026), scénette ouverte.
 */
const LOT14_OPEN_5E = { triangles: 111_605, calls: 19 } as const;

describe('Le budget du 5e, avec le Gaillard (plafonds du lot 15)', () => {
  it('scénette ouverte : le lot 14 et un lieu de plus au plus par lieu fini depuis, sans appel de plus ; la peintre dans les deux appels de la scénette', () => {
    const cost = openWorldCost5e();
    const triangles = cost.reduce((a, p) => a + p.triangles, 0);
    const calls = cost.reduce((a, p) => a + p.calls, 0);
    // Les lieux finis depuis le lot 14 : le Gaillard (lot 15), les Nacelles (lot 16) ; le Perchoir (lot 16), son plafond propre.
    const since = Object.keys(BUILT_PLACES_5E).filter((id) => !['montee', 'hameau', 'radeaux', 'croisee', 'instants', 'fumerolles', 'etuve', 'terrasses', 'auberge', 'donjon', 'oracle', 'semaphore'].includes(id)).length;
    expect(since).toBeGreaterThanOrEqual(1);
    expect(triangles).toBeLessThanOrEqual(LOT14_OPEN_5E.triangles + since * PLACE_TRIANGLES_MAX_5E + PERCHOIR_TRIANGLES_MAX);
    expect(calls).toBeLessThanOrEqual(LOT14_OPEN_5E.calls);
    expect(cost.find((c) => c.poste === 'scénette')!.calls).toBe(2);
  });
});
