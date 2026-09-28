// Les ponts de pierre et de bois des Îles Brumeuses (lot R5, Archipéo seulement) : un tablier droit et rigide de
// planches, un garde-corps de bois sombre, des culées de pierre (fiche d'intention du 5e, « Pour R5 »).
//
// Le jeu ne change pas : le tracé, les cases et le toucher restent ceux de l'ouvrage (`bridge` dans terrain.ts). Seul
// le dessin change, dans la construction taillée (./construction.ts) : un pont construit remplace ses cubes de planches
// par ce modèle ; un pont à restaurer garde ses cases en fantômes (les planches absentes, qu'on ne prend pas pour un
// passage) et montre déjà ses deux culées de pierre, ce qui reste de l'ancien pont.
import type { VoxelCube } from '../Voxel';
import { mixColor } from './daylight';
import { boite, DELAVE, peintre, type Peindre, type Pinceau, type V3 } from './decor/pinceau';
import type { Couleur, Faces } from './palette';

/**
 * Les ponts à construire du 5e dessinés en pierre et en bois (décidé par le mainteneur le 28 septembre 2026), et celui
 * du Relais des voyageurs (LV2), venu après : tous les ponts du 5e.
 */
export const PONTS_DE_PIERRE_ET_DE_BOIS: ReadonlySet<string> = new Set(['marche-marais', 'marche-comptoir', 'marais-manoir', 'comptoir-manoir', 'comptoir-relais']);

/** Les couleurs du pont (fiche d'intention du 5e). */
export const COULEURS_DU_PONT = {
  planche: 0x9c7c4b,
  gardeCorps: 0x6e5234,
  pierre: 0x7d8a86,
} as const;

/** Les mesures du pont, en part de case. */
export const PONT = {
  /** Le dessus du tablier (le haut du cube de planches : le bonhomme y marche) et son épaisseur. */
  dessus: 1,
  planche: 0.18,
  /** Deux planches par case, séparées d'un jour. */
  planches: 2,
  jour: 0.05,
  /** Les longerons sous le tablier, de chaque côté. */
  longeron: { largeur: 0.14, hauteur: 0.22 },
  /** Le garde-corps : un poteau par côté une case sur deux, une lisse continue sur chaque travée. */
  poteau: 0.1,
  lisse: { largeur: 0.08, hauteur: 0.08, haut: 0.55 },
  /** Les culées : plus larges que le tablier, jusque sous l'eau (la mer est à −0,45, houle comprise : three/large.ts). */
  culee: { debord: 0.12, pied: -1 },
  /** Une pile de pierre au milieu des ponts d'au moins autant de cases. */
  pile: { des: 5, largeur: 0.5 },
} as const;

type CaseDuPont = { x: number; y: number; z: number };

/** Un pont de pierre et de bois tel que le monde le montre : ses cases (dans l'ordre du tracé), construit ou non. */
export interface PoseDuPont {
  id: string;
  cases: CaseDuPont[];
  construit: boolean;
  muted: boolean;
}

const cle = (x: number, y: number, z: number) => `${x},${y},${z}`;

/**
 * Les ponts de pierre et de bois de ce monde, lus sur les cubes de leurs ouvrages (les planches du tracé, pas les
 * lanternes du bout), et les cases qu'un pont construit remplace. Un pont à moitié posé n'existe pas : un ouvrage se
 * construit d'un coup, ses cubes sont tous fantômes ou tous posés.
 */
export function pontsDePierreEtDeBois(cubes: VoxelCube[]): { ponts: PoseDuPont[]; remplacees: Set<string>; fantomes: Map<string, boolean> } {
  const parPont = new Map<string, VoxelCube[]>();
  for (const c of cubes) {
    if (!c.bridge || !PONTS_DE_PIERRE_ET_DE_BOIS.has(c.bridge)) continue;
    if (c.texture !== 'planches' && c.texture !== 'escalier') continue;
    const l = parPont.get(c.bridge);
    if (l) l.push(c);
    else parPont.set(c.bridge, [c]);
  }
  const ponts: PoseDuPont[] = [];
  const remplacees = new Set<string>();
  const fantomes = new Map<string, boolean>();
  for (const [id, l] of parPont) {
    const construit = l.every((c) => !c.ghost);
    const cases = dansLOrdre(l);
    ponts.push({ id, cases, construit, muted: l.some((c) => c.muted) });
    if (construit) for (const c of l) remplacees.add(cle(c.x, c.y, c.z));
    else cases.forEach((c, i) => fantomes.set(cle(c.x, c.y, c.z), leLongDeX(cases, i)));
  }
  return { ponts, remplacees, fantomes };
}

/** Le sens du tracé en une case : le long de x (sinon de y), d'après ses voisines. */
export function leLongDeX(cases: readonly CaseDuPont[], i: number): boolean {
  const a = cases[Math.max(0, i - 1)];
  const b = cases[Math.min(cases.length - 1, i + 1)];
  return Math.abs(b.x - a.x) >= Math.abs(b.y - a.y);
}

/**
 * Le fantôme d'une case de pont à restaurer (directeur artistique) : plus court que sa case le long du tracé, un jour
 * entre deux, et moitié moins haut, pour que la rangée se lise comme des blocs à poser, jamais comme un passage.
 */
export const FANTOME_DU_PONT = { long: 0.8, haut: 0.5 } as const;

/** Les cases d'un pont, d'un bout à l'autre (le tracé est une ligne, avec au plus un coude ; les marches ne comptent pas). */
function dansLOrdre(l: VoxelCube[]): CaseDuPont[] {
  const parCase = new Map(l.map((c) => [`${c.x},${c.y}`, c]));
  const voisins = (c: CaseDuPont) =>
    [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]
      .map(([dx, dy]) => parCase.get(`${c.x + dx},${c.y + dy}`))
      .filter((v): v is VoxelCube => v !== undefined);
  const depart = l.find((c) => voisins(c).length <= 1) ?? l[0];
  const out: CaseDuPont[] = [];
  const vu = new Set<string>();
  let cur: VoxelCube | undefined = depart;
  while (cur && !vu.has(`${cur.x},${cur.y}`)) {
    vu.add(`${cur.x},${cur.y}`);
    out.push({ x: cur.x, y: cur.y, z: cur.z });
    cur = voisins(cur).find((v) => !vu.has(`${v.x},${v.y}`));
  }
  return out;
}

const delave = (c: Couleur, muted: boolean): Faces => {
  const d = muted ? mixColor(c, DELAVE[0], DELAVE[1]) : c;
  return { dessus: d, cote: d };
};

/**
 * Dessine un pont (repère Three : x, hauteur, y de la grille). Construit : culées, pile, longerons, planches et
 * garde-corps. À restaurer : les culées seulement (les cases du tablier restent des fantômes, dessinés avec les autres).
 */
export function dessinerPont(P: Pinceau, pont: PoseDuPont): void {
  const { cases, construit, muted } = pont;
  const n = cases.length;
  if (!n) return;
  const bas = Math.min(...cases.map((c) => c.z));
  const haut = Math.max(...cases.map((c) => c.z)) + PONT.dessus;
  const peint = (c: Couleur, v = 1): Peindre => peintre(delave(c, muted), bas, haut - bas, v);
  const pierre = peint(COULEURS_DU_PONT.pierre);
  const sombre = peint(COULEURS_DU_PONT.gardeCorps);
  /** Deux teintes de planche, en alternance. */
  const bois = [peint(COULEURS_DU_PONT.planche), peint(COULEURS_DU_PONT.planche, 0.93)];
  const lelongDeX = (i: number) => leLongDeX(cases, i);
  /** Une boîte dans le repère de la case : `u` le long du tracé, `v` en travers (0 à 1), `h` en hauteur. */
  const dansLaCase = (c: CaseDuPont, i: number, u0: number, u1: number, v0: number, v1: number, h0: number, h1: number, p: Peindre) => {
    if (lelongDeX(i)) boite(P, c.x + u0, h0, c.y + v0, c.x + u1, h1, c.y + v1, p);
    else boite(P, c.x + v0, h0, c.y + u0, c.x + v1, h1, c.y + u1, p);
  };
  const dessus = (c: CaseDuPont) => c.z + PONT.dessus;
  const { debord } = PONT.culee;

  // Les culées : sous les deux cases du bout, de la mer au-dessous du tablier.
  for (const i of n > 1 ? [0, n - 1] : [0]) {
    const c = cases[i];
    dansLaCase(c, i, 0, 1, -debord, 1 + debord, PONT.culee.pied, dessus(c) - PONT.planche, pierre);
  }
  if (!construit) return;

  // Une pile au milieu d'un long pont.
  if (n >= PONT.pile.des) {
    const i = Math.floor(n / 2);
    const c = cases[i];
    const w = PONT.pile.largeur;
    dansLaCase(c, i, 0.5 - w / 2, 0.5 + w / 2, -debord / 2, 1 + debord / 2, PONT.culee.pied, dessus(c) - PONT.planche - PONT.longeron.hauteur, pierre);
  }

  // Les travées droites (même sens, même hauteur) : les longerons et les lisses d'un seul tenant, pour le budget.
  const travees: { i0: number; i1: number }[] = [];
  cases.forEach((c, i) => {
    const t = travees[travees.length - 1];
    const prev = cases[i - 1];
    if (t && prev && prev.z === c.z && lelongDeX(i) === lelongDeX(t.i0) && lelongDeX(i) === (Math.abs(c.x - prev.x) > 0)) t.i1 = i;
    else travees.push({ i0: i, i1: i });
  });
  /** Une boîte sur une travée : `u` court sur toute la travée, `v` en travers (0 à 1). */
  const surLaTravee = (t: { i0: number; i1: number }, v0: number, v1: number, h0: number, h1: number, p: Peindre) => {
    const a = cases[t.i0];
    const b = cases[t.i1];
    if (lelongDeX(t.i0)) boite(P, Math.min(a.x, b.x), h0, a.y + v0, Math.max(a.x, b.x) + 1, h1, a.y + v1, p);
    else boite(P, a.x + v0, h0, Math.min(a.y, b.y), a.x + v1, h1, Math.max(a.y, b.y) + 1, p);
  };
  const { largeur: lw, hauteur: lh } = PONT.longeron;
  const p = PONT.poteau;
  const { largeur: sw, hauteur: sh, haut: lisse } = PONT.lisse;
  for (const t of travees) {
    const top = dessus(cases[t.i0]);
    const sous = top - PONT.planche;
    for (const [v0, v1] of [
      [0, lw],
      [1 - lw, 1],
    ])
      surLaTravee(t, v0, v1, sous - lh, sous, sombre);
    for (const m of [p / 2, 1 - p / 2]) surLaTravee(t, m - sw / 2, m + sw / 2, top + lisse - sh, top + lisse, sombre);
  }

  cases.forEach((c, i) => {
    const top = dessus(c);
    const sous = top - PONT.planche;
    // Les planches, en travers du tracé, un jour entre elles ; deux teintes de bois. Le dessus et les deux bouts
    // seulement : le jour est trop étroit pour qu'on voie leurs flancs.
    const k = PONT.planches;
    const pas = 1 / k;
    for (let j = 0; j < k; j++) {
      const u0 = j * pas + PONT.jour / 2;
      const u1 = (j + 1) * pas - PONT.jour / 2;
      planche(c, i, u0, u1, sous, top, (i + j) % 2 ? bois[1] : bois[0]);
    }
    // Un poteau de chaque côté, une case sur deux et aux deux bouts.
    if (i % 2 === 0 || i === n - 1)
      for (const [v0, v1] of [
        [0, p],
        [1 - p, 1],
      ])
        dansLaCase(c, i, 0.5 - p / 2, 0.5 + p / 2, v0, v1, top, top + lisse - sh, sombre);
  });

  /** Une planche : son dessus et ses deux bouts, dans le repère de la case. */
  function planche(c: CaseDuPont, i: number, u0: number, u1: number, h0: number, h1: number, peindre: Peindre): void {
    const x = lelongDeX(i);
    const pt = (u: number, v: number, h: number): V3 => (x ? [c.x + u, h, c.y + v] : [c.x + v, h, c.y + u]);
    const dedans = pt((u0 + u1) / 2, 0.5, (h0 + h1) / 2);
    P.quad(pt(u0, 0, h1), pt(u1, 0, h1), pt(u1, 1, h1), pt(u0, 1, h1), dedans, peindre);
    P.quad(pt(u0, 0, h0), pt(u1, 0, h0), pt(u1, 0, h1), pt(u0, 0, h1), dedans, peindre);
    P.quad(pt(u0, 1, h0), pt(u1, 1, h0), pt(u1, 1, h1), pt(u0, 1, h1), dedans, peindre);
  }
}
