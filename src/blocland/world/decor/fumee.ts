// La fumée du décor d'Archipéo (lot R4) : une seule règle pour toutes les fumées des quatre archipels (le volcan, le
// haut-fourneau), celle de la fiche de famille. Son mouvement (plus doux, plus pâle la nuit) se règle en R4b-6e.
import type { VoxelCube } from '../cube';
import { mixColor } from '../daylight';
import { SMOKE } from '../decor';
import type { Faces } from '../palette';
import { clamp, hex, icosaedre, rgb, type Peindre, type Pinceau, type RGB } from './pinceau';
import { lineaire } from '../landMesh';

/** La fumée : chaque volute plus grosse que la précédente de `FUMEE.croissance` (de la première), dérivée sous le vent
 * comme le carré de son rang ; les dernières se fondent dans l'horizon (`FUMEE.fondu`), comme plus transparentes. */
export const FUMEE = { croissance: 0.35, fondu: 0.3, volutes: 3 } as const;

/** La couleur de la fumée, claire, à peine ombrée. */
const FACES_DE_FUMEE: Faces = { dessus: mixColor(hex(SMOKE), 0xffffff, 0.35), cote: mixColor(hex(SMOKE), 0x9aa4b0, 0.3) };

/** La fumée : claire, à peine ombrée (une volute, pas un rocher). */
function vaporeux(f: Faces, voile: RGB, fondu: number): Peindre {
  const dessus = rgb(f.dessus);
  const cote = rgb(f.cote);
  return (_, n) => {
    const w = clamp(0.75 + 0.35 * n[1], 0, 1);
    return [0, 1, 2].map((j) => {
      const v = cote[j] + (dessus[j] - cote[j]) * w;
      return lineaire((v + (voile[j] - v) * fondu) / 255);
    }) as RGB;
  };
}

/** Les volutes d'une fumée, du bas de ses cubes au dernier : le vent, et la montée. */
export function bouffees(P: Pinceau, list: VoxelCube[], hasard: () => number, rot: number, horizon: RGB): void {
  if (!list.length) return;
  const tri = [...list].sort((p, q) => p.z - q.z);
  const n = tri.length;
  const [d, f] = [tri[0], tri[n - 1]];
  const k2 = Math.max(1, (n - 1) * (n - 1));
  const vx = (f.x - d.x) / k2;
  const vz = (f.y - d.y) / k2;
  const r0 = 0.42;
  let y = d.z + 0.5;
  for (let k = 0; k < n; k++) {
    const r = r0 * (1 + FUMEE.croissance * k);
    if (k > 0) y += 0.55 * (r + r0 * (1 + FUMEE.croissance * (k - 1)));
    const fondu = FUMEE.fondu * clamp((k - (n - 1 - FUMEE.volutes)) / FUMEE.volutes, 0, 1);
    icosaedre(P, [d.x + 0.5 + vx * k * k, y, d.y + 0.5 + vz * k * k], r, 0.85, 0.16, hasard, vaporeux(FACES_DE_FUMEE, horizon, fondu), rot + k);
  }
}
