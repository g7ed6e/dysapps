// La prochaine mission dans le monde continu, et sa marque : une seule à la fois (avis du référent dys et du consultant
// UX UI, 13 octobre 2026), posée au-dessus de son lieu, ou une flèche au bord de l'écran quand le lieu est hors champ.
// Code pur : les bornes viennent du modèle du monde (world/model.ts), commun aux deux univers.
import { PLACES, type OpenPlace, type PlaceId } from './plan6e';

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

/** Le lieu est-il ouvert (au moins une de ses missions se joue) ? Un lieu fermé ne lance pas de trajet. */
export function placeIsOpen(place: OpenPlace, bornes: readonly MissionMark[]): boolean {
  return bornes.some((b) => b.ile === place.island && b.etat !== 'locked');
}

/**
 * La mission qu'ouvre un lieu : la première jamais jouée, sinon la première qui n'a pas ses trois étoiles, sinon la
 * première (on rejoue) ; `null` si le lieu est fermé.
 */
export function missionOfPlace(place: OpenPlace, bornes: readonly MissionMark[]): string | null {
  const own = bornes.filter((b) => b.ile === place.island && b.etat !== 'locked');
  return (own.find((b) => b.etat === 'new') ?? own.find((b) => typeof b.etat === 'number' && b.etat < 3) ?? own[0])?.mission ?? null;
}

/**
 * La prochaine mission du prototype : celle de la prochaine destination du jeu si elle est dans un des quatre lieux,
 * sinon la première mission jamais jouée, lieu par lieu dans l'ordre du plan (le Phare, puis les Quais : « au retour du
 * Phare, le prochain pas est évident »), sinon la première à reprendre. `null` quand tout est fait ou fermé.
 */
export function nextMission(bornes: readonly MissionMark[], destination?: { island: string; mission?: string }): NextMission | null {
  const fromGame = destination && PLACES.find((p) => p.island === destination.island);
  if (fromGame && destination?.mission && bornes.some((b) => b.ile === fromGame.island && b.mission === destination.mission && b.etat !== 'locked'))
    return { place: fromGame, mission: destination.mission };
  for (const place of PLACES) {
    const mission = bornes.find((b) => b.ile === place.island && b.etat === 'new')?.mission;
    if (mission) return { place, mission };
  }
  for (const place of PLACES) {
    const mission = bornes.find((b) => b.ile === place.island && typeof b.etat === 'number' && b.etat < 3)?.mission;
    if (mission) return { place, mission };
  }
  return null;
}

/** Où se pose la marque à l'écran : sur son lieu, ou, hors champ, au bord, avec l'angle de sa flèche (0 vers le haut). */
export interface MarkOnScreen {
  x: number;
  y: number;
  inside: boolean;
  /** En radians, dans le sens des aiguilles d'une montre depuis le haut de l'écran. */
  angle: number;
}

/**
 * La place de la marque : `p` est le point projeté (en pixels, `behind` s'il est derrière la caméra), l'écran fait
 * `width` × `height`. Dans l'écran, sur son lieu ; hors champ, sur le bord, à `margin` pixels, vers le lieu. (La page
 * garde ensuite le panneau entier à l'écran.)
 */
export function markOnScreen(p: { x: number; y: number; behind: boolean }, width: number, height: number, margin: number): MarkOnScreen {
  const inside = !p.behind && p.x >= 0 && p.x <= width && p.y >= 0 && p.y <= height;
  if (inside) return { x: p.x, y: p.y, inside, angle: 0 };
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
  return { x: cx + dx * s, y: cy + dy * s, inside: false, angle: Math.atan2(dx, -dy) };
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
