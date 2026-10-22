// La Carte des lieux ouverts du monde continu (piste 1, lot 3, condition du consultant UX UI : « garder la Carte, lieux
// ouverts seulement ») : l'île vue de haut, nord en haut, qu'on fait glisser à un doigt et qu'on pince à deux (ou à la
// molette), comme la Carte du monde en grille (#331), sans boutons + ou −. Seuls les lieux ouverts se touchent ; un
// lieu encore sous la brume porte son cadenas. Rien n'est écrit dans la 3D : les noms des lieux sont des boutons de la
// page. Ici, la pose de la caméra et ses limites, sans Three.js ; la vue fait le reste (../../three/archipeo/scene.ts).
import { screenOf, type CameraPose } from './camera';
import type { Vec2 } from './geometry';
import type { LevelPlan } from './levelPlan';

/**
 * La caméra de la Carte : son angle sous l'horizon (presque à plomb, un peu de biais pour garder le relief), son champ
 * vertical, la marge autour de l'île vue entière (en part), et sa distance la plus proche, en unités (un lieu remplit
 * alors la moitié de l'écran).
 */
export const MAP_CAMERA = { pitch: (64 * Math.PI) / 180, fov: 40, margin: 1.04, closest: 100 } as const;

/** La pose de la Carte : le point regardé, au sol (à hauteur de l'eau), et la distance de la caméra à ce point. */
export interface MapView {
  x: number;
  z: number;
  distance: number;
}

/** La boîte de l'île d'un plan, en unités. */
export interface IslandBox {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

const boxes = new WeakMap<LevelPlan, IslandBox>();

/**
 * La boîte de l'île d'un plan (sa côte, et le large qui en dépasse : au 6e, le bord de son anneau de sable, les mâts des
 * Balises et l'îlot de la Gare maritime, lot L9), en unités.
 */
export function islandBox(plan: LevelPlan): IslandBox {
  let box = boxes.get(plan);
  if (!box) {
    const xs = [...plan.coast, ...plan.offshore].map((p) => p.x);
    const zs = [...plan.coast, ...plan.offshore].map((p) => p.z);
    boxes.set(plan, (box = { minX: Math.min(...xs), maxX: Math.max(...xs), minZ: Math.min(...zs), maxZ: Math.max(...zs) }));
  }
  return box;
}

/** La distance la plus lointaine qu'on cherche, en unités (bien au-delà de l'île entière). */
const FARTHEST = 4000;

/**
 * La distance où l'île entière d'un plan tient dans un écran de rapport `aspect` (largeur sur hauteur), avec sa marge : les
 * quatre coins de sa boîte à l'écran, en perspective (le bord sud, plus proche, est plus grand), cherchée par
 * dichotomie. Le résultat ne dépend que du plan et du rapport : il est gardé.
 */
export function fitDistance(plan: LevelPlan, aspect: number): number {
  const key = Math.round(aspect * 1000);
  let fits = fitsOf.get(plan);
  if (!fits) fitsOf.set(plan, (fits = new Map()));
  const known = fits.get(key);
  if (known !== undefined) return known;
  const h = 1000;
  const w = Math.max(0.1, aspect) * h;
  const { minX, maxX, minZ, maxZ } = islandBox(plan);
  const x = (minX + maxX) / 2;
  const z = (minZ + maxZ) / 2;
  const corners = [
    { x: minX, y: 0, z: minZ },
    { x: maxX, y: 0, z: minZ },
    { x: minX, y: 0, z: maxZ },
    { x: maxX, y: 0, z: maxZ },
  ];
  const inside = (distance: number) =>
    corners.every((c) => {
      const s = screenOf(mapPose({ x, z, distance }), c, w, h);
      return s.x >= 0 && s.x <= w && s.y >= 0 && s.y <= h;
    });
  let lo: number = MAP_CAMERA.closest;
  let hi: number = FARTHEST;
  for (let k = 0; k < 40; k++) {
    const mid = (lo + hi) / 2;
    if (inside(mid)) hi = mid;
    else lo = mid;
  }
  const d = hi * MAP_CAMERA.margin;
  fits.set(key, d);
  return d;
}
const fitsOf = new WeakMap<LevelPlan, Map<number, number>>();

/**
 * La Carte au plus grand texte (GD-20, « La Carte au plus grand texte », directeur artistique) : si un lieu ouvert n'a
 * pas la place de son nom près de lui à l'ouverture, la vue de départ change, par pas de `step` (une part de la distance
 * de l'île entière), jusqu'à `most` fois plus loin ou plus près au plus : plus loin, l'île entière au milieu, puis les
 * lieux ouverts au milieu (l'île entière ramassée laisse autour d'eux la place de leurs noms) ; plus près, centrée sur
 * les lieux ouverts, qui s'écartent alors les uns des autres à l'écran (les étiquettes gardent leur taille).
 */
export const MAP_REFRAME = { step: 1.1, most: 2 } as const;

/**
 * La vue de départ de la Carte où `crowded` (ce qui manque à cette vue, pesé : les lieux ouverts sans leur nom près
 * d'eux ou hors de l'écran, puis, sur tablette, les noms tus des lieux fermés) s'annule : l'île entière d'abord, puis de
 * plus en plus loin de l'île entière, en reculant puis en s'approchant des lieux ouverts (`open`, leurs points au sol) ;
 * sinon celle qui le réduit le plus, la plus proche de l'île entière. Le texte normal, où chaque nom a déjà sa place,
 * garde l'île entière.
 */
export function reframeMap(plan: LevelPlan, aspect: number, open: readonly Vec2[], crowded: (v: MapView) => number): MapView {
  const start = mapStart(plan, aspect);
  let best = { view: start, count: crowded(start) };
  if (!best.count) return start;
  const xs = open.map((p) => p.x);
  const zs = open.map((p) => p.z);
  const toward = open.length ? { x: (Math.min(...xs) + Math.max(...xs)) / 2, z: (Math.min(...zs) + Math.max(...zs)) / 2 } : start;
  for (let k = MAP_REFRAME.step; k <= MAP_REFRAME.most * 1.0001; k *= MAP_REFRAME.step) {
    const farther = { x: start.x, z: start.z, distance: start.distance * k };
    const fartherOnOpen = { x: toward.x, z: toward.z, distance: start.distance * k };
    const closer = clampMap(plan, { x: toward.x, z: toward.z, distance: start.distance / k }, aspect);
    for (const view of [farther, fartherOnOpen, closer]) {
      const count = crowded(view);
      if (count < best.count) best = { view, count };
      if (!count) return view;
    }
  }
  return best.view;
}

/** La Carte à l'ouverture : l'île entière, au milieu de l'écran. */
export function mapStart(plan: LevelPlan, aspect: number): MapView {
  const box = islandBox(plan);
  return { x: (box.minX + box.maxX) / 2, z: (box.minZ + box.maxZ) / 2, distance: fitDistance(plan, aspect) };
}

/**
 * La pose garde l'île sous les yeux : la distance entre la plus proche et l'île entière (ou `farthest`, la Carte
 * reculée au plus grand texte, `reframeMap`), le point regardé dans l'île.
 */
export function clampMap(plan: LevelPlan, v: MapView, aspect: number, farthest = fitDistance(plan, aspect)): MapView {
  const distance = Math.min(Math.max(fitDistance(plan, aspect), farthest), Math.max(MAP_CAMERA.closest, v.distance));
  const box = islandBox(plan);
  return {
    x: Math.min(box.maxX, Math.max(box.minX, v.x)),
    z: Math.min(box.maxZ, Math.max(box.minZ, v.z)),
    distance,
  };
}

/** La Carte glissée : le point regardé déplacé de (`dx`, `dz`), dans ses limites. */
export function panMap(plan: LevelPlan, v: MapView, dx: number, dz: number, aspect: number, farthest?: number): MapView {
  return clampMap(plan, { x: v.x + dx, z: v.z + dz, distance: v.distance }, aspect, farthest);
}

/**
 * La Carte zoomée d'un facteur (`factor` > 1 rapproche), autour du point du sol `toward` (sous les doigts ou le
 * pointeur) : ce point reste où il est à l'écran, sauf aux limites.
 */
export function zoomMap(plan: LevelPlan, v: MapView, factor: number, toward: Vec2, aspect: number, farthest?: number): MapView {
  const want = clampMap(plan, { ...v, distance: v.distance / Math.max(0.01, factor) }, aspect, farthest).distance;
  const k = want / v.distance;
  return clampMap(plan, { x: toward.x + (v.x - toward.x) * k, z: toward.z + (v.z - toward.z) * k, distance: want }, aspect, farthest);
}

/** La pose de la caméra pour une pose de la Carte, remplie dans `out` s'il est donné. */
export function mapPose(v: MapView, out?: CameraPose): CameraPose {
  const pose = out ?? { position: { x: 0, y: 0, z: 0 }, target: { x: 0, y: 0, z: 0 }, fov: MAP_CAMERA.fov, lens: 0 };
  pose.target.x = v.x;
  pose.target.y = 0;
  pose.target.z = v.z;
  pose.position.x = v.x;
  pose.position.y = v.distance * Math.sin(MAP_CAMERA.pitch);
  pose.position.z = v.z + v.distance * Math.cos(MAP_CAMERA.pitch);
  pose.fov = MAP_CAMERA.fov;
  pose.lens = 0;
  return pose;
}

/**
 * Une étiquette de la Carte, à poser (pixels de l'écran) : Kéo (sa pastille et « Toi »), le nom d'un lieu ouvert (un
 * bouton), un lieu fermé (son cadenas, et son nom atténué dessous) ; son point à l'écran et sa taille mesurée (pour un
 * lieu fermé, avec son nom).
 */
export interface MapLabel {
  id: string;
  kind: 'keo' | 'open' | 'closed';
  x: number;
  y: number;
  w: number;
  h: number;
  /**
   * Posé avant les autres lieux ouverts (l'Escale, le lieu de départ, GD-20, lot 2 : elle garde sa pastille entière, les
   * autres se serrent d'abord ; au 4e, le lieu suggéré aussi, posé le tout premier, contre son point : consultant UX UI,
   * deuxième relecture du lot 1).
   */
  first?: boolean;
  /**
   * Un lieu du bas au pied d'un plateau (GD-22, le 5e) : son nom cherche d'abord sa place sous lui, puis au-dessus ; le
   * plateau, au nord, reste à découvert (consultant UX UI, relecture du lot 2 : le nom de la Montée masquait le plateau).
   */
  below?: boolean;
  /**
   * Un lieu dont le repère de loin est au sud, sur l'eau (les Radeaux, GD-22, lot 6) : son nom reste de son côté, au-dessus
   * de son point, plus haut, à droite ou à gauche, sinon à la place libre la plus proche au-dessus de son point, et
   * seulement en dernier recours ailleurs.
   */
  above?: boolean;
  /**
   * Un lieu dont le nom se pose d'abord à côté de son point, à gauche ou à droite (au 4e, le plan validé : l'Étalon, la
   * Manufacture, le Terminus, le Chariot), puis comme les autres.
   */
  side?: 'left' | 'right';
  /**
   * La taille de sa forme serrée, son nom sur deux lignes (entre deux mots), plus étroit, prise quand la forme entière ne
   * trouve pas de place : pour un lieu ouvert, sa pastille, l'icône de l'état dessous (relecture de L6b, directeur
   * artistique : un lieu ouvert ne perd jamais son nom) ; pour un lieu fermé, son cadenas et son nom sur deux lignes
   * (GD-20, « La Carte au plus grand texte » : sur tablette, le nom d'un lieu fermé passe sur deux lignes plutôt que de
   * se taire).
   */
  narrow?: { w: number; h: number };
  /** Kéo : sa taille « Toi » sous sa pastille (`toi: 'dessous'`), quand « Toi » ne tient ni à droite ni à gauche. */
  stacked?: { w: number; h: number };
  /** Un lieu d'une terre fermée (sa pastille pâle) : Kéo peut couvrir son nom, jamais celui d'un lieu ouvert. */
  pale?: true;
}

/** Sa place : le coin haut gauche, et si son nom se montre (un lieu fermé peut n'en garder que le cadenas). */
export interface MapLabelSpot {
  id: string;
  left: number;
  top: number;
  name: boolean;
  /**
   * Le décalage du nom d'un lieu fermé sous son cadenas, en pixels (vers la droite si positif) : il glisse pour rester
   * entier dans l'écran, à `MAP_LABEL_GAP` du bord, le cadenas restant sur son lieu (relecture de L6a, consultant UX UI :
   * « Les Marais salants » touchait le bord droit).
   */
  shift?: number;
  /**
   * Le nom d'un lieu fermé descendu sous son cadenas, en pixels, quand il toucherait sinon une étiquette posée juste
   * au-dessus (relecture de L6b : sur la tablette, le nom de la Turbine se taisait contre celui des Marais salants) ; de
   * `NEAR.reach` au plus, rien entre son cadenas et lui (GD-20, « La Carte au plus grand texte »).
   */
  drop?: number;
  /** Dans sa forme serrée, son nom sur deux lignes, plus étroit (un lieu ouvert ou fermé). */
  narrow?: true;
  /** Kéo : « Toi » à gauche de sa pastille, ou dessous ; à droite sans rien. */
  toi?: 'gauche' | 'dessous';
}

/**
 * Un nom sur deux lignes, coupé entre deux mots, jamais au milieu d'un mot ni après un article élidé (« L’Observatoire »
 * reste entier : consultant UX UI, relecture du lot 1 des « vraies terres »), à la coupure qui équilibre le mieux les
 * deux lignes (en lettres) ; un seul mot reste sur une ligne. La forme serrée d'une étiquette de la Carte (GD-20 : un
 * lieu n'a qu'un nom, il passe sur deux lignes).
 */
export function nameLines(name: string): readonly string[] {
  let best: { lines: [string, string]; longest: number } | undefined;
  for (let i = 1; i < name.length; i++) {
    if (name[i] !== ' ') continue;
    const lines: [string, string] = [name.slice(0, i).trimEnd(), name.slice(i + 1).trimStart()];
    if (!lines[0] || !lines[1]) continue;
    const longest = Math.max(lines[0].length, lines[1].length);
    if (!best || longest < best.longest) best = { lines, longest };
  }
  return best ? best.lines : [name];
}

/** Le cadenas d'un lieu fermé, en pixels, et l'écart gardé entre deux étiquettes (référent dys, consultant UX UI). */
export const MAP_LOCK = 40;
export const MAP_LABEL_GAP = 8;
/**
 * L'écart de plus gardé autour de « Retour » et « Lieux » : aucune étiquette à moins de 16 px d'eux en tout (relecture
 * de L9, consultant UX UI : « La Gare maritime » touchait presque « Retour »).
 */
export const MAP_BAR_ROOM = 8;
/** Un rectangle agrandi de `room` pixels de chaque côté. */
export const grown = (r: Rect, room: number): Rect => ({ left: r.left - room, top: r.top - room, right: r.right + room, bottom: r.bottom + room });
/** La pastille de Kéo seule, en pixels (sans « Toi »). */
export const MAP_KEO_DISC = 44;
/** Un lieu ouvert sans son nom, en dernier recours : sa pastille réduite à son icône, une cible carrée de 48 px. */
export const MAP_COMPACT = 48;
/** Les décalages verticaux essayés pour un nom qui en touche un autre, en demi-hauteurs d'étiquette. */
const SHIFTS = 3;


/**
 * Le pas et la portée de la recherche d'une place libre pour un nom autour de son lieu, en pixels : au-delà de 80 px
 * entre le lieu et le bord de son étiquette, le nom ne se lit plus comme celui du lieu (relecture du rivage sud,
 * consultant UX UI et référent dys : avec une spirale de 240 px, en texte normal à 667 × 375, des noms erraient loin de
 * leur lieu) ; il prend sa forme serrée, ou se tait pour un lieu fermé.
 */
const NEAR = { step: 16, reach: 80 } as const;

/**
 * Au 4e, l'écart des étiquettes aux bords de l'écran (consultant UX UI, deuxième relecture du lot 1 : au plus grand
 * texte, « Les Roches » et « La Veillée » touchaient le bord gauche).
 */
export const MAP_EDGE_4E = 16;

/** Au 4e, un nom de lieu ouvert plus loin que tant de pixels de son point y est relié par un trait fin (`mapLeader`). */
export const MAP_LEAD_FROM = 24;

/**
 * Le trait fin d'un nom loin de son lieu (au 4e) : du point du lieu au plus proche point de la pastille, ou rien si elle
 * en est à `MAP_LEAD_FROM` au plus.
 */
export function mapLeader(p: { x: number; y: number }, r: Rect): { x1: number; y1: number; x2: number; y2: number } | null {
  if (gapTo(p, r) <= MAP_LEAD_FROM) return null;
  return { x1: p.x, y1: p.y, x2: Math.min(Math.max(p.x, r.left), r.right), y2: Math.min(Math.max(p.y, r.top), r.bottom) };
}

/** L'écart entre le nom d'un lieu fermé posé au-dessus de son cadenas et ce cadenas, en pixels. */
const RISE_GAP = 4;
/**
 * L'écart, en pixels, qu'un nom posé au-dessus de son cadenas garde au moins avec tout autre cadenas (troisième passe de
 * L9, directeur artistique : un cadenas et un écart ; plus près, le nom pourrait être celui de l'autre cadenas).
 */
const RISE_CLEAR = 40;

/**
 * Les pas dont le nom d'un lieu fermé peut descendre sous son cadenas, en pixels : d'un écart à la fois, jusqu'à
 * `NEAR.reach` (GD-20, « La Carte au plus grand texte », directeur artistique : « descendre de plus d'un pas, dans les
 * 80 px » ; au-dessus de son cadenas en dernier recours seulement, relecture de L9).
 */
const NAME_DROPS = Array.from({ length: NEAR.reach / MAP_LABEL_GAP + 1 }, (_, i) => i * MAP_LABEL_GAP);

/** L'écart entre deux rectangles, en pixels (0 s'ils se touchent). */
const rectGap = (a: Rect, b: Rect) => Math.hypot(Math.max(a.left - b.right, 0, b.left - a.right), Math.max(a.top - b.bottom, 0, b.top - a.bottom));

/** L'écart entre un point et un rectangle, en pixels (0 dedans). */
const gapTo = (p: { x: number; y: number }, r: Rect) => Math.hypot(Math.max(r.left - p.x, 0, p.x - r.right), Math.max(r.top - p.y, 0, p.y - r.bottom));

/**
 * La place libre (`ok`) d'une étiquette de taille `w` × `h` la plus proche du point `p`, à `reach` au plus de lui
 * (`NEAR.reach` d'habitude ; une grille au pas de 16 px), ou rien.
 */
function near(p: { x: number; y: number }, w: number, h: number, ok: (c: Rect) => boolean, reach: number = NEAR.reach): Rect | undefined {
  let best: { r: Rect; d: number; c: number } | undefined;
  for (let top = p.y - reach - h; top <= p.y + reach; top += NEAR.step)
    for (let left = p.x - reach - w; left <= p.x + reach; left += NEAR.step) {
      const r = rect(left, top, w, h);
      const d = gapTo(p, r);
      if (d > reach) continue;
      // À écart égal, la plus centrée sur son lieu.
      const c = Math.hypot(left + w / 2 - p.x, top + h / 2 - p.y);
      if (best && (d > best.d || (d === best.d && c >= best.c))) continue;
      if (ok(r)) best = { r, d, c };
    }
  return best?.r;
}

/**
 * La place la plus proche du point de `l`, sur une grille de l'écran entier `screen` (au pas de `NEAR`), où `ok`
 * accepte une étiquette de taille `size`. Rien sur un écran sans taille.
 */
function anywhere(screen: { width: number; height: number }, l: { x: number; y: number }, size: { w: number; h: number }, ok: (c: Rect) => boolean): Rect | undefined {
  if (!Number.isFinite(screen.width) || !Number.isFinite(screen.height)) return undefined;
  let best: { r: Rect; d: number } | undefined;
  for (let top = 0; top + size.h <= screen.height; top += NEAR.step)
    for (let left = 0; left + size.w <= screen.width; left += NEAR.step) {
      const r = rect(left, top, size.w, size.h);
      if (!ok(r)) continue;
      const d = Math.hypot(left + size.w / 2 - l.x, top + size.h / 2 - l.y);
      if (!best || d < best.d) best = { r, d };
    }
  return best?.r;
}

/** Un rectangle de l'écran, en pixels. */
export interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}
const rect = (left: number, top: number, w: number, h: number): Rect => ({ left, top, right: left + w, bottom: top + h });
/** Deux rectangles qui se recouvrent (sans écart gardé). */
const cross = (a: Rect, b: Rect) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
const clash = (a: Rect, b: Rect) =>
  a.left < b.right + MAP_LABEL_GAP && b.left < a.right + MAP_LABEL_GAP && a.top < b.bottom + MAP_LABEL_GAP && b.top < a.bottom + MAP_LABEL_GAP;

/** Une place du nom d'un lieu fermé : son décalage de côté, sa descente, sa forme (0 entière, 1 serrée), son rectangle. */
interface ClosedPlace {
  k: number;
  drop: number;
  form: number;
  r: Rect;
}

/**
 * Le nombre de poses refaites, au plus, pour rendre son nom à un lieu fermé tu (la reprise de `layoutMapLabels`) : les
 * six descentes de deux formes d'un nom, ou de deux noms d'une forme, sans que la pose des étiquettes coûte plus de
 * quelques millisecondes quand la Carte glisse (mesuré sous Node : 0,7 ms en texte normal sur la tablette, avec la
 * reprise, au lieu de 0,2 ms).
 */
const REPAIR_TRIES = 12;

/**
 * Pose les étiquettes de la Carte sans qu'aucune en recouvre une autre (au moins `MAP_LABEL_GAP` entre elles), ni les
 * boutons de la page (`obstacles`) : d'abord les cadenas, à leur place ; puis le nom de chaque lieu ouvert (celui
 * qui passe en premier, `first`, d'abord), au-dessus de son point, sinon dessous, sinon décalé vers le haut ou vers le
 * bas (une demi-hauteur, puis une autre), sinon à droite ou à gauche, sinon à la place libre la plus proche à
 * `NEAR.reach` au plus, dans l'écran, chaque fois d'abord hors de la place du nom d'un lieu fermé, sous son cadenas (un
 * cadenas ne coiffe jamais le nom d'un lieu ouvert) ; s'il ne trouve toujours pas de place, dans sa pastille serrée
 * (`narrow` : son nom sur deux lignes, plus étroit), de la même façon.
 * Seulement si aucune place près de son lieu ne le laisse sans toucher une autre étiquette (au plus grand texte, sur un
 * téléphone), sa pastille se réduit à son icône (`name: false`, le nom et l'état restent dits par le bouton) : jamais un
 * nom posé sur un autre, ni loin de son lieu (GD-20, « La Carte au plus grand texte » : la portée au-delà de 80 px est
 * refusée).
 * Enfin le nom de chaque lieu fermé, sous son cadenas, glissé de côté au besoin (le cadenas toujours au-dessus de lui),
 * descendu jusqu'à `NEAR.reach`, puis sur deux lignes (`narrow`), se tait s'il gêne encore (le cadenas reste ; son
 * toucher ouvre la fiche du lieu fermé). Le nom d'un lieu ouvert, près de son lieu, passe avant celui d'un lieu
 * fermé (directeur artistique) ; mais si les noms ouverts peuvent se poser autrement, tous près de leur lieu, en laissant
 * au lieu fermé une place, la pose est refaite avec cette place gardée (`repair`, la reprise ; sur la tablette, en texte
 * normal, le nom de l'Imprimerie prenait la place de celui des Filets). Sans `repair` (les vues essayées de
 * `reframeMap`, qui ne comptent que les lieux ouverts), pas de reprise. Kéo vient en dernier, d'un côté fixe de son
 * point (dessous), sans jamais déplacer un nom, sa pastille à sa taille au plus de son point : « Toi » quitte à couvrir
 * le nom pâle d'un lieu fermé, sinon sa pastille seule, jamais sur le nom d'un voisin.
 * Sur la Carte serrée (`snug`, au 4e et au 3e ; retouche 1 du lot 1 du 3e) : la pastille de Kéo prend sa place après les
 * noms des lieux ouverts et avant les autres, qui l'évitent comme un obstacle ; « Toi » ne couvre jamais une étiquette, pas même un nom pâle, sinon la pastille seule ; le
 * lieu suggéré garde son nom sur une ligne ; les noms pâles se posent après le nom de leur terre, sous son cadenas.
 */
export function layoutMapLabels(
  labels: readonly MapLabel[],
  obstacles: readonly Rect[] = [],
  screen = { width: Infinity, height: Infinity },
  repair = true,
  edge = 0,
  snug = false,
): MapLabelSpot[] {
  const run = (reserved: ReadonlyMap<string, ClosedPlace>) => attemptLayout(labels, obstacles, screen, reserved, edge, snug);
  let best = run(new Map());
  if (!repair) return best.spots;
  let tries = REPAIR_TRIES;
  // Chaque nom tu a sa part des essais : les premiers (en haut de l'écran) ne les prennent pas tous (relecture de L9 : la
  // Vigie et l'Imprimerie, tues au nord, épuisaient les essais avant la Mangrove, qui avait une place).
  const share = Math.max(1, Math.floor(REPAIR_TRIES / Math.max(1, best.mute.length)));
  for (const id of best.mute) {
    let mine = share;
    for (const place of best.room(id)) {
      if (mine-- <= 0) break;
      if (tries-- <= 0) return best.spots;
      const next = run(new Map(best.reserved).set(id, place));
      // Aucun nom de lieu ouvert perdu (chacun, pas seulement leur nombre : un nom ouvert ne s'échange pas contre un
      // autre), un nom de lieu fermé de plus.
      if ([...best.namedOpen].every((named) => next.namedOpen.has(named)) && next.closedNamed > best.closedNamed) {
        best = next;
        break;
      }
    }
  }
  return best.spots;
}

function attemptLayout(
  labels: readonly MapLabel[],
  obstacles: readonly Rect[],
  screen: { width: number; height: number },
  reserved: ReadonlyMap<string, ClosedPlace>,
  border = 0,
  snug = false,
) {
  // À `border` pixels des bords au moins (au 4e, `MAP_EDGE_4E` ; 0 ailleurs, l'écran entier).
  const onScreen = (r: Rect) => r.left >= border && r.top >= border && r.right <= screen.width - border && r.bottom <= screen.height - border;
  // Les boutons de la page (« Retour », les réglages) d'abord : aucune étiquette ne passe dessous.
  // Les boutons n'ont pas d'identifiant (`null`) : une étiquette ne s'en exclut jamais (avant, l'identifiant vide des
  // boutons était aussi celui de « personne », et les étiquettes passaient sous la colonne).
  const placed: { id: string | null; r: Rect }[] = obstacles.map((r) => ({ id: null, r }));
  const out = new Map<string, MapLabelSpot>();
  const free = (r: Rect, self?: string) => !placed.some((p) => (p.id === null || p.id !== self) && clash(p.r, r));
  // Les cadenas, à leur place.
  const lockOf = new Map(labels.filter((l) => l.kind === 'closed').map((l) => [l.id, rect(l.x - MAP_LOCK / 2, l.y - MAP_LOCK, MAP_LOCK, MAP_LOCK)]));
  for (const l of labels) {
    if (l.kind === 'closed') {
      // Le cadenas au-dessus du point ; l'élément est centré sur lui, aussi large que son nom.
      placed.push({ id: l.id, r: rect(l.x - MAP_LOCK / 2, l.y - MAP_LOCK, MAP_LOCK, MAP_LOCK) });
      out.set(l.id, { id: l.id, left: l.x - Math.max(MAP_LOCK, l.w) / 2, top: l.y - MAP_LOCK, name: false });
    }
  }
  // Les boutons et les cadenas : Kéo ne passe jamais dessus, même tout serré.
  const hard = placed.length;
  // Les places gardées aux noms de lieux fermés (la reprise) : aucun nom de lieu ouvert n'y va.
  for (const [id, p] of reserved) placed.push({ id, r: p.r });
  // Ce qui reste en place quoi qu'il arrive aux noms des lieux ouverts : les boutons, les cadenas, les places gardées.
  const fixed = placed.length;
  const clear = (c: Rect) => onScreen(c) && free(c);
  // La place du nom de chaque lieu fermé, sous son cadenas : un nom de lieu ouvert n'y va qu'en dernier recours, sans
  // quoi le cadenas se lirait comme le sien (relecture de L6a, directeur artistique : le cadenas des Écluses posé sur
  // « La Turbine ✓ »).
  const closedNames = labels
    .filter((l) => l.kind === 'closed')
    .map((l) => reserved.get(l.id)?.r ?? rect(l.x - Math.max(MAP_LOCK, l.w) / 2, l.y, Math.max(MAP_LOCK, l.w), Math.max(MAP_LOCK, l.h - MAP_LOCK)));
  const apart = (c: Rect) => clear(c) && !closedNames.some((n) => clash(n, c));
  // Avec des places gardées, les lieux ouverts les plus proches d'elles d'abord : ils ont le moins de places autour.
  const pressed = (l: MapLabel) => Math.min(Infinity, ...[...reserved.values()].map((p) => gapTo(l, p.r)));
  const open = labels
    .filter((l) => l.kind === 'open' && l.first)
    .concat(labels.filter((l) => l.kind === 'open' && !l.first).sort((a, b) => (reserved.size ? pressed(a) - pressed(b) : 0)));
  const namedOpen = new Set<string>();
  const layOpen = (l: MapLabel) => {
    const places = (w: number, h: number) => {
      const above = rect(l.x - w / 2, l.y - h, w, h);
      const below = rect(l.x - w / 2, l.y + MAP_LABEL_GAP, w, h);
      const sides = [rect(l.x + MAP_LABEL_GAP, l.y - h / 2, w, h), rect(l.x - MAP_LABEL_GAP - w, l.y - h / 2, w, h)];
      if (l.above) {
        // De son côté seulement : au-dessus, plus haut, à droite, à gauche ; sinon la place libre la plus proche au-dessus de
        // son point, puis, en dernier, où que ce soit (`find`).
        const list = [above];
        for (let k = 1; k <= SHIFTS; k++) list.push(rect(above.left, above.top - (k * (h + MAP_LABEL_GAP)) / 2, w, h));
        list.push(...sides);
        return list;
      }
      const list = l.below ? [below, above] : [above, below];
      // Décalé vers un côté libre, en haut puis en bas (en bas puis en haut pour un lieu du bas), d'une demi-hauteur à la fois.
      for (let k = 1; k <= SHIFTS; k++) {
        const dy = (k * (h + MAP_LABEL_GAP)) / 2;
        const up = rect(above.left, above.top - dy, w, h);
        const down = rect(below.left, below.top + dy, w, h);
        list.push(...(l.below ? [down, up] : [up, down]));
      }
      // Le côté du plan validé d'abord (au 4e), essayé une seule fois : retiré des côtés de la fin.
      const own = l.side ? sides[l.side === 'right' ? 0 : 1] : undefined;
      if (own) list.unshift(own);
      list.push(...sides.filter((c) => c !== own));
      return list;
    };
    const full = places(l.w, l.h);
    // Le lieu suggéré de la Carte serrée garde son nom sur une ligne (consultant UX UI, relecture du lot 1 du 3e : deux
    // lignes, jamais sur le prochain lieu).
    const tight = l.narrow && !(snug && l.first && l.id !== 'port') ? places(l.narrow.w, l.narrow.h) : [];
    // Sinon, la place libre la plus proche du lieu, à `NEAR.reach` au plus ; d'abord hors de la place du nom d'un lieu
    // fermé, même un peu plus loin de son point (sur la tablette, toutes les places simples de la Turbine touchaient
    // celle des Écluses, et le nom revenait sous leur cadenas). Une place simple trop loin de son lieu (un décalage d'une
    // grande étiquette) ne compte pas.
    const find = (list: Rect[], ok: (c: Rect) => boolean) => {
      if (!list.length) return undefined;
      const w = list[0].right - list[0].left,
        h = list[0].bottom - list[0].top;
      return list.find((c) => gapTo(l, c) <= NEAR.reach && ok(c)) ?? (l.above ? near(l, w, h, (c) => c.bottom <= l.y && ok(c)) : undefined) ?? near(l, w, h, ok);
    };
    let r = find(full, apart) ?? find(full, clear);
    let narrow = false;
    if (!r) {
      // La pastille serrée : son nom sur deux lignes, plus étroit, aux mêmes places.
      r = find(tight, apart) ?? find(tight, clear);
      narrow = Boolean(r);
    }
    let name = true;
    if (!r) {
      // Nulle part à `NEAR.reach` de son lieu sans toucher une autre étiquette (au plus grand texte, sur un téléphone) :
      // sa pastille réduite à son icône, plutôt qu'un nom posé sur un autre ou loin de son lieu (GD-20, « La Carte au plus
      // grand texte », directeur artistique : une portée au-delà de 80 px est refusée, un nom loin de son lieu ne s'y
      // rattache plus) ; le nom et l'état restent dits par le bouton. Un écart consigné dans GD-20.
      narrow = false;
      name = false;
      const small = places(MAP_COMPACT, MAP_COMPACT);
      r = small.find(clear) ?? near(l, MAP_COMPACT, MAP_COMPACT, clear) ?? anywhere(screen, l, { w: MAP_COMPACT, h: MAP_COMPACT }, clear);
      if (!r) {
        // Au pire, il peut toucher une autre étiquette, jamais un bouton de la page.
        const off = (c: Rect) => onScreen(c) && !obstacles.some((o) => clash(o, c));
        r = small.find(off) ?? near(l, MAP_COMPACT, MAP_COMPACT, off) ?? small[0];
      }
    } else namedOpen.add(l.id);
    placed.push({ id: l.id, r });
    out.set(l.id, { id: l.id, left: r.left, top: r.top, name, ...(narrow ? { narrow: true as const } : {}) });
  };
  // Sur la Carte serrée, les noms pâles (les lieux d'une terre fermée) après le nom de leur terre, sous son cadenas
  // (consultant d'Archipéo, relecture du lot 1 du 3e : « Les Alpages » se taisait derrière les noms de ses lieux).
  for (const l of open) if (!snug || !l.pale) layOpen(l);
  // La Carte serrée (`snug`, au 4e et au 3e ; retouche 1 du lot 1 du 3e, consultant UX UI et référent dys : au téléphone,
  // au plus grand texte, « Toi » cachait « Le Kiosque ») : la pastille de Kéo prend sa place après les noms des lieux
  // ouverts (elle s'efface devant eux), sans rien couvrir, et avant les noms des terres fermées et des lieux pâles, qui
  // l'évitent comme un obstacle de plus.
  const keoDisc = new Map<string, Rect>();
  if (snug)
    for (const l of labels) {
      if (l.kind !== 'keo') continue;
      const at = (top: number) => rect(l.x - MAP_KEO_DISC / 2, top, MAP_KEO_DISC, l.h);
      const ok = (r: Rect) => onScreen(r) && free(r);
      const r = [at(l.y), at(l.y - l.h)].find(ok) ?? near(l, MAP_KEO_DISC, l.h, ok, MAP_KEO_DISC) ?? near(l, MAP_KEO_DISC, l.h, ok) ?? at(l.y);
      keoDisc.set(l.id, r);
      placed.push({ id: l.id, r });
    }
  /**
   * Les places du nom d'un lieu fermé, dans l'ordre : sa forme entière, son nom sur une ligne, puis sa forme serrée, son
   * nom sur deux lignes (GD-20, « La Carte au plus grand texte » : sur tablette, « Les Marais salants » fermés se taisaient
   * plutôt que de passer sur deux lignes) ; chaque fois sous son cadenas, glissé pour rester entier dans l'écran, à un
   * écart du bord ; puis, s'il gêne, de côté, d'un pas à la fois, tant que son cadenas reste au-dessus de lui (sur la
   * tablette, le nom de la Turbine se taisait contre une étiquette voisine : relecture de L6b, directeur artistique), et
   * plus bas, d'un écart à la fois, jusqu'à `NEAR.reach`. En dernier recours, le nom d'un lieu fermé passe juste au-dessus
   * de son cadenas, seulement si aucun autre cadenas n'est à moins de 40 px du nom (`RISE_CLEAR`) ; sinon il se tait
   * (relecture de L9, directeur artistique : « Les Balises » fermées se taisaient, « Toi » et la Gare sous leur cadenas,
   * alors que la mer intérieure, au-dessus, était libre ; troisième passe : au-dessus d'un groupe de cadenas, on ne sait
   * plus lequel est le sien).
   */
  const closedPlaces = (l: MapLabel) => {
    const forms = [{ w: l.w, h: l.h }, ...(l.narrow ? [l.narrow] : [])];
    const list: ClosedPlace[] = [];
    const rises: ClosedPlace[] = [];
    forms.forEach(({ w, h }, form) => {
      const left = l.x - w / 2;
      const margin = Math.max(MAP_LABEL_GAP, border);
      const over = left + w - (screen.width - margin);
      const under = margin - left;
      const edge = under > 0 ? under : over > 0 ? -over : 0;
      const shifts = [edge];
      for (let d = NEAR.step; d <= w; d += NEAR.step) shifts.push(edge - d, edge + d);
      const covers = (k: number) => k === edge || (left + k <= l.x - MAP_LOCK / 2 && left + k + w >= l.x + MAP_LOCK / 2);
      const nameH = Math.max(0, h - MAP_LOCK);
      // Au-dessus : le nom remonte de sa place sous le cadenas jusqu'au-dessus de lui, à un petit écart (`RISE_GAP`).
      const rise = -(MAP_LOCK + nameH + RISE_GAP);
      for (const drop of NAME_DROPS) for (const k of shifts) if (covers(k)) list.push({ k, drop, form, r: rect(left + k, l.y + drop, w, nameH) });
      rises.push(...shifts.filter(covers).map((k) => ({ k, drop: rise, form, r: rect(left + k, l.y + rise, w, nameH) })));
    });
    // Au-dessus de son cadenas en dernier, avant de se taire : dessous, sa place reste la première (GD-20).
    return [...list, ...rises];
  };
  // Une place libre pour le nom d'un lieu fermé, parmi les étiquettes de `among` : dans l'écran, à un écart des autres
  // étiquettes, et rien entre son cadenas et lui (un nom descendu ne se lit comme le sien que si rien ne passe entre eux).
  const fits = (l: MapLabel, { drop, r }: ClosedPlace, among: readonly { id: string | null; r: Rect }[]) => {
    if (!onScreen(r) || among.some((p) => (p.id === null || p.id !== l.id) && clash(p.r, r))) return false;
    // Au-dessus de son cadenas, collé à lui : rien ne peut passer entre eux ; aucun autre cadenas à moins de `RISE_CLEAR`.
    if (drop < 0) {
      for (const [id, k] of lockOf) if (id !== l.id && rectGap(k, r) < RISE_CLEAR) return false;
      return true;
    }
    if (drop === 0) return true;
    const strip = rect(l.x - MAP_LOCK / 2, l.y, MAP_LOCK, drop);
    return !among.some((p) => p.id !== l.id && cross(p.r, strip));
  };
  // Les noms des lieux fermés, du haut de l'écran vers le bas : un nom qui toucherait celui du dessus descend.
  const closed = labels.filter((l) => l.kind === 'closed').sort((a, b) => a.y - b.y);
  const mute: string[] = [];
  let closedNamed = 0;
  for (const l of closed) {
    const kept = reserved.get(l.id);
    const spot = kept && fits(l, kept, placed) ? kept : closedPlaces(l).find((c) => fits(l, c, placed));
    // Ni entier ni sur deux lignes : il se tait (le cadenas reste ; son toucher ouvre la fiche du lieu fermé).
    if (!spot) {
      mute.push(l.id);
      continue;
    }
    closedNamed++;
    placed.push({ id: l.id, r: spot.r });
    const o = out.get(l.id)!;
    o.name = true;
    if (spot.k) o.shift = spot.k;
    if (spot.drop) o.drop = spot.drop;
    if (spot.form) {
      o.narrow = true;
      o.left = l.x - Math.max(MAP_LOCK, l.narrow!.w) / 2;
    }
  }
  if (snug) for (const l of open) if (l.pale) layOpen(l);
  /**
   * Pour la reprise, les places du nom d'un lieu fermé tu que seuls d'autres noms occupent (libres des boutons, des
   * cadenas et des places déjà gardées) : la première de chaque descente de `NEAR.step`, dans chaque forme.
   */
  const room = (id: string) => {
    const l = labels.find((x) => x.id === id)!;
    const others = placed.slice(0, fixed);
    const seen = new Set<string>();
    return closedPlaces(l).filter((c) => {
      // Une descente sur deux (de `NEAR.step`) : la pose refaite ajuste le reste.
      if (c.drop > 0 && c.drop % NEAR.step) return false;
      const key = `${c.form} ${c.drop}`;
      if (seen.has(key) || !fits(l, c, others)) return false;
      seen.add(key);
      return true;
    });
  };
  // Kéo en dernier, d'un côté fixe de son point (consultant UX UI et référent dys, relecture du lot 13a, chantier de la
  // Carte) : sa pastille centrée sous lui, « Toi » à sa droite, sinon à sa gauche, sinon sous la pastille (seconde passe
  // du directeur artistique sur la retouche 1 des restes du 5e : « Toi » manquait aux Terrasses et aux Aiguilles en
  // attente) ; au-dessus seulement si le bas de l'écran l'empêche. Il ne déplace jamais un nom. Sa pastille reste près
  // de son point, à sa taille (`MAP_KEO_DISC`), au plus à `NEAR.reach` : plus loin, elle se lisait au lieu voisin, ou
  // passait une rive (relecture des restes du 5e : le disque à 160 px de l'Auberge, collé au Hameau ; aux Terrasses, de
  // l'autre côté du canal). « Toi » reste tant qu'il a une place près du point, quitte à couvrir le nom pâle d'un lieu
  // fermé (directeur artistique), ou une place libre un peu plus loin ; sinon sa pastille seule, libre, ou sur le nom
  // pâle d'un lieu fermé, puis à cheval sur le bord du nom de son propre lieu, puis dessus, jamais sur celui d'un
  // voisin ; au pire de son côté fixe.
  for (const l of labels) {
    if (l.kind !== 'keo') continue;
    const at = (w: number, top: number) => rect(l.x - MAP_KEO_DISC / 2, top, w, l.h);
    const below = onScreen(at(MAP_KEO_DISC, l.y)) || !onScreen(at(MAP_KEO_DISC, l.y - l.h));
    const [side, other] = below ? [l.y, l.y - l.h] : [l.y - l.h, l.y];
    // Les noms pâles (un lieu d'une terre fermée, le nom d'une terre sous son cadenas), que Kéo peut couvrir ; et le nom
    // de son lieu, le lieu ouvert le plus proche de son point.
    const pale = new Set(labels.filter((x) => x.kind === 'closed' || x.pale).map((x) => x.id));
    const own = labels
      .filter((x) => x.kind === 'open' && !x.pale && Math.hypot(x.x - l.x, x.y - l.y) <= NEAR.reach)
      .sort((a, b) => Math.hypot(a.x - l.x, a.y - l.y) - Math.hypot(b.x - l.x, b.y - l.y))[0]?.id;
    const ownBox = placed.find((p) => own !== undefined && p.id === own)?.r;
    // Hors des boutons et des cadenas toujours (les `hard` premiers), hors des autres étiquettes sauf celles que `spare` épargne.
    const avoid = (spare: (id: string) => boolean) => (r: Rect) => onScreen(r) && !placed.some((p, i) => (i < hard || p.id === null || !spare(p.id)) && clash(p.r, r));
    const ok = avoid(() => false);
    const over = avoid((id) => pale.has(id));
    // Sur le nom de son lieu : à cheval sur son bord d'abord (le centre de la pastille hors de lui), puis où que ce soit.
    const mine = avoid((id) => pale.has(id) || id === own);
    const edge = (r: Rect) => {
      const cx = (r.left + r.right) / 2,
        cy = (r.top + r.bottom) / 2;
      return mine(r) && !(ownBox && cx > ownBox.left && cx < ownBox.right && cy > ownBox.top && cy < ownBox.bottom);
    };
    // D'un côté fixe, puis de l'autre, puis la place la plus proche, la pastille à `reach` au plus de son point.
    const fixed = (w: number) => [at(w, side), at(w, other)];
    const nearBy = (w: number, test: (r: Rect) => boolean, reach: number = MAP_KEO_DISC) => near(l, w, l.h, (r) => gapTo(l, rect(r.left, r.top, MAP_KEO_DISC, l.h)) <= reach && test(r), reach);
    const find = (w: number, test: (r: Rect) => boolean, reach: number = MAP_KEO_DISC) => fixed(w).find(test) ?? nearBy(w, test, reach);
    // « Toi » à droite de la pastille, sinon à sa gauche (la pastille au bout droit), sinon dessous (l'étiquette centrée
    // sur la pastille, en haut ; `stacked`, mesurée) : d'abord la pastille sur son point, puis à sa taille au plus de lui.
    const st = l.stacked;
    type Form = { toi?: 'gauche' | 'dessous'; fixed: Rect[]; near: (test: (r: Rect) => boolean, reach: number) => Rect | undefined };
    const forms: Form[] = [
      { fixed: fixed(l.w), near: (test, reach) => nearBy(l.w, test, reach) },
      {
        toi: 'gauche',
        fixed: [side, other].map((top) => rect(l.x + MAP_KEO_DISC / 2 - l.w, top, l.w, l.h)),
        near: (test, reach) => near(l, l.w, l.h, (r) => gapTo(l, rect(r.right - MAP_KEO_DISC, r.top, MAP_KEO_DISC, l.h)) <= reach && test(r), reach),
      },
      ...(st
        ? [
            {
              toi: 'dessous' as const,
              fixed: [l.y, l.y - st.h].map((top) => rect(l.x - st.w / 2, top, st.w, st.h)),
              near: (test: (r: Rect) => boolean, reach: number) =>
                near(l, st.w, st.h, (r) => gapTo(l, rect(r.left + st.w / 2 - MAP_KEO_DISC / 2, r.top, MAP_KEO_DISC, MAP_KEO_DISC)) <= reach && test(r), reach),
            },
          ]
        : []),
    ];
    const findToi = (test: (r: Rect) => boolean, reach: number): { r: Rect; toi?: 'gauche' | 'dessous' } | undefined => {
      for (const f of forms) {
        const r = f.fixed.find(test);
        if (r) return { r, toi: f.toi };
      }
      for (const f of forms) {
        const r = f.near(test, reach);
        if (r) return { r, toi: f.toi };
      }
      return undefined;
    };
    // Près du point d'abord (la pastille à sa taille au plus), puis, sur une place libre seulement, à `NEAR.reach` au plus,
    // comme la pastille seule : plus loin, sur un nom pâle, Kéo se lisait au lieu fermé qu'il couvrait.
    // Sur la Carte serrée, sa pastille a déjà sa place (`keoDisc`) : « Toi » seulement s'il ne couvre rien, pas même un
    // nom pâle ; sinon la pastille seule, à sa place gardée (son icône et son nom dit suffisent).
    const kept = keoDisc.get(l.id);
    if (kept) {
      const self = avoid((id) => id === l.id);
      const toi = findToi(self, MAP_KEO_DISC) ?? findToi(self, NEAR.reach);
      const spot = toi ? { r: toi.r, name: true, toi: toi.toi } : { r: kept, name: false, toi: undefined };
      placed.push({ id: l.id, r: spot.r });
      out.set(l.id, { id: l.id, left: spot.r.left, top: spot.r.top, name: spot.name, ...(spot.toi ? { toi: spot.toi } : {}) });
      continue;
    }
    const toi = findToi(ok, MAP_KEO_DISC) ?? findToi(over, MAP_KEO_DISC) ?? findToi(ok, NEAR.reach);
    const disc = () => find(MAP_KEO_DISC, ok) ?? find(MAP_KEO_DISC, over) ?? find(MAP_KEO_DISC, ok, NEAR.reach) ?? find(MAP_KEO_DISC, over, NEAR.reach) ?? find(MAP_KEO_DISC, edge) ?? find(MAP_KEO_DISC, mine);
    const spot = toi ? { r: toi.r, name: true, toi: toi.toi } : { r: disc() ?? at(MAP_KEO_DISC, side), name: false, toi: undefined };
    placed.push({ id: l.id, r: spot.r });
    out.set(l.id, { id: l.id, left: spot.r.left, top: spot.r.top, name: spot.name, ...(spot.toi ? { toi: spot.toi } : {}) });
  }
  return { spots: labels.map((l) => out.get(l.id)!), mute, namedOpen, closedNamed, reserved, room };
}
