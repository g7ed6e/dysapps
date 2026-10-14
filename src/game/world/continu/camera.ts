// Les cadrages prévus du monde continu (piste B) : un par rivage (./plan6e.ts, `FRAMINGS`), choisi d'après le nœud le
// plus proche de Kéo ; on passe de l'un à l'autre en douceur, la caméra toujours tournée vers le nord, au même angle,
// sans roulis ni secousse. Avec « Réduire les animations », une coupe franche. Sur un écran bas (un téléphone couché),
// la caméra se rapproche : un cadrage par nœud, Kéo et le lieu le plus proche (`cameraKey`, `cameraPose`), décalé de
// côté par un décentrement de l'objectif (`lens`), qui garde les verticales droites. Code pur : la vue pose la caméra.
import { distance, type Vec2, type Vec3 } from './geometry';
import { pathNode } from './paths';
import { PATH_NODES, PLACES, framingOf, placeById, type Framing, type PathNode, type PlaceId, type ShoreId } from './plan6e';
import { modelOfPlace } from './places';
import { heightAt, standingHeight } from './terrain';

/** L'angle de la caméra sous l'horizon, en radians : le monde vu d'en haut, de biais (le sud en bas de l'écran). */
export const CAMERA_PITCH = (52 * Math.PI) / 180;
/** Le champ vertical de la caméra, en degrés. */
export const CAMERA_FOV = 40;
/**
 * Le champ des cadrages rapprochés d'un écran bas, en degrés : plus étroit, la caméra un peu plus loin pour la même
 * taille. Le monde est vu sous le même angle, mais le bas de l'image moins en plongée : Kéo, toujours en bas de son
 * cadrage, n'y est plus écrasé, et les lieux hauts penchent moins.
 */
const CLOSE_UP_FOV = 25;
/** La durée d'un passage d'un cadrage à l'autre, en secondes. */
export const CAMERA_BLEND_SECONDS = 1.4;

/**
 * Une pose de caméra : sa place, le point qu'elle regarde (le haut est toujours la verticale), son champ vertical en
 * degrés, et le décentrement de l'objectif, `lens`, en part de la demi-largeur de l'écran (0 : le point regardé au
 * milieu ; 0,4 : décalé vers la droite de 40 % de la demi-largeur). La caméra ne tourne pas : seule l'image glisse,
 * les verticales restent droites.
 */
export interface CameraPose {
  position: Vec3;
  target: Vec3;
  fov: number;
  lens: number;
}

/** Le nœud du chemin le plus proche de `p`. */
const nearestNode = (p: Vec2): PathNode => {
  let best = PATH_NODES[0];
  for (const n of PATH_NODES) if (distance(p, n.at) < distance(p, best.at)) best = n;
  return best;
};

/**
 * La pose d'un cadrage pour un écran de rapport `aspect` (largeur sur hauteur) : assez loin pour que le disque de son
 * rayon tienne dans le plus petit des deux champs.
 */
export function poseOf(framing: Framing, aspect: number, groundY = 1): CameraPose {
  const vHalf = ((CAMERA_FOV / 2) * Math.PI) / 180;
  const hHalf = Math.atan(Math.tan(vHalf) * aspect);
  const half = Math.min(vHalf, hHalf);
  const dist = framing.radius / Math.sin(half);
  const target = { x: framing.target.x, y: groundY, z: framing.target.z };
  return {
    target,
    position: { x: target.x, y: target.y + dist * Math.sin(CAMERA_PITCH), z: target.z + dist * Math.cos(CAMERA_PITCH) },
    fov: CAMERA_FOV,
    lens: 0,
  };
}

/** De 0 à 1, lent au départ et à l'arrivée. */
const easeInOut = (u: number) => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);

const mix = (a: Vec3, b: Vec3, u: number): Vec3 => ({ x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, z: a.z + (b.z - a.z) * u });

/** Un passage d'une pose à une autre : d'où, vers où, depuis quand (en secondes). */
export interface CameraMove {
  from: CameraPose;
  to: CameraPose;
  start: number;
}

/** La pose d'un passage au temps `t` (en secondes) ; avec `reduceMotion`, la pose d'arrivée tout de suite (coupe franche). */
export function poseAt(move: CameraMove, t: number, reduceMotion: boolean): CameraPose {
  if (reduceMotion) return move.to;
  const u = easeInOut(Math.min(1, Math.max(0, (t - move.start) / CAMERA_BLEND_SECONDS)));
  return {
    position: mix(move.from.position, move.to.position, u),
    target: mix(move.from.target, move.to.target, u),
    fov: move.from.fov + (move.to.fov - move.from.fov) * u,
    lens: move.from.lens + (move.to.lens - move.from.lens) * u,
  };
}

/**
 * La hauteur d'écran de référence, en pixels : celle de la tablette couchée (1024 × 768), où les cadrages par rivage
 * sont réglés. À partir d'elle, rien ne change.
 */
export const REFERENCE_HEIGHT = 768;
/** Pas plus près que cette part de la distance de la tablette, même sur un écran très bas. */
const MIN_CLOSE_UP = 0.4;
/** La hauteur de Kéo dans la scène (son corps à l'échelle de la vue, un peu de marge), et le rayon de son anneau. */
export const KEO_HEIGHT = 2.6;
const KEO_RING_RADIUS = 1.3;
/** Au-dessus du sommet d'un lieu, en unités : là où se pose la marque (la vue lit la même valeur). */
export const MARK_LIFT = 1.2;
/** Un lieu plus haut que tant d'unités (le Phare) porte sa marque à côté de son sommet sur un écran bas. */
const TALL_PLACE = 8;
/** Le sommet d'un lieu haut : ses derniers tant d'unités ; la marque se pose à mi-hauteur, contre son flanc est. */
const SUMMIT = 3;

/**
 * Ce que les panneaux couvrent, en pixels (../../three/archipeo/openWorld.css), et l'air gardé autour :
 * - la marque posée au-dessus d'un lieu : 48 px de haut au moins et sa marge (`markAbove`) ; posée à côté, sa
 *   demi-hauteur (`markHalf`), et sa largeur à droite de son point (`markGap` puis `markWidth` ; plus large en grand
 *   texte, elle reste à l'écran et recouvre alors le haut du lieu) ;
 * - « Y aller » et « Passer le trajet », en bas au milieu : `goHalfWidth` de chaque côté du milieu, `goHeight` de haut
 *   avec sa marge au bord ; Kéo et son anneau en restent à `keoAir`, le lieu à `edge` ;
 * - les bords de l'écran : `edge` en haut et en bas, `side` à gauche et à droite.
 */
export const CLOSE_UP_INSETS = {
  edge: 8,
  side: 16,
  markAbove: 56,
  markHalf: 28,
  markGap: 8,
  markWidth: 150,
  goHalfWidth: 150,
  goHeight: 72,
  keoAir: 24,
} as const;

/** La part de la distance de la tablette pour un écran haut de `viewportHeight` pixels : 1 sur la tablette et au-delà. */
export function closeUpScale(viewportHeight: number): number {
  return Math.min(1, Math.max(MIN_CLOSE_UP, viewportHeight / REFERENCE_HEIGHT));
}

/** Ce qui choisit le cadrage : le rivage (écran haut), ou le nœud où se tient Kéo (écran bas). */
export type CameraKey = ShoreId | `noeud:${string}`;

const isCloseUp = (key: CameraKey): key is `noeud:${string}` => key.startsWith('noeud:');

/** Le lieu le plus proche d'un nœud : celui dont la porte est la plus proche (chaque nœud a le sien). */
function nearestPlace(n: PathNode): PlaceId {
  let best = PLACES[0];
  for (const pl of PLACES) if (distance(n.at, pathNode(pl.door).at) < distance(n.at, pathNode(best.door).at)) best = pl;
  return best.id;
}
const PLACE_OF_NODE: ReadonlyMap<PathNode, PlaceId> = new Map(PATH_NODES.map((n) => [n, nearestPlace(n)]));
const placeOfNode = (n: PathNode): PlaceId => PLACE_OF_NODE.get(n) ?? nearestPlace(n);

/** Les cadrages rapprochés, un par nœud (des chaînes faites une fois : la vue les compare à chaque image). */
const CLOSE_UP_KEYS: ReadonlyMap<PathNode, CameraKey> = new Map(PATH_NODES.map((n) => [n, `noeud:${n.id}` satisfies CameraKey]));

/** Le cadrage de Kéo en `p` pour un écran haut de `viewportHeight` pixels. */
export function cameraKey(p: Vec2, viewportHeight: number): CameraKey {
  const n = nearestNode(p);
  return closeUpScale(viewportHeight) >= 1 ? n.shore : (CLOSE_UP_KEYS.get(n) ?? `noeud:${n.id}`);
}

/** La marque d'un lieu se pose-t-elle à côté de son sommet (un lieu haut, sur un écran bas) plutôt qu'au-dessus ? */
export function markBeside(id: PlaceId, viewportHeight: number): boolean {
  return closeUpScale(viewportHeight) < 1 && modelOfPlace(id).top > TALL_PLACE;
}

/**
 * Le point de la marque d'un lieu, depuis son pied (son centre au sol), dans les axes du monde : au-dessus de son
 * sommet ; ou, posée à côté, contre le flanc est de son sommet, à mi-hauteur (la page pose le nom à sa droite).
 */
export function markOffset(id: PlaceId, viewportHeight: number): Vec3 {
  const model = modelOfPlace(id);
  if (!markBeside(id, viewportHeight)) return { x: 0, y: model.top + MARK_LIFT, z: 0 };
  const yaw = placeById(id).yaw;
  const c = Math.cos(yaw), s = Math.sin(yaw);
  const pos = model.facets.positions;
  let east = 0;
  for (let k = 0; k < pos.length; k += 3) if (pos[k + 1] >= model.top - SUMMIT) east = Math.max(east, pos[k] * c + pos[k + 2] * s);
  return { x: east, y: model.top - SUMMIT / 2, z: 0 };
}

/**
 * Un point à garder dans le cadre : ce qu'il demande de marge en haut et à droite (la marque), et d'air autour de
 * « Y aller » (Kéo plus que le lieu).
 */
interface Subject {
  at: Vec3;
  top: number;
  right: number;
  air: number;
}

/**
 * Ce que le cadrage d'un nœud doit montrer en entier : Kéo sur ce nœud (ses pieds, sa tête, son anneau), et le lieu le
 * plus proche (les sommets de sa maquette tournée, posée au sol) avec sa marque.
 */
function subjectsOf(n: PathNode, viewportHeight: number): Subject[] {
  const { edge, side, markAbove, markHalf, markGap, markWidth, keoAir } = CLOSE_UP_INSETS;
  const place = placeById(placeOfNode(n));
  const model = modelOfPlace(place.id);
  const y0 = standingHeight(heightAt(place.center));
  const c = Math.cos(place.yaw), s = Math.sin(place.yaw);
  const out: Subject[] = [];
  const seen = new Set<string>();
  const pos = model.facets.positions;
  for (let k = 0; k < pos.length; k += 3) {
    // Les pieds enfoncés sous le sol ne se voient pas : ils comptent au niveau du sol.
    const x = pos[k], y = Math.max(0, pos[k + 1]), z = pos[k + 2];
    const name = `${x.toFixed(2)},${y.toFixed(2)},${z.toFixed(2)}`;
    if (seen.has(name)) continue;
    seen.add(name);
    out.push({ at: { x: place.center.x + x * c + z * s, y: y0 + y, z: place.center.z - x * s + z * c }, top: edge, right: side, air: edge });
  }
  const mark = markOffset(place.id, viewportHeight);
  const at = { x: place.center.x + mark.x, y: y0 + mark.y, z: place.center.z + mark.z };
  if (markBeside(place.id, viewportHeight)) out.push({ at, top: markHalf + edge, right: markGap + markWidth + side, air: edge });
  else out.push({ at, top: markAbove, right: side, air: edge });
  const y = standingHeight(heightAt(n.at));
  for (const dx of [-KEO_RING_RADIUS, KEO_RING_RADIUS]) {
    out.push({ at: { x: n.at.x + dx, y, z: n.at.z + KEO_RING_RADIUS }, top: edge, right: side, air: keoAir });
    out.push({ at: { x: n.at.x + dx, y: y + KEO_HEIGHT, z: n.at.z - KEO_RING_RADIUS }, top: edge, right: side, air: keoAir });
  }
  return out;
}

const tanHalf = (fov: number) => Math.tan(((fov / 2) * Math.PI) / 180);

/** La place d'un point à l'écran, en pixels depuis le coin haut gauche, pour une pose et un écran donnés. */
export function screenOf(pose: CameraPose, p: Vec3, width: number, height: number): { x: number; y: number } {
  const fx = pose.target.x - pose.position.x, fy = pose.target.y - pose.position.y, fz = pose.target.z - pose.position.z;
  const fl = Math.hypot(fx, fy, fz);
  const f = { x: fx / fl, y: fy / fl, z: fz / fl };
  // La droite et le haut de la caméra, sans roulis (le haut est la verticale, comme `lookAt` dans la vue).
  const rl = Math.hypot(f.z, f.x) || 1;
  const right = { x: -f.z / rl, z: f.x / rl };
  const ux = -f.y * f.x, uy = 1 - f.y * f.y, uz = -f.y * f.z;
  const ul = Math.hypot(ux, uy, uz) || 1;
  const rx = p.x - pose.position.x, ry = p.y - pose.position.y, rz = p.z - pose.position.z;
  const depth = rx * f.x + ry * f.y + rz * f.z;
  const half = tanHalf(pose.fov) * depth;
  const sx = (rx * right.x + rz * right.z) / (half * (width / height)) + pose.lens;
  const sy = (rx * ux + ry * uy + rz * uz) / ul / half;
  return { x: ((sx + 1) / 2) * width, y: ((1 - sy) / 2) * height };
}

/** La pose regardant `target` (au sol, `groundY`) depuis `dist`, sous l'angle de toujours, décentrée de `lens`. */
const poseFrom = (x: number, z: number, dist: number, lens: number, groundY: number): CameraPose => ({
  target: { x, y: groundY, z },
  position: { x, y: groundY + dist * Math.sin(CAMERA_PITCH), z: z + dist * Math.cos(CAMERA_PITCH) },
  fov: CLOSE_UP_FOV,
  lens,
});

/**
 * Ce qui reste de marge au point le plus serré d'une pose, en pixels (négatif : un point sort du cadre ou passe sous
 * un panneau), et le décalage vers le bas qui équilibrerait le haut et le bas.
 */
function slackOf(pose: CameraPose, subjects: readonly Subject[], width: number, height: number): { slack: number; down: number } {
  const { edge, side, goHalfWidth, goHeight } = CLOSE_UP_INSETS;
  let above = Infinity, below = Infinity, sides = Infinity;
  for (const s of subjects) {
    const q = screenOf(pose, s.at, width, height);
    // Dans la colonne de « Y aller » (élargie de l'air du point), le bas s'arrête au-dessus du bouton.
    const overGo = Math.abs(q.x - width / 2) < goHalfWidth + s.air;
    const floor = overGo ? height - goHeight - s.air : height - edge;
    above = Math.min(above, q.y - s.top);
    below = Math.min(below, floor - q.y);
    sides = Math.min(sides, q.x - side, width - s.right - q.x);
  }
  return { slack: Math.min(above, below, sides), down: (below - above) / 2 };
}

/**
 * Les décentrements essayés, du plus petit au plus grand : le sujet au milieu, ou à côté de « Y aller » quand il est
 * trop haut pour tenir au-dessus. On garde le plus petit qui rapproche presque autant que le meilleur.
 */
const LENS_SHIFTS = [0, 0.2, -0.2, 0.3, -0.3, 0.4, -0.4, 0.5, -0.5] as const;
/** « Presque autant » : à 5 % près de la distance. */
const LENS_TOLERANCE = 1.05;
/** La recherche de la distance : tant de reculs de 30 % au plus, puis tant de pas de dichotomie. */
const BACK_OFF = { factor: 1.3, steps: 12 } as const;
const BISECTION_STEPS = 10;
/** Les passes qui recentrent le sujet en hauteur à chaque distance essayée. */
const CENTERING_PASSES = 3;

const subjectCache = new Map<string, Subject[]>();
/** Les poses rapprochées de la taille d'écran courante seulement : vidées quand elle change. */
const poseCache = new Map<string, CameraPose>();
let poseCacheSize = '';

/**
 * Le cadrage rapproché d'un nœud : la caméra aussi près que sur la tablette rapportée à la hauteur de l'écran (Kéo y
 * garde à peu près sa taille en pixels), reculée juste ce qu'il faut pour que Kéo, le lieu le plus proche et sa marque
 * tiennent hors des panneaux (`CLOSE_UP_INSETS`) ; l'image glisse de côté si cela les laisse nettement plus grands.
 * Calculé une fois par nœud pour la taille d'écran courante.
 */
function closeUpPose(n: PathNode, width: number, height: number, groundY: number): CameraPose {
  const size = `${width}x${height}:${groundY}`;
  if (size !== poseCacheSize) {
    poseCache.clear();
    poseCacheSize = size;
  }
  const cached = poseCache.get(n.id);
  if (cached) return cached;
  const beside = markBeside(placeOfNode(n), height);
  const subjectKey = `${n.id}:${beside}`;
  let subjects = subjectCache.get(subjectKey);
  if (!subjects) subjectCache.set(subjectKey, (subjects = subjectsOf(n, height)));
  // Kéo a la taille de la tablette quand la distance, rapportée à la hauteur de l'écran et au champ, est la même.
  const tablet = framingOf(n.shore).radius / Math.sin(Math.atan(tanHalf(CAMERA_FOV)));
  const nearest = tablet * closeUpScale(height) * (tanHalf(CAMERA_FOV) / tanHalf(CLOSE_UP_FOV));
  let minZ = Infinity, maxZ = -Infinity;
  for (const { at } of subjects) {
    minZ = Math.min(minZ, at.z);
    maxZ = Math.max(maxZ, at.z);
  }
  // L'axe du lieu au point regardé : il reste droit à l'écran, l'image glissant de côté par le décentrement seul.
  const x = placeById(placeOfNode(n)).center.x;
  // La pose à une distance donnée, décentrée de `lens`, le sujet centré en hauteur ; et sa marge.
  const fitAt = (dist: number, lens: number) => {
    let z = (minZ + maxZ) / 2;
    // Un pixel vaut, au sol près de la cible, à peu près tant d'unités vers le nord.
    const unitsPerPixel = (2 * dist * tanHalf(CLOSE_UP_FOV)) / height / Math.sin(CAMERA_PITCH);
    let fit = slackOf(poseFrom(x, z, dist, lens, groundY), subjects, width, height);
    for (let k = 0; k < CENTERING_PASSES; k++) {
      z -= fit.down * unitsPerPixel;
      fit = slackOf(poseFrom(x, z, dist, lens, groundY), subjects, width, height);
    }
    return { pose: poseFrom(x, z, dist, lens, groundY), slack: fit.slack };
  };
  // La plus petite distance qui tient pour un décentrement : reculer jusqu'à tenir, puis resserrer par dichotomie.
  const smallestFit = (lens: number): { pose: CameraPose; dist: number } | null => {
    let lo = nearest;
    let hi = nearest;
    let found = fitAt(hi, lens);
    for (let k = 0; k < BACK_OFF.steps && found.slack < 0; k++) found = fitAt((hi *= BACK_OFF.factor), lens);
    if (found.slack < 0) return null;
    if (hi > lo) {
      for (let k = 0; k < BISECTION_STEPS; k++) {
        const mid = (lo + hi) / 2;
        const at = fitAt(mid, lens);
        if (at.slack >= 0) {
          hi = mid;
          found = at;
        } else lo = mid;
      }
    }
    return { pose: found.pose, dist: hi };
  };
  const fits = LENS_SHIFTS.map(smallestFit).filter((f) => f !== null);
  const closest = Math.min(...fits.map((f) => f.dist));
  const pose = fits.find((f) => f.dist <= closest * LENS_TOLERANCE)?.pose ?? poseOf(framingOf(n.shore), width / height, groundY);
  poseCache.set(n.id, pose);
  return pose;
}

/** La pose d'un cadrage pour un écran de `width` × `height` pixels : celle du rivage, ou le cadrage rapproché d'un nœud. */
export function cameraPose(key: CameraKey, width: number, height: number, groundY = 1): CameraPose {
  if (!isCloseUp(key)) return poseOf(framingOf(key), width / Math.max(1, height), groundY);
  const n = PATH_NODES.find((m) => m.id === key.slice('noeud:'.length));
  return n ? closeUpPose(n, width, height, groundY) : poseOf(framingOf(PATH_NODES[0].shore), width / Math.max(1, height), groundY);
}
