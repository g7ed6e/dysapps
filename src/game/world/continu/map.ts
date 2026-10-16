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

/** La Carte à l'ouverture : l'île entière, au milieu de l'écran. */
export function mapStart(aspect: number): MapView {
  return { x: (ISLAND_BOX.minX + ISLAND_BOX.maxX) / 2, z: (ISLAND_BOX.minZ + ISLAND_BOX.maxZ) / 2, distance: fitDistance(aspect) };
}

/** La pose garde l'île sous les yeux : la distance entre la plus proche et l'île entière, le point regardé dans l'île. */
export function clampMap(v: MapView, aspect: number): MapView {
  const distance = Math.min(fitDistance(aspect), Math.max(MAP_CAMERA.closest, v.distance));
  return {
    x: Math.min(ISLAND_BOX.maxX, Math.max(ISLAND_BOX.minX, v.x)),
    z: Math.min(ISLAND_BOX.maxZ, Math.max(ISLAND_BOX.minZ, v.z)),
    distance,
  };
}

/** La Carte glissée : le point regardé déplacé de (`dx`, `dz`), dans ses limites. */
export function panMap(v: MapView, dx: number, dz: number, aspect: number): MapView {
  return clampMap({ x: v.x + dx, z: v.z + dz, distance: v.distance }, aspect);
}

/**
 * La Carte zoomée d'un facteur (`factor` > 1 rapproche), autour du point du sol `toward` (sous les doigts ou le
 * pointeur) : ce point reste où il est à l'écran, sauf aux limites.
 */
export function zoomMap(v: MapView, factor: number, toward: Vec2, aspect: number): MapView {
  const want = clampMap({ ...v, distance: v.distance / Math.max(0.01, factor) }, aspect).distance;
  const k = want / v.distance;
  return clampMap({ x: toward.x + (v.x - toward.x) * k, z: toward.z + (v.z - toward.z) * k, distance: want }, aspect);
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
   * Posé avant les autres lieux ouverts (l'Escale, le lieu de départ, GD-20, lot 2 : elle garde son nom, les autres se
   * réduisent d'abord à leur icône).
   */
  first?: boolean;
}

/** Sa place : le coin haut gauche, et si son nom se montre (un lieu fermé peut n'en garder que le cadenas). */
export interface MapLabelSpot {
  id: string;
  left: number;
  top: number;
  name: boolean;
}

/** Le cadenas d'un lieu fermé, en pixels, et l'écart gardé entre deux étiquettes (référent dys, consultant UX UI). */
export const MAP_LOCK = 40;
export const MAP_LABEL_GAP = 8;
/** La pastille de Kéo seule, en pixels (sans « Toi »). */
export const MAP_KEO_DISC = 44;
/** Un lieu ouvert sans son nom (trop serré) : sa pastille réduite à son icône, une cible carrée de 48 px. */
export const MAP_COMPACT = 48;
/** Les décalages verticaux essayés pour un nom qui en touche un autre, en demi-hauteurs d'étiquette. */
const SHIFTS = 3;

/** Le pas et la portée de la recherche d'une place libre pour un nom, en pixels. */
const SPIRAL = { step: 16, reach: 240, directions: 16 } as const;

/** La première place libre (`ok`) autour de `r`, de plus en plus loin, ou rien. */
function spiral(r: Rect, ok: (c: Rect) => boolean): Rect | undefined {
  for (let d = SPIRAL.step; d <= SPIRAL.reach; d += SPIRAL.step)
    for (let k = 0; k < SPIRAL.directions; k++) {
      const a = (k * 2 * Math.PI) / SPIRAL.directions;
      const dx = d * Math.cos(a), dy = d * Math.sin(a);
      const c = { left: r.left + dx, top: r.top + dy, right: r.right + dx, bottom: r.bottom + dy };
      if (ok(c)) return c;
    }
  return undefined;
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
 * qui passe en premier, `first`, d'abord),
 * au-dessus de son point, sinon dessous, sinon décalé vers le haut ou vers le bas (une demi-hauteur, puis une autre),
 * sinon à droite ou à gauche, sinon à la place libre la plus proche, dans l'écran, chaque fois d'abord hors de la place
 * du nom d'un lieu fermé, sous son cadenas (un cadenas ne coiffe jamais le nom d'un lieu ouvert) ; s'il ne trouve toujours pas de
 * place, sa pastille se réduit à son icône (`name: false`, le nom et l'état restent dits par le bouton) ; enfin le nom
 * de chaque lieu fermé, sous son cadenas, s'efface s'il gêne (le toucher du lieu dit alors « Fermé pour l'instant »).
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
  for (const l of labels) {
    if (l.kind === 'keo') {
      const r = compactKeo ? rect(l.x - MAP_KEO_DISC / 2, l.y - l.h, MAP_KEO_DISC, l.h) : rect(l.x - l.w / 2, l.y - l.h, l.w, l.h);
      placed.push({ id: l.id, r });
      out.set(l.id, { id: l.id, left: r.left, top: r.top, name: !compactKeo });
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
    // Sinon, la place libre la plus proche autour du lieu, de plus en plus loin (une spirale de pas de 16 px) ; d'abord
    // hors de la place du nom d'un lieu fermé, même un peu plus loin de son point (sur la tablette, toutes les places
    // simples de la Turbine touchaient celle des Écluses, et le nom revenait sous leur cadenas).
    let r = full.find(apart) ?? spiral(full[0], apart) ?? full.find(clear) ?? spiral(full[0], clear);
    let name = true;
    if (!r) {
      // Toujours trop serré : l'icône seule, à la première place libre.
      const small = places(MAP_COMPACT, MAP_COMPACT);
      r = small.find(clear) ?? spiral(small[0], clear);
      name = false;
      if (!r) {
        crowded = true;
        // Au pire, il peut toucher une autre étiquette, jamais un bouton de la page.
        const off = (c: Rect) => onScreen(c) && !obstacles.some((o) => clash(o, c));
        r = small.find(off) ?? spiral(small[0], off) ?? small[0];
      }
    }
    placed.push({ id: l.id, r });
    out.set(l.id, { id: l.id, left: r.left, top: r.top, name });
  }
  for (const l of labels) {
    if (l.kind !== 'closed') continue;
    const name = rect(l.x - l.w / 2, l.y, l.w, Math.max(0, l.h - MAP_LOCK));
    if (!free(name, l.id)) continue;
    placed.push({ id: l.id, r: name });
    out.get(l.id)!.name = true;
  }
  return { spots: labels.map((l) => out.get(l.id)!), crowded };
}
