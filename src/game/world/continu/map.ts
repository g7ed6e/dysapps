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
   * Le nom d'un lieu fermé descendu sous son cadenas, en pixels, quand il toucherait sinon le nom d'un lieu fermé posé
   * juste au-dessus (relecture de L6b : sur la tablette, le nom de la Turbine se taisait contre celui des Marais salants).
   */
  drop?: number;
  /** Dans sa forme serrée, son nom sur deux lignes, plus étroit (un lieu ouvert ou fermé). */
  narrow?: true;
  /**
   * Un lieu ouvert posé loin de son point (à plus de `NEAR.reach`), à la place libre la plus proche dans l'écran, faute
   * de place près de lui : la vue de départ change alors au plus grand texte (`reframeMap`).
   */
  far?: true;
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

/** Les pas dont le nom d'un lieu fermé peut descendre sous son cadenas, en pixels. */
const NAME_DROPS = [0, MAP_LABEL_GAP, 2 * MAP_LABEL_GAP] as const;

/**
 * Le pas et la portée de la recherche d'une place libre pour un nom autour de son lieu, en pixels : au-delà de 80 px
 * entre le lieu et le bord de son étiquette, le nom ne se lit plus comme celui du lieu (relecture du rivage sud,
 * consultant UX UI et référent dys : avec une spirale de 240 px, en texte normal à 667 × 375, des noms erraient loin de
 * leur lieu) ; il prend sa forme serrée, ou se tait pour un lieu fermé.
 */
const NEAR = { step: 16, reach: 80 } as const;

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
const clash = (a: Rect, b: Rect) =>
  a.left < b.right + MAP_LABEL_GAP && b.left < a.right + MAP_LABEL_GAP && a.top < b.bottom + MAP_LABEL_GAP && b.top < a.bottom + MAP_LABEL_GAP;

/**
 * Pose les étiquettes de la Carte sans qu'aucune en recouvre une autre (au moins `MAP_LABEL_GAP` entre elles), ni les
 * boutons de la page (`obstacles`) : d'abord Kéo et les cadenas, à leur place ; puis le nom de chaque lieu ouvert (celui
 * qui passe en premier, `first`, d'abord), au-dessus de son point, sinon dessous, sinon décalé vers le haut ou vers le
 * bas (une demi-hauteur, puis une autre), sinon à droite ou à gauche, sinon à la place libre la plus proche, dans
 * l'écran, chaque fois d'abord hors de la place du nom d'un lieu fermé, sous son cadenas (un cadenas ne coiffe jamais le
 * nom d'un lieu ouvert) ; s'il ne trouve toujours pas de place, dans sa pastille serrée (`narrow` : son nom sur deux
 * lignes, plus étroit), de la même façon ; puis, Kéo réduit à sa pastille, à la place libre la plus proche dans tout
 * l'écran : un lieu ouvert garde son nom (relecture de L6b, directeur artistique). Seulement si aucune place de l'écran
 * ne le laisse sans toucher une autre étiquette (au plus grand texte, sur un téléphone), sa pastille se réduit à son
 * icône (`name: false`, le nom et l'état restent dits par le bouton) : jamais un nom posé sur un autre.
 * Enfin le nom de chaque lieu fermé, sous son cadenas, glissé de côté au besoin (le cadenas toujours au-dessus de lui),
 * puis sur deux lignes (`narrow`), se tait s'il gêne encore (le cadenas reste ; son toucher dit « Fermé pour
 * l'instant »). Une place cherchée autour d'un lieu ne s'en éloigne pas de plus de `NEAR.reach`.
 */
export function layoutMapLabels(labels: readonly MapLabel[], obstacles: readonly Rect[] = [], screen = { width: Infinity, height: Infinity }): MapLabelSpot[] {
  const first = attemptLayout(labels, obstacles, screen, false);
  // Trop serré (Kéo devant son lieu, au plus grand texte) : Kéo garde sa pastille seule, sans « Toi », plutôt qu'un nom
  // de lieu ne passe sur une autre étiquette.
  return first.crowded ? attemptLayout(labels, obstacles, screen, true).spots : first.spots;
}

function attemptLayout(
  labels: readonly MapLabel[],
  obstacles: readonly Rect[],
  screen: { width: number; height: number },
  compactKeo: boolean,
): { spots: MapLabelSpot[]; crowded: boolean } {
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
  const clear = (c: Rect) => onScreen(c) && free(c);
  // La place du nom de chaque lieu fermé, sous son cadenas : un nom de lieu ouvert n'y va qu'en dernier recours, sans
  // quoi le cadenas se lirait comme le sien (relecture de L6a, directeur artistique : le cadenas des Écluses posé sur
  // « La Turbine ✓ »).
  const closedNames = labels.filter((l) => l.kind === 'closed').map((l) => rect(l.x - Math.max(MAP_LOCK, l.w) / 2, l.y, Math.max(MAP_LOCK, l.w), Math.max(MAP_LOCK, l.h - MAP_LOCK)));
  const apart = (c: Rect) => clear(c) && !closedNames.some((n) => clash(n, c));
  const open = labels.filter((l) => l.kind === 'open' && l.first).concat(labels.filter((l) => l.kind === 'open' && !l.first));
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
    const size = l.narrow ?? { w: l.w, h: l.h };
    // Trop serré près de son lieu : la deuxième passe (Kéo d'abord réduit à sa pastille) cherche plus loin.
    if (!r) crowded = true;
    let far = false;
    if (!r && compactKeo) {
      // Puis la place libre la plus proche n'importe où dans l'écran, plutôt que de toucher une autre étiquette ; la vue
      // de départ change alors au plus grand texte, pour la ramener près de son lieu (`far`, `reframeMap`).
      r = anywhere(screen, l, size, clear);
      narrow = Boolean(r && l.narrow);
      far = Boolean(r && gapTo(l, r) > NEAR.reach);
    }
    let name = true;
    if (!r) {
      // Nulle part dans l'écran sans toucher une autre étiquette (au plus grand texte, sur un téléphone, trois lieux
      // ouverts) : sa pastille réduite à son icône, plutôt qu'un nom posé sur un autre ; le nom et l'état restent dits
      // par le bouton. Un écart laissé au directeur artistique (relecture de L6b).
      narrow = false;
      name = false;
      const small = places(MAP_COMPACT, MAP_COMPACT);
      r = small.find(clear) ?? near(l, MAP_COMPACT, MAP_COMPACT, clear) ?? anywhere(screen, l, { w: MAP_COMPACT, h: MAP_COMPACT }, clear);
      if (!r) {
        // Au pire, il peut toucher une autre étiquette, jamais un bouton de la page.
        const off = (c: Rect) => onScreen(c) && !obstacles.some((o) => clash(o, c));
        r = small.find(off) ?? near(l, MAP_COMPACT, MAP_COMPACT, off) ?? small[0];
      }
    }
    placed.push({ id: l.id, r });
    out.set(l.id, { id: l.id, left: r.left, top: r.top, name, ...(narrow ? { narrow: true as const } : {}), ...(far ? { far: true as const } : {}) });
  }
  // Les noms des lieux fermés, du haut de l'écran vers le bas : un nom qui toucherait celui du dessus descend d'un pas.
  const closed = labels.filter((l) => l.kind === 'closed').sort((a, b) => a.y - b.y);
  for (const l of closed) {
    // Sa forme entière, son nom sur une ligne, puis sa forme serrée, son nom sur deux lignes (GD-20, « La Carte au plus
    // grand texte » : sur tablette, « Les Marais salants » fermés se taisaient plutôt que de passer sur deux lignes).
    const forms = [{ w: l.w, h: l.h }, ...(l.narrow ? [l.narrow] : [])];
    let spot: { k: number; drop: number; form: number } | undefined;
    for (let f = 0; f < forms.length && !spot; f++) {
      const { w, h } = forms[f];
      const left = l.x - w / 2;
      // Le nom glisse le long de son cadenas pour rester entier dans l'écran, à un écart du bord ; puis, s'il gêne, de
      // côté, d'un pas à la fois, tant que son cadenas reste au-dessus de lui, ou un peu plus bas (sur la tablette, le nom
      // de la Turbine se taisait contre une étiquette voisine : relecture de L6b, directeur artistique).
      const over = left + w - (screen.width - MAP_LABEL_GAP);
      const under = MAP_LABEL_GAP - left;
      const edge = under > 0 ? under : over > 0 ? -over : 0;
      const shifts = [edge];
      for (let d = NEAR.step; d <= w; d += NEAR.step) shifts.push(edge - d, edge + d);
      const covers = (k: number) => k === edge || (left + k <= l.x - MAP_LOCK / 2 && left + k + w >= l.x + MAP_LOCK / 2);
      const at = (k: number, drop: number) => rect(left + k, l.y + drop, w, Math.max(0, h - MAP_LOCK));
      for (const drop of NAME_DROPS) {
        const k = shifts.find((c) => covers(c) && onScreen(at(c, drop)) && free(at(c, drop), l.id));
        if (k !== undefined) {
          spot = { k, drop, form: f };
          placed.push({ id: l.id, r: at(k, drop) });
          break;
        }
      }
    }
    // Ni entier ni sur deux lignes : il se tait (le cadenas reste ; son toucher dit « Fermé pour l'instant »).
    if (!spot) continue;
    const o = out.get(l.id)!;
    o.name = true;
    if (spot.k) o.shift = spot.k;
    if (spot.drop) o.drop = spot.drop;
    if (spot.form) {
      o.narrow = true;
      o.left = l.x - Math.max(MAP_LOCK, forms[1].w) / 2;
    }
  }
  return { spots: labels.map((l) => out.get(l.id)!), crowded };
}
