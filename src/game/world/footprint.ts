// L'emprise des lieux sur la grille d'une région (GD-9, L2) : le cadre fixe de chaque région, l'emprise de chaque lieu
// (sa terre, l'îlot de son Gardien, les îlots des grandes constructions qui se tiennent à son large, le quai du port),
// les lieux réunis, et l'écart d'eau qui sépare deux emprises. Code pur, sans Three.js.
import { type BiomeId } from '../biomes';
import { getArchipelago } from './archipelago';
import { dockBox } from './harbor';
import { BIOMES } from '../biomes';
import { ARCHIPELAGO_IDS } from './archipelagos';
import { type ArchipelagoId, archipelagoOfIsland, coeurDe, islandDef, type IslandDef, isthmusOf, lieuDeDepart } from './map';
import { MONUMENT_ISLET, monumentsOf, type MonumentDef } from './monuments';
import { PAS, type PoseDuLieu, type Rectangle, tournerLeRectangle } from './placement';
import type { Layout, LayoutSpot } from './regionLayout';
import { rectangleDeLIlot } from './terrain/islets';

/**
 * Le cadre de chaque région, en cases du monde : la Carte le montre tout entier, la mer et ses écueils y sont semés une
 * fois, et un lieu ne se pose qu'au-dedans. Son coin est sur la grille des places (au pas de `PAS`) : la place d'un lieu
 * s'écrit en pas depuis ce coin (`placeEnPas`). Ordres de grandeur décidés avec GD-9 : 192 × 144 aux Premiers Rivages,
 * 144 × 112 aux Îles Brumeuses, 168 × 112 aux Anciens Ateliers (redessinés : ils étaient en ligne ; leur cadre tient
 * les côtes de la Gare et de l'île de la LV2, aux deux bouts), 208 × 112 aux Îles
 * du Ciel (leur arc, de l'artiste technique 3D).
 */
export const CADRES: Readonly<Record<ArchipelagoId, Readonly<Rectangle>>> = Object.freeze({
  '6e': Object.freeze({ x0: -20, y0: -13, x1: 172, y1: 131 }),
  '5e': Object.freeze({ x0: 21, y0: 289, x1: 165, y1: 401 }),
  '4e': Object.freeze({ x0: -6, y0: 584, x1: 162, y1: 696 }),
  '3e': Object.freeze({ x0: -30, y0: 880, x1: 178, y1: 992 }),
});

/** Le cadre d'une région (`CADRES`). */
export function cadreDe(a: ArchipelagoId): Readonly<Rectangle> {
  return CADRES[a];
}

/** Au moins tant de cases d'eau entre deux emprises de lieux qui ne sont pas réunis (îlot du Gardien compris). */
export const ECART_ENTRE_LES_LIEUX = 4;

/** Une liaison passe à tant de cases au moins de toute emprise (hors du départ de ses deux bouts) : sur l'eau, au large. */
export const ECART_DES_LIAISONS = 2;

/**
 * L'écart entre deux rectangles : le nombre de cases libres entre eux sur l'axe qui les sépare le plus (négatif ou nul
 * s'ils se touchent ou se chevauchent).
 */
export function ecartEntre(r: Rectangle, s: Rectangle): number {
  return Math.max(s.x0 - r.x1, r.x0 - s.x1, s.y0 - r.y1, r.y0 - s.y1);
}

/** La distance (en cases, à la façon d'un roi aux échecs) d'une case à un rectangle : 0 dedans, 1 contre lui. */
export function distanceAuRectangle(x: number, y: number, r: Rectangle): number {
  return Math.max(r.x0 - x, x - (r.x1 - 1), r.y0 - y, y - (r.y1 - 1), 0);
}

/** Le rectangle de la terre propre d'un lieu dans le monde (son cœur et sa côte, sans isthme), le lieu tourné. */
export function rectangleDeLaTerre(def: IslandDef): Rectangle {
  const c = coeurDe(def);
  const local = { x0: c.x0 - def.ext.left - def.core.x, y0: c.y0 - def.ext.front - def.core.y, x1: c.x1 + def.ext.right - def.core.x, y1: c.y1 + def.ext.back - def.core.y };
  const r = tournerLeRectangle(local, def.quarts);
  return { x0: def.core.x + r.x0, y0: def.core.y + r.y0, x1: def.core.x + r.x1, y1: def.core.y + r.y1 };
}

/**
 * L'îlot d'une grande construction dans le monde : il se tient au large de son lieu (`MonumentDef.biome`) et le suit
 * quand il bouge (GD-9) ; `islet` est sa place sur la carte de départ.
 */
export function ilotDuMonument(m: MonumentDef, def: IslandDef = islandDef(m.biome)): { x: number; y: number } {
  const depart = lieuDeDepart(m.biome).core;
  const depuis = { x: m.islet.x - depart.x, y: m.islet.y - depart.y };
  const r = tournerLeRectangle({ x0: depuis.x, y0: depuis.y, x1: depuis.x + MONUMENT_ISLET, y1: depuis.y + MONUMENT_ISLET }, def.quarts);
  return { x: def.core.x + r.x0, y: def.core.y + r.y0 };
}

/** Le rectangle de l'îlot d'une grande construction. */
export function rectangleDuMonument(m: MonumentDef, def: IslandDef = islandDef(m.biome)): Rectangle {
  const o = ilotDuMonument(m, def);
  return { x0: o.x, y0: o.y, x1: o.x + MONUMENT_ISLET, y1: o.y + MONUMENT_ISLET };
}

/** Une part de l'emprise d'un lieu : sa terre, l'îlot de son Gardien, l'îlot d'une grande construction, le quai du port. */
export interface PartDEmprise extends Rectangle {
  lieu: BiomeId;
  genre: 'terre' | 'ilot' | 'monument' | 'quai';
}

/**
 * L'emprise d'un lieu dans le monde, à sa place (ou à celle de `def`) : les rectangles de sa terre, de son îlot, de ses
 * grandes constructions, du quai (le port ne bouge pas : il est au point de départ).
 */
export function empriseDuLieu(id: BiomeId, def: IslandDef = islandDef(id)): PartDEmprise[] {
  const a = getArchipelago(archipelagoOfIsland(id));
  const out: PartDEmprise[] = [
    { lieu: id, genre: 'terre', ...rectangleDeLaTerre(def) },
    { lieu: id, genre: 'ilot', ...rectangleDeLIlot(def) },
  ];
  for (const m of monumentsOf(a.classe)) if (m.biome === id) out.push({ lieu: id, genre: 'monument', ...rectangleDuMonument(m, def) });
  if (a.port === id) {
    // Le quai suit son lieu (il est dessiné depuis sa côte) ; le lieu du port, au point de départ, ne tourne pas.
    const d = dockBox(id);
    const ici = islandDef(id).core;
    const [dx, dy] = [def.core.x - ici.x, def.core.y - ici.y];
    out.push({ lieu: id, genre: 'quai', x0: d.x0 + dx, y0: d.y0 + dy, x1: d.x1 + dx, y1: d.y1 + 1 + dy });
  }
  return out;
}

/** La place d'un lieu en pas depuis le coin du cadre de sa région (`CADRES`), ou `null` s'il n'est pas sur la grille. */
export function placeEnPas(a: ArchipelagoId, x: number, y: number): { i: number; j: number } | null {
  const c = CADRES[a];
  const dx = x - c.x0;
  const dy = y - c.y0;
  return dx % PAS === 0 && dy % PAS === 0 ? { i: dx / PAS, j: dy / PAS } : null;
}

// ---------- La disposition de la sauvegarde (GD-9, L3) ----------

/** La pose d'un lieu dans le monde depuis sa place sur la grille de sa région. */
export function poseDeLaPlace(a: ArchipelagoId, spot: LayoutSpot): PoseDuLieu {
  const c = cadreDe(a);
  return { x: c.x0 + spot.x * PAS, y: c.y0 + spot.y * PAS, quarts: spot.turn };
}

/** Un lieu posé à une place (sans passer par la disposition du moment). */
function lieuPose(id: BiomeId, pose: PoseDuLieu): IslandDef {
  return { ...lieuDeDepart(id), core: { x: pose.x, y: pose.y }, quarts: pose.quarts };
}

/**
 * Les lieux d'une région à la place que leur donne sa disposition : posés dans leur cadre, et sans emprise qui touche
 * celle d'un autre. Un lieu déplacé laisse au moins `ECART_ENTRE_LES_LIEUX` cases d'eau à chacun ; deux lieux restés à
 * leur place de départ gardent leur écart d'aujourd'hui (la carte de départ se cale sur le pas avec la PR suivante).
 * `null` si la disposition ne tient pas.
 */
export function lieuxTenus(a: ArchipelagoId, islands: Partial<Record<BiomeId, LayoutSpot>>): Map<BiomeId, PoseDuLieu> | null {
  const poses = new Map<BiomeId, PoseDuLieu>();
  for (const [id, spot] of Object.entries(islands) as [BiomeId, LayoutSpot][]) poses.set(id, poseDeLaPlace(a, spot));
  const lieux = BIOMES.filter((b) => b.classe === a).map((b) => {
    const p = poses.get(b.id);
    return { def: p ? lieuPose(b.id, p) : lieuDeDepart(b.id), bouge: p !== undefined };
  });
  const cadre = cadreDe(a);
  const emprises = lieux.map((l) => empriseDuLieu(l.def.id, l.def));
  for (let i = 0; i < lieux.length; i++) {
    if (lieux[i].bouge) for (const p of emprises[i]) if (p.x0 < cadre.x0 || p.y0 < cadre.y0 || p.x1 > cadre.x1 || p.y1 > cadre.y1) return null;
    for (let j = i + 1; j < lieux.length; j++) {
      if (isthmusOf(lieux[i].def.id) === lieux[j].def.id) continue;
      const ecart = lieux[i].bouge || lieux[j].bouge ? ECART_ENTRE_LES_LIEUX : 1;
      for (const p of emprises[i]) for (const q of emprises[j]) if (ecartEntre(p, q) < ecart) return null;
    }
  }
  return poses;
}

/**
 * Les poses des lieux d'une disposition (pour `poserLesLieux`, ./placement.ts) : les lieux déplacés seulement. Une
 * région dont la disposition ne tient pas sur sa grille (`lieuxTenus`) reste à sa carte de départ.
 */
export function posesDeLaDisposition(layout: Layout | undefined): Map<BiomeId, PoseDuLieu> {
  const out = new Map<BiomeId, PoseDuLieu>();
  if (!layout) return out;
  for (const a of ARCHIPELAGO_IDS) {
    const tenus = lieuxTenus(a, layout[a]?.islands ?? {});
    if (tenus) for (const [id, p] of tenus) out.set(id, p);
  }
  return out;
}
