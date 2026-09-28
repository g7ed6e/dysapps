// Le lointain d'Archipéo (sous-lot R4b-5e, docs/conception/cadrage-archipeo.md §6 ; intention du directeur artistique
// dans design/archipeo/intentions/commun.md) : des formes loin derrière l'archipel, dans la mer, que la brume de
// profondeur pâlit. Un module commun : chaque archipel en décrit les pièces dans son fichier (./5e.ts…) et les range
// dans `LOINTAINS` (./formes.ts) ; ce module les dessine. Code pur, sans Three.js.
//
// - Trois pièces : un rang de crêtes, une masse en gradins (qui peut porter une tour), un cône. Chacune est posée par
//   rapport à l'étendue de l'archipel : `u` le long de sa largeur (0 à l'ouest, 1 à l'est), `recul` en cases au-delà
//   de son bord nord, là où regarde la caméra.
// - Tout est hors de la grille : rien n'y marche, rien ne s'y touche (les triangles n'ont pas d'élément, `SANS_ELEMENT`),
//   et la vue 3D les cache sur la Carte. La 2D ne le montre pas.
// - Tout va dans le pinceau du décor, après ses éléments : aucun appel de dessin de plus.
import { SOLEIL_DIRECTION, type Couleur } from '../palette';
import { lineaire, NIVEAU_EAU } from '../landMesh';
import { clamp, hasardDe, rgb, type Peindre, type Pinceau, type RGB, type V3 } from './pinceau';

/** L'élément des triangles du lointain : aucun (le toucher ne les retrouve pas). */
export const SANS_ELEMENT = -1;

/** Les bornes du lointain (commun.md) : de 60 à 150 cases derrière l'archipel, de 10 à 30 blocs de haut (10 : décision du directeur artistique au 5e, pour que la tour de la masse centrale se lise sous le bandeau). */
export const BORNES_DU_LOINTAIN = { recul: [60, 150], haut: [10, 30] } as const;

/** Où se pose une pièce : `u` le long de la largeur de l'archipel, `recul` en cases au-delà de son bord nord. */
interface Place {
  u: number;
  recul: number;
}

/** Un rang de crêtes : une ligne de cimes de `de` à `a` (le long de la largeur), des pics de `haut` blocs au plus. */
export interface RangDeCretes extends Place {
  genre: 'cretes';
  /** Là où le rang finit (`u` est son début). */
  a: number;
  haut: number;
  /** Le nombre de cimes. */
  cimes: number;
  /** Sa profondeur (cases), du pied avant au pied arrière. */
  epaisseur: number;
  couleur: Couleur;
  /** Les cimes pâles : cette couleur au-dessus de `neige` (une part de la hauteur de chaque cime). */
  sommet?: Couleur;
  neige?: number;
  /**
   * La limite de la neige franche (le massif du 3e) : les versants sont coupés à la hauteur `neige`, roche dessous, neige
   * dessus, sans dégradé entre les deux. Sans elle, la couleur passe de l'une à l'autre le long du versant.
   */
  neigeFranche?: boolean;
  /** L'ombre de la roche : les versants tournés à l'opposé du soleil tirent vers cette couleur. */
  ombre?: Couleur;
}

/** Une masse en gradins : des marches de `marche` blocs, en retrait de `retrait` cases, un sommet plat. */
export interface MasseEnGradins extends Place {
  genre: 'gradins';
  haut: number;
  /** Le rayon de sa base (cases). */
  rayon: number;
  marche: number;
  retrait: number;
  /** Le nombre de pans (6 à 8) ; chaque pan a son rayon, un peu irrégulier. */
  pans: number;
  couleur: Couleur;
  /** Le dessus du sommet (moussu, enneigé…). */
  sommet: Couleur;
  /** L'étirement le long de l'horizon (1 par défaut) : au-dessus de 1, une masse plus large que profonde. */
  allonge?: number;
  /** Une tour carrée sur le sommet, en cases : côté, hauteur, et son toit (pyramide). */
  tour?: { cote: number; haut: number; pierre: Couleur; toit: Couleur };
}

/** Un cône (un volcan, un pic) : de `rayon` à la base à `cratere` au sommet (0 : une pointe). */
export interface Cone extends Place {
  genre: 'cone';
  haut: number;
  rayon: number;
  cratere: number;
  pans: number;
  couleur: Couleur;
  sommet?: Couleur;
}

export type PieceDuLointain = RangDeCretes | MasseEnGradins | Cone;

/** Le lointain d'un archipel : ses pièces, et une graine pour leurs irrégularités. */
export interface Lointain {
  graine: string;
  pieces: PieceDuLointain[];
}

/** L'étendue de l'archipel, en cases (`worldBounds`). */
export interface Etendue {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/** Le sommet d'une masse en gradins, en part du rayon de sa base : au moins la moitié (un sommet plat, pas une pointe). */
export const SOMMET_DES_GRADINS = 0.55;

/** Le pied des pièces : sous l'eau, pour qu'aucune ne flotte. */
const PIED = NIVEAU_EAU - 1;

const lin = (c: Couleur): RGB => rgb(c).map((v) => lineaire(v / 255)) as RGB;

/**
 * La peinture du lointain : sa couleur, un peu plus claire sur les dessus, plus sombre au pied (la mer), et la couleur
 * du sommet au-dessus de `seuil` (en blocs). Peu de nuance : la brume de profondeur fait le reste.
 */
function peinture(couleur: Couleur, sommet: Couleur | undefined, seuil: number): Peindre {
  const bas = lin(couleur);
  const haut = sommet === undefined ? bas : lin(sommet);
  return (p, n) => {
    const k = (0.86 + 0.14 * clamp(p[1] / Math.max(1, seuil), 0, 1)) * (0.92 + 0.08 * clamp(n[1], 0, 1));
    const c = p[1] >= seuil - 1e-6 ? haut : bas;
    return [c[0] * k, c[1] * k, c[2] * k];
  };
}

/** Le soleil, normé : les versants qui s'en détournent prennent l'ombre de la roche (`RangDeCretes.ombre`). */
const SOLEIL = (() => {
  const l = Math.hypot(...SOLEIL_DIRECTION);
  return SOLEIL_DIRECTION.map((v) => v / l) as [number, number, number];
})();

/** Une peinture qui tire vers `ombre` sur les faces à l'opposé du soleil (jusqu'à `force`). */
function ombree(peindre: Peindre, ombre: Couleur, force = 0.55): Peindre {
  const o = lin(ombre);
  return (p, n) => {
    const c = peindre(p, n);
    const s = force * clamp((0.35 - (n[0] * SOLEIL[0] + n[1] * SOLEIL[1] + n[2] * SOLEIL[2])) / 0.9, 0, 1);
    return [c[0] + (o[0] - c[0]) * s, c[1] + (o[1] - c[1]) * s, c[2] + (o[2] - c[2]) * s];
  };
}

/**
 * Un polygone convexe coupé par le plan horizontal `y` : la part dessous peinte de `dessous`, la part dessus de `dessus`,
 * chacune en éventail (la limite de la neige franche).
 */
function coupe(P: Pinceau, pts: V3[], y: number, dedans: V3, dessous: Peindre, dessus: Peindre): void {
  const bas: V3[] = [];
  const haut: V3[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    (a[1] < y ? bas : haut).push(a);
    if (a[1] < y !== b[1] < y) {
      const t = (y - a[1]) / (b[1] - a[1]);
      const m: V3 = [a[0] + (b[0] - a[0]) * t, y, a[2] + (b[2] - a[2]) * t];
      bas.push(m);
      haut.push(m);
    }
  }
  for (const [poly, peindre] of [
    [bas, dessous],
    [haut, dessus],
  ] as const)
    for (let i = 1; i + 1 < poly.length; i++) P.triangle(poly[0], poly[i], poly[i + 1], dedans, peindre);
}

/** Le point d'une place : au-dessus de la mer, en repère Three (X = x, Y = hauteur, Z = y). */
function ancre(e: Etendue, p: Place): [number, number] {
  return [e.minX + p.u * (e.maxX - e.minX), e.maxY + p.recul];
}

function cretes(P: Pinceau, e: Etendue, r: RangDeCretes, hasard: () => number): void {
  const [x0, z] = ancre(e, r);
  const x1 = e.minX + r.a * (e.maxX - e.minX);
  // Le profil : des cimes et des cols, de hauteurs irrégulières ; le rang descend dans la mer à ses deux bouts.
  const n = r.cimes * 2 + 1;
  const profil: { x: number; y: number; dz: number }[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const bout = i === 0 || i === n;
    const cime = i % 2 === 1;
    const h = bout ? PIED : cime ? r.haut * (0.7 + 0.3 * hasard()) : r.haut * (0.35 + 0.2 * hasard());
    profil.push({ x: x0 + (x1 - x0) * (t + (bout ? 0 : (hasard() - 0.5) * 0.4 / n)), y: h, dz: (hasard() - 0.5) * r.epaisseur * 0.3 });
  }
  const seuil = r.haut * (r.neige ?? 1.01);
  const avecOmbre = (p: Peindre) => (r.ombre === undefined ? p : ombree(p, r.ombre));
  const peindre = avecOmbre(peinture(r.couleur, r.sommet, seuil));
  const roche = avecOmbre(peinture(r.couleur, undefined, seuil));
  const neige = peinture(r.sommet ?? r.couleur, undefined, seuil);
  const avant = z - r.epaisseur / 2;
  const arriere = z + r.epaisseur / 2;
  for (let i = 0; i < n; i++) {
    const a = profil[i];
    const b = profil[i + 1];
    const ca: V3 = [a.x, a.y, z + a.dz];
    const cb: V3 = [b.x, b.y, z + b.dz];
    const dedans: V3 = [(a.x + b.x) / 2, PIED, z];
    // Le versant avant, que voit la caméra, et le versant arrière (vu en voyage, de côté).
    if (r.neigeFranche) {
      coupe(P, [[a.x, PIED, avant], [b.x, PIED, avant], cb, ca], seuil, dedans, roche, neige);
      coupe(P, [[a.x, PIED, arriere], [b.x, PIED, arriere], cb, ca], seuil, dedans, roche, neige);
      continue;
    }
    P.quad([a.x, PIED, avant], [b.x, PIED, avant], cb, ca, dedans, peindre);
    P.quad([a.x, PIED, arriere], [b.x, PIED, arriere], cb, ca, dedans, peindre);
  }
}

function gradins(P: Pinceau, e: Etendue, m: MasseEnGradins, hasard: () => number): void {
  const [cx, cz] = ancre(e, m);
  const rot = hasard() * Math.PI * 2;
  // Chaque pan a son rayon, et chaque marche ne recule que sur certains pans : des falaises droites d'un côté, des
  // gradins de l'autre, des verticales massives et irrégulières, jamais une pièce montée.
  const base = Array.from({ length: m.pans }, () => m.rayon * (0.7 + 0.6 * hasard()));
  const allonge = m.allonge ?? 1;
  let rayons = [...base];
  const marches = Math.max(1, Math.round(m.haut / m.marche));
  const peindre = peinture(m.couleur, m.sommet, m.haut);
  // Le retrait de chaque marche, borné pour que le sommet garde plus de la moitié de la base : une masse aux flancs
  // presque droits, jamais une pointe en obus.
  const retrait = Math.min(m.retrait * 1.6, (m.rayon * (1 - SOMMET_DES_GRADINS) * 1.6) / Math.max(1, marches - 1));
  const anneau = (y: number, r: number[]): V3[] =>
    r.map((rayon, i) => {
      const a = rot + (i / m.pans) * Math.PI * 2;
      return [cx + allonge * rayon * Math.cos(a), y, cz + rayon * Math.sin(a)];
    });
  let y0 = PIED;
  for (let s = 0; s < marches; s++) {
    const y1 = s === marches - 1 ? m.haut : Math.min(m.haut - 1, (m.haut * (s + 1)) / marches + (hasard() - 0.5) * m.marche * 0.5);
    const bas = anneau(y0, rayons);
    const haut = anneau(y1, rayons);
    const dedans: V3 = [cx, (y0 + y1) / 2, cz];
    for (let i = 0; i < m.pans; i++) {
      const j = (i + 1) % m.pans;
      P.quad(bas[i], bas[j], haut[j], haut[i], dedans, peindre);
    }
    if (s < marches - 1) {
      // Le replat de la marche : certains pans reculent, d'autres restent à l'aplomb.
      const suivants = rayons.map((r, i) => (hasard() < 0.45 ? r : Math.max(base[i] * SOMMET_DES_GRADINS, r - retrait * (0.5 + hasard()))));
      const dedansReplat: V3 = [cx, y1 - 1, cz];
      const suivant = anneau(y1, suivants);
      for (let i = 0; i < m.pans; i++) {
        const j = (i + 1) % m.pans;
        P.quad(haut[i], haut[j], suivant[j], suivant[i], dedansReplat, peindre);
      }
      rayons = suivants;
    } else {
      // Le sommet plat.
      for (let i = 1; i + 1 < m.pans; i++) P.triangle(haut[0], haut[i], haut[i + 1], [cx, y1 - 1, cz], peindre);
    }
    y0 = y1;
  }
  if (m.tour) {
    const t = m.tour;
    const c = t.cote / 2;
    const y1 = m.haut + t.haut;
    const pierre = peinture(t.pierre, undefined, y1 + 1);
    const dedans: V3 = [cx, m.haut + t.haut / 2, cz];
    const coin = (y: number, k: number, s: number): V3 => [cx + s * Math.cos(rot + (k * Math.PI) / 2), y, cz + s * Math.sin(rot + (k * Math.PI) / 2)];
    const r2 = c * Math.SQRT2;
    for (let k = 0; k < 4; k++) P.quad(coin(m.haut - 0.5, k, r2), coin(m.haut - 0.5, k + 1, r2), coin(y1, k + 1, r2), coin(y1, k, r2), dedans, pierre);
    const toit = peinture(t.toit, undefined, y1 + 99);
    const pointe: V3 = [cx, y1 + t.cote * 0.8, cz];
    for (let k = 0; k < 4; k++) P.triangle(coin(y1, k, r2 * 1.1), coin(y1, k + 1, r2 * 1.1), pointe, [cx, y1, cz], toit);
  }
}

function cone(P: Pinceau, e: Etendue, c: Cone, hasard: () => number): void {
  const [cx, cz] = ancre(e, c);
  const rot = hasard() * Math.PI * 2;
  const peindre = peinture(c.couleur, c.sommet, c.haut * 0.8);
  const bas: V3[] = [];
  const mi: V3[] = [];
  const haut: V3[] = [];
  const ym = c.haut * 0.8;
  const rm = c.cratere + (c.rayon - c.cratere) * 0.2;
  for (let i = 0; i < c.pans; i++) {
    const a = rot + (i / c.pans) * Math.PI * 2;
    const k = 0.85 + 0.3 * hasard();
    bas.push([cx + c.rayon * k * Math.cos(a), PIED, cz + c.rayon * k * Math.sin(a)]);
    mi.push([cx + rm * k * Math.cos(a), ym, cz + rm * k * Math.sin(a)]);
    haut.push([cx + c.cratere * Math.cos(a), c.haut, cz + c.cratere * Math.sin(a)]);
  }
  const dedans: V3 = [cx, c.haut * 0.3, cz];
  for (let i = 0; i < c.pans; i++) {
    const j = (i + 1) % c.pans;
    P.quad(bas[i], bas[j], mi[j], mi[i], dedans, peindre);
    if (c.cratere > 1e-6) P.quad(mi[i], mi[j], haut[j], haut[i], dedans, peindre);
    else P.triangle(mi[i], mi[j], [cx, c.haut, cz], dedans, peindre);
  }
  if (c.cratere > 1e-6) for (let i = 1; i + 1 < c.pans; i++) P.triangle(haut[0], haut[i], haut[i + 1], [cx, c.haut - 1, cz], peindre);
}

/** Dessine le lointain d'un archipel avec le pinceau du décor, ses triangles sans élément (`SANS_ELEMENT`). */
export function dessinerLointain(P: Pinceau, e: Etendue, l: Lointain): void {
  const avant = P.element;
  P.element = SANS_ELEMENT;
  l.pieces.forEach((p, i) => {
    const hasard = hasardDe(`${l.graine}/${i}`);
    if (p.genre === 'cretes') cretes(P, e, p, hasard);
    else if (p.genre === 'gradins') gradins(P, e, p, hasard);
    else cone(P, e, p, hasard);
  });
  P.element = avant;
}
