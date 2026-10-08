// La place des îlots des Gardiens au large de chaque île, sans leur contenu (./guardians.ts).
import { coeurDe, COTE_DU_COEUR, islandDef, type IslandDef } from '../map';
import { type BiomeId, BIOMES } from '../../biomes';
import { chosenGuardian, type GuardianPose, type Quarts, turnDirection, turnPoint, turnRectangle } from '../placement';

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
  const def = islandDef(id);
  const o = origineDeLIlot(def);
  // Le milieu de la case du centre de l'îlot, déplacé avec lui (GD-9, `deplacementDeLIlot`), tourné avec le lieu ;
  // sans rotation ni déplacement, le point d'avant.
  const d = deplacementDeLIlot(def);
  const p = d ? pointDeLIlotDeplace(d, o.x + ISLET_CENTER.x + 0.5, o.y + ISLET_CENTER.y + 0.5) : { x: o.x + ISLET_CENTER.x + 0.5, y: o.y + ISLET_CENTER.y + 0.5 };
  const m = turnPoint(p.x - def.core.x, p.y - def.core.y, def.quarts);
  return { x: def.core.x + m.x - 0.5, y: def.core.y + m.y - 0.5, z: o.z + 2.6 };
}

/**
 * Le rectangle de l'îlot du Gardien d'un lieu dans le monde (`ISLET_W` × `ISLET_H` cases), le lieu tourné : son emprise
 * avec celle de sa terre (GD-9).
 */
export function rectangleDeLIlot(def: IslandDef): { x0: number; y0: number; x1: number; y1: number } {
  const o = origineDeLIlot(def);
  const r = turnRectangle({ x0: o.x - def.core.x, y0: o.y - def.core.y, x1: o.x - def.core.x + ISLET_W, y1: o.y - def.core.y + ISLET_H }, def.quarts);
  return { x0: def.core.x + r.x0, y0: def.core.y + r.y0, x1: def.core.x + r.x1, y1: def.core.y + r.y1 };
}

/**
 * Le rectangle de l'îlot du Gardien d'un lieu autour de lui (GD-9, `LayoutGuardian`), le lieu posé mais pas tourné : sur
 * un des quatre côtés du lieu (dans son repère), à la même distance de sa terre qu'aujourd'hui (`ISLET_GAP`), et à
 * `step` pas le long de ce côté depuis sa place d'aujourd'hui (devant : au droit du bord gauche du cœur ; sur les
 * autres côtés, au droit du bord avant ou gauche du cœur). Devant, au pas 0, c'est sa place de la carte de départ.
 */
export function rectangleDeLIlotAutour(def: IslandDef, g: Pick<GuardianPose, 'side' | 'step'>): { x0: number; y0: number; x1: number; y1: number } {
  const c = coeurDe(def);
  const glisse = glisseDeLIlot(def.id);
  const pas = g.step * 4;
  if (g.side === 'front') {
    const y0 = c.y0 - def.ext.front - ISLET_H - ISLET_GAP + reculDeLIlot(def.id);
    return { x0: c.x0 - glisse + pas, y0, x1: c.x0 - glisse + pas + ISLET_W, y1: y0 + ISLET_H };
  }
  if (g.side === 'back') {
    const y0 = c.y1 + def.ext.back + ISLET_GAP;
    return { x0: c.x0 - glisse + pas, y0, x1: c.x0 - glisse + pas + ISLET_W, y1: y0 + ISLET_H };
  }
  if (g.side === 'left') {
    const x0 = c.x0 - def.ext.left - ISLET_GAP - ISLET_H;
    return { x0, y0: c.y0 + pas, x1: x0 + ISLET_H, y1: c.y0 + pas + ISLET_W };
  }
  const x0 = c.x1 + def.ext.right + ISLET_GAP;
  return { x0, y0: c.y0 + pas, x1: x0 + ISLET_H, y1: c.y0 + pas + ISLET_W };
}

/** La direction vers la terre de son lieu d'un îlot posé sur un côté (le lieu pas tourné). */
const VERS_LA_TERRE: Readonly<Record<GuardianPose['side'], { dx: number; dy: number }>> = {
  front: { dx: 0, dy: 1 },
  back: { dx: 0, dy: -1 },
  left: { dx: 1, dy: 0 },
  right: { dx: -1, dy: 0 },
};

/**
 * L'îlot d'un Gardien déplacé autour de son lieu (GD-9) : le quart de tour qui l'emporte de devant vers son côté, et
 * le milieu de l'îlot avant et après, le lieu posé mais pas tourné. `null` : il est à sa place de départ (devant, au
 * pas 0). L'îlot garde exactement son dessin : il tourne d'un bloc et se pose dans son rectangle (`rectangleDeLIlotAutour`).
 */
export interface DeplacementDeLIlot {
  q: Quarts;
  de: { x: number; y: number };
  vers: { x: number; y: number };
  /** La direction vers la terre de son lieu, depuis l'îlot. */
  versLaTerre: { dx: number; dy: number };
  /** Détaché de son lieu (choix 4a du mainteneur) : ni pas japonais, ni rien qui suive son lieu. */
  detache?: boolean;
}

export function deplacementDeLIlot(def: IslandDef): DeplacementDeLIlot | null {
  const g = chosenGuardian(def.id);
  if (!g || (g.side === 'front' && g.step === 0 && !g.at)) return null;
  const o = origineDeLIlot(def);
  if (g.at) {
    // Détaché (choix 4a) : posé de face à sa place du monde, quoi que fasse son lieu. Le terrain tourne l'îlot avec son
    // lieu (`def.quarts`) : on le tourne d'autant à rebours, et son milieu est ramené dans le repère du lieu pas tourné.
    const q = ((4 - def.quarts) % 4) as Quarts;
    const m = turnPoint(g.at.x + ISLET_W / 2 - def.core.x, g.at.y + ISLET_H / 2 - def.core.y, q);
    return { q, de: { x: o.x + ISLET_W / 2, y: o.y + ISLET_H / 2 }, vers: { x: def.core.x + m.x, y: def.core.y + m.y }, versLaTerre: { dx: 0, dy: 1 }, detache: true };
  }
  const r = rectangleDeLIlotAutour(def, g);
  const versLaTerre = VERS_LA_TERRE[g.side];
  const q = ([0, 1, 2, 3] as Quarts[]).find((k) => {
    const d = turnDirection(0, 1, k);
    return d.dx === versLaTerre.dx && d.dy === versLaTerre.dy;
  })!;
  return { q, de: { x: o.x + ISLET_W / 2, y: o.y + ISLET_H / 2 }, vers: { x: (r.x0 + r.x1) / 2, y: (r.y0 + r.y1) / 2 }, versLaTerre };
}

/** Un point de l'îlot à sa place de départ, là où le déplacement l'emporte. */
export function pointDeLIlotDeplace(d: DeplacementDeLIlot, x: number, y: number): { x: number; y: number } {
  const v = turnDirection(x - d.de.x, y - d.de.y, d.q);
  return { x: d.vers.x + v.dx, y: d.vers.y + v.dy };
}

/** Une case de l'îlot à sa place de départ, là où le déplacement l'emporte. */
export function caseDeLIlotDeplace(d: DeplacementDeLIlot, x: number, y: number): { x: number; y: number } {
  const p = pointDeLIlotDeplace(d, x + 0.5, y + 0.5);
  return { x: Math.floor(p.x), y: Math.floor(p.y) };
}
