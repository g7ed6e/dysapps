// Le phare du large des Îles Brumeuses (5e), dessiné pour Archipéo (revue d'ensemble du directeur artistique, DA-4) :
// une tour ronde de pierre (`#7D8A86`, la pierre des ponts du 5e) à feu ouvert, sans bandes ni toit conique ; la nuit,
// le feu prend la lueur `#FFD866`, sans pulser. Ce n'est pas le phare de référence (./decor/phare.ts, crème à bandes
// et toit), que construisent les Premiers Rivages et les Îles du Ciel : au 5e, un feu de garde sur une tour de pierre.
//
// Le jeu ne change pas : le monument (./monuments.ts, commun à Blocland), ses cases, ses blocs et le toucher restent
// ceux du plan « Le phare du large ». Seul le dessin change, dans la construction taillée (./construction.ts), sur le
// modèle des ponts (./ponts.ts) : une fois toutes ses cases posées, ses cubes laissent la place à ce modèle, qui tient
// dans leurs cases (5 × 5 au pied, 3 × 3 pour la tour, 11 de haut) ; tant qu'il en manque, les cubes et les fantômes
// restent, comme pour tout plan.
import type { VoxelCube } from '../Voxel';
import { mixColor } from './daylight';
import { DELAVE, lueur, peintre, tronconique, type Peindre, type Pinceau, type V3 } from './decor/pinceau';
import type { Couleur, Faces } from './palette';
import type { Cell } from './view';

/** Le monument dessiné ainsi, et le lieu que portent ses cubes (le toucher ouvre son panneau). */
export const PHARE_DU_LARGE = 'landmark-5e-1';
const LIEU = `monument:${PHARE_DU_LARGE}`;

/** Les couleurs du phare du large (décision du directeur artistique, revue d'ensemble du 28/09). */
export const COULEURS_DU_PHARE_DU_LARGE = {
  /** La pierre de la tour, celle des ponts du 5e. */
  pierre: 0x7d8a86,
  /** Le soubassement, un ton plus sombre ; la corniche et le parapet, un ton plus clair (la tour se lit en trois masses). */
  soubassement: 0x66726f,
  corniche: 0x939f9b,
  /** La corbeille de fer du feu. */
  fer: 0x3b3a3c,
  /** Le feu, de jour : une flamme orangée, éclairée comme le reste. */
  feu: 0xf5b04a,
  /** Le feu, la nuit : la lueur des fenêtres et du phare, exacte. */
  feuDeNuit: 0xffd866,
} as const;

/**
 * Les mesures du phare, en cases au-dessus du pied du monument (le bas de son socle) et depuis l'axe de la tour. La tour
 * tient dans les 3 × 3 cases de l'ancien fût (rayon 1,5 au plus), le soubassement dans les 5 × 5 du socle.
 */
export const MESURES_DU_PHARE_DU_LARGE = {
  pans: 12,
  soubassement: { haut: 1, rayon: [2.3, 2.1] },
  tour: { bas: 1, haut: 8, rayon: [1.45, 1.15] },
  corniche: { haut: 8.35, rayon: 1.5 },
  parapet: { haut: 8.95, rayon: 1.5, epaisseur: 0.22 },
  corbeille: { bas: 8.35, haut: 9.0, rayon: [0.4, 0.78] },
  /**
   * Trois langues de feu, larges et basses, de hauteurs inégales (un feu, pas une flèche ni un toit) : sous les 11
   * cases du monument.
   */
  flammes: [
    { dx: 0, dz: 0, haut: 10.25, rayon: 0.62, rot: 0 },
    { dx: 0.34, dz: -0.18, haut: 9.75, rayon: 0.42, rot: 0.7 },
    { dx: -0.3, dz: 0.2, haut: 9.6, rayon: 0.4, rot: 1.3 },
  ],
} as const;

/**
 * Les hublots du fût (GD-2, proposition du consultant Archipéo) : les vitraux du monument, ronds, à mi-hauteur, sur les
 * deux pans tournés vers la caméra (vers +x et vers le devant, −y de la grille). Chacun est un carré de `cote` case, posé
 * sur son pan à `ecart` case en avant, calé sur la grille (le centre de la tour est au milieu d'une case) : le shader y
 * peint le hublot du bloc assemblé (world/construction.ts, `MOTIF_ASSEMBLE.vitrail`).
 */
export const HUBLOTS_DU_PHARE_DU_LARGE = { haut: 4.5, cote: 0.66, ecart: 0.012 } as const;

/** Les hublots d'un phare du large fini, en coordonnées de grille (x, y, hauteur) : leurs quatre coins et leur normale. */
export function hublotsDuPhareDuLarge(o: PoseDuPhareDuLarge): { points: V3[]; normale: V3 }[] {
  const M = MESURES_DU_PHARE_DU_LARGE;
  const H = HUBLOTS_DU_PHARE_DU_LARGE;
  const d = H.cote / 2;
  const [z0, z1] = [o.pied + H.haut - d, o.pied + H.haut + d];
  // Le rayon du fût au bas du hublot (le fût s'amincit en montant) : le pan est là à son plus en avant.
  const rayon = (h: number) => M.tour.rayon[0] + ((M.tour.rayon[1] - M.tour.rayon[0]) * (h - M.tour.bas)) / (M.tour.haut - M.tour.bas);
  const a = rayon(H.haut - d) * Math.cos(Math.PI / M.pans) + H.ecart;
  const [cx, cy] = [o.cx, o.cz];
  return [
    { points: [[cx + a, cy - d, z0], [cx + a, cy + d, z0], [cx + a, cy + d, z1], [cx + a, cy - d, z1]], normale: [1, 0, 0] },
    { points: [[cx - d, cy - a, z0], [cx + d, cy - a, z0], [cx + d, cy - a, z1], [cx - d, cy - a, z1]], normale: [0, -1, 0] },
  ];
}

/** Le phare du large tel que le monde le montre : son pied, le centre de sa tour, ses cases, fini ou non. */
export interface PoseDuPhareDuLarge {
  /** Le centre de la tour (repère Three : x, et z pour y) et le bas de son socle. */
  cx: number;
  cz: number;
  pied: number;
  /** Les cases du monument (pour le toucher). */
  cellules: Cell[];
  muted: boolean;
}

const cle = (x: number, y: number, z: number) => `${x},${y},${z}`;

/**
 * Le phare du large de ce monde, s'il est fini : toutes ses cases posées. `remplacees` : les cases que le modèle
 * remplace (vide tant qu'une case manque : les cubes et les fantômes restent).
 */
export function phareDuLarge(cubes: VoxelCube[]): { pose: PoseDuPhareDuLarge | null; remplacees: Set<string> } {
  const siens = cubes.filter((c) => c.place === LIEU && !c.sol);
  const remplacees = new Set<string>();
  if (!siens.length || siens.some((c) => c.ghost)) return { pose: null, remplacees };
  for (const c of siens) remplacees.add(cle(c.x, c.y, c.z));
  // Le pied et le milieu de l'emprise : le socle (5 × 5) est la couche la plus basse, centrée sur l'îlot.
  const pied = Math.min(...siens.map((c) => c.z));
  const bas = siens.filter((c) => c.z === pied);
  const xs = bas.map((c) => c.x);
  const ys = bas.map((c) => c.y);
  return {
    pose: {
      cx: (Math.min(...xs) + Math.max(...xs) + 1) / 2,
      cz: (Math.min(...ys) + Math.max(...ys) + 1) / 2,
      pied,
      cellules: siens.map((c) => ({ x: c.x, y: c.y, z: c.z })),
      muted: siens.some((c) => c.muted),
    },
    remplacees,
  };
}

const delave = (c: Couleur, muted: boolean): Faces => {
  const d = muted ? mixColor(c, DELAVE[0], DELAVE[1]) : c;
  return { dessus: d, cote: d };
};

/**
 * Un anneau creux (le parapet), de `y0` à `y1`, de rayon extérieur `r` et d'épaisseur `e` : sa face extérieure, sa
 * face intérieure (tournée vers l'axe : on la voit d'en haut, par-dessus le parapet d'en face) et son dessus.
 */
function anneauCreux(P: Pinceau, cx: number, cz: number, y0: number, y1: number, r: number, e: number, n: number, peindre: Peindre): void {
  const pt = (i: number, rr: number, y: number): V3 => {
    const a = (i / n) * Math.PI * 2;
    return [cx + rr * Math.cos(a), y, cz + rr * Math.sin(a)];
  };
  const ri = r - e;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const a = (i + 0.5) / n;
    const milieu = (rr: number, y: number): V3 => [cx + rr * Math.cos(a * Math.PI * 2), y, cz + rr * Math.sin(a * Math.PI * 2)];
    // Dehors : le « dedans » est dans l'épaisseur du mur ; dedans : il est de l'autre côté, dans le mur aussi.
    P.quad(pt(i, r, y0), pt(j, r, y0), pt(j, r, y1), pt(i, r, y1), milieu(r - e / 2, (y0 + y1) / 2), peindre);
    P.quad(pt(i, ri, y0), pt(j, ri, y0), pt(j, ri, y1), pt(i, ri, y1), milieu(ri + e / 2, (y0 + y1) / 2), peindre);
    P.quad(pt(i, ri, y1), pt(j, ri, y1), pt(j, r, y1), pt(i, r, y1), milieu(r - e / 2, y1 - 0.1), peindre);
  }
}

/**
 * Dessine le phare du large (repère Three : x, hauteur, y de la grille) : le soubassement, la tour, la corniche et son
 * parapet, la corbeille de fer, dans `P` (l'opaque) ; le feu dans `L` (les lueurs : sa flamme de jour, la lueur la nuit,
 * fixe ; éteint et délavé sur une île fermée, dans `P`).
 */
export function dessinerPhareDuLarge(P: Pinceau, L: Pinceau, o: PoseDuPhareDuLarge): void {
  const M = MESURES_DU_PHARE_DU_LARGE;
  const C = COULEURS_DU_PHARE_DU_LARGE;
  const { cx, cz, pied, muted } = o;
  const n = M.pans;
  const at = (h: number) => pied + h;
  const haut = at(M.parapet.haut);
  const peint = (c: Couleur): Peindre => peintre(delave(c, muted), pied, haut - pied);
  // Un pan à plat vers la caméra (au sud).
  const rot = Math.PI / n;
  tronconique(P, cx, cz, at(0), at(M.soubassement.haut), M.soubassement.rayon[0], M.soubassement.rayon[1], n, rot, peint(C.soubassement));
  tronconique(P, cx, cz, at(M.tour.bas), at(M.tour.haut), M.tour.rayon[0], M.tour.rayon[1], n, rot, peint(C.pierre), false);
  // La corniche déborde de la tour et porte la plate-forme du feu ; le parapet en fait le tour.
  tronconique(P, cx, cz, at(M.tour.haut), at(M.corniche.haut), M.tour.rayon[1], M.corniche.rayon, n, rot, peint(C.corniche));
  anneauCreux(P, cx, cz, at(M.corniche.haut), at(M.parapet.haut), M.parapet.rayon, M.parapet.epaisseur, n, peint(C.corniche));
  tronconique(P, cx, cz, at(M.corbeille.bas), at(M.corbeille.haut), M.corbeille.rayon[0], M.corbeille.rayon[1], 6, 0, peint(C.fer));
  // Le feu : deux langues facettées, posées dans la corbeille.
  const feu = muted ? P : L;
  const jour = muted ? peint(C.fer) : peintre({ dessus: C.feu, cote: C.feu }, at(M.corbeille.haut), M.flammes[0].haut - M.corbeille.haut);
  if (!muted) L.deNuit = lueur({ dessus: C.feuDeNuit, cote: C.feuDeNuit });
  for (const f of M.flammes) tronconique(feu, cx + f.dx, cz + f.dz, at(M.corbeille.haut - 0.1), at(muted ? M.corbeille.haut + 0.2 : f.haut), f.rayon, 0, 5, f.rot, jour);
  if (!muted) L.deNuit = null;
}

