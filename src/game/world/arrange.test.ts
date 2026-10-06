// Aménager sa région (GD-9, L5, les actions pures) : déplacer et tourner un lieu, un Gardien autour de son lieu, une
// borne dans la bande de devant, une arrivée ; les liaisons qui ne tiennent plus deviennent « à reposer », se reposent
// gratuitement, et rien ne se perd ; la carte de départ rend tout.
import { describe, expect, it } from 'vitest';
import type { BiomeId } from '../biomes';
import type { World } from '../engine/state';
import { reachableIslands } from './archipelago';
import { ARCHIPELAGO_IDS } from './archipelagos';
import {
  backToStartingMap,
  currentLandings,
  DIRECTION_STEP,
  DIRECTIONS,
  freeGuardianSpots,
  freeLandings,
  freeSpots,
  freeStationSpots,
  guardianFacing,
  guardianOf,
  isFixedPlace,
  isFreeSpot,
  linksBrokenBy,
  linksToRelink,
  moveGuardian,
  moveIsland,
  moveLanding,
  moveStation,
  nearestFreeSpot,
  nearestGuardianSpot,
  stepSpot,
  stepGuardianSpot,
  stationSpots,
  isFreeGuardianSpot,
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
  turnGuardian,
  turnIsland,
} from './arrange';
import { toutConstruit } from './budget';
import { fittingPlaces, frameOf, guardianIsletRectangle, posesOfLayout } from './footprint';
import { startingIsland } from './map';
import { placesOf, startingPlaces } from './routing';
import { LAYOUT_LAST_SPOT, sanitizeLayout } from './savedLayout';
import { rectangleDeLIlot } from './terrain/islets';
import { questStations } from './terrain/markers';

/** Une partie toute reliée : chaque région ouverte, ses liaisons posées. */
const partie = (): World => toutConstruit().world;

/** Le lieu qu'on déplace dans ces tests : le Volcan des décimaux (6e), relié à la Plaine et à la Tour. */
const VOLCAN: BiomeId = 'maths-6e-decimals';

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

  it('une place qui colle le lieu à un voisin le dit (« Réunir », choix 2a) ; sa place de départ, voisine de la Ferme, aussi', () => {
    const w = partie();
    const TOUR = 'french-6e-reading' as BiomeId;
    expect(joinCandidatesAt(w, TOUR, spotOf(w, TOUR))).toEqual(joinCandidates(w, TOUR));
    expect(joinCandidates(w, TOUR).length).toBeGreaterThan(0);
    // Loin de tous : aucune réunion.
    const loin = freeSpots(w, VOLCAN).find((s) => !joinCandidatesAt(w, VOLCAN, s).length);
    expect(loin).toBeDefined();
  });

  it('aux 5e, 4e et 3e, chaque lieu mobile de la carte de départ peut tourner (à sa place ou ailleurs), sauf quatre (HG-3, SC-3)', () => {
    // Tournés, le Glacier des relatifs (52 × 34 cases avec son monument) et la Gare du futur (4e, 37 × 28) ne trouvaient
    // aucune place libre (HG-3). Depuis les îles de sciences (SC-3), trois îles de plus par classe sur les places libres :
    // la Grammaire (5e) et le Refuge des carnets (3e) n'en trouvent plus non plus (mesuré). Limite connue d'Aménager : le
    // fantôme ne pivote pas, la ligne dit le refus (arrangeMode.test.ts).
    const SANS_PLACE: readonly BiomeId[] = ['maths-5e-signed-numbers', 'english-5e-grammar', 'english-4e-grammar', 'lv2-3e-travel'];
    const w = partie();
    const sans: string[] = [];
    for (const a of ['5e', '4e', '3e'] as const)
      for (const id of placesOf(a).filter((p) => !isFixedPlace(p))) if (!turnIsland(w, id).ok) sans.push(id);
    expect(sans).toEqual(SANS_PLACE);
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
  /** Une place du Volcan (tourné) qui défait au moins une de ses liaisons. */
  function placeQuiDefait(w: World) {
    for (const turn of [1, 2, 3] as const)
      for (const s of freeSpots(w, VOLCAN, turn)) {
        const cassees = linksBrokenBy(w, VOLCAN, s);
        if (cassees.length) return { s, cassees };
      }
    throw new Error('aucune place ne défait de liaison');
  }

  it('une liaison qui ne tient plus devient « à reposer » : construite, gardée, ses lieux restent ouverts', () => {
    const w = partie();
    const { s, cassees } = placeQuiDefait(w);
    const w2 = apres(moveIsland(w, VOLCAN, s));
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
    const w2 = apres(moveIsland(w, VOLCAN, s));
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
    const w2 = apres(moveIsland(w, VOLCAN, s));
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

describe('les Gardiens autour de leur lieu', () => {
  it('à sa place de départ, devant, au pas 0 : le même îlot qu’aujourd’hui', () => {
    for (const a of ARCHIPELAGO_IDS)
      for (const id of placesOf(a)) expect(guardianIsletRectangle(startingIsland(id), { side: 'front', step: 0 }), id).toEqual(rectangleDeLIlot(startingIsland(id)));
  });

  it('se déplace sur un des quatre côtés, à une place libre, et garde ce qu’il regarde', () => {
    const w = partie();
    const places = freeGuardianSpots(w, VOLCAN);
    expect(places).toContainEqual({ side: 'front', step: 0 });
    const ailleurs = places.find((g) => g.side !== 'front')!;
    expect(ailleurs).toBeDefined();
    const w2 = apres(moveGuardian(w, VOLCAN, ailleurs));
    const g = guardianOf(w2, VOLCAN);
    expect({ side: g.side, step: g.step }).toEqual(ailleurs);
    expect(guardianFacing(guardianOf(w, VOLCAN))).toBe('mer');
    expect(guardianFacing(g)).toBe('mer');
    expect(posesOfLayout(w2.layout).size).toBe(0);
    expect(sanitizeLayout(JSON.parse(JSON.stringify(w2.layout)))).toEqual(w2.layout);
    // Le calage et les flèches restent sur les places libres.
    const proche = nearestGuardianSpot(w, VOLCAN, { x: 0, y: 0 })!;
    expect(places).toContainEqual(proche);
    // Les flèches avancent d'un cran le long de son lieu, libre ou pris (choix 3) : toujours contre sa terre.
    for (const dir of DIRECTIONS) {
      const n = stepGuardianSpot(w, VOLCAN, { side: 'front', step: 0 }, dir);
      if (n) expect(Math.abs(n.step) <= 8 && (n.side !== 'front' || n.step !== 0)).toBe(true);
    }
    expect(isFreeGuardianSpot(w, VOLCAN, { side: 'front', step: 0 })).toBe(true);
    // Une place qui n'est pas contre son lieu : refusée.
    expect(moveGuardian(w, VOLCAN, { side: 'front', step: 8 })).toEqual({ ok: false, reason: 'occupee' });
  });

  it('tourne d’un quart de tour à chaque toucher : la mer, la côte, son île, la côte', () => {
    let w = partie();
    const vus: string[] = [];
    for (let i = 0; i < 4; i++) {
      w = apres(turnGuardian(w, VOLCAN));
      vus.push(guardianFacing(guardianOf(w, VOLCAN)));
    }
    expect(vus).toEqual(['cote', 'ile', 'cote', 'mer']);
    expect(w.layout).toBeUndefined();
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

  it('le lieu nouveau se pose à la place libre la plus proche de sa place de départ ; l’Horloge reste où l’élève l’a mise, rien d’autre ne bouge', () => {
    const w = settleNewPlaces(ancienne());
    const islands = w.layout?.['6e']?.islands ?? {};
    expect(islands[HORLOGE]).toEqual(startingSpot(FOUILLE));
    expect(islands[FOUILLE]).toBeDefined();
    expect(islands[FOUILLE]).not.toEqual(startingSpot(FOUILLE));
    expect(islands[FOUILLE]?.turn).toBe(0);
    // La Pointe ne touchait rien : elle reste à sa place de départ, hors de la disposition, comme les autres lieux. La
    // Vallée du vivant (SC-2), entre l'Horloge et la Fouille, touche l'Horloge plus large que la Fouille : nouvelle elle
    // aussi, elle se pose à la place libre la plus proche.
    expect(Object.keys(islands).sort()).toEqual([HORLOGE, FOUILLE, VALLEE].sort());
    expect(islands[VALLEE]?.turn).toBe(0);
    expect(isFreeSpot({ ...w, layout: { '6e': { islands: { [HORLOGE]: islands[HORLOGE]! } } } }, FOUILLE, islands[FOUILLE]!)).toBe(true);
    const poses = posesOfLayout(w.layout);
    expect(poses.get(HORLOGE)).toBeDefined();
    expect(poses.get(FOUILLE)).toBeDefined();
    expect(poses.has(POINTE)).toBe(false);
  });

  it('au 5e (HG-3) : une île déplacée vers l’est, là où entrent le Bourg et le Delta, reste où l’élève l’a mise ; les deux lieux nouveaux se posent à côté', () => {
    // Une sauvegarde d'avant HG-3 : la Grammaire (english-5e-grammar) posée à l'est, dans le cadre d'alors (144 cases de
    // large), sur les places de départ du Bourg des chroniques et du Delta des ressources.
    const BOURG: BiomeId = 'history-5e-middle-ages';
    const DELTA: BiomeId = 'geography-5e-resources';
    const GRAMMAIRE: BiomeId = 'english-5e-grammar';
    const ici = { x: 29, y: 19, turn: 0 as const };
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

  it('une disposition qui tient, ou pas de disposition, reste la même', () => {
    const w = partie();
    expect(settleNewPlaces(w)).toBe(w);
    const deplace = apres(moveIsland(w, VOLCAN, freeSpots(w, VOLCAN).find((s) => s.x !== startingSpot(VOLCAN).x)!));
    expect(settleNewPlaces(deplace)).toBe(deplace);
  });
});
