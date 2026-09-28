// Les formes du décor communes aux quatre archipels (lot R4) : la végétation, les rochers, les cristaux, les cascades et
// l'habillage de la mer. Chaque archipel les peint de sa palette ; ses formes propres sont dans son fichier (./6e.ts…).
import type { VoxelCube } from '../../Voxel';
import { mixColor } from '../daylight';
import type { ElementDeDecor } from '../decorMesh';
import { colonneEn, hauteurDuSol, NIVEAU_EAU, type ChampDuSol } from '../landMesh';
import { couleurDeMatiere, MATIERES, type Couleur, type Faces } from '../palette';
import type { TextureKind } from '../pixels';
import type { Forme } from './outils';
import { clamp, DELAVE, eclaircir, feuillage, icosaedre, octaedre, peintre, TAILLES, tronconique, type Pinceau, type V3 } from './pinceau';

/** Combien s'enfonce le pied d'un élément sous le sol (il ne flotte jamais au-dessus d'une facette). */
export const ENFONCE = 0.15;

/** Les sols où un rocher garde sa pierre (sur la roche, il en prend la couleur). */
const SOLS_TENDRES: ReadonlySet<string> = new Set(['herbe', 'mousse', 'sable', 'neige', 'glace', 'eau', 'lave', 'terre']);

const arbre: Forme = ({ P, e, cx, cz, base, hasard, rot, vari, du, vertDe }) => {
  const tronc = e.cubes.filter((c) => c.texture === 'tronc');
  const tall = Math.max(1, tronc.length);
  const fT = du(tronc[0] ?? e.cubes[0]);
  // Un tronc court, un feuillage rond et large (la couronne de 3 × 3 cubes), un second plus petit sur les grands ;
  // trois tailles, deux familles de verts, chaque boule plus claire en haut.
  const vert = vertDe(hasard, e.muted);
  const s = TAILLES[Math.min(2, Math.floor(hasard() * 3))] * (0.95 + 0.1 * hasard());
  const yF = base + 0.55 * tall + 1.05 * s;
  tronconique(P, cx, cz, base - ENFONCE, yF - 0.4, 0.19 * s, 0.12 * s, 5, rot, peintre(fT, base, tall, vari()), false);
  const R = 1.22 * s;
  icosaedre(P, [cx, yF, cz], R, 0.86, 0.14, hasard, feuillage(vert, yF - 0.75 * R * 0.86, 1.5 * R * 0.86), rot);
  if (tall >= 3) {
    const a = rot + hasard() * Math.PI * 2;
    const r = 0.75 * s;
    const y = yF + 0.75 * s;
    icosaedre(P, [cx + 0.55 * Math.cos(a), y, cz + 0.55 * Math.sin(a)], r, 0.9, 0.14, hasard, feuillage(vert, y - 0.75 * r * 0.9, 1.5 * r * 0.9), rot);
  }
};

const sapin: Forme = ({ P, e, cx, cz, base, hasard, rot, vari, du, premier }) => {
  const tronc = e.cubes.filter((c) => c.texture === 'tronc');
  const tall = Math.max(1, tronc.length);
  const fT = du(tronc[0] ?? e.cubes[0]);
  const fS = du(premier((c) => c.texture !== 'tronc') ?? e.cubes[0]);
  const s = 0.9 + 0.2 * hasard();
  tronconique(P, cx, cz, base - ENFONCE, base + tall + 0.4, 0.14 * s, 0.1 * s, 5, rot, peintre(fT, base, tall, vari()), false);
  const y0 = base + tall + 0.2;
  const pS = peintre(fS, y0, 3, vari());
  const etages = tall >= 2 ? 3 : 2;
  for (let k = 0; k < etages; k++) {
    const r = (1.25 - (k * 0.95) / etages) * s;
    tronconique(P, cx, cz, y0 + k * 0.8 * s, y0 + k * 0.8 * s + 1.35 * s, r, 0, 6, rot + k * 0.5, pS);
  }
};

const buisson: Forme = ({ P, e, hasard, rot, vari, du, sol }) => {
  const f = du(e.cubes[0]);
  for (const c of e.cubes) {
    const b = sol(c.x + 0.5, c.y + 0.5, c.z);
    const r = (0.46 + 0.1 * hasard()) * (c === e.cubes[0] ? 1 : 0.85);
    icosaedre(P, [c.x + 0.5, b + r * 0.45, c.y + 0.5], r, 0.72, 0.12, hasard, peintre(f, b, r * 1.2, vari()), rot);
  }
};

const fleur: Forme = ({ P, e, cx, cz, base, rot, vari, du, matiere }) => {
  const f = du(e.cubes[0]);
  const herbe = matiere('feuilles', e.muted);
  tronconique(P, cx, cz, base - 0.05, base + 0.28, 0.2, 0, 4, rot, peintre(herbe, base, 0.3, vari()));
  for (let k = 0; k < 3; k++) {
    const a = rot + (k * Math.PI * 2) / 3;
    octaedre(P, [cx + 0.22 * Math.cos(a), base + 0.26 + 0.06 * k, cz + 0.22 * Math.sin(a)], 0.15, 0.8, peintre(f, base, 0.4, vari()), true, a);
  }
};

const champignon: Forme = ({ P, e, cx, cz, base, rot, vari, du, matiere }) => {
  const f = du(e.cubes[0]);
  const pied = matiere('sable', e.muted);
  tronconique(P, cx, cz, base - 0.05, base + 0.34, 0.1, 0.09, 5, rot, peintre(pied, base, 0.3));
  tronconique(P, cx, cz, base + 0.3, base + 0.54, 0.38, 0.16, 6, rot, peintre(f, base + 0.25, 0.3, vari()));
};

const rocher: Forme = ({ P, e, a, champ, cx, cz, base, hasard, rot, vari, du, hautDe }) => {
  // Sur la roche, un rocher prend la roche de l'île (de 0,9 à 1,1 fois sa valeur) ; ailleurs, sa pierre.
  const col = colonneEn(champ, e.x, e.y);
  const sous = col?.matieres[col.matieres.length - 1];
  const surRoche = sous !== undefined && sous in MATIERES && !SOLS_TENDRES.has(sous);
  const r0 = surRoche ? couleurDeMatiere(a, sous as TextureKind) : du(e.cubes[0]);
  const k = 0.9 + 0.2 * hasard();
  const teinte = (c: Couleur) => mixColor(c, e.muted ? DELAVE[0] : c, e.muted ? DELAVE[1] : 0);
  const f: Faces = surRoche ? { dessus: teinte(eclaircir(r0.dessus, k)), cote: teinte(r0.cote) } : r0;
  const haut = hautDe(() => true) - e.z;
  const r = haut >= 2 ? 0.66 : 0.5 + 0.08 * hasard();
  const sy = haut >= 2 ? 1.05 : 0.68;
  icosaedre(P, [cx, base + r * sy * 0.45, cz], r, sy, 0.18, hasard, peintre(f, base - 0.2, r * sy * 1.6, vari()), rot);
};

const souche: Forme = ({ P, e, cx, cz, base, rot, vari, du }) => {
  const f = du(e.cubes[0]);
  tronconique(P, cx, cz, base - ENFONCE, base + 0.45, 0.33, 0.27, 6, rot, peintre(f, base, 0.5, vari()));
};

const roseau: Forme = ({ P, e, cx, cz, base, rot, vari, du, sol, hautDe }) => {
  const f = du(e.cubes[0]);
  const h = hautDe(() => true) - e.z;
  for (let k = 0; k < 3; k++) {
    const a = rot + (k * Math.PI * 2) / 3;
    const x = cx + 0.18 * Math.cos(a);
    const z = cz + 0.18 * Math.sin(a);
    tronconique(P, x, z, sol(x, z, base) - 0.05, base + h * (0.7 + 0.12 * k), 0.06, 0, 3, a, peintre(f, base, h, vari()));
  }
};

const cristal: Forme = ({ P, e, cx, cz, base, rot, vari, du, hautDe }) => {
  const f = du(e.cubes[0]);
  const h = hautDe(() => true) - e.z;
  octaedre(P, [cx, base + 0.35 * h, cz], 0.22, 1.9 * h, peintre(f, base, h, vari()), false, rot);
  octaedre(P, [cx + 0.22 * Math.cos(rot), base + 0.25, cz + 0.22 * Math.sin(rot)], 0.14, 1.9, peintre(f, base, h, vari()), false, rot + 0.7);
};

const ecueil: Forme = ({ P, e, hasard, rot, vari, du }) => {
  // Un rocher qui affleure, un par case (aux Anciens Ateliers, une aiguille d'ardoise sur une pierre) : de sous
  // l'eau jusqu'au haut de ses cubes. Peu de facettes : ils sont nombreux, et loin.
  const cases = new Map<string, VoxelCube[]>();
  for (const c of e.cubes) cases.set(`${c.x},${c.y}`, [...(cases.get(`${c.x},${c.y}`) ?? []), c]);
  for (const list of cases.values()) {
    const { x, y } = list[0];
    const haut = Math.max(...list.map((q) => q.z + 1));
    const ardoise = list.filter((q) => q.texture === 'ardoise' && q.z >= 0);
    const dessous = list.reduce((p, q) => (q.z < p.z ? q : p));
    const r = 0.5 + 0.1 * hasard();
    const a0 = rot + hasard();
    if (ardoise.length) {
      tronconique(P, x + 0.5, y + 0.5, NIVEAU_EAU - 0.3, haut - 0.05, 0.42, 0, 5, a0, peintre(du(ardoise[0]), NIVEAU_EAU, haut - NIVEAU_EAU, vari()));
      continue;
    }
    // Les cases voisines d'un écueil : un caillou bas, à quatre facettes.
    if (x !== e.x || y !== e.y) {
      octaedre(P, [x + 0.5, NIVEAU_EAU - 0.05, y + 0.5], r, clamp((haut - 0.3 - NIVEAU_EAU) / r, 0.5, 1.2), peintre(du(dessous), NIVEAU_EAU - 0.2, 0.7, vari()), true, a0);
      continue;
    }
    // Le rocher : un tronc de cône à cinq pans, au sommet plat et penché.
    const top = haut - 0.25;
    const f = du(list.reduce((p, q) => (q.z > p.z ? q : p)));
    tronconique(P, x + 0.5, y + 0.5, NIVEAU_EAU - 0.25, top, r, r * 0.45, 5, a0, peintre(f, NIVEAU_EAU - 0.2, top - NIVEAU_EAU + 0.2, vari()));
  }
};

const banc: Forme = ({ P, e, hasard, rot, vari, du }) => {
  // Un banc de sable (de glace, de galets) au ras de l'eau : un cône très plat, dont le bord plonge sous l'eau.
  const f = du(e.cubes[0]);
  const mx = e.cubes.reduce((t, c) => t + c.x + 0.5, 0) / e.cubes.length;
  const mz = e.cubes.reduce((t, c) => t + c.y + 0.5, 0) / e.cubes.length;
  const R = 0.45 + 0.42 * Math.sqrt(e.cubes.length);
  const n = 5;
  const bord: V3[] = [];
  for (let k = 0; k < n; k++) {
    const a = rot + (k / n) * Math.PI * 2;
    const r = R * (0.78 + 0.34 * hasard());
    bord.push([mx + r * Math.cos(a), NIVEAU_EAU - 0.2, mz + r * 0.85 * Math.sin(a)]);
  }
  const sommet: V3 = [mx, NIVEAU_EAU + 0.12, mz];
  const p = peintre(f, NIVEAU_EAU - 0.1, 0.2, vari());
  for (let k = 0; k < n; k++) P.triangle(bord[k], bord[(k + 1) % n], sommet, [mx, NIVEAU_EAU - 1, mz], p);
};

const cascade: Forme = ({ P, e, champ, du }) => {
  laCascade(P, champ, e, du(e.cubes.find((c) => c.texture === 'eau') ?? e.cubes[0]), du(e.cubes.find((c) => c.texture !== 'eau') ?? e.cubes[0]));
};

/** La cascade d'une île en altitude : un filet sur la case du bord, puis la chute le long de sa falaise, et l'écume. */
function laCascade(P: Pinceau, champ: ChampDuSol, e: ElementDeDecor, eau: Faces, ecume: Faces): void {
  // La chute est dans la case voisine du bord : c'est de ce côté que tombe l'eau.
  const chute = e.cubes.filter((c) => c.x !== e.x || c.y !== e.y);
  const dehors = chute.find((c) => Math.abs(c.x - e.x) + Math.abs(c.y - e.y) === 1) ?? chute[0];
  if (!dehors) return;
  const dx = dehors.x - e.x;
  const dy = dehors.y - e.y;
  const col = colonneEn(champ, e.x, e.y);
  // Jusqu'à la mer, ou jusqu'au bas de la chute dans le ciel (les Îles du Ciel n'ont pas d'eau).
  const bas = Number.isFinite(champ.plancher) ? NIVEAU_EAU : Math.min(...chute.filter((c) => c.x === dehors.x && c.y === dehors.y).map((c) => c.z));
  // Le bord de la case, du côté de la chute, et la hauteur du sol à mi-bord.
  const bx = e.x + 0.5 + dx * 0.5;
  const bz = e.y + 0.5 + dy * 0.5;
  const haut = (col ? hauteurDuSol(champ, bx - dx * 0.01, bz - dy * 0.01) : null) ?? e.z;
  const [tx, tz] = [-dy, dx];
  const W = 0.32;
  const peau = 0.07;
  // Le filet sur la case : du milieu de la case au bord, sur la pente, un rien au-dessus.
  const filet = (s: number, w: number): V3 => {
    const x = e.x + 0.5 + dx * 0.5 * s + tx * w;
    const z = e.y + 0.5 + dy * 0.5 * s + tz * w;
    return [x, (hauteurDuSol(champ, x, z) ?? haut) + 0.04, z];
  };
  const pEau = (y0: number, h: number) => peintre(eau, y0, h);
  const pFilet = pEau(haut - 1, 1.2);
  for (const [s0, s1] of [
    [-0.2, 0.4],
    [0.4, 1],
  ])
    P.quad(filet(s0, -W * 0.8), filet(s1, -W), filet(s1, W), filet(s0, W * 0.8), [e.x + 0.5, haut - 1, e.y + 0.5], pFilet);
  // La chute : une lame d'eau plaquée contre la falaise, de l'épaisseur `peau`, rayée de clair.
  const x0 = bx + dx * 0.02;
  const z0 = bz + dy * 0.02;
  const x1 = bx + dx * (0.02 + peau);
  const z1 = bz + dy * (0.02 + peau);
  const pas = Math.max(1, Math.round((haut - bas) / 1.2));
  const claire: Faces = { dessus: mixColor(eau.dessus, 0xffffff, 0.35), cote: mixColor(eau.cote, 0xffffff, 0.3) };
  for (let k = 0; k < pas; k++) {
    const yA = haut + 0.04 - ((haut - bas) * k) / pas;
    const yB = haut + 0.04 - ((haut - bas) * (k + 1)) / pas;
    const p = k % 2 ? pEau(bas, haut - bas) : peintre(claire, bas, haut - bas);
    const w0 = W * (1 + 0.12 * (k / pas));
    const w1 = W * (1 + 0.12 * ((k + 1) / pas));
    const dedans: V3 = [(x0 + x1) / 2, (yA + yB) / 2, (z0 + z1) / 2];
    // Face au large, et les deux tranches (la lame se voit de biais).
    P.quad([x1 - tx * w0, yA, z1 - tz * w0], [x1 + tx * w0, yA, z1 + tz * w0], [x1 + tx * w1, yB, z1 + tz * w1], [x1 - tx * w1, yB, z1 - tz * w1], dedans, p);
    for (const sgn of [-1, 1]) P.quad([x0 + sgn * tx * w0, yA, z0 + sgn * tz * w0], [x1 + sgn * tx * w0, yA, z1 + sgn * tz * w0], [x1 + sgn * tx * w1, yB, z1 + sgn * tz * w1], [x0 + sgn * tx * w1, yB, z0 + sgn * tz * w1], dedans, p);
  }
  // L'écume au pied : une tache claire, à plat.
  const fx = bx + dx * 0.6;
  const fz = bz + dy * 0.6;
  const y = Math.max(bas, NIVEAU_EAU) + 0.06;
  const pEcume = peintre(ecume, y - 1, 1);
  const n = 6;
  const pts: V3[] = [];
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2;
    pts.push([fx + 0.6 * Math.cos(a), y, fz + 0.6 * Math.sin(a)]);
  }
  for (let k = 1; k + 1 < n; k++) P.triangle(pts[0], pts[k], pts[k + 1], [fx, y - 1, fz], pEcume);
}

/** Les formes communes, par genre. */
export const FORMES_COMMUNES: Record<string, Forme> = { arbre, sapin, buisson, fleur, champignon, rocher, souche, roseau, cristal, ecueil, banc, cascade };
