// La fumée et la brume d'Archipéo : une seule règle pour toutes les fumées des quatre archipels (le volcan, le
// haut-fourneau, puis les fumées du village et du port en R5), celle de la fiche de famille (docs/conception/
// cadrage-archipeo.md §6, règle 4), construite par le sous-lot R4b-6e. La forme reste celle du lot R4 ; le mouvement,
// la nuit et « Réduire les animations » sont réglés ici, en code pur : la vue 3D (three/decor.ts) ne fait que recopier
// les positions et les couleurs que ces fonctions calculent.
import type { VoxelCube } from '../../Voxel';
import { mixColor } from '../daylight';
import { SMOKE } from '../decor';
import { cielDe, deNuit, luminance, type Couleur, type Faces } from '../palette';
import type { ArchipelagoId } from '../map';
import { clamp, hex, icosaedre, Pinceau, rgb, type FacettesDuDecor, type Peindre, type RGB, type V3 } from './pinceau';
import { lineaire } from '../landMesh';

/** La fumée : chaque volute plus grosse que la précédente de `FUMEE.croissance` (de la première), dérivée sous le vent
 * comme le carré de son rang ; les dernières se fondent dans l'horizon (`FUMEE.fondu`), comme plus transparentes. */
export const FUMEE = { croissance: 0.35, fondu: 0.3, volutes: 3 } as const;

/**
 * Le mouvement de la fumée (DA, 28/09) : chaque volute monte d'une place à la suivante en `periode` secondes (6 s au
 * moins), en grossissant ; la dernière se dissout en rapetissant pendant qu'une nouvelle naît au pied, en `naissance`
 * place. Aucune oscillation : rien ne va et vient plus vite qu'un cycle toutes les 5 s. Le vent est celui du lot R4.
 */
export const MOUVEMENT_DE_LA_FUMEE = { periode: 7, naissance: 0.6 } as const;

/**
 * La nuit (DA, 28/09) : la fumée prend la couleur de nuit (`deNuit`), puis se fond de `fondu` vers l'horizon de nuit ;
 * elle n'est jamais plus claire que la lueur d'horizon (pas de panache blanc sur un ciel sombre).
 */
export const FUMEE_DE_NUIT = { fondu: 0.5 } as const;

/**
 * Le mouvement de la brume (DA, 28/09), pour les nappes des sous-lots qui en ont (5e, 3e) : elles respirent sur
 * `respiration` secondes ou plus, leur opacité varie de ± `opacite` au plus, elles glissent de `glisse` case par seconde
 * au plus (`amplitude` cases de part et d'autre, sur `derive` secondes).
 */
export const MOUVEMENT_DE_LA_BRUME = { respiration: 16, opacite: 0.1, montee: 0.12, amplitude: 0.5, derive: 40, glisse: 0.1 } as const;

/** La couleur de la fumée, claire, à peine ombrée. */
const FACES_DE_FUMEE: Faces = { dessus: mixColor(hex(SMOKE), 0xffffff, 0.35), cote: mixColor(hex(SMOKE), 0x9aa4b0, 0.3) };

/** La fumée de jour, avant son fondu : claire, à peine ombrée (une volute, pas un rocher), en canaux 0..255. */
function ombreDeFumee(n: V3): RGB {
  const dessus = rgb(FACES_DE_FUMEE.dessus);
  const cote = rgb(FACES_DE_FUMEE.cote);
  const w = clamp(0.75 + 0.35 * n[1], 0, 1);
  return [0, 1, 2].map((j) => cote[j] + (dessus[j] - cote[j]) * w) as RGB;
}

/** La fumée de jour du lot R4 : sa couleur fondue de `fondu` vers l'horizon, dans l'espace linéaire. */
function vaporeux(voile: RGB, fondu: number): Peindre {
  return (_, n) => ombreDeFumee(n).map((v, j) => lineaire((v + (voile[j] - v) * fondu) / 255)) as RGB;
}

/** Le fondu d'une volute à la place `s` d'une fumée de `n` volutes : seules les dernières se fondent. */
export function fonduALaPlace(s: number, n: number): number {
  return FUMEE.fondu * clamp((s - (n - 1 - FUMEE.volutes)) / FUMEE.volutes, 0, 1);
}

/** Une fumée : le chemin de ses volutes (une place de plus que de volutes, où la dernière se dissout) et leurs rayons. */
interface Panache {
  chemin: V3[];
  rayons: number[];
  n: number;
  /** Son décalage dans le cycle (tiré du nom de l'élément) : deux fumées ne battent pas ensemble. */
  phase: number;
}

/** Les fumées d'un archipel, dans leur maillage à elles (un appel de dessin), pour qu'elles bougent sans tout redessiner. */
export interface FumeeDuDecor {
  /** La pose immobile du lot R4 (« Réduire les animations »), aux couleurs de jour ; `elements` : la volute du triangle. */
  facettes: FacettesDuDecor;
  /** Pour chaque volute : son panache et son rang. */
  volutes: { panache: number; k: number }[];
  panaches: Panache[];
  /** Pour chaque sommet : son écart au centre de sa volute, en rayons ; sa couleur de jour avant fondu (0..255). */
  unites: Float32Array;
  jour: Float32Array;
  /** L'archipel : son horizon et sa nuit. */
  archipel: ArchipelagoId;
}

/** Ce que les formes remplissent : le pinceau des fumées et leurs panaches. */
export class Fumees {
  readonly P = new Pinceau();
  readonly volutes: { panache: number; k: number; centre: V3; r: number }[] = [];
  readonly panaches: Panache[] = [];

  /** Les facettes et ce qu'il faut pour les animer. */
  fin(archipel: ArchipelagoId): FumeeDuDecor {
    const facettes = this.P.fin();
    const nv = facettes.positions.length / 3;
    const unites = new Float32Array(nv * 3);
    const jour = new Float32Array(nv * 3);
    for (let t = 0; t < facettes.elements.length; t++) {
      const v = this.volutes[facettes.elements[t]];
      const n: V3 = [facettes.normals[9 * t], facettes.normals[9 * t + 1], facettes.normals[9 * t + 2]];
      const c = ombreDeFumee(n);
      for (let s = 3 * t; s < 3 * t + 3; s++) {
        for (let j = 0; j < 3; j++) {
          unites[3 * s + j] = (facettes.positions[3 * s + j] - v.centre[j]) / v.r;
          jour[3 * s + j] = c[j];
        }
      }
    }
    return { facettes, volutes: this.volutes.map(({ panache, k }) => ({ panache, k })), panaches: this.panaches, unites, jour, archipel };
  }
}

/** Les options d'une fumée : le rayon de sa première volute, combien de volutes, le haut du pied (`bas`). */
export interface OptionsDeFumee {
  rayon?: number;
  volutes?: number;
  bas?: number;
}

/**
 * Les volutes d'une fumée, du bas de ses cubes au dernier : le vent, et la montée. Posées comme au lot R4 (leur pose
 * immobile) ; leur mouvement est calculé par `poserLesFumees`.
 */
export function bouffees(F: Fumees, list: VoxelCube[], hasard: () => number, rot: number, horizon: RGB, o: OptionsDeFumee = {}): void {
  if (!list.length) return;
  const tri = [...list].sort((p, q) => p.z - q.z);
  const n = Math.min(tri.length, o.volutes ?? tri.length);
  const [d, f] = [tri[0], tri[tri.length - 1]];
  const k2 = Math.max(1, (tri.length - 1) * (tri.length - 1));
  const vx = (f.x - d.x) / k2;
  const vz = (f.y - d.y) / k2;
  const r0 = o.rayon ?? 0.42;
  const panache = F.panaches.length;
  const chemin: V3[] = [];
  const rayons: number[] = [];
  let y = o.bas ?? d.z + 0.5;
  for (let k = 0; k <= n; k++) {
    const r = r0 * (1 + FUMEE.croissance * k);
    if (k > 0) y += 0.55 * (r + r0 * (1 + FUMEE.croissance * (k - 1)));
    chemin.push([d.x + 0.5 + vx * k * k, y, d.y + 0.5 + vz * k * k]);
    rayons.push(r);
  }
  F.panaches.push({ chemin, rayons, n, phase: hasard() });
  for (let k = 0; k < n; k++) {
    F.P.element = F.volutes.length;
    F.volutes.push({ panache, k, centre: chemin[k], r: rayons[k] });
    icosaedre(F.P, chemin[k], rayons[k], 0.85, 0.16, hasard, vaporeux(horizon, fonduALaPlace(k, n)), rot + k);
  }
}

/** Une courbe douce de 0 à 1 (sans à-coup au départ ni à l'arrivée). */
const doux = (x: number) => {
  const t = clamp(x, 0, 1);
  return t * t * (3 - 2 * t);
};

/**
 * La place de la volute de rang `k` d'une fumée de `n` volutes au temps `t` (en secondes), entre 0 et `n`, avec sa
 * taille (0 à la naissance et à la fin, 1 entre les deux). Immobile (`reduit`) : sa place du lot R4, taille 1.
 */
export function placeDeLaVolute(k: number, n: number, phase: number, t: number, reduit: boolean): { s: number; taille: number } {
  if (reduit) return { s: k, taille: 1 };
  const u = t / MOUVEMENT_DE_LA_FUMEE.periode + phase;
  const s = (((k + u) % n) + n) % n;
  return { s, taille: doux(s / MOUVEMENT_DE_LA_FUMEE.naissance) * doux(n - s) };
}

/**
 * La couleur d'une volute (canaux 0..255 de jour, avant fondu) à un moment du jour (`light` : 0 la nuit, 1 le jour) :
 * fondue vers l'horizon selon sa place ; la nuit, sa couleur de nuit fondue de moitié vers l'horizon de nuit, jamais
 * plus claire que la lueur d'horizon. Dans l'espace linéaire de Three.js.
 */
export function couleurDeFumee(a: ArchipelagoId, jour: Couleur, fondu: number, light: number, out: number[] = [0, 0, 0]): number[] {
  const l = clamp(light, 0, 1);
  const ciel = cielDe(a, l);
  const deJour = mixColor(jour, ciel.horizon, fondu);
  let c = deJour;
  if (l < 1) {
    const nuit = cielDe(a, 0);
    let n = mixColor(mixColor(deNuit(a, deJour), nuit.horizon, FUMEE_DE_NUIT.fondu), nuit.horizon, fondu);
    // Jamais plus claire que la lueur d'horizon de nuit : on l'assombrit vers l'horizon de nuit s'il le faut.
    const plafond = luminance(nuit.lueur);
    for (let i = 0; i < 8 && luminance(n) > plafond; i++) n = mixColor(n, nuit.horizon, 0.5);
    c = mixColor(n, deJour, l);
  }
  out[0] = lineaire(((c >> 16) & 255) / 255);
  out[1] = lineaire(((c >> 8) & 255) / 255);
  out[2] = lineaire((c & 255) / 255);
  return out;
}

/**
 * Les fumées au temps `t`, au moment du jour `light` : les positions et les couleurs de chaque sommet, dans `positions`
 * et `colors` (de la taille de `f.facettes`). Avec « Réduire les animations » (`reduit`), la pose immobile du lot R4,
 * d'un coup, sans fondu de sortie ; seule la nuit change encore leur couleur, comme pour tout le décor.
 */
export function poserLesFumees(f: FumeeDuDecor, t: number, light: number, reduit: boolean, positions: Float32Array, colors: Float32Array): void {
  const places = f.volutes.map(({ panache, k }) => {
    const p = f.panaches[panache];
    const { s, taille } = placeDeLaVolute(k, p.n, p.phase, t, reduit);
    const i = Math.min(Math.floor(s), p.n - 1);
    const w = s - i;
    const [a, b] = [p.chemin[i], p.chemin[i + 1]];
    const centre: V3 = [a[0] + (b[0] - a[0]) * w, a[1] + (b[1] - a[1]) * w, a[2] + (b[2] - a[2]) * w];
    const r = (p.rayons[i] + (p.rayons[i + 1] - p.rayons[i]) * w) * taille;
    return { centre, r, fondu: fonduALaPlace(s, p.n) };
  });
  const tmp = [0, 0, 0];
  const vues = new Map<string, number[]>();
  const els = f.facettes.elements;
  for (let tIdx = 0; tIdx < els.length; tIdx++) {
    const v = places[els[tIdx]];
    for (let s = 3 * tIdx; s < 3 * tIdx + 3; s++) {
      if (reduit) for (let j = 0; j < 3; j++) positions[3 * s + j] = f.facettes.positions[3 * s + j];
      else for (let j = 0; j < 3; j++) positions[3 * s + j] = v.centre[j] + f.unites[3 * s + j] * v.r;
      const jour = (Math.round(f.jour[3 * s]) << 16) | (Math.round(f.jour[3 * s + 1]) << 8) | Math.round(f.jour[3 * s + 2]);
      const cle = `${jour}|${v.fondu.toFixed(3)}`;
      let c = vues.get(cle);
      if (!c) {
        c = couleurDeFumee(f.archipel, jour, v.fondu, light, [...tmp]);
        vues.set(cle, c);
      }
      colors[3 * s] = c[0];
      colors[3 * s + 1] = c[1];
      colors[3 * s + 2] = c[2];
    }
  }
}

/**
 * Une nappe de brume au temps `t` (règle commune ; les sous-lots 5e et 3e la posent) : son décalage en hauteur et en
 * glisse (en cases) et sa part d'opacité (autour de 1). Figée avec « Réduire les animations », d'un coup.
 */
export function respirationDeLaBrume(i: number, t: number, reduit: boolean): { dy: number; dx: number; opacite: number } {
  if (reduit) return { dy: 0, dx: 0, opacite: 1 };
  const M = MOUVEMENT_DE_LA_BRUME;
  const a = (2 * Math.PI * t) / M.respiration + i * 1.7;
  const b = (2 * Math.PI * t) / M.derive + i * 2.3;
  return { dy: M.montee * Math.sin(a), dx: M.amplitude * Math.sin(b), opacite: 1 + M.opacite * Math.sin(a) };
}
