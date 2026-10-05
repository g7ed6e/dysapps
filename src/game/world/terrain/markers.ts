// Les bornes des missions : leur place sur l'île, et ce qui ne doit jamais les cacher dans la vue de l'île.
import { type BiomeId, BIOMES, missionsJouables } from '../../biomes';
import { coeurDe, islandDef } from '../map';
import { isSchoolIsland } from './base';
import { versLaCameraDuDessin, VUE_DE_L_ILE } from './view';
import { layoutCache } from '../placement';

/**
 * Les bornes de mission d'une île : une par mission, alignées sur la rangée de devant (côté caméra), en cases relatives
 * au cœur. On touche une borne pour lancer sa mission.
 */
export const QUEST_ROW = 1;

/**
 * Les places des bornes d'une île-école, au pas de 4, centrées sur la visée de la caméra (le milieu du cœur, x = 8) :
 * trois missions prennent les trois du milieu, (4,1) (8,1) (12,1) ; (0,1) et (16,1) attendent une île à cinq missions
 * (redistribution « Trois bandes », choix du mainteneur, 02/10/2026). Seules les bornes se tiennent devant : l'école est
 * au milieu, derrière la dernière.
 */
export const PLACES_DES_BORNES_DES_ECOLES = [0, 4, 8, 12, 16] as const;

/**
 * Les colonnes des bornes d'une île-école à `n` missions, prises dans `PLACES_DES_BORNES_DES_ECOLES` à partir du milieu :
 * 1 → 8 ; 3 → 4, 8, 12 ; 5 → toutes. Un nombre pair ne se centre pas au pas de 4 : il penche d'une place vers la gauche
 * (x bas), 2 → 4, 8 et 4 → 0, 4, 8, 12, plutôt que de quitter la grille des places. Au-delà de 5, `null` : l'île reprend
 * le pas de 3 des autres îles. Aujourd'hui, les quatre îles-écoles ont 3 missions (threeBands.test.ts).
 */
export function placesDesBornes(n: number): readonly number[] | null {
  const places = PLACES_DES_BORNES_DES_ECOLES;
  if (n > places.length) return null;
  const debut = Math.floor((places.length - n) / 2);
  return places.slice(debut, debut + n);
}

export function questStations(id: BiomeId): { typeId: string; x: number; y: number }[] {
  const biome = BIOMES.find((b) => b.id === id);
  if (!biome) return [];
  const missions = missionsJouables(biome);
  const places = isSchoolIsland(id) ? placesDesBornes(missions.length) : null;
  if (places) return missions.map((ex, i) => ({ typeId: ex.id, x: places[i], y: QUEST_ROW }));
  return missions.map((ex, i) => ({ typeId: ex.id, x: 3 + 3 * i, y: QUEST_ROW }));
}

/** Une borne telle que la vue de l'île la voit : sa case (coordonnées du monde, ou du cœur) et le dessus du sol sous elle. */
export interface BorneVue {
  x: number;
  y: number;
  base: number;
}

/** Des points de la borne (socle et ardoise, deux cubes sur son sol), un peu en retrait de ses arêtes : u, v dans la case, w au-dessus du sol. */
const POINTS_DE_LA_BORNE: [number, number, number][] = [0.05, 0.5, 0.95].flatMap((u) =>
  [0.05, 0.5, 0.95].flatMap((v) => [1.05, 1.5, 2, 2.5, 2.95].map((w): [number, number, number] => [u, v, w])),
);

/** Le plus bas de ces points au-dessus du sol de la borne. */
const PIED_DE_LA_BORNE = 1.05;

/** La marge autour d'un cube de décor : le rendu Archipéo le dessine en volume un peu plus large, et la vue est en perspective. */
const MARGE_DEVANT_LA_BORNE = 0.1;

/**
 * Le plus haut qu'un cube du décor monte au-dessus du sol d'une borne, en cubes, marge comprise : un arbre ou un sapin
 * (feuillage à 5 cubes au-dessus de son sol, `BLOCS_DU_DECOR`) sur un relief qui monte de 2 blocs au plus dans le voisinage
 * des bornes, et deux de plus pour un relief ou un décor à venir.
 */
const HAUTEUR_MAX_DU_DECOR = 9;

/**
 * La portée, en cases : plus loin de la borne (en x ou en y), un cube du décor passe sous tous les rayons de la vue de
 * l'île, qui ne s'éloignent que de `hypot(dx, dy) / up` (1,1) case par bloc de montée ; une case de plus pour le feuillage,
 * qui déborde d'une case de son tronc.
 */
export const PORTEE_DEVANT_LA_BORNE = Math.ceil((HAUTEUR_MAX_DU_DECOR * Math.hypot(VUE_DE_L_ILE.dx, VUE_DE_L_ILE.dy)) / VUE_DE_L_ILE.up) + 1;

/** La case (x, y) est-elle assez près d'une borne pour qu'un décor posé là puisse la cacher (voir `PORTEE_DEVANT_LA_BORNE`) ? */
export function presDUneBorne(bornes: readonly BorneVue[], x: number, y: number, marge = 0): boolean {
  const p = PORTEE_DEVANT_LA_BORNE + marge;
  for (const b of bornes) if (Math.abs(x - b.x) <= p && Math.abs(y - b.y) <= p) return true;
  return false;
}

/**
 * Le cube (x, y, z) cache-t-il une borne dans la vue de l'île ? Un rayon part de chaque point de la borne vers la
 * caméra (vue de l'île, pivot compris) ; le cube, élargi de sa marge, ne doit en couper aucun. Seuls les cubes posés
 * près de la borne (`PORTEE_DEVANT_LA_BORNE`) et au-dessus de son sol sont essayés ; un cube que les rayons ne peuvent
 * atteindre à sa hauteur est écarté avant eux. Un cube collé à la borne, à sa hauteur, compte comme cachant quelle que
 * soit la direction de la vue : élargi de sa marge, il contient déjà des points de la borne.
 */
export function cacheUneBorne(bornes: readonly BorneVue[], vers: readonly [number, number, number], x: number, y: number, z: number): boolean {
  const m = MARGE_DEVANT_LA_BORNE;
  const minX = x - m;
  const minY = y - m;
  const minZ = z - m;
  const maxX = x + 1 + m;
  const maxY = y + 1 + m;
  const maxZ = z + 1 + m;
  const [vx, vy, vz] = vers;
  for (const b of bornes) {
    if (z + 1 <= b.base + 1 || Math.abs(x - b.x) > PORTEE_DEVANT_LA_BORNE || Math.abs(y - b.y) > PORTEE_DEVANT_LA_BORNE) continue;
    // Rejet précoce : les rayons montent ; à la hauteur du haut du cube, ils ne sont pas allés plus loin que `t` en x et en y.
    if (vz > 1e-9) {
      const t = (maxZ - b.base - PIED_DE_LA_BORNE) / vz;
      if (t < 0) continue;
      const bx0 = b.x + 0.05 + Math.min(0, vx * t);
      const bx1 = b.x + 0.95 + Math.max(0, vx * t);
      const by0 = b.y + 0.05 + Math.min(0, vy * t);
      const by1 = b.y + 0.95 + Math.max(0, vy * t);
      if (bx1 < minX || bx0 > maxX || by1 < minY || by0 > maxY) continue;
    }
    for (const [u, v, w] of POINTS_DE_LA_BORNE) {
      const ox = b.x + u;
      const oy = b.y + v;
      const oz = b.base + w;
      let t0 = 0;
      let t1 = Infinity;
      // Les trois dalles du cube, l'une après l'autre (x, y, puis la hauteur).
      for (let j = 0; j < 3 && t0 <= t1; j++) {
        const o = j === 0 ? ox : j === 1 ? oy : oz;
        const d = j === 0 ? vx : j === 1 ? vy : vz;
        const lo = j === 0 ? minX : j === 1 ? minY : minZ;
        const hi = j === 0 ? maxX : j === 1 ? maxY : maxZ;
        if (Math.abs(d) < 1e-9) {
          if (o < lo || o > hi) t0 = Infinity;
          continue;
        }
        const a = (lo - o) / d;
        const c = (hi - o) / d;
        t0 = Math.max(t0, Math.min(a, c));
        t1 = Math.min(t1, Math.max(a, c));
      }
      if (t0 <= t1) return true;
    }
  }
  return false;
}

const rangeesDevant = layoutCache<BiomeId, ReadonlySet<string>>();

/**
 * La rangée de côte devant les bornes d'une île-école (l'île de l'école de son archipel, `school`) : la première rangée
 * de côte hors du cœur, côté caméra (y = bord avant du cœur − 1), de la case droit devant la première borne jusqu'à celle
 * que traverse l'axe de la caméra de la vue de l'île (`versLaCamera`, pivot compris) depuis la dernière, une case de plus
 * de chaque côté. Aucun décor n'y est posé : rien de rouge ni de touffu entre l'élève et les bornes (DA, 01/10/2026 :
 * trois champignons rouges devant celles de la Forêt). Cases du monde (« x,y ») ; vide hors des îles-écoles.
 * La bande reste dans la portée des bornes (`PORTEE_DEVANT_LA_BORNE`), où `poserLIle` essaie chaque élément du décor.
 */
export function rangeeDevantLesBornes(id: BiomeId): ReadonlySet<string> {
  const connue = rangeesDevant.get(id);
  if (connue) return connue;
  const out = new Set<string>();
  if (isSchoolIsland(id)) {
    const def = islandDef(id);
    const y = coeurDe(def).y0 - 1;
    const [vx, vy] = versLaCameraDuDessin(id);
    for (const st of questStations(id)) {
      const bx = def.core.x + st.x + 0.5;
      const by = def.core.y + st.y + 0.5;
      // Où l'axe borne → caméra traverse le milieu de la rangée (la caméra est devant : vy < 0).
      const xr = vy < -1e-9 ? bx + (vx * (by - (y + 0.5))) / -vy : bx;
      const lo = Math.min(bx, xr) - 1.5;
      const hi = Math.max(bx, xr) + 1.5;
      for (let x = Math.ceil(lo - 0.5); x + 0.5 <= hi; x++) out.add(`${x},${y}`);
    }
  }
  rangeesDevant.set(id, out);
  return out;
}
