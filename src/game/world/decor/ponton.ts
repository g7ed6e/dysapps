// Le ponton d'Archipéo, commun à deux archipels : un tablier de planches au ras de l'eau, vers le large (+x), sur quatre
// pieux, et une échelle au rivage. Deux usages du même mot, à ne pas confondre :
// - au Relais des voyageurs (5e), une forme hors de la grille (`FORMES_HORS_GRILLE_5E.ponton`, ./5e.ts), posée sans cube ;
// - au Jardin des heures (4e), un décor de la grille (« ponton@x,y », ../decor.ts, `pontonEtBarque`) : ses cubes de
//   Blocland (l'échelle, le tablier, la barque, le pilier de pierre), qu'Archipéo redessine (`RETOUCHES_4E.ponton`, ./4e.ts).
import { mixColor } from '../daylight';
import { NIVEAU_EAU } from '../landMesh';
import type { Couleur, Faces } from '../palette';
import { boite, DELAVE, eclaircir, peintre, tronconique, type Pinceau } from './pinceau';

/** Le bois du ponton : les planches du tablier, les pieux et l'échelle (DA, LV2-2). */
export const COULEURS_DU_PONTON = { planche: 0x9c7c4b, poteau: 0x6e5234 } as const;

const PONTON = { long: 3.2, large: 1.1, dessus: NIVEAU_EAU + 0.5, planche: 0.14, pieu: 0.09 } as const;

/** Les deux faces d'une couleur : un dessus un peu plus clair ; délavées si l'île est fermée. */
function faces(c: Couleur, muted: boolean): Faces {
  const f = { dessus: eclaircir(c, 1.12), cote: c };
  return muted ? { dessus: mixColor(f.dessus, DELAVE[0], DELAVE[1]), cote: mixColor(f.cote, DELAVE[0], DELAVE[1]) } : f;
}

/** Le ponton, depuis la case du rivage (`cx`, `cz` : son milieu ; `base` : le haut du sol), vers +x. */
export function dessinerPonton(P: Pinceau, cx: number, cz: number, base: number, muted: boolean): void {
  const planche = peintre(faces(COULEURS_DU_PONTON.planche, muted), PONTON.dessus - 0.2, 0.3);
  const bois = peintre(faces(COULEURS_DU_PONTON.poteau, muted), NIVEAU_EAU - 0.3, base - NIVEAU_EAU);
  const x0 = cx + 0.5;
  const x1 = x0 + PONTON.long;
  const [z0, z1] = [cz - PONTON.large / 2, cz + PONTON.large / 2];
  boite(P, x0 - 0.05, PONTON.dessus - PONTON.planche, z0, x1, PONTON.dessus, z1, planche);
  for (const x of [x0 + 1.2, x1 - 0.15]) for (const z of [z0, z1]) tronconique(P, x, z, NIVEAU_EAU - 0.3, PONTON.dessus + 0.35, PONTON.pieu, PONTON.pieu * 0.8, 4, Math.PI / 4, bois);
  // L'échelle, du tablier au haut du rivage : deux montants, trois barreaux.
  const [e0, e1] = [PONTON.dessus, base];
  for (const z of [cz - 0.25, cz + 0.25]) boite(P, x0 + 0.02, e0, z - 0.04, x0 + 0.1, e1 + 0.3, z + 0.04, bois);
  for (let i = 1; i <= 3; i++) {
    const y = e0 + ((e1 - e0) * i) / 4;
    boite(P, x0 + 0.03, y - 0.03, cz - 0.25, x0 + 0.09, y + 0.03, cz + 0.25, bois);
  }
}
