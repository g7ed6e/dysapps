// Les pièces communes des objets dessinés d'Archipéo (lot 1 du 6e, piste 3 « hybride ») : la palette d'un objet, et ce
// qui revient d'un objet à l'autre. La barrière et la lanterne sur poteau sont celles des cours
// (../architecture/yardPieces.ts : mêmes facettes, mêmes couleurs du kit) ; s'y ajoutent la caisse, la dalle, le plateau
// sur pieds, le petit toit (`Atelier.toit`), le bassin, la marche de pierre, le flacon, et pour le reste de l'archipel le
// trophée du Gardien rallumé, la barque, la caisse, le fanion et le foyer du quai. Trapues, rien de fin ni d'ajouré (au
// moins 0,15 case), deux ou trois couleurs chacune. Code pur, sans Three.js.
import { BLOCKS, type BlockId } from '../../biomes';
import { mixColor } from '../daylight';
import { DELAVE } from '../decor/brush';
import type { ArchipelagoId } from '../map';
import { ambianceDe, type Couleur, couleurDeMatiere, type Faces } from '../palette';
import type { TextureKind } from '../pixels';
import { couleursDuToit } from '../roofs';
import { barriereDeCour, KITS, LANTERNE_DE_COUR, type Role } from '../architecture';
import type { Facette } from '../architecture/rooms';
import type { Atelier, Teinte } from './atelier';
import type { V3 } from '../decor/brush';

/**
 * Les couleurs propres aux objets (concepts du directeur artistique, les mêmes que le puits et les pièces de la cour) :
 * le bois des poteaux et des lisses, le fer, l'ardoise, la pierre et la dalle, l'eau et son liseré, la feuille, la
 * braise, le goudron de la coque.
 */
export const COULEURS_DES_OBJETS = {
  bois: 0x6e4a2c,
  boisClair: 0x7a5434,
  fer: 0x3a2a22,
  ardoise: 0x4e6378,
  pierre: 0x8e8c84,
  pierreSombre: 0x6f6d66,
  dalle: 0xcfc6b4,
  eau: 0x4a9be0,
  lisere: 0x8fc4ee,
  feuille: 0x5e9a3e,
  braise: 0xc0764a,
  goudron: 0x3b2d20,
  creme: 0xf1e6cc,
} as const;

/** Les couleurs d'un objet posé dans un archipel : sous son voile, délavées sur une île fermée. */
export interface Peinture {
  readonly a: ArchipelagoId;
  readonly muted: boolean;
  /** Une matière (les couleurs mêmes du bloc, `couleurDeMatiere`). */
  matiere(t: TextureKind): Faces;
  /** La matière d'un bloc. */
  bloc(b: BlockId): Faces;
  /** Une couleur propre à l'objet, sous le voile. */
  couleur(c: Couleur): Couleur;
  /** Un rôle du kit (le poteau et les lisses de la barrière, la pierre, la dalle, le fer et l'ardoise de la lanterne). */
  role(r: Role): Couleur;
  /** La couverture de l'île (ardoise, ou terre cuite à la Ferme et à la Mine). */
  toit(): Faces;
}

export function peintureDe(a: ArchipelagoId, ile: string | undefined, muted: boolean): Peinture {
  const [teinte, force] = ambianceDe(a).voile;
  const delave = (c: Couleur) => (muted ? mixColor(c, DELAVE[0], DELAVE[1]) : c);
  const matiere = (t: TextureKind): Faces => {
    const f = couleurDeMatiere(a, t);
    return { dessus: delave(f.dessus), cote: delave(f.cote) };
  };
  return {
    a,
    muted,
    matiere,
    bloc: (b) => matiere(BLOCKS[b].texture as TextureKind),
    couleur: (c) => delave(mixColor(c, teinte, force)),
    role: (r) => delave(mixColor(KITS[a].couleurs[r] ?? COULEURS_DES_OBJETS.bois, teinte, force)),
    toit: () => couleursDuToit(a, ile, muted),
  };
}

/** La teinte d'une facette de pièce de cour : son rôle du kit. */
const parRole = (pe: Peinture) => (f: Facette) => pe.role(f.role ?? 'yardPost');

/** Le poteau de barrière seul des cours (son chapeau en pyramide), dans la case (x, y), posé en z : 12 triangles. */
export function poteauDeBarriere(at: Atelier, pe: Peinture, x: number, y: number, z: number): void {
  at.facettes(barriereDeCour('seul', null, true).facettes, x, y, z, parRole(pe));
}

/** Les mesures de la lanterne sur poteau (celle des cours : ../architecture/yardPieces.ts). */
const POTEAU_DE_LANTERNE = { cote: 0.24, pied: { cote: 0.44, haut: 0.14 } } as const;

/**
 * La lanterne sur poteau des cours, dans la case (x, y) : le pied de pierre posé en `zPied` (s'il est sous la tête), le
 * poteau jusqu'à `zTete`, la tête de bois, de fer et d'ardoise posée en `zTete`, ses quatre vitres dans le feu
 * (allumées la nuit, sans clignoter). Une tête seule si `zPied` est `null`. 42 triangles et 8 de vitres, avec le poteau.
 */
export function lanterneSurPoteau(at: Atelier, pe: Peinture, x: number, y: number, zPied: number | null, zTete: number): void {
  const { cote, pied } = POTEAU_DE_LANTERNE;
  if (zPied !== null && zTete > zPied) {
    at.bloc(x + 0.5, y + 0.5, pied.cote, pied.cote, zPied, zPied + pied.haut, pe.role('yardStone'));
    at.bloc(x + 0.5, y + 0.5, cote, cote, zPied + pied.haut, zTete, pe.role('yardPost'), { dessous: true, dessus: true });
  }
  at.facettes(LANTERNE_DE_COUR, x, y, zTete, parRole(pe), pe.role('lanternGlass'));
}

/**
 * Une caisse de (x0, y0) à (x1, y1), de z0 à z1, dans une matière (le carton de Bulle, le bois du quai) : le corps, et
 * son couvercle qui déborde un peu, d'un ton plus sombre (`bord`). 20 triangles.
 */
export function caisse(at: Atelier, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, corps: Teinte, bord: Teinte): void {
  const d = 0.035;
  const h = Math.min(0.12, (z1 - z0) * 0.18);
  at.boite(x0, x1, y0, y1, z0, z1 - h, corps, { dessous: true, dessus: true });
  at.boite(x0 - d, x1 + d, y0 - d, y1 + d, z1 - h, z1, bord);
}

/** Une dalle posée, de (x0, y0) à (x1, y1), haute de `h` depuis z0, sans dessous : 10 triangles. */
export function dalle(at: Atelier, x0: number, x1: number, y0: number, y1: number, z0: number, h: number, t: Teinte): void {
  at.boite(x0, x1, y0, y1, z0, z0 + h, t);
}

/**
 * Un plateau sur pieds (l'établi, l'urne, le banc) : le plateau de (x0, y0) à (x1, y1), son dessus en `zHaut`, épais de
 * `epais`, dans sa matière ; les pieds carrés de `cotePied` aux points donnés, du sol à son dessous. 10 + 8 par pied.
 */
export function plateauSurPieds(at: Atelier, x0: number, x1: number, y0: number, y1: number, zHaut: number, epais: number, plateau: Teinte, pieds: readonly (readonly [number, number])[], cotePied: number, pied: Teinte): void {
  at.boite(x0, x1, y0, y1, zHaut - epais, zHaut, plateau, {});
  for (const [px, py] of pieds) at.bloc(px, py, cotePied, cotePied, 0, zHaut - epais, pied, { dessous: true, dessus: true });
}

/**
 * Un bassin rectangulaire de (x0, y0) à (x1, y1) : ses murs épais de `e`, de z0 au bord en `zBord`, dans sa matière
 * (dehors, dessus du bord, dedans), l'eau en `zEau` et son liseré clair contre la paroi. 38 triangles.
 */
export function bassin(at: Atelier, pe: Peinture, x0: number, x1: number, y0: number, y1: number, z0: number, zBord: number, e: number, mur: Faces, zEau: number): void {
  at.boite(x0, x1, y0, y1, z0, zBord, mur, { dessous: true, dessus: true });
  const [i0, i1, j0, j1] = [x0 + e, x1 - e, y0 + e, y1 - e];
  const c: V3 = [(x0 + x1) / 2, (y0 + y1) / 2, zBord - 1];
  // Le dessus du bord, en quatre bandes.
  at.quad([x0, y0, zBord], [x1, y0, zBord], [i1, j0, zBord], [i0, j0, zBord], c, mur);
  at.quad([x1, y0, zBord], [x1, y1, zBord], [i1, j1, zBord], [i1, j0, zBord], c, mur);
  at.quad([x1, y1, zBord], [x0, y1, zBord], [i0, j1, zBord], [i1, j1, zBord], c, mur);
  at.quad([x0, y1, zBord], [x0, y0, zBord], [i0, j0, zBord], [i0, j1, zBord], c, mur);
  // La paroi intérieure, du bord à l'eau, tournée vers le milieu.
  const m: V3 = [(x0 + x1) / 2, (y0 + y1) / 2, (zEau + zBord) / 2];
  const dehors = (p: V3, q: V3): V3 => [2 * (p[0] + q[0]) / 2 - m[0], 2 * (p[1] + q[1]) / 2 - m[1], m[2]];
  const coins: V3[] = [
    [i0, j0, 0],
    [i1, j0, 0],
    [i1, j1, 0],
    [i0, j1, 0],
  ];
  for (let k = 0; k < 4; k++) {
    const [p, q] = [coins[k], coins[(k + 1) % 4]];
    at.quad([p[0], p[1], zEau], [q[0], q[1], zEau], [q[0], q[1], zBord], [p[0], p[1], zBord], dehors(p, q), mur);
  }
  // L'eau, et son liseré.
  const l = Math.min(i1 - i0, j1 - j0) * 0.14;
  const eau = pe.couleur(COULEURS_DES_OBJETS.eau);
  const lisere = pe.couleur(COULEURS_DES_OBJETS.lisere);
  at.boite(i0, i1, j0, j1, zEau - 0.01, zEau, lisere, { dessous: true, px: true, nx: true, py: true, ny: true });
  at.boite(i0 + l, i1 - l, j0 + l, j1 - l, zEau, zEau + 0.005, eau, { dessous: true, px: true, nx: true, py: true, ny: true });
}

/** Une marche de pierre (l'escalier de Grimoire) : un bloc de pierre grise de z0 à z1, sa dalle claire dessus. 10 triangles. */
export function marcheDePierre(at: Atelier, pe: Peinture, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number): void {
  at.boite(x0, x1, y0, y1, z0, z1, { dessus: pe.role('yardSlab'), cote: pe.role('yardStone') });
}

/** Un flacon de verre teinté (l'étagère de Bulle) : un corps à six pans, son col de bois (le bouchon). 26 triangles. */
export function flacon(at: Atelier, pe: Peinture, cx: number, cy: number, z0: number, haut: number, verre: Couleur): void {
  const r = haut * 0.32;
  at.prisme(cx, cy, r, r * 0.9, z0, z0 + haut * 0.66, 6, pe.couleur(verre));
  at.prisme(cx, cy, r * 0.42, r * 0.42, z0 + haut * 0.66, z0 + haut, 4, pe.couleur(COULEURS_DES_OBJETS.bois), Math.PI / 4);
}

// ---------- Le trophée du Gardien rallumé ----------

/** Les mesures du trophée, en part de case : le socle de pierre taillée, sa corniche, le lingot d'or facetté. */
const TROPHEE = {
  plinthe: { cote: 0.9, hauteur: 0.1 },
  socle: { bas: 0.8, haut: 0.64, hauteur: 0.78 },
  corniche: { cote: 0.78, hauteur: 0.12 },
  lingot: { base: [0.6, 0.36], dessus: [0.42, 0.2], hauteur: 0.26 },
} as const;

/**
 * Le bloc d'or d'un Gardien rallumé (cases (x, y, z) de pierre et (x, y, z + 1) d'or) : sa plinthe, le socle de pierre taillé
 * en tronc de pyramide, sa corniche, et sur elle un lingot d'or facetté, tourné d'un huitième de tour (son grand côté vers la
 * caméra et sa tranche). 46 triangles. Il tient dans les deux cases qu'il remplace.
 */
export function trophee(at: Atelier, pe: Peinture): void {
  const { plinthe, socle, corniche, lingot } = TROPHEE;
  const pierre = pe.matiere('pierre');
  const or = pe.matiere('or');
  at.bloc(0.5, 0.5, plinthe.cote, plinthe.cote, 0, plinthe.hauteur, { dessus: pierre.dessus, cote: pe.role('yardStone') });
  at.prisme(0.5, 0.5, (socle.bas / 2) * Math.SQRT2, (socle.haut / 2) * Math.SQRT2, plinthe.hauteur, socle.hauteur, 4, { dessus: pierre.dessus, cote: pierre.cote }, Math.PI / 4, true);
  at.bloc(0.5, 0.5, corniche.cote, corniche.cote, socle.hauteur, socle.hauteur + corniche.hauteur, { dessus: pe.role('yardSlab'), cote: pierre.dessus });
  // Le lingot : un tronc de pyramide à base rectangulaire, ses arêtes du dessus abattues (un chanfrein : le facetté).
  const z0 = socle.hauteur + corniche.hauteur;
  const z1 = z0 + lingot.hauteur;
  const zc = z1 - lingot.hauteur * 0.3;
  const ang = Math.PI / 8;
  const rot = (u: number, v: number, z: number): V3 => [0.5 + u * Math.cos(ang) - v * Math.sin(ang), 0.5 + u * Math.sin(ang) + v * Math.cos(ang), z];
  const [bx, by] = [lingot.base[0] / 2, lingot.base[1] / 2];
  const [hx, hy] = [lingot.dessus[0] / 2, lingot.dessus[1] / 2];
  const [mx, my] = [(bx + hx) / 2 + 0.02, (by + hy) / 2 + 0.02];
  const bas = [rot(-bx, -by, z0), rot(bx, -by, z0), rot(bx, by, z0), rot(-bx, by, z0)];
  const mil = [rot(-mx, -my, zc), rot(mx, -my, zc), rot(mx, my, zc), rot(-mx, my, zc)];
  const haut = [rot(-hx, -hy, z1), rot(hx, -hy, z1), rot(hx, hy, z1), rot(-hx, hy, z1)];
  const dedans: V3 = [0.5, 0.5, z0 + 0.05];
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4;
    at.quad(bas[i], bas[j], mil[j], mil[i], dedans, or.cote);
    at.quad(mil[i], mil[j], haut[j], haut[i], dedans, or.dessus);
  }
  at.quad(haut[0], haut[1], haut[2], haut[3], dedans, or.dessus);
}

// ---------- Les objets du quai ----------

/**
 * La barque du quai, de `long` cases (4) sur 2, le long de `axe`, posée en z0 : la coque goudronnée à fond plat, la proue
 * pointue et relevée, la poupe à tableau, le plat-bord de bois clair, deux bancs. Retournée (`retournee`, échouée sur
 * la grève), la coque seule, la quille de bois en l'air. 85 triangles (35 retournée).
 */
export function barque(at: Atelier, pe: Peinture, axe: 'x' | 'y', long: number, retournee: boolean): void {
  // Dans le repère de la barque : `u` le long de l'axe, `v` en travers (de 0 à 2) ; le plat-bord, de la poupe à la proue
  // et retour, et sa hauteur (relevé aux bouts).
  const pt = (u: number, v: number, z: number): V3 => (axe === 'x' ? [u, v, z] : [v, u, z]);
  const [um, vm] = [long / 2, 1];
  const goudron = pe.couleur(COULEURS_DES_OBJETS.goudron);
  const bois = pe.matiere('planches');
  const bord: readonly (readonly [number, number, number])[] = [
    [0.15, 0.6, 0.95],
    [0.6, 0.18, 0.82],
    [um, 0.1, 0.76],
    [long - 0.8, 0.22, 0.84],
    [long - 0.05, vm, 1.25],
    [long - 0.8, 1.78, 0.84],
    [um, 1.9, 0.76],
    [0.6, 1.82, 0.82],
    [0.15, 1.4, 0.95],
  ];
  const n = bord.length;
  // Le fond, plus étroit et plus court que le plat-bord ; retournée, la coque tête en bas.
  const fond = bord.map(([u, v]) => [um + (u - um) * 0.8, vm + (v - vm) * 0.55] as const);
  const zf = 0.12;
  const h = (z: number) => (retournee ? 1.15 - z : z);
  const centre: V3 = pt(um, vm, h(0.5));
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    at.quad(pt(fond[i][0], fond[i][1], h(zf)), pt(fond[j][0], fond[j][1], h(zf)), pt(bord[j][0], bord[j][1], h(bord[j][2])), pt(bord[i][0], bord[i][1], h(bord[i][2])), centre, goudron);
  }
  const loinDuFond: V3 = pt(um, vm, h(zf) + (retournee ? -1 : 1));
  for (let i = 1; i + 1 < n; i++) at.tri(pt(fond[0][0], fond[0][1], h(zf)), pt(fond[i][0], fond[i][1], h(zf)), pt(fond[i + 1][0], fond[i + 1][1], h(zf)), loinDuFond, retournee ? goudron : bois.cote);
  if (retournee) {
    // La quille, le long de la coque retournée.
    const q = long * 0.36;
    const [z0, z1] = [h(zf), h(zf) + 0.1];
    if (axe === 'x') at.boite(um - q, um + q, vm - 0.08, vm + 0.08, z0, z1, bois.cote);
    else at.boite(vm - 0.08, vm + 0.08, um - q, um + q, z0, z1, bois.cote);
    return;
  }
  // Le dedans de la coque (du bois), un peu en retrait du plat-bord, et le plat-bord.
  const dedans = bord.map(([u, v, z]) => [u + (um - u) * 0.05, v + Math.sign(vm - v) * Math.min(0.1, Math.abs(vm - v)), z - 0.04] as const);
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const [a, b, ai, bi] = [bord[i], bord[j], dedans[i], dedans[j]];
    const dehors: V3 = pt(um + (a[0] + b[0] - 2 * um) * 2, vm + (a[1] + b[1] - 2 * vm) * 2, a[2]);
    at.quad(pt(ai[0], ai[1], ai[2]), pt(bi[0], bi[1], bi[2]), pt(fond[j][0], fond[j][1], zf + 0.02), pt(fond[i][0], fond[i][1], zf + 0.02), dehors, bois.cote);
    at.quad(pt(a[0], a[1], a[2]), pt(b[0], b[1], b[2]), pt(bi[0], bi[1], bi[2]), pt(ai[0], ai[1], ai[2]), pt(um, vm, -1), bois.dessus);
  }
  // Deux bancs en travers.
  for (const u of [long * 0.33, long * 0.62]) {
    const [u0, u1] = [u - 0.13, u + 0.13];
    if (axe === 'x') at.boite(u0, u1, 0.32, 1.68, 0.5, 0.6, bois, {});
    else at.boite(0.32, 1.68, u0, u1, 0.5, 0.6, bois, {});
  }
}

/** Une caisse du quai, de toute la hauteur de sa case posée en z (planches, couvercle plus sombre) : 20 triangles. */
export function caisseDuQuai(at: Atelier, pe: Peinture, x: number, y: number, z: number): void {
  const bois = pe.matiere('planches');
  caisse(at, x + 0.08, x + 0.92, y + 0.08, y + 0.92, z, z + 1, bois, { dessus: bois.dessus, cote: pe.couleur(COULEURS_DES_OBJETS.boisClair) });
}

/**
 * Le fanion du quai : un mât de bois de trois cases dans la case (x, y), posé en z, coiffé d'une pointe de fer, et une
 * flamme de toile triangulaire, épaisse, qui part vers `vers` (−1 ou 1, le long de x) en haut du mât. 28 triangles.
 */
export function fanion(at: Atelier, pe: Peinture, x: number, y: number, z: number, vers: -1 | 1): void {
  const cx = x + 0.5;
  const cy = y + 0.5;
  at.prisme(cx, cy, 0.1, 0.08, z, z + 2.84, 6, pe.matiere('tronc'), 0, true);
  at.prisme(cx, cy, 0.12, 0, z + 2.84, z + 3, 6, pe.couleur(COULEURS_DES_OBJETS.fer), 0);
  const toile = pe.matiere('toile');
  const [zb, zh] = [z + 2.1, z + 2.8];
  const bout = cx + vers * 1.35;
  const e = 0.05;
  const a: V3[] = [
    [cx, cy - e, zh],
    [cx, cy - e, zb],
    [bout, cy - e, (zb + zh) / 2 - 0.08],
  ];
  const b = a.map(([px, , pz]) => [px, cy + e, pz] as V3);
  const m: V3 = [cx + vers * 0.4, cy, (zb + zh) / 2];
  at.tri(a[0], a[1], a[2], m, toile.cote);
  at.tri(b[0], b[1], b[2], m, toile.cote);
  for (let i = 1; i < 3; i++) at.quad(a[i], a[(i + 1) % 3], b[(i + 1) % 3], b[i], m, toile.dessus);
}

/**
 * Le foyer du quai, dans sa case posée en z : un cercle de pierres (un anneau bas à six pans), la cendre, trois bûches
 * croisées et la braise au milieu (mate, elle ne brille pas). La fumée reste celle du quai. 56 triangles.
 */
export function foyer(at: Atelier, pe: Peinture, x: number, y: number, z: number): void {
  const [cx, cy] = [x + 0.5, y + 0.5];
  const pierre = pe.matiere('pierre');
  const n = 6;
  at.prisme(cx, cy, 0.46, 0.42, z, z + 0.2, n, pierre, Math.PI / n, true);
  at.couronne(cx, cy, z + 0.2, 0.28, 0.42, n, pierre.dessus);
  at.disque(cx, cy, z + 0.17, 0.3, n, pe.couleur(COULEURS_DES_OBJETS.goudron));
  const bois = pe.matiere('tronc');
  for (let k = 0; k < 3; k++) {
    const ang = (k * 2 * Math.PI) / 3 + 0.3;
    const [dx, dy] = [Math.cos(ang) * 0.26, Math.sin(ang) * 0.26];
    at.poutre([cx + dx, cy + dy, z + 0.2], [cx + dx * 0.15, cy + dy * 0.15, z + 0.36], 0.09, bois);
  }
  at.pyramide(cx, cy, 0.09, 0.09, z + 0.17, z + 0.34, pe.couleur(COULEURS_DES_OBJETS.braise));
}

