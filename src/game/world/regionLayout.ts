// La disposition de chaque région dans la sauvegarde (GD-9, L3, la donnée seulement) : le champ facultatif
// `world.layout`. Il garde la place et l'orientation de chaque lieu, le côté, la place et l'orientation de chaque
// Gardien, la place des bornes, les arrivées des liaisons, les lieux réunis, les raccourcis posés et les liaisons à
// reposer. Absent ou invalide, c'est la carte de départ ; une région invalide est oubliée seule, les autres restent.
// Ici, la forme de la donnée (des règles, sans le monde) ; qu'une disposition tienne sur la grille (dans son cadre, ses
// lieux assez écartés) se vérifie quand on la pose (`posesDeLaDisposition`, ./footprint.ts). Aucun écran ne l'écrit
// encore (le geste « Aménager » vient avec la PR 2). Code pur, sans Three.js.
import { BIOMES, type BiomeId } from '../biomes';
import { getBridge } from './archipelago';
import { type ArchipelagoId, ARCHIPELAGO_IDS, archipelagoOfIsland } from './archipelagos';

/** Une orientation : de 0 à 3 quarts de tour (`Quarts`, ./placement.ts). */
export type LayoutTurn = 0 | 1 | 2 | 3;

/** Un côté, au nom neutre de la sauvegarde. */
export type LayoutSide = 'front' | 'right' | 'back' | 'left';

export const LAYOUT_SIDES: readonly LayoutSide[] = ['front', 'right', 'back', 'left'];

/** Une place sur la grille d'une région : en pas (`PAS`) depuis le coin de son cadre (`CADRES`), et une orientation. */
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
const entier = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v);
const quart = (v: unknown): v is LayoutTurn => v === 0 || v === 1 || v === 2 || v === 3;
const cote = (v: unknown): v is LayoutSide => typeof v === 'string' && (LAYOUT_SIDES as readonly string[]).includes(v);
const IDS = new Set<string>(BIOMES.map((b) => b.id));
const lieuDe = (a: ArchipelagoId, v: string): v is BiomeId => IDS.has(v) && archipelagoOfIsland(v as BiomeId) === a;

/** Une arrivée lue, ou `null`. Sa place le long du côté reste dans un lieu (au plus 8 pas de chaque côté du cœur). */
function lireArrivee(v: unknown): LayoutLanding | null {
  if (!isRecord(v) || !cote(v.side) || !entier(v.step) || Math.abs(v.step) > 8) return null;
  return { side: v.side, step: v.step };
}

/** La disposition d'une région, lue et vérifiée, ou `null` si elle est invalide (la carte de départ). */
function lireLaRegion(a: ArchipelagoId, raw: unknown): RegionLayout | null {
  if (!isRecord(raw)) return null;
  const out: RegionLayout = {};
  if (raw.islands !== undefined) {
    if (!isRecord(raw.islands)) return null;
    const islands: Partial<Record<BiomeId, LayoutSpot>> = {};
    for (const [id, s] of Object.entries(raw.islands)) {
      if (!lieuDe(a, id) || !isRecord(s) || !entier(s.x) || !entier(s.y) || !quart(s.turn) || s.x < 0 || s.y < 0) return null;
      islands[id] = { x: s.x, y: s.y, turn: s.turn };
    }
    if (Object.keys(islands).length) out.islands = islands;
  }
  if (raw.guardians !== undefined) {
    if (!isRecord(raw.guardians)) return null;
    const guardians: Partial<Record<BiomeId, LayoutGuardian>> = {};
    for (const [id, g] of Object.entries(raw.guardians)) {
      if (!lieuDe(a, id) || !isRecord(g) || !cote(g.side) || !entier(g.step) || Math.abs(g.step) > 8 || !quart(g.turn)) return null;
      guardians[id] = { side: g.side, step: g.step, turn: g.turn };
    }
    if (Object.keys(guardians).length) out.guardians = guardians;
  }
  if (raw.stations !== undefined) {
    if (!isRecord(raw.stations)) return null;
    const stations: Record<string, { x: number; y: number }> = {};
    for (const [cle, p] of Object.entries(raw.stations)) {
      const id = cle.split(':')[0];
      // Une borne reste dans le cœur de son lieu (au plus 20 × 20, de −2 à 18).
      if (!lieuDe(a, id) || !isRecord(p) || !entier(p.x) || !entier(p.y) || p.x < -2 || p.x > 17 || p.y < -2 || p.y > 17) return null;
      stations[cle] = { x: p.x, y: p.y };
    }
    if (Object.keys(stations).length) out.stations = stations;
  }
  const liaisonDe = (id: unknown): id is string => typeof id === 'string' && getBridge(id) !== undefined && archipelagoOfIsland(getBridge(id)!.from) === a;
  if (raw.landings !== undefined) {
    if (!isRecord(raw.landings)) return null;
    const landings: Record<string, { from: LayoutLanding; to: LayoutLanding }> = {};
    for (const [id, l] of Object.entries(raw.landings)) {
      const from = isRecord(l) ? lireArrivee(l.from) : null;
      const to = isRecord(l) ? lireArrivee(l.to) : null;
      if (!liaisonDe(id) || !from || !to) return null;
      landings[id] = { from, to };
    }
    if (Object.keys(landings).length) out.landings = landings;
  }
  if (raw.joined !== undefined) {
    if (!Array.isArray(raw.joined)) return null;
    const joined: [BiomeId, BiomeId][] = [];
    const pris = new Set<string>();
    for (const p of raw.joined) {
      // Un lieu se réunit à un seul autre.
      if (!Array.isArray(p) || p.length !== 2 || !lieuDe(a, p[0]) || !lieuDe(a, p[1]) || p[0] === p[1] || pris.has(p[0]) || pris.has(p[1])) return null;
      pris.add(p[0]);
      pris.add(p[1]);
      joined.push([p[0], p[1]]);
    }
    if (joined.length) out.joined = joined;
  }
  for (const champ of ['shortcuts', 'relink'] as const) {
    const v = raw[champ];
    if (v === undefined) continue;
    if (!Array.isArray(v) || !v.every(liaisonDe)) return null;
    const ids = [...new Set(v)];
    if (ids.length) out[champ] = ids;
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
    const r = lireLaRegion(a, raw[a]);
    if (r) out[a] = r;
  }
  return Object.keys(out).length ? out : undefined;
}
