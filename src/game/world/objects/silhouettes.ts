// Les petites constructions à silhouette d'Archipéo, au 6e (piste 3 « hybride » du directeur artistique, choisie par le
// mainteneur le 11 octobre 2026) : chacune a un modèle propre, dessiné par le code, low poly en aplats francs, qu'un
// assemblage de pièces ne sait pas faire : le puits de Tunel (le premier essai, « Top le style »), la grue de Rouxel, la
// boutique de Coco, le lavoir de Nénu, le parasol de Lavi, la pendule de Robin, le tamis de Silex et le nichoir de
// Fougère. De près (l'île où se trouve l'élève), le modèle entier ; de loin (`loin`), ses volumes.
//
// Chacune dans le repère de grille de sa forme (world/fixtures.ts : x vers la droite, y vers le fond, z vers le haut, z = 0
// sur le sol), sans en sortir (le toucher prend ses cases). La matière du bloc livré est sur la plus grande face de
// l'objet, dans les couleurs mêmes du bloc (règle GD-7, docs/rendu/style.md) : la brique de la margelle, le madrier de
// la flèche, le bois du comptoir, la pierre des piliers, la cabine de la toile du parasol, le cadran de la tête de la
// pendule, le sable du tamis, le chaume du toit du nichoir. Code pur, sans Three.js.
import { BLOC } from '../../biomes';
import { mixColor } from '../daylight';
import { type Peindre, type Trace, tronconique, type V3 } from '../decor/brush';
import type { Couleur } from '../palette';
import { aplatDe, type Atelier, type Teinte } from './atelier';
import { bassin, caisse, COULEURS_DES_OBJETS as C, type Peinture } from './pieces';

/** Le dessin d'un objet : dans l'atelier, avec ses couleurs, de près ou de loin. */
export type DessinDObjet = (at: Atelier, pe: Peinture, loin: boolean) => void;

// ---------- Le puits de Tunel (la Mine des lettres) ----------

/** Les mesures du puits, en cases, depuis le centre de sa forme (3 × 3) et le sol. */
const MESURES_DU_PUITS = {
  /** Les pans des anneaux de près (douze, comme le concept), et de loin. */
  pans: 12,
  pansDeLoin: 6,
  /** Le lit de pose, au pied : un peu plus large que le mur. */
  pied: { rayon: 1.3, haut: 0.18 },
  /** Le mur de brique : son rayon, et ses trois assises (en damier de deux tons de brique : les gros blocs du concept). */
  mur: { rayon: 1.22, assises: [0.18, 0.39, 0.6, 0.8] },
  /** La margelle : déborde du mur, son dessus dans la couleur du dessus de la brique ; son rayon intérieur. */
  margelle: { rayon: 1.32, interieur: 0.92, bas: 0.8, haut: 0.94 },
  /** L'eau, sous la margelle ; son liseré clair au bord (comme l'eau en nappe du cœur des îles). */
  eau: { haut: 0.72, lisere: 0.78 },
  /** Les deux poteaux, de part et d'autre du milieu le long de y (vus à gauche et à droite par la caméra de l'île). */
  poteaux: { ecart: 1.06, cote: 0.24, haut: 2.04 },
  /** La poutre sous le faîte, d'un poteau à l'autre. */
  poutre: { cote: 0.16, bas: 1.92, long: 1.24 },
  /** Le treuil : un rouleau à six pans entre les poteaux. */
  treuil: { rayon: 0.1, haut: 1.4 },
  /** Le seau de bois, posé sur la margelle entre deux poteaux : son angle autour du puits, ses rayons, sa hauteur. */
  seau: { angle: -Math.PI / 4, rayons: [0.12, 0.16], haut: 0.24 },
  /** La faîtière de bois, posée à cheval sur le faîte : sa demi-largeur et sa hauteur au-dessus du faîte. */
  faitiere: { demi: 0.09, haut: 0.06 },
  /** Le toit à deux pans, son faîte le long de y : sa demi-largeur, son avant-toit, son faîte, son épaisseur, sa demi-longueur. */
  toit: { demi: 0.8, avantToit: 1.98, faite: 2.46, epaisseur: 0.09, long: 1.4 },
} as const;

/** Le second ton de la brique, en damier sur le mur : la brique des côtés, un peu plus sombre. */
const BRIQUE_SOMBRE = 0.88;

// Le puits se trace dans le repère de Three de sa forme (X = x, Y = la hauteur, Z = y : `Atelier.trace`), comme au
// premier essai ; son centre en (1,5 ; 1,5), le sol en 0.

const surLAnneauThree = (cx: number, cz: number, r: number, y: number, i: number, n: number): V3 => {
  const a = ((i + 0.5) / n) * Math.PI * 2;
  return [cx + r * Math.cos(a), y, cz + r * Math.sin(a)];
};

function couronne(P: Trace, cx: number, cz: number, y: number, r0: number, r1: number, n: number, peindre: Peindre): void {
  for (let i = 0; i < n; i++) P.quad(surLAnneauThree(cx, cz, r0, y, i, n), surLAnneauThree(cx, cz, r0, y, i + 1, n), surLAnneauThree(cx, cz, r1, y, i + 1, n), surLAnneauThree(cx, cz, r1, y, i, n), [cx, y - 1, cz], peindre);
}

function flanc(P: Trace, cx: number, cz: number, y0: number, y1: number, r: number, n: number, dehors: boolean, peindre: (i: number) => Peindre): void {
  for (let i = 0; i < n; i++) {
    const m = surLAnneauThree(cx, cz, dehors ? r - 0.1 : r + 0.1, (y0 + y1) / 2, i, n);
    const dedans: V3 = dehors ? [cx, (y0 + y1) / 2, cz] : [2 * m[0] - cx, m[1], 2 * m[2] - cz];
    P.quad(surLAnneauThree(cx, cz, r, y0, i, n), surLAnneauThree(cx, cz, r, y0, i + 1, n), surLAnneauThree(cx, cz, r, y1, i + 1, n), surLAnneauThree(cx, cz, r, y1, i, n), dedans, peindre(i));
  }
}

function disque(P: Trace, cx: number, cz: number, y: number, r: number, n: number, peindre: Peindre): void {
  for (let i = 1; i + 1 < n; i++) P.triangle(surLAnneauThree(cx, cz, r, y, 0, n), surLAnneauThree(cx, cz, r, y, i, n), surLAnneauThree(cx, cz, r, y, i + 1, n), [cx, y - 1, cz], peindre);
}

function boiteThree(P: Trace, x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, peindre: Peindre, sans: { dessus?: boolean; dessous?: boolean } = {}): void {
  const c: V3 = [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2];
  if (!sans.dessus) P.quad([x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1], c, peindre);
  if (!sans.dessous) P.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], c, peindre);
  P.quad([x0, y0, z0], [x0, y1, z0], [x0, y1, z1], [x0, y0, z1], c, peindre);
  P.quad([x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1], c, peindre);
  P.quad([x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], c, peindre);
  P.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], c, peindre);
}

/** Le toit à deux pans du puits, son faîte le long de z ; `epais` faux (de loin) : les deux pans seuls. */
function toitDuPuits(P: Trace, cx: number, cz: number, peindre: Peindre, epais: boolean): void {
  const T = MESURES_DU_PUITS.toit;
  const [ya, yf, e] = [T.avantToit, T.faite, T.epaisseur];
  const bouts = [cz - T.long, cz + T.long];
  const haut = (x: number, z: number): V3 => [x, x === cx ? yf : ya, z];
  const bas = (x: number, z: number): V3 => [x, (x === cx ? yf : ya) - e, z];
  const sous: V3 = [cx, ya - 1, cz];
  for (const x of [cx - T.demi, cx + T.demi]) {
    P.quad(haut(x, bouts[0]), haut(x, bouts[1]), haut(cx, bouts[1]), haut(cx, bouts[0]), sous, peindre);
    if (!epais) continue;
    P.quad(bas(x, bouts[0]), bas(x, bouts[1]), bas(cx, bouts[1]), bas(cx, bouts[0]), [cx, yf + 1, cz], peindre);
    P.quad(haut(x, bouts[0]), haut(x, bouts[1]), bas(x, bouts[1]), bas(x, bouts[0]), [cx, ya - e / 2, cz], peindre);
  }
  if (!epais) return;
  for (const z of bouts) for (const x of [cx - T.demi, cx + T.demi]) P.quad(haut(x, z), haut(cx, z), bas(cx, z), bas(x, z), [cx, ya, cz], peindre);
}

/**
 * Le puits de Tunel : de près, un peu plus de 300 triangles (le lit de pose, le mur de brique en trois assises en
 * damier, la margelle, la paroi intérieure, l'eau et son liseré, les deux poteaux, la poutre, le treuil, le seau posé sur
 * la margelle, le toit et sa faîtière posée à cheval sur le faîte) ; de loin, une cinquantaine (le mur et la margelle à
 * six pans, l'eau, les poteaux et les deux pans du toit).
 */
const puits: DessinDObjet = (at, pe, loin) => {
  const P = at.trace;
  const M = MESURES_DU_PUITS;
  const [cx, cz] = [1.5, 1.5];
  const brique = pe.bloc(BLOC.brique);
  const cote = aplatDe(brique.cote);
  const dessus = aplatDe(brique.dessus);
  const sombre = aplatDe(mixColor(brique.cote, 0x000000, 1 - BRIQUE_SOMBRE));
  const v = (c: Couleur) => aplatDe(pe.couleur(c));
  const p = M.poteaux;
  if (loin) {
    const n = M.pansDeLoin;
    flanc(P, cx, cz, 0, M.margelle.haut, M.margelle.rayon, n, true, () => cote);
    couronne(P, cx, cz, M.margelle.haut, M.margelle.interieur, M.margelle.rayon, n, dessus);
    disque(P, cx, cz, M.eau.lisere, M.margelle.interieur, n, v(C.eau));
    for (const s of [-1, 1]) boiteThree(P, cx - p.cote / 2, M.margelle.haut, cz + s * p.ecart - p.cote / 2, cx + p.cote / 2, M.toit.avantToit, cz + s * p.ecart + p.cote / 2, v(C.bois), { dessus: true, dessous: true });
    toitDuPuits(P, cx, cz, v(C.ardoise), false);
    return;
  }
  const n = M.pans;
  flanc(P, cx, cz, 0, M.pied.haut, M.pied.rayon, n, true, () => cote);
  couronne(P, cx, cz, M.pied.haut, M.mur.rayon, M.pied.rayon, n, dessus);
  const assises = M.mur.assises;
  for (let k = 0; k + 1 < assises.length; k++) flanc(P, cx, cz, assises[k], assises[k + 1], M.mur.rayon, n, true, (i) => ((i + k) % 2 ? sombre : cote));
  flanc(P, cx, cz, M.margelle.bas, M.margelle.haut, M.margelle.rayon, n, true, () => cote);
  couronne(P, cx, cz, M.margelle.haut, M.margelle.interieur, M.margelle.rayon, n, dessus);
  flanc(P, cx, cz, M.eau.haut, M.margelle.haut, M.margelle.interieur, n, false, () => cote);
  const r = M.margelle.interieur;
  couronne(P, cx, cz, M.eau.haut, r * 0.8, r, n, v(C.lisere));
  disque(P, cx, cz, M.eau.haut, r * 0.8, n, v(C.eau));
  for (const s of [-1, 1]) boiteThree(P, cx - p.cote / 2, M.margelle.haut, cz + s * p.ecart - p.cote / 2, cx + p.cote / 2, p.haut, cz + s * p.ecart + p.cote / 2, v(C.bois), { dessus: true, dessous: true });
  const q = M.poutre;
  boiteThree(P, cx - q.cote / 2, q.bas, cz - q.long, cx + q.cote / 2, q.bas + q.cote, cz + q.long, v(C.bois), { dessus: true });
  const t = M.treuil;
  const bouts = [cz - p.ecart + p.cote / 2, cz + p.ecart - p.cote / 2];
  for (let i = 0; i < 6; i++) {
    const ang = (k: number) => ((k + 0.5) / 6) * Math.PI * 2;
    const pt = (k: number, z: number): V3 => [cx + t.rayon * Math.cos(ang(k)), t.haut + t.rayon * Math.sin(ang(k)), z];
    P.quad(pt(i, bouts[0]), pt(i + 1, bouts[0]), pt(i + 1, bouts[1]), pt(i, bouts[1]), [cx, t.haut, cz], v(C.boisClair));
  }
  const sv = M.seau;
  const rs = (M.margelle.interieur + M.margelle.rayon) / 2;
  const [sx, sz] = [cx + rs * Math.cos(sv.angle), cz + rs * Math.sin(sv.angle)];
  tronconique(P, sx, sz, M.margelle.haut, M.margelle.haut + sv.haut, sv.rayons[0], sv.rayons[1], 8, Math.PI / 8, v(C.boisClair), false);
  disque(P, sx, sz, M.margelle.haut + sv.haut - 0.04, sv.rayons[1] * 0.92, 8, v(C.eau));
  toitDuPuits(P, cx, cz, v(C.ardoise), true);
  // La faîtière, à cheval sur le faîte : ses deux bandes descendent du dessus du faîte jusque sur les pans (elle ne
  // flotte plus au-dessus d'eux, relecture des essais), fermée à ses deux bouts.
  const T = M.toit;
  const f = M.faitiere;
  const yf = T.faite + f.haut;
  const pente = (T.faite - T.avantToit) / T.demi;
  const yb = T.faite - pente * f.demi;
  const bois = v(C.bois);
  for (const s of [-1, 1]) P.quad([cx, yf, cz - T.long], [cx, yf, cz + T.long], [cx + s * f.demi, yb, cz + T.long], [cx + s * f.demi, yb, cz - T.long], [cx, yb - 1, cz], bois);
  for (const z of [cz - T.long, cz + T.long]) P.triangle([cx - f.demi, yb, z], [cx + f.demi, yb, z], [cx, yf, z], [cx, yb, cz], bois);
};

// ---------- La grue de Rouxel (la Carrière) ----------

/**
 * La grue : le mât de bois sur son pied de pierre, cerclé de fer, ses deux jambes de force ; la flèche de madrier (la
 * matière livrée : le bloc assemblé du 6e) le long de y, ses deux colliers gris, le contrepoids de pierre sous son talon,
 * le tirant de fer, la poulie, la corde, le crochet, et la caisse de bois posée sous son bout. De loin : le mât, la
 * flèche, le contrepoids et la caisse.
 */
const grue: DessinDObjet = (at, pe, loin) => {
  const bois = pe.couleur(C.bois);
  const fer = pe.couleur(C.fer);
  const madrier = pe.bloc(BLOC.poutre);
  const pierre = { dessus: pe.role('yardSlab'), cote: pe.role('yardStone') };
  const porte = pe.matiere('porte');
  const [mx, my] = [0.5, 0.5];
  const fleche = { x0: 0.33, x1: 0.67, y0: 0.22, y1: 2.96, z0: 2.24, z1: 2.6 };
  if (loin) {
    at.bloc(mx, my, 0.32, 0.32, 0, 2.95, bois, { dessous: true });
    at.boite(fleche.x0, fleche.x1, fleche.y0, fleche.y1, fleche.z0, fleche.z1, madrier);
    at.bloc(mx, 0.3, 0.42, 0.36, 1.9, 2.24, pierre, { dessous: true, dessus: true });
    at.boite(0.14, 0.86, 2.14, 2.86, 0, 0.78, porte);
    return;
  }
  // Le pied, le mât, ses cercles de fer et sa tête.
  at.bloc(mx, my, 0.72, 0.72, 0, 0.24, pierre);
  at.bloc(mx, my, 0.32, 0.32, 0.24, 2.95, bois, { dessous: true, dessus: true });
  for (const z of [0.95, 1.7]) at.bloc(mx, my, 0.38, 0.38, z, z + 0.1, fer, { dessous: true });
  at.pyramide(mx, my, 0.2, 0.2, 2.95, 3.15, pe.couleur(C.ardoise));
  // Les jambes de force, du mât au pied (de part et d'autre, le long de x : la flèche part le long de y).
  for (const s of [-1, 1]) at.poutre([mx + s * 0.33, my, 0.24], [mx + s * 0.12, my, 1.0], 0.12, bois);
  // La flèche de madrier et ses deux colliers.
  at.boite(fleche.x0, fleche.x1, fleche.y0, fleche.y1, fleche.z0, fleche.z1, madrier, {});
  const gris = pe.couleur(0x767e88);
  for (const y of [1.3, 2.6]) at.boite(fleche.x0 - 0.03, fleche.x1 + 0.03, y, y + 0.1, fleche.z0 - 0.03, fleche.z1 + 0.03, gris, { dessous: true });
  // Le contrepoids de pierre, sous le talon de la flèche, contre le mât.
  at.bloc(mx, 0.3, 0.44, 0.38, 1.86, 2.24, pierre, { dessous: false, py: true });
  // Le tirant, de la tête du mât au bout de la flèche.
  at.poutre([mx, my, 2.95], [mx, 2.8, fleche.z1], 0.07, fer);
  // La poulie, la corde, le crochet.
  at.rouleau('x', 0.4, 0.6, 2.78, 2.14, 0.1, 6, fer);
  at.poutre([mx, 2.78, 2.04], [mx, 2.78, 1.2], 0.05, pe.couleur(C.boisClair));
  at.pyramide(mx, 2.78, 0.08, 0.08, 1.2, 1.06, fer);
  // La caisse, sous le bout de la flèche.
  caisse(at, 0.14, 0.86, 2.14, 2.86, 0, 0.78, porte, { dessus: porte.dessus, cote: pe.couleur(C.boisClair) });
};

// ---------- La boutique de Coco (la Plaine) ----------

/**
 * La boutique : le comptoir de bois (la matière livrée, sa grande face devant), sa planche du dessus et ses deux lattes ;
 * deux poteaux de brique au fond, la poutre de brique qui les relie ; l'auvent rayé crème et brique, penché vers
 * l'avant, son lambrequin, ses deux jambes de force ; trois paniers sur le comptoir. De loin : le comptoir, les poteaux,
 * la poutre et l'auvent.
 */
const boutique: DessinDObjet = (at, pe, loin) => {
  const bois = pe.bloc(BLOC.bois);
  const brique = pe.bloc(BLOC.brique);
  const creme = pe.couleur(C.creme);
  const auvent = { x0: 0.04, x1: 2.96, yAvant: 0.06, yFond: 1.8, zAvant: 1.95, zFond: 2.65, raies: 6 };
  const raie = (k: number): Teinte => (k % 2 ? brique.cote : creme);
  const pointAuvent = (x: number, t: number, dz = 0): [number, number, number] => [x, auvent.yAvant + (auvent.yFond - auvent.yAvant) * t, auvent.zAvant + (auvent.zFond - auvent.zAvant) * t + dz];
  if (loin) {
    at.boite(0.08, 2.92, 0.12, 0.88, 0, 1.0, bois);
    for (const x of [0.5, 2.5]) at.bloc(x, 1.5, 0.34, 0.34, 0, 2.0, brique, { dessous: true, dessus: true });
    at.boite(0.33, 2.67, 1.33, 1.67, 2.0, 2.32, brique);
    for (let k = 0; k < 2; k++) {
      const [x0, x1] = [auvent.x0 + (k * (auvent.x1 - auvent.x0)) / 2, auvent.x0 + ((k + 1) * (auvent.x1 - auvent.x0)) / 2];
      at.quad(pointAuvent(x0, 0), pointAuvent(x1, 0), pointAuvent(x1, 1), pointAuvent(x0, 1), [1.5, 1, 0], k ? brique.cote : creme);
    }
    return;
  }
  // Le comptoir, sa planche, ses lattes.
  at.boite(0.08, 2.92, 0.15, 0.85, 0, 0.9, bois, { dessous: true, dessus: true });
  at.boite(0.02, 2.98, 0.08, 0.92, 0.9, 1.0, bois, {});
  const latte = pe.couleur(C.boisClair);
  for (const x of [0.98, 1.92]) at.quad([x, 0.14, 0.06], [x + 0.1, 0.14, 0.06], [x + 0.1, 0.14, 0.84], [x, 0.14, 0.84], [x + 0.05, 0.5, 0.45], latte);
  // Les poteaux et la poutre de brique.
  for (const x of [0.5, 2.5]) at.bloc(x, 1.5, 0.34, 0.34, 0, 2.0, brique, { dessous: true, dessus: true });
  at.boite(0.33, 2.67, 1.33, 1.67, 2.0, 2.32, brique, {});
  // L'auvent : six raies, leur dessous, le lambrequin devant, ses deux flancs.
  const e = 0.06;
  const dessous: [number, number, number] = [1.5, 1, 0];
  const dessus: [number, number, number] = [1.5, 0.6, 4];
  for (let k = 0; k < auvent.raies; k++) {
    const x0 = auvent.x0 + (k * (auvent.x1 - auvent.x0)) / auvent.raies;
    const x1 = auvent.x0 + ((k + 1) * (auvent.x1 - auvent.x0)) / auvent.raies;
    at.quad(pointAuvent(x0, 0), pointAuvent(x1, 0), pointAuvent(x1, 1), pointAuvent(x0, 1), dessous, raie(k));
    at.quad(pointAuvent(x0, 0, -e), pointAuvent(x1, 0, -e), pointAuvent(x1, 1, -e), pointAuvent(x0, 1, -e), dessus, brique.cote);
    // Le lambrequin : une bande qui pend devant, de la couleur de sa raie, en dents.
    const [ya, za] = [auvent.yAvant, auvent.zAvant];
    at.tri([x0, ya, za - e], [x1, ya, za - e], [(x0 + x1) / 2, ya, za - 0.26], [(x0 + x1) / 2, 0.6, za], raie(k));
  }
  for (const x of [auvent.x0, auvent.x1]) at.quad(pointAuvent(x, 0), pointAuvent(x, 1), pointAuvent(x, 1, -e), pointAuvent(x, 0, -e), [1.5, 1, 2.2], brique.cote);
  for (const x of [0.5, 2.5]) at.poutre([x, 1.36, 1.7], [x, 0.5, pointAuvent(x, (0.5 - auvent.yAvant) / (auvent.yFond - auvent.yAvant), -e)[2]], 0.09, bois.cote);
  // Trois paniers sur le comptoir : des fruits verts, orangés, rouges.
  const fruits = [pe.couleur(C.feuille), pe.couleur(C.braise), pe.couleur(0xc24a3a)];
  [0.55, 1.5, 2.45].forEach((x, k) => {
    at.prisme(x, 0.48, 0.2, 0.23, 1.0, 1.14, 6, pe.couleur(C.boisClair), Math.PI / 6, true);
    at.prisme(x, 0.48, 0.19, 0, 1.12, 1.3, 6, fruits[k], Math.PI / 6);
  });
};

// ---------- Le lavoir de Nénu (la Rivière des fractions) ----------

/**
 * Le lavoir : deux piliers de pierre (la matière livrée, leurs quatre grandes faces) sur leur socle, coiffés d'une
 * corniche ; le bassin de galets, son eau et la pierre à laver penchée sur son bord ; la panne de bois posée sur les
 * piliers et ses deux jambes de force ; le toit en appentis dans la couverture de l'île, qui descend vers l'avant et
 * abrite tout le bassin. De loin : les piliers, le bassin et le toit.
 */
const lavoir: DessinDObjet = (at, pe, loin) => {
  const pierre = pe.bloc(BLOC.pierre);
  const galet = pe.bloc(BLOC.galet);
  const toit = pe.toit();
  const bois = pe.couleur(C.bois);
  const piliers = [0.5, 2.5];
  // Le toit en appentis : de l'avant (y0, bas) au fond (y1, haut), épais de `e`.
  const t = { x0: 0, x1: 3, y0: 0.14, y1: 2, bas: 2.28, haut: 2.84, e: 0.1 };
  const zDuToit = (y: number) => t.bas + ((y - t.y0) / (t.y1 - t.y0)) * (t.haut - t.bas);
  const dessus = (x: number, y: number): [number, number, number] => [x, y, zDuToit(y)];
  const dessous = (x: number, y: number): [number, number, number] => [x, y, zDuToit(y) - t.e];
  const sous: [number, number, number] = [1.5, 1, 0];
  if (loin) {
    for (const x of piliers) at.bloc(x, 1.5, 0.52, 0.52, 0, zDuToit(1.5) - t.e, pierre, { dessous: true, dessus: true });
    at.boite(0.86, 2.14, 0.12, 1.86, 0, 0.6, galet);
    at.quad(dessus(t.x0, t.y0), dessus(t.x1, t.y0), dessus(t.x1, t.y1), dessus(t.x0, t.y1), sous, toit);
    return;
  }
  const zPanne = zDuToit(1.62) - t.e;
  for (const x of piliers) {
    at.bloc(x, 1.5, 0.64, 0.64, 0, 0.2, pierre);
    at.bloc(x, 1.5, 0.52, 0.52, 0.2, zPanne - 0.36, pierre, { dessous: true, dessus: true });
    at.bloc(x, 1.5, 0.62, 0.62, zPanne - 0.36, zPanne - 0.22, { dessus: pierre.dessus, cote: pierre.dessus }, {});
  }
  bassin(at, pe, 0.86, 2.14, 0.12, 1.88, 0, 0.6, 0.12, galet, 0.48);
  // La pierre à laver, penchée sur le bord de devant du bassin.
  at.quad([0.98, 0.14, 0.62], [2.02, 0.14, 0.62], [2.02, 0.42, 0.52], [0.98, 0.42, 0.52], [1.5, 0.3, 0], pierre.dessus);
  at.quad([0.98, 0.14, 0.62], [2.02, 0.14, 0.62], [2.02, 0.12, 0.54], [0.98, 0.12, 0.54], [1.5, 0.3, 0.5], pierre.cote);
  // La panne sur les piliers, sous le toit ; les jambes de force vers l'avant du toit.
  at.boite(0.2, 2.8, 1.38, 1.62, zPanne - 0.22, zPanne, bois, {});
  for (const x of piliers) at.poutre([x, 1.26, zPanne - 0.7], [x, 0.5, zDuToit(0.5) - t.e - 0.02], 0.1, bois);
  // Le toit : son dessus, son dessous, ses quatre rives.
  at.quad(dessus(t.x0, t.y0), dessus(t.x1, t.y0), dessus(t.x1, t.y1), dessus(t.x0, t.y1), sous, toit);
  at.quad(dessous(t.x0, t.y0), dessous(t.x1, t.y0), dessous(t.x1, t.y1), dessous(t.x0, t.y1), [1.5, 1, 5], toit);
  at.quad(dessus(t.x0, t.y0), dessus(t.x1, t.y0), dessous(t.x1, t.y0), dessous(t.x0, t.y0), [1.5, 1, zDuToit(1)], toit);
  at.quad(dessus(t.x0, t.y1), dessus(t.x1, t.y1), dessous(t.x1, t.y1), dessous(t.x0, t.y1), [1.5, 1, zDuToit(1)], toit);
  for (const x of [t.x0, t.x1]) at.quad(dessus(x, t.y0), dessus(x, t.y1), dessous(x, t.y1), dessous(x, t.y0), [1.5, 1, zDuToit(1)], toit);
};

// ---------- Le parasol de Lavi (la Lagune des décimales) ----------

/**
 * Le parasol : un pied rond lesté de pierre, le mât d'obsidienne, la toile à douze pans en deux pentes, ses raies de
 * cabine (la matière livrée) et de crème, son dessous, son volant, la pointe de fer. De loin : le mât et la toile à six
 * pans.
 */
const parasol: DessinDObjet = (at, pe, loin) => {
  const [cx, cy] = [1.5, 1.5];
  const cabine = pe.bloc(BLOC.cabine);
  const creme = pe.couleur(C.creme);
  const obsidienne = pe.bloc(BLOC.obsidienne);
  const pierre = { dessus: pe.role('yardSlab'), cote: pe.role('yardStone') };
  const toile = { rebord: 1.45, milieu: 0.8, zRebord: 2.32, zMilieu: 2.72, zPointe: 2.92, volant: 0.15 };
  const pt = (r: number, z: number, i: number, n: number): [number, number, number] => {
    const a = (i / n) * Math.PI * 2 + Math.PI / n;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a), z];
  };
  const raie = (i: number): Teinte => (i % 2 ? creme : cabine.dessus);
  if (loin) {
    at.prisme(cx, cy, 0.09, 0.09, 0, toile.zRebord, 4, obsidienne, Math.PI / 4, true);
    const n = 6;
    for (let i = 0; i < n; i++) at.tri(pt(toile.rebord, toile.zRebord, i, n), pt(toile.rebord, toile.zRebord, i + 1, n), [cx, cy, toile.zPointe], [cx, cy, 0], i % 2 ? creme : cabine.dessus);
    for (let i = 0; i < n; i++) at.tri(pt(toile.rebord, toile.zRebord, i, n), pt(toile.rebord, toile.zRebord, i + 1, n), [cx, cy, toile.zRebord + 0.25], [cx, cy, 4], cabine.cote);
    return;
  }
  at.prisme(cx, cy, 0.36, 0.3, 0, 0.18, 8, pierre);
  at.prisme(cx, cy, 0.09, 0.09, 0.18, toile.zMilieu, 6, obsidienne, 0, true);
  const n = 12;
  const sous: [number, number, number] = [cx, cy, 0];
  for (let i = 0; i < n; i++) {
    at.quad(pt(toile.rebord, toile.zRebord, i, n), pt(toile.rebord, toile.zRebord, i + 1, n), pt(toile.milieu, toile.zMilieu, i + 1, n), pt(toile.milieu, toile.zMilieu, i, n), sous, raie(i));
    at.tri(pt(toile.milieu, toile.zMilieu, i, n), pt(toile.milieu, toile.zMilieu, i + 1, n), [cx, cy, toile.zPointe], sous, raie(i));
    // Le dessous, d'un ton de cabine, et le volant qui pend au rebord.
    at.tri(pt(toile.rebord, toile.zRebord, i, n), pt(toile.rebord, toile.zRebord, i + 1, n), [cx, cy, toile.zRebord + 0.3], [cx, cy, 4], cabine.cote);
    at.quad(pt(toile.rebord, toile.zRebord, i, n), pt(toile.rebord, toile.zRebord, i + 1, n), pt(toile.rebord, toile.zRebord - toile.volant, i + 1, n), pt(toile.rebord, toile.zRebord - toile.volant, i, n), [cx, cy, toile.zRebord], raie(i));
  }
  at.prisme(cx, cy, 0.07, 0, toile.zPointe - 0.02, toile.zPointe + 0.12, 4, pe.couleur(C.fer), 0);
};

// ---------- La pendule de Robin (la Baie des mots) ----------

/**
 * La pendule : un socle de bois mouluré, le corps de cabine et sa fenêtre où se voit le balancier de laiton, la tête de
 * cadran (la matière livrée : sa grande face devant, le cadran crème, les aiguilles et les quatre repères), coiffée d'un
 * fronton dans la couverture de l'île. De loin : le socle, le corps, la tête, le cadran et le fronton.
 */
const pendule: DessinDObjet = (at, pe, loin) => {
  const porte = pe.matiere('porte');
  const cabine = pe.bloc(BLOC.cabine);
  const cadran = pe.bloc(BLOC.cadran);
  const fer = pe.couleur(C.fer);
  const tete = { x0: 0.08, x1: 1.92, y0: 0.12, y1: 0.88, z0: 1.9, z1: 2.74 };
  const centre = { x: 1, z: (tete.z0 + tete.z1) / 2 };
  const yd = tete.y0 - 0.012;
  // Un disque tourné vers l'avant (−y), en (x, z), de rayon r, à `n` pans.
  const disqueDevant = (x: number, z: number, r: number, y: number, n: number, t: Teinte) => {
    const p = (i: number): [number, number, number] => [x + r * Math.cos((i / n) * Math.PI * 2), y, z + r * Math.sin((i / n) * Math.PI * 2)];
    for (let i = 1; i + 1 < n; i++) at.tri(p(0), p(i), p(i + 1), [x, y + 1, z], t);
  };
  if (loin) {
    at.boite(0.1, 1.9, 0.14, 0.86, 0, 0.66, porte);
    at.boite(0.3, 1.7, 0.24, 0.76, 0.66, tete.z0, cabine, { dessous: true, dessus: true });
    at.boite(tete.x0, tete.x1, tete.y0, tete.y1, tete.z0, tete.z1, cadran);
    disqueDevant(centre.x, centre.z, 0.36, yd, 6, cadran.dessus);
    at.toit(0, 2, 0.06, 0.94, tete.z1, 3, 'y', 0, pe.toit());
    return;
  }
  // Le socle et sa moulure.
  at.boite(0.1, 1.9, 0.14, 0.86, 0, 0.56, porte);
  at.boite(0.05, 1.95, 0.09, 0.91, 0.56, 0.68, { dessus: porte.dessus, cote: porte.dessus }, {});
  // Le corps de cabine, sa fenêtre sombre, le balancier.
  at.boite(0.3, 1.7, 0.24, 0.76, 0.68, tete.z0, cabine, { dessous: true, dessus: true });
  at.quad([0.72, 0.235, 0.84], [1.28, 0.235, 0.84], [1.28, 0.235, 1.74], [0.72, 0.235, 1.74], [1, 0.5, 1.3], fer);
  at.quad([0.97, 0.225, 1.12], [1.03, 0.225, 1.12], [1.03, 0.225, 1.72], [0.97, 0.225, 1.72], [1, 0.5, 1.4], cadran.cote);
  disqueDevant(1, 1.06, 0.12, 0.222, 6, cadran.cote);
  // La tête de cadran, le cadran, les repères, les aiguilles.
  at.boite(tete.x0, tete.x1, tete.y0, tete.y1, tete.z0, tete.z1, cadran, {});
  disqueDevant(centre.x, centre.z, 0.36, yd, 12, cadran.dessus);
  const ym = yd - 0.006;
  for (let k = 0; k < 4; k++) {
    const a = (k * Math.PI) / 2;
    const [rx, rz] = [centre.x + Math.cos(a) * 0.29, centre.z + Math.sin(a) * 0.29];
    at.quad([rx - 0.03, ym, rz - 0.03], [rx + 0.03, ym, rz - 0.03], [rx + 0.03, ym, rz + 0.03], [rx - 0.03, ym, rz + 0.03], [rx, 1, rz], fer);
  }
  at.quad([centre.x - 0.025, ym, centre.z], [centre.x + 0.025, ym, centre.z], [centre.x + 0.025, ym, centre.z + 0.24], [centre.x - 0.025, ym, centre.z + 0.24], [centre.x, 1, centre.z], fer);
  at.quad([centre.x, ym, centre.z - 0.025], [centre.x + 0.18, ym, centre.z - 0.025], [centre.x + 0.18, ym, centre.z + 0.025], [centre.x, ym, centre.z + 0.025], [centre.x, 1, centre.z], fer);
  // Le fronton : un petit toit à deux pans, son pignon tourné vers l'avant.
  at.toit(0, 2, 0.06, 0.94, tete.z1, 3, 'y', 0.06, pe.toit(), { teinte: cadran.cote, zPied: tete.z1 });
};

// ---------- Le tamis de Silex (la Fouille) ----------

/**
 * Le tamis : deux poteaux de bois au milieu des bouts de la forme, une traverse de l'un à l'autre, le grand cadre de
 * bois pendu dessous par quatre cordes, le sable (la matière livrée) qui le remplit, et le tas de sable tamisé dessous.
 * De loin : les poteaux, la traverse, le cadre et son sable.
 */
const tamis: DessinDObjet = (at, pe, loin) => {
  const sable = pe.bloc(BLOC.sable);
  const poteau = pe.role('yardPost');
  const bois = pe.couleur(C.boisClair);
  const cadre = { x0: 0.06, x1: 2.94, y0: 1.06, y1: 1.94, z0: 0.66, z1: 0.84 };
  if (loin) {
    for (const y of [0.5, 2.5]) at.bloc(1.5, y, 0.22, 0.22, 0, 1.3, poteau, { dessous: true });
    at.boite(1.42, 1.58, 0.5, 2.5, 1.2, 1.32, bois, { dessous: true });
    at.boite(cadre.x0, cadre.x1, cadre.y0, cadre.y1, cadre.z0, cadre.z1, { dessus: sable.dessus, cote: bois });
    return;
  }
  for (const y of [0.5, 2.5]) {
    at.bloc(1.5, y, 0.22, 0.22, 0, 1.32, poteau, { dessous: true, dessus: true });
    at.pyramide(1.5, y, 0.11, 0.11, 1.32, 1.42, poteau);
  }
  at.boite(1.42, 1.58, 0.61, 2.39, 1.2, 1.32, bois, { dessus: false, dessous: false, py: true, ny: true });
  // Le cadre : ses flancs, son rebord, son dessous ; le sable au ras du rebord.
  at.boite(cadre.x0, cadre.x1, cadre.y0, cadre.y1, cadre.z0, cadre.z1, bois, { dessus: true });
  const r = 0.09;
  const [i0, i1, j0, j1] = [cadre.x0 + r, cadre.x1 - r, cadre.y0 + r, cadre.y1 - r];
  const z = cadre.z1;
  const c: [number, number, number] = [1.5, 1.5, z - 1];
  at.quad([cadre.x0, cadre.y0, z], [cadre.x1, cadre.y0, z], [i1, j0, z], [i0, j0, z], c, bois);
  at.quad([cadre.x1, cadre.y0, z], [cadre.x1, cadre.y1, z], [i1, j1, z], [i1, j0, z], c, bois);
  at.quad([cadre.x1, cadre.y1, z], [cadre.x0, cadre.y1, z], [i0, j1, z], [i1, j1, z], c, bois);
  at.quad([cadre.x0, cadre.y1, z], [cadre.x0, cadre.y0, z], [i0, j0, z], [i0, j1, z], c, bois);
  at.quad([i0, j0, z - 0.03], [i1, j0, z - 0.03], [i1, j1, z - 0.03], [i0, j1, z - 0.03], c, sable.dessus);
  // Les cordes, de la traverse aux quatre coins du cadre.
  const corde = pe.couleur(C.bois);
  for (const [x, y] of [
    [cadre.x0 + 0.2, cadre.y0 + 0.12],
    [cadre.x1 - 0.2, cadre.y0 + 0.12],
    [cadre.x0 + 0.2, cadre.y1 - 0.12],
    [cadre.x1 - 0.2, cadre.y1 - 0.12],
  ])
    at.poutre([1.5, y < 1.5 ? 1.2 : 1.8, 1.2], [x, y, z], 0.05, corde);
  // Le tas de sable tamisé, sous le cadre.
  at.prisme(1.5, 1.5, 0.62, 0, 0, 0.44, 8, sable.dessus);
};

// ---------- Le nichoir de Fougère (la Pointe des paysages) ----------

/**
 * Le nichoir : un poteau de bois sur un pied de pierre, la longue maison de bois et ses trois trous ronds, chacun avec
 * son perchoir ; le toit de chaume (la matière livrée : ses deux grands pans) épais, sa faîtière dans la couverture de
 * l'île, ses pignons de bois. De loin : le poteau, la maison et les deux pans de chaume.
 */
const nichoir: DessinDObjet = (at, pe, loin) => {
  const chaume = pe.bloc(BLOC.chaume);
  const bois = pe.couleur(C.boisClair);
  const poteau = pe.role('yardPost');
  const maison = { x0: 0.18, x1: 2.82, y0: 0.22, y1: 0.78, z0: 1.05, z1: 1.72 };
  const toit = { x0: 0.04, x1: 2.96, y0: 0, y1: 1, bas: 1.66, haut: 2.36 };
  if (loin) {
    at.bloc(1.5, 0.5, 0.22, 0.22, 0, maison.z0, poteau, { dessous: true, dessus: true });
    at.boite(maison.x0, maison.x1, maison.y0, maison.y1, maison.z0, maison.z1, bois, { dessus: true });
    for (const [y0, y1] of [
      [toit.y0, 0.5],
      [0.5, toit.y1],
    ])
      at.quad([toit.x0, y0, y0 === toit.y0 ? toit.bas : toit.haut], [toit.x1, y0, y0 === toit.y0 ? toit.bas : toit.haut], [toit.x1, y1, y1 === toit.y1 ? toit.bas : toit.haut], [toit.x0, y1, y1 === toit.y1 ? toit.bas : toit.haut], [1.5, 0.5, 0], chaume.dessus);
    return;
  }
  at.bloc(1.5, 0.5, 0.42, 0.42, 0, 0.14, { dessus: pe.role('yardSlab'), cote: pe.role('yardStone') });
  at.bloc(1.5, 0.5, 0.22, 0.22, 0.14, maison.z0, poteau, { dessous: true, dessus: true });
  at.boite(maison.x0, maison.x1, maison.y0, maison.y1, maison.z0, maison.z1, bois, { dessus: true });
  // Les trois trous ronds sur la face de devant, et leurs perchoirs.
  const sombre = pe.couleur(C.fer);
  const yt = maison.y0 - 0.01;
  for (const x of [0.62, 1.5, 2.38]) {
    const zt = 1.44;
    const p = (i: number): [number, number, number] => [x + 0.13 * Math.cos((i / 6) * Math.PI * 2), yt, zt + 0.13 * Math.sin((i / 6) * Math.PI * 2)];
    for (let i = 1; i < 5; i++) at.tri(p(0), p(i), p(i + 1), [x, 1, zt], sombre);
    at.poutre([x, maison.y0, 1.2], [x, maison.y0 - 0.2, 1.2], 0.06, pe.couleur(C.bois), true);
  }
  // Le toit de chaume, épais, ses pignons de bois sur la maison, sa faîtière.
  at.toit(toit.x0, toit.x1, toit.y0, toit.y1, toit.bas, toit.haut, 'x', 0.16, chaume, { teinte: bois, zPied: maison.z1 });
  const faitiere = pe.toit();
  at.boite(toit.x0, toit.x1, 0.4, 0.6, toit.haut - 0.06, toit.haut + 0.06, faitiere, {});
};

/** Les petites constructions à silhouette du 6e, par identifiant (world/fixtures.ts), et leur dessin. */
export const SILHOUETTES: Readonly<Record<string, DessinDObjet>> = {
  'french-6e-letter-confusion-fixture-1': puits,
  'french-6e-word-spelling-fixture-1': grue,
  'maths-6e-calculation-fixture-1': boutique,
  'maths-6e-fractions-fixture-1': lavoir,
  'maths-6e-decimals-fixture-1': parasol,
  'english-6e-vocabulary-fixture-1': pendule,
  'history-6e-antiquity-fixture-1': tamis,
  'life-earth-sciences-6e-living-world-fixture-1': nichoir,
};
