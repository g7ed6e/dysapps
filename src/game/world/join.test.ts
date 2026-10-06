// Réunir deux lieux (GD-9, point 10) : la forme de la construction qui réunit (4 cases de long au plus près, toute la
// largeur du côté commun, des marches au plus trois), la paire qui bouge et tourne d'un bloc, la liaison remplacée
// devenue à reposer, et le repère des clés qui ne change pas.
import { afterEach, describe, expect, it } from 'vitest';
import type { BiomeId } from '../biomes';
import type { World } from '../engine/state';
import { backToStartingMap, startingMapState, startingSpot, freeSpots, isFixedPlace, groupAt, joinCandidates, joinedWith, joinIslands, joinsIn, moveIsland, routesIn, spotOf, turnIsland } from './arrange';
import { toutConstruit } from './budget';
import { GAP_BETWEEN_PLACES, posesOfLayout } from './footprint';
import { joinPlan, JOIN_MAX_STEPS, joinShape } from './join';
import { joinId, pairOfJoinId, sanitizeLayout } from './savedLayout';
import { isLandInWorld } from './map';
import { isPlanDone, planCells } from './plans';
import { fillPlanCell } from '../engine';
import { sanitizeState } from '../engine/sanitize';
import { EMPTY_STATE } from '../engine/state';
import { applyLayout } from './appliedLayout';
import { joinTriangles } from './budget';
import { appliedJoins, getJoin } from './join';
import { buildMesh, faceCount } from './mesher';
import { avatarRoute, worldCubes } from './terrain';


const VOLCAN: BiomeId = 'maths-6e-decimals';

function apres(r: ReturnType<typeof moveIsland>): World {
  if (!r.ok) throw new Error(`refusée : ${r.reason}`);
  return r.world;
}

/** Le Volcan posé à la première place libre où il a un voisin ouvert à réunir, et ce voisin. */
function voisins(): { w: World; autre: BiomeId } {
  const w = toutConstruit().world;
  for (const s of freeSpots(w, VOLCAN)) {
    const r = moveIsland(w, VOLCAN, s);
    if (!r.ok) continue;
    const c = joinCandidates(r.world, VOLCAN).filter((id) => !isFixedPlace(id));
    if (c.length) return { w: r.world, autre: c[0] };
  }
  throw new Error('aucune place voisine');
}

const cles = (w: World, a: BiomeId) => {
  const j = joinsIn(w, '6e').find((x) => x.pair.includes(a))!;
  return joinPlan(j.pair[0], j.pair[1], j.shape);
};

afterEach(() => {
  applyLayout(undefined);
});

describe('Réunir deux lieux', () => {
  it('sur la carte de départ, la Tour et la Ferme (leur isthme d’avant) peuvent déjà se réunir ; le Volcan, loin de tous, non', () => {
    const w = toutConstruit().world;
    expect(joinCandidates(w, 'french-6e-reading')).toEqual(['french-6e-grammar-spelling']);
    expect(joinCandidates(w, VOLCAN)).toEqual([]);
  });

  it('deux voisins au plus près : 4 cases de long au moins, sur l’eau, des deux côtes à l’autre', () => {
    const { w, autre } = voisins();
    const forme = joinShape(groupAt(w, VOLCAN, spotOf(w, VOLCAN))[0].def, groupAt(w, autre, spotOf(w, autre))[0].def)!;
    expect(forme).not.toBeNull();
    expect(forme.steps).toBeLessThanOrEqual(JOIN_MAX_STEPS);
    // Chaque colonne relie les deux côtes : au moins l'écart de règle, sur l'eau seulement.
    const parColonne = new Map<number, number>();
    for (const c of forme.cells) parColonne.set(c.j, (parColonne.get(c.j) ?? 0) + 1);
    for (const n of parColonne.values()) expect(n).toBeGreaterThanOrEqual(GAP_BETWEEN_PLACES);
    const lieux = groupAt(w, VOLCAN, spotOf(w, VOLCAN)).concat(groupAt(w, autre, spotOf(w, autre)));
    for (const c of forme.cells) for (const l of lieux) expect(isLandInWorld(l.def, c.x, c.y)).toBe(false);
    expect(parColonne.size).toBeGreaterThanOrEqual(4);
  });

  it('réunir : la paire entre dans la disposition, leur liaison et celles qui passaient là deviennent à reposer, rien ne se perd', () => {
    const { w, autre } = voisins();
    const r = joinIslands(w, VOLCAN, autre);
    if (!r.ok) throw new Error(r.reason);
    expect(joinedWith(r.world, VOLCAN)).toBe(autre);
    expect(r.world.links).toEqual(w.links);
    // Aucune liaison ne se trace sur la construction qui réunit, ni entre les deux lieux.
    const zone = joinsIn(r.world, '6e')[0].shape.zone;
    for (const [id, t] of routesIn(r.world, '6e')) {
      if (!t) continue;
      for (const c of t.cases) expect(c.x >= zone.x0 && c.x < zone.x1 && c.y >= zone.y0 && c.y < zone.y1, id).toBe(false);
    }
    // Plus aucune autre réunion pour ces deux-là.
    expect(joinCandidates(r.world, VOLCAN)).toEqual([]);
    expect(joinIslands(r.world, VOLCAN, autre).ok).toBe(false);
    // La sauvegarde la relit, et la disposition tient sur la grille.
    expect(sanitizeLayout(JSON.parse(JSON.stringify(r.world.layout)))).toEqual(r.world.layout);
    expect(posesOfLayout(r.world.layout).get(VOLCAN)).toBeDefined();
  });

  it('la paire bouge et tourne d’un bloc, et le repère des cases de la construction ne change pas', () => {
    const { w, autre } = voisins();
    const w2 = apres(joinIslands(w, VOLCAN, autre));
    const avant = planCells(cles(w2, VOLCAN)).map((c) => c.key).sort();
    // Tourner : les deux tournent ensemble, toujours réunis, la même construction.
    const t = turnIsland(w2, VOLCAN);
    if (t.ok) {
      expect(spotOf(t.world, autre).turn).toBe((spotOf(w2, autre).turn + 1) % 4);
      expect(planCells(cles(t.world, VOLCAN)).map((c) => c.key).sort()).toEqual(avant);
    }
    // Déplacer : le second suit le premier, du même pas.
    const ailleurs = freeSpots(w2, VOLCAN).find((s) => s.x !== spotOf(w2, VOLCAN).x || s.y !== spotOf(w2, VOLCAN).y)!;
    const w3 = apres(moveIsland(w2, VOLCAN, ailleurs));
    expect(spotOf(w3, autre).x - spotOf(w3, VOLCAN).x).toBe(spotOf(w2, autre).x - spotOf(w2, VOLCAN).x);
    expect(spotOf(w3, autre).y - spotOf(w3, VOLCAN).y).toBe(spotOf(w2, autre).y - spotOf(w2, VOLCAN).y);
    expect(planCells(cles(w3, VOLCAN)).map((c) => c.key).sort()).toEqual(avant);
  });

  it('la carte de départ garde les lieux réunis où ils sont (ils ne se séparent plus)', () => {
    const { w, autre } = voisins();
    const w2 = apres(joinIslands(w, VOLCAN, autre));
    const w3 = backToStartingMap(w2, '6e');
    if (!w3) return;
    expect(joinedWith(w3, VOLCAN)).toBe(autre);
    expect(spotOf(w3, VOLCAN)).toEqual(spotOf(w2, VOLCAN));
  });

  it('dans le monde : en fantôme à poser, puis une digue pleine, qui coûte moins que le pire compté, sans matériau nouveau ; on y marche', () => {
    const { w, autre } = voisins();
    const w2 = apres(joinIslands(w, VOLCAN, autre));
    const { progress } = toutConstruit();
    applyLayout(w2.layout);
    const j = appliedJoins('6e')[0];
    expect(getJoin(j.plan.id)).toBe(j);
    // À poser : un fantôme par case, rien d'autre.
    const avant = worldCubes('6e', progress, w2, false);
    expect(avant.filter((c) => c.place === `monument:${j.plan.id}`).every((c) => c.ghost)).toBe(true);
    // Toute posée : pleine, payée moitié par chaque lieu.
    const fini = { ...w2, parts: { ...w2.parts, [j.plan.id]: planCells(j.plan).map((c) => c.key) } };
    const terrain = worldCubes('6e', progress, fini, false);
    const sans = terrain.filter((c) => c.place !== `monument:${j.plan.id}`);
    const ajout = (faceCount(buildMesh(terrain)) - faceCount(buildMesh(sans))) * 2;
    expect(ajout).toBeGreaterThan(0);
    expect(ajout).toBeLessThanOrEqual(joinTriangles('6e'));
    expect(buildMesh(terrain).length).toBe(buildMesh(sans).length);
    const blocs = new Set(j.plan.cells.map((c) => c.block));
    expect(blocs.size).toBe(2);
    // Le bonhomme passe d'un lieu à l'autre par la construction.
    const route = avatarRoute(VOLCAN, autre, w2.links.filter((id) => !(w2.layout?.['6e']?.relink ?? []).includes(id)));
    expect(route).not.toBeNull();
  });

  it('une réunion n’est terminée que quand toutes les cases de SON plan sont posées, même avec des clés étrangères ; les clés lues sont plafonnées', () => {
    const { w, autre } = voisins();
    const plan = cles(apres(joinIslands(w, VOLCAN, autre)), VOLCAN);
    const toutes = planCells(plan).map((c) => c.key);
    // Autant de clés que de cases, mais une étrangère (une autre forme, un ancien repère) à la place de la dernière.
    const etrangere = '999,999,999';
    const presque = [...toutes.slice(0, -1), etrangere];
    expect(isPlanDone(plan, { [plan.id]: presque })).toBe(false);
    expect(isPlanDone(plan, { [plan.id]: toutes })).toBe(true);
    // Poser une case quand la liste a déjà la bonne longueur avec une clé étrangère : pas terminé tant qu'il en manque.
    const derniere = planCells(plan).at(-1)!;
    const avantDerniere = planCells(plan).at(-2)!;
    const base = { ...EMPTY_STATE, stock: { [avantDerniere.block]: 5, [derniere.block]: 5 } };
    const etat = { ...base, world: { ...base.world, parts: { [plan.id]: [...toutes.slice(0, -2), etrangere] } } };
    const r1 = fillPlanCell(etat, plan, avantDerniere.x, avantDerniere.y, avantDerniere.z);
    expect(r1.ok && r1.completed).toBe(false);
    const r2 = r1.ok ? fillPlanCell(r1.state, plan, derniere.x, derniere.y, derniere.z) : r1;
    expect(r2.ok && r2.completed).toBe(true);
    // À la lecture : les clés sont gardées (rien ne se perd), mais pas plus de 512, ni ce qui n'est pas une case.
    const lu = sanitizeState({ world: { parts: { [plan.id]: [...Array.from({ length: 2000 }, (_, i) => `${i},0,0`), 'pas une case', 12] } } });
    expect(lu.world.parts[plan.id].length).toBe(512);
    expect(lu.world.parts[plan.id].every((k) => /^-?\d+,-?\d+,-?\d+$/.test(k))).toBe(true);
    const garde = sanitizeState({ world: { parts: { [plan.id]: presque } } });
    expect(garde.world.parts[plan.id]).toEqual(presque);
  });

  it('« Carte de départ » : proposée seulement si la carte change vraiment', () => {
    const w = toutConstruit().world;
    expect(startingMapState(w, '6e')).toBe('pareille');
    // Un lieu remis à sa place de départ, écrite dans la disposition : rien ne changerait.
    const remis = apres(moveIsland(apres(moveIsland(w, VOLCAN, freeSpots(w, VOLCAN)[0])), VOLCAN, startingSpot(VOLCAN)));
    expect(startingMapState(remis, '6e')).toBe('pareille');
    expect(startingMapState(apres(moveIsland(w, VOLCAN, freeSpots(w, VOLCAN)[0])), '6e')).toBe('possible');
  });

  it('l’identifiant de la construction dit ses deux lieux, d’une même région', () => {
    expect(pairOfJoinId(joinId(VOLCAN, 'french-6e-reading'))).toEqual([VOLCAN, 'french-6e-reading']);
    expect(pairOfJoinId('join.maths-6e-decimals.maths-5e-proportionality')).toBeNull();
    expect(pairOfJoinId('landmark-6e-1')).toBeNull();
  });
});
