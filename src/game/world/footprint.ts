// L'emprise des lieux sur la grille d'une région (GD-9, L2) : le cadre fixe de chaque région, l'emprise de chaque lieu
// (sa terre, l'îlot de son Gardien, les îlots des grandes constructions qui se tiennent à son large, le quai du port),
// les lieux réunis, et l'écart d'eau qui sépare deux emprises. Code pur, sans Three.js.
import { type BiomeId } from '../biomes';
import { getArchipelago } from './archipelago';
import { dockBox } from './harbor';
import { BIOMES } from '../biomes';
import { ARCHIPELAGO_IDS } from './archipelagos';
import { type ArchipelagoId, archipelagoOfIsland, coeurDe, islandDef, type IslandDef, isthmusOf, startingIsland } from './map';
import { MONUMENT_ISLET, monumentsOf, type MonumentDef } from './monuments';
import { STEP, type PlacePose, type Rectangle, turnRectangle } from './placement';
import type { Layout, LayoutGuardian, LayoutSpot } from './savedLayout';
import { rectangleDeLIlot, rectangleDeLIlotAutour } from './terrain/islets';

/**
 * Le cadre de chaque région, en cases du monde : la Carte le montre tout entier, la mer et ses écueils y sont semés une
 * fois, et un lieu ne se pose qu'au-dedans. Son coin est sur la grille des places (au pas de `STEP`) : la place d'un lieu
 * s'écrit en pas depuis ce coin (`spotInSteps`). Ordres de grandeur décidés avec GD-9 : 192 × 144 aux Premiers Rivages,
 * 144 × 112 aux Îles Brumeuses (156 × 112 depuis HG-3 : le cadre s'élargit de 12 cases vers l'est pour le Bourg des
 * chroniques et le Delta des ressources, DA, 6 octobre 2026), 168 × 112 aux Anciens Ateliers (redessinés : ils étaient en ligne ; leur cadre tient
 * les côtes de la Gare et de l'île de la LV2, aux deux bouts), 208 × 112 aux Îles
 * du Ciel (leur arc, de l'artiste technique 3D).
 */
const REGION_FRAMES: Readonly<Record<ArchipelagoId, Readonly<Rectangle>>> = Object.freeze({
  '6e': Object.freeze({ x0: -20, y0: -13, x1: 172, y1: 131 }),
  '5e': Object.freeze({ x0: 21, y0: 289, x1: 177, y1: 401 }),
  '4e': Object.freeze({ x0: -6, y0: 584, x1: 162, y1: 696 }),
  '3e': Object.freeze({ x0: -30, y0: 880, x1: 178, y1: 992 }),
});

/** Le cadre d'une région (`REGION_FRAMES`). */
export function frameOf(a: ArchipelagoId): Readonly<Rectangle> {
  return REGION_FRAMES[a];
}

/** Au moins tant de cases d'eau entre deux emprises de lieux qui ne sont pas réunis (îlot du Gardien compris). */
export const GAP_BETWEEN_PLACES = 4;

/** Une liaison passe à tant de cases au moins de toute emprise (hors du départ de ses deux bouts) : sur l'eau, au large. */
export const LINK_GAP = 2;

/**
 * L'écart entre deux rectangles : le nombre de cases libres entre eux sur l'axe qui les sépare le plus (négatif ou nul
 * s'ils se touchent ou se chevauchent).
 */
export function gapBetween(r: Rectangle, s: Rectangle): number {
  return Math.max(s.x0 - r.x1, r.x0 - s.x1, s.y0 - r.y1, r.y0 - s.y1);
}

/** Le rectangle de la terre propre d'un lieu dans le monde (son cœur et sa côte, sans isthme), le lieu tourné. */
export function landRectangle(def: IslandDef): Rectangle {
  const c = coeurDe(def);
  const local = { x0: c.x0 - def.ext.left - def.core.x, y0: c.y0 - def.ext.front - def.core.y, x1: c.x1 + def.ext.right - def.core.x, y1: c.y1 + def.ext.back - def.core.y };
  const r = turnRectangle(local, def.quarts);
  return { x0: def.core.x + r.x0, y0: def.core.y + r.y0, x1: def.core.x + r.x1, y1: def.core.y + r.y1 };
}

/**
 * L'îlot d'une grande construction dans le monde : il se tient au large de son lieu (`MonumentDef.biome`) et le suit
 * quand il bouge (GD-9) ; `islet` est sa place sur la carte de départ.
 */
export function monumentIslet(m: MonumentDef, def: IslandDef = islandDef(m.biome)): { x: number; y: number } {
  const depart = startingIsland(m.biome).core;
  const depuis = { x: m.islet.x - depart.x, y: m.islet.y - depart.y };
  const r = turnRectangle({ x0: depuis.x, y0: depuis.y, x1: depuis.x + MONUMENT_ISLET, y1: depuis.y + MONUMENT_ISLET }, def.quarts);
  return { x: def.core.x + r.x0, y: def.core.y + r.y0 };
}

/** Le rectangle de l'îlot d'une grande construction. */
function monumentRectangle(m: MonumentDef, def: IslandDef = islandDef(m.biome)): Rectangle {
  const o = monumentIslet(m, def);
  return { x0: o.x, y0: o.y, x1: o.x + MONUMENT_ISLET, y1: o.y + MONUMENT_ISLET };
}

/** Une part de l'emprise d'un lieu : sa terre, l'îlot de son Gardien, l'îlot d'une grande construction, le quai du port. */
export interface FootprintPart extends Rectangle {
  lieu: BiomeId;
  genre: 'terre' | 'ilot' | 'monument' | 'quai';
}

/**
 * Le rectangle de l'îlot du Gardien d'un lieu dans le monde, son îlot déplacé autour de lui (GD-9, `LayoutGuardian`) :
 * sur un des quatre côtés du lieu (dans son repère), à la même distance de sa terre qu'aujourd'hui (`ISLET_GAP`), et à
 * `step` pas le long de ce côté depuis sa place d'aujourd'hui (devant : au droit du bord gauche du cœur ; sur les
 * autres côtés, au droit du bord avant ou gauche du cœur). Devant, au pas 0, c'est sa place de la carte de départ
 * (`rectangleDeLIlot`). Le lieu tourné, l'îlot tourne avec lui.
 */
export function guardianIsletRectangle(def: IslandDef, g: Pick<LayoutGuardian, 'side' | 'step'>): Rectangle {
  const r = rectangleDeLIlotAutour(def, g);
  const t = turnRectangle({ x0: r.x0 - def.core.x, y0: r.y0 - def.core.y, x1: r.x1 - def.core.x, y1: r.y1 - def.core.y }, def.quarts);
  return { x0: def.core.x + t.x0, y0: def.core.y + t.y0, x1: def.core.x + t.x1, y1: def.core.y + t.y1 };
}

/**
 * L'emprise d'un lieu dans le monde, à sa place (ou à celle de `def`) : les rectangles de sa terre, de son îlot (à sa
 * place, ou autour du lieu là où `gardien` le met), de ses grandes constructions, du quai (le port ne bouge pas : il est
 * au point de départ).
 */
export function footprintOf(id: BiomeId, def: IslandDef = islandDef(id), gardien?: Pick<LayoutGuardian, 'side' | 'step'>): FootprintPart[] {
  const a = getArchipelago(archipelagoOfIsland(id));
  const out: FootprintPart[] = [
    { lieu: id, genre: 'terre', ...landRectangle(def) },
    { lieu: id, genre: 'ilot', ...(gardien ? guardianIsletRectangle(def, gardien) : rectangleDeLIlot(def)) },
  ];
  for (const m of monumentsOf(a.classe)) if (m.biome === id) out.push({ lieu: id, genre: 'monument', ...monumentRectangle(m, def) });
  if (a.port === id) {
    // Le quai suit son lieu (il est dessiné depuis sa côte) ; le lieu du port, au point de départ, ne tourne pas.
    const d = dockBox(id);
    const ici = islandDef(id).core;
    const [dx, dy] = [def.core.x - ici.x, def.core.y - ici.y];
    out.push({ lieu: id, genre: 'quai', x0: d.x0 + dx, y0: d.y0 + dy, x1: d.x1 + dx, y1: d.y1 + 1 + dy });
  }
  return out;
}

/** La place d'un lieu en pas depuis le coin du cadre de sa région (`REGION_FRAMES`), ou `null` s'il n'est pas sur la grille. */
export function spotInSteps(a: ArchipelagoId, x: number, y: number): { i: number; j: number } | null {
  const c = REGION_FRAMES[a];
  const dx = x - c.x0;
  const dy = y - c.y0;
  return dx % STEP === 0 && dy % STEP === 0 ? { i: dx / STEP, j: dy / STEP } : null;
}

// ---------- La disposition de la sauvegarde (GD-9, L3) ----------

/** La pose d'un lieu dans le monde depuis sa place sur la grille de sa région. */
export function poseOfSpot(a: ArchipelagoId, spot: LayoutSpot): PlacePose {
  const c = frameOf(a);
  return { x: c.x0 + spot.x * STEP, y: c.y0 + spot.y * STEP, quarts: spot.turn };
}

/** Un lieu posé à une place (sans passer par la disposition du moment). */
export function placedIsland(id: BiomeId, pose: PlacePose): IslandDef {
  return { ...startingIsland(id), core: { x: pose.x, y: pose.y }, quarts: pose.quarts };
}

/**
 * Les lieux d'une région à la place que leur donne sa disposition : posés dans leur cadre, et sans emprise qui touche
 * celle d'un autre. Un lieu déplacé laisse au moins `GAP_BETWEEN_PLACES` cases d'eau à chacun ; deux lieux restés à
 * leur place de départ gardent leur écart d'aujourd'hui (la carte de départ se cale sur le pas avec la PR suivante).
 * `null` si la disposition ne tient pas.
 */
export function fittingPlaces(
  a: ArchipelagoId,
  islands: Partial<Record<BiomeId, LayoutSpot>>,
  guardians: Partial<Record<BiomeId, LayoutGuardian>> = {},
): Map<BiomeId, PlacePose> | null {
  const poses = new Map<BiomeId, PlacePose>();
  for (const [id, spot] of Object.entries(islands) as [BiomeId, LayoutSpot][]) poses.set(id, poseOfSpot(a, spot));
  const lieux = BIOMES.filter((b) => b.classe === a).map((b) => {
    const p = poses.get(b.id);
    // Un lieu dont le Gardien a quitté sa place compte comme déplacé : son îlot laisse l'écart de règle.
    return { def: p ? placedIsland(b.id, p) : startingIsland(b.id), bouge: p !== undefined || guardians[b.id] !== undefined };
  });
  const bougent = new Set(lieux.filter((l) => l.bouge).map((l) => l.def.id));
  return tooSmallGaps(a, lieux.map((l) => l.def), (id) => bougent.has(id), (id) => guardians[id]).length ? null : poses;
}

/**
 * Un écart trop petit d'une disposition : une part d'emprise d'un lieu (`place`, de sorte `kind`) à `gap` cases d'eau
 * seulement d'une part d'un autre lieu (`other`), ou hors du cadre de la région (`other` nul, `gap` négatif).
 */
export interface TooSmallGap {
  place: BiomeId;
  other: BiomeId | null;
  kind: FootprintPart['genre'];
  gap: number;
}

/**
 * Les écarts trop petits d'une disposition (`lieux` à leur place) ; vide : elle tient. Un lieu déplacé (`bouge`) reste
 * dans le cadre et laisse au moins `GAP_BETWEEN_PLACES` cases d'eau à chacun, sauf à celui avec qui il est réuni ;
 * deux lieux restés à leur place de départ ne se touchent pas. Sans `bouge`, tous les lieux comptent comme déplacés.
 */
export function tooSmallGaps(
  a: ArchipelagoId,
  lieux: readonly IslandDef[],
  bouge: (id: BiomeId) => boolean = () => true,
  gardien: (id: BiomeId) => Pick<LayoutGuardian, 'side' | 'step'> | undefined = () => undefined,
): TooSmallGap[] {
  const out: TooSmallGap[] = [];
  const c = frameOf(a);
  const parts = lieux.map((d) => footprintOf(d.id, d, gardien(d.id)));
  parts.forEach((ps, i) => {
    if (bouge(lieux[i].id))
      for (const p of ps) {
        const dehors = Math.min(p.x0 - c.x0, p.y0 - c.y0, c.x1 - p.x1, c.y1 - p.y1);
        if (dehors < 0) out.push({ place: p.lieu, other: null, kind: p.genre, gap: dehors });
      }
    for (let j = i + 1; j < parts.length; j++) {
      if (isthmusOf(lieux[i].id) === lieux[j].id) continue;
      const min = bouge(lieux[i].id) || bouge(lieux[j].id) ? GAP_BETWEEN_PLACES : 1;
      for (const p of ps)
        for (const q of parts[j]) {
          const gap = gapBetween(p, q);
          if (gap < min) out.push({ place: p.lieu, other: q.lieu, kind: p.genre, gap });
        }
    }
  });
  return out;
}

/**
 * Les poses des lieux d'une disposition (pour `placeIslands`, ./placement.ts) : les lieux déplacés seulement. Une
 * région dont la disposition ne tient pas sur sa grille (`fittingPlaces`) reste à sa carte de départ.
 */
export function posesOfLayout(layout: Layout | undefined): Map<BiomeId, PlacePose> {
  const out = new Map<BiomeId, PlacePose>();
  if (!layout) return out;
  for (const a of ARCHIPELAGO_IDS) {
    const tenus = fittingPlaces(a, layout[a]?.islands ?? {}, layout[a]?.guardians ?? {});
    if (tenus) for (const [id, p] of tenus) out.set(id, p);
  }
  return out;
}
