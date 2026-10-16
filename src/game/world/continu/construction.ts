// La construction de chaque lieu dans le monde continu (GD-20, lot 1, « Tout au lieu ») : le lieu se rebâtit lui-même.
// Avant la première réussite, il n'en reste qu'une ruine ; à la première réussite de chaque mission, une partie le
// rebâtit sur place, en trois étapes comme dans la grille (le corps, le haut, les abords ; index.md, « La construction
// du lieu »). Les parties sont celles de la grille, mêmes identifiants et même sauvegarde (`parts`) : la page les lit
// (../../three/archipeo/constructionParts.ts) et donne ici, pour chacune, les tranches d'étapes qu'elle pose ; les
// volumes sont ceux du lieu (./places.ts), rangés par étape et par rangée. Code pur.
import { FOLLOW, KEO_HEIGHT, screenOf, type CameraPose } from './camera';
import { boundsOf, placeFacets, type Facets } from './facets';
import type { Vec3 } from './geometry';
import { pathNode } from './paths';
import { placeById, type PlaceId } from './plan6e';
import { drawPieces, modelOfPlace, ruinOf, type PlacePiece } from './places';
import { scenetteExit } from './scenette';
import { standingHeight } from './terrain';

/** Les trois étapes de la construction d'un lieu : le corps, le haut, les abords. */
export type Stage = 0 | 1 | 2;

/**
 * Une tranche d'étape qu'une partie pose : de `from` à `to` (de 0 à 1, du bas vers le haut). Une étape entière va de
 * 0 à 1 ; coupée en deux ou en trois par la hauteur (GD-14), ses tranches se suivent, en rangées entières.
 */
interface StageSlice {
  stage: Stage;
  from: number;
  to: number;
}

/** Une partie : les tranches qu'elle pose (une, ou deux quand le haut et les abords vont ensemble). */
export type PartShape = readonly StageSlice[];

/** La tranche `from`–`to` d'une étape prend-elle ce volume ? Sa rangée y est. */
const takes = (s: StageSlice, p: PlacePiece) => s.stage === p.stage && p.row >= s.from - 1e-9 && p.row < s.to - 1e-9;

/** Une étape est-elle entièrement posée par ces parties ? (Ses tranches couvrent de 0 à 1.) */
export function stageComplete(parts: readonly PartShape[], stage: Stage): boolean {
  let covered = 0;
  for (const part of parts) for (const s of part) if (s.stage === stage) covered += s.to - s.from;
  return covered >= 1 - 1e-9;
}

/** Le pied d'un lieu dans le monde : son centre, au sol dessiné (`ground`), et son quart de tour. */
function siteOf(place: PlaceId, ground: (x: number, z: number) => number) {
  const p = placeById(place);
  return { x: p.center.x, y: standingHeight(ground(p.center.x, p.center.z)), z: p.center.z, yaw: p.yaw };
}

/** La ruine d'un lieu, posée dans le monde : ce qui reste avant toute partie. */
export function ruinFacets(place: PlaceId, ground: (x: number, z: number) => number): Facets {
  return placeFacets(ruinOf(place), siteOf(place, ground));
}

/**
 * Les volumes que posent ces parties, dans le monde (`ground` : la hauteur du sol dessiné) : toute la construction
 * posée, ou, pour le passage d'une pose, la seule partie qui arrive.
 */
export function constructionFacets(place: PlaceId, parts: readonly PartShape[], ground: (x: number, z: number) => number): Facets {
  if (!parts.length) return drawPieces(place, () => false);
  const facets = drawPieces(place, (p) => p.stage !== 'ruine' && parts.some((part) => part.some((s) => takes(s, p))));
  return placeFacets(facets, siteOf(place, ground));
}

/**
 * Ce qui est tombé dans la ruine et attend encore la rangée qui le relèvera (la cloche du Phare, au pied de la tour,
 * jusqu'à ce que la galerie la raccroche), dans le monde.
 */
export function fallenFacets(place: PlaceId, parts: readonly PartShape[], ground: (x: number, z: number) => number): Facets {
  const lying = (p: PlacePiece) => {
    const u = p.until;
    return u !== undefined && !parts.some((part) => part.some((s) => s.stage === u.stage && u.row >= s.from - 1e-9 && u.row < s.to - 1e-9));
  };
  return placeFacets(drawPieces(place, lying), siteOf(place, ground));
}

/** La construction entière, ses trois étapes posées : le pire, pour le budget. */
export const WHOLE: PartShape = [
  { stage: 0, from: 0, to: 1 },
  { stage: 1, from: 0, to: 1 },
  { stage: 2, from: 0, to: 1 },
];

/**
 * L'étape sur laquelle repose la trace de la scénette d'un lieu (questionScene.ts, `placeTrace`) : les lampes de la
 * galerie du Phare, le filet raccommodé sur le séchoir des Filets (les abords) ; la grue remontée des Quais, la porte
 * d'amont des Écluses, le hangar à sel des Marais salants (le haut). Tant que cette étape n'est pas posée, la trace
 * attend : rien ne flotte dans le vide.
 */
const TRACE_STAGE: Readonly<Record<PlaceId, Stage>> = { phare: 2, quais: 1, filets: 2, ecluses: 1, saltworks: 1 };

/**
 * L'étape qui porte la trace d'un lieu est-elle posée ? Sa scénette se joue alors sur elle (la galerie du Phare, le
 * séchoir des Filets, la grue des Quais, la porte d'amont des Écluses) ; sinon, avec ce qui est là, au sol ou sur l'eau :
 * une scénette se joue sur le lieu tel qu'il est bâti, rien d'achevé ne se montre avant d'être posé.
 */
export const traceStagePosed = (place: PlaceId, parts: readonly PartShape[]): boolean => stageComplete(parts, TRACE_STAGE[place]);

/** La trace d'un lieu se montre-t-elle ? Sa scénette réussie (`done`), et l'étape qui la porte posée. */
export const traceShown = (place: PlaceId, parts: readonly PartShape[], done: boolean): boolean => done && traceStagePosed(place, parts);

/** La lanterne du Phare est-elle allumée ? Dès que son haut est posé (directeur artistique, 15 octobre 2026). */
export const lanternLit = (parts: readonly PartShape[]): boolean => stageComplete(parts, 1);

/** La hauteur du point regardé par la pose, en part de la hauteur du lieu : un peu sous le milieu (son pied, plus près de la caméra, descend plus bas à l'écran que son haut ne monte). */
const FOCUS_HEIGHT = 0.45;

/** Le point que regarde la caméra d'une pose : le milieu du lieu entier, un peu sous sa mi-hauteur. */
export function poseFocus(place: PlaceId, ground: (x: number, z: number) => number): Vec3 {
  const site = siteOf(place, ground);
  const { min, max } = boundsOf(modelOfPlace(place).facets);
  const c = Math.cos(site.yaw),
    s = Math.sin(site.yaw);
  const lx = (min[0] + max[0]) / 2,
    lz = (min[2] + max[2]) / 2;
  return { x: site.x + lx * c + lz * s, y: site.y + Math.max(0, min[1]) + (max[1] - Math.max(0, min[1])) * FOCUS_HEIGHT, z: site.z - lx * s + lz * c };
}

/**
 * La caméra d'une pose : du côté de la porte du lieu (à mi-chemin entre la porte et le sud, d'où vient la caméra qui
 * suit Kéo), assez loin pour cadrer le lieu entier sur un écran 4:3, avec sa marge (`margin`, et en bas `bottom`,
 * au-dessus de « Y aller ») ; un peu au-dessus, le regard baissé de `pitch`. Au même champ que la caméra qui suit (aucun effet de zoom).
 */
const POSE_VIEW = { pitch: 0.4, aspect: 4 / 3, margin: 0.06, bottom: 0.14, min: 8, max: 40 } as const;

/** La direction (au sol, depuis le lieu) d'où la caméra de la pose le regarde : sa porte, ramenée vers le sud. */
export function poseSide(place: PlaceId): { x: number; z: number } {
  const p = placeById(place);
  const door = pathNode(p.door).at;
  const dx = door.x - p.center.x,
    dz = door.z - p.center.z;
  const l = Math.hypot(dx, dz) || 1;
  const x = dx / l,
    z = dz / l + 1;
  const m = Math.hypot(x, z) || 1;
  return { x: x / m, z: z / m };
}

/**
 * La caméra d'une pose (GD-20, lot 1) : le lieu entier vu du côté de sa porte, de trois quarts haut, au même champ que
 * la caméra qui suit Kéo. Remplie dans `out`.
 */
export function poseView(place: PlaceId, ground: (x: number, z: number) => number, out: CameraPose): CameraPose {
  const f = poseFocus(place, ground);
  const side = poseSide(place);
  const set = (d: number) => {
    const flat = d * Math.cos(POSE_VIEW.pitch);
    out.position.x = f.x + side.x * flat;
    out.position.y = f.y + d * Math.sin(POSE_VIEW.pitch);
    out.position.z = f.z + side.z * flat;
    out.target.x = f.x;
    out.target.y = f.y;
    out.target.z = f.z;
    out.fov = FOLLOW.fov;
    out.lens = 0;
  };
  // La distance : la plus courte où tout le lieu hors de l'eau, et Kéo entier là où il se tient pendant une pose, tiennent
  // dans un écran 4:3, avec sa marge (calculée une fois par lieu : le cadrage est fixe, le sol ne change pas).
  let d = poseDistance.get(place);
  if (d === undefined) {
    const pts = [...placeFacets(modelOfPlace(place).facets, siteOf(place, ground)).positions, ...keoSpots(place, ground)];
    const W = 400 * POSE_VIEW.aspect,
      H = 400;
    const m = POSE_VIEW.margin;
    const fits = () => {
      for (let k = 0; k < pts.length; k += 3) {
        if (pts[k + 1] < 0) continue;
        const q = screenOf(out, { x: pts[k], y: pts[k + 1], z: pts[k + 2] }, W, H);
        if (q.x < m * W || q.x > (1 - m) * W || q.y < m * H || q.y > (1 - POSE_VIEW.bottom) * H) return false;
      }
      return true;
    };
    d = POSE_VIEW.min;
    for (set(d); !fits() && d < POSE_VIEW.max; set(d)) d += 0.5;
    poseDistance.set(place, d);
  }
  set(d);
  return out;
}

const poseDistance = new Map<PlaceId, number>();

/** Le demi-côté de la boîte de Kéo, en unités : ses bras et son sac. */
const KEO_HALF = 0.55;

/**
 * Les coins de Kéo debout là où il se tient quand une pose commence (directeur artistique : jamais coupé au bord de
 * l'image) : à la porte du lieu (on y arrive), ou là où sa scénette le laisse (scenette.ts, `scenetteExit`).
 */
export function keoSpots(place: PlaceId, ground: (x: number, z: number) => number): number[] {
  const spots = [pathNode(placeById(place).door).at];
  const exit = scenetteExit(place);
  if (exit) spots.push(exit.at);
  const out: number[] = [];
  for (const s of spots) {
    const y = standingHeight(ground(s.x, s.z));
    for (const dx of [-KEO_HALF, KEO_HALF]) for (const dz of [-KEO_HALF, KEO_HALF]) for (const h of [0, KEO_HEIGHT]) out.push(s.x + dx, y + h, s.z + dz);
  }
  return out;
}

/**
 * Le passage d'une pose, en secondes : la caméra va vers le lieu, la partie descend à sa place, on la regarde, puis la
 * caméra rejoint Kéo. Avec « Réduire les animations », la partie est posée d'un coup, la caméra coupe sur le lieu puis
 * revient (`still`).
 */
export const POSE_SECONDS = { rise: 0.9, drop: 0.7, look: 1.1, back: 0.9, still: 1.6 } as const;
/**
 * Le garde-fou d'une pose, en secondes : une pose dont la fin n'est jamais dite (la scène arrêtée, l'onglet caché) est
 * tenue pour finie après la plus longue (rise, drop, look, back) et une marge ; la liste du lieu se rouvre et les
 * célébrations reviennent. Une pose ordinaire finit bien avant : rien n'attend plus longtemps qu'aujourd'hui.
 */
export const POSE_GUARD_SECONDS = POSE_SECONDS.rise + POSE_SECONDS.drop + POSE_SECONDS.look + POSE_SECONDS.back + 3;
/** D'où descend la partie qui se pose, en unités au-dessus de sa place. */
export const POSE_DROP = 3.5;

/** Les temps d'une pose : la caméra va vers le lieu, la partie descend, on la regarde, la caméra revient ; ou, avec « Réduire les animations », d'un bloc. */
type PosePhase = 'rise' | 'drop' | 'look' | 'back' | 'still';

/**
 * Ce que la vue fait à chaque temps d'une pose : `rise` et `back`, la caméra à la part `e` (adoucie) de son trajet ;
 * `drop`, la partie à la part `e` de sa descente ; `land`, la partie à sa place (il peut venir deux fois) ; `turn`, la caméra prépare son retour
 * vers Kéo ; `done`, la pose est finie (les célébrations peuvent venir).
 */
export interface PoseHooks {
  rise(e: number): void;
  drop(e: number): void;
  land(): void;
  turn(): void;
  back(e: number): void;
  done(): void;
}

/**
 * Le déroulé d'une pose, sans Three.js (la vue en fait le rendu) : `start` la commence, `step` la fait avancer à
 * l'instant `t` (en secondes), `finish` la finit tout de suite (un toucher, « Y aller », la Carte, une question) : la
 * partie est posée et `done` est appelé, une fois, quel que soit le chemin. `handOver` passe la main à une pose qui
 * suit (deux réussites rapprochées) : la partie en cours est posée, sans `done`, que seule la dernière pose dira (les
 * célébrations ne sortent pas au milieu d'une pose).
 */
export function createPoseRun(hooks: PoseHooks) {
  let run: { phase: PosePhase; start: number } | null = null;
  const finish = () => {
    if (!run) return;
    run = null;
    hooks.land();
    hooks.done();
  };
  return {
    get active(): boolean {
      return run !== null;
    },
    handOver(): void {
      if (!run) return;
      run = null;
      hooks.land();
    },
    start(t: number, still: boolean): void {
      finish();
      if (still) hooks.land();
      run = { phase: still ? 'still' : 'rise', start: t };
    },
    step(t: number): void {
      if (!run) return;
      const u = Math.min(1, (t - run.start) / POSE_SECONDS[run.phase]);
      const e = u * u * (3 - 2 * u);
      switch (run.phase) {
        case 'rise':
          hooks.rise(e);
          if (u >= 1) {
            run = { phase: 'drop', start: t };
            hooks.drop(0);
          }
          return;
        case 'drop':
          hooks.drop(e);
          if (u >= 1) {
            hooks.land();
            run = { phase: 'look', start: t };
          }
          return;
        case 'look':
          if (u >= 1) {
            hooks.turn();
            run = { phase: 'back', start: t };
          }
          return;
        case 'back':
          hooks.back(e);
          if (u >= 1) finish();
          return;
        case 'still':
          if (u >= 1) finish();
          return;
      }
    },
    finish,
  };
}
