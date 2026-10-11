// Les petites constructions dessinées d'Archipéo (premier essai de la piste 3 « hybride » du directeur artistique, choisie
// par le mainteneur le 11 octobre 2026) : une commande dont la silhouette fait l'objet reçoit un modèle propre, low poly
// en aplats francs, dessiné par le code (aucun fichier importé), qui remplace les cubes de sa forme une fois posée. Le
// premier : le puits de Tunel (la Mine des lettres, 6e), d'après son concept : une margelle ronde de brique (la matière
// livrée, règle GD-7 : la plus grande face de l'objet, dans les couleurs mêmes du bloc), l'eau, deux poteaux de bois
// épais, un treuil et un petit toit d'ardoise à deux pans.
//
// La forme, ses cases, sa place et la sauvegarde ne changent pas (./fixtures.ts). La pose non plus : pendant « Livrer »,
// la page retire la petite construction de la construction et la pose en fondu, couche par couche (./fadeMesh.ts) ; la
// vague finie, le monde la rend posée, et le modèle entier prend la place des cubes (au carillon). Blocland garde ses
// cubes : seule la construction d'Archipéo (./construction.ts) lit ce fichier. De près (l'île où se trouve l'élève), le
// modèle entier ; de loin, ses volumes. Code pur, sans Three.js.
import type { VoxelCube } from './cube';
import { type BiomeId, BIOMES } from '../biomes';
import type { ArchipelagoId } from './map';
import type { Cell } from './view';
import type { ImportedMonument } from './monumentModels';
import { casesDeLaPetiteConstructionDansLeMonde } from './terrain/fixture';
import { type FacettesDuDecor, DELAVE, Pinceau, type Peindre, rgb, tronconique, type V3 } from './decor/brush';
import { lineaire } from './landMesh';
import { ambianceDe, type Couleur, couleurDeMatiere } from './palette';
import { mixColor } from './daylight';

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
  /** La faîtière de bois sur le faîte : sa demi-largeur et sa hauteur au-dessus des pans. */
  faitiere: { demi: 0.09, haut: 0.06 },
  /** Le toit à deux pans, son faîte le long de y : sa demi-largeur, son avant-toit, son faîte, son épaisseur, sa demi-longueur. */
  toit: { demi: 0.8, avantToit: 1.98, faite: 2.46, epaisseur: 0.09, long: 1.4 },
} as const;

/** Les couleurs du puits (concept du directeur artistique), sauf la brique : celle du bloc livré, dans l'archipel. */
const COULEURS_DU_PUITS = {
  /** Le second ton de la brique, en damier sur le mur : la brique des côtés, un peu plus sombre. */
  briqueSombre: 0.88,
  eau: 0x4a9be0,
  lisere: 0x8fc4ee,
  bois: 0x6e4a2c,
  treuil: 0x7a5434,
  ardoise: 0x4e6378,
} as const;

/** Où le puits se pose : le centre de sa forme (repère Three : x, et z pour y), le sol sous elle, et s'il est délavé. */
interface PoseDuPuits {
  cx: number;
  cz: number;
  pied: number;
  muted: boolean;
}

/** Une couleur sous le voile de l'archipel (comme les matières et les rôles du kit), délavée sur une île fermée. */
function voilee(a: ArchipelagoId, c: Couleur, muted: boolean): Couleur {
  const [teinte, force] = ambianceDe(a).voile;
  const v = mixColor(c, teinte, force);
  return muted ? mixColor(v, DELAVE[0], DELAVE[1]) : v;
}

/** Un aplat franc : la même couleur sur toute la facette (la lumière de la scène fait le reste). */
const aplat = (c: Couleur): Peindre => {
  const k = rgb(c).map((v) => lineaire(v / 255)) as [number, number, number];
  return () => k;
};

/** Un point d'un anneau à `n` pans, tourné d'un demi-pan : un pan à plat vers chaque axe. */
const surLAnneau = (cx: number, cz: number, r: number, y: number, i: number, n: number): V3 => {
  const a = ((i + 0.5) / n) * Math.PI * 2;
  return [cx + r * Math.cos(a), y, cz + r * Math.sin(a)];
};

/** La couronne plate de `r0` à `r1` (le dessus d'un anneau), à la hauteur `y`, tournée vers le haut. */
function couronne(P: Pinceau, cx: number, cz: number, y: number, r0: number, r1: number, n: number, peindre: Peindre): void {
  for (let i = 0; i < n; i++) P.quad(surLAnneau(cx, cz, r0, y, i, n), surLAnneau(cx, cz, r0, y, i + 1, n), surLAnneau(cx, cz, r1, y, i + 1, n), surLAnneau(cx, cz, r1, y, i, n), [cx, y - 1, cz], peindre);
}

/** Le flanc d'un anneau de rayon `r`, de `y0` à `y1` ; `dehors` : tourné vers le dehors (sinon vers l'axe). */
function flanc(P: Pinceau, cx: number, cz: number, y0: number, y1: number, r: number, n: number, dehors: boolean, peindre: (i: number) => Peindre): void {
  for (let i = 0; i < n; i++) {
    const m = surLAnneau(cx, cz, dehors ? r - 0.1 : r + 0.1, (y0 + y1) / 2, i, n);
    const dedans: V3 = dehors ? [cx, (y0 + y1) / 2, cz] : [2 * m[0] - cx, m[1], 2 * m[2] - cz];
    P.quad(surLAnneau(cx, cz, r, y0, i, n), surLAnneau(cx, cz, r, y0, i + 1, n), surLAnneau(cx, cz, r, y1, i + 1, n), surLAnneau(cx, cz, r, y1, i, n), dedans, peindre(i));
  }
}

/** Le disque de l'eau, de rayon `r`, à la hauteur `y`, tourné vers le haut. */
function disque(P: Pinceau, cx: number, cz: number, y: number, r: number, n: number, peindre: Peindre): void {
  for (let i = 1; i + 1 < n; i++) P.triangle(surLAnneau(cx, cz, r, y, 0, n), surLAnneau(cx, cz, r, y, i, n), surLAnneau(cx, cz, r, y, i + 1, n), [cx, y - 1, cz], peindre);
}

/** Une boîte de (x0, y0, z0) à (x1, y1, z1), repère Three, sans les faces dont la normale est donnée (le dessus, le dessous). */
function boite(P: Pinceau, x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, peindre: Peindre, sans: { dessus?: boolean; dessous?: boolean; bouts?: boolean } = {}): void {
  const c: V3 = [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2];
  const p = (x: number, y: number, z: number): V3 => [x, y, z];
  if (!sans.dessus) P.quad(p(x0, y1, z0), p(x1, y1, z0), p(x1, y1, z1), p(x0, y1, z1), c, peindre);
  if (!sans.dessous) P.quad(p(x0, y0, z0), p(x1, y0, z0), p(x1, y0, z1), p(x0, y0, z1), c, peindre);
  P.quad(p(x0, y0, z0), p(x0, y1, z0), p(x0, y1, z1), p(x0, y0, z1), c, peindre);
  P.quad(p(x1, y0, z0), p(x1, y1, z0), p(x1, y1, z1), p(x1, y0, z1), c, peindre);
  if (!sans.bouts) {
    P.quad(p(x0, y0, z0), p(x1, y0, z0), p(x1, y1, z0), p(x0, y1, z0), c, peindre);
    P.quad(p(x0, y0, z1), p(x1, y0, z1), p(x1, y1, z1), p(x0, y1, z1), c, peindre);
  }
}

/**
 * Le toit à deux pans, son faîte le long de z (le y de la grille) : ses deux pans, leur dessous, leurs bords d'avant-toit
 * et leurs deux pignons (une bande en V renversé à chaque bout). `epais` faux (de loin) : les deux pans seuls.
 */
function toit(P: Pinceau, cx: number, cz: number, pied: number, peindre: Peindre, epais: boolean): void {
  const T = MESURES_DU_PUITS.toit;
  const [ya, yf, e] = [pied + T.avantToit, pied + T.faite, T.epaisseur];
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
  for (const z of bouts) {
    const dedans: V3 = [cx, ya, cz];
    for (const x of [cx - T.demi, cx + T.demi]) P.quad(haut(x, z), haut(cx, z), bas(cx, z), bas(x, z), dedans, peindre);
  }
}

/**
 * Dessine le puits (repère Three : x, hauteur, y de la grille) dans `P`. De près (`loin` faux), un peu plus de 300 triangles :
 * le lit de pose, le mur de brique en trois assises en damier, la margelle, la paroi intérieure, l'eau et son liseré, les
 * deux poteaux, la poutre, le treuil, le seau posé sur la margelle, le toit et sa faîtière. De loin, une cinquantaine : le mur et la margelle à six pans, l'eau, les
 * poteaux et les deux pans du toit.
 */
function dessinerLePuits(P: Pinceau, a: ArchipelagoId, o: PoseDuPuits, loin = false): void {
  const M = MESURES_DU_PUITS;
  const C = COULEURS_DU_PUITS;
  const { cx, cz, pied, muted } = o;
  const brique = couleurDeMatiere(a, 'brique');
  const delave = (c: Couleur) => (muted ? mixColor(c, DELAVE[0], DELAVE[1]) : c);
  const cote = aplat(delave(brique.cote));
  const dessus = aplat(delave(brique.dessus));
  const sombre = aplat(delave(mixColor(brique.cote, 0x000000, 1 - C.briqueSombre)));
  const v = (c: Couleur) => aplat(voilee(a, c, muted));
  const at = (h: number) => pied + h;
  const p = M.poteaux;
  if (loin) {
    const n = M.pansDeLoin;
    flanc(P, cx, cz, at(0), at(M.margelle.haut), M.margelle.rayon, n, true, () => cote);
    couronne(P, cx, cz, at(M.margelle.haut), M.margelle.interieur, M.margelle.rayon, n, dessus);
    disque(P, cx, cz, at(M.eau.lisere), M.margelle.interieur, n, v(C.eau));
    for (const s of [-1, 1]) boite(P, cx - p.cote / 2, at(M.margelle.haut), cz + s * p.ecart - p.cote / 2, cx + p.cote / 2, at(M.toit.avantToit), cz + s * p.ecart + p.cote / 2, v(C.bois), { dessus: true, dessous: true });
    toit(P, cx, cz, pied, v(C.ardoise), false);
    return;
  }
  const n = M.pans;
  // Le lit de pose et son ressaut.
  flanc(P, cx, cz, at(0), at(M.pied.haut), M.pied.rayon, n, true, () => cote);
  couronne(P, cx, cz, at(M.pied.haut), M.mur.rayon, M.pied.rayon, n, dessus);
  // Le mur : trois assises, les pans en damier de deux tons de brique (les gros blocs du concept).
  const assises = M.mur.assises;
  for (let k = 0; k + 1 < assises.length; k++) flanc(P, cx, cz, at(assises[k]), at(assises[k + 1]), M.mur.rayon, n, true, (i) => ((i + k) % 2 ? sombre : cote));
  // La margelle : son flanc, son dessus, sa paroi intérieure jusqu'à l'eau.
  flanc(P, cx, cz, at(M.margelle.bas), at(M.margelle.haut), M.margelle.rayon, n, true, () => cote);
  couronne(P, cx, cz, at(M.margelle.haut), M.margelle.interieur, M.margelle.rayon, n, dessus);
  flanc(P, cx, cz, at(M.eau.haut), at(M.margelle.haut), M.margelle.interieur, n, false, () => cote);
  // L'eau : le disque, et son liseré clair contre la paroi.
  const r = M.margelle.interieur;
  couronne(P, cx, cz, at(M.eau.haut), r * 0.8, r, n, v(C.lisere));
  disque(P, cx, cz, at(M.eau.haut), r * 0.8, n, v(C.eau));
  // Les deux poteaux, posés sur la margelle, jusque sous le toit ; la poutre d'un poteau à l'autre ; le treuil.
  for (const s of [-1, 1]) boite(P, cx - p.cote / 2, at(M.margelle.haut), cz + s * p.ecart - p.cote / 2, cx + p.cote / 2, at(p.haut), cz + s * p.ecart + p.cote / 2, v(C.bois), { dessus: true, dessous: true });
  const q = M.poutre;
  boite(P, cx - q.cote / 2, at(q.bas), cz - q.long, cx + q.cote / 2, at(q.bas + q.cote), cz + q.long, v(C.bois), { dessus: true });
  // Le treuil : un rouleau couché le long de z, entre les poteaux (ses bouts sont dans les poteaux).
  const t = M.treuil;
  const bouts = [cz - p.ecart + p.cote / 2, cz + p.ecart - p.cote / 2];
  for (let i = 0; i < 6; i++) {
    const ang = (k: number) => ((k + 0.5) / 6) * Math.PI * 2;
    const pt = (k: number, z: number): V3 => [cx + t.rayon * Math.cos(ang(k)), at(t.haut) + t.rayon * Math.sin(ang(k)), z];
    P.quad(pt(i, bouts[0]), pt(i + 1, bouts[0]), pt(i + 1, bouts[1]), pt(i, bouts[1]), [cx, at(t.haut), cz], v(C.treuil));
  }
  // Le seau, sur la margelle : un tronc de cône à huit pans, l'eau dedans.
  const sv = M.seau;
  const rs = (M.margelle.interieur + M.margelle.rayon) / 2;
  const [sx, sz] = [cx + rs * Math.cos(sv.angle), cz + rs * Math.sin(sv.angle)];
  tronconique(P, sx, sz, at(M.margelle.haut), at(M.margelle.haut + sv.haut), sv.rayons[0], sv.rayons[1], 8, Math.PI / 8, v(C.treuil), false);
  disque(P, sx, sz, at(M.margelle.haut + sv.haut - 0.04), sv.rayons[1] * 0.92, 8, v(C.eau));
  toit(P, cx, cz, pied, v(C.ardoise), true);
  // La faîtière : deux bandes de bois de part et d'autre du faîte, un peu au-dessus des pans.
  const T = M.toit;
  const f = M.faitiere;
  const yf = at(T.faite) + f.haut;
  const pente = (T.faite - T.avantToit) / T.demi;
  for (const s of [-1, 1]) {
    const yb = at(T.faite) - pente * f.demi + f.haut;
    P.quad([cx, yf, cz - T.long], [cx, yf, cz + T.long], [cx + s * f.demi, yb, cz + T.long], [cx + s * f.demi, yb, cz - T.long], [cx, yf - 1, cz], v(C.bois));
  }
}

/** Les petites constructions qu'Archipéo dessine en modèle propre, par identifiant (le puits de Tunel, au 6e). */
const MODELES: Record<string, { ile: BiomeId; dessiner: typeof dessinerLePuits }> = {
  'french-6e-letter-confusion-fixture-1': { ile: 'french-6e-letter-confusion', dessiner: dessinerLePuits },
};

/** Les cases de chaque petite construction dessinée dans le monde (son eau comprise), calculées une fois. */
const casesDansLeMonde = new Map<string, Set<string>>();
const casesDe = (id: string): Set<string> => {
  let s = casesDansLeMonde.get(id);
  if (!s) casesDansLeMonde.set(id, (s = casesDeLaPetiteConstructionDansLeMonde(MODELES[id].ile, id)));
  return s;
};

/** Le nombre de triangles d'un modèle dessiné, de près ou de loin (le budget : world/budget.ts). */
export function trianglesDuModele(id: string, loin: boolean): number {
  const P = new Pinceau();
  MODELES[id].dessiner(P, '6e', { cx: 0, cz: 0, pied: 0, muted: false }, loin);
  return P.triangles;
}

/**
 * Ce que coûte de plus, au pire, une petite construction dessinée d'un archipel vue de près plutôt que de loin (une seule
 * île est de près à la fois) : le budget compte le monde de loin (`pres` nul), puis ajoute cet écart (world/budget.ts).
 */
export function ecartDePres(a: ArchipelagoId): number {
  const ecarts = Object.entries(MODELES)
    .filter(([, m]) => BIOMES.find((b) => b.id === m.ile)?.classe === a)
    .map(([id]) => trianglesDuModele(id, false) - trianglesDuModele(id, true));
  return Math.max(0, ...ecarts);
}

/**
 * Les petites constructions dessinées de ce monde, posées (toutes leurs cases, sans fantôme) : chacune comme un modèle
 * importé (./monumentModels.ts) qui remplace ses cases (le toucher les retrouve), de près sur l'île `pres`, de loin
 * ailleurs. Le rendu Archipéo seulement (./construction.ts).
 */
export function petitesConstructionsDessinees(a: ArchipelagoId, cubes: readonly VoxelCube[], pres: BiomeId | null = null): ImportedMonument[] {
  let poses: Map<string, VoxelCube> | null = null;
  const out: ImportedMonument[] = [];
  for (const [id, m] of Object.entries(MODELES)) {
    if (!poses) {
      poses = new Map();
      for (const c of cubes) if (c.petiteConstruction && !c.ghost) poses.set(`${c.x},${c.y},${c.z}`, c);
      if (!poses.size) return out;
    }
    const cases = casesDe(id);
    const siens = [...cases].map((k) => poses!.get(k));
    if (!cases.size || siens.some((c) => !c || c.tag !== m.ile)) continue;
    const posees = siens as VoxelCube[];
    const xs = posees.map((c) => c.x);
    const ys = posees.map((c) => c.y);
    const pose: PoseDuPuits = {
      cx: (Math.min(...xs) + Math.max(...xs) + 1) / 2,
      cz: (Math.min(...ys) + Math.max(...ys) + 1) / 2,
      pied: Math.min(...posees.map((c) => c.z)),
      muted: posees.some((c) => c.muted),
    };
    const P = new Pinceau();
    m.dessiner(P, a, pose, pres !== m.ile);
    const vide: FacettesDuDecor = new Pinceau().fin();
    const cellules: Cell[] = posees.map((c) => ({ x: c.x, y: c.y, z: c.z }));
    out.push({ id, stage: 1, opaque: P.fin(), fire: vide, halo: null, cellules, replaced: new Set(cases) });
  }
  return out;
}
