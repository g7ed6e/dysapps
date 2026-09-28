// Les formes du décor propres aux Anciens Ateliers (4e) : leurs repères. Ce fichier appartient au sous-lot R4b-4e
// (docs/conception/cadrage-archipeo.md §6).
import { enRepere, type Forme } from './outils';
import { lueur, peintre, tronconique, type V3 } from './pinceau';

/** Le haut-fourneau de la Forge : une cheminée de basalte qui s'évase au pied, la lave au sommet, la fumée au vent. */
const hautFourneau = enRepere(({ P, L, cx, cz, pied, Z, rot, deMatiere, fumee, bouffees }) => {
  const fB = deMatiere('basalte');
  const pB = peintre(fB, pied, Z + 9 - pied);
  tronconique(P, cx, cz, pied, Z + 1.2, 1.35, 1.12, 8, rot, pB, false);
  tronconique(P, cx, cz, Z + 1.2, Z + 9.3, 1.12, 0.92, 8, rot, pB, false);
  // La lèvre : un anneau de basalte autour de la lave.
  const n = 8;
  for (let i = 0; i < n; i++) {
    const a0 = rot + (i / n) * Math.PI * 2;
    const a1 = rot + ((i + 1) / n) * Math.PI * 2;
    const p = (r: number, a: number, y: number): V3 => [cx + r * Math.cos(a), y, cz + r * Math.sin(a)];
    P.quad(p(0.92, a0, Z + 9.3), p(0.92, a1, Z + 9.3), p(0.66, a1, Z + 9.3), p(0.66, a0, Z + 9.3), [cx, Z + 8, cz], pB);
  }
  tronconique(L, cx, cz, Z + 8.9, Z + 9.2, 0.7, 0.68, 8, rot, lueur(deMatiere('lave')));
  bouffees(fumee);
});

export const FORMES_4E: Record<string, Forme> = { 'haut-fourneau': hautFourneau };
