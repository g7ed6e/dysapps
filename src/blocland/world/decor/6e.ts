// Les formes du décor propres aux Premiers Rivages (6e) : leurs repères. Ce fichier appartient au sous-lot R4b-6e
// (docs/conception/cadrage-archipeo.md §6) ; le phare de référence s'y construira.
import { enRepere, type Forme } from './outils';
import { feuillage, icosaedre, octaedre, peintre, boite, lueur, tronconique } from './pinceau';

/** Le chêne géant de la Forêt : un tronc évasé au pied, trois masses de feuillage. */
const grandArbre = enRepere(({ P, cx, cz, base, pied, Z, rot, hasard, vert, deMatiere }) => {
  const fT = deMatiere('tronc');
  // Le tronc visible fait moins de la moitié de la hauteur : la couronne descend, ses masses s'élargissent.
  const pT = peintre(fT, pied, Z + 5 - pied);
  tronconique(P, cx, cz, pied, base + 0.7, 1.05, 0.72, 7, rot, pT, false);
  tronconique(P, cx, cz, base + 0.6, Z + 5.2, 0.72, 0.5, 7, rot, pT, false);
  const masse = (x: number, y: number, z: number, r: number, sy: number, rot: number) =>
    icosaedre(P, [x, y, z], r, sy, 0.12, hasard, feuillage(vert, y - 0.75 * r * sy, 1.5 * r * sy), rot);
  masse(cx, Z + 6.2, cz, 3.36, 0.7, rot);
  masse(cx - 0.7, Z + 7.4, cz + 0.5, 2.28, 0.8, rot + 1);
  masse(cx + 1.05, Z + 7.1, cz - 0.7, 1.68, 0.85, rot + 2);
});

/** La fumée du Volcan : des volutes au-dessus du cratère. */
const fumee = enRepere(({ e, fumee, bouffees }) => bouffees(fumee.length ? fumee : e.cubes));

/** La tour de guet de la Mine : une tour de pierre sur le pic, sa lanterne et sa bannière. */
const tourDeGuet = enRepere(({ P, L, e, cx, cz, pied, Z, rot, matiere, deMatiere }) => {
  const fP = deMatiere('pierre');
  tronconique(P, cx, cz, pied, Z + 4, 0.58, 0.46, 6, rot, peintre(fP, pied, Z + 4 - pied));
  tronconique(P, cx, cz, Z + 4, Z + 4.25, 0.5, 0.5, 6, rot, peintre(fP, Z + 3, 1.2));
  octaedre(L, [cx, Z + 4.65, cz], 0.3, 1.2, lueur(deMatiere('lanterne')), false, rot);
  const mat = matiere('tronc', e.muted);
  tronconique(P, cx + 0.3, cz, Z + 4.2, Z + 6, 0.05, 0.04, 4, 0, peintre(mat, Z + 4, 2), false);
  boite(P, cx + 0.33, Z + 5.05, cz - 0.03, cx + 1.1, Z + 5.8, cz + 0.03, peintre(deMatiere('toile'), Z + 5, 1));
});

export const FORMES_6E: Record<string, Forme> = { 'grand-arbre': grandArbre, fumee, 'tour-de-guet': tourDeGuet };
