// Les Radeaux (GD-22, lot 6) : le lieu complet, une trace par mission dès que sa partie est posée (trois au corps, puis
// le haut, puis les abords), une seule lanterne allumée dans la ruine, sa scénette, ses abords, son plafond de 1 600
// triangles et le budget du 5e avec eux et le Creux. Sans Three.js.
import { describe, expect, it } from 'vitest';
import { PLACE_TRIANGLES_MAX_5E, mapCost5e, openWorldCost5e } from './budget';
import { WHOLE, posedTraces, rowPosed, traceStagePosed, type PartShape, type Stage } from './construction';
import { creuxTriangles } from './creux5e';
import { linearRgb } from './geometry';
import { hasHabitantModel } from './habitants';
import { hasScenette, planFor } from './levelPlan';
import { followPose, screenOf } from './camera';
import { doorViewOf } from './northShore';
import { BUILT_PLACES_5E, COLORS_5E, PATH_NODES_5E } from './plan5e';
import { standingHeight } from './terrain';
import { drawPieces, placePieces } from './places';
import { placeItems } from './questions';
import { answerObjects, facingAnswerObjects, placeTrace } from './questionScene';
import { RADEAUX, RADEAUX_HEIGHTS, RADEAUX_LAYOUT } from './radeaux5e';
import { heightAt5e, landDistance5e } from './terrain5e';
import { scenetteHabitant, scenetteKeo, scenetteOf, scenetteSurroundings } from './scenette';
import { SURROUNDINGS_MAX } from './surroundings';
import type { Facets } from './facets';

const PLAN = planFor('5e');
const PLACE = PLAN.places.find((p) => p.id === 'radeaux')!;
const MISSIONS = [...BUILT_PLACES_5E.radeaux];

/** Les parties des Radeaux, dans l'ordre de la pose : le corps en trois tiers, le haut, les abords. */
const PARTS: readonly PartShape[] = [
  [{ stage: 0, from: 0, to: 1 / 3 }],
  [{ stage: 0, from: 1 / 3, to: 2 / 3 }],
  [{ stage: 0, from: 2 / 3, to: 1 }],
  [{ stage: 1, from: 0, to: 1 }],
  [{ stage: 2, from: 0, to: 1 }],
];

/** Ce que le lieu montre, ses `n` premières parties posées : la ruine qui reste, les rangées posées. */
function shown(n: number): Facets {
  const parts = PARTS.slice(0, n);
  const posed = (stage: Stage, row: number) => parts.some((p) => p.some((s) => s.stage === stage && row >= s.from - 1e-9 && row < s.to - 1e-9));
  return drawPieces('radeaux', (p) => (p.stage === 'ruine' ? !p.until || !rowPosed(parts, p.until.stage, p.until.row) : posed(p.stage, p.row)));
}

/** Les sommets d'une couleur exacte (la lanterne d'ocre, que la vue dessine sans ombre). */
function countColor(f: Facets, color: number): number {
  const [r, g, b] = linearRgb(color);
  let n = 0;
  for (let i = 0; i < f.colors.length; i += 3) if (Math.abs(f.colors[i] - r) < 1e-4 && Math.abs(f.colors[i + 1] - g) < 1e-4 && Math.abs(f.colors[i + 2] - b) < 1e-4) n++;
  return n;
}

describe('Les Radeaux, lieu complet', () => {
  it('ses cinq missions se jouent dans sa scénette', () => {
    expect(PLACE.scenes).toEqual(MISSIONS);
    expect(hasScenette('radeaux')).toBe(true);
    expect(scenetteOf('radeaux').role).toBe('Le marchand');
  });

  it('le corps se pose en trois tiers, le haut et les abords d’un coup ; la ruine part avec ce qui la remplace', () => {
    const pieces = placePieces('radeaux');
    expect([...new Set(pieces.filter((p) => p.stage === 0).map((p) => p.row))]).toEqual([0, 1 / 3, 2 / 3]);
    expect([...new Set(pieces.filter((p) => p.stage === 1 || p.stage === 2).map((p) => p.row))]).toEqual([0]);
    // Toute la ruine, sauf la racine en arche, le bois et le portique, s'en va un jour.
    expect(pieces.filter((p) => p.stage === 'ruine' && p.until).length).toBeGreaterThan(4);
  });

  it('coûte au plus le plafond d’un lieu du 5e à chaque partie, ruine, rangées et traces montrées ensemble ; la ruine, 1 200 au plus', () => {
    for (let n = 0; n <= PARTS.length; n++) {
      const traces = placeTrace('radeaux', posedTraces('radeaux', PARTS.slice(0, n), MISSIONS)).triangles;
      expect(shown(n).triangles + traces, String(n)).toBeLessThanOrEqual(PLACE_TRIANGLES_MAX_5E);
    }
    expect(shown(0).triangles).toBeLessThanOrEqual(1200);
  });

  it('une seule lanterne brille dans la ruine ; restauré, trois', () => {
    const lantern = countColor(shown(0), COLORS_5E.lantern);
    expect(lantern).toBeGreaterThan(0);
    expect(countColor(shown(PARTS.length), COLORS_5E.lantern)).toBe(3 * lantern);
  });

  it('ses trois radeaux et les poteaux du portique sont sur l’eau ; la cabane, sur la rive', () => {
    const at = (p: { x: number; z: number }) => ({ x: PLACE.center.x + p.x, z: PLACE.center.z + p.z });
    for (const r of RADEAUX_LAYOUT.rafts) expect(landDistance5e(at(r)), `${r.x} ${r.z}`).toBeLessThan(0);
    for (const p of RADEAUX_LAYOUT.posts) expect(landDistance5e(at(p)), `${p.x} ${p.z}`).toBeLessThan(0);
    expect(landDistance5e(at(RADEAUX_LAYOUT.cabin))).toBeGreaterThan(0);
  });

  it('la lanterne de la grande perche reste sous les fourches du portique, et le lieu sous la canopée', () => {
    expect(RADEAUX_HEIGHTS.perchAboveWater).toBeLessThan(RADEAUX_HEIGHTS.forks);
    expect(RADEAUX_HEIGHTS.top).toBeLessThan(8);
  });
});

/** Le sol du centre des Radeaux, où la vue pose le lieu (l'eau à 0 dans le monde). */
const CENTER_Y = standingHeight(heightAt5e(PLACE.center));

describe('Les Radeaux vus de la porte (retouche du lot 6)', () => {
  // La caméra de « Y aller » : derrière Kéo devant la porte, au cap du lieu.
  const door = PATH_NODES_5E.find((n) => n.id === 'radeaux')!.at;
  const feet = { x: door.x, y: standingHeight(heightAt5e(door)), z: door.z };
  const pose = followPose(feet, 0, undefined, doorViewOf('radeaux'));
  const W = 1024,
    H = 768;
  const world = (p: { x: number; z: number }, y: number) => ({ x: PLACE.center.x + p.x, y, z: PLACE.center.z + p.z });
  const on = (p: { x: number; z: number }, y: number) => screenOf(pose, world(p, y), W, H);
  /** Le dessus d'un radeau à l'écran : ses quatre coins (le repère de la rive tourne de `angle`). */
  const raftCorners = (k: number) => {
    const c = RADEAUX_LAYOUT.rafts[k];
    const h = RADEAUX_LAYOUT.raftHalf;
    return [-1, 1].flatMap((a) => [-1, 1].map((b) => on({ x: c.x + h * (a * Math.cos(0.28) - b * Math.sin(0.28)), z: c.z + h * (a * Math.sin(0.28) + b * Math.cos(0.28)) }, 0.55)));
  };

  it('« Y aller » regarde le lieu depuis sa porte, au nord-est : le quai, les radeaux, puis le chenal', () => {
    const look = { x: -Math.sin(doorViewOf('radeaux')), z: -Math.cos(doorViewOf('radeaux')) };
    for (const r of RADEAUX_LAYOUT.rafts) {
      const p = on(r, 0.55);
      expect(p.x).toBeGreaterThan(0);
      expect(p.x).toBeLessThan(W);
      const d = { x: PLACE.center.x + r.x - door.x, z: PLACE.center.z + r.z - door.z };
      expect(look.x * d.x + look.z * d.z).toBeGreaterThan(0);
    }
    // La cabane sur un côté du quai, à l'écran.
    expect(on(RADEAUX_LAYOUT.cabin, 1.5).x).toBeGreaterThan(W * 0.7);
    // Les autres lieux gardent le nord.
    expect(doorViewOf('hameau')).toBe(0);
    expect(doorViewOf('montee')).toBe(0);
  });

  it('les radeaux en échelon net : chacun plus loin que le précédent d’au moins vingt pixels', () => {
    const near = [0, 1, 2].map((k) => Math.max(...raftCorners(k).map((c) => c.y)));
    expect(near[0] - near[1]).toBeGreaterThan(20);
    expect(near[1] - near[2]).toBeGreaterThan(20);
  });

  it('le portique, entre le quai et le radeau du milieu, ne le croise jamais à l’image', () => {
    const middle = raftCorners(1).map((c) => c.x);
    for (const post of RADEAUX_LAYOUT.posts)
      for (const y of [0, RADEAUX_HEIGHTS.forks]) {
        const x = on(post, y).x;
        expect(x < Math.min(...middle) - 4 || x > Math.max(...middle) + 4, `${post.x} ${y}`).toBe(true);
      }
  });

  it('les toiles des radeaux se voient de face depuis la porte, jamais par la tranche', () => {
    // Le lieu se dessine dans son repère (le centre à son sol) : la vue le pose au centre.
    const f = shown(4);
    const [r, g, b] = linearRgb(0x7d97ad);
    let seen = 0;
    for (let i = 0; i < f.positions.length; i += 9) {
      if (Math.abs(f.colors[i] - r) > 1e-4 || Math.abs(f.colors[i + 1] - g) > 1e-4 || Math.abs(f.colors[i + 2] - b) > 1e-4) continue;
      // Les toiles des deux premiers radeaux (celle de la cabane regarde la façade, de côté).
      if (!RADEAUX_LAYOUT.rafts.slice(0, 2).some((c) => Math.hypot(f.positions[i] - c.x, f.positions[i + 2] - c.z) < 3)) continue;
      const to = { x: pose.position.x - (PLACE.center.x + f.positions[i]), y: pose.position.y - (CENTER_Y + f.positions[i + 1]), z: pose.position.z - (PLACE.center.z + f.positions[i + 2]) };
      const l = Math.hypot(to.x, to.y, to.z);
      const facing = (f.normals[i] * to.x + f.normals[i + 1] * to.y + f.normals[i + 2] * to.z) / l;
      expect(facing).toBeGreaterThan(0.3);
      seen++;
    }
    expect(seen).toBe(4);
  });

  it('les lanternes restaurées restent hors du premier plan : aucune à moins de six unités de la porte', () => {
    const f = shown(PARTS.length);
    const [r, g, b] = linearRgb(COLORS_5E.lantern);
    for (let i = 0; i < f.positions.length; i += 3) {
      if (Math.abs(f.colors[i] - r) > 1e-4 || Math.abs(f.colors[i + 1] - g) > 1e-4 || Math.abs(f.colors[i + 2] - b) > 1e-4) continue;
      expect(Math.hypot(PLACE.center.x + f.positions[i] - door.x, PLACE.center.z + f.positions[i + 2] - door.z)).toBeGreaterThan(6);
    }
  });
});

describe('La ruine des Radeaux (retouche du lot 6)', () => {
  it('ses trois poids partent avec le quai neuf, le corps 1 sur 3', () => {
    const iron = (n: number) => countColor(shown(n), 0x6f6a60);
    // Restaurés, seules les broches du portique sont de fer.
    expect(iron(0)).toBeGreaterThan(iron(1));
    expect(iron(1)).toBe(iron(PARTS.length));
  });

  it('son radeau penché se lit de biais : un bord sous l’eau, l’autre relevé d’un mètre au moins', () => {
    const f = drawPieces('radeaux', (p) => p.stage === 'ruine' && p.until?.row === 1 / 3);
    const [r, g, b] = linearRgb(0x8f8170);
    const c = RADEAUX_LAYOUT.rafts[1];
    let low = Infinity,
      high = -Infinity;
    for (let i = 0; i < f.positions.length; i += 3) {
      if (Math.abs(f.colors[i] - r) > 1e-4 || Math.abs(f.colors[i + 1] - g) > 1e-4 || Math.abs(f.colors[i + 2] - b) > 1e-4) continue;
      if (Math.hypot(f.positions[i] - c.x, f.positions[i + 2] - c.z) > 4) continue;
      low = Math.min(low, f.positions[i + 1] + CENTER_Y);
      high = Math.max(high, f.positions[i + 1] + CENTER_Y);
    }
    // L'eau est à 0 dans le monde.
    expect(low).toBeLessThan(-0.5);
    expect(high).toBeGreaterThan(1);
  });
});

describe('Les Radeaux sur la Carte (retouche du lot 6)', () => {
  it('le dessus des radeaux, éclairci, sur la Carte seulement : deux dans la ruine, trois posés ; leur boîte laissée à découvert', () => {
    const c = { x: PLACE.center.x, y: 1, z: PLACE.center.z };
    expect(RADEAUX.mapMark!(c, () => false).triangles).toBe(4);
    expect(RADEAUX.mapMark!(c, () => true).triangles).toBe(6);
    expect(RADEAUX.nameAbove).toBe(true);
    const clear = RADEAUX.mapClear!;
    for (const r of RADEAUX_LAYOUT.rafts) {
      expect(r.x).toBeGreaterThan(Math.min(...clear.map((p) => p.x)));
      expect(r.x).toBeLessThan(Math.max(...clear.map((p) => p.x)));
      expect(r.z).toBeGreaterThan(Math.min(...clear.map((p) => p.z)));
      expect(r.z).toBeLessThan(Math.max(...clear.map((p) => p.z)));
    }
  });
});

describe('Les traces des Radeaux : une par mission, chacune avec sa partie', () => {
  it('trois au corps (une par tiers), une au haut, une aux abords', () => {
    expect(MISSIONS.map((m) => [RADEAUX.traces[m].stage, RADEAUX.traces[m].row])).toEqual([
      [0, 0],
      [0, 1 / 3],
      [0, 2 / 3],
      [1, undefined],
      [2, undefined],
    ]);
    for (let n = 0; n <= PARTS.length; n++) expect(posedTraces('radeaux', PARTS.slice(0, n), MISSIONS), String(n)).toEqual(MISSIONS.slice(0, n));
    expect(posedTraces('radeaux', [WHOLE], [])).toEqual([]);
    expect(traceStagePosed('radeaux', PARTS.slice(0, 1))).toBe(true);
  });

  it('chaque trace se dessine seule, rien sans réussite', () => {
    for (const m of MISSIONS) expect(placeTrace('radeaux', [m]).triangles, m).toBeGreaterThan(0);
    expect(placeTrace('radeaux', []).triangles).toBe(0);
  });
});

describe('La scénette des Radeaux', () => {
  it('le marchand en modèle 3D, Kéo à son côté, au même plancher ; les réponses aux poids', () => {
    expect(hasHabitantModel('radeaux')).toBe(true);
    const keo = scenetteKeo('radeaux').at;
    const h = scenetteHabitant('radeaux');
    expect(Math.hypot(h.x - keo.x, h.z - keo.z)).toBeGreaterThan(2);
    expect(Math.abs(h.y - keo.y)).toBeLessThan(1e-6);
    const items = placeItems('radeaux', 'maths-5e-proportionality-percentages-1', [{ key: 'a', choices: ['25 %', '50 %'], answer: '25 %' }]);
    expect(items[0].placeScene).toEqual({ kind: 'rest' });
  });

  it('la planche des poids reste sous la rangée, la caméra de biais (tournée avec elle)', () => {
    expect(RADEAUX.answer?.facing).toBe(true);
    const yaw = RADEAUX.site.start!;
    const right = { x: Math.cos(yaw), z: -Math.sin(yaw) };
    const pivot = { x: 0, y: 0, z: 0 };
    const points = [-1.5, -0.5, 0.5, 1.5].map((t) => ({ x: right.x * t, y: 0, z: right.z * t }));
    const f = facingAnswerObjects('radeaux', points, 1, {}, pivot, yaw);
    const [r, g, b] = linearRgb(0xa68672);
    const along: number[] = [],
      across: number[] = [];
    for (let i = 0; i < f.positions.length; i += 3) {
      if (Math.abs(f.colors[i] - r) > 1e-4 || Math.abs(f.colors[i + 1] - g) > 1e-4 || Math.abs(f.colors[i + 2] - b) > 1e-4) continue;
      along.push(f.positions[i] * right.x + f.positions[i + 2] * right.z);
      across.push(-f.positions[i] * right.z + f.positions[i + 2] * right.x);
    }
    expect(Math.max(...along) - Math.min(...along)).toBeGreaterThan(3);
    expect(Math.max(...across) - Math.min(...across)).toBeLessThan(0.8);
  });

  it('un poids choisi se soulève d’un cran : sa forme ne change pas, sa place si', () => {
    const at = [{ x: 0, y: 0, z: 0 }];
    const still = answerObjects('radeaux', at, 1, { picked: [] });
    const picked = answerObjects('radeaux', at, 1, { picked: [0] });
    expect(picked.triangles).toBe(still.triangles);
    const top = (f: Facets) => Math.max(...f.positions.filter((_, i) => i % 3 === 1));
    expect(top(picked) - top(still)).toBeGreaterThan(0.15);
  });

  it('chaque poids se tient droit sur son étiquette, centré, et reste dans la place de sa réponse, soulevé compris (retouche 2 du lot 6)', () => {
    // La place d'une réponse va de son étiquette (le pied, 0) à la hauteur de l'objet (`answer.size`) : un toucher sur le
    // poids choisit la même réponse que l'étiquette (placeScreen.tsx), comme au Hameau.
    const size = RADEAUX.answer!.size;
    const at = [{ x: 0, y: 0, z: 0 }];
    const [r, g, b] = linearRgb(0x6f6a60);
    for (const picked of [[], [0]]) {
      const f = answerObjects('radeaux', at, 1, { picked });
      const xs: number[] = [],
        ys: number[] = [];
      for (let i = 0; i < f.positions.length; i += 3) {
        if (Math.abs(f.colors[i] - r) > 1e-4 || Math.abs(f.colors[i + 1] - g) > 1e-4 || Math.abs(f.colors[i + 2] - b) > 1e-4) continue;
        xs.push(f.positions[i]);
        ys.push(f.positions[i + 1]);
      }
      expect(xs.length).toBeGreaterThan(0);
      expect(Math.abs((Math.max(...xs) + Math.min(...xs)) / 2)).toBeLessThan(1e-6);
      // Jamais sous l'étiquette, à peine au-dessus d'elle au repos, jamais plus haut que sa place.
      expect(Math.min(...ys)).toBeGreaterThanOrEqual(0);
      if (!picked.length) expect(Math.min(...ys)).toBeLessThan(0.2);
      expect(Math.max(...ys)).toBeLessThanOrEqual(size.height + 1e-6);
    }
  });

  it('ses abords tiennent sous le plafond commun, dans chaque état', () => {
    for (const posed of [false, true])
      for (const open of [false, true]) {
        const f = scenetteSurroundings('radeaux', open, posed);
        expect(f.triangles).toBeGreaterThan(0);
        expect(f.triangles).toBeLessThanOrEqual(SURROUNDINGS_MAX);
      }
  });

  it('ne dit aucun nom du contenu (ni Bazar, ni Colporteur, ni l’échoppe)', () => {
    const said = `${scenetteOf('radeaux').role} ${scenetteOf('radeaux').greeting ?? ''}`;
    expect(said).not.toMatch(/Bazar|Colporteur|échoppe/i);
  });
});

/**
 * Le budget du 5e au lot 5, avant les Radeaux et le Creux (`npm run rendu:budget -- --archipel 6e,5e`, 20 octobre
 * 2026), en triangles : hors scénette, au départ et sur la Carte.
 */
const LOT5_5E = { world: { triangles: 84_510, calls: 16 }, departure: { triangles: 83_388, calls: 17 }, map: { triangles: 83_115, calls: 12 } } as const;

/** Le plafond du Creux (intention du directeur artistique, lot 6). */
const CREUX_MAX = 175;

/** Le pied des palétuviers de loin (./terrain5e.ts, trois triangles par arbre, #475) : 1 900 triangles au plus (la Carte, la plus chargée). */
const FOREST_FEET_5E = 1_900;

describe('Le budget du 5e, avec les Radeaux et le Creux (plafonds du lot 6)', () => {
  const sum = (c: { triangles: number; calls: number }[]) => c.reduce((a, p) => ({ triangles: a.triangles + p.triangles, calls: a.calls + p.calls }), { triangles: 0, calls: 0 });

  it('le Creux, sa sente comprise, 175 triangles au plus, sans appel', () => {
    expect(creuxTriangles().withSente).toBeLessThanOrEqual(CREUX_MAX);
    expect(openWorldCost5e().find((c) => c.poste === 'détours')).toEqual({ poste: 'détours', triangles: creuxTriangles().withSente, calls: 0 });
  });

  // Le plafond scénette ouverte et la réserve des lots suivants : ./plan5e.test.ts (« Le budget du 5e »).
  it('hors scénette, au départ et sur la Carte : le lot 5, un lieu par lieu fini depuis, le Creux et le pied des palétuviers de plus au plus, sans appel de plus', () => {
    // Les lieux finis depuis le lot 5 : les Radeaux (lot 6), la Croisée (lot 7).
    const since = Object.keys(BUILT_PLACES_5E).filter((id) => id !== 'montee' && id !== 'hameau').length;
    const views = [
      [sum(openWorldCost5e('monde')), LOT5_5E.world],
      [sum(openWorldCost5e('depart')), LOT5_5E.departure],
      [mapCost5e(), LOT5_5E.map],
    ] as const;
    for (const [now, before] of views) {
      expect(now.triangles).toBeLessThanOrEqual(before.triangles + since * PLACE_TRIANGLES_MAX_5E + CREUX_MAX + FOREST_FEET_5E);
      expect(now.calls).toBeLessThanOrEqual(before.calls);
    }
  });
});
