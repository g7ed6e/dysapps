// La couleur et l'éclairage des facettes du sol : l'espace linéaire, la nuance des dessus, les strates des falaises,
// l'éclairement d'une face et sa normale ombrée.
import { clamp, smooth } from '../../../core/math';
import { bruit } from '../style';
import { type ArchipelagoId, graineDuDessin } from '../map';
import { cielDe, type Couleur, SOLEIL_DIRECTION } from '../palette';
import { mixColor } from '../daylight';
import { NUANCE_SOL, PENTE_OMBRE, STRATES, TACHES } from './settings';
import type { RGB, V3 } from './polygons';

/** sRGB (0..1) vers l'espace linéaire de Three.js, par une table (4 096 pas : sous la précision d'un écran). */
const LINEAIRE = Float32Array.from({ length: 4097 }, (_, i) => {
  const v = i / 4096;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
});

/** Une composante sRGB (0..1) dans l'espace linéaire de Three.js. */
export const lineaire = (v: number) => LINEAIRE[Math.round(clamp(v, 0, 1) * 4096)];

/** La nuance d'un sommet (option b sur les facettes) : plus sombre vers la mer, des taches sur les dessus. */
export function nuanceDuSol(x: number, y: number, z: number, dessus: boolean, altitude: number): number {
  const hauteur = 0.82 + 0.2 * smooth(clamp((y - altitude + 1) / 12, 0, 1));
  const taches = dessus ? 1 + TACHES * (bruit(x / 9, z / 9) * 2 - 1) : 1;
  return clamp(hauteur * taches, NUANCE_SOL[0], NUANCE_SOL[1]);
}

/** L'épaisseur des strates d'une île : 2 ou 3 blocs, tirée une fois par île. */
export function epaisseurDesStrates(ile: string): 2 | 3 {
  const graine = graineDuDessin(ile);
  let h = 2166136261;
  for (let i = 0; i < graine.length; i++) h = Math.imul(h ^ graine.charCodeAt(i), 16777619);
  return (h >>> 0) % 2 === 0 ? 2 : 3;
}

/** La strate d'un cube de falaise (z entier) : une tranche sur deux plus claire, de `epaisseur` blocs. */
export function strate(z: number, epaisseur = 2, amplitude = STRATES): number {
  return Math.floor(z / epaisseur) % 2 === 0 ? 1 + amplitude : 1 - amplitude;
}

const luminanceLineaire = (c: Couleur) =>
  0.2126 * lineaire(((c >> 16) & 255) / 255) + 0.7152 * lineaire(((c >> 8) & 255) / 255) + 0.0722 * lineaire((c & 255) / 255);

/**
 * La lumière que reçoit une facette de normale `n` (unitaire), de jour, telle que la vue 3D l'éclaire : l'ambiance du
 * ciel et du sol (selon qu'elle regarde en haut ou en bas) et le soleil (`SOLEIL_DIRECTION`). Pour comparer, pas pour
 * peindre.
 */
export function eclairement(a: ArchipelagoId, n: V3): number {
  const c = cielDe(a, 1);
  const w = 0.5 * n[1] + 0.5;
  const len = Math.hypot(...SOLEIL_DIRECTION);
  const dot = (n[0] * SOLEIL_DIRECTION[0] + n[1] * SOLEIL_DIRECTION[1] + n[2] * SOLEIL_DIRECTION[2]) / len;
  return luminanceLineaire(mixColor(c.ambianceSol, c.ambianceCiel, w)) * c.ambianceForce + luminanceLineaire(c.soleil) * c.soleilForce * Math.max(0, dot);
}

/**
 * La normale d'éclairage d'une pente : sa vraie normale si elle reçoit au moins `PENTE_OMBRE` de la lumière d'un dessus
 * plat, sinon redressée vers le ciel juste ce qu'il faut. La facette garde sa forme (le toucher lit la vraie normale) et
 * reste une facette, seulement moins sombre à l'ombre. (Éclaircir sa couleur ne suffirait pas : le soleil de la palette
 * compte trois fois plus que l'ambiance, une pente raide à l'ombre saturerait avant d'y arriver.)
 */
export function normaleOmbree(a: ArchipelagoId, n: V3): V3 {
  const cible = PENTE_OMBRE * eclairement(a, [0, 1, 0]);
  if (eclairement(a, n) >= cible) return n;
  // (Un rien au-dessus : la normale est ensuite rangée en nombres à virgule simple précision.)
  const vise = cible * 1.003;
  const vers = (w: number): V3 => {
    const v: V3 = [n[0] * (1 - w), n[1] * (1 - w) + w, n[2] * (1 - w)];
    const l = Math.hypot(...v);
    return [v[0] / l, v[1] / l, v[2] / l];
  };
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (eclairement(a, vers(mid)) >= vise) hi = mid;
    else lo = mid;
  }
  return vers(hi);
}

export const rgb = (c: Couleur): RGB => [(c >> 16) & 255, (c >> 8) & 255, c & 255];

/** La distance entre deux couleurs (canaux 0..255). */
export function ecartDeCouleur(a: Couleur, b: Couleur): number {
  const p = rgb(a);
  const q = rgb(b);
  return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
}
