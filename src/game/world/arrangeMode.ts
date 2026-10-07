// Le mode « Aménager » (GD-9, L5) : ce que l'élève a choisi (un lieu, un Gardien, une borne, une arrivée, une liaison à
// reposer), où se tient son fantôme, et ce que font les gestes de la barre du mode : toucher la mer (le fantôme se cale
// sur la place libre la plus proche), les flèches (un cran, même sur une place prise, que le fantôme montre d'une croix
// grise ; « Plus de place par là » au bord de la carte ; 6 octobre 2026, choix 3 du mainteneur), « Tourner », « Poser ». La phrase écrite et lue dit toujours où. Les actions elles-mêmes sont dans ./arrange.ts ; ici, le choix
// en cours et son fantôme ; un lieu réuni emmène son voisin et leur réunion. Code pur, sans Three.js.
import { thePlace } from './placeArticle';
import { type BiomeId, getBiome } from '../biomes';
import type { World } from '../engine/state';
import { getBridge, isBiomeUnlocked } from './archipelago';
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
  hasFreeSpot,
  isFixedPlace,
  isFreeGuardianSpot,
  isFreeSpot,
  isletMiddle,
  guardianPlaceNear,
  type GuardianPlaceAt,
  spotNear,
  landingSpots,
  type LinkEnd,
  moveGuardian,
  moveIsland,
  moveLanding,
  moveStation,
  nearestFreeSpot,
  nearestGuardianSpot,
  nextIn,
  placeIn,
  relinkBetween,
  relinkChoices,
  spotOf,
  stationOf,
  stationSpots,
  stepGuardianSpot,
  stepSpot,
  turnGuardian,
} from './arrange';
import { archipelagoOfIsland, toWorld } from './map';
import { poseOfSpot } from './footprint';
import { turnedSide, type Quarts, type Side } from './placement';
import { type LinkPhrases, linkPhrases } from './linkWord';
import { guardianSentence, ofPlace, placeSentence, type PlaceName } from './placeSentence';
import { anchorInWorld, possibleLandings } from './routing';
import type { GuardianPlace, LayoutLanding, LayoutSpot, LayoutTurn } from './savedLayout';

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

/**
 * Toucher un Gardien : son îlot part de sa place (contre son lieu, ou détaché : choix 4a du mainteneur) ; `null` pour le
 * Gardien d'un lieu encore fermé, caché et qui ne se déplace pas avant l'ouverture (choix 6a).
 */
export function chooseGuardian(world: World, id: BiomeId): ArrangeChoice | null {
  if (!isBiomeUnlocked(id, world.links)) return null;
  const g = guardianOf(world, id);
  return { genre: 'gardien', id, place: { side: g.side, step: g.step, ...(g.spot ? { spot: g.spot } : {}) } };
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

/** Toucher la poignée d'un bout de liaison (6 octobre 2026, choix 1a du mainteneur) : l'arrivée de ce bout. */
export function chooseLinkEnd(world: World, link: string, end: LinkEnd): ArrangeChoice | null {
  const l = currentLandings(world, link);
  return l ? { genre: 'arrivee', link, end, landing: l[end] } : null;
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

/**
 * Le bout du ponton d'une arrivée dans le monde : la case d'eau devant sa case de côte, vers le large (là où le
 * ponton de deux cubes finit, et où se pose la poignée de ce bout de liaison).
 */
export function landingTip(world: World, id: BiomeId, l: LayoutLanding): { x: number; y: number } {
  const p = landingInWorld(world, id, l);
  const core = placeIn(world, id).core;
  const ex = p.x - (core.x + 8);
  const ey = p.y - (core.y + 8);
  return Math.abs(ex) > Math.abs(ey) ? { x: p.x + Math.sign(ex), y: p.y } : { x: p.x, y: p.y + Math.sign(ey) };
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
  if (c.genre === 'lieu' || c.genre === 'gardien') return c.id;
  if (c.genre === 'borne') return c.key.split(':')[0] as BiomeId;
  const b = getBridge(c.link)!;
  return c.genre === 'arrivee' && c.end === 'to' ? b.to : b.from;
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

// ---------- Glisser (7 octobre 2026, choix 1b, 2a et 3a du mainteneur) ----------

/** Le milieu d'un choix qui se glisse au doigt (un lieu, l'îlot d'un Gardien), en cases du monde ; `null` pour les autres. */
export function choiceMiddle(world: World, c: ArrangeChoice): { x: number; y: number } | null {
  if (c.genre === 'lieu') return middleOfSpot(c.id, c.spot);
  if (c.genre === 'gardien') return isletMiddle(world, c.id, c.place);
  return null;
}

/**
 * Le doigt glisse le choix, son milieu voulu en `point` (en cases du monde) : le fantôme se cale sur la place de la grille
 * la plus proche, libre ou prise (sur une place prise, l'empreinte le montre en gris pierre, barrée) ; le même choix au
 * bord de la carte, ou pour un choix qui ne se glisse pas. `placesDuGardien` : les places de l'îlot du Gardien glissé,
 * calculées une fois au départ du glissé (`guardianPlacesAt`).
 */
export function dragChoice(world: World, c: ArrangeChoice, point: { x: number; y: number }, placesDuGardien?: readonly GuardianPlaceAt[]): ArrangeChoice {
  if (c.genre === 'lieu') {
    const s = spotNear(world, c.id, point, c.spot.turn);
    return s ? { ...c, spot: s } : c;
  }
  if (c.genre === 'gardien') {
    const g = guardianPlaceNear(world, c.id, point, placesDuGardien);
    return g ? { ...c, place: g } : c;
  }
  return c;
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
    case 'gardien': {
      const g = stepGuardianSpot(world, c.id, c.place, dir);
      return g && { ...c, place: g };
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
    case 'gardien':
      return isFreeGuardianSpot(world, c.id, c.place);
    case 'borne':
      return freeStationSpots(world, c.key).some((p) => p.x === c.place.x && p.y === c.place.y);
    case 'arrivee':
      return freeLandings(world, c.link, c.end).some((l) => l.side === c.landing.side && l.step === c.landing.step);
    case 'liaison':
      return c.to !== null;
  }
}

/** Le lieu choisi a-t-il « Tourner » (un lieu, un Gardien) ? */
export const canTurn = (c: ArrangeChoice | null): boolean => c?.genre === 'lieu' || c?.genre === 'gardien';

/**
 * « Tourner » un lieu choisi : son fantôme pivote d'un quart de tour, à sa place, même si elle est prise (choix 3 du
 * mainteneur : le fantôme montre alors une croix grise, jamais un saut ailleurs sur la carte). `null` si le lieu, tourné,
 * n'a aucune place libre dans son archipel (le Glacier des relatifs au 5e, la Gare du futur au 4e) : le fantôme ne
 * tourne pas, la ligne le refuse comme les autres refus (consultant UX UI, HG-3).
 */
export function turnChoice(world: World, c: Extract<ArrangeChoice, { genre: 'lieu' }>): ArrangeChoice | null {
  const turn = ((c.spot.turn + 1) % 4) as LayoutTurn;
  if (!hasFreeSpot(world, c.id, turn)) return null;
  return { ...c, spot: { ...c.spot, turn } };
}

/** « Poser » : l'action du choix. */
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
  if (!result.ok) return { result, sentence: '' };
  // Détaché (choix 4a) : ce qu'il regarde se lit depuis son îlot vers son lieu.
  const g = guardianOf(result.world, id);
  const ilot = isletMiddle(result.world, id, g);
  const lieu = placeIn(result.world, id).core;
  const sentence = GUARDIAN_FACING_TEXT[guardianFacing(g, { dx: lieu.x + 8 - ilot.x, dy: lieu.y + 8 - ilot.y })];
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
export function choiceSentence(world: World, c: ArrangeChoice, nom: PlaceName = NOM_DU_JEU, mot: LinkPhrases = linkPhrases()): string {
  switch (c.genre) {
    case 'lieu': {
      const ou = placeSentence(world, c.id, c.spot, nom);
      return `${nom(c.id)} : ${ou}.`;
    }
    case 'gardien':
      return `Le Gardien ${ofPlace(nom(c.id))} : ${guardianSentence(world, c.id, c.place)}.`;
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
    case 'gardien':
      return `Le Gardien ${ofPlace(nom(c.id))} : ${guardianSentence(after, c.id)}.`;
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
