// Ce que la construction lit du monde : les bâtiments des plans qui prennent le kit d'architecture (lot 7b), la case
// d'un bloc dans le modèle de son lieu du village, et les tours du décor du cœur que le rendu Archipéo ne dessine pas.
import { type BiomeId, BLOCKS } from '../../biomes';
import type { VoxelCube } from '../../Voxel';
import { LAYOUT_PAD, origineDe, placeSpot, VILLAGE_PLACES } from '../terrain';
import { type ArchipelagoId, islandDef, mapOf } from '../map';
import { decalageDesPlans, planCells, plansFor } from '../plans';
import { type CaseDuLieu, estUnLieuDuVillage } from '../architecture';

/**
 * Les tours du décor du cœur que le rendu Archipéo ne dessine pas (décision du directeur artistique, lot R5) : un seul
 * phare par île. Sur l'île de la Tour (6e), la tour de verre à sommet d'or cachait le pied du phare de Grimoire ; sur
 * l'île du Phare (3e), la petite tour de pierre à lanterne doublait le grand phare. Cases du cœur (world/decor.ts,
 * `DECOR`), que Blocland garde : son dessin ne change pas.
 */
const TOURS_DU_COEUR: Partial<Record<BiomeId, readonly (readonly [number, number])[]>> = {
  'french-6e-reading': [
    [8, 4],
    [9, 4],
    [8, 5],
    [9, 5],
  ],
  'maths-3e-functions': [[9, 3]],
};

/** Les cubes du monde sans les tours du décor du cœur (`TOURS_DU_COEUR`) : le rendu Archipéo seulement. */
export function sansToursDuCoeur(cubes: VoxelCube[]): VoxelCube[] {
  const retirees = new Set<string>();
  for (const [ile, cases] of Object.entries(TOURS_DU_COEUR)) {
    const o = origineDe(ile as Parameters<typeof origineDe>[0]);
    for (const [dx, dy] of cases ?? []) retirees.add(`${ile}|${o.x + LAYOUT_PAD.x + dx},${o.y + LAYOUT_PAD.y + dy}`);
  }
  return cubes.filter((c) => c.sol || c.decor || c.ghost || !retirees.has(`${c.tag}|${c.x},${c.y}`));
}

/** Les étapes d'un bâtiment qui prennent le kit d'architecture : les murs et le toit (world/architect.ts, `Stages`). */
export const ETAPES_DU_BATIMENT = 2;

const batiments = new Map<ArchipelagoId, ReadonlyMap<string, string>>();

/**
 * Les bâtiments des îles d'un archipel (lot 7b), entiers, posés ou non : les cases des murs et du toit de chaque île
 * (clé `x,y,z` du monde) et la texture de leur bloc. La cour (barrières, jardinières, quai, ponton), la jetée du port,
 * le décor, les ponts, les bornes et les monuments n'y sont pas : ils gardent leur dessin ; les lieux du village non
 * plus (l'école, la salle des trophées, le lieu où l'on assemble : ils prennent le kit par `caseDuLieu`).
 */
export function batimentsDe(a: ArchipelagoId): ReadonlyMap<string, string> {
  const deja = batiments.get(a);
  if (deja) return deja;
  const out = new Map<string, string>();
  for (const def of mapOf(a))
    for (const plan of plansFor(def.id).slice(0, ETAPES_DU_BATIMENT)) {
      // Comme world/terrain.ts : la case (x, y, z) d'un plan est posée en (cœur + x, cœur + y, altitude + z + 1), décalée
      // au fond de la zone au Marché et à l'Atelier (`decalageDesPlans`).
      const d = decalageDesPlans(plan);
      for (const c of planCells(plan))
        out.set(`${def.core.x + c.x + d.x},${def.core.y + c.y + d.y},${def.altitude + c.z + d.z + 1}`, BLOCKS[c.block].texture);
    }
  batiments.set(a, out);
  return out;
}

/** Le coin de chaque lieu du village posé (clé `<lieu>|<île>`) : x, y, et z du rang posé sur le sol (`null` ailleurs). */
const coinsDesLieux = new Map<string, { x: number; y: number; z: number } | null>();

/**
 * La case d'un bloc d'un lieu du village dans le modèle de son lieu (world/terrain.ts : `schoolModel`, `trophyModel` et
 * les trophées posés, `atelierModel`), relative à son coin ; `null` hors du modèle (le soubassement qui rattrape une
 * marche du sol) ou hors d'un lieu du village (un monument).
 */
export function caseDuLieu(c: VoxelCube): CaseDuLieu | null {
  if (!estUnLieuDuVillage(c.place) || !c.tag) return null;
  const k = `${c.place}|${c.tag}`;
  let coin = coinsDesLieux.get(k);
  if (coin === undefined) {
    const ile = c.tag as BiomeId;
    const s = placeSpot(c.place, ile);
    coin = s && { x: s.x, y: s.y, z: islandDef(ile).altitude + s.h };
    coinsDesLieux.set(k, coin);
  }
  if (!coin) return null;
  const z = c.z - coin.z;
  if (z < 1) return null;
  const { w, d } = VILLAGE_PLACES[c.place].size;
  return { x: c.x - coin.x, y: c.y - coin.y, z, w, d, texture: c.texture ?? '' };
}
