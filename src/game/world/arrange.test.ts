// Aménager sa région (GD-9, L5, les actions pures) : déplacer et tourner un lieu (son Gardien le suit, GD-11), une
// borne dans la bande de devant, une arrivée ; les liaisons qui ne tiennent plus deviennent « à reposer », se reposent
// gratuitement, et rien ne se perd ; la carte de départ rend tout.
import { describe, expect, it } from 'vitest';
import type { BiomeId } from '../biomes';
import type { World } from '../engine/state';
import { reachableIslands } from './archipelago';
import { ARCHIPELAGO_IDS, archipelagoOfIsland } from './archipelagos';
import {
  backToStartingMap,
  currentLandings,
  DIRECTION_STEP,
  DIRECTIONS,
  spotNear,
  freeLandings,
  freeSpots,
  freeStationSpots,
  isFixedPlace,
  isFreeSpot,
  joinIslands,
  linksBrokenBy,
  linksToRelink,
  moveIsland,
  moveLanding,
  moveStation,
  placeIn,
  nearestFreeSpot,
  stepSpot,
  stationSpots,
  joinCandidates,
  joinCandidatesAt,
  landingSpots,
  relinkBetween,
  relinkChoices,
  routesIn,
  settleNewPlaces,
  spotOf,
  startingSpot,
  stationBand,
  stationOf,
  turnIsland,
} from './arrange';
import { toutConstruit } from './budget';
import { fittingPlaces, footprintOf, frameOf, gapBetween, GAP_BETWEEN_PLACES, monumentIslet, placedIsland, poseOfSpot, posesOfLayout } from './footprint';
import { getMonument, MONUMENT_ISLET } from './monuments';
import { placesOf, startingPlaces } from './routing';
import { LAYOUT_LAST_SPOT, sanitizeLayout } from './savedLayout';
import { questStations } from './terrain/markers';

/** Une partie toute reliée : chaque région ouverte, ses liaisons posées. */
const partie = (): World => toutConstruit().world;

/** Le lieu qu'on déplace dans ces tests : le Volcan des décimaux (6e), relié à la Plaine et à la Tour. */
const VOLCAN: BiomeId = 'maths-6e-decimals';

/**
 * La Rivière des fractions (6e), reliée à la Plaine et au Laboratoire : depuis les formes des îles (GD-12), le Volcan,
 * au coin de devant, n'a que cinq à sept places par quart de tour ; on déplace la Rivière quand il en faut beaucoup.
 */
const RIVIERE: BiomeId = 'maths-6e-fractions';

/** Le monde, une fois l'action faite (l'action doit réussir). */
function apres(r: ReturnType<typeof moveIsland>): World {
  if (!r.ok) throw new Error(`refusée : ${r.reason}`);
  return r.world;
}

describe('les places des lieux', () => {
  it('la carte de départ est sur la grille, chaque lieu à une place libre', () => {
    const w = partie();
    for (const a of ARCHIPELAGO_IDS)
      for (const id of placesOf(a)) {
        expect(isFreeSpot(w, id, startingSpot(id)), id).toBe(true);
        expect(spotOf(w, id)).toEqual(startingSpot(id));
      }
  });

  it('le lieu de départ ne bouge pas ; en 6e, les deux lieux ouverts au départ non plus', () => {
    expect(startingPlaces('6e')).toEqual(['french-6e-phonology', 'maths-6e-calculation']);
    const w = partie();
    for (const a of ARCHIPELAGO_IDS)
      for (const id of startingPlaces(a)) {
        expect(isFixedPlace(id)).toBe(true);
        const ailleurs = freeSpots(w, id).find((s) => s.x !== startingSpot(id).x || s.y !== startingSpot(id).y);
        if (ailleurs) expect(moveIsland(w, id, ailleurs)).toEqual({ ok: false, reason: 'fixe' });
        expect(turnIsland(w, id)).toEqual({ ok: false, reason: 'fixe' });
      }
    expect(isFixedPlace(VOLCAN)).toBe(false);
  });

  it('le fantôme se cale sur la place libre la plus proche du point touché', () => {
    const w = partie();
    const c = frameOf('6e');
    const loin = { x: c.x1, y: c.y1 };
    const s = nearestFreeSpot(w, VOLCAN, loin)!;
    expect(isFreeSpot(w, VOLCAN, s)).toBe(true);
    const d = (p: { x: number; y: number }) => Math.hypot(c.x0 + p.x * 4 + 8 - loin.x, c.y0 + p.y * 4 + 8 - loin.y);
    for (const autre of freeSpots(w, VOLCAN)) expect(d(autre)).toBeGreaterThanOrEqual(d(s));
  });

  it('déplacer un lieu l’écrit dans la disposition, que la sauvegarde relit et que la grille accepte', () => {
    const w = partie();
    const s = freeSpots(w, VOLCAN).find((p) => p.x !== startingSpot(VOLCAN).x || p.y !== startingSpot(VOLCAN).y)!;
    const w2 = apres(moveIsland(w, VOLCAN, s));
    expect(w2.layout?.['6e']?.islands?.[VOLCAN]).toEqual(s);
    expect(sanitizeLayout(JSON.parse(JSON.stringify(w2.layout)))).toEqual(w2.layout);
    expect(posesOfLayout(w2.layout).has(VOLCAN)).toBe(true);
    expect(w2.links).toEqual(w.links);
    // Revenu à sa place de départ, il quitte la disposition.
    const w3 = apres(moveIsland(w2, VOLCAN, startingSpot(VOLCAN)));
    expect(w3.layout?.['6e']?.islands).toBeUndefined();
  });

  it('une place prise est refusée', () => {
    const w = partie();
    expect(moveIsland(w, VOLCAN, startingSpot('maths-6e-calculation'))).toEqual({ ok: false, reason: 'occupee' });
    expect(moveIsland(w, VOLCAN, { x: -1, y: 0, turn: 0 })).toEqual({ ok: false, reason: 'occupee' });
  });

  it('les flèches avancent d’un cran, même sur une place prise, jusqu’au bord : « Plus de place par là » (choix 3)', () => {
    const w = partie();
    const depart = startingSpot(VOLCAN);
    const max = LAYOUT_LAST_SPOT['6e'];
    let prises = 0;
    for (const dir of DIRECTIONS) {
      const { dx, dy } = DIRECTION_STEP[dir];
      let at = depart;
      for (let n = 0; n < 200; n++) {
        const s = stepSpot(w, VOLCAN, at, dir);
        if (!s) break;
        // Un seul cran, jamais un saut vers la place libre suivante.
        expect({ x: s.x - at.x, y: s.y - at.y, turn: s.turn }).toEqual({ x: dx, y: dy, turn: at.turn });
        if (!isFreeSpot(w, VOLCAN, s)) prises++;
        at = s;
      }
      // Au bord de la grille seulement.
      expect(at.x === 0 || at.y === 0 || at.x === max.x || at.y === max.y).toBe(true);
      expect(stepSpot(w, VOLCAN, at, dir)).toBeNull();
    }
    // En chemin, des places prises : le fantôme y passe (la croix grise), sans sauter.
    expect(prises).toBeGreaterThan(0);
  });

  it('une place qui colle le lieu à un voisin le dit (« Réunir », choix 2a) ; sa place de départ, voisine de la Baie, aussi', () => {
    const w = partie();
    const TOUR = 'french-6e-reading' as BiomeId;
    expect(joinCandidatesAt(w, TOUR, spotOf(w, TOUR))).toEqual(joinCandidates(w, TOUR));
    expect(joinCandidates(w, TOUR).length).toBeGreaterThan(0);
    // Loin de tous : aucune réunion.
    const loin = freeSpots(w, RIVIERE).find((s) => !joinCandidatesAt(w, RIVIERE, s).length);
    expect(loin).toBeDefined();
  });

  it('dans chaque région, chaque lieu mobile de la carte de départ peut tourner (à sa place ou ailleurs) (GD-11)', () => {
    // Jusqu'à GD-11, l'îlot du Gardien prenait la place qui manquait à quatre lieux (HG-3, SC-3) ; le Gardien se tient
    // désormais sur son île, et chaque lieu trouve une place, tourné.
    const w = partie();
    const sans: string[] = [];
    for (const a of ARCHIPELAGO_IDS) for (const id of placesOf(a).filter((p) => !isFixedPlace(p))) if (!turnIsland(w, id).ok) sans.push(id);
    expect(sans).toEqual([]);
  });

  it('tourner un lieu d’un quart de tour, quatre fois, le ramène à son orientation', () => {
    let w = partie();
    const turns: number[] = [];
    for (let i = 0; i < 4; i++) {
      w = apres(turnIsland(w, VOLCAN));
      turns.push(spotOf(w, VOLCAN).turn);
      expect(isFreeSpot(w, VOLCAN, spotOf(w, VOLCAN))).toBe(true);
    }
    expect(turns).toEqual([1, 2, 3, 0]);
  });
});

describe('les liaisons à reposer', () => {
  /**
   * Le lieu qu'on déplace ici : la Mine des lettres, entre la Forêt et la Carrière. Depuis les formes des îles (GD-12),
   * la mer est plus large entre les lieux et les liaisons se retracent presque partout ; la Mine a encore des places
   * qui en défont.
   */
  const MINE: BiomeId = 'french-6e-letter-confusion';

  /** Une place de la Mine (tournée ou non) qui défait au moins une de ses liaisons. */
  function placeQuiDefait(w: World) {
    for (const turn of [1, 2, 3, 0] as const)
      for (const s of freeSpots(w, MINE, turn)) {
        const cassees = linksBrokenBy(w, MINE, s);
        if (cassees.length) return { s, cassees };
      }
    throw new Error('aucune place ne défait de liaison');
  }

  it('une liaison qui ne tient plus devient « à reposer » : construite, gardée, ses lieux restent ouverts', () => {
    const w = partie();
    const { s, cassees } = placeQuiDefait(w);
    const w2 = apres(moveIsland(w, MINE, s));
    expect(linksToRelink(w2, '6e')).toEqual(cassees);
    expect(w2.links).toEqual(w.links);
    expect(reachableIslands(w2.links)).toEqual(reachableIslands(w.links));
    // Elle n'est plus tracée ; les autres liaisons posées le sont toutes encore.
    const traces = routesIn(w2, '6e');
    for (const id of cassees) expect(traces.has(id)).toBe(false);
    for (const [id, t] of routesIn(w, '6e')) if (t && !cassees.includes(id)) expect(traces.get(id), id).toBeTruthy();
    expect(sanitizeLayout(JSON.parse(JSON.stringify(w2.layout)))).toEqual(w2.layout);
  });

  it('elle se repose gratuitement entre deux voisins au choix, sans fermer un lieu ni en défaire une autre', () => {
    const w = partie();
    const { s, cassees } = placeQuiDefait(w);
    const w2 = apres(moveIsland(w, MINE, s));
    const id = cassees[0];
    const choix = relinkChoices(w2, id);
    expect(choix.length).toBeGreaterThan(0);
    const w3 = apres(relinkBetween(w2, id, choix[0]));
    expect(linksToRelink(w3, '6e')).not.toContain(id);
    expect(w3.links).toContain(choix[0]);
    expect(w3.links.length).toBe(w.links.length);
    for (const lieu of reachableIslands(w.links)) expect(reachableIslands(w3.links).has(lieu)).toBe(true);
    expect(routesIn(w3, '6e').get(choix[0])).toBeTruthy();
    // Pas une liaison à reposer, ou une liaison déjà posée : refusé.
    expect(relinkBetween(w3, id, choix[0]).ok).toBe(false);
    expect(relinkBetween(w2, id, w.links.find((l) => l !== id && routesIn(w, '6e').has(l))!).ok).toBe(false);
  });

  it('revenir à la carte de départ vide la disposition et rend les liaisons posées, aucune perdue', () => {
    const w = partie();
    const { s } = placeQuiDefait(w);
    const w2 = apres(moveIsland(w, MINE, s));
    const w3 = backToStartingMap(w2, '6e')!;
    expect(w3.layout).toBeUndefined();
    expect(w3.links).toEqual(w.links);
    expect([...routesIn(w3, '6e').values()].filter((t) => !t).length).toBe([...routesIn(w, '6e').values()].filter((t) => !t).length);
    // Les autres régions gardent leur disposition.
    // (Le Relais des voyageurs : aux Îles Brumeuses, depuis HG-3, c'est le seul lieu qui tourne sur place.)
    const autre = apres(turnIsland(w2, 'lv2-5e-introductions'));
    expect(backToStartingMap(autre, '6e')!.layout).toEqual({ '5e': autre.layout!['5e'] });
  });
});

describe('le glissé d’un lieu (7 octobre 2026, choix 1b du mainteneur)', () => {
  it('se cale sur la place de la grille la plus proche du point, libre ou prise, jamais hors de la grille', () => {
    const w = partie();
    const ici = spotOf(w, VOLCAN);
    const c = frameOf('6e');
    expect(spotNear(w, VOLCAN, { x: c.x0 + ici.x * 4 + 8 + 1, y: c.y0 + ici.y * 4 + 8 - 1 }, 0)).toEqual(ici);
    expect(spotNear(w, VOLCAN, { x: c.x0 + ici.x * 4 + 8 + 9, y: c.y0 + ici.y * 4 + 8 }, 0)).toEqual({ ...ici, x: ici.x + 2 });
    expect(spotNear(w, VOLCAN, { x: -1e4, y: 1e4 }, 1)).toEqual({ x: 0, y: LAYOUT_LAST_SPOT['6e'].y, turn: 1 });
  });
});

describe('les bornes dans la bande de devant', () => {
  const borne = `${VOLCAN}:${questStations(VOLCAN)[0].typeId}`;

  it('se déplacent sur une place libre de la bande, au pas de 4, loin des autres bornes', () => {
    const w = partie();
    const libres = freeStationSpots(w, borne);
    expect(libres.length).toBeGreaterThan(0);
    const depart = questStations(VOLCAN)[0];
    for (const p of libres) expect([...stationBand(VOLCAN), { x: depart.x, y: depart.y }]).toContainEqual(p);
    const w2 = apres(moveStation(w, borne, libres.find((p) => p.x !== depart.x)!));
    expect(stationOf(w2, borne)).toEqual(libres.find((p) => p.x !== depart.x));
    expect(sanitizeLayout(JSON.parse(JSON.stringify(w2.layout)))).toEqual(w2.layout);
    // La place d'une autre borne, ou à côté : refusée.
    const autre = questStations(VOLCAN)[1];
    expect(moveStation(w, borne, { x: autre.x + 1, y: autre.y })).toEqual({ ok: false, reason: 'occupee' });
    // Revenue à sa place, elle quitte la disposition.
    const w3 = apres(moveStation(w2, borne, { x: depart.x, y: depart.y }));
    expect(w3.layout).toBeUndefined();
  });

  it('une borne inconnue ne bouge pas, et les flèches restent dans la bande', () => {
    const w = partie();
    expect(moveStation(w, `${VOLCAN}:inconnue`, { x: 2, y: 1 })).toEqual({ ok: false, reason: 'inconnu' });
    // Toutes ses places, libres ou prises (choix 3) : la bande de devant, et sa place de départ.
    const depart = questStations(VOLCAN)[0];
    for (const p of stationSpots(w, borne)) expect([...stationBand(VOLCAN), { x: depart.x, y: depart.y }]).toContainEqual(p);
    for (const p of freeStationSpots(w, borne)) expect(stationSpots(w, borne)).toContainEqual(p);
  });
});

describe('les bornes déplacées dans la sauvegarde', () => {
  // GD-11 : le cœur des îles-écoles passe à 26 (la bande de devant commence à x = −3), celui des autres à 22. Une borne
  // posée sur n'importe quelle place de la bande se relit telle quelle depuis la sauvegarde.
  const ECOLES: BiomeId[] = ['french-6e-phonology', 'maths-5e-proportionality', 'maths-4e-algebra', 'maths-3e-functions'];

  it.each([...ECOLES, VOLCAN])('%s : chaque place de la bande de devant revient de la sauvegarde', (id) => {
    const w = partie();
    const cles = questStations(id).map((st) => `${id}:${st.typeId}`);
    const bande = stationBand(id);
    const essayees: { x: number; y: number }[] = [];
    for (const p of bande) {
      // Une borne pour qui la place est libre (une place près d'une autre borne ou d'un chantier ne l'est pour aucune).
      const cle = cles.find((k) => freeStationSpots(w, k).some((q) => q.x === p.x && q.y === p.y));
      if (!cle) continue;
      essayees.push(p);
      const w2 = apres(moveStation(w, cle, p));
      expect(stationOf(w2, cle), `${cle} ${p.x},${p.y}`).toEqual(p);
      const lu = sanitizeLayout(JSON.parse(JSON.stringify(w2.layout ?? null)));
      expect(lu, `${cle} ${p.x},${p.y}`).toEqual(w2.layout);
    }
    // La première place de la bande (x = −3 sur une île-école) se prend par le geste.
    expect(essayees).toContainEqual(bande[0]);
    // La sauvegarde garde aussi une place de la bande prise aujourd'hui (une borne déplacée avant qu'une autre s'en
    // approche), aux deux bouts de la bande.
    for (const p of [bande[0], bande[bande.length - 1]]) {
      const layout = { [archipelagoOfIsland(id)]: { stations: { [cles[0]]: p } } };
      expect(sanitizeLayout(layout), `${cles[0]} ${p.x},${p.y}`).toEqual(layout);
    }
  });
});

describe('les arrivées des liaisons', () => {
  it('se déplacent sur une côte libre ; la liaison repart de là, ou devient « à reposer »', () => {
    const w = partie();
    const [id] = [...routesIn(w, '6e')].find(([, t]) => t)!;
    const avant = currentLandings(w, id)!;
    const libres = freeLandings(w, id, 'to');
    expect(libres).toContainEqual(avant.to);
    const autre = libres.find((l) => l.side !== avant.to.side || l.step !== avant.to.step)!;
    const r = moveLanding(w, id, 'to', autre);
    const w2 = apres(r);
    expect(w2.layout?.['6e']?.landings?.[id]).toEqual({ from: avant.from, to: autre });
    const t = routesIn(w2, '6e').get(id);
    if (r.ok && r.relink.includes(id)) expect(t).toBeUndefined();
    else expect({ side: t!.vers.cote, step: t!.vers.pas }).toEqual({ side: { front: 'devant', right: 'droite', back: 'derriere', left: 'gauche' }[autre.side], step: autre.step });
    expect(sanitizeLayout(JSON.parse(JSON.stringify(w2.layout)))).toEqual(w2.layout);
    // Toutes les arrivées de la côte, libres ou prises : les libres en sont.
    for (const l of libres) expect(landingSpots(w, id, 'to')).toContainEqual(l);
    // Une arrivée qui n'est pas sur la côte : refusée.
    expect(moveLanding(w, id, 'to', { side: 'front', step: 40 }).ok).toBe(false);
  });
});

describe('Un lieu nouveau dans une région déjà aménagée (HG-2)', () => {
  // Une sauvegarde d'avant les îles d'histoire-géographie : l'Horloge posée là où la Fouille des siècles entre au jeu.
  const FOUILLE: BiomeId = 'history-6e-antiquity';
  const POINTE: BiomeId = 'geography-6e-living';
  const HORLOGE: BiomeId = 'english-6e-grammar';
  const VALLEE: BiomeId = 'life-earth-sciences-6e-living-world';
  const ancienne = (): World => ({ ...partie(), layout: { '6e': { islands: { [HORLOGE]: startingSpot(FOUILLE) } } } });

  it('sans rien faire, la région ne tiendrait plus et reviendrait toute à la carte de départ', () => {
    expect(fittingPlaces('6e', { [HORLOGE]: startingSpot(FOUILLE) })).toBeNull();
    expect(posesOfLayout(ancienne().layout).size).toBe(0);
  });

  it('depuis les formes des îles (GD-12), la Fouille, que l’élève n’a pas déplacée, trouve une place libre : elle s’y décale, l’Horloge reste où l’élève l’a mise, et rien d’autre ne bouge', () => {
    const avant = ancienne();
    const w = settleNewPlaces(avant);
    const islands = w.layout?.['6e']?.islands ?? {};
    expect(Object.keys(islands).sort()).toEqual([HORLOGE, FOUILLE].sort());
    expect(islands[HORLOGE]).toEqual(startingSpot(FOUILLE));
    expect(islands[FOUILLE]).not.toEqual(startingSpot(FOUILLE));
    expect(islands[FOUILLE]?.turn).toBe(0);
    expect(fittingPlaces('6e', islands)).not.toBeNull();
    const poses = posesOfLayout(w.layout);
    expect(poses.get(HORLOGE)).toBeDefined();
    expect(poses.get(FOUILLE)).toBeDefined();
    for (const id of [POINTE, VALLEE]) expect(poses.has(id), id).toBe(false);
    // Aucune progression ne se perd : liaisons, réunions et chantiers ne sont pas dans la disposition des places.
    expect(w.links).toBe(avant.links);
  });

  it('au 5e (HG-3) : une île déplacée vers l’est, là où entrent le Bourg et le Delta, reste où l’élève l’a mise ; les deux lieux nouveaux se posent à côté', () => {
    // Une sauvegarde d'avant HG-3 : la Grammaire (english-5e-grammar) posée à l'est, dans le cadre d'alors (144 cases de
    // large), sur les places de départ du Bourg des chroniques et du Delta des ressources (depuis les formes des îles,
    // GD-12, le Bourg au second rang, le Delta au troisième : la Grammaire posée entre eux, sur leurs deux places).
    const BOURG: BiomeId = 'history-5e-middle-ages';
    const DELTA: BiomeId = 'geography-5e-resources';
    const GRAMMAIRE: BiomeId = 'english-5e-grammar';
    const ici = { x: 33, y: 19, turn: 0 as const };
    const avant: World = { ...partie(), layout: { '5e': { islands: { [GRAMMAIRE]: ici } } } };
    expect(fittingPlaces('5e', { [GRAMMAIRE]: ici })).toBeNull();
    const w = settleNewPlaces(avant);
    const islands = w.layout?.['5e']?.islands ?? {};
    expect(islands[GRAMMAIRE]).toEqual(ici);
    for (const id of [BOURG, DELTA]) {
      expect(islands[id], id).toBeDefined();
      expect(islands[id]?.turn, id).toBe(0);
    }
    expect(Object.keys(islands).sort()).toEqual([GRAMMAIRE, BOURG, DELTA].sort());
    expect(fittingPlaces('5e', islands)).not.toBeNull();
    // Les autres régions n'ont pas de disposition : rien n'y bouge.
    expect(Object.keys(w.layout ?? {})).toEqual(['5e']);
  });

  // Une sauvegarde d'avant les îles de sciences (SC-3) : un lieu posé sur la place de départ d'une île de sciences, dans
  // le cadre d'alors (le Château des hypothèses, 4e, sur la Source des espèces ; le Kiosque des témoins, 3e, sur le
  // Tremplin des forces).
  it.each([
    { a: '3e', lieu: 'history-3e-twentieth-century', sur: 'physics-chemistry-3e-motion-energy' },
    // Le Refuge des carnets avance de (158, 928) à (158, 912) pour tous (map.ts, SC-3) : un lieu que l'élève a posé sur sa
    // nouvelle place y reste, et le Refuge se pose ailleurs.
    { a: '3e', lieu: 'history-3e-twentieth-century', sur: 'lv2-3e-travel' },
  ] as const)('au $a (SC-3) : un lieu posé sur la place de départ d’une île de sciences (ou la nouvelle place du Refuge) reste où l’élève l’a mis ; l’île nouvelle se pose ailleurs', ({ a, lieu, sur }) => {
    const ici = startingSpot(sur);
    expect(fittingPlaces(a, { [lieu]: ici })).toBeNull();
    const w = settleNewPlaces({ ...partie(), layout: { [a]: { islands: { [lieu]: ici } } } });
    const islands = w.layout?.[a]?.islands ?? {};
    expect(islands[lieu]).toEqual(ici);
    expect(islands[sur]).toBeDefined();
    expect(islands[sur]).not.toEqual(ici);
    expect(islands[sur]?.turn).toBe(0);
    // Rien d'autre ne bouge : seuls le lieu de l'élève et l'île nouvelle sont dans la disposition, qui tient.
    expect(Object.keys(islands).sort()).toEqual([lieu, sur].sort());
    expect(fittingPlaces(a, islands)).not.toBeNull();
    expect(Object.keys(w.layout ?? {})).toEqual([a]);
  });

  it('au 4e (SC-3, GD-11, puis GD-12) : le Château des hypothèses, posé sur la place de départ de la Source des espèces, ne tient plus ; il se décale, seul, à la place libre la plus proche', () => {
    const lieu: BiomeId = 'english-4e-grammar';
    const ici = startingSpot('life-earth-sciences-4e-cells-evolution');
    expect(fittingPlaces('4e', { [lieu]: ici })).toBeNull();
    const avant: World = { ...partie(), layout: { '4e': { islands: { [lieu]: ici } } } };
    const w = settleNewPlaces(avant);
    // De GD-11 à GD-12, c'était sa place de la carte de départ ; depuis les formes des îles (9 octobre 2026), une place
    // à quatre pas de la sienne, vers la Source.
    expect(w.layout?.['4e']?.islands).toEqual({ [lieu]: { x: 2, y: 18, turn: 0 } });
    expect(fittingPlaces('4e', w.layout!['4e']!.islands!)).not.toBeNull();
    expect(w.links).toBe(avant.links);
  });

  it('les îles ont grandi (GD-11) : un lieu déplacé qui ne laisse plus assez d’eau à un voisin se décale, seul, à la place libre la plus proche ; ses liaisons, ses réunions, ses bornes et ses chantiers restent', () => {
    // Une place du Volcan, déplacé par l'élève avant GD-11, qui tenait avec des îles plus petites : sa terre n'est plus
    // qu'à une, deux ou trois cases d'eau d'un lieu resté à sa place de départ, dans le cadre.
    const w0 = partie();
    const max = LAYOUT_LAST_SPOT['6e'];
    let ici: { x: number; y: number; turn: 0 } | null = null;
    for (let x = 0; x <= max.x && !ici; x++)
      for (let y = 0; y <= max.y && !ici; y++) {
        const s = { x, y, turn: 0 as const };
        if (fittingPlaces('6e', { [VOLCAN]: s })) continue;
        // Trop près d'un voisin, mais sans le toucher : une case de plus de chaque côté, et il tiendrait.
        const plusPetit = [-1, 0, 1].every((dx) => [-1, 0, 1].every((dy) => !fittingPlaces('6e', { [VOLCAN]: { x: x + dx, y: y + dy, turn: 0 } })));
        if (!plusPetit && isFreeSpot({ ...w0, layout: {} }, VOLCAN, { x: x - 1, y, turn: 0 })) ici = s;
      }
    expect(ici).not.toBeNull();
    const avant: World = { ...w0, layout: { '6e': { islands: { [VOLCAN]: ici! } } } };
    // Sans rien faire, la région reviendrait toute à la carte de départ.
    expect(posesOfLayout(avant.layout).size).toBe(0);
    const w = settleNewPlaces(avant);
    const islands = w.layout?.['6e']?.islands ?? {};
    expect(Object.keys(islands).filter((id) => id !== VOLCAN)).toEqual([]);
    expect(fittingPlaces('6e', islands)).not.toBeNull();
    const la = spotOf(w, VOLCAN);
    expect(Math.abs(la.x - ici!.x) + Math.abs(la.y - ici!.y)).toBeLessThanOrEqual(2);
    expect(w.links).toBe(avant.links);
    expect(w.layout?.['6e']?.joined).toEqual(avant.layout?.['6e']?.joined);
    expect(w.layout?.['6e']?.stations).toEqual(avant.layout?.['6e']?.stations);
  });

  /**
   * Une sauvegarde d'avant GD-11 où deux lieux sont réunis : réunis avec des îles plus petites, ils étaient un pas plus
   * près l'un de l'autre que ne le permettent les îles agrandies (deux cases de terre de plus par côté). On la refait
   * en réunissant deux voisins, puis en rapprochant le premier d'un pas (`dx`, `dy`).
   */
  function reunisTropPres(id: BiomeId, autre: BiomeId, dx: number, dy: number): World {
    const w = apres(joinIslands(partie(), id, autre));
    const s = spotOf(w, id);
    const r = w.layout!['6e']!;
    return { ...w, layout: { ...w.layout, '6e': { ...r, islands: { ...r.islands, [id]: { ...s, x: s.x + dx, y: s.y + dy } } } } };
  }

  it('les îles ont grandi (GD-11) : une paire réunie trop rapprochée s’écarte d’un pas, et reste réunie ; rien ne se perd', () => {
    const LABO: BiomeId = 'physics-chemistry-6e-matter-energy';
    const avant = reunisTropPres(RIVIERE, LABO, 1, 0);
    // Sans rien faire, la région ne tiendrait plus et reviendrait toute à la carte de départ, sans sa réunion.
    expect(fittingPlaces('6e', avant.layout!['6e']!.islands!)).toBeNull();
    expect(posesOfLayout(avant.layout).size).toBe(0);
    const w = settleNewPlaces(avant);
    const islands = w.layout?.['6e']?.islands ?? {};
    expect(fittingPlaces('6e', islands)).not.toBeNull();
    // La Rivière reste où l'élève l'a mise ; le Laboratoire des éléments s'écarte d'un pas, et les deux restent réunis,
    // leur construction posable entre eux.
    expect(islands[RIVIERE]).toEqual(avant.layout!['6e']!.islands![RIVIERE]);
    const [s, t] = [spotOf(avant, LABO), spotOf(w, LABO)];
    expect(Math.abs(s.x - t.x) + Math.abs(s.y - t.y)).toBe(1);
    expect(w.layout?.['6e']?.joined).toEqual(avant.layout?.['6e']?.joined);
    expect(joinCandidates({ ...w, layout: { ...w.layout, '6e': { ...w.layout!['6e']!, joined: [] } } }, RIVIERE)).toContain(LABO);
    expect(w.links).toBe(avant.links);
    expect(w.parts).toBe(avant.parts);
  });

  it('les îles ont grandi (GD-11) : une paire réunie qui ne peut pas s’écarter laisse la région à la carte de départ, sans rien perdre', () => {
    // La Ferme et le Volcan, réunis (GD-12), la Ferme un pas plus à l'est, trop près de la Forêt : la paire ne trouve
    // aucun pas qui la sépare de la Forêt, lieu de départ qui ne bouge pas, en gardant sa construction.
    const FERME: BiomeId = 'french-6e-grammar-spelling';
    const avant = reunisTropPres(FERME, VOLCAN, 1, 0);
    expect(fittingPlaces('6e', avant.layout!['6e']!.islands!)).toBeNull();
    const w = settleNewPlaces(avant);
    // Rien ne change dans la sauvegarde (ni les places, ni la réunion, ni les liaisons, ni les chantiers) : la région
    // se montre à la carte de départ (`posesOfLayout`), sa réunion n'est pas posée (`joinsOf`, ./appliedLayout.ts).
    expect(w).toBe(avant);
    expect(posesOfLayout(w.layout).size).toBe(0);
    expect(w.layout?.['6e']?.joined).toEqual([[FERME, VOLCAN]]);
  });

  it('une disposition qui tient, ou pas de disposition, reste la même', () => {
    const w = partie();
    expect(settleNewPlaces(w)).toBe(w);
    const deplace = apres(moveIsland(w, VOLCAN, freeSpots(w, VOLCAN).find((s) => s.x !== startingSpot(VOLCAN).x)!));
    expect(settleNewPlaces(deplace)).toBe(deplace);
  });
});

// L'îlot détaché du grand phare du large (GD-12, carte « Détacher », mainteneur, 9 octobre 2026) : il ne suit plus le
// Glacier dans « Modifier le plan », et le Glacier ne vient pas dessus.
describe('l’îlot détaché du grand phare du large', () => {
  const GLACIER: BiomeId = 'maths-5e-signed-numbers';
  const phare = getMonument('landmark-5e-1')!;
  const kiosque = getMonument('landmark-5e-2')!;

  it('déplacer le Glacier ne déplace pas le phare ; un îlot attaché suit toujours son lieu', () => {
    expect(phare.detache).toBe(true);
    expect(kiosque.detache).toBeUndefined();
    const w = partie();
    const ailleurs = freeSpots(w, GLACIER).find((s) => s.x !== startingSpot(GLACIER).x || s.y !== startingSpot(GLACIER).y)!;
    const deplace = apres(moveIsland(w, GLACIER, ailleurs));
    const def = placeIn(deplace, GLACIER);
    expect(def.core).not.toEqual(placeIn(w, GLACIER).core);
    expect(monumentIslet(phare, def)).toEqual(phare.islet);
    expect(footprintOf(GLACIER, def).find((p) => p.genre === 'monument')).toMatchObject({ x0: phare.islet.x, y0: phare.islet.y, fixe: true });
    // Le kiosque, attaché au Manoir, le suit d'autant que lui.
    const manoir = placeIn(w, kiosque.biome);
    const bouge = placedIsland(kiosque.biome, { x: manoir.core.x + 4, y: manoir.core.y, quarts: manoir.quarts });
    expect(monumentIslet(kiosque, bouge)).toEqual({ x: kiosque.islet.x + 4, y: kiosque.islet.y });
  });

  it('le Glacier ne vient pas sur son îlot : aucune place à moins de quatre cases d’eau de lui', () => {
    const w = partie();
    const ilot = { x0: phare.islet.x, y0: phare.islet.y, x1: phare.islet.x + MONUMENT_ISLET, y1: phare.islet.y + MONUMENT_ISLET };
    const max = LAYOUT_LAST_SPOT['5e'];
    let pres = 0;
    for (let x = 0; x <= max.x; x++)
      for (let y = 0; y <= max.y; y++) {
        const spot = { x, y, turn: spotOf(w, GLACIER).turn };
        const terre = footprintOf(GLACIER, placedIsland(GLACIER, poseOfSpot('5e', spot))).filter((p) => !p.fixe);
        if (!terre.some((r) => gapBetween(r, ilot) < GAP_BETWEEN_PLACES)) continue;
        pres++;
        expect(isFreeSpot(w, GLACIER, spot), `${x},${y}`).toBe(false);
        expect(fittingPlaces('5e', { [GLACIER]: spot }), `${x},${y}`).toBeNull();
      }
    expect(pres).toBeGreaterThan(0);
  });
});
