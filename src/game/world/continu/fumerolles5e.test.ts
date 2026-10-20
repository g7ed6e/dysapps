// Les Fumerolles (GD-22, lot 9) : leur modèle par étapes, la lanterne de la sondeuse allumée dès la ruine, une trace par
// étape, la vapeur fixe au-dessus de chaque bouche, le plan du lieu (le chemin loin des bouches, les sondes séparées, le
// socle nu), la dalle plancher de la scénette, ses abords, son plafond de 1 600 triangles et le budget du 5e. Sans Three.js.
import { describe, expect, it } from 'vitest';
import type { BiomeId } from '../../biomes';
import { stagePoseWords } from '../../three/archipeo/constructionParts';
import { phraseDeLaPose } from '../../poseWords';
import { partiesDe } from '../parts';
import { plansFor } from '../plans';
import { PLACE_TRIANGLES_MAX_5E, openWorldCost5e } from './budget';
import { WHOLE, posedTraces, traceStagePosed, type PartShape, type Stage } from './construction';
import type { Facets } from './facets';
import { FUMEROLLES, FUMEROLLES_LAYOUT, FUMEROLLES_MAST_TOP, FUMEROLLES_PATH, FUMEROLLES_STEAM, FUMEROLLES_VENTS } from './fumerolles5e';
import { levelWorld } from './levelWorld';
import { distance, distanceToPolyline, linearRgb, type Vec2 } from './geometry';
import { HABITANT_TRIANGLES_5E, hasHabitantModel } from './habitants';
import { hasScenette, planFor } from './levelPlan';
import { riftMistSpots } from './mist5e';
import { MONTEE_HEIGHT } from './montee5e';
import { BUILT_PLACES_5E, COLORS_5E, PATH_NODES_5E, PLATEAU } from './plan5e';
import { drawPieces, placePieces } from './places';
import { placeItems } from './questions';
import { answerObjects, placeTrace, sceneSpot } from './questionScene';
import { scenetteHabitant, scenetteHidesPieces, scenetteKeo, scenetteOf, scenetteStartYaw, scenetteSurroundings } from './scenette';
import { SURROUNDINGS_MAX } from './surroundings';
import { standingHeight } from './terrain';
import { heightAt5e } from './terrain5e';
import { spots5e } from './wildlife5e';

const PLAN = planFor('5e');
const PLACE = PLAN.places.find((p) => p.id === 'fumerolles')!;
const MISSIONS = ['active-earth', 'weather-climate', 'human-impact'] as const;

/** Les parties posées jusqu'à l'étape `n` comprise (−1 : la ruine). */
const upTo = (n: number): PartShape[] => [0, 1, 2].filter((s) => s <= n).map((s) => [{ stage: s as Stage, from: 0, to: 1 }]);

/** Ce que le lieu montre, ses parties posées jusqu'à `n` : la ruine qui reste, les étapes posées. */
function shown(n: number): Facets {
  const parts = upTo(n);
  const posed = (stage: Stage) => parts.some((p) => p.some((s) => s.stage === stage));
  return drawPieces('fumerolles', (p) => (p.stage === 'ruine' ? !p.until || !posed(p.until.stage) : posed(p.stage)));
}

/** Les sommets d'une couleur exacte (la lanterne d'ocre, que la vue dessine sans ombre). */
function countColor(f: Facets, color: number): number {
  const [r, g, b] = linearRgb(color);
  let n = 0;
  for (let i = 0; i < f.colors.length; i += 3) if (Math.abs(f.colors[i] - r) < 1e-4 && Math.abs(f.colors[i + 1] - g) < 1e-4 && Math.abs(f.colors[i + 2] - b) < 1e-4) n++;
  return n;
}

/** Un nœud du réseau du 5e, dans le repère du lieu. */
const local = (id: string): Vec2 => {
  const at = PATH_NODES_5E.find((n) => n.id === id)!.at;
  return { x: at.x - PLACE.center.x, z: at.z - PLACE.center.z };
};

describe('Les Fumerolles, lieu complet', () => {
  it('leurs trois missions se jouent dans leur scénette, comme à la Montée, au Hameau, aux Radeaux, à la Croisée, aux Instants et à l’Étuve', () => {
    expect(PLACE.scenes).toEqual([...MISSIONS]);
    expect(PLAN.places.filter((p) => hasScenette(p.id)).map((p) => p.id).sort()).toEqual(['croisee', 'etuve', 'fumerolles', 'hameau', 'instants', 'montee', 'radeaux', 'terrasses']);
  });

  it('se rebâtissent en trois étapes, chacune en deux temps ; la ruine part avec l’étape qui la remplace', () => {
    const pieces = placePieces('fumerolles');
    for (const stage of [0, 1, 2]) expect(pieces.filter((p) => p.stage === stage).map((p) => p.row), String(stage)).toEqual([0, 0.5]);
    // Le corps relève la margelle, la dalle, les sondes couchées et la cabane penchée ; le haut, le toit tombé et le mât
    // couché ; les abords, la barrière au sol et la lanterne du chemin éteinte.
    const fallen = pieces.filter((p) => p.stage === 'ruine' && p.until).map((p) => p.until!.stage);
    expect(fallen).toEqual([0, 0, 0, 0, 1, 2]);
    let before = shown(-1);
    for (let n = 0; n <= 2; n++) {
      const now = shown(n);
      expect(now.triangles, String(n)).not.toBe(before.triangles);
      before = now;
    }
  });

  it('coûtent au plus le plafond d’un lieu du 5e, ruine, étapes et traces montrées ensemble ; la ruine seule, 1 000', () => {
    let worst = 0;
    for (let n = -1; n <= 2; n++) {
      const traces = placeTrace('fumerolles', posedTraces('fumerolles', upTo(n), [...MISSIONS])).triangles;
      worst = Math.max(worst, shown(n).triangles + traces);
    }
    expect(worst).toBeLessThanOrEqual(PLACE_TRIANGLES_MAX_5E);
    expect(shown(-1).triangles).toBeLessThanOrEqual(1_000);
    // Le plus chargé est le lieu restauré, comme le budget le compte (`modelOfPlace` et toutes les traces).
    expect(shown(2).triangles + placeTrace('fumerolles', [...MISSIONS]).triangles).toBe(worst);
  });

  it('une seule lanterne allumée dans la ruine, celle de la sondeuse ; le haut allume le mât, les abords le chemin ; trois au plus', () => {
    const lit = (n: number) => countColor(shown(n), COLORS_5E.lantern);
    // Une lanterne : sa vitre à six pans, ses six côtés et son dessus.
    expect(lit(-1)).toBe(3 * 18);
    expect(lit(0)).toBe(lit(-1));
    expect(lit(1)).toBe(lit(0) + 3 * 18);
    // La lanterne du chemin : un pavé d'ocre sous son chapeau.
    expect(lit(2)).toBe(lit(1) + 3 * 10);
    // La lanterne du chemin, éteinte et couchée dans la ruine (vitre #BFC4B8), part avec les abords.
    expect(countColor(shown(-1), 0xbfc4b8)).toBe(3 * 10);
    expect(countColor(shown(2), 0xbfc4b8)).toBe(0);
    // Aucune trace n'est d'ocre : les sondes de fer, le pot de pierre, la pousse.
    expect(countColor(placeTrace('fumerolles', [...MISSIONS]), COLORS_5E.lantern)).toBe(0);
  });

  it('le mât reste sous les aiguilles et bien sous la Montée', () => {
    expect(FUMEROLLES_MAST_TOP).toBeCloseTo(4.5, 6);
    expect(FUMEROLLES_MAST_TOP).toBeLessThan(MONTEE_HEIGHT / 5);
  });
});

describe('La vapeur des Fumerolles, fixe', () => {
  it('un panache par bouche, sorti de son haut, la plus haute bouche au milieu ; sous deux fois le mât et sous le rebord de la falaise', () => {
    expect(FUMEROLLES_VENTS).toHaveLength(3);
    const [middle, ...others] = FUMEROLLES_VENTS;
    for (const v of others) {
      expect(v.h).toBeLessThan(middle.h);
      expect(v.plume).toBeLessThan(middle.plume);
    }
    for (const v of FUMEROLLES_VENTS) {
      expect(v.plume).toBeGreaterThan(v.h + 2);
      expect(v.plume).toBeLessThan(2 * FUMEROLLES_MAST_TOP);
      expect(v.plume).toBeLessThan(PLATEAU.height);
    }
  });

  it('dessinée sans ombre, d’un gris chaud qui ne dépasse jamais #D6D2C9, ses couleurs à elle seule dans le lieu', () => {
    const thin = levelWorld('5e').thinFog;
    for (const color of FUMEROLLES_STEAM) {
      expect(thin.find((t) => t.color === color)?.unlit, color.toString(16)).toBe(true);
      expect(color & 0xff).toBeLessThanOrEqual(0xc9);
      expect((color >> 16) & 0xff).toBeLessThanOrEqual(0xd6);
      // Aucune autre pièce du lieu ne la prend (la vue la reconnaît à sa couleur exacte).
      expect(Object.values(COLORS_5E)).not.toContain(color);
    }
    expect(new Set(FUMEROLLES_STEAM).size).toBe(FUMEROLLES_STEAM.length);
  });

  it('dans le maillage du lieu, avant comme après : la ruine et le lieu restauré portent les mêmes panaches', () => {
    const top = (f: Facets) => Math.max(...f.positions.filter((_, i) => i % 3 === 1));
    expect(top(shown(-1))).toBeCloseTo(top(shown(2)), 6);
    expect(top(shown(-1))).toBeGreaterThan(FUMEROLLES_VENTS[0].plume);
  });

  it('à 6 unités au moins du chemin de marche, et derrière les traces et le socle vus de la porte', () => {
    const door = local('fumerolles');
    const walk = [local('con-3'), door];
    const L = FUMEROLLES_LAYOUT;
    const front = [...L.probes, L.rain, L.pot, L.socle].map((p) => distance(door, p));
    for (const v of FUMEROLLES_VENTS) {
      expect(distanceToPolyline(v, walk)).toBeGreaterThanOrEqual(6);
      // Au nord de tout ce qu'on montre : vu de la porte (au sud), le panache n'est jamais devant.
      for (const p of [...L.probes, L.rain, L.socle]) expect(v.z).toBeLessThan(p.z);
      expect(distance(door, v)).toBeGreaterThan(Math.min(...front));
    }
  });
});

describe('Le plan des Fumerolles', () => {
  const L = FUMEROLLES_LAYOUT;

  it('la dalle devant, contre la porte ; la margelle au nord, son bord sud contre la dalle ; la cabane à l’est, jamais entre la porte et le centre', () => {
    const door = local('fumerolles');
    expect(door).toEqual({ x: 2, z: 7 });
    expect(L.dalle.z1).toBeLessThan(door.z);
    expect(L.margelle.z + L.margelle.r).toBeCloseTo(L.dalle.z0, 6);
    expect(L.cabin.x - L.cabin.w / 2).toBeGreaterThan(door.x + 3);
    // Le mât juste au nord de la cabane, le récipient de pluie à son pied, au coin nord-ouest de la cabane, sur la dalle.
    expect(L.mast.z).toBeLessThan(L.cabin.z - L.cabin.d / 2);
    expect(distance(L.mast, L.rain)).toBeLessThan(1.5);
    expect(L.rain.x).toBeLessThan(L.cabin.x - L.cabin.w / 2);
    expect(L.rain.x).toBeLessThanOrEqual(L.dalle.x1);
    expect(L.rain.z).toBeGreaterThanOrEqual(L.dalle.z0);
  });

  it('le chemin de dalles contourne la margelle par l’ouest, à 6 unités au moins de l’axe de chaque bouche', () => {
    const { line, width } = FUMEROLLES_PATH;
    for (const v of FUMEROLLES_VENTS) expect(distanceToPolyline(v, line), `${v.x}, ${v.z}`).toBeGreaterThanOrEqual(6);
    for (const p of line) expect(p.x).toBeLessThan(L.margelle.x);
    expect(line[0].x).toBeCloseTo(L.dalle.x0, 6);
    // Le socle reste hors du chemin.
    expect(distanceToPolyline(L.socle, line)).toBeGreaterThan(width / 2 + L.socle.r);
  });

  it('la lanterne du chemin, en tête du chemin, hors de la dalle : derrière la caméra de la vue vers l’est, au coin nord-ouest de la dalle', () => {
    const l = L.pathLantern;
    expect(l.x).toBeLessThan(L.dalle.x0 - 0.5);
    expect(l.z).toBeGreaterThan(L.dalle.z0 + 1);
    expect(distance(l, FUMEROLLES_PATH.line[0])).toBeLessThan(1.5);
  });

  it('les deux sondes, à deux unités au moins l’une de l’autre, séparées en profondeur ; l’une près du socle, sur la dalle', () => {
    const [a, b] = L.probes;
    expect(distance(a, b)).toBeGreaterThanOrEqual(2);
    expect(Math.abs(a.z - b.z)).toBeGreaterThanOrEqual(2);
    expect(distance(a, L.socle)).toBeLessThan(2);
    expect(a.x).toBeGreaterThan(L.socle.x);
    expect(a.z).toBeGreaterThan(L.socle.z);
    // L'autre au bord sud-est de la margelle, dehors.
    const d = distance(b, L.margelle);
    expect(d).toBeGreaterThan(L.margelle.r);
    expect(d).toBeLessThan(L.margelle.r + 1);
  });

  it('au pied des aiguilles, hors des nappes de brume de décor et loin des aigrettes', () => {
    for (const m of riftMistSpots()) expect(distance(m.at, PLACE.center) - m.radius).toBeGreaterThanOrEqual(10);
    for (const s of spots5e()) if (s.land === 'contreforts') expect(distance(s.at, PLACE.center)).toBeGreaterThan(20);
  });
});

describe('Les traces des Fumerolles : une par mission, chacune portée par son étape', () => {
  it('la trace de la mission n se montre quand sa mission est réussie et que l’étape n est posée', () => {
    expect(MISSIONS.map((m) => FUMEROLLES.traces[m].stage)).toEqual([0, 1, 2]);
    for (const m of MISSIONS) expect(FUMEROLLES.traces[m].row, m).toBeUndefined();
    expect(posedTraces('fumerolles', upTo(-1), [...MISSIONS])).toEqual([]);
    for (let n = 0; n <= 2; n++) expect(posedTraces('fumerolles', upTo(n), [...MISSIONS]), String(n)).toEqual(MISSIONS.slice(0, n + 1));
    expect(posedTraces('fumerolles', [WHOLE], [...MISSIONS])).toEqual([...MISSIONS]);
    // Réussie, mais son étape attend : rien ; posée, mais pas réussie : rien.
    expect(posedTraces('fumerolles', upTo(0), ['human-impact'])).toEqual([]);
    expect(posedTraces('fumerolles', [WHOLE], [])).toEqual([]);
    expect(traceStagePosed('fumerolles', upTo(0))).toBe(true);
    expect(traceStagePosed('fumerolles', upTo(-1))).toBe(false);
  });

  it('chaque trace se dessine seule, rien sans réussite', () => {
    for (const m of MISSIONS) expect(placeTrace('fumerolles', [m]).triangles, m).toBeGreaterThan(0);
    expect(placeTrace('fumerolles', []).triangles).toBe(0);
  });
});

describe('La scénette des Fumerolles', () => {
  it('la sondeuse, Kéo à plus de deux unités d’elle, debout sur la dalle (le plancher de la scénette) ; les réponses aux galets', () => {
    expect(scenetteOf('fumerolles').role).toBe('La sondeuse');
    const keo = scenetteKeo('fumerolles').at;
    const h = scenetteHabitant('fumerolles');
    expect(h.x - keo.x).toBeGreaterThan(2);
    expect(Math.abs(h.y - keo.y)).toBeLessThan(1e-6);
    // Sur le dessus de la dalle, ni au-dessus ni dedans.
    const dalleTop = standingHeight(heightAt5e(PLACE.center)) + FUMEROLLES_LAYOUT.dalle.top;
    expect(keo.y).toBeCloseTo(dalleTop, 3);
    const s = sceneSpot('fumerolles');
    expect(s.z - PLACE.center.z).toBeCloseTo(FUMEROLLES.sceneSpot.dz, 6);
    // La sondeuse devant la cabane, à droite ; la scène entière sur la dalle.
    const L = FUMEROLLES_LAYOUT;
    expect(h.x - PLACE.center.x).toBeGreaterThan(L.cabin.x - L.cabin.w / 2);
    expect(h.z - PLACE.center.z).toBeGreaterThan(L.cabin.z + L.cabin.d / 2);
    const [hx, hz] = FUMEROLLES.sceneSpot.half;
    expect(FUMEROLLES.sceneSpot.dx - hx).toBeGreaterThanOrEqual(L.dalle.x0);
    expect(FUMEROLLES.sceneSpot.dx + hx).toBeLessThanOrEqual(L.dalle.x1);
    expect(FUMEROLLES.sceneSpot.dz + hz).toBeLessThanOrEqual(L.dalle.z1);
    const items = placeItems('fumerolles', 'life-earth-sciences-5e-active-planet-active-earth-1', [{ key: 'a', choices: ['manteau', 'noyau', 'croûte'], answer: 'noyau' }]);
    expect(items[0].placeScene).toEqual({ kind: 'rest' });
  });

  it('vue un peu depuis le sud-ouest : la façade de la cabane derrière la sondeuse, les traces laissées dans le monde, la planche tournée avec la caméra', () => {
    // Retouche 1 : de face, la caméra voyait par-dessus la dalle le lieu entier, les traces se cachaient.
    const start = scenetteStartYaw('fumerolles');
    expect(start).toBeLessThan(-0.3);
    expect(start).toBeGreaterThan(-0.6);
    expect(scenetteHidesPieces('fumerolles')).toBe(false);
    expect(FUMEROLLES.answer?.facing).toBe(true);
    // Kéo et la sondeuse de part et d'autre, le long de la droite de la caméra de départ, à la même distance qu'au Hameau.
    const keo = scenetteKeo('fumerolles').at;
    const h = scenetteHabitant('fumerolles');
    const right = { x: Math.cos(start), z: -Math.sin(start) };
    const along = (h.x - keo.x) * right.x + (h.z - keo.z) * right.z;
    expect(along).toBeCloseTo(4.6, 6);
    expect(Math.abs((h.x - keo.x) * right.z - (h.z - keo.z) * right.x)).toBeLessThan(1e-6);
    // La façade de la cabane derrière la sondeuse, vue de la caméra de départ.
    const L = FUMEROLLES_LAYOUT;
    const back = { x: -Math.sin(start), z: -Math.cos(start) };
    const local = { x: h.x - PLACE.center.x, z: h.z - PLACE.center.z };
    const behind = { x: local.x + back.x * 1.5, z: local.z + back.z * 1.5 };
    expect(Math.abs(behind.x - L.cabin.x)).toBeLessThan(L.cabin.w / 2);
    expect(Math.abs(behind.z - L.cabin.z)).toBeLessThan(L.cabin.d / 2 + 0.5);
  });

  it('un galet choisi se soulève d’un cran : sa forme ne change pas, sa place si ; jamais l’ocre de la lanterne', () => {
    const at = [{ x: 0, y: 0, z: 0 }];
    const still = answerObjects('fumerolles', at, 1, { picked: [] });
    const picked = answerObjects('fumerolles', at, 1, { picked: [0] });
    expect(picked.triangles).toBe(still.triangles);
    const top = (f: Facets) => Math.max(...f.positions.filter((_, i) => i % 3 === 1));
    expect(top(picked) - top(still)).toBeGreaterThan(0.15);
    expect(countColor(still, COLORS_5E.lantern)).toBe(0);
  });

  it('la sondeuse se montre en modèle 3D ; sa réplique ne dit aucun nom du contenu', () => {
    expect(hasHabitantModel('fumerolles')).toBe(true);
    const said = `${scenetteOf('fumerolles').role} ${scenetteOf('fumerolles').greeting ?? ''}`;
    expect(said).not.toMatch(/Humus|Tortue|station|Faille|Prairie/i);
  });

  it('ses abords tiennent sous le plafond commun, dans chaque état', () => {
    for (const posed of [false, true])
      for (const open of [false, true]) {
        const f = scenetteSurroundings('fumerolles', open, posed);
        expect(f.triangles).toBeGreaterThan(0);
        expect(f.triangles).toBeLessThanOrEqual(SURROUNDINGS_MAX);
      }
  });
});

/**
 * Le budget du 5e au lot 7, avant les Fumerolles (la Croisée comprise : `npm run rendu:budget -- --archipel 6e,5e`, 20
 * octobre 2026), scénette ouverte. Hors scénette, au départ et sur la Carte : ./radeaux5e.test.ts (un lieu de plus par
 * lieu fini depuis le lot 5).
 */
const LOT7_OPEN_5E = { triangles: 96_367, calls: 19 } as const;

describe('Le budget du 5e, avec les Fumerolles (plafonds du lot 9, intention du directeur artistique du 20 octobre 2026)', () => {
  it('scénette ouverte : le lot 7 et un lieu de plus au plus par lieu fini depuis, sans appel de plus ; la sondeuse dans les deux appels de la scénette', () => {
    const cost = openWorldCost5e();
    const triangles = cost.reduce((a, p) => a + p.triangles, 0);
    const calls = cost.reduce((a, p) => a + p.calls, 0);
    // Les lieux finis depuis le lot 7 : les Instants (lot 8), les Fumerolles (lot 9), et ceux des Contreforts qui les suivent.
    const since = Object.keys(BUILT_PLACES_5E).filter((id) => !['montee', 'hameau', 'radeaux', 'croisee'].includes(id)).length;
    expect(triangles).toBeLessThanOrEqual(LOT7_OPEN_5E.triangles + since * PLACE_TRIANGLES_MAX_5E);
    expect(calls).toBeLessThanOrEqual(LOT7_OPEN_5E.calls);
    const scenette = cost.find((c) => c.poste === 'scénette')!;
    expect(scenette.calls).toBe(2);
    expect(scenette.triangles).toBeLessThanOrEqual(HABITANT_TRIANGLES_5E + 1_900);
  });
});

describe('Le bilan des Fumerolles nomme l’étape, jamais un plan', () => {
  it('« Étape finie : le corps des Fumerolles. », puis le haut et les abords, chacun une partie', () => {
    const island = PLACE.island as BiomeId;
    const parties = partiesDe(island);
    const plans = plansFor(island);
    expect(parties).toHaveLength(3);
    const words = stagePoseWords(island, PLACE);
    const lines = (k: number) => words.lines({ posees: [parties[k]], plansFinis: [plans[k]] });
    expect(lines(0).map((l) => l.text)).toEqual(['Étape finie : le corps des Fumerolles.']);
    expect(lines(1).map((l) => l.text)).toEqual(['Étape finie : le haut des Fumerolles.']);
    expect(lines(2).map((l) => l.text)).toEqual(['Étape finie : les abords des Fumerolles.']);
    const said = phraseDeLaPose({ posees: [parties[0]], plansFinis: [plans[0]] }, words);
    expect(said).toBe(`Étape finie : le corps des Fumerolles. +${plans[0].reward.xp} XP.`);
    for (const plan of plans) expect(said).not.toContain(plan.done);
  });
});
