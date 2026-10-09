// L'emprise des lieux sur la grille d'une région (GD-9, L2) : le cadre fixe de chaque région, l'emprise de chaque lieu
// (sa terre, où se tient son Gardien depuis GD-11, les îlots des grandes constructions qui se tiennent à son large, le quai du port),
// les lieux réunis, et l'écart d'eau qui sépare deux emprises. Code pur, sans Three.js.
import { type BiomeId } from '../biomes';
import { getArchipelago } from './archipelago';
import { dockBox } from './harbor';
import { BIOMES } from '../biomes';
import { ARCHIPELAGO_IDS } from './archipelagos';
import { type ArchipelagoId, archipelagoOfIsland, coeurDe, islandDef, type IslandDef, isLand, isthmusOf, landBox, startingIsland } from './map';
import { silhouetteDe } from './silhouettes';
import { MONUMENT_ISLET, monumentsOf, type MonumentDef } from './monuments';
import { STEP, type PlacePose, type Rectangle, turnRectangle } from './placement';
import type { Layout, LayoutSpot } from './savedLayout';

/**
 * Le cadre de chaque région, en cases du monde : la Carte le montre tout entier, la mer et ses écueils y sont semés une
 * fois, et un lieu ne se pose qu'au-dedans. Son coin est sur la grille des places (au pas de `STEP`) : la place d'un lieu
 * s'écrit en pas depuis ce coin (`spotInSteps`). Ordres de grandeur décidés avec GD-9 : 192 × 144 aux Premiers Rivages
 * (les trois îles de sciences, SC-2, y tiennent : agrandi vers le fond, le cadre ne tenait plus sur la Carte de la
 * tablette au plancher du zoom),
 * 144 × 112 aux Îles Brumeuses (168 × 112 depuis HG-3, comme les Anciens Ateliers : le cadre s'élargit de 24 cases vers
 * l'est pour le Bourg des chroniques et le Delta des ressources, DA, 6 octobre 2026 ; chaque lieu mobile y tourne, sauf le
 * Glacier des relatifs, 52 cases de large tourné avec son monument, qu'aucune place libre ne tient), 168 × 112 aux Anciens Ateliers (redessinés : ils étaient en ligne ; leur cadre tient
 * les côtes de la Gare et de l'île de la LV2, aux deux bouts ; chaque lieu mobile y tourne, sauf la Gare du futur,
 * 37 × 28 cases tournée, qu'aucune place libre ne tient : `SANS_PLACE`, arrange.test.ts), 208 × 112 aux Îles
 * du Ciel (leur arc, de l'artiste technique 3D). Les îles de sciences de 5e à 3e (SC-3) : chaque cadre n'avait plus qu'une
 * place libre ; il s'approfondit vers le fond, juste assez pour un rang de plus : 168 × 140 aux Îles Brumeuses (28 cases :
 * 24 pour le rang, 4 de marge pour que `settleNewPlaces` trouve une place à la Prairie quand une sauvegarde a déplacé un
 * lieu de l'est ; les noms de la Carte sont mesurés avec ce cadre, mapLabels.test.ts), 168 × 140 aux Anciens Ateliers
 * (28 cases), 208 × 120 aux Îles du Ciel (8 cases), sous les 192 × 144 des Premiers Rivages, qui tiennent sur la Carte de
 * la tablette. Le Glacier et la Gare ne tournent toujours pas ; la Grammaire (5e) et le Refuge des carnets (3e), dans des
 * régions plus pleines, n'avaient plus de place libre tournés non plus. Depuis GD-11 (les îlots des Gardiens retirés),
 * chaque lieu mobile trouve une place tourné (arrange.test.ts) ; les îles agrandies tiennent dans les mêmes cadres.
 * Depuis une forme par île (GD-12, 9 octobre 2026), les cadres s'approfondissent encore, vers l'est et le fond
 * seulement (le coin ne bouge pas : les places des sauvegardes se comptent depuis lui, `LAYOUT_LAST_SPOT`), pour deux
 * places d'îles futures : 176 × 160 aux Îles Brumeuses (+8 vers l'est, +20 au fond, et non les 32 demandés : au-delà,
 * « Modifier le plan » ne cadre plus toute la région sur la tablette, camera.test.ts) ; 168 × 164 aux Anciens Ateliers (+24 au fond : le rang du fond porte la Vigie,
 * le Bassin et, entre eux, les deux places futures).
 */
const REGION_FRAMES: Readonly<Record<ArchipelagoId, Readonly<Rectangle>>> = Object.freeze({
  '6e': Object.freeze({ x0: -20, y0: -13, x1: 172, y1: 131 }),
  '5e': Object.freeze({ x0: 21, y0: 289, x1: 197, y1: 449 }),
  '4e': Object.freeze({ x0: -6, y0: 584, x1: 162, y1: 748 }),
  '3e': Object.freeze({ x0: -30, y0: 880, x1: 178, y1: 1000 }),
});

/** Le cadre d'une région (`REGION_FRAMES`). */
export function frameOf(a: ArchipelagoId): Readonly<Rectangle> {
  return REGION_FRAMES[a];
}

/** Au moins tant de cases d'eau entre deux emprises de lieux qui ne sont pas réunis. */
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
  return autourDuLieu(def, local);
}

/** Un rectangle du repère d'un lieu (relatif à l'origine de son cœur, le lieu pas tourné) dans le monde, le lieu posé et tourné. */
function autourDuLieu(def: IslandDef, local: Rectangle): Rectangle {
  const r = turnRectangle(local, def.quarts);
  return { x0: def.core.x + r.x0, y0: def.core.y + r.y0, x1: def.core.x + r.x1, y1: def.core.y + r.y1 };
}

/**
 * La hauteur des bandes qui couvrent la terre d'un lieu qui a une forme (`landRectangles`) : deux rangées de cases, une
 * bande par morceau de terre d'un seul tenant sur ces deux rangées. Elles suivent la côte à une case près, sans
 * multiplier les rectangles que comparent les écarts (`tooSmallGaps`) et le traceur des liaisons.
 */
const BANDE = 2;

const bandesLocales = new Map<BiomeId, readonly Rectangle[]>();

/**
 * La terre propre d'un lieu en rectangles, dans le monde, le lieu tourné : un seul, `landRectangle`, pour une île sans
 * forme ; des bandes qui suivent sa côte pour une île qui a une forme (GD-12), si bien que deux lieux s'emboîtent, à
 * `GAP_BETWEEN_PLACES` cases d'eau de côte à côte, et non plus de rectangle à rectangle. Calculées une fois dans le
 * repère du lieu (son dessin ne dépend pas de sa place).
 */
export function landRectangles(def: IslandDef): Rectangle[] {
  if (!silhouetteDe(def.id).forme) return [landRectangle(def)];
  let locales = bandesLocales.get(def.id);
  if (!locales) bandesLocales.set(def.id, (locales = bandesDeLaTerre(def)));
  return locales.map((r) => autourDuLieu(def, r));
}

/** Les bandes de la terre d'un lieu (`landRectangles`), dans son repère, le lieu pas tourné. */
function bandesDeLaTerre(def: IslandDef): readonly Rectangle[] {
  const droit: IslandDef = { ...def, quarts: 0 };
  const b = landBox(droit);
  const out: Rectangle[] = [];
  for (let y0 = b.y0; y0 < b.y1; y0 += BANDE) {
    const y1 = Math.min(b.y1, y0 + BANDE);
    let debut: number | null = null;
    for (let x = b.x0; x <= b.x1; x++) {
      let terre = false;
      for (let y = y0; y < y1 && !terre && x < b.x1; y++) terre = isLand(droit, x, y);
      if (terre && debut === null) debut = x;
      if (!terre && debut !== null) {
        out.push({ x0: debut - def.core.x, y0: y0 - def.core.y, x1: x - def.core.x, y1: y1 - def.core.y });
        debut = null;
      }
    }
  }
  // Deux bandes l'une sur l'autre, de même largeur, n'en font qu'une.
  const fondues: Rectangle[] = [];
  for (const r of out) {
    const dessous = fondues.find((f) => f.x0 === r.x0 && f.x1 === r.x1 && f.y1 === r.y0);
    if (dessous) dessous.y1 = r.y1;
    else fondues.push({ ...r });
  }
  return Object.freeze(fondues.map((r) => Object.freeze(r)));
}

/** La boîte de rectangles : le plus petit rectangle qui les tient tous. */
export function boxOf(rs: readonly Rectangle[]): Rectangle {
  return { x0: Math.min(...rs.map((r) => r.x0)), y0: Math.min(...rs.map((r) => r.y0)), x1: Math.max(...rs.map((r) => r.x1)), y1: Math.max(...rs.map((r) => r.y1)) };
}

/**
 * L'îlot d'une grande construction dans le monde : il se tient au large de son lieu (`MonumentDef.biome`) et le suit
 * quand il bouge (GD-9) ; `islet` est sa place sur la carte de départ. Un îlot détaché (`MonumentDef.detache`, carte
 * « Détacher », 9 octobre 2026) reste à `islet`, où que soit son lieu.
 */
export function monumentIslet(m: MonumentDef, def: IslandDef = islandDef(m.biome)): { x: number; y: number } {
  if (m.detache) return { ...m.islet };
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

/** Une part de l'emprise d'un lieu : sa terre, l'îlot d'une grande construction, le quai du port. */
export interface FootprintPart extends Rectangle {
  lieu: BiomeId;
  genre: 'terre' | 'monument' | 'quai';
  /** L'îlot détaché d'une grande construction (`MonumentDef.detache`) : il ne bouge pas avec son lieu. */
  fixe?: true;
}

/**
 * L'emprise d'un lieu dans le monde, à sa place (ou à celle de `def`) : les rectangles de sa terre (son Gardien s'y tient,
 * GD-11), de ses grandes constructions, du quai (le port ne bouge pas : il est au point de départ). L'îlot détaché d'une
 * grande construction y est à sa place fixe (`fixe`) : son lieu ne s'en approche pas plus que d'un autre lieu
 * (`tooSmallGaps`, et `fitsAt` dans arrange.ts).
 */
export function footprintOf(id: BiomeId, def: IslandDef = islandDef(id)): FootprintPart[] {
  const a = getArchipelago(archipelagoOfIsland(id));
  const out: FootprintPart[] = landRectangles(def).map((r) => ({ lieu: id, genre: 'terre', ...r }));
  for (const m of monumentsOf(a.classe)) if (m.biome === id) out.push({ lieu: id, genre: 'monument', ...monumentRectangle(m, def), ...(m.detache && { fixe: true as const }) });
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
export function fittingPlaces(a: ArchipelagoId, islands: Partial<Record<BiomeId, LayoutSpot>>): Map<BiomeId, PlacePose> | null {
  const poses = new Map<BiomeId, PlacePose>();
  for (const [id, spot] of Object.entries(islands) as [BiomeId, LayoutSpot][]) poses.set(id, poseOfSpot(a, spot));
  const lieux = BIOMES.filter((b) => b.classe === a).map((b) => {
    const p = poses.get(b.id);
    return p ? placedIsland(b.id, p) : startingIsland(b.id);
  });
  return tooSmallGaps(a, lieux, (id) => poses.has(id)).length ? null : poses;
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
export function tooSmallGaps(a: ArchipelagoId, lieux: readonly IslandDef[], bouge: (id: BiomeId) => boolean = () => true): TooSmallGap[] {
  const out: TooSmallGap[] = [];
  const c = frameOf(a);
  const parts = lieux.map((d) => partsOf(footprintOf(d.id, d)));
  parts.forEach((ps, i) => {
    // Un lieu et son îlot détaché, qui ne le suit pas : le même écart qu'entre deux lieux.
    const fixes = ps.filter((p) => p.fixe);
    if (fixes.length) {
      const min = bouge(lieux[i].id) ? GAP_BETWEEN_PLACES : 1;
      for (const p of ps)
        if (!p.fixe)
          for (const q of fixes) {
            const gap = gapBetweenParts(p, q, min);
            if (gap < min) out.push({ place: p.lieu, other: q.lieu, kind: p.genre, gap });
          }
    }
    if (bouge(lieux[i].id))
      for (const p of ps) {
        const dehors = Math.min(p.box.x0 - c.x0, p.box.y0 - c.y0, c.x1 - p.box.x1, c.y1 - p.box.y1);
        if (dehors < 0) out.push({ place: p.lieu, other: null, kind: p.genre, gap: dehors });
      }
    for (let j = i + 1; j < parts.length; j++) {
      if (isthmusOf(lieux[i].id) === lieux[j].id) continue;
      const min = bouge(lieux[i].id) || bouge(lieux[j].id) ? GAP_BETWEEN_PLACES : 1;
      for (const p of ps)
        for (const q of parts[j]) {
          const gap = gapBetweenParts(p, q, min);
          if (gap < min) out.push({ place: p.lieu, other: q.lieu, kind: p.genre, gap });
        }
    }
  });
  return out;
}

/** Une part d'emprise d'un lieu, ses rectangles réunis (les bandes de sa terre n'en font qu'une) et leur boîte. */
interface PartOfPlace {
  lieu: BiomeId;
  genre: FootprintPart['genre'];
  fixe?: true;
  rects: readonly Rectangle[];
  box: Rectangle;
}

function partsOf(fp: readonly FootprintPart[]): PartOfPlace[] {
  const out: PartOfPlace[] = [];
  const terre = fp.filter((p) => p.genre === 'terre');
  if (terre.length) out.push({ lieu: terre[0].lieu, genre: 'terre', rects: terre, box: boxOf(terre) });
  for (const p of fp) if (p.genre !== 'terre') out.push({ lieu: p.lieu, genre: p.genre, rects: [p], box: p, ...(p.fixe && { fixe: true as const }) });
  return out;
}

/** L'écart entre deux parts : le plus petit entre leurs rectangles ; au-delà de `assez`, leurs boîtes suffisent. */
function gapBetweenParts(p: PartOfPlace, q: PartOfPlace, assez: number): number {
  const loin = gapBetween(p.box, q.box);
  if (loin >= assez) return loin;
  let min = Infinity;
  for (const r of p.rects) for (const s of q.rects) min = Math.min(min, gapBetween(r, s));
  return min;
}

/**
 * Les poses des lieux d'une disposition (pour `placeIslands`, ./placement.ts) : les lieux déplacés seulement. Une
 * région dont la disposition ne tient pas sur sa grille (`fittingPlaces`) reste à sa carte de départ.
 */
export function posesOfLayout(layout: Layout | undefined): Map<BiomeId, PlacePose> {
  const out = new Map<BiomeId, PlacePose>();
  if (!layout) return out;
  for (const a of ARCHIPELAGO_IDS) {
    const tenus = fittingPlaces(a, layout[a]?.islands ?? {});
    if (tenus) for (const [id, p] of tenus) out.set(id, p);
  }
  return out;
}
