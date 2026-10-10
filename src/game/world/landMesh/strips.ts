// Les bandes du sol : des facettes coplanaires d'une même rangée de cases, réunies sans rien changer à l'image.
//
// Une tranche de falaise rectangulaire (même bas et même haut aux deux bouts) et une rampe du dessous (deux hauteurs,
// une par bord) ont une couleur qui ne dépend que de la hauteur du sommet (la nuance d'une paroi et le froid près de
// l'eau suivent la hauteur seule, `nuanceDuSol`) : dans leur plan, la couleur interpolée est la même, que la rangée
// soit coupée en cases ou non. Les cases voisines d'une même rangée, de même plan, qui regardent du même côté, de même
// couleur et de même tampon se réunissent donc en une bande.
//
// Pas de jonction en T (un sommet posé au milieu de l'arête d'une autre facette, qui laisse passer des points de fond au
// rendu) : chaque bord d'une bande garde tous les sommets du maillage qui tombent dessus (le dessus des cases, une
// tranche voisine, le bout d'une autre bande), puis la bande se coupe en triangles en zigzag d'un bord à l'autre.
import type { RGB, V3 } from './polygons';

/** Le bord d'une bande : une ligne horizontale le long de l'axe de la rangée. */
interface BordDeBande {
  /** L'autre coordonnée horizontale (z pour une rangée le long de x, x pour une rangée le long de z). */
  autre: number;
  /** La hauteur. */
  y: number;
}

/** Une case candidate : un quadrilatère plan entre deux bords, d'une unité le long de la rangée. */
export interface CaseDeBande {
  /** L'axe de la rangée, dans le repère Three : 0 (x) ou 2 (z). */
  axe: 0 | 2;
  /** Le début de la case le long de la rangée (entier) ; elle va jusqu'à `debut + 1`. */
  debut: number;
  a: BordDeBande;
  b: BordDeBande;
  /** Ce qui doit être pareil pour réunir deux cases, avec leurs bords et leur direction : la couleur et le tampon. */
  cle: string;
  /** La direction vers laquelle la face regarde. */
  attendue: V3;
  /** L'indice de la colonne de la case. */
  colonne: number;
}

/** Une bande prête à dessiner : les sommets de ses deux bords, dans l'ordre de la rangée. */
export interface Bande {
  axe: 0 | 2;
  bordA: V3[];
  bordB: V3[];
  attendue: V3;
  /** La colonne de la première case (une bande couvre plusieurs colonnes d'une même rangée). */
  colonne: number;
  /** La clé de la bande (sa couleur et son tampon), pour retrouver de quoi la peindre. */
  cle: string;
}

/** La clé d'une coordonnée, à 1e-5 près (les positions déjà posées sont passées par des Float32Array). */
const q = (v: number) => Math.round(v * 1e5);

/** La clé d'une ligne le long d'un axe : l'autre coordonnée horizontale et la hauteur. */
const cleDeLigne = (axe: 0 | 2, autre: number, y: number) => `${axe}|${q(autre)}|${q(y)}`;

/** Le point d'un bord, à une position le long de la rangée. */
function point(axe: 0 | 2, le: number, bord: BordDeBande): V3 {
  return axe === 0 ? [le, bord.y, bord.autre] : [bord.autre, bord.y, le];
}

/**
 * Réunit les cases candidates en bandes : les cases de même plan et de même clé qui se suivent le long de la rangée.
 * `sommets` parcourt tous les autres sommets du maillage (positions x, y, z) : ceux qui tombent sur un bord de bande y
 * restent des sommets.
 */
export function bandesDe(cases: readonly CaseDeBande[], sommets: (visite: (x: number, y: number, z: number) => void) => void): Bande[] {
  // Les rangées : même axe, mêmes bords, même clé.
  const rangees = new Map<string, CaseDeBande[]>();
  for (const c of cases) {
    const k = `${c.cle}#${c.attendue.join(',')}#${cleDeLigne(c.axe, c.a.autre, c.a.y)}#${cleDeLigne(c.axe, c.b.autre, c.b.y)}`;
    const r = rangees.get(k);
    if (r) r.push(c);
    else rangees.set(k, [c]);
  }
  const suites: CaseDeBande[][] = [];
  for (const r of rangees.values()) {
    r.sort((p, s) => p.debut - s.debut);
    let suite: CaseDeBande[] = [];
    for (const c of r) {
      if (suite.length && c.debut !== suite[suite.length - 1].debut + 1) {
        suites.push(suite);
        suite = [];
      }
      // (Deux candidates sur la même case ne se réunissent pas : la seconde reste seule.)
      if (suite.length && c.debut === suite[suite.length - 1].debut) suites.push([c]);
      else suite.push(c);
    }
    if (suite.length) suites.push(suite);
  }
  // Les points de chaque ligne qui porte un bord de bande : les autres sommets du maillage, puis les bouts des bandes,
  // par leur clé, avec leur position exacte le long de la ligne. (Rangées par axe, puis par autre coordonnée, puis par
  // hauteur, en clés numériques : on y passe pour chaque sommet.)
  type Ligne = Map<number, number>;
  const lignes: [Map<number, Map<number, Ligne>>, Map<number, Map<number, Ligne>>] = [new Map(), new Map()];
  const ligne = (axe: 0 | 2, autre: number, y: number, creer: boolean): Ligne | undefined => {
    const parAutre = lignes[axe === 0 ? 0 : 1];
    let parY = parAutre.get(q(autre));
    if (!parY) {
      if (!creer) return undefined;
      parAutre.set(q(autre), (parY = new Map()));
    }
    let s = parY.get(q(y));
    if (!s && creer) parY.set(q(y), (s = new Map()));
    return s;
  };
  for (const s of suites) for (const bord of [s[0].a, s[0].b]) ligne(s[0].axe, bord.autre, bord.y, true);
  const poser = (axe: 0 | 2, autre: number, y: number, le: number) => {
    const l = ligne(axe, autre, y, false);
    if (l && !l.has(q(le))) l.set(q(le), le);
  };
  sommets((x, y, z) => {
    poser(0, z, y, x);
    poser(2, x, y, z);
  });
  for (const s of suites) {
    const c = s[0];
    const fin = s[s.length - 1].debut + 1;
    for (const bord of [c.a, c.b]) {
      poser(c.axe, bord.autre, bord.y, c.debut);
      poser(c.axe, bord.autre, bord.y, fin);
    }
  }
  return suites.map((s) => {
    const c = s[0];
    const debut = c.debut;
    const fin = s[s.length - 1].debut + 1;
    const bord = (b: BordDeBande): V3[] => {
      const dedans = [...(ligne(c.axe, b.autre, b.y, false)?.values() ?? [])].filter((v) => v > debut + 1e-6 && v < fin - 1e-6);
      return [debut, ...dedans.sort((u, v) => u - v), fin].map((le) => point(c.axe, le, b));
    };
    return { axe: c.axe, bordA: bord(c.a), bordB: bord(c.b), attendue: c.attendue, colonne: c.colonne, cle: c.cle };
  });
}

/**
 * Les triangles d'une bande, en zigzag d'un bord à l'autre : autant de triangles que de sommets, moins deux. `couleur`
 * peint un sommet.
 */
export function trianglesDeLaBande(
  bande: Bande,
  couleur: (p: V3) => RGB,
  emettre: (a: V3, b: V3, c: V3, ca: RGB, cb: RGB, cc: RGB) => void,
): void {
  const { axe } = bande;
  const A = bande.bordA;
  const B = bande.bordB;
  const cA = A.map(couleur);
  const cB = B.map(couleur);
  let i = 0;
  let j = 0;
  while (i < A.length - 1 || j < B.length - 1) {
    if (j === B.length - 1 || (i < A.length - 1 && A[i + 1][axe] <= B[j + 1][axe])) {
      emettre(A[i], A[i + 1], B[j], cA[i], cA[i + 1], cB[j]);
      i++;
    } else {
      emettre(A[i], B[j], B[j + 1], cA[i], cB[j], cB[j + 1]);
      j++;
    }
  }
}

/** Une tranche de paroi rectangulaire (même bas et même haut aux deux bouts du côté) : son bas et son haut, ou `null`. */
export function rectangle(tranche: [number, number][]): [number, number] | null {
  if (tranche.length !== 4) return null;
  const bout = (s: number) =>
    tranche
      .filter((p) => p[0] === s)
      .map((p) => p[1])
      .sort((u, v) => u - v);
  const g = bout(0);
  const d = bout(1);
  return g.length === 2 && d.length === 2 && g[0] === d[0] && g[1] === d[1] && g[1] > g[0] ? [g[0], g[1]] : null;
}
