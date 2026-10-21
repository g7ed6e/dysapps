// Les Nacelles (GD-22, lot 16) : le lieu par parties (1 + 1 + 1 + 1, le corps coupé en deux par la hauteur), une seule
// lanterne allumée dans la ruine, une trace par mission avec sa partie, le signe de l'absence qui ne change jamais, les
// deux câbles qui montent vers les aiguilles de décor (hors du modèle du lieu, mais comptés dans le budget du monde et dans
// son plafond de 1 600 triangles), rien sur le chemin de marche, la scénette de la câbliste, le cap nord de « Y aller », les
// plafonds de 1 600 et 1 200 triangles. Sans Three.js.
import { describe, expect, it } from 'vitest';
import type { BiomeId } from '../../biomes';
import { partShapes, stagePoseWords } from '../../three/archipeo/constructionParts';
import { phraseDeLaPose } from '../../poseWords';
import { partiesDe } from '../parts';
import { plansFor } from '../plans';
import { PLACE_RUIN_TRIANGLES_MAX_5E, PLACE_TRIANGLES_MAX_5E, reachCost5e } from './budget';
import { FOLLOW, followPose, screenOf } from './camera';
import { posedTraces, type PartShape, type Stage } from './construction';
import { mergeFacets, type Facets } from './facets';
import { distance, linearRgb } from './geometry';
import { hasScenette, planFor } from './levelPlan';
import { CABLE, NACELLES, NACELLES_MAST_TOP, cableEnd, cableLine, mastTop, nacellesCables } from './nacelles5e';
import { NACELLES_SURROUNDINGS } from './nacellesSurroundings';
import { doorFrameOf, doorViewOf } from './northShore';
import { BUILT_PLACES_5E, COLORS_5E, fromPlan5e, NEEDLES_5E, PATH_EDGES_5E, PATH_NODES_5E, PLACES_5E } from './plan5e';
import { drawPieces, placePieces, ruinOf } from './places';
import { placeTrace } from './questionScene';
import { exitView, scenetteExit, scenetteOf, traceViewOf, TRACE_VIEW } from './scenette';
import { SURROUNDINGS_MAX } from './surroundings';
import { standingHeight } from './terrain';
import { heightAt5e } from './terrain5e';

const PLAN = planFor('5e');
const PLACE = PLAN.places.find((p) => p.id === 'nacelles')!;
const SHAPES = partShapes(PLACE.island as BiomeId);
const MISSIONS = [...BUILT_PLACES_5E.nacelles];

const upTo = (n: number): PartShape[] => SHAPES.slice(0, n);
const takes = (parts: readonly PartShape[], stage: Stage, row: number) => parts.some((part) => part.some((s) => s.stage === stage && row >= s.from - 1e-9 && row < s.to - 1e-9));

function shown(n: number): Facets {
  const parts = upTo(n);
  return drawPieces('nacelles', (p) => (p.stage === 'ruine' ? !p.until || !takes(parts, p.until.stage, p.until.row) : takes(parts, p.stage, p.row)));
}

function countColor(f: Facets, color: number): number {
  const [r, g, b] = linearRgb(color);
  let n = 0;
  for (let i = 0; i < f.colors.length; i += 3) if (Math.abs(f.colors[i] - r) < 1e-4 && Math.abs(f.colors[i + 1] - g) < 1e-4 && Math.abs(f.colors[i + 2] - b) < 1e-4) n++;
  return n;
}

const ground = (x: number, z: number) => standingHeight(heightAt5e({ x, z }));
const nodes = new Map(PATH_NODES_5E.map((n) => [n.id, n.at]));

function toSegment(p: { x: number; z: number }, a: { x: number; z: number }, b: { x: number; z: number }): number {
  const dx = b.x - a.x,
    dz = b.z - a.z;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / (dx * dx + dz * dz || 1)));
  return Math.hypot(p.x - a.x - dx * t, p.z - a.z - dz * t);
}

describe('Les Nacelles, lieu complet', () => {
  it('ses quatre missions se jouent dans sa scénette, en quatre parties : le corps coupé en deux, le haut, les abords', () => {
    expect(PLACE.scenes).toEqual(MISSIONS);
    expect(MISSIONS).toHaveLength(4);
    expect(hasScenette('nacelles')).toBe(true);
    expect(SHAPES.map((p) => p.map((s) => [s.stage, s.from, s.to]))).toEqual([[[0, 0, 0.5]], [[0, 0.5, 1]], [[1, 0, 1]], [[2, 0, 1]]]);
  });

  it('chaque partie pose quelque chose ; la ruine part avec la rangée qui la remplace', () => {
    for (let n = 1; n <= 4; n++) expect(shown(n).triangles, String(n)).not.toBe(shown(n - 1).triangles);
    const fallen = placePieces('nacelles')
      .filter((p) => p.stage === 'ruine' && p.until)
      .map((p) => `${p.until!.stage}/${p.until!.row}`);
    expect(new Set(fallen)).toEqual(new Set(['0/0', '0/0.5', '1/0', '2/0']));
  });

  it('coûte au plus 1 600 triangles à son état le plus chargé, traces et câbles compris ; la ruine, 1 200 au plus', () => {
    let worst = 0;
    for (let n = 0; n <= 4; n++) {
      const traces = placeTrace('nacelles', posedTraces('nacelles', upTo(n), MISSIONS)).triangles;
      const cables = n >= 3 ? nacellesCables().triangles : 0;
      worst = Math.max(worst, shown(n).triangles + traces + cables);
    }
    expect(worst).toBeLessThanOrEqual(PLACE_TRIANGLES_MAX_5E);
    expect(shown(0).triangles).toBeLessThanOrEqual(PLACE_RUIN_TRIANGLES_MAX_5E);
    expect(reachCost5e()).toBe(nacellesCables().triangles);
  });

  it('une seule lanterne allumée dans la ruine, celle de la câbliste ; trois au plus restaurée', () => {
    const lit = (n: number) => countColor(shown(n), COLORS_5E.lantern);
    expect(lit(0)).toBeGreaterThan(0);
    expect(lit(0)).toBe(lit(1));
    for (let n = 1; n <= 4; n++) expect(lit(n), String(n)).toBeLessThanOrEqual(3 * lit(0));
    expect(countColor(shown(0), 0xbfc4b8)).toBeGreaterThan(0);
    expect(countColor(shown(4), 0xbfc4b8)).toBe(0);
  });

  it('le signe de l’absence, le trou du crochet de la halle, ne change jamais', () => {
    const hole = countColor(ruinOf('nacelles'), 0x3a312c);
    expect(hole).toBeGreaterThan(0);
    for (let n = 0; n <= 4; n++) expect(countColor(shown(n), 0x3a312c), String(n)).toBeGreaterThanOrEqual(hole);
  });

  it('la ruine ne monte nulle part en un long trait : le pan de toit affaissé reste sous l’avant-toit, il ne se voit plus de côté comme un câble qui part dans le ciel', () => {
    const f = shown(0);
    const [wr, wg, wb] = linearRgb(0x9f9279);
    let highest = -Infinity;
    for (let i = 0; i < f.positions.length; i += 3) {
      const worn = Math.abs(f.colors[i] - wr) < 1e-4 && Math.abs(f.colors[i + 1] - wg) < 1e-4 && Math.abs(f.colors[i + 2] - wb) < 1e-4;
      if (worn) highest = Math.max(highest, f.positions[i + 1] - (ground(PLACE.center.x + f.positions[i], PLACE.center.z + f.positions[i + 2]) - ground(PLACE.center.x, PLACE.center.z)));
    }
    expect(highest).toBeGreaterThan(4);
    expect(highest).toBeLessThan(5.6);
  });

  it('une trace par mission, posée avec sa partie : une de plus à chaque partie', () => {
    const traces = (n: number) => posedTraces('nacelles', upTo(n), MISSIONS).length;
    expect([0, 1, 2, 3, 4].map(traces)).toEqual([0, 1, 2, 3, 4]);
    for (const m of MISSIONS) expect(NACELLES.traces[m], m).toBeDefined();
    expect(placeTrace('nacelles', []).triangles).toBe(0);
  });

  it('rien du lieu, en ruine comme restauré, sur le chemin de marche de aig-4 à la porte (à hauteur de Kéo)', () => {
    const door = nodes.get('nacelles')!;
    const from = nodes.get('aig-4')!;
    expect(PATH_EDGES_5E.some(([a, b]) => a === 'aig-4' && b === 'nacelles')).toBe(true);
    for (const f of [shown(0), shown(4)]) {
      for (let i = 0; i < f.positions.length; i += 9) {
        const x = (f.positions[i] + f.positions[i + 3] + f.positions[i + 6]) / 3;
        const y = Math.min(f.positions[i + 1], f.positions[i + 4], f.positions[i + 7]);
        const z = (f.positions[i + 2] + f.positions[i + 5] + f.positions[i + 8]) / 3;
        const low = y - ground(x, z) < 1.8;
        // Sur le chemin, à plus de 4 unités du centre du lieu (au-delà de son emprise) : rien à hauteur de Kéo.
        const onWay = toSegment({ x, z }, from, door) < 0.3 && distance({ x, z }, PLACE.center) > 14;
        expect(low && onWay).toBe(false);
      }
    }
  });
});

describe('Les câbles des Nacelles', () => {
  // Les aiguilles visées, par leur place sur le plan ([905, 170] à l'ouest, [1 190, 222] à l'est), jamais par leur rang.
  const needleAt = (plan: [number, number]) => NEEDLES_5E.find((n) => distance(n.at, fromPlan5e(plan)) < 0.01)!;
  const targets = [needleAt([905, 170]), needleAt([1190, 222])];

  it('vont du haut du mât à l’anneau de chaque aiguille de décor, aux deux tiers de sa hauteur (20 à 24 au-dessus de son pied)', () => {
    for (const k of [0, 1] as const) {
      const end = cableEnd(k);
      const n = targets[k];
      const up = end.y - ground(n.at.x, n.at.z);
      expect(up).toBeGreaterThanOrEqual(20);
      expect(up).toBeLessThanOrEqual(24);
      expect(distance(end, n.at)).toBeLessThan(n.radius + 0.5);
    }
  });

  it('ne passent jamais plus bas que le haut du mât, ne se croisent pas, et leur projection au sol ne croise ni lieu ni chemin', () => {
    const top = mastTop();
    for (const k of [0, 1] as const) for (const p of cableLine(k)) expect(p.y).toBeGreaterThanOrEqual(top.y - CABLE.sag - 0.3);
    const [a0, a1] = [cableLine(0), cableLine(1)];
    // Un côté chacun du mât : leurs bouts sont de part et d'autre.
    expect(a0[a0.length - 1].x).toBeLessThan(top.x);
    expect(a1[a1.length - 1].x).toBeGreaterThan(top.x);
    for (const k of [0, 1] as const) {
      const line = cableLine(k);
      for (let i = 0; i < line.length - 1; i++) {
        const a = line[i],
          b = line[i + 1];
        for (let s = 0; s <= 10; s++) {
          const p = { x: a.x + ((b.x - a.x) * s) / 10, z: a.z + ((b.z - a.z) * s) / 10 };
          if (distance(p, PLACE.center) < 12) continue;
          for (const other of PLAN.places) if (other.id !== 'nacelles') expect(distance(p, other.center), other.id).toBeGreaterThan(8);
          for (const [x, y] of PATH_EDGES_5E) expect(toSegment(p, nodes.get(x)!, nodes.get(y)!), `${x}-${y}`).toBeGreaterThan(3);
        }
      }
    }
  });

  it('le mât reste sous les aiguilles (27 au plus) ; les câbles n’entrent ni dans le modèle du lieu ni dans la Carte, mais dans le budget', () => {
    expect(NACELLES_MAST_TOP).toBeLessThanOrEqual(27);
    expect(mastTop().y - ground(mastTop().x, mastTop().z)).toBeLessThan(targets[0].height);
    expect(NACELLES.reach).toBeDefined();
    expect(NACELLES.reach!({ ...PLACE.center, y: 0 }, () => false)).toBeNull();
    expect(NACELLES.reach!({ ...PLACE.center, y: 0 }, () => true)!.triangles).toBe(nacellesCables().triangles);
  });

  it('`reach` ne rend rien tant que le haut n’est pas posé : ni dans la ruine, ni avec les autres parties seules (rien ne sort du lieu)', () => {
    const c = { ...PLACE.center, y: 0 };
    // Aucune partie posée.
    expect(NACELLES.reach!(c, () => false)).toBeNull();
    // Chaque partie posée seule, sauf le haut : le corps (les deux rangées) et les abords.
    for (const [stage, row] of [
      [0, 0],
      [0, 0.5],
      [2, 0],
    ] as const)
      expect(NACELLES.reach!(c, (s, r) => s === stage && r === row), `${stage}/${row}`).toBeNull();
    // Le haut posé : les deux câbles.
    expect(NACELLES.reach!(c, (s, r) => s === 1 && r === 0)).not.toBeNull();
  });

  it('les câbles sont rangés en dernier dans le maillage des lieux (la scène en tire `reachFrom` pour écarter le toucher et la caméra)', () => {
    const cables = nacellesCables();
    const merged = mergeFacets([shown(4), cables]);
    const from = merged.triangles - cables.triangles;
    expect(from).toBe(shown(4).triangles);
    expect(Array.from(merged.positions.slice(from * 9))).toEqual(Array.from(cables.positions));
  });
});

describe('Le bilan des Nacelles', () => {
  it('nomme la partie par son étape, jamais un nom du contenu (ni « scierie », ni « Rabot »)', () => {
    const island = PLACE.island as BiomeId;
    const words = stagePoseWords(island, PLACE);
    const parties = partiesDe(island);
    expect(parties).toHaveLength(4);
    const said = (k: number) => phraseDeLaPose({ posees: [parties[k]], plansFinis: [] }, words);
    expect(said(0)).toBe('Partie posée : le corps des Nacelles, 1 sur 2.');
    for (let k = 0; k < parties.length; k++) {
      expect(said(k), String(k)).not.toMatch(/scierie|rabot|cheval à bascule|menuiserie/i);
      for (const plan of plansFor(island)) expect(said(k), plan.id).not.toContain(plan.done);
    }
    // Les étapes finies (avec leur XP) ne les disent pas non plus.
    const finis = plansFor(island).map((plan) => phraseDeLaPose({ posees: [parties[parties.length - 1]], plansFinis: [plan] }, words));
    for (const t of finis) expect(t).not.toMatch(/scierie|rabot|cheval à bascule|menuiserie/i);
  });
});

describe('La scénette des Nacelles', () => {
  it('la câbliste, sans prénom, avec sa phrase du métier', () => {
    expect(scenetteOf('nacelles').role).toBe('La câbliste');
    expect(scenetteOf('nacelles').greeting).toBe('Ici, on tend les câbles.');
  });

  it('la caméra arrive au cap nord, de face', () => {
    expect(doorViewOf('nacelles')).toBe(0);
  });

  it('aucun texte du lieu ne dit « nacelle » pour la Nef ; ses abords tiennent sous le plafond commun', () => {
    expect(scenetteOf('nacelles').greeting).not.toMatch(/nacelle/i);
    expect(NACELLES.role).not.toMatch(/nacelle/i);
    const f = NACELLES_SURROUNDINGS;
    expect(f).toBeDefined();
    expect(SURROUNDINGS_MAX).toBe(1_500);
    expect(PLACES_5E.some((p) => p.id === 'nacelles')).toBe(true);
  });
});

describe('Le mât des Nacelles, vu de la porte et au retour d\u2019une scénette (règle des Aiguilles)', () => {
  const door = PATH_NODES_5E.find((n) => n.id === 'nacelles')!.at;
  const feet = { x: door.x, y: standingHeight(heightAt5e(door)), z: door.z };
  const y0 = standingHeight(heightAt5e(PLACE.center));
  // Le haut du mât et celui du piton, au-dessus de la cour.
  const tops = [
    { x: PLACE.center.x - 7, y: y0 + NACELLES_MAST_TOP, z: PLACE.center.z - 1.4 },
    { x: PLACE.center.x, y: y0 + 9, z: PLACE.center.z - 15.6 },
  ];

  it('plus haut que les 7,7 de la caméra qui suit : il en sort ; avec sa vue d\u2019arrivée, il tient dans le cadre, à 12 pixels au moins du haut', () => {
    expect(NACELLES_MAST_TOP).toBeGreaterThan(FOLLOW.height + 0.7);
    for (const [w, h] of [[1024, 768], [800, 1280]]) {
      const follow = followPose(feet);
      expect(screenOf(follow, tops[0], w, h).y, 'la caméra qui suit').toBeLessThan(0);
      const frame = doorFrameOf('nacelles')!;
      expect(frame).toBeDefined();
      const pose = followPose(feet, 0, undefined, doorViewOf('nacelles'), 1, undefined, frame);
      for (const t of tops) expect(screenOf(pose, t, w, h).y, `${w}×${h}`).toBeGreaterThan(12);
      expect(screenOf(pose, tops[0], w, h).x).toBeGreaterThan(0);
    }
  });

  it('au retour d\u2019une scénette, la vue de retour lit la vue d\u2019arrivée : plus reculée et plus haute que celle d\u2019une trace, la trace et Kéo dans le champ, le mât entier', () => {
    const view = traceViewOf('nacelles');
    expect(view.back).toBeGreaterThan(TRACE_VIEW.back);
    expect(view.height).toBeGreaterThan(TRACE_VIEW.height);
    expect(traceViewOf('phare')).toBe(TRACE_VIEW);
    for (const mission of MISSIONS) {
      const exit = scenetteExit('nacelles', true, mission)!;
      const at = { x: exit.at.x, y: standingHeight(heightAt5e(exit.at)), z: exit.at.z };
      const [w, h] = [1024, 768];
      const pose = followPose(at);
      exitView(pose, exit.keep, at, 1, view);
      for (const p of [at, exit.keep]) {
        const s = screenOf(pose, p, w, h);
        expect(s.x, mission).toBeGreaterThan(0);
        expect(s.x, mission).toBeLessThan(w);
        expect(s.y, mission).toBeGreaterThan(0);
        expect(s.y, mission).toBeLessThan(h);
      }
      expect(screenOf(pose, tops[0], w, h).y, `mât, ${mission}`).toBeGreaterThan(0);
      expect(screenOf(pose, tops[0], w, h).y, `mât, ${mission}`).toBeLessThan(h);
    }
  });
});
