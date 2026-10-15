// La pose d'une partie du bâtiment en vague (GD-6, Blocland, piste B choisie par le mainteneur le 3 octobre 2026) :
// couche par couche, du bas vers le haut, les cubes de la partie descendent l'un après l'autre, chacun avec le geste de
// pose (./pose.ts : 1,5 case, 360 ms, arrêt net, sans rebond). Un « clac » par couche, pas un par cube ; la phrase et le
// carillon viennent après le dernier cube. Le tout tient en six secondes au plus : l'écart entre deux cubes se resserre
// pour une grande partie.
// Dans Archipéo (choix « 2c » du mainteneur, 4 octobre 2026), le même rythme fait un fondu : les cubes de la partie sont
// là dès la première image, en pierre des ruines (`FONDU.pierre`), et chacun passe à la couleur du plan, sans bouger,
// à son départ (`avanceeDuFondu`) ; un « toc » par couche. Le maillage du fondu est dans ./fadeMesh.ts.
// Calcul pur, sans Three.js : l'ordre, les départs, les couches ; le maillage est dans ./waveMesh.ts, que seule
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

/**
 * Le fondu de la pose (Archipéo, intention du directeur artistique du 4 octobre 2026) : la pierre des ruines, opaque,
 * d'où part chaque cube, et la durée de son passage à la couleur du plan, celle du geste de Blocland (le même rythme).
 */
export const FONDU = { pierre: 0x7d8a86, dureeMs: GESTE_DE_POSE.dureeMs } as const;

/**
 * L'avancée du fondu du cube de rang `rang` (dans l'ordre) à `ms` : 0 avant son départ (la pierre), 1 une fois passé
 * (la couleur du plan) ; entre les deux, une sortie douce (cubique), qui ne dépasse jamais 1.
 */
export function avanceeDuFondu(plan: PlanDeLaVague, rang: number, ms: number): number {
  const x = Math.min(1, Math.max(0, (ms - plan.departs[rang]) / FONDU.dureeMs));
  return 1 - (1 - x) ** 3;
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
  const dans = surLesCases(cases);
  return cubes.filter((c) => !c.ghost && dans(c));
}

/** Le monde sans la partie, tant que la vague ne l'a pas posée : ses cases restent vides (ni bloc, ni fantôme). */
export function sansLaPartie(cubes: readonly VoxelCube[], cases: ReadonlySet<string>): VoxelCube[] {
  const dans = surLesCases(cases);
  return cubes.filter((c) => !dans(c));
}

/**
 * Un cube est-il sur une des cases (« x,y,z ») ? Les x des cases d'abord, en nombres : le monde a des dizaines de
 * milliers de cubes, la partie quelques colonnes, et la clé d'un cube ne se construit que dans l'une d'elles.
 */
function surLesCases(cases: ReadonlySet<string>): (c: VoxelCube) => boolean {
  const xs = new Set<number>();
  for (const k of cases) xs.add(Number(k.slice(0, k.indexOf(','))));
  return (c) => xs.has(c.x) && cases.has(`${c.x},${c.y},${c.z}`);
}
