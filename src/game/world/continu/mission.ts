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

/** La borne de la mission jouée dans un lieu, s'il y en a une. */
const borneOf = (place: OpenPlace, bornes: readonly MissionMark[]): MissionMark | undefined =>
  bornes.find((b) => b.ile === place.island && b.mission === place.mission);

/**
 * La mission qu'ouvre un lieu : la sienne (`OpenPlace.mission`), dès qu'elle existe, même encore fermée dans la grille
 * (lot 4, décision du mainteneur du 14 octobre 2026 : les quatre lieux sont ouverts) ; `null` si elle manque (une autre
 * LV2, une donnée absente) : le lieu n'ouvre alors rien.
 */
export function missionOfPlace(place: OpenPlace, bornes: readonly MissionMark[]): string | null {
  return borneOf(place, bornes)?.mission ?? null;
}

/** Une mission encore à jouer : jamais jouée, ou encore fermée dans la grille (elle s'ouvre ici). */
const toPlay = (b: MissionMark) => b.etat === 'new' || b.etat === 'locked';

/**
 * La prochaine mission du prototype : celle de la prochaine destination du jeu si c'est la mission d'un des quatre
 * lieux, sinon la première encore à jouer, lieu par lieu dans l'ordre du plan (le Phare, puis les Quais : « au retour du
 * Phare, le prochain pas est évident »), sinon la première à reprendre (moins de trois étoiles). `null` quand tout est
 * fait.
 */
export function nextMission(bornes: readonly MissionMark[], destination?: { island: string; mission?: string }): NextMission | null {
  const fromGame = destination && PLACES.find((p) => p.island === destination.island && p.mission === destination.mission);
  if (fromGame && borneOf(fromGame, bornes)) return { place: fromGame, mission: fromGame.mission };
  for (const place of PLACES) {
    const b = borneOf(place, bornes);
    if (b && toPlay(b)) return { place, mission: place.mission };
  }
  for (const place of PLACES) {
    const b = borneOf(place, bornes);
    if (b && typeof b.etat === 'number' && b.etat < 3) return { place, mission: place.mission };
  }
  return null;
}

/**
 * Les lieux sous la brume (piste 1, lot 1) : ceux dont la mission n'a pas encore été jouée (elle reste ouverte : on peut y
 * aller, la brume se lève à l'approche de Kéo, ../../three/archipeo/scene.ts), sauf le lieu de la prochaine mission. Un
 * lieu sans mission (une autre LV2) n'a pas de brume : rien n'y attend.
 */
export function veiledPlaces(bornes: readonly MissionMark[], next: NextMission | null): PlaceId[] {
  return PLACES.filter((p) => {
    const b = borneOf(p, bornes);
    return b !== undefined && toPlay(b) && p.id !== next?.place.id;
  }).map((p) => p.id);
}

/** La brume d'un lieu se lève quand Kéo arrive à tant d'unités de son centre. */
export const UNVEIL_DISTANCE = 26;

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
 * Garde la marque (`box`) hors des boutons posés sur la scène (`obstacles` : Réglages, « Y aller ») et dans l'écran
 * (`width` × `height`, à `edge` pixels du bord) : pour chaque bouton qu'elle couvre, le plus petit pas qui l'en sort
 * sans sortir de l'écran (à gauche, à droite, au-dessus ou au-dessous, à `gap` pixels du bouton).
 */
export function keepClear(box: ScreenRect, obstacles: readonly ScreenRect[], width: number, height: number, edge: number, gap: number): ScreenRect {
  const fit = (r: ScreenRect): ScreenRect => ({
    ...r,
    left: Math.min(Math.max(r.left, edge), Math.max(edge, width - edge - r.width)),
    top: Math.min(Math.max(r.top, edge), Math.max(edge, height - edge - r.height)),
  });
  let r = fit(box);
  for (const o of obstacles) {
    if (!overlaps(r, o)) continue;
    const moves = [
      { ...r, left: o.left - gap - r.width },
      { ...r, left: o.left + o.width + gap },
      { ...r, top: o.top - gap - r.height },
      { ...r, top: o.top + o.height + gap },
    ]
      .map(fit)
      .filter((m) => !overlaps(m, o))
      .sort((a, b) => Math.hypot(a.left - r.left, a.top - r.top) - Math.hypot(b.left - r.left, b.top - r.top));
    if (moves[0]) r = moves[0];
  }
  return r;
}

/**
 * Ce qui se passe quand Kéo arrive devant le lieu d'une mission : l'ouvrir. Aujourd'hui, l'écran de mission actuel
 * (../../three/archipeo/missionScreen.ts) ; demain, la mission jouée dans le monde (lot 4, selon la piste choisie par le
 * mainteneur), derrière la même interface.
 */
export interface MissionInteraction {
  open(placeId: PlaceId, missionId: string): void;
}
