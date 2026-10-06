// Le Lion de pierre, Gardien de la Baie des mots (6e) : le seul Gardien tiré d'un modèle importé, et non dessiné par le
// code. Le concept validé (essai 5) a été mis en volume par TRELLIS.2 puis réduit à 700 et 1 500 triangles (fiche :
// docs/univers/archipeo/modele-lion-de-pierre.md) ; ./lionData.ts en garde les données pures, produites par
// scripts/rendu/lion-de-pierre/convertir.mjs (npm run rendu:lion). Ici, le modèle devient une statue comme les autres : pierre, lichen en taches,
// orbites qui ne s'allument jamais, et la crinière qui se rallume : quatre veines d'or droites, serties de sombre.
//
// Deux modèles (décision du mainteneur) : 700 triangles dans le monde (la sentinelle de la carte), 1 500 au défi.
// Couché, six blocs de haut dalle comprise (décision du mainteneur du 01/10/2026), le museau vers −Z : la caméra du
// défi, de trois-quarts, le voit comme le concept.
import { pose, type Peindre, type Trace, type V3 } from '../painted';
import { HAUT_DU_SOCLE, type Atelier, type Statue } from '../sentinel';
import { LION_DU_DEFI, LION_DU_MONDE, type ModeleDuLion } from './lionData';


/** La hauteur du Lion, dalle comprise, en blocs du modèle (sous les huit de la hauteur commune). */
export const HAUTEUR_DU_LION = 6;

/**
 * Sur quoi le Lion se couche : la dalle de son concept, qui sert de quai, et la flamme commune devant ses pattes
 * (décision du mainteneur du 06/10/2026), ou le socle octogonal commun et sa flamme, le Lion et sa dalle réduits pour y
 * tenir. Changer cette constante suffit. Les bords de la dalle suivent l'axe nord-sud, dans le monde comme au défi
 * (décision du mainteneur du 06/10/2026) : le modèle n'est jamais tourné.
 */
export type QuaiDuLion = 'dalle' | 'socle';
export const QUAI_DU_LION = 'dalle' as QuaiDuLion;

/** Sur la dalle : le pied de la coupe et de la flamme, au milieu, entre le bord de la dalle et le museau, et leur échelle. */
const FLAMME_SUR_LA_DALLE = { pied: [0, 1.21, -3.88] as V3, echelle: 0.8 };

/**
 * Sur le socle commun : le Lion réduit (sa dalle tient sur l'octogone) et reculé derrière le foyer, pour que la flamme
 * reste devant ses pattes.
 */
const SUR_LE_SOCLE = { echelle: 0.32, recul: 0.35 } as const;

/**
 * Les veines : la largeur de l'or et celle de son serti, en blocs du modèle, leur hauteur au-dessus du segment posé
 * sur la mèche, et la largeur de leur pointe (en part de celle de la racine). Le serti, sombre, déborde de l'or de tous
 * côtés, aux bouts compris : c'est sur lui que l'or se lit (plus de 3:1 en niveaux de gris).
 */
export const VEINE_DU_LION = { or: 0.1, serti: 0.22, hauteurDuSerti: 0.03, hauteurDeLOr: 0.055, pointe: 0.45 } as const;

/**
 * Les veines « légèrement émissives » (directeur artistique, 06/10/2026) : la part de leur allumage qu'elles empruntent
 * à la lueur ; le reste garde l'ombre de leur facette, comme la pierre.
 */
export const LION_VEIN_GLOW = 0.6;

/**
 * Le haut de la dalle, en blocs du modèle : au défi, la caméra ne cadre que ce qui le dépasse, le Lion seul et sa
 * flamme, pour que sa tête se lise (au moins 50 px sur une tablette).
 */
export const LION_SLAB_TOP = 0.8;

/** Le modèle du Lion selon l'endroit où il se montre. */
const modeleDuLion = (ou: Atelier['ou']): ModeleDuLion => (ou === 'defi' ? LION_DU_DEFI : LION_DU_MONDE);

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const croix = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
function unit(a: V3): V3 {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
}
const point = (tab: readonly number[], i: number): V3 => [tab[i * 3] / 1000, tab[i * 3 + 1] / 1000, tab[i * 3 + 2] / 1000];

/** Le repère du Lion : tel quel sur sa dalle, ou réduit et posé sur le socle commun. */
function repereDuLion(T: Trace): Trace {
  if (QUAI_DU_LION === 'dalle') return T;
  const { echelle: e, recul } = SUR_LE_SOCLE;
  return pose(T, (p) => [p[0] * e, HAUT_DU_SOCLE + p[1] * e, recul + p[2] * e]);
}

/**
 * Le Lion lui-même : chaque triangle du modèle, de pierre, de lichen ou d'orbite, puis le serti de ses veines, qui
 * s'assombrit avec leurs lueurs (`degreDuSerti`, ../sentinel.ts).
 */
function sculptureDuLion(T: Trace, a: Atelier): void {
  const m = modeleDuLion(a.ou);
  const L = repereDuLion(T);
  const lichen = new Set(m.lichen);
  const orbites = new Set(m.orbites);
  for (let t = 0; t < m.triangles.length / 3; t++) {
    const [p, q, r] = [0, 1, 2].map((k) => point(m.sommets, m.triangles[t * 3 + k]));
    // Le dedans : derrière la facette, du côté opposé à sa normale (le sens direct du modèle).
    const n = unit(croix(sub(q, p), sub(r, p)));
    const dedans: V3 = [(p[0] + q[0] + r[0]) / 3 - n[0] * 0.1, (p[1] + q[1] + r[1]) / 3 - n[1] * 0.1, (p[2] + q[2] + r[2]) / 3 - n[2] * 0.1];
    L.triangle(p, q, r, dedans, orbites.has(t) ? a.orbite : lichen.has(t) ? a.lichen : a.pierre);
  }
  const { or, serti, hauteurDuSerti } = VEINE_DU_LION;
  for (const v of m.veines) straightVein(L, v, serti * a.veines, hauteurDuSerti, ((serti - or) / 2) * a.veines, a.serti);
}

/** Les veines d'or, sur leur serti, de la racine vers la pointe des mèches. */
function veinesDuLion(T: Trace, a: Atelier): void {
  const L = repereDuLion(T);
  for (const v of modeleDuLion(a.ou).veines) straightVein(L, v, VEINE_DU_LION.or * a.veines, VEINE_DU_LION.hauteurDeLOr, 0, a.lueur);
}

/**
 * Une veine droite, indépendante du maillage : une bande plate de `largeur`, de la racine `A` à la pointe `B` de la
 * mèche, levée de `hauteur` le long de sa normale `n`, affinée vers la pointe et prolongée de `bout` à chaque bout ;
 * sa pointe garde aussi `bout` de chaque côté (le serti déborde ainsi de l'or d'autant, partout). `v` : A, B, n et la
 * direction de la largeur, en millièmes (./lionData.ts).
 */
function straightVein(T: Trace, v: readonly number[], largeur: number, hauteur: number, bout: number, pe: Peindre): void {
  const at = (k: number): V3 => [v[k] / 1000, v[k + 1] / 1000, v[k + 2] / 1000];
  const [A, B, n, w] = [at(0), at(3), at(6), at(9)];
  const d = unit(sub(B, A));
  const [wa, wb] = [largeur / 2, (largeur / 2) * VEINE_DU_LION.pointe + bout * (1 - VEINE_DU_LION.pointe)];
  const coin = (p: V3, le: number, la: number): V3 => [0, 1, 2].map((k) => p[k] + d[k] * le + n[k] * hauteur + w[k] * la) as V3;
  const dedans: V3 = [(A[0] + B[0]) / 2 - n[0], (A[1] + B[1]) / 2 - n[1], (A[2] + B[2]) / 2 - n[2]];
  T.quad(coin(A, -bout, -wa), coin(B, bout, -wb), coin(B, bout, wb), coin(A, -bout, wa), dedans, pe);
}

/** Le Lion de pierre, Gardien de la Baie des mots. */
export const LION_DE_PIERRE: Statue = {
  nom: 'le Lion de pierre',
  allume: 'la crinière : quatre veines d’or, de la racine vers la pointe des mèches',
  socle: QUAI_DU_LION === 'socle',
  ...(QUAI_DU_LION === 'dalle' ? { flamme: FLAMME_SUR_LA_DALLE } : {}),
  grosPlan: true,
  veinGlow: LION_VEIN_GLOW,
  framedAbove: LION_SLAB_TOP,
  sculpture: sculptureDuLion,
  veines: veinesDuLion,
};
