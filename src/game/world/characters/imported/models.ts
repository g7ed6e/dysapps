// Les personnages d'Archipéo importés : les modèles faits par TRELLIS.2 et retravaillés dans Blender (le fil des
// personnages, docs/univers/archipeo/personnages/modeles.md), en deux versions : de près (environ 1 500 triangles) et de
// loin (environ 200). Code pur, sans DOM : le registre des noms, et la mise au format des personnages dessinés en code
// (`FacettesDePersonnage`), pour que le monde, le défi, les fiches et le budget les lisent comme les autres. Ce qui
// charge les fichiers est à part (../../../importedCharacters.ts, et le disque pour les tests : ./fromDisk.testing.ts).
//
// Un modèle importé remplace celui dessiné en code tant qu'il est chargé ; sinon (pas encore chargé, réseau coupé,
// archipel sans modèle), le dessiné en code reste.
import type { BiomeId } from '../../../biomes';
import { lineaire } from '../../landMesh';
import { rgb } from '../../decor/brush';
import { clamp } from '../../../../core/math';
import type { Couleur } from '../../palette';
import { SENTINELLE } from '../colors';
import { NUANCE, type FacettesDePersonnage, type V3 } from '../painted';
import { couleursAllumees, DEMI_LARGEUR_DE_SENTINELLE, HAUT_DU_SOCLE, HAUTEUR_DE_SENTINELLE, socleSeul } from '../sentinel';
import { ESPECES_6E } from '../species/6e';
import { ESPECES_5E } from '../species/5e';
import { tailleDe, type Espece } from '../template';
import type { ModeleLu } from './glb';

export type Genre = 'gardien' | 'creature';
/** De près (le défi, les fiches, l'île que la caméra regarde) ou de loin (le reste de l'archipel). */
export type Niveau = 'pres' | 'loin';

/** Le fichier de chaque version, dans le dossier d'un modèle (docs/univers/archipeo/personnages/modeles/<nom>/). */
export const FICHIER: Record<Niveau, string> = { pres: 'final-1500.glb', loin: 'final-200.glb' };

/**
 * Le lieu de chaque île qui a ses modèles, les noms de son Gardien et de sa créature (comme ceux des dossiers des
 * modèles ; pas de créature : la sienne reste dessinée en code), et de combien de quarts de tour chacun se tourne pour
 * faire face à l'élève (relevé sur les modèles, vus des quatre côtés).
 */
type Ligne = [lieu: string, gardien: string, creature: string | null, quartsDuGardien: number, quartsDeLaCreature: number];

const SIXIEME: Partial<Record<BiomeId, Ligne>> = {
  'french-6e-phonology': ['foret', 'grand-chene', 'mousso', 0, 1],
  'french-6e-letter-confusion': ['mine', 'golem-de-roche', 'tunel', 1, 0],
  'french-6e-word-spelling': ['carriere', 'dune-vivante', 'rouxel', 1, 1],
  'french-6e-grammar-spelling': ['ferme', 'taureau-de-terre', 'bloquette', 0, 3],
  'french-6e-reading': ['tour', 'chouette-de-verre', 'grimoire', 0, 0],
  'maths-6e-calculation': ['plaine', 'hanneton-de-bronze', 'coco', 0, 3],
  'maths-6e-fractions': ['riviere', 'brochet-d-argent', 'nenu', 0, 3],
  'maths-6e-decimals': ['volcan', 'dragon-de-cendre', 'lavi', 0, 0],
  'english-6e-vocabulary': ['baie', 'lion-de-pierre', 'robin', 0, 0],
  'english-6e-grammar': ['horloge', 'coucou-de-bronze', 'tick', 1, 1],
  'history-6e-antiquity': ['fouille', 'amphore-peinte', 'silex', 0, 3],
  'geography-6e-living': ['pointe', 'castor-de-glaise', 'boussole', 0, 1],
  'life-earth-sciences-6e-living-world': ['vallee', 'cerf-des-sous-bois', 'fougere', 0, 0],
  'physics-chemistry-6e-matter-energy': ['laboratoire', 'alambic-de-verre', 'bulle', 0, 1],
  'technology-6e-objects': ['hangar', 'automate-de-laiton', 'pince', 1, 1],
};

/** La 5e. */
const CINQUIEME: Partial<Record<BiomeId, Ligne>> = {
  'maths-5e-signed-numbers': ['glacier', 'mammouth-de-givre', 'frimas', 0, 0],
  'maths-5e-proportionality': ['marche', 'colporteur', 'bazar', 1, 3],
  'french-5e-homophones': ['carrefour', 'sphinx-des-routes', 'sema', 0, 0],
  'french-5e-conjugation': ['marais', 'hydre-des-marais', 'kroa', 1, 2],
  'english-5e-vocabulary': ['comptoir', 'reine-du-marche', 'pudding', 1, 1],
  'english-5e-grammar': ['manoir', 'spectre-du-manoir', 'moustache', 3.5, 1],
  'lv2-5e-introductions': ['relais', 'diligence-de-cuivre', 'lina', 1, 1],
  'history-5e-middle-ages': ['bourg', 'griffon-d-email', 'velin', 2, 1],
  'geography-5e-resources': ['delta', 'libellule-de-jade', 'sillon', 0, 1],
  'life-earth-sciences-5e-active-planet': ['prairie', 'tortue-d-ocre', 'humus', 0, 3],
  'physics-chemistry-5e-matter-universe': ['saline', 'flamant-de-sel', 'perle', 1, 3],
  'technology-5e-design': ['menuiserie', 'cheval-a-bascule', 'rabot', 0, 0],
};

const LIGNES: Partial<Record<BiomeId, [classe: string, ligne: Ligne]>> = Object.fromEntries([
  ...Object.entries(SIXIEME).map(([id, l]) => [id, ['6e', l]]),
  ...Object.entries(CINQUIEME).map(([id, l]) => [id, ['5e', l]]),
]);

/** Le nom du modèle d'un personnage (« 6e-mine-gardien-golem-de-roche »), ou rien si l'île n'en a pas encore. */
export function nomDuModele(genre: Genre, id: BiomeId): string | null {
  const l = LIGNES[id];
  if (!l) return null;
  const [classe, [lieu, gardien, creature]] = l;
  const nom = genre === 'gardien' ? gardien : creature;
  return nom ? `${classe}-${lieu}-${genre}-${nom}` : null;
}

/** Les îles qui ont des modèles importés (un Gardien au moins). */
export const ILES_IMPORTEES = Object.keys(LIGNES) as BiomeId[];

const charges = new Map<string, FacettesDePersonnage>();
const cle = (genre: Genre, id: BiomeId, niveau: Niveau) => `${genre}:${id}:${niveau}`;

/** Le modèle importé d'un personnage, mis au format, s'il est chargé (ne pas modifier les tableaux rendus). */
export function modeleImporte(genre: Genre, id: BiomeId, niveau: Niveau): FacettesDePersonnage | null {
  return charges.get(cle(genre, id, niveau)) ?? null;
}

/** Range un modèle lu (par la vue ou par un test), mis au format du personnage. */
export function enregistrer(genre: Genre, id: BiomeId, niveau: Niveau, lu: ModeleLu): FacettesDePersonnage {
  const quarts = LIGNES[id]?.[1][genre === 'gardien' ? 3 : 4] ?? 0;
  const f = genre === 'gardien' ? sentinelleImportee(lu, quarts) : creatureImportee(id, lu, quarts, niveau);
  charges.set(cle(genre, id, niveau), f);
  return f;
}

// ---------- La mise au format ----------

/**
 * Tourne le modèle face à l'élève (le visage vers −Z ; un .glb le tourne vers +Z, puis de `quarts` quarts de tour), le
 * centre sur ses pieds et le met à l'échelle `k(hauteur, demi-largeur)`, posé à la hauteur `y0` : ce que devient chaque
 * point du fichier (un sommet, la tête d'un os).
 */
function repere(p: Float32Array, k: (hauteur: number, demiLargeur: number) => number, y0: number, quarts: number): (x: number, y: number, z: number) => V3 {
  let [x0, y1, z0, x1, yh, z1] = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];
  for (let i = 0; i < p.length; i += 3) {
    x0 = Math.min(x0, p[i]);
    x1 = Math.max(x1, p[i]);
    y1 = Math.min(y1, p[i + 1]);
    yh = Math.max(yh, p[i + 1]);
    z0 = Math.min(z0, p[i + 2]);
    z1 = Math.max(z1, p[i + 2]);
  }
  const [cx, cz] = [(x0 + x1) / 2, (z0 + z1) / 2];
  const s = k(yh - y1, Math.max(x1 - x0, z1 - z0) / 2);
  const a = (quarts * Math.PI) / 2;
  const [ca, sa] = [Math.round(Math.cos(a)), Math.round(Math.sin(a))];
  return (px, py, pz) => {
    const [x, z] = [-(px - cx) * s, -(pz - cz) * s];
    return [x * ca + z * sa, (py - y1) * s + y0, -x * sa + z * ca];
  };
}

/** Les sommets du modèle placés (`repere`). */
function placer(p: Float32Array, place: (x: number, y: number, z: number) => V3): Float32Array {
  const out = new Float32Array(p.length);
  for (let i = 0; i < p.length; i += 3) out.set(place(p[i], p[i + 1], p[i + 2]), i);
  return out;
}

/** La normale de chaque triangle, répétée sur ses trois sommets (les modèles sont à facettes plates). */
function normalesPlates(p: Float32Array): Float32Array {
  const n = new Float32Array(p.length);
  for (let i = 0; i < p.length; i += 9) {
    const [ux, uy, uz] = [p[i + 3] - p[i], p[i + 4] - p[i + 1], p[i + 5] - p[i + 2]];
    const [vx, vy, vz] = [p[i + 6] - p[i], p[i + 7] - p[i + 1], p[i + 8] - p[i + 2]];
    let [x, y, z] = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx];
    const l = Math.hypot(x, y, z) || 1;
    [x, y, z] = [x / l, y / l, z / l];
    for (let s = 0; s < 3; s++) n.set([x, y, z], i + s * 3);
  }
  return n;
}

const srgb = (v: number) => (v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055);

/** La couleur de base d'un triangle (0xRRGGBB) : la moyenne de ses sommets, ramenée en sRGB. */
function teinteDu(colors: Float32Array, t: number): Couleur {
  const c = [0, 1, 2].map((j) => Math.round(clamp(srgb((colors[t * 9 + j] + colors[t * 9 + 3 + j] + colors[t * 9 + 6 + j]) / 3), 0, 1) * 255));
  return (c[0] << 16) | (c[1] << 8) | c[2];
}

/** La clarté (de 0 à 1, comme le L de TSL) sous laquelle une couleur de créature vue de loin est remontée. */
const CLARTE_DE_LOIN = 0.42;

/**
 * Une couleur de créature vue de loin, remontée à `CLARTE_DE_LOIN` au moins, sa teinte gardée : petite et loin de la
 * caméra, une créature sombre (brun, vert de mousse, bleu nuit) ne se lit plus que comme une tache noire.
 */
function eclaircie(c: Couleur): Couleur {
  const k = rgb(c).map((v) => v / 255);
  const clarte = (Math.max(...k) + Math.min(...k)) / 2;
  if (clarte >= CLARTE_DE_LOIN) return c;
  // Mélangée vers le blanc, juste assez pour atteindre la clarté voulue (une couleur noire devient un gris moyen).
  const u = (CLARTE_DE_LOIN - clarte) / (1 - clarte);
  const [r, g, b] = k.map((v) => Math.round((v + (1 - v) * u) * 255));
  return (r << 16) | (g << 8) | b;
}

/** Un petit hasard fixe par triangle (le lichen), de 0 à 1. */
const hasard = (t: number) => {
  const x = Math.sin(t * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

/** La part des facettes tournées vers le ciel que le lichen couvre sur un Gardien éteint. */
const LICHEN = 0.45;

/**
 * Un Gardien importé : le socle commun (le modèle a perdu le sien à la coupe), puis la statue, à la hauteur d'une
 * sentinelle (8 blocs, socle compris) et dans ses cinq cases de large ; toute en pierre, avec du lichen sur une partie
 * des facettes tournées vers le ciel, éteinte. Ses lueurs montent des pieds vers la tête (`hauteurs`).
 */
function sentinelleImportee(lu: ModeleLu, quarts: number): FacettesDePersonnage {
  const socle = socleSeul();
  const hauteurUtile = HAUTEUR_DE_SENTINELLE - HAUT_DU_SOCLE;
  const positions = placer(lu.positions, repere(lu.positions, (h, w) => Math.min(hauteurUtile / h, DEMI_LARGEUR_DE_SENTINELLE / w), HAUT_DU_SOCLE, quarts));
  const normals = normalesPlates(positions);
  const n = positions.length / 9;
  const teintes = new Int32Array(n);
  const hauteurs = new Float32Array(socle.teintes.length + n);
  for (let t = 0; t < n; t++) {
    const y = (positions[t * 9 + 1] + positions[t * 9 + 4] + positions[t * 9 + 7]) / 3;
    hauteurs[socle.teintes.length + t] = clamp((y - HAUT_DU_SOCLE) / hauteurUtile, 0, 1);
    teintes[t] = normals[t * 9 + 1] > 0.55 && hasard(t) < LICHEN ? SENTINELLE.lichen : SENTINELLE.pierre;
  }
  const statue = socle.table.length;
  const f: FacettesDePersonnage = {
    positions: concat(socle.positions, positions),
    normals: concat(socle.normals, normals),
    colors: new Float32Array(socle.colors.length + positions.length),
    pieces: Int32Array.from([...socle.pieces, ...new Array<number>(n).fill(statue)]),
    teintes: Int32Array.from([...socle.teintes, ...teintes]),
    table: [...socle.table, { nom: 'sculpture', pivot: [0, HAUT_DU_SOCLE, 0] }],
    // Celle du socle : la pierre et le lichen, et la lueur de son anneau.
    palette: socle.palette,
    hauteurs,
  };
  return { ...f, colors: couleursAllumees(f, 0) };
}

/**
 * Une créature importée, à la taille de son gabarit, ses couleurs (celles du modèle, peint en aplats par
 * scripts/rendu/modeles/aplats.py) nuancées selon la facette comme une créature dessinée en code. Une seule pièce, le
 * corps : elle se promène sans lever le bras. De près, son squelette s'il en a un (scripts/rendu/modeles/squelette.py),
 * placé comme ses sommets : la vue l'anime.
 */
function creatureImportee(id: BiomeId, lu: ModeleLu, quarts: number, niveau: Niveau): FacettesDePersonnage {
  const espece = ({ ...ESPECES_6E, ...ESPECES_5E } as Partial<Record<BiomeId, Espece>>)[id];
  if (!espece) throw new Error(`Pas d’espèce pour ${id}`);
  const taille = tailleDe(espece);
  const place = repere(lu.positions, (h) => taille / h, 0, quarts);
  const positions = placer(lu.positions, place);
  const normals = normalesPlates(positions);
  const n = positions.length / 9;
  const teintes = new Int32Array(n);
  const colors = new Float32Array(positions.length);
  for (let t = 0; t < n; t++) {
    teintes[t] = niveau === 'loin' ? eclaircie(teinteDu(lu.colors, t)) : teinteDu(lu.colors, t);
    const k = rgb(teintes[t]);
    const w = NUANCE[0] + (NUANCE[1] - NUANCE[0]) * clamp(0.5 + 0.5 * normals[t * 9 + 1], 0, 1);
    const c = [lineaire((k[0] / 255) * w), lineaire((k[1] / 255) * w), lineaire((k[2] / 255) * w)];
    for (let s = 0; s < 3; s++) colors.set(c, t * 9 + s * 3);
  }
  return {
    positions,
    normals,
    colors,
    pieces: new Int32Array(n),
    teintes,
    table: [{ nom: 'corps', pivot: [0, 0, 0] }],
    palette: [...new Set(teintes)].map((couleur) => ({ couleur, role: 'dominante' as const })),
    ...(niveau === 'pres' && lu.skin
      ? { skin: { bones: lu.skin.bones.map((b) => ({ name: b.name, parent: b.parent, head: place(...b.head) })), joints: lu.skin.joints, weights: lu.skin.weights } }
      : {}),
  };
}

function concat(a: Float32Array, b: Float32Array): Float32Array {
  const out = new Float32Array(a.length + b.length);
  out.set(a);
  out.set(b, a.length);
  return out;
}
