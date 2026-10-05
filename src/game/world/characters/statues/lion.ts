// Le Lion de pierre, Gardien de la Baie des mots (6e) : le seul Gardien tiré d'un modèle importé, et non dessiné par le
// code. Le concept validé (essai 5) a été mis en volume par TRELLIS.2 puis réduit à 700 et 1 500 triangles (fiche :
// docs/univers/archipeo/modele-lion-de-pierre.md) ; ./lionData.ts en garde les données pures, produites par
// scripts/rendu/lion-de-pierre/convertir.mjs (npm run rendu:lion). Ici, le modèle devient une statue comme les autres : pierre, lichen en taches,
// orbites qui ne s'allument jamais, et la crinière qui se rallume, huit veines d'or serties de sombre.
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
 * Sur quoi le Lion se couche : la dalle de son concept, qui sert de quai, sans socle commun (proposition du directeur
 * artistique, à trancher par le mainteneur), ou le socle octogonal commun et sa flamme, le Lion et sa dalle réduits pour
 * y tenir. Changer cette constante suffit.
 */
export type QuaiDuLion = 'dalle' | 'socle';
export const QUAI_DU_LION = 'dalle' as QuaiDuLion;

/**
 * Sur le socle commun : le Lion réduit (sa dalle tient sur l'octogone) et reculé derrière le foyer, pour que la flamme
 * reste devant ses pattes.
 */
const SUR_LE_SOCLE = { echelle: 0.32, recul: 0.35 } as const;

/**
 * Les veines : la largeur de l'or et celle de son serti, en blocs du modèle, et leur hauteur au-dessus de la pierre.
 * Le serti, sombre, déborde de chaque côté de l'or : c'est sur lui que l'or se lit (plus de 3:1 en niveaux de gris).
 */
export const VEINE_DU_LION = { or: 0.1, serti: 0.22, hauteurDuSerti: 0.03, hauteurDeLOr: 0.055, pointe: 0.45 } as const;

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

/** Le Lion lui-même : chaque triangle du modèle, de pierre, de lichen ou d'orbite, puis le serti de ses veines. */
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
  for (const v of m.veines) ruban(L, v, VEINE_DU_LION.serti * a.veines, VEINE_DU_LION.hauteurDuSerti, a.serti);
}

/** Les veines d'or, sur le serti, de la racine vers la pointe des mèches. */
function veinesDuLion(T: Trace, a: Atelier): void {
  const L = repereDuLion(T);
  for (const v of modeleDuLion(a.ou).veines) ruban(L, v, VEINE_DU_LION.or * a.veines, VEINE_DU_LION.hauteurDeLOr, a.lueur);
}

/**
 * Un ruban plié à cheval sur la crête d'une mèche, arête par arête, de la racine à la pointe : sur chacune des deux
 * facettes de l'arête, une bande de `largeur / 2` qui entre dans la facette, levée de `hauteur` ; affiné vers la pointe.
 */
function ruban(T: Trace, aretes: readonly number[], largeur: number, hauteur: number, pe: Peindre): void {
  const n = aretes.length / 18;
  const v = (i: number, k: number): V3 => [aretes[i * 18 + k] / 1000, aretes[i * 18 + k + 1] / 1000, aretes[i * 18 + k + 2] / 1000];
  const longueurs = Array.from({ length: n }, (_, i) => Math.hypot(...sub(v(i, 3), v(i, 0))));
  const total = longueurs.reduce((s, l) => s + l, 0);
  const demi = (fait: number) => (largeur / 2) * (1 - (1 - VEINE_DU_LION.pointe) * (fait / total));
  let fait = 0;
  for (let i = 0; i < n; i++) {
    const [A, B] = [v(i, 0), v(i, 3)];
    const [wa, wb] = [demi(fait), demi(fait + longueurs[i])];
    for (const k of [6, 12]) {
      const [d, m] = [v(i, k), v(i, k + 3)];
      const leve = (p: V3, w: number): V3 => [p[0] + m[0] * hauteur + d[0] * w, p[1] + m[1] * hauteur + d[1] * w, p[2] + m[2] * hauteur + d[2] * w];
      const dedans: V3 = [(A[0] + B[0]) / 2 - m[0], (A[1] + B[1]) / 2 - m[1], (A[2] + B[2]) / 2 - m[2]];
      T.quad(leve(A, 0), leve(B, 0), leve(B, wb), leve(A, wa), dedans, pe);
    }
    fait += longueurs[i];
  }
}

/** Le Lion de pierre, Gardien de la Baie des mots. */
export const LION_DE_PIERRE: Statue = {
  nom: 'le Lion de pierre',
  allume: 'la crinière : huit veines d’or, de la racine vers la pointe des mèches',
  socle: QUAI_DU_LION === 'socle',
  grosPlan: true,
  sculpture: sculptureDuLion,
  veines: veinesDuLion,
};
