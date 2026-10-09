// Les personnages d'un archipel fusionnés (lot R6) : toutes les créatures en un maillage, tous les Gardiens en
// sentinelles en un autre, et le bonhomme ; un appel de dessin chacun. Code pur, sans Three.js : la vue 3D en fait des
// géométries (une `SkinnedMesh` pour les créatures et le bonhomme, un maillage fixe pour les Gardiens), le budget
// (../budget.ts) en compte les triangles.
//
// Chaque personnage se place depuis la grille d'aujourd'hui : l'emprise de ses cubes au sol reste celle que lisent la
// marche, les promenades et le toucher (../terrain.ts), et le modèle en facettes se centre dessus, les pieds sur le
// haut de sa case, le visage vers −Z (vers l'élève, au sud). Repère de Three.js : le monde (x, y, z) y est (x, z, y).
// La vue pose ensuite chaque os sur le sol à facettes (`piedsSur`) et le fait marcher.
import type { BiomeId } from '../../biomes';
import type { VoxelCube } from '../../Voxel';
import { bonhommePeint } from './avatar';
import { creaturePeinte } from './paintedCreatures';
import { lineaire } from '../landMesh';
import { rgb } from '../decor/brush';
import { LUEUR } from './colors';
export { allumageDuGardien } from './glow';
import { lueursDeNuit, type FacettesDePersonnage, type V3 } from './painted';
import { couleursAllumees, ECHELLE_DANS_LE_MONDE, lueurDuTriangle } from './sentinel';
import { sentinelleDuMonde } from './paintedSentinels';
import type { Niveau } from './imported/models';

/** Ce qu'une fusion lit d'un personnage placé sur la grille (une créature, un Gardien). */
export interface PersonnagePlace {
  id: BiomeId;
  cubes: Pick<VoxelCube, 'x' | 'y' | 'z'>[];
  origin: { x: number; y: number; z: number };
}

/** Un os : ce qu'il porte, son personnage, son parent (−1 : aucun) et sa position de repos dans la scène. */
export interface Os {
  id: BiomeId | 'bonhomme';
  nom: string;
  parent: number;
  pivot: V3;
}

/** Les triangles d'un personnage dans la fusion, de `debut` (compris) à `fin` (exclu). */
interface Plage {
  id: BiomeId;
  debut: number;
  fin: number;
}

/** Une fusion : trois sommets par triangle, dans la scène (ou dans le repère du bonhomme). */
export interface Fusion {
  positions: Float32Array;
  normals: Float32Array;
  /** Couleurs par sommet, dans l'espace linéaire de Three.js. */
  colors: Float32Array;
  plages: Plage[];
}

/** Les créatures d'un archipel : un os pour chacune (son corps), un pour son bras et son outil. */
export interface FusionDesCreatures extends Fusion {
  /** Pour chaque sommet, son os dans `squelette`. */
  os: Uint16Array;
  squelette: Os[];
  /** La boîte de chaque créature (le toucher), dans la scène : [x0, y0, z0, x1, y1, z1]. */
  boites: { id: BiomeId; boite: [number, number, number, number, number, number] }[];
  /**
   * Pour chaque sommet, ce qu'il devient la nuit (quatre nombres) : la couleur de sa lueur, dans l'espace linéaire, et
   * son poids (1 : il brille la nuit ; 0 : il suit la lumière de la scène).
   */
  lueur: Float32Array;
}

/** Les Gardiens d'un archipel en sentinelles : leurs couleurs à un degré d'allumage, et ce qui s'allume. */
export interface FusionDesGardiens extends Fusion {
  /** Pour chaque sommet, 1 s'il est d'une pièce qui s'allume (flamme, veines), sinon 0. */
  lueur: Float32Array;
  /** Le modèle de chaque Gardien, dans l'ordre des plages (de près ou de loin : `couleursDesGardiens` le repeint). */
  modeles: FacettesDePersonnage[];
}

/** Le bonhomme : un os par pièce (tête, corps, bras, jambes), dans son repère (les pieds en 0). */
export interface FusionDuBonhomme extends Fusion {
  os: Uint16Array;
  squelette: Os[];
}

/** Le nombre de triangles d'une fusion. */
export const trianglesDeLaFusion = (f: Fusion): number => f.positions.length / 9;

/**
 * Le point de la scène où se pose un personnage : le milieu de l'emprise de ses cubes (x et y du monde), sur le haut
 * de sa case (z du monde), dans le repère de Three.js.
 */
export function pointDePose(p: PersonnagePlace): V3 {
  let [x0, x1, y0, y1] = [Infinity, -Infinity, Infinity, -Infinity];
  for (const c of p.cubes) {
    x0 = Math.min(x0, c.x);
    x1 = Math.max(x1, c.x + 1);
    y0 = Math.min(y0, c.y);
    y1 = Math.max(y1, c.y + 1);
  }
  if (!p.cubes.length) [x0, x1, y0, y1] = [0, 1, 0, 1];
  return [p.origin.x + (x0 + x1) / 2, p.origin.z, p.origin.y + (y0 + y1) / 2];
}

/** Copie les triangles d'un modèle dans une fusion, à l'échelle `k`, déplacés de `o`, à partir du triangle `t0`. */
function copier(dans: Fusion, f: FacettesDePersonnage, o: V3, t0: number, k = 1): void {
  const n = f.positions.length;
  const b = t0 * 9;
  for (let i = 0; i < n; i += 3) {
    dans.positions[b + i] = f.positions[i] * k + o[0];
    dans.positions[b + i + 1] = f.positions[i + 1] * k + o[1];
    dans.positions[b + i + 2] = f.positions[i + 2] * k + o[2];
  }
  dans.normals.set(f.normals, b);
  dans.colors.set(f.colors, b);
}

function vide(triangles: number): Fusion {
  return { positions: new Float32Array(triangles * 9), normals: new Float32Array(triangles * 9), colors: new Float32Array(triangles * 9), plages: [] };
}

const ajoute = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

/** Les pièces d'une créature portées par son bras : le bras et son outil (le reste suit le corps). */
const PIECES_DU_BRAS: ReadonlySet<string> = new Set(['bras', 'outil']);

/**
 * Le niveau d'un personnage dans le monde : de près sur l'île où l'on est (`pres`), de loin ailleurs. Seul un modèle
 * importé a deux niveaux (./imported/models.ts) ; un modèle dessiné en code est le même aux deux.
 */
const niveauDans = (id: BiomeId, pres: BiomeId | null): Niveau => (id === pres ? 'pres' : 'loin');

/**
 * Les créatures placées, en un maillage : l'os `2i` porte le corps de la i-ième, l'os `2i + 1` son bras et son outil.
 * `pres` : l'île où l'on est, dont la créature est de près.
 */
export function fusionDesCreatures(places: PersonnagePlace[], pres: BiomeId | null = null): FusionDesCreatures {
  const modeles = places.map((p) => creaturePeinte(p.id, niveauDans(p.id, pres)));
  const total = modeles.reduce((n, f) => n + f.pieces.length, 0);
  const base = vide(total);
  const os = new Uint16Array(total * 3);
  const squelette: Os[] = [];
  const boites: FusionDesCreatures['boites'] = [];
  const lueur = new Float32Array(total * 12);
  let t0 = 0;
  places.forEach((p, i) => {
    const f = modeles[i];
    const o = pointDePose(p);
    copier(base, f, o, t0);
    const bras = f.table.find((q) => q.nom === 'bras');
    squelette.push({ id: p.id, nom: 'corps', parent: -1, pivot: o });
    squelette.push({ id: p.id, nom: 'bras', parent: 2 * i, pivot: ajoute(o, bras?.pivot ?? [0, 0, 0]) });
    const surLeBras = f.table.map((q) => PIECES_DU_BRAS.has(q.nom));
    lueursDeNuit(f).forEach((c, t) => {
      if (c === null) return;
      const k = rgb(c).map((v) => lineaire(v / 255));
      for (let s = 0; s < 3; s++) lueur.set([k[0], k[1], k[2], 1], ((t0 + t) * 3 + s) * 4);
    });
    const b: [number, number, number, number, number, number] = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];
    for (let t = 0; t < f.pieces.length; t++) {
      os.fill(2 * i + (surLeBras[f.pieces[t]] ? 1 : 0), (t0 + t) * 3, (t0 + t + 1) * 3);
      for (let k = 0; k < 9; k++) {
        const v = base.positions[(t0 + t) * 9 + k];
        b[k % 3] = Math.min(b[k % 3], v);
        b[(k % 3) + 3] = Math.max(b[(k % 3) + 3], v);
      }
    }
    boites.push({ id: p.id, boite: b });
    base.plages.push({ id: p.id, debut: t0, fin: t0 + f.pieces.length });
    t0 += f.pieces.length;
  });
  return { ...base, os, squelette, boites, lueur };
}

/**
 * Les Gardiens placés, en sentinelles, en un maillage fixe, éteints (`couleursDesGardiens` donne les autres degrés), à
 * l'échelle du monde (`ECHELLE_DANS_LE_MONDE`, DA-5), les pieds sur leur case. `pres` : l'île où l'on est, dont le
 * Gardien est de près.
 */
export function fusionDesGardiens(places: PersonnagePlace[], pres: BiomeId | null = null): FusionDesGardiens {
  const modeles = places.map((p) => sentinelleDuMonde(p.id, niveauDans(p.id, pres)));
  const total = modeles.reduce((n, f) => n + f.pieces.length, 0);
  const base = vide(total);
  const lueur = new Float32Array(total * 3);
  let t0 = 0;
  places.forEach((p, i) => {
    const f = modeles[i];
    copier(base, f, pointDePose(p), t0, ECHELLE_DANS_LE_MONDE);
    const brille = f.table.map((q) => q.lueur === 'allumage');
    for (let t = 0; t < f.pieces.length; t++) if (brille[f.pieces[t]]) lueur.fill(1, (t0 + t) * 3, (t0 + t + 1) * 3);
    base.plages.push({ id: p.id, debut: t0, fin: t0 + f.pieces.length });
    t0 += f.pieces.length;
  });
  return { ...base, lueur, modeles };
}

/**
 * Les couleurs des Gardiens d'une fusion, chacun à son degré d'allumage (0 : éteint, 1 : rallumé ; 0 s'il n'est pas
 * donné), écrites dans `dans` s'il est donné (l'attribut de couleur de la vue, sans allocation à chaque image). Avec
 * `seul`, seul ce Gardien est repeint (le fondu du rallumage, image par image) : le reste de `dans` ne change pas.
 */
export function couleursDesGardiens(
  f: FusionDesGardiens,
  degres: Partial<Record<BiomeId, number>>,
  dans = new Float32Array(f.colors.length),
  seul?: BiomeId,
): Float32Array {
  f.plages.forEach((p, i) => {
    if (seul && p.id !== seul) return;
    couleursAllumees(f.modeles[i], degres[p.id] ?? 0, dans.subarray(p.debut * 9, p.fin * 9));
  });
  return dans;
}

/**
 * Ce qui brille chez les Gardiens d'une fusion (quatre nombres par sommet, comme `FusionDesCreatures.lueur`) : la
 * flamme et les veines, de la couleur de la lueur, au poids de leur degré d'allumage ; un peu la pierre d'un modèle
 * importé (`lueurDuTriangle`) ; le reste suit la lumière. Avec `seul`, comme pour `couleursDesGardiens`, seule la plage
 * de ce Gardien est réécrite.
 */
export function lueursDesGardiens(
  f: FusionDesGardiens,
  degres: Partial<Record<BiomeId, number>>,
  dans = new Float32Array((f.colors.length / 3) * 4),
  seul?: BiomeId,
): Float32Array {
  const [r, g, b] = rgb(LUEUR).map((v) => lineaire(v / 255));
  f.plages.forEach((p, i) => {
    if (seul && p.id !== seul) return;
    dans.fill(0, p.debut * 12, p.fin * 12);
    const d = Math.min(1, Math.max(0, degres[p.id] ?? 0));
    if (!d) return;
    const m = f.modeles[i];
    for (let t = 0; t < m.pieces.length; t++) {
      const a = lueurDuTriangle(m, t, d);
      if (!a) continue;
      for (let v = (p.debut + t) * 3; v < (p.debut + t + 1) * 3; v++) dans.set([r, g, b, a], v * 4);
    }
  });
  return dans;
}

let bonhomme: FusionDuBonhomme | null = null;

/** Le bonhomme, prêt à fusionner : ses sommets dans son repère, et l'os de chaque sommet (celui de sa pièce). */
export function fusionDuBonhomme(): FusionDuBonhomme {
  if (bonhomme) return bonhomme;
  const f = bonhommePeint();
  const n = f.pieces.length;
  const os = new Uint16Array(n * 3);
  for (let t = 0; t < n; t++) os.fill(f.pieces[t], t * 3, t * 3 + 3);
  bonhomme = {
    positions: f.positions,
    normals: f.normals,
    colors: f.colors,
    plages: [],
    os,
    squelette: f.table.map((q) => ({ id: 'bonhomme', nom: q.nom, parent: -1, pivot: q.pivot })),
  };
  return bonhomme;
}
