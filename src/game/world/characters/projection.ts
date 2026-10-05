// La projection d'un personnage en facettes sur une petite grille (lot R6) : ce que l'on voit d'une créature à distance,
// quelques dizaines de pixels de haut. Code pur, sans Three.js : les tests s'en servent pour vérifier que deux créatures
// d'un même archipel ne se confondent pas en silhouette (noire, à 40 pixels), et quelle couleur se lit d'abord.
// Projection orthographique, vue de face (depuis −Z) ou tournée de `angle` autour de Y (trois quarts : 0,6).
import { TAILLE_DE_CREATURE } from './template';
import type { FacettesDePersonnage } from './painted';

export interface Projection {
  largeur: number;
  hauteur: number;
  /** Pour chaque pixel (ligne par ligne, du haut), le triangle vu devant (−1 : rien). */
  triangle: Int32Array;
}

export interface OptionsDeProjection {
  /** La rotation du personnage autour de Y, en radians (0 : de face). */
  angle?: number;
  /** La taille d'un pixel, en blocs : par défaut, le gabarit standard fait 40 pixels de haut. */
  pas?: number;
  /** La demi-largeur et la hauteur de la grille, en blocs (les pieds en bas, au milieu). */
  demiLargeur?: number;
  haut?: number;
}

/** Le pas qui donne 40 pixels au gabarit standard (2,6 blocs). */
export const PAS_A_40_PIXELS = TAILLE_DE_CREATURE / 40;

/** Projette un personnage : chaque pixel garde le triangle le plus proche (tampon de profondeur). */
export function projeter(f: FacettesDePersonnage, o: OptionsDeProjection = {}): Projection {
  const pas = o.pas ?? PAS_A_40_PIXELS;
  const demi = o.demiLargeur ?? 1.4;
  const haut = o.haut ?? 3.3;
  const largeur = Math.ceil((2 * demi) / pas);
  const hauteur = Math.ceil(haut / pas);
  const triangle = new Int32Array(largeur * hauteur).fill(-1);
  const profondeur = new Float32Array(largeur * hauteur).fill(Infinity);
  const [c, s] = [Math.cos(o.angle ?? 0), Math.sin(o.angle ?? 0)];
  const n = f.positions.length / 9;
  const px = new Float64Array(3);
  const py = new Float64Array(3);
  const pz = new Float64Array(3);
  for (let t = 0; t < n; t++) {
    for (let k = 0; k < 3; k++) {
      const i = t * 9 + k * 3;
      const [x, y, z] = [f.positions[i], f.positions[i + 1], f.positions[i + 2]];
      // Rotation autour de Y, puis la grille : colonnes de gauche à droite, lignes du haut.
      px[k] = (x * c + z * s + demi) / pas;
      py[k] = (haut - y) / pas;
      pz[k] = -x * s + z * c;
    }
    const aire = (px[1] - px[0]) * (py[2] - py[0]) - (px[2] - px[0]) * (py[1] - py[0]);
    if (Math.abs(aire) < 1e-12) continue;
    const i0 = Math.max(0, Math.floor(Math.min(px[0], px[1], px[2])));
    const i1 = Math.min(largeur - 1, Math.ceil(Math.max(px[0], px[1], px[2])));
    const j0 = Math.max(0, Math.floor(Math.min(py[0], py[1], py[2])));
    const j1 = Math.min(hauteur - 1, Math.ceil(Math.max(py[0], py[1], py[2])));
    for (let j = j0; j <= j1; j++)
      for (let i = i0; i <= i1; i++) {
        const [qx, qy] = [i + 0.5, j + 0.5];
        const w0 = ((px[1] - qx) * (py[2] - qy) - (px[2] - qx) * (py[1] - qy)) / aire;
        const w1 = ((px[2] - qx) * (py[0] - qy) - (px[0] - qx) * (py[2] - qy)) / aire;
        const w2 = 1 - w0 - w1;
        if (w0 < 0 || w1 < 0 || w2 < 0) continue;
        const z = w0 * pz[0] + w1 * pz[1] + w2 * pz[2];
        const p = j * largeur + i;
        if (z < profondeur[p]) {
          profondeur[p] = z;
          triangle[p] = t;
        }
      }
  }
  return { largeur, hauteur, triangle };
}

/** La part commune de deux silhouettes (intersection sur union) : 1, la même ; 0, rien en commun. */
export function recouvrement(a: Projection, b: Projection): number {
  if (a.largeur !== b.largeur || a.hauteur !== b.hauteur) throw new Error('Deux grilles différentes');
  let inter = 0;
  let union = 0;
  for (let p = 0; p < a.triangle.length; p++) {
    const [x, y] = [a.triangle[p] >= 0, b.triangle[p] >= 0];
    if (x && y) inter++;
    if (x || y) union++;
  }
  return union ? inter / union : 1;
}

/** Le nombre de pixels couverts, en tout et par triangle qui vérifie `pred`. */
export function pixels(p: Projection, pred: (t: number) => boolean = () => true): number {
  let n = 0;
  for (const t of p.triangle) if (t >= 0 && pred(t)) n++;
  return n;
}
