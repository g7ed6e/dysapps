// L'Auberge (GD-22, lot 12) : le lieu par parties (3 + 1 + 1), une seule lanterne allumée dans la ruine et trois au plus,
// une trace par mission avec sa partie, la même pour la mission de même rang des deux langues, le signe de la cloche
// prise, le pichet de l'enseigne, la lanterne du pignon à son angle ouest, le ponton sur l'eau, rien sur le chemin de
// marche, la scénette sur le parvis, la valise que Kéo ne cache pas, ses abords dans le cadre, le cap nord de « Y aller »
// (la maison entière, le ponton, la brouette), les plafonds de 1 600 et 1 200 triangles et le budget du 5e. Sans Three.js.
import { describe, expect, it } from 'vitest';
import type { BiomeId } from '../../biomes';
import { partShapes, stagePoseWords } from '../../three/archipeo/constructionParts';
import { phraseDeLaPose } from '../../poseWords';
import { partiesDe } from '../parts';
import { plansFor } from '../plans';
import { AUBERGE, AUBERGE_LAYOUT, AUBERGE_RANKS } from './auberge5e';
import { CAUSEWAYS_ADDED_5E, PLACE_TRIANGLES_MAX_5E, openWorldCost5e } from './budget';
import { AUBERGE_SURROUNDINGS } from './aubergeSurroundings';
import { FOLLOW, followPose, screenOf } from './camera';
import { posedTraces, traceStagePosed, WHOLE, type PartShape, type Stage } from './construction';
import type { Facets } from './facets';
import { linearRgb, type Vec2 } from './geometry';
import { hasHabitantModel } from './habitants';
import { hasScenette, planFor } from './levelPlan';
import { doorViewOf } from './northShore';
import { BUILT_PLACES_5E, COLORS_5E, PATH_NODES_5E, TERRAIN_5E } from './plan5e';
import { drawPieces, placePieces, ruinOf } from './places';
import { placeItems } from './questions';
import { answerObjects, placeTrace, questionLayout, sceneSpot } from './questionScene';
import { scenetteHabitant, scenetteKeo, scenetteLayout, scenetteOf, scenettePose, scenetteSurroundings } from './scenette';
import { SURROUNDINGS_MAX } from './surroundings';
import { standingHeight } from './terrain';
import { heightAt5e, obstaclesIn5e } from './terrain5e';

const PLAN = planFor('5e');
const PLACE = PLAN.places.find((p) => p.id === 'auberge')!;
const ISLAND = PLACE.island as BiomeId;
const MISSIONS = [...BUILT_PLACES_5E.auberge];
const SPANISH = MISSIONS.filter((m) => m.startsWith('es-'));
const SHAPES = partShapes(ISLAND);

/** La ruine de l'Auberge au plus, et le lieu au plus chargé (intention du directeur artistique, « Le budget »). */
const AUBERGE_RUIN_MAX = 1_200;

/** Les `n` premières parties posées (0 : la ruine, 5 : tout). */
const upTo = (n: number): PartShape[] => SHAPES.slice(0, n);
const takes = (parts: readonly PartShape[], stage: Stage, row: number) => parts.some((part) => part.some((s) => s.stage === stage && row >= s.from - 1e-9 && row < s.to - 1e-9));

/** Ce que le lieu montre, ses `n` premières parties posées : la ruine qui reste, les rangées posées. */
function shown(n: number): Facets {
  const parts = upTo(n);
  return drawPieces('auberge', (p) => (p.stage === 'ruine' ? !p.until || !takes(parts, p.until.stage, p.until.row) : takes(parts, p.stage, p.row)));
}

/** Les sommets d'une couleur exacte (la lanterne d'ocre, que la vue dessine sans ombre). */
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

describe('L’Auberge, lieu complet', () => {
  it('ses dix missions, cinq par langue, se jouent dans sa scénette, en cinq parties : trois au corps, le haut, les abords', () => {
    expect(PLACE.scenes).toEqual(MISSIONS);
    expect(MISSIONS).toHaveLength(10);
    expect(hasScenette('auberge')).toBe(true);
    expect(SHAPES.map((p) => p.map((s) => [s.stage, s.from, s.to]))).toEqual([[[0, 0, 1 / 3]], [[0, 1 / 3, 2 / 3]], [[0, 2 / 3, 1]], [[1, 0, 1]], [[2, 0, 1]]]);
  });

  it('chaque partie pose quelque chose ; la ruine part avec la rangée qui la remplace', () => {
    const pieces = placePieces('auberge');
    expect([...new Set(pieces.filter((p) => p.stage === 0).map((p) => p.row))]).toEqual([0, 1 / 3, 2 / 3]);
    for (let n = 1; n <= 5; n++) expect(shown(n).triangles, String(n)).not.toBe(shown(n - 1).triangles);
    const fallen = pieces.filter((p) => p.stage === 'ruine' && p.until).map((p) => `${p.until!.stage}/${p.until!.row}`);
    expect(new Set(fallen)).toEqual(new Set(['0/0', `0/${1 / 3}`, `0/${2 / 3}`, '1/0', '2/0']));
  });

  it('coûte au plus 1 600 triangles à son état le plus chargé, traces comprises ; la ruine, 1 200 au plus', () => {
    let worst = 0;
    for (let n = 0; n <= 5; n++) {
      const traces = placeTrace('auberge', posedTraces('auberge', upTo(n), MISSIONS)).triangles;
      worst = Math.max(worst, shown(n).triangles + traces);
    }
    expect(worst).toBeLessThanOrEqual(PLACE_TRIANGLES_MAX_5E);
    expect(shown(0).triangles).toBeLessThanOrEqual(AUBERGE_RUIN_MAX);
    // Le plus chargé est le lieu restauré, toutes les traces posées : le budget le compte ainsi.
    expect(shown(5).triangles + placeTrace('auberge', MISSIONS).triangles).toBe(worst);
  });

  it('une seule lanterne allumée dans la ruine, celle de l’aubergiste ; le haut allume celle du pignon, les abords celle du ponton : trois au plus', () => {
    // Une lanterne : sa vitre, un pavé (dix triangles, trente sommets).
    const lit = (n: number) => countColor(shown(n), COLORS_5E.lantern);
    expect(lit(0)).toBe(30);
    expect(lit(3)).toBe(30);
    expect(lit(4)).toBe(60);
    expect(lit(5)).toBe(90);
    // La lanterne éteinte de la ruine, couchée au pied du ponton, part avec les abords.
    expect(countColor(shown(0), 0xbfc4b8)).toBe(30);
    expect(countColor(shown(5), 0xbfc4b8)).toBe(0);
  });

  it('le signe de la cloche prise ne change jamais : l’empreinte de la plaque, son trou au tiers haut, ses goujons aux coins', () => {
    // Parmi ce qui reste toujours (la ruine sans ce qui tombe), seul le trou du poteau ouest a le brun très sombre : un
    // aplat à huit pans, six triangles ; l'empreinte rectangulaire, d'un bois moins passé, deux triangles.
    expect(countColor(ruinOf('auberge'), 0x3a312c)).toBe(18);
    expect(countColor(ruinOf('auberge'), 0x7a5c47)).toBe(6);
    const B = AUBERGE_LAYOUT.bellMark;
    expect(B.y).toBeGreaterThan(1.2);
    expect(B.y).toBeLessThan(1.6);
    // Une empreinte debout, d'environ 0,30 × 0,48, sur la face du poteau.
    expect(B.h / B.w).toBeGreaterThan(1.4);
    expect(B.w).toBeLessThan(AUBERGE_LAYOUT.balcony.post - 0.1);
    // Le trou entier dans le tiers haut de l'empreinte, jamais au milieu (la face 5 d'un dé).
    expect(B.hole - B.r).toBeGreaterThanOrEqual(B.h / 6 - 1e-9);
    expect(B.hole + B.r).toBeLessThanOrEqual(B.h / 2);
    // Les quatre goujons aux quatre coins, dans l'empreinte, à l'écart du trou : un rectangle, jamais une croix.
    const dx = B.w / 2 - B.inset;
    const dy = B.h / 2 - B.inset;
    expect(dx + B.stud / 2).toBeLessThanOrEqual(B.w / 2);
    expect(dy + B.stud / 2).toBeLessThanOrEqual(B.h / 2);
    expect(dx - B.stud / 2).toBeGreaterThan(B.r);
    expect(dy).toBeGreaterThan(dx);
    expect(AUBERGE_LAYOUT.balcony.post).toBeGreaterThanOrEqual(0.5);
  });

  it('le pichet de l’enseigne, une cruche : 1,3 de haut pour 1 de large, panse, col, lèvre, pied, anse arrondie sous le col', () => {
    const J = AUBERGE_LAYOUT.jug;
    const all = AUBERGE_LAYOUT.jugPlates.flat();
    const xs = all.map(([x]) => x);
    const ys = all.map(([, y]) => y);
    const ratio = (Math.max(...ys) - Math.min(...ys)) / (Math.max(...xs) - Math.min(...xs));
    expect(ratio).toBeGreaterThan(1.2);
    expect(ratio).toBeLessThan(1.4);
    // Le pied plus étroit que la panse, le col resserré, la lèvre évasée.
    expect(J.foot).toBeLessThan(J.belly - 0.08);
    expect(J.neck).toBeLessThan(J.shoulder);
    expect(J.lip).toBeGreaterThan(J.neck + 0.04);
    expect(J.y.belly).toBeLessThan(J.y.high);
    // Dans la planche à huit pans (son rayon intérieur), sans dépasser.
    const inner = AUBERGE_LAYOUT.sign.r * Math.cos(Math.PI / 8);
    for (const [x, y] of all) expect(Math.hypot(x, y)).toBeLessThan(inner);
    // Chaque aplat est convexe et tourné vers la rue (il se dessine en éventail).
    for (const plate of AUBERGE_LAYOUT.jugPlates)
      for (let k = 0; k < plate.length; k++) {
        const [a, b, c] = [plate[k], plate[(k + 1) % plate.length], plate[(k + 2) % plate.length]];
        expect((b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0])).toBeGreaterThan(0);
      }
    // L'anse : son arc et la panse symétrique, au test suivant (retouche 2).
    // Sans ocre : le pichet a sa couleur pâle, l'ocre n'est qu'aux lanternes.
    expect(countColor(shown(5), 0xdccdb0)).toBe(3 * AUBERGE_LAYOUT.jugPlates.reduce((n, p) => n + p.length - 2, 0));
  });

  it('l’anse de la cruche, un arc d’au moins trois segments sans angle franc (moins de 60° à chaque jonction) ; la panse symétrique autour de l’axe du col (retouche 2)', () => {
    const J = AUBERGE_LAYOUT.jug;
    const H = J.handle;
    expect(H.length - 1).toBeGreaterThanOrEqual(3);
    // Du col (elle y part, dans sa largeur) à la panse, jamais au-dessus du haut du col, même son épaisseur comprise.
    expect(H[0][1]).toBeGreaterThan(J.y.neck);
    expect(H[0][1]).toBeLessThan(J.y.lip);
    expect(H[0][0]).toBeLessThan(J.neck);
    const handlePlates = AUBERGE_LAYOUT.jugPlates.slice(-(H.length - 1));
    const handleSides = handlePlates.flat();
    expect(Math.max(...handleSides.map(([, y]) => y))).toBeLessThan(J.y.lip);
    // Aucun angle de l'anse au-delà de 60°, ni sur son axe ni sur ses deux bords.
    const turns = (pts: readonly (readonly [number, number])[]) =>
      pts.slice(1, -1).map((p, k) => {
        const [a, c] = [pts[k], pts[k + 2]];
        const u = [p[0] - a[0], p[1] - a[1]];
        const v = [c[0] - p[0], c[1] - p[1]];
        return (Math.acos((u[0] * v[0] + u[1] * v[1]) / (Math.hypot(u[0], u[1]) * Math.hypot(v[0], v[1]))) * 180) / Math.PI;
      });
    const outer = [handlePlates[0][0], ...handlePlates.map((q) => q[1])];
    const inner = [handlePlates[0][3], ...handlePlates.map((q) => q[2])];
    for (const line of [H, outer, inner]) for (const t of turns(line)) expect(t).toBeLessThan(60);
    // La panse : chaque sommet a son reflet exact de l'autre côté de l'axe du col.
    const body = AUBERGE_LAYOUT.jugPlates[0];
    for (const [x, y] of body) expect(body.some(([x2, y2]) => Math.abs(x2 - (2 * J.cx - x)) < 1e-9 && Math.abs(y2 - y) < 1e-9)).toBe(true);
    // L'anse rentre dans la panse au-dessus de son ventre : le contour de la panse, à sa plus grande largeur et
    // au-dessous, reste le même des deux côtés ; son bout est dans la panse (entre l'épaule et le ventre).
    expect(Math.min(...handleSides.map(([, y]) => y))).toBeGreaterThan(J.y.belly);
    const [ex, ey] = H[H.length - 1];
    expect(ey).toBeGreaterThan(J.y.belly);
    expect(ey).toBeLessThan(J.y.high);
    expect(ex + J.thick / 2).toBeLessThan(J.high);
  });

  it('la lanterne du pignon est fixée au mur, à l’angle ouest du pignon, à l’écart de la fenêtre et de l’enseigne', () => {
    const L = AUBERGE_LAYOUT.gableLantern;
    const H = AUBERGE_LAYOUT.house;
    const W = AUBERGE_LAYOUT.window;
    expect(L.x).toBeLessThan(AUBERGE_LAYOUT.gableWindows.etage[0] - W - 0.4);
    expect(L.x).toBeGreaterThan(-H.x + 0.3);
    // Au-dessus des fenêtres de l'étage, sous le toit, loin sous l'enseigne : ni sous elle, ni entre les deux fenêtres.
    expect(L.y - 0.34).toBeGreaterThan(AUBERGE_LAYOUT.gableWindows.etageY + W);
    expect(L.y).toBeLessThan(H.etage + (L.x + H.x) * ((H.ridge - H.etage) / H.x) - 0.1);
    expect(Math.abs(L.x)).toBeGreaterThan(AUBERGE_LAYOUT.sign.r + 1.5);
  });

  it('la maison tourne son pignon au parvis : faîtage nord-sud, 7 de large, le rez à 3, le faîte près de 8', () => {
    const H = AUBERGE_LAYOUT.house;
    expect(2 * H.x).toBeCloseTo(7, 6);
    expect(H.z1 - H.z0).toBeGreaterThanOrEqual(8);
    expect(H.rez).toBe(3);
    expect(H.ridge).toBeGreaterThan(7.5);
    // Le balcon court sur la largeur du pignon, devant la porte ; la table, à ciel ouvert, au sud du balcon.
    expect(AUBERGE_LAYOUT.table.z0).toBeGreaterThan(AUBERGE_LAYOUT.balcony.z1);
    expect(AUBERGE_LAYOUT.table.x).toBeLessThan(-AUBERGE_LAYOUT.balcony.x);
  });

  it('au bord de la mer : le ponton part du bord est du parvis, passe la vase, son dernier tiers sur l’eau', () => {
    const at = (p: Vec2) => ({
      x: PLACE.center.x + p.x,
      z: PLACE.center.z + p.z,
    });
    const P = AUBERGE_LAYOUT.pontoon;
    expect(P.start.x).toBeCloseTo(AUBERGE_LAYOUT.parvis[1][0], 6);
    expect(heightAt5e(at(P.start))).toBeGreaterThan(0);
    expect(heightAt5e(at(P.end))).toBeLessThan(0);
    // Le dernier tiers, trois unités au moins, au-dessus de l'eau des rives, sur toute la largeur du tablier.
    expect(P.len / 3).toBeGreaterThanOrEqual(3);
    for (let s = (2 * P.len) / 3; s <= P.len + 1e-9; s += 0.25) for (const t of [-P.half, 0, P.half]) expect(heightAt5e(at(P.at(s, t))), `${s} ${t}`).toBeLessThan(0);
    // La vase avant l'eau : le premier tiers sur la terre.
    for (let s = 0; s <= P.len / 3; s += 0.5) expect(heightAt5e(at(P.at(s, 0))), String(s)).toBeGreaterThan(0);
  });

  it('rien de la ruine sur le chemin de marche, d’`aub-1` à la porte', () => {
    const door = AUBERGE_LAYOUT.door;
    const aub1 = AUBERGE_LAYOUT.aub1;
    const ground = (x: number, z: number) => standingHeight(heightAt5e({ x: PLACE.center.x + x, z: PLACE.center.z + z })) - AUBERGE_LAYOUT.heightAtCenter;
    const ruin = drawPieces('auberge', (p) => p.stage === 'ruine');
    for (let i = 0; i < ruin.positions.length; i += 3) {
      const p = { x: ruin.positions[i], z: ruin.positions[i + 2] };
      // Ce qui passe haut au-dessus de la tête de Kéo (le balcon, le toit) ne gêne pas la marche.
      if (ruin.positions[i + 1] - ground(p.x, p.z) > 2) continue;
      expect(toSegment(p, aub1, door), `${p.x.toFixed(2)} ${p.z.toFixed(2)}`).toBeGreaterThan(0.9);
    }
  });
});

describe('Les traces de l’Auberge : une par partie, la même pour les deux langues', () => {
  it('la trace de rang n est la même pour es-<n> et de-<n>, avec la même partie', () => {
    for (const rank of AUBERGE_RANKS) {
      const es = AUBERGE.traces[`es-${rank}`];
      const de = AUBERGE.traces[`de-${rank}`];
      expect(es, rank).toBeDefined();
      expect(de, rank).toBe(es);
    }
    expect(Object.keys(AUBERGE.traces).sort()).toEqual([...MISSIONS].sort());
    expect(AUBERGE_RANKS.map((r) => [AUBERGE.traces[`es-${r}`].stage, AUBERGE.traces[`es-${r}`].row])).toEqual([
      [0, 0],
      [0, 1 / 3],
      [0, 2 / 3],
      [1, 0],
      [2, 0],
    ]);
  });

  it('la trace d’une mission se montre quand sa mission est réussie et que sa partie est posée, dans chaque langue', () => {
    for (const lang of ['es-', 'de-']) {
      const done = MISSIONS.filter((m) => m.startsWith(lang));
      for (let n = 0; n <= 5; n++) expect(posedTraces('auberge', upTo(n), done), `${lang}${n}`).toEqual(done.slice(0, n));
    }
    expect(posedTraces('auberge', [WHOLE], MISSIONS)).toEqual(MISSIONS);
    expect(posedTraces('auberge', upTo(1), ['de-numbers'])).toEqual([]);
    expect(traceStagePosed('auberge', upTo(1))).toBe(true);
    expect(traceStagePosed('auberge', upTo(0))).toBe(false);
  });

  it('chaque trace se dessine seule ; une trace réussie dans les deux langues se dessine une fois', () => {
    for (const m of MISSIONS) expect(placeTrace('auberge', [m]).triangles, m).toBeGreaterThan(0);
    expect(placeTrace('auberge', []).triangles).toBe(0);
    expect(placeTrace('auberge', MISSIONS).triangles).toBe(placeTrace('auberge', SPANISH).triangles);
    expect(placeTrace('auberge', ['es-greetings', 'de-greetings']).triangles).toBe(placeTrace('auberge', ['de-greetings']).triangles);
  });

  it('les traces se tiennent à gauche de la porte (la valise, le plateau, la couverture, le balai), la brouette au pied du ponton', () => {
    for (const rank of ['greetings', 'numbers', 'family', 'articles'] as const) expect(AUBERGE.traces[`es-${rank}`].at.x, rank).toBeLessThan(-0.6);
    const barrow = AUBERGE.traces['es-sentences'].at;
    const start = AUBERGE_LAYOUT.pontoon.start;
    expect(Math.hypot(barrow.x - start.x, barrow.z - start.z)).toBeLessThan(2.5);
  });
});

describe('La scénette de l’Auberge', () => {
  it('l’aubergiste, sans prénom, à droite ; Kéo à gauche, à plus de deux unités d’elle, sur les dalles du parvis', () => {
    expect(scenetteOf('auberge').role).toBe('L’aubergiste');
    expect(scenetteOf('auberge').greeting).toBe('L’aubergiste sert les repas et prépare les lits des voyageurs.');
    const keo = scenetteKeo('auberge').at;
    const h = scenetteHabitant('auberge');
    expect(h.x - keo.x).toBeGreaterThan(2);
    expect(Math.abs(h.y - keo.y)).toBeLessThan(1e-6);
    const s = sceneSpot('auberge');
    expect(s.z - PLACE.center.z).toBeCloseTo(AUBERGE_LAYOUT.scene.dz, 6);
    // Le sol de la scène est le dessus des dalles.
    expect(keo.y).toBeCloseTo(AUBERGE_LAYOUT.heightAtCenter + AUBERGE_LAYOUT.parvisTop, 2);
    // L'aubergiste se tient devant la façade, à droite de la porte ; Kéo à gauche.
    expect(h.x - PLACE.center.x).toBeGreaterThan(1);
    expect(keo.x - PLACE.center.x).toBeLessThan(0);
    const items = placeItems('auberge', 'lv2-5e-introductions-es-greetings-1', [
      {
        key: 'a',
        choices: ['Me llamo Lucía.', 'Tengo doce años.'],
        answer: 'Me llamo Lucía.',
      },
    ]);
    expect(items[0].placeScene).toEqual({ kind: 'rest' });
    expect(AUBERGE.answer).toBeDefined();
  });

  it('Kéo ne cache pas la valise, sur le banc de pierre, à 1024 × 768 comme à 390 × 844 ; le balai entre le banc et la porte', () => {
    const keo = scenetteKeo('auberge');
    const S = AUBERGE_LAYOUT.stoneBench;
    const valise = AUBERGE.traces['es-greetings'].at;
    // La valise sur le banc, le balai entre le banc et la porte.
    expect(Math.abs(valise.x - S.x)).toBeLessThan(S.w / 2 - 0.27);
    const broom = AUBERGE.traces['es-articles'].at.x;
    expect(broom).toBeGreaterThan(S.x + S.w / 2);
    expect(broom).toBeLessThan(-0.55);
    const c = PLACE.center;
    const y0 = AUBERGE_LAYOUT.heightAtCenter + AUBERGE_LAYOUT.parvisTop;
    for (const [w, h] of [
      [1024, 768],
      [390, 844],
    ]) {
      const stage = scenetteLayout({ count: 3 }, w, h, questionLayout({ count: 3 }, w, h)).scenette!.stage;
      const { pose, shift } = scenettePose('auberge', stage, w, h);
      const sx = (x: number, y: number, z: number) => screenOf(pose, { x, y, z }, w, h).x - shift.x;
      // Kéo, à l'échelle de la scénette : 0,4 de part et d'autre de son axe ; la valise, 0,55 de large sur le banc.
      const keoLeft = Math.min(...[0, 0.8, 1.6].map((dy) => sx(keo.at.x - 0.4, keo.at.y + dy, keo.at.z)));
      const right = sx(c.x + valise.x + 0.28, y0 + S.h, c.z + valise.z);
      const left = sx(c.x + valise.x - 0.28, y0 + S.h, c.z + valise.z);
      expect(right, `${w}`).toBeLessThan(keoLeft - 6);
      expect(left, `${w}`).toBeGreaterThan(0);
    }
  });

  it('ses abords, la racine derrière le bout de la table et le rocher à l’est, dans le cadre à 1024 × 768 ; le rocher hors des débris', () => {
    const [w, h] = [1024, 768];
    const stage = scenetteLayout({ count: 3 }, w, h, questionLayout({ count: 3 }, w, h)).scenette!.stage;
    const { pose, shift } = scenettePose('auberge', stage, w, h);
    const floor = sceneSpot('auberge');
    const { root, rock } = AUBERGE_SURROUNDINGS;
    for (const [dx, dz] of [root.from, root.to, [rock.dx - rock.r, rock.dz], [rock.dx + rock.r, rock.dz]]) {
      const p = screenOf(pose, { x: floor.x + dx, y: floor.y + 0.3, z: floor.z + dz }, w, h);
      expect(p.x - shift.x, `${dx} ${dz}`).toBeGreaterThan(stage.left);
      expect(p.x - shift.x, `${dx} ${dz}`).toBeLessThan(stage.right);
    }
    // La racine derrière le bout nord de la table, vue du sud ; le rocher hors des débris du balcon tombé et du ponton.
    const T = AUBERGE_LAYOUT.table;
    const S = AUBERGE_LAYOUT.scene;
    expect(S.dz + root.from[1]).toBeLessThan(T.z0);
    expect(S.dz + root.to[1]).toBeLessThan(T.z0);
    const r = { x: S.dx + rock.dx, z: S.dz + rock.dz };
    // Le poteau est tombé (x 5,9, de z 1,2 à 3,8, demi-section 0,25).
    expect(Math.hypot(r.x - 5.9, Math.max(0, r.z - 3.8)) - 0.25).toBeGreaterThan(rock.r);
    expect(toSegment(r, AUBERGE_LAYOUT.pontoon.start, AUBERGE_LAYOUT.pontoon.end) - AUBERGE_LAYOUT.pontoon.half).toBeGreaterThan(rock.r);
  });

  it('une malle choisie se soulève d’un cran : sa forme ne change pas, sa place si', () => {
    const at = [{ x: 0, y: 0, z: 0 }];
    const still = answerObjects('auberge', at, 1, { picked: [] });
    const picked = answerObjects('auberge', at, 1, { picked: [0] });
    expect(picked.triangles).toBe(still.triangles);
    const top = (f: Facets) => Math.max(...f.positions.filter((_, i) => i % 3 === 1));
    expect(top(picked) - top(still)).toBeGreaterThan(0.15);
  });

  it('l’aubergiste se montre en modèle 3D', () => {
    expect(hasHabitantModel('auberge')).toBe(true);
  });

  it('ses abords tiennent sous le plafond commun, dans chaque état', () => {
    for (const posed of [false, true])
      for (const open of [false, true]) {
        const f = scenetteSurroundings('auberge', open, posed);
        expect(f.triangles).toBeGreaterThan(0);
        expect(f.triangles).toBeLessThanOrEqual(SURROUNDINGS_MAX);
      }
  });

  it('ne dit aucun nom du contenu (ni Lina, ni la Diligence, ni le relais)', () => {
    const said = `${scenetteOf('auberge').role} ${scenetteOf('auberge').greeting ?? ''}`;
    expect(said).not.toMatch(/Lina|Diligence|relais|écurie|fontaine|accueille/i);
  });
});

describe('Le bilan de l’Auberge nomme la partie par son étape', () => {
  it('« Partie posée : le corps de l’Auberge, 1 sur 3. », puis le haut et les abords ; jamais le nom d’un plan', () => {
    const parties = partiesDe(ISLAND);
    expect(parties).toHaveLength(5);
    const words = stagePoseWords(ISLAND, PLACE);
    const said = (k: number) => phraseDeLaPose({ posees: [parties[k]], plansFinis: [] }, words);
    expect(said(0)).toBe('Partie posée : le corps de l’Auberge, 1 sur 3.');
    for (let k = 0; k < 5; k++) for (const plan of plansFor(ISLAND)) expect(said(k)).not.toContain(plan.done);
    for (let k = 0; k < 5; k++) expect(said(k)).not.toMatch(/Lina|écurie|fontaine|relais/i);
  });
});

describe('« Y aller » à l’Auberge (C11)', () => {
  const door = PATH_NODES_5E.find((n) => n.id === 'auberge')!.at;
  const feet = { x: door.x, y: standingHeight(heightAt5e(door)), z: door.z };
  const pose = followPose(feet, 0, undefined, doorViewOf('auberge'));
  const W = 1024,
    H = 768;
  const world = (p: Vec2, y: number) => ({
    x: PLACE.center.x + p.x,
    y: AUBERGE_LAYOUT.heightAtCenter + y,
    z: PLACE.center.z + p.z,
  });

  it('la caméra arrive au cap nord, de face : la maison entière, le départ du ponton et la brouette dans le cadre', () => {
    expect(doorViewOf('auberge')).toBe(0);
    const inFrame = (p: { x: number; y: number }, what: string) => {
      expect(p.x, what).toBeGreaterThan(0);
      expect(p.x, what).toBeLessThan(W);
      expect(p.y, what).toBeGreaterThan(0);
      expect(p.y, what).toBeLessThan(H);
    };
    // La maison entière : les coins de son socle et de son toit, son faîte.
    const Ho = AUBERGE_LAYOUT.house;
    const corners: [number, number, number][] = [];
    for (const z of [Ho.z0, Ho.z1]) {
      for (const x of [-Ho.x - Ho.eave, Ho.x + Ho.eave]) corners.push([x, z, 0], [x, z, Ho.etage + Ho.slab]);
      corners.push([0, z, Ho.ridge + Ho.slab]);
    }
    for (const [x, z, y] of corners) inFrame(screenOf(pose, world({ x, z }, AUBERGE_LAYOUT.parvisTop + y), W, H), `${x} ${z} ${y}`);
    // La cheminée, au bout nord du faîte, son chapeau compris.
    inFrame(screenOf(pose, world({ x: 0, z: AUBERGE_LAYOUT.chimney.z }, AUBERGE_LAYOUT.parvisTop + Ho.ridge + AUBERGE_LAYOUT.chimney.above + 0.18), W, H), 'cheminée');
    // Le départ du ponton, à droite de la maison, et la brouette à son pied.
    const start = screenOf(pose, world(AUBERGE_LAYOUT.pontoon.start, AUBERGE_LAYOUT.parvisTop), W, H);
    inFrame(start, 'ponton');
    expect(start.x).toBeGreaterThan(W / 2);
    const barrow = AUBERGE.traces['es-sentences'].at;
    for (const y of [0, 1.2]) inFrame(screenOf(pose, world(barrow, AUBERGE_LAYOUT.parvisTop + y), W, H), `brouette ${y}`);
  });

  it('la caméra reste au-dessus de la terre ou de la vase, loin au-dessus de l’eau', () => {
    expect(heightAt5e({ x: pose.position.x, z: pose.position.z })).toBeGreaterThan(-0.4);
    expect(pose.position.y).toBeGreaterThan(FOLLOW.height);
  });

  it('les autres lieux du 5e gardent leur cap, sauf les Instants et les Radeaux', () => {
    for (const p of PLAN.places) if (!['instants', 'radeaux'].includes(p.id)) expect(doorViewOf(p.id), p.id).toBe(0);
  });
});

describe('La forêt s’écarte de l’Auberge', () => {
  it('aucun palétuvier à moins de 13 unités du centre : rien sur le toit, la table ni le ponton', () => {
    const tile = TERRAIN_5E.step * TERRAIN_5E.tileCells;
    const tx = Math.floor((PLACE.center.x - TERRAIN_5E.minX) / tile);
    const tz = Math.floor((PLACE.center.z - TERRAIN_5E.minZ) / tile);
    for (let i = tx - 2; i <= tx + 2; i++)
      for (let k = tz - 2; k <= tz + 2; k++) {
        if (i < 0 || k < 0 || i >= TERRAIN_5E.tilesX || k >= TERRAIN_5E.tilesZ) continue;
        for (const o of obstaclesIn5e(i, k)) expect(Math.hypot(o.x - PLACE.center.x, o.z - PLACE.center.z), `${o.x},${o.z}`).toBeGreaterThanOrEqual(13);
      }
  });
});

/**
 * Le budget du 5e au lot 11, avant l'Auberge (les Fumerolles, l'Étuve, les Terrasses et la Faille compris : `npm run
 * rendu:budget -- --archipel 6e,5e` sur `preview`, 20 octobre 2026), scénette ouverte. Hors scénette, au départ et sur la
 * Carte : ./radeaux5e.test.ts (un lieu de plus par lieu fini depuis le lot 5).
 */
const LOT11_OPEN_5E = { triangles: 100_273, calls: 19 } as const;

describe('Le budget du 5e, avec l’Auberge (plafonds du lot 12)', () => {
  it('scénette ouverte : le lot 11 et un lieu de plus au plus, sans appel de plus ; l’aubergiste dans les deux appels de la scénette', () => {
    const cost = openWorldCost5e();
    const triangles = cost.reduce((a, p) => a + p.triangles, 0);
    const calls = cost.reduce((a, p) => a + p.calls, 0);
    // Et les chaussées du plateau, venues après (lot 13a).
    expect(triangles).toBeLessThanOrEqual(LOT11_OPEN_5E.triangles + PLACE_TRIANGLES_MAX_5E + CAUSEWAYS_ADDED_5E);
    expect(calls).toBeLessThanOrEqual(LOT11_OPEN_5E.calls);
    expect(cost.find((c) => c.poste === 'scénette')!.calls).toBe(2);
  });
});
