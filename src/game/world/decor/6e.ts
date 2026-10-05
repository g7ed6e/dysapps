// Les formes du décor propres aux Premiers Rivages (6e) : leurs repères. Ce fichier appartient au sous-lot R4b-6e
// (docs/univers/archipeo/cadrage.md §6). Le phare de référence, commun au 6e et au 3e, est dans ./phare.ts.
import type { VoxelCube } from '../cube';
import { enRepere, type Forme } from './tools';
import { feuillage, icosaedre, octaedre, peintre, boite, lueur, tronconique } from './brush';

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

/**
 * La fumée du Volcan : aux Premiers Rivages, une fumée mince, trois petites volutes séparées (`ecart`), en traînée, qui sortent d'une bouche sur le
 * flanc sud du cône (celui que la caméra voit toujours, elle regarde vers le nord), au bas de sa face (`bouche`), et restent
 * contre la roche sombre : jamais au-dessus du cratère, donc jamais derrière le nom de l'île, et plus basses que le
 * phare (le volcan fumant est la signature du 4e ; recommandation du directeur artistique, fiche de famille).
 */
export const FUMEE_DU_VOLCAN = { rayon: 0.22, volutes: 3, ecart: 1.3, bouche: 0.2, marche: 6 } as const;

/**
 * La bouche de la fumée : la crête du cône est le plus haut du sol sous le pied des cubes de fumée (au-dessus du
 * cratère) ou juste au sud ; de là, on descend vers le sud jusqu'au pied de sa face (au plus `marche` cases), et la
 * bouche est devant elle, à `bouche` de sa hauteur. Sans cône, le cratère.
 */
export function boucheDuVolcan(pied: VoxelCube, sol: (x: number, y: number, repli: number) => number): { x: number; y: number; z: number } {
  const x = pied.x + 0.5;
  let yc = pied.y;
  for (const y of [pied.y - 1, pied.y - 2]) if (sol(x, y + 0.5, -Infinity) > sol(x, yc + 0.5, -Infinity)) yc = y;
  const crete = sol(x, yc + 0.5, pied.z);
  for (let d = 1; d <= FUMEE_DU_VOLCAN.marche; d++) {
    const bas = sol(x, yc - d + 0.5, crete);
    if (crete - bas >= 2) return { x: pied.x, y: yc - d, z: bas + FUMEE_DU_VOLCAN.bouche * (crete - bas) };
  }
  return { x: pied.x, y: yc, z: crete };
}
const fumee = enRepere(({ e, fumee, bouffees, sol }) => {
  const list = fumee.length ? fumee : e.cubes;
  if (!list.length) return;
  const pied = list.reduce((p, q) => (q.z < p.z ? q : p));
  const b = boucheDuVolcan(pied, sol);
  bouffees([{ ...pied, x: b.x, y: b.y }], { rayon: FUMEE_DU_VOLCAN.rayon, volutes: FUMEE_DU_VOLCAN.volutes, ecart: FUMEE_DU_VOLCAN.ecart, bas: b.z });
});

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
