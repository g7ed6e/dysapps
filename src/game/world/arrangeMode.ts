// Le mode « Aménager » (GD-9, L5) : ce que l'élève a choisi (un lieu, un Gardien, une borne, une arrivée, une liaison à
// reposer), où se tient son fantôme, et ce que font les gestes de la barre du mode : toucher la mer (le fantôme se cale
// sur la place libre la plus proche), les flèches (la place libre suivante, ou « Plus de place par là »), « Tourner »,
// « Poser ici ». La phrase écrite et lue dit toujours où. Les actions elles-mêmes sont dans ./arrange.ts ; ici, le choix
// en cours et son fantôme ; un lieu réuni emmène son voisin et leur réunion. Code pur, sans Three.js.
import { type BiomeId, getBiome } from '../biomes';
import type { World } from '../engine/state';
import { getBridge } from './archipelago';
import { SIDE_OF } from './appliedLayout';
import {
  type ArrangeResult,
  closest,
  currentLandings,
  type Direction,
  freeLandings,
  freeStationSpots,
  GUARDIAN_FACING_TEXT,
  guardianFacing,
  guardianOf,
  isFixedPlace,
  isFreeSpot,
  type LinkEnd,
  moveGuardian,
  moveIsland,
  moveLanding,
  moveStation,
  nearestFreeSpot,
  nearestGuardianSpot,
  nextFreeSpot,
  nextGuardianSpot,
  nextIn,
  placeIn,
  relinkBetween,
  relinkChoices,
  spotOf,
  stationOf,
  turnGuardian,
} from './arrange';
import { archipelagoOfIsland, toWorld } from './map';
import { poseOfSpot } from './footprint';
import { turnedSide, type Quarts, type Side } from './placement';
import { guardianSentence, ofPlace, placeSentence, type PlaceName } from './placeSentence';
import { anchorInWorld, possibleLandings } from './routing';
import type { LayoutGuardian, LayoutLanding, LayoutSpot, LayoutTurn } from './savedLayout';

/** La place d'un Gardien le long de son lieu (son côté et son pas). */
type GuardianPlace = Pick<LayoutGuardian, 'side' | 'step'>;

/** Ce que l'élève a choisi dans le mode, et où se tient son fantôme. */
export type ArrangeChoice =
  | { genre: 'lieu'; id: BiomeId; spot: LayoutSpot }
  | { genre: 'gardien'; id: BiomeId; place: GuardianPlace }
  | { genre: 'borne'; key: string; place: { x: number; y: number } }
  | { genre: 'arrivee'; link: string; end: LinkEnd; landing: LayoutLanding }
  /** Une liaison à reposer, et la liaison entre deux voisins où la reposer (`null` : aucune ne se pose). */
  | { genre: 'liaison'; link: string; to: string | null };

const NOM_DU_JEU: PlaceName = (id) => getBiome(id)?.name ?? id;

// ---------- Choisir ----------

/** Toucher un lieu : son fantôme part de sa place ; `null` pour le lieu de départ, qui ne bouge pas (le repère). */
export function chooseIsland(world: World, id: BiomeId): ArrangeChoice | null {
  if (isFixedPlace(id)) return null;
  return { genre: 'lieu', id, spot: spotOf(world, id) };
}

/** Toucher un Gardien : son îlot part de sa place. */
export function chooseGuardian(world: World, id: BiomeId): ArrangeChoice {
  const g = guardianOf(world, id);
  return { genre: 'gardien', id, place: { side: g.side, step: g.step } };
}

/** Toucher une borne (clé « lieu:mission ») : elle part de sa place ; `null` si elle n'existe pas. */
export function chooseStation(world: World, key: string): ArrangeChoice | null {
  const p = stationOf(world, key);
  return p ? { genre: 'borne', key, place: p } : null;
}

/**
 * Toucher une liaison posée près d'un de ses bouts : l'arrivée de ce bout, la plus proche du point touché (en cases du
 * monde) ; `null` si elle ne se trace pas.
 */
export function chooseLanding(world: World, link: string, point: { x: number; y: number }): ArrangeChoice | null {
  const l = currentLandings(world, link);
  const b = getBridge(link);
  if (!l || !b) return null;
  const bout = closest(['from', 'to'] as const, (e) => landingInWorld(world, e === 'from' ? b.from : b.to, l[e]), point)!;
  return { genre: 'arrivee', link, end: bout, landing: l[bout] };
}

/** Choisir une liaison à reposer : la première liaison où elle se pose (la plus courte). */
export function chooseRelink(world: World, link: string): ArrangeChoice {
  return { genre: 'liaison', link, to: relinkChoices(world, link)[0] ?? null };
}

// ---------- Les places dans le monde ----------

/** La case d'une arrivée dans le monde (son lieu à sa place dans `world`). */
export function landingInWorld(world: World, id: BiomeId, l: LayoutLanding): { x: number; y: number } {
  const def = placeIn(world, id);
  const local = possibleLandings(def).find((p) => p.cote === SIDE_OF[l.side] && p.pas === l.step);
  if (!local) return toWorld(def, 8, 8);
  const a = anchorInWorld(def, local);
  return { x: a.x, y: a.y };
}

/** La case d'une borne dans le monde (son lieu à sa place dans `world`), depuis sa place dans le repère du lieu. */
export function stationInWorld(world: World, key: string, p: { x: number; y: number }): { x: number; y: number } {
  const id = key.split(':')[0] as BiomeId;
  return toWorld(placeIn(world, id), p.x, p.y);
}

/** Le lieu d'un choix. */
export function placeOfChoice(c: ArrangeChoice): BiomeId {
  if (c.genre === 'lieu' || c.genre === 'gardien') return c.id;
  if (c.genre === 'borne') return c.key.split(':')[0] as BiomeId;
  const b = getBridge(c.link)!;
  return c.genre === 'arrivee' && c.end === 'to' ? b.to : b.from;
}

/** Le milieu d'un lieu posé à une place, en cases du monde. */
function middleOfSpot(id: BiomeId, s: LayoutSpot): { x: number; y: number } {
  const p = poseOfSpot(archipelagoOfIsland(id), s);
  return { x: p.x + 8, y: p.y + 8 };
}

// ---------- Les gestes de la barre ----------

/**
 * Toucher la mer (un point en cases du monde) : le fantôme se cale sur la place libre la plus proche ; le même choix
 * s'il n'y en a aucune. Une liaison à reposer ne se cale pas : on choisit ses voisins dans la liste.
 */
export function snapChoice(world: World, c: ArrangeChoice, point: { x: number; y: number }): ArrangeChoice {
  switch (c.genre) {
    case 'lieu': {
      const s = nearestFreeSpot(world, c.id, point, c.spot.turn);
      return s ? { ...c, spot: s } : c;
    }
    case 'gardien': {
      const g = nearestGuardianSpot(world, c.id, point);
      return g ? { ...c, place: g } : c;
    }
    case 'borne': {
      const p = closest(freeStationSpots(world, c.key), (q) => stationInWorld(world, c.key, q), point);
      return p ? { ...c, place: p } : c;
    }
    case 'arrivee': {
      const b = getBridge(c.link)!;
      const id = c.end === 'from' ? b.from : b.to;
      const l = closest(freeLandings(world, c.link, c.end), (q) => landingInWorld(world, id, q), point);
      return l ? { ...c, landing: l } : c;
    }
    case 'liaison':
      return c;
  }
}

/** Une flèche (nommée en mots, au clavier aussi) : la place libre suivante dans sa direction ; `null` : « Plus de place par là ». */
export function stepChoice(world: World, c: ArrangeChoice, dir: Direction): ArrangeChoice | null {
  switch (c.genre) {
    case 'lieu': {
      const s = nextFreeSpot(world, c.id, c.spot, dir);
      return s && { ...c, spot: s };
    }
    case 'gardien': {
      const g = nextGuardianSpot(world, c.id, c.place, dir);
      return g && { ...c, place: g };
    }
    case 'borne': {
      const at = (q: { x: number; y: number }) => stationInWorld(world, c.key, q);
      const p = nextIn(freeStationSpots(world, c.key), at, at(c.place), dir);
      return p && { ...c, place: p };
    }
    case 'arrivee': {
      const b = getBridge(c.link)!;
      const id = c.end === 'from' ? b.from : b.to;
      const at = (q: LayoutLanding) => landingInWorld(world, id, q);
      const l = nextIn(freeLandings(world, c.link, c.end), at, at(c.landing), dir);
      return l && { ...c, landing: l };
    }
    case 'liaison': {
      // Les flèches parcourent les voisins possibles : l'ouest et le sud reculent, le nord et l'est avancent.
      const choix = relinkChoices(world, c.link);
      if (!choix.length) return null;
      const i = c.to ? choix.indexOf(c.to) : -1;
      const j = i + (dir === 'est' || dir === 'nord' ? 1 : -1);
      return j >= 0 && j < choix.length ? { ...c, to: choix[j] } : null;
    }
  }
}

/** Le lieu choisi a-t-il « Tourner » (un lieu, un Gardien) ? */
export const canTurn = (c: ArrangeChoice | null): boolean => c?.genre === 'lieu' || c?.genre === 'gardien';

/**
 * « Tourner » un lieu choisi : son fantôme pivote d'un quart de tour, à sa place s'il y tient, sinon à la place libre
 * la plus proche ; `null` s'il n'en a aucune. (Un Gardien, lui, tourne tout de suite : `turnGuardian`, une pose.)
 */
export function turnChoice(world: World, c: Extract<ArrangeChoice, { genre: 'lieu' }>): ArrangeChoice | null {
  const turn = ((c.spot.turn + 1) % 4) as LayoutTurn;
  const ici = { ...c.spot, turn };
  if (isFreeSpot(world, c.id, ici)) return { ...c, spot: ici };
  const s = nearestFreeSpot(world, c.id, middleOfSpot(c.id, c.spot), turn);
  return s && { ...c, spot: s };
}

/** « Poser ici » : l'action du choix. */
export function poseChoice(world: World, c: ArrangeChoice): ArrangeResult {
  switch (c.genre) {
    case 'lieu':
      return moveIsland(world, c.id, c.spot);
    case 'gardien':
      return moveGuardian(world, c.id, c.place);
    case 'borne':
      return moveStation(world, c.key, c.place);
    case 'arrivee':
      return moveLanding(world, c.link, c.end, c.landing);
    case 'liaison':
      return c.to ? relinkBetween(world, c.link, c.to) : { ok: false, reason: 'liaison' };
  }
}

/** Tourner un Gardien choisi : un quart de tour, tout de suite (↶ le défait), et sa phrase. */
export function turnGuardianNow(world: World, id: BiomeId): { result: ArrangeResult; sentence: string } {
  const result = turnGuardian(world, id);
  const sentence = result.ok ? GUARDIAN_FACING_TEXT[guardianFacing(guardianOf(result.world, id))] : '';
  return { result, sentence };
}

// ---------- Les phrases ----------

/**
 * Le point cardinal, tel qu'on le voit sur la Carte (le nord en haut, l'est à droite), d'un côté du repère d'un lieu une
 * fois tourné : la « droite » du repère (x qui monte) est à gauche de l'écran, donc à l'ouest (world/arrange.ts,
 * `DIRECTION_STEP`).
 */
const POINT_CARDINAL: Readonly<Record<Side, string>> = { devant: 'sud', droite: 'ouest', derriere: 'nord', gauche: 'est' };

/**
 * La phrase écrite et lue du choix : où se tient son fantôme (« au nord de la Forêt des sons, à 2 cases »). Les noms des
 * lieux viennent de l'univers (`nom`).
 */
export function choiceSentence(world: World, c: ArrangeChoice, nom: PlaceName = NOM_DU_JEU): string {
  switch (c.genre) {
    case 'lieu': {
      const ou = placeSentence(world, c.id, c.spot, nom);
      return `${nom(c.id)} : ${ou}.`;
    }
    case 'gardien':
      return `Le gardien ${ofPlace(nom(c.id))} : ${guardianSentence(world, c.id, c.place)}.`;
    case 'borne': {
      const id = c.key.split(':')[0] as BiomeId;
      // Le rang se compte comme on voit la rangée sur la Carte : de la gauche de l'écran (les x du monde qui descendent
      // vers la droite), ou du haut quand le lieu tourné la met debout.
      const places = freeStationSpots(world, c.key).map((p) => ({ p, m: stationInWorld(world, c.key, p) }));
      const debout = places.length > 1 && places.every((q) => q.m.x === places[0].m.x);
      places.sort((u, v) => (debout ? v.m.y - u.m.y : v.m.x - u.m.x));
      const rang = places.findIndex((q) => q.p.x === c.place.x && q.p.y === c.place.y) + 1;
      return `La borne, ${rang > 0 ? `à la place ${rang} sur ${places.length}` : 'à sa place'} de la rangée des bornes ${ofPlace(nom(id))}, en partant ${debout ? 'du haut' : 'de la gauche'}.`;
    }
    case 'arrivee': {
      const id = placeOfChoice(c);
      const cote = turnedSide(SIDE_OF[c.landing.side], placeIn(world, id).quarts as Quarts);
      return `L’arrivée, sur la côte ${POINT_CARDINAL[cote]} ${ofPlace(nom(id))}.`;
    }
    case 'liaison': {
      const b = c.to ? getBridge(c.to) : undefined;
      return b ? `La liaison à reposer, entre ${nom(b.from)} et ${nom(b.to)}.` : 'Cette liaison ne se repose nulle part pour l’instant : rapproche deux lieux.';
    }
  }
}

/** La phrase après une pose : où est maintenant ce qu'on a posé, dans le monde d'après. */
export function poseSentence(after: World, c: ArrangeChoice, nom: PlaceName = NOM_DU_JEU): string {
  switch (c.genre) {
    case 'lieu':
      return `C’est posé. ${nom(c.id)} : ${placeSentence(after, c.id, spotOf(after, c.id), nom)}.`;
    case 'gardien':
      return `C’est posé. Le gardien ${ofPlace(nom(c.id))} : ${guardianSentence(after, c.id)}.`;
    case 'borne':
      return `C’est posé. ${choiceSentence(after, c, nom)}`;
    case 'arrivee':
      return `C’est posé. ${choiceSentence(after, c, nom)} La liaison repart de là.`;
    case 'liaison': {
      const b = c.to ? getBridge(c.to) : undefined;
      return b ? `La liaison est reposée entre ${nom(b.from)} et ${nom(b.to)}.` : '';
    }
  }
}
