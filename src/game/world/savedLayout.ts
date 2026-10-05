// La disposition de chaque région dans la sauvegarde (GD-9, L3, la donnée seulement) : le champ facultatif
// `world.layout`. Il garde la place et l'orientation de chaque lieu, le côté, la place et l'orientation de chaque
// Gardien, la place des bornes, les arrivées des liaisons, les lieux réunis, les raccourcis posés et les liaisons à
// reposer. Absent ou invalide, c'est la carte de départ ; une région dont les lieux sont invalides est oubliée seule,
// les autres restent ; une borne, une arrivée, un raccourci ou une liaison à reposer invalide n'oublie qu'elle-même.
// Ici, la forme de la donnée (des règles, sans le monde) ; qu'une disposition tienne sur la grille (dans son cadre, ses
// lieux assez écartés) se vérifie quand on la pose (`posesOfLayout`, ./footprint.ts). Aucun écran ne l'écrit
// encore (le geste « Aménager » vient avec la PR 2). Code pur, sans Three.js.
import { BIOMES, getBiome, type BiomeId } from '../biomes';
import { getBridge } from './archipelago';
import { type ArchipelagoId, ARCHIPELAGO_IDS, archipelagoOfIsland } from './archipelagos';

/** Une orientation : de 0 à 3 quarts de tour (`Quarts`, ./placement.ts). */
export type LayoutTurn = 0 | 1 | 2 | 3;

/** Un côté, au nom neutre de la sauvegarde. */
export type LayoutSide = 'front' | 'right' | 'back' | 'left';

const LAYOUT_SIDES: readonly LayoutSide[] = ['front', 'right', 'back', 'left'];

/** Une place sur la grille d'une région : en pas (`STEP`) depuis le coin de son cadre (`REGION_FRAMES`), et une orientation. */
export interface LayoutSpot {
  x: number;
  y: number;
  /** De 0 à 3 quarts de tour. */
  turn: LayoutTurn;
}

/** La place d'un Gardien : le côté de son lieu où se tient son îlot, sa place le long de ce côté (en pas), son orientation. */
export interface LayoutGuardian {
  side: LayoutSide;
  step: number;
  turn: LayoutTurn;
}

/** L'arrivée d'une liaison sur un lieu : le côté du lieu (dans son repère) et la place le long de ce côté, en pas. */
export interface LayoutLanding {
  side: LayoutSide;
  step: number;
}

/** La disposition d'une région. Chaque champ est facultatif : un lieu absent est à sa place de la carte de départ. */
export interface RegionLayout {
  /** La place et l'orientation de chaque lieu déplacé. */
  islands?: Partial<Record<BiomeId, LayoutSpot>>;
  /** Le côté, la place et l'orientation de chaque Gardien déplacé. */
  guardians?: Partial<Record<BiomeId, LayoutGuardian>>;
  /** La place de chaque borne déplacée (clé « lieu:mission »), en cases du repère de son lieu. */
  stations?: Record<string, { x: number; y: number }>;
  /** Les arrivées choisies de chaque liaison (identifiant de liaison), à ses deux bouts. */
  landings?: Record<string, { from: LayoutLanding; to: LayoutLanding }>;
  /** Les lieux réunis (deux lieux côte à côte qui partagent une bande de terre), par paires. */
  joined?: [BiomeId, BiomeId][];
  /** Les raccourcis posés (identifiants de liaison). */
  shortcuts?: string[];
  /** Les liaisons construites qu'un déplacement a défaites et qui attendent d'être reposées. */
  relink?: string[];
}

/** Le champ `world.layout` : la disposition de chaque région aménagée. */
export type Layout = Partial<Record<ArchipelagoId, RegionLayout>>;

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isInt = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v);
const isTurn = (v: unknown): v is LayoutTurn => v === 0 || v === 1 || v === 2 || v === 3;
const isSide = (v: unknown): v is LayoutSide => typeof v === 'string' && (LAYOUT_SIDES as readonly string[]).includes(v);
const IDS = new Set<string>(BIOMES.map((b) => b.id));
const isIslandOf = (a: ArchipelagoId, v: string): v is BiomeId => IDS.has(v) && archipelagoOfIsland(v as BiomeId) === a;

/** Une arrivée lue, ou `null`. Sa place le long du côté reste dans un lieu (au plus 8 pas de chaque côté du cœur). */
function readLanding(v: unknown): LayoutLanding | null {
  if (!isRecord(v) || !isSide(v.side) || !isInt(v.step) || Math.abs(v.step) > 8) return null;
  return { side: v.side, step: v.step };
}

/**
 * La dernière place de la grille de chaque région, en pas depuis le coin de son cadre, sur chaque axe : le cadre
 * (./footprint.ts) divisé par le pas (./placement.ts), recopié ici pour que la sauvegarde se lise sans la grille
 * (savedLayout.test.ts vérifie qu'ils s'accordent).
 */
export const LAYOUT_LAST_SPOT: Readonly<Record<ArchipelagoId, Readonly<{ x: number; y: number }>>> = {
  '6e': { x: 48, y: 36 },
  '5e': { x: 36, y: 28 },
  '4e': { x: 42, y: 28 },
  '3e': { x: 52, y: 28 },
};

/** Une mission du lieu : la clé d'une borne est « lieu:mission », la mission parmi celles du lieu (toutes LV2 comprises). */
function isStationKey(a: ArchipelagoId, key: string): boolean {
  const [id, mission, ...rest] = key.split(':');
  if (rest.length || !isIslandOf(a, id)) return false;
  return getBiome(id)?.exercises.some((e) => e.id === mission) ?? false;
}

/**
 * La disposition d'une région, lue et vérifiée, ou `null` si rien n'en reste (la carte de départ). Les lieux et les
 * lieux réunis vont ensemble : une entrée invalide de `islands`, `joined` ou `guardians` fait oublier toute la région. Une
 * entrée invalide de `stations`, `landings`, `shortcuts` ou `relink` n'oublie qu'elle-même.
 */
function readRegion(a: ArchipelagoId, raw: unknown): RegionLayout | null {
  if (!isRecord(raw)) return null;
  const out: RegionLayout = {};
  if (raw.islands !== undefined) {
    if (!isRecord(raw.islands)) return null;
    const max = LAYOUT_LAST_SPOT[a];
    const islands: Partial<Record<BiomeId, LayoutSpot>> = {};
    for (const [id, s] of Object.entries(raw.islands)) {
      // Dans le cadre dès la lecture : une place hors de la grille de la région n'est pas une place.
      if (!isIslandOf(a, id) || !isRecord(s) || !isInt(s.x) || !isInt(s.y) || !isTurn(s.turn) || s.x < 0 || s.y < 0 || s.x > max.x || s.y > max.y) return null;
      islands[id] = { x: s.x, y: s.y, turn: s.turn };
    }
    if (Object.keys(islands).length) out.islands = islands;
  }
  if (raw.joined !== undefined) {
    if (!Array.isArray(raw.joined)) return null;
    const joined: [BiomeId, BiomeId][] = [];
    const taken = new Set<string>();
    for (const p of raw.joined) {
      // Un lieu se réunit à un seul autre.
      if (!Array.isArray(p) || p.length !== 2 || !isIslandOf(a, p[0]) || !isIslandOf(a, p[1]) || p[0] === p[1] || taken.has(p[0]) || taken.has(p[1])) return null;
      taken.add(p[0]);
      taken.add(p[1]);
      joined.push([p[0], p[1]]);
    }
    if (joined.length) out.joined = joined;
  }
  if (raw.guardians !== undefined) {
    if (!isRecord(raw.guardians)) return null;
    const guardians: Partial<Record<BiomeId, LayoutGuardian>> = {};
    for (const [id, g] of Object.entries(raw.guardians)) {
      if (!isIslandOf(a, id) || !isRecord(g) || !isSide(g.side) || !isInt(g.step) || Math.abs(g.step) > 8 || !isTurn(g.turn)) return null;
      guardians[id] = { side: g.side, step: g.step, turn: g.turn };
    }
    if (Object.keys(guardians).length) out.guardians = guardians;
  }
  if (isRecord(raw.stations)) {
    const stations: Record<string, { x: number; y: number }> = {};
    // Une borne reste dans le cœur de son lieu (au plus 20 × 20, de −2 à 18).
    for (const [key, p] of Object.entries(raw.stations))
      if (isStationKey(a, key) && isRecord(p) && isInt(p.x) && isInt(p.y) && p.x >= -2 && p.x <= 17 && p.y >= -2 && p.y <= 17) stations[key] = { x: p.x, y: p.y };
    if (Object.keys(stations).length) out.stations = stations;
  }
  const isLinkOf = (id: unknown): id is string => {
    const d = typeof id === 'string' ? getBridge(id) : undefined;
    return !!d && archipelagoOfIsland(d.from) === a;
  };
  if (isRecord(raw.landings)) {
    const landings: Record<string, { from: LayoutLanding; to: LayoutLanding }> = {};
    for (const [id, l] of Object.entries(raw.landings)) {
      const from = isRecord(l) ? readLanding(l.from) : null;
      const to = isRecord(l) ? readLanding(l.to) : null;
      if (isLinkOf(id) && from && to) landings[id] = { from, to };
    }
    if (Object.keys(landings).length) out.landings = landings;
  }
  for (const field of ['shortcuts', 'relink'] as const) {
    const v = raw[field];
    if (!Array.isArray(v)) continue;
    const ids = [...new Set(v.filter(isLinkOf))];
    if (ids.length) out[field] = ids;
  }
  return Object.keys(out).length ? out : null;
}

/**
 * Le champ `world.layout` d'une sauvegarde, lu et vérifié : chaque région valide est gardée, une région invalide est
 * oubliée (elle revient à la carte de départ). `undefined` si rien n'en reste (absent, d'une sauvegarde d'avant GD-9).
 */
export function sanitizeLayout(raw: unknown): Layout | undefined {
  if (!isRecord(raw)) return undefined;
  const out: Layout = {};
  for (const a of ARCHIPELAGO_IDS) {
    const r = readRegion(a, raw[a]);
    if (r) out[a] = r;
  }
  return Object.keys(out).length ? out : undefined;
}
