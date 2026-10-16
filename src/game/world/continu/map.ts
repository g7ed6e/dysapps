// La Carte des lieux ouverts du monde continu (piste 1, lot 3, condition du consultant UX UI : « garder la Carte, lieux
// ouverts seulement ») : l'île vue de haut, nord en haut, qu'on fait glisser à un doigt et qu'on pince à deux (ou à la
// molette), comme la Carte du monde en grille (#331), sans boutons + ou −. Seuls les lieux ouverts se touchent ; un
// lieu encore sous la brume porte son cadenas. Rien n'est écrit dans la 3D : les noms des lieux sont des boutons de la
// page. Ici, la pose de la caméra et ses limites, sans Three.js ; la vue fait le reste (../../three/archipeo/scene.ts).
import { screenOf, type CameraPose } from './camera';
import type { Vec2 } from './geometry';
import { COAST } from './plan6e';

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

/** La boîte de l'île (le bord de son anneau de sable), en unités. */
export const ISLAND_BOX = (() => {
  const xs = COAST.map((p) => p.x);
  const zs = COAST.map((p) => p.z);
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minZ: Math.min(...zs), maxZ: Math.max(...zs) };
})();

/** La distance la plus lointaine qu'on cherche, en unités (bien au-delà de l'île entière). */
const FARTHEST = 4000;

/**
 * La distance où l'île entière tient dans un écran de rapport `aspect` (largeur sur hauteur), avec sa marge : les
 * quatre coins de sa boîte à l'écran, en perspective (le bord sud, plus proche, est plus grand), cherchée par
 * dichotomie. Le résultat ne dépend que du rapport : il est gardé.
 */
export function fitDistance(aspect: number): number {
  const key = Math.round(aspect * 1000);
  const known = fits.get(key);
  if (known !== undefined) return known;
  const h = 1000;
  const w = Math.max(0.1, aspect) * h;
  const { minX, maxX, minZ, maxZ } = ISLAND_BOX;
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
const fits = new Map<number, number>();

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
export function reframeMap(aspect: number, open: readonly Vec2[], crowded: (v: MapView) => number): MapView {
  const start = mapStart(aspect);
  let best = { view: start, count: crowded(start) };
  if (!best.count) return start;
  const xs = open.map((p) => p.x);
  const zs = open.map((p) => p.z);
  const toward = open.length ? { x: (Math.min(...xs) + Math.max(...xs)) / 2, z: (Math.min(...zs) + Math.max(...zs)) / 2 } : start;
  for (let k = MAP_REFRAME.step; k <= MAP_REFRAME.most * 1.0001; k *= MAP_REFRAME.step) {
    const farther = { x: start.x, z: start.z, distance: start.distance * k };
    const fartherOnOpen = { x: toward.x, z: toward.z, distance: start.distance * k };
    const closer = clampMap({ x: toward.x, z: toward.z, distance: start.distance / k }, aspect);
    for (const view of [farther, fartherOnOpen, closer]) {
      const count = crowded(view);
      if (count < best.count) best = { view, count };
      if (!count) return view;
    }
  }
  return best.view;
}

/** La Carte à l'ouverture : l'île entière, au milieu de l'écran. */
export function mapStart(aspect: number): MapView {
  return { x: (ISLAND_BOX.minX + ISLAND_BOX.maxX) / 2, z: (ISLAND_BOX.minZ + ISLAND_BOX.maxZ) / 2, distance: fitDistance(aspect) };
}

/**
 * La pose garde l'île sous les yeux : la distance entre la plus proche et l'île entière (ou `farthest`, la Carte
 * reculée au plus grand texte, `reframeMap`), le point regardé dans l'île.
 */
export function clampMap(v: MapView, aspect: number, farthest = fitDistance(aspect)): MapView {
  const distance = Math.min(Math.max(fitDistance(aspect), farthest), Math.max(MAP_CAMERA.closest, v.distance));
  return {
    x: Math.min(ISLAND_BOX.maxX, Math.max(ISLAND_BOX.minX, v.x)),
    z: Math.min(ISLAND_BOX.maxZ, Math.max(ISLAND_BOX.minZ, v.z)),
    distance,
  };
}

/** La Carte glissée : le point regardé déplacé de (`dx`, `dz`), dans ses limites. */
export function panMap(v: MapView, dx: number, dz: number, aspect: number, farthest?: number): MapView {
  return clampMap({ x: v.x + dx, z: v.z + dz, distance: v.distance }, aspect, farthest);
}

/**
 * La Carte zoomée d'un facteur (`factor` > 1 rapproche), autour du point du sol `toward` (sous les doigts ou le
 * pointeur) : ce point reste où il est à l'écran, sauf aux limites.
 */
export function zoomMap(v: MapView, factor: number, toward: Vec2, aspect: number, farthest?: number): MapView {
  const want = clampMap({ ...v, distance: v.distance / Math.max(0.01, factor) }, aspect, farthest).distance;
  const k = want / v.distance;
  return clampMap({ x: toward.x + (v.x - toward.x) * k, z: toward.z + (v.z - toward.z) * k, distance: want }, aspect, farthest);
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
   * autres se serrent d'abord).
   */
  first?: boolean;
  /**
   * La taille de sa forme serrée, son nom sur deux lignes (entre deux mots), plus étroit, prise quand la forme entière ne
   * trouve pas de place : pour un lieu ouvert, sa pastille, l'icône de l'état dessous (relecture de L6b, directeur
   * artistique : un lieu ouvert ne perd jamais son nom) ; pour un lieu fermé, son cadenas et son nom sur deux lignes
   * (GD-20, « La Carte au plus grand texte » : sur tablette, le nom d'un lieu fermé passe sur deux lignes plutôt que de
   * se taire).
   */
  narrow?: { w: number; h: number };
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
}

/**
 * Un nom sur deux lignes, coupé entre deux mots (ou après un article élidé : « L’ » / « Observatoire »), jamais au
 * milieu d'un mot, à la coupure qui équilibre le mieux les deux lignes (en lettres) ; un seul mot reste sur une ligne.
 * La forme serrée d'une étiquette de la Carte (GD-20 : un lieu n'a qu'un nom, il passe sur deux lignes).
 */
export function nameLines(name: string): readonly string[] {
  let best: { lines: [string, string]; longest: number } | undefined;
  for (let i = 1; i < name.length; i++) {
    const space = name[i] === ' ';
    const elided = name[i - 1] === '’' || name[i - 1] === "'";
    if (!space && !elided) continue;
    const lines: [string, string] = [name.slice(0, i).trimEnd(), name.slice(space ? i + 1 : i).trimStart()];
    if (!lines[0] || !lines[1]) continue;
    const longest = Math.max(lines[0].length, lines[1].length);
    if (!best || longest < best.longest) best = { lines, longest };
  }
  return best ? best.lines : [name];
}

/** Le cadenas d'un lieu fermé, en pixels, et l'écart gardé entre deux étiquettes (référent dys, consultant UX UI). */
export const MAP_LOCK = 40;
export const MAP_LABEL_GAP = 8;
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
 * Les pas dont le nom d'un lieu fermé peut descendre sous son cadenas, en pixels : d'un écart à la fois, jusqu'à
 * `NEAR.reach` (GD-20, « La Carte au plus grand texte », directeur artistique : « descendre de plus d'un pas, dans les
 * 80 px » ; jamais au-dessus de son cadenas, qu'il cacherait).
 */
const NAME_DROPS = Array.from({ length: NEAR.reach / MAP_LABEL_GAP + 1 }, (_, i) => i * MAP_LABEL_GAP);

/** L'écart entre un point et un rectangle, en pixels (0 dedans). */
const gapTo = (p: { x: number; y: number }, r: Rect) => Math.hypot(Math.max(r.left - p.x, 0, p.x - r.right), Math.max(r.top - p.y, 0, p.y - r.bottom));

/**
 * La place libre (`ok`) d'une étiquette de taille `w` × `h` la plus proche du point `p`, à `NEAR.reach` au plus de lui
 * (une grille au pas de 16 px), ou rien.
 */
function near(p: { x: number; y: number }, w: number, h: number, ok: (c: Rect) => boolean): Rect | undefined {
  let best: { r: Rect; d: number; c: number } | undefined;
  for (let top = p.y - NEAR.reach - h; top <= p.y + NEAR.reach; top += NEAR.step)
    for (let left = p.x - NEAR.reach - w; left <= p.x + NEAR.reach; left += NEAR.step) {
      const r = rect(left, top, w, h);
      const d = gapTo(p, r);
      if (d > NEAR.reach) continue;
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
 * boutons de la page (`obstacles`) : d'abord Kéo et les cadenas, à leur place ; puis le nom de chaque lieu ouvert (celui
 * qui passe en premier, `first`, d'abord), au-dessus de son point, sinon dessous, sinon décalé vers le haut ou vers le
 * bas (une demi-hauteur, puis une autre), sinon à droite ou à gauche, sinon à la place libre la plus proche à
 * `NEAR.reach` au plus, dans l'écran, chaque fois d'abord hors de la place du nom d'un lieu fermé, sous son cadenas (un
 * cadenas ne coiffe jamais le nom d'un lieu ouvert) ; s'il ne trouve toujours pas de place, dans sa pastille serrée
 * (`narrow` : son nom sur deux lignes, plus étroit), de la même façon ; puis, Kéo réduit à sa pastille, de nouveau.
 * Seulement si aucune place près de son lieu ne le laisse sans toucher une autre étiquette (au plus grand texte, sur un
 * téléphone), sa pastille se réduit à son icône (`name: false`, le nom et l'état restent dits par le bouton) : jamais un
 * nom posé sur un autre, ni loin de son lieu (GD-20, « La Carte au plus grand texte » : la portée au-delà de 80 px est
 * refusée).
 * Enfin le nom de chaque lieu fermé, sous son cadenas, glissé de côté au besoin (le cadenas toujours au-dessus de lui),
 * descendu jusqu'à `NEAR.reach`, puis sur deux lignes (`narrow`), se tait s'il gêne encore (le cadenas reste ; son
 * toucher dit « [Nom] : fermé pour l'instant »). Le nom d'un lieu ouvert, près de son lieu, passe avant celui d'un lieu
 * fermé (directeur artistique) ; mais si les noms ouverts peuvent se poser autrement, tous près de leur lieu, en laissant
 * au lieu fermé une place, la pose est refaite avec cette place gardée (`repair`, la reprise ; sur la tablette, en texte
 * normal, le nom de l'Imprimerie prenait la place de celui des Filets). Sans `repair` (les vues essayées de
 * `reframeMap`, qui ne comptent que les lieux ouverts), pas de reprise.
 */
export function layoutMapLabels(
  labels: readonly MapLabel[],
  obstacles: readonly Rect[] = [],
  screen = { width: Infinity, height: Infinity },
  repair = true,
): MapLabelSpot[] {
  const run = (reserved: ReadonlyMap<string, ClosedPlace>) => {
    const first = attemptLayout(labels, obstacles, screen, false, reserved);
    // Trop serré (Kéo devant son lieu, au plus grand texte) : Kéo garde sa pastille seule, sans « Toi », plutôt qu'un nom
    // de lieu ne passe sur une autre étiquette.
    return first.crowded ? attemptLayout(labels, obstacles, screen, true, reserved) : first;
  };
  let best = run(new Map());
  if (!repair) return best.spots;
  let tries = REPAIR_TRIES;
  for (const id of best.mute) {
    for (const place of best.room(id)) {
      if (tries-- <= 0) return best.spots;
      const next = run(new Map(best.reserved).set(id, place));
      // Aucun nom de lieu ouvert perdu (chacun, pas seulement leur nombre : un nom ouvert ne s'échange pas contre un
      // autre), un nom de lieu fermé de plus.
      if ([...best.namedOpen].every((id) => next.namedOpen.has(id)) && next.closedNamed > best.closedNamed) {
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
  compactKeo: boolean,
  reserved: ReadonlyMap<string, ClosedPlace>,
) {
  let crowded = false;
  const onScreen = (r: Rect) => r.left >= 0 && r.top >= 0 && r.right <= screen.width && r.bottom <= screen.height;
  // Les boutons de la page (« Retour », les réglages) d'abord : aucune étiquette ne passe dessous.
  // Les boutons n'ont pas d'identifiant (`null`) : une étiquette ne s'en exclut jamais (avant, l'identifiant vide des
  // boutons était aussi celui de « personne », et les étiquettes passaient sous la colonne).
  const placed: { id: string | null; r: Rect }[] = obstacles.map((r) => ({ id: null, r }));
  const out = new Map<string, MapLabelSpot>();
  const free = (r: Rect, self?: string) => !placed.some((p) => (p.id === null || p.id !== self) && clash(p.r, r));
  // Les cadenas, à leur place : Kéo s'en écarte d'au moins `MAP_LABEL_GAP` (relecture de L6a, consultant UX UI : sur
  // téléphone, « Toi » touchait le cadenas des Marais salants).
  const locks = labels.filter((l) => l.kind === 'closed').map((l) => rect(l.x - MAP_LOCK / 2, l.y - MAP_LOCK, MAP_LOCK, MAP_LOCK));
  for (const l of labels) {
    if (l.kind === 'keo') {
      const disc = rect(l.x - MAP_KEO_DISC / 2, l.y - l.h, MAP_KEO_DISC, l.h);
      const whole = rect(l.x - l.w / 2, l.y - l.h, l.w, l.h);
      // Sa pastille seule, sans « Toi », si le mot passerait contre un cadenas.
      const compact = compactKeo || locks.some((k) => clash(k, whole));
      const r = compact ? disc : whole;
      placed.push({ id: l.id, r });
      out.set(l.id, { id: l.id, left: r.left, top: r.top, name: !compact });
    } else if (l.kind === 'closed') {
      // Le cadenas au-dessus du point ; l'élément est centré sur lui, aussi large que son nom.
      placed.push({ id: l.id, r: rect(l.x - MAP_LOCK / 2, l.y - MAP_LOCK, MAP_LOCK, MAP_LOCK) });
      out.set(l.id, { id: l.id, left: l.x - Math.max(MAP_LOCK, l.w) / 2, top: l.y - MAP_LOCK, name: false });
    }
  }
  // Les places gardées aux noms de lieux fermés (la reprise) : aucun nom de lieu ouvert n'y va.
  for (const [id, p] of reserved) placed.push({ id, r: p.r });
  // Ce qui reste en place quoi qu'il arrive aux noms des lieux ouverts : les boutons, Kéo, les cadenas, les places gardées.
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
  for (const l of open) {
    const places = (w: number, h: number) => {
      const above = rect(l.x - w / 2, l.y - h, w, h);
      const below = rect(l.x - w / 2, l.y + MAP_LABEL_GAP, w, h);
      const list = [above, below];
      // Décalé vers un côté libre, en haut puis en bas, d'une demi-hauteur à la fois.
      for (let k = 1; k <= SHIFTS; k++) {
        const dy = (k * (h + MAP_LABEL_GAP)) / 2;
        list.push(rect(above.left, above.top - dy, w, h), rect(below.left, below.top + dy, w, h));
      }
      list.push(rect(l.x + MAP_LABEL_GAP, l.y - h / 2, w, h), rect(l.x - MAP_LABEL_GAP - w, l.y - h / 2, w, h));
      return list;
    };
    const full = places(l.w, l.h);
    const tight = l.narrow ? places(l.narrow.w, l.narrow.h) : [];
    // Sinon, la place libre la plus proche du lieu, à `NEAR.reach` au plus ; d'abord hors de la place du nom d'un lieu
    // fermé, même un peu plus loin de son point (sur la tablette, toutes les places simples de la Turbine touchaient
    // celle des Écluses, et le nom revenait sous leur cadenas). Une place simple trop loin de son lieu (un décalage d'une
    // grande étiquette) ne compte pas.
    const find = (list: Rect[], ok: (c: Rect) => boolean) =>
      list.length ? (list.find((c) => gapTo(l, c) <= NEAR.reach && ok(c)) ?? near(l, list[0].right - list[0].left, list[0].bottom - list[0].top, ok)) : undefined;
    let r = find(full, apart) ?? find(full, clear);
    let narrow = false;
    if (!r) {
      // La pastille serrée : son nom sur deux lignes, plus étroit, aux mêmes places.
      r = find(tight, apart) ?? find(tight, clear);
      narrow = Boolean(r);
    }
    // Trop serré près de son lieu : la deuxième passe (Kéo d'abord réduit à sa pastille) cherche de nouveau.
    if (!r) crowded = true;
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
  }
  /**
   * Les places du nom d'un lieu fermé, dans l'ordre : sa forme entière, son nom sur une ligne, puis sa forme serrée, son
   * nom sur deux lignes (GD-20, « La Carte au plus grand texte » : sur tablette, « Les Marais salants » fermés se taisaient
   * plutôt que de passer sur deux lignes) ; chaque fois sous son cadenas, glissé pour rester entier dans l'écran, à un
   * écart du bord ; puis, s'il gêne, de côté, d'un pas à la fois, tant que son cadenas reste au-dessus de lui (sur la
   * tablette, le nom de la Turbine se taisait contre une étiquette voisine : relecture de L6b, directeur artistique), et
   * plus bas, d'un écart à la fois, jusqu'à `NEAR.reach`.
   */
  const closedPlaces = (l: MapLabel) => {
    const forms = [{ w: l.w, h: l.h }, ...(l.narrow ? [l.narrow] : [])];
    const list: ClosedPlace[] = [];
    forms.forEach(({ w, h }, form) => {
      const left = l.x - w / 2;
      const over = left + w - (screen.width - MAP_LABEL_GAP);
      const under = MAP_LABEL_GAP - left;
      const edge = under > 0 ? under : over > 0 ? -over : 0;
      const shifts = [edge];
      for (let d = NEAR.step; d <= w; d += NEAR.step) shifts.push(edge - d, edge + d);
      const covers = (k: number) => k === edge || (left + k <= l.x - MAP_LOCK / 2 && left + k + w >= l.x + MAP_LOCK / 2);
      for (const drop of NAME_DROPS) for (const k of shifts) if (covers(k)) list.push({ k, drop, form, r: rect(left + k, l.y + drop, w, Math.max(0, h - MAP_LOCK)) });
    });
    return list;
  };
  // Une place libre pour le nom d'un lieu fermé, parmi les étiquettes de `among` : dans l'écran, à un écart des autres
  // étiquettes, et rien entre son cadenas et lui (un nom descendu ne se lit comme le sien que si rien ne passe entre eux).
  const fits = (l: MapLabel, { drop, r }: ClosedPlace, among: readonly { id: string | null; r: Rect }[]) => {
    if (!onScreen(r) || among.some((p) => (p.id === null || p.id !== l.id) && clash(p.r, r))) return false;
    if (!drop) return true;
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
    // Ni entier ni sur deux lignes : il se tait (le cadenas reste ; son toucher dit « [Nom] : fermé pour l'instant »).
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
  /**
   * Pour la reprise, les places du nom d'un lieu fermé tu que seuls d'autres noms occupent (libres des boutons, de Kéo,
   * des cadenas et des places déjà gardées) : la première de chaque descente de `NEAR.step`, dans chaque forme.
   */
  const room = (id: string) => {
    const l = labels.find((x) => x.id === id)!;
    const others = placed.slice(0, fixed);
    const seen = new Set<string>();
    return closedPlaces(l).filter((c) => {
      // Une descente sur deux (de `NEAR.step`) : la pose refaite ajuste le reste.
      if (c.drop % NEAR.step) return false;
      const key = `${c.form} ${c.drop}`;
      if (seen.has(key) || !fits(l, c, others)) return false;
      seen.add(key);
      return true;
    });
  };
  return { spots: labels.map((l) => out.get(l.id)!), crowded, mute, namedOpen, closedNamed, reserved, room };
}

/**
 * Les mots de « [Nom] : fermé pour l'instant », au toucher du cadenas d'un lieu fermé : écrits (`shown`) et dits par la
 * voix (`said`, rien : le mot écrit). Sur téléphone au plus grand texte (`short`), le mot court « [Nom] : fermé », sur
 * deux lignes au plus, posé sur les lieux fermés ; la voix garde la phrase entière du bouton, « [Nom] : sous la brume,
 * fermé pour l'instant » (GD-20, décision du directeur artistique du 16 octobre 2026 : le mot long cachait « Le Phare »
 * et « L'Escale » à 667 × 375, le Chantier naval à 844 × 390). Ailleurs, rien ne change.
 */
export function closedNoteText(name: string, short: boolean): { shown: string; said?: string } {
  // Espace insécable avant les deux-points : la ligne ne commence jamais par « : ».
  if (!short) return { shown: `${name}\u00a0: fermé pour l’instant` };
  return { shown: `${name}\u00a0: fermé`, said: `${name} : sous la brume, fermé pour l’instant` };
}

/**
 * Une forme mesurée de « [Nom] : fermé pour l'instant » : la large, qui se pose près du cadenas, ou une bande (`band`),
 * plus large et plus basse (deux ou trois lignes), le long du bas ou du haut de l'écran seulement.
 */
export interface NoteSize {
  w: number;
  h: number;
  band?: boolean;
}

/**
 * La place de « [Nom] : fermé pour l'instant », au toucher du cadenas d'un lieu fermé (GD-20, « La Carte au plus grand
 * texte », directeur artistique et consultant UX UI : il ne réserve plus de place à gauche, il s'écrit près du cadenas
 * touché, ou sur une bande en bas ou en haut de l'écran, seulement après le toucher). Les places, dans l'ordre : sous le
 * cadenas (sur le nom du lieu, qu'il redit), au-dessus, à droite, à gauche, dans une forme non `band` ; puis chaque bande,
 * la plus large d'abord (au plus grand texte sur un téléphone, il tient sur deux ou trois lignes, jamais dans une colonne
 * étroite de cinq : relecture du consultant UX UI), le long du bas de l'écran, puis du haut, du milieu vers les bords ;
 * puis, en dernier recours, la forme large, puis les bandes, n'importe où. Toujours entier dans l'écran, à un écart du bord ; la première place qui ne touche ni
 * `avoid` (les boutons de la page), ni `keep` (« Retour » et la pastille « Toi »), ni `names` (les pastilles des lieux
 * ouverts) ; sinon, hors des boutons (qui passeraient au-dessus du mot), celle qui cache le moins les pastilles
 * ouvertes ; sinon, hors de `keep`, celle qui couvre le moins de boutons et de pastilles ; rien ne convient (un écran trop
 * petit pour le mot) : celle qui touche le moins « Retour » et « Toi ». `at` est le point
 * du lieu, sous son cadenas ; `form`, l'indice de la forme choisie dans `sizes`.
 */
export function placeClosedNote(
  at: { x: number; y: number },
  sizes: readonly NoteSize[],
  avoid: readonly Rect[],
  keep: readonly Rect[],
  screen: { width: number; height: number },
  names: readonly Rect[] = [],
): { left: number; top: number; form: number } {
  const list: { left: number; top: number; form: number; r: Rect }[] = [];
  const inside = (left: number, w: number) => Math.min(Math.max(MAP_LABEL_GAP, left), screen.width - MAP_LABEL_GAP - w);
  const add = (left: number, top: number, form: number) => {
    const { w, h } = sizes[form];
    list.push({ left, top, form, r: rect(left, top, w, h) });
  };
  // Le long d'une rangée, du milieu vers les bords, au pas de `NEAR.step`.
  const along = (top: number, form: number) => {
    const middle = inside(screen.width / 2 - sizes[form].w / 2, sizes[form].w);
    add(middle, top, form);
    for (let d = NEAR.step; d <= screen.width / 2; d += NEAR.step) {
      add(inside(middle - d, sizes[form].w), top, form);
      add(inside(middle + d, sizes[form].w), top, form);
    }
  };
  const beside = sizes.map((s, form) => ({ ...s, form })).filter((s) => !s.band);
  const bands = sizes.map((s, form) => ({ ...s, form })).filter((s) => s.band);
  for (const { w, h, form } of beside) {
    const lockTop = at.y - MAP_LOCK;
    add(inside(at.x - w / 2, w), at.y + MAP_LABEL_GAP, form);
    add(inside(at.x - w / 2, w), lockTop - MAP_LABEL_GAP - h, form);
    add(inside(at.x + MAP_LOCK / 2 + MAP_LABEL_GAP, w), lockTop + MAP_LOCK / 2 - h / 2, form);
    add(inside(at.x - MAP_LOCK / 2 - MAP_LABEL_GAP - w, w), lockTop + MAP_LOCK / 2 - h / 2, form);
  }
  for (const { h, form } of [...bands].sort((a, b) => b.w - a.w)) for (const top of [screen.height - MAP_LABEL_GAP - h, MAP_LABEL_GAP]) along(top, form);
  // En dernier recours, toute la hauteur, au pas de `NEAR.step` : la forme large (le long du bas de l'écran, puis du haut,
  // puis ailleurs), puis les bandes (ailleurs qu'en bas ou en haut), pour cacher le moins possible.
  const rows = (h: number) => {
    const list = [];
    for (let top = MAP_LABEL_GAP + NEAR.step; top < screen.height - MAP_LABEL_GAP - h; top += NEAR.step) list.push(top);
    return list;
  };
  for (const { h, form } of beside) for (const top of [screen.height - MAP_LABEL_GAP - h, MAP_LABEL_GAP, ...rows(h)]) along(top, form);
  for (const { h, form } of bands) for (const top of rows(h)) along(top, form);
  const onScreen = (r: Rect) => r.left >= MAP_LABEL_GAP - 0.5 && r.top >= MAP_LABEL_GAP - 0.5 && r.right <= screen.width - MAP_LABEL_GAP + 0.5 && r.bottom <= screen.height - MAP_LABEL_GAP + 0.5;
  const area = (among: readonly Rect[]) => (r: Rect) => among.reduce((n, k) => n + Math.max(0, Math.min(r.right, k.right) - Math.max(r.left, k.left)) * Math.max(0, Math.min(r.bottom, k.bottom) - Math.max(r.top, k.top)), 0);
  const least = (among: readonly { r: Rect; left: number; top: number; form: number }[], cost: (r: Rect) => number) =>
    among.reduce<(typeof among)[number] | undefined>((b, p) => (!b || cost(p.r) < cost(b.r) ? p : b), undefined);
  const shown = list.filter((p) => onScreen(p.r));
  const free = (among: readonly Rect[]) => (p: { r: Rect }) => !among.some((a) => clash(a, p.r));
  // Un bouton de la page passe au-dessus du mot (il le cacherait) : hors des boutons d'abord, puis le moins de noms
  // ouverts cachés ; sans place hors des boutons, hors de « Retour » et « Toi », le moins de boutons et de noms couverts.
  const outOfButtons = shown.filter(free([...avoid, ...keep]));
  const covered = (r: Rect) => area(avoid)(r) + area(names)(r);
  const best =
    outOfButtons.find(free(names)) ??
    least(outOfButtons, area(names)) ??
    least(shown.filter(free(keep)), covered) ??
    least(shown, area(keep)) ??
    list[0];
  return { left: best.left, top: best.top, form: best.form };
}
