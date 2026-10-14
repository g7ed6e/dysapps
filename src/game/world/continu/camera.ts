// Les cadrages prévus du monde continu (piste B) : un par rivage (./plan6e.ts, `FRAMINGS`), choisi d'après le nœud le
// plus proche de Kéo ; on passe de l'un à l'autre en douceur, la caméra toujours tournée vers le nord, au même angle,
// sans roulis ni secousse. Avec « Réduire les animations », une coupe franche. Sur un écran bas (un téléphone couché),
// la caméra se rapproche : un cadrage par nœud, Kéo et le lieu le plus proche (`cameraKey`, `cameraPose`). Code pur : la vue pose la caméra.
import { distance, type Vec2, type Vec3 } from './geometry';
import { PATH_NODES, PLACES, framingOf, placeById, type Framing, type PathNode, type PlaceId, type ShoreId } from './plan6e';
import { modelOfPlace } from './places';
import { heightAt, standingHeight } from './terrain';

/** L'angle de la caméra sous l'horizon, en radians : le monde vu d'en haut, de biais (le sud en bas de l'écran). */
export const CAMERA_PITCH = (52 * Math.PI) / 180;
/** Le champ vertical de la caméra, en degrés. */
export const CAMERA_FOV = 40;
/** La durée d'un passage d'un cadrage à l'autre, en secondes. */
export const CAMERA_BLEND_SECONDS = 1.4;

/** Une pose de caméra : sa place et le point qu'elle regarde (le haut est toujours la verticale). */
export interface CameraPose {
  position: Vec3;
  target: Vec3;
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
  return { position: mix(move.from.position, move.to.position, u), target: mix(move.from.target, move.to.target, u) };
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
/**
 * Ce que les panneaux couvrent au bord de l'écran, en pixels (../../three/archipeo/openWorld.css) : en haut, la marque
 * posée au-dessus du lieu (48 px au moins et sa marge ; plus haute en grand texte, elle descend sur le lieu sans quitter
 * l'écran) ; en bas au milieu, « Y aller » et « Passer le trajet » (56 px de haut et leur marge, `goHalfWidth` de
 * chaque côté du milieu) ; ailleurs, un peu d'air sous l'anneau de Kéo et sur les bords.
 */
export const CLOSE_UP_INSETS = { edge: 8, mark: 56, bottom: 80, foot: 24, goHalfWidth: 150, side: 16 } as const;

/** La part de la distance de la tablette pour un écran haut de `viewportHeight` pixels : 1 sur la tablette et au-delà. */
export function closeUpScale(viewportHeight: number): number {
  return Math.min(1, Math.max(MIN_CLOSE_UP, viewportHeight / REFERENCE_HEIGHT));
}

/** Ce qui choisit le cadrage : le rivage (écran haut), ou le nœud où se tient Kéo (écran bas). */
export type CameraKey = ShoreId | `noeud:${string}`;

/** Le lieu de chaque nœud : celui dont la porte est la plus proche (chaque nœud a le sien). Calculé une fois. */
const PLACE_OF_NODE: ReadonlyMap<string, PlaceId> = new Map(
  PATH_NODES.map((n) => {
    const door = (id: string) => PATH_NODES.find((m) => m.id === id)!.at;
    let best = PLACES[0];
    for (const pl of PLACES) if (distance(n.at, door(pl.door)) < distance(n.at, door(best.door))) best = pl;
    return [n.id, best.id] as const;
  }),
);
const placeOfNode = (n: PathNode): PlaceId => PLACE_OF_NODE.get(n.id)!;

/** Les cadrages rapprochés, un par nœud (des chaînes faites une fois : la vue les compare à chaque image). */
const CLOSE_UP_KEYS: ReadonlyMap<string, CameraKey> = new Map(PATH_NODES.map((n) => [n.id, `noeud:${n.id}` as const]));

/** Le cadrage de Kéo en `p` pour un écran haut de `viewportHeight` pixels. */
export function cameraKey(p: Vec2, viewportHeight: number): CameraKey {
  const n = nearestNode(p);
  return closeUpScale(viewportHeight) >= 1 ? n.shore : CLOSE_UP_KEYS.get(n.id)!;
}

/** Un point à garder dans le cadre, et ce qu'il demande de marge en haut (la marque au-dessus du lieu). */
interface Subject {
  at: Vec3;
  top: number;
}

/**
 * Ce que le cadrage d'un nœud doit montrer en entier : Kéo sur ce nœud (ses pieds, sa tête, son anneau), et le lieu le
 * plus proche (les sommets de sa maquette tournée, posée au sol) avec sa marque.
 */
function subjectsOf(n: PathNode): Subject[] {
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
    out.push({ at: { x: place.center.x + x * c + z * s, y: y0 + y, z: place.center.z - x * s + z * c }, top: CLOSE_UP_INSETS.edge });
  }
  out.push({ at: { x: place.center.x, y: y0 + model.top + MARK_LIFT, z: place.center.z }, top: CLOSE_UP_INSETS.mark });
  const y = standingHeight(heightAt(n.at));
  for (const dx of [-KEO_RING_RADIUS, KEO_RING_RADIUS]) {
    out.push({ at: { x: n.at.x + dx, y, z: n.at.z + KEO_RING_RADIUS }, top: CLOSE_UP_INSETS.edge });
    out.push({ at: { x: n.at.x + dx, y: y + KEO_HEIGHT, z: n.at.z - KEO_RING_RADIUS }, top: CLOSE_UP_INSETS.edge });
  }
  return out;
}

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
  const half = Math.tan(((CAMERA_FOV / 2) * Math.PI) / 180) * depth;
  const sx = (rx * right.x + rz * right.z) / (half * (width / height));
  const sy = (rx * ux + ry * uy + rz * uz) / ul / half;
  return { x: ((sx + 1) / 2) * width, y: ((1 - sy) / 2) * height };
}

/** La pose regardant `target` (au sol, `groundY`) depuis `dist`, sous l'angle de toujours. */
const poseFrom = (x: number, z: number, dist: number, groundY: number): CameraPose => ({
  target: { x, y: groundY, z },
  position: { x, y: groundY + dist * Math.sin(CAMERA_PITCH), z: z + dist * Math.cos(CAMERA_PITCH) },
});

const TAN_HALF_FOV = Math.tan(((CAMERA_FOV / 2) * Math.PI) / 180);

/**
 * Ce qui reste de marge au point le plus serré d'une pose, en pixels (négatif : un point sort du cadre ou passe sous
 * un panneau), et le décalage vertical qui équilibrerait le haut et le bas.
 */
function slackOf(pose: CameraPose, subjects: readonly Subject[], width: number, height: number): { slack: number; down: number } {
  let above = Infinity, below = Infinity, sides = Infinity;
  for (const s of subjects) {
    const q = screenOf(pose, s.at, width, height);
    const underGo = Math.abs(q.x - width / 2) < CLOSE_UP_INSETS.goHalfWidth;
    above = Math.min(above, q.y - s.top);
    below = Math.min(below, height - (underGo ? CLOSE_UP_INSETS.bottom : CLOSE_UP_INSETS.foot) - q.y);
    sides = Math.min(sides, q.x - CLOSE_UP_INSETS.side, width - CLOSE_UP_INSETS.side - q.x);
  }
  return { slack: Math.min(above, below, sides), down: (below - above) / 2 };
}

/**
 * Les décalages essayés de côté, en part de la demi-largeur vue, du plus petit au plus grand : le lieu au milieu, ou
 * à côté de « Y aller » quand il est trop haut pour tenir au-dessus. Plus il est loin du milieu, plus il penche (la
 * perspective) : on garde le plus petit qui rapproche presque autant que le meilleur.
 */
const SIDE_SHIFTS = [0, 0.2, -0.2, 0.3, -0.3, 0.4, -0.4] as const;
/** « Presque autant » : à 5 % près de la distance. */
const SIDE_TOLERANCE = 1.05;

const subjectCache = new Map<string, Subject[]>();
const poseCache = new Map<string, CameraPose>();

/**
 * Le cadrage rapproché d'un nœud : la caméra aussi près que sur la tablette rapportée à la hauteur de l'écran (Kéo y
 * garde à peu près sa taille en pixels), reculée juste ce qu'il faut pour que Kéo, le lieu le plus proche et sa marque
 * tiennent hors des panneaux (`CLOSE_UP_INSETS`) ; le tout glisse de côté si cela le laisse nettement plus grand.
 * Calculé une fois par nœud et par taille d'écran.
 */
function closeUpPose(n: PathNode, width: number, height: number, groundY: number): CameraPose {
  const cacheKey = `${n.id}:${width}x${height}:${groundY}`;
  const cached = poseCache.get(cacheKey);
  if (cached) return cached;
  let subjects = subjectCache.get(n.id);
  if (!subjects) subjectCache.set(n.id, (subjects = subjectsOf(n)));
  const shore = n.shore;
  const nearest = (framingOf(shore).radius / Math.sin(Math.atan(TAN_HALF_FOV))) * closeUpScale(height);
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const { at } of subjects) {
    minX = Math.min(minX, at.x);
    maxX = Math.max(maxX, at.x);
    minZ = Math.min(minZ, at.z);
    maxZ = Math.max(maxZ, at.z);
  }
  const aspect = width / height;
  // La pose à une distance donnée, décalée de côté de `side`, centrée en hauteur ; et sa marge.
  const fitAt = (dist: number, side: number) => {
    const x = (minX + maxX) / 2 + side * dist * TAN_HALF_FOV * aspect;
    let z = (minZ + maxZ) / 2;
    // Un pixel vaut, au sol près de la cible, à peu près tant d'unités vers le nord.
    const unitsPerPixel = (2 * dist * TAN_HALF_FOV) / height / Math.sin(CAMERA_PITCH);
    let fit = slackOf(poseFrom(x, z, dist, groundY), subjects, width, height);
    for (let k = 0; k < 3; k++) {
      z -= fit.down * unitsPerPixel;
      fit = slackOf(poseFrom(x, z, dist, groundY), subjects, width, height);
    }
    return { pose: poseFrom(x, z, dist, groundY), slack: fit.slack };
  };
  const fits: { pose: CameraPose; dist: number }[] = [];
  for (const side of SIDE_SHIFTS) {
    // La plus petite distance qui tient, par dichotomie, entre la plus proche permise et une qui tient.
    let lo = nearest;
    let hi = nearest;
    let found = fitAt(hi, side);
    for (let k = 0; k < 12 && found.slack < 0; k++) found = fitAt((hi *= 1.3), side);
    if (found.slack < 0) continue;
    if (hi > lo) {
      for (let k = 0; k < 10; k++) {
        const mid = (lo + hi) / 2;
        const at = fitAt(mid, side);
        if (at.slack >= 0) {
          hi = mid;
          found = at;
        } else lo = mid;
      }
    }
    fits.push({ pose: found.pose, dist: hi });
  }
  const closest = Math.min(...fits.map((f) => f.dist));
  const pose = fits.find((f) => f.dist <= closest * SIDE_TOLERANCE)?.pose ?? poseOf(framingOf(shore), aspect, groundY);
  poseCache.set(cacheKey, pose);
  return pose;
}

/** La pose d'un cadrage pour un écran de `width` × `height` pixels : celle du rivage, ou le cadrage rapproché d'un nœud. */
export function cameraPose(key: CameraKey, width: number, height: number, groundY = 1): CameraPose {
  if (key.startsWith('noeud:')) {
    const n = PATH_NODES.find((m) => m.id === key.slice(6));
    if (n) return closeUpPose(n, width, height, groundY);
  }
  return poseOf(framingOf(key as ShoreId), width / Math.max(1, height), groundY);
}
