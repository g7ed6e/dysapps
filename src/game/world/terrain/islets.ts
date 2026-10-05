// La place des îlots des Gardiens au large de chaque île, sans leur contenu (./gardiens.ts).
import { coeurDe, COTE_DU_COEUR, islandDef, type IslandDef } from '../map';
import { type BiomeId, BIOMES } from '../../biomes';

/** L'îlot du Gardien : une petite île devant la sienne (côté caméra), tenue dans ISLET_W × ISLET_H cases (les Gardiens font jusqu’à 9 × 8). */
export const ISLET_W = 13;

export const ISLET_H = 12;

/** Cases d'eau entre l'îlot et la terre de son île : les pas japonais les franchissent. */
export const ISLET_GAP = 3;

/** Centre de l'îlot (coordonnées locales) : le Gardien s'y dresse, au milieu de l'arène. */
export const ISLET_CENTER = { x: 6, y: 5.5 };

/** Demi-axes de l'arène pavée (un carré aux coins arrondis, plus petit que le Gardien : il déborde sur l'herbe). */
export const ARENA = { rx: 4.5, ry: 4 };

export function bossIsletOrigin(index: number): { x: number; y: number; z: number } {
  return origineDeLIlot(islandDef(BIOMES[index].id));
}

/**
 * Sur une île au cœur agrandi (`COTE_DU_COEUR`), l'îlot glisse de tant de cases vers la gauche, sur sa rangée : le
 * Gardien quitte l'axe de la caméra vers le cœur (créature, école, salle des trophées) et se tient devant la côte
 * gauche, l'eau s'ouvre en biais entre l'îlot et la terre (relecture du DA, 01/10/2026). À gauche sur les quatre
 * îles-écoles : à droite, le navire est à quai au Marché et à l'Atelier.
 */
export const ILOT_DE_COTE = 9;

/**
 * Les retouches de l'îlot d'une île-école, pour qu'il ait au moins trois cases d'eau de tous les côtés et se lise comme
 * celui de son île, plus près de sa côte que de toute autre terre (relectures du 01/10/2026, un test le tient) :
 * `glisse` remplace `ILOT_DE_COTE` ; `recul`, de combien de cases il se rapproche de sa terre ; `rogne`, combien de ses
 * rangées de devant il perd, hors de l'emprise de son Gardien. La Forêt : la Plaine, devant à droite, frôlait la
 * pointe de l'îlot (deux cases d'eau) ; il recule d'une case vers sa côte et perd sa rangée de devant. L'Atelier : la
 * Forge, à gauche, était plus près de l'îlot que l'Atelier lui-même ; il glisse de 7 cases au lieu de 9.
 */
export const RETOUCHES_DE_L_ILOT: Readonly<Partial<Record<BiomeId, Readonly<{ glisse?: number; recul?: number; rogne?: number }>>>> = Object.freeze({
  'french-6e-phonology': Object.freeze({ recul: 1, rogne: 1 }),
  'maths-4e-algebra': Object.freeze({ glisse: 7 }),
});

/**
 * Le coin de l'îlot du Gardien d'une île (voir `bossIsletOrigin`), pour qui tient déjà sa définition : devant la terre
 * de l'île, au droit du bord gauche de son cœur (`coeurDe`) et au-delà de sa côte ; il suit le cœur quand il grandit,
 * et glisse sur le côté s'il est agrandi (`ILOT_DE_COTE`, `RETOUCHES_DE_L_ILOT`), sans s'avancer vers la caméra.
 */
export function origineDeLIlot(def: IslandDef): { x: number; y: number; z: number } {
  const c = coeurDe(def);
  return { x: c.x0 - glisseDeLIlot(def.id), y: c.y0 - def.ext.front - ISLET_H - ISLET_GAP + reculDeLIlot(def.id), z: def.altitude };
}

/** De combien de cases l'îlot d'une île a glissé sur le côté (`ILOT_DE_COTE`) : sa côte et son décor restent tirés là où il était. */
export function glisseDeLIlot(id: BiomeId): number {
  return COTE_DU_COEUR[id] ? (RETOUCHES_DE_L_ILOT[id]?.glisse ?? ILOT_DE_COTE) : 0;
}

/** De combien de cases l'îlot d'une île s'est rapproché de sa terre (`RETOUCHES_DE_L_ILOT`) : même dessin. */
export function reculDeLIlot(id: BiomeId): number {
  return RETOUCHES_DE_L_ILOT[id]?.recul ?? 0;
}

/**
 * Le milieu de l'îlot du Gardien, en cases du monde, sous la mi-hauteur de sa sentinelle : la caméra du rallumage vise
 * un bloc au-dessus (lot 6), au milieu d'une sentinelle de 5,2 blocs posée sur l'îlot (DA-5 :
 * world/characters/sentinel.ts, `HAUTEUR_DANS_LE_MONDE` ; un test y tient les deux ensemble).
 */
export function bossIsletCenter(id: BiomeId): { x: number; y: number; z: number } {
  const o = bossIsletOrigin(BIOMES.findIndex((b) => b.id === id));
  return { x: o.x + ISLET_CENTER.x, y: o.y + ISLET_CENTER.y, z: o.z + 2.6 };
}
