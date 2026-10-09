// Ce que la construction lit du monde : les bâtiments des plans qui prennent le kit d'architecture (lot 7b), la case
// d'un bloc dans le modèle de son lieu du village, et les tours du décor du cœur que le rendu Archipéo ne dessine pas.
import { type BiomeId, BLOCKS } from '../../biomes';
import type { VoxelCube } from '../../Voxel';
import { LAYOUT_PAD, origineDe, placeSpot, VILLAGE_PLACES } from '../terrain';
import { type ArchipelagoId, islandDef, mapOf } from '../map';
import { decalageDesPlans, planCells, plansFor } from '../plans';
// Les lieux et le type de leurs cases, pris à leur fichier (et non à ../architecture) : les kits d'architecture lisent
// les étapes des plans d'ici (`etapesDe`), sans boucle d'imports.
import { estUnLieuDuVillage } from '../architecture/places';
import type { CaseDuLieu } from '../architecture/kits/types';
import { layoutCache } from '../placement';

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

/** Les cases des étapes des plans d'un archipel, par archipel et par tranche d'étapes (`de`, `a`), vidées avec la disposition. */
const etapes = layoutCache<string, ReadonlyMap<string, string>>();

/**
 * Les cases des étapes `de` à `jusqua` (exclue) des plans de chaque île d'un archipel, posées ou non (clé `x,y,z` du
 * monde), et la texture de leur bloc dans Archipéo. Comme world/terrain.ts : la case (x, y, z) d'un plan est posée en
 * (cœur + x, cœur + y, altitude + z + 1), décalée au fond de la zone au Marché et à l'Atelier (`decalageDesPlans`).
 */
export function etapesDe(a: ArchipelagoId, de: number, jusqua: number): ReadonlyMap<string, string> {
  const k = `${a}|${de}|${jusqua}`;
  const deja = etapes.get(k);
  if (deja) return deja;
  const out = new Map<string, string>();
  for (const def of mapOf(a))
    for (const plan of plansFor(def.id).slice(de, jusqua)) {
      const d = decalageDesPlans(plan);
      planCells(plan).forEach((c, i) => {
        out.set(`${def.core.x + c.x + d.x},${def.core.y + c.y + d.y},${def.altitude + c.z + d.z + 1}`, BLOCKS[plan.cells[i].archipeo ?? c.block].texture);
      });
    }
  etapes.set(k, out);
  return out;
}

/**
 * Les bâtiments des îles d'un archipel (lot 7b), entiers, posés ou non : les cases des murs et du toit de chaque île
 * (clé `x,y,z` du monde) et la texture de leur bloc. La cour (barrières, jardinières, quai, ponton), la jetée du port,
 * le décor, les ponts, les bornes et les monuments n'y sont pas : ils gardent leur dessin ; les lieux du village non
 * plus (l'école, la salle des trophées, le lieu où l'on assemble : ils prennent le kit par `caseDuLieu`).
 */
export function batimentsDe(a: ArchipelagoId): ReadonlyMap<string, string> {
  return etapesDe(a, 0, ETAPES_DU_BATIMENT);
}

/**
 * Les cours des îles d'un archipel (la table commune, 8 octobre 2026) : les cases de la troisième étape du plan de chaque
 * île (barrières, jardinières, marches, lanternes, ou le troisième morceau d'un lieu en trois plans), posées ou non, et
 * la texture de leur bloc. Elles prennent le kit sur leur propre plan : la cour n'allonge pas un mur.
 */
export function coursDe(a: ArchipelagoId): ReadonlyMap<string, string> {
  return etapesDe(a, ETAPES_DU_BATIMENT, ETAPES_DU_BATIMENT + 1);
}

const blocsDArchipeo = layoutCache<ArchipelagoId, ReadonlyMap<string, string>>();

/**
 * Les cases des bâtiments dont le bloc change dans Archipéo (`PlanCell.archipeo`, world/plans.ts), et la texture qu'il y
 * prend : le toit de terre cuite de la maison basse du quartier, de chaume dans Blocland (DA, retouches HG-2). C'est aussi
 * une toiture à part (./architecture/neighborhood.ts, `toitures`) : le toit de la maison basse ne prolonge pas celui de la
 * maison haute, qu'il touche.
 */
export function blocsDArchipeoDe(a: ArchipelagoId): ReadonlyMap<string, string> {
  const deja = blocsDArchipeo.get(a);
  if (deja) return deja;
  const out = new Map<string, string>();
  for (const def of mapOf(a))
    for (const plan of plansFor(def.id).slice(0, ETAPES_DU_BATIMENT)) {
      const d = decalageDesPlans(plan);
      planCells(plan).forEach((c, i) => {
        const autre = plan.cells[i].archipeo;
        if (autre) out.set(`${def.core.x + c.x + d.x},${def.core.y + c.y + d.y},${def.altitude + c.z + d.z + 1}`, BLOCKS[autre].texture);
      });
    }
  blocsDArchipeo.set(a, out);
  return out;
}

/**
 * Les cubes posés du monde avec le bloc qu'ils prennent dans Archipéo (`blocsDArchipeoDe`) : un nouveau cube pour ceux-là
 * seulement, les autres tels quels. Les fantômes restent des cubes Brume. Le rendu Archipéo seulement : Blocland garde son
 * dessin.
 */
export function enBlocsDArchipeo(a: ArchipelagoId, cubes: VoxelCube[]): VoxelCube[] {
  const autres = blocsDArchipeoDe(a);
  if (!autres.size) return cubes;
  let out: VoxelCube[] | null = null;
  for (let i = 0; i < cubes.length; i++) {
    const c = cubes[i];
    if (c.ghost || c.place || c.decor || c.sol) continue;
    const t = autres.get(`${c.x},${c.y},${c.z}`);
    if (!t || t === c.texture) continue;
    out ??= cubes.slice();
    out[i] = { ...c, texture: t };
  }
  return out ?? cubes;
}

/** Le coin de chaque lieu du village posé (clé `<lieu>|<île>`) : x, y, et z du rang posé sur le sol (`null` ailleurs). */
const coinsDesLieux = layoutCache<string, { x: number; y: number; z: number } | null>();

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
