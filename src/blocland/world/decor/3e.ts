// Les formes du décor propres aux Îles du Ciel (3e) : le grand phare sur son socle de salles et le massif enneigé du
// lointain. Ce fichier appartient au sous-lot R4b-3e (docs/conception/cadrage-archipeo.md §6 ; intention du directeur
// artistique dans design/archipeo/intentions/3e-iles-du-ciel.md). Rien n'y change le monde en blocs : les cubes du grand
// phare restent ceux de Blocland, seule sa forme dans Archipéo change.
import { mixColor } from '../daylight';
import { coeurDe, islandDef } from '../map';
import { compense, exposition, PLANCHER_DE_NUAGES } from '../mer';
import { eauxDe, type Couleur, type Faces } from '../palette';
import type { Lointain, Massif } from './lointain';
import { enRepere, type Forme } from './outils';
import { dessinerPhare, PHARES, PIECES_DU_PHARE } from './phare';
import { boite, DELAVE, peintre, type Peindre, type Pinceau, type V3 } from './pinceau';

/** Les couleurs de la fiche : la pierre de taille du socle et son ombre, la neige des terrasses, le sombre des baies. */
export const COULEURS_3E = { pierre: 0xdbdadd, ombre: 0x5a7ba5, neige: 0xe5ebe3, baie: 0x2e3a52 } as const;

/** Le socle de salles : 3 × 3 cases sur 2 de haut, puis une salle de 2 × 2 sur 1 de haut (fiche, §2). */
export const SOCLE_3E = { cote: 3, bas: 2, haut: 1, salle: 2 } as const;

/**
 * Le retrait du socle (DA-18, revue d'ensemble) : de loin, les deux salles de même pierre se fondaient en un seul bloc.
 * L'arête de la terrasse porte un bandeau de neige (`bandeau` de haut, en cases), le pied de la salle du haut un joint
 * d'ombre (`joint` de haut, la pierre mêlée à son ombre à `ombre`) ; les deux débordent de `decolle` pour ne pas se
 * confondre avec le mur (ni scintiller contre lui). Les mesures de la fiche (3 × 3 sur 2, 2 × 2 sur 1) ne changent pas.
 */
export const RETRAIT_3E = { bandeau: 0.16, joint: 0.12, ombre: 0.75, decolle: 0.03 } as const;

/**
 * Le grand phare, tel que la caméra et les étiquettes d'Archipéo le gardent en vue (world/cadrage.ts, DA-17, DA-18) :
 * le centre de son socle en cases du monde (`x`, `y`), le bas de son socle et le haut de son toit, le rayon de son toit
 * (en cases). Le test `3e.test.ts` le tient égal au phare dessiné. `pivot` : dans la vue de l'archipel depuis l'île du
 * Phare (l'arrivée), la caméra passe plein sud au lieu du sud-sud-est, pour que la lanterne se découpe sur le ciel et
 * le massif, et non plus sur l'île de l'Observatoire des textes, juste derrière elle ; depuis cette île des textes,
 * dont le phare est au premier plan, le même pivot l'écarte du cœur de l'île, sa lanterne sur le ciel (radians,
 * ajoutés au pivot de la vue ; depuis ces îles, la vue ne glisse pas vers le phare). Depuis que le cœur du Phare a 20
 * cases (01/10/2026), le phare suit la côte repoussée, deux cases plus loin en x et en y (75,5 et 929,5 avant).
 */
export const GRAND_PHARE_3E = { ile: 'phare', x: 77.5, y: 931.5, pied: 9.7, haut: 26, rayon: 1.2, pivot: { phare: -0.3, textes: -0.3 } } as const;

const delave = (f: Faces, muted: boolean): Faces => (muted ? { dessus: mixColor(f.dessus, DELAVE[0], DELAVE[1]), cote: mixColor(f.cote, DELAVE[0], DELAVE[1]) } : f);
const uni = (c: Couleur, muted: boolean): Faces => delave({ dessus: c, cote: c }, muted);

/**
 * L'emprise du socle du grand phare (sur l'île du Phare, la seule qui en a un) : les cases du phare de Blocland (2 × 2) et une rangée et une colonne de plus, du côté opposé au
 * cœur de l'île, pour ne jamais en couvrir une case (fiche, §2 ; test `3e.test.ts`). En cases du monde.
 */
export function empriseDuSocle(e: { x: number; y: number; emprise: number }): { x0: number; y0: number } {
  const def = islandDef('phare');
  const c = coeurDe(def);
  const [mx, my] = [(c.x0 + c.x1) / 2, (c.y0 + c.y1) / 2];
  const plus = SOCLE_3E.cote - e.emprise;
  return { x0: e.x + e.emprise / 2 < mx ? e.x - plus : e.x, y0: e.y + e.emprise / 2 < my ? e.y - plus : e.y };
}

/** Les baies cintrées d'un mur : `n` arcs sombres, à peine décollés du mur (face vers `dehors`). */
function baies(P: Pinceau, mur: { x0: number; z0: number; x1: number; z1: number }, dehors: [number, number], y0: number, h: number, n: number, peindre: Peindre): void {
  const long = Math.hypot(mur.x1 - mur.x0, mur.z1 - mur.z0);
  const l = Math.min(0.45, (long / n) * 0.42);
  const d = 0.03;
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    const cx = mur.x0 + (mur.x1 - mur.x0) * t + dehors[0] * d;
    const cz = mur.z0 + (mur.z1 - mur.z0) * t + dehors[1] * d;
    const ux = ((mur.x1 - mur.x0) / long) * (l / 2);
    const uz = ((mur.z1 - mur.z0) / long) * (l / 2);
    const bas = y0 + h * 0.18;
    const epaule = y0 + h * 0.62;
    const cle = epaule + l * 0.55;
    const dedans: V3 = [cx - dehors[0], (bas + cle) / 2, cz - dehors[1]];
    P.quad([cx - ux, bas, cz - uz], [cx + ux, bas, cz + uz], [cx + ux, epaule, cz + uz], [cx - ux, epaule, cz - uz], dedans, peindre);
    // Le cintre : deux pans jusqu'à la clé, un arc facetté.
    const mi = epaule + l * 0.38;
    P.quad([cx - ux, epaule, cz - uz], [cx + ux, epaule, cz + uz], [cx + ux * 0.62, mi, cz + uz * 0.62], [cx - ux * 0.62, mi, cz - uz * 0.62], dedans, peindre);
    P.triangle([cx - ux * 0.62, mi, cz - uz * 0.62], [cx + ux * 0.62, mi, cz + uz * 0.62], [cx, cle, cz], dedans, peindre);
  }
}

/** Une salle : une boîte de pierre, neige sur son dessus, des baies sur ses quatre murs. */
function salle(P: Pinceau, x0: number, z0: number, x1: number, z1: number, y0: number, y1: number, n: number, pierre: Peindre, neige: Peindre, baie: Peindre): void {
  const faces: Peindre = (p, nn) => (nn[1] > 0.9 ? neige(p, nn) : pierre(p, nn));
  boite(P, x0, y0, z0, x1, y1, z1, faces);
  // Les baies, sur la hauteur de la salle au-dessus du sol (la salle du bas plonge dans le sol).
  const hb = Math.min(y1 - y0, n === 3 ? 2 : 1);
  const yb = y1 - hb;
  baies(P, { x0, z0, x1, z1: z0 }, [0, -1], yb, hb, n, baie);
  baies(P, { x0, z0: z1, x1, z1 }, [0, 1], yb, hb, n, baie);
  baies(P, { x0, z0, x1: x0, z1 }, [-1, 0], yb, hb, n, baie);
  baies(P, { x0: x1, z0, x1, z1 }, [1, 0], yb, hb, n, baie);
}

/**
 * Le grand phare de l'île du Phare : le phare de référence (./phare.ts, `PHARES['3e']`) sur son socle de salles en
 * pierre de taille (deux étages en gradins, des baies cintrées sombres, de la neige sur les terrasses), à la place de la
 * tour de pierre à bandes de neige et au toit de prisme de Blocland. Il garde le site du phare de Blocland, dont il
 * couvre les cases (règle 1 du directeur artistique).
 */
const grandPhare = enRepere(({ P, L, e, Z, plusBas, matiere }) => {
  const { x0, y0 } = empriseDuSocle(e);
  const c = SOCLE_3E.cote;
  // Posé au plus bas de toute son emprise (règle des repères : il s'y enfonce, jamais ne flotte).
  const bas = plusBas(x0, y0, c, Z) - 0.3;
  const pierre = peintre(delave({ dessus: COULEURS_3E.pierre, cote: mixColor(COULEURS_3E.pierre, COULEURS_3E.ombre, 0.35) }, e.muted), bas, Z + SOCLE_3E.bas + SOCLE_3E.haut - bas);
  const neige = peintre(uni(COULEURS_3E.neige, e.muted), Z, 1);
  const baie = peintre(uni(COULEURS_3E.baie, e.muted), Z, 1);
  const haut1 = Z + SOCLE_3E.bas;
  salle(P, x0, y0, x0 + c, y0 + c, bas, haut1, 3, pierre, neige, baie);
  const m = (c - SOCLE_3E.salle) / 2;
  const haut2 = haut1 + SOCLE_3E.haut;
  salle(P, x0 + m, y0 + m, x0 + c - m, y0 + c - m, haut1 - 0.05, haut2, 2, pierre, neige, baie);
  // Le retrait, lisible de loin (DA-18) : un bandeau de neige à l'arête de la terrasse, et un joint d'ombre au pied de
  // la salle du haut, à peine décollés des murs (`RETRAIT_3E`).
  const { bandeau, joint, decolle: d } = RETRAIT_3E;
  boite(P, x0 - d, haut1 - bandeau, y0 - d, x0 + c + d, haut1 + d, y0 + c + d, neige);
  const sombre = peintre(uni(mixColor(COULEURS_3E.pierre, COULEURS_3E.ombre, RETRAIT_3E.ombre), e.muted), Z, 1);
  boite(P, x0 + m - d, haut1 - 0.05, y0 + m - d, x0 + c - m + d, haut1 + joint, y0 + c - m + d, sombre);
  const { H, r } = PHARES['3e'];
  dessinerPhare(P, L, {
    cx: x0 + c / 2,
    cz: y0 + c / 2,
    pied: Z,
    y: haut2,
    H,
    r,
    emprise: c,
    // Huit pans : deux faces à plat vers la caméra, comme au 6e.
    rot: Math.PI / 8,
    pierre: matiere('pierre', false),
    verre: matiere('verre', false),
    muted: e.muted,
    pieces: new Set(PIECES_DU_PHARE.filter((p) => p !== 'socle')),
  });
});

export const FORMES_3E: Record<string, Forme> = { 'grand-phare': grandPhare };

/**
 * Le massif posé sur le plancher de nuages (DA-20 : il faisait décor de théâtre, bouts coupés net, base en l'air, roche peu
 * lisible). Sur les quatre dixièmes de sa longueur à chaque bout, la crête descend en pente jusque sous les nuages (au
 * bout gauche, près de la lanterne du grand phare, elle plonge sans s'étirer à plat) et recule de 30 cases dans la brume ;
 * son pied, un glacis de 14 cases qui plonge sous le plancher, se resserre avec elle. Sa roche prend la couleur du
 * plancher sur les 2,5 blocs du bas et tire vers son ombre d'au moins 0,3, jusqu'à 0,8 à l'opposé du soleil : une valeur
 * nettement plus sombre que la neige.
 */
export const MASSIF_3E: Massif = {
  archipel: '3e',
  bouts: 0.4,
  fuite: 30,
  plancher: PLANCHER_DE_NUAGES,
  fondu: 2.5,
  glacis: 14,
  couleurDuPlancher: compense(eauxDe('3e').large, exposition('3e')),
  ombreForce: 0.8,
  ombreSocle: 0.3,
};

/**
 * Le massif enneigé des Îles du Ciel (fiche, §2) : une crête continue et irrégulière, 1,2 fois plus large que l'arc des
 * îles, de roche froide, la neige franche au-dessus de 55 % de sa hauteur, ses cols hauts (0,55 à 0,75 de la hauteur)
 * pour que la neige fasse une bande continue ; un second rang plus haut et plus pâle derrière lui fait l'épaisseur de la
 * chaîne. Bas (14 et 18 blocs), pour que toute la crête tienne dans la vue de l'archipel, sous la barre du haut, et que la
 * lanterne du phare se détache sur la bande claire de l'horizon (directeur artistique, 28 septembre 2026).
 */
export const LOINTAIN_3E: Lointain = {
  graine: 'lointain-3e',
  pieces: [
    { genre: 'cretes', u: -0.1, a: 1.1, recul: 80, haut: 14, cimes: 11, epaisseur: 30, couleur: 0x7e8aa8, ombre: 0x47598c, sommet: 0xe5ebe3, neige: 0.55, neigeFranche: true, cols: [0.55, 0.75], massif: MASSIF_3E },
    { genre: 'cretes', u: 0.05, a: 0.95, recul: 110, haut: 18, cimes: 8, epaisseur: 30, couleur: 0x8b96b2, ombre: 0x56679a, sommet: 0xe5ebe3, neige: 0.55, neigeFranche: true, cols: [0.55, 0.75], massif: MASSIF_3E },
  ],
};
