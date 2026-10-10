// Le mode « Aménager » (GD-9, L5) : ce que l'élève a choisi (un lieu, une borne, une arrivée, une liaison à reposer ;
// le Gardien suit son île, GD-11), où se tient son fantôme, et ce que font les gestes de la barre du mode : toucher une place du lieu d'une borne ou
// d'une arrivée (elle s'y cale, sur la place libre la plus proche), les flèches (un cran, même sur une place prise, que le fantôme montre d'une croix
// grise ; « Plus de place par là » au bord de la carte ; 6 octobre 2026, choix 3 du mainteneur), « Tourner », « Poser ». La phrase écrite et lue dit toujours où. Les actions elles-mêmes sont dans ./arrange.ts ; ici, le choix
// en cours et son fantôme ; un lieu réuni emmène son voisin et leur réunion. Code pur, sans Three.js.
import { thePlace } from './placeArticle';
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
  hasFreeSpot,
  isFixedPlace,
  isFreeSpot,
  spotNear,
  landingSpots,
  type LinkEnd,
  moveIsland,
  moveLanding,
  moveStation,
  nearestFreeSpot,
  nextIn,
  placeIn,
  placeTurns,
  relinkBetween,
  relinkChoices,
  spotOf,
  stationOf,
  stationSpots,
  stepSpot,
} from './arrange';
import { archipelagoOfIsland, toWorld } from './map';
import { poseOfSpot } from './footprint';
import { turnedSide, type Quarts, type Side } from './placement';
import { type LinkPhrases, linkPhrases } from './linkWord';
import { ofPlace, placeSentence, type PlaceName } from './placeSentence';
import { anchorInWorld, possibleLandings } from './routing';
import type { LayoutLanding, LayoutSpot, LayoutTurn } from './savedLayout';

/** Ce que l'élève a choisi dans le mode, et où se tient son fantôme. */
export type ArrangeChoice =
  | { genre: 'lieu'; id: BiomeId; spot: LayoutSpot }
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

/** Le milieu du cœur d'un lieu posé à une place, en cases du monde. */
function middleOfSpot(id: BiomeId, spot: LayoutSpot): { x: number; y: number } {
  const p = poseOfSpot(archipelagoOfIsland(id), spot);
  return { x: p.x + 8, y: p.y + 8 };
}

/** Le lieu d'un choix. */
export function placeOfChoice(c: ArrangeChoice): BiomeId {
  if (c.genre === 'lieu') return c.id;
  if (c.genre === 'borne') return c.key.split(':')[0] as BiomeId;
  const b = getBridge(c.link)!;
  return c.genre === 'arrivee' && c.end === 'to' ? b.to : b.from;
}

// ---------- Les gestes de la barre ----------

/**
 * Un point touché (en cases du monde) : le fantôme se cale sur la place libre la plus proche ; le même choix s'il n'y en a
 * aucune. Seules une borne ou une arrivée se calent ainsi au toucher (la mer touchée relâche le choix, mainteneur,
 * 7 octobre 2026) ; un lieu se glisse. Une liaison à reposer ne se cale pas : on choisit ses voisins dans la liste.
 */
export function snapChoice(world: World, c: ArrangeChoice, point: { x: number; y: number }): ArrangeChoice {
  switch (c.genre) {
    case 'lieu': {
      const s = nearestFreeSpot(world, c.id, point, c.spot.turn);
      return s ? { ...c, spot: s } : c;
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

// ---------- Glisser (7 octobre 2026, choix 1b, 2a et 3a du mainteneur) ----------

/** Le milieu d'un choix qui se glisse au doigt (un lieu), en cases du monde ; `null` pour les autres. */
export function choiceMiddle(c: ArrangeChoice): { x: number; y: number } | null {
  return c.genre === 'lieu' ? middleOfSpot(c.id, c.spot) : null;
}

/**
 * Le doigt glisse le choix, son milieu voulu en `point` (en cases du monde) : le fantôme se cale sur la place de la grille
 * la plus proche, libre ou prise (sur une place prise, l'empreinte le montre en gris pierre, barrée) ; le même choix au
 * bord de la carte, ou pour un choix qui ne se glisse pas.
 */
export function dragChoice(world: World, c: ArrangeChoice, point: { x: number; y: number }): ArrangeChoice {
  if (c.genre !== 'lieu') return c;
  const s = spotNear(world, c.id, point, c.spot.turn);
  return s ? { ...c, spot: s } : c;
}

/**
 * Une flèche (nommée en mots, au clavier aussi) : un cran dans sa direction (6 octobre 2026, choix 3 du mainteneur),
 * même sur une place prise (`choiceFits` le dit ; le fantôme y montre une croix grise, « Poser » s'éteint), jamais la
 * place libre suivante plus loin sur la carte ; `null` au bord seulement : « Plus de place par là ».
 */
export function stepChoice(world: World, c: ArrangeChoice, dir: Direction): ArrangeChoice | null {
  switch (c.genre) {
    case 'lieu': {
      const s = stepSpot(world, c.id, c.spot, dir);
      return s && { ...c, spot: s };
    }
    case 'borne': {
      const at = (q: { x: number; y: number }) => stationInWorld(world, c.key, q);
      const p = nextIn(stationSpots(world, c.key), at, at(c.place), dir);
      return p && { ...c, place: p };
    }
    case 'arrivee': {
      const b = getBridge(c.link)!;
      const id = c.end === 'from' ? b.from : b.to;
      const at = (q: LayoutLanding) => landingInWorld(world, id, q);
      const l = nextIn(landingSpots(world, c.link, c.end), at, at(c.landing), dir);
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

/**
 * Le choix est-il sur une place où il se pose (une place libre) ? Sinon, une place prise : le fantôme montre une croix
 * grise, « Poser » s'éteint, et « Valider » le laisse à sa place d'avant.
 */
export function choiceFits(world: World, c: ArrangeChoice): boolean {
  switch (c.genre) {
    case 'lieu':
      return isFreeSpot(world, c.id, c.spot);
    case 'borne':
      return freeStationSpots(world, c.key).some((p) => p.x === c.place.x && p.y === c.place.y);
    case 'arrivee':
      return freeLandings(world, c.link, c.end).some((l) => l.side === c.landing.side && l.step === c.landing.step);
    case 'liaison':
      return c.to !== null;
  }
}

/**
 * Le choix a-t-il « Tourner » (un lieu ; le Gardien tourne avec son île, GD-11) ? Pas un lieu qui ne tourne pas
 * (`placeTurns` : le Marais des temps, le Comptoir et le Manoir du passé, directeur artistique, 9 octobre 2026).
 */
export const canTurn = (c: ArrangeChoice | null): boolean => c?.genre === 'lieu' && placeTurns(c.id);

/**
 * « Tourner » un lieu choisi : son fantôme pivote d'un quart de tour, à sa place, même si elle est prise (choix 3 du
 * mainteneur : le fantôme montre alors une croix grise, jamais un saut ailleurs sur la carte). `null` si le lieu, tourné,
 * n'a aucune place libre dans son archipel (le Glacier des relatifs au 5e, la Gare du futur au 4e) : le fantôme ne
 * tourne pas, la ligne le refuse comme les autres refus (consultant UX UI, HG-3).
 */
export function turnChoice(world: World, c: Extract<ArrangeChoice, { genre: 'lieu' }>): ArrangeChoice | null {
  const turn = ((c.spot.turn + 1) % 4) as LayoutTurn;
  if (!placeTurns(c.id) || !hasFreeSpot(world, c.id, turn)) return null;
  return { ...c, spot: { ...c.spot, turn } };
}

/** « Poser » : l'action du choix. */
export function poseChoice(world: World, c: ArrangeChoice): ArrangeResult {
  switch (c.genre) {
    case 'lieu':
      return moveIsland(world, c.id, c.spot);
    case 'borne':
      return moveStation(world, c.key, c.place);
    case 'arrivee':
      return moveLanding(world, c.link, c.end, c.landing);
    case 'liaison':
      return c.to ? relinkBetween(world, c.link, c.to) : { ok: false, reason: 'liaison' };
  }
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
export function choiceSentence(world: World, c: ArrangeChoice, nom: PlaceName = NOM_DU_JEU, mot: LinkPhrases = linkPhrases()): string {
  switch (c.genre) {
    case 'lieu': {
      const ou = placeSentence(world, c.id, c.spot, nom);
      return `${nom(c.id)} : ${ou}.`;
    }
    case 'borne': {
      const id = c.key.split(':')[0] as BiomeId;
      const { rang, n, debout } = rangDeLaBorne(world, c);
      return `La borne, ${rang > 0 ? `à la place ${rang} sur ${n}` : 'à sa place'} de la rangée des bornes ${ofPlace(nom(id))}, en partant ${debout ? 'du haut' : 'de la gauche'}.`;
    }
    case 'arrivee': {
      const id = placeOfChoice(c);
      const cote = turnedSide(SIDE_OF[c.landing.side], placeIn(world, id).quarts as Quarts);
      return `L’arrivée, sur la côte ${POINT_CARDINAL[cote]} ${ofPlace(nom(id))}.`;
    }
    case 'liaison': {
      const b = c.to ? getBridge(c.to) : undefined;
      return b ? `${mot.Le} à reposer, entre ${thePlace(nom(b.from))} et ${thePlace(nom(b.to))}.` : `${mot.Ce} ne se repose nulle part pour l’instant : rapproche deux lieux.`;
    }
  }
}

/**
 * Le rang d'une borne dans la rangée de son lieu, compté comme on la voit sur la Carte : de la gauche de l'écran (les x
 * du monde qui descendent vers la droite), ou du haut quand le lieu tourné la met debout ; 0 hors de la rangée.
 */
function rangDeLaBorne(world: World, c: Extract<ArrangeChoice, { genre: 'borne' }>): { rang: number; n: number; debout: boolean } {
  // Toutes les places de la rangée, libres ou prises (une flèche avance d'un cran, même sur une place prise).
  const places = stationSpots(world, c.key).map((p) => ({ p, m: stationInWorld(world, c.key, p) }));
  const debout = places.length > 1 && places.every((q) => q.m.x === places[0].m.x);
  places.sort((u, v) => (debout ? v.m.y - u.m.y : v.m.x - u.m.x));
  return { rang: places.findIndex((q) => q.p.x === c.place.x && q.p.y === c.place.y) + 1, n: places.length, debout };
}

/**
 * La phrase après une pose : où est maintenant ce qu'on a posé, dans le monde d'après. Sans « C’est posé » (GD-9, piste
 * A) : la ligne qui se met à jour et le son de la pose le disent.
 */
export function poseSentence(after: World, c: ArrangeChoice, nom: PlaceName = NOM_DU_JEU, mot: LinkPhrases = linkPhrases()): string {
  switch (c.genre) {
    case 'lieu':
      return `${nom(c.id)} : ${placeSentence(after, c.id, spotOf(after, c.id), nom)}.`;
    case 'borne':
      return choiceSentence(after, c, nom, mot);
    case 'arrivee':
      return `${choiceSentence(after, c, nom, mot)} ${mot.Le} repart de là.`;
    case 'liaison': {
      const b = c.to ? getBridge(c.to) : undefined;
      return b ? `${mot.Le} est ${mot.accord('reposé')} entre ${thePlace(nom(b.from))} et ${thePlace(nom(b.to))}.` : '';
    }
  }
}
