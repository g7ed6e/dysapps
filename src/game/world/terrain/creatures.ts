// Les créatures et les Gardiens dans le monde : leur modèle tourné, la place et les pas de la créature sur le sol libre
// de son île.
import { type BiomeId, BIOMES } from '../../biomes';
import type { CubeDeModele } from '../characters/ascii';
import { CREATURE_CUBES } from '../characters/creatures';
import { GUARDIAN_CUBES } from '../characters/guardians';
import { lv2Courante } from '../../../core/settings';
import { type ArchipelagoId, bornesDuCoeur, islandDef, landscape, margesDuCoeur, noise, tirage } from '../map';
import { DECOR, decorate } from '../decor';
import { zoneDesPlans } from '../plans';
import { isBiomeUnlocked, islandsOf } from '../archipelago';
import type { VoxelCube } from '../cube';
import { tournerLaDirection, tournerLeModelePose } from '../placement';
import { cacheUnLieu, lieuxVus, placeCells, portesDesLieux } from './village';
import { versLaCameraDuDessin } from './view';
import { AVATAR_HOME, groundHeight, islandOrigin, LAYOUT_PAD } from './base';
import { questStations } from './markers';
import { amorcesDuDessin } from './links';
import { cacheDeLaDisposition } from '../placement';

/** Les pas d'une créature qui se promène : une case à gauche ou en arrière (jamais vers les plans). */
export const CREATURE_STEPS: [number, number][] = [
  [0, 0],
  [-1, 0],
  [0, 1],
  [-1, 1],
];

/**
 * Les personnages en cubes tournés d'un quart de tour dans le monde (sens direct, vu d'en haut) : le visage, côté y = 0
 * du modèle, passe du côté des x croissants. Au Refuge des carnets, la caméra de l'île et celle de l'archipel pivotent à
 * fond vers l'ouest (`viewYaw`) et regardent l'île par son côté est : Timbre la regarde de trois quarts, et le Papillon
 * lui montre ses ailes de biais, jamais par la tranche (DA, retouches LV2-5). Orientation fixe, sans animation ; les
 * portraits (défi, bulle, panneau) gardent le modèle de face.
 */
export const QUARTS_DE_TOUR: Partial<Record<BiomeId, number>> = { 'lv2-3e-travel': 1 };

/**
 * Les créatures seules (pas leur Gardien) tournées d'un quart de tour de plus, même sens. Au Marché des proportions
 * (5e), Bazar est long (sept cases du museau à la queue) : de face, il n'a aucune place hors de la vue de la salle des
 * trophées (GD-3) ; tourné, il se tient derrière elle, le visage du côté des x croissants, celui de la caméra. Le quart
 * de tour dans l'autre sens lui ferait tourner le dos à la caméra (retouches de GD-3).
 */
export const QUARTS_DE_TOUR_DE_LA_CREATURE: Partial<Record<BiomeId, number>> = { 'maths-5e-proportionality': 1 };

function tourner(cubes: CubeDeModele[], quarts = 0): CubeDeModele[] {
  let out = cubes;
  for (let i = 0; i < quarts; i++) {
    const maxY = Math.max(...out.map((c) => c.y));
    out = out.map((c) => ({ ...c, x: maxY - c.y, y: c.x }));
  }
  return out;
}

const personnagesTournes = new Map<string, CubeDeModele[]>();

const tourne = (genre: 'creature' | 'gardien', id: BiomeId, cubes: CubeDeModele[]) => {
  const cle = `${genre}:${id}`;
  let t = personnagesTournes.get(cle);
  const quarts = (QUARTS_DE_TOUR[id] ?? 0) + (genre === 'creature' ? (QUARTS_DE_TOUR_DE_LA_CREATURE[id] ?? 0) : 0);
  if (!t) personnagesTournes.set(cle, (t = tourner(cubes, quarts)));
  return t;
};

/** La créature d'une île telle qu'elle se tient dans le monde (voir `QUARTS_DE_TOUR` et `QUARTS_DE_TOUR_DE_LA_CREATURE`). */
export const creatureDuMonde = (id: BiomeId): CubeDeModele[] => tourne('creature', id, CREATURE_CUBES[id]);

/** Le Gardien d'une île tel qu'il se tient sur son îlot (voir `QUARTS_DE_TOUR`). */
export const gardienDuMonde = (id: BiomeId): CubeDeModele[] => tourne('gardien', id, GUARDIAN_CUBES[id]);

// Par île et par LV2 : la place de la créature évite les bornes, dont le nombre suit la LV2 sur l'île de la LV2.
const creatureSpots = cacheDeLaDisposition<string, CreatureSpot>();

export interface CreatureSpot {
  x: number;
  y: number;
  /** Les pas qu'elle peut faire sans rien toucher (toujours au moins « rester là »). */
  steps: [number, number][];
}

/**
 * Où la créature d'une île se tient (case relative au cœur) : la place la plus proche de (2, 4) où elle et ses pas
 * ne touchent ni le décor, ni la zone des plans, ni le bonhomme, ni une colline, ni l'eau. On préfère une place
 * d'où elle peut se promener ; sinon elle reste immobile. Sur une île-école, ni elle ni ses pas ne se tiennent entre la
 * caméra de l'île et un lieu du village, l'emprise réservée de la salle des trophées comprise (`cacheUnLieu`) : devant
 * le cœur, aucune place ne la tient hors de leur vue, elle va derrière la salle, sur les quatre îles-écoles (à la Forêt
 * des sons, un arbre du décor lui a laissé la place : `DECOR.foret`) (GD-3, retouches du directeur artistique).
 */
export function creatureSpot(id: BiomeId): CreatureSpot {
  const cle = `${id}:${lv2Courante()}`;
  const known = creatureSpots.get(cle);
  if (known) return known;
  const free = solLibre(id);
  const cubes = creatureDuMonde(id);
  const lieux = lieuxVus(id);
  const vers = versLaCameraDuDessin(id);
  const coeur = bornesDuCoeur(islandDef(id));
  // La créature se tient sur le sol de l'île (z = 1 au-dessus, comme les lieux, sur un sol plat : voir `solLibre`).
  const libre = (x: number, y: number, [sx, sy]: [number, number]) => cubes.every((c) => free(x + sx + c.x, y + sy + c.y));
  /** Un cube de la créature (au pas `st`) se tient-il entre la caméra et un lieu du village ? */
  const cache = (x: number, y: number, [sx, sy]: [number, number]) => cubes.some((c) => cacheUnLieu(lieux, vers, x + sx + c.x, y + sy + c.y, c.z + 1));
  const fits = (x: number, y: number, st: [number, number]) => libre(x, y, st) && !cache(x, y, st);
  let best: CreatureSpot | null = null;
  let bestScore = Infinity;
  for (let x = coeur.x0 - 2; x < coeur.x1; x++) {
    for (let y = coeur.y0; y < coeur.y1; y++) {
      if (!fits(x, y, [0, 0])) continue;
      const steps = CREATURE_STEPS.filter((st) => fits(x, y, st));
      const score = Math.abs(x - 2) + Math.abs(y - 4) - 2 * (steps.length - 1);
      if (score < bestScore) {
        best = { x, y, steps };
        bestScore = score;
      }
    }
  }
  const spot = best ?? { x: 2, y: 4, steps: [[0, 0]] };
  creatureSpots.set(cle, spot);
  return spot;
}

// Par île et par LV2 : le sol libre où la créature et la petite construction de sa commande peuvent se poser.
const solsLibres = cacheDeLaDisposition<string, (x: number, y: number) => boolean>();

/**
 * Les cases du sol d'une île (relatives au cœur) où rien n'est posé : ni le décor, ni les bornes et leur pourtour, ni la
 * zone des plans, ni la place du bonhomme, ni un lieu ou la case devant sa porte, ni un ouvrage et ses abords, ni une
 * colline, ni l'eau. Hors du cœur, la terre plate et nue seulement.
 */
export function solLibre(id: BiomeId): (x: number, y: number) => boolean {
  const cle = `${id}:${lv2Courante()}`;
  const known = solsLibres.get(cle);
  if (known) return known;
  const index = BIOMES.findIndex((b) => b.id === id);
  const def = islandDef(id);
  const blocked = new Set<string>();
  DECOR[id](
    (x, y) => blocked.add(`${x + LAYOUT_PAD.x},${y + LAYOUT_PAD.y}`),
    (x, y) => groundHeight(index, x + LAYOUT_PAD.x, y + LAYOUT_PAD.y),
  );
  for (const st of questStations(id)) for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) blocked.add(`${st.x + dx},${st.y + dy}`);
  const zone = zoneDesPlans(id);
  for (let x = zone.x; x < zone.x + zone.w; x++) for (let y = zone.y; y < zone.y + zone.h; y++) blocked.add(`${x},${y}`);
  for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) blocked.add(`${AVATAR_HOME.x + dx},${AVATAR_HOME.y + dy}`);
  for (const k of placeCells(id)) blocked.add(k);
  // … ni sur la case devant la porte d'un lieu, où le bonhomme s'arrête.
  for (const k of portesDesLieux(id)) blocked.add(k);
  // Ni sur un ouvrage qui part de l'île, ni à côté (sa rampe, son pied sur la côte).
  for (const { cases } of amorcesDuDessin(id)) for (const c of cases) for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) blocked.add(`${c.x + dx},${c.y + dy}`);
  // Le décor des marges du cœur (un cœur agrandi) : la créature ne s'y pose pas.
  for (const m of margesDuCoeur(def)) if (m.decor) blocked.add(`${m.x - def.core.x},${m.y - def.core.y}`);
  const coeur = bornesDuCoeur(def);
  for (let x = coeur.x0; x < coeur.x1; x++) for (let y = coeur.y0; y < coeur.y1; y++) if (groundHeight(index, x, y) > 0) blocked.add(`${x},${y}`);
  // Hors du cœur : la terre plate et nue seulement (pas l'eau, pas un arbre, pas une pente).
  const scenery = new Map(landscape(def).map((c) => [`${c.x - def.core.x},${c.y - def.core.y}`, c]));
  // … ni sous la couronne d'un arbre de la côte ou des marges, qui déborde de son tronc (le décor tel que l'île le pose).
  for (const c of [...scenery.values(), ...margesDuCoeur(def)]) {
    if (!c.decor) continue;
    const t = tirage(def, c.x, c.y);
    decorate((x, y) => blocked.add(`${x - def.core.x},${y - def.core.y}`), c.decor, c.x, c.y, noise(def.seed + 5, t.x, t.y));
  }
  const free = (x: number, y: number) => {
    if (blocked.has(`${x},${y}`)) return false;
    if (x >= coeur.x0 && y >= coeur.y0 && x < coeur.x1 && y < coeur.y1) return true;
    const c = scenery.get(`${x},${y}`);
    return Boolean(c) && c!.h === 0 && !c!.decor && c!.ground !== 'eau' && c!.ground !== 'lave';
  };
  solsLibres.set(cle, free);
  return free;
}

/** Les créatures des îles ouvertes : cubes relatifs et position de leur coin dans le monde (elles sont animées à part). */
export function creaturePlacements(
  a: ArchipelagoId,
  bridges: string[],
): { id: BiomeId; cubes: VoxelCube[]; origin: { x: number; y: number; z: number }; steps: [number, number][] }[] {
  return islandsOf(a)
    .filter((b) => isBiomeUnlocked(b.id, bridges))
    .map((b) => {
      const { ox, oy, oz } = islandOrigin(BIOMES.indexOf(b));
      const spot = creatureSpot(b.id);
      // Sur le lieu tourné (GD-9), la créature et ses pas tournent avec lui.
      const def = islandDef(b.id);
      const pose = tournerLeModelePose(def.core, { x: ox + spot.x, y: oy + spot.y, z: oz + 1 }, creatureDuMonde(b.id), def.quarts);
      const steps = spot.steps.map(([dx, dy]): [number, number] => {
        const t = tournerLaDirection(dx, dy, def.quarts);
        return [t.dx, t.dy];
      });
      return { id: b.id, cubes: pose.cubes as VoxelCube[], origin: pose.origine, steps };
    });
}
