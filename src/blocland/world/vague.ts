// La pose d'une partie du bâtiment en vague (GD-6, Blocland, piste B choisie par le mainteneur le 3 octobre 2026) :
// couche par couche, du bas vers le haut, les cubes de la partie descendent l'un après l'autre, chacun avec le geste de
// pose (./pose.ts : 1,5 case, 360 ms, arrêt net, sans rebond). Un « clac » par couche, pas un par cube ; la phrase et le
// carillon viennent après le dernier cube. Le tout tient en six secondes au plus : l'écart entre deux cubes se resserre
// pour une grande partie.
// Calcul pur, sans Three.js : l'ordre, les départs, les couches ; le maillage est dans ./maillageDeLaVague.ts, que seule
// la 3D charge (three/cubes.ts ne fait que lire le temps et déplacer ses sommets). La page du monde ne lit ici que les
// cases de la partie, sans le mailleur : il reste dans le paquet de la 3D, chargé à la demande.
import type { VoxelCube } from './cube';
import { GESTE_DE_POSE, hauteurDuGeste } from './pose';

type Case = { x: number; y: number; z: number };

export const VAGUE = {
  /** L'écart entre deux cubes qui se suivent (ms), de 30 à 50 ms dans le concept retenu. */
  ecartMs: 40,
  /** Entre deux couches, une respiration de deux écarts de plus : la couche se lit. */
  pauseEntreCouches: 2,
  /** Le temps de voir l'île avant le premier cube (ms). */
  attenteMs: 500,
  /** Entre l'arrêt du dernier cube et le carillon (ms) : le dernier « clac » ne le couvre pas. */
  finApresMs: 250,
  /** Du départ du premier cube au carillon, au plus (ms) : au-delà, l'écart se resserre. */
  dureeMaxMs: 6000,
} as const;

export interface PlanDeLaVague {
  /** Les cubes reçus, dans l'ordre de la vague : leurs indices. */
  ordre: number[];
  /** Le départ de chaque cube de l'ordre (ms depuis le début, attente comprise). */
  departs: number[];
  /** Le moment où chaque couche est posée (l'arrêt de son dernier cube), du bas vers le haut : un « clac » chacune. */
  couches: number[];
  /** Le moment du carillon et de la phrase : la vague est finie. */
  finMs: number;
  /** L'écart retenu entre deux cubes (ms). */
  ecartMs: number;
}

/**
 * L'ordre et le rythme de la vague : par couche (z) du bas vers le haut ; dans une couche, du fond vers l'avant (la
 * façade est côté caméra, y bas), puis de gauche à droite. Le départ du cube `i` de la couche `k` tombe à
 * `attente + écart × (i + pause × k)` ; l'écart se resserre si la vague dépassait `dureeMaxMs`.
 */
export function planDeLaVague(cases: readonly Case[]): PlanDeLaVague {
  const ordre = cases.map((_, i) => i).sort((a, b) => cases[a].z - cases[b].z || cases[b].y - cases[a].y || cases[a].x - cases[b].x);
  if (!ordre.length) return { ordre, departs: [], couches: [], finMs: 0, ecartMs: 0 };
  const couche: number[] = [];
  let k = 0;
  ordre.forEach((c, i) => {
    if (i > 0 && cases[c].z !== cases[ordre[i - 1]].z) k += 1;
    couche.push(k);
  });
  const unites = ordre.length - 1 + VAGUE.pauseEntreCouches * k;
  const place = VAGUE.dureeMaxMs - GESTE_DE_POSE.dureeMs - VAGUE.finApresMs;
  const ecartMs = unites > 0 ? Math.min(VAGUE.ecartMs, place / unites) : 0;
  const departs = ordre.map((_, i) => VAGUE.attenteMs + ecartMs * (i + VAGUE.pauseEntreCouches * couche[i]));
  const couches: number[] = [];
  departs.forEach((d, i) => {
    if (i === departs.length - 1 || couche[i + 1] !== couche[i]) couches.push(d + GESTE_DE_POSE.dureeMs);
  });
  return { ordre, departs, couches, finMs: couches[couches.length - 1] + VAGUE.finApresMs, ecartMs };
}

/** Combien de couches sont posées à `ms` (de 0 à toutes). */
export function couchesPosees(plan: PlanDeLaVague, ms: number): number {
  let n = 0;
  while (n < plan.couches.length && plan.couches[n] <= ms) n += 1;
  return n;
}

/** Combien de cubes de l'ordre sont partis à `ms` : les premiers de l'ordre, les seuls dessinés. */
export function cubesPartis(plan: PlanDeLaVague, ms: number): number {
  let n = 0;
  while (n < plan.departs.length && plan.departs[n] <= ms) n += 1;
  return n;
}

/** La hauteur du cube de rang `rang` (dans l'ordre) au-dessus de sa case, à `ms` : le geste de pose, 0 une fois posé. */
export const hauteurDansLaVague = (plan: PlanDeLaVague, rang: number, ms: number): number => hauteurDuGeste(ms - plan.departs[rang]);

/** Les cubes de la partie, à poser en vague : ceux de `cubes` (en dur) qui tombent sur ses cases. */
export function cubesDeLaVague(cubes: readonly VoxelCube[], cases: ReadonlySet<string>): VoxelCube[] {
  return cubes.filter((c) => !c.ghost && cases.has(`${c.x},${c.y},${c.z}`));
}

/** Le monde sans la partie, tant que la vague ne l'a pas posée : ses cases restent vides (ni bloc, ni fantôme). */
export function sansLaPartie(cubes: readonly VoxelCube[], cases: ReadonlySet<string>): VoxelCube[] {
  return cubes.filter((c) => !cases.has(`${c.x},${c.y},${c.z}`));
}
