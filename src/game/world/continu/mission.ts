// La prochaine mission dans le monde continu, et sa marque : une seule à la fois (avis du référent dys et du consultant
// UX UI, 13 octobre 2026), posée au-dessus de son lieu, ou une flèche au bord de l'écran quand le lieu est hors champ.
// Code pur : les bornes viennent du modèle du monde (world/model.ts), commun aux deux univers.
import { distance, type Vec2 } from './geometry';
import { KEO_STEP, PLACES, type OpenPlace, type PlaceId } from './plan6e';

/** Une borne de mission, comme la rend le modèle du monde : à faire, ses étoiles, ou fermée. */
export interface MissionMark {
  ile: string;
  mission: string;
  etat: 'new' | 'locked' | number;
}

/** La prochaine mission d'un lieu du prototype, et son lieu. */
export interface NextMission {
  place: OpenPlace;
  mission: string;
}

/**
 * Les bornes des missions d'un lieu : toutes celles de son île (GD-20, point 8, choix du mainteneur du 15 octobre
 * 2026), dans l'ordre de l'île ; vide pour un lieu dont l'île n'a rien à jouer (une autre LV2, une donnée absente).
 */
export const missionsOfPlace = (place: OpenPlace, bornes: readonly MissionMark[]): MissionMark[] => bornes.filter((b) => b.ile === place.island);

/**
 * Les bornes telles que le monde ouvert les montre : une borne fermée dans la grille (`'locked'` : son île n'est pas
 * encore reliée par les ponts de la grille) qui a déjà des étoiles les prend (`starsOf` : la vue y passe `questProgress`, tous niveaux, avec l'île typée de ses bornes ; le monde continu ne lit pas le catalogue) ; sinon
 * elle reste fermée (elle s'ouvre ici, `toPlay`). Le modèle du monde, commun à la grille, n'est pas touché : dans le
 * monde ouvert, une mission réussie dans son lieu se voit réussie aussitôt, sans attendre la relecture de la partie
 * (correctif du quatrième lot du point 8 de GD-20 : « Nouveau » au retour de l'Enclos, la brume restée).
 */
export function bornesDuMondeOuvert<B extends MissionMark>(bornes: readonly B[], starsOf: (ile: B['ile'], mission: string) => number | null): B[] {
  return bornes.map((b) => {
    if (b.etat !== 'locked') return b;
    const stars = starsOf(b.ile, b.mission);
    return stars === null ? b : { ...b, etat: stars };
  });
}

/** Une mission se joue-t-elle déjà en scénette dans son lieu (sinon, sur l'écran habituel, le temps de la transition) ? */
export const playsInPlace = (place: OpenPlace, mission: string): boolean => place.scenes.includes(mission);

/** Une mission encore à jouer : jamais jouée, ou encore fermée dans la grille (elle s'ouvre ici). */
const toPlay = (b: MissionMark) => b.etat === 'new' || b.etat === 'locked';

/** La première mission encore à jouer d'un lieu, dans l'ordre de son île, ou rien. */
export const firstToPlayAt = (place: OpenPlace, bornes: readonly MissionMark[]): MissionMark | undefined => missionsOfPlace(place, bornes).find(toPlay);

/**
 * La prochaine mission du prototype : la première encore à jouer du lieu où se tient Kéo (`here`, s'il est ouvert : le
 * rang 2 de la suggestion, index.md, « Une seule suggestion » ; avis du directeur artistique, deuxième passe du lot L1),
 * sinon celle de la prochaine destination du jeu si elle se joue dans un lieu ouvert, sinon
 * la première encore à jouer, lieu ouvert par lieu ouvert dans l'ordre du plan (le Phare, puis les Quais : « au retour du
 * Phare, le prochain pas est évident ») et mission par mission dans l'ordre de l'île, sinon la première à reprendre (moins
 * de trois étoiles). Elle parcourt toutes les missions de chaque lieu, qu'elles se jouent en scénette ou non ; jamais celles
 * d'un lieu fermé (`open`, GD-20, point 3 : aucune mission d'un lieu fermé ne se joue). `null` quand tout est fait.
 */
export function nextMission(
  bornes: readonly MissionMark[],
  destination?: { island: string; mission?: string },
  open: (place: PlaceId) => boolean = () => true,
  here?: PlaceId | null,
): NextMission | null {
  const at = here ? PLACES.find((p) => p.id === here) : undefined;
  const mine = at && open(at.id) ? firstToPlayAt(at, bornes) : undefined;
  if (at && mine) return { place: at, mission: mine.mission };
  const fromGame = destination && PLACES.find((p) => p.island === destination.island);
  if (fromGame && open(fromGame.id) && destination.mission && bornes.some((b) => b.ile === fromGame.island && b.mission === destination.mission))
    return { place: fromGame, mission: destination.mission };
  for (const test of [toPlay, (b: MissionMark) => typeof b.etat === 'number' && b.etat < 3])
    for (const place of PLACES) {
      if (!open(place.id)) continue;
      const b = missionsOfPlace(place, bornes).find(test);
      if (b) return { place, mission: b.mission };
    }
  return null;
}

/**
 * Les lieux déjà joués : une mission au moins y a été jouée (ses étoiles, même nulles). Avant les liaisons (GD-20, point
 * 3), tous les lieux du monde continu étaient ouverts : un lieu où l'élève a déjà joué le reste ouvert, et sa terre avec
 * lui, sans liaison payée ni rien de neuf dans la sauvegarde (./lands.ts, `openWorldLands` ; ../arrange.ts, `ensureLands`).
 */
export const playedPlaces = (bornes: readonly MissionMark[]): PlaceId[] => PLACES.filter((p) => missionsOfPlace(p, bornes).some((b) => typeof b.etat === 'number')).map((p) => p.id);

/**
 * La distance au lieu de la prochaine mission, en signe (avis du consultant UX UI : jamais en texte) : un, deux ou
 * trois points pleins sous la flèche du bord. Un point : moins de 60 pas ; deux : moins de 160 ; trois au-delà.
 */
export const DISTANCE_SIGN_STEPS = [60, 160] as const;

/** Le signe de la distance de Kéo (`from`) au lieu `to` : 1, 2 ou 3 points, à vol d'oiseau. */
export function distanceSign(from: Vec2, to: Vec2): 1 | 2 | 3 {
  const steps = distance(from, to) / KEO_STEP;
  return steps < DISTANCE_SIGN_STEPS[0] ? 1 : steps < DISTANCE_SIGN_STEPS[1] ? 2 : 3;
}

/** Où se pose la marque à l'écran : sur son lieu, ou, hors champ, au bord, avec l'angle de sa flèche (0 vers le haut). */
export interface MarkOnScreen {
  x: number;
  y: number;
  inside: boolean;
  /** En radians, dans le sens des aiguilles d'une montre depuis le haut de l'écran. */
  angle: number;
  /** La distance au lieu, en signe (`distanceSign`) : la page la montre sous la flèche du bord. */
  far: 1 | 2 | 3;
  /** Dans l'écran, la marque se pose à droite du point (à côté de la lanterne du Phare), pas au-dessus. */
  beside: boolean;
  /**
   * Au Port (GD-20, lot 2), dans l'écran : la ligne de toit sous laquelle la marque ne descend pas, en pixels depuis le
   * haut (elle ne passe ni sur un cartouche ni sur une porte), et la place de Kéo, qu'elle ne couvre pas.
   */
  ceiling?: number;
  keo?: ScreenRect;
}

/**
 * La place de la marque : `p` est le point projeté (en pixels, `behind` s'il est derrière la caméra), l'écran fait
 * `width` × `height`. Dans l'écran, sur son lieu ; hors champ, sur le bord, à `margin` pixels, vers le lieu. (La page
 * garde ensuite le panneau entier à l'écran.)
 */
export function markOnScreen(
  p: { x: number; y: number; behind: boolean },
  width: number,
  height: number,
  margin: number,
  far: 1 | 2 | 3 = 1,
  beside = false,
): MarkOnScreen {
  const inside = !p.behind && p.x >= 0 && p.x <= width && p.y >= 0 && p.y <= height;
  if (inside) return { x: p.x, y: p.y, inside, angle: 0, far, beside };
  const cx = width / 2;
  const cy = height / 2;
  // Derrière la caméra, la projection est retournée : la direction l'est aussi.
  let dx = p.x - cx;
  let dy = p.y - cy;
  if (p.behind) {
    dx = -dx;
    dy = -dy;
  }
  if (dx === 0 && dy === 0) dy = 1;
  const sx = (cx - margin) / Math.abs(dx || 1e-9);
  const sy = (cy - margin) / Math.abs(dy || 1e-9);
  const s = Math.min(sx, sy);
  return { x: cx + dx * s, y: cy + dy * s, inside: false, angle: Math.atan2(dx, -dy), far, beside: false };
}

/** Un rectangle à l'écran, en pixels. */
export interface ScreenRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

const overlaps = (a: ScreenRect, b: ScreenRect) => a.left < b.left + b.width && b.left < a.left + a.width && a.top < b.top + b.height && b.top < a.top + a.height;

/**
 * Un bouton ou une zone que la marque évite. `below` : la marque n'en sort que par le bas (la colonne des accès directs,
 * en haut à gauche : la flèche du bord gauche reste au bord, sous la colonne, consultant UX UI, GD-20, lot 1), ou, si
 * elle n'y tient pas sans couvrir un autre bouton, à sa droite.
 */
export interface Obstacle extends ScreenRect {
  below?: boolean;
}

/**
 * Garde la marque (`box`) hors des boutons posés sur la scène (`obstacles` : Réglages, « Y aller », la colonne des accès
 * directs) et dans l'écran (`width` × `height`, à `edge` pixels du bord) : pour chaque bouton qu'elle couvre, le plus
 * petit pas qui l'en sort sans sortir de l'écran (à gauche, à droite, au-dessus ou au-dessous, à `gap` pixels du
 * bouton ; seulement au-dessous pour une zone `below`).
 */
export function keepClear(box: ScreenRect, obstacles: readonly Obstacle[], width: number, height: number, edge: number, gap: number): ScreenRect {
  const fit = (r: ScreenRect): ScreenRect => ({
    ...r,
    left: Math.min(Math.max(r.left, edge), Math.max(edge, width - edge - r.width)),
    top: Math.min(Math.max(r.top, edge), Math.max(edge, height - edge - r.height)),
  });
  let r = fit(box);
  for (const o of obstacles) {
    if (!overlaps(r, o)) continue;
    const under = { ...r, top: o.top + o.height + gap };
    const moves = (o.below
      ? [under]
      : [{ ...r, left: o.left - gap - r.width }, { ...r, left: o.left + o.width + gap }, { ...r, top: o.top - gap - r.height }, under]
    )
      .map(fit)
      .filter((m) => !overlaps(m, o))
      .sort((a, b) => Math.hypot(a.left - r.left, a.top - r.top) - Math.hypot(b.left - r.left, b.top - r.top));
    if (moves[0]) r = moves[0];
  }
  // La colonne d'abord : poussée vers le haut par un autre bouton, la marque repasse sous elle ; si elle n'y tient pas
  // (un écran bas au plus grand texte, « Carte » juste dessous), elle se pose à droite de la colonne, jamais sur elle.
  for (const o of obstacles) {
    if (!o.below || !overlaps(r, o)) continue;
    const others = obstacles.filter((x) => x !== o);
    const clear = (m: ScreenRect) => !overlaps(m, o) && !others.some((x) => overlaps(m, x));
    const under = fit({ ...r, top: o.top + o.height + gap });
    const beside = fit({ ...r, left: o.left + o.width + gap });
    r = clear(under) ? under : clear(beside) ? beside : under;
  }
  return r;
}
