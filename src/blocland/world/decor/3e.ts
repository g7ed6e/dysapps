// Les formes du décor propres aux Îles du Ciel (3e) : leurs repères. Ce fichier appartient au sous-lot R4b-3e
// (docs/conception/cadrage-archipeo.md §6), qui y reprendra le phare de référence du 6e.
import type { Faces } from '../palette';
import { enRepere, type Forme } from './outils';
import { clamp, lueur, peintre, tronconique } from './pinceau';

/** Le grand phare du Phare : une tour de pierre à bandes claires, la lanterne, le toit de prisme. */
const grandPhare = enRepere(({ P, L, e, cx, cz, pied, Z, rot, du, deMatiere }) => {
  const fP = deMatiere('pierre');
  const fB = du(e.cubes.find((c) => c.texture === 'nuage') ?? e.cubes[0]);
  const r = (y: number) => 1.12 - 0.3 * clamp((y - Z) / 8, 0, 1);
  const tranches: [number, number, Faces][] = [
    [pied, Z + 3, fP],
    [Z + 3, Z + 4, fB],
    [Z + 4, Z + 7, fP],
    [Z + 7, Z + 8, fB],
  ];
  for (const [y0, y1, f] of tranches) tronconique(P, cx, cz, y0, y1, r(y0), r(y1), 8, rot, peintre(f, pied, Z + 8 - pied), false);
  tronconique(P, cx, cz, Z + 8, Z + 8.2, 1.05, 1.05, 8, rot, peintre(fP, Z + 7, 1.5));
  tronconique(L, cx, cz, Z + 8.2, Z + 9.1, 0.66, 0.66, 8, rot, lueur(deMatiere('lanterne')), false);
  tronconique(P, cx, cz, Z + 9.1, Z + 10.5, 1.0, 0, 8, rot, peintre(deMatiere('prisme'), Z + 9, 1.5));
});

export const FORMES_3E: Record<string, Forme> = { 'grand-phare': grandPhare };
