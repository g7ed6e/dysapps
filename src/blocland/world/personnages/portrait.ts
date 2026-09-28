// Le portrait d'un personnage d'Archipéo en polygones plats (lot R6) : ce que dessine le repli sans WebGL de la bulle
// d'une créature et du défi d'un Gardien (../../PersonnageSvg.tsx). Code pur, sans DOM : chaque facette tournée vers
// l'élève, projetée de trois quarts en plongée légère, peinte de sa couleur de jour et d'une lumière fixe, rangée du
// fond vers l'avant (l'algorithme du peintre).
import type { BiomeId } from '../../biomes';
import { clamp } from '../decor/pinceau';
import { creaturePeinte } from './creaturesPeintes';
import type { FacettesDePersonnage } from './peint';
import { couleursAllumees, type Allumage } from './sentinelle';
import { sentinellePeinte } from './sentinellesPeintes';

/** Le modèle d'un personnage montré hors du monde : la créature d'une île, ou son Gardien en sentinelle. */
export const modeleDuPortrait = (kind: 'creature' | 'guardian', id: BiomeId): FacettesDePersonnage => (kind === 'guardian' ? sentinellePeinte(id) : creaturePeinte(id));

export interface OptionsDuPortrait {
  /** La rotation du personnage autour de la verticale, en radians (0 : de face ; par défaut, un trois quarts léger). */
  angle?: number;
  /** La plongée : l'inclinaison de la vue vers le bas, en radians. */
  plongee?: number;
  /** Pour une sentinelle : son degré d'allumage (0 : éteinte, 1 : rallumée), ou celui de sa pierre et de ses lueurs. */
  allumage?: Allumage;
}

export interface Portrait {
  /** Le cadre des polygones, en blocs (y vers le bas, comme en SVG). */
  cadre: { x: number; y: number; largeur: number; hauteur: number };
  /** Les facettes vues, du fond vers l'avant : trois points et une couleur `#rrggbb`. */
  facettes: { points: [number, number][]; couleur: string }[];
}

/** La lumière du portrait : d'en haut, de devant et un peu de la gauche (normalisée). */
const LUMIERE = (() => {
  const l = [-0.35, 0.8, -0.5];
  const n = Math.hypot(l[0], l[1], l[2]);
  return l.map((v) => v / n);
})();

const srgb = (v: number) => (v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055);
const hex = (r: number, g: number, b: number) =>
  `#${[r, g, b]
    .map((v) =>
      Math.round(clamp(v, 0, 1) * 255)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;

/** Le portrait d'un personnage : ses facettes vues, projetées, éclairées d'une lumière fixe et rangées. */
export function portraitDe(f: FacettesDePersonnage, o: OptionsDuPortrait = {}): Portrait {
  const angle = o.angle ?? -0.45;
  const plongee = o.plongee ?? 0.25;
  const couleurs = o.allumage === undefined ? f.colors : couleursAllumees(f, o.allumage);
  const lueurs = new Set(f.palette.filter((p) => p.role === 'lueur').map((p) => p.couleur));
  const [ca, sa, cp, sp] = [Math.cos(angle), Math.sin(angle), Math.cos(plongee), Math.sin(plongee)];
  // Tourne autour de Y, puis penche vers le bas autour de X ; la caméra regarde vers +Z (le visage vers −Z).
  const vue = (x: number, y: number, z: number): [number, number, number] => {
    const x1 = x * ca + z * sa;
    const z1 = -x * sa + z * ca;
    return [x1, y * cp + z1 * sp, -y * sp + z1 * cp];
  };
  const n = f.positions.length / 9;
  const vues: {
    points: [number, number][];
    profondeur: number;
    couleur: string;
  }[] = [];
  let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
  for (let t = 0; t < n; t++) {
    const nv = vue(f.normals[t * 9], f.normals[t * 9 + 1], f.normals[t * 9 + 2]);
    // Une facette qui tourne le dos à l'élève n'est pas vue.
    if (nv[2] >= 0) continue;
    const pts: [number, number][] = [];
    let profondeur = 0;
    for (let k = 0; k < 3; k++) {
      const p = vue(f.positions[t * 9 + k * 3], f.positions[t * 9 + k * 3 + 1], f.positions[t * 9 + k * 3 + 2]);
      // En SVG, x à droite et y vers le bas ; la caméra regarde vers +Z : le +X du modèle est à gauche de l'image.
      pts.push([-p[0], -p[1]]);
      profondeur += p[2] / 3;
      x0 = Math.min(x0, -p[0]);
      x1 = Math.max(x1, -p[0]);
      y0 = Math.min(y0, -p[1]);
      y1 = Math.max(y1, -p[1]);
    }
    const lueur = lueurs.has(f.teintes[t]) && f.table[f.pieces[t]].lueur !== undefined;
    const nx = f.normals[t * 9];
    const ny = f.normals[t * 9 + 1];
    const nz = f.normals[t * 9 + 2];
    const k = lueur ? 1 : 0.62 + 0.45 * Math.max(0, nx * LUMIERE[0] + ny * LUMIERE[1] + nz * LUMIERE[2]);
    const c = t * 9;
    vues.push({
      points: pts,
      profondeur,
      couleur: hex(srgb(couleurs[c]) * k, srgb(couleurs[c + 1]) * k, srgb(couleurs[c + 2]) * k),
    });
  }
  // Du plus loin au plus proche : la plus proche est peinte en dernier.
  vues.sort((a, b) => b.profondeur - a.profondeur);
  if (!vues.length) [x0, y0, x1, y1] = [0, 0, 1, 1];
  return {
    cadre: { x: x0, y: y0, largeur: x1 - x0, hauteur: y1 - y0 },
    facettes: vues.map(({ points, couleur }) => ({ points, couleur })),
  };
}
