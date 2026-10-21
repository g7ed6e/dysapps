// Le Donjon (GD-22, lot 13a) : le lieu par parties (le corps, le haut, les abords), la ruine qui part avec l'étape qui
// la remplace, une seule lanterne allumée dans la ruine et trois au plus, une trace par mission avec son étape, le signe
// de l'absence (l'empreinte du pilier, son trou et ses quatre goujons aux coins), la tour plus haute que tout le 5e sans
// passer 27, le parapet, les marches, le pan de toit, la cour sans marche, rien de la ruine sur le chemin de marche, la
// scénette sur la cour et l'auge dans son cadre, la maçonne en modèle 3D, ses abords dans le cadre, les claveaux des
// réponses, le cap de « Y aller » (la tour entière), les plafonds de 1 600 et 1 200 triangles et le budget du 5e. Sans
// Three.js.
import { describe, expect, it } from 'vitest';
import type { BiomeId } from '../../biomes';
import { partShapes, stagePoseWords } from '../../three/archipeo/constructionParts';
import { phraseDeLaPose } from '../../poseWords';
import { partiesDe } from '../parts';
import { plansFor } from '../plans';
import { CAUSEWAYS_ADDED_5E, PLACE_TRIANGLES_MAX_5E, openWorldCost5e } from './budget';
import { followPose, lookUp, screenOf } from './camera';
import { posedTraces, traceStagePosed, WHOLE, type PartShape, type Stage } from './construction';
import { DONJON, DONJON_LAYOUT } from './donjon5e';
import { DONJON_SURROUNDINGS } from './donjonSurroundings';
import type { Facets } from './facets';
import { linearRgb, type Vec2 } from './geometry';
import { hasHabitantModel } from './habitants';
import { hasScenette, planFor } from './levelPlan';
import { arrivalViewOf, doorViewOf } from './northShore';
import { RIBBON_LIFT } from './paths';
import { BUILT_PLACES_5E, COLORS_5E, PATH_NODES_5E } from './plan5e';
import { drawPieces, placePieces, ruinOf } from './places';
import { placeItems } from './questions';
import { answerObjects, placeTrace, questionLayout, sceneSpot } from './questionScene';
import { scenetteHabitant, scenetteKeo, scenetteLayout, scenetteOf, scenettePose, scenetteSurroundings } from './scenette';
import { SURROUNDINGS_MAX } from './surroundings';
import { standingHeight } from './terrain';
import { heightAt5e } from './terrain5e';
import { LIGHT_5E } from './sky';

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

/** Une couleur en teinte, saturation et clarté (HSL, de 0 à 1). */
function hsl(color: number): { s: number; l: number } {
  const [r, g, b] = [(color >> 16) & 255, (color >> 8) & 255, color & 255].map((v) => v / 255);
  const [hi, lo] = [Math.max(r, g, b), Math.min(r, g, b)];
  const l = (hi + lo) / 2;
  return { s: hi === lo ? 0 : (hi - lo) / (1 - Math.abs(2 * l - 1)), l };
}

/**
 * La couleur d'une face à l'écran, sous la lumière du 5e (`LIGHT_5E`), comme la rend Three.js : le Lambert du soleil et
 * du ciel renvoyé (hémisphère), l'exposition, le mappage des tons neutre (`NeutralToneMapping`), puis sRGB ; au-dessus de
 * la lumière par la hauteur, sans brouillard. `color` en rouge, vert, bleu linéaires ; `n`, la normale de la face.
 */
function rendered5e(color: readonly number[], n: readonly number[]): number {
  const L = LIGHT_5E;
  const [sky, ground, sun] = [linearRgb(L.sky), linearRgb(L.ground), linearRgb(L.sun)];
  const d = Math.hypot(L.sunFrom.x, L.sunFrom.y, L.sunFrom.z);
  const ndl = Math.max(0, (n[0] * L.sunFrom.x + n[1] * L.sunFrom.y + n[2] * L.sunFrom.z) / d);
  const w = 0.5 * n[1] + 0.5;
  let c = color.map((v, i) => ((v / Math.PI) * (ndl * sun[i] * L.sunIntensity + (ground[i] + (sky[i] - ground[i]) * w) * L.ambient)) * L.exposure);
  const x = Math.min(...c);
  const offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
  c = c.map((v) => v - offset);
  const peak = Math.max(...c);
  if (peak >= 0.76) {
    const np = 1 - 0.24 ** 2 / (peak + 0.24 - 0.76);
    const g = 1 - 1 / (0.15 * (peak - np) + 1);
    c = c.map((v) => (v * np) / peak * (1 - g) + np * g);
  }
  const srgb = c.map((v) => Math.round(255 * Math.min(1, v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055)));
  return (srgb[0] << 16) | (srgb[1] << 8) | srgb[2];
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

  it('le signe de l’absence ne change jamais : l’empreinte du pilier, son trou dans son tiers haut, ses goujons aux quatre coins', () => {
    // Parmi ce qui reste toujours, seul le trou du pilier a le brun très sombre : un aplat à huit pans, six triangles ;
    // l'empreinte, un aplat de pierre moins passée (deux triangles).
    expect(countColor(ruinOf('donjon'), 0x3a312c)).toBe(18);
    expect(countColor(ruinOf('donjon'), 0x9c9f95)).toBe(6);
    const Q = DONJON_LAYOUT.pillar;
    // L'empreinte, environ 0,36 × 0,56, debout, dans la face du pilier, sous son dessus, à hauteur d'enfant.
    expect(Q.mark).toBeCloseTo(0.36, 2);
    expect(Q.markH).toBeCloseTo(0.56, 2);
    expect(Q.mark).toBeLessThan(Q.w);
    expect(Q.y + Q.markH / 2).toBeLessThan(Q.h);
    expect(Q.y).toBeGreaterThan(0.8);
    // Le trou dans le tiers haut de l'empreinte, jamais au milieu : pas la face 5 d'un dé.
    expect(Q.hole - Q.r).toBeGreaterThan(Q.markH / 6 - 0.05);
    expect(Q.hole + Q.r).toBeLessThan(Q.markH / 2);
    // Les goujons aux quatre coins, à `inset` du bord, hors du trou.
    const [dx, dy] = [Q.mark / 2 - Q.inset, Q.markH / 2 - Q.inset];
    for (const sy of [-1, 1]) expect(Math.hypot(dx, sy * dy - Q.hole) - Q.stud).toBeGreaterThan(Q.r);
  });

  it('la tour, plus haute que tout le 5e, reste sous 27 : son sommet entre 18 et 27 au-dessus de la cour', () => {
    const above = topOf(shown(3)) - DONJON_LAYOUT.courTop;
    expect(above).toBeGreaterThan(18);
    expect(above).toBeLessThan(27);
    // La ruine, coupée en biais, plus basse : le haut s'est écroulé.
    expect(topOf(shown(0))).toBeLessThan(topOf(shown(3)) - 3);
  });

  it('le parapet, un chemin de ronde : la brique en tout 1,8 au plus, en encorbellement de 0,12 au plus, trois blocs par côté', () => {
    const T = DONJON_LAYOUT.tower;
    expect(T.top - T.mid).toBeLessThanOrEqual(1.8 + 1e-9);
    expect(T.over).toBeLessThanOrEqual(0.12);
    expect(T.top).toBe(18.2);
    expect(DONJON_LAYOUT.parapet.blocks).toBe(3);
    // Le joint entre deux blocs, debout, sombre : jamais un vide (pas de créneau).
    expect(DONJON_LAYOUT.parapet.joint).toBeCloseTo(0.06, 6);
    expect(countColor(shown(3), 0xa8664f)).toBe(0);
    // Ses faces intérieures dans l'ombre, en #777D77.
    expect(countColor(drawPieces('donjon', (p) => p.stage === 1), 0x777d77)).toBe(24);
  });

  it('la brique sourde, rendue sous le soleil du 5e : aucune face au soleil plus saturée ni plus claire que #A8664F', () => {
    const bound = hsl(0xa8664f);
    // Le calcul retrouve la mesure des captures v2 : l'ancienne brique (#9A5A44), face sud, rendue #9C4A1A.
    expect(rendered5e(linearRgb(0x9a5a44), [0, 0, 1])).toBe(0x9c4a1a);
    // La brique et son joint, chacune avec la normale de chacune de ses faces que le soleil prend, à l'écran.
    const sun = LIGHT_5E.sunFrom;
    const f = drawPieces('donjon', (p) => p.stage === 1);
    const seen = new Map<string, number>();
    const bricks = [DONJON_LAYOUT.brick.face, DONJON_LAYOUT.brick.dark].map((c) => linearRgb(c));
    for (let i = 0; i < f.positions.length; i += 3) {
      const color = [f.colors[i], f.colors[i + 1], f.colors[i + 2]];
      const n = [f.normals[i], f.normals[i + 1], f.normals[i + 2]];
      if (!bricks.some((c) => c.every((v, k) => Math.abs(v - color[k]) < 1e-4)) || n[0] * sun.x + n[1] * sun.y + n[2] * sun.z <= 0) continue;
      const shown = rendered5e(color, n);
      seen.set(shown.toString(16), shown);
    }
    expect(seen.size).toBeGreaterThan(2);
    for (const shown of seen.values()) {
      const { s, l } = hsl(shown);
      expect(s, shown.toString(16)).toBeLessThanOrEqual(bound.s + 1e-3);
      expect(l, shown.toString(16)).toBeLessThanOrEqual(bound.l + 1e-3);
    }
    // La face à l'ouest, en plein soleil : la plus claire, encore une brique (le rouge devant le bleu).
    const west = rendered5e(linearRgb(DONJON_LAYOUT.brick.face), [-1, 0, 0]);
    expect(west >> 16).toBeGreaterThan((west & 0xff) + 0x30);
  });

  it('la ruine : le fond écroulé sous le plus bas de la coupe en biais', () => {
    const T = DONJON_LAYOUT.tower;
    const low = Math.min(...[-1, 1].flatMap((sx) => [-1, 1].map((sz) => DONJON_LAYOUT.cut(T.x + sx * T.half, T.z + sz * T.half))));
    expect(DONJON_LAYOUT.cutFloor).toBeLessThan(low - 0.3);
  });

  it('l’escalier taillé dans le piton : une seule masse de roche dessous, des dessus clairs, aucune face debout plus haute que 0,8', () => {
    const S = DONJON_LAYOUT.steps;
    expect(S.count).toBe(8);
    expect(S.riser).toBeLessThanOrEqual(0.8);
    expect(S.foot + S.riser * S.count).toBeCloseTo(DONJON_LAYOUT.piton.h, 6);
    const len = Math.hypot(S.to.x - S.from.x, S.to.z - S.from.z);
    const u = { x: (S.to.x - S.from.x) / len, z: (S.to.z - S.from.z) / len };
    const stone = linearRgb(COLORS_5E.stone);
    for (const worn of [true, false]) {
      const f = drawPieces('donjon', (p) => (worn ? p.stage === 'ruine' : p.stage === 0));
      const flanks = new Set<string>();
      let risers = 0;
      for (let i = 0; i < f.positions.length; i += 9) {
        const pts = [0, 3, 6].map((o) => ({ x: f.positions[i + o], y: f.positions[i + o + 1], z: f.positions[i + o + 2] }));
        // Les triangles de l'escalier : ses trois sommets dans sa bande (le plus large de son pied), le long de sa ligne.
        const along = (p: { x: number; z: number }) => (p.x - S.from.x) * u.x + (p.z - S.from.z) * u.z;
        const across = (p: { x: number; z: number }) => Math.abs((p.x - S.from.x) * -u.z + (p.z - S.from.z) * u.x);
        const half = S.width / 2 + S.flare * 7 + 1e-3;
        if (!pts.every((p) => across(p) <= half && along(p) > -len / 12 - 1e-3 && along(p) < len + len / 12 + 1e-3)) continue;
        if (![0, 1, 2].every((k) => Math.abs(f.colors[i + k] - stone[k]) < 1e-4)) continue;
        const n = [f.normals[i], f.normals[i + 1], f.normals[i + 2]];
        if (Math.abs(n[0] * u.x + n[2] * u.z) > 0.99) {
          // Une contremarche : au-dessus de la cour, 0,8 au plus.
          const top = Math.max(...pts.map((p) => p.y));
          const bottom = Math.max(Math.min(...pts.map((p) => p.y)), Math.min(...pts.map((p) => DONJON_LAYOUT.courAt(p.x, p.z))));
          expect(top - bottom, `${pts[0].x.toFixed(2)}, ${pts[0].z.toFixed(2)}`).toBeLessThanOrEqual(0.8 + 1e-4);
          risers++;
        } else flanks.add(n.map((c) => c.toFixed(3)).join(' '));
      }
      // Les flancs : deux pans en tout, un de chaque côté, jamais une arête qui descend d'une marche au sol.
      expect(flanks.size, [...flanks].join(' | ')).toBe(2);
      expect(risers).toBe(2 * S.count);
      // Le dessus de chaque marche au soleil, #AEB0A3.
      expect(countColor(f, COLORS_5E.stoneSun)).toBeGreaterThanOrEqual(S.count * 6);
    }
  });

  it('le pan de toit glissé contre la façade sud, à l’est de la perche, son haut sous la fenêtre', () => {
    const R = DONJON_LAYOUT.roofPan;
    expect(R.x0).toBeGreaterThan(DONJON_LAYOUT.perch.x + 0.2);
    expect(R.top).toBeLessThanOrEqual(1.1);
    expect(R.z).toBeGreaterThan(DONJON_LAYOUT.logis.z1);
  });

  it('la cour, sans marche : à moins de 0,03 du disque de la chaussée à la porte, une tranche de 0,1 au plus à son bord sud', () => {
    const c = PLACE.center;
    const H0 = DONJON_LAYOUT.heightAtCenter;
    const g = (x: number, z: number) => standingHeight(heightAt5e({ x: c.x + x, z: c.z + z })) - H0;
    const door = DONJON_LAYOUT.door;
    const node = g(door.x, door.z) + RIBBON_LIFT;
    expect(Math.abs(DONJON_LAYOUT.courAt(door.x, DONJON_LAYOUT.cour.z1) - node)).toBeLessThanOrEqual(0.03);
    const C = DONJON_LAYOUT.cour;
    for (let x = C.x0; x <= C.x1 + 1e-6; x += 0.5) {
      for (const z of [C.z0, (C.z0 + C.z1) / 2, C.z1]) expect(DONJON_LAYOUT.courAt(x, z) - g(x, z), `${x} ${z}`).toBeGreaterThan(0);
      expect(DONJON_LAYOUT.courAt(x, C.z1) - g(x, C.z1), String(x)).toBeLessThanOrEqual(0.1);
    }
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
    expect(keo.y).toBeCloseTo(DONJON_LAYOUT.heightAtCenter + DONJON_LAYOUT.courAt(DONJON_LAYOUT.scene.dx, DONJON_LAYOUT.scene.dz), 2);
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

  it('l’auge reste dans le cadre de la scénette, entre Kéo et la maçonne, au pied du mur du logis, à 1024 × 768', () => {
    expect(DONJON.keepsTracesInScenette).toBe(true);
    const [w, h] = [1024, 768];
    const stage = scenetteLayout({ count: 3 }, w, h, questionLayout({ count: 3 }, w, h)).scenette!.stage;
    const { pose, shift } = scenettePose('donjon', stage, w, h);
    const c = PLACE.center;
    const H0 = DONJON_LAYOUT.heightAtCenter;
    const at = DONJON.traces['christendoms-islam'].at;
    const s = (x: number, y: number, z: number) => {
      const p = screenOf(pose, { x, y, z }, w, h);
      return { x: p.x - shift.x, y: p.y - shift.y };
    };
    const y = H0 + DONJON_LAYOUT.courAt(at.x, at.z);
    const left = s(c.x + at.x - 0.58, y + 0.38, c.z + at.z);
    const right = s(c.x + at.x + 0.58, y + 0.38, c.z + at.z);
    const keo = scenetteKeo('donjon').at;
    const mason = scenetteHabitant('donjon');
    // Kéo et la maçonne, 0,4 de part et d'autre de leur axe : l'auge entre les deux, sans toucher ni l'un ni l'autre.
    expect(left.x).toBeGreaterThan(s(keo.x + 0.4, keo.y + 0.8, keo.z).x);
    expect(right.x).toBeLessThan(s(mason.x - 0.4, mason.y + 0.8, mason.z).x);
    for (const p of [left, right]) {
      expect(p.x).toBeGreaterThan(stage.left);
      expect(p.x).toBeLessThan(stage.right);
      expect(p.y).toBeGreaterThan(stage.top);
      expect(p.y).toBeLessThan(stage.bottom);
    }
    // Au pied du mur du logis, entre sa porte et le bord ouest de sa façade.
    expect(at.z - DONJON_LAYOUT.logis.z1).toBeLessThan(0.6);
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
    expect(said).not.toMatch(/château|seigneur|croisade|chevalier|Passeurs|Vélin|Griffon/i);
  });
});

describe('Le bilan du Donjon nomme la partie par son étape', () => {
  it('« Partie posée : le corps du Donjon. », puis le haut et les abords ; jamais le nom d’un plan', () => {
    const parties = partiesDe(ISLAND);
    expect(parties).toHaveLength(3);
    const words = stagePoseWords(ISLAND, PLACE);
    const said = (k: number) => phraseDeLaPose({ posees: [parties[k]], plansFinis: [] }, words);
    expect(said(0)).toMatch(/^Partie posée : le corps du Donjon/);
    expect(said(1)).toMatch(/^Partie posée : le haut du Donjon/);
    expect(said(2)).toMatch(/^Partie posée : les abords du Donjon/);
    for (let k = 0; k < 3; k++)
      for (const plan of plansFor(ISLAND)) {
        expect(said(k)).not.toContain(plan.done);
        expect(said(k)).not.toContain(plan.name);
      }
  });
});

describe('« Y aller » au Donjon (retouche 1)', () => {
  const c = PLACE.center;
  const H0 = DONJON_LAYOUT.heightAtCenter;
  const view = arrivalViewOf('donjon')!;
  const world = (x: number, y: number, z: number) => ({ x: c.x + x, y: H0 + y, z: c.z + z });
  const door = { x: c.x + DONJON_LAYOUT.door.x, z: c.z + DONJON_LAYOUT.door.z };
  const feet = { x: door.x, y: standingHeight(heightAt5e(door)), z: door.z };

  it('Kéo à la porte, sur la chaussée ; la caméra au cap nord, sans cap propre, recule comme un Détour au plus, sans monter', () => {
    expect(doorViewOf('donjon')).toBe(0);
    expect(PATH_NODES_5E.find((n) => n.id === 'donjon')!.at).toEqual(door);
    expect(view.back).toBeGreaterThan(1);
    expect(view.back).toBeLessThanOrEqual(1.6);
  });

  for (const [n, state] of [
    [0, 'en ruine'],
    [3, 'restauré'],
  ] as const)
    for (const [W, H] of [
      [1024, 768],
      [390, 844],
    ])
      it(`${state}, en ${W} × ${H} : la tour entière, 40 px de ciel au-dessus, Kéo haut de 70 px au moins${W > H ? ', le pilier et le logis' : ''}`, () => {
        // Comme la vue : la caméra qui suit, reculée, puis le regard levé jusqu'au haut bâti, au-dessus du bord le plus près.
        const pose = followPose(feet, 0, undefined, doorViewOf('donjon'), 1, undefined, { height: 0, back: view.back });
        lookUp(pose, world(view.look.x, topOf(shown(n)), view.look.z), feet, 1, H);
        const s = (p: { x: number; y: number; z: number }) => screenOf(pose, p, W, H);
        const inFrame = (p: { x: number; y: number }, what: string, sky = 0) => {
          expect(p.x, what).toBeGreaterThan(0);
          expect(p.x, what).toBeLessThan(W);
          expect(p.y, what).toBeGreaterThan(sky);
          expect(p.y, what).toBeLessThan(H);
        };
        // Le haut de la tour, ses quatre coins (la coupe en biais, ou le haut du parapet), sous 40 px de ciel.
        const T = DONJON_LAYOUT.tower;
        const o = n ? T.half + T.over : T.half;
        for (const sx of [-1, 1])
          for (const sz of [-1, 1]) {
            const [x, z] = [T.x + sx * o, T.z + sz * o];
            inFrame(s(world(x, DONJON_LAYOUT.courTop + (n ? T.top : DONJON_LAYOUT.cut(x, z)), z)), `haut ${sx} ${sz}`, 40);
          }
        // Kéo, haut de 70 px au moins, ses pieds au-dessus de « Y aller ».
        const foot = s(feet);
        expect(foot.y - s({ ...feet, y: feet.y + 2.4 }).y).toBeGreaterThanOrEqual(70);
        expect(foot.y).toBeLessThan(H - 72);
        if (W < H) return;
        // Le pilier du guet à gauche, le logis à droite.
        const Q = DONJON_LAYOUT.pillar;
        for (const dx of [-Q.w / 2, Q.w / 2]) inFrame(s(world(Q.x + dx, DONJON_LAYOUT.courAt(Q.x, Q.z) + Q.h, Q.z)), `pilier ${dx}`);
        const L = DONJON_LAYOUT.logis;
        for (const x of [L.x0, L.x1]) inFrame(s(world(x, DONJON_LAYOUT.courAt(x, L.z1) + L.wall, L.z1)), `logis ${x}`);
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
